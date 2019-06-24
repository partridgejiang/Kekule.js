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

var OU = Kekule.ObjUtils;
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
	STRUCTURE_CONNECTOR_SELECT_PANEL_ADV: 'K-Chem-StructureConnectorSelectPanelAdv',
	STRUCTURE_CONNECTOR_SELECT_PANEL_ADV_EXTRA_SECTION: 'K-Chem-StructureConnectorSelectPanelAdv-ExtraSection',
	STRUCTURE_CONNECTOR_SELECT_PANEL_EXTRA_SECTION_BUTTON: 'K-Chem-StructureConnectorSelectPanelAdv-ExtraSection-Button',
	STRUCTURE_CONNECTOR_SELECT_PANEL_EXTRA_SECTION_BUTTON_KEKULIZE: 'K-Chem-StructureConnectorSelectPanelAdv-ExtraSection-Button-Kekulize',
	STRUCTURE_CONNECTOR_SELECT_PANEL_EXTRA_SECTION_BUTTON_HUCKLIZE: 'K-Chem-StructureConnectorSelectPanelAdv-ExtraSection-Button-Hucklize',
	CHARGE_SELECT_PANEL: 'K-Chem-Charge-SelectPanel',
	CHARGE_SELECT_PANEL_BTNGROUP: 'K-Chem-Charge-SelectPanel-BtnGroup',
	CHARGE_SELECT_PANEL_CHARGE_BUTTON: 'K-Chem-Charge-SelectPanel-ChargeButton',
	GLYPH_PATH_ARROW_SETTING_PANEL: 'K-Chem-GlyphPath-Arrow-SettingPanel',
	GLYPH_PATH_ARROW_STYLE_BTNGROUP: 'K-Chem-GlyphPath-Arrow-StyleButtonGroup',
	GLYPH_PATH_ARROW_STYLE_BUTTON: 'K-Chem-GlyphPath-Arrow-StyleButton',
	GLYPH_Path_ARROW_SIZE_SETTER: 'K-Chem-GlyphPath-Arrow-SizeSetter',
	GLYPH_REACTION_ARROW_PRESET_SELECTOR: 'K-Chem-Glyph-ReactionArrow-PresetSelector',
	GLYPH_REACTION_ARROW_PRESET_SELECTOR_BTNSET: 'K-Chem-Glyph-ReactionArrow-PresetSelector-ButtonSet',
	GLYPH_REACTION_ARROW_PRESET_SELECTOR_BTNSET_DROPDOWN: 'K-Chem-Glyph-ReactionArrow-PresetSelector-ButtonSet-DropDown',
	GLYPH_REACTION_ARROW_PRESET_SELECTOR_BUTTON: 'K-Chem-Glyph-ReactionArrow-PresetSelector-Button',
	GLYPH_ELECTRON_PUSHING_ARROW_PRESET_SELECTOR: 'K-Chem-Glyph-ElectronPushingArrow-PresetSelector',
	GLYPH_ELECTRON_PUSHING_ARROW_PRESET_SELECTOR_BTNGROUP: 'K-Chem-Glyph-ReactionArrow-PresetSelector-ButtonGroup',
	GLYPH_ELECTRON_PUSHING_ARROW_PRESET_SELECTOR_BUTTON: 'K-Chem-Glyph-ElectronPushingArrow-PresetSelector-Button',
	GLYPH_PATH_LINE_SETTING_PANEL: 'K-Chem-GlyphPath-Line-SettingPanel',
	GLYPH_PATH_SETTING_PANEL: 'K-Chem-GlyphPath-SettingPanel',
	GLYPH_PATH_SETTING_PANEL_SECTION: 'K-Chem-GlyphPath-SettingPanel-Section',
	GLYPH_PATH_SETTING_PANEL_SECTION_TITLE: 'K-Chem-GlyphPath-SettingPanel-Section-Title',
	GLYPH_PATH_SETTING_PANEL_SECTION_PANEL: 'K-Chem-GlyphPath-SettingPanel-Section-Panel',
	GLYPH_REACTION_ARROW_PATH_SETTING_PANEL: 'K-Chem-ReactionArrow-SettingPanel',
	GLYPH_REACTION_ARROW_PATH_SETTING_PANEL_ARROW_PRESET_SECTION: 'K-Chem-ReactionArrow-SettingPanel-ArrowPresetSection',
	GLYPH_ARC_PATH_SETTING_PANEL: 'K-Chem-ArcPath-SettingPanel',
	GLYPH_ELECTRON_PUSHING_ARROW_SETTING_PANEL: 'K-Chem-ElectronPusingArrow-SettingPanel'
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
 * Invoked when the new atom value has been set.
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
 * Invoked when the new bond property has been set.
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
		{
			this.updatePanelContent(this.getDocument(), this.getCoreElement());
		}
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
 * An advanced panel inherited from {@link Kekule.ChemWidget.StructureConnectorSelectPanel}.
 * Aside from the basic function of setting the bond type/order of a chem structure connector, it also
 * includes buttons to run Hucklize or Kekulize process to connectors.
 * @class
 * @augments Kekule.ChemWidget.StructureConnectorSelectPanel
 *
 * @property {Array} extraComponents Additional sections in this panel, now the only available value is ['kekulize'].
 */
/**
 * Invoked when a command button in extra section is clicked.
 *   event param of it has field: {command}
 * @name Kekule.ChemWidget.StructureConnectorSelectPanelAdv#command
 * @event
 */
