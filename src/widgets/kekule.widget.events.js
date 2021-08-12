/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /utils/kekule.utils.js
 * requires /utils/kekule.domUtils.js
 * requires /xbrowsers/kekule.x.js
 * requires /widget/kekule.widget.root.js
 */

(function(){

"use strict";

Kekule.globalOptions.add('widget.events', {
	// Whether using mouse/touch events to simulate pointer events rather than using the native ones.
	// There used to be bugs about native pointer events in some widget code causing pointleave
	// fired at wrong position, so here we may set this option to true or false for debugging.
	forceSimulatePointerEvent: false
});


/**
 * A series of interactive events that may be handled by widget.
 * @ignore
 */
Kekule.Widget.UiEvents = [
	/*'blur', 'focus',*/ 'click', 'dblclick', 'mousedown',/*'mouseenter', 'mouseleave',*/ 'mousemove', 'mouseout', 'mouseover', 'mouseup', //'mousewheel',
	'keydown', 'keyup', 'keypress',
	'touchstart', 'touchend', 'touchcancel', 'touchmove',
	'pointerdown', 'pointermove', 'pointerout', 'pointerover', 'pointerup',
	'drag', 'dragend', 'dragenter', 'dragexit', 'dragleave', 'dragover', 'dragstart', 'drop'
];
/**
 * A series of interactive events that must be listened on local element.
 * @ignore
 */
Kekule.Widget.UiLocalEvents = [
	'blur', 'focus', 'mouseenter', 'mouseleave', 'mousewheel', 'pointerenter', 'pointerleave'
];

/**
 * A series of interactive touch gestures that may be handled by widget.
 * @ignore
 */
Kekule.Widget.TouchGestures = [
	//'press', 'pressup'
	'hold', 'tap', 'doubletap',
	'swipe', 'swipeup', 'swipedown', 'swipeleft', 'swiperight',
	'transform', 'transformstart', 'transformend',
	'rotate', 'rotatestart', 'rotatemove', 'rotateend', 'rotatecancel',
	'pinch', 'pinchstart', 'pinchmove', 'pinchend', 'pinchcancel', 'pinchin', 'pinchout',
	'pan', 'panstart', 'panmove', 'panend', 'pancancel', 'panleft', 'panright', 'panup', 'pandown'
];

var AU = Kekule.ArrayUtils;

/**
 * A special class to check if an HTML event matches for certain condition.
 * @class
 * @augments ObjectEx
 *
 * @param {Hash} eventParams Including {type/eventType, and additional event params}.
 *
 * @property {String} eventType HTML event name.
 * @property {Hash} eventParams Event params, including event type(name) and additional params, e.g. key and modifier state in key event.
 */
Kekule.Widget.HtmlEventMatcher = Class.create(ObjectEx,
/** @lends Kekule.Widget.HtmlEventMatcher# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.HtmlEventMatcher',
	/** @constructs */
	initialize: function(eventParams)
	{
		this.tryApplySuper('initialize', []);
		this.setEventParams(eventParams || {});
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('eventParams', {'dataType': DataType.HASH});
		this._defineEventParamProp('eventType', DataType.STRING, 'type');
	},
	/** @ignore */
	doFinalize: function()
	{
		this.tryApplySuper('doFinalize');
	},
	/** @private */
	_defineEventParamProp: function(propName, dataType, paramFieldName)
	{
		var kname = propName || paramFieldName;
		return this.defineProp(propName, {'dataType': dataType, 'serializable': false,
			'getter': function() { return this.getEventParams()[kname]; },
			'setter': function(value) { this.getEventParams()[kname] = value; }
		});
	},

	/**
	 * Check if current handler matches an HTMLEvent, and should react to it.
	 * Descendants should override this method.
	 * @param {HTMLEvent} htmlEvent
	 * @private
	 */
	match: function(htmlEvent)
	{
		var evType = (htmlEvent.getType && htmlEvent.getType()) || htmlEvent.type;
		return (evType === this.getEventType());
	},

	/**
	 * Execute action when matching an HTML event.
	 * @param {HTMLEvent} htmlEvent
	 * @param {Variant} execTarget Can be a function, Widget.Action or Widget.BaseWidget.
	 * @returns {Bool} Whether the event is matched and target executed.
	 */
	execOnMatch: function(htmlEvent, execTarget)
	{
		var result = this.match(htmlEvent);
		if (result && execTarget)
		{
			result = this.doExecTarget(htmlEvent, execTarget);
		}
		return result;
	},
	/** @private */
	doExecTarget: function(htmlEvent, target)
	{
		var result;
		if (DataType.isFunctionValue(target))
			result = target.apply(null, [htmlEvent, this]);
		else if (target.execute && DataType.isFunctionValue(target.execute))
		{
			if (DataType.isObjectExValue(target))
			{
				if (target instanceof Kekule.Widget.BaseWidget)
					result = target.execute(htmlEvent);
				else if (target instanceof Kekule.Action)
					result = target.execute(this, htmlEvent);
				else
					result = target.execute(htmlEvent, this);
			}
			else
				result = target.execute(htmlEvent, this);
		}
		else
			result = false;

		// if the return value of target.execute is undefined, we assume it did do something
		if (Kekule.ObjUtils.isUnset(result))
			result = true;

		return result;
	}
});

/**
 * A special class to react to HTML event and execute certain actions.
 * @class
 * @augments ObjectEx
 *
 * @param {Kekule.Widget.HtmlEventMatcher} matcher Matcher instance to test on events.
 * @param {Variant} execTarget Function or action or widget that should be executed on matching event.
 * @param {Bool} exclusive If true, event matching this one will not be dispatched further to other event responsers.
 *
 * @property {String} eventType HTML event name.
 * @property {Hash} eventParams Additional event params, e.g. key and modifier state in key event.
 * @property {Variant} execTarget Function or action or widget that should be executed on matching event.
 * @property {Bool} exclusive If true, event matching this one will not be dispatched further to other event responsers.
 */
/**
 * Invoked when a HTML event is matched (and execTarget should be executed).
 *   event param of it has fields: {htmlEvent, execTarget}.
 * Note this event will still be invoked even if execTarget is not set.
 * @name Kekule.Widget.HtmlEventResponser#execute
 * @event
 */
Kekule.Widget.HtmlEventResponser = Class.create(ObjectEx,
/** @lends Kekule.Widget.HtmlEventResponser# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.HtmlEventResponser',
	/** @constructs */
	initialize: function(eventMatcher, execTarget, exclusive)
	{
		this.setPropStoreFieldValue('eventMatcher', eventMatcher);
		this.setPropStoreFieldValue('execTarget', execTarget);
		this.tryApplySuper('initialize', []);
		this.setExclusive(exclusive || false);
	},
	/** @private */
	initProperties: function()
	{
		this._defineMatcherRelatedProp('eventParams', {'dataType': DataType.HASH});
		this._defineMatcherRelatedProp('eventType', DataType.STRING, 'type');
		this.defineProp('execTarget', {'dataType': DataType.VARIANT, 'serializable': false});
		this.defineProp('exclusive', {'dataType': DataType.BOOL, 'serializable': false});

		this.defineProp('eventMatcher', {
			'dataType': 'Kekule.Widget.HtmlEventMatcher', 'serializable': false, 'setter': null,
			'scope': Class.PropertyScope.PRIVATE
		});
	},
	/** @ignore */
	doFinalize: function()
	{
		this.setExecTarget(null);
		var matcher = this.getEventMatcher();
		if (matcher)
			matcher.finalize();
		this.tryApplySuper('doFinalize');
	},
	/** @private */
	_defineMatcherRelatedProp: function(propName, dataType, paramFieldName)
	{
		var kname = propName || paramFieldName;
		return this.defineProp(propName, {'dataType': dataType,
			'getter': function() {
				return this.getEventMatcher().getPropValue(kname);
			},
			'setter': function(value) {
				this.getEventMatcher().setPropValue(kname, value);
			}
		});
	},

	/**
	 * If matches, reacts to an HTML event.
	 * @param {HTMLEvent} htmlEvent
	 * @returns {Bool} A flag, false means the event can be propagate to other handlers; value other than false will stop the propagatation.
	 */
	reactTo: function(htmlEvent)
	{
		var result = false;
		var matcher = this.getEventMatcher();
		if (matcher)
		{
			result = matcher.match(htmlEvent);
			if (result)
			{
				var execTarget = this.getExecTarget();
				if (execTarget)
					result = matcher.doExecTarget(htmlEvent, execTarget);
				result = result && this.getExclusive();

				this.invokeEvent('execute', {'htmlEvent': htmlEvent, 'execTarget': execTarget});
			}
		}
		return result;
	}
});

