/**
 * @fileoverview
 * Small widgets used by chem editor.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /widgets/commonCtrls/kekule.widget.containers.js
 * requires /widgets/commonCtrls/kekule.widget.formControls.js
 * requires /widgets/commonCtrls/kekule.widget.dialogs.js
 * requires /widgets/commonCtrls/kekule.widget.tabViews.js
 * requires /widgets/chem/kekule.chemWidget.base.js
 * requires /widgets/chem/editor/kekule.chemEditor.configs.js
 * requires /widgets/chem/editor/kekule.chemEditor.editorUtils.js
 */

(function(){
"use strict";

var AU = Kekule.ArrayUtils;
var CNS = Kekule.Widget.HtmlClassNames;
var CCNS = Kekule.ChemWidget.HtmlClassNames;

/** @ignore */
Kekule.ChemWidget.HtmlClassNames = Object.extend(Kekule.ChemWidget.HtmlClassNames, {
	STRUCTURE_NODE_SELECT_PANEL: 'K-Chem-StructureNodeSelectPanel',
	STRUCTURE_NODE_SELECT_PANEL_SET_BUTTON: 'K-Chem-StructureNodeSelectPanel-SetButton',
	STRUCTURE_NODE_SETTER: 'K-Chem-StructureNodeSetter',
	STRUCTURE_NODE_SETTER_INPUTBOX: 'K-Chem-StructureNodeSetter-InputBox',
	STRUCTURE_CONNECTOR_SELECT_PANEL: 'K-Chem-StructureConnectorSelectPanel',
	STRUCTURE_CONNECTOR_SELECT_PANEL_SET_BUTTON: 'K-Chem-StructureConnectorSelectPanel-SetButton',
	CHARGE_SELECT_PANEL: 'K-Chem-Charge-SelectPanel',
	CHARGE_SELECT_PANEL_BTNGROUP: 'K-Chem-Charge-SelectPanel-BtnGroup',
	CHARGE_SELECT_PANEL_CHARGE_BTN: 'K-Chem-Charge-SelectPanel-ChargeBtn'
});

/**
 * An panel to set the atom of a chem structure node.
 * @class
 * @augments Kekule.Widget.Panel
 *
 * @property {Array} elementSymbols Array of atomic symbols.
 *   Elements that can be directly selected by button.
 *   Note: Isotope id (e.g., D, 13C) can be used here.
 *   Note: a special symbol '...' can be used to create a periodic table button.
 * @property {Array} nonElementInfos Array of info of displayed non-elements.
 *   Non element node (e.g. pseudoatom) types that can be directly selected by button.
 *   Each item is a hash {nodeClass, props, text, hint, description, isVarList, isNotVarList}.
 *   The field isVarList and isVarNotList is a special flag to indicate whether this item
 *   is a variable atom list.
 * @property {Array} subGroupInfos Array of info of displayed subgroups.
 *   Each item is a hash {text, hint, inputText, formulaText, description}.
 * @property {Array} subGroupRepItems Displayed subgroup repository items.
 *   Change this value will update property subGroupInfos.
 */
/**
 * Invoked when the new atom value has been setted.
 *   event param of it has field: {nodeClass, props, repositoryItem}
 * @name Kekule.ChemWidget.StructureNodeSelectPanel#valueChange
 * @event
 */
Kekule.ChemWidget.StructureNodeSelectPanel = Class.create(Kekule.Widget.Panel,
/** @lends Kekule.ChemWidget.StructureNodeSelectPanel# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.StructureNodeSelectPanel',
	/** @private */
	BTN_DATA_FIELD: '__$btn_data__',
	/** @construct */
	initialize: function($super, parentOrElementOrDocument)
	{
		this.setPropStoreFieldValue('displayElements', true);
		this.setPropStoreFieldValue('displayNonElements', true);
		this.setPropStoreFieldValue('displaySubgroups', true);
		$super(parentOrElementOrDocument);
		this.addEventListener('execute', this.reactSelButtonExec.bind(this));
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('elementSymbols', {
			'dataType': DataType.ARRAY,
			'scope': Class.PropertyScope.PUBLIC
		});
		this.defineProp('nonElementInfos', {
			'dataType': DataType.ARRAY,
			'scope': Class.PropertyScope.PUBLIC
		});
		this.defineProp('subGroupInfos', {
			'dataType': DataType.ARRAY,
			'scope': Class.PropertyScope.PUBLIC
		});
		this.defineProp('subGroupRepItems', {
			'dataType': DataType.ARRAY,
			'scope': Class.PropertyScope.PUBLIC,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('subGroupRepItems', value);
				this._updateSubGroupInfosFromRepItems(value);
			}
		});
		this.defineProp('displayElements', {
			'dataType': DataType.BOOL,
			'scope': Class.PropertyScope.PUBLISHED
		});
		this.defineProp('displayNonElements', {
			'dataType': DataType.BOOL,
			'scope': Class.PropertyScope.PUBLISHED
		});
		this.defineProp('displaySubgroups', {
			'dataType': DataType.BOOL,
			'scope': Class.PropertyScope.PUBLISHED
		});

		this.defineProp('activeNode', {'dataType': DataType.ARRAY, 'serializable': false,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('activeNode', value);
				this.activeNodeChanged(value);
			}
		});
		// private
		this.defineProp('periodicTableDialog', {
			'dataType': DataType.OBJECT,
			'scope': Class.PropertyScope.PRIVATE,
			'serializable': false,
			'setter': null,
			'getter': function(canCreate)
			{
				var result = this.getPropStoreFieldValue('periodicTableDialog');
				if (!result && canCreate)  // create new one
				{
					var parentElem = this.getCoreElement();
					var doc = this.getDocument();
					result = this._createPeriodicTableDialogWidget(doc, parentElem);
					this.setPropStoreFieldValue('periodicTableDialog', result);
				}
				return result;
			}
		});
	},
	/** @private */
	initPropValues: function($super)
	{
		return $super();
	},
	/** @ignore */
	doFinalize: function($super)
	{
		var dialog = this.getPeriodicTableDialog();
		if (dialog)
			dialog.finalize();
		$super();
	},

	/**
	 * A helper method to set elementSymbols, nonElementInfos, subGroupInfos/subGroupRepItems properties at the same time.
	 * @param {Hash} data A hash object contains fields {elementSymbols, nonElementInfos, subGroupInfos, subGroupRepItems}
	 */
	setSelectableInfos: function(data)
	{
		this.beginUpdate();
		try
		{
			this.setPropValues(data);
		}
		finally
		{
			this.endUpdate();
		}
	},

	/**
	 * Event handler to react on selector button clicked.
	 * @private
	 */
	reactSelButtonExec: function(e)
	{
		var self = this;
		//var currNode = this.getNode();
		var btn = e.target;
		if (this._selButtons.indexOf(btn) >= 0)  // is a selector button
		{
			var data = btn[this.BTN_DATA_FIELD];
			if (data)
			{
				if (data.isPeriodicTable)  // special periodic table button to select single element
				{
					this._openPeriodicTableDialog(btn, function(result){
						if (result === Kekule.Widget.DialogButtons.OK)
						{
							var symbol = self._periodicTable.getSelectedSymbol();
							self.notifyValueChange(self.generateSelectableDataFromElementSymbol(symbol));
						}
					}, {'isSimpleAtom': true});
				}
				else if (data.isVarList || data.isVarNotList)  // atom list, use periodic table to select elements
				{
					this._openPeriodicTableDialog(btn, function(result){
						if (result === Kekule.Widget.DialogButtons.OK)
						{
							var symbols = self._periodicTable.getSelectedSymbols();
							var nodeClass = Kekule.VariableAtom;
							var props = data.isVarList?
								{'allowedIsotopeIds': symbols, 'disallowedIsotopeIds': null}:
								{'allowedIsotopeIds': null, 'disallowedIsotopeIds': symbols};
							self.notifyValueChange({'nodeClass': nodeClass, 'props': props});
						}
					}, {'isVarList': data.isVarList, 'isVarNotList': data.isVarNotList});
				}
				else  // normal button
				{
					this.notifyValueChange(data);
				}
			}
		}
	},
	/**
	 * Notify the new atom value has been setted.
	 * @private
	 */
	notifyValueChange: function(newData)
	{
		this.invokeEvent('valueChange', {
			'value': {
				'nodeClass': newData.nodeClass,
				'props': newData.props,
				//'node': newData.node,
				'repositoryItem': newData.repositoryItem
			}
		});
	},
	/** @private */
	activeNodeChanged: function(newNode)
	{
		// TODO: process to switch active node
	},

	/** @ignore */
	doObjectChange: function(modifiedPropNames)
	{
		var affectedProps = [
			'elementSymbols', 'nonElementInfos', 'subGroupInfos',
			'displayElements', 'displayNonElements', 'displaySubGroups'
		];
		if (Kekule.ArrayUtils.intersect(modifiedPropNames, affectedProps).length)
			this.updatePanelContent(this.getDocument(), this.getCoreElement());
	},

	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CCNS.STRUCTURE_NODE_SELECT_PANEL;
	},
	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('span');
		return result;
	},
	/** @ignore */
	doCreateSubElements: function($super, doc, rootElem)
	{
		var result = $super(doc, rootElem);

		this.updatePanelContent(doc, rootElem);
		// Custom input

		return result;
	},

	/** @private */
	_updateSubGroupInfosFromRepItems: function(repItems)
	{
		var infos = [];
		if (repItems && repItems.length)
		{
			for (var i = 0, l = repItems.length; i < l; ++i)
			{
				var repItem = repItems[i];
				var structFragment = repItem.getStructureFragment();
				var text = structFragment.getAbbr();
				if (!text)
				{
					var formulaText = structFragment.getFormulaText();
					var formula = Kekule.FormulaUtils.textToFormula(formulaText);
					var richText = formula.getDisplayRichText();
					text = Kekule.Render.RichTextUtils._toDebugHtml(richText);
				}
				/*
				if (!text)
				{
					text = repItem.getInputTexts()[0];
				}
				*/
				var info = {
					'text': text,
					'repositoryItem': repItem,
					'nodeClass': structFragment.getClass(),
					'node': structFragment,
					'hint': repItem.getName()
				};
				infos.push(info);
			}
			this.setSubGroupInfos(infos);
		}
	},

	/** @private */
	updatePanelContent: function(doc, rootElem)
	{
		// empty old buttons and sections
		if (this._selButtons)
		{
			for (var i = this._selButtons.length - 1; i >= 0; --i)
			{
				var btn = this._selButtons[i];
				this.removeWidget(btn);
			}
		}
		this._selButtons = [];
		Kekule.DomUtils.clearChildContent(rootElem);

		var btnData = this.generateSelectableData();
		var tabNames = this._getDisplayedTabPageNames();
		var tab = new Kekule.Widget.TabView(this);

		if (tabNames.indexOf('atom') >= 0)
		{
			var tabPageAtom = tab.createNewTabPage(Kekule.$L('ChemWidgetTexts.CAPTION_ATOM'));
			if (this.getDisplayElements())  // normal elements
				var section = this.doCreateSelButtonSection(doc, tabPageAtom.getCoreElement(), btnData.elementData);
			if (this.getDisplayNonElements())// non-element
				var section = this.doCreateSelButtonSection(doc, tabPageAtom.getCoreElement(), btnData.nonElementData, true);
		}
		if (tabNames.indexOf('subgroup') >= 0)
		{
			// subgroups
			var tabPageSubgroup = tab.createNewTabPage(Kekule.$L('ChemWidgetTexts.CAPTION_SUBGROUP'));
			var section = this.doCreateSelButtonSection(doc, tabPageSubgroup.getCoreElement(), btnData.subGroupData, true);
		}

		tab.setShowTabButtons(tabNames.length > 1);
	},
	/** @private */
	_getDisplayedTabPageNames: function()
	{
		var result = [];
		if (this.getDisplayElements() || this.getDisplayNonElements())
			result.push('atom');
		if (this.getDisplaySubgroups())
			result.push('subgroup');
		return result;
	},

	// generate button data
	/** @private */
	generateSelectableDataFromElementSymbol: function(symbol)
	{
		var caption = symbol;
		var isotopeInfo = Kekule.IsotopesDataUtil.getIsotopeInfoById(symbol);
		if (isotopeInfo)
		{
			if (isotopeInfo.isotopeAlias)
				caption = isotopeInfo.isotopeAlias;
			else
			{
				caption = '<sup>' + isotopeInfo.massNumber + '</sup>' + isotopeInfo.elementSymbol;
			}
		}
		return {
			'text': caption,
			'nodeClass': Kekule.Atom,
			'props': {'isotopeId': symbol}
		};
	},
	/** @private */
	generateSelectableData: function()
	{
		var elementSymbols = this.getElementSymbols() || [];
		var elementData = [];
		for (var i = 0, l = elementSymbols.length; i < l; ++i)
		{
			var data;
			if (elementSymbols[i] === '...')  // a special periodic table symbol
				data = {
					'text': '\u2026',  //elementSymbols[i],
					'nodeClass': null,
					'hint': Kekule.$L('ChemWidgetTexts.CAPTION_ATOMLIST_PERIODIC_TABLE'),
					'isPeriodicTable': true
				};
			else
				data = this.generateSelectableDataFromElementSymbol(elementSymbols[i]);
			elementData.push(data);
		}

		var nonElementData = this.getNonElementInfos();

		var subGroupData = this.getSubGroupInfos();

		return {
			'elementData': elementData,
			'nonElementData': nonElementData,
			'subGroupData': subGroupData
		};
	},

	// methods about sub widget creation
	/** @private */
	doCreateSelButton: function(doc, parentElem, buttonData, showDescription)
	{
		var caption = buttonData.text;
		if (showDescription && buttonData.description)
			caption += '<span style="font-size:80%"> ' + buttonData.description + '</span>';
		//var btnClass = buttonData.isPeriodicTable? Kekule.Widget.Button: Kekule.Widget.RadioButton;
		var btnClass = Kekule.Widget.Button;
		var result = new btnClass(doc, caption);
		result.addClassName(CCNS.STRUCTURE_NODE_SELECT_PANEL_SET_BUTTON);
		if (result.setGroup)  // radio button
			result.setGroup(this.getClassName());
		if (buttonData.hint)
			result.setHint(buttonData.hint);
		result[this.BTN_DATA_FIELD] = buttonData;
		this._selButtons.push(result);
		return result;
	},
	/** @private */
	doCreateSectionSelButtons: function(doc, sectionElem, data, showDescription)
	{
		if (!data)
			return;
		for (var i = 0, l = data.length; i < l; ++i)
		{
			var btn = this.doCreateSelButton(doc, sectionElem, data[i], showDescription);
			btn.setParent(this);
			btn.appendToElem(sectionElem);
		}
	},
	/** @private */
	doCreateSection: function(doc, parentElem)
	{
		var result = doc.createElement('div');
		result.className = CNS.SECTION;
		if (parentElem)
			parentElem.appendChild(result);
		return result;
	},
	/** @private */
	doCreateSelButtonSection: function(doc, parentElem, elementData, showDescription)
	{
		var section = this.doCreateSection(doc, parentElem);
		this.doCreateSectionSelButtons(doc, section, elementData, showDescription);
		return section;
	},

	/** @private */
	_createPeriodicTableDialogWidget: function(doc, parentElem)
	{
		var dialog = new Kekule.Widget.Dialog(doc, Kekule.$L('ChemWidgetTexts.CAPTION_PERIODIC_TABLE_DIALOG'),
				[Kekule.Widget.DialogButtons.OK, Kekule.Widget.DialogButtons.CANCEL]
		);
		var table = new Kekule.ChemWidget.PeriodicTable(doc);
		table.setUseMiniMode(true).setEnableSelect(true);
		table.setParent(dialog);
		table.appendToElem(dialog.getClientElem());
		this._periodicTable = table;
		return dialog;
	},
	/** @private */
	_openPeriodicTableDialog: function(caller, callback, extraInfo)
	{
		var dialog = this.getPeriodicTableDialog(true);
		var enableMultiSelect = extraInfo.isVarList || extraInfo.isVarNotList;
		this._periodicTable.setEnableMultiSelect(enableMultiSelect).setSelectedSymbol(null);

		var node = this.getActiveNode();

		// var list
		if ((extraInfo.isVarList || extraInfo.isVarNotList) && node instanceof Kekule.VariableAtom)
		{
			var allowedIds = node.getAllowedIsotopeIds();
			var disallowedIds = node.getDisallowedIsotopeIds();
			this._periodicTable.setSelectedSymbols(extraInfo.isVarList? allowedIds: disallowedIds);
		}

		// simple atom
		if (!enableMultiSelect && node instanceof Kekule.Atom)
		{
			this._periodicTable.setSelectedSymbol(node.getSymbol());
		}

		dialog.openPopup(callback, this || caller);
	}
});