Kekule.ChemWidget.StructureConnectorSelectPanelAdv = Class.create(Kekule.ChemWidget.StructureConnectorSelectPanel,
/** @lends Kekule.ChemWidget.StructureConnectorSelectPanelAdv# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.StructureConnectorSelectPanelAdv',
	/** @construct */
	initialize: function($super, parentOrElementOrDocument)
	{
		this.setPropStoreFieldValue('extraComponents', [Kekule.ChemWidget.StructureConnectorSelectPanelAdv.Components.KEKULIZE]);
		this._additionalCompWidgets = [];  // internal
		$super(parentOrElementOrDocument);
	},
	/** @private */
	initProperties: function() {
		this.defineProp('extraComponents', {
			'dataType': DataType.ARRAY,
			'scope': Class.PropertyScope.PUBLIC
		});
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CCNS.STRUCTURE_CONNECTOR_SELECT_PANEL_ADV;
	},
	/** @ignore */
	doObjectChange: function($super, modifiedPropNames)
	{
		$super(modifiedPropNames);
		var affectedProps = [
			'extraComponents'
		];
		if (Kekule.ArrayUtils.intersect(modifiedPropNames, affectedProps).length)
			this.updatePanelContent(this.getDocument(), this.getCoreElement());
	},

	/** @ignore */
	updatePanelContent: function($super, doc, rootElem)
	{
		this.clearAdditionalSections();
		$super(doc, rootElem);
		var extraComps = this.getExtraComponents();
		if (extraComps)
		{
			if (extraComps.indexOf(Kekule.ChemWidget.StructureConnectorSelectPanelAdv.Components.KEKULIZE) >= 0)  // need to show the hucklize-kekulize section
			{
				this._createKekulizeSection(doc, rootElem).appendToElem(rootElem);
			}
		}
	},
	/**
	 * Event handler to react on selector button clicked.
	 * @private
	 */
	reactSelButtonExec: function($super, e)
	{
		$super(e);
		var btn = e.target;
		if (btn._command)  // is a extra command button, not a bond select button
		{
			this.invokeEvent('command', {
				'command': btn._command
			});
		}
	},
	/** @private */
	clearAdditionalSections: function()
	{
		if (this._additionalCompWidgets)
		{
			for (var i = 0, l = this._additionalCompWidgets.length; i < l; ++i)
			{
				var w = this._additionalCompWidgets[i];
				w.finalize();
			}
			this._additionalCompWidgets = [];
		}
	},
	/**
	 * Create an additional component section in panel.
	 * @param {HTMLDocument} doc
	 * @param {HTMLElement} rootElem
	 * @private
	 */
	createAdditionalSection: function(doc, rootElem)
	{
		var result = new Kekule.Widget.Container(doc);
		result.addClassName(CCNS.STRUCTURE_CONNECTOR_SELECT_PANEL_ADV_EXTRA_SECTION);
		this._additionalCompWidgets.push(result);
		result.appendToElem(rootElem);
		result.setParent(this);
		return result;
	},
	/** @private */
	_createKekulizeSection: function(doc, rootElem)
	{
		var result = this.createAdditionalSection(doc, rootElem);

		// add kekulize and hucklize buttons
		var btnKekulize = new Kekule.Widget.Button(result);
		btnKekulize.addClassName([CCNS.STRUCTURE_CONNECTOR_SELECT_PANEL_EXTRA_SECTION_BUTTON, CCNS.STRUCTURE_CONNECTOR_SELECT_PANEL_EXTRA_SECTION_BUTTON_KEKULIZE])
			.setText(Kekule.$L('ChemWidgetTexts.CAPTION_MOL_BOND_KEKULIZE')).setHint(Kekule.$L('ChemWidgetTexts.HINT_MOL_BOND_KEKULIZE'))
			.setShowGlyph(true).setShowText(false);
		btnKekulize._command = Kekule.ChemWidget.StructureConnectorSelectPanelAdv.Commands.KEKULIZE;
		result.appendWidget(btnKekulize);

		// double direction arrow
		var span = doc.createElement('span');
		Kekule.DomUtils.setElementText(span, ' \u25C0 \u25B6 ');  // ◀ ▶
		//span.innerHTML = '&10231;';
		result.getElement().appendChild(span);

		var btnHucklize = new Kekule.Widget.Button(result);
		btnHucklize.addClassName([CCNS.STRUCTURE_CONNECTOR_SELECT_PANEL_EXTRA_SECTION_BUTTON, CCNS.STRUCTURE_CONNECTOR_SELECT_PANEL_EXTRA_SECTION_BUTTON_HUCKLIZE])
			.setText(Kekule.$L('ChemWidgetTexts.CAPTION_MOL_BOND_HUCKLIZE')).setHint(Kekule.$L('ChemWidgetTexts.HINT_MOL_BOND_HUCKLIZE'))
			.setShowGlyph(true).setShowText(false);
		btnHucklize._command = Kekule.ChemWidget.StructureConnectorSelectPanelAdv.Commands.HUCKLIZE;
		result.appendWidget(btnHucklize);

		return result;
	}
});
/**
 * A enumeration of available additional component names in {@link Kekule.ChemWidget.StructureConnectorSelectPanelAdv}.
 * @enum
 * @ignore
 */
Kekule.ChemWidget.StructureConnectorSelectPanelAdv.Components = {
	KEKULIZE: 'kekulize'
};
/**
 * A enumeration of available additional command names in {@link Kekule.ChemWidget.StructureConnectorSelectPanelAdv}.
 * @enum
 * @ignore
 */
