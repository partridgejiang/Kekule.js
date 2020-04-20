/**
 * @fileoverview
 * Operations need to implement an editor.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /widgets/operation/kekule.operations.js
 * requires /core/kekule.structures.js
 * requires /widgets/chem/editor/kekule.chemEditor.baseEditors.js
 * requires /localization/
 */

var Class = require('../../../lan/classes').Class
var ClassEx = require('../../../lan/classes').ClassEx
var DataType = require('../../../lan/classes').DataType
module.exports = function(Kekule){

/**
 * A namespace for operation about normal ChemObject instance.
 * @namespace
 */
Kekule.ChemObjOperation = {};

/**
 * Base operation for ChemObject instance.
 * @class
 * @augments Kekule.Operation
 *
 * @param {Kekule.ChemObject} chemObject Target chem object.
 *
 * @property {Kekule.ChemObject} target Target chem object.
 * @property {Bool} allowCoordBorrow Whether allow borrowing between 2D and 3D when manipulating coords.
 * @property {Kekule.Editor.BaseEditor} The editor object associated.
 */
Kekule.ChemObjOperation.Base = Class.create(Kekule.Operation,
/** @lends Kekule.ChemObjOperation.Base# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemObjOperation.Base',
	/** @constructs */
	initialize: function($super, chemObj, editor)
	{
		$super();
		this.setTarget(chemObj);
		if (editor)
			this.setEditor(editor);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('target', {'dataType': 'Kekule.ChemObject', 'serializable': false});
		this.defineProp('allowCoordBorrow', {'dataType': DataType.BOOL});
		this.defineProp('editor', {'dataType': 'Kekule.Editor.BaseEditor', 'serializable': false});
	},
	moveCurveArrowToMatchChemStructure: function(coord2D) { 
		var curvedArrowNode = this.getTarget();
		var dest = this.getDest();
		var newCoord = Object.assign({}, coord2D)

		// Filter out memory leak eventListeners that were not properly removed.
		if (dest && dest.id && dest.id === curvedArrowNode.anchorObj) {
			var anchorNode = this.getEditor().getChemObj().getObjById(curvedArrowNode.anchorObj)
			// console.log('original coord2D', newCoord);
			
			if (anchorNode.coord2D) {
				// console.log('anchorNode coord2D', anchorNode.coord2D);
				Object.assign(newCoord, anchorNode.coord2D)
			}
			var parent = anchorNode.getParent()
			// Need to check if parent `Kekule.Molecule` has a position of it's own and do math on that to derive location.
			if (parent && parent.coord2D) {
				// console.log('parent coord2D', parent.coord2D);
				newCoord.x += parent.coord2D.x
				newCoord.y += parent.coord2D.y
			}
			// console.log(`moving curved arrow ${curvedArrowNode.id} to match ${anchorNode.id} to location`, newCoord, coord2D);
			var oper = new Kekule.ChemObjOperation.MoveTo(curvedArrowNode, newCoord, Kekule.CoordMode.COORD2D, true, this.getEditor());
			oper.execute();
		}
	},
	getArcNodesFromChemStructObj: function(obj) {
		var attachedArcNodeIds = obj.getAttachedArcNodeIds()
		var glyphNodes = []
		var editor = this.getEditor();
		var srcMol = editor && editor.getChemObj && editor.getChemObj()

		if (srcMol) {
			srcMol.getOwnedObjs().forEach(chemObj => {
				if (chemObj instanceof Kekule.Glyph.Arc) {
					chemObj.getNodes().forEach(glyphNode => {
						if (attachedArcNodeIds[glyphNode.getId()]) {
							glyphNodes.push(glyphNode)
						}
					})
				}
			})
		}

		return glyphNodes
	},
	removeCurveArrowAnchor: function(coord2D) { 
		var target = this.getTarget();
		if (!target.setAnchorObj) {
			var glyphNodes = this.getArcNodesFromChemStructObj(target)
			glyphNodes.forEach(node => {
				this.removeListenersOnCurveArrow(node)
			})
		} else if (target.anchorObj && target.anchorObj.length) {
			this.removeListenersOnCurveArrow(target)
		}
	},
	removeListenersOnCurveArrow: function(arrowNode, toNode)
	{
		if (!toNode) {
			toNode = this.getEditor().getChemObj().getObjById(arrowNode.getAnchorObj())
		}
		if (arrowNode.getAnchorObj() && toNode) {
			delete toNode.getAttachedArcNodeIds()[arrowNode.getId()]
			toNode.removeEventListener('objectMoved', this.moveCurveArrowToMatchChemStructure, this);
		}
		arrowNode.setAnchorObj('');
	},
	// A series of notification method to target object
	/** @private */
	notifyBeforeAddingByEditor: function(obj, parent, refSibling)
	{
		if (obj.beforeAddingByEditor)  // if this special notification method exists, call it first
			obj.beforeAddingByEditor(parent, refSibling);
	},
	/** @private */
	notifyBeforeRemovingByEditor: function(obj, parent)
	{
		if (obj.beforeRemovingByEditor)  // if this special notification method exists, call it first
			obj.beforeRemovingByEditor(parent);
	},
	/** @private */
	notifyBeforeModifyingByEditor: function(obj, propValues)
	{
		if (obj.beforeModifyingByEditor)  // if this special notification method exists, call it first
			obj.beforeModifyingByEditor(propValues);
	},
	/** @private */
	notifyAfterAddingByEditor: function(obj, parent, refSibling)
	{
		if (obj.afterAddingByEditor)  // if this special notification method exists, call it first
			obj.afterAddingByEditor(parent, refSibling);
	},
	/** @private */
	notifyAfterRemovingByEditor: function(obj, parent)
	{
		if (obj.afterRemovingByEditor)  // if this special notification method exists, call it first
			obj.afterRemovingByEditor(parent);
	},
	/** @private */
	notifyAfterModifyingByEditor: function(obj, propValues)
	{
		if (obj.afterModifyingByEditor)  // if this special notification method exists, call it first
			obj.afterModifyingByEditor(propValues);
	}
});

/**
 * Operation of changing a chemObject's properties.
 * @class
 * @augments Kekule.ChemObjOperation.Base
 *
 * @param {Kekule.ChemObject} chemObject Target chem object.
 * @param {Hash} newPropValues A hash of new prop-value map.
 *
 * @property {Hash} newPropValues A hash of new prop-value map.
 */
Kekule.ChemObjOperation.Modify = Class.create(Kekule.ChemObjOperation.Base,
/** @lends Kekule.ChemObjOperation.Modify# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemObjOperation.Modify',
	/** @constructs */
	initialize: function($super, chemObj, newPropValues, editor)
	{
		$super(chemObj, editor);
		if (newPropValues)
			this.setNewPropValues(newPropValues);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('newPropValues', {'dataType': DataType.HASH});
		this.defineProp('oldPropValues', {'dataType': DataType.HASH});  // private
	},
	/** @private */
	doExecute: function()
	{
		var oldValues = {};
		var map = this.getNewPropValues();
		var obj = this.getTarget();
		obj.beginUpdate();
		try
		{
			this.notifyBeforeModifyingByEditor(obj, map);
			for (var prop in map)
			{
				var value = map[prop];
				// store old value first
				oldValues[prop] = obj.getPropValue(prop);
				// set new value
				obj.setPropValue(prop, value);
			}
			this.notifyAfterModifyingByEditor(obj, map);
		}
		finally
		{
			obj.endUpdate();
		}
		this.setOldPropValues(oldValues);
	},
	/** @private */
	doReverse: function()
	{
		var map = this.getOldPropValues();
		var obj = this.getTarget();
		obj.beginUpdate();
		try
		{
			this.notifyBeforeModifyingByEditor(obj, map);
			for (var prop in map)
			{
				var value = map[prop];
				// restore old value
				obj.setPropValue(prop, value);
			}
			this.notifyAfterModifyingByEditor(obj, map);
		}
		finally
		{
			obj.endUpdate();
		}
	}
});

