(function(){

"use strict";

var PS = Class.PropertyScope;
var AU = Kekule.ArrayUtils;
var KUnit = Kekule.Unit;

Kekule.globalOptions.add('spectrum', {
	spectrumInfo: {
		enablePrefixOmissionInGetter: true
	},
	data: {
		allowedComparisonErrorRate: 5e-8
	}
});

/**
 * A comparison flag, comparing the key properties and data of spectrum only.
 * @ignore
 */
Kekule.ComparisonMethod.SPECTRUM_DATA = 30;

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
 * Enumeration of peak position in spectrum data curve.
 * @enum
 */
Kekule.Spectroscopy.DataPeakPosition = {
	MAX: 0,
	MIN: 1
};

/**
 * Some util methods about spectroscopy.
 * @class
 */
Kekule.Spectroscopy.Utils = {
	/**
	 * Returns the preferred peak position of spectrum.
	 * @param {Variant} spectrumOrDataSection
	 * @returns {Int} Value from {@link Kekule.Spectroscopy.DataPeakPosition}.
	 */
	getSpectrumPeakPosition: function(spectrumOrDataSection)
	{
		var stype = (spectrumOrDataSection.getSpectrumType)? spectrumOrDataSection.getSpectrumType():
			(spectrumOrDataSection.getParentSpectrum() && spectrumOrDataSection.getParentSpectrum().getSpectrumType());
		return (stype === Kekule.Spectroscopy.SpectrumType.IR)?
			Kekule.Spectroscopy.DataPeakPosition.MIN:
			Kekule.Spectroscopy.DataPeakPosition.MAX;
	},
	/**
	 * Expand range with new values.
	 * @param {Hash} range
	 * @param {Array} values
	 */
	expandDataRange: function(range, values)
	{
		var vs = AU.toArray(values);
		var r = range || {};
		for (var i = 0, ii = vs.length; i < ii; ++i)
		{
			var value = vs[i];
			var fields = Kekule.ObjUtils.getOwnedFieldNames(value);
			for (var j = 0, jj = fields.length; j < jj; ++j)
			{
				var fieldName = fields[j];
				var fieldValue = value[fieldName];
				if (!r[fieldName])
					r[fieldName] = {'min': fieldValue, 'max': fieldValue};
				else
				{
					if (fieldValue < r[fieldName].min)
						r[fieldName].min = fieldValue;
					else if (fieldValue > r[fieldName].max)
						r[fieldName].max = fieldValue;
				}
			}
		}
		return r;
	},
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
	},

	/*
	 * Calculate the standardized distance square between two data points.
	 * The srcData/targetData/dataRanges should have the same dimension.
	 * @param {Array} srcData
	 * @param {Array} targetData
	 * @param {Array} dataRangeValues Array of {min, max}.
	 * @returns {Float}
	 */
	/*
	calcStandardizedDistanceSqr: function(srcData, targetData, dataRangeValues)
	{
		var length = dataRanges.length;
		for (var i = 0; i < length; ++i)
		{

		}
	},
	*/

	/**
	 * Generate a suitable label key for storing the spectrum info(meta/condition/parameter...) value.
	 * @param {String} name The core name of key, e.g. observedFrequency.
	 * @param {String} spectrumType The spectrum type, e.g. 'NMR'.
	 * @param {String} namespace The namespace of this label, e.g. 'jcamp', 'cml'.
	 * @returns {String}
	 */
	generateInfoKey: function(name, spectrumType, namespace)
	{
		var prefix = spectrumType || namespace;
		return prefix? prefix + MetaPropNamespace.DELIMITER + name: name;
	},

	/**
	 * Returns the default class to storing extra information for a data item in dataSection.
	 * @param {Kekule.Spectroscopy.SpectrumDataSection} dataSection
	 */
	getDefaultDataExtraInfoClass: function(dataSection)
	{
		var mode = dataSection.getMode();
		return (mode === Kekule.Spectroscopy.DataMode.PEAK)? Kekule.Spectroscopy.SpectrumPeakDetails: Kekule.Spectroscopy.SpectrumDataDetails;
	},
	/**
	 * Create a default object to storing extra information for a data item in dataSection.
	 * @param {Kekule.Spectroscopy.SpectrumDataSection} dataSection
	 */
	createDefaultDataExtraInfoObject: function(dataSection)
	{
		var c = Kekule.Spectroscopy.Utils.getDefaultDataExtraInfoClass(dataSection);
		return c && new c();
	}
};

/**
 * Manager for namespaces of spectrum info property name.
 * @enum
 */
Kekule.Spectroscopy.MetaPropNamespace = {
	/** Namespace for custom properties */
	CUSTOM: 'custom',
	/** Delimiter for namespace parts */
	DELIMITER: '.',
	/** @private */
	_namespaces: [],
	/**
	 * Register namespace(s).
	 * @param {Variant} namespace
	 */
	register: function(namespace)
	{
		AU.pushUnique(MetaPropNamespace._namespaces, namespace);
	},
	/**
	 * Unregister namespace(s).
	 * @param {Variant} namespace
	 */
	unregister: function(namespace)
	{
		MetaPropNamespace._namespaces = AU.exclude(MetaPropNamespace._namespaces, namespace);
	},
	/**
	 * Returns all registered namespaces.
	 * @returns {Array}
	 */
	getNamespaces: function()
	{
		return AU.clone(MetaPropNamespace._namespaces);
	},
	/**
	 * Returns a namespaced name of property.
	 * @param {String} namespace
	 * @param {String} coreName
	 * @returns {string}
	 */
	createPropertyName: function(namespace, coreName)
	{
		return (namespace || '') + MetaPropNamespace.DELIMITER + coreName;
	},
	/**
	 * Returns the namespace/core part of a prop name.
	 * @param {String} propName
	 * @returns {Hash} A hash of {namespace, coreName}.
	 */
	getPropertyNameDetail: function(propName)
	{
		var namespace, coreName;
		var p = propName.lastIndexOf(MetaPropNamespace.DELIMITER);
		if (p >= 0)
		{
			namespace = propName.substring(0, p);
			coreName = propName.substr(p + 1);
		}
		else
		{
			coreName = propName;
		}
		return {'namespace': namespace, 'coreName': coreName};
	},
	/**
	 * Returns the core part of a prop name.
	 * @param {String} propName
	 * @returns {String}
	 */
	getPropertyCoreName: function(propName)
	{
		return MetaPropNamespace.getPropertyNameDetail(propName).coreName;
	}
};
/** @ignore */
var MetaPropNamespace = Kekule.Spectroscopy.MetaPropNamespace;

MetaPropNamespace.register(MetaPropNamespace.CUSTOM);

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
		var observeFreq = spectrum.getParameter('NMR.ObserveFrequency');
		if (fromUnitObj.category === KUnit.Frequency)  // from Hz to ppm
		{
			var freq = fromUnitObj.convertValueTo(value, observeFreq.getUnit());
			var pureRatio = freq / observeFreq.getValue();  // in ppm * 1e10, in another word, the pure ratio
			return KUnit.Dimensionless.ONE.convertValueTo(pureRatio, toUnitObj);
		}
		else if (fromUnitObj.category === Kekule.Unit.Dimensionless)  // from ppm to Hz
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
			var observeFreq = spectrum.getParameter('NMR.ObserveFrequency');
			var freqNum = observeFreq && observeFreq.getValue();
			if (observeFreq && freqNum && Kekule.NumUtils.isNormalNumber(freqNum) && Kekule.Unit.getUnit(observeFreq.getUnit()).category === Kekule.Unit.Frequency)
			{
				return (fromUnitObj.category === Kekule.Unit.Frequency && toUnitObj.category === Kekule.Unit.Dimensionless)
					|| (fromUnitObj.category === Kekule.Unit.Dimensionless && toUnitObj.category === Kekule.Unit.Frequency);
			}
		}
		return false;
	},
	getAltUnits: function(varDef, fromUnitObj, spectrumDataSection, spectrum)
	{
		var result = [];
		if (spectrum.getSpectrumType() === Kekule.Spectroscopy.SpectrumType.NMR)
		{
			var observeFreq = spectrum.getParameter('NMR.ObserveFrequency');
			var freqNum = observeFreq && observeFreq.getValue();
			if (observeFreq && freqNum && Kekule.NumUtils.isNormalNumber(freqNum) && Kekule.Unit.getUnit(observeFreq.getUnit()).category === Kekule.Unit.Frequency)
			{
				if (fromUnitObj.category === Kekule.Unit.Frequency)
					result.push(Kekule.Unit.Dimensionless.PARTS_PER_MILLION);
				else if (fromUnitObj.category === Kekule.Unit.Dimensionless)
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
 * @property {Date} modifiedTime Time that do the last modification to data.
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
	DATAITEM_SRC_FIELD_NAME: '_src',
	/** @private */
	DATAITEM_EXTRA_FIELD_NAME: '_extra',
	/** @private */
	initialize: function(name, parent, localVariables)
	{
		this.updateDataModifiedTime();
		this.setPropStoreFieldValue('name', name);
		this.setPropStoreFieldValue('localVarInfos', []);
		this.setPropStoreFieldValue('dataItems', []);
		this.setPropStoreFieldValue('parent', parent);
		this.tryApplySuper('initialize', []);
		//this.setLocalVarSymbols(localVariables);
		if (localVariables)
			this.setLocalVariables(localVariables);
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
		this.defineProp('modifiedTime', {'dataType': DataType.DATE, 'setter': null});
		// private, stores the data items, each item is a hash, e.g. {x: 1, y: 10, w: 2}
		this.defineProp('dataItems', {'dataType': DataType.ARRAY, 'setter': null, 'scope': PS.PRIVATE});
	},
	/** @ignore */
	initPropValues: function()
	{
		this.tryApplySuper('initPropValues');
		this.setMode(Kekule.Spectroscopy.DataMode.CONTINUOUS);
	},

	/** @ignore */
	getAutoIdPrefix: function()
	{
		return 'sec';
	},

	/** @ignore */
	ownerChanged: function(newOwner, oldOwner)
	{
		// change the owner of all extra info objects if possible
		for (var i = 0, l = this.getDataCount(); i < l; ++i)
		{
			var extra = this.getExtraInfoAt(i);
			if (extra && extra.setOwner)
				extra.setOwner(newOwner);
		}
		this.tryApplySuper('ownerChanged', [newOwner, oldOwner]);
	},

	// custom save / load method
	/** @ignore */
	doSaveProp: function(obj, prop, storageNode, options, serializer, rootObj, rootStorageNode, handledObjs)
	{
		if (!prop.serializable)
			return;
		var propName = prop.name;
		if (propName === 'dataItems')
		{
			var node = serializer.createChildStorageNode(storageNode, serializer.propNameToStorageName('dataItems'), false);
			var subNode = serializer.createChildStorageNode(node, serializer.propNameToStorageName('values'), true); // create sub node for array
			serializer.saveObj(obj.getDataItems(), subNode, options, rootObj, rootStorageNode, handledObjs);  // save array values in this sub node
			// extract all extra info of data array and save them
			var extraInfos = obj._extractAllExtraInfoOfDataItems();
			if (extraInfos.length)
			{
				var subNode = serializer.createChildStorageNode(node, serializer.propNameToStorageName('extras'), true);
				serializer.saveObj(extraInfos, subNode, options, rootObj, rootStorageNode, handledObjs);
			}
			return true;  // this property is handled, do not use default save method
		}
		else
			return false;  // use the default method
	},
	/** @ignore */
	doLoadProp: function(obj, prop, storageNode, serializer, rootObj, rootStorageNode, handledObjs)
	{
		if (!prop.serializable)
			return;
		var propName = prop.name;
		if (propName === 'dataItems')
		{
			var items = [];
			var node = serializer.getChildStorageNode(storageNode, serializer.propNameToStorageName('dataItems'));
			var subNode = serializer.getChildStorageNode(node, serializer.propNameToStorageName('values')); // get sub node for array
			serializer.loadObj(items, subNode, rootObj, rootStorageNode, handledObjs);
			obj.setPropStoreFieldValue('dataItems', items);
			// then the extra info
			var subNode = serializer.getChildStorageNode(node, serializer.propNameToStorageName('extras'));
			if (subNode)
			{
				var extras = [];
				serializer.loadObj(extras, subNode, rootObj, rootStorageNode, handledObjs);
				obj._writeExtraInfoOfDataItems(extras);
			}
			return true;
		}
		else
			return false;  // use the default method
	},
	/** @private */
	_setSysFieldOfDataItem: function(dataItem, fieldName, fieldValue)
	{
		try
		{
			if (Object.defineProperty)
			{
				Object.defineProperty(dataItem, fieldName, {
					'value': fieldValue,
					'configurable': true,
					'writable': true,
					'enumerable': false
				});
			}
			else
				dataItem[fieldName] = fieldValue;
		}
		catch(e)
		{
			dataItem[fieldName] = fieldValue;
		}
	},
	/** @private */
	_extractAllExtraInfoOfDataItems: function()
	{
		var result = [];
		for (var i = 0, l = this.getDataCount(); i < l; ++i)
		{
			var info = this.getExtraInfoAt(i);
			if (info)
				result.push({'index': i, 'info': info});
		}
		return result;
	},
	/** @private */
	_writeExtraInfoOfDataItems: function(extras)
	{
		for (var i = 0, l = extras.length; i < l; ++i)
		{
			var info = extras[i];
			this.setExtraInfoAt(info.index, info.info);
		}
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

	/** @ignore */
	isEmpty: function()
	{
		return this.getDataCount() <= 0;
	},

	/**
	 * Returns whether this data section containing the peak data.
	 * @returns {Bool}
	 */
	isPeakSection: function()
	{
		return this.getMode() === Kekule.Spectroscopy.DataMode.PEAK;
	},
	/**
	 * Returns whether this data section containing the peak data and assignments.
	 * @returns {Bool}
	 */
	hasPeakAssignments: function()
	{
		if (this.isPeakSection())
		{
			var result = false;
			for (var i = 0, l = this.getDataCount(); i < l; ++i)
			{
				var extra = this.getExtraInfoAt(i);
				if (extra && extra && extra.hasAssignments && extra.hasAssignments())
				{
					result = true;
					break;
				}
			}
			return result;
		}
		else
			return false;
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
		var parent = this.getParentSpectrum();
		return (parent && parent.getVariables()) || [];
	},
	/**
	 * Returns the actual local variable infos.
	 * User should use this method rather than ref to localVarInfos property.
	 * @returns {Array}
	 */
	getActualLocalVarInfos: function()
	{
		var result = AU.clone(this.getLocalVarInfos());
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
	 * Set the local variable symbols or definitions.
	 * @param {Array} variables Array of var defintion or symbols.
	 */
	setLocalVariables: function(variables)
	{
		var localVar;
		var varDefs = [], varSymbols = [];
		for (var i = 0, l = variables.length; i < l; ++i)
		{
			localVar = variables[i];
			if (typeof(localVar) === 'string')  // a var symbol
			{
				varSymbols.push(localVar);
			}
			else // var definition
			{
				varDefs.push(localVar);
			}
		}
		if (varDefs.length)
		{
			this.setPropStoreFieldValue('localVarInfos', varDefs);
			this.notifyPropSet('localVarInfos', varDefs);
		}
		else if (varSymbols.length)
		{
			this._updateLocalVarInfosFromSymbols(varSymbols);
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
	 * Returns the local variable symbols of certain dependency.
	 * @param {Int} dependency
	 * @returns {Array}
	 */
	getLocalVarSymbolsOfDependency: function(dependency)
	{
		var varInfos = this.getLocalVarInfoOfDependency(dependency);
		var result = [];
		for (var i = 0, l = varInfos.length; i < l; ++i)
		{
			result.push(varInfos[i].varDef.getSymbol());
		}
		return result;
	},

	/**
	 * Returns the from/to value of a continuous variable.
	 * Note the return values of this function are all based on internal var unit.
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
	 *    ignorePeakRoot: Bool. If true, the peak root value will be ignored during calculation.
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
			var isPeakData = this.isPeakSection();
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
					if (isPeakData && !op.ignorePeakRoot)
					{
						var peakRootValue = self.getPeakRootValueOf(dataValue);
						if (peakRootValue && !notNum(peakRootValue[symbol]))
						{
							ranges[symbol].min = notNum(ranges[symbol].min) ? peakRootValue[symbol] : Math.min(ranges[symbol].min, peakRootValue[symbol]);
							ranges[symbol].max = notNum(ranges[symbol].max) ? peakRootValue[symbol] : Math.max(ranges[symbol].max, peakRootValue[symbol]);
						}
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
		var src = this._getDataValueSrc(hashValue);
		if (src)
		{
			this._setSysFieldOfDataItem(result, this.DATAITEM_SRC_FIELD_NAME, src);
		}

		// then the extra fields
		var extra;
		if (src && src[this.DATAITEM_EXTRA_FIELD_NAME])
		{
			//result._extra = hashValue._extra;
			extra = src[this.DATAITEM_EXTRA_FIELD_NAME];
		}
		else
		{
			// then the remaining fields of hashValue, storing in _extra field of array item
			var remainingFields = AU.exclude(
				Kekule.ObjUtils.getOwnedFieldNames(hashValue, false),
				[this.DATAITEM_SRC_FIELD_NAME, this.DATAITEM_EXTRA_FIELD_NAME].concat(symbols));
			if (remainingFields.length)
				extra = {};
			for (var i = 0, l = remainingFields.length; i < l; ++i)
			{
				extra[remainingFields[i]] = hashValue[remainingFields[i]];
			}
		}
		if (extra)
			//this.setExtraInfoOf(result, extra);
			this._setSysFieldOfDataItem(src || result, this.DATAITEM_EXTRA_FIELD_NAME, extra);
		return result;
	},
	/** @private */
	_convArrayToSymboledHash: function(arrayValue, symbols)
	{
		var result = {};
		for (var i = 0, l = Math.min(symbols.length, arrayValue.length); i < l; ++i)
		{
			var value = arrayValue[i];
			result[symbols[i]] = value;
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
		var src = this._getDataValueSrc(arrayValue);

		if (src[this.DATAITEM_EXTRA_FIELD_NAME])
		{
			//result = Object.extend(result, arrayValue._extra);
			//result._extra = arrayValue._extra;
			this._setSysFieldOfDataItem(result, this.DATAITEM_EXTRA_FIELD_NAME, arrayValue[this.DATAITEM_EXTRA_FIELD_NAME]);
		}

		this._setSysFieldOfDataItem(result, this.DATAITEM_SRC_FIELD_NAME, src || arrayValue);
		//result._raw = arrayValue;
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
	 * Returns the order of an independent var in current sorted data array.
	 * @param {String} varSymbol
	 * @returns {Int} 1 for ascending order, -1 for descending order and 0 for unknown.
	 */
	getIndependentVarValueOrder: function(varSymbol)
	{
		var result = 0;
		if (this.isDataSorted())
		{
			var self = this;
			var _getValidVarValueEx = function(varSymbol, fromIndex, toIndex, delta)
			{
				var currIndex = fromIndex;
				var info = {};
				var passed = false;
				do
				{
					info.value = self.getHashValueAt(currIndex)[varSymbol];
					info.index = currIndex;
					currIndex += delta;
					passed = Kekule.NumUtils.isNormalNumber(info.value);
				}
				while (!passed && ((delta > 0 && currIndex <= maxIndex) || (delta < 0 && currIndex >= toIndex)));
				return (passed)? info: null;
			}
			var maxIndex = this.getDataCount() - 1;
			var infoFrom = _getValidVarValueEx(varSymbol, 0, maxIndex, 1);
			var infoTo = _getValidVarValueEx(varSymbol, maxIndex, 0, -1)
			if (infoFrom && infoTo && infoFrom.index < infoTo.index)
				result = Math.sign(infoTo.value - infoFrom.value);
		}
		return result;
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
		this.updateDataModifiedTime();
		this.notifyPropSet('dataItems', items);
		this.invokeEvent('dataChange', {'data': items})
	},
	/** @private */
	updateDataModifiedTime: function()
	{
		this.setPropStoreFieldValue('modifiedTime', new Date());
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
	 * Returns the index of data item in this section. The item is can be a hash or an array.
	 * If it is a hash, the hash fields must matches {@link Kekule.Spectroscopy.SpectrumData.independentVars} and {@link Kekule.Spectroscopy.SpectrumData.dependentVars}.
	 * @param {Variant} item
	 * @returns {Int}
	 */
	indexOfDataItem: function(item)
	{
		var dataItem = item[this.DATAITEM_SRC_FIELD_NAME] || item;
		var items = this.getDataItems();
		return items.indexOf(dataItem);
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
			if (d[this.DATAITEM_EXTRA_FIELD_NAME])
				this._extraInfoAdded(d[this.DATAITEM_EXTRA_FIELD_NAME]);
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
		var srcValue = this.getDataItems()[index];
		if (srcValue)
		{
			var result = AU.clone(srcValue);
			result[this.DATAITEM_SRC_FIELD_NAME] = srcValue;
			var isContinousData = this.getMode() === Kekule.Spectroscopy.DataMode.CONTINUOUS;
			//if (this.getMode() === Kekule.Spectroscopy.DataMode.CONTINUOUS)
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
						else if (isContinousData)
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
			if (srcValue[this.DATAITEM_EXTRA_FIELD_NAME])  // copy the extra properties
			{
				//result._extra = rawValue._extra;
				this._setSysFieldOfDataItem(result, this.DATAITEM_EXTRA_FIELD_NAME, srcValue._extra);
			}
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
	 *   The hash value's ._raw field stores the original array form value.
	 *   It may also containing a ._extra field storing the extra information of spectrum data.
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
		var oldValue = this.getDataItems()[index];
		if (oldValue && oldValue[this.DATAITEM_EXTRA_FIELD_NAME])
			this._extraInfoRemoved(oldValue[this.DATAITEM_EXTRA_FIELD_NAME]);
		this.getDataItems()[index] = value;
		if (value[this.DATAITEM_EXTRA_FIELD_NAME])
		{
			this._setSysFieldOfDataItem(value, this.DATAITEM_EXTRA_FIELD_NAME, value[this.DATAITEM_EXTRA_FIELD_NAME]);  // redefine the value._extra field with special descriptors
			this._extraInfoAdded(value[this.DATAITEM_EXTRA_FIELD_NAME]);
		}
		this.notifyDataChange();
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

	/** @private */
	_getDataValueSrc: function(value)
	{
		if (!value)
			return null;
		else if (DataType.isArrayValue(value))
			return value[this.DATAITEM_SRC_FIELD_NAME] || value;
		else
			return value[this.DATAITEM_SRC_FIELD_NAME];
	},

	/**
	 * Create a new extra info object for value or index.
	 * If no default object can be created, null will be returned.
	 * Descendants may override this method.
	 * @param {Variant} valueOrIndex
	 * @returns {Object}
	 */
	createDefaultExtraInfoObjectFor: function(valueOrIndex)
	{
		var infoClass = (this.isPeakSection())? Kekule.Spectroscopy.SpectrumPeakDetails: null;
		var result = infoClass? new infoClass(): null;
		if (result && Kekule.ObjUtils.notUnset(valueOrIndex))
		{
			if (typeof(valueOrIndex) === 'number')  // index
				this.setExtraInfoAt(valueOrIndex, result);
			else if (valueOrIndex)
				this.setExtraInfoOf(valueOrIndex, result);
		}
		return result;
	},
	/**
	 * Get the extra information of a data value.
	 * @param {Variant} value Data value in hash or array form.
	 * @returns {Hash}
	 */
	getExtraInfoOf: function(value)
	{
		var src = this._getDataValueSrc(value) || value
		return src[this.DATAITEM_EXTRA_FIELD_NAME] || value[this.DATAITEM_EXTRA_FIELD_NAME];
	},
	/**
	 * Set the extra information of a data value.
	 * @param {Variant} value Data value in hash or array form.
	 * @param {Hash} info
	 */
	setExtraInfoOf: function(value, info)
	{
		var target = this._getDataValueSrc(value) || value;
		/*
		if (!DataType.isArrayValue(value))  // is hash value, get its _raw field first
			src = value[this.DATAITEM_SRC_FIELD_NAME];
		else
			src = value;
		*/
		if (target[this.DATAITEM_EXTRA_FIELD_NAME])
			this._extraInfoRemoved(target[this.DATAITEM_EXTRA_FIELD_NAME]);
		this._setSysFieldOfDataItem(target, this.DATAITEM_EXTRA_FIELD_NAME, info);
		this._extraInfoAdded(info);
		this.notifyDataChange();
		return this;
	},
	/**
	 * Get the extra information of data value at index.
	 * @param {Int} index
	 * @returns {Hash}
	 */
	getExtraInfoAt: function(index)
	{
		var d = this.getDataItems()[index];
		return d && d[this.DATAITEM_EXTRA_FIELD_NAME];
	},
	/**
	 * Set the extra information of data value at index.
	 * @param {Int} index
	 * @param {Hash} info
	 */
	setExtraInfoAt: function(index, info)
	{
		var d = this.getDataItems()[index];
		if (d[this.DATAITEM_EXTRA_FIELD_NAME])
			this._extraInfoRemoved(d[this.DATAITEM_EXTRA_FIELD_NAME]);
		this._setSysFieldOfDataItem(d, this.DATAITEM_EXTRA_FIELD_NAME, info);
		this._extraInfoAdded(info);
		this.notifyDataChange();
		return this;
	},
	/** @private */
	_extraInfoAdded: function(extraInfo)
	{
		if (extraInfo && extraInfo instanceof Kekule.ChemObject)
		{
			extraInfo.setParent(this);
			extraInfo.setOwner(this.getOwner());
		}
	},
	/** @private */
	_extraInfoRemoved: function(extraInfo)
	{
		if (extraInfo && extraInfo instanceof Kekule.ChemObject && extraInfo.getParent() === this)
		{
			extraInfo.setParent(null);
			extraInfo.setOwner(null);
		}
	},

	/*
	 * Get the extra peak detail information (based on {@link Kekule.Spectroscopy.SpectrumPeakDetails}).
	 * @param {Variant} value Data value in hash or array form.
	 * @param {Bool} autoCreate If the peak is without extra info, whether automatically create an instance of {@link Kekule.Spectroscopy.SpectrumPeakDetails}.
	 * @returns {Kekule.Spectroscopy.SpectrumPeakDetails}
	 */
	/*
	getPeakDetailsOf: function(value, autoCreate)
	{
		var extra = this.getExtraInfoOf(value);
		if (!extra && autoCreate)
		{
			extra = new Kekule.Spectroscopy.SpectrumPeakDetails();
			this.setExtraInfoOf(value, extra);
		}
		return extra && ((extra instanceof Kekule.Spectroscopy.SpectrumPeakDetails)? extra: null);
	},
	*/
	/*
	 * Get the extra peak detail information (based on {@link Kekule.Spectroscopy.SpectrumPeakDetails}).
	 * @param {Int} index
	 * @param {Bool} autoCreate If the peak is without extra info, whether automatically create an instance of {@link Kekule.Spectroscopy.SpectrumPeakDetails}.
	 * @returns {Kekule.Spectroscopy.SpectrumPeakDetails}
	 */
	/*
	getPeakDetailsAt: function(index, autoCreate)
	{
		var value = this.getRawValueAt(index);
		if (value)
			return this.getPeakDetailsOf(value, autoCreate);
		else
			return null;
	},
	*/
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
	 * Get the data item indexes that locates around independent variable values.
	 * This method is recommended to be used in peak mode spectrum data section.
	 * @param {Variant} independentValues A hash value with symbol: number map, or an array of values, or a single number value.
	 * @param {Hash} extraOptions
	 * @returns {Array}
	 */
	getSurroundingDataItemIndexesFromIndependent: function(independentValues, extraOptions)
	{
		// TODO: unfinished
	},
	/**
	 * Get the data item index from independent variable values.
	 * If the independentValues not pointed to a data item, -1 will be returned.
	 * This method is recommended to be used in peak mode spectrum data section.
	 * @param {Variant} independentValues A hash value with symbol: number map, or an array of values, or a single number value.
	 * @param {Hash} extraOptions
	 * @returns {Int}
	 */
	getDataItemIndexFromIndependent: function(independentValues, extraOptions)
	{
		var indepHashValues = {};
		if (typeof(independentValues) === 'number')  // a direct number value,
			indepHashValues = this._convArrayToSymboledHash([independentValues], this.getLocalVarSymbolsOfDependency(Kekule.VarDependency.INDEPENDENT));
		else if (DataType.isArrayValue(independentValues))
			indepHashValues = this._convArrayToSymboledHash(independentValues, this.getLocalVarSymbolsOfDependency(Kekule.VarDependency.INDEPENDENT));
		else
			indepHashValues = independentValues;

		var indepVarSymbols = Kekule.ObjUtils.getOwnedFieldNames(indepHashValues);
		var varDataRange = this.calcDataRange(indepVarSymbols);
		var allowedErrorRate = extraOptions && extraOptions.allowedErrorRate;
		var allowedError = {};
		for (var i = 0, l = indepVarSymbols.length; i < l; ++i)
		{
			var symbol = indepVarSymbols[i];
			var indepSearchValue = indepHashValues[symbol];
			if (indepSearchValue < varDataRange[symbol].min || indepSearchValue > varDataRange[symbol].max)
				return -1;
			else
				allowedError[symbol] = allowedErrorRate && ((varDataRange[symbol].max - varDataRange[symbol].min) * allowedErrorRate);
		}

		var resultDetails = {'index': -1, 'distanceSqr': 0};
		for (var i = 0, l = this.getDataCount(); i < l; ++i)
		{
			var value = this.getHashValueAt(i);
			var distanceSqr;
			var peakMatch = true;
			for (var j = 0, k = indepVarSymbols.length; j < k; ++j)
			{
				var symbol = indepVarSymbols[j];
				var indepSearchValue = indepHashValues[symbol];
				var currValue = value[symbol];
				var indepDistance = Math.abs(currValue - indepSearchValue);
				if (indepDistance <= allowedError[symbol])
				{
					distanceSqr += Math.sqr(indepDistance / varDataRange[symbol]);
				}
				else // indep value not match to this peak
				{
					peakMatch = false;
					break;
				}
			}
			if (peakMatch)  // found the candicate peak, compare to the prev candicate one, chose with the min distance
			{
				if (resultDetails.index < 0 || resultDetails.distanceSqr > distanceSqr)
				{
					resultDetails.index = i;
					resultDetails.distanceSqr = distanceSqr;
				}
			}
		}
		return resultDetails.index;
	},
	/**
	 * Returns the data hash value item from independent variable values.
	 * If the independentValues not pointed to a data value item, null will be returned.
	 * This method is recommended to be used in peak mode spectrum data section.
	 * @param {Variant} independentValues A hash value with symbol: number map, or an array of values, or a single number value.
	 * @param {Hash} extraOptions
	 * @returns {Int}
	 */
	getDataValueFromIndependent: function(independentValues, extraOptions)
	{
		var index = this.getDataItemIndexFromIndependent(independentValues, extraOptions);
		return (index >= 0)? this.getValueAt(index): null;
	},
	/**
	 * Calculate values of dependant variable values from independent variable values.
	 * @param {Variant} independentValues A hash value with symbol: number map, or an array of values, or a single number value.
	 * @param {Hash} extraOptions
	 * @returns {Hash}
	 */
	calcValueFromIndependent: function(independentValues, extraOptions)
	{
		var indepHashValues = {};
		if (typeof(independentValues) === 'number')  // a direct number value,
			indepHashValues = this._convArrayToSymboledHash([independentValues], this.getLocalVarSymbolsOfDependency(Kekule.VarDependency.INDEPENDENT));
		else if (DataType.isArrayValue(independentValues))
			indepHashValues = this._convArrayToSymboledHash(independentValues, this.getLocalVarSymbolsOfDependency(Kekule.VarDependency.INDEPENDENT));
		else
			indepHashValues = independentValues;
		return this.doCalcValueFromIndependent(indepHashValues, extraOptions);
	},
	/**
	 * Do actual work of {@link Kekule.Spectroscopy.SpectrumData.calcValueFromIndependent}.
	 * Descendants may override this method.
	 * @param {Hash} independentValues
	 * @param {Hash} extraOptions
	 * @returns {Hash}
	 * @private
	 */
	doCalcValueFromIndependent: function(independentValues, extraOptions)
	{
		var mode = this.getMode();
		return (mode === Kekule.Spectroscopy.DataMode.PEAK)?
			this._doCalcValueFromIndependentInPeakMode(independentValues, extraOptions):
			this._doCalcValueFromIndependentInContinousMode(independentValues, extraOptions);
	},
	/** @private */
	_doCalcValueFromIndependentInPeakMode: function(independentValues, extraOptions)
	{
		/*
		// TODO: currently only handles data with one one independent var, but this approach can handle most of the spectrum cases
		var indepVarSymbols = this.getLocalVarSymbolsOfDependency(Kekule.VarDependency.INDEPENDENT);
		if (indepVarSymbols.length > 1)
			return null;
		var indepVarSymbol = indepVarSymbols[0];
		var indepDataRange = this.calcDataRange([indepVarSymbol])[indepVarSymbol];
		var indepSearchValue = independentValues[indepVarSymbol];
		if (indepSearchValue < indepDataRange.min || indepSearchValue > indepDataRange.max)
			return null;

		var allowedError = ((extraOptions && extraOptions.allowedErrorRate) || Kekule.globalOptions.spectrum.data.allowedComparisonErrorRate)
			* (indepDataRange.max - indepDataRange.min);
		var resultDetails = {'value': null, 'distance': indepDataRange.max - indepDataRange.min};
		for (var i = 0, l = this.getDataCount(); i < l; ++i)
		{
			var value = this.getHashValueAt(i);
			var indepDistance = Math.abs(value[indepVarSymbol] - indepSearchValue);
			if (indepDistance <= allowedError)
			{
				if (indepDistance < resultDetails.distance)
				{
					resultDetails.value = value;
					resultDetails.distance = indepDistance;
				}
			}
		}
		if (!resultDetails.value)  // use the default peak root value
			resultDetails.value = this.getPeakRootValueOf(independentValues);

		//delete resultDetails.value[indepVarSymbol];  // remove the indepedent var, only use the dependent ones
		return resultDetails.value;
		*/
		var peakIndex = this.getDataItemIndexFromIndependent(independentValues, extraOptions);
		if (peakIndex >= 0)  // found the peak
			return this.getHashValueAt(peakIndex);
		else  // use the default peak root value
			return this.getPeakRootValueOf(independentValues);
	},
	/** @private */
	_doCalcValueFromIndependentInContinousMode: function(independentValues, extraOptions)
	{
		var resultEx = this._doCalcValueFromIndependentInContinousModeEx(independentValues, extraOptions);
		return resultEx && resultEx.value;
	},
	/** @private */
	_doCalcValueFromIndependentInContinousModeEx: function(independentValues, extraOptions)
	{
		// TODO: currently only handles data with one one independent var, but this approach can handle most of the spectrum cases
		var indepVarSymbols = this.getLocalVarSymbolsOfDependency(Kekule.VarDependency.INDEPENDENT);
		var depVarSymbols = this.getLocalVarSymbolsOfDependency(Kekule.VarDependency.DEPENDENT);
		if (indepVarSymbols.length > 1)
			return null;
		var indepVarSymbol = indepVarSymbols[0];
		var indepVarValue = independentValues[indepVarSymbol];
		var totalDataRange = this.calcDataRange([indepVarSymbol])[indepVarSymbol];
		if (indepVarValue < totalDataRange.min || indepVarValue > totalDataRange.max)
			return null;

		var resultValue;
		var dataIndexFloor = -1, dataIndexCeil = -1;
		var useContinuousVarRange = true;
		var varDef = this.getLocalVarDef(indepVarSymbol);
		var dataCount = this.getDataCount();
		useContinuousVarRange = !varDef.hasDifferentExternalUnit();  // the value get from getContinuousVarRange function in based on internal unit
		if (useContinuousVarRange)
		{
			var indepVarRange = this.getContinuousVarRange(indepVarSymbol);
			useContinuousVarRange = !!indepVarRange;
		}
		if (useContinuousVarRange)
		{
			var dataIndex = (indepVarValue - indepVarRange.fromValue) / (indepVarRange.toValue - indepVarRange.fromValue) * (dataCount - 1);
			dataIndexFloor = Math.max(Math.floor(dataIndex), 0);
			dataIndexCeil = Math.min(Math.ceil(dataIndex), dataCount - 1);
		}
		else
		{
			//indepVarRange = this.calcDataRange([indepVarSymbols])[indepVarSymbol];
			var indepOrder = this.getIndependentVarValueOrder(indepVarSymbol);
			if (indepOrder === 0)  // var values are not ordered, can not calculate
			{
				// do nothing, keep dataIndexFloor/dataIndexCeil < 0
			}
			else
			{
				var reversedOrder = indepOrder < 0;
				var indexes = this._calcNeighborDataIndexesToIndependentValue(indepVarSymbol, indepVarValue, 0, dataCount - 1, reversedOrder);
				dataIndexFloor = indexes[0];
				dataIndexCeil = indexes[1];
			}
		}

		if (dataIndexFloor < 0 || dataIndexCeil < 0)
			return null;
		if (dataIndexFloor === dataIndexCeil)
			//return this.getHashValueAt(dataIndexFloor);
			resultValue = this.getHashValueAt(dataIndexFloor);
		else
		{
			/*
			var valueFloor = this.getHashValueAt(dataIndexFloor);
			var valueCeil = this.getHashValueAt(dataIndexCeil);
			var ratio = (indepVarValue - valueFloor[indepVarSymbol]) / (valueCeil[indepVarSymbol] - valueFloor[indepVarSymbol]);
			var result = {};
			var symbols =  Kekule.ObjUtils.getOwnedFieldNames(valueFloor);
			for (var i = 0, l = symbols.length; i < l; ++i)
			{
				var symbol = symbols[i];
				if (symbol === indepVarSymbol)
					result[symbol] = indepVarValue;
				else
					result[symbol] = valueFloor[symbol] + (valueCeil[symbol] - valueFloor[symbol]) * ratio;
			}
			*/
			//var valueFloor = this.getHashValueAt(dataIndexFloor);
			//var depVarSymbols = Kekule.ObjUtils.getOwnedFieldNames(valueFloor);
			//AU.remove(depVarSymbols, indepVarSymbol);

			var depValues = this._calcIntermediateDependentVarValuesBetween(depVarSymbols, indepVarSymbol, indepVarValue, dataIndexFloor, dataIndexCeil);
			resultValue = {};
			resultValue[indepVarSymbol] = indepVarValue;
			resultValue = Object.extend(resultValue, depValues);  // ensure the independent value first
			//console.log('calc', result, depVarSymbols, indepVarSymbol, indepVarValue, dataIndexFloor, dataIndexCeil);
			//return result;
		}
		return {
			'value': resultValue,
			'dataIndexes': [dataIndexFloor, dataIndexCeil]
		};
	},
	/** @private */
	_calcNeighborDataIndexesToIndependentValue: function(indepVarSymbol, indepValue, fromIndex, toIndex, reversedOrder)
	{
		if (toIndex - fromIndex <= 2)
			return [fromIndex, toIndex];
		var halfIndex = Math.round((fromIndex + toIndex) / 2);
		var halfValue = this.getHashValueAt(halfIndex)[indepVarSymbol];
		if (halfValue === indepValue)
			return [halfIndex, halfIndex];
		else if (halfValue <= indepValue)
			return !reversedOrder?
				this._calcNeighborDataIndexesToIndependentValue(indepVarSymbol, indepValue, halfIndex, toIndex, reversedOrder):
				this._calcNeighborDataIndexesToIndependentValue(indepVarSymbol, indepValue, fromIndex, halfIndex, reversedOrder);
		else
			return !reversedOrder?
				this._calcNeighborDataIndexesToIndependentValue(indepVarSymbol, indepValue, fromIndex, halfIndex, reversedOrder):
				this._calcNeighborDataIndexesToIndependentValue(indepVarSymbol, indepValue, halfIndex, toIndex, reversedOrder);
	},
	/** @private */
	_calcIntermediateDependentVarValuesBetween: function(depVarSymbols, indepVarSymbol, indepVarValue, floorIndex, ceilIndex)
	{
		if (floorIndex === ceilIndex)
		{
			var value = this.getHashValueAt(floorIndex);
			var result = {};
			for (var i = 0, l = depVarSymbols.length; i < l; ++i)
			{
				result[depVarSymbols[i]] = value[depVarSymbols[i]];
			}
			return result;
		}

		var valueFloor = this.getHashValueAt(floorIndex);
		var valueCeil = this.getHashValueAt(ceilIndex);

		var floorIndepValue = valueFloor[indepVarSymbol];
		var ceilIndepValue = valueCeil[indepVarSymbol];
		if (!Kekule.NumUtils.isNormalNumber(floorIndepValue))
		{
			if (floorIndex > 0)
				return this._calcIntermediateDependentVarValuesBetween(depVarSymbols, indepVarSymbol, indepVarValue, floorIndex - 1, ceilIndex);
			else
				return this._calcIntermediateDependentVarValuesBetween(depVarSymbols, indepVarSymbol, indepVarValue, ceilIndex, ceilIndex);
		}
		else if (!Kekule.NumUtils.isNormalNumber(ceilIndepValue))
		{
			if (ceilIndex < this.getDataCount() - 1)
				return this._calcIntermediateDependentVarValuesBetween(depVarSymbols, indepVarSymbol, indepVarValue, floorIndex, ceilIndex + 1);
			else
				return this._calcIntermediateDependentVarValuesBetween(depVarSymbols, indepVarSymbol, indepVarValue, floorIndex, floorIndex);
		}
		else
		{
			var ratio = (indepVarValue - valueFloor[indepVarSymbol]) / (valueCeil[indepVarSymbol] - valueFloor[indepVarSymbol]);
			var result = {};
			for (var i = 0, l = depVarSymbols.length; i < l; ++i)
			{
				var symbol = depVarSymbols[i];
				var floorDepValue = valueFloor[symbol];
				var ceilDepValue = valueCeil[symbol];
				var resultValue = false;
				if (!Kekule.NumUtils.isNormalNumber(floorDepValue))
				{
					if (floorIndex > 0)
						resultValue = this._calcIntermediateDependentVarValuesBetween([symbol], indepVarSymbol, indepVarValue, floorIndex - 1, ceilIndex);
					else
						resultValue = ceilDepValue[symbol];
				}
				else if (!Kekule.NumUtils.isNormalNumber(ceilDepValue))
				{
					if (ceilIndex < this.getDataCount() - 1)
						resultValue = this._calcIntermediateDependentVarValuesBetween([symbol], indepVarSymbol, indepVarValue, floorIndex, ceilIndex + 1);
					else
						resultValue = floorDepValue[symbol];
				}
				else
					resultValue = floorDepValue + (ceilDepValue - floorDepValue) * ratio;
				result[symbol] = resultValue;
			}
			return result;
		}

		/*
		var symbols =  Kekule.ObjUtils.getOwnedFieldNames(valueFloor);
		for (var i = 0, l = symbols.length; i < l; ++i)
		{
			var symbol = symbols[i];
			if (symbol === indepVarSymbol)
				result[symbol] = indepVarValue;
			else
				result[symbol] = valueFloor[symbol] + (valueCeil[symbol] - valueFloor[symbol]) * ratio;
		}
		//var valueFloor
		var ratio = (indepVarValue - valueFloor[indepVarSymbol]) / (valueCeil[indepVarSymbol] - valueFloor[indepVarSymbol]);
		*/
	},

	/**
	 * Calculate value ranges of dependant variables from independent variable value ranges.
	 * @param {Variant} independentRanges A hash value with {symbol: {min, max}} map, or an array of {min, max}.
	 * @param {Hash} extraOptions
	 * @returns {Hash} Including the following fields: {range, dataIndexes, dataValues}
	 */
	calcValueRangeFromIndependentRangeEx: function(independentRanges, extraOptions)
	{
		var indepHashRanges = {};
		if (DataType.isArrayValue(independentRanges))
			indepHashRanges = this._convArrayToSymboledHash(independentRanges, this.getLocalVarSymbolsOfDependency(Kekule.VarDependency.INDEPENDENT));
		else
			indepHashRanges = independentRanges;
		return this.doCalcValueRangeFromIndependentRangeEx(indepHashRanges, extraOptions);
	},
	/** @private */
	doCalcValueRangeFromIndependentRangeEx: function(independentRanges, extraOptions)
	{
		var indepVarSymbols = this.getLocalVarSymbolsOfDependency(Kekule.VarDependency.INDEPENDENT);
		var depVarSymbols = this.getLocalVarSymbolsOfDependency(Kekule.VarDependency.DEPENDENT);
		var totalDataRange = this.calcDataRange(indepVarSymbols);
		var findNearest = extraOptions && extraOptions.findNearest;

		var actualIndepRanges = {};
		var centerIndepValue = {};
		for (var i = 0, l = indepVarSymbols.length; i < l; ++i)
		{
			var indepVarSymbol = indepVarSymbols[i];
			if (independentRanges[indepVarSymbol])
			{
				var indepVarRange = Object.extend({}, independentRanges[indepVarSymbol]);
				var currTotalDataRange = totalDataRange[indepVarSymbol];

				if (indepVarRange.min < currTotalDataRange.min)
					indepVarRange.min = currTotalDataRange.min;
				if (indepVarRange.max > currTotalDataRange.max)
					indepVarRange.max = currTotalDataRange.max;
				actualIndepRanges[indepVarSymbol] = indepVarRange;
				centerIndepValue[indepVarSymbol] = (indepVarRange.min + indepVarRange.max) / 2;
			}
		}

		var mode = this.getMode();
		var result = (mode === Kekule.Spectroscopy.DataMode.PEAK)?
			this._doCalcValueRangeFromIndependentRangeInPeakModeEx(actualIndepRanges, centerIndepValue, indepVarSymbols, depVarSymbols, extraOptions):
			this._doCalcValueRangeFromIndependentRangeInContinousModeEx(actualIndepRanges, centerIndepValue, indepVarSymbols, depVarSymbols, extraOptions);
		if (result && result.range)  // check if no legal range returned
		{
			if (Kekule.ObjUtils.getOwnedFieldNames(result.range) <= 0)
				result.range = null;
		}
		return result;
	},
	/** @private */
	_doCalcValueRangeFromIndependentRangeInPeakModeEx: function(independentRanges, centerIndepValue, indepVarSymbols, depVarSymbols, extraOptions)
	{
		var findNearest = !!centerIndepValue;  // if centerIndepValue is passed, we need to find the nearest value
		var minDistanceSqr;
		var result = {'dataIndexes': [], 'dataValues': [], 'range':{}};
		var indexFrom, indexTo, indexStep;
		if (extraOptions.findInReversedOrder)
		{
			indexFrom = this.getDataCount() - 1;
			indexTo = 0;
			indexStep = -1;
		}
		else
		{
			indexFrom = 0;
			indexTo = this.getDataCount() - 1;
			indexStep = 1;
		}
		//for (var i = 0, l = this.getDataCount(); i < l; ++i)
		for (var i = indexFrom; extraOptions.findInReversedOrder? (i >= indexTo): (i <= indexTo); i += indexStep)
		{
			var value = this.getHashValueAt(i);
			var passed = true;
			var distanceSqr = 0;
			for (var j = 0, jj = indepVarSymbols.length; j < jj; ++j)
			{
				var indepSymbol = indepVarSymbols[j];
				passed = (value[indepSymbol] >= independentRanges[indepSymbol].min)
					&& (value[indepSymbol] <= independentRanges[indepSymbol].max);
				if (!passed)
					break;
				else
				{
					if (findNearest)
						distanceSqr += Math.sqr(value[indepSymbol] - centerIndepValue[indepSymbol]);
				}
			}
			if (passed)
			{
				result.dataIndexes.push(i);
				result.dataValues.push(value);
				if (findNearest)
				{
					if (minDistanceSqr === undefined || distanceSqr < minDistanceSqr)
					{
						minDistanceSqr = distanceSqr;
						result.nearest = {'dataIndex': i, 'dataValue': value};
					}
				}
			}
		}
		result.range = Kekule.Spectroscopy.Utils.expandDataRange(result.range, result.dataValues);
		return result;
	},
	/** @private */
	_doCalcValueRangeFromIndependentRangeInContinousModeEx: function(independentRanges, centerIndepValue, indepVarSymbols, depVarSymbols, extraOptions)
	{
		// TODO: currently only handles data with one one independent var, but this approach can handle most of the spectrum cases
		//var indepVarSymbols = this.getLocalVarSymbolsOfDependency(Kekule.VarDependency.INDEPENDENT);
		//var depVarSymbols = this.getLocalVarSymbolsOfDependency(Kekule.VarDependency.DEPENDENT);
		if (indepVarSymbols.length > 1)
			return null;
		var indepVarSymbol = indepVarSymbols[0];
		var indepVarRange = independentRanges[indepVarSymbol];
		/*
		var totalDataRange = this.calcDataRange([indepVarSymbol])[indepVarSymbol];
		if (indepVarRange.min < totalDataRange.min)
			indepVarRange.min = totalDataRange.min;
		if (indepVarRange.max > totalDataRange.max)
			indepVarRange.max = totalDataRange.max;
		*/
		var indepV1 = {}, indepV2 = {};
		indepV1[indepVarSymbol] = indepVarRange.min;
		indepV2[indepVarSymbol] = indepVarRange.max;
		var valueEx1 = this._doCalcValueFromIndependentInContinousModeEx(indepV1, extraOptions);
		var valueEx2 = this._doCalcValueFromIndependentInContinousModeEx(indepV2, extraOptions);
		if (!valueEx1 || !valueEx2)
			return null;

		var isIndepValueReversed = (valueEx1.dataIndexes[0] > valueEx2.dataIndexes[0]);
		var rangeDataIndexes = {}
		if (isIndepValueReversed)
		{
			rangeDataIndexes.fromIndex = valueEx2.dataIndexes[1];
			rangeDataIndexes.toIndex = valueEx1.dataIndexes[0];
		}
		else
		{
			rangeDataIndexes.fromIndex = valueEx1.dataIndexes[1];
			rangeDataIndexes.toIndex = valueEx2.dataIndexes[0];
		}

		//var dataValues = [];

		var result = {'range': {}, 'dataIndexes': [], 'dataValues': []};
		for (var i = rangeDataIndexes.fromIndex; i <= rangeDataIndexes.toIndex; ++i)
		{
			var value = this.getHashValueAt(i)
			result.dataValues.push(value);
			result.dataIndexes.push(i);
			result.range = Kekule.Spectroscopy.Utils.expandDataRange(result.range, value);
		}
		result.range = Kekule.Spectroscopy.Utils.expandDataRange(result.range, [valueEx1.value, valueEx2.value]);
		// the leading and tailing values between data points
		if (isIndepValueReversed)
		{
			result.dataValues.push(valueEx1.value);
			result.dataValues.unshift(valueEx2.value);
		}
		else
		{
			result.dataValues.push(valueEx2.value);
			result.dataValues.unshift(valueEx1.value);
		}
		result.dataIndexes.push(-1);
		result.dataIndexes.unshift(-1);

		return result;
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
	},

	// methods about comparison
	/** @ignore */
	getComparisonPropNames: function(options)
	{
		var result = this.tryApplySuper('getComparisonPropNames', [options]);
		if (result)
		{
			result = AU.exclude(result, ['parent', 'owner']);  // parent is a spectrum object, causing recursions in comparison
			AU.pushUnique(result, 'dataItems');   // the data items property is private, and will not be added to comparison by default
		}
		return result;
	},
	/** @ignore */
	doGetComparisonPropNames: function(options)
	{
		var result = this.tryApplySuper('doGetComparisonPropNames', [options]);
		if (options.method === Kekule.ComparisonMethod.CHEM_STRUCTURE)
		{
			result = (result || []).concat(/*'name', 'title',*/  'defPeakRoot', 'localVarInfos', 'mode', 'dataItems');
		}
		return result;
	},
	/** @ignore */
	doCompareProperty: function(targetObj, propName, options)
	{
		if (propName === 'dataItems')
		{
			//console.log('compare dataItems', this.doCompareDataItems(this, targetObj, options));
			// the values in dataItems are float, so they need to be compared with NumUtils
			return this.doCompareDataItems(this, targetObj, options);
		}
		else if (propName === 'localVarInfos')
		{
			//console.log('compare localVarInfos', this.doCompareLocalVarInfos(this, targetObj, options));
			return this.doCompareLocalVarInfos(this, targetObj, options);
		}
		else
		{
			//console.log('compare property', propName, this.tryApplySuper('doCompareProperty', [targetObj, propName, options]));
			return this.tryApplySuper('doCompareProperty', [targetObj, propName, options]);
		}
	},
	/** @private */
	doCompareLocalVarInfos: function(section1, section2, options)
	{
		var varInfos1 = section1.getActualLocalVarInfos();
		var varInfos2 = section2.getActualLocalVarInfos();
		var result = varInfos1.length - varInfos2.length;
		if (!result && !(options.method === Kekule.ComparisonMethod.CHEM_STRUCTURE)) // local var info should not affect spectrum data greatly
		{
			for (var i = 0, l = varInfos1.length; i < l; ++i)
			{
				var info1 = varInfos1[i];
				var info2 = varInfos2[i];
				result = Kekule.ObjComparer.compare(info1, info2, options);
				if (result)
					break;
			}
		}
		//var result = this.doCompareOnValue(varInfos1, varInfos2, options);
		//console.log('varinfo', result, varInfos1, varInfos2);
		if (!result)  // further compare the var definitions of
		{
			for (var i = 0, l = varInfos1.length; i < l; ++i)
			{
				var def1 = section1.getLocalVarDef(i);
				var def2 = section1.getLocalVarDef(i);
				result = this.doCompareOnValue(def1, def2, options);
				if (result)
					break;
			}
		}
		return result;
	},
	/** @private */
	doCompareDataItems: function(section1, section2, options)
	{
		var getArrayValueAt = function(section, i)
		{
			var hashValue = section.getHashValueAt(i);
			return section._itemHashToArray(hashValue);
		};
		var result = section1.getDataCount() - section2.getDataCount();
		//console.log('dataCount', section1.getDataCount(), section2.getDataCount());
		if (!result)
		{
			for (var i = 0, l = section1.getDataCount(); i < l; ++i)
			{
				/*
				var rawValue1 = section1.getRawValueAt(i);
				var rawValue2 = section2.getRawValueAt(i);
				result = this._compareDataRawValue(rawValue1, rawValue2, options);
				*/
				var value1 = getArrayValueAt(section1, i);
				var value2 = getArrayValueAt(section1, i);
				result = this._compareDataRawValue(value1, value2, options);
				// and the extra info of value
				if (!result)
				{
					var extra1 = section1.getExtraInfoAt(i) || null;
					var extra2 = section2.getExtraInfoAt(i) || null;
					// empty spectrum peak details should be regarded as containing no information
					if (extra1 && extra1.isEmpty())
						extra1 = null;
					if (extra2 && extra2.isEmpty())
						extra2 = null;
					result = this.doCompareOnValue(extra1, extra2, options);
					//console.log('compare extra', i, extra1, extra2, result);
				}
				if (result)
				{
					//console.log('compare', i, value1, value2, result);
					break;
				}
			}
		}
		return result;
	},
	/** @private */
	_compareDataRawValue: function(v1, v2, options)
	{
		var result;
		if (!v1 && !v2)
			return 0;
		else if (v1 && !v2)
			return 1;
		else if (!v1 && v2)
			return -1;
		else
		{
			result = (v1.length || -1) - (v2.length || -1);
			if (!result)  // compare each values
			{
				var NumUtils = Kekule.NumUtils;
				var errorRate = options.allowedComparisonErrorRate || Kekule.globalOptions.spectrum.data.allowedComparisonErrorRate || 5e-8;
				for (var i = 0, l = v1.length; i < l; ++i)
				{
					var value1 = v1[i];
					var value2 = v2[i];
					if (NumUtils.isNormalNumber(value1) && NumUtils.isNormalNumber(value2))
					{
						if (NumUtils.isFloatEqual(value1, value2, Math.abs(value1 * errorRate)))  // TODO: the error value is fixed now
							result = 0;
						else
						{
							result = Math.sign(value1 - value2);
							//console.log('float diff', value1, value2);
						}
					}
					else
						result = this.doCompareOnValue(v1, v2, options)
					if (result)
						break;
				}
			}
		}
		return result;
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
			sections.setOwner(this.getOwner());
			//this.createSection(this.getVariables());  // create a default section
		},
		doFinalize: function ()
		{
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
		initProperties: function ()
		{
			this.defineProp('owner', {
				'dataType': 'Kekule.ChemSpace',
				'serializable': false,
				'scope': Class.PropertyScope.PUBLIC,
				'getter': function()
				{
					return this.getPropStoreFieldValue('owner') || this._getDefaultOwner();
				},
				'setter': function(value)
				{
					if (value !== this.getPropStoreFieldValue('owner'))
					{
						this.setPropStoreFieldValue('owner', value);
						var newOwner = this.getOwner();
						var sections = this.getSections();
						if (sections)
							sections.setOwner(newOwner);
					}
				}
			});
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
					if (old !== value)
					{
						if (old)
						{
							old.finalize();
						}
						if (value)
						{
							value._transparent = true;  // force the obj list be transparent
							value.setParent(this.getParent() || this);
							value.setOwner(this.getOwner());
						}
						this.setPropStoreFieldValue('sections', value);
					}
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
		_getDefaultOwner: function()
		{
			var parent = this.getParent();
			return parent && parent.getOwner && parent.getOwner();  // always returns the owner of parent spectrum
		},
		/** @private */
		getHigherLevelObj: function ()
		{
			return this.getParent();
		},
		/** @ignore */
		getChildHolder: function ()
		{
			return this.getSections();
		},

		/** @ignore */
		loaded: function(rootObj)
		{
			var sections = this.getSections();
			if (sections)
			{
				sections.parentChanged(this);
				sections.ownerChanged(this.getOwner());
			}
			this.tryApplySuper('loaded', [rootObj]);
		},

		/**
		 * Check if there are concrete data in child data sections.
		 * @returns {Bool}
		 */
		isEmpty: function()
		{
			var result = true;
			for (var i = 0, l = this.getSectionCount(); i < l; ++i)
			{
				if (!this.getSectionAt(i).isEmpty())
					return false;
			}
			return result;
		},

		/**
		 * Create and append a new {@link Kekule.Spectroscopy.SpectrumDataSection}.
		 * @param {Array} variables Array of local variable symbol or definition used by secion.
		 * @param {Int} mode
		 * @returns {Kekule.Spectroscopy.SpectrumDataSection}
		 */
		createSection: function (variables, mode) {
			var result = new Kekule.Spectroscopy.SpectrumDataSection(undefined, this, variables);
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
		 * @param {Hash} options Extra calculation options, same as the options in {@link Kekule.Spectroscopy.SpectrumDataSection.calcDataRange}.
		 * @returns {Hash}
		 */
		calcDataRangeOfSections: function (sections, targetVariables, options) {
			var result = {};
			for (var i = 0, l = sections.length; i < l; ++i) {
				var range = sections[i].calcDataRange(targetVariables, options);
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
	 * Set the extra information of a data value in current active section.
	 * @param {Variant} value Data value in hash or array form.
	 * @param {Hash} info
	 */
	setExtraInfoOf: function(value, info)
	{
		this.getActiveSection().setExtraInfoOf(value, info);
		return this;
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
 * Spectrum peak shape enumeration.
 * @enum
 */
Kekule.Spectroscopy.PeakShape = {
	SHARP: 'sharp',
	BROAD: 'broad'
};
/**
 * Spectrum peak multiplicity enumeration.
 * @enum
 */
Kekule.Spectroscopy.PeakMultiplicity = {
	UNKNOWN: 0,
	SINGLET: 1,
	DOUBLET: 2,
	TRIPLET: 3,
	QUARTET: 4,
	QUINTET: 5,
	SEXTUPLET: 6,
	DOUBLE_DOUBLET: 22,
	TRIPLE_DOUBLET: 32,
	MULTIPLET: 255
};

/**
 * A special class to store the extra information of spectrum data value (e.g. the assignment ref object of peak).
 * @class
 * @augments Kekule.ChemObject
 *
 * @param {Hash} params
 *
 * @property {Kekule.ChemObject} assignments The assignment targets array of peak, usually containing only an atom or a bond.
 * @property {Kekule.ChemObject} assignment The assignment target of peak, first item of {@link Kekule.Spectroscopy.SpectrumDataDetails.assignments}, usually an atom or a bond.
 */
Kekule.Spectroscopy.SpectrumDataDetails = Class.create(Kekule.ChemObject,
/** @lends Kekule.Spectroscopy.SpectrumDataDetails# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Spectroscopy.SpectrumDataDetails',
	/** @private */
	initialize: function(params)
	{
		this.setPropStoreFieldValue('assignments', []);
		this.tryApplySuper('initialize', []);
		this.setPropValues(params);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('assignments', {'dataType': DataType.ARRAY, 'objRef': true, 'autoUpdate': true,
			'setter': function(value)
			{
				var a = value? (DataType.isArrayValue(value)? AU.clone(value): AU.toArray(value)): [];
				this.setPropStoreFieldValue('assignments', a);
			}
		});
		this.defineProp('assignment', {'dataType': 'Kekule.ChemObject', 'serializable': false, 'scope': Class.PropertyScope.PUBLIC,
			'getter': function() { return (this.getAssignments() || [])[0]; },
			'setter': function(value) { this.setAssignments(value); }
		});
	},
	/** @ignore */
	doFinalize: function()
	{
		this.setPropStoreFieldValue('assignments', null);
		this.tryApplySuper('doFinalize');
	},
	/** @ignore */
	getAutoIdPrefix: function()
	{
		return 'd';
	},
	/** @ignore */
	isEmpty: function()
	{
		var assignments = this.getAssignments();
		return (!assignments || !assignments.length);
	},
	/**
	 * Returns whether this peak detail has assignments info.
	 * @returns {Bool}
	 */
	hasAssignments: function()
	{
		var a = this.getAssignments();
		return !!(a && a.length);
	},
	/** @ignore */
	doGetComparisonPropNames: function(options)
	{
		var result = this.tryApplySuper('doGetComparisonPropNames', [options]);
		if (options.method === Kekule.ComparisonMethod.CHEM_STRUCTURE)
		{
			result = result || [];
			result.unshift('assignments');
		}
		return result;
	}
});

/**
 * A special class to store the additional peak information (e.g. the assignment ref object of peak, the peak shape, multiplicity).
 * @class
 * @augments Kekule.Spectroscopy.SpectrumDataDetails
 *
 * @property {String} shape Shape of peak, usually be set with value from {@link Kekule.Spectroscopy.PeakShape}.
 * @property {VARIANT} multiplicity Multiplicity of peak.
 *   Usually be set with value from {@link Kekule.Spectroscopy.PeakMultiplicity}, but a custom string value (e.g. 'triplet121') is also allowed.
 */
Kekule.Spectroscopy.SpectrumPeakDetails = Class.create(Kekule.Spectroscopy.SpectrumDataDetails,
/** @lends Kekule.Spectroscopy.SpectrumPeakDetails# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Spectroscopy.SpectrumPeakDetails',
	/** @private */
	initProperties: function()
	{
		this.defineProp('shape', {'dataType': DataType.STRING});
		this.defineProp('multiplicity', {'dataType': DataType.VARIANT});
	},
	/** @ignore */
	getAutoIdPrefix: function()
	{
		return 'p';
	},
	/** @ignore */
	isEmpty: function()
	{
		var result = this.tryApplySuper('isEmpty');
		result = result && !this.getShape() && Kekule.ObjUtils.isUnset(this.getMultiplicity());
		return result;
	},
	/** @ignore */
	doGetComparisonPropNames: function(options)
	{
		var result = this.tryApplySuper('doGetComparisonPropNames', [options]);
		if (options.method === Kekule.ComparisonMethod.CHEM_STRUCTURE)
		{
			result = result || [];
			result.unshift('shape');
			result.unshift('multiplicity');
		}
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
 * The base spectrum class. Concrete spectrum classes should be inherited from this one.
 * @class
 * @augments Kekule.ChemObject
 *
 * @property {String} spectrumType Type of spectrum, value from {@link Kekule.Spectroscopy.SpectrumType}.
 * @property {String} name Name of spectrum.
 * @property {String} title Title of spectrum.
 * @property {Hash} metaData Meta information of spectrum.
 * @property {Hash} conditions Conditions of spectrum.
 * @property {Hash} parameters Important parameters of spectrum.
 * @property {Hash} annotations Additional annotations of spectrum.
 * @property {Kekule.Spectroscopy.SpectrumData} data Spectrum data.
 * @property {Array} refMolecules Related molecules to spectrum.
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
		this.setPropStoreFieldValue('refMolecules', null);
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
		//this.defineProp('title', {'dataType': DataType.STRING});
		this.defineProp('data', {'dataType': 'Kekule.Spectroscopy.SpectrumData',
			'setter': function(value)
			{
				var old = this.getData();
				if (value !== old)
				{
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
			}
		});
		this.defineProp('refMolecules', {'dataType': DataType.ARRAY, 'objRef': true, 'autoUpdate': true,
			'setter': function(value)
			{
				var a = value? (DataType.isArrayValue(value)? AU.clone(value): AU.toArray(value)): [];
				this.setPropStoreFieldValue('refMolecules', a);
			}
		});
		this.defineProp('refMolecule', {'dataType': 'Kekule.Molecule', 'serializable': false, 'scope': Class.PropertyScope.PUBLIC,
			'getter': function() { return (this.getRefMolecules() || [])[0]; },
			'setter': function(value) { this.setrRefMolecules(value); }
		});
		/*
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
		*/
		this._defineInfoProperty('title');
		this._defineInfoProperty('metaData', null, {'dataType': DataType.HASH});
		this._defineInfoProperty('conditions', null, {'dataType': DataType.HASH});
		this._defineInfoProperty('parameters', null, {'dataType': DataType.HASH});
		this._defineInfoProperty('annotations', null, {'dataType': DataType.HASH});
		this._defineDataDelegatedProperty('variables');
		this._defineDataDelegatedProperty('varSymbols');
		this._defineDataDelegatedProperty('dataSections', 'sections');
		this._defineDataDelegatedProperty('activeDataSectionIndex', 'activeSectionIndex');
		this._defineDataDelegatedProperty('activeDataSection', 'activeSection');
	},
	/** @private */
	_initDelegatedMethods: function()
	{
		this._defineDataDelegatedMethod('isEmpty');
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
		this._defineDataDelegatedMethod('getVariableCount');
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
			var name = infoFieldName || propName;
			var name2 = name.upperFirst();
			defs = Object.extend({
				'getter': function () {
					return this.getInfoValue(name) || this.getInfoValue(name2);
				},
				'setter': function(value) {
					this.setInfoValue(name, value);
				},
				'serializable': false
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
			var target = this.getData();
			var result = target[dataMethodName].apply(target, arguments);
			if (result === target)  // fix for chaining calling of method
				result = this;
			return result;
		}
	},

	/** @ignore */
	getAutoIdPrefix: function()
	{
		return 's';
	},

	/** @ignore */
	ownerChanged: function(/*$super, */newOwner, oldOwner)
	{
		// change the owner of child data and sections
		var data = this.getData();
		if (data)
			data.setOwner(newOwner);
		this.tryApplySuper('ownerChanged', [newOwner, oldOwner]);
	},
	/** @ignore */
	isEmpty: function()
	{
		if (this.getDataSectionCount() <= 0)
			return true;
		else
		{
			for (var i = 0, l = this.getDataSectionCount(); i < l; ++i)
			{
				if (!this.getDataSectionAt(i).isEmpty())
					return false;
			}
			return true;
		}
	},

	/** @ignore */
	getChildSubgroupNames: function()
	{
		return ['dataSection'].concat(this.tryApplySuper('getChildSubgroupNames'));
	},
	/** @ignore */
	getBelongChildSubGroupName: function(obj)
	{
		if (obj instanceof Kekule.Spectroscopy.SpectrumDataSection)
			return 'dataSection';
		else
			return this.tryApplySuper('getBelongChildSubGroupName', [obj]);
	},
	/** @ignore */
	doGetChildCount: function()
	{
		return this.getDataSectionCount();
	},
	/** @ignore */
	doGetChildAt: function(index)
	{
		return this.getDataSectionAt(index);
	},
	/** @ignore */
	doIndexOfChild: function(obj)
	{
		return this.indexOfDataSection(obj);
	},

	/** @private */
	_getCandidateInfoPropNames: function(baseName)
	{
		if (baseName.indexOf(MetaPropNamespace.DELIMITER) >= 0)  // already in namespace form
			return [baseName];
		var prefixes = MetaPropNamespace.getNamespaces();
		var spectrumType = this.getSpectrumType();
		if (spectrumType)
		{
			prefixes = [spectrumType].concat(prefixes);
		}
		var result = [baseName];  // the core name will always be in candicates
		for (var i = 0, l = prefixes.length; i < l; ++i)
		{
			result.push(prefixes[i] + MetaPropNamespace.DELIMITER + baseName);
		}
		return result;
	},
	/** @private */
	_getSpectrumInfoValueOfCategory: function(category, key)
	{
		var hash = category? this.getInfoValue(category): this.getInfo();
		if (!hash)
			return undefined;
		if (Kekule.globalOptions.spectrum.spectrumInfo.enablePrefixOmissionInGetter)
		{
			var candicateNames = this._getCandidateInfoPropNames(key);
			for (var i = 0, l = candicateNames.length; i < l; ++i)
			{
				var name = candicateNames[i];
				if (hash[name] !== undefined)
					return hash[name];
			}
			return undefined;
		}
		else
			return hash[key];
	},
	/**
	 * Set the spectrum info value of a category.
	 * @param {String} category
	 * @param {String} key
	 * @param {Variant} value
	 */
	setSpectrumInfoValue: function(category, key, value)
	{
		if (category)
		{
			var hash = this.getInfoValue(category);
			if (!hash)
			{
				hash = {};
				this.setInfoValue(category, hash);
			}
			hash[key] = value;
		}
		else
			this.setInfoValue(key, value);
		return this;
	},
	/**
	 * Returns all keys of a spectrum info category.
	 * @param {String} spectrumInfoCategory
	 * @returns {Array}
	 */
	getSpectrumInfoKeysOfCategory: function(spectrumInfoCategory)
	{
		if (spectrumInfoCategory)
		{
			var hash = this.getInfoValue(spectrumInfoCategory);
			return hash ? Kekule.ObjUtils.getOwnedFieldNames(hash, false) : [];
		}
		else if (spectrumInfoCategory === '')  // retrieve the keys at the top level of info property
		{
			var result = this.getInfoKeys();
			result = AU.exclude(result, this.getSpectrumInfoCategories());
			return result;
		}
		else
			return [];
	},
	/**
	 * Returns the spectrum info category names existed in current spectrum.
	 * @returns {Array}
	 */
	getSpectrumInfoCategories: function()
	{
		var candicateCategories = ['metaData', 'conditions', 'parameters', 'annotations'];
		var result = [];
		for (var i = 0, l = candicateCategories.length; i < l; ++i)
		{
			var c = candicateCategories[i];
			var keys = this.getSpectrumInfoKeysOfCategory(c);
			if (keys && keys.length)
				result.push(c);
		}
		return result;
	},
	/**
	 * Returns value of spectrum meta/condition/parameter/annotation.
	 * @param {String} key
	 * @param {Variant} candicateCategories A single category or an array of categories.
	 * @returns {Variant}
	 */
	getSpectrumInfoValue: function(key, candicateCategories)
	{
		var categories;
		if (!candicateCategories)
			categories = ['conditions', 'parameters', 'metaData', 'annotations', ''];
		else
			categories = AU.toArray(candicateCategories);
		for (var i = 0, l = categories.length; i < l; ++i)
		{
			var c = categories[i];
			var v = this._getSpectrumInfoValueOfCategory(c, key);
			if (Kekule.ObjUtils.notUnset(v))
				return v;
		}
		return undefined;
	},
	/**
	 * Returns the value of a spectrum meta data.
	 * @param {String} key
	 * @returns {Variant}
	 */
	getMeta: function(key)
	{
		return this._getSpectrumInfoValueOfCategory('metaData', key);
	},
	/**
	 * Set the value of a spectrum meta data.
	 * @param {String} key
	 * @param {Variant} value
	 */
	setMeta: function(key, value)
	{
		this.setSpectrumInfoValue('metaData', key, value);
		return this;
	},
	/**
	 * Returns all the keys of spectrum parameter list.
	 * @returns {Array}
	 */
	getMetaKeys: function()
	{
		return this.getSpectrumInfoKeysOfCategory('metaData');
	},
	/**
	 * Returns the value of a spectrum condition.
	 * @param {String} key
	 * @returns {Variant}
	 */
	getCondition: function(key)
	{
		return this._getSpectrumInfoValueOfCategory('conditions', key);
	},
	/**
	 * Set the value of a spectrum condition.
	 * @param {String} key
	 * @param {Variant} value
	 */
	setCondition: function(key, value)
	{
		this.setSpectrumInfoValue('conditions', key, value);
		return this;
	},
	/**
	 * Returns all the keys of spectrum condition list.
	 * @returns {Array}
	 */
	getConditionKeys: function()
	{
		return this.getSpectrumInfoKeysOfCategory('conditions');
	},
	/**
	 * Returns the value of a spectrum parameter.
	 * @param {String} key
	 * @returns {Variant}
	 */
	getParameter: function(key)
	{
		return this._getSpectrumInfoValueOfCategory('parameters', key);
	},
	/**
	 * Set the value of a spectrum parameter.
	 * @param {String} key
	 * @param {Variant} value
	 */
	setParameter: function(key, value)
	{
		this.setSpectrumInfoValue('parameters', key, value);
		return this;
	},
	/**
	 * Returns all the keys of spectrum parameter list.
	 * @returns {Array}
	 */
	getParameterKeys: function()
	{
		return this.getSpectrumInfoKeysOfCategory('parameters');
	},
	/**
	 * Returns the value of a spectrum annotation.
	 * @param {String} key
	 * @returns {Variant}
	 */
	getAnnotation: function(key)
	{
		return this._getSpectrumInfoValueOfCategory('annotations', key);
	},
	/**
	 * Set the value of a spectrum annotation.
	 * @param {String} key
	 * @param {Variant} value
	 */
	setAnnotation: function(key, value)
	{
		this.setSpectrumInfoValue('annotations', key, value);
		return this;
	},
	/**
	 * Returns all the keys of spectrum annotation list.
	 * @returns {Array}
	 */
	getAnnotationKeys: function()
	{
		return this.getSpectrumInfoKeysOfCategory('annotations');
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

	// methods about object comparison
	/** @ignore*/
	getComparisonPropNames: function(options)
	{
		var result = this.tryApplySuper('getComparisonPropNames', [options]);
		// remove data property from comparison, since dataSections property are included
		var index = result.indexOf('data');
		if (index >= 0)
			result.splice(index, 1);
		//console.log('props', result);
		return result;
	},
	/** @ignore*/
	doGetComparisonPropNames: function(options)
	{
		var result = this.tryApplySuper('doGetComparisonPropNames', [options]);
		if (options.method === Kekule.ComparisonMethod.CHEM_STRUCTURE)
		{
			// variables will be compared at the dataSections level, so it should not be included here
			result = (result || []).concat([
				'refMolecules', 'metaData', 'conditions', 'parameters', /*'variables',*/ 'dataSections',
				//'_spectrumInfos_'   // a fake property, to manually comparing on metaData/conditions/parameters
			]);
		}
		return result;
	},
	/** @ignore */
	doCompareProperty: function(targetObj, propName, options)
	{
		if (propName === 'dataSections' && options.method === Kekule.ComparisonMethod.CHEM_STRUCTURE)
		{
			// dataSections is a ChemObjList, when comparing, we extract the section array directly
			var sections1 = this.getDataSections().getItems();
			var sections2 = targetObj.getDataSections().getItems();
			//console.log('compare', propName, this.doCompareOnValue(sections1, sections2, options));
			return this.doCompareOnValue(sections1, sections2, options);
		}
		else if (['metaData', 'conditions', 'parameters'].indexOf(propName) >= 0)
		{
			//var candicateCategories = ['metaData', 'conditions', 'parameters'];
			var widerCandicateCategories = ['metaData', 'conditions', 'parameters', 'annotations'];
			var srcKeys = this.getSpectrumInfoKeysOfCategory(propName); //(this.getMetaKeys() || []).concat(this.getParameterKeys() || []).concat(this.getConditionKeys() || []);
			for (var i = 0, l = srcKeys.length; i < l; ++i)
			{
				var key = srcKeys[i];
				var v1 = this.getSpectrumInfoValue(key, [propName]);
				var v2 = targetObj.getSpectrumInfoValue(key, widerCandicateCategories);
				if (Kekule.ObjUtils.isUnset(v2))
				{
					var coreKey = MetaPropNamespace.getPropertyCoreName(key);
					v2 = targetObj.getSpectrumInfoValue(coreKey, widerCandicateCategories);
				}
				var result = this.doCompareOnValue(v1, v2, options);
				if (result)
				{
					//console.log('diff', key, v1, v2, result);
					return result;
				}
				else
				{
					//console.log('same', key, v1, v2, result);
				}
			}
			return 0;
		}
		else
		{
			//var result = this.tryApplySuper('doCompareProperty', [targetObj, propName, options]);
			var v1 = this.getPropValue(propName);
			var v2 = targetObj.getPropValue(propName);
			var result = this.doCompareOnValue(v1, v2, options);
			//console.log('compare', propName, v1, v2, result);
			return result;
		}
	}

	/*
	 * Returns all keys in {@link Kekule.Spectroscopy.Spectrum#spectrumParams} property.
	 * @returns {Array}
	 */
	/*
	getSpectrumParamKeys: function()
	{
		return this.getSpectrumParams()? Kekule.ObjUtils.getOwnedFieldNames(this.getSpectrumParams()): [];
	},
	*/
	/*
	 * Get param value from {@link Kekule.Spectroscopy.Spectrum#spectrumParams}.
	 * @param {String} key
	 * @returns {Variant}
	 */
	/*
	getSpectrumParam: function(key)
	{
		return this.getSpectrumParams()? this.getSpectrumParams()[key]: null;
	},
	*/
	/*
	 * Set value of a spectrum param. If key already exists, its value will be overwritten.
	 * @param {String} key
	 * @param {Variant} value
	 */
	/*
	setSpectrumParam: function(key, value)
	{
		this.doGetSpectrumParams(true)[key] = value;
		this.notifyPropSet('spectrumParams', this.getPropStoreFieldValue('spectrumParams'));
	}
	*/
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

	// MS
	register('counts', 'ms_count', 'Misc', null);
	register('relative abundance', 'ms_relative_abundance', 'SpectrumMS', null);
	register('m/z', 'ms_mass_charge_ratio', 'SpectrumMS', null);

})();

})();