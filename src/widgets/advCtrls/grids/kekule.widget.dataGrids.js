/**
 * @fileoverview
 * Implementation of a data-grid widget based on HTML table.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /utils/kekule.domUtils.js
 * requires /xbrowsers/kekule.x.js
 * requires /widgets/kekule.widget.base.js
 * requires /widgets/kekule.widget.styleResources.js
 * requires /widgets/kekule.widget.containers.js
 * requires /widgets/commonCtrls/kekule.widget.buttons.js
 * requires /widgets/commonCtrls/kekule.widget.formControls.js
 * requires /widgets/grids/kekule.widget.dataSets.js
 * requires /localizations/
 */

(function(){
"use strict";

var DU = Kekule.DomUtils;
var EU = Kekule.HtmlElementUtils;
var CNS = Kekule.Widget.HtmlClassNames;

/** @ignore */
Kekule.Widget.HtmlClassNames = Object.extend(Kekule.Widget.HtmlClassNames, {
	DATAGRID: 'K-DataGrid',
	DATATABLE: 'K-DataTable',
	DATATABLE_ROW_ODD: 'K-Odd',
	DATATABLE_ROW_EVEN: 'K-Even',
	DATATABLE_CELL_WRAPPER: 'K-DataTable-CellWrapper',
	DATATABLE_HEADCELL_INTERACTABLE: 'K-DataTable-HeadCellInteractable',
	DATATABLE_OPER_COL: 'K-DataTable-OperCol',
	DATATABLE_OPER_CELL: 'K-DataTable-OperCell',
	DATATABLE_CHECK_COL: 'K-DataTable-CheckCol',
	DATATABLE_CHECK_CELL: 'K-DataTable-CheckCell',
	DATATABLE_DATA_COL: 'K-DataTable-DataCol',
	DATATABLE_DATA_CELL: 'K-DataTable-DataCell',
	DATATABLE_SORTMARK: 'K-DataTable-SortMark',
	DATATABLE_SORTASC: 'K-Sort-Asc',
	DATATABLE_SORTDESC: 'K-Sort-Desc',
	DATATABLE_EDIT: 'K-DataTable-Edit',
	DATATABLE_DELETE: 'K-DataTable-Delete',
	DATATABLE_INSERT: 'K-DataTable-Insert',
	/*
	DATATABLE_OPER_COL_MODE_ALL: 'K-DataTable-OperColMode-All',
	DATATABLE_OPER_COL_MODE_HOVER: 'K-DataTable-OperColMode-Hover',
	DATATABLE_OPER_COL_MODE_ACTIVE: 'K-DataTable-OperColMode-Active',
	*/

	PAGENAVIGATOR: 'K-PageNavigator',
	PAGENAVIGATOR_FIRST: 'K-PageNavigator-First',
	PAGENAVIGATOR_LAST: 'K-PageNavigator-Last',
	PAGENAVIGATOR_PREV: 'K-PageNavigator-Prev',
	PAGENAVIGATOR_NEXT: 'K-PageNavigator-Next',
	PAGENAVIGATOR_PAGEINDEXER: 'K-PageNavigator-PageIndexer',
	PAGENAVIGATOR_PAGEINPUT: 'K-PageNavigator-PageInput',
	PAGENAVIGATOR_PAGESELECTOR: 'K-PageNavigator-PageSelector'
});

/**
 * Enumeration of predifined data table column names.
 * @enum
 */
Kekule.Widget.DataTableColNames = {
	OPER: 'OPER',
	CHECK: 'CHECK',
	ALL: '*'
};
var TCN = Kekule.Widget.DataTableColNames;


/**
 * An widget to to display array of data in grid table (based on HTML table).
 * @class
 * @augments Kekule.Widget.BaseWidget
 *
 * @property {Array} columns Column definitions. Each item is a hash that defines the aspects of column, e.g.:
 *   [
 *     {'name': 'fieldName', 'text': 'Caption of column', 'hint': 'hint of column head',
 *     	'disableInteract': trueOrFalse,
 *      'className': 'HtmlClassOfEachColumnCell', 'style': 'CSSInlineStyleOfEachColumnCell',
 *      'colClassName': 'HtmlClassOfColElem', 'colStyle': 'CSSInlineStyleOfColElem'}
 *   ]
 *   name can be set to some special values to create special columns:
 *     'OPER': operation column,
 *     'CHECK': check box column,
 *     '*': Show all fields in data
 *   e.g.: [{'name': 'CHECK'}, {'name': '*'}, {'name': 'OPER}],
 *   or use string directly: ['CHECK', '*', 'OPER'].
 *
 * @property {Array} data Data displayed in grid, each item is a hash. e.g.:
 *   [
 *     {'id': 1, 'name': 'Smith', 'email': 'smith@ab.com'},
 *     {'id': 2, 'name': 'Bob', 'email': null}
 *   ]
 * @property {Array} sortFields Fields to sort data. If field name is prefixed with '!', means sort in desc order.
 *   e.g. ['id', '!name']
 * @property {Func} sortFunc Custom function to sort data. Func(dataItem1, dataItem2).
 *   Note: if data is provided by data pager, this property will be unusable.
 * @property {String} operColShowMode Value from {@link Kekule.Widget.DataTable.OperColShowMode},
 *   determinate when to show operation column in data table.
 * @property {Array} operWidgets Array of predefined button names or widget definition hashes shown in operation column.
 * @property {Bool} showTableHead Whether table head row is displayed.
 * @property {Bool} enableHeadInteraction If this property is true, click on head cell with sort data in table automatically.
 * @property {Bool} enableActiveRow If this property is true, click on data row/cell will mark it as active
 *   and mouse hover will mark the row as "hover".
 */
Kekule.Widget.DataTable = Class.create(Kekule.Widget.BaseWidget,
/** @lends Kekule.Widget.DataTable# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.DataTable',
	/** @private */
	BINDABLE_TAG_NAMES: ['div', 'span'], //['table'],
	/** @private */
	PREFIX_SORT_DESC: '!',
	/** @private */
	COLDEF_FIELD: '__$colDef__',
	/** @private */
	ROWDATA_FIELD: '__$rowData__',
	/** @private */
	ROW_OPER_TOOLBAR_FIELD: '__$rowOperToolbar__',
	/** @private */
	ROW_CHECKBOX_FIELD: '__$rowCheckBox__',
	/** @private */
	COLNAME_OPER: TCN.OPER,
	/** @private */
	COLNAME_CHECK: TCN.CHECK,
	/** @private */
	COLNAME_ALL: TCN.ALL,
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument)
	{
		//this._tableElem = null;
		this._displayData = null;
		this.setPropStoreFieldValue('showTableHead', true);
		$super(parentOrElementOrDocument);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('data', {'dataType': DataType.ARRAY});
		this.defineProp('columns', {'dataType': DataType.ARRAY});
		this.defineProp('operColShowMode', {'dataType': DataType.STRING});
		this.defineProp('operWidgets', {'dataType': DataType.ARRAY});
		this.defineProp('sortFields', {
			'dataType': DataType.ARRAY,
			'setter': function(value)
			{
				var a = value ? Kekule.ArrayUtils.toArray(value) : null;
				this.setPropStoreFieldValue('sortFields', a);
				if (this.getDataPager())
				{
					this.getDataPager().setSortFields(a);
				}
			}
		});
		this.defineProp('sortFunc', {'dataType': DataType.FUNCTION});
		this.defineProp('showTableHead', {'dataType': DataType.BOOL});
		this.defineProp('enableHeadInteraction', {'dataType': DataType.BOOL});
		this.defineProp('enableActiveRow', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('enableActiveRow', value);
				if (!value)
				{
					this.setActiveCell(null);
				}
			}
		});

		// private properties
		this.defineProp('activeCell', {'dataType': DataType.OBJECT,
			'setter': function(value)
			{
				var old = this.getActiveCell();
				if (old !== value)
				{
					if (old)
						EU.removeClass(old, CNS.STATE_ACTIVE);
					this.setPropStoreFieldValue('activeCell', value);
					if (value)
					{
						EU.addClass(value, CNS.STATE_ACTIVE);
						var row = this.getParentRow(value);
						if (row)
							this.setActiveRow(row);
					}
					else
						this.setActiveRow(null);
				}
			}
		});
		this.defineProp('activeRow', {'dataType': DataType.OBJECT,
			'setter': function(value)
			{
				var old = this.getActiveRow();
				if (old !== value)
				{
					this.activeRowChanged(old, value);
					this.setPropStoreFieldValue('activeRow', value);
				}
			}
		});
		this.defineProp('hoverCell', {'dataType': DataType.OBJECT,
			'setter': function(value)
			{
				var old = this.getHoverCell();
				if (old !== value)
				{
					if (old)
						EU.removeClass(old, CNS.STATE_HOVER);
					this.setPropStoreFieldValue('hoverCell', value);
					if (value)
					{
						EU.addClass(value, CNS.STATE_HOVER);
						var row = this.getParentRow(value);
						if (row)
							this.setHoverRow(row);
					}
					else
						this.setHoverRow(null);
				}
			}
		});
		this.defineProp('hoverRow', {'dataType': DataType.OBJECT,
			'setter': function(value)
			{
				var old = this.getHoverRow();
				if (old !== value)
				{
					this.hoverRowChanged(old, value);
					this.setPropStoreFieldValue('hoverRow', value);
				}
			}
		});

		this.defineProp('dataPager', {'dataType': 'Kekule.Widget.DataPager',
			'setter': function(value)
			{
				var old = this.getDataPager();
				if (old !== value)
				{
					this.setPropStoreFieldValue('dataPager', value);
					this.dataPagerChanged(value, old);
				}
			}
		});
	},
	/** @ignore */
	initPropValues: function($super)
	{
		$super();
		this.reactOperEditBind = this.reactOperEdit.bind(this);
		this.reactOperDeleteBind = this.reactOperDelete.bind(this);
		this.reactOperInsertBind = this.reactOperInsert.bind(this);
	},

	/** @ignore */
	doObjectChange: function($super, modifiedPropNames)
	{
		$super(modifiedPropNames);
		var relatedProps = [
			'data', 'columns', 'sortFields', 'sortFunc', 'showTableHead', 'enableHeadInteraction',
			'operColShowMode', 'operWidgets'
		];
		if (Kekule.ArrayUtils.intersect(modifiedPropNames, relatedProps).length) // need recreate
		{
			this.recreateChildContent();
		}
	},

	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.DATATABLE;
	},
	/** @ignore */
	doCreateRootElement: function(doc)
	{
		//var result = doc.createElement('table');
		var result = doc.createElement('div');
		//this._tableElem = result;
		return result;
	},
	/** @ignore */
	doCreateSubElements: function(doc, rootElem)
	{
		//return this.recreateChildContent(doc, rootElem);
		return this.doCreateDataTable(doc, rootElem);
	},
	/** @private */
	doCreateDataTable: function(doc, parentElem)
	{
		var result = doc.createElement('table');

		//this._tableElem = result;
		this.recreateChildContent(doc, result);

		parentElem.appendChild(result);
		return result;
	},
	/** @private */
	getTableElement: function()
	{
		return this.getElement() && this.getElement().getElementsByTagName('table')[0];
	},
	/** @private */
	getShowOperCol: function()
	{
		var mode = this.getOperColShowMode() || Kekule.Widget.DataTable.OperColShowMode.NONE;
		return mode !== Kekule.Widget.DataTable.OperColShowMode.NONE;
	},
	/**
	 * Recreate child elements in table.
	 * @private
	 */
	recreateChildContent: function(doc, parentElem)
	{
		this.setActiveCell(null);
		this.setHoverCell(null);

		var data = this.prepareData();
		// remove old table and create new one
		var tableElem = parentElem || this.getTableElement();
		var result = [];
		if (tableElem)
		{
			DU.clearChildContent(tableElem);
			if (!doc)
				var doc = tableElem.ownerDocument;
			result.push(this.doCreateDataTableColGroup(doc, tableElem, data.columns));
			if (this.getShowTableHead())
				result.push(this.doCreateDataTableHead(doc, tableElem, data.columns));
			result.push(this.doCreateDataTableBody(doc, tableElem, data.columns, data.data));
		}
		return result;
	},
	/** @private */
	doCreateDataTableColGroup: function(doc, parentElem, columns)
	{
		var cols = columns || [];
		var result = doc.createElement('colgroup');
		for (var i = 0, l = cols.length; i < l; ++i)
		{
			var colDef = cols[i] || {};
			//if (colDef)
			{
				var colElem = doc.createElement('col');
				if (colDef.colClassName)
					colElem.className = colDef.colClassName;
				if (colDef.colStyle)
					colElem.style.cssText = colDef.colStyle;
				result.appendChild(colElem);
			}
		}
		parentElem.appendChild(result);
		return result;
	},
	/** @private */
	doCreateDataTableCellWrapper: function(doc, parentElem)
	{
		var result = doc.createElement('span');
		result.className = CNS.DATATABLE_CELL_WRAPPER;
		parentElem.appendChild(result);
		return result;
	},
	/** @private */
	doCreateDataTableHead: function(doc, parentElem, columns)
	{
		var cols = columns || [];
		var headInteractable = this.getEnableHeadInteraction();
		var result = doc.createElement('thead');
		var rowElem = doc.createElement('tr');
		for (var i = 0, l = cols.length; i < l; ++i)
		{
			var colDef = cols[i] || {};
			this.doCreateDataTableHeadCell(doc, rowElem, colDef, headInteractable);
		}
		result.appendChild(rowElem);
		parentElem.appendChild(result);
		return result;
	},
	/** @private */
	doCreateDataTableHeadCell: function(doc, parentElem, colDef, headInteractable)
	{
		var elem = doc.createElement('th');
		if (colDef.className)
			elem.className = colDef.className;
		if (colDef.style)
			elem.style.cssText = colDef.style;
		var wrapperElem = this.doCreateDataTableCellWrapper(doc, elem);
		var interactable = Kekule.ObjUtils.notUnset(colDef.disableInteract)? !colDef.disableInteract: headInteractable;
		if (interactable)
		{
			EU.addClass(/*wrapperElem*/elem, CNS.DATATABLE_HEADCELL_INTERACTABLE);
		}

		DU.setElementText(wrapperElem, colDef.text || colDef.name);
		var sortMark = this.doCreateDataTableHeadCellSortMark(doc, elem);
		if (colDef.sorting === 1)  // sort asc
			EU.addClass(sortMark, CNS.DATATABLE_SORTASC);
		else if (colDef.sorting === -1)  // sort desc
			EU.addClass(sortMark, CNS.DATATABLE_SORTDESC);
		else  // no sort
		{

		}

		wrapperElem.title = colDef.hint || '';
		elem[this.COLDEF_FIELD] = colDef;

		parentElem.appendChild(elem);
		return elem;
	},
	/** @private */
	doCreateDataTableHeadCellSortMark: function(doc, parentElem)
	{
		var result = doc.createElement('span');
		result.className = CNS.DATATABLE_SORTMARK;
		parentElem.appendChild(result);
		return result;
	},
	/** @private */
	doCreateDataTableBody: function(doc, parentElem, columns, data)
	{
		var cols = columns || [];
		var data = data || [];
		var result = doc.createElement('tbody');

		// prepare widgets in operation column
		if (this.getShowOperCol())
		{
			var childWidgetDefinitions = this.getOperWidgetDefinitions();
		}

		var isOdd = true;
		for (var i = 0, l = data.length; i < l; ++i)
		{
			var rowElem = doc.createElement('tr');
			rowElem.className = isOdd? CNS.DATATABLE_ROW_ODD: CNS.DATATABLE_ROW_EVEN;
			isOdd = !isOdd;

			var rowData = data[i] || {};
			rowElem[this.ROWDATA_FIELD] = rowData;
			for (var j = 0, k = cols.length; j < k; ++j)
			{
				var colDef = cols[j];
				var key = colDef.name;
				var value = rowData[key];
				var cellElem = doc.createElement('td');
				if (colDef.className)
					cellElem.className = colDef.className;
				if (colDef.style)
					cellElem.style.cssText = colDef.style;
				var wrapperElem = this.doCreateDataTableCellWrapper(doc, cellElem);
				if (colDef.isOperCol)
				{
					var ops = {
						'rowData': rowData,
						'rowIndex': i,
						'colIndex': j,
						'childWidgetDefinitions': childWidgetDefinitions
					};
					var w = this.doCreateOperCellContent(wrapperElem, ops);
					rowElem[this.ROW_OPER_TOOLBAR_FIELD] = w;
				}
				else if (colDef.isCheckCol)
				{
					var ops = {
						'rowData': rowData,
						'rowIndex': i,
						'colIndex': j
					}
					var c = this.doCreateCheckCellContent(wrapperElem, ops);
					rowElem[this.ROW_CHECKBOX_FIELD] = c;
				}
				else  // normal cell
				{
					var ops = {
						'rowData': rowData,
						'cellKey': key,
						'cellValue': value,
						'rowIndex': i,
						'colIndex': j
					};
					this.doCreateDataCellContent(wrapperElem, ops);
				}
				cellElem.appendChild(wrapperElem);
				rowElem.appendChild(cellElem);
			}
			result.appendChild(rowElem);
		}
		parentElem.appendChild(result);
		return result;
	},

	/**
	 * Create content of body cell in table.
	 * Descendants may override this method.
	 * @param {HTMLElement} parentElem
	 * @param {Hash} options A hash that containing essential infos about cell, including:
	 *   {
	 *     rowData: Hash,
	 *     cellKey: String,
	 *     cellValue: Variant,
	 *     rowIndex: Integer,
	 *     colIndex: Integer
	 *   }
	 * @private
	 */
	doCreateDataCellContent: function(parentElem, options)
	{
		// TODO: need a better method to convert to string
		var svalue = '';
		if (Kekule.ObjUtils.notUnset(options.cellValue))
			svalue = '' + options.cellValue;
		DU.setElementText(parentElem, svalue);
	},
	/**
	 * Create content of cell in check column in table.
	 * Descendants may override this method and must return a created checkable widget.
	 * @param {HTMLElement} parentElem
	 * @param {Hash} options A hash that containing essential infos about cell, including:
	 *   {
	 *     rowData: Hash,
	 *     rowIndex: Integer,
	 *     colIndex: Integer,
	 *     childWidgetDefinitions: Hash
	 *   }
	 * @returns {Kekule.Widget.BaseWidget}
	 * @private
	 */
	doCreateCheckCellContent: function(parentElem, options)
	{
		var result = new Kekule.Widget.CheckBox(this);
		result.appendToElem(parentElem);
		return result;
	},
	/**
	 * Create content of cell in operation column in table.
	 * Descendants may override this method and must return a created operation widget.
	 * @param {HTMLElement} parentElem
	 * @param {Hash} options A hash that containing essential infos about cell, including:
	 *   {
	 *     rowData: Hash,
	 *     rowIndex: Integer,
	 *     colIndex: Integer,
	 *     childWidgetDefinitions: Hash
	 *   }
	 * @returns {Kekule.Widget.BaseWidget}
	 * @private
	 */
	doCreateOperCellContent: function(parentElem, options)
	{
		var toolbar = this.doCreateOperToolbar(parentElem, options.childWidgetDefinitions);
		var SM = Kekule.Widget.DataTable.OperColShowMode;
		var mode = this.getOperColShowMode();
		if (mode !== SM.ALL)
		{
			toolbar.setVisible(false);
		}
		return toolbar;
	},
	doCreateOperToolbar: function(parentElem, childDefinitions)
	{
		var result = new Kekule.Widget.ButtonGroup(this);
		result.setChildDefs(childDefinitions);
		result.appendToElem(parentElem);
		return result;
	},

	/** @private */
	getDefaultOperButtons: function()
	{
		var CS = Kekule.Widget.DataTable.Components;
		return [CS.EDIT, CS.DELETE];
	},
	/** @private */
	getOperWidgetDefinitions: function()
	{
		var result = [];
		var comps = this.getOperWidgets() || this.getDefaultOperButtons();
		for (var i = 0, l = comps.length; i < l; ++i)
		{
			var comp = comps[i];
			if (DataType.isObjectValue(comp))
				result.push(comp);
			else  // predefined names
			{
				var def = this.getDefaultComponentDefinitionHash(comp);
				if (def)
					result.push(def);
			}
		}
		return result;
	},
	/** @private */
	getDefaultComponentDefinitionHash: function(compName)
	{
		var CS = Kekule.Widget.DataTable.Components;
		var result;
		if (compName === CS.EDIT)
		{
			result = {
				'widget': 'Kekule.Widget.Button', 'htmlClass': CNS.DATATABLE_EDIT,
				'text': Kekule.$L('WidgetTexts.CAPTION_DATATABLE_EDIT'), 'hint': Kekule.$L('WidgetTexts.HINT_DATATABLE_EDIT'),
				'#execute': this.reactOperEditBind
			};
		}
		else if (compName === CS.DELETE)
		{
			result = {
				'widget': 'Kekule.Widget.Button', 'htmlClass': CNS.DATATABLE_DELETE,
				'text': Kekule.$L('WidgetTexts.CAPTION_DATATABLE_DELETE'), 'hint': Kekule.$L('WidgetTexts.HINT_DATATABLE_DELETE'),
				'#execute': this.reactOperDeleteBind
			};
		}
		else if (compName === CS.INSERT)
		{
			result = {
				'widget': 'Kekule.Widget.Button', 'htmlClass': CNS.DATATABLE_INSERT,
				'text': Kekule.$L('WidgetTexts.CAPTION_DATATABLE_INSERT'), 'hint': Kekule.$L('WidgetTexts.HINT_DATATABLE_INSERT'),
				'#execute': this.reactOperInsertBind
			};
		}
		if (result)
			result.internalName = compName;
		return result;
	},

	/**
	 * Whether data is provided by external dataset or data pager.
	 * @private
	 */
	hasExternalDataProvider: function()
	{
		return !!this.getDataPager();
	},

	/**
	 * Returns whether the data need to be sorted.
	 * @private
	 */
	needSort: function()
	{
		return this.getSortFields() || this.getSortFunc();
	},
	/**
	 * Sort data in table.
	 * @private
	 */
	sortData: function()
	{
		var data = this.getData() || [];
		if (this.needSort())
		{
			/*
			var sortFields = this.getSortFields();
			var sortFieldInfos = [];
			for (var i = 0, l = sortFields.length; i < l; ++i)
			{
				var info = {};
				var field = sortFields[i] || '';
				if (field.startsWith(this.PREFIX_SORT_DESC))  // sort desc
				{
					info.field = field.substr(1);
					info.desc = true;
				}
				else
				{
					info.field = field;
					info.desc = false;
				}
				sortFieldInfos.push(info);
			}
			*/

			if (!this.hasExternalDataProvider()) // if using datapager, sort by external dataset
			{
				var dupData = Kekule.ArrayUtils.clone(data);
				/*
				var sortFunc = this.getSortFunc() || function(hash1, hash2)
					{
						var compareValue = 0;
						for (var i = 0, l = sortFieldInfos.length; i < l; ++i)
						{
							var field = sortFieldInfos[i].field;
							var v1 = hash1[field] || '';
							var v2 = hash2[field] || '';
							compareValue = (v1 > v2) ? 1 :
								(v1 < v2) ? -1 : 0;
							if (sortFieldInfos[i].desc)
								compareValue = -compareValue;
							if (compareValue !== 0)
								break;
						}
						return compareValue;
					};
				dupData.sort(sortFunc);
				*/
				Kekule.ArrayUtils.sortHashArray(dupData, this.getSortFields());
				return dupData;
			}
		}

		return data;
	},
	/**
	 * Prepare final data to display.
	 * @private
	 */
	prepareData: function()
	{
		var result = {};
		var data = this.sortData();
		result.data = data;

		var createDefaultCols = function(data)
		{
			var fields = [];
			for (var i = 0, l = data.length; i < l; ++i)
			{
				var currFields = Kekule.ObjUtils.getOwnedFieldNames(data[i]);
				Kekule.ArrayUtils.pushUnique(fields, currFields);
			}
			var columns = [];
			for (var i = 0, l = fields.length; i < l; ++i)
			{
				columns.push({'name': fields[i], 'text': fields[i]});
			}
			return columns;
		};

		if (this.getColumns())  // column definition set, use it to decide shown columns
		{
			result.columns = Kekule.ArrayUtils.clone(this.getColumns());
		}
		else  // else get column heads by data fields
		{
			/*
			var fields = [];
			for (var i = 0, l = data.length; i < l; ++i)
			{
				var currFields = Kekule.ObjUtils.getOwnedFieldNames(data[i]);
				Kekule.ArrayUtils.pushUnique(fields, currFields);
			}
			result.columns = [];
			for (var i = 0, l = fields.length; i < l; ++i)
			{
				result.columns.push({'name': fields[i], 'text': fields[i]});
			}
			*/
			result.columns = createDefaultCols(data);
		}
		// add default col/cell class names
		//for (var i = 0, l = result.columns.length; i < l; ++i)
		var i = 0;
		while (i < result.columns.length)
		{
			var col = result.columns[i];

			if (typeof(col) === 'string')
				col = {'name': col};

			if (col.name === this.COLNAME_OPER)
			{
				result.columns[i] = {'name': '', 'text': '', 'disableInteract': true, 'isOperCol': true,
					'colClassName': CNS.DATATABLE_OPER_COL, 'className': CNS.DATATABLE_OPER_CELL};
			}
			else if (col.name === this.COLNAME_CHECK)
			{
				result.columns[i] = {'name': '', 'text': '', 'disableInteract': true, 'isCheckCol': true,
					'colClassName': CNS.DATATABLE_CHECK_COL, 'className': CNS.DATATABLE_CHECK_CELL};
			}
			else if (col.name === this.COLNAME_ALL)
			{
				var newCols = createDefaultCols(data);
				var arg = newCols;
				arg.unshift(1);
				arg.unshift(i);
				result.columns.splice.apply(result.columns, arg);
			}
			else
			{
				col.colClassName = CNS.DATATABLE_DATA_COL + ' ' + (col.colClassName || '');
				col.className = CNS.DATATABLE_DATA_CELL + ' ' + (col.className || '');
			}
			++i;
		}
		// mark column sort states
		if (this.needSort() && !this.getSortFunc())  // sort by fields
		{
			var sortFields = this.getSortFields();
			for (var i = 0, l = result.columns.length; i < l; ++i)
			{
				var colDef = result.columns[i];
				var colName = colDef.name;
				if (sortFields.indexOf(colName) >= 0)
					result.columns[i].sorting = 1;  // mark sort asc
				else if (sortFields.indexOf(this.PREFIX_SORT_DESC + colName) >= 0)
					result.columns[i].sorting = -1;  // mark sort desc
				else // no sort
					result.columns[i].sorting = 0;
			}
		}
		/*
		// if necessary, add operation column and check column
		if (this.getShowOperCol())
		{
			result.columns.push({'name': '', 'text': '', 'enableInteract': false, 'isOperCol': true,
				'colClassName': CNS.DATATABLE_OPER_COL, 'className': CNS.DATATABLE_OPER_CELL});
		}
		*/
		return result;
	},

	/** @private */
	activeRowChanged: function(oldRow, newRow)
	{
		var SM = Kekule.Widget.DataTable.OperColShowMode;
		var operShowMode = this.getOperColShowMode();
		if (oldRow)
		{
			EU.removeClass(oldRow, CNS.STATE_ACTIVE);
			if (operShowMode === SM.ACTIVE || operShowMode === SM.HOVER)
				this.hideRowOperToolbar(oldRow);
		}
		if (newRow)
		{
			EU.addClass(newRow, CNS.STATE_ACTIVE);
			if (operShowMode === SM.ACTIVE || operShowMode === SM.HOVER)
				this.showRowOperToolbar(newRow);
		}
	},
	/** @private */
	hoverRowChanged: function(oldRow, newRow)
	{
		var SM = Kekule.Widget.DataTable.OperColShowMode;
		var operShowMode = this.getOperColShowMode();
		if (oldRow)
		{
			EU.removeClass(oldRow, CNS.STATE_HOVER);
			if (operShowMode === SM.HOVER && oldRow !== this.getActiveRow())
				this.hideRowOperToolbar(oldRow);
		}
		if (newRow)
		{
			EU.addClass(newRow, CNS.STATE_HOVER);
			if (operShowMode === SM.HOVER)
				this.showRowOperToolbar(newRow);
		}
	},

	/**
	 * Returns nearest parent cell element.
	 * @param {HTMLElement} elem
	 * @return {HTMLElement}
	 */
	getParentCell: function(elem)
	{
		if (DU.isDescendantOf(elem, this.getElement()))
			return DU.getNearestAncestorByTagName(elem, 'td', true);
		else
			return null;
	},
	/**
	 * Returns nearest parent head cell element.
	 * @param {HTMLElement} elem
	 * @return {HTMLElement}
	 */
	getParentHeadCell: function(elem)
	{
		if (DU.isDescendantOf(elem, this.getElement()))
			return DU.getNearestAncestorByTagName(elem, 'th', true);
		else
			return null;
	},
	/**
	 * Returns nearest parent data row element.
	 * @param {HTMLElement} elem
	 * @return {HTMLElement}
	 */
	getParentRow: function(elem)
	{
		if (DU.isDescendantOf(elem, this.getElement()))
			return DU.getNearestAncestorByTagName(elem, 'tr', true);
		else
			return null;
	},
	/**
	 * Returns count of columns defined by property columns.
	 * @returns {Int}
	 */
	getColCount: function()
	{
		return (this.getColumns() || []).length;
	},
	/**
	 * Returns count of rows defined by property data.
	 * @returns {Int}
	 */
	getRowCount: function()
	{
		return (this.getData() || []).length;
	},

	/**
	 * Returns all data row elements in table.
	 * @returns {Array}
	 */
	getDataRows: function()
	{
		var result = [];
		var tbody = this.getElement().getElementsByTagName('tbody')[0];
		return tbody && tbody.getElementsByTagName('tr');
	},
	/**
	 * Returns all checked data row elements in table.
	 * @returns {Array}
	 */
	getCheckedRows: function()
	{
		var result = [];
		var rows = this.getDataRows();
		for (var i = 0, l = rows.length; i < l; ++i)
		{
			if (this.isRowChecked(rows[i]))
				result.push(rows[i]);
		}
		return result;
	},

	/**
	 * Returns data associated with a row element.
	 * @param {HTMLElement} rowElem
	 * @returns {Variant}
	 */
	getRowData: function(rowElem)
	{
		return rowElem? rowElem[this.ROWDATA_FIELD]: null;
	},
	/**
	 * Returns whether check box of a row is checked.
	 * @param {HTMLElement} rowElem
	 * @returns {Bool}
	 */
	isRowChecked: function(rowElem)
	{
		var c = this.getRowCheckBox(rowElem);
		return c && c.getChecked && c.getChecked();
	},

	/**
	 * Returns check box inside row.
	 * @param {HTMLElement} rowElem
	 * @returns {Kekule.Widget.BaseWidget}
	 * @private
	 */
	getRowCheckBox: function(rowElem)
	{
		return rowElem && rowElem[this.ROW_CHECKBOX_FIELD];
	},
	/**
	 * Returns operation toolbar inside row.
	 * @param {HTMLElement} rowElem
	 * @returns {Kekule.Widget.BaseWidget}
	 * @private
	 */
	getRowOperToolbar: function(rowElem)
	{
		return rowElem? rowElem[this.ROW_OPER_TOOLBAR_FIELD]: null;
	},
	/** @private */
	showRowOperToolbar: function(rowElem)
	{
		var w = this.getRowOperToolbar(rowElem);
		if (w)
			w.setVisible(true);
	},
	/** @private */
	hideRowOperToolbar: function(rowElem)
	{
		var w = this.getRowOperToolbar(rowElem);
		if (w)
			w.setVisible(false);
	},

	/**
	 * Called when dataPager property is changed.
	 * @param newPager
	 * @param oldPager
	 * @private
	 */
	dataPagerChanged: function(newPager, oldPager)
	{
		if (oldPager)
		{
			oldPager.removeEventListener('pageRetrieve', this.reactPagerRetrieve, this);
			oldPager.removeEventListener('dataFetched', this.reactPagerFetched, this);
			oldPager.removeEventListener('dataError', this.reactPagerError, this);
		}
		if (newPager)
		{
			newPager.addEventListener('pageRetrieve', this.reactPagerRetrieve, this);
			newPager.addEventListener('dataFetched', this.reactPagerFetched, this);
			newPager.addEventListener('dataError', this.reactPagerError, this);
			this.setData(newPager.getCurrPageData());
		}
	},
	/** @private */
	reactPagerRetrieve: function(e)
	{
		if (this.reportMessage)
		{
			this._loadingDataMsg = this.reportMessage(Kekule.$L('WidgetTexts.MSG_RETRIEVING_DATA'), Kekule.Widget.MsgType.INFO);
		}
	},
	/** @private */
	reactPagerFetched: function(e)
	{
		this.setData(e.data);
		if (this._loadingDataMsg && this.removeMessage)
			this.removeMessage(this._loadingDataMsg);
	},
	/** @private */
	reactPagerError: function(e)
	{
		if (this._loadingDataMsg && this.removeMessage)
			this.removeMessage(this._loadingDataMsg);
		if (this.flashMessage)
			this.flashMessage(e.error.message || e.error, Kekule.Widget.MsgType.ERROR);
	},

	// event handlers of operation col
	/** @private */
	reactOperEdit: function(e)
	{

		return this.reactOperExecute(TCS.EDIT, e);
	},
	/** @private */
	reactOperDelete: function(e)
	{
		return this.reactOperExecute(TCS.DELETE, e);
	},
	/** @private */
	reactOperInsert: function(e)
	{
		return this.reactOperExecute(TCS.INSERT, e);
	},
	/**
	 * Called when widget in operation column cell is executed.
	 * @param {String} compName Predefined button name.
	 * @param {Object} e Normal execute event params.
	 * @private
	 */
	reactOperExecute: function(compName, e)
	{
		var target = e.target;
		var rowElem = this.getParentRow(target.getElement());
		var rowData = this.getRowData(rowElem);
		return this.doReactOperExecute(compName, rowData, rowElem, e);
	},
	/**
	 * Called when widget in operation column cell is executed.
	 * @param {String} compName Predefined button name.
	 * @param {Variant} rowData
	 * @param {HTMLElement} rowElem
	 * @param {Object} e Normal execute event params.
	 * Descendant may override this method.
	 */
	doReactOperExecute: function(compName, rowData, rowElem, e)
	{
		// do nothing here
		//console.log('execute on', compName, rowData);
	},

	// event handlers
	/** @ignore */
	react_click: function($super, e)
	{
		$super(e);
		var elem = e.getTarget();
		// if click on head cell, sort this column
		var headCell = this.getParentHeadCell(elem);
		if (headCell)
			this._autoSortOnHeadCell(headCell);
		else
		{
			if (this.getEnableActiveRow())
			{
				// if click on data row, set row active
				var dataCell = this.getParentCell(elem);
				if (dataCell)
				{
					this.setActiveCell(dataCell);
				}
			}
		}
	},
	/** @ignore */
	react_mouseover: function($super, e)
	{
		$super(e);
		var elem = e.getTarget();
		if (this.getEnableActiveRow())
		{
			var dataCell = this.getParentCell(elem);
			if (dataCell)
				this.setHoverCell(dataCell);
			else
				this.setHoverCell(null);
		}
	},
	/** @ignore */
	react_mouseleave: function($super, e)
	{
		$super(e);
		var elem = e.getTarget();
		if (this.getEnableActiveRow())
		{
			this.setHoverCell(null);
		}
	},

	/** @private */
	_autoSortOnHeadCell: function(headCell)
	{
		if (headCell && this.getEnableHeadInteraction())
		{
			var colDef = headCell[this.COLDEF_FIELD];
			if (colDef && !colDef.disableInteract)
			{
				var sortField = colDef.name;
				if (colDef.sorting === 1)
					sortField = this.PREFIX_SORT_DESC + sortField;
				this.setSortFields([sortField]);
			}
		}
	},

	// public methods
	/**
	 * Set data and sort fields at same time.
	 * @param {Array} data
	 * @param {Array} columns
	 * @param {Array} sortFields
	 * @param {Func} sortFunc
	 */
	load: function(data, columns, sortFields, sortFunc)
	{
		this.beginUpdate();
		try
		{
			this.setData(data);
			this.setColumns(columns);
			this.setSortFields(sortFields ? Kekule.ArrayUtils.toArray(sortFields) : null);
			this.setSortFunc(sortFunc);
		}
		finally
		{
			this.endUpdate();
		}
		return this;
	},
	/**
	 * Reload data in table.
	 */
	reload: function()
	{
		this.recreateChildContent();
		return this;
	}
});
/**
 * Enumeration of mode to show operation column in data table widget.
 * @enum
 */
