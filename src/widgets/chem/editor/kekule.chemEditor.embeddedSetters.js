/**
 * @fileoverview
 * Widgets to modify a chem object in an in-place way in chem editor.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /widgets/kekule.widget.base.js
 * requires /widgets/kekule.widget.buttons.js
 * requires /widgets/kekule.chemEditor.baseEditor.js
 * requires /widgets/operation/kekule.operations.js
 */


(function(){
"use strict";

/** @ignore */
Kekule.ChemWidget.HtmlClassNames = Object.extend(Kekule.ChemWidget.HtmlClassNames, {
	CHEMEDITOR_ATOM_SETTER: 'K-ChemEditor-Atom-Setter',
	CHEMEDITOR_TEXT_SETTER: 'K-ChemEditor-Text-Setter',
	CHEMEDITOR_FORMULA_SETTER: 'K-ChemEditor-Formula-Setter',
	CHEMEDITOR_CHEM_CONDITION_SETTER: 'K-ChemEditor-ChemCondition-Setter'
});

var AU = Kekule.ArrayUtils;
var CE = Kekule.Editor;
var CNS = Kekule.Widget.HtmlClassNames;
var CCNS = Kekule.ChemWidget.HtmlClassNames;
var BNS = Kekule.ChemWidget.ComponentWidgetNames;

/**
 * A Util class to manage all embedded setters in an editor.
 * @class
 */
Kekule.Editor.EmbeddedSetterHolder = Class.create(ObjectEx,
/** @lends Kekule.Editor.EmbeddedSetterHolder# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.EmbeddedSetterHolder',
	/** @construct */
	initialize: function(editor)
	{
		this.tryApplySuper('initialize');
		this.setPropStoreFieldValue('editor', editor);
		this.setPropStoreFieldValue('setterInstanceMap', new Kekule.MapEx(true));
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('editor', {
			'dataType': 'Kekule.Editor.BaseEditor', 'serializable': false, 'setter': null
		});
		// private
		this.defineProp('setterInstanceMap', {
			'dataType': DataType.OBJECT, 'serializable': false, 'setter': null
		});
	},
	/** @ignore */
	finalize: function()
	{
		var map = this.getSetterInstanceMap();
		var instances = map.getValues() || [];
		for (var i = 0, l = instances.length; i < l; ++i)
		{
			var inst = instances[i];
			if (inst)
				inst.finalize();
		}
		map.finalize();
		this.tryApplySuper('finalize');
	},

	/**
	 * Returns a setter instance according to setterClass.
	 * @param {ClassEx} setterClass
	 * @param {Bool} doNotAutoCreate
	 * @returns {Kekule.Editor.EmbeddedSetter.Base}
	 */
	getSetter: function(setterClass, doNotAutoCreate)
	{
		var map = this.getSetterInstanceMap();
		var result = map.get(setterClass);
		if (!result && !doNotAutoCreate)
		{
			result = new setterClass(this.getEditor());
			map.set(setterClass, result);
		}
		return result;
	}
});

ClassEx.defineProp(Kekule.Editor.BaseEditor, 'embeddedSetterHolder', {
	'dataType': 'Kekule.Editor.EmbeddedSetterHolder', 'serializable': false, 'setter': null,
	'getter': function()
	{
		var result = this.getPropStoreFieldValue('embeddedSetterHolder');
		if (!result)
		{
			result = new Kekule.Editor.EmbeddedSetterHolder(this);
			this.setPropStoreFieldValue('embeddedSetterHolder', result);
		}
		return result;
	}
});

ClassEx.extendMethods(Kekule.Editor.BaseEditor, {
	getEmbeddedSetter: function ($origin, setterClass) {
		return this.getEmbeddedSetterHolder().getSetter(setterClass);
	}
});

Kekule.Editor.EmbeddedSetterManager = {
	_setterRegistryItems: [],

	register: function(setterClass, targetObjClasses)
	{
		var objClasses = Kekule.ArrayUtils.toArray(targetObjClasses);
		for (var i = 0, l = objClasses.length; i < l; ++i)
		{
			ESM._setterRegistryItems.push({
				'setter': setterClass,
				'target': objClasses[i]
			});
		}
	},
	unregister: function(setterClass, targetObjClasses)
	{
		var items = ESM._setterRegistryItems;
		var objClasses = Kekule.ArrayUtils.toArray(targetObjClasses);
		for (var i = 0, l = objClasses.length; i < l; ++i)
		{
			for (var j = items.length - 1; j >= 0; --j)
			{
				if (items[j].setter === setterClass && items[j].target === objClasses[i])
				{
					items.splice(j, 1);
					break;
				}
			}
		}
	},

	getDefaultSetterClassesForObjectClass: function(objClass)
	{
		var result = [];
		var items = ESM._setterRegistryItems;
		for (var i = items.length - 1; i >= 0; --i)
		{
			if (items[i].target === objClass || ClassEx.isDescendantOf(objClass, items[i].target))
				result.push(items[i].setter);
		}
		return result;
	},

	getDefaultSetterClassForObject: function(obj) {

		var candidates = (obj && ESM.getDefaultSetterClassesForObjectClass(obj.getClass())) || [];
		if (!candidates.length)
			return null;
		else
		{
			for (var i = 0, l = candidates.length; i < l; ++i)
			{
				var result = candidates[i];
				if (!result.isValidTarget || result.isValidTarget(obj))
					return result;
			}
			return null;
		}
	}
};

var ESM = Kekule.Editor.EmbeddedSetterManager;

/**
 * Base namespace of all embedded setters.
 * @namespace
 */
Kekule.Editor.EmbeddedSetter = {};

/**
 * Base class of embedded setters for chem editor.
 * @class
 * @augments ObjectEx
 *
 * @param {Kekule.Editor.BaseEditor} editor
 *
 * @property {Kekule.Editor.BaseEditor} editor
 * @property {Kekule.ChemObject} targetObj The object to be modified.
 * @property {Kekule.Widget.BaseWidget} widget The concrete setter widget.
 */
Kekule.Editor.EmbeddedSetter.Base = Class.create(ObjectEx,
/** @lends Kekule.Editor.EmbeddedSetter.Base# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ObjModifier.Base',
	/** @construct */
	initialize: function(editor)
	{
		this.tryApplySuper('initialize');
		this.setPropStoreFieldValue('editor', editor);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('editor', {
			'dataType': 'Kekule.Editor.BaseEditor', 'serializable': false, 'setter': null,
		});
	},

	/** @private */
	getEditorConfigs: function()
	{
		return this.getEditor().getEditorConfigs();
	},

	/**
	 * Indicating whether this setter can be used to modify several objects simultaneously in editor.
	 * Descendants may override this method.
	 * @returns {Bool}
	 */
	getAllowSettingMultiObjs: function()
	{
		return false;
	},
	/**
	 * Indicating whether this setter can be used to create new object in editor.
	 * Descendants may override this method.
	 * @returns {Bool}
	 */
	getAllowCreateNewObj: function()
	{
		return false;
	},

	/** @private */
	getBaseCoordOfObjs: function(objs)
	{
		var objCount = objs.length;
		if (objCount) {
			var sumCoord = {};
			for (var i = 0; i < objCount; ++i) {
				var coord = this.getEditor().getObjectScreenCoord(objs[i]);
				sumCoord = Kekule.CoordUtils.add(sumCoord, coord);
			}
			var baseCoord = Kekule.CoordUtils.divide(sumCoord, objCount);
			return baseCoord;
		}
		return null;
	},
	/**
	 * Open the setter widget to modify the targetObjs
	 * @param {Array} targetObjs
	 * @param {Hash} invokeCoord
	 * @param {Func} callback callback(applied, modifiedObjs, extraData)
	 */
	execute: function(targetObjs, invokeCoord, callback)
	{
		var objs;
		if (!targetObjs)  // no object provided, may be need to create new object?
		{
			objs = null;
			if (!this.getAllowCreateNewObj())
				return false;
		}
		else
		{
			objs = Kekule.ArrayUtils.toArray(targetObjs);
			objs = this.getAllowSettingMultiObjs()? objs : [objs[0]];
		}

		var baseCoord = objs? this.getBaseCoordOfObjs(objs): invokeCoord;

		this._currTargetObjs = objs;
		this._currExecuteCallback = callback;
		return this.doExecute(objs, baseCoord, callback);
	},

	/**
	 * Do the actual work of execute method.
	 * Descendants should override this method.
	 * @param {Array} targetObjs
	 * @param {Hash} baseCoord
	 * @private
	 */
	doExecute: function(targetObjs, baseCoord, callback)
	{
		// do nothing here
	},

	/**
	 * Notify the modification or target objects is done or cancelled.
	 * @param {Bool} applied
	 * @param {Array} modifiedObjs
	 * @param {Variant} extraData extra data, set by each type of embedded setters.
	 */
	notifyModificationResult: function(applied, modifiedObjs, extraData)
	{
		if (this._currExecuteCallback)
		{
			if (applied && !modifiedObjs)
				modifiedObjs = this._currTargetObjs;
			this._currExecuteCallback(applied, modifiedObjs, extraData);
		}
	},
});