/**
 * Operation of changing a chemObject's coord.
 * @class
 * @augments Kekule.ChemObjOperation.Base
 *
 * @param {Kekule.ChemObject} chemObject Target chem object.
 * @param {Hash} newCoord
 * @param {Int} coordMode
 * @param {Bool} useAbsBaseCoord
 *
 * @property {Hash} newCoord
 * @property {Hash} oldCoord If old coord is not set, this property will be automatically calculated when execute the operation.
 * @property {Int} coordMode
 * @property {Bool} useAbsBaseCoord
 */
Kekule.ChemObjOperation.MoveTo = Class.create(Kekule.ChemObjOperation.Base,
/** @lends Kekule.ChemObjOperation.MoveTo# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemObjOperation.MoveTo',
	/** @constructs */
	initialize: function($super, chemObj, newCoord, coordMode, useAbsBaseCoord, editor)
	{
		$super(chemObj, editor);
		if (newCoord)
			this.setNewCoord(newCoord);
		this.setCoordMode(coordMode || Kekule.CoordMode.COORD2D);
		this.setUseAbsBaseCoord(!!useAbsBaseCoord);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('newCoord', {'dataType': DataType.HASH});
		this.defineProp('oldCoord', {'dataType': DataType.HASH});
		this.defineProp('coordMode', {'dataType': DataType.INT});
		this.defineProp('useAbsBaseCoord', {'dataType': DataType.BOOL});
	},
	/** @private */
	setObjCoord: function(obj, coord, coordMode)
	{
		if (obj && coord && coordMode)
		{
			var success = false;
			if (this.getUseAbsBaseCoord())
			{
				/*
				if (obj.setAbsCoordOfMode)
				{
					obj.setAbsCoordOfMode(coord, coordMode);
					success = true;
				}
				*/
				if (obj.setAbsBaseCoord)
				{
					obj.setAbsBaseCoord(coord, coordMode, this.getAllowCoordBorrow());
					success = true;
				}
			}
			else
			{
				if (obj.setCoordOfMode)
				{
					obj.setCoordOfMode(coord, coordMode);
					success = true;
				}
			}
			if (!success)
			{
				var className = obj.getClassName? obj.getClassName(): (typeof obj);
				Kekule.warn(/*Kekule.ErrorMsg.CAN_NOT_SET_COORD_OF_CLASS*/Kekule.$L('ErrorMsg.CAN_NOT_SET_COORD_OF_CLASS').format(className));
			}
		}
	},
	/** @private */
	getObjCoord: function(obj, coordMode)
	{
		if (this.getUseAbsBaseCoord())
		{
			/*
			if (obj.getAbsCoordOfMode)
				return obj.getAbsCoordOfMode(coordMode, this.getAllowCoordBorrow());
			*/
			if (obj.getAbsBaseCoord)
				return obj.getAbsBaseCoord(coordMode, this.getAllowCoordBorrow());
		}
		else
		{
			if (obj.getCoordOfMode)
				return obj.getCoordOfMode(coordMode, this.getAllowCoordBorrow());
		}

		return null;
	},
	/** @private */
	doExecute: function()
	{
		var obj = this.getTarget();
		// console.log('executing MoveTo on ', obj.CLASS_NAME, obj.id);
		if (!this.getOldCoord())
			this.setOldCoord(this.getObjCoord(obj, this.getCoordMode()));
		if (this.getNewCoord())
			this.setObjCoord(this.getTarget(), this.getNewCoord(), this.getCoordMode());
	},
	/** @private */
	doReverse: function()
	{
		var obj = this.getTarget()
		// console.log(`doing reverse move on ${obj.id}`)
		if (obj instanceof Kekule.Glyph.PathGlyphNode) {
			
		}
		if (this.getOldCoord())
		{
			this.setObjCoord(obj, this.getOldCoord(), this.getCoordMode());
		}
	}
});

/**
 * Operation of changing a chem object's size and coord.
 * @class
 * @augments Kekule.ChemObjOperation.MoveTo
 *
 * @param {Kekule.ChemObject} chemObject Target chem object.
 * @param {Hash} newDimension {width, height}
 * @param {Hash} newCoord
 * @param {Int} coordMode
 * @param {Bool} useAbsCoord
 *
 * @property {Hash} newDimension
 * @property {Hash} oldDimension If old dimension is not set, this property will be automatically calculated when execute the operation.
 */
Kekule.ChemObjOperation.MoveAndResize = Class.create(Kekule.ChemObjOperation.MoveTo,
/** @lends Kekule.ChemObjOperation.MoveAndResize# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemObjOperation.MoveAndResize',
	/** @constructs */
	initialize: function($super, chemObj, newDimension, newCoord, coordMode, useAbsCoord, editor)
	{
		$super(chemObj, newCoord, coordMode, useAbsCoord, editor);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('newDimension', {'dataType': DataType.HASH});
		this.defineProp('oldDimension', {'dataType': DataType.HASH});
	},
	/** @private */
	setObjSize: function(obj, dimension, coordMode)
	{
		if (obj && dimension)
		{
			if (obj.setSizeOfMode)
			{
				obj.setSizeOfMode(dimension, coordMode);
			}
			else
			{
				var className = obj.getClassName? obj.getClassName(): (typeof obj);
				Kekule.warn(/*Kekule.ErrorMsg.CAN_NOT_SET_DIMENSION_OF_CLASS*/Kekule.$L('ErrorMsg.CAN_NOT_SET_DIMENSION_OF_CLASS').format(className));
			}
		}
	},
	/** @private */
	getObjSize: function(obj, coordMode)
	{
		if (obj.getSizeOfMode)
			return obj.getSizeOfMode(coordMode, this.getAllowCoordBorrow());
		else
			return null;
	},
	/** @private */
	doExecute: function($super)
	{
		$super();
		var obj = this.getTarget();
		if (!this.getOldDimension())
		{
			this.setOldDimension(this.getObjSize(obj, this.getCoordMode()));
		}
		if (this.getNewDimension())
			this.setObjSize(this.getTarget(), this.getNewDimension(), this.getCoordMode());
	},
	/** @private */
	doReverse: function($super)
	{
		if (this.getOldDimension())
			this.setObjSize(this.getTarget(), this.getOldDimension(), this.getCoordMode());
		$super();
	}
});

/**
 * Operation of adding a chem object to parent.
 * @class
 * @augments Kekule.ChemObjOperation.Base
 *
 * @param {Kekule.ChemObject} chemObject Target chem object.
 * @param {Kekule.ChemObject} parentObj Object should be added to.
 * @param {Kekule.ChemObject} refSibling If this property is set, chem object will be inserted before this sibling.
 *
 * @property {Kekule.ChemObject} parentObj Object should be added to.
 * @property {Kekule.ChemObject} refSibling If this property is set, chem object will be inserted before this sibling.
 */