/**
 * A widget used by AtomIaController to set node in chem structures in chem editor.
 * @class
 * @augments Kekule.Widget.BaseWidget
 *
 * @property {Kekule.Widget.ButtonTextBox} nodeInputBox A text box to input atom or subgroup directly.
 * @property {Kekule.ChemWidget.StructureNodeSelectPanel} nodeSelectPanel The child node selector panel inside this widget.
 * @property {Bool} showInputBox
 * @property {Bool} showSelectPanel
 * @property {Bool} useDropDownSelectPanel If true, the select panel will be a drop-down child widget of input box.
 * @property {Array} selectableElementSymbols Array of atomic symbols.
 *   Elements that can be directly selected by button.
 *   Note: Isotope id (e.g., D, 13C) can be used here.
 *   Note: a special symbol '...' can be used to create a periodic table button.
 * @property {Array} selectableNonElementInfos Array of info of displayed non-elements.
 *   Non element node (e.g. pseudoatom) types that can be directly selected by button.
 *   Each item is a hash {nodeClass, props, text, hint, description}.
 * @property {Array} selectableSubGroupInfos Array of info of displayed subgroups.
 *   Each item is a hash {text, hint, inputText, formulaText, description}.
 * @property {Array} selectableSubGroupRepItems Displayed subgroup repository items.
 *   Change this value will update property subGroupInfos.
 *
 * @property {Object} labelConfigs Label configs object of render configs.
 *
 * @property {Array} nodes Structure nodes that currently be edited in node setter.
 *   Note: When done editting, the changes will not directly applied to nodes, editor should handle them insteadly.
 * @property {Hash} value Node new properties setted by setter. Include fields: {nodeClass, props, repositoryItem}
 * @property {String} nodeLabel
 */
