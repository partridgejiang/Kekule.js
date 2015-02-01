/**
 * @fileoverview
 * Operations for property modifications in object inspector.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /widgets/operation/kekule.operations.js
 * requires /widgets/advCtrls/objInspector/kekule.widget.propEditors.js
 * requires /localization/
 */

(function(){
"use strict"

/**
 * Operation of change a property by property editor in object inspector.
 * @class
 * @augments Kekule.Operation
 *
 * @param {Kekule.PropertyEditor.BaseEditor} propEditor Target property editor.
 * @param {Variant} newValue New value set to property editor.
 * @param {Variant} oldValue Old value of property.
 *
 * @property {Kekule.PropertyEditor.BaseEditor} propEditor Target property editor.
 * @property {Variant} newValue New value set to property editor.
 * @property {Variant} oldValue Old value of property.
 *   If not set, this value will be caculated automatically when setting new value.
 */
Kekule.Widget.PropEditorModifyOperation = Class.create(Kekule.Operation,
/** @lends Kekule.Widget.PropEditorModifyOperation# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.PropEditorModifyOperation',
	/** @constructs */
	initialize: function($super, propEditor, newValue, oldValue)
	{
		$super();
		this.setPropEditor(propEditor);
		this.setNewValue(newValue);
		this.setOldValue(oldValue);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('propEditor', {'dataType': 'Kekule.PropertyEditor.BaseEditor', 'serializable': false});
		this.defineProp('newValue', {'dataType': DataType.VARIANT, 'serializable': false});
		this.defineProp('oldValue', {'dataType': DataType.VARIANT, 'serializable': false});
	},
	/** @private */
	doExecute: function()
	{
		var propEditor = this.getPropEditor();
		if (this.getOldValue() === undefined)
			this.setOldValue(propEditor.getValue());
		propEditor.setValue(this.getNewValue());
	},
	/** @private */
	doReverse: function()
	{
		this.getPropEditor().setValue(this.getOldValue());
	}
});

})();