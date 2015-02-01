/**
 * @fileoverview
 * A tree widget to display the internal structure of operation history.
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

var CCNS = Kekule.Widget.HtmlClassNames;

/** @ignore */
Kekule.Widget.HtmlClassNames = Object.extend(Kekule.Widget.HtmlClassNames, {
	OPER_HISTORY_TREE_VIEW: 'K-OperHistory-TreeView'
	/*
	OPER_HISTORY_TREE_VIEW_ITEM_TITLE: 'K-OperHistory-TreeView-ItemTitle',
	OPER_HISTORY_TREE_VIEW_ITEM_TYPE: 'K-OperHistory-TreeView-ItemType'
	*/
});

/**
 * An tree view widget to display internal structure of operation history.
 * @class
 * @augments Kekule.Widget.TreeView
 *
 * @param {Variant} parentOrElementOrDocument
 * @param {Kekule.OperationHistory} operHistory
 *
 * @property {Kekule.OperationHistory} operHistory
 * @property {Bool} enableLiveUpdate If set to true, the tree view will automatically updated when operation history changes.
 */
Kekule.Widget.OperHistoryTreeView = Class.create(Kekule.Widget.TreeView,
/** @lends Kekule.Widget.OperHistoryTreeView# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.OperHistoryTreeView',
	/** @construct */
	initialize: function($super, parentOrElementOrDocument, operHistory)
	{
		$super(parentOrElementOrDocument);
		this.setPropStoreFieldValue('objMap', new Kekule.MapEx(true));
		this.setEnableLiveUpdate(true);
		this.setEnableMultiSelected(true);
		this.setOperHistory(operHistory);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('operHistory', {'dataType': 'Kekule.OperationHistory', 'serializable': false,
			'setter': function(value)
			{
				var oldObj = this.getPropStoreFieldValue('operHistory');
				this.setPropStoreFieldValue('operHistory', value);
				this.operHistoryChanged(value, oldObj);
			}
		});
		this.defineProp('enableLiveUpdate', {'dataType': DataType.BOOL});
		this.defineProp('objMap', {'dataType': 'Kekule.MapEx', 'setter': null, 'serializable': false});  // private property
	},

	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CCNS.OPER_HISTORY_TREE_VIEW;
	},

	/** @private */
	operHistoryChanged: function(newValue, oldValue)
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
		root.addEventListener('operChange', this.reactOperChange, this);
	},
	/** @private */
	_uninstallRootEventHandler: function(root)
	{
		root.removeEventListener('operChange', this.reactOperChange, this);
	},
	/** @private */
	reactOperChange: function(e)
	{
		if (this.getEnableLiveUpdate())
		{
			var obj = e.target;
			this._fillTree(e.target);
		}
	},

	/**
	 * Fill tree with rootObj data.
	 * @param {Kekule.ChemObject} rootObj
	 * @private
	 */
	_fillTree: function(operHistory)
	{
		if (operHistory)
		{
			this.clearChildItems();
			this._updateTreeItem(this.appendChildItem(), operHistory);
			var currOper = operHistory.getCurrOperation();
			var currItem = currOper? this.getObjMap().get(currOper): null;
			this.select(currItem);
		}
	},
	/** @private */
	_getOperChildCount: function(oper)
	{
		if (oper instanceof Kekule.OperationHistory)
			return oper.getOperationCount();
		else if (oper instanceof Kekule.MacroOperation)
			return oper.getChildCount();
		else
			return 0;
	},
	/** @private */
	_getChildOperAt: function(oper, index)
	{
		if (oper instanceof Kekule.OperationHistory)
			return oper.getOperationAt(index);
		else if (oper instanceof Kekule.MacroOperation)
			return oper.getChildAt(index);
		else
			return null;
	},
	/**
	 * Update tree item properties according to chemObj data.
	 * @param {HTMLElement} treeItem
	 * @param {Object} oper
	 * @private
	 */
	_updateTreeItem: function(treeItem, oper)
	{
		var title = this._getOperDisplayTitle(oper);
		var data = {'text': title, 'obj': oper};
		this.setItemData(treeItem, data);
		this.getObjMap().set(oper, treeItem);

		//this.clearChildItems(treeItem);
		var oldChildItemCount = this.getChildItemCount(treeItem);
		var l = this._getOperChildCount(oper);
		for (var i = 0; i < l; ++i)
		{
			var child = this._getChildOperAt(oper, i);
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
	_getOperDisplayTitle: function(oper)
	{
		var result = oper.getClassName();
		var target = oper.getTarget? oper.getTarget(): null;
		if (target && target.getId)
			result += '(target: ' + target.getId() + ')';
		return result;
	}
});

})();