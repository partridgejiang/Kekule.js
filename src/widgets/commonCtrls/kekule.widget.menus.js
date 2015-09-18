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

(function(){
"use strict";

var DU = Kekule.DomUtils;
var EU = Kekule.HtmlElementUtils;
var CNS = Kekule.Widget.HtmlClassNames;

/** @ignore */
Kekule.Widget.HtmlClassNames = Object.extend(Kekule.Widget.HtmlClassNames, {
	MENU: 'K-Menu',
	POPUPMENU: 'K-PopupMenu',
	MENUBAR: 'K-MenuBar',
	MENUITEM: 'K-MenuItem',
	MENUITEM_NORMAL: 'K-MenuItem-Normal',
	MENUITEM_SEPARATOR: 'K-MenuItem-Separator',
	SUBMENU_MARKER: 'K-SubMenu-Marker',
	CHECKMENU_MARKER: 'K-CheckMenu-Marker'
});

/**
 * Menu item in menu widget.
 * @class
 * @augments Kekule.Widget.Container
 *
 * @property {String} text Text on menu.
 * @property {Bool} checked Whether the menu item is checked.
 * @property {Bool} autoCheck If true, the menu item will be automatically checked/unchecked when clicking on it.
 * @property {Bool} isSeparator If true, the menu item is a static separator (single line).
 */
/**
 * Invoked when menu item is checked.
 *   event param of it has field: {widget}
 * @name Kekule.Widget.MenuItem#check
 * @event
 */
Kekule.Widget.MenuItem = Class.create(Kekule.Widget.Container,
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
		this._checkMarker = null;
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('text', {'dataType': DataType.STRING,
			'getter': function() { return Kekule.HtmlElementUtils.getInnerText(this.getElement()); },
			'setter': function(value) {
				if (value === Kekule.Widget.MenuItem.SEPARATOR_TEXT)
					this.setIsSeparator(true);
				else
				{
					if (!!value)
						this.setIsSeparator(false);
					this.changeContentText(value);
				}
			}
		});
		this.defineProp('checked', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				if (this.getPropStoreFieldValue('checked') !== value)
				{
					this.setPropStoreFieldValue('checked', value);
					this.checkChanged();
				}
			}
		});
		this.defineProp('autoCheck', {'dataType': DataType.BOOL});
		this.defineProp('isSeparator', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('isSeparator', value);
				this.isSeparatorChanged(value);
			}
		});
	},
	/** @ignore */
	initPropValues: function($super)
	{
		$super();
		this.setUseCornerDecoration(false);
		this.setIsSeparator(false);
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.MENUITEM; // + ' ' + CNS.MENUITEM_NORMAL;
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
	/** @private */
	isSeparatorChanged: function(isSeparator)
	{
		if (isSeparator)
		{
			this.setText('&nbsp;');
			this.removeClassName(CNS.MENUITEM_NORMAL);
			this.addClassName(CNS.MENUITEM_SEPARATOR);
			this.setStatic(true);
		}
		else
		{
			this.removeClassName(CNS.MENUITEM_SEPARATOR);
			this.addClassName(CNS.MENUITEM_NORMAL);
			this.setStatic(false);
		}
	},

	/** @ignore */
	doBindElement: function($super, element)
	{
		$super(element);
		// check if there is sub menu items
		var children = DU.getDirectChildElems(element);
		for (var i = 0, l = children.length; i < l; ++i)
		{
			var child = children[i];
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

	/** @private */
	checkChanged: function()
	{
		var checked = this.getChecked();
		if (checked)
		{
			this._createCheckMarker();
			this.addClassName(CNS.STATE_CHECKED);
			this.invokeEvent('check');
		}
		else
			this.removeClassName(CNS.STATE_CHECKED);
	},
	/** @private */
	_createCheckMarker: function()
	{
		var result = this._checkMarker;
		if (!result)
		{
			var result = this.getDocument().createElement('span');
			result.className = CNS.CHECKMENU_MARKER;
			this.getElement().appendChild(result);
			this._checkMarker = result;
		}
		return result;
	},
	/** @private */
	_removeCheckMarker: function()
	{
		if (this._checkMarker)
		{
			this._checkMarker.parentNode.removeChild(this._checkMarker);
			this._checkMarker = null;
		}
	},

	/** @ignore */
	childWidgetAdded: function($super, widget)
	{
		$super(widget);
		if (widget instanceof Kekule.Widget.Menu)
		{
			widget.setIsSubMenu(true);
		}
		else if (widget instanceof Kekule.Widget.MenuItem)  // child menu item should be put in sub menu
		{
			var menu = this.getSubMenu(true);
			(function()
				{
					widget.setParent(menu);
					widget.appendToWidget(menu);
				}).defer(10);  // Important: must may item to sub menu after usual child widget add routine
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
			var result = new Kekule.Widget.PopupMenu(elem);
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
	 * @param {Bool} canCreate If no sub menu exists, create a new one.
	 * @returns {Kekule.Widget.Menu}
	 */
	getSubMenu: function(canCreate)
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
		if (canCreate)
		{
			return this.createSubMenu();
		}
		else
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
		var result = new Kekule.Widget.PopupMenu(this);
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
				if (this.getAutoCheck())
					this.setChecked(!this.getChecked());
				this.notifyDeactivated();
			}
		}
	},
	/**
	 * Notify parent menu that this item is activated (executed)
	 * and the menu may be hidden now.
	 * @private
	 */
	notifyDeactivated: function()
	{
		var p = this.getParent();
		if (p && p.childDeactivated)
		{
			p.childDeactivated(this);
		}
	},
	/**
	 * Be notified by child that child has been activated.
	 * @param {Kekule.Widget.BaseWidget} childWidget
	 * @private
	 */
	childDeactivated: function(childWidget)
	{
		var p = this.getParent();
		if (p && p.childDeactivated)
		{
			p.childDeactivated(this);
		}
	}
});
/** @ignore */
Kekule.Widget.MenuItem.SEPARATOR_TEXT = '-';
/**
 * A class method to create menu item from a definition hash.
 * If input parameter is string rather than hash, it will be regarded as
 * menu text. If the text is '-', a separator will be created.
 * @param {Variant} parentOrElementOrDocument
 * @param {Hash} defHash
 * @returns {Kekule.Widget.MenuItem}
 */
