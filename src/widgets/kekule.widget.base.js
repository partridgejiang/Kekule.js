/**
 * @fileoverview
 * Widget is a control embeded in HTML element and react to UI events (so it can interact with users).
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /utils/kekule.utils.js
 * requires /utils/kekule.domUtils.js
 * requires /xbrowsers/kekule.x.js
 */

(function(){

var AU = Kekule.ArrayUtils;
var EU = Kekule.HtmlElementUtils;

/**
 * Namespace for UI Widgets.
 * @namespace
 */
Kekule.Widget = {
	/** @private */
	DEF_EVENT_HANDLER_PREFIX: 'react_',
	/** @private */
	DEF_TOUCH_GESTURE_HANDLER_PREFIX: 'react_touch_',
	/** @private */
	getEventHandleFuncName: function(eventName)
	{
		return Kekule.Widget.DEF_EVENT_HANDLER_PREFIX + eventName;
	},
	/** @private */
	getTouchGestureHandleFuncName: function(touchGestureName)
	{
		//return Kekule.Widget.DEF_TOUCH_GESTURE_HANDLER_PREFIX + touchGestureName;
		return Kekule.Widget.DEF_EVENT_HANDLER_PREFIX + touchGestureName;
	}
};

/**
 * Enumeration of predefined widget element class names.
 * @ignore
 */
Kekule.Widget.HtmlClassNames = {
	/** A class name should add to all widget elements. */
	BASE: 'K-Widget',
	/** Child widget dynamic created by parent widget. */
	DYN_CREATED: 'K-Dynamic-Created',
	/* A top most layer. */
	/*TOP_LAYER: 'K-Top-Layer',*/
	NORMAL_BACKGROUND: 'K-Normal-Background',
	/** Indicate text in widget can not be selected. */
	NONSELECTABLE: 'K-NonSelectable',
	SELECTABLE: 'K-Selectable',
	// State classes
	/** Class name for all widget elements in normal (enabled) state. */
	STATE_NORMAL: 'K-State-Normal',
	/** Class name for all widget elements in disabled state. */
	STATE_DISABLED: 'K-State-Disabled',

	STATE_HOVER: 'K-State-Hover',
	STATE_ACTIVE: 'K-State-Active',
	STATE_FOCUSED: 'K-State-Focused',

	STATE_SELECTED: 'K-State-Selected',
	STATE_CHECKED: 'K-State-Checked',

	// show type
	SHOW_POPUP: 'K-Show-Popup',
	SHOW_DIALOG: 'K-Show-Dialog',
	SHOW_ACTIVE_MODAL: 'K-Show-ActiveModal',

	// parts
	PART_CONTENT: 'K-Content',
	PART_TEXT_CONTENT: 'K-Text-Content',
	PART_ASSOC_TEXT_CONTENT: 'K-Assoc-Text-Content',
	PART_IMG_CONTENT: 'K-Img-Content',
	PART_GLYPH_CONTENT: 'K-Glyph-Content',
	PART_PRI_GLYPH_CONTENT: 'K-Pri-Glyph-Content',
	PART_ASSOC_GLYPH_CONTENT: 'K-Assoc-Glyph-Content',
	PART_DECORATION_CONTENT: 'K-Decoration-Content',
	PART_ERROR_REPORT: 'K-Error-Report',
	// container
	FIRST_CHILD: 'K-First-Child',
	LAST_CHILD: 'K-Last-Child',
	/*
	BTN_GROUP_H: 'K-ButtonGroup-H',
	BTN_GROUP_V: 'K-ButtonGroup-V',
	*/
	// text control
	TEXT_NO_WRAP: 'K-No-Wrap',
	// layout
	LAYOUT_H: 'K-Layout-H',
	LAYOUT_V: 'K-Layout-V',
	// outlook/decoration classes
	CORNER_ALL: 'K-Corner-All',
	CORNER_LEFT: 'K-Corner-Left',
	CORNER_RIGHT: 'K-Corner-Right',
	CORNER_TOP: 'K-Corner-Top',
	CORNER_BOTTOM: 'K-Corner-Bottom',
	CORNER_TL: 'K-Corner-TL',
	CORNER_TR: 'K-Corner-TR',
	CORNER_BL: 'K-Corner-BL',
	CORNER_BR: 'K-Corner-BR',
	CORNER_LEADING: 'K-Corner-Leading',
	CORNER_TAILING: 'K-Corner-Tailing',
	FULLFILL: 'K-Fulfill',

	NOWRAP: 'K-No-Wrap',

	HIDE_TEXT: 'K-Text-Hide',
	HIDE_GLYPH: 'K-Glyph-Hide',
	SHOW_TEXT: 'K-Text-Show',
	SHOW_GLYPH: 'K-Glyph-Show',

	MODAL_BACKGROUND: 'K-Modal-Background',

	DUMB_WIDGET: 'K-Dumb-Widget',
	PLACEHOLDER: 'K-PlaceHolder'
};

var CNS = Kekule.Widget.HtmlClassNames;

/**
 * Enumeration of layout of widget group.
 */
Kekule.Widget.Layout = {
	HORIZONTAL: 1,
	VERTICAL: 2
};

/**
 * Enumeration of relative position of widget.
 */
Kekule.Widget.Position = {
	AUTO: 0,
	TOP: 1,
	LEFT: 2,
	BOTTOM: 4,
	RIGHT: 8,

	TOP_LEFT: 3,
	TOP_RIGHT: 9,
	BOTTOM_LEFT: 6,
	BOTTOM_RIGHT: 12
};

/**
 * Enumeration of directions.
 * In some case, use can use the combination of directions, e.g. LTR | TTB.
 */
Kekule.Widget.Direction = {
	/** Automatic direction. */
	AUTO: 0,
	/** Left to right. */
	LTR: 1,
	/** Top to bottom. */
	TTB: 2,
	/** Right to left. */
	RTL: 4,
	/** Bottom to top. */
	BTT: 8,

	/**
	 * Check if direction has horizontal component (LTR/RTL).
	 * @param {Int} direction
	 * @returns {Bool}
	 */
	isInHorizontal: function(direction)
	{
		var D = Kekule.Widget.Direction;
		return !!((direction & D.LTR) || (direction & D.RTL));
	},
	/**
	 * Check if direction has vertical component (TTB/BTT).
	 * @param {Int} direction
	 * @returns {Bool}
	 */
	isInVertical: function(direction)
	{
		var D = Kekule.Widget.Direction;
		return !!((direction & D.TTB) || (direction & D.BTT));
	}
};

/**
 * Enumeration of state of widget.
 * @enum
 */
Kekule.Widget.State = {
	NORMAL: 0,
	FOCUSED: 1,
	HOVER: 2,
	ACTIVE: 3,
	DISABLED: -1
};

/** @ignore */
var WS = Kekule.Widget.State;

/**
 * Enumeration of mode of showing widget.
 * @enum
 */
Kekule.Widget.ShowHideType = {
	DROPDOWN: 1,
	POPUP: 2,
	DIALOG: 3,
	DEFAULT: 0
};

/**
 * A series of interactive events that may be handled by widget.
 * @ignore
 */
Kekule.Widget.UiEvents = [
	/*'blur', 'focus',*/ 'click', 'dblclick', 'mousedown',/*'mouseenter', 'mouseleave',*/ 'mousemove', 'mouseout', 'mouseover', 'mouseup', 'mousewheel',
	'keydown', 'keyup', 'keypress',
	'touchstart', 'touchend', 'touchcancel', 'touchleave', 'touchmove'
];
/**
 * A series of interactive events that must be listened on local element.
 * @ignore
 */
Kekule.Widget.UiLocalEvents = [
	'blur', 'focus', 'mouseenter', 'mouseleave'
];

/**
 * A series of interactive touch gestures that may be handled by widget.
 * @ignore
 */
Kekule.Widget.TouchGestures = [
	'hold', 'tap', 'doubletap',
	'swipe', 'swipeup', 'swipedown', 'swipeleft', 'swiperight',
	'transform', 'transformstart', 'transformend',
	'rotate',
	'pinch', 'pinchin', 'pinchout',
	'touch', 'release'
];

/** @ignore */
var widgetBindingField = '__$kekule_widget__';

/**
 * An abstract UI widget.
 * Event param invoked by widget will always has a 'widget' field indicate the widget raise the event.
 * This value may not be same as event.target, e.g., a widget containing child widgets, when child widget
 * invokes an event and bubbles to parent widget, parent widget may overwrite event.widget.
 * @class
 * @augments ObjectEx
 *
 * @param {Variant} HTMLElement or HTMLDocument or {@link Kekule.Widget.BaseWidget}.
 *   If it is an HTML element, the widget will bind to this one.
 *   If it is an HTML document, the widget will be created in it.
 *   If it is Kekule.Widget.BaseWidget, a new HTML element will be created and append in parent widget.
 * @param {Bool} isDumb Whether the widget is a dumb one (do not react to events).
 * 	This type of dumb widget is used to create some very light-weighted static widgets, in other word,
 * 	just used to bind widget styles to some HTML element.
 * @param {Bool} bubbleUiEvents Defaultly, ui event (mouseenter, keyup and so on) will only be handled by
 *   widget itself and will not bubble to higher level widget. Set this property to true to pass such events
 *   to parent widget.
 * @param {Bool} inheritBubbleUiEvents When bubbleUiEvents value is inherited from parent widget.
 *   For example, if this.getBubbleUiEvents() == false but this.getParent().getBubbleUiEvents() == true,
 *   the ui events will still bubbled to parent widget.
 *
 * @property {Kekule.Widget.BaseWidget} parent Parent widget.
 * @property {HTMLDocument} document HTML document contains this widget.
 * @property {HTMLElement} element HTML element bind with this widget.
 * @property {Bool} isDumb Whether the widget is a dumb one (do not react to events). Readonly.
 * 	This type of dumb widget is used to create some very light-weighted static widgets, in other word,
 * 	just used to bind widget styles to some HTML element.
 * @property {Bool} observeElementAttribChanges If this property is true, when the attribute of binded element changed in DOM,
 *   the widget will also reflect to it.
 * @property {String} id ID of corresponding HTML element.
 * @property {String} width Width style of element.
 * @property {String} height Height style of element.
 * @property {String} innerHTML Current element's innerHTML value.
 * @property {Object} style CSS style object of current binding element.
 * @property {String} cssText CSS text of current binding element.
 * @property {String} htmlClassName HTML class of current binding element. This property will include all values in element's class attribute.
 * @property {String} customHtmlClassName HTML class set by user. This property will exclude some predefined class names.
 * //@property {Array} outlookStyleClassNames Classes used to control the outlook of widget. Usually user do not need to access this value.
 * @property {Bool} useCornerDecoration
 * @property {Int} layout Layout of child widgets. Value from {@link Kekule.Widget.Layout}.
 * @property {Bool} allowTextWrap
 * @property {Bool} showText Whether show text content in widget.
 * @property {Bool} showGlyph Whether show glyph content in widget.
 * @property {Bool} visible Whether current bind element's visibility style is not 'hidden'.
 * @property {Bool} displayed Whether current bind element's display style is not 'none'.
 * @property {Bool} finalizeAfterHiding If true, this widget will be automatically be finalize
 *   after {@link Kekule.Widget.BaseWidget.hide} is called.
 * @property {Bool} enabled Whether widget can reflect to user input. Default is true.
 * @property {Bool} inheritEnabled If set to true, widget will be turned to disabled when parent is disabled.
 * @property {Bool} static Whether this widget can react to interaction events.
 * @property {Bool} inheritStatic If set to true, widget will be static if parent is static.
 * @property {Int} state State (normal, focused, hover, active) of widget, value from {@link Kekule.Widget.State}. Readonly.
 * @property {Bool} inheritState If set to true, widget will has the same state value of parent.
 * @property {String} hint Hint of widget, actually mapping to title attribute of HTML element.
 * @property {String} cursor CSS cusor property for widget.
 * @property {Kekule.Action} action Action associated with widget. Excute the widget will invoke that action.
 * @property {Bool} enablePeriodicalExec If this property is true, the execute event will be invoked repeatly between startPeriodicalExec and stopPeriodicalExec methods.
 *   (for instance, mousedown on button).
 * @property {Int} periodicalExecDelay How many milliseconds should periodical execution begin after startPeriodicalExec is called.
 *   Available only when enablePeriodicalExec property is true.
 * @property {Int} periodicalExecInterval Milliseconds between two execution in periodical mode.
 *   Available only when enablePeriodicalExec property is true.
 * @property {Bool} isPopup Whether this is a "popup" widget, when click elsewhere on window, the widget will automatically hide itself.
 * @property {Bool} isDialog Whether this is a "dialog" widget, when press ESC key, the widget will automatically hide itself.
 * @property {Kekule.HashEx} iaControllerMap Interaction controller map (id= > controller) linked to this component. Read only.
 * @property {String} defIaControllerId Id of default interaction controller in map.
 * @property {Kekule.Widget.InteractionController} defIaController Default interaction controller object.
 * @property {String} activeIaControllerId Id of active interaction controller in map.
 * @property {Kekule.Widget.InteractionController} activeIaController Active interaction controller object.
 */
/**
 * Invoked when a widget object is bind to an HTML element.
 *   event param of it has fields: {widget, element}
 * @name Kekule.Widget.BaseWidget#bind
 * @event
 */
/**
 * Invoked when a widget object is unbind from an HTML element.
 *   event param of it has fields: {widget, element}
 * @name Kekule.Widget.BaseWidget#unbind
 * @event
 */
/**
 * Invoked when a widget is executed (such as click on button, select on menu and so on).
 *   event param of it has field: {widget}
 * @name Kekule.Widget.BaseWidget#execute
 * @event
 */
/**
 * Invoked when a widget is activated (such as mouse down or enter key down on button).
 *   event param of it has field: {widget}
 * @name Kekule.Widget.BaseWidget#activate
 * @event
 */
/**
 * Invoked when a widget is deactivated (such as mouse up or enter key up on button).
 *   event param of it has field: {widget}
 * @name Kekule.Widget.BaseWidget#deactivate
 * @event
 */
/**
 * Invoked when a widget is shown or hidden.
 *   event param of it has field: {widget, isShown, isDismissed}
 * @name Kekule.Widget.BaseWidget#showStateChange
 * @event
 */
/**
 * Invoked when a widget's width or height changed.
 *   event param of it has field: {widget}
 * Note: This event will only be invoked when using width/height property or setDimension method to change size.
 *   Set CSS styles directly will not fire this event.
 * @name Kekule.Widget.BaseWidget#resize
 * @event
 */
Kekule.Widget.BaseWidget = Class.create(ObjectEx,
/** @lends Kekule.Widget.BaseWidget# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.BaseWidget',
	/** @private */
	BINDABLE_TAG_NAMES: null,
	/** @private */
	DEF_PERIODICAL_EXEC_DELAY: 500,
	/** @private */
	DEF_PERIODICAL_EXEC_INTERVAL: 100,
	/** @private */
	STYLE_RES_FIELD: '__$style_resources__',
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument, isDumb)
	{
		this._stateClassName = null;
		this._isDismissed = false;
		this._pendingHtmlClassNames = '';
		this._reactElemAttribMutationBind = this._reactElemAttribMutation.bind(this);

		this.setPropStoreFieldValue('inheritEnabled', true);
		this.setPropStoreFieldValue('inheritStatic', true);
		this.setPropStoreFieldValue('selfEnabled', true);
		this.setPropStoreFieldValue('selfStatic', false);
		this.setPropStoreFieldValue('periodicalExecDelay', this.DEF_PERIODICAL_EXEC_DELAY);
		this.setPropStoreFieldValue('periodicalExecInterval', this.DEF_PERIODICAL_EXEC_INTERVAL);

		$super();
		this.setPropStoreFieldValue('isDumb', !!isDumb);
		if (!isDumb)
			this.reactUiEventBind = this.reactUiEvent.bind(this);

		/*
		this.setShowText(true);
		this.setShowGlyph(true);
    */

		if (parentOrElementOrDocument)
		{
			if (parentOrElementOrDocument instanceof Kekule.Widget.BaseWidget)
			{
				this.setDocument(parentOrElementOrDocument.getDocument());
				this.createElement();
				this.setParent(parentOrElementOrDocument);
			}
			else if (parentOrElementOrDocument.documentElement)  // is document
			{
				this.setDocument(parentOrElementOrDocument);
				this.createElement();
			}
			else // is HTML element
			{
				this.setDocument(parentOrElementOrDocument.ownerDocument);
				this.setElement(parentOrElementOrDocument);
			}
		}

		this._stateClassName = null;
		this._layoutClassName = null;

		if (!this.getLayout())
			this.setLayout(Kekule.Widget.Layout.HORIZONTAL);
		this.setDraggable(false);

		this._periodicalExecBind = this._periodicalExec.bind(this);

		//this.setBubbleEvent(false);  // disallow event bubble
		this.setBubbleEvent(true);
		this.setInheritBubbleUiEvents(true);
		this.stateChanged();

		if (Kekule.Widget.globalManager)
			Kekule.Widget.globalManager.notifyWidgetCreated(this);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('isDumb', {'dataType': DataType.BOOL, 'serializable': false,
			'scope': Class.PropertyScope.PUBLIC,
			'setter': function(value)
			{
				if (this.getIsDumb() != value)
				{
					this.setPropStoreFieldValue('isDumb', value);
					var elem = this.getElement();
					if (elem)
					{
						if (value)
							this.uninstallUiEventHandlers(elem);
						else
							this.installUiEventHandlers(elem);
					}
				}
			}
		});
		this.defineProp('bubbleUiEvents', {'dataType': DataType.BOOL, 'scope': Class.PropertyScope.PUBLIC});
		this.defineProp('inheritBubbleUiEvents', {'dataType': DataType.BOOL, 'scope': Class.PropertyScope.PUBLIC});
		this.defineProp('parent', {'dataType': 'Kekule.Widget.BaseWidget', 'serializable': false,
			'scope': Class.PropertyScope.PUBLISHED,
			'setter': function(value)
			{
				var old = this.getParent();
				if (old)  //  remove from old
					old._removeChild(this);
				if (value)  // append to new parent
					value._addChild(this);
				this.setPropStoreFieldValue('parent', value);
			}
		});
		this.defineProp('childWidgets', {'dataType': DataType.ARRAY, 'serializable': false, 'setter': null,
			'scope': Class.PropertyScope.PUBLIC,
			'getter': function()
			{
				var r = this.getPropStoreFieldValue('childWidgets');
				if (!r)
				{
					r = [];
					this.setPropStoreFieldValue('childWidgets', r);
				}
				return r;
			}
		});
		this.defineProp('document', {'dataType': DataType.OBJECT, 'serializable': false, 'scope': Class.PropertyScope.PUBLIC});
		this.defineProp('element', {'dataType': DataType.OBJECT, 'serializable': false,
			'scope': Class.PropertyScope.PUBLIC,
			'setter': function(value)
			{
				var old = this.getElement();
				if (value !== old)
				{
					this.setPropStoreFieldValue('element', value);
					this.elementChanged(value, old);
				}
			}
		});
		this.defineProp('observeElementAttribChanges', {'dataType': DataType.BOOL, //'scope': Class.PropertyScope.PUBLIC,
			'setter': function(value)
			{
				if (!!value !== !!this.getObserveElementAttribChanges())
				{
					this.setPropStoreFieldValue('observeElementAttribChanges', value);
					this.observeElementAttribChangesChanged(!!value);
				}
			}
		});

		this.defineElemAttribMappingProp('id', 'id');
		this.defineElemAttribMappingProp('draggable', 'draggable');

		this.defineElemStyleMappingProp('width', 'width');
		this.defineElemStyleMappingProp('height', 'height');

		this.defineProp('offsetParent', {'dataType': DataType.OBJECT, 'serializable': false,
			'scope': Class.PropertyScope.PUBLIC,
			'getter': function() { return this.getElement().offsetParent; },
			'setter': null
		});
		this.defineProp('offsetLeft', {'dataType': DataType.INT, 'serializable': false,
			'getter': function() { return this.getElement().offsetLeft; },
			'setter': null
		});
		this.defineProp('offsetTop', {'dataType': DataType.INT, 'serializable': false,
			'getter': function() { return this.getElement().offsetTop; },
			'setter': null
		});
		this.defineProp('offsetWidth', {'dataType': DataType.INT, 'serializable': false,
			'getter': function() { return this.getElement().offsetWidth; },
			'setter': null
		});
		this.defineProp('offsetHeight', {'dataType': DataType.INT, 'serializable': false,
			'getter': function() { return this.getElement().offsetHeight; },
			'setter': null
		});

		this.defineProp('innerHTML', {'dataType': DataType.STRING, 'serializable': false,
			'scope': Class.PropertyScope.PUBLIC,  // this prop value usually should not be shown in objInspector to avoid modification of essential HTML structure
			'getter': function() { return this.getElement().innerHTML; },
			'setter': function(value) { this.getElement().innerHTML = value; }
		});
		this.defineProp('style', {'dataType': DataType.OBJECT, 'serializable': false,
			'scope': Class.PropertyScope.PUBLIC,
			'getter': function() { return this.getElement().style; },
			'setter': null
		});
		this.defineProp('cssText', {'dataType': DataType.STRING, 'serializable': false,
			'scope': Class.PropertyScope.PUBLIC,
			'getter': function() { return this.getElement().style.cssText; },
			'setter': function(value)
			{
				this.getElement().style.cssText = value;
			}
		});
		this.defineProp('htmlClassName', {'dataType': DataType.STRING, 'serializable': false,
			'scope': Class.PropertyScope.PUBLIC,
			'getter': function() { return this.getElement().className; },
			'setter': function(value) { this.getElement().className = value; }
		});
		this.defineProp('customHtmlClassName', {'dataType': DataType.STRING,
			'scope': Class.PropertyScope.PUBLIC,
			'setter': function(value)
			{
				var elem = this.getElement();
				var old = this.getCustomHtmlClassName();
				if (elem && (old !== value))
				{
					if (old)
						EU.removeClass(elem, old);
					if (value)
						EU.addClass(elem, value);
					this.setPropStoreFieldValue('customHtmlClassName', value);
				}
			}
		});
		/*
		this.defineProp('outlookStyleClassNames', {'dataType': DataType.ARRAY, 'serializable': false,
			'setter': function(value)
			{
				var old = this.getOutlookStyleClassNames();
				if (old)
					this.removeClassName(old);
				this.addClassName(value);
				this.setPropStoreFieldValue('outlookStyleClassNames', value);
			}
		});
		*/

		this.defineProp('visible', {'dataType': DataType.BOOL, 'serializable': false,
			'getter': function()
			{
				return Kekule.StyleUtils.isVisible(this.getElement());
			},
			'setter': function(value, byPassShowStateChange)
			{
				Kekule.StyleUtils.setVisibility(this.getElement(), value);
				if (!byPassShowStateChange)
					this.widgetShowStateChanged(this.isShown());
			}
		});
		this.defineProp('displayed', {'dataType': DataType.BOOL, 'serializable': false,
			'getter': function()
			{
				return Kekule.StyleUtils.isDisplayed(this.getElement());
			},
			'setter': function(value, byPassShowStateChange)
			{
				//console.log('set displayed', value, byPassShowStateChange);
				Kekule.StyleUtils.setDisplay(this.getElement(), value);
				if (!byPassShowStateChange)
					this.widgetShowStateChanged(this.isShown());
			}
		});

		// stores show/hide information
		this.defineProp('showHideType', {'dataType': DataType.INT, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});  // private
		this.defineProp('showHideCaller', {'dataType': 'Kekule.Widget.BaseWidget', 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});  // private
		this.defineProp('showHideCallerPageRect', {'dataType': DataType.HASH, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});  // private

		this.defineProp('finalizeAfterHiding', {'dataType': DataType.BOOL, 'scope': Class.PropertyScope.PUBLIC});

		this.defineProp('layout', {'dataType': DataType.INT,
			'setter': function(value)
			{
				if (this.getPropStoreFieldValue('layout') !== value)
				{
					this.setPropStoreFieldValue('layout', value);
					this.layoutChanged();
				}
			}
		});

		this.defineProp('useCornerDecoration', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('useCornerDecoration', value);
				if (!value)
				{
					//console.log('setNonROund');
					this.removeClassName(CNS.CORNER_ALL);
				}
				else
				{
					//console.log('setROund');
					this.addClassName(CNS.CORNER_ALL);
				}
			}
		});
		this.defineProp('showText', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('showText', value);
				//this._elemTextPart.style.display = value? '': 'none';
				if (value)
				{
					this.removeClassName(CNS.HIDE_TEXT);
					this.addClassName(CNS.SHOW_TEXT);
				}
				else
				{
					this.addClassName(CNS.HIDE_TEXT);
					this.removeClassName(CNS.SHOW_TEXT);
				}
			}
		});
		this.defineProp('showGlyph', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('showGlyph', value);
				if (value)
				{
					this.removeClassName(CNS.HIDE_GLYPH);
					this.addClassName(CNS.SHOW_GLYPH);
				}
				else
				{
					this.addClassName(CNS.HIDE_GLYPH);
					this.removeClassName(CNS.SHOW_GLYPH);
				}
			}
		});

		this.defineProp('allowTextWrap', {'dataType': DataType.BOOL, 'serialzable': false,
			'setter': function(value)
			{
				if (value)
					this.removeClassName(CNS.TEXT_NO_WRAP);
				else
					this.addClassName(CNS.TEXT_NO_WRAP);
			}
		});

		this.defineProp('selfEnabled', {'dataType': DataType.BOOL, 'scope': Class.PropertyScope.PRIVATE});  // private properties
		this.defineProp('inheritEnabled', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('inheritEnabled', value);
				this.stateChanged();
			}
		});
		this.defineProp('enabled', {'dataType': DataType.BOOL, 'serializable': false,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('selfEnabled');
				if (this.getInheritEnabled())
				{
					var p = this.getParent();
					if (p)
						result = result && p.getEnabled();
				}
				return result;
			},
			'setter': function(value)
			{
				//this.getCoreElement().disabled = !value;
				//console.log('set disabled: ' + this.getClassName() + ' ' + !value);
				var elem = this.getElement();
				if (!value)
					elem.setAttribute('disabled', 'true');
				else
					elem.removeAttribute('disabled');
				var elem = this.getCoreElement();
				if (elem != this.getElement())
				{
					if (!value)
						elem.setAttribute('disabled', 'true');
					else
						elem.removeAttribute('disabled');
				}
				this.setPropStoreFieldValue('selfEnabled', value);
				this.stateChanged();
			}
		});

		this.defineProp('selfStatic', {'dataType': DataType.BOOL, 'scope': Class.PropertyScope.PRIVATE});  // private properties
		this.defineProp('inheritStatic', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('inheritStatic', value);
				this.stateChanged();
			}
		});
		this.defineProp('static', {'dataType': DataType.BOOL, 'serializable': false,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('selfStatic');
				if (this.getInheritStatic())
				{
					var p = this.getParent();
					if (p)
						result = result || p.getStatic();
				}
				return result;
			},
			'setter': function(value)
			{
				this.setPropStoreFieldValue('selfStatic', value);
				this.stateChanged();
			}
		});

		this.defineProp('inheritState', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('inheritState', value);
				this.stateChanged();
			}
		});
		this.defineProp('state', {'dataType': DataType.INT, 'serializable': false,
			'scope': Class.PropertyScope.PUBLIC,
			'setter': null,
			'getter': function()
			{
				var result;
				if (this.getInheritState())
				{
					var p = this.getParent();
					if (p)
						result = p.getState();
				}
				else
				{
					if (!this.getEnabled())
						result = WS.DISABLED;
					else
						result =
						//(!this.getEnabled())? WS.DISABLED:
							this.getIsActive()? WS.ACTIVE:
								this.getIsHover()? WS.HOVER:
									this.getIsFocused()? WS.FOCUSED:
										WS.NORMAL;
				}

				return result;
			}
		});

		this.defineElemStyleMappingProp('cursor', 'cursor');

		this.defineProp('isHover', {'dataType': DataType.BOOL, 'serializable': false,
			'scope': Class.PropertyScope.PUBLIC,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('isHover', value);
				// if not hover, the active state should also be turned off
				if (!value && !this.isCaptureMouse())
					this.setPropStoreFieldValue('isActive', false);
				this.stateChanged();
			}
		});
		this.defineProp('isActive', {'dataType': DataType.BOOL, 'serializable': false,
			'scope': Class.PropertyScope.PUBLIC,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('isActive', value);

				if (value)  // active widget should always be focused
				{
					this.focus();
				}
				var m = this.getGlobalManager();
				if (m)
					m.notifyWidgetActiveChanged(this, value);
				this.stateChanged();
			}
		});
		this.defineProp('isFocused', {'dataType': DataType.BOOL, 'serializable': false,
			'scope': Class.PropertyScope.PUBLIC,
			'getter': function()
			{
				var doc = this.getDocument();
				var elem = this.getCoreElement();
				if (doc && elem && doc.activeElement)
					return (doc.activeElement === elem);
			},
			'setter': function(value)
			{
				this.setPropStoreFieldValue('isFocused', value);
				var m = this.getGlobalManager();
				if (m)
					m.notifyWidgetFocusChanged(this, value);
				var elem = this.getCoreElement();
				if (elem)
				{
					if (elem.focus && value)
						elem.focus();
					if (elem.blur && (!value))
						elem.blur();
				}
				this.stateChanged();
			}
		});

		this.defineProp('isDialog', {'dataType': DataType.BOOL, 'scope': Class.PropertyScope.PUBLIC});
		this.defineProp('isPopup', {'dataType': DataType.BOOL, 'scope': Class.PropertyScope.PUBLIC});
		this.defineProp('popupCaller', {'dataType': DataType.BOOL, 'scope': Class.PropertyScope.PRIVATE}); // private, record who calls this popup

		this.defineProp('modalInfo', {'dataType': DataType.HASH, 'scope': Class.PropertyScope.PUBLIC});  // for dialog only

		this.defineProp('enablePeriodicalExec', {'dataType': DataType.BOOL});
		this.defineProp('periodicalExecDelay', {'dataType': DataType.INT});
		this.defineProp('periodicalExecInterval', {'dataType': DataType.INT});

		this.defineElemAttribMappingProp('hint', 'title');

		this.defineProp('action', {'dataType': 'Kekule.Action', 'serializable': false,
			'setter': function(value)
			{
				var old = this.getAction();
				if (old !== value)
				{
					if (old && old.unlinkWidget)
					{
						old.unlinkWidget(this);
						this.unlinkAction(old);
					}
					this.setPropStoreFieldValue('action', value);
					if (value && value.linkWidget)
					{
						value.linkWidget(this);
						this.linkAction(value);
					}
				}
			}
		});

		this.defineProp('iaControllerMap', {'dataType': DataType.OBJECT, 'serializable': false, 'setter': null,
			'scope': Class.PropertyScope.PUBLIC,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('iaControllerMap');
				if (!result)
				{
					result = new Kekule.HashEx();
					this.setPropStoreFieldValue('iaControllerMap', result);
				}
				return result;
			}
		});

		this.defineProp('defIaControllerId', {'dataType': DataType.STRING, 'serializable': false, 'scope': Class.PropertyScope.PUBLIC});
		this.defineProp('defIaController', {'dataType': DataType.STRING, 'serializable': false,
			'scope': Class.PropertyScope.PUBLIC,
			'setter': null,
			'getter': function() { return this.getIaControllerMap().get(this.getDefIaControllerId()); } });
		this.defineProp('activeIaControllerId', {'dataType': DataType.STRING, 'serializable': false, 'scope': Class.PropertyScope.PUBLIC});
		this.defineProp('activeIaController', {'dataType': DataType.STRING, 'serializable': false,
			'scope': Class.PropertyScope.PUBLIC,
			'setter': null,
			'getter': function() { return this.getIaControllerMap().get(this.getActiveIaControllerId()); }});
	},

	/** @private */
	doFinalize: function($super)
	{
		this.setAction(null);
		this.setParent(null);
		this.releaseChildWidgets();
		var elem = this.getElement();
		this.setElement(null);
		this.destroyElement(elem);

		if (this.getGlobalManager())
			this.getGlobalManager().notifyWidgetFinalized(this);

		$super();
	},

	/** @ignore */
	invokeEvent: function($super, eventName, event)
	{
		if (!event)
			event = {};
		// add a 'widget' param
		if (!event.widget)
			event.widget = this;
		$super(eventName, event);
		// notify global manager when a widget event occurs
		var m = Kekule.Widget.globalManager;
		if (m)
		{
			m.notifyWidgetEventFired(this, eventName, event);
		}
	},

	/**
	 * Returns global widget manager in current document.
	 * @returns {Object}
	 */
	getGlobalManager: function()
	{
		return Kekule.Widget.globalManager;
	},

	/**
	 * Returns core element of widget.
	 * Usually core element is the element widget binded to, but in some
	 * cases, core element may be a child of widget element. Descendants
	 * can override this method to reflect that situation.
	 * @returns {HTMLElement}
	 */
	getCoreElement: function()
	{
		return this.getElement();
	},
	/**
	 * Returns the element that be used as root to insert child widgets.
	 * Descendants can override this method to reflect that situation.
	 * @returns {HTMLElement}
	 */
	getChildrenHolderElement: function()
	{
		return this.getCoreElement();
	},
	/**
	 * Whether the text content inside widget element can be user selected.
	 * Most widget (like tree, button) should return false, but form controls (like textbox) should return true.
	 * Descendants may override this method.
	 * @returns {Bool}
	 */
	getTextSelectable: function()
	{
		return false;
	},
	/**
	 * Returns whether a placeholder widget can be bind to element to represent this widget.
	 * This method is used when auto-launching widget on HTML element. Descendants can override this method.
	 * @param {HTMLElement} elem
	 * @returns {Bool}
	 */
	canUsePlaceHolderOnElem: function(elem)
	{
		return false;
	},

	/** @private */
	doPropChanged: function(propName, newValue)
	{
		if ((propName === 'width') || (propName === 'height'))
		{
			this.resized();
		}
	},

	/** @private */
	getActualBubbleUiEvents: function()
	{
		var parent = this.getParent();
		if (this.getBubbleUiEvents())
			return true
		else if (this.getInheritBubbleUiEvents() && parent && parent.getActualBubbleUiEvents)
			return parent.getActualBubbleUiEvents();
		else
			false;
	},

	/*
	 * Report an exception (error/warning and so on) occurs related to widget.
	 * @param {Variant} e Error object or message.
	 */
	/*
	reportException: function(e)
	{
		if (!this.doReportException(e))
			Kekule.error(e);
	},
	*/
	/*
	 * Do actual job of reportError. If error is handled (and should not raise to browser),
	 * this method should return true. Descendant can override this method.
	 * @param {Variant} e Error object or message.
	 */
	/*
	doReportException: function(e)
	{
		return false;
	},
	*/

	/** @private */
	releaseChildWidgets: function()
	{
		var children = this.getChildWidgets();
		for (var i = children.length - 1; i >= 0; --i)
			children[i].finalize();
	},

	/**
	 * Create a property that read/write attribute of HTML element.
	 * @param {String} propName
	 * @param {String} elemAttribName Attribute name of HTML element.
	 * @param {Hash} options Options to define property. If not set, default option will be used.
	 * @return {Object} Property info object added to property list.
	 */
	defineElemAttribMappingProp: function(propName, elemAttribName, options)
	{
		var ops = Object.extend({
			'dataType': DataType.STRING,
			'serializable': false,
			'getter': function() { return this.getElement() && this.getElement().getAttribute(elemAttribName); },
			'setter': function(value) { this.getElement() && this.getElement().setAttribute(elemAttribName, value); }
		}, options || {});
		return this.defineProp(propName, ops);
	},
	/**
	 * Create a property that read/write style property of HTML element.
	 * @param {String} propName
	 * @param {String} stylePropName Property name of element.style.
	 * @param {Hash} options Options to define property. If not set, default option will be used.
	 * @return {Object} Property info object added to property list.
	 */
	defineElemStyleMappingProp: function(propName, stylePropName, options)
	{
		var ops = Object.extend({
			'dataType': DataType.STRING,
			'serializable': false,
			'getter': function() { return this.getStyleProperty(stylePropName); },
			'setter': function(value) { this.setStyleProperty(stylePropName, value); }
		}, options || {});
		return this.defineProp(propName, ops);
	},


	/** @private */
	getHigherLevelObj: function()
	{
		return this.getParent();
	},

	/**
	 * Called when action property is set.
	 * Widget should set it's outlook property (text/hint and so on) according to action here.
	 * Descendants can override this method to do their own job.
	 * @private
	 */
	linkAction: function(action)
	{
		/*
		var text = action.getText();
		var hint = action.getHint();
		if (hint)
			this.setHint(hint);
		this.setEnabled(action.getEnabled());
		this.setDisplayed(action.getDisplayed());
		this.setVisible(action.getVisible());
		*/
		// do nothing here
	},
	/**
	 * Called when action property is set to null
	 * @private
	 */
	unlinkAction: function(action)
	{
		// do nothing here
	},

	/**
	 * Returns child action class associated with name for this widget.
	 * @param {String} actionName
	 * @param {Bool} checkSupClasses When true, if action is not found in current widget class, super classes will also be checked.
	 * @returns {Class}
	 */
	getChildActionClass: function(actionName, checkSupClasses)
	{
		var result = Kekule.ActionManager.getActionClassOfName(actionName, this, checkSupClasses);
		return result;
	},

	/**
	 * Apply style resource to self or an element.
	 * @param {Variant} resOrName An instance of {@link Kekule.Widget.StyleResource} or resource name.
	 * @param {HTMLElement} element If not set, style will be set to widget element.
	 */
	linkStyleResource: function(resOrName, element)
	{
		var res = (resOrName instanceof Kekule.Widget.StyleResource)? resOrName: Kekule.Widget.StyleResourceManager.getResource(resOrName);
		if (res)
		{
			res.linkTo(element || this);
		}
		return this;
	},
	/**
	 * Remove style resource from self or an element.
	 * @param {Variant} resOrName An instance of {@link Kekule.Widget.StyleResource} or resource name.
	 * @param {HTMLElement} element If not set, style will be removed from widget element.
	 */
	unlinkStyleResource: function(resOrName, element)
	{
		var res = (resOrName instanceof Kekule.Widget.StyleResource)? resOrName: Kekule.Widget.StyleResourceManager.getResource(resOrName);
		if (res)
			res.unlinkFrom(element || this);
		return this;
	},

	/**
	 * Get CSS property value or a style resource linked to element.
	 * @param {String} cssPropName CSS property name in JavaScript form.
	 * @param {HTMLElement} element If not set, widget element will be used.
	 * @returns {Variant} A instance of {@link Kekule.Widget.StyleResource} or simply a CSS value.
	 */
	getStyleProperty: function(cssPropName, element)
	{
		var elem = element || this.getElement();
		var styleRes = elem[this.STYLE_RES_FIELD];
		if (!styleRes || !styleRes[cssPropName])
			return elem.style[cssPropName];
		else
			return styleRes[cssPropName];
	},
	/**
	 * Set CSS property value to widget or another element.
	 * @param {String} cssPropName CSS property name in JavaScript form.
	 * @param {Variant} value A simple css value or an instance of {@link Kekule.Widget.StyleResource}
	 *   or a style resource name.
	 * @param {HTMLElement} element If not set, style will be set to widget element.
	 * UNFINISHED yet
	 */
	setStyleProperty: function(cssPropName, value, element)
	{
		var elem = element || this.getElement();
		if (elem)
		{
			var res;
			if (value instanceof Kekule.Widget.StyleResource)
			{
				res = value;
			}
			else if ((DataType.getType(value) === DataType.STRING) && (value.startsWith(Kekule.Widget.StyleResourceNames.PREFIX)))
			{
				res = Kekule.Widget.StyleResourceManager.getResource(value);
			}

			if (res)  // style resource
			{
				var styleRes = elem[this.STYLE_RES_FIELD];
				if (!styleRes)
				{
					styleRes = {};
					elem[this.STYLE_RES_FIELD] = styleRes;
				}
				var old = styleRes[cssPropName];
				if (old)  // already has old value
				{
					this.unlinkStyleResource(old, elem);
				}
				if (res)
				{
					this.linkStyleResource(res, elem);
				}
				styleRes[cssPropName] = res;
			}
			else  // simple value
			{
				elem.style[cssPropName] = value;
				var styleRes = elem[this.STYLE_RES_FIELD];
				if (styleRes && styleRes[cssPropName])
				{
					this.unlinkStyleResource(styleRes[cssPropName], elem);
				}
			}
		}
	},
	/**
	 * Clear CSS property to widget or another element.
	 * @param {String} cssPropName CSS property name in JavaScript form.
	 * @param {HTMLElement} element If not set, style will be set to widget element.
	 */
	removeStyleProperty: function(cssPropName, value, element)
	{
		var elem = element || this.getElement();
		Kekule.StyleUtils.removeStyleProperty(elem.style, cssPropName);
	},

	/**
	 * Add a child widget.
	 * User should not call this method directly, instead, child.setParent should be used.
	 * @param {Kekule.Widget.BaseWidget} child
	 * @private
	 */
	_addChild: function(child)
	{
		if (!child)
			return;
		var ws = this.getChildWidgets();
		if (ws.indexOf(child) < 0)
		{
			ws.push(child);
			/*
			// append to element
			var parentElem = this.getChildrenHolderElement();
			child.appendToElem(parentElem);
			*/
			this.childWidgetAdded(child);
			this.childrenModified();
		}
	},
	/**
	 * Insert a child widget before refChild.
	 * @param {Kekule.Widget.BaseWidget} child
	 * @param {Kekule.Widget.BaseWidget} refChild
	 * @private
	 */
	_insertChild: function(child, refChild)
	{
		if (!child)
			return;
		var ws = this.getChildWidgets();
		var refIndex = refChild? ws.indexOf(refChild): ws.length;

		if (ws.indexOf(child) >= 0)  // already in, adjust pos
		{
			if (refIndex >= 0)
				this._moveChild(child, refIndex);
		}
		else  // new one
		{
			if (refIndex < 0)
				refIndex = ws.length;
			ws.splice(refIndex, 0, child);
			/*
			var refWidget = ws[refIndex];
			var refElem = refWidget? refWidget.getElement(): null;
			this.getChildrenHolderElement().insertBefore(child.getElement(), refElem);
			*/
			this.childWidgetAdded(child);
			this.childrenModified();
		}
	},
	/**
	 * Remove a child widget.
	 * User should not call this method directly, instead, child.setParent(null) should be used.
	 * @param {Kekule.Widget.BaseWidget} child
	 * @private
	 */
	_removeChild: function(child)
	{
		if (!child)
			return;
		var ws = this.getChildWidgets();
		var index = ws.indexOf(child);
		if (index >= 0)
		{
			ws.splice(index, 1);
			// remove from element if possible
			var parentElem = this.getChildrenHolderElement();
			var childElem = child.getElement();
			if (childElem && Kekule.DomUtils.isDescendantOf(childElem, parentElem))
			{
				childElem.parentNode.removeChild(childElem);
			}
			this.childWidgetRemoved(child);
			this.childrenModified();
		}
		//Kekule.ArrayUtils.remove(this.getChildWidgets(), child);
	},
	/**
	 * Move existed child to an new position of child widget array.
	 * @param {Kekule.Widget.BaseWidget} child
	 * @param {Int} newIndex
	 * @private
	 */
	_moveChild: function(child, newIndex)
	{
		if (!child)
			return;
		if (Kekule.ArrayUtils.changeItemIndex(this.getChildWidgets(), child, newIndex))
		{
			/*
			// change index of element
			var parentElem = this.getChildrenHolderElement();
			var refWidget = this.getChildWidgets()[newIndex + 1];
			var refElem = refWidget? refWidget.getElement(): null;
			parentElem.insertBefore(child.getElement(), refElem);
			*/
			this.childWidgetMoved(child, newIndex);
			this.childrenModified();
		}
	},

	/**
	 * Called when child widget array has some modification (child added, removed or moved).
	 * @private
	 */
	childrenModified: function()
	{
		// do nothing here
	},

	/**
	 * This method will be called after widget is added to childWidgets array.
	 * @param {Kekule.Widget.BaseWidget} widget
	 * @private
	 */
	childWidgetAdded: function(widget)
	{
		// do nothing here
		//console.log('widget added', this.getClassName(), widget.getClassName());
	},
	/**
	 * This method will be called after widget is removed from childWidgets array.
	 * @param {Kekule.Widget.BaseWidget} widget
	 * @private
	 */
	childWidgetRemoved: function(widget)
	{
		// do nothing here
	},
	/**
	 * This method will be called after widget position is moved in childWidgets array.
	 * @param {Kekule.Widget.BaseWidget} widget
	 * @param {Int} newIndex
	 * @private
	 */
	childWidgetMoved: function(widget, newIndex)
	{
		// do nothing here
	},

	/**
	 * Returns index of child widget. If widget is not a child, -1 will be returned.
	 * @param {Kekule.Widget.BaseWidget} widget
	 * @returns {Int}
	 */
	indexOfChild: function(widget)
	{
		return this.getChildWidgets().indexOf(widget);
	},
	/**
	 * Check if widget is a child of current widget.
	 * @param {Kekule.Widget.BaseWidget} widget
	 * @returns {Bool}
	 */
	hasChild: function(widget)
	{
		var index = this.indexOfChild(widget);
		//console.log('Child index: ', index, this.getChildWidgets());
		return (index >= 0);
	},
	/**
	 * Returns child widget at index
	 * @param {Int} index
	 * @return {Kekule.Widget.BaseWidget}
	 */
	getChildAtIndex: function(index)
	{
		return this.getChildWidgets()[index];
	},

	/**
	 * Returns previous sibling widget under the same parent widget.
	 */
	getPrevSibling: function()
	{
		var parent = this.getParent();
		if (parent)
		{
			var index = parent.indexOfChild(this);
			return this.getChildAtIndex(--index);
		}
		else
			return null;
	},
	/**
	 * Returns next sibling widget under the same parent widget.
	 */
	getNextSibling: function()
	{
		var parent = this.getParent();
		if (parent)
		{
			var index = parent.indexOfChild(this);
			return this.getChildAtIndex(++index);
		}
		else
			return null;
	},

	/** @private */
	_haltPrevShowHideProcess: function()
	{
		if (Kekule.Widget.showHideManager)
		{
			if (this.__$showHideTransInfo)  // has prev transition not finished yet
			{
				this.__$showHideTransInfo.halt();
			}
		}
	},

	/**
	 * Make widget visible.
	 * @param {Kekule.Widget.BaseWidget} caller Who calls the show method and make this widget visible.
	 * @param {Func} callback This callback function will be called when the widget is totally shown.
	 * @param {Int} showType, value from {@link Kekule.Widget.ShowHideType}.
	 */
	show: function(caller, callback, showType)
	{
		if (!this.getElement())
			return;
		if (this.__$isShowing)  // avoid duplicate execute
		{
			return;
		}

		this._haltPrevShowHideProcess();

		//console.log('call show', this.getClassName());
		/*
		var self = this;
		var showProc = function()
		{
			self.doShow(caller, callback, showType);
		}
		setTimeout(showProc, 0);
		*/

		this.doShow(caller, callback, showType);

		return this;
	},
	/** @private */
	doShow: function(caller, callback, showType)
	{
		//console.log('do show', this.getClassName());
		this.__$isShowing = true;
		//this.__$isHiding = false;
		var self = this;
		var done = function()
		{
			//self.__$isShowHiding = false;
			self.__$showHideTransInfo = null;
			//console.log('show done', self.__$isShowHiding);
			self.widgetShowStateDone(true);
			self.__$isShowing = false;
			//self.__$isHiding = false;
			if (callback)
				callback();
		};


		this.setShowHideType(showType);

		if (Kekule.ObjUtils.notUnset(showType))
		{
			this.setIsPopup((showType === Kekule.Widget.ShowHideType.DROPDOWN)
			|| (showType === Kekule.Widget.ShowHideType.POPUP));

			if (showType === Kekule.Widget.ShowHideType.DIALOG)
			{
				this.setIsDialog(true);
				showType = Kekule.Widget.ShowHideType.POPUP;
			}
			else
				this.setIsDialog(false);
		}

		this.widgetShowStateBeforeChanging(true);

		if (showType === Kekule.Widget.ShowHideType.DROPDOWN)  // prepare
		{
			Kekule.Widget.globalManager.preparePopupWidget(this, caller, showType);
		}

		//console.log('show', this.getClassName(), this.getElement(), this.getElement().parentNode);

		if (Kekule.Widget.showHideManager)
		{
			/*
			 if (this.__$showHideTransInfo)  // has prev transition not finished yet
			 {
			 this.__$showHideTransInfo.halt();
			 }
			 */
			//if (!this.__$isShowHiding)  // avoid call show in show transition process
			if (!this.__$showHideTransInfo)
			{
				//console.log('show', this.__$isShowHiding);
				//this.__$isShowHiding = true;
				this.__$showHideTransInfo = Kekule.Widget.showHideManager.show(this, caller, done, showType);
			}
		}
		else
		{
			// here call setDisplayed and setVisible with second param, avoid call widgetShowStateChanged multiple times
			this.setDisplayed(true, true);
			this.setVisible(true, true);
			done();
		}

		//this.setShowHideType(showType);
		this.setShowHideCaller(caller);
		if (caller)  // also save the page rect of caller, avoid caller to be hidden afterward
		{
			this.setShowHideCallerPageRect(EU.getElemPageRect((caller.getElement && caller.getElement()) || caller));
		}

		this.widgetShowStateChanged(true);
	},
	/**
	 * Show widget then hide it after a period of time.
	 * @param {Int} time In milliseconds.
	 * @param {Kekule.Widget.BaseWidget} caller Who calls the show method and make this widget visible.
	 * @param {Func} callback This callback function will be called when the widget is totally shown.
	 * @param {Int} showType, value from {@link Kekule.Widget.ShowHideType}.
	 */
	flash: function(time, caller, callback, showType)
	{
		var self = this;
		var done = function()
		{
			if (callback)
				callback();
			setTimeout(self.hide.bind(self), time);
		};
		this.show(caller, done, showType);
		return this;
	},
	/**
	 * Hide widget.
	 * @param {Kekule.Widget.BaseWidget} caller Who calls the hide method and make this widget invisible.
	 * @param {Func} callback This callback function will be called when the widget is totally hidden.
	 * @param {Int} hideType, value from {@link Kekule.Widget.ShowHideType}.
	 * @param {Bool} useVisible If true, set visible property to false, else set displayed property to false.
	 */
	hide: function(caller, callback, hideType, useVisible)
	{
		if (!this.getElement())
			return;
		if (this.__$isHiding)  // avoid duplicate execute
			return;
		this.__$isHiding = true;
		//this.__$isShowing = false;
		if (!caller)
		{
			caller = this.getShowHideCaller();
		}
		if (!hideType)
			hideType = this.getShowHideType();

		this._haltPrevShowHideProcess();

		//console.log('call hide', this.getClassName());

		/*
		var self = this;
		var hideProc = function()
		{
			self.doHide(caller, callback, hideType, useVisible);
		};
		setTimeout(hideProc, 0);
		*/
		this.doHide(caller, callback, hideType, useVisible);

		return this;
	},
	/** @private */
	doHide: function(caller, callback, hideType, useVisible)
	{
		var self = this;
		var finalizeAfterHiding = this.getFinalizeAfterHiding();
		var done = function()
		{
			//console.log('do Hide', self.getClassName());
			//self.__$isShowHiding = false;
			self.__$showHideTransInfo = null;
			self.widgetShowStateDone(false);

			if (hideType === Kekule.Widget.ShowHideType.DROPDOWN)  // unprepare
			{
				//console.log('unprepare');
				Kekule.Widget.globalManager.unpreparePopupWidget(self);
			}
			self.__$isHiding = false;
			//self.__$isShowing = false;

			if (callback)
				callback();

			if (finalizeAfterHiding)
				self.finalize();
		};

		this.widgetShowStateBeforeChanging(false);

		if (Kekule.Widget.showHideManager)
		{
			if (this.__$showHideTransInfo)
				this.__$showHideTransInfo.halt();
			//if (!this.__$isShowHiding)  // avoid call hide() in hide transition process
			if (!this.__$showHideTransInfo)
			{
				//console.log('hide', this.__$isShowHiding);
				//this.__$isShowHiding = true;
				//console.log('Hide by manager');
				this.__$showHideTransInfo = Kekule.Widget.showHideManager.hide(this, caller, done, hideType,
					false, {'callerPageRect': this.getShowHideCallerPageRect()});
			}
		}
		else
		{
			if (useVisible)
				this.setVisible(false, true);
			else
				this.setDisplayed(false, true);
			done();
		}
		this.widgetShowStateChanged(false);
	},

	/*
	 * Popup the widget.
	 * @param {Kekule.Widget.BaseWidget} caller Who calls the show method and make this widget visible.
	 * @param {Func} callback This callback function will be called when the widget is totally shown.
	 */
	/*
	popup: function(caller, callback)
	{
		return this.show(caller, callback, Kekule.Widget.ShowHideType.POPUP);
	},
	*/
	/**
	 * Dismiss a widget and cancel its modified value.
	 * Here we simply hide the widget.Descendant may override this method to do more complex job.
	 * @param {Kekule.Widget.BaseWidget} caller Who calls the hide method and make this widget invisible.
	 * @param {Func} callback This callback function will be called when the widget is totally hidden.
	 * @param {Int} hideType, value from {@link Kekule.Widget.ShowHideType}.
	 * @param useVisible If true, set visible property to false, else set displayed property to false.
	 */
	dismiss: function(caller, callback, hideType, useVisible)
	{
		this._isDismissed = true;
		return this.hide(caller, callback, hideType, useVisible);
	},
	/**
	 * Check if widget element is visible to user.
	 * @param {Bool} ignoreDom If true, this method will only check CSS visibility and display property.
	 * @returns {Bool}
	 */
	isShown: function(ignoreDom)
	{
		//var result = !!this.getElement().parentNode && this.getVisible() && this.getDisplayed();
		var result = (this.isInDomTree() || ignoreDom) && this.getElement() && this.getVisible() && this.getDisplayed();
		return result;
	},
	/**
	 * Called before show or hide.
	 * @param {Bool} isShown
	 * @private
	 */
	widgetShowStateBeforeChanging: function(isShown)
	{
		// do nothing here
	},
	/**
	 * Called immediately after show or hide, even if transition is still underway.
	 * @param {Bool} isShown
	 * @private
	 */
	widgetShowStateChanged: function(isShown)
	{
		if (Kekule.ObjUtils.isUnset(isShown))
			isShown = this.isShown();
		if (Kekule.ObjUtils.notUnset(this._lastShown) && (this._lastShown === isShown))  // show state not changed
			return;  // do nothing
		this._lastShown = isShown;
		if (isShown)
			this._isDismissed = false;

		if (this.getIsPopup())
		{
			if (isShown)
			{
				//console.log('register');
				Kekule.Widget.globalManager.registerPopupWidget(this);
			}
			else
			{
				Kekule.Widget.globalManager.unregisterPopupWidget(this);
			}
		}
		if (this.getIsDialog())
		{
			if (isShown)
				Kekule.Widget.globalManager.registerDialogWidget(this);
			else
				Kekule.Widget.globalManager.unregisterDialogWidget(this);
		}
		this.doWidgetShowStateChanged(isShown);
		this.invokeEvent('showStateChange', {'widget': this, 'isShown': isShown, 'isDismissed': this._isDismissed});
	},
	/**
	 * Descendant can override this method.
	 * @param {Bool} isShown
	 * @private
	 */
	doWidgetShowStateChanged: function(isShown)
	{
		// do nothing here
	},
	/**
	 * Called after show or hide transition is totally done.
	 * @param {Bool} isShown
	 * @private
	 */
	widgetShowStateDone: function(isShown)
	{
		// do nothing here
	},

	/**
	 * Check if widget is in document DOM tree.
	 * @returns {Bool}
	 */
	isInDomTree: function()
	{
		var elem = this.getElement();
		return Kekule.DomUtils.isInDomTree(elem);
	},

	/**
	 * Focus on widget.
	 */
	focus: function()
	{
		this.setIsFocused(true);
		return this;
	},
	/**
	 * Move focus out of widget.
	 */
	blur: function()
	{
		this.setIsFocused(false);
		return this;
	},

	/**
	 * Returns bounding client rectangle of widget.
	 * @param {HTMLElement} elem
	 * @param {Bool} includeScroll If this value is true, scrollTop/Left of documentElement will be added to result.
	 * @returns {Hash} {top, left, bottom, right, width, height}
	 */
	getBoundingClientRect: function(includeScroll)
	{
		// if widget is not displayed, display it first, otherwise width and height may returns 0
		if (!this.getDisplayed())
		{
			var d = Kekule.StyleUtils.getDisplayed(this.getElement());
			var v = Kekule.StyleUtils.getVisibility(this.getElement());
			try
			{
				this.setVisible('hidden');
				this.setDisplayed('');
				var result = Kekule.HtmlElementUtils.getElemBoundingClientRect(this.getElement(), includeScroll);
			}
			finally
			{
				this.setDisplayed(d);
				this.setVisible(v);
			}
			return result;
		}
		else
			return Kekule.HtmlElementUtils.getElemBoundingClientRect(this.getElement(), includeScroll);
	},
	/**
	 * Returns dimension in px of this widget.
	 * @returns {Hash} {width, height}.
	 */
	getDimension: function()
	{
		return this.getBoundingClientRect(false);
	},
	/**
	 * Set width and height of current widget. Width and height value can be number (how many pixels)
	 * or a CSS string value directly.
	 * @param {Variant} width
	 * @param {Variant} height
	 * @param {Bool} suppressResize If this value is true, resized method will not be called.
	 */
	setDimension: function(width, height, suppressResize)
	{
		var doResize = false;
		var notUnset = Kekule.ObjUtils.notUnset;
		if (notUnset(width))
		{
			this.getStyle().width = (typeof(width) === 'number')? width + 'px': width;
			doResize = true;
		}
		if (notUnset(height))
		{
			this.getStyle().height = (typeof(height) === 'number')? height + 'px': height;
			doResize = true;
		}
		if (doResize && (!suppressResize))
			this.resized();
		this.objectChange(['width', 'height']);
		return this;
	},

	/**
	 * Called when width or height of widget changed.
	 * @private
	 */
	resized: function()
	{
		this.doResize();
		this.invokeEvent('resize', {'widget': this});
	},
	/**
	 * Called when width or height of widget changed.
	 * Descendants may override this method to do some actual work (for instance, change size of child widgets).
	 * @private
	 */
	doResize: function()
	{

	},

	/**
	 * Notify the layout property of widget has changed.
	 * @ignore
	 */
	layoutChanged: function()
	{
		var layout = this.getLayout();
		if (this._layoutClassName)
			this.removeClassName(this._layoutClassName);
		this._layoutClassName = this.getLayoutClassName(layout);
		if (this._layoutClassName)
			this.addClassName(this._layoutClassName);
	},
	/**
	 * Returns suitable class name to reflect current layout.
	 * @param {Int} layout
	 * @returns {String}
	 * @private
	 */
	getLayoutClassName: function(layout)
	{
		var WL = Kekule.Widget.Layout;
		return (layout === WL.VERTICAL)? CNS.LAYOUT_V:
			(layout === WL.HORIZONTAL)? CNS.LAYOUT_H:
			null;
	},

	/**
	 * Called after isHover, isActive, isFocused changed.
	 * @private
	 */
	stateChanged: function()
	{
		//console.log('old state class', this.getElement(), this._stateClassName);
		if (this._stateClassName)
			this.removeClassName(this._stateClassName);
		this._stateClassName = this.getStateClassName(this.getState());
		//console.log('new state class', this._stateClassName);
		if (this._stateClassName)
			this.addClassName(this._stateClassName);

		// notify children
		var children = this.getChildWidgets();
		for (var i = 0, l = children.length; i < l; ++i)
			children[i].stateChanged();
	},
	/**
	 * Get class name to set the outlook of current state.
	 * Descendants can override this method.
	 * @param {Int} state
	 * @returns {String}
	 */
	getStateClassName: function(state)
	{
		var WS = Kekule.Widget.State;
		var result =
			(state === WS.ACTIVE)? CNS.STATE_ACTIVE:
			(state === WS.HOVER)? CNS.STATE_HOVER:
			(state === WS.FOCUSED)? CNS.STATE_FOCUSED:
			(state === WS.DISABLED)? CNS.STATE_DISABLED:
			CNS.STATE_NORMAL;
		return result;
	},

	/**
	 * Create an HTML element to represent the widget.
	 * //@param {HTMLElement} parentElement
	 * @returns {HTMLElement}
	 */
	createElement: function()
	{
		var doc = this.getDocument();
		var result = this.doCreateRootElement(doc);
		//this.doCreateSubElements(doc, result);
		this.setElement(result);
		/*
		// append element to parent
		var p = this.getParent();
		var elem = p? p.getElement(): null;
		if (elem)
			elem.appendChild(result);
		*/
		return result;
	},
	/**
	 * Do actual work of create root element of widget.
	 * Descendants may override this method.
	 * @param {HTMLDocument} doc
	 * @returns {HTMLElement}
	 * @private
	 */
	doCreateRootElement: function(doc)
	{
		// do nothing here
	},
	/**
	 * Create element inside root element.
	 * This method is used by bindElement when create a widget based on an existing root element.
	 * Descendants may override this method.
	 * @param {HTMLDocument} doc
	 * @param {HTMLElement} rootElem
	 * @returns {Array} Created sub elements.
	 * @private
	 */
	doCreateSubElements: function(doc, rootElem)
	{
		// do nothing here
		return [];
	},

	/**
	 * Remove the binding element from DOM tree.
	 * @param {HTMLElement} elem
	 */
	destroyElement: function(elem)
	{
		var elem = elem || this.getElement();
		if (elem && elem.parentNode)
		{
			elem.parentNode.removeChild(elem);
		}
	},

	/**
	 * Append current widget to parentElem.
	 * @param {HTMLElement} parentElem
	 */
	appendToElem: function(parentElem)
	{
		if (parentElem)
			parentElem.appendChild(this.getElement());
		//this.insertedToDom();
		return this;
	},

	/**
	 * Insert current widget to parentElem, before refElem.
	 * @param {HTMLElement} parentElem
	 * @param {HTMLElement} refElem
	 */
	insertToElem: function(parentElem, refElem)
	{
		parentElem.insertBefore(this.getElement(), refElem);
		//this.insertedToDom();
		return this;
	},

	/**
	 * Append widget as a child to parentWidget.
	 * @param {Kekule.Widget.BaseWidget} parentWidget
	 */
	appendToWidget: function(parentWidget)
	{
		this.setParent(parentWidget);
		this.appendToElem(parentWidget.getChildrenHolderElement());
		return this;
	},
	/**
	 * Insert this widget as child to parentWidget, before refWidget. If refWidget not set, widget will be appended to parent.
	 * @param {Kekule.Widget.BaseWidget} parentWidget
	 * @param {Kekule.Widget.BaseWidget} refWidget
	 */
	insertToWidget: function(parentWidget, refWidget)
	{
		this.setParent(parentWidget);
		//this.setPropStoreFieldValue('parent', parentWidget);
		//parentWidget._insertChild(this, refWidget);
		if (refWidget)
			this.insertToElem(parentWidget.getChildrenHolderElement(), refWidget.getElement());
		else
			this.appendToElem(parentWidget.getChildrenHolderElement());
		return this;
	},

	/**
	 * Called when widget is inserted into DOM tree.
	 */
	insertedToDom: function()
	{
		this.widgetShowStateChanged(this.isShown());
		return this.doInsertedToDom();
	},
	/** @private */
	doInsertedToDom: function()
	{
		// do nothing here
	},
	/**
	 * Called when widget is removed from DOM tree.
	 */
	removedFromDom: function()
	{
		this.widgetShowStateChanged(false);  // removed from dom, alway a hidden action
		return this.doRemovedFromDom();
	},
	/** @private */
	doRemovedFromDom: function()
	{
		// do nothing here
	},

	/**
	 * Called when additional element inserted inside widget.
	 * @param {HTMLElement} elem
	 */
	domElemAdded: function(elem)
	{
		return this.doDomElemAdded(elem);
	},
	/** @private */
	doDomElemAdded: function(elem)
	{
		// do nothing here
	},
	/**
	 * Called when element removed from widget.
	 * @param {HTMLElement} elem
	 */
	domElemRemoved: function(elem)
	{
		return this.doDomElemRemoved(elem);
	},
	/** @private */
	doDomElemRemoved: function(elem)
	{
		// do nothing here
	},

	/**
	 * Returns widget identity class name(s) need to add to HTML element.
	 * @returns {string}
	 */
	getWidgetClassName: function()
	{
		var result = Kekule.Widget.HtmlClassNames.BASE;
		if (this.getElement() && !Kekule.HtmlElementUtils.isFormCtrlElement(this.getCoreElement()))
			result += ' ' + Kekule.Widget.HtmlClassNames.NORMAL_BACKGROUND;
		result += ' ' + this.doGetWidgetClassName();
		return result;
	},

	/**
	 * Returns class name need to add to HTML element.
	 * Descendants should override this method and return concrete names.
	 * @returns {string}
	 * @private
	 */
	doGetWidgetClassName: function()
	{
		return '';
	},

	/**
	 * Check if a class is associate with element of this widget.
	 * @param {String} className
	 * @return {Bool}
	 */
	hasClassName: function(className)
	{
		return EU.hasClass(this.getElement(), className);
	},
	/**
	 * Add class name(s) to widget element. If affectCustomProp is true, this method will change customHtmlClassName property.
	 * @param {Variant} classNames Can be a simple name, or a series of name separated by space ('name1 name2')
	 * 	or an array of strings.
	 * @param {Bool} affectCustomProp Whether change customHtmlClassName property of widget.
	 */
	addClassName: function(classNames, affectCustomProp)
	{
		if (this.getElement())
		{
			if (affectCustomProp)
			{
				var cname = this.getCustomHtmlClassName();
				cname = Kekule.StrUtils.addTokens(cname, classNames);
				this.setCustomHtmlClassName(cname);
			}
			else
				EU.addClass(this.getElement(), classNames);
		}
		else  // pending
		{
			this._pendingHtmlClassNames = Kekule.StrUtils.addTokens(this._pendingHtmlClassNames, classNames);
		}
		return this;
	},
	/**
	 * remove class(es) from widget element. This method not also change customHtmlClassName property.
	 * @param {Variant} classNames Can be a simple name, or a series of name separated by space ('name1 name2')
	 * 	or an array of strings.
	 * @param {Bool} affectCustomProp Whether change customHtmlClassName property of widget.
	 */
	removeClassName: function(classNames, affectCustomProp)
	{
		if (this.getElement())
		{
			if (affectCustomProp)
			{
				var cname = this.getCustomHtmlClassName();
				cname = Kekule.StrUtils.removeTokens(cname, classNames);
				this.setCustomHtmlClassName(cname);
			}
			else
				EU.removeClass(this.getElement(), classNames);
		}
		else
		{
			this._pendingHtmlClassNames = Kekule.StrUtils.removeTokens(this._pendingHtmlClassNames, classNames);
		}
		return this;
	},
	/**
	 * Toggle class(es) from element. This method not also change customHtmlClassName property.
	 * @param {Variant} className Can be a simple name, or a series of name separated by space ('name1 name2')
	 * 	or an array of strings.
	 * @param {Bool} affectCustomProp Whether change customHtmlClassName property of widget.
	 */
	toggleClassName: function(classNames, affectCustomProp)
	{
		if (this.getElement())
		{
			if (affectCustomProp)
			{
				var cname = this.getCustomHtmlClassName();
				cname = Kekule.StrUtils.toggleTokens(cname, classNames);
				this.setCustomHtmlClassName(cname);
			}
			else
				EU.toggleClass(this.getElement(), classNames);
		}
		return this;
	},

	/**
	 * Check if widget can bind to an element.
	 * Descendants can override this method to do some further check on element.
	 * @param {HTMLElement} element
	 * @return {Bool}
	 */
	isElementBindable: function(element)
	{
		var allowedTags = this.getBindableElemTagNames();
		if (allowedTags)
		{
			var currTag = element.tagName;
			return (allowedTags.indexOf(currTag.toLowerCase()) >= 0);
		}
		else
			return true;
	},
	/**
	 * Returns the tag names of element can be binded with widget. Tag names should be all lowercased.
	 * The return value of null means widget can bind to any element.
	 * On the contrary, if [](empty array) is returned, the widget will be regarded as unbindable to any element.
	 * Defaultly, this method will return widget.BINDABLE_TAG_NAMES.
	 * Descendants can overwrite that variable to meet their own needs.
	 * @returns {Array}
	 */
	getBindableElemTagNames: function()
	{
		if (this.getPrototype().hasOwnProperty('BINDABLE_TAG_NAMES'))
			return this.BINDABLE_TAG_NAMES;
		else
			return null; // can bind any elements
	},

	/**
	 * Bind current widget to a HTML element, install event handlers and set styles.
	 * @param {HTMLElement} element
	 * @private
	 */
	bindElement: function(element)
	{
		if (element)
		{
			if (!this.isElementBindable(element))
			{
				Kekule.error(/*Kekule.ErrorMsg.WIDGET_CAN_NOT_BIND_TO_ELEM*/
					Kekule.$L('ErrorMsg.WIDGET_CAN_NOT_BIND_TO_ELEM').format(this.getClassName(), element.tagName));
				return;
			}

			// if element already has class name, regard it as custom HTML class name
			var originClassName = element.className;
			if (originClassName)
				this.setCustomHtmlClassName(this.getCustomHtmlClassName() || '' + ' ' + originClassName);

			var DU = Kekule.DomUtils;
			var HU = Kekule.HtmlElementUtils;
			// clear possiblely previously created dynamic elements
			var clearDynElements = function(rootElem)
			{
				var children = DU.getDirectChildElems(rootElem);
				for (var i = children.length - 1; i >= 0; --i)
				{
					var child = children[i];
					if (HU.hasClass(child, CNS.DYN_CREATED))
						rootElem.removeChild(child);
				}
			};
			clearDynElements(element);

			// create essential sub elements
			var subElems = this.doCreateSubElements(this.getDocument(), element);
			if (subElems && subElems.length)
			{
				for (var i = 0, l = subElems.length; i < l; ++i)
				{
					var elem = subElems[i];
					HU.addClass(elem, CNS.DYN_CREATED);
				}
			}

			this.doBindElement(element);

			if (Kekule.DomUtils.hasAttribute(element, 'disabled'))
				this.setEnabled(false);

			// check dataset properties of element, and use them to set self's properties
			// width/height attribute should also be regarded as property settings
			var w = element.getAttribute('width');
			var h = element.getAttribute('height');
			if (Kekule.ObjUtils.notUnset(w) || Kekule.ObjUtils.notUnset(h))
			{
				w = parseFloat((w || '').toString()) || 0;
				h = parseFloat((h || '').toString()) || 0;
				this.setDimension(w, h);
			}
			var dataset = Kekule.DomUtils.getDataset(element);
			if (dataset)
			{
				for (var attribName in dataset)
				{
					var value = dataset[attribName];
					try
					{
						Kekule.Widget.Utils.setWidgetPropFromElemAttrib(this, attribName, value);
					}
					catch(e)
					{
						//console.warn(e);
						Kekule.warn(e);
						//throw e;
					}
				}
			}

			var cname = this.getWidgetClassName();
			EU.addClass(element, cname);
			cname = this.getCustomHtmlClassName();
			if (cname)
				EU.addClass(element, cname);
			if (!this.getTextSelectable())
				EU.addClass(element, CNS.NONSELECTABLE);
			if (this._pendingHtmlClassNames)
			{
				EU.addClass(element, this._pendingHtmlClassNames);
				this._pendingHtmlClassNames = '';
			}

			if (!this.getIsDumb())
				this.installUiEventHandlers(element);

			// add a field to element to quick access widget from element itself
			element[widgetBindingField] = this;

			this.invokeEvent('bind', {'widget': this, 'element': element});
		}
	},
	/**
	 * Do actual work of bindElement for descendents' overriding.
	 * @param {HTMLElement} element
	 */
	doBindElement: function(element)
	{
		// do nothing here
	},
	/**
	 * Unbind current widget from a HTML element, uninstall event handlers.
	 * @param {HTMLElement} element
	 * @private
	 */
	unbindElement: function(element)
	{
		if (element)
		{
			if (!this.getIsDumb())
				this.uninstallUiEventHandlers(element);

			var cname = this.getWidgetClassName();
			EU.removeClass(element, cname);

			this.doUnbindElement(element);

			// remove the link field in element
			element[widgetBindingField] = undefined;
			try
			{
				delete element[widgetBindingField];
			}
			catch(e)
			{

			}

			this.invokeEvent('unbind', {'widget': this, 'element': element});
		}
	},
	/**
	 * Do actual work of unbindElement for descendents' overriding.
	 * @param {HTMLElement} element
	 */
	doUnbindElement: function(element)
	{
		// do nothing here
	},

	/** @private */
	elementChanged: function(newElem, oldElem)
	{
		if (oldElem)  // uninstall event handlers
			this.unbindElement(oldElem);
		if (newElem)
			this.bindElement(newElem);
	},

	/**
	 * Called when property observeElementAttribChanges changes.
	 * This method is used to install/uninstall mutation observes.
	 * @private
	 */
	observeElementAttribChangesChanged: function(value)
	{
		var elem = this.getElement();
		if (value)
			this._installAttribMutationObserver(elem);
		else
			this._uninstallAttribMutationObserver(elem);
	},
	/** @private */
	_installAttribMutationObserver: function(elem)
	{
		if (Kekule.X.MutationObserver)
		{
			if (!this._attribMutationObserver)
			{
				var ob = new Kekule.X.MutationObserver(this._reactElemAttribMutationBind);
				this._attribMutationObserver = ob;
			}
			this._attribMutationObserver.observe(elem, {attributes: true});
		}
	},
	/** @private */
	_uninstallAttribMutationObserver: function(elem)
	{
		if (this._attribMutationObserver)
			this._attribMutationObserver.disconnect();
	},
	/** @private */
	_reactElemAttribMutation: function(mutations)
	{
		var elem = this.getElement();
		for (var i = 0, l = mutations.length; i < l; ++i)
		{
			var m = mutations[i];
			if (m.type !== 'attributes')
				continue;
			if (m.target !== elem)
				continue;
			var attribName = m.attributeName;
			if (attribName && Kekule.DomUtils.isDataAttribName(attribName))
			{
				var coreName = Kekule.DomUtils.getDataAttribCoreName(attribName);
				if (coreName)
				{
					var attribValue = elem.getAttribute(attribName);
					//console.log('set prop', attribName, attribValue);
					Kekule.Widget.Utils.setWidgetPropFromElemAttrib(this, coreName, attribValue);
				}
			}
		}
	},


	/**
	 * Create a decoration content element and insert it to parentElem before refElem.
	 * @param {HTMLElement} parentElem
	 * @param {HTMLElement} refElem
	 * @returns {HTMLElement} Element created.
	 */
	createDecorationContent: function(parentElem, refElem)
	{
		var doc = parentElem.ownerDocument;
		var result = doc.createElement('span');
		EU.addClass(result, [CNS.PART_CONTENT, CNS.PART_DECORATION_CONTENT, CNS.DYN_CREATED]);
		if (refElem)
			parentElem.insertBefore(result, refElem);
		else
			parentElem.appendChild(result);
		return result;
	},

	/**
	 * Create an text content element and insert it to parentElem before refElem.
	 * @param {String} text
	 * @param {HTMLElement} parentElem
	 * @param {HTMLElement} refElem
	 * @returns {HTMLElement} Element created.
	 */
	createTextContent: function(text, parentElem, refElem)
	{
		var doc = parentElem.ownerDocument;
		var result = doc.createElement('span');
		EU.addClass(result, [CNS.PART_CONTENT, CNS.PART_TEXT_CONTENT, CNS.DYN_CREATED]);
		result.innerHTML = text;
		if (refElem)
			parentElem.insertBefore(result, refElem);
		else
			parentElem.appendChild(result);
		return result;
	},

	/**
	 * Create a glyph content container and insert it to parentElem before refElem.
	 * @param {HTMLElement} parentElem
	 * @param {HTMLElement} refElem
	 * @param {String} htmlClassName Class name added to content element.
	 * @returns {HTMLElement} Element created.
	 */
	createGlyphContent: function(parentElem, refElem, htmlClassName)
	{
		var doc = parentElem.ownerDocument;
		var result = doc.createElement('span');
		EU.addClass(result, [CNS.PART_CONTENT, CNS.PART_GLYPH_CONTENT, CNS.DYN_CREATED]);
		if (htmlClassName)
			EU.addClass(result, htmlClassName);
		if (refElem)
			parentElem.insertBefore(result, refElem);
		else
			parentElem.appendChild(result);
		return result;
	},

	/*
	reportFatalError: function(errMsg)
	{
		console.
	},
	*/

	/**
	 * Install UI event (mousemove, click...) handlers to element.
	 * @param {HTMLElement} element
	 * @private
	 */
	installUiEventHandlers: function(element)
	{
		var events = Kekule.Widget.UiLocalEvents; //Kekule.Widget.UiEvents;
		for (var i = 0, l = events.length; i < l; ++i)
		{
			//console.log('install events', events[i], this.reactUiEventBind, element);
			Kekule.X.Event.addListener(element, events[i], this.reactUiEventBind);
		}
	},
	/**
	 * Uninstall UI event (mousemove, click...) handlers from old mainContextElement.
	 * @param {HTMLElement} element
	 * @private
	 */
	uninstallUiEventHandlers: function(element)
	{
		var events = Kekule.Widget.UiLocalEvents; // Kekule.Widget.UiEvents;
		for (var i = 0, l = events.length; i < l; ++i)
		{
			Kekule.X.Event.removeListener(element, events[i], this.reactUiEventBind);
		}
	},

	/** @private */
	reactUiEvent: function(e)
	{
		//if ((!this.getEnabled()) || this.getStatic())
		if (this.getStatic())  // static, do nothing
		{

		}
		else if (!this.getEnabled())  // disabled, eat all event on self
		{
			e.stopPropagation();
		}
		else // normal handling
		{
			//console.log('here', this.getEnabled(), this.getElement().tagName);
			//var target = e.getTarget();
			//if (target === this.getElement())
			//var CNS = Kekule.Widget.ClassNames;

			/*
			if (!!e.getCustomPropValue('__kekule_widget__'))  // event rises by child widget
			{
				return;
			}
			else
			*/
			{
				var handled = false;
				var evType = e.getType();

				/*
				if (!e.widget)
				{
					e.widget = this;
					e._type = evType;
				}
				*/

				/*
				/// TODO: In IE7/8, property of event params can not be set
				//e.__kekule_widget__ = this;  // mark that this widget rises this event
				e.setCustomPropValue('__kekule_widget__', this);
				*/

				var targetElem = e.getTarget();
				var targetWidget = Kekule.Widget.Utils.getBelongedResponsiveWidget(targetElem);
				var eventOnSelf = targetWidget === this;

				var KC = Kekule.X.Event.KeyCode;
				var keyCode;
				if (evType === 'mousemove')  // test mouse cursor
				{
					this.reactPointerMoving(e);
					var coord = this.getEventMouseRelCoord(e);
					var cursor = this.testMouseCursor(coord, e);
					if (Kekule.ObjUtils.notUnset(cursor) && this.getElement())
					{
						//this.getElement().style.cursor = cursor;
						this.setCursor(cursor);
						handled = true;
					}
				}
				else if (evType === 'touchmove')
				{
					this.reactPointerMoving(e);
					handled = true;
				}
				else if (evType === 'focus')
				{
					if (eventOnSelf && e.getTarget() === this.getCoreElement())  // important, only react to focus on the very element
					{
						this.setIsFocused(true);
						handled = true;
					}
				}
				else if (evType === 'blur')
				{
					if (eventOnSelf && e.getTarget() == this.getCoreElement()) // important, only react to blur off the very element
					{
						// check if focus changed to another child element
						var currFocusElem = this.getDocument().activeElement;
						var elem = this.getElement();
						if (currFocusElem && (Kekule.DomUtils.isDescendantOf(currFocusElem, elem) || currFocusElem === elem))
							;//console.log('focus to child');  // do nothing
						else
						{
							//console.log('blur', this.getElement());
							this.setIsFocused(false);
						}
						handled = true;
					}
				}
				else if (evType === 'mouseover')
				{
					//console.log('OVER');
					this.setIsHover(true);
					handled = true;
				}
				else if (evType === 'mouseout' || evType === 'touchleave')
				{
					if (!e.ghostMouseEvent)
					{
						var relatedTarget = e.getRelatedTarget();
						if (relatedTarget && Kekule.DomUtils.isOrIsDescendantOf(relatedTarget, this.getCoreElement()))  // still move inside widget
						{
							// do nothing
						}
						else
						{
							//console.log('OUT');
							this.setIsHover(false);
							if (!this.isCaptureMouse())
							{
								this.reactDeactiviting(e);
								handled = true;
							}
						}
					}
				}
				else if ((evType === 'mousedown' && e.getButton() === Kekule.X.Event.MouseButton.LEFT) || (evType === 'touchstart'))
				{
					if (eventOnSelf && !e.ghostMouseEvent)
					{
						this.reactActiviting(e);
					}
					handled = true;
				}
				/*
				else if (evType === 'mouseleave')
				{
					//console.log('MOUSE LEAVE');
				}
				else if (evType === 'mouseenter')
				{
					//console.log('MOUSE ENTER');
				}
				*/
				else if ((evType === 'mouseup' && e.getButton() === Kekule.X.Event.MouseButton.LEFT)
					|| (evType === 'touchend') || (evType === 'touchcancel'))
					{
					if (eventOnSelf && !e.ghostMouseEvent)
					{
						this.reactDeactiviting(e);
					}
					handled = true;
				}
				else if (evType === 'keydown')
				{
					keyCode = e.getKeyCode();
					if ((keyCode === KC.ENTER) || (keyCode === KC.SPACE))
					{
						if (eventOnSelf && !this.getIsActive())
						{
							this.reactActiviting(e);
						}
						handled = true;
					}
				}
				else if (evType === 'keyup')
				{
					keyCode = e.getKeyCode();
					if ((keyCode === KC.ENTER) || (keyCode === KC.SPACE))
					{
						if (eventOnSelf && this.getIsActive())
							this.reactDeactiviting(e);
						handled = true;
					}
				}

				// check first if the component has event handler itself
				var funcName = Kekule.Widget.getEventHandleFuncName(e.getType());

				if (this[funcName])  // has own handler
				{
					//handled = handled || this[funcName](e);
					handled = this[funcName](e);  // avoid shortcircuit
				}
				else  // check for controller
				{
					// dispatch event to interaction controllers
					//handled = handled || this.dispatchEventToIaControllers(e);
					handled = this.dispatchEventToIaControllers(e) || handled;  // avoid shortcircuit
				}
			}

			this.doReactUiEvent(e);

			// map HTML event to object event system
			this.invokeEvent(evType, {'htmlEvent': e});
			/*
			if (evType === 'mouseleave')
				console.log('invokeLeave', this, e, e.widget);
			*/
			/*
			if (evType === 'mouseout')
				console.log('mouseout', this);
			*/

			//if (handled)
			//if (['mouseleave', 'mouseenter'].indexOf(evType) < 0)
			//	e.stopPropagation();  // IMPORTANT! eat the event, prevent it from bubble to parent widget and elements to disturb the event handle process
		}

		//if (Kekule.Widget.UiLocalEvents.indexOf(evType) < 0)  // not a local (not bubblable) event
		{
			// HINT: local event such as blur or focus must be bubble and handle carefully,
			// otherwise cause problems (even recursion) in browser
			if (this.getActualBubbleUiEvents())
			{
				var parent = this.getParent();
				if (parent && parent.reactUiEvent)
					parent.reactUiEvent(e);
			}
		}
	},
	/**
	 * For descendants override.
	 * @private
	 */
	doReactUiEvent: function(e)
	{
		// do nothing here
	},

	/** @private */
	reactTouchGesture: function(e)
	{
		var funcName = Kekule.Widget.getTouchGestureHandleFuncName(e.getType());

		if (this[funcName])  // has own handler
		{
			this[funcName](e);
		}
		else  // check for controller
		{
			// dispatch event to interaction controllers
			this.dispatchEventToIaControllers(e);
		}
	},

	/**
	 * React to active event (mouse down, enter key down and so on).
	 * @param {Event} e
	 * @ignore
	 */
	reactActiviting: function(e)
	{
		if (!this.getIsActive())
		{
			this.setIsActive(true);
			this.doReactActiviting(e);
			this.invokeEvent('activate', {'widget': this});
		}
		//console.log('active on', this.getIsActive(), e.getType());
	},
	/**
	 * Do concrete job of reactActiviting method. Descendants may override this method.
	 * @param {Event} e
	 * @ignore
	 */
	doReactActiviting: function(e)
	{
		// do nothing here
		//console.log('active on', this.getIsActive(), e.getType());
	},

	/**
	 * React to deactive event (mouse up, enter key up and so on).
	 * @param {Event} e
	 * @ignore
	 */
	reactDeactiviting: function(e)
	{
		//console.log('deactive on', this.getIsActive(), e.getType());
		if (this.getIsActive())
		{
			this.doReactDeactiviting(e);
			this.invokeEvent('deactivate', {'widget': this});
			this.setIsActive(false);
		}
	},
	/**
	 * Do concrete job of reactDeactiviting method. Descendants may override this method.
	 * @param {Event} e
	 * @ignore
	 */
	doReactDeactiviting: function(e)
	{
		// do nothing here
	},

	/**
	 * React to mousemove or touchmove event.
	 * @param {Event} e
	 * @ignore
	 */
	reactPointerMoving: function(e)
	{
		this.doReactPointerMoving(e);
	},
	/**
	 * Do concrete job of reactPointerMoving method. Descendants may override this method.
	 * @param {Event} e
	 * @ignore
	 */
	doReactPointerMoving: function(e)
	{
		// do nothing here
	},

	/** @private */
	dispatchEventToIaControllers: function(e)
	{
		var handled = false;
		var controller = this.getActiveIaController();
		if (controller)
		{
			handled = controller.handleUiEvent(e);
		}
		if (!handled)
		{
			controller = this.getDefIaController();
			if (controller)
			{
				handled = controller.handleUiEvent(e);
			}
		}
		return handled;
	},

	/** @private */
	getEventMouseRelCoord: function(e)
	{
		return {x: e.getRelXToCurrTarget(), y: e.getRelYToCurrTarget()};
	},

	/**
	 * Get mouse cursor at a certain coord.
	 * Component can implement this function, or dispatch it to controllers.
	 * @param {Hash} coord 2D mouse coord
	 * @param {Object} e event arg passed from mouse move event
	 * @return {String} CSS cursor property value. Return '' to use default one.
	 */
	testMouseCursor: function(coord, e)
	{
		var result = this.doTestMouseCursor(coord, e);
		if (!result)
		{
			var controller = this.getActiveIaController();
			if (controller)
			{
				result = controller.testMouseCursor(coord, e);
			}
			if (!result)
			{
				controller = this.getDefIaController();
				if (controller)
					result = controller.testMouseCursor(coord, e);
			}
		}
		return result;
	},
	/** @private */
	doTestMouseCursor: function(coord, e)
	{
		return null;
	},

	/**
	 * Set or unset mouse capture feature of current widget.
	 * @param {Bool} capture
	 */
	setMouseCapture: function(capture)
	{
		if (capture)
			Kekule.Widget.globalManager.setMouseCaptureWidget(this);
		else if (this.isCaptureMouse())
			Kekule.Widget.globalManager.setMouseCaptureWidget(null);
	},
	/**
	 * Returns whether this widget is currently capturing mouse/touch event.
	 * @returns {Bool}
	 */
	isCaptureMouse: function()
	{
		return Kekule.Widget.globalManager.getMouseCaptureWidget() === this;
	},

	/**
	 * Link a controller with this component.
	 * @param {String} id Unique id of controller
	 * @param {Kekule.Widget.InteractionController} controller
	 * @param {Bool} asDefault Whether set this controller as the default one to handle events.
	 */
	addIaController: function(id, controller, asDefault)
	{
		this.getIaControllerMap().set(id, controller);
		if (asDefault)
			this.setDefIaControllerId(id);
		if (controller)
			controller.setWidget(this);
	},
	/**
	 * Unlink a controller with this component.
	 * @param {String} id Unique id of controller
	 */
	removeIaController: function(id)
	{
		var controller = this.getIaControllerMap().get(id);
		if (controller)
		{
			this.getIaControllerMap().remove(id);
			if (id === this.getDefIaControllerId())
				this.setDefIaControllerId(null);
			if (id === this.getActiveIaControllerId())
				this.setActiveIaControllerId(null);
			controller.setWidget(null);
		}
	},
	/**
	 * Returns controller by id.
	 * @param {String} id
	 * @returns {Kekule.Widget.InteractionController}
	 */
	getIaController: function(id)
	{
		return this.getIaControllerMap().get(id);
	},

	/**
	 * This method should be called when the primary action is taken on widge
	 * (such as click on button, select on menu and so on).
	 * @param {Object} invokerHtmlEvent HTML event object that invokes executing process.
	 */
	execute: function(invokerHtmlEvent)
	{
		this.doExecute(invokerHtmlEvent);
		this.invokeEvent('execute', {'widget': this, 'htmlEvent': invokerHtmlEvent});
	},
	/** @private */
	doExecute: function(invokerHtmlEvent)
	{
		// do nothing here
	},

	/**
	 * Check if periodical executing is on process.
	 * @returns {Bool}
	 */
	isPeriodicalExecuting: function()
	{
		return this._periodicalExecBind;
	},

	/**
	 * Begin periodical execution.
	 * @param {Object} htmlEvent HTML event that starts periodical execution.
	 */
	startPeriodicalExec: function(htmlEvent)
	{
		var delay = this.getPeriodicalExecDelay() || 0;
		this._periodicalExecuting = true;
		this._periodicalExecHtmlEvent = htmlEvent;
		setTimeout(this._periodicalExecBind, delay);
	},
	/**
	 * Stop periodical execution.
	 */
	stopPeriodicalExec: function()
	{
		this._periodicalExecuting = false;
		this._periodicalExecHtmlEvent = null;
	},
	/** @private */
	_periodicalExec: function(interval)
	{
		if (this.isPeriodicalExecuting())
		{
			if (!this._waitPeriodicalProcess)
			{
				this._waitPeriodicalProcess = true;  // flag
				this.execute(this._periodicalExecHtmlEvent);
				this._waitPeriodicalProcess = false;
			}
			/*
			else
				console.log('wait exec...');
			*/
			setTimeout(this._periodicalExecBind, this.getPeriodicalExecInterval() || 20);
		}
	}
});


