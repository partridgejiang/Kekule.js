/**
 * @fileoverview
 * Implementation of menu widgets.
 * Unfinished yet.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /utils/kekule.domUtils.js
 * requires /xbrowsers/kekule.x.js
 * requires /widgets/kekule.widget.base.js
 * requires /widgets/kekule.widget.containers.js
 * requires /widgets/commonCtrls/kekule.widget.images.js
 */

// TODO: The whole widget is not finished and is unusable

(function(){
"use strict";

var DU = Kekule.DomUtils;
var EU = Kekule.HtmlElementUtils;
var CNS = Kekule.Widget.HtmlClassNames;

/** @ignore */
Kekule.Widget.HtmlClassNames = Object.extend(Kekule.Widget.HtmlClassNames, {
	MENU: 'K-Menu',
	MENUITEM: 'K-MenuItem',
	SUBMENU_MARKER: 'K-SubMenu-Marker'
});

/**
 * Menu item in menu widget.
 * @class
 * @augments Kekule.Widget.BaseWidget
 */
Kekule.Widget.MenuItem = Class.create(Kekule.Widget.BaseWidget,
/** @lends Kekule.Widget.MenuItem# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.MenuItem',
	/** @private */
	BINDABLE_TAG_NAMES: ['li'],
	/** @private */
	SUB_MENU_TAGS: ['ol', 'ul'],
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument, text)
	{
		//this.setPropStoreFieldValue('useCornerDecoration', true);
		$super(parentOrElementOrDocument);
		if (text)
			this.setText(text);
		this._subMenuMarker = null;
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('text', {'dataType': DataType.STRING, 'serializable': false,
			'getter': function() { return Kekule.HtmlElementUtils.getInnerText(this.getElement()); },
			'setter': function(value) { this.changeContentText(value); }
		});
	},
	/** @ignore */
	initPropValues: function($super)
	{
		$super();
		this.setUseCornerDecoration(false);
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.MENUITEM;
	},
	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('li');
		return result;
	},
	/** @private */
	changeContentText: function(newText)
	{
		this.getElement().innerHTML = newText || '';
	},

	/** @ignore */
	doBindElement: function($super, element)
	{
		$super(element);
		// check if there is sub menu items
		var child = element.firstChild;
		while(child)
		{
			if (child.nodeType === Node.ELEMENT_NODE)
			{
				this.bindSubMenu(child);
			}
			child = child.nextSibling;
		}
	},
	/** @private */
	doDomElemAdded: function(elem)
	{
		if (!Kekule.Widget.getWidgetOnElem(elem))  // elem is not a widget yet
			this.bindSubMenu(elem);
	},

	/** @ignore */
	childWidgetAdded: function($super, widget)
	{
		$super(widget);
		if (widget instanceof Kekule.Widget.Menu)
		{
			widget.setIsSubMenu(true);
		}
	},
	/** @ignore */
	childrenModified: function($super)
	{
		$super();
		this.subMenuChanged();
	},

	/** @private */
	bindSubMenu: function(elem)
	{
		var tagName = elem.tagName.toLowerCase();
		if (tagName === 'ul' || tagName === 'ol')
		{
			var result = new Kekule.Widget.Menu(elem);
			this.addSubMenu(result);
			return result;
		}
	},
	/**
	 * Called when sub menu is added or removed from item.
	 * @private
	 */
	subMenuChanged: function()
	{
		var subMenu = this.getSubMenu();
		if (subMenu)
		{
			this._createSubMenuMarker(subMenu);
		}
		else
			this._removeSubMenuMarker();
	},

	/**
	 * Returns sub menu of this menu item.
	 * @returns {Kekule.Widget.Menu}
	 */
	getSubMenu: function()
	{
		/*
		var menuItemElem = this.getElement();
		var elems;
		for (var i = 0, l = this.SUB_MENU_TAGS.length; i < l; ++i)
		{
			var tag = this.SUB_MENU_TAGS[i];
			elems = DU.getDirectChildElems(menuItemElem, tag);
			if (elems && elems.length)
				break;
		}
		if (elems.length)
		{
			for (var i = 0, l = elems.length; i < l; ++i)
			{
				var elem = elems[i];
				var w = Kekule.Widget.getWidgetOnElem(elem);
				if (w && (w instanceof Kekule.Widget.Menu))
					return w;
			}
		}
		return null;
		*/
		var children = this.getChildWidgets();
		for (var i = 0, l = children.length; i < l; ++i)
		{
			var w = children[i];
			if (w instanceof Kekule.Widget.Menu)
				return w;
		}
		return null;
	},
	/**
	 * Add sub menu to this item.
	 * @param {Kekule.Widget.Menu} subMenu
	 */
	addSubMenu: function(subMenu)
	{
		subMenu.appendToWidget(this);
		return this;
	},
	/**
	 * Remove sub menu from item.
	 * @param {Kekule.Widget.Menu} subMenu
	 */
	removeSubMenu: function(subMenu)
	{
		subMenu.setParent(null);
		return subMenu;
	},
	/**
	 * Create a new sub menu under this item.
	 * @returns {Kekule.Widget.Menu}
	 */
	createSubMenu: function()
	{
		var result = new Kekule.Widget.Menu(this);
		this.addSubMenu(result);
		return result;
	},

	/** @private */
	_createSubMenuMarker: function(subMenu)
	{
		var result = this._subMenuMarker;
		if (!result)
		{
			var result = this.getDocument().createElement('span');
			result.className = CNS.SUBMENU_MARKER;
			/*
			var refElem = subMenu.getElement() || null;
			//this.getElement().insertBefore(result, refElem);  // cause error when sub menu has not been inserted to DOM
			*/
			this.getElement().appendChild(result);
			this._subMenuMarker = result;
		}
		return result;
	},
	/** @private */
	_removeSubMenuMarker: function()
	{
		if (this._subMenuMarker)
		{
			this._subMenuMarker.parentNode.removeChild(this._subMenuMarker);
			this._subMenuMarker = null;
		}
	},

	/**
	 * Returns whether this menu item has no sub menu.
	 * @returns {Bool}
	 */
	isLeafItem: function()
	{
		var elem = this.getElement();
		return !(elem.getElementsByTagName('ul').length || elem.getElementsByTagName('ol').length);
	},
	/** @private */
	isPeriodicalExecuting: function($super)
	{
		return $super() && this.getIsActive();
	},

	/** @private */
	doReactActiviting: function($super, e)
	{
		$super(e);
		if (this.isLeafItem())
			if (this.getEnablePeriodicalExec())
				this.startPeriodicalExec(e);
	},
	/** @private */
	doReactDeactiviting: function($super, e)
	{
		if (this.isLeafItem())
		{
			//if (this.getEnablePeriodicalExec())
			this.stopPeriodicalExec();  // stop it anyway
			if (this.getIsActive())  // meet a active-deactive event, clicked or key pressed on menu
			{
				this.execute(e);
			}
		}
	}
});

