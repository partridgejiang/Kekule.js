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

/*
 * Add default options to read/write CML format data.
 * @object
 */
Kekule.globalOptions.add('IO.cml', {
	enableExtractSampleInsideSpectrum: true,  // if true, when reading molecule out from the child <sample> element of <spectrum>, a parent element will be created to hold both molecule and spectrum
	autoHideSampleInsideSpectrum: true  // if true, the sample molecule inside <spectrum> will be hidden from displaying
});

var AU = Kekule.ArrayUtils;
var OU = Kekule.ObjUtils;
var DU = Kekule.DomUtils;

var SPS = Kekule.Spectroscopy.PeakShape;
var SPM = Kekule.Spectroscopy.PeakMultiplicity

// add additional unit conversion map data
Kekule.IO.CmlUtils._cmlUnitConvMap.push(['moverz', 'm/z', 'm/z']);

/** @private */
Kekule.IO.CML.SPECTRUM_OBJREF_FIELDNAME = '__$objRef$__';
Kekule.IO.CML.SPECTRUM_DATA_OBJREF_FLAG_FIELDNAME = '__$hasObjRef$__'

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
			['ir', ST.IR],
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
	 * Check if a variable definition already existing in spectrum. If true, returns it.
	 * @param {Kekule.Spectroscopy.Spectrum} spectrum
	 * @param {String} varSymbol
	 * @param {String} varUnit
	 * @param {String} name
	 * @param {Int} dependency
	 * @returns {Kekule.Spectroscopy.SpectrumVarDefinition}
	 */
	getSpectrumVarDef: function(spectrum, varSymbol, varUnit, name, dependency)
	{
		if (!dependency)
			dependency = Kekule.VarDependency.INDEPENDENT;
		var varDefs = spectrum.getVariables();
		for (var i = 0, l = varDefs.length; i < l; ++i)
		{
			var varDef = varDefs[i];
			if ((!varSymbol || varSymbol === varDef.getSymbol()) && (!varUnit || varUnit === varDef.getUnit()) && (!name || name === varDef.getName()) && (dependency === varDef.getDependency()))
				return varDef;
		}
		return null;
	}
};
var CmlSpectUtils = Kekule.IO.CmlSpectUtils;

/**
 * CML <sample> element reader.
 * @class
 * @augments Kekule.IO.CmlBaseListReader
 */
Kekule.IO.CmlSampleReader = Class.create(Kekule.IO.CmlBaseListReader,
/** @lends Kekule.IO.CmlSampleReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlSampleReader'
});

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
	/** @constructs */
	initialize: function()
	{
		this.tryApplySuper('initialize');
		this._peakDetailsWithAssignments = [];  // a private field to storing all involved child readers
	},
	/** @ignore */
	doFinalize: function()
	{
		this._peakDetailsWithAssignments = null;
		this.tryApplySuper('doFinalize');
	},
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
			//var peakReader = Kekule.IO.CmlElementReaderFactory.getReader('peak');
			var peakReader = this.doGetChildElementReader('peak');
			if (peakReader)
			{
				//this.copySettingsToChildHandler(peakReader);
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
					//peakReader.finalize();   // child readers will be released at the finalized method of parent reader
				}
			}
			if (peaks.length)
			{
				var result;
				var spectrumData = spectrum.getData();
				var varInfos = this._analysisPeakVarInfo(peaks, spectrum);
				if (varInfos)
				{
					var varSymbols = this._addPeakVariablesToSpectrumData(varInfos, spectrumData, spectrum);
					if (varSymbols && varSymbols.length)
					{
						result = spectrumData.createSection(varSymbols, Kekule.Spectroscopy.DataMode.PEAK); //new Kekule.Spectroscopy.SpectrumDataSection();
						//result.setLocalVarSymbols(varSymbols);
						//result.setMode(Kekule.Spectroscopy.DataMode.PEAK);
						this._setVarLocalInfos(varInfos, result);
						this._addPeakDataToSpectrumData(peaks, varSymbols, result, spectrumData, spectrum);
					}
				}
				return result;
			}
			else
				return null;
		}
		else
			return null;
	},
	/** @ignore */
	doDoneReadingDocument: function()
	{
		// after the document is build, try set the assignments of peaks
		var details = this._peakDetailsWithAssignments;
		for (var i = 0, l = details.length; i < l; ++i)
		{
			var d = details[i];
			if (d instanceof Kekule.Spectroscopy.SpectrumPeakDetails)
			{
				var owner = d.getOwner();
				if (owner && owner.getObjById)
				{
					var ids = d.getInfoValue(Kekule.IO.CML.SPECTRUM_OBJREF_FIELDNAME);
					var objs = [];
					for (var j = 0, k = ids.length; j < k; ++j)
					{
						var id = ids[j];
						var obj = owner.getObjById(id);
						if (obj)
							objs.push(obj);
					}
					if (objs.length)
						d.setAssignments(objs);
					//console.log('set assignment', d, ids, objs);
					delete d.getInfo()[Kekule.IO.CML.SPECTRUM_OBJREF_FIELDNAME];
				}
			}
		}
		this._peakDetailsWithAssignments = [];
	},
	/** @private */
	_analysisPeakVarInfo: function(peaks, spectrumObj)  // iterate peaks data and find out the variable informations
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
		else if (varCount === 1)   // only one explicit symbol, may be ommitted the y values in NMR?
		{
			if (spectrumObj && spectrumObj.getSpectrumType() === Kekule.Spectroscopy.SpectrumType.NMR)  // we manually add the implicit y
			{
				variableInfos.y = {
					'units': Kekule.Unit.Arbitrary.ARBITRARY.symbol,
					'displayLabel': Kekule.Unit.Arbitrary.ARBITRARY.name,
					'defaultValue': 1
				};
			}
		}

		return variableInfos;
	},
	/** @private */
	_addPeakVariablesToSpectrumData: function(varInfos, spectrumDataObj, spectrumObj)
	{
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

		// add var definitions
		var varSymbols = [];
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

			// check if there is already a varDef of this condition
			var varDef = Kekule.IO.CmlSpectUtils.getSpectrumVarDef(spectrumObj, initParams.symbol, initParams.unit, null, initParams.dependency);
			if (varDef && !varDef.getDisplayLabel() && initParams.displayLabel)
				varDef.setDisplayLabel(initParams.displayLabel);
			if (!varDef)
			{
				varDef = new Kekule.Spectroscopy.SpectrumVarDefinition(initParams);
				spectrumDataObj.appendVariable(varDef);
			}
			/*
			if (varInfos[symbols[i]].defaultValue)  // set default value at data section, avoid affect existed varDef in spectrumData
				spectrumDataSection.setDefaultVarValue(varDef, varInfos[symbols[i]].defaultValue);
				//spectrumDataObj.setDefaultVarValue(varDef, varInfos[symbols[i]].defaultValue);
			*/
			varSymbols.push(initParams.symbol);
		}

		return varSymbols;  // A flag means variable adding successful
	},
	/** @private */
	_setVarLocalInfos: function(varInfos, spectrumDataSection)
	{
		var symbols = Kekule.ObjUtils.getOwnedFieldNames(varInfos, false);
		for (var i = 0, l = symbols.length; i < l; ++i)
		{
			var info = varInfos[symbols[i]];
			if (Kekule.ObjUtils.notUnset(info.defaultValue))
			{
				spectrumDataSection.setDefaultVarValue(symbols[i], info.defaultValue);
			}
		}
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
			this._setPeakDetails(peak, values, spectrumDataSection);
			spectrumDataSection.appendData(values);
		}
	},
	/** @private */
	_setPeakDetails: function(peak, dataValue, spectrumDataSection)
	{
		if (peak.subStructure || peak.multiplicity || peak.shape)
		{
			var detail = new Kekule.Spectroscopy.SpectrumPeakDetails({
				'multiplicity': peak.multiplicity,
				'shape': peak.shape
			});
			if (peak.subStructure)  // has <peakStructure> child element
				detail.setInfoValue('structure', peak.subStructure);
			var objRefIds = this._getPeakObjRefIds(peak);
			if (objRefIds)
			{
				detail.setInfoValue(Kekule.IO.CML.SPECTRUM_OBJREF_FIELDNAME, objRefIds);  // save the ref ids, handling it when the spectrum is added to chem space
				//spectrumDataSection[Kekule.IO.CML.SPECTRUM_DATA_OBJREF_FLAG_FIELDNAME] = true;  // flag, indicating the cross ref should be handled later
				this._peakDetailsWithAssignments.push(detail);
			}
			spectrumDataSection.setExtraInfoOf(dataValue, detail);
			return detail;
		}
		return null;
	},
	/** @private */
	_getPeakObjRefIds: function(peak)
	{
		var ids = [];
		for (var i = 0 , l = Kekule.IO.CML.ATOMS_REF_ATTRIBS.length; i < l; ++i)
		{
			var key = Kekule.IO.CML.ATOMS_REF_ATTRIBS[i];
			if (peak[key])
				ids = ids.concat(peak[key].split(/\s/));
		}
		for (var i = 0 , l = Kekule.IO.CML.BONDS_REF_ATTRIBS.length; i < l; ++i)
		{
			var key = Kekule.IO.CML.BONDS_REF_ATTRIBS[i];
			if (peak[key])
				ids = ids.concat(peak[key].split(/\s/));
		}
		var result = [];
		for (var i = 0, l = ids.length; i < l; ++i)
		{
			var id = ids[i].trim();
			if (id)
				result.push(id);
		}
		return result.length? result: null;
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
				peakObj.value[symbol] = Kekule.IO.CmlUtils.tryParseFloat(value);
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
			//var reader = Kekule.IO.CmlElementReaderFactory.getReader(elem);
			var reader = this.doGetChildElementReader(elem);
			if (reader)
			{
				//this.copySettingsToChildHandler(reader);
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
			//console.log(parentObj.getData(), parentObj.getData().getActiveSection() === result);
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
		var axisVarDefParamList = [];
		var localVarSymbols = [];

		// get the var definition informations and calc the data size
		for (var i = 0, l = axisDataObjs.length; i < l; ++i)
		{
			var isIndependent = (i === 0);  // TODO: here we simply regard the first axis (x) as the independent var
			//var varDef = this._addSpectrumDataVariables(axisDataObjs[i], spectrumDataSectionObj, spectrumDataObj, spectrumObj, isIndependent);
			var axisVarDefParams = this._getAxisVarDefParams(axisDataObjs[i], isIndependent);
			axisVarDefParamList.push(axisVarDefParams)
			//spectrumDataObj.appendVariable(varDef);
			//localVarSymbols.push(varDef.getSymbol());
			//localVarSymbols.push(axisVarDefParams.symbol);
			//console.log('varDef', axisDataObjs[i], varDef, spectrumDataObj.getVariables());
			var size = axisDataObjs[i].array.size || (axisDataObjs[i].array.values && axisDataObjs[i].array.values.length);
			if (size > dataSize)
				dataSize = size;
		}

		// create var definitions and local settings
		var localVarSymbols = this._addSpectrumDataVarDefs(axisVarDefParamList, spectrumDataObj, spectrumObj); // add varDef to spectrum first
		spectrumDataSectionObj.setLocalVarSymbols(localVarSymbols);  // then set the local var infos
		this._setDataSectionLocalVarInfos(axisVarDefParamList, spectrumDataSectionObj);

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
	_getAxisVarDefParams: function(axisDataObj, isIndependent)
	{
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
			else if (fname === 'value' || fname === 'values' || fname === 'datatype')  // value of axis, no need to be handled in var definition part
			{

			}
			else
			{
				extraInfo[fieldNames[i]] = value;
				hasExtraInfo = true;
			}
		}
		var isContinuousVar = !arrayObj.values && arrayObj.start && arrayObj.end;
		var continuousInfo;
		if (isContinuousVar)
		{
			continuousInfo = {'start': arrayObj.start, 'end': arrayObj.end};
		}

		return {
			'symbol': symbol,
			'initParams': initParams,
			'continuousInfo': continuousInfo,
			'hasExtraInfo': hasExtraInfo,
			'extraInfo': extraInfo
		};
	},
	/** @private */
	_addSpectrumDataVarDefs: function(axisVarDefParamList, spectrumDataObj, spectrumObj)
	{
		var varSymbols = [];
		for (var i = 0, l = axisVarDefParamList.length; i < l; ++i)
		{
			var varDefParams = axisVarDefParamList[i];
			var initParams = varDefParams.initParams;

			var varDef = Kekule.IO.CmlSpectUtils.getSpectrumVarDef(spectrumObj, initParams.symbol, initParams.unit, null, initParams.dependency);
			if (varDef && !varDef.getDisplayLabel() && initParams.displayLabel)
				varDef.setDisplayLabel(initParams.displayLabel);
			if (!varDef)
			{
				varDef = new Kekule.Spectroscopy.SpectrumVarDefinition(initParams);
				spectrumDataObj.appendVariable(varDef);
			}
			varSymbols.push(varDef.getSymbol());
		}
		return varSymbols;
	},
	/** @private */
	_setDataSectionLocalVarInfos: function(axisVarDefParamList, spectrumDataSection)
	{
		for (var i = 0, l = axisVarDefParamList.length; i < l; ++i)
		{
			var varDefParams = axisVarDefParamList[i];
			var varSymbol = varDefParams.symbol;
			var continuousInfo = varDefParams.continuousInfo;
			if (continuousInfo)
			{
				spectrumDataSection.setContinuousVarRange(varSymbol, continuousInfo.start, continuousInfo.end);
			}
			if (varDefParams.hasExtraInfo)
			{
				var extraInfo = varDefParams.extraInfo;
				var fnames = Kekule.ObjUtils.getOwnedFieldNames(extraInfo);
				for (var i = 0, l = fnames.length; i < l; ++i)
				{
					spectrumDataSection.setLocalVarInfoValue(varSymbol, fnames[i], extraInfo[fnames[i]]);
				}
			}
		}
	}
	/* @private */
	/*
	_addSpectrumDataVariables(axisDataObj, spectrumDataSection, spectrumDataObj, spectrumObj, isIndependent)
	{
		// fill the variables of spectrumData
		var axisVarDefInfos = this._getAxisVarDefParams(axisDataObj, isIndependent);
		var initParams = axisVarDefInfos.initParams;
		var extraInfo = axisVarDefInfos.extraInfo;
		var hasExtraInfo = axisVarDefInfos.hasExtraInfo;

		var varDef = Kekule.IO.CmlSpectUtils.getSpectrumVarDef(spectrumObj, initParams.symbol, initParams.unit, null, initParams.dependency);
		if (varDef && !varDef.getDisplayLabel() && initParams.displayLabel)
			varDef.setDisplayLabel(initParams.displayLabel);
		if (!varDef)
		{
			varDef = new Kekule.Spectroscopy.SpectrumVarDefinition(initParams);
			spectrumDataObj.appendVariable(varDef);
		}

		// set extra info at section level, avoid affecting the global settings in spectrumData
		if (hasExtraInfo)
		{
			var fnames = Kekule.ObjUtils.getOwnedFieldNames(extraInfo);
			for (var i = 0, l = fnames.length; i < l; ++i)
			{
				spectrumDataSection.setLocalVarInfoValue(varDef.getSymbol(), fnames[i], extraInfo[fnames[i]]);
			}
		}
		var isContinuousVar = !arrayObj.values && arrayObj.start && arrayObj.end;
		if (isContinuousVar)
		{
			//spectrumDataObj.setContinuousVarRange(varDef, arrayObj.start, arrayObj.end);
			spectrumDataSection.setContinuousVarRange(varDef, arrayObj.start, arrayObj.end);
		}
		return varDef;
	}
	*/
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
		this._spectrumWithRefMolecules = [];
	},
	/** @private */
	initProperties: function()
	{
		// a private property, convention of this CMLSpect file
		this.defineProp('convention', {'dataType': DataType.STRING,	'serializable': false});
		this.defineProp('additionalRefMolecules', {'dataType': DataType.ARRAY,	'serializable': false});
	},
	/** @ignore */
	doFinalize: function()
	{
		this._spectrumWithRefMolecules = null;
		this.setPropStoreFieldValue('additionalRefMolecules', null);
		this.tryApplySuper('doFinalize');
	},
	/** @ignore */
	readElement: function(elem, parentObj, parentReader, options)
	{
		this.setAdditionalRefMolecules([]);
		var spectrum = this.tryApplySuper('readElement', [elem, parentObj, parentReader, options]);
		var additionalMols = this.getAdditionalRefMolecules();
		if (additionalMols.length)   // has extra sample molecules, need to create root list object to wrap them together with spectrum
		{
			var objs = AU.clone(additionalMols);
			objs.push(spectrum);
			var holder = this._createChildObjsHolder(objs, options.defaultRootObjListHolder);
			spectrum.setRefMolecules(additionalMols);
			return holder;
		}
		else
			return spectrum;
	},
	/** @ignore */
	doReadElement: function(elem, parentObj, parentReader, options)
	{
		var spectrum = this.readSpectrum(elem, this.getDomHelper(), options);
		return spectrum;
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
	/** @ignore */
	doDoneReadingDocument: function()
	{
		// after the document is build, try set the assignments of peaks
		var spectrums = this._spectrumWithRefMolecules;
		for (var i = 0, l = spectrums.length; i < l; ++i)
		{
			var spec = spectrums[i];
			var owner = spec.getOwner();
			if (owner && owner.getObjById)
			{
				var ids = spec[Kekule.IO.CML.SPECTRUM_OBJREF_FIELDNAME] || [];
				var objs = [];
				for (var j = 0, k = ids.length; j < k; ++j)
				{
					var id = ids[j].trim();
					if (id)
					{
						var obj = owner.getObjById(id);
						if (obj)
							objs.push(obj);
					}
				}
				if (objs.length)
					spec.setRefMolecules(objs);
				delete spec[Kekule.IO.CML.SPECTRUM_OBJREF_FIELDNAME];
			}
		}
		this._spectrumWithRefMolecules = [];
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
	 * @param {Hash} options
	 * @returns {Kekule.Spectroscopy.Spectrum}
	 * @private
	 */
	readSpectrum: function(elem, domHelper, options)
	{
		var result = new Kekule.Spectroscopy.Spectrum();
		this.readSpectrumAttribs(result, elem, domHelper);
		var self = this;
		var childResults = this.iterateChildElements(elem, result, this, function(childElem, childResult){
			self._handleChildResult(childElem, childResult, result, options);
		});
		return result;
	},
	/** @private */
	readSpectrumAttribs: function(spectrum, elem, domHelper)
	{
		// important attribs are id, type, title and convention
		var attribs = Kekule.IO.CmlDomUtils.fetchCmlElemAttributeValuesToJson(elem, null, true, domHelper);
		var attribKeys = Kekule.ObjUtils.getOwnedFieldNames(attribs);
		var refMolIds = [];
		for (var i = 0, l = attribKeys.length; i < l; ++i)
		{
			var key = attribKeys[i];
			var value = attribs[key];
			if (Kekule.IO.CML.MOL_REF_ATTRIBS.indexOf(key) >= 0)
				refMolIds.push((value || '').trim());
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
		if (refMolIds.length)
		{
			var ids = refMolIds.join(' ').split(/\s/);
			spectrum[Kekule.IO.CML.SPECTRUM_OBJREF_FIELDNAME] = ids;  // store these ids, handled when the chem space is built
			this._spectrumWithRefMolecules.push(spectrum);
		}
	},
	/** @private */
	_handleChildResult: function(childElem, childResult, spectrumObj, options)
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
		else if (childElemTagName === 'sample' && options.enableExtractSampleInsideSpectrum)
		{
			//console.log('Has sample', childResult);
			this._handleSampleData(childResult, spectrumObj, options);
		}
		// info data need to be handled manually
		else if (this._isInfoListElemTagName(childElemTagName))
		{
			//console.log('child', childResult);
			this._handleInfoData(childElemTagName, childResult, spectrumObj);
		}
	},
	/** @private */
	_handleSampleData: function(childResult, spectrumObj, options)
	{
		var sampleObjs = [];
		for (var i = 0, l = childResult.length; i < l; ++i)
		{
			var obj = childResult[i];
			if (obj instanceof Kekule.Molecule)  // now only handles the molecules
			{
				sampleObjs.push(obj);
				if (options.autoHideSampleInsideSpectrum && obj.setVisible)
					obj.setVisible(false);
			}
		}
		if (sampleObjs.length)
			this.setAdditionalRefMolecules(this.getAdditionalRefMolecules().concat(sampleObjs));
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
RF.register('sample', Kekule.IO.CmlSampleReader);
RF.register(['xaxis', 'yaxis'], Kekule.IO.CmlSpectrumDataAxisReader);

})();