Kekule.ChemWidget.StructureConnectorSelectPanelAdv.Commands = {
	KEKULIZE: 'kekulize',
	HUCKLIZE: 'hucklize'
};

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
 * Invoked when the new charge value has been set.
 *   event param of it has field: {value}
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
		this.setPropStoreFieldValue('maxCharge', 4);
		this.setPropStoreFieldValue('minCharge', -4);
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
			'scope': Class.PropertyScope.PUBLIC,
			'setter': function(value){
				if (value !== this.getMinCharge())
				{
					this.setPropStoreFieldValue('minCharge', value);
					this.updateChargeButtons();
				}
			}
		});
		this.defineProp('maxCharge', {
			'dataType': DataType.NUMBER,
			'scope': Class.PropertyScope.PUBLIC,
			'setter': function(value){
				if (value !== this.getMaxCharge())
				{
					this.setPropStoreFieldValue('maxCharge', value);
					this.updateChargeButtons();
				}
			}
		});
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
			if (group)
			{
				for (var i = Math.max(chargeMin, 1); i <= chargeMax; ++i)
				{
					btn = this._createChargeButton(group, i, i + sPositive);
					//btn.appendToWidget(group);
				}
			}
		}
		// zero
		if (chargeMax >= 0 && chargeMin <= 0)
		{
			var group = this._chargeBtnGroups.zero;
			if (group)
				btn = this._createChargeButton(group, 0, Kekule.$L('ChemWidgetTexts.TEXT_CHARGE_NONE'), Kekule.$L('ChemWidgetTexts.HINT_CHARGE_NONE'));
			//btn.appendToWidget(group);
		}
		// negative
		if (chargeMin <= -1)
		{
			var group = this._chargeBtnGroups.negative;
			if (group)
			{
				for (var i = Math.min(chargeMax, -1); i >= chargeMin; --i)
				{
					btn = this._createChargeButton(group, i, Math.abs(i) + sNegative);
					//btn.appendToWidget(group);
				}
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
		result.addClassName(CCNS.CHARGE_SELECT_PANEL_CHARGE_BUTTON);
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

/**
 * An panel to set the properties of a path glyph starting or ending arrow.
 * @class
 * @augments Kekule.Widget.Panel
 *
 * @property {Hash} value Arrow params, including fields: {arrowType, arrowSide, width, length}.
 */
/**
 * Invoked when the new arrow params has been set.
 *   event param of it has field: {widget, value}
 * @name Kekule.ChemWidget.GlyphPathArrowSettingPanel#valueChange
 * @event
 */
/**
 * Invoked when the new arrow params are setting in the widget.
 *   event param of it has field: {widget, value}
 * @name Kekule.ChemWidget.GlyphPathArrowSettingPanel#valueInput
 * @event
 */
Kekule.ChemWidget.GlyphPathArrowSettingPanel = Class.create(Kekule.Widget.Panel,
/** @lends Kekule.ChemWidget.GlyphPathArrowSettingPanel# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.GlyphPathArrowSettingPanel',
	/** @private */
	DATA_FIELD: '__$data$__',
	/* @private */
	//DATA_SIZE_RATIO: 10,
	/** @construct */
	initialize: function($super, parentOrElementOrDocument)
	{
		this._isSettingValue = false;
		this._arrowWidthInputter = null;
		this._arrowLengthInputter = null;
		this._arrowStyleButtons = null;

		//this.setPropStoreFieldValue('value', {});
		this.setPropStoreFieldValue('arrowWidthMin', 0);
		this.setPropStoreFieldValue('arrowWidthMax', 0.5);
		this.setPropStoreFieldValue('arrowWidthStep', 0.1);
		this.setPropStoreFieldValue('arrowLengthMin', 0);
		this.setPropStoreFieldValue('arrowLengthMax', 0.5);
		this.setPropStoreFieldValue('arrowLengthStep', 0.1);
		this.setPropStoreFieldValue('defaultValue', {
			arrowType: Kekule.Glyph.ArrowType.NONE,
			arrowSide: Kekule.Glyph.ArrowSide.BOTH
		});

		$super(parentOrElementOrDocument);

		this.addEventListener('check', this.reactArrowStyleButtonCheck.bind(this));
		this.addEventListener('valueChange', this.reactArrowSizeInputterChange.bind(this));
		this.addEventListener('valueInput', this.reactArrowSizeInputterInput.bind(this));
	},
	/** @private */
	initProperties: function() {
		this.defineProp('defaultValue', {'dataType': DataType.HASH, 'scope': Class.PropertyScope.PRIVATE});
		this.defineProp('value', {
			'dataType': DataType.HASH,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('value');
				if (!result)
				{
					result = {};
					this.setPropStoreFieldValue('value', result);
				}
				return result;
			},
			'setter': function(value)
			{
				this._isSettingValue = true;
				try
				{
					this.setPropStoreFieldValue('value', value);
					var concreteValue = Object.extend(Object.extend({}, this.getDefaultValue()), value, !true, true);
					// arrow style
					for (var i = 0, l = this._arrowStyleButtons.length; i < l; ++i)
					{
						var btn = this._arrowStyleButtons[i];
						var data = btn[this.DATA_FIELD];
						if (data.arrowType === concreteValue.arrowType && (data.arrowSide === concreteValue.arrowSide) || (data.arrowType === Kekule.Glyph.ArrowType.NONE))
							btn.setChecked(true);
						else
							btn.setChecked(false);
					}
					// arrow size
					if (OU.notUnset(concreteValue.arrowWidth))
					{
						this._arrowWidthInputter.setValue(concreteValue.arrowWidth);
					}
					if (OU.notUnset(concreteValue.arrowLength))
					{
						this._arrowLengthInputter.setValue(concreteValue.arrowLength);
					}
				}
				finally
				{
					this._isSettingValue = false;
				}
			}
		});
		this.defineProp('allowedArrowTypes', {'dataType': DataType.ARRAY});
		this.defineProp('allowedArrowSides', {'dataType': DataType.ARRAY});
		this.defineProp('arrowWidthMin', {'dataType': DataType.NUMBER});
		this.defineProp('arrowWidthMax', {'dataType': DataType.NUMBER});
		this.defineProp('arrowWidthStep', {'dataType': DataType.NUMBER});
		this.defineProp('arrowLengthMin', {'dataType': DataType.NUMBER});
		this.defineProp('arrowLengthMax', {'dataType': DataType.NUMBER});
		this.defineProp('arrowLengthStep', {'dataType': DataType.NUMBER});
	},
	/** @ignore */
	doObjectChange: function($super, modifiedPropNames)
	{
		if (modifiedPropNames.indexOf('allowedArrowTypes') >= 0 || modifiedPropNames.indexOf('allowedArrowSides') >= 0)
			this._updateStyleButtons();
		if (AU.intersect(modifiedPropNames, ['arrowWidthMin', 'arrowWidthMax', 'arrowWidthStep']).length)
			this._updateWidthInputter();
		if (AU.intersect(modifiedPropNames, ['arrowLengthMin', 'arrowLengthMax', 'arrowLengthStep']).length)
			this._updateLengthInputter();
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CCNS.GLYPH_PATH_ARROW_SETTING_PANEL;
	},
	/** @ignore */
	doCreateSubElements: function($super, doc, rootElem)
	{
		var result = $super(doc, rootElem);
		var styleSectionElem = this.doCreateSectionElem(doc, rootElem);
		var styleGroup = this.doCreateArrowStyleButtons(doc, styleSectionElem);
		var sizeSectionElem = this.doCreateSectionElem(doc, rootElem);
		var sizeGroup = this.doCreateArrowSizeControls(doc, sizeSectionElem);
		return result.concat(styleGroup).concat(sizeGroup);
	},
	/** @private */
	doCreateSectionElem: function(doc, parentElem)
	{
		var result = doc.createElement('div');
		parentElem.appendChild(result);
		return result;
	},
	/** @private */
	doCreateArrowStyleButtons: function(doc, parentElem)
	{
		var AT = Kekule.Glyph.ArrowType;
		var AS = Kekule.Glyph.ArrowSide;

		var arrowTypeClassNames = {};
		arrowTypeClassNames[AT.NONE] = 'None';
		arrowTypeClassNames[AT.OPEN] = 'Open';
		arrowTypeClassNames[AT.TRIANGLE] = 'Triangle';
		var arrowSideClassNames = {};
		arrowSideClassNames[AS.BOTH] = 'Both';
		arrowSideClassNames[AS.SINGLE] = 'Single';
		arrowSideClassNames[AS.REVERSED] = 'Reversed';

		var arrowTypes = /*this.getAllowedArrowTypes() ||*/ [AT.NONE, AT.OPEN, AT.TRIANGLE];
		var arrowSides = /*this.getAllowedArrowSides() ||*/ [AS.BOTH, AS.SINGLE, AS.REVERSED];
		var btnGroup = new Kekule.Widget.ButtonGroup(this);
		btnGroup.addClassName(CCNS.GLYPH_PATH_ARROW_STYLE_BTNGROUP);

		this._arrowStyleButtons = [];
		var noneIndex = arrowTypes.indexOf(AT.NONE);
		if (noneIndex >= 0)  // handle no arrow style
		{
			arrowTypes.splice(noneIndex, 1);
			var atClassName = arrowTypeClassNames[AT.NONE];
			var caption = atClassName;
			var hint = caption;
			var className =  CCNS.GLYPH_PATH_ARROW_STYLE_BUTTON + '-' + atClassName;
			var btn = new Kekule.Widget.RadioButton(btnGroup, caption);
			btn.setHint(hint).addClassName(className);
			btn[this.DATA_FIELD] = {'arrowType': AT.NONE, 'arrowSide': (this.getDefaultValue() || {}).arrowSide};
			this._arrowStyleButtons.push(btn);
		}
		for (var i = 0, ii = arrowTypes.length; i < ii; ++i)
		{
			for (var j = 0, jj = arrowSides.length; j < jj; ++j)
			{
				var atClassName = arrowTypeClassNames[arrowTypes[i]];
				var asClassName = arrowSideClassNames[arrowSides[j]];
				var caption = atClassName + ' / ' + asClassName;
				var hint = caption;
				var className =  CCNS.GLYPH_PATH_ARROW_STYLE_BUTTON + '-' + atClassName + '-' + asClassName;
				var btn = new Kekule.Widget.RadioButton(btnGroup, caption);
				btn.setHint(hint).addClassName(className);
				btn[this.DATA_FIELD] = {'arrowType': arrowTypes[i], 'arrowSide': arrowSides[j]};
				this._arrowStyleButtons.push(btn);
			}
		}
		btnGroup.setShowGlyph(true).setShowText(false);
		this._updateStyleButtons(this._arrowStyleButtons);

		btnGroup.appendToElem(parentElem);
		return [btnGroup];
	},
	/** @private */
	doCreateArrowSizeControls: function(doc, parentElem)
	{
		var widthSlider = this._createArrowSizeSlider(doc, parentElem, Kekule.$L('ChemWidgetTexts.CAPTION_WIDTH') + ':');
		var lengthSlider = this._createArrowSizeSlider(doc, parentElem, Kekule.$L('ChemWidgetTexts.CAPTION_LENGTH') + ':');
		this._arrowWidthInputter = widthSlider;
		this._arrowLengthInputter = lengthSlider;
		this._updateWidthInputter(widthSlider);
		this._updateLengthInputter(lengthSlider);
		return [widthSlider, lengthSlider];
	},
	/** @private */
	_createArrowSizeSlider: function(doc, parentElem, caption)
	{
		var elem = doc.createElement('div');
		elem.className = CCNS.GLYPH_Path_ARROW_SIZE_SETTER;
		var labelElem = doc.createElement('label');
		Kekule.DomUtils.setElementText(labelElem, caption);
		var slider = new Kekule.Widget.NumInput(this);
		slider.appendToElem(labelElem);
		elem.appendChild(labelElem);
		parentElem.appendChild(elem);
		return slider;
	},

	/** @private */
	_updateStyleButtons: function(btns)
	{
		var arrowTypes = this.getAllowedArrowTypes();
		var arrowSides = this.getAllowedArrowSides();
		if (!btns)
			btns = this._arrowStyleButtons;
		if (btns)
		{
			for (var i = 0, l = btns.length; i < l; ++i)
			{
				var data = btns[i][this.DATA_FIELD];
				var hidden = (arrowTypes && arrowTypes.indexOf(data.arrowType) < 0) || (arrowSides && arrowSides.indexOf(data.arrowSide) < 0);
				btns[i].setDisplayed(!hidden);
			}
		}
	},
	/** @private */
	_updateSizeInputter: function(inputter, value, minValue, maxValue, step)
	{
		var notUnset = OU.notUnset;
		if (notUnset(minValue))
			inputter.setMinValue(minValue);
		if (notUnset(maxValue))
			inputter.setMaxValue(maxValue);
		if (notUnset(step))
			inputter.setStep(step);
		if (notUnset(value))
			inputter.setValue(value);
	},
	/** @private */
	_updateWidthInputter: function(inputter)
	{
		if (!inputter)
			inputter = this._arrowWidthInputter;
		this._updateSizeInputter(inputter, this.getValue().arrowWidth, this.getArrowWidthMin(), this.getArrowWidthMax(), this.getArrowWidthStep());
	},
	/** @private */
	_updateLengthInputter: function(inputter)
	{
		if (!inputter)
			inputter = this._arrowLengthInputter;
		this._updateSizeInputter(inputter, this.getValue().arrowLength, this.getArrowLengthMin(), this.getArrowLengthMax(), this.getArrowLengthStep());
	},

	/** @private */
	getDefaultAllowedArrowTypes: function()
	{
		var AT = Kekule.Glyph.ArrowType;
		return [AT.NONE, AT.OPEN, AT.TRIANGLE];
	},

	/** @private */
	notifyValueChange: function(newValue)
	{
		this.notifyPropSet('value', newValue);
		this.invokeEvent('valueChange', {'value': newValue});
	},
	/** @private */
	notifyValueInput: function(newValue)
	{
		this.notifyPropSet('value', newValue);
		this.invokeEvent('valueInput', {'value': newValue});
	},

	/** @private */
	reactArrowStyleButtonCheck: function(e)
	{
		if (this._isSettingValue)  // input value by program, do not evoke event
			return;
		var w = e.widget;
		if (w && w[this.DATA_FIELD])
		{
			var v = this.getValue();
			v.arrowType = w[this.DATA_FIELD].arrowType;
			v.arrowSide = w[this.DATA_FIELD].arrowSide;
			this.notifyValueChange(v);
			e.stopPropagation();
		}
	},
	/** @private */
	reactArrowSizeInputterChange: function(e)
	{
		if (this._isSettingValue)  // input value by program, do not evoke event
			return;
		var w = e.widget;
		if (w === this._arrowWidthInputter || w === this._arrowLengthInputter)
		{
			var size = w.getValue() && w.getValue();
			if (OU.notUnset(size))
			{
				var v = this.getValue();
				if (w === this._arrowWidthInputter)
					v.arrowWidth = size;
				else if (w === this._arrowLengthInputter)
					v.arrowLength = size;
				this.notifyValueChange(v);
				e.stopPropagation();
			}
		}
	},
	/** @private */
	reactArrowSizeInputterInput: function(e)
	{
		if (this._isSettingValue)  // input value by program, do not evoke event
			return;
		var w = e.widget;
		if (w === this._arrowWidthInputter || w === this._arrowLengthInputter)
		{
			var size = w.getValue() && w.getValue();
			if (OU.notUnset(size))
			{
				var v = this.getValue();
				if (w === this._arrowWidthInputter)
					v.arrowWidth = size;
				else if (w === this._arrowLengthInputter)
					v.arrowLength = size;
				this.notifyValueInput(v);
				e.stopPropagation();
			}
		}
	}
});