Kekule.Widget.DataTable.OperColShowMode = {
	NONE: 'none',
	ACTIVE: 'active',
	HOVER: 'hover',
	ALL: 'all'
};
/**
 * Possible child components inside data table.
 * @enum
 */
Kekule.Widget.DataTable.Components = {
	// Operation buttons
	EDIT: 'edit',
	DELETE: 'delete',
	INSERT: 'insert'
};
var TCS = Kekule.Widget.DataTable.Components;

/**
 * An widget to help to navigate between pages, including navigator buttons and page index inputor.
 * @class
 * @augments Kekule.Widget.ButtonGroup
 *
 * @property {Array} components Component names to show in navigator, may containing the following value:
 *   [
 *     'first', 'prev', 'next', 'last', 'pageInput' (text box to input page index), 'pageSelect' (selector to show drop down list of pages)
 *   ]
 *   In the array widget definition hash can also be used.
 * @property {Int} firstIndex First page index.
 * @property {Int} lastIndex Last page index.
 * @property {Int} currIndex Current page index.
 * @property {Kekule.Widget.DataPager} dataPager Source pager associate with this widget.
 */
/**
 * Invoked when current page index is changed.
 *   event param of it has field: {currIndex}
 * @name Kekule.Widget.PageNavigator#pageChange
 * @event
 */
