/**
 * @fileoverview
 * Implementation of a color picker panel.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /utils/kekule.domUtils.js
 * requires /xbrowsers/kekule.x.js
 * requires /widgets/kekule.widget.base.js
 * requires /widgets/kekule.widget.styleResources.js
 * requires /widgets/commonCtrls/kekule.widget.formControls.js
 */

(function(){
"use strict";

var DU = Kekule.DomUtils;
var EU = Kekule.HtmlElementUtils;
var CNS = Kekule.Widget.HtmlClassNames;

/** @ignore */
Kekule.Widget.HtmlClassNames = Object.extend(Kekule.Widget.HtmlClassNames, {
	COLORPICKER: 'K-ColorPicker',
	COLORPICKER_HEADER: 'K-ColorPicker-Header',
	COLORPICKER_SPEC_COLOR_PALETTE: 'K-ColorPicker-Spec-Color-Palette',
	COLORPICKER_HEXBOX: 'K-ColorPicker-HexBox',
	COLORPICKER_PREVIEWER: 'K-ColorPicker-Previewer',
	COLORPICKER_INPUT: 'K-ColorPicker-Input',
	COLORPICKER_BROWSE_BTN: 'K-ColorPicker-Browse-Btn',
	COLORPICKER_PALETTE: 'K-ColorPicker-Palette',
	COLORPICKER_PALETTE_LINE: 'K-ColorPicker-Palette-Line',
	COLORPICKER_PALETTE_CELL: 'K-ColorPicker-Palette-Cell',
	COLORPICKER_PALETTE_CELL_TRANSPARENT: 'K-ColorPicker-Palette-Cell-Transparent',

	COLORPICKER_SPEC_COLOR_UNSET: 'K-Color-Unset',
	COLORPICKER_SPEC_COLOR_DEFAULT: 'K-Color-Default',
	COLORPICKER_SPEC_COLOR_MIXED: 'K-Color-Mixed',
	COLORPICKER_SPEC_COLOR_TRANSPARENT: 'K-Color-Transparent',

	COLORDROPTEXTBOX: 'K-ColorDropTextBox',
	COLORDROPBUTTON: 'K-ColorDropButton',
	COLORPREVIEWER: 'K-ColorPreviewer'
});

/**
 * An widget to select a color value.
 * @class
 * @augments Kekule.Widget.BaseWidget
 *
 * @property {String} value To get or set color value.
 * @property {String} colorClassName If the color picked is a special one, only a value may be ineffcient to
 *   represent color in outlook. This value (class name) can be set to color preview element to set a special
 *   outlook.
 * @property {Array} specialColors Special colors selectable in header. Each item in array can be a
 *   color string ('e.g. '#FF0000') or a hash object with fields {value, className} in which the className
 *   will be added to special color cell.
 * @property {Bool} isDirty Whether the color value has been changed by user.
 */
/**
 * Invoked when the color value is selected. Event param of it has field: {value, colorClassName}.
 * @name Kekule.Widget.ColorPicker#valueSet
 * @event
 */
/**
 * Invoked when the color value is changed. Event param of it has field: {value, colorClassName}.
 * (Same as valueSet event).
 * @name Kekule.Widget.ColorPicker#valueChange
 * @event
 */
Kekule.Widget.ColorPicker = Class.create(Kekule.Widget.BaseWidget,
/** @lends Kekule.Widget.ColorPicker# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.ColorPicker',
	/** @private */
	COLOR_VALUE_FIELD: '__$colorValue__',
	/** @private */
	COLOR_TEXT_FIELD: '__$colorText__',
	/** @private */
	COLOR_CLASS_FIELD: '__ $colorClass__',
	/** @private */
	BINDABLE_TAG_NAMES: ['div', 'span'],
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument)
	{
		/*
		this.reactPaletteMouseDownBind = this.reactPaletteMouseDown.bind(this);
		this.reactPaletteMouseUpBind = this.reactPaletteMouseUp.bind(this);
		this.reactPaletteMouseMoveBind = this.reactPaletteMouseMove.bind(this);
		*/
		$super(parentOrElementOrDocument);
		this.setUseCornerDecoration(true);
		this.setValue('#000000');  // default
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('value', {'dataType': DataType.STRING,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('value', value);
				this.getHexBox().innerHTML = value || '&nbsp;';
				this.getPreviewer().style.backgroundColor = value;
				if (this.getColorInput())
				{
					this.getColorInput().value = value;
				}
			}
		});
		this.defineProp('colorClassName', {'dataType': DataType.STRING});
		this.defineProp('specialColors', {'dataType': DataType.ARRAY,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('specialColors', value);
				this._recreateSpecialColorPaletteCells(this.getDocument(), this.getSpecialColorPalette());
			}
		});
		this.defineProp('isDirty', {'dataType': DataType.BOOL, 'serializable': false});

		// private property to store child elements
		this.defineProp('hexBox', {'dataType': DataType.OBJECT, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});
		this.defineProp('palette', {'dataType': DataType.OBJECT, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});
		this.defineProp('previewer', {'dataType': DataType.OBJECT, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});
		this.defineProp('colorInput', {'dataType': DataType.OBJECT, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});
		this.defineProp('specialColorPalette', {'dataType': DataType.OBJECT, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});

		// private
		this.defineProp('isPicking', {'dataType': DataType.BOOL, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});
	},

	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.COLORPICKER;
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
		/*
		var elem = doc.createElement('div');
		elem.className = CCNS.COMPOSER_EDITOR_STAGE;
		rootElem.appendChild(elem);
		this.setPropStoreFieldValue('editorStageElem', elem);
		var elem = doc.createElement('div');
		elem.className = CCNS.COMPOSER_ADV_PANEL;
		rootElem.appendChild(elem);
		this.setPropStoreFieldValue('advPanelElem', elem);
		*/
		var result = [];
		result.push(this.doCreateHeader(doc, rootElem));
		result.push(this.doCreatePalette(doc, rootElem));
		return result;
	},
	/** @private */
	doCreateHeader: function(doc, parentElem)
	{
		var result = doc.createElement('div');
		result.className = CNS.COLORPICKER_HEADER;
		result.appendChild(this.doCreateSpecialColorPalette(doc));
		result.appendChild(this.doCreateHexBox(doc));
		result.appendChild(this.doCreatePreviewer(doc));
		var colorInputElem = this.doCreateColorInput(doc);
		if (colorInputElem)
		{
			result.appendChild(colorInputElem);
			var btn = this.doCreateColorDialogBtn(doc);
			if (btn)
				btn.appendToElem(result);
		}
		parentElem.appendChild(result);
		return result;
	},
	/** @private */
	doCreateSpecialColorPalette: function(doc)
	{
		var result = doc.createElement('div');
		result.className = CNS.COLORPICKER_SPEC_COLOR_PALETTE;
		this._recreateSpecialColorPaletteCells(doc, result);
		this.setSpecialColorPalette(result);
		return result;
	},
	/** @private */
	_isPredefinedSpecialColor: function(color)
	{
		var SC = Kekule.Widget.ColorPicker.SpecialColors;
		var predefines = [SC.UNSET, SC.DEFAULT, SC.MIXED, SC.TRANSPARENT];
		return predefines.indexOf(color) >= 0;
	},
	/** @private */
	_getPredefinedSpecialColorInfo: function(color)
	{
		var SC = Kekule.Widget.ColorPicker.SpecialColors;
		//var WT = Kekule.WidgetTexts;
		var predefines = [SC.UNSET, SC.DEFAULT, SC.MIXED, SC.TRANSPARENT];
		//var values = ['(unset)', '(default)', '(mixed)'];
		var classNames = [CNS.COLORPICKER_SPEC_COLOR_UNSET, CNS.COLORPICKER_SPEC_COLOR_DEFAULT,
			CNS.COLORPICKER_SPEC_COLOR_MIXED, CNS.COLORPICKER_SPEC_COLOR_TRANSPARENT];
		var texts = [
			Kekule.$L('WidgetTexts.S_COLOR_UNSET'),
			Kekule.$L('WidgetTexts.S_COLOR_DEFAULT'),
			Kekule.$L('WidgetTexts.S_COLOR_MIXED'),
			Kekule.$L('WidgetTexts.S_COLOR_TRANSPARENT'),
		]//[WT.S_COLOR_UNSET, WT.S_COLOR_DEFAULT, WT.S_COLOR_MIXED];
		var result = {'value': color};
		var index = predefines.indexOf(color);
		if (index >= 0)
		{
			//result.value = values[index];
			result.text = texts[index];
			result.className = classNames[index];
		}
		return result;
	},
	/** @private */
	_recreateSpecialColorPaletteCells: function(doc, parentElem)
	{
		Kekule.DomUtils.clearChildContent(parentElem);
		var colors = this.getSpecialColors();
		if (colors && colors.length)
		{
			for (var i = 0, l = colors.length; i < l; ++i)
			{
				var color = colors[i];
				var elem;
				var colorInfo = {};
				if (DataType.isObjectValue(color))  // complex hash
				{
					colorInfo = color;
				}
				else if (this._isPredefinedSpecialColor(color))
				{
					colorInfo = this._getPredefinedSpecialColorInfo(color);
				}
				else // simple string value
				{
					colorInfo.value = color;
				}
				elem = this.doCreatePaletteCell(doc, colorInfo.value, colorInfo.text, colorInfo.className);
				if (colorInfo.className)
					Kekule.HtmlElementUtils.addClass(elem, colorInfo.className);
				parentElem.appendChild(elem);
			}
		}
	},
	/** @private */
	doCreateHexBox: function(doc)
	{
		var result = doc.createElement('span');
		result.className = CNS.COLORPICKER_HEXBOX;
		result.innerHTML = '&nbsp';
		this.setHexBox(result);
		return result;
	},
	/** @private */
	doCreatePreviewer: function(doc)
	{
		var result = doc.createElement('span');
		result.className = CNS.COLORPICKER_PREVIEWER;
		result.innerHTML = '&nbsp';
		this.setPreviewer(result);
		return result;
	},
	/** @private */
	doCreateColorInput: function(doc)
	{
		if (Kekule.BrowserFeature.html5Form.supportType('color'))
		{
			var result = doc.createElement('input');
			result.setAttribute('type', 'color');
			result.className = CNS.COLORPICKER_INPUT;
			var self = this;
			Kekule.X.Event.addListener(result, 'change', function(e)
				{
					var value = result.value;
					self.setValue(value);
					//self.invokeEvent('valueSet', {'value': self.getValue()});
					self.notifyColorSet();
				}
			);
			this.setColorInput(result);
			return result;
		}
		else
			return null;
	},
	/** @private */
	doCreateColorDialogBtn: function(doc)
	{
		if (Kekule.BrowserFeature.html5Form.supportType('color'))
		{
			var btn = new Kekule.Widget.Button(doc);
			btn.setText(/*Kekule.WidgetTexts.CAPTION_BROWSE_COLOR*/Kekule.$L('WidgetTexts.CAPTION_BROWSE_COLOR'));
			btn.setHint(/*Kekule.WidgetTexts.HINT_BROWSE_COLOR*/Kekule.$L('WidgetTexts.HINT_BROWSE_COLOR'));
			btn.setShowText(false);
			btn.doSetShowGlyph(true);
			btn.linkStyleResource(Kekule.Widget.StyleResourceNames.ICON_COLOR_PICK);
			btn.addClassName(CNS.COLORPICKER_BROWSE_BTN);
			btn.addEventListener('execute', this.openColorDialog, this);
			return btn;
		}
	},
	/** @private */
	doCreatePalette: function(doc, parentElem)
	{
		var result = doc.createElement('div');
		result.className = CNS.COLORPICKER_PALETTE;
		// create a 18X13 grid of color
		// gray line
		var seeds = ["00", "00", "11", "22", "33", "44", "55", "66", "77", "88", "99", "AA", "BB", "CC", "DD", "EE", "FF", null];  // null means transparent
		var seedsLength = seeds.length;
		var lineElem = this.doCreatePaletteLine(doc);
		for (var i = 0; i < seedsLength; i++)
		{
			var sColor = seeds[i]? '#' + seeds[i] + seeds[i] + seeds[i]: 'transparent';
			var cellElem = this.doCreatePaletteCell(doc, sColor);
			lineElem.appendChild(cellElem);
		}
		result.appendChild(lineElem);
		// color lines
		seeds = ["00", "33", "66", "99", "CC", "FF"];
		var seedsLength = seeds.length;
		// first half
		for (var i = 0; i < seedsLength; i++)
		{
			var lineElem = this.doCreatePaletteLine(doc);
			for (var j = 0; j < (seedsLength >> 1); j++)
			{
				for (var k = 0; k < seedsLength; k++)
				{
					var sColor = '#' + seeds[j] + seeds[i] + seeds[k];
					var cellElem = this.doCreatePaletteCell(doc, sColor);
					lineElem.appendChild(cellElem);
				}
			}
			result.appendChild(lineElem);
		}
		// second half
		for (var i = 0; i < seedsLength; i++)
		{
			var lineElem = this.doCreatePaletteLine(doc);
			for (var j = (seedsLength >> 1); j < seedsLength; j++)
			{
				for (var k = 0; k < seedsLength; k++)
				{
					var sColor = '#' + seeds[j] + seeds[i] + seeds[k];
					var cellElem = this.doCreatePaletteCell(doc, sColor);
					lineElem.appendChild(cellElem);
				}
			}
			result.appendChild(lineElem);
		}
		parentElem.appendChild(result);

		/*
		Kekule.X.Event.addListener(result, 'mousedown', this.reactPaletteMouseDownBind);
		Kekule.X.Event.addListener(result, 'mouseup', this.reactPaletteMouseUpBind);
		Kekule.X.Event.addListener(result, 'mousemove', this.reactPaletteMouseMoveBind);
		*/
		this.setPalette(result);
		return result;
	},
	/** @private */
	doCreatePaletteCell: function(doc, sColor, sText, sClassName)
	{
		var result = doc.createElement('span');
		var className = CNS.COLORPICKER_PALETTE_CELL;
		if (sColor === 'transparent')
		{
			className += ' ' + CNS.COLORPICKER_PALETTE_CELL_TRANSPARENT;
		}
		else
		{
			try
			{
				result.style.backgroundColor = sColor;  // sColor may be an invalid value for color, error may cause in IE8
			}
			catch(e)
			{

			}
		}
		result[this.COLOR_VALUE_FIELD] = sColor;
		result[this.COLOR_TEXT_FIELD] = sText || sColor;
		result[this.COLOR_CLASS_FIELD] = sClassName;
		result.className = className;
		result.title = sText || sColor;
		return result;
	},
	/** @private */
	doCreatePaletteLine: function(doc)
	{
		var result = doc.createElement('div');
		result.className = CNS.COLORPICKER_PALETTE_LINE;
		return result;
	},

	/** @private */
	_isPaletteCellElem: function(elem)
	{
		return Kekule.HtmlElementUtils.hasClass(elem, CNS.COLORPICKER_PALETTE_CELL);
	},

	/**
	 * Open system color select dialog.
	 */
	openColorDialog: function()
	{
		if (this.getColorInput())
			this.getColorInput().click();
		return this;
	},

	/** @private */
	applyColor: function(targetElem)
	{
		var color = targetElem[this.COLOR_VALUE_FIELD];
		if (color)
			this.setValue(color);
		var colorText= targetElem[this.COLOR_TEXT_FIELD];
		if (colorText)
		{
			this.getHexBox().innerHTML = colorText;
		}
		var colorClassName = targetElem[this.COLOR_CLASS_FIELD];
		this.setColorClassName(colorClassName);
	},

	/** @private */
	notifyColorSet: function()
	{
		this.setIsDirty(true);
		this.invokeEvent('valueSet', {'value': this.getValue(), 'colorClassName': this.getColorClassName()});
		this.invokeEvent('valueChange', {'value': this.getValue(), 'colorClassName': this.getColorClassName()});
	},

	/** @private */
	//react_mousedown: function($super, e)
	doReactActiviting: function($super, e)
	{
		$super(e);
		//if (e.getButton() === Kekule.X.Event.MouseButton.LEFT)
		{
			var target = e.getTarget();
			if (this._isPaletteCellElem(target))
			{
				this.setIsPicking(true);
				this.applyColor(target);
				return true;
			}
		}
		//return $super(e);
	},
	/** @private */
	//react_mouseup: function($super, e)
	doReactDeactiviting: function($super, e)
	{
		//if (e.getButton() === Kekule.X.Event.MouseButton.LEFT)
		{
			if (this.getIsPicking())
			{
				this.setIsPicking(false);
				var target = e.getTarget();
				if (this._isPaletteCellElem(target))
					this.applyColor(target);
				this.notifyColorSet();
				return true;
			}
		}
		$super(e);
		//return $super(e);
	},
	/** @private */
	//react_mousemove: function($super, e)
	reactPointerMoving: function($super, e)
	{
		$super(e);
		if (this.getIsPicking())
		{
			var target = e.getTarget();;
			if (e.getTouches())  // is touch, touch target always equal to the target invoke touchstart event, so need extra code
			{
				var coord = {'x': e.getWindowX(), 'y': e.getWindowY()};
				var doc = this.getDocument();
				target = (doc.elementFromPoint && doc.elementFromPoint(coord.x, coord.y)) || target;
				//console.log('moving', this.getIsPicking(), coord, e.getPageY(), target, e);
				e.preventDefault();
			}
			if (target && this._isPaletteCellElem(target))
			{
				this.applyColor(target);
			}
			return true;
		}
		//return $super(e);
	}
});
/**
 * Enumeration of special colors that can be shown in color picker.
 * @class
 */