/**
 * Tool object that manage the interaction (mouse, key event) of a UI widget.
 * A component may have multiple controllers, for example, in Ctab based editor, select tool is used to select nodes and connectors,
 * bond tools is used to draw new bond, charge tool is used to assign charge... Different tools have different function and must
 * response differently when a event is occured. So different tool object is used to cooperate with editor.
 * Tool object has a set of methods to handle events (reactMouseMove, reactMouseClick, etc). If the event is handled, the method must
 * return true, otherwise the event will be handled by default tool.
 * @class
 * @augments ObjectEx
 *
 * @param {Kekule.Widget.BaseWidget} widget Widget of current object being installed to.
 *
 * @property {Kekule.Widget.BaseWidget} widget Widget of current object being installed to.
 */
Kekule.Widget.InteractionController = Class.create(ObjectEx,
/** @lends Kekule.Widget.InteractionController# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.InteractionController',
	/** @constructs */
	initialize: function($super, widget)
	{
		$super();
		if (widget)
			this.setWidget(widget);
	},
	doFinalize: function($super)
	{
		this.setWidget(null);
		$super();
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('widget', {'dataType': 'Kekule.Widget.BaseWidget', 'serializable': false});
	},

	/**
	 * Handle and dispatch event.
	 * @param {Object} e Event object.
	 */
	handleUiEvent: function(e)
	{
		var eventName = e.getType();
		var funcName = Kekule.Widget.getEventHandleFuncName(eventName);
		if (this[funcName])
		{
			return this[funcName](e);
		}
		else
		{
			return false;
		}
	},

	/** @private */
	_defEventHandler: function(e)
	{
		return false;  // do not handle by default
	},

	/**
	 * Get mouse cursor at a certain coord.
	 * @param {Hash} coord 2D mouse coord
	 * @param {Object} e Event arg passed from mouse move event.
	 * @return {String} CSS cursor property value.
	 */
	testMouseCursor: function(coord, e)
	{
		return this.doTestMouseCursor(coord, e);
	},
	/** @private */
	doTestMouseCursor: function(coord, e)
	{
		return null;
	},

	/** @private */
	_getEventMouseCoord: function(e, clientElem)
	{
		//return {x: e.getRelXToCurrTarget(), y: e.getRelYToCurrTarget()};
		var coord = {'x': e.getClientX(), 'y': e.getClientY()};
		var elem = clientElem || this.getWidget().getElement();
		var offset = {'x': elem.getBoundingClientRect().left - elem.scrollLeft, 'y': elem.getBoundingClientRect().top - elem.scrollTop};
		var result = Kekule.CoordUtils.substract(coord, offset);
		//console.log(result, elem.tagName);
		return result;
	}
});

