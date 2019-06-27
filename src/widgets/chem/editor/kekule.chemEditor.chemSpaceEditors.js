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
 * requires /widgets/chem/uiMarker/kekule.chemWidget.uiMarkers.js
 * requires /widgets/chem/editor/kekule.chemEditor.extensions.js
 * requires /widgets/chem/editor/kekule.chemEditor.editorUtils.js
 * requires /widgets/chem/editor/kekule.chemEditor.configs.js
 * requires /widgets/chem/editor/kekule.chemEditor.operations.js
 * requires /widgets/chem/editor/kekule.chemEditor.baseEditors.js
 * requires /widgets/chem/editor/kekule.chemEditor.repositories.js
 * requires /widgets/chem/editor/kekule.chemEditor.utilWidgets.js
 */

(function(){

"use strict";

var AU = Kekule.ArrayUtils;
var CU = Kekule.CoordUtils;
var CCNS = Kekule.ChemWidget.HtmlClassNames;
//var CWT = Kekule.ChemWidgetTexts;

/** @ignore */
Kekule.ChemWidget.HtmlClassNames = Object.extend(Kekule.ChemWidget.HtmlClassNames, {
	CHEMSPACE_EDITOR: 'K-Chem-Space-Editor',
	CHEMSPACE_EDITOR2D: 'K-Chem-Space-Editor2D',
	CHEMSPACE_EDITOR3D: 'K-Chem-Space-Editor3D',

	CHEMEDITOR_ATOM_SETTER: 'K-ChemEditor-Atom-Setter',
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
 * @property {Bool} allowAppendDataToCurr Whether display "append data" check box in the dialog of data load action.
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
		this.setPropStoreFieldValue('allowAppendDataToCurr', true);
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
		this.defineProp('autoCreateNewStructFragment', {'dataType': DataType.BOOL,
			'getter': function()
			{
				return this.getPropStoreFieldValue('autoCreateNewStructFragment') && this.canCreateNewChild();
			}
		});
		this.defineProp('allowCreateNewChild', {'dataType': DataType.BOOL});
		this.defineProp('allowAppendDataToCurr', {'dataType': DataType.BOOL});
	},
	/** @ignore */
	initPropValues: function($super)
	{
		$super();
		this.setFileDroppable(true);  // defaultly turn on file drop function
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
					var result = $super(value);
					// auto scroll
					if (this.getEditorConfigs().getInteractionConfigs().getScrollToObjAfterLoading())
					{
						var objs = value.getChildren();
						if (objs && objs.length)
							this.scrollClientToObject(objs);
					}
					return result;
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
	doLoad: function($super, chemObj)
	{
		// supply essential charge and radical markers
		this._supplyChemMarkersOnObj(chemObj);
		$super(chemObj);
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

		return result;
	},
	/** @ignore */
	resetDisplay: function($super)
	{
		// called after loading a new chemObj, or creating a new doc
		$super();
		this.resetClientDisplay();
	},
	/** @private */
	resetClientDisplay: function()
	{
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
			this.scrollClientTo(0, (screenSize.x * this.getCurrZoom() - visibleClientSize.width) / 2);
		}
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
		/*
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
		*/
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
		//if (!textBlock.__$needRecalcSize__)
		if (!textBlock.getNeedRecalcSize())
			return;

		var stype = boundInfo.shapeType;
		if (stype === Kekule.Render.BoundShapeType.RECT)
		{
			/*
			console.log('boundddddd', boundInfo);
			var coords = boundInfo.coords;  // context coords
			var objCoord1 = this.contextCoordToObj(coords[0]);
			var objCoord2 = this.contextCoordToObj(coords[1]);
			var delta = Kekule.CoordUtils.substract(objCoord2, objCoord1);
			// must not use setSize2D, otherwise a new object change event will be triggered and a new update process will be launched
			textBlock.setPropStoreFieldValue('size2D', {'x': Math.abs(delta.x), 'y': Math.abs(delta.y)});
			//textBlock.setSize2D({'x': Math.abs(delta.x), 'y': Math.abs(delta.y)});
			//delete textBlock.__$needRecalcSize__;
			textBlock.setNeedRecalcSize(false);
			*/
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
	_initChemSpaceDefProps: function(chemSpace, containingChemObj, forceResetSize2D)
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
			if (!chemSpace.getSize2D() || forceResetSize2D)
			{
				var refScreenLength = this.getRenderConfigs().getLengthConfigs().getDefBondLength();
				var ratio = chemSpace.getDefAutoScaleRefLength() / refScreenLength;
				chemSpace.setObjScreenLengthRatio(ratio);
				chemSpace.setSize2D({'x': screenSize.x * ratio, 'y': screenSize.y * ratio});
			}
		}
		if (chemSpace.setIsEditing)
			chemSpace.setIsEditing(true);
	},

	/**
	 * Change the size of current chemspace.
	 * The screen size of the space will also be modified in 2D coord mode.
	 * @param {Hash} size
	 * @param {Int} coordMode
	 */
	changeChemSpaceSize: function(size, coordMode)
	{
		var chemSpace = this.getChemSpace();
		chemSpace.setSizeOfMode(size, coordMode);

		// now only change screen size in 2D mode
		if (coordMode === Kekule.CoordMode.COORD2D)
		{
			var ratio = chemSpace.getObjScreenLengthRatio();
			if (!ratio)
			{
				var refScreenLength = this.getRenderConfigs().getLengthConfigs().getDefBondLength();
				ratio = chemSpace.getDefAutoScaleRefLength() / refScreenLength;
			}
			if (ratio)
			{
				chemSpace.setScreenSize({'x': size.x / ratio, 'y': size.y / ratio});
			}
		}
		this.resetClientDisplay();
	},
	/**
	 * Change the screen size of current chem space in editor.
	 * The size2D of chemSpace will also be modified.
	 * @param {Hash} screenSize
	 */
	changeChemSpaceScreenSize: function(screenSize)
	{
		var chemSpace = this.getChemSpace();
		var ratio = chemSpace.getObjScreenLengthRatio();
		if (!ratio)
		{
			var refScreenLength = this.getRenderConfigs().getLengthConfigs().getDefBondLength();
			ratio = chemSpace.getDefAutoScaleRefLength() / refScreenLength;
		}
		if (ratio)
		{
			// change size 2D
			chemSpace.setSize2D({'x': screenSize.x * ratio, 'y': screenSize.y * ratio});
		}
		chemSpace.setScreenSize(screenSize);
		this.resetClientDisplay();
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
	 * @param {Bool} keepRelations If true, the object reference relations between objects will be kept in the cloned ones.
	 * @returns {Array} Actually cloned objects.
	 */
	cloneObjects: function(objects, screenCoordOffset, addToSpace, keepRelations)
	{
		var self = this;
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

		var _findParentObjOrSelf = function(targetObj, candidateObjs)
		{
			for (var i = 0, l = candidateObjs.length; i < l; ++i)
			{
				var candObj = candidateObjs[i];
				if (targetObj === candObj || (targetObj.isChildOf && targetObj.isChildOf(candObj)))
					return candObj;
			}
			return null;
		};

		var getRelatedObjRefRelations = function(standAloneObjs, owner)
		{
			var result = [];
			if (!owner)
				owner = self.getChemObj();  // the root chemspace
			var relations = owner.getObjRefRelations && owner.getObjRefRelations();
			if (relations)
			{
				// check each relation
				for (var i = 0, l = relations.length; i < l; ++i)
				{
					var rel = relations[i];
					var src = rel.srcObj;
					var dests = AU.toArray(rel.dest);
					var matchedSrc = _findParentObjOrSelf(src, standAloneObjs);
					var matchedDests = [];
					var matchAtLeastOneDest = false;
					if (matchedSrc)
					{
						for (var j = 0, k = dests.length; j < k; ++j)
						{
							var dest = dests[j];
							var matchedDest = _findParentObjOrSelf(dest, standAloneObjs);
							if (matchedDest)
								matchAtLeastOneDest = true;
							matchedDests.push(matchedDest);
						}

						if (matchAtLeastOneDest)
							result.push({'relation': rel, 'srcParent': matchedSrc, 'destParents': matchedDests});
					}
				}
			}
			return result;
		};

		var getNewObjRefRelation = function(relationMatch, oldObjs, clonedObjs)
		{
			var oldRelation = relationMatch.relation;
			var oldSrcParent = relationMatch.srcParent;
			var oldDestParents = relationMatch.destParents;
			var indexStack, newSrcObj, newDestObjs = [];

			// src
			var srcIndex = oldObjs.indexOf(oldSrcParent);
			var newSrcParent = clonedObjs[srcIndex];
			if (oldRelation.srcObj === oldSrcParent)
				newSrcObj = newSrcParent;
			else
			{
				indexStack = oldSrcParent.indexStackOfChild && oldSrcParent.indexStackOfChild(oldRelation.srcObj);
				if (indexStack)
				{
					newSrcObj = newSrcParent.getChildAtIndexStack && newSrcParent.getChildAtIndexStack(indexStack);
				}
			}
			if (!newSrcObj)
				return null;

			// dest
			var destIsArray = AU.isArray(oldRelation.dest);
			var oldDests = destIsArray? oldRelation.dest: [oldRelation.dest];
			for (var i = 0, l = oldDestParents.length; i <l; ++i)
			{
				var oldDestParent = oldDestParents[i];
				var destIndex = oldObjs.indexOf(oldDestParent);
				var newDestParent = clonedObjs[destIndex];
				var newDestObj;
				if (oldDestParent)  // parent has been cloned
				{
					if (oldDestParent === oldDests[i])
						newDestObjs.push(newDestParent);
					else if (oldDests[i])
					{
						indexStack = oldDestParent.indexStackOfChild && oldDestParent.indexStackOfChild(oldDests[i]);
						if (indexStack)
						{
							newDestObj = newDestParent.getChildAtIndexStack && newDestParent.getChildAtIndexStack(indexStack);
							if (newDestObj)
								newDestObjs.push(newDestObj);
						}
					}
				}
			}
			if (!newDestObjs.length)
				return null;

			var newDestValue = destIsArray? newDestObjs: newDestObjs[0];

			var newRelation = {'srcObj': newSrcObj, 'srcProp': oldRelation.srcProp, 'dest': newDestValue};
			return newRelation;
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

		// find related relations
		var owner = this.getChemSpace();
		var relationMatches = getRelatedObjRefRelations(standAloneObjs, owner);

		// start clone
		var space = this.getChemSpace();
		var clonedObjs = [];
		var coordMode = this.getCoordMode();
		var allowCoordBorrow = this.getAllowCoordBorrow();
		var standAloneObjCount = standAloneObjs.length;
		/*
		for (var i = 0; i < standAloneObjCount; ++i)
		{
			var obj = standAloneObjs[i];
			var clonedObj = obj.clone();
			// clear ids to avoid conflict
			if (clonedObj.clearIds)
				clonedObj.clearIds();

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
		*/

		//var interSpace = new Kekule.IntermediateChemSpace();
		//try
		{
			// clone objects first, and put them in a inter chemspace to build relations
			for (var i = 0; i < standAloneObjCount; ++i)
			{
				var obj = standAloneObjs[i];
				var clonedObj = obj.clone();
				// clear ids to avoid conflict
				if (clonedObj.clearIds)
					clonedObj.clearIds();
				clonedObjs.push(clonedObj);
			}
			//interSpace.appendChildren(clonedObjs);
			// copy cloned object to a inter chem space, to build relations

			// then map the new relations
			var newRelations = [];
			for (var i = 0, l = relationMatches.length; i < l; ++i)
			{
				var relationMatch = relationMatches[i];
				var newRelation = getNewObjRefRelation(relationMatch, standAloneObjs, clonedObjs);
				if (newRelation)
				{
					newRelations.push(newRelation);
					/*
					newRelation.srcObj.setPropValue(newRelation.srcProp.name, newRelation.dest);  // link objects
					console.log('new relation', newRelation, newRelation.srcObj.getOwner(), newRelation.srcObj, newRelation.srcObj.getPropValue(newRelation.srcProp.name));
					*/
				}
			}

			// then remove unessential children
			for (var i = 0; i < standAloneObjCount; ++i)
			{
				var obj = standAloneObjs[i];
				var clonedObj = clonedObjs[i];

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
			}

			// at last rebuild the relations
			for (var i = 0, l = newRelations.length; i < l; ++i)
			{
				var newRelation = newRelations[i];
				// check if new src/dest are not removed
				var finalDest;
				var hasNewSrcObj = _findParentObjOrSelf(newRelation.srcObj, clonedObjs);
				if (hasNewSrcObj)
				{
					if (AU.isArray(newRelation.dest))
					{
						finalDest = [];
						for (var j = 0, k = newRelation.dest.length; j < k; ++j)
						{
							var destObj = newRelation.dest[j];
							if (_findParentObjOrSelf(destObj, clonedObjs))
								finalDest.push(destObj);
						}
						if (!finalDest.length)
							finalDest = null;
					}
					else
					{
						if (_findParentObjOrSelf(newRelation.dest, clonedObjs))
							finalDest = newRelation.dest;
					}

					if (finalDest)  // now we can map the new relation
					{
						newRelation.srcObj.setPropValue(newRelation.srcProp.name, finalDest);  // link objects
						//console.log('new relation', newRelation, newRelation.srcObj.getOwner(), newRelation.srcObj, newRelation.srcObj.getPropValue(newRelation.srcProp.name));
					}
				}
			}
		}
		//finally
		{
			//interSpace.finalize();
		}
		childObjMap.finalize();

		return clonedObjs;
	},

	/**
	 * Clone objects in editor's selection.
	 * @param {Hash} coordOffset New cloned objects will be moved based on this coord.
	 *   If this value is not set, a default one will be used.
	 * @param {Bool} addToSpace If true, the objects cloned will be added to space immediately.
	 * @param {Bool} allowCloneSpace If true, the chemspace itself can be cloned when being selected.
	 *   Otherwise, the cloned targets are its children.
	 * @returns {Array} Actually cloned objects.
	 */
	cloneSelection: function(coordOffset, addToSpace, allowCloneSpace)
	{
		var _getActualTargetObjs = function(objs, allowCloneSpace)
		{
			var result = [];
			for (var i = 0, l = objs.length; i < l; ++i)
			{
				var obj = objs[i];
				if ((obj instanceof Kekule.ChemSpace) && !allowCloneSpace)  // can not clone chemspace, use its children instead
				{
					var children = obj.getChildren();
					AU.pushUnique(result, children);
				}
				else
					AU.pushUnique(result, obj);
			}
			return result;
		};

		if (coordOffset === undefined)  // use default one
		{
			coordOffset = this.getDefaultCloneScreenCoordOffset();
		}
		var objs = this.getSelection();
		objs = _getActualTargetObjs(objs, allowCloneSpace);
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
	},

	/**
	 * Supply essential charge and radical markers when loading a new chemObj.
	 * @private
	 */
	_supplyChemMarkersOnObj: function(chemObj)
	{
		if (chemObj)
		{
			var structFragments = Kekule.ChemStructureUtils.getAllStructFragments(chemObj, true);
			if (structFragments || structFragments.length)
			{
				for (var i = 0, l = structFragments.length; i < l; ++i)
				{
					this._createLosingChemMarkerOnStructFragment(structFragments[i]);
				}
			}
		}
	},
	/** @private */
	_createLosingChemMarkerOnStructFragment: function(mol)
	{
		mol.beginUpdate();
		try
		{
			if (mol.getCharge && mol.getCharge())
				mol.fetchChargeMarker(true);
			// then the children
			var nodes = mol.getNodes();
			for (var i = 0, l = mol.getNodeCount(); i < l; ++i)
			{
				var node = mol.getNodeAt(i);
				node.beginUpdate();
				try
				{
					if (node.getCharge())
						node.fetchChargeMarker(true);
					if (node.getRadical())
						node.fetchRadicalMarker(true);
					if (node.getNodeAt)  // is sub fragment
						this._createLosingChemMarkerOnStructFragment(node);
				}
				finally
				{
					node.endUpdate();
				}
			}
		}
		finally
		{
			mol.endUpdate();
		}
	},

	/**
	 * A helper function returning the available non-atom settings used by atom setter widget.
	 * @returns {Array}
	 */
	getEnabledNonAtomInputData: function()
	{
		var result = [];
		var labelConfigs = this.getRenderConfigs().getDisplayLabelConfigs();
		var nonAtomSetting = this.getEditorConfigs().getStructureConfigs().getEnabledNonAtomNodeTypes();

		// R group
		if (nonAtomSetting.RGroup)
			result.push({
				'text': labelConfigs.getRgroup(), 'nodeClass': Kekule.RGroup,
				'description': Kekule.$L('ChemWidgetTexts.CAPTION_RGROUP') //Kekule.ChemWidgetTexts.CAPTION_RGROUP
			});
		// Kekule.Pseudoatom
		if (nonAtomSetting.pseudoatomDummy)
			result.push({
				'text': labelConfigs.getDummyAtom(), 'nodeClass': Kekule.Pseudoatom,
				'props': {'atomType': Kekule.PseudoatomType.DUMMY},
				'description': Kekule.$L('ChemWidgetTexts.CAPTION_DUMMY_ATOM') //Kekule.ChemWidgetTexts.CAPTION_DUMMY_ATOM
			});
		if (nonAtomSetting.pseudoatomHetero)
			result.push({
				'text': labelConfigs.getHeteroAtom(), 'nodeClass': Kekule.Pseudoatom,
				'props': {'atomType': Kekule.PseudoatomType.HETERO},
				'description': Kekule.$L('ChemWidgetTexts.CAPTION_HETERO_ATOM') //Kekule.ChemWidgetTexts.CAPTION_HETERO_ATOM
			});
		if (nonAtomSetting.pseudoatomAny)
			result.push({
				'text': labelConfigs.getAnyAtom(), 'nodeClass': Kekule.Pseudoatom,
				'props': {'atomType': Kekule.PseudoatomType.ANY},
				'description': Kekule.$L('ChemWidgetTexts.CAPTION_ANY_ATOM') //Kekule.ChemWidgetTexts.CAPTION_ANY_ATOM
			});
		// Kekule.VariableAtom List and Not List
		if (nonAtomSetting.variableAtomList)
			result.push({
				'text': this._getVarAtomListLabel(), 'nodeClass': Kekule.VariableAtom,
				'isVarList': true,
				'description': Kekule.$L('ChemWidgetTexts.CAPTION_VARIABLE_ATOM') //Kekule.ChemWidgetTexts.CAPTION_VARIABLE_ATOM
			});
		if (nonAtomSetting.variableAtomNotList)
			result.push({
				'text': this._getVarAtomNotListLabel(), 'nodeClass': Kekule.VariableAtom,
				'isNotVarList': true,
				'description': Kekule.$L('ChemWidgetTexts.CAPTION_VARIABLE_NOT_ATOM') //Kekule.ChemWidgetTexts.CAPTION_VARIABLE_NOT_ATOM
			});
		return result;
	},
	/** @private */
	_getVarAtomListLabel: function()
	{
		var labelConfigs = this.getRenderConfigs().getDisplayLabelConfigs();
		return labelConfigs? labelConfigs.getVariableAtom(): Kekule.ChemStructureNodeLabels.VARIABLE_ATOM;
	},
	/** @private */
	_getVarAtomNotListLabel: function()
	{
		var labelConfigs = this.getRenderConfigs().getDisplayLabelConfigs();
		return '~' + (labelConfigs? labelConfigs.getVariableAtom(): Kekule.ChemStructureNodeLabels.VARIABLE_ATOM);
	},

	/**
	 * A helper function returning the available bond form data used by bond setter widget.
	 * @returns {Array}
	 */
	getEnabledBondFormData: function()
	{
		var BT = Kekule.BondType;
		var BO = Kekule.BondOrder;
		var BS = Kekule.BondStereo;
		var $L = Kekule.$L;
		var HTMLCLASS_PREFIX = 'K-Chem-MolBondIaController-';
		var predefinedBondData = {
			// covalent bond types
			'single': {
				'text': $L('ChemWidgetTexts.CAPTION_MOL_BOND_SINGLE'),
				'hint': $L('ChemWidgetTexts.HINT_MOL_BOND_SINGLE'),
				'htmlClass': HTMLCLASS_PREFIX + 'Single',
				'isDefault': true,   // the default bond type
				'bondProps': {'bondType': BT.COVALENT, 'bondOrder': BO.SINGLE,	'stereo': BS.NONE}
			},
			'double': {
				'text': $L('ChemWidgetTexts.CAPTION_MOL_BOND_DOUBLE'),
				'hint': $L('ChemWidgetTexts.HINT_MOL_BOND_DOUBLE'),
				'htmlClass': HTMLCLASS_PREFIX + 'Double',
				'bondProps': {'bondType': BT.COVALENT, 'bondOrder': BO.DOUBLE,	'stereo': BS.NONE}
			},
			'triple': {
				'text': $L('ChemWidgetTexts.CAPTION_MOL_BOND_TRIPLE'),
				'hint': $L('ChemWidgetTexts.HINT_MOL_BOND_TRIPLE'),
				'htmlClass': HTMLCLASS_PREFIX + 'Triple',
				'bondProps': {'bondType': BT.COVALENT, 'bondOrder': BO.TRIPLE, 'stereo': BS.NONE}
			},
			'quad': {
				'text': $L('ChemWidgetTexts.CAPTION_MOL_BOND_QUAD'),
				'hint': $L('ChemWidgetTexts.HINT_MOL_BOND_QUAD'),
				'htmlClass': HTMLCLASS_PREFIX + 'Quad',
				'bondProps': {'bondType': BT.COVALENT, 'bondOrder': BO.QUAD,	'stereo': BS.NONE}
			},
			'explicitAromatic': {
				'text': $L('ChemWidgetTexts.CAPTION_MOL_BOND_EXPLICIT_AROMATIC'),
				'hint': $L('ChemWidgetTexts.HINT_MOL_BOND_EXPLICIT_AROMATIC'),
				'htmlClass': HTMLCLASS_PREFIX + 'Aromatic',
				'bondProps': {'bondType': BT.COVALENT, 'bondOrder': BO.EXPLICIT_AROMATIC,	'stereo': BS.NONE}
			},
			// stereo bond types
			'up': {
				'text': $L('ChemWidgetTexts.CAPTION_MOL_BOND_WEDGEUP'),
				'hint': $L('ChemWidgetTexts.HINT_MOL_BOND_WEDGEUP'),
				'htmlClass': HTMLCLASS_PREFIX + 'WedgeUp',
				'bondProps': {'bondType': BT.COVALENT, 'bondOrder': BO.SINGLE,	'stereo': BS.UP}
			},
			'upInverted': {
				'text': $L('ChemWidgetTexts.CAPTION_MOL_BOND_WEDGEUP_INVERTED'),
				'hint': $L('ChemWidgetTexts.HINT_MOL_BOND_WEDGEUP_INVERTED'),
				'htmlClass': HTMLCLASS_PREFIX + 'WedgeUpInverted',
				'bondProps': {'bondType': BT.COVALENT, 'bondOrder': BO.SINGLE,	'stereo': BS.UP_INVERTED}
			},
			'down': {
				'text': $L('ChemWidgetTexts.CAPTION_MOL_BOND_WEDGEDOWN'),
				'hint': $L('ChemWidgetTexts.HINT_MOL_BOND_WEDGEDOWN'),
				'htmlClass': HTMLCLASS_PREFIX + 'WedgeDown',
				'bondProps': {'bondType': BT.COVALENT, 'bondOrder': BO.SINGLE,	'stereo': BS.DOWN}
			},
			'downInverted': {
				'text': $L('ChemWidgetTexts.CAPTION_MOL_BOND_WEDGEDOWN_INVERTED'),
				'hint': $L('ChemWidgetTexts.HINT_MOL_BOND_WEDGEDOWN_INVERTED'),
				'htmlClass': HTMLCLASS_PREFIX + 'WedgeDownInverted',
				'bondProps': {'bondType': BT.COVALENT, 'bondOrder': BO.SINGLE,	'stereo': BS.DOWN_INVERTED}
			},
			'upOrDown': {
				'text': $L('ChemWidgetTexts.CAPTION_MOL_BOND_WAVY'),
				'hint': $L('ChemWidgetTexts.HINT_MOL_BOND_WAVY'),
				'htmlClass': HTMLCLASS_PREFIX + 'WedgeUpOrDown',
				'bondProps': {'bondType': BT.COVALENT, 'bondOrder': BO.SINGLE,	'stereo': BS.UP_OR_DOWN}
			},
			'closer': {
				'text': $L('ChemWidgetTexts.CAPTION_MOL_BOND_CLOSER'),
				'hint': $L('ChemWidgetTexts.HINT_MOL_BOND_CLOSER'),
				'htmlClass': HTMLCLASS_PREFIX + 'Closer',
				'bondProps': {'bondType': BT.COVALENT, 'bondOrder': BO.SINGLE,	'stereo': BS.CLOSER}
			},
			'eOrZ': {
				'text': $L('ChemWidgetTexts.CAPTION_MOL_BOND_DOUBLE_EITHER'),
				'hint': $L('ChemWidgetTexts.HINT_MOL_BOND_DOUBLE_EITHER'),
				'htmlClass': HTMLCLASS_PREFIX + 'Double-Either',
				'bondProps': {'bondType': BT.COVALENT, 'bondOrder': BO.DOUBLE,	'stereo': BS.E_OR_Z}
			},
			// other types
			'ionic': {
				'text': $L('ChemWidgetTexts.CAPTION_MOL_BOND_IONIC'),
				'hint': $L('ChemWidgetTexts.HINT_MOL_BOND_IONIC'),
				'htmlClass': HTMLCLASS_PREFIX + 'Ionic',
				'bondProps': {'bondType': BT.IONIC}
			},
			'coordinate': {
				'text': $L('ChemWidgetTexts.CAPTION_MOL_BOND_COORDINATE'),
				'hint': $L('ChemWidgetTexts.HINT_MOL_BOND_COORDINATE'),
				'htmlClass': HTMLCLASS_PREFIX + 'Coordinate',
				'bondProps': {'bondType': BT.COORDINATE}
			},
			'metallic': {
				'text': $L('ChemWidgetTexts.CAPTION_MOL_BOND_METALLIC'),
				'hint': $L('ChemWidgetTexts.HINT_MOL_BOND_METALLIC'),
				'htmlClass': HTMLCLASS_PREFIX + 'Metallic',
				'bondProps': {'bondType': BT.METALLIC}
			},
			'hydrogen': {
				'text': $L('ChemWidgetTexts.CAPTION_MOL_BOND_HYDROGEN'),
				'hint': $L('ChemWidgetTexts.HINT_MOL_BOND_HYDROGEN'),
				'htmlClass': HTMLCLASS_PREFIX + 'Hydrogen',
				'bondProps': {'bondType': BT.HYDROGEN}
			}
		};
		var predefinedExtraData = {
			'single': {},
			'double': {'text': $L('ChemWidgetTexts.CAPTION_MOL_BOND_DOUBLE'), 'hint': $L('ChemWidgetTexts.HINT_MOL_BOND_DOUBLE')}
		};
		var bondForms = this.getEditorConfigs().getStructureConfigs().getEnabledBondForms();
		var keys = Kekule.ObjUtils.getOwnedFieldNames(bondForms, false);
		var result = [];
		for (var i = 0, l = keys.length; i < l; ++i)
		{
			var key = keys[i];
			if (bondForms[key]) // this form should be available
			{
				if (DataType.isObjectValue(bondForms[key]))  // a custom bond form
					result.push(bondForms[key]);
				else if (predefinedBondData[key])
					result.push(predefinedBondData[key]);
			}
		}
		return result;
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
	/**
	 * @private
	 */
	doGetActualRemovedObjs: function(objs)
	{
		var result = [];
		var editorRoot = this.getEditor().getChemObj();
		//Kekule.ArrayUtils.pushUnique(result, objs);
		for (var i = 0, l = objs.length; i < l; ++i)
		{
			var delObjs;
			var obj = objs[i];
			if ((obj instanceof Kekule.ChemSpace) && (obj === editorRoot))  // can not remove root chem space in editor, use its children instead
			{
				delObjs = obj.getChildren();
			}
			else
			{
				Kekule.ArrayUtils.pushUnique(result, obj);
				delObjs = obj.getCascadeDeleteObjs ? obj.getCascadeDeleteObjs() : [];
			}
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
				oper = new Kekule.ChemStructOperation.RemoveNode(obj, null, null, editor);
				Kekule.ArrayUtils.pushUnique(molParents, obj.getParent());
			}
			else if (obj instanceof /*Kekule.ChemStructureConnector*/Kekule.BaseStructureConnector)
			{
				oper = new Kekule.ChemStructOperation.RemoveConnector(obj, null, null, editor);
				Kekule.ArrayUtils.pushUnique(molParents, obj.getParent());
			}
			else
			{
				oper = new Kekule.ChemObjOperation.Remove(obj, null, null, editor);
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
				var standardizeOper = new Kekule.ChemStructOperation.StandardizeStructFragment(mol, editor);
				standardizeOper.setEnableSplit(this.getEditor().canCreateNewChild());  // if can not create new child, split is disabled.
				operGroup.add(standardizeOper);
			}
		}

		//operGroup.execute();
		editor.execOperation(operGroup);

		/* Do not need to add to history, since it has been done in editor.execOperation
		// add to history
		if (editor && editor.getEnableOperHistory())
		{
			editor.pushOperation(operGroup);
		}
		*/
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
 * @property {Bool} enableNodeStick
 * @property {Bool} enableSiblingStick
 * @property {Bool} enableStructFragmentStick
 * @property {Bool} enableConstrainedMove
 //* @property {Bool} enableLengthChangeInConstrainedMoving
 * @property {Bool} enableConstrainedRotate
 * @property {Bool} enableConstrainedResize
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
		this.setEnableNodeStick(true);
		this.setEnableStructFragmentStick(true);
		this.setEnableConstrainedMove(true);
		this.setEnableConstrainedRotate(true);
		this.setEnableConstrainedResize(true);
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

		this.defineProp('enableNodeStick', {'dataType': DataType.BOOL});
		this.defineProp('enableSiblingStick', {'dataType': DataType.BOOL});
		this.defineProp('enableStructFragmentStick', {'dataType': DataType.BOOL});

		this.defineProp('enableConstrainedMove', {'dataType': DataType.BOOL, 'serializable': false});
		//this.defineProp('enableLengthChangeInConstrainedMoving', {'dataType': DataType.BOOL, 'serializable': false});

		this.defineProp('enableConstrainedRotate', {'dataType': DataType.BOOL, 'serializable': false});
		this.defineProp('enableConstrainedResize', {'dataType': DataType.BOOL, 'serializable': false});

		this.defineProp('enableDirectedMove', {'dataType': DataType.BOOL, 'serializable': false});

		this.defineProp('stickOperations', {'dataType': DataType.ARRAY, 'serializable': false});  // store operations of sticking
		this.defineProp('mergeOperations', {'dataType': DataType.ARRAY, 'serializable': false});  // store operations of merging
		this.defineProp('mergePreviewOperations', {'dataType': DataType.ARRAY, 'serializable': false});  // store preview operations of merging
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
		if (this.getMergingDests() && !this.useMergePreview())
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
	 * Check if currently is in constrained resize mode.
	 * In that mode, objects can only be rotate to some certain angle.
	 * @returns {Bool}
	 * @private
	 */
	isConstrainedResize: function()
	{
		return this.getEnableConstrainedResize();
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
				/*
				if (obj instanceof Kekule.ChemStructureNode)
				{
					return (obj.getLinkedObjs().length === 1);
				}
				*/
				return obj.getConstraintManipulationBaseObj && obj.getConstraintManipulationBaseObj();
			}
		}
		return false;
	},
	/**
	 * Check if currently in real constrained rotation and the constrains are not suppressed (e.g., pressing the Alt key).
	 * @returns {Bool}
	 */
	isInActualConstrainedRotation: function()
	{
		return (this.isConstrainedRotate() && (!this._suppressConstrainedRotating));
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
	useMergePreview: function()
	{
		return this._useMergePreview;
	},
	/** @private */
	setUseMergePreview: function(value)
	{
		this._useMergePreview = value;
	},
	/** @private */
	getMergeOperationsInManipulating: function()
	{
		return this._useMergePreview? this.getMergePreviewOperations(): this.getMergeOperations();
	},

	/** @private */
	createManipulateObjInfo: function($super, obj, objIndex, startContextCoord)
	{
		var editor = this.getEditor();
		var info = $super(obj, objIndex, startContextCoord);
		var isConstrained = this.isConstrainedMove();
		if (isConstrained)  // constrained move, store connector length into info
		{
			/*
			var connector = obj.getLinkedConnectors()[0];
			var connectedNode = obj.getLinkedObjs()[0];
			*/
			var stubObj = obj.getConstraintManipulationBaseObj();
			//if (connector && connectedNode)
			if (stubObj)
			{
				info.isConstrained = true;
				if (!info.hasNoCoord)
				{
					info.originScreenCoord = editor.getObjectScreenCoord(obj);
					//info.refScreenCoord = editor.getObjectScreenCoord(connectedNode);
					info.refScreenCoord = editor.getObjectScreenCoord(stubObj);

					info.connectorScreenLength = Kekule.CoordUtils.getDistance(info.screenCoord, info.refScreenCoord);
					//info.connectorObjLength = connector.getLength(this.getEditor().getCoordMode(), this.getEditor().getAllowCoordBorrow());
					info.connectorObjLength = Kekule.CoordUtils.getDistance(editor.getObjCoord(obj), editor.getObjCoord(stubObj));
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
	getAllowLengthChangeInConstrainedMoving: function(obj)
	{
		// only allow length change when constrained moving path node,
		// other ones (including molecule atom) are not allowed
		// TODO: maybe a more flexible approach is needed here
		if (obj instanceof Kekule.Glyph.PathGlyphNode)
			return true;
		else
			return false;
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
			var currScreenLength = C.getDistance(currVector);

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

			// calc actual connector length
			var actualLength;
			if (this.getAllowLengthChangeInConstrainedMoving(obj))
			{
				var baseLength = this.getEditor().getDefBondScreenLength();
				var lengthRatio = currScreenLength / baseLength /*info.connectorScreenLength*/;
				var resizeStep = this.getEditorConfigs().getInteractionConfigs().getConstrainedResizeStep();
				lengthRatio = (Math.round(lengthRatio / resizeStep) || 1) * resizeStep;  // do not scale to 0
				actualLength = /* info.connectorScreenLength */ baseLength * lengthRatio;
			}
			else
				actualLength = info.connectorScreenLength;

			/*
			result = C.add(info.refScreenCoord,
				{'x': info.connectorScreenLength * Math.cos(directionAngle), 'y': info.connectorScreenLength * Math.sin(directionAngle)});
			*/
			result = C.add(info.refScreenCoord,
					{'x': actualLength * Math.cos(directionAngle), 'y': actualLength * Math.sin(directionAngle)});
			//console.log(directionAngle, result);
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
			//var times = Math.floor(newDeltaAngle / angleStep);
			var times = Math.round(newDeltaAngle / angleStep);
			return times * angleStep;
		}
		else
			return $super(objs, newDeltaAngle/*, oldAbsAngle, newAbsAngle*/);
	},
	/** @private */
	_calcActualResizeScales: function(objs, newScales)
	{
		var isConstrained = (this.isConstrainedResize() && (!this._suppressConstrainedResize));
		if (!isConstrained)
			return newScales;
		else  // constrained scale calculation
		{
			var scaleStep = this.getEditorConfigs().getInteractionConfigs().getConstrainedResizeStep();
			if (scaleStep)
			{
				var sx = (Math.round(newScales.scaleX / scaleStep) || 1) * scaleStep;  // do not scale to 0
				var sy = (Math.round(newScales.scaleY / scaleStep) || 1) * scaleStep;
				var actualScales = {
					'scaleX': sx,
					'scaleY': sy
				};
				return actualScales;
			}
			else
				return newScales;
		}
	},

	/** @private */
	prepareManipulating: function($super, manipulationType, manipulatingObjs, startScreenCoord, startBox, rotateCenter, rotateRefCoord)
	{
		/*
		this.setIsMergeDone(false);
		this.setMergeOperation(null);
		*/
		this.setUseMergePreview(this.getEditorConfigs().getInteractionConfigs().getEnableMergePreview());
		this.setMergeOperations([]);
		this.setMergePreviewOperations([]);
		this.setStickOperations([]);
		$super(manipulationType, manipulatingObjs, startScreenCoord, startBox, rotateCenter, rotateRefCoord);
		//this._mergeReversed = false;  // internal flag
		this._directedMovingDirection = null;
		this.setManuallyHotTrack(true);  // manully hot track
		//console.log('start', this.getManuallyHotTrack());
	},

	/** @ignore */
	manipulateEnd: function($super)
	{
		$super();
		this.getEditor().hideHotTrack();
		this.setManuallyHotTrack(false);
	},

	/** @ignore */
	createManipulateOperation: function($super)
	{
		$super();
		//this.setStickOperations([]);
		this.setMergeOperations([]);
		this.setMergePreviewOperations([]);
		this.setStickOperations([]);
	},

	/** @ignore */
	getAllObjOperations: function($super, isTheFinalOperationToEditor)
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

		//console.log('getAllObjOperations', isTheFinalOperationToEditor, this.useMergePreview());
		var mergeOpers;
		// if use merge preview, we should do the actual merging when the manipulation is done
		if (isTheFinalOperationToEditor && this.useMergePreview())
		{
			var previewOpers = this.getMergePreviewOperations();
			if (previewOpers && previewOpers.length)
			{
				//console.log('preview opers', previewOpers);
				var opers = this.getMergeOperations();
				for (var i = 0, l = previewOpers.length; i < l; ++i)
				{
					var previewOper = previewOpers[i];
					if (previewOper)  // may be empty slot in operations
					{
						/*
						if (previewOper instanceof Kekule.ChemObjOperation.StickTo)  // is stick operation
							opers.push(previewOper);
						else */  // create concrete merge operation
						{
							var mergeConnector = (previewOper instanceof Kekule.ChemStructOperation.MergeConnectorsBase);
							/*
							 Kekule.ChemStructOperation.MergeConnectors:
							 Kekule.ChemStructOperation.MergeNodes;
							 */
							var oper = mergeConnector ?
								this.createConnectorMergeOperation(previewOper.getTarget(), previewOper.getDest()) :
								this.createNodeMergeOperation(previewOper.getTarget(), previewOper.getDest());
							opers.push(oper);
						}
					}
				}
				this.executeMergeOpers(opers);
			}
			mergeOpers = opers;  // this.getMergeOperations();
		}
		else
		{
			mergeOpers = this.getMergeOperationsInManipulating();
		}

		//console.log('merge operations', mergeOpers);

		var result = $super() || [];
		if (mergeOpers && mergeOpers.length)
			Kekule.ArrayUtils.pushUnique(result, mergeOpers);

		var stickOpers = this.getStickOperations();
		if (stickOpers && stickOpers.length)
		{
			for (var i = 0, l = stickOpers.length; i < l; ++i)
			{
				var oper = stickOpers[i];
				if (oper)
				{
					if (oper.getStickTarget && !oper.getStickTarget())  // no target, actually a unstick operation, must execute before coord setting operation
						result.unshift(oper);
					else
						result.push(oper);
				}
			}
			//Kekule.ArrayUtils.pushUnique(result, stickOpers);
		}

		return result;
	},

	/** @private */
	_objCanBeMagneticMerged: function(obj)
	{
		if (obj instanceof Kekule.StructureFragment)
			return false;
		else
			return (obj instanceof Kekule.ChemStructureNode) || (obj instanceof Kekule.ChemStructureConnector);
	},
	/** @private */
	_objCanBeMagneticSticked: function(obj)
	{
		if (obj instanceof Kekule.StructureFragment)
			return false;
		else
			return (obj instanceof Kekule.BaseStructureNode) && (obj.getAllowCoordStickTo());
	},

	/** @private */
	_canStickNode: function(node, destObj)
	{
		if (this.getEnableNodeStick())
		{
			var allowMolStick = this.getEnableStructFragmentStick();
			var allowSiblingStick = this.getEnableSiblingStick();
			return Kekule.ChemObjOperation.StickTo.canStick(node, destObj, allowMolStick, allowSiblingStick);
		}
		else
			return false;
	},
	/** @private */
	_canMergeNodes: function(targetNode, destNode)
	{
		if (this.getEnableNodeMerge())
		{
			var allowMolMerge = this.getEnableStructFragmentMerge();
			var allowNeighborNodeMerge = this.getEnableNeighborNodeMerge();
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
		if (this.getEnableConnectorMerge())
		{
			var allowMolMerge = this.getEnableStructFragmentMerge();
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
	_getCoordStickActualTarget: function(obj)
	{
		var result = obj;
		var nextStickTarget = result.getCoordStickTarget && result.getCoordStickTarget();
		while (nextStickTarget)
		{
			result = nextStickTarget;
			nextStickTarget = result.getCoordStickTarget && result.getCoordStickTarget();
		}
		return result;
	},
	/** @private */
	_getMagneticNodeMergeOrStickDestInfo: function(node, nodeScreenCoord, excludedObjs)
	{
		var editor = this.getEditor();
		var self = this;
		var filterFunc = function(bound)
		{
			var obj = bound.obj;
			var stickTargetObj = self._getCoordStickActualTarget(obj);
			return (node !== obj) && (excludedObjs.indexOf(obj) < 0)
					&& ((obj instanceof Kekule.BaseStructureNode && self._canMergeNodes(node, obj))
						|| (self._canStickNode(node, stickTargetObj)));
		};
		if (nodeScreenCoord)
		{
			var boundInfos = editor.getBoundInfosAtCoord(nodeScreenCoord, filterFunc, this.getCurrBoundInflation());
			//console.log('boundInfos', boundInfos, nodeScreenCoord);
			/*
			var overlapBoundInfo = this._findSuitableMergeTargetBoundInfo(boundInfos, excludedObjs, Kekule.ChemStructureNode,
					function(destObj)
					{
						return self._canMergeNodes(node, destObj);
					}
			);
			*/
			var overlapBoundInfo = boundInfos.length? boundInfos[boundInfos.length - 1]: null;
			//return overlapBoundInfo? overlapBoundInfo.obj: null;
			if (overlapBoundInfo)
			{
				var obj = overlapBoundInfo.obj;
				var stickTargetObj = this._getCoordStickActualTarget(obj);
				if (this._canMergeNodes(node, obj))
					return {'obj': obj, 'isMerge': true};
				else if (this._canStickNode(node, stickTargetObj))
					return {'obj': stickTargetObj, 'isStick': true};
				else
					return null;
			}
			else
				return null;
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
		var MagneticOperTypes = {MERGE: 0, MERGE_BOND: 1, STICK: 10, UNSTICK: 20};

		this.setAllManipulateObjsMerged(false);
		var useMergePreview = this.useMergePreview();

		var editor = this.getEditor();
		editor.hotTrackOnObj(null);  // clear old hot track objects

		var MT = Kekule.Editor.BasicManipulationIaController.ManipulationType;
		var manipulateType = this.getManipulationType();
		var originManipulatedObjs = this.getManipulateOriginObjs();
		var manipulatedObjs = this.getManipulateObjs();

		var excludedObjs = [].concat(originManipulatedObjs);
		Kekule.ArrayUtils.pushUnique(excludedObjs, manipulatedObjs);

		//var oldMergeOpers = this.getMergeOperations();
		var oldMergeOpers = this.getMergeOperationsInManipulating();
		//console.log(this.getMergeOperationsInManipulating() === this.getMergeOperations());
		//var oldMergeOpers = this.getMergeOperations();
		var oldStickOpers = this.getStickOperations();

		//var allowMolMerge = this.getEnableStructFragmentMerge();
		var self = this;

		// handle mouse position merge and magnetic merge here

		var isMovingOneBond = (originManipulatedObjs.length === 1) && (originManipulatedObjs[0] instanceof Kekule.ChemStructureConnector);
		var isMovingOneNode = (manipulatedObjs.length === 1) && (manipulatedObjs[0] instanceof /*Kekule.ChemStructureNode*/Kekule.BaseStructureNode)
					&& (this._objCanBeMagneticMerged(manipulatedObjs[0]) || this._objCanBeMagneticSticked(manipulatedObjs[0]));
		var maybeMousePosMerge = (manipulateType === MT.MOVE) && !this.getIsOffsetManipulating()
			&& ((isMovingOneBond && this.getEnableConnectorMerge()) || (isMovingOneNode && this.getEnableNodeMerge()));
		var maybeObjPosMagneticMerge = !isMovingOneBond && this.getEnableMagneticMerge();
		//if (!isMovingOneBond && this.getEnableMagneticMerge())
		if (maybeObjPosMagneticMerge || maybeMousePosMerge)
		{
			var currManipulateInfoMap = this.getManipulateObjCurrInfoMap();
			var manipulateInfoMap = this.getManipulateObjInfoMap();

			var magneticMergeObjIndexes = [];
			var magneticMergeObjs = [];
			var magneticMergeDests = [];
			var magneticMergeTypes = [];

			if (maybeMousePosMerge)
			{
				var targetObj = isMovingOneBond? originManipulatedObjs[0]: manipulatedObjs[0];
				var checkResult = this._calcMagneticMergeOrStickInfoOnScreenCoord(
					endScreenCoord, targetObj,
					this._isManipulatingSingleStickedObj(manipulatedObjs),
					currManipulateInfoMap, manipulateInfoMap, excludedObjs, MagneticOperTypes
				);
				if (checkResult)
				{
					magneticMergeObjIndexes = [0];
					magneticMergeObjs = [checkResult.magneticObj];
					magneticMergeDests = [checkResult.magneticDest];
					magneticMergeTypes = [checkResult.magneticType];
				}
				else
				{
					if (isMovingOneBond && this.getEnableConnectorMerge())   // may be bond merge?
					{
						var boundInfos = editor.getBoundInfosAtCoord(endScreenCoord, null, this.getCurrBoundInflation());
						var targetClass = Kekule.ChemStructureConnector;
						var targetObj = originManipulatedObjs[0];
						var checkFunc = function(obj)
							{
								return self._canMergeConnectors(targetObj, obj);
							};
						var overlapBoundInfo = this._findSuitableMergeTargetBoundInfo(boundInfos, excludedObjs, targetClass, checkFunc);
						//console.log('merge', isMovingOneNode, boundInfos, overlapBoundInfo);
						if (overlapBoundInfo)  // has bound info, do bond merge
						{
							magneticMergeObjIndexes = [0];
							magneticMergeObjs = [targetObj];
							magneticMergeDests = [overlapBoundInfo.obj];
							magneticMergeTypes = [MagneticOperTypes.MERGE_BOND];
						}
					}
				}
			}
			if (!magneticMergeObjs.length && maybeObjPosMagneticMerge)
			{
				var magneticOperObjInfos = this._calcMagneticMergeOrStickInfos(manipulatedObjs, currManipulateInfoMap, manipulateInfoMap, excludedObjs, MagneticOperTypes);
				//console.log('mag', magneticOperObjInfos);
				magneticMergeObjIndexes = magneticOperObjInfos.magneticObjIndexes;
				magneticMergeObjs = magneticOperObjInfos.magneticObjs;
				magneticMergeDests = magneticOperObjInfos.magneticDests;
				magneticMergeTypes = magneticOperObjInfos.magneticTypes;
			}

			//console.log(maybeMousePosMerge, magneticMergeObjs);

			if (magneticMergeObjs.length || oldStickOpers.length)  // has merge items, or we need to reverse stick oper
			{
				var magneticObjCount = magneticMergeObjs.length;
				this.setAllManipulateObjsMerged(magneticObjCount === manipulatedObjs.length);
				/*
				if (this.getAllManipulateObjsMerged())
					console.log('all merged!', mergedObjCount);
        */
				var magneticSingleObj = (magneticObjCount === 1);  // merge only one node
				/*
				// If merge on only one node, other node position may also be changed
				// e.g. add repository ring structure to another node
				var needCreateNewMerge = (mergedObjCount <= 1); // false;
				*/
				var needCreateNewMerge = false;
				var needCreateNewStick = false;
				// check if need create new merge operation
				{
					var sameMergeOpers = [];
					var sameStickOpers = [];
					//console.log('oldMergeOpers', oldMergeOpers, magneticMergeObjIndexes);
					for (var i = 0, l = magneticMergeObjs.length; i < l; ++i)
					{
						var obj = magneticMergeObjs[i];
						var dest = magneticMergeDests[i];
						var index = magneticMergeObjIndexes[i];
						var magnectOperType = magneticMergeTypes[i];

						if (magnectOperType === MagneticOperTypes.STICK)  // stick
						{
							if (!needCreateNewStick)
							{
								var oldStickOper = oldStickOpers[index];
								if (!oldStickOper || !this.isSameNodeStick(oldStickOper, obj, dest))
								{
									needCreateNewStick = true;
									break;
								}
								else
									sameStickOpers.push(oldStickOper);
							}
						}
						else // merge
						{
							if (!needCreateNewMerge)
							{
								var oldMergeOper = oldMergeOpers[index];
								if (!oldMergeOper || !this.isSameNodeMerge(oldMergeOper, obj, dest))
								{
									//console.log('need new', oldMergeOper, obj.getId(), dest.getId(), index);
									needCreateNewMerge = true;
								}
								else
									sameMergeOpers.push(oldMergeOper);
							}
						}
						if (needCreateNewMerge && needCreateNewStick)
							break;
					}
					for (var i = 0, l = oldMergeOpers.length; i < l; ++i)
					{
						var oldMergeOper = oldMergeOpers[i];
						if (oldMergeOper)
						{
							var index = sameMergeOpers.indexOf(oldMergeOper);
							if (index < 0)   // old merge has more operations than current, need to recreate new merge
							{
								needCreateNewMerge = true;
								break;
							}
							else
								sameMergeOpers.splice(index, 1);
						}
					}
					for (var i = 0, l = oldStickOpers.length; i < l; ++i)
					{
						var oldStickOper = oldStickOpers[i];
						if (oldStickOper)
						{
							var index = sameStickOpers.indexOf(oldStickOper);
							if (index < 0)   // old sticks has more operations than current, need to recreate new merge
							{
								needCreateNewStick = true;
								break;
							}
							else
								sameStickOpers.splice(index, 1);
						}
					}
				}

				//console.log('need new', needCreateNewMerge, mergeSingleObj);
				if (needCreateNewMerge || needCreateNewStick || magneticSingleObj)
				{
					if (needCreateNewMerge)
					{
						//console.log('need new');
						//this.reverseMergeOpers();
						this.reverseMergeOpers(this.getMergeOperationsInManipulating());
					}
					if (needCreateNewStick)
					{
						this.reverseStickOpers(this.getStickOperations());
					}
					// also need to adjust position of rest manipulatedObjs
					var CU = Kekule.CoordUtils;
					if ((magneticObjCount === 1) || (editor.getCoordMode() === Kekule.CoordMode.COORD3D))
					{
						var mergeOrStickType = magneticMergeTypes[0];
						if (mergeOrStickType !== MagneticOperTypes.MERGE_BOND)
						{
							var currInfo = currManipulateInfoMap.get(magneticMergeObjs[0]);
							var currCoord = currInfo && currInfo.screenCoord;
							var destCoord = editor.getObjectScreenCoord(magneticMergeDests[0]);
							if (currCoord && destCoord)
							{
								var coordTranslate = CU.substract(destCoord, currCoord);
								// change all currInfo coord, and redo apply job
								var needReApply = false;

								var fequal = Kekule.NumUtils.isFloatEqual;
								var threshold = 1e-10; //{x: Math.abs(currCoord.x) * 1e-8, y: Math.abs(currCoord.y) * 1e-8}
								if (!fequal(coordTranslate.x, 0, threshold) || !fequal(coordTranslate.y, 0, threshold))  // if transalte coord is {0, 0} (often ocurrs in ring / chain ia controller, no need to adjust coords)
								{
									//console.log('here', coordTranslate, currCoord, destCoord);
									for (var i = 0, l = manipulatedObjs.length; i < l; ++i)
									{
										var obj = manipulatedObjs[i];
										var info = currManipulateInfoMap.get(obj);
										if (obj !== magneticMergeObjs[0])
										{
											if (info && info.screenCoord)
											{
												var newCoord = CU.add(info.screenCoord, coordTranslate);
												info.screenCoord = newCoord;
												if (this._getMagneticNodeMergeOrStickDestInfo(obj, newCoord, excludedObjs))  // move position can do another magnetic merge
													needReApply = true;
											}
											//this.applySingleManipulatingObjInfo(i, obj, info, endScreenCoord);
										}
										else  // magnetic merge obj, set to dest coord
										{
											if (info && info.screenCoord)
											{
												info.screenCoord = destCoord;
											}
										}
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
										//if (obj !== magneticMergeObjs[0])
										{
											var info = currManipulateInfoMap.get(obj);
											this.applySingleManipulatingObjInfo(i, obj, info, endScreenCoord);
										}
									}
								}
							}
						}
					}
					else if ((magneticObjCount > 1) && (editor.getCoordMode() !== Kekule.CoordMode.COORD3D))  // 2 or more, first two one decide all others' position
					{
						var obj0 = magneticMergeObjs[0];
						var obj1 = magneticMergeObjs[1];
						if (obj0 && obj1)
						{
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
										if (this._getMagneticNodeMergeOrStickDestInfo(obj, newCoord, excludedObjs))  // move position can do another magnetic merge
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
					}

					if (needCreateNewMerge || needCreateNewStick)
					{
						var unstickedObjRecords = [];
						// notify a new merge need to be done
						this._mergeOperationsChanged(magneticObjCount, magneticMergeObjs, magneticMergeDests);
						for (var i = 0, l = magneticObjCount; i < l; ++i)
						{
							var obj = magneticMergeObjs[i];
							var dest = magneticMergeDests[i];
							var index = magneticMergeObjIndexes[i];
							var mergeType = magneticMergeTypes[i];
							if (mergeType === MagneticOperTypes.STICK)  // stick operation
							{
								var originManipulateInfo = manipulateInfoMap.get(obj);
								var originStickTarget = originManipulateInfo.stickTarget;
								if (dest !== originStickTarget)
									var stickOper = this.createNodeStickOperation(obj, dest);
								this.getStickOperations()[index] = stickOper;

								if (!dest)  // actually a unstick operation, need to change coord also, stores the info
								{
									unstickedObjRecords.push({
										'index': index,
										'obj': obj,
										'newInfo': currManipulateInfoMap.get(obj)
									});
								}

								//this.getMergeOperationsInManipulating()[index] = stickOper;
							}
							else  // merge operation
							{
								if (useMergePreview)
								{
									var mergePreviewOper = (mergeType === MagneticOperTypes.MERGE_BOND)?
										this.createConnectorMergeOperation(obj, dest, true):
										this.createNodeMergeOperation(obj, dest, true);
									this.getMergePreviewOperations()[index] = mergePreviewOper;
								}
								else
								{
									var mergeOper = (mergeType === MagneticOperTypes.MERGE_BOND)?
										this.createConnectorMergeOperation(obj, dest):
										this.createNodeMergeOperation(obj, dest);
									this.getMergeOperations()[index] = mergeOper;
								}
							}
						}
						//console.log('execute merge on', mergedObjCount);
						//console.log('create new', magneticMergeObjIndexes, this.getMergeOperationsInManipulating());

						//this.executeMergeOpers();
						if (needCreateNewMerge)
							this.executeMergeOpers(this.getMergeOperationsInManipulating());
						if (needCreateNewStick)
							this.executeStickOpers(this.getStickOperations());

						if (unstickedObjRecords.length)  // set coord of unsticked objects after unstick operation executed
						{
							for (var i = 0, l = unstickedObjRecords.length; i < l; ++i)
							{
								var unstickedRec = unstickedObjRecords[i];
								//console.log('apply',currManipulateInfoMap.get(obj));
								this.applySingleManipulatingObjInfo(unstickedRec.index, unstickedRec.obj, unstickedRec.newInfo, endScreenCoord);
							}
						}
					}
				}

				//console.log('hot track on', magneticMergeDests.length, mergedObjCount, magneticMergeObjs.length);
				editor.hotTrackOnObj(magneticMergeDests);

				return;
			}
		}

		// check if do magnetic merge

		// then check if mouse position merge
		/*
		if (manipulateType === MT.MOVE)
		{
			var doMousePosMerge = false;

			if ((isMovingOneBond && this.getEnableConnectorMerge()) || (isMovingOneNode && this.getEnableNodeMerge()))
			{
				// check if endScreenCoord (mouse position) overlap with an existing object
				var overlapedObj;
				var boundInfos = editor.getBoundInfosAtCoord(endScreenCoord, null, this.getCurrBoundInflation());
				var targetClass = isMovingOneBond? Kekule.ChemStructureConnector: Kekule.ChemStructureNode;
				var targetObj = isMovingOneBond? originManipulatedObjs[0]: manipulatedObjs[0];
				var checkFunc = isMovingOneBond?
					function(obj)
					{
						return self._canMergeConnectors(targetObj, obj);
					}:
					function(obj)
					{
						return self._canMergeNodes(targetObj, obj) || self._canStickNode(targetObj, obj);
					};
				var overlapBoundInfo = this._findSuitableMergeTargetBoundInfo(boundInfos, excludedObjs, targetClass, checkFunc);
				console.log('merge', isMovingOneNode, boundInfos, overlapBoundInfo);
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
							|| (isMovingOneNode && this.isSameNodeMergeOrStick(oldMergeOper, targetObj, destObj)))  // merged already in last phrase
						{
							//console.log('!!!!same merge!!!!!');
							return;
							// do nothing here
						}
						else
						{
							if (oldMergeOper)
							{
								//this.reverseMergeOpers();
								this.reverseMergeOpers(this.getMergeOperationsInManipulating());
							}

							if (useMergePreview)
							{
								var mergeOper = isMovingOneBond?
										this.createConnectorMergeOperation(targetObj, destObj, useMergePreview):
										this.createNodeMergeOperation(targetObj, destObj, useMergePreview);
								this.getMergePreviewOperations()[0] = mergeOper;
							}
							else
							{
								var mergeOper = isMovingOneBond?
										this.createConnectorMergeOperation(targetObj, destObj):
										this.createNodeMergeOperation(targetObj, destObj);
								this.getMergeOperations()[0] = mergeOper;
							}

							//mergeOper.execute();
							//this.executeMergeOpers();
							this.executeMergeOpers(this.getMergeOperationsInManipulating());
							return;
						}
					}
				}
			}
		}
		*/

		// no merge, just reverse old one and do normal move
		//this.reverseMergeOpers();
		var oldMergeOpers = this.getMergeOperationsInManipulating();
		if (oldMergeOpers && oldMergeOpers.length)
		{
			this._mergeOperationsChanged(0, [], []);  // also notify that no merge should be done here
			this.reverseMergeOpers(oldMergeOpers);
		}

		$super(endScreenCoord);
	},

	/** @private */
	_calcMagneticMergeOrStickInfoOnScreenCoord: function(currScreenCoord, manipulatedObj, isManipulateSingleStickedObj, currManipulateInfoMap, originalManipulateInfoMap, excludedObjs, MergeTypes)
	{
		var editor = this.getEditor();
		var objCanBeMerged = this._objCanBeMagneticMerged;
		var objCanBeSticked = this._objCanBeMagneticSticked;

		var obj = manipulatedObj;
		/*
		if (!objCanBeMerged(obj) && !objCanBeSticked(obj))
		{
			return null;
		}
		*/
		var currCoord = currScreenCoord;
		if (currCoord)
		{
			var boundInfos = editor.getBoundInfosAtCoord(currCoord, null, this.getCurrBoundInflation());

			//var mergeDest = this._getMagneticNodeMergeOrStickDestInfo(obj, currCoord, excludedObjs);
			var mergeOrStickDestInfo = this._getMagneticNodeMergeOrStickDestInfo(obj, currCoord, excludedObjs);
			var mergeDest = null, stickDest = null;
			if (mergeOrStickDestInfo)
			{
				if (mergeOrStickDestInfo.isStick)
					stickDest = mergeOrStickDestInfo.obj;
				else if (mergeOrStickDestInfo.isMerge)
					mergeDest = mergeOrStickDestInfo.obj;
			}
			if (mergeDest || stickDest)  // may merge, or stick store info
			{
				return {
					magneticObj: obj,
					magneticDest: mergeDest || stickDest,
					magneticType: stickDest ? MergeTypes.STICK : MergeTypes.MERGE
				};
			}
			else
			{
				if (!stickDest && isManipulateSingleStickedObj)
				{
					var originalInfo = originalManipulateInfoMap.get(obj);
					if (originalInfo.stickTarget)   // has old stick object, but now moves out, it should be unsticked
					{
						return {
							magneticObj: obj,
							magneticDest: null,   // stick to null means unstick
							magneticType: MergeTypes.STICK
						};
					}
				}
			}
		}
	},
	/** @private */
	_calcMagneticMergeOrStickInfos: function(manipulatedObjs, currManipulateInfoMap, originalManipulateInfoMap, excludedObjs, MergeTypes)
	{
		var isManipulateSingleStickedObj = this._isManipulatingSingleStickedObj(manipulatedObjs);

		var objCanBeMerged = this._objCanBeMagneticMerged;
		var objCanBeSticked = this._objCanBeMagneticSticked;

		var editor = this.getEditor();

		var magneticObjIndexes = [];
		var magneticObjs = [];
		var magneticDests = [];
		var magneticTypes = [];
		//var unstickObjs = [];

		// filter out all merge nodes
		//console.log('manipulate objects count', manipulatedObjs.length);
		for (var i = 0, l = manipulatedObjs.length; i < l; ++i)
		{
			var obj = manipulatedObjs[i];
			if (!objCanBeMerged(obj) && !objCanBeSticked(obj))
			{
				continue;
			}
			var currInfo = currManipulateInfoMap.get(obj);
			var currCoord = currInfo && currInfo.screenCoord;
			if (currCoord)
			{
				var checkResult = this._calcMagneticMergeOrStickInfoOnScreenCoord(currCoord, obj, isManipulateSingleStickedObj, currManipulateInfoMap, originalManipulateInfoMap, excludedObjs, MergeTypes);
				if (checkResult)
				{
					magneticObjIndexes.push(i);
					magneticObjs.push(checkResult.magneticObj);
					magneticDests.push(checkResult.magneticDest);
					magneticTypes.push(checkResult.magneticType);
				}
			}
			/*
			if (currCoord)
			{
				var boundInfos = editor.getBoundInfosAtCoord(currCoord, null, this.getCurrBoundInflation());

				//var mergeDest = this._getMagneticNodeMergeOrStickDestInfo(obj, currCoord, excludedObjs);
				var mergeOrStickDestInfo = this._getMagneticNodeMergeOrStickDestInfo(obj, currCoord, excludedObjs);
				var mergeDest = null, stickDest = null;
				if (mergeOrStickDestInfo)
				{
					if (mergeOrStickDestInfo.isStick)
						stickDest = mergeOrStickDestInfo.obj;
					else if (mergeOrStickDestInfo.isMerge)
						mergeDest = mergeOrStickDestInfo.obj;
				}
				if (mergeDest || stickDest)  // may merge, or stick store info
				{
					magneticObjIndexes.push(i);
					magneticObjs.push(obj);
					magneticDests.push(mergeDest || stickDest);
					magneticTypes.push(stickDest ? MergeTypes.STICK : MergeTypes.MERGE);
					//console.log('check merge ok on', i, stickDest);
				}
				else
				{
					if (!stickDest && isManipulateSingleStickedObj)
					{
						var originalInfo = originalManipulateInfoMap.get(obj);
						if (originalInfo.stickTarget)   // has old stick object, but now moves out, it should be unsticked
						{
							magneticObjIndexes.push(i);
							magneticObjs.push(obj);
							magneticDests.push(null);
							magneticTypes.push(MergeTypes.STICK);   // stick to null means unstick
							//unstickObjs.push(obj);
						}
					}
				}
			}
			*/
		}

		return {
			'magneticObjIndexes': magneticObjIndexes,
			'magneticObjs': magneticObjs,
			'magneticDests': magneticDests,
			'magneticTypes': magneticTypes
		};
	},

	/**
	 * Notify a set of new merge operations are created.
	 * Descendants may override this method to reflect to those merges.
	 * @private
	 */
	_mergeOperationsChanged: function(mergedObjCount, targetObjs, destObjs)
	{
		// do nothing here
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
	createNodeMergeOperation: function(fromNode, toNode, useMergePreview)
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
			//var op = new Kekule.ChemStructOperation.MergeNodes(fromNode, toNode, allowMolMerge);
			var op = useMergePreview?
					(new Kekule.ChemStructOperation.MergeNodesPreview(fromNode, toNode, allowMolMerge, this.getEditor())):
					(new Kekule.ChemStructOperation.MergeNodes(fromNode, toNode, allowMolMerge, this.getEditor()));
			return op;
		}
	},
	/** @private */
	createConnectorMergeOperation: function(fromConnector, toConnector, useMergePreview)
	{
		var allowMolMerge = this.getEnableStructFragmentMerge();
		if (!Kekule.ChemStructOperation.MergeConnectors.canMerge(fromConnector, toConnector, allowMolMerge))
			return null;
		else
		{
			//var op = new Kekule.EditorOperation.OpMergeNodes(this.getEditor(), parent, fromNode, toNode);
			//var op = new Kekule.ChemStructOperation.MergeConnectors(fromConnector, toConnector, this.getEditor().getCoordMode(), allowMolMerge);
			var mergeClass = useMergePreview? Kekule.ChemStructOperation.MergeConnectorsPreview: Kekule.ChemStructOperation.MergeConnectors;
			var op = new mergeClass(fromConnector, toConnector, this.getEditor().getCoordMode(), allowMolMerge, this.getEditor());
			return op;
		}
	},
	/** @private */
	createNodeStickOperation: function(fromNode, toNode)
	{
		var allowMolMerge = this.getEnableStructFragmentStick();
		if (!this._canStickNode(fromNode, toNode))
			return null;
		else
		{
			var op = new Kekule.ChemObjOperation.StickTo(fromNode, toNode, this.getEditor());
			return op;
		}
	},

	/** @private */
	isSameConnectorMerge: function(mergeOper, fromConnector, toConnector)
	{
		return mergeOper && (mergeOper instanceof Kekule.ChemStructOperation.MergeConnectorsBase)
				&& (fromConnector === mergeOper.getTarget()) && (toConnector === mergeOper.getDest());
	},
	/** @private */
	isSameNodeMerge: function(mergeOper, fromNode, toNode)
	{
		//console.log('check same', fromNode.getId(), toNode.getId(), mergeOper.getTarget().getId(), mergeOper.getDest().getId());
		return mergeOper && (mergeOper instanceof Kekule.ChemStructOperation.MergeNodesBase)
			&& (fromNode === mergeOper.getTarget()) && (toNode === mergeOper.getDest());
	},
	/** @private */
	isSameNodeStick: function(stickOper, fromNode, toObj)
	{
		return stickOper && (stickOper instanceof Kekule.ChemObjOperation.StickTo)
			&& (fromNode === stickOper.getTarget()) && (toObj === stickOper.getStickTarget());
	},
	/** @private */
	isSameNodeMergeOrStick: function(oper, fromNode, toNode)
	{
		return this.isSameNodeMerge(oper, fromNode, toNode) || this.isSameNodeStick(oper, fromNode, toNode);
	},

	/** @private */
	executeStickOpers: function(stickOpers)
	{
		var editor = this.getEditor();
		var opers = Kekule.ArrayUtils.toUnique(stickOpers || this.getStickOperations());
		editor.beginUpdateObject();
		try
		{
			for (var i = 0, l = opers.length; i < l; ++i)
			{
				if (opers[i])
				{
					opers[i].execute();
				}
			}
			//this.refreshManipulateObjs();
		}
		finally
		{
			editor.endUpdateObject();
		}
	},
	/** @private */
	reverseStickOpers: function(stickOpers)
	{
		var editor = this.getEditor();
		var originOpers = stickOpers || this.getStickOperations();
		var opers = Kekule.ArrayUtils.toUnique(originOpers);
		if (!opers || !opers.length)
			;  // do nothing
		else
		{
			editor.beginUpdateObject();
			try
			{
				for (var i = opers.length - 1; i >= 0; --i)
				{
					if (opers[i])
					{
						opers[i].reverse();
					}
				}
				originOpers.length = 0;
				//this.refreshManipulateObjs();
			}
			finally
			{
				editor.endUpdateObject();
			}
		}
	},

	/** @private */
	executeMergeOpers: function(mergeOpers)
	{
		//var opers = Kekule.ArrayUtils.toUnique(this.getMergeOperations());
		var editor = this.getEditor();
		var opers = Kekule.ArrayUtils.toUnique(mergeOpers || this.getMergeOperationsInManipulating());
		var mergingDests = [];
		editor.beginUpdateObject();
		try
		{
			for (var i = 0, l = opers.length; i < l; ++i)
			{
				if (opers[i])
				{
					opers[i].execute();
					var dest = opers[i].getDest ? opers[i].getDest() : null;
					if (dest)
						AU.pushUnique(mergingDests, dest);
				}
			}
			this.setMergingDests(mergingDests.length ? mergingDests : null);

			//console.log('[merge!!!!!]');
			this.refreshManipulateObjs();
			this._mergeJustReversed = false;
		}
		finally
		{
			editor.endUpdateObject();
		}
	},
	/** @private */
	reverseMergeOpers: function(mergeOperations)
	{
		var editor = this.getEditor();
		this.setMergingDests(null);
		var originOpers = mergeOperations || this.getMergeOperationsInManipulating();
		var opers = Kekule.ArrayUtils.toUnique(originOpers);
		//var opers = Kekule.ArrayUtils.toUnique(mergeOperations || this.getMergeOperations());
		if (!opers || !opers.length)
			;  // do nothing
		else
		{
			editor.beginUpdateObject();
			try
			{
				for (var i = opers.length - 1; i >= 0; --i)
				{
					if (opers[i])
					{
						//console.log('reverse at', i, opers.length);
						opers[i].reverse();
						//delete opers[i];
					}
				}
				//console.log('reverse merge oper', opers);
				//this.getMergeOperations().length = utilIndex;
				originOpers.length = 0;
				this._mergeJustReversed = true;   // a special flag
				//console.log('reverse', this.getManipulateObjs());
				this.refreshManipulateObjs();
			}
			finally
			{
				editor.endUpdateObject();
			}
		}
	},

	/** @private */
	react_pointermove: function($super, e)
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
 * IA Controller to select and manipulate objects in editor.
 * @class
 * @augments Kekule.Editor.BasicMolManipulationIaController
 */
Kekule.Editor.SelectIaController = Class.create(Kekule.Editor.BasicMolManipulationIaController,
/** @lends Kekule.Editor.SelectIaController# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.SelectIaController',
	/** @construct */
	initialize: function($super, editor)
	{
		$super(editor);
		this.setEnableSelect(true);
		this.setEnableGestureManipulation(true);
	}
});
// register
Kekule.Editor.IaControllerManager.register(Kekule.Editor.SelectIaController, Kekule.Editor.ChemSpaceEditor);

/**
 * Base IA Controller to insert structure objects (bonds, structure fragments...) into editor.
 * @class
 * @augments Kekule.Editor.BasicMolManipulationIaController
 */
Kekule.Editor.StructureInsertIaController = Class.create(Kekule.Editor.BasicMolManipulationIaController,
/** @lends Kekule.Editor.StructureInsertIaController# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.StructureInsertIaController',
	/** @construct */
	initialize: function($super, editor)
	{
		$super(editor);
		this._manipulatedBasicObjs = null;  // used internally
	},
	/**
	 * Returns newly inserted objects to editor.
	 * Descendants may override this method.
	 * @private
	 */
	getInsertedObjs: function()
	{
		return this._manipulatedBasicObjs;
	},
	/** @ignore */
	doSetManipulateOriginObjs: function($super, objs)
	{
		this._manipulatedBasicObjs = this._getManipulatedBasicObjects(objs);
		return $super(objs);
	},
	/** @private */
	_getManipulatedBasicObjects: function(manipulatingObjs)
	{
		var result = [];
		for (var i = 0, l = manipulatingObjs.length; i < l; ++i)
		{
			var obj = manipulatingObjs[i];
			if (obj instanceof Kekule.ChemStructureObject)
			{
				if (obj instanceof Kekule.StructureFragment && obj.isExpanded())
				{
					var children = [].concat(obj.getNodes()).concat(obj.getConnectors());
					AU.pushUnique(result, children);
				}
				else
					AU.pushUnique(result, obj);
			}
			else
				AU.pushUniqueEx(result, obj);
		}
		return result;
	},
	/** @ignore */
	stopManipulate: function($super)
	{
		if (this.needAutoSelectNewlyInsertedObjects())
		{
			var basicObjs = this.getInsertedObjs();
			this.doneInsertOrModifyBasicObjects(basicObjs);
			//console.log(basicObjs.length, filteredObjs.length);
		}
		return $super();
	}
});

/**
 * Controller to add bond or change bond property.
 * @class
 * @augments Kekule.Editor.StructureInsertIaController
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
Kekule.Editor.MolBondIaController = Class.create(Kekule.Editor.StructureInsertIaController,
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

	/** @ignore */
	getInsertedObjs: function($super)
	{
		var bond = this.getBond();
		return bond? [bond]: $super();
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
					this.getEditor().objectsChanged([{'obj': bond}, {'obj': node}]);
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
	getAllObjOperations: function($super, isTheFinalOperationToEditor)
	{
		var result = $super(isTheFinalOperationToEditor) || [];
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
			var addMolOperation = new Kekule.ChemObjOperation.Add(mol, this.getEditor().getChemObj(), null, this.getEditor());
			group.add(addMolOperation);
		}
		var startObj = this.getStartingObj();
		var endObj = this.getEndingObj();
		var bond = this.getBond();
		//var parent = startObj.getParent();
		var parent = this.getStructFragment();
		var editor = this.getEditor();

		var node = this.getAutoCreatedStartingObj();
		if (node)
		{
			var addNodeOperation = new Kekule.ChemStructOperation.AddNode(node, parent, null, editor);
			group.add(addNodeOperation);
		}

		var addNodeOperation = new Kekule.ChemStructOperation.AddNode(endObj, parent, null, editor);
		group.add(addNodeOperation);
		var addConnectorOperation = new Kekule.ChemStructOperation.AddConnector(bond, parent, null, [startObj, endObj], editor);
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
				var oper = new Kekule.ChemObjOperation.Modify(bond, newPropValues, this.getEditor());
				oper.execute();
				editor.pushOperation(oper);
				// notify editor, the connected objecs should be redrawn too
				var changedObjs = [bond].concat(bond.getConnectedObjs());
				var changedDetails = [];
				for (var i = 0, l = changedObjs.length; i < l; ++i)
					changedDetails.push({'obj':changedObjs[i]});
				this.getEditor().objectsChanged(changedDetails);
			}
			finally
			{
				editor.endUpdateObject();
			}
		}
	},

	/** @private */
	react_pointerdown: function(e)
	{
		this.setActivePointerType(e.pointerType);
		if (e.getButton() === Kekule.X.Event.MOUSE_BTN_LEFT)
		{
			var S = BC.State;
			var coord = this._getEventMouseCoord(e);
			var state = this.getState();
			if (state === S.INITIAL)
			{
				var boundItem = this.getEditor().getTopmostBoundInfoAtCoord(coord, null, this.getCurrBoundInflation());
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
							this.moveManipulatedObjs(coord);  // force a "move" action, to apply possible merge
						}
						return true; // important
					}
					else if (this.isBond(obj) && this.getEnableBondModification())  // change bond property
					{
						this.modifyBond(obj);
						return true;
					}
					e.preventDefault();
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
						//this.setManipulateOriginObjs(obj);
						this.startDirectManipulate(null, this.getEndingObj(), coord);
						this.moveManipulatedObjs(coord);  // force a "move" action, to apply possible merge
					}
					e.preventDefault();
					return true; // important
				}
			}
		}
	},
	/** @private */
	react_pointerup: function($super, e)
	{
		var state = this.getState();
		var startCoord = this.getStartCoord();
		var endCoord = this._getEventMouseCoord(e);
		var S = Kekule.Editor.BasicManipulationIaController.State;
		if ((state === S.MANIPULATING) && (e.getButton() === Kekule.X.Event.MOUSE_BTN_LEFT))
		{
			e.preventDefault();
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
Kekule.Editor.MolAtomIaController_OLD = Class.create(Kekule.Editor.BaseEditorIaController,
/** @lends Kekule.Editor.MolAtomIaController_OLD# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.MolAtomIaController_OLD',
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
			var operReplace = new Kekule.ChemStructOperation.ReplaceNode(node, newNode, null, this.getEditor());
			operGroup.add(operReplace);
		}
		else  // no need to replace
			newNode = node;

		if (modifiedProps)
		{
			oper = new Kekule.ChemObjOperation.Modify(newNode, modifiedProps, this.getEditor());
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
	react_pointerup: function(e)
	{
		if (e.getButton() === Kekule.X.Event.MOUSE_BTN_LEFT)
		{
			this.getEditor().setSelection(null);
			var coord = this._getEventMouseCoord(e);
			{
				var boundItem = this.getEditor().getTopmostBoundInfoAtCoord(coord, null, this.getCurrBoundInflation());
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
		return (obj instanceof Kekule.ChemStructureNode) && !(obj instanceof Kekule.StructureFragment && obj.isStandalone());
	},

	/** @private */
	/*
	_getVarAtomListLabel: function()
	{
		var labelConfigs = this.getEditor().getRenderConfigs().getDisplayLabelConfigs();
		return labelConfigs? labelConfigs.getVariableAtom(): Kekule.ChemStructureNodeLabels.VARIABLE_ATOM;
	},
	_getVarAtomNotListLabel: function()
	{
		var labelConfigs = this.getEditor().getRenderConfigs().getDisplayLabelConfigs();
		return '~' + (labelConfigs? labelConfigs.getVariableAtom(): Kekule.ChemStructureNodeLabels.VARIABLE_ATOM);
	},
	*/
	/** @private */
	_createNonAtomLabelInfos: function()
	{
		/*
		var result = [];
		var labelConfigs = this.getEditor().getRenderConfigs().getDisplayLabelConfigs();
		// R group
		result.push({
			'text': labelConfigs.getRgroup(), 'nodeClass': Kekule.RGroup,
			'description': Kekule.$L('ChemWidgetTexts.CAPTION_RGROUP') //Kekule.ChemWidgetTexts.CAPTION_RGROUP
		});
		// Kekule.Pseudoatom
		result.push({
			'text': labelConfigs.getDummyAtom(), 'nodeClass': Kekule.Pseudoatom,
			'props': {'atomType': Kekule.PseudoatomType.DUMMY},
			'description': Kekule.$L('ChemWidgetTexts.CAPTION_DUMMY_ATOM') //Kekule.ChemWidgetTexts.CAPTION_DUMMY_ATOM
		});
		result.push({
			'text': labelConfigs.getHeteroAtom(), 'nodeClass': Kekule.Pseudoatom,
			'props': {'atomType': Kekule.PseudoatomType.HETERO},
			'description': Kekule.$L('ChemWidgetTexts.CAPTION_HETERO_ATOM') //Kekule.ChemWidgetTexts.CAPTION_HETERO_ATOM
		});
		result.push({
			'text': labelConfigs.getAnyAtom(), 'nodeClass': Kekule.Pseudoatom,
			'props': {'atomType': Kekule.PseudoatomType.ANY},
			'description': Kekule.$L('ChemWidgetTexts.CAPTION_ANY_ATOM') //Kekule.ChemWidgetTexts.CAPTION_ANY_ATOM
		});
		// Kekule.VariableAtom List and Not List
		result.push({
			'text': this._getVarAtomListLabel(), 'nodeClass': Kekule.VariableAtom, 'isVarList': true,
			'description': Kekule.$L('ChemWidgetTexts.CAPTION_VARIABLE_ATOM') //Kekule.ChemWidgetTexts.CAPTION_VARIABLE_ATOM
		});
		result.push({
			'text': this._getVarAtomNotListLabel(), 'nodeClass': Kekule.VariableAtom, 'isVarNotList': true,
			'description': Kekule.$L('ChemWidgetTexts.CAPTION_VARIABLE_NOT_ATOM') //Kekule.ChemWidgetTexts.CAPTION_VARIABLE_NOT_ATOM
		});
    */
		var editor = this.getEditor();
		var result = editor && editor.getEnabledNonAtomInputData && editor.getEnabledNonAtomInputData();
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
		var result = new Kekule.ChemWidget.StructureNodeSetter(this.getEditor());
		result.setUseDropDownSelectPanel(true);
		result.addClassName(CCNS.CHEMEDITOR_ATOM_SETTER);

		var listAtoms = AU.clone(this.getEditor().getEditorConfigs().getStructureConfigs().getPrimaryOrgChemAtoms());
		listAtoms.push('...');  // add periodic table item
		//result.setSelectableElementSymbols(listAtoms);
		// non-atom nodes
		var nonAtomLabelInfos = this.getNonAtomLabelInfos();
		//result.setSelectableNonElementInfos(nonAtomLabelInfos);
		// subgroups
		//result.setSelectableSubGroupRepItems(Kekule.Editor.StoredSubgroupRepositoryItem2D.getAllRepItems());

		result.setSelectableInfos({
			'elementSymbols': listAtoms,
			'nonElementInfos': nonAtomLabelInfos,
			'subGroupRepItems': Kekule.Editor.StoredSubgroupRepositoryItem2D.getAllRepItems()
		});

		// react to value change of setter
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

		result.addEventListener('valueSelect', function(e){
			//var data = e.value;
			//console.log(e.target, e.currentTarget);
			if (self.getAtomSetter() && self.getAtomSetter().isShown())
			{
				self.applySetter(result);
				result.dismiss();  // avoid call apply setter twice
			}
		});

		result.addEventListener('showStateChange', function(e)
			{
				if (e.target === result && !e.byDomChange)
				{
					//console.log('show state change', e);
					if (!e.isShown && !e.isDismissed)  // widget hidden, feedback the edited value
					{
						if (self.getAtomSetter() && self.getAtomSetter().isShown())
							self.applySetter(result);
					}
				}
			}
		);


		result.appendToElem(parentElem);

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
		var oldSetter = this.getAtomSetter();  // check if there is old already created setter
		if (oldSetter && oldSetter.isShown())  // has a old setter
		{
			//this.applySetter(oldSetter, this.getCurrAtom());
			oldSetter.hide();
			// IMPORTANT: ensure the hide process done quickly
			// and the unprepare process of popup atom setter do not imfluence the prepare process of it
			oldSetter._haltPrevShowHideProcess();
		}

		if (!this.isValidNode(obj))
			return;
		this.setCurrAtom(obj);


		var fontSize = this.getEditor().getEditorConfigs().getInteractionConfigs().getAtomSetterFontSize() || 0;
		fontSize *= this.getEditor().getZoom() || 1;
		var posAdjust = fontSize / 1.5;  // adjust position to align to atom center
		var setter = this.getAtomSetterWidget(true);
		//setter.setEditor(this.getEditor());
		setter.setLabelConfigs(this.getEditor().getRenderConfigs().getDisplayLabelConfigs());
		setter.setNodes([obj]);
		var parentElem = this.getEditor().getCoreElement();
		setter.appendToElem(parentElem);  // ensure setter widget is a child of parentElem, since popup show may change the parent each time

		var inputBox = setter.getNodeInputBox();

		//setter.setIsDirty(false);
		//setter.setIsPopup(true);
		var style = setter.getElement().style;
		style.position = 'absolute';
		style.left = (coord.x - posAdjust) + 'px';
		style.top = (coord.y - posAdjust) + 'px';
		style.opacity = 1;
		inputBox.getElement().style.fontSize = fontSize + 'px';
		/*
		 style.marginTop = -posAdjust + 'px';
		 style.marginLeft = -posAdjust + 'px';
		 */
		//setter.show();
		setter._applied = false;
		setter.show(null, null, Kekule.Widget.ShowHideType.POPUP);

		(function(){
			inputBox.focus();
			inputBox.selectAll();
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
		if (!atom)
			atom = this.getCurrAtom();
		var newData = setter.getValue();
		if (!newData)
			return;

		//console.log('apply setter', newData);

		var nodeClass = newData.nodeClass;
		var modifiedProps = newData.props;
		var repItem = newData.repositoryItem;
		var newNode;

		if (repItem)  // need to apply structure repository item
		{
			var repResult = repItem.createObjects(atom) || {};
			var repObjects = repResult.objects;
			var transformParams = Kekule.Editor.RepositoryStructureUtils.calcRepObjInitialTransformParams(this.getEditor(), repItem, repResult, atom, null);
			this.getEditor().transformCoordAndSizeOfObjects(repObjects, transformParams);
			newNode = repObjects[0];
			nodeClass = newNode.getClass();
		}

		if (newData.isUnknownPseudoatom && !this.getEditorConfigs().getInteractionConfigs().getAllowUnknownAtomSymbol())
			nodeClass = null;

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
			var operReplace = new Kekule.ChemStructOperation.ReplaceNode(node, newNode, null, this.getEditor());
			operGroup.add(operReplace);
		}
		else  // no need to replace
			newNode = node;

		if (modifiedProps)
		{
			oper = new Kekule.ChemObjOperation.Modify(newNode, modifiedProps, this.getEditor());
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
	react_pointerup: function(e)
	{
		if (e.getButton() === Kekule.X.Event.MOUSE_BTN_LEFT)
		{
			this.getEditor().setSelection(null);
			var coord = this._getEventMouseCoord(e);
			{
				//var boundItem = this.getEditor().getTopmostBoundInfoAtCoord(coord, null, this.getCurrBoundInflation());
				//if (boundItem)
				{
					//var obj = boundItem.obj;
					var obj = this.getTopmostInteractableObjAtScreenCoord(coord);
					//if (this.isValidNode(obj))  // can modify atom of this object
					{
						var baseCoord = this.getEditor().getObjectScreenCoord(obj);
						e.preventDefault();
						e.stopPropagation();
						// important, prevent event bubble to document, otherwise reactDocumentClick will be evoked
						//  and the atom setter will be closed immediately.
						this.openSetterUi(baseCoord, obj);
						this.doneInsertOrModifyBasicObjects([obj]);
						//this.getEditor().setSelection([obj]);
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
 * Controller to add repository structure fragments or other objects into chem space.
 * @class
 * @augments Kekule.Editor.StructureInsertIaController
 */
Kekule.Editor.RepositoryIaController = Class.create(Kekule.Editor.StructureInsertIaController,
/** @lends Kekule.Editor.RepositoryIaController# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.RepositoryIaController',
	/** @construct */
	initialize: function($super, editor)
	{
		$super(editor);
		this.setEnableSelect(false);
		this._repObjStartingScreenCoord = null;
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('repositoryItem', {'dataType': 'Kekule.AbstractRepositoryItem', 'serializable': false});
		this.defineProp('addRepObjsOper', {'dataType': 'Kekule.MacroOperation', 'serializable': false});
		this.defineProp('initialTransformParams', {'dataType': DataType.HASH, 'serializable': false});
		this.defineProp('currRepositoryObjects', {'dataType': 'Kekule.ChemObject', 'serializable': false});
	},

	/** @ignore */
	doTestMouseCursor: function(coord, e)
	{
		// Overwrite parent BasicMolManipulationIaController,
		// Always show pointer cursor
		return '';
	},
	/** @private */
	canInteractWithObj: function($super, obj)
	{
		return $super(obj);
	},
	/**
	 * Returns if obj is a valid starting point of creating repository item.
	 * Descendants may override this method.
	 * @param obj
	 * @returns {boolean}
	 */
	isValidStartingObj: function(obj)
	{
		return true;
	},

	/** @private */
	calcInitialTransformParams: function(repItem, repResult, destObj, targetCoord)
	{
		return Kekule.Editor.RepositoryStructureUtils.calcRepObjInitialTransformParams(this.getEditor(), repItem, repResult, destObj, targetCoord);
	},

	/** @private */
	getRepObjCreationOptions: function()
	{
		return null;
	},

	/** @private */
	createObjFromRepositoryItem: function(targetObj, repItem)
	{
		var repResult = repItem.createObjects(targetObj, this.getRepObjCreationOptions()) || {};
		return repResult;
	},

	/** @private */
	addRepositoryObj: function(targetObj, screenCoord, ignoreUnconnectedStructCheck)
	{
		var editor = this.getEditor();
		this.setAddRepObjsOper(null);
		var repResult = null;

		editor.beginUpdateObject();
		try
		{
			var chemSpace = editor.getChemSpace();
			var repItem = this.getRepositoryItem();
			/*
			repResult = repItem.createObjects(targetObj) || {};
			*/
			var repResult = this.createObjFromRepositoryItem(targetObj, repItem);
			var repObjects = repResult.objects;
			this.setCurrRepositoryObjects(repObjects);

			var isOneStructItem = repItem.isOneStructureFragmentObj();
			var addToBlankMol = false;
			var blankMol = this.getEditor().getOnlyOneBlankStructFragment();
			if (!editor.canCreateNewChild() && !repResult.mergeObj && !ignoreUnconnectedStructCheck)  // can not create a standalone child
			{
				if (!isOneStructItem || !editor.canAddUnconnectedStructFragment())
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
					oper = new Kekule.ChemStructOperation.MergeStructFragment(obj, blankMol, editor);
				else
					oper = new Kekule.ChemObjOperation.Add(obj, chemSpace, null, editor);
				macroOper.add(oper);
			}
			macroOper.execute();
			this.setAddRepObjsOper(macroOper);

			var addedObjs = addToBlankMol? [blankMol]: repObjects;
			var transformParams = this.calcInitialTransformParams(repItem, repResult, targetObj, screenCoord);
			this._transformObjectsCoordAndSize(addedObjs, transformParams);
			this.setInitialTransformParams(transformParams);

			repResult.objects = addedObjs;
			//repResult.centerObj = repItem.getMolManipulationCenterObj();
			var manCenterCoord = repItem.getMolManipulationCenterCoord && repItem.getMolManipulationCenterCoord();
			if (manCenterCoord)
				repResult.manipulationCenterCoord = Kekule.CoordUtils.transform2D(manCenterCoord, transformParams);
			var defDirectionCoord = repItem.getMolManipulationDefDirectionCoord && repItem.getMolManipulationDefDirectionCoord();
			if (defDirectionCoord)
				repResult.manipulationDefDirectionCoord = Kekule.CoordUtils.transform2D(defDirectionCoord, transformParams);
		}
		finally
		{
			editor.endUpdateObject();
		}

		//this.addOperationToEditor();
		return repResult;
	},
	/**
	 * Change the inserted repository structures in editor.
	 * Note, the atoms and bonds in the structure can be changed, but the structure itself should not be replaced.
	 * @private
	 */
	doRefreshRepositoryObj: function(manipulatingObjs, startScreenCoord, startBox, rotateCenter, rotateRefCoord)
	{
		this.doPrepareManipulatingObjects(manipulatingObjs, startScreenCoord);
		this.doPrepareManipulatingStartingCoords(startScreenCoord, startBox, rotateCenter, rotateRefCoord);
		//this.createManipulateOperation();
		this.doCreateManipulateMoveAndResizeOperation();  // only recreate move operations, but retain merge ones
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
	getAllObjOperations: function($super, isTheFinalOperationToEditor)
	{
		var result = $super(isTheFinalOperationToEditor) || [];
		var repOper = this.getAddRepObjsOper();
		if (repOper)
			result.unshift(repOper);
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
		// even all nodes are merged, bond may be added as well
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
	doInsertRepositoryObjToEditor: function(addedRepObjsResult, startingCoord, startingObj, isUpdate)
	{
		if (!isUpdate)
		{
			// save new insertion params
			this._initialStartingObj = startingObj;
			this._repObjStartingScreenCoord = startingCoord;
		}
		//var addedResult = this.addRepositoryObj(startingObj, startingCoord);
		var addedResult = addedRepObjsResult;
		if (addedResult)
		{
			var addedObjects = addedResult.objects;
			var rotateCenter = null, rotateRefCoord = null;
			var manType = this.getInitManipulationType();
			if (addedResult.mergeObj)
			{
				rotateCenter = this.getEditor().getObjectScreenCoord(addedResult.mergeObj);
				manType = Kekule.Editor.BasicManipulationIaController.ManipulationType.ROTATE;  // always rotate when there is merge
			}
			else
			{
				/*
				if (addedResult.centerObj)
					rotateCenter = this.getEditor().getObjectScreenCoord(addedResult.centerObj);
				*/
				if (addedResult.manipulationCenterCoord)
					rotateCenter = this.getEditor().objCoordToScreen(addedResult.manipulationCenterCoord);
			}
			if (addedResult.manipulationDefDirectionCoord)
				rotateRefCoord = this.getEditor().objCoordToScreen(addedResult.manipulationDefDirectionCoord);
			//console.log(addedResult, rotateCenter);
			var box = this.getEditor().getObjectsContainerBox(addedObjects);
			//console.log(manType, rotateCenter, rotateRefCoord);
			//this.moveManipulatedObjs(startingObj);  // force a "move" action, to apply possible merge
			return {'objects': addedObjects, 'manipulateType': manType, 'coord': startingCoord,
				'box': box, 'rotateCenter': rotateCenter, 'rotateRefCoord': rotateRefCoord,
				'startingObj': startingObj};
		}
		else
		{
			// not added, do nothing
			return null;
		}
	},
	/** @private */
	insertRepositoryObjToEditor: function(startingCoord, startingObj, isUpdate)
	{
		var addedResult = this.addRepositoryObj(startingObj, startingCoord);
		return this.doInsertRepositoryObjToEditor(addedResult, startingCoord, startingObj, isUpdate);
	},
	/**
	 * Update (and change) the inserted structure in editor.
	 * You must ensure that the returned structures of method insertRepositoryObjToEditor
	 * returns all the same old inserted structures.
	 * @private
	 */
	updateRepositoryObjInEditor: function()
	{
		var editor = this.getEditor();
		editor.beginUpdateObject();
		try
		{
			// when merge preview is not used in editor, the merge operation may be messed up when change curr manipulation objects,
			// so empty them first
			if (!this.useMergePreview())
			{
				this.reverseActiveOperation();
			}
			//console.log(this._initialStartingObj, this._repObjStartingScreenCoord);
			//var result = this.insertRepositoryObjToEditor(this._repObjStartingScreenCoord, this._initialStartingObj, true);
			var oldObjects = this.getCurrRepositoryObjects();
			var addedRepObjResult = this.addRepositoryObj(this._initialStartingObj, this._repObjStartingScreenCoord, true);
			var unneedObjs = AU.exclude(oldObjects, (addedRepObjResult || {}).objects);  // objects should be removed
			for (var i = 0, l = unneedObjs.length; i < l; ++i)
			{
				var obj = unneedObjs[i];
				var parent = obj.getParent();
				if (parent)
					parent.removeChild(obj);
			}
			//console.log('unnedded', unneedObjs);
			// when merge preview is not used in editor, the merge operation may be messed up when change curr manipulation objects,
			// so empty them first
			if (!this.useMergePreview() || unneedObjs.length)
			{
				this.setMergeOperations([]);
				this.setMergePreviewOperations([]);
			}

			var result = this.doInsertRepositoryObjToEditor(addedRepObjResult, this._repObjStartingScreenCoord, this._initialStartingObj, true);
			if (result)
			{
				this.doRefreshRepositoryObj(result.objects, result.coord, result.box,
						result.rotateCenter, result.rotateRefCoord);
				this.moveManipulatedObjs(this._repObjStartingScreenCoord);  // force a "move" action, to apply possible merge
			}
		}
		finally
		{
			editor.endUpdateObject();
		}
		return result;
	},

	/** @private */
	getDirectManipulateObjs: function(insertedObjs, repInsertionResult)
	{
		return insertedObjs;
	},

	/** @private */
	react_pointerdown: function(e)
	{
		this.setActivePointerType(e.pointerType);
		if (e.getButton() === Kekule.X.Event.MOUSE_BTN_LEFT)
		{
			var S = BC.State;
			var coord = this._getEventMouseCoord(e);
			var state = this.getState();
			if (state === S.INITIAL)
			{
				var boundItem = this.getEditor().getTopmostBoundInfoAtCoord(coord, null, this.getCurrBoundInflation());
				var boundObj = boundItem? boundItem.obj: null;

				var insertResult = this.insertRepositoryObjToEditor(coord, boundObj);
				if (insertResult)
				{
					var allObjs = insertResult.objects || [];
					var directObjs = this.getDirectManipulateObjs(insertResult.objects, insertResult) || [];

					if (!AU.exclude(allObjs, directObjs).length && !AU.exclude(directObjs, allObjs).length)  // allObjs === directObjs
					{
						this.startDirectManipulate(insertResult.manipulateType, allObjs,
							insertResult.coord, insertResult.box, insertResult.rotateCenter);
						this.moveManipulatedObjs(coord);  // force a "move" action, to apply possible merge to all inserted objects
					}
					else
					{
						this.startDirectManipulate(insertResult.manipulateType, allObjs,
							insertResult.coord, insertResult.box, insertResult.rotateCenter);
						this.moveManipulatedObjs(coord);  // force a "move" action, to apply possible merge to all inserted objects
						this.startDirectManipulate(insertResult.manipulateType, directObjs,
							insertResult.coord, insertResult.box, insertResult.rotateCenter);  // directly manipulate on suitable objects
						this.moveManipulatedObjs(coord);  // force a "move" action, to apply possible merge to direct manipulatd objs
					}
				}
				e.preventDefault();
				return true; // important
			}
		}
	},
	/** @private */
	react_pointerup: function($super, e)
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
				e.preventDefault();
				return true;
			}
		}

		return $super(e);  // finish move operation
	}
});

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
 * Base controller to add a flex structure into chem space.
 * @class
 * @augments Kekule.Editor.RepositoryIaController
 */
Kekule.Editor.MolFlexStructureIaController = Class.create(Kekule.Editor.RepositoryIaController,
/** @lends Kekule.Editor.MolFlexStructureIaController# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.MolFlexStructureIaController',
	/** @construct */
	initialize: function($super, editor)
	{
		$super(editor);
		this.setEnableSelect(false);
	},
	/** @private */
	initProperties: function()
	{
		// marker to display the additional markers to flex structure
		this.defineProp('assocMarker', {'dataType': DataType.OBJECT, 'serializable': false,
			'setter': null,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('assocMarker');
				if (!result)
				{
					result = new Kekule.ChemWidget.TextUiMarker();
					this.setPropStoreFieldValue('assocMarker', result);
				}
				return result;
			}
		});
	},

	/** @ignore */
	manipulateEnd: function($super)
	{
		$super();
		this.hideAssocMarker();
	},

	/** @private */
	initAssocMarker: function()
	{
		var marker = this.getAssocMarker();
		var styleConfigs = this.getEditorConfigs().getUiMarkerConfigs();
		var drawStyles = {
			'color': styleConfigs.getFlexStructureAssocMarkerColor(),
			'opacity': styleConfigs.getFlexStructureAssocMarkerOpacity(),
			'fontSize': styleConfigs.getFlexStructureAssocMarkerFontSize(),
			'fontFamily': styleConfigs.getFlexStructureAssocMarkerFontFamily(),
			'textBoxXAlignment': Kekule.Render.BoxXAlignment.CENTER,
			'textBoxYAlignment': Kekule.Render.BoxYAlignment.CENTER
		};
		//console.log('draw styles', drawStyles);
		marker.setDrawStyles(drawStyles);
		marker.setVisible(true);
		this.getEditor().getUiMarkers().addMarker(marker);
		return marker;
	},
	/** @private */
	hideAssocMarker: function()
	{
		var marker = this.getPropStoreFieldValue('assocMarker');
		if (marker)
		{
			marker.setVisible(false);
			this.getEditor().getUiMarkers().removeMarker(marker);
			this.repaintMarker();
		}
	},
	/** @private */
	updateAssocMarker: function(coord, props, doNotRepaint)
	{
		var marker = this.getAssocMarker();
		if (coord)
			marker.setCoord(coord);
		if (props)
			marker.setPropValues(props);

		// request a repaint
		if (!doNotRepaint)
			this.repaintMarker();
	},
	/** @private */
	repaintMarker: function()
	{
		//console.log(this.getEditor().isUpdatingUiMarkers());
		this.getEditor().repaintUiMarker();
	}
});

/**
 * Controller to add a flex carbon chain into chem space.
 * @class
 * @augments Kekule.Editor.MolFlexStructureIaController
 */
Kekule.Editor.MolFlexChainIaController = Class.create(Kekule.Editor.MolFlexStructureIaController,
/** @lends Kekule.Editor.MolFlexChainIaController# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.MolFlexChainIaController',
	/** @construct */
	initialize: function($super, editor)
	{
		$super(editor);
		this.setEnableSelect(false);
		// private
		this._deltaDistance = null;
		this._deltaCount = 0;
		this._lastDeltaCount = 1;
		this._repObjStartingScreenCoord = null;
		this._repObjNeedUpdate = false;
		this._isForceReversedChainDirection = false;
		this._assocMarkerInitCoord = null;

		this._manipulateObjInfoCache = [];
		this._chain = null;  // internally, stores the chain molecule object

		var rep = new Kekule.Editor.MolChainRepositoryItem2D(2);
		rep.setEnableCoordCache(true);  // use cache to reduce dynamic coord calculation time
		this.setRepositoryItem(rep);
	},
	/** @ignore */
	updateAssocMarker: function($super, coord, props, doNotRepaint)
	{
		var editor = this.getEditor();
		var style = this.getAssocMarker().getDrawStyles();
		var mol = this._chain;

		// update draw position
		var currCoord = coord;  // || this._assocMarkerInitCoord;
		if (!currCoord && mol)
		{
			// draw near the last node of chain
			var firstNode = mol.getNodeAt(0);
			var lastNode = mol.getNodeAt(mol.getNodeCount() - 1);
			var firstCoord = editor.getObjectContextCoord(firstNode);
			currCoord = editor.getObjectContextCoord(lastNode);
			var v;
			if (currCoord && firstCoord)
				v = CU.substract(currCoord, firstCoord);
			if (v)
			{
				var fontSize = style.fontSize || 10;
				var gap = fontSize / 2;  // TODO: currently fixed
				var deltaCoord = {x: 0, y: 0};
				if (currCoord)
				{
					/*
					 if (Math.abs(v.x) >= Math.abs(v.y))
					 {
					 style.textBoxYAlignment = Kekule.Render.BoxYAlignment.CENTER;
					 style.textBoxXAlignment = (v.x >= 0) ? Kekule.Render.BoxXAlignment.RIGHT : Kekule.Render.BoxXAlignment.LEFT;
					 deltaCoord.x = gap * (Math.sign(v.x) || 1); // * -1;
					 }
					 else
					 {
					 style.textBoxXAlignment = Kekule.Render.BoxXAlignment.CENTER;
					 style.textBoxYAlignment = (v.y >= 0) ? Kekule.Render.BoxYAlignment.BOTTOM : Kekule.Render.BoxYAlignment.TOP;
					 deltaCoord.y = gap * (Math.sign(v.y) || 1); // * -1;
					 }
					 */
					var d = CU.getDistance(v);
					var ratioX = v.x / d;
					var ratioY = v.y / d;
					var deltaCoord = {x: gap * ratioX, y: gap * ratioY};

					currCoord = Kekule.CoordUtils.add(currCoord, deltaCoord);

					//console.log(currCoord, deltaCoord);
				}
			}
		}
		// then call $super, and repaint the marker
		$super(currCoord, props, doNotRepaint);
	},
	/** @private */
	getChainMaxAtomCount: function()
	{
		return Math.max(this.getEditorConfigs().getStructureConfigs().getMaxFlexChainAtomCount(), 0);
	},
	/** @ignore */
	manipulateEnd: function($super)
	{
		this._clearManipulateObjInfoCache();
		$super();
	},
	/** @ignore */
	createManipulateObjInfo: function($super, obj, objIndex, startContextCoord)
	{
		// try use cached info first
		var negative = this.getRepositoryItem().getNegativeDirection();
		var cachedInfo = this._getCachedManipulateObjInfo(objIndex, negative);
		if (cachedInfo)
		{
			//console.log('use cached info', objIndex, cachedInfo);
			return cachedInfo;
		}
		else  // calculate and save to cache
		{
			var info = $super(obj, objIndex, startContextCoord);
			this._setCachedManipulateObjInfo(info, objIndex, negative);
			return info;
		}
	},
	/** @ignore */
	canInteractWithObj: function($super, obj)
	{
		return $super(obj) && (obj instanceof Kekule.ChemStructureNode);
	},
	/** @ignore */
	getActualManipulatingObjects: function(objs)
	{
		// since we are sure that the manipulated objects is carbon chain itself,
		// we can return all its atoms as the actual manipulating objects / coord dependent objects
		var mol = this.getCurrRepositoryObjects()[0];
		//console.log(mol);
		return mol? AU.clone(mol.getNodes()): [];
	},
	/** @private */
	_setCachedManipulateObjInfo: function(info, atomIndex, isNegativeChain)
	{
		var cacheIndex = isNegativeChain? 1: 0;
		var cache = this._manipulateObjInfoCache[cacheIndex];
		if (!cache)
		{
			cache = [];
			this._manipulateObjInfoCache[cacheIndex] = cache;
		}
		cache[atomIndex] = info;
	},
	/** @private */
	_getCachedManipulateObjInfo: function(atomIndex, isNegativeChain)
	{
		var cacheIndex = isNegativeChain? 1: 0;
		var cache = this._manipulateObjInfoCache[cacheIndex];
		return cache && cache[atomIndex];
	},
	/** @private */
	_clearManipulateObjInfoCache: function()
	{
		this._manipulateObjInfoCache = [];
	},
	/** @private */
	_calcStepDeltaDistance: function()
	{
		var bondLength = this.getRepositoryItem().getBondLength();
		var transformParams = this.getInitialTransformParams();
		//console.log('repository item bond length', bondLength, transformParams);
		var editor = this.getEditor();
		var coord1 = editor.objCoordToScreen(Kekule.CoordUtils.transform2D({x: 0, y: 0}, transformParams));
		var coord2 = editor.objCoordToScreen(Kekule.CoordUtils.transform2D({x: bondLength * Math.cos(Math.PI / 6), y: 0}, transformParams));
		var result = Kekule.CoordUtils.getDistance(coord1, coord2);
		/*
		console.log('bond length', Kekule.CoordUtils.getDistance(
				Kekule.CoordUtils.transform2D({x: 0, y: 0}, transformParams),
				Kekule.CoordUtils.transform2D({x: bondLength, y: 0}, transformParams)
		));
		*/
		return result;
	},
	/** @ignore */
	getRepObjCreationOptions: function()
	{
		//return null;
		if (this._isUpdateRepObj)  // just update chain, can reuse the old structure to avoid unnecessary merge operation
		{
			var oldMol = this.getCurrRepositoryObjects()[0];
			//console.log(oldMol);
			return {'originalStructFragment': oldMol};
		}
		else
			return null;
	},
	/** @ignore */
	addRepositoryObj: function($super, targetObj, screenCoord, ignoreUnconnectedStructCheck)
	{
		var result = $super(targetObj, screenCoord, ignoreUnconnectedStructCheck);
		/*
		// debug
		var mol = result.objects[0];
		var coords = [];
		mol.getNodes().forEach(function(n) {coords.push(n.getCoord2D());} );
		console.log(coords);
		*/
		// save bond length
		this._deltaDistance = this._calcStepDeltaDistance();
		//this._repObjStartingScreenCoord = screenCoord;
		this._repObjNeedUpdate = false;
		return result;
	},
	/** @ignore */
	insertRepositoryObjToEditor: function($super, startingCoord, startingObj, isUpdate)
	{
		if (!isUpdate)
		{
			//this._initialStartingObj = startingObj;
			//this._repObjStartingScreenCoord = null;
			this._deltaDistance = null;
			this._deltaCount = 0;
			this._lastDeltaCount = 1;
			var initialAtomCount = 2;
			this.getRepositoryItem().setAtomCount(initialAtomCount);
		}
		this._isUpdateRepObj = isUpdate;  // a flag indicaing whether is update chain
		var result = $super(startingCoord, startingObj, isUpdate);
		this._chain = result && result.objects[0];

		if (result && !isUpdate)
		{
			var marker = this.initAssocMarker();
			//this._assocMarkerInitCoord = startingCoord;
			this.updateAssocMarker(null, {'text': '' + initialAtomCount});  // the marker will restain in starting coord
		}

		return result;
	},

	/** @private */
	_updateChain: function()
	{
		this._isUpdateRepObj = true;
		var result = this.updateRepositoryObjInEditor();
		this._chain = result.objects[0];
		this._repObjNeedUpdate = false;
		return result;
	},
	/** @ignore */
	doTransformManipulatedObjs: function($super, manipulateType, endScreenCoord, explicitTransformParams)
	{
		var endCoord = endScreenCoord;
		var state = this.getState();
		if (state ===  Kekule.Editor.BasicManipulationIaController.State.MANIPULATING)
		{
			//var startCoord = this.getRotateCenter();
			var startCoord = this.getBaseCoord();
			if (startCoord)
			{
				// check chain length
				var dis = Kekule.CoordUtils.getDistance(endCoord, startCoord);
				//var dis = Math.abs(coord.x - startCoord.x);
				var deltaCount = Math.max(Math.round(dis / this._deltaDistance), 1);
				//console.log(dis, this._deltaDistance, deltaCount);
				if (!this._lastDeltaCount || deltaCount !== this._lastDeltaCount)
				{
					this._deltaCount = deltaCount;
					// need recreate repository
					var maxAtomCount = this.getChainMaxAtomCount();
					var atomCount = maxAtomCount? Math.min(maxAtomCount, deltaCount + 1): deltaCount + 1;
					if (this.getRepositoryItem().getAtomCount() !== atomCount)
					{
						this.getRepositoryItem().setAtomCount(atomCount);
						this._repObjNeedUpdate = true;
						this.updateAssocMarker(null, {'text': '' + atomCount}, true);  // update text but suspend repaint
					}
					this._lastDeltaCount = deltaCount;
				}
				// console.log('dynamic', startCoord, coord, this._deltaDistance, deltaCount);

				// check chain direction
				var angleInfo = this._calcRotateAngle(endCoord);
				var angle = angleInfo && angleInfo.angle;
				var isConstrained = this.isInActualConstrainedRotation();
				var negativeDirection;
				if (isConstrained)
				{
					// note: here we use doubled constrainedRotateStep (30 degree) to avoid too violent variation
					// TODO: this step value should be customizable
					var angleStep = isConstrained ?
							this.getEditorConfigs().getInteractionConfigs().getConstrainedRotateStep() * 2 : null;

					var times = Math.round(angle / angleStep);
					var tailNum = times * angleStep - angle;
					negativeDirection = tailNum < 0;
					//console.log(angleStep, angle, times, tailNum);
				}
				else
				{
					negativeDirection = false;
				}
				if (this._isForceReversedChainDirection)
					negativeDirection = !negativeDirection;
				if (!!this.getRepositoryItem().getNegativeDirection() !== negativeDirection)
				{
					this.getRepositoryItem().setNegativeDirection(negativeDirection);
					this._repObjNeedUpdate = true;
				}
			}
		}

		if (this._repObjNeedUpdate)
			this._updateChain();

		var mol = this.getCurrRepositoryObjects()[0];
		mol.beginUpdate();
		try
		{
			var result = $super(manipulateType, endScreenCoord, explicitTransformParams);
			//var manipulationDirectionVector = Kekule.CoordUtils.substract(endScreenCoord, startCoord);
			this.updateAssocMarker(null, null, false);  // force repaint marker
		}
		finally
		{
			mol.endUpdate();
		}
		return result;
	},
	/** @ignore */
	react_pointermove: function($super, e)
	{
		//var tStart = Date.now();
		this._isForceReversedChainDirection = !!e.getShiftKey();
		var result = $super(e);
		//var tEnd = Date.now();
		//console.log('duration', tEnd - tStart);
		return result;
	}
});
Kekule.Editor.IaControllerManager.register(Kekule.Editor.MolFlexChainIaController, Kekule.Editor.ChemSpaceEditor);

/**
 * Controller to add a flex ring structure to chem space.
 * @class
 * @augments Kekule.Editor.MolFlexStructureIaController
 */
Kekule.Editor.MolFlexRingIaController = Class.create(Kekule.Editor.MolFlexStructureIaController,
/** @lends Kekule.Editor.MolFlexRingIaController# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.MolFlexRingIaController',
	/** @construct */
	initialize: function($super, editor)
	{
		$super(editor);
		this.setEnableSelect(false);
		// private
		this._deltaDistance = null;
		this._lastDeltaCount = 1;
		this._repObjStartingScreenCoord = null;
		this._repObjNeedUpdate = false;

		this._manipulateObjInfoCache = [];

		var rep = new Kekule.Editor.MolRingRepositoryItem2D(3);
		rep.setEnableCoordCache(true);  // use cache to reduce dynamic coord calculation time
		this.setRepositoryItem(rep);
	},

	/** @private */
	getRingMaxAtomCount: function()
	{
		return Math.max(this.getEditorConfigs().getStructureConfigs().getMaxFlexRingAtomCount(), 0);
	},
	/** @private */
	getRingMinAtomCount: function()
	{
		return Math.max(this.getEditorConfigs().getStructureConfigs().getMinFlexRingAtomCount(), 3);
	},
	/** @ignore */
	getActualManipulatingObjects: function(objs)
	{
		// since we are sure that the manipulated objects is carbon ring itself,
		// we can return all its atoms as the actual manipulating objects / coord dependent objects
		var mol = this.getCurrRepositoryObjects()[0];
		//console.log(mol);
		return mol? AU.clone(mol.getNodes()): [];
	},
	/** @ignore */
	manipulateEnd: function($super)
	{
		this._clearManipulateObjInfoCache();
		$super();
	},
	/** @ignore */
	createManipulateObjInfo: function($super, obj, objIndex, startContextCoord)
	{
		// try use cached info first
		var atomCount = this.getRepositoryItem().getRingAtomCount();
		var cachedInfo = this._getCachedManipulateObjInfo(objIndex, atomCount);
		if (cachedInfo)
		{
			//console.log('use cached info', objIndex, cachedInfo);
			return cachedInfo;
		}
		else  // calculate and save to cache
		{
			var info = $super(obj, objIndex, startContextCoord);
			this._setCachedManipulateObjInfo(info, objIndex, atomCount);
			return info;
		}
	},
	/** @private */
	_setCachedManipulateObjInfo: function(info, atomIndex, atomCount)
	{
		var cache = this._manipulateObjInfoCache[atomCount];
		if (!cache)
		{
			cache = [];
			this._manipulateObjInfoCache[atomCount] = cache;
		}
		cache[atomIndex] = info;
	},
	/** @private */
	_getCachedManipulateObjInfo: function(atomIndex, atomCount)
	{
		var cache = this._manipulateObjInfoCache[atomCount];
		return cache && cache[atomIndex];
	},
	/** @private */
	_clearManipulateObjInfoCache: function()
	{
		this._manipulateObjInfoCache = [];
	},

	/** @private */
	_calcStepDeltaDistance: function()
	{
		var bondLength = this.getRepositoryItem().getBondLength();
		var transformParams = this.getInitialTransformParams();
		//console.log('repository item bond length', bondLength, transformParams);
		var editor = this.getEditor();
		var coord1 = editor.objCoordToScreen(Kekule.CoordUtils.transform2D({x: 0, y: 0}, transformParams));
		var coord2 = editor.objCoordToScreen(Kekule.CoordUtils.transform2D({x: bondLength, y: 0}, transformParams));
		// TODO: 1/3 bond length, currently fixed
		var result = Kekule.CoordUtils.getDistance(coord1, coord2) / 3;
		return result;
	},
	/** @ignore */
	getRepObjCreationOptions: function()
	{
		if (this._isUpdateRepObj)  // just update ring, can reuse the old structure to avoid unnecessary merge operation
		{
			var oldMol = this.getCurrRepositoryObjects()[0];
			return {'originalStructFragment': oldMol};
		}
		else
			return null;
	},
	/** @ignore */
	addRepositoryObj: function($super, targetObj, screenCoord, ignoreUnconnectedStructCheck)
	{
		var result = $super(targetObj, screenCoord, ignoreUnconnectedStructCheck);
		// save bond length
		this._deltaDistance = this._calcStepDeltaDistance();
		//this._repObjStartingScreenCoord = screenCoord;
		this._repObjNeedUpdate = false;
		return result;
	},
	/** @ignore */
	insertRepositoryObjToEditor: function($super, startingCoord, startingObj, isUpdate)
	{
		if (!isUpdate)
		{
			//this._initialStartingObj = startingObj;
			//this._repObjStartingScreenCoord = null;
			this._deltaDistance = null;
			this._lastDeltaCount = 1;
			var initialAtomCount = this.getEditorConfigs().getStructureConfigs().getMinFlexRingAtomCount();
			this.getRepositoryItem().setRingAtomCount(initialAtomCount);
		}
		this._isUpdateRepObj = isUpdate;  // a flag indicaing whether is update ring
		var result = $super(startingCoord, startingObj);

		if (result && !isUpdate)  // really add new obj
		{
			var ring = result.objects[0];
			//this._ring = ring;
			this.initAssocMarker();
			this.updateAssocMarker(this._getRingCenterAbsContextCoord(ring), {'text': '' + initialAtomCount});
			//this._updateRingAssocMarker(ring);
		}

		return result;
	},
	/** @ignore */
	updateAssocMarker: function($super, coord, props, doNotRepaint)
	{
		if (!coord)
		{
			var centerCoord = this._getManipulateObjsCenterCoord();
			coord = this.getEditor().objCoordToContext(centerCoord);
		}
		//console.log('update marker', coord, props, doNotRepaint);
		return $super(coord, props, doNotRepaint);
	},
	/** @private */
	_getRingCenterAbsContextCoord: function(ring)
	{
		var editor = this.getEditor();
		var objCoord = Kekule.Editor.StructureUtils.getStructureCenterAbsBaseCoord(ring, editor.getCoordMode(), editor.getAllowCoordBorrow());
		return editor.objCoordToContext(objCoord);
	},

	/* @private */
	/*
	_updateRingAssocMarker: function(ring)
	{
		if (!ring)
			ring = this._ring;
		{
			var atomCount = ring.getNodeCount();
			var centerCoord = this._getRingCenterAbsContextCoord(ring);
			var marker = this.initAssocMarker();
			this.updateAssocMarker(centerCoord, {'text': '' + atomCount});  // the marker will be shown at the center of ring
		}
	},
	*/

	/** @private */
	_updateRing: function()
	{
		/*
		// reverse prev operation (and removes it from editor) first
		var editor = this.getEditor();
		editor.beginUpdateObject();
		try
		{
			var prevOperation = this.getActiveOperation();
			if (prevOperation)
			{

				prevOperation.reverse();
			}
			var insertResult = this.insertRepositoryObjToEditor(this._repObjStartingScreenCoord, this._initialStartingObj, true);
			if (insertResult)
			{
				this.moveManipulatedObjs(this._repObjStartingScreenCoord);  // force a "move" action, to apply possible merge
			}
			this._repObjNeedUpdate = false;
		}
		finally
		{
			editor.endUpdateObject();
		}
		*/
		this._isUpdateRepObj = true;
		var result = this.updateRepositoryObjInEditor();
		//this._ring = result.objects[0];
		this._repObjNeedUpdate = false;
		return result;
	},
	/** @ignore */
	doTransformManipulatedObjs: function($super, manipulateType, endScreenCoord, explicitTransformParams)
	{
		var endCoord = endScreenCoord;
		var state = this.getState();
		if (state ===  Kekule.Editor.BasicManipulationIaController.State.MANIPULATING)
		{
			//var startCoord = this.getRotateCenter();
			var startCoord = this.getBaseCoord();
			if (startCoord)
			{
				// check ring atom count
				var minAtomCount = this.getRingMinAtomCount();
				var dis = Kekule.CoordUtils.getDistance(endCoord, startCoord);
				var deltaCount = Math.round(dis / this._deltaDistance) + minAtomCount;  // min ring is 3 atoms
				//console.log(dis, this._deltaDistance, deltaCount);
				if (!this._lastDeltaCount || deltaCount !== this._lastDeltaCount)
				{
					// need recreate repository
					var maxAtomCount = this.getRingMaxAtomCount();
					var atomCount = maxAtomCount? Math.min(maxAtomCount, deltaCount): deltaCount;
					atomCount = minAtomCount? Math.max(atomCount, minAtomCount): atomCount;
					if (this.getRepositoryItem().getRingAtomCount() !== atomCount)
					{
						this.getRepositoryItem().setRingAtomCount(atomCount);
						this._repObjNeedUpdate = true;
						this.updateAssocMarker(null, {'text': '' + atomCount}, true);  // suspend repaint
					}
					//this._updateChain();
					this._lastDeltaCount = deltaCount;
				}
				// console.log('dynamic', startCoord, coord, this._deltaDistance, deltaCount);
			}
		}

		if (this._repObjNeedUpdate)
			this._updateRing();

		var mol = this.getCurrRepositoryObjects()[0];
		mol.beginUpdate();
		try
		{
			var result = $super(manipulateType, endScreenCoord, explicitTransformParams);
			//this._updateRingAssocMarker(mol);
			// update assoc marker and coord
			this.updateAssocMarker(null, null, false);  // force repaint marker
		}
		finally
		{
			mol.endUpdate();
		}
		return result;
	}
});
Kekule.Editor.IaControllerManager.register(Kekule.Editor.MolFlexRingIaController, Kekule.Editor.ChemSpaceEditor);

/**
 * Controller to add ring structure into chem space.
 * The ring could be a simple one (all ring bonds are single), or an aromatic one (e.g. benzene).
 * If the ring is aromatic, the double bond and single bond position will be automatically adjusted when inserting
 * to editor, according to nearby nodes and connectors of existing molecules.
 * So here the MolFlexStructureIaController is choosen as the base class.
 * @class
 * @augments Kekule.Editor.RepositoryIaController
 *
 * @property {Int} ringAtomCount Atom count on ring.
 * @property {Bool} isAromatic Whether this ring is a aromatic one (single/double bond intersect),
 */
Kekule.Editor.MolRingIaController = Class.create(Kekule.Editor.MolFlexStructureIaController,  // Kekule.Editor.RepositoryIaController,
/** @lends Kekule.Editor.MolRingIaController# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.MolRingIaController',
	/** @construct */
	initialize: function($super, editor)
	{
		$super(editor);
		this.setRepositoryItem(new Kekule.Editor.MolRingRepositoryItem2D());
		this.setEnableSelect(false);
		this._currBondOrders = null;  // stores current bond orders after a merge, may be needed at the last step of manipulation
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('ringAtomCount', {'dataType': DataType.INT,
			'getter': function() { return this.getRepositoryItem().getRingAtomCount(); },
			'setter': function(value) { this.getRepositoryItem().setRingAtomCount(value); }
		});
		/*
		this.defineProp('isAromatic', {'dataType': DataType.INT,
			'getter': function() { return this.getRepositoryItem().getIsAromatic(); },
			'setter': function(value) { this.getRepositoryItem().setIsAromatic(value); }
		});
		*/
		this.defineProp('isAromatic', {'dataType': DataType.INT});
	},
	/** @ignore */
	getActualManipulatingObjects: function(objs)
	{
		// since we are sure that the manipulated objects is carbon chain itself,
		// we can return all its atoms as the actual manipulating objects / coord dependent objects
		var mol = this.getCurrRepositoryObjects()[0];
		//console.log(mol);
		return mol? AU.clone(mol.getNodes()): [];
	},
	/** @ignore */
	createNodeMergeOperation: function($super, fromNode, toNode, useMergePreview)
	{
		var result = $super(fromNode, toNode, useMergePreview);
		if (this.getIsAromatic())  // when inserting aromatic ring, double bond may need to overwrite single bond of existing structure
		{
			if (result && result.setMergeConnectorPropsFromTarget)
				result.setMergeConnectorPropsFromTarget(true);
		}
		return result;
	},
	/** @ignore */
	manipulateBeforeStopping: function($super)
	{
		if (this._currBondOrders && this.useMergePreview())  // apply the actual bond orders to newly inserted structure, instead of the preview one
		{
			this._applyBondOrdersToSrcStruct(null, this._currBondOrders);
		}
		return $super();
	},

	/** @ignore */
	_mergeOperationsChanged : function($super, mergedObjCount, targetObjs, destObjs)
	{
		$super(mergedObjCount, targetObjs, destObjs);
		//console.log('new we have a new merge', mergedObjCount, targetObjs, destObjs);

		// since a new merge is created, we have to modify the double bond position in ring
		//console.log(this.getCurrRepositoryObjects());

		var repObjects = this.getCurrRepositoryObjects();
		var srcStruct = repObjects && repObjects[0];

		if (srcStruct)
		{
			var mergedDestObjs = this._getMergedDestObjs(srcStruct, mergedObjCount, targetObjs, destObjs);
			// according to obj map, calculate the correct bond orders of src
			this.updateRepStructureBondOrders(srcStruct, mergedDestObjs, this.useMergePreview());
		}
	},
	/** @ignore */
	createObjFromRepositoryItem: function($super, targetObj, repItem)
	{
		var result = $super(targetObj, repItem);
		this.updateRepStructureBondOrders(result.objects[0], null);  // initialize double bonds of aromatic ring
		this._currBondOrders = null;
		return result;
	},
	/** @private */
	updateRepStructureBondOrders: function(srcStruct, mergedDestObjs, isPreview)
	{
		if (!this.getIsAromatic())
			return;
		if (!srcStruct)
		{
			var repObjects = this.getCurrRepositoryObjects();
			var srcStruct = repObjects && repObjects[0];
		}
		if (!mergedDestObjs)
		{
			mergedDestObjs = {'nodes': [], 'connectors': [], 'nodeCount': 0, 'connectorCount': 0};
		}
		var bondOrderResult = this._calcSrcBondOrders(srcStruct, mergedDestObjs);
		var bondOrders = bondOrderResult.bondOrders;
		var previewBondOrders = bondOrderResult.previewBondOrders;

		// stores the latest actual bond orders (not preview orders)
		this._currBondOrders = bondOrders;

		//console.log(bondOrders, previewBondOrders, isPreview);
		this._applyBondOrdersToSrcStruct(srcStruct, isPreview ? previewBondOrders: bondOrders);
	},
	/** @private */
	_applyBondOrdersToSrcStruct: function(srcStruct, bondOrders)
	{
		if (!srcStruct)
		{
			var repObjects = this.getCurrRepositoryObjects();
			var srcStruct = repObjects && repObjects[0];
		}
		var editor = this.getEditor();
		try
		{
			editor.beginUpdateObject();
			//if (this.useMergePreview())
			{
				srcStruct.beginUpdate();
				try
				{
					// set bond order of src structure
					for (var i = 0, l = srcStruct.getConnectorCount(); i < l; ++i)
					{
						var bond = srcStruct.getConnectorAt(i);
						if (bond && bond.setBondOrder)
						{
							var bondOrder = bondOrders[i];
							bond.setBondOrder(bondOrder);
						}
					}
				}
				finally
				{
					srcStruct.endUpdate();
				}
			}
		}
		finally
		{
			editor.endUpdateObject();
		}
	},
	/** @private */
	_getMergedDestObjs: function(srcStruct, mergedObjCount, srcObjs, destObjs)
	{
		var insertedMol = srcStruct;
		if (insertedMol)
		{
			var _getMappedConnector = function(srcConnector, srcNodes, destNodes)
			{
				var srcConnectedNodes = srcConnector.getConnectedChemNodes();
				var destConnectedNodes = [];
				for (var i = 0, l = srcConnectedNodes.length; i < l; ++i)
				{
					var currNode = srcConnectedNodes[i];
					var index = srcNodes.indexOf(currNode);
					var destNode = destNodes[index];
					if (destNode)
						destConnectedNodes.push(destNode);
					else
						return null;
				}
				if (destConnectedNodes.length === 2)
				{
					var testDestConnectors = destConnectedNodes[0].getLinkedConnectors();
					for (var i = 0, l = testDestConnectors.length; i < l; ++i)
					{
						var testConnector = testDestConnectors[i];
						var testConnectedNodes = testConnector.getConnectedChemNodes();
						if (testConnectedNodes.length === 2 && testConnectedNodes.indexOf(destConnectedNodes[1]) >= 0)
							return testConnector;
					}
				}
				return null;
			};
			var result = {'nodes': [], 'connectors': [], nodeCount: 0, connectorCount: 0};
			// nodes
			for (var i = 0, l = insertedMol.getNodeCount(); i < l; ++i)
			{
				var srcNode = insertedMol.getNodeAt(i);
				var index = srcObjs.indexOf(srcNode);
				var destNode = (index >= 0)? destObjs[index]: null;
				result.nodes.push(destNode);
				if (destNode)
					++result.nodeCount;
			}
			// connectors
			for (var i = 0, l = insertedMol.getConnectorCount(); i < l; ++i)
			{
				var srcConn = insertedMol.getConnectorAt(i);
				var destConn = _getMappedConnector(srcConn, insertedMol.getNodes(), result.nodes) || null;
				result.connectors.push(destConn);
				if (destConn)
					++result.connectorCount;
			}
		}
		return result;
	},
	/** @private */
	_calcSrcBondOrders: function(srcStruct, mergedDestObjs)
	{
		if (srcStruct && srcStruct.getNodeCount())
		{
			var hasMerge = mergedDestObjs && mergedDestObjs.nodeCount;
			var srcConnectors = srcStruct.getConnectors();
			var destMergeConnectors = mergedDestObjs.connectors;
			var srcNodes = srcStruct.getNodes();
			var destMergeNodes = mergedDestObjs.nodes;

			var _isMultipleBondOrder = function(bondOrder)
			{
				return ((bondOrder > Kekule.BondOrder.SINGLE) && (bondOrder <= Kekule.BondOrder.QUAD));
			};
			var _hasExplicitAromaticBond = function(destNode)
			{
				var linkedBonds = destNode.getLinkedBonds(Kekule.BondType.COVALENT);
				var result = false;
				if (linkedBonds.length)
				{
					for (var i = 0, l = linkedBonds.length; i < l; ++i)
					{
						var bondOrder = linkedBonds[i].getBondOrder();
						if (bondOrder === Kekule.BondOrder.EXPLICIT_AROMATIC)
						{
							result = true;
							break;
						}
					}
				}
				return result;
			};
			var _hasMultipleBondsOutsideRing = function(destNode, destMergeConnectors)
			{
				var linkedBonds = destNode.getLinkedBonds(Kekule.BondType.COVALENT);
				//var outsideRingBonds = linkedBonds;
				var outsideRingBonds = AU.exclude(linkedBonds, destMergeConnectors);
				outsideRingBonds = AU.exclude(outsideRingBonds, srcConnectors);
				var result = false;
				if (outsideRingBonds.length)
				{
					for (var i = 0, l = outsideRingBonds.length; i < l; ++i)
					{
						var bondOrder = outsideRingBonds[i].getBondOrder();
						if (_isMultipleBondOrder(bondOrder))
						{
							result = true;
							break;
						}
					}
				}
				return result;
			};
			var _hasOldMultipleBondsInsideRing = function(destNode, destMergeConnectors)
			{
				var linkedBonds = destNode.getLinkedBonds(Kekule.BondType.COVALENT);
				var insideRingBonds = AU.intersect(linkedBonds, destMergeConnectors);
				var result = false;
				if (insideRingBonds.length)
				{
					for (var i = 0, l = insideRingBonds.length; i < l; ++i)
					{
						var bondOrder = insideRingBonds[i].getBondOrder();
						if (_isMultipleBondOrder(bondOrder))
						{
							result = true;
							break;
						}
					}
				}
				return result;
			};
			// this function returns the confilict count of current bond order setting
			var _trySetSrcBondOrders = function(currIndex, srcConnectors, srcNodes, destMergeConnectors, destMergeNodes, calculatedBondOrders, calculatedMergePreviewBondOrders)
			{
				var BO = Kekule.BondOrder;
				var currAvailableOrders, currPreviewOrders;
				var lastIndex = currIndex - 1;
				if (lastIndex < 0)
					lastIndex = srcConnectors.length - 1;
				var hasLastConnector = !!calculatedBondOrders[lastIndex]; // lastIndex >= 0;
				var lastOrder = hasLastConnector? calculatedBondOrders[lastIndex]: null;

				// check if already has a multiple bond on merge dest, if so, we should use the old bond order
				var currSrcConnector = srcConnectors[currIndex];  // getConnectorAtIndex(currIndex);
				var destMergeConnector = destMergeConnectors[currIndex];
				var oldOrder = destMergeConnector && destMergeConnector.getBondOrder();

				var conflictCount = 0;

				if (oldOrder && _isMultipleBondOrder(oldOrder))
				{
					currAvailableOrders = [oldOrder];
					currPreviewOrders = [BO.SINGLE];  // in preview, need use single bond to avoid display two double bonds (like a triple bond in view)
					// if last order is a double bond, error
					if (lastOrder && _isMultipleBondOrder(lastOrder))
						++conflictCount; //return false;
				}
				else
				{
					if (hasLastConnector && _isMultipleBondOrder(lastOrder))  // previous bond is double, this one must be single
					{
						currAvailableOrders = [BO.SINGLE];
						//console.log('index', currIndex, 'last is multi');
					}
					else
					{
						//var currDestMergeConnector = destMergeConnectors[currIndex];
						var currSrcNodes = currSrcConnector.getConnectedChemNodes();
						var hasMultipleBondsOutsideRing = false;
						var hasMultipleBondsInsideRing = false;
						for (var i = 0, l = currSrcNodes.length; i < l; ++i)
						{
							var nodeIndex = srcNodes.indexOf(currSrcNodes[i]);
							var currDestMergeNode = destMergeNodes[nodeIndex];
							if (currDestMergeNode)
							{
								hasMultipleBondsOutsideRing = _hasMultipleBondsOutsideRing(currDestMergeNode, destMergeConnectors);
								hasMultipleBondsInsideRing = _hasOldMultipleBondsInsideRing(currDestMergeNode, destMergeConnectors);
								if (hasMultipleBondsOutsideRing || hasMultipleBondsInsideRing)
									break;
							}
						}
						//console.log('index', currIndex, hasMultipleBondsOutsideRing, hasMultipleBondsInsideRing);
						if (hasMultipleBondsOutsideRing || hasMultipleBondsInsideRing)  // double bond outside ring, need to set current bond order to 1
						{
							currAvailableOrders = [BO.SINGLE];
						}
						else
						{
							currAvailableOrders = [BO.DOUBLE, BO.SINGLE];
							/*
							if (!hasLastConnector)  // this is the first bond
							{
								if (destMergeConnectors[currIndex])  // has a existing old bond
								{

									if (Kekule.ObjUtils.notUnset(oldOrder) && oldOrder <= 1)  // use existing bond order, 1
										currAvailableOrders = 1;  // oldOrder;
								}
							}
							*/
						}
					}
				}

				//console.log('available order', currIndex, currAvailableOrders);

				var minConflictCount;
				var finalOrder;
				for (var i = 0, l = currAvailableOrders.length; i < l; ++i)
				{
					var currOrder = currAvailableOrders[i];
					calculatedBondOrders[currIndex] = currOrder;
					calculatedMergePreviewBondOrders[currIndex] = (currPreviewOrders && currPreviewOrders[i]) || currOrder;
					// continue to set next bond
					if (currIndex < srcConnectors.length - 1)
					{
						conflictCount = conflictCount + _trySetSrcBondOrders(++currIndex, srcConnectors, srcNodes, destMergeConnectors, destMergeNodes, calculatedBondOrders, calculatedMergePreviewBondOrders);
						if (Kekule.ObjUtils.isUnset(minConflictCount) || minConflictCount > conflictCount)
						{
							minConflictCount = conflictCount;
							finalOrder = currOrder;
						}
						if (conflictCount <= 0)  // no error, just use this one
							break;
						/*
						if (!conflictCount)  // try set bond orders failed
							continue;  // try another way
						else
							break;
						*/
					}
				}

				return conflictCount;
			};

			var currIndex = 0;
			var bondOrders = [], mergePreviewBondOrders = [];
			//console.log(srcConnectors, srcNodes, destMergeConnectors, destMergeNodes, bondOrders);

			// TODO: if destMergeConnectors has explicit aromatoc bond, now the bond on the new ring will all be set to explicit aromatic
			var hasOldExplicitAromaticBond = false;
			for (var i = 0, l = destMergeNodes.length; i < l; ++i)
			{
				var n = destMergeNodes[i];
				if (n && _hasExplicitAromaticBond(n))
				{
					hasOldExplicitAromaticBond = true;
					break;
				}
			}

			if (hasOldExplicitAromaticBond)
			{
				bondOrders = [];
				for (var i = 0, l = srcConnectors.length; i < l; ++i)
					bondOrders[i] = Kekule.BondOrder.EXPLICIT_AROMATIC;
				return bondOrders;
			}
			else
			{
				// if destMergeConnectors has multiple bond, those bond orders should inherited
				for (var i = 0, l = destMergeConnectors.length; i < l; ++i)
				{
					var b = destMergeConnectors[i];
					if (b)
					{
						var bOrder = b.getBondOrder();
						if (_isMultipleBondOrder(bOrder))
							bondOrders[i] = bOrder;
					}
				}
				// the calculate the bond orders of the rests
				var orderResult = _trySetSrcBondOrders(0, srcConnectors, srcNodes, destMergeConnectors, destMergeNodes, bondOrders, mergePreviewBondOrders);
				//console.log('calc bond orders', bondOrders, 'error', orderResult, destMergeConnectors, destMergeNodes);
				return {'bondOrders': bondOrders, 'previewBondOrders': mergePreviewBondOrders};
			}
		}
	}
});
// register
Kekule.Editor.IaControllerManager.register(Kekule.Editor.MolRingIaController, Kekule.Editor.ChemSpaceEditor);

/**
 * Controller to add path glyph with ctab.
 * @class
 * @augments Kekule.Editor.RepositoryIaController
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
Kekule.Editor.PathGlyphIaController = Class.create(Kekule.Editor.RepositoryIaController,
/** @lends Kekule.Editor.PathGlyphIaController# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.PathGlyphIaController',
	/** @construct */
	initialize: function($super, editor)
	{
		$super(editor);
		//this.setEnableLengthChangeInConstrainedMoving(true);
	},
	/** @ignore */
	getDirectManipulateObjs: function($super, insertedObjs, repInsertionResult)
	{
		//return insertedObjs;
		if (insertedObjs.length === 1)
		{
			var parent = insertedObjs[0];
			// if parent has two node (e.g., arrow), allow to move the end point of it directly
			if (parent.getNodeAt && parent.getNodeCount)
			{
				if (parent.getNodeCount() === 2)
					return [parent.getNodeAt(parent.getNodeCount() - 1)];
			}
		}
		// default
		return $super(insertedObjs, repInsertionResult);
	},
	/** @ignore */
	getInsertedObjs: function($super)
	{
		return this.getCurrRepositoryObjects();  // the whole inserted objects should be auto selected after inserting
	}
});

/**
 * Controller to add arrow/line into chem space.
 * @class
 * @augments Kekule.Editor.PathGlyphIaController
 *
 * @property {Class} glyphClass Class to create glyph.
 * @property {Float} glyphRefLength Default length to generate glyph.
 * @property {Hash} glyphInitialParams Initial params to create glyph.
 */
Kekule.Editor.ArrowLineIaController = Class.create(Kekule.Editor.PathGlyphIaController,
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
	addRepositoryObj: function($super, targetObj, screenCoord, ignoreUnconnectedStructCheck)
	{
		// set ref length before adding new object
		this.getRepositoryItem().setGlyphRefLength(this.getEditor().getChemSpace().getDefAutoScaleRefLength());
		return $super(targetObj, screenCoord, ignoreUnconnectedStructCheck);
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
			var addOperation = new Kekule.ChemObjOperation.Add(mol, chemSpace, null, editor);
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
		var result = new Kekule.Widget.TextBox(this.getEditor());
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
				//console.log('show state change', e.isShown, e.isDismissed, e.byDomChange);
				if (!e.byDomChange)
				{
					if (!e.isShown && !e.isDismissed)  // widget hidden, feedback the edited value
					{
						self.applySetter(result);
					}
					if (e.isShown)  // set applied to false on newly shown widget
						result._applied = false;
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
				oper = new Kekule.ChemObjOperation.Remove(mol, mol.getParent(), null, this.getEditor());
			}
		}
		else
		{
			var oper = new Kekule.ChemObjOperation.Modify(mol.getFormula(), {'text': text}, this.getEditor());
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

				this.doneInsertOrModifyBasicObjects([mol]);
			}
		}

		setter._applied = true;
	},
	/**
	 * Open formula edit box in coord.
	 * @param {Hash} coord
	 * @param {Object} mol
	 * @private
	 */
	openSetterUi: function(coord, mol)
	{
		var oldSetter = this.getTextSetter();
		if (oldSetter && oldSetter.isShown())  // has a old setter
		{
			this.applySetter(oldSetter, this.getCurrMol());
			oldSetter.hide();
			oldSetter._haltPrevShowHideProcess();
		}

		if (!mol)  // need create new
			mol = this.createNewMol(this.getEditor().getChemObj(), coord);

		if (!this.isValidMol(mol))
			return;
		this.setCurrMol(mol);

		this.getEditor().setSelection([mol]);

		//console.log(block.getCascadedRenderOption('fontSize'));

		var fontSize = mol.getCascadedRenderOption('fontSize') || this.getEditor().getEditorConfigs().getInteractionConfigs().getAtomSetterFontSize();
		fontSize *= this.getEditor().getZoom() || 1;
		var fontName = mol.getCascadedRenderOption('fontFamily') || '';
		//var posAdjust = fontSize / 1.5;  // adjust position to align to atom center
		var text = this.getFormulaText(mol);
		var setter = this.getTextSetterWidget(true);

		var parentElem = this.getEditor().getCoreElement();
		//setter._setEnableShowHideEvents(false);
		setter.appendToElem(parentElem);  // ensure setter widget is a child of parentElem, since popup show may change the parent each time
		//setter._setEnableShowHideEvents(true);

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
		setter._applied = false;
		setter.show(null, null, Kekule.Widget.ShowHideType.POPUP);
		setter.selectAll();
		setter.focus();
	},

	/** @private */
	react_pointerup: function(e)
	{
		if (e.getButton() === Kekule.X.Event.MOUSE_BTN_LEFT)
		{
			this.getEditor().setSelection(null);
			var coord = this._getEventMouseCoord(e);
			{
				var mol;
				/*
				var boundItem = this.getEditor().getTopmostBoundInfoAtCoord(coord, null, this.getCurrBoundInflation());
				if (boundItem)
				{
					var obj = boundItem.obj;

					if (this.isValidMol(obj))  // can modify atom of this object
					{
						mol = obj;
					}
				}
				*/
				var obj = this.getTopmostInteractableObjAtScreenCoord(coord);
				mol = obj;
				var molBounds = obj && this.getEditor().getChemObjBounds(obj);
				var boundItem = molBounds && molBounds[0];

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
	react_pointerup: function(e)
	{
		if (e.getButton() === Kekule.X.Event.MouseButton.LEFT)
		{
			this.getEditor().setSelection(null);
			var coord = this._getEventMouseCoord(e);
			{
				/*
				var block;
				var boundItem = this.getEditor().getTopmostBoundInfoAtCoord(coord, null, this.getCurrBoundInflation());
				if (boundItem)
				{
					var obj = boundItem.obj;

					if (this.isValidBlock(obj))  // can modify atom of this object
					{
						block = obj;
					}
				}
				*/
				var block = this.getTopmostInteractableObjAtScreenCoord(coord);

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
				var addOperation = new Kekule.ChemObjOperation.Add(block, chemSpace, null, editor);
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
		var result = new Kekule.Widget.TextArea(this.getEditor());
		result.setAutoSizeX(true);
		result.setAutoSizeY(true);
		result.setDisplayed(false);
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
				if (!e.byDomChange)
				{
					if (!e.isShown && !e.isDismissed)  // widget hidden, feedback the edited value
					{
						self.applySetter(result);
					}
					if (e.isShown)  // set applied to false on newly shown widget
						result._applied = false;
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
				oper = new Kekule.ChemObjOperation.Remove(block, block.getParent(), null, this.getEditor());
		}
		else
			oper = new Kekule.ChemObjOperation.Modify(block, {'text': text}, this.getEditor());

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

			this.doneInsertOrModifyBasicObjects([block]);
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
			//oldSetter.dismiss();
			oldSetter._haltPrevShowHideProcess();
		}

		if (!block)  // need create new
		{
			block = this.createNewBlock(this.getEditor().getChemObj(), coord);
		}

		if (!this.isValidBlock(block))
			return;
		this.setCurrBlock(block);

		//this.doneInsertOrModifyBasicObjects([block]);
		//this.getEditor().setSelection([block]);

		// calculate the top-left position of block
		var setterCoord = this.getEditor().getObjectScreenCoord(block, Kekule.Render.CoordPos.CORNER_TL);

		//console.log(block.getCascadedRenderOption('fontSize'));

		var fontSize = block.getCascadedRenderOption('fontSize') || this.getEditor().getEditorConfigs().getInteractionConfigs().getAtomSetterFontSize();
		fontSize *= (this.getEditor().getZoom() || 1);
		var fontName = block.getCascadedRenderOption('fontFamily') || '';
		//var posAdjust = fontSize / 1.5;  // adjust position to align to atom center
		var text = this.getBlockText(block);
		var setter = this.getTextSetterWidget(true);
		setter._applied = false;

		//console.log(block, text, slabel);
		setter.setValue(text);
		var slabel = text || Kekule.$L('ChemWidgetTexts.CAPTION_TEXTBLOCK_INIT'); //Kekule.ChemWidgetTexts.CAPTION_TEXTBLOCK_INIT;
		setter.setPlaceholder(slabel);

		var parentElem = this.getEditor().getCoreElement();
		setter.appendToElem(parentElem);  // ensure setter widget is a child of parentElem, since popup show may change the parent each time

		//setter.setValue('hehr');
		//setter.setIsPopup(true);
		var style = setter.getElement().style;
		style.position = 'absolute';
		style.fontSize = fontSize + 'px';
		style.left = setterCoord.x + 'px';
		style.top = setterCoord.y + 'px';
		style.fontFamily = fontName;
		style.opacity = 1;
		/*
		style.marginTop = -posAdjust + 'px';
		style.marginLeft = -posAdjust + 'px';
		*/
		setter.show(null, null, Kekule.Widget.ShowHideType.POPUP);

		(function()
		{
			setter.selectAll();
			setter.focus();
		}).defer();
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
			var addOperation = new Kekule.ChemObjOperation.Add(block, chemSpace, null, editor);
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
						oper = new Kekule.ChemObjOperation.Add(block, chemSpace, null, editor);
					}
					if (oper)
					{
						//editor.beginUpdateObject();
						try
						{
							oper.execute();
							if (editor && editor.getEnableOperHistory())
								editor.pushOperation(oper);

							self.doneInsertOrModifyBasicObjects([self.getCurrBlock()]);
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

/**
 * Controller to explicitly create attached markers to a existing object.
 * @class
 * @augments Kekule.Editor.BaseEditorIaController
 *
 * @property {Class} markerClass Class of marker that should be created.
 * @property {Class} targetClass Class of the legal parent object of newly create marker.
 * @property {Hash} initialPropValues Property values set to newly created marker.
 */
Kekule.Editor.AttachedMarkerIaController = Class.create(Kekule.Editor.BaseEditorIaController,
/** @lends Kekule.Editor.AttachedMarkerIaController# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.AttachedMarkerIaController',
	/** @construct */
	initialize: function($super, editor)
	{
		$super(editor);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('markerClass', {'dataType': DataType.CLASS, 'serializable': false});
		this.defineProp('targetClass', {'dataType': DataType.CLASS, 'serializable': false});
		this.defineProp('markerClassName', {'dataType': DataType.STRING,
			'getter': function() { return ClassEx.getClassName(this.getMarkerClass()); },
			'setter': function(value) { this.setMarkerClass(ClassEx.findClass(value)); }
		});
		this.defineProp('targetClassName', {'dataType': DataType.STRING,
			'getter': function() { return ClassEx.getClassName(this.getTargetClass()); },
			'setter': function(value) { this.setTargetClass(ClassEx.findClass(value)); }
		});
		this.defineProp('initialPropValues', {'dataType': DataType.HASH});
	},

	/** @ignore */
	canInteractWithObj: function($super, obj)
	{
		return this.isValidTarget(obj);
	},

	/**
	 * Check if obj is a valid object to add marker.
	 * @param {Kekule.ChemObject} obj
	 * @returns {Bool}
	 * @private
	 */
	isValidTarget: function(obj)
	{
		var targetClass = this.getTargetClass();
		return (obj instanceof targetClass) || !targetClass;
	},

	/** @private */
	createMarker: function()
	{
		var result;
		var markerClass = this.getMarkerClass();
		if (markerClass)
		{
			result = new markerClass();
			var initValues = this.getInitialPropValues();
			if (initValues && result && result.setPropValues)
			{
				result.setPropValues(initValues);
			}
		}
		return result;
	},

	/** @private */
	createOperations: function(targetObj)
	{
		var result;
		var marker = this.createMarker();
		if (marker)  // add to target object
		{
			result = new Kekule.ChemObjOperation.Add(marker, targetObj, null, this.getEditor());
		}
		return [result];
	},

	/**
	 * Execute on the target object, add a new marker.
	 * @param {Kekule.ChemObject} targetObj
	 * @private
	 */
	apply: function(targetObj)
	{
		var operations = this.createOperations(targetObj);
		var oper = (operations.length <= 0)? null:
				(operations.length === 1)? operations[0]:
				new Kekule.MacroOperation(operations);
		if (oper)
		{
			oper.execute();
			var editor = this.getEditor();
			if (editor && editor.getEnableOperHistory())
			{
				editor.pushOperation(oper);
			}
		}
	},

	/** @private */
	react_pointerup: function(e)
	{
		if (e.getButton() === Kekule.X.Event.MouseButton.LEFT)
		{
			//this.getEditor().setSelection(null);
			var coord = this._getEventMouseCoord(e);
			{
				var boundItem = this.getEditor().getTopmostBoundInfoAtCoord(coord, null, this.getCurrBoundInflation());
				if (boundItem)
				{
					var obj = boundItem.obj;
					if (this.isValidTarget(obj))  // can add marker to this object
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
Kekule.Editor.IaControllerManager.register(Kekule.Editor.AttachedMarkerIaController, Kekule.Editor.ChemSpaceEditor);

/**
 * Controller to set atom/group charge and radical.
 * @class
 * @augments Kekule.Editor.AttachedMarkerIaController
 *
 * @property {Number} chargeInc The node's charge will become charge + chargeInc after execution of controller.
 * @property {Number} charge The node's charge will become this value after execution of controller.
 * @property {Int} radical Radical type set to node
 */
Kekule.Editor.MolNodeChargeIaController = Class.create(Kekule.Editor.AttachedMarkerIaController,
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
	initPropValues: function($super)
	{
		$super();
		this.setTargetClass(Kekule.ChemStructureNode);
	},

	/** @private */
	createOperations: function(node)
	{
		var result;
		// check charge
		var chargeModified = false;
		var radicalModified = false;
		var modifiedData = {};
		var charge = node.getCharge();
		if (Kekule.ObjUtils.notUnset(this.getCharge()))
		{
			if (charge !== this.getCharge())
			{
				modifiedData.charge = this.getCharge();
				chargeModified = true;
			}
		}
		else if (this.getChargeInc())
		{
			charge += this.getChargeInc();
			modifiedData.charge = charge;
			chargeModified = true;
		}
		var radical = node.getRadical();
		if (this.getRadical() !== radical)
		{
			//console.log(radical, this.getRadical());
			modifiedData.radical = this.getRadical();
			radicalModified = true;
		}

		var result = [];
		// add or remove marker operation
		var markerOperations = [];
		var marker;
		var editor = this.getEditor();
		if (chargeModified)
		{
			var chargeMarker = node.fetchChargeMarker(false);  // do not auto create
			if (modifiedData.charge !== 0 && !chargeMarker)
			{
				// need add new charge marker
				marker = new Kekule.ChemMarker.Charge();
				marker.setValue(modifiedData.charge);
				markerOperations.push(new Kekule.ChemObjOperation.Add(marker, node, null, editor));
			}
			if (modifiedData.charge === 0 && chargeMarker)
			{
				// need remove existing charge marker
				markerOperations.push(new Kekule.ChemObjOperation.Remove(chargeMarker, null, null, editor));
			}
		}
		if (radicalModified)
		{
			var radicalMarker = node.fetchRadicalMarker(false);  // do not auto create
			if (modifiedData.radical !== 0 && !radicalMarker)
			{
				// need add new radical marker
				marker = new Kekule.ChemMarker.Radical();
				marker.setValue(modifiedData.radical);
				markerOperations.push(new Kekule.ChemObjOperation.Add(marker, node, null, editor));
			}
			if (modifiedData.radical === 0 && radicalMarker)
			{
				// need remove existing radical marker
				markerOperations.push(new Kekule.ChemObjOperation.Remove(radicalMarker, null, null, editor));
			}
		}
		result = result.concat(markerOperations);

		// modifcation operation
		var propModifyOper;
		if (chargeModified || radicalModified)
		{
			propModifyOper = new Kekule.ChemObjOperation.Modify(node, modifiedData, this.getEditor());
			result.push(propModifyOper);
		}

		return result;
	}
});

// register
Kekule.Editor.IaControllerManager.register(Kekule.Editor.MolNodeChargeIaController, Kekule.Editor.ChemSpaceEditor);


})();