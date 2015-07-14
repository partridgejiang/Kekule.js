/**
 * @fileoverview
 * Implementation of object inspector.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /utils/kekule.domUtils.js
 * requires /xbrowsers/kekule.x.js
 * requires /widgets/operation/kekule.operations.js
 * requires /widgets/kekule.widget.base.js
 * requires /widgets/commonCtrls/kekule.widget.formControls.js
 * requires /widgets/advCtrls/kekule.widget.valueListEditors.js
 * requires /widgets/advCtrls/objInspector/kekule.widget.objInspector.propEditors.js
 * requires /widgets/advCtrls/objInspector/kekule.widget.objInspector.operations.js
 */

(function(){

"use strict";

var DU = Kekule.DomUtils;
var EU = Kekule.HtmlElementUtils;
var SU = Kekule.StyleUtils;
var CNS = Kekule.Widget.HtmlClassNames;

/** @ignore */
Kekule.Widget.HtmlClassNames = Object.extend(Kekule.Widget.HtmlClassNames, {
	PROPLISTEDITOR: 'K-PropListEditor',
	PROPLISTEDITOR_PROPEXPANDMARKER: 'K-PropListEditor-PropExpandMarker',
	PROPLISTEDITOR_PROPEXPANDED: 'K-PropListEditor-PropExpanded',
	PROPLISTEDITOR_PROPCOLLAPSED: 'K-PropListEditor-PropCollapsed',
	PROPLISTEDITOR_INDENTDECORATOR: 'K-PropListEditor-IndentDecorator',
	PROPLISTEDITOR_READONLY: 'K-PropListEditor-ReadOnly',

	OBJINSPECTOR: 'K-ObjInspector',
	OBJINSPECTOR_SUBPART: 'K-ObjInspector-SubPart',
	OBJINSPECTOR_OBJSINFOPANEL: 'K-ObjInspector-ObjsInfoPanel',
	OBJINSPECTOR_PROPINFOPANEL: 'K-ObjInspector-PropInfoPanel',
	OBJINSPECTOR_PROPINFO_TITLE: 'K-ObjInspector-PropInfoPanel-Title',
	OBJINSPECTOR_PROPINFO_DESCRIPTION: 'K-ObjInspector-PropInfoPanel-Description',
	OBJINSPECTOR_PROPLISTEDITOR_CONTAINER: 'K-ObjInspector-PropListEditorContainer'
});

/**
 * An value list editor to edit object properties.
 * @class
 * @augments Kekule.Widget.ValueListEditor
 *
 * @property {Array} objects Objects inspected.
 * @property {String} keyField Which text should be displayed in key column of inspector.
 *   Value can set to be 'name', 'title' or any other field of propInfo. If such field can not be found, name will be used instead.
 * @property {String} sortField How to sort rows in prop list.
 *   Value can set to be 'key', 'name', 'title' or null, respectively sort by property name, title, or no sort.
 * @property {Bool} enableLiveUpdate Whether the editor update its value automatically when inspected objects changed.
 * @property {String} subPropNamePadding CSS padding-left style for indention of sub property name. Default is 1em.
 * @property {Bool} enableOperHistory Whether undo/redo function is enabled. Undo/redo will be functional only if property operHistory is also set.
 * @property {Kekule.OperationHistory} operHistory History of operations. Used to enable undo/redo function.
 */
/**
 * Invoked when the active row edit is finished and property is changed. Event param of it has field: {propertyInfo, propertyEditor, oldValue, newValue}.
 * @name Kekule.Widget.ObjPropListEditor#propertyChange
 * @event
 */
Kekule.Widget.ObjPropListEditor = Class.create(Kekule.Widget.ValueListEditor,
/** @lends Kekule.Widget.ObjPropListEditor# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.ObjPropListEditor',
	/** @private */
	PARENT_ROW_FIELD: '__$parentRow__',
	/** @private */
	SUB_ROWS_FIELD: '__$subRows__',
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument)
	{
		$super(parentOrElementOrDocument);
		this.setValueDisplayMode(Kekule.Widget.ValueListEditor.ValueDisplayMode.SIMPLE);
		this.setPropStoreFieldValue('displayedPropScopes', [Class.PropertyScope.PUBLISHED]);
		this.setEnableLiveUpdate(true);
		this.setSubPropNamePadding('1em');
		this.setUseKeyHint(true);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('objects', {'dataType': DataType.ARRAY, 'serializable': false,
			'scope': Class.PropertyScope.PUBLIC,
			'setter': function(value)
			{
				var objs = Kekule.ArrayUtils.toArray(value);
				var olds = this.getObjects();
				this.setPropStoreFieldValue('objects', objs);
				this.inspectedObjectsChanged(objs, olds);
			}
		});
		this.defineProp('displayedPropScopes', {'dataType': DataType.ARRAY,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('displayedPropScopes', value);
				this.updateAll();
			}
		});
		this.defineProp('enableLiveUpdate', {'dataType': DataType.BOOL});
		this.defineProp('subPropNamePadding', {'dataType': DataType.STRING});

		this.defineProp('activePropEditor', {'dataType': DataType.OBJECT, 'serializable': false, 'setter': null,
			'scope': Class.PropertyScope.PUBLIC,
			'getter': function()
			{
				var row = this.getActiveRow();
				if (row)
					return this.getRowPropEditor(row);
				else
					return null;
			}
		});

		this.defineProp('keyField', {'dataType': DataType.STRING});
		this.defineProp('sortField', {'dataType': DataType.STRING});

		this.defineProp('enableOperHistory', {'dataType': DataType.BOOL, 'serializable': false});
		this.defineProp('operHistory', {'dataType': 'Kekule.OperationHistory', 'serializable': false, 'scope': Class.PropertyScope.PUBLIC});
	},
	/** @private */
	doFinalize: function($super)
	{
		$super();
	},
	/** @ignore */
	initPropValues: function($super)
	{
		$super();
		this.setKeyField('title');
		this.setSortField('key');
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.PROPLISTEDITOR;
	},

	/**
	 * Notify objects property has been changed and need to update the whole inspector.
	 * @private
	 */
	inspectedObjectsChanged: function(objects, oldObjects)
	{
		var objs = Kekule.ArrayUtils.toArray(objects);
		if (oldObjects)
			this._uninstallObjectsEventHandlers(oldObjects)
		if (objects)
			this._installObjectsEventHandlers(objs);
		this.updateAll(objs);
	},
	/** @private */
	_installObjectsEventHandlers: function(objects)
	{
		for (var i = 0, l = objects.length; i < l; ++i)
		{
			var obj = objects[i];
			if (obj.addEventListener)
				obj.addEventListener('change', this.reactObjectsChange, this);
		}
	},
	/** @private */
	_uninstallObjectsEventHandlers: function(objects)
	{
		for (var i = 0, l = objects.length; i < l; ++i)
		{
			var obj = objects[i];
			if (obj.removeEventListener)
				obj.removeEventListener('change', this.reactObjectsChange, this);
		}
	},
	/** @private */
	reactObjectsChange: function(e)
	{
		if (this.getEnableLiveUpdate())
		{
			//this.updateAll();
			var changedPropNames = e.changedPropNames;
			this.updateValues(changedPropNames);
		}
	},

	/** @private */
	getKeyCellExpandMarker: function(keyCell, canCreate)
	{
		var result = null;
		var wrapper = this.getCellContentWrapper(keyCell, canCreate);
		if (wrapper)
		{
			var children = DU.getDirectChildElems(wrapper) || [];
			for (var i = 0, l = children.length; i < l; ++i)
			{
				var child = children[i];
				if (EU.hasClass(child, CNS.PROPLISTEDITOR_PROPEXPANDMARKER))
				{
					result = child;
					break;
				}
			}
			if (!result && canCreate)  // create new
			{
				var doc = this.getDocument();
				result = doc.createElement('span');
				EU.addClass(result, CNS.PROPLISTEDITOR_PROPEXPANDMARKER);
				var refChild = DU.getChildNodesOfTypes(wrapper, [Node.ELEMENT_NODE, Node.TEXT_NODE])[0];
				wrapper.insertBefore(result, refChild);
			}
		}
		return result;
	},
	/** @private */
	getKeyCellIndentDecorator: function(keyCell, canCreate)
	{
		var result = null;
		var wrapper = this.getCellContentWrapper(keyCell, canCreate);
		if (wrapper)
		{
			var children = DU.getDirectChildElems(wrapper) || [];
			for (var i = 0, l = children.length; i < l; ++i)
			{
				var child = children[i];
				if (EU.hasClass(child, CNS.PROPLISTEDITOR_INDENTDECORATOR))
				{
					result = child;
					break;
				}
			}
			if (!result && canCreate)  // create new
			{
				var doc = this.getDocument();
				result = doc.createElement('div');
				EU.addClass(result, CNS.PROPLISTEDITOR_INDENTDECORATOR);
				var refChild = DU.getChildNodesOfTypes(wrapper, [Node.ELEMENT_NODE, Node.TEXT_NODE])[0];
				wrapper.insertBefore(result, refChild);
			}
		}
		return result;
	},
	/**
	 * Override from ValueListEditor, add additional padding and expand mark before text.
	 * @private
	 */
	setRowKeyCellContent: function($super, row, keyText, keyHint)
	{
		var result = $super(row, keyText, keyHint);
		var cell = this.getKeyCell(row);
		// insert expand mark
		var marker = this.getKeyCellExpandMarker(cell, true);   // already inserted in this method
		// insert indentDecorator
		//var decorator = this.getKeyCellIndentDecorator(cell, true);

		// consider row sub level, set different padding and decoration
		var subLevel = this.getRowSubLevel(row);
		//if (subLevel > 0)
		{
			var spadding = this.getSubPropNamePadding();
			if (spadding)
			{
				var sDecorationWidth = Kekule.StyleUtils.multiplyUnitsValue(spadding, subLevel);
				spadding = Kekule.StyleUtils.multiplyUnitsValue(spadding, subLevel);
				var keyCell = this.getKeyCell(row);
				var wrapper = this.getCellContentWrapper(keyCell, true);
				wrapper.style.paddingLeft = spadding;
				//decorator.style.width = sDecorationWidth;
			}
		}
		return result;
	},

	/**
	 * Force to update object inspector rows based on current objects.
	 */
	updateAll: function(objs)
	{
		if (!objs)
			objs = this.getObjects();
		if (!objs || !objs.length)
		{
			//console.log('clear');
			this.clear();
			return;
		}

		this.setActiveRow(null);
		this.collapseAllRows();  // IMPORTANT, otherwise rows may be removed dynamically in the following loop and cause rowcount to be inacurrate

		var obj = objs[0];
		/*
		var propNames = this.getDisplayPropNames(objs);
		var superClass = this.getCommonSuperClass(objs);
		*/
		var propEditors = this.getDisplayPropEditors(objs);
		this.sortPropEditors(propEditors);
		/*
		// construct hash
		var hash = {};
		for (var i = 0, l = propNames.length; i < l; ++i)
		{
			var propName = propNames[i];
			var propValue = this.getObjsPropValue(objs, propName);
			hash[propName] = propValue;
		}
		this.setHash(hash);
		*/
		var multiple = objs.length > 1;
		var rows = this.getRows();
		var rowCount = rows.length;
		//var l = propNames.length;
		var l = propEditors.length;
		var i = 0;
		var currRowIndex = 0;
		var valueDisplayMode = this.getValueDisplayMode();
		for (var i = 0; i < l; ++i)
		{
			/*
			var propName = propNames[i];
			var propInfo = obj.getPropInfo(propName);
			var propEditor = this.getPropEditor(superClass, propInfo);
			propEditor.setObjects(objs);
			propEditor.setPropertyInfo(propInfo);
			*/
			var propEditor = propEditors[i];
			propEditor.setValueTextMode(valueDisplayMode);
			/*
			if (propEditor instanceof Kekule.PropertyEditor.ObjectExEditor)
			{
				console.log('ObjectEx editor', propName, propInfo.dataType);
			}
			*/
			if (!this.isPropEditorVisible(propEditor))
				continue;

			var row = (currRowIndex < rowCount)? rows[currRowIndex]: this.appendRow();
			this.setRowPropEditor(row, /*propName, objs,*/ propEditor);
			++currRowIndex;
		}
		// delete more rows
		if (rowCount > currRowIndex)
		{
			for (var i = rowCount - 1; i >= currRowIndex; --i)
			{
				this.removeRow(rows[i]);
			}
		}
		return this;
	},

	/**
	 * Update only values in widget.
	 * @param {Array} propNames If this property is set, only those properties will be updated.
	 * @private
	 */
	updateValues: function(propNames)
	{
		var limitedProps = propNames && propNames.length;
		var rows = this.getRows();
		for (var i = 0, l = rows.length; i < l; ++i)
		{
			var row = rows[i];
			if (limitedProps)
			{
				var propEditor = this.getRowPropEditor(row);
				// TODO: need further check, why some rows do not have propEditor (e.g., absCoord3D property of sub group in molecule).
				if (!propEditor || (propNames.indexOf(propEditor.getPropertyName()) < 0))
					continue;
			}
			this.updateRowPropValue(row);
		}
	},
	/** @private */
	updateRowPropValue: function(row)
	{
		var propEditor = this.getRowPropEditor(row);
		var newValue = propEditor.getValueText();
		var data = this.getRowData(row);
		data.value = newValue;
		this.setRowData(row, data);
		this.updateRowExpandState(row);

		// if has sub property rows, update too
		var subRows = this.getSubPropRows(row);
		if (subRows)
		{
			//console.log(propEditor.getPropertyName(), 'sub row', subRows.length);
			for (var i = 0, l = subRows.length; i < l; ++i)
			{
				this.updateRowPropValue(subRows[i]);
			}
		}
	},

	/**
	 * Set row property editor and modify row display according to it.
	 * @param {HTMLElement} row
	 * @param {Object} propEditor
	 * @private
	 */
	setRowPropEditor: function(row, /*propName, objects,*/ propEditor)
	{
		/*
		if (!objects)
			objects = this.getObjects();
		var obj = objects[0];
		if (obj)
		{
			var propInfo = obj.getPropInfo? obj.getPropInfo(propName): null;
			//var propEditor = this.getPropEditor(propInfo);

			//console.log('after set', propEditor, propEditor.getObjects(), propEditor.getPropInfo());
			var data = {
				'key': propEditor.getPropertyName(), //propName,
				'value': propEditor.getValueText(),
				'title': propEditor.getTitle(),
				//'propInfo': propInfo,
				'propEditor': propEditor
			};
			this.setRowData(row, data);
		}
		*/

		var title;
		var titleField = this.getKeyField() || 'title';  // default is title
		if (titleField)
		{
			if (titleField === 'name')
				title = propEditor.getPropertyName();
			else if (titleField === 'title')
				title = propEditor.getTitle();
			else
			{
				var propInfo = propEditor.getPropertyInfo();
				title = propInfo[titleField];
			}
		}
		if (!title)
			title = propEditor.getTitle() || propEditor.getPropertyName();

		var data = {
			'key': propEditor.getPropertyName(), //propName,
			'value': propEditor.getValueText(),
			'title': title,
			'hint': propEditor.getHint(),
			//'propInfo': propInfo,
			'propEditor': propEditor,
			'expanded': false
		};

		/*
		var hasSubProps = propEditor.hasSubPropertyEditors();
		if (hasSubProps)
		{
			EU.addClass(row, CNS.PROPLISTEDITOR_PROPCOLLAPSED);
		}
		*/
		var readOnly = propEditor.isReadOnly();
		if (readOnly)
			EU.addClass(row, CNS.PROPLISTEDITOR_READONLY);
		else
			EU.removeClass(row, CNS.PROPLISTEDITOR_READONLY);

		this.setRowData(row, data);
		this.updateRowExpandState(row);
	},
	/* @private */
	/*
	getPropDisplayTitle: function(propInfo)
	{
		if (propInfo)
			return propInfo.title || propInfo.name;
		else
			return null;
	},
	*/
	/* @private */
	/*
	getRowPropInfo: function(row)
	{
		return this.getRowData(row).propInfo;
	},
	*/

	/**
	 * Returns key name like 'parentPropName.childPropName'.
	 * @param {HTMLElement} row
	 * @returns {String}
	 */
	getRowCascadeKey: function(row)
	{
		if (row && this.getRowData(row))
		{
			var result = this.getRowData(row).key;
			var parentRow = this.getParentPropRow(row);
			if (parentRow)
			{
				result = this.getRowCascadeKey(parentRow) + '.' + result;
			}
			return result;
		}
		else
			return null;
	},
	/**
	 * Returns cascade key of current selected row.
	 * @returns {String}
	 */
	getActiveRowCascadeKey: function()
	{
		var row = this.getActiveRow();
		return row && this.getRowCascadeKey(row);
	},

	/** @private */
	getRowPropEditor: function(row)
	{
		var data = this.getRowData(row);
		if (data)
			return data.propEditor;
		else
		{
			//console.log(row.tagName, row);
			return null;
		}
	},

	/**
	 * Returns property editor instance associated with this row.
	 * @param {Class} objClass
	 * @param {Object} propInfo
	 * @private
	 */
	getPropEditor: function(objClass, propInfo)
	{
		// debug
		//return new Kekule.PropertyEditor.SimpleEditor();
		//return new Kekule.PropertyEditor.SelectEditor();
		var c = Kekule.PropertyEditor.findEditorClass(objClass, propInfo);
		if (c)
			return new c();
		else
			return null;
	},
	/**
	 * Returns property editor instance associated with a native JavaScript type (object, array...).
	 * @param {String} propType
	 * @param {String} propName
	 * @private
	 */
	getPropEditorForType: function(propType, propName)
	{
		var c = Kekule.PropertyEditor.findEditorClassForType(propType, propName);
		if (c)
			return new c();
		else
			return null;
	},

	/**
	 * Check if row on propEditor should be displayed in prop list editor.
	 * @param {Object} propEditor
	 * @returns {Bool}
	 * @private
	 */
	isPropEditorVisible: function(propEditor)
	{
		var result = true;
		var objs = propEditor.getObjects();
		var multiple = objs.length > 1;
		//result = !(multiple && (!(propEditor.getAttributes() & Kekule.PropertyEditor.EditorAttributes.MULTIOBJS)));
		result = !multiple || (propEditor.getAttributes() & Kekule.PropertyEditor.EditorAttributes.MULTIOBJS);

		// check scope
		if (result)
		{
			var propInfo = propEditor.getPropertyInfo();
			if (propInfo)
			{
				var propScope = propInfo.scope || Class.PropertyScope.DEFAULT;
				if (propScope)
				{
					var displayScopes = this.getDisplayedPropScopes();
					if (displayScopes)
						result = displayScopes.indexOf(propScope) >= 0;
				}
			}
		}

		return result;
	},

	/**
	 * Check if a row has sub properties and can be expanded.
	 * @param {HTMLElement} row
	 * @returns {Bool}
	 */
	isRowExpandable: function(row)
	{
		var propEditor = this.getRowPropEditor(row);
		return propEditor? propEditor.hasSubPropertyEditors(): false;
	},
	/**
	 * Check if a row with sub properties is expanded.
	 * @param {HTMLElement} row
	 */
	isRowExpanded: function(row)
	{
		var data = this.getRowData(row);
		return !!data.expanded;
	},
	/** @private */
	updateRowExpandState: function(row)
	{
		var canExpand = this.isRowExpandable(row);
		if (!canExpand)  // remove unnessseary sub rows
		{
			this.removeSubPropertyRows(row);
		}
		EU.removeClass(row, CNS.PROPLISTEDITOR_PROPCOLLAPSED);
		EU.removeClass(row, CNS.PROPLISTEDITOR_PROPEXPANDED);

		if (canExpand)
		{
			if (this.isRowExpanded(row))
				EU.addClass(row, CNS.PROPLISTEDITOR_PROPEXPANDED);
			else
				EU.addClass(row, CNS.PROPLISTEDITOR_PROPCOLLAPSED);
		}
	},
	/**
	 * Expand row with sub properties.
	 * @param {HTMLElement} row
	 */
	expandRow: function(row)
	{
		this._doExpandRow(row);
		return this;
	},
	/** @private */
	_doExpandRow: function(row)
	{
		if (this.isRowExpandable(row) && (!this.isRowExpanded(row)))
		{
			EU.removeClass(row, CNS.PROPLISTEDITOR_PROPCOLLAPSED);
			EU.addClass(row, CNS.PROPLISTEDITOR_PROPEXPANDED);
			var data = this.getRowData(row);
			data.expanded = true;

			var propEditor = this.getRowPropEditor(row);
			//console.log(this.getDisplayedPropScopes());
			var subPropEditors = propEditor.getSubPropertyEditors(this.getDisplayedPropScopes());

			row[this.SUB_ROWS_FIELD] = this.addSubPropertyRows(row, subPropEditors);
			return row[this.SUB_ROWS_FIELD];
		}
		else
			return null;
	},
	/**
	 * Collapse row with sub properties.
	 * @param {HTMLElement} row
	 */
	collapseRow: function(row)
	{
		if (this.isRowExpandable(row) && this.isRowExpanded(row))
		{
			EU.removeClass(row, CNS.PROPLISTEDITOR_PROPEXPANDED);
			EU.addClass(row, CNS.PROPLISTEDITOR_PROPCOLLAPSED);
			var data = this.getRowData(row);
			data.expanded = false;

			this.removeSubPropertyRows(row);
		}
		return this;
	},
	/**
	 * Expand a collapsed row or collapse an expanded row.
	 * @param {HTMLElement} row
	 */
	toggleRowExpandState: function(row)
	{
		if (this.isRowExpanded(row))
		{
			this.collapseRow(row);
		}
		else
		{
			this.expandRow(row);
		}
		return this;
	},
	/**
	 * Collapse all rows in editor.
	 */
	collapseAllRows: function()
	{
		var rows = this.getRows();
		for (var i = 0, l = rows.length; i < l; ++i)
		{
			this.collapseRow(rows[i]);
		}
		return this;
	},
	/**
	 * Expand all rows in editor.
	 * @param {Bool} cascade
	 */
	expandAllRows: function(cascade)
	{
		var self = this;
		var doExpandAll = function(rows, cascade)
		{
			for (var i = 0, l = rows.length; i < l; ++i)
			{
				var addedRows = self._doExpandRow(rows[i]);
				if (addedRows && cascade)
				{
					doExpandAll(addedRows, cascade);
				}
			}
		}
		var rows = this.getRows();
		doExpandAll(rows, cascade);
		return this;
	},

	/** @private */
	addSubPropertyRows: function(parentRow, propEditors)
	{
		var refRow = this.getNextRow(parentRow);
		var subRows = [];
		if (propEditors && propEditors.length)
		{
			/*
			propEditors.sort(function(a, b){
				var na = a.getPropertyName();
				var nb = b.getPropertyName();
				return (na < nb)? -1:
					(na > nb)? 1:
					0;
			});
			*/
			this.sortPropEditors(propEditors);
			for (var i = 0, l = propEditors.length; i < l; ++i)
			{
				var subPropEditor = propEditors[i];
				if (!this.isPropEditorVisible(subPropEditor))
					continue;
				subRows.push(this.addSubPropRow(parentRow, subPropEditor, refRow));
			}
		}
		return subRows;
	},
	/** @private */
	addSubPropRow: function(parentRow, propEditor, refRow)
	{
		var result = this.insertRowBefore(null, refRow);
		result[this.PARENT_ROW_FIELD] = parentRow;
		this.setRowPropEditor(result, propEditor);
		return result;
	},
	/** @private */
	removeSubPropertyRows: function(parentRow)
	{
		var subRows = this.getSubPropRows(parentRow);
		for (var i = subRows.length - 1; i >= 0; --i)
		{
			this.removeSubPropertyRows(subRows[i]);
			this.removeRow(subRows[i]);
		}
		parentRow[this.SUB_ROWS_FIELD] = null;
	},
	/** @private */
	getSubPropRows: function(row)
	{
		return row[this.SUB_ROWS_FIELD] || [];
	},
	/** @private */
	getParentPropRow: function(row)
	{
		return row[this.PARENT_ROW_FIELD];
	},
	/** @private */
	getRowSubLevel: function(row)
	{
		var result = 0;
		var parentRow = this.getParentPropRow(row);
		while (parentRow)
		{
			++result;
			parentRow = this.getParentPropRow(parentRow);
		}
		return result;
	},

	// override methods
	/* @private */
	getValueCellText: function($super, row, data)
	{
		/*
		if (data.value === undefined)
			return '';
		else
			return $super(row, data);
		*/
		return data.value;
	},
	/** @private */
	finishEditing: function()
	{
		var row = this.getActiveRow();
		var propEditor = this.getRowPropEditor(row);

		//console.log('finish editing', propEditor.getPropertyName());

		if (propEditor)
		{
			var operHistory = this.getOperHistory();
			var enableHistory = this.getEnableOperHistory() && operHistory;
			var oldValue = propEditor.getValue();

			var modified = propEditor.saveEditValue();

			if (modified)
			{
				if (enableHistory)
				{
					var oper = new Kekule.Widget.PropEditorModifyOperation(propEditor, propEditor.getValue(), oldValue);
					operHistory.push(oper);
				}
				//if (!this.getEnableLiveUpdate())
				this.updateValues();

				// invoke event
				this.invokeEvent('propertyChange', {
					'propertyEditor': propEditor, 'propertyInfo': propEditor.getPropertyInfo(),
					'oldValue': oldValue, 'newValue': propEditor.getValue()
				});
				// invoke row edit event, as we not inherit finishEditing method from value list editor
				this.invokeEvent('editFinish', {'row': row});
			}
		}
		return this;
	},

	/** @private */
	doCreateValueEditWidget: function($super, row)
	{
		//var result = $super(row);
		var propEditor = this.getRowPropEditor(row);
		// use propEditor to create edit widget
		var result = propEditor.createEditWidget(this);
		if (result)
		{
			if (propEditor.isReadOnly())
			{
				if (result.setReadOnly)
					result.setReadOnly(true);
			}
		}
		else  // widget not created by propEditor, create a readonly default one
		{
			result = this.doCreateDefaultValueEditWidget(row);
		}
		return result;
	},
	/** @private */
	doCreateDefaultValueEditWidget: function(row)
	{
		var result = new Kekule.Widget.TextBox(this);
		result.setReadOnly(true);
		var value = this.getRowData(row).value;
		result.setValue(value);
		return result;
	},

	// oper history methods
	/**
	 * Check if operation history can be used.
	 * @returns {Bool}
	 */
	isOperHistoryAvailable: function()
	{
		return this.getOperHistory() && this.getEnableOperHistory();
	},
	/**
	 * Undo a property setting operation.
	 */
	undo: function()
	{
		if (this.isOperHistoryAvailable())
			this.getOperHistory().undo();
		return this;
	},
	/**
	 * Redo a property setting operation.
	 */
	redo: function()
	{
		if (this.isOperHistoryAvailable())
			this.getOperHistory().redo();
		return this;
	},

	// assoc methods
	/**
	 * Returns common super class of all objects.
	 * @param {Array} objects
	 * @returns {Class}
	 * @private
	 */
	getCommonSuperClass: function(objects)
	{
		return ClassEx.getCommonSuperClass(objects);
	},
	/**
	 * Returns common property names of all objects.
	 * @param {Array} objects
	 * @returns {Array}
	 * @private
	 */
	getCommonPropNames: function(objects)
	{
		var result = [];
		var superClass = this.getCommonSuperClass(objects);
		if (superClass)
		{
			// TODO: we may filter out prop of unneed scope here
			//var propList = ClassEx.getAllPropList(superClass);
			var propList = ClassEx.getPropListOfScopes(superClass, this.getDisplayedPropScopes());
			for (var i = 0, l = propList.getLength(); i < l; ++i)
			{
				var propInfo = propList.getPropInfoAt(i);
				result.push(propInfo.name);
			}
			//result.sort();
		}
		else  // no common super class
		{
			// TODO: if objects are plain object (not ObjectEx), how to handle
		}
		return result;
	},
	/**
	 * Returns property names that need to be shown in object inspector first level.
	 * @param {Array} objects
	 * @returns {Array}
	 * @private
	 */
	getDisplayPropNames: function(objects)
	{
		return this.getCommonPropNames(objects);
	},
	/**
	 * Returns property editors that need to be shown in object inspector first level.
	 * @param {Array} objects
	 * @returns {Array}
	 * @private
	 */
	getDisplayPropEditors: function(objects)
	{
		var result = [];
		//var propNames = this.getDisplayPropNames(objects);
		var superClass = this.getCommonSuperClass(objects);
		if (superClass)  // is ObjectEx
		{
			/*
			var obj = objects[0];
			for (var i = 0, l = propNames.length; i < l; ++i)
			{
				var propName = propNames[i];
				var propInfo = obj.getPropInfo(propName);
				var propEditor = this.getPropEditor(superClass, propInfo);
				propEditor.setObjects(objects);
				propEditor.setPropertyInfo(propInfo);
				result.push(propEditor);
			}
			*/
			var basePropEditor = this.getPropEditor(null, {'dataType': ClassEx.getClassName(superClass)});
			if (basePropEditor)
			{
				basePropEditor.setObjects(objects);
				result = result.concat(basePropEditor.getSubPropertyEditors(this.getDisplayedPropScopes()) || []);
			}
		}
		else  // no super class, maybe objects are plain object?
		{
			if (objects.length === 1)  // now only handle one object
			{
				var obj = objects[0];
				if (DataType.isObjectValue(obj))
				{
					var basePropEditor = this.getPropEditorForType('object');
					if (basePropEditor)
					{
						basePropEditor.setObjects(/*objects*/obj);
						result = result.concat(basePropEditor.getSubPropertyEditors() || []);
					}
				}
			}
		}
		//console.log(basePropEditor.getClassName());
		return result;
	},
	/**
	 * Sort property editors.
	 * @param {Array} propEditors
	 * @private
	 */
	sortPropEditors: function(propEditors)
	{
		var sortField = this.getSortField();
		if (!sortField)  // no sort
			return;
		if (sortField === 'key')
			sortField === this.getKeyField() || 'title';

		var getSortFieldValue = function(propInfo, sortField)
		{
			return propInfo[sortField] || propInfo.name;  // if value not found, fall back to name
		};

		propEditors.sort(function(a, b){
			var na = getSortFieldValue(a.getPropertyInfo(), sortField);
			var nb = getSortFieldValue(b.getPropertyInfo(), sortField);
			return (na < nb)? -1:
				(na > nb)? 1:
					0;
		});
	},
	/**
	 * Returns property or field value of object.
	 * @param {Object} obj A plain object or instance of ObjectEx.
	 * @param {String} propName
	 * @returns {Variant}
	 */
	getObjPropValue: function(obj, propName)
	{
		if (obj instanceof ObjectEx)
		{
			return obj.getPropValue(propName);
		}
		else if (obj instanceof Object)
		{
			return obj[propName];
		}
		else
			return undefined;
	},
	/**
	 * Returns property value of multiple objects.
	 * If all objects have the same property value, this value will be returned.
	 * Otherwise this method will return undefined.
	 * @param {Array} objects
	 * @param {String} propName
	 * @returns {Variant}
	 */
	getObjsPropValue: function(objects, propName)
	{
		var obj = objects[0];
		var result = this.getObjPropValue(obj, propName);
		for (var i = 1, l = objects.length; i < l; ++i)
		{
			var obj = objects[i];
			var value = this.getObjPropValue(obj, propName);
			if (value !== result)
				return undefined;
		}
		return result;
	},

	// UI event handlers
	/** @private */
	react_click: function($super, e)     // use $super to avoid override ValueListEditor.react_click
	{
		var target = e.getTarget();
		// if click on expand marker of row
		var row = this.getParentRow(target);
		if (row)
		{
			var expandMarker = this.getKeyCellExpandMarker(this.getKeyCell(row), false);
			if (target === expandMarker)
			{
				this.toggleRowExpandState(row);
			}
		}
		$super(e);
	},
	/** @private */
	react_dblclick: function(e)
	{
		var target = e.getTarget();
		var cell = this.getParentCell(target);
		var handled = false;
		if (cell)
		{
			var row = this.getParentRow(cell);
			if (cell === this.getKeyCell(row))  // double click on key cell
			{
				this.toggleRowExpandState(row);
				handled = true;
			}
		}
	},
	/** @private */
	react_keydown: function($super, e)  // avoid overwrite ValueListEditor.react_keydown
	{
		$super(e);
		var keyCode = e.getKeyCode();
		var noModifier = !(e.getAltKey() || e.getShiftKey() || e.getCtrlKey());
		if (noModifier)
		{
			var currRow = this.getActiveRow();
			if (currRow)
			{
				if (keyCode === Kekule.X.Event.KeyCode.RIGHT)  // expand row
				{
					this.expandRow(currRow);
				}
				else if (keyCode === Kekule.X.Event.KeyCode.LEFT)
				{
					this.collapseRow(currRow);
				}
			}
		}
	}
});

