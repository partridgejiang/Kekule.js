/**
 *  @fileoverview
 *  Classes and methods to support serialization of ObjectEx.
 *
 *  @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /lan/xmlJsons.js
 */

var
/**
 * @class
 * @description Base class of all concrete object serializers.
 * Object serializer provides general procedures to save/load an object. However, classes
 *   inherited from ObjectEx can define their custom save/load. There are two types of custom
 *   methods can be applied.
 * 1. Custom object save / load methods. Those methods should be named as doSaveObj / doLoadObj, each has
 *   the same parameters: (obj, storageNode, serializer) where obj is the object to be saved,
 *   serializer is the serializer instance currently used.
 * 2. Custom property save / load methods. Those methods should be named as doSaveProp / doLoadProp, each has
 *   the same parameters: (obj, prop, storageNode, serializer) where prop is the property info.
 *   Those property save / load methods are especially useful when some certain property in an object
 *   have to be serialize/deserialized specially. If those methods are defined, all properties will be
 *   passed to such methods to save or load. If only a few (not all) properties should be handled specially,
 *   you can just return null in those methods, and then the default save / load process of serializer will
 *   take the action. Otherwise, please return a true value.
 */
ObjSerializer = Class.create(
/** @lends ObjSerializer# */
{
	/** @private */
	CLASS_NAME: 'ObjSerializer',

	/**
	 * Convert simple value to a serializable form. Used for saving object. Descendants can override this.
	 * @param {Variant} value
	 * @returns {Variant}
	 * @private
	 */
	serializeValue: function(value)
	{
		return value;  // do no conversion here
	},

	/**
	 * Convert a serialized value to its origin form. Used for loading object. Descendants can override this.
	 * @param {Variant} value
	 * @param {String} preferedType 'string', 'number', 'boolean' and so on
	 * @returns {Variant}
	 * @private
	 */
	deserializeValue: function(value, preferedType)
	{
		return value;   // do no conversion here
	},
	/**
	 * Convert a property or field name to a suitable storage form. Used for saving object. Descendants can override this.
	 * @param {String} name Property or field name
	 * @returns {String} Converted storage name.
	 * @private
	 */
	propNameToStorageName: function(name)
	{
		return name;  // do no conversion here
	},
	/**
	 * Convert a storage name to its origin form. Used for loading object. Descendants can override this.
	 * @param {String} name Storage name
	 * @returns {String} Original property or field name.
	 * @private
	 */
	storageNameToPropName: function(name)
	{
		return name;  // do no conversion here
	},

	/**
	 * Get custom save method of obj. Usually obj.doSaveObj
	 * @param {Variant} obj Should be a {@link ObjectEx} or a normal object.
	 * @returns {Function} Custom save method or null.
	 * @private
	 */
	getObjCustomSaveMethod: function(obj)
  {
    return (obj.doSaveObj);
  },
	/**
	 * Get custom load method of obj. Usually obj.doLoadObj
	 * @param {Variant} obj Should be a {@link ObjectEx} or a normal object.
	 * @returns {Function} Custom load method or null.
	 * @private
	 */
	getObjCustomLoadMethod: function(obj)
  {
    return (obj.doLoadObj);
  },
	/**
	 * Get custom save method of a special property of obj. Usually obj.doSaveProp
	 * @param {ObjectEx} obj
	 * @returns {Function} Custom save method or null.
	 * @private
	 */
	getObjCustomPropSaveMethod: function(obj)
  {
    return (obj.doSaveProp);
  },
	/**
	 * Get custom load method of a special property of obj. Usually obj.doLoadProp
	 * @param {ObjectEx} obj Should be a {@link ObjectEx} or a normal object.
	 * @returns {Function} Custom load method or null.
	 * @private
	 */
	getObjCustomPropLoadMethod: function(obj)
  {
    return (obj.doLoadProp);
  },
	/**
	 * Check if value is undefined
	 * @param {Variant} value
	 * @returns {Bool}
	 * @private
	 */
	isUndefined: function(value)
	{
		return DataType.isUndefinedValue(value);
	},
	/**
	 * Check if value is null
	 * @param {Variant} value
	 * @returns {Bool}
	 * @private
	 */
	isNull: function(value)
	{
		return (value === null);
	},
	/**
	 * Check if value is NaN
	 * @param {Variant} value
	 * @returns {Bool}
	 * @private
	 */
	isNaN: function(value)
	{
		return value != value;
	},
	/**
	 * Check if value is a function.
	 * @param {Variant} value
	 * @returns {Bool}
	 * @private
	 */
	isFunction: function(value)
	{
		return DataType.isFunctionValue(value);
	},
	/**
	 * Check if an value is an Array
	 * @param {Variant} value
	 * @returns {Bool}
	 * @private
	 */
	isArray: function(value)
	{
		return DataType.isArrayValue(value);
	},
	/**
	 * Check if an value is an instance of Date.
	 * @param {Variant} value
	 * @returns {Bool}
	 * @private
	 */
	isDate: function(value)
	{
		return DataType.isDateValue(value);
	},
	/**
	 * Check if an value is an Object
	 * @param {Variant} value
	 * @returns {Bool}
	 * @private
	 */
	isObject: function(value)
	{
		return DataType.isObjectValue(value);
	},
	/**
	 * Check if an value is an instance of ObjectEx
	 * @param {Variant} value
	 * @returns {Bool}
	 * @private
	 */
	isObjectEx: function(value)
	{
		return DataType.isObjectExValue(value);
	},
	/**
	 * Check if value is Number or String or Boolean, or can be saved in simple form (like Date).
	 * @param {Variant} value
	 * @returns {Bool}
	 * @private
	 */
	isSimpleType: function(value)
	{
		var s = typeof(value);
		return (s == 'string') || (s == 'number') || (s == 'boolean') || (s == 'undefined')
			|| (this.isNull(value));
	},
	/**
	 * Check if value is Object or Array
	 * @param {Variant} value
	 * @returns {Bool}
	 * @private
	 */
	isComplexType: function(value)
	{
		return (!this.isSimpleType(value));
	},

	// Methods about storage node
	/**
	 * Create a sub node of storageNode. Descendants should override this method.
	 * @param {Object} storageNode
	 * @param {String} name
	 * @param {Bool} isForArray Whether this child node is used to store an array object.
	 * @returns {Variant} Sub node created.
	 * @private
	 */
	createChildStorageNode: function(storageNode, name, isForArray)
	{
		// do nothing here
	},
	/**
	 * Create and append a sub node under parentNode to store array item.
	 * @param {Object} parentNode
	 * @param {String} name
	 * @param {Bool} isForArray Whether this child node is used to store an array object.
	 * @returns {Variant} Sub node created.
	 * @private
	 */
	appendArrayItemStorageNode: function(parentNode, name, isForArray)
	{
		// do nothing here
	},
	/** @private */
	getNameForArrayItemStorageNode: function(arrayItemObj)
	{
		/*
		var nodeName = arrayItemObj.getSerializationName? arrayItemObj.getSerializationName(): null;
		if (!nodeName)
			nodeName = this.getDefaultArrayItemStorageName();
		*/
		var nodeName = this.getDefaultArrayItemStorageName();
		return nodeName;
	},
	/**
	 * Get a sub node with nodeName
	 * @param {Object} parentNode
	 * @param {Object} nodeName
	 * @private
	 */
	getChildStorageNode: function(parentNode, nodeName)
	{
		//do nothing here
	},
	/**
	 * Get all child nodes storing items in an array node
	 * @param {Object} arrayNode
	 * @private
	 */
	getAllArrayItemStorageNodes: function(arrayNode)
	{
		// do nothing here
	},
	/**
	 * Returns all storage names stored in this node
	 * @param {Object} storageNode
	 * @returns {Array} Array of stored names.
	 * @private
	 */
	getAllStoredStorageNames: function(storageNode)
	{
		// do nothing here
	},
	/**
	 * Set a special type tag to storageNode.
	 * @param {Object} storageNode
	 * @param {String} explicitType
	 * @private
	 */
	setStorageNodeExplicitType: function(storageNode, explicitType)
	{
		// do nothing here
	},
	/**
	 * Get explicit type information of a storageNode. If not found, returns null
	 * @param {Object} storageNode
	 * @returns {String}
	 * @private
	 */
	getStorageNodeExplicitType: function(storageNode)
	{
		// do nothing here
	},
	/**
	 * Get tag name of storage node. This method is very useful in XmlObjSerializer, but has little use in JsonObjSerializer
	 * @param {Object} storageNode
	 * @returns {String}
	 * @private
	 */
	getStorageNodeName: function(storageNode)
	{
		// do nothing here
	},
	/**
	 * Check if a node stores a complex value
	 * @param {Object} storageNode
	 * @returns {Bool}
	 * @private
	 */
	isComplexStorageNode: function(storageNode)
	{
		// do nothing here
	},
	/**
	 * Check if a node stores a complex array item value
	 * @param {Object} storageNode
	 * @returns {Bool}
	 * @private
	 */
	isComplexArrayItemStorageNode: function(storageNode)
	{
		// do nothing here
	},
	/**
	 * Check if a node stores a simple value
	 * @param {Object} storageNode
	 * @returns {Bool}
	 * @private
	 */
	isSimpleStorageNode: function(storageNode)
	{
		// do nothing here
	},
	/**
	 * Return a string of type of value.
	 * @param {Object} value
	 * @returns {String}
	 * @private
	 */
	getValueExplicitType: function(value)
	{
		/*
		if (this.isObjectEx(value))
			return value.getClassName();
		else if (this.isArray(value))
			return 'Array';
		else if (this.isDate(value))
			return 'Date';
		else
			return typeof(value);
		*/
		if (value instanceof ObjectEx)
			return value.getClassName();
		else if (this.isObject(value))
			return DataType.OBJECT;
		else if (this.isArray(value))
			return DataType.ARRAY;
		else if (this.isDate(value))
			return DataType.DATE;
		else  // simple value?
			return (typeof value);
	},

	/**
	 * Returns a default to store an array item.
	 * @returns {String}
	 * @private
	 */
	getDefaultArrayItemStorageName: function()
	{
		return 'item';
	},
	getDefaultDateStorageName: function()
	{
		return 'date';
	},

	// Methods used for save
	/**
	 * Save an object to destNode.
	 * @param {Object} obj Object to save, can be a normal Object or {@link ObjectEx}.
	 * @param {Object} storageNode Node to save data. Each concrete serializer has its own type of node to store data.
	 * @param {Hash} options Save options. Can have the following fields:
	 *   {
	 *     saveDefaultValues: Bool,
	 *     propFilter: function(prop, obj), return value decides which property should be saved
	 *   }
	 */
	save: function save(obj, storageNode, options)
	{
		if (typeof(obj) == 'object')
		{
			var customSaveMethod = this.getObjCustomSaveMethod(obj);
			if (customSaveMethod)
			{
				return customSaveMethod(obj, storageNode, this);
			}
		}
		var result = this.doSave(obj, storageNode, options || {});
		if (result && this.isFunction(obj.saved))
			obj.saved();
		return result;
	},

	/**
	 * The real save job is done here. Descendants can override this.
	 * @param {Object} obj
	 * @param {Object} storageNode
	 * @param {Hash} options Save options.
	 * @private
	 */
	doSave: function(obj, storageNode, options)
	{
		if (typeof(obj) == 'object')
		{
			if (obj instanceof ObjectEx)  // ObjectEx
				this.doSaveObjectEx(obj, storageNode, options);
			else if (this.isArray(obj))  // Array
				this.doSaveArray(obj, storageNode);
			else if (this.isDate(obj))  // date
				this.doSaveDate(obj, storageNode);
			else  // a normal object
				this.doSaveSimpleObject(obj, storageNode);
		}
		this.setStorageNodeExplicitType(storageNode, this.getValueExplicitType(obj));
		return obj;
		//return storageNode;
	},
	/**
	 * Save a normal JS object to storageNode. Serialize all fields.
	 * @param {Object} obj
	 * @param {Object} storageNode
	 * @private
	 */
	doSaveSimpleObject: function(obj, storageNode)
	{
		for (var fieldName in obj)
		{
			if (!obj.hasOwnProperty(fieldName))
				continue;
			var fieldValue = obj[fieldName];
			var explicitType;
			if (this.isComplexType(fieldValue))
				explicitType = this.getValueExplicitType(fieldValue);
			this.doSaveFieldValue(obj, fieldName, fieldValue, storageNode, explicitType);
		}
	},
	/**
	 * Save an array to storageNode. Serialize all items.
	 * @param {Array} arrayObj
	 * @param {Object} storageNode
	 * @private
	 */
	doSaveArray: function(arrayObj, storageNode)
	{
		for (var i = 0, l = arrayObj.length; i < l; ++i)
		{
			var item = arrayObj[i];
			var nodeName = this.getNameForArrayItemStorageNode(item);
			if (this.isComplexType(item))
			{
				var subNode = this.appendArrayItemStorageNode(storageNode, this.propNameToStorageName(nodeName), this.isArray(item));
				this.setStorageNodeExplicitType(subNode, this.getValueExplicitType(item));
				this.save(item, subNode);
			}
			else // simple type
				this.doAppendArrayItemSimpleValue(this.serializeValue(item), typeof(item), storageNode);
		}
	},
	/**
	 * Save an date to storageNode..
	 * @param {Date} obj
	 * @param {Object} storageNode
	 * @private
	 */
	doSaveDate: function(obj, storageNode)
	{
		var s = obj.toUTCString();
		this.doSaveSimpleValue(obj,
			this.propNameToStorageName(this.getDefaultDateStorageName()),
			this.serializeValue(s), DataType.DATE, storageNode);
	},
	/**
	 * Save a instance of {@link ObjectEx} to storageNode. Serialize all serializable properties.
	 * @param {ObjectEx} obj
	 * @param {Object} storageNode
	 * @param {Hash} options Save options.
	 * @private
	 */
	doSaveObjectEx: function(obj, storageNode, options)
	{
		var props = obj.getAllPropList();
		var propFilter = options.propFilter;
		for (var i = 0, l = props.getLength(); i < l; ++i)
		{
			var prop = props.getPropInfoAt(i);
			var needSave = propFilter? propFilter(prop, obj): true;

			if (!needSave)
				continue;

			var customSaveMethod = this.getObjCustomPropSaveMethod(obj);
			var saved = false;
			if (customSaveMethod)
				saved = customSaveMethod(obj, prop, storageNode, this);
			if (!!saved)
				continue;

			if (prop.serializable)  // a serialzable property, handle
				this.doSaveObjectExProp(obj, prop, storageNode, options);
		}
	},
	/**
	 * Save a property of instance of {@link ObjectEx}.
	 * @param {ObjectEx} obj Object to save.
	 * @param {Object} prop Property to save.
	 * @param {Object} storageNode
	 * @param {Hash} options Save options.
	 * @private
	 */
	doSaveObjectExProp: function(obj, prop, storageNode, options)
	{
		var propName = prop.name;
		var propType = prop.dataType;
		var propValue = /* obj.getPropStoreFieldValue(propName); // */ obj.getPropValue(propName);
		if (options.saveDefaultValues || (propValue !== prop.defaultValue))  // if value is still the default one, no need to save
		{
			var explicitType;
			if (propValue instanceof ObjectEx)
			{
				if (propValue.getClassName() != propType)
				{
					explicitType = propValue.getClassName();
				}
			}
			else
			{
				if (this.isComplexType(propValue))
				{
					explicitType = this.getValueExplicitType(propValue);
					if (explicitType == propType)  // already has type info, no need to set explicit type
						explicitType = undefined;
				}
			}
			this.doSaveFieldValue(obj, propName, propValue, storageNode, explicitType);
		}
	},
	/**
	 * Save a name=value pair to current storageNode
	 * @param {Object} obj
	 * @param {String} fieldName
	 * @param {Variant} fieldValue
	 * @param {Object} storageNode
	 * @param {String} explicitType
	 * @private
	 */
	doSaveFieldValue: function(obj, fieldName, fieldValue, storageNode, explicitType)
	{
		if (typeof(fieldValue) != 'function')  // can not save a function currently
		{
			if (this.isComplexType(fieldValue)) // a complex value, whether an ObjectEx or Object or Array
			{
				subNode = this.createChildStorageNode(storageNode, this.propNameToStorageName(fieldName), this.isArray(fieldValue));
				if (explicitType)
					this.setStorageNodeExplicitType(subNode, explicitType);
				this.save(fieldValue, subNode);
			}
			else // a simple value
			{
				this.doSaveSimpleValue(obj, this.propNameToStorageName(fieldName),
				  this.serializeValue(fieldValue), this.getValueExplicitType(fieldValue), storageNode);
			}
		}
	},
	/**
	 * Save a simple value (non-object, just number, boolean or string) to current storageNode.
	 *   The name and value should already be converted.
	 * @param {Object} obj
	 * @param {String} storageName
	 * @param {Variant} storageValue
	 * @param {String} valueType Type of original value.
	 * @param {Object} storageNode
	 * @private
	 */
	doSaveSimpleValue: function(obj, storageName, storageValue, valueType, storageNode)
	{
		// do nothing here
	},
	/**
	 * Append a simple value to an array storage node.
	 * @param {Variant} storageValue
	 * @param {String} valueType Type of original value.
	 * @param {Object} arrayStorageNode
	 * @private
	 */
	doAppendArrayItemSimpleValue: function(storageValue, valueType, arrayStorageNode)
	{
		// do nothing here
	},

	// Methods to load data
	/**
	 * load an object from storageNode.
	 * @param {Object} obj Object to load, can be a normal Object or {@link ObjectEx}.
	 *   Leave this param to null will force the serializer create a new instance.
	 * @param {Object} storageNode Node to save data. Each concrete serializer has its own type of node to store data.
	 * @returns {Object} Object loaded.
	 */
	load: function(obj, storageNode)
	{
		if (!obj)  // obj is null, create new one
		{
			var objType = this.getStorageNodeExplicitType(storageNode);
			if (objType)
				obj = DataType.createInstance(objType);
			else if (this.doLoadUntypedNode)
				return this.doLoadUntypedNode(storageNode);
			else
				return null;   // can not load
		}
		if (typeof(obj) === 'object')
		{
			var customLoadMethod = this.getObjCustomLoadMethod(obj);
			if (customLoadMethod)
			{
				return customLoadMethod(obj, storageNode, this);
			}
		}
		var result = this.doLoad(obj, storageNode);
		if (result && this.isFunction(obj.loaded))
			obj.loaded();
		return result;
	},
	/**
	 * The real load job is done here. Descendants can override this.
	 * @param {Object} obj
	 * @param {Object} storageNode
	 * @private
	 */
	doLoad: function(obj, storageNode)
	{
		var explicitType = this.getStorageNodeExplicitType(storageNode);
		if (typeof(obj) == 'object')
		{
			if (obj instanceof ObjectEx)  // ObjectEx
				obj = this.doLoadObjectEx(obj, storageNode);
			else if (this.isArray(obj)) // Array
				obj = this.doLoadArray(obj, storageNode);
			else if (this.isDate(obj))  // date
				obj = this.doLoadDate(obj, storageNode);
			else // a normal object
 				obj = this.doLoadSimpleObject(obj, storageNode);
		}
		return obj;
	},
	/**
	 * Load an array from storageNode. Deserialize all items.
	 * @param {Array} arrayObj
	 * @param {Object} storageNode
	 * @private
	 */
	doLoadArray: function(arrayObj, storageNode)
	{
		var itemNodes = this.getAllArrayItemStorageNodes(storageNode);
		for (var i = 0, l = itemNodes.length; i < l; ++i)
		{
			var node = itemNodes[i];
			//if (node)
			{
				if (this.isComplexArrayItemStorageNode(node))
				{
					var obj;
					var valueType = this.getStorageNodeExplicitType(node) || this.getStorageNodeName(node);
					if (valueType) // complex value
					{
						obj = DataType.createInstance(valueType);
						this.load(obj, node);
					}
					else
					{
						// guess it is an object
						obj = {};
						this.load(obj, node);
					}
					arrayObj.push(obj);
				}
				else // simple value
 				{
					var value = this.deserializeValue(this.doGetArrayItemSimpleStorageValue(node));
					arrayObj.push(value);
				}
			}
		}
		return arrayObj;
	},
	/**
	 * Load a date object from storageNode.
	 * @param {Date} obj
	 * @param {Object} storageNode
	 * @private
	 */
	doLoadDate: function(obj, storageNode)
	{
		var storageName = this.propNameToStorageName(this.getDefaultDateStorageName());
		var s = this.doLoadSimpleValue(obj, storageName, DataType.DATE, storageNode);
		if (s)
		{
			var r = new Date(s);
			//obj = r;
			obj.copyFrom(r);
			return obj;
		}
		else
			return undefined;
	},
	/**
	 * Load a normal JS object from storageNode. Deserialize all fields.
	 * @param {Object} obj
	 * @param {Object} storageNode
	 * @private
	 */
	doLoadSimpleObject: function(obj, storageNode)
	{
		// fetch all stored fields
		var storageNames = this.getAllStoredStorageNames(storageNode);
		for (var i = 0, l = storageNames.length; i < l; ++i)
		{
			var storageName = storageNames[i];
			var fieldName = this.storageNameToPropName(storageName);
			// check if it is a complex value
			var subNode = this.getChildStorageNode(storageNode, storageName);
			if (subNode)  // complex value
			{
				var subObj;
				var explicitType = this.getStorageNodeExplicitType(subNode);
				if (explicitType)
				{
					subObj = DataType.createInstance(explicitType);
				}
				else
					subObj = {};  // guess it is a object
				this.load(subObj, subNode);
				obj[fieldName] = subObj;
			}
			else // simple type
			{
				var value = this.doLoadSimpleValue(obj, storageName, null, storageNode);  // value type is unknown
				obj[fieldName] = value;
			}
		}
		return obj;
	},
	/**
	 * Load a instance of {@link ObjectEx} to storageNode. Deserialize all serializable properties.
	 * @param {ObjectEx} obj
	 * @param {Object} storageNode
	 * @private
	 */
	doLoadObjectEx: function(obj, storageNode)
	{
		var props = obj.getAllPropList();
		for (var i = 0, l = props.getLength(); i < l; ++i)
		{
			var prop = props.getPropInfoAt(i);

			if (!prop.serializable)  // not a serialzable property, bypass
				continue;

			var customLoadMethod = this.getObjCustomPropLoadMethod(obj);
			var loaded = false;
			if (customLoadMethod)
			{
				loaded = customLoadMethod(obj, prop, storageNode, this);
			}
			if (!!loaded)
				continue;

			this.doLoadObjectExProp(obj, prop, storageNode);
		}
		return obj;
	},
	/**
	 * Load a property of instance of {@link ObjectEx}.
	 * @param {ObjectEx} obj Object to save.
	 * @param {Object} prop Property to save.
	 * @param {Object} storageNode
	 * @private
	 */
	doLoadObjectExProp: function(obj, prop, storageNode)
	{
		var propName = prop.name;
		var propType = prop.dataType;
		var propValue = this.doLoadFieldValue(obj, propName, storageNode, propType);

		if ((propValue !== null) && (propValue !== undefined))
		{
			obj.setPropValue(propName, propValue, true);  // set value and ignore read only
		}
	},
	/**
	 * Load a value from current storageNode
	 * @param {Object} obj
	 * @param {String} fieldName
	 * @param {Object} storageNode
	 * @param {String} supposedValueType
	 * @returns {Variant} Value loaded
	 * @private
	 */
	doLoadFieldValue: function(obj, fieldName, storageNode, supposedValueType)
	{
		var result;
		var handled = false;
		if (DataType.isComplexType(supposedValueType))  // a complex type, should check sub node
		{
			var subNode = this.getChildStorageNode(storageNode, this.propNameToStorageName(fieldName));
			if (subNode)
			{
				// check subNode explicit type
				var explicitType = this.getStorageNodeExplicitType(subNode);
				if (explicitType && (explicitType != supposedValueType))  // explicitType and supposedValueType not match, follow explicitType
				{
					result = DataType.createInstance(explicitType);
				}
				else
					result = DataType.createInstance(supposedValueType);
				this.load(result, subNode);
				handled = true;
			}
		}
		if (DataType.isSimpleType(supposedValueType) || (!handled))  // simple type, or load complex subnode not found, load directly
		{
			result = this.doLoadSimpleValue(obj, this.propNameToStorageName(fieldName), supposedValueType, storageNode);
		}
		return result;
	},
	/**
	 * Load a simple value (non-object, just number, boolean or string) from current storageNode.
	 * @param {Object} obj
	 * @param {String} storageName
	 * @param {String} valueType Type of original value.
	 * @param {Object} storageNode
	 * @private
	 */
	doLoadSimpleValue: function(obj, storageName, valueType, storageNode)
	{
		var storageValue = this.doLoadSimpleStorageValue(storageName, storageNode);
		return this.deserializeValue(storageValue, valueType);
	},
	/** @private */
	doLoadSimpleStorageValue: function(storageName, storageNode)
	{
		// do nothing here
	},
	/**
	 * Get simple storage value from an array item node
	 * @param {Object} arrayItemStorageNode
	 * @returns {Variant}
	 * @private
	 */
	doGetArrayItemSimpleStorageValue: function(arrayItemStorageNode)
	{
		// do nothing here
	}
});

var
/**
 * Use JSON to do serialization job.
 * @class
 * @augments ObjSerializer
 */
JsonObjSerializer = Class.create(ObjSerializer,
/** @lends JsonObjSerializer# */
{
	/** @private */
	CLASS_NAME: 'JsonObjSerializer',
	/** @private */
	TYPE_TAG_NAME: '__type__',
	/** @private */
	createChildStorageNode: function(storageNode, name, isForArray)
	{
		var result = isForArray? []: {};
		storageNode[name] = result;
		return result;
	},
	/** @private */
	appendArrayItemStorageNode: function(parentNode, name, isForArray)
	{
		var result = isForArray? []: {};
		parentNode.push(result);
		return result;
	},
	/** @private */
	getChildStorageNode: function(parentNode, nodeName)
	{
		var result = parentNode[nodeName];
		if (this.isSimpleType(result))  // not a object or array, is a simple value rather than sub node
		{
			result = null;
		}
		return result;
	},
	/** @private */
	getAllArrayItemStorageNodes: function(arrayNode)
	{
		var result = Array.prototype.slice.call(arrayNode);
		return result;
	},
	/** @private */
	getAllStoredStorageNames: function(storageNode)
	{
		var result = [];
		for (var name in storageNode)
		{
			if (storageNode.hasOwnProperty(name)/* && (name != this.TYPE_TAG_NAME)*/)
			{
				if (name != this.TYPE_TAG_NAME)
					result.push(name);
			}
		}
		return result;
	},
	/** @private */
	isComplexStorageNode: function(storageNode)
	{
		return this.isComplexType(storageNode);
	},
	/** @private */
	isComplexArrayItemStorageNode: function(storageNode)
	{
		return this.isComplexStorageNode(storageNode);
	},
	/** @private */
	isSimpleStorageNode: function(storageNode)
	{
		return this.isSimpleType(storageNode);
	},
	/** @private */
	setStorageNodeExplicitType: function(storageNode, explicitType)
	{
		if (!this.isArray(storageNode))  // do not set array tag to a []
			storageNode[this.TYPE_TAG_NAME] = explicitType;
	},
	/** @private */
	getStorageNodeExplicitType: function(storageNode)
	{
		var r = storageNode[this.TYPE_TAG_NAME] || null;
		if ((!r) && this.isArray(storageNode))
			return DataType.ARRAY;
		else
			return r;
	},
	/** @private */
	doSaveSimpleValue: function(obj, storageName, storageValue, valueType, storageNode)
	{
		storageNode[storageName] = storageValue;
	},
	/** @private */
	doAppendArrayItemSimpleValue: function(storageValue, valueType, arrayStorageNode)
	{
		return arrayStorageNode.push(storageValue);
	},
	/** @private */
	doLoadSimpleStorageValue: function(storageName, storageNode)
	{
		return storageNode[storageName];
	},
	/** @private */
	doLoadUntypedNode: function(storageNode)
	{
		return storageNode;
	},
	/** @private */
	doGetArrayItemSimpleStorageValue: function(arrayItemStorageNode)
	{
		// simple values are directly saved in array
		return arrayItemStorageNode;
	}
});

var
/**
 * Use XML to do serialization job.
 * @class
 * @augments ObjSerializer
 */
XmlObjSerializer = Class.create(ObjSerializer,
/** @lends XmlObjSerializer# */
{
	/** @private */
	CLASS_NAME: 'XmlObjSerializer',
	/** @private */
	TYPE_TAG_NAME: 'dataType',
	/** @private */
	//ARRAY_ITEM_VALUE_ATTRIB: 'value',
	/** @private */
	//STRUE: '$TRUE',
	/** @private */
	//SFALSE: '$FALSE',
	/** @private */
	//SUNDEFINED: '$UNDEFINED',
	/** @private */
	//SNULL: '$NULL',
	/** @private */
	//SNAN: '$NAN',
	/** @private */
	//SPOSITIVE: '+',
	/** @private */
	//SNEGATIVE: '-',
	/** @private */
	/*
	SDATEPREFIX: '%',
	*/
	/** @private */
	getLocalName: function(elem)
	{
		return elem.localName || elem.baseName || elem.nodeName;
	},
	/**
	 * Get text content of an element. Only check first level text node.
	 * @param {Object} elem
	 * @returns {String}
	 * @private
	 */
	getElemTextValue: function(elem)
	{
		var result = '';
		for (var i = 0, l = elem.childNodes.length; i < l; ++i)
		{
			if (elem.childNodes[i].nodeType == Node.TEXT_NODE)
				result += elem.childNodes[i].nodeValue;
		}
		return result;
	},

	/**
	 * As XML store all data in String form, value should be transformed properly under save/load process.
	 * @private
	 */
	serializeValue: function(value)
	{
		/*
		if (this.isNull(value))
			return this.SNULL;
		else if (this.isUndefined(value))
			return this.SUNDEFINED;
		else if (this.isNaN(value))
			return this.SNAN;
		else
		{
			var vtype = DataType.getType(value);
			switch (vtype)
			{
				case 'boolean':
					return value ? this.STRUE : this.SFALSE;
					break;
				case 'number':
					// add '+' or '-' symbol before a number value
					var sign = (value >= 0)? this.SPOSITIVE: '';  //this.SNEGATIVE;
					return sign + value;
					break;
				default:  // string
					return value;
			}
		}
		*/
		return DataType.StringUtils.serializeValue(value);
	},
	/** @private */
	deserializeValue: function(value, preferedType)
	{
		return DataType.StringUtils.deserializeValue(value, preferedType);
		/*
		if (typeof(value) != 'string')
			return value;
		switch(value)
		{
			case this.STRUE: return true; break;
			case this.SFALSE: return false; break;
			case this.SNULL: return null; break;
			case this.SUNDEFINED: return undefined; break;
			case this.SNAN: return NaN; break;
			default:
			{
				if (preferedType)
				{
					switch (preferedType)
					{
						case DataType.FLOAT:
							return parseFloat(value); break;
						case DataType.INT:
							return parseInt(value); break;
						case 'number':
							return parseFloat(value); break;
						case 'boolean':
							return !!value; break;
						default:
							return value;
					}
				}
				else // guess
				{
					var firstChar = value.charAt(0);
					switch (firstChar)
					{
						case this.SPOSITIVE:
						case this.SNEGATIVE: // may be number
							{
								var s = value.substring(1);
								if (this.isAllDigitalChar(s)) // really number
									return parseFloat(value);
								else
									return value;
								break;
							}
						default:
							return value;
					}
				}
			}
		}
		*/
	},
	/** @private */
	createChildStorageNode: function(storageNode, name, isForArray)
	{
		var result = storageNode.ownerDocument.createElement(name);
		storageNode.appendChild(result);
		return result;
	},
	/** @private */
	appendArrayItemStorageNode: function(parentNode, name, isForArray)
	{
		return this.createChildStorageNode(parentNode, name, isForArray);
	},
	/** @private */
	getAllArrayItemStorageNodes: function(arrayNode)
	{
		//var result = Array.prototype.slice.call(arrayNode.getElementsByTagName('*'));
		var result = [];
		for (var i = 0, l = arrayNode.childNodes.length; i < l; ++i)
		{
			var node = arrayNode.childNodes[i];
			if (node.nodeType == Node.ELEMENT_NODE)
			{
				result.push(node);
			}
		}
		return result;
	},
	/** @private */
	getAllStoredStorageNames: function(storageNode)
	{
		var result = [];
		for (var i = 0, l = storageNode.childNodes.length; i < l; ++i)
		{
			var node = storageNode.childNodes[i];
			if (node.nodeType == Node.ELEMENT_NODE)
			{
				if (this.getLocalName(node) != this.TYPE_TAG_NAME)
					result.push(this.getLocalName(node));
			}
		}
		for (var i = 0, l = storageNode.attributes.length; i < l; ++i)
		{
			var attrib = storageNode.attributes[i];
			if (this.getLocalName(attrib) != this.TYPE_TAG_NAME)
				result.push(this.getLocalName(attrib));
		}
		return result;
	},
	/** @private */
	getChildStorageNode: function(parentNode, nodeName)
	{
		var result = null;
		for (var i = 0, l = parentNode.childNodes.length; i < l; ++i)
		{
			var node = parentNode.childNodes[i];
			if (node.nodeType == Node.ELEMENT_NODE)
			{
				if (this.getLocalName(node) == nodeName)
					result = node;
			}
		}
		return result;
	},
	/** @private */
	isComplexStorageNode: function(storageNode)
	{
		return storageNode.nodeType == Node.ELEMENT_NODE;
	},
	/** @private */
	isComplexArrayItemStorageNode: function(storageNode)
	{
		return this.isComplexStorageNode(storageNode)
			&& (storageNode.attributes.length)
			&& (!this.getElemTextValue(storageNode).trim());
			//&& (!storageNode.getAttribute(this.ARRAY_ITEM_VALUE_ATTRIB));
	},
	/** @private */
	isSimpleStorageNode: function(storageNode)
	{
		return storageNode.nodeType == Node.ATTRIBUTE_NODE;
	},
	/** @private */
	setStorageNodeExplicitType: function(storageNode, explicitType)
	{
		storageNode.setAttribute(this.TYPE_TAG_NAME, explicitType);
	},
	/** @private */
	getStorageNodeExplicitType: function(storageNode)
	{
		return storageNode.getAttribute(this.TYPE_TAG_NAME) || null;
	},
	/** @private */
	getStorageNodeName: function(storageNode)
	{
		var result = storageNode.tagName;
		if (result == this.getDefaultArrayItemStorageName())
			return null;
		else
			return result;
	},
	/** @private */
	doSaveSimpleObject: function($super, obj, storageNode)
	{
		$super(obj, storageNode);
		//storageNode.setAttribute('type', typeof(obj));
	},
	/** @private */
	doSaveArray: function($super, arrayObj, storageNode)
	{
		$super(arrayObj, storageNode);
		//storageNode.setAttribute('type', 'array');
	},
	/** @private */
	doSaveSimpleValue: function(obj, storageName, storageValue, valueType, storageNode)
	{
		storageNode.setAttribute(storageName, storageValue);
	},
	/** @private */
	doAppendArrayItemSimpleValue: function(storageValue, valueType, arrayStorageNode)
	{
		var node = this.appendArrayItemStorageNode(arrayStorageNode,
			this.propNameToStorageName(this.getDefaultArrayItemStorageName()), false);
		//this.doSaveSimpleValue(null, this.ARRAY_ITEM_VALUE_ATTRIB, storageValue, valueType, node);
		// save value directly as text node
		var textNode = node.ownerDocument.createTextNode(storageValue);
		node.appendChild(textNode);
	},
	/** @private */
	doLoadSimpleStorageValue: function(storageName, storageNode)
	{
		return storageNode.getAttribute(storageName);
	},
	/** @private */
	doGetArrayItemSimpleStorageValue: function(arrayItemStorageNode)
	{
		//return arrayItemStorageNode.getAttribute(this.ARRAY_ITEM_VALUE_ATTRIB);
		return this.getElemTextValue(arrayItemStorageNode);
	}
});

var
/**
 * Factory to register and create different types of serializer.
 * @class
 */
ObjSerializerFactory = {
	/** @private */
	_serializerClasses: {},
	/** @private */
	_defaultName: null,
	/**
	 * Register a serializer.
	 * @param {String} name Name of serializer.
	 * @param {Class} serializerClass Class of serializer. Null can also be used here to unregister a serializer.
	 * @param {Bool} isDefault Whether this serializer is the default one in factory.
	 */
	registerSerializer: function(name, serializerClass, isDefault)
	{
		var sClass = (typeof(serializerClass) == 'string')?
			ClassEx.findClass(serializerClass): //eval(serializerClass):
			serializerClass;
		ObjSerializerFactory._serializerClasses[name] = sClass;
		if (isDefault)
			ObjSerializerFactory._defaultName = name;
	},
	/**
	 * Create a new serializer by name.
	 * @param {String} name Serializer name. If name not set, the default serializer will be created.
	 * @returns {ObjSerializer} Serializer instance or null (if name not found).
	 */
	getSerializer: function(name)
	{
		var sName = name || ObjSerializerFactory._defaultName;
		if (sName)
		{
			var sClass = ObjSerializerFactory._serializerClasses[sName];
			return sClass? new sClass(): null;
		}
		else
			return null;
	}
};

// Register Json and Xml serializer
(function ()
{
	ObjSerializerFactory.registerSerializer('json', JsonObjSerializer, true);  // JSON is the default one
	ObjSerializerFactory.registerSerializer('xml', XmlObjSerializer);
})();

// extend ObjectEx and add save/load methods
ClassEx.extend(ObjectEx,
/** @lends ObjectEx# */
{
	/**
	 * Save current object to destNode.
	 * @param {Object} destNode Storage node to save object. Different serializer requires different node.
	 * @param {Variant} serializerOrName A {@link ObjSerializer} instance or name registered in {@link ObjSerializerFactory}.
	 *   Can be null to use the default serializer.
	 * @param {Hash} options
	 */
	saveObj: function(destNode, serializerOrName, options)
	{
    if (!serializerOrName)  // use default
      serializer = ObjSerializerFactory.getSerializer();
    else if (typeof(serializerOrName) == 'string')  // is name
      serializer = ObjSerializerFactory.getSerializer(serializerOrName);
		else
			serializer = serializerOrName;
		return serializer.save(this, destNode, options);
	},
	/**
	 * load current object from srcNode.
	 * @param {Object} srcNode Storage node to load object. Different serializer requires different node.
	 * @param {Variant} serializerOrName A {@link ObjSerializer} instance or name registered in {@link ObjSerializerFactory}.
	 *   Can be null to use the default serializer.
	 */
	loadObj: function(srcNode, serializerOrName)
	{
		if (!serializerOrName)  // use default
      serializer = ObjSerializerFactory.getSerializer();
    else if (typeof(serializerOrName) == 'string')  // is name
      serializer = ObjSerializerFactory.getSerializer(serializerOrName);
		else
			serializer = serializerOrName;
		return serializer.load(this, srcNode);
	}
});

// extend to ClassEx, add new save/load method
Object.extend(ClassEx, {
	/**
	 * Save an object to destNode.
	 * @param {Variant} obj
	 * @param {Object} destNode Storage node to save object. Different serializer requires different node.
	 * @param {Variant} serializerOrName A {@link ObjSerializer} instance or name registered in {@link ObjSerializerFactory}.
	 *   Can be null to use the default serializer.
	 * @param {Hash} options
	 */
	saveObj: function(obj, destNode, serializerOrName, options)
	{
		if (!serializerOrName)  // use default
			serializer = ObjSerializerFactory.getSerializer();
		else if (typeof(serializerOrName) == 'string')  // is name
			serializer = ObjSerializerFactory.getSerializer(serializerOrName);
		else
			serializer = serializerOrName;
		return serializer.save(obj, destNode, options);
	},
	/**
	 * load object from srcNode.
	 * @param {Object} srcNode Storage node to load object. Different serializer requires different node.
	 * @param {Variant} serializerOrName A {@link ObjSerializer} instance or name registered in {@link ObjSerializerFactory}.
	 *   Can be null to use the default serializer.
	 */
	loadObj: function(obj, srcNode, serializerOrName)
	{
		if (!serializerOrName)  // use default
			serializer = ObjSerializerFactory.getSerializer();
		else if (typeof(serializerOrName) == 'string')  // is name
			serializer = ObjSerializerFactory.getSerializer(serializerOrName);
		else
			serializer = serializerOrName;
		return serializer.load(obj, srcNode);
	}
});

Object.extend(DataType, {
	/**
	 * Convert a value to JSON string. If value is a complex type (Object, Array, ObjectEx),
	 * JSON serializer will be used.
	 * @param {Variant} value
	 * @param {Hash} options JSON serializer options
	 * @returns {String}
	 */
	valueToJson: function(value, options)
	{
		if (DataType.isSimpleValue(value))
		{
			return JSON.stringify(value);
		}
		else  // complex type, use serializer
		{
			var result = DataType.isArrayValue(value)? []: {};
			ClassEx.saveObj(value, result, 'json', options);
			return JSON.stringify(result);
		}
	},
	/**
	 * Convert a JSON string to value.
	 * JSON serializer may be used if the value is a complex one (Object, Array, ObjectEx, etc.).
	 * @param {String} jsonStr
	 * @returns {Variant}
	 */
	jsonToValue: function(jsonStr)
	{
		var jsonObj = JSON.parse(jsonStr);
		if (!jsonObj || DataType.isSimpleValue(jsonObj))
			return jsonObj;
		else
		{
			return ClassEx.loadObj(null, jsonObj, 'json');
		}
	}
});
