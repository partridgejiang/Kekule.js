/**
 * @fileoverview
 * Implementation of textbox widgets.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /utils/kekule.domUtils.js
 * requires /xbrowsers/kekule.x.js
 * requires /widgets/kekule.widget.base.js
 * requires /widgets/kekule.widget.containers.js
 * requires /widgets/commonCtrls/kekule.widget.buttons.js
 */

(function(){

var DU = Kekule.DomUtils;
var EU = Kekule.HtmlElementUtils;
var CNS = Kekule.Widget.HtmlClassNames;
var OU = Kekule.ObjUtils;

/** @ignore */
Kekule.Widget.HtmlClassNames = Object.extend(Kekule.Widget.HtmlClassNames, {
	OVERLAP: 'K-Overlap',
	FORMCONTROL: 'K-FormControl',
	CHECKBOX: 'K-CheckBox',
	TEXTBOX: 'K-TextBox',
	COMBOTEXTBOX: 'K-ComboTextBox',
	COMBOTEXTBOX_ASSOC_WIDGET: 'K-ComboTextBox-Assoc-Widget',
	BUTTONTEXTBOX: 'K-ButtonTextBox',
	TEXTAREA: 'K-TextArea',
	SELECTBOX: 'K-SelectBox',
	COMBOBOX: 'K-ComboBox',
	COMBOBOX_TEXTWRAPPER: 'K-ComboBox-TextWrapper'
});

/**
 * Widget based on form controls.
 * @class
 * @augments Kekule.Widget.BaseWidget
 *
 * @property {name} Name of form control (name attribute of HTML element).
 * @property {Variant} value Value of form control.
 * @property {Bool} readOnly
 * @property {Bool} isDirty Whether the widget value has been changed by user.
 * @property {Hash} propertyAssocInfo This property stores the association information of widget and an object property.
 */
/**
 * Invoked when the value of form control element is changed by user.
 * This event will actually be fired when "change" event occurs on form element.
 * Instead of simply "change", the event name is "valueChange" to avoid conflict with
 * change event of ObjectEx.
 *   event param of it has field: {widget}
 * @name Kekule.Widget.FormWidget#valueChange
 * @event
 */
Kekule.Widget.FormWidget = Class.create(Kekule.Widget.BaseWidget,
/** @lends Kekule.Widget.FormWidget# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.FormWidget',
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument, isDumb)
	{
		this.reactValueChangeBind = this.reactValueChange.bind(this);  // important, this method must be set before bind to element
		this.reactInputBind = this.reactInput.bind(this);
		this.setPropStoreFieldValue('isDirty', false);
		$super(parentOrElementOrDocument, isDumb);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('name', {'dataType': DataType.STRING,
			'getter': function() { return this.getCoreElement().name; },
			'setter': function(value) { this.getCoreElement().name = value; }
		});
		this.defineProp('value', {'dataType': DataType.VARIANT, 'serializable': false,
			'getter': function() { return this.getCoreElement().value; },
			'setter': function(value) { this.getCoreElement().value = value; }
		});
		this.defineProp('isDirty', {'dataType': DataType.BOOL, 'serializable': false});
		this.defineProp('readOnly', {'dataType': DataType.BOOL, 'serializable': false,
			'getter': function() { return this.getCoreElement().readOnly; },
			'setter': function(value) { this.getCoreElement().readOnly = value; }
		});
	},
	/** @private */
	getTextSelectable: function()
	{
		return true;
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.FORMCONTROL;
	},

	/** @ignore */
	doBindElement: function($super, element)
	{
		$super(element);
		var coreElem = this.getCoreElement();
		if (coreElem)
		{
			Kekule.X.Event.addListener(coreElem, 'change', this.reactValueChangeBind);
			Kekule.X.Event.addListener(coreElem, 'input', this.reactInputBind);
		}
	},
	/** @ignore */
	doUnbindElement: function($super, element)
	{
		var coreElem = this.getCoreElement();
		if (coreElem)
		{
			Kekule.X.Event.removeListener(coreElem, 'change', this.reactValueChangeBind);
			Kekule.X.Event.removeListener(coreElem, 'input', this.reactInputBind);
		}
		$super(element);
	},
	notifyValueChanged: function()
	{
		//console.log('value change', this.getClassName());
		this.setIsDirty(true);
		this.invokeEvent('valueChange', {'widget': this});
	},
	/**
	 * Select all content in widget.
	 */
	selectAll: function()
	{
		var elem = this.getCoreElement();
		if (elem && elem.select)
			elem.select();
		return this;
	},
	/** @private */
	reactValueChange: function()
	{
		this.notifyValueChanged();
	},
	/** @private */
	reactInput: function()
	{
		//console.log('value input', this.getClassName());
		this.setIsDirty(true);
	}
});

/**
 * An general check box box widget.
 * @class
 * @augments Kekule.Widget.FormWidget
 *
 * @property {Bool} checked Whether the box is checked.
 * @property {String} text Caption after check box.
 */
Kekule.Widget.CheckBox = Class.create(Kekule.Widget.FormWidget,
/** @lends Kekule.Widget.CheckBox# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.CheckBox',
	/** @private */
	BINDABLE_TAG_NAMES: ['div', 'span'],
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument, checked)
	{
		$super(parentOrElementOrDocument);
		if (Kekule.ObjUtils.notUnset(checked))
			this.setChecked(!!checked);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('checked', {'dataType': DataType.BOOL,
			'getter': function()
			{
				var core = this.getCoreElement();
				return core? core.checked: false;
			},
			'setter': function(value)
			{
				var core = this.getCoreElement();
				if (core)
					core.checked = !!value;
			}
		});
		this.defineProp('text', {'dataType': DataType.STRING,
			'getter': function()
			{
				return Kekule.DomUtils.getElementText(this.getLabelElem());
			},
			'setter': function(value)
			{
				Kekule.DomUtils.setElementText(this.getLabelElem(), value);
			}
		});
	},
	/** @ignore */
	getCoreElement: function()
	{
		return this.getInputElem();
	},

	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.CHECKBOX;
	},

	/**
	 * Returns <input type="checkbox"> element inside widget.
	 * @private
	 */
	getInputElem: function()
	{
		var elem = this.getElement();
		if (elem)
		{
			var inputs = elem.getElementsByTagName('input');
			if (inputs && inputs.length)
				return inputs[0];
		}
		return null;
	},
	/**
	 * Returns <label> element inside widget.
	 * @private
	 */
	getLabelElem: function()
	{
		var elem = this.getElement();
		if (elem)
		{
			if (elem.tagName.toLowerCase() === 'label')
				return elem;
			else
			{
				var labels = elem.getElementsByTagName('label');
				if (labels && labels.length)
					return labels[0];
			}
		}
		return null;
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
		/*
		var rootTag = rootElem.tagName.toLowerCase();
		var parentElem = null;
		if (rootTag === 'label')
		{
			parentElem = rootElem;
		}
		else
		{
			parentElem = this.doCreateRootElement(doc);
			rootElem.appendChild(parentElem);
		}
		*/
		var labelElem = doc.createElement('label');
		rootElem.appendChild(labelElem);
		var inputElem = doc.createElement('input');
		inputElem.setAttribute('type', 'checkbox');
		labelElem.appendChild(inputElem);
		return [labelElem, inputElem];
	}
});

