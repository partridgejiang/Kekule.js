/**
 * @fileoverview
 * Editor for Kekule.ChemSpace.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /render/kekule.render.base.js
 * requires /render/kekule.render.extensions.js
 * requires /render/kekule.render.kekule.render.utils.js
 * requires /widgets/operation/kekule.operations.js
 * requires /widgets/commonCtrls/kekule.widget.formControls.js
 * requires /widgets/commonCtrls/kekule.widget.dialogs.js
 * requires /widgets/chem/periodicTable/kekule.chemWidget.periodicTables.js
 * requires /widgets/chem/editor/kekule.chemEditor.extensions.js
 * requires /widgets/chem/editor/kekule.chemEditor.editorUtils.js
 * requires /widgets/chem/editor/kekule.chemEditor.configs.js
 * requires /widgets/chem/editor/kekule.chemEditor.operations.js
 * requires /widgets/chem/editor/kekule.chemEditor.baseEditors.js
 * requires /widgets/chem/editor/kekule.chemEditor.repositories.js
 */

(function(){

"use strict";

var AU = Kekule.ArrayUtils;
var CCNS = Kekule.ChemWidget.HtmlClassNames;
//var CWT = Kekule.ChemWidgetTexts;

/** @ignore */
Kekule.ChemWidget.HtmlClassNames = Object.extend(Kekule.ChemWidget.HtmlClassNames, {
	CHEMSPACE_EDITOR: 'K-Chem-Space-Editor',
	CHEMSPACE_EDITOR2D: 'K-Chem-Space-Editor2D',
	CHEMSPACE_EDITOR3D: 'K-Chem-Space-Editor3D',

	CHEMEDITOR_TEXT_SETTER: 'K-ChemEditor-Text-Setter',
	CHEMEDITOR_FORMULA_SETTER: 'K-ChemEditor-Formula-Setter'
});

/**
 * A chem editor to edit chemspace object and other chem objects.
 * When load a chem object other than instance of Kekule.ChemSpace, an empty ChemSpace instance will
 * be created and loaded object should be insert into it.
 * @class
 * @augments Kekule.Editor.BaseEditor
 * @param {Variant} parentOrElementOrDocument
 * @param {Kekule.ChemObject} chemObj initially loaded chemObj.
 * @param {Int} renderType Display in 2D or 3D. Value from {@link Kekule.Render.RendererType}.
 * @param {Kekule.Editor.BaseEditorConfigs} editorConfigs Configuration of this editor.
 *
 * @property {Kekule.ChemSpace} chemSpace ChemSpace loaded in this editor.
 * @property {Float} defBondLength
 * @property {Bool} allowCreateNewChild Whether new direct child of space can be created.
 *   Note: if the space is empty, one new child will always be allowed to create.
 * @property {Bool} autoCreateNewStructFragment Whether new molecule object can be created in space.
 *   Note: if property {@link Kekule.Editor.ChemSpaceEditor.allowCreateNewChild} is false, this property
 *   will always be false.
 */
Kekule.Editor.ChemSpaceEditor = Class.create(Kekule.Editor.BaseEditor,
/** @lends Kekule.Editor.ChemSpaceEditor# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ChemSpaceEditor',
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument, chemObj, renderType, editorConfigs)
	{
		this.setPropStoreFieldValue('allowCreateNewChild', true);
		this.setPropStoreFieldValue('autoCreateNewStructFragment', true);
		$super(parentOrElementOrDocument, chemObj, renderType, editorConfigs);
		this._containerChemSpace = null;  // private field, used to mark that a extra chem space container is used

	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('chemSpace', {'dataType': 'Kekule.ChemSpace', 'serializable': false,
			'getter': function() { return this.getChemObj(); },
			'setter': function(value) { this.setChemObj(value); }
		});
		this.defineProp('defBondLength', {'dataType': DataType.FLOAT, 'serializable': false,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('defBondLength');
				if (!result)
					result = this.getEditorConfigs().getStructureConfigs().getDefBondLength();
				return result;
			}
		});
		this.defineProp('autoCreateNewStructFragment', {'dataType': DataType.BOOL,
			'getter': function()
			{
				return this.getPropStoreFieldValue('autoCreateNewStructFragment') && this.canCreateNewChild();
			}
		});
		this.defineProp('allowCreateNewChild', {'dataType': DataType.BOOL});
	},

	/**
	 * Returns whether new direct child can be created in current space.
	 * This method will returns true of property {@link Kekule.Editor.ChemSpaceEditor.allowCreateNewChild} is true
	 * or the space is empty.
	 * @returns {Bool}
	 */
	canCreateNewChild: function()
	{
		return this.getChemSpace() && (this.getAllowCreateNewChild() || (this.getChemSpace().getChildCount() <= 0));
	},

	/** @ignore */
	getActualDrawOptions: function($super)
	{
		var result = $super();
		// a special field to ensure use explict size of space
		// rather than calc size based on child objects
		result.useExplicitSpaceSize = true;
		return result;
	},

	/** @private */
	doSetChemObj: function($super, value)
	{
		var old = this.getChemObj();
		if (old !== value)
		{
			if (old && this._containerChemSpace)
			{
				old.finalize();
				this._containerChemSpace = null;
			}
			if (value)
			{
				if (value instanceof Kekule.ChemSpace)
				{
					this._initChemSpaceDefProps(value);
					return $super(value);
				}
				else
				{
					var space = this.createContainerChemSpace(null, value);
					//this._initChemSpaceDefProps(space, value);
					//space.appendChild(value);
					this._containerChemSpace = space;
					$super(space);
				}
			}
			else
				$super(value);
		}
		else
			$super(value);
	},

	/** @ignore */
	getExportableClasses: function($super)
	{
		var result = $super();  // now result includes chemSpace
		// add child objects of chemspace to result
		var space = this.getChemSpace();
		if (space)
		{
			for (var i = 0, l = space.getChildCount(); i < l; ++i)
			{
				var obj = space.getChildAt(i);
				if (obj && obj.getClass)
					Kekule.ArrayUtils.pushUnique(result, obj.getClass());
			}
		}
		return result;
	},
	/** @ignore */
	exportObjs: function($super, objClass)
	{
		var result = $super(objClass);
		if ((!result || !result.length) && objClass)  // check child objects of chemSpace
		{
			result = [];
			var space = this.getChemSpace();
			if (space)
			{
				for (var i = 0, l = space.getChildCount(); i < l; ++i)
				{
					var obj = space.getChildAt(i);
					if (obj && (obj instanceof objClass))
						result.push(obj);
				}
			}
		}
		return result;
	},
	/** @ignore */
	getSavingTargetObj: function($super)
	{
		// if only one child in chemspace, save this obj alone (rather than the space).
		var space = this.getChemSpace();
		var childCount = space.getChildCount();
		if (childCount === 1)
		{
			return space.getChildAt(0);
		}
		else
			return $super();
	},

	/** @ignore */
	createDefaultConfigs: function()
	{
		//return new Kekule.Editor.ChemSpaceEditorConfigs();
		return Kekule.Editor.ChemSpaceEditorConfigs.getInstance();
	},

	/** @private */
	doCreateNewDocObj: function()
	{
		return this.createContainerChemSpace();
	},

	/** @private */
	doLoadEnd: function($super, chemObj)
	{
		var result = $super(chemObj);
		// calc def bond length
		var defBondLength = null;
		if (chemObj)
		{
			var connectors = chemObj.getAllContainingConnectors();
			if (connectors && connectors.length)
			{
				var coordMode = (this.getRenderType() === Kekule.Render.RendererType.R3D)?
					Kekule.CoordMode.COORD3D: Kekule.CoordMode.COORD2D;
				defBondLength = Kekule.ChemStructureUtils.getConnectorLengthMedian(connectors, coordMode, this.getAllowCoordBorrow());
			}
		}
		this.setDefBondLength(defBondLength);

		// adjust editor size
		var space = this.getChemObj();
		if (space)
		{
			//console.log('decide size', space, space.getScreenSize);
			var screenSize = space.getScreenSize();
			this.changeClientSize(screenSize.x, screenSize.y, this.getCurrZoom());
			// scroll to top center
			var elem = this.getEditClientElem().parentNode;
			var visibleClientSize = Kekule.HtmlElementUtils.getElemClientDimension(elem);
			this.scrollClientTo(0, (screenSize.x - visibleClientSize.width) / 2);
		}

		return result;
	},

	/** @ignore */
	zoomChanged: function($super, zoomLevel)
	{
		$super();
		var space = this.getChemObj();
		if (space)
		{
			var screenSize = space.getScreenSize();
			this.changeClientSize(screenSize.x, screenSize.y, zoomLevel);
		}
	},

	/** @ignore */
	createNewBoundInfoRecorder: function($super, renderer)
	{
		$super(renderer);
		var recorder = this.getBoundInfoRecorder();
		if (recorder)  // add event listener to update text box size
		{
			recorder.addEventListener('updateBasicDrawObject', this.reactUpdateBasicDrawObject, this);
		}
	},
	/** @private */
	reactUpdateBasicDrawObject: function(e)
	{
		var obj = e.obj;
		// TODO: use such a method to set text block size may not be a good approach
		if (obj && (obj instanceof Kekule.TextBlock))
		{
			var boundInfo = e.boundInfo;
			this.updateTextBlockSize(obj, boundInfo);
		}
	},
	/* @ignore */
	objectChanged: function($super, obj, changedPropNames)
	{
		if (this.getCoordMode() === Kekule.CoordMode.COORD2D)  // only works in 2D mode
		{
			if (obj instanceof Kekule.TextBlock)  // size need to be recalculated
			{
				//console.log('text box changed', obj.getId());
				// must not use setSize2D, otherwise a new object change event will be triggered
				//obj.setPropStoreFieldValue('size2D', {'x': null, 'y': null});
				obj.__$needRecalcSize__ = true;  // special flag, indicating to recalculate size
			}
		}
		return $super(obj, changedPropNames);
	},
	/** @private */
	updateTextBlockSize: function(textBlock, boundInfo)
	{
		if (this.getCoordMode() !== Kekule.CoordMode.COORD2D)  // only works in 2D mode
			return;
		/*
		var oldSize = textBlock.getSize2D();
		if (Kekule.ObjUtils.notUnset(oldSize.x) || Kekule.ObjUtils.notUnset(oldSize.y))  // size already set, by pass
			return;
    */
		if (!textBlock.__$needRecalcSize__)
			return;

		var stype = boundInfo.shapeType;
		if (stype === Kekule.Render.BoundShapeType.RECT)
		{
			var coords = boundInfo.coords;  // context coords
			var objCoord1 = this.contextCoordToObj(coords[0]);
			var objCoord2 = this.contextCoordToObj(coords[1]);
			var delta = Kekule.CoordUtils.substract(objCoord2, objCoord1);
			// must not use setSize2D, otherwise a new object change event will be triggered and a new update process will be launched
			textBlock.setPropStoreFieldValue('size2D', {'x': Math.abs(delta.x), 'y': Math.abs(delta.y)});
			//textBlock.setSize2D({'x': Math.abs(delta.x), 'y': Math.abs(delta.y)});
			delete textBlock.__$needRecalcSize__;
		}
	},

	/** @private */
	createContainerChemSpace: function(id, containingChemObj)
	{
		//var result = new Kekule.ChemSpace(id);
		var result = new Kekule.ChemDocument(id);
		this._initChemSpaceDefProps(result, containingChemObj);
		if (containingChemObj)
		{
			result.appendChild(containingChemObj);

			// adjust child position
			var spaceSize = result.getSizeOfMode(this.getCoordMode(), this.getAllowCoordBorrow());

			var coord, ratio;
			var objBox = Kekule.Render.ObjUtils.getContainerBox(containingChemObj, this.getCoordMode(), this.getAllowCoordBorrow());
			if (this.getCoordMode() === Kekule.CoordMode.COORD2D)
			{
				/*
				var clientElem = this.getEditClientElem();
				var clientDim = Kekule.HtmlElementUtils.getElemClientDimension(clientElem);

				var clientScrollX = clientDim.scrollTop;
				var clientScrollY = clientDim.scrollLeft;
				var padding = clientDim.height / 2;
				*/
				var padding = this.getEditorConfigs().getChemSpaceConfigs().getDefPadding();

				var ratio = result.getObjScreenLengthRatio();
				//console.log('adjust inside obj size', objBox, this.isShown());
			}

			/*
			var oldObjCoord = containingChemObj.getCoordOfMode?
				containingChemObj.getCoordOfMode(this.getCoordMode(), this.getAllowCoordBorrow()) || {}:
				{};
			*/
			var oldObjCoord = containingChemObj.getAbsBaseCoord?
				containingChemObj.getAbsBaseCoord(this.getCoordMode(), this.getAllowCoordBorrow()) || {}:
				{};

			if (ratio && objBox)  // 2D and calc padding
			{
				/*
				var oldObjCoord = containingChemObj.getCoordOfMode?
					containingChemObj.getCoordOfMode(this.getCoordMode()) || {}:
					{};
				*/
				coord = Kekule.CoordUtils.divide(spaceSize, 2);
				//coord.y = spaceSize.y - /*(objBox.y2 - objBox.y1) / 2*/objBox.y2 - padding * ratio;
				//coord.y = spaceSize.y - Math.abs(objBox.y2 - objBox.y1) / 2 - padding * ratio;
				//coord.x -= (objBox.x2 + objBox.x1) / 2;
				/*
				coord.y = (oldObjCoord.y || 0) + spaceSize.y - padding * ratio - objBox.y2;
				coord.x += (oldObjCoord.x || 0) - (objBox.x2 + objBox.x1) / 2;
				*/
				var objBoxCenter = {x: (objBox.x1 + objBox.x2) / 2, y: (objBox.y1 + objBox.y2) / 2};
				var newObjCenter = {x: coord.x, y: spaceSize.y - padding * ratio - (objBox.y2 - objBox.y1) / 2};
				var centerDelta = Kekule.CoordUtils.substract(newObjCenter, objBoxCenter);
				coord = Kekule.CoordUtils.add(oldObjCoord, centerDelta);
				/*
				coord.y = spaceSize.y - padding * ratio - (objBox.y2 - objBox.y1) / 2 - objBoxCenter.y;
				coord.x = coord.x - (objBox.x2 + objBox.x1) / 2;
				*/
				//console.log(spaceSize, coord, objBox);
			}
			else
			{
				//var oldObjCoord = containingChemObj.getCoordOfMode(this.getCoordMode()) || {};
				coord = Kekule.CoordUtils.divide(spaceSize, 2);
				/*
				coord.x -= (objBox.x2 + objBox.x1) / 2;
				coord.y -= (objBox.y2 + objBox.y1) / 2;
				if (this.getCoordMode() === Kekule.CoordMode.COORD3D)
					coord.z -= (objBox.z2 + objBox.z1) / 2;

				coord = Kekule.CoordUtils.add(coord, oldObjCoord);
				*/
			}

			/*
			if (containingChemObj.setCoordOfMode)
				containingChemObj.setCoordOfMode(coord, this.getCoordMode());
			*/
			if (containingChemObj.setAbsBaseCoord)
				containingChemObj.setAbsBaseCoord(coord, this.getCoordMode());

			//this.setObjCoord(containingChemObj, coord, Kekule.Render.CoordPos.CENTER);
		}

		return result;
	},
	/** @private */
	_initChemSpaceDefProps: function(chemSpace, containingChemObj)
	{
		var configs = this.getEditorConfigs();
		var chemSpaceConfigs = configs.getChemSpaceConfigs();
		if (this.getCoordMode() === Kekule.CoordMode.COORD2D)  // now only handles 2D size
		{
			var screenSize = chemSpace.getScreenSize();
			if (!screenSize.x && !screenSize.y)
			{
				screenSize = chemSpaceConfigs.getDefScreenSize2D();
				chemSpace.setScreenSize(screenSize);
			}
			if (!chemSpace.getDefAutoScaleRefLength())
			{
				var refLength;
				if (containingChemObj && containingChemObj.getAllAutoScaleRefLengths)
				{
					var refLengths = containingChemObj.getAllAutoScaleRefLengths(this.getCoordMode(), this.getAllowCoordBorrow());
					refLength = refLengths && refLengths.length? Kekule.ArrayUtils.getMedian(refLengths): null;
				}
				else
				{
					var refLengths = chemSpace.getAllAutoScaleRefLengths(this.getCoordMode(), this.getAllowCoordBorrow());
					refLength = refLengths.length? Kekule.ArrayUtils.getMedian(refLengths): null;
				}
				if (!refLength)
					refLength = configs.getStructureConfigs().getDefBondLength();
				chemSpace.setDefAutoScaleRefLength(refLength);
			}
			if (!chemSpace.getSize2D())
			{
				var refScreenLength = this.getRenderConfigs().getLengthConfigs().getDefBondLength();
				var ratio = chemSpace.getDefAutoScaleRefLength() / refScreenLength;
				chemSpace.setObjScreenLengthRatio(ratio);
				chemSpace.setSize2D({'x': screenSize.x * ratio, 'y': screenSize.y * ratio});
			}
		}
	},

	/**
	 * Create new molecule or structure fragment in chem space.
	 * @param {String} id
	 * @returns {Kekule.StructureFragment}
	 */
	createNewStructFragmentAnchor: function(id)
	{
		/*
		if (!id)  // debug, auto add
		{
			id = 'M' + this.getChemObj().getChildCount();
		}
		*/
		if (this.getAutoCreateNewStructFragment())
		{
			var result = new Kekule.Molecule(id);
			this.getChemSpace().appendChild(result);
			return result;
		}
		else
			return null;
	},

	/**
	 * Create a new atom in a blank parentMol to growing bonds.
	 * @param {Kekule.StructFragment} parentMol
	 * @param {String} id
	 * @param {Hash} absCoord
	 * @param {String} isotopeId Set null to create a default one
	 * @returns {Kekule.ChemStructureNode}
	 */
	createStructStartingAtom: function(parentMol, id, absCoord, isotopeId)
	{
		this.beginUpdateObject();
		try
		{
			if (parentMol)
			{
				if (!isotopeId)
				{
					// create default one
					isotopeId = this.getEditorConfigs().getStructureConfigs().getDefIsotopeId();
				}
				var initialNode = new Kekule.Atom(null, isotopeId);
				parentMol.appendNode(initialNode);
				initialNode.setAbsCoordOfMode(absCoord, this.getCoordMode());
				return initialNode;
			}
			else
				return null;
		}
		finally
		{
			this.endUpdateObject();
		}
	},

	/**
	 * Create new molecule or structure fragment in chem space, the fragment containing a
	 * starting node (atom) to growing bond.
	 * @param {String} id
	 * @param {Hash} absCoord
	 * @param {String} isotopeId Set null to create a default one
	 * @returns {Kekule.ChemStructureNode}
	 */
	createNewStructFragmentAndStartingAtom: function(id, absCoord, isotopeId)
	{
		this.beginUpdateObject();
		try
		{
			var struct;
			/*
			if (this.hasOnlyOneBlankStructFragment())  // only one blank molecule, use it as the new structure fragment's parent.
				struct = this.getChemSpace().getChildAt(0);
			else
			*/
				struct = this.createNewStructFragmentAnchor(id);
			if (struct)
			{
				return this.createStructStartingAtom(struct, id, absCoord, isotopeId);
			}
			else
				return null;
		}
		finally
		{
			this.endUpdateObject();
		}
	},

	/**
	 * Check if there is only one blank structure fragment (with no node and connector or formula) in editor.
	 * @returns {Bool}
	 */
	hasOnlyOneBlankStructFragment: function()
	{
		var result = false;
		if (this.getChemSpace().getChildCount() === 1)
		{
			var obj = this.getChemSpace().getChildAt(0);
			if (obj instanceof Kekule.StructureFragment)
			{
				if (obj.getNodeCount() <= 0 && obj.getConnectorCount() <= 0 && !obj.hasFormula())  // empty molecule
					result = true;
			}
		}
		return result;
	},
	/**
	 * If there is only one blank structure fragment (with no node and connector or formula) in editor,
	 * returns it.
	 * @returns {Kekule.StructureFragment}
	 */
	getOnlyOneBlankStructFragment: function()
	{
		if (this.hasOnlyOneBlankStructFragment())
			return this.getChemSpace().getChildAt(0);
	},
	/**
	 * Returns whether a new standalone object (e.g. molecule) can be added to editor.
	 * @returns {Bool}
	 */
	canAddNewStandaloneObject: function()
	{
		return this.getAllowCreateNewChild() || (this.getChemSpace().getChildCount() <= 0);
	},
	/**
	 * Returns whether a new structure fragment that doest not connected to any existing ones can be added to space.
	 * This function returns true if property autoCreateNewStructFragment is true or there is an empty molecule in space.
	 * @returns {Bool}
	 */
	canAddUnconnectedStructFragment: function()
	{
		return this.canAddNewStandaloneObject() || this.hasOnlyOneBlankStructFragment();
	},
	/**
	 * Returns whether current editor allows clone objects.
	 * @returns {Bool}
	 */
	canCloneObjects: function()
	{
		return this.getAllowCreateNewChild();
	},
	/**
	 * Clone objects in space.
	 * Note that this method only works when property allowCreateNewChild is true.
	 * @param {Array} objects
	 * @param {Hash} screenCoordOffset If this value is set, new cloned objects will be moved based on this coord.
	 * @param {Bool} addToSpace If true, the cloned objects will add to current space immediately.
	 * @returns {Array} Actually cloned objects.
	 */
	cloneObjects: function(objects, screenCoordOffset, addToSpace)
	{
		if (!this.getChemSpace())
			return null;
		/*
		if (!this.getAllowCreateNewChild())
			return null;
		*/
		var allowAddToSpace = this.getAllowCreateNewChild();

		var isParentOfOneObj = function(obj, childObjs)
		{
			for (var i = 0, l = childObjs.length; i < l; ++i)
			{
				var childObj = childObjs[i];
				if (/*(obj === childObj) ||*/ (childObj.isChildOf(obj)))
					return true;
			}
			return false;
		};
		var removeUnessentialChildren = function(rootObj, refObj, reservedChildObjs)
		{
			if (reservedChildObjs.indexOf(refObj) >= 0)
			{
				AU.remove(reservedChildObjs, refObj);
				return;
			}
			if (rootObj.getChildAt && refObj.getChildAt)
			{
				var refChildObjCount = refObj.getChildCount();
				for (var i = refChildObjCount - 1; i >= 0; --i)
				{
					var o = rootObj.getChildAt(i);
					if (!reservedChildObjs.length)
					{
						rootObj.removeChild(o);
						continue;
					}
					var refChildObj = refObj.getChildAt(i);
					if (reservedChildObjs.indexOf(refChildObj) >= 0)
					{
						AU.remove(reservedChildObjs, refChildObj);
					}
					else if (isParentOfOneObj(refChildObj, reservedChildObjs))
					{
						if (refChildObj.getChildObjs)
							removeUnessentialChildren(o, refChildObj, reservedChildObjs);
					}
					else  // can delete
					{
						rootObj.removeChild(o);
					}
				}
			}
		};

		var targetObjs = Kekule.ArrayUtils.toArray(objects);
		var standAloneObjs = [];
		var childObjMap = new Kekule.MapEx();
		for (var i = 0, l = targetObjs.length; i < l; ++i)
		{
			var obj = targetObjs[i];
			var standAloneObj = obj.getStandaloneAncestor? obj.getStandaloneAncestor(): obj;
			if (standAloneObj.clone)  // object can be cloned
			{
				Kekule.ArrayUtils.pushUnique(standAloneObjs, standAloneObj);
				var mapItem = childObjMap.get(standAloneObj);
				if (!mapItem)
				{
					mapItem = [];
					childObjMap.set(standAloneObj, mapItem);
				}
				mapItem.push(obj);
			}
		}

		// start clone
		var space = this.getChemSpace();
		var clonedObjs = [];
		var coordMode = this.getCoordMode();
		var allowCoordBorrow = this.getAllowCoordBorrow();
		var standAloneObjCount = standAloneObjs.length;
		for (var i = 0; i < standAloneObjCount; ++i)
		{
			var obj = standAloneObjs[i];
			var clonedObj = obj.clone();
			// clear ids to avoid conflict
			if (clonedObj.clearIds)
				clonedObj.clearIds();
			/*
			if (coordOffset && clonedObj.getCoordOfMode && clonedObj.setCoordOfMode)
			{
				var coord = clonedObj.getCoordOfMode(coordMode, allowCoordBorrow);
				var newCoord = Kekule.CoordUtils.add(coord, coordOffset);
				clonedObj.setCoordOfMode(newCoord, coordMode);
			}
			*/

			// remove unessential child objects of cloned object
			removeUnessentialChildren(clonedObj, obj, childObjMap.get(obj));

			if (addToSpace && allowAddToSpace)
			{
				space.appendChild(clonedObj);
				if (screenCoordOffset)
				{
					var coord = this.getObjectScreenCoord(clonedObj);
					var newCoord = Kekule.CoordUtils.add(coord, screenCoordOffset);
					this.setObjectScreenCoord(clonedObj, newCoord);
				}
			}
			clonedObjs.push(clonedObj);
		}

		childObjMap.finalize();
		return clonedObjs;
	},

	/**
	 * Clone objects in editor's selection.
	 * @param {Hash} coordOffset New cloned objects will be moved based on this coord.
	 *   If this value is not set, a default one will be used.
	 * @param {Bool} addToSpace If true, the objects cloned will be added to space immediately.
	 * @returns {Array} Actually cloned objects.
	 */
	cloneSelection: function(coordOffset, addToSpace)
	{
		if (coordOffset === undefined)  // use default one
		{
			coordOffset = this.getDefaultCloneScreenCoordOffset();
		}
		var objs = this.getSelection();
		var clonedObjs = this.cloneObjects(objs, coordOffset, addToSpace);
		if (addToSpace)
			this.setSelection(clonedObjs);
		return clonedObjs;
	},

	/**
	 * Returns default coord offset when doing clone selection job in editor.
	 * @returns {Hash}
	 */
	getDefaultCloneScreenCoordOffset: function()
	{
		var screenOffset = this.getEditorConfigs().getInteractionConfigs().getClonedObjectScreenOffset() || 0;
		var coordMode = this.getCoordMode();
		var coordOffset = {'x': screenOffset, 'y': screenOffset};
		if (coordMode === Kekule.CoordMode.COORD3D)
		{
			coordOffset.z = screenOffset;
		}
		//coordOffset = this.translateCoord(coordOffset, Kekule.Editor.CoordSys.SCREEN, Kekule.Editor.CoordSys.OBJ);
		return coordOffset;
	}
});

/**
 * A special class to give a setting facade for ChemSpaceEditor.
 * Do not use this class alone.
 * @class
 * @augments Kekule.Editor.BaseEditor.Settings
 * @ignore
 */
Kekule.Editor.ChemSpaceEditor.Settings = Class.create(Kekule.Editor.BaseEditor.Settings,
/** @lends Kekule.Editor.ChemSpaceEditor.Settings# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ChemSpaceEditor.Settings',
	/** @private */
	initProperties: function()
	{
		this.defineProp('allowCreateNewChild', {'dataType': DataType.BOOL, 'serializable': false,
			'getter': function() { return this.getEditor().getAllowCreateNewChild(); },
			'setter': function(value) { this.getEditor().setAllowCreateNewChild(value); }
		});
	}
});

