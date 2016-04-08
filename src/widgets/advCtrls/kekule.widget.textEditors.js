/**
 * @fileoverview
 * Implementation of an advanced plain text editor.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /utils/kekule.domUtils.js
 * requires /xbrowsers/kekule.x.js
 * requires /widgets/kekule.widget.base.js
 * requires /widgets/kekule.widget.sys.js
 * requires /widgets/kekule.widget.styleResources.js
 * requires /widgets/commonCtrls/kekule.widget.formControls.js
 */

(function(){
"use strict";

var DU = Kekule.DomUtils;
var EU = Kekule.HtmlElementUtils;
var CNS = Kekule.Widget.HtmlClassNames;
//var CWT = Kekule.WidgetTexts;

/** @ignore */
Kekule.Widget.HtmlClassNames = Object.extend(Kekule.Widget.HtmlClassNames, {
	TEXTEDITOR: 'K-TextEditor',
	TEXTEDITOR_TOOLBAR: 'K-TextEditor-Toolbar',
	TEXTEDITOR_TEXTAREA: 'K-TextEditor-TextArea',
	TEXTEDITOR_FONTBOX: 'K-TextEditor-FontBox',
	TEXTEDITOR_BTN_FONTSIZEINC: 'K-TextEditor-Btn-FontSizeInc',
	TEXTEDITOR_BTN_FONTSIZEDEC: 'K-TextEditor-Btn-FontSizeDec',
	TEXTEDITOR_BTN_TEXTWRAP: 'K-TextEditor-Btn-TextWrap'
});

/**
 * An widget to edit plain text.
 * @class
 * @augments Kekule.Widget.FormWidget
 *
 * @property {String} text Text in editor.
 * @property {Bool} readOnly
 * @property {String} wrap Wrap mode of textarea in editor, value between "virtual", "physical" and "off".
 * @property {Bool} showToolbar Whether show toolbar in editor.
 * @property {Array} toolbarComponents Shown widgets in toolbar.
 * @property {Array} candidateFontFamilies Array of font names that may be shown in font family combo box in toolbar.
 * @property {Float} fontSizeLevel Size of text in editor. E.g., set this property value to 1.2 will add a 1.2em rule to textarea.
 */
/**
 * Invoked when the color value is selected. Event param of it has field: {value, colorClassName}.
 * @name Kekule.Widget.TextEditor#valueSet
 * @event
 */
Kekule.Widget.TextEditor = Class.create(Kekule.Widget.FormWidget,
/** @lends Kekule.Widget.TextEditor# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.TextEditor',
	/** @private */
	BINDABLE_TAG_NAMES: ['div', 'span'],
	/** @private */
	DEF_TOOLBAR_COMPONENTS: ['fontFamily', 'fontSizeInc', 'fontSizeDec', 'textWrap'],
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument)
	{
		this._toolCompWidgets = [];
		this.setPropStoreFieldValue('showToolbar', true);
		$super(parentOrElementOrDocument);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('text', {'dataType': DataType.STRING, 'serializable': false,
			'getter': function()
			{
				var textArea = this.getTextArea();
				return textArea? textArea.getText(): null;
			},
			'setter': function(value)
			{
				var textArea = this.getTextArea();
				if (textArea)
				{
					textArea.setText(value);
				}
			}
		});
		this.defineProp('readOnly', {'dataType': DataType.BOOL, 'serializable': false,
			'getter': function() { return this.getTextArea().getReadOnly(); },
			'setter': function(value) { return this.getTextArea().setReadOnly(value); }
		});
		this.defineProp('wrap', {'dataType': DataType.STRING, 'serializable': false,
			'getter': function() { return this.getTextArea().getWrap(); },
			'setter': function(value)
			{
				var result = this.getTextArea().setWrap(value);
				this.updateToolButtonStates();
				return result;
			}
		});
		// private
		this.defineProp('textArea', {'dataType': 'Kekule.Widget.TextArea', 'serializable': false, 'setter': null,
			'scope': Class.PropertyScope.PRIVATE,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('textArea');
				if (!result)
				{
					result = this.createTextArea();
					this.setPropStoreFieldValue('textArea', result);
				}
				return result;
			}
		});
		// private
		this.defineProp('toolbar', {'dataType': 'Kekule.Widget.Toolbar', 'serializable': false, 'setter': null,
			'scope': Class.PropertyScope.PRIVATE,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('toolbar');
				if (!result)
				{
					if (this.getShowToolbar())
					{
						result = this.createToolbar();
						this.setPropStoreFieldValue('styleToolbar', result);
					}
				}
				return result;
			}
		});
		this.defineProp('showToolbar', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('showToolbar', value);
				var toolbar = this.getToolbar();
				toolbar.setDisplayed(value);
			}
		});
		this.defineProp('toolbarPos', {'dataType': DataType.INT,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('toolbarPos', value);
				this.updateChildWidgetPos();
			}
		});
		this.defineProp('toolbarComponents', {'dataType': DataType.ARRAY, 'serializable': false,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('toolbarComponents');
				if (!result)
				{
					result = null;  // default one
					this.setPropStoreFieldValue('toolbarComponents', result);
				}
				return result;
			},
			'setter': function(value)
			{
				this.setPropStoreFieldValue('toolbarComponents', value);
				this.recreateToolbarComponents(value);
			}
		});
		this.defineProp('candidateFontFamilies', {'dataType': DataType.ARRAY});
		this.defineProp('fontSizeLevel', {'dataType': DataType.FLOAT,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('fontSizeLevel', value);
				this.setTextStyle({'fontSize': '' + value + 'em'});
			}
		});
	},
	finalize: function($super)
	{
		this._finalizeSubElements();
		$super();
	},
	_finalizeSubElements: function()
	{
		var textArea = this.getTextArea();
		if (textArea)
		{
			textArea.finalize();
		}
	},
	/** @ignore */
	getCoreElement: function($super)
	{
		var textArea = this.getTextArea();
		if (textArea)
			return textArea.getElement();
		else
			return $super();
	},

	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.TEXTEDITOR;
	},
	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('span');
		return result;
	},
	/** @ignore */
	doCreateSubElements: function(doc, rootElem)
	{
		// toolbar element
		var toolbar = this.createToolbar();
		if (toolbar)
			toolbar.appendToElem(rootElem);
		// text area element
		var textArea = this.createTextArea();
		textArea.appendToElem(rootElem);
		this.updateChildWidgetPos();
		return [toolbar.getElement(), textArea.getElement()];
	},
	/** @ignore */
	doWidgetShowStateChanged: function($super, isShown)
	{
		$super(isShown);
		if (isShown)
		{
			this.updateChildWidgetPos();
			this.updateToolButtonStates();
		}
	},

	/** @private */
	createToolbar: function()
	{
		if (this.getShowToolbar())
		{
			var toolbar = new Kekule.Widget.Toolbar(this);
			this.setPropStoreFieldValue('toolbar', toolbar);
			toolbar.addClassName(CNS.TEXTEDITOR_TOOLBAR);
			this.recreateToolbarComponents();
			//this.adjustAssocToolbarPositions();
			return toolbar;
		}
		else
		{
			return null;
		}
	},
	/** @private */
	recreateToolbarComponents: function(comps)
	{
		if (!comps)
			comps = this.getToolbarComponents();
		var components = comps || this.DEF_TOOLBAR_COMPONENTS;
		var toolbar = this.getToolbar();
		if (toolbar)
		{
			this._toolCompWidgets.length = 0;
			toolbar.clearWidgets();
			toolbar.setShowText(false);
			toolbar.setShowGlyph(true);
			var widget;
			for (var i = 0, l = components.length; i < l; ++i)
			{
				var comp = components[i];
				if (comp === 'fontFamily')  // font family list box
					widget = this.createFontFamilyComboBox(toolbar);
				else
					widget = this.createToolButton(toolbar, comp);
				this._toolCompWidgets[comp] = widget;
			}
			this.updateToolButtonStates();
		}
	},
	/** @private */
	createFontFamilyComboBox: function(toolbar)
	{
		var result = new Kekule.Widget.ComboBox(toolbar);
		// fill fonts
		var fontFamilies = Kekule.Widget.FontEnumerator.getAvailableFontFamilies(this.getCandidateFontFamilies());
		var boxItems = [];  //[{'text': Kekule.ChemWidgetTexts.S_VALUE_DEFAULT, 'value': ''}];
		for (var i = 0, l = fontFamilies.length; i < l; ++i)
		{
			boxItems.push({'text': fontFamilies[i], 'value': fontFamilies[i]});
		}
		result.setHint(/*CWT.HINT_CHOOSE_FONT_FAMILY*/Kekule.$L('WidgetTexts.HINT_CHOOSE_FONT_FAMILY'));
		result.addClassName(CNS.TEXTEDITOR_FONTBOX);
		result.setItems(boxItems);
		result.appendToWidget(toolbar);
		result.addEventListener('valueChange', function(e){
			this.setTextStyle({'fontFamily': result.getValue()});
		}, this);
		return result;
	},
	/** @private */
	createToolButton: function(toolbar,btnName)
	{
		var caption, hint;
		var cssClassName;
		var btnClass = (btnName === 'textWrap')? Kekule.Widget.CheckButton: Kekule.Widget.Button;
		var result = new btnClass(toolbar);
		result.appendToWidget(toolbar);
		if (btnName === 'textWrap')
		{
			caption = Kekule.$L('WidgetTexts.CAPTION_TOGGLE_TEXTWRAP'); // CWT.CAPTION_TOGGLE_TEXTWRAP;
			hint = Kekule.$L('WidgetTexts.HINT_TOGGLE_TEXTWRAP'); // CWT.HINT_TOGGLE_TEXTWRAP;
			cssClassName = CNS.TEXTEDITOR_BTN_TEXTWRAP;
			result.setChecked(this.getWrap() !== 'off');
			result.addEventListener('checkChange', function(e){
				var wrap = result.getChecked();
				this.setWrap(wrap? 'virtual': 'off');
			}, this);
		}
		else if (btnName === 'fontSizeInc')
		{
			caption = Kekule.$L('WidgetTexts.CAPTION_INC_TEXT_SIZE'); // CWT.CAPTION_INC_TEXT_SIZE;
			hint = Kekule.$L('WidgetTexts.HINT_INC_TEXT_SIZE'); // CWT.HINT_INC_TEXT_SIZE;
			cssClassName = CNS.TEXTEDITOR_BTN_FONTSIZEINC;
			result.addEventListener('execute', this.increaseTextSize, this);
		}
		else if (btnName === 'fontSizeDec')
		{
			caption = Kekule.$L('WidgetTexts.CAPTION_DEC_TEXT_SIZE'); //CWT.CAPTION_DEC_TEXT_SIZE;
			hint = Kekule.$L('WidgetTexts.HINT_DEC_TEXT_SIZE'); //CWT.HINT_DEC_TEXT_SIZE;
			cssClassName = CNS.TEXTEDITOR_BTN_FONTSIZEDEC;
			result.addEventListener('execute', this.decreaseTextSize, this);
		}
		result.setText(caption);
		result.setHint(hint);
		result.addClassName(cssClassName);
		return result;
	},
	/** @private */
	createToolCheckButton: function(toolbar,btnName)
	{
		var result = new Kekule.Widget.CheckButton(toolbar);
		result.appendToWidget(toolbar);
		return result;
	},
	/** @private */
	createTextArea: function()
	{
		var result = new Kekule.Widget.TextArea(this);
		this.setPropStoreFieldValue('textArea', result);
		result.addClassName(CNS.TEXTEDITOR_TEXTAREA);
		return result;
	},
	/** @private */
	updateChildWidgetPos: function()
	{
		/*
		var toolbarHeight;
		var toolbar = this.getToolbar();
		if (toolbar)
		{
			var toolbarBound = Kekule.HtmlElementUtils.getElemBoundingClientRect(toolbar.getElement()) || 0;
			toolbarHeight = toolbarBound.height || 0;
		}
		var textArea = this.getTextArea();
		textArea.setStyleProperty('marginTop', toolbarHeight + 'px');
		*/
		var toolbarPos = this.getToolbarPos();
		var toolbarElem = this.getToolbar().getElement();
		var textAreaElem = this.getTextArea().getElement();
		var parentElem = toolbarElem.parentNode;
		if (toolbarPos === Kekule.Widget.Position.BOTTOM)
		{
			parentElem.insertBefore(textAreaElem, toolbarElem);
		}
		else  // defaultly, toolbar on top
		{
			parentElem.insertBefore(toolbarElem, textAreaElem);
		}
	},

	/** @private */
	updateToolButtonStates: function()
	{
		//console.log('update state', this.getWrap());
		var btn = this._toolCompWidgets['textWrap'];
		if (btn)
			btn.setChecked(this.getWrap() !== 'off');
	},

	/**
	 * Set display style of text area in editor.
	 * @param {Hash} cssStyles A hash of css styles, e.g. {'fontSize': '19px', 'fontFamily': 'arial'}.
	 */
	setTextStyle: function(cssStyles)
	{
		var textArea = this.getTextArea();
		if (textArea)
		{
			var props = Kekule.ObjUtils.getOwnedFieldNames(cssStyles);
			for (var i = 0, l = props.length; i < l; ++i)
			{
				var p = props[i];
				textArea.setStyleProperty(p, cssStyles[p]);
			}
		}
		return this;
	},
	/**
	 * Increase text size in editor.
	 */
	increaseTextSize: function()
	{
		var level = this.getFontSizeLevel() || 1;
		var newLevel = Kekule.ZoomUtils.getNextZoomInRatio(level);
		this.setFontSizeLevel(newLevel);
	},
	/**
	 * Decrease text size in editor.
	 */
	decreaseTextSize: function()
	{
		var level = this.getFontSizeLevel() || 1;
		var newLevel = Kekule.ZoomUtils.getNextZoomOutRatio(level);
		this.setFontSizeLevel(newLevel);
	}
});

})();