/**
 * An object inspector with prop editor and associated components.
 * @class
 * @augments Kekule.Widget.BaseWidget
 *
 * @property {Array} objects Objects inspected.
 * @property {Bool} showObjsInfoPanel
 * @property {Bool} showPropInfoPanel
 * @property {String} keyField Which text should be displayed in key column of inspector.
 *   Value can set to be 'name', 'title' or any other field of propInfo. If such field can not be found, name will be used instead.
 * @property {String} sortField How to sort rows in prop list.
 *   Value can set to be 'key', 'name', 'title' or null, respectively sort by property name, title, or no sort.
 * @property {Bool} enableOperHistory Whether undo/redo function is enabled. Undo/redo will be functional only if property operHistory is also set.
 * @property {Kekule.OperationHistory} operHistory History of operations. Used to enable undo/redo function.
 */
Kekule.Widget.ObjectInspector = Class.create(Kekule.Widget.BaseWidget,
/** @lends Kekule.Widget.ObjectInspector# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.ObjectInspector',
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument)
	{
		this._propListElem = null;
		this._objsInfoElem = null;
		this._propInfoElem = null;  // important, must init before $super, as $super may bind element and set those values
		this.setPropStoreFieldValue('showObjsInfoPanel', true);
		this.setPropStoreFieldValue('showPropInfoPanel', true);
		$super(parentOrElementOrDocument);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('objects', {'dataType': DataType.ARRAY,
			'scope': Class.PropertyScope.PUBLIC,
			'setter': function(value)
			{
				var objs = Kekule.ArrayUtils.toArray(value);
				this.setPropStoreFieldValue('objects', objs);
				this.inspectedObjectsChanged(objs);
			}
		});
		// private properties
		this.defineProp('propEditor', {'dataType': 'Kekule.Widget.ObjPropListEditor', 'serializable': false, 'setter': null, 'scope': Class.PropertyScope.PRIVATE});
		this.defineProp('showObjsInfoPanel', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('showObjsInfoPanel', value);
				SU.setDisplay(this._objsInfoElem, !!value);
				this._updateChildElemSize();
			}
		});
		this.defineProp('showPropInfoPanel', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('showPropInfoPanel', value);
				SU.setDisplay(this._propInfoElem, !!value);
				this._updateChildElemSize();
			}
		});

		this.defineProp('keyField', {'dataType': DataType.STRING,
			'getter': function() { var pe = this.getPropEditor();	return pe && pe.getKeyField(); },
			'setter': function(value) { var pe = this.getPropEditor(); if (pe) pe.setKeyField(value); }
		});
		this.defineProp('sortField', {'dataType': DataType.STRING,
			'getter': function() { var pe = this.getPropEditor();	return pe && pe.getSortField(); },
			'setter': function(value) { var pe = this.getPropEditor(); if (pe) pe.setSortField(value); }
		});
		this.defineProp('activeRow', {'dataType': DataType.OBJECT, 'serializable': false,
			'scope': Class.PropertyScope.PUBLIC,
			'getter': function()
			{
				var pe = this.getPropEditor();
				return pe && pe.getActiveRow();
			},
			'setter': function(value)
			{
				var pe = this.getPropEditor();
				if (pe)
					pe.setActiveRow(value);
			}
		});

		this.defineProp('enableOperHistory', {'dataType': DataType.BOOL, 'serializable': false,
			'getter': function()
			{
				var propEditor = this.getPropEditor();
				return propEditor? propEditor.getEnableOperHistory(): false;
			},
			'setter': function(value)
			{
				var propEditor = this.getPropEditor();
				return propEditor? propEditor.setEnableOperHistory(value): null;
			}
		});
		this.defineProp('operHistory', {'dataType': 'Kekule.OperationHistory', 'serializable': false,
			'scope': Class.PropertyScope.PUBLIC,
			'getter': function()
			{
				var propEditor = this.getPropEditor();
				return propEditor? propEditor.getOperHistory(): null;
			},
			'setter': function(value)
			{
				var propEditor = this.getPropEditor();
				return propEditor? propEditor.setOperHistory(value): null;
			}
		});
		this.defineProp('sortField', {'dataType': DataType.STRING,
			'getter': function() { return this.getPropEditor().getSortField(); },
			'setter': function(value) { this.getPropEditor().setSortField(value); }
		});
	},
	doFinalize: function($super)
	{
		this._finalizeChildWidgets();
		$super();
	},
	/** @ignore */
	getChildrenHolderElement: function($super)
	{
		return this._propListElem || $super();
	},
	/** @ignore */
	doGetWidgetClassName: function()
	{
		return CNS.OBJINSPECTOR;
	},
	/** @ignore */
	doBindElement: function($super, element)
	{
		$super(element);
		this._updateChildElemSize();
	},
	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('div');
		return result;
	},
	/** @ignore */
	doCreateSubElements: function($super, doc, element)
	{
		$super(doc, element);

		var objsInfoElem = this._createSubPartElem(doc);
		EU.addClass(objsInfoElem, CNS.OBJINSPECTOR_OBJSINFOPANEL);
		element.appendChild(objsInfoElem);
		this._objsInfoElem = objsInfoElem;

		var propInfoElem = this._createSubPartElem(doc);
		EU.addClass(propInfoElem, CNS.OBJINSPECTOR_PROPINFOPANEL);
		element.appendChild(propInfoElem);
		this._propInfoElem = propInfoElem;

		var propListEditorContainer = this._createSubPartElem(doc);
		EU.addClass(propListEditorContainer, CNS.OBJINSPECTOR_PROPLISTEDITOR_CONTAINER);
		element.appendChild(propListEditorContainer);
		this._propListElem = propListEditorContainer;
		this._createChildWidgets(propListEditorContainer);

		return [objsInfoElem, propInfoElem, propListEditorContainer];
	},
	/** @private */
	_createSubPartElem: function(doc)
	{
		var result = doc.createElement('div');
		result.className = CNS.OBJINSPECTOR_SUBPART;
		return result;
	},

	/** @private */
	_createChildWidgets: function(parentElem)
	{
		this._finalizeChildWidgets();  // free old ones
		// property editor
		var propEditor = new Kekule.Widget.ObjPropListEditor(this);
		//propEditor.appendToElem(parentElem);
		propEditor.appendToWidget(this);

		var self = this;
		propEditor.addEventListener('activeRowChange', function(e)
			{
				self._updatePropInfo();
			}
		);

		this.setPropStoreFieldValue('propEditor', propEditor);
	},
	/** @private */
	_finalizeChildWidgets: function()
	{
		var propEditor = this.getPropEditor();
		if (propEditor)
			propEditor.finalize();
	},

	/** @private */
	inspectedObjectsChanged: function(objs)
	{
		var propEditor = this.getPropEditor();
		if (propEditor)
			propEditor.setObjects(objs);

		// change info in objInfoElem
		this._updateObjectsInfo(objs);
		this._updatePropInfo();
	},
	/** @private */
	_updateObjectsInfo: function(objs)
	{
		if (this._objsInfoElem)
		{
			var text;
			if (objs.length <= 0)
			{
				text = Kekule.$L('WidgetTexts.S_INSPECT_NONE'); //Kekule.WidgetTexts.S_INSPECT_NONE;
			}
			else if (objs.length === 1)
			{
				var obj = objs[0];
				var id = obj.getId? obj.getId(): null;
				var stype = DataType.getType(obj);
				text = id? /*Kekule.WidgetTexts.S_INSPECT_ID_OBJECT*/Kekule.$L('WidgetTexts.S_INSPECT_ID_OBJECT').format(id, stype):
					/*Kekule.WidgetTexts.S_INSPECT_ANONYMOUS_OBJECT*/Kekule.$L('WidgetTexts.S_INSPECT_ANONYMOUS_OBJECT').format(stype);
			}
			else
			{
				text = /*Kekule.WidgetTexts.S_INSPECT_OBJECTS*/Kekule.$L('WidgetTexts.S_INSPECT_OBJECTS').format(objs.length);
			}
			DU.setElementText(this._objsInfoElem, text);
		}
	},
	/** @private */
	_updatePropInfo: function()
	{
		if (this._propInfoElem)
		{
			// clear first
			this._propInfoElem.innerHTML = '';
			// then fill info
			var propEditor = this.getPropEditor().getActivePropEditor();
			if (propEditor)
			{
				var title = propEditor.getTitle();
				var description = propEditor.getDescription() || propEditor.getPropertyType() || '';

				var doc = this._propInfoElem.ownerDocument;

				var elem = doc.createElement('div');
				elem.className = CNS.OBJINSPECTOR_PROPINFO_TITLE;
				DU.setElementText(elem, title);
				this._propInfoElem.appendChild(elem);

				var elem = doc.createElement('div');
				elem.className = CNS.OBJINSPECTOR_PROPINFO_DESCRIPTION;
				DU.setElementText(elem, description);
				this._propInfoElem.appendChild(elem);
			}
		}
	},

	// operation history method
	/**
	 * Undo a property setting operation.
	 */
	undo: function()
	{
		if (this.getPropEditor())
			this.getPropEditor().undo();
		return this;
	},
	/**
	 * Redo a property setting operation.
	 */
	redo: function()
	{
		if (this.getPropEditor())
			this.getPropEditor().redo();
		return this;
	},

	// utils shortcut methods of PropListEditor
	/**
	 * Returns key name like 'parentPropName.childPropName'.
	 * @param {HTMLElement} row
	 * @returns {String}
	 */
	getRowCascadeKey: function(row)
	{
		var pe = this.getPropEditor();
		return pe && pe.getRowCascadeKey(row);
	},
	/**
	 * Returns cascade key of current selected row.
	 * @returns {String}
	 */
	getActiveRowCascadeKey: function()
	{
		var pe = this.getPropEditor();
		return pe && pe.getActiveRowCascadeKey();
	},
	/**
	 * Check if a row has sub properties and can be expanded.
	 * @param {HTMLElement} row
	 * @returns {Bool}
	 */
	isRowExpandable: function(row)
	{
		var pe = this.getPropEditor();
		return pe && pe.isRowExpandable(row);
	},
	/**
	 * Check if a row with sub properties is expanded.
	 * @param {HTMLElement} row
	 */
	isRowExpanded: function(row)
	{
		var pe = this.getPropEditor();
		return pe && pe.isRowExpanded(row);
	},
	/**
	 * Expand row with sub properties.
	 * @param {HTMLElement} row
	 */
	expandRow: function(row)
	{
		var pe = this.getPropEditor();
		if (pe)
			pe.expandRow(row);
		return this;
	},
	/**
	 * Collapse row with sub properties.
	 * @param {HTMLElement} row
	 */
	collapseRow: function(row)
	{
		var pe = this.getPropEditor();
		if (pe)
			pe.collapseRow(row);
		return this;
	},
	/**
	 * Expand a collapsed row or collapse an expanded row.
	 * @param {HTMLElement} row
	 */
	toggleRowExpandState: function(row)
	{
		var pe = this.getPropEditor();
		if (pe)
			pe.toggleRowExpandState(row);
		return this;
	},
	/**
	 * Collapse all rows in inspector.
	 */
	collapseAllRows: function()
	{
		var pe = this.getPropEditor();
		if (pe)
			pe.collapseAllRows();
		return this;
	},
	/**
	 * Expand all rows in editor.
	 * @param {Bool} cascade
	 */
	expandAllRows: function(cascade)
	{
		var pe = this.getPropEditor();
		if (pe)
			pe.expandAllRows(cascade);
		return this;
	},

	/** @private */
	_updateChildElemSize: function()
	{
		var self = this;
		// IMPORTANT, use set time out to let browser update DOM, else height often get 0
		setTimeout(function()
			{
				var top;
				if (self.getShowObjsInfoPanel())
					top = SU.getComputedStyle(self._objsInfoElem, 'height');
				else
					top = 0;
				var bottom;
				if (self.getShowPropInfoPanel())
					bottom = SU.getComputedStyle(self._propInfoElem, 'height');
				else
					bottom = 0;

				self._propListElem.style.top = top;
				self._propListElem.style.bottom = bottom;
			}, 100);
	},

	/** @ignore */
	setUseCornerDecoration: function($super, value)
	{
		var result = $super(value);
		if (value)  // use corner decoration, handle topmost and bottommost element
		{

		}
		return result;
	}
});

})();