/**
 * An widget to select a reaction arrow preset.
 * @class
 * @augments Kekule.Widget.Container
 *
 * @property {String} value Selected reaction arrow type.
 * @property {Array} allowedReactionArrowTypes
 */
Kekule.ChemWidget.GlyphReactionArrowPresetSelector = Class.create(Kekule.Widget.Container,
/** @lends Kekule.ChemWidget.GlyphReactionArrowPresetSelector# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.GlyphReactionArrowPresetSelector',
	/** @private */
	DATA_FIELD: '__$data$__',
	/** @construct */
	initialize: function($super, parentOrElementOrDocument)
	{
		this._isSettingValue = false;
		this._buttonSet = null;

		$super(parentOrElementOrDocument);

		//this.addEventListener('check', this.reactArrowStyleButtonCheck.bind(this));
	},
	/** @private */
	initProperties: function() {
		this.defineProp('value', {
			'dataType': DataType.STRING,
			'getter': function()
			{
				return this.getPropStoreFieldValue('value') || '';
			},
			'setter': function(value)
			{
				this._isSettingValue = true;
				try
				{
					this.setPropStoreFieldValue('value', value);
					var buttons = this._buttonSet.getButtonSet().getChildWidgets();
					// arrow style
					for (var i = 0, l = buttons.length; i < l; ++i)
					{
						var btn = buttons[i];
						var data = btn[this.DATA_FIELD];
						if (data.reactionArrowType === value)
							btn.setChecked(true);
						else
							btn.setChecked(false);
					}
				}
				finally
				{
					this._isSettingValue = false;
				}
			}
		});
		this.defineProp('allowedReactionArrowTypes', {'dataType': DataType.ARRAY});
	},

	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CCNS.GLYPH_REACTION_ARROW_PRESET_SELECTOR;
	},
	/** @ignore */
	doCreateSubElements: function($super, doc, rootElem)
	{
		var result = $super(doc, rootElem);
		var buttonSet = this.doCreateButtonSet(doc, rootElem);
		return result.concat([buttonSet.getElement()]);
	},
	/** @private */
	doCreateButtonSet: function(doc, rootElem)
	{
		var result = new Kekule.Widget.CompactButtonSet(this);
		result.addClassName(CCNS.GLYPH_REACTION_ARROW_PRESET_SELECTOR_BTNSET);
		result.getButtonSet().addClassName(CCNS.GLYPH_REACTION_ARROW_PRESET_SELECTOR_BTNSET_DROPDOWN);
		var arrowTypes = this.getAllowedReactionArrowTypes() || this.getDefaultAllowedReactionTypes();
		for (var i = 0, l = arrowTypes.length; i < l; ++i)
		{
			var btn = new Kekule.Widget.RadioButton(result);
			var details = this._getPresetButtonDetails(arrowTypes[i]);
			btn.addClassName(details.className, true).setText(details.caption).setHint(details.hint).setShowText(true).setShowGlyph(true);
			btn[this.DATA_FIELD] = {'reactionArrowType': arrowTypes[i]};
			result.append(btn);
		}
		var self = this;
		result.addEventListener('select', function(e){
			if (!self._isSettingValue && e.target === result)
			{
				var btn = e.selected;
				//console.log('select', btn[self.DATA_FIELD]);
				if (btn && btn[self.DATA_FIELD])
				{
					var value = btn[self.DATA_FIELD].reactionArrowType;
					self.setPropStoreFieldValue('value', value);
					self.notifyValueChange(value);
				}
			}
		});
		result.appendToElem(rootElem);
		this._buttonSet = result;

		return result;
	},
	/** @private */
	_getPresetButtonDetails: function(reactionArrowType)
	{
		var RAT = Kekule.Glyph.ReactionArrowType;
		var typeName = reactionArrowType? reactionArrowType.toUpperCase(): 'UNSET';
		var className = reactionArrowType? reactionArrowType.upperFirst(): 'Unset';
		var baseName = 'REACTION_ARROW_' + typeName;
		return {
			'caption': Kekule.$L('ChemWidgetTexts.' + 'CAPTION_' + baseName),
			'hint': Kekule.$L('ChemWidgetTexts.' + 'HINT_' + baseName),
			'className': CCNS.GLYPH_REACTION_ARROW_PRESET_SELECTOR_BUTTON + ' ' + CCNS.GLYPH_REACTION_ARROW_PRESET_SELECTOR_BUTTON + '-' + className
		}
	},

	/** @private */
	notifyValueChange: function(newValue)
	{
		this.notifyPropSet('value', newValue);
		this.invokeEvent('valueChange', {'value': newValue});
	},

	/** @private */
	getDefaultAllowedReactionTypes: function()
	{
		var RAT = Kekule.Glyph.ReactionArrowType;
		return [null, RAT.NORMAL, RAT.REVERSIBLE, RAT.RESONANCE, RAT.RETROSYNTHESIS, RAT.CUSTOM];  // null means unset
	}
});

