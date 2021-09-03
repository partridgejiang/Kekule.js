/**
 * @fileoverview
 * Classes used for store configurations.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /lan/serializations.js
 * requires /core/kekule.common.js
 * requires /utils/kekule.utils.js
 */

/**
 * Represent an abstract configuration class to store a set of config items.
 * Configurations are stored in properties of class.
 * @class
 * @augments ObjectEx
 * @param autoInitDefValue Whether set properties to default value after object is created.
 */
Kekule.AbstractConfigs = Class.create(ObjectEx,
	/** @lends Kekule.AbstractConfigs# */
	{
	/** @private */
	CLASS_NAME: 'Kekule.AbstractConfigs',
	/** @private */
	CONFIG_PROP_FLAG: '__$config_prop__',
	/**
	 * @constructs
	 */
	initialize: function(/*$super, */autoInitDefValue)
	{
		this.tryApplySuper('initialize')  /* $super() */;
		if (typeof(autoInitDefValue) == 'undefined')
			autoInitDefValue = true;
		if (autoInitDefValue)
			this.initPropDefValues();
	},
	/**
	 * Add a config property item, actually define a new property.
	 * A config property usually has simple getter/setter and must be serializable.
	 * @param {Object} name
	 * @param {Object} dataType
	 * @param {Variant} defaultValue
	 * @param {Hash} additionalOptions
	 */
	addConfigProp: function(name, dataType, defaultValue, additionalOptions)
	{
		var options = {'dataType': dataType};
		if (additionalOptions)
			options = Object.extend(options, additionalOptions);
		if (typeof(defaultValue) != 'undefined')
			options.defaultValue = defaultValue;
		var result = this.defineProp(name, options);
		// add a special field to indicate that this is a config property
		result[this.CONFIG_PROP_FLAG] = true;
		return result;
	},
	/**
	 * Add a Hash config property item.
	 * @param {Object} name
	 * @param {Hash} defaultValue
	 * @param {Hash} additionalOptions
	 */
	addHashConfigProp: function(name, defaultValue, additionalOptions)
	{
		return this.addConfigProp(name, DataType.HASH, defaultValue, additionalOptions);
	},
	/**
	 * Add a string config property item.
	 * @param {Object} name
	 * @param {String} defaultValue
	 * @param {Hash} additionalOptions
	 */
	addStrConfigProp: function(name, defaultValue, additionalOptions)
	{
		return this.addConfigProp(name, DataType.STRING, defaultValue, additionalOptions);
	},
	/**
	 * Add a numberic config property item.
	 * @param {Object} name
	 * @param {Number} defaultValue
	 * @param {Hash} additionalOptions
	 */
	addNumConfigProp: function(name, defaultValue, additionalOptions)
	{
		return this.addConfigProp(name, DataType.NUM, defaultValue, additionalOptions);
	},
	/**
	 * Add an integer config property item.
	 * @param {Object} name
	 * @param {Int} defaultValue
	 * @param {Hash} additionalOptions
	 */
	addIntConfigProp: function(name, defaultValue, additionalOptions)
	{
		return this.addConfigProp(name, DataType.INT, defaultValue, additionalOptions);
	},
	/**
	 * Add a float config property item.
	 * @param {Object} name
	 * @param {Float} defaultValue
	 * @param {Hash} additionalOptions
	 */
	addFloatConfigProp: function(name, defaultValue, additionalOptions)
	{
		return this.addConfigProp(name, DataType.FLOAT, defaultValue, additionalOptions);
	},
	/**
	 * Add a boolean config property item.
	 * @param {Object} name
	 * @param {Bool} defaultValue
	 * @param {Hash} additionalOptions
	 */
	addBoolConfigProp: function(name, defaultValue, additionalOptions)
	{
		return this.addConfigProp(name, DataType.BOOL, defaultValue, additionalOptions);
	},
	/**
	 * Set properties to their default value.
	 * @private
	 */
	initPropDefValues: function()
	{
		this.beginUpdate();
		try
		{
			var props = this.getAllPropList();
			for (var i = 0, l = props.getLength(); i < l; ++i)
			{
				var prop = props.getPropInfoAt(i);
				var propName = prop.name;
				var defValue = prop.defaultValue;
				if (typeof(defValue) != 'undefined')
					this.setPropValue(propName, defValue);
			}
		}
		finally
		{
			this.endUpdate();
		}
	},
	/**
	 * Check if a property is defined as config property.
   * @param {Object} propInfo
	 * @returns {Bool}
	 */
	isConfigProp: function(propInfo)
	{
		return !!propInfo[this.CONFIG_PROP_FLAG];
	},
	/**
	 * Assign data of src to current config object.
	 * @param {Kekule.AbstractConfig} src
	 */
	assign: function(src)
	{
		src.copyPropsTo(this);
	},

	/**
	 * Convert property name to a new key when calling {@link Kekule.AbstractConfigs.toHash}.
	 * By default this method will attach a prefix from {@link Kekule.AbstractConfigs.doGetPropNameToHashPrefix} to property name。
	 * Descendants may override this method.
	 * @param {String} propName
	 * @returns {String}
	 * @private
	 */
	doTransformPropNameToHash: function(propName)
	{
		return this.doGetPropNameToHashPrefix() + propName;
	},
	/**
	 * Returns a prefix attaching to property name when export hash from config object.
	 * Desendants may override this method.
	 * @returns {String}
	 */
	doGetPropNameToHashPrefix: function()
	{
		return '';
	},
	/**
	 * Wrap all properties to a hash object.
	 * @param {Function} propNameTransformer A function(propName): string, to transform property name.
	 *   If not set, {@link Kekule.AbstractConfigs.doTransformPropNameToHash} will be used.
	 * @returns {Hash}
	 */
	toHash: function(propNameTransformer)
	{
		var obj = {};
		var propFlagName = this.CONFIG_PROP_FLAG;
		this.saveObj(obj, 'json', {
			'saveDefaultValues': true,
			'propFilter': function(prop, obj)
				{
					// save only config properties
					return prop[propFlagName];
				}
		});
		// delete '_type' field
		/*
		if (obj['_type'])
			delete obj['_type'];
		*/
		//console.log(obj);
		//return obj;
		var transformFunc = propNameTransformer || this.doTransformPropNameToHash.bind(this);
		var result = {};
		var keyNames = Kekule.ObjUtils.getOwnedFieldNames(obj, false);
		for (var i = 0, l = keyNames.length; i < l; ++i)
		{
			var transKeyName = transformFunc(keyNames[i]);
			result[transKeyName] = obj[keyNames[i]];
		}
		return result;
	}
});