/**
 * An dumb widget that will not react to event.
 * @class
 * @augments Kekule.Widget.BaseWidget
 */
Kekule.Widget.DumbWidget = Class.create(Kekule.Widget.BaseWidget,
/** @lends Kekule.Widget.DumbWidget# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.DumbWidget',
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument)
	{
		$super(parentOrElementOrDocument, true);
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.DUMB_WIDGET;
	},
	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('span');
		return result;
	}
});

/**
 * Placeholder is a special lightweight widget, helping to create real heavy weight widget on demand on an HTML element.
 * This type of widget should not be created alone, but only can create on an existing element.
 * @class
 * @augments Kekule.Widget.BaseWidget
 */
Kekule.Widget.PlaceHolder = Class.create(Kekule.Widget.BaseWidget,
/** @lends Kekule.Widget.PlaceHolder# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.PlaceHolder',
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument, targetWidgetClass)
	{
		this.setPropStoreFieldValue('targetWidgetClass', targetWidgetClass);
		$super(parentOrElementOrDocument, true);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('targetWidgetClass', {'dataType': DataType.CLASS, 'serializable': false,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('targetWidgetClass');
				if (!result)
				{
					var name = this.getPropStoreFieldValue('targetWidgetClassName');
					if (name)
						result = ClassEx.findClass(name);
				}
				return result;
			}
		});
		this.defineProp('targetWidgetClassName', {
			'dataType': DataType.STRING,
			'getter': function()
			{
				var c = this.getTargetWidgetClass();
				var result = c? ClassEx.getClassName(C): this.getPropStoreFieldValue('targetWidgetClassName');
				return result;
			},
			'setter': function(value)
			{
				this.setPropStoreFieldValue('targetWidgetClassName', value);
				this.setTargetWidgetClass(ClassEx.findClass(value));
			}
		});
		// alias for targetWidgetClassName
		this.defineProp('target', {
			'dataType': DataType.STRING,
			'getter': function()
			{
				return this.getTargetWidgetClassName();
			},
			'setter': function(value)
			{
				this.setTargetWidgetClassName(value);
			}
		});


		this.defineProp('targetWidget', {
			'dataType': 'Kekule.Widget.BaseWidget', serializable: 'false', 'setter': null,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('targetWidget');
				if (!result)
				{
					result = this.createTargetWidget();
				}
				return result;
			}
		});
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		var result = $super() + ' ' + CNS.PLACEHOLDER;
		var targetClass = this.getTargetWidgetClass();
		if (targetClass)
		{
			var targetHtmlClassName = ClassEx.getPrototype(targetClass).getWidgetClassName();
			result = Kekule.StrUtils.addTokens(result, targetHtmlClassName);
			//console.log('HTML class name', this.getId(), targetHtmlClassName, result);
		}
		return result;
	},
	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('img');
		return result;
	},
	/**
	 * For descendants override.
	 * @private
	 */
	doReactUiEvent: function(e)
	{
		// when UI event occurs, create real widget
		var widget = this.createTargetWidget();
		//widget.reactUiEvent(e);
	},
	/**
	 * Create real widget, replace this placeholder.
	 * @returns {Kekule.Widget.BaseWidget}
	 */
	createTargetWidget: function()
	{
		var widgetClass = this.getTargetWidgetClass();
		if (widgetClass)
		{
			try
			{
				var elem = this.getElement();
				var parentWidget = this.getParent();
				if (parentWidget && parentWidget instanceof Kekule.Widget.PlaceHolder)
				{
					// concrete parent first
					parentWidget = parentWidget.createTargetWidget();
				}
				var children = AU.clone(this.getChildWidgets());
				this.unbindElement(this.getElement());
				this.setPropStoreFieldValue('element', null);  // avoid delete element when finalize self
				var result = new widgetClass(elem);
				if (result)
				{
					//result.setParent(parentWidget);
					if (parentWidget)
					{
						var refChild = this.getNextSibling();
						this.setParent(null);
						result.setPropStoreFieldValue('parent', parentWidget);
						parentWidget._insertChild(result, refChild);
						//parentWidget._removeChild(this);
					}
					// move all children of self to new created widget
					if (children)
					{
						for (var i = 0, l = children.length; i < l; ++i)
						{
							children[i].setParent(result);
						}
					}
				}
			}
			finally
			{
				this.finalize();
			}
			return result;
		}
		else
		{
			Kekule.error(Kekule.$L('ErrorMsg.WIDGET_UNAVAILABLE_FOR_PLACEHOLDER'));
		}
	}
});