/**
 * An general text box widget.
 * @class
 * @augments Kekule.Widget.FormWidget
 *
 * @property {String} text Text in textbox.
 * @property {String} placeholder Placeholder text of text box.
 */
Kekule.Widget.TextBox = Class.create(Kekule.Widget.FormWidget,
/** @lends Kekule.Widget.TextBox# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.TextBox',
	/** @private */
	BINDABLE_TAG_NAMES: ['input'],
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument, text)
	{
		$super(parentOrElementOrDocument);
		if (text)
			this.setText(text);
		//this.setUseCornerDecoration(true);
		//this._manualPlaceholder = !Kekule.BrowserFeature.html5Form.placeholder;  // indicates old browser that not support placeholder
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('text', {'dataType': DataType.STRING,
			'getter': function() { return this.getElement().value; },
			'setter': function(value)
			{
				if (value)
					this.getElement().value = value;
				else
					this.getElement().value = '';
			}
		});
		this.defineProp('placeholder', {'dataType': DataType.STRING,
			'getter': function() { return this.getElement().placeholder; },
			'setter': function(value) { this.getElement().placeholder = value; }
		});
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.TEXTBOX;
	},
	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('input');
		result.setAttribute('type', 'text');
		return result;
	},

	/** @ignore */
	doBindElement: function($super, element)
	{
		$super(element);
	}
});

/**
 * An text box with additional widget at heading (left) and tailing (right).
 * @class
 * @augments Kekule.Widget.FormWidget
 *
 * @property {String} text Text in textbox.
 * @property {String} placeholder Placeholder text of text box.
 * @property {Bool} overlapOnTextBox If true, heading/tailing widget will be put directly on textbox
 *   and the text box will use CSS padding to avoid text overlap with widgets. Otherwise Widgets will
 *   be put at left/right of text box.
 */