Kekule.Widget.PageNavigator = Class.create(Kekule.Widget.ButtonGroup,
/** @lends Kekule.Widget.PageNavigator# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.PageNavigator',
	/** @private */
	initProperties: function()
	{
		this.defineProp('components', {'dataType': DataType.ARRAY});
		this.defineProp('firstIndex', {'dataType': DataType.INT});
		this.defineProp('lastIndex', {'dataType': DataType.INT});
		this.defineProp('currIndex', {'dataType': DataType.INT});
		this.defineProp('dataPager', {'dataType': 'Kekule.Widget.DataPager',
			'setter': function(value)
			{
				var old = this.getDataPager();
				if (old !== value)
				{
					this.setPropStoreFieldValue('dataPager', value);
					this.dataPagerChanged(value, old);
				}
			}
		});
	},
	/** @ignore */
	initPropValues: function($super)
	{
		$super();
		this.setShowText(true);
		this.setShowGlyph(true);
		this.setFirstIndex(1);

		this.reactFirstBind = this.reactFirst.bind(this);
		this.reactLastBind = this.reactLast.bind(this);
		this.reactPrevBind = this.reactPrev.bind(this);
		this.reactNextBind = this.reactNext.bind(this);
		this.reactPageInputChangeBind = this.reactPageInputChange.bind(this);
	},
	/** @ignore */
	doObjectChange: function($super, modifiedPropNames)
	{
		$super(modifiedPropNames);
		if (Kekule.ArrayUtils.intersect(modifiedPropNames, ['firstIndex', 'lastIndex', 'currIndex']).length)
		{
			this.updateChildComponent();
		}
		if (modifiedPropNames.indexOf('currIndex') >= 0)
			this.invokeEvent('pageChange', {'currIndex': this.getCurrIndex()});
	},

	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.PAGENAVIGATOR;
	},
	/** @ignore */
	doCreateSubElements: function(doc, rootElem)
	{
		return this.recreateChildContent(doc, rootElem);
	},

	/** @private */
	getDefaultComponents: function()
	{
		return [PNC.FIRST, PNC.PREV, /*PNC.PAGEINPUT,*/ PNC.PAGESELECTOR, PNC.NEXT, PNC.LAST];
	},
	/** @private */
	recreateChildContent: function()
	{
		var comps = this.getComponents() || this.getDefaultComponents();
		var widgetDefs = [];
		for (var i = 0, l = comps.length; i < l; ++i)
		{
			var comp = comps[i];
			if (DataType.isObjectValue(comp))  // hash
				widgetDefs.push(comp);
			else  // string, name
			{
				var def = this.getDefaultComponentDefinitionHash(comp);
				if (def)
					widgetDefs.push(def);
			}
		}
		this.setChildDefs(widgetDefs);
		this.updateChildComponent();
	},
	/** @private */
	getDefaultComponentDefinitionHash: function(compName)
	{
		var result;
		if (compName === PNC.FIRST)
		{
			result = {
				'widget': 'Kekule.Widget.Button', 'htmlClass': CNS.PAGENAVIGATOR_FIRST,
				'text': Kekule.$L('WidgetTexts.CAPTION_FIRST_PAGE'), 'hint': Kekule.$L('WidgetTexts.HINT_FIRST_PAGE'),
				'#execute': this.reactFirstBind
			};
		}
		else if (compName === PNC.LAST)
		{
			result = {
				'widget': 'Kekule.Widget.Button', 'htmlClass': CNS.PAGENAVIGATOR_LAST,
				'text': Kekule.$L('WidgetTexts.CAPTION_LAST_PAGE'), 'hint': Kekule.$L('WidgetTexts.HINT_LAST_PAGE'),
				'#execute': this.reactLastBind
			};
		}
		else if (compName === PNC.PREV)
		{
			result = {
				'widget': 'Kekule.Widget.Button', 'htmlClass': CNS.PAGENAVIGATOR_PREV,
				'text': Kekule.$L('WidgetTexts.CAPTION_PREV_PAGE'), 'hint': Kekule.$L('WidgetTexts.HINT_PREV_PAGE'),
				'#execute': this.reactPrevBind
			};
		}
		else if (compName === PNC.NEXT)
		{
			result = {
				'widget': 'Kekule.Widget.Button', 'htmlClass': CNS.PAGENAVIGATOR_NEXT,
				'text': Kekule.$L('WidgetTexts.CAPTION_NEXT_PAGE'), 'hint': Kekule.$L('WidgetTexts.HINT_NEXT_PAGE'),
				'#execute': this.reactNextBind
			};
		}
		else if (compName === PNC.PAGEINPUT)
		{
			result = {
				'widget': 'Kekule.Widget.TextBox', 'htmlClass': [CNS.PAGENAVIGATOR_PAGEINPUT, CNS.PAGENAVIGATOR_PAGEINDEXER],
				'hint': Kekule.$L('WidgetTexts.HINT_CURR_PAGE'),
				'#valueChange': this.reactPageInputChangeBind
			};
		}
		else if (compName === PNC.PAGESELECTOR)
		{
			result = {
				'widget': 'Kekule.Widget.SelectBox', 'htmlClass': [CNS.PAGENAVIGATOR_PAGESELECTOR, CNS.PAGENAVIGATOR_PAGEINDEXER],
				'hint': Kekule.$L('WidgetTexts.HINT_CURR_PAGE'),
				'#valueChange': this.reactPageInputChangeBind
			};
		}
		else
			result = null;
		if (result)
			result.internalName = compName;
		return result;
	},
	/**
	 * Returns redefined child widget by component name.
	 * @param {String} compName
	 * @returns {Kekule.Widget.BaseWidget}
	 */
	getComponent: function(compName)
	{
		return this.getChildWidgetByInternalName(compName);
	},
	/** @private */
	setChildComponentEnabled: function(compName, enabled)
	{
		var w = this.getComponent(compName);
		if (w)
			w.setEnabled(enabled);
	},
	/**
	 * Update state of child components due to page index change.
	 * @private
	 */
	updateChildComponent: function()
	{
		var firstIndex = this.getFirstIndex() || 0;
		var lastIndex = this.getLastIndex() || 0;
		var currIndex = this.getCurrIndex() || 0;
		var isFirst = currIndex <= firstIndex;
		var isLast = currIndex >= lastIndex;
		this.setChildComponentEnabled(PNC.FIRST, !isFirst);
		this.setChildComponentEnabled(PNC.PREV, !isFirst);
		this.setChildComponentEnabled(PNC.NEXT, !isLast);
		this.setChildComponentEnabled(PNC.LAST, !isLast);
		this.setChildComponentEnabled(PNC.PAGEINPUT, lastIndex > firstIndex);
		this.setChildComponentEnabled(PNC.PAGESELECTOR, lastIndex > firstIndex);

		// change page index
		var pageInput = this.getComponent(PNC.PAGEINPUT);
		if (pageInput)
			pageInput.setValue(currIndex);
		var pageSelector = this.getComponent(PNC.PAGESELECTOR);
		if (pageSelector)
		{
			var items = [];
			for (var i = firstIndex; i <= lastIndex; ++i)
			{
				items.push({'value': i});
			}
			pageSelector.setItems(items);
			pageSelector.setValue(currIndex);
		}
	},

	/**
	 * Called when dataPager property is changed.
	 * @param newPager
	 * @param oldPager
	 * @private
	 */
	dataPagerChanged: function(newPager, oldPager)
	{
		if (oldPager)
		{
			oldPager.removeEventListener('dataFetched', this.reactPagerFetched, this);
			newPager.removeEventListener('pageCountChange', this.reactPagerPageCountChange, this);
		}
		if (newPager)
		{
			newPager.addEventListener('dataFetched', this.reactPagerFetched, this);
			newPager.addEventListener('pageCountChange', this.reactPagerPageCountChange, this);
			this.updatePageDetails(newPager);
			this.setCurrIndex(newPager.getCurrPageIndex() + this.getFirstIndex());
		}
	},
	/** @private */
	reactPagerFetched: function(e)
	{
		this.setCurrIndex(e.pageIndex + this.getFirstIndex());
	},
	/** @private */
	reactPagerPageCountChange: function(e)
	{
		this.updatePageDetails(this.getDataPager());
	},
	/** @private */
	updatePageDetails: function(pager)
	{
		var firstIndex = this.getFirstIndex();
		this.setLastIndex(pager.getPageCount() + firstIndex - 1);
	},

	/** @private */
	requestChangeCurrIndex: function(newIndex)
	{
		var pager = this.getDataPager();
		if (pager)
		{
			pager.switchToPage(newIndex - this.getFirstIndex());
		}
		else
			this.setCurrIndex(newIndex);
	},

	// Event handlers
	/** @private */
	reactFirst: function(e)
	{
		this.requestChangeCurrIndex(this.getFirstIndex() || 0);
	},
	/** @private */
	reactLast: function(e)
	{
		this.requestChangeCurrIndex(this.getLastIndex() || 0);
	},
	/** @private */
	reactPrev: function(e)
	{
		var firstIndex = this.getFirstIndex() || 0;
		var currIndex = this.getCurrIndex() || 0;
		this.requestChangeCurrIndex(Math.max(currIndex - 1, firstIndex));
	},
	/** @private */
	reactNext: function(e)
	{
		var lastIndex = this.getLastIndex() || 0;
		var currIndex = this.getCurrIndex() || 0;
		this.requestChangeCurrIndex(Math.min(currIndex + 1, lastIndex));
	},
	/** @private */
	reactPageInputChange: function(e)
	{
		var value = e.target.getValue();
		if (typeof(value) === 'string')
			value = parseInt(value);
		var firstIndex = this.getFirstIndex() || 0;
		var lastIndex = this.getLastIndex() || 0;
		if (value >= firstIndex && value <= lastIndex)
			this.requestChangeCurrIndex(value);
		else
			Kekule.error(Kekule.$L('ErrorMsg.PAGE_INDEX_OUTOF_RANGE'));
	}
});
/**
 * Component names used in {@link Kekule.Widget.PageNavigator}
 * @enum
 */
Kekule.Widget.PageNavigator.Components = {
	FIRST: 'first',
	LAST: 'last',
	PREV: 'prev',
	NEXT: 'next',
	PAGEINPUT: 'pageInput',
	PAGESELECTOR: 'pageSelector'
};
var PNC = Kekule.Widget.PageNavigator.Components;




})();