/**
 * Controller for deleting objects (including molecules) in chem space editor.
 * @class
 * @augments Kekule.Widget.BasicEraserIaController
 *
 * @param {Kekule.Editor.BaseEditor} widget Editor of current object being installed to.
 */
Kekule.Editor.BasicMolEraserIaController = Class.create(Kekule.Editor.BasicEraserIaController,
/** @lends Kekule.Editor.BasicMolEraserIaController# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.BasicMolEraserIaController',
	/** @constructs */
	initialize: function($super, widget)
	{
		$super(widget);
	},
	/*
	 * @private
	 */
	doGetActualRemovedObjs: function(objs)
	{
		var result = [];
		Kekule.ArrayUtils.pushUnique(result, objs);
		for (var i = 0, l = objs.length; i < l; ++i)
		{
			var delObjs = objs[i].getCascadeDeleteObjs? objs[i].getCascadeDeleteObjs(): [];
			//Kekule.Editor.StructureUtils.getCascadeDeleteObjs(objs[i]);
			if (delObjs)
				Kekule.ArrayUtils.pushUnique(result, delObjs);
		}
		return result;
	},
	/** @private */
	doRemoveObjs: function(objs)
	{
		if (!objs.length)
			return;
		var operGroup = new Kekule.MacroOperation();
		var molParents = [];
		for (var i = 0, l = objs.length; i < l; ++i)
		{
			var obj = objs[i];
			var parent = obj.getParent();
			var editor = this.getEditor();
			var oper;
			if (obj instanceof /*Kekule.ChemStructureNode*/Kekule.BaseStructureNode)
			{
				oper = new Kekule.ChemStructOperation.RemoveNode(obj);
				Kekule.ArrayUtils.pushUnique(molParents, obj.getParent());
			}
			else if (obj instanceof /*Kekule.ChemStructureConnector*/Kekule.BaseStructureConnector)
			{
				oper = new Kekule.ChemStructOperation.RemoveConnector(obj);
				Kekule.ArrayUtils.pushUnique(molParents, obj.getParent());
			}
			else
			{
				oper = new Kekule.ChemObjOperation.Remove(obj);
			}
			if (oper)
				operGroup.add(oper);
		}
		// check if molecules need to be splitted
		for (var i = 0, l = molParents.length; i < l; ++i)
		{
			var mol = molParents[i];
			if (mol && (mol instanceof Kekule.StructureFragment))
			{
				var standardizeOper = new Kekule.ChemStructOperation.StandardizeStructFragment(mol);
				standardizeOper.setEnableSplit(this.getEditor().canCreateNewChild());  // if can not create new child, split is disabled.
				operGroup.add(standardizeOper);
			}
		}

		operGroup.execute();
		// add to history
		if (editor && editor.getEnableOperHistory())
		{
			editor.pushOperation(operGroup);
		}
	}
});
/** @ignore */
Kekule.Editor.IaControllerManager.register(Kekule.Editor.BasicMolEraserIaController, Kekule.Editor.ChemSpaceEditor);


/**
 * Advanced controller for selecting, moving or rotating chem objects in molecule (ctab) based editor.
 * @class
 * @augments Kekule.Editor.BasicManipulationIaController
 *
 * @property {Bool} enableMagneticMerge Whether nearing node will be merged when moving their position.
 * @property {Bool} enableNodeMerge Whether node merging is allowed.
 * @property {Bool} enableNeighborNodeMerge Whether neighboring node merging is allowed.
 * @property {Bool} enableConnectorMerge Whether connector merging is allowed.
 * @property {Bool} enableStructFragmentMerge Whether node or connector merging between different molecule is allowed.
 * @property {Bool} enableConstrainedMove
 * @property {Bool} enableConstrainedRotate
 * @property {Bool} enableDirectedMove When true, pres shift key during moving will cause object moves only at X or Y direction.
 */
