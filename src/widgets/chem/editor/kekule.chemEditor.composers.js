/**
 * @fileoverview
 * Implements an editor with essential UI.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /render/kekule.render.utils.js
 * requires /widgets/kekule.widget.base.js
 * requires /widgets/kekule.widget.helpers.js
 * requires /widgets/chem/kekule.chemWidget.base.js
 * requires /widgets/operation/kekule.actions.js
 * requires /widgets/commonCtrls/kekule.widget.buttons.js
 * requires /widgets/commonCtrls/kekule.widget.containers.js
 * requires /widgets/advCtrls/objInspector/kekule.widget.objInspectors.js
 * requires /widgets/chem/structureTreeView/kekule.chemWidget.structureTreeViews.js
 * requires /widgets/chem/editor/kekule.chemEditor.baseEditors.js
 * requires /widgets/chem/editor/kekule.chemEditor.nexus.js
 * requires /localization
 */

(function(){

var PS = Class.PropertyScope;
var CW = Kekule.ChemWidget;
var CE = Kekule.Editor;
var CNS = Kekule.Widget.HtmlClassNames;
var CCNS = Kekule.ChemWidget.HtmlClassNames;
var BNS = Kekule.ChemWidget.ComponentWidgetNames;
//var CWT = Kekule.ChemWidgetTexts;

/** @ignore */
Kekule.ChemWidget.HtmlClassNames = Object.extend(Kekule.ChemWidget.HtmlClassNames, {
	COMPOSER: 'K-Chem-Composer',
	COMPOSER_EDITOR_STAGE: 'K-Chem-Composer-Editor-Stage',
	COMPOSER_ADV_PANEL: 'K-Chem-Composer-Adv-Panel',
	COMPOSER_TOOLBAR: 'K-Chem-Composer-Toolbar',
	COMPOSER_COMMON_TOOLBAR: 'K-Chem-Composer-Common-Toolbar',
	COMPOSER_ZOOM_TOOLBAR: 'K-Chem-Composer-Zoom-Toolbar',
	COMPOSER_CHEM_TOOLBAR: 'K-Chem-Composer-Chem-Toolbar',
	COMPOSER_ASSOC_TOOLBAR: 'K-Chem-Composer-Assoc-Toolbar',
	COMPOSER_STYLE_TOOLBAR: 'K-Chem-Composer-Style-Toolbar',
	COMPOSER_FONTNAME_BOX: 'K-Chem-Composer-FontName-Box',
	COMPOSER_FONTSIZE_BOX: 'K-Chem-Composer-FontSize-Box',
	COMPOSER_COLOR_BOX: 'K-Chem-Composer-Color-Box',

	COMPOSER_TEXTDIRECTION_BUTTON: 'K-Chem-Composer-TextDirection-Button',
	COMPOSER_TEXTDIRECTION_BUTTON_DEFAULT: 'K-Chem-Composer-TextDirection-Button-Default',
	COMPOSER_TEXTDIRECTION_BUTTON_LTR: 'K-Chem-Composer-TextDirection-Button-LTR',
	COMPOSER_TEXTDIRECTION_BUTTON_RTL: 'K-Chem-Composer-TextDirection-Button-RTL',
	COMPOSER_TEXTDIRECTION_BUTTON_TTB: 'K-Chem-Composer-TextDirection-Button-TTB',
	COMPOSER_TEXTDIRECTION_BUTTON_BTT: 'K-Chem-Composer-TextDirection-Button-BTT',

	COMPOSER_TEXTALIGN_BUTTON: 'K-Chem-Composer-TextAlign-Button',
	COMPOSER_TEXTALIGN_BUTTON_HORIZONTAL: 'K-Chem-Composer-TextAlign-Button-Horizontal',
	COMPOSER_TEXTALIGN_BUTTON_VERTICAL: 'K-Chem-Composer-TextAlign-Button-Vertical',
	COMPOSER_TEXTALIGN_BUTTON_DEFAULT: 'K-Chem-Composer-TextAlign-Button',
	COMPOSER_TEXTALIGN_BUTTON_LEADING: 'K-Chem-Composer-TextAlign-Button-Leading',
	COMPOSER_TEXTALIGN_BUTTON_TRAILING: 'K-Chem-Composer-TextAlign-Button-Trailing',
	COMPOSER_TEXTALIGN_BUTTON_CENTER: 'K-Chem-Composer-TextAlign-Button-Center',
	COMPOSER_TEXTALIGN_BUTTON_LEFT: 'K-Chem-Composer-TextAlign-Button-Left',
	COMPOSER_TEXTALIGN_BUTTON_RIGHT: 'K-Chem-Composer-TextAlign-Right',
	COMPOSER_TEXTALIGN_BUTTON_TOP: 'K-Chem-Composer-TextAlign-Top',
	COMPOSER_TEXTALIGN_BUTTON_BOTTOM: 'K-Chem-Composer-TextAlign-Bottom',

	COMPOSER_DIALOG: 'K-Chem-ComposerDialog'  //'K-Chem-Viewer-Assoc-Editor'
});

Kekule.globalOptions.add('chemWidget.composer', {
	commonToolButtons: [
		BNS.newDoc,
		//BNS.loadFile,
		BNS.loadData,
		BNS.saveData,
		BNS.undo,
		BNS.redo,
		BNS.copy,
		BNS.cut,
		BNS.paste,
		//BNS.cloneSelection,
		BNS.zoomIn,
		BNS.reset,
		BNS.zoomOut,
		BNS.config,
		BNS.objInspector
	],
	chemToolButtons: [
		BNS.manipulate,
		BNS.erase,
		BNS.molBond,
		BNS.molAtom,
		BNS.molFormula,
		BNS.molRing,
		BNS.molCharge,
		BNS.glyph,
		BNS.textImage
	],
	styleToolComponentNames:	[
		BNS.fontName,
		BNS.fontSize,
		BNS.color,
		BNS.textDirection,
		BNS.textAlign
	]
});

/**
 * The style toolbar for composer.
 * @class
 * @augments Kekule.Widget.Toolbar
 * @param {Kekule.Editor.Composer} composer Parent composer.
 *
 * @property {Kekule.Editor.Composer} composer Parent composer.
 * @property {String} fontName Font name setted in toolbar.
 * @property {Number} fontSize Font size setted in toolbar, in px.
 * @property {Int} textAlign Text align setted in toolbar.
 *
 * @property {Array} components Array of component names that shows in tool bar.
 */
Kekule.Editor.ComposerStyleToolbar = Class.create(Kekule.Widget.Toolbar,
/** @lends Kekule.Editor.ComposerStyleToolbar# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ComposerStyleToolbar',
	/**
	 * @private
	 * @ignore
	 */
	ATOM_COLOR_SPECIAL_VALUE_INFO: {
		text: '(use atom custom color)',
		value: 'Atom',
		className: CNS.COLORPICKER_SPEC_COLOR_MIXED
	},
	/** @private */
	LINKED_VALUE_FIELD: '__$value__',
	/** @constructs */
	initialize: function($super, composer)
	{
		$super(composer);
		this.setPropStoreFieldValue('composer', composer);
		this.createChildWidgets();
		this.appendToWidget(composer);
		this._relatedPropNames = (composer.getCoordMode() === Kekule.CoordMode.COORD3D)?
			['renderOptions', 'render3DOptions']: ['renderOptions'];

		this.getEditor().addEventListener('selectionChange', function(e){
			if (!this._isApplying)
				this.updateStyleValues();
		}, this);
		this.getEditor().addEventListener('editObjChanged', function(e){
			var propNames = e.propNames;
			if (!propNames || !propNames.length || !Kekule.ArrayUtils.intersect(this._relatedPropNames, propNames).length)  // not changing render options
			{
				return;
			}
			if (!this._isApplying)
				this.updateStyleValues();
		}, this);

		this._isApplying = false;  // private
	},
	/** @private */
	doFinalize: function($super)
	{
		this.clearWidgets();  // already clear in $super()
		$super();
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('composer', {'dataType': 'Kekule.Editor.Composer', 'serializable': false, 'setter': null});
		this.defineProp('fontNameBox', {'dataType': 'Kekule.Widget.ComboBox', 'serializable': false, 'setter': null});
		this.defineProp('fontSizeBox', {'dataType': 'Kekule.Widget.ComboBox', 'serializable': false, 'setter': null});
		this.defineProp('colorBox', {'dataType': 'Kekule.Widget.ColorDropButton', 'serializable': false, 'setter': null});
		this.defineProp('textDirectionButtonSet', {'dataType': 'Kekule.Widget.CompactButtonSet', 'serializable': false, 'setter': null});
		this.defineProp('textHorizontalAlignButtonSet', {'dataType': 'Kekule.Widget.CompactButtonSet', 'serializable': false, 'setter': null});
		this.defineProp('textVerticalAlignButtonSet', {'dataType': 'Kekule.Widget.CompactButtonSet', 'serializable': false, 'setter': null});
		this.defineProp('fontName', {'dataType': DataType.STRING, 'serializable': false,
			'getter': function() { return this.getFontNameBox()? this.getFontNameBox().getValue(): null; },
			'setter': function(value) { if (this.getFontNameBox()) { this.getFontNameBox().setValue(value); } }
		});
		this.defineProp('fontSize', {'dataType': DataType.NUMBER, 'serializable': false,
			'getter': function() { return this.getFontSizeBox()? parseFloat(this.getFontSizeBox().getValue()): null; },
			'setter': function(value) { if (this.getFontSizeBox()) { this.getFontSizeBox().setValue(value); } }
		});
		this.defineProp('color', {'dataType': DataType.STRING, 'serializable': false,
			'getter': function() { return this.getColorBox()? this.getColorBox().getValue(): undefined; },
			'setter': function(value) { if (this.getColorBox()) { this.getColorBox().setValue(value); } }
		});
		this.defineProp('textDirection', {'dataType': DataType.INT, 'serializable': false,
			'getter': function()
			{
				return this._getButtonSetLinkedValue(this.getTextDirectionButtonSet());
			},
			'setter': function(value)
			{
				this._setButtonSetLinkedValue(this.getTextDirectionButtonSet(), value);
			}
		});
		this.defineProp('textHorizontalAlign', {'dataType': DataType.INT, 'serializable': false,
			'getter': function()
			{
				return this._getButtonSetLinkedValue(this.getTextHorizontalAlignButtonSet());
			},
			'setter': function(value)
			{
				this._setButtonSetLinkedValue(this.getTextHorizontalAlignButtonSet(), value);
			}
		});
		this.defineProp('textVerticalAlign', {'dataType': DataType.INT, 'serializable': false,
			'getter': function()
			{
				return this._getButtonSetLinkedValue(this.getTextVerticalAlignButtonSet());
			},
			'setter': function(value)
			{
				this._setButtonSetLinkedValue(this.getTextVerticalAlignButtonSet(), value);
			}
		});

		this.defineProp('componentNames', {'dataType': DataType.ARRAY, 'serializable': false,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('componentNames');
				if (!result)  // create default one
				{
					result = this.getDefaultComponentNames();
					this.setPropStoreFieldValue('componentNames', result);
				}
				return result;
			},
			'setter': function(value)
			{
				this.setPropStoreFieldValue('componentNames', value);
				this.recreateComponents();
			}
		});
	},
	/** @ignore */
	initPropValues: function($super)
	{
		$super();
		this.setShowGlyph(true);
	},

	/** @ignore */
	removeWidget: function($super, widget, doNotFinalize)
	{
		if (widget === this.getFontNameBox())
			this.setPropStoreFieldValue('fontNameBox', null);
		if (widget === this.getFontSizeBox())
			this.setPropStoreFieldValue('fontSizeBox', null);
		$super(widget, doNotFinalize);
	},

	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		var result = $super() + ' ' + CCNS.COMPOSER_TOOLBAR + ' ' + CCNS.COMPOSER_STYLE_TOOLBAR;
		return result;
	},

	/** @private */
	getEditor: function()
	{
		return this.getComposer().getEditor();
	},
	/** @private */
	getEditorConfigs: function()
	{
		return this.getEditor().getEditorConfigs();
	},

	/** @private */
	createChildWidgets: function(componentNames)
	{
		if (!componentNames)
			componentNames = this.getComponentNames();

		for (var i = 0, l = componentNames.length; i < l; ++i)
		{
			var name = componentNames[i];
			if (name === BNS.fontName)
			{
				// font name
				var comboBox = new Kekule.Widget.ComboBox(this);
				this.fillFontNameBox(comboBox);
				comboBox.addClassName(CCNS.COMPOSER_FONTNAME_BOX);
				comboBox.setHint(/*CWT.HINT_FONTNAME*/Kekule.$L('ChemWidgetTexts.HINT_FONTNAME'));
				comboBox.addEventListener('valueChange', function(e)
				{
					this.applyFontName();
				}, this);
				this.setPropStoreFieldValue('fontNameBox', comboBox);
			}
			else if (name === BNS.fontSize)
			{
				// font size
				comboBox = new Kekule.Widget.ComboBox(this);
				this.fillFontSizeBox(comboBox);
				comboBox.addClassName(CCNS.COMPOSER_FONTSIZE_BOX);
				comboBox.setHint(/*CWT.HINT_FONTSIZE*/Kekule.$L('ChemWidgetTexts.HINT_FONTSIZE'));
				comboBox.addEventListener('valueChange', function(e)
				{
					this.applyFontSize();
				}, this);
				this.setPropStoreFieldValue('fontSizeBox', comboBox);
			}
			else if (name === BNS.color)
			{
				// color box
				var colorBox = new Kekule.Widget.ColorDropButton(this);
				colorBox.setHint(/*CWT.HINT_PICK_COLOR*/Kekule.$L('ChemWidgetTexts.HINT_PICK_COLOR'));
				colorBox.setShowText(false);
				colorBox.setSpecialColors([Kekule.Widget.ColorPicker.SpecialColors.UNSET, this.ATOM_COLOR_SPECIAL_VALUE_INFO]);
				colorBox.addClassName(CCNS.COMPOSER_COLOR_BOX);
				colorBox.addEventListener('valueChange', function(e)
				{
					this.applyColor();
				}, this);
				this.setPropStoreFieldValue('colorBox', colorBox);
			}
			else if (name === BNS.textDirection)
			{
				// text direction button
				// its drop downs
				var TD = Kekule.Render.TextDirection;
				var childInfos = [
					{'value': TD.DEFAULT, 'text': /*CWT.CAPTION_TEXT_DIRECTION_DEFAULT*/Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_DIRECTION_DEFAULT'), className: CCNS.COMPOSER_TEXTDIRECTION_BUTTON_DEFAULT},
					{'value': TD.LTR, 'text': /*CWT.CAPTION_TEXT_DIRECTION_LTR*/Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_DIRECTION_LTR'), className: CCNS.COMPOSER_TEXTDIRECTION_BUTTON_LTR},
					{'value': TD.RTL, 'text': /*CWT.CAPTION_TEXT_DIRECTION_RTL*/Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_DIRECTION_RTL'), className: CCNS.COMPOSER_TEXTDIRECTION_BUTTON_RTL},
					{'value': TD.TTB, 'text': /*CWT.CAPTION_TEXT_DIRECTION_TTB*/Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_DIRECTION_TTB'), className: CCNS.COMPOSER_TEXTDIRECTION_BUTTON_TTB},
					{'value': TD.BTT, 'text': /*CWT.CAPTION_TEXT_DIRECTION_BTT*/Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_DIRECTION_BTT'), className: CCNS.COMPOSER_TEXTDIRECTION_BUTTON_BTT}
				];
				var btnSet = this._createStyleButtonSet(
					/*CWT.CAPTION_TEXT_DIRECTION, CWT.HINT_TEXT_DIRECTION,*/
					Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_DIRECTION'), Kekule.$L('ChemWidgetTexts.HINT_TEXT_DIRECTION'),
					CCNS.COMPOSER_TEXTDIRECTION_BUTTON, childInfos);
				btnSet.addEventListener('select', function(e)
				{
					this.applyTextDirection();
				}, this);
				this.setPropStoreFieldValue('textDirectionButtonSet', btnSet);
			}
			else if (name === BNS.textAlign)
			{
				// horizontal text align button
				var TA = Kekule.Render.TextAlign;
				var childInfos = [
					{'value': TA.DEFAULT, 'text': /*CWT.CAPTION_TEXT_ALIGN_DEFAULT*/Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_ALIGN_DEFAULT'), className: CCNS.COMPOSER_TEXTALIGN_BUTTON_DEFAULT},
					{'value': TA.LEADING, 'text': /*CWT.CAPTION_TEXT_ALIGN_LEADING*/Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_ALIGN_LEADING'), className: CCNS.COMPOSER_TEXTALIGN_BUTTON_LEADING},
					{'value': TA.TRAILING, 'text': /*CWT.CAPTION_TEXT_ALIGN_TRAILING*/Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_ALIGN_TRAILING'), className: CCNS.COMPOSER_TEXTALIGN_BUTTON_TRAILING},
					{'value': TA.CENTER, 'text': /*CWT.CAPTION_TEXT_ALIGN_CENTER*/Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_ALIGN_CENTER'), className: CCNS.COMPOSER_TEXTALIGN_BUTTON_CENTER},
					{'value': TA.LEFT, 'text': /*CWT.CAPTION_TEXT_ALIGN_LEFT*/Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_ALIGN_LEFT'), className: CCNS.COMPOSER_TEXTALIGN_BUTTON_LEFT},
					{'value': TA.RIGHT, 'text': /*CWT.CAPTION_TEXT_ALIGN_RIGHT*/Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_ALIGN_RIGHT'), className: CCNS.COMPOSER_TEXTALIGN_BUTTON_RIGHT}
				];
				var btnSet = this._createStyleButtonSet(
					/*CWT.CAPTION_TEXT_HORIZONTAL_ALIGN, CWT.HINT_TEXT_HORIZONTAL_ALIGN,*/
					Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_HORIZONTAL_ALIGN'), Kekule.$L('ChemWidgetTexts.HINT_TEXT_HORIZONTAL_ALIGN'),
					CCNS.COMPOSER_TEXTALIGN_BUTTON_HORIZONTAL, childInfos);
				btnSet.addEventListener('select', function(e)
				{
					this.applyTextHorizontalAlign();
				}, this);
				this.setPropStoreFieldValue('textHorizontalAlignButtonSet', btnSet);

				// vertical text align button
				var TA = Kekule.Render.TextAlign;
				var childInfos = [
					{'value': TA.DEFAULT, 'text': /*CWT.CAPTION_TEXT_ALIGN_DEFAULT*/Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_ALIGN_DEFAULT'), className: CCNS.COMPOSER_TEXTALIGN_BUTTON_DEFAULT},
					{'value': TA.LEADING, 'text': /*CWT.CAPTION_TEXT_ALIGN_LEADING*/Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_ALIGN_LEADING'), className: CCNS.COMPOSER_TEXTALIGN_BUTTON_LEADING},
					{'value': TA.TRAILING, 'text': /*CWT.CAPTION_TEXT_ALIGN_TRAILING*/Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_ALIGN_TRAILING'), className: CCNS.COMPOSER_TEXTALIGN_BUTTON_TRAILING},
					{'value': TA.CENTER, 'text': /*CWT.CAPTION_TEXT_ALIGN_CENTER*/Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_ALIGN_CENTER'), className: CCNS.COMPOSER_TEXTALIGN_BUTTON_CENTER},
					{'value': TA.TOP, 'text': /*CWT.CAPTION_TEXT_ALIGN_TOP*/Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_ALIGN_TOP'), className: CCNS.COMPOSER_TEXTALIGN_BUTTON_TOP},
					{'value': TA.BOTTOM, 'text': /*CWT.CAPTION_TEXT_ALIGN_BOTTOM*/Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_ALIGN_BOTTOM'), className: CCNS.COMPOSER_TEXTALIGN_BUTTON_BOTTOM}
				];
				var btnSet = this._createStyleButtonSet(
					/*CWT.CAPTION_TEXT_VERTICAL_ALIGN, CWT.HINT_TEXT_VERTICAL_ALIGN,*/
					Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_VERTICAL_ALIGN'), Kekule.$L('ChemWidgetTexts.HINT_TEXT_VERTICAL_ALIGN'),
					CCNS.COMPOSER_TEXTALIGN_BUTTON_VERTICAL, childInfos);
				btnSet.addEventListener('select', function(e)
				{
					this.applyTextVerticalAlign();
				}, this);
				this.setPropStoreFieldValue('textVerticalAlignButtonSet', btnSet);
			}
		}
		this.updateStyleValues();
	},
	/** @private */
	_createStyleButtonSet: function(text, hint, className, childItemInfos)
	{
		var btnSet = new Kekule.Widget.CompactButtonSet(this);
		btnSet.setText(text);
		btnSet.setHint(hint);
		btnSet.addClassName(className);
		btnSet.setShowText(false);
		// show drop down mark rather than compact mark, keep a similar outlook to other widgets
		btnSet.setShowCompactMark(false);
		btnSet.setButtonKind(Kekule.Widget.Button.Kinds.DROPDOWN);

		btnSet.getButtonSet().addClassName(CCNS.COMPOSER_STYLE_TOOLBAR);
		btnSet.getButtonSet().setShowText(true);

		// drop down children
		if (childItemInfos)
		{
			for (var i = 0, l = childItemInfos.length; i < l; ++i)
			{
				var info = childItemInfos[i];
				var btn = new Kekule.Widget.RadioButton(btnSet, info.text || '');
				btn.setHint(info.hint || '');
				btn.addClassName(info.className);
				btn[this.LINKED_VALUE_FIELD] = info.value;
				btnSet.append(btn, info.selected);
			}
		}

		return btnSet;
	},
	/** @private */
	_getButtonSetLinkedValue: function(btnSet)
	{
		var selected = btnSet? btnSet.getSelected(): null;
		return selected? selected[this.LINKED_VALUE_FIELD]: undefined;
	},
	/** @private */
	_setButtonSetLinkedValue: function(btnSet, value)
	{
		if (btnSet)
		{
			var group = btnSet.getButtonSet();
			var children = group.getChildWidgets();
			btnSet.setSelected(null);  // uncheck all first
			for (var i = 0 , l = children.length; i < l; ++i)
			{
				var child = children[i];
				if (child.hasOwnProperty(this.LINKED_VALUE_FIELD))
				{
					if (child[this.LINKED_VALUE_FIELD] == value)
					{
						btnSet.setSelected(child);
						break;
					}
				}
			}
		}
	},

	/** @private */
	getDefaultComponentNames: function()
	{
		return Kekule.globalOptions.chemWidget.composer.styleToolComponentNames;
		/*
		return [
			BNS.fontName,
			BNS.fontSize,
			BNS.color,
			BNS.textDirection,
			BNS.textAlign
		];
		*/
	},
	/** @private */
	recreateComponents: function()
	{
		var cnames = this.getComponentNames();
		this.clearWidgets();
		this.createChildWidgets(cnames);
	},

	/** @private */
	fillFontSizeBox: function(sizeComboBox)
	{
		var listedSizes = this.getEditorConfigs().getStyleSetterConfigs().getListedFontSizes();
		var boxItems = [{'text': /*Kekule.ChemWidgetTexts.S_VALUE_DEFAULT*/Kekule.$L('ChemWidgetTexts.S_VALUE_DEFAULT'), 'value': undefined}];
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
		var boxItems = [{'text': /*Kekule.ChemWidgetTexts.S_VALUE_DEFAULT*/Kekule.$L('ChemWidgetTexts.S_VALUE_DEFAULT'), 'value': ''}];
		for (var i = 0, l = listedNames.length; i < l; ++i)
		{
			boxItems.push({'text': listedNames[i], 'value': listedNames[i]});
		}
		fontComboBox.setItems(boxItems);
	},

	/**
	 * Apply style settings to objects in editor.
	 * @param {Array} chemObjs
	 * @param {Hash} styles Hash of style. {renderOptionName: value}.
	 * @param {Bool} is3DOption If true, styles will be put to Render3DOptions, otherwise RenderOptions will be set.
	 * @private
	 */
	applyStyle: function(chemObjs, styles, is3DOption)
	{
		this._isApplying = true;
		try
		{
			//Kekule.Render.RenderOptionUtils.setRenderOptionValueOfObjs(chemObjs, styles, is3DOption);
			var editor = this.getEditor();
			editor.modifyObjectsRenderOptions(chemObjs, styles, is3DOption, true);
		}
		finally
		{
			this._isApplying = false;
		}
	},
	/**
	 * Returns common render option or render 3D option value of chemObjs.
	 * If values in objects are not same, null will be returned.
	 * @param {Array} chemObjs
	 * @param {String} stylePropName
	 * @param {Bool} is3DOption
	 * @returns {Variant}
	 * @private
	 */
	getStyleValue: function(chemObjs, stylePropName, is3DOption)
	{
		return Kekule.Render.RenderOptionUtils.getCascadeRenderOptionValueOfObjs(chemObjs, stylePropName, is3DOption);
	},
	/**
	 * Apply styles to selected objects in editor.
	 * @private
	 */
	applyStyleToEditorSelection: function(styles, is3DOption)
	{
		var objs = this.getEditor().getSelection();
		if (objs && objs.length)
			return this.applyStyle(objs, styles, is3DOption);
	},

	/** @private */
	applyFontName: function(objs)
	{
		if (!objs)
			objs = this.getEditor().getSelection();
		if (objs && objs.length)
		{
			var fontName = this.getFontName();
			this.applyStyle(objs, {'fontFamily': fontName/*, 'atomFontFamily': fontName*/});
		}
	},
	/** @private */
	applyFontSize: function(objs)
	{
		if (!objs)
			objs = this.getEditor().getSelection();
		if (objs && objs.length)
		{
			var fontSize = this.getFontSize();
			this.applyStyle(objs, {'fontSize': fontSize/*, 'atomFontSize': fontSize*/});
		}
	},
	/** @private */
	applyColor: function(objs)
	{
		if (!objs)
			objs = this.getEditor().getSelection();
		if (objs && objs.length)
		{
			var color = this.getColor();
			if (color === this.ATOM_COLOR_SPECIAL_VALUE_INFO.value)
			{
				this.applyStyle(objs, {'useAtomSpecifiedColor': true, 'color': undefined});
			}
			else
			{
				if (color == Kekule.Widget.ColorPicker.SpecialColors.UNSET)
					color = undefined;
				this.applyStyle(objs, {'useAtomSpecifiedColor': false, 'color': color});
			}
		}
	},
	/** @private */
	applyTextDirection: function(objs)
	{
		if (!objs)
			objs = this.getEditor().getSelection();
		if (objs && objs.length)
		{
			var direction = this.getTextDirection();
			this.applyStyle(objs, {'charDirection': direction});
		}
	},
	/** @private */
	applyTextHorizontalAlign: function(objs)
	{
		if (!objs)
			objs = this.getEditor().getSelection();
		if (objs && objs.length)
		{
			var value = this.getTextHorizontalAlign();
			this.applyStyle(objs, {'horizontalAlign': value});
		}
	},
	/** @private */
	applyTextVerticalAlign: function(objs)
	{
		if (!objs)
			objs = this.getEditor().getSelection();
		if (objs && objs.length)
		{
			var value = this.getTextVerticalAlign();
			this.applyStyle(objs, {'verticalAlign': value});
		}
	},
	/** @private */
	updateStyleValues: function(objs)
	{
		if (!objs)
			objs = this.getEditor().getSelection();
		if (objs && objs.length)
		{
			this.updateFontName(objs);
			this.updateFontSize(objs);
			this.updateColor(objs);
			this.updateTextDirection(objs);
			this.updateTextHorizontalAlign(objs);
			this.updateTextVerticalAlign(objs);
		}
	},
	/** @private */
	updateFontName: function(objs)
	{
		if (objs && objs.length && this.getFontNameBox())
		{
			var fontName = this.getStyleValue(objs, 'fontFamily');  // TODO: atom font family?
			this.setFontName(fontName || '');
		}
	},
	/** @private */
	updateFontSize: function(objs)
	{
		if (objs && objs.length && this.getFontSizeBox())
		{
			var fontSize = this.getStyleValue(objs, 'fontSize');  // TODO: atom font size?
			this.setFontSize(fontSize || undefined);
		}
	},
	/** @private */
	updateColor: function(objs)
	{
		if (objs && objs.length && this.getColorBox())
		{
			var color;
			var useAtomSpecified = this.getStyleValue(objs, 'useAtomSpecifiedColor');
			var color = this.getStyleValue(objs, 'color');
			this.getColorBox().setColorClassName(null);
			if (color)
			{
				this.getColorBox().setColorClassName(null);
			}
			else if (useAtomSpecified)
			{
				color = this.ATOM_COLOR_SPECIAL_VALUE_INFO.value;
				this.getColorBox().setColorClassName(this.ATOM_COLOR_SPECIAL_VALUE_INFO.className);
			}
			this.setColor(color || undefined);
		}
	},
	/** @private */
	updateTextDirection: function(objs)
	{
		if (objs && objs.length && this.getTextDirectionButtonSet())
		{
			var value = this.getStyleValue(objs, 'charDirection');
			this.setTextDirection(value);
			/*
			if (Kekule.ObjUtils.notUnset(value))
			{

			}
			*/
		}
	},
	/** @private */
	updateTextHorizontalAlign: function(objs)
	{
		if (objs && objs.length && this.getTextHorizontalAlignButtonSet())
		{
			var value = this.getStyleValue(objs, 'horizontalAlign');
			this.setTextHorizontalAlign(value);
		}
	},
	/** @private */
	updateTextVerticalAlign: function(objs)
	{
		if (objs && objs.length && this.getTextVerticalAlignButtonSet())
		{
			var value = this.getStyleValue(objs, 'verticalAlign');
			this.setTextVerticalAlign(value);
		}
	},

	/**
	 * Update toolbar and child widget outlook and other settings according to editor's state.
	 */
	updateState: function()
	{
		var editor = this.getEditor();
		var hasSelection = (editor && editor.hasSelection());
		//this.setEnabled(hasSelection);
		/*
		var children = [
			this.getFontNameBox(),
			this.getFontSizeBox(),
			this.getColorBox(),
			this.getTextDirectionButtonSet(),
			this.getTextAlignButtonSet()
		];
		*/
		if (this.getFontNameBox())
			this.getFontNameBox().setEnabled(hasSelection);
		if (this.getFontSizeBox())
			this.getFontSizeBox().setEnabled(hasSelection);
		if (this.getColorBox())
			this.getColorBox().setEnabled(hasSelection);
		if (this.getTextDirectionButtonSet())
			this.getTextDirectionButtonSet().setEnabled(hasSelection);
		if (this.getTextHorizontalAlignButtonSet())
			this.getTextHorizontalAlignButtonSet().setEnabled(hasSelection);
		if (this.getTextVerticalAlignButtonSet())
			this.getTextVerticalAlignButtonSet().setEnabled(hasSelection);
	}
});


/**
 * A editor with essential UI for end users.
 * @class
 * @augments Kekule.ChemWidget.AbstractWidget
 * @param {Variant} parentOrElementOrDocument
 * @param {Kekule.Editor.BaseEditor} editor An editor instance embedded in UI.
 *
 * @property {Kekule.Editor.BaseEditor} editor The editor instance embedded in UI.
 * @property {Array} commonToolButtons buttons in common tool bar. This is a array of predefined strings, e.g.: ['zoomIn', 'zoomOut', 'resetZoom', 'molDisplayType', ...].
 *   If not set, default buttons will be used.
 *   In the array, complex hash can also be used to add custom buttons, e.g.: <br />
 *     [ <br />
 *       'zoomIn', 'zoomOut',<br />
 *       {'name': 'myCustomButton1', 'widgetClass': 'Kekule.Widget.Button', 'action': actionClass},<br />
 *       {'name': 'myCustomButton2', 'htmlClass': 'MyClass' 'caption': 'My Button', 'hint': 'My Hint', '#execute': function(){ ... }},<br />
 *     ]<br />
 * @property {Array} chemToolButtons buttons in chem tool bar. This is a array of predefined strings, e.g.: ['zoomIn', 'zoomOut', 'resetZoom', 'molDisplayType', ...].
 *   If not set, default buttons will be used.
 *   Chem tool often has a series of child tool buttons, you can also control to display which child buttons, e.g.:
 *    [
 *      {'name': 'bond', 'attached': ['bondSingle', 'bondDouble']}, <br />
 *      'atom', 'formula',<br />
 *    ] <br />
 *   Note: currently same child button can not be existed in different chem tool buttons.
 *   In the array, complex hash can also be used to add custom buttons, e.g.: <br />
 *     [ <br />
 *       'atom', 'formula',<br />
 *       {'name': 'myCustomButton1', 'widgetClass': 'Kekule.Widget.Button', 'action': actionClass},<br />
 *       {'name': 'myCustomButton2', 'htmlClass': 'MyClass' 'caption': 'My Button', 'hint': 'My Hint', '#execute': function(){ ... }},<br />
 *     ]<br />
 * @property {Array} styleToolComponentNames Array of component names that shows in style tool bar.
 * @property {Bool} enableStyleToolbar
 * @property {Bool} showInspector Whether show advanced object inspector and structure view.
 *
 * @property {Kekule.Editor.BaseEditorConfigs} editorConfigs Configuration of this editor.
 * @property {Bool} enableOperHistory Whether undo/redo is enabled.
 * @property {Kekule.OperationHistory} operHistory History of operations. Used to enable undo/redo function.
 * @property {Int} renderType Display in 2D or 3D. Value from {@link Kekule.Render.RendererType}.
 * @property {Kekule.ChemObject} chemObj The root object in editor.
 * @property {Bool} enableOperContext If this property is set to true, object being modified will be drawn in a
 *   separate context to accelerate the interface refreshing.
 * @property {Object} objContext Context to draw basic chem objects. Can be 2D or 3D context. Alias of property drawContext
 * @property {Object} operContext Context to draw objects being operated. Can be 2D or 3D context.
 * @property {Object} uiContext Context to draw UI marks. Usually this is a 2D context.
 * @property {Object} objDrawBridge Bridge to draw chem objects. Alias of property drawBridge.
 * @property {Object} uiDrawBridge Bridge to draw UI markers.
 * @property {Array} selection An array of selected basic object.
 *
 * @property {Bool} enableLoadNewFile Whether open a external file to displayer is allowed.
 * @property {Bool} enableCreateNewDoc Whether create new object in editor is allowed.
 * @property {Bool} allowCreateNewChild Whether new direct child of space can be created.
 *   Note: if the space is empty, one new child will always be allowed to create.
 */
Kekule.Editor.Composer = Class.create(Kekule.ChemWidget.AbstractWidget,
/** @lends Kekule.Editor.Composer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.Composer',
	/** @private */
	BINDABLE_TAG_NAMES: ['div'],
	/** @private */
	CHEM_TOOL_CHILD_FIELDS: '__$children__',
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument, editor)
	{
		this.updateStyleToolbarStateBind = this.updateStyleToolbarState.bind(this);

		this.setPropStoreFieldValue('enableStyleToolbar', true);
		this.setPropStoreFieldValue('editor', editor);
		this.setPropStoreFieldValue('editorNexus', new Kekule.Editor.EditorNexus());
		$super(parentOrElementOrDocument);

		/*
		if (!editor)
			editor = this.createDefaultEditor();
		*/
		this.bindEditor(editor);

		// tool bars may already be created by setting buttons property
		if (!this.getCommonBtnGroup())
			this.createCommonToolbar();
		if (!this.getChemBtnGroup())
			this.createChemToolbar();
		if (!this.getZoomBtnGroup())
			this.createZoomToolbar();

		// debug
		//this.setShowInspector(true);
		this.uiLayoutChanged();
	},
	/** @private */
	doFinalize: function($super)
	{
		//this.getPainter().finalize();
		var toolBar = this.getCommonBtnGroup();
		if (toolBar)
			toolBar.finalize();
		var toolBar = this.getChemBtnGroup();
		if (toolBar)
			toolBar.finalize();
		var editor = this.getPropStoreFieldValue('editor');
		if (editor)
			editor.finalize();
		this.getEditorNexus().finalize();
		$super();
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('editor', {'dataType': 'Kekule.Editor.BaseEditor', 'serializable': false, 'setter': null,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('editor');
				if (!result)
				{
					result = this.createDefaultEditor();
					this.setPropStoreFieldValue('editor', result);
				}
				return result;
			}
		});
		this.defineProp('showInspector', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				if (this.getShowInspector() !== value)
				{
					this.setPropStoreFieldValue('showInspector', value);
					this.showInspectorChanged();
				}
			}});

		// private property
		this.defineProp('editorStageElem', {'dataType': DataType.OBJECT, 'serializable': false, 'setter': null});
		this.defineProp('advPanelElem', {'dataType': DataType.OBJECT, 'serializable': false, 'setter': null});

		this.defineProp('editorNexus', {'dataType': 'Kekule.Editor.EditorNexus', 'serializable': false, 'setter': null});
		this.defineProp('objInspector', {'dataType': 'Kekule.Widget.ObjectInspector', 'serializable': false, 'setter': null});
		this.defineProp('structureTreeView', {'dataType': 'Kekule.ChemWidget.StructureTreeView', 'serializable': false, 'setter': null});

		// a private property, toolbar of common tasks (such as save/load)
		this.defineProp('commonBtnGroup', {'dataType': 'Kekule.Widget.ButtonGroup', 'serializable': false});
		// a private property, toolbar of zoom tasks (such as zoomin/out)
		this.defineProp('zoomBtnGroup', {'dataType': 'Kekule.Widget.ButtonGroup', 'serializable': false});
		// a private property, toolbar of chem tools (such as atom/bond)
		this.defineProp('chemBtnGroup', {'dataType': 'Kekule.Widget.ButtonGroup', 'serializable': false});
		// a private property, toolbar of association chem tools (such as single, double bound form for bond tool)
		this.defineProp('assocBtnGroup', {'dataType': 'Kekule.Widget.ButtonGroup', 'serializable': false});
		// a private property, toolbar of style settings (such as font name, font size, color)
		this.defineProp('styleToolbar', {'dataType': 'Kekule.Widget.ButtonGroup', 'serializable': false,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('styleToolbar');
				if (!result)
				{
					if (this.getEnableStyleToolbar())
					{
						result = this.createStyleToolbar();
						this.setPropStoreFieldValue('styleToolbar', result);
					}
				}
				return result;
			}
		});
		this.defineProp('styleToolComponentNames', {'dataType': DataType.ARRAY, 'serializable': false,
			'getter': function()
			{
				var toolbar = this.getStyleToolbar();
				return toolbar? toolbar.getComponentNames(): null;
			},
			'setter': function(value)
			{
				var toolbar = this.getStyleToolbar();
				if (toolbar)
					toolbar.setComponentNames(value);
				return this;
			}
		});

		this.defineProp('enableStyleToolbar', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('enableStyleToolbar', value);
				this.updateStyleToolbarState();
			}
		});


		this.defineProp('commonToolButtons', {'dataType': DataType.HASH, 'serializable': false,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('commonToolButtons');
				if (!result)  // create default one
				{
					result = this.getDefaultCommonToolBarButtons();
					this.setPropStoreFieldValue('commonToolButtons', result);
				}
				return result;
			},
			'setter': function(value)
			{
				this.setPropStoreFieldValue('commonToolButtons', value);
				this.updateCommonToolbar();
				this.updateZoomToolbar();
			}
		});
		this.defineProp('chemToolButtons', {'dataType': DataType.HASH, 'serializable': false,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('chemToolButtons');
				if (!result)  // create default one
				{
					result = this.getDefaultChemToolBarButtons();
					this.setPropStoreFieldValue('chemToolButtons', result);
				}
				return result;
			},
			'setter': function(value)
			{
				this.setPropStoreFieldValue('chemToolButtons', value);
				this.updateChemToolbar();
			}
		});
		this.defineProp('styleBarComponents', {'dataType': DataType.ARRAY, 'serializable': false,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('styleBarComponents');
				if (!result)
				{
					result = null;  // default one
					this.setPropStoreFieldValue('styleBarComponents', result);
				}
				return result;
			},
			'setter': function(value)
			{
				this.setPropStoreFieldValue('styleBarComponents', value);
				if (this.getStyleToolbar())
					this.getStyleToolbar().setComponentNames(value);
			}
		});

		/*
		// private
		this.defineProp('toolButtonNameMapping', {'dataType': DataType.HASH, 'serializable': false, 'setter': null,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('toolButtonNameMapping');
				if (!result)  // create default one
				{
					result = this._createDefaultToolButtonNameMapping();
					this.setPropStoreFieldValue('toolButtonNameMapping', result);
				}
				return result;
			}
		});
		*/
		// private
		this.defineProp('commonActions', {'dataType': 'Kekule.ActionList', 'serializable': false, 'setter': null,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('commonActions');
				if (!result)
				{
					result = new Kekule.ActionList();
					this.setPropStoreFieldValue('commonActions', result);
				}
				return result;
			}
		});
		this.defineProp('zoomActions', {'dataType': 'Kekule.ActionList', 'serializable': false, 'setter': null,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('zoomActions');
				if (!result)
				{
					result = new Kekule.ActionList();
					this.setPropStoreFieldValue('zoomActions', result);
				}
				return result;
			}
		});
		this.defineProp('chemActions', {'dataType': 'Kekule.ActionList', 'serializable': false, 'setter': null,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('chemActions');
				if (!result)
				{
					result = new Kekule.ActionList();
					this.setPropStoreFieldValue('chemActions', result);
				}
				return result;
			}
		});
		this.defineProp('actionMap', {'dataType': 'Kekule.MapEx', 'serializable': false, 'setter': null,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('actionMap');
				if (!result)
				{
					result = new Kekule.MapEx();
					this.setPropStoreFieldValue('actionMap', result);
				}
				return result;
			}
		});

		this.defineProp('allowCreateNewChild', {'dataType': DataType.BOOL,
			'getter': function()
			{
				var ed = this.getEditor();
				return (ed && ed.getAllowCreateNewChild)? ed.getAllowCreateNewChild(): null;
			},
			'setter': function(value)
			{
				var ed = this.getEditor();
				if (ed.setAllowCreateNewChild)
					ed.setAllowCreateNewChild(value);
				return this;
			}
		});


		// editor delegated property
		// from ChemObjDisplayer
		this._defineEditorDelegatedProp('chemObj');
		this._defineEditorDelegatedProp('chemObjLoaded');
		this._defineEditorDelegatedProp('renderType');
		this._defineEditorDelegatedProp('renderConfigs');
		this._defineEditorDelegatedProp('drawOptions');
		this._defineEditorDelegatedProp('allowCoordBorrow');
		// from BaseEditor
		this._defineEditorDelegatedProp('editorConfigs');
		this._defineEditorDelegatedProp('operHistory');
		this._defineEditorDelegatedProp('enableOperHistory');
		this._defineEditorDelegatedProp('selection');
		this._defineEditorDelegatedProp('hotTrackedObjs');
		this._defineEditorDelegatedProp('enableOperContext');
		this._defineEditorDelegatedProp('enableCreateNewDoc');
		this._defineEditorDelegatedProp('enableLoadNewFile');
		this._defineEditorDelegatedProp('initOnNewDoc');
	},
	/**
	 * Define property that directly mapped to editor's property.
	 * @param {String} propName
	 * @param {String} editorPropName Name of corresponding property in editor.
	 * @return {Object} Property info object added to property list.
	 * @private
	 */
	_defineEditorDelegatedProp: function(propName, editorPropName)
	{
		if (!editorPropName)
			editorPropName = propName;
		var editorPropInfo = ClassEx.getPropInfo(Kekule.Editor.BaseEditor, editorPropName);
		/*
		var propOptions = {
			'serializable': editorPropInfo.serializable,
			'dataType': editorPropInfo.dataType,
			'title': editorPropInfo.title,
			'description': editorPropInfo.description,
			'getter': null,
			'setter': null
		};
		*/
		var propOptions = Object.create(editorPropInfo);
		propOptions.getter = null;
		propOptions.setter = null;
		if (editorPropInfo.getter)
		{
			propOptions.getter = function()
			{
				return this.getEditor().getPropValue(editorPropName);
			};
		}
		if (editorPropInfo.setter)
		{
			propOptions.setter = function(value)
			{
				this.getEditor().setPropValue(editorPropName, value);
			}
		}
		//console.log('define delegate prop', propOptions);
		return this.defineProp(propName, propOptions);
	},

	/** @private */
	loadPredefinedResDataToProp: function(propName, resData, success)
	{
		if (propName === 'chemObj')  // only this property can be set by predefined resource
		{
			if (success)
			{
				try
				{
					var chemObj = Kekule.IO.loadTypedData(resData.data, resData.resType, resData.resUri);
					//console.log('set predefined chemObj', chemObj);
					this.setChemObj(chemObj);
				}
				catch(e)
				{
					Kekule.raise(e, Kekule.ExceptionLevel.ERROR);
				}
			}
			else  // else, failed
			{
				Kekule.throwException(/*Kekule.ErrorMsg.CANNOT_LOAD_RES_OF_URI*/Kekule.$L('ErrorMsg.CANNOT_LOAD_RES_OF_URI') + resData.resUri || '');
			}
		}
	},

	/** @ignore */
	initPropValues: function($super)
	{
		$super();
	},

	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('div');
		return result;
	},
	/** @ignore */
	doCreateSubElements: function(doc, rootElem)
	{
		var result = [];
		var elem = doc.createElement('div');
		elem.className = CCNS.COMPOSER_EDITOR_STAGE;
		rootElem.appendChild(elem);
		this.setPropStoreFieldValue('editorStageElem', elem);
		result.push(elem);
		var elem = doc.createElement('div');
		elem.className = CCNS.COMPOSER_ADV_PANEL;
		rootElem.appendChild(elem);
		this.setPropStoreFieldValue('advPanelElem', elem);
		result.push(elem);
		return result;
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		var result = $super() + ' ' + CCNS.COMPOSER;
		return result;
	},
	/** @ignore */
	doWidgetShowStateChanged: function($super, isShown)
	{
		$super(isShown);
		if (isShown)
			this.adjustComponentPositions();
	},
	/*
	doInsertedToDom: function()
	{
		console.log('composer inserted to DOM');
	},
	*/

	/** @ignore */
	getResizerElement: function()
	{
		return this.getEditorStageElem();
	},

	/** @ignore */
	getChildActionClass: function($super, actionName, checkSupClasses)
	{
		var result = $super(actionName, checkSupClasses);
		if (!result)
			result = this.getEditor().getChildActionClass(actionName, checkSupClasses);
		return result;
	},

	/**
	 * Returns coord mode of editor.
	 * @returns {Int}
	 */
	getCoordMode: function()
	{
		return this.getEditor().getCoordMode();
	},
	/**
	 * Returns whether the chem object inside editor has been modified since load.
	 * @returns {Bool}
	 */
	isDirty: function()
	{
		return this.getEditor().isDirty();
	},
	/**
	 * Create a new object and load it in editor.
	 */
	newDoc: function()
	{
		return this.getEditor().newDoc();
	},
	/**
	 * Load chem object in composer.
	 * @param {Kekule.ChemObject} chemObj
	 */
	load: function(chemObj)
	{
		return this.getEditor().load(chemObj);
	},
	/**
	 * Returns object in dialog that to be saved.
	 * @returns {Kekule.ChemObject}
	 * @private
	 */
	getSavingTargetObj: function()
	{
		var c = this.getEditor();
		if (c)
			return c.getSavingTargetObj();
		else
			return null;
	},
	/**
	 * Returns array of classes that can be exported (saved) from composer.
	 * @returns {Array}
	 */
	getExportableClasses: function()
	{
		return this.getEditor().getExportableClasses();
	},
	/**
	 * Returns exportable object for specified class.
	 * @param {Class} objClass Set null to export default object.
	 * @returns {Object}
	 */
	exportObj: function(objClass)
	{
		return this.getEditor().exportObj(objClass);
	},
	/**
	 * Returns all exportable objects for specified class.
	 * Descendants can override this method.
	 * @param {Class} objClass Set null to export default object.
	 * @returns {Array}
	 */
	exportObjs: function(objClass)
	{
		return this.getEditor().exportObjs(objClass);
	},

	/**
	 * Undo last operation.
	 */
	undo: function()
	{
		return this.getEditor().undo();
	},
	/**
	 * Redo last operation.
	 */
	redo: function()
	{
		return this.getEditor().redo();
	},
	/**
	 * Undo all operations.
	 */
	undoAll: function()
	{
		return this.getEditor().undoAll();
	},
	/**
	 * Check if an undo action can be taken.
	 * @returns {Bool}
	 */
	canUndo: function()
	{
		return this.getEditor().canUndo();
	},
	/**
	 * Check if an undo action can be taken.
	 * @returns {Bool}
	 */
	canRedo: function()
	{
		return this.getEditor().canRedo();
	},

	/**
	 * Called after UI changing (e.g., show/hide inspector/assoc tool bar).
	 * @private
	 */
	uiLayoutChanged: function()
	{
		this.adjustComponentPositions();
	},

	/**
	 * Change child components' position and dimension to fit current UI widget status.
	 * @private
	 */
	adjustComponentPositions: function()
	{
		// toolbar
		var commonToolbarElem = this.getCommonBtnGroup()? this.getCommonBtnGroup().getElement(): null;
		var zoomToolbarElem = this.getZoomBtnGroup()? this.getZoomBtnGroup().getElement(): null;
		var chemToolbarElem = this.getChemBtnGroup()? this.getChemBtnGroup().getElement(): null;

		if (!commonToolbarElem || !chemToolbarElem)  // not all toolbars created, widget may in its initial stage, no need to update
			return;

		if (commonToolbarElem)
			var commonRect = Kekule.HtmlElementUtils.getElemBoundingClientRect(commonToolbarElem);
		if (zoomToolbarElem)
			var zoomRect = Kekule.HtmlElementUtils.getElemBoundingClientRect(zoomToolbarElem);
		if (chemToolbarElem)
			var chemRect = Kekule.HtmlElementUtils.getElemBoundingClientRect(chemToolbarElem);

		if (!commonRect.width || !chemRect.width)  // rect is zero, the widget may not be displayed
			return;

		var style = commonToolbarElem.style;
		style.top = '0px';
		style.left = chemRect.width + 'px';
		style = chemToolbarElem.style;
		style.top = commonRect.height + 'px';
		style.left = '0px';

		// editor
		var top, left, right, bottom;
		// calc top
		//var elem = this.getCommonBtnGroup().getElement();
		var rect = commonRect; //Kekule.HtmlElementUtils.getElemBoundingClientRect(elem);
		top = rect.height;
		// calc left
		//var elem = this.getChemBtnGroup().getElement();
		var rect = chemRect; //Kekule.HtmlElementUtils.getElemBoundingClientRect(elem);
		left = rect.width;
		// calc bottom
		var bottom = zoomRect? zoomRect.height: 0;

		/*
		if (this.isAssocToolbarShown())
		{
			var elem = this.getAssocBtnGroup().getElement();
			var rect = Kekule.HtmlElementUtils.getElemBoundingClientRect(elem);
			bottom += rect.height;
		}
		if (this.isStyleToolbarShown())
		{
			var elem = this.getStyleToolbar().getElement();
			var rect = Kekule.HtmlElementUtils.getElemBoundingClientRect(elem);
			bottom += rect.height;
		}
		*/

		// calc right
		if (!this.getShowInspector())
			right = 0;
		else
		{
			var elem = this.getAdvPanelElem();
			var rect = Kekule.HtmlElementUtils.getElemBoundingClientRect(elem);
			right = rect.width;
		}

		var stageElem = this.getEditorStageElem();
		var style = stageElem.style;
		style.position = 'absolute';
		style.top = top + 'px';
		style.left = left + 'px';
		style.bottom = bottom + 'px';
		style.right = right + 'px';

		// advPanel
		elem = this.getAdvPanelElem();
		style = elem.style;
		style.position = 'absolute';
		style.top = top + 'px';
		style.bottom = bottom + 'px';
	},

	/** @private */
	adjustAssocToolbarPositions: function()
	{
		//var commonToolbarElem = this.getCommonBtnGroup().getElement();
		var chemToolbarElem = this.getChemBtnGroup().getElement();
		//var commonRect= Kekule.HtmlElementUtils.getElemBoundingClientRect(commonToolbarElem)
		var chemRect = Kekule.HtmlElementUtils.getElemBoundingClientRect(chemToolbarElem);
		// assoc and style toolbar
		if (this.isAssocToolbarShown())
		{
			var elem = this.getAssocBtnGroup().getElement();
			elem.style.left = chemRect.width + 'px';
			//elem.style.top = commonRect.height + 'px';
		}
		if (this.isStyleToolbarShown())
		{
			var elem = this.getStyleToolbar().getElement();
			elem.style.left = chemRect.width + 'px';
		}
	},

	////////////////// methods about inner editor  ///////////////////////
	/** @private */
	bindEditor: function(editor)
	{
		if (!editor)
			editor = this.getEditor();
		else
			editor.setParent(this);
		var self = this;
		var commonActions = this.getCommonActions();
		var chemActions = this.getChemActions();
		this.createIaControllers(editor);
		editor.addEventListener('load', function(e)
			{
				this.updateAllActions();
				this.updateUiWidgets();
				// turn select as default checked chem tool
				var actions = this.getChemActions();
				var action = actions.getActionAt(0);
				if (action)
					action.execute();
			},
			this
		);
		editor.addEventListener('operChange', function(e)
			{
				commonActions.updateAll();
				this.updateUiWidgets();
			},
			this
		);
		editor.addEventListener('selectionChange', function(e)
			{
				commonActions.updateAll();
				this.updateUiWidgets();
			},
			this
		);
		/*
		editor.addEventListener('editObjsChanged', function(e)
			{
				this.updateAllActions();
			},
			this
		);
		*/
		editor.appendToElem(this.getEditorStageElem());
		this.getEditorNexus().setEditor(editor);
	},
	/** @private */
	createDefaultEditor: function()
	{
		var result = new Kekule.Editor.ChemSpaceEditor(this, null, Kekule.Render.RendererType.R2D);
		result.addClassName(CNS.DYN_CREATED);
		return result;
	},

	/**
	 * Create available iaController for editor.
	 * @private
	 */
	createIaControllers: function(editor)
	{
		var controllerClasses = Kekule.Editor.IaControllerManager.getAvailableControllerClasses(editor.getClass());
		for (var i = 0, l = controllerClasses.length; i < l; ++i)
		{
			var c = controllerClasses[i];
			var controller = new c(editor);
			//console.log('add ia controller', controller.getDefId(), controller);
			editor.addIaController(controller.getDefId(), controller);
		}
	},

	///////////////// methods about adv panel (objInspector and structureTreeView) /////
	/** @private */
	showInspectorChanged: function()
	{
		var display = this.getShowInspector();
		if (display)
		{
			if (!this.getObjInspector())  // not created yet
				this.createAdvControls();
			this.showAdvPanel();
		}
		else
			this.hideAdvPanel();
		this.uiLayoutChanged();
	},

	/**
	 * Create object inspector and structure tree view.
	 * @private
	 */
	createAdvControls: function(parentElem)
	{
		if (!parentElem)
			parentElem = this.getAdvPanelElem();

		var doc = this.getDocument();

		var treeView = new Kekule.ChemWidget.StructureTreeView(doc);
		treeView.setItemInitialExpanded(true);
		treeView.appendToElem(parentElem);
		//treeView.setRootObj(chemEditor.getChemObj());
		this.setPropStoreFieldValue('structureTreeView', treeView);

		var objInspector = new Kekule.Widget.ObjectInspector(doc);
		objInspector.setShowPropInfoPanel(false);
		objInspector.appendToElem(parentElem);
		this.setPropStoreFieldValue('objInspector', objInspector);

		var nexus = this.getEditorNexus();
		nexus.setObjectInspector(objInspector);
		nexus.setStructureTreeView(treeView);
	},
	/** @private */
	showAdvPanel: function()
	{
		this.getAdvPanelElem().style.display = 'block';
	},
	/** @private */
	hideAdvPanel: function()
	{
		this.getAdvPanelElem().style.display = 'none';
	},

	////////////////// methods about tool buttons and actions  ///////////////////////

	/* @private */
	/*
	_createDefaultToolButtonNameMapping: function()
	{
		var result = {};
		result[BNS.newDoc] = CE.ActionEditorNewDoc;
		result[BNS.loadFile] = CW.ActionDisplayerLoadFile;
		result[BNS.loadData] = CW.ActionDisplayerLoadData;
		result[BNS.saveData] = CW.ActionDisplayerSaveFile;
		result[BNS.zoomIn] = CW.ActionDisplayerZoomIn;
		result[BNS.zoomOut] = CW.ActionDisplayerZoomOut;
		result[BNS.reset] = CW.ActionDisplayerReset;
		result[BNS.config] = Kekule.Widget.ActionOpenConfigWidget;
		result[BNS.undo] = CE.ActionEditorUndo;
		result[BNS.redo] = CE.ActionEditorRedo;
		result[BNS.cloneSelection] = CE.ActionCloneSelection;
		result[BNS.copy] = CE.ActionCopySelection;
		result[BNS.cut] = CE.ActionCutSelection;
		result[BNS.paste] = CE.ActionPaste;

		result[BNS.manipulate] = CE.ActionComposerSetManipulateController;
		result[BNS.erase] = CE.ActionComposerSetEraserController;
		result[BNS.molAtom] = CE.ActionComposerSetAtomController;
		result[BNS.molFormula] = CE.ActionComposerSetFormulaController;
		result[BNS.molBond] = CE.ActionComposerSetBondController;
		result[BNS.molCharge] = CE.ActionComposerSetNodeChargeController;
		result[BNS.textBlock] = CE.ActionComposerSetTextBlockController;
		result[BNS.imageBlock] = CE.ActionComposerSetImageBlockController;
		result[BNS.textImage] = CE.ActionComposerSetTextImageController;
		result[BNS.molRing] = CE.ActionComposerSetRepositoryRingController;
		result[BNS.glyph] = CE.ActionComposerSetRepositoryGlyphController;

		result[BNS.objInspector] = CE.ActionComposerToggleInspector;

		return result;
	},
	*/
	/** @private */
	getDefaultCommonToolBarButtons: function()
	{
		return Kekule.globalOptions.chemWidget.composer.commonToolButtons;
		/*
		var buttons = [
			BNS.newDoc,
			//BNS.loadFile,
			BNS.loadData,
			BNS.saveData,
			BNS.undo,
			BNS.redo,
			BNS.copy,
			BNS.cut,
			BNS.paste,
			//BNS.cloneSelection,
			BNS.zoomIn,
			BNS.reset,
			BNS.zoomOut,
			BNS.config,
			BNS.objInspector
		];
		return buttons;
		*/
	},
	/** @private */
	getZoomButtonNames: function()
	{
		return [
			BNS.zoomIn,
			BNS.zoomOut,
			BNS.reset
		];
	},
	/** @private */
	getDefaultChemToolBarButtons: function()
	{
		return Kekule.globalOptions.chemWidget.composer.chemToolButtons;
		/*
		var buttons = [
			BNS.manipulate,
			BNS.erase,
			BNS.molBond,
			BNS.molAtom,
			BNS.molFormula,
			BNS.molRing,
			BNS.molCharge,
			BNS.glyph,
			BNS.textImage
		];
		return buttons;
		*/
	},

	/** @private */
	getCompActionClass: function(btnName)
	{
		//return this.getToolButtonNameMapping()[btnName];
		return this.getChildActionClass(btnName, true);
	},
	/** @private */
	_getActionTargetWidget: function(actionClass)
	{
		if (ClassEx.isOrIsDescendantOf(actionClass, Kekule.Editor.ActionOnComposer) || ClassEx.isOrIsDescendantOf(actionClass, Kekule.Widget.ActionOpenConfigWidget))
			return this;
		else
			return this.getEditor();
	},
	/**
	 * Create a tool button inside parent button group.
	 * //@param {Kekule.Widget} targetWidget
	 * @param {String} btnName
	 * @param {Kekule.Widget.ButtonGroup} parentGroup
	 * @param {Kekule.Action} actions
	 * @returns {Kekule.Widget.Button}
	 * @private
	 */
	createToolButton: function(btnName, parentGroup, actions, checkGroup)
	{
		/*
		var result = null;
		var name = DataType.isObjectValue(btnName)? btnName.name: btnName;
		var children = DataType.isObjectValue(btnName)? btnName.attached: null;
		var actionClass = this.getCompActionClass(name);

		if (DataType.isObjectValue(btnName) && !actionClass)  // custom button
		{
			if (!actionClass)  // no binded action, custom button
			var objDefHash = Object.extend({'widget': Kekule.Widget.Button}, btnName);
			result = Kekule.Widget.Utils.createFromHash(parentGroup, objDefHash);
			var actionClass = objDefHash.actionClass;
			if (actionClass)  // create action
			{
				if (typeof(actionClass) === 'string')
					actionClass = ClassEx.findClass(objDefHash.actionClass);
				if (actionClass)
				{
					var action = new actionClass(this);
					this.getActions().add(action);
					result.setAction(action);
				}
			}
		}
		else
		{
			//var actionClass = this.getCompActionClass(btnName);
			//if (actionClass)
			{
				var btnClass = (btnName === BNS.objInspector) ? Kekule.Widget.CheckButton :
					(!!checkGroup) ? Kekule.Widget.RadioButton :
						Kekule.Widget.Button;
				result = new btnClass(parentGroup);
				var targetWidget = this._getActionTargetWidget(actionClass);
				var action = new actionClass(targetWidget);
				if (checkGroup)
					action.setCheckGroup(checkGroup);
				//this.getActions().add(action);
				actions.add(action);
				result.setAction(action);
			}
		}

		return result;
		*/
		var result = null;
		var name = DataType.isObjectValue(btnName)? btnName.name: btnName;
		var actionClass = this.getCompActionClass(name);
		var action = this._createToolButtonAction(btnName, actions, checkGroup);

		if (DataType.isObjectValue(btnName) && !actionClass)  // custom button
		{
			if (!actionClass)  // no binded action, custom button
				var objDefHash = Object.extend({'widget': Kekule.Widget.Button}, btnName);
			result = Kekule.Widget.Utils.createFromHash(parentGroup, objDefHash);
		}
		else  // predefined names
		{
			var btnClass = (btnName === BNS.objInspector) ? Kekule.Widget.CheckButton :
					(!!checkGroup) ? Kekule.Widget.RadioButton :
					Kekule.Widget.Button;
			result = new btnClass(parentGroup);
		}
		if (action)
			result.setAction(action);
	},
	/** @private */
	_createToolButtonAction: function(actionNameOrHash, defActions, checkGroup)
	{
		var result = null;
		var name = DataType.isObjectValue(actionNameOrHash)? actionNameOrHash.name: actionNameOrHash;
		var children = DataType.isObjectValue(actionNameOrHash)? actionNameOrHash.attached: null;
		var actionClass = this.getCompActionClass(name);

		var result;

		if (DataType.isObjectValue(actionNameOrHash) && !actionClass)  // custom button
		{
			var objDefHash = actionNameOrHash;
			var actionClass = objDefHash.actionClass;
			if (actionClass)  // create action
			{
				if (typeof(actionClass) === 'string')
					actionClass = ClassEx.findClass(objDefHash.actionClass);
			}
		}

		if (actionClass)
		{
			var actionMap = this.getActionMap();
			// check if this action already exists
			var result = actionMap.get(actionClass);
			if (!result)
			{
				var result = new actionClass(this._getActionTargetWidget(actionClass));
				//this.getActions().add(action);
				actionMap.set(actionClass, result);
			}
			if (checkGroup)
				result.setCheckGroup(checkGroup);

			if (result && defActions)
				defActions.add(result);

			if (result && result.addAttachedAction)
			{
				//result.setChecked(false);
				var subGroupName = result.getClassName();
				// result.clearAttachedActions();
				var oldAttachedActions = Kekule.ArrayUtils.clone(result.getAttachedActions().getActions() || []);

				var attachChildAction = function(action, childAction, oldAttachedActions, asDefault)
				{
					if (!childAction)
						return null;
					var oldIndex = oldAttachedActions.indexOf(childAction);
					if (oldIndex >= 0)  // action already attached, bypass
					{
						oldAttachedActions[oldIndex] = null;
						//console.log('use old action', oldIndex, childAction.getClassName());
					}
					else
						action.addAttachedAction(childAction, asDefault);
				};

				if (children)  // has custom defined chem tool children buttons
				{
					for (var i = 0, l = children.length; i < l; ++i)
					{
						var child = children[i];
						var childAction = this._createToolButtonAction(child, null, subGroupName); // do not add to default action list
						attachChildAction(result, childAction, oldAttachedActions, i === 0);
					}
				}
				else  // use default attached classes
				{
					var attachedActionClasses = result.getAttachedActionClasses();
					if (attachedActionClasses)
					{
						for (var i = 0, l = attachedActionClasses.length; i < l; ++i)
						{
							var aClass = attachedActionClasses[i];
							var childAction = actionMap.get(aClass);
							if (!childAction)
							{
								childAction = new aClass(this._getActionTargetWidget(aClass));
								childAction.setCheckGroup(subGroupName);
								actionMap.set(aClass, childAction);
							}
							/*
							else
							{
								console.log('use old action', childAction.getClassName());
								if (childAction.getAttachedActions)
									console.log(childAction.getAttachedActions().getActions());
							}
							*/
							//result.addAttachedAction(childAction, i === 0);
							attachChildAction(result, childAction, oldAttachedActions, i === 0);
						}
					}
				}
				// at last remove unused old actions
				if (oldAttachedActions.length)
				{
					//var actions = result.getAttachedActions();
					for (var i = 0, l = oldAttachedActions.length; i < l; ++i)
					{
						var unusedAction = oldAttachedActions[i];
						if (unusedAction)
						{
							result.removeAttachedAction(unusedAction);
							//actions.remove(unusedAction);
							actionMap.remove(unusedAction.getClass());
							//unusedAction.finalize();
							console.log('remove action', unusedAction.getClassName(), unusedAction.getAttachedActions().getActions());
						}
					}
				}
			}
		}

		return result;
	},

	/**
	 * Create a toolbar inside editor UI.
	 * @returns {Kekule.Widget.ButtonGroup}
	 * @private
	 */
	createInnerToolbar: function()
	{
		var toolBar = new Kekule.Widget.ButtonGroup(this);
		toolBar.addClassName(CCNS.COMPOSER_TOOLBAR);
		toolBar.addClassName(CCNS.INNER_TOOLBAR);
		toolBar.addClassName(CNS.DYN_CREATED);
		toolBar.setShowText(false);
		toolBar.doSetShowGlyph(true);
		toolBar.appendToElem(this.getElement());
		return toolBar;
	},
	/**
	 * Create common tool bar.
	 * @returns {Kekule.Widget.ButtonGroup}
	 * @private
	 */
	createCommonToolbar: function()
	{
		var toolbar = this.createInnerToolbar();
		toolbar.addClassName(CCNS.COMPOSER_COMMON_TOOLBAR);
		// add buttons
		var btns = this.getCommonToolButtons();
		btns = Kekule.ArrayUtils.exclude(btns, this.getZoomButtonNames());
		var actions = this.getCommonActions();
		var editor = this.getEditor();
		actions.clear();
		for (var i = 0, l = btns.length; i < l; ++i)
		{
			var name = btns[i];
			var btn = this.createToolButton(name, toolbar, actions);
		}
		this.setCommonBtnGroup(toolbar);
		toolbar.addClassName(CNS.DYN_CREATED);

		this.updateZoomToolbar();

		this.adjustComponentPositions();
		return toolbar;
	},
	/**
	 * Create zoom tool bar.
	 * @returns {Kekule.Widget.ButtonGroup}
	 * @private
	 */
	createZoomToolbar: function()
	{
		// add buttons
		var btns = Kekule.ArrayUtils.intersect(this.getCommonToolButtons(), this.getZoomButtonNames());
		if (btns.length)
		{
			var toolbar = this.createInnerToolbar();
			toolbar.addClassName(CCNS.COMPOSER_ZOOM_TOOLBAR);
			var actions = this.getZoomActions();
			var editor = this.getEditor();
			actions.clear();
			for (var i = 0, l = btns.length; i < l; ++i)
			{
				var name = btns[i];
				var btn = this.createToolButton(name, toolbar, actions);
			}
			this.setZoomBtnGroup(toolbar);
			toolbar.addClassName(CNS.DYN_CREATED);
			this.adjustComponentPositions();
			return toolbar;
		}
		else
		{
			this.setZoomBtnGroup(null);
			return null;
		}
	},
	/**
	 * Update common toolbar, actually free the old one and create a new one.
	 * @private
	 */
	updateCommonToolbar: function()
	{
		var old = this.getCommonBtnGroup();
		if (old)
			old.finalize();
		this.createCommonToolbar();
	},
	/**
	 * Update zoom toolbar, actually free the old one and create a new one.
	 * @private
	 */
	updateZoomToolbar: function()
	{
		var old = this.getZoomBtnGroup();
		if (old)
			old.finalize();
		this.createZoomToolbar();
	},
	/**
	 * Create chem tool bar.
	 * @returns {Kekule.Widget.ButtonGroup}
	 * @private
	 */
	createChemToolbar: function()
	{
		var toolbar = this.createInnerToolbar();
		toolbar.addClassName(CCNS.COMPOSER_CHEM_TOOLBAR);
		toolbar.setLayout(Kekule.Widget.Layout.VERTICAL);
		// add buttons
		var btns = this.getChemToolButtons();
		var actions = this.getChemActions();
		actions.clear();
		var checkGroup = 'chemTools';
		for (var i = 0, l = btns.length; i < l; ++i)
		{
			var name = btns[i];
			var btn = this.createToolButton(name, toolbar, actions, checkGroup);
		}
		this.setChemBtnGroup(toolbar);
		toolbar.addClassName(CNS.DYN_CREATED);
		// TODO: when change chem toolbar, associate toolbar should also change. Now we only simply clear it.
		this.bindAssocActions(null);
		this.adjustComponentPositions();
		return toolbar;
	},
	/**
	 * Update chem toolbar, actually free the old one and create a new one.
	 * @private
	 */
	updateChemToolbar: function()
	{
		var old = this.getChemBtnGroup();
		if (old)
			old.finalize();
		this.createChemToolbar();
	},

	/**
	 * Create assoc chem tool bar.
	 * @returns {Kekule.Widget.ButtonGroup}
	 * @private
	 */
	createAssocToolbar: function()
	{
		var toolbar = this.createInnerToolbar();
		//toolbar.setLayout(Kekule.Widget.Layout.VERTICAL);
		toolbar.addClassName(CCNS.COMPOSER_ASSOC_TOOLBAR);
		this.setAssocBtnGroup(toolbar);
		this.adjustAssocToolbarPositions();
		toolbar.addClassName(CNS.DYN_CREATED);
		return toolbar;
	},
	/**
	 * Show assoc chem tool bar.
	 */
	showAssocToolbar: function()
	{
		var toolbar = this.getAssocBtnGroup();
		if (!toolbar)
			toolbar = this.createAssocToolbar();
		var self = this;

		/*
		if (this.isStyleToolbarShown())  // need to hide style toolbar first
		{
			console.log('here hide style');
			this.hideStyleToolbar();
		}
		*/

		toolbar.show(null, function()
		{
			self.uiLayoutChanged();
			//self.updateStyleToolbarState();
			setTimeout(self.updateStyleToolbarStateBind, 0);  // IMPORTANT, defer call to update style toolbar, avoid show/hide it too quickly
		});
		return this;
	},
	/**
	 * Hide assoc chem tool bar.
	 */
	hideAssocToolbar: function()
	{
		var toolbar = this.getAssocBtnGroup();
		if (toolbar)
		{
			var self = this;
			toolbar.hide(null, function()
				{
					self.uiLayoutChanged();
					//self.updateStyleToolbarState(); // may need to reopen style toolbar
					setTimeout(self.updateStyleToolbarStateBind, 0);  // IMPORTANT, defer call to update style toolbar, avoid show/hide it too quickly
				}
			);
		}
		return this;
	},
	/**
	 * Check if assoc chem tool bar is visible.
	 * @returns {Bool}
	 */
	isAssocToolbarShown: function()
	{
		var toolbar = this.getAssocBtnGroup();
		return toolbar && toolbar.isShown();
	},
	/**
	 * Create buttons in assoc tool bar to display actions.
	 * @param {Kekule.ActionList} actions
	 * @private
	 */
	bindAssocActions: function(actions)
	{
		var toolbar = this.getAssocBtnGroup();
		if (!toolbar)
			toolbar = this.createAssocToolbar();
		toolbar.clearWidgets();
		if (actions)
		{
			for (var i = 0, l = actions.getActionCount(); i < l; ++i)
			{
				var action = actions.getActionAt(i);
				var checkGroup = action.getCheckGroup();
				var btnClass = (!!checkGroup) ? Kekule.Widget.RadioButton : Kekule.Widget.Button;
				var btn = new btnClass(toolbar);
				btn.setAction(action);
			}
		}
	},

	/**
	 * Create style setting tool bar.
	 * @returns {Kekule.Widget.ButtonGroup}
	 * @private
	 */
	createStyleToolbar: function()
	{
		if (this.getEnableStyleToolbar())
		{
			var toolbar = new Kekule.Editor.ComposerStyleToolbar(this);
			toolbar.setComponentNames(this.getStyleBarComponents());
			this.setStyleToolbar(toolbar);
			this.adjustAssocToolbarPositions();
			this.updateStyleToolbarState();
			return toolbar;
		}
		else
			return null;
	},
	/**
	 * Show style tool bar.
	 */
	showStyleToolbar: function()
	{
		//console.log('show style');
		if (this.getEnableStyleToolbar())
		{
			var toolbar = this.getStyleToolbar();
			if (!toolbar.isShown())
			{
				var self = this;
				toolbar.show(null, function()
				{
					self.uiLayoutChanged();
				});
			}
		}
		return this;
	},
	/**
	 * Hide style tool bar.
	 */
	hideStyleToolbar: function()
	{
		//console.log('hide style');
		var toolbar = this.getPropStoreFieldValue('styleToolbar');
		if (toolbar)
		{
			if (toolbar.isShown())
			{
				var self = this;
				toolbar.hide(null, function()
					{
						self.uiLayoutChanged();
					}
				);
			}
		}
		return this;
	},
	/**
	 * Check if style tool bar is visible.
	 * @returns {Bool}
	 */
	isStyleToolbarShown: function()
	{
		var toolbar = this.getPropStoreFieldValue('styleToolbar'); //this.getStyleToolbar();
		return (toolbar && toolbar.isShown());
	},
	/**
	 * Check if style toolbar should be shown.
	 * @private
	 */
	needShowStyleToolbar: function()
	{
		var editor = this.getEditor();
		return editor && editor.hasSelection() && (!this.isAssocToolbarShown());
	},

	/**
	 * Update style toolbar show/hide state according to editor's state.
	 * @private
	 */
	updateStyleToolbarState: function()
	{
		if (this.getEnableStyleToolbar() && this.needShowStyleToolbar())
		{
			this.showStyleToolbar();
			this.getStyleToolbar().updateState();
		}
		else
		{
			this.hideStyleToolbar();
		}
	},

	/**
	 * Update both common and chem actions.
	 * @private
	 */
	updateAllActions: function()
	{
		this.getCommonActions().updateAll();
		this.getZoomActions().updateAll();
		this.getChemActions().updateAll();
	},
	/**
	 * Update states of child UI widgets.
	 * @private
	 */
	updateUiWidgets: function()
	{
		this.updateStyleToolbarState();
	},

	////// about configurator
	/** @ignore */
	createConfigurator: function($super)
	{
		var result = $super();
		result.addEventListener('configChange', function(e){
			// render config change need to repaint context
			this.getEditor().repaint();
		}, this);
		return result;
	}
});