Kekule.ChemObjOperation.Add = Class.create(Kekule.ChemObjOperation.Base,
/** @lends Kekule.ChemObjOperation.Add# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemObjOperation.Add',
	/** @constructs */
	initialize: function($super, chemObj, parentObj, refSibling, editor)
	{
		$super(chemObj, editor);
		this.setParentObj(parentObj);
		this.setRefSibling(refSibling);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('parentObj', {'dataType': 'Kekule.ChemObject', 'serializable': false});
		this.defineProp('refSibling', {'dataType': 'Kekule.ChemObject', 'serializable': false});
	},
	/** @private */
	doExecute: function()
	{
		var parent = this.getParentObj();
		var obj = this.getTarget();
		if (parent && obj)
		{
			var sibling = this.getRefSibling() || null;
			this.notifyBeforeAddingByEditor(obj, parent, sibling);
			parent.insertBefore(obj, sibling);
			this.notifyAfterAddingByEditor(obj, parent, sibling);
		}
	},
	/** @private */
	doReverse: function()
	{
		var obj = this.getTarget();
		/*
		var parent = obj.getParent? obj.getParent(): null;
		if (!parent)
			parent = this.getParentObj();
		if (parent !== this.getParentObj())
			console.log('[abnormal!!!!!!!]', parent.getId(), this.getParentObj().getId());
		*/
		var parent = this.getParentObj();
		if (parent && obj)
		{
			var sibling = this.getRefSibling();
			if (!sibling)  // auto calc
			{
				sibling = obj.getNextSibling();
				this.setRefSibling(sibling);
			}
			this.notifyBeforeRemovingByEditor(obj, parent);
			parent.removeChild(obj);
			this.notifyAfterRemovingByEditor(obj, parent);
		}
	}
});

/**
 * Operation of removing a chem object from its parent.
 * @class
 * @augments Kekule.ChemObjOperation.Base
 *
 * @param {Kekule.ChemObject} chemObject Target chem object.
 * @param {Kekule.ChemObject} parentObj Object should be added to.
 * @param {Kekule.ChemObject} refSibling Sibling after target object before removing.
 *
 * @property {Kekule.ChemObject} parentObj Object should be added to.
 * @property {Kekule.ChemObject} refSibling Sibling after target object before removing.
 *   This property is used in reversing the operation. If not set, it will be calculated automatically in execution.
 */
Kekule.ChemObjOperation.Remove = Class.create(Kekule.ChemObjOperation.Base,
/** @lends Kekule.ChemObjOperation.Remove# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemObjOperation.Remove',
	/** @constructs */
	initialize: function($super, chemObj, parentObj, refSibling, editor)
	{
		$super(chemObj, editor);
		this.setParentObj(parentObj);
		this.setRefSibling(refSibling);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('parentObj', {'dataType': 'Kekule.ChemObject', 'serializable': false});
		this.defineProp('ownerObj', {'dataType': 'Kekule.ChemObject', 'serializable': false});
		this.defineProp('refSibling', {'dataType': 'Kekule.ChemObject', 'serializable': false});
		this.defineProp('dest', {'dataType': 'Kekule.ChemStructureNode', 'serializable': false});
		this.defineProp('attachedArcNodeIds', {'dataType': DataType.HASH})
	},

	/** @private */
	_isInEditorSelection: function(obj)
	{
		var editor = this.getEditor();
		return ((editor && editor.getSelection && editor.getSelection()) || []).indexOf(obj) >= 0;
	},

	/** @private */
	doExecute: function()
	{
		var obj = this.getTarget();
		if (obj instanceof Kekule.Glyph.PathGlyphArcConnectorControlNode) {
			if (obj.getParent()) {
				obj = obj.getParent().getParent();
			}
		}
		var parent = this.getParentObj();
		var owner = this.getOwnerObj();
		if (!parent && obj.getParent)
		{
			parent = obj.getParent();
			this.setParentObj(parent);
		}
		if (!owner && obj.getOwner)
		{
			owner = obj.getOwner();
			this.setOwnerObj(owner);
		}
		if (obj instanceof Kekule.Glyph.PathGlyphNode) {
			this.removeListenersOnCurveArrow(obj)
		}
		if (obj instanceof Kekule.Glyph.Arc) {
			obj.nodes.forEach(n => this.removeListenersOnCurveArrow(n))
		}
		if (parent && obj)
		{
			var attachedArcNodeIds = {}
			Object.keys(obj.getAttachedArcNodeIds()).forEach(glyphNodeId => {
				var glyphNodeFromId = this.editor && this.getEditor().getChemObj().getObjById(glyphNodeId)
				if (glyphNodeFromId && glyphNodeFromId.anchorObj === obj.id) {
					attachedArcNodeIds[glyphNodeId] = glyphNodeId
					glyphNodeFromId.setAnchorObj('');
				} 
				obj.removeEventListener('objectMoved', this.moveCurveArrowToMatchChemStructure, this);
			})
			this.setAttachedArcNodeIds(attachedArcNodeIds)
			if (!this.getRefSibling())
			{
				var sibling = obj.getNextSibling? obj.getNextSibling(): null;
				this.setRefSibling(sibling);
			}

			// ensure obj is also removed from editor's selection
			var editor = this.getEditor();
			var needModifySelection = this._isInEditorSelection(obj);
			if (needModifySelection)
				editor.beginUpdateSelection();

			this.notifyBeforeRemovingByEditor(obj, parent);
			parent.removeChild(obj);
			this.notifyAfterRemovingByEditor(obj, parent);

			if (needModifySelection)
			{
				editor.removeFromSelection(obj);
				editor.endUpdateSelection();
			}
		}
	},
	/** @private */
	doReverse: function()
	{
		var parent = this.getParentObj();
		var owner = this.getOwnerObj();
		var obj = this.getTarget();
		if (obj instanceof Kekule.Glyph.PathGlyphNode) {
			this.addEventListenerToAnchorObj(obj)
		}
		if (obj instanceof Kekule.Glyph.Arc) {
			obj.nodes.forEach(n => this.addEventListenerToAnchorObj(n))
		}
		if (parent && obj)
		{
			obj.setAttachedArcNodeIds(this.getAttachedArcNodeIds()) // Reset what the ids were from what is stored in the operation
			var attachedGlyphNodes = this.getArcNodesFromChemStructObj(obj)
			attachedGlyphNodes.forEach(glyphNode => {
				glyphNode.setAnchorObj(obj.getId())
				this.addEventListenerToAnchorObj(glyphNode, obj)
			})
			var sibling = this.getRefSibling();
			if (owner)
				obj.setOwner(owner);
			this.notifyBeforeAddingByEditor(obj, parent, sibling);
			parent.insertBefore(obj, sibling);
			this.notifyAfterAddingByEditor(obj, parent, sibling);
		}
	},
	/** @private */
	addEventListenerToAnchorObj: function(arcNode, toNode)
	{
		if (arcNode.anchorObj) {
			var srcMol = this.getEditor().getChemObj()
			toNode = toNode || srcMol.getObjById(arcNode.anchorObj)
			toNode.addEventListener('objectMoved', this.moveCurveArrowToMatchChemStructure, this);
			return toNode
		}
	}
});

/**
 * A namespace for operation about Chem Structure instance.
 * @namespace
 */
Kekule.ChemStructOperation = {};

/**
 * Operation of adding a chem node to a structure fragment / molecule.
 * @class
 * @augments Kekule.ChemObjOperation.Add
 */