Kekule.Editor.BasicMolManipulationIaController = Class.create(Kekule.Editor.BasicManipulationIaController,
/** @lends Kekule.Editor.BasicMolManipulationIaController# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.BasicMolManipulationIaController',
	/** @constructs */
	initialize: function($super, editor)
	{
		$super(editor);
		this.setEnableMagneticMerge(true);
		this.setEnableNodeMerge(true);
		this.setEnableNeighborNodeMerge(true);
		this.setEnableConnectorMerge(true);
		this.setEnableStructFragmentMerge(true);
		this.setEnableConstrainedMove(true);
		this.setEnableConstrainedRotate(true);
		this.setEnableDirectedMove(true);
		this._suppressConstrainedMoving = false;  // used internally
		this._suppressConstrainedRotating = false;  // used internally
		this._isInDirectedMoving = false;
		this._directedMovingDirection = null;  // used internally
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('enableMagneticMerge', {'dataType': DataType.BOOL});
		this.defineProp('enableNodeMerge', {'dataType': DataType.BOOL});
		this.defineProp('enableNeighborNodeMerge', {'dataType': DataType.BOOL});
		this.defineProp('enableConnectorMerge', {'dataType': DataType.BOOL});
		this.defineProp('enableStructFragmentMerge', {'dataType': DataType.BOOL});
		//this.defineProp('mergeOperation', {'dataType': 'Kekule.MacroOperation', 'serializable': false});  // store operation of merging nodes
		//this.defineProp('connectorMergeOperation', {'dataType': 'Kekule.Operation', 'serializable': false});  // store operation of merging
		this.defineProp('allManipulateObjsMerged', {'dataType': DataType.BOOL, 'serializable': false});  // store whether a merge operation merges all current objects
		this.defineProp('isMergeDone', {'dataType': DataType.BOOL, 'serializable': false});  // store whether a merge operation is done
		this.defineProp('enableConstrainedMove', {'dataType': DataType.BOOL, 'serializable': false});
		this.defineProp('enableConstrainedRotate', {'dataType': DataType.BOOL, 'serializable': false});
		this.defineProp('enableDirectedMove', {'dataType': DataType.BOOL, 'serializable': false});

		this.defineProp('mergeOperations', {'dataType': DataType.ARRAY, 'serializable': false});  // store operations of merging
		//this.defineProp('prevMergeOperations', {'dataType': DataType.ARRAY, 'serializable': false});  // store operations of merging of last phrase
		this.defineProp('mergingDests', {'dataType': DataType.ARRAY, 'serializable': false});  // private
	},

	/** @private */
	canInteractWithObj: function($super, obj)
	{
		return $super(obj) || (this._isMerging && obj);
	},

	/** @ignore */
	doSetManipulateObjs: function($super, value)
	{
		// When merging just node to another, operating node will be removed from
		// space temporily, add dest mol to operating objs avoid the disappearing of
		// mol in editor when using operContext
		var objs = value? AU.clone(value): [];
		if (this.getMergingDests())
		{
			AU.pushUnique(objs, this.getMergingDests());
		}
		this.setPropStoreFieldValue('manipulateObjs', value);
		if (!value)
			this.getEditor().endOperatingObjs();
		else
			this.getEditor().prepareOperatingObjs(objs);
	},

	/**
	 * Check if currently is in constrained move mode.
	 * That is to say, have not select any object, directly move a node and the node has only one connector connected.
	 * In that case, original connector length should be retained.
	 * @returns {Bool}
	 * @private
	 */
	isConstrainedMove: function()
	{
		if (!this.getEnableConstrainedMove())
			return false;
		/*
		 if (this._suppressConstrainedMoving)
		 return false;
		 */
		var objs = this.getManipulateObjs();
		if (objs.length === 1)
		{
			var obj = objs[0];
			var selection = this.getEditor().getSelection();
			if (selection && (selection.indexOf(obj) < 0))
			{
				if (obj instanceof Kekule.ChemStructureNode)
				{
					return (obj.getLinkedObjs().length === 1);
				}
			}
		}
		return false;
	},
	/**
	 * Check if currently is in constrained rotate mode.
	 * In that mode, objects can only be rotate to some certain angle.
	 * @returns {Bool}
	 * @private
	 */
	isConstrainedRotate: function()
	{
		return this.getEnableConstrainedMove();
	},
	/**
	 * Check if currently is in directed move mode.
	 * @returns {Bool}
	 * @private
	 */
	isDirectedMove: function()
	{
		return (this.getEnableDirectedMove() && (!this.isConstrainedMove()) && this._isInDirectedMoving);
	},

	/** @private */
	createManipulateObjInfo: function($super, obj, startContextCoord)
	{
		var editor = this.getEditor();
		var info = $super(obj, startContextCoord);
		var isConstrained = this.isConstrainedMove();
		if (isConstrained)  // constrained move, store connector length into info
		{
			var connector = obj.getLinkedConnectors()[0];
			var connectedNode = obj.getLinkedObjs()[0];
			if (connector && connectedNode)
			{
				info.isConstrained = true;
				if (!info.hasNoCoord)
				{
					info.originScreenCoord = editor.getObjectScreenCoord(obj);
					info.refScreenCoord = editor.getObjectScreenCoord(connectedNode);

					info.connectorScreenLength = Kekule.CoordUtils.getDistance(info.screenCoord, info.refScreenCoord);
					info.connectorObjLength = connector.getLength(this.getEditor().getCoordMode(), this.getEditor().getAllowCoordBorrow());
					var delta = Kekule.CoordUtils.substract(info.originScreenCoord, info.refScreenCoord);
					info.originBondDirectionAngle = Math.atan2(delta.y, delta.x);
					//console.log('create Info', info.screenCoord, info.refScreenCoord, info.connectorScreenLength);
					info.constrainedBondDirectionDelta = this.getEditorConfigs().getStructureConfigs().getBondConstrainedDirectionDelta();
					info.constrainedBondDirectionAngles = this.getEditorConfigs().getStructureConfigs().getBondConstrainedDirectionAngles();
					info.constrainedBondDirectionAngleThreshold = this.getEditorConfigs().getStructureConfigs().getBondConstrainedDirectionAngleThreshold();
				}
			}
		}
		return info;
	},
	/** @private */
	_calcActualMovedScreenCoord: function($super, obj, info, newScreenCoord)
	{
		var C = Kekule.CoordUtils;
		var result;
		var screenCoord = newScreenCoord;
		if (info.isConstrained && (!this._suppressConstrainedMoving))  // constrained, need to reserve bond length, recalc coord
		{
			var constrainedBondDirectionDelta = info.constrainedBondDirectionDelta || null;
			var constrainedBondDirectionAngles = info.constrainedBondDirectionAngles || null;
			var constrainedBondDirectionAngleThreshold = info.constrainedBondDirectionAngleThreshold || null;
			var directionAngleResolved = false;
			var directionAngle;
			var currVector = C.substract(newScreenCoord, info.refScreenCoord);
			var currDirection = Math.atan2(currVector.y, currVector.x);

			if (constrainedBondDirectionAngles && constrainedBondDirectionAngleThreshold)
			{
				for (var i = 0, l = constrainedBondDirectionAngles.length; i < l; ++i)
				{
					var dAngle = constrainedBondDirectionAngles[i];
					if (Math.abs(dAngle - currDirection) <= constrainedBondDirectionAngleThreshold)
					{
						directionAngleResolved = true;
						directionAngle = dAngle;
					}
				}
			}

			if (!directionAngleResolved && constrainedBondDirectionDelta)
			{
				var step = Math.round((currDirection - info.originBondDirectionAngle) / constrainedBondDirectionDelta);
				//console.log()
				directionAngle = info.originBondDirectionAngle + step * constrainedBondDirectionDelta;
				directionAngleResolved = true;
			}

			if (!directionAngleResolved)
				directionAngle = currDirection;

			result = C.add(info.refScreenCoord,
				{'x': info.connectorScreenLength * Math.cos(directionAngle), 'y': info.connectorScreenLength * Math.sin(directionAngle)});
			//console.log(directionAngle, result);
			/*
			 var currLength = C.getDistance(screenCoord, info.refScreenCoord);
			 if (currLength !== info.connectorScreenLength)
			 {
			 var ratio = info.connectorScreenLength / currLength;
			 var delta = C.substract(screenCoord, info.refScreenCoord);
			 //console.log('constrained', info, ratio);
			 result = C.add(info.refScreenCoord, C.multiply(delta, ratio));
			 //console.log(result, info.connectorScreenLength, C.getDistance(result, info.refScreenCoord));
			 }
			 */
		}
		else
			result = screenCoord;

		return result;
	},
	/** @private */
	_calcActualRotateAngle: function($super, objs, newDeltaAngle, oldAbsAngle, newAbsAngle)
	{
		var isConstrained = (this.isConstrainedRotate() && (!this._suppressConstrainedRotating));
		var angleStep = isConstrained?
			this.getEditorConfigs().getInteractionConfigs().getConstrainedRotateStep(): null;

		if (angleStep)
		{
			var times = Math.floor(newDeltaAngle / angleStep);
			return times * angleStep;
		}
		else
			return $super(objs, newDeltaAngle, oldAbsAngle, newAbsAngle);
	},

	/** @private */
	prepareManipulating: function($super, manipulationType, manipulatingObjs, startScreenCoord, startBox, rotateCenter)
	{
		/*
		this.setIsMergeDone(false);
		this.setMergeOperation(null);
		*/
		this.setMergeOperations([]);
		//this.setPrevMergeOperations([]);
		$super(manipulationType, manipulatingObjs, startScreenCoord, startBox, rotateCenter);
		//this._mergeReversed = false;  // internal flag
		this._directedMovingDirection = null;
		this.setManuallyHotTrack(true);  // manully hot track
		//console.log('start', this.getManuallyHotTrack());
	},

	/** @ignore */
	stopManipulate: function($super)
	{
		/*
		if (this.getMergeOperations().length)
			this.executeMergeOpers();
		*/
		//this.setMergeOperations([]);
		$super();
		this.setManuallyHotTrack(false);
		//console.log('stop', this.getManuallyHotTrack());
	},
	/** @ignore */
	cancelManipulatingObjs: function($super)
	{
		$super();
		this.setManuallyHotTrack(false);
	},

	/** @ignore */
	createManipulateOperation: function($super)
	{
		$super();
		this.setMergeOperations([]);
	},

	/** @ignore */
	getAllObjOperations: function($super)
	{
		/*
		var moveOpers = this.getMoveOperations();
		var mergeOpers = this.getMergeOperations();
		var count = Math.max(moveOpers.length, mergeOpers.length);
		var result = [];
		for (var i = 0; i < count; ++i)
		{
			if (mergeOpers[i])
				result.push(mergeOpers[i]);
			else
				result.push(moveOpers[i]);
		}
		return result;
		*/
		var result = $super() || [];
		var mergeOpers = this.getMergeOperations();
		if (mergeOpers && mergeOpers.length)
			Kekule.ArrayUtils.pushUnique(result, mergeOpers);
		return result;
	},

	/** @private */
	_canMergeNodes: function(targetNode, destNode)
	{
		var allowMolMerge = this.getEnableStructFragmentMerge();
		var allowNeighborNodeMerge = this.getEnableNeighborNodeMerge();
		if (this.getEnableNodeMerge())
		{
			/*
			if (this.getEnableStructFragmentMerge())
				result = true;
			else
				result = (targetNode.getParent() === destNode.getParent());
			*/
			return Kekule.ChemStructOperation.MergeNodes.canMerge(targetNode, destNode, allowMolMerge, allowNeighborNodeMerge);
		}
		else
			return false;
	},
	/** @private */
	_canMergeConnectors: function(targetConnector, destConnector)
	{
		var allowMolMerge = this.getEnableStructFragmentMerge();
		if (this.getEnableConnectorMerge())
		{
			return Kekule.ChemStructOperation.MergeConnectors.canMerge(targetConnector, destConnector, allowMolMerge);
		}
		else
			return false;
	},

	/** @private */
	_findSuitableMergeTargetBoundInfo: function(boundInfos, excludedObjs, targetClass, checkFunc)
	{
		for (var i = boundInfos.length - 1; i >= 0; --i)
		{
			var info = boundInfos[i];
			var obj = info.obj;
			if (excludedObjs.indexOf(obj) >= 0)
				continue;
			if (!(obj instanceof targetClass))
				continue;
			if (checkFunc && !checkFunc(obj))
				continue;
			return info;
		}
		return null;
	},

	/** @private */
	_getMagneticNodeMergeDest: function(node, nodeScreenCoord, excludedObjs)
	{
		var editor = this.getEditor();
		var self = this;
		var filterFunc = function(bound)
		{
			var obj = bound.obj;
			return (node !== obj) && (excludedObjs.indexOf(obj) < 0)
					&& (obj instanceof Kekule.ChemStructureNode)
					&& self._canMergeNodes(node, obj);
		};
		if (nodeScreenCoord)
		{
			var boundInfos = editor.getBoundInfosAtCoord(nodeScreenCoord, filterFunc);
			//console.log('boundInfos', boundInfos);
			/*
			var overlapBoundInfo = this._findSuitableMergeTargetBoundInfo(boundInfos, excludedObjs, Kekule.ChemStructureNode,
					function(destObj)
					{
						return self._canMergeNodes(node, destObj);
					}
			);
			*/
			var overlapBoundInfo = boundInfos.length? boundInfos[boundInfos.length - 1]: null;
			return overlapBoundInfo? overlapBoundInfo.obj: null;
		}
		else
			return null;
	},

	/** @ignore */
	moveManipulatedObjs: function($super, endScreenCoord)
	{
		var actualEndCoord;  // = Object.extend({}, endScreenCoord);
		//console.log(this.isDirectedMove(), this._isInDirectedMoving);
		if (this.isDirectedMove())
		{
			var C = Kekule.CoordUtils;
			var startCoord = this.getStartCoord();
			var distance = C.getDistance(startCoord, endScreenCoord);
			var delta = C.substract(endScreenCoord, startCoord);
			var directedDirection = this._directedMovingDirection;
			if (this._directedMovingDirection)  // already set direction
			{

			}
			else  // not set, need calculate
			{
				directedDirection = (Math.abs(delta.x) >= Math.abs(delta.y))? 'x': 'y';
				if (distance < this.getEditor().getEditorConfigs().getInteractionConfigs().getDirectedMoveDistanceThreshold())
				{
					// do nothing
				}
				else  // set _directedMovingDirection
				{
					this._directedMovingDirection = directedDirection;
				}
			}

			actualEndCoord = Object.extend({}, startCoord);
			actualEndCoord[directedDirection] = endScreenCoord[directedDirection];
		}
		else  // normal move
			actualEndCoord = endScreenCoord;
		return $super(actualEndCoord);
	},

	/** @ignore */
	applyManipulatingObjsInfo: function($super, endScreenCoord)
	{
		this.setAllManipulateObjsMerged(false);
		var editor = this.getEditor();
		editor.hotTrackOnObj(null);  // clear old hot track objects

		var MT = Kekule.Editor.BasicManipulationIaController.ManipulationType;
		var manipulateType = this.getManipulationType();
		var originManipulatedObjs = this.getManipulateOriginObjs();
		var manipulatedObjs = this.getManipulateObjs();

		var excludedObjs = [].concat(originManipulatedObjs);
		Kekule.ArrayUtils.pushUnique(excludedObjs, manipulatedObjs);
		var oldMergeOpers = this.getMergeOperations();
		//var allowMolMerge = this.getEnableStructFragmentMerge();
		var self = this;

		var objCanBeMerged = function(obj)
		{
			if (obj instanceof Kekule.StructureFragment)
				return false;
			else
				return (obj instanceof Kekule.ChemStructureNode) || (obj instanceof Kekule.ChemStructureConnector);
		} ;

		// handle mouse position merge and magnetic merge here

		var isMovingOneBond = (originManipulatedObjs.length === 1) && (originManipulatedObjs[0] instanceof Kekule.ChemStructureConnector);
		var isMovingOneNode = (manipulatedObjs.length === 1) && (manipulatedObjs[0] instanceof Kekule.ChemStructureNode) && objCanBeMerged(manipulatedObjs[0]);
		if (!isMovingOneBond && this.getEnableMagneticMerge())
		{
			var currManipulateInfoMap = this.getManipulateObjCurrInfoMap();
			var manipulateInfoMap = this.getManipulateObjInfoMap();
			var self = this;
			var magneticMergeObjIndexes = [];
			var magneticMergeObjs = [];
			var magneticMergeDests = [];
			// filter out all merge nodes
			//console.log('manipulate objects count', manipulatedObjs.length);
			for (var i = 0, l = manipulatedObjs.length; i < l; ++i)
			{
				var obj = manipulatedObjs[i];
				if (!objCanBeMerged(obj))
					continue;
				var currInfo = currManipulateInfoMap.get(obj);
				var currCoord = currInfo.screenCoord;
				if (currCoord)
				{
					var boundInfos = editor.getBoundInfosAtCoord(currCoord);
					/*
					 var overlapBoundInfo = this._findSuitableMergeTargetBoundInfo(boundInfos, excludedObjs, Kekule.ChemStructureNode,
					 function(destObj)
					 {
					 return self._canMergeNodes(obj, destObj);
					 }
					 );
					 if (overlapBoundInfo && overlapBoundInfo.obj)  // may merge, store info
					 */
					var mergeDest = this._getMagneticNodeMergeDest(obj, currCoord, excludedObjs);
					if (mergeDest)  // may merge, store info
					{
						magneticMergeObjIndexes.push(i);
						magneticMergeObjs.push(obj);
						magneticMergeDests.push(mergeDest);
						//console.log('check merge ok on', i);
					}
					else
					{
						//console.log('check merge fail on', i, currCoord);
					}
				}
			}
			if (magneticMergeObjs.length)  // has merge items
			{
				var mergedObjCount = magneticMergeObjs.length;
				this.setAllManipulateObjsMerged(mergedObjCount === manipulatedObjs.length);
				/*
				 if (this.getAllManipulateObjsMerged())
				 console.log('all merged!', mergedObjCount);
				 */
				// If merge on only one node, other node position may also be changed
				// e.g. add repository ring structure to another node
				var needCreateNewMerge = (mergedObjCount <= 1); //false;
				// check if need create new merge operation
				if (!needCreateNewMerge)
				{
					for (var i = 0, l = magneticMergeObjs.length; i < l; ++i)
					{
						var obj = magneticMergeObjs[i];
						var dest = magneticMergeDests[i];
						var index = magneticMergeObjIndexes[i];
						var oldMergeOper = oldMergeOpers[index];
						if (!oldMergeOper || !this.isSameNodeMerge(oldMergeOper, obj, dest))
						{
							//console.log('need new', oldMergeOper, obj.getId(), dest.getId(), index);
							needCreateNewMerge = true;
							break;
						}
					}
				}

				if (needCreateNewMerge)
				{
					// console.log('reverse old merge', mergedObjCount);
					this.reverseMergeOpers();

					// also need to adjust position of rest manipulatedObjs
					var CU = Kekule.CoordUtils;
					if ((mergedObjCount === 1) || (editor.getCoordMode() === Kekule.CoordMode.COORD3D))
					{
						var currInfo = currManipulateInfoMap.get(magneticMergeObjs[0]);
						var currCoord = currInfo.screenCoord;
						var destCoord = editor.getObjectScreenCoord(magneticMergeDests[0]);
						var coordTranslate = CU.substract(destCoord, currCoord);
						// change all currInfo coord, and redo apply job
						var needReApply = false;
						for (var i = 0, l = manipulatedObjs.length; i < l; ++i)
						{
							var obj = manipulatedObjs[i];
							if (obj !== magneticMergeObjs[0])
							{
								var info = currManipulateInfoMap.get(obj);
								if (info.screenCoord)
								{
									var newCoord = CU.add(info.screenCoord, coordTranslate);
									info.screenCoord = newCoord;
									if (this._getMagneticNodeMergeDest(obj, newCoord, excludedObjs))  // move position can do another magnetic merge
										needReApply = true;
								}
								//this.applySingleManipulatingObjInfo(i, obj, info, endScreenCoord);
							}
						}
						if (needReApply)
						{
							return this.applyManipulatingObjsInfo(endScreenCoord);
						}
						else
						{
							for (var i = 0, l = manipulatedObjs.length; i < l; ++i)
							{
								var obj = manipulatedObjs[i];
								if (obj !== magneticMergeObjs[0])
								{
									var info = currManipulateInfoMap.get(obj);
									this.applySingleManipulatingObjInfo(i, obj, info, endScreenCoord);
								}
							}
						}
					}
					else if ((mergedObjCount > 1) && (editor.getCoordMode() !== Kekule.CoordMode.COORD3D))  // 2 or more, first two one decide all others' position
					{
						var obj0 = magneticMergeObjs[0];
						var obj1 = magneticMergeObjs[1];
						var coordObj0 = manipulateInfoMap.get(obj0).screenCoord;
						var coordObj1 = manipulateInfoMap.get(obj1).screenCoord;
						//console.log(coordObj0, coordObj1, manipulateInfoMap.get(obj0));

						/*
						 var distanceObj = CU.getDistance(coordObj0, coordObj1);
						 var deltaObj = CU.substract(coordObj1, coordObj0);
						 var angleObj = Math.atan2(deltaObj.y, deltaObj.x);
						 */

						var coordDest0 = editor.getObjectScreenCoord(magneticMergeDests[0]);
						var coordDest1 = editor.getObjectScreenCoord(magneticMergeDests[1]);
						/*
						 var distanceDest = CU.getDistance(coordDest0, coordDest1);
						 var deltaDest = CU.substract(coordDest1, coordDest0);
						 var angleDest = Math.atan2(deltaDest.y, deltaDest.x);

						 var coordDelta = CU.substract(coordDest0, coordObj0);
						 //console.log(coordDelta, coordDest0, coordObj0);

						 var transParam = {
						 'translateX': coordDelta.x,
						 'translateY': coordDelta.y,
						 'scale': distanceDest / distanceObj,
						 'rotateAngle': angleDest - angleObj,
						 'center': coordObj0  //coordDest0
						 }
						 */
						// TODO: currently only handle 2D situation
						var transParam = CU.calcCoordGroup2DTransformParams(coordObj0, coordObj1, coordDest0, coordDest1);
						//console.log(transParam, transParam.rotateAngle * 180 / Math.PI);
						var matrix = CU.calcTransform2DMatrix(transParam);

						// change all currInfo coord, and redo apply job
						var needReApply = false;
						for (var i = 0, l = manipulatedObjs.length; i < l; ++i)
						{
							var obj = manipulatedObjs[i];
							if (magneticMergeObjs.indexOf(obj) < 0)
							{
								var info = manipulateInfoMap.get(obj);
								var currInfo = currManipulateInfoMap.get(obj);
								if (info.screenCoord)
								{
									var newCoord = CU.transform2DByMatrix(info.screenCoord, matrix);
									currInfo.screenCoord = newCoord;
									if (this._getMagneticNodeMergeDest(obj, newCoord, excludedObjs))  // move position can do another magnetic merge
										needReApply = true;
								}
								if (info.size)
									currInfo.size = CU.multiply(info.size, transParam.scale);

								//this.applySingleManipulatingObjInfo(i, obj, currInfo, endScreenCoord);
							}
						}

						if (needReApply)
							return this.applyManipulatingObjsInfo(endScreenCoord);
						else
						{
							for (var i = 0, l = manipulatedObjs.length; i < l; ++i)
							{
								var obj = manipulatedObjs[i];
								if (magneticMergeObjs.indexOf(obj) < 0)
								{
									var currInfo = currManipulateInfoMap.get(obj);
									this.applySingleManipulatingObjInfo(i, obj, currInfo, endScreenCoord);
								}
							}
						}
					}

					for (var i = 0, l = mergedObjCount; i < l; ++i)
					{
						var obj = magneticMergeObjs[i];
						var dest = magneticMergeDests[i];
						var index = magneticMergeObjIndexes[i];
						var mergeOper = this.createNodeMergeOperation(obj, dest);
						this.getMergeOperations()[index] = mergeOper;
					}
					//console.log('execute merge on', mergedObjCount);
					this.executeMergeOpers();
				}

				//console.log('hot track on', magneticMergeDests.length, mergedObjCount, magneticMergeObjs.length);
				editor.hotTrackOnObj(magneticMergeDests);

				return;
			}
		}

		// check if do magnetic merge

		// then check if mouse position merge
		if (manipulateType === MT.MOVE)
		{
			var doMousePosMerge = false;

			if ((isMovingOneBond && this.getEnableConnectorMerge()) || (isMovingOneNode && this.getEnableNodeMerge()))
			{
				// check if endScreenCoord (mouse position) overlap with an existing object
				var overlapedObj;
				var boundInfos = editor.getBoundInfosAtCoord(endScreenCoord);
				var targetClass = isMovingOneBond? Kekule.ChemStructureConnector: Kekule.ChemStructureNode;
				var targetObj = isMovingOneBond? originManipulatedObjs[0]: manipulatedObjs[0];
				var checkFunc = isMovingOneBond?
					function(obj)
					{
						return self._canMergeConnectors(targetObj, obj);
					}:
					function(obj)
					{
						return self._canMergeNodes(targetObj, obj);
					};
				var overlapBoundInfo = this._findSuitableMergeTargetBoundInfo(boundInfos, excludedObjs, targetClass, checkFunc);
				if (overlapBoundInfo)  // has bound info, do merge
				{
					var destObj = overlapBoundInfo.obj;
					//console.log('can merge to', destObj.getClassName());
					if (destObj)
					{
						this.setAllManipulateObjsMerged(true);
						// can actual do merge, hot track on editor
						editor.hotTrackOnObj(destObj);

						var oldMergeOper = oldMergeOpers[0];
						if ((isMovingOneBond && this.isSameConnectorMerge(oldMergeOper, targetObj, destObj))
							|| (isMovingOneNode && this.isSameNodeMerge(oldMergeOper, targetObj, destObj)))  // merged already in last phrase
						{
							//console.log('!!!!same merge!!!!!');
							return;
							// do nothing here
						}
						else
						{
							if (oldMergeOper)
							{
								this.reverseMergeOpers();
							}

							var mergeOper = isMovingOneBond?
								this.createConnectorMergeOperation(targetObj, destObj):
								this.createNodeMergeOperation(targetObj, destObj);
							this.getMergeOperations()[0] = mergeOper;

							//mergeOper.execute();
							this.executeMergeOpers();
							return;
						}
					}
				}
			}
		}

		// no merge, just reverse old one and do normal move
		this.reverseMergeOpers();

		$super(endScreenCoord);
	},

	/**
	 * @private
	 * @deprecated
	 */
	doMoveManipulatedObj_old: function($super, objIndex, obj, newScreenCoord, moverScreenCoord)
	{
		var editor = this.getEditor();

		var info = this.getManipulateObjInfoMap().get(obj);
		//var actualNewScreenCoord = this._calcActualMovedScreenCoord(obj, info, newScreenCoord);
		var actualNewScreenCoord = newScreenCoord;

		var manipulatedObjs = this.getManipulateOriginObjs(); //this.getManipulateObjs();
		var manipulateType = this.getManipulationType();

		var isMovingBond = (manipulateType === Kekule.Editor.BasicManipulationIaController.ManipulationType.MOVE)
			&& (manipulatedObjs.length === 1) && (manipulatedObjs[0] instanceof Kekule.ChemStructureConnector);

		// check if magnetic merge
		var coord = actualNewScreenCoord;
		var mergeOper = null;
		//var merged = false;
		var mergeOpers = this.getMergeOperations();
		var oldMergeOper = mergeOpers[objIndex];

		var currManipulatingObjs = this.getManipulateObjs();

		if (!isMovingBond && this.getEnableMagneticMerge() && (obj instanceof Kekule.ChemStructureNode))
		{
			var boundInfos = editor.getBoundInfosAtCoord(coord);
			if (boundInfos && boundInfos.length)  // may magnetic merge
			{
				for (var i = boundInfos.length - 1; i >= 0; --i)
				{
					var info = boundInfos[i];
					var boundObj = info.obj;
					if (boundObj === obj)
						continue;
					if (currManipulatingObjs.indexOf(boundObj) >= 0)
						continue;


					if (boundObj instanceof Kekule.ChemStructureNode)  // node on node, may merge
					{
						if (this._canMergeNodes(obj, boundObj))  // do merge
						{
							editor.addHotTrackedObj(boundObj);
							if (this.isSameNodeMerge(oldMergeOper, obj, boundObj))
								return;
							mergeOper = this.createNodeMergeOperation(obj, boundObj);
							//editor.hotTrackOnObj(boundObj);
							//console.log('add hot track', boundObj.getId(), editor.getHotTrackedObjs());
							//console.log('merge on', boundObj);
							break;
						}
					}
				}
				if (!mergeOper)
				{
					editor.hotTrackOnObj(null);
					//console.log('can not merge');
				}
				else  // actually do merge
				{
					if (oldMergeOper)
					{
						this.reverseMergeOpers(objIndex);
					}
					this.getMergeOperations()[objIndex] = mergeOper;
					//this.getPrevMergeOperations()[objIndex] = null;  // avoid this oper be reversed in following old manipulation

					//mergeOper.execute();
					this.executeMergeOpers();
				}
			}
		}

		/*
		if (mergeOper)  // do magnetic merge
			return;
		*/

		//console.log('move', objIndex, newContextCoord);

		// try do mouse pointed merge
		var coord = moverScreenCoord;
		var merged = false;
		if ((manipulateType === Kekule.Editor.BasicManipulationIaController.ManipulationType.MOVE))
		{
			var currObj = manipulatedObjs[0];
			if (manipulatedObjs && (manipulatedObjs.length === 1))  // move object, only one obj to move, merge is possible
			{
				//console.log('may merge');
				// check if newScreenCoord overlaps with a bound item
				var boundItem = editor.getTopmostBoundInfoAtCoord(coord, [currObj]); // exclude obj, find the most top other object
				if (boundItem)  // overlaps on mouse position, may merge
				{
					var destObj = boundItem.obj;

					if (destObj && (currManipulatingObjs.indexOf(destObj) < 0))
					{
						if (isMovingBond && (currObj instanceof Kekule.ChemStructureConnector) && (destObj instanceof Kekule.ChemStructureConnector))  // merge connector
						{
							if (this.getEnableConnectorMerge())
							{
								editor.hotTrackOnObj(destObj);
								if (this.getEnableStructFragmentMerge())
									merged = true;
								else
									merged = (currObj.getParent() === destObj.getParent());
								if (merged)
								{
									mergeOper = this.createConnectorMergeOperation(currObj, destObj);
								}
							}
						}
						else if ((currObj instanceof Kekule.ChemStructureNode) && (destObj instanceof Kekule.ChemStructureNode))  // merge node
						{
							//if ((currObj.getLinkedObjs().indexOf(destObj) < 0))  // connected node can not merge
							{
								if (this._canMergeNodes(currObj, destObj))
								{
									editor.hotTrackOnObj(destObj);
									if (this.isSameNodeMerge(oldMergeOper, currObj, destObj))
									{
										return;
									}
									else
									{
										//console.log('different merge', oldMergeOper);
									}
									mergeOper = this.createNodeMergeOperation(currObj, destObj);
								}
							}
						}

						if (mergeOper)  // actually do merge
						{
							var oldMergeOper = mergeOpers[objIndex];  // important, must retrieve again, as mergeOpers[index] may be set at magnetic merge
							if (oldMergeOper)
							{
								this.reverseMergeOpers(objIndex);
							}
							this.getMergeOperations()[objIndex] = mergeOper;
							//this.getPrevMergeOperations()[objIndex] = null;  // avoid this oper be reversed in following old manipulation
							//mergeOper.execute();
							this.executeMergeOpers();
							return;
						}
					}
				}
			}
		}
		/*
		else
			$super(objIndex, obj, newScreenCoord, moverScreenCoord);
		*/

		if (!mergeOper)  // no merge available
		{
			// hide hot track
			editor.hideHotTrack();

			var prevMerged = /*!this._mergeReversed &&*/ !!this.getMergeOperations().length;
			//if (this.getMergeOperation() && (this.getMergeOperation() === this.getActiveOperation()))  // a merge operation is created and executed before
			if (prevMerged)
			{
				this.reverseMergeOpers(objIndex);
			}
			$super(objIndex, obj, newScreenCoord, moverScreenCoord);
		}
	},

	/*
	 * Add a merge operation.
	 * @param {Kekule.Operation} mergeOper
	 * @private
	 */
	/*
	addMergeOperation: function(mergeOper)
	{
		var oper = this.getMergeOperation();
		if (!oper)
		{
			oper = new Kekule.MacroOperation();
			this.setMergeOperation(oper);
		}
		oper.add(mergeOper);
	},
	*/
	/*
	 * Remove an unneed merge operation.
	 * @param {Kekule.Operation} mergeOper
	 * @private
	 */
	/*
	removeMergeOperation: function(mergeOper)
	{
		var oper = this.getMergeOperation();
		if (oper)
		{
			oper.remove(mergeOper);
			if (oper.getChildCount() <= 0)  // empty
			{
				this.setMergeOperation(null);
				oper.finalize();
			}
		}
	},
	*/
	/*
	 * Returns a merge operation related with object.
	 * @param {Kekule.ChemObject} obj
	 * @returns {Kekule.Operation}
	 * @private
	 */
	/*
	getMergeOperOnObject: function(obj)
	{
		var opers = this.getMergeOperation();
		if (opers)
		{
			var count = opers.getChildCount();
			for (var i = 0; i < count; ++i)
			{
				var oper = opers.getChildAt(i);
				if (oper.getTarget && oper.getTarget() === obj)
					return oper;
			}
		}
		return null;
	},
	*/

	/** @private */
	createNodeMergeOperation: function(fromNode, toNode)
	{
		var allowMolMerge = this.getEnableStructFragmentMerge();
		/*
		var parent = fromNode.getParent();
		if ((parent !== toNode.getParent()) && !allowMolMerge)  // not same parent, can not merge
			return null;
		*/
		if (!Kekule.ChemStructOperation.MergeNodes.canMerge(fromNode, toNode, allowMolMerge, this.getEnableNeighborNodeMerge()))
			return null;
		else
		{
			//var op = new Kekule.EditorOperation.OpMergeNodes(this.getEditor(), parent, fromNode, toNode);
			var op = new Kekule.ChemStructOperation.MergeNodes(fromNode, toNode, allowMolMerge);
			return op;
		}
	},
	/** @private */
	createConnectorMergeOperation: function(fromConnector, toConnector)
	{
		var allowMolMerge = this.getEnableStructFragmentMerge();
		if (!Kekule.ChemStructOperation.MergeConnectors.canMerge(fromConnector, toConnector, allowMolMerge))
			return null;
		else
		{
			//var op = new Kekule.EditorOperation.OpMergeNodes(this.getEditor(), parent, fromNode, toNode);
			var op = new Kekule.ChemStructOperation.MergeConnectors(fromConnector, toConnector, this.getEditor().getCoordMode(), allowMolMerge);
			return op;
		}
	},

	/** @private */
	isSameConnectorMerge: function(mergeOper, fromConnector, toConnector)
	{
		return mergeOper && (mergeOper instanceof Kekule.ChemStructOperation.MergeConnectors)
				&& (fromConnector === mergeOper.getTarget()) && (toConnector === mergeOper.getDest());
	},
	/** @private */
	isSameNodeMerge: function(mergeOper, fromNode, toNode)
	{
		//console.log('check same', fromNode.getId(), toNode.getId(), mergeOper.getTarget().getId(), mergeOper.getDest().getId());
		return mergeOper && (mergeOper instanceof Kekule.ChemStructOperation.MergeNodes)
			&& (fromNode === mergeOper.getTarget()) && (toNode === mergeOper.getDest());
	},

	/** @private */
	executeMergeOpers: function()
	{
		var opers = Kekule.ArrayUtils.toUnique(this.getMergeOperations());
		var mergingDests = [];
		for (var i = 0, l = opers.length; i < l; ++i)
		{
			if (opers[i])
			{
				opers[i].execute();
				var dest = opers[i].getDest? opers[i].getDest(): null;
				if (dest)
					AU.pushUnique(mergingDests, dest);
			}
		}
		this.setMergingDests(mergingDests.length? mergingDests: null);

		//console.log('[merge!!!!!]');
		this.refreshManipulateObjs();
		this._mergeJustReversed = false;
	},
	/** @private */
	reverseMergeOpers: function(utilIndex)
	{
		this.setMergingDests(null);
		var opers = Kekule.ArrayUtils.toUnique(this.getMergeOperations());
		if (!opers || !opers.length)
			;  // do nothing
		else
		{
			if (!utilIndex)
				utilIndex = 0;

			for (var i = opers.length - 1; i >= utilIndex; --i)
			{
				if (opers[i])
				{
					//console.log('reverse at', i, opers.length);
					opers[i].reverse();
					//delete opers[i];
				}
			}
			//this._mergeReversed = true;
			//this.setMergeOperations([]);
			//console.log('reverse merge oper', opers);
			this.getMergeOperations().length = utilIndex;
			this._mergeJustReversed = true;   // a special flag
			//console.log('reverse', this.getManipulateObjs());
			this.refreshManipulateObjs();
		}
	},

	/** @private */
	react_mousemove: function($super, e)
	{
		// check if ALT key is pressed, if so, constrained move/rotate mode should be disabled
		this._suppressConstrainedMoving = e.getAltKey();
		this._suppressConstrainedRotating = e.getAltKey();
		this._isInDirectedMoving = e.getShiftKey();
		return $super(e);
	}
});
// register
Kekule.Editor.IaControllerManager.register(Kekule.Editor.BasicMolManipulationIaController, Kekule.Editor.ChemSpaceEditor);


