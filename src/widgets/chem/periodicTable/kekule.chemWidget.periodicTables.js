/**
 * @fileoverview
 * Implementation of periodic table of elements.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /widgets/kekule.Widget.base.js
 * requires /widgets/chem/kekule.chemWidget.base.js
 * requires /data/kekule.chemicalElementsData.js
 * requires /data/kekule.isotopesData.js
 */

(function(){
"use strict";

var DU = Kekule.DomUtils;
var EU = Kekule.HtmlElementUtils;
//var CWT = Kekule.ChemWidgetTexts;
var CNS = Kekule.Widget.HtmlClassNames;
var CCNS = Kekule.ChemWidget.HtmlClassNames;

/** @ignore */
Kekule.ChemWidget.HtmlClassNames = Object.extend(Kekule.ChemWidget.HtmlClassNames, {
	PERIODIC_TABLE: 'K-Chem-Periodic-Table',
	PERIODIC_TABLE_MINI: 'K-Chem-Periodic-Table-Mini',
	PERIODIC_TABLE_LEGEND: 'K-Chem-Periodic-Table-Legend',
	PERIODIC_TABLE_LEGEND_CONTENT: 'K-Chem-Periodic-Table-Legend-Content',
	PERIODIC_TABLE_LEGEND_COLORS: 'K-Chem-Periodic-Table-Legend-Colors',
	PERIODIC_TABLE_LEGEND_COLOR: 'K-Chem-Periodic-Table-Legend-Color',
	PERIODIC_TABLE_MAINTABLE: 'K-Chem-Periodic-Table-MainTable',
	PERIODIC_TABLE_EXTRATABLE: 'K-Chem-Periodic-Table-ExtraTable',
	PERIODIC_TABLE_ELEM_CELL: 'K-Chem-Periodic-Table-Elem-Cell',
	PERIODIC_TABLE_ELEM_STUBSCELL: 'K-Chem-Periodic-Table-Elem-StubsCell',
	PERIODIC_TABLE_ELEM_CELL_CONTENT: 'K-Chem-Periodic-Table-Elem-Cell-Content',
	PERIODIC_TABLE_LEGEND_ELEM_CELL_CONTENT: 'K-Chem-Periodic-Table-Elem-Cell-Content',
	PERIODIC_TABLE_HEAD_CELL: 'K-Chem-Periodic-Table-Head-Cell',
	PERIODIC_TABLE_HEAD_CELL_CONTENT: 'K-Chem-Periodic-Table-Head-Cell-Content',
	PERIODIC_TABLE_HEAD_CELL_GROUP: 'K-Chem-Periodic-Table-Head-Cell-Group',
	PERIODIC_TABLE_HEAD_CELL_PERIOD: 'K-Chem-Periodic-Table-Head-Cell-Period',

	ELEM_SYMBOL: 'K-Chem-Elem-Symbol',
	ELEM_SYMBOL_STUBS: 'K-Chem-Elem-Symbol-Stubs',
	ELEM_NAME: 'K-Chem-Elem-Name',
	ATOMIC_NUM: 'K-Chem-Atomic-Num',
	ATOMIC_WEIGHT: 'K-Chem-Atomic-Weight'
});

Kekule.globalOptions.add('chemWidget.periodicTable',{
	'displayedComponents': ['symbol', 'name', 'atomicNumber', /*'atomicWeight',*/ 'groupHead', /*'periodHead',*/ 'legend']
});

/**
 * An widget to display periodic table and to select element on it.
 * @class
 * @augments Kekule.ChemWidget.AbstractWidget
 *
 * @param {Array} displayedComponents An array of string that decides which information of elements need to be shown in periodic table.
 *
 * @property {Array} displayedComponents An array of string that decides which information of elements need to be shown in periodic
 *   table. The array may contains the following items:
 *   ['symbol', 'name', 'atomicNumber', 'atomicWeight', 'groupHead', 'periodHead', 'legend']
 * @property {Int} startingAtomNum
 * @property {Int} endingAtomNum
 * @property {Bool} useMiniMode If true, table will be in small size and only show atom symbol/number information.
 * @property {Bool} enableSelect Whether user can interact with table and select element on it.
 * @property {Bool} enableMultiSelect Whether user can interact with table and select multiple elements on it.
 * @property {Hash} selected Selected element data.
 * @property {Array} selection Array of selected elements data (in multiselect mode).
 * @property {String} selectedSymbol Selected element symbol.
 * @property {Array} selectedSymbols Array of selected symbols (in multiselect mode).
 */
/**
 * Invoked when the an element is selected in periodic table.
 *   event param of it has one fields: {elemData: Object}
 * @name Kekule.ChemWidget.PeriodicTable#select
 * @event
 */
/**
 * Invoked when the an element is deselected in periodic table.
 *   event param of it has one fields: {elemData: Object}
 * @name Kekule.ChemWidget.PeriodicTable#deselect
 * @event
 */
Kekule.ChemWidget.PeriodicTable = Class.create(Kekule.ChemWidget.AbstractWidget,
/** @lends Kekule.ChemWidget.PeriodicTable# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.PeriodicTable',
	/** @private */
	BINDABLE_TAG_NAMES: ['span', 'div'],
	/** @private */
	ELEM_DATA_FIELD: '__$elemData__',
	/** @private */
	MAX_GROUP: 18,
	/** @private */
	MAX_PERIOD: 7,
	/** @private */
	LA_SERIES: ['La', 'Ce', 'Pr', 'Nd', 'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu'],
	/** @private */
	AC_SERIES: ['Ac', 'Th', 'Pa', 'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm', 'Md', 'No', 'Lr'],
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument, displayedComponents)
	{
		this.setPropStoreFieldValue('displayedComponents', displayedComponents || this.getDefaultDisplayedComponents());
		this._elemCells = [];  // used internally
		this._selectedElemCells = [];  // used internally
		$super(parentOrElementOrDocument);
		this.setEnableSelect(true);
		this.setEnableMultiSelect(true);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('displayedComponents', {'dataType': DataType.ARRAY,
			'getter': function()
			{
				return this.getPropStoreFieldValue('displayedComponents') || this.getDefaultDisplayedComponents();
			}
		});
		this.defineProp('startingAtomNum', {'dataType': DataType.INT});
		this.defineProp('endingAtomNum', {'dataType': DataType.INT});
		this.defineProp('useMiniMode', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('useMiniMode', value);
				if (value)
					this.addClassName(CCNS.PERIODIC_TABLE_MINI);
				else
					this.removeClassName(CCNS.PERIODIC_TABLE_MINI);
			}
		});
		this.defineProp('enableSelect', {'dataType': DataType.BOOL,
			'getter': function()
			{
				return this.getPropStoreFieldValue('enableSelect') || this.getEnableMultiSelect();
			}
		});
		this.defineProp('enableMultiSelect', {'dataType': DataType.BOOL});
		this.defineProp('selected', {'dataType': DataType.HASH, 'serializable': false, 'setter': null,
			'getter': function() { return this.getSelection()? this.getSelection()[0]: null; }
		});
		this.defineProp('selection', {'dataType': DataType.ARRAY, 'serializable': false, 'setter': null,
			'getter': function()
			{
				var result = [];
				var cellElems = this._selectedElemCells || [];
				for (var i = 0, l = cellElems.length; i < l; ++i)
				{
					var data = cellElems[i][this.ELEM_DATA_FIELD];
					if (data)
						result.push(data);
				}
				return result;
			}
		});
		this.defineProp('selectedSymbol', {'dataType': DataType.STRING,
			'getter': function() { return this.getSelectedSymbols()[0]; },
			'setter': function(value) { this.setSelectedSymbols([value]); }
		});
		this.defineProp('selectedSymbols', {'dataType': DataType.ARRAY,
			'getter': function()
			{
				var selection = this.getSelection();
				if (selection)
				{
					var result = [];
					for (var i = 0, l = selection.length; i < l; ++i)
						result.push(selection[i].symbol);
					return result;
				}
				return [];
			},
			'setter': function(value)
			{
				this.selectSymbols(value);
			}
		});
	},

	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CCNS.PERIODIC_TABLE;
	},
	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('div');
		return result;
	},
	/** @ignore */
	doCreateSubElements: function($super, doc, rootElem)
	{
		$super(doc, rootElem);
		var elem = this.createMainTable(doc, rootElem);
		return [elem];
	},

	/** @ignore */
	doObjectChange: function(modifiedPropNames)
	{
		var props = ['displayedComponents', 'startingAtomNum', 'endingAtomNum'];
		//if (modifiedPropNames.indexOf('displayedComponents') >= 0)  // need to recreate whole table
		if (Kekule.ArrayUtils.intersect(modifiedPropNames, props).length)
		{
			this.recreateMainTable();
		}
	},

	/** @private */
	getDefaultDisplayedComponents: function()
	{
		//return ['symbol', 'name', 'atomicNumber', /*'atomicWeight',*/ 'groupHead', /*'periodHead',*/ 'legend'];
		return Kekule.globalOptions.chemWidget.periodicTable.displayedComponents;
	},
	/** @private */
	getShowElemSymbol: function()
	{
		var comps = this.getDisplayedComponents();
		return comps.indexOf('symbol') >= 0;
	},
	/** @private */
	getShowElemName: function()
	{
		var comps = this.getDisplayedComponents();
		return comps.indexOf('name') >= 0;
	},
	/** @private */
	getShowAtomicNum: function()
	{
		var comps = this.getDisplayedComponents();
		return comps.indexOf('atomicNumber') >= 0;
	},
	/** @private */
	getShowAtomicWeight: function()
	{
		var comps = this.getDisplayedComponents();
		return comps.indexOf('atomicWeight') >= 0;
	},
	/** @private */
	getShowGroupHead: function()
	{
		var comps = this.getDisplayedComponents();
		return comps.indexOf('groupHead') >= 0;
	},
	/** @private */
	getShowPeriodHead: function()
	{
		var comps = this.getDisplayedComponents();
		return comps.indexOf('periodHead') >= 0;
	},
	/** @private */
	getShowLegend: function()
	{
		var comps = this.getDisplayedComponents();
		return comps.indexOf('legend') >= 0;
	},

	/**
	 * Clear old table and create a new one.
	 * @param doc
	 * @param parentElem
	 * @private
	 */
	recreateMainTable: function()
	{
		this.deselectAll();
		var elem = this.getElement();
		DU.clearChildContent(elem);
		this.createMainTable(elem.ownerDocument, elem);
	},
	/**
	 * Create periodic main table (without La/Ac series).
	 * @param {HTMLDocument} doc
	 * @param {HTMLElement} parentElem
	 * @returns {HTMLElement}
	 * @private
	 */
	createMainTable: function(doc, parentElem)
	{
		var elemData = Kekule.chemicalElementsData;
		var cells = [];
		this._elemCells = [];
		var extraCells = [];
		var series = [];

		var result = doc.createElement('table');
		// create all table rows and cells first (including head row)
		for (var row = 0; row <= this.MAX_PERIOD; ++row)
		{
			var rowElem = doc.createElement('tr');
			var rowCells = [];
			for (var col = 0; col <= this.MAX_GROUP; ++col)
			{
				var cellElem = doc.createElement('td');
				rowElem.appendChild(cellElem);
				rowCells.push(cellElem);
			}
			result.appendChild(rowElem);
			cells.push(rowCells);
		}

		// extra table for La/Ac series
		var extraTableElem = doc.createElement('table');
		for (var row = 0; row < 2; ++row)
		{
			var rowElem = doc.createElement('tr');
			var rowCells = [];
			for (var col = 0; col < this.LA_SERIES.length; ++col)
			{
				var cellElem = doc.createElement('td');
				rowElem.appendChild(cellElem);
				rowCells.push(cellElem);
			}
			extraTableElem.appendChild(rowElem);
			extraCells.push(rowCells);
		}

		// then fill content
		var startingIndex = this.getStartingAtomNum() || 0;
		var endingIndex = this.getEndingAtomNum() || 300000;
		for (var i = 0, l = elemData.length; i < l; ++i)
		{
			var curr = elemData[i];
			var atomNum = curr.atomicNumber;
			if (atomNum < startingIndex || atomNum > endingIndex)
				continue;

			var symbol = curr.symbol;
			var period = curr.period;
			var group = curr.group;
			var chemSerie = curr.chemicalSerie.replace(/\s/g, '');

			Kekule.ArrayUtils.pushUnique(series, curr.chemicalSerie);

			var cellElem;
			var laIndex = this.LA_SERIES.indexOf(symbol);
			var acIndex = this.AC_SERIES.indexOf(symbol);
			if (laIndex >= 0)  // Lanthanides
			{
				cellElem = extraCells[0][laIndex];
			}
			else if (acIndex >= 0)  // Actinides
			{
				cellElem = extraCells[1][acIndex];
			}
			else if (period && group)  // normal element
			{
				cellElem = cells[period][group];
			}

			if (cellElem)
			{
				cellElem.className = CCNS.PERIODIC_TABLE_ELEM_CELL; // + ' ' + chemSerie.upperFirst();
				cellElem.appendChild(this.createElemCellContent(doc, curr, chemSerie.upperFirst()));
				cellElem[this.ELEM_DATA_FIELD] = curr;
				this._elemCells.push(cellElem);
			}

			if ((laIndex === 0) || (acIndex === 0)) // create La/Ac stubs
			{
				cellElem = cells[period][group];
				cellElem.className = CCNS.PERIODIC_TABLE_ELEM_STUBSCELL;
				cellElem.appendChild(this.createElemCellStubsContent(doc, curr, chemSerie.upperFirst()));
			}
		}
		//console.log(series);

		// fill head
		if (this.getShowGroupHead())
		{
			var groupHeads = ['IA', 'IIA', 'IIIB', 'IVB', 'VB', 'VIB', 'VIIB', '', 'VIII', '', 'IB', 'IIB',
				'IIIA', 'IVA', 'VA', 'VIA', 'VIIA', 'VIIIA'];
			for (var col = 1; col <= this.MAX_GROUP; ++col)
			{
	      var row = (col === 1) || (col === 18)? 0:
					(col === 2) || (col >= 13)? 1:
					 3;
				var cellElem = cells[row][col];
				cellElem.className = CCNS.PERIODIC_TABLE_HEAD_CELL + ' ' + CCNS.PERIODIC_TABLE_HEAD_CELL_GROUP;
				cellElem.appendChild(this.createHeadContent(doc, groupHeads[col - 1]));
			}
		}
		if (this.getShowPeriodHead())
		{
			for (var row = 1; row <= this.MAX_PERIOD; ++row)
			{
				var cellElem = cells[row][0];
				cellElem.className = CCNS.PERIODIC_TABLE_HEAD_CELL + ' ' + CCNS.PERIODIC_TABLE_HEAD_CELL_PERIOD;
				cellElem.appendChild(this.createHeadContent(doc, row));
			}
		}

		parentElem.appendChild(result);

		// legend
		if (this.getShowLegend())
		{
			var legendElem = doc.createElement('a');
			legendElem.href="javascript:void(0)";
			legendElem.className = CCNS.PERIODIC_TABLE_LEGEND + ' ' + CNS.CORNER_ALL;
			DU.setElementText(legendElem, /*CWT.LEGEND_CAPTION*/ Kekule.$L('ChemWidgetTexts.LEGEND_CAPTION'));

			var legendContentElem = doc.createElement('div');
			legendContentElem.className = CCNS.PERIODIC_TABLE_LEGEND_CONTENT + ' ' + CNS.CORNER_ALL;
			// symbol legend
			var fakeInfo = {
				'symbol': Kekule.$L('ChemWidgetTexts.LEGEND_ELEM_SYMBOL'), //CWT.LEGEND_ELEM_SYMBOL,
				'atomicNumber': Kekule.$L('ChemWidgetTexts.LEGEND_ATOMIC_NUM'), //CWT.LEGEND_ATOMIC_NUM,
				'naturalMass': Kekule.$L('ChemWidgetTexts.LEGEND_ATOMIC_WEIGHT'), //CWT.LEGEND_ATOMIC_WEIGHT,
				'name': Kekule.$L('ChemWidgetTexts.LEGEND_ELEM_NAME') //CWT.LEGEND_ELEM_NAME
			}
			var symLegendElem = this.createElemCellContent(doc, fakeInfo, CCNS.PERIODIC_TABLE_LEGEND_ELEM_CELL_CONTENT);
			legendContentElem.appendChild(symLegendElem);
			// color legend
			var colorLegendElem = doc.createElement('div');
			colorLegendElem.className = CCNS.PERIODIC_TABLE_LEGEND_COLORS;
			for (var i = 0, l = series.length; i < l; ++i)
			{
				var elem = doc.createElement('div');
				elem.className = CCNS.PERIODIC_TABLE_LEGEND_COLOR + ' ' + series[i].replace(/\s/g, '');
				DU.setElementText(elem, series[i]);
				colorLegendElem.appendChild(elem);
			}
			legendContentElem.appendChild(colorLegendElem);
			legendElem.appendChild(legendContentElem);
			parentElem.appendChild(legendElem);
		}

		parentElem.appendChild(extraTableElem);

		return result;
	},
	/**
	 * Fill content in periodic table cell.
	 * @private
	 */
	createElemCellContent: function(doc, elemInfo, extraClass)
	{
		var result = doc.createElement('div');
		var className = CCNS.PERIODIC_TABLE_ELEM_CELL_CONTENT;
		if (extraClass)
			className += ' ' + extraClass;
		result.className = className;
		// symbol/name/atomic number/atomic weight
		if (this.getShowAtomicNum())
			result.appendChild(this.createElemContentComponent(doc, elemInfo.atomicNumber, CCNS.ATOMIC_NUM));
		if (this.getShowAtomicWeight())
		{
			var mass = elemInfo.naturalMass;
			if (mass)
			{
				var smass = (typeof(mass) === 'number')? mass.toFixed(3): mass;
				result.appendChild(this.createElemContentComponent(doc, smass, CCNS.ATOMIC_WEIGHT));
			}
			else  // mass not set?
			{
				result.appendChild(this.createElemContentComponent(doc, '\u00a0', CCNS.ATOMIC_WEIGHT));
			}
		}
		if (this.getShowElemSymbol())
			result.appendChild(this.createElemContentComponent(doc, elemInfo.symbol, CCNS.ELEM_SYMBOL));
		if (this.getShowElemName())
			result.appendChild(this.createElemContentComponent(doc, elemInfo.name, CCNS.ELEM_NAME));
		return result;
	},
	/**
	 * Create stub content in main table for Lanthanides and Actinides
	 * @param doc
	 * @param elemInfo
	 * @private
	 */
	createElemCellStubsContent: function(doc, elemInfo, extraClass)
	{
		var result = doc.createElement('div');
		result.className = CCNS.PERIODIC_TABLE_ELEM_CELL_CONTENT + ' ' + (extraClass || '');
		var atomicNum, symbol, name;
		name = elemInfo.chemicalSerie;
		if (elemInfo.symbol === 'La')
		{
			atomicNum = '57-71';
			symbol = 'La-Lu';
		}
		else
		{
			atomicNum = '89-103';
			symbol = 'Ac-Lr';
		}
		// symbol/name/atomic number/atomic weight
		if (this.getShowAtomicNum())
			result.appendChild(this.createElemContentComponent(doc, atomicNum, CCNS.ATOMIC_NUM));
		if (this.getShowElemSymbol())
			result.appendChild(this.createElemContentComponent(doc, symbol, CCNS.ELEM_SYMBOL_STUBS, true));
		if (this.getShowElemName())
			result.appendChild(this.createElemContentComponent(doc, name, CCNS.ELEM_NAME));
		return result;
	},
	/** @private */
	createElemContentComponent: function(doc, value, className, wrapSpan)
	{
		var elem = doc.createElement('span');
		elem.className = className;
		if (wrapSpan)
		{
			var wrapper = doc.createElement('span');
			elem.appendChild(wrapper);
		}
		DU.setElementText(wrapper || elem, value);
		return elem;
	},
	/** @private */
	createHeadContent: function(doc, text, extraClass)
	{
		var result = doc.createElement('div');
		result.className = CCNS.PERIODIC_TABLE_HEAD_CELL_CONTENT + ' ' + (extraClass || '');
		DU.setElementText(result, text);
		return result;
	},

	// interaction methods and event handlers
	/** @private */
	_getAtomCellElem: function(elem)
	{
		var cellElem = DU.getNearestAncestorByTagName(elem, 'td', true);
		//if (cellElem && EU.hasClass(cellElem, CCNS.PERIODIC_TABLE_ELEM_CELL))
		if (cellElem && (this._elemCells.indexOf(cellElem) >= 0))
			return cellElem;
		else
			return null;
	},
	/** @private */
	_getCellElemOfSymbol: function(symbol)
	{
		var cells = this._elemCells;
		for (var i = 0, l = cells.length; i < l; ++i)
		{
			var cell = cells[i];
			var data = cell[this.ELEM_DATA_FIELD];
			if (data.symbol === symbol)
				return cell;
		}
		return null;
	},
	/** @private */
	isCellSelected: function(cellElem)
	{
		return this._selectedElemCells.indexOf(cellElem) >= 0;
	},
	/** @private */
	selectCell: function(cellElem)
	{
		if (cellElem)
		{
			EU.addClass(cellElem, CNS.STATE_SELECTED);
			Kekule.ArrayUtils.pushUnique(this._selectedElemCells, cellElem);
			this.invokeEvent('select', {'elemData': cellElem[this.ELEM_DATA_FIELD]});
		}
	},
	/** @private */
	deselectCell: function(cellElem)
	{
		if (cellElem)
		{
			EU.removeClass(cellElem, CNS.STATE_SELECTED);
			Kekule.ArrayUtils.remove(this._selectedElemCells, cellElem);
			this.invokeEvent('deselect', {'elemData': cellElem[this.ELEM_DATA_FIELD]});
		}
	},
	/** @private */
	toggleCell: function(cellElem)
	{
		if (this.isCellSelected(cellElem))
			this.deselectCell(cellElem);
		else
			this.selectCell(cellElem);
	},
	/**
	 * Deselect all elements in table.
	 */
	deselectAll: function()
	{
		var cells = this._selectedElemCells;
		for (var i = cells.length - 1; i >= 0; --i)
			this.deselectCell(cells[i]);
		return this;
	},
	/**
	 * Select elements of symbols in table.
	 * @param {Array} symbols
	 */
	selectSymbols: function(symbols)
	{
		this.deselectAll();
		var ss = Kekule.ArrayUtils.toArray(symbols);
		for (var i = 0, l = ss.length; i < l; ++i)
		{
			var cell = this._getCellElemOfSymbol(ss[i]);
			if (cell)
				this.selectCell(cell);
		}
		return this;
	},
	/** @ignore */
	react_click: function($super, e)
	{
		if (this.getEnableSelect())
		{
			var target = e.getTarget();
			var cellElem = this._getAtomCellElem(target);
			if (cellElem)
			{
				if (!this.getEnableMultiSelect())
				{
					this.deselectAll();
					this.selectCell(cellElem);
				}
				else
				{
					this.toggleCell(cellElem);
				}
				return true;
			}
		}
		$super(e);
	}
});

})();