Kekule.ChemStructOperation.AddNode = Class.create(Kekule.ChemObjOperation.Add,
/** @lends Kekule.ChemStructOperation.AddNode# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemStructOperation.AddNode'
});

/**
 * Operation of removing a chem node from a structure fragment / molecule.
 * @class
 * @augments Kekule.ChemObjOperation.Remove
 *
 * @property {Array} linkedConnectors
 */
Kekule.ChemStructOperation.RemoveNode = Class.create(Kekule.ChemObjOperation.Remove,
/** @lends Kekule.ChemStructOperation.RemoveNode# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemStructOperation.RemoveNode',
	/** @private */
	initProperties: function()
	{
		this.defineProp('linkedConnectors', {'dataType': DataType.ARRAY, 'serializable': false});
	},
	/** @private */
	doExecute: function($super)
	{
		if (this.getTarget() instanceof Kekule.ChemMarker.UnbondedElectronSet)
		{
				var parentNode = this.getTarget().getParent();
				if (parentNode)
					parentNode.removeMarker(this.getTarget());
		}
		else
		{
			if (!this.getLinkedConnectors())
			{
				this.setLinkedConnectors(Kekule.ArrayUtils.clone(this.getTarget().getLinkedConnectors()));
			}
			$super();
		}
	},
	/** @private */
	doReverse: function($super)
	{
		$super();
		var linkedConnectors = this.getLinkedConnectors();

		//console.log('reverse node', this.getTarget().getId());
		if (linkedConnectors && linkedConnectors.length)
		{
			//this.getTarget().setLinkedConnectors(linkedConnectors);
			var target = this.getTarget();
			//console.log('reverse append connector', linkedConnectors.length);
			for (var i = 0, l = linkedConnectors.length; i < l; ++i)
			{
				//linkedConnectors[i].appendConnectedObj(target);
				target.appendLinkedConnector(linkedConnectors[i]);
			}
		}
	}
});

/**
 * Operation of replace a chem node with another one.
 * @class
 * @augments Kekule.Operation
 */
Kekule.ChemStructOperation.ReplaceNode = Class.create(Kekule.Operation,
/** @lends Kekule.ChemStructOperation.ReplaceNode# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemStructOperation.ReplaceNode',
	/** @constructs */
	initialize: function($super, oldNode, newNode, parentObj, editor)
	{
		$super();
		this.setOldNode(oldNode);
		this.setNewNode(newNode);
		this.setParentObj(parentObj);
		this.setEditor(editor);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('oldNode', {'dataType': 'Kekule.ChemStructureNode', 'serializable': false});
		this.defineProp('newNode', {'dataType': 'Kekule.ChemStructureNode', 'serializable': false});
		this.defineProp('parentObj', {'dataType': 'Kekule.ChemStructureFragment', 'serializable': false});
		this.defineProp('editor', {'dataType': 'Kekule.Editor.BaseEditor', 'serializable': false});
	},
	/** @private */
	_isInEditorSelection: function(node)
	{
		var editor = this.getEditor();
		return ((editor && editor.getSelection && editor.getSelection()) || []).indexOf(node) >= 0;
	},
	/** @private */
	doExecute: function()
	{
		var oldNode = this.getOldNode();
		var newNode = this.getNewNode();
		if (oldNode && newNode)
		{
			var parent = this.getParentObj();
			if (!parent)
			{
				parent = oldNode.getParent();
				this.setParentObj(parent);
			}
			if (parent.replaceNode)
			{
				var editor = this.getEditor();
				var needModifySelection = this._isInEditorSelection(oldNode);
				if (needModifySelection)
					editor.beginUpdateSelection();
				parent.replaceNode(oldNode, newNode);
				if (needModifySelection)
				{
					editor.removeFromSelection(oldNode);
					editor.addObjToSelection(newNode);
					editor.endUpdateSelection();
				}
			}
		}
	},
	/** @private */
	doReverse: function()
	{
		var oldNode = this.getOldNode();
		var newNode = this.getNewNode();
		if (oldNode && newNode)
		{
			var parent = this.getParentObj() || newNode.getParent();
			if (parent.replaceNode)
			{
				//console.log('reverse!');
				var editor = this.getEditor();
				var needModifySelection = this._isInEditorSelection(newNode);
				if (needModifySelection)
					editor.beginUpdateSelection();
				parent.replaceNode(newNode, oldNode);
				if (needModifySelection)
				{
					editor.removeFromSelection(newNode)
					editor.addObjToSelection(oldNode);
					editor.endUpdateSelection();
				}
			}
		}
	}
});

/**
 * Operation of adding a chem connector to a structure fragment / molecule.
 * @class
 * @augments Kekule.ChemObjOperation.Add
 *
 * @param {Kekule.ChemObject} chemObject Target chem object.
 * @param {Kekule.ChemObject} parentObj Object should be added to.
 * @param {Kekule.ChemObject} refSibling If this property is set, chem object will be inserted before this sibling.
 * @param {Array} connectedObjs Objects that connected by this connector.
 *
 * @property {Array} connectedObjs Objects that connected by this connector.
 */
Kekule.ChemStructOperation.AddConnector = Class.create(Kekule.ChemObjOperation.Add,
/** @lends Kekule.ChemStructOperation.AddConnector# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemStructOperation.AddConnector',
	/** @constructs */
	initialize: function($super, chemObj, parentObj, refSibling, connectedObjs, editor)
	{
		$super(chemObj, parentObj, refSibling, editor);
		//this.setParentObj(parentObj);
		//this.setRefSibling(refSibling);
		this.setConnectedObjs(connectedObjs);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('connectedObjs', {'dataType': DataType.ARRAY, 'serializable': false});
	},
	/** @private */
	doExecute: function($super)
	{
		$super();
		var connObjs = Kekule.ArrayUtils.clone(this.getConnectedObjs());
		if (connObjs && connObjs.length)
		{
			this.getTarget().setConnectedObjs(connObjs);
		}
	},
	/** @private */
	doReverse: function($super)
	{
		$super();
	}
});

/**
 * Operation of removing a chem connector from a structure fragment / molecule.
 * @class
 * @augments Kekule.ChemObjOperation.Remove
 *
 * @property {Array} connectedObjs Objects that connected by this connector.
 *   This property is used in operation reversing. If not set, value will be automatically calculated in operation executing.
 */
Kekule.ChemStructOperation.RemoveConnector = Class.create(Kekule.ChemObjOperation.Remove,
/** @lends Kekule.ChemStructOperation.RemoveConnector# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemStructOperation.RemoveConnector',
	/** @private */
	initProperties: function()
	{
		this.defineProp('connectedObjs', {'dataType': DataType.ARRAY, 'serializable': false});
	},
	/** @private */
	doExecute: function($super)
	{
		if (!this.getConnectedObjs())
		{
			this.setConnectedObjs(Kekule.ArrayUtils.clone(this.getTarget().getConnectedObjs()));
		}
		$super()
	},
	/** @private */
	doReverse: function($super)
	{
		$super();
		var connObjs = this.getConnectedObjs();
		if (connObjs && connObjs.length)
		{
			this.getTarget().setConnectedObjs(connObjs);
		}
	}
});

/**
 * The base operation of merging two nodes as one, acts as the parent class of MergeNodes and MergeNodesPreview.
 * @class
 * @augments Kekule.ChemObjOperation.Base
 *
 * @param {Kekule.ChemStructureNode} target Source node, all connectors to this node will be connected to toNode.
 * @param {Kekule.ChemStructureNode} dest Destination node.
 * @param {Bool} enableStructFragmentMerge If true, molecule will be also merged when merging nodes between different molecule.
 *
 * @property {Kekule.ChemStructureNode} target Source node, all connectors to this node will be connected to toNode.
 * @property {Kekule.ChemStructureNode} dest Destination node.
 * @property {Bool} enableStructFragmentMerge If true, molecule will be also merged when merging nodes between different molecule.
 */
