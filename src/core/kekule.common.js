/**
 * @fileoverview
 * Some global symbols used in Kekule library.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /localization
 */

"use strict";

(function(){

//var OT = Kekule.OBJDEF_TEXTS;

// modify defineProp method of ObjectEx, add auto title/description supports
if (Kekule.PROP_AUTO_TITLE)
{
	var originMethod = ClassEx.getPrototype(ObjectEx).defineProp;
	var OBJ_PROP_TITLE_TEXT_PREFIX = 'TITLE_';
	var OBJ_PROP_DESCRIPTION_TEXT_PREFIX = 'DES_';
	var newMethod = function(propName, options)
	{
		if (!options.title && !options.description)  // all not set, auto decide
		{
			var className = this.getClassName();
			if (className.startsWith('Kekule.'))  // remove Kekule prefix
			{
				className = className.substr(7);
			}
			//var textObj = Object.getCascadeFieldValue(className, Kekule.OBJDEF_TEXTS);
			//if (textObj)
			{
				//var titleField = Kekule.OBJDEF_TEXTS.TITLE_PREFIX + propName;
				//var desField = Kekule.OBJDEF_TEXTS.DESCRIPTION_PREFIX + propName;
				var titlePrefix = OBJ_PROP_TITLE_TEXT_PREFIX;
				var destPrefix = OBJ_PROP_DESCRIPTION_TEXT_PREFIX;
				var titleField = titlePrefix + propName;
				var desField = destPrefix + propName;
				var title = Kekule.Localization.findValue('OBJDEF_TEXTS.' + className + '.' + titleField);
				var description = Kekule.Localization.findValue('OBJDEF_TEXTS.' + className + '.' + desField);
				options.title = title; //textObj[titleField];
				options.description = description; //textObj[desField];
			}
		}
		return originMethod.apply(this, [propName, options]);
	};
	ClassEx.getPrototype(ObjectEx).defineProp = newMethod;
}

/**
 * Enumeration of exception types.
 * @class
 */
Kekule.ExceptionLevel = {
	/** Fatal error, usually cause the stop of program execution. */
	ERROR: -1,
	/** Serious exception, but the program can still run. */
	WARNING: -2,
	/** Minor exception, user usually need not to know about it. */
	NOTE: -3,
	/** Log message, just for debug use. */
	LOG: -4
};

/**
 * Throw an exception in ExceptionHandler, same as {@link Kekule.ExceptionHandler.throwException}
 */
Kekule.throwException = function(e, exceptionLevel)
{
	if (Kekule.exceptionHandler)
	{
		return Kekule.exceptionHandler.throwException(e, exceptionLevel);
	}
	else
	{
		var EL = Kekule.ExceptionLevel;
		if ((!exceptionLevel) || (exceptionLevel === EL.ERROR))
		{
			if (typeof(e) === 'string')
				e = new Kekule.Exception(e);
			throw e;
		}
		else
		{
			if (typeof(console) !== 'undefined')
			{
				if (typeof(e) !== 'string')
					e = e.message;
				var method = (exceptionLevel === EL.WARNING)? console.warn:
					(exceptionLevel === EL.NOTE)? console.info:
					console.log;
				if (method)
					method(e);
				else
					console.log(e);
			}
		}
	}
};
/**
 * Returns the message of exception object or string.
 * @param {Variant} e
 * @returns {String}
 */
Kekule.getExceptionMsg = function(e)
{
	if (typeof(e) === 'string')
		return e;
	else if (typeof(e) === 'object')
		return e.message;
	else
		return '';
};
/**
 * Throw an exception in ExceptionHandler, same as {@link Kekule.ExceptionHandler.throwException}
 * @function
 */
Kekule.raise = Kekule.throwException;
/**
 * Throw an {@link Kekule.Error} in ExceptionHandler.
 */
Kekule.error = function(e)
{
	/*
	if (typeof(e) == 'string')
		e = new Kekule.Error(e);
	if (Kekule.exceptionHandler)
		return Kekule.exceptionHandler.throwException(e);
	else
		throw e;
	*/
	return Kekule.raise(e, Kekule.ExceptionLevel.ERROR);
};
/**
 * Throw an {@link Kekule.ChemError} in ExceptionHandler.
 */
Kekule.chemError = function(e)
{
	if (typeof(e) == 'string')
		e = new Kekule.ChemError(e);
	/*
	if (Kekule.exceptionHandler)
		return Kekule.exceptionHandler.throwException(e);
	else
		throw e;
	*/
	return Kekule.error(e);
};

/**
 * Raise a warning message (but do not raise error).
 * @param e
 */
Kekule.warn = function(e)
{
	return Kekule.raise(e, Kekule.ExceptionLevel.WARNING);
};
/**
 * Raise a informative hint message.
 * @param e
 */
Kekule.notify = function(e)
{
	return Kekule.raise(e, Kekule.ExceptionLevel.NOTE);
};
/**
 * Raise a log message.
 * @param e
 */
Kekule.log = function(e)
{
	return Kekule.raise(e, Kekule.ExceptionLevel.LOG);
};


/**
 * Check if localization resource is imported and available.
 * If it returns true, l10n constants can be used.
 * @returns {Bool}
 */
Kekule.hasLocalRes = function()
{
	return !!Kekule.LOCAL_RES;
};

/**
 * An root object to store default options for many operations (e.g., ring search, stereo perception).
 * User can modify concrete options to change the default action of some functions.
 * @object
 */
Kekule.globalOptions = {
	add: function(optionName, valueOrHash)
	{
		var oldValue = Object.getCascadeFieldValue(optionName, Kekule.globalOptions);

		if (oldValue && DataType.isObjectValue(oldValue) && DataType.isObjectValue(valueOrHash))  // value already exists and can be extended
		{
			Object.extend(oldValue, valueOrHash);
		}
		else
			Object.setCascadeFieldValue(optionName, valueOrHash, Kekule.globalOptions, true);
	}
};

/**
 * A class to implement str => variant mapping.
 * @class
 */
Kekule.HashEx = Class.create(
/** @lends Kekule.HashEx# */
{
	/** @private */
	CLASS_NAME: 'Kekule.HashEx',
	/** @private */
	PROP_NAME_PREFIX: '__$key$__',
	/** @constructs */
	initialize: function()
	{
		this._map = {};
	},
	/**
	 * Free resources.
	 */
	finalize: function()
	{
		this._map = null;
	},
	/** @private */
	keyToPropName: function(key)
	{
		return this.PROP_NAME_PREFIX + key;  // add a prefix to avoid possible name conflicts with default object
	},
	/**
	 * Check whether a value has been associated to the key string.
	 * @param {String} key
	 * @returns {Bool}
	 */
	has: function(key)
	{
		return this._map.hasOwnProperty(this.keyToPropName(key));
	},
	/**
	 * Set the value for the key string.
	 * @param {String} key
	 * @param {Variant} value
	 */
	set: function(key, value)
	{
		this._map[this.keyToPropName(key)] = value;
		return this;
	},
	/**
	 * Returns the value associated to the key string,
	 * @param {String} key
	 * @param {Variant} defaultValue Return this value if key does not exist.
	 * @returns {Variant}
	 */
	get: function(key, defaultValue)
	{
		var propName = this.keyToPropName(key);
		if (this._map.hasOwnProperty(propName))
			return this._map[propName];
		else
			return defaultValue;
	},
	/**
	 * Removes any value associated to the key string.
	 * @param {String} key
	 */
	remove: function(key)
	{
		var propName = this.keyToPropName(key);
		if (this._map.hasOwnProperty(propName))
		{
			delete this._map[propName];
		}
		return this;
	},
	/**
	 * Clear all key and values in map.
	 */
	clear: function()
	{
		this._map = {};
	}
});

/**
 * A class to implement obj => obj mappings.
 * @class
 *
 * @params {Bool} nonWeak Whether try to create this map as a weak one (do not disturb GC).
 */
Kekule.MapEx = Class.create(
/** @lends Kekule.MapEx# */
{
	/** @private */
	CLASS_NAME: 'Kekule.MapEx',
	/** @constructs */
	initialize: function(nonWeak, enableCache)
	{
		this.isWeak = !nonWeak;
		if (!Kekule.MapEx._inited)
			Kekule.MapEx._init();
		// try use built in
		var _implClass = nonWeak? Kekule.MapEx._implementationNonWeak: Kekule.MapEx._implementationWeak;
		if (!_implClass)  // fall back to JavaScript implementation
		{
			this._keys = [];
			this._values = [];
		}
		else
			this._implementation = new _implClass();
		if (enableCache)
			this._cache = {};  // cache enabled for performance
		/*
		if ((!Kekule.MapEx._implementation) || (!this.isWeak))  // use JavaScript implementation
		if (!this._implementation)
		{
			this.keys = [];
			this.values = [];
		}
		else  // use built-in implementation
			this._implementation = new Kekule.MapEx._implementation();
		*/
	},
	/**
	 * Free resources.
	 */
	finalize: function($super)
	{
		if (!this._implementation)
		{
			this._keys = null;
			this._values = null;
			this._cache = null;
		}
	},
	/**
	 * Set the value for the key object.
	 * @param {Variant} key
	 * @param {Variant} value
	 */
	set: function(key, value)
	{
		if (this._implementation)
			this._implementation.set(key, value);
		else
		{
			var index = this._keys.indexOf(key);
			if (index >= 0)
				this._values[index] = value;
			else
			{
				this._keys.push(key);
				this._values.push(value);
			}
		}
		if (this._cache && this._cache.key === key)
		{
			this._cache.value = value;
		}
		//console.log(key, value, this.get(key));
		return this;
	},
	/**
	 * Returns the value associated to the key object,
	 * @param {Variant} key
	 * @param {Variant} defaultValue Return this value if key does not exist.
	 * @returns {Variant}
	 */
	get: function(key, defaultValue)
	{
		if (this._cache && this._cache.key === key)  // has cache, return directly
			return this._cache.value;

		var result;
		var found = false;
		if (this._implementation)
		{
			if (this._implementation.has(key))
			{
				result = this._implementation.get(key);
				found = true;
			}
		}
		else
		{
			var index = this._keys.indexOf(key);
			if (index >= 0)
			{
				result = this._values[index];
				found = true;
			}
		}

		if (found && this._cache)  // set cache
		{
			this._cache.key = key;
			this._cache.value = result;
		}
		return found? result: defaultValue;
	},
	/**
	 * Check whether a value has been associated to the key object.
	 * @param {Variant} key
	 * @returns {Bool}
	 */
	has: function(key)
	{
		if (this._implementation)
			return this._implementation.has(key);
		else
		{
			var index = this._keys.indexOf(key);
			return index >= 0;
		}
	},
	/**
	 * Removes any value associated to the key object.
	 * @param {Object} key
	 */
	remove: function(key)
	{
		if (this._cache && this._cache.key === key)  // clear cache
			this._cache = {};

		if (this._implementation)
			return this._implementation['delete'](key);  // avoid IE regard delete as a reserved word
		else
		{
			var index = this._keys.indexOf(key);
			if (index >= 0)
			{
				this._keys.splice(index, 1);
				this._values.splice(index, 1);
			}
		}
		return this;
	},
	/**
	 * Clear all key and values in map.
	 */
	clear: function()
	{
		if (this._cache)  // clear cache
			this._cache = {};

		if (!this._implementation || this._debug)
		{
			this._keys = [];
			this._values = [];
		}
		//else
		if (this._implementation)
		{
			if (this.isWeak)
				Kekule.error(Kekule.$L('ErrorMsg.CANNOT_CLEAR_WEAKMAP')/*Kekule.ErrorMsg.CANNOT_CLEAR_WEAKMAP*/);
			else
				this._implementation.clear();
		}
		return this;
	},
	/**
	 * Returns an array of all keys in map.
	 * @returns {Array}
	 */
	getKeys: function()
	{
		if (!this._implementation)
			return [].concat(this._keys);  // clone the array, avoid modification
		else
		{
			if (this.isWeak)
			{
				// weak map, can not return keys
				Kekule.error(Kekule.$L('ErrorMsg.CANNOT_GET_KEY_LIST_IN_WEAKMAP')/*Kekule.ErrorMsg.CANNOT_GET_KEY_LIST_IN_WEAKMAP*/);
				return [];
			}
			else
			{
				var iter = this._implementation.keys();
				var result;
				if (Array.from)
					result = Array.from(iter);
				else if (iter.next)
				{
					result = [];
					var nextResult = iter.next();
					while (!nextResult.done)
					{
						result.push(nextResult.value);
						nextResult = iter.next();
					}
				}
				else
				{
					result = [];
					for (var item in iter)
					{
						result.push(item);
					}
				}
				return result;
			}
		}
	},
	/**
	 * Returns an array of all values in map.
	 * @returns {Array}
	 */
	getValues: function()
	{
		if (!this._implementation)
			return this._values;
		else
		{
			if (this.isWeak)
			{
				// weak map, can not return keys
				Kekule.error(Kekule.$L('ErrorMsg.CANNOT_GET_VALUE_LIST_IN_WEAKMAP')/*Kekule.ErrorMsg.CANNOT_GET_VALUE_LIST_IN_WEAKMAP*/);
				return [];
			}
			else
			{
				var iter = this._implementation.values();
				var result;
				if (Array.from)
					result = Array.from(iter);
				else if (iter.next)
				{
					result = [];
					var nextResult = iter.next();
					while (!nextResult.done)
					{
						result.push(nextResult.value);
						nextResult = iter.next();
					}
				}
				else
				{
					result = [];
					for (var item in iter)
					{
						result.push(item);
					}
				}
				return result;
			}
		}
	},
	/**
	 * Return count all map items.
	 * @returns {Int}
	 */
	getLength: function()
	{
		return this.getKeys().length;
	}
});
/** @private */
Kekule.MapEx._init = function()
{
	Kekule.MapEx._implementationWeak = null;  // use JavaScript implementation
	Kekule.MapEx._implementationNonWeak = null;  // use JavaScript implementation
	if (Kekule.$jsRoot.WeakMap)  // Fx6 and above, use built-in WeakMap object
		Kekule.MapEx._implementationWeak = Kekule.$jsRoot.WeakMap;
	if (Kekule.$jsRoot.Map && Kekule.$jsRoot.Map.prototype.keys)  // the implementation of Map in IE does not support keys() and values()
		Kekule.MapEx._implementationNonWeak = Kekule.$jsRoot.Map;

	Kekule.MapEx._inited = true;
};
Kekule.MapEx._inited = false;


/**
 * A class to implement obj1, obj2 => obj mappings.
 * @class
 *
 * @params {Bool} nonWeak Whether try to create this map as a weak one (do not disturb GC).
 */
Kekule.TwoTupleMapEx = Class.create(
/** @lends Kekule.TwoTupleMapEx# */
{
	/** @private */
	CLASS_NAME: 'Kekule.TwoTupleMapEx',
	/** @constructs */
	initialize: function(nonWeak, enableCache)
	{
		this.nonWeak = nonWeak;
		this.map = new Kekule.MapEx(nonWeak, enableCache);

		if (enableCache)
			this._level1Cache = {};  // a cache for quickly find level 1 map
	},
	/**
	 * Free resources.
	 */
	finalize: function()
	{
		this._level1Cache = null;
		this.map.finalize();
	},
	/** @private */
	getSecondLevelMap: function(key1, allowCreate)
	{

		if (key1 && this._level1Cache && (key1 === this._level1Cache.key) && this._level1Cache.value)
		{
			return this._level1Cache.value;
		}
		else
		{
			var result = this.map.get(key1);
			if ((!result) && allowCreate)
			{
				result = new Kekule.MapEx(this.nonWeak);
				this.map.set(key1, result);
			}
			/*
			// set to cache
			this._level1Cache.key = key1;
			this._level1Cache.value = result;
			*/
			return result;
		}
	},

	/**
	 * Set the value for the key object.
	 * @param {Variant} key1
	 * @param {Variant} key2
	 * @param {Variant} value
	 */
	set: function(key1, key2, value)
	{
		var map = this.getSecondLevelMap(key1, true);
		map.set(key2, value);
		return this;
	},
	/**
	 * Returns the value associated to the key object,
	 * @param {Variant} key1
	 * @param {Variant} key2
	 * @param {Variant} defaultValue Return this value if key does not exist.
	 * @returns {Variant}
	 */
	get: function(key1, key2, defaultValue)
	{
		var map = this.getSecondLevelMap(key1, false);
		if (map)
			return map.get(key2, defaultValue);
		else
			return defaultValue;
	},
	/**
	 * Check whether a value has been associated to the key object.
	 * @param {Variant} key1
	 * @param {Variant} key2
	 * @returns {Bool}
	 */
	has: function(key1, key2)
	{
		var map = this.getSecondLevelMap(key1, false);
		if (map)
			return map.has(key2);
		else
			return false;
	},
	/**
	 * Removes any value associated to the key object.
	 * @param {Variant} key1
	 * @param {Variant} key2
	 */
	remove: function(key1, key2)
	{
		var map = this.getSecondLevelMap(key1, false);
		if (map)
			return map.remove(key2);
	},
	/**
	 * Clear all key and values in map.
	 */
	clear: function()
	{
		this.map.clear();
		if (this._level1Cache)
			this._level1Cache = {};
	}
});

/**
 * Enumeration of coordinate mode.
 * @class
 */
Kekule.CoordMode = {
	/** Unknown dimension, not useful in most cases. */
	UNKNOWN: 0,
	/** 2D coordinate */
	COORD2D: 2,
	/** 3D coordinate */
	COORD3D: 3
};

/**
 * Class to help to define some classes with similar interfaces.
 * @class
 * @@private
 */
Kekule.ClassDefineUtils = {
	/// Methods to expand support for size2D and size3D property
	/**
	 * @class
	 * @private
	 */
	CommonSizeMethods:
	{
		/**
		 * Get size of specified mode.
		 * @param {Int} coordMode Value from {@link Kekule.CoordMode}, mode of coordinate.
		 * @param {Bool} allowSizeBorrow If corresponding size of 2D/3D not found, whether
		 *   size of another mode can be used instead.
		 *   If true, 2D size can be expanded to 3D one as {x, y, 0} and 3D
		 *   reduced to 2D one as {x, y}.
		 * @returns {Hash}
		 */
		getSizeOfMode: function(coordMode, allowSizeBorrow)
		{
			if (coordMode === Kekule.CoordMode.COORD3D)
				return this.getSize3D(allowSizeBorrow);
			else
				return this.getSize2D(allowSizeBorrow);
		},
		/**
		 * Set size of specified mode.
		 * @param {Hash} value Value of size. {x, y} or {x, y, z}.
		 * @param {Int} coordMode Value from {@link Kekule.CoordMode}, mode of coordinate.
		 */
		setSizeOfMode: function(value, coordMode)
		{
			if (coordMode === Kekule.CoordMode.COORD3D)
				return this.setSize3D(value);
			else
				return this.setSize2D(value);
		},
		/**
		 * Returns a min 2D box containing this object.
		 * @param {Int} coordMode Value from {@link Kekule.CoordMode}, mode of coordinate.
		 * @param {Bool} allowCoordBorrow
		 * @returns {Hash}
		 */
		getBoxOfMode: function(coordMode, allowCoordBorrow)
		{
			if (coordMode === Kekule.CoordMode.COORD3D)
				return this.getBox3D(allowCoordBorrow);
			else
				return this.getBox2D(allowCoordBorrow);
		}
	},
	/**
	 * @class
	 * @private
	 */
	Size2DMethods:
	{
		/*
		 * Get size2D property, if this property is null, then create new hash for it.
		 * Note this method will return a direct instance of size2D hash (instead of a
		 * clone as in getSize2D).
		 * @returns {Hash} {x, y}
		 */
		fetchSize2D: function()
		{
			var c = this.getPropStoreFieldValue('size2D');
			if (!c)
			{
				c = {};
				this.setPropStoreFieldValue('size2D', c);
			}
			return c;
		},
		/** @private */
		notifySize2DChanged: function(newValue)
		{
			this.notifyPropSet('size2D', newValue);
		},
		/**
		 * Check if this object has a 2D size.
		 * @param {Bool} allowSizeBorrow
		 * @returns {Bool}
		 */
		hasSize2D: function(allowSizeBorrow)
		{
			var c = this.getPropStoreFieldValue('size2D');  //this.getCoord2D();
			var result = (c) && ((typeof(c.x) != 'undefined') || (typeof(c.y) != 'undefined'));
			if ((!result) && allowSizeBorrow)
				result = this.hasSize3D? this.hasSize3D(): false;
			return result;
		},
		/**
		 * Returns a min 2D box containing this object.
		 * @param {Bool} allowCoordBorrow
		 * @returns {Hash}
		 */
		getBox2D: function(allowCoordBorrow)
		{
			var coord1 = this.getCoord2D(allowCoordBorrow) || {'x': 0, 'y': 0};
			var size = this.getSize2D(allowCoordBorrow);
			if (/*coord1 &&*/ size && (size.x || size.y))
			{
				// usually coord point is on top-left corner, in object coord system, y is on the largest edge
				// of object, so -size.y is used to get the bottom edge of box.
				var delta = {'x': size.x, 'y': -size.y};
				var coord2 = Kekule.CoordUtils.add(coord1, delta);
				return {'x1': coord1.x, 'y1': coord1.y, 'x2': coord2.x, 'y2': coord2.y};
			}
			else
				return {'x1': coord1.x, 'y1': coord1.y, 'x2': coord1.x, 'y2': coord1.y};
		},
		/**
		 * Get x (width) value of size2D property.
		 * @param {Bool} allowSizeBorrow
		 * @returns {Float} x
		 */
		get2DSizeX: function(allowSizeBorrow)
		{
			var c = this.getSize2D(allowSizeBorrow);
			return c? c.x || 0: 0;
		},
		/**
		 * Change x (width) value of size2D property.
		 * @param {Float} x
		 */
		set2DSizeX: function(x)
		{
			var c = this.fetchSize2D();
			if (c.x != x)
			{
				c.x = x;
				this.notifySize2DChanged(c);
			}
		},
		/**
		 * Get y (height) value of size2D property.
		 * @param {Bool} allowSizeBorrow
		 * @returns {Float} y
		 */
		get2DSizeY: function(allowSizeBorrow)
		{
			var c = this.getSize2D(allowSizeBorrow);
			return c? c.y || 0: 0;
		},
		/**
		 * Change y (height) value of size2D property.
		 * @param {Float} y
		 */
		set2DSizeY: function(y)
		{
			var c = this.fetchSize2D();
			if (c.y != y)
			{
				c.y = y;
				this.notifySize2DChanged(c);
			}
		}
	},
	/**
	 * @class
	 * @private
	 */
	Size3DMethods:
	{
		/*
		 * Get size3D property, if this property is null, then create new hash for it.
		 * Note this method will return a direct instance of size3D hash (instead of a
		 * clone as in getSize3D).
		 * @returns {Hash} {x, y}
		 */
		fetchSize3D: function()
		{
			var c = this.getPropStoreFieldValue('size3D');
			if (!c)
			{
				c = {};
				this.setPropStoreFieldValue('size3D', c);
			}
			return c;
		},
		/** @private */
		notifySize3DChanged: function(newValue)
		{
			this.notifyPropSet('size3D', newValue);
		},
		/**
		 * Check if this object has a 3D size.
		 * @param {Bool} allowSizeBorrow
		 * @returns {Bool}
		 */
		hasSize3D: function(allowSizeBorrow)
		{
			var c = this.getPropStoreFieldValue('size3D');
			var result = (c) && ((typeof(c.x) !== 'undefined') || (typeof(c.y) !== 'undefined') || (typeof(c.z) !== 'undefined'));
			if ((!result) && allowSizeBorrow)
				result = this.hasSize2D? this.hasSize2D(): false;
			return result;
		},
		/**
		 * Returns a min 3D box containing this object.
		 * @param {Bool} allowCoordBorrow
		 * @returns {Hash}
		 */
		getBox3D: function(allowCoordBorrow)
		{
			var coord1 = this.getCoord3D(allowCoordBorrow);
			var size = this.getSize3D(allowCoordBorrow);
			if (coord1 && size)
			{
				var coord2 = Kekule.CoordUtils.add(coord1, size);
				return {'x1': coord1.x, 'y1': coord1.y, 'z1': coord1.z, 'x2': coord2.x, 'y2': coord2.y, 'z2': coord2.z};
			}
		},
		/**
		 * Get x (width) value of size3D property.
		 * @param {Bool} allowSizeBorrow
		 * @returns {Float} x
		 */
		get3DSizeX: function(allowSizeBorrow)
		{
			var c = this.getSize3D(allowSizeBorrow);
			return c? c.x || 0: 0;
		},
		/**
		 * Change x (width) value of size3D property.
		 * @param {Float} x
		 */
		set3DSizeX: function(x)
		{
			var c = this.fetchSize3D();
			if (c.x != x)
			{
				c.x = x;
				this.notifySize3DChanged(c);
			}
		},
		/**
		 * Get y (height) value of size3D property.
		 * @param {Bool} allowSizeBorrow
		 * @returns {Float} y
		 */
		get3DSizeY: function(allowSizeBorrow)
		{
			var c = this.getSize3D(allowSizeBorrow);
			return c? c.y || 0: 0;
		},
		/**
		 * Change y (height) value of size3D property.
		 * @param {Float} y
		 */
		set3DSizeY: function(y)
		{
			var c = this.fetchSize3D();
			if (c.y != y)
			{
				c.y = y;
				this.notifySize3DChanged(c);
			}
		},
		/**
		 * Get z (depth) value of size3D property.
		 * @param {Bool} allowSizeBorrow
		 * @returns {Float} z
		 */
		get3DSizeZ: function(allowSizeBorrow)
		{
			var c = this.getSize3D(allowSizeBorrow);
			return c? c.z || 0: 0;
		},
		/**
		 * Change y (height) value of size3D property.
		 * @param {Float} z
		 */
		set3DSizeZ: function(z)
		{
			var c = this.fetchSize3D();
			if (c.z != z)
			{
				c.z = z;
				this.notifySize3DChanged(c);
			}
		}
	},
	/**
	 * Define size2D/size3D related properties and methods to a class.
	 * @param {Object} aClass Should be class object.
	 * @param {Array} props Which properties should be defined. e.g. ['size2D', 'size3D'].
	 *   If not set, all 2D and 3D properties will be defined.
	 */
	addStandardSizeSupport: function(aClass, props)
	{
		ClassEx.extend(aClass, Kekule.ClassDefineUtils.CommonSizeMethods);
		if ((!props) || (props.indexOf('size2D') >= 0))
		{
			ClassEx.defineProp(aClass, 'size2D', {
				'dataType': DataType.HASH,
				// clone result object so that user can not modify x/y directly from getter
				'getter': function(allowSizeBorrow, allowCreateNew)
				{
					var c = this.getPropStoreFieldValue('size2D');
					if ((!c) && allowSizeBorrow)
					{
						if (this.hasSize3D())
						{
							c = this.getSize3D();
						}
					}

					if ((!c) && allowCreateNew)
					{
						c = {'x': 0, 'y': 0};
						this.setPropStoreFieldValue('size2D', c);
					}

					var result = c? {'x': c.x, 'y': c.y}: undefined;
					if (result)
						result = Kekule.CoordUtils.absValue(result);    // size should always be positive value
					return result;
				},
				// clone value from input
				'setter': function(value)
				{
					var c = this.fetchSize2D();
					if (value.x !== undefined)
						c.x = value.x;
					if (value.y !== undefined)
						c.y = value.y;
					this.notifySize2DChanged(c);
				}
			});
			ClassEx.extend(aClass, Kekule.ClassDefineUtils.Size2DMethods);
		}
		if ((!props) || (props.indexOf('size3D') >= 0))
		{
			ClassEx.defineProp(aClass, 'size3D', {
				'dataType': DataType.HASH,
				// clone result object so that user can not modify x/y directly from getter
				'getter': function(allowSizeBorrow, allowCreateNew)
				{
					var c = this.getPropStoreFieldValue('size3D');

					if ((!c) && allowSizeBorrow)
					{
						if (this.hasSize2D())
						{
							c = this.getSize2D();
							c.z = 0;
						}
					}

					if ((!c) && allowCreateNew)
					{
						c = {'x': 0, 'y': 0, 'z': 0};
						this.setPropStoreFieldValue('size3D', c);
					}

					var result = c? {'x': c.x, 'y': c.y, 'z': c.z}: undefined;
					return result;
				},
				// clone value from input
				'setter': function(value){
					var c = this.fetchSize3D();
					if (value.x !== undefined)
						c.x = value.x;
					if (value.y !== undefined)
						c.y = value.y;
					if (value.z !== undefined)
						c.z = value.z;
					this.notifySize3DChanged(c);
				}
			});
			ClassEx.extend(aClass, Kekule.ClassDefineUtils.Size3DMethods);
		}
	},

	/// Methods to expand support for Coord2D and Coord3D property
	/**
	 * @class
	 * @private
	 */
	CommonCoordMethods:
	/** @lends Kekule.ClassDefineUtils.CommonCoordMethods# */
	{
		/**
		 * Returns the parent object that influences the abs coord of this object.
		 * @param {Int} coordMode
		 * @returns {Kekule.ChemObject}
		 */
		getCoordParent: function(coordMode)
		{
			return (this.getParent && this.getParent()) || null;
		},
		/**
		 * Get coordinate of specified mode.
		 * @param {Int} coordMode Value from {@link Kekule.CoordMode}, mode of coordinate.
		 * @param {Bool} allowCoordBorrow If corresponding coord of 2D/3D not found, whether
		 *   coord of another mode can be used instead.
		 *   If true, 2D coord can be expanded to 3D one as {x, y, 0} and 3D
		 *   reducts to 2D one as {x, y}.
		 * @returns {Hash}
		 */
		getCoordOfMode: function(coordMode, allowCoordBorrow)
		{
			if (coordMode === Kekule.CoordMode.COORD3D)
				return this.getCoord3D(allowCoordBorrow);
			else
				return this.getCoord2D(allowCoordBorrow);
		},
		/**
		 * Set coordinate of specified mode.
		 * @param {Hash} value Value of coordinate. {x, y} or {x, y, z}.
		 * @param {Int} coordMode Value from {@link Kekule.CoordMode}, mode of coordinate.
		 */
		setCoordOfMode: function(value, coordMode)
		{
			if (coordMode === Kekule.CoordMode.COORD3D)
				return this.setCoord3D(value);
			else
				return this.setCoord2D(value);
		},
		/**
		 * Get absolute coordinate of specified mode.
		 * @param {Int} coordMode Value from {@link Kekule.CoordMode}, mode of coordinate.
		 * @param {Bool} allowCoordBorrow
		 * @returns {Hash}
		 */
		getAbsCoordOfMode: function(coordMode, allowCoordBorrow)
		{
			if (coordMode === Kekule.CoordMode.COORD3D)
				return this.getAbsCoord3D(allowCoordBorrow);
			else
				return this.getAbsCoord2D(allowCoordBorrow);
		},
		/**
		 * Set absolute coordinate of specified mode.
		 * @param {Hash} value Value of coordinate. {x, y} or {x, y, z}.
		 * @param {Int} coordMode Value from {@link Kekule.CoordMode}, mode of coordinate.
		 */
		setAbsCoordOfMode: function(value, coordMode)
		{
			if (coordMode === Kekule.CoordMode.COORD3D)
				return this.setAbsCoord3D(value);
			else
				return this.setAbsCoord2D(value);
		}
	},
	/**
	 * @class
	 * @private
	 */
	Coord2DMethods:
	/** @lends Kekule.ClassDefineUtils.Coord2DMethods# */
	{
		/*
		 * Get coord2D property, if this property is null, then create new hash for it.
		 * Note this method will return a direct instance of coord2D hash (instead of a
		 * clone as in getCoord2D).
		 * //@param {Bool} allowCoordBorrow
		 * @returns {Hash} {x, y}
		 */
		fetchCoord2D: function(/*allowCoordBorrow*/)
		{
			var c = this.getPropStoreFieldValue('coord2D');
			if (!c)
			{
				c = {};
				this.setPropStoreFieldValue('coord2D', c);
			}
			return c;
			/*
			 console.log('fetch2D');
			 var result = this.getCoord2D(allowCoordBorrow, true);  // allow create
			 console.log(result);
			 return result;
			 */
		},
		/** @private */
		notifyCoord2DChanged: function(newValue)
		{
			this.notifyPropSet('coord2D', newValue);
		},
		/**
		 * Check if this node has a 2D coordinate.
		 * @param {Bool} allowCoordBorrow
		 * @returns {Bool}
		 */
		hasCoord2D: function(allowCoordBorrow)
		{
			var c = this.getPropStoreFieldValue('coord2D');  //this.getCoord2D();
			var result = (c) && ((typeof(c.x) != 'undefined') || (typeof(c.y) != 'undefined'));
			if ((!result) && allowCoordBorrow)
				result = this.hasCoord3D? this.hasCoord3D(): false;
			return result;
		},
		/**
		 * Get x coordinate of coord2D property.
		 * @param {Bool} allowCoordBorrow
		 * @returns {Float} x
		 */
		get2DX: function(allowCoordBorrow)
		{
			var c = this.getCoord2D(allowCoordBorrow);
			return c? c.x || 0: 0;
			//return this.hasCoord2D()? this.getCoord2D().x || 0: 0;
		},
		/**
		 * Change x coordinate of coord2D property.
		 * @param {Float} x
		 */
		set2DX: function(x)
		{
			var c = this.fetchCoord2D();
			if (c.x != x)
			{
				c.x = x;
				this.notifyCoord2DChanged(c);
			}
		},
		/**
		 * Get y coordinate of coord2D property.
		 * @param {Bool} allowCoordBorrow
		 * @returns {Float} y
		 */
		get2DY: function(allowCoordBorrow)
		{
			//return this.hasCoord2D()? this.getCoord2D().y || 0: 0;
			var c = this.getCoord2D(allowCoordBorrow);
			return c? c.y || 0: 0;
		},
		/**
		 * Change y coordinate of coord2D property.
		 * @param {Float} y
		 */
		set2DY: function(y)
		{
			var c = this.fetchCoord2D();
			if (c.y != y)
			{
				c.y = y;
				this.notifyCoord2DChanged(c);
			}
		}
	},
	/**
	 * @class
	 * @private
	 */
	Coord3DMethods:
	/** @lends Kekule.ClassDefineUtils.Coord3DMethods# */
	{
		/*
		 * Get coord3D property, if this property is null, then create new hash for it.
		 * Note this method will return a direct instance of coord2D hash (instead of a
		 * clone as in getCoord3D).
		 * //@param {Bool} allowCoordBorrow
		 * @returns {Hash} {x, y, z}
		 */
		fetchCoord3D: function(/*allowCoordBorrow*/)
		{
			var c = this.getPropStoreFieldValue('coord3D');
			if (!c)
			{
				c = {};
				this.setPropStoreFieldValue('coord3D', c);
			}
			return c;
			//return this.getCoord3D(allowCoordBorrow, true);  // allow create
		},
		/** @private */
		notifyCoord3DChanged: function(newValue)
		{
			this.notifyPropSet('coord3D', newValue);
		},
		/**
		 * Check if this node has a 3D coordinate.
		 * @param {Bool} allowCoordBorrow
		 * @returns {Bool}
		 */
		hasCoord3D: function(allowCoordBorrow)
		{
			var c = this.getPropStoreFieldValue('coord3D');  //this.getCoord3D();
			var result = (c) && ((typeof(c.x) != 'undefined') || (typeof(c.y) != 'undefined') || (typeof(c.z) != 'undefined'));
			if ((!result) && allowCoordBorrow)
				result = this.hasCoord2D? this.hasCoord2D(): false;
			return result;
		},
		/**
		 * Get x coordinate of coord3D property.
		 * @param {Bool} allowCoordBorrow
		 * @returns {Float} x
		 */
		get3DX: function(allowCoordBorrow)
		{
			//return this.hasCoord3D()? this.getCoord3D().x || 0: 0;
			var c = this.getCoord3D(allowCoordBorrow);
			return c? c.x || 0: 0;
		},
		/**
		 * Change x coordinate of coord3D property.
		 * @param {Float} x
		 */
		set3DX: function(x)
		{
			var c = this.fetchCoord3D();
			if (c.x != x)
			{
				c.x = x;
				this.notifyCoord3DChanged(c);
			}
		},
		/**
		 * Get y coordinate of coord3D property.
		 * @param {Bool} allowCoordBorrow
		 * @returns {Float} y
		 */
		get3DY: function(allowCoordBorrow)
		{
			//return this.hasCoord3D()? this.getCoord3D().y || 0: 0;
			var c = this.getCoord3D(allowCoordBorrow);
			return c? c.y || 0: 0;
		},
		/**
		 * Change y coordinate of coord3D property.
		 * @param {Float} y
		 */
		set3DY: function(y)
		{
			var c = this.fetchCoord3D();
			if (c.y != y)
			{
				c.y = y;
				this.notifyCoord3DChanged(c);
			}
		},
		/**
		 * Get z coordinate of coord3D property.
		 * @param {Bool} allowCoordBorrow
		 * @returns {Float} z
		 */
		get3DZ: function(allowCoordBorrow)
		{
			//return this.hasCoord3D()? this.getCoord3D().z || 0: 0;
			var c = this.getCoord3D(allowCoordBorrow);
			return c? c.z || 0: 0;
		},
		/**
		 * Change z coordinate of coord3D property.
		 * @param {Float} z
		 */
		set3DZ: function(z)
		{
			var c = this.fetchCoord3D();
			if (c.z != z)
			{
				c.z = z;
				this.notifyCoord3DChanged(c);
			}
		}
	},
	/**
	 * Define coord2D/coord3D related properties and methods to a class.
	 * @param {Object} aClass Should be class object.
	 * @param {Array} props Which properties should be defined. e.g. ['coord3D', 'absCoord3D'].
	 *   If not set, all 2D and 3D properties will be defined.
	 */
	addStandardCoordSupport: function(aClass, props)
	{
		ClassEx.extend(aClass, Kekule.ClassDefineUtils.CommonCoordMethods);
		if ((!props) || (props.indexOf('coord2D') >= 0))
		{
			ClassEx.defineProp(aClass, 'coord2D', {
				'dataType': DataType.HASH,
				// clone result object so that user can not modify x/y directly from getter
				'getter': function(allowCoordBorrow, allowCreateNew)
				{
					var c = this.getPropStoreFieldValue('coord2D');
					if ((!c) && allowCoordBorrow)
					{
						if (this.hasCoord3D())
						{
							c = this.getCoord3D();
						}
					}

					if ((!c) && allowCreateNew)
					{
						c = {'x': 0, 'y': 0};
						this.setPropStoreFieldValue('coord2D', c);
					}

					var result = c? {'x': c.x, 'y': c.y}: undefined;
					return result;

					/*
					 if (!this.hasCoord2D())
					 {
					 return undefined;
					 }
					 var c = this.getPropStoreFieldValue('coord2D');
					 if ((!c) && allowCreateNew)
					 this.setPropStoreFieldValue('coord2D', {});
					 var r = {};
					 r = Object.extend(r, c);
					 return r;
					 */
				},
				// clone value from input
				'setter': function(value)
				{
					var c = this.fetchCoord2D();
					if (value.x !== undefined)
						c.x = value.x;
					if (value.y !== undefined)
						c.y = value.y;
					this.notifyCoord2DChanged(c);
				}
			});
			ClassEx.extend(aClass, Kekule.ClassDefineUtils.Coord2DMethods);
		}
		if ((!props) || (props.indexOf('coord3D') >= 0))
		{
			ClassEx.defineProp(aClass, 'coord3D', {
				'dataType': DataType.HASH,
				// clone result object so that user can not modify x/y directly from getter
				'getter': function(allowCoordBorrow, allowCreateNew)
				{
					var c = this.getPropStoreFieldValue('coord3D');

					if ((!c) && allowCoordBorrow)
					{
						if (this.hasCoord2D())
						{
							c = this.getCoord2D();
							c.z = 0;
						}
					}

					if ((!c) && allowCreateNew)
					{
						c = {'x': 0, 'y': 0, 'z': 0};
						this.setPropStoreFieldValue('coord3D', c);
					}

					var result = c? {'x': c.x, 'y': c.y, 'z': c.z}: undefined;
					return result;
					/*
					 if (!this.hasCoord3D())
					 return undefined;
					 var c = this.getPropStoreFieldValue('coord3D');
					 if ((!c) && allowCreateNew)
					 this.setPropStoreFieldValue('coord2D', {});
					 var r = {};
					 r = Object.extend(r, c);
					 return r;
					 */
				},
				// clone value from input
				'setter': function(value){
					var c = this.fetchCoord3D();
					if (value.x !== undefined)
						c.x = value.x;
					if (value.y !== undefined)
						c.y = value.y;
					if (value.z !== undefined)
						c.z = value.z;
					this.notifyCoord3DChanged(c);
				}
			});
			ClassEx.extend(aClass, Kekule.ClassDefineUtils.Coord3DMethods);
		}
		if ((!props) || (props.indexOf('absCoord2D') >= 0))
		{
			ClassEx.defineProp(aClass, 'absCoord2D', {
				'dataType': DataType.HASH,
				'serializable': false,
				'getter': function(allowCoordBorrow){
					var c = this.getCoord2D(allowCoordBorrow) || {};
					//var p = this.getParent? this.getParent(): null;
					var p = this.getCoordParent(Kekule.CoordMode.COORD2D);
					var result;
					//if (p && p.hasCoord2D && p.hasCoord2D())  // has parent, consider parent coordinate to get absolute position
					if (p && p.getAbsCoord2D)
					{
						return Kekule.CoordUtils.add(c, p.getAbsCoord2D(allowCoordBorrow) || {});
					}
					else
						//return Object.extend({}, c);
						return {'x': c.x, 'y': c.y};
				},
				'setter': function(value, allowCoordBorrow){
					var c = value;
					var p = this.getCoordParent(Kekule.CoordMode.COORD2D);
					if (p && p.getAbsCoord2D) // has parent, consider parent coordinate to get absolute position
						c = Kekule.CoordUtils.substract(value, p.getAbsCoord2D(allowCoordBorrow));
					this.setCoord2D(c);
				}
			});
		}
		if ((!props) || (props.indexOf('absCoord3D') >= 0))
		{
			ClassEx.defineProp(aClass, 'absCoord3D', {
				'dataType': DataType.HASH,
				'serializable': false,
				'getter': function(allowCoordBorrow){
					var c = this.getCoord3D(allowCoordBorrow) || {};
					//var p = this.getParent? this.getParent(): null;
					var p = this.getCoordParent(Kekule.CoordMode.COORD3D);
					//if (p && p.hasCoord3D && p.hasCoord3D())  // has parent, consider parent coordinate to get absolute position
					if (p && p.getAbsCoord3D)
						return Kekule.CoordUtils.add(c, p.getAbsCoord3D(allowCoordBorrow) || {});
					else
						//return Object.extend({}, c);
						return {'x': c.x, 'y': c.y, 'z': c.z};
				},
				'setter': function(value, allowCoordBorrow){
					var c = value;
					var p = this.getCoordParent(Kekule.CoordMode.COORD2D);
					if (p && p.getAbsCoord3D) // has parent, consider parent coordinate to get absolute position
						c = Kekule.CoordUtils.substract(value, p.getAbsCoord3D(allowCoordBorrow));
					this.setCoord3D(c);
				}
			});
		}
	},


	/// Methods to expand support for ExtraObjMap
	/**
	 * @class
	 * @private
	 */
	ExtraObjMapMethods: {
		/**
		 * Get extra mapped property of obj.
		 * @param {Object} obj
		 * @param {String} propName
		 * @returns {Variant} If propName is set, returns the prop value. Otherwise return a hash contains all extra properties.
		 * @private
		 */
		getExtraProp: function(obj, propName)
		{
			var info = this.getExtraObjMap().get(obj);
			if (info)
				return propName? info[propName]: info;
			else
				return undefined;
		},
		/**
		 * Set extra mapped property of obj.
		 * @param {Object} obj
		 * @param {String} propName
		 * @param {Variant} propValue
		 * @private
		 */
		setExtraProp: function(obj, propName, propValue)
		{
			var info = this.getExtraProp(obj);
			if (info)
				info[propName] = propValue;
			else
			{
				var info = {};
				info[propName] = propValue;
				this.getExtraObjMap().set(obj, info);
			}
		},
		/**
		 * Remove extra mapped property of obj.
		 * @param {Object} obj
		 * @param {String} propName If not set, all properties on obj will be removed.
		 * @private
		 */
		removeExtraProp: function(obj, propName)
		{
			if (propName)
			{
				var info = this.getExtraProp(obj);
				info[propName] = undefined;
				delete info[propName];
			}
			else
				this.getExtraObjMap().remove(obj);
		}
	},

	/**
	 * Define extraObjMap related properties and methods to a class.
	 * @param {Object} aClass Should be class object.
	 */
	addExtraObjMapSupport: function(aClass)
	{
		var	mapName = 'extraObjMap';
		ClassEx.defineProp(aClass, mapName, {
			'dataType': 'Kekule.MapEx', 'serializable': false,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue(mapName);
				if (!result)
				{
					result = new Kekule.MapEx(true, true);  // enable cache
					this.setPropStoreFieldValue(mapName, result);
				}
				return result;
			}
		});
		ClassEx.extend(aClass, Kekule.ClassDefineUtils.ExtraObjMapMethods);
	},

	/**
	 * @class
	 * @private
	 */
	ExtraTwoTupleObjMapMethods: {
		/**
		 * Get extra mapped property of obj.
		 * @param {Object} obj1
		 * @param {Object} obj2
		 * @param {String} propName
		 * @returns {Variant} If propName is set, returns the prop value. Otherwise return a hash contains all extra properties.
		 * @private
		 */
		getExtraProp2: function(obj1, obj2, propName)
		{
			var info = (this.__$__k__extraTwoTupleObjMap__$__ || this.getExtraTwoTupleObjMap()).get(obj1, obj2);
			if (info)
				return propName? info[propName]: info;
			else
				return undefined;
		},
		/**
		 * Set extra mapped property of obj.
		 * @param {Object} obj1
		 * @param {Object} obj2
		 * @param {String} propName
		 * @param {Variant} propValue
		 * @private
		 */
		setExtraProp2: function(obj1, obj2, propName, propValue)
		{
			var info = this.getExtraProp2(obj1, obj2);
			if (info)
				info[propName] = propValue;
			else
			{
				var info = {};
				info[propName] = propValue;
				(this.__$__k__extraTwoTupleObjMap__$__ || this.getExtraTwoTupleObjMap()).set(obj1, obj2, info);
			}
		},
		/**
		 * Remove extra mapped property of obj.
		 * @param {Object} obj1
		 * @param {Object} obj2
		 * @param {String} propName If not set, all properties on obj will be removed.
		 * @private
		 */
		removeExtraProp2: function(obj1, obj2, propName)
		{
			if (propName)
			{
				var info = this.getExtraProp2(obj1, obj2);
				info[propName] = undefined;
				delete info[propName];
			}
			else
				this.getExtraTwoTupleObjMap().remove(obj1, obj2);
		}
	},
	addExtraTwoTupleObjMapSupport: function(aClass)
	{
		var	mapName = 'extraTwoTupleObjMap';
		ClassEx.defineProp(aClass, mapName, {
			'dataType': 'Kekule.TwoTupleMapEx', 'serializable': false,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue(mapName);
				if (!result)
				{
					result = new Kekule.TwoTupleMapEx(true, true);  // enable cache
					this.setPropStoreFieldValue(mapName, result);
					this.__$__k__extraTwoTupleObjMap__$__ = result;  // a field to store the map, for performance
				}
				return result;
			}
		});
		ClassEx.extend(aClass, Kekule.ClassDefineUtils.ExtraTwoTupleObjMapMethods);
	}
};


