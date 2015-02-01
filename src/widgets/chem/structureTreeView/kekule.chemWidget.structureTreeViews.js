/**
 * @fileoverview
 * A tree widget to display the internal structure of chem object (such as ChemSpace, Molecule and so on).
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /widgets/kekule.widget.nestedContainers.js
 * requires /widgets/commonCtrls/kekule.widget.treeViews.js
 * requires /widgets/chem/kekule.chemWidget.base.js
 */

(function(){

"use strict";

var CCNS = Kekule.ChemWidget.HtmlClassNames;

/** @ignore */
Kekule.ChemWidget.HtmlClassNames = Object.extend(Kekule.ChemWidget.HtmlClassNames, {
	CHEM_STRUCT_TREE_VIEW: 'K-Chem-Struct-TreeView',
	CHEM_STRUCT_TREE_VIEW_ITEM_TITLE: 'K-Chem-Struct-TreeView-ItemTitle',
	CHEM_STRUCT_TREE_VIEW_ITEM_TYPE: 'K-Chem-Struct-TreeView-ItemType'
});

/**
 * An tree view widget to display internal relationship of chem objects.
 * @class
 * @augments Kekule.Widget.TreeView
 *
 * @param {Variant} parentOrElementOrDocument
 * @param {Kekule.ChemObject} rootObj
 *
 * @property {Kekule.ChemObject} rootObj Root chem object to be displayed in tree view.
 * @property {Bool} enableLiveUpdate If set to true, the tree view will automatically updated when chem objects changed.
 */
Kekule.ChemWidget.StructureTreeView = Class.create(Kekule.Widget.TreeView,
/** @lends Kekule.ChemWidget.StructureTreeView# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.StructureTreeView',
	/** @construct */
	initialize: function($super, parentOrElementOrDocument, rootObj)
	{
		$super(parentOrElementOrDocument);
		this.setPropStoreFieldValue('objMap', new Kekule.MapEx(true));
		this.setEnableLiveUpdate(true);
		this.setEnableMultiSelected(true);
		this.setRootObj(rootObj);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('rootObj', {'dataType': 'Kekule.ChemObject', 'serializable': false,
			'setter': function(value)
			{
				var oldObj = this.getPropStoreFieldValue('rootObj');
				this.setPropStoreFieldValue('rootObj', value);
				this.rootObjChanged(value, oldObj);
			}
		});
		this.defineProp('enableLiveUpdate', {'dataType': DataType.BOOL});
		this.defineProp('objMap', {'dataType': 'Kekule.MapEx', 'setter': null, 'serializable': false});  // private property
	},

	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CCNS.CHEM_STRUCT_TREE_VIEW;
	},

	/** @private */
	rootObjChanged: function(newValue, oldValue)
	{
		this.clearChildItems();
		this.getObjMap().clear();
		if (oldValue)
			this._uninstallRootEventHandler(oldValue);
		if (newValue)
		{
			this._fillTree(newValue);
			this._installRootEventHandler(newValue);
		}
	},
	/** @private */
	_installRootEventHandler: function(root)
	{
		root.addEventListener('change', this.reactChemObjChange, this);
	},
	/** @private */
	_uninstallRootEventHandler: function(root)
	{
		root.removeEventListener('change', this.reactChemObjChange, this);
	},
	/** @private */
	reactChemObjChange: function(e)
	{
		if (this.getEnableLiveUpdate())
		{
			var obj = e.target;
			// get corresponding tree node
			var treeItem = this.getObjMap().get(obj);
			if (treeItem)
			{
				//console.log(e, obj.getClassName(), treeItem);
				this._updateTreeItem(treeItem, obj);
			}
		}
	},

	/**
	 * Fill tree with rootObj data.
	 * @param {Kekule.ChemObject} rootObj
	 * @private
	 */
	_fillTree: function(rootObj)
	{
		if (rootObj)
		{
			this.clearChildItems();
			this._updateTreeItem(this.appendChildItem(), rootObj);
		}
	},
	/**
	 * Update tree item properties according to chemObj data.
	 * @param {HTMLElement} treeItem
	 * @param {Kekule.ChemObject} chemObj
	 * @private
	 */
	_updateTreeItem: function(treeItem, chemObj)
	{
		var title = this._getChemObjDisplayTitle(chemObj);
		var data = {'text': title, 'obj': chemObj};
		this.setItemData(treeItem, data);
		this.getObjMap().set(chemObj, treeItem);
		//this.clearChildItems(treeItem);
		var oldChildItemCount = this.getChildItemCount(treeItem);
		var l = chemObj.getChildCount();
		for (var i = 0; i < l; ++i)
		{
			var child = chemObj.getChildAt(i);
			if (!child.isSelectable())
				continue;
			//var childItem = this.appendChildItem(treeItem);
			var childItem;
			if (i < oldChildItemCount)
				childItem = this.getChildItemAt(treeItem, i);
			else
				childItem = this.appendChildItem(treeItem);
			this._updateTreeItem(childItem, child);
		}
		// remove extra tree nodes
		if (oldChildItemCount > l)
		{
			for (var i = oldChildItemCount - 1; i >= l; --i)
			{
				this.removeChildItemAt(treeItem, i);
			}
		}
	},
	/** @private */
	_getChemObjDisplayTitle: function(chemObj)
	{
		var result = '';
		var id = chemObj.getId();
		if (id)
			result += '<span class="' + CCNS.CHEM_STRUCT_TREE_VIEW_ITEM_TITLE + '">' + id + '</span>';
		var className = chemObj.getClassName();
		// get last part of className
		var cnameParts = className.split('.');
		var cname = cnameParts.length? cnameParts[cnameParts.length - 1]: className;
		var stype = '<span class="' + CCNS.CHEM_STRUCT_TREE_VIEW_ITEM_TYPE + '">(' + cname + ')</span>';
		//return result + '(' + cname + ')';
		return result + stype;
	},

	/**
	 * Make tree items corresponding to chemObjs to be selected.
	 * @param {Array} chemObjs
	 */
	selectChemObjs: function(chemObjs)
	{
		var items = [];
		for (var i = 0, l = chemObjs.length; i < l; ++i)
		{
			var obj = chemObjs[i];
			var item = this.getObjMap().get(obj);
			if (item)
				items.push(item);
		}
		this.select(items);
		return this;
	},
	/**
	 * Returns corresponding chemObjs linked to selected tree items.
	 * @returns {Array}
	 */
	getSelectedChemObjs: function()
	{
		var result = [];
		var items = this.getSelection();
		if (items && items.length)
		{
			for (var i = 0, l = items.length; i < l; ++i)
			{
				var data = this.getItemData(items[i]);
				if (data && data.obj)
					result.push(data.obj);
			}
		}
		return result;
	}
});

})();