/**
 * Embedded setter to change atom in molecule.
 * @class
 * @augments Kekule.Editor.EmbeddedSetter.Base
 */
Kekule.Editor.EmbeddedSetter.MolAtom = Class.create(Kekule.Editor.EmbeddedSetter.Base,
/** @lends Kekule.Editor.EmbeddedSetter.MolAtom# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.EmbeddedSetter.MolAtom',
	/** @construct */
	initialize: function(editor)
	{
		this.tryApplySuper('initialize', [editor]);
		this._createNonAtomLabelInfos();
		this._setterShown = false;  // use internally
	},
	finalize: function()
	{
		if (this.getAtomSetter())
			this.getAtomSetter().finalize();
		this.tryApplySuper('finalize');
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('enableCondensedFormula', {
			'dataType': DataType.BOOL,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('enableCondensedFormula');
				if (result === undefined || result === null)
				{
					// not set yet, use the editor config
					result = this.getEditorConfigs().getStructureConfigs().getEnableCreateMoleculeFromCondensedFormula();
				}
				return result;
			}
		});
		this.defineProp('forceCondensedFormulaErrorCheck', {'dataType': DataType.BOOL});
		this.defineProp('condensedFormulaAtomSymbolWhitelist', {'dataType': DataType.ARRAY});
		this.defineProp('repositorySubgroupItems', {'dataType': DataType.ARRAY, 'serializable': false});

		this.defineProp('currAtom', {'dataType': DataType.OBJECT, 'serializable': false});  // private
		this.defineProp('nonAtomLabelInfos', {'dataType': DataType.ARRAY, 'serializable': false});  // private
		this.defineProp('atomSetter', {
			'dataType': DataType.OBJECT, 'serializable': false,
			'setter': function(value)
			{
				var old = this.getAtomSetter();
				if (old)
					this.unbindAtomSetter(old);
				this.setPropStoreFieldValue('atomSetter', value);
				if (value)
					this.bindAtomSetter(value);
			}
		});  // private
	},

	/** @private */
	canInteractWithObj: function(obj)
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
		// return (obj instanceof Kekule.ChemStructureNode) && !(obj instanceof Kekule.StructureFragment && obj.isStandalone());
		return Kekule.Editor.EmbeddedSetter.MolAtom.isValidTarget(obj);
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
	bindAtomSetter: function(atomSetterWidget)
	{
		this._initAtomSetterWidgetSettings(atomSetterWidget);
		this._setAtomSetterEventListener(atomSetterWidget, true);
	},
	/** @private */
	unbindAtomSetter: function(atomSetterWidget)
	{
		this._setAtomSetterEventListener(atomSetterWidget, false);
	},
	/** @private */
	_createAtomSetterWidget: function(doc, parentElem)
	{
		var result = new Kekule.ChemWidget.StructureNodeSetter(this.getEditor());
		result.setUseDropDownSelectPanel(true);
		//this._initAtomSetterWidgetSettings(result);
		result.appendToElem(parentElem);

		return result;
	},
	/** @private */
	_initAtomSetterWidgetSettings: function(widget)
	{
		widget.addClassName(CCNS.CHEMEDITOR_ATOM_SETTER);

		if (widget.setSelectableInfos)
		{
			var listAtoms = AU.clone(this.getEditor().getEditorConfigs().getStructureConfigs().getPrimaryOrgChemAtoms());
			listAtoms.push('...');  // add periodic table item
			//result.setSelectableElementSymbols(listAtoms);
			// non-atom nodes
			var nonAtomLabelInfos = this.getNonAtomLabelInfos();
			//result.setSelectableNonElementInfos(nonAtomLabelInfos);
			// subgroups
			//result.setSelectableSubGroupRepItems(Kekule.Editor.StoredSubgroupRepositoryItem2D.getAllRepItems());

			widget.setSelectableInfos({
				'elementSymbols': listAtoms,
				'nonElementInfos': nonAtomLabelInfos,
				'subGroupRepItems': Kekule.Editor.StoredSubgroupRepositoryItem2D.getAllRepItems()
			});
		}
	},
	/** @private */
	_setAtomSetterEventListener: function(widget, isBind)
	{
		// react to value change of setter
		//var self = this;
		/*
        widget.addEventListener('keyup', function(e)
            {
                var ev = e.htmlEvent;
                if (ev.getKeyCode() === Kekule.X.Event.KeyCode.ENTER)
                {
                    self.applySetter(widget);
                    widget.dismiss();  // avoid call apply setter twice
                }
            }
        );

		widget.addEventListener('valueChange', function(e){
			//var data = e.value;
			//console.log(e.target, e.currentTarget);
			if (self.getAtomSetter() && self.getAtomSetter().isShown())
			{
				self.applySetter(widget);
				widget.dismiss();  // avoid call apply setter twice
			}
		});

		widget.addEventListener('showStateChange', function(e)
			{
				if (e.target === widget && !e.byDomChange)
				{
					//console.log('show state change', e);
					if (!e.isShown && !e.isDismissed)  // widget hidden, feedback the edited value
					{
						if (self.getAtomSetter() && self.getAtomSetter().isShown())
							self.applySetter(widget);
					}
				}
			}
		);
		*/
		if (!isBind)
		{
			widget.removeEventListener('valueChange', this._reactAtomSetterValueChange, this);
			widget.removeEventListener('showStateChange', this._reactAtomSetterShowStateChange, this);
		}
		else
		{
			widget.addEventListener('valueChange', this._reactAtomSetterValueChange, this);
			widget.addEventListener('showStateChange', this._reactAtomSetterShowStateChange, this);
		}
	},

	/** @private */
	_reactAtomSetterValueChange: function(e)
	{
		var widget = this.getAtomSetter();
		if (widget && widget.isShown())
		{
			if (e.value)  // ensure there is actual changes
			{
				this.applySetter(widget);
				this.notifyModificationResult(true, null);
			}
			widget.dismiss();  // avoid call apply setter twice
		}
	},
	/** @private */
	_reactAtomSetterShowStateChange: function(e)
	{
		var widget = this.getAtomSetter();
		if (e.target === widget && !e.byDomChange)
		{
			if (!e.isShown && !e.isDismissed)  // widget hidden, feedback the edited value
			{
				/*
				if (widget && widget.isShown())
					this.applySetter(widget);
				*/
				this.notifyModificationResult(false);
			}
		}
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
		setter.setEnableCondensedFormula(this.getEnableCondensedFormula());
		setter.setForceCondensedFormulaErrorCheck(this.getForceCondensedFormulaErrorCheck());
		setter.setCondensedFormulaAtomSymbolWhitelist(this.getCondensedFormulaAtomSymbolWhitelist());
		setter.setRepositorySubgroupItems(this.getRepositorySubgroupItems());
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
		//inputBox.getElement().style.fontSize = fontSize + 'px';
		if (setter.setNodeInputBoxFontSize)
			setter.setNodeInputBoxFontSize(fontSize + 'px');
		/*
		 style.marginTop = -posAdjust + 'px';
		 style.marginLeft = -posAdjust + 'px';
		 */
		//setter.show();
		setter._applied = false;
		setter.setStandaloneOnShowHide(true);
		setter.show(this.getEditor(), null, Kekule.Widget.ShowHideType.POPUP);

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

		var operation = Kekule.Editor.OperationUtils.createNodeModificationOperationFromData(atom, newData, this.getEditor());
		if (operation)  // only execute when there is real modification
		{
			var editor = this.getEditor();
			editor.beginManipulateAndUpdateObject();
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
				editor.endManipulateAndUpdateObject();
			}

			if (editor && editor.getEnableOperHistory() && operation)
			{
				editor.pushOperation(operation);
			}
		}
	},

	/** @ignore */
    doExecute: function(targetObjs, baseCoord, callback)
    {
		// only consider one object
        this.openSetterUi(baseCoord, targetObjs[0]);
    }
});