/**
 * Helper methods about widget.
 * @class
 */
Kekule.Widget.Utils = {
	/**
	 * Returns widget binding on element.
	 * @param {HTMLElement} element
	 * @returns {Kekule.Widget.BaseWidget}
	 */
	getWidgetOnElem: function(element, retainPlaceholder)
	{
		var result = element[widgetBindingField];

		if (!retainPlaceholder && (result instanceof Kekule.Widget.PlaceHolder))
		{
			result = result.getTargetWidget();
		}

		return result;
	},
	/**
	 * Returns all widgets in element and its child elements.
	 * @param {HTMLElement} element
	 * @param {Bool} checkElemInsideWidget
	 * @returns {Array}
	 */
	getWidgetsInsideElem: function(element, checkElemInsideWidget)
	{
		var result;
		var widget = Kekule.Widget.Utils.getWidgetOnElem(element);
		if (widget)
			result = [widget];
		else
			result = [];
		if (!checkElemInsideWidget)
			return result;

		var childElems = Kekule.DomUtils.getDirectChildElems(element);
		for (var i = 0, l = childElems.length; i < l; ++i)
		{
			var elem = childElems[i];
			var widgets = Kekule.Widget.Utils.getWidgetsInsideElem(elem, checkElemInsideWidget);
			result = result.concat(widgets);
		}
		return result;
	},
	/**
	 * Returns an ID specified widget in document.
	 * @param {String} id
	 * @param {HTMLDocument} doc
	 * @returns {Kekule.Widget.BaseWidget}
	 */
	getWidgetById: function(id, doc)
	{
		if (!doc)
			doc = document;
		var elem = doc.getElementById(id);
		if (elem)
			return Kekule.Widget.Utils.getWidgetOnElem(elem);
		else
			return undefined;
	},
	/**
	 * Returns widget the element belonged to.
	 * @param {HTMLElement} element
	 * @returns {Kekule.Widget.BaseWidget}
	 */
	getBelongedWidget: function(element)
	{
		var result = null; //Kekule.Widget.Utils.getWidgetOnElem(element);
		while (element && (!result))
		{
			result = Kekule.Widget.Utils.getWidgetOnElem(element);
			element = element.parentNode;
		}
		return result;
	},
	/**
	 * Returns widget the element belonged to. The widget must be a non-static one.
	 * @param {HTMLElement} element
	 * @returns {Kekule.Widget.BaseWidget}
	 */
	getBelongedResponsiveWidget: function(element)
	{
		var result = null;
		while (element && (!result))
		{
			result = Kekule.Widget.Utils.getWidgetOnElem(element);
			if (result && result.getStatic())
				result = null;
			element = element.parentNode;
		}
		return result;
	},

	/**
	 * Create widget from a definition hash object. The hash object may include the following fields:
	 *   {
	 *     'widgetClass' or 'widget': widget class, class object or string, must have,
	 *     'htmlClass': string, HTML class name should be added to widget,
	 *     'children': array of child widget definition hash
	 *   }
	 * Other fields will be set to properties of widget with the same names. If the field name starts with
	 * '#' and the value is a function, then the function will be set as an event handler.
	 * @param {Variant} parentOrElementOrDocument
	 * @param {Hash} defineObj
	 * @returns {Kekule.Widget.BaseWidget}
	 */
	createFromHash: function(parentOrElementOrDocument, defineObj)
	{
		var specialFields = ['widget', 'widgetClass', 'htmlClass', 'children'];
		var wclass = defineObj.widgetClass || defineObj.widget;
		if (typeof(wclass) === 'string')
			wclass = ClassEx.findClass(wclass);
		if (!wclass)
		{
			Kekule.error(Kekule.$L('ErrorMsg.WIDGET_CLASS_NOT_FOUND'));
			return null;
		}

		var result = new wclass(parentOrElementOrDocument);
		var fields = Kekule.ObjUtils.getOwnedFieldNames(defineObj, true);
		fields = Kekule.ArrayUtils.exclude(fields, specialFields);
		for (var i = 0, l = fields.length; i < l; ++i)
		{
			var field = fields[i];
			var value = defineObj[field];
			if (field.startsWith('#') && DataType.isFunctionValue(value))
			{
				var eventName = field.substr(1);
				result.addEventListener(eventName, value);
			}
			else if (result.hasProperty(field))
			{
				//console.log('set prop value', field, value);
				result.setPropValue(field, value);
			}
		}

		if (defineObj.htmlClass)
		{
			result.addClassName(defineObj.htmlClass, true);
		}
		if (defineObj.children)
		{
			var childDefs = defineObj.children;
			if (DataType.isArrayValue(childDefs))
			{
				for (var i = 0, l = childDefs.length; i < l; ++i)
				{
					var def = childDefs[i];
					var child = Kekule.Widget.Utils.createFromHash(result, def);
					if (child)
						child.appendToWidget(result);
				}
			}
		}

		return result;
	},

	/**
	 * When binding to element, properties of widget can be set by element attribute values.
	 * This method helps to turn string type attribute values to proper type and set it to widget.
	 * @param {Kekule.Widget.BaseWidget} widget
	 * @param {String} propName
	 * @param {String} attribValue
	 */
	setWidgetPropFromElemAttrib: function(widget, attribName, attribValue)
	{
		var propName = attribName.camelize();
		// get widget property type first
		var dtype = widget.getPropertyDataType(propName);

		if (!dtype)  // can not find property, exit
			return;

		if (dtype === DataType.STRING)
			widget.setPropValue(propName, attribValue);
		else  // need to convert type
		{
			if (Kekule.PredefinedResReferer.isResValue(attribValue))
			{
				Kekule.PredefinedResReferer.loadResource(attribValue, function(resInfo, success)
				{
					//if (success)
					{
						// Check if widget has a special method to handle predefined resource
						//console.log(resInfo);
						if (widget.loadPredefinedResDataToProp)
							widget.loadPredefinedResDataToProp(propName, resInfo, success);
					}
				}, null, widget.getDocument());
			}
			else if (attribValue.startsWith('#') && (ClassEx.isOrIsDescendantOf(ClassEx.findClass(dtype), Kekule.Widget.BaseWidget)))  // start with '#', e.g. #id, means a id of another widget
			{
				var id = attribValue.substr(1).trim();
				Kekule.Widget.Utils._setWidgetRefPropFromId(widget, propName, id);
			}
			else
			{
				var value = JSON.parse(attribValue);
				if (Kekule.ObjUtils.notUnset(value))
				{
					var obj = ObjSerializerFactory.getSerializer('json').load(null, value);
					widget.setPropValue(propName, obj);
				}
			}
		}
	},
	/** @private */
	_setWidgetRefPropFromId: function(widget, propName, id)
	{
		if (id)
		{
			var refWidget = Kekule.Widget.getWidgetById(id, widget.getDocument());
			if (refWidget)
				widget.setPropValue(propName, refWidget);
		}
	}
};

