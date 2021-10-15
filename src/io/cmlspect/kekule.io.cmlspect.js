/**
 * @fileoverview
 * File for supporting CMLSpect (The CML dialect for spectrum data).
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /lan/xmlJsons.js
 * requires /core/kekule.common.js
 * requires /utils/kekule.domHelper.js
 * requires /spectroscopy/kekule.spectrum.core.js
 * requires /io/kekule.io.js
 * requires /io/cml/kekule.io.cml.js
 * requires /localization
 */

(function(){

"use strict";

var AU = Kekule.ArrayUtils;
var OU = Kekule.ObjUtils;
var DU = Kekule.DomUtils;

var SPS = Kekule.Spectroscopy.PeakShape;
var SPM = Kekule.Spectroscopy.PeakMultiplicity

// add additional unit conversion map data
Kekule.IO.CmlUtils._cmlUnitConvMap.push(['moverz', 'm/z', 'm/z']);

/**
 * Util functions for CMLSpect data.
 * @class
 */
Kekule.IO.CmlSpectUtils = {
	/** @private */
	_peakShapeMap: [
		['sharp', SPS.SHARP],
		['broad', SPS.BROAD]
	],
	/** @private */
	_peakMultiplicityMap: [
		['singlet', SPM.SINGLET],
		['doublet', SPM.DOUBLET],
		['triplet', SPM.TRIPLET],
		['quartet', SPM.QUARTET],
		['quintet', SPM.QUINTET],
		['sextuplet', SPM.SEXTUPLET],
		['multiplet', SPM.MULTIPLET]
	],
	/** @private */
	_spectrumParamterKeyMap: [
		['cml:field', 'observeFrequency'],  //???
		['jcamp:NMR_OBSERVEFREQUENCY', 'observeFrequency'],
		['jcamp:NMR_OBSERVENUCLEUS', 'nucleus'],
		['nmr:OBSERVENUCLEUS', 'nucleus'],
		['jcamp:resolution', 'resolution']
	],
	/**
	 * Get the corresponding {@link Kekule.Spectroscopy.SpectrumType} value for a CML spectrum type string.
	 * @param {String} cmlSpectrumType
	 * @returns {String}
	 */
	cmlSpectrumTypeToKekule: function(cmlSpectrumType)
	{
		var ST = Kekule.Spectroscopy.SpectrumType;
		var valueTypeMap = [
			['nmr', ST.NMR],
			//['ir', ST.IR],
			['infrared', ST.IR],
			['mass', ST.MS],
			['uv', ST.UV_VIS],
			['vis', ST.UV_VIS]
		];
		var sType = ST.GENERAL;  // default
		var tValue = cmlSpectrumType.toLowerCase();
		for (var i = 0, l = valueTypeMap.length; i < l; ++i)
		{
			var item = valueTypeMap[i];
			if (tValue.indexOf(item[0]) >= 0)
			{
				sType = item[1];
				break;
			}
		}
		return sType;
	},
	/**
	 * Returns a key name for Kekule spectrum corresponding to the CML parameter key.
	 * @param {String} cmlKey
	 * @returns {String}
	 */
	cmlSpectrumInfoDataKeyToKekule: function(cmlKey)
	{
		var map = CmlSpectUtils._spectrumParamterKeyMap;
		for (var i = 0, l = map.length; i < l; ++i)
		{
			if (cmlKey === map[i][0])
				return map[i][1];
		}
		return cmlKey;
	},
	/**
	 * Convert a CML peak shape string to value of {@link Kekule.Spectroscopy.PeakShape}.
	 * @param {String} cmlMultiplicity
	 * @returns {String}
	 */
	cmlPeakShapeToKekule: function(cmlPeakShape)
	{
		var map = CmlSpectUtils._peakShapeMap;
		var s = cmlPeakShape.toLowerCase();
		for (var i = 0, l = map.length; i < l; ++i)
		{
			if (s === map[i][0])
				return map[i][1];
		}
		return cmlPeakShape;
	},
	/**
	 * Convert a CML peak multiplicity string to value of {@link Kekule.Spectroscopy.PeakMultiplicity}.
	 * @param {String} cmlMultiplicity
	 * @returns {Variant}
	 */
	cmlPeakMultiplicityToKekule: function(cmlMultiplicity)
	{
		var map = CmlSpectUtils._peakMultiplicityMap;
		var s = cmlMultiplicity.toLowerCase();
		for (var i = 0, l = map.length; i < l; ++i)
		{
			if (s === map[i][0])
				return map[i][1];
		}
		return cmlMultiplicity;
	},

	/**
	 * Try convert a string to float. If fails, the original string will be returned.
	 * @param {String} str
	 * @returns {Variant}
	 */
	tryParseFloat: function(str)
	{
		var result = parseFloat(str);
		return Kekule.NumUtils.isNormalNumber(result)? result: str;
	}
};
var CmlSpectUtils = Kekule.IO.CmlSpectUtils;

/**
 * Reader to read a <peaklist> element inside <spectrum>.
 * @class
 * @augments Kekule.IO.CmlElementReader
 */
Kekule.IO.CmlSpectrumPeakListReader = Class.create(Kekule.IO.CmlElementReader,
/** @lends Kekule.IO.CmlSpectrumPeakListReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlSpectrumPeakListReader',
	/** @ignore */
	doReadElement: function(elem, parentObj, parentReader, options)
	{
		var spectrum = (parentObj instanceof Kekule.Spectroscopy.Spectrum)? parentObj: null;
		if (spectrum)  // we need to set the variables of parent spectrum
		{
			var peaks = [];
			// TODO: ignoring <peakGroup> in list, since lacking the document of <peakGroup>. We simply iterate all child <peak> elements.
			var domHelper = this.getDomHelper();
			var peakElems = domHelper.getElementsByTagNameNS(this.getCoreNamespaceURI(), 'peak', elem);
			var peakReader = Kekule.IO.CmlElementReaderFactory.getReader('peak');
			if (peakReader)
			{
				this.copySettingsToChildHandler(peakReader);
				try
				{
					for (var i = 0, l = peakElems.length; i < l; ++i)
					{
						var peakResult = peakReader.readElement(peakElems[i], null, this);
						if (peakResult)
							peaks.push(peakResult);
					}
				}
				finally
				{
					peakReader.finalize();
				}
			}
			if (peaks.length)
			{
				//var spectrumData = new Kekule.Spectroscopy.SpectrumData();
				var spectrumData = spectrum.getData();
				var varSymbols = this._addPeakVariablesToSpectrumData(peaks, spectrumData, spectrum);
				var result;
				if (varSymbols && varSymbols.length)
				{
					result = new Kekule.Spectroscopy.SpectrumDataSection();
					spectrum.appendDataSection(result);
					result.setLocalVarSymbols(varSymbols);
					//spectrumData.getActiveSection().setMode(Kekule.Spectroscopy.DataMode.PEAK);
					result.setMode(Kekule.Spectroscopy.DataMode.PEAK);
					this._addPeakDataToSpectrumData(peaks, varSymbols, result, spectrumData, spectrum);
				}
				/*
				if (spectrum)
					spectrum.setData(spectrumData);
				return spectrumData;
				*/
				return result;
			}
			else
				return null;
		}
		else
			return null;
	},
	/** @private */
	_analysisPeakVarInfo: function(peaks)  // iterate peaks data and find out the variable informations
	{
		var variableInfos = {};
		var varCount = 0;
		//var
		for (var i = 0, l = peaks.length; i < l; ++i)
		{
			var peak = peaks[i];
			var value = peak.value;
			var symbols = (value && Kekule.ObjUtils.getOwnedFieldNames(value, false)) || [];
			for (var j = 0, k = symbols.length; j < k; ++j)
			{
				if (!variableInfos[symbols[j]])
				{
					variableInfos[symbols[j]] = {};
					++varCount;
				}
			}
			//TODO: fill units info of var, here we simply assume all peaks uses the same units system
			var units = peak.units;
			if (units)
			{
				var symbols = Kekule.ObjUtils.getOwnedFieldNames(units, false) || [];
				for (var j = 0, k = symbols.length; j < k; ++j)
				{
					if (variableInfos[symbols[i]] && !variableInfos[symbols[i]].units)
					{
						var unitSymbol = Kekule.IO.CmlUtils.cmlUnitStrToMetricsUnitSymbol(units[symbols[i]]);
						variableInfos[symbols[i]].units = unitSymbol;
						if (!unitSymbol)
							variableInfos[symbols[i]].title = Kekule.IO.CmlUtils.getCmlNsValueLocalPart(units[symbols[i]]);
					}
				}
			}
		}
		if (varCount <= 0)  // no variables, just returns null
			return null;
		else
			return variableInfos;
	},
	/** @private */
	_addPeakVariablesToSpectrumData: function(peaks, spectrumDataObj, spectrumObj)
	{
		var varSymbols = [];
		var varInfos = this._analysisPeakVarInfo(peaks);
		if (!varInfos)  // no var info, returns directly
			return null;
		var symbols = Kekule.ObjUtils.getOwnedFieldNames(varInfos, false);
		// get the independent var, should be x/X, or the first varibale
		var indepIndex = symbols.indexOf('x');
		if (indepIndex < 0)
			indepIndex = symbols.indexOf('X');
		if (indepIndex < 0)
			indepIndex = 0;

		// ensure the independent var at first
		var indepInfo = symbols.splice(indepIndex, 1);
		symbols.unshift(indepInfo[0]);

		if (symbols.length === 1)   // only one explicit symbol, may be ommitted the y values in NMR?
		{
			if (spectrumObj && spectrumObj.getSpectrumType() === Kekule.Spectroscopy.SpectrumType.NMR)  // we manually add the implicit y
			{
				varInfos.y = {
					'units': Kekule.Unit.Arbitrary.ARBITRARY.symbol,
					'displayLabel': Kekule.Unit.Arbitrary.ARBITRARY.name,
					'defaultValue': 1
				};
				symbols.push('y');
			}
		}

		// add var definitions
		for (var i = 0, l = symbols.length; i < l; ++i)
		{
			var initParams = {
				'symbol': symbols[i],
				'dependency': (i === 0)? Kekule.VarDependency.INDEPENDENT: Kekule.VarDependency.DEPENDENT
			};
			if (varInfos[symbols[i]].title)
				initParams.displayLabel = varInfos[symbols[i]].title;
			if (varInfos[symbols[i]].units)
				initParams.unit = varInfos[symbols[i]].units;

			var varDef = new Kekule.Spectroscopy.SpectrumVarDefinition(initParams);
			spectrumDataObj.appendVariable(varDef);
			if (varInfos[symbols[i]].defaultValue)
				spectrumDataObj.setDefaultVarValue(varDef, varInfos[symbols[i]].defaultValue);

			varSymbols.push(initParams.symbol);
		}

		return varSymbols;  // A flag means variable adding successful
	},
	/** @private */
	_addPeakDataToSpectrumData: function(peaks, varSymbols, spectrumDataSection, spectrumDataObj, spectrumObj)
	{
		for (var i = 0, ii = peaks.length; i < ii; ++i)
		{
			var peak = peaks[i];
			var values = [];
			for (var j = 0, jj = varSymbols.length; j < jj; ++j)
			{
				var symbol = varSymbols[j];
				var value = peak.value[symbol];
				values.push(value);
			}
			this._setPeakDetails(peak, values, spectrumDataObj);
			spectrumDataSection.appendData(values);
		}
	},
	/** @private */
	_setPeakDetails: function(peak, dataValue, spectrumDataObj)
	{
		if (peak.subStructure || peak.multiplicity || peak.shape)
		{
			var detail = new Kekule.Spectroscopy.SpectrumPeakDetails({
				'multiplicity': peak.multiplicity,
				'shape': peak.shape
			});
			if (peak.subStructure)  // has <peakStructure> child element
				detail.setInfoValue('structure', peak.subStructure);
			spectrumDataObj.setExtraInfoOf(dataValue, detail);
			// TODO: atomRef/bondRef is not handled yet
			return detail;
		}
		return null;
	}
});
/**
 * Reader to read a <peak> element inside <spectrum>.
 * @class
 * @augments Kekule.IO.CmlElementReader
 */
Kekule.IO.CmlSpectrumPeakReader = Class.create(Kekule.IO.CmlElementReader,
/** @lends Kekule.IO.CmlSpectrumPeakReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlSpectrumPeakReader',
	/** @ignore */
	doReadElement: function(elem, parentObj, parentReader, options)
	{
		var result = {};
		this.readPeakAttribs(result, elem, this.getDomHelper());
		this.iterateChildElements(elem, result, this, function(childElem, childResult)
		{
			var tagName = DU.getLocalName(childElem);
			var tagNameLower = tagName.toLowerCase();
			if (tagNameLower === 'peakstructure')
			{
				if (!result.subStructure)
					result.subStructure = [];
				result.subStructure.push(childResult);
			}
		});
		return result;
	},
	/** @private */
	readPeakAttribs: function(peakObj, elem, domHelper)
	{
		// important attribs are id, type, title and convention
		var attribs = Kekule.IO.CmlDomUtils.fetchCmlElemAttributeValuesToJson(elem, null, true, domHelper);
		var attribKeys = Kekule.ObjUtils.getOwnedFieldNames(attribs);
		for (var i = 0, l = attribKeys.length; i < l; ++i)
		{
			var key = attribKeys[i];
			var keyLower = key.toLowerCase();
			if (keyLower === 'peakheight')  // regard the peakheight as the same of yValue
			{
				key = 'yValue';
				keyLower = 'yvalue';
			}
			var value = attribs[key];
			if (keyLower.indexOf('units') >= 0)  // xUnits/yUnits attrib
			{
				var symbol = this._getVarSymbolInName(key, 'units');
				if (!peakObj.units)
					peakObj.units = {};
				peakObj.units[symbol] = Kekule.IO.CmlUtils.cmlUnitStrToMetricsUnitSymbol(value);
			}
			else if (keyLower.indexOf('value') >= 0)  // xValue/yValue attrib
			{
				var symbol = this._getVarSymbolInName(key, 'value');
				if (!peakObj.value)
					peakObj.value = {};
				peakObj.value[symbol] = Kekule.IO.CmlSpectUtils.tryParseFloat(value);
			}
			else if (keyLower === 'peakmultiplicity')
			{
				peakObj.multiplicity = CmlSpectUtils.cmlPeakMultiplicityToKekule(value);
			}
			else if (keyLower === 'peakshape')
			{
				peakObj.shape = CmlSpectUtils.cmlPeakShapeToKekule(value);
			}
			else
				peakObj[key] = value;
		}
	},
	/** @private */
	_getVarSymbolInName: function(name, baseName)
	{
		var p = name.toLowerCase().indexOf(baseName.toLowerCase());
		return (p > 0)? name.substring(0, p): null;
	}
});

/**
 * Reader to read a <peakStructure> element inside <spectrum>.
 * @class
 * @augments Kekule.IO.CmlElementReader
 */
Kekule.IO.CmlSpectrumPeakStructureReader = Class.create(Kekule.IO.CmlElementReader,
/** @lends Kekule.IO.CmlSpectrumPeakStructureReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlSpectrumPeakStructureReader',
	/** @ignore */
	doReadElement: function(elem, parentObj, parentReader, options)
	{
		var result = {};
		var attribs = Kekule.IO.CmlDomUtils.fetchCmlElemAttributeValuesToJson(elem, null, true, this.getDomHelper());
		var attribKeys = Kekule.ObjUtils.getOwnedFieldNames(attribs);
		for (var i = 0, l = attribKeys.length; i < l; ++i)
		{
			var key = attribKeys[i];
			var keyLower = key.toLowerCase();
			var value = attribs[key];
			if (keyLower === 'units')
			{
				result.unit = Kekule.IO.CmlUtils.cmlUnitStrToMetricsUnitSymbol(value) || Kekule.IO.CmlUtils.getCmlNsValueLocalPart(value);
			}
			else
				result[key] = value;
		}
		return result;
	}
});

/**
 * Reader to read a <xaxis>/<yaxis> element inside <spectrumData>.
 * @class
 * @augments Kekule.IO.CmlElementReader
 */
Kekule.IO.CmlSpectrumDataAxisReader = Class.create(Kekule.IO.CmlElementReader,
/** @lends Kekule.IO.CmlSpectrumDataAxisReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlSpectrumDataAxisReader',
	/** @private */
	initProperties: function()
	{
		// a private property, stores the symbol of axis
		this.defineProp('axisSymbol', {'dataType': DataType.STRING, 'serializable': false});
		// a private property, stores the array object read from child <array> element
		this.defineProp('childArrayObj', {'dataType': DataType.OBJECT, 'serializable': false});
	},
	/** @private */
	doReadElement: function(elem, parentObj, parentReader, options)
	{
		var tagName = DU.getLocalName(elem).toLowerCase();
		var p = tagName.indexOf('axis');
		var symbol = tagName.substring(0, p);
		var dataMultiplier = DU.getSameNSAttributeValue(elem, 'multiplierToData', this.getDomHelper());
		if (dataMultiplier)
			dataMultiplier = parseFloat(dataMultiplier);
		this.setAxisSymbol(symbol);
		this.tryApplySuper('doReadElement', [elem, parentObj, parentReader]);
		this.iterateChildElements(elem, parentObj, parentReader);
		var result = {
			'symbol': this.getAxisSymbol(),
			'array': this.getChildArrayObj()
		};
		if (dataMultiplier)
			result.dataMultiplier = dataMultiplier;
		//console.log('read axis', tagName, result);
		return result;
	},
	/** @ignore */
	doReadChildElement: function(elem, parentObj, parentReader)
	{
		var tagName = DU.getLocalName(elem).toLowerCase();
		if (tagName === 'array')  // TODO: now we only handles the <array> element inside <axis>
		{
			var reader = Kekule.IO.CmlElementReaderFactory.getReader(elem);
			if (reader)
			{
				this.copySettingsToChildHandler(reader);
				if (reader.setExpandSteppedArray)  // do not expand an array with start/end/size
					reader.setExpandSteppedArray(false);
				if (reader.setDefaultItemDataType)  // automatically convert the values in array to number
					reader.setDefaultItemDataType('xsd:float');
				var arrayObj = reader.readElement(elem, parentObj, parentReader);
				if (arrayObj)
				{
					this.setChildArrayObj(arrayObj);
				}
			}
		}
		else
			return this.tryApplySuper('doReadChildElement', [elem, parentObj, parentReader]);
	}
});

/**
 * Reader to read a <spectrumData> element inside <spectrum>.
 * The <spectrumData> element is used to hold the continous data in CMLSpect.
 * Usually, it should containing child element <xaxis> and <yaxis>.
 * @class
 * @augments Kekule.IO.CmlElementReader
 */
Kekule.IO.CmlSpectrumDataReader = Class.create(Kekule.IO.CmlElementReader,
/** @lends Kekule.IO.CmlSpectrumDataReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlSpectrumDataReader',
	/** @private */
	doReadElement: function(elem, parentObj, parentReader, options)
	{
		if (parentObj instanceof Kekule.Spectroscopy.Spectrum)  // we need to set the variables to parent spectrum
		{
			//var result = new Kekule.Spectroscopy.SpectrumData();
			var result = new Kekule.Spectroscopy.SpectrumDataSection();
			parentObj.appendDataSection(result);
			console.log(parentObj.getData(), parentObj.getData().getActiveSection() === result);
			//var result = this.tryApplySuper('doReadElement', [elem]);  // do not pass parentObj to it, since we will handle with the return values later
			var childResults = this.iterateChildElements(elem, parentObj, parentReader);
			this._handleChildResults(childResults, result);
			// append spectrumData to spectrum
			/*
			if (parentObj && parentObj instanceof Kekule.Spectroscopy.Spectrum)
				parentObj.setData(result);
			*/
			return result;
		}
		//else   // parent is not spectrum, use the default handling process inherited
		//	return this.tryApplySuper('doReadElement', [elem, parentObj, parentReader]);
	},
	/** @private */
	_handleChildResults: function(childResults, spectrumDataSectionObj)
	{
		var axisDataObjs = [];
		for (var i = 0, l = childResults.length; i < l; ++i)
		{
			var childResult = childResults[i];
			var childElem = childResult.element;
			var childElemTagName = DU.getLocalName(childElem).toLowerCase();
			if (childElemTagName.indexOf('axis') >= 0)  // is <xaxis>/<yaxis> child element, need to store the array values of it
			{
				if (childResult.result.symbol.toLowerCase() === 'x')  // ensure xaxis as the first item of axisDataObjs
					axisDataObjs.unshift(childResult.result);
				else
					axisDataObjs.push(childResult.result);
			}
		}
		if (axisDataObjs.length >= 2)   // we should have at least two axis to form a spectrum
			this._fillSpectrumData(axisDataObjs, spectrumDataSectionObj);
	},
	/** @private */
	_fillSpectrumData(axisDataObjs, spectrumDataSectionObj)
	{
		var spectrumObj = spectrumDataSectionObj.getParentSpectrum();
		var spectrumDataObj = spectrumObj.getData();
		var dataSize = 0;
		var localVarSymbols = [];
		// first fill the var definitions and calc the data size
		for (var i = 0, l = axisDataObjs.length; i < l; ++i)
		{
			var isIndependent = (i === 0);  // TODO: here we simply regard the first axis (x) as the independent var
			var varDef = this._createSpectrumDataVariables(axisDataObjs[i], spectrumDataObj, isIndependent);
			spectrumDataObj.appendVariable(varDef);
			localVarSymbols.push(varDef.getSymbol());
			//console.log('varDef', axisDataObjs[i], varDef, spectrumDataObj.getVariables());
			var size = axisDataObjs[i].array.size || (axisDataObjs[i].array.values && axisDataObjs[i].array.values.length);
			if (size > dataSize)
				dataSize = size;
		}
		spectrumDataSectionObj.setLocalVarSymbols(localVarSymbols);
		// then the data
		for (var i = 0; i < dataSize; ++i)
		{
			var dataItem = [];
			for (var j = 0, k = axisDataObjs.length; j < k; ++j)
			{
				var dataMultiplier = axisDataObjs[j].dataMultiplier || 1;
				var arrayValues = axisDataObjs[j].array.values;
				if (!arrayValues)  // a continuous var
					dataItem.push(undefined);
				else
					{
					dataItem.push(arrayValues[i] * dataMultiplier);
				}
			}
			spectrumDataSectionObj.appendData(dataItem);
		}
	},
	/** @private */
	_createSpectrumDataVariables(axisDataObj, spectrumDataObj, isIndependent)
	{
		// fill the variables of sepctrumData
		var symbol = axisDataObj.symbol;
		var initParams = {'symbol': symbol, 'dependency': isIndependent? Kekule.VarDependency.INDEPENDENT: Kekule.VarDependency.DEPENDENT};
		var extraInfo = {};
		var arrayObj = axisDataObj.array;
		var fieldNames = OU.getOwnedFieldNames(arrayObj);
		var hasExtraInfo = false;
		for (var i = 0, l = fieldNames.length; i < l; ++i)
		{
			var fname = fieldNames[i].toLowerCase();
			var value = arrayObj[fieldNames[i]];
			if (fname === 'unit' || fname === 'units')
			{
				initParams.unit = Kekule.IO.CmlUtils.cmlUnitStrToMetricsUnitSymbol(value);
				// if label not set, use unit text as the label
				// this rule is for unit like arbitrary, which do not has a metrics symbol (initParam.unit === ''),
				// setting a display label may help to recognize the graph
				if (!initParams.unit && !initParams.displayLabel)
					initParams.displayLabel = Kekule.IO.CmlUtils.getCmlNsValueLocalPart(value);
			}
			else if (fname === 'title')
			{
				initParams.displayLabel = value;
			}
			else if (fname === 'start' || fname === 'end' || fname === 'size' || fname === 'stepsize')
			{
				// do nothing here, we will handle this continous var info later
			}
			else
			{
				extraInfo[fieldNames[i]] = value;
				hasExtraInfo = true;
			}
		}
		var varDef = new Kekule.Spectroscopy.SpectrumVarDefinition(initParams);
		if (hasExtraInfo)
			varDef.setInfo(extraInfo);
		var isContinuousVar = !arrayObj.values && arrayObj.start && arrayObj.end;
		if (isContinuousVar)
		{
			spectrumDataObj.setContinuousVarRange(varDef, arrayObj.start, arrayObj.end);
		}
		return varDef;
	}
});

/**
 * Reader to read a spectrum in CML <spectrum> tag.
 * @class
 * @augments Kekule.IO.CmlElementReader
 */
Kekule.IO.CmlSpectrumReader = Class.create(Kekule.IO.CmlElementReader,
/** @lends Kekule.IO.CmlSpectrumReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlSpectrumReader',
	/** @constructs */
	initialize: function()
	{
		this.tryApplySuper('initialize');
	},
	/** @private */
	initProperties: function()
	{
		// a private property, convention of this CMLSpect file
		this.defineProp('convention', {'dataType': DataType.STRING,	'serializable': false});
	},
	/** @ignore */
	doReadElement: function(elem, parentObj, parentReader, options)
	{
		return this.readSpectrum(elem, this.getDomHelper());
	},
	/** @ignore */
	doReadChildElement: function(elem, parentObj, parentReader)
	{
		var childElemTagName = DU.getLocalName(elem).toLowerCase();
		if (this._isInfoListElemTagName(childElemTagName))  // handle child list customly, avoid the child reader to write to spectrum object directly
			return this.tryApplySuper('doReadChildElement', [elem, null, parentReader]);
		else
			return this.tryApplySuper('doReadChildElement', [elem, parentObj, parentReader]);
	},
	/* @ignore */
	/*
	doReadChildElement: function(elem, parentObj, parentReader)
	{
		var result = null;
		var tagName = DU.getLocalName(elem).toLowerCase();
		var reader = this._retrieveChildListElemReader(elem, tagName);  // Kekule.IO.CmlElementReaderFactory.getReader(elem);
		if (reader)
		{
			this.copySettingsToChildHandler(reader);
			result = reader.readElement(elem, parentObj, parentReader);
			this._handleObjsReadFromChildListElem(elem, tagName, result);
		}
		return result;
	},
	*/
	/** @private */
	_isInfoListElemTagName: function(tagName)
	{
		return ['metadatalist', 'parameterlist', 'conditionlist', 'substancelist'].indexOf(tagName) >= 0
	},
	/**
	 * Read a <spectrum> element and returns new spectrum object.
	 * @param {Element} elem
	 * @param {Object} domHelper
	 * @returns {Kekule.Spectroscopy.Spectrum}
	 * @private
	 */
	readSpectrum: function(elem, domHelper)
	{
		var result = new Kekule.Spectroscopy.Spectrum();
		this.readSpectrumAttribs(result, elem, domHelper);
		var self = this;
		var childResults = this.iterateChildElements(elem, result, this, function(childElem, childResult){
			self._handleChildResult(childElem, childResult, result);
		});
		return result;
	},
	/** @private */
	readSpectrumAttribs: function(spectrum, elem, domHelper)
	{
		// important attribs are id, type, title and convention
		var attribs = Kekule.IO.CmlDomUtils.fetchCmlElemAttributeValuesToJson(elem, null, true, domHelper);
		var attribKeys = Kekule.ObjUtils.getOwnedFieldNames(attribs);
		for (var i = 0, l = attribKeys.length; i < l; ++i)
		{
			var key = attribKeys[i];
			var value = attribs[key];
			switch (key)
			{
				case 'id':
					spectrum.setId(value);
					break;
				case 'title':
					spectrum.setTitle(value);
					break;
				case 'type':
					var sType = Kekule.IO.CmlSpectUtils.cmlSpectrumTypeToKekule(value);
					spectrum.setSpectrumType(sType);
					break;
				case 'convention':
					this.setConvention(value);
					break;
				default:
					spectrum.setInfoValue(key, value);
			}
		}
	},
	/** @private */
	_handleChildResult: function(childElem, childResult, spectrumObj)
	{
		var childElemTagName = DU.getLocalName(childElem).toLowerCase();
		// the spectrum data should be inserted by the child readers, no need to handle them here
		if (childElemTagName === 'spectrumdata')  // continuous spectrum data
		{
			if (childResult)
			{

			}
		}
		else if (childElemTagName === 'peaklist')  // peak spectrum data
		{
			if (childResult)
			{

			}
		}
		// info data need to be handled manually
		else if (this._isInfoListElemTagName(childElemTagName))
		{
			//console.log('child', childResult);
			this._handleInfoData(childElemTagName, childResult, spectrumObj);
		}
	},
	/** @private */
	_handleInfoData: function(elemTagName, childResult, spectrumObj)
	{
		//console.log(elemTagName, childResult);
		var getSaveMethod = function(elemTagName, spectrumObj)
		{
			var saveMethod = null;
			if (elemTagName === 'metadatalist')
			{
				saveMethod = spectrumObj.setMeta;
			}
			else if (elemTagName === 'parameterlist')
			{
				saveMethod = spectrumObj.setParameter;
			}
			else if (elemTagName === 'conditionlist')
			{
				saveMethod = spectrumObj.setCondition;
			}
			else if (elemTagName === 'substancelist')
			{
				// TODO: substance list not handled
			}
			else
			{
				saveMethod = spectrumObj.setAnnotation;
			}
			return saveMethod;
		}
		//'metadatalist', 'parameterlist', 'conditionlist', 'substancelist'

		var defSaveMethod = getSaveMethod(elemTagName, spectrumObj);
		for (var i = 0, l = childResult.length; i < l; ++i)
		{
			var saveMethod = defSaveMethod;
			var dataItem = childResult[i];
			var key, value;
			if (dataItem.key)  // is key: value pair
			{
				key = dataItem.key;
				value = dataItem.value;
			}
			else if (dataItem instanceof Kekule.Scalar)  // maybe a single scalar object? check for the name
			{
				key = dataItem.getName();
				value = dataItem;
			}
			if (key)
			{
				var kKey = this._convertCmlSpectrumInfoKey(key);
				var handled = this._processCmlSpectrumInfoItem(key, kKey, value, spectrumObj, elemTagName);
				if (!handled)
					saveMethod.apply(spectrumObj, [kKey, value]);
				// TODO: ignore other situations currently
			}
		}
	},
	/** @private */
	_convertCmlSpectrumInfoKey: function(cmlKey)
	{
		var result = CmlSpectUtils.cmlSpectrumInfoDataKeyToKekule(cmlKey);
		var index = result.indexOf(':');
		if (index >= 0)
			result = result.substring(0, index) + '.' + result.substring(index + 1);

		return result;
	},
	/** @private */
	_processCmlSpectrumInfoItem: function(cmlKey, kKey, value, spectrumObj, cmlElemTagName)
	{
		if (kKey === 'observeFrequency')
		{
			// check the scalar value, sometimes in CML the unit is set to hz wrongly, replace it with MHz
			if (value instanceof Kekule.Scalar)
			{
				var numValue = value.getValue();
				var sunit = value.getUnit();
				if (sunit && sunit === Kekule.Unit.Frequency.HERTZ.symbol)
				{
					var freqInMHz = Kekule.UnitUtils.convertValue(numValue, sunit, Kekule.Unit.Frequency.MEGAHERTZ);
					if (freqInMHz < 1)  // maybe set wrongly
						value.setUnit(Kekule.Unit.Frequency.MEGAHERTZ.symbol);
					spectrumObj.setParameter(kKey, value);
					return true;
				}
			}
		}
		else if (kKey === 'nucleus' && typeof(value) === 'string')
		{
			var targetNucleus = (value.indexOf('C') >= 0 && value.indexOf('13') >= 0)?
				Kekule.Spectroscopy.SpectrumNMR.TargetNucleus.C13: Kekule.Spectroscopy.SpectrumNMR.TargetNucleus.H;
			spectrumObj.setParameter('nucleus', targetNucleus);
			return true;
		}
		return false;
	}
});

// register reader classes
var RF = Kekule.IO.CmlElementReaderFactory;
RF.register('spectrum', Kekule.IO.CmlSpectrumReader);
RF.register('peakList', Kekule.IO.CmlSpectrumPeakListReader);
RF.register('peak', Kekule.IO.CmlSpectrumPeakReader);
RF.register('peakStructure', Kekule.IO.CmlSpectrumPeakStructureReader);
RF.register('spectrumData', Kekule.IO.CmlSpectrumDataReader);
RF.register(['parameterList', 'substanceList'], Kekule.IO.CmlBaseListReader);
RF.register(['xaxis', 'yaxis'], Kekule.IO.CmlSpectrumDataAxisReader);

})();