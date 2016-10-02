/**
 * @fileoverview
 * Implementation of button widgets.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /utils/kekule.domUtils.js
 * requires /xbrowsers/kekule.x.js
 * requires /widgets/kekule.widget.base.js
 * requires /widgets/kekule.widget.containers.js
 * requires /widgets/commonCtrls/kekule.widget.images.js
 */

(function(){

"use strict";

var EU = Kekule.HtmlElementUtils;
var CNS = Kekule.Widget.HtmlClassNames;

/** @ignore */
Kekule.Widget.HtmlClassNames = Object.extend(Kekule.Widget.HtmlClassNames, {
	BUTTON: 'K-Button',
	BUTTON_KINDED: 'K-Button-Kinded',
	BUTTON_GROUP: 'K-Button-Group',
	COMPACT_BUTTON: 'K-Compact-Button',

	BTN_COMPACT_MARK: 'K-Compact-Mark'
});

/**
 * An general button widget.
 * @class
 * @augments Kekule.Widget.BaseWidget
 *
 * @property {String} actionType Value of 'button', 'submit' or 'reset'.
 *   This property is actually mapped to 'type' attribute of button element.
 * @property {String} text Text on button.
 * @property {Kekule.Widge.Glyph} leadingGlyph
 * @property {Kekule.Widge.Glyph} tailingGlyph
 * @property {Bool} showLeadingGlyph
 * @property {Bool} showTailingGlyph
 * @property {Bool} showDropDownMark Whether show a dropdown mark (&#x25BC,▼).
 * @property {String} buttonKind Predefined kind that defines outlook of button. Value from {@link Kekule.Widget.Button.Kinds}.
 */
Kekule.Widget.Button = Class.create(Kekule.Widget.BaseWidget,
/** @lends Kekule.Widget.Button# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.Button',
	/** @private */
	BINDABLE_TAG_NAMES: ['input', 'button', 'a', 'label'],
	/** @private */
	CSS_DROPDOWN_CLASS_NAME: 'K-DropDownMark',
	/** @private */
	DEF_GLYPH_WIDTH: '16px',
	/** @private */
	DEF_GLYPH_HEIGHT: '16px',
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument, text)
	{
		// must init internal part vars before $super, as they may be setted in super constructor
		this._elemTextPart = null;  // used internally
		this._elemLeadingGlyphPart = null;
		this._elemTailingGlyphPart = null;

		$super(parentOrElementOrDocument);
		if (text)
			this.setText(text);
	},
	/** @private */
	initProperties: function()
	{
		this.defineElemAttribMappingProp('actionType', 'type');
		this.defineProp('text', {'dataType': DataType.STRING, 'serializable': false,
			'getter': function() {
				//return Kekule.HtmlElementUtils.getInnerText(this.getElement());
				var elem = (this._elemTextPart || this.getElement());
				return elem? elem.innerHTML: null;
			},
			'setter': function(value) { this.changeContentText(value); }
		});
		/*
		this.defineProp('allowTextWrap', {'dataType': DataType.BOOL, 'serialzable': false,
			'setter': function(value)
			{
				if (value)
					this.removeClassName(CNS.TEXT_NO_WRAP);
				else
					this.addClassName(CNS.TEXT_NO_WRAP);
			}
		});
		*/
		/*
		this.defineProp('showText', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('showText', value);
				//this._elemTextPart.style.display = value? '': 'none';
				if (value)
					this.removeClassName(CNS.HIDE_TEXT);
				else
					this.addClassName(CNS.HIDE_TEXT);
			}
		});
		*/

		this.defineProp('leadingGlyph', {'dataType': 'Kekule.Widget.Glyph', 'serializable': false,
			'scope': Class.PropertyScope.PUBLIC,
			'setter': null,
			'getter': function(canCreate)
			{
				var result = this.getPropStoreFieldValue('leadingGlyph');
				if (!result && canCreate)
				{
					result = this._createDefaultGlyphWidget(this._elemLeadingGlyphPart);
					this.setPropStoreFieldValue('leadingGlyph', result);
				}
				return result;
			}
		});
		this.defineProp('tailingGlyph', {'dataType': 'Kekule.Widget.Glyph', 'serializable': false,
			'scope': Class.PropertyScope.PUBLIC,
			'setter': null,
			'getter': function(canCreate)
			{
				var result = this.getPropStoreFieldValue('tailingGlyph');
				if (!result && canCreate)
				{
					result = this._createDefaultGlyphWidget(this._elemTailingGlyphPart);
					this.setPropStoreFieldValue('tailingGlyph', result);
				}
				return result;
			}
		});

		/*
		this.defineProp('showGlyph', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('showGlyph', value);
				if (value)
					this.removeClassName(CNS.HIDE_GLYPH);
				else
					this.addClassName(CNS.HIDE_GLYPH);
			}
		});
		*/
		this.defineProp('showLeadingGlyph', {'dataType': DataType.BOOL,
			'scope': Class.PropertyScope.PUBLIC,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('showLeadingGlyph', value);
				this._elemLeadingGlyphPart.style.display = (value && this.getShowGlyph())? '': 'none';
			}
		});
		this.defineProp('showTailingGlyph', {'dataType': DataType.BOOL,
			'scope': Class.PropertyScope.PUBLIC,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('showTailingGlyph', value);
				this._elemTailingGlyphPart.style.display = (value && this.getShowGlyph())? '': 'none';
			}
		});
		/*
		this.defineProp('showDropDownMark', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('showDropDownMark', value);
				if (value && (!this._elemDropDownMarkPart))
					this._createDropDownPart(this.getElement());
				if ((!value) && this._elemDropDownMarkPart)
					this._releaseDropDownPart();
			}
		});
		*/

		this.defineProp('buttonKind', {'dataType': DataType.STRING,
			'setter': function(value)
			{
				var old = this.getButtonKind();
				if (value !== old)
				{
					this.cancelButtonKind(old);
					this.applyButtonKind(value);
					this.setPropStoreFieldValue('buttonKind', value);
				}
			}
		});
	},
	initPropValues: function($super)
	{
		$super();

		// set style property before create element and appending to parent, important
		// as parent may set property of self
		this.setPropStoreFieldValue('showText', true);
		this.setPropStoreFieldValue('showGlyph', true);
		this.setPropStoreFieldValue('showLeadingGlyph', true);
		this.setPropStoreFieldValue('showTailingGlyph', true);
		this.setPropStoreFieldValue('useCornerDecoration', true);
		//this.setPropStoreFieldValue('showDropDownMark', false);

		this.setAllowTextWrap(false);
	},
	/** @private */
	_createDefaultGlyphWidget: function(parentElem)
	{
		var g = new Kekule.Widget.Glyph(this);
		g.setWidth(this.DEF_GLYPH_WIDTH).setHeight(this.DEF_GLYPH_HEIGHT);
		g.setStatic(true).setInheritState(true).setInheritStatic(true).setInheritEnabled(true);
		g.appendToElem(parentElem);
		return g;
	},
	/* @private */
	/*
	_createDropDownPart: function(parentElem)
	{
		// TODO: now use an unicode triangle to mark drop down. Need to change it to image in the future.
		var result = this.createDecorationContent(parentElem);
		result.innerHTML = '&#x25BC;';
		Kekule.HtmlElementUtils.addClass(result, this.CSS_DROPDOWN_CLASS_NAME);
		this._elemDropDownMarkPart = result;
		return result;
	},
	*/
	/* @private */
	/*
	_releaseDropDownPart: function()
	{
		if (this._elemDropDownMarkPart && this._elemDropDownMarkPart.parentNode)
		{
			this._elemDropDownMarkPart.parentNode.removeChild(this._elemDropDownMarkPart);
			this._elemDropDownMarkPart = null;
		}
	},
	*/

	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.BUTTON; //this.CSS_CLASS_NAME;
	},
	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('button');
		result.setAttribute('type', 'button');  // avoid default submit type
		/*
		var result = doc.createElement('a');
		result.setAttribute('href', 'javascript:void(0)');
		*/
		return result;
	},

	/** @ignore */
	doBindElement: function($super, element)
	{
		$super(element);
		//var text = EU.getInnerText(element);
		var text = element.innerHTML || '';
		element.innerHTML = '';  // clear old content first
		this._elemTextPart = this.createTextContent(text, element);
		this._elemLeadingGlyphPart = this.createGlyphContent(element, this._elemTextPart, CNS.PART_PRI_GLYPH_CONTENT);
		this._elemTailingGlyphPart = this.createGlyphContent(element, null, CNS.PART_ASSOC_GLYPH_CONTENT);
		/*
		if (this.getShowDropDownMark())
			this._createDropDownPart(element);
		*/
		if (this.getUseCornerDecoration())
			EU.addClass(element, CNS.CORNER_ALL);
	},

	/* @ignore */
	/*
	getStateClassName: function($super, state)
	{
		var result = $super(state) + ' ';

		var WS = Kekule.Widget.State;
		result +=
			(state === WS.ACTIVE)? CNS.STATE_BTN_ACTIVE:
			(state === WS.HOVER)? CNS.STATE_BTN_HOVER:
			(state === WS.FOCUSED)? CNS.STATE_BTN_FOCUSED:
			(state === WS.DISABLED)? CNS.STATE_BTN_DISABLED:
				CNS.STATE_BTN_NORMAL;
	return result;
	},
	*/

	/** @private */
	changeContentText: function(newText)
	{
		/*
		if (this._elemTextPart)
		{
			this.getElement().removeChild(this._elemTextPart);
			this._elemTextPart = this.createTextContent(text, element);
		}
		*/
		this._elemTextPart.innerHTML = newText || '';
	},

	/** @private */
	isPeriodicalExecuting: function($super)
	{
		return $super() && this.getIsActive();
	},

	/** @private */
	doReactActiviting: function($super, e)
	{
		$super(e);
		if (this.getEnablePeriodicalExec())
			this.startPeriodicalExec(e);
	},
	/** @private */
	doReactDeactiviting: function($super, e)
	{
		//if (this.getEnablePeriodicalExec())
		this.stopPeriodicalExec();  // stop it anyway
		if (this.getIsActive())  // meet a active-deactive event, clicked or key pressed on button
		{
			this.execute(e);
			//console.log('execute', e);
		}
	},

	/** @private */
	cancelButtonKind: function(kind)
	{
		if (kind)
		{
			this.removeClassName(kind);
			this.removeClassName(CNS.BUTTON_KINDED);
		}
	},
	/** @private */
	applyButtonKind: function(kind)
	{
		if (kind)
		{
			this.addClassName(CNS.BUTTON_KINDED);
			this.addClassName(kind);
		}
	}

	// event handlers
	/** @private */
	/*
	react_click: function(e)
	{
		this.execute();
	}
	*/
});
/**
 * Predefined button kinds.
 * @class
 */