Kekule.ChemStructOperation.MergeNodesBase = Class.create(Kekule.ChemObjOperation.Base,
/** @lends Kekule.ChemStructOperation.MergeNodesBase# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemStructOperation.MergeNodesBase',
	/** @constructs */
	initialize: function($super, target, dest, enableStructFragmentMerge, editor)
	{
		$super(target, editor);
		this.setDest(dest);
		this.setEnableStructFragmentMerge(enableStructFragmentMerge || false);
		this._refSibling = null;
		this._nodeParent = null;
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('dest', {'dataType': 'Kekule.ChemStructureNode', 'serializable': false});
		this.defineProp('enableStructFragmentMerge', {'dataType': DataType.BOOL});
	},
	/**
	 * Returns nodes connected with both node1 and node2.
	 * @param {Kekule.ChemStructureNode} node1
	 * @param {Kekule.ChemStructureNode} node2
	 * @returns {Array}
	 */
	getCommonSiblings: function(node1, node2)
	{
		var siblings1 = (!(node1 instanceof Kekule.ChemMarker.UnbondedElectronSet))? node1.getLinkedObjs() : node1.getParent().getLinkedObjs();
		var siblings2 = (!(node2 instanceof Kekule.ChemMarker.UnbondedElectronSet))? node2.getLinkedObjs() : node2.getParent().getLinkedObjs();
		return Kekule.ArrayUtils.intersect(siblings1, siblings2);
	},
	/** @private */
	doExecute: function()
	{
		// do nothing, descendants should override
	},
	/** @private */
	doReverse: function()
	{
		// do nothing, descendants should override
	}
});

/**
 * Operation of merging two nodes as one.
 * @class
 * @augments Kekule.ChemStructOperation.MergeNodesBase
 *
 * @param {Kekule.ChemStructureNode} target Source node, all connectors to this node will be connected to toNode.
 * @param {Kekule.ChemStructureNode} dest Destination node.
 * @param {Bool} enableStructFragmentMerge If true, molecule will be also merged when merging nodes between different molecule.
 *
 * @property {Array} changedConnectors Connectors modified during merge.
 * @property {Array} removedConnectors Connectors removed during merge.
 */
Kekule.ChemStructOperation.MergeNodes = Class.create(Kekule.ChemStructOperation.MergeNodesBase,
/** @lends Kekule.ChemStructOperation.MergeNodes# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemStructOperation.MergeNodes',
	/** @constructs */
	initialize: function($super, target, dest, enableStructFragmentMerge, editor)
	{
		$super(target, dest, enableStructFragmentMerge, editor);
		this._refSibling = null;
		this._nodeParent = null;
		this._structFragmentMergeOperation = null;
		this._removeConnectorOperations = [];
		this._removeNodeOperation = null;
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('changedConnectors', {'dataType': DataType.ARRAY, 'serializable': false});
		this.defineProp('removedConnectors', {'dataType': DataType.ARRAY, 'serializable': false});
		this.defineProp('changedGlyphNodes', {'dataType': DataType.HASH})
		//this.defineProp('enableStructFragmentMerge', {'dataType': DataType.BOOL});
	},
	/** @ignore */
	doExecute: function()
	{
		var fromNode = this.getTarget();
		var toNode = this.getDest();
		// console.log('calling MergeNodes on', fromNode.CLASS_NAME, fromNode.id, 'to', toNode.CLASS_NAME, toNode.id);
		var structFragment = (fromNode instanceof Kekule.ChemMarker.UnbondedElectronSet)? fromNode.getParent().getParentFragment() : fromNode.getParentFragment();
		var destFragment = (toNode instanceof Kekule.ChemMarker.UnbondedElectronSet)? toNode.getParent().getParentFragment() : toNode.getParentFragment();
		if (structFragment !== destFragment)  // from different molecule
		{
			//console.log('need merge mol');
			if (this.getEnableStructFragmentMerge())
			{
				this._structFragmentMergeOperation = new Kekule.ChemStructOperation.MergeStructFragment(structFragment, destFragment, this.getEditor());
				//this._structFragmentMergeOperation = new Kekule.ChemStructOperation.MergeStructFragment(destFragment, structFragment);
				this._structFragmentMergeOperation.execute();
				structFragment = destFragment;
			}
			else
				return null;
		}
		this._nodeParent = structFragment;

		structFragment.beginUpdate();
		try
		{
			var editor = this.getEditor();
			// Copy over data of attached glyph nodes
			var changedGlyphNodes = {};
			(Object.keys(fromNode.getAttachedArcNodeIds())).forEach(glyphId => {
				var glyphNode = editor.chemObj.getObjById(glyphId)
				if (glyphNode && glyphNode.anchorObj === fromNode.id) {
					changedGlyphNodes[glyphId] = {fromNodeId: fromNode.id, toNodeId: toNode.id}
				}
			})
			var removedConnectors = this.getRemovedConnectors();
			if (!removedConnectors && !(fromNode instanceof Kekule.ChemMarker.UnbondedElectronSet))  // auto calc
			{
				var commonSiblings = this.getCommonSiblings(fromNode, toNode);
				var removedConnectors = [];
				// TODO: Figure out if the removedConnectors have attached glyphNodes and push those nodes into changedGlyphNodes
				if (commonSiblings.length)  // has common sibling between from/toNode, bypass bond between fromNode and sibling
				{
					for (var i = 0, l = commonSiblings.length; i < l; ++i)
					{
						var sibling = commonSiblings[i];
						var connector = fromNode.getConnectorTo(sibling);
						if (connector && (connector.getConnectedObjCount() == 2))
							removedConnectors.push(connector);
					}
				}
				var directConnector = fromNode.getConnectorTo(toNode);
				if (directConnector)
					removedConnectors.push(directConnector);
				this.setRemovedConnectors(removedConnectors);
			}

			var connectors = this.getChangedConnectors();
			if (!connectors && !(fromNode instanceof Kekule.ChemMarker.UnbondedElectronSet))  // auto calc
			{
				var linkedConnectors = fromNode.getLinkedConnectors();
				var connectors = Kekule.ArrayUtils.clone(linkedConnectors) || [];
				connectors = Kekule.ArrayUtils.exclude(connectors, removedConnectors);
				this.setChangedConnectors(connectors);
			}

			// save fromNode's information
			this._refSibling = (fromNode instanceof Kekule.ChemMarker.UnbondedElectronSet)? fromNode.getParent().getNextSibling() : fromNode.getNextSibling();

			if (connectors) {
				for (var i = 0, l = connectors.length; i < l; ++i)
				{
					var connector = connectors[i];
					var index = connector.indexOfConnectedObj(fromNode);
					connector.removeConnectedObj(fromNode);
					connector.insertConnectedObjAt(toNode, index);  // keep the index is important, wedge bond direction is related with node sequence
				}
			}

			this._removeConnectorOperations = [];
			if (removedConnectors) {
				for (var i = 0, l = removedConnectors.length; i < l; ++i)
				{
					var connector = removedConnectors[i];
					var oper = new Kekule.ChemStructOperation.RemoveConnector(connector, null, null, editor);
					oper.execute();
					this._removeConnectorOperations.push(oper);
				}
			}

		this._removeNodeOperation = new Kekule.ChemStructOperation.RemoveNode(fromNode, null, null, editor);
		this._removeNodeOperation.execute();
	}

		finally
		{
			structFragment.endUpdate();
		}
	},
	/** @ignore */
	doReverse: function()
	{
		var fromNode = this.getTarget();
		var toNode = this.getDest();
		//var structFragment = fromNode.getParent();
		//var structFragment = toNode.getParent();
		var structFragment = this._nodeParent;

		structFragment.beginUpdate();
		try
		{
			/*
			 console.log(fromNode.getParent(), fromNode.getParent() === structFragment,
			 toNode.getParent(), toNode.getParent() === structFragment);
			 */
			//structFragment.insertBefore(fromNode, this._refSibling);
			this._removeNodeOperation.reverse();

			if (this._removeConnectorOperations.length)
			{
				for (var i = this._removeConnectorOperations.length - 1; i >= 0; --i)
				{
					var oper = this._removeConnectorOperations[i];
					oper.reverse();
				}
			}
			this._removeConnectorOperations = [];

			var connectors = this.getChangedConnectors();

			//console.log('reverse node merge2', toNode, toNode.getParent());

			for (var i = 0, l = connectors.length; i < l; ++i)
			{
				var connector = connectors[i];
				var index = connector.indexOfConnectedObj(toNode);
				connector.removeConnectedObj(toNode);
				connector.insertConnectedObjAt(fromNode, index);
			}
			// TODO: Now that all of the previous nodes and bonds exist, let's reattach their original glyphNodes kept from `this.changedGlyphNodes`
		}
		finally
		{
			structFragment.endUpdate();
		}

		//console.log('reverse node merge', toNode, toNode.getParent());

		if (this._structFragmentMergeOperation)
		{
			this._structFragmentMergeOperation.reverse();
		}
	}
});
/**
 * A class method to check if two connectors can be merged
 * @param {Kekule.ChemStructureNode} target
 * @param {Kekule.ChemStructureNode} dest
 * @param {Bool} canMergeStructFragment
 * @returns {Bool}
 */
