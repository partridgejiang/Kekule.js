/**
 * @fileoverview
 * Base file of kekule XBrowser lib.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * require /core/kekule.root.js
 * require /utils/kekule.utils.js
 * require /utils/kekule.domUtils.js
 */

(function ($root)
{

"use strict";

if (typeof(window) !== 'undefined')  // has window object
	$root = window;

var	win = $root, document = win && win.document;

if (typeof(Kekule) === 'undefined')
	Kekule = {};

if (typeof(window) === 'undefined' || typeof(navigator) === "undefined")   // not in browser environment, node.js?, in latest node version (24), navigator object has been implemented, so here we use double check
{
	Kekule.Browser = {};
	Kekule.BrowserFeature = {};
}
else
{     // start of browser detect part

/**
 * Browser Check.
 * @class
 */
Kekule.Browser = {
	IE:     !!(win.attachEvent && !win.opera),
  Opera:  !!win.opera,
  WebKit: navigator.userAgent.indexOf('AppleWebKit/') > -1,
  Gecko:  navigator.userAgent.indexOf('Gecko') > -1 && navigator.userAgent.indexOf('like Gecko') < 0 && navigator.userAgent.indexOf('KHTML') == -1,
  MobileSafari: !!navigator.userAgent.match(/Apple.*Mobile.*Safari/),
	language: navigator.language || navigator.browserLanguage  // language of broweser
};
Kekule.Browser.IEVersion = Kekule.Browser.IE && (function(){
	var agent = navigator.userAgent.toLowerCase();
	return (agent.indexOf('msie') !== -1) ? parseInt(agent.split('msie')[1]) : false
})();

/**
 * Browser HTML5 feature check.
 * Code copy from https://github.com/mrdoob/three.js/blob/master/examples/js/Detector.js
 * @class
 */
Kekule.BrowserFeature = {
	typedArray: (typeof(ArrayBuffer) !== 'undefined'),
	svg: !!win.SVGSVGElement,
	canvas: !! win.CanvasRenderingContext2D,
	webgl: (function()
	{
		//if (Kekule.BrowserFeature.webgl === undefined)
		{
			var result =
				(function()
				{
					try
					{
						var canvas = document.createElement('canvas');
						return !!win.WebGLRenderingContext && ( canvas.getContext('webgl') || canvas.getContext('experimental-webgl') );
					}
					catch (e)
					{
						return false;
					}
				})();
			//Kekule.BrowserFeature.webgl = result;
		}
		//return Kekule.BrowserFeature.webgl;
		return !!result;
	})(),
	htmlTemplate: !!win.HTMLTemplateElement,
	htmlSlot: !!win.HTMLSlotElement,
	downloadHref: (function(doc){ return 'download' in doc.createElement('a')})(document),
	blob: !!win.Blob,
	workers: !! win.Worker,
	fileapi: !!(win.File && win.FileReader && win.FileList && win.Blob),
	sessionStorage: (function() { try { return !!win.sessionStorage} catch(e) { return false} })(),  // directly call session storage locally on Firefox now will cause exception
	localStorage: (function() { try { return !!win.localStorage} catch(e) { return false} })(),  // !!win.localStorage,
	cssTransition: (function(s) {
		return 'transition' in s || 'WebkitTransition' in s || 'MozTransition' in s || 'msTransition' in s || 'OTransition' in s;
	})(document.createElement('div').style),
	cssTranform: (function(s) {
		return 'transform' in s || 'WebkitTransform' in s || 'MozTransform' in s || 'msTransform' in s || 'OTransform' in s;
	})(document.createElement('div').style),
	cssFlex: (function(s) {
		return 'flex' in s || 'WebkitFlex' in s || 'MozFlex' in s || 'msFlex' in s || 'OFlex' in s;
	})(document.createElement('div').style),
	cssGrid: (function(s) {
		return 'grid' in s || 'WebkitGrid' in s || 'MozGrid' in s || 'msGrid' in s || 'OGrid' in s;
	})(document.createElement('div').style),
	html5Form: {
		placeholder: (function(elem){ return 'placeholder' in elem; })(document.createElement('input')),
		supportType: function(typeName)
			{
				var elem = document.createElement('input');
				elem.setAttribute('type', typeName);
				var result = elem.type === typeName;
				var textTypes = ['text', 'url', 'search'];
				if (result && (textTypes.indexOf(typeName.toLowerCase()) < 0))
				{
					var testValue = ':)';
					elem.value = testValue;
					result = elem.value !== testValue;
				}
				return result;
			}
	},
	mutationObserver: win.MutationObserver || win.MozMutationObserver || win.WebkitMutationObserver,
	resizeObserver: !!win.ResizeObserver,
	touchEvent: !!win.touchEvent,
	pointerEvent: !!win.PointerEvent,
	draggable: (function() {
		var div = document.createElement('div');
		return ('draggable' in div) || ('ondragstart' in div && 'ondrop' in div);
	})(),

	webAssembly: (typeof(win.WebAssembly) === 'object' && typeof(win.WebAssembly.instantiate) === 'function')
};

}   // end of browser detect part


// polyfill of requestAnimationFrame / cancelAnimationFrame
(function() {
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for(var x = 0; x < vendors.length && !win.requestAnimationFrame; ++x) {
		win.requestAnimationFrame = win[vendors[x]+'RequestAnimationFrame'];
		win.cancelAnimationFrame = win[vendors[x]+'CancelAnimationFrame']
				|| win[vendors[x]+'CancelRequestAnimationFrame'];
	}

	if (!win.requestAnimationFrame)
		win.requestAnimationFrame = function(callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = win.setTimeout(function() { callback(currTime + timeToCall); },
					timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};

	if (!win.cancelAnimationFrame)
		win.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};
}());


/**
 * Namespace for XBrowser lib.
 * @namespace
 */
Kekule.X = {};

/** @ignore */
var X = Kekule.X;
var isUnset = function(o)
	{
		return ((o === null) || (typeof(o) === 'undefined'));
	};
var notUnset = function(o)
	{
		return !isUnset(o);
	};
var isElemPositioned = function(element)
	{
		var pos = win.getComputedStyle? win.getComputedStyle(element, null).position:
			element.currentStyle? element.currentStyle.position: null;
		if (!pos)
			return false;
		else
		{
			if (!pos)
				return false;
			else
			{
				//console.log('position', pos.toString());
				pos = pos.toString().toLowerCase();
				return (pos === 'relative') || (pos === 'absolute');
			}
		}
	};

/////////////////////////////////////////////////////////////
//   DOM mutation observer
/////////////////////////////////////////////////////////////
X.MutationObserver = win.MutationObserver || win.MozMutationObserver || win.WebkitMutationObserver;

/////////////////////////////////////////////////////////////
//   Cross browser event handling supporting
/////////////////////////////////////////////////////////////

/**
 * Implementation of cross browser event handling.
 * @class
 */
X.Event = {
	/** @lends Kekule.X.Event */
	// Constants about event argument
	/** @deprecated */
	MOUSE_BTN_LEFT: 0,
	/** @deprecated */
	MOUSE_BTN_RIGHT: 2,
	/** @deprecated */
	MOUSE_BTN_MID: 1,
	/** @deprecated */
	MOUSE_BTN_LR: 3
};

/**
 * A serials of constants of pointer types.
 */
X.Event.PointerType = {
	MOUSE: 'mouse',
	TOUCH: 'touch',
	PEN: 'pen'
};

/**
 * A serials of constants of mouse button flags.
 */
X.Event.MouseButton = {
	LEFT: 0,
	RIGHT: 2,
	MID: 1,
	LR: 3
};

/**
 * A serials of constants of key codes
 */
X.Event.KeyCode = {
	BACKSPACE: 8,
	TAB: 9,
	CLEAR: 12,
	ENTER: 13,
	SHIFT: 16,
	CTRL: 17,
	ALT: 18,
	PAUSE: 19,
	CAPSLOCK: 20,
	ESC: 27,
	SPACE: 32,
	PAGEUP: 33,
	PAGEDOWN: 34,
	END: 35,
	HOME: 36,
	LEFT: 37,
	UP: 38,
	RIGHT: 39,
	DOWN: 40,
	PRTSC: 44,  // print screen
	INS: 45,
	DEL: 46,
	F1: 112,
	F2: 113,
	F3: 114,
	F4: 115,
	F5: 116,
	F6: 117,
	F7: 118,
	F8: 119,
	F9: 120,
	F10: 121,
	F11: 122,
	F12: 123,
	NUMLOCK: 144,
	SCROLLLOCK: 145
};

/**
 * Check if a event type is supported by browser.
 * Code is borrowed from http://www.htmlgoodies.com/html5/javascript/detecting-browser-event-support.html#fbid=WOHkKIQwoce
 * @param {String} eventName
 * @returns {Bool}
 */
X.Event.isSupported = (function()
{
	var cache = {};

	return function(eventName) {
		if (eventName.indexOf('touch') === 0)  // touch events
			return Kekule.BrowserFeature.touchEvent;
		if (eventName.indexOf('pointer') === 0)  // pointer events
			return Kekule.BrowserFeature.pointerEvent;

		var TAGNAMES = {
				'select': 'input',
				'change': 'input',
				'submit': 'form',
				'reset' : 'form',
				'error' : 'img',
				'load'  : 'img',
				'abort' : 'img',
				'unload': 'win',
				'resize': 'win'
			},
			shortEventName = eventName.replace(/^on/, '');
		if(cache[shortEventName]) { return cache[shortEventName]; }
		var elt = TAGNAMES[shortEventName] == 'win'
			? win
			: document.createElement(TAGNAMES[shortEventName] || 'div');
		eventName = 'on'+shortEventName;
		var eventIsSupported = (eventName in elt);
		if (!eventIsSupported) {
			elt.setAttribute(eventName, 'return;');
			eventIsSupported = typeof elt[eventName] == 'function';
		}
		elt = null;
		cache[shortEventName] = eventIsSupported;
		return eventIsSupported;
	};
})();

X.Event.Methods = {
	/** @lends Kekule.X.Event */
	// methods to get general event information
	/**
	 * Get event.type string.
	 * @param {Object} event
	 * @returns {String}
	 */
	getType: function(event)
	{
		return event.__$type__ || event.type;
	},
	/** @ignore */
	setType: function(event, value)
	{
		event.__$type__ = value;
		try
		{
			event.type = value;
		}
		catch(e)
		{

		}
	},
	getPointerType: function(event)
	{
		return event.pointerType;
	},
	/**
	 * Get event.target element.
	 * @param {Object} event
	 * @returns {Object}
	 */
	getTarget: function(event)
	{
		var target = event.__$target__ || event.target || event.srcElement;
		if (target.nodeType == 3) // defeat Safari bug
			target = target.parentNode;
		return target;
	},
	/**
	 * Some times we may need to overwrite the target of event (e.g., in mapping touch event to pointer).
	 * Writing directly to event.target often does not change the actual value, so we use a special field to store it.
	 * @param {Object} event
	 */
	setTarget: function(event, newTarget)
	{
		event.__$target__ = newTarget;
		try
		{
			event.target = newTarget;
		}
		catch(e)
		{

		}
	},
	/*
	 * Get event.currTarget element.
	 * @param {Object} event
	 * @returns {Object}
	 */
	/*
	getCurrTarget: function(event)
	{
		return event.currentTarget;
	},
	*/
	/**
	 * Get event.currTarget element.
	 * @param {Object} event
	 * @returns {Object}
	 */
	getCurrentTarget: function(event)
	{
		return event.currentTarget;
	},
	/**
	 * Get event.eventPhase.
	 * @param {Object} event
	 * @returns {Int}
	 */
	getEventPhase: function(event)
	{
		return event.eventPhase;
	},
	// methods to get mouse/key event information
	/**
	 * Get event.altKey.
	 * @param {Object} event
	 * @returns {Bool}
	 */
	getAltKey: function(event)
	{
		return event.altKey;
	},
	/**
	 * Get event.ctrlKey.
	 * @param {Object} event
	 * @returns {Bool}
	 */
	getCtrlKey: function(event)
	{
		return event.ctrlKey;
	},
	/**
	 * Get event.shiftKey.
	 * @param {Object} event
	 * @returns {Bool}
	 */
	getShiftKey: function(event)
	{
		return event.shiftKey;
	},
	/**
	 * Get event.mataKey.
	 * @param {Object} event
	 * @returns {Bool}
	 */
	getMetaKey: function(event)
	{
		return event.metaKey;
	},
	/**
	 * Get event.repeat (key down repeat flag).
	 * @param {Object} event
	 * @returns {Bool}
	 */
	getRepeat: function(event)
	{
		return event.repeat;
	},
	/**
	 * Get event.charCode.
	 * @param {Object} event
	 * @returns {Int}
	 */
	getCharCode: function(event)
	{
		// TODO: too rough, need further development
		// ref: http://www.quirksmode.org/js/keys.html
		return notUnset(event.charCode)? event.charCode: event.keyCode;
	},
	/**
	 * Get event.keyCode.
	 * @param {Object} event
	 * @returns {Int}
	 */
	getKeyCode: function(event)
	{
		// TODO: too rough, need further development
		// ref: http://www.quirksmode.org/js/keys.html
		return event.keyCode;
	},
	/**
	 * Get event.key.
	 * @param {Object} event
	 * @returns {Bool}
	 */
	getKey: function(event)
	{
		return event.key;
	},
	/**
	 * Get event.code.
	 * @param {Object} event
	 * @returns {Bool}
	 */
	getCode: function(event)
	{
		return event.code;
	},
	/**
	 * Get event.clientX.
	 * @param {Object} event
	 * @returns {Int}
	 */
	getClientX: function(event)
	{
		var result;
		if (event.touches)  // touch event
		{
			var touch = event.touches[0];
			result = touch && touch.clientX;
		}
		if (result === undefined)
			result = event.clientX;
		return result;
	},
	/**
	 * Get event.clientY.
	 * @param {Object} event
	 * @returns {Int}
	 */
	getClientY: function(event)
	{
		var result;
		if (event.touches)  // touch event
		{
			var touch = event.touches[0];
			result = touch && touch.clientY;
		}
		if (result === undefined)
			result = event.clientY;
		return result;
	},
	/**
	 * Get event.screenX.
	 * @param {Object} event
	 * @returns {Int}
	 */
	getScreenX: function(event)
	{
		var result;
		if (event.touches)  // touch event
		{
			var touch = event.touches[0];
			result = touch && touch.screenX;
		}
		if (result === undefined)
			result = event.screenX;
		return result;
	},
	/**
	 * Get event.screenY.
	 * @param {Object} event
	 * @returns {Int}
	 */
	getScreenY: function(event)
	{
		var result;
		if (event.touches)  // touch event
		{
			var touch = event.touches[0];
			result = touch && touch.screenY;
		}
		if (result === undefined)
			result = event.screenY;
		return result;
	},
	/**
	 * Get X coordinate related to document page.
	 * @param {Object} event
	 * @returns {Int}
	 */
	getPageX: function(event)
	{
		var result;
		if (event.touches)
		{
			var touch = event.touches[0];
			if (touch && notUnset(touch.pageX))
				result = touch.pageX;
		}
		if (result === undefined && notUnset(event.pageX))  // touchmove event may still has pageX/Y property, so check this afterward
			result = event.pageX;
		//else  // fallback
		if (result === undefined)
		{
			var doc = X.Event.getTarget(event).ownerDocument || X.Event.getTarget(event);
			var body = doc? doc.body: null;
			result = X.Event.getClientX(event) +  (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft  || body && body.clientLeft || 0);
		}
		return result;
	},
	/**
	 * Get Y coordinate related to document page.
	 * @param {Object} event
	 * @returns {Int}
	 */
	getPageY: function(event)
	{
		var result;
		if (event.touches)
		{
			var touch = event.touches[0];
			if (touch && notUnset(touch.pageY))
				return touch.pageY;
		}
		else if (result === undefined && notUnset(event.pageY))
			return event.pageY;
		if (result === undefined)  // fallback
		{
			var doc = X.Event.getTarget(event).ownerDocument || X.Event.getTarget(event);
			var body = doc? doc.body: null;
			result = X.Event.getClientY(event) +  (doc && doc.scrollTop  ||  body && body.scrollTop  || 0) - (doc && doc.clientTop  || body && body.clientTop  || 0);
		}
		return result;
	},
	/**
	 * Returns the mouse X coordinates relative to the event's target.
	 * @param {Object} event
	 * @returns {Int}
	 */
	getOffsetX: function(event)
	{
		if (notUnset(event.offsetX))
			return event.offsetX;
		else // Gecko
		{
			var elem = X.Event.getTarget(event);
			if ((elem.defaultView || elem.parentWindow) && elem.body)  // is document
				elem = elem.body;
			if (notUnset(event.layerX) && isElemPositioned(elem) && !event.touches) // check if target is a relative or absolute element, if so layerX ~= offsetX
			{
				return event.layerX;
			}
			else
			{
				var clientX = X.Event.getClientX(event);
				//return Math.round(clientX - elem.getBoundingClientRect().left);
				return Math.round(clientX - Kekule.HtmlElementUtils.getElemPagePos(elem, true).x);
			}
		}
	},
	/**
	 * Returns the mouse Y coordinates relative to the event's target.
	 * @param {Object} event
	 * @returns {Int}
	 */
	getOffsetY: function(event)
	{
		if (notUnset(event.offsetY))
			return event.offsetY;
		else // Gecko
		{
			var elem = X.Event.getTarget(event);
			if ((elem.defaultView || elem.parentWindow) && elem.body)  // is document
				elem = elem.body;
			if (notUnset(event.layerY) && isElemPositioned(elem) && !event.touches) // check if target is a relative or absolute element, if so layerX ~= offsetX
			{
				return event.layerY;
			}
			else
			{
				var clientY = X.Event.getClientY(event);
				//return Math.round(clientY - elem.getBoundingClientRect().top);
				return Math.round(clientY - Kekule.HtmlElementUtils.getElemPagePos(elem, true).y);
			}
		}
	},
	/**
	 * Returns x/y coord of event.
	 * @param {Object} event
	 * @param {Bool} considerCssTransform
	 */
	getOffsetCoord: function(event, considerCssTransform)
	{
		var elem = X.Event.getTarget(event);
		var transformMatrix;
		if (considerCssTransform && Kekule.ObjUtils.isUnset(event.offsetX)) // has no native offsetX, may need calculation
		{
			transformMatrix = Kekule.StyleUtils.getTotalTransformMatrix(elem);
		}
		if (transformMatrix)   // elem has transform, calculate
		{
			// calculation
			var clientX = X.Event.getClientX(event);
			var clientY = X.Event.getClientY(event);
			var coord = {
				x: clientX - Kekule.HtmlElementUtils.getElemBoundingClientRect(elem).x,
				y: clientY - Kekule.HtmlElementUtils.getElemBoundingClientRect(elem).y
			};
			var invertMatrix = Kekule.StyleUtils.calcInvertTransformMatrix(transformMatrix);
			if (invertMatrix)
			{
				var vector = Kekule.MatrixUtils.create(3, 1);
				vector[0][0] = coord.x;
				vector[1][0] = coord.y;
				vector[2][0] = 1;
				var result = Kekule.MatrixUtils.multiply(invertMatrix, vector);
				coord.x = result[0][0];
				coord.y = result[1][0];
				return coord;
			}
		}
		// when calculation fails or has no transform
		return {'x': X.Event.getOffsetX(event), 'y': X.Event.getOffsetY(event)};
	},
	/**
	 * Returns the mouse X coordinates relative to the top-left of window.
	 * @param {Object} event
	 * @returns {Int}
	 */
	getWindowX: function(event)
	{
		var x = X.Event.getPageX(event);
		var doc = event.target.ownerDocument || event.target;
		var win = doc && (doc.defaultView || doc.parentWindow);
		var delta = (win && win.scrollX) || 0;
		return x - delta;
	},
	/**
	 * Returns the mouse Y coordinates relative to the top-left of window.
	 * @param {Object} event
	 * @returns {Int}
	 */
	getWindowY: function(event)
	{
		var y = X.Event.getPageY(event);
		var doc = event.target.ownerDocument || event.target;
		var win = doc && (doc.defaultView || doc.parentWindow);
		var delta = (win && win.scrollY) || 0;
		return y - delta;
	},
	/**
	 * Returns the mouse X coordinates relative to the event's currTarget.
	 * @param {Object} event
	 * @returns {Int}
	 */
	getRelXToCurrTarget: function(event)
	{
		var elem = X.Event.getCurrentTarget(event);
		if ((elem.defaultView || elem.parentWindow) && elem.body)  // is document
			elem = elem.body;
		var clientX = X.Event.getClientX(event);
		//return Math.round(clientX - elem.getBoundingClientRect().left);
		return Math.round(clientX - Kekule.HtmlElementUtils.getElemPagePos(elem, true).left);
	},
	/**
	 * Returns the mouse Y coordinates relative to the event's currTarget.
	 * @param {Object} event
	 * @returns {Int}
	 */
	getRelYToCurrTarget: function(event)
	{
		var elem = X.Event.getCurrentTarget(event);
		if ((elem.defaultView || elem.parentWindow) && elem.body)  // is document
			elem = elem.body;
		var clientY = X.Event.getClientY(event);
		//console.log('y', clientY, elem.getBoundingClientRect().top, elem.tagName);
		//return Math.round(clientY - elem.getBoundingClientRect().top);
		return Math.round(clientY - Kekule.HtmlElementUtils.getElemPagePos(elem, true).top);
	},
	/**
	 * Returns touches array of event in touch.
	 * @param {Object} event
	 * @returns {Array}
	 */
	getTouches: function(event)
	{
		return event.touches;
	}
};

/** @ignore */
X.Event._MouseEventEx = {
	isMouseEnterLeaveEvent: function(eventType)
	{
		return (eventType === 'mouseenter') || (eventType === 'mouseleave');
	},
	addMouseEnterLeaveListener: function(element, eventType, handler, useCapture)
	{
		var isSupported = ((eventType === 'mouseenter') && X.Event.isSupported('mouseenter'))
			|| ((eventType === 'mouseleave') && X.Event.isSupported('mouseleave'));

		//isSupported = false;  // debug
		if (isSupported)
			//return X.Event.addListener(element, eventType, handler, useCapture);  // recursion
			return element.addEventListener(eventType, handler, useCapture);  // IE support leave/enter event and has no extra code added, so we can use w3c method directly
		else
		{
			var wrapper = function(e)
			{
				var target = e.getTarget? e.getTarget(): e.target;
				var currTarget = e.getCurrentTarget? e.getCurrentTarget(): e.currentTarget;  // is actually element
				if ((target === currTarget) || (Kekule.DomUtils.isDescendantOf(target, currTarget)))  // raised by self or child, all ok
				{
					var related = e.getRelatedTarget? e.getRelatedTarget(): e.relatedTarget;
					if ((!related)  // related not set, may move out of window
						|| (!Kekule.DomUtils.isDescendantOf(related, currTarget)))  // and not cross to child element
					{
						/*
						if (eventType === 'mouseleave')
							console.log('wrapper', eventType, target, related, currTarget);
						*/
						//debug
						/*
						if (currTarget && currTarget.style)
							currTarget.style.backgroundColor = 'red';

						console.log('LEAVE');
						*/

						// use a new event object, avoid overwrite the original mouseover/mouseout infos
						var event = new MouseEvent(eventType, {
							'view': win,
							'bubbles': false,
							'cancelable': true,
							'target': currTarget,
							'currentTarget': currTarget,
							'relatedTarget': related
						});
						//e.__$type__ = eventType;
						handler.call(currTarget, event);

						//e.stopPropagation();

						/*
						// fire a custom mouseleave event

						currTarget.dispatchEvent(event);
						console.log('fire: ', eventType);
						*/
					}
					/*
					// debug
					else
					{
						if (currTarget && currTarget.style)
							currTarget.style.backgroundColor = 'yellow';
					}
          */
				}
			};
			handler.__$mouseExListenerWrapper__ = wrapper;
			var newType = (eventType === 'mouseenter')? 'mouseover': 'mouseout';
			//return X.Event.addListener(element, newType, wrapper, useCapture);
			return element.addEventListener(newType, wrapper, useCapture);
		}
	},
	removeMouseEnterLeaveListener: function(element, eventType, handler)
	{
		var isSupported = ((eventType === 'mouseenter') && X.Event.isSupported('mouseenter'))
			|| ((eventType === 'mouseleave') && X.Event.isSupported('mouseleave'));
		if (isSupported)
			//return Kekule.X.Event.removeListener(element, eventType, handler);
			return element.removeEventListener(eventType, handler);  // IE support leave/enter event and has no extra code added, so we can use w3c method directly
		else
		{
			var newType = (eventType === 'mouseenter')? 'mouseover': 'mouseout';
			//return X.Event.removeListener(element, newType, handler.__$listenerWrapper__ || handler);
			return element.removeEventListener(newType, handler.__$mouseExListenerWrapper__ || handler);
		}
	}
};

X.Event._W3C =
/** @lends Kekule.X.Event */
{
	/**
	 * Add an event listener to element.
	 * @param {Object} element HTML element.
	 * @param {String} eventType W3C name of event, such as 'click'.
	 * @param {Function} handler Event handler.
	 * @param {Hash} options Listener options. IE (attachEvent) will ignore this paramter.
	 */
	addListener: function(element, eventType, handler, options)
	{
		if (X.Event._MouseEventEx.isMouseEnterLeaveEvent(eventType))
			return X.Event._MouseEventEx.addMouseEnterLeaveListener(element, eventType, handler, options);
		else
			return element.addEventListener(eventType, handler, options);
	},
	/**
	 * Remove an event listener from element.
	 * @param {Object} element HTML element.
	 * @param {String} eventType W3C name of event, such as 'click'.
	 * @param {Function} handler Event handler.
	 * @param {Bool} options Listener options. IE (attachEvent) will ignore this paramter.
	 */
	removeListener: function(element, eventType, handler, options)
	{
		if (X.Event._MouseEventEx.isMouseEnterLeaveEvent(eventType) && handler.__$listenerWrapper__)
			return X.Event._MouseEventEx.removeMouseEnterLeaveListener(element, eventType, handler.__$listenerWrapper__);
		else
			return element.removeEventListener(eventType, handler, options);
	},
	/**
	 * Stop the propagation of event.
	 * @param {Object} event
	 */
	stopPropagation: function(event)
	{
		event.stopPropagation();
	},
	/**
	 * Prevents the default action for the event.
	 * @param {Object} event
	 */
	preventDefault: function(event)
	{
		event.preventDefault();
	}
};

/** @ignore */
X.Event._W3CMethods = {
	/** @lends Kekule.X.Event */
	/**
	 * Get event.relatedTarget element.
	 * @param {Object} event
	 * @returns {Object}
	 */
	getRelatedTarget: function(event)
	{
		return event.relatedTarget;
	},
	// methods to get mouse event information
	/**
	 * Get event.button.
	 * @param {Object} event
	 * @returns {Int}
	 */
	getButton: function(event)
	{
		return event.button;
	}
};

/** @ignore */
X.Event._Gecko = {
	addListener: function(element, eventType, handler, useCapture)
	{
		if (X.Event._MouseEventEx.isMouseEnterLeaveEvent(eventType))
		{
			return X.Event._MouseEventEx.addMouseEnterLeaveListener(element, eventType, handler, useCapture);
		}

		if ((eventType === 'mousewheel'))
		{
			var wrapper = function(e)
				{
					//var e = Object.extend({}, evt);  // must create a new object, otherwise e.type can not be changed
					//e.prototype = evt.prototype;
					// change DOMMouseScroll detail to delta
					e.wheelDeltaY = e.wheelDelta = -e.detail * 40;  // detail usually be 3 while delta be 120, direction is opposed
					e.__$type__ = 'mousewheel';  // e.type can not be changed, so use another field to save the new type
					handler.call(element, e);
				};
			handler.__$mousewheelListenerWrapper__ = wrapper;
			element.addEventListener('DOMMouseScroll', wrapper, useCapture);
		}
		else
			element.addEventListener(eventType, handler, useCapture);
	},
	removeListener: function(element, eventType, handler, useCapture)
	{
		if ((eventType === 'mousewheel') && handler.__$mousewheelListenerWrapper__)
			element.removeEventListener('DOMMouseScroll', handler.__$mousewheelListenerWrapper__, useCapture);
		else
			element.removeEventListener(eventType, handler, useCapture);
	}
};

/** @ignore */
X.Event._IE = {
	/** @private */
	_handlers: {},  // store all registered handlers
	/** @private */
	WIN_UNLOAD_FLAG_FIELD: '__$win_unload_linked__',
	addListener: function(element, eventType, handler, useCapture)
	{
		// Since IE support mouseenter/mouseleave from the beginning, need not to add extra X.Event._MouseEventEx code here

		//console.log('add event listener', eventType);
		if (X.Event.findHandlerIndex(element, eventType, handler) >= 0)  // already registered, exit
			return;

		var wrapper = (function(e)
			{
				if (!e)
					e = win.event;
				// add essential W3C fields
				e.currentTarget = element;
				e.eventPhase = (e.srcElement === element)? 2: 3;
				/*
				// wrap e as a W3C standard event arg
				var event = {
					_ieEvent: e,
					type: e.type,
					target: e.srcElement,
					currentTarget: element,
					relatedTarget: e.fromElement || e.toElement,
					eventPhase: (e.srcElement === element)? 2: 3,
					clientX: e.clientX,
					clientY: e.clientY,
					screenX: e.screenX,
					screenY: e.screenY,
					altKey: e.altKey,
					ctrlKey: e.ctrlKey,
					shiftKey: e.shiftKey,
					charCode: e.keyCode,
					// event management methods
					stopPropagation: function() { this._ieEvent.cancelBubble = true; },
					preventDefault: function() {this._ieEvent.returnValue = false; }
				};
				*/
				if (!hasEventPrototype)  // IE7, can not extend e by prototype
					Object.extend(e, eventObjMethods);

				handler.call(element, e);
			});
		// attach to element
		element.attachEvent(X.Event.getEventName(eventType), wrapper);
		// register handler
		X.Event.registerHandler(element, eventType, handler, wrapper);
		// observe window's unload event to avoid memory leak
		var doc = element.ownerDocument || element;  // element may be document or window directly
		var win = doc.parentWindow || doc;
		X.Event._linkUnloadEvent(win);
	},
	removeListener: function(element, eventType, handler, useCapture)
	{
		var index = X.Event.findHandlerIndex(element, eventType, handler);
		if (index >= 0)
		{
			var wrapper = X.Event._handlers[eventType][index].wrapper;
			element.detachEvent(X.Event.getEventName(eventType), wrapper);
			X.Event._handlers[eventType].splice(index, 1);  // unregister from list
		}
	},
	stopPropagation: function(event)
	{
		event.cancelBubble = true;
	},
	preventDefault: function(event)
	{
		event.returnValue = false;
	},
	removeAllListeners: function(doc)  // remove all listener in list. If doc is set, only handlers on element in doc will be removed
	{
		var allHandlers = X.Event._handlers;
		if (!allHandlers)
			return;
		for (var propName in allHandlers)
		{
			if (allHandlers.hasOwnProperty(propName))
			{
				var hs = allHandlers[propName];
				if (hs && hs.length)
				{
					var eventName = X.Event.getEventName(propName);
					for (var i = hs.length - 1; i >= 0; --i)
					{
						var h = hs[i];
						if ((!doc) || (h.element.ownerDocument === doc))
						{
							h.element.detachEvent(eventName, h.wrapper);
							hs.splice(i, 1);
						}
					}
				}
			}
		}
	},

	/** @private */
	getEventName: function(eventType)
	{
		return 'on' + eventType;
	},
	/** @private */
	registerHandler: function(element, eventType, handler, handlerWrapper)
	{
		var handlers = X.Event._handlers;
		if (!handlers[eventType])
			handlers[eventType] = [];
		var hs = handlers[eventType];
		hs.push({
			'element': element,
			'handler': handler,
			'wrapper': handlerWrapper
		});
	},
	/** @private */
	unregisterHandler: function(element, eventType, handler)
	{
		if (!handler[eventType])
			return;
		var hs = handler[eventType];
		var index = X.Event.findHandlerIndex(element, eventType, handler);
		if (index >= 0)
			hs.splice(index, 1);
	},
	/** @private */
	findHandlerIndex: function(element, eventType, handler)
	{
		var hs = X.Event._handlers[eventType];
		if (!hs)
			return -1;
		for (var i = 0, l = hs.length; i < l; ++i)
		{
			var h = hs[i];
			if ((h.element === element) && (h.handler === handler))
			{
				return i;
			}
		}
		return -1;
	},
	/** @private */
	_linkUnloadEvent: function(winObj)
	{
		var flag = X.Event.WIN_UNLOAD_FLAG_FIELD;
		if (winObj[flag])  // already linked
			return;
		else
		{
			winObj.attachEvent('onunload', X.Event.reactWinUnload);
			winObj[flag] = true;
		}
	},
	/** @private */
	reactWinUnload: function()
	{
		var doc = this.ownerDocument;  // this is window object in IE
		// detach all handlers to avoid memory leak in IE6
		X.Event.removeAllListeners(doc);
	}
};

/** @ignore */
X.Event._IEMethods = {
	getRelatedTarget: function(event)
	{
		var etype = event.type;
		if (['focusin', 'mouseenter', 'mouseover', 'pointerenter', 'pointerover', 'dragenter'].indexOf(etype) >= 0)
			return event.fromElement || event.toElement;
		else
			return event.toElement || event.fromElement;
	},
	// methods to get mouse event information
	getButton: function(event)
	{
		// in IE 5-8, button has different values to W3C
		switch (event.button)
		{
			case 1: return 0;  // left
			case 2: return 2;  // right
			case 4: return 1;  // middle
			case 3: return 3;  // left and right
			default: return event.button;
		}
	},
	stopPropagation: function(event)
	{
		event.cancelBubble = true;
	},
	preventDefault: function(event)
	{
		event.returnValue = false;
	}
};

if (document)
{
	if (document.addEventListener)  // W3C browser
	{
		X.Event = Object.extend(X.Event, X.Event._W3C);
		X.Event.Methods = Object.extend(X.Event.Methods, X.Event._W3CMethods);
		if (Kekule.Browser.Gecko)  // fix Firefox mousewheel event lacking
		{
			X.Event = Object.extend(X.Event, X.Event._Gecko);
		}
	}
	else if (document.attachEvent)  // IE 8
	{
		X.Event = Object.extend(X.Event, X.Event._IE);
		X.Event.Methods = Object.extend(X.Event.Methods, X.Event._IEMethods);
		if (win.Element)
		{
			var elemPrototype = win.Element.prototype;
			elemPrototype.addEventListener = X.Event.addListener.methodize();
			elemPrototype.removeEventListener = X.Event.removeListener.methodize();
		}
	}
}

Object.extend(X.Event, X.Event.Methods);
// insert new methods to Event class
var eproto = null;
if (win.Event)
	eproto = win.Event.prototype;
if (!eproto)
{
	if (document && document.createEvent)
		eproto = document.createEvent('HTMLEvents').__proto__;
}
var hasEventPrototype = !!eproto;
var eventObjMethods = {};
var methods = X.Event.Methods;
for (var name in methods)
{
	if (methods.hasOwnProperty(name) && (typeof(methods[name]) === 'function'))
	{
		eventObjMethods[name] = methods[name].methodize();
	}
}
if (eproto)  // IE7 can not get event prototype, sucks
{
	/*
	var methods = X.Event.Methods;
	for (name in methods)
	{
		if (methods.hasOwnProperty(name) && (typeof(methods[name]) === 'function'))
		{
			if (!eproto[name])
			{
				eproto[name] = methods[name].methodize();
			}
		}
	}
	*/
	Object.extend(eproto, eventObjMethods);
};


// enable drag draggable element in IE
(function(){
	if (typeof(document) !== 'undefined')
	{
		var div = document.createElement('div');
		var needPolyfill = !('draggable' in div) && ('ondragstart' in div && 'ondrop' in div);
		//var needPolyfill = !!Kekule.Browser.IE;
		if (needPolyfill)
		{
			Kekule.X.Event.addListener(document, 'selectstart', function(e){
				for (var el = e.target; el; el = el.parentNode) {
					if (el.attributes && el.attributes['draggable']) {
						e.preventDefault();
						if (e.stopImmediatePropagation)
							e.stopImmediatePropagation();
						else
							e.stopPropagation();
						el.dragDrop();
						return false;
					}
				}
			});
		}
	}
})();


/////////////////////////////////////////////////////////////
//   Cross browser AJAX supporting
/////////////////////////////////////////////////////////////

/**
 * Support of cross browser AJAX request.
 * Code borrowed from http://www.quirksmode.org/js/xmlhttp.html.
 *
 * User can do AJAX call by something like:
 *   Kekule.X.Ajax.sendRequest('file.txt', function(req, success)
 *     {
 *       if (success)
 *         alert(req.responseText);
 *     }
 *   );
 *
 * @class
 */
X.Ajax = {
	/** @private */
	XMLHttpFactories: [
		function () {return new XMLHttpRequest()},
		function () {return new ActiveXObject("Msxml2.XMLHTTP")},
		function () {return new ActiveXObject("Msxml3.XMLHTTP")},
		function () {return new ActiveXObject("Microsoft.XMLHTTP")}
	],
	/** @private */
	_availableFactoryIndex: -1,
	/** @private */
	createXMLHTTPObject: function()
	{
		var xmlhttp = false;
		var F = X.Ajax.XMLHttpFactories;
		var index = X.Ajax._availableFactoryIndex;
		if (index >= 0)
			xmlhttp = F[index]();
		else
		{
			for (var i = 0; i < F.length;i++) {
				try {
					xmlhttp = F[i]();
					X.Ajax._availableFactoryIndex = i;
				}
				catch (e) {
					continue;
				}
				break;
			}
		}
		return xmlhttp;
	},

	preparePostData: function(data)
	{
		var result = data;
		if (typeof(data) === 'object')  // HASH
		{
			result = Kekule.UrlUtils.generateSearchString(data);
		}
		return result;
	},

	/**
	 * Send an AJAX request to URL.
	 * @param {Hash} params The request params, may including the following fields:
	 *   {
	 *     callback: Call back function with params (data, requestObj, success),
	 *     url: string,
	 *     postData: Hash or string,
	 *     xhrProps: Hash, properties that overriding the default ones of XMLHttpRequest object.
	 *       e.g. {responseType, overwriteMimeType, withCredentials}.
	 *   }
	 * @returns {XMLHttpRequest}
	 */
	request: function(params)
	{
		return X.Ajax.sendRequest(params.url, params.callback, params.postData, params.xhrProps);
	},

	/**
	 * Send an AJAX request to URL.
	 * This method is deprecated, since the input  paramters are not well organized.
	 * Now user should use method {@link Kekule.X.Ajax.request} instead.
	 * @param {String} url
	 * @param {Function} callback Call back function with params (data, requestObj, success)
	 * @param {Array} postData Optional.
	 * //@param {String} responseType Value of responseType property of XMLHttpRequest(V2).
	 * //@param {String} overwriteMimeType Value to call overwriteMimeType method of XMLHttpRequest(V2).
	 * @param {Hash} xhrProps Property settings of XHR object, e.g. {withCredentials: true}.
	 * @deprecated
	 */
	sendRequest: function(url, callback, postData, responseTypeOrXhrProps, overwriteMimeType)
	{
		var isBinary = false;
		var supportResponseType = true;
		var req = X.Ajax.createXMLHTTPObject();
		if (!req) return;
		var method = (postData) ? "POST" : "GET";
		req.open(method, url, true);
		req.setRequestHeader('User-Agent','XMLHTTP/1.0');
		if (postData)
			req.setRequestHeader('Content-type','application/x-www-form-urlencoded');
		var responseType, xhrProps;
		if (responseTypeOrXhrProps)  // for backward compatible, here we check if the fourth param is a hash(xhrProps) or string (responseType)
		{
			if (typeof(responseTypeOrXhrProps) === 'object')
			{
				xhrProps = responseTypeOrXhrProps;
				responseType = xhrProps.responseType;
				overwriteMimeType = xhrProps.overwriteMimeType;  // overwriteMimeType is also set in xhrProps
			}
			else if (typeof(responseTypeOrXhrProps) === 'string')
				responseType = responseTypeOrXhrProps;
		}
		if (responseType)
		{
			try
			{
				req.responseType = responseType;
			}
			catch(e)
			{

			}
			if ((responseType === 'arraybuffer') || (responseType === 'blob'))
			  isBinary = true;
			if (req.responseType !== responseType)  // old fashion browser, do not support this feature
				supportResponseType = false;
		}
		if (isBinary && (!supportResponseType) && req.overwriteMimeType)
			req.overrideMimeType('text/plain; charset=x-user-defined');  // old browser, need to transform binary data by string
		if (overwriteMimeType && req.overwriteMimeType)
			req.overwriteMimeType(overwriteMimeType);
		if (xhrProps)
		{
			for (var key in xhrProps)
			{
				if (key in req)
				{
					try
					{
						req[key] = xhrProps[key];
					}
					catch(e)
					{

					}
				}
			}
		}
		req.onreadystatechange = function ()
			{
				if (req.readyState != 4) return;
				if (req.status != 200 && req.status != 304)
				{
					callback(null, req, false);
					throw 'HTTP error ' + req.status;
					return;
				}
				//console.log(req);
				// TODO: need to handle old fashion binary handling here
				callback(req.response || req.responseText, req, true);
			};
		if (req.readyState == 4) return;
		req.send(X.Ajax.preparePostData(postData));
		return req;
	},
	/**
	 * Retrieve response MIME type of an AJAX request object.
	 * @param {Object} request
	 */
	getResponseMimeType: function(request)
	{
		return request.getResponseHeader("content-type") || "";
	}
};

/**
 * Short cut of {@link Kekule.X.Ajax}.
 * @class
 */
Kekule.Ajax = Kekule.X.Ajax;

/////////////////////////////////////////////////////////////
//   Cross browser DOM ready event supporting
/////////////////////////////////////////////////////////////

// DOM ready support, the solution is copy from
// http://www.cnblogs.com/rubylouvre/archive/2009/12/30/1635645.html
/** @ignore */
Kekule.X.DomReady = {
	isReady: false,
	suspendFlag: 0,
	funcs: [],
	domReady: function(fn, doc)
	{
		if (!doc)
			doc = document;
		DOM.initReady(doc);//如果没有建成DOM树，则走第二步，存储起来一起杀
		if (!DOM.isReady)
		{
			var readyState = doc && doc.readyState;
			if (readyState === 'complete' || readyState === 'loaded'    // document already loaded, call fn directly
				|| (readyState === 'interactive' && !Kekule.Browser.IE))
			{
				DOM.isReady = true;
			}
			//console.log('[document ready state]', readyState, fn, fn.toString());
		}
    if (DOM.isReady)
    {
      fn();//如果已经建成DOM，则来一个杀一个
    }
    else
    {
      DOM.funcs.push(fn);//存储加载事件
    }
	},
	fireReady: function()
	{
    if (DOM.isReady)
    	return;
    DOM.isReady = true;
		/*
    for (var i = 0, l = DOM.funcs.length; i < l; ++i)
    {
      var fn = DOM.funcs[i];
      fn();
    }
    DOM.funcs.length = 0;//清空事件
    */
		DOM._execFuncs();
  },
	_execFuncs: function()
	{
		var funcs = DOM.funcs;
		if (funcs && funcs.length)
		{
			while (funcs.length && !DOM.isSuspending())
			{
				var fn = funcs.shift();
				if (fn)
					fn();
			}
		}
	},
  suspend: function()
  {
	  ++DOM.suspendFlag;
  },
	resume: function()
	{
		if (DOM.suspendFlag > 0)
			--DOM.suspendFlag;
		if (!DOM.isSuspending())
		{
			DOM._execFuncs();
		}
	},
	isSuspending: function()
	{
		return DOM.suspendFlag > 0;
	},
  initReady: function initReady(doc)
  {
  	if (!doc)
  		doc = document;
    if (doc && doc.addEventListener) {
	    doc.addEventListener( "DOMContentLoaded", function(){
		    doc.removeEventListener( "DOMContentLoaded", initReady /*arguments.callee*/, false );//清除加载函数
        DOM.fireReady();
      }, false);
    }
    else
    {
      if (doc && doc.getElementById) {
	      doc.write('<script id="ie-domReady" defer="defer" src="\//:"><\/script>');
	      doc.getElementById("ie-domReady").onreadystatechange = function() {
          if (this.readyState === "complete") {
            DOM.fireReady();
            this.onreadystatechange = null;
            this.parentNode.removeChild(this)
          }
        };
      }
    }
  }
};

/** @ignore */
var DOM = Kekule.X.DomReady;
/**
 * Invoke when page DOM is loaded.
 * @param {Func} fn Callback function.
 * @function
 */
Kekule.X.domReady = DOM.domReady;

})(this);
