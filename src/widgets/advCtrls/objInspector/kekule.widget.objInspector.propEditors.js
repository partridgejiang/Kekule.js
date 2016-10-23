/**
 * @fileoverview
 * Implementation of some basic property editor for object inspector.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /widgets/kekule.widget.base.js
 * requires /widgets/commonCtrls/kekule.widget.formControls.js
 * requires /widgets/advCtrls/kekule.widget.colorPickers.js
 */

(function(){

"use strict";

var AU = Kekule.ArrayUtils;

/**
 * Namespace for all property editors.
 * @namespace
 */
Kekule.Widget.PropertyEditor = {};
/**
 * Shortcur for {@link Kekule.Widget.PropertyEditor.}
 * @namespace
 */
Kekule.PropertyEditor = Kekule.Widget.PropertyEditor;


/**
 * Property editor is association object to edit property row in
 * object inspector (similar to Delphi's property editor).
 * This is the base class of all property editors, containing a series of methods
 * that can be overrided to implement different styles of editors.
 * @class
 * @augments ObjectEx
 *
 * @property {Array} objects Objects currently been edited in object inspector and this property editor.
 * @property {Object} propInfo Information object of current property.
 * @property {Variant} propName Name of current property. Readonly.
 *   Usually it is a string, but it may also be a int index when object is an array.
 * @property {Variant} propType Type of current property. Readonly.
 * //@property {Variant} originalValue Old value of property.
 * @property {Kekule.PropertyEditor.BaseEditor} parentEditor Parent property editor.
 *   This property usually should be set by expandable parent editor. When child property is modified,
 *   child will notify parent that the property has been changed.
 * @property {Int} valueTextMode Value from {@link Kekule.Widget.ValueListEditor.ValueDisplayMode}.
 *   Simple or JSON, different value may cause different output text in object inspector.
 * @property {Bool} readOnly Whether this editor is read only. If this value is set to null or undefined,
 *   actual read only value will be calculated automatically based on property info.
 * @property {Bool} allowEmpty Whether property value can be set to null when value text is set to ''.
 *   Note that the effect of this property need to be implemented in concrete editor classes,
 *   especially in saveEditValue method.
 */
Kekule.PropertyEditor.BaseEditor = Class.create(ObjectEx,
/** @lends Kekule.PropertyEditor.BaseEditor# */
{
	/** @private */
	CLASS_NAME: 'Kekule.PropertyEditor.BaseEditor',
	/** @constructs **/
	initialize: function($super)
	{
		$super();
		this._editWidget = null;
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('objects', {'dataType': DataType.ARRAY, 'serializable': false,
			'setter': function(value)
			{
				var AU = Kekule.ArrayUtils;
				this.setPropStoreFieldValue('objects', AU.clone(AU.toArray(value)));  // clone value to avoid the array be changed outside property editor
			}
		});
		this.defineProp('propertyInfo', {'dataType': DataType.OBJECT, 'serializable': false});  // can not use propInfo, or will conflict with ObjectEx.getPropInfo method
		this.defineProp('propertyName', {'dataType': DataType.VARIANT, 'serializable': false, 'setter': null,
			'getter': function()
			{
				var info = this.getPropertyInfo();
				return info? info.name: null;
			}
		});
		this.defineProp('propertyType', {'dataType': DataType.VARIANT, 'serializable': false, 'setter': null,
			'getter': function()
			{
				var info = this.getPropertyInfo();
				return info? info.dataType: null;
			}
		});
		this.defineProp('parentEditor', {'dataType': 'Kekule.PropertyEditor.BaseEditor', 'serializable': false});
		//this.defineProp('originalValue', {'dataType': DataType.VARIANT, 'serializable': false});
		this.defineProp('valueTextMode', {'dataType': DataType.INT});
		this.defineProp('readOnly', {'dataType': DataType.BOOL});
		this.defineProp('allowEmpty', {'dataType': DataType.BOOL});
	},
	/** @ignore */
	finalize: function($super)
	{
		this.finalizeWidget();
		$super();
	},
	/** @private */
	finalizeWidget: function()
	{
		if (this._editWidget)
		{
			this._editWidget.finalize();
			this._editWidget = null;
		}
	},
	/**
	 * Returns currently created edit widget.
	 * @returns {Kekule.Widget.BaseWidget}
	 */
	getEditWidget: function()
	{
		return this._editWidget;
	},

	/**
	 * Returns property or field value of object.
	 * @param {Object} obj A plain object or instance of ObjectEx.
	 * @param {String} propName If propName not set, obj itself will be returned.
	 * @returns {Variant}
	 * @private
	 */
	getObjPropValue: function(obj, propName)
	{
		if (Kekule.ObjUtils.isUnset(propName))
			return obj;
		if (obj instanceof ObjectEx)
		{
			return obj.getPropValue(propName);
		}
		else if (DataType.isArrayValue(obj))
		{
			return obj[propName];
		}
		else if (obj instanceof Object)
		{
			return obj[propName];
		}
		else
			return undefined;
	},
	/**
	 * Set property value to an object.
	 * @param {Object} obj A plain object or instance of ObjectEx.
	 * @param {String} propName
	 * @param {Variant} propValue
	 * @private
	 */
	setObjPropValue: function(obj, propName, propValue)
	{
		if (obj instanceof ObjectEx)
		{
			obj.setPropValue(propName, propValue);
		}
		else if (obj instanceof Object)
		{
			obj[propName] = propValue;
		}
		return this;
	},
	/**
	 * Returns property value of multiple objects.
	 * If all objects have the same property value, this value will be returned.
	 * Otherwise this method will return undefined.
	 * @param {Array} objects
	 * @param {String} propName If propName is not set, objects themselves will be returned.
	 * @returns {Variant}
	 * @private
	 */
	getObjsPropValue: function(objects, propName)
	{
		if (!objects) // || Kekule.ObjUtils.isUnset(propName))
			return undefined;
		if (Kekule.ObjUtils.isUnset(propName))
			return objects;
		var obj = objects[0];
		var result = this.getObjPropValue(obj, propName);
		for (var i = 1, l = objects.length; i < l; ++i)
		{
			var obj = objects[i];
			var value = this.getObjPropValue(obj, propName);
			if (value !== result)
				return undefined;
		}
		return result;
	},
	/**
	 * Set property value to multiple objects.
	 * @param {Array} objects
	 * @param {String} propName
	 * @param {Variant} propValue
	 * @private
	 */
	setObjsPropValue: function(objects, propName, propValue)
	{
		if (!objects || !propName)
			return this;
		for (var i = 0, l = objects.length; i < l; ++i)
		{
			var obj = objects[i];
			this.setObjPropValue(obj, propName, propValue);
		}
		return this;
	},

	/**
	 * Whether the editor is a read only one.
	 * @returns {Bool}
	 */
	isReadOnly: function()
	{
		return !!(this.getAttributes() & PEA.READONLY);
	},
	/**
	 * Whether the editor has sub property editors.
	 * @returns {Bool}
	 */
	hasSubPropertyEditors: function()
	{
		var attrib = this.getAttributes();
		return !!(attrib & PEA.SUBPROPS);
	},

	// The following method can be override by descendants to implement different style of editors.
	/**
	 * Returns attribute of editor. Different attribute causes different behavior and outlook in object inspector.
	 * Descendants may override this method.
	 * @returns {Int}
	 */
	getAttributes: function()
	{
		// default settings
		var result = PEA.MULTIOBJS | PEA.SIMPLEVALUE;
		var propInfo = this.getPropertyInfo();
		if (Kekule.ObjUtils.isUnset(this.getReadOnly()))
		{
			if (propInfo && !propInfo.setter)
				result = result | PEA.READONLY;
		}
		else if (this.getReadOnly())
			result = result | PEA.READONLY;

		return result;
	},
	/**
	 * Returns child property editors. This method will be used when SUBPROPS flag in property editor's attribute.
	 * In object inspector, rows will be expanded according to child property editors.
	 * Descendants may override this method.
	 * @param {Array} propScopes
	 * @returns {Array}
	 */
	getSubPropertyEditors: function(propScopes)
	{
		return null;
	},
	/**
	 * Returns property title to display in object inspector. Usually propInfo.title or propInfo.name.
	 * Descendants seldom need to override this method.
	 * @returns {String}
	 */
	getTitle: function()
	{
		var info = this.getPropertyInfo();
		if (info)
			return (info.title || info.name);
		else
			return '';
	},
	/**
	 * Returns property hint to display in object inspector. Usually this value is same with getTitle().
	 * Descendants seldom need to override this method.
	 * @returns {String}
	 */
	getHint: function()
	{
		return this.getTitle();
	},
	/**
	 * Returns property description. Usually propInfo.description.
	 * Descendants seldom need to override this method.
	 * @returns {String}
	 */
	getDescription: function()
	{
		var info = this.getPropertyInfo();
		return info.description;
	},
	/**
	 * Returns property value of all objects.
	 * Descendants may override this method.
	 * @returns {Variant}
	 */
	getValue: function()
	{
		return this.getObjsPropValue(this.getObjects(), this.getPropertyName());
	},
	/**
	 * Returns display text of property value.
	 * Descendants may override this method.
	 * @returns {String}
	 */
	getValueText: function()
	{
		var VDM = Kekule.Widget.ValueListEditor.ValueDisplayMode;
		var v = this.getValue();
		var mode = this.getValueTextMode();
		try
		{
			var result = (mode === VDM.JSON)? JSON.stringify(v):
				Kekule.ObjUtils.isUnset(v)? '': '' + v;
		}
		catch(e)  // sometimes error in conversion to JSON
		{
			return '' + v;
		}
		return result;
	},

	/**
	 * Save property value back to objects.
	 * @param {Variant} value
	 */
	setValue: function(value)
	{
		var result = this.setObjsPropValue(this.getObjects(), this.getPropertyName(), value);
		if (this.getParentEditor() && this.getParentEditor().notifyChildEditorValueChange)
		{
			this.getParentEditor().notifyChildEditorValueChange(this.getPropertyName(), value);
		}
		return result;
	},

	/**
	 * Create a custom edit widget and put old property value in it.
	 * @param {Kekule.Widget.BaseWidget} parentWidget
	 * @returns {Kekule.Widget.BaseWidget}
	 */
	createEditWidget: function(parentWidget)
	{
		var value = this.getValue();
		//this.setOriginalValue(value);
		var result = this.doCreateEditWidget(parentWidget, value);
		if (result && result.setIsDirty)
			result.setIsDirty(false);
		this._editWidget = result;
		return result;
	},
	/**
	 * Do actual work of createEditWidget.
	 * Descendants should override this method.
	 * @param {Kekule.Widget.BaseWidget} parentWidget
	 * //@param {Variant} propValue
	 * @returns {Kekule.Widget.BaseWidget}
	 */
	doCreateEditWidget: function(parentWidget)
	{
		// do nothing here
	},
	/*
	 * Returns modified value in edit widget. This value is about to save to property.
	 * @returns {Variant}
	 */
	/*
	getEditValue: function()
	{
		// do nothing here
	},
	*/
	/**
	 * Save edit value in edit widget back to property.
	 * If the original value is not changed, false should be returned. Else true should be returned.
	 * @returns {Variant}
	 */
	saveEditValue: function()
	{
		if (this._editWidget)
		{
			if (!this._editWidget.getIsDirty || this._editWidget.getIsDirty())
			{
				var result = this.doSaveEditValue();
				if (this._editWidget.setIsDirty)
					this._editWidget.setIsDirty(false);
				return result;
			}
			else
			{
				//console.log('not dirty', this.getClassName());
				return false;
			}
		}
		else
			return false;
	},
	/**
	 * Do actual job of saveEditValue. Descendant should override this method.
	 * @private
	 */
	doSaveEditValue: function()
	{

	},
	/**
	 * This method is called by child property editor (such as enum item editor) to notify the child property has been changed.
	 * @param fieldName
	 * @param fieldValue
	 */
	notifyChildEditorValueChange: function(fieldName, fieldValue)
	{
		// do nothing here
	}
	/*
	 * Raise popup dialog (or other widgets) to edit the property.
	 * Descendants may override this method.
	 */
	/*
	edit: function()
	{
		// do nothing here
	}
	*/
});

/**
 * Enumeration of attributes of property editor.
 * Different value can be combinated by OR operation.
 * @class
 */
Kekule.PropertyEditor.EditorAttributes = {
	/** Property can be edit when multiple objects is selected in object inspector. **/
	MULTIOBJS: 1,
	/** Property can be expand to multiple rows in object inspector (such as when property type is ObjectEx). */
	SUBPROPS: 2,
	/** Property value is simple and can be edited by a text box. */
	SIMPLEVALUE: 4,
	/** Show a drop down list and value can only be set from it. */
	VALUELIST: 8,
	/** Show a custom widget to edit property value. */
	CUSTOMEDIT: 16,
	/** Property value is read only and can not be edited. */
	READONLY: 32,
	/** Edit widget can be created inside object inspector row. */
	INLINE_EDIT: 128,
	/** Edit widget will be created as a drop down one after clicking a drop down button inside object inspector row. */
	DROP_EDIT: 256,
	/** Edit widget will be created as a popup dialog after clicking a ellipse button inside object inspector row. */
	POPUP_EDIT: 512
};
var PEA = Kekule.PropertyEditor.EditorAttributes;


/**
 * Property editor manager. This class is used to select most suitable property editor for a certain property
 * in object inspector.
 * @class
 */
Kekule.PropertyEditor.EditorMananger = Class.create(
/** @lends Kekule.PropertyEditor.EditorMananger# */
{
	/** @constructs */
	initialize: function()
	{
		this._registeredItems = [];
		this._defaultItems = [];
	},
	/**
	 * Register a property editor. Usually at least one of propType, objClass, propName and matchFunc param should be set.
	 *   If nothing is set, a default editor will be registered.
	 * @param {Class} editorClass Property editor class.
	 * @param {String} propType Type of property, value from {@link DataType}. Set null to match all types.
	 * @param {Class} objClass Target class. Property editor will only apply to properties in this class. Set null to match all classes.
	 * @param {String} propName Property name. Property editor will only apply to property with this name. Set null to match all property names.
	 * @param {Func} matchFunc A custom function to check if property editor matches on a property. The function is in the following form:
	 *     match(objClass, propInfo)
	 *   and should return a boolean result.
	 */
	register: function(editorClass, propType, objClass, propName, matchFunc)
	{
		var item = {
			'editorClass': editorClass,
			'propType': propType,
			'objClass': objClass,
			'propName': propName,
			'matchFunc': matchFunc
		};
		this._registeredItems.push(item);
		if (!propType && !objClass && !propName && !matchFunc)  // default editor
			this._defaultItems.push(item);
		return this;
	},
	/**
	 * Unregister a property editor.
	 * @param {Class} editorClass
	 */
	unregister: function(editorClass)
	{
		var items = this._registeredItems;
		for (var i = items.length - 1; i >= 0; --i)
		{
			var item = items[i];
			if (item.editorClass === editorClass)
				items.splice(i, 1);
		}
		var items = this._defaultItems;
		for (var i = items.length - 1; i >= 0; --i)
		{
			var item = items[i];
			if (item.editorClass === editorClass)
				items.splice(i, 1);
		}
		return this;
	},
	/** @private */
	_getDefaultItem: function()
	{
		var item = this._defaultItems;
		return item[item.length - 1];
	},

	/** @private */
	_getSuperiorItem: function(item1, item2)
	{
		var fields = ['matchFunc', 'propName', 'objClass', 'propType'];
		for (var i = 0, l = fields.length; i < l; ++i)
		{
			if (!!item1[fields] === !!item2[fields])
				continue;
			else
				return item1[fields]? item1: item2;
		}
		// all same
		return item1;
	},

	/** @private */
	_isMatchedPropType: function(srcType, targetType)
	{
		var result = (srcType === targetType);
		if (!result)
		{
			if (DataType.isObjectExType(srcType) && DataType.isObjectExType(targetType))
			{
				var classObj1 = ClassEx.findClass(srcType);
				var classObj2 = ClassEx.findClass(targetType);
				result = ClassEx.isOrIsDescendantOf(classObj1, classObj2);
			}
		}
		return result;
	},
	// The following test methods is used to select proper property editor.
	// These methods may returns three values:
	//   1: pass the test
	//   0: uncertain
	//   -1: test failed, the property editor is not suitable
	_testOnPropType: function(editorItem, propInfo)
	{
		if (!editorItem.propType || !propInfo.dataType)
			return 0;
		if (this._isMatchedPropType(propInfo.dataType, editorItem.propType))
			return 1;
		else
			return -1;
	},
	_testOnObjClass: function(editorItem, objClass)
	{
		if (!editorItem.objClass || !objClass)
			return 0;
		else if (ClassEx.isOrIsDescendantOf(objClass, editorItem.objClass))
			return 1;
		else
			return -1;
	},
	_testOnPropName: function(editorItem, propInfo)
	{
		if (!editorItem.propName || !propInfo.name)
			return 0;
		else if (editorItem.propName === propInfo.name)
			return 1;
		else
			return -1;
	},
	_testOnMatchFunc: function(editorItem, objClass, propInfo)
	{
		if (!editorItem.matchFunc)
			return 0;
		else if (editorItem.matchFunc(objClass, propInfo))
			return 1;
		else
			return -1;
	},
	/**
	 * Find a suitable property editor class based on objClass and propInfo.
	 * If nothing found, null will be returned.
	 * @param {Class} objClass
	 * @param {Object} propInfo
	 * @returns {Class}
	 */
	findEditorClass: function(objClass, propInfo)
	{
		var result = null;
		var items = this._registeredItems;
		var matched = false;
		var matches = [];
		for (var i = items.length - 1; i >= 0; --i)
		{
			var item = items[i];
			/*
			if (!propInfo.dataType)
				console.log(propInfo);
			*/
			/*
			matched = (!item.propType || this._isMatchedPropType(propInfo.dataType, item.propType))
				&& (!item.objClass || (ClassEx.isOrIsDescendantOf(objClass, item.objClass)))
				&& (!item.propName || (item.propName === propInfo.name))
				&& (!item.matchFunc || item.matchFunc(objClass, propInfo));
			*/
			var r1 = this._testOnPropType(item, propInfo);
			if (r1 < 0)  // failed
				continue;
			var r2 = this._testOnObjClass(item, objClass);
			if (r2 < 0)
				continue;
			var r3 = this._testOnPropName(item, propInfo);
			if (r3 < 0)
				continue;
			var r4 = this._testOnMatchFunc(item, objClass, propInfo);
			if (r4 < 0)
				continue;

			matched = (r1 + r2 + r3 + r4) > 0;

			if (matched)
			{
				if (result)  // check if the priority of previous found result and current one
					result = this._getSuperiorItem(result, item.editorClass);
				else
					result = item.editorClass;

				if (result && item.matchFunc)  // max superioty, can pass all reset comparations
					break;
			}
		}
		if (!result)
		{
			var item = this._getDefaultItem();
			result = item? item.editorClass: null;
		}

		return result;
	},
	/**
	 * Find a suitable property editor simply by property type and property name.
	 * This method is useful to find property editor for some simple type value (such as object, array element).
	 * @param {String} propType
	 * @param {String} propName
	 * @return {Class}
	 */
	findEditorClassForType: function(propType, propName)
	{
		var propInfo = {
			'dataType': propType,
			'name': propName
		};
		return this.findEditorClass(null, propInfo);
	}
});
Kekule.ClassUtils.makeSingleton(Kekule.PropertyEditor.EditorMananger);
/** @ignore */
Kekule.PropertyEditor.findEditorClass = Kekule.PropertyEditor.EditorMananger.getInstance().findEditorClass.bind(Kekule.PropertyEditor.EditorMananger.getInstance());
/** @ignore */
Kekule.PropertyEditor.findEditorClassForType = Kekule.PropertyEditor.EditorMananger.getInstance().findEditorClassForType.bind(Kekule.PropertyEditor.EditorMananger.getInstance());
/** @ignore */
Kekule.PropertyEditor.register = Kekule.PropertyEditor.EditorMananger.getInstance().register.bind(Kekule.PropertyEditor.EditorMananger.getInstance());
/** @ignore */
Kekule.PropertyEditor.unregister = Kekule.PropertyEditor.EditorMananger.getInstance().unregister.bind(Kekule.PropertyEditor.EditorMananger.getInstance());


/**
 * A simple property editor that use a text box to edit property value.
 * @class
 * @augments Kekule.PropertyEditor.BaseEditor
 */
Kekule.PropertyEditor.SimpleEditor = Class.create(Kekule.PropertyEditor.BaseEditor,
/** @lends Kekule.PropertyEditor.SimpleEditor# */
{
	/** @private */
	CLASS_NAME: 'Kekule.PropertyEditor.SimpleEditor',
	/**
	 * Convert string to proper value by targetType.
	 * @param {String} str
	 * @param {String} targetType Value from {@DataType}.
	 * @private
	 */
	convertStrToValue: function(str, targetType)
	{
		if (DataType.isSimpleType(targetType))
		{
			if (!str && this.getAllowEmpty())
				return null;
			else
				return Kekule.StrUtils.convertToType(str, targetType);
		}
		else  // can not convert
			return str;
	},

	/**
	 * Convert string into proper type of value and feedback to properties of objects.
	 * Descendants may override this method.
	 * @param {String} valueText
	 */
	setValueText: function(valueText)
	{
		if (valueText === this._originValueText)  // value has not been changed, do nothing
			return false;
		var value;
		var ptype = this.getPropertyType();
		if (ptype && !DataType.isSimpleType(ptype))  // can not set complex value, do nothing
			return false;
		if (ptype)  // type found, convert text to proper value
		{
			value = this.convertStrToValue(valueText, ptype);
		}
		else // type not found, set value directly
			value = valueText;
		//this.setObjsPropValue(this.getObjects(), this.getPropertyName(), value);
		this.setValue(value);
		return true;
	},

	// overided methods
	/** @ignore */
	doCreateEditWidget: function(parentWidget)
	{
		var text = this.getValueText();
		// save old text to compare with later edited value
		this._originValueText = text;
		var result = new Kekule.Widget.TextBox(parentWidget, text);
		return result;
	},
	/** @ignore */
	doSaveEditValue: function()
	{
		return this.setValueText(this.getEditWidget().getValue());
	}
});
Kekule.PropertyEditor.register(Kekule.PropertyEditor.SimpleEditor);  // register as default editor

/**
 * A property editor that use a text box to edit string property value.
 * An additional button is also create to popup a large text area to edit multiple strings.
 * @class
 * @augments Kekule.PropertyEditor.SimpleEditor
 */
Kekule.PropertyEditor.TextEditor = Class.create(Kekule.PropertyEditor.SimpleEditor,
/** @lends Kekule.PropertyEditor.TextEditor# */
{
	/** @private */
	CLASS_NAME: 'Kekule.PropertyEditor.TextEditor',
	/** @private */
	LINE_BREAK_REPLACER: '\\n',
	/** @private */
	textToSingleLine: function(text)
	{
		// since line break will be automatically removed in textbox, we need to replace them first
		return text.split('\n').join(this.LINE_BREAK_REPLACER);
	},
	/** @private */
	textToMultiLine: function(text)
	{
		//return text.replace(new RegExp(this.LINE_BREAK_REPLACER, 'g'), '\n');
		return text.split(this.LINE_BREAK_REPLACER).join('\n');
	},
	// overided methods
	/** @ignore */
	doCreateEditWidget: function(parentWidget)
	{
		this._parentWidget = parentWidget;
		var text = this.getValueText();
		// save old text to compare with later edited value
		this._originValueText = text;
		var result = new Kekule.Widget.ButtonTextBox(parentWidget, this.textToSingleLine(text));
		this._textbox = result;
		result.setButtonKind(Kekule.Widget.Button.Kinds.POPUP);
		result.addEventListener('buttonExecute', this.reactButtonExecute, this);
		return result;
	},
	/** @private */
	reactButtonExecute: function(e)
	{
		this.openPopupEditor();
	},
	/** @private */
	openPopupEditor: function()
	{
		var dialog = this._popupDialog;
		if (!dialog)
		{
			dialog = this.createPopupDialog();
			this._popupDialog = dialog;
		}
		var editor = this._popupEditor;
		editor.setValue(this.getValueText());
		var self = this;
		dialog.openPopup(function(result)
			{
				if (result === Kekule.Widget.DialogButtons.OK)  // feedback value
				{
					self._textbox.setValue(self.textToSingleLine(editor.getValue()));
					self._textbox.setIsDirty(true);
					//self._textbox.focus();
					self.saveEditValue();
				}
			}, this._textbox);
	},
	/** @private */
	createPopupDialog: function()
	{
		var doc = this._parentWidget.getDocument();
		var result = new Kekule.Widget.Dialog(
			doc,
			this.getPropertyName(),
			[Kekule.Widget.DialogButtons.OK, Kekule.Widget.DialogButtons.CANCEL]);
		result.setLocation(Kekule.Widget.Location.CENTER_OR_FULLFILL);

		var editorClass = /*Kekule.Widget.TextEditor ||*/ Kekule.Widget.TextArea;
		var textArea = new editorClass(doc); //new Kekule.Widget.TextArea(doc);
		var style = textArea.getElement().style;
		// TODO: currently fixed here
		style.width = '40em';
		style.height = '20em';
		textArea.appendToWidget(result);
		this._popupEditor = textArea;

		return result;
	},
	/** @ignore */
	doSaveEditValue: function()
	{
		var text = this.getEditWidget().getValue();
		text = this.textToMultiLine(text);
		if (text !== this._originValueText)
		{
			this.setValueText(text);
			return true;
		}
		else
		{
			return false;
		}
	}
});
Kekule.PropertyEditor.register(Kekule.PropertyEditor.TextEditor, DataType.STRING);

/**
 * A property editor that use a check box to edit boolean property value.
 * @class
 * @augments Kekule.PropertyEditor.BaseEditor
 */
Kekule.PropertyEditor.BoolEditor = Class.create(Kekule.PropertyEditor.BaseEditor,
/** @lends Kekule.PropertyEditor.BoolEditor# */
{
	/** @private */
	CLASS_NAME: 'Kekule.PropertyEditor.BoolEditor',

	/** @private */
	boolToStr: function(value)
	{
		return Kekule.StrUtils.boolToStr(value);
	},

	// overided methods
	/** @ignore */
	doCreateEditWidget: function(parentWidget)
	{
		// save old text to compare with later edited value
		this._originValue = this.getValue();
		var result = new Kekule.Widget.CheckBox(parentWidget, this._originValue);
		result.setText(this.boolToStr(this._originValue));
		var self = this;
		result.addEventListener('valueChange', function(e)
			{
				var value = result.getChecked();
				result.setText(self.boolToStr(value));
			}
		);
		return result;
	},
	/** @ignore */
	getValueText: function($super)
	{
		var v = this.getValue();
		if (Kekule.ObjUtils.isUnset(v))  // not true or false, value is undefined or null
			return Kekule.$L('WidgetTexts.S_VALUE_UNSET'); //Kekule.WidgetTexts.S_VALUE_UNSET;
		else
			return $super();
	},
	/** @ignore */
	doSaveEditValue: function()
	{
		var value = this.getEditWidget().getChecked();
		if (value !== this._originValue)
		{
			this.setValue(value);
			return true;
		}
		else
			return false;
	}
});
Kekule.PropertyEditor.register(Kekule.PropertyEditor.BoolEditor, DataType.BOOL);

/**
 * A property editor that use a select box to edit property value.
 * This is an abstract property editor, user should not use it directly.
 * @class
 * @augments Kekule.PropertyEditor.BaseEditor
 */
Kekule.PropertyEditor.SelectEditor = Class.create(Kekule.PropertyEditor.BaseEditor,
/** @lends Kekule.PropertyEditor.SelectEditor# */
{
	/** @private */
	CLASS_NAME: 'Kekule.PropertyEditor.SelectEditor',

	/** @ignore */
	getValueText: function($super)
	{
		var v = this.getValue();
		var items = this.getSelectItems() || [];
		for (var i = 0, l = items.length; i < l; ++i)
		{
			var item = items[i];
			if (item.value === v)
				return item.text;
		}
		return $super();
	},
	/**
	 * Returns items need to be shown in select box.
	 * Descendants need to override this method.
	 * @returns {Array}
	 * @private
	 */
	getSelectItems: function()
	{
		return [];
	},

	// overided methods
	/** @ignore */
	doCreateEditWidget: function(parentWidget)
	{
		var result = new Kekule.Widget.SelectBox(parentWidget, this.getSelectItems());
		this._originalValue = this.getValue();
		//console.log('set value', this._originalValue);
		result.setValue(this._originalValue);
		return result;
	},
	/** @ignore */
	doSaveEditValue: function()
	{
		var value = this.getEditWidget().getValue();
		if (value !== this._originalValue)
		{
			this.setValue(value);
			return true;
		}
		else
			return false;
	}
});

/**
 * A property editor that use a select box to edit enumeration value.
 * @class
 * @augments Kekule.PropertyEditor.SelectEditor
 *
 * //@property {Bool} allowUnsetValue If true, in list there will be a special item to set value "undefined" to property.
 */
Kekule.PropertyEditor.EnumEditor = Class.create(Kekule.PropertyEditor.SelectEditor,
/** @lends Kekule.PropertyEditor.EnumEditor# */
{
	/** @private */
	CLASS_NAME: 'Kekule.PropertyEditor.EnumEditor',
	/** @constructs */
	initialize: function($super)
	{
		$super();
		this.enumInfos = [];  // private field
	},
	/* @private */
	/*
	initProperties: function()
	{
		this.defineProp('allowUnsetValue', {'dataType': DataType.BOOL});
	},
	*/
	/** @ignore */
	setPropertyInfo: function($super, value)
	{
		$super(value);
		if (value)  // save enum info
		{
			var enumSrc = value.enumSource;
			if (enumSrc && DataType.isObjectValue(enumSrc))
			{
				var fields = Kekule.ObjUtils.getOwnedFieldNames(enumSrc);
				this.enumInfos = [];
				for (var i = 0, l = fields.length; i < l; ++i)
				{
					this.enumInfos.push({'text': fields[i], 'value': enumSrc[fields[i]]});
				}
			}
		}
	},
	/**
	 * Returns items need to be shown in select box.
	 * Descendants need to override this method.
	 * @returns {Array}
	 * @private
	 */
	getSelectItems: function()
	{
		var v = this.getValue();
		if (Kekule.ObjUtils.isUnset(v))  // has unset value
		{
			var result = Kekule.ArrayUtils.clone(this.enumInfos);
			result.unshift({'text': /*Kekule.WidgetTexts.S_VALUE_UNSET*/Kekule.$L('WidgetTexts.S_VALUE_UNSET'), 'value': v});
			return result;
		}
		return this.enumInfos;
	}
});
Kekule.PropertyEditor.register(Kekule.PropertyEditor.EnumEditor, null, null, null,
	function(objClass, propInfo)
	{
		return !!propInfo.enumSource;
	}
);

/**
 * A property editor that to edit ObjectEx instance.
 * @class
 * @augments Kekule.PropertyEditor.BaseEditor
 */
Kekule.PropertyEditor.ObjectExEditor = Class.create(Kekule.PropertyEditor.BaseEditor,
/** @lends Kekule.PropertyEditor.ObjectExEditor# */
{
	/** @private */
	CLASS_NAME: 'Kekule.PropertyEditor.ObjectExEditor',
	// override methods
	/** @ignore */
	getAttributes: function($super)
	{
		var result = $super();
		result = result | PEA.SUBPROPS;
		return result;
	},
	/** @ignore */
	hasSubPropertyEditors: function($super)
	{
		return $super() && this.getValue();
	},
	/** @ignore */
	getSubPropertyEditors: function(propScopes)
	{
		/*
		// debug
		var editor = new Kekule.PropertyEditor.ObjectExEditor();
		editor.setValueTextMode(this.getValueTextMode());
		editor.setObjects(this.getObjects());
		editor.setPropertyInfo(this.getPropertyInfo());
		return [editor, editor];
    */
		var result = [];
		var objs = this.getValue();
		if (objs)
		{
			if (objs instanceof ObjectEx)  // a single instance
			{
				var obj = objs;
				// iterate all properties of obj
				var objClass = obj.getClass();
			}
			else  // array of instances
			{
				var objClass = ClassEx.getCommonSuperClass(objs);
			}
			//var propList = obj.getAllPropList();
			//var propList = obj.getPropListOfScopes(propScopes);
			var propList = ClassEx.getPropListOfScopes(objClass, propScopes);
			for (var i = 0, l = propList.getLength(); i < l; ++i)
			{
				var propInfo = propList.getPropInfoAt(i);
				var editorClass = Kekule.PropertyEditor.findEditorClass(objClass, propInfo);
				if (editorClass)
				{
					var editor = new editorClass();
					editor.setObjects(Kekule.ArrayUtils.toArray(objs));
					editor.setPropertyInfo(propInfo);
					// copy some settings
					editor.setValueTextMode(this.getValueTextMode());
					result.push(editor);
				}
			}
		}
		return result;
	},
	/** @ignore */
	getValueText: function($super)
	{
		var v = this.getValue();
		if (Kekule.ObjUtils.notUnset(v))
		{
			if (v.getClassName)
				return '[' + v.getClassName() + ']';
			else
				return $super();
		}
		else
			return Kekule.$L('WidgetTexts.S_OBJECT_UNSET'); //Kekule.WidgetTexts.S_OBJECT_UNSET;
	}
});
Kekule.PropertyEditor.register(Kekule.PropertyEditor.ObjectExEditor, 'ObjectEx');



/**
 * A simple property editor that use a text box to edit a single field of a object (not objectEx).
 * @class
 * @augments Kekule.PropertyEditor.SimpleEditor
 *
 * //@property {String} fieldName
 * //@property {String} fieldType
 */
Kekule.PropertyEditor.ObjectFieldEditor = Class.create(Kekule.PropertyEditor.SimpleEditor,
/** @lends Kekule.PropertyEditor.ObjectFieldEditor# */
{
	/** @private */
	CLASS_NAME: 'Kekule.PropertyEditor.ObjectFieldEditor',
	/** @private */
	initialize: function()
	{
		//this.defineProp('fieldName', {'dataType': DataType.STRING});
		//this.defineProp('fieldType', {'dataType': DataType.STRING});
		//this.defineProp('parentEditor', {'dataType': DataType.OBJECT});
	},

	// override methods
	/*
	getPropertyType: function()
	{
		return this.getFieldType();
	},

	getPropertyName: function()
	{
		return this.getFieldName();
	},

	getPropertyInfo: function()
	{
		return null;
	},

	getTitle: function()
	{
		return this.getFieldName();
	},


	getValue: function()
	{
		var obj = this.getParentEditor().getValue();
		return obj? obj[this.getFieldName()]: undefined;
	},
	*/

	/** @ignore */
	doCreateEditWidget: function($super, parentWidget)
	{
		if (!this.getPropertyType())  // guess type
		{
			var value = this.getValue();
			this.getPropertyInfo().dataType = DataType.getType(value);
		}
		var result = $super(parentWidget);
		return result;
	}
});

/**
 * A property editor that to edit a object (not ObjectEx) property.
 * @class
 * @augments Kekule.PropertyEditor.BaseEditor
 */
Kekule.PropertyEditor.ObjectEditor = Class.create(Kekule.PropertyEditor.BaseEditor,
/** @lends Kekule.PropertyEditor.ObjectEditor# */
{
	/** @private */
	CLASS_NAME: 'Kekule.PropertyEditor.ObjectEditor',
	/** @constructs */
	initialize: function($super)
	{
		$super();
		this._initialObjValue = undefined;  // private
	},

	/**
	 * Returns property editor class to edit a specified field of obj.
	 * Descendants may override this method.
	 * @param {Array} objs
	 * //@param {String} fieldName
	 * @param {Hash} fieldInfo
	 * @returns {Class}
	 * @private
	 */
	getFieldEditorClass: function(objs, /*fieldName, dataType*/ fieldInfo)
	{
		//return Kekule.PropertyEditor.ObjectFieldEditor;
		//return Kekule.PropertyEditor.findEditorClassForType(dataType, fieldName) || Kekule.PropertyEditor.ObjectFieldEditor;
		return Kekule.PropertyEditor.findEditorClass(null, fieldInfo) || Kekule.PropertyEditor.ObjectFieldEditor;
	},
	/**
	 * Returns proper data type of a field of obj. Return null means "uncertain".
	 * Descendants may override this method.
	 * @param {Array} obj
	 * @param {String} fieldName
	 * @private
	 */
	getFieldValueType: function(obj, fieldName)
	{
		//return null;
		var value = obj[fieldName];
		if (Kekule.ObjUtils.notUnset(value))
			return DataType.getType(value);
		else
			return null;
	},
	/**
	 * Returns properly property editor for editing object field value.
	 * Returned value should be an instance of {@link Kekule.PropertyEditor.ObjectEditor}.
	 * Descendants may override this method.
	 * @param {Array} objs
	 * @param {Hash} fieldInfo
	 * @returns {Kekule.PropertyEditor.ObjectEditor}
	 * @private
	 */
	createFieldEditor: function(objs, fieldInfo)
	{
		//var dataType = this.getFieldValueType(objs, fieldName);
		var c = this.getFieldEditorClass(objs, fieldInfo);
		//console.log('create field editor', ClassEx.getClassName(c));
		var result = new c();
		result.setParentEditor(this);
		result.setReadOnly(false);  // important, otherwise since there is no setter in propInfo, field editor will be auto set to read only.
		result.setAllowEmpty(this.getAllowEmpty());
		//result.setPropertyInfo({'name': fieldName, 'dataType': dataType});
		result.setPropertyInfo(fieldInfo);
		result.setObjects(objs);
		result.setValueTextMode(this.getValueTextMode());
		/*
		if (dataType)
			result.setFieldType(dataType);
		*/
		return result;
	},

	/** @private */
	getObjFields: function(obj)
	{
		if (obj)
			return Kekule.ObjUtils.getOwnedFieldNames(obj);
		else
			return [];
	},
	/** @private */
	getObjFieldInfos: function(obj)
	{
		var fields = this.getObjFields(obj);
		var result = [];
		for (var i = 0, l = fields.length; i < l; ++i)
		{
			var info = {'name': fields[i], 'dataType': this.getFieldValueType(obj, fields[i])};
			result.push(info);
		}
		return result;
	},
	/** @private */
	notifyChildEditorValueChange: function(fieldName, fieldValue)
	{
		var old = this.getValue() || this._initialObjValue;
		/*
		if (!old)
			old = {};
		*/
		old[fieldName] = fieldValue;
		this.setValue(old);
	},
	// override methods
	/** @ignore */
	getAttributes: function($super)
	{
		var result = $super();
		result = result | PEA.SUBPROPS;
		return result;
	},
	/** @ignore */
	hasSubPropertyEditors: function($super)
	{
		return $super() && this.getObjFieldInfos(this.getValue()).length;
	},
	/** @ignore */
	getValueText: function($super)
	{
		var VDM = Kekule.Widget.ValueListEditor.ValueDisplayMode;
		var mode = this.getValueTextMode();
		if (mode === VDM.JSON)
			return $super();

		var value = this.getValue();
		if (value)
		{
			return '[' + /*Kekule.WidgetTexts.S_OBJECT*/Kekule.$L('WidgetTexts.S_OBJECT') + ']';
		}
		else
			return '';
	},
	setValue: function($super, value)
	{
		var result = $super(value);
		this._initialObjValue = value;
		return result;
	},
	/** @ignore */
	getSubPropertyEditors: function(propScopes)
	{
		var result = [];
		var objs = AU.toArray(this.getValue());
		if (objs.length > 1)  // TODO: more than one object, currently can not handle
			return [];
		var obj = objs[0];
		if (!obj)
			this._initialObjValue = {};
		else
			this._initialObjValue = obj;
		//if (obj)  // some editor need to expand even if obj is null
		{
			//var fields = this.getObjFields(obj);
			var fieldInfos = this.getObjFieldInfos(obj);
			var targets = [this._initialObjValue];

			for (var i = 0, l = fieldInfos.length; i < l; ++i)
			{
				var editor = this.createFieldEditor(targets, fieldInfos[i]);
				result.push(editor);
			}
		}
		return result;
	}
});
Kekule.PropertyEditor.register(Kekule.PropertyEditor.ObjectEditor, DataType.OBJECT);

/**
 * A property editor that to edit an array property.
 * @class
 * @augments Kekule.PropertyEditor.BaseEditor
 */
Kekule.PropertyEditor.ArrayEditor = Class.create(Kekule.PropertyEditor.BaseEditor,
/** @lends Kekule.PropertyEditor.ArrayEditor# */
{
	/** @private */
	CLASS_NAME: 'Kekule.PropertyEditor.ArrayEditor',
	// override methods
	/** @ignore */
	getAttributes: function($super)
	{
		var result = $super();
		result = result | PEA.SUBPROPS;
		return result;
	},
	/** @ignore */
	hasSubPropertyEditors: function($super)
	{
		var v = this.getValue();
		return $super() && v && v.length;
	},
	/** @ignore */
	getSubPropertyEditors: function(propScopes)
	{
		var result = [];
		var v = this.getValue();
		if (DataType.isArrayValue(v) && v.length)
		{
			var defItemType = this.getPropertyInfo().elementType;
			for (var i = 0, l = v.length; i < l; ++i)
			{
				var item = v[i];
				var itemType = defItemType || DataType.getType(item);
				var editorClass = Kekule.PropertyEditor.findEditorClassForType(itemType);
				//console.log(itemType, ClassEx.getClassName(editorClass));
				if (editorClass)
				{
					var editor = new editorClass();
					editor.setParentEditor(this);
					editor.setObjects([v]);
					var fakePropInfo = {'name': i, 'title': i, 'dataType': itemType};
					editor.setPropertyInfo(fakePropInfo);
					// copy some settings
					editor.setValueTextMode(this.getValueTextMode());
					result.push(editor);
				}
			}
		}
		return result;
	},
	/** @ignore */
	getValueText: function($super)
	{
		var v = this.getValue();
		if (DataType.isArrayValue(v))
			return '[' + v.length + ' ' + /*Kekule.WidgetTexts.S_ITEMS*/Kekule.$L('WidgetTexts.S_ITEMS') + ']';
		else
			return $super();
	}
});
Kekule.PropertyEditor.register(Kekule.PropertyEditor.ArrayEditor, DataType.ARRAY);

/**
 * A property editor that use a color drop down text box to edit color property value.
 * @class
 * @augments Kekule.PropertyEditor.SimpleEditor
 */
Kekule.PropertyEditor.ColorEditor = Class.create(Kekule.PropertyEditor.SimpleEditor,
/** @lends Kekule.PropertyEditor.ColorEditor# */
{
	/** @private */
	CLASS_NAME: 'Kekule.PropertyEditor.ColorEditor',
	// overided methods
	/** @ignore */
	doCreateEditWidget: function(parentWidget)
	{
		this._parentWidget = parentWidget;
		var value = this.getValue();
		// save old text to compare with later edited value
		this._originValue = value;
		var result = new Kekule.Widget.ColorDropTextBox(parentWidget, value);
		result.setSpecialColors([Kekule.Widget.ColorPicker.SpecialColors.UNSET]);
		result.addEventListener('valueSet', function(e)
			{
				this.saveEditValue();
			}, this
		);
		this._textbox = result;
		return result;
	},
	/** @ignore */
	doSaveEditValue: function()
	{
		var value = this.getEditWidget().getValue();
		if (value === Kekule.Widget.ColorPicker.SpecialColors.UNSET)
		{
			value = undefined;
		}
		else if (value === '')
			value = undefined;
		if (value !== this._originValue)
		{
			this.setValue(value);
			return true;
		}
		else
		{
			return false;
		}
	}
});
Kekule.PropertyEditor.register(Kekule.PropertyEditor.ColorEditor, DataType.STRING, null, null,
	function(objClass, propInfo)
	{
		var propName = propInfo.name;
		return propName && (propName.toLowerCase().indexOf('color') >= 0);  // propname may be empty in array items
	}
);

})();