Kekule.Widget.ComboTextBox = Class.create(Kekule.Widget.FormWidget,
/** @lends Kekule.Widget.ComboTextBox# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.ComboTextBox',
	/** @private */
	BINDABLE_TAG_NAMES: ['div', 'span'],
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument, text)
	{
		$super(parentOrElementOrDocument);
		if (text)
			this.setText(text);
		//this.setBubbleUiEvents(true);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('text', {'dataType': DataType.STRING, 'serializable': false,
			'getter': function()
			{
				var textBox = this.getTextBox();
				return textBox? textBox.getText(): null;
			},
			'setter': function(value)
			{
				var textBox = this.getTextBox();
				if (textBox)
					textBox.setText(value);
			}
		});
		this.defineProp('placeholder', {'dataType': DataType.STRING,
			'getter': function() { return this.getTextBox().getPlaceholder(); },
			'setter': function(value) { this.getTextBox().setPlaceholder(value); }
		});

		this.defineProp('overlapOnTextBox', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('overlapOnTextBox', value);
				if (value)
					this.addClassName(CNS.OVERLAP);
				else
					this.removeClassName(CNS.OVERLAP);
				this.adjustWidgetsSize();
			}
		});
		// private
		this.defineProp('textBox', {'dataType': 'Kekule.Widget.TextBox', 'serializable': false, 'setter': null});
		this.defineProp('headingWidget', {'dataType': 'Kekule.Widget.BaseWidget', 'serializable': false,
			'setter': function(value)
			{
				var old = this.getHeadingWidget();
				if (value !== old)
				{
					this.setPropStoreFieldValue('headingWidget', value);
					if (old)
					{
						old.setParent(null);  // remove old
						old.removeClassName(CNS.COMBOTEXTBOX_ASSOC_WIDGET);
					}
					if (value)
					{
						var refElem = this.getTextBox()? this.getTextBox().getElement():
							this.getTailingWidget()? this.getTailingWidget().getElement():
							null;
						value.setParent(this);
						value.addClassName(CNS.COMBOTEXTBOX_ASSOC_WIDGET);
						value.insertToElem(this.getElement(), refElem);
					}
				}
			}
		});
		this.defineProp('tailingWidget', {'dataType': 'Kekule.Widget.BaseWidget', 'serializable': false,
			'setter': function(value)
			{
				var old = this.getTailingWidget();
				if (value !== old)
				{
					this.setPropStoreFieldValue('tailingWidget', value);
					if (old)
					{
						old.setParent(null);  // remove old
						old.removeClassName(CNS.COMBOTEXTBOX_ASSOC_WIDGET);
					}
					if (value)
					{
						value.setParent(this);
						value.addClassName(CNS.COMBOTEXTBOX_ASSOC_WIDGET);
						value.appendToElem(this.getElement());
					}
				}
			}
		});
	},
	/** @ignore */
	finalize: function($super)
	{
		this._finalizeSubWidgets();
		$super();
	},
	/** @private */
	_finalizeSubWidgets: function()
	{
		var textBox = this.getTextBox();
		if (textBox)
		{
			textBox.finalize();
		}
		var widget = this.getHeadingWidget();
		if (widget)
		{
			widget.finalize();
			//this.setHeadingWidget(null);
		}
		var widget = this.getTailingWidget();
		if (widget)
		{
			widget.finalize();
			//this.setTailingWidget(null);
		}
	},

	/** @ignore */
	getCoreElement: function($super)
	{
		var textBox = this.getTextBox();
		if (textBox)
			return textBox.getElement();
		else
			return $super();
	},

	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.COMBOTEXTBOX;
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
		this._finalizeSubWidgets();

		/*
		// important, use span to put a width 100% input box,
		// otherwise width of input box is hard to set.
		var wrapper = doc.createElement('span');
		wrapper.className = CNS.COMBOBOX_TEXTWRAPPER;
		rootElem.appendChild(wrapper);
		*/
		var textBox = new Kekule.Widget.TextBox(this);
		textBox.addClassName(CNS.TEXTBOX);
		//textBox.appendToElem(wrapper);
		textBox.appendToElem(this.getElement());
		this.setPropStoreFieldValue('textBox', textBox);

		result.push(textBox.getElement());
		return result;
	},

	/** @ignore */
	relayEvent: function($super, eventName, event)
	{
		var invokerWidget = event.widget;
		if ((invokerWidget === this.getTextBox()) || (invokerWidget === this.getHeadingWidget()) || (invokerWidget === this.getTailingWidget()))
			event.widget = this;
		return $super(eventName, event);
	},

	/** @ignore */
	doSetEnabled: function(value)
	{
		var textBox = this.getTextBox();
		if (textBox)
			textBox.setEnabled(value);
		var widget = this.getHeadingWidget();
		if (widget)
			widget.setEnabled(value);
		widget = this.getTailingWidget();
		if (widget)
			widget.setEnabled(value);
	},

	/** @ignore */
	doResize: function()
	{
		this.adjustWidgetsSize();
	},

	/** @ignore */
	widgetShowStateChanged: function($super, isShown)
	{
		$super(isShown);
		if (isShown)
			this.adjustWidgetsSize();
	},
	/** @ignore */
	doInsertedToDom: function()
	{
		if (this.isShown())
			this.adjustWidgetsSize();
	},
	/**
	 * Called after new heading or tailing widget set.
	 * @private
	 */
	assocWidgetChanged: function()
	{
		this.adjustWidgetsSize();
	},
	/** @private */
	adjustWidgetsSize: function()
	{
		var SU = Kekule.StyleUtils;
		var overlap = this.getOverlapOnTextBox();
		var position = overlap? 'absolute': 'relative';

		var textElem = this.getTextBox().getElement();
		if (!textElem)  // textbox disposed, may be in finalize phase, no need to adjust
			return;
		var textRect = Kekule.HtmlElementUtils.getElemBoundingClientRect(textElem);

		// heading
		var widget = this.getHeadingWidget();
		var elem = widget? widget.getElement(): null;
		if (elem && widget.isShown())
		{
			var style = elem.style;
			style.position = position;
			if (overlap)
			{
				var rect = Kekule.HtmlElementUtils.getElemBoundingClientRect(elem);
				style.left = 0;
				style.top = //(rect.height - textRect.height) / 2;
					((textRect.height - rect.height) / 2) + 'px';

				textElem.style.paddingLeft = rect.width + 'px';
			}
			else
			{
				SU.removeStyleProperty(style, 'left');
				SU.removeStyleProperty(style, 'top');
				SU.removeStyleProperty(textElem.style, 'paddingLeft');
			}
		}
		else
		{
			SU.removeStyleProperty(textElem.style, 'paddingLeft');
		}

		// tailing
		var widget = this.getTailingWidget();
		var elem = widget? widget.getElement(): null;
		if (elem && widget.isShown())
		{
			var style = elem.style;
			style.position = position;
			if (overlap)
			{
				var rect = Kekule.HtmlElementUtils.getElemBoundingClientRect(elem);
				style.right = 0;
				style.top = //(rect.height - textRect.height) / 2;
					((textRect.height - rect.height) / 2) + 'px';

				textElem.style.paddingRight = rect.width + 'px';
			}
			else
			{
				SU.removeStyleProperty(style, 'right');
				SU.removeStyleProperty(style, 'top');
				SU.removeStyleProperty(textElem.style, 'paddingRight');
			}
		}
		else
		{
			SU.removeStyleProperty(textElem.style, 'paddingRight');
		}
	}
});