Kekule.Widget.MenuItem.createFromHash = function(parentOrElementOrDocument, defHash)
{
	var def = defHash;
	if (DataType.isSimpleValue(def))  // simple string value
	{

		if (def === Kekule.Widget.MenuItem.SEPARATOR_TEXT)  // create separator
			def = {isSeparator: true};
		else
			def = {'text': def};
	}
	if (!def.widget && !def.widgetClass)
		def.widget = Kekule.Widget.MenuItem;
	return Kekule.Widget.createFromHash(parentOrElementOrDocument, def);
};

/**
 * Base class of menu. Do not use it directly. Using {@link Kekule.Widget.PopupMenu} or
 * {@link Kekule.Widget.MenuBar} instead.
 * @class
 * @augments Kekule.Widget.Container
 *
 * @property {Bool} isSubMenu Whether the object is a nested sub menu.
 */
Kekule.Widget.Menu = Class.create(Kekule.Widget.Container,
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
		var children = Kekule.DomUtils.getDirectChildElems(element);
		for (var i = 0, l = children.length; i < l; ++i)
		{
			var child = children[i];
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
	},
	/**
	 * Remove a menu item.
	 * @param {Kekule.Widget.MenuItem} menuItem
	 * @param {Bool} doNotFinalize
	 */
	removeMenuItem: function(menuItem, doNotFinalize)
	{
		menuItem.setParent(null);
		if (!doNotFinalize)
			menuItem.finalize();
	},
	/**
	 * Remove all items in menu.
	 * @param {Bool} doNotFinalize If set to true, the child menu items will not be finalized.
	 */
	clearMenuItems: function(doNotFinalize)
	{
		this.clearWidgets(doNotFinalize);
		return this;
	},
	/**
	 * Returns whether current menu is the top level one.
	 * @returns {Bool}
	 */
	isTopLevel: function()
	{
		var p = this.getParent();
		return !p ||
			!((p instanceof Kekule.Widget.MenuItem) || (p instanceof Kekule.Widget.Menu));
	},

	/**
	 * Be notified by child that child has been activated.
	 * @param {Kekule.Widget.BaseWidget} childWidget
	 * @private
	 */
	childDeactivated: function(childWidget)
	{
		var p = this.getParent();
		if (p)
		{
			if (p.childDeactivated)
			{
				p.childDeactivated(this);
			}
		}
	},
	/**
	 * Create child menu items by hash definitions.
	 * @param {Array} defs Hash definition of child menu items.
	 */
	createChildrenByDefs: function(defs)
	{
		for (var i = 0, l = defs.length; i < l; ++i)
		{
			var def = defs[i];
			var item = Kekule.Widget.MenuItem.createFromHash(this, def);
		}
		return this;
	}
});


/**
 * An popup menu widget.
 * @class
 * @augments Kekule.Widget.Menu
 */
Kekule.Widget.PopupMenu = Class.create(Kekule.Widget.Menu,
/** @lends Kekule.Widget.Menu# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.PopupMenu',
	/** @ignore */
	initPropValues: function($super)
	{
		$super();
		this.setLayout(Kekule.Widget.Layout.VERTICAL);
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.POPUPMENU;
	},
	/** @ignore */
	childDeactivated: function(childWidget)
	{
		//this.hide();
	}
});

/**
 * Menu bar (main manu) widget.
 * This widget is usually the top level menu and will not hide automatically.
 * @class
 * @augments Kekule.Widget.Menu
 */
Kekule.Widget.MenuBar = Class.create(Kekule.Widget.Menu,
/** @lends Kekule.Widget.MenuBar# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.MenuBar',
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.MENUBAR;
	}
});

})();