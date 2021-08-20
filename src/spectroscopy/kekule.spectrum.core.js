(function(){

"use strict";

var PS = Class.PropertyScope;
var AU = Kekule.ArrayUtils;

/**
 * Base namespace for spectra.
 * @type {namespace}
 */
Kekule.Spectroscopy = {};

/**
 * Enumeration of data mode of spectrum variable.
 * @enum
 */
Kekule.Spectroscopy.DataMode = {
	/** Value points are continuous, e.g. in IR data table. */
	CONTINUOUS: 1,
	/** Value points are discrete, e.g. in MS peak table. */
	PEAK: 2
};

/**
 * Some util methods about spectroscopy.
 * @class
 */
Kekule.Spectroscopy.Utils = {
	/**
	 * Merge two data ranges.
	 * Each item is a hash like {x: {min: minValue, max: maxValue}, y: {min: minValue, max: maxValue}}.
	 * @param {Hash} r1
	 * @param {Hash} r2
	 * @returns {Hash}
	 */
	mergeDataRange: function(r1, r2)
	{
		var result = {};
		var vars = AU.clone(Kekule.ObjUtils.getOwnedFieldNames(r1));
		AU.pushUnique(vars, Kekule.ObjUtils.getOwnedFieldNames(r2));
		for (var i = 0, l = vars.length; i < l; ++i)
		{
			var varSymbol =vars[i];
			if (!r1[varSymbol])
				result[varSymbol] = Object.extend(r2[varSymbol]);
			else if (!r2[varSymbol])
				result[varSymbol] = Object.extend(r1[varSymbol]);
			else
			{
				result[varSymbol] = {
					'min': (r1[varSymbol].min < r2[varSymbol].min)? r1[varSymbol].min: r2[varSymbol].min,
					'max': (r1[varSymbol].max > r2[varSymbol].max)? r1[varSymbol].max: r2[varSymbol].max
				}
			}
		}
		return result;
	}
};

/**
 * Represent part of data in a spectrum.
 * @class
 *
 * @param {String} name
 * @param {Kekule.Spectroscopy.SpectrumData} parent Parent spectrum data object.
 * @param {Array} localVariables Array of variable definition objects or symbols.
 *
 * @property {Kekule.Spectroscopy.SpectrumData} parent Parent spectrum data object.
 * //@property {Array} variables Array of variables of data, each item is {@link Kekule.VarDefinition}.
 * @property {Array} localVarInfos Stores the local variable information. Each item is a hash containing fields {'varDef', 'range'}.
 * @property {Array} varSymbols Array of variable symbols such as ['X', 'Y'].
 * @property {Int} mode Data mode of section, continuous or peak.
 * @property {Hash} peakRoot
 * @property {String} name
 * @property {String} title
 */
Kekule.Spectroscopy.SpectrumDataSection = Class.create(Kekule.ChemObject,
/** @lends Kekule.Spectroscopy.SpectrumDataSection# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Spectroscopy.SpectrumDataSection',
	/** @private */
	initialize: function(name, parent, localVariables)
	{
		this.setPropStoreFieldValue('name', name);
		this.setPropStoreFieldValue('localVarInfos', []);
		this.setPropStoreFieldValue('dataItems', []);
		this.setPropStoreFieldValue('parent', parent);
		this.tryApplySuper('initialize', []);
		this.setLocalVarSymbols(localVariables);
		this.setDataSorted(true);
		this._cache = {};  // private
		//this.setPropStoreFieldValue('variables', variables? AU.clone(variables): []);
	},
	doFinalize: function()
	{
		if (this.getParent() && this.getParent().removeChild)
		{
			// remove item in parent first
			this.getParent().removeChild(this);
		}
		this.clear();
		var variables = this.getVariables();
		for (var i = 0, l = variables.length; i < l; ++i)
		{
			variables[i].finalize();
		}
		this.setPropStoreFieldValue('localVarInfos', null);
		this.tryApplySuper('doFinalize');
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('parent', {'dataType': 'Kekule.MapEx', 'setter': null, 'serializable': false});
		this.defineProp('name', {'dataType': DataType.STRING});
		this.defineProp('title', {'dataType': DataType.STRING});
		/*
		this.defineProp('variables', {'dataType': DataType.ARRAY});
		this.defineProp('varSymbols', {'dataType': DataType.ARRAY, 'setter': null, 'scope': PS.PRIVATE,
			'getter': function() {
				var result = [];
				var list = this.getVariables();
				for (var j = 0, jj = list.length; j < jj; ++j)
				{
					var varDef = list[j];
					result.push(varDef.getSymbol());
				}
				return result;
			}});
		*/
		this.defineProp('localVarInfos', {'dataType': DataType.ARRAY, 'setter': null, 'serializable': false});
		this.defineProp('localVarSymbols', {'dataType': DataType.ARRAY, 'scope': PS.PRIVATE,
			'getter': function() {
				var result = [];
				var list = this.getLocalVarInfos();
				for (var j = 0, jj = list.length; j < jj; ++j)
				{
					var info = list[j];
					result.push(info.varDef.getSymbol());
				}
				return result;
			},
			'setter': function(value)
			{
				var v = value || [];
				var infos = [];
				for (var i = 0, l = v.length; i < l; ++i)
				{
					var item = v[i];
					this._pushLocalVariable(item, infos);
				}
				this.setPropStoreFieldValue('localVarInfos', infos);
			}
		});
		this.defineProp('mode', {'dataType': DataType.INT, 'enumSource': Kekule.Spectroscopy.DataMode,
			'setter': function(value)
			{
				if (this.getMode() !== value)
				{
					//console.log('set mode', value);
					this.setPropStoreFieldValue('mode', value);
					this.notifyDataChange();
				}
			}
		});
		this.defineProp('defPeakRoot', {'dataType': DataType.Hash});
		// private, stores the data items, each item is a hash, e.g. {x: 1, y: 10, w: 2}
		this.defineProp('dataItems', {'dataType': DataType.ARRAY, 'setter': null, 'scope1': PS.PRIVATE});
	},
	/** @ignore */
	initPropValues: function()
	{
		this.tryApplySuper('initPropValues');
		this.setMode(Kekule.Spectroscopy.DataMode.CONTINUOUS);
	},

	/**
	 * Returns the variable definition of parent spectrum data.
	 * @returns {Array}
	 */
	getParentVariables: function()
	{
		var parent = this.getParent();
		return (parent && parent.getVariable()) || [];
	},
	/** @private */
	_pushLocalVariable: function(varDefOrSymbol, targetArray)
	{
		if (!targetArray)
			targetArray = this.getLocalVarInfos();
		var parent = this.getParent();
		if (parent)
		{
			var varDef = parent.getVariable(varDefOrSymbol);
			if (varDef)
			{
				targetArray.push({'varDef': varDef});
			}
		}
	},
	/**
	 * Returns the local variable information index of variable.
	 * @param {Variant} varIndexOrNameOrDef
	 * @returns {Int}
	 */
	getLocalVarInfoIndex: function(varIndexOrNameOrDef)
	{
		var result = -1;
		var localVarInfos = this.getLocalVarInfos();
		if (typeof (varIndexOrNameOrDef) === 'number')
			result = varIndexOrNameOrDef;
		else // if (varIndexOrNameOrDef instanceof Kekule.VarDefinition)
		{
			for (var i = 0, l = localVarInfos.length; i < l; ++i)
			{
				var varDef = localVarInfos[i].varDef;
				if (varDef === varIndexOrNameOrDef || varDef.getSymbol() === varIndexOrNameOrDef)
				{
					result = i;
					break;
				}
			}
		}
		return result;
	},
	/**
	 * Returns the local information of variable.
	 * @param {Variant} varIndexOrNameOrDef
	 * @returns {Hash}
	 */
	getLocalVarInfo: function(varIndexOrNameOrDef)
	{
		var index = this.getLocalVarInfoIndex(varIndexOrNameOrDef);
		return (index >= 0)? this.getLocalVarInfos()[index]: null;
		/*
		var result;
		var localVarInfos = this.getLocalVarInfos();
		if (typeof (varIndexOrNameOrDef) === 'number')
			result = localVarInfos[varIndexOrNameOrDef];
		else // if (varIndexOrNameOrDef instanceof Kekule.VarDefinition)
		{
			for (var i = 0, l = localVarInfos.length; i < l; ++i)
			{
				var varDef = localVarInfos[i].varDef;
				if (varDef === varIndexOrNameOrDef || varDef.getSymbol() === varIndexOrNameOrDef)
				{
					result = localVarInfos[i];
					break;
				}
			}
		}
		return result;
		*/
	},
	/**
	 * Returns the local information value of a variable.
	 * @param {Variant} varIndexOrNameOrDef
	 * @param {String} key
	 * @returns {Variant}
	 */
	getLocalVarInfoValue: function(varIndexOrNameOrDef, key)
	{
		var info = this.getLocalVarInfo(varIndexOrNameOrDef);
		return info && info[key];
	},
	/**
	 * Set a local information of variable.
	 * @param {Variant} varIndexOrNameOrDef
	 * @param {String} key
	 * @param {Variant} value
	 */
	setLocalVarInfoValue: function(varIndexOrNameOrDef, key, value)
	{
		var info = this.getLocalVarInfo(varIndexOrNameOrDef);
		info[key] = value;
	},
	/**
	 * Returns the from/to value of a continuous variable.
	 * @param {Variant} varNameOrIndexOrDef
	 * @returns {Hash} Hash of {fromValue, toValue}
	 */
	getContinuousVarRange: function(varIndexOrNameOrDef)
	{
		var parent = this.getParent();
		var varInfo = this.getLocalVarInfo(varIndexOrNameOrDef);
		return varInfo.continuousRange || (parent && parent.getContinuousVarRange && parent.getContinuousVarRange(varInfo.varDef));
		/*
		var result = this.getLocalVarInfoValue(varIndexOrNameOrDef, 'continuousRange');
		if (!result)
		{
			var parent = this.getParent();
			result = parent && parent.getContinuousVarRange(varInfo.varDef);
		}
		return result;
		*/
	},
	/**
	 * Set the from/to value of a variable and mark it as a continuous one.
	 * @param {Variant} varNameOrIndexOrDef
	 * @param {Number} fromValue
	 * @param {Number} toValue
	 */
	setContinuousVarRange: function(varIndexOrNameOrDef, fromValue, toValue)
	{
		/*
		var varInfo = this.getLocalVarInfo(varIndexOrNameOrDef);
		varInfo.range = {'fromValue': fromValue, 'toValue': toValue};
		*/
		this.setLocalVarInfoValue(varIndexOrNameOrDef, 'continuousRange', {'fromValue': fromValue, 'toValue': toValue});
		return this;
	},
	/**
	 * Remove the continuous information of a variable.
	 * @param {Variant} varIndexOrNameOrDef
	 */
	clearContinuousVarRange: function(varIndexOrNameOrDef)
	{
		/*
		var varInfo = this.getLocalVarInfo(varIndexOrNameOrDef);
		varInfo.range = null;
		*/
		this.setLocalVarInfoValue(varIndexOrNameOrDef, 'continuousRange', null);
		return this;
	},
	/**
	 * Returns the range when displaying spectrum of a variable.
	 * @param {Variant} varNameOrIndexOrDef
	 * @param {Bool} autoCalc If true, when explicit display range is not set, the number range of variable will be calculated and returned.
	 * @returns {Hash} Hash of {fromValue, toValue}
	 */
	getVarDisplayRange: function(varIndexOrNameOrDef, autoCalc)
	{
		//var varDef = this.getVar
		var info = this.getLocalVarInfo(varIndexOrNameOrDef);
		var result = info.displayRange; // this.getLocalVarInfoValue(varIndexOrNameOrDef, 'displayRange');
		if (!result)  // check the var definition
		{
			var varDef = info.varDef;
			result = varDef.getInfoValue('displayRange');
		}
		if (!result && autoCalc)
			result = this.calcDataRange(varIndexOrNameOrDef)[info.varDef.getSymbol()];
		return result;
	},
	/**
	 * Set the range when displaying spectrum of a variable.
	 * @param {Variant} varNameOrIndexOrDef
	 * @param {Number} fromValue
	 * @param {Number} toValue
	 */
	setVarDisplayRange: function(varIndexOrNameOrDef, fromValue, toValue)
	{
		this.setLocalVarInfoValue(varIndexOrNameOrDef, 'displayRange', {'fromValue': fromValue, 'toValue': toValue});
		return this;
	},
	/**
	 * Remove the display range information of a variable.
	 * @param {Variant} varIndexOrNameOrDef
	 */
	clearVarDisplayRange: function(varIndexOrNameOrDef)
	{
		this.setLocalVarInfoValue(varIndexOrNameOrDef, 'displayRange',null);
		return this;
	},
	/**
	 * Returns display range of variables.
	 * @param {Array} targetVariables Array of variable definition or symbol.
	 *   If not set, all variables will be considered.
	 * @param {Bool} autoCalc If true, when explicit display range is not set, the number range of variable will be calculated and returned.
	 * @returns {Hash}
	 */
	getDisplayRangeOfVars: function(targetVariables, autoCalc)
	{
		var result = {};
		if (!targetVariables)
			targetVariables = this.getLocalVarSymbols();
		for (var i = 0, l = targetVariables.length; i < l; ++i)
		{
			var symbol = this._varToVarSymbol(targetVariables[i]);
			result[symbol] = this.getVarDisplayRange(targetVariables[i], autoCalc);
		}
		return result;
	},

	/** @private */
	_varToVarSymbol: function(targetVar)
	{
		var info = this.getLocalVarInfo(targetVar);
		if (info)
			return info.varDef.getSymbol();
		else
			return null;
	},
	/** @private */
	_varToVarSymbols: function(targetVariables)
	{
		var targetVarSymbols = [];
		var vars = targetVariables? AU.toArray(targetVariables): null;
		if (!vars)
			targetVarSymbols = this.getLocalVarSymbols();
		else
		{
			for (var i = 0, l = vars.length; i < l; ++i)
			{
				targetVarSymbols.push(this._varToVarSymbol(vars[i]))
			}
		}
		return targetVarSymbols;
	},
	/** @private */
	_getDefaultPeakRoot: function()
	{
		var result = {};
		var varInfos = this.getLocalVarInfos();
		for (var i = 0, l = varInfos.length; i < l; ++i)
		{
			var varDef = varInfos[i].varDef;
			if (varDef.getDependency() !== Kekule.VarDependency.INDEPENDENT)
			{
				result[varDef.getSymbol()] = 0;
			}
		}
		return result;
	},
	/**
	 * Iterate all data items and calculate the min/max value of each variable.
	 * @param {Array} targetVariables Array of variable definition or symbol.
	 *   If not set, all variables will be calculated.
	 * @returns {Hash}
	 */
	calcDataRange: function(targetVariables)
	{
		// since calculation of data range is a time-consuming job, here we cache the result
		var targetVarSymbols = this._varToVarSymbols(targetVariables);

		var notNum = function (v) {
			return !Kekule.NumUtils.isNormalNumber(v);
		};

		var ranges = {};
		var rangeCache = this._cache.ranges;
		if (!rangeCache)
		{
			rangeCache = {};
			this._cache.ranges = rangeCache;
		}
		var remainingVarSymbols = [];
		for (var i = 0, l = targetVarSymbols.length; i < l; ++i)
		{
			var symbol = targetVarSymbols[i];
			if (rangeCache[symbol])  // cached
			{
				// console.log('got range from cache', symbol);
				ranges[symbol] = Object.extend({}, rangeCache[symbol]);
			}
			else
				remainingVarSymbols.push(symbol);
		}

		if (remainingVarSymbols.length)
		{
			var self = this;
			this.forEach(function (dataValue, index) {
				for (var i = 0, l = remainingVarSymbols.length; i < l; ++i)
				{
					var symbol = remainingVarSymbols[i];
					if (notNum(dataValue[symbol]))
						continue;
					if (!ranges[symbol])
						ranges[symbol] = {};
					ranges[symbol].min = notNum(ranges[symbol].min) ? dataValue[symbol] : Math.min(ranges[symbol].min, dataValue[symbol]);
					ranges[symbol].max = notNum(ranges[symbol].max) ? dataValue[symbol] : Math.max(ranges[symbol].max, dataValue[symbol]);
					// consider peak root value
					var peakRootValue = self.getPeakRootValueOf(dataValue);
					if (peakRootValue && !notNum(peakRootValue[symbol]))
					{
						ranges[symbol].min = notNum(ranges[symbol].min) ? peakRootValue[symbol] : Math.min(ranges[symbol].min, peakRootValue[symbol]);
						ranges[symbol].max = notNum(ranges[symbol].max) ? peakRootValue[symbol] : Math.max(ranges[symbol].max, peakRootValue[symbol]);
					}
				}
			});

			// cache the range values
			for (var i = 0, l = remainingVarSymbols.length; i < l; ++i)
			{
				var symbol = remainingVarSymbols[i];
				rangeCache[symbol] = Object.extend({}, ranges[symbol]);
			}
		}

		/*
		if (this.getMode() === Kekule.Spectroscopy.DataMode.PEAK)  // consider the peak root
		{
			var peakRoot = this.getDefPeakRoot() || this._getDefaultPeakRoot();
			for (var i = 0, l = targetVarSymbols.length; i < l; ++i)
			{
				var symbol = targetVarSymbols[i];
				var rootValue = peakRoot[symbol];
				if (!notNum(rootValue))
				{
					ranges[symbol].min = Math.min(ranges[symbol].min, rootValue);
					ranges[symbol].max = Math.max(ranges[symbol].max, rootValue);
				}
			}
		}
		*/
		//console.log(this.getMode(), peakRoot, ranges);

		return ranges;
	},

	/**
	 * Iterate all data items and calculate the average value of each variable.
	 * @param {Array} targetVariables Array of variable definition or symbol.
	 *   If not set, all variables will be calculated.
	 * @returns {Hash}
	 */
	calcDataAverage: function(targetVariables)
	{
		var targetVarSymbols = this._varToVarSymbols(targetVariables);
		var averages = {};
		var averageCache = this._cache.averages;

		var notNum = function (v) {
			return !Kekule.NumUtils.isNormalNumber(v);
		};

		if (!averageCache)
		{
			averageCache = {};
			this._cache.averages = averageCache;
		}
		var remainingVarSymbols = [];
		for (var i = 0, l = targetVarSymbols.length; i < l; ++i)
		{
			var symbol = targetVarSymbols[i];
			if (!notNum(averageCache[symbol]))  // cached
			{
				averages[symbol] = averageCache[symbol];
			}
			else
				remainingVarSymbols.push(symbol);
		}

		if (remainingVarSymbols.length)
		{
			var sums = {};
			var counts = {};
			for (var i = 0, l = remainingVarSymbols.length; i < l; ++i)
			{
				sums[remainingVarSymbols[i]] = 0;
				counts[remainingVarSymbols[i]] = 0;
			}
			this.forEach(function (dataValue, index) {
				for (var i = 0, l = remainingVarSymbols.length; i < l; ++i)
				{
					var symbol = remainingVarSymbols[i];
					var value = dataValue[symbol];
					if (notNum(value))
						continue;
					sums[symbol] += value;
					++counts[symbol];
				}
			});

			// cache the average values
			for (var i = 0, l = remainingVarSymbols.length; i < l; ++i)
			{
				var symbol = remainingVarSymbols[i];
				averages[symbol] = sums[symbol] / counts[symbol];
				averageCache[symbol] = averages[symbol];
			}
		}

		return averages;
	},

	/**
	 * Returns the symbols of continuous variable.
	 * @returns {Array}
	 */
	getContinuousVarSymbols: function()
	{
		var result = [];
		var varInfos = this.getLocalVarInfos(varIndexOrNameOrDef);
		for (var i = 0, l = varInfos.length; i < l; ++i)
		{
			if (this.getContinuousVarRange(i))
				result.push(varInfos[i].varDef.getSymbol());
		}
		return result;
	},

	/** @private */
	_itemHashToArray: function(hashValue)
	{
		if (!hashValue)
			return null;
		var result = [];
		var symbols = this.getLocalVarSymbols();
		for (var i = 0, l = symbols.length; i < l; ++i)
		{
			result.push(hashValue[symbols[i]]);
		}
		return result;
	},
	/** @private */
	_itemArrayToHash: function(arrayValue)
	{
		if (!arrayValue)
			return null;
		var result = {};
		var symbols = this.getLocalVarSymbols();
		for (var i = 0, l = Math.min(symbols.length, arrayValue.length); i < l; ++i)
		{
			result[symbols[i]] = arrayValue[i];
		}
		return result;
	},

	/**
	 * Returns whether data in this section has been sorted.
	 * @returns {Bool}
	 */
	isDataSorted: function()
	{
		return this._sorted || this.getDataCount() <= 1;
	},
	/**
	 * Manually set the sorted state of data.
	 * @param {Bool} value
	 */
	setDataSorted: function(value)
	{
		this._sorted = !!value;
		return this;
	},
	/**
	 * Sort all data items.
	 * @param {Func} func Optional, func(hash1, hash2). If not set, data items will be sorted by default method.
	 */
	sort: function(func)
	{
		if (this.isDataSorted())
			return;
		var self = this;
		var sortFunc = func?
			function(a1, a2) { return func(self._itemArrayToHash(a1), self._itemArrayToHash(a2)); }:
			function(a1, a2) { return AU.compare(a1, a2); }
		this.getDataItems().sort(sortFunc);
		this.setDataSorted(true);
		return this;
	},

	/**
	 * Returns the count of data items.
	 * @returns {Int}
	 */
	getDataCount: function()
	{
		return this.getDataItems().length;
	},

	/** @private */
	clearCache: function()
	{
		this._cache = {};
	},
	/**
	 * Notify the data of this section has been changed.
	 * @private
	 */
	notifyDataChange: function()
	{
		var items = this.getDataItems();
		this.setDataSorted(false);
		this.clearCache();
		this.notifyPropSet('dataItems', items);
		this.invokeEvent('dataChange', {'data': items})
	},
	/**
	 * Clear all data items.
	 */
	clear: function()
	{
		this.setDataItems([]);
		this.notifyDataChange();
		this.setDataSorted(true);  // empty data are always sorted
	},
	/**
	 * Add new data item. The item is can be a hash or an array.
	 * If it is a hash, the hash fields must matches {@link Kekule.Spectroscopy.SpectrumData.independentVars} and {@link Kekule.Spectroscopy.SpectrumData.dependentVars}.
	 * If it is an array, the values in array will automatically mapped to independent and dependent vars.
	 * @param {Variant} item
	 */
	appendData: function(item)
	{
		var d;
		if (!DataType.isArrayValue(item))  // is hash value, convert it to array first
			d = this._itemHashToArray(item);
		else
			d = item;
		if (d)
		{
			var items = this.getDataItems();
			items.push(d);
			this.notifyDataChange();
			return d;
		}
	},
	/**
	 * Remove a data item.
	 * @param {Array} item
	 */
	removeData: function(item)
	{
		var items = this.getDataItems();
		var index = items.indexOf(item);
		return this.removeDataItemAt(index);
	},
	/** @private */
	removeDataAt: function(index)
	{
		var result = this.getDataItems().splice(index, 1);
		this.notifyDataChange();
		return result;
	},
	/** @private */
	getRawValueAt: function(index)
	{
		var result = AU.clone(this.getDataItems()[index]);
		if (this.getMode() === Kekule.Spectroscopy.DataMode.CONTINUOUS)
		{
			var dataIntervalCount = this.getDataCount() - 1;
			// check if there are omitted values
			for (var i = 0, l = result.length; i < l; ++i)
			{
				var v = result[i];
				if (DataType.isUndefinedValue(v))  // maybe omitted? check if it is a continous variable
				{
					var range = this.getContinuousVarRange(i);
					if (range)
					{
						v = (dataIntervalCount > 1)? ((index / dataIntervalCount) * (range.toValue - range.fromValue) + range.fromValue): range.fromValue;
						//console.log('adjusted v', v, range);
					}
				}
				result[i] = v;
			}
		}
		return result;
	},
	/** @private */
	getHashValueAt: function(index)
	{
		return this._itemArrayToHash(this.getRawValueAt(index));
	},
	/** @private */
	getValueAt: function(index)
	{
		return this.getHashValueAt(index);
	},

	/**
	 * Returns the peak root value of data item value.
	 * @param {Hash} value
	 * @returns {Hash}
	 */
	getPeakRootValueOf: function(value)
	{
		if (this.getMode() !== Kekule.Spectroscopy.DataMode.PEAK)
			return null;
		else
		{
			var pr = this.getDefPeakRoot() || this._getDefaultPeakRoot();
			return Object.extend(Object.extend({}, value), pr);
		}
	},
	/**
	 * Returns the peak root value of data item at index.
	 * @param {Int} index
	 * @returns {Hash}
	 */
	getPeakRootValueAt: function(index)
	{
		return this.getPeakRootValueOf(this.getValueAt(index));
	},

	/**
	 * Calculate values of dependant variable values from independent variable values.
	 * @param {Hash} independentValues
	 * @param {Hash} extraOptions
	 * @returns {Hash}
	 */
	getDependentValues: function(independentValues, extraOptions)
	{
		return this.doGetDependentValues(independantValues, extraOptions);
	},
	/**
	 * Do actual work of {@link Kekule.Spectroscopy.SpectrumData.getDependentValues}.
	 * Descendants should override this method.
	 * @param {Hash} independentValues
	 * @param {Hash} extraOptions
	 * @returns {Hash}
	 * @private
	 */
	doGetDependentValues: function(independentValues, extraOptions)
	{
		return {};
	},
	/**
	 * Returns an iterator to iterate all data in this object.
	 * If iterator is not available, null should be returned.
	 * Otherwise, the return value should be an object with method next(): {done, value}.
	 * @returns {Object}
	 */
	getIterator: function()
	{
		return this.doGetIterator();
	},
	/**
	 * Do actual work of {@link Kekule.Spectroscopy.SpectrumData.getIterator}.
	 * Desendants may override this method.
	 * @returns {Object}
	 * @private
	 */
	doGetIterator: function()
	{
		var dataItems = this.getDataItems();
		var self = this;
		var result = {
			index: 0,
			next: function()
			{
				if (this.index >= dataItems.length)
					return {'done': true};
				else
				{
					var ret = {'done': false, 'value': /*self._itemArrayToHash(dataItems[this.index])*/self.getHashValueAt(this.index)};
					++this.index;
					return ret;
				}
			}
		};
		return result;
	},

	/**
	 * Call function to each data item.
	 * @param {Func} func With params: (hashValue [, index]).
	 */
	forEach: function(func, thisArg)
	{
		var iterator = this.getIterator();
		if (iterator)
		{
			//var dataItems = this.getDataItems();
			var index = 0;
			var nextItem = iterator.next();
			while (!nextItem.done)
			{
				func.apply(thisArg, [nextItem.value, index]);
				++index;
				nextItem = iterator.next();
			}
		}
		return this;
	}
});

/**
 * The base spectrum data class.
 * The concrete data can be stored in different forms, implemented in different descendant classes.
 * @class
 * @augments ObjectEx
 *
 * @param {String} id
 * @param {Array} variables Array of variables of data, each item is {@link Kekule.VarDefinition}.
 *
 * @property {Array} variables Array of variables of data, each item is {@link Kekule.VarDefinition}.
 * @property {Kekule.ChemObjList} sections Child data sections.
 * @property {Kekule.Spectroscopy.SpectrumData} activeSection Active data section to read/write data.
 * @property {Bool} autoCreateSection Whether create a initial data section automatically when inserting data.
 */
Kekule.Spectroscopy.SpectrumData = Class.create(ObjectEx,
/** @lends Kekule.Spectroscopy.SpectrumData# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Spectroscopy.SpectrumData',
	/** @private */
	initialize: function(id, variables, parent)
	{
		//this.setPropStoreFieldValue('dataItems', []);
		this.tryApplySuper('initialize', [id]);
		if (variables)
			this.setPropStoreFieldValue('variables', variables? AU.clone(variables): []);
		var sections = new Kekule.ChemObjList(null, Kekule.Spectroscopy.SpectrumDataSection, true);
		this.setPropStoreFieldValue('sections', sections);
		this.setPropStoreFieldValue('parent', parent);
		sections.setParent(parent || this);
		//this.createSection(this.getVariables());  // create a default section
	},
	doFinalize: function()
	{
		//this.clear();
		this.getSections().finalize();
		var variables = this.getVariables();
		for (var i = 0, l = variables.length; i < l; ++i)
		{
			variables[i].finalize();
		}
		this.setPropStoreFieldValue('variables', null);
		this.tryApplySuper('doFinalize');
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('parent', {'dataType': 'Kekule.Spectroscopy.Spectrum', 'setter': null, 'serializable': false});
		this.defineProp('sections', {'dataType': 'Kekule.ChemObjList', 'setter': null});
		this.defineProp('autoCreateSection', {'dataType': DataType.BOOL});
		this.defineProp('activeSectionIndex', {'dataType': DataType.INT,
			'getter': function()
			{
				if (this.getSectionCount() <= 0)
					return -1;
				else if (this.getSectionCount() === 1)  // only one section, it should be activated by default
					return 0;
				else
					return this.getPropStoreFieldValue('activeSectionIndex');
			},
			'setter': function(value)
			{
			  if (value >= 0 && value <= this.getSectionCount())
					this.setPropStoreFieldValue('activeSectionIndex', value);
			}
		});
		this.defineProp('activeSection', {'dataType': 'Kekule.Spectroscopy.SpectrumDataSection', 'serializable': false,
			'getter': function()
			{
				var result = this.getSectionAt(this.getActiveSectionIndex() || 0);
				if (!result && this.getSectionCount() <= 0 && this.getAutoCreateSection())
				{
					result = this.createSection(this.getVariables());
					//console.log('auto create');
				}
				return result;
			},
			'setter': function(value)
			{
				this.setActiveSectionIndex(this.indexOfSection(value));
			}
		});
		/*
		this.defineProp('variables', {'dataType': DataType.ARRAY, 'setter': null, 'serializable': false,
			'getter': function()
			{
				var result = [];
				for (var i = 0, l = this.getSectionCount(); i < l; ++i)
				{
					var vars = this.getSectionAt(i).getVariables();
					AU.pushUnique(result, vars);
				}
				return result;
			}
		});
		*/
		this.defineProp('variables', {'dataType': DataType.ARRAY/*, 'setter': null*/});
		// private, stores the data items, each item is a hash, e.g. {x: 1, y: 10, w: 2}
		//this.defineProp('dataItems', {'dataType': DataType.ARRAY, 'setter': null, 'scope': PS.PRIVATE});
		// private, cache all variable names
		this.defineProp('varSymbols', {'dataType': DataType.ARRAY, 'setter': null, 'scope': PS.PRIVATE,
			'getter': function() {
				var result = [];
				var list = this.getVariables() || [];
				for (var j = 0, jj = list.length; j < jj; ++j)
				{
					var varDef = list[j];
					result.push(varDef.getSymbol());
				}
				return result;
			}});
		this.defineProp('mode', {'dataType': DataType.INT, 'enumSource': Kekule.Spectroscopy.DataMode});
	},
	/** @ignore */
	initPropValues: function()
	{
		this.tryApplySuper('initPropValues');
		this.setAutoCreateSection(true);
		this.setMode(Kekule.Spectroscopy.DataMode.CONTINUOUS);
	},

	/** @private */
	getHigherLevelObj: function()
	{
		return this.getParent();
	},
	/** @ignore */
	getChildHolder: function()
	{
		return this.getSections();
	},

	/**
	 * Create and append a new {@link Kekule.Spectroscopy.SpectrumDataSection}.
	 * @param {Array} variables Array of local variable symbol or definition used by secion.
	 * @param {Int} mode
	 * @returns {Kekule.Spectroscopy.SpectrumDataSection}
	 */
	createSection: function(variables, mode)
	{
		var result = new Kekule.Spectroscopy.SpectrumDataSection(null, this, variables);
		//result.setVariables(variables);
		result.setMode(mode || this.getMode());
		this.getSections().appendChild(result);
		return result;
	},
	/**
	 * Remove all data sections.
	 */
	clearSection: function()
	{
		var sections = this.getChildren();
		for (var i = 0, l = sections.length; i < l; ++i)
		{
			sections[i].clear();
			sections[i].setParent(null);
			sections[i].finalize();
		}
		this.getSections().clear();
	},
	/**
	 * Get count of child data sections.
	 * @returns {Int}
	 */
	getSectionCount: function()
	{
		return this.getSections().getChildCount();
	},
	/**
	 * Get child data sectionb at index.
	 * @param {Int} index
	 * @returns {Kekule.Spectroscopy.SpectrumDataSection}
	 */
	getSectionAt: function(index)
	{
		return this.getSections().getItemAt(index);
	},
	/**
	 * Get the index of child section in children list.
	 * @param {Kekule.Spectroscopy.SpectrumDataSection} section
	 * @returns {Int} Index of section or -1 when not found.
	 */
	indexOfSection: function(section)
	{
		return this.getSections().indexOfItem(section);
	},
	/**
	 * Check if section is in this spectrum data.
	 * @param {Kekule.Spectroscopy.SpectrumDataSection} section
	 * @returns {Bool}
	 */
	hasSection: function(section)
	{
		return this.indexOfSection(section) >= 0;
	},
	/**
	 * Remove a data section at index.
	 * @param {Int} index
	 * @returns {Kekule.Spectroscopy.SpectrumDataSection} Child section removed.
	 */
	removeSectionAt: function(index)
	{
		return this.getSections().removeItemAt(index);
	},
	/**
	 * Remove a child data section.
	 * @param {Kekule.Spectroscopy.SpectrumDataSection} section
	 * @returns {Kekule.Spectroscopy.SpectrumDataSection} Section object removed.
	 */
	removeSection: function(section)
	{
		return this.getSections().removeItem(section);
	},
	/**
	 * Insert a new section to index.
	 * @param {Kekule.Spectroscopy.SpectrumDataSection} section
	 * @param {Int} index
	 * @return {Int} Index of section after insertion.
	 */
	insertSectionAt: function(section, index)
	{
		return this.getSections().insertItemAt(section, index);
	},
	/**
	 * Insert a data section before refSection in data section list.
	 * @param {Kekule.Spectroscopy.SpectrumDataSection} obj
	 * @param {Kekule.Spectroscopy.SpectrumDataSection} refChildr
	 * @return {Int} Index of section after insertion.
	 */
	insertSectionBefore: function(section, refSection)
	{
		return this.getSections().insertItemBefore(section, refSection);
	},
	/**
	 * Add new data section to the tail of section list.
	 * @param {Kekule.Spectroscopy.SpectrumDataSection} section
	 * @return {Int} Index of obj after appending.
	 */
	appendSection: function(section)
	{
		return this.getSections().appendChild(section);
	},
	/**
	 * Returns whether multiple sections exists in this spectrum data.
	 * @returns {Bool}
	 */
	hasMultipleSections: function()
	{
		return this.getSections().getChildCount() > 1;
	},

	/**
	 * Iterate all data items in a section and calculate the min/max value of each variable.
	 * @param {Kekule.Spectroscopy.SpectrumDataSection} section
	 * @param {Array} targetVariables Array of variable definition or symbol.
	 *   If not set, all variables will be calculated.
	 * @returns {Hash}
	 */
	calcDataRangeOfSection: function(section, targetVariables)
	{
		return section.calcDataRange(targetVariables);
	},
	/**
	 * Iterate all data items in a set of sections and calculate the min/max value of each variable.
	 * @param {Array} sections
	 * @param {Array} targetVariables Array of variable definition or symbol.
	 *   If not set, all variables will be calculated.
	 * @returns {Hash}
	 */
	calcDataRangeOfSections: function(sections, targetVariables)
	{
		var result = {};
		for (var i = 0, l = sections.length; i < l; ++i)
		{
			var range = sections[i].calcDataRange(targetVariables);
			result = Kekule.Spectroscopy.Utils.mergeDataRange(result, range);
		}
		return result;
	},
	/**
	 * Returns the display range of a section.
	 * @param {Kekule.Spectroscopy.SpectrumDataSection} section
	 * @param {Array} targetVariables Array of variable definition or symbol.
	 *   If not set, all variables will be calculated.
	 * @param {Bool} autoCalc If true, when explicit display range is not set, the number range of variable will be calculated and returned.
	 * @returns {Hash}
	 */
	getDisplayRangeOfSection: function(section, targetVariables, autoCalc)
	{
		return section.getDisplayRangeOfVars(targetVariables, autoCalc);
	},
	/**
	 * Returns the display range of a set of sections.
	 * @param {Array} sections
	 * @param {Array} targetVariables Array of variable definition or symbol.
	 *   If not set, all variables will be calculated.
	 * @param {Bool} autoCalc If true, when explicit display range is not set, the number range of variable will be calculated and returned.
	 * @returns {Hash}
	 */
	getDisplayRangeOfSections: function(sections, targetVariables, autoCalc)
	{
		var result = {};
		for (var i = 0, l = sections.length; i < l; ++i)
		{
			var range = sections[i].getDisplayRangeOfVars(targetVariables, autoCalc);
			result = Kekule.Spectroscopy.Utils.mergeDataRange(result, range);
		}
		return result;
	},

	/**
	 * Returns count of all variables.
	 * @returns {Int}
	 */
	getVariableCount: function()
	{
		return (this.getVariables() || []).length;
	},
	/**
	 * Returns the variable definition by a index or variable name.
	 * @param {Variant} varIndexOrNameOrDef
	 * @returns {Kekule.VarDefinition}
	 */
	getVariable: function(varIndexOrNameOrDef)
	{
		var varDef = (varIndexOrNameOrDef instanceof Kekule.VarDefinition)? varIndexOrNameOrDef:
			(typeof(varIndexOrNameOrDef) === 'number')? this.getVariables()[varIndexOrNameOrDef]:   // index
				this.getVariables()[this.getVarSymbols().indexOf(varIndexOrNameOrDef)];   // name
		return varDef;
	},
	/**
	 * Returns the index of a variable definition.
	 * @param {Kekule.VarDefinition} varDef
	 * @returns {Int}
	 */
	indexOfVariable: function(varDef)
	{
		return this.getVariables().indexOf(varDef);
	},
	/**
	 * Insert a new variable definition at a specified position.
	 * @param {Kekule.VarDefinition} varDef
	 * @param {Int} index
	 */
	insertVariableAt: function(varDef, index)
	{
		if (index >= 0)
			this.getVariables().splice(index, 0, varDef);
		else
			this.getVariables().push(varDef);
		return this;
	},
	/**
	 * Insert a new variable definition before ref.
	 * @param {Kekule.VarDefinition} varDef
	 * @param {Kekule.VarDefinition} ref
	 */
	insertVariableBefore: function(varDef, ref)
	{
		var index = ref? this.indexOfVarDefinition(ref): -1;
		return this.insertVarDefinitionAt(varDef, index);
	},
	/**
	 * Append a new variable definition.
	 * @param {Kekule.VarDefinition} varDef
	 */
	appendVariable: function(varDef)
	{
		return this.insertVarDefinitionAt(varDef, -1);
	},
	/**
	 * Remove a variable definition at index.
	 * @param {Int} index
	 */
	removeVariableAt: function(index)
	{
		this.getVariables().splice(index, 1);
		return this;
	},
	/**
	 * Remove a variable definition.
	 * @param {Kekule.VarDefinition} varDef
	 */
	removeVariable: function(varDef)
	{
		var index = this.indexOfVariable(varDef);
		if (index >= 0)
			this.removeVariableAt(index);
		return this;
	},
	/**
	 * Returns the first/last value of a continuous variable.
	 * @param {Variant} varNameOrIndexOrDef
	 * @returns {Hash} Hash of {firstValue, lastValue}
	 */
	getContinuousVarRange: function(varIndexOrNameOrDef)
	{
		var varDef = this.getVariable(varIndexOrNameOrDef);
		var info = varDef && varDef.getInfo();
		if (info)
		{
			if (info.continuous)
			{
				//var count = this.getDateItemCount();
				return {'fromValue': info.fromValue, 'toValue': info.toValue /*, 'interval': (info.lastValue - info.firstValue) / count */ };
			}
		}
		return null;
	},
	/**
	 * Set the first/last value of a variable and mark it as a continuous one.
	 * @param {Variant} varNameOrIndexOrDef
	 * @param {Number} fromValue
	 * @param {Number} toValue
	 */
	setContinuousVarRange: function(varIndexOrNameOrDef, fromValue, toValue)
	{
		var varDef = this.getVariable(varIndexOrNameOrDef);
		var info = varDef && varDef.getInfo(true);
		info.continuous = true;
		info.fromValue = fromValue;
		info.toValue = toValue;
		return this;
	},
	/**
	 * Remove the continuous information of a variable.
	 * @param {Variant} varIndexOrNameOrDef
	 */
	clearContinuousVarRange: function(varIndexOrNameOrDef)
	{
		var varDef = this.getVariable(varIndexOrNameOrDef);
		var info = varDef.getInfo();
		if (info && info.continuous)
			info.continuous = false;
		return this;
	},

	/**
	 * Iterate all child sections and execute function.
	 * @param {Function} func Function with param (section, index).
	 */
	iterateSections: function(func)
	{
		for (var i = 0, l = this.getSectionCount(); i < l; ++i)
		{
			func(this.getSectionAt(i), i);
		}
	},
	/**
	 * Sort all data items.
	 * @param {Func} func Optional, func(hash1, hash2). If not set, data items will be sorted by default method.
	 */
	sort: function(func)
	{
		this.iterateSections(function(c){
			c.sort(func);
		});
	},

	/**
	 * Returns the count of data items.
	 * @returns {Int}
	 */
	getDataCount: function()
	{
		var result = 0;
		this.iterateSections(function(c){
			result += c.getDataCount();
		});
		return result;
	},
	/**
	 * Clear all data items in all data sections.
	 */
	clearData: function()
	{
		this.iterateSections(function(c){
			c.clear();
		});
	},
	/**
	 * Add new data item to active data section. The item is can be a hash or an array.
	 * If it is a hash, the hash fields must matches {@link Kekule.Spectroscopy.SpectrumData.independentVars} and {@link Kekule.Spectroscopy.SpectrumData.dependentVars}.
	 * If it is an array, the values in array will automatically mapped to independent and dependent vars.
	 * @param {Variant} item
	 */
	appendData: function(item)
	{
		return this.getActiveSection().appendData(item);
	},
	/**
	 * Remove a data item from active data section.
	 * @param {Array} item
	 */
	removeData: function(item)
	{
		return this.getActiveSection().removeData(item);
	},
	/** @private */
	removeDataAt: function(index)
	{
		return this.getActiveSection().removeDataAt(index);
	},
	/** @private */
	getRawValueAt: function(index)
	{
		return this.getActiveSection().getRawValueAt(index);
	},
	/** @private */
	getHashValueAt: function(index)
	{
		return this.getActiveSection().getHashValueAt(index);
	},
	/** @private */
	getValueAt: function(index)
	{
		return this.getHashValueAt(index);
	},

	/**
	 * Calculate values of dependant variable values from independent variable values.
	 * @param {Hash} independentValues
	 * @param {Hash} extraOptions
	 * @returns {Hash}
	 */
	getDependentValues: function(independentValues, extraOptions)
	{
		return this.doGetDependentValues(independantValues, extraOptions);
	},
	/**
	 * Do actual work of {@link Kekule.Spectroscopy.SpectrumData.getDependentValues}.
	 * Descendants should override this method.
	 * @param {Hash} independentValues
	 * @param {Hash} extraOptions
	 * @returns {Hash}
	 * @private
	 */
	doGetDependentValues: function(independentValues, extraOptions)
	{
		// TODO: unfinished
		return {};
	},
	/**
	 * Returns an iterator to iterate all data in this object.
	 * If iterator is not available, null should be returned.
	 * Otherwise, the return value should be an object with method next(): {done, value}.
	 * @returns {Object}
	 */
	getIterator: function()
	{
		return this.doGetIterator();
	},
	/**
	 * Do actual work of {@link Kekule.Spectroscopy.SpectrumData.getIterator}.
	 * Desendants may override this method.
	 * @returns {Object}
	 * @private
	 */
	doGetIterator: function()
	{
		//var dataItems = this.getDataItems();
		var sections = this.getSections().getItems();
		var self = this;
		var result = {
			sectionIndex: 0,
			index: 0,
			next: function()
			{
				var self = this;
				var outOfRange = function()
				{
					return (self.sectionIndex >= sections.length || (self.sectionIndex === sections.length - 1 && self.index >= sections[sections.length - 1].getDataCount()));
				}
				if (outOfRange())
					return {'done': true};
				else
				{
					if (this.index < sections[this.sectionIndex].getDataCount())
					{
						var ret = {'done': false, 'value': sections[this.sectionIndex].getValueAt(this.index)};
						++this.index;
					}
					else
					{
						do
						{
							++this.sectionIndex;
							this.index = 0;
						}
						while(this.index >= sections[this.sectionIndex].getDataCount() || self.sectionIndex >= sections.length);
						if (outOfRange())
							return {'done': true};
						else
							return {'done': false, 'value': sections[this.sectionIndex].getValueAt(this.index)};
					}
					return ret;
				}
			}
		};
		return result;
	},

	/**
	 * Call function to each data item.
	 * @param {Func} func With params: (hashValue [, index]).
	 */
	forEach: function(func, thisArg)
	{
		var iterator = this.getIterator();
		if (iterator)
		{
			var index = 0;
			var nextItem = iterator.next();
			while (!nextItem.done)
			{
				func.apply(thisArg, [nextItem.value, index]);
				++index;
				nextItem = iterator.next();
			}
		}
		return this;
	}
});

/**
 * Enumeration of spectrum types.
 * @enum
 */
Kekule.Spectroscopy.SpectrumType = {
	NMR: 'NMR',
	IR: 'IR',
	MS: 'MS',
	UV: 'UV',
	IMS: 'IMS',   // ION MOBILITY SPECTRUM
	RAMAN: 'Raman',
	GENERAL: 'general'   // unknown type
};

/**
 * The base spectrum class. Concrete spectrum classes should be inherited from this one.
 * @class
 * @augments Kekule.ChemObject
 *
 * @property {String} spectrumType Type of spectrum, value from {@link Kekule.Spectroscopy.SpectrumType}.
 * @property {Kekule.Spectroscopy.SpectrumData} data Spectrum data.
 */
Kekule.Spectroscopy.Spectrum = Class.create(Kekule.ChemObject,
/** @lends Kekule.Spectroscopy.Spectrum# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Spectroscopy.Spectrum',
	/** @private */
	initialize: function(id)
	{
		this.setPropStoreFieldValue('data', new Kekule.Spectroscopy.SpectrumData(null, null, this));
		this.tryApplySuper('initialize', [id]);
		this._initDelegatedMethods();
	},
	/** @ignore */
	doFinalize: function()
	{
		var d = this.getData();
		if (d)
			d.finalize();
		this.tryApplySuper('doFinalize');
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('spectrumType', {'dataType': DataType.STRING});
		this.defineProp('data', {'dataType': 'Kekule.Spectroscopy.SpectrumData', 'setter': null});
		//this.defineProp('title', {'dataType': DataType.STRING});
		this._defineInfoProperty('title');
		//this.defineProp('molecule', {'dataType': 'Kekule.Molecule'});
		this._defineDataDelegatedProperty('variables');
		this._defineDataDelegatedProperty('dataSections', 'sections');
		this._defineDataDelegatedProperty('activeDataSectionIndex', 'activeSectionIndex');
		this._defineDataDelegatedProperty('activeDataSection', 'activeSection');
	},
	/** @private */
	_initDelegatedMethods: function()
	{
		this._defineDataDelegatedMethod('createDataSection', 'createSection');
		this._defineDataDelegatedMethod('clearDataSection', 'clearSection');
		this._defineDataDelegatedMethod('getDataSectionCount', 'getSectionCount');
		this._defineDataDelegatedMethod('getDataSectionAt', 'getSectionAt');
		this._defineDataDelegatedMethod('indexOfDataSection', 'indexOfSection');
		this._defineDataDelegatedMethod('hasDataSection', 'hasSection');
		this._defineDataDelegatedMethod('removeDataSectionAt', 'removeSectionAt');
		this._defineDataDelegatedMethod('removeDataSection', 'removeSection');
		this._defineDataDelegatedMethod('insertDataSectionAt', 'insertSectionAt');
		this._defineDataDelegatedMethod('insertDataSectionBefore', 'insertSectionBefore');
		this._defineDataDelegatedMethod('appendDataSection', 'appendSection');
		this._defineDataDelegatedMethod('iterateDataSection', 'iterateSection');
		this._defineDataDelegatedMethod('sortData', 'sort');
		this._defineDataDelegatedMethod('clearData');
		this._defineDataDelegatedMethod('getVariable');
		this._defineDataDelegatedMethod('indexOfVariable');
		this._defineDataDelegatedMethod('insertVariableAt');
		this._defineDataDelegatedMethod('insertVariableBefore');
		this._defineDataDelegatedMethod('appendVariable');
		this._defineDataDelegatedMethod('removeVariableAt');
		this._defineDataDelegatedMethod('removeVariable');
		this._defineDataDelegatedMethod('getContinuousVarRange');
		this._defineDataDelegatedMethod('setContinuousVarRange');
		this._defineDataDelegatedMethod('clearContinuousVarRange');
	},
	/**
	 * Defines property which storing value in {@link Kekule.ChemObject.info}.
	 * @param {String} propName
	 * @param {String} infoFieldName
	 * @param {Hash} options
	 * @private
	 */
	_defineInfoProperty: function(propName, infoFieldName, options)
	{
		var defs;
		(function() {
			defs = Object.extend({
				'getter': function () {
					return this.getInfoValue(infoFieldName || propName);
				},
				'setter': function(value) {
					this.setInfoValue(infoFieldName || propName, value);
				}
			}, options);
		})();
		return this.defineProp(propName, defs);
	},
	/**
	 * Defines property which reflecting the property values in {@link Kekule.Spectroscopy.Spectrum.data}.
	 * @param {String} propName
	 * @param {String} dataPropName
	 * @private
	 */
	_defineDataDelegatedProperty: function(propName, dataPropName)
	{
		if (!dataPropName)
			dataPropName = propName;
		var dataPropInfo = ClassEx.getPropInfo(Kekule.Spectroscopy.SpectrumData, dataPropName);
		var propOptions = Object.create(dataPropInfo);
		propOptions.getter = null;
		propOptions.setter = null;
		if (dataPropInfo.getter)
		{
			propOptions.getter = function()
			{
				return this.getData().getPropValue(dataPropName);
			};
		}
		if (dataPropInfo.setter)
		{
			propOptions.setter = function(value)
			{
				this.getData().setPropValue(dataPropName, value);
			}
		}
		return this.defineProp(propName, propOptions);
	},
	/**
	 * Defines method which directly calling the corresponding one in {@link Kekule.Spectroscopy.Spectrum.data}.
	 * @param {String} methodName
	 * @param {String} dataMethodName
	 * @private
	 */
	_defineDataDelegatedMethod: function(methodName, dataMethodName)
	{
		if (!dataMethodName)
			dataMethodName = methodName;
		var proto = ClassEx.getPrototype(this.getClass());
		proto[methodName] = function()
		{
			//console.log('call', methodName, arguments);
			this.getData()[dataMethodName].apply(this.getData(), arguments);
		}
	}

	/*
	 * Create the data object.
	 * @param variables
	 * @returns {Kekule.Spectroscopy.SpectrumData}
	 */
	/*
	createData: function(variables)
	{
		var result = new Kekule.Spectroscopy.SpectrumData(null, variables);
		this.setPropStoreFieldValue('data', result);
		return result;
	}
	*/
});

Kekule.ClassDefineUtils.addStandardCoordSupport(Kekule.Spectroscopy.Spectrum);
Kekule.ClassDefineUtils.addStandardSizeSupport(Kekule.Spectroscopy.Spectrum);


// register spectrum related units
(function(){
	var register = Kekule.Unit.register;
	// IR
	register('transmittance', 'transmittance', 'SpectrumIR', null);  // IT/I0
	register('reflectance', 'reflectance', 'SpectrumIR', null);  // IR/I0
	register('absorbance', 'absorbance', 'SpectrumIR', null);  // log10(IR/I0)
	register('Kubelka Munk', 'Kubelka_Munk', 'SpectrumIR', null);  // (1-R^2)/(2R)
	register('1/cm', 'wave_number', 'Frequency', null);
	// NMR
	register('ppm', 'nmr_ppm', 'Frequency', null);
	// MS
	register('counts', 'ms_counts', 'General', null);
	register('relative abundance', 'ms_relative_abundance', 'SpectrumMS', null);
	register('m/z', 'ms_mass_charge_ratio', 'SpectrumMS', null);
})();

})();