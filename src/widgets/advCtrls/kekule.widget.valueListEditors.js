/**
 * @fileoverview
 * Implementation of a value list editor (like object inspector in Delphi).
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /utils/kekule.domUtils.js
 * requires /xbrowsers/kekule.x.js
 * requires /widgets/kekule.widget.base.js
 * requires /widgets/commonCtrls/kekule.widget.formControls.js
 */

(function(){
"use strict";

var DU = Kekule.DomUtils;
var EU = Kekule.HtmlElementUtils;
var CNS = Kekule.Widget.HtmlClassNames;

/** @ignore */
Kekule.Widget.HtmlClassNames = Object.extend(Kekule.Widget.HtmlClassNames, {
	VALUELISTEDITOR: 'K-ValueListEditor',
	VALUELISTEDITOR_ROW: 'K-ValueListEditor-Row',
	VALUELISTEDITOR_CELL: 'K-ValueListEditor-Cell',
	VALUELISTEDITOR_INDICATORCELL: 'K-ValueListEditor-IndicatorCell',
	VALUELISTEDITOR_KEYCELL: 'K-ValueListEditor-KeyCell',
	VALUELISTEDITOR_VALUECELL: 'K-ValueListEditor-ValueCell',
	VALUELISTEDITOR_CELL_CONTENT: 'K-ValueListEditor-CellContent',
	VALUELISTEDITOR_VALUECELL_TEXT: 'K-ValueListEditor-ValueCellText',
	VALUELISTEDITOR_INLINE_EDIT: 'K-ValueListEditor-InlineEdit',
	VALUELISTEDITOR_EXPANDMARK: 'K-ValueListEditor-ExpandMark',
	VALUELISTEDITOR_ACTIVE_ROW: 'K-ValueListEditor-ActiveRow'
});

/**
 * An value list editor widget (like object inspector in Delphi).
 * @class
 * @augments Kekule.Widget.BaseWidget
 *
 * @property {Hash} hash Set this property to update the whole editor with the hash's key and values.
 * @property {Bool} readOnly Whether user can edit value in editor.
 * @property {Bool} useKeyHint Whether add hint to key cell.
 * @property {Int} valueDisplayMode Value from {@link Kekule.Widget.ValueListEditor.ValueDisplayMode}.
 */
/**
 * Invoked when the active row is changed. Event param of it has field: {row} where row may be a empty value means no activeRow now.
 * @name Kekule.Widget.ValueListEditor#activeRowChange
 * @event
 */
/**
 * Invoked when the active row edit is finished and new value is saved. Event param of it has field: {row}.
 * @name Kekule.Widget.ValueListEditor#editFinish
 * @event
 */
/**
 * Invoked when the active row edit is cancelled and new value is discarded. Event param of it has field: {row}.
 * @name Kekule.Widget.ValueListEditor#editCancel
 * @event
 */
Kekule.Widget.ValueListEditor = Class.create(Kekule.Widget.BaseWidget,
/** @lends Kekule.Widget.ValueListEditor# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.ValueListEditor',
	/** @private */
	BINDABLE_TAG_NAMES: ['table'],
	/** @private */
	ROW_ELEM_TAG: 'tr',
	/** @private */
	CELL_ELEM_TAG: 'td',
	/** @private */
	ROW_DATA_FIELD: '__$row_data__',
	/** @private */
	ROW_EDIT_INFO_FIELD: '__$row_edit_info__',
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument)
	{
		$super(parentOrElementOrDocument);
		this._inlineEdit = null;
		this._isActivitingRow = false;
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('hash', {'dataType': DataType.HASH,
			'getter': function()
			{
				return this._getTotalHash();
			},
			'setter': function(value)
			{
				this._setTotalHash(value);
				this.setPropStoreFieldValue('hash', value);
			}
		});
		this.defineProp('readOnly', {'dataType': DataType.BOOL});
		this.defineProp('useKeyHint', {'dataType': DataType.BOOL});
		this.defineProp('valueDisplayMode', {'dataType': DataType.INT,
			'enumSource': Kekule.Widget.ValueListEditor.ValueDisplayMode,
			'setter': function(value)
			{
				if (this.getValueDisplayMode() !== value)
				{
					this.setPropStoreFieldValue('valueDisplayMode', value);
					this.valueDisplayModeChanged();
				}
			}
		});
		this.defineProp('activeRow', {'dataType': DataType.OBJECT, 'serializable': false,
			'scope': Class.PropertyScope.PUBLIC,
			'setter': function(value)
			{
				var old = this.getActiveRow();
				if (old !== value)
				{
					if (old)
					{
						// save already changed value first
						this.finishEditing();
						EU.removeClass(old, CNS.VALUELISTEDITOR_ACTIVE_ROW);
						this._showValueCellText(old);
					}
					if (this._inlineEdit)
						this._inlineEdit.finalize();
					if (value)
					{
						EU.addClass(value, CNS.VALUELISTEDITOR_ACTIVE_ROW);
						if (!this.getReadOnly())  // create inline edit
						{
							this.createValueEditWidget(value);
						}
					}
					this.setPropStoreFieldValue('activeRow', value);
					this.invokeEvent('activeRowChange', {'row': value});
				}
			}
		});
	},
	/** @ignore */
	doGetWidgetClassName: function()
	{
		return CNS.VALUELISTEDITOR;
	},
	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('table');
		return result;
	},

	/** @ignore */
	doBindElement: function($super, element)
	{
		$super(element);
	},

	/**
	 * Returns root table element.
	 * @returns {HTMLElement}
	 * @private
	 */
	getRootElem: function()
	{
		return this.getElement();
	},

	/** @private */
	createRowElem: function(doc)
	{
		var result = doc.createElement(this.ROW_ELEM_TAG);
		EU.addClass(result, CNS.VALUELISTEDITOR_ROW);
		return result;
	},
	/** @private */
	createCellElem: function(doc)
	{
		var result = doc.createElement(this.CELL_ELEM_TAG);
		EU.addClass(result, CNS.VALUELISTEDITOR_CELL);
		return result;
	},
	/** @private */
	createIndicatorCellElem: function(doc)
	{
		var result = this.createCellElem(doc);
		EU.addClass(result, CNS.VALUELISTEDITOR_INDICATORCELL);
		var indicator = doc.createElement('span');
		result.appendChild(indicator);
		return result;
	},
	/** @private */
	createKeyCellElem: function(doc)
	{
		var result = this.createCellElem(doc);
		EU.addClass(result, CNS.VALUELISTEDITOR_KEYCELL);
		return result;
	},
	/** @private */
	createValueCellElem: function(doc)
	{
		var result = this.createCellElem(doc);
		EU.addClass(result, CNS.VALUELISTEDITOR_VALUECELL);
		return result;
	},
	/** @private */
	createValueEditWidget: function(row)
	{
		var result = null;
		if (row === this.getActiveRow())  // is active, inlineEdit is on self, may reuse it
			result = this._inlineEdit;
		else if (this._inlineEdit)  // finalize old first
		{
			this._inlineEdit.finalize();
			this._inlineEdit = null;
		}

		if (!result)
		{
			result = this.doCreateValueEditWidget(row);
			result.setBubbleUiEvents(true);  // IMPORTANT, make sure event not eaten by edit
			EU.addClass(result.getElement(), CNS.VALUELISTEDITOR_INLINE_EDIT);
			var cell = this.getValueCell(row);
			var contentWrapper = this.getCellContentWrapper(cell, true);
			result.appendToElem(contentWrapper);
		}
		if (result)
		{
			/*
			result.setStatic(true);
			result.setBubbleUiEvents(true);  // IMPORTANT, make sure event not eaten by edit
			//EU.addClass(result.getElement(), CNS.VALUELISTEDITOR_INLINE_EDIT);
			var cell = this.getValueCell(row);
			var contentWrapper = this.getCellContentWrapper(cell, true);
			//console.log('set active row', result.getClassName(), contentWrapper.tagName);
			result.appendToElem(contentWrapper);
			//result.appendToElem(document.body);
			//console.log(result.getElement().parentNode);
			*/

			if (result.focus)
				result.focus();
			if (result.selectAll)
				result.selectAll();

			this._inlineEdit = result;
			this._hideValueCellText(row);
		}
		return result;
	},
	/** @private */
	doCreateValueEditWidget: function(row)
	{
		var data = this.getRowData(row);
		//var value = data? data.value: '';
		var value = this.getValueCellText(row, data);

		var widgetInfo = this.getValueEditWidgetInfo(row);

		var editClass = widgetInfo.widgetClass;
		var result = new editClass(this);
		if (widgetInfo.propValues)  // init widget
		{
			result.setPropValues(widgetInfo.propValues);
		}
		result.setValue(value);
		return result;
	},
	/** @private */
	getDefaultValueEditWidgetInfo: function()
	{
		return {'widgetClass': Kekule.Widget.TextBox};
	},
	/**
	 * Returns essential information to create inline edit widget.
	 * Descendants can override this method.
	 * @param {HTMLElement} row
	 * @returns {Hash} Including {widgetClass, initialPropValues}
	 */
	getValueEditWidgetInfo: function(row)
	{
		return this.getRowEditInfo(row) || this.getDefaultValueEditWidgetInfo();
	},

	// methods to manipulate row of value list editor
	/**
	 * Returns all row elements in editor.
	 * @returns {Array}
	 */
	getRowElems: function()
	{
		if (this.getRootElem())
		{
			return DU.getDirectChildElems(this.getRootElem(), this.ROW_ELEM_TAG);
		}
		else
			return [];
	},
	/**
	 * Returns all row elements in editor. Same as getRowElems.
	 * @returns {Array}
	 */
	getRows: function()
	{
		return this.getRowElems();
	},
	/**
	 * Returns total row count of current editor.
	 * @returns {Int}
	 */
	getRowCount: function()
	{
		var rows = this.getRowElems();
		return rows? rows.length: 0;
	},
	/**
	 * Returns row element at index.
	 * @param {Int} index
	 * @return {HTMLElement}
	 */
	getRowAt: function(index)
	{
		var rows = this.getRowElems();
		return rows? rows[index]: null;
	},
	/**
	 * Returns previous row.
	 * @param {HTMLElement} row
	 * @returns {HTMLElement}
	 */
	getPrevRow: function(row)
	{
		var matchTag = this.ROW_ELEM_TAG.toLowerCase();
		var result = row.previousSibling;
		while (result && ((result.nodeType !== Node.ELEMENT_NODE)
			|| (result.tagName.toLowerCase() !== matchTag)))
		{
			result = result.previousSibling;
		}
		return result;
	},
	/**
	 * Returns next row.
	 * @param {HTMLElement} row
	 * @returns {HTMLElement}
	 */
	getNextRow: function(row)
	{
		var matchTag = this.ROW_ELEM_TAG.toLowerCase();
		var result = row.nextSibling;
		while (result && ((result.nodeType !== Node.ELEMENT_NODE)
			|| (result.tagName.toLowerCase() !== matchTag)))
		{
			result = result.nextSibling;
		}
		return result;
	},
	/**
	 * Returns key cell element of row.
	 * @param {HTMLElement} row
	 * @returns {HTMLElement}
	 */
	getKeyCell: function(row)
	{
		var cells = DU.getDirectChildElems(row, this.CELL_ELEM_TAG);
		return cells[1];
	},
	/**
	 * Text wrapper element (usually a <span>) in cell.
	 * @param {HTMLElement} cell
	 * @param {Bool} canCreate
	 * @returns {HTMLElement}
	 */
	getCellContentWrapper: function(cell, canCreate)
	{
		var children = DU.getDirectChildElems(cell);
		var result = children? children[0]: null;
		if (!result && canCreate)  // create new one
		{
			//result = this.createTextContent('', cell);
			result = cell.ownerDocument.createElement('span');
			cell.appendChild(result);
			EU.addClass(result, CNS.VALUELISTEDITOR_CELL_CONTENT);
		}
		return result;
	},
	/** @private */
	getValueCellTextWrapper: function(cell, canCreate)
	{
		var result = null;
		var wrapper = this.getCellContentWrapper(cell, canCreate);
		if (wrapper)
		{
			var children = wrapper.getElementsByTagName('span');
			result = children? children[0]: null;
			if (!result && canCreate) // create new one
			{
				result = cell.ownerDocument.createElement('span');
				wrapper.appendChild(result);
				EU.addClass(result, CNS.VALUELISTEDITOR_VALUECELL_TEXT);
			}
		}
		return result;
	},
	/** @private */
	_hideValueCellText: function(row)
	{
		var elem = this.getValueCellTextWrapper(this.getValueCell(row));
		if (elem)
			elem.style.visibility = 'hidden';
	},
	/** @private */
	_showValueCellText: function(row)
	{
		var elem = this.getValueCellTextWrapper(this.getValueCell(row));
		if (elem)
			elem.style.visibility = 'visible';
	},
	/**
	 * Returns value cell element of row.
	 * @param {HTMLElement} row
	 * @returns {HTMLElement}
	 */
	getValueCell: function(row)
	{
		var cells = DU.getDirectChildElems(row, this.CELL_ELEM_TAG);
		return cells[2];
	},
	/**
	 * Returns parent cell child element.
	 * @param {HTMLElement} element
	 * @returns {HTMLElement}
	 */
	getParentCell: function(element)
	{
		var result = DU.getNearestAncestorByTagName(element, this.CELL_ELEM_TAG, true);
		return result;
	},
	/**
	 * Returns parent row of cell (or other element).
	 * @param {HTMLElement} element
	 * @returns {HTMLElement}
	 */
	getParentRow: function(element)
	{
		var result = DU.getNearestAncestorByTagName(element, this.ROW_ELEM_TAG, true);
		return result;
	},
	/**
	 * Add a new row element based on key and value.
	 * @returns {HTMLElement}
	 * @private
	 */
	_createNewRow: function(data)
	{
		var doc = this.getDocument();
		var result = this.createRowElem(doc);
		if (result)
		{
			var indicatorCell = this.createIndicatorCellElem(doc);
			result.appendChild(indicatorCell);
			var keyCell = this.createKeyCellElem(doc);
			result.appendChild(keyCell);
			var valueCell = this.createValueCellElem(doc);
			result.appendChild(valueCell);
			if (data)
				this.setRowData(result, data);
		}
		return result;
	},
	/**
	 * Insert a row before refRowElem.
	 * @param {Hash} data
	 * @param {HTMLElement} refRowElem
	 * @returns {HTMLElement}
	 */
	insertRowBefore: function(data, refRowElem)
	{
		var row = this._createNewRow(data);
		if (row)
			this.getRootElem().insertBefore(row, refRowElem || null);
		return row;
	},
	/**
	 * Append a row at the tail of editor.
	 * @param {Hash} data
	 * @returns {HTMLElement}
	 */
	appendRow: function(data)
	{
		return this.insertRowBefore(data, null);
	},
	/**
	 * Remove a row element from editor.
	 * @param {HTMLElement} rowElem
	 */
	removeRow: function(rowElem)
	{
		if (rowElem === this.getActiveRow())
			this.setActiveRow(null);
		this.getRootElem().removeChild(rowElem);
		return this;
	},
	/**
	 * Remove a row element at index.
	 * @param {Int} index
	 */
	removeRowAt: function(index)
	{
		var row = this.getRowAt(index);
		if (row)
			this.removeRow(row);
		return this;
	},
	/**
	 * Clear all rows and content in editor.
	 */
	clear: function()
	{
		this.setActiveRow(null);
		if (this.getRootElem())
		{
			/*
			if (this.getRootElem().innerHTML)
				this.getRootElem().innerHTML = '';  // sometimes cause exceptions in IE when innerHTML is empty
			*/
			Kekule.DomUtils.clearChildContent(this.getRootElem());
		}
	},

	/**
	 * Force to update display text in key/value cell of all rows.
	 */
	updateAll: function()
	{
		var rows = this.getRowElems();
		for (var i = 0, l = rows.length; i < l; ++i)
		{
			var row = rows[i];
			var data = this.getRowData(row);
			this.setRowData(row, data);
		}
		return this;
	},

	/** @private */
	valueDisplayModeChanged: function()
	{
		this.updateAll();
	},

	/**
	 * Returns display text shown in key cell.
	 * Descendants can override this method to show different texts.
	 * @param {HTMLElement} row
	 * @param {Object} data
	 * @returns {String}
	 */
	getKeyCellText: function(row, data)
	{
		return data.title || data.key;
	},
	/**
	 * Returns hint text shown in key cell.
	 * Descendants can override this method to show different texts.
	 * @param {HTMLElement} row
	 * @param {Object} data
	 * @returns {String}
	 */
	getKeyCellHint: function(row, data)
	{
		return data.hint || this.getKeyCellText(row, data);
	},
	/**
	 * Returns display text shown in value cell.
	 * Descendants can override this method to show different texts.
	 * @param {HTMLElement} row
	 * @param {Object} data
	 * @returns {String}
	 */
	getValueCellText: function(row, data)
	{
		var mode = this.getValueDisplayMode();
		var result = (mode === VDM.JSON)?
			JSON.stringify(data.value):
			'' + data.value;
		return result;
	},
	/**
	 * After editing finished, convert value string into real data value.
	 * Descendants may override this method to do some transform from valueText to actual value.
	 * @param {String} valueText
	 * @param {HTMLElement} row
	 * @param {Object} oldData
	 */
	valueCellTextToValue: function(valueText, row, oldData)
	{
		//return valueText;
		var mode = this.getValueDisplayMode();
		return (mode === VDM.JSON)?
			JSON.parse(valueText):
			valueText;
	},
	/**
	 * After editing finished, feedback value string to data.
	 * Descendants may override this method to do some real work.
	 * @param {String} valueText
	 * @param {HTMLElement} row
	 */
	setValueCellText: function(valueText, row)
	{
		var oldData = this.getRowData(row);
		var newValue = this.valueCellTextToValue(valueText, row, oldData);
		oldData.value = newValue;
		this.setRowData(row, oldData);
		return this;
	},

	/**
	 * Returns data (key & value) associated with row.
	 * @param {HTMLElement} row
	 * @returns {Hash} A object with key/value fields.
	 */
	getRowData: function(row)
	{
		return row[this.ROW_DATA_FIELD];
	},
	/**
	 * Change key and value of a row element.
	 * @param {HTMLElement} row
	 * @param {Object} data Must has two fields: key and value.
	 *   If data.title is set, the display text in key cell will use it.
	 *   Extra field can also be included.
	 * @returns {HTMLElement}
	 */
	setRowData: function(row, data)
	{
		row[this.ROW_DATA_FIELD] = data;
		// reflect on HTML element

		this.setRowKeyCellContent(row, this.getKeyCellText(row, data), this.getKeyCellHint(row, data));
		this.setRowValueCellContent(row, this.getValueCellText(row, data));

		if (row === this.getActiveRow() && this._inlineEdit) // need to update inline edit
		{
			this.createValueEditWidget(row);
		}
	},
	/** @private */
	setRowKeyCellContent: function(row, keyText, keyHint)
	{
		var cell = this.getKeyCell(row);
		var contentWrapper = this.getCellContentWrapper(cell, true);
		contentWrapper.innerHTML = keyText;
		if (this.getUseKeyHint())
			contentWrapper.title = keyHint;
	},
	/** @private */
	setRowValueCellContent: function(row, valueText)
	{
		var cell = this.getValueCell(row);
		var textWrapper = this.getValueCellTextWrapper(cell, true);
		var text = valueText;
		if (text === '')  // avoid blank string, otherwise inline-edit will not shown properly
			textWrapper.innerHTML = '&nbsp;';
		else
			Kekule.DomUtils.setElementText(textWrapper, text);
	},
	/**
	 * Returns inline edit settings of row.
	 * @param {HTMLElement} row
	 * @returns {Hash} A object with inline edit settings.
	 */
	getRowEditInfo: function(row)
	{
		return row[this.ROW_EDIT_INFO_FIELD];
	},
	/**
	 * Set inline edit settings of row.
	 * @param {HTMLElement} row
	 * @param {Hash} info This param is a hash that may containing the following fields:
	 *   {
	 *     widgetClass: widget class need to be create during inline-editing,
	 *     propValues: A hash object to init the widget, e.g. {'items': [{'key1', 'value1'}]} for select box.
	 *   }
	 */
	setRowEditInfo: function(row, info)
	{
		row[this.ROW_EDIT_INFO_FIELD] = info;
		if (row === this.getActiveRow())
		{
			this.setActiveRow(null);
			this.setActiveRow(activeRow);  // force update the active row
		}
	},

	/**
	 * Show inline edit in row and begin editting.
	 * @param {HTMLElement} row
	 */
	editRow: function(row)
	{
		this.setActiveRow(row);
	},
	/**
	 * Finish current editing process on activeRow and save the result.
	 */
	finishEditing: function()
	{
		var row = this.getActiveRow();
		if (row && this._inlineEdit)
		{
			/*
			var oldData = this.getRowData(row);
			var newValue = this.valueCellTextToValue(this._inlineEdit.getValue(), row, oldData);
			oldData.value = newValue;
			this.setRowData(row, oldData);
			*/
			this.setValueCellText(this._inlineEdit.getValue(), row);
			this.invokeEvent('editFinish', {'row': row});
		}
		return this;
	},
	/**
	 * Cancel current editing process on activeRow and restore the old value.
	 */
	cancelEditing: function()
	{
		var row = this.getActiveRow();
		if (row && this._inlineEdit)
		{
			var oldData = this.getRowData(row);
			this.setRowData(row, oldData);
			this.invokeEvent('editCancel', {'row': row});
		}
		return this;
	},

	/**
	 * Merge all data into a hash object.
	 * @returns {Hash}
	 * @private
	 */
	_getTotalHash: function()
	{
		var result = {};
		var rows = this.getRowElems();
		for (var i = 0, l = rows.length; i < l; ++i)
		{
			var row = rows[i];
			var data = this.getRowData(row);
			if (data)
			{
				result[data.key] = data.value;
			}
		}
		return result;
	},
	/**
	 * Update whole editor with hash object that decided all the keys and values.
	 * @param {Hash} hash
	 * @private
	 */
	_setTotalHash: function(hash)
	{
		var rows = this.getRowElems();
		var oldRowCount = rows.length;
		var keys = Kekule.ObjUtils.getOwnedFieldNames(hash);
		var l = keys.length;
		for (var i = 0; i < l; ++i)
		{
			var key = keys[i];
			var value = hash[key];
			var row;
			if (i < oldRowCount)
			{
				row = this.getRowAt(i);
				this.setRowData(row, {'key': key, 'value': value});
			}
			else
				row = this.appendRow({'key': key, 'value': value});
		}
		if (oldRowCount > l)  // remove unneed rows
		{
			for (var i = oldRowCount - 1; i >= l; --i)
			{
				this.removeRow(rows[i]);
			}
		}
		var activeRow = this.getActiveRow();
		if (activeRow)
		{
			this.setActiveRow(null);
			this.setActiveRow(activeRow);  // force update the active row
		}
		return this;
	},

	// event handlers
	/*
	react_mousedown: function(e)
	{
		if (e.getButton() === Kekule.X.Event.MouseButton.LEFT)
		{
			var target = e.getTarget();
			// get nearest row
			var row = this.getParentRow(target);
			if (row)
			{
				this._isActivitingRow = true;
				this.setActiveRow(row);
			}
		}
	},
	react_mouseup: function(e)
	{
		if (e.getButton() === Kekule.X.Event.MouseButton.LEFT)
		{
			var target = e.getTarget();
			// get nearest row
			var row = this.getParentRow(target);
			if (row)
				this.setActiveRow(row);
			this._isActivitingRow = false;
		}
	},
	react_mousemove: function(e)
	{
		var target = e.getTarget();
		// get nearest row
		if (this._isActivitingRow)
		{
			var row = this.getParentRow(target);
			if (row)
				this.setActiveRow(row);
		}
	},
	*/
	/** @ignore */
	react_click: function(e)
	{
		var target = e.getTarget();
		// get nearest row
		var row = this.getParentRow(target);
		if (row)
		{
			this.setActiveRow(row);
		}
	},
	/** @ignore */
	react_keydown: function(e)
	{
		//console.log('key down');
		var keyCode = e.getKeyCode();
		var noModifier = !(e.getAltKey() || e.getShiftKey() || e.getCtrlKey());
		if (noModifier)
		{
			var currRow = this.getActiveRow();
			if (currRow)
			{
				var row;
				if (keyCode === Kekule.X.Event.KeyCode.UP)
				{
	        row = this.getPrevRow(currRow);
				}
				else if (keyCode === Kekule.X.Event.KeyCode.DOWN)
				{
	        row = this.getNextRow(currRow);
				}
				if (row)
					this.setActiveRow(row);
			}
		}
	},
	/** @ignore */
	react_keyup: function(e)
	{
		var keyCode = e.getKeyCode();
		if (keyCode === Kekule.X.Event.KeyCode.ESC)
		{
			this.cancelEditing();
		}
		else if (keyCode === Kekule.X.Event.KeyCode.ENTER)
		{
			this.finishEditing();
		}
	},
	/** @ignore */
	react_blur: function(e)
	{
		return;
		//if (this._inlineEdit)
		{
			//if (e.getTarget() === this._inlineEdit.getElement())
			{
				//console.log('blur');
				//console.log(document.activeElement);
				this.finishEditing();
				this.setActiveRow(null);
			}
		}
	}
});

/**
 * Enumeration of value display mode for value list editor.
 * @class
 */
Kekule.Widget.ValueListEditor.ValueDisplayMode = {
	/** Value displays as simple string. */
	SIMPLE: 0,
	/** Value displays as JSON value. */
	JSON: 1
};
var VDM = Kekule.Widget.ValueListEditor.ValueDisplayMode;

})();