/**
 * Represent a set of predefined named config values.
 * @class
 * @augments ObjectEx
 */
Kekule.ConfigPresetMap = Class.create(ObjectEx,
	/** @lends Kekule.ConfigPresetMap# */
	{
	/** @private */
	CLASS_NAME: 'Kekule.ConfigPresetMap',
	/** @constructs */
	initialize: function(/*$super*/)
	{
		this.tryApplySuper('initialize')  /* $super() */;
		this.map = new Kekule.MapEx(true);  // a non-weak map
	},
	/** @private */
	doFinalize: function(/*$super*/)
	{
		this.map = null;
		this.tryApplySuper('doFinalize')  /* $super() */;
	},
	/**
	 * Add a preset to map.
	 * @param {String} name
	 * @param {Object} configObj
	 */
	set: function(name, configObj)
	{
		this.map.set(name, configObj);
	},
	/**
	 * Get preset from map.
	 * @param {String} name
	 * @returns {Object}
	 */
	get: function(name)
	{
		return this.map.get(name);
	},
	/**
	 * Get preset from map and turn it into a simple hash object.
	 * @param {String} name
	 * @returns {Hash}
	 */
	getHash: function(name)
	{
		var obj = this.get(name);
		if (obj)
		{
			if (obj.toHash)  // Kekule.Configs
				return obj.toHash();
			else
				return obj;
		}
		else
			return null;
	},
	/**
	 * Remove a preset from map.
	 * @param {String} name
	 */
	remove: function(name)
	{
		this.map.remove(name);
	},
	/**
	 * Check if a preset in map.
	 * @param {String} name
	 * @returns {Bool}
	 */
	has: function(name)
	{
		return this.map.has(name);
	},
	/**
	 * Clear all presets.
	 */
	clear: function()
	{
		this.map.clear();
	}
});
