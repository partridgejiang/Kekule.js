/**
 * @fileoverview
 * Util classe and function for keyboard events of widget.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /utils/kekule.utils.js
 * requires /utils/kekule.domUtils.js
 * requires /xbrowsers/kekule.x.js
 * requires /widget/kekule.widget.root.js
 * requires /widget/kekule.widget.events.js
 */

(function(){

"use strict";

var OU = Kekule.ObjUtils;

/**
 * A util class containing functions about key events.
 * @class
 */
Kekule.Widget.KeyboardUtils = {
	DEF_COMBINATION_KEY_DELIMITER: '+',
	/** @private */
	_initShiftKeyMap: function()
	{
		var keyPairs = [
			['`', '~'],
			['1', '!'],
			['2', '@'],
			['3', '#'],
			['4', '$'],
			['5', '%'],
			['6', '^'],
			['7', '&'],
			['8', '*'],
			['9', '('],
			['0', ')'],
			['-', '_'],
			['=', '+'],
			['[', '{'],
			[']', '}'],
			[';', ':'],
			['\'', '\"'],
			['\\', '|'],
			[',', '<'],
			['.', '>'],
			['/', '?']
		];
		var map = {};
		for (var i = 0, l = keyPairs.length; i < l; ++i)
		{
			map[keyPairs[i][0]] = keyPairs[i][1];
			map[keyPairs[i][1]] = keyPairs[i][0];
		}
		return map;
	},
	/**
	 * Returns the shifted char of a keyboard key.
	 * @param {Char} key
	 * @returns {Char}
	 */
	getShiftedKey: function(key)
	{
		var c = key.charAt(0);  // ensure the first char
		if (c >= 'a' && c <= 'z')
			return c.toUpperCase();
		else if (c >= 'A' && c <= 'Z')
			return c.toLowerCase();
		else
		{
			var shifted = Kekule.Widget.KeyboardUtils._shiftKeyMap[c];
			return shifted || c;
		}
	},
	/**
	 * Returns a key event params hash for a shorcut display label.
	 * @param {String} label
	 * @param {String} delimiter Char to combine keys.
	 * @param {Bool} strict
	 */
	shortcutLabelToKeyParams: function(label, delimiter, strict)
	{
		var delimiters = delimiter? [delimiter]: ['+', '-', '_'];  // possible delimiters
		var activePartCount = -1;
		var activeDelimiter;
		var activeParts;
		// find the delimiter that splits with most parts
		for (var i = 0, l = delimiters.length; i < l; ++i)
		{
			var d = delimiters[i];
			var parts = label.split(d);
			if (parts.length > activePartCount)
			{
				activeDelimiter = d;
				activePartCount = parts.length;
				activeParts = parts;
			}
		}
		var result = {}
		if (activePartCount <= 0)  // the label is actually a delimiter key
		{
			result.key = activeDelimiter;
		}
		else  // analysis each parts
		{
			for (var i = 0, l = activeParts.length; i < l; ++i)
			{
				var part = activeParts[i];
				if (!part && (i === l - 1))  // empty part on tail, should be the delimiter itself
					part = activeDelimiter;

				var lpart = part.toLowerCase();
				if (lpart === 'shift')
					result.shiftKey = true;
				else if (lpart === 'alt')
					result.altKey = true;
				else if (lpart === 'ctrl' || lpart === 'control')
					result.ctrlKey = true;
				else if (lpart === 'meta')
					result.metaKey = true;
				else   // not modifier, should be the main key
				{
					if (lpart === 'esc')
						result.key = 'Escape';
					else if (lpart === 'del')  // abbr
						result.key = 'Delete';
					else if (lpart === 'ins')
						result.key = 'Insert';
					else if (lpart === 'pgup')
						result.key = 'PageUp';
					else if (lpart === 'pgdown' || lpart === 'pgdn')
						result.key = 'PageDown';
					else
						result.key = part;
				}

				if (!result.key && i === l - 1)  // main key not found, all modifier keys? Tail part should be regarded as the main key
				{
					if (lpart === 'ctrl')
						result.key = 'Control';
					else
						result.key = part; //lpart.charAt(0).toUpperCase() + lpart.substr(1);
				}
			}
		}
		if (!strict && result.key)  // capitalize first char on non strict mode
			result.key = result.key.charAt(0).toUpperCase() + result.key.substr(1);
		return result;
	},
	/**
	 * Returns a shortcut display label for key event params.
	 * @param {Hash} param
	 * @param {String} delimiter Char to combine keys, default is '+'.
	 * @param {Bool} strict
	 */
	keyParamsToShortcutLabel: function(param, delimiter, strict)
	{
		if (!delimiter)
			delimiter = Kekule.Widget.KeyboardUtils.DEF_COMBINATION_KEY_DELIMITER;

		var labels = [];
		// modifiers
		if (param.ctrlKey)
			labels.push('Ctrl');
		if (param.altKey)
			labels.push('Alt');
		if (param.metaKey)
			labels.push('Meta');
		if (param.shiftKey)
			labels.push('Shift');

		// main key
		var mainKey = param.key;
		if (mainKey)
		{
			if (mainKey === 'Escape')
				mainKey = 'Esc';
			else if (mainKey === 'Insert')
				mainKey = 'Ins';
			else if (mainKey === 'Delete')
				mainKey = 'Del';
			else if (mainKey === 'Control')
				mainKey = 'Ctrl';
			if (!strict)
				mainKey = mainKey.charAt(0).toUpperCase() + mainKey.substr(1);

			var index = labels.indexOf(mainKey);
			if (index >= 0)  // main key is modifier, remove the one in labels
				labels.splice(index, 1);
			labels.push(mainKey);
		}
		return labels.join(delimiter);
	}
};
/** @ignore */
Kekule.Widget.KeyboardUtils._shiftKeyMap = Kekule.Widget.KeyboardUtils._initShiftKeyMap();


/**
 * A special class to handle shorcut keys in widget system.
 * @class
 * @augments Kekule.Widget.HtmlEventMatcher
 *
 * @property {String} key Test with event's key property.
 * @property {String} code Test with event's code property.
 * @property {Bool} shiftKey
 * @property {Bool} ctrlKey
 * @property {Bool} altKey
 * @property {Bool} metaKey
 * @property {Bool} repeat
 * @property {Bool} strictMatch If true, shift+key('a') will be regarded as different to shift+key('A').
 */
Kekule.Widget.HtmlKeyEventMatcher = Class.create(Kekule.Widget.HtmlEventMatcher,
/** @lends Kekule.Widget.HtmlKeyEventMatcher# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.HtmlKeyEventMatcher',
	/** @constructs */
	initialize: function(eventParams)
	{
		var eparams = Object.extend({'strictMatch': true}, eventParams);  // default do the strict match
		this.tryApplySuper('initialize', [eparams]);
	},
	/** @private */
	initProperties: function()
	{
		/*
		this._defineEventParamProp('key', DataType.STRING);
		this._defineEventParamProp('code', DataType.STRING);
		this._defineEventParamProp('shiftKey', DataType.BOOL);
		this._defineEventParamProp('ctrlKey', DataType.BOOL);
		this._defineEventParamProp('altKey', DataType.BOOL);
		this._defineEventParamProp('metaKey', DataType.BOOL);
		this._defineEventParamProp('repeat', DataType.BOOL);
		this._defineEventParamProp('strictMatch', DataType.BOOL);
		*/
		var propNames = Kekule.Widget.HtmlKeyEventMatcher.KEY_PARAM_PROPS;
		for (var i = 0, l = propNames.length; i < l; ++i)
		{
			var propType = (propNames[i] === 'key' || propNames[i] === 'code')? DataType.STRING: DataType.BOOL;
			this._defineEventParamProp(propNames[i], propType);
		}
	},

	/** @ignore */
	match: function(htmlEvent)
	{
		var result = this.tryApplySuper('match', [htmlEvent]);
		if (result)
		{
			result = this._matchKeyEvent(htmlEvent, this.getEventParams());
		}
		return result;
	},
	/** @private */
	_matchKeyEvent: function(event, params)
	{
		// modifier keys
		var result =
			(!!event.getAltKey() === !!params.altKey) &&
			(!!event.getCtrlKey() === !!params.ctrlKey) &&
			(!!event.getShiftKey() === !!params.shiftKey) &&
			(!!event.getMetaKey() === !!params.metaKey) &&
			(!params.key || this._matchKey(event, params.key)) &&
			(!params.code || event.getCode() === params.code) &&
			(OU.isUnset(params.repeat) || !!event.getRepeat() === !!params.repeat);
		return result;
	},
	_matchKey: function(event, key)
	{
		var evKey = event.getKey();
		// if key is a printable char, combined with shift may lead to another char
		if (/*!event.getShiftKey() ||*/ this.getStrictMatch())
			return evKey === key;
		else
			return (evKey === key) || (evKey === Kekule.Widget.KeyboardUtils.getShiftedKey(key));
	}
});
/** @ignore */
Kekule.Widget.HtmlKeyEventMatcher.KEY_PARAM_PROPS = ['key', 'code', 'shiftKey', 'ctrlKey', 'altKey', 'metaKey', 'repeat', 'strictMatch'];

/**
 * Keyboard shortcut in widget system.
 * @class
 * @augments ObjectEx
 *
 * @property {String} key Text represents a combination key, e.g. 'Ctrl+A'.
 * @property {Bool} strictMatch If true, shift+key('a') will be regarded as different to shift+key('A').
 */
/**
 * Invoked when the shortcut is pressed (and execTarget should be executed).
 *   event param of it has fields: {htmlEvent, execTarget}.
 * Note this event will still be invoked even if execTarget is not set.
 * @name Kekule.Widget.Shortcut#execute
 * @event
 */
Kekule.Widget.Shortcut = Class.create(ObjectEx,
/** @lends Kekule.Widget.Shortcut# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.Shortcut',
	/** @constructs */
	initialize: function(execTarget, exclusive)
	{
		//this.setPropStoreFieldValue('eventMatcher', eventMatcher);
		//this.setPropStoreFieldValue('execTarget', execTarget);
		var self = this;
		var r = new Kekule.Widget.HtmlEventResponser(new Kekule.Widget.HtmlKeyEventMatcher({eventType: this._getKeyEventType(), strictMatch: false}));
		r.addEventListener('execute', function(e){
			var execTarget = self.getExecTarget();
			/*   // do not to execute manually, since it is already be runned by responser
			if (execTarget && execTarget.execute)
				execTarget.execute();
			*/
			self.invokeEvent({'htmlEvent': e.htmlEvent, 'execTarget': execTarget});
		});
		this.setPropStoreFieldValue('eventResponser', r);
		if (Kekule.ObjUtils.notUnset(exclusive))
			r.setExclusive(exclusive);
		else
			r.setExclusive(true);   // shortcut default exclusive
		if (execTarget)
			r.setExecTarget(execTarget);
		this.tryApplySuper('initialize', []);
		this._registeredDocs = [];
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('strictMatch', {'dataType': DataType.BOOL,
			'getter': function() { return this.getEventResponser().getEventMatcher().getStrictMatch(); },
			'setter': function(value) { this.getEventResponser().getEventMatcher().setStrictMatch(value); }
		});
		this.defineProp('exclusive', {'dataType': DataType.BOOL,
			'getter': function() { return this.getEventResponser().getEventMatcher().getExclusive(); },
			'setter': function(value) { this.getEventResponser().getEventMatcher().setExclusive(value); }
		});
		this.defineProp('key', {'dataType': DataType.STRING,
			'getter': function()
			{
				var params = this.getEventResponser().getEventParams();
				return Kekule.Widget.KeyboardUtils.keyParamsToShortcutLabel(params, null, this.getStrictMatch());
			},
			'setter': function(value)
			{
				if (value !== this.getKey())
				{
					var params = Kekule.Widget.KeyboardUtils.shortcutLabelToKeyParams(value, null, this.getStrictMatch());
					/*
					params.eventType = this._getKeyEventType();
					params.strictMatch = this.getStrictMatch();
					this.getEventResponser().setEventParams(params);
					*/
					var oldParams = this.getEventResponser().getEventParams();
					var keyProps = Kekule.Widget.HtmlKeyEventMatcher.KEY_PARAM_PROPS;
					var notUnset = Kekule.ObjUtils.notUnset;
					for (var i = 0, l = keyProps.length; i < l; ++i)
					{
						var propName = keyProps[i];
						if (notUnset(params[propName]))
							oldParams[propName] = params[propName];
					}
				}
			}
		});
		this.defineProp('targetWidget', {'dataType': 'Kekule.Widget.BaseWidget',
			'setter': null, 'serializable': false,
			'getter': function()
			{
				var execTarget = this.getExecTarget();
				return (execTarget && (execTarget instanceof Kekule.Widget.BaseWidget))? execTarget: null;
			}
		});
		this._defineEventResponserRelatedProp('eventParams', DataType.HASH);
		this._defineEventResponserRelatedProp('execTarget', DataType.VARIANT);
		// private
		this.defineProp('eventResponser', {'dataType': 'Kekule.Widget.HtmlEventResponser', 'serializable': false, 'setter': null});
	},
	/** @ignore */
	doFinalize: function()
	{
		this.unregisterFromAll();
		var r = this.getEventResponser();
		this.setPropStoreFieldValue('eventResponser', null);
		r.finalize();
		this.tryApplySuper('doFinalize');
	},
	/** @private */
	_defineEventResponserRelatedProp: function(propName, dataType, paramFieldName)
	{
		var kname = propName || paramFieldName;
		return this.defineProp(propName, {'dataType': dataType, 'serializable': false,
			'getter': function() { return this.getEventResponser().getPropValue(kname); },
			'setter': function(value) { this.getEventResponser().setPropValue(kname, value); }
		});
	},
	/** @private */
	_getKeyEventType: function()
	{
		return 'keydown';
	},

	/**
	 * Register the shortcut to global manager of document, set it to be activated.
	 * @param {HTMLDocument} document
	 */
	registerToGlobal: function(document)
	{
		var doc = document || Kekule.$document;
		if (doc && this._registeredDocs.indexOf(doc) < 0)
		{
			var globalManager = Kekule.Widget.Utils.getGlobalManager(doc);
			globalManager.registerHtmlEventResponser(this.getEventResponser());
			Kekule.ArrayUtils.pushUnique(this._registeredDocs, doc);
		}
	},
	/**
	 * Unregister the shortcut from global manager of document.
	 * @param {HTMLDocument} document
	 */
	unregisterFromGlobal: function(document)
	{
		var doc = document || Kekule.$document;
		if (doc && this._registeredDocs.indexOf(doc) >= 0)
		{
			var globalManager = Kekule.Widget.Utils.getGlobalManager(doc);
			globalManager.unregisterHtmlEventResponser(this.getEventResponser());
			Kekule.ArrayUtils.remove(this._registeredDocs, doc);
		}
	},
	/**
	 * Unregister the shortcut from all previously registered documents.
	 */
	unregisterFromAll: function()
	{
		var docs = this._registeredDocs;
		for (var i = 0, l = docs.length; i < l; ++i)
			this.unregisterFromGlobal(docs[i]);
	}
});


})();