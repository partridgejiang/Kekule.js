/**
 * @fileoverview
 * A grid to contain multiple float widgets.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /xbrowsers/kekule.x.js
 * requires /core/kekule.common.js
 * requires /widgets/kekule.widget.base.js
 * requires /widgets/kekule.widget.helpers.js
 * requires /widgets/operation/kekule.actions.js
 * requires /widgets/commonCtrls/kekule.widget.buttons.js
 * requires /widgets/commonCtrls/kekule.widget.containers.js
 *
 * requires /localization
 */

(function(){

"use strict";

var AU = Kekule.ArrayUtils;
var SU = Kekule.StyleUtils;
var DU = Kekule.DomUtils;
var EU = Kekule.HtmlElementUtils;

/** @ignore */
Kekule.Widget.HtmlClassNames = Object.extend(Kekule.Widget.HtmlClassNames, {
	WIDGET_GRID: 'K-Widget-Grid',
	WIDGET_GRID_CELL: 'K-Widget-Grid-Cell',
	WIDGET_GRID_ADD_CELL: 'K-Widget-Grid-Add-Cell',
	WIDGET_GRID_INTERACTION_AREA: 'K-Widget-Grid-Interaction-Area',
	WIDGET_GRID_WIDGET_PARENT: 'K-Widget-Grid-Widget-Parent',
	WIDGET_GRID_BUTTON_REMOVE: 'K-Widget-Grid-Button-Remove',
	WIDGET_GRID_ENABLE_CELL_INTERACTION: 'K-Widget-Grid-Enable-Cell-Interaction'
});
var CNS = Kekule.Widget.HtmlClassNames;

/**
 * A grid to contain a series of child widgets.
 * @class
 * @augments Kekule.Widget.Container
 *
 * @property {String} cellWidth CSS width value for each cell.
 * @property {String} cellHeight CSS height value for each cell.
 * @property {Int} widgetPos Value from {@link Kekule.Widget.Position}.
 * @property {Bool} autoShrinkWidgets Whether auto shrink large widgets to full fill the cell.
 * @property {Bool} keepWidgetAspectRatio Whether keep the origin aspect ratio of widget when scaling.
 * @property {Bool} restoreWidgetSizeOnHotTrack Whether restore the shrinked large widget's size when hover or click on cell.
 * @property {Bool} enableAdd Whether shows an "adding widget" cell.
 * @property {Bool} enableRemove Whether shows remove button on each cell.
 */
Kekule.Widget.WidgetGrid = Class.create(Kekule.Widget.Container,
/** @lends Kekule.Widget.WidgetGrid# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.WidgetGrid',
	/** @private */
	CELL_FIELD: '__$cell__',
	/** @private */
	WIDGET_FIELD: '__$cellWidget__',
	/** @private */
	INTERACTION_AREA_FIELD: '__$interactionArea__',
	/** @private */
	EXCEED_TOPRIGHT_FIELD: '__$exceedTopRight__',
	/** @private */
	BTN_REMOVE_CELL_FIELD: '__$removeCell__',
	/** @construct */
	initialize: function($super, parentOrElementOrDocument)
	{
		this._floatClearer = null;
		this.reactCellMouseEnterBind = this.reactCellMouseEnter.bind(this);
		this.reactCellMouseLeaveBind = this.reactCellMouseLeave.bind(this);
		this.reactCellClickBind = this.reactCellClick.bind(this);

		$super(parentOrElementOrDocument);

		this.addEventListener('change', this.reactChildWidgetChange, this);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('childWidgetClass', {'dataType': DataType.CLASS, 'serializable': false});
		this.defineProp('cellWidth', {'dataType': DataType.STRING
			/*
			'setter': function(value)
			{
				this.setPropStoreFieldValue('cellWidth', value);
				this.updateAllCells();
			}
			*/
		});
		this.defineProp('cellHeight', {'dataType': DataType.STRING
			/*
			'setter': function(value)
			{
				this.setPropStoreFieldValue('cellHeight', value);
				this.updateAllCells();
			}
			*/
		});
		this.defineProp('widgetPos', {'dataType': DataType.INT,
			'enumSource': Kekule.Widget.Position
			/*
			'setter': function(value)
			{
				this.setPropStoreFieldValue('widgetPos', value);
				this.updateAllCells();
			}
			*/
		});
		this.defineProp('autoShrinkWidgets', {'dataType': DataType.BOOL});
		this.defineProp('keepWidgetAspectRatio', {'dataType': DataType.BOOL});
		this.defineProp('restoreWidgetSizeOnHotTrack', {'dataType': DataType.BOOL});

		this.defineProp('enableAdd', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('enableAdd', value);
				if (value)
					this.setAddingCell(this.createAddCell());
				else
				{
					var cell = this.getAddingCell();
					if (cell)
						this.getContainerElement().removeChild(cell);
				}
			}
		});
		this.defineProp('enableRemove', {'dataType': DataType.BOOL,
			'getter': function()
			{
				return this.hasClassName(CNS.WIDGET_GRID_ENABLE_CELL_INTERACTION);
			},
			'setter': function(value)
			{
				if (value)
					this.addClassName(CNS.WIDGET_GRID_ENABLE_CELL_INTERACTION);
				else
					this.removeClassName(CNS.WIDGET_GRID_ENABLE_CELL_INTERACTION);
			}
		});

		this.defineProp('hotCell', {'dataType': DataType.OBJECT, 'serializable': false,
			'setter': function(value)
			{
				if (this.getHotCell() !== value)
				{
					this.hotCellChanged(this.getHotCell(), value);
					this.setPropStoreFieldValue('hotCell', value);
				}
			}
		});  // private
		this.defineProp('addingCell', {'dataType': DataType.OBJECT, 'serializable': false});  // private
	},
	/** @ignore */
	initPropValues: function()
	{
		this.setPropStoreFieldValue('autoShrinkWidgets', true);
		this.setPropStoreFieldValue('keepWidgetAspectRatio', true);
		this.setPropStoreFieldValue('restoreWidgetSizeOnHotTrack', true);
		this.setEnableRemove(true);
		this.setUseCornerDecoration(true);
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.WIDGET_GRID;
	},
	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('div');
		return result;
	},

	/** @ignore */
	doSetUseCornerDecoration: function($super, value)
	{
		$super(value);
		this.updateAllCells();
	},

	/** @ignore */
	doObjectChange: function($super, modifiedPropNames)
	{
		$super(modifiedPropNames);
		var inter = AU.intersect(modifiedPropNames, ['autoShrinkWidgets', 'keepWidgetAspectRatio', 'cellWidth', 'cellHeight', 'widgetPos']);
		if (inter.length > 0)
			this.updateAllCells();
	},

	/** @ignore */
	doWidgetShowStateChanged: function($super, isShown)
	{
		if (isShown)
			this.updateAllCells();
		return $super(isShown);
	},

	/**
	 * Call function to each widgets
	 * @param {Func} callFunc callFunc(widget)
	 */
	each: function(callFunc)
	{
		var ws = Kekule.ArrayUtils.clone(this.getChildWidgets());
		for (var i = 0, l = ws.length; i < l; ++i)
		{
			callFunc(ws[i]);
		}
	},
	/**
	 * Add a widget to grid.
	 * This method will also set widget's parent to grid.
	 * @param {Kekule.Widget.BaseWidget} widget
	 */
	addWidget: function(widget)
	{
		widget.setParent(this);
	},
	/**
	 * Remove a widget from grid.
	 * @param {Kekule.Widget.BaseWidget} widget
	 * @param {Bool} doFinalize
	 */
	removeWidget: function(widget, doFinalize)
	{
		if (!this.hasChild(widget))
			return;
		widget.setParent(null);
		if (doFinalize)
			widget.finalize();
	},
	/**
	 * Create a new default child widget.
	 * @returns {Kekule.Widget.BaseWidget}
	 */
	createWidget: function()
	{
		var result = this.doCreateNewChildWidget(this.getDocument());
		if (result)
		{
			result.setParent(this);
			return result;
		}
	},
	/**
	 * Create a new widget by adding cell.
	 * Descendants need to override this method/
	 * @returns {Kekule.Widget.BaseWidget}
	 * @private
	 */
	doCreateNewChildWidget: function(doc)
	{
		return null;
		//return new Kekule.Widget.Button(doc, 'hi'); // debug
	},

	/** @private */
	getFloatClearer: function()
	{
		if (!this._floatClearer)
		{
			this._floatClearer = this.getDocument().createElement('div');
			this._floatClearer.style.clear = 'both';
			this.getContainerElement().appendChild(this._floatClearer);
		}
		return this._floatClearer;
	},
	/**
	 * Create a cell element to contains the child widget.
	 * @param {Kekule.Widget.BaseWidget} widget
	 * @returns {HTMLElement}
	 * @private
	 */
	createCell: function(widget)
	{
		var isAddCell = !widget;
		/*
		if (isAddCell)
			widget = new Kekule.Widget.Button(this.getDocument(), 'Add');
		*/

		var doc = this.getDocument();
		var cell = doc.createElement('div');
		cell.className = CNS.WIDGET_GRID_CELL + ' ' + CNS.DYN_CREATED  + (isAddCell? ' ' + CNS.WIDGET_GRID_ADD_CELL: '');
		cell[this.WIDGET_FIELD] = widget;

		Kekule.X.Event.addListener(cell, 'mouseenter', this.reactCellMouseEnterBind);
		Kekule.X.Event.addListener(cell, 'mouseleave', this.reactCellMouseLeaveBind);
		Kekule.X.Event.addListener(cell, 'click', this.reactCellClickBind);

		/*
		var interElem = doc.createElement('div');
		interElem.className = CNS.WIDGET_GRID_INTERACTION_LAYER + ' ' + CNS.DYN_CREATED;
		cell.appendChild(interElem);
		*/

		var p = doc.createElement('div');
		p.className = CNS.WIDGET_GRID_WIDGET_PARENT + ' ' + CNS.DYN_CREATED;
		p[this.WIDGET_FIELD] = widget;
		//interElem.appendChild(p);
		if (isAddCell)
		{
			p.innerHTML = Kekule.$L('WidgetTexts.CAPTION_ADD_CELL'); //Kekule.WidgetTexts.CAPTION_ADD_CELL;
			p.title = Kekule.$L('WidgetTexts.HINT_ADD_CELL'); //Kekule.WidgetTexts.HINT_ADD_CELL;
		}

		cell.appendChild(p);

		if (widget)
		{
			widget.appendToElem(p);
			widget[this.CELL_FIELD] = cell;
		}

		if (!isAddCell)
		{
			var interElem = doc.createElement('div');
			interElem.className = CNS.WIDGET_GRID_INTERACTION_AREA + ' ' + CNS.DYN_CREATED;
			cell.appendChild(interElem);
			p[this.INTERACTION_AREA_FIELD] = interElem;
			cell[this.INTERACTION_AREA_FIELD] = interElem;
			this.createCellInteractionWidgets(interElem, cell);
		}

		if (this.getAddingCell() && !isAddCell)
			this.getContainerElement().insertBefore(cell, this.getAddingCell());
		else
			this.getContainerElement().insertBefore(cell, this.getFloatClearer());
		this.updateCell(cell);
		return cell;
	},
	/** @private */
	createAddCell: function()
	{
		return this.createCell(null);
	},
	/** @private */
	createCellInteractionWidgets: function(parentElem, cellElem)
	{
		var btn = new Kekule.Widget.Button(parentElem.ownerDocument);
		btn.setText(/*Kekule.WidgetTexts.CAPTION_REMOVE_CELL*/Kekule.$L('WidgetTexts.CAPTION_REMOVE_CELL'));
		btn.setHint(/*Kekule.WidgetTexts.HINT_REMOVE_CELL*/Kekule.$L('WidgetTexts.HINT_REMOVE_CELL'));
		btn.addClassName(CNS.WIDGET_GRID_BUTTON_REMOVE);
		btn[this.BTN_REMOVE_CELL_FIELD] = true;
		var widget = this.getContainingWidget(cellElem);
		btn[this.WIDGET_FIELD] = widget;
		btn.setShowText(false);
		btn.setShowGlyph(true);
		btn.addEventListener('execute', function(e){
			var btn = e.widget;
			var widget = btn[this.WIDGET_FIELD];
			this.removeWidget(widget, true);
		}, this);
		btn.appendToElem(parentElem);
	},
	/**
	 * Returns the cell element of widget.
	 * @param {Kekule.Widget.BaseWidget} widget
	 * @returns {HTMLElement}
	 */
	getWidgetCell: function(widget)
	{
		return widget[this.CELL_FIELD];
	},
	/**
	 * Returns the direct parent element of widget.
	 * @param {Kekule.Widget.BaseWidget} widget
	 * @returns {HTMLElement}
	 */
	getWidgetParentElem: function(widget)
	{
		var elem = widget.getElement();
		return elem && elem.parentNode;
	},
	/** @private */
	getWidgetParentElemOfCell: function(cell)
	{
		return cell.children[0];
	},
	/** @private */
	getInteractionAreaElemOfCell: function(cell)
	{
		return cell[this.INTERACTION_AREA_FIELD];
	},
	/** @private */
	getContainingWidget: function(elem)
	{
		return elem[this.WIDGET_FIELD];
	},

	/** @private */
	childWidgetAdded: function($super, widget)
	{
		$super(widget);
		this.createCell(widget);
	},
	/** @private */
	childWidgetRemoved: function($super, widget)
	{
		$super(widget);
		var cellElem = this.getWidgetCell(widget);
		this.getContainerElement().removeChild(cellElem);
	},
	/** @private */
	childWidgetMoved: function($super, widget, newIndex)
	{
		$super(widget, newIndex);
		var elem = this.getWidgetCell(widget);
		var refWidget = this.getChildWidgets()[newIndex + 1];
		var refElem = refWidget? this.getWidgetCell(refWidget): null;
		if (refElem)
			this.getContainerElement().insertBefore(elem, refElem);
		else
			this.getContainerElement().appendChild(elem);
	},
	/** @private */
	childrenModified: function($super)
	{
		// update float clearer
		this.getContainerElement().appendChild(this.getFloatClearer());
	},

	/**
	 * Returns all cell elements.
	 * @returns {Array}
	 */
	getAllCells: function()
	{
		var widgets = this.getChildWidgets();
		var result = [];
		for (var i = 0, l = widgets.length; i < l; ++i)
		{
			result.push(this.getWidgetCell(widgets[i]));
		}
		// check if there is an add cell
		if (this.getAddingCell())
		{
			result.push(this.getAddingCell());
		}
		return result;
	},
	/**
	 * Update width/height of cell by cellWidth/cellHeight property.
	 * @param {HTMLElement} cellElem
	 * @param {Bool} isHotCell;
	 * @private
	 */
	updateCell: function(cellElem, isHotCell)
	{
		var style = cellElem.style;
		var w = this.getCellWidth();
		var h = this.getCellHeight();
		if (w)
			style.width = w;
		else
			SU.removeStyleProperty(style, 'width');
		if (h)
		{
			style.height = h;
			//style.lineHeight = h;  // enable vertical align
		}
		else
		{
			SU.removeStyleProperty(style, 'height');
			//SU.removeStyleProperty(style, 'lineHeight');
		}
		// corner decoration
		if (this.getUseCornerDecoration())
			EU.addClass(cellElem, CNS.CORNER_ALL);
		else
			EU.removeClass(cellElem, CNS.CORNER_ALL);
		// widget position
		this.adjustCellWidgetPos(cellElem, isHotCell);
		// interaction area
		this.adjustInteractionArea(cellElem, isHotCell);
	},
	/** @private */
	adjustCellWidgetPos: function(cellElem, isHotCell)
	{
		/*
		var widget = this.getContainingWidget(cellElem);
		if (!widget)
			return;
		var widgetElem = widget.getElement();
		*/
		//var containerElem = this.getWidgetParentElem(widget);
		var containerElem = this.getWidgetParentElemOfCell(cellElem);
		var widgetBound = EU.getElemOffsetDimension(containerElem);
		var cellBound = EU.getElemClientDimension(cellElem);  // without margin and border, but with padding
		//console.log('cellSize', this.getCellWidth(), this.getCellHeight());
		var paddingNames = ['top', 'right', 'bottom', 'left'];
		var paddings = {};
		for (var i = 0, l = paddingNames.length; i < l; ++i)
		{
			var sv = SU.getComputedStyle(cellElem, 'padding-' + paddingNames[i]);
			paddings[paddingNames[i]] = SU.analysisUnitsValue(sv).value || 0;
		}
		var cellClientBound = Object.extend({}, cellBound);  // bound without padding
		cellClientBound.width -= (paddings.left + paddings.right);
		cellClientBound.height -= (paddings.top + paddings.bottom);
		var pos = this.getWidgetPos();
		var WP = Kekule.Widget.Position;
		// horizontal
		var left = (pos & WP.LEFT)? paddings.left:
			(pos & WP.RIGHT)? cellBound.width - widgetBound.width - paddings.right:
			(cellClientBound.width - widgetBound.width) / 2 + paddings.left;  // default, center
		// vertical
		var top = (pos & WP.TOP)? paddings.top:
			(pos & WP.BOTTOM)? cellBound.height - widgetBound.height - paddings.bottom:
			(cellClientBound.height - widgetBound.height) / 2 + paddings.top;  // default, middle

		//console.log('cellBound', cellBound, paddings, left, top);

		containerElem.style.left = left + 'px';
		containerElem.style.top = top + 'px';

		var interArea = this.getInteractionAreaElemOfCell(cellElem);
		if (interArea)
		{
			var interAreaBound = EU.getElemClientDimension(interArea);
			var right = left + widgetBound.width;
			var exceedTopRightCorner = (right + interAreaBound.width >= cellBound.width) && (top <= interAreaBound.height);
			cellElem[this.EXCEED_TOPRIGHT_FIELD] = exceedTopRightCorner;
		}

		/*
		// adjust interaction area, should be at top-right of cell
		var interElem = this.getInteractionAreaElemOfCell(cellElem);
		if (interElem)
		{
			var t = -top + paddings.top;
			var right = left + widgetBound.width;
			var r = (right - cellBound.width) + paddings.right;
			interElem.style.top = t + 'px';
			interElem.style.right = r + 'px';
		}
		*/

		// check if shrink is essential
		if ((this.getAutoShrinkWidgets() && !isHotCell) || !this.getRestoreWidgetSizeOnHotTrack())
		{
			var scaleX = (widgetBound.width > cellClientBound.width) ? cellClientBound.width / widgetBound.width : null;
			var scaleY = (widgetBound.height > cellClientBound.height) ? cellClientBound.height / widgetBound.height : 1;
			if (this.getKeepWidgetAspectRatio())
			{
				var scale = (scaleX && scaleY) ? Math.min(scaleX, scaleY) : scaleX || scaleY;
				scaleX = scale;
				scaleY = scale;
			}
			containerElem.style.transform = 'scale(' + scaleX + ', ' + scaleY + ')';
			var scaleOriginX = (pos & WP.LEFT) ? '0' :
				(pos & WP.RIGHT) ? '100%' :
					'50%';
			var scaleOriginY = (pos & WP.TOP) ? '0' :
				(pos & WP.BOTTOM) ? '100%' :
					'50%';
			containerElem.style.transformOrigin = scaleOriginX + ' ' + scaleOriginY;
		}
		else
		{
			containerElem.style.transform = 'none';
		}
	},
	/** @private */
	adjustInteractionArea: function(cellElem, isHotCell)
	{
		var areaElem = this.getInteractionAreaElemOfCell(cellElem);
		if (areaElem)
		{
			if (!isHotCell)
			{
				cellElem.appendChild(areaElem);
			}
			else  // may adjust position
			{
				if (cellElem[this.EXCEED_TOPRIGHT_FIELD])
				{
					var widgetParent = this.getWidgetParentElemOfCell(cellElem);
					widgetParent.appendChild(areaElem);
				}
			}
		}
	},
	/**
	 * Called when cellWidth or cellHeight property changes.
	 * @private
	 */
	updateAllCells: function()
	{
		var cells = this.getAllCells();
		for (var i = 0, l = cells.length; i < l; ++i)
		{
			this.updateCell(cells[i], cells[i] === this.getHotCell());
		}
	},
	/** @private */
	restoreCellShrink: function(cell)
	{
		var elem = this.getWidgetParentElemOfCell(cell);
		if (elem)
		{
			elem.style.transform = 'none';
		}
	},

	/**
	 * Notify that the hot cell has been changed.
	 * @private
	 */
	hotCellChanged: function(oldCell, newCell)
	{
		if (oldCell)
		{
			this.updateCell(oldCell, false);
			EU.removeClass(oldCell, CNS.STATE_HOVER);
		}
		if (newCell)
		{
			EU.addClass(newCell, CNS.STATE_HOVER);
			if (this.getRestoreWidgetSizeOnHotTrack())
			{
				this.restoreCellShrink(newCell);
				this.adjustInteractionArea(newCell, true);
			}
		}
	},

	/** @private */
	reactCellMouseEnter: function(e)
	{
		var target = e.getTarget();
		this.setHotCell(target);
	},
	/** @private */
	reactCellMouseLeave: function(e)
	{
		var target = e.getTarget();
		if (this.getHotCell() === target)
		{
			this.setHotCell(null);
		}
	},
	/** @private */
	reactCellClick: function(e)
	{
		var target = e.getTarget();
		if (DU.isDescendantOf(target, this.getAddingCell()) || target === this.getAddingCell())
			this.createWidget();
	},
	/** @private */
	reactChildWidgetChange: function(e)
	{
		var widget = e.widget;
		if (widget && this.hasChild(widget))
		{
			this.updateCell(this.getWidgetCell(widget), this.getHotCell() === this.getWidgetCell(widget));
		}
	}
});

})();