/**
 * An menu widget.
 * @class
 * @augments Kekule.Widget.BaseWidget
 *
 * @property {Bool} isSubMenu Whether the object is a nested sub menu.
 */
Kekule.Widget.Menu = Class.create(Kekule.Widget.BaseWidget,
/** @lends Kekule.Widget.Menu# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.Menu',
	/** @private */
	BINDABLE_TAG_NAMES: ['ol', 'ul'],
	/** @private */
	MENU_ITEM_TAG: 'li',
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument)
	{
		//this.setPropStoreFieldValue('useCornerDecoration', true);
		$super(parentOrElementOrDocument);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('isSubMenu', {'dataType': DataType.BOOL, 'serializable': false,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('isSubMenu', value);
				if (value)  // sub menu should always be vertical
					this.setLayout(Kekule.Widget.Layout.VERTICAL);
			}
		});
	},
	/** @ignore */
	initPropValues: function($super)
	{
		$super();
		this.setUseCornerDecoration(true);
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.MENU;
	},
	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('ul');
		return result;
	},
	/** @ignore */
	doBindElement: function($super, element)
	{
		$super(element);
		var child = element.firstChild;
		while(child)
		{
			if (child.nodeType === Node.ELEMENT_NODE)
			{
				this.bindMenuItem(child);
			}
			child = child.nextSibling;
		}
	},
	/** @private */
	doDomElemAdded: function(elem)
	{
		this.bindMenuItem(elem);
	},

	/**
	 * @private
	 */
	bindMenuItem: function(elem)
	{
		if (elem.tagName.toLowerCase() === 'li')
		{
			//console.log('bind item', elem);
			var result = new Kekule.Widget.MenuItem(elem);
			result.setParent(this);
			return result;
		}
	},

	/**
	 * Returns prefered menu list tag (ul or ol) to create new sub menu.
	 * @returns {String}
	 */
	getSubMenuTagName: function()
	{
		return this.getElement().tagName;
	},
	/**
	 * Returns menu item widget in a menu or sub menu element.
	 * @param {HTMLElement} rootMenuElem Set null to get all first level items.
	 * @returns {Array}
	 */
	getMenuItems: function(rootMenuElem)
	{
		if (!rootMenuElem)
			rootMenuElem = this.getElement();
		var elems = DU.getDirectChildElems(menuElem, this.MENU_ITEM_TAG);
		var result = [];
		for (var i = 0, l = elems.length; i < l; ++i)
		{
			var w = Kekule.Widget.getWidgetOnElem(elems[i]);
			if (w && (w instanceof Kekule.Widget.MenuItem))
				result.push(w);
		}
		return result;
	},

	/**
	 * Insert a menu item before refItem. If refItem is not set, new item will be appended.
	 * @param {Kekule.Widget.MenuItem} menuItem
	 * @param {Kekule.Widget.MenuItem} refItem
	 */
	insertMenuItem: function(menuItem, refItem)
	{
		menuItem.insertToWidget(this, refItem)
		return this;
	},
	/**
	 * Append a menu item.
	 * @param {Kekule.Widget.MenuItem} menuItem
	 */
	appendMenuItem: function(menuItem)
	{
		menuItem.appendToWidget(this);
		return this;
	}
});

})();