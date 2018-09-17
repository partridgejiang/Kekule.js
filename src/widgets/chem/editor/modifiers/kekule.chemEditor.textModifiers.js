/**
 * @fileoverview
 * Object modifier to change format of text, atom label, etc. in chem editor.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /widgets/kekule.widget.base.js
 * requires /widgets/commonCtrls/kekule.widget.buttons.js
 * requires /widgets/chem/editor/kekule.chemEditor.baseEditor.js
 * requires /widgets/chem/editor/kekule.chemEditor.objModifiers.js
 * requires /widgets/chem/editor/modifiers/kekule.chemEditor.styleModifiers.js
 */

(function(){
"use strict";

var DU = Kekule.DomUtils;
var EU = Kekule.HtmlElementUtils;
var CNS = Kekule.Widget.HtmlClassNames;
var CCNS = Kekule.ChemWidget.HtmlClassNames;
var BNS = Kekule.ChemWidget.ComponentWidgetNames;

Kekule.ChemWidget.HtmlClassNames = Object.extend(Kekule.ChemWidget.HtmlClassNames, {
	COMPOSER_TEXTFORMAT_BUTTON: 'K-Chem-Composer-TextFormat-Button',

	COMPOSER_MODIFIER_RICHTEXT_PANEL: 'K-Chem-Composer-Modifier-RichText-Panel',
	COMPOSER_MODIFIER_RICHTEXT_PANEL_GROUP: 'K-Chem-Composer-Modifier-RichText-Panel-Group',
	COMPOSER_MODIFIER_RICHTEXT_PANEL_GROUP_LABELCELL: 'K-Chem-Composer-Modifier-RichText-Panel-Group-LabelCell',
	COMPOSER_MODIFIER_RICHTEXT_PANEL_GROUP_CTRLCELL: 'K-Chem-Composer-Modifier-RichText-Panel-Group-CtrlCell',
	COMPOSER_MODIFIER_RICHTEXT_PANEL_GROUP_LABEL: 'K-Chem-Composer-Modifier-RichText-Panel-Group-Label',
	COMPOSER_TEXTDIRECTION_BOX: 'K-Chem-Composer-TextDirection-Box',
	COMPOSER_TEXTALIGN_BOX: 'K-Chem-Composer-TextAlign-Box'
});

Kekule.globalOptions.add('chemWidget.composer.objModifier.richText', {
	componentNames:	[
		BNS.fontName,
		BNS.fontSize,
		BNS.textDirection,
		BNS.textAlign
	]
});


/**
 * A text format modifier to change the text font/alignment of some chem objects.
 * @class
 * @augments Kekule.Editor.ObjModifier.BaseRenderOptionModifier
 */
Kekule.Editor.ObjModifier.RichText = Class.create(Kekule.Editor.ObjModifier.BaseRenderOptionModifier,
/** @lends Kekule.Editor.ObjModifier.RichText# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ObjModifier.RichText',
	/** @construct */
	initialize: function($super, editor)
	{
		$super(editor);
		this._valueStorage = {};
	},
	/** @private */
	initProperties: function()
	{
		// private
		this.defineProp('fontPanel', {
			'dataType': 'Kekule.Widget.BaseWidget', 'serializable': false, 'setter': null
		});
		this.defineProp('fontNameBox', {
			'dataType': 'Kekule.Widget.BaseWidget', 'serializable': false, 'setter': null
		});
		this.defineProp('fontSizeBox', {
			'dataType': 'Kekule.Widget.BaseWidget', 'serializable': false, 'setter': null
		});
		this.defineProp('textDirectionBox', {
			'dataType': 'Kekule.Widget.BaseWidget', 'serializable': false, 'setter': null
		});
		this.defineProp('textHorizontalAlignBox', {
			'dataType': 'Kekule.Widget.BaseWidget', 'serializable': false, 'setter': null
		});
		this.defineProp('textVerticalAlignBox', {
			'dataType': 'Kekule.Widget.BaseWidget', 'serializable': false, 'setter': null
		});
	},
	/** @private */
	_createCtrlGroup: function(doc, parentElem, labelText, widget)
	{
		var result = doc.createElement('tr');
		result.className = CCNS.COMPOSER_MODIFIER_RICHTEXT_PANEL_GROUP;

		var cellElem = doc.createElement('td');
		cellElem.className = CCNS.COMPOSER_MODIFIER_RICHTEXT_PANEL_GROUP_LABELCELL;
		var labelElem = doc.createElement('label');
		labelElem.className = CCNS.COMPOSER_MODIFIER_RICHTEXT_PANEL_GROUPLABEL;
		DU.setElementText(labelElem, labelText);
		cellElem.appendChild(labelElem);
		result.appendChild(cellElem);

		var cellElem = doc.createElement('td');
		cellElem.className = CCNS.COMPOSER_MODIFIER_RICHTEXT_PANEL_GROUP_CTRLCELL;
		widget.appendToElem(cellElem);
		result.appendChild(cellElem);

		parentElem.appendChild(result);

		return result;
	},
	/** @private */
	_doCreateDropDownPanel: function()
	{
		var panel = new Kekule.Widget.Panel(this.getEditor());
		panel.addClassName(CCNS.COMPOSER_MODIFIER_RICHTEXT_PANEL)
				.setCaption(Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_FORMAT'));
		var compNames = Kekule.globalOptions.chemWidget.composer.objModifier.richText.componentNames;
		var comboBox, selBox;
		var doc = this.getEditor().getDocument();
		var rootElem = doc.createElement('table');
		panel.getContainerElement().appendChild(rootElem);

		if (compNames.indexOf(BNS.fontName) >= 0)
		{
			// font name
			var comboBox = new Kekule.Widget.ComboBox(panel);
			this.fillFontNameBox(comboBox);
			comboBox.addClassName(CCNS.COMPOSER_FONTNAME_BOX);
			comboBox.setHint(Kekule.$L('ChemWidgetTexts.HINT_FONTNAME'));
			comboBox.addEventListener('valueChange', function(e)
			{
				this.getEditor().modifyObjectsRenderOptions(this.getTargetObjs(), {'fontFamily': this.getFontNameBox().getValue()}, false, true);
			}, this);
			this.setPropStoreFieldValue('fontNameBox', comboBox);
			this._createCtrlGroup(doc, rootElem, Kekule.$L('ChemWidgetTexts.CAPTION_FONTNAME'), comboBox);
		}
		if (compNames.indexOf(BNS.fontSize) >= 0)
		{
			// font size
			comboBox = new Kekule.Widget.ComboBox(panel);
			this.fillFontSizeBox(comboBox);
			comboBox.addClassName(CCNS.COMPOSER_FONTSIZE_BOX);
			comboBox.setHint(Kekule.$L('ChemWidgetTexts.HINT_FONTSIZE'));
			comboBox.addEventListener('valueChange', function(e)
			{
				this.getEditor().modifyObjectsRenderOptions(this.getTargetObjs(), {'fontSize': this.getFontSizeBox().getValue()}, false, true);
			}, this);
			this.setPropStoreFieldValue('fontSizeBox', comboBox);
			this._createCtrlGroup(doc, rootElem, Kekule.$L('ChemWidgetTexts.CAPTION_FONTSIZE'), comboBox);
		}
		if (compNames.indexOf(BNS.textDirection) >= 0)
		{
			// text direction
			selBox = new Kekule.Widget.SelectBox(panel);
			var TD = Kekule.Render.TextDirection;
			var items = [
				{'value': TD.DEFAULT, 'text': Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_DIRECTION_DEFAULT')},
				{'value': TD.LTR, 'text': Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_DIRECTION_LTR')},
				{'value': TD.RTL, 'text': Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_DIRECTION_RTL')},
				{'value': TD.TTB, 'text': Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_DIRECTION_TTB')},
				{'value': TD.BTT, 'text': Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_DIRECTION_BTT')}
			];
			selBox.setItems(items);
			comboBox.addClassName(CCNS.COMPOSER_TEXTDIRECTION_BOX);
			selBox.setHint(Kekule.$L('ChemWidgetTexts.HINT_TEXT_DIRECTION'));
			selBox.addEventListener('valueChange', function(e)
			{
				this.getEditor().modifyObjectsRenderOptions(this.getTargetObjs(), {'charDirection': this.getTextDirectionBox().getValue()}, false, true);
			}, this);
			this.setPropStoreFieldValue('textDirectionBox', selBox);
			this._createCtrlGroup(doc, rootElem, Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_DIRECTION'), selBox);
		}
		if (compNames.indexOf(BNS.textAlign) >= 0)
		{
			// horizontal align
			selBox = new Kekule.Widget.SelectBox(panel);
			var TA = Kekule.Render.TextAlign;
			var items = [
				{'value': TA.DEFAULT, 'text': Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_ALIGN_DEFAULT')},
				{'value': TA.LEADING, 'text': Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_ALIGN_LEADING')},
				{'value': TA.TRAILING, 'text': Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_ALIGN_TRAILING')},
				{'value': TA.CENTER, 'text': Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_ALIGN_CENTER')},
				{'value': TA.LEFT, 'text': Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_ALIGN_LEFT')},
				{'value': TA.RIGHT, 'text': Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_ALIGN_RIGHT')}
			];
			selBox.setItems(items);
			comboBox.addClassName(CCNS.COMPOSER_TEXTALIGN_BOX);
			selBox.setHint(Kekule.$L('ChemWidgetTexts.HINT_TEXT_HORIZONTAL_ALIGN'));
			selBox.addEventListener('valueChange', function(e)
			{
				this.getEditor().modifyObjectsRenderOptions(this.getTargetObjs(), {'horizontalAlign': this.getTextHorizontalAlignBox().getValue()}, false, true);
			}, this);
			this.setPropStoreFieldValue('textHorizontalAlignBox', selBox);
			this._createCtrlGroup(doc, rootElem, Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_HORIZONTAL_ALIGN'), selBox);

			// vertical align
			selBox = new Kekule.Widget.SelectBox(panel);
			var TA = Kekule.Render.TextAlign;
			var items = [
				{'value': TA.DEFAULT, 'text': Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_ALIGN_DEFAULT')},
				{'value': TA.LEADING, 'text': Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_ALIGN_LEADING')},
				{'value': TA.TRAILING, 'text': Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_ALIGN_TRAILING')},
				{'value': TA.CENTER, 'text': Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_ALIGN_CENTER')},
				{'value': TA.TOP, 'text': Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_ALIGN_TOP')},
				{'value': TA.BOTTOM, 'text': Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_ALIGN_BOTTOM')}
			];
			selBox.setItems(items);
			comboBox.addClassName(CCNS.COMPOSER_TEXTALIGN_BOX);
			selBox.setHint(Kekule.$L('ChemWidgetTexts.HINT_TEXT_VERTICAL_ALIGN'));
			selBox.addEventListener('valueChange', function(e)
			{
				this.getEditor().modifyObjectsRenderOptions(this.getTargetObjs(), {'verticalAlign': this.getTextVerticalAlignBox().getValue()}, false, true);
			}, this);
			this.setPropStoreFieldValue('textVerticalAlignBox', selBox);
			this._createCtrlGroup(doc, rootElem, Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_VERTICAL_ALIGN'), selBox);
		}
		this.setPropStoreFieldValue('fontPanel', panel);

		// set stored field values
		var valueStorage = this._valueStorage;
		if (valueStorage)
		{
			this.getFontNameBox().setValue(valueStorage.fontName);
			this.getFontSizeBox().setValue(valueStorage.fontSize);

			this.getTextDirectionBox().setValue(valueStorage.textDirection);
			this.getTextHorizontalAlignBox().setValue(valueStorage.textHAlign);
			this.getTextVerticalAlignBox().setValue(valueStorage.textVAlign);
		}

		return panel;
	},
	/** @ignore */
	doCreateWidget: function()
	{
		var result = new Kekule.Widget.DropDownButton(this.getEditor());
		result.setHint(Kekule.$L('ChemWidgetTexts.HINT_TEXT_FORMAT'));
		result.setText(Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_FORMAT'));
		result.setShowText(false);
		result.setButtonKind(Kekule.Widget.Button.Kinds.DROPDOWN);
		result.addClassName(CCNS.COMPOSER_TEXTFORMAT_BUTTON);

		//var panel = this._doCreateDropDownPanel();
		//panel.on('valueChange', function(){ this.applyToTargets(); }, this);

		//result.setDropDownWidget(panel);
		result.setDropDownWidgetGetter(this._doCreateDropDownPanel.bind(this));
		return result;
	},
	/** @ignore */
	doLoadFromTargets: function(editor, targets)
	{
		if (targets && targets.length)
		{
			var valueStorage = this._valueStorage;
			valueStorage.fontName = this.getRenderOptionValue(targets, 'fontFamily') || '';  // TODO: atom font family?
			valueStorage.fontSize = this.getRenderOptionValue(targets, 'fontSize') || undefined;
			valueStorage.textDirection = this.getRenderOptionValue(targets, 'charDirection') || Kekule.Render.TextDirection.DEFAULT;
			valueStorage.textHAlign = this.getRenderOptionValue(targets, 'horizontalAlign') || Kekule.Render.TextAlign.DEFAULT;
			valueStorage.textVAlign = this.getRenderOptionValue(targets, 'verticalAlign') || Kekule.Render.TextAlign.DEFAULT;

			if (this.getFontPanel())
			{
				//console.log('do load from target');
				this.getFontNameBox().setValue(valueStorage.fontName);
				this.getFontSizeBox().setValue(valueStorage.fontSize);

				this.getTextDirectionBox().setValue(valueStorage.textDirection);
				this.getTextHorizontalAlignBox().setValue(valueStorage.textHAlign);
				this.getTextVerticalAlignBox().setValue(valueStorage.textVAlign);
			}
		}
	},
	/** @ignore */
	doApplyToTargets: function($super, editor, targets)
	{
		/*
		var modifications = {};
		// do not use operation, as we can call editor.modifyObjectsRenderOptions directly
		if (this.getFontNameBox().getIsDirty())
			modifications.fontFamily = this.getFontNameBox().getValue() || null;
		if (this.getFontSizeBox().getIsDirty())
			modifications.fontSize = this.getFontSizeBox().getValue() || null;
		editor.modifyObjectsRenderOptions(targets, modifications, false, true);
		*/
	},

	/** @private */
	fillFontSizeBox: function(sizeComboBox)
	{
		var listedSizes = this.getEditorConfigs().getStyleSetterConfigs().getListedFontSizes();
		var boxItems = [{'text': Kekule.$L('ChemWidgetTexts.S_VALUE_DEFAULT'), 'value': undefined}];
		for (var i = 0, l = listedSizes.length; i < l; ++i)
		{
			boxItems.push({'text': listedSizes[i] + ' px', 'value': listedSizes[i]});
		}
		sizeComboBox.setItems(boxItems);
	},
	/** @private */
	fillFontNameBox: function(fontComboBox)
	{
		var listedNames = this.getEditorConfigs().getStyleSetterConfigs().getListedFontNames();
		var boxItems = [{'text': Kekule.$L('ChemWidgetTexts.S_VALUE_DEFAULT'), 'value': ''}];
		for (var i = 0, l = listedNames.length; i < l; ++i)
		{
			boxItems.push({'text': listedNames[i], 'value': listedNames[i]});
		}
		fontComboBox.setItems(boxItems);
	}
});

var OMM = Kekule.Editor.ObjModifierManager;
OMM.register(Kekule.ChemObject, [Kekule.Editor.ObjModifier.RichText]);

})();