/**
 * An text box with additional button at tailing (right).
 * @class
 * @augments Kekule.Widget.ComboTextBox
 *
 * @property {Kekule.Widget.Button} button Button at the tailing of text box.
 * @property {String} buttonText Text of button.
 * @property {String} buttonKind Predefined kind of button, value from {@link Kekule.Widget.Button.Kinds}.
 */
/**
 * Invoked when button in widget is executed.
 *   Event param of it has field: {widget: this (not button)}
 * @name Kekule.Widget.FormWidget#buttonExecute
 * @event
 */
Kekule.Widget.ButtonTextBox = Class.create(Kekule.Widget.ComboTextBox,
/** @lends Kekule.Widget.ButtonTextBox# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.ButtonTextBox',
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument, text)
	{
		$super(parentOrElementOrDocument, text);
		this.setOverlapOnTextBox(true);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('button', {'dataType': 'Kekule.Widget.Button', 'serializable': false, 'setter': null,
			'getter': function() { return this.getTailingWidget(); }
		});
		this.defineProp('buttonKind', {'dataType': DataType.STRING,
			'getter': function() { return this.getButton().getButtonKind(); },
			'setter': function(value) { this.getButton().setButtonKind(value); }
		});
		this.defineProp('buttonText', {'dataType': DataType.STRING,
			'getter': function() { return this.getButton().getText(); },
			'setter': function(value) { this.getButton().setText(value); }
		});
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.BUTTONTEXTBOX;
	},

	/** @ignore */
	doCreateSubElements: function($super, doc, rootElem)
	{
		var result = $super(doc, rootElem);
		var btn = this.createAssocButton();
		if (btn)
			result.push(btn.getElement());
		return result;
	},

	/** @private */
	createAssocButton: function()
	{
		var btn = new Kekule.Widget.Button(this);
		this.setTailingWidget(btn);
		btn.addEventListener('change', this.adjustWidgetsSize, this);
		btn.addEventListener('execute', function(e)
			{
				this.invokeEvent('buttonExecute', {'widget': this});
			}, this);
		return btn;
	},

	/** @private */
	execBtn: function(e)
	{
		var btn = this.getButton();
		if (btn)
		{
			btn.execute(e);
			return true;
		}
	},

	// ui event reactor
	/** @ignore */
	react_keypress: function(e)
	{
		if (e.getKeyCode() === 13)  // enter
		{
			this.execBtn(e);
		}
	},
	/** @ignore */
	react_keydown: function(e)
	{
		if (this.getButtonKind() === Kekule.Widget.Button.Kinds.DROPDOWN)
		{
			var KC = Kekule.X.Event.KeyCode;
			if (e.getKeyCode() === KC.DOWN)
			{
				this.execBtn(e);
			}
		}
	}
});