/**
 * Invoked when the new atom value has been setted.
 *   event param of it has field: {nodeClass, props, repositoryItem}
 * @name Kekule.ChemWidget.StructureNodeSetter#valueChange
 * @event
 */
/**
 * Invoked when the new atom value has been selected from selection panel.
 *   event param of it has field: {nodeClass, props, repositoryItem}
 * @name Kekule.ChemWidget.StructureNodeSetter#valueSelect
 * @event
 */
Kekule.ChemWidget.StructureNodeSetter = Class.create(Kekule.Widget.BaseWidget,
/** @lends Kekule.ChemWidget.StructureNodeSetter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.StructureNodeSetter',
	/** @construct */
	initialize: function($super, parentOrElementOrDocument)
	{
		$super(parentOrElementOrDocument);
		this._valueSetBySelectPanel = false;  // an internal flag, whether the value of node is set by click on select panel
		/*
		var self = this;
		this.addEventListener('keyup', function(e){
			console.log('key event', e);
			if (self.getUseDropDownSelectPanel())
			{
				var ev = e.htmlEvent;
				var keyCode = ev.getKeyCode();
				if (keyCode === Kekule.X.Event.KeyCode.DOWN)
				{
					self.showNodeSelectPanel();
				}
				else if (keyCode === Kekule.X.Event.KeyCode.UP)
				{
					self.hideNodeSelectPanel();
				}
			}
		});
		*/
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('nodes', {'dataType': DataType.ARRAY, 'serializable': false,
			'setter': function(value)
			{
				var nodes = Kekule.ArrayUtils.toArray(value);
				this.setPropStoreFieldValue('nodes', nodes);
				this.nodesChanged(nodes);
			}
		});
		this.defineProp('value', {'dataType': DataType.HASH, 'serializable': false, 'setter': null,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('value');
				if (!result && !this._valueSetBySelectPanel)
				{
					var text = this.getNodeInputBox().getValue();
					result = this._getValueFromDirectInputText(text);
				}
				return result;
			}
		});
		this.defineProp('nodeLabel', {'dataType': DataType.STRING, 'serializable': false, 'setter': null,
			'getter': function() { return this.getNodeInputBox().getValue(); }
		});

		this.defineProp('nodeInputBox', {
			'dataType': 'Kekule.Widget.ButtonTextBox',
			'serializable': false,
			'setter': false
		});
		this.defineProp('nodeSelectPanel', {
			'dataType': 'Kekule.ChemWidget.StructureNodeSelectPanel',
			'serializable': false,
			'setter': false
		});
		this.defineProp('showInputBox', {
			'dataType': DataType.BOOL,
			'getter': function() { return this.getNodeInputBox().getDisplayed(); },
			'setter': function(value) { this.getNodeInputBox().setDisplayed(value); }
		});
		this.defineProp('showSelectPanel', {
			'dataType': DataType.BOOL,
			'getter': function() { return this.getNodeSelectPanel().getDisplayed(); },
			'setter': function(value) { this.getNodeSelectPanel().setDisplayed(value); }
		});
		this.defineProp('useDropDownSelectPanel', {
			'dataType': DataType.BOOL,
			'setter': function(value) {
				if (this.getUseDropDownSelectPanel() !== value)
				{
					this.setPropStoreFieldValue('useDropDownSelectPanel', value);
					this._updateDropDownSettings(value);
				}
			}
		});

		this.defineProp('labelConfigs', {'dataType': DataType.OBJECT, 'serializable': false});
		//this.defineProp('editor', {'dataType': DataType.OBJECT, 'serializable': false});

		this._defineSelectPanelDelegatedProp('selectableElementSymbols', 'elementSymbols');
		this._defineSelectPanelDelegatedProp('selectableNonElementInfos', 'nonElementInfos');
		this._defineSelectPanelDelegatedProp('selectableSubGroupInfos', 'subGroupInfos');
		this._defineSelectPanelDelegatedProp('selectableSubGroupRepItems', 'subGroupRepItems');
		this._defineSelectPanelDelegatedProp('displaySelectableElements', 'displayElements');
		this._defineSelectPanelDelegatedProp('displaySelectableNonElements', 'displayNonElements');
		this._defineSelectPanelDelegatedProp('displaySelectableSubgroups', 'displaySubgroups');
	},
	/** @private */
	initPropValues: function($super)
	{
		$super();
	},
	/** @ignore */
	doFinalize: function($super)
	{
		var panel = this.getNodeSelectPanel();
		panel.finalize();
		$super();
	},
	/**
	 * Define property that directly mapped to select panel's property.
	 * @private
	 */
	_defineSelectPanelDelegatedProp: function(propName, selectPanelPropName)
	{
		if (!selectPanelPropName)
			selectPanelPropName = propName;
		var originalPropInfo = ClassEx.getPropInfo(Kekule.ChemWidget.StructureNodeSelectPanel, selectPanelPropName);
		var propOptions = Object.create(originalPropInfo);
		propOptions.getter = null;
		propOptions.setter = null;
		if (originalPropInfo.getter)
		{
			propOptions.getter = function()
			{
				return this.getNodeSelectPanel().getPropValue(selectPanelPropName);
			};
		}
		if (originalPropInfo.setter)
		{
			propOptions.setter = function(value)
			{
				this.getNodeSelectPanel().setPropValue(selectPanelPropName, value);
			}
		}
		return this.defineProp(propName, propOptions);
	},

	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CCNS.STRUCTURE_NODE_SETTER;
	},
	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('span');
		return result;
	},
	/** @ignore */
	doCreateSubElements: function($super, doc, rootElem)
	{
		var result = $super(doc, rootElem);
		var self = this;

		// input box
		var inputter = new Kekule.Widget.ButtonTextBox(this);
		this.setPropStoreFieldValue('nodeInputBox', inputter);
		inputter.addClassName(CCNS.STRUCTURE_NODE_SETTER_INPUTBOX);
		inputter.appendToElem(this.getCoreElement());
		inputter.addEventListener('valueChange', function(e){
			self._valueSetBySelectPanel = false;
			e.stopPropagation();  // elimiate valueChange event of inputbox, avoid bubble to parent
		});
		inputter.addEventListener('keyup', function(e){  // response to enter keypress in input box
			var ev = e.htmlEvent;
			var keyCode = ev.getKeyCode();
			if (keyCode === Kekule.X.Event.KeyCode.ENTER)
			{
				self._applyDirectInput();
			}
			if (self.getUseDropDownSelectPanel())
			{
				if (keyCode === Kekule.X.Event.KeyCode.DOWN)
				{
					self.showNodeSelectPanel();
				}
				else if (keyCode === Kekule.X.Event.KeyCode.UP)
				{
					self.hideNodeSelectPanel();
				}
			}
		});
		inputter.addEventListener('blur', function(e){
			if (e.target === inputter.getTextBox() && inputter.getIsDirty())
			{
				self._applyDirectInput();
			}
		});
		inputter.getButton().addEventListener('execute', function(e){
			if (self.getUseDropDownSelectPanel())
			{
				//self.getNodeSelectPanel().show(self.getNodeInputBox(), null, Kekule.Widget.ShowHideType.DROPDOWN);
				self.toggleNodeSelectPanel();
			}
			else
			{
				self._applyDirectInput();
			}
		});

		// select panel
		var panel = new Kekule.ChemWidget.StructureNodeSelectPanel(this);
		this.setPropStoreFieldValue('nodeSelectPanel', panel);
		panel.appendToElem(this.getCoreElement());
		panel.addEventListener('valueChange', function(e){
			var newEventArg = Object.extend({}, e);
			//self.invokeEvent('valueChange', {'value': e.value});
			e.stopPropagation();

			self._valueSetBySelectPanel = true;
			self.notifyValueChange(e.value, true);
			// when value is set by button in selector panel, auto hide it in drop down mode
			if (self.getUseDropDownSelectPanel())
				panel.hide();
		});

		this._updateDropDownSettings(this.getUseDropDownSelectPanel());

		return result;
	},
	/** @private */
	_updateDropDownSettings: function(useDropDownPanel)
	{
		var inputBox = this.getNodeInputBox();
		var selectPanel = this.getNodeSelectPanel();
		if (useDropDownPanel)
		{
			inputBox.setButtonKind(Kekule.Widget.Button.Kinds.DROPDOWN);
			selectPanel.removeFromDom();
		}
		else
		{
			inputBox.setButtonKind(Kekule.Widget.Button.Kinds.ENTER);
			selectPanel.appendToElem(this.getCoreElement());
			selectPanel.setStyleProperty('position', '');  // clear position:absolute value from previous dropdown show
			selectPanel.show(null, null,  Kekule.Widget.ShowHideType.DEFAULT);
		}
	},

	/** @private */
	_indexOfNonElementLabel: function(nodeLabel)
	{
		var infos = this.getNonAtomLabelInfos();
		for (var i = 0, l = infos.length; i < l; ++i)
		{
			var info = infos[i];
			if (info.nodeLabel === nodeLabel)
				return i;
		}
		return -1;
	},
	/** @private */
	_getNonAtomInfo: function(nodeLabel)
	{
		var infos = this.getSelectableNonElementInfos();
		if (infos)
		{
			for (var i = 0, l = infos.length; i <l; ++i)
			{
				var info = infos[i];
				if (info.text === nodeLabel)
					return info;
			}
		}
		return null;
	},
	/** @private */
	_getValueFromDirectInputText: function(text)
	{
		var nodeClass, modifiedProps, newNode, repItem, isUnknownPAtom;

		var nonAtomInfo = this._getNonAtomInfo(text);
		if (nonAtomInfo)  // is not an atom
		{
			nodeClass = nonAtomInfo.nodeClass;
			modifiedProps = nonAtomInfo.props;
			//isNonAtom = true;
		}
		else
		{
			//var editor = this.getEditor();
			// check if it is predefined subgroups first
			var subGroupRepositoryItem = Kekule.Editor.StoredSubgroupRepositoryItem2D.getRepItemOfInputText(text);
			repItem = subGroupRepositoryItem;
			if (subGroupRepositoryItem)  // add subgroup
			{
				/*
				 var baseAtom = Kekule.ArrayUtils.toArray(this.getNodes())[0];
				 var repResult = subGroupRepositoryItem.createObjects(baseAtom) || {};
				 var repObjects = repResult.objects;
				 if (editor)
				 {
				 var transformParams = Kekule.Editor.RepositoryStructureUtils.calcRepObjInitialTransformParams(editor, subGroupRepositoryItem, repResult, baseAtom, null);
				 editor.transformCoordAndSizeOfObjects(repObjects, transformParams);
				 }
				 */
				newNode = subGroupRepositoryItem.getStructureFragment(); //repObjects[0];
				nodeClass = newNode.getClass();
			}
			else if (text) // add normal node
			{
				nodeClass = Kekule.ChemStructureNodeFactory.getClassByLabel(text, null); // explicit set defaultClass parameter to null
				if (!nodeClass)
				{
					nodeClass = Kekule.Pseudoatom;
					isUnknownPAtom = true;
				}
				modifiedProps = (nodeClass === Kekule.Atom) ? {'isotopeId': text} :
						(nodeClass === Kekule.Pseudoatom) ? {'symbol': text} :
						{};
			}
		}
		var data = {
			'nodeClass': nodeClass, 'props': modifiedProps, /*'node': newNode*/ 'repositoryItem': repItem, 'isUnknownPseudoatom': isUnknownPAtom
		};

		return data;
	},
	/**
	 * Create new node modification information based on string in input text box directly.
	 * @private
	 */
	_applyDirectInput: function()
	{
		this._valueSetBySelectPanel = false;
		var inputBox = this.getNodeInputBox();
		var text = inputBox.getValue();
		var data = this._getValueFromDirectInputText(text);

		this.notifyValueChange(data);
		inputBox.setIsDirty(false);
	},

	/** @private */
	_getVarAtomListLabel: function()
	{
		var labelConfigs = this.getLabelConfigs();
		return labelConfigs? labelConfigs.getVariableAtom(): Kekule.ChemStructureNodeLabels.VARIABLE_ATOM;
	},
	_getVarAtomNotListLabel: function()
	{
		var labelConfigs = this.getLabelConfigs();
		return '~' + (labelConfigs? labelConfigs.getVariableAtom(): Kekule.ChemStructureNodeLabels.VARIABLE_ATOM);
	},
	/*
	 * Returns label that shows in node edit.
	 * @param {Kekule.ChemStructureNode} node
	 * @returns {String}
	 * @private
	 */
	/*
	_getNodeLabel: function(node)
	{
		var labelConfigs = this.getLabelConfigs();
		if (node.getIsotopeId)  // atom
			return node.getIsotopeId();
		else if (node instanceof Kekule.SubGroup)
		{
			var groupLabel = node.getAbbr() || node.getFormulaText();
			return groupLabel || labelConfigs.getRgroup();
		}
		else
		{
			var ri = node.getCoreDisplayRichTextItem(null, null, labelConfigs);
			return Kekule.Render.RichTextUtils.toText(ri);
		}
	},
	*/
	/** @private */
	_getAllNodeLabels: function(nodes)
	{
		return Kekule.Editor.StructureUtils.getAllChemStructureNodesLabel(nodes, this.getLabelConfigs());
		/*
		var nodeLabel;
		for (var i = 0, l = nodes.length; i < l; ++i)
		{
			var node = nodes[i];
			var currLabel = this._getNodeLabel(node);
			if (!nodeLabel)
				nodeLabel = currLabel;
			else
			{
				if (nodeLabel !== currLabel)  // different label, currently has different nodes
				{
					return null;
				}
			}
		}
		return nodeLabel;
		*/
	},

	/**
	 * Called when nodes property has been changed.
	 * @private
	 */
	nodesChanged: function(newNodes)
	{
		// update node label in edit
		var currLabel = this._getAllNodeLabels(newNodes) || '';
		var activeNode = currLabel? newNodes[0]: null;  // not empty currLabel means all nodes are in the same type
		this.getNodeSelectPanel().setActiveNode(activeNode);
		this.getNodeInputBox().setValue(currLabel);
		this.getNodeInputBox().setIsDirty(false);
		this.setPropStoreFieldValue('value', null);
		this._valueSetBySelectPanel = false;
	},

	/**
	 * Notify the new atom value has been setted.
	 * @private
	 */
	notifyValueChange: function(newData, isSelectedFromPanel)
	{
		//console.log('value changed', newData);
		this.setPropStoreFieldValue('value', newData);
		var eventData = {
			'nodeClass': newData.nodeClass,
			'props': newData.props,
			//'node': newData.node,
			'repositoryItem': newData.repositoryItem,
			'isUnknownPseudoatom': newData.isUnknownPseudoatom
		};
		if (isSelectedFromPanel)
			this.invokeEvent('valueSelect', {'value': eventData});
		this.invokeEvent('valueChange', {'value': eventData});
	},

	/**
	 * A helper method to change elementSymbols, nonElementInfos, subGroupInfos/subGroupRepItems properties of select panel at the same time.
	 * @param {Hash} data A hash object contains fields {elementSymbols, nonElementInfos, subGroupInfos, subGroupRepItems}
	 */
	setSelectableInfos: function(data)
	{
		this.getNodeSelectPanel().setSelectableInfos(data);
	},

	/**
	 * Show node select panel.
	 * Note this method should be called in drop down mode.
	 */
	showNodeSelectPanel: function()
	{
		var panel = this.getNodeSelectPanel();
		if (!panel.isShown())
		{
			panel.show(this.getNodeInputBox(), null, Kekule.Widget.ShowHideType.DROPDOWN);
		}
	},
	/**
	 * Hide node select panel.
	 * Note this method should be called in drop down mode.
	 */
	hideNodeSelectPanel: function()
	{
		var panel = this.getNodeSelectPanel();
		if (panel.isShown())
		{
			panel.hide();
		}
	},
	/**
	 * Toggle the show/hide state of node select panel.
	 * Note this method should be called in drop down mode.
	 */
	toggleNodeSelectPanel: function()
	{
		var panel = this.getNodeSelectPanel();
		if (panel.isShown())
			panel.hide();
		else
			panel.show(this.getNodeInputBox(), null, Kekule.Widget.ShowHideType.DROPDOWN);
	}
});