Kekule.Widget.Button.Kinds = {
	DROPDOWN: 'K-Kind-DropDown',
	POPUP: 'K-Kind-Popup',
	SEARCH: 'K-Kind-Search',
	EDIT: 'K-Kind-Edit'
	/*
	ELLIPSIS: 'K-Kind-Ellipsis'
	*/
};

/**
 * An check button widget. Press on it will toggle the check state of button.
 * @class
 * @augments Kekule.Widget.Button
 *
 * @property {Bool} checked Whether the button has been pressed down.
 * @property {Bool} autoCheck If true, the button will be automatically checked/unchecked when clicking on it.
 */
/**
 * Invoked button is checked.
 *   event param of it has field: {widget}
 * @name Kekule.Widget.CheckButton#check
 * @event
 */
/**
 * Invoked button is unchecked.
 *   event param of it has field: {widget}
 * @name Kekule.Widget.CheckButton#uncheck
 * @event
 */
/**
 * Invoked button checked state changed.
 *   event param of it has field: {widget, checked}
 * @name Kekule.Widget.CheckButton#checkChange
 * @event
 */
Kekule.Widget.CheckButton = Class.create(Kekule.Widget.Button,
/** @lends Kekule.Widget.CheckButton# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.CheckButton',
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument, text)
	{
		$super(parentOrElementOrDocument, text);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('checked', {'dataType': DataType.BOOL,
			'setter': function(value)
				{
					if (this.getPropStoreFieldValue('checked') !== value)
					{
						this.setPropStoreFieldValue('checked', value);
						this.checkChanged();
						this.stateChanged();
					}
				}
		});
		this.defineProp('autoCheck', {'dataType': DataType.BOOL});
	},
	/** @ignore */
	initPropValues: function($super)
	{
		$super();
		this.setAutoCheck(true);
	},

	/**
	 * Called when checked property is changed.
	 * Desendants may override this method.
	 */
	checkChanged: function()
	{
		// do nothing here
		if (this.getChecked())
			this.invokeEvent('check');
		else
			this.invokeEvent('uncheck');
		this.invokeEvent('checkChange', {'checked': this.getChecked()});
	},

	/** @ignore */
	getStateClassName: function($super, state)
	{
		var st = this.getChecked()? Kekule.Widget.State.ACTIVE: state;
		return $super(st);
	},
	/** @ignore */
	doReactDeactiviting: function($super, e)
	//doExecute: function($super, invokerHtmlEvent)
	{
		//$super(invokerHtmlEvent);
		var oldChecked = this.getChecked();
		$super(e);  // execute runs here, may also change checked status
		if (this.getAutoCheck())
			this._doToggleCheckOnSelf(oldChecked);
	},
	/** @private */
	_doToggleCheckOnSelf: function(oldChecked)
	{
		if (this.getEnabled())
			this.setChecked(/*!this.getChecked()*/!oldChecked);
	}
});