/**
 * An general text area widget.
 * @class
 * @augments Kekule.Widget.FormWidget
 *
 * @property {String} text Text in textarea.
 * @property {String} placeholder Placeholder text of text box.
 * //@property {Int} rows Rows in textarea.
 * //@property {Int} cols Cols in textarea.
 * @property {String} wrap Wrap mode of textarea, value between "physical", "virtual" and "off".
 * @property {Bool} autoSizeX
 * @property {Bool} autoSizeY
 */
Kekule.Widget.TextArea = Class.create(Kekule.Widget.FormWidget,
/** @lends Kekule.Widget.TextArea# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.TextArea',
	/** @private */
	BINDABLE_TAG_NAMES: ['textarea'],
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument, text)
	{
		$super(parentOrElementOrDocument);
		if (text)
			this.setText(text);
		//this.setUseCornerDecoration(true);
		//this._manualPlaceholder = !Kekule.BrowserFeature.html5Form.placeholder;  // indicates old browser that not support placeholder
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('text', {'dataType': DataType.STRING,
			'getter': function() { return this.getValue(); },
			'setter': function(value)
			{
				this.setValue(value);
				this.adjustAutoSize();
				/*
				if (value)
					this.getElement().value = value;
				else
					this.getElement().value = '';
				*/
			}
		});
		this.defineProp('placeholder', {'dataType': DataType.STRING,
			'getter': function() { return this.getElement().placeholder; },
			'setter': function(value) { this.getElement().placeholder = value; }
		});
		this.defineProp('autoSizeX', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('autoSizeX', value);
				this._autoSizeChanged();
			}
		});
		this.defineProp('autoSizeY', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('autoSizeY', value);
				this._autoSizeChanged();
			}
		});
		//this.defineElemAttribMappingProp('cols', 'cols', {'dataType': DataType.INT});
		//this.defineElemAttribMappingProp('rows', 'rows', {'dataType': DataType.INT});
		//this.defineElemAttribMappingProp('wrap', 'wrap', {'dataType': DataType.STRING});
		this.defineProp('wrap', {'dataType': DataType.STRING,
			'getter': function()
			{
				return this.getElement().wrap;
			},
			'setter': function(value)
			{
				this.getElement().wrap = value;
			}
		});
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.TEXTAREA;
	},
	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('textarea');
		return result;
	},

	/** @ignore */
	doBindElement: function($super, element)
	{
		$super(element);
		this.adjustAutoSize();
	},

	/** @ignore */
	setValue: function($super, value)
	{
		$super(value);
		this.adjustAutoSize();
	},

	/** @ignore */
	widgetShowStateChanged: function($super, isShown)
	{
		$super(isShown);
		if (isShown)
			this.adjustAutoSize();
	},

	/** @ignore */
	reactValueChange: function($super)
	{
		this.adjustAutoSize();
		$super();
	},
	/** @ignore */
	react_keyup: function()
	{
		this.adjustAutoSize();
	},
	react_keypress: function()
	{
		this.adjustAutoSize();
	},

	/** @ignore */
	doWidgetShowStateChanged: function(isShown)
	{
		if (isShown)
		{
			this.adjustAutoSize();
		}
	},

	/** @private */
	_autoSizeChanged: function()
	{
		var style = this.getCoreElement().style;
		if (this.getAutoSizeX())
		{
			style.overflowX = 'hidden';
			this.setWrap('off');
		}
		else
		{
			style.overflowX = 'auto';
			this.setWrap('');
		}
		if (this.getAutoSizeY())
			style.overflowY = 'hidden';
		else
			style.overflowY = 'auto';
		this.adjustAutoSize();
	},

	/** @private */
	adjustAutoSize: function()
	{
		if (this.getAutoSizeX() || this.getAutoSizeY())
			this.adjustSizeByContent();
	},

	/**
	 * Change rows and cols property of textarea to fit the content inside it.
	 * @private
	 */
	adjustSizeByContent: function()
	{
		/*
		var text = this.getText();
		var lineCount = Kekule.StrUtils.getLineCount(text);
		var colCount = Kekule.StrUtils.getMaxLineCharCount(text);
		this.setRows(lineCount);
		this.setCols(colCount);
		return this;
		*/
		var elem = this.getCoreElement();
		var text = this.getText();
		var isEmpty = !text;

		var style = elem.style;
		if (this.getAutoSizeX())
			style.width = '1px';
		if (this.getAutoSizeY())
			style.height = '1px';

		var scrollDim = Kekule.HtmlElementUtils.getElemScrollDimension(elem);
		var clientDim = Kekule.HtmlElementUtils.getElemClientDimension(elem);
		if (this.getAutoSizeX())
		{
			if (isEmpty)  // use min width
				style.width = '1em';
			else if (scrollDim.width > clientDim.width)
				style.width = scrollDim.width + 'px';
		}
		if (this.getAutoSizeY())
		{
			if (isEmpty)  // use min height
				style.height = '1em';
			if (scrollDim.height > clientDim.height)
				style.height = scrollDim.height + 'px';
		}
	}
});