// Alias of important Kekule.Widget.Utils methods
/**
 * Returns widget binding on element.
 * @param {HTMLElement} element
 * @returns {Kekule.Widget.BaseWidget}
 * @function
 */
Kekule.Widget.getWidgetOnElem = Kekule.Widget.Utils.getWidgetOnElem;
/**
 * Returns an ID specified widget in document.
 * @param {HTMLDocument} doc
 * @param {String} id
 * @returns {Kekule.Widget.BaseWidget}
 * @function
 */
Kekule.Widget.getWidgetById = Kekule.Widget.Utils.getWidgetById;
Kekule.$W = Kekule.Widget.Utils.getWidgetById;
/**
 * Returns widget the element belonged to.
 * @param {HTMLElement} element
 * @returns {Kekule.Widget.BaseWidget}
 * @function
 */
Kekule.Widget.getBelongedWidget = Kekule.Widget.Utils.getBelongedWidget;
/**
 * Create widget from a definition hash object. The hash object may include the following fields:
 *   {
 *     'widgetClass' or 'widget': widget class, class object or string, must have,
 *     'htmlClass': string, HTML class name should be added to widget,
 *     'children': array of child widget definition hash
 *   }
 * Other fields will be set to properties of widget with the same names. If the field name starts with
 * '#' and the value is a function, then the function will be set as an event handler.
 * @param {Variant} parentOrElementOrDocument
 * @param {Hash} defineObj
 * @returns {Kekule.Widget.BaseWidget}
 */
