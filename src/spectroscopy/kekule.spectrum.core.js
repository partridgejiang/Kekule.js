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
 * Enumeration of data continuity of spectrum variable.
 * @enum
 */
Kekule.Spectroscopy.DataContinuity = {
	/** Value points are discrete, e.g. in MS peak table. */
	DISCRETE: 0,
	/** Value points are continuous, e.g. in IR data table. */
	CONTINUOUS: 1
};

Kekule.Spectroscopy.DataStorageType = {

};

/**
 * The base spectrum data class.
 * The concrete data can be stored in different forms, implemented in different descandant classes.
 * @class
 * @augments Kekule.ChemObject
 *
 * @param {String} id
 * @param {Array} variables Array of variables of data, each item is {@link Kekule.VarDefinition}.
 *
 * @property {Array} variables Array of variables of data, each item is {@link Kekule.VarDefinition}.
 */
Kekule.Spectroscopy.SpectrumData = Class.create(Kekule.ChemObject,
/** @lends Kekule.Spectroscopy.SpectrumData# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Spectroscopy.SpectrumData',
	/** @private */
	initialize: function(id, variables)
	{
		this.setPropStoreFieldValue('dataItems', []);
		this.tryApplySuper('initialize', [id]);
		if (variables)
		{
			this.setPropStoreFieldValue('variables', AU.clone(variables));
		}
	},
	doFinalize: function()
	{
		this.clear();
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
		this.defineProp('variables', {'dataType': DataType.ARRAY, 'setter': null});
		// private, stores the data items, each item is a hash, e.g. {x: 1, y: 10, w: 2}
		this.defineProp('dataItems', {'dataType': DataType.ARRAY, 'setter': null, 'scope': PS.PRIVATE});
		// private, cache all variable names
		this.defineProp('varSymbols', {'dataType': DataType.ARRAY, 'setter': null, 'scope': PS.PRIVATE,
			'getter': function() {
				var result = [];
				var list = this.getVariables();
				for (var j = 0, jj = list.length; j < jj; ++j)
				{
					var varDef = list[j];
					result.push(varDef.getName());
				}
				return result;
			}})
	},
	/** @private */
	_itemHashToArray: function(hashValue)
	{
		if (!hashValue)
			return null;
		var result = [];
		var varSymbols = this.getVarSymbols();
		for (var i = 0, l = varSymbols.length; i < l; ++i)
		{
			result.push(hashValue[varSymbols[i]]);
		}
		return result;
	},
	/** @private */
	_itemArrayToHash: function(arrayValue)
	{
		if (!arrayValue)
			return null;
		var result = {};
		var varSymbols = this.getVarSymbols();
		for (var i = 0, l = Math.min(varSymbols.length, arrayValue.length); i < l; ++i)
		{
			result[varSymbols[i]] = arrayValue[i];
		}
		return result;
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

	//appendVarDefinition: function()

	/**
	 * Sort all data items.
	 * @param {Func} func Optional, func(hash1, hash2). If not set, data items will be sorted by default method.
	 */
	sort: function(func)
	{
		var self = this;
		var sortFunc = func?
			function(a1, a2) { return func(self._itemArrayToHash(a1), self._itemArrayToHash(a2)); }:
			function(a1, a2) { return AU.compare(a1, a2); }
		this.getDataItems().sort(sortFunc);
	},

	/**
	 * Returns the count of data items.
	 * @returns {Int}
	 */
	getDataItemCount: function()
	{
		return this.getDataItems().length;
	},
	/**
	 * Clear all data items.
	 */
	clear: function()
	{
		this.setDataItems([]);
	},
	/**
	 * Add new data item. The item is can be a hash or an array.
	 * If it is a hash, the hash fields must matches {@link Kekule.Spectroscopy.SpectrumData.independentVars} and {@link Kekule.Spectroscopy.SpectrumData.dependentVars}.
	 * If it is an array, the values in array will automatically mapped to independent and dependent vars.
	 * @param {Variant} item
	 */
	append: function(item)
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
			return d;
		}
	},
	/**
	 * Remove a data item.
	 * @param {Array} item
	 */
	remove: function(item)
	{
		var items = this.getDataItems();
		var index = items.indexOf(item);
		return this.removeDataItemAt(index);
	},
	/** @private */
	removeDataItemAt: function(index)
	{
		return this.getDataItems().splice(index, 1);
	},
	/** @private */
	getRawValueAt: function(index)
	{
		return AU.clone(this.getDataItems()[index]);
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
					var ret = {'done': false, 'value': self._itemArrayToHash(dataItems[this.index])};
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
			var dataItems = this.getDataItems();
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
 * The discrete spectrum data (e.g. peak data).
 * @class
 * @augments Kekule.Spectroscopy.SpectrumData
 */
Kekule.Spectroscopy.DiscreteData = Class.create(Kekule.Spectroscopy.SpectrumData,
/** @lends Kekule.Spectroscopy.DiscreteData# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Spectroscopy.DiscreteData'
});

/**
 * The continuous spectrum data (e.g. in IR).
 * In this type of data, one or more variables are at equal intervals in all data items (e.g., the X++(Y..Y) data table in JCAMP-DX).
 * For example, in a spectrum consists of X/Y variables, when X is continuous, in each data item except the first and last ones (storing firstX/lastX values),
 * X values can be omitted with *undefined* and its actual value can be calculated from firstX/lastX.
 *
 * @class
 * @augments Kekule.Spectroscopy.SpectrumData
 *
 * @property {Array} continousVarDetails Each item is a hash of {name, first, last}.
 */
Kekule.Spectroscopy.ContinuousData = Class.create(Kekule.Spectroscopy.SpectrumData,
/** @lends Kekule.Spectroscopy.ContinuousData# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Spectroscopy.ContinuousData',
	/** @private */
	initialize: function(id, variables)
	{
		this.setPropStoreFieldValue('continousVarDetails', []);
		this.tryApplySuper('initialize', [id, variables]);
	},
	/** @private */
	initProperties: function()
	{
		//this.defineProp('continousVarDetails', {'dataType': DataType.Array, 'setter': null});
	},
	/** @ignore */
	doFinalize: function()
	{
		this.setPropStoreFieldValue('continousVarDetails', null);
		this.tryApplySuper('doFinalize');
	},

	/**
	 * Returns the first/last value of a continuous variable.
	 * @param {Variant} varNameOrIndexOrDef
	 * @returns {Hash} Hash of {firstValue, lastValue}
	 */
	getVarRange: function(varIndexOrNameOrDef)
	{
		var varDef = this.getVariable(varIndexOrNameOrDef);
		var info = varDef && varDef.getInfo();
		if (info)
		{
			if (info.continuous)
			{
				//var count = this.getDateItemCount();
				return {'first': info.first, 'last': info.last /*, 'interval': (info.lastValue - info.firstValue) / count */ };
			}
		}
		return null;
	},
	/**
	 * Set the first/last value of a variable and mark it as a continuous one.
	 * @param {Variant} varNameOrIndexOrDef
	 * @param {Number} firstValue
	 * @param {Number} lastValue
	 */
	setVarRange: function(varIndexOrNameOrDef, firstValue, lastValue)
	{
		var varDef = this.getVariable(varIndexOrNameOrDef);
		var info = varDef && varDef.getInfo(true);
		info.continuous = true;
		info.first = firstValue;
		info.last = lastValue;
	},
	/**
	 * Remove the continuous information of a variable.
	 * @param {Variant} varIndexOrNameOrDef
	 */
	clearVarRange: function(varIndexOrNameOrDef)
	{
		var varDef = this.getVariable(varIndexOrNameOrDef);
		var info = varDef && varDef.getInfo();
		if (info && info.continuous)
			info.continuous = false;
		return this;
	},
	/**
	 * Returns the names of continuous variable.
	 * @returns {Array}
	 */
	getContinuousVarNames: function()
	{
		var result = [];
		var varDefs = this.getVariables();
		for (var i = 0, l = varDefs.length; i < l; ++i)
		{
			if (this.getVarRange(i))
				result.push(varDefs[i].getName());
		}
		return result;
	},

	/** @ignore */
	getRawValueAt: function(index)
	{
		var result = [];
		var values = this.tryApplySuper('getRawValueAt', [index]);
		var dataIntervalCount = this.getDataItemCount() - 1;
		// check if there are omitted values
		for (var i = 0, l = values.length; i < l; ++i)
		{
			var v = values[i];
			if (DataType.isUndefinedValue(v))  // maybe omitted? check if it is a continous variable
			{
				var range = this.getVarRange(i);
				if (range)
				{
					v = (dataIntervalCount > 1)? ((index / dataIntervalCount) * (range.last - range.first) + range.first): range.first;
					//console.log('adjusted v', v, range);
				}
			}
			result[i] = v;
		}
		// console.log(index, values, result);
		return result;
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
 * @property {String} spectrumType Type of spectrum, value from {@link Kekule.Spectroscopy.SpectrumTypes}.
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
		this.tryApplySuper('initialize', [id]);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('spectrumType', {'dataType': DataType.STRING});
		this.defineProp('data', {'dataType': 'Kekule.Spectroscopy.SpectrumData'});
		//this.defineProp('title', {'dataType': DataType.STRING});
		this._defineInfoProperty('title');
		//this.defineProp('molecule', {'dataType': 'Kekule.Molecule'});
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
	}
});

})();