/**
 * An check button widget. Press on it will toggle the check state of button.
 * @class
 * @augments Kekule.Widget.CheckButton
 *
 * @property {Bool} checked Whether the button has been pressed down.
 */
Kekule.Widget.RadioButton = Class.create(Kekule.Widget.CheckButton,
/** @lends Kekule.Widget.RadioButton# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.RadioButton',
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument, text)
	{
		$super(parentOrElementOrDocument, text);
		//this.setGroup('');  // default value, avoid undefined
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('group', {'dataType': DataType.STRING});
	},

	/** @ignore */
	checkChanged: function($super)
	{
		$super();
		if (this.getChecked())
		{
			//check parent widget, and set all radio button with same group name to unchecked
			this.uncheckSiblings();
		}
	},
	/** @private */
	uncheckSiblings: function()
	{
		//console.log('uncheck siblings');
		var parent = this.getParent();
		var groupName = this.getGroup();
		if (parent)
		{
			var ws = parent.getChildWidgets();
			for (var i = 0, l = ws.length; i < l; ++i)
			{
				var w = ws[i];
				if ((w !== this) && w.getGroup && w.setChecked && (w.getGroup() === groupName))
					w.setChecked(false);
			}
		}
	},

	/** @ignore */
	doReactDeactiviting: function($super, e)
	{
		$super(e);
	},
	/** @ignore */
	_doToggleCheckOnSelf: function($super, oldChecked)
	{
		if (oldChecked)
			return;  // radio button cannot uncheck self
		else
			$super(oldChecked);
	},
	/** @private */
	_doCheckOnSelf: function()
	{
		if (this.getEnabled())
			this.setChecked(true);
	}
});

