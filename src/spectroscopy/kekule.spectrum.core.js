(function(){

"use strict";

var PS = Class.PropertyScope;
var AU = Kekule.ArrayUtils;
var KUnit = Kekule.Unit;

/**
 * Base namespace for spectra.
 * @namespace
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
	},

	/**
	 * Returns scale point information for a data range.
	 * @param {Number} dataRangeMin
	 * @param {Number} dataRangeMax
	 * @param {Int} preferredScaleSectionCount
	 * @returns {Hash}
	 */
	calcScalePointInfo: function(dataRangeMin, dataRangeMax, preferredScaleSectionCount)
	{
		if (preferredScaleSectionCount <= 0)
			preferredScaleSectionCount = 10;   // avoid exception, set a default count value here
		var digitCounts = [Math.log10(Math.abs(dataRangeMin)), Math.log10(Math.abs(dataRangeMax))];
		var digitCountMax = Math.floor(Math.max(digitCounts[0], digitCounts[1]));
		var digitCountMin = (Math.sign(dataRangeMin) === Math.sign(dataRangeMax))? Math.floor(Math.min(digitCounts[0], digitCounts[1], 0)): -Infinity;
		var useSciForm = (digitCountMax > 6);  // need to use sci form if the digit num is very large to compact space

		var dataDelta = dataRangeMax - dataRangeMin;
		var deltaBetweenScales = dataDelta / preferredScaleSectionCount;
		var deltaBetweenScalesDigitCount = Math.max(Math.floor(Math.log10(Math.abs(deltaBetweenScales))), digitCountMin);
		var scaleBase = Math.pow(10, deltaBetweenScalesDigitCount);
		var actualDeltaBetweenScales;
		if (actualDeltaBetweenScales < 10 && dataDelta > 0.5)  // major scale should be even number in 1-10 scope
		{
			actualDeltaBetweenScales = Math.ceil(actualDeltaBetweenScales / scaleBase / 2) * 2 * scaleBase;
		}
		else
		{
			actualDeltaBetweenScales = Math.ceil(deltaBetweenScales / scaleBase) * scaleBase;
		}
		var scaleFrom = Math.ceil(dataRangeMin / actualDeltaBetweenScales) * actualDeltaBetweenScales;
		var scaleTo = Math.floor(dataRangeMax / actualDeltaBetweenScales) * actualDeltaBetweenScales;
		var result = {
			'useSciForm': useSciForm,
			'scaleFrom': scaleFrom,
			'scaleTo': scaleTo,
			'scaleSectionCount': Math.round((scaleTo - scaleFrom) / actualDeltaBetweenScales),
			'scaleValues': [],
			'scaleBase': scaleBase,
			'scaleFromOnBase': scaleFrom / scaleBase,
			'scaleToOnBase': scaleTo / scaleBase,
			'fixDigitsCountAfterPoint': Math.max(-deltaBetweenScalesDigitCount, 0)  // record the recommended digits to appear after the decimal point
		};
		for (var i = 0, l = result.scaleSectionCount + 1; i < l; ++i)
		{
			result.scaleValues.push(Math.round(i * actualDeltaBetweenScales / scaleBase) * scaleBase + scaleFrom);
		}
		//console.log(result, scaleBase);
		return result;
	}
};

/**
 * A util object to manage the registered spectrum data value converters.
 * These converters are used to convert raw spectrum value from one unit to another (e.g., Hz to ppm in NMR).
 * @class
 */
Kekule.Spectroscopy.DataValueConverterManager = {
	/** @private */
	_converters: [],
	/**
	 * Register a converter object.
	 * The converter object should implement the following methods:
	 * {
	 *   convert: function(value, varDef, fromUnitObj, toUnitObj, spectrumDataSection, spectrum) => newValue,
	 *   canConvert: function(value, varDef, fromUnitObj, toUnitObj, spectrumDataSection, spectrum) => Bool,
	 *   getAltUnits: function(varDef, fromUnitObj, spectrumDataSection, spectrum) -> array (optional), returns the recommended alternative unitObjs for spectrum
	 * }
	 * @param {Object} converter
	 */
	register: function(converter)
	{
		DCM._converters.push(converter);
	},
	/**
	 * Unregister a converter.
	 * @param {Object} converter
	 */
	unregister: function(converter)
	{
		var index = DMC._converters.indexOf(converter);
		if (index >= 0)
			DMC._converters.splice(index, 1);
	},

	/** @private */
	doConvert: function(value, varDef, fromUnit, toUnit, spectrumDataSection, spectrum)
	{
		if (fromUnit === toUnit)
			return value;
		if (!Kekule.NumUtils.isNormalNumber(value))
			return value;
		var converters = DCM._converters;
		if (converters.length)
		{
			var fromUnitObj = Kekule.Unit.getUnit(fromUnit);
			var toUnitObj = Kekule.Unit.getUnit(toUnit);
			if (fromUnitObj && toUnitObj)
			{
				for (var i = converters.length - 1; i >= 0; --i)
				{
					var converter = converters[i];
					if (converter.canConvert(value, varDef, fromUnitObj, toUnitObj, spectrumDataSection, spectrum))
						return converter.convert(value, varDef, fromUnitObj, toUnitObj, spectrumDataSection, spectrum);
				}
			}
		}
		// no available converter found, can not convert
		Kekule.error(Kekule.$L('ErrorMsg.UNABLE_TO_CONVERT_BETWEEN_UNITS').format(fromUnitObj.getKey(), toUnitObj.getKey()));
		return null;
	},
	/** @private */
	getAltUnits: function(varDef, fromUnit, spectrumDataSection, spectrum)
	{
		var result = [];
		var converters = DCM._converters;
		if (converters.length)
		{
			var fromUnitObj = Kekule.Unit.getUnit(fromUnit);
			if (fromUnitObj)
			{
				for (var i = converters.length - 1; i >= 0; --i)
				{
					var converter = converters[i];
					var subResult = converter.getAltUnits(varDef, fromUnitObj, spectrumDataSection, spectrum) || [];
					AU.pushUnique(result, subResult);
				}
			}
		}
		return result;
	}
};
/** @ignore */
var DCM = Kekule.Spectroscopy.DataValueConverterManager;

// register the default data value converter
DCM.register({
	convert: function(value, varDef, fromUnitObj, toUnitObj, spectrumDataSection, spectrum)
	{
		return fromUnitObj.convertValueTo(value, toUnitObj);
	},
  canConvert: function(value, varDef, fromUnitObj, toUnitObj, spectrumDataSection, spectrum)
	{
		return fromUnitObj.canConvertValueTo(toUnitObj);
	},
	getAltUnits: function(varDef, fromUnitObj, spectrumDataSection, spectrum)
	{
		var category = fromUnitObj.category;
		return category.getConvertableUnits();
	}
});
// register a converter to convert between NMR frequency and ppm
DCM.register({
	convert: function(value, varDef, fromUnitObj, toUnitObj, spectrumDataSection, spectrum)
	{
		var observeFreq = spectrum.getSpectrumParam('observeFrequency');
		if (fromUnitObj.category === KUnit.Frequency)  // from Hz to ppm
		{
			var freq = fromUnitObj.convertValueTo(value, observeFreq.getUnit());
			var pureRatio = freq / observeFreq.getValue();  // in ppm * 1e10, in another word, the pure ratio
			return KUnit.Ratio.ONE.convertValueTo(pureRatio, toUnitObj);
		}
		else if (fromUnitObj.category === K.Unit.Ratio)  // from ppm to Hz
		{
			var value2 = fromUnitObj.convertValueToStandard(value);
			var freq = value2 * observeFreq.getValue();
			var freqUnit = KUnit.getUnit(observeFreq.getUnit());
			return freqUnit.convertValueTo(freq, toUnitObj);
		}
	},
	canConvert: function(value, varDef, fromUnitObj, toUnitObj, spectrumDataSection, spectrum)
	{
		if (spectrum.getSpectrumType() === Kekule.Spectroscopy.SpectrumType.NMR)
		{
			var observeFreq = spectrum.getSpectrumParam('observeFrequency');
			if (observeFreq && Kekule.Unit.getUnit(observeFreq.getUnit()).category === Kekule.Unit.Frequency)
			{
				return (fromUnitObj.category === Kekule.Unit.Frequency && toUnitObj.category === Kekule.Unit.Ratio)
					|| (fromUnitObj.category === Kekule.Unit.Ratio && toUnitObj.category === Kekule.Unit.Frequency);
			}
		}
		return false;
	},
	getAltUnits: function(varDef, fromUnitObj, spectrumDataSection, spectrum)
	{
		var result = [];
		if (spectrum.getSpectrumType() === Kekule.Spectroscopy.SpectrumType.NMR)
		{
			var observeFreq = spectrum.getSpectrumParam('observeFrequency');
			if (observeFreq && Kekule.Unit.getUnit(observeFreq.getUnit()).category === Kekule.Unit.Frequency)
			{
				if (fromUnitObj.category === Kekule.Unit.Frequency)
					result.push(Kekule.Unit.Ratio.MILLIONTH);
				else if (fromUnitObj.category === Kekule.Unit.Ratio)
					result = result.concat(Kekule.Unit.Frequency.getConvertableUnits());
			}
		}
		return result;
	}
});
// register a converter to convert between IR wave length and wave number
DCM.register({
	convert: function(value, varDef, fromUnitObj, toUnitObj, spectrumDataSection, spectrum)
	{
		if (fromUnitObj.category === KUnit.Length)   // from wave length to wave number
		{
			var standardWaveLengthScalar = fromUnitObj.convertValueToStandardEx(value);
			var standardWaveNumber = 1 / standardWaveLengthScalar.value;
			return toUnitObj.convertValueFromStandard(standardWaveNumber);
		}
		else if (fromUnitObj.category === KUnit.WaveNumber)  // from wave number to wave length
		{
			var standardWaveNumberScalar = fromUnitObj.convertValueToStandardEx(value);
			var standardWaveLength = 1 / standardWaveNumberScalar.value;
			return toUnitObj.convertValueFromStandard(standardWaveLength);
		}
	},
	canConvert: function(value, varDef, fromUnitObj, toUnitObj, spectrumDataSection, spectrum)
	{
		if (spectrum.getSpectrumType() === Kekule.Spectroscopy.SpectrumType.IR)
		{
			return (fromUnitObj.category === Kekule.Unit.Length && toUnitObj.category === Kekule.Unit.WaveNumber)
				|| (fromUnitObj.category === Kekule.Unit.WaveNumber && toUnitObj.category === Kekule.Unit.Length);
		}
		return false;
	},
	getAltUnits: function(varDef, fromUnitObj, spectrumDataSection, spectrum)
	{
		var result;
		if (spectrum.getSpectrumType() === Kekule.Spectroscopy.SpectrumType.IR)
		{
			if (fromUnitObj.category === Kekule.Unit.Length)
				result = [Kekule.Unit.WaveNumber.RECIPROCAL_CENTIMETER];
			else if (fromUnitObj.category === Kekule.Unit.WaveNumber)
				result = [Kekule.Unit.Length.getConvertableUnits()];
		}
		return result;
	}
});

/**
 * Variable used in spectrum.
 * @class
 * @augments Kekule.VarDefinition
 *
 * @property {String} internalUnit Unit that used in internal data storage.
 * @property {String} externalUnit Unit that used to expose data to public.
 */
Kekule.Spectroscopy.SpectrumVarDefinition = Class.create(Kekule.VarDefinition,
/** @lends Kekule.Spectroscopy.SpectrumVarDefinition# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Spectroscopy.SpectrumVarDefinition',
	initProperties: function()
	{
		this.defineProp('internalUnit', {'dataType': DataType.STRING, 'serializable': false,
			'getter': function() { return this.getUnit(); },
			'setter': function(value) { this.setUnit(value); }
		});
		this.defineProp('externalUnit', {'dataType': DataType.STRING});
	},
	/**
	 * Returns the actual external unit of var.
	 * Usually this function returns the value of {@link Kekule.Spectroscopy.SpectrumVarDefinition.externalUnit}
	 * If it is not set, the result will be the same as internalUnit.
	 * @returns {String}
	 */
	getActualExternalUnit: function()
	{
		return this.getExternalUnit() || this.getInternalUnit();
	},
	/**
	 * Whether the external unit setting of this var differs from the internal unit.
	 * @returns {Bool}
	 */
	hasDifferentExternalUnit: function()
	{
		var externalUnit = this.getExternalUnit();
		return !!(externalUnit && externalUnit !== this.getInternalUnit());
	}
});