Kekule.Widget.ColorPicker.SpecialColors = {
	UNSET: '(unset)',
	DEFAULT: '(default)',
	MIXED: '(mixed)',
	TRANSPARENT: 'transparent'
};


/**
 * An Text box with a drop down button to select color.
 * @class
 * @augments Kekule.Widget.ButtonTextBox
 *
 * @property {Bool} showPreview Whether show preview color on text box.
 * @property {String} value To get or set color value.
 * @property {Array} specialColors Special colors selectable in header. Each item in array can be a
 *   color string ('e.g. '#FF0000') or a hash object with fields {value, className} in which the className
 *   will be added to special color cell.
 */
Kekule.Widget.ColorDropTextBox = Class.create(Kekule.Widget.ButtonTextBox,
/** @lends Kekule.Widget.ColorDropTextBox# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.ColorDropTextBox',
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument, value)
	{
		$super(parentOrElementOrDocument);
		this.setButtonKind(Kekule.Widget.Button.Kinds.DROPDOWN);
		this.addEventListener('buttonExecute', this.reactDropbuttonExecute, this);

		this.setShowPreview(true);
		if (value)
			this.setValue(value);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('showPreview', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				this.getPreviewElem().style.display = value? 'inherit': '';
			}
		});
		this.defineProp('colorClassName', {'dataType': DataType.STRING,
			'setter': function(value)
			{
				var elem = this.getPreviewElem();
				if (elem)
				{
					var old = this.getColorClassName();
					if (old)
						Kekule.HtmlElementUtils.removeClass(elem, old);
					if (value)
						Kekule.HtmlElementUtils.addClass(elem, value);
				}
				this.setPropStoreFieldValue('colorClassName', value);
			}
		});
		this.defineProp('colorPicker', {'dataType': 'Kekule.Widget.ColorPicker', 'setter': null, 'serializable': false,
			'scope': Class.PropertyScope.PUBLIC,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('colorPicker');
				if (!result)
				{
					result = new Kekule.Widget.ColorPicker(this);
					result.setDisplayed(false);
					result.getElement().style.position = 'absolute';  // important, do not affect normal content flow
					result.setSpecialColors(this.getSpecialColors());
					result.addEventListener('valueChange', this.reactColorPickerValueSet, this);
					result.appendToElem(this.getElement());
					this.setPropStoreFieldValue('colorPicker', result);
				}
				return result;
			}
		});
		this.defineProp('specialColors', {'dataType': DataType.ARRAY,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('specialColors', value);
				var picker = this.getPropStoreFieldValue('colorPicker');
				if (picker)
					picker.setSpecialColors(value);
			}
		});
	},
	doFinalize: function($super)
	{
		var picker = this.getPropStoreFieldValue('colorPicker');
		if (picker)
		{
			picker.finalize();
		}
		$super();
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.COLORDROPTEXTBOX;
	},
	/** @ignore */
	doCreateSubElements: function($super, doc, rootElem)
	{
		$super(doc, rootElem);
		// create preview widget
		var previewWidget = new Kekule.Widget.DumbWidget(this);
		previewWidget.addClassName(CNS.COLORPREVIEWER);
		this.setHeadingWidget(previewWidget);
		return [previewWidget.getElement()];
	},
	/** @private */
	getPreviewElem: function()
	{
		var widget = this.getHeadingWidget();
		if (widget)
			return widget.getElement();
	},

	/**
	 * Show color picker panel.
	 */
	showColorPicker: function()
	{
		var picker = this.getColorPicker();
		if (!picker.isShown())
		{
			// set picker value
			picker.setValue(this.getValue());
			// set style
			/*
			var style = picker.getElement().style;
			style.position = 'absolute';
			style.left = 0;
			style.top = Kekule.HtmlElementUtils.getElemOffsetDimension(this.getElement()).height + 'px';
			//style.zIndex = 100;
			*/

			picker.show(this, null, Kekule.Widget.ShowHideType.DROPDOWN);
		}
	},
	/**
	 * Hide color picker panel.
	 */
	hideColorPicker: function()
	{
		var picker = this.getPropStoreFieldValue('colorPicker');
		if (picker && picker.isShown())
			picker.hide();
	},

	/** @private */
	reactDropbuttonExecute: function(e)
	{
		this.showColorPicker();
	},
	/** @private */
	reactColorPickerValueSet: function(e)
	{
		var value = e.value;
		this.setValue(value);
		this.setIsDirty(this.getIsDirty() || this.getColorPicker().getIsDirty());
		this.setColorClassName(e.colorClassName);
		this.hideColorPicker();
		e.stopPropagation();
	},

	/** @ignore */
	doSetValue: function($super, value)
	{
		$super(value);
		var elem = this.getPreviewElem();
		if (elem)
		{
			elem.style.backgroundColor = 'transparent';
			elem.style.backgroundColor = value;
		}
	}
});