Kekule.ChemStructOperation.MergeNodes.canMerge = function(target, dest, canMergeStructFragment, canMergeNeighborNodes)
{
	// never allow merge to another molecule point (e.g. formula molecule) or subgroup
	if ((target instanceof Kekule.StructureFragment) || (dest instanceof Kekule.StructureFragment))
		return false;
	if (!(((target instanceof Kekule.ChemStructureNode) || (target instanceof Kekule.ChemMarker.UnbondedElectronSet))
					&& ((dest instanceof Kekule.ChemStructureNode) || (dest instanceof Kekule.ChemMarker.UnbondedElectronSet))))
		return false;
	if (target.getClassName() !== dest.getClassName())
		return false;
		
	var targetFragment = target.getParent();
	var destFragment = dest.getParent();
	var result = (targetFragment === destFragment) || canMergeStructFragment;
	if (!canMergeNeighborNodes)
		result = result && (!target.getConnectorTo(dest));
	return result;
};



/**
 * Preview operation of merging two nodes as one.
 * This operation just set the same position of merging nodes, but do not do the actual merge.
 * @class
 * @augments Kekule.ChemStructOperation.MergeNodesBase
 *
 * @param {Kekule.ChemStructureNode} target Source node, all connectors to this node will be connected to toNode.
 * @param {Kekule.ChemStructureNode} dest Destination node.
 * @param {Bool} enableStructFragmentMerge If true, molecule will be also merged when merging nodes between different molecule.
 */
Kekule.ChemStructOperation.AnchorNodesPreview = Class.create(Kekule.ChemStructOperation.MergeNodesBase,
/** @lends Kekule.ChemStructOperation.AnchorNodesPreview# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemStructOperation.AnchorNodesPreview',
	/** @constructs */
	initialize: function($super, target, dest, editor)
	{
		$super(target, dest, true, editor);
	},

	/** @ignore */
	doExecute: function()
	{
		this._moveNodeOperations = [];
		var fromNode = this.getTarget();
		var toNode = this.getDest();
		var CM = Kekule.CoordMode;
		var coordModes = [CM.COORD2D];
		try
		{
			for (var i = 0, l = coordModes.length; i < l; ++i)
			{
				var toCoord = toNode.getAbsBaseCoord(coordModes[i], false);
				var oper = new Kekule.ChemObjOperation.MoveTo(fromNode, toCoord, coordModes[i], true, this.getEditor());
				oper.execute();
				this._moveNodeOperations.push(oper);
			}
			// console.log(`setting anchor obj on ${fromNode.id} to ${toNode.id} with coords ${JSON.stringify(toNode.coord2D || toNode.deriveBondCenter())}`);
			fromNode.setAnchorObj(toNode.getId());
			toNode.getAttachedArcNodeIds()[fromNode.getId()] = fromNode.getId()
			toNode.addEventListener('objectMoved', this.moveCurveArrowToMatchChemStructure, this);
		}
		finally
		{
		}
		try {
			if (fromNode instanceof Kekule.Glyph.PathGlyphNode &&  toNode instanceof Kekule.Bond) { // NGA-8759
				var parent = toNode.getParent();
				if (parent && parent instanceof Kekule.Molecule) {
					var connectors = parent.getConnectors();
					if (connectors && connectors.length) {
						for (const connector of connectors) {
							if (connector.id !== toNode.id) {
								const attachedArcNodeIds = connector.getAttachedArcNodeIds();
								if (attachedArcNodeIds[fromNode.id]) {
									//console.log('********************** DUPLICATE Will Robinson!!!');
									// make sure this Bond is only connected to a single PathGlyphNode (curved arrow)
									delete attachedArcNodeIds[fromNode.id];
								}
							}
						}
					}
				}
			}
		}
		catch(exception) {
			console.error(exception);
		}
	},
	/** @ignore */
	doReverse: function()
	{
		var fromNode = this.getTarget();
		var toNode = this.getDest();
		try
		{
			var opers = this._moveNodeOperations;
			for (var i = opers.length - 1; i >= 0; --i)
			{
				opers[i].reverse();
			}
			this.removeListenersOnCurveArrow(fromNode, toNode)
		}
		finally
		{
		}
		this._moveNodeOperations = null;
	}
});
	

/**
 * Preview operation of merging two nodes as one.
 * This operation just set the same position of merging nodes, but do not do the actual merge.
 * @class
 * @augments Kekule.ChemStructOperation.MergeNodesBase
 *
 * @param {Kekule.ChemStructureNode} target Source node, all connectors to this node will be connected to toNode.
 * @param {Kekule.ChemStructureNode} dest Destination node.
 * @param {Bool} enableStructFragmentMerge If true, molecule will be also merged when merging nodes between different molecule.
 */
Kekule.ChemStructOperation.MergeNodesPreview = Class.create(Kekule.ChemStructOperation.MergeNodesBase,
/** @lends Kekule.ChemStructOperation.MergeNodesPreview# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemStructOperation.MergeNodesPreview',
	/** @constructs */
	initialize: function($super, target, dest, enableStructFragmentMerge, editor)
	{
		$super(target, dest, enableStructFragmentMerge, editor);
		this._nodeParent = null;
	},
	/** @ignore */
	doExecute: function()
	{
		this._moveNodeOperations = [];
		var fromNode = this.getTarget();
		var toNode = this.getDest();
		var structFragment = (fromNode instanceof Kekule.ChemMarker.UnbondedElectronSet)? fromNode.getParent().getParentFragment() : fromNode.getParentFragment();
		var CM = Kekule.CoordMode;
		var coordModes = [CM.COORD2D, CM.COORD3D];
		if (structFragment)
			structFragment.beginUpdate();
		try
		{
			for (var i = 0, l = coordModes.length; i < l; ++i)
			{
				var toCoord = toNode.getAbsBaseCoord(coordModes[i], false);
				var oper = new Kekule.ChemObjOperation.MoveTo(fromNode, toCoord, coordModes[i], true, this.getEditor());
				oper.execute();
				this._moveNodeOperations.push(oper);
			}
			this._nodeParent = structFragment;
		}
		finally
		{
			if (structFragment)
				structFragment.endUpdate();
		}
	},
	/** @ignore */
	doReverse: function()
	{
		var structFragment = this._nodeParent;
		if (structFragment)
			structFragment.beginUpdate();
		try
		{
			var opers = this._moveNodeOperations;
			for (var i = opers.length - 1; i >= 0; --i)
			{
				opers[i].reverse();
			}
		}
		finally
		{
			if (structFragment)
				structFragment.endUpdate();
		}
		this._moveNodeOperations = null;
	}
});
Kekule.ChemStructOperation.MergeNodesPreview.canMerge = Kekule.ChemStructOperation.MergeNodes.canMerge;