/**
 * Controller to add bond or change bond property.
 * @class
 * @augments Kekule.Editor.BasicMolManipulationIaController
 *
 * @property {Bool} allowBondingToBond Whether bond-bond connection (e.g., in Zeise salt) is allowed.
 * @property {Bool} enableBondModification Whether modification existing bond is enabled.
 * @property {Bool} autoSwitchBondOrder If true, click on bond will switch bond order between single, double and triple.
 * @property {Kekule.ChemStructureObject} startingObj
 * @property {Kekule.ChemStructureObject} endingObj
 * @property {String} bondType
 * @property {Int} bondOrder
 * @property {Int} bondStereo
 * //@property {Bool} autoCreateNewStructFragment Whether a new molecule is created when a bond appointed to a blank space in editor.
 */
Kekule.Editor.MolBondIaController = Class.create(Kekule.Editor.BasicMolManipulationIaController,
/** @lends Kekule.Editor.MolBondIaController# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.MolBondIaController',
	/** @construct */
	initialize: function($super, editor)
	{
		$super(editor);
		this.setState(BC.State.INITIAL);
		this.setBondOrder(Kekule.BondOrder.SINGLE);  // default is single bond
		this.setAllowBondingToBond(false);
		this.setEnableBondModification(true);
		this.setEnableSelect(false);
		this.setEnableMove(true);
		//this.setEnableRemove(false);
		this.setAutoSwitchBondOrder(false);
		this.setEnableNeighborNodeMerge(false);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('allowBondingToBond', {'dataType': DataType.BOOL, 'serializable': false});
		this.defineProp('state', {'dataType': DataType.INT, 'serializable': false});
		this.defineProp('enableBondModification', {'dataType': DataType.BOOL, 'serializable': false});
		this.defineProp('autoSwitchBondOrder', {'dataType': DataType.BOOL, 'serializable': false});

		this.defineProp('startingObj', {'dataType': 'Kekule.ChemStructureObject', 'serializable': false});
		this.defineProp('endingObj', {'dataType': 'Kekule.ChemStructureObject', 'serializable': false});
		this.defineProp('structFragment', {'dataType': 'Kekule.ChemStructureFragment', 'serializable': false});
		this.defineProp('autoCreatedStructFragment', {'dataType': 'Kekule.StructureFragment', 'serializable': false});
		this.defineProp('autoCreatedStartingObj', {'dataType': 'Kekule.ChemStructureObject', 'serializable': false});
		this.defineProp('bond', {'dataType': 'Kekule.Bond', 'serializable': false});
		this.defineProp('bondType', {'dataType': DataType.STRING, 'serializable': false});
		this.defineProp('bondOrder', {'dataType': DataType.INT, 'serializable': false});
		this.defineProp('bondStereo', {'dataType': DataType.INT, 'serializable': false});
		//this.defineProp('autoCreateNewStructFragment', {'dataType': DataType.BOOL});
		this.defineProp('initialBondDirection', {'dataType': DataType.FLOAT});
	},

	/** @private */
	_isBondDifferent: function(bond)
	{
		var stereo = this.getBondStereo();
		var BS = Kekule.BondStereo;
		if (stereo === BS.UP || stereo === BS.UP_INVERTED
			|| stereo === BS.DOWN || stereo === BS.DOWN_INVERTED)  // can swith between normal and inverted
			return true;
		else
			return (bond.getBondType() !== this.getBondType())
				|| (bond.getBondOrder() !== this.getBondOrder())
				|| (bond.getStereo() !== this.getBondStereo());
	},

	/** @private */
	canInteractWithObj: function($super, obj)
	{
		var state = this.getState();
		//console.log(state, BC.State.INITIAL);
		if (state === BC.State.INITIAL)
		{
			if (obj instanceof Kekule.ChemStructureNode)
				return true;
			else if (obj instanceof Kekule.ChemStructureConnector)
			{
				if (this.getAllowBondingToBond())
					return true;
				else if (this.getEnableBondModification())
				{
					if (obj instanceof Kekule.Bond)
					{
						/*
						//console.log(obj.getBondOrder(), this.getBondOrder());
						return this.getAutoSwitchBondOrder()
							|| (obj.getBondOrder() !== this.getBondOrder());
						*/
						return this._isBondDifferent(obj);
					}
				}
				else return false;
			}
		}
		else
			return $super(obj);
	},

	/** @ignore */
	doTestMouseCursor: function(coord, e)
	{
			return '';  // do not change mouse cursor
	},

	/**
	 * Check if a object can be a valid starting or ending point of bond.
	 * @private
	 */
	isObjValidBondTerminator: function(obj)
	{
		if (!obj)
			return false;
		if (!this.getAllowBondingToBond())  // allow only node to be a starting/ending point
			return (obj instanceof Kekule.ChemStructureNode);
		else  // allow bond-bond connection, every object can be a starting/ending point
			return ((obj instanceof Kekule.ChemStructureNode) || (obj instanceof Kekule.ChemStructureConnector));
	},
	/**
	 * Check if an object is a modifiable bond.
	 * @param {Object} obj
	 */
	isBond: function(obj)
	{
		return (obj instanceof Kekule.Bond);
	},

	/** @private */
	getNewBondDefAngle: function(startObj, newBondOrder)
	{
		var structConfig = this.getEditorConfigs().getStructureConfigs();
		/*
		var result;
		var surroundingObjs = Kekule.Editor.StructureUtils.getSurroundingObjs(startObj);
		if (surroundingObjs.length === 1)  // one existing bond, defAngle is decided by new bond order and existing bond order
		{
			var existingConnector = startObj.getLinkedConnectorAt(0);
			if (existingConnector && (existingConnector.getConnectedObjs().indexOf(surroundingObjs[0]) >= 0))
			{
				var existingBondOrder = existingConnector.getBondOrder? existingConnector.getBondOrder(): null;
				if (Kekule.ObjUtils.notUnset(existingBondOrder))
					result = structConfig.getDefAngleOfBonds(newBondOrder, existingBondOrder);
				//result = Math.max(result, structConfig.getDefAngleOfBond(existingBondOrder));
			}
		}
		else if (surroundingObjs.length === 0)  // no connected bond, use initialDirection
			result = structConfig.getInitialBondDirection();
		else
			result = structConfig.getDefAngleOfBonds(newBondOrder, 0);
		return result;
		*/
		return structConfig.getNewBondDefAngle(startObj, newBondOrder);
	},

	/** @private */
	addDefBond: function(startCoord, startObj, notifyEditor)
	{
		var result;
		var editor = this.getEditor();
		editor.beginUpdateObject();
		try
		{
			if (!startObj)  // add bond from blank, create new node or growing existing blank molecule
			{
				//if (!this.getEditor().getAutoCreateNewStructFragment())
				if (!this.getEditor().canAddUnconnectedStructFragment())
					return null;
				var objCoord = this.getEditor().screenCoordToObj(startCoord);
				var baseMol = this.getEditor().getOnlyOneBlankStructFragment();
				if (!baseMol)  // totally blank space
				{
					startObj = this.getEditor().createNewStructFragmentAndStartingAtom(null, objCoord);
					this.setAutoCreatedStartingObj(null);
					this.setAutoCreatedStructFragment(startObj? startObj.getParent(): null);
				}
				else  // create on base Mol
				{
				  startObj = this.getEditor().createStructStartingAtom(baseMol, null, objCoord);
					this.setAutoCreatedStructFragment(null);
					this.setAutoCreatedStartingObj(startObj);
				}
			}
			else
			{
				this.setAutoCreatedStartingObj(null);
				this.setAutoCreatedStructFragment(null);
			}

			if (this.isObjValidBondTerminator(startObj))
			{
				var editor = this.getEditor();
				// set starting point
				this.setStartingObj(startObj);
				var parent = startObj.getParent();
				this.setStructFragment(parent); // IMPORTANT, save current parent, as molecule may be merged during operation
				var structConfigs = this.getEditorConfigs().getStructureConfigs();
				// add a bond at preferred position
				var bondType = Kekule.oneOf(this.getBondType(), structConfigs.getDefBondType());
				var bondOrder = Kekule.oneOf(this.getBondOrder(), structConfigs.getDefBondOrder());
				var bondStereo = Kekule.oneOf(this.getBondStereo(), Kekule.BondStereo.NONE);
				//var bondLength = this.getEditor().getDefBondLength();
				var bondLength = editor.getDefBondLength? editor.getDefBondLength(): structConfigs.getDefBondLength();
				var defbondAngle = this.getNewBondDefAngle(startObj, bondOrder);  //structConfigs.getDefAngleOfBond(bondOrder);
				var endCoord = Kekule.Editor.StructureUtils.calcPreferred2DBondGrowingLocation(startObj, bondLength, defbondAngle, this.getEditor().getAllowCoordBorrow());
				//console.log('add bond', bondLength, startCoord, objCoord, endCoord);
				// create a node and a new bond
				var node = this.getEditor().createDefaultNode(endCoord, Kekule.Editor.CoordSys.OBJ, parent);
				//parent.appendNode(node);
				this.setEndingObj(node);

				var bond = new Kekule.Bond();
				bond.setBondType(bondType);
				bond.setBondOrder(bondOrder);
				bond.setStereo(bondStereo);
				parent.appendConnector(bond);
				bond.appendConnectedObj(startObj);
				bond.appendConnectedObj(node);
				this.setBond(bond);

				if (notifyEditor)
				{
					this.getEditor().objectsChanged([bond, node]);
				}
				result = endCoord;
			}
			else
				result = null;
		}
		finally
		{
			editor.endUpdateObject();
		}
		return result;
	},

	/** @private */
	addOperationToEditor: function($super)
	{
		/*
		if (this.getAllManipulateObjsMerged())
			return null;
		else
		*/
		return $super();
	},
	/** @ignore */
	getAllObjOperations: function($super)
	{
		var result = $super() || [];
		var op = this.getAddBondOperation();
		if (op)
			result.unshift(op);
		return result;
	},

	/** @private */
	getAddBondOperation: function()
	{
		var group = new Kekule.MacroOperation();
		// new add node / bond operation
		var editor = this.getEditor();
		var mol = this.getAutoCreatedStructFragment();
		if (mol)
		{
			var addMolOperation = new Kekule.ChemObjOperation.Add(mol, this.getEditor().getChemObj(), null);
			group.add(addMolOperation);
		}
		var startObj = this.getStartingObj();
		var endObj = this.getEndingObj();
		var bond = this.getBond();
		//var parent = startObj.getParent();
		var parent = this.getStructFragment();

		var node = this.getAutoCreatedStartingObj();
		if (node)
		{
			var addNodeOperation = new Kekule.ChemStructOperation.AddNode(node, parent);
			group.add(addNodeOperation);
		}

		var addNodeOperation = new Kekule.ChemStructOperation.AddNode(endObj, parent);
		group.add(addNodeOperation);
		var addConnectorOperation = new Kekule.ChemStructOperation.AddConnector(bond, parent, null, [startObj, endObj]);
		group.add(addConnectorOperation);

		return group;
	},
	/* @private */
	/*
	wrapAddBondOperation: function()
	{
		if (this.getAllManipulateObjsMerged())  // bond been merged into old molecule, do not need to add operation
		{
			return null;
		}

		var moveOperation = this.getActiveOperation();  // move operation
		var group = new Kekule.MacroOperation();

		// new add node / bond operation
		var editor = this.getEditor();
		var mol = this.getAutoCreatedStructFragment();
		if (mol)
		{
			var addMolOperation = new Kekule.ChemObjOperation.Add(mol, this.getEditor().getChemObj(), null);
			group.add(addMolOperation);
		}
		var startObj = this.getStartingObj();
		var endObj = this.getEndingObj();
		var bond = this.getBond();
		//var parent = startObj.getParent();
		var parent = this.getStructFragment();
		var addNodeOperation = new Kekule.ChemStructOperation.AddNode(endObj, parent);
		group.add(addNodeOperation);
		var addConnectorOperation = new Kekule.ChemStructOperation.AddConnector(bond, parent, null, [startObj, endObj]);
		group.add(addConnectorOperation);

		if (moveOperation)
			group.add(moveOperation);
		//this.setActiveOperation(group);

		return group;
	},
	*/

	/**
	 * Change property of an existing bond
	 * @param {Kekule.Bond} bond
	 */
	modifyBond: function(bond)
	{
		var bondType = this.getBondType();
		// change bond order
		var bondOrder;
		var BO = Kekule.BondOrder;
		var loopBondOrders = [BO.SINGLE, BO.DOUBLE, BO.TRIPLE];
		if (this.getAutoSwitchBondOrder() && (bondType === Kekule.BondType.COVALENT) && (bond.getBondType === Kekule.BondType.COVALENT))
		{
			var oldOrder = bond.getBondOrder();
			var index = loopBondOrders.indexOf(oldOrder);
			if (index >= 0)
			{
				index = (++index) % loopBondOrders.length;
			}
			else
				index = 0;
			bondOrder = loopBondOrders[index];
		}
		else
			bondOrder = this.getBondOrder();

		var oldBondStereo = bond.getStereo();
		var bondStereo = this.getBondStereo();
		if (oldBondStereo === bondStereo) // need switch between normal and inv
		{
			bondStereo = Kekule.BondStereo.getInvertedDirection(bondStereo);
			//console.log('inv stereo', oldBondStereo, bondStereo);
		}

		var newPropValues = {'bondType': bondType, 'bondOrder': bondOrder, 'stereo': bondStereo};
		var needModify = false;
		for (var prop in newPropValues)  // check if bond is really need to be changed
		{
			var oldValue = bond.getPropValue(prop);
			if (oldValue !== newPropValues[prop])  // need change
			{
				needModify = true;
				break;
			}
		}

		if (needModify)
		{
			var editor = this.getEditor();
			editor.beginUpdateObject();
			try
			{
				// create operation
				//var oper = new Kekule.EditorOperation.OpModifyConnector(this.getEditor(), bond.getParent(), bond, newPropValues);
				var oper = new Kekule.ChemObjOperation.Modify(bond, newPropValues);
				oper.execute();
				editor.pushOperation(oper);
				// notify editor, the connected objecs should be redrawn too
				var changedObjs = [bond].concat(bond.getConnectedObjs());
				this.getEditor().objectsChanged(changedObjs);
			}
			finally
			{
				editor.endUpdateObject();
			}
		}
	},

	/** @private */
	react_mousedown: function(e)
	{
		if (e.getButton() === Kekule.X.Event.MOUSE_BTN_LEFT)
		{
			var S = BC.State;
			var coord = this._getEventMouseCoord(e);
			var state = this.getState();
			if (state === S.INITIAL)
			{
				var boundItem = this.getEditor().getTopmostBoundInfoAtCoord(coord);
				if (boundItem)
				{
					var obj = boundItem.obj;
					if (this.isObjValidBondTerminator(obj))
					{
						var endCoord = this.addDefBond(coord, obj, true);
						//endCoord = this.getEditor().objCoordToContext(endCoord);
						//console.log('add bond end with', endCoord, coord);
						if (endCoord)  // add bond success
						{
							// then manipulate the bond
							this.startDirectManipulate(null, this.getEndingObj(), coord);
						}
						return true; // important
					}
					else if (this.isBond(obj) && this.getEnableBondModification())  // change bond property
					{
						this.modifyBond(obj);
						return true;
					}
				}
				else if (this.getEditor().canAddUnconnectedStructFragment()) // click on a blank area, add new molecule if needed
				{
					/*
					var objCoord = this.getEditor().screenCoordToObj(coord);
					var startNode = this.getEditor().createNewStructFragmentAndStartingAtom(null, objCoord);
					if (startNode && this.isObjValidBondTerminator(startNode))
					{
						var endCoord = this.addDefBond(startNode, true);
						//endCoord = this.getEditor().objCoordToContext(endCoord);
						//console.log('add bond end with', endCoord, coord);
						// then manipulate the bond
						this.startDirectManipulate(this.getEndingObj(), coord);
						return true; // important
					}
					*/
					var endCoord = this.addDefBond(coord, null, true);
					if (endCoord)  // add successfully
					{
						this.startDirectManipulate(null, this.getEndingObj(), coord);
					}
					return true; // important
				}
			}
		}
	},
	/** @private */
	react_mouseup: function($super, e)
	{
		var state = this.getState();
		var startCoord = this.getStartCoord();
		var endCoord = this._getEventMouseCoord(e);
		var S = Kekule.Editor.BasicManipulationIaController.State;
		if ((state === S.MANIPULATING) && (e.getButton() === Kekule.X.Event.MOUSE_BTN_LEFT))
		{
			if (Kekule.CoordUtils.isEqual(startCoord, endCoord))  // click
			{
				// wrap up, add bond and append operation
				this.addOperationToEditor();
				this.stopManipulate();
				this.setState(S.NORMAL);
				return true;
			}
		}

		return $super(e);  // finish move operation first;
	}
});