/**
 * A drop down button to select color.
 * @class
 * @augments Kekule.Widget.DropDownButton
 *
 * @property {Bool} showPreview Whether show a preview color on button.
 * @property {String} value To get or set color value.
 * @property {Array} specialColors Special colors selectable in header. Each item in array can be a
 *   color string ('e.g. '#FF0000') or a hash object with fields {value, className} in which the className
 *   will be added to special color cell.
 * @property {Bool} isDirty Whether the color value has been changed by user.
 */
Kekule.Widget.ColorDropButton = Class.create(Kekule.Widget.DropDownButton,
/** @lends Kekule.Widget.ColorDropButton# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.ColorDropButton',
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument, value)
	{
		$super(parentOrElementOrDocument);
		this.setButtonKind(Kekule.Widget.Button.Kinds.DROPDOWN);
		//this.setShowDropDownMark(true);
		//this.setShowLeadingGlyph(true);
		this.setShowPreview(true);
		//this.setShowText(false);
		if (value)
			this.setValue(value);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('showPreview', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				this.getPreviewElem().style.display = value? 'inherit': '';
			}
		});
		this.defineProp('value', {'dataType': DataType.STRING,
			'getter': function() { return this.getText(); },
			'setter': function(value)
			{
				this.setText(value);
				this.updateColorPreview(value);
			}
		});
		this.defineProp('colorClassName', {'dataType': DataType.STRING,
			'setter': function(value)
			{
				var elem = this.getPreviewElem();
				if (elem)
				{
					var old = this.getColorClassName();
					if (old)
						Kekule.HtmlElementUtils.removeClass(elem, old);
					if (value)
						Kekule.HtmlElementUtils.addClass(elem, value);
				}
				this.setPropStoreFieldValue('colorClassName', value);
			}
		});
		this.defineProp('colorPicker', {'dataType': 'Kekule.Widget.ColorPicker', 'setter': null, 'serializable': false,
			'scope': Class.PropertyScope.PUBLIC,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('colorPicker');
				if (!result)
				{
					result = new Kekule.Widget.ColorPicker(this);
					result.setDisplayed(false);
					result.getElement().style.position = 'absolute';  // important, do not affect normal content flow
					result.setSpecialColors(this.getSpecialColors());
					result.addEventListener('valueChange', this.reactColorPickerValueSet, this);
					//result.appendToElem(this.getElement());
					this.setPropStoreFieldValue('colorPicker', result);
				}
				return result;
			}
		});
		this.defineProp('specialColors', {'dataType': DataType.ARRAY,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('specialColors', value);
				var picker = this.getPropStoreFieldValue('colorPicker');
				if (picker)
					picker.setSpecialColors(value);
			}
		});
		this.defineProp('isDirty', {'dataType': DataType.BOOL, 'serializable': false,
			'getter': function() { return this.getColorPicker().getIsDirty(); },
			'setter': function(value) { this.getColorPicker().setIsDirty(value); } });
	},
	doFinalize: function($super)
	{
		var picker = this.getPropStoreFieldValue('colorPicker');
		if (picker)
			picker.finalize();
		$super();
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.COLORDROPBUTTON;
	},
	/** @ignore */
	doGetDropDownWidget: function()
	{
		return this.getColorPicker();
	},

	/** @private */
	getPreviewElem: function()
	{
		return this._elemLeadingGlyphPart;
	},

	/**
	 * Show color picker panel.
	 */
	showColorPicker: function()
	{
		var picker = this.getColorPicker();
		if (!picker.isShown())
		{
			// set picker value
			picker.setValue(this.getValue());
			picker.show(this, null, Kekule.Widget.ShowHideType.DROPDOWN);
		}
	},
	/**
	 * Hide color picker panel.
	 */
	hideColorPicker: function()
	{
		var picker = this.getPropStoreFieldValue('colorPicker');
		if (picker && picker.isShown())
			picker.hide();
	},

	/** @private */
	reactColorPickerValueSet: function(e)
	{
		var value = e.value;
		var className = e.colorClassName;
		this.setValue(value);
		this.setColorClassName(className);
		this.hideColorPicker();
		this.invokeEvent('valueChange', {'value': value});
		e.stopPropagation();
	},

	/** @private */
	updateColorPreview: function(value)
	{
		var elem = this.getPreviewElem();
		if (elem)
		{
			elem.style.backgroundColor = 'transparent';  // set a default value first
			elem.style.backgroundColor = value;  // as value may be invalidate
		}
	}
});

})();