/**
 * An drop-down button widget. Press on it will show another widget to its right or bottom.
 * @class
 * @augments Kekule.Widget.Button
 *
 * @property {Kekule.Widget.BaseWidget} dropDownWidget Widget that will be shown when button is pressed.
 * //@property {Bool} dropDownOnHover Whether shows drop down widget on mouse hover and hide it on mouse leave.
 * @property {Int} dropPosition Value from {@link Kekule.Widget.Position}, position of top-left corner of drop widget (based on current button).
 *   Set it to null means automatically.
 */
/**
 * Invoked when the drop down widget is invoked by button.
 *   event param of it has field: {dropDown: Widget}
 * @name Kekule.Widget.DropDownButton#dropDown
 * @event
 */
Kekule.Widget.DropDownButton = Class.create(Kekule.Widget.Button,
/** @lends Kekule.Widget.DropDownButton# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.DropDownButton',
	/** @private */
	doFinalize: function($super)
	{
		$super();
		/*
		var w = this.getDropDownWidget();
		if (w)
			w.finalize();
		*/
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('dropDownWidget', {'dataType': 'Kekule.Widget.BaseWidget', 'serializable': false,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('dropDownWidget', value);
				if (value)  // hide it first
				{
					value.setDisplayed(false);
				}
			}
		});
		//this.defineProp('dropDownOnHover', {'dataType': DataType.BOOL});
		this.defineProp('dropPosition', {'dataType': DataType.INT});
	},

	/** @ignore */
	doCreateRootElement: function($super, doc)
	{
		/*
		var result = doc.createElement('a');
		result.setAttribute('href', 'javascript:void(0)');
		return result;  // NOTE: use <button> will cause problem in Firefox
		*/
		return $super(doc);
	},

	/** @private */
	calcActualDropPosition: function()
	{
		var D = Kekule.Widget.Position;
		var pos = this.getDropPosition();
		if (!pos)  // automatically
		{
			var p = this.getParent();
			var layout = p? p.getLayout(): Kekule.Widget.Layout.HORIZONTAL;

			// check which direction can display all part of widget and drop dropdown widget to that direction
			var selfClientRect = Kekule.HtmlElementUtils.getElemBoundingClientRect(this.getElement());
			var viewPortDim = Kekule.HtmlElementUtils.getViewportDimension(this.getElement());
			var dropElem = this.getDropDownWidget().getElement();
			// add the dropdown element to DOM tree first, else the offsetDimension will always return 0
			dropElem.style.visible = 'hidden';
			dropElem.style.display = '';
			this.getElement().appendChild(dropElem);  // IMPORTANT: must append to self, otherwise style may be different
			var dropDim = Kekule.HtmlElementUtils.getElemOffsetDimension(dropElem);
			// then remove from DOM tree
			this.getElement().removeChild(dropElem);

			if (layout)
			{
				if (layout === Kekule.Widget.Layout.VERTICAL)  // check left or right
				{
					var left = selfClientRect.x;
					var right = viewPortDim.width - left - selfClientRect.width;
					// we prefer right, check if right can display drop down widget
					if (right >= dropDim.width)
						pos = D.RIGHT;
					else
						pos = (left > right)? D.LEFT: D.RIGHT;
				}
				else  // check top or bottom
				{
					var top = selfClientRect.y;
					var bottom = viewPortDim.height - top - selfClientRect.height;
					// we prefer bottom
					if (bottom >= dropDim.height)
						pos = D.BOTTOM;
					else
						pos = (top > bottom)? D.TOP: D.BOTTOM;
				}
			}
		}
		return pos;
	},
	/** @private */
	showDropDownWidget: function()
	{
		var dropWidget = this.getDropDownWidget();

		// move drop widget's element inside self's
		var dropElem = dropWidget.getElement();
		dropElem.style.position = 'absolute';
		var elem = this.getElement();

		// set position
		/*
		var D = Kekule.Widget.Position;
		var SU = Kekule.StyleUtils;
		var pos = this.calcActualDropPosition();
		var xprop = (pos & D.LEFT)? 'right': 'left';
		var yprop = (pos & D.TOP)? 'bottom': 'top';
		var x = (pos & D.LEFT) || (pos & D.RIGHT)? this.getOffsetWidth(): 0;
		var y = (pos & D.BOTTOM) || (pos & D.TOP)? this.getOffsetHeight(): 0;
		x += 'px';
		y += 'px';


		dropElem.style.left = '';
		dropElem.style.right = '';
		dropElem.style[xprop] = x;
		dropElem.style.top = '';
		dropElem.style.bottom = '';
		dropElem.style[yprop] = y;
		dropElem.style.zIndex = 10;

		//elem.appendChild(dropElem);

		dropWidget.setParent(this);
		dropWidget.appendToElem(elem);  // must append after set position, else the computedStyle of elem may change
		*/
		// show
		//dropWidget.setIsPopup(true);
		dropWidget.show(this, null, Kekule.Widget.ShowHideType.DROPDOWN);

		this.invokeEvent('dropDown', {'dropDown': dropWidget});
	},
	/** @private */
	hideDropDownWidget: function()
	{
		this.getDropDownWidget().hide(this);
	},
	/** @private */
	isDropDownWidgetShown: function()
	{
		var w = this.getDropDownWidget();
		var result = w && w.isShown();
		/*
		if (result)  // check if widget add as child of self element
			result = (w.getParent() === this) && (w.getElement().parentNode === this.getElement());
		*/
		return result;
	},

	/** @private */
	doExecute: function($super, invokerHtmlEvent)
	{
		if (this.getDropDownWidget())
		{
			//console.log('drop', this.isDropDownWidgetShown());
			if (this.isDropDownWidgetShown())
			{
				this.hideDropDownWidget();
			}
			else
			{
				this.showDropDownWidget();
			}
		}
		$super(invokerHtmlEvent);
	}
});