/**
 * A manager class to store object property settings.
 * Settings is a hash with property name and values, e.g.:
 *   {'id': 'object1', 'enabled': false}.
 * Those settings can be applied to instance of {@link Kekule.ChemObject}
 * by {@link Kekule.ChemObject.predefinedSetting} property.
 * Settings can be get out by settingName which is recommended to have name like 'Kekule.ChemObject.Setting1'.
 * Name of object class should be used as a prefix. Then user can use code chemObject.setPredefinedSetting('Setting1')
 * to set settings.
 * @class
 */
Kekule.ObjPropSettingManager = {
	/** @private */
	_items: new Kekule.MapEx(true),
	register: function(name, settings)
	{
		Kekule.ObjPropSettingManager._items.set(name, settings);
	},
	unregister: function(name)
	{
		Kekule.ObjPropSettingManager._items.remove(name);
	},
	getSetting: function(name)
	{
		return Kekule.ObjPropSettingManager._items.get(name);
	}
};

// predefinedSetting string can be split by ',', each setting will be applied to object one by one
ClassEx.defineProp(ObjectEx, 'predefinedSetting', {'dataType': DataType.STRING,
	'scope': Class.PropertyScope.PUBLIC,
	'setter': function(value)
	{
		var vs = Kekule.StrUtils.splitTokens(value || '', ',');
		//console.log('predefine', this.getClassName(), vs);

		if (vs.length)
		{
			for (var i = 0, l = vs.length; i < l; ++i)
			{
				var currClass = this.getClass();
				var v = vs[i];
				var setting = null;
				var sname = '';
				while (currClass && !setting)
				{
					var cname = ClassEx.getClassName(currClass);
					var sname = cname + '.' + v;
					var setting = Kekule.ObjPropSettingManager.getSetting(sname);
					currClass = ClassEx.getSuperClass(currClass);
				}

				if (!setting)
				{
					setting = Kekule.ObjPropSettingManager.getSetting(v);
					//sname = v;
				}
				if (setting)
				{
					this.setPropValues(setting);
				}
			}
			this.setPropStoreFieldValue('predefinedSetting', sname);
		}
	}
});

