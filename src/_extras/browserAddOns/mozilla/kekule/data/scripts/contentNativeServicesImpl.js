/**
 * @fileoverview
 * Replace the default native services (e.g., file picker dialog) using by Kekule.js for content script in panel.
 * Using messages to communicate with chrome scripts.
 * @author Partridge Jiang
 */

(function(addon)
{

ContentScriptNativeServicesImpl = {
	_callbacks: [],
	_createUUID: function()
	{
		// http://www.ietf.org/rfc/rfc4122.txt
		var s = [];
		var hexDigits = "0123456789abcdef";
		for (var i = 0; i < 36; i++)
		{
			s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
		}
		s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
		s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
		s[8] = s[13] = s[18] = s[23] = "-";

		var uuid = s.join("");
		return uuid;
	},
	getUid: function(prefix)
	{
		return (prefix || '') + ContentScriptNativeServicesImpl._createUUID();
	},
	registerCallback: function(id, callback)
	{
		ContentScriptNativeServicesImpl._callbacks[id] = callback;
	},
	unregisterCallback: function(id)
	{
		delete ContentScriptNativeServicesImpl._callbacks[id];
	},
	getCallback: function(id)
	{
		return ContentScriptNativeServicesImpl._callbacks[id];
	},

	doLoadFileData: function(doc, callback, options)
	{
		var id = ContentScriptNativeServicesImpl.getUid('loadFileData');
		ContentScriptNativeServicesImpl.registerCallback(id, callback);
		addon.port.emit(/*'loadFileData.request'*/globalConsts.MSG_LOAD_FILE_DATA_REQUEST, {'callerId': id, 'options': options});
	},

	doSaveFileData: function(doc, data, callback, options)
	{
		var id = ContentScriptNativeServicesImpl.getUid('saveFileData');
		ContentScriptNativeServicesImpl.registerCallback(id, callback);
		//console.log('call saveFileData request')
		addon.port.emit(/*'saveFileData.request'*/globalConsts.MSG_SAVE_FILE_DATA_REQUEST, {'callerId': id, 'data': data, 'options': options});
	},

	/** Init the impl system */
	_init: function()
	{
		addon.port.on(/*"loadFileData.response"*/globalConsts.MSG_LOAD_FILE_DATA_RESPONSE, function(msg)
		{
			var id = msg.callerId;
			var callback = ContentScriptNativeServicesImpl.getCallback(id);
			if (callback)
			{
				callback(msg.result, msg.data, msg.fileName);
				ContentScriptNativeServicesImpl.unregisterCallback(id);
			}
		});
		addon.port.on(/*"saveFileData.response"*/globalConsts.MSG_SAVE_FILE_DATA_RESPONSE, function(msg)
		{
			var id = msg.callerId;
			var callback = ContentScriptNativeServicesImpl.getCallback(id);
			if (callback)
			{
				callback(msg.result, msg.fileName);
				ContentScriptNativeServicesImpl.unregisterCallback(id);
			}
		});
	}
};



if (addon)
{
	ContentScriptNativeServicesImpl._init();

	// replace origin implementation
	Kekule.NativeServices.doLoadFileData = ContentScriptNativeServicesImpl.doLoadFileData;
	Kekule.NativeServices.doSaveFileData = ContentScriptNativeServicesImpl.doSaveFileData;
}

})(this.addon);