Kekule.Widget.createFromHash = Kekule.Widget.Utils.createFromHash;

/**
 * A singleton class to manage some global settings of widgets on HTML document.
 * User should not use this class directly.
 * @class
 * @augments ObjectEx
 *
 * @param {HTMLDocument} doc
 *
 * @property {Kekule.Widget.BaseWidget} mouseCaptureWidget Widget to capture all mouse/touch events.
 * @property {Array} popupWidgets Current popup widgets.
 * @property {Array} dialogWidgets Current opened dialogs.
 * @property {Bool} preserveWidgetList Whether the manager keep a list of all widgets on document.
 * @property {Array} widgets An array of all widgets on document.
 *   This property is only available when property preserveWidgetList is true.
 * @private
 */
/**
 * Invoked when a widget is created on document.
 *   event param of it has field: {widget}.
 * @name Kekule.Widget.GlobalManager#widgetCreate
 * @event
 */
/**
 * Invoked when a widget is finalized on document.
 *   event param of it has field: {widget}.
 * @name Kekule.Widget.GlobalManager#widgetFinalize
 * @event
 */
Kekule.Widget.GlobalManager = Class.create(ObjectEx,
/** @lends Kekule.Widget.GlobalManager# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.GlobalManager',
	/** @private */
	INFO_FIELD: '__$info__',
	/** @constructs */
	initialize: function($super, doc)
	{
		$super();
		this._document = doc || document;
		this._hammertime = null;  // private
		this.setPropStoreFieldValue('popupWidgets', []);
		this.setPropStoreFieldValue('dialogWidgets', []);
		this.setPropStoreFieldValue('modalWidgets', []);
		this.setPropStoreFieldValue('widgets', []);
		this.setPropStoreFieldValue('preserveWidgetList', true);

		/*
		this.react_mousedown_binding = this.react_mousedown.bind(this);
		this.react_keydown_binding = this.react_keydown.bind(this);
		this.react_touchstart_binding = this.react_touchstart.bind(this);
		*/
		this.reactUiEventBind = this.reactUiEvent.bind(this);
		this.reactTouchGestureBind = this.reactTouchGesture.bind(this);
		/*
		this.reactPageShowBind = this.reactPageShow.bind(this);

		if (window)
			this.installWindowEventHandlers(window);
		*/
		Kekule.X.domReady(this.domReadyInit.bind(this));
	},
	/** @ignore */
	finalize: function($super)
	{
		this.uninstallGlobalDomMutationHandlers(this._document.documentElement/*.body*/);
		//this.uninstallGlobalTouchHandlers(this._document.documentElement/*.body*/);
		this.uninstallGlobalEventHandlers(this._document.documentElement/*.body*/);
		this._hammertime = null;
		this.setPropStoreFieldValue('popupWidgets', null);
		this.setPropStoreFieldValue('widgets', null);
		$super();
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('mouseCaptureWidget', {'dataType': DataType.OBJECT, 'serializable': false});
		this.defineProp('popupWidgets', {'dataType': DataType.ARRAY, 'serializable': false});
		this.defineProp('dialogWidgets', {'dataType': DataType.ARRAY, 'serializable': false});
		this.defineProp('modalWidgets', {'dataType': DataType.ARRAY, 'serializable': false});
		this.defineProp('preserveWidgetList', {'dataType': DataType.BOOL, 'serializable': false,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('preserveWidgetList', value);
				if (!value)
					this.setPropStoreFieldValue('widgets', []);
			}
		});
		this.defineProp('widgets', {'dataType': DataType.ARRAY, 'serializable': false, 'setter': null});
		// private, record current active and focused widget
		// at one time, only one widget can be in those states
		this.defineProp('currActiveWidget', {'dataType': 'Kekule.Widget.BaseWidget', 'serializable': false});
		this.defineProp('currFocusedWidget', {'dataType': 'Kekule.Widget.BaseWidget', 'serializable': false});
		//this.defineProp('currHoverWidget', {'dataType': 'Kekule.Widget.BaseWidget', 'serializable': false});

		this.defineProp('modalBackgroundElem', {'dataType': DataType.OBJECT, 'serializable': false, 'setter': null});
	},

	/** @private */
	domReadyInit: function()
	{
		this.installGlobalEventHandlers(this._document.documentElement/*.body*/);
		//this._hammertime = this.installGlobalTouchHandlers(this._document.body);
		this.installGlobalDomMutationHandlers(this._document.documentElement/*.body*/);
	},

	/**
	 * Notify that a widget is created on page.
	 * @param {Kekule.Widget.BaseWidget} widget
	 * @private
	 */
	notifyWidgetCreated: function(widget)
	{
		if (this.getPreserveWidgetList())
			this.getWidgets().push(widget);
		this.invokeEvent('widgetCreate', {'widget': widget});
	},
	/**
	 * Notify that a widget is finalized on page.
	 * @param {Kekule.Widget.BaseWidget} widget
	 * @private
	 */
	notifyWidgetFinalized: function(widget)
	{
		if (this.getWidgets())
			Kekule.ArrayUtils.remove(this.getWidgets(), widget);
		if (this.getPopupWidgets())
			Kekule.ArrayUtils.remove(this.getPopupWidgets(), widget);
		if (this.getDialogWidgets())
			Kekule.ArrayUtils.remove(this.getDialogWidgets(), widget);
		if (widget === this.getCurrActiveWidget())
			this.setCurrActiveWidget(null);
		if (widget === this.getCurrFocusedWidget())
			this.setCurrFocusedWidget(null);

		this.invokeEvent('widgetFinalize', {'widget': widget});
	},
	/**
	 * Notify that active state of a widget is changed.
	 * @param {Kekule.Widget.BaseWidget} widget
	 * @param {Bool} active
	 * @private
	 */
	notifyWidgetActiveChanged: function(widget, active)
	{
		var oldWidget = this.getCurrActiveWidget();
		if (active)
		{
			if (widget !== oldWidget)
			{
				if (oldWidget)
					oldWidget.setIsActive(false);
				this.setCurrActiveWidget(widget);
			}
		}
		else
		{
			if (oldWidget === widget)
				this.setCurrActiveWidget(null);
		}
	},
	/**
	 * Notify that focus state of a widget is changed.
	 * @param {Kekule.Widget.BaseWidget} widget
	 * @param {Bool} focused
	 * @private
	 */
	notifyWidgetFocusChanged: function(widget, focused)
	{
		var oldWidget = this.getCurrFocusedWidget();
		if (focused)
		{
			if (widget !== oldWidget)
			{
				// do not need to blur old widget, this will be done automatically by browser
				if (oldWidget)
					oldWidget.setIsFocused(false);
				this.setCurrFocusedWidget(widget);
			}
		}
		else
		{
			if (oldWidget === widget)
				this.setCurrFocusedWidget(null);
		}
	},

	/**
	 * Return if there is popup widget in current document.
	 */
	hasPopupWidgets: function()
	{
		return !!this.getPopupWidgets().length;
	},
	/**
	 * Return if there is dialog widget in current document.
	 */
	hasDialogWidgets: function()
	{
		return !!this.getDialogWidgets().length;
	},

	/**
	 * Returns widget the element belonged to. The widget must be a non-static one.
	 * @param {HTMLElement} element
	 * @returns {Kekule.Widget.BaseWidget}
	 */
	getBelongedResponsiveWidget: function(element)
	{
		/*
		var result = null;
		while (element && (!result))
		{
			result = Kekule.Widget.Utils.getWidgetOnElem(element);
			if (result && result.getStatic())
				result = null;
			element = element.parentNode;
		}
		return result;
		*/
		return Kekule.Widget.Utils.getBelongedResponsiveWidget(element);
	},

	/**
	 * Notify that a widget on document has fired an event.
	 * @param {Kekule.Widget.BaseWidget} widget
	 * @param {String} eventName
	 * @param {Hash} event
	 */
	notifyWidgetEventFired: function(widget, eventName, event)
	{
		var e = Object.extend({}, event);
		e.widget = widget;
		this.invokeEvent(eventName, e);
	},

	// global event handlers
	/*
	 * Install event handlers binding to current window.
	 * @param {Window} target
	 * @private
	 */
	/*
	installWindowEventHandlers: function(target)
	{
		console.log('install window event');
		if (!this._windowEventInstalled)
		{
			Kekule.X.Event.addListener(target, 'pageshow', this.reactPageShowBind);
			this._windowEventInstalled = true;
		}
	},
	*/
	/*
	 * Called when current window is shown. Notifies widgets in page that their show state may be changed.
	 * @param {Object} e
	 * @private
	 */
	/*
	reactPageShow: function(e)
	{
		//console.log('widget page show');
		var widgets = this.getWidgets();
		for (var i = 0, l = widgets.length; i < l; ++i)
		{
			var w = widgets[i];
			w.widgetShowStateChanged();
		}
	},
	*/
	/**
	 * Install UI event (mousemove, click...) handlers to element.
	 * @param {HTMLElement} target
	 * @private
	 */
	installGlobalEventHandlers: function(target)
	{
		if (!this._globalEventInstalled)
		{
			var events = Kekule.Widget.UiEvents;
			for (var i = 0, l = events.length; i < l; ++i)
			{
				Kekule.X.Event.addListener(target, events[i], this.reactUiEventBind);
			}
			this._globalEventInstalled = true;
		}
	},
	/**
	 * Uninstall UI event (mousemove, click...) handlers from old mainContextElement.
	 * @param {HTMLElement} element
	 * @private
	 */
	uninstallGlobalEventHandlers: function(target)
	{
		var events = Kekule.Widget.UiEvents;
		for (var i = 0, l = events.length; i < l; ++i)
		{
			Kekule.X.Event.removeListener(target, events[i], this.reactUiEventBind);
		}
	},

	/**
	 * Install touch event (touch, swipe, pinch...) handlers to element.
	 * Currently hammer.js is used.
	 * @param {HTMLElement} element
	 * @private
	 */
	installGlobalTouchHandlers: function(target)
	{
		if (typeof(Hammer) !== 'undefined')
		{
			var result = Hammer(target).on(Kekule.Widget.TouchGestures.join(' '), this.reactTouchGestureBind);
			//console.log(result);
			//result.stop_browser_behavior.touchAction = 'none';
			return result;
		}
	},
	/**
	 * Uninstall touch event (touch, swipe, pinch...) handlers to element.
	 * Currently hammer.js is used.
	 * @param {HTMLElement} element
	 * @private
	 */
	uninstallGlobalTouchHandlers: function(target)
	{
		if (this._hammertime)
			this._hammertime.off(Kekule.Widget.TouchGestures.join(' '), this.reactTouchGestureBind);
	},

	/**
	 * Install handlers to react to DOM node changes.
	 * @param {HTMLElement} target
	 * @private
	 */
	installGlobalDomMutationHandlers: function(target)
	{
		var self = this;
		if (Kekule.X.MutationObserver)
		{
			var observer = new Kekule.X.MutationObserver(
				function(mutations)
				{
					for (var i = 0, l = mutations.length; i < l; ++i)
					{
						var m = mutations[i];
						if (m.type === 'childList')  // dom tree changes
						{
							var nodes = m.addedNodes;
							for (var j = 0, k = nodes.length; j < k; ++j)
							{
								var node = nodes[j];
								if (node.nodeType === Node.ELEMENT_NODE)
								{
									self._handleDomAddedElem(node);
								}
							}
							var nodes = m.removedNodes;
							for (var j = 0, k = nodes.length; j < k; ++j)
							{
								var node = nodes[j];
								if (node.nodeType === Node.ELEMENT_NODE)
								{
									self._handleDomRemovedElem(node);
								}
							}
						}
					}
				});
			observer.observe(target, {
				childList: true,
				subtree: true
			});
			this._domMutationObserver = observer;
		}
		else // traditional DOM event method
		{
			this._reactDomNodeInserted = function(e)
			{
				var target = e.getTarget();
				if (target.nodeType === (Node.ELEMENT_NODE))  // is element
				{
					self._handleDomAddedElem(target);
				}
			};
			this._reactDomNodeRemoved = function(e)
			{
				var target = e.getTarget();
				if (target.nodeType === (Node.ELEMENT_NODE))  // is element
				{
					self._handleDomRemovedElem(target);
				}
			};
			Kekule.X.Event.addListener(target, 'DOMNodeInserted', this._reactDomNodeInserted);
			Kekule.X.Event.addListener(target, 'DOMNodeRemoved', this._reactDomNodeRemoved);
		}
	},
	/**
	 * Uninstall handlers to react to DOM node changes.
	 * @param {HTMLElement} target
	 * @private
	 */
	uninstallGlobalDomMutationHandlers: function(target)
	{
		if (this._domMutationObserver)
			this._domMutationObserver.disconnect();
		if (this._reactDomNodeInserted)
			Kekule.X.Event.removeListener(target, 'DOMNodeInserted', this._reactDomNodeInserted);
		if (this._reactDomNodeRemoved)
			Kekule.X.Event.removeListener(target, 'DOMNodeRemoved', this._reactDomNodeRemoved);
	},
	/** @private */
	_handleDomAddedElem: function(elem)
	{
		var widgets = Kekule.Widget.Utils.getWidgetsInsideElem(elem, true);
		for (var i = 0, l = widgets.length; i < l; ++i)
		{
			var w = widgets[i];
			w.insertedToDom();
		}

		var w = Kekule.Widget.Utils.getBelongedWidget(elem);
		if (w)
			w.domElemAdded(elem);
	},
	/** @private */
	_handleDomRemovedElem: function(elem)
	{
		var widgets = Kekule.Widget.Utils.getWidgetsInsideElem(elem, true);
		for (var i = 0, l = widgets.length; i < l; ++i)
		{
			var w = widgets[i];
			w.removedFromDom();
		}

		var w = Kekule.Widget.Utils.getBelongedWidget(elem);
		if (w)
			w.domElemRemoved(elem);
	},

	/** @private */
	isMouseEvent: function(eventName)
	{
		return eventName.startsWith('mouse') || (eventName === 'click');
	},
	/** @private */
	isTouchEvent: function(eventName)
	{
		return eventName.startsWith('touch');
	},

	/** @private */
	reactUiEvent: function(e)
	{
		var evType = e.getType();

		// get target widget to dispatch event
		var targetWidget;
		var mouseCaptured;
		if (this.getMouseCaptureWidget() && (this.isMouseEvent(evType) || this.isTouchEvent(evType)))  // may be captured
		{
			targetWidget = this.getMouseCaptureWidget();
			mouseCaptured = true;
		}
		else
		{
			var elem = e.getTarget();
			targetWidget = this.getBelongedResponsiveWidget(elem);
		}

		if (evType === 'touchstart' || evType === 'touchend')
		{
			//console.log('[Global touch event]', evType, e.getTarget());
			this._touchJustStart = true;  // a flag to avoid "ghost mouse event" after touch
			var self = this;
			setTimeout(function(){ self._touchJustStart = false; }, 500);
		}
		else if (['mousedown', 'mouseup', 'mouseout', 'click'].indexOf(evType) >= 0)
		{
			if (this._touchJustStart)  // mark ghost mouse event
				e.ghostMouseEvent = true;
				//return;
		}

		/*
		if (['mouseup', 'click', 'touchend'].indexOf(evType) >= 0)  // dismiss mouse capture
		{
			if (mouseCaptured)
				this.setMouseCaptureWidget(null);
		}
		*/

		// check first if the component has event handler itself
		var funcName = Kekule.Widget.getEventHandleFuncName(e.getType());

		if (this[funcName])  // has own handler
			this[funcName](e);

		// dispatch to widget
		if (targetWidget)
		{
			//console.log('event', e.getTarget().tagName, widget.getClassName());
			targetWidget.reactUiEvent(e);
		}
	},
	/** @private */
	reactTouchGesture: function(e)
	{
		var funcName = Kekule.Widget.getTouchGestureHandleFuncName(e.getType());

		//console.log('gesture', funcName, e.target);

		if (this[funcName])
			this[funcName](e);

		// as touch gesture handling function is installed in global handler only, need to dispatch to corresponding widgets
		var widget = Kekule.Widget.getBelongedWidget(e.target);
		if (widget)
		{
			widget.reactTouchGesture(e);
		}
		else
		{
			//console.log('not captured ', e.target, e);
		}
	},

	/** @private */
	react_mousedown: function(e)
	{
		if (this.hasPopupWidgets() && !e.ghostMouseEvent)
		{
			var elem = e.getTarget();
			this.hidePopupWidgets(elem);
		}
	},
	/** @private */
	react_keydown: function(e)
	{
		var keyCode = e.getKeyCode();
		if (keyCode === Kekule.X.Event.KeyCode.ESC)
		{
			if (this.hasPopupWidgets())
			{
				//var elem = e.getTarget();
				this.hidePopupWidgets(null, true);  // dismiss even if focus on popup widget
			}
			else if (this.hasDialogWidgets())
			{
				this.hideTopmostDialogWidget(null, true);  // dismiss dialog
			}
		}
	},
	/** @private */
	react_touchstart: function(e)
	{
		if (this.hasPopupWidgets())
		{
			var elem = e.getTarget();
			this.hidePopupWidgets(elem);
		}
	},

	// methods about popups
	/**
	 * Called after popup widget is hidden.
	 * @param {Kekule.Widget.BaseWidget} widget
	 */
	unpreparePopupWidget: function(widget)
	{
		widget.setPopupCaller(null);
		this.restoreElem(widget.getElement());
	},
	/**
	 * Prepare before showing popup widget.
	 * In this method, popupWidget element will be moved to top most layer and its position will
	 * be recalculated.
	 * @param {Kekule.Widget.BaseWidget} popupWidget Widget to be popped up.
	 * @param {Kekule.Widget.BaseWidget} invokerWidget Who popped that widget.
	 * @param {Int} showType Value from {@link Kekule.Widget.ShowHideType}. If showType is DROPDOWN,
	 *   the new position will be calculated based on invokerWidget.
	 */
	preparePopupWidget: function(popupWidget, invokerWidget, showType)
	{
		popupWidget.setPopupCaller(invokerWidget);
		var popupElem = popupWidget.getElement();
		var doc = popupElem.ownerDocument;
		// check if already in top most layer
		var topmostLayer = this.getTopmostLayer(doc, true);
		var isOnTopLayer = popupElem.parentNode === topmostLayer;

		// calc widget position
		var ST = Kekule.Widget.ShowHideType;
		var posInfo;
		if ((showType === ST.DROPDOWN) && invokerWidget)  // need to calc position on invokerWidget
		{
			posInfo = this._calcDropDownWidgetPosInfo(popupWidget, invokerWidget);
		}
		else if (!isOnTopLayer)
		{
			posInfo = this._calcPopupWidgetPosInfo(popupWidget);
		}

		if (!isOnTopLayer)
		{
			//topmostLayer.appendChild(popupElem);
			this.moveElemToTopmostLayer(popupElem);
		}
		if (posInfo)
		{
			// set style
			var stylePropNames = ['left', 'top', 'right', 'bottom', 'width', 'height'];
			var oldStyle = {};
			var style = popupElem.style;
			style.position = 'absolute';
			for (var i = 0, l = stylePropNames.length; i < l; ++i)
			{
				var name = stylePropNames[i];
				var value = posInfo[name];
				if (value)
				{
					oldStyle[name] = style[name] || '';
					style[name] = value;
				}
			}
			var info = this._getElemStoredInfo(popupElem);
			info.styles = oldStyle;
		}
	},
	/** @private */
	_calcPopupWidgetPosInfo: function(widget)
	{
		var EU = Kekule.HtmlElementUtils;
		var elem = widget.getElement();
		var isShown = widget.isShown();
		if (!isShown)
		{
			dropElem.style.visible = 'hidden';
			dropElem.style.display = '';
		}

		var clientRect = EU.getElemBoundingClientRect(elem);
		//var offsetDim = EU.getElemOffsetDimension(elem);
		return {
			'top': clientRect.top + 'px',
			'left': clientRect.left + 'px'
		}
	},
	/** @private */
	_calcDropDownWidgetPosInfo: function(dropDownWidget, invokerWidget)
	{
		var EU = Kekule.HtmlElementUtils;
		var D = Kekule.Widget.Position;

		var pos = invokerWidget.getDropPosition? invokerWidget.getDropPosition(): null;

		var p = invokerWidget.getParent();
		var layout = p && p.getLayout() || Kekule.Widget.Layout.HORIZONTAL;

		// check which direction can display all part of widget and drop dropdown widget to that direction
		var invokerElem = invokerWidget.getElement();
		var invokerClientRect = EU.getElemBoundingClientRect(invokerElem);
		var viewPortDim = EU.getViewportDimension(invokerElem);
		var dropElem = dropDownWidget.getElement();
		// add the dropdown element to DOM tree first, else the offsetDimension will always return 0
		dropElem.style.visible = 'hidden';
		dropElem.style.display = '';
		var manualAppended = false;
		var topmostLayer = this.getTopmostLayer(dropElem.ownerDocument);
		if (!dropElem.parentNode)
		{
			//invokerElem.appendChild(dropElem);  // IMPORTANT: must append to invoker, otherwise style may be different
			topmostLayer.appendChild(dropElem);
			manualAppended = true;
		}

		dropElem.style.position = 'relative';  // absolute may cause size problem in Firefox

		var dropOffsetDim = EU.getElemOffsetDimension(dropElem);
		var dropScrollDim = EU.getElemScrollDimension(dropElem);
		var dropClientRect = EU.getElemBoundingClientRect(dropElem);

		dropElem.style.position = 'absolute';  // restore

		// then remove from DOM tree
		if (manualAppended)
			//invokerElem.removeChild(dropElem);
			topmostLayer.removeChild(dropElem);

		//if (layout)
		if (!pos || pos === D.AUTO)  // decide drop pos
		{
			pos = 0;
			if (layout === Kekule.Widget.Layout.VERTICAL)  // check left or right
			{
				var left = invokerClientRect.x;
				var right = viewPortDim.width - left - invokerClientRect.width;
				// we prefer right, check if right can display drop down widget
				if (right >= dropOffsetDim.width)
					pos |= D.RIGHT;
				else
					pos |= (left > right)? D.LEFT: D.RIGHT;
			}
			else  // check top or bottom
			{
				var top = invokerClientRect.y;
				var bottom = viewPortDim.height - top - invokerClientRect.height;
				// we prefer bottom
				if (bottom >= dropOffsetDim.height)
					pos |= D.BOTTOM;
				else
					pos |= (top > bottom)? D.TOP: D.BOTTOM;
			}
		}

		// at last returns top/left/width/height
		/*
		var xprop = (pos & D.LEFT)? 'right': 'left';
		var yprop = (pos & D.TOP)? 'bottom': 'top';
		*/
		//console.log(invokerClientRect);
		var SU = Kekule.StyleUtils;
		var invokerClientRect = EU.getElemBoundingClientRect(invokerElem, true);  // refetch, with document scroll considered
		var w = SU.getComputedStyle(dropElem, 'width') || dropScrollDim.width;
		var h = SU.getComputedStyle(dropElem, 'height') || dropScrollDim.height;
		/*
		var x = (pos & D.LEFT) || (pos & D.RIGHT)? invokerClientRect.left - w: invokerClientRect.left;
		var y = (pos & D.BOTTOM) || (pos & D.TOP)? invokerClientRect.top - h: invokerClientRect.top;
		*/
		/*
		var x = (pos & D.LEFT)? invokerClientRect.left - dropClientRect.width:
			(pos & D.RIGHT)? invokerClientRect.right:
			invokerClientRect.left;  // not appointed, decide automatically
		*/
		var x;
		if (pos & D.LEFT)
			x = invokerClientRect.left - dropClientRect.width;
		else if (pos & D.RIGHT)
			x = invokerClientRect.right;
		else  // not appointed, decide automatically
		{
			var leftDistance = viewPortDim.width - invokerClientRect.right;
			var rightDistance = viewPortDim.width - invokerClientRect.left;
			if (rightDistance >= dropClientRect.width)  // default, can drop left align to left edge of invoker
				x = invokerClientRect.left;
			else  // must drop right align to right edge of invoker
				x = invokerClientRect.right - dropClientRect.width;
		}
		/*
		var y = (pos & D.TOP)? invokerClientRect.top - dropClientRect.height:
			(pos & D.BOTTOM)? invokerClientRect.bottom:
			invokerClientRect.top;
		*/
		var y;
		if (pos & D.TOP)
			y = invokerClientRect.top - dropClientRect.height;
		else if (pos & D.BOTTOM)
			y = invokerClientRect.bottom;
		else  // not appointed, calc
		{
			var topDistance = viewPortDim.height - invokerClientRect.bottom;
			var bottomDistance = viewPortDim.height - invokerClientRect.top;
			if (bottomDistance >= dropClientRect.height)
				y = invokerClientRect.bottom;
			else  // must drop right align to right edge of invoker
				y = invokerClientRect.bottom - dropClientRect.height;
		}

		//console.log(pos, invokerClientRect, y, h, dropClientRect.height);

		x += 'px';
		y += 'px';
		w += 'px';
		h += 'px';
		//console.log(xprop, x, yprop, y);
		var result = {};


		result.left = x;
		result.top = y;

		result.width = w;
		result.height = h;


		return result;
	},

	/**
	 * When use activate an element outside the popups, all popped widget should be hidden.
	 * @param {HTMLElement} activateElement
	 * @private
	 */
	hidePopupWidgets: function(activateElement, isDismissed)
	{
		var widgets = this.getPopupWidgets();
		var activateWidget = Kekule.Widget.getBelongedWidget(activateElement);
		var activateWidgetCaller = activateWidget? activateWidget.getPopupCaller(): null;
		var activateWidgetCallerElem = activateWidgetCaller? activateWidgetCaller.getElement(): null;

		for (var i = widgets.length - 1; i >= 0; --i)
		{
			var widget = widgets[i];
			var elem = widget.getElement();
			if (elem)
			{
				if (elem === activateWidgetCallerElem || Kekule.DomUtils.isDescendantOf(activateWidgetCallerElem, elem))
					continue;
				if ((!activateElement) ||
					((elem !== activateElement) && (!Kekule.DomUtils.isDescendantOf(activateElement, elem))))  // active outside this widget, this widget need to hide
				{
					if (!isDismissed)
					{
						widget.hide();
					}
					else
						widget.dismiss();
				}
			}
			else  // element of widgets is missing, may be removed or finalized already
			{
				Kekule.ArrayUtils.remove(this.getPopupWidgets(), widget);   // remove from popup array
			}
		}
	},
	/**
	 * When press ESC key, topmost dialog widget should be hidden.
	 * @param {HTMLElement} activateElement
	 * @private
	 */
	hideTopmostDialogWidget: function(activateElement, isDismissed)
	{
		var widgets = this.getDialogWidgets() || [];
		var w = widgets[widgets.length - 1];
		if (w)
		{
			var elem = w.getElement();
			if (elem)
			{
				if (isDismissed)
					w.dismiss();
				else
					w.hide();
			}
			else  // element of widgets is missing, may be removed or finalized already
				Kekule.ArrayUtils.remove(this.geDialogWidgets(), w);
		}
	},

	/**
	 * Notify the manager that an popup widget is shown.
	 * @param {Kekule.Widget.BaseWidget} widget
	 * //@param {HTMLElement} element Base element of widget. If not set, widget.getElement() will be used.
	 */
	registerPopupWidget: function(widget /*, element*/)
	{
		/*
		var elem = element || widget.getElement();
		this.getPopupWidgetMapping().set(elem, widget);
		*/
    widget.addClassName(CNS.SHOW_POPUP);
		Kekule.ArrayUtils.pushUnique(this.getPopupWidgets(), widget);
	},
	/**
	 * Notify the manager that an popup widget is hidden.
	 * @param {Kekule.Widget.BaseWidget} widget
	 * //@param {HTMLElement} element Base element of widget. If not set, widget.getElement() will be used.
	 */
	unregisterPopupWidget: function(widget/*, element*/)
	{
		/*
		var elem = element || widget.getElement();
		this.getPopupWidgetMapping().remove(elem);
		*/
    widget.removeClassName(CNS.SHOW_POPUP);
		Kekule.ArrayUtils.remove(this.getPopupWidgets(), widget);
	},
	/**
	 * Notify the manager that an dialog widget is shown.
	 * @param {Kekule.Widget.BaseWidget} widget
	 * //@param {HTMLElement} element Base element of widget. If not set, widget.getElement() will be used.
	 */
	registerDialogWidget: function(widget /*, element*/)
	{
		widget.addClassName(CNS.SHOW_DIALOG);
		Kekule.ArrayUtils.pushUnique(this.getDialogWidgets(), widget);
	},
	/**
	 * Notify the manager that an dialog widget is hidden.
	 * @param {Kekule.Widget.BaseWidget} widget
	 * //@param {HTMLElement} element Base element of widget. If not set, widget.getElement() will be used.
	 */
	unregisterDialogWidget: function(widget/*, element*/)
	{
		widget.removeClassName(CNS.SHOW_DIALOG);
		Kekule.ArrayUtils.remove(this.getDialogWidgets(), widget);
	},

	/**
	 * Notify the manager that an dialog widget is shown.
	 * @param {Kekule.Widget.BaseWidget} widget
	 */
	registerModalWidget: function(widget)
	{
		var prevModal = this.getCurrModalWidget();
		if (prevModal)
			prevModal.removeClassName(CNS.SHOW_ACTIVE_MODAL);
		Kekule.ArrayUtils.pushUnique(this.getModalWidgets(), widget);
		widget.addClassName(CNS.SHOW_ACTIVE_MODAL);
	},
	/**
	 * Notify the manager that an dialog widget is hidden.
	 * @param {Kekule.Widget.BaseWidget} widget
	 */
	unregisterModalWidget: function(widget)
	{
		widget.removeClassName(CNS.SHOW_ACTIVE_MODAL);
		Kekule.ArrayUtils.remove(this.getModalWidgets(), widget);
		var prevModal = this.getCurrModalWidget();
		if (prevModal)
			prevModal.addClassName(CNS.SHOW_ACTIVE_MODAL);
	},
	/**
	 * Returns current (topmost) modal widget.
	 * @returns {Kekule.Widget.BaseWidget}
	 */
	getCurrModalWidget: function()
	{
		var remainingModalWidgets = this.getModalWidgets();
		if (!remainingModalWidgets || !remainingModalWidgets.length)
			return null;
		else
			return remainingModalWidgets[0];
	},


	/** @private */
	prepareModalWidget: function(widget)
	{
		// create a modal background and then relocate dialog element on it
		var doc = widget.getDocument();
		var bgElem = this.getModalBackgroundElem();
		if (!bgElem)
		{
			//console.log('create new background');
			bgElem = doc.createElement('div');
			bgElem.className = CNS.MODAL_BACKGROUND;
			this.setPropStoreFieldValue('modalBackgroundElem', bgElem);
		}
		var elem = widget.getElement();
		widget.setModalInfo({
			'oldParent': elem.parentNode,
			'oldSibling': elem.nextSibling
		});
		//alert('hi');
		if (elem.parentNode)
			elem.parentNode.removeChild(elem);
		//div.appendChild(elem);

		if (bgElem.parentNode)
			bgElem.parentNode.removeChild(bgElem);
		doc.body.appendChild(bgElem);
		doc.body.appendChild(elem);  // append widget elem on background

		this.registerModalWidget(widget);
	},
	/** @private */
	unprepareModalWidget: function(widget)
	{
		var doc = widget.getDocument();

		this.unregisterModalWidget(widget);

		//console.log('unprepareModal');
		var parentElem = widget.getElement().parentNode;
		if (parentElem)
			parentElem.removeChild(widget.getElement());

		var modalInfo = widget.getModalInfo();
		if (modalInfo)
		{
			if (modalInfo.oldParent)
				modalInfo.oldParent.insertBefore(widget.getElement(), modalInfo.oldSibling);
			widget.setModalInfo(null);
		}

		var remainActiveModalWidget = this.getCurrModalWidget();
		var bgElem = this.getModalBackgroundElem();
		if (bgElem)
		{
			if (remainActiveModalWidget)  // still has modal widget, move background element under it
			{
				if (bgElem.parentNode)
					bgElem.parentNode.removeChild(bgElem);
				var parentNode = remainActiveModalWidget.getElement().parentNode;
				parentNode.insertBefore(bgElem, remainActiveModalWidget.getElement());
			}
			else  // no modal widget, remove background element
			{
				if (bgElem.parentNode)
				{
					bgElem.parentNode.removeChild(bgElem);
				}
			}
		}
	},

	/**
	 * Get top most layer previous created in document.
	 * @param {HTMLDocument} doc
	 * @returns {HTMLElement}
	 */
	getTopmostLayer: function(doc, canCreate)
	{
		var body = doc.body;
		return body;

		/*
		var child = body.lastChild;
		while (child && (child.className !== CNS.TOP_LAYER))
		{
			child = child.previousSibling;
		}
		if (!child && canCreate)
			child = this.createTopmostLayer(doc);
		return child;
		*/
	},
	/*
	 * Create a topmost transparent element in document to put drop down and popup widgets.
	 * @param {HTMLDocument} doc
	 * @returns {HTMLElement}
	 * @deprecated
	 */
	/*
	createTopmostLayer: function(doc)
	{
		var div = doc.createElement('div');
		div.className = CNS.TOP_LAYER;
		doc.body.appendChild(div);
		return div;
	},
	*/

	/** @private */
	_getElemStoredInfo: function(elem)
	{
		var result = null;
		if (elem)
		{
			result = elem[this.INFO_FIELD];
			if (!result)
			{
				result = {};
				elem[this.INFO_FIELD] = result;
			}
		}
		return result;
	},
	_clearElemStoredInfo: function(elem)
	{
		if (elem[this.INFO_FIELD])
			elem[this.INFO_FIELD] = undefined;
	},
	/**
	 * Move an element to top most layer for popup or dropdown.
	 * @param {HTMLElement} elem
	 * @private
	 */
	moveElemToTopmostLayer: function(elem)
	{
		// store elem's old position info first
		/*
		var oldInfo = {
			'parentElem': elem.parentNode,
			'nextSibling': elem.nextSibling
		};
		elem[this.INFO_FIELD] = oldInfo;
		*/
		var info = this._getElemStoredInfo(elem);
		info.parentElem = elem.parentNode;
		info.nextSibling = elem.nextSibling;

		var layer = this.getTopmostLayer(elem.ownerDocument);
		layer.appendChild(elem);
	},
	/**
	 * Restore element's style and position in DOM tree by stored info
	 * @param {HTMLElement} elem
	 * @private
	 */
	restoreElem: function(elem)
	{
		if (!elem)
			return;
		var info = this._getElemStoredInfo(elem);
		if (!info)
			return;
		// restore style
		var oldStyles = info.styles;
		var names = Kekule.ObjUtils.getOwnedFieldNames(oldStyles);
		var style = elem.style;
		for (var i = 0, l = names.length; i < l; ++i)
		{
			var name = names[i];
			var value = oldStyles[name];
			if (value)
				style[name] = value;
			else
				Kekule.StyleUtils.removeStyleProperty(style, name);
		}

		// restore DOM tree
		if (info.parentElem)
		{
			if (info.nextSibling)
				info.parentElem.insertBefore(elem, info.nextSibling);
			else
				info.parentElem.appendChild(elem);
		}

		// clear info
		elem[this.INFO_FIELD] = null;
	}
});
Kekule.ClassUtils.makeSingleton(Kekule.Widget.GlobalManager);
Kekule.Widget.globalManager = Kekule.Widget.GlobalManager.getInstance();


})();