/**
 * Enumeration of types of updating a object in object tree.
 * @enum
 */
Kekule.ObjectTreeOperation = {
	/** Modify a existing object in tree. */
	MODIFY: 0,
	/** Add a new object to tree. */
	ADD: 1,
	/** Remove a existing object from tree. */
	REMOVE: 2
};

/**
 * Enumeration of interaction types of chem objects in editor.
 * @enum
 */
Kekule.ChemObjInteractMode = {
	/* A default object, can be selected and moved alone. */
	DEFAULT: 0,
	/* Can be selected but can not be moved alone. */
	UNMOVABLE: 1,
	/* Can be moved but can not be selected alone. */
	UNSELECTABLE: 2,
	/** A uninteractive object, can not be selected or moved alone */
	HIDDEN: 3
};

/**
 * Enumeration of comparison method for {@link Kekule.ChemObject.compare} method.
 * @enum
 */
Kekule.ComparisonMethod = {
	/** Use default behavior. Different object may have different behaviors. */
	DEFAULT: 0,
	/* Explicitly set comparing on object properties directly. */
	PROPERTIES: 1,
	/** Compare only chemistry structures. */
	CHEM_STRUCTURE: 10
};

/**
 *  A util class to compare Kekule objects through {@link Kekule.ChemObject.compare} method.
 *  @class
 */
