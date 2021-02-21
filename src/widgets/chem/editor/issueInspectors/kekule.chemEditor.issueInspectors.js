/**
 * @fileoverview
 * The error inspector widget for chem editor.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /core/kekule.structures.js
 * requires /chemDoc/issueCheckers/kekule.issueCheckers.js
 * requires /widgets/commonCtrls/kekule.widget.listViews.js
 * requires /widgets/chem/editor/issueInspectors/kekule.chemEditor.issueCheckers.js
 * requires /xbrowsers/kekule.x.js
 *
 * requires /localization/kekule.localize.general.js
 */

(function(){

"use strict";

var DU = Kekule.DomUtils;
var EU = Kekule.HtmlElementUtils;
var CNS = Kekule.Widget.HtmlClassNames;
var CCNS = Kekule.ChemWidget.HtmlClassNames;

/** @ignore */
Kekule.ChemWidget.HtmlClassNames = Object.extend(Kekule.ChemWidget.HtmlClassNames, {
	CHECK_RESULT_LIST_VIEW: 'K-Chem-CheckResultListView',
	CHECK_RESULT_LIST_VIEW_ITEM: 'K-Chem-CheckResultListView-Item',
	//CHECK_RESULT_LIST_VIEW_ITEM_MARKER: 'K-Chem-CheckResultListView-ItemMarker',
	CHECK_RESULT_LIST_VIEW_ITEM_BODY: 'K-Chem-CheckResultListView-ItemBody',
	ISSUE_INSPECTOR: 'K-Chem-IssueInspector',
	ISSUE_INSPECTOR_FLEX_LAYOUT: 'K-Chem-IssueInspector-Flex-Layout',
	ISSUE_INSPECTOR_SUBPART: 'K-Chem-IssueInspector-SubPart',
	//ISSUE_INSPECTOR_TOOL_PANEL: 'K-Chem-IssueInspector-ToolPanel',
	ISSUE_INSPECTOR_LIST_PANEL: 'K-Chem-IssueInspector-ListPanel',
});

/**
 * Issue list view widget, provide the ability to list/select a series of error result (@link Kekule.IssueCheck.CheckResult) reported by error checkers.
 * @class
 * @augments Kekule.Widget.ListView
 *
 * @property {Array} checkResults Results reported by error checkers.
 * @property {Kekule.IssueCheck.CheckResult} selectedCheckResult Selected error report in list.
 */
Kekule.ChemWidget.CheckResultListView = Class.create(Kekule.Widget.ListView,
/** @lends Kekule.ChemWidget.CheckResultListView# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.CheckResultListView',
	/** @private */
	initProperties: function()
	{
		this.defineProp('checkResults', {
			'dataType': DataType.ARRAY, 'serializable': false,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('checkResults', value);
				this._updateListView();
			}
		});
		this.defineProp('selectedCheckResult', {
			'dataType': 'Kekule.IssueCheck.CheckResult', 'serializable': false, 'setter': null,
			'getter': function()
			{
				var result;
				var selItem = this.getSelectedItem();
				if (selItem)
				{
					result = this.getItemData(selItem).checkResult;
				}
				return result;
			}
		});
	},
	/** @ignore */
	initPropValues: function()
	{
		this.tryApplySuper('initPropValues');
		this.setEnableSelect(true).setEnableMultiSelect(false).setLayout(Kekule.Widget.Layout.VERTICAL);
	},
	/** @ignore */
	doGetWidgetClassName: function(/*$super*/)
	{
		return this.tryApplySuper('doGetWidgetClassName') + ' ' + CCNS.CHECK_RESULT_LIST_VIEW;
	},
	/** @ignore */
	getItemClassName: function()
	{
		return this.tryApplySuper('getItemClassName') + ' ' + CCNS.CHECK_RESULT_LIST_VIEW_ITEM;
	},
	/** @ignore */
	createChildItem: function(data)
	{
		var itemData;
		if (data instanceof Kekule.IssueCheck.CheckResult)
			itemData = this._wrapCheckResultToItemData(data);
		else
			itemData = data;
		return this.tryApplySuper('createChildItem', [itemData]);
	},
	/** @ignore */
	doCreateChildItem: function(data)
	{
		var doc = this.getDocument();
		var result = doc.createElement('li');
		/*
		// icon part
		var marker = doc.createElement('span');
		marker.className = CCNS.ERROR_LIST_VIEW_ITEM_MARKER;
		result.appendChild(marker);
		*/
		// text part
		var textPart = doc.createElement('span');
		textPart.className = CCNS.CHECK_RESULT_LIST_VIEW_ITEM_BODY;
		result.appendChild(textPart);
		return result;
	},
	/** @ignore */
	doSetItemData: function(item, data)
	{
		if (data)
		{
			if (data.text)
			{
				DU.setElementText(item.getElementsByClassName(CCNS.CHECK_RESULT_LIST_VIEW_ITEM_BODY)[0], data.text);
			}
			if (data.hint)
				item.setAttribute('title', data.hint);
		}
	},
	/** @private */
	_wrapCheckResultToItemData: function(checkResult)
	{
		var msg = checkResult.getMessage();
		var result = {
			'text': msg,
			'hint': msg,
			'checkResult': checkResult
		};
		return result;
	},
	/** @private */
	_updateListView: function()
	{
		this.clearItems();
		var checkResults = this.getCheckResults() || [];
		for (var i = 0, l = checkResults.length; i < l; ++i)
		{
			var itemElem = this.appendItem(checkResults[i]);
			EU.addClass(itemElem, this._getErrorLevelHtmlClass(checkResults[i].getLevel()));
		}
	},
	/** @private */
	_getErrorLevelHtmlClass: function(errorLevel)
	{
		var EL = Kekule.ErrorLevel;
		var result = (errorLevel === EL.LOG|| errorLevel === EL.NOTE)? CNS.MSG_INFO:
			(errorLevel === EL.WARNING)? CNS.MSG_WARNING:
			CNS.MSG_ERROR;
		return result;
	}
});

/**
 * Error inspector widget used by editor.
 * @class
 * @augments Kekule.Widget.BaseWidget
 *
 * @property {Array} errorResults Results reported by error checkers.
 * @property {Kekule.IssueCheck.CheckResult} selectedResult Selected error report in list.
 */
/**
 * Invoked when selecting a check result in list and making it active.
 *   event param of it has field: {selectedResult}
 * @name Kekule.Editor.IssueInspector#selectResult
 * @event
 */
Kekule.Editor.IssueInspector = Class.create(Kekule.Widget.BaseWidget,
/** @lends Kekule.Editor.IssueInspector# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.IssueInspector',
	/** @constructs */
	initialize: function(parentOrElementOrDocument)
	{
		this._reactExecutorExecuteBind = this._reactExecutorExecute.bind(this);
		this.tryApplySuper('initialize', [parentOrElementOrDocument]);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('issueCheckExecutor', {'dataType': 'Kekule.IssueCheck.Executor', 'serializable': false,
			'setter': function(value)
			{
				var old = this.getIssueCheckExecutor();
				if (value !== old)
				{
					this.setPropStoreFieldValue('issueCheckExecutor', value);
					this._issueCheckExecutorChanged(old, value);
				}
			}
		});
		this.defineProp('rootObj', {'dataType': 'Kekule.ChemObject', 'serializable': false});
		this.defineProp('checkResults', {
			'dataType': DataType.ARRAY, 'serializable': false,
			'getter': function() { return this.getResultListView().getCheckResults(); },
			'setter': function(value)	{	this.getResultListView().setCheckResults(value); }
		});
		this.defineProp('selectedResult', {
			'dataType': 'Kekule.IssueCheck.CheckResult', 'serializable': false, 'setter': null,
			'getter': function() { return this.getResultListView().getSelectedResult(); }
		});
		// private
		this.defineProp('resultListView', {'dataType': 'Kekule.ChemWidget.CheckResultListView', 'serializable': false, 'setter': null, 'scope': Class.PropertyScope.PRIVATE});
	},
	/** @ignore */
	doFinalize: function()
	{
		this._finalizeChildWidgets();
		this.tryApplySuper('doFinalize');
	},
	/** @private */
	_finalizeChildWidgets: function()
	{
		var list = this.getResultListView();
		if (list)
			list.finalize();
		this.setPropStoreFieldValue('resultListView', null);
	},

	/** @private */
	_isUsingFlexLayout: function()
	{
		return !!Kekule.BrowserFeature.cssFlex;
	},
	/** @ignore */
	doGetWidgetClassName: function()
	{
		var result = CCNS.ISSUE_INSPECTOR;
		if (this._isUsingFlexLayout())
			result += ' ' + CCNS.ISSUE_INSPECTOR_FLEX_LAYOUT;
		return result;
	},
	/** @ignore */
	getChildrenHolderElement: function(/*$super*/)
	{
		return this._listPanelElem || this.tryApplySuper('getChildrenHolderElement');
	},
	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('div');
		return result;
	},
	/** @ignore */
	doCreateSubElements: function(doc, element)
	{
		var result = this.tryApplySuper('doCreateSubElements', [doc, element]) || [];

		/*
		// tool panel
		var toolPanelElem = this._createSubPartElem(doc);
		EU.addClass(toolPanelElem, CCNS.ISSUE_INSPECTOR_TOOL_PANEL);
		this._toolPanelElem = toolPanelElem;
		element.appendChild(toolPanelElem);
		result.push(toolPanelElem);
		*/

		// list view
		var listPanelElem = this._createSubPartElem(doc);
		EU.addClass(listPanelElem, CCNS.ISSUE_INSPECTOR_LIST_PANEL);
		this._listPanelElem = listPanelElem;

		element.appendChild(listPanelElem);
		result.push(listPanelElem);

		this._createChildWidgets();
		return result;
	},
	/** @private */
	_createSubPartElem: function(doc)
	{
		var result = doc.createElement('div');
		result.className = CCNS.ISSUE_INSPECTOR_SUBPART;
		return result;
	},
	/** @private */
	_createChildWidgets: function()
	{
		this._finalizeChildWidgets();  // free old ones
		// issue listView
		var listView = new Kekule.ChemWidget.CheckResultListView(this);
		//var listView = new Kekule.Widget.TreeView(this);
		listView.setUseCornerDecoration(true);
		listView.appendToElem(this._listPanelElem);
		var self = this;
		listView.addEventListener('selectionChange', function(e){
			if (e.target === listView)
			{
				var selItem = e.selectedItem;
				var checkResult;
				if (selItem)
				{
					checkResult = listView.getItemData(selItem).checkResult;
				}
				self.invokeEvent('selectResult', {'selectedResult': checkResult});
			}
		});
		this.setPropStoreFieldValue('resultListView', listView);

		/*
		// refresh button
		var btn = new Kekule.Widget.Button(this);
		btn.setText(Kekule.$L('ChemWidgetTexts.CAPTION_RECHECK_ISSUES')).setHint(Kekule.$L('ChemWidgetTexts.HINT_RECHECK_ISSUES'));
		btn.appendToElem(this._toolPanelElem);
		var self = this;
		btn.addEventListener('execute', function(e) {
			self.refreshIssues();
		});
		*/
	},

	/*
	 * Check errors for rootObj and shows result in view.
	 * @param {Kekule.ChemObject} rootObj
	 * @returns {Array} Error check results.
	 */
	/*
	refreshIssues: function(rootObj)
	{
		var result;
		var root = rootObj || this.getRootObj();
		var executor = this.getIssueCheckExecutor();
		if (root && executor)
		{
			result = executor.execute(root);
			//this.setCheckResults(result);
		}
		return result;
	},
	*/

	/** @private */
	_issueCheckExecutorChanged: function(oldValue, newValue)
	{
		if (oldValue)
			oldValue.removeEventListener('execute', this._reactExecutorExecuteBind);
		if (newValue)
			newValue.addEventListener('execute', this._reactExecutorExecuteBind);
	},
	/** @private */
	_reactExecutorExecute: function(e)
	{
		this.setCheckResults(e.checkResults);
	},

	/**
	 * Deselect the active issue item.
	 */
	deselect: function()
	{
		this.getResultListView().clearSelection();
	},
});


})();