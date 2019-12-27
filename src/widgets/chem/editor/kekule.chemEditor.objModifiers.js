/**
 * @fileoverview
 * Widgets to modify an chem object in a user friendly way in chem editor.
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

var AU = Kekule.ArrayUtils;
var CE = Kekule.Editor;
var CNS = Kekule.Widget.HtmlClassNames;
var CCNS = Kekule.ChemWidget.HtmlClassNames;
var BNS = Kekule.ChemWidget.ComponentWidgetNames;

/**
 * Base namespace of all object modifiers.
 * @namespace
 */
Kekule.Editor.ObjModifier = {};

/**
 * Enumeration of obj modifier type.
 * Each obj modifier class should have a class method getCategories returns an array of these types.
 * @enum
 */
Kekule.Editor.ObjModifier.Category = {
	/** Gneral popurse modifiers. **/
	GENERAL: 'general',
	/** Modifiers related to chem structure (e.g., bond, atom). **/
	CHEM_STRUCTURE: 'chemStruct',
	/** Modifiers related to chem document glyphs. **/
	GLYPH: 'glyph',
	/** Modifiers related to render styles. **/
	STYLE: 'style',
	/** Misc modifiers. **/
	MISC: 'misc'
};

/**
 * A special object to create widget to modify an chem object in a user friendly way in chem editor.
 * @class
 * @augments ObjectEx
 *
 * @param {Kekule.Editor.BaseEditor} editor
 *
 * @property {Kekule.Editor.BaseEditor} editor
 * @property {Array} targetObjs Objects that selected in editor and can be modified by this modifier.
 * @property {Kekule.Widget.BaseWidget} widget The concrete modifier widget.
 */
Kekule.Editor.ObjModifier.Base = Class.create(ObjectEx,
/** @lends Kekule.Editor.ObjModifier.Base# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ObjModifier.Base',
	/** @construct */
	initialize: function($super, editor)
	{
		$super();
		this.setEditor(editor);
		this.modifierWidgetValueChangedBind = this.modifierWidgetValueChanged.bind(this);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('editor', {
			'dataType': 'Kekule.Editor.BaseEditor', 'serializable': false
		});
		this.defineProp('targetObjs', {
			'dataType': DataType.ARRAY, 'serializable': false,
			'getter': function()
			{
				return this.getEditor().getSelection();
			}
		});
		this.defineProp('widget', {
			'dataType': 'Kekule.Widget.BaseWidget', 'serializable': false,
			'setter': null,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('widget');
				if (!result)
				{
					result = this.createWidget();
					this.setPropStoreFieldValue('widget', result);
				}
				return result;
			}
		});
	},

	/** @private */
	getEditorConfigs: function()
	{
		return this.getEditor().getEditorConfigs();
	},

	/**
	 * Returns a name that represent this modifier.
	 * Descendants may override this method.
	 */
	getModifierName: function()
	{
		return this.getClassLocalName().toLowerCase();
	},
	/**
	 * Create the modifier widget.
	 * @returns {Kekule.Widget.BaseWidget}
	 * @private
	 */
	createWidget: function()
	{
		var result = this.doCreateWidget();
		if (result)
			this.installValueChangeEventHandler(result);  // listen to value change event, changing properties of objects in editor
		return result;
	},
	/**
	 * Do the actual work of createWidget method.
	 * Descendants should override this method.
	 * @returns {Kekule.Widget.BaseWidget}
	 * @private
	 */
	doCreateWidget: function()
	{
		return null;  // do nothing here
	},

	/**
	 * Listen to value change event, changing properties of objects in editor.
	 * The default approach is listen to 'valueChange' event, which is suitable for form controls.
	 * descendants may override this method to listen to other events.
	 * @private
	 */
	installValueChangeEventHandler: function(widget)
	{
		widget.on('valueChange', this.modifierWidgetValueChangedBind);
	},
	/**
	 * Called whether modifier widget is changed and the changes should be applied to target objects in editor.
	 */
	modifierWidgetValueChanged: function()
	{
		this.applyToTargets();
	},

	/**
	 * Load corresponding value from targets, update the outlook of modifier widget.
	 */
	loadFromTargets:function()
	{
		var editor = this.getEditor();
		if (editor)
		{
			var targets = this.getTargetObjs();
			if (targets)
				this.doLoadFromTargets(editor, targets);
		}
		return this;
	},
	/**
	 * Do actual work of loadFromTargets method.
	 * Descendants must override this method.
	 * @param {Kekule.Editor.BaseEditor} editor
	 * @param {Array} targets Target objects.
	 * @private
	 */
	doLoadFromTargets: function(editor, targets)
	{
		// do nothing here
	},
	/**
	 * Change properties of target objects based on this widget.
	 */
	applyToTargets: function()
	{
		//console.log('applyToTargets');
		var editor = this.getEditor();
		if (editor)
		{
			var targets = this.getTargetObjs();
			if (targets)
				this.doApplyToTargets(editor, targets);
		}
		return this;
	},
	/**
	 * Do actual work of applyToTargets method.
	 * Descendants may override this method.
	 * @param {Kekule.Editor.BaseEditor} editor
	 * @param {Array} targets Target objects.
	 * @private
	 */
	doApplyToTargets: function(editor, targets)
	{
		var oper = this.createModificationOper();
		if (oper)
			editor.execOperation(oper);
	},
	/**
	 * Create operation to change all target objects based on this widget.
	 * @param {Array} targets Target objects.
	 * @returns {Kekule.Operation}
	 * @private
	 */
	createModificationOper: function(targets)
	{
		var operations = [];
		if (targets && targets.length)
		{
			for (var i = 0, l = targets.length; i < l; ++i)
			{
				var oper = this.createModificationOperOnTarget(targets[i]);
				if (oper)
					operations.push(oper);
			}
		}
		var operCount = operations.length;
		if (operCount <= 0)
			return null;
		else if (operCount === 1)
			return operations[0];
		else  // create macro operation
			return new Kekule.MacroOperation(operations);
	},
	/**
	 * Create a instance of {@link Kekule.ChemObjOperation.Modify} to modify targetObj.
	 * Descendants may override this method.
	 * @param {Kekule.ChemObject} targetObj
	 * @param {Hash} newPropValues
	 * @returns {Kekule.Operation}
	 * @private
	 */
	createModificationOperOnTarget: function(targetObj)
	{
		var modifiedPropValues = this.getModifiedPropValues();
		if (modifiedPropValues)
			return this.createModificationOperation(targetObj, modifiedPropValues);
		else
			return null;
	},
	/**
	 * Returns changed property values for target objects.
	 * Descendants may override this method.
	 * @returns {Hash}
	 * @private
	 */
	getModifiedPropValues: function()
	{
		return null;
	},
	/**
	 * Create a instance of {@link Kekule.ChemObjOperation.Modify} to modify targetObj.
	 * Descendants may override this method.
	 * @param {Kekule.ChemObject} targetObj
	 * @param {Hash} newPropValues
	 * @returns {Kekule.Operation}
	 * @private
	 */
	createModificationOperation: function(targetObj, newPropValues)
	{
		return new Kekule.ChemObjOperation.Modify(targetObj, newPropValues, this.getEditor());
	}
});

