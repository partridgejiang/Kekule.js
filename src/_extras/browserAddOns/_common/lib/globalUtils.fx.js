/**
 * Some global util functions used in Firefox addon.
 */

if (!!this.require)
{
	var { setTimeout, clearTimeout } = require("sdk/timers");
	var { globalConsts } = require('./globalConsts.js');
}

var MsgUtils = {
	/**
	 * Emit an error message to port.
	 */
	emitError: function(port, errorText)
	{
		port.emit(globalConsts.MSG_ERROR, {'message': errorText});
	},
	/**
	 * Emit an timeout error. If errorText not set, a default message will be used.
	 */
	emitRequestTimeoutError: function(port, errorText)
	{
		port.emit(globalConsts.MSG_ERROR, {'message': errorText || 'Request time out'});
	},
	/**
	 * send a request message through port and listener for the response message.
	 * Options is a hash with the following fields
	 *   {
	 *     data: data of message sent
	 *     responseCallback: callback to listener to response message of port, responseCallback(data)
	 *     timeoutCallback: callback if response not received after timeout, timeoutCallback()
	 *     timeout: timeout in milliseconds,
	 *     //useDefaultTimeoutCallback: if timeoutCallback not set, use default timeout callback function, default is true.
	 *   }
	 */
	emitRequest: function(port, msgName, options)
	{
		var ops = Object.create(options || {});
		if (ops.useDefaultTimeoutCallback === undefined)
			ops.useDefaultTimeoutCallback = true;
		var emitMsgName = msgName + globalConsts.MSG_REQUEST;
		var listenMsgName = msgName + globalConsts.MSG_RESPONSE;

		// time out
		var timeoutId;
		var cancelTimeout = function()
		{
			if (timeoutId)
			{
				clearTimeout(timeoutId);
				timeoutId = null;
			}
		};
		if (ops.timeoutCallback)
		{
			var timeout = ops.timeout || 2000;
			var timeoutFunc = function()
			{
				cancelTimeout();
				ops.timeoutCallback();
			};
			timeoutId = setTimeout(timeoutFunc, timeout);
		}

		// set listener
		if (ops.responseCallback)
		{
			var responseFunc = function(data)
			{
				cancelTimeout();
				ops.responseCallback(data);
			};
			port.once(listenMsgName, responseFunc);
		}

		// emit message
		port.emit(emitMsgName, ops.data);
	},
	/**
	 * Send a response message to port.
	 */
	emitResponse: function(port, msgName, data)
	{
		port.emit(msgName + globalConsts.MSG_RESPONSE, data);
	},
	/**
	 * Add listener on port for request message.
	 */
	onRequest: function(port, msgName, callback)
	{
		port.on(msgName + globalConsts.MSG_REQUEST, callback);
	}
};


if (this.exports)
{
	exports.MsgUtils = MsgUtils;
}