/**
 * An general select box widget.
 * @class
 * @augments Kekule.Widget.FormWidget
 *
 * @property {Array} items An array of hash objects that contains value and title info of select box item.
 *   Each item of array may have the following fields: {text, value, title, data}.
 * @property {Int} index Selected index of box items.
 * @property {Variant} value Selected value of box.
 */
Kekule.Widget.SelectBox = Class.create(Kekule.Widget.FormWidget,
/** @lends Kekule.Widget.SelectBox# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.SelectBox',
	/** @private */
	BINDABLE_TAG_NAMES: ['select'],
	/** @private */
	ITEM_DATA_FIELD: '__$item_data__',
	/** @private */
	ITEM_VALUE_FIELD: '__$item_value__',
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument, items)
	{
		$super(parentOrElementOrDocument);
		if (items)
			this.setItems(items);
		//this.setUseCornerDecoration(true);
		//this._manualPlaceholder = !Kekule.BrowserFeature.html5Form.placeholder;  // indicates old browser that not support placeholder
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('items', {'dataType': DataType.ARRAY, 'serializable': false,
			'getter': function()
			{
				var elems = this.getAllItemElems();
				var result = [];
				for (var i = 0, l = elems.length; i < l; ++i)
				{
					var elem = elems[i];
					var info = this._getBoxItemInfo(elem);
					result.push(info);
				}
				return result;
			},
			'setter': function(value)
			{
				var root = this.getElement();
				this.clear();
				if (value)
				{
					var items = Kekule.ArrayUtils.toArray(value);
					for (var i = 0, l = items.length; i < l; ++i)
					{
						var info = items[i];
						if (info)
						{
							var elem = this._createBoxItemElem(root);
							this._setBoxItemInfo(elem, info);
						}
					}
				}
			}
		});
		this.defineProp('index', {'dataType': DataType.INT,
			'getter': function()
			{
				/*
				var elems = this.getAllItemElems();
				for (var i = 0, l = elems.length; i < l; ++i)
				{
					var elem = elems[i];
					if (elem.selected)
						return i;
				}
				return -1;
				*/
				return this.getElement().selectedIndex;
			},
			'setter': function(value)
			{
				/*
				//var old = this.getIndex();
				var elems = this.getAllItemElems();
				var newIndex = parseInt(value);
				if (newIndex >= 0)
				{
					var newElem = elems[newIndex];
					if (newElem)
						newElem.selected = true;
				}
				else
				{

				}
				*/
				//console.log('set selectedIndex', value);
				this.getElement().selectedIndex = value;
			}
		});
		/*
		this.defineProp('text', {'dataType': DataType.STRING, 'serializable': false,
			'getter': function()
			{
				var elem = this.getSelectedItemElem();
				if (elem)
				{
					var info = this._getBoxItemInfo(elem);
					if (info)
						return info.text || info.value;
				}
				return undefined;
			},
			'setter': function(value)
			{
				var elems = this.getAllItemElems();
				for (var i = 0, l = elems.length; i < l; ++i)
				{
					var elem = elems[i];
					var info = this._getBoxItemInfo(elem);
					//if (info.value === value)
					if (info)
					{
						elem.selected = (info.text === value);
					}
					else
						elem.selected = false;
				}
			}
		});
		*/
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.SELECTBOX;
	},
	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('select');
		return result;
	},
	/** @private */
	_createBoxItemElem: function(parentElem, refElem)
	{
		var doc = parentElem.ownerDocument;
		var result = doc.createElement('option');
		if (refElem)
			parentElem.insertBefore(result, refElem);
		else
			parentElem.appendChild(result);
		return result;
	},

	/** @ignore */
	doBindElement: function($super, element)
	{
		$super(element);
	},
	/** @private */
	doGetValue: function()
	{
		var elem = this.getSelectedItemElem();
		if (elem)
		{
			var info = this._getBoxItemInfo(elem);
			return info.value;
		}
		else
			return undefined;
	},
	/** @private */
	doSetValue: function(value)
	{
		var elems = this.getAllItemElems();
		var index;
		for (var i = 0, l = elems.length; i < l; ++i)
		{
			var elem = elems[i];
			var info = this._getBoxItemInfo(elem);
			//console.log(info, info.value === value);
			if (info.value === value)
			{
				/*
				elem.selected = (info.value === value);
				if (elem.selected)
					index = elem.selected;
				*/
				//console.log('set value at index', i);
				this.setIndex(i);
				return;
			}
		}
		this.setIndex(-1);
	},

	/** @private */
	getAllItemElems: function()
	{
		return DU.getDirectChildElems(this.getElement(), 'option');
	},
	/** @private */
	getSelectedItemElem: function()
	{
		var elems = this.getAllItemElems();
		for (var i = 0, l = elems.length; i < l; ++i)
		{
			var elem = elems[i];
			if (elem.selected)
				return elem;
		}
		return null;
	},

	/**
	 * Clear all items in box.
	 */
	clear: function()
	{
		this.getElement().innerHTML = '';
	},

	/**
	 * Drop down the selection list of box.
	 * NOTE: Can only work in Webkit.
	 */
	dropDown: function()
	{
		var doc = this.getDocument();
		var elem = this.getElement();
		var event = this.getDocument().createEvent('MouseEvents');
		// typeArg,canBubbleArg,cancelableArg,viewArg,detailArg,screenXArg,screenYArg,clientXArg,clientYArg,ctrlKeyArg,altKeyArg,shiftKeyArg,metaKeyArg,buttonArg,relatedTargetArg
		//event.initMouseEvent('mousedown', true, true, doc.defaultView, null, null, null, null, null, null, null, null, null, null, Kekule.X.Event.MouseButton.LEFT, elem);
		event.initEvent('mousedown', true, true);
		this.getElement().dispatchEvent(event);
	},

	/** @private */
	_getBoxItemInfo: function(itemElem)
	{
		var result = {};
		result.text = EU.getInnerText(itemElem);
		//if (OU.notUnset(itemElem[this.ITEM_VALUE_FIELD]))  // value may be null or undefined
			result.value = itemElem[this.ITEM_VALUE_FIELD];  // as itemElem.value is always a string, we need another field to store variant value
		if (OU.notUnset(itemElem.title))
			result.title = itemElem.title;
		if (OU.notUnset(itemElem[this.ITEM_DATA_FIELD]))
			result.data = itemElem[this.ITEM_DATA_FIELD];
		return result;
	},
	/** @private */
	_setBoxItemInfo: function(itemElem, info)
	{
		if (DataType.isSimpleValue(info))  // info is direct text
		{
			info = {'value': info};
		}
		var text = info.text || info.value;
		if (OU.notUnset(text))
			Kekule.DomUtils.setElementText(itemElem, text);
		//if (OU.notUnset(info.value))  // value may be null or undefined
		{
			itemElem.value = '' + info.value;
			// as itemElem.value is always a string, we need another field to store variant value
			itemElem[this.ITEM_VALUE_FIELD] = info.value;
		}
		if (OU.notUnset(info.title))
			itemElem.title = info.title;
		if (OU.notUnset(info.data))
			itemElem[this.ITEM_DATA_FIELD] = info.data;
		if (info.selected)
		{
			itemElem.setAttribute('selected', 'selected');
		}
		else
			itemElem.selected = false;
		return this;
	}
});