/**
 * Manager Object of All obj modifiers.
 * @type {Object}
 */
Kekule.Editor.ObjModifierManager = {
	/** @private */
	_modifierMap: new Kekule.MapEx(true),
	/**
	 * Register new modifier class(es).
	 * @param {Array} objClasses Classes of object these modifiers can be applied.
	 * @param {Variant} modifierClasses Registered modifier class or classes.
	 */
	register: function(objClasses, modifierClasses)
	{
		if (!modifierClasses || !objClasses)
			return;
		var mClasses = AU.toArray(modifierClasses);
		var oClasses = AU.toArray(objClasses);
		for (var i = 0, l = oClasses.length; i < l; ++i)
		{
			var objClass = oClasses[i];
			var mapItem = OMM._modifierMap.get(objClass);
			if (!mapItem)
			{
				mapItem = mClasses;
				OMM._modifierMap.set(objClass, mapItem);
			}
			else
				AU.pushUnique(mapItem, mClasses);
		}
	},
	/**
	 * Unregister modifier class(es).
	 * @param {Variant} modifierClasses Unregistered modifier class or classes.
	 */
	unregister: function(modifierClasses)
	{
		if (!modifierClasses)
			return;
		var mClasses = AU.toArray(modifierClasses);
		{
			var objClasses = OMM._modifierMap.getKeys();
			for (var i = 0, l = objClasses.length; i < l; ++i)
			{
				var mapItem = OMM._modifierMap.get(objClasses[i]);
				if (mapItem && mapItem.length)
					OMM._modifierMap.set(objClasses[i], AU.exclude(mapItem, mClasses));
			}
		}
	},
	/**
	 * Returns the categores of a modifier class (and its ancestors).
	 * @param {Class} modifierClass
	 */
	getModifierCategories: function(modifierClass)
	{
		var result = (modifierClass.getCategories && modifierClass.getCategories()) || [];
		var superClass = ClassEx.getSuperClass(modifierClass);
		if (superClass)
			AU.pushUnique(result, OMM.getModifierCategories(superClass));
		return result;
	},
	/**
	 * Returns available modifier classes for objClass.
	 * @param {Class} objClass
	 * @param {Array} allowedCategories Optional, if set, only modifiers of thoses categories will be returned.
	 * @returns {Array}
	 */
	getModifierClasses: function(objClass, allowedCategories)
	{
		var result = OMM._modifierMap.get(objClass) || [];
		var superClass = ClassEx.getSuperClass(objClass);
		if (superClass)
			AU.pushUnique(result, OMM.getModifierClasses(superClass, allowedCategories));
		if (allowedCategories && allowedCategories.length)  // check categories
		{
			var modifierClasses = result;
			result = [];
			for (var i = 0, l = modifierClasses.length; i < l; ++i)
			{
				var modifierCategories = OMM.getModifierCategories(modifierClasses[i]);
				if (AU.intersect(modifierCategories, allowedCategories).length)
					result.push(modifierClasses[i]);
			}
		}
		return result;
	}
};

var OMM = Kekule.Editor.ObjModifierManager;

})();