/**
 * An container to hold a set of buttons.
 * @class
 * @augments Kekule.Widget.Toolbar
 *
 * //@property {Bool} showText Whether show text in all buttons in group.
 * //@property {Bool} showGlyph Whether show glyph in all buttons in group.
 */
Kekule.Widget.ButtonGroup = Class.create(Kekule.Widget.Toolbar,
/** @lends Kekule.Widget.ButtonGroup# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.ButtonGroup',
	/** @construct */
	initialize: function($super, parentOrElementOrDocument)
	{
		$super(parentOrElementOrDocument);
	},
	/** @ignore */
	initPropValues: function($super)
	{
		$super();
		this.setPropStoreFieldValue('showText', true);
		this.setPropStoreFieldValue('showGlyph', true);
		this.setAllowChildWrap(false);
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.BUTTON_GROUP;
	},
	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('span');
		return result;
	},
	/** @ignore */
	getDefaultChildWidgetClassName: function()
	{
		return 'Kekule.Widget.Button';
	}
});

/**
 * An a set of buttons display only one at a time.
 * @class
 * @augments Kekule.Widget.DropDownButton
 *
 * @property {Int} buttonSetLayout Layout of button set. Set to null to auto calculate it.
 * @property {selected} Currently selected button in set.
 * @property {Bool} cloneSelectedOutlook
 */