/**
 * Enumeration of state of a {@link Kekule.Editor.MolBondIaController}.
 * Currently not used.
 * @class
 */
Kekule.Editor.MolBondIaController.State = {
	/** Normal state. */
	INITIAL: 0,
	/** A starting node is set. */
	START_NODE_SET: 21,
	/** Starting node set and is now adjust bond direction and ending node */
	ADJUSTING: 22
};

var BC = Kekule.Editor.MolBondIaController;

// register
Kekule.Editor.IaControllerManager.register(Kekule.Editor.MolBondIaController, Kekule.Editor.ChemSpaceEditor);

/**
 * Controller to set atom property.
 * @class
 * @augments Kekule.Editor.BaseEditorIaController
 */
Kekule.Editor.MolAtomIaController = Class.create(Kekule.Editor.BaseEditorIaController,
/** @lends Kekule.Editor.MolAtomIaController# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.MolAtomIaController',
	/** @construct */
	initialize: function($super, editor)
	{
		$super(editor);
		this._createNonAtomLabelInfos();
		this._setterShown = false;  // user internally
	},
	finalize: function($super)
	{
		if (this.getAtomSetter())
			this.getAtomSetter().finalize();
		$super();
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('currAtom', {'dataType': DataType.OBJECT, 'serializable': false});  // private
		this.defineProp('atomSetter', {'dataType': DataType.OBJECT, 'serializable': false});  // private
		this.defineProp('periodicTable', {'dataType': DataType.OBJECT, 'serializable': false});  // private
		this.defineProp('periodicTableDialog', {'dataType': DataType.OBJECT, 'serializable': false});  // private
		this.defineProp('nonAtomLabelInfos', {'dataType': DataType.ARRAY, 'serializable': false});  // private
	},

	/** @private */
	canInteractWithObj: function($super, obj)
	{
		if (this.isValidNode(obj))
			return true;
		else
			return false;
	},

	/**
	 * Check if obj is a valid chem node and can be edited.
	 * @param {Kekule.ChemObject} obj
	 * @returns {Bool}
	 * @private
	 */
	isValidNode: function(obj)
	{
		return obj instanceof Kekule.ChemStructureNode;
	},

	/**
	 * Returns label that shows in node edit.
	 * @param {Kekule.ChemStructureNode} node
	 * @returns {String}
	 * @private
	 */
	getNodeLabel: function(node)
	{
		var editor = this.getEditor();
		var labelConfigs = editor.getRenderConfigs().getDisplayLabelConfigs();
		if (node.getIsotopeId)  // atom
			return node.getIsotopeId();
		else if (node instanceof Kekule.SubGroup)
		{
			var groupLabel = node.getAbbr() || node.getFormulaText();
			return groupLabel || labelConfigs.getRgroup();
		}
		else if (node instanceof Kekule.VariableAtom)  // return 'L' rather than actual atom list to activate element table
		{
			var allowedIds = node.getAllowedIsotopeIds();
			var disallowedIds = node.getDisallowedIsotopeIds();
			return (allowedIds && allowedIds.length)? this._getVarAtomListLabel():
					(disallowedIds && disallowedIds.length)? this._getVarAtomNotListLabel():
					this._getVarAtomListLabel();
		}
		else
		{
			var ri = node.getCoreDisplayRichTextItem(null, null, labelConfigs);
			return Kekule.Render.RichTextUtils.toText(ri);
		}
	},

	/** @private */
	_getVarAtomListLabel: function()
	{
		var labelConfigs = this.getEditor().getRenderConfigs().getDisplayLabelConfigs();
		return labelConfigs.getVariableAtom();
	},
	_getVarAtomNotListLabel: function()
	{
		var labelConfigs = this.getEditor().getRenderConfigs().getDisplayLabelConfigs();
		return '~' + labelConfigs.getVariableAtom();
	},
	/** @private */
	_createNonAtomLabelInfos: function()
	{
		var result = [];
		var labelConfigs = this.getEditor().getRenderConfigs().getDisplayLabelConfigs();
		// R group
		result.push({
			'nodeLabel': labelConfigs.getRgroup(), 'nodeClass': Kekule.RGroup,
			'description': Kekule.$L('ChemWidgetTexts.CAPTION_RGROUP') //Kekule.ChemWidgetTexts.CAPTION_RGROUP
		});
		// Kekule.Pseudoatom
		result.push({
			'nodeLabel': labelConfigs.getDummyAtom(), 'nodeClass': Kekule.Pseudoatom,
			'props': {'atomType': Kekule.PseudoatomType.DUMMY},
			'description': Kekule.$L('ChemWidgetTexts.CAPTION_DUMMY_ATOM') //Kekule.ChemWidgetTexts.CAPTION_DUMMY_ATOM
		});
		result.push({
			'nodeLabel': labelConfigs.getHeteroAtom(), 'nodeClass': Kekule.Pseudoatom,
			'props': {'atomType': Kekule.PseudoatomType.HETERO},
			'description': Kekule.$L('ChemWidgetTexts.CAPTION_HETERO_ATOM') //Kekule.ChemWidgetTexts.CAPTION_HETERO_ATOM
		});
		result.push({
			'nodeLabel': labelConfigs.getAnyAtom(), 'nodeClass': Kekule.Pseudoatom,
			'props': {'atomType': Kekule.PseudoatomType.ANY},
			'description': Kekule.$L('ChemWidgetTexts.CAPTION_ANY_ATOM') //Kekule.ChemWidgetTexts.CAPTION_ANY_ATOM
		});
		// Kekule.VariableAtom List and Not List
		result.push({
			'nodeLabel': this._getVarAtomListLabel(), 'nodeClass': Kekule.VariableAtom,
			'description': Kekule.$L('ChemWidgetTexts.CAPTION_VARIABLE_ATOM') //Kekule.ChemWidgetTexts.CAPTION_VARIABLE_ATOM
		});
		result.push({
			'nodeLabel': this._getVarAtomNotListLabel(), 'nodeClass': Kekule.VariableAtom,
			'description': Kekule.$L('ChemWidgetTexts.CAPTION_VARIABLE_NOT_ATOM') //Kekule.ChemWidgetTexts.CAPTION_VARIABLE_NOT_ATOM
		});
		this.setNonAtomLabelInfos(result);
		return result;
	},
	/** @private */
	_indexOfNonAtomLabel: function(nodeLabel)
	{
		var infos = this.getNonAtomLabelInfos();
		for (var i = 0, l = infos.length; i < l; ++i)
		{
			var info = infos[i];
			if (info.nodeLabel === nodeLabel)
				return i;
		}
		return -1;
	},
	/** @private */
	_getNonAtomInfo: function(nodeLabel)
	{
		var index = this._indexOfNonAtomLabel(nodeLabel);
		return (index < 0)? null: this.getNonAtomLabelInfos()[index];
	},

	/** @private */
	getAtomSetterWidget: function(canCreate)
	{
		var result = this.getAtomSetter();
		if (!result && canCreate)  // create new one
		{
			var parentElem = this.getEditor().getCoreElement();
			var doc = parentElem.ownerDocument;
			result = this._createAtomSetterWidget(doc, parentElem);
			this.setAtomSetter(result);
		}
		return result;
	},
	/** @private */
	_createAtomSetterWidget: function(doc, parentElem)
	{
		var result = new Kekule.Widget.ComboBox(doc);
		var listAtoms = this.getEditor().getEditorConfigs().getStructureConfigs().getPrimaryOrgChemAtoms();
		var listItems = [];
		// add ususal atoms
		for (var i = 0, l = listAtoms.length; i < l; ++i)
		{
			listItems.push({'value': listAtoms[i], 'data': {'props': {'isotopeId': listAtoms[i]}}});
		}
		// add "open periodic table" option
		listItems.push({'value': Kekule.$L('ChemWidgetTexts.CAPTION_ATOMLIST_PERIODIC_TABLE') /*CWT.CAPTION_ATOMLIST_PERIODIC_TABLE*/});
		// non-atom nodes
		var nonAtomLabelInfos = this.getNonAtomLabelInfos();
		for (var i = 0, l = nonAtomLabelInfos.length; i < l; ++i)
		{
			var info = nonAtomLabelInfos[i];
			var listItem = {'value': info.nodeLabel, 'data': {'props': info.props}};
			if (info.description)
				listItem.text = info.nodeLabel + ' - ' + info.description;
			listItems.push(listItem);
		}
		result.setItems(listItems);
		result.appendToElem(parentElem);

		// event handler
		var self = this;
		result.addEventListener('keyup', function(e)
			{
				var ev = e.htmlEvent;
				if (ev.getKeyCode() === Kekule.X.Event.KeyCode.ENTER)
				{
					self.applySetter(result);
					result.dismiss();  // avoid call apply setter twice
				}
			}
		);
		result.addEventListener('valueSelect', function(e)
			{
				self.applySetter(result);
				result.dismiss();  // avoid call apply setter twice
			}
		);
		result.addEventListener('showStateChange', function(e)
			{
	      if (!e.isShown && !e.isDismissed)  // widget hidden, feedback the edited value
				{
					if (self.getAtomSetter() && self.getAtomSetter().isShown())
						self.applySetter(result);
				}
			}
		);

		return result;
	},

	/** @private */
	getPeriodicTableDialogWidget: function(canCreate)
	{
		var result = this.getPeriodicTableDialog();
		if (!result && canCreate)  // create new one
		{
			var parentElem = this.getEditor().getCoreElement();
			var doc = parentElem.ownerDocument;
			result = this._createPeriodicTableDialogWidget(doc, parentElem);
			this.setPeriodicTableDialog(result);
		}
		//console.log(result);
		return result;
	},
	/** @private */
	_createPeriodicTableDialogWidget: function(doc, parentElem)
	{
		var dialog = new Kekule.Widget.Dialog(doc, Kekule.$L('ChemWidgetTexts.CAPTION_PERIODIC_TABLE_DIALOG') /*CWT.CAPTION_PERIODIC_TABLE_DIALOG*/,
			[Kekule.Widget.DialogButtons.OK, Kekule.Widget.DialogButtons.CANCEL]
		);
		var table = new Kekule.ChemWidget.PeriodicTable(doc);
		table.setUseMiniMode(true);
		table.setEnableSelect(true);
		table.appendToElem(dialog.getClientElem());
		this.setPeriodicTable(table);
		return dialog;
	},

	/**
	 * Open atom edit box for obj in coord.
	 * @param {Hash} coord
	 * @param {Object} obj
	 */
	openSetterUi: function(coord, obj)
	{
		var oldSetter = this.getAtomSetter();
		/*
		if (oldSetter && oldSetter.isShown())  // has a old setter
		{
			this.applySetter(oldSetter, this.getCurrAtom());
		}
		*/

		if (!this.isValidNode(obj))
			return;
		this.setCurrAtom(obj);

		var fontSize = this.getEditor().getEditorConfigs().getInteractionConfigs().getAtomSetterFontSize() || 0;
		var posAdjust = fontSize / 1.5;  // adjust position to align to atom center
		var slabel = this.getNodeLabel(obj);
		var setter = this.getAtomSetterWidget(true);
		setter.setValue(slabel);
		setter.setIsDirty(false);
		//setter.setIsPopup(true);
		var style = setter.getElement().style;
		style.position = 'absolute';
		style.fontSize = fontSize;
		style.left = (coord.x - posAdjust) + 'px';
		style.top = (coord.y - posAdjust) + 'px';
		/*
		 style.marginTop = -posAdjust + 'px';
		 style.marginLeft = -posAdjust + 'px';
		 */
		//setter.show();
		setter._applied = false;
		setter.show(null, null, Kekule.Widget.ShowHideType.POPUP);

		(function(){
			setter.focus();
			setter.selectAll();
		}).defer();
		//result.selectAll.bind(result).defer();
		/*
		setter.selectAll();
		setter.focus();
		*/
	},
	/** @private */
	applySetter: function(setter, atom)
	{
		if (setter._applied)  // avoid called twice
			return;
		if (!setter.getIsDirty())  // setter not modified
			return;
		if (!atom)
			atom = this.getCurrAtom();
		var nodeClass;
		var modifiedProps = null;
		//var isNonAtom = false;
		var text = setter.getValue();
		//console.log('value', text);

		// check if setter list need to raise other widget
		var periodicTableDialog;
		if (text === Kekule.$L('ChemWidgetTexts.CAPTION_ATOMLIST_PERIODIC_TABLE')/*CWT.CAPTION_ATOMLIST_PERIODIC_TABLE*/)  // open periodic table to select atom
		{
			var periodicTableDialog = this.getPeriodicTableDialogWidget(true);
			periodicTableDialog.setCaption(/*CWT.CAPTION_PERIODIC_TABLE_DIALOG_SEL_ELEM*/Kekule.$L('ChemWidgetTexts.CAPTION_PERIODIC_TABLE_DIALOG_SEL_ELEM'));
			var currSymbol = atom.getSymbol? atom.getSymbol(): null;
			this.getPeriodicTable().setEnableSelect(true).setEnableMultiSelect(false).setSelectedSymbol(currSymbol);
		}
		else if (text === this._getVarAtomListLabel() || text === this._getVarAtomNotListLabel())  // select list of atoms
		{
			var notList = text === this._getVarAtomNotListLabel();
			var periodicTableDialog = this.getPeriodicTableDialogWidget(true);
			periodicTableDialog.setCaption(/*CWT.CAPTION_PERIODIC_TABLE_DIALOG_SEL_ELEMS*/Kekule.$L('ChemWidgetTexts.CAPTION_PERIODIC_TABLE_DIALOG_SEL_ELEM'));
			var allowedSymbols = atom.getAllowedIsotopeIds? atom.getAllowedIsotopeIds(): null;
			var disallowedSymbols = atom.getDisallowedIsotopeIds? atom.getDisallowedIsotopeIds(): null;
			this.getPeriodicTable().setEnableSelect(true).setEnableMultiSelect(true)
				.setSelectedSymbols(notList? disallowedSymbols: allowedSymbols);
		}

		if (periodicTableDialog)
		{
			var self = this;
			periodicTableDialog.openModal(function(result)
				{
					if (result === Kekule.Widget.DialogButtons.OK)
					{
						var nodeClass;
						var modifiedProps;
						if (text === Kekule.$L('ChemWidgetTexts.CAPTION_ATOMLIST_PERIODIC_TABLE')/*CWT.CAPTION_ATOMLIST_PERIODIC_TABLE*/)  // select single atom
						{
							var symbol = self.getPeriodicTable().getSelectedSymbol();
							nodeClass = Kekule.Atom;
							modifiedProps = {'isotopeId': symbol};
						}
						if (text === self._getVarAtomListLabel())
						{
							var symbols = self.getPeriodicTable().getSelectedSymbols();
							nodeClass = Kekule.VariableAtom;
							modifiedProps = {'allowedIsotopeIds': symbols, 'disallowedIsotopeIds': null};
						}
						if (text === self._getVarAtomNotListLabel())
						{
							var symbols = self.getPeriodicTable().getSelectedSymbols();
							nodeClass = Kekule.VariableAtom;
							modifiedProps = {'allowedIsotopeIds': null, 'disallowedIsotopeIds': symbols};
						}
						self.applyModification(atom, null, nodeClass, modifiedProps);
					}
				}, this
			);
			return;
		}

		var newNode = null;
		var nonAtomInfo = this._getNonAtomInfo(text);
		if (nonAtomInfo)  // is not an atom
		{
			nodeClass = nonAtomInfo.nodeClass;
			modifiedProps = nonAtomInfo.props;
			//isNonAtom = true;
		}
		else
		{
			// check if it is predefined subgroups first
			var subGroupRepositoryItem = Kekule.Editor.StoredSubgroupRepositoryItem2D.getRepItemOfInputText(text);
			if (subGroupRepositoryItem)  // add subgroup
			{
				var repResult = subGroupRepositoryItem.createObjects(atom) || {};
				var repObjects = repResult.objects;
				var transformParams = Kekule.Editor.RepositoryStructureUtils.calcRepObjInitialTransformParams(this.getEditor(), subGroupRepositoryItem, repResult, atom, null);
				this.getEditor().transformCoordAndSizeOfObjects(repObjects, transformParams);
				newNode = repObjects[0];
				nodeClass = newNode.getClass();
			}
			else  // add normal node
			{
				nodeClass = Kekule.ChemStructureNodeFactory.getClassByLabel(text, null); // explicit set defaultClass parameter to null
				if (!nodeClass)
				{
					if (this.getEditorConfigs().getInteractionConfigs().getAllowUnknownAtomSymbol())
						nodeClass = Kekule.Pseudoatom;
				}
				modifiedProps = (nodeClass === Kekule.Atom) ? {'isotopeId': text} :
						(nodeClass === Kekule.Pseudoatom) ? {'symbol': text} :
						{};
			}
		}

		if (!nodeClass)
		{
			Kekule.error(Kekule.$L('ErrorMsg.INVALID_ATOM_SYMBOL'));
		}
		else
		{
			this.applyModification(atom, newNode, nodeClass, modifiedProps);
			setter._applied = true;
		}
	},

	/**
	 * Save changes to current edited node.
	 * @param node
	 * @param newNodeClass
	 * @param modifiedProps
	 * @private
	 */
	applyModification: function(node, newNode, newNodeClass, modifiedProps)
	{
		var newNode;
		var operGroup, oper;
		var oldNodeClass = node.getClass();
		if (newNode && !newNodeClass)
			newNodeClass = newNode.getClass();
		if (newNode || newNodeClass !== oldNodeClass)  // need to replace node
		{
			operGroup = new Kekule.MacroOperation();
			if (!newNode)
				newNode = new newNodeClass();
			var tempNode = new Kekule.ChemStructureNode();
			tempNode.assign(node);
			newNode.assign(tempNode);  // copy some basic info of old node
			var operReplace = new Kekule.ChemStructOperation.ReplaceNode(node, newNode);
			operGroup.add(operReplace);
		}
		else  // no need to replace
			newNode = node;

		if (modifiedProps)
		{
			oper = new Kekule.ChemObjOperation.Modify(newNode, modifiedProps);
			if (operGroup)
				operGroup.add(oper);
		}

		var operation = operGroup || oper;
		if (operation)  // only execute when there is real modification
		{
			var editor = this.getEditor();
			editor.beginUpdateObject();
			try
			{
				operation.execute();
			}
			catch (e)
			{
				//Kekule.error(/*Kekule.ErrorMsg.NOT_A_VALID_ATOM*/Kekule.$L('ErrorMsg.NOT_A_VALID_ATOM'));
				throw(e);
			}
			finally
			{
				editor.endUpdateObject();
			}

			if (editor && editor.getEnableOperHistory() && operation)
			{
				editor.pushOperation(operation);
			}
		}
	},

	/** @private */
	react_mouseup: function(e)
	{
		if (e.getButton() === Kekule.X.Event.MOUSE_BTN_LEFT)
		{
			this.getEditor().setSelection(null);
			var coord = this._getEventMouseCoord(e);
			{
				var boundItem = this.getEditor().getTopmostBoundInfoAtCoord(coord);
				if (boundItem)
				{
					var obj = boundItem.obj;
					if (this.isValidNode(obj))  // can modify atom of this object
					{
						var baseCoord = this.getEditor().getObjectScreenCoord(obj);
						e.preventDefault();
						e.stopPropagation();
						// important, prevent event bubble to document, otherwise reactDocumentClick will be evoked
						//  and the atom setter will be closed immediately.
						this.openSetterUi(baseCoord, obj);
						this.getEditor().setSelection([obj]);
					}
					return true;  // important
				}
			}
		}
	}
});

