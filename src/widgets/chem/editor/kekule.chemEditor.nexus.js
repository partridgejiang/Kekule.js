/**
 * @fileoverview
 * Containing a nexus class which can link all essential editor component
 * (including editor, structure tree view and object inspector) together.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /widgets/chem/editor/kekule.chemEditor.baseEditors.js
 * requires /widgets/chem/structureTreeView/kekule.chemWidget/structureTreeViews.js
 * requires 'widgets/advCtrls/objInspector/kekule.widget.objInspectors.js',
 */

(function(){
"use strict";

/**
 * An tree view widget to display internal relationship of chem objects.
 * @class
 * @augments ObjectEx
 *
 * @param {Hash} components A list of related editor components, including
 * 	{editor, structureTreeView, objInspector}
 *
 * @property {Kekule.ChemObject} rootObj Root chem object to be displayed in tree view.
 * @property {Bool} enableLiveUpdate If set to true, the tree view will automatically updated when chem objects changed.
 */
Kekule.Editor.EditorNexus = Class.create(ObjectEx,
/** @lends Kekule.Editor.EditorNexus# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.EditorNexus',
	/** @construct */
	initialize: function(/*$super, */components)
	{
		this.tryApplySuper('initialize')  /* $super() */;
		this._currInvoker = null;
		if (components)
		{
			if (components.editor)
				this.setEditor(components.editor);
			if (components.structureTreeView)
				this.setStructureTreeView(components.structureTreeView);
			if (components.objectInspector)
				this.setObjectInspector(components.objectInspector);
			if (components.issueInspector)
				this.setIssueInspector(components.issueInspector);
		}
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('editor', {'dataType': 'Kekule.Editor.BaseEditor', 'serializable': false,
			'setter': function(value)
			{
				var oldObj = this.getPropStoreFieldValue('editor');
				this.setPropStoreFieldValue('editor', value);
				this.editorChanged(value, oldObj);
			}
		});
		this.defineProp('structureTreeView', {'dataType': 'Kekule.ChemWidget.StructureTreeView', 'serializable': false,
			'setter': function(value)
			{
				var oldObj = this.getPropStoreFieldValue('structureTreeView');
				this.setPropStoreFieldValue('structureTreeView', value);
				this.structureTreeViewChanged(value, oldObj);
			}
		});
		this.defineProp('objectInspector', {'dataType': 'Kekule.Widget.ObjectInspector', 'serializable': false,
			'setter': function(value)
			{
				var oldObj = this.getPropStoreFieldValue('objectInspector');
				this.setPropStoreFieldValue('objectInspector', value);
				this.objectInspectorChanged(value, oldObj);
			}
		});
		this.defineProp('issueInspector', {'dataType': 'Kekule.Editor.IssueInspector', 'serializable': false,
			'setter': function(value)
			{
				var oldObj = this.getPropStoreFieldValue('issueInspector');
				this.setPropStoreFieldValue('issueInspector', value);
				this.issueInspectorChanged(value, oldObj);
			}
		});
	},
	/** @private */
	editorChanged: function(newValue, oldValue)
	{
		if (oldValue)
			this._uninstallEditorEventHandler(oldValue);
		if (newValue)
			this._installEditorEventHandler(newValue);
	},
	/** @private */
	structureTreeViewChanged: function(newValue, oldValue)
	{
		if (oldValue)
			this._uninstallStructureTreeViewEventHandler(oldValue);
		if (newValue)
		{
			this._installStructureTreeViewEventHandler(newValue);
			this._updateByEditor();
		}
	},
	/** @private */
	objectInspectorChanged: function(newValue, oldValue)
	{
		var editor = this.getEditor();
		if (editor)
		{
			if (oldValue)
			{
				if (oldValue.getOperHistory() === editor.getOperHistory())
					oldValue.setOperHistory(null);
			}
			if (newValue)
			{
				newValue.setOperHistory(editor.getOperHistory());
				newValue.setEnableOperHistory(editor.getEnableOperHistory());
				this._updateByEditor();
			}
		}
	},
	/** @private */
	issueInspectorChanged: function(newValue, oldValue)
	{
		if (oldValue)
			this._uninstallIssueInspectorEventHandler(oldValue);
		if (newValue)
			this._installIssueInspectorEventHandler(newValue);
		var editor = this.getEditor();
		if (editor)
		{
			if (newValue)
			{
				this._updateByEditor();  // update rootObj and error executor setting of errorInspector
			}
		}
	},
	/** @private */
	_installEditorEventHandler: function(editor)
	{
		//editor.setEnablePropValueSetEvent(true);
		editor.addEventListener('change', this._reactEditorChanged, this);
		editor.addEventListener('beginUpdateObject', this._reactEditorBeginUpdateObject, this);
		editor.addEventListener('endUpdateObject', this._reactEditorEndUpdateObject, this);
	},
	/** @private */
	_uninstallEditorEventHandler: function(editor)
	{
		editor.removeEventListener('change', this._reactEditorChanged, this);
		editor.removeEventListener('beginUpdateObject', this._reactEditorBeginUpdateObject, this);
		editor.removeEventListener('endUpdateObject', this._reactEditorEndUpdateObject, this);
	},
	/** @private */
	_installStructureTreeViewEventHandler: function(treeView)
	{
		//treeView.setEnablePropValueSetEvent(true);
		treeView.addEventListener('change', this._reactStructureTreeViewChanged, this);
	},
	/** @private */
	_uninstallStructureTreeViewEventHandler: function(treeView)
	{
		treeView.removeEventListener('change', this._reactStructureTreeViewChanged, this);
	},
	/** @private */
	_installIssueInspectorEventHandler: function(issueInspector)
	{
		issueInspector.addEventListener('selectResult', this._reactIssueInspectorSelectResult, this);
	},
	/** @private */
	_uninstallIssueInspectorEventHandler: function(issueInspector)
	{
		issueInspector.removeEventListener('selectResult', this._reactIssueInspectorSelectResult, this);
	},
	/** @private */
	_reactEditorChanged: function(e)
	{
		if (this._currInvoker)  // IMPORTANT, or cause recursion
			return;
		var target = e.target;
		if (target !== this.getEditor())
			return;
		var propNames = e.changedPropNames;
		if (propNames.indexOf('chemObj') >= 0)  // react to root change
		{
			this.changeRootObj(target.getChemObj(), target);
		}
		if (propNames.indexOf('selection') >= 0) // react to selection change
		{
			this.changeSelection(target.getSelection(), target);
		}
		if ((propNames.indexOf('operHistory') >= 0) || (propNames.indexOf('enableOperHistory') >= 0))
		{
			var objInspector = this.getObjectInspector();
			if (objInspector)
			{
				objInspector.setOperHistory(target.getOperHistory());
				objInspector.setEnableOperHistory(target.getEnableOperHistory());
			}
		}
		var issueInspector = this.getIssueInspector();
		if (issueInspector)
		{
			if (propNames.indexOf('issueCheckExecutor') >= 0)
				issueInspector.setIssueCheckExecutor(target.getIssueCheckExecutor());
			if (propNames.indexOf('issueCheckResults') >= 0)
				issueInspector.setCheckResults(target.getIssueCheckResults());

		}
	},
	/** @private */
	_reactEditorBeginUpdateObject: function(e)
	{
		// disable live update of structure tree view
		this.pauseLiveUpdate();
	},
	/** @private */
	_reactEditorEndUpdateObject: function(e)
	{
		// restore live update of structure tree view
		this.resumeLiveUpdate();
	},
	/** @private */
	_updateByEditor: function()
	{
		this._reactEditorChanged({'target': this.getEditor(), 'changedPropNames': ['chemObj', 'selection', 'operHistory', 'issueCheckExecutor', 'issueCheckResults']});
	},
	/** @private */
	_reactStructureTreeViewChanged: function(e)
	{
		if (this._currInvoker)  // IMPORTANT, or cause recursion
			return;
		var target = e.target;
		if (target !== this.getStructureTreeView())
			return;
		// react to selection change
		var propNames = e.changedPropNames;
		if (propNames.indexOf('selection') >= 0)
		{
			var objs = target.getSelectedChemObjs();
			this.changeSelection(objs, target);
		}
	},
	/** @private */
	_reactIssueInspectorSelectResult: function(e)
	{
		var activeResult = e.selectedResult;
		var editor = this.getEditor();
		// reflect to editor
		if (editor && editor.setActiveIssueCheckResult)
			editor.setActiveIssueCheckResult(activeResult);
	},

	/**
	 * Pause live update of structure tree view.
	 * @private
	 */
	pauseLiveUpdate: function()
	{
		var treeView = this.getStructureTreeView();
		if (treeView)
		{
			treeView.pauseLiveUpdate();
		}
	},
	/**
	 * Resume the live update status of structure tree view.
	 * @private
	 */
	resumeLiveUpdate: function()
	{
		var treeView = this.getStructureTreeView();
		if (treeView)
			treeView.resumeLiveUpdate();
	},

	/**
	 * Change selection objects in all components (editor, structureTreeView and objInspector).
	 * @param {Array} selection Selected objects
	 * @param {Object} invokerComponent Which component made the selection change.
	 * @private
	 */
	changeSelection: function(selection, invokerComponent)
	{
		this._currInvoker = invokerComponent;
		try
		{
			// change editor
			var editor = this.getEditor();
			if (editor)
			{
				if (this._currInvoker !== editor)
					editor.setSelection(selection);
			}
			// and tree view
			var treeView = this.getStructureTreeView();
			if (treeView)
			{
				if (this._currInvoker !== treeView)
					treeView.selectChemObjs(selection);
			}
			// and object inspector
			var objInspector = this.getObjectInspector();
			if (objInspector)
			{
				if (this._currInvoker !== objInspector)
				{
					objInspector.setObjects(selection);
				}
			}
		}
		finally
		{
			this._currInvoker = null;
		}
	},
	/**
	 * Change root object in all components (editor, structureTreeView and objInspector).
	 * @param {Array} selection Selected objects
	 * @param {Object} invokerComponent Which component made the root change.
	 * @private
	 */
	changeRootObj: function(root, invokerComponent)
	{
		this._currInvoker = invokerComponent;
		try
		{
			// change editor
			var editor = this.getEditor();
			if (editor && this._currInvoker !== editor)
				editor.setChemObj(root);
			var treeView = this.getStructureTreeView();
			if (treeView && this._currInvoker !== treeView)
				treeView.setRootObj(root);
			var errorInspector = this.getIssueInspector();
			if (errorInspector && this._currInvoker !== errorInspector)
				errorInspector.setRootObj(root);
		}
		finally
		{
			this._currInvoker = null;
		}
	}
});

})();