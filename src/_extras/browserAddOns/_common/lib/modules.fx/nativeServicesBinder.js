/**
 * @fileoverview
 * Utils to bind addon object to use file open or save dialogs in nativeservicesImpl.
 * @author Partridge Jiang
 */

var nativeServices = require('./nativeServicesImpl.js');
var panel = require("sdk/panel");
var viewCore = require("sdk/view/core");
const { globalConsts } = require('../globalConsts.js');
const { MsgUtils } = require('../globalUtils.js');

XpComNativeServiceBinder = {
	_targetsListenerField: '__$listener__',
	_allServices: ['loadFileData', 'saveFileData'],

	targetIsAutohidePanel: function(targetObj)
	{
		var result = (targetObj instanceof panel.Panel);
		if (result)
		{
			var view = viewCore.getActiveView(targetObj);
			if (view)
			{
				var noautohide = view.getAttribute('noautohide');
				result = !noautohide || (noautohide.toString().toLowerCase() === 'false');
			}
		}
		return result;
	},

	/**
	 * Bind targetObj, receive messages from targetObj to call native services.
	 * @param {Object} targetObj
	 * @param {Array} services Service names that need to be bound. e.g. [loadFileData]. Default is null, bind all services.
	 */
	bind: function(targetObj, services)
	{
		var svcs = services || XpComNativeServiceBinder._allServices;
		for (var i = 0, l = svcs.length; i < l; ++i)
		{
			var sv = svcs[i];
			var listener;
			// if target is panel, may be auto hidden when opening dialog, need extra handling
			var isPanel = XpComNativeServiceBinder.targetIsAutohidePanel(targetObj);
			if (sv === 'loadFileData')
			{
				listener = function(msg)
				{
					var id = msg.callerId;
					var options = msg.options;
					var callback = function(result, data, filePath, file)
					{
						//targetObj.port.emit(/*'loadFileData.response'*/globalConsts.MSG_LOAD_FILE_DATA_RESPONSE, {'callerId': id, 'result': result, 'data': data, 'fileName': filePath});
						MsgUtils.emitResponse(targetObj.port, globalConsts.MSG_LOAD_FILE_DATA, {'callerId': id, 'result': result, 'data': data, 'fileName': filePath});
						if (isPanel)
							targetObj.show();
					};
					try
					{
						if (isPanel)
							targetObj.hide();
						nativeServices.loadFileData(callback, options);
					}
					catch (e)
					{
						targetObj.show();
						//targetObj.port.emit(/*'loadFileData.response'*/globalConsts.MSG_LOAD_FILE_DATA_RESPONSE, {'callerId': id, 'result': false, 'errorMsg': e.message});
						MsgUtils.emitResponse(targetObj.port, globalConsts.MSG_LOAD_FILE_DATA, {'callerId': id, 'result': false, 'errorMsg': e.message});
					}
				};
				//targetObj.port.on(/*'loadFileData.request'*/globalConsts.MSG_LOAD_FILE_DATA_REQUEST, listener);
				MsgUtils.onRequest(targetObj.port, globalConsts.MSG_LOAD_FILE_DATA, listener);
			}
			else if (sv === 'saveFileData')
			{
				listener = function(msg)
				{
					var id = msg.callerId;
					var data = msg.data;
					var options = msg.options;
					//console.log('save request received', id, data);
					var callback = function(result, data, filePath, file)
					{
						//targetObj.port.emit(/*'saveFileData.response'*/globalConsts.MSG_SAVE_FILE_DATA_RESPONSE, {'callerId': id, 'result': result, 'data': data, 'fileName': filePath});
						MsgUtils.emitResponse(targetObj.port, globalConsts.MSG_SAVE_FILE_DATA, {'callerId': id, 'result': result, 'data': data, 'fileName': filePath});
						if (isPanel)
							targetObj.show();
					};
					try
					{
						if (isPanel)
							targetObj.hide();
						nativeServices.saveFileData(data, callback, options);
					}
					catch (e)
					{
						targetObj.show();
						//targetObj.port.emit(/*'saveFileData.response'*/globalConsts.MSG_SAVE_FILE_DATA_RESPONSE, {'callerId': id, 'result': false, 'errorMsg': e.message});
						MsgUtils.emitResponse(targetObj.port, globalConsts.MSG_SAVE_FILE_DATA, {'callerId': id, 'result': false, 'errorMsg': e.message});
					}
				};
				//targetObj.port.on(/*'saveFileData.request'*/globalConsts.MSG_SAVE_FILE_DATA_REQUEST, listener);
				MsgUtils.onRequest(targetObj.port, globalConsts.MSG_SAVE_FILE_DATA, listener);
			}

			if (listener)
				targetObj[XpComNativeServiceBinder._targetsListenerField + sv] = listener;
		}
	},
	/**
	 * Unbind targetObj
	 * @param {Object} targetObj
	 */
	unbind: function(targetObj, services)
	{
		var svcs = services || XpComNativeServiceBinder._allServices;
		for (var i = 0, l = svcs.length; i < l; ++i)
		{
			var sv = svcs[i];
			var listener = targetObj[XpComNativeServiceBinder._targetsListenerField + sv];
			if (listener)
				targetObj.port.removeListener(sv, listener);
		}
	}
};

exports.bind = XpComNativeServiceBinder.bind;
exports.unbind = XpComNativeServiceBinder.unbind;