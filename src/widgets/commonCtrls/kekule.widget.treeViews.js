/**
 * @fileoverview
 * A tree widget.
 * @author Partridge Jiang
 */

(function(){
"use strict";

var EU = Kekule.HtmlElementUtils;
var CNS = Kekule.Widget.HtmlClassNames;

/** @ignore */
Kekule.Widget.HtmlClassNames = Object.extend(Kekule.Widget.HtmlClassNames, {
	TREEVIEW: 'K-TreeView',
	//TREEVIEW_ITEM: 'K-TreeView-Item',
	TREEVIEW_EXPANDMARK: 'K-TreeView-ExpandMark',
	TREEVIEW_ITEMCONTENT: 'K-TreeView-ItemContent'
});

/**
 * Tree view widget.
 * @class
 * @augments Kekule.Widget.NestedContainer
 *
 * @property {Array} selection All selected items in tree view.
 * @property {Object} selectedItem Recent selected item in tree view.
 * @property {Bool} enableMultiSelected Whether only one tree node can be selected at same time.
 */
Kekule.Widget.TreeView = Class.create(Kekule.Widget.NestedContainer,
/** @lends Kekule.Widget.TreeView# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.TreeView',
	/** @private */
	BELONGED_ITEM_FIELD: '__$treeItem__',
	/** @private */
	initProperties: function()
	{
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
		this.defineProp('selectedItem', {'dataType': DataType.OBJECT, 'serializable': false,
			'getter': function()
			{
				var selection = this.getSelection();
				return selection.length? selection[selection.length - 1]: null;
			},
			'setter': function(value)
			{
				this.select(value);
			}
		});
		this.defineProp('enableMultiSelected', {'dataType': DataType.BOOL});
	},
	/** @ignore */
	doGetWidgetClassName: function()
	{
		return CNS.TREEVIEW;
	},
	/** @private */
	doCreateChildItemElem: function($super)
	{
		var result = $super();
		if (result)  // create expand marker
		{
			var marker = this.createGlyphContent(result, null, CNS.TREEVIEW_EXPANDMARK);
			marker[this.BELONGED_ITEM_FIELD] = result;
			result._expandMarkerElem = marker;
			var contenter = this.getDocument().createElement('span');
			contenter.className = CNS.TREEVIEW_ITEMCONTENT;
			result.appendChild(contenter);
			contenter[this.BELONGED_ITEM_FIELD] = result;
			result._contentElem = contenter;
		}
		return result;
	},
	/** @private */
	doSetItemData: function(itemElem, data)
	{
		this.setItemText(itemElem, data.text);
	},
	/** @private */
	getExpandMarkerElem: function(itemElem)
	{
		return itemElem._expandMarkerElem;
	},
	/** @private */
	getItemContentElem: function(itemElem)
	{
		return itemElem._contentElem;
	},
	/** @private */
	getTextPartElem: function(itemElem, canCreate)
	{
		var result = itemElem._textPartElem;
		if (!result && canCreate)
		{
			result = this.createTextContent('', this.getItemContentElem(itemElem));
			itemElem._textPartElem = result;
		}
		return result;
	},
	/**
	 * Set caption of item.
	 * @param {HTMLElement} item
	 * @param {String} text
	 */
	setItemText: function(item, text)
	{
		var elem = this.getTextPartElem(item, true);
		elem.innerHTML = text;
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
	 * Notify the selection of tree view has been just changed.
	 * @private
	 */
	selectionChanged: function()
	{
		this.notifyPropSet('selection', this.getSelection());
	},
	/**
	 * Clear all items in selection.
	 */
	clearSelection: function()
	{
		var selection = this.getSelection();
		if (selection.length)
		{
			for (var i = 0, l = selection.length; i < l; ++i)
			{
				var item = selection[i];
				Kekule.HtmlElementUtils.removeClass(this.getItemContentElem(item), CNS.STATE_SELECTED);
			}
			this.setPropStoreFieldValue('selection', []);
			this.selectionChanged();
		}
		return this;
	},
	/**
	 * Remove items from selection.
	 * @param {Variant} items An item element or array of items.
	 */
	removeFromSelection: function(items)
	{
		if (items)
		{
			var removes = Kekule.ArrayUtils.toArray(items);
			if (removes && removes.length)
			{
				var selection = this.getSelection();
				for (var i = 0, l = removes.length; i < l; ++i)
				{
					var item = removes[i];
					if (Kekule.ArrayUtils.remove(selection, item))
						Kekule.HtmlElementUtils.removeClass(this.getItemContentElem(item), CNS.STATE_SELECTED);
				}
				this.selectionChanged();
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
				if (!this.getEnableMultiSelected())
				{
					this.clearSelection();
					adds = [adds[adds.length - 1]];
				}

				{
					var selection = this.getSelection();
					for (var i = 0, l = adds.length; i < l; ++i)
					{
						var item = adds[i];
						if (!this.isItemSelected(item))
						{
							Kekule.HtmlElementUtils.addClass(this.getItemContentElem(item), CNS.STATE_SELECTED);
							selection.push(item);
						}
					}
				}
				this.selectionChanged();
			}
		}
		return this;
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
			this.clearSelection();
			if (items)
			{
				if (this.getEnableMultiSelected())
					this.addToSelection(items);
				else
				{
					var objs = Kekule.ArrayUtils.toArray(items);
					this.addToSelection(objs[objs.length - 1]);
				}
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
		var target = e.getTarget();
		var item = target[this.BELONGED_ITEM_FIELD];
		if (item && this.isChildItem(item))
		{
			this.toggleExpandStateOfItem(item);
		}
		else
		{
			item = this.getBelongedChildItem(target);
			// check shift and ctrl key state
			if (e.getShiftKey())  // range select
			{
				var selected = this.getSelectedItem();
				if (selected)
				{
					var range = this.getChildItemRange(selected, item);
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
				this.select(item);
			}
		}
	},

	/** @private */
	react_dblclick: function(e)
	{
		var target = e.getTarget();
		var item = this.getBelongedChildItem(target);
		if (item)
		{
			this.toggleExpandStateOfItem(item);
		}
	}
});


})();