Kekule.ObjComparer = {

	/**
	 * Check if two objects are equivalent.
	 * @param {Kekule.ChemObj} obj1
	 * @param {Kekule.ChemObj} obj2
	 * @param {Hash} options Comparison objects, different class may require different options. <br />
	 *   For example, you can use {'method': {@link Kekule.ComparisonMethod.CHEM_STRUCTURE}} to indicating that only the chem structure
	 *   data should be compared. <br />
	 *   You can also use {'properties': ['propName1', 'propName2']} to manually assign properties that
	 *   need to be compared. <br />
	 *   Custom comparison method can also be appointed as {'customMethod': myComparisonFunc}, then the
	 *   comparison will be actually called as myComparisonFunc(thisObj, targetObj, options).
	 * @returns {Bool}
	 */
	equal: function(obj1, obj2, options)
	{
		return Kekule.ObjComparer.compare(obj1, obj2, options) === 0;
	},
	/**
	 * Compare two objects.
	 * @param {Kekule.ChemObj} obj1
	 * @param {Kekule.ChemObj} obj2
	 * @param {Hash} options Comparison objects, different class may require different options. <br />
	 *   For example, you can use {'method': {@link Kekule.ComparisonMethod.CHEM_STRUCTURE}} to indicating that only the chem structure
	 *   data should be compared. <br />
	 *   You can also use {'properties': ['propName1', 'propName2']} to manually assign properties that
	 *   need to be compared. <br />
	 *   Custom comparison method can also be appointed as {'customMethod': myComparisonFunc}, then the
	 *   comparison will be actually called as myComparisonFunc(thisObj, targetObj, options).
	 * @returns {Int} Returns 0 when two objects are equivalent,
	 *   or -1 for "inferior" to obj1 and +1 for "superior" to obj1.
	 */
	compare: function(obj1, obj2, options)
	{
		return Kekule.ObjComparer._compareValue(obj1, obj2, options);
	},
	/**
	 * Compare on two values, used for object comparison.
	 * @param {Variant} v1
	 * @param {Variant} v2
	 * @param {Hash} options
	 * @returns {Int}
	 * @private
	 */
	_compareValue: function(v1, v2, options)
	{
		var D = DataType;
		if (v1 === v2)
			return 0;
		// the two following comparison handles same type simple values, such as number, bool, string and date
		if (v1 < v2 && !(v1 > v2))
			return -1;
		else if (v1 > v2 && !(v1 < v2))
			return 1;
		else  // need more complex check
		{
			var result = null;  // not determinated
			var type1 = D.getType(v1);
			var type2 = D.getType(v2);
			if (type1 !== type2)  // not same type
			{
				var typeIndexes = [
					D.UNKNOWN, D.VARIANT, D.UNDEFINED, D.BOOL, D.NUMBER, D.INT, D.FLOAT,
					D.STRING, D.ARRAY, D.FUNCTION, D.DATE, D.OBJECT, D.OBJECTEX, D.CLASS
				];
				var index1 = typeIndexes.indexOf(type1);
				var index2 = typeIndexes.indexOf(type2);
				if (index1 < 0 && index2 < 0)  // all unknown type
					result = null;  // can not determinate, suspend
				else
					result = index1 - index2;
			}
			else // with the same type, usually function and objects
			{
				if (!v1 && v2)  // v1 is null, 0, false, undefined etc. but v2 not
					result = -1;
				else if (v1 && !v2)  // on the contrary, here there is no possiblity that !v1 && !v2
					result = 1;
				else  // v1 && v2
				{
					if (v1.doCompare)
						result = v1.doCompare(v2, options);
					else if (v2.doCompare)
						result = -v2.doCompare(v1, options);
					else // no compare method
					{
						if (type1 === DataType.ARRAY)  // compare array
						{
							result = v1.length - v2.length;
							if (!result)
							{
								for (var i = 0, l = v1.length; i < l; ++i)
								{
									result = Kekule.ObjComparer._compareValue(v1[i], v2[i], options);
									if (!!result)
										break;
								}
							}
						}
						else if (type1 === DataType.OBJECT)  // two values are objects
						{
							// TODO: not very efficient, need to refine in future
							var s1 = JSON.toString(v1);
							var s2 = JSON.toString(v2);
							result = (s1 < s2)? -1:
									(s1 > s2)? 1: 0;
						}
						else
							result = null;
					}
				}
			}

			if (result === null)  // undeterminated in above
			{
				var s1 = (v1.toString && v1.toString()) || '';
				var s2 = (v2.toString && v2.toString()) || '';
				result = (s1 < s2)? -1:
						(s1 > s2)? 1: null;
				// if s1 === s2, we still can not determinate, here we simply returns -1
				if (result === null)
					result = -1;
			}
			return result;
		}
	}
};

/** @ignore */
var S_PREFIX_OBJ_REF = '@';  // internal const
/**
 * Root class for all object related to chemistry in Kekule library.
 * @class
 * @augments ObjectEx
 * @param {String} id Id of this object.
 * @property {String} id Id of this object. Can be set by users.
 * @property {Int} interactMode Value from {@link Kekule.ChemObjInteractMode}.
 * //@property {String} iid Internal ID of object, when an instance is created, an unique iid will be
 * //  set automatically. This value is helpful to find a special object in molecule or chem space.
 * //  User should not set or modify this value.
 * @property {Kekule.ChemSpace} owner Owner of this object. Can be null.
 * @property {Array} scalarAttribs Scalar attributes about this object. Each item should be {@link Kekule.Scalar}.
 * @property {Hash} info Additional information of object, for example:
 *   {
 *     title: 'Object Title',
 *     author: 'Author Name'
 *   }
 * @property {Kekule.ChemObject} parent Direct parent object.
 * @property {Kekule.ChemObject} owner
 * @property {Object} srcInfo Stores the source data of ChemObject when read object from external file, a object that
 *   can has the following fields: {data, dataType, format, mimeType, fileExt, possibleFileExts, url}.
 * //@property {String} role The role of this object in chem document.
 * //  Instances of one class may act as different roles in a chem document. For example, arrow arc linking to atoms/bonds
 * //  act as electron pushing arrow, while the stand alone one should be only a arrow marker.
 * @property {Bool} isEditing Indicating whether the object is being edited in a editor.
 */
/**
 * Invoked when this object has been added to a parent as child.
 * Event has field: {obj: this added child object, parent: the parent object}.
 * @name Kekule.ChemObject#addToObjTree
 * @event
 */
/**
 * Invoked when an object has been removed from parent.
 * Event has field: {obj: this removed child object, parent: the parent object}.
 * @name Kekule.ChemObject#removeFromObjTree
 * @event
 */
/**
 * Invoked when this object has been added to a chemspace.
 * Event has field: {obj: this added child object, owner: the owner chemspace}.
 * @name Kekule.ChemObject#addToSpace
 * @event
 */
/**
 * Invoked when an object has been removed from a chemspace.
 * Event has field: {obj: this removed child object, owner: the owner chemspace}.
 * @name Kekule.ChemObject#removeFromSpace
 * @event
 */