/**
 * Invoked when a button in set is selected.
 *   event param of it has field: {selected: button}
 * @name Kekule.Widget.CompactButtonSet#select
 * @event
 */
Kekule.Widget.CompactButtonSet = Class.create(Kekule.Widget.DropDownButton,
/** @lends Kekule.Widget.CompactButtonSet# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.CompactButtonSet',
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument, text)
	{
		this.reactSetButtonExecuteBind = this.reactSetButtonExecute.bind(this);
		//this.reactSetButtonCheckBind = this.reactSetButtonCheck.bind(this);
		this.setPropStoreFieldValue('showCompactMark', true);
		this.setPropStoreFieldValue('cloneSelectedOutlook', true);
		$super(parentOrElementOrDocument, text);
		//this._compactMark = this.createCompactMark();
		if (!this.getButtonSet())
			this.initButtonGroup();
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('buttonSet', {'dataType': 'Kekule.Widget.ButtonGroup', 'serializable': false,
			'setter': function(value)
			{
				var old = this.getButtonSet();
				if (old !== value)
				{
					if (old)
						old.finalize();
					this.initButtonGroup(value);
				}
			}
		});
		this.defineProp('buttonSetLayout', {'dataType': DataType.INT});
		this.defineProp('selected', {'dataType': 'Kekule.Widget.Button', 'serializable': false,
			'setter': function(value)
			{
				if (value)
				{
					if (this.getButtonSet().hasChild(value))
					{
						if (this.getCloneSelectedOutlook())
							this.cloneSetButton(value);
						if (value.setChecked)
							value.setChecked(true);
					}
				}
				else  // setSelected(null), uncheck all
				{
					var w = this.getSelected();
					if (w)
						w.setChecked(false);
				}
				this.setPropStoreFieldValue('selected', value);
			}
		});
		this.defineProp('cloneSelectedOutlook', {'dataType': DataType.BOOL});
		this.defineProp('showCompactMark', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				var old = this.getShowCompactMark();
				if (old !== value)
				{
					this.setPropStoreFieldValue('showCompactMark', value);
					if (value)
						this.createCompactMark();
					else
					  this.removeCompactMark();
				}
			}
		});
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.COMPACT_BUTTON; //this.CSS_CLASS_NAME;
	},

	/** @private */
	doSetShowText: function($super, value)
	{
		if (this.getButtonSet())
			this.getButtonSet().setShowText(value);
		return $super(value);
	},
	/** @private */
	doSetShowGlyph: function($super, value)
	{
		if (this.getButtonSet())
			this.getButtonSet().setShowGlyph(value);
		return $super(value);
	},

	/** @private */
	createCompactMark: function()
	{
		var btnElem = this.getElement();
		if (this._compactMark)
			btnElem.removeChild(this._compactMark);
		var mark = this.getDocument().createElement('span');
		mark.className = CNS.BTN_COMPACT_MARK;
		btnElem.appendChild(mark);
		this._compactMark = mark;
		return mark;
	},
	/** @private */
	removeCompactMark: function()
	{
		var btnElem = this.getElement();
		if (this._compactMark)
			btnElem.removeChild(this._compactMark);
	},

	/** @private */
	initButtonGroup: function(btnSet)
	{
		if (!btnSet)
		{
			btnSet = new Kekule.Widget.ButtonGroup(this);
		}
		else
		{
			// if some button already checked, clone styles later
			var checkedBtn = this._getCheckedButtonInGroup(btnSet)
		}
		btnSet.setDisplayed(false);
		btnSet.setShowText(this.getShowText());
		btnSet.setShowGlyph(this.getShowGlyph());
		this.setPropStoreFieldValue('buttonSet', btnSet);
		this.setDropDownWidget(btnSet);
		btnSet.addEventListener('execute', this.reactSetButtonExecuteBind);
		btnSet.addEventListener('check', this.reactSetButtonExecuteBind);

		if (checkedBtn)
		{
			this.cloneSetButton(checkedBtn);
		}
	},

	/** @private */
	_getCheckedButtonInGroup: function(btnGroup)
	{
		var ws = btnGroup.getChildWidgets();
		for (var i = 0, l = ws.length; i < l; ++i)
		{
			var w = ws[i];
			if (w.getChecked && w.getChecked())
				return w;
		}
		return null;
	},

	/** @private */
	cloneSetButton: function(btn)
	{
		if (!this.getCloneSelectedOutlook())
			return;

		var thisElem = this.getElement();
		var setElem = this.getButtonSet().getElement();
		/*
		var innerHTML = btn.getElement().innerHTML;
		if (thisElem.contains(setElem))
			thisElem.removeChild(setElem);  // remove first, avoid element lost in IE
		thisElem.innerHTML = innerHTML;
		*/
		var DU = Kekule.DomUtils;
		var thisChildren = DU.getDirectChildElems(thisElem);
		var btnChildren = DU.getDirectChildElems(btn.getElement());
		var setElemInside = false;
		for (var i = 0, l = thisChildren.length; i < l; ++i)
		{
			var child = thisChildren[i];
			if (child !== setElem)
				thisElem.removeChild(child);
			else
				setElemInside = true;
		}
		for (var i = 0, l = btnChildren.length; i < l; ++i)
		{
			var child = btnChildren[i].cloneNode(true);
			//console.log(child, setElem);
			if (setElemInside)
				thisElem.insertBefore(child, setElem);
			else
				thisElem.appendChild(child);
		}

		if (this._clonedCustomHtmlClassName)
			this.removeClassName(this._clonedCustomHtmlClassName);
		this._clonedCustomHtmlClassName = btn.getCustomHtmlClassName();
		//console.log(this._clonedCustomHtmlClassName);
		if (this._clonedCustomHtmlClassName)
			this.addClassName(this._clonedCustomHtmlClassName);
		this._compactMark = null;
		this.createCompactMark();
		//this.getButtonSet().setParent(this);
	},

	/** @private */
	calcActualButtonSetLayout: function()
	{
		var L = Kekule.Widget.Layout;
		var result = this.getButtonSetLayout();
		if (!result)  // auto calc
		{
			var p = this.getParent();
			var layout = p? p.getLayout(): L.HORIZONTAL;
			result = (layout === L.VERTICAL)?
				L.HORIZONTAL: L.VERTICAL;
		}
		return result;
	},

	/** @private */
	showDropDownWidget: function($super)
	{
		var layout = this.calcActualButtonSetLayout();
		this.getButtonSet().setLayout(layout);
		$super();
	},

	/** @private */
	reactSetButtonExecute: function(e)
	{
		if (e.target instanceof Kekule.Widget.Button)  // click on set button
		{
			if (e.target !== this.getSelected())
			{
				e.target.setIsFocused(false);
				e.target.setIsHover(false);
				e.target.setIsActive(false);

				this.setSelected(e.target);

				if (this.getButtonSet().isShown())
					this.getButtonSet().hide();
				/*
				var self = this;
				this.getButtonSet().hide(function() { self.setSelected(e.target); });
				*/
				this.invokeEvent('select', {'selected': e.target});
			}
		}
	},

	/**
	 * Append a button to set.
	 * @param {Kekule.Widget.Button} btn
	 * @param {Bool} asSelected
	 */
	append: function(btn, asSelected)
	{
		this.getButtonSet().appendWidget(btn);
		if (asSelected)
			this.setSelected(btn);
		return this;
	},
	/**
	 * Insert a button before ref button.
	 * @param {Kekule.Widget.Button} btn
	 * @param {Kekule.Widget.Button} ref
	 */
	insertBefore: function(btn, ref, asSelected)
	{
		this.getButtonSet().insertWidgetBefore(btn);
		if (asSelected)
			this.setSelected(btn);
		return this;
	},
	/**
	 * Remove btn from set.
	 * @param {Kekule.Widget.Button} btn
	 * @param {Bool} doNotFinalize If set to true, the btn will not be finalized.
	 */
	remove: function(btn, doNotFinalize)
	{
		this.getButtonSet().removeWidget(btn, doNotFinalize);
		return this;
	}
});

})();