/**
 * An panel to set the bond type/order of a chem structure connector.
 * @class
 * @augments Kekule.Widget.Panel
 *
 * @property {Array} bondData Array of available bond properties.
 *   Each item is a hash, containing the properties of this bond item.
 *   e.g. {
 *     'bondProps': {'bondType': Kekule.BondType.COVALENT, 'bondOrder': Kekule.BondOrder.SINGLE, 'stereo': Kekule.BondStereo.NONE},
 *     'text': 'Single Bond', 'description': 'Single bond'
 *   }
 * @property {Hash} activeBondPropValues Bond property-value hash object of current selected bond.
 * @property {Array} bondPropNames Property names used in bondData.bondProps. Used to compare bond property values.
 *  ReadOnly.
 */
/**
 * Invoked when the new bond property has been setted.
 *   event param of it has field: {props}
 * @name Kekule.ChemWidget.StructureConnectorSelectPanel#valueChange
 * @event
 */
Kekule.ChemWidget.StructureConnectorSelectPanel = Class.create(Kekule.Widget.Panel,
/** @lends Kekule.ChemWidget.StructureConnectorSelectPanel# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.StructureConnectorSelectPanel',
	/** @private */
	BTN_DATA_FIELD: '__$btn_data__',
	/** @private */
	BTN_GROUP: '__$bond_btn_group__',
	/** @construct */
	initialize: function($super, parentOrElementOrDocument)
	{
		$super(parentOrElementOrDocument);
		this._selButtons = [];
		this._activeBtn = null;
		this.addEventListener('execute', this.reactSelButtonExec.bind(this));
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('bondData', {
			'dataType': DataType.ARRAY,
			'scope': Class.PropertyScope.PUBLIC
		});
		this.defineProp('activeBondPropValues', {
			'dataType': DataType.HASH,
			'scope': Class.PropertyScope.PUBLIC,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('activeBondPropValues', value);
				this.activeBondPropsChanged(value);
			}
		});
		this.defineProp('activeBondHtmlClass', {
			'dataType': DataType.STRING,
			'scope': Class.PropertyScope.PRIVATE,
			'setter': null,
			'getter': function()
			{
				var btn = this._activeBtn;
				if (btn)
				{
					var data = btn[this.BTN_DATA_FIELD];
					return data && data.htmlClass;
				}
				return null;
			}
		});
		this.defineProp('bondPropNames', {'dataType': DataType.ARRAY, 'serializable': false})
	},

	/** @ignore */
	doObjectChange: function(modifiedPropNames)
	{
		var affectedProps = [
			'bondData'
		];
		if (Kekule.ArrayUtils.intersect(modifiedPropNames, affectedProps).length)
			this.updatePanelContent(this.getDocument(), this.getCoreElement());
	},

	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CCNS.STRUCTURE_CONNECTOR_SELECT_PANEL;
	},
	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('span');
		return result;
	},
	/** @ignore */
	doCreateSubElements: function($super, doc, rootElem)
	{
		var result = $super(doc, rootElem);

		this.updatePanelContent(doc, rootElem);
		// Custom input

		return result;
	},

	/** @private */
	activeBondPropsChanged: function(value)
	{
		// deselect all buttons first
		if (this._activeBtn)
		{
			this._activeBtn.setChecked(false);
			this._activeBtn = null;
		}
		// then check the proper button
		if (value)
		{
			var btns = this._selButtons;
			for (var i = 0, l = btns.length; i < l; ++i)
			{
				var data = btns[i][this.BTN_DATA_FIELD];
				if (data && this._isBondPropsMatch(value, data.bondProps, this.getBondPropNames()))
				{
					btns[i].setChecked(true);
					this._activeBtn = btns[i];
					break;
				}
			}
		}
	},
	/** @private */
	_isBondPropsMatch: function(src, target, propNames)
	{
		return Kekule.Editor.StructureUtils.isBondPropsMatch(src, target, propNames);
	},

	/**
	 * Event handler to react on selector button clicked.
	 * @private
	 */
	reactSelButtonExec: function(e)
	{
		var self = this;
		//var currNode = this.getNode();
		var btn = e.target;
		if (this._selButtons.indexOf(btn) >= 0)  // is a selector button
		{
			this._activeBtn = btn;
			var data = btn[this.BTN_DATA_FIELD];
			if (data)
			{
				this.setPropStoreFieldValue('activeBondPropValues', data.bondProps);
				this.notifyValueChange(data.bondProps);
			}
		}
	},
	/**
	 * Notify the new bond props value has been setted.
	 * @private
	 */
	notifyValueChange: function(newData)
	{
		this.invokeEvent('valueChange', {
			'value': newData
		});
	},

	/** @private */
	updatePanelContent: function(doc, rootElem)
	{
		if (this._selButtons)
		{
			for (var i = this._selButtons.length - 1; i >= 0; --i)
			{
				var btn = this._selButtons[i];
				this.removeWidget(btn);
			}
		}
		var propNames = [];
		this._selButtons = [];
		//Kekule.DomUtils.clearChildContent(rootElem);
		var bondData = this.getBondData();
		if (bondData)
		{
			for (var i = 0, l = bondData.length; i < l; ++i)
			{
				var data = bondData[i];
				var propData = data.bondProps;
				var btn = this._createBondSelButton(doc, data);
				btn.appendToElem(rootElem);
				this._selButtons.push(btn);
				if (propData)
				  AU.pushUnique(propNames, Kekule.ObjUtils.getOwnedFieldNames(propData));
			}
		}
		if (!this.getBondPropNames())
			this.setPropStoreFieldValue('bondPropNames', propNames);
	},
	/** @private */
	_createBondSelButton: function(doc, data)
	{
		var result = new Kekule.Widget.RadioButton(this);
		result.addClassName(CCNS.STRUCTURE_CONNECTOR_SELECT_PANEL_SET_BUTTON);
		result.setGroup(this.BTN_GROUP).setShowGlyph(true).setShowText(false);
		result.setText(data.text || null).setHint(data.hint || data.description || null);
		if (data.htmlClass)
			result.addClassName(data.htmlClass);
		result[this.BTN_DATA_FIELD] = data;
		return result;
	}
});