/**
 * An widget to select a electron pushing arrow preset.
 * @class
 * @augments Kekule.Widget.Container
 *
 * @property {Int} value Selected preset electron count.
 */
Kekule.ChemWidget.GlyphElectronPushingArrowPresetSelector = Class.create(Kekule.Widget.Container,
/** @lends Kekule.ChemWidget.GlyphElectronPushingArrowPresetSelector# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.GlyphElectronPushingArrowPresetSelector',
	/** @private */
	DATA_FIELD: '__$data$__',
	/** @construct */
	initialize: function($super, parentOrElementOrDocument)
	{
		this._isSettingValue = false;
		this._buttonGroup = null;

		$super(parentOrElementOrDocument);
	},
	/** @private */
	initProperties: function() {
		this.defineProp('value', {
			'dataType': DataType.INT,
			'getter': function()
			{
				return this.getPropStoreFieldValue('value') || '';
			},
			'setter': function(value)
			{
				this._isSettingValue = true;
				try
				{
					this.setPropStoreFieldValue('value', value);
					var buttons = this._buttonGroup.getChildWidgets();
					for (var i = 0, l = buttons.length; i < l; ++i)
					{
						var btn = buttons[i];
						var data = btn[this.DATA_FIELD];
						if (data.electronCount === value)
							btn.setChecked(true);
						else
							btn.setChecked(false);
					}
				}
				finally
				{
					this._isSettingValue = false;
				}
			}
		});
		this.defineProp('allowedReactionArrowTypes', {'dataType': DataType.ARRAY});
	},

	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CCNS.GLYPH_ELECTRON_PUSHING_ARROW_PRESET_SELECTOR;
	},
	/** @ignore */
	doCreateSubElements: function($super, doc, rootElem)
	{
		var result = $super(doc, rootElem);
		var buttonGroup = this.doCreateButtonGroup(doc, rootElem);
		return result.concat([buttonGroup.getElement()]);
	},
	/** @private */
	doCreateButtonGroup: function(doc, rootElem)
	{
		var result = new Kekule.Widget.ButtonGroup(this);
		result.addClassName(CCNS.GLYPH_ELECTRON_PUSHING_ARROW_PRESET_SELECTOR_BTNGROUP);
		var electronCounts = [2, 1];
		for (var i = 0, l = electronCounts.length; i < l; ++i)
		{
			var eCount = electronCounts[i];
			var btn = new Kekule.Widget.RadioButton(result);
			var details = this._getPresetButtonDetails(eCount);
			btn.addClassName(details.className, true).setText(details.caption).setHint(details.hint).setShowText(true).setShowGlyph(true);
			btn[this.DATA_FIELD] = {'electronCount': eCount};
			result.appendWidget(btn);
		}
		var self = this;
		result.addEventListener('check', function(e){
			if (!self._isSettingValue)
			{
				var btn = e.widget;
				//console.log('select', btn[self.DATA_FIELD]);
				if (btn && btn[self.DATA_FIELD])
				{
					var value = btn[self.DATA_FIELD].electronCount;
					self.setPropStoreFieldValue('value', value);
					self.notifyValueChange(value);
				}
			}
		});
		result.appendToElem(rootElem);
		this._buttonGroup = result;

		return result;
	},
	/** @private */
	_getPresetButtonDetails: function(electronCount)
	{
		var className = electronCount.toString();
		var baseName = 'ELECTRON_PUSHING_ARROW_' + electronCount;
		return {
			'caption': Kekule.$L('ChemWidgetTexts.' + 'CAPTION_' + baseName + '_ABBR'),
			'hint': Kekule.$L('ChemWidgetTexts.' + 'HINT_' + baseName),
			'className': CCNS.GLYPH_ELECTRON_PUSHING_ARROW_PRESET_SELECTOR_BUTTON + ' ' + CCNS.GLYPH_ELECTRON_PUSHING_ARROW_PRESET_SELECTOR_BUTTON + '-' + className
		}
	},

	/** @private */
	notifyValueChange: function(newValue)
	{
		this.notifyPropSet('value', newValue);
		this.invokeEvent('valueChange', {'value': newValue});
	}
});


/**
 * An panel to set the properties of a path glyph line.
 * @class
 * @augments Kekule.Widget.Panel
 *
 * @property {Hash} value Line params, including fields: {lineCount, lineGap}.
 */
/**
 * Invoked when the new line params has been set.
 *   event param of it has field: {value}
 * @name Kekule.ChemWidget.GlyphPathLineSettingPanel#valueChange
 * @event
 */
