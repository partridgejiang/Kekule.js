/**
 * @fileoverview
 * Support of an internal "clipboard" to transfer data between different widgets in one page.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /utils/kekule.utils.js
 * requires /widget/kekule.widget.base.js
 * requires /xbrowsers/kekule.x.js
 */

(function(){
"use strict";

/**
 * A class to implement an internal "clipboard" to transfer data between different widgets
 * in one page.
 * @class
 * @augments ObjectEx
 *
 * @property {Bool} enableCrossPageClipboard Whether use window.localStorage to emulate clipboard
 *   between different pages.
 */
/**
 * Invoked when the data is added into clipboard or cleared from clipboard.
 *   event param of it has fields: {dataType, data}
 * @name Kekule.Widget.Clipboard#setData
 * @event
 */
Kekule.Widget.Clipboard = Class.create(ObjectEx,
/** @lends Kekule.Widget.Clipboard# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.Clipboard',
	/** @private */
	STORAGE_KEY: '__$kekule_widget_clipboard__',
	/**
	 * @constructs
	 */
	initialize: function($super)
	{
		$super();
		this._data = new Kekule.MapEx(true);
		if (Kekule.BrowserFeature.localStorage)
		{
			this._crossPageStorage = window.localStorage;  // window.sessionStorage;
			this.setEnableCrossPageClipboard(true);
			var self = this;
			Kekule.X.Event.addListener(window, 'storage', function(e){
				if (self.getEnableCrossPageClipboard())
				{
					var key = e.key;
					var dataType = self._extractSessionDataType(key);
					if (dataType)
					{
						self.invokeEvent('setData', {'dataType': dataType, 'data': self.deserializeData(e.newValue)});
					}
				}
			});
		}
	},
	/** @ignore */
	finalize: function($super)
	{
		this._data.finalize();
		$super();
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('enableCrossPageClipboard', {'dataType': DataType.BOOL});
	},

	/** @private */
	_useSessionClipboard: function()
	{
		return this.getEnableCrossPageClipboard() && Kekule.BrowserFeature.localStorage;
	},
	/** @private */
	_extractSessionDataType: function(key)
	{
		return (key.startsWith(this.STORAGE_KEY))?
			key.substr(this.STORAGE_KEY.length):
			null;
	},
	/** @private */
	serializeData: function(data)
	{
		var result;
		if (DataType.isSimpleValue(data))
		{
			result = JSON.stringify(data);
		}
		else  // object
		{
			var jsonObj = {};
			ObjSerializerFactory.getSerializer('json').save(data, jsonObj);
			result = JSON.stringify(jsonObj);
		}
		return result;
	},
	/** @private */
	deserializeData: function(data)
	{
		var jsonObj = JSON.parse(data);
		if (DataType.isSimpleValue(jsonObj))
			return jsonObj;
		else
			return ObjSerializerFactory.getSerializer('json').load(null, jsonObj);
	},

	/**
	 * Add data to clipboard.
	 * e.g. Kekule.Widget.Clipboard.setData('text/plain', 'A string').
	 * @param {String} dataType MIME type of data.
	 * @param {Variant} data Data add to clipboard.
	 */
	setData: function(dataType, data)
	{
		if (this._useSessionClipboard())
		{
			var s = this.serializeData(data);
			this._crossPageStorage.setItem(this.STORAGE_KEY + dataType, s);
		}
		else
		{
			this._data.set(dataType, data);
		}
		this.invokeEvent('setData', {'dataType': dataType, 'data': data});
		return this;
	},
	/**
	 * Get data from clipboard.
	 * e.g. Kekule.Widget.Clipboard.getData('text/plain').
	 * @param {String} dataType
	 * @returns {Variant}
	 */
	getData: function(dataType)
	{
		if (this._useSessionClipboard())
		{
			var s = this._crossPageStorage.getItem(this.STORAGE_KEY + dataType);
			return s? this.deserializeData(s): null;
		}
		else
			return this._data.get(dataType);
	},
	/**
	 * Check there are data in clipboard.
	 * @param {String} dataType
	 * @returns {Bool}
	 */
	hasData: function(dataType)
	{
		return Kekule.ObjUtils.notUnset(this.getData(dataType));
	},
	/**
	 * Clear all data in clipboard.
	 */
	clearData: function()
	{
		if (this._useSessionClipboard())
		{
			var types = this.getTypes();
			for (var i = 0, l = types.length; i < l; ++i)
			{
				this._crossPageStorage.removeItem(this.STORAGE_KEY + types[i]);
			}
		}
		else
			this._data.clear();
		this.invokeEvent('setData', {'dataType': null, 'data': null});
		return this;
	},
	/**
	 * Returns all data types currently in clipboard.
	 * @returns {Array}
	 */
	getTypes: function()
	{
		if (this._useSessionClipboard())
		{
			var result = [];
			for (var i = 0, l = this._crossPageStorage.length; i < l; ++i)
			{
				var key = this._crossPageStorage.key(i);
				var dataType = this._extractSessionDataType(key);
				if (dataType)
					result.push(dataType);
			}
			return result;
		}
		else
			return this._data.getKeys();
	},
	/**
	 * A util method to store array of objects into clipboard.
	 * @param {String} dataType
	 * @param {Array} objs
	 */
	setObjects: function(dataType, objs)
	{
		var jsonObjs = [];
		var serializer = ObjSerializerFactory.getSerializer('json');
		for (var i = 0, l = objs.length; i < l; ++i)
		{
			var obj = objs[i];
			var jsonObj = {};
			serializer.save(obj, jsonObj);
			jsonObjs.push(jsonObj);
		}
		var str = JSON.stringify(jsonObjs);
		//console.log('setObjects', str, jsonObjs);
		return this.setData(dataType, str);
	},
	/**
	 * A util method to load array of objects from clipboard.
	 * @param {String} dataType
	 * @returns {Variant}
	 */
	getObjects: function(dataType)
	{
		var data = this.getData(dataType);
		if (DataType.isSimpleValue(data))
		{
			var jsonObjs = JSON.parse(data);
			if (!DataType.isArrayValue(jsonObjs))
				jsonObjs = [jsonObjs];
			var result = [];
			var serializer = ObjSerializerFactory.getSerializer('json');
			for (var i = 0, l = jsonObjs.length; i < l; ++i)
			{
				var jsonObj = jsonObjs[i];
				var obj = serializer.load(null, jsonObj);
				result.push(obj);
			}
			//console.log('getObjects', data, result);
			return result;
		}
		else  // complex value, object or array directly
			return data;
	}
});
Kekule.ClassUtils.makeSingleton(Kekule.Widget.Clipboard);
Kekule.Widget.clipboard = Kekule.Widget.Clipboard.getInstance();

})();