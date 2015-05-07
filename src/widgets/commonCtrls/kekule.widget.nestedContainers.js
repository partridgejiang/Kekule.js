/**
 * @fileoverview
 * Base class of container that can hold a set of nested children (e.g., menu, tree view).
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
"use strict";

/** @ignore */
Kekule.Widget.HtmlClassNames = Object.extend(Kekule.Widget.HtmlClassNames, {
	/* Indicate that all children of current item is hidden. */
	STATE_COLLAPSED: 'K-State-Collapsed',
	STATE_EMPTY: 'K-State-Empty',
	NESTED_CONTAINER: 'K-NestedContainer',
	NESTED_CONTAINER_ITEM: 'K-NestedContainer-Item'
});

/**
 * An abstract nested container.
 * @class
 * @augments Kekule.Widget.BaseWidget
 *
 * @property {Bool} itemInitialExpanded
 */
Kekule.Widget.NestedContainer = Class.create(Kekule.Widget.BaseWidget,
/** @lends Kekule.Widget.NestedContainer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.NestedContainer',
	/** @private */
	DEF_CONTAINER_TAG: 'ul',
	/** @private */
	DEF_ITEM_TAG: 'li',
	/** @private */
	ITEM_DATA_FIELD: '__$itemData__',
	/** @construct */
	initialize: function($super, parentOrElementOrDocument)
	{
		$super(parentOrElementOrDocument);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('itemInitialExpanded', {'dataType': DataType.BOOL});
	},
	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('div');
		return result;
	},
	/** @ignore */
	doBindElement: function($super, element)
	{
		$super(element);
	},

	/** @private */
	getContainerElemTag: function()
	{
		return this.DEF_CONTAINER_TAG;
	},
	/** @private */
	getItemElemTag: function()
	{
		return this.DEF_ITEM_TAG;
	},
	/** @private */
	_createChildItemElem: function()
	{
		var result = this.doCreateChildItemElem();
		Kekule.HtmlElementUtils.addClass(result, Kekule.Widget.HtmlClassNames.NESTED_CONTAINER_ITEM);
		Kekule.HtmlElementUtils.addClass(result, Kekule.Widget.HtmlClassNames.STATE_EMPTY);
		return result;
	},
	/**
	 * Do actual work of _createChildItemElem.
	 * Descendants may override this method.
	 * @private
	 */
	doCreateChildItemElem: function()
	{
		return this.getDocument().createElement(this.getItemElemTag());
	},
	/** @private */
	_createChildContainerElem: function()
	{
		var result = this.doCreateChildContainerElem();
		Kekule.HtmlElementUtils.addClass(result, Kekule.Widget.HtmlClassNames.NESTED_CONTAINER);
		return result;
	},
	/**
	 * Do actual work of _createChildItemElem.
	 * Descendants may override this method.
	 * @private
	 */
	doCreateChildContainerElem: function()
	{
		return this.getDocument().createElement(this.getContainerElemTag());
	},
	/**
	 * Returns container element to hold all children in an item.
	 * Descendants can override this method.
	 * @param {HTMLElement} itemElem
	 * @param {Bool} canCreate If true, a new container element will be created if none exists there.
	 * @returns {HTMLElement}
	 * @private
	 */
	getChildContainerElem: function(itemElem, canCreate)
	{
		if (!itemElem)
			itemElem = this.getElement();
		var elems = itemElem.getElementsByTagName(this.getContainerElemTag());
		var result = elems.length? elems[0]: null;
		if (!result && canCreate)
		{
			result = this._createChildContainerElem();
			itemElem.appendChild(result);
		}
		return result;
	},

	/**
	 * Returns data previously set to itemElem.
	 * @param {HTMLElement} itemElem
	 * @returns {Object}
	 */
	getItemData: function(itemElem)
	{
		return itemElem[this.ITEM_DATA_FIELD];
	},
	/**
	 * Set data associated with itemElem.
	 * If data has an array field named "children", child items will automatically be added
	 */
	setItemData: function(itemElem, data)
	{
		this.doSetItemData(itemElem, data);
		itemElem[this.ITEM_DATA_FIELD] = data;
		var childrenData = data.children;
		if (childrenData && Kekule.ArrayUtils.isArray(childrenData))
		{
			this.clearChildItems(itemElem);
			for (var i = 0, l = childrenData.length; i < l; ++i)
			{
				var childData = childrenData[i];
				this.appendChildItem(itemElem, childData);
			}
		}
		return this;
	},
	/**
	 * Do actual work of method setItemData.
	 * Descendants should override this method.
	 * @param {HTMLElement} childItemElem
	 * @param {Object} data
	 * @private
	 */
	doSetItemData: function(itemElem, data)
	{
		// do nothing here
	},

	/**
	 * Check if there are child under parentItem.
	 * @param {HTMLElement} parentItem
	 * @returns {Bool}
	 */
	hasChildItem: function(parentItem)
	{
		return this.getChildItemCount(parentItem) > 0;
	},
	/**
	 * Returns child item count in a parent item.
	 * @param {HTMLElement} parentItem
	 * @returns {Int}
	 */
	getChildItemCount: function(parentItem)
	{
		return this.getChildren(parentItem).length;
	},
	/**
	 * Returns all child item elements/
	 * @param {HTMLElement} parentItem
	 * @returns {HTMLElementCollection}
	 */
	getChildren: function(parentItem)
	{
		var containerElem = this.getChildContainerElem(parentItem);
		if (containerElem)
		{
			var result = Kekule.DomUtils.getDirectChildElems(containerElem, this.getItemElemTag());
			return result;
		}
		else
			return [];
	},
	/**
	 * Returns child item element at index.
	 * @param {HTMLElement} parentItem
	 * @param {Int} index
	 * @returns {HTMLElement}
	 */
	getChildItemAt: function(parentItem, index)
	{
		var children = this.getChildren(parentItem);
		return (children.length && (children.length > index))? children[index]: null;
	},

	/**
	 * Insert a child item with data to parentItemElem.
	 * @param {HTMLElement} parentItemElem Set to null to insert to root directly.
	 * @param {Variant} childItemElemOrData HTML element or object of data.
	 * @param {Variant} indexOrRefItem Int or HTMLElement.
	 * @returns {HTMLElement} Element added.
	 */
	insertChildItem: function(parentItemElem, childItemElemOrData, indexOrRefItem)
	{
		var result;
		var containerElem = this.getChildContainerElem(parentItemElem, true);
		//if (childItemElemOrData instanceof HTMLElement)  // an element, HTMLElement may cause undefined class error in IE
		//if (childItemElemOrData && (childItemElemOrData.tagName && childItemElemOrData.nodeType))  // is element
		if (childItemElemOrData && Kekule.DomUtils.isElement(childItemElemOrData))
		{
			result = childItemElemOrData;
		}
		else  // data object
		{
			var result = this._createChildItemElem();
			if (!this.getItemInitialExpanded())
				Kekule.HtmlElementUtils.addClass(result, Kekule.Widget.HtmlClassNames.STATE_COLLAPSED);
			if (childItemElemOrData)
				this.setItemData(result, childItemElemOrData);
		}
		var refChild = DataType.isSimpleType(indexOrRefItem)? this.getChildren(parentItemElem)[index]: indexOrRefItem;
		if (refChild)
			containerElem.insertBefore(result, refChild);
		else
			containerElem.appendChild(result);
		this.childItemsChanged(parentItemElem);
		return result;
	},
	/**
	 * Append a child item with data to parentItemElem.
	 * @param {HTMLElement} parentItemElem Set to null to insert to root directly.
	 * @param {Variant} childItemElemOrData HTML element or object of data.
	 * @returns {HTMLElement} Element added.
	 */
	appendChildItem: function(parentItemElem, childItemElemOrData)
	{
		return this.insertChildItem(parentItemElem, childItemElemOrData);
	},
	/**
	 * Remove a child item from parent.
	 * @param {HTMLElement} parentItemElem
	 * @param {HTMLElement} childItemElem
	 */
	removeChildItem: function(parentItemElem, childItemElem)
	{
		var container = this.getChildContainerElem(parentItemElem);
		if (container)
		{
			container.removeChild(childItemElem);
			if (!this.hasChildItem(parentItemElem))  // parent empty, remove container element
				parentItemElem.removeChild(container);
			this.childItemsChanged(parentItemElem);
		}
		return this;
	},
	/**
	 * Remove a child item from parent.
	 * @param {HTMLElement} parentItemElem
	 * @param {Int} index
	 */
	removeChildItemAt: function(parentItemElem, index)
	{
		var child = this.getChildItemAt(parentItemElem, index);
		if (child)
			this.removeChildItem(parentItemElem, child);
		return this;
	},
	/**
	 * Clear all child items from parent.
	 * @param {HTMLElement} parentItemElem
	 */
	clearChildItems: function(parentItemElem)
	{
		var container = this.getChildContainerElem(parentItemElem);
		if (!parentItemElem)
			parentItemElem = this.getElement();
		if (container)
			parentItemElem.removeChild(container);
		this.childItemsChanged(parentItemElem);
	},

	/**
	 * Notify that the child items has been removed or added to parent item.
	 * Descendants can override this method.
	 * @param {HTMLElement} parentItemElem
	 */
	childItemsChanged: function(parentItem)
	{
		if (parentItem)  // not root
		{
			var c = Kekule.Widget.HtmlClassNames.STATE_EMPTY;
			if (this.hasChildItem(parentItem))
				Kekule.HtmlElementUtils.removeClass(parentItem, c);
			else
				Kekule.HtmlElementUtils.addClass(parentItem, c);
		}
	},

	/**
	 * Expand an item.
	 * @param {HTMLElement} item
	 */
	expandItem: function(item)
	{
		Kekule.HtmlElementUtils.removeClass(item, Kekule.Widget.HtmlClassNames.STATE_COLLAPSED);
		return this;
	},
	/**
	 * Collapse an item.
	 * @param {HTMLElement} item
	 */
	collapseItem: function(item)
	{
		Kekule.HtmlElementUtils.addClass(item, Kekule.Widget.HtmlClassNames.STATE_COLLAPSED);
		return this;
	},
	/**
	 * Collapse expanded item or expand collapsed item.
	 * @param {HTMLElement} item
	 */
	toggleExpandStateOfItem: function(item)
	{
		Kekule.HtmlElementUtils.toggleClass(item, Kekule.Widget.HtmlClassNames.STATE_COLLAPSED);
		return this;
	},

	/**
	 * Check if element is an child item of container.
	 * @param {HTMLElement} element
	 * @returns {Bool}
	 */
	isChildItem: function(element)
	{
		return Kekule.HtmlElementUtils.hasClass(element, Kekule.Widget.HtmlClassNames.NESTED_CONTAINER_ITEM);
	},
	/**
	 * Get nearest child item. Element is a child item itself or its child element.
	 * @param {HTMLElement} element
	 * @returns {HTMLElement}
	 */
	getBelongedChildItem: function(element)
	{
		var result = element;
		var root = this.getElement();
		var body = this.getDocument().body;
		while ((result !== root) && (result !== body))
		{
			result = result.parentNode;
			if (this.isChildItem(result))
				return result;
		}
		return null;
	},
	/**
	 * List all child items in order in rootItem.
	 * @param {HTMLElement} rootItem If not set, this method will returns all items in container.
	 * @returns {Array}
	 */
	getAllChildItems: function(rootItem)
	{
		var result = [];
		var containerElem = this.getChildContainerElem(rootItem, false);
		if (containerElem)
		{
			var children = Kekule.DomUtils.getDirectChildElems(containerElem);
			for (var i = 0, l = children.length; i < l; ++i)
			{
				var child = children[i];
				if (this.isChildItem(child))
				{
					result.push(child);
					var items = this.getAllChildItems(child);
					result = result.concat(items);
				}
			}
		}
		return result;
	},
	/**
	 * Returns all items between item1 and item2 (including item1 and item2).
	 * @param {HTMLElement} item1
	 * @param {HTMLElement} item2
	 * @param {HTMLElement} rootItem Set to null to search in whole widget.
	 * @returns {Array}
	 */
	getChildItemRange: function(item1, item2, root)
	{
		var allItems = this.getAllChildItems(root);
		var index1 = allItems.indexOf(item1);
		var index2 = allItems.indexOf(item2);
		if ((index1 >= 0) && (index2 >= 0))
		{
			if (index1 > index2)
			{
				var reversed = true;
				var temp = index1;
				index1 = index2;
				index2 = temp;
			}
			var result = allItems.slice(index1, index2 + 1);
			if (reversed)
				result = result.reverse();
			return result;
		}
		else
			return [];
	}
});
})();