Kekule.ChemObject = Class.create(ObjectEx,
/** @lends Kekule.ChemObject# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemObject',
	/** @constructs */
	initialize: function($super, id)
	{
		$super();
		$super();
		if (id)
			this.setId(id);
		this.setBubbleEvent(true);  // allow event bubble

		this.__load_owner_objRef_props__ = null;  // used internally
		this.__load_parent_objRef_props__ = null;  // used internally

		// react on change (both on self and children)
		// when object is modified,clear srcInfo information

		this.addEventListener('change', function(e)
		{
			var srcInfo = this.getPropStoreFieldValue('srcInfo');
			if (srcInfo && srcInfo.data)
			{
				var target = e.target;
				var propNames = e.changedPropNames;
				var clearSrcInfo = false;
				for (var i = 0, l = propNames.length; i < l; ++i)
				{
					var name = propNames[i];
					if (name && name !== 'srcInfo' && target.isPropertySerializable(name))
					{
						clearSrcInfo = true;
						break;
					}
					else if (name === '[children]') // special prop name indicating children has been changed
					{
						clearSrcInfo = true;
						break;
					}
				}
				if (clearSrcInfo)
				{
					//this.setPropStoreFieldValue('srcInfo', undefined);
					//console.log('clear src info', propNames);
					srcInfo.data = null;
				}
			}
		}, this);

	},
	/** @private */
	doFinalize: function($super)
	{
		/*
		this.setParent(null);
		this.setOwner(null);
		*/
		this.__load_owner_objRef_props__ = null;
		this.__load_parent_objRef_props__ = null;
		this.removeSelf();
		$super();
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('id', {'dataType': DataType.STRING});
		this.defineProp('interactMode', {'dataType': DataType.INT});
		/*
		this.defineProp('iid', {
			'dataType': DataType.STRING, 'scope': Class.PropertyScope.PRIVATE
		});
		*/
		this.defineProp('info',
			{
				'dataType': DataType.HASH,
				'getter': function(canCreate)
				{
					var r = this.getPropStoreFieldValue('info');
					if ((!r) && canCreate)
					{
						r = {};
						this.setPropStoreFieldValue('info', r);
					}
					return r;
				}
			});
		this.defineProp('scalarAttribs', {
			'dataType': DataType.ARRAY,
			'setter': null
		});
		this.defineProp('parent', {'dataType': 'Kekule.ChemObject', 'serializable': false, 'scope': Class.PropertyScope.PUBLIC,
			'setter': function(value)
				{
					var oldParent = this.getParent();
					if (oldParent === value)
						return;
					if (oldParent && oldParent._removeChildObj)  // remove from old parent
					{
						oldParent._removeChildObj(this);
						this.invokeEvent('removeFromObjTree', {'obj': this, 'parent': oldParent});
					}
					this.setPropStoreFieldValue('parent', value);
					if (value && value._appendChildObj)  // add to new parent
					{
						value._appendChildObj(this);
						this.invokeEvent('addToObjTree', {'obj': this, 'parent': value});
					}
					this.parentChanged(value, oldParent);
				}
		});
		this.defineProp('owner', {
			'dataType': 'Kekule.ChemSpace',
			'serializable': false,
			'scope': Class.PropertyScope.PUBLIC,
			'setter': function(value)
				{
					var oldOwner = this.getOwner();
					if (oldOwner === value)
						return;
					if (oldOwner)
					{
						oldOwner._removeOwnedObj(this);
						this.invokeEvent('removeFromSpace', {'obj': this, 'owner': oldOwner});
					}
					this.setPropStoreFieldValue('owner', value);
					if (value)
					{
						value._appendOwnedObj(this);
						this.invokeEvent('addToSpace', {'obj': this, 'owner': oldOwner});
					}
					this.ownerChanged(value, oldOwner);
				}
		});
		this.defineProp('srcInfo', {'dataType': DataType.OBJECT,
			'serializable': false,  // not allowed to assign from objects and save to stream
			'scope': Class.PropertyScope.PUBLISHED,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('srcInfo');
				if (!result)
				{
					result = {};
					this.setPropStoreFieldValue('srcInfo', result);
				}
				return result;
			}
		});
		//this.defineProp('role', {'dataType': DataType.STRING});

		this.defineProp('isEditing', {'dataType': DataType.BOOL, 'serializable': false, 'scope': Class.PropertyScope.PUBLIC,
			'getter': function() {
				var owner = this.getOwner();
				if (owner && owner.getIsEditing)
					return owner.getIsEditing();
				else
					return this.getPropStoreFieldValue('isEditing');
			}
		});
		// prop isEditing should never be saved, it should set by editor when loading chem space
	},
	/** @ignore */
	initPropValues: function($super)
	{
		$super();
		this.setEnableObjectChangeEvent(true);
	},

	/** @private */
	getHigherLevelObj: function()
	{
		return this.getParent() || this.getOwner();
	},

	/**
	 * Return a prefix to automatically generate id of chem object.
	 * Descendants should override this method.
	 * @returns {String}
	 * @private
	 */
	getAutoIdPrefix: function()
	{
		return 'o';
	},

	/**
	 * Called when the parent of this object has been loaded/deserialized from external data.
	 * Descendants may override this method to do some extra jobs after loading.
	 * @param {Kekule.ChemObject} parent
	 * @private
	 */
	_parentObjectLoaded: function(parent)
	{
		this._handleObjRefProps(parent, this.__load_parent_objRef_props__);
	},

	/**
	 * Called when the owner of this object has been loaded/deserialized from external data.
	 * Descendants may override this method to do some extra jobs after loading.
	 * @param {Kekule.ChemSpace} owner
	 * @private
	 */
	_ownerObjectLoaded: function(owner)
	{
		this._handleObjRefProps(owner, this.__load_owner_objRef_props__);
	},

	/** @private */
	_handleObjRefProps: function(rootObj, refValueStorage)
	{
		var objRefPropInfo = refValueStorage;  // this.__load_owner_objRef_props__;
		if (objRefPropInfo)
		{
			if (rootObj && rootObj.getChildAtIndexStack)
			{
				var propNames = Kekule.ObjUtils.getOwnedFieldNames(objRefPropInfo);
				for (var i = 0, l = propNames.length; i < l; ++i)
				{
					var propName = propNames[i];
					var objRefValue = objRefPropInfo[propName];
					if (DataType.isArrayValue(objRefValue))
					{
						var values = [];
						for (var i = 0, l = objRefValue.length; i < l; ++i)
						{
							var indexStack = this._doUnwrapObjRefSerializationStr(this, objRefValue[i]);
							if (indexStack)
							{
								var obj = rootObj.getChildAtIndexStack(indexStack);
								values.push(obj);
							}
							else
								values.push(undefined);
						}
						this.setPropValue(propName, values);
					}
					else  // simple str
					{
						var value;
						var indexStack = this._doUnwrapObjRefSerializationStr(this, objRefValue);
						if (indexStack)
							value = rootObj.getChildAtIndexStack(indexStack);
						else  // not a obj ref str, do nothing currently
							;
						if (value)
						{
							//console.log('set ref prop value', propName, indexStack, value);
							this.setPropValue(propName, value);
						}
					}

					try
					{
						delete objRefPropInfo[propName];
					}
					catch (e)
					{

					}
				}
			}
		}
	},

	// custom save / load method
	/** @private */
	doSaveProp: function(obj, prop, storageNode, serializer)
	{
		/*
		if (prop.name === 'testRefObj')
			console.log('prepare save', prop.name, prop, obj.getOwner());
		*/
		if (!prop.serializable)
			return;
		if (obj._doGetObjRefSerializationValue)
		{
			var isObjRefProp = !!prop.objRef;
			if (isObjRefProp)  // this property is an object reference, refers to another object(s) in this chem space
			{
				var objRefRootOnParent = (prop.objRefRoot === 'parent');
				var rootObj = objRefRootOnParent? obj.getParent(): obj.getOwner(); // default is based on owner
				if (rootObj)
				{
					var value = obj.getPropValue(prop.name);
					if (value)
					{
						if (Kekule.ArrayUtils.isArray(value))  // maybe an array of object references
						{
							//if (prop.dataType === DataType.ARRAY)
							{
								var serializationValues = [];
								for (var i = 0, l = value.length; i < l; ++i)
								{
									var sv = obj._doGetObjRefSerializationValue(rootObj, obj, value[i]);
									if (sv)
										serializationValues.push(sv);
									else
										serializationValues.push(value[i]);  // those who can not be transformed, keep it
								}
								serializer.doSaveFieldValue(obj, prop.name, serializationValues, storageNode, serializer.getValueExplicitType(serializationValues));
								return true;
							}
						}
						else // single object reference
						{
							var serializationValue = obj._doGetObjRefSerializationValue(rootObj, obj, value);
							if (serializationValue)
							{
								serializer.doSaveFieldValue(obj, prop.name, serializationValue, storageNode, serializer.getValueExplicitType(serializationValue));
								return true;  // handled, do not save again in default action
							}
						}
					}
				}
			}
		}
	},
	/** @private */
	_doGetObjRefSerializationValue: function(owner, currObj, objRef)
	{
		var indexStack = owner.indexStackOfChild(objRef);
		//console.log('indexStack', indexStack);
		if (indexStack && indexStack.length)
		{
			var str = S_PREFIX_OBJ_REF + JSON.stringify(indexStack);
			return str;
		}
		else
			return null;
	},
	/** @private */
	doLoadProp: function(obj, prop, storageNode, serializer)
	{
		if (!prop.serializable)
			return;
		//var owner = obj.getOwner();  // on loading, the owner may not be set yet
		//if (owner)
		{
			var isObjRefProp = !!prop.objRef;
			if (isObjRefProp)  // this property is an object reference, refers to another object(s) in this chem space
			{
				var objRefRootOnParent = (prop.objRefRoot === 'parent');
				var storageObj = objRefRootOnParent? obj.__load_parent_objRef_props__: obj.__load_owner_objRef_props__; // default is based on owner
				if (!storageObj)
				{
					storageObj = {};
					if (objRefRootOnParent)
						obj.__load_parent_objRef_props__ = storageObj;
					else
						obj.__load_owner_objRef_props__ = storageObj;
				}
				// retrieve the ref str first
				var value = serializer.doLoadFieldValue(obj, prop.name, storageNode /*, DataType.STRING*/);
				if (value)
				{
					if (typeof(value) === 'string' && value.startsWith(S_PREFIX_OBJ_REF))  // maybe a reference string
					{
						//var indexStack = this._doUnwrapObjRefSerializationStr(obj, prop, value);
						//if (indexStack)
						{
							storageObj[prop.name] = value;  // save this index stack string, and set the real object after the chem space is loaded
							return true;    // handled, do not load again in default action
						}
					}
					else if (DataType.isArrayValue(value))  // may be an ref array
					{
						storageObj[prop.name] = value;  // save this index stack array, and set the real object after the chem space is loaded
						return true;    // handled, do not load again in default action
					}
				}
				//return true;  // handled, do not load again in default action
			}
		}
	},
	/** @private */
	_doUnwrapObjRefSerializationStr: function(currObj, serializationStr)
	{
		try
		{
			var jsonStr = serializationStr.substr(1);  // remove leading @
			var indexStack = JSON.parse(jsonStr);
			if (DataType.isArrayValue(indexStack))
			{
				return indexStack;
			}
			else
				return null;
		}
		catch(e)
		{
			Kekule.error(e);
		}
	},

	/** @private */
	loaded: function($super)
	{
		$super();
		this.notifyParentLoaded();
	},

	/** @private */
	notifyParentLoaded: function()
	{
		// when the whole object is loaded from external data, notify all child objects.
		for (var i = 0, l = this.getChildCount(); i < l; ++i)
		{
			var child = this.getChildAt(i);
			if (child && child._parentObjectLoaded)
				child._parentObjectLoaded(this);
		}
	},

	/** @private */
	isObjRefProperty: function(prop)
	{
		return !!(prop && prop.objRef);
	},
	/** @ignore */
	notifyPropSet: function($super, propName, newValue, doNotEvokeObjChange)
	{
		$super(propName, newValue, doNotEvokeObjChange);
		// if a obj ref property is modified, inform the owner
		var prop = this.getPropInfo(propName);
		if (prop && this.isObjRefProperty(prop))
		{
			var owner = this.getOwner();
			if (owner && owner.modifyObjRefRelation)
			{
				owner.modifyObjRefRelation(this, prop, this.getPropValue(prop.name));
			}
		}
	},

	/**
	 * Returns all object reference properties in this object.
	 * @returns {Array}
	 * @private
	 */
	getObjRefProperties: function()
	{
		var result = [];
		var props = this.getAllPropList();
		for (var i = 0, l = props.getLength(); i < l; ++i)
		{
			var prop = props.getPropInfoAt(i);
			if (this.isObjRefProperty(prop))
				result.push(prop);
		}
		return result;
	},
	/**
	 * Register all object reference property relations to current owner.
	 * @param {Kekule.ChemSpace} owner
	 * @private
	 */
	_registerObjRefRelations: function(owner)
	{
		if (owner && owner.modifyObjRefRelation)
		{
			var props = this.getObjRefProperties();
			if (props.length)
			{
				for (var i = 0, l = props.length; i < l; ++i)
				{
					var prop = props[i];
					var value = this.getPropValue(prop.name);
					//console.log('register relations', owner.getClassName(), prop.name, !!value);
					owner.modifyObjRefRelation(this, prop, value);
				}
			}
		}
	},
	/**
	 * Unregister all object reference property relations to current owner.
	 * @param {Kekule.ChemSpace} owner
	 * @private
	 */
	_unregisterObjRefRelations: function(owner)
	{
		if (owner && owner.releaseObjRefRelation)
		{
			var props = this.getObjRefProperties();
			if (props.length)
			{
				for (var i = 0, l = props.length; i < l; ++i)
				{
					var prop = props[i];
					//console.log('unregister relations', owner.getClassName(), prop.name);
					owner.releaseObjRefRelation(this, prop);
				}
			}
		}
	},

	/**
	 * Check whether this object can be selected alone in editor.
	 */
	isSelectable: function()
	{
		var IM = Kekule.ChemObjInteractMode;
		var interactMode = this.getInteractMode() || IM.DEFAULT;
		return !(interactMode & IM.UNSELECTABLE);
	},
	/**
	 * Check whether this object can be moved alone in editor.
	 */
	isMovable: function()
	{
		var IM = Kekule.ChemObjInteractMode;
		var interactMode = this.getInteractMode() || IM.DEFAULT;
		return !(interactMode & IM.UNMOVABLE);
	},
	/**
	 * Returns nearest selectable chem object.
	 * Usually this method will return this object, but if this object is not selectable,
	 * parent object will be returned instead.
	 * @returns {Kekule.ChemObject}
	 */
	getNearestSelectableObject: function()
	{
		return this.isSelectable()? this:
			this.getParent()? this.getParent().getNearestSelectableObject():
			null;
	},
	/**
	 * Returns nearest movable chem object.
	 * Usually this method will return this object, but if this object is not selectable,
	 * parent object will be returned instead.
	 * @returns {Kekule.ChemObject}
	 */
	getNearestMovableObject: function()
	{
		return this.isMovable()? this:
				this.getParent()? this.getParent().getNearestMovableObject():
				null;
	},

	/**
	 * Remove current object away from parent and owner.
	 */
	removeSelf: function()
	{
		this.setParent(null);
		this.setOwner(null);
	},

	/** @private */
	notifyScalarAttribsChange: function()
	{
		this.notifyPropSet('scalarAttribs', this.getPropStoreFieldValue('scalarAttribs'));
	},
	/** @private */
	notifyInfoChange: function()
	{
		this.notifyPropSet('info', this.getPropStoreFieldValue('info'));
	},

	/**
	 * Called when a child obj is removed from this parent.
	 * User should not call this method directly
	 * @param {Kekule.ChemObject} obj
	 * @private
	 */
	_removeChildObj: function(obj)
	{
		this._notifyOwnerObjTreeOperation(obj, this, Kekule.ObjectTreeOperation.REMOVE);
	},
	/**
	 * Called when a child obj is added to this parent.
	 * User should not call this method directly
	 * @param {Kekule.ChemObject} obj
	 * @private
	 */
	_appendChildObj: function(obj)
	{
		this._notifyOwnerObjTreeOperation(obj, this, Kekule.ObjectTreeOperation.ADD);
	},

	/**
	 * Notify the owner that a obj has been added or removed from object tree.
	 * @param {Kekule.ChemObject} obj
	 * @param {Kekule.ChemObject} parent
	 * @param {Int} operation
	 * @private
	 */
	_notifyOwnerObjTreeOperation: function(obj, parent, operation)
	{
		var owner = this.getOwner();
		if (owner && owner._notifyObjTreeOperation)
		{
			owner._notifyObjTreeOperation(obj, parent, operation);
		}
	},

	/**
	 * Called when the owner's object tree has been changed (child added or removed to/from parent).
	 * Descendants may override this method to update itself.
	 * @param {Kekule.ChemObject} obj
	 * @param {Kekule.ChemObject} parent
	 * @param {Int} operation
	 */
	objTreeOfOwnerUpdated: function(obj, parent, operation)
	{
		// do nothing here
	},
	/**
	 * Called when the owner's object tree has been changed (child added or removed from space).
	 * Descendants may override this method to update itself.
	 * @param {Kekule.ChemObject} obj
	 * @param {Kekule.ChemObject} owner
	 * @param {Int} operation
	 */
	objSpaceOfOwnerUpdated: function(obj, owner, operation)
	{
		// do nothing here
	},

	/**
	 * Called after a new owner property is set. Descendants can override this method.
	 * @private
	 */
	ownerChanged: function(newOwner, oldOwner)
	{
		// change scalar owners
		for (var i = 0, l = this.getScalarAttribCount(); i < l; ++i)
			this.getScalarAttribAt(i).setOwner(newOwner);
		// change owner of children
		for (var i = 0, l = this.getChildCount(); i < l; ++i)
		{
			var c = this.getChildAt(i);
			if (c && c.setOwner)
				c.setOwner(newOwner);
		}
	},
	/**
	 * Called after a new parent property is set. Descendants can override this method.
	 * @private
	 */
	parentChanged: function(newParent, oldParent)
	{
		// do nothing here
	},

	/**
	 * Returns an parent array ([this.parent, this.parent.parent, ...]).
	 * @returns {Array}
	 */
	getParentList: function()
	{
		var result = [];
		var p = this.getParent();
		if (p)
		{
			if (p.getParentList)
			{
				result = p.getParentList() || [];
			}
			result.unshift(p);
		}
		return result;
	},
	/**
	 * Check if this object is a child (direct or indirect) of another object.
	 * @param obj
	 */
	isChildOf: function(obj)
	{
		var p = this.getParent();
		while (p && (p !== obj))
			p = p.getParent? p.getParent(): null;
		return (!!p);
	},
	/**
	 * Returns next sibling object in parent.
	 * If parent not set, null will be returned.
	 * @returns {Object}
	 */
	getNextSibling: function()
	{
		var parent = this.getParent();
		if (parent && parent.getNextSiblingOfChild)
		{
			return parent.getNextSiblingOfChild(this);
		}
		else
			return null;
	},
	/**
	 * Check if obj has the same parent to this one.
	 * @param {Kekule.ChemObject} obj
	 * @returns {Bool}
	 */
	isSiblingWith: function(obj)
	{
		var pSelf = this.getParent();
		var pObj = obj.getParent && obj.getParent();
		return (pSelf && pObj && pSelf === pObj);
	},

	/**
	 * Get count of child objects.
	 * To a simple chem object without any child, this method will always return 0.
	 * Descendants need to override this method if they has children.
	 * @returns {Int}
	 */
	getChildCount: function()
	{
		return 0;
	},
	/**
	 * Get child object at index.
	 * To a simple chem object without any child, this method will always return null.
	 * Descendants need to override this method if they has children.
	 * @param {Int} index
	 * @returns {Variant}
	 */
	getChildAt: function(index)
	{
		return null;
	},
	/**
	 * Get the index of obj in children list.
	 * To a simple chem object without any child, this method will always return -1.
	 * Descendants need to override this method if they has children.
	 * @param {Variant} obj
	 * @returns {Int} Index of obj or -1 when not found.
	 */
	indexOfChild: function(obj)
	{
		return -1;
	},
	/**
	 * Remove obj from children.
	 * @param {Variant} obj
	 * @returns {Variant} Child object removed.
	 */
	removeChild: function(obj)
	{
		// do nothing here
		return null;
	},
	/**
	 * Remove objs from children.
	 * @param {Array} objs
	 */
	removeChildren: function(objs)
	{
		for (var i = objs.length - 1; i >= 0; --i)
			this.removeChild(objs[i]);
	},
	/**
	 * Insert obj before refChild in children list.
	 * If refChild is null or does not exists, obj will be append to tail of list.
	 * Descendants may override this method.
	 * @param {Variant} obj
	 * @param {Variant} refChildr
	 * @return {Int} Index of obj after inserting.
	 */
	insertBefore: function(obj, refChild)
	{
		// do nothing here
		return -1;
	},
	/**
	 * Add obj to the tail of children list.
	 * @param {Variant} obj
	 * @return {Int} Index of obj after appending.
	 */
	appendChild: function(obj)
	{
		return this.insertBefore(obj, null);
	},
	/**
	 * Add objs to the tail of children list.
	 * @param {Array} objs
	 */
	appendChildren: function(objs)
	{
		for (var i = 0, l = objs.length; i < l; ++i)
			this.appendChild(objs[i]);
	},
	/**
	 * Run a cascade function on all children (and their sub children).
	 * @param {Function} func The function has one param: obj. It should not modify the children structure of this object.
	 */
	cascadeOnChildren: function(func)
	{
		if (!func)
			return this;
		for (var i = 0, l = this.getChildCount(); i < l; ++i)
		{
			var obj = this.getChildAt(i);
			if (obj.cascadeOnChildren)
				obj.cascadeOnChildren(func);
			func(obj);
		}
		return this;
	},
	/**
	 * Run a cascade function on self and all children (and their sub children).
	 * @param {Function} func The function has one param: obj. It should not modify the children structure of this object.
	 */
	cascade: function(func)
	{
		if (!func)
			return this;
		this.cascadeOnChildren(func);
		func(this);
		return this;
	},

	/**
	 * Returns index stack of child.
	 * @param {Kekule.ChemObject} obj
	 * @returns {Array} Array of index, e.g. [3,2,1] means obj === this.getChildAt(3).getChildAt(2).getChildAt(1).
	 *   If obj is not a child or descendant child of this, null will be returned.
	 */
	indexStackOfChild: function(obj)
	{
		var parentList = obj.getParentList && obj.getParentList();
		var pIndex = -1;
		if (parentList && parentList.length)
		{
			pIndex = parentList.indexOf(this);
		}
		if (pIndex < 0)  // this is not in the parent list of obj
			return null;
		else
		{
			//var testObjs = parentList.slice(0, pIndex);
			var result = [];
			var parent = this;
			var index;
			for (var i = pIndex - 1; i >= 0; --i)
			{
				var testObj = parentList[i];
				index = parent.indexOfChild(testObj);
				if (index >= 0)
				{
					result.push(index);
					parent = testObj;
				}
				else
					return null;
			}
			index = parent.indexOfChild(obj);
			if (index >= 0)
				result.push(index);
			else
				return null;
			return result;
		}
	},
	/**
	 * Get child object at indexStack.
	 * For example, indexStack is [2, 3, 1], then this.getChildAt(2).getChildAt(3).getChildAt(1) will be returned.
	 * @param {Array} indexStack Array of integers.
	 * @returns {Kekule.ChemObject}
	 */
	getChildAtIndexStack: function(indexStack)
	{
		if (!indexStack)
			return null;
		indexStack = Kekule.ArrayUtils.toArray(indexStack);
		if (indexStack.length <= 0)
			return null;
		else
		{
			var child = this.getChildAt(indexStack[0]);
			for (var i = 1, l = indexStack.length; i < l; ++i)
			{
				if (child && child.getChildAt)
					child = child.getChildAt(indexStack[i]);
				else
					return null;
			}
			return child;
		}
	},

	/**
	 * Check if this object contains no data.
	 * @returns {Bool}
	 */
	isEmpty: function()
	{
		//return (this.getScalarAttribCount() <= 0) && (this.getInfoKeys().length <= 0);
		return false;  // usually chem object always contains information.
	},

	/**
	 * Set id property to null on this object and all its children.
	 */
	clearIds: function()
	{
		this.setId(undefined);
		for (var i = 0, l = this.getChildCount(); i < l; ++i)
		{
			var child = this.getChildAt(i);
			if (child.clearIds)
				child.clearIds();
		}
	},

	/**
	 * Assign data in this object to targetObj.
	 * @param {ObjectEx} targetObj
	 * @param {Bool} withId If set to true, id of current object will be copied to targetObj,
	 *   otherwise targetObj's id will be cleared.
	 */
	assignTo: function($super, targetObj, withId)
	{
		var result = $super(targetObj);
		if (!withId && targetObj.clearIds)
			targetObj.clearIds();
		return result;
	},
	/**
	 * Assign data in srcObj to this object.
	 * @param {ObjectEx} srcObj
	 * @param {Bool} withId If set to true, id of srcObj will be copied to this object,
	 *   otherwise this object's id will be cleared.
	 */
	assign: function(srcObj, withId)
	{
		return srcObj.assignTo(this, withId);
	},
	/**
	 * Returns a cloned object.
	 * @param {Bool} withId If set to true, id of this object will cloned to new object,
	 *   otherwise id of new object will be cleared.
	 * @returns {Kekule.ChemObject}
	 */
	clone: function(withId)
	{
		var classObj = this.getClass();
		var result = new classObj();
		this.assignTo(result, withId);
		return result;
	},

	/**
	 * Get count of scalar attributes.
	 * @returns {Int}
	 */
	getScalarAttribCount: function()
	{
		var a = this.getScalarAttribs();
		return a? a.length: 0;
	},
	/**
	 * Get scalar attrib object at index.
	 * @param {Int} index
	 * @returns {Kekule.Scalar}
	 */
	getScalarAttribAt: function(index)
	{
		var a = this.getScalarAttribs();
		return a? a[index]: null;
	},
	/**
	 * Append a scalar object to scalarAttribs array.
	 * @param {Kekule.Scalar} scalar
	 */
	appendScalarAttrib: function(scalar)
	{
		if (!this.getScalarAttribs())
			this.setPropStoreFieldValue('scalarAttribs', []);
		var r = Kekule.ArrayUtils.pushUniqueEx(this.getScalarAttribs(), scalar);
		if (r.isPushed)
		{
			scalar.setParent(this);
			this.notifyScalarAttribsChange();
		}
		return r.index;
	},
	/**
	 * Remove scalar at index in scalarAttribs array.
	 * @param {Int} index
	 * @returns {Kekule.Scalar} Object removed or null.
	 */
	removeScalarAttribAt: function(index)
	{
		if (!this.getScalarAttribs())
			return null;
		else
		{
			var r = Kekule.ArrayUtils.removeAt(this.getScalarAttribs(), index);
			if (r)
			{
				r.setParent(null);
				this.notifyScalarAttribsChange();
			}
			return r;
		}
	},
	/**
	 * Remove scalar in scalarAttribs array.
	 * @param {Kekule.Scalar} scalar Object to be removed.
	 * @returns {Kekule.Scalar} Object removed or null.
	 */
	removeScalarAttrib: function(scalar)
	{
		if (!this.getScalarAttribs())
			return null;
		else
		{
			var r = Kekule.ArrayUtils.remove(this.getScalarAttribs(), scalar);
			if (r)
			{
				r.setParent(null);
				this.notifyScalarAttribsChange();
			}
			return r;
		}
	},
	/**
	 * Returns all keys in {@link Kekule.ChemObject#info} property.
	 * @returns {Array}
	 */
	getInfoKeys: function()
	{
		return this.getInfo()? Kekule.ObjUtils.getOwnedFieldNames(this.getInfo()): [];
	},
	/**
	 * Get item value from info hash.
	 * @param key Key of information item.
	 */
	getInfoValue: function(key)
	{
		return this.getInfo()? this.getInfo()[key]: null;
	},
	/**
	 * Set an item value in info hash. If key already exists, its value will be overwritten.
	 * @param key Key of information item.
	 * @param value Value of information item.
	 */
	setInfoValue: function(key, value)
	{
		this.doGetInfo(true)[key] = value;
		this.notifyInfoChange();
	},

	/**
	 * Calculate the box to contain the object.
	 * Descendants may override this method.
	 * @param {Int} coordMode Determine to calculate 2D or 3D box. Value from {@link Kekule.CoordMode}.
	 * @param {Bool} allowCoordBorrow
	 * @returns {Hash} Box information. {x1, y1, z1, x2, y2, z2} (in 2D mode z1 and z2 will not be set).
	 */
	getContainerBox: function(coordMode, allowCoordBorrow)
	{
		// defaultly returns coord and size
		if (this.getAbsCoordOfMode)
		{
			var coord1 = this.getAbsCoordOfMode(coordMode, allowCoordBorrow) || {};
			var coord2 = coord1;
			if (this.getSizeOfMode)
			{
				var size = this.getSizeOfMode(coordMode, allowCoordBorrow) || {};
				if (coordMode === Kekule.CoordMode.COORD3D)
					var coord2 = Kekule.CoordUtils.add(coord1, this.getSizeOfMode(coordMode, allowCoordBorrow) || {});
				else // 2D
				{
					coord2 = {
						x: coord1.x + size.x,
						y: coord1.y - size.y
					};
				}
			}
			var result = Kekule.BoxUtils.createBox(coord1, coord2);
			//console.log('get box', this.getClassName(), result, coord1, coord2);
			return result;
		}
		else
			return null;
	},

	/**
	 * Check if this object is equivalent to targetObj.
	 * @param {Kekule.ChemObj} targetObj
	 * @param {Hash} options Comparison objects, different class may require different options. <br />
	 *   For example, you can use {'method': {@link Kekule.ComparisonMethod.CHEM_STRUCTURE}} to indicating that only the chem structure
	 *   data should be compared. <br />
	 *   You can also use {'properties': ['propName1', 'propName2']} to manually assign properties that
	 *   need to be compared. <br />
	 *   Custom comparison method can also be appointed as {'customMethod': myComparisonFunc}, then the
	 *   comparison will be actually called as myComparisonFunc(thisObj, targetObj, options).
	 * @returns {Bool}
	 */
	equal: function(targetObj, options)
	{
		return this.compare(targetObj, options) === 0;
	},
	/**
	 * Compare this object to a targetObj.
	 * @param {Kekule.ChemObj} targetObj
	 * @param {Hash} options Comparison objects, different class may require different options. <br />
	 *   For example, you can use {'method': {@link Kekule.ComparisonMethod.CHEM_STRUCTURE}} to indicating that only the chem structure
	 *   data should be compared. <br />
	 *   You can also use {'properties': ['propName1', 'propName2']} to manually assign properties that
	 *   need to be compared. <br />
	 *   Custom comparison method can also be appointed as {'customMethod': myComparisonFunc}, then the
	 *   comparison will be actually called as myComparisonFunc(thisObj, targetObj, options).
	 * @returns {Int} Returns 0 when two objects are equivalent,
	 *   or -1 for "inferior" to targetObj and +1 for "superior" to targetObj.
	 */
	compare: function(targetObj, options)
	{
		if (targetObj === this)  // same object, simply returns 0
			return 0;
		if (!targetObj)
			return 1;
		var actualOps = this.doGetActualCompareOptions(options);
		//console.log(this.getClassName(), options, actualOps);
		var result;
		if (actualOps.customMethod)
			result = actualOps.customMethod(this, targetObj, actualOps);
		else
		{
			result = this.doCompare(targetObj, actualOps);
		}
		return (result === 0)? 0: (result < 0)? -1: 1;  // standardize result
	},
	/**
	 * Handles input options for {@link Kekule.ChemObj.compare}.
	 * Descendants may override this method.
	 * @param {Hash} options
	 * @returns {Hash}
	 * @private
	 */
	doGetActualCompareOptions: function(options)
	{
		return options || {};
	},
	/**
	 * Do actual work of {@link Kekule.ChemObj.compare}. Descendants should override this method.
	 * @param {Kekule.ChemObj} targetObj
	 * @param {Hash} options Comparison objects, different class may require different options.
	 * @returns {Int} Returns 0 when two objects are equivalent and non-zero value when they are not equivalent.
	 *   (Usually -1 for "inferior" to targetObj and +1 for "superior" to targetObj).
	 * @private
	 */
	doCompare: function(targetObj, options)
	{
		// here we use a simple approach
		if (targetObj === this)
			return 0;
		else  // if not same, check if they are based on same class
		{
			var selfClass = this.getClass();
			var targetClass = targetObj.getClass && targetObj.getClass();
			if (selfClass !== targetClass)  // not same type of class
			{
				var selfClassName = this.getClassName();
				var targetClassName = (targetObj.getClassName && targetObj.getClassName()) || '';
				return (selfClassName < targetClassName)? -1: 1;
			}
			else  // same class, must compare details, here we use default approach, comparing properties
			{
				var result = this.doCompareOnProperties(targetObj, options);
				if (!result && options.extraComparisonProperties)
				{
					for (var i = 0, l = options.extraComparisonProperties.length; i < l; ++i)
					{
						var propName = options.extraComparisonProperties[i];
						if (this.hasProperty(propName) && targetObj.hasProperty && targetObj.hasProperty(propName))
						{
							var v1 = this.getPropValue(propName);
							var v2 = targetObj.getPropValue(propName);
							//console.log('compare extra', this.getClassName(), propName, v1, v2);
							result = this.doCompareOnValue(v1, v2, options);
							if (!result)
								break;
						}
					}
				}
				return result;
			}
		}
	},
	/**
	 * The default approach to compare two object based on properties.
	 * This method will check essential properties of targetObj and this object,
	 * comparing them one by one to get the result.
	 * @param {Kekule.ChemObj} targetObj
	 * @param {Hash} options
	 * @returns {Int}
	 * @private
	 */
	doCompareOnProperties: function(targetObj, options)
	{
		var propNames;
		if (options.properties)
			propNames = options.properties;
		else
		{
			// first extract all properties that should be compared
			propNames = this.doGetComparisonPropNames(options);
			if (!propNames)  // returns null, need to compare all public and published properties
			{
				propNames = this.doGetDefaultComparisonPropNames();
			}
		}
		// then compare each property values
		var result = 0;
		for (var i = 0, l = propNames.length; i < l; ++i)
		{
			result = this.doCompareProperty(targetObj, propNames[i], options);
			if (result !== 0)
				return result;
		}
		// all properties returns 0 (equal), returns 0
		return 0;
	},
	/**
	 * Returns all essential property names that should be handled during object comparison.
	 * Descendants may override this method.
	 * @param {Hash} options
	 * @returns {Array} Returns property names or null to indicating that all properties should be compared.
	 * @private
	 */
	doGetComparisonPropNames: function(options)
	{
		return null;
	},
	/**
	 * Returns all default property names that should be handled during object comparison.
	 * Descendants may override this method.
	 * @param {Hash} options
	 * @returns {Array}
	 * @private
	 */
	doGetDefaultComparisonPropNames: function()
	{
		var propNames = [];
		var props = this.getPropListOfScopes([Class.PropertyScope.PUBLIC, Class.PropertyScope.PUBLISHED]);
		for (var i = 0, l = props.getLength(); i < l; ++i)
		{
			var propInfo = props.getPropInfoAt(i);
			propNames.push(propInfo.name);
		}
		return propNames;
	},
	/**
	 * Compare property value of targetObj and this object, used for object comparison.
	 * Descendants may override this method.
	 * @param {Kekule.ChemObj} targetObj
	 * @param {String} propName
	 * @param {Hash} options
	 * @returns {Int}
	 * @private
	 */
	doCompareProperty: function(targetObj, propName, options)
	{
		var v2 = targetObj.getPropValue && targetObj.getPropValue(propName);
		var v1 = this.getPropValue(propName);
		if (v1 === v2)  // simple data type equal, or same object (including null)
			return 0;
		else
		{
			var result = this.doCompareOnValue(v1, v2, options);
			//console.log('compare', propName, v1, v2, result);
			return result;
		}
	},
	/**
	 * Compare on two values, used for object comparison.
	 * Descendants may override this method.
	 * @param {Variant} v1
	 * @param {Variant} v2
	 * @param {Hash} options
	 * @returns {Int}
	 * @private
	 */
	doCompareOnValue: function(v1, v2, options)
	{
		return Kekule.ObjComparer._compareValue(v1, v2, options);
	}
});

/**
 * Class to hold a general data with unit in chemistry, such as temperature, weight, pressure and so on.
 * @class
 * @augments Kekule.ChemObject
 * @param {id} id Id of this object.
 * @param {String} name Name of scalar value.
 * @param {Variant} value Value of scalar. Should be primary type (string, number).
 * @param {String} unit Unit of scalar.
 *
 * @property {String} name Name of scalar value.
 * @property {Variant} value Value of scalar. Should be primary type (string, number).
 * @property {Variant} errorValue Error value of scalar. Should be the same type with value.
 * @property {String} unit Unit of scalar.
 * @property {String} title Informative title of scalar value.
 */
Kekule.Scalar = Class.create(Kekule.ChemObject,
/** @lends Kekule.Scalar# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Scalar',
	/** @private */
	initialize: function($super, id, name, value, unit)
	{
		$super(id);
		if (name)
			this.setName(name);
		if (typeof(value) !== 'undefined')
			this.setValue(value);
		if (unit)
			this.setUnit(unit);
	},
	initProperties: function()
	{
		this.defineProp('name', {'dataType': DataType.STRING});
		this.defineProp('value', {'dataType': DataType.PRIMARY});
		this.defineProp('errorValue', {'dataType': DataType.PRIMARY});
		this.defineProp('unit', {'dataType': DataType.STRING});
		this.defineProp('title', {'dataType': DataType.STRING});
	}
});

/**
 * A list to hold a set of other {@link Kekule.ChemObject}.
 * @class
 * @augments Kekule.ChemObject
 * @param {String} id Id of this object.
 * @param {Class} itemBaseClass Base class of each item in list.
 *   If this value is null, any type of object can be inserted into list.
 * @param {Bool} transparent If true, the parent object of children in list will not be the list itself,
 *   but relay to parent of list.
 *
 * @property {Class} itemBaseClass Base class of each item in list.
 *   If this value is null, any type of object can be inserted into list.
 * @property {Array} items Items in list. All items owner is the same as the owner of list.
 */
Kekule.ChemObjList = Class.create(Kekule.ChemObject,
/** @lends Kekule.ChemObjList# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemObjList',
	/** @constructs */
	initialize: function($super, id, itemBaseClass, transparent)
	{
		$super(id);
		this.setPropStoreFieldValue('itemBaseClass', itemBaseClass);
		this._transparent = !!transparent;
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('itemBaseClass', {'dataType': DataType.CLASS, 'serializable': false, 'scope': Class.PropertyScope.PUBLIC});
		this.defineProp('items', {
			'dataType': DataType.ARRAY,
			'scope': Class.PropertyScope.PUBLIC,
			'setter': null,
			'getter': function(canCreate)
				{
					var r = this.getPropStoreFieldValue('items');
					if ((!r) && canCreate)
					{
						r = [];
						this.setPropStoreFieldValue('items', r);
					}
					return r;
				}
		});
	},

	/** @private */
	loaded: function($super)
	{
		// update parent and owner of children
		this.ownerChanged(this.getOwner());
		this.parentChanged(this.getParent());
		$super();
	},

	/* @private */
	/*
	ownerChanged: function($super, newOwner, oldOwner)
	{
		this.changeAllItemsOwner();
		$super(newOwner, oldOwner);
	},
	*/
	/** @private */
	parentChanged: function($super, newParent, oldParent)
	{
		this.changeAllItemsParent();
		$super(newParent, oldParent);
	},

	/** @ignore */
	isEmpty: function()
	{
		// var result = $super();
		return (this.getItemCount() <= 0);
	},

	/** @private */
	checkItemType: function(item)
	{
		var c = this.getItemBaseClass();
		var r = c? item instanceof c: true;
		if (!r)
			Kekule.raise(Kekule.$L('ErrorMsg.LIST_ITEM_CLASS_MISMATCH')/*Kekule.ErrorMsg.LIST_ITEM_CLASS_MISMATCH*/);
		return r;
	},

	/** @private */
	notifyItemsChange: function()
	{
		this.notifyPropSet('items', this.getPropStoreFieldValue('items'));
	},

	/** @private */
	getItemOwner: function()
	{
		return this.getOwner();  // || this;
	},
	/** @private */
	changeAllItemsOwner: function()
	{
		var items = this.getItems();
		if (items)
		{
			var owner = this.getItemOwner();
			for (var i = 0, l = items.length; i < l; ++i)
			{
				var obj = items[i];
				if (obj && obj.setOwner)
					obj.setOwner(owner);
			}
		}
	},
	/** @private */
	getItemParent: function()
	{
		return this._transparent? this.getParent() || this: this;
	},
	/** @private */
	changeAllItemsParent: function()
	{
		var items = this.getItems();
		if (items)
		{
			var parent = this.getItemParent();
			for (var i = 0, l = items.length; i < l; ++i)
			{
				var obj = items[i];
				if (obj && obj.setParent)
					obj.setParent(parent);
			}
		}
	},

	/**
	 * Get count of child objects.
	 * @returns {Int}
	 */
	getItemCount: function()
	{
		var a = this.getPropStoreFieldValue('items');
		return a? a.length: 0;
	},
	/**
	 * Get child object at index.
	 * @param {Int} index
	 * @returns {Variant}
	 */
	getItemAt: function(index)
	{
		var a = this.getPropStoreFieldValue('items');
		return a? a[index]: null;
	},
	/**
	 * Get the index of obj in children array.
	 * @param {Variant} obj
	 * @returns {Int} Index of obj or -1 when not found.
	 */
	indexOf: function(obj)
	{
		var a = this.getPropStoreFieldValue('items');
		return a? a.indexOf(obj): -1;
	},
	/**
	 * Returns next sibling object to childObj.
	 * @param {Object} childObj
	 * @returns {Object}
	 */
	getNextSiblingOfChild: function(childObj)
	{
		var index = this.indexOf(childObj);
		return (index >= 0)? this.getItemAt(index + 1): null;
	},

	/** @ignore */
	getChildCount: function()
	{
		return this.getItemCount();
	},
	/** @ignore */
	getChildAt: function(index)
	{
		return this.getItemAt(index);
	},
	/** @ignore */
	indexOfChild: function(obj)
	{
		return this.indexOf(obj);
	},

	/**
	 * Append obj to children array. If obj already inside, nothing will be done.
	 * @param {Object} obj
	 * @returns {Int} Index of obj after appending.
	 */
	append: function(obj)
	{
		this.checkItemType(obj);
		if (obj)
		{
			var r = Kekule.ArrayUtils.pushUniqueEx(this.doGetItems(true), obj);
			if (r.isPushed)
			{
				this.notifyItemsChange();
				if (obj.setOwner)
					obj.setOwner(this.getItemOwner());
				if (obj.setParent)
					obj.setParent(this.getItemParent());
			}
			return r.index;
		}
		else
			return -1;
	},
	/**
	 * Insert obj to index of children array. If obj already inside, its position will be changed.
	 * @param {Object} obj
	 * @param {Object} index
	 * @return {Int} Index of obj after inserting.
	 */
	insert: function(obj, index)
	{
		this.checkItemType(obj);
		if (obj)
		{
			var r = Kekule.ArrayUtils.insertUniqueEx(this.doGetItems(true), obj, index);
			if (r.isInserted)
			{
				this.notifyItemsChange();
				if (obj.setOwner)
					obj.setOwner(this.getItemOwner());
				if (obj.setParent)
					obj.setParent(this.getItemParent());
			}
			return r.index;
		}
		else
			return -1;
	},
	/**
	 * Insert obj before refChild in list. If refChild is null or does not exists, obj will be append to tail of list.
	 * @param {Object} obj
	 * @param {Object} refChild
	 * @return {Int} Index of obj after inserting.
	 */
	insertBefore: function(obj, refChild)
	{
		if (!refChild)
			return this.append(obj);
		else
		{
			var refIndex = this.indexOf(refChild);
			return (refIndex >= 0)? this.insert(obj, refIndex): this.append(obj);
		}
	},
	/**
	 * Remove a child at index.
	 * @param {Int} index
	 * @returns {Variant} Child object removed.
	 */
	removeAt: function(index)
	{
		if (this.getItems())
		{
			var r = Kekule.ArrayUtils.removeAt(this.getItems(), index);
			if (r)
			{
				if (r.setOwner)
					r.setOwner(null);
				if (r.setParent)
					r.setParent(null);
				this.notifyItemsChange();
			}
			return r;
		}
	},
	/**
	 * Remove a child at index.
	 * @param {Int} index
	 * @returns {Variant} Child object removed.
	 */
	removeChildAt: function(index)
	{
		return this.removeAt(index);
	},
	/**
	 * Remove obj from children array.
	 * @param {Variant} obj
	 * @returns {Variant} Child object removed.
	 */
	remove: function(obj)
	{
		if (this.getItems())
		{
			var r = Kekule.ArrayUtils.remove(this.getItems(), obj);
			if (r)
			{
				if (r.setOwner)
					r.setOwner(null);
				if (r.setParent)
					r.setParent(null);
				this.notifyItemsChange();
			}
			return r;
		}
	},
	/**
	 * Remove obj from children array. Same as method remove.
	 * @param {Variant} obj
	 * @returns {Variant} Child object removed.
	 */
	removeChild: function($super, obj)
	{
		return this.remove(obj) || $super(obj);
	},

	/**
	 * Return array contains all objects in list.
	 */
	toArray: function()
	{
		return this.getItems();
	},

	/**
	 * Calculate the box to contain the objects in list.
	 * Descendants may override this method.
	 * @param {Int} coordMode Determine to calculate 2D or 3D box. Value from {@link Kekule.CoordMode}.
	 * @param {Bool} allowCoordBorrow
	 * @returns {Hash} Box information. {x1, y1, z1, x2, y2, z2} (in 2D mode z1 and z2 will not be set).
	 */
	getContainerBox: function(coordMode, allowCoordBorrow)
	{
		var result;
		var childObjs = this.toArray();
		for (var i = 0, l = childObjs.length; i < l; ++i)
		{
			var obj = childObjs[i];
			var box = obj.getContainerBox? obj.getContainerBox(coordMode, allowCoordBorrow): null;
			if (box)
			{
				if (!result)
					result = Kekule.BoxUtils.clone(box); //Object.extend({}, box);
				else
					result = Kekule.BoxUtils.getContainerBox(result, box);
			}
		}
		return result;
	}
});


/**
 * An element to hold a list of other chem objects or elements in chem space.
 * @class
 * @augments Kekule.ChemObject
 * @param {String} id Id of this element.
 *
 * @property {Kekule.ChemObjList} children Direct child objects in this space. The owner of children must all be this space.
 */
Kekule.ChemSpaceElement = Class.create(Kekule.ChemObject,
/** @lends Kekule.ChemSpaceElement# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemSpaceElement',
	/** @constructs */
	initialize: function($super, id)
	{
		$super(id);
		var list = new Kekule.ChemObjList(null, Kekule.ChemObject, true);  // create transparent list
		list.setParent(this);
		list.addEventListener('change', function()
			{
				this.objectChange(['children']);
			}, this);
		this.setPropStoreFieldValue('children', list);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('children', {'dataType': 'Kekule.ChemObjList', 'scope': Class.PropertyScope.PUBLIC,
			'setter': function(value)
			{
				var old = this.getChildren();
				if (old)
				{
					old.finalize();
				}
				if (value)
				{
					value.setParent(this);
					value.setOwner(this.getOwner());
					value._transparent = true;  // force the obj list be transparent
				}
				this.setPropStoreFieldValue('children', value);
			}
		});
	},
	/** @private */
	loaded: function($super)
	{
		var objList = this.getChildren();
		if (objList)
		{
			objList.parentChanged(this);
			objList.ownerChanged(this.getOwner());
		}
		$super();
	},

	/** @ignore */
	ownerChanged: function($super, newOwner, oldOwner)
	{
		// change owners of children
		this.getChildren().setOwner(newOwner);
		$super(newOwner, oldOwner);
	},
	/** @private */
	_removeChildObj: function($super, obj)
	{
		var index = this.indexOfChild(obj);
		if (index >= 0)
		{
			this.removeChildAt(index);
		}
		$super(obj);
	},

	/* @ignore */
	/*
	isEmpty: function($super)
	{
		var result = $super();
		return result && (this.getChildCount() <= 0);
	},
	*/

	/**
	 * Get count of child objects.
	 * @returns {Int}
	 */
	getChildCount: function()
	{
		return this.getChildren().getItemCount();
	},
	/**
	 * Get child object at index.
	 * @param {Int} index
	 * @returns {Variant}
	 */
	getChildAt: function(index)
	{
		return this.getChildren().getItemAt(index);
	},
	/**
	 * Get the index of obj in children list.
	 * @param {Variant} obj
	 * @returns {Int} Index of obj or -1 when not found.
	 */
	indexOfChild: function(obj)
	{
		return this.getChildren().indexOf(obj);
	},
	/**
	 * Returns next sibling object to childObj.
	 * @param {Object} childObj
	 * @returns {Object}
	 */
	getNextSiblingOfChild: function(childObj)
	{
		return this.getChildren().getNextSiblingOfChild(childObj);
	},
	/**
	 * Append obj to children list. If obj already inside, nothing will be done.
	 * @param {Object} obj
	 * @returns {Int} Index of obj after appending.
	 */
	appendChild: function(obj)
	{
		return this.getChildren().append(obj);
	},
	/**
	 * Insert obj to index of children list. If obj already inside, its position will be changed.
	 * @param {Object} obj
	 * @param {Object} index
	 * @return {Int} Index of obj after inserting.
	 */
	insertChild: function(obj, index)
	{
		return this.getChildren().insert(obj, index);
	},
	/**
	 * Insert obj before refChild in list. If refChild is null or does not exists, obj will be append to tail of list.
	 * @param {Object} obj
	 * @param {Object} refChild
	 * @return {Int} Index of obj after inserting.
	 */
	insertBefore: function(obj, refChild)
	{
		return this.getChildren().insertBefore(obj, refChild);
	},
	/**
	 * Remove a child at index.
	 * @param {Int} index
	 * @returns {Variant} Child object removed.
	 */
	removeChildAt: function(index)
	{
		return this.getChildren().removeChildAt(index);
	},
	/**
	 * Remove obj from children list.
	 * @param {Variant} obj
	 * @returns {Variant} Child object removed.
	 */
	removeChild: function($super, obj)
	{
		return this.getChildren().removeChild(obj) || $super(obj);
	}
});

/**
 * An object to hold a set of other {@link Kekule.ChemObject}.
 * {@link Kekule.ChemObject#owner} property of each object the space should be set to this one.
 * In one space, id of each object should be unique.
 * @class
 * @augments Kekule.ChemObject
 * @param {String} id Id of this object.
 *
 * @property {Array} ownedObjs Objects owned by this space.
 * @property {Kekule.ChemSpaceElement} root The root element of space.
 * @property {Bool} enableAutoId When set to true, object inserted into space without id
 *   will be automatically assigned a id (usually a prefix plus a number, e.g. m12).
 * @property {Hash} screenSize In px, size of space on screen, {x, y}.
 * @property {Hash} size2D The 2D dimension (width, height) of glyph, {x, y}.
 * @property {Hash} size3D The 3D dimension (width, height, depth) of glyph, {x, y, z}.
 */
Kekule.ChemSpace = Class.create(Kekule.ChemObject,
/** @lends Kekule.ChemSpace# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemSpace',
	/** @constructs */
	initialize: function($super, id)
	{
		$super(id);
		this._autoIdMap = {};  // private
		this._enableObjRefRelations = true;  // private
		this._autoUpdateObjRefRelations = true;  // private
		this.setPropStoreFieldValue('enableAutoId', true);
		this.setPropStoreFieldValue('ownedObjs', []);
		var root = new Kekule.ChemSpaceElement();
		this.setPropStoreFieldValue('root', root);
		this.setPropStoreFieldValue('objRefRelationManager', new Kekule.ObjRefRelationManager(this));
		root.setParent(this);
		root.setOwner(this);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('ownedObjs', {'dataType': DataType.ARRAY, 'serializable': false, 'setter': null, 'scope': Class.PropertyScope.PUBLIC});
		this.defineProp('root', {'dataType': 'Kekule.ChemSpaceElement', 'setter': null});
		this.defineProp('enableAutoId', {'dataType': DataType.BOOL});
		this.defineProp('objScreenLengthRatio', {'dataType': DataType.FLOAT, 'serializable': false,
			'scope': Class.PropertyScope.PRIVATE
		});  // private
		this.defineProp('screenSize', {'dataType': DataType.HASH,
			'getter': function()
			{
				var o = this.getPropStoreFieldValue('screenSize') || {};
				return {'x': o.x, 'y': o.y};
			},
			'setter': function(value)
			{
				var o = this.getPropStoreFieldValue('screenSize');
				if (!o)
				{
					o = {};
					this.setPropStoreFieldValue('screenSize', o);
				}
				o.x = value.x;
				o.y = value.y;
			}
		});

		this.defineProp('objRefRelationManager', {
			'dataType': 'Kekule.ObjRefRelationManager', 'serializable': false,
			'scope': Class.PropertyScope.PRIVATE, 'setter': null
		});
	},
	/** @private */
	loaded: function($super)
	{
		var root = this.getRoot();
		if (root)
		{
			root.setParent(this);
			root.setOwner(this);
		}
		$super();
		this.notifyOwnerLoaded();
	},

	/** @private */
	notifyOwnedObjsChange: function()
	{
		this.notifyPropSet('ownedObjs', this.getPropStoreFieldValue('ownedObjs'));
	},
	/** @private */
	_notifyOwnedObjsSpaceUpdate: function(obj, owner, operation)
	{
		for (var i = 0, l = this.getOwnedObjCount(); i < l; ++i)
		{
			var child = this.getOwnedObjAt(i);
			if (child && child.objSpaceOfOwnerUpdated)
				child.objSpaceOfOwnerUpdated(obj, owner, operation);
		}

		// update related objects of removed one
		if (this._enableObjRefRelations && this._autoUpdateObjRefRelations && operation === Kekule.ObjectTreeOperation.REMOVE)
		{
			var AU = Kekule.ArrayUtils;
			var relations = this.findObjRefRelations({'dest': obj}) || [];
			for (var i = 0, l = relations.length; i < l; ++i)
			{
				var rel = relations[i];
				if (rel.srcProp.autoUpdate)  // an auto-update relation, update it
				{
					var relDest = rel.dest;
					var newDest = (AU.isArray(relDest))? AU.exclude(relDest, [obj]): null;
					// set value
					rel.srcObj.setPropValue(rel.srcProp.name, newDest);
					//console.log('auto set ref value', rel.srcObj.getId() + '.' + rel.srcProp.name, newDest);
				}
			}
		}
	},
	/** @private */
	notifyOwnerLoaded: function()
	{
		// when the whole chem space is loaded from external data, notify all owned objects.
		var ownedObjs = this.getOwnedObjs() || [];
		for (var i = 0, l = ownedObjs.length; i < l; ++i)
		{
			var obj = ownedObjs[i];
			if (obj && obj._ownerObjectLoaded)
				obj._ownerObjectLoaded(this);
		}
	},

	/* @ignore */
	/*
	isEmpty: function($super)
	{
		var result = $super();
		return result && (this.getChildCount() <= 0) && (this.getOwnedObjCount() <= 0);
	},
	*/

	/**
	 * Returns all children of root.
	 * @returns {Array}
	 */
	getChildren: function()
	{
		return this.getRoot().getChildren().toArray();
	},
	/**
	 * Get count of child objects in root.
	 * @returns {Int}
	 */
	getChildCount: function()
	{
		return this.getRoot().getChildCount();
	},
	/**
	 * Get child object at index.
	 * @param {Int} index
	 * @returns {Variant}
	 */
	getChildAt: function(index)
	{
		return this.getRoot().getChildAt(index);
	},
	/**
	 * Get the index of obj in children list of root.
	 * @param {Variant} obj
	 * @returns {Int} Index of obj or -1 when not found.
	 */
	indexOfChild: function(obj)
	{
		return this.getRoot().indexOfChild(obj);
	},
	/**
	 * Returns next sibling object to childObj.
	 * @param {Object} childObj
	 * @returns {Object}
	 */
	getNextSiblingOfChild: function(childObj)
	{
		return this.getRoot().getNextSiblingOfChild(childObj);
	},
	/**
	 * Append obj to children list of root. If obj already inside, nothing will be done.
	 * @param {Object} obj
	 * @returns {Int} Index of obj after appending.
	 */
	appendChild: function(obj)
	{
		return this.getRoot().appendChild(obj);
	},
	/**
	 * Insert obj to index of children list of root. If obj already inside, its position will be changed.
	 * @param {Object} obj
	 * @param {Object} index
	 * @return {Int} Index of obj after inserting.
	 */
	insertChild: function(obj, index)
	{
		return this.getRoot().insertChild(obj, index);
	},
	/**
	 * Insert obj before refChild in list of root. If refChild is null or does not exists, obj will be append to tail of list.
	 * @param {Object} obj
	 * @param {Object} refChild
	 * @return {Int} Index of obj after inserting.
	 */
	insertBefore: function(obj, refChild)
	{
		return this.getRoot().insertBefore(obj, refChild);
	},
	/**
	 * Remove a child at index.
	 * @param {Int} index
	 * @returns {Variant} Child object removed.
	 */
	removeChildAt: function(index)
	{
		return this.getRoot().removeChildAt(index);
	},
	/**
	 * Remove obj from children list of root.
	 * @param {Variant} obj
	 * @returns {Variant} Child object removed.
	 */
	removeChild: function($super, obj)
	{
		return this.getRoot().removeChild(obj) || $super(obj);
	},

	/** @ignore */
	indexStackOfChild: function(obj)
	{
		return this.getRoot().indexStackOfChild(obj);
	},
	/** @ignore */
	getChildAtIndexStack: function(indexStack)
	{
		return this.getRoot().getChildAtIndexStack(indexStack);
	},

	/**
	 * Search ownedObjs and find the one matching id.
	 * @param {String} id
	 * @returns {Kekule.ChemObject} Object found or null.
	 */
	getObjById: function(id)
	{
		for (var i = 0, l = this.getOwnedObjCount(); i < l; ++i)
		{
			var obj = this.getOwnedObjAt(i);
			if (obj.getId)
				if (obj.getId() === id)
					return obj;
		}
		return null;
	},
	/**
	 * Generate a unique id for obj.
	 * @param {Object} obj Can be null to generate a generic id.
	 * @param {Int} fromIndex Try from startIndex to get a prefix+index style id. Can be null.
	 * @returns {String} Unique id generated.
	 */
	getAutoId: function(obj, fromIndex)
	{
		var prefix;
		if (obj)
			prefix = obj.getAutoIdPrefix? obj.getAutoIdPrefix(): 'o';
		else
			prefix = 'o';

		var prefix = obj.getAutoIdPrefix? obj.getAutoIdPrefix(): 'o';
		var index;
		if (Kekule.ObjUtils.notUnset(fromIndex))
			index = fromIndex;
		else
		{
			/*
			index = this._autoIdMap[prefix] || 0;
			++index;
			*/
			index = 1;
		}
		var index = this._getAutoIdIndex(prefix, index);
		this._autoIdMap[prefix] = index;
		return prefix + Number(index).toString();
	},

	/** @private */
	_getAutoIdIndex: function(prefix, fromIndex)
	{
		var start = fromIndex || 0;
		var i = start;
		var id = prefix + Number(i).toString();
		while (this.getObjById(id))  // repeat until no duplicated id
		{
			++i;
			id = prefix + Number(i).toString();
		}
		return i;
	},

	/**
	 * Assign id automatically to a owned object.
	 * @param {Kekule.ChemObject} obj
	 * @private
	 */
	assignAutoIdToObj: function(obj)
	{
		if (obj.setId)
		{
			var id = this.getAutoId(obj);
		  obj.setId(id);
		}
	},

	/**
	 * Return count of ownedObjs.
	 * @returns {Int}
	 */
	getOwnedObjCount: function()
	{
		return this.getOwnedObjs().length;
	},
	/**
	 * Get owned object at index.
	 * @param {Int} index
	 * @returns {Kekule.ChemObject}
	 */
	getOwnedObjAt: function(index)
	{
		return this.getOwnedObjs()[index];
	},
	/**
	 * Get index of obj in ownedObjs list.
	 * @param {Object} obj
	 * @returns {Int}
	 */
	indexOfOwnedObj: function(obj)
	{
		return this.getOwnedObjs().indexOf(obj);
	},
	// Append or remove methods should not be called directly on ChemSpace.
	// You should change owner property of ChemObject instead.
	/**
	 * Add a new obj to this space. If obj already inside, do nothing.
	 * @param {Kekule.ChemObject} obj
	 * @private
	 */
	_appendOwnedObj: function(obj)
	{
		if (this.indexOfOwnedObj(obj) >= 0) // already inside, do nothing
			return;
		else
		{
			if (this.getEnableAutoId())
			{
				if (obj.getId && !obj.getId())
					this.assignAutoIdToObj(obj);
			}
			this.getOwnedObjs().push(obj);
			if (obj._registerObjRefRelations)
				obj._registerObjRefRelations(this);
			this._notifyOwnedObjsSpaceUpdate(obj, this, Kekule.ObjectTreeOperation.ADD);
			this.notifyOwnedObjsChange();
		}
	},
	/**
	 * Remove an ownedObj at index.
	 * @param {Int} index
	 * @private
	 */
	_removeOwnedObjAt: function(index)
	{
		var obj = this.getOwnedObjAt(index);
		if (obj)
		{
			this.getOwnedObjs().splice(index, 1);
			if (obj._unregisterObjRefRelations)
				obj._unregisterObjRefRelations(this);
			this._notifyOwnedObjsSpaceUpdate(obj, this, Kekule.ObjectTreeOperation.REMOVE);
			this.notifyOwnedObjsChange();
		}
	},
	/**
	 * Remove obj from ownerObjs list/
	 * @param {Kekule.ChemObject} obj
	 * @private
	 */
	_removeOwnedObj: function(obj)
	{
		var index = this.getOwnedObjs().indexOf(obj);
		if (index >= 0)
			this._removeOwnedObjAt(index);
	},

	/**
	 * Called when a obj has been added or removed into object tree.
	 * @param {Kekule.ChemObject} obj
	 * @param {Int} operation
	 * @private
	 */
	_notifyObjTreeOperation: function(obj, parent, operation)
	{
		// notify all owned objects
		for (var i = 0, l = this.getOwnedObjCount(); i < l; ++i)
		{
			var child = this.getOwnedObjAt(i);
			if (child.objTreeOfOwnerUpdated)
				child.objTreeOfOwnerUpdated(obj, parent, operation);
		}
	},

	// methods about obj ref relations
	/**
	 * Returns all object reference relations in this chem space.
	 * @returns {Array}
	 */
	getObjRefRelations: function()
	{
		if (this._enableObjRefRelations)
			return this.getObjRefRelationManager().getRelations();
		else
			return null;
	},
	/**
	 * Create a new object reference relation.
	 * @param {Kekule.ChemObject} srcObj
	 * @param {Object} srcProp
	 * @param {Variant} destObjOrObjs An object or array of objects.
	 * @return {Object}
	 */
	createObjRefRelation: function(srcObj, srcProp, destObjOrObjs)
	{
		if (this._enableObjRefRelations)
			return this.getObjRefRelationManager().createRelation(srcObj, srcProp, destObjOrObjs);
		else
			return null;
	},
	/**
	 * Modify an existing object reference relation. If it not exists, a new one will be created.
	 * @param {Kekule.ChemObject} srcObj
	 * @param {Object} srcProp
	 * @param {Variant} destObjOrObjs An object or array of objects.
	 * @return {Object}
	 */
	modifyObjRefRelation: function(srcObj, srcProp, destObjOrObjs)
	{
		if (this._enableObjRefRelations)
			return this.getObjRefRelationManager().modifyRelation(srcObj, srcProp, destObjOrObjs);
		else
			return null;
	},
	/**
	 * Get a object reference relation index.
	 * @param {Kekule.ChemObject} srcObj
	 * @param {Object} srcProp
	 * @returns {Int}
	 */
	getObjRefRelationIndex: function(srcObj, srcProp)
	{
		if (this._enableObjRefRelations)
			return this.getObjRefRelationManager().getRelationIndex(srcObj, srcProp);
		else
			return -1;
	},
	/**
	 * Get a object reference relation.
	 * @param {Kekule.ChemObject} srcObj
	 * @param {Object} srcProp
	 * @returns {Object}
	 */
	getObjRefRelation: function(srcObj, srcProp)
	{
		if (this._enableObjRefRelations)
			return this.getObjRefRelationManager().getRelation(srcObj, srcProp);
		else
			return null;
	},
	/**
	 * Remove a object reference relation.
	 * @param {Kekule.ChemObject} srcObj
	 * @param {Object} srcProp
	 */
	releaseObjRefRelation: function(srcObj, srcProp)
	{
		if (this._enableObjRefRelations)
			return this.getObjRefRelationManager().releaseRelation(srcObj, srcProp);
		else
			return null;
	},
	/**
	 * Find all object reference relations meeting conditions.
	 * @param {Hash} conditions
	 * @param {Hash} options
	 * @returns {Array}
	 */
	findObjRefRelations: function(conditions, options)
	{
		if (this._enableObjRefRelations)
			return this.getObjRefRelationManager().findRelations(conditions, options);
		else
			return [];
	}
});
Kekule.ClassDefineUtils.addStandardSizeSupport(Kekule.ChemSpace);

/**
 * Represent intermediate chem space object, used internally.
 * @private
 */
Kekule.IntermediateChemSpace = Class.create(Kekule.ChemSpace,
/** @lends Kekule.IntermediateChemSpace# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IntermediateChemSpace',
	/** @constructs */
	initialize: function($super, id)
	{
		$super(id);
		this.setPropStoreFieldValue('enableAutoId', false);
		this._enableObjRefRelations = false;  // private, force not use relation manager for performance
		this._autoUpdateObjRefRelations = false;  // private
	}
});


/**
 * An document to hold a set of other {@link Kekule.ChemObject}, like document in HTML or XML.
 * {@link Kekule.ChemObject#owner} property of each object the space should be set to this one.
 * In one document, id of each object should be unique.
 * @class
 * @augments Kekule.ChemSpace
 * @param {String} id Id of this object.
 *
 * //@property {Kekule.ChemObject} docObj Root object of document, like documentElement in HTML or XML.
 */
Kekule.ChemDocument = Class.create(Kekule.ChemSpace,
/** @lends Kekule.ChemDocument# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemDocument',
	/** @private */
	initProperties: function()
	{
		/*
		this.defineProp('docObj', {
			'dataType': 'Kekule.ChemObject',
			'setter': function(value)
				{
					var old = this.getDocObj();
					if (old)
						old.setOwner(null);
					if (value)
						value.setOwner(this);
					this.setPropStoreFieldValue('docObj', value);
				}
		});
		*/
	},
	/** @ignore */
	getAutoIdPrefix: function()
	{
		return 'd';
	}
});


/**
 * A manager class of object reference relations (1:1 or 1:n) between chem object (srcObj.prop = destObjOrObjs).
 * Used internally, user should not use this class directly.
 * @class
 * @augments ObjectEx
 * @param {Kekule.ChemSpace} owner Owner of all containing relations.
 *
 * @property {Kekule.ChemSpace} owner Owner of all containing relations.
 *
 * @ignore
 */
Kekule.ObjRefRelationManager = Class.create(ObjectEx,
/** @lends Kekule.ObjRefRelationManager# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ObjRefRelationManager',
	/** @constructs */
	initialize: function($super, owner)
	{
		$super();
		this.setOwner(owner);
		this.setPropStoreFieldValue('relations', []);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('owner', {'dataType': 'Kekule.ChemObject', 'serializable': false});
		this.defineProp('relations', {'dataType': DataType.ARRAY, 'serializable': false, 'setter': null});
	},

	/**
	 * Create a new relation.
	 * @param {Kekule.ChemObject} srcObj
	 * @param {Object} srcProp
	 * @param {Variant} destObjOrObjs An object or array of objects.
	 * @return {Object}
	 */
	createRelation: function(srcObj, srcProp, destObjOrObjs)
	{
		var result = {'srcObj': srcObj, 'srcProp': srcProp, 'dest': destObjOrObjs};
		this.getRelations().push(result);
		return result;
	},
	/**
	 * Modify an existing relation. If it not exists, a new one will be created.
	 * @param {Kekule.ChemObject} srcObj
	 * @param {Object} srcProp
	 * @param {Variant} destObjOrObjs An object or array of objects.
	 * @return {Object}
	 */
	modifyRelation: function(srcObj, srcProp, destObjOrObjs)
	{
		var isRelease = (!destObjOrObjs || (Kekule.ArrayUtils.isArray(destObjOrObjs) && !destObjOrObjs.length));
		var rel = this.getRelation(srcObj, srcProp);
		if (!isRelease)
		{
			if (!rel)
				rel = this.createRelation(srcObj, srcProp, destObjOrObjs);
			else
				rel.dest = destObjOrObjs;
			return rel;
		}
		else
		{
			if (rel)
				this.removeRelation(rel);
			return null;
		}
	},
	/**
	 * Find a relation.
	 * @param {Kekule.ChemObject} srcObj
	 * @param {Object} srcProp
	 */
	getRelationIndex: function(srcObj, srcProp)
	{
		var relations = this.getRelations();
		for (var i = 0, l = relations.length; i < l; ++i)
		{
			var rel = relations[i];
			if (rel.srcObj === srcObj && rel.srcProp === srcProp)
				return i;
		}
		return -1;
	},
	/**
	 * Find a relation.
	 * @param {Kekule.ChemObject} srcObj
	 * @param {Object} srcProp
	 */
	getRelation: function(srcObj, srcProp)
	{
		var relations = this.getRelations();
		var index = this.getRelationIndex(srcObj, srcProp);
		if (index >= 0)
			return relations[index];
		else
			return null;
	},
	/**
	 * Remove a relation.
	 * @param {Kekule.ChemObject} srcObj
	 * @param {Object} srcProp
	 */
	releaseRelation: function(srcObj, srcProp)
	{
		var relations = this.getRelations();
		var index = this.getRelationIndex(srcObj, srcProp);
		if (index >= 0)
			relations.splice(index, 1);
	},
	/**
	 * Remove a relation.
	 * @param {Object} relation
	 */
	removeRelation: function(relation)
	{
		var relations = this.getRelations();
		var index = relations.indexOf(relation);
		if (index >= 0)
			relations.splice(index, 1);
	},

	/**
	 * Find all relations meeting conditions.
	 * @param {Hash} conditions
	 * @param {Hash} options
	 * @returns {Array}
	 */
	findRelations: function(conditions, options)
	{
		//var ops = Object.create(options || null);
		var ops = options || {};
		var result = [];
		var testConditions = Object.extend({}, conditions);
		var checkDest = false;
		var conditionDest;
		if (testConditions.dest)  // dest should be handled alone
		{
			delete testConditions.dest;
			checkDest = true;
			conditionDest = Kekule.ArrayUtils.toArray(conditions.dest);
		}

		var relations = this.getRelations();
		for (var i = 0, l = relations.length; i < l; ++i)
		{
			var rel = relations[i];
			var passed = false;
			passed = Kekule.ObjUtils.match(rel, testConditions);
			if (passed && checkDest)
			{
				var relDest = Kekule.ArrayUtils.toArray(rel.dest);
				if (ops.checkDestChildren)
				{
					passed = this._hasChildOrSelfOfParents(relDest, conditionDest);
				}
				else
					passed = Kekule.ArrayUtils.intersect(relDest, conditionDest).length === conditionDest.length;
			}
			if (passed)
				result.push(rel);
		}
		return result;
	},
	/** @private */
	_hasChildOrSelfOfParents: function(objs, parents)
	{
		for (var i = 0, ii = objs.length; i < ii; ++i)
		{
			var obj = objs[i];
			for (var j = 0, jj = parents.length; j < jj; ++j)
			{
				var parent = parents[j];
				if (obj === parent || (obj.isChildOf && obj.isChildOf(parent)))
					return true;
			}
		}
		return false;
	}
});

})();