/**
 * A special util class to dispatch HTML event to registered HTML event responsers.
 * @class
 * @augments ObjectEx
 */
Kekule.Widget.HtmlEventDispatcher = Class.create(ObjectEx,
/** @lends Kekule.Widget.HtmlEventDispatcher# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.HtmlEventDispatcher',
	/** @constructs */
	initialize: function()
	{
		this.setPropStoreFieldValue('responsers', {});
		this.tryApplySuper('initialize', []);
	},
	/** @private */
	initProperties: function()
	{
		// a hash map of all registered event handlers
		this.defineProp('responsers', {
			'dataType': DataType.HASH,
			'scope': Class.PropertyScope.PRIVATE,
			'serializable': false,
			'setter': null
		});
	},
	/** @ignore */
	doFinalize: function()
	{
		// free all registered handlers
		var responsers = this.getResponsers();
		var evTypes = Object.getOwnPropertyNames(responsers);
		for (var i = 0, ii = evTypes.length; i < ii; ++i)
		{
			var subItems = responsers[evTypes[i]];
			if (subItems && subItems.length)
			{
				for (var j = subItems.length - 1; j >= 0; --j)
				{
					subItems[j].finalize();
				}
			}
		}
		this.tryApplySuper('doFinalize');
	},
	/**
	 * Returns all registered handlers for an event type.
	 * @param {String} eventType
	 * @param {Bool} canCreateArray
	 * @private
	 */
	getResponsersForType: function(eventType, canCreateArray)
	{
		var subItems = this.getResponsers()[eventType];
		if (!subItems)
		{
			subItems = [];
			this.getResponsers()[eventType] = subItems;
		}
		return subItems;
	},
	/**
	 * Register an event responser.
	 * @param {Kekulw.Widget.HtmlEventResponser} handler
	 */
	registerResponser: function(responsers)
	{
		var evType = responsers.getEventType();
		if (evType)  // bypass the ones without explicit event type
		{
			var subItems = this.getResponsersForType(evType, true);
			AU.pushUnique(subItems, responsers);
		}
	},
	/**
	 * Unregister an event responser.
	 * @param {Kekulw.Widget.HtmlEventResponser} responsers
	 * @param {Bool} doFinalize If true, the unregistered handler will also be finalized.
	 */
	unregisterResponser: function(responsers, doFinalize)
	{
		var evType = responsers.getEventType();
		if (evType)  // bypass the ones without explicit event type
		{
			var subItems = this.getResponsersForType(evType);
			if (subItems && subItems.length)
			{
				var index = subItems.indexOf(responsers);
				if (index >= 0)
				{
					subItems.splice(index, 1);
					if (doFinalize)
						responsers.finalize();
				}
			}
		}
	},
	/**
	 * Create and register a new event responser.
	 * @param {Kekule.Widget.HtmlEventMatcher} eventMatcher
	 * @param {Variant} execTarget
	 * @param {Bool} exclusive
	 * @returns {Kekulw.Widget.HtmlEventResponser}
	 */
	addResponser: function(eventMatcher, execTarget, exclusive)
	{
		var r = new Kekule.Widget.HtmlEventResponser(eventMatcher, execTarget, exclusive);
		this.registerResponser(r);
		return r;
	},
	/**
	 * Dispatch an HTML event, find suitable handlers reacting to it.
	 * @param {HTMLEvent} event
	 */
	dispatch: function(event)
	{
		var evType = (event.getType && event.getType()) || event.type;
		if (evType)
		{
			var subItems = this.getResponsersForType(evType);
			if (subItems && subItems.length)
			{
				for (var i = subItems.length - 1; i >= 0; --i)  // dispatch from the newer to older
				{
					var responser = subItems[i];
					var exclusive = responser.reactTo(event);
					if (!!exclusive || event.cancelBubble)  // a exclusive handler, stop propagation
						break;
				}
			}
		}
	}
});

})();