/**
 * An general combo box widget. A combination of text box and select box.
 * @class
 * @augments Kekule.Widget.FormWidget
 *
 * @property {String} text Text in edit box.
 * @property {Array} items An array of hash objects that contains value and title info of select box item.
 *   Each item of array may have the following fields: {text, value, title, data}.
 */
/**
 * Invoked when user select a value from select box.
 *   event param of it has field: {widget, value}
 * @name Kekule.Widget.ComboBox#valueSelect
 * @event
 */
Kekule.Widget.ComboBox = Class.create(Kekule.Widget.FormWidget,
/** @lends Kekule.Widget.ComboBox# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.ComboBox',
	/** @private */
	BINDABLE_TAG_NAMES: ['div', 'span'],
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument)
	{
		$super(parentOrElementOrDocument);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('text', {'dataType': DataType.STRING, 'serializable': false,
			'getter': function()
			{
				var textBox = this.getTextBox();
				return textBox? textBox.getText(): null;
			},
			'setter': function(value)
			{
				var textBox = this.getTextBox();
				if (textBox)
				{
					textBox.setText(value);
					this.textChanged();
				}
			}
		});
		this.defineProp('items', {'dataType': DataType.ARRAY, 'serializable': false,
			'getter': function()
			{
				var selectBox = this.getSelectBox();
				return selectBox? selectBox.getItems(): null;
			},
			'setter': function(value)
			{
				var selectBox = this.getSelectBox();
				if (selectBox)
					selectBox.setItems(value);
			}
		});
		// private
		this.defineProp('textBox', {'dataType': 'Kekule.Widget.TextBox', 'serializable': false, 'setter': null, 'scope': Class.PropertyScope.PRIVATE});
		this.defineProp('selectBox', {'dataType': 'Kekule.Widget.SelectBox', 'serializable': false, 'setter': null, 'scope': Class.PropertyScope.PRIVATE});
	},
	finalize: function($super)
	{
		this._finalizeSubElements();
		$super();
	},
	_finalizeSubElements: function()
	{
		var textBox = this.getTextBox();
		if (textBox)
		{
			textBox.finalize();
			//this.setTextBox(null);
		}
		var selectBox = this.getSelectBox();
		if (selectBox)
		{
			selectBox.finalize();
			//this.setSelectBox(null);
		}
	},

	/** @ignore */
	getCoreElement: function($super)
	{
		var textBox = this.getTextBox();
		if (textBox)
			return textBox.getElement();
		else
			return $super();
	},

	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.COMBOBOX;
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
		var self = this;
		this._finalizeSubElements();

		// important, use span to put a width 100% input box,
		// otherwise width of input box is hard to set.
		var wrapper = doc.createElement('span');
		wrapper.className = CNS.COMBOBOX_TEXTWRAPPER;
		rootElem.appendChild(wrapper);
		var textBox = new Kekule.Widget.TextBox(this);
		//textBox.addClassName(CNS.COMBOBOX_TEXTBOX);
		textBox.appendToElem(wrapper);
		this.setPropStoreFieldValue('textBox', textBox);

		var selectBox = new Kekule.Widget.SelectBox(this);
		//selectBox.addClassName(CNS.COMBOBOX_SELECTBOX);
		selectBox.appendToElem(rootElem);
		this.setPropStoreFieldValue('selectBox', selectBox);

		// add event listener
		selectBox.addEventListener('valueChange', function(e)
			{
				var itemElem = selectBox.getSelectedItemElem();
				if (itemElem)
				{
					//var value = itemElem.value || itemElem.text;
					var value = itemElem.value;
					var text = itemElem.text || itemElem.value;
					//var value = selectBox.getValue();
					//textBox.setValue(value);
					if (text !== textBox.getText())
					{
						textBox.setText(text);
						self.notifyValueChanged();
					}
					textBox.selectAll();
					textBox.focus();
					self.invokeEvent('valueSelect', {'widget': self, 'value': value});
				}
			}
		);
		textBox.addEventListener('valueChange', function(e)
			{
				//selectBox.setValue(textBox.getValue());
				self.textChanged();
			}
		);
		Kekule.X.Event.addListener(textBox.getElement(), 'keydown', function(e)
			{
				var keyCode = e.getKeyCode();
				if (keyCode === Kekule.X.Event.KeyCode.DOWN)
				{
					selectBox.dropDown();
				}
			}
		);

		return [wrapper];
	},

	/** @ignore */
	relayEvent: function($super, eventName, event)
	{
		var invokerWidget = event.widget;
		if ((invokerWidget === this.getTextBox()) || (invokerWidget === this.getSelectBox()))
			event.widget = this;
		return $super(eventName, event);
	},

	/**
	 * Called when text in text box changes.
	 * @private
	 */
	textChanged: function()
	{
		var text = this.getText();
		var value = this._getValueOfText(text);
		this.getSelectBox().setValue(value);
	},
	/**
	 * Get corresponding value in select box.
	 * @private
	 */
	_getValueOfText: function(text)
	{
		var items = this.getSelectBox().getItems();
		for (var i = 0, l = items.length; i < l; ++i)
		{
			var item = items[i];
			if (item.text && (item.text === text))
				return item.value;
		}
		return text;
	},

	/** @ignore */
	doSetEnabled: function(value)
	{
		var textBox = this.getTextBox();
		if (textBox)
			textBox.setEnabled(value);
		var selectBox = this.getSelectBox();
		if (selectBox)
			selectBox.setEnabled(value);
	},

	/** @ignore */
	doGetValue: function($super)
	{
		var text = $super();
		// check if text is in select box, if so, return corresponding select box value
		var result = this._getValueOfText(text);
		return result;
	},
	/** @ignore */
	doSetValue: function($super, value)
	{
		var text = value;
		// check if value is in select box, if so, set corresponding text to text box
		var items = this.getSelectBox().getItems();
		this.getSelectBox().setIndex(-1);
		for (var i = 0, l = items.length; i < l; ++i)
		{
			var item = items[i];
			if (item.value === value)
			{
				text = item.text || item.value;
				this.getSelectBox().setIndex(i);
				//console.log('set value', i, text, item.value, item.text);
				break;
			}
		}
		$super(text);  // set value of core element(text box)
	}
});

})();