// register
Kekule.Editor.IaControllerManager.register(Kekule.Editor.MolAtomIaController, Kekule.Editor.ChemSpaceEditor);

/**
 * Controller to set atom/group charge and radical.
 * @class
 * @augments Kekule.Editor.BaseEditorIaController
 *
 * @property {Number} chargeInc The node's charge will become charge + chargeInc after execution of controller.
 * @property {Number} charge The node's charge will become this value after execution of controller.
 * @property {Int} radical Radical type set to node
 */
Kekule.Editor.MolNodeChargeIaController = Class.create(Kekule.Editor.BaseEditorIaController,
/** @lends Kekule.Editor.MolNodeChargeIaController# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.MolNodeChargeIaController',
	/** @construct */
	initialize: function($super, editor)
	{
		$super(editor);
		this.setChargeInc(1);  // default is +1
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('chargeInc', {'dataType': DataType.NUMBER, 'serializable': false});
		this.defineProp('charge', {'dataType': DataType.NUMBER, 'serializable': false});
		this.defineProp('radical', {'dataType': DataType.INT, 'serializable': false});
		this.defineProp('currNode', {'dataType': DataType.OBJECT, 'serializable': false});  // private
	},

	/** @private */
	canInteractWithObj: function($super, obj)
	{
		if (this.isValidNode(obj))
			return true;
		else
			return false;
	},

	/**
	 * Check if obj is a valid chem node and can be edited.
	 * @param {Kekule.ChemObject} obj
	 * @returns {Bool}
	 * @private
	 */
	isValidNode: function(obj)
	{
		return obj instanceof Kekule.ChemStructureNode;
	},

	/**
	 * Execute on the node.
	 * @param node
	 * @private
	 */
	apply: function(node)
	{
		var modified = false;
		var modifiedData = {};
		var charge = node.getCharge();
		if (Kekule.ObjUtils.notUnset(this.getCharge()))
		{
			if (charge !== this.getCharge())
			{
				modifiedData.charge = this.getCharge();
				modified = true;
			}
		}
		else if (this.getChargeInc())
		{
			charge += this.getChargeInc();
			modifiedData.charge = charge;
			modified = true;
		}
		var radical = node.getRadical();
		if (this.getRadical() !== radical)
		{
			//console.log(radical, this.getRadical());
			modifiedData.radical = this.getRadical();
			modified = true;
		}

		if (modified)
		{
			var oper = new Kekule.ChemObjOperation.Modify(node, modifiedData);
			oper.execute();
			//console.log(modifiedData, node.getRadical());
			var editor = this.getEditor();
			if (editor && editor.getEnableOperHistory())
			{
				editor.pushOperation(oper);
			}
		}
	},

	/** @private */
	react_mouseup: function(e)
	{
		if (e.getButton() === Kekule.X.Event.MOUSE_BTN_LEFT)
		{
			//this.getEditor().setSelection(null);
			var coord = this._getEventMouseCoord(e);
			{
				var boundItem = this.getEditor().getTopmostBoundInfoAtCoord(coord);
				if (boundItem)
				{
					var obj = boundItem.obj;
					if (this.isValidNode(obj))  // can modify atom of this object
					{
						this.apply(obj);
						e.preventDefault();
						e.stopPropagation();
					}
					return true;  // important
				}
			}
		}
	}
});

