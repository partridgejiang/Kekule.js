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
	MENUITEM: 'K-MenuItem'
});

/**
 * An menu widget.
 * @class
 * @augments Kekule.Widget.BaseWidget
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
	/** @private */
	SUB_MENU_TAGS: ['ol', 'ul'],
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument)
	{
		this.setPropStoreFieldValue('useCornerDecoration', true);
		$super(parentOrElementOrDocument);
	},
	/** @private */
	initProperties: function()
	{

	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.MENU;
	},
	/** @ignore */
	doBindElement: function($super, element)
	{
		$super(element);
		this.prepareElement(element);
	},
	/** @private */
	doDomElemAdded: function(elem)
	{
		this.prepareElement(elem);
	},

	/**
	 * Prepare element and its children for displaying in menu.
	 * @param {HTMLElement} elem
	 * @private
	 */
	prepareElement: function(elem)
	{
		var tagName = elem.tagName.toLowerCase();
		if ((tagName === 'ul') || (tagName) === 'ol' || (tagName === 'li'))
		{
			if (this.getUseCornerDecoration())
			{
				EU.addClass(elem, CNS.CORNER_ALL);
			}
			else
			{
				EU.removeClass(elem, CNS.CORNER_ALL);
			}
		}
		var child = elem.firstChild;
		while(child)
		{
			if (child.nodeType === Node.ELEMENT_NODE)
				this.prepareElement(child);
			child = child.nextSibling;
		}
	},

	/**
	 * Returns prefered menu list tag (ul or ol) to create new menu list.
	 * @returns {String}
	 */
	getMenuListTagName: function()
	{
		return this.getElement().tagName;
	},
	/**
	 * Returns menu item elements (<li>) in a menu or sub menu element.
	 * @param {HTMLElement} menuListElem Set null to get all first level items.
	 * @returns {Array}
	 */
	getMenuItems: function(menuListElem)
	{
		if (!menuListElem)
			menuListElem = this.getElement();
		return DU.getDirectChildElems(menuListElem, this.MENU_ITEM_TAG);
	},
	/**
	 * Returns sub menu of menuItemElem.
	 * @param {HTMLElement} menuItemElem
	 * @returns {HTMLElement}
	 */
	getSubMenu: function(menuItemElem)
	{
		var result;
		for (var i = 0, l = this.SUB_MENU_TAGS.length; i < l; ++i)
		{
			var tag = this.SUB_MENU_TAGS[i];
			result = DU.getDirectChildElems(menuListElem, tag);
			if (result && result.length)
				break;
		}
		return result;
	},
	/**
	 * Returns sub menu items as children of menuItemElem.
	 * @param {HTMLElement} menuItemElem
	 * @returns {Array}
	 */
	getSubMenuItems: function(menuItemElem)
	{
		return this.getMenuItems(this.getSubMenu(menuItemElem));
	},

	/**
	 * Insert a menu item before refItem. If refItem is not set, new item will be appended.
	 * @param {HTMLElement} menuItemOrListElem
	 * @param {HTMLElement} refItem
	 */
	insertMenuItem: function(menuItemOrListElem, refItem)
	{

	}
});

})();