Kekule.ChemWidget.GlyphPathLineSettingPanel = Class.create(Kekule.Widget.Panel,
/** @lends Kekule.ChemWidget.GlyphPathLineSettingPanel# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.GlyphPathLineSettingPanel',
	/** @construct */
	initialize: function($super, parentOrElementOrDocument)
	{
		this._isSettingValue = false;
		this.setPropStoreFieldValue('lineCountMin', 1);
		this.setPropStoreFieldValue('lineCountMax', 5);
		this.setPropStoreFieldValue('lineCountStep', 1);
		this.setPropStoreFieldValue('lineGapMin', 0);
		this.setPropStoreFieldValue('lineGapMax', 0.8);
		this.setPropStoreFieldValue('lineGapStep', 0.1);

		$super(parentOrElementOrDocument);

		this.addEventListener('valueChange', this.reactInputWidgetChange.bind(this));
	},
	/** @private */
	initProperties: function() {
		this.defineProp('value', {
			'dataType': DataType.HASH,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('value');
				if (!result)
				{
					result = {};
					this.setPropStoreFieldValue('value', result);
				}
				return result;
			},
			'setter': function(value)
			{
				this._isSettingValue = true;
				try
				{
					this.setPropStoreFieldValue('value', value);
					if (OU.notUnset(value.lineCount))
					{
						this._lineCountInput.setValue(value.lineCount);
					}
					if (OU.notUnset(value.lineGap))
					{
						this._lineGapInput.setValue(value.lineGap);
					}
				}
				finally
				{
					this._isSettingValue = false;
				}
			}
		});
		this.defineProp('lineCountMin', {'dataType': DataType.NUMBER});
		this.defineProp('lineCountMax', {'dataType': DataType.NUMBER});
		this.defineProp('lineCountStep', {'dataType': DataType.NUMBER});
		this.defineProp('lineGapMin', {'dataType': DataType.NUMBER});
		this.defineProp('lineGapMax', {'dataType': DataType.NUMBER});
		this.defineProp('lineGapStep', {'dataType': DataType.NUMBER});
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CCNS.GLYPH_PATH_LINE_SETTING_PANEL;
	},
	/** @ignore */
	doCreateSubElements: function($super, doc, rootElem)
	{
		var result = $super(doc, rootElem);
		// line count
		var sec1 = this.doCreateNumInputSection(doc, rootElem, Kekule.$L('ChemWidgetTexts.CAPTION_LINE_COUNT') + ':');
		this._lineCountInput = sec1.widget;
		this._updateLineCountInput();
		// line gap
		var sec2 = this.doCreateNumInputSection(doc, rootElem, Kekule.$L('ChemWidgetTexts.CAPTION_LINE_GAP') + ':');
		this._lineGapInput = sec2.widget;
		this._updateLineGapInput();

		return result.concat([sec1, sec2]);
	},
	/** @private */
	doCreateNumInputSection: function(doc, parentElem, caption)
	{
		var elem = doc.createElement('span');
		var labelElem = doc.createElement('label');
		Kekule.DomUtils.setElementText(labelElem, caption);
		var input = new Kekule.Widget.NumInput(this, null, null, null, 'number');
		input.appendToElem(labelElem);
		elem.appendChild(labelElem);
		parentElem.appendChild(elem);
		return {'elem': elem, 'widget': input};
	},
	/** @private */
	_updateInputWidget: function(input, value, minValue, maxValue, step)
	{
		var notUnset = OU.notUnset;
		if (input)
		{
			//if (notUnset(value))
			input.setValue(value);
			if (notUnset(minValue))
				input.setMinValue(minValue);
			if (notUnset(maxValue))
				input.setMaxValue(maxValue);
			if (notUnset(step))
				input.setStep(step);
		}
	},
	/** @private */
	_updateLineCountInput: function()
	{
		this._updateInputWidget(this._lineCountInput, this.getValue().lineCount, this.getLineCountMin(), this.getLineCountMax(), this.getLineCountStep());
	},
	_updateLineGapInput: function()
	{
		this._updateInputWidget(this._lineGapInput, this.getValue().lineGap, this.getLineGapMin(), this.getLineGapMax(), this.getLineGapStep());
	},
	/** @private */
	/** @private */
	notifyValueChange: function(newValue)
	{
		this.notifyPropSet('value', newValue);
		this.invokeEvent('valueChange', {'value': newValue});
	},
	/** @private */
	reactInputWidgetChange: function(e)
	{
		if (this._isSettingValue)  // input value by program, do not evoke event
			return;
		var w = e.widget;
		if (w === this._lineCountInput || w === this._lineGapInput)
		{
			var number = w.getValue() && w.getValue();
			if (OU.notUnset(number))
			{
				var v = this.getValue();
				if (w === this._lineCountInput)
					v.lineCount = number;
				else if (w === this._lineGapInput)
					v.lineGap = number;
				this.notifyValueChange(v);
				e.stopPropagation();
			}
		}
	}
});

/**
 * An panel to set the properties of a path glyph.
 * @class
 * @augments Kekule.Widget.Panel
 *
 * @property {Hash} value Path params, including fields {start/endArrowType, start/endArrowSide, start/endArrowWidth, start/endArrowLength, lineCount, lineGap}.
 * @property {Array} components Visible components in panel. The default value is ['startingArrow', 'endingArrow', 'line'].
 */
/**
 * Invoked when the params has been set.
 *   event param of it has field: {value}
 * @name Kekule.ChemWidget.GlyphPathSettingPanel#valueChange
 * @event
 */
/**
 * Invoked when the new params are setting in the widget.
 *   event param of it has field: {value}
 * @name Kekule.ChemWidget.GlyphPathSettingPanel#valueInput
 * @event
 */
