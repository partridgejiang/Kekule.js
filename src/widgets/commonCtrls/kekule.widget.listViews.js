(function(){
"use strict";

var DU = Kekule.DomUtils;
var EU = Kekule.HtmlElementUtils;
var CNS = Kekule.Widget.HtmlClassNames;

/** @ignore */
Kekule.Widget.HtmlClassNames = Object.extend(Kekule.Widget.HtmlClassNames, {
	LISTVIEW: 'K-ListView',
	LISTVIEW_ITEM_HOLDER: 'K-ListView-ItemHolder',
	LISTVIEW_ITEM: 'K-ListView-Item',
	LISTVIEW_ITEMCONTENT: 'K-ListView-ItemContent'
});

/**
 * List view widget, provide the ability to list/select a series of elements inside.
 * @class
 * @augments Kekule.Widget.NestedContainer
 *
 * @property {Array} items All child list items in list view, array of HTML elements.
 * @property {Array} selection All selected items in list view.
 * @property {Object} selectedItem Most recently selected item in tree view.
 * @property {Bool} enableSelect Whether item selecting is enabled.
 * @property {Bool} enableMultiSelect Whether only one item can be selected at same time.
 * @property {Bool} enableSelectInSelection Whether the most active one is allowed to be selected in selection.
 */
/**
 * Invoked when the selection is changed in the list view.
 *   event param of it has one fields: {selection: Array, selectedItem: HTMLElement}
 * @name Kekule.Widget.ListView#selectionChange
 * @event
 */
Kekule.Widget.ListView = Class.create(Kekule.Widget.BaseWidget,
/** @lends Kekule.Widget.ListView# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.ListView',
	/** @private */
	ITEM_DATA_FIELD: '__$itemData__',
	/** @construct */
	initialize: function(parentOrElementOrDocument)
	{
		this.setPropStoreFieldValue('enableSelect', true);
		this.setPropStoreFieldValue('enableMultiSelect', true);
		this.tryApplySuper('initialize', [parentOrElementOrDocument]);
	},
	/** @private */
	initProperties: function() {
		this.defineProp('items', {'dataType': DataType.ARRAY, 'serializable': false,
			'getter': function()
			{
				var result = [];
				var children = DU.getDirectChildElems(this.getChildrenHolderElement());
				for (var i = 0, l = children.length; i < l; ++i)
				{
					var child = children[i];
					if (this.isChildItemElem(child))
						result.push(child);
				}
				return result;
			}
		});
		this.defineProp('enableSelect', {
			'dataType': DataType.BOOL,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('enableSelect', value);
				if (!value)
					this.clearSelection();
			}
		});
		this.defineProp('enableMultiSelect', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('enableMultiSelect', value);
				if (!value)
					this.clearSelection();
			}
		});
		this.defineProp('enableSelectInSelection', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('enableSelectInSelection', value);
				var curr = this.getSelectedItem();
				if (curr)
				{
					if (value)
					{
						EU.addClass(curr, CNS.STATE_CURRENT_SELECTED);
					}
					else
					{
						EU.removeClass(curr, CNS.STATE_CURRENT_SELECTED);
					}
				}
			}
		});
		this.defineProp('selection', {'dataType': DataType.ARRAY, 'serializable': false,
			'scope': Class.PropertyScope.PUBLIC,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('selection');
				if (!result)
				{
					result = [];
					this.setPropStoreFieldValue('selection', result);
				}
				return result;
			},
			'setter': function(value)
			{
				this.select(value);
			}
		});
		this.defineProp('currSelectedItem', {
			'dataType': DataType.OBJECT, 'serializable': false,
			'getter': function() { return this.getSelectedItem(); },
			'setter': function(value) { this.setSelectedItem(value); }
		});
		this.defineProp('selectedItem', {'dataType': DataType.OBJECT, 'serializable': false,
			'getter': function()
			{
				var selection = this.getSelection();
				return selection.length? selection[selection.length - 1]: null;
			},
			'setter': function(value)
			{
				var item = this.getBelongedChildItem(value);
				if (item)
				{
					if (this.getEnableSelectInSelection())
					{
						var selection = this.getSelection();
						var index = selection.indexOf(item);
						if (index >= 0)
						{
							this.prepareChangingSelection();
							selection.splice(index, 1);
							selection.push(item);   // put item into tail
							this.selectionChanged();
						}
						else
							this.select(item);
					}
					else
						this.select(item);
				}
				else
					this.clearSelection();
			}
		});
	},

	/** @ignore */
	doCreateSubElements: function(doc, docFragment)
	{
		var result = this.tryApplySuper('doCreateSubElements', []);
		this._holderElem = doc.createElement('ul');
		this._holderElem.className = CNS.LISTVIEW_ITEM_HOLDER;
		docFragment.appendChild(this._holderElem);
		result = result.concat(this._holderElem);
		return result;
	},
	/** @ignore */
	getChildrenHolderElement: function()
	{
		return this._holderElem;
	},
	/** @ignore */
	doGetWidgetClassName: function(/*$super*/)
	{
		return this.tryApplySuper('doGetWidgetClassName') + ' ' + CNS.LISTVIEW;
	},
	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('ul');
		return result;
	},

	/**
	 * Returns the HTML class name for all child items.
	 * Descendants can override this method.
	 * @returns {string}
	 */
	getItemClassName: function()
	{
		return CNS.LISTVIEW_ITEM;
	},

	/**
	 *  Create a child item element.
	 *  Descendants can override doCreateChildItem to create their own.
	 *  @returns {HTMLElement}
	 */
	createChildItem: function(data)
	{
		var result = this.doCreateChildItem(data);
		if (result)
		{
			EU.addClass(result, this.getItemClassName());
			if (data)
				this.setItemData(result, data);
		}
		return result;
	},
	/** @private */
	doCreateChildItem: function(data)
	{
		var doc = this.getDocument();
		var result = doc.createElement('li');
		return result;
	},

	/**
	 * Returns data previously set to itemElem.
	 * @param {HTMLElement} item
	 * @returns {Variant}
	 */
	getItemData: function(item)
	{
		return item[this.ITEM_DATA_FIELD];
	},
	/**
	 * Set data associated with item.
	 * @param {HTMLElement} item
	 * @param {Variant} data
	 */
	setItemData: function(item, data)
	{
		this.doSetItemData(item, data);
		item[this.ITEM_DATA_FIELD] = data;
		return this;
	},
	/**
	 * Do actual work of method setItemData.
	 * Descendants should override this method.
	 * @param {HTMLElement} item
	 * @param {Variant} data
	 * @private
	 */
	doSetItemData: function(item, data)
	{
		if (data)
		{
			if (data.text)
				DU.setElementText(item, data.text);
			if (data.hint)
				item.setAttribute('title', data.hint);
		}
	},

	/**
	 * Check if an element is one of the the child item in the list.
	 * @param {HTMLElement} elem
	 * @returns {Bool}
	 */
	isChildItemElem: function(elem)
	{
		return (elem.parentNode === this.getChildrenHolderElement()) && EU.hasClass(elem, CNS.LISTVIEW_ITEM);
	},
	/** @private */
	getBelongedChildItem: function(elem)
	{
		if (DU.isDescendantOf(elem, this.getElement()))
		{
			if (this.isChildItemElem(elem))
				return elem;
			else
				return this.getBelongedChildItem(elem.parentNode);
		}
		else
			return null;
	},

	/**
	 * List all child items.
	 * @returns {Array}
	 */
	getAllChildItems: function()
	{
		var result = [];
		var children = DU.getDirectChildElems(this.getChildrenHolderElement());
		for (var i = 0, l = children.length; i < l; ++i)
		{
			var child = children[i];
			if (this.isChildItemElem(child))
			{
				result.push(child);
			}
		}
		return result;
	},
	/**
	 * Returns all items between item1 and item2 (including item1 and item2).
	 * @param {HTMLElement} item1
	 * @param {HTMLElement} item2
	 * @returns {Array}
	 */
	getChildItemElemRange: function(item1, item2)
	{
		var allItems = this.getAllChildItems();
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
	},

	/**
	 * Returns the index of item in list.
	 * @param {HTMLElement} elem
	 * @returns {Int}
	 */
	indexOfItem: function(elem)
	{
		var result = -1;
		var itemElem = this.getBelongedChildItem(elem);
		if (itemElem)
		{
			var allItems = this.getAllChildItems();
			result = allItems.indexOf(itemElem);
		}
		return result;
	},
	/**
	 * Returns item element at index.
	 * @param {Int} index
	 * @returns {HTMLElement}
	 */
	getItemAt: function(index)
	{
		var allItems = this.getAllChildItems();
		return allItems[index];
	},
	/** @private */
	_itemBeforeInsert: function(item)
	{

	},
	/** @private */
	_itemInserted: function(item)
	{
		EU.addClass(item, this.getItemClassName());
	},
	/** @private */
	_itemBeforeRemove: function(item)
	{
		if (this.isItemSelected(item))
			this.removeFromSelection(item);
		EU.removeClass(item, this.getItemClassName());
	},
	/** @private */
	_itemRemoved: function(item)
	{

	},

	/**
	 * Append an item element to the tail of list.
	 * @param {HTMLElement} item
	 */
	appendItem: function(item)
	{
		if (!item)
			item = this.createChildItem();
		else if (!DU.isElement(item))  // is hash
			item = this.createChildItem(item);
		this._itemBeforeInsert(item);
		this.getChildrenHolderElement().appendChild(item);
		this._itemInserted(item);
		return item;
	},
	/**
	 * Insert an item element before refItem.
	 * @param {HTMLElement} elem
	 * @param {HTMLElement} refElem
	 */
	insertItemBefore: function(item, refItem)
	{
		if (!item)
			item = this.createChildItem();
		else if (!DU.isElement(item))  // is hash
			item = this.createChildItem(item);
		var ref = refItem && this.getBelongedChildItem(refItem);
		if (!ref)
			return this.appendItem(item);
		else
		{
			this._itemBeforeInsert(item);
			this.getChildrenHolderElement().insertBefore(item, ref);
			this._itemInserted(item);
			return item;
		}
	},
	/**
	 * Remove an item element in the list.
	 * @param {HTMLElement} item
	 */
	removeItem: function(item)
	{
		var elem = this.getBelongedChildItem(item);
		this._itemBeforeRemove(elem);
		this.getChildrenHolderElement().removeChild(elem);
		this._itemRemoved(elem);
		return item;
	},
	/**
	 * Remove items from list.
	 * @param {Array} items
	 */
	removeItems: function(items)
	{
		for (var i = items.length - 1; i >= 0; --i)
		{
			this.removeItem(items[i]);
		}
		return this;
	},
	/**
	 * Clear all child items in list.
	 */
	clearItems: function()
	{
		this.select();
		var items = this.getItems();
		this.removeItems(items);
		return this;
	},


	// methods about selection
	/**
	 * Check if an item is selected.
	 * @param {HTMLElement} item
	 * @returns {Bool}
	 */
	isItemSelected: function(item)
	{
		var selection = this.getSelection();
		return selection? (selection.indexOf(item) >= 0): false;
	},

	/**
	 * Called before changing selection.
	 * @private
	 */
	prepareChangingSelection: function()
	{
		this._prevSelectedItem = this.getSelectedItem();
	},
	/**
	 * Notify the selection of tree view has been just changed.
	 * @private
	 */
	selectionChanged: function(added, removed)
	{
		var eventParams = {
			'selection': this.getSelection(), 'selectedItem': this.getSelectedItem(),
			'added': added, 'removed': removed
		};

		var currSelectedItem = this.getSelectedItem();
		if (this._prevSelectedItem && this._prevSelectedItem !== currSelectedItem)
		{
			eventParams.prevSelectedItem = this._prevSelectedItem;
			EU.removeClass(this._prevSelectedItem, CNS.STATE_CURRENT_SELECTED);
			this._prevSelectedItem = null;
		}
		if (currSelectedItem && this.getEnableSelectInSelection())
		{
			EU.addClass(currSelectedItem, CNS.STATE_CURRENT_SELECTED);
		}

		this.notifyPropSet('selection', this.getSelection());
		this.invokeEvent('selectionChange', eventParams);
	},

	/**
	 * Clear all items in selection.
	 */
	clearSelection: function()
	{
		var selection = this.getSelection();
		if (selection.length)
		{
			this.prepareChangingSelection();
			this.doClearSelection();
			this.selectionChanged(null, selection);
		}
		return this;
	},
	/** @private */
	doClearSelection: function()
	{
		var selection = this.getSelection();
		if (selection.length)
		{
			for (var i = 0, l = selection.length; i < l; ++i)
			{
				var item = this.getBelongedChildItem(selection[i]);
				EU.removeClass(item, [CNS.STATE_SELECTED, CNS.STATE_CURRENT_SELECTED]);
			}
			this.setPropStoreFieldValue('selection', []);
		}
	},

	/**
	 * Remove items from selection.
	 * @param {Variant} items An item element or array of items.
	 */
	removeFromSelection: function(items)
	{
		if (items)
		{
			var removed = [];
			var removes = Kekule.ArrayUtils.toArray(items);
			if (removes && removes.length)
			{
				var selection = this.getSelection();
				this.prepareChangingSelection();
				for (var i = 0, l = removes.length; i < l; ++i)
				{
					var item = removes[i];
					if (Kekule.ArrayUtils.remove(selection, item))
					{
						EU.removeClass(this.getBelongedChildItem(item), [CNS.STATE_SELECTED, CNS.STATE_CURRENT_SELECTED]);
						removed.push(item);
					}
				}
				this.selectionChanged(null, removed);
			}
		}
		return this;
	},

	/**
	 * Add items to selection.
	 * @param {Variant} items An item element or array of items.
	 */
	addToSelection: function(items)
	{
		if (items)
		{
			var adds = Kekule.ArrayUtils.toArray(items);
			if (adds && adds.length)
			{
				this.prepareChangingSelection();
				var added = this.doAddToSelection(adds);
				this.selectionChanged(added);
			}
		}
		return this;
	},
	/** @private */
	doAddToSelection: function(items)
	{
		var result = [];
		var adds = Kekule.ArrayUtils.toArray(items);
		if (adds && adds.length)
		{
			if (!this.getEnableMultiSelect())
			{
				/*
				this.doClearSelection();
				adds = [adds[adds.length - 1]];
				*/
				this.clearSelection();
			}

			{
				var selection = this.getSelection();
				for (var i = 0, l = adds.length; i < l; ++i)
				{
					var item = adds[i];
					if (!this.isItemSelected(item))
					{
						EU.addClass(this.getBelongedChildItem(item), CNS.STATE_SELECTED);
						//selection.push(item);
						selection.splice(selection.length - 1, 0, item);  // push before last one, ensure the selectedItem not changed
						result.push(item);
					}
				}
			}
		}
		return result;
	},

	/**
	 * Toggle selection state of items.
	 * @param {Variant} items An item element or array of items.
	 */
	toggleSelectionState: function(items)
	{
		if (items)
		{
			this.beginUpdate();
			try
			{
				var toggles = Kekule.ArrayUtils.toArray(items);
				var selection = this.getSelection();
				if (toggles && toggles.length)
				{
					for (var i = 0, l = toggles.length; i < l; ++i)
					{
						var item = toggles[i];
						if (this.isItemSelected(item))
							this.removeFromSelection(item);
						else
							this.addToSelection(item)
					}
				}
			}
			finally
			{
				this.endUpdate();
			}
		}
	},

	/**
	 * Select items in tree view.
	 * @param {Variant} items An item element or array of items.
	 */
	select: function(items)
	{
		this.beginUpdate();
		try
		{
			if (this.getSelection().length)
			{
				/*
				if (!items)
					this.clearSelection();  // since addToSelection will not be called, in here we invoke prepare/done selection methods
				else
				{
					this.doClearSelection();
				}
				*/
				this.clearSelection();
			}
			if (items)
			{
				var objs = Kekule.ArrayUtils.toArray(items);
				var addedItems = this.getEnableMultiSelect()? objs: objs[objs.length - 1];
				this.addToSelection(addedItems);
			}
		}
		finally
		{
			this.endUpdate();
		}
	},

	// event handlers
	/** @private */
	react_click: function(e)
	{
		if (this.getEnableSelect())
		{
			var target = e.getTarget();
			var item = this.getBelongedChildItem(target);
			if (!item)  // click on blank place, clear selection
			{
				this.select(null);
			}
			else if (this.getEnableMultiSelect())
			{
				// check shift and ctrl key state
				if (e.getShiftKey())  // range select
				{
					var selected = this.getSelectedItem();
					if (selected)
					{
						var range = this.getChildItemElemRange(selected, item);
						if (range.length)
						{
							if (e.getCtrlKey())
								this.addToSelection(range);
							else
								this.select(range);
						}
					}
					else
						this.select(item);
				}
				else if (e.getCtrlKey())  // toggle selection state
				{
					this.toggleSelectionState(item);
				}
				else if (item)  // select item directly
				{
					if (this.getEnableSelectInSelection() && this.isItemSelected(item))
						this.setSelectedItem(item);
					else
						this.select(item);
				}
			}
			else
			{
				this.select(item);
			}
		}

		return this.tryApplySuper('react_click', [e]);
	}
});


})();