/**
 * Operation of merging two connectors as one.
 * @class
 * @augments Kekule.ChemObjOperation.Base
 *
 * @param {Kekule.ChemStructureConnector} target Source connector.
 * @param {Kekule.ChemStructureConnector} dest Destination connector.
 * @param {Int} coordMode Coord mode of current editor.
 * @param {Bool} enableStructFragmentMerge If true, molecule will be also merged when merging connectors between different molecule.
 *
 * @property {Kekule.ChemStructureConnector} target Source connector.
 * @property {Kekule.ChemStructureConnector} dest Destination connector.
 * @property {Int} coordMode Coord mode of current editor.
 * @property {Bool} enableStructFragmentMerge If true, molecule will be also merged when merging connectors between different molecule.
 */
Kekule.ChemStructOperation.MergeConnectorsBase = Class.create(Kekule.ChemObjOperation.Base,
/** @lends Kekule.ChemStructOperation.MergeConnectorsBase# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemStructOperation.MergeConnectorsBase',
	/** @constructs */
	initialize: function($super, target, dest, coordMode, enableStructFragmentMerge, editor)
	{
		$super(target, editor);
		this.setDest(dest);
		this.setCoordMode(coordMode || Kekule.CoordMode.COORD2D);
		this.setEnableStructFragmentMerge(enableStructFragmentMerge || false);
		this._refSibling = null;
		this._nodeParent = null;
		//this._structFragmentMergeOperation = null;
		this._nodeMergeOperations = [];
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('dest', {'dataType': 'Kekule.ChemStructureConnector', 'serializable': false});
		this.defineProp('enableStructFragmentMerge', {'dataType': DataType.BOOL});
		this.defineProp('coordMode', {'dataType': DataType.INT});
	},
	/**
	 * Returns the concrete node merge operation, descendants should override this method.
	 */
	getMergeNodeOperationClass: function()
	{
		// do nothing here
	},
	/** @private */
	doExecute: function()
	{
		var canMerge = Kekule.ChemStructOperation.MergeConnectors.canMerge(this.getTarget(), this.getDest(), this.getEnableStructFragmentMerge());

		if (!canMerge)
			Kekule.error(Kekule.$L('ErrorMsg.CAN_NOT_MERGE_CONNECTORS'));

		// sort targetNodes and destNodes via coord
		var coordMode = this.getCoordMode();
		var connectors = [this.getTarget(), this.getDest()];
		var AU = Kekule.ArrayUtils;
		var targetNodes = AU.clone(this.getTarget().getConnectedObjs());
		var destNodes = AU.clone(this.getDest().getConnectedObjs());
		var allowCoordBorrow = this.getAllowCoordBorrow();

		for (var i = 0, l = connectors.length; i < l; ++i)
		{
			var connector = connectors[i];
			var coord1 = connector.getConnectedObjAt(0).getAbsCoordOfMode(coordMode, allowCoordBorrow);
			var coord2 = connector.getConnectedObjAt(1).getAbsCoordOfMode(coordMode, allowCoordBorrow);
			var coordDelta = Kekule.CoordUtils.substract(coord1, coord2);
			var dominateDirection = Math.abs(coordDelta.x) > Math.abs(coordDelta.y)? 'x': 'y';
			if (Kekule.ObjUtils.notUnset(coord1.z))
			{
				if (Math.abs(coordDelta.z) > Math.abs(coordDelta.x))
					dominateDirection = 'z';
			}
			var nodes = (i === 0)? targetNodes: destNodes;
			nodes.sort(function(a, b)
				{
					var coord1 = a.getAbsCoordOfMode(coordMode, allowCoordBorrow);
					var coord2 = b.getAbsCoordOfMode(coordMode, allowCoordBorrow);
					return (coord1[dominateDirection] - coord2[dominateDirection]) || 0;
				}
			);
		}

		var commonNodes = AU.intersect(targetNodes, destNodes);
		targetNodes = AU.exclude(targetNodes, commonNodes);
		destNodes = AU.exclude(destNodes, commonNodes);

		this._nodeMergeOperations = [];
		var nodeMergeOperClass = this.getMergeNodeOperationClass();
		for (var i = 0, l = targetNodes.length; i < l; ++i)
		{
			if (targetNodes[i] !== destNodes[i])
			{
				//var oper = new Kekule.ChemStructOperation.MergeNodes(targetNodes[i], destNodes[i], this.getEnableStructFragmentMerge());
				var oper = new nodeMergeOperClass(targetNodes[i], destNodes[i], this.getEnableStructFragmentMerge());
				oper.execute();
			}
			this._nodeMergeOperations.push(oper);
		}
	},
	/** @private */
	doReverse: function()
	{
		for (var i = this._nodeMergeOperations.length - 1; i >= 0; --i)
		{
			var oper = this._nodeMergeOperations[i];
			oper.reverse();
		}
		this._nodeMergeOperations = [];
	}
});
/**
 * Operation of merging two connectors as one.
 * @class
 * @augments Kekule.ChemStructOperation.MergeConnectorsBase
 *
 * @param {Kekule.ChemStructureConnector} target Source connector.
 * @param {Kekule.ChemStructureConnector} dest Destination connector.
 * @param {Int} coordMode Coord mode of current editor.
 * @param {Bool} enableStructFragmentMerge If true, molecule will be also merged when merging connectors between different molecule.
 */
Kekule.ChemStructOperation.MergeConnectors = Class.create(Kekule.ChemStructOperation.MergeConnectorsBase,
/** @lends Kekule.ChemStructOperation.MergeConnectors# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemStructOperation.MergeConnectors',
	/** @ignore */
	getMergeNodeOperationClass: function()
	{
		return Kekule.ChemStructOperation.MergeNodes;
	}
});
/**
 * A class method to check if two connectors can be merged
 * @param {Kekule.ChemStructureConnector} target
 * @param {Kekule.ChemStructureConnector} dest
 * @param {Bool} canMergeStructFragment
 * @returns {Bool}
 */
Kekule.ChemStructOperation.MergeConnectors.canMerge = function(target, dest, canMergeStructFragment)
{
	if (!dest || !dest.isConnectingConnector) {
		return false;
	}
	if (!canMergeStructFragment && (target.getParent() !== dest.getParent()))
		return false;
	if (target.isConnectingConnector() || dest.isConnectingConnector())
	{
		return false;
	}
	var targetNodes = target.getConnectedExposedObjs();
	var destNodes = dest.getConnectedObjs();
	if (targetNodes.length !== destNodes.length)
	{
		return false;
	}
	if (targetNodes.length !== 2)  // currently can only handle connector with 2 connected objects
	{
		return false;
	}
	if (Kekule.ArrayUtils.intersect(targetNodes, destNodes).length >= 1)
	{
		return false;
	}
	if (target instanceof Kekule.Bond && dest instanceof Kekule.Glyph.PathGlyphArcConnector) {
		// When draggin bond don't allow funky merge of atoms to glyph nodes
		return false
	}
	return true;
};
/**
 * Operation of merging two connectors as one.
 * @class
 * @augments Kekule.ChemStructOperation.MergeConnectorsBase
 *
 * @param {Kekule.ChemStructureConnector} target Source connector.
 * @param {Kekule.ChemStructureConnector} dest Destination connector.
 * @param {Int} coordMode Coord mode of current editor.
 * @param {Bool} enableStructFragmentMerge If true, molecule will be also merged when merging connectors between different molecule.
 */