// register
Kekule.Editor.IaControllerManager.register(Kekule.Editor.MolNodeChargeIaController, Kekule.Editor.ChemSpaceEditor);

/**
 * Controller to add repository structure fragments or other objects into chem space.
 * @class
 * @augments Kekule.Editor.BasicMolManipulationIaController
 */
Kekule.Editor.RepositoryIaController = Class.create(Kekule.Editor.BasicMolManipulationIaController,
/** @lends Kekule.Editor.RepositoryIaController# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.RepositoryIaController',
	/** @construct */
	initialize: function($super, editor)
	{
		$super(editor);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('repositoryItem', {'dataType': 'Kekule.AbstractRepositoryItem', 'serializable': false});
		this.defineProp('addRepObjsOper', {'dataType': 'Kekule.MacroOperation', 'serializable': false});
	},

	/** @ignore */
	doTestMouseCursor: function(coord, e)
	{
		// Overwrite parent BasicMolManipulationIaController,
		// Always show pointer cursor
		return '';
	},

	/** @private */
	calcInitialTransformParams: function(repItem, repResult, destObj, targetCoord)
	{
		return Kekule.Editor.RepositoryStructureUtils.calcRepObjInitialTransformParams(this.getEditor(), repItem, repResult, destObj, targetCoord);
	},

	/** @private */
	addRepositoryObj: function(targetObj, screenCoord)
	{
		var editor = this.getEditor();
		this.setAddRepObjsOper(null);
		var repResult = null;

		editor.beginUpdateObject();
		try
		{
			var chemSpace = editor.getChemSpace();
			var repItem = this.getRepositoryItem();

			repResult = repItem.createObjects(targetObj) || {};
			var repObjects = repResult.objects;

			var isOneStructItem = repItem.isOneStructureFragmentObj();
			var addToBlankMol = false;
			var blankMol = this.getEditor().getOnlyOneBlankStructFragment();
			if (!this.getEditor().canCreateNewChild() && !repResult.mergeObj)  // can not create a standalone child
			{
				if (!isOneStructItem || !this.getEditor().canAddUnconnectedStructFragment())
					return null;
				else
					addToBlankMol = true;
			}

			var macroOper = new Kekule.MacroOperation();
			for (var i = 0, l = repObjects.length; i < l; ++i)
			{
				var obj = repObjects[i];
				var oper;
				if (addToBlankMol)
					oper = new Kekule.ChemStructOperation.MergeStructFragment(obj, blankMol);
				else
					oper = new Kekule.ChemObjOperation.Add(obj, chemSpace);
				macroOper.add(oper);
			}
			macroOper.execute();
			this.setAddRepObjsOper(macroOper);

			var addedObjs = addToBlankMol? [blankMol]: repObjects;
			var transformParams = this.calcInitialTransformParams(repItem, repResult, targetObj, screenCoord);
			this._transformObjectsCoordAndSize(addedObjs, transformParams);

			repResult.objects = addedObjs;
		}
		finally
		{
			editor.endUpdateObject();
		}

		//this.addOperationToEditor();
		return repResult;
	},

	/** @private */
	_transformObjectsCoordAndSize: function(objects, transformParams)
	{
		/*
		var coordMode = this.getEditor().getCoordMode();
		var allowCoordBorrow = this.getEditor().getAllowCoordBorrow();
		var matrix = (coordMode === Kekule.CoordMode.COORD3D)?
			Kekule.CoordUtils.calcTransform3DMatrix(transformParams):
			Kekule.CoordUtils.calcTransform2DMatrix(transformParams);
		var childTransformParams = Object.extend({}, transformParams);
		childTransformParams = Object.extend(childTransformParams, {
			'translateX': 0,
			'translateY': 0,
			'translateZ': 0,
			'center': {'x': 0, 'y': 0, 'z': 0}
		});
		var childMatrix = (coordMode === Kekule.CoordMode.COORD3D)?
			Kekule.CoordUtils.calcTransform3DMatrix(childTransformParams):
			Kekule.CoordUtils.calcTransform2DMatrix(childTransformParams);

		for (var i = 0, l = objects.length; i < l; ++i)
		{
			var obj = objects[i];
			obj.transformAbsCoordByMatrix(matrix, childMatrix, coordMode, true, allowCoordBorrow);
			obj.scaleSize(transformParams.scale, coordMode, true, allowCoordBorrow);
		}
		*/
		return this.getEditor().transformCoordAndSizeOfObjects(objects, transformParams);
	},

	/** @ignore */
	getAllObjOperations: function($super)
	{
		var result = $super() || [];
		var repOper = this.getAddRepObjsOper();
		if (repOper)
			result.unshift(repOper);
		return result;
	},
	/** @private */
	addOperationToEditor: function($super)
	{
		if (this.getAllManipulateObjsMerged())
		return null;
		else
			return $super();
	},

	/**
	 * Returns manipulate type that should be used after adding a repository object.
	 * Descendant may override this method.
	 * @returns {Int}
	 * @private
	 */
	getInitManipulationType: function()
	{
		return Kekule.Editor.BasicManipulationIaController.ManipulationType.ROTATE;
	},

	/** @private */
	react_mousedown: function(e)
	{
		if (e.getButton() === Kekule.X.Event.MOUSE_BTN_LEFT)
		{
			var S = BC.State;
			var coord = this._getEventMouseCoord(e);
			var state = this.getState();
			if (state === S.INITIAL)
			{
				var boundItem = this.getEditor().getTopmostBoundInfoAtCoord(coord);
				var boundObj = boundItem? boundItem.obj: null;
				var addedResult = this.addRepositoryObj(boundObj, coord);
				if (addedResult)
				{
					var addedObjects = addedResult.objects;
					var rotateCenter = null;
					var manType = this.getInitManipulationType();
					if (addedResult.mergeObj)
					{
						rotateCenter = this.getEditor().getObjectScreenCoord(addedResult.mergeObj);
						manType = Kekule.Editor.BasicManipulationIaController.ManipulationType.ROTATE;  // alwys rotate when there is merge
					}
					//console.log(addedResult, rotateCenter);
					var box = this.getEditor().getObjectsContainerBox(addedObjects);
					//console.log(manType, addedResult, coord, box, rotateCenter);
					this.startDirectManipulate(manType, addedObjects, coord, box, rotateCenter);
					this.moveManipulatedObjs(coord);  // force a "move" action, to apply possible merge
				}
				else
				{
					// not added, do nothing
				}
				return true; // important
			}
		}
	},
	/** @private */
	react_mouseup: function($super, e)
	{
		var state = this.getState();
		var startCoord = this.getStartCoord();
		var endCoord = this._getEventMouseCoord(e);
		var S = Kekule.Editor.BasicManipulationIaController.State;
		if ((state === S.MANIPULATING) && (e.getButton() === Kekule.X.Event.MOUSE_BTN_LEFT))
		{
			if (Kekule.CoordUtils.isEqual(startCoord, endCoord))  // click
			{
				this.addOperationToEditor();
				this.stopManipulate();
				this.setState(S.NORMAL);
				return true;
			}
		}

		return $super(e);  // finish move operation
	}
});

/**
 * Controller to add ring structure into chem space.
 * @class
 * @augments Kekule.Editor.RepositoryIaController
 *
 * @property {Int} ringAtomCount Atom count on ring.
 * @property {Bool} isAromatic Whether this ring is a aromatic one (single/double bond intersect),
 */
Kekule.Editor.MolRingIaController = Class.create(Kekule.Editor.RepositoryIaController,
/** @lends Kekule.Editor.MolRingIaController# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.MolRingIaController',
	/** @construct */
	initialize: function($super, editor)
	{
		$super(editor);
		this.setRepositoryItem(new Kekule.Editor.MolRingRepositoryItem2D());
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('ringAtomCount', {'dataType': DataType.INT,
			'getter': function() { return this.getRepositoryItem().getRingAtomCount(); },
			'setter': function(value) { this.getRepositoryItem().setRingAtomCount(value); }
		});
		this.defineProp('isAromatic', {'dataType': DataType.INT,
			'getter': function() { return this.getRepositoryItem().getIsAromatic(); },
			'setter': function(value) { this.getRepositoryItem().setIsAromatic(value); }
		});
	}
});
// register
Kekule.Editor.IaControllerManager.register(Kekule.Editor.MolRingIaController, Kekule.Editor.ChemSpaceEditor);

/**
 * Controller to add repository structure into chem space.
 * @class
 * @augments Kekule.Editor.RepositoryIaController
 *
 * @property {Int} ringAtomCount Atom count on ring.
 * @property {Bool} isAromatic Whether this ring is a aromatic one (single/double bond intersect),
 */
Kekule.Editor.RepositoryStructureFragmentIaController = Class.create(Kekule.Editor.RepositoryIaController,
/** @lends Kekule.Editor.RepositoryStructureFragmentIaController# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.RepositoryStructureFragmentIaController',
	/** @construct */
	initialize: function($super, editor)
	{
		$super(editor);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('repItemName', {'dataType': DataType.STRING,
			'setter': function(value)
			{
				if (value !== this.getRepItemName())
				{
					var repItem = Kekule.Editor.RepositoryItemManager.getItem(value);
					if (repItem)
					{
						this.setRepositoryItem(repItem);
						this.setPropStoreFieldValue('repItemName', value);
					}
				}
			}
		});
	}
});

Kekule.Editor.IaControllerManager.register(Kekule.Editor.RepositoryStructureFragmentIaController, Kekule.Editor.ChemSpaceEditor);

/**
 * Controller to add arrow/line into chem space.
 * @class
 * @augments Kekule.Editor.RepositoryIaController
 *
 * @property {Class} glyphClass Class to create glyph.
 * @property {Float} glyphRefLength Default length to generate glyph.
 * @property {Hash} glyphInitialParams Initial params to create glyph.
 */
Kekule.Editor.ArrowLineIaController = Class.create(Kekule.Editor.RepositoryIaController,
/** @lends Kekule.Editor.ArrowLineIaController# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ArrowLineIaController',
	/** @construct */
	initialize: function($super, editor)
	{
		$super(editor);
		this.setRepositoryItem(new Kekule.Editor.PathGlyphRepositoryItem2D());
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('glyphRefLength', {'dataType': DataType.FLOAT,
			'getter': function() { return this.getRepositoryItem().getGlyphRefLength(); },
			'setter': function(value) { this.getRepositoryItem().setGlyphRefLength(value); }
		});
		this.defineProp('glyphClass', {'dataType': DataType.CLASS, 'serializable': false,
			'getter': function()
			{
				return this.getRepositoryItem().getGlyphClass();
			},
			'setter': function(value)
			{
				this.getRepositoryItem().setGlyphClass(value);
			}
		});
		this.defineProp('glyphInitialParams', {'dataType': DataType.HASH,
			'getter': function() { return this.getRepositoryItem().getGlyphInitialParams(); },
			'setter': function(value) { this.getRepositoryItem().setGlyphInitialParams(value); }
		});
	},
	/** @ignore */
	getInitManipulationType: function()
	{
		return Kekule.Editor.BasicManipulationIaController.ManipulationType.MOVE;
	},
	/** @ignore */
	addRepositoryObj: function($super, targetObj, screenCoord)
	{
		// set ref length before adding new object
		this.getRepositoryItem().setGlyphRefLength(this.getEditor().getChemSpace().getDefAutoScaleRefLength());
		return $super(targetObj, screenCoord);
	}
});
// register
Kekule.Editor.IaControllerManager.register(Kekule.Editor.ArrowLineIaController, Kekule.Editor.ChemSpaceEditor);

/**
 * Controller to add or edit formula based molecule in document.
 * @class
 * @augments Kekule.Editor.BaseEditorIaController
 */
Kekule.Editor.FormulaIaController = Class.create(Kekule.Editor.BaseEditorIaController,
/** @lends Kekule.Editor.FormulaIaController# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.FormulaIaController',
	/** @construct */
	initialize: function($super, editor)
	{
		$super(editor);
		this._operAddMol = null;  // private
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('currMol', {'dataType': DataType.OBJECT, 'serializable': false});  // private
		this.defineProp('textSetter', {'dataType': DataType.OBJECT, 'serializable': false});  // private
	},
	/** @private */
	canInteractWithObj: function($super, obj)
	{
		if (obj && this.isValidMol(obj))
			return true;
		else
			return false;
	},

	/**
	 * Check if obj is a valid formula based molecule and can be edited.
	 * @param {Kekule.ChemObject} obj
	 * @returns {Bool}
	 * @private
	 */
	isValidMol: function(obj)
	{
		return (obj instanceof Kekule.StructureFragment) && obj.hasFormula() && !obj.hasCtab();
	},

	/**
	 * Returns plain text of formula that shows in text setter.
	 * @param {Kekule.StructureFragment} mol
	 * @returns {String}
	 * @private
	 */
	getFormulaText: function(mol)
	{
		return mol.hasFormula()? mol.getFormula().getText(): '';
	},

	/** @private */
	createNewMol: function(chemSpace, coord)
	{
		var mol;
		var editor = this.getEditor();
		if (!editor.canCreateNewChild())
		{
			mol = editor.getOnlyOneBlankStructFragment();
			if (!mol)
				return null;
		}

		editor.beginUpdateObject();
		try
		{
			if (!mol)
				var mol = new Kekule.Molecule();
			mol.getFormula(true);  // create a forumla
			chemSpace.appendChild(mol);
			editor.setObjectScreenCoord(mol, coord);
			var addOperation = new Kekule.ChemObjOperation.Add(mol, chemSpace, null);
			this._operAddBlock = addOperation;
		}
		finally
		{
			editor.endUpdateObject();
		}
		return mol;
	},

	/** @private */
	getTextSetterWidget: function(canCreate)
	{
		var result = this.getTextSetter();
		if (!result && canCreate)  // create new one
		{
			var parentElem = this.getEditor().getCoreElement();
			var doc = parentElem.ownerDocument;
			result = this._createTextSetterWidget(doc, parentElem);
			this.setTextSetter(result);
		}
		return result;
	},
	/** @private */
	_createTextSetterWidget: function(doc, parentElem)
	{
		var result = new Kekule.Widget.TextBox(doc);
		/*
		result.setAutoSizeX(true);
		result.setAutoSizeY(true);
		*/
		result.addClassName(CCNS.CHEMEDITOR_FORMULA_SETTER);
		result.appendToElem(parentElem);

		// event handler
		var self = this;
		result.addEventListener('keyup', function(e)
			{
				var ev = e.htmlEvent;
				var keyCode = ev.getKeyCode();
				if (keyCode === Kekule.X.Event.KeyCode.ENTER)  // ctrl+enter
				{
					self.applySetter(result);
					result.dismiss();  // avoid call apply setter twice
				}
				else if (keyCode === Kekule.X.Event.KeyCode.ESC)  // ESC, cancel editor
				{
					result.dismiss();
					self.cancelSetter();
				}
			}
		);
		result.addEventListener('showStateChange', function(e)
			{
				//console.log('show state change', e.isShown, e.isDismissed);
				if (!e.isShown && !e.isDismissed)  // widget hidden, feedback the edited value
				{
					self.applySetter(result);
				}
			}
		);
		return result;
	},
	/** @private */
	cancelSetter: function()
	{
		if (this._operAddBlock)  // already created new formula, remove it
		{
			this._operAddBlock.reverse();
			this._operAddBlock = null;
		}
	},
	/** @private */
	applySetter: function(setter, mol)
	{
		if (setter._applied)   // avoid call twice
			return;

		if (!mol)
			mol = this.getCurrMol();

		var oper;
		var text = setter.getText();
		if (!text)  // no input, delete
		{
			if (this._operAddBlock)  // new forumla just added to space
				this.cancelSetter();
			else  // old one, delete it
			{
				oper = new Kekule.ChemObjOperation.Remove(mol, mol.getParent());
			}
		}
		else
		{
			var oper = new Kekule.ChemObjOperation.Modify(mol.getFormula(), {'text': text});
		}
		if (oper)
		{
			oper.execute();

			var editor = this.getEditor();
			if (editor && editor.getEnableOperHistory())
			{
				if (this._operAddBlock)
				{
					var group = new Kekule.MacroOperation();
					group.add(this._operAddBlock);
					group.add(oper);
					editor.pushOperation(group);
					this._operAddBlock = null;
				}
				else
					editor.pushOperation(oper);
			}
		}

		setter._applied = true;
	},
	/**
	 * Open formula edit box in coord.
	 * @param {Hash} coord
	 * @param {Object} mol
	 */
	openSetterUi: function(coord, mol)
	{
		var oldSetter = this.getTextSetter();
		if (oldSetter && oldSetter.isShown())  // has a old setter
		{
			this.applySetter(oldSetter, this.getCurrMol());
		}

		if (!mol)  // need create new
			mol = this.createNewMol(this.getEditor().getChemObj(), coord);

		if (!this.isValidMol(mol))
			return;
		this.setCurrMol(mol);

		this.getEditor().setSelection([mol]);

		//console.log(block.getCascadedRenderOption('fontSize'));

		var fontSize = mol.getCascadedRenderOption('fontSize') || this.getEditor().getEditorConfigs().getInteractionConfigs().getAtomSetterFontSize();
		var fontName = mol.getCascadedRenderOption('fontFamily') || '';
		//var posAdjust = fontSize / 1.5;  // adjust position to align to atom center
		var text = this.getFormulaText(mol);
		var setter = this.getTextSetterWidget(true);
		setter._applied = false;
		var slabel = text || '';
		//console.log(block, text, slabel);
		setter.setValue(slabel);
		//setter.setValue('hehr');
		//setter.setIsPopup(true);
		var style = setter.getElement().style;
		style.position = 'absolute';
		style.fontSize = fontSize + 'px';
		style.left = coord.x + 'px';
		style.top = coord.y + 'px';
		style.fontFamily = fontName;
		/*
		 style.marginTop = -posAdjust + 'px';
		 style.marginLeft = -posAdjust + 'px';
		 */
		setter.show(null, null, Kekule.Widget.ShowHideType.POPUP);
		setter.selectAll();
		setter.focus();
	},

	/** @private */
	react_mouseup: function(e)
	{
		if (e.getButton() === Kekule.X.Event.MOUSE_BTN_LEFT)
		{
			this.getEditor().setSelection(null);
			var coord = this._getEventMouseCoord(e);
			{
				var mol;
				var boundItem = this.getEditor().getTopmostBoundInfoAtCoord(coord);
				if (boundItem)
				{
					var obj = boundItem.obj;

					if (this.isValidMol(obj))  // can modify atom of this object
					{
						mol = obj;
					}
				}

				/*
				 if (!block)  // create new
				 {
				 block = this.createNewBlock(this.getEditor().getChemObj(), coord);
				 //console.log(coord, this.getEditor().getObjectScreenCoord(block));
				 }

				 if (block)
				 */
				{
					//var baseCoord = mol? this.getEditor().getObjectScreenCoord(mol): coord;
					var baseCoord;
					if (boundItem && boundItem.boundInfo)
					{
						baseCoord = boundItem.boundInfo.coords[0];
					}
					else
						baseCoord = coord;
					e.preventDefault();
					e.stopPropagation();
					// important, prevent event bubble to document, otherwise reactDocumentClick will be evoked
					//  and the setter will be closed immediately.
					this.openSetterUi(baseCoord, mol);
					//this.getEditor().setSelection([block]);
					return true;  // important
				}
			}
		}
	}
});
// register
Kekule.Editor.IaControllerManager.register(Kekule.Editor.FormulaIaController, Kekule.Editor.ChemSpaceEditor);