/**
 * Represent part of data in a spectrum.
 * @class
 *
 * @param {String} name
 * @param {Kekule.Spectroscopy.SpectrumData} parent Parent spectrum data object.
 * @param {Array} localVariables Array of variable definition objects or symbols.
 *
 * @property {Kekule.Spectroscopy.SpectrumData} parent Parent spectrum data object.
 * @property {Array} localVarInfos Stores the local variable information. Each item is a hash containing fields {'symbol', 'range'(optional)}.
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
		this.defineProp('localVarInfos', {'dataType': DataType.ARRAY, 'setter': null});
		this.defineProp('localVarSymbols', {'dataType': DataType.ARRAY, 'scope': PS.PRIVATE, 'serializable': false,
			'getter': function() {
				var result = [];
				var list = this.getActualLocalVarInfos();
				if (list && list.length)
				{
					for (var j = 0, jj = list.length; j < jj; ++j)
					{
						var info = list[j];
						//result.push(info.varDef.getSymbol());
						result.push(info.symbol);
					}
				}
				/*
				else // localVarInfos is not initialized yet, read from the storage
					result = this.getPropStoreFieldValue('localVarSymbols');
				*/
				return result;
			},
			'setter': function(value)
			{
				var v = value || [];
				//this.setPropStoreFieldValue('localVarSymbols', v);
				this._updateLocalVarInfosFromSymbols(v);
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
		this.defineProp('dataItems', {'dataType': DataType.ARRAY, 'setter': null, 'scope': PS.PRIVATE});
	},
	/** @ignore */
	initPropValues: function()
	{
		this.tryApplySuper('initPropValues');
		this.setMode(Kekule.Spectroscopy.DataMode.CONTINUOUS);
	},

	/* @ignore */
	/*
	parentChanged: function(newParent, oldParent)
	{
		//console.log('parent changed', newParent && newParent.getClassName(), oldParent);
		var result = this.tryApplySuper('parentChanged', newParent, oldParent);
		// after changing of parent the local var info may be changed as well
		this._updateLocalVarInfosFromSymbols(this.getLocalVarSymbols());
		return result;
	},
	*/

	/**
	 * Returns whether this data section containing the peak data.
	 * @returns {Bool}
	 */
	isPeakSection: function()
	{
		return this.getMode() === Kekule.Spectroscopy.DataMode.PEAK;
	},

	/**
	 * Returns the actual parent SpectrumData object.
	 * @returns {Kekule.Spectroscopy.Spectrum}
	 * @private
	 */
	getParentSpectrum: function()
	{
		var p = this.getParent();
		while (p && !(p instanceof Kekule.Spectroscopy.Spectrum) && p.getParent)
		{
			p = p.getParent();
		}
		return p;
	},
	/**
	 * Returns the variable definition of parent spectrum data.
	 * @returns {Array}
	 */
	getParentVariables: function()
	{
		var parent = this.getParent();
		return (parent && parent.getVariables()) || [];
	},
	/**
	 * Returns the actual local variable infos.
	 * User should use this method rather than ref to localVarInfos property.
	 * @returns {Array}
	 */
	getActualLocalVarInfos: function()
	{
		var result = this.getLocalVarInfos();
		if (!result || !result.length)  // inherit all from parent spectrum
		{
			var vars = this.getParentVariables();
			for (var i = 0, l = vars.length; i < l; ++i)
			{
				result.push({'symbol': vars[i].symbol});
			}
		}
		return result;
	},
	/** @private */
	_updateLocalVarInfosFromSymbols: function(varSymbols, silent)
	{
		var v = varSymbols || [];
		var infos = [];
		var parent = this.getParentSpectrum();
		for (var i = 0, l = v.length; i < l; ++i)
		{
			var item = v[i];
			this._pushLocalVariable(parent, item, infos);
		}
		//console.log('update local var infos', varSymbols, infos, parent);
		this.setPropStoreFieldValue('localVarInfos', infos);
		//this.setLocalVarInfos(infos);
		this.notifyPropSet('localVarInfos', infos, silent);
	},
	/** @private */
	_pushLocalVariable: function(parent, varSymbol, targetArray)
	{
		if (!targetArray)
			targetArray = this.getLocalVarInfos();
		//var parent = this.getParent();
		if (parent && parent.getVariable)
		{
			var varDef = parent.getVariable(varSymbol);
			if (varDef)
			{
				targetArray.push({/*'varDef': varDef,*/ 'symbol': varSymbol});
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
		var localVarInfos = this.getActualLocalVarInfos();
		if (typeof (varIndexOrNameOrDef) === 'number')
			result = varIndexOrNameOrDef;
		else // if (varIndexOrNameOrDef instanceof Kekule.Spectroscopy.SpectrumVarDefinition)
		{
			var symbol = varIndexOrNameOrDef.getSymbol? varIndexOrNameOrDef.getSymbol(): varIndexOrNameOrDef;
			for (var i = 0, l = localVarInfos.length; i < l; ++i)
			{
				/*
				var varDef = localVarInfos[i].varDef;
				if (varDef === varIndexOrNameOrDef || varDef.getSymbol() === varIndexOrNameOrDef)
				{
					result = i;
					break;
				}
				*/
				if (symbol === localVarInfos[i].symbol)
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
		var result = (index >= 0)? this.getActualLocalVarInfos()[index]: null;
		/*
		if (result)
		{
			var parent = this.getParentSpectrum();
			if (parent)
			{
				var symbol = result.symbol;
				result = Object.create(result);  // avoid affect the original hash object
				result.varDef = parent.getVariable(symbol);
			}
		}
		*/
		return result;
		/*
		var result;
		var localVarInfos = this.getActualLocalVarInfos();
		if (typeof (varIndexOrNameOrDef) === 'number')
			result = localVarInfos[varIndexOrNameOrDef];
		else // if (varIndexOrNameOrDef instanceof Kekule.Spectroscopy.SpectrumVarDefinition)
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
	 * Returns the variable definition of a local variable.
	 * @param {Variant} varIndexOrNameOrDef
	 * @returns {Kekule.Spectroscopy.SpectrumVarDefinition}
	 */
	getLocalVarDef: function(varIndexOrNameOrDef)
	{
		//return this.getLocalVarInfoValue(varIndexOrNameOrDef, 'varDef');
		var symbol = this.getLocalVarInfoValue(varIndexOrNameOrDef, 'symbol');
		var parent = this.getParentSpectrum();
		return parent && parent.getVariable(symbol);
	},

	/**
	 * Returns the local variable info of certain dependency.
	 * @param {Int} dependency
	 * @returns {Array}
	 */
	getLocalVarInfoOfDependency: function(dependency)
	{
		var result = [];
		var localVarInfos = this.getActualLocalVarInfos();
		for (var i = 0, l = localVarInfos.length; i < l; ++i)
		{
			var varDef = this.getLocalVarDef(i);
			if (varDef.getDependency() === dependency)
			{
				var info = Object.extend({}, localVarInfos[i]);
				info.varDef = varDef;
				result.push(info);
			}
		}
		return result;
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
		return varInfo.continuousRange || (parent && parent.getContinuousVarRange && parent.getContinuousVarRange(varInfo.symbol));
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
	 * Set the local default value of a variable when the concrete value in spectrum is absent.
	 * @param {Variant} varIndexOrNameOrDef
	 * @param {Number} value
	 */
	setDefaultVarValue: function (varIndexOrNameOrDef, value)
	{
		this.setLocalVarInfoValue(varIndexOrNameOrDef, 'defaultValue', value);
		return this;
	},
	/**
	 * Clear the local default value of a variable.
	 * @param {Variant} varIndexOrNameOrDef
	 */
	clearDefaultVarValue: function(varIndexOrNameOrDef)
	{
		return this.setDefaultVarValue(varIndexOrNameOrDef, null);
	},
	/**
	 * Get the local default value of a variable when the concrete value in spectrum is absent.
	 * @param {Variant} varIndexOrNameOrDef
	 * @returns {Number}
	 */
	getDefaultVarValue: function(varIndexOfNameOrDef)
	{
		var result = this.getLocalVarInfoValue(varIndexOfNameOrDef, 'defaultValue');
		if　(Kekule.ObjUtils.isUnset(result))
		{
			var varInfo = this.getLocalVarInfo(varIndexOfNameOrDef);
			var parent = this.getParent();
			result = parent && parent.getDefaultVarValue(varInfo.symbol);
		}
		return result;
	},
	/**
	 * Returns the range when displaying spectrum of a variable.
	 * @param {Variant} varNameOrIndexOrDef
	 * @param {Hash} options May include fields:
	 *  {
	 *    autoCalc: Bool. If true, when explicit display range is not set, the number range of variable will be calculated and returned.
	 *    basedOnInternalUnit: Bool. If true, the returned value will be based on internal unit rather than the external unit of variable.
	 *  }
	 * @returns {Hash} Hash of {min, max}
	 */
	getVarDisplayRange: function(varIndexOrNameOrDef, options)
	{
		var op = options || {};
		//var varDef = this.getVar
		var varIndex = this.getLocalVarInfoIndex(varIndexOrNameOrDef);
		var info = this.getLocalVarInfo(varIndex);
		var result = info.displayRange? Object.extend({}, info.displayRange): null;  // avoid affect the original values
		if (!result)  // check the var definition
		{
			//var varDef = info.varDef;
			var varDef = this.getLocalVarDef(varIndex);
			var varDefRange = varDef.getInfoValue('displayRange');
			if (varDefRange)
				result = Object.extend({}, varDefRange);   // avoid affecting the original values
		}

		if (!result && op.autoCalc)
			result = this.calcDataRange(varIndex, {basedOnInternalUnit: true})[info.symbol];  // get range with internal unit first
			//result = this.calcDataRange(varIndexOrNameOrDef)[info.varDef.getSymbol()];
		// do not forget to do unit conversion if necessary
		if (!op.basedOnInternalUnit)
		{
			result = this._convertDataRangeToExternalUnit(result, varIndex);
			/*
			var fieldNames = Kekule.ObjUtils.getOwnedFieldNames(result);
			for (var i = 0, l = fieldNames.length; i < l; ++i)
			{
				var fname = fieldNames[i];
				//result[fname] = this._convertVarValueToExternal(result[fname], varIndex);
			}
			// after conversion, the min/max values may be reversed
			if (result && result.min > result.max)
			{
				var temp = result.min;
				result.min = result.max;
				result.max = temp;
			}
			*/
		}
		return result;
	},
	/**
	 * Set the range when displaying spectrum of a variable.
	 * @param {Variant} varNameOrIndexOrDef
	 * @param {Number} minValue
	 * @param {Number} maxValue
	 * @param {Hash} options Extra options, may include fields:
	 *   {
	 *     basedOnExternalUnit: Bool
	 *   }
	 */
	setVarDisplayRange: function(varIndexOrNameOrDef, minValue, maxValue, options)
	{
		var op = options || {};
		var range = {'min': minValue, 'max': maxValue};
		if (op.basedOnExternalUnit)  // need to convert values to internal unit first
		{
			var varIndex = this.getLocalVarInfoIndex(varIndexOrNameOrDef);
			range = this._convertDataRangeToInternalUnit(range, varIndex);
		}
		this.setLocalVarInfoValue(varIndexOrNameOrDef, 'displayRange', range);
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
	 * @param {Hash} options May include fields:
	 *  {
	 *    autoCalc: Bool. If true, when explicit display range is not set, the number range of variable will be calculated and returned.
	 *    basedOnInternalUnit: Bool. If true, the returned value will be based on internal unit rather than the external unit of variable.
	 *  }
	 * @returns {Hash}
	 */
	getDisplayRangeOfVars: function(targetVariables, options)
	{
		var result = {};
		if (!targetVariables)
			targetVariables = this.getLocalVarSymbols();
		for (var i = 0, l = targetVariables.length; i < l; ++i)
		{
			var symbol = this._varToVarSymbol(targetVariables[i]);
			result[symbol] = this.getVarDisplayRange(targetVariables[i], options);
		}
		return result;
	},

	/** @private */
	_varToVarSymbol: function(targetVar)
	{
		/*
		var info = this.getLocalVarInfo(targetVar);
		if (info)
			return info.varDef.getSymbol();
		*/
		var varDef = this.getLocalVarDef(targetVar);
		if (varDef)
			return varDef.getSymbol();
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
		var varInfos = this.getActualLocalVarInfos();
		for (var i = 0, l = varInfos.length; i < l; ++i)
		{
			//var varDef = varInfos[i].varDef;
			var varDef = this.getLocalVarDef(i);
			if (varDef.getDependency() !== Kekule.VarDependency.INDEPENDENT)
			{
				result[varDef.getSymbol()] = 0;
			}
		}
		return result;
	},
	/**
	 * Iterate all data items and calculate the min/max value of each variable.
	 * Note this function will always returns the value based on internal unit,
	 * regardless of whether the external unit is set or not.
	 * @param {Array} targetVariables Array of variable definition or symbol.
	 *   If not set, all variables will be calculated.
	 * @param {Hash} options Extra calculation options, may include fields:
	 *   {
	 *    basedOnInternalUnit: Bool. If true, the returned value will be based on internal unit rather than the external unit of variable.
	 *  }
	 * @returns {Hash}
	 */
	calcDataRange: function(targetVariables, options)
	{
		var op = options || {};
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
			}, null, {basedOnInternalUnit: true}); // here we use the internal unit, to keep the cache with the same unit

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

		if (!op.basedOnInternalUnit)
		{
			for (var i = 0, l = targetVarSymbols.length; i < l; ++i)
			{
				var symbol = targetVarSymbols[i];
				ranges[symbol] = this._convertDataRangeToExternalUnit(ranges[symbol], i);
			}
		}

		return ranges;
	},
	/** @private */
	_convertDataRangeToExternalUnit: function(range, varIndex)
	{
		if (!range)
			return range;
		var fieldNames = ['min', 'max'];
		for (var i = 0, l = fieldNames.length; i < l; ++i)
		{
			var fname = fieldNames[i];
			range[fname] = this._convertVarValueToExternal(range[fname], varIndex);
		}
		// after conversion, the min/max values may be reversed
		if (range.min > range.max)
		{
			var temp = range.min;
			range.min = range.max;
			range.max = temp;
		}
		return range;
	},
	/** @private */
	_convertDataRangeToInternalUnit: function(range, varIndex)
	{
		if (!range)
			return range;
		var fieldNames = ['min', 'max'];
		for (var i = 0, l = fieldNames.length; i < l; ++i)
		{
			var fname = fieldNames[i];
			range[fname] = this._convertVarValueToInternal(range[fname], varIndex);
		}
		// after conversion, the min/max values may be reversed
		if (range.min > range.max)
		{
			var temp = range.min;
			range.min = range.max;
			range.max = temp;
		}
		return range;
	},

	/**
	 * Iterate all data items and calculate the average value of each variable.
	 * Note this function will always returns the value based on internal unit,
	 * regardless of whether the external unit is set or not.
	 * @param {Array} targetVariables Array of variable definition or symbol.
	 *   If not set, all variables will be calculated.
	 * @param {Hash} options Extra calculation options, may include fields:
	 *  {
	 *    basedOnInternalUnit: Bool. If true, the returned value will be based on internal unit rather than the external unit of variable.
	 *  }
	 * @returns {Hash}
	 */
	calcDataAverage: function(targetVariables, options)
	{
		var op = options || {};
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
			}, null, {basedOnInternalUnit: true});

			// cache the average values
			for (var i = 0, l = remainingVarSymbols.length; i < l; ++i)
			{
				var symbol = remainingVarSymbols[i];
				averages[symbol] = sums[symbol] / counts[symbol];
				averageCache[symbol] = averages[symbol];
			}
		}

		if (!op.basedOnInternalUnit)
		{
			for (var i = 0, l = targetVarSymbols.length; i < l; ++i)
			{
				var symbol = targetVarSymbols[i]
				averages[symbol] = this._convertVarValueToExternal(averages[symbol, i]);
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
		var varInfos = this.getActualLocalVarInfos();
		for (var i = 0, l = varInfos.length; i < l; ++i)
		{
			if (this.getContinuousVarRange(i))
				result.push(varInfos[i].symbol);
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
		// then the extra fields
		if (hashValue._extra)
			result._extra = hashValue._extra;
		else
		{
			// then the remaining fields of hashValue, storing in _extra field of array item
			var remainingFields = AU.exclude(Kekule.ObjUtils.getOwnedFieldNames(hashValue, false), symbols);
			if (remainingFields.length)
				result._extra = {};
			for (var i = 0, l = remainingFields.length; i < l; ++i)
			{
				result._extra[remainingFields[i]] = hashValue[remainingFields[i]];
			}
		}
		return result;
	},
	/** @private */
	_itemArrayToHash: function(arrayValue, options)
	{
		if (!arrayValue)
			return null;
		var result = {};
		var symbols = this.getLocalVarSymbols();
		for (var i = 0, l = Math.min(symbols.length, arrayValue.length); i < l; ++i)
		{
			var value;
			if (!options.basedOnInternalUnit)
				value = this._convertVarValueToExternal(arrayValue[i], i);
			else
				value = arrayValue[i];
			result[symbols[i]] = value;
		}//
		if (arrayValue._extra)
		{
			//result = Object.extend(result, arrayValue._extra);
			result._extra = arrayValue._extra;
		}
		return result;
	},
	/** @private */
	_convertVarValueToNewUnit: function(value, varDef, fromUnit, toUnit)
	{
		if (!Kekule.NumUtils.isNormalNumber(value))  // not a number, usually can not be converted
			return value;
		//return Kekule.UnitUtils.convertValue(value, fromUnit, toUnit);
		return Kekule.Spectroscopy.DataValueConverterManager.doConvert(value, varDef, fromUnit, toUnit, this, this.getParent());
	},
	/**
	 * Convert a raw value (storaged value) to the one exposed to external with a different unit.
	 * @param {Number} value
	 * @param {Int} varIndex
	 * @returns {Number} value
	 * @private
	 */
	_convertVarValueToExternal: function(value, varIndex)
	{
		var result = value;
		var varDef = this.getLocalVarDef(varIndex);
		if (varDef && varDef.hasDifferentExternalUnit && varDef.hasDifferentExternalUnit())  // need to do a value conversion
		{
			result = this._convertVarValueToNewUnit(value, varDef, varDef.getInternalUnit(), varDef.getActualExternalUnit());
		}
		return result;
	},
	/**
	 * Convert a value with external unit to the one with internal unit.
	 * @param {Number} value
	 * @param {Int} varIndex
	 * @returns {Number} value
	 * @private
	 */
	_convertVarValueToInternal: function(value, varIndex)
	{
		var result = value;
		var varDef = this.getLocalVarDef(varIndex);
		if (varDef && varDef.hasDifferentExternalUnit && varDef.hasDifferentExternalUnit())  // need to do a value conversion
		{
			result = this._convertVarValueToNewUnit(value, varDef, varDef.getActualExternalUnit(), varDef.getInternalUnit());
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
	/**
	 * Remove a data item at index.
	 * @param {Int} index
	 */
	removeDataAt: function(index)
	{
		var result = this.getDataItems().splice(index, 1);
		this.notifyDataChange();
		return result;
	},
	/**
	 * Get the data value at index.
	 * @param {Int} index
	 * @returns {Array} The arrayed form of value.
	 */
	getRawValueAt: function(index)
	{
		var rawValue = this.getDataItems()[index];
		if (rawValue)
		{
			var result = AU.clone(rawValue);
			if (this.getMode() === Kekule.Spectroscopy.DataMode.CONTINUOUS)
			{
				var dataIntervalCount = this.getDataCount() - 1;
				// check if there are omitted values
				for (var i = 0, l = result.length; i < l; ++i)
				{
					var v = result[i];
					if (DataType.isUndefinedValue(v) || DataType.isNullValue(v))  // maybe omitted? check if it is a continous variable or it has a default value
					{
						var defValue = this.getDefaultVarValue(i);
						if (Kekule.ObjUtils.notUnset(defValue))
							v = defValue;
						else
						{
							var range = this.getContinuousVarRange(i);
							if (range)
							{
								v = (dataIntervalCount > 1)? ((index / dataIntervalCount) * (range.toValue - range.fromValue) + range.fromValue): range.fromValue;
								//console.log('adjusted v', v, range);
							}
						}
					}
					result[i] = v;
				}
			}
			if (rawValue._extra)  // copy the extra properties
				result._extra = rawValue._extra;
			return result;
		}
		else
			return null;
	},
	/** @private */
	getHashValueAt: function(index, options)
	{
		return this._itemArrayToHash(this.getRawValueAt(index), options || {});
	},
	/**
	 * Get the data value at index.
	 * @param {Int} index
	 * @returns {Hash} The hashed form of value.
	 */
	getValueAt: function(index, options)
	{
		return this.getHashValueAt(index, options);
	},
	/**
	 * Set the data value at index.
	 * @param {Int} index
	 * @param {Array} The arrayed form of value.
	 */
	setRawValueAt: function(index, value)
	{
		this.getDataItems()[index] = value;
		return this;
	},
	/** @private */
	setHashValueAt: function(index, value, options)
	{
		var aValue = this._itemHashToArray(value);
		this.setRawValueAt(index, aValue);
		return this;
	},
	/**
	 * Set the data value at index.
	 * @param {Int} index
	 * @param {Variant} value Value in hash or array form.
	 */
	setValueAt: function(index, value, options)
	{
		var d;
		if (!DataType.isArrayValue(value))  // is hash value, convert it to array first
			d = this._itemHashToArray(value);
		else
			d = value;
		this.setRawValueAt(index, d);
		return this;
	},
	/**
	 * Get the extra information of a data value.
	 * @param {Variant} value Data value in hash or array form.
	 * @returns {Hash}
	 */
	getExtraInfoOf: function(value)
	{
		return value._extra;
	},
	/**
	 * Get the extra information of data value at index.
	 * @param {Int} index
	 * @returns {Hash}
	 */
	getExtraInfoAt: function(index)
	{
		var d = this.getDataItems()[index];
		return d && d._extra;
	},
	/**
	 * Set the extra information of data value at index.
	 * @param {Int} index
	 * @param {Hash} info
	 */
	setExtraInfoAt: function(index, info)
	{
		var d = this.getDataItems()[index];
		d._extra = info;
		return this;
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
			next: function(options)
			{
				if (this.index >= dataItems.length)
					return {'done': true};
				else
				{
					var ret = {'done': false, 'value': /*self._itemArrayToHash(dataItems[this.index])*/self.getHashValueAt(this.index, options)};
					++this.index;
					return ret;
				}
			}
		};
		return result;
	},

	/**
	 * Call function to each data item.
	 * @param {Func} func With params: (hashValue [, index, options]).
	 */
	forEach: function(func, thisArg, options)
	{
		var iterator = this.getIterator();
		if (iterator)
		{
			//var dataItems = this.getDataItems();
			var index = 0;
			var nextItem = iterator.next(options);
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
 * @param {Array} variables Array of variables of data, each item is {@link Kekule.Spectroscopy.SpectrumVarDefinition}.
 *
 * @property {Array} variables Array of variables of data, each item is {@link Kekule.Spectroscopy.SpectrumVarDefinition}.
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
		initialize: function (id, variables, parent) {
			//this.setPropStoreFieldValue('dataItems', []);
			this.tryApplySuper('initialize', [id]);
			this.setPropStoreFieldValue('variables', variables ? AU.clone(variables) : []);
			var sections = new Kekule.ChemObjList(null, Kekule.Spectroscopy.SpectrumDataSection, true);
			this.setPropStoreFieldValue('sections', sections);
			this.setParent(parent);
			//this.createSection(this.getVariables());  // create a default section
		},
		doFinalize: function () {
			//this.clear();
			this.getSections().finalize();
			var variables = this.getVariables() || [];
			for (var i = 0, l = variables.length; i < l; ++i) {
				variables[i].finalize();
			}
			this.setPropStoreFieldValue('variables', null);
			this.tryApplySuper('doFinalize');
		},
		/** @private */
		initProperties: function () {
			this.defineProp('parent', {
				'dataType': 'Kekule.Spectroscopy.Spectrum', 'serializable': false,
				'setter': function (value) {
					this.setPropStoreFieldValue('parent', value);
					var sections = this.getSections();
					if (sections)
						sections.setParent(this.getParent() || this);
				}
			});
			this.defineProp('sections', {
				'dataType': 'Kekule.ChemObjList',
				'setter': function (value) {
					var old = this.getSections();
					if (old) {
						old.finalize();
					}
					if (value) {
						value._transparent = true;  // force the obj list be transparent
						value.setParent(this.getParent() || this);
					}
					this.setPropStoreFieldValue('sections', value);
				}
			});
			this.defineProp('autoCreateSection', {'dataType': DataType.BOOL});
			this.defineProp('activeSectionIndex', {
				'dataType': DataType.INT,
				'getter': function () {
					if (this.getSectionCount() <= 0)
						return -1;
					else if (this.getSectionCount() === 1)  // only one section, it should be activated by default
						return 0;
					else
						return this.getPropStoreFieldValue('activeSectionIndex');
				},
				'setter': function (value) {
					if (value >= 0 && value <= this.getSectionCount())
						this.setPropStoreFieldValue('activeSectionIndex', value);
				}
			});
			this.defineProp('activeSection', {
				'dataType': 'Kekule.Spectroscopy.SpectrumDataSection', 'serializable': false,
				'getter': function () {
					var result = this.getSectionAt(this.getActiveSectionIndex() || 0);
					if (!result && this.getSectionCount() <= 0 && this.getAutoCreateSection()) {
						result = this.createSection(this.getVariables());
						//console.log('auto create');
					}
					return result;
				},
				'setter': function (value) {
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
			this.defineProp('varSymbols', {
				'dataType': DataType.ARRAY, 'setter': null, 'scope': PS.PRIVATE,
				'getter': function () {
					var result = [];
					var list = this.getVariables() || [];
					for (var j = 0, jj = list.length; j < jj; ++j) {
						var varDef = list[j];
						result.push(varDef.getSymbol());
					}
					return result;
				}
			});
			this.defineProp('mode', {'dataType': DataType.INT, 'enumSource': Kekule.Spectroscopy.DataMode});
		},
		/** @ignore */
		initPropValues: function () {
			this.tryApplySuper('initPropValues');
			this.setAutoCreateSection(true);
			this.setMode(Kekule.Spectroscopy.DataMode.CONTINUOUS);
		},

		/** @private */
		getHigherLevelObj: function () {
			return this.getParent();
		},
		/** @ignore */
		getChildHolder: function () {
			return this.getSections();
		},

		/**
		 * Create and append a new {@link Kekule.Spectroscopy.SpectrumDataSection}.
		 * @param {Array} variables Array of local variable symbol or definition used by secion.
		 * @param {Int} mode
		 * @returns {Kekule.Spectroscopy.SpectrumDataSection}
		 */
		createSection: function (variables, mode) {
			var result = new Kekule.Spectroscopy.SpectrumDataSection(null, this, variables);
			//result.setVariables(variables);
			result.setMode(mode || this.getMode());
			this.getSections().appendChild(result);
			return result;
		},
		/**
		 * Remove all data sections.
		 */
		clearSection: function () {
			var sections = this.getChildren();
			for (var i = 0, l = sections.length; i < l; ++i) {
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
		getSectionCount: function () {
			return this.getSections().getChildCount();
		},
		/**
		 * Get child data sectionb at index.
		 * @param {Int} index
		 * @returns {Kekule.Spectroscopy.SpectrumDataSection}
		 */
		getSectionAt: function (index) {
			return this.getSections().getItemAt(index);
		},
		/**
		 * Get the index of child section in children list.
		 * @param {Kekule.Spectroscopy.SpectrumDataSection} section
		 * @returns {Int} Index of section or -1 when not found.
		 */
		indexOfSection: function (section) {
			return this.getSections().indexOfItem(section);
		},
		/**
		 * Check if section is in this spectrum data.
		 * @param {Kekule.Spectroscopy.SpectrumDataSection} section
		 * @returns {Bool}
		 */
		hasSection: function (section) {
			return this.indexOfSection(section) >= 0;
		},
		/**
		 * Remove a data section at index.
		 * @param {Int} index
		 * @returns {Kekule.Spectroscopy.SpectrumDataSection} Child section removed.
		 */
		removeSectionAt: function (index) {
			return this.getSections().removeItemAt(index);
		},
		/**
		 * Remove a child data section.
		 * @param {Kekule.Spectroscopy.SpectrumDataSection} section
		 * @returns {Kekule.Spectroscopy.SpectrumDataSection} Section object removed.
		 */
		removeSection: function (section) {
			return this.getSections().removeItem(section);
		},
		/**
		 * Insert a new section to index.
		 * @param {Kekule.Spectroscopy.SpectrumDataSection} section
		 * @param {Int} index
		 * @return {Int} Index of section after insertion.
		 */
		insertSectionAt: function (section, index) {
			return this.getSections().insertItemAt(section, index);
		},
		/**
		 * Insert a data section before refSection in data section list.
		 * @param {Kekule.Spectroscopy.SpectrumDataSection} obj
		 * @param {Kekule.Spectroscopy.SpectrumDataSection} refChildr
		 * @return {Int} Index of section after insertion.
		 */
		insertSectionBefore: function (section, refSection) {
			return this.getSections().insertItemBefore(section, refSection);
		},
		/**
		 * Add new data section to the tail of section list.
		 * @param {Kekule.Spectroscopy.SpectrumDataSection} section
		 * @return {Int} Index of obj after appending.
		 */
		appendSection: function (section) {
			return this.getSections().appendChild(section);
		},
		/**
		 * Returns whether multiple sections exists in this spectrum data.
		 * @returns {Bool}
		 */
		hasMultipleSections: function () {
			return this.getSections().getChildCount() > 1;
		},

		/**
		 * Iterate all data items in a section and calculate the min/max value of each variable.
		 * @param {Kekule.Spectroscopy.SpectrumDataSection} section
		 * @param {Array} targetVariables Array of variable definition or symbol.
		 *   If not set, all variables will be calculated.
		 * @returns {Hash}
		 */
		calcDataRangeOfSection: function (section, targetVariables) {
			return section.calcDataRange(targetVariables);
		},
		/**
		 * Iterate all data items in a set of sections and calculate the min/max value of each variable.
		 * @param {Array} sections
		 * @param {Array} targetVariables Array of variable definition or symbol.
		 *   If not set, all variables will be calculated.
		 * @returns {Hash}
		 */
		calcDataRangeOfSections: function (sections, targetVariables) {
			var result = {};
			for (var i = 0, l = sections.length; i < l; ++i) {
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
		 * @param {Hash} options May include fields:
		 *  {
		 *    autoCalc: Bool. If true, when explicit display range is not set, the number range of variable will be calculated and returned.
		 *    basedOnInternalUnit: Bool. If true, the returned value will be based on internal unit rather than the external unit of variable.
		 *  }
		 * @returns {Hash}
		 */
		getDisplayRangeOfSection: function (section, targetVariables, options) {
			return section.getDisplayRangeOfVars(targetVariables, options);
		},
		/**
		 * Returns the display range of a set of sections.
		 * @param {Array} sections
		 * @param {Array} targetVariables Array of variable definition or symbol.
		 *   If not set, all variables will be calculated.
		 * @param {Hash} options May include fields:
		 *  {
		 *    autoCalc: Bool. If true, when explicit display range is not set, the number range of variable will be calculated and returned.
		 *    basedOnInternalUnit: Bool. If true, the returned value will be based on internal unit rather than the external unit of variable.
		 *  }
		 * @returns {Hash}
		 */
		getDisplayRangeOfSections: function (sections, targetVariables, options) {
			var result = {};
			for (var i = 0, l = sections.length; i < l; ++i) {
				var range = sections[i].getDisplayRangeOfVars(targetVariables, options);
				result = Kekule.Spectroscopy.Utils.mergeDataRange(result, range);
			}
			return result;
		},

		/**
		 * Returns count of all variables.
		 * @returns {Int}
		 */
		getVariableCount: function () {
			return (this.getVariables() || []).length;
		},
		/**
		 * Returns the variable definition by a index or variable name.
		 * @param {Variant} varIndexOrNameOrDef
		 * @returns {Kekule.Spectroscopy.SpectrumVarDefinition}
		 */
		getVariable: function (varIndexOrNameOrDef) {
			var varDef = (varIndexOrNameOrDef instanceof Kekule.VarDefinition) ? varIndexOrNameOrDef :
				(typeof (varIndexOrNameOrDef) === 'number') ? this.getVariables()[varIndexOrNameOrDef] :   // index
					this.getVariables()[this.getVarSymbols().indexOf(varIndexOrNameOrDef)];   // name
			return varDef;
		},
		/**
		 * Returns the index of a variable definition.
		 * @param {Kekule.Spectroscopy.SpectrumVarDefinition} varDef
		 * @returns {Int}
		 */
		indexOfVariable: function (varDef) {
			return this.getVariables().indexOf(varDef);
		},
		/**
		 * Insert a new variable definition at a specified position.
		 * @param {Kekule.Spectroscopy.SpectrumVarDefinition} varDef
		 * @param {Int} index
		 */
		insertVariableAt: function (varDef, index) {
			if (index >= 0)
				this.getVariables().splice(index, 0, varDef);
			else
				this.getVariables().push(varDef);
			return this;
		},
		/**
		 * Insert a new variable definition before ref.
		 * @param {Kekule.Spectroscopy.SpectrumVarDefinition} varDef
		 * @param {Kekule.Spectroscopy.SpectrumVarDefinition} ref
		 */
		insertVariableBefore: function (varDef, ref) {
			var index = ref ? this.indexOfVarDefinition(ref) : -1;
			return this.insertVarDefinitionAt(varDef, index);
		},
		/**
		 * Append a new variable definition.
		 * @param {Kekule.Spectroscopy.SpectrumVarDefinition} varDef
		 */
		appendVariable: function (varDef) {
			return this.insertVariableAt(varDef, -1);
		},
		/**
		 * Remove a variable definition at index.
		 * @param {Int} index
		 */
		removeVariableAt: function (index) {
			this.getVariables().splice(index, 1);
			return this;
		},
		/**
		 * Remove a variable definition.
		 * @param {Kekule.Spectroscopy.SpectrumVarDefinition} varDef
		 */
		removeVariable: function (varDef) {
			var index = this.indexOfVariable(varDef);
			if (index >= 0)
				this.removeVariableAt(index);
			return this;
		},

		/**
		 * Returns variables of certain dependency.
		 * @param {Int} dependency Value from {@link Kekule.VarDependency}
		 * @returns {Array} Array of var definition.
		 */
		getVariablesOfDependency: function (dependency) {
			var result = [];
			for (var i = 0, l = this.getVariableCount(); i < l; ++i) {
				var varDef = this.getVariable(i);
				if (varDef && varDef.getDependency() === dependency)
					result.push(varDef);
			}
			return result;
		},

		/**
		 * Returns the first/last value of a continuous variable.
		 * @param {Variant} varNameOrIndexOrDef
		 * @returns {Hash} Hash of {firstValue, lastValue}
		 */
		getContinuousVarRange: function (varIndexOrNameOrDef) {
			var varDef = this.getVariable(varIndexOrNameOrDef);
			var info = varDef && varDef.getInfo();
			if (info) {
				if (info.continuous) {
					//var count = this.getDateItemCount();
					return {
						'fromValue': info.fromValue,
						'toValue': info.toValue /*, 'interval': (info.lastValue - info.firstValue) / count */
					};
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
		setContinuousVarRange: function (varIndexOrNameOrDef, fromValue, toValue) {
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
		clearContinuousVarRange: function (varIndexOrNameOrDef) {
			var varDef = this.getVariable(varIndexOrNameOrDef);
			var info = varDef.getInfo();
			if (info && info.continuous)
				info.continuous = false;
			return this;
		},
		/**
		 * Set the default value of a variable when the concrete value in spectrum is absent.
		 * E.g., in many NMR peak spectrums, y value will be omitted, and this method will provide a default one for it.
		 * @param {Variant} varIndexOrNameOrDef
		 * @param {Number} value
		 */
		setDefaultVarValue: function (varIndexOrNameOrDef, value)
		{
			var varDef = this.getVariable(varIndexOrNameOrDef);
			var info = varDef && varDef.getInfo(true);
			info.defaultValue = value;
			return this;
		},
		/**
		 * Clear the default value of a variable.
		 * @param {Variant} varIndexOrNameOrDef
		 */
		clearDefaultVarValue: function(varIndexOrNameOrDef)
		{
			return this.setDefaultVarValue(varIndexOrNameOrDef, null);
		},
		/**
		 * Get the default value of a variable when the concrete value in spectrum is absent.
		 * E.g., in many NMR peak spectrums, y value will be omitted, and this method will provide a default one for it.
		 * @param {Variant} varIndexOrNameOrDef
		 * @returns {Number}
		 */
		getDefaultVarValue: function(varIndexOrNameOrDef)
		{
			var varDef = this.getVariable(varIndexOrNameOrDef);
			var info = varDef && varDef.getInfo();
			if (info)
			{
				return info.defaultValue;
			}
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
	/**
	 * Remove a data item at index in current active section.
	 * @param {Int} index
	 */
	removeDataAt: function(index)
	{
		return this.getActiveSection().removeDataAt(index);
	},
	/**
	 * Get the data value at index in current active section.
	 * @param {Int} index
	 * @returns {Array} The arrayed form of value.
	 */
	getRawValueAt: function(index)
	{
		return this.getActiveSection().getRawValueAt(index);
	},
	/** @private */
	getHashValueAt: function(index)
	{
		return this.getActiveSection().getHashValueAt(index);
	},
	/**
	 * Get the data value at index in current active section.
	 * @param {Int} index
	 * @returns {Hash} The hashed form of value.
	 */
	getValueAt: function(index)
	{
		return this.getHashValueAt(index);
	},
	/**
	 * Set the data value at index in current active section.
	 * @param {Int} index
	 * @param {Array} The array form of value.
	 */
	setRawValueAt: function(index, value)
	{
		this.getActiveSection().setRawValueAt(index, value);
		return this;
	},
	/** @private */
	setHashValueAt: function(index, value, options)
	{
		this.getActiveSection().setHashValueAt(index, value, options);
		return this;
	},
	/**
	 * Set the data value at index in current active section.
	 * @param {Int} index
	 * @param {Variant} value Value in hash or array form.
	 */
	setValueAt: function(index, value, options)
	{
		this.getActiveSection().setValueAt(index, value);
		return this;
	},
	/**
	 * Get the extra information of a data value in current active section.
	 * @param {Variant} value Data value in hash or array form.
	 * @returns {Hash}
	 */
	getExtraInfoOf: function(value)
	{
		return this.getActiveSection().getExtraInfoOf(value);
	},
	/**
	 * Get the extra information of data value at index of current active section.
	 * @param {Int} index
	 * @returns {Hash}
	 */
	getExtraInfoAt: function(index)
	{
		return this.getActiveSection().getExtraInfoAt(index);
	},
	/**
	 * Set the extra information of data value at index of current active section.
	 * @param {Int} index
	 * @param {Hash} info
	 */
	setExtraInfoAt: function(index, info)
	{
		this.getActiveSection().setExtraInfoAt(index, info);
		return this;
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
	UV_VIS: 'UV_VIS',
	IMS: 'IMS',   // ION MOBILITY SPECTRUM
	RAMAN: 'Raman',
	CHROMATOGRAPHY: 'chromatography',
	GENERAL: 'general'   // unknown type
};

/**
 * Some constants used by NMR spectrum.
 * @object
 */
Kekule.Spectroscopy.SpectrumNMR = {
	TargetNucleus: {
		C13: 'C13',
		H: 'H'
	}
};
/**
 * Some constants used by MS spectrum.
 * @object
 */
Kekule.Spectroscopy.SpectrumMS = {
	SpectrometerType: {

	}
};

/**
 * The base spectrum class. Concrete spectrum classes should be inherited from this one.
 * @class
 * @augments Kekule.ChemObject
 *
 * @property {String} spectrumType Type of spectrum, value from {@link Kekule.Spectroscopy.SpectrumType}.
 * @property {String} name Name of spectrum.
 * @property {String} title Title of spectrum.
 * @property {Kekule.Spectroscopy.SpectrumData} data Spectrum data.
 * @property {Hash} spectrumParams Key spectrum parameters, e,g. the frequency of NMR.
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
		this.defineProp('name', {'dataType': DataType.STRING});
		this.defineProp('title', {'dataType': DataType.STRING});
		this.defineProp('data', {'dataType': 'Kekule.Spectroscopy.SpectrumData',
			'setter': function(value)
			{
				var old = this.getData();
				if (old)
				{
					old.finalize();
				}
				if (value)
				{
					value.setPropValue('parent', this, true);
				}
				this.setPropStoreFieldValue('data', value);
			}
		});
		this.defineProp('spectrumParams',
			{
				'dataType': DataType.HASH,
				'getter': function(canCreate)
				{
					var r = this.getPropStoreFieldValue('spectrumParams');
					if ((!r) && canCreate)
					{
						r = {};
						this.setPropStoreFieldValue('spectrumParams', r);
					}
					return r;
				},
				'setter': null
			});
		//this.defineProp('title', {'dataType': DataType.STRING});
		//this._defineInfoProperty('title');
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
		this._defineDataDelegatedMethod('getVariablesOfDependency');
		this._defineDataDelegatedMethod('getContinuousVarRange');
		this._defineDataDelegatedMethod('setContinuousVarRange');
		this._defineDataDelegatedMethod('clearContinuousVarRange');
		this._defineDataDelegatedMethod('getDefaultVarValue');
		this._defineDataDelegatedMethod('setDefaultVarValue');
		this._defineDataDelegatedMethod('clearDefaultVarValue');
	},
	/*
	 * Defines property which storing value in {@link Kekule.ChemObject.info}.
	 * @param {String} propName
	 * @param {String} infoFieldName
	 * @param {Hash} options
	 * @private
	 */
	/*
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
	*/
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
		propOptions.serializable = false;
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
			return this.getData()[dataMethodName].apply(this.getData(), arguments);
		}
	},

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

	/**
	 * Returns the recommended external units that can be converted from internal unit for this variable.
	 * @param {Kekule.Spectroscopy.SpectrumVarDefinition} varDef
	 * @returns {Array} Array of unit objects.
	 */
	getVarAvailableExternalUnitObjs: function(varDef)
	{
		return Kekule.Spectroscopy.DataValueConverterManager.getAltUnits(varDef, varDef.getInternalUnit? varDef.getInternalUnit(): varDef.getUnit(), null, this);
	},
	/**
	 * Returns the recommended external units that can be converted from internal unit for this variable.
	 * @param {Kekule.Spectroscopy.SpectrumVarDefinition} varDef
	 * @returns {Array} Array of unit symbols (string).
	 */
	getVarAvailableExternalUnitSymbols: function(varDef)
	{
		var unitObjs = Kekule.Spectroscopy.DataValueConverterManager.getAltUnits(varDef, varDef.getInternalUnit? varDef.getInternalUnit(): varDef.getUnit(), null, this);
		var result = [];
		for (var i = 0, l = unitObjs.length; i < l; ++i)
		{
			result.push(unitObjs[i].symbol);
		}
		return result;
	},

	/**
	 * Returns all keys in {@link Kekule.Spectroscopy.Spectrum#spectrumParams} property.
	 * @returns {Array}
	 */
	getSpectrumParamKeys: function()
	{
		return this.getSpectrumParams()? Kekule.ObjUtils.getOwnedFieldNames(this.getSpectrumParams()): [];
	},
	/**
	 * Get param value from {@link Kekule.Spectroscopy.Spectrum#spectrumParams}.
	 * @param {String} key
	 * @returns {Variant}
	 */
	getSpectrumParam: function(key)
	{
		return this.getSpectrumParams()? this.getSpectrumParams()[key]: null;
	},
	/**
	 * Set value of a spectrum param. If key already exists, its value will be overwritten.
	 * @param {String} key
	 * @param {Variant} value
	 */
	setSpectrumParam: function(key, value)
	{
		this.doGetSpectrumParams(true)[key] = value;
		this.notifyPropSet('spectrumParams', this.getPropStoreFieldValue('spectrumParams'));
	}
});

Kekule.ClassDefineUtils.addStandardCoordSupport(Kekule.Spectroscopy.Spectrum);
Kekule.ClassDefineUtils.addStandardSizeSupport(Kekule.Spectroscopy.Spectrum);


// register spectrum related units
(function(){
	var register = Kekule.Unit.register;
	// IR
	register('transmittance', 'transmittance', 'OpticalTransmittance', 1);  // IT/I0
	register('transmittance%', 'transmittance_percent', 'OpticalTransmittance', 1e-2);  // IT/I0
	register('reflectance', 'reflectance', 'OpticalReflectance', 1);  // IR/I0
	register('absorbance', 'absorbance', 'OpticalAbsorbance', 1);  // log10(IR/I0)
	register('Kubelka Munk', 'Kubelka_Munk', 'OpticalKubelkaMunk', 1);  // (1-R^2)/(2R)
	register('1/m', 'reciprocal_meter', 'WaveNumber', 1);
	register('1/cm', 'reciprocal_centimeter', 'WaveNumber', 1e2);
	// NMR
	//register('ppm', 'nmr_ppm', 'Frequency', null);
	// MS
	register('counts', 'ms_count', 'General', null);
	register('relative abundance', 'ms_relative_abundance', 'SpectrumMS', null);
	register('m/z', 'ms_mass_charge_ratio', 'SpectrumMS', null);
})();

})();