Kekule.ChemStructOperation.MergeConnectorsPreview = Class.create(Kekule.ChemStructOperation.MergeConnectorsBase,
/** @lends Kekule.ChemStructOperation.MergeConnectors# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemStructOperation.MergeConnectors',
	/** @ignore */
	getMergeNodeOperationClass: function()
	{
		return Kekule.ChemStructOperation.MergeNodesPreview;
	}
});
Kekule.ChemStructOperation.MergeConnectorsPreview.canMerge = Kekule.ChemStructOperation.MergeConnectors.canMerge;

/**
 * Operation of merging two structure fragment as one.
 * @class
 * @augments Kekule.ChemObjOperation.Base
 *
 * @param {Kekule.StructureFragment} target Source fragment.
 * @param {Kekule.StructureFragment} dest Destination fragment.
 *
 * @property {Kekule.StructureFragment} target Source fragment, all connectors and nodes will be moved to dest fragment.
 * @property {Kekule.StructureFragment} dest Destination fragment.
 * @property {Array} mergedNodes Nodes moved from target to dest during merging.
 * @property {Array} mergedConnectors Connectors moved from target to dest during merging.
 */
Kekule.ChemStructOperation.MergeStructFragment = Class.create(Kekule.ChemObjOperation.Base,
/** @lends Kekule.ChemStructOperation.MergeStructFragment# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemStructOperation.MergeStructFragment',
	/** @constructs */
	initialize: function($super, target, dest, editor)
	{
		$super(target, editor);
		this.setDest(dest);
		this._removeOperation = null;
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('dest', {'dataType': 'Kekule.StructureFragment', 'serializable': false});
		this.defineProp('mergedNodes', {'dataType': DataType.ARRAY, 'serializable': false});
		this.defineProp('mergedConnectors', {'dataType': DataType.ARRAY, 'serializable': false});
	},
	/** @private */
	moveChildBetweenStructFragment: function(target, dest, nodes, connectors)
	{
		Kekule.ChemStructureUtils.moveChildBetweenStructFragment(target, dest, nodes, connectors);
	},
	/** @private */
	doExecute: function()
	{
		var target = this.getTarget();
		var dest = this.getDest();
		if (target && dest)
		{
			var nodes = Kekule.ArrayUtils.clone(target.getNodes());
			this.setMergedNodes(nodes);
			var connectors = Kekule.ArrayUtils.clone(target.getConnectors());
			this.setMergedConnectors(connectors);

			this.moveChildBetweenStructFragment(target, dest, nodes, connectors);
			var parent = target.getParent();
			if (parent)  // remove target from parent
			{
				this._removeOperation = new Kekule.ChemObjOperation.Remove(target, parent, null, this.getEditor());
				this._removeOperation.execute();
			}
		}
	},
	/** @private */
	doReverse: function()
	{
		var target = this.getTarget();
		var dest = this.getDest();
		if (target && dest)
		{
			if (this._removeOperation)
			{
				this._removeOperation.reverse();
				this._removeOperation = null;
			}
			var nodes = this.getMergedNodes();
			var connectors = this.getMergedConnectors();

			/*
			console.log('before mol merge reverse dest', dest.getNodeCount(), dest.getConnectorCount());
			console.log('before mol merge reverse target', target.getNodeCount(), target.getConnectorCount());

			console.log('reverse mol merge', nodes.length, connectors.length);
			*/
			this.moveChildBetweenStructFragment(dest, target, nodes, connectors);
			/*
			console.log('after mol merge reverse dest', dest.getNodeCount(), dest.getConnectorCount());
			console.log('after mol merge reverse target', target.getNodeCount(), target.getConnectorCount());
			*/
		}
	}
});

/**
 * Operation of split one unconnected structure fragment into multiple connected ones.
 * @class
 * @augments Kekule.ChemObjOperation.Base
 *
 * @param {Kekule.StructureFragment} target.
 *
 * @property {Kekule.StructureFragment} target Source fragment, all connectors and nodes will be moved to dest fragment.
 * @property {Array} splittedFragments Fragment splitted, this property will be automatically calculated in execution of operation.
 */
Kekule.ChemStructOperation.SplitStructFragment = Class.create(Kekule.ChemObjOperation.Base,
/** @lends Kekule.ChemStructOperation.SplitStructFragment# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemStructOperation.SplitStructFragment',
	/** @constructs */
	initialize: function($super, target, editor)
	{
		$super(target, editor);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('splittedFragments', {'dataType': DataType.ARRAY, 'serializable': false, 'setter': null});
	},
	/** @private */
	doExecute: function()
	{
		var splitted = Kekule.ChemStructureUtils.splitStructFragment(this.getTarget());
		if (splitted.length > 1)  // do really split
		{
			this.setPropStoreFieldValue('splittedFragments', splitted);
			var parent = this.getTarget().getParent();
			var ref = this.getTarget().getNextSibling();
			parent.beginUpdate();
			try
			{
				if (parent)  // insert newly splitted fragments
				{
					for (var i = 1, l = splitted.length; i < l; ++i)
					{
						var frag = splitted[i];
						parent.insertBefore(frag, ref);
					}
				}
			}
			finally
			{
				parent.endUpdate();
			}
		}
		else // no real split actions done
		{
			this.setPropStoreFieldValue('splittedFragments', null);
		}
	},
	/** @private */
	doReverse: function()
	{
		var fragments = this.getSplittedFragments();
		if (fragments && fragments.length)
		{
			var target = this.getTarget();
			for (var i = 0, l = fragments.length; i < l; ++i)
			{
				var frag = fragments[i];
				if (frag !== target)
				{
					Kekule.ChemStructureUtils.moveChildBetweenStructFragment(frag, target, Kekule.ArrayUtils.clone(frag.getNodes()), Kekule.ArrayUtils.clone(frag.getConnectors()));
					var p = frag.getParent();
					if (p)
						p.removeChild(frag);
					frag.finalize();
				}
			}
		}
		//console.log('split reverse done', target.getNodeCount(), target.getConnectorCount());
	}
});

/**
 * Split one unconnected structure fragment into multiple connected ones, or remove the fragment
 * if the fragment contains no node.
 * @class
 * @augments Kekule.ChemObjOperation.Base
 *
 * @param {Kekule.StructureFragment} target.
 *
 * @property {Kekule.StructureFragment} target Source fragment.
 * @property {Bool} enableRemove Whether allow remove empty structure fragment. Default is true.
 * @property {Bool} enableSplit Whether allow splitting structure fragment. Default is true.
 */
Kekule.ChemStructOperation.StandardizeStructFragment = Class.create(Kekule.ChemObjOperation.Base,
/** @lends Kekule.ChemStructOperation.StandardizeStructFragment# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemStructOperation.StandardizeStructFragment',
	/** @constructs */
	initialize: function($super, target, editor)
	{
		$super(target, editor);
		this.setEnableSplit(true);
		this.setEnableRemove(true);
		this._concreteOper = null;  // private
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('enableRemove', {'dataType': DataType.BOOL});
		this.defineProp('enableSplit', {'dataType': DataType.BOOL});
	},
	/** @private */
	doExecute: function()
	{
		var target = this.getTarget();
		var nodeCount = target.getNodeCount();
		this._concreteOper = null;
		var editor = this.getEditor();
		if (nodeCount <= 0)
		{
			if (this.getEnableRemove())
				this._concreteOper = new Kekule.ChemObjOperation.Remove(target, null, null, editor);
		}
		else
		{
			if (this.getEnableSplit())
				this._concreteOper = new Kekule.ChemStructOperation.SplitStructFragment(target, editor);
		}
		if (this._concreteOper)
			return this._concreteOper.execute();
		else
			return null;
	},
	/** @private */
	doReverse: function()
	{
		return this._concreteOper? this._concreteOper.reverse(): null;
	}
});

return Kekule;
}