/**
 * A special class to give a setting facade for Chem Composer.
 * Do not use this class alone.
 * @class
 * @augments Kekule.Widget.BaseWidget.Settings
 */
Kekule.Editor.Composer.Settings = Class.create(Kekule.Widget.BaseWidget.Settings,
/** @lends Kekule.Editor.Composer.Settings# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.Composer.Settings',
	/** @construct */
	initialize: function($super, composer)
	{
		$super(composer);
	},
	/** @private */
	initProperties: function()
	{
		//this.defineProp('composer', {'dataType': 'Kekule.Editor.Composer', 'serializable': false, 'scope': PS.PUBLIC});
		this.defineDelegatedProps(['enableCreateNewDoc', 'enableLoadNewFile', 'initOnNewDoc', 'enableOperHistory', 'allowCreateNewChild', 'enableStyleToolbar']);
	}
});

/**
 * A special widget class to open a config widget for ChemObjDisplayer.
 * Do not use this widget alone.
 * @class
 * @augments Kekule.Widget.Configurator
 *
 * @param {Kekule.Editor.Composer} composer
 */
Kekule.Editor.Composer.Configurator = Class.create(Kekule.Widget.Configurator,
/** @lends Kekule.Editor.Composer.Configurator# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.Composer.Configurator',
	/** @private */
	TAB_BTN_DATA_FIELD: '__$data__',
	/** @construct */
	initialize: function($super, composer)
	{
		$super(composer);
	},
	/** @ignore */
	initPropValues: function($super)
	{
		$super();
		this.setLayout(Kekule.Widget.Layout.HORIZONTAL);
	},
	/** @private */
	getCategoryInfos: function($super)
	{
		var result = $super();
		var composer = this.getComposer();
		var editor = composer.getEditor();

		// renderConfigs and displayerConfigs
		var configObjs = [editor.getDisplayerConfigs(), editor.getRenderConfigs()];
		for (var j = 0, k = configObjs.length; j < k; ++j)
		{
			var config = configObjs[j];
			var props = config.getPropListOfScopes([Class.PropertyScope.PUBLISHED]);
			for (var i = 0, l = props.getLength(); i < l; ++i)
			{
				var propInfo = props.getPropInfoAt(i);
				var obj = config.getPropValue(propInfo.name);
				if (obj)
				{
					result.push({
						'obj': obj,
						'name': propInfo.name,
						'title': propInfo.title,
						'description': propInfo.description
					});
				}
			}
		}
		return result;
	},
	/** @private */
	getComposer: function()
	{
		return this.getWidget();
	},
	/** @private */
	getEditor: function()
	{
		return this.getComposer().getEditor();
	}
});

// register predefined settings of viewer
var SM = Kekule.ObjPropSettingManager;
SM.register('Kekule.Editor.Composer.fullFunc', {  // composer with all functions
	enableStyleToolbar: true,
	enableOperHistory: true,
	enableLoadNewFile: true,
	enableCreateNewDoc: true,
	allowCreateNewChild: true,
	commonToolButtons: null,   // create all default common tool buttons
	chemToolButtons: null,   // create all default chem tool buttons
	styleToolComponentNames: null  // create all default style components
});
SM.register('Kekule.Editor.Composer.molOnly', {  // composer that can only edit molecule
	enableStyleToolbar: true,
	enableOperHistor: true,
	enableLoadNewFile: true,
	enableCreateNewDoc: true,
	allowCreateNewChild: true,
	commonToolButtons: null,   // create all default common tool buttons
	chemToolButtons: [
		BNS.manipulate,
		BNS.erase,
		BNS.molBond,
		BNS.molAtom,
		BNS.molFormula,
		BNS.molRing,
		BNS.molCharge
	],   // create only chem tool buttons related with molecule
	styleToolComponentNames: null  // create all default style components
});
SM.register('Kekule.Editor.Composer.compact', {  // composer with less tool buttons
	enableStyleToolbar: false,
	commonToolButtons: [
		BNS.newDoc,
		BNS.loadData,
		BNS.saveData,
		BNS.undo,
		BNS.redo
	],
	chemToolButtons: null,   // create all default chem tool buttons
	styleToolComponentNames: null  // create all default style components
});
SM.register('Kekule.Editor.Composer.singleObj', {  // only allows create one object in composer
	allowCreateNewChild: false
});

/**
 * A dialog with a composer, executed to edit or create new chem object.
 * @class
 * @augments Kekule.Widget.Dialog
 *
 * @property {Kekule.Editor.Composer} composer Composer widget in dialog.
 * @property {Kekule.ChemObject} chemObj Get or set chem object in composer.
 */
Kekule.Editor.ComposerDialog = Class.create(Kekule.Widget.Dialog,
/** @lends Kekule.Editor.ComposerDialog# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ComposerDialog',
	initialize: function($super, parentOrElementOrDocument, caption, buttons)
	{
		$super(parentOrElementOrDocument, caption,
			buttons || [Kekule.Widget.DialogButtons.OK, Kekule.Widget.DialogButtons.CANCEL]);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('composer', {'dataType': 'Kekule.Editor.Composer', 'serializable': false, 'setter': null});
		this.defineProp('chemObj', {'dataType': 'Kekule.ChemObject', 'serializable': false,
			'getter': function()
			{
				var c = this.getComposer();
				return c && c.getChemObj();
			},
			'setter': function(value)
			{
				var c = this.getComposer();
				if (c)
					c.setChemObj(value);
			}
		});
	},
	/** @ignore */
	initPropValues: function($super)
	{
		$super();
		//this.setButtons([Kekule.Widget.DialogButtons.OK, Kekule.Widget.DialogButtons.CANCEL]);
	},

	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CCNS.COMPOSER_DIALOG;
	},
	/** @ignore */
	doCreateClientContents: function($super, clientElem)
	{
		$super();
		var composer = this.doCreateComposerWidget();
		this.setPropStoreFieldValue('composer', composer);
		composer.appendToElem(clientElem);
	},

	/**
	 * Returns object in dialog that to be saved.
	 * @returns {Kekule.ChemObject}
	 * @private
	 */
	getSavingTargetObj: function()
	{
		var c = this.getComposer();
		if (c)
			return c.getSavingTargetObj();
		else
			return null;
	},

	/**
	 * @private
	 */
	doCreateComposerWidget: function()
	{
		// TODO: currently fixed to composer
		var result = new Kekule.Editor.Composer(this);
		result.addClassName(CNS.DYN_CREATED);
		if (result.setResizable)
			result.setResizable(true);
		var editor = result.getEditor();
		/*
		editor.setEnableCreateNewDoc(false);
		editor.setEnableLoadNewFile(false);
		editor.setAllowCreateNewChild(false);
		*/
		editor.addClassName(CNS.DYN_CREATED);
		return result;
	}
});

})();