/** @ignore */
Kekule.Editor.EmbeddedSetter.MolAtom.isValidTarget = function(obj)
{
	return (obj instanceof Kekule.ChemStructureNode) && !(obj instanceof Kekule.StructureFragment && obj.isStandalone());
};

/**
 * Base embedded to setter to add or edit a block-based object in document.
 * This class is the ancestor of several concrete setter classes, and should not be used directly.
 * @class
 * @augments Kekule.Editor.EmbeddedSetter.Base
 */
Kekule.Editor.EmbeddedSetter.CreatableBlock = Class.create(Kekule.Editor.EmbeddedSetter.Base,
/** @lends Kekule.Editor.EmbeddedSetter.CreatableBlock# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.EmbeddedSetter.CreatableBlock',
	/** @construct */
	initialize: function(editor)
	{
		this.tryApplySuper('initialize', [editor]);
		this._operAddObj = null;  // private
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('currObj', {'dataType': DataType.OBJECT, 'serializable': false});  // private
		this.defineProp('setterWidget', {'dataType': DataType.OBJECT, 'serializable': false});  // private
	},

	/** @ignore */
	getAllowCreateNewObj: function()
	{
		return true;
	},

	/**
	 * Check if obj is a valid object and can be edited.
	 * Descendants should override this method.
	 * @param {Kekule.ChemObject} obj
	 * @returns {Bool}
	 * @private
	 */
	isValidObj: function(obj)
	{
		return true;
	},

	/**
	 * Check if new object can be inserted into editor.
	 * Descendants should override this method.
	 * @param chemspace
	 * @param coord
	 * @private
	 */
	canCreateNewObj: function(chemSpace, coord)
	{
		var editor = this.getEditor();
		return editor.canCreateNewChild();
	},

	/**
	 * Create new object in editor.
	 * Descendants should override this method
	 * @param chemSpace
	 * @param coord
	 * @private
	 */
	doCreateNewObj: function(chemSpace, coord)
	{
		// do nothing here
	},

	/** @private */
	createNewObj: function(chemSpace, coord)
	{
		var result;
		var editor = this.getEditor();

		if (!this.canCreateNewObj())
			return null;

		editor.beginUpdateObject();
		try
		{
			if (!result)
				result = this.doCreateNewObj(chemSpace, coord);
			chemSpace.appendChild(result);
			// editor.setObjectScreenCoord(result, coord);
			var addOperation = new Kekule.ChemObjOperation.Add(result, chemSpace, null, editor);
			this._operAddObj = addOperation;
		}
		finally
		{
			editor.endUpdateObject();
		}
		return result;
	},

	/** @private */
	retrieveSetterWidget: function(canCreate)
	{
		var result = this.getSetterWidget();
		if (!result && canCreate)  // create new one
		{
			var parentElem = this.getEditor().getCoreElement();
			var doc = parentElem.ownerDocument;
			result = this.createSetterWidget(doc, parentElem);
			this.setSetterWidget(result);
		}
		return result;
	},
	/** @private */
	createSetterWidget: function(doc, parentElem)
	{
		var result = this.doCreateSetterWidget(doc, parentElem, this.getEditor());  // new Kekule.Widget.TextBox(this.getEditor());

		result.appendToElem(parentElem);

		// default event handler
		var self = this;
		/*
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
		*/
		result.addEventListener('showStateChange', function(e)
			{
				//console.log('show state change', e.isShown, e.isDismissed, e.byDomChange);
				if (!e.byDomChange)
				{
					if (!e.isShown && e.isDismissed)
					{
						self.notifyModificationResult(false);
					}
					else if (!e.isShown && !e.isDismissed)  // widget hidden, feedback the edited value
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

	/**
	 * Create a new setter widget.
	 * Descendants should override this method.
	 * @param doc
	 * @param parentElem
	 */
	doCreateSetterWidget: function(doc, parentElem, parentWidget)
	{
		// do nothing here
	},

	/**
	 * Returns the modified values of current setter widget, those values need to be applied to target object.
	 * If this function returns null, the target object need to be removed from editor.
	 * Descendants should override this method.
	 * @param widget
	 * @returns {Object}
	 */
	getSetterWidgetModifiedValues: function(widget)
	{
		return null;
	},

	/** @private */
	needToModifyObj: function(obj, modifiedValues)
	{
		// ensure the property is really modified
		var needDoModification = false;
		var propNames = Object.getOwnPropertyNames(modifiedValues);
		for (var i = 0, l = propNames.length; i < l; ++i)
		{
			var propName = propNames[i];
			if (obj.hasProperty(propName) && obj.getPropValue(propName) !== modifiedValues[propName]) {
				needDoModification = true;
				break;
			}
		}
		return needDoModification;
	},

	/** @private */
	createTargetObjRemoveOper: function(obj)
	{
		return new Kekule.ChemObjOperation.Remove(obj, obj.getParent(), null, this.getEditor());
	},
	/** @private */
	createTargetObjModifyOper: function(obj, modifiedValues)
	{
		return new Kekule.ChemObjOperation.Modify(obj, modifiedValues, this.getEditor());
	},

	/** @private */
	cancelSetter: function()
	{
		if (this._operAddObj)  // already created new formula, remove it
		{
			this._operAddObj.reverse();
			this._operAddObj = null;
		}
	},

	/** @private */
	applySetter: function(setter, obj)
	{
		if (setter._applied)   // avoid call twice
			return;

		if (!obj)
			obj = this.getCurrObj();

		var modifiedValues = this.getSetterWidgetModifiedValues(setter);
		var oper;
		// var text = setter.getText();
		// if (!text)  // no input, delete
		if (!modifiedValues)
		{
			if (this._operAddObj)  // new object just added to space
				this.cancelSetter();
			else  // old one, delete it
			{
				oper = this.createTargetObjRemoveOper(obj);
			}
		}
		else
		{
			// ensure the property is really modified
			var needDoModification = this.needToModifyObj(obj, modifiedValues);
			if (needDoModification)
				oper = this.createTargetObjModifyOper(obj, modifiedValues); // new Kekule.ChemObjOperation.Modify(obj.getFormula(), {'text': text}, this.getEditor());
		}

		var editor = this.getEditor();
		if (editor && oper)
		{
			editor.beginManipulateAndUpdateObject();
			try
			{
				oper.execute();
				if (editor.getEnableOperHistory())
				{
					if (this._operAddObj)
					{
						var group = new Kekule.MacroOperation();
						group.add(this._operAddObj);
						group.add(oper);
						editor.pushOperation(group);
						this._operAddObj = null;
					}
					else
						editor.pushOperation(oper);

					this.notifyModificationResult(true,[obj]);
				}
			}
			finally
			{
				editor.endManipulateAndUpdateObject();
			}
		}

		setter._applied = true;
	},
	/**
	 * Open setter widget in coord.
	 * @param {Hash} coord
	 * @param {Object} obj
	 * @private
	 */
	openSetterUi: function(coord, obj)
	{
		var oldSetter = this.getSetterWidget();
		if (oldSetter && oldSetter.isShown())  // has an old setter
		{
			this.applySetter(oldSetter, this.getCurrObj());
			// oldSetter.hide();
			oldSetter._haltPrevShowHideProcess();
		}

		if (!obj)  // need create new
			obj = this.createNewObj(this.getEditor().getChemObj(), coord);

		if (!this.isValidObj(obj))
			return;
		this.setCurrObj(obj);

		this.getEditor().setSelection([obj]);

		var setter = this.retrieveSetterWidget(true);

		var parentElem = this.getEditor().getCoreElement();
		setter.appendToElem(parentElem);  // ensure setter widget is a child of parentElem, since popup show may change the parent each time

		var style = setter.getElement().style;
		style.position = 'absolute';
		style.left = coord.x + 'px';
		style.top = coord.y + 'px';
		// style.fontSize = fontSize + 'px';
		// style.fontFamily = fontName;
		/*
		 style.marginTop = -posAdjust + 'px';
		 style.marginLeft = -posAdjust + 'px';
		 */
		setter._applied = false;
		setter.setStandaloneOnShowHide(true);

		this.prepareOpeningSetterUi(setter, obj, coord);

		setter.show(this.getEditor(), null, Kekule.Widget.ShowHideType.POPUP);

		var self = this;
		(function() {
			self.afterOpeningSetterUi(setter, obj, coord);
		}).defer();
	},

	/**
	 * Descendants should override this.
	 * @param setterWidget
	 * @param targetObj
	 * @param baseCoord
	 * @private
	 */
	prepareOpeningSetterUi: function(setterWidget, targetObj, baseCoord)
	{
		// do nothing here
	},
	/**
	 * Descendants should override this.
	 * @param setterWidget
	 * @param targetObj
	 * @param baseCoord
	 * @private
	 */
	afterOpeningSetterUi: function(setterWidget, targetObj, baseCoord)
	{
		// do nothing here
	},


	/** @ignore */
	doExecute: function(targetObjs, baseCoord, callback)
	{
		// defer the open process, ensure it be called after the hide event of old setter widget
		var self = this;
		(function() {
			// only consider one object
			self.openSetterUi(baseCoord, targetObjs && targetObjs[0]);
		}).defer();
	}
});



/**
 * Embedded to setter to add or edit formula based molecule in document.
 * @class
 * @augments Kekule.Editor.EmbeddedSetter.CreatableBlock
 *
 * @property {Bool} enableCondensedFormula Whether condensed formula text input is allowed.
 */
Kekule.Editor.EmbeddedSetter.Formula = Class.create(Kekule.Editor.EmbeddedSetter.CreatableBlock,
/** @lends Kekule.Editor.EmbeddedSetter.Formula# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.EmbeddedSetter.Formula',
	/** @construct */
	initialize: function(editor)
	{
		this.tryApplySuper('initialize', [editor]);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('enableCondensedFormula', {
			'dataType': DataType.BOOL,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('enableCondensedFormula');
				if (result === undefined || result === null)
				{
					// not set yet, use the editor config
					result = this.getEditorConfigs().getStructureConfigs().getEnableCreateMoleculeFromCondensedFormula();
				}
				return result;
			}
		});
		this.defineProp('forceCondensedFormulaErrorCheck', {'dataType': DataType.BOOL});
		this.defineProp('condensedFormulaAtomSymbolWhitelist', {'dataType': DataType.ARRAY});
		this.defineProp('repositorySubgroupItems', {'dataType': DataType.ARRAY, 'serializable': false});
	},

	/** @ignore */
	isValidObj: function(obj)
	{
		return Kekule.Editor.EmbeddedSetter.Formula.isValidTarget(obj);
	},

	/**
	 * Returns plain text of formula that shows in text setter.
	 * @param {Kekule.StructureFragment} mol
	 * @returns {String}
	 * @private
	 */
	getFormulaText: function(mol)
	{
		//return mol.hasFormula()? mol.getFormula().getText(): '';
		return mol.getDisplayLabelText();
	},

	/** @ignore */
	canCreateNewObj: function(chemSpace, coord)
	{
		var result = this.tryApplySuper('canCreateNewObj', [chemSpace, coord]);
		if (!result)
		{
			var mol = this.getEditor().getOnlyOneBlankStructFragment();
			result = !!mol;
		}
		return result;
	},
	/** @ignore */
	doCreateNewObj: function(chemSpace, coord)
	{
		var result;
		var editor = this.getEditor();
		if (!editor.canCreateNewChild())
		{
			result = this.getEditor().getOnlyOneBlankStructFragment();
		}
		else
		{
			result = new Kekule.Molecule();
		}
		editor.setObjectScreenCoord(result, coord);
		result.getFormula(true);  // create a forumla
		return result;
	},

	/** @ignore */
	doCreateSetterWidget: function(doc, parentElem, parentWidget)
	{
		var result = new Kekule.Widget.Container(this.getEditor());
		result.addClassName(CCNS.CHEMEDITOR_FORMULA_SETTER);
		result.setDisplayed(false);
		result.appendToElem(parentElem)

		var inputter = new Kekule.Widget.TextBox(result);

		// event handler
		var self = this;
		inputter.addEventListener('keyup', function(e)
			{
				var ev = e.htmlEvent;
				var keyCode = ev.getKeyCode();
				if (keyCode === Kekule.X.Event.KeyCode.ENTER)  // enter
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
		return result;
	},

	/** @ignore */
	getSetterWidgetModifiedValues: function(widget)
	{
		var result = null;
		var formulaText = widget.getChildWidgets()[0].getValue();
		if (formulaText)
		{
			var isCondensedFormulaEnabled = this.getEnableCondensedFormula();
			if (isCondensedFormulaEnabled)
			{
				// try parsing the condensed formula first
				try
				{
					var subgroupItems = this.getRepositorySubgroupItems() || Kekule.Editor.RepositoryData.subGroups;
					var options = {
						structure: true, /*formula: true,*/ richText: true, structureClass: Kekule.SubGroup,
						atomSymbolWhitelist: this.getCondensedFormulaAtomSymbolWhitelist(),
					};  // create subgroup, not molecule, and at last add subgroup to existing molecule
					var parseResult = Kekule.CondensedFormulaUtils.parse(formulaText, 0, subgroupItems, options);
					if (parseResult && parseResult.structure)  // condensed formula parse successful, using it
					{
						//parseResult.structure.setFormula(parseResult.formula);
						parseResult.structure.setCustomRtLabel(parseResult.richText);
						parseResult.structure.setExpanded(false);  // hide the ctab, only showing formula
						// console.log(formulaText, parseResult.structure, Kekule.Render.ChemDisplayTextUtils.formulaToRichText(parseResult.formula));
						result = {'isCondensedFormula': true, 'formulaText': formulaText, 'rtLabel': parseResult.richText, 'structure': parseResult.structure /*, 'formula': parseResult.formula*/};
					}
				}
				catch(e)
				{
					if (this.getForceCondensedFormulaErrorCheck() && Kekule.CondensedFormulaUtils.guessFormulaTextType(formulaText) === 'condensed')
						Kekule.error(e);
					// else
					// ignore condensed formula parse error
				}
			}

			if (!result)   // using the normal formula
			{
				result = {'isCondensedFormula': false, 'formulaText': formulaText};
			}
		}
		return result;
	},
	/** @private */
	needToModifyObj: function(obj, modifiedValues) {
		// return this.applySuper('needToModifyObj', [obj.getFormula(), {'text': modifiedValues.formulaText}]);
		var oldFormulaText = this.getFormulaText(obj);
		return oldFormulaText !== modifiedValues.formulaText;
	},

	/** @ignore */
	createTargetObjModifyOper: function(obj, modifiedValues)
	{
		if (modifiedValues.isCondensedFormula)
		{
			return this._doCreateCondensedFormulaModifyOper(obj, modifiedValues);
		}
		else
		{
			return this._doCreateFormulaModifyOper(obj, modifiedValues);
		}
	},
	/** @private */
	_doCreateCondensedFormulaModifyOper: function(obj, modifiedValues)
	{
		var newSubgroup = modifiedValues.structure;
		var formulaTextModifyOper;
		if (newSubgroup.hasProperty('formulaText'))
			formulaTextModifyOper = new Kekule.ChemObjOperation.Modify(obj, {'formulaText': modifiedValues.formulaText}, this.getEditor());
		else if (newSubgroup.hasProperty('formula'))
			formulaTextModifyOper = new Kekule.ChemObjOperation.Modify(obj.getFormula(), {'text': modifiedValues.formulaText}, this.getEditor());
		var result = new Kekule.MacroOperation([
			new Kekule.ChemStructOperation.ClearCtab(obj, this.getEditor()),
			new Kekule.ChemStructOperation.AddNode(newSubgroup, obj, null, this.getEditor()),
			formulaTextModifyOper,
			new Kekule.ChemObjOperation.ModifyRenderOptions(obj, {
				'expanded': false,
				'customRtLabel': modifiedValues.rtLabel
			}, false, this.getEditor()),  // ensure the ctab of mol is hidden
			//new Kekule.ChemObjOperation.Modify(obj, {'formula': modifiedValues.formula}, this.getEditor()),
			// new Kekule.ChemObjOperation.Modify(obj.getFormula(), {'text': modifiedValues.formulaText}, this.getEditor()),
		]);
		return result;
	},
	/** @private */
	_doCreateFormulaModifyOper: function(obj, modifiedValues)
	{
		return new Kekule.MacroOperation([
			new Kekule.ChemStructOperation.ClearCtab(obj, this.getEditor()),   // clear the existing ctab structure first
			new Kekule.ChemObjOperation.Modify(obj.getFormula(), {'text': modifiedValues.formulaText}, this.getEditor()),
			new Kekule.ChemObjOperation.ModifyRenderOptions(obj, {
				'customRtLabel': null
			}, false, this.getEditor()),  // clear the rtLabel to display the formula
		]);
	},

	/** @ignore */
	prepareOpeningSetterUi: function(setterWidget, targetObj, baseCoord)
	{
		var mol = targetObj;
		var fontSize = mol.getCascadedRenderOption('fontSize') || this.getEditor().getEditorConfigs().getInteractionConfigs().getAtomSetterFontSize();
		fontSize *= this.getEditor().getZoom() || 1;
		var fontName = mol.getCascadedRenderOption('fontFamily') || '';
		//var posAdjust = fontSize / 1.5;  // adjust position to align to atom center
		var text = this.getFormulaText(mol);
		var slabel = text || '';

		setterWidget.getChildWidgets()[0].setValue(slabel);

		var style = setterWidget.getElement().style;
		style.fontSize = fontSize + 'px';
		style.fontFamily = fontName;
	},
	/** @ignore */
	afterOpeningSetterUi: function(setterWidget, targetObj, baseCoord)
	{
		var inputter = setterWidget.getChildWidgets()[0];
		inputter.selectAll();
		inputter.focus();
	}
});

/** @ignore */
Kekule.Editor.EmbeddedSetter.Formula.isValidTarget = function(obj)
{
	// must be the top most structure fragment can be applied
	var parent = obj.getParent()
	return (!(parent instanceof Kekule.StructureFragment)) && (obj instanceof Kekule.StructureFragment) && obj.isLabelExposed(); // && obj.hasFormula() && obj.isFormulaExposed(); // !obj.hasCtab();
};


/**
 * Embedded to setter to add or edit chem condition symbol in document.
 * @class
 * @augments Kekule.Editor.EmbeddedSetter.CreatableBlock
 */
Kekule.Editor.EmbeddedSetter.ChemConditionSymbol = Class.create(Kekule.Editor.EmbeddedSetter.CreatableBlock,
/** @lends Kekule.Editor.EmbeddedSetter.ChemConditionSymbol# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.EmbeddedSetter.ChemConditionSymbol',

	/** @ignore */
	isValidObj: function(obj)
	{
		return Kekule.Editor.EmbeddedSetter.ChemConditionSymbol.isValidTarget(obj);
	},

	/** @ignore */
	doCreateNewObj: function(chemSpace, coord)
	{
		var editor = this.getEditor();
		var result = new Kekule.Glyph.ChemConditionSymbol();
		editor.setObjectScreenCoord(result, coord);

		return result;
	},

	/**
	 * Returns condition text of symbol.
	 * @param {Kekule.ChemConditionSymbol} symbol
	 * @returns {String}
	 * @private
	 */
	getConditionText: function(symbol)
	{
		return symbol.getText();
	},

	/** @private */
	doCreateSetterWidget: function(doc, parentElem)
	{
		var configs = this.getEditorConfigs().getChemConditionSetterConfigs();

		var result = new Kekule.Widget.Container(this.getEditor());
		result.addClassName(CCNS.CHEMEDITOR_CHEM_CONDITION_SETTER);
		result.setDisplayed(false);
		result.appendToElem(parentElem)

		var conditionInputter = new Kekule.ChemWidget.ChemConditionComboBox(result); // new Kekule.Widget.ComboBox(result);
		// conditionInputter.addClassName(CCNS.CHEMEDITOR_CHEM_CONDITION_SETTER);
		// conditionInputter.setDisplayed(false);
		// conditionInputter.appendToElem(parentElem);
		this.doApplyConditionInputterConfigs(conditionInputter);

		// event handler
		var self = this;
		conditionInputter.addEventListener('keyup', function(e)
			{
				var ev = e.htmlEvent;
				var keyCode = ev.getKeyCode();
				if ((keyCode === Kekule.X.Event.KeyCode.ENTER))
				{
					self.applySetter(result);
					result.dismiss();  // avoid call apply setter twice
				}
				else if (keyCode === Kekule.X.Event.KeyCode.ESC)  // ESC, cancel editor
				{
					conditionInputter.dismiss();
					self.cancelSetter();
				}
			}
		);
		conditionInputter.addEventListener('valueSelect', function(e)
			{
				self.applySetter(result);
				result.dismiss();  // avoid call apply setter twice
			});
		return result;
	},
	/** @private */
	doApplyConditionInputterConfigs(inputter)
	{
		var configs = this.getEditorConfigs().getChemConditionSetterConfigs();
		inputter.setItems(configs.getListedChemConditions());
		inputter.setEnableCustom(configs.getEnableCustomCondition());
	},

	/** @ignore */
	getSetterWidgetModifiedValues: function(widget)
	{
		var condText = widget.getChildWidgets()[0].getConditionText();
		// var isCustomCondition = widget.getChildWidgets()[0].getIsCustom();
		if (!condText)  // empty string, actually need to remove this symbol
			return null;
		/*
		if (isCustomCondition)
			return {'text': condValue};
		else
			return {'condition': condValue};
		*/
		return {'text': condText};
	},

	/** @ignore */
	createTargetObjModifyOper: function(obj, modifiedValues)
	{
		return new Kekule.ChemObjOperation.Modify(obj, modifiedValues, this.getEditor());
	},

	/** @ignore */
	prepareOpeningSetterUi: function(setterWidget, targetObj, baseCoord)
	{
		var fontSize = targetObj.getCascadedRenderOption('fontSize') || this.getEditor().getEditorConfigs().getInteractionConfigs().getAtomSetterFontSize();
		fontSize *= (this.getEditor().getZoom() || 1);
		var fontName = targetObj.getCascadedRenderOption('fontFamily') || '';
		//var posAdjust = fontSize / 1.5;  // adjust position to align to atom center
		var text = this.getConditionText(targetObj);

		var configs = this.getEditorConfigs().getChemConditionSetterConfigs();
		var conditionInputter = setterWidget.getChildWidgets()[0];
		this.doApplyConditionInputterConfigs(conditionInputter);
		conditionInputter.setConditionText(text || '');
		// var sPlaceholder = text || Kekule.$L('ChemWidgetTexts.CAPTION_TEXTBLOCK_INIT');
		// setterWidget.setPlaceholder(sPlaceholder);

		var style = setterWidget.getElement().style;
		style.position = 'absolute';
		style.fontSize = fontSize + 'px';
		style.fontFamily = fontName;
		style.opacity = 1;
	},
	/** @ignore */
	afterOpeningSetterUi: function(setterWidget, targetObj, baseCoord)
	{
		var inputter = setterWidget.getChildWidgets()[0];
		inputter.selectAll();
		inputter.focus();
	}
});

/** @ignore */
Kekule.Editor.EmbeddedSetter.ChemConditionSymbol.isValidTarget = function(obj)
{
	return obj instanceof Kekule.Glyph.ChemConditionSymbol;
};



/**
 * Embedded to setter to add or edit text block in document.
 * @class
 * @augments Kekule.Editor.EmbeddedSetter.CreatableBlock
 */
Kekule.Editor.EmbeddedSetter.TextBlock = Class.create(Kekule.Editor.EmbeddedSetter.CreatableBlock,
/** @lends Kekule.Editor.EmbeddedSetter.TextBlock# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.EmbeddedSetter.TextBlock',
	/** @construct */
	initialize: function(editor)
	{
		this.tryApplySuper('initialize', [editor]);
	},

	/** @ignore */
	isValidObj: function(obj)
	{
		return Kekule.Editor.EmbeddedSetter.TextBlock.isValidTarget(obj);
		// return obj instanceof Kekule.TextBlock;
	},

	/** @ignore */
	doCreateNewObj: function(chemSpace, coord)
	{
		var editor = this.getEditor();
		var result = new Kekule.TextBlock();
		editor.setObjectScreenCoord(result, coord, Kekule.Render.CoordPos.CORNER_TL);

		return result;
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

	/** @private */
	doCreateSetterWidget: function(doc, parentElem)
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
		return result;
	},

	/** @ignore */
	getSetterWidgetModifiedValues: function(widget)
	{
		var value = widget.getValue();
		return value? {'text': widget.getValue()}: null;
	},

	/** @ignore */
	createTargetObjModifyOper: function(obj, modifiedValues)
	{
		return new Kekule.ChemObjOperation.Modify(obj, modifiedValues, this.getEditor());
	},

	/** @ignore */
	prepareOpeningSetterUi: function(setterWidget, targetObj, baseCoord)
	{
		// calculate the top-left position of block
		var setterCoord = this.getEditor().getObjectScreenCoord(targetObj, Kekule.Render.CoordPos.CORNER_TL);

		var fontSize = targetObj.getCascadedRenderOption('fontSize') || this.getEditor().getEditorConfigs().getInteractionConfigs().getAtomSetterFontSize();
		fontSize *= (this.getEditor().getZoom() || 1);
		var fontName = targetObj.getCascadedRenderOption('fontFamily') || '';
		//var posAdjust = fontSize / 1.5;  // adjust position to align to atom center
		var text = this.getBlockText(targetObj);

		setterWidget.setValue(text || '');
		var sPlaceholder = text || Kekule.$L('ChemWidgetTexts.CAPTION_TEXTBLOCK_INIT');
		setterWidget.setPlaceholder(sPlaceholder);

		var style = setterWidget.getElement().style;
		style.position = 'absolute';
		style.fontSize = fontSize + 'px';
		style.left = setterCoord.x + 'px';
		style.top = setterCoord.y + 'px';
		style.fontFamily = fontName;
		style.opacity = 1;
	},
	/** @ignore */
	afterOpeningSetterUi: function(setterWidget, targetObj, baseCoord)
	{
		setterWidget.selectAll();
		setterWidget.focus();
	}
});

/** @ignore */
Kekule.Editor.EmbeddedSetter.TextBlock.isValidTarget = function(obj)
{
	return obj instanceof Kekule.TextBlock;
};

/**
 * Embedded to setter to add or edit image block in document.
 * @class
 * @augments Kekule.Editor.EmbeddedSetter.Base
 */
Kekule.Editor.EmbeddedSetter.ImageBlock = Class.create(Kekule.Editor.EmbeddedSetter.Base,
/** @lends Kekule.Editor.EmbeddedSetter.ImageBlock# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.EmbeddedSetter.ImageBlock',
	/** @construct */
	initialize: function(editor)
	{
		this.tryApplySuper('initialize', [editor]);
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
		this.defineProp('currBlock', {'dataType': DataType.OBJECT, 'serializable': false});  // private
	},

	/** @ignore */
	getAllowCreateNewObj: function()
	{
		return true;
	},

	/**
	 * Check if obj is a valid text block and can be edited.
	 * @param {Kekule.ChemObject} obj
	 * @returns {Bool}
	 * @private
	 */
	isValidBlock: function(obj)
	{
		return Kekule.Editor.EmbeddedSetter.ImageBlock.isValidTarget(obj);
		// return obj instanceof Kekule.ImageBlock;
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
						editor.beginManipulateAndUpdateObject();
						try
						{
							oper.execute();
							if (editor && editor.getEnableOperHistory())
								editor.pushOperation(oper);

							self.notifyModificationResult(true, [self.getCurrBlock()]);
						}
						finally
						{
							editor.endManipulateAndUpdateObject();
						}
					}
				}).defer();  // execute later, get accurate image size
			});

			reader.addEventListener('error', function(e){
				self.notifyModificationResult(false);
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
	doExecute: function(targetObjs, baseCoord, callback)
	{
		var block = targetObjs && targetObjs[0];
		this.setCurrBlock(block);
		this._currCoord = baseCoord;
		this._actionOpenFile.execute(this.getEditor());
	}
});

/** @ignore */
Kekule.Editor.EmbeddedSetter.ImageBlock.isValidTarget = function(obj)
{
	return obj instanceof Kekule.ImageBlock;
};



var EmbeddedSetter = Kekule.Editor.EmbeddedSetter;

ESM.register(EmbeddedSetter.MolAtom, [Kekule.ChemStructureNode]);
ESM.register(EmbeddedSetter.Formula, [Kekule.StructureFragment]);
ESM.register(EmbeddedSetter.TextBlock, [Kekule.TextBlock]);
ESM.register(EmbeddedSetter.ImageBlock, [Kekule.ImageBlock]);
ESM.register(EmbeddedSetter.ChemConditionSymbol, [Kekule.Glyph.ChemConditionSymbol]);

})();