/**
 * An panel to set the charge chem structure atom.
 * @class
 * @augments Kekule.Widget.Panel
 *
 * @property {Number} value Charge value of selected objects or set by panel.
 * @property {Number} minCharge
 * @property {Number} maxCharge
 */
/**
 * Invoked when the new bond property has been setted.
 *   event param of it has field: {props}
 * @name Kekule.ChemWidget.ChargeSelectPanel#valueChange
 * @event
 */
Kekule.ChemWidget.ChargeSelectPanel = Class.create(Kekule.Widget.Panel,
/** @lends Kekule.ChemWidget.ChargeSelectPanel# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ChargeSelectPanel',
	/** @private */
	CHARGE_FIELD: '__$charge__',
	/** @construct */
	initialize: function($super, parentOrElementOrDocument)
	{
		this._chargeBtnGroups = {};  // private
		this._selectedButton = null; // private
		this._chargeButtonMap = [];  // private
		$super(parentOrElementOrDocument);
		this.addEventListener('execute', this.reactSelButtonExec.bind(this));
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('value', {
			'dataType': DataType.NUMBER,
			'scope': Class.PropertyScope.PUBLIC,
			'setter': function(value)
			{
				var oldValue = this.getValue();
				if (value !== oldValue)
				{
					var oldSelBtn = this._chargeButtonMap[oldValue];
					if (oldSelBtn)
					{
						oldSelBtn.setChecked(false);
						oldSelBtn.blur();
					}
					this.setPropStoreFieldValue('value', value);
					var newSelBtn = this._chargeButtonMap[value];
					if (newSelBtn)
						newSelBtn.setChecked(true);
					this._selectedButton = newSelBtn;
				}
			}
		});
		this.defineProp('minCharge', {
			'dataType': DataType.NUMBER,
			'scope': Class.PropertyScope.PUBLIC
		});
		this.defineProp('maxCharge', {
			'dataType': DataType.NUMBER,
			'scope': Class.PropertyScope.PUBLIC
		});
	},
	/** @ignore */
	initPropValues: function($super)
	{
		$super();
		this.setMaxCharge(4).setMinCharge(-4);
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CCNS.CHARGE_SELECT_PANEL;
	},
	/** @ignore */
	doCreateSubElements: function($super, doc, rootElem)
	{
		var result = $super(doc, rootElem);
		this.updateChargeButtons(doc, rootElem);
		return result;
	},
	/** @private */
	updateChargeButtons: function(doc, rootElem)
	{
		// clear old btn groups
		var groups = this._chargeBtnGroups;
		var groupNames = ['zero', 'positive', 'negative'];
		for (var i = 0, l = groupNames.length; i <l; ++i)
		{
			var group = groups[groupNames[i]];
			if (group)
				group.clearWidgets();
			else
			{
				group = new Kekule.Widget.ButtonGroup(this);
				group.addClassName(CCNS.CHARGE_SELECT_PANEL_BTNGROUP);
				group.appendToElem(rootElem);
				groups[groupNames[i]] = group;
			}
		}

		// recreate charge buttons
		var chargeMax = Math.floor(this.getMaxCharge());
		var chargeMin = Math.floor(this.getMinCharge());
		var btn;
		var sPositive = Kekule.$L('ChemWidgetTexts.TEXT_CHARGE_POSITIVE');
		var sNegative = Kekule.$L('ChemWidgetTexts.TEXT_CHARGE_NEGATIVE');
		// positive
		if (chargeMax >= 1)
		{
			var group = this._chargeBtnGroups.positive;
			for (var i = Math.max(chargeMin, 1); i <= chargeMax; ++i)
			{
				btn = this._createChargeButton(group, i, i + sPositive);
				//btn.appendToWidget(group);
			}
		}
		// zero
		if (chargeMax >= 0 && chargeMin <= 0)
		{
			var group = this._chargeBtnGroups.zero;
			btn = this._createChargeButton(group, 0, Kekule.$L('ChemWidgetTexts.TEXT_CHARGE_NONE'), Kekule.$L('ChemWidgetTexts.HINT_CHARGE_NONE'));
			//btn.appendToWidget(group);
		}
		// negative
		if (chargeMin <= -1)
		{
			var group = this._chargeBtnGroups.negative;
			for (var i = Math.min(chargeMax, -1); i >= chargeMin; --i)
			{
				btn = this._createChargeButton(group, i, Math.abs(i) + sNegative);
				//btn.appendToWidget(group);
			}
		}
	},
	/** @private */
	_createChargeButton: function(btnGroup, charge, text, hint)
	{
		var result = new Kekule.Widget.RadioButton(btnGroup, text);
		result[this.CHARGE_FIELD] = charge;
		this._chargeButtonMap[charge] = result;
		if (hint)
			result.setHint(hint);
		result.addClassName(CCNS.CHARGE_SELECT_PANEL_CHARGE_BTN);
		//result.setGroup(this.getClassName());  // group as one
		result.appendToWidget(btnGroup);
		if (this.getValue() === charge)
		{
			result.setChecked(true);
			this._selectedButton = result;
		}
		return result;
	},

	/** @private */
	reactSelButtonExec: function(e)
	{
		var target = e.target;
		var charge = target[this.CHARGE_FIELD];
		if (Kekule.ObjUtils.notUnset(charge))
		{
			this.setValue(charge);
			this.notifyValueChange(charge);
		}
	},

	/**
	 * Notify the new bond props value has been setted.
	 * @private
	 */
	notifyValueChange: function(newValue)
	{
		this.invokeEvent('valueChange', {
			'value': newValue
		});
	}
});

})();