Kekule.ChemWidget.GlyphPathSettingPanel = Class.create(Kekule.Widget.Panel,
/** @lends Kekule.ChemWidget.GlyphPathSettingPanel# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.GlyphPathSettingPanel',
	/** @private */
	DEF_COMPONENTS: ['startingArrow', 'endingArrow', 'line'],
	/** @construct */
	initialize: function($super, parentOrElementOrDocument)
	{
		$super(parentOrElementOrDocument);
		this.addEventListener('valueChange', this.reactChildSetterValueChange.bind(this));
		this.addEventListener('valueInput', this.reactChildSetterValueInput.bind(this));
	},
	/** @private */
	initProperties: function() {
		this.defineProp('value', {
			'dataType': DataType.HASH,
			'getter': function()
			{
				var result = {};
				if (this._startingArrowSetter)
					result = Object.extend(result, this._addPropPrefix(this._startingArrowSetter.getValue(), 'start'));
				if (this._endingArrowSetter)
					result = Object.extend(result, this._addPropPrefix(this._endingArrowSetter.getValue(), 'end'));
				if (this._lineSetter)
					result = Object.extend(result, this._lineSetter.getValue());
				return result;
			},
			'setter': function(value) {
				if (value)
				{
					var splitted = this._splitChildSetterValues(value);
					if (this._startingArrowSetter)
						this._startingArrowSetter.setValue(splitted.startingArrow);
					if (this._endingArrowSetter)
						this._endingArrowSetter.setValue(splitted.endingArrow);
					if (this._lineSetter)
						this._lineSetter.setValue(splitted.line);
				}
			}
		});
		this.defineProp('components', {'dataType': DataType.ARRAY});
	},
	/** @ignore */
	doObjectChange: function($super, modifiedPropNames)
	{
		if (modifiedPropNames.indexOf('components') >= 0)
			this.updateComponents();
		return $super(modifiedPropNames);
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CCNS.GLYPH_PATH_SETTING_PANEL;
	},
	/** @ignore */
	doCreateSubElements: function($super, doc, rootElem)
	{
		var result = $super(doc, rootElem);
		var secArrow1 = this.doCreateArrowSettingSection(doc, rootElem, Kekule.$L('ChemWidgetTexts.CAPTION_STARTING_ARROW'));
		this._startingArrowSetter = secArrow1.widget;
		this._startingArrowElem = secArrow1.elem;
		var secArrow2 = this.doCreateArrowSettingSection(doc, rootElem, Kekule.$L('ChemWidgetTexts.CAPTION_ENDING_ARROW'));
		this._endingArrowSetter = secArrow2.widget;
		this._endingArrowElem = secArrow2.elem;
		var secLine = this.doCreateLineSettingSection(doc, rootElem, Kekule.$L('ChemWidgetTexts.CAPTION_LINE'));
		this._lineSetter = secLine.widget;
		this._lineElem = secLine.elem;
		result = result.concat([secArrow1.elem, secArrow2.elem, secLine.elem]);
		this.updateComponents();
		return result;
	},
	/** @private */
	doCreateSectionElem: function(doc, parentElem, caption, className)
	{
		var elem = doc.createElement('div');
		var titleElem = doc.createElement('label');
		Kekule.DomUtils.setElementText(titleElem, caption);
		titleElem.className = CCNS.GLYPH_PATH_SETTING_PANEL_SECTION_TITLE;
		elem.appendChild(titleElem);
		var cname = CCNS.GLYPH_PATH_SETTING_PANEL_SECTION;
		if (className)
			cname += ' ' + className;
		elem.className = cname;
		parentElem.appendChild(elem);
		return elem;
	},
	/** @private */
	doCreateArrowSettingSection: function(doc, parentElem, caption)
	{
		var elem = this.doCreateSectionElem(doc, parentElem, caption);
		var panel = new Kekule.ChemWidget.GlyphPathArrowSettingPanel(this);
		panel.addClassName(CCNS.GLYPH_PATH_SETTING_PANEL_SECTION_PANEL);
		panel.appendToElem(elem);
		return {'elem': elem, 'widget': panel};
	},
	/** @private */
	doCreateLineSettingSection: function(doc, parentElem, caption)
	{
		var elem = this.doCreateSectionElem(doc, parentElem, caption);
		var panel = new Kekule.ChemWidget.GlyphPathLineSettingPanel(this);
		panel.addClassName(CCNS.GLYPH_PATH_SETTING_PANEL_SECTION_PANEL);
		panel.appendToElem(elem);
		return {'elem': elem, 'widget': panel};
	},

	/** @private */
	updateComponents: function()
	{
		var components = this.getComponents() || this.DEF_COMPONENTS;
		var SU = Kekule.StyleUtils;
		SU.setDisplay(this._startingArrowElem, components.indexOf('startingArrow') >= 0);
		SU.setDisplay(this._endingArrowElem, components.indexOf('endingArrow') >= 0);
		SU.setDisplay(this._lineElem, components.indexOf('line') >= 0);
	},

	/** @private */
	reactChildSetterValueChange: function(e)
	{
		var w = e.widget;
		if (w && this.getChildValueSetterWidgets().indexOf(w) >= 0)
		{
			var newValue = this.getValue();
			e.stopPropagation();
			this.notifyPropSet('value', newValue);
			//console.log('value change', newValue);
			this.invokeEvent('valueChange', {'value': newValue});
			//console.log('value change end');
		}
	},
	/** @private */
	reactChildSetterValueInput: function(e)
	{
		var w = e.widget;
		if (w && this.getChildValueSetterWidgets().indexOf(w) >= 0)
		{
			var newValue = this.getValue();
			e.stopPropagation();
			this.notifyPropSet('value', newValue);
			//console.log('value change', newValue);
			this.invokeEvent('valueInput', {'value': newValue});
			//console.log('value change end');
		}
	},
	/** @private */
	getChildValueSetterWidgets: function(widget)
	{
		return [this._startingArrowSetter, this._endingArrowSetter, this._lineSetter];
	},
	/** @private */
	_addPropPrefix: function(hash, propPrefix)
	{
		var result = {};
		var propNames = OU.getOwnedFieldNames(hash, false);
		for (var i = 0, l = propNames.length; i < l; ++i)
		{
			var value = hash[propNames[i]];
			result[propPrefix + propNames[i].capitalizeFirst()] = value;
		}
		return result;
	},
	/** @private */
	_splitChildSetterValues: function(totalValue)
	{
		var result = {
			'startingArrow': {},
			'endingArrow': {},
			'line': {}
		};
		var propNames = OU.getOwnedFieldNames(totalValue);
		for (var i = 0, l = propNames.length; i < l; ++i)
		{
			var propName = propNames[i];
			var value = totalValue[propName];
			var convPropName;
			if (propName.startsWith('startArrow'))
			{
				convPropName = 'arrow' + propName.substr(10);
				result.startingArrow[convPropName] = value;
			}
			else if (propName.startsWith('endArrow'))
			{
				convPropName = 'arrow' + propName.substr(8);
				result.endingArrow[convPropName] = value;
			}
			else
				result.line[propName] = value;
		}
		return result;
	}
});

/**
 * An panel to set the properties of a reaction arrow glyph.
 * @class
 * @augments Kekule.ChemWidget.GlyphPathSettingPanel
 *
 * @property {Hash} value Path params, including fields {start/endArrowType, start/endArrowSide, start/endArrowWidth, start/endArrowLength, lineCount, lineGap}.
 * @property {Array} components Visible components in panel. The default value is ['startingArrow', 'endingArrow', 'line'].
 */
/**
 * Invoked when the params has been set.
 *   event param of it has field: {value}
 * @name Kekule.ChemWidget.GlyphReactionArrowPathSettingPanel#valueChange
 * @event
 */
