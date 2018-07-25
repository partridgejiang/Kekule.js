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
		if (target && targets.length)
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
 * Base modifier class to change render options in editor.
 * @class
 * @augments Kekule.Editor.ObjModifier.Base
 *
 * @property {Array} targetObjs Objects that selected in editor and can be modified by this modifier.
 * @property {Kekule.Widget.BaseWidget} widget The concrete modifier widget.
 */
Kekule.Editor.ObjModifier.BaseRenderOptionModifier = Class.create(Kekule.Editor.ObjModifier.Base,
/** @lends Kekule.Editor.ObjModifier.BaseRenderOptionModifier# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ObjModifier.BaseRenderOptionModifier',
	/**
	 * Returns common render option or render 3D option value of chemObjs.
	 * If values in objects are not same, null will be returned.
	 * @param {Array} chemObjs
	 * @param {String} stylePropName
	 * @param {Bool} is3DOption
	 * @returns {Variant}
	 * @private
	 */
	getRenderOptionValue: function(chemObjs, stylePropName, is3DOption)
	{
		return Kekule.Render.RenderOptionUtils.getCascadeRenderOptionValueOfObjs(chemObjs, stylePropName, is3DOption);
	}
});

/**
 * A coor modifier to change the render color of chem object.
 * @class
 * @augments Kekule.Editor.ObjModifier.BaseRenderOptionModifier
 */
Kekule.Editor.ObjModifier.Color = Class.create(Kekule.Editor.ObjModifier.BaseRenderOptionModifier,
/** @lends Kekule.Editor.ObjModifier.Color# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ObjModifier.Color',
	/**
	 * @private
	 * @ignore
	 */
	ATOM_COLOR_SPECIAL_VALUE_INFO: {
		text: Kekule.$L('ChemWidgetTexts.HINT_USE_ATOM_CUSTOM_COLOR'),
		value: 'Atom',
		className: CNS.COLORPICKER_SPEC_COLOR_MIXED
	},
	/** @private */
	initProperties: function()
	{
		// private
		this.defineProp('colorBox', {
			'dataType': 'Kekule.Widget.BaseWidget', 'serializable': false, 'setter': null
		});
	},
	/** @ignore */
	doCreateWidget: function()
	{
		var colorBox = new Kekule.Widget.ColorDropButton(this.getEditor());
		colorBox.setHint(Kekule.$L('ChemWidgetTexts.HINT_PICK_COLOR'));
		colorBox.setShowText(false);
		colorBox.setSpecialColors([Kekule.Widget.ColorPicker.SpecialColors.UNSET, this.ATOM_COLOR_SPECIAL_VALUE_INFO]);
		colorBox.addClassName(CCNS.COMPOSER_COLOR_BOX);
		this.setPropStoreFieldValue('colorBox', colorBox);
		return colorBox;
	},
	/** @ignore */
	doLoadFromTargets: function(editor, targets)
	{
		if (targets && targets.length)
		{
			var colorBox = this.getColorBox();
			if (colorBox)
			{
				var color;
				var useAtomSpecified = this.getRenderOptionValue(targets, 'useAtomSpecifiedColor');
				var color = this.getRenderOptionValue(targets, 'color');
				//console.log('load value', useAtomSpecified, color);
				if (useAtomSpecified)
				{
					color = this.ATOM_COLOR_SPECIAL_VALUE_INFO.value;
					colorBox.setColorClassName(this.ATOM_COLOR_SPECIAL_VALUE_INFO.className);
					colorBox.setValue(color);
				}
				else  //if (color)
				{
					colorBox.setColorClassName(null);
					colorBox.setValue(color);
				}
			}
		}
	},
	/** @ignore */
	doApplyToTargets: function($super, editor, targets)
	{
		// do not use operation, as we can call editor.modifyObjectsRenderOptions directly
		var color = this.getWidget().getValue();
		if (color === this.ATOM_COLOR_SPECIAL_VALUE_INFO.value)
		{
			editor.modifyObjectsRenderOptions(targets, {'useAtomSpecifiedColor': true, 'color': undefined}, false, true);
		}
		else
		{
			if (color == Kekule.Widget.ColorPicker.SpecialColors.UNSET)
				color = undefined;
			editor.modifyObjectsRenderOptions(targets, {'useAtomSpecifiedColor': false, 'color': color}, false, true);
		}
	}
});

/**
 * Manager Object of All obj modifiers.
 * @type {Object}
 */
Kekule.Editor.ObjModifierManager = {
	_modifierMap: new Kekule.MapEx(true),
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
	getModifierClasses: function(objClass)
	{
		var result = OMM._modifierMap.get(objClass) || [];
		var superClass = ClassEx.getSuperClass(objClass);
		if (superClass)
			AU.pushUnique(result, OMM.getModifierClasses(superClass));
		return result;
	}
};

// register existed modifiers
var OMM = Kekule.Editor.ObjModifierManager;
OMM.register(Kekule.ChemObject, [Kekule.Editor.ObjModifier.Color]);


})();