/**
 * Base controller to add or edit content block in document.
 * @class
 * @augments Kekule.Editor.BaseEditorIaController
 */
Kekule.Editor.ContentBlockIaController = Class.create(Kekule.Editor.BaseEditorIaController,
/** @lends Kekule.Editor.ContentBlockIaController# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ContentBlockIaController',
	/** @construct */
	initialize: function($super, editor)
	{
		$super(editor);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('currBlock', {'dataType': DataType.OBJECT, 'serializable': false});  // private
	},
	/** @private */
	canInteractWithObj: function($super, obj)
	{
		return (obj && this.isValidBlock(obj));
	},
	/**
	 * Check if obj is a valid text block and can be edited.
	 * Descendants must override this method.
	 * @param {Kekule.ChemObject} obj
	 * @returns {Bool}
	 * @private
	 */
	isValidBlock: function(obj)
	{
		return obj instanceof Kekule.ContentBlock;
	},
	/**
	 * Called when IaController is selected and mouse clicked on document.
	 * Need to modify block or create new one when param block is null.
	 * Descendants need to override this method.
	 * @param {Kekule.ChemSpace} chemSpace
	 * @param {Hash} baseCoord
	 * @param {Kekule.ContentBlock} block
	 */
	execute: function(chemSpace, baseCoord, block)
	{
		// do nothing here
	},

	/** @private */
	react_mousedown: function(e)
	{
		if (e.getButton() === Kekule.X.Event.MouseButton.LEFT)
		{
			this.getEditor().setSelection(null);
			var coord = this._getEventMouseCoord(e);
			{
				var block;
				var boundItem = this.getEditor().getTopmostBoundInfoAtCoord(coord);
				if (boundItem)
				{
					var obj = boundItem.obj;

					if (this.isValidBlock(obj))  // can modify atom of this object
					{
						block = obj;
					}
				}

				var baseCoord = block? this.getEditor().getObjectScreenCoord(block): coord;
				e.preventDefault();
				e.stopPropagation();
				// important, prevent event bubble to document, otherwise reactDocumentClick will be evoked
				//  and the setter may be closed immediately.
				//console.log('block execute', baseCoord, e.getTarget(), e.getCurrentTarget());
				this.execute(this.getEditor().getChemObj(), baseCoord, block);
				//this.getEditor().setSelection([block]);
				return true;  // important
			}
		}
	}
});

/**
 * Controller to add or edit text block in document.
 * @class
 * @augments Kekule.Editor.ContentBlockIaController
 */
Kekule.Editor.TextBlockIaController = Class.create(Kekule.Editor.ContentBlockIaController,
/** @lends Kekule.Editor.TextBlockIaController# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.TextBlockIaController',
	/** @construct */
	initialize: function($super, editor)
	{
		$super(editor);
		this._operAddBlock = null;  // private
	},
	/** @private */
	initProperties: function()
	{
		//this.defineProp('currBlock', {'dataType': DataType.OBJECT, 'serializable': false});  // private
		this.defineProp('textSetter', {'dataType': DataType.OBJECT, 'serializable': false});  // private
	},

	/** @ignore */
	isValidBlock: function(obj)
	{
		return obj instanceof Kekule.TextBlock;
	},

	/**
	 * Create new content block on document.
	 * @private
	 */
	createNewBlock: function(chemSpace, coord)
	{
		var editor = this.getEditor();
		if (!editor.canCreateNewChild())
			return null;

		editor.beginUpdateObject();
		try
		{
			var block = new Kekule.TextBlock();
			if (block)
			{
				chemSpace.appendChild(block);
				editor.setObjectScreenCoord(block, coord, Kekule.Render.CoordPos.CORNER_TL);
				//console.log('set text block cord', coord, block.getSize2D());
				var addOperation = new Kekule.ChemObjOperation.Add(block, chemSpace, null);
				this._operAddBlock = addOperation;
			}
		}
		finally
		{
			editor.endUpdateObject();
		}
		return block;
	},

	/**
	 * Returns text that shows in text block.
	 * @param {Kekule.TextBlock} block
	 * @returns {String}
	 * @private
	 */
	getBlockText: function(block)
	{
		return block.getText();
	},

	/** @ignore */
	execute: function(chemSpace, baseCoord, block)
	{
		this.openSetterUi(baseCoord, block);
	},

	/** @private */
	getTextSetterWidget: function(canCreate)
	{
		var result = this.getTextSetter();
		if (!result && canCreate)  // create new one
		{
			var parentElem = this.getEditor().getCoreElement();
			var doc = parentElem.ownerDocument;
			result = this._createTextSetterWidget(doc, parentElem);
			this.setTextSetter(result);
		}
		return result;
	},
	/** @private */
	_createTextSetterWidget: function(doc, parentElem)
	{
		var result = new Kekule.Widget.TextArea(doc);
		result.setAutoSizeX(true);
		result.setAutoSizeY(true);
		result.addClassName(CCNS.CHEMEDITOR_TEXT_SETTER);
		result.appendToElem(parentElem);

		// event handler
		var self = this;
		result.addEventListener('keyup', function(e)
			{
				var ev = e.htmlEvent;
				var keyCode = ev.getKeyCode();
				if ((keyCode === Kekule.X.Event.KeyCode.ENTER) && (ev.getCtrlKey()))  // ctrl+enter
				{
					self.applySetter(result);
					result.dismiss();  // avoid call apply setter twice
				}
				else if (keyCode === Kekule.X.Event.KeyCode.ESC)  // ESC, cancel editor
				{
					result.dismiss();
					self.cancelSetter();
				}
			}
		);
		result.addEventListener('showStateChange', function(e)
			{
				//console.log('show state change', e.isShown, e.isDismissed);
				if (!e.isShown && !e.isDismissed)  // widget hidden, feedback the edited value
				{
					self.applySetter(result);
				}
			}
		);
		return result;
	},
	/** @private */
	cancelSetter: function()
	{
		if (this._operAddBlock)  // already created new textblock, remove it
		{
			this._operAddBlock.reverse();
			this._operAddBlock = null;
		}
	},
	/** @private */
	applySetter: function(setter, block)
	{
		if (setter._applied)   // avoid call twice
			return;

		if (!block)
			block = this.getCurrBlock();

		var text = setter.getText();
		var oper;

		if (!text)
		{
			if (this._operAddBlock)  // just added text block
				this.cancelSetter();
			else
				oper = new Kekule.ChemObjOperation.Remove(block, block.getParent());
		}
		else
			oper = new Kekule.ChemObjOperation.Modify(block, {'text': text});

		if (oper)
		{
			oper.execute();

			var editor = this.getEditor();
			if (editor && editor.getEnableOperHistory())
			{
				if (this._operAddBlock)
				{
					var group = new Kekule.MacroOperation();
					group.add(this._operAddBlock);
					group.add(oper);
					editor.pushOperation(group);
					this._operAddBlock = null;
				}
				else
					editor.pushOperation(oper);
			}
		}

		setter._applied = true;
	},
	/**
	 * Open edit box for text block in coord.
	 * @param {Hash} coord
	 * @param {Object} block
	 */
	openSetterUi: function(coord, block)
	{
		var oldSetter = this.getTextSetter();
		if (oldSetter && oldSetter.isShown())  // has a old setter
		{
			this.applySetter(oldSetter, this.getCurrBlock());
		}

		if (!block)  // need create new
		{
			block = this.createNewBlock(this.getEditor().getChemObj(), coord);
		}

		if (!this.isValidBlock(block))
			return;
		this.setCurrBlock(block);

		this.getEditor().setSelection([block]);

		// calculate the top-left position of block
		var setterCoord = this.getEditor().getObjectScreenCoord(block, Kekule.Render.CoordPos.CORNER_TL);

		//console.log(block.getCascadedRenderOption('fontSize'));

		var fontSize = block.getCascadedRenderOption('fontSize') || this.getEditor().getEditorConfigs().getInteractionConfigs().getAtomSetterFontSize();
		var fontName = block.getCascadedRenderOption('fontFamily') || '';
		//var posAdjust = fontSize / 1.5;  // adjust position to align to atom center
		var text = this.getBlockText(block);
		var setter = this.getTextSetterWidget(true);
		setter._applied = false;
		var slabel = text || Kekule.$L('ChemWidgetTexts.CAPTION_TEXTBLOCK_INIT'); //Kekule.ChemWidgetTexts.CAPTION_TEXTBLOCK_INIT;
		//console.log(block, text, slabel);
		setter.setValue(slabel);
		//setter.setValue('hehr');
		//setter.setIsPopup(true);
		var style = setter.getElement().style;
		style.position = 'absolute';
		style.fontSize = fontSize + 'px';
		style.left = setterCoord.x + 'px';
		style.top = setterCoord.y + 'px';
		style.fontFamily = fontName;
		/*
		style.marginTop = -posAdjust + 'px';
		style.marginLeft = -posAdjust + 'px';
		*/
		setter.show(null, null, Kekule.Widget.ShowHideType.POPUP);
		setter.selectAll();
		setter.focus();
	}
});
// register
Kekule.Editor.IaControllerManager.register(Kekule.Editor.TextBlockIaController, Kekule.Editor.ChemSpaceEditor);


/**
 * Controller to add or edit image block in document.
 * @class
 * @augments Kekule.Editor.ContentBlockIaController
 */
Kekule.Editor.ImageBlockIaController = Class.create(Kekule.Editor.ContentBlockIaController,
/** @lends Kekule.Editor.ImageBlockIaController# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ImageBlockIaController',
	/** @construct */
	initialize: function($super, editor)
	{
		$super(editor);
		this._operAddBlock = null;  // private
		this._imgProbeElem = null;
		this._actionOpenFile = this.createOpenAction();
	},
	doFinalize: function()
	{
		if (this._actionOpenFile)
			this.actionOpenFile.finalize();
	},
	/** @private */
	initProperties: function()
	{
		//this.defineProp('currBlock', {'dataType': DataType.OBJECT, 'serializable': false});  // private
	},

	/**
	 * Check if obj is a valid text block and can be edited.
	 * @param {Kekule.ChemObject} obj
	 * @returns {Bool}
	 * @private
	 */
	isValidBlock: function(obj)
	{
		return obj instanceof Kekule.ImageBlock;
	},

	/** @private */
	createNewBlock: function(chemSpace, coord, size, src)
	{
		var editor = this.getEditor();
		if (!editor.canCreateNewChild())
			return null;

		editor.beginUpdateObject();
		try
		{
			var block = new Kekule.ImageBlock();
			if (src)
				block.setSrc(src);
			if (size)
				block.setSize2D(size);
			//chemSpace.appendChild(block);
			editor.setObjectScreenCoord(block, coord, Kekule.Render.CoordPos.CORNER_TL);
			var addOperation = new Kekule.ChemObjOperation.Add(block, chemSpace, null);
			this._operAddBlock = addOperation;
		}
		finally
		{
			editor.endUpdateObject();
		}
		return block;
	},
	/** @private */
	_getImgFilters: function()
	{
		// add png, jpg, gif and svg
		var result = [
			{'title': Kekule.$L('WidgetTexts.TITLE_IMG_FORMAT_PNG'), 'filter': '.png'},
			{'title': Kekule.$L('WidgetTexts.TITLE_IMG_FORMAT_JPG'), 'filter': '.jpg,.jpeg'},
			{'title': Kekule.$L('WidgetTexts.TITLE_IMG_FORMAT_GIF'), 'filter': '.gif'},
			{'title': Kekule.$L('WidgetTexts.TITLE_IMG_FORMAT_SVG'), 'filter': '.svg'},
			Kekule.NativeServices.FILTER_ALL_SUPPORT,
			Kekule.NativeServices.FILTER_ANY
		];
		return result;
	},
	/** @private */
	createOpenAction: function()
	{
		var result = new Kekule.ActionFileOpen();
		result.setFilters(this._getImgFilters());
		result.on('open', this.reactImageFileOpen, this);
		return result;
	},
	/** @private */
	reactImageFileOpen: function(e)
	{
		var file = e.file;
		if (file)
		{
			var self = this;
			var reader = new FileReader();
			reader.addEventListener('load', function(){
				var imgElem = self._getImageProbeElem();
				var doc = imgElem.ownerDocument;
				// hide imgElem and append it to body to calculate size
				//imgElem.style.display = 'none';
				//doc.body.appendChild(imgElem);
				try
				{
					// clear img prev width/height
					delete imgElem.width;
					delete imgElem.height;
				}
				catch(e)
				{

				}
				imgElem.src = reader.result;
				var editor = self.getEditor();
				//(function(){ console.log(imgElem.width, imgElem.height); }).defer();
				(function(){
					var size = {'x': imgElem.width, 'y': imgElem.height};
					if (size.x <= 0 || size.y <= 0)  // empty image
					{
						Kekule.error(Kekule.$L('ErrorMsg.INVALID_OR_EMPTY_IMAGE'));
						return;
					}
					//console.log('imgSize', size);
					//imgElem.parentNode.removeChild(imgElem);
					//size = editor.translateCoord(size, Kekule.Editor.CoordSys.SCREEN, Kekule.Editor.CoordSys.CHEM);
					//console.log('transSize', size);
					var coord1 = self._currCoord;
					var contextCoord1 = editor.objCoordToContext(coord1);
					var contextCoord2 = Kekule.CoordUtils.add(contextCoord1, size);
					var coord2 = editor.contextCoordToObj(contextCoord2);
					var size = Kekule.CoordUtils.substract(coord2, coord1);
					size = Kekule.CoordUtils.absValue(size);

					var currBlock = self.getCurrBlock();
					var oper;
					var chemSpace = editor.getChemObj();
					if (currBlock)  // modify existed
					{
						oper = new Kekule.ChemObjOperation.Modify(currBlock, {'src': reader.result, 'size2D': size});
					}
					else  // create new
					{
						var block = self.createNewBlock(self.getEditor().getChemObj(), self._currCoord, size, reader.result);
						self.setCurrBlock(block);
						oper = new Kekule.ChemObjOperation.Add(block, chemSpace, null);
					}
					if (oper)
					{
						//editor.beginUpdateObject();
						try
						{
							oper.execute();
							if (editor && editor.getEnableOperHistory())
								editor.pushOperation(oper);
						}
						finally
						{
							//editor.endUpdateObject();
						}
					}
				}).defer();  // execute later, get accurate image size
			});
			reader.readAsDataURL(file);
		}
	},
	/** @private */
	_getImageProbeElem: function()
	{
		if (!this._imgProbeElem)
		{
			var doc = this.getEditor().getElement().ownerDocument;
			this._imgProbeElem = doc.createElement('img');
		}
		return this._imgProbeElem;
	},

	/** @private */
	execute: function(chemSpace, baseCoord, block)
	{
		this.setCurrBlock(block);
		this._currCoord = baseCoord;
		this._actionOpenFile.execute(this.getEditor());
	}
});
// register
Kekule.Editor.IaControllerManager.register(Kekule.Editor.ImageBlockIaController, Kekule.Editor.ChemSpaceEditor);

})();