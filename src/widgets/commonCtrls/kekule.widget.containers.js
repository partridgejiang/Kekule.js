/**
 * @fileoverview
 * Implementation of container that can hold a set of other widgets.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /utils/kekule.domUtils.js
 * requires /xbrowsers/kekule.x.js
 * requires /widgets/kekule.widget.base.js
 */

(function(){

/** @ignore */
Kekule.Widget.HtmlClassNames = Object.extend(Kekule.Widget.HtmlClassNames, {
	CONTAINER: 'K-Container',
	PANEL: 'K-Panel',
	TOOLBAR: 'K-Toolbar'
});

var EU = Kekule.HtmlElementUtils;
var CNS = Kekule.Widget.HtmlClassNames;

/**
 * An abstract widget container.
 * @class
 * @augments Kekule.Widget.BaseWidget
 *
 * @property {String} childWidth CSS width of all children. If set to null, width will be determined by child it self.
 * @property {String} childHeight CSS height of all children. If set to null, height will be determined by child it self.
 * @property {String} childMargin CSS margin property of all children.
 * @property {Bool} allowChildWrap Whether child widget can wrap in lines inside parent. Only work in horizontal layout.
 */
Kekule.Widget.Container = Class.create(Kekule.Widget.BaseWidget,
/** @lends Kekule.Widget.Container# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.Container',
	/** @construct */
	initialize: function($super, parentOrElementOrDocument)
	{
	  $super(parentOrElementOrDocument);
		this.reactShowStateChangeBind = this.reactShowStateChange.bind(this);
		this.addEventListener('showStateChange', this.reactShowStateChangeBind);
	},
	/** @private */
	finalize: function($super)
	{
		this.removeEventListener('showStateChange', this.reactShowStateChangeBind);
		this.clearWidgets();
		$super();
	},
	/** @private */
	initProperties: function()
	{
		this.defineChildDimensionRelatedProp('childWidth');
		this.defineChildDimensionRelatedProp('childHeight');
		this.defineChildDimensionRelatedProp('childMargin');

		this.defineProp('firstChild', {'dataType': 'Kekule.Widget.BaseWidget', 'serializable': false, 'setter': null, 'scope': Class.PropertyScope.PUBLIC});
		this.defineProp('lastChild', {'dataType': 'Kekule.Widget.BaseWidget', 'serializable': false, 'setter': null, 'scope': Class.PropertyScope.PUBLIC});
		this.defineProp('allowChildWrap', {'dataType': DataType.BOOL, 'serializable': false,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('allowChildWrap', value);
				if (value)
					this.removeClassName(CNS.NOWRAP);
				else
				{
					this.addClassName(CNS.NOWRAP);
				}
			}
		});
	},
	/** @ignore */
	initPropValues: function($super)
	{
		$super();
		this.setAllowChildWrap(true);
	},

	/** @private */
	defineChildDimensionRelatedProp: function(propName, options)
	{
		var ops = Object.extend({
			'dataType': DataType.STRING,
			'setter': function(value)
			{
				this.setPropStoreFieldValue(propName, value);
				this.updateChildSizes();
			}
		}, options || {});
		return this.defineProp(propName, ops);
	},


	/** @ignore */
	doGetWidgetClassName: function()
	{
		return CNS.CONTAINER;
	},
	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('span');
		return result;
	},
	/**
	 * Returns the parent HTML element to hold all child widgets.
	 * Descendants can override this method.
	 * @return {HTMLElement}
	 */
	getContainerElement: function()
	{
		return this.getElement();
	},

	/**
	 * Append an widget to container/
	 * @param {Kekule.Widget.BaseWidget} widget
	 */
	appendWidget: function(widget)
	{
		/*
		this.getContainerElement().appendChild(widget.getElement());
		*/
		//this._insertChildWidget(widget, null);
		widget.setParent(this);
		return this;
	},
	/**
	 * Insert an widget before refWidget.
	 * @param {Kekule.Widget.BaseWidget} widget
	 * @param {Kekule.Widget.BaseWidget} refWidget
	 */
	insertWidgetBefore: function(widget, refWidget)
	{
		/*
	  var refElem = refWidget? refWidget.getElement(): null;
		if (refElem)
			this.getContainerElement().insertBefore(widget.getElement(), refElem);
		else
			this.getContainerElement().appendChild(widget.getElement());
		*/
		//this._insertChildWidget(widget, refWidget);
		/*
		widget.setParent(this);
		var refIndex = refWidget? this.getChildWidgets().indexOf(refWidget): -1;
		if (refIndex >= 0)
			this._moveChild(widget, refIndex);
		*/
		widget.insertToWidget(this, refWidget);
		return this;
	},

	/**
	 * Remove an widget from container and destroy it.
	 * @param {Kekule.Widget.BaseWidget} widget
	 * @param {Bool} doNotFinalize If set to true, the widget will not be finalized.
	 */
	removeWidget: function(widget, doNotFinalize)
	{
		widget.setParent(null);
		if (!doNotFinalize)
			widget.finalize();
	},

	/**
	 * Remove all children in container and destroy them.
	 * @param {Bool} doNotFinalize If set to true, the widget will not be finalized.
	 */
	clearWidgets: function(doNotFinalize)
	{
		var children = this.getChildWidgets();
		for (var i = children.length - 1; i >= 0; --i)
		{
			var child = children[i];
			this.removeWidget(child, doNotFinalize);
		}
	},

	/** @private */
	_insertChildWidget: function(widget, refWidget)
	{
		var refElem = refWidget? refWidget.getElement(): null;
		var containerElem = this.getContainerElement();
		if (containerElem)
		{
			if (refElem)
				containerElem.insertBefore(widget.getElement(), refElem);
			else
				containerElem.appendChild(widget.getElement());
		}
	},

	/** @private */
	reactShowStateChange: function(e)
	{
		//if (e.target !== this)  // invoked by child widget
		{
			this.childrenModified();
		}
	},

	/** @private */
	childrenModified: function($super)
	{
		$super();
		// change first / last child if essential
		var widgets = this.getChildWidgets();
		var length = widgets.length;

		var index = 0;
		var curr = widgets[index];
		while (curr && (!curr.isShown(true)) && (index < length)) // check show ignoring DOM status
		{
			++index;
			curr = widgets[index];
		}  // get first visible child
		var newFirst = (index < length)? curr: null;

		var index = length - 1;
		var curr = widgets[length - 1];
		while (curr && (!curr.isShown(true)) && (index >= 0)) // check show ignoring DOM status
		{
			--index;
			curr = widgets[index];
		}
		var newLast = (index >= 0)? curr: null;

		var oldFirst = this.getFirstChild();
		var oldLast = this.getLastChild();
		if (newFirst !== oldFirst)
		{
			if (oldFirst)
				oldFirst.removeClassName(CNS.FIRST_CHILD);
			if (newFirst)
				newFirst.addClassName(CNS.FIRST_CHILD);
			this.setPropStoreFieldValue('firstChild', newFirst);
		}
		if (newLast !== oldLast)
		{
			if (oldLast)
				oldLast.removeClassName(CNS.LAST_CHILD);
			if (newLast)
				newLast.addClassName(CNS.LAST_CHILD);
			this.setPropStoreFieldValue('lastChild', newLast);
		}
	},
	/** @private */
	childWidgetAdded: function($super, widget)
	{
		$super(widget);
		var w = this.getChildWidth();
		if (w)
			widget.setWidth(w);
		var h = this.getChildHeight();
		if (h)
			widget.setHeight(h);
		var margin = this.getChildMargin();
		if (margin)
			widget.getStyle().margin = margin;

		this._insertChildWidget(widget, null);
	},
	/** @private */
	childWidgetRemoved: function($super, widget)
	{
		$super(widget);
		//this.getContainerElement().removeChild(widget.getElement());
		// do not need to remove here, this work has been done in _removeChild method of BaseWidget
	},
	/** @private */
	childWidgetMoved: function($super, widget, newIndex)
	{
		$super(widget, newIndex);
		var elem = widget.getElement();
		var refWidget = this.getChildWidgets()[newIndex + 1];
		var refElem = refWidget? refWidget.getElement(): null;
		if (refElem)
			this.getContainerElement().insertBefore(elem, refElem);
		else
			this.getContainerElement().appendChild(elem);
	},

	/**
	 * Change child widgets size according to childWidth/childHeight settings.
	 * @private
	 */
	updateChildSizes: function()
	{
		var children = this.getChildWidgets();
		var w = this.getChildWidth() || '';
		var h = this.getChildHeight() || '';
		var margin = this.getChildMargin() || '';
		var layout = this.getLayout();
		//var marginValue = (layout === Kekule.Widget.Layout.VERTICAL)? margin + ' auto': 'auto ' + margin;
		{
			for (var i = 0, l = children.length; i < l; ++i)
			{
				var widget = children[i];
				widget.setWidth(w);
				widget.setHeight(h);
				widget.getStyle().margin = margin;
			}
		}
	}
});

/**
 * An plain panel to contain child widgets.
 * @class
 * @augments Kekule.Widget.Container
 *
 */
Kekule.Widget.Panel = Class.create(Kekule.Widget.Container,
/** @lends Kekule.Widget.Panel# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.Panel',
	/** @private */
	initPropValues: function($super)
	{
		$super();
		this.setUseCornerDecoration(true);
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.PANEL;
	}
});

/**
 * An widget group, all child widgets inside it should be regarded as a whole.
 * e.g, button group, edit-button group and so on.
 * @class
 * @augments Kekule.Widget.Container
 *
 */
Kekule.Widget.WidgetGroup = Class.create(Kekule.Widget.Container,
/** @lends Kekule.Widget.WidgetGroup# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.WidgetGroup',
	/** @construct */
	initialize: function($super, parentOrElementOrDocument)
	{
		$super(parentOrElementOrDocument);
	},
	/** @private */
	initPropValues: function($super)
	{
		$super();
		this.setUseCornerDecoration(true);
	},

	/** @ignore */
	doObjectChange: function($super, modifiedPropNames)
	{
		$super(modifiedPropNames);
		if (modifiedPropNames.indexOf('useCornerDecoration') >= 0)
			this._updateChildStyles();
	},

	/** @ignore */
	childWidgetAdded: function($super, widget)
	{
		if (widget.setUseCornerDecoration)
		{
			widget.setUseCornerDecoration(false);
		}
		$super(widget);
	},
	/** @ignore */
	layoutChanged: function($super)
	{
		$super();
		this._updateChildStyles();
	},
	/** @ignore */
	childrenModified: function($super)
	{
		$super();
		this._updateChildStyles();
	},

	/** @private */
	_updateChildStyles: function()
	{
		var WL = Kekule.Widget.Layout;
		var layout = this.getLayout();
		var first = this.getFirstChild();
		var last = this.getLastChild();
		var useCorner = /*true; //*/ this.getUseCornerDecoration();
		var children = this.getChildWidgets();
		/*
		 var allFirstRoundClasses = [CNS.CORNER_LEFT, CNS.CORNER_TOP];
		 var firstRoundClass = (layout === WL.VERTICAL)? CNS.CORNER_TOP: CNS.CORNER_LEFT;
		 var allLastRoundClasses = [CNS.CORNER_RIGHT, CNS.CORNER_BOTTOM];
		 var lastRoundClass = (layout === WL.VERTICAL)? CNS.CORNER_BOTTOM: CNS.CORNER_RIGHT;
		 */
		var allRoundClasses = [CNS.CORNER_LEADING, CNS.CORNER_TAILING];

		// TODO: Now has to iterate all children, too slow, need to change later.
		for (var i = 0, l = children.length; i < l; ++i)
		{
			var child = children[i];
			child.removeClassName(allRoundClasses);
			if (child === first)
			{
				if (useCorner)
					child.addClassName(CNS.CORNER_LEADING);
			}
			if (child === last)
			{
				if (useCorner)
					child.addClassName(CNS.CORNER_TAILING);
			}
		}
		//console.log('update child style', children.length, useCorner, first, last);
	}
});

/**
 * An general toolbar that can contain child widgets.
 * @class
 * @augments Kekule.Widget.WidgetGroup
 *
 * @property {Array} childDefs Array of hash definition of child widgets.
 *   In definition, a special field "internalName" can be set. After created, the
 *   child widget can be refered by {@link Kekule.Widget.Toolbar.getChildWidgetByInternalName} method.
 *   When this property is set, new child widgets will be created by it and all old child widgets will be destroyed.
 */
Kekule.Widget.Toolbar = Class.create(Kekule.Widget.WidgetGroup,
/** @lends Kekule.Widget.Toolbar# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.Toolbar',
	/** @ignore */
	finalize: function($super)
	{
		var map = this.getChildWidgetInternalNameMap();
		if (map)
			map.finalize();
		$super();
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('childDefs', {
			'dataType': DataType.ARRAY,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('childDefs', value);
				this.recreateChildrenByDefs();
			}
		});
		// private
		this.defineProp('childWidgetInternalNameMap', {'dataType': DataType.OBJECT, 'serializable': false});
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.TOOLBAR;
	},
	/** @private */
	doSetShowText: function($super, value)
	{
		$super(value);
		this._updateAllChildTextGlyphStyles();
	},
	doSetShowGlyph: function($super, value)
	{
		$super(value);
		this._updateAllChildTextGlyphStyles();
	},

	/** @private */
	childWidgetAdded: function($super, widget)
	{
		$super(widget);
		this._updateChildTextGlyphStyles(widget);
	},

	/** @private */
	_updateChildTextGlyphStyles: function(widget)
	{
		if (widget.setShowText)
			widget.setShowText(this.getShowText());
		if (widget.setShowGlyph)
			widget.setShowGlyph(this.getShowGlyph());
	},
	/** @private */
	_updateAllChildTextGlyphStyles: function()
	{
		var children = this.getChildWidgets();
		for (var i = children.length - 1; i >= 0; --i)
		{
			this._updateChildTextGlyphStyles(children[i]);
		}
	},

	/** @private */
	recreateChildrenByDefs: function()
	{
		var defs = this.getChildDefs() || [];
		// remove old children first
		this.clearWidgets();
		var internalNameMap = new Kekule.MapEx(true);
		this.setChildWidgetInternalNameMap(internalNameMap);
		// add new ones
		var defWidgetClassName = this.getDefaultChildWidgetClassName();
		for (var i = 0, l = defs.length; i < l; ++i)
		{
			var def = defs[i];
			if (!def.widget && !def.widgetClass && defWidgetClassName)  // class not set, try to use default one
			{
				def = Object.extend({'widget': defWidgetClassName}, def);
			}
			var w = Kekule.Widget.createFromHash(this, def);
			if (w)
			{
				w.appendToWidget(this);
				if (def.internalName)
				{
					internalNameMap.set(def.internalName, w);
				}
			}
		}
	},
	/**
	 * Returns default class name of child widget.
	 * This method is used in create child widgets by hash definition.
	 * Descendants may override this method.
	 * @returns {String}
	 */
	getDefaultChildWidgetClassName: function()
	{
		return null;
	},

	/**
	 * Returns child widget defined by internalName.
	 * @param {String} name
	 * @returns {Kekule.Widget.BaseWidget}
	 */
	getChildWidgetByInternalName: function(name)
	{
		var map = this.getChildWidgetInternalNameMap();
		return map? map.get(name): null;
	}
});

})();