Kekule.ChemWidget.GlyphReactionArrowPathSettingPanel = Class.create(Kekule.ChemWidget.GlyphPathSettingPanel,
/** @lends Kekule.ChemWidget.GlyphReactionArrowPathSettingPanel# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.GlyphReactionArrowPathSettingPanel',
	/** @ignore */
	doGetValue: function($super)
	{
		var result = $super() || {};
		if (this._reactionArrowPresetSelector)
		{
			result.reactionArrowType = this._reactionArrowPresetSelector.getValue();
		}
		return result;
	},
	/** @ignore */
	doSetValue: function($super, value)
	{
		$super(value);
		if (this._reactionArrowPresetSelector)
		{
			this._reactionArrowPresetSelector.setValue(value.reactionArrowType);
			this._updateArrowSettingPanelEnableState();
		}
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CCNS.GLYPH_REACTION_ARROW_PATH_SETTING_PANEL;
	},
	/** @ignore */
	doCreateSubElements: function($super, doc, rootElem)
	{
		var secReactionArrowPreset = this.doCreateReactionArrowPresetSection(doc, rootElem, Kekule.$L('ChemWidgetTexts.CAPTION_REACTION_ARROW_TYPE'));
		this._reactionArrowPresetSelector = secReactionArrowPreset.widget;
		this._reactionArrowPresetElem = secReactionArrowPreset.elem;
		var result = $super(doc, rootElem);
		this.updateComponents();
		return result;
	},
	/** @private */
	doCreateReactionArrowPresetSection: function(doc, parentElem, caption)
	{
		var elem = this.doCreateSectionElem(doc, parentElem, caption, CCNS.GLYPH_REACTION_ARROW_PATH_SETTING_PANEL_ARROW_PRESET_SECTION);
		var widget = new Kekule.ChemWidget.GlyphReactionArrowPresetSelector(this);
		widget.appendToElem(elem);
		return {'elem': elem, 'widget': widget};
	},
	/** @private */
	updateComponents: function($super)
	{
		$super();
		this._updateArrowSettingPanelEnableState();
	},
	/** @private */
	_updateArrowSettingPanelEnableState: function()
	{
		var RAT = Kekule.Glyph.ReactionArrowType;
		var newArrowType = this._reactionArrowPresetSelector.getValue();

		// enable or disable child widgets according to newArrowType
		var allowedStartArrowTypes = null;
		var allowedEndArrowTypes = null;

		var arrowParams = RAT.getDefPathParamOfArrowType(newArrowType);
		if (arrowParams)
		{
			var startingArrowType = arrowParams.startArrowType;
			var endingArrowType = arrowParams.endArrowType;
			var needStartArrow = arrowParams.hasOwnProperty('startArrowType') && arrowParams.startArrowType;
			var needEndArrow = arrowParams.hasOwnProperty('endArrowType') && arrowParams.endArrowType;
			if (needStartArrow)
			{
				allowedStartArrowTypes = this._startingArrowSetter.getDefaultAllowedArrowTypes();
				allowedStartArrowTypes = AU.exclude(allowedStartArrowTypes, [Kekule.Glyph.ArrowType.NONE]);
			}
			if (needEndArrow)
			{
				var allowedEndArrowTypes = this._endingArrowSetter.getDefaultAllowedArrowTypes();
				allowedEndArrowTypes = AU.exclude(allowedEndArrowTypes, [Kekule.Glyph.ArrowType.NONE]);
			}

			this._startingArrowSetter.setEnabled(needStartArrow);
			this._endingArrowSetter.setEnabled(needEndArrow);
		}
		else  // no limit
		{
			this._startingArrowSetter.setEnabled(true);
			this._endingArrowSetter.setEnabled(true);
		}
		this._startingArrowSetter.setAllowedArrowTypes(allowedStartArrowTypes);
		this._endingArrowSetter.setAllowedArrowTypes(allowedEndArrowTypes);
	},
	/** @private */
	_updatePathParamsByReactionArrowPreset: function(reactionArrowType)
	{
		var AT = Kekule.Glyph.ArrowType;
		var params = Kekule.Glyph.ReactionArrowType.getDefPathParamOfArrowType(reactionArrowType);
		//console.log(reactionArrowType, params);
		if (!params && !reactionArrowType)  // reaction type NONE
		{
			params = {
				'startArrowType': AT.NONE,
				'endArrowType': AT.NONE
			};
		}
		if (params)
		{
			//var pathSetterValues = this.getValue();
			var startArrowParams = {}, endArrowParams = {}, lineParams = {};
			if (params.startArrowType !== undefined)
				startArrowParams.arrowType = params.startArrowType;
			if (params.startArrowSide !== undefined)
				startArrowParams.arrowSide = params.startArrowSide;
			if (params.endArrowType !== undefined)
				endArrowParams.arrowType = params.endArrowType;
			if (params.endArrowSide !== undefined)
				endArrowParams.arrowSide = params.endArrowSide;
			if (params.lineCount)
				lineParams.lineCount = params.lineCount;
			if (params.lineGap)
				lineParams.lineGap = params.lineGap;
			if (OU.getOwnedFieldNames(startArrowParams).length)
			{
				this._startingArrowSetter.setValue(Object.extend(this._startingArrowSetter.getValue(), startArrowParams));
				//console.log('start', startArrowParams, this._startingArrowSetter.getValue());
			}
			if (OU.getOwnedFieldNames(endArrowParams).length)
			{
				this._endingArrowSetter.setValue(Object.extend(this._endingArrowSetter.getValue(), endArrowParams));
				//console.log('end', endArrowParams, this._endingArrowSetter.getValue());
			}
			if (OU.getOwnedFieldNames(lineParams).length)
				this._lineSetter.setValue(Object.extend(this._lineSetter.getValue(), lineParams));
		}
	},
	/** @ignore */
	getChildValueSetterWidgets: function($super)
	{
		var result = $super();
		result.push(this._reactionArrowPresetSelector);
		return result;
	},
	/** @ignore */
	reactChildSetterValueChange: function($super, e)
	{
		var w = e.widget;
		if (w === this._reactionArrowPresetSelector)
		{
			this._updateArrowSettingPanelEnableState();
			// update path setting panel
			this._updatePathParamsByReactionArrowPreset(e.value);
		}
		$super(e);
	}
});

/**
 * An panel to set the properties of a arc glyph.
 * @class
 * @augments Kekule.ChemWidget.GlyphPathSettingPanel
 */
Kekule.ChemWidget.GlyphArcPathSettingPanel = Class.create(Kekule.ChemWidget.GlyphPathSettingPanel,
/** @lends Kekule.ChemWidget.GlyphArcPathSettingPanel# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.GlyphArcPathSettingPanel',
	/** @private */
	DEF_COMPONENTS: ['startingArrow', 'endingArrow'],
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CCNS.GLYPH_ARC_PATH_SETTING_PANEL;
	}
});

/**
 * An panel to set the properties of an electron pushing arrow glyph.
 * @class
 * @augments Kekule.ChemWidget.GlyphPathSettingPanel
 */
Kekule.ChemWidget.GlyphElectronPushingArrowSettingPanel = Class.create(Kekule.ChemWidget.GlyphPathSettingPanel,
/** @lends Kekule.ChemWidget.GlyphElectronPushingArrowSettingPanel# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.GlyphElectronPushingArrowSettingPanel',
	/** @private */
	DEF_COMPONENTS: ['endingArrow'],
	/** @construct */
	initialize: function($super, parentOrElementOrDocument)
	{
		$super(parentOrElementOrDocument);
		var AT = Kekule.Glyph.ArrowType;
		this._endingArrowSetter.setAllowedArrowTypes([AT.OPEN, AT.TRIANGLE]);
	},
	/** @ignore */
	doGetValue: function($super)
	{
		var result = $super() || {};
		if (this._arrowPresetSelector)
		{
			result.electronCount = this._arrowPresetSelector.getValue();
		}
		return result;
	},
	/** @ignore */
	doSetValue: function($super, value)
	{
		$super(value);
		if (this._arrowPresetSelector)
		{
			this._arrowPresetSelector.setValue(value.electronCount);
			this._updateArrowSettingPanel();
		}
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CCNS.GLYPH_ELECTRON_PUSHING_ARROW_SETTING_PANEL;
	},
	/** @ignore */
	doCreateSubElements: function($super, doc, rootElem)
	{
		var secArrowPreset = this.doCreateArrowPresetSection(doc, rootElem, Kekule.$L('ChemWidgetTexts.CAPTION_ELECTRON_PUSHING_ARROW_TYPE'));
		this._arrowPresetSelector = secArrowPreset.widget;
		this._arrowPresetElem = secArrowPreset.elem;
		var result = $super(doc, rootElem);
		//this.updateComponents();
		return result;
	},
	/** @private */
	doCreateArrowPresetSection: function(doc, parentElem, caption)
	{
		var elem = this.doCreateSectionElem(doc, parentElem, caption);
		var widget = new Kekule.ChemWidget.GlyphElectronPushingArrowPresetSelector(this);

		widget.appendToElem(elem);
		return {'elem': elem, 'widget': widget};
	},
	/** @ignore */
	getChildValueSetterWidgets: function($super)
	{
		var result = $super();
		result.push(this._arrowPresetSelector);
		return result;
	},
	/** @ignore */
	reactChildSetterValueChange: function($super, e)
	{
		var w = e.widget;
		if (w === this._arrowPresetSelector)
		{
			this._updateArrowSettingPanel();
		}
		$super(e);
	},
	/** @private */
	_updateArrowSettingPanel: function()
	{
		var ASide = Kekule.Glyph.ArrowSide;
		var setter = this._endingArrowSetter;
		var eCount = this._arrowPresetSelector.getValue();
		var sides = [];
		if (eCount >= 2)
			sides = [ASide.BOTH];
		else if (eCount === 1)
			sides = [ASide.SINGLE, ASide.REVERSED];
		else
			sides = [ASide.BOTH, ASide.SINGLE, ASide.REVERSED];
		setter.setAllowedArrowSides(sides);
	}
});

})();