/**
 * @fileoverview
 * Some common utility functions.
 * @author Partridge Jiang
 */

/*
 * requires core/kekule.common.js
 * requires /localizations/
 */

/*
if (!this.Kekule)
{
	Kekule = {};
}
*/

/**
 * Return value of the first setted params.
 * @function
 */
Kekule.oneOf = function()
{
	var args = arguments;
	var notUnset = Kekule.ObjUtils.notUnset;
	for (var i = 0, l = args.length; i < l; ++i)
	{
		if (notUnset(args[i]))
			return args[i];
	}
	return null;
};

/**
 *  A class to help to manipulate Kekule classes.
 *  @class
 */
Kekule.ClassUtils = {
	/**
	 * Get name without Kekule prefix
	 * @param {String} className
	 * @returns {String}
	 */
	getShortClassName: function(className)
	{
		var p = className.indexOf('.');
		if (p >= 0)
			return className.substring(p + 1);
		else
			return className;
	},
	/**
	 * Returns last name part of className (e.g., 'ClassA' from 'Kekule.Scope.ClassA').
	 * @param {String} className
	 * @returns {String}
	 */
	getLastClassName: function(className)
	{
		var p = className.lastIndexOf('.');
		return (p >= 0)? className.substring(p + 1): className;
	},

	/**
	 * Make class behavior like a singleton, add getInstance static method to it.
	 * @param {Object} classObj
	 * @returns {Object}
	 */
	makeSingleton: function(classObj)
	{
		return Object.extend(classObj, {
			_instance: null,
			getInstance: function(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10)
			{
				if (!classObj._instance)
					classObj._instance = new classObj(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10);
				return classObj._instance;
			}
		});
	}
};

/**
 * Util methods about number.
 * @class
 */
Kekule.NumUtils = {
	/**
	 * Check if a number is integer.
	 * @param {Number} num
	 * @returns {Bool}
	 */
	isInteger: function(num)
	{
		return (typeof(num) === 'number') && (parseInt(num, 10) === parseFloat(num));
	},
	/**
	 * Output a string with decimalsLength.
	 * Not the same to Number.toFixed, this method will not pad with zero.
	 * For example, call toDecimals(5.3456, 2) will return '5.35',
	 * but call toDecimals(5.1, 2) will simply return '5.1',
	 * @param {Number} num
	 * @param {Int} decimalsLength
	 * @returns {String}
	 */
	toDecimals: function(num, decimalsLength)
	{
		if (Kekule.NumUtils.isInteger(num))
			return num.toString();
		var times = Math.pow(10, decimalsLength);
		var n = Math.round(num * times);
		n = n / times;
		var i = parseInt(n);
		var f = n - i;
		var sf = f.toString();
		if (sf.length > decimalsLength + 2)
		{
			sf = sf.substr(2, decimalsLength);
			return i.toString() + '.' + sf;
		}
		else
			return n.toString();
	},

	/**
	 * Check if f1 and f2 are equal.
	 * Since float can not be stored exactly in computer, when abs(f1-f2) <= threshold,
	 * this function will returns true.
	 * @param {Float} f1
	 * @param {Float} f2
	 * @param {Float} threshold If not set, a default value will be used.
	 * @returns {Bool}
	 */
	isFloatEqual: function(f1, f2, threshold)
	{
		if (Kekule.ObjUtils.isUnset(threshold))
			threshold = 1e-100;
		return Math.abs(f1 - f2) <= threshold;
	}
};

/**
 * Util methods about object and JSON.
 * @class
 */
Kekule.ObjUtils = {
	/**
	 * Returns prototype of obj.
	 * @param {Object} obj
	 */
	getPrototypeOf: function(obj)
	{
		return Object.getPrototypeOf? Object.getPrototypeOf(obj): (obj.prototype || obj.__proto__);
	},
	/**
	 * Return all name of direct fields of obj. Note that functions will not be included.
	 * @param {Object} obj
	 * @param {Bool} includeFuncFields Set to true to include function fields in obj.
	 * @returns {Array} Array of field names
	 */
	getOwnedFieldNames: function(obj, includeFuncFields)
	{
		var result = [];
		for (var fname in obj)
		{
			if (obj.hasOwnProperty(fname) && (includeFuncFields || typeof(obj[fname]) != 'function'))
				result.push(fname);
		}
		return result;
	},
	/**
	 * Delete obj[oldName] and add a newName prop with the same value.
	 * Note that only own property can be replaced.
	 * @param {Object} obj
	 * @param {String} oldName
	 * @param {String} newName
	 * @returns {Object} obj itself.
	 */
	replacePropName: function(obj, oldName, newName)
	{
		if (obj[oldName] !== undefined)
		{
			if (obj.hasOwnProperty(oldName))
			{
				obj[newName] = obj[oldName];
				delete obj[oldName];
			}
			else
				Kekule.raise(/*Kekule.ErrorMsg.NON_OWN_PROPERTY_CANNOT_BE_REPLACED*/Kekule.$L('ErrorMsg.NON_OWN_PROPERTY_CANNOT_BE_REPLACED'));
		}
		return obj;
	},
	/**
	 * Check if a value is null or undefined.
	 * @param {Variant} value
	 * @returns {Bool}
	 */
	isUnset: function(value)
	{
		return (value === null) || (typeof(value) == 'undefined');
	},
	/**
	 * Check if a value is not null and undefined.
	 * @param {Variant} value
	 * @returns {Bool}
	 */
	notUnset: function(value)
	{
		return (value !== null) && (typeof(value) !== 'undefined');
	},
	/**
	 * Check if src and dest has the same fields and has the same values.
	 * @param {Object} src
	 * @param {Object} dest
	 * @param {Array} excludingFields These fields will not be compared.
	 * @returns {Bool}
	 */
	equal: function(src, dest, excludingFields)
	{
		for (var fname in src)
		{
			if (excludingFields && (excludingFields.indexOf(fname) >= 0))
				continue;
			if (src[fname] !== dest[fname])
				return false;
		}
		return true;
	},
	/**
	 * Check if fields in condition has the same value with src.
	 * @param {Object} src
	 * @param {Object} condition
	 * @return {Bool}
	 */
	match: function(src, condition)
	{
		for (var fname in condition)
		{
			if (condition.hasOwnProperty(fname))
			{
				if (src[fname] !== condition[fname])
					return false;
			}
		}
		return true;
	},
	/**
	 * Check if obj is instance of one class of classes array.
	 * @param {Object} obj
	 * @param {Array} classes
	 * @return {Bool}
	 */
	isInstanceOf: function(obj, classes)
	{
		if (!DataType.isArrayValue(classes))  // a simple class
			return (obj instanceof classes);
		else // array
		{
			for (var i = 0, l = classes.length; i < l; ++i)
			{
				if (obj instanceof classes[i])
					return true;
			}
			return false;
		}
	},

	/**
	 * Returns an array of cascade names that matches all leaf field of obj.
	 * For example, call on object {a: {b: 1, c: 2}, b: 2} will returns ['a.b', 'a.c', 'b'];
	 * @param {Object} obj
	 * @param {Bool} includeFuncFields
	 * @returns {Array}
	 */
	getLeafFieldCascadeNames: function(obj, includeFuncFields)
	{
		var fillCascadeNames = function(names, prefix, obj, includeFuncFields)
		{
			for (var fname in obj)
			{
				if (obj.hasOwnProperty(fname) && (includeFuncFields || typeof(obj[fname]) != 'function'))
				{
					var value = obj[fname];
					if (typeof(value) === 'object')
					{
						fillCascadeNames(names, prefix + fname + '.', value, includeFuncFields);
					}
					else
						names.push(prefix + fname);
				}
			}
		};
		var result = [];
		fillCascadeNames(result, '', obj, includeFuncFields);
		return result;
	}
};

/**
 * Util methods about Array.
 * @class
 */
Kekule.ArrayUtils = {
	/**
	 * Check if value is an array.
	 * @param {Variant} value
	 * @returns {Bool}
	 */
	isArray: function(value)
	{
		if (value)
			return ((typeof(value) == 'object') && (value.length !== undefined));
		else
			return false;
	},
	/**
	 * If value is array, returns value directly, otherwise returns a array containing value.
	 */
	toArray: function(value)
	{
		if (Kekule.ArrayUtils.isArray(value))
			return value;
		else
			return [value];
	},
	/**
	 * Returns a new array with the same items as src.
	 * @param {Array} src
	 * @returns {Array}
	 */
	clone: function(src)
	{
		return src.slice(0);
	},
	/**
	 * Divide array into several small ones, each containing memberCount numbers of elements.
	 * @param {Array} src
	 * @param {Int} memberCount
	 * @returns {Array} Array of array.
	 */
	divide: function(src, memberCount)
	{
		var result = [];
		var curr = [];
		var offset = 0;
		for (var i = 0, l = src.length; i < l; ++i)
		{
			curr.push(src[i]);
			++offset;
			if (offset >= memberCount)
			{
				result.push(curr);
				curr = [];
				offset = 0;
			}
		}
		if (curr.length)
			result.push(curr);
		return result;
	},
	/**
	 * Append obj (or an array of obj) to the tail of array and returns the index of newly pushed obj.
	 * If obj already inside array, also returns index of obj in array.
	 * @param {Array} targetArray Target array.
	 * @param {Variant} obj Must not be null.
	 * @return {Int} Index of obj in array.
	 */
	pushUnique: function(targetArray, obj)
	{
		var r = Kekule.ArrayUtils.pushUniqueEx(targetArray, obj);
		return r? r.index: null;
	},
	/**
	 * Append obj (or an array of obj) to the tail of array and returns the a hash of {index(Int), isPushed(Bool)}.
	 * If obj already inside array, returns index of obj and false.
	 * @param {Array} targetArray Target array.
	 * @param {Variant} obj Must not be null.
	 * @return {Hash} {index, isPushed} hash. Index of obj in array.
	 */
	pushUniqueEx: function(targetArray, obj)
	{
		if (DataType.isArrayValue(obj))
		{
			var r;
			for (var i = 0, l = obj.length; i < l; ++i)
			{
				if (Kekule.ObjUtils.isUnset(r))
					r = Kekule.ArrayUtils.pushUniqueEx(targetArray, obj[i]);
				else
					Kekule.ArrayUtils.pushUniqueEx(targetArray, obj[i]);
			}
			return r;
		}
		else
		{
			if (!obj)
				return {'index': -1, 'isPushed': false};
			var index = targetArray.indexOf(obj);
			if (index < 0) // obj not in array, push
			{
				return {'index': targetArray.push(obj), 'isPushed': true};
			}
			else // already inside, return -index of obj
	 			return {'index': index, 'isPushed': false};
	 }
	},
	/**
	 * Insert obj to index of array and returns the index of newly inserted obj.
	 * If obj already inside array, position of obj will be changed.
	 * @param {Array} targetArray Target array.
	 * @param {Variant} obj Must not be null.
	 * @return {Int} Index of obj in array.
	 */
	insertUnique: function(targetArray, obj, index)
	{
		return Kekule.ArrayUtils.insertUniqueEx(targetArray, obj, index).index;
	},
	/**
	 * Insert obj to index of array and returns the a hash of {index(Int), isInserted(Bool)}.
	 * If obj already inside array, position of obj will be changed.
	 * @param {Array} targetArray Target array.
	 * @param {Variant} obj Must not be null.
	 * @param {Int} index Index to insert. If not set or less than 0, obj will be pushed to tail of array.
	 * @return {Hash} {index, isPushed} hash. Index of obj in array.
	 */
	insertUniqueEx: function(targetArray, obj, index)
	{
		if (!obj)
			return {'index': -1, 'isInserted': false};
		if (Kekule.ObjUtils.isUnset(index) || (index < 0))
			index = targetArray.length;
		var i = targetArray.indexOf(obj);
		if (i < 0) // obj not in array, insert
		{
			targetArray.splice(index, 0, obj);
			return {'index': index, 'isInserted': true};
		}
		else if (i != index) // already inside, change position
		{
			targetArray.splice(i, 1);
			targetArray.splice(index, 0, obj);
 			return {'index': index, 'isInserted': false};
		}
	},
	/**
	 * Remove item at index from targetArray.
	 * If success, returns removed item. If index not in array, returns null.
	 * @param {Array} targetArray
	 * @param {Int} index
	 * @returns {Object} Object removed or null.
	 */
	removeAt: function(targetArray, index)
	{
		var obj = targetArray[index];
		if (typeof(obj) != 'undefined')
		{
			targetArray.splice(index, 1);
			return obj;
		}
		else
			return null;
	},
	/**
	 * Remove an obj from targetArray.
	 * If success, returns obj. If obj not in array, returns null.
	 * @param {Array} targetArray
	 * @param {Object} obj
	 * @param {Bool} removeAll Whether all appearance of obj in array should be removed.
	 * @returns {Object} Object removed or null.
	 */
	remove: function(targetArray, obj, removeAll)
	{
		var index = targetArray.indexOf(obj);
		if (index >= 0)
		{
			Kekule.ArrayUtils.removeAt(targetArray, index);
			if (removeAll)
				Kekule.ArrayUtils.remove(targetArray, obj, removeAll);
			return obj;
		}
		else
			return null;
	},
	/**
	 * Replace oldObj in array with newObj.
	 * @param {Array} targetArray
	 * @param {Variant} oldObj
	 * @param {Variant} newObj
	 * @param {Bool} replaceAll
	 * @returns {Variant} Object replaced or null.
	 */
	replace: function(targetArray, oldObj, newObj, replaceAll)
	{
		var index = targetArray.indexOf(oldObj);
		if (index >= 0)
		{
			targetArray[index] = newObj;
			if (replaceAll)
				Kekule.ArrayUtils.replace(targetArray, oldObj, newObj, replaceAll);
			return oldObj;
		}
		else
			return null;
	},

	/**
	 * Change item at oldIndex to a new position.
	 * @param {Array} targetArray
	 * @param {Int} oldIndex
	 * @param {Int} newIndex
	 * @returns {Variant} item moved or null when oldIndex not in array.
	 */
	changeIndex: function(targetArray, oldIndex, newIndex)
	{
		if ((oldIndex >= 0) && (oldIndex <= targetArray.length))
		{
			var obj = targetArray[oldIndex];
			targetArray.splice(oldIndex, 1);
			targetArray.splice(newIndex, 0, obj);
			return obj;
		}
		else
			return null;
	},
	/**
	 * Change item in array to a new position.
	 * @param {Array} targetArray
	 * @param {Variant} item
	 * @param {Int} newIndex
	 * @returns {Variant} item or null when item not in array.
	 */
	changeItemIndex: function(targetArray, item, newIndex)
	{
		var index = targetArray.indexOf(item);
		return Kekule.ArrayUtils.changeIndex(targetArray, index, newIndex);
	},

	/**
	 * Remove duplicated elements in array.
	 * For example, [1, 2, 3, 3] will got return value [1, 2, 3]
	 * @param {Array} a
	 * @returns {Array}
	 */
	toUnique: function(a)
	{
		var b = [];
		for (var i = 0, l = a.length; i < l; ++i)
		{
			var e = a[i];
			if (b.indexOf(e) < 0)
				b.push(e);
		}
		return b;
	},
	/**
	 * Count elements in array.
	 * For example, [1, 2, 3, 3] will got return value 3
	 * @param {Array} a
	 * @returns {Int}
	 */
	getUniqueElemCount: function(a)
	{
		var b = Kekule.ArrayUtils.toUnique(a);
		return b.length;
	},
	/**
	 * Returns a reversed order array.
	 * For example, [1,2,3] will be turned to [3,2,1] after reversing.
	 * @param {Array} a
	 * @returns {Array}
	 */
	reverse: function(a)
	{
		var result = [];
		for (var i = 0, l = a.length; i < l; ++i)
		{
			if (Kekule.ObjUtils.notUnset(a[i]))
			{
				result[l - i - 1] = a[i];
			}
		}
		return result;
	},
	/**
	 * Returns a new array that change the order of items in src array.
	 * @param {Array} src
	 */
	randomize: function(src)
	{
		if (!src)
			return null;
		if (!src.length)
			return [];
		var result = [];
		var remaining = src.slice(0);
		while (remaining.length > 1)
		{
			var index = Math.round(Math.random() * (remaining.length - 1));
			result.push(remaining.splice(index, 1)[0]);
		}
		result.push(remaining[0]);
		return result;
	},
	/**
	 * Subtract excluded items from source array.
	 * @param {Array} src
	 * @param {Array} excludes
	 * @returns {Array}
	 */
	exclude: function(src, excludes)
	{
		var result = [];
		var exs = Kekule.ArrayUtils.toArray(excludes);
		for (var i = 0, l = src.length; i < l; ++i)
		{
			var item = src[i];
			if (exs.indexOf(item) < 0)
				result.push(item);
		}
		return result;
	},
	/**
	 * Returns intersection of two arrays.
	 * @param {Array} a1
	 * @param {Array} a2
	 * @returns {Array}
	 */
	intersect: function(a1, a2)
	{
		var result = [];
		for (var i = 0, l = a1.length; i < l; ++i)
		{
			if (a2.indexOf(a1[i]) >= 0)
				result.push(a1[i]);
		}
		return result;
	},
	/**
	 * Compare two arrays, from first to last items. If two items in each array is different,
	 * the one with the smaller item will be regarded as smaller array.
	 * @param {Array} a1
	 * @param {Array} a2
	 * @param {Function} itemCompareFunc
	 */
	compare: function(a1, a2, itemCompareFunc)
	{
		if (!itemCompareFunc)
			itemCompareFunc = function(i1, i2)
			{
				return (i1 > i2)? 1:
					(i1 < i2)? -1:
						0;
			}
		var l = Math.min(a1.length, a2.length)
		for (var i = 0; i < l; ++i)
		{
			var item1 = a1[i];
			var item2 = a2[i];
			var compareResult = itemCompareFunc(item1, item2);
			if (compareResult !== 0)
				return compareResult;
		}
		// all same in previous items
		if (a1.length > l)
			return 1;
		else if (a2.length > l)
			return -1;
		else
			return 0;
	},
	/**
	 * Compare two arrays. The array can be nested one and the nested children will also be compared.
	 * For instance:
	 * [3,2,1] > [2,3,1]
	 * [[2,3], 1] > [[1,2,3]]
	 * [[1,2],3,1] > [[1,2],3]
	 * @param {Array} a1
	 * @param {Array} a2
	 * @param {Func} compareFunc
	 * @returns {Int}
	 */
	compareNestedArray: function(a1, a2, compareFunc)
	{
		var l = Math.min(a1.length, a2.length);
		if (!compareFunc)
			compareFunc = function(i,j) { return i - j; };
		for (var i = 0; i < l; ++i)
		{
			var compareValue = 0;
			var item1 = a1[i];
			var item2 = a2[i];
			var isArray1 = DataType.isArrayValue(item1);
			var isArray2 = DataType.isArrayValue(item2);
			if (isArray1 && isArray2)
				compareValue = Kekule.ArrayUtils.compareNestedArray(item1, item2, compareFunc);
			else if (isArray1)  // item2 is not array, we assum item1 > item2
				compareValue = 1;
			else if (isArray2)
				compareValue = -1;
			else  // all not array
				compareValue = compareFunc(item1, item2);
			if (compareValue != 0)
				return compareValue;
		}

		// still can not get result, check rest items
		if (a1.length > l)
			return 1;
		else if (a2.length > l)
			return -1;
		else
			return 0;
	},
	/**
	 * Compare all items in array and sort them into a new array.
	 * If compare result is 0 (equal), those items will be "grouped up" in a nested array.
	 * For example, var a = [1, 0, 1, 2, 3], the result of this method on a will be
	 * [0, [1, 1], 2, 3].
	 * @param {Array} arr
	 * @param {Func} compareFunc
	 * @returns {Array}
	 */
	group: function(arr, compareFunc)
	{
		if (!compareFunc)
			compareFunc = function(a, b)
			{
				return (a < b)? -1:
					(a > b)? 1:
						0;
			};
		var sortedArray = Kekule.ArrayUtils.clone(arr);
		sortedArray.sort(compareFunc);
		var result = [];
		var lastCompareItem;
		for (var i = 0, l = sortedArray.length; i < l; ++i)
		{
			var item = sortedArray[i];
			if (lastCompareItem && compareFunc(item, lastCompareItem) === 0)
			{
				var lastResultItem = result.length? result[result.length - 1]: null;
				if (!Kekule.ArrayUtils.isArray(lastResultItem))
				{
					result.pop();
					lastResultItem = [lastCompareItem];
					result.push(lastResultItem);
				}
				lastResultItem.push(item);
			}
			else
				result.push(item);
			lastCompareItem = item;
		}
		return result;
	},
	/**
	 * Returns median number of a numberic array.
	 * @param {Array} arr
	 * @returns {Number}
	 */
	getMedian: function(arr)
	{
		var a = [].concat(arr);
		var l = a.length;
		if (l === 0)
			return null;
		if (l <= 1)
			return a[0];
		else
		{
			// sort lengths to find the median one
			a.sort(function(a, b) { return a - b;} );
			return (l % 2)? a[(l + 1) >> 1]: (a[l >> 1] + a[(l >> 1) - 1]) / 2;
		}
	},

	sortHashArray: function(arr, sortFields)
	{
		var PREFIX_SORT_DESC = '!';
		var sortFieldInfos = [];
		for (var i = 0, l = sortFields.length; i < l; ++i)
		{
			var info = {};
			var field = sortFields[i] || '';
			if (field.startsWith(PREFIX_SORT_DESC))  // sort desc
			{
				info.field = field.substr(1);
				info.desc = true;
			}
			else
			{
				info.field = field;
				info.desc = false;
			}
			sortFieldInfos.push(info);
		}

		var sortFunc = function(hash1, hash2)
		{
			var compareValue = 0;
			for (var i = 0, l = sortFieldInfos.length; i < l; ++i)
			{
				var field = sortFieldInfos[i].field;
				var v1 = hash1[field] || '';
				var v2 = hash2[field] || '';
				compareValue = (v1 > v2)? 1:
					(v1 < v2)? -1: 0;
				if (sortFieldInfos[i].desc)
					compareValue = -compareValue;
				if (compareValue !== 0)
					break;
			}
			return compareValue;
		};
		arr.sort(sortFunc);
		return arr;
	}
};

/**
 *  A class with some help methods to manipulate string.
 *  @class
 */
Kekule.StrUtils = {
	/** @private */
	STR_TRUES: ['true', 'yes', 't', 'y'],
	/** @private */
	STR_FALSES: ['false', 'no', 'f', 'n'],
	/**
	 * Trim leading and trailing space, tabs or line-breaks of string
	 * @param {String} str
	 * @returns {String}
	 */
	trim: function(str)
	{
		return str.replace(/^\s*|\s*$/g, "");
	},
	/**
	 * Replace repeated spaces, newlines and tabs with a single space
	 * @param {String} str
	 * @returns {String}
	 */
	normalizeSpace: function(str)
	{
		return str.replace(/^\s*|\s(?=\s)|\s*$/g, "");
	},

	/**
	 * Convert a simple value to string.
	 * @param {Variant} value
	 * @returns {String}
	 */
	convertToStr: function(value)
	{
		return '' + value;
	},
	/**
	 * Convert str to a specified typed value.
	 * @param {String} str
	 * @param {String} valueType A simple type, data from {@link DataType}.
	 * @returns {Variant}
	 */
	convertToType: function(str, valueType)
	{
		if (typeof(str) != 'string')  // input type not string, return directly
			return str;
		switch (valueType)
		{
			case DataType.FLOAT:
			case DataType.NUMBER:
				return parseFloat(str); break;
			case DataType.INT:
				return parseInt(str); break;
			case DataType.BOOL:
				return Kekule.StrUtils.strToBool(str); break;
			default:
				return str;
		}
	},

	/**
	 * Turn a boolean to a string value, use Kekule.StrUtils.STR_TRUES constants.
	 * @param {Bool} value
	 * @returns {String}
	 */
	boolToStr: function(value)
	{
		if (value)
			return Kekule.StrUtils.STR_TRUES[0];
		else
			return Kekule.StrUtils.STR_FALSES[0];
	},
	/**
	 * Convert a string to boolean value.
	 * @param {String} value
	 * @returns {Bool}
	 */
	strToBool: function(value)
	{
		var v = value.toLowerCase();
		for (var i = 0, l = Kekule.StrUtils.STR_FALSES.length; i < l; ++i)
		{
			if (v == Kekule.StrUtils.STR_FALSES[i])
				return false;
		}
		return !!value;
	},
	/**
	 * If str start with leading and end with tailing, remove both of them.
	 * @param {String} str
	 * @param {String} leading
	 * @param {String} tailing
	 */
	removeAroundPair: function(str, leading, tailing)
	{
		if (str.startsWith(leading) && str.endsWith(tailing))
		{
			return str.substring(leading.length, str.length - leading.length - tailing.length + 1);
		}
		else  // not pair
		{
			return str;
		}
	},
	/**
	 * Remove leading and tailing ' or " of str.
	 * @param {String} str
	 * @returns {String}
	 */
	unquote: function(str)
	{
		var remove = Kekule.StrUtils.removeAroundPair;
		var result = str;
		result = remove(result, '\'', '\'');
		result = remove(result, '"', '"');
		return result;
	},
	/**
	 * Split string into tokens with separator. If separator is not provided, space will be used.
	 * Space around tokens will be emitted too.
	 * @param {String} str
	 * @param {String} separator
	 * @returns {Array}
	 */
	splitTokens: function(str, separator)
	{
		if (!str)
			return [];
		if (DataType.isArrayValue(str))
			return str;
		else  // assume is string
		{
			var reg = separator? new RegExp(separator, 'g'): /\s+/g;
			//return str.replace(reg, ' ').split(' ');
			return str.split(reg);
		}
	},
	/**
	 * Check if token already inside str.
	 * @param str
	 * @param token
	 * @param separator
	 */
	hasToken: function(str, token, separator)
	{
		var tokens = Kekule.StrUtils.splitTokens(str, separator);
		return (tokens.indexOf(token) >= 0);
	},
	/*
	 * Add token(s) to str. Tokens can be a string or separator split string or array.
	 * If separator is not provided, space will be used.
	 * If token already inside str, nothing will be done.
	 * @param {String} str
	 * @param {String} token A single token
	 * @param {String} separator
	 */
	/*
	addToken: function(str, token, separator)
	{
		var result;
		if (!Kekule.StrUtils.hasToken(str, token, separator))
			result = str + (separator || ' ') + token;
		else
			result = str;
		return result;
	},
	*/
	/**
	 * Add token(s) to str. Tokens can be a string or separator split string or array.
	 * If separator is not provided, space will be used.
	 * @param {String} str
	 * @param {Variant} tokens
	 * @param {String} separator
	 */
	addTokens: function(str, tokens, separator)
	{
		var ts = Kekule.StrUtils.splitTokens(str, separator);
		var adds = Kekule.StrUtils.splitTokens(tokens, separator);
		for (var i = 0, l = adds.length; i < l; ++i)
		{
			if (ts.indexOf(adds[i]) < 0)
				ts.push(adds[i]);
		}
		return ts.join(separator || ' ');
	},
	/**
	 * Remove token(s) to str. Tokens can be a string or separator split string or array.
	 * If separator is not provided, space will be used.
	 * @param {String} str
	 * @param {Variant} tokens
	 * @param {String} separator
	 */
	removeTokens: function(str, tokens, separator)
	{
		var ts = Kekule.StrUtils.splitTokens(str, separator);
		var removes = Kekule.StrUtils.splitTokens(tokens, separator);
		for (var i = 0, l = removes.length; i < l; ++i)
		{
			var index = ts.indexOf(removes[i]);
			if (index >= 0)
				ts.splice(index, 1);
		}
		return ts.join(separator || ' ');
	},
	/**
	 * Token token(s) in str. Tokens can be a string or separator split string or array.
	 * If separator is not provided, space will be used.
	 * @param {String} str
	 * @param {Variant} tokens
	 * @param {String} separator
	 */
	toggleTokens: function(str, tokens, separator)
	{
		var ts = Kekule.StrUtils.splitTokens(str, separator);
		var modifies = Kekule.StrUtils.splitTokens(tokens, separator);
		var added = [];
		for (var i = 0, l = modifies.length; i < l; ++i)
		{
			var index = ts.indexOf(modifies[i]);
			if (index >= 0)
				ts.splice(index, 1);
			else
				added.push(modifies[i]);
		}
		ts = ts.concat(added);
		return ts.join(separator || ' ');
	},

	/**
	 * Returns the total line count of string.
	 * @param {String} str
	 * @param {String} lineDelimiter Default is "\n".
	 * @returns {Int}
	 */
	getLineCount: function(str, lineDelimiter)
	{
		if (!lineDelimiter)
			lineDelimiter = '\n';
		var lines = str.split(lineDelimiter);
		return lines.length;
	},
	/**
	 * Returns maxium char count in each line of str.
	 * @param {String} str
	 * @param {String} lineDelimiter Default is "\n".
	 * @returns {Int}
	 */
	getMaxLineCharCount: function(str, lineDelimiter)
	{
		if (!lineDelimiter)
			lineDelimiter = '\n';
		var lines = str.split(lineDelimiter);
		var result = 0;
		for (var i = 0, l = lines.length; i < l; ++i)
		{
			var line = lines[i];
			result = Math.max(line.length, result);
		}
		return result;
	}
};

/**
 * Util methods to manipulate {role, item} hash.
 * @class
 */
Kekule.RoleMapUtils = {
	/** @private */
	KEY_ITEM: 'item',
	/** @private */
	KEY_ROLE: 'role',
	/** Indicate a role is not explicited set. */
	NON_EXPLICIT_ROLE: null,
	/**
	 * Create a role map.
	 * @param {Variant} item
	 * @param {String} role If not set, {@link Kekule.RoleMapUtils.NON_EXPLICIT_ROLE} will be used.
	 * @returns {Hash}
	 */
	createMap: function(item, role)
	{
		var r = {};
		role = role || Kekule.RoleMapUtils.NON_EXPLICIT_ROLE;
		r[Kekule.RoleMapUtils.KEY_ITEM] = item;
		r[Kekule.RoleMapUtils.KEY_ROLE] = role;
		return r;
	},
	/**
	 * Get item in map.
	 * @param {Hash} map
	 * @returns {Variant}
	 */
	getItem: function(map)
	{
		return map[Kekule.RoleMapUtils.KEY_ITEM];
	},
	/**
	 * Set item of map.
	 * @param {Hash} map
	 * @param {Variant} item
	 */
	setItem: function(map, item)
	{
		map[Kekule.RoleMapUtils.KEY_ITEM] = item;
	},
	/**
	 * Get role name in map.
	 * @param {Hash} map
	 * @returns {String}
	 */
	getRole: function(map)
	{
		return map[Kekule.RoleMapUtils.KEY_ROLE];
	},
	/**
	 * Set role name of map.
	 * @param {Hash} map
	 * @param {String} role
	 */
	setRole: function(map, role)
	{
		map[Kekule.RoleMapUtils.KEY_ROLE] = role;
	}
};

/**
 *  A class with some help methods for factory method pattern.
 *  @class
 */
Kekule.FactoryUtils = {
	// match methods
	MATCH_EXACTLY: 0,
	MATCH_BY_CLASS: 1,
	/** @private */
	DEF_ITEM_STORE_FIELD_NAME: '_items',
	/**
	 * Create a simple factory.
	 * @param {Int} matchMethod
	 * @returns {Object}
	 */
	createSimpleFactory: function(matchMethod)
	{
		var FU = Kekule.FactoryUtils;
		var result = {
			_items: new Kekule.MapEx(true),
			_matchMethod: matchMethod || Kekule.FactoryUtils.MATCH_EXACTLY,
			register: function(key, aClass)
			{
				result._items.set(key, aClass);
			},
			unregister: function(key)
			{
				result._items.remove(key);
			},
			getClass: function(key)
			{
				if (result._matchMethod === FU.MATCH_EXACTLY)
					return result._items.get(key);
				else if (result._matchMethod === FU.MATCH_BY_CLASS)
				{
					var r = result._items.get(key);
					if (!r)
					{
						var parent = ClassEx.getSuperClass(key);
						if (parent)
							r = result.getClass(parent);
					}
					return r;
				}
			},
			getInstance: function(key, p1, p2, p3, p4, p5, p6, p7, p8, p9)
			{
				var aClass = result.getClass(key);
				if (aClass)
					return new aClass(p1, p2, p3, p4, p5, p6, p7, p8, p9);
			}
		};
		return result;
	}
};

/**
 * Class to help to manipulate URL and file names
 */
Kekule.UrlUtils = {
	/** @private */
	EXT_DELIMITER: '.',
	/** @private */
	PATH_DELIMITER: '/',
	/** @private */
	SEARCH_DELIMITER: '?',
	/** @private */
	SEARCH_PAIR_DELIMITER: '&',
	/** @private */
	KEY_VALUE_DELIMITER: '=',
	/** @private */
	HASH_DELIMITER: '#',
	/**
	 * Extract file name from url.
	 * @param {String} url
	 * @returns {String}
	 */
	extractFileName: function(url)
	{
		if (!url)
			return null;
		var p = url.lastIndexOf(Kekule.UrlUtils.PATH_DELIMITER);
		if (p >= 0)
			return url.substr(p + 1);
		else
			return url;
	},
	/**
	 * Get file extension of a url based file name
	 * @param {String} url
	 * @returns {String}
	 */
	extractFileExt: function(url)
	{
		var fileName = Kekule.UrlUtils.extractFileName(url);
		if (fileName)
		{
			var p = fileName.lastIndexOf(Kekule.UrlUtils.EXT_DELIMITER);
			if (p >= 0)
				return fileName.substr(p + 1);
			else
				return '';
		}
		else
			return null;
	},
	/**
	 * Get core file name without extension from a url based file name
	 * @param {String} url
	 * @returns {String}
	 */
	extractFileCoreName: function(url)
	{
		var fileName = Kekule.UrlUtils.extractFileName(url);
		if (fileName)
		{
			var p = fileName.lastIndexOf(Kekule.UrlUtils.EXT_DELIMITER);
			if (p >= 0)
				return fileName.substr(0, p);
			else
				return '';
		}
		else
			return null;
	},
	/**
	 * Get search part (e.g. http://127.0.0.1/url?key=value, part after "?") of URL.
	 * @param {String} url
	 * @returns {String} Search part of URL with "?".
	 */
	extractSearch: function(url)
	{
		if (!url)
			return null;
		var p = url.lastIndexOf(Kekule.UrlUtils.SEARCH_DELIMITER);
		if (p >= 0)
			return url.substr(p);
		else
			return null;
	},
	/**
	 * Returns key-value pair of search part.
	 * @param {String} url
	 * @param {Bool} returnHash If true, the return value is a hash rather than array.
	 * @returns {Variant} If returnHash is false, returns a array while each item in array is a hash with {key, value},
	 *   if returnHash is true, returns a direct hash of key-value pairs.
	 */
	analysisSearch: function(url, returnHash)
	{
		var s = Kekule.UrlUtils.extractSearch(url) || '';
		s = s.substr(1);  // eliminate "?"
		var pairs = s.split(Kekule.UrlUtils.SEARCH_PAIR_DELIMITER);
		var result = returnHash? {}: [];
		for (var i = 0, l = pairs.length; i < l; ++i)
		{
			var pair = pairs[i];
			var a = pair.split(Kekule.UrlUtils.KEY_VALUE_DELIMITER);
			if (a[0])
			{
				if (returnHash)
					result[a[0]] = a[1];
				else
					result.push({'key': a[0], 'value': a[1]});
			}
		}
		return result;
	},
	/**
	 * Returns concated search part string based on search params.
	 * @param {Hash} params Search params (key: value pairs).
	 * @returns {String}
	 */
	generateSearchString: function(params)
	{
		var U = Kekule.UrlUtils;
		var parts = [];
		var keys = Kekule.ObjUtils.getOwnedFieldNames(params);
		for (var i = 0, l = keys.length; i < l; ++i)
		{
			var key = keys[i];
			var value = params[key];
			if (Kekule.ObjUtils.notUnset(value))
			{
				var value = encodeURIComponent('' + value);
				parts.push(key + U.KEY_VALUE_DELIMITER + value);
			}
		}
		return parts.join(U.SEARCH_PAIR_DELIMITER)
	},
	/**
	 * Generate a whole url with search and hash part.
	 * @param {String} baseUrl Url without search and hash part.
	 * @param {Hash} searchParams Key-value pairs of search.
	 * @param {String} hash Hash part of Url.
	 * @returns {String}
	 */
	generateUrl: function(baseUrl, searchParams, hash)
	{
		var U = Kekule.UrlUtils;
		var result = baseUrl;
		if (searchParams)
		{
			var ssearch = U.generateSearchString(searchParams);
			result += U.SEARCH_DELIMITER + ssearch;
		}
		if (hash)
			result += U.HASH_DELIMITER + hash;
		return result;
	}
};

/**
 * Utility methods about matrix.
 * @class
 */
Kekule.MatrixUtils = {
	/**
	 * Create a matrix with row and col and fill it with prefilledValue.
	 * @param {Int} rowCount
	 * @param {Int} colCount
	 * @param {Float} prefilledValue
	 * @returns {Array}
	 */
	create: function(rowCount, colCount, prefilledValue)
	{
		var preValueSet = false;
		var preValueIsArray = false;
		var OU = Kekule.ObjUtils;
		if (OU.notUnset(prefilledValue))
		{
			preValueSet = true;
			if (Kekule.ArrayUtils.isArray(prefilledValue))  // is array
				preValueIsArray = true;
		}
		var index = 0;
		var m = new Array(rowCount);
		for (var i = 0, l = m.length; i < l; ++i)
		{
			var r = new Array(colCount);
			if (preValueSet)
			{
				for (var j = 0, k = r.length; j < k; ++j)
				{
					if (preValueIsArray && OU.notUnset(prefilledValue[index]))
					{
						r[j] = prefilledValue[index];
						++index;
					}
					else
						r[j] = prefilledValue;
				}
			}
			m[i] = r;
		}

		return m;
	},
	/**
	 * Create a identity matrix with row and col.
	 * @param {Int} rowColCount
	 * @returns {Array}
	 */
	createIdentity: function(rowColCount)
	{
		var result = Kekule.MatrixUtils.create(rowColCount, rowColCount, 0);
		for (var i = 0; i < rowColCount - 1; ++i)
			result[i][i] = 1;
		return result;
	},
	/**
	 * Get row count of a matrix
	 * @param {Array} matrix
	 * @returns {Int}
	 */
	getRowCount: function(matrix)
	{
		return matrix.length;
	},
	/**
	 * Get col count of a matrix
	 * @param {Array} matrix
	 * @returns {Int}
	 */
	getColCount: function(matrix)
	{
		return (Kekule.MatrixUtils.getRowCount(matrix) > 0)? matrix[0].length: 0;
	},
	/**
	 * Get value in matrix.
	 * @param {Array} matrix
	 * @param {Int} row
	 * @param {Int} col
	 * @returns {Float}
	 */
	getValue: function(matrix, row, col)
	{
		return matrix[row - 1][col - 1] || 0;
	},
	/**
	 * Set value in matrix.
	 * @param {Array} matrix
	 * @param {Int} row
	 * @param {Int} col
	 * @param {Float} value
	 */
	setValue: function(matrix, row, col, value)
	{
		matrix[row - 1][col - 1] = value;
	},
	/**
	 * Transpose a matrix.
	 * @param {Array} m
	 * @returns {Array}
	 */
	transpose: function(m)
	{
		var M = Kekule.MatrixUtils;
		var rowCount = M.getColCount(m);
		var colCount = M.getRowCount(m);
		var result = M.create(rowCount, colCount);
		for (var i = 1; i <= rowCount; ++i)
		{
			var r = result[i - 1];
			for (var j = 1; j <= colCount; ++j)
				r[j - 1] = M.getValue(m, j, i);
		}
		/*
		console.log('origin: ');
		console.dir(m);
		console.log('transposed: ');
		console.dir(result);
		*/
		return result;
	},
	/**
	 * Turn all values in matrix to minus ones.
	 * @param {Array} matrix
	 */
	minus: function(matrix)
	{
		var M = Kekule.MatrixUtils;
		var rowCount = M.getRowCount(matrix);
		var colCount = M.getColCount(matrix);
		var result = this.create(rowCount, colCount);
		for (var i = 0; i < rowCount; ++i)
		{
			var r = result[i];
			var m = matrix[i];
			for (var j = 0; j < colCount; ++j)
				r[j] = -(m[j] || 0);
		}
	},
	/**
	 * Add two matrix.
	 * @param {Array} m1
	 * @param {Array} m2
	 * @returns {Array}
	 */
	add: function(m1, m2)
	{
		var M = Kekule.MatrixUtils;
		var rowCount = M.getRowCount(m1);
		var colCount = M.getColCount(m1);
		var result = this.create(rowCount, colCount);
		for (var i = 1; i <= rowCount; ++i)
		{
			//var r = result[i];
			for (var j = 1; j <= colCount; ++j)
				M.setValue(result, i, j, M.getValue(m1, i, j) + M.getValue(m2, i, j));
		}
		return result;
	},
	/**
	 * Substract two matrix.
	 * @param {Array} m1
	 * @param {Array} m2
	 * @returns {Array}
	 */
	substract: function(m1, m2)
	{
		var M = Kekule.MatrixUtils;
		return M.add(m1, M.minus(m2));
	},
	/**
	 * Mutiply two matrix.
	 * @param {Array} m1
	 * @param {Array} m2
	 * @returns {Array}
	 */
	multiply: function(m1, m2)
	{
		var M = Kekule.MatrixUtils;
		var rowCount = M.getRowCount(m1);
		var colCount = M.getColCount(m2);
		var result = M.create(rowCount, colCount);
		for (var i = 1; i <= rowCount; ++i)
		{
			//var r = result[i];
			for (var j = 1; j <= colCount; ++j)
			{
				var sum = 0;
				for (var k = 1; k <= rowCount; ++k)
				{
					sum += M.getValue(m1, i, k) * M.getValue(m2, k, j)
				}
				//r[j] = sum;
				M.setValue(result, i, j, sum);
			}
		}
		//console.log(m1, m2, result);
		return result;
	}
};

/**
 * Utility methods about coordinates (2D or 3D).
 * @class
 */
Kekule.CoordUtils = {
	/**
	 * Create a coordinate object by params.
	 * If two params provided, a 2D (x/y) coordinate will be created, else 3D (x/y/z) one will be created.
	 * @returns {Hash}
	 */
	create: function(x, y, z)
	{
		var result = {'x': x, 'y': y};
		if (z || (z === 0))
			result.z = z;
		return result;
	},
	/**
	 * Check if the coord is a 3D one (has z value)
	 * @param {Object} coord
	 * @returns {Bool}
	 */
	is3D: function(coord)
	{
		return (coord.z || (coord.z === 0));
	},
	/**
	 * Check if two coords are same.
	 * @param {Hash} coord1
	 * @param {Hash} coord2
	 * @returns {Bool}
	 */
	isEqual: function(coord1, coord2)
	{
		var r = (coord1.x === coord2.x) && (coord1.y === coord2.y);
		var O = Kekule.ObjUtils;
		if (r && (O.notUnset(coord1.z) || O.notUnset(coord2.z)))
			r = (coord1.z === coord2.z);
		return r;
	},
	/**
	 * Check if a coord is a zero one (x/y/z all equals to 0).
	 * @param {Hash} coord
	 * @param {Float} allowedError
	 * @returns {Bool}
	 */
	isZero: function(coord, allowedError)
	{
		// TODO: now calculation error is fixed
		var error = Kekule.ObjUtils.notUnset(allowedError)? allowedError: 0; /*1e-5;*/
		return (Math.abs(coord.x || 0) <= error)
			&& (Math.abs(coord.y || 0) <= error) && (Math.abs(coord.z || 0) <= error);
	},
	/**
	 * Returns the absolute value of each coord axises.
	 * @param {Hash} coord
	 * @returns {Hash}
	 */
	absValue: function(coord)
	{
		if (coord)
		{
			var result = {};
			if (!Kekule.ObjUtils.isUnset(coord.x))
				result.x = Math.abs(coord.x);
			if (!Kekule.ObjUtils.isUnset(coord.y))
				result.y = Math.abs(coord.y);
			if (!Kekule.ObjUtils.isUnset(coord.z))
				result.z = Math.abs(coord.z);
			return result;
		}
	},
	/**
	 * Add value of two coordinates.
	 * @param {Hash} coord1
	 * @param {Hash} coord2
	 * @returns {Hash}
	 */
	add: function(coord1, coord2)
	{
		var r = {};
		if (!(Kekule.ObjUtils.isUnset(coord1.x) && (Kekule.ObjUtils.isUnset(coord2.x))))
			r.x = (coord1.x || 0) + (coord2.x || 0);
		if (!(Kekule.ObjUtils.isUnset(coord1.y) && (Kekule.ObjUtils.isUnset(coord2.y))))
			r.y = (coord1.y || 0) + (coord2.y || 0);
		if (!(Kekule.ObjUtils.isUnset(coord1.z) && (Kekule.ObjUtils.isUnset(coord2.z))))
			r.z = (coord1.z || 0) + (coord2.z || 0);
		return r;
	},
	/**
	 * Substract values of two coordinates, coord1 - coord2.
	 * @param {Hash} coord1
	 * @param {Hash} coord2
	 * @returns {Hash}
	 */
	substract: function(coord1, coord2)
	{
		var r = {};
		if (!(Kekule.ObjUtils.isUnset(coord1.x) && (Kekule.ObjUtils.isUnset(coord2.x))))
			r.x = (coord1.x || 0) - (coord2.x || 0);
		if (!(Kekule.ObjUtils.isUnset(coord1.y) && (Kekule.ObjUtils.isUnset(coord2.y))))
			r.y = (coord1.y || 0) - (coord2.y || 0);
		if (!(Kekule.ObjUtils.isUnset(coord1.z) && (Kekule.ObjUtils.isUnset(coord2.z))))
			r.z = (coord1.z || 0) - (coord2.z || 0);
		return r;
	},
	/**
	 * Coord * value.
	 * @param {Hash} coord
	 * @param {Num} value
	 * @returns {Hash}
	 */
	multiply: function(coord, value)
	{
		var r = {};
		if (!Kekule.ObjUtils.isUnset(coord.x))
			r.x = coord.x * value;
		if (!Kekule.ObjUtils.isUnset(coord.y))
			r.y = coord.y * value;
		if (!Kekule.ObjUtils.isUnset(coord.z))
			r.z = coord.z * value;
		return r;
	},
	/**
	 * Coord / value.
	 * @param {Hash} coord
	 * @param {Num} value
	 * @returns {Hash}
	 */
	divide: function(coord, value)
	{
		return Kekule.CoordUtils.multiply(coord, 1/value);
	},
	/**
	 * Standardize coord to a length 1 vector.
	 * @param {Hash} coord
	 * @returns {Hash}
	 */
	standardize: function(coord)
	{
		var len = Math.sqrt(Math.sqr(coord.x || 0) + Math.sqr(coord.y || 0) + Math.sqr(coord.z || 0));
		return Kekule.CoordUtils.divide(coord, len);
	},
	/**
	 * Convert coord to a 2D or 3D array of values
	 * @param {Hash} coord
	 * @returns {Array}
	 */
	toArray: function(coord)
	{
		var result = [];
		result.push(coord.x, coord.y);
		if (Kekule.CoordUtils.is3D(coord))
			result.push(coord.z);
	},
	/**
	 * Do a 2d transform to a coord.
	 * The tranform will be performed in the following order:
	 *   rotate, scale, translate.
	 * @param {Hash} coord 2D coordinate.
	 * @param {Hash} options Transform options, can has the following fields:
	 *   scale, scaleX, scaleY
	 *   translateX, translateY,
	 *   rotateAngle,
	 *   center: {x, y} (center of rotate and scale).
	 *  @returns {Hash} 2D coord after transform.
	 */
	transform2D: function(coord, options)
	{
		/*
		var op = options || {};
		var center = op.center || {'x': 0, 'y': 0};
		var delta = {'x': coord.x - center.x, 'y': coord.y - center.y};
		var x = delta.x, y = delta.y;
		if (op.rotateAngle)
		{
			var a = op.rotateAngle;
			var newX = x * Math.cos(a) - y * Math.sin(a);
			var newY = x * Math.sin(a) + y * Math.cos(a);
			x = newX;
			y = newY;
		}
		if (op.scale || op.scaleX || op.scaleY)
		{
			x *= op.scaleX || op.scale;
			y *= op.scaleY || op.scale;
		}
		x += op.translateX || 0;
		y += op.translateY || 0;

		x += center.x;
		y += center.y;

		return {'x': x, 'y': y};
		*/

		var matrix = Kekule.CoordUtils.calcTransform2DMatrix(options);
		var newCoord = Kekule.CoordUtils.transform2DByMatrix(coord, matrix);
		return newCoord;

		/*
		var newCoord = {'x': coord.x, 'y': coord.y, 'z': 0};
		var newOp = Object.extend({}, options);
		newOp.rotateZ = newOp.rotateAngle;
		newCoord = Kekule.CoordUtils.transform3D(newCoord, newOp);
		return {'x': newCoord.x, 'y': newCoord.y};
		*/
	},
	/**
	 * Do a reversed 2d transform to a coord.
	 * @param {Hash} coord 2D coordinate.
	 * @param {Hash} options Transform options, can has the following fields:
	 *   scale, scaleX, scaleY
	 *   translateX, translateY,
	 *   rotateAngle,
	 *   center: {x, y} (center of rotate and scale).
	 *  @returns {Hash} 2D coord after reversed transform.
	 */
	inverseTransform2D: function(coord, options)
	{
		var matrix = Kekule.CoordUtils.calcInverseTransform2DMatrix(options);
		var newCoord = Kekule.CoordUtils.transform2DByMatrix(coord, matrix);
		return newCoord;
	},
	/**
	 * Do a 2D transform to a coord by a transformer matrix.
	 * @param {Hash} coord
	 * @param {Array} transformMatrix A 3X3 matrix.
	 */
	transform2DByMatrix: function(coord, transformMatrix)
	{
		var M = Kekule.MatrixUtils;
		var coordV = M.create(3, 1, [coord.x || 0, coord.y || 0, 1]);
		coordV = M.multiply(transformMatrix, coordV);
		return {'x': coordV[0][0], 'y': coordV[1][0]};
	},
	/**
	 * Calculate the 2D transfrom matrix.
	 * The tranform will be performed in the following order:
	 *   rotate, scale, translate.
	 * @param {Hash} options Transform options, can has the following fields:
	 *   scale, scaleX, scaleY
	 *   translateX, translateY,
	 *   rotateAngle,
	 *   center: {x, y} (center of rotate and scale).
	 * @returns {Array} A 4X4 matrix.
	 */
	calcTransform2DMatrix: function(options, reverseOrder)
	{
		var M = Kekule.MatrixUtils;
		var op = options || {};
		var center = op.center;
		if (center)  // center point set, need translate before rotate and scale
		{
			var preMatrix = M.create(3, 3, [
				1, 0, -(center.x || 0),
				0, 1, -(center.y || 0),
				0, 0, 1
			]);
			var postMatrix = M.create(3, 3, [
				1, 0, (center.x || 0),
				0, 1, (center.y || 0),
				0, 0, 1
			]);
		}
		// rotate matrix
		if (op.rotateAngle)
		{
			var a = op.rotateAngle;
			var cosA = Math.cos(a);
			var sinA = Math.sin(a);
			var rotateMatrix = M.create(3, 3, [
				cosA, -sinA, 0,
				sinA, cosA, 0,
				0, 0, 1
			]);
		}
		// scale matrix
		var scale = op.scale;
		var scaleX = op.scaleX;
		var scaleY = op.scaleY;
		var defScale = scale || 1;
		if (scale || scaleX || scaleY)
		{
			var scaleMatrix = M.create(3, 3);
			M.setValue(scaleMatrix, 1, 1, scaleX || defScale);
			M.setValue(scaleMatrix, 2, 2, scaleY || defScale);
			M.setValue(scaleMatrix, 3, 3, 1);
		}
		// translate matrix
		var translateX = op.translateX;
		var translateY = op.translateY;
		if (translateX || translateY)
		{
			var translateMatrix = M.create(3, 3);
			M.setValue(translateMatrix, 1, 1, 1);
			M.setValue(translateMatrix, 2, 2, 1);
			M.setValue(translateMatrix, 3, 3, 1);
			M.setValue(translateMatrix, 1, 3, (translateX || 0));
			M.setValue(translateMatrix, 2, 3, (translateY || 0));
		}
		// sum up
		var transformMatrix = M.create(3, 3, [
			1,0,0,
			0,1,0,
			0,0,1
		]);
		if (!reverseOrder)
		{
			if (preMatrix)
				transformMatrix = M.multiply(preMatrix, transformMatrix); //M.multiply(transformMatrix, preMatrix);
			if (rotateMatrix)
				transformMatrix = M.multiply(rotateMatrix, transformMatrix); // M.multiply(transformMatrix, rotateMatrix);
			if (scaleMatrix)
				transformMatrix = M.multiply(scaleMatrix, transformMatrix); // M.multiply(transformMatrix, scaleMatrix);
			if (translateMatrix)
				transformMatrix = M.multiply(translateMatrix, transformMatrix); // M.multiply(transformMatrix, translateMatrix);
			if (postMatrix)
				transformMatrix = M.multiply(postMatrix, transformMatrix); // M.multiply(transformMatrix, postMatrix);
		}
		else
		{
			/*
			if (preMatrix)
				transformMatrix = M.multiply(transformMatrix, preMatrix);
				//transformMatrix = M.multiply(preMatrix, transformMatrix);
			if (rotateMatrix)
				transformMatrix = M.multiply(transformMatrix, rotateMatrix);
			if (scaleMatrix)
				transformMatrix = M.multiply(transformMatrix, scaleMatrix);
			if (translateMatrix)
				transformMatrix = M.multiply(transformMatrix, translateMatrix);
			if (postMatrix)
				transformMatrix = M.multiply(transformMatrix, postMatrix);
				//transformMatrix = M.multiply(postMatrix, transformMatrix);
			*/
			if (preMatrix)
				transformMatrix = M.multiply(preMatrix, transformMatrix); //M.multiply(transformMatrix, preMatrix);
			if (translateMatrix)
				transformMatrix = M.multiply(translateMatrix, transformMatrix); // M.multiply(transformMatrix, translateMatrix);
			if (scaleMatrix)
				transformMatrix = M.multiply(scaleMatrix, transformMatrix); // M.multiply(transformMatrix, scaleMatrix);
			if (rotateMatrix)
				transformMatrix = M.multiply(rotateMatrix, transformMatrix); // M.multiply(transformMatrix, rotateMatrix);
			if (postMatrix)
				transformMatrix = M.multiply(postMatrix, transformMatrix); // M.multiply(transformMatrix, postMatrix);
		}
		//console.log(transformMatrix);
		return transformMatrix;
	},
	/**
	 * Calculate inversed transform matrix of options.
	 * @param {Hash} options
	 * @returns {Array}
	 */
	calcInverseTransform2DMatrix: function(options)
	{
		var op = Object.create(options);
		if (options.center)
		{
			op.center = {x: options.center.x, y: options.center.y};
		}
		if (op.scale)
			op.scale = 1 / op.scale;
		if (op.scaleX)
			op.scaleX = 1 / op.scaleX;
		if (op.scaleY)
			op.scaleY = 1 / op.scaleY;
		if (op.translateX)
			op.translateX = -op.translateX;
		if (op.translateY)
			op.translateY = -op.translateY;
		/*
		if (op.center)
		{
			op.center.x *= (op.scaleX || op.scale || 1);
			op.center.y *= (op.scaleY || op.scale || 1);
		}
		*/

		if (op.rotateAngle)
			op.rotateAngle = -op.rotateAngle;

		return Kekule.CoordUtils.calcTransform2DMatrix(op, true);
	},
	/**
	 * Do a 3d transform to a coord.
	 * The tranform will be performed in the following order:
	 *   rotate, scale, translate.
	 * @param {Hash} coord 3D coordinate.
	 * @param {Hash} options Transform options, can has the following fields:
	 *   scale, scaleX, scaleY, scaleZ,  // all scale from center or zero point
	 *   translateX, translateY, translateZ,
	 *   rotateX, rotateY, rotateZ,
	 *   rotateAngle, rotateAxisVector  // rotate around a vector start from center or zero point
	 *   rotateMatrix   // use matrix to rotate directly
	 *   center: {x, y, z} (center of rotate and scale).
	 *  @returns {Hash} 3D coord after transform.
	 */
	transform3D: function(coord, options)
	{
		var matrix = Kekule.CoordUtils.calcTransform3DMatrix(options);
		return Kekule.CoordUtils.transform3DByMatrix(coord, matrix);
	},
	/**
	 * Do a 3d transform to a coord by a transformer matrix.
	 * @param {Hash} coord
	 * @param {Array} transformMatrix A 4X4 matrix.
	 */
	transform3DByMatrix: function(coord, transformMatrix)
	{
		var M = Kekule.MatrixUtils;
		var coordV = M.create(4, 1, [coord.x || 0, coord.y || 0, coord.z || 0, 1]);
		coordV = M.multiply(transformMatrix, coordV);
		return {'x': coordV[0][0], 'y': coordV[1][0], 'z': coordV[2][0]};
	},
	/** @private */
	_calcRotateXYZ3DMatrixCore: function(options)
	{
		var M = Kekule.MatrixUtils;
		var result = M.create(4, 4, [
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1
		]);

		// the following calculation is based on left-hand principle,
		// generally Kekule applies right hand principle, so reverse the angle
		var rotatePairs = [];
		if (options.rotateAngle && options.rotateAxisVector)
		{
			var srotateAxisV = Kekule.CoordUtils.standardize(options.rotateAxisVector);
			rotatePairs.push({
				'vector': [srotateAxisV.x, srotateAxisV.y, srotateAxisV.z],
				'angle': -options.rotateAngle
			});
		}
		else
		{
			var rx = options.rotateX;
			var ry = options.rotateY;
			var rz = options.rotateZ;
			if (rx)
				rotatePairs.push({'vector': [1, 0, 0], 'angle': -rx});
			if (ry)
				rotatePairs.push({'vector': [0, 1, 0], 'angle': -ry});
			if (rz)
				rotatePairs.push({'vector': [0, 0, 1], 'angle': -rz});
		}

		for (var i = 0, l = rotatePairs.length; i < l; ++i)
		{
			var rotateMatrix = M.create(4, 4);
			var angle = rotatePairs[i].angle;
			var rotateVectorArray = rotatePairs[i].vector;
			var cosAngle = Math.cos(angle);
			var sinAngle = Math.sin(angle);
			var v;
			for (var i = 1; i <= 4; ++i)
			{
				for (var j = 1; j <= 4; ++j)
				{
					if ((i < 4) && (j < 4))
					{
						for (var k = 1; k <= 3; ++k)
						{
							if ((k !== i) && (k !== j))
								break;
						}
						var nij = rotateVectorArray[i - 1] * rotateVectorArray[j - 1];
						v =
							(i < j)?
								nij * (1 - cosAngle)
									- Math.pow(-1, i + j) * rotateVectorArray[k - 1] * sinAngle:
								(i > j)?
									nij * (1 - cosAngle)
										+ Math.pow(-1, i + j) * rotateVectorArray[k - 1] * sinAngle:
									// i === j
									nij + (1 - nij) * cosAngle;
					}
					else if (i === j)   // i == j == 4
						v = 1;
					else
						v = 0;
					M.setValue(rotateMatrix, i, j, v);
				}
			}
			result = M.multiply(rotateMatrix, result);
		}

		//console.log(result);
		return result;
	},
	/**
	 * Calculate 3D rotation matrix from options.
	 * @param {Object} options Rotation options, can has the following fields:
	 *   rotateX, rotateY, rotateZ,  // if Y is set, Z will be ignored; if X is set, Y/Z will be ignored
	 *   rotateAngle, rotateAxisVector  // rotate around a vector start from center or zero point, if this value is set, rotateX-Z will be ignored
	 *   rotateMatrix   // use matrix to rotate directly
	 *   center: {x, y, z} (center of rotate).
	 * @returns {Array} A 4X4 matrix.
	 */
	calcRotate3DMatrix: function(options)
	{
		var M = Kekule.MatrixUtils;
		var op = Object.extend({}, options || {});

		var rotateMatrix;
		if (op.rotateMatrix)
		{
			rotateMatrix = op.rotateMatrix;
		}
		else
		{
			var center = op.center;
			if (center)  // center point set, need translate before rotate and scale
			{
				var preMatrix = M.create(4, 4, [
					1, 0, 0, -(center.x || 0),
					0, 1, 0, -(center.y || 0),
					0, 0, 1, -(center.z || 0),
					0, 0, 0, 1
				]);
				var postMatrix = M.create(4, 4, [
					1, 0, 0, (center.x || 0),
					0, 1, 0, (center.y || 0),
					0, 0, 1, (center.z || 0),
					0, 0, 0, 1
				]);
			}

			/*
			var rotateX = op.rotateX;
			var rotateY = op.rotateY;
			var rotateZ = op.rotateZ;
			var rotateAngle = op.rotateAngle;
			var rotateAxisVector = op.rotateAxisVector;
			if (rotateX || rotateY || rotateZ || rotateAngle)
			{
				//if (rotateAngle && rotateAxisVector)
				var srotateAxisV = (rotateAngle && rotateAxisVector)? Kekule.CoordUtils.standardize(rotateAxisVector): null;

				var rotateVectorArray =
					srotateAxisV? [srotateAxisV.x, srotateAxisV.y, srotateAxisV.z]:
					rotateX? [1, 0, 0]:
					rotateY? [0, 1, 0]:
					rotateZ? [0, 0, 1]:
						null;

				rotateMatrix = M.create(4, 4);
				var angle = rotateX || rotateY || rotateZ || rotateAngle;

				// the following calculation is based on left-hand principle,
				// generally Kekule applies right hand principle, so reverse the angle
				angle = -angle;

				var cosAngle = Math.cos(angle);
				var sinAngle = Math.sin(angle);
				var v;
				for (var i = 1; i <= 4; ++i)
				{
					for (var j = 1; j <= 4; ++j)
					{
						if ((i < 4) && (j < 4))
						{
							for (var k = 1; k <= 3; ++k)
							{
								if ((k !== i) && (k !== j))
									break;
							}
							var nij = rotateVectorArray[i - 1] * rotateVectorArray[j - 1];
							v =
								(i < j)?
									nij * (1 - cosAngle)
										- Math.pow(-1, i + j) * rotateVectorArray[k - 1] * sinAngle:
									(i > j)?
										nij * (1 - cosAngle)
											+ Math.pow(-1, i + j) * rotateVectorArray[k - 1] * sinAngle:
										// i === j
										nij + (1 - nij) * cosAngle;
						}
						else if (i === j)   // i == j == 4
							v = 1;
						else
							v = 0;
						M.setValue(rotateMatrix, i, j, v);
					}
				}
			}
			*/
			var rotateMatrix = Kekule.CoordUtils._calcRotateXYZ3DMatrixCore(options);

			if (preMatrix)
				rotateMatrix = M.multiply(preMatrix, rotateMatrix);
			if (postMatrix)
				rotateMatrix = M.multiply(postMatrix, rotateMatrix); // M.multiply(transformMatrix, postMatrix);
		}

		return rotateMatrix;
	},
	/**
	 * Calculate the 3D transfrom matrix.
	 *  The tranform will be performed in the following order:
	 *   rotate, scale, translate.
	 * @param {Object} options Transform options, can has the following fields:
	 *   scale, scaleX, scaleY, scaleZ,  // all scale from center or zero point
	 *   translateX, translateY, translateZ,
	 *   rotateX, rotateY, rotateZ,  // if Y is set, Z will be ignored; if X is set, Y/Z will be ignored
	 *   rotateAngle, rotateAxisVector  // rotate around a vector start from center or zero point, if this value is set, rotateX-Z will be ignored
	 *   rotateMatrix   // use matrix to rotate directly
	 *   center: {x, y, z} (center of rotate and scale).
	 * @returns {Array} A 4X4 matrix.
	 */
	calcTransform3DMatrix: function(options)
	{
		var M = Kekule.MatrixUtils;
		var op = options || {};
		var center = op.center;
		if (center)  // center point set, need translate before rotate and scale
		{
			var preMatrix = M.create(4, 4, [
				1, 0, 0, -(center.x || 0),
				0, 1, 0, -(center.y || 0),
				0, 0, 1, -(center.z || 0),
				0, 0, 0, 1
			]);
			var postMatrix = M.create(4, 4, [
				1, 0, 0, (center.x || 0),
				0, 1, 0, (center.y || 0),
				0, 0, 1, (center.z || 0),
				0, 0, 0, 1
			]);
		}
		// rotate matrix
		var rotateOptionFields = ['rotateX', 'rotateY', 'rotateZ', 'rotateAngle', 'rotateAxisVector', 'rotateMatrix'];
		var rotateOptions = Object.copyValues({}, op, rotateOptionFields);
		var rotateMatrix = Kekule.CoordUtils.calcRotate3DMatrix(rotateOptions);

		/*
		if (op.rotateMatrix)
			rotateMatrix = op.rotateMatrix;
		else
		{
			var rotateX = op.rotateX;
			var rotateY = op.rotateY;
			var rotateZ = op.rotateZ;
			var rotateAngle = op.rotateAngle;
			var rotateAxisVector = op.rotateAxisVector;
			if (rotateX || rotateY || rotateZ || rotateAngle)
			{
				//if (rotateAngle && rotateAxisVector)
				var srotateAxisV = (rotateAngle && rotateAxisVector)? Kekule.CoordUtils.standardize(rotateAxisVector): null;

				var rotateVectorArray =
					srotateAxisV? [srotateAxisV.x, srotateAxisV.y, srotateAxisV.z]:
					rotateX? [1, 0, 0]:
					rotateY? [0, 1, 0]:
					rotateZ? [0, 0, 1]:
					null;

				rotateMatrix = M.create(4, 4);
				var angle = rotateX || rotateY || rotateZ || rotateAngle;
				var cosAngle = Math.cos(angle);
				var sinAngle = Math.sin(angle);
				var v;
				for (var i = 1; i <= 4; ++i)
				{
					for (var j = 1; j <= 4; ++j)
					{
						if ((i < 4) && (j < 4))
						{
							for (var k = 1; k <= 3; ++k)
							{
								if ((k !== i) && (k !== j))
									break;
							}
							var nij = rotateVectorArray[i - 1] * rotateVectorArray[j - 1];
							v =
								(i < j)?
									nij * (1 - cosAngle)
										- Math.pow(-1, i + j) * rotateVectorArray[k - 1] * sinAngle:
								(i > j)?
									nij * (1 - cosAngle)
										+ Math.pow(-1, i + j) * rotateVectorArray[k - 1] * sinAngle:
								// i === j
									nij + (1 - nij) * cosAngle;
						}
						else if (i === j)   // i == j == 4
							v = 1;
						else
							v = 0;
						M.setValue(rotateMatrix, i, j, v);
					}
				}
			}
		}
		*/

		// scale matrix
		var scale = op.scale;
		var scaleX = op.scaleX;
		var scaleY = op.scaleY;
		var scaleZ = op.scaleZ;
		if (scale || scaleX || scaleY || scaleZ)
		{
			var defScale = scale || 1;
			var scaleMatrix = M.create(4, 4);
			M.setValue(scaleMatrix, 1, 1, scaleX || defScale);
			M.setValue(scaleMatrix, 2, 2, scaleY || defScale);
			M.setValue(scaleMatrix, 3, 3, scaleZ || defScale);
			M.setValue(scaleMatrix, 4, 4, 1);
		}
		// translate matrix
		var translateX = op.translateX;
		var translateY = op.translateY;
		var translateZ = op.translateZ;
		if (translateX || translateY || translateZ)
		{
			var translateMatrix = M.create(4, 4);
			M.setValue(translateMatrix, 1, 1, 1);
			M.setValue(translateMatrix, 2, 2, 1);
			M.setValue(translateMatrix, 3, 3, 1);
			M.setValue(translateMatrix, 4, 4, 1);
			M.setValue(translateMatrix, 1, 4, translateX || 0);
			M.setValue(translateMatrix, 2, 4, translateY || 0);
			M.setValue(translateMatrix, 3, 4, translateZ || 0);
		}

		// sum up
		var transformMatrix = M.create(4, 4, [
			1,0,0,0,
			0,1,0,0,
			0,0,1,0,
			0,0,0,1
			]);
		//console.log('----------------------------------------');
		//console.log(transformMatrix);
		if (preMatrix)
			transformMatrix = M.multiply(preMatrix, transformMatrix); // M.multiply(transformMatrix, preMatrix);
		//console.log(transformMatrix);
		if (rotateMatrix)
			transformMatrix = M.multiply(rotateMatrix, transformMatrix);  // M.multiply(transformMatrix, rotateMatrix);
		//console.log(transformMatrix);
		if (scaleMatrix)
			transformMatrix = M.multiply(scaleMatrix, transformMatrix); // M.multiply(transformMatrix, scaleMatrix);
		//console.log(scaleMatrix, transformMatrix);
		if (translateMatrix)
			transformMatrix = M.multiply(translateMatrix, transformMatrix); // M.multiply(transformMatrix, translateMatrix);
		//console.log(transformMatrix);
		if (postMatrix)
			transformMatrix = M.multiply(postMatrix, transformMatrix); // M.multiply(transformMatrix, postMatrix);
		return transformMatrix;
	},
	/**
	 * Calculate inversed transform matrix of options.
	 * @param {Hash} options
	 * @returns {Array}
	 */
	calcInverseTransform3DMatrix: function(options)
	{
		var op = Object.create(options);
		if (options.center)
		{
			op.center = {x: options.center.x, y: options.center.y, z: options.center.z};
		}
		if (op.scale)
			op.scale = 1 / op.scale;
		if (op.scaleX)
			op.scaleX = 1 / op.scaleX;
		if (op.scaleY)
			op.scaleY = 1 / op.scaleY;
		if (op.scaleZ)
			op.scaleZ = 1 / op.scaleZ;
		if (op.translateX)
			op.translateX = -op.translateX;
		if (op.translateY)
			op.translateY = -op.translateY;
		if (op.translateZ)
			op.translateZ = -op.translateZ;


		if (op.rotateAngle)
			op.rotateAngle = -op.rotateAngle;
		if (op.rotateX)
			op.rotateX = -op.rotateX;
		if (op.rotateX)
			op.rotateY = -op.rotateY;
		if (op.rotateZ)
			op.rotateZ = -op.rotateZ;

		return Kekule.CoordUtils.calcTransform3DMatrix(op, true);
	},

	/**
	 * Returns suitable 2D transform params that can transform a line between targetCoord1/targetCoord2
	 * to destCoord1, destCoord2.
	 * @param {Hash} targetCoord1
	 * @param {Hash} targetCoord2
	 * @param {Hash} destCoord1
	 * @param {Hash} destCoord2
	 * @returns {Hash}
	 */
	calcCoordGroup2DTransformParams: function(targetCoord1, targetCoord2, destCoord1, destCoord2)
	{
		var CU = Kekule.CoordUtils;
		var distanceTarget = CU.getDistance(targetCoord1, targetCoord2);
		var deltaTarget = CU.substract(targetCoord2, targetCoord1);
		var angleTarget = Math.atan2(deltaTarget.y, deltaTarget.x);

		var distanceDest = CU.getDistance(destCoord1, destCoord2);
		var deltaDest = CU.substract(destCoord2, destCoord1);
		var angleDest = Math.atan2(deltaDest.y, deltaDest.x);

		var coordDelta = CU.substract(destCoord1, targetCoord1);

		var transParam = {
			'translateX': coordDelta.x,
			'translateY': coordDelta.y,
			'scale': distanceDest / distanceTarget,
			'rotateAngle': angleDest - angleTarget,
			'center': targetCoord1
		}
		return transParam;
	},

	/**
	 * Get distance between two coords. If coord2 is not set, this function will calc distance between coord1 and zero point.
	 * @param {Hash} coord1
	 * @param {Hash} coord2
	 * @returns {Float}
	 */
	getDistance: function(coord1, coord2)
	{
		if (!coord2)
			coord2 = {'x': 0, 'y': 0, 'z': 0};
		var l = Math.sqr(coord2.x - coord1.x) + Math.sqr(coord2.y - coord1.y);
		if (Kekule.ObjUtils.notUnset(coord1.z) && Kekule.ObjUtils.notUnset(coord2.z))
			l += Math.sqr(coord2.z - coord1.z);
		return Math.sqrt(l);
	},
	/**
	 * Calculate center coord of a set of coords.
	 * @param {Array} coords
	 * @returns {Hash}
	 */
	getCenter: function(coords)
	{
		var length = coords.length;
		if (length <= 0)
			return null;
		var sum = Object.extend(coords[0]);
		for (var i = 1; i < length; ++i)
		{
			sum = Kekule.CoordUtils.add(sum, coords[i]);
		}
		return Kekule.CoordUtils.divide(sum, length);
	},
	/**
	 * Check if coord inside 2D rect.
	 * @param {Object} coord
	 * @param {Object} rectCoord1
	 * @param {Object} rectCoord2
	 * @returns {Bool}
	 * @deprecated
	 */
	insideRect: function(coord, rectCoord1, rectCoord2)
	{
		return ((coord.x - rectCoord1.x) * (coord.x - rectCoord2.x) <= 0)
			&& ((coord.y - rectCoord1.y) * (coord.y - rectCoord2.y) <= 0);
	},

	/**
	 * Check if coord is inside a box.
	 * @param {Hash} coord
	 * @param {Hash} box
	 * @returns {Bool}
	 */
	isInsideBox: function(coord, box)
	{
		//var b = Kekule.BoxUtils.normalize(box);
		var b = box;
		var result = (Math.sign(coord.x - b.x1) * Math.sign(coord.x - b.x2) <= 0)
			&& (Math.sign(coord.y - b.y1) * Math.sign(coord.y - b.y2) <= 0);
		if (Kekule.ObjUtils.notUnset(coord.z))
			result = result && (Math.sign(coord.z - b.z1) * Math.sign(coord.z - b.z2) <= 0);
		return result;
	},

	/**
	 * Returns a minial box that contains all coords.
	 * @param {Array} coords Array of coords.
	 * @returns {Hash}
	 */
	getContainerBox: function(coords)
	{
		var minCoord = {};
		var maxCoord = {};
		var l = coords.length;
		if (l > 0)
		{
			minCoord = Object.extend({}, coords[0]);
			maxCoord = Object.extend({}, coords[0]);
		}
		else
			return null;
		for (var i = 1; i < l; ++i)
		{
			var coord = coords[i];
			minCoord.x = Math.min(minCoord.x, coord.x);
			minCoord.y = Math.min(minCoord.y, coord.y);
			maxCoord.x = Math.max(maxCoord.x, coord.x);
			maxCoord.y = Math.max(maxCoord.y, coord.y);
			if (Kekule.ObjUtils.notUnset(minCoord.z))  // 3D
			{
				minCoord.z = Math.min(minCoord.z, coord.z);
				maxCoord.z = Math.max(maxCoord.z, coord.z);
			}
		}

		return Kekule.BoxUtils.createBox(minCoord, maxCoord);
	}
};

/**
 * Utility methods of some 2D or 3D geometry tasks.
 * @class
 */
Kekule.GeometryUtils = {
	/**
	 * Returns the cross product (v1.v2) of two vectors represented by coord1 and coord2.
	 * @param {Hash} coord1
	 * @param {Hash} coord2
	 * @returns {Float}
	 */
	getVectorScalarProduct: function(coord1, coord2)
	{
		var result = (coord1.x || 0) * (coord2.x || 0) + (coord1.y || 0) * (coord2.y || 0)
			+ (coord1.z || 0) * (coord2.z || 0);
		return result;
	},
	/**
	 * Returns the cross product (v1Xv2) of two vectors represented by coord1 and coord2.
	 * @param {Hash} coord1
	 * @param {Hash} coord2
	 * @returns {Hash}
	 */
	getVectorCrossProduct: function(coord1, coord2)
	{
		var result = {
			'x': (coord1.y || 0) * (coord2.z || 0) - (coord1.z || 0) * (coord2.y || 0),
			'y': (coord1.z || 0) * (coord2.x || 0) - (coord1.x || 0) * (coord2.z || 0),
			'z': (coord1.x || 0) * (coord2.y || 0) - (coord1.y || 0) * (coord2.x || 0)
		};
		return result;
	},
	/**
	 * Returns included angle of two vectors represented by coord1 and coord2.
	 * @param {Hash} coord1
	 * @param {Hash} coord2
	 * @returns {Number}
	 */
	getVectorIncludedAngle: function(coord1, coord2)
	{
		var CU = Kekule.CoordUtils;
		var cross = Kekule.GeometryUtils.getVectorCrossProduct(coord1, coord2);
		var zeroCoord = {'x': 0, 'y': 0, 'z': 0};
		var divV = (CU.getDistance(coord1, zeroCoord) * CU.getDistance(coord2, zeroCoord));
		var sinAngleV = CU.getDistance(cross, zeroCoord) / divV;
		//var cosAngleV = Kekule.GeometryUtils.getVectorScalarProduct(coord1, coord2) / divV;
		var result = Math.asin(sinAngleV);  // asin always returns value between -Pi/2 ~ Pi / 2
		//var result = Math.acos(cosAngleV);
		/*
		if (cross.z < 0)
			result = Math.PI - result;
		*/
		return result;
	},

	/*
	 * Returns sin and cos value of dihedral angle of plane (c1, c2, c3) and (c2, c3, c4) while c1-4 are coords of 3D.
	 * This method is based on formula (when A1, A2, A3 and B1, B2, B3 are three points in each plane):
	 *   alpha = arcsin(|Ua × Ub| / |Ua||Ub|)
	 *   alpha = arccos(Ua.Ub) / |Ua||Ub|)
	 * where Ua = (A2−A1) × (A3−A1) and Ub = (B2−B1) × (B3−B1).
	 * Here we appoint A1(B1) / A2(B2) to c2 / c3, A3 to c1 and B3 to c4.
	 * @param {Hash} c1
	 * @param {Hash} c2
	 * @param {Hash} c3
	 * @param {Hash} c4
	 * @returns {Hash} A hash contains {'sinValue': sinValue, 'cosValue': cosValue}.
	 */
	/*
	getSinCosValueOfDihedralAngleOfCoords: function(c1, c2, c3, c4)
	{
		var CU = Kekule.CoordUtils;
		var GU = Kekule.GeometryUtils;
		var v = CU.substract(c3, c2);
		var ua = GU.getVectorCrossProduct(v, CU.substract(c1, c2));
		var ub = GU.getVectorCrossProduct(v, CU.substract(c4, c2));
		var zero = {'x': 0, 'y': 0, 'z': 0};
		var divV = (CU.getDistance(ua, zero) * CU.getDistance(ub, zero));
		var sinValue = CU.getDistance(GU.getVectorCrossProduct(ua, ub), zero) / divV;
		var cosValue = GU.getVectorScalarProduct(ua, ub) / divV;
		return {
			'sinValue': sinValue, 'cosValue': cosValue
		};
	},
	*/

	/*
	 * Returns dihedral angle of plane (c1, c2, c3) and (c2, c3, c4) while c1-4 are coords of 3D.
	 * This method is based on formula (when A1, A2, A3 and B1, B2, B3 are three points in each plane):
	 *   alpha = arcsin(|Ua × Ub| / |Ua||Ub|)
	 * where Ua = (A2−A1) × (A3−A1) and Ub = (B2−B1) × (B3−B1).
	 * @param {Hash} c1
	 * @param {Hash} c2
	 * @param {Hash} c3
	 * @param {Hash} c4
	 * @returns {Float}
	 */
	/*
	getDihedralAngleOfCoords: function(c1, c2, c3, c4)
	{
		var sinCosValue = Kekule.GeometryUtils.getSinValueOfDihedralAngleOfCoords(c1, c2, c3, c4);
		return Math.asin(sinCosValue.sinValue);
	},
	*/

	/**
	 * Returns dihedral angle defined by three vectors (e.g., three bonds in molecule).
	 * v1-3 is formed by {x, y, z} coords. The calculation is based on formula:
	 *   alpha = atan2([v1×v2]×[v2×v3].[v2/|v2|], [v1×v2].[v2×v3])
	 * (http://en.wikipedia.org/wiki/Dihedral_angle)
	 * @param {Hash} v1
	 * @param {Hash} v2
	 * @param {Hash} v3
	 * @returns {Float} An angle of 0-2Pi is returned.
	 *   If angle can not be calculated (e.g., v1/v2 or v2/v3 on same line, not forms a plane),
	 *   a negtive value will be returned instead.
	 */
	getDihedralAngleOfVectors: function(v1, v2, v3)
	{
		var CU = Kekule.CoordUtils;
		var GU = Kekule.GeometryUtils;
		var v1Xv2 = GU.getVectorCrossProduct(v1, v2);
		var v2Xv3 = GU.getVectorCrossProduct(v2, v3);
		var error = CU.getDistance(v2) / 1e5;  // TODO: currently error is fixed
		if (CU.isZero(v1Xv2, error) || CU.isZero(v2Xv3, error))  // can not calculate
			return -1;
		var d = CU.standardize(v2);
		var y = GU.getVectorScalarProduct(GU.getVectorCrossProduct(v1Xv2, v2Xv3), d);
		var x = GU.getVectorScalarProduct(v1Xv2, v2Xv3);
		var result = Math.atan2(y, x);
		if (result < 0)
			result += Math.PI * 2;
		return result;
	},
	/**
	 * Returns dihedral angle of plane (c1, c2, c3) and (c2, c3, c4) while c1-4 are coords of 3D.
	 * @param {Hash} c1
	 * @param {Hash} c2
	 * @param {Hash} c3
	 * @param {Hash} c4
	 * @returns {Float}
	 */
	getDihedralAngleOfPoints: function(c1, c2, c3, c4)
	{
		var CU = Kekule.CoordUtils;
		var v1 = CU.substract(c2, c1);
		var v2 = CU.substract(c3, c2);
		var v3 = CU.substract(c4, c3);
		return Kekule.GeometryUtils.getDihedralAngleOfVectors(v1, v2, v3);
	}
};

/**
 * Utility methods about geometry box (2D or 3D).
 * Box is a region defined by two coord values.
 * @class
 */
Kekule.BoxUtils = {
	/**
	 * Create a box with two coord at top-left and bottom-right.
	 * @param {Hash} coord1
	 * @param {Hash} coord2
	 * @returns {Hash}
	 */
	createBox: function(coord1, coord2)
	{
		var result = {};
		var x1 = coord1.x || 0;
		var y1 = coord1.y || 0;
		var x2 = coord2.x || 0;
		var y2 = coord2.y || 0;
		(x1 <= x2)?
			(result.x1 = x1, result.x2 = x2):
			(result.x1 = x2, result.x2 = x1);
		(y1 <= y2)?
			(result.y1 = y1, result.y2 = y2):
			(result.y1 = y2, result.y2 = y1);

		if (Kekule.ObjUtils.notUnset(coord1.z) && Kekule.ObjUtils.notUnset(coord2.z))
		{
			(coord1.z <= coord2.z)?
				(result.z1 = coord1.z, result.z2 = coord2.z):
				(result.z1 = coord2.z, result.z2 = coord1.z);
		}
		return result;
	},

	/**
	 * Convert a box to a rect defined by left, top, width and height.
	 * @param {Hash} box
	 * @returns {Hash}
	 */
	convertToRect: function(box)
	{
		var b = Kekule.BoxUtils.normalize(box);
		return Kekule.RectUtils.createRect(b.x1, b.y1, b.x2 - b.x1, b.y2 - b.y1);
	},

	/**
	 * Normalize the x/y values in box.
	 * Some times x1 > x2 or y1 > y2, normalize will ensure x1/y1 is always no larger then x2/y2.
	 * @param {Hash} box
	 * @returns {Hash}
	 */
	normalize: function(box)
	{
		var result = {'x1': Math.min(box.x1, box.x2), 'y1': Math.min(box.y1, box.y2), 'x2': Math.max(box.x1, box.x2), 'y2': Math.max(box.y1, box.y2)};
		if (Kekule.ObjUtils.notUnset(box.z1) && Kekule.ObjUtils.notUnset(box.z2))
		{
			result.z1 = Math.min(box.z1, box.z2);
			result.z2 = Math.max(box.z1, box.z2);
		}
		return result;
	},

	/**
	 * Shift box to a new location.
	 * @param {Float} deltaX
	 * @param {Float} deltaY
	 * @param {Float} deltaZ
	 * @returns {Hash}
	 */
	shiftBox: function(box, deltaX, deltaY, deltaZ)
	{
		var dx = deltaX || 0;
		var dy = deltaY || 0;
		var dz = deltaZ || 0;
		var coord1 = {'x': box.x1 + dx, 'y': box.y1 + dy};
		var coord2 = {'x': box.x2 + dx, 'y': box.y2 + dy};
		if (Kekule.ObjUtils.notUnset(box.z1) && Kekule.ObjUtils.notUnset(box.z2))
		{
			coord1.z = box.z1 + dz;
			coord2.z = box.z2 + dz;
		}
		var result = Kekule.BoxUtils.createBox(coord1, coord2);
		return result;
	},

	/**
	 * Inflate the size of box. topleft - inflation and bottomright + inflation.
	 * X/Y/Z may have different inflation. If only one inflation value is provided, the box
	 * will be use this value on both width and height (and depth).
	 * @param {Hash} box
	 * @param {Float} inflationX
	 * @param {Float} inflationY
	 * @returns {Hash}
	 */
	inflateBox: function(box, inflationX, inflationY, inflationZ)
	{
		if (Kekule.ObjUtils.isUnset(inflationY))
			inflationY = inflationX;
		if (Kekule.ObjUtils.isUnset(inflationZ))
			inflationZ = inflationX;
		var result = Kekule.BoxUtils.normalize(box);
		var result = {
			x1: result.x1 - inflationX,
			y1: result.y1 - inflationY,
			x2: result.x2 + inflationX,
			y2: result.y2 + inflationY
		}
		if (Kekule.ObjUtils.notUnset(result.z1) && Kekule.ObjUtils.notUnset(result.z2))
		{
			result.z1 = result.z1 - inflationZ;
			result.z2 = result.z2 + inflationZ;
		}
		return result;
	},

	/**
	 * Get the smallest big box that contains box1 and box2.
	 * @param {Hash} box1
	 * @param {Hash} box2
	 * @returns {Hash}
	 */
	getContainerBox: function(box1, box2)
	{
		if (!box1)
			return Object.extend({}, box2);
		else if (!box2)
			return Object.extend({}, box1);
		var b1 = Kekule.BoxUtils.normalize(box1);
		var b2 = Kekule.BoxUtils.normalize(box2);
		var result = {
			'x1': Math.min(b1.x1, b2.x1),
			'y1': Math.min(b1.y1, b2.y1),
			'x2': Math.max(b1.x2, b2.x2),
			'y2': Math.max(b1.y2, b2.y2)
		};
		if (Kekule.ObjUtils.notUnset(b1.z1) && Kekule.ObjUtils.notUnset(b1.z2)
			&& Kekule.ObjUtils.notUnset(b2.z1) && Kekule.ObjUtils.notUnset(b2.z2))
		{
			result.z1 = Math.min(b1.z1, b2.z1);
			result.z2 = Math.max(b1.z2, b2.z2);
		}
		return result;
	},
	/**
	 * Returns intersection of two boxes.
	 * @param {Hash} box1
	 * @param {Hash} box2
	 * @returns {Hash}
	 */
	getIntersection: function(box1, box2)
	{
		var b1 = Kekule.BoxUtils.normalize(box1);
		var b2 = Kekule.BoxUtils.normalize(box2);
		var r = {
			'x1': Math.max(b1.x1, b2.x1),
			'y1': Math.max(b1.y1, b2.y1),
			'x2': Math.min(b1.x2, b2.x2),
			'y2': Math.max(b1.y2, b2.y2)
		};
		if ((r.x1 >= r.x2) || (r.y1 >= r.y2))
			return null;

		if (Kekule.ObjUtils.notUnset(b1.z1) && Kekule.ObjUtils.notUnset(b1.z2)
			&& Kekule.ObjUtils.notUnset(b2.z1) && Kekule.ObjUtils.notUnset(b2.z2))
		{
			r.z1 = Math.max(b1.z1, b2.z1);
			r.z2 = Math.min(b1.z2, b2.z2);
			if (r.z1 >= r.z2)
				return null;
		}
		return r;
	},
	/**
	 * Check if two box has intersection.
	 * @param {Hash} box1
	 * @param {Hash} box2
	 * @returns {Bool}
	 */
	hasIntersection: function(box1, box2)
	{
		return !!Kekule.BoxUtils.getIntersection(box1, box2);
	},

	/**
	 * Check if two boxes are the same.
	 * @param {Hash} b1
	 * @param {Hash} b2
	 * @returns {Bool}
	 */
	isEqual: function(b1, b2)
	{
		return (Math.min(b1.x1, b1.x2) === Math.min(b2.x1, b2.x2))
			&& (Math.max(b1.x1, b1.x2) === Math.max(b2.x1, b2.x2))
			&& (Math.min(b1.y1, b1.y2) === Math.min(b2.y1, b2.y2))
			&& (Math.max(b1.y1, b1.y2) === Math.max(b2.y1, b2.y2));
	},

	/**
	 * Check if innerBox is inside outerBox.
	 * @param {Hash} innerBox
	 * @param {Hash} outerBox
	 * @returns {Bool}
	 */
	isInside: function(innerBox, outerBox)
	{
		var b1 = innerBox;
		var b2 = outerBox;
		return (Math.min(b1.x1, b1.x2) >= Math.min(b2.x1, b2.x2))
			&& (Math.max(b1.x1, b1.x2) <= Math.max(b2.x1, b2.x2))
			&& (Math.min(b1.y1, b1.y2) >= Math.min(b2.y1, b2.y2))
			&& (Math.max(b1.y1, b1.y2) <= Math.max(b2.y1, b2.y2))
	},

	/**
	 * Returns center coord of 2D or 3D box.
	 * @param {Hash} box
	 * @returns {Hash}
	 */
	getCenterCoord: function(box)
	{
		var result = {
			'x': (box.x1 || 0 + box.x2 || 0) / 2,
			'y': (box.y1 || 0 + box.y2 || 0) / 2
		};
		if (Kekule.ObjUtils.notUnset(box.z1) || Kekule.ObjUtils.notUnset(box.z2))
			result.z = (box.z1 || 0 + box.z2 || 0) / 2;
		return result;
	},
	/**
	 * Returns the min and max corner coords of box.
	 * @param {Hash} box
	 * @return {Hash} {min: coord, max: coord}
	 */
	getMinMaxCoords: function(box)
	{
		var b = Kekule.BoxUtils.normalize(box);
		var result = {
			'min': {'x': b.x1, 'y': b.y1},
			'max': {'x': b.x2, 'y': b.y2}
		};
		if (Kekule.ObjUtils.notUnset(b.z1))  // 2D box
		{
			result.min.z = b.z1;
			result.max.z = b.z2;
		}
		return result;
	},
	/**
	 * To a 2D box, returns four coords of box top-left, top-right, bottom-left and bottom-right.
	 * To a 3D box, returns coords of 8 corners.
	 * @param {Hash} box
	 * @returns {Array} Array of coords.
	 */
	getCornerCoords: function(box)
	{
		var b = Kekule.BoxUtils.normalize(box);
		if (Kekule.ObjUtils.isUnset(b.z1))  // 2D box
		{
			return [
				{'x': b.x1, 'y': b.y1},
				{'x': b.x1, 'y': b.y2},
				{'x': b.x2, 'y': b.y1},
				{'x': b.x2, 'y': b.y2}
			];
		}
		else  // 3D box
		{
			return [
				{'x': b.x1, 'y': b.y1, 'z': b.z1},
				{'x': b.x1, 'y': b.y2, 'z': b.z1},
				{'x': b.x2, 'y': b.y1, 'z': b.z1},
				{'x': b.x2, 'y': b.y2, 'z': b.z1},
				{'x': b.x1, 'y': b.y1, 'z': b.z2},
				{'x': b.x1, 'y': b.y2, 'z': b.z2},
				{'x': b.x2, 'y': b.y1, 'z': b.z2},
				{'x': b.x2, 'y': b.y2, 'z': b.z2}
			];
		}
	},

	/**
	 * Do a 2d transform to a box.
	 * The tranform will be performed in the following order:
	 *   rotate, scale, translate.
	 * Note that there may be rotation in transform, so box may be larger than expected.
	 * @param {Hash} box
	 * @param {Hash} options Transform options, can has the following fields:
	 *   scale, scaleX, scaleY
	 *   translateX, translateY,
	 *   rotateAngle,
	 *   center: {x, y} (center of rotate and scale).
	 *  @returns {Hash} 2D box after transform.
	 */
	transform2D: function(box, options)
	{
		var coords = Kekule.BoxUtils.getCornerCoords(box);
		var transformedCoords = [];
		for (var i = 0, l = coords.length; i < l; ++i)
		{
			transformedCoords.push(Kekule.CoordUtils.transform2D(coords[i], options));
		}
		return Kekule.CoordUtils.getContainerBox(transformedCoords);
	},

	/**
	 * Do a 3d transform to a box.
	 * The tranform will be performed in the following order:
	 *   rotate, scale, translate.
	 * @param {Hash} box 3D box.
	 * @param {Hash} options Transform options, can has the following fields:
	 *   scale, scaleX, scaleY, scaleZ,  // all scale from center or zero point
	 *   translateX, translateY, translateZ,
	 *   rotateX, rotateY, rotateZ,
	 *   rotateAngle, rotateAxisVector  // rotate around a vector start from center or zero point
	 *   center: {x, y, z} (center of rotate and scale).
	 *  @returns {Hash} 3D box after transform.
	 */
	transform3D: function(box, options)
	{
		var coords = Kekule.BoxUtils.getCornerCoords(box);
		var transformedCoords = [];
		for (var i = 0, l = coords.length; i < l; ++i)
		{
			transformedCoords.push(Kekule.CoordUtils.transform3D(coords[i], options));
		}
		return Kekule.CoordUtils.getContainerBox(transformedCoords);
	}
};

/**
 * Utility methods about 2D rectangle.
 * Rectangle is a region defined by left, top, width and height.
 * @class
 */
Kekule.RectUtils = {
	/**
	 * Create a rect object.
	 * @returns {Hash}
	 */
	createRect: function(left, top, width, height)
	{
		var result = {'left': left, 'top': top, 'width': width, 'height': height};
		return result;
	},
	/**
	 * Returns if the width/height of rect is zero
	 * @param rect
	 */
	isZero: function(rect)
	{
		return (rect.width === 0) && (rect.height === 0);
	},
	/**
	 * Convert a rect to a box defined by two coords.
	 * @param {Hash} rect
	 * @returns {Hash}
	 */
	convertToBox: function(rect)
	{
		var coord1 = Kekule.CoordUtils.create(rect.left, rect.top);
		var coord2 = Kekule.CoordUtils.create(rect.left + rect.width, rect.top + rect.height);
		return Kekule.BoxUtils.createBox(coord1, coord2);
	},
	/**
	 * Inflate the size of rect. Top left coord of rect will not change.
	 * X/Y may have different inflation. If only one inflation value is provided, the rect
	 * will be use this value on both width and height.
	 * @param {Hash} rect
	 * @param {Float} inflateX
	 * @param {Float} inflateY
	 * @returns {Hash}
	 */
	inflateRect: function(rect, inflateX, inflateY)
	{
		if (Kekule.ObjUtils.isUnset(inflateY))
			inflateY = inflateX;
		var result = Kekule.RectUtils.createRect(rect.left, rect.top, rect.width + inflateX, rect.height + inflateY);
		return result;
	},
	/**
	 * Change the top and left value of rect.
	 * @param {Hash} rect
	 * @param {Float} deltaX
	 * @param {Float} deltaY
	 * @returns {Hash}
	 */
	shiftRect: function(rect, deltaX, deltaY)
	{
		var dx = deltaX || 0;
		var dy = deltaY || 0;
		var result = Kekule.RectUtils.createRect(rect.left + dx, rect.top + dy, rect.width, rect.height);
		return result;
	},
	/**
	 * Get the smallest big rect that contains rect1 and rect2.
	 * @param {Hash} rect1
	 * @param {Hash} rect2
	 * @returns {Hash}
	 */
	getContainerRect: function(rect1, rect2)
	{
		var b1 = Kekule.RectUtils.convertToBox(rect1);
		var b2 = Kekule.RectUtils.convertToBox(rect2);
		var b3 = Kekule.BoxUtils.getContainerBox(b1, b2);
		return Kekule.BoxUtils.convertToRect(b3);
	},
	/**
	 * Returns intersection of two rects.
	 * @param {Hash} rect1
	 * @param {Hash} rect2
	 * @returns {Hash}
	 */
	getIntersection: function(rect1, rect2)
	{
		var b1 = Kekule.RectUtils.convertToBox(rect1);
		var b2 = Kekule.RectUtils.convertToBox(rect2);
		var b3 = Kekule.BoxUtils.getIntersection(b1, b2);
		return b3? Kekule.BoxUtils.convertToRect(b3): null;
	},
	/**
	 * Check if two rects has intersection.
	 * @param {Hash} rect1
	 * @param {Hash} rect2
	 * @returns {Bool}
	 */
	hasIntersection: function(rect1, rect2)
	{
		return !!Kekule.RectUtils.getIntersection(rect1, rect2);
	}
};

/**
 * Utility methods for zoom in/out functions.
 * @class
 */
Kekule.ZoomUtils = {
	/** @private */
	PREDEFINED_ZOOM_RATIOS: [0.1, 0.3, 0.5, 0.66, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5, 7, 10, 15, 20],
	/**
	 * Get a predefined ratio that bigger than currRatio, which can be used in usual zoom in function.
	 * @param {Float} currRatio
	 * @param {Int} step
	 * @returns {Float}
	 */
	getNextZoomInRatio: function(currRatio, step)
	{
		if (!step)
			step = 1;
		var rs = Kekule.ZoomUtils.PREDEFINED_ZOOM_RATIOS;
		var len = rs.length;
		if (currRatio < rs[len - 1])  // smaller than one of predefined ones
		{
			for (var i = 0; i < len; ++i)
			{
				if (rs[i] > currRatio)
				{
					return rs[Math.min(i + step, len) - 1];
				}
			}
		}
		//else
			return currRatio;  // bigger than all, return original value
	},
	/**
	 * Get a predefined ratio that smaller than currRatio, which can be used in usual zoom out function.
	 * @param {Float} currRatio
	 * @param {Int} step
	 * @returns {Float}
	 */
	getNextZoomOutRatio: function(currRatio, step)
	{
		if (!step)
			step = 1;
		var rs = Kekule.ZoomUtils.PREDEFINED_ZOOM_RATIOS;
		var len = rs.length;
		if (currRatio > rs[0])  // smaller than one of predefined ones
		{
			for (var i = len - 1; i >= 0; --i)
			{
				if (rs[i] < currRatio)
					return rs[Math.max(i - step + 1, 0)];
			}
		}
		//else
			return currRatio;  // bigger than all, return original value
	}
};