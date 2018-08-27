/**
 * @fileoverview
 * Object modifier to change the render styles of objects in chem editor.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /widgets/kekule.widget.base.js
 * requires /widgets/commonCtrls/kekule.widget.buttons.js
 * requires /widgets/chem/editor/kekule.chemEditor.baseEditor.js
 * requires /widgets/chem/editor/kekule.chemEditor.objModifiers.js
 */

(function(){
"use strict";

var AU = Kekule.ArrayUtils;
var CE = Kekule.Editor;
var CNS = Kekule.Widget.HtmlClassNames;
var CCNS = Kekule.ChemWidget.HtmlClassNames;
var BNS = Kekule.ChemWidget.ComponentWidgetNames;

/**
 * Base modifier class to change render options in editor.
 * @class
 * @augments Kekule.Editor.ObjModifier.Base
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
/** @ignore */
Kekule.Editor.ObjModifier.BaseRenderOptionModifier.getCategories = function()
{
	return [Kekule.Editor.ObjModifier.Category.STYLE];
};

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

// register existed modifiers
var OMM = Kekule.Editor.ObjModifierManager;
OMM.register(Kekule.ChemObject, [Kekule.Editor.ObjModifier.Color]);

})();