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
	DISCRETE: 2,
	/** Value points are continuous, e.g. in IR data table. */
	CONTINUOUS: 1
};

/**
 * Some util methods about spectroscopy.
 * @class
 */
Kekule.Spectroscopy.Utils = {
	/**
	 * Returns the first/last value of a continuous variable.
	 * @param {Kekule.VarDefinition} varDef
	 * @returns {Hash} Hash of {fromValue, toValue}
	 */
	getVarRange: function(varDef)
	{
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
	 * @param {Kekule.VarDefinition} varDef
	 * @param {Number} fromValue
	 * @param {Number} toValue
	 */
	setVarRange: function(varDef, fromValue, toValue)
	{
		var info = varDef && varDef.getInfo(true);
		info.continuous = true;
		info.fromValue = fromValue;
		info.toValue = toValue;
	},
	/**
	 * Remove the continuous information of a variable.
	 * @param {Kekule.VarDefinition} varDef
	 */
	clearVarRange: function(varDef)
	{
		var info = varDef.getInfo();
		if (info && info.continuous)
			info.continuous = false;
		return this;
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
 * @property {Int} continuity
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
		this.defineProp('continuity', {'dataType': DataType.INT, 'enumSource': Kekule.Spectroscopy.DataContinuity});
		// private, stores the data items, each item is a hash, e.g. {x: 1, y: 10, w: 2}
		this.defineProp('dataItems', {'dataType': DataType.ARRAY, 'setter': null, 'scope': PS.PRIVATE});
	},
	/** @ignore */
	initPropValues: function()
	{
		this.tryApplySuper('initPropValues');
		this.setContinuity(Kekule.Spectroscopy.DataContinuity.CONTINUOUS);
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
	 * Returns the local information of variable.
	 * @param {Variant} varIndexOrNameOrDef
	 * @returns {Hash}
	 */
	getLocalVarInfo: function(varIndexOrNameOrDef)
	{
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
	},
	/**
	 * Returns the first/last value of a continuous variable.
	 * @param {Variant} varNameOrIndexOrDef
	 * @returns {Hash} Hash of {fromValue, toValue}
	 */
	getVarRange: function(varIndexOrNameOrDef)
	{
		var parent = this.getParent();
		var varInfo = this.getLocalVarInfo(varIndexOrNameOrDef);
		return varInfo.range || (parent && parent.getVarRange(varInfo.varDef));
	},
	/**
	 * Set the first/last value of a variable and mark it as a continuous one.
	 * @param {Variant} varNameOrIndexOrDef
	 * @param {Number} fromValue
	 * @param {Number} toValue
	 */
	setVarRange: function(varIndexOrNameOrDef, fromValue, toValue)
	{
		var varInfo = this.getLocalVarInfo(varIndexOrNameOrDef);
		varInfo.range = {'fromValue': fromValue, 'toValue': toValue}
		return this;
	},
	/**
	 * Remove the continuous information of a variable.
	 * @param {Variant} varIndexOrNameOrDef
	 */
	clearVarRange: function(varIndexOrNameOrDef)
	{
		var varInfo = this.getLocalVarInfo(varIndexOrNameOrDef);
		varInfo.range = null;
		return this;
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
			if (this.getVarRange(i))
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
	getDataCount: function()
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
		return this.getDataItems().splice(index, 1);
	},
	/** @private */
	getRawValueAt: function(index)
	{
		var result = AU.clone(this.getDataItems()[index]);
		if (this.getContinuity() === Kekule.Spectroscopy.DataContinuity.CONTINUOUS)
		{
			var dataIntervalCount = this.getDataCount() - 1;
			// check if there are omitted values
			for (var i = 0, l = result.length; i < l; ++i)
			{
				var v = result[i];
				if (DataType.isUndefinedValue(v))  // maybe omitted? check if it is a continous variable
				{
					var range = this.getVarRange(i);
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
 * The base spectrum data class.
 * The concrete data can be stored in different forms, implemented in different descendant classes.
 * @class
 * @augments Kekule.ChemObject
 *
 * @param {String} id
 * @param {Array} variables Array of variables of data, each item is {@link Kekule.VarDefinition}.
 *
 * @property {Array} variables Array of variables of data, each item is {@link Kekule.VarDefinition}.
 * @property {Kekule.ChemObjList} sections Child data sections.
 * @property {Kekule.Spectroscopy.SpectrumData} activeSection Active data section to read/write data.
 * @property {Bool} autoCreateSection Whether create a initial data section automatically when inserting data.
 */
Kekule.Spectroscopy.SpectrumData = Class.create(Kekule.ChemObject,
/** @lends Kekule.Spectroscopy.SpectrumData# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Spectroscopy.SpectrumData',
	/** @private */
	initialize: function(id, variables)
	{
		//this.setPropStoreFieldValue('dataItems', []);
		this.tryApplySuper('initialize', [id]);
		this.setPropStoreFieldValue('variables', variables? AU.clone(variables): []);
		var sections = new Kekule.ChemObjList(null, Kekule.Spectroscopy.SpectrumDataSection, true);
		sections.setParent(this);
		this.setPropStoreFieldValue('sections', sections);
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
		this.defineProp('sections', {'dataType': 'Kekule.ChemObjList', 'setter': null});
		this.defineProp('autoCreateSection', {'dataType': DataType.BOOL});
		this.defineProp('activeSectionIndex', {'dataType': DataType.INT,
			'getter': function()
			{
				if (this.getSectionCount() <= 0)
					return -1;
				else if (this.getSectionCount() === 1)  // only one section, it should be activated by default
					return 0;
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
				var result = this.getSectionAt(this.getActiveSectionIndex());
				if (!result && this.getAutoCreateSection())
				{
					result = this.createSection(this.getVariables());
					console.log('auto create');
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
		this.defineProp('variables', {'dataType': DataType.ARRAY, 'setter': null});
		// private, stores the data items, each item is a hash, e.g. {x: 1, y: 10, w: 2}
		//this.defineProp('dataItems', {'dataType': DataType.ARRAY, 'setter': null, 'scope': PS.PRIVATE});
		// private, cache all variable names
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
		this.defineProp('continuity', {'dataType': DataType.INT, 'enumSource': Kekule.Spectroscopy.DataContinuity});
	},
	/** @ignore */
	initPropValues: function()
	{
		this.tryApplySuper('initPropValues');
		this.setAutoCreateSection(true);
		this.setContinuity(Kekule.Spectroscopy.DataContinuity.CONTINUOUS);
	},

	/** @ignore */
	getChildHolder: function()
	{
		return this.getSections();
	},

	/**
	 * Create and append a new {@link Kekule.Spectroscopy.SpectrumDataSection}.
	 * @param {Array} variables Array of local variable symbol or definition used by secion.
	 * @param {Int} continuity
	 * @returns {Kekule.Spectroscopy.SpectrumDataSection}
	 */
	createSection: function(variables, continuity)
	{
		var result = new Kekule.Spectroscopy.SpectrumDataSection(null, this, variables);
		//result.setVariables(variables);
		result.setContinuity(continuity || this.getContinuity());
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
		return this.getChildCount();
	},
	/**
	 * Get child data sectionb at index.
	 * @param {Int} index
	 * @returns {Kekule.Spectroscopy.SpectrumDataSection}
	 */
	getSectionAt: function(index)
	{
		return this.getChildAt(index);
	},
	/**
	 * Get the index of child section in children list.
	 * @param {Kekule.Spectroscopy.SpectrumDataSection} section
	 * @returns {Int} Index of section or -1 when not found.
	 */
	indexOfSection: function(section)
	{
		return this.indexOfChild(section);
	},
	/**
	 * Check if section is in this spectrum data.
	 * @param {Kekule.Spectroscopy.SpectrumDataSection} section
	 * @returns {Bool}
	 */
	hasSection: function(section)
	{
		return this.hasChild(section);
	},
	/**
	 * Remove a data section at index.
	 * @param {Int} index
	 * @returns {Kekule.Spectroscopy.SpectrumDataSection} Child section removed.
	 */
	removeSectionAt: function(index)
	{
		return this.removeChildAt(index);
	},
	/**
	 * Remove a child data section.
	 * @param {Kekule.Spectroscopy.SpectrumDataSection} section
	 * @returns {Kekule.Spectroscopy.SpectrumDataSection} Section object removed.
	 */
	removeSection: function(section)
	{
		return this.removeChild(section);
	},
	/**
	 * Insert a new section to index.
	 * @param {Kekule.Spectroscopy.SpectrumDataSection} section
	 * @param {Int} index
	 * @return {Int} Index of section after insertion.
	 */
	insertSectionAt: function(section, index)
	{
		return this.insertChildAt(section);
	},
	/**
	 * Insert a data section before refSection in data section list.
	 * @param {Kekule.Spectroscopy.SpectrumDataSection} obj
	 * @param {Kekule.Spectroscopy.SpectrumDataSection} refChildr
	 * @return {Int} Index of section after insertion.
	 */
	insertChildBefore: function(section, refSection)
	{
		return this.inserChildBefore(section, refSection);
	},
	/**
	 * Add new data section to the tail of section list.
	 * @param {Kekule.Spectroscopy.SpectrumDataSection} section
	 * @return {Int} Index of obj after appending.
	 */
	appendSection: function(section)
	{
		return this.appendChild(section);
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
	getVarRange: function(varIndexOrNameOrDef)
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
	setVarRange: function(varIndexOrNameOrDef, fromValue, toValue)
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
	clearVarRange: function(varIndexOrNameOrDef)
	{
		var varDef = this.getVariable(varIndexOrNameOrDef);
		var info = varDef.getInfo();
		if (info && info.continuous)
			info.continuous = false;
		return this;
	},

	/**
	 * Sort all data items.
	 * @param {Func} func Optional, func(hash1, hash2). If not set, data items will be sorted by default method.
	 */
	sort: function(func)
	{
		this.iterateChildren(function(c){
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
		this.iterateChildren(function(c){
			result += c.getDataCount();
		});
		return result;
	},
	/**
	 * Clear all data items in all data sections.
	 */
	clearData: function()
	{
		this.iterateChildren(function(c){
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
		//this.setPropStoreFieldValue('continousVarDetails', []);
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
		//this.setPropStoreFieldValue('continousVarDetails', null);
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
		var info = varDef.getInfo();
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