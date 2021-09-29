/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /utils/kekule.textHelper.js
 * requires /core/kekule.common.js
 * requires /core/kekule.metrics.js
 * requires /spectrum/kekule.spectrum.core.js
 * requires /io/kekule.io.js
 * requires /io/jcamp/kekule.io.jcamp.js
 * requires /localization
 */

(function(){
"use strict";

var AU = Kekule.ArrayUtils;
var Jcamp = Kekule.IO.Jcamp;

var KU = Kekule.Unit;

/**
 * A helper class for JCAMP-DX formats.
 * @class
 */
Kekule.IO.Jcamp.DxUtils = {
	/** @private */
	_dxUnitToMetricsObjMap: {
		// general
		'ARBITARY UNITS': KU.General.ARBITRARY,
		'ARBITARY UNIT': KU.General.ARBITRARY,
		'SECONDS': KU.Time.SECOND,
		'SECOND': KU.Time.SECOND,
		'MILLISECONDS': KU.Time.MILLISECOND,
		'MICROSECONDS': KU.Time.MICROSECOND,
		'NANOSECONDS': KU.Time.NANOSECOND,
		'PPM': KU.Ratio.MILLIONTH,
		// NMR
		'HZ': KU.Frequency.HERTZ,
		// IR
		'1/CM': KU.Frequency.WAVE_NUMBER,
		'MICROMETERS': KU.Length.MICROMETER,
		'NANOMETERS': KU.Length.NANOMETER,
		'TRANSMITTANCE': KU.Optics.TRANSMITTANCE,
		'REFLECTANCE': KU.Optics.REFLECTANCE,
		'ABSORBANCE': KU.Optics.ABSORBANCE,
		'KUBELKA-MUNK': KU.Optics.KUBELKA_MUNK,
		// MS
		'CHANNEL NUMBER': null,
		'COUNTS': KU.General.MS_COUNT,
		'COUNT': KU.General.MS_COUNT,
		'M/Z': KU.SpectrumMS.MS_MASS_CHARGE_RATIO,
		'RELATIVE ABUNDANCE ': KU.SpectrumMS.MS_RELATIVE_ABUNDANCE,
		// Other
		'MICROAMPERES': KU.ElectricCurrent.MICROAMPERE,
		'NANOAMPERES': KU.ElectricCurrent.NANOAMPERE,
		'PICOAMPERES': KU.ElectricCurrent.PICOAMPERE
	},
	/**
	 * Returns a suitable unit string registered in metrics system of Kekule.js.
	 * @param {String} unitStr Unit label stored in DX file.
	 * @returns {String}
	 */
	dxUnitToMetricsUnitSymbol: function(unitStr)
	{
		var map = Jcamp.DxUtils._dxUnitToMetricsObjMap;
		var metricsObj = map[unitStr];
		var result = metricsObj && metricsObj.symbol;
		if (!result)  // not found in map, return the raw string, but since in JCAMP all are uppercased, we need to convert to lower here
			result = unitStr.toLowerCase().upperFirst();
		return result;
	}
};

// create some ldr info for DX format
Kekule.IO.Jcamp.LabelTypeInfos.createInfos([
	['']
]);

/**
 * Reader for reading a DX data block of JCAMP document tree.
 * @class
 * @augments Kekule.IO.Jcamp.DataBlockReader
 */
Kekule.IO.Jcamp.DxDataBlockReader = Class.create(Kekule.IO.Jcamp.DataBlockReader,
/** @lends Kekule.IO.Jcamp.DxDataBlockReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.Jcamp.DxDataBlockReader',
	/** @private */
	initProperties: function()
	{
		this.defineProp('currVarInfos', {'dataType': DataType.HASH, 'setter': false, 'scope': Class.PropertyScope.PRIVATE});
		this.defineProp('currNTuplesInfos', {'dataType': DataType.HASH, 'setter': false, 'scope': Class.PropertyScope.PRIVATE});
		this.defineProp('currNTuplesVarInfos', {'dataType': DataType.HASH, 'setter': false, 'scope': Class.PropertyScope.PRIVATE,
			'getter': function()
			{
				var i = this.getCurrNTuplesInfos();
				return i && i.varInfos;
			}
		});
		this.defineProp('currNTuplesVarRawInfos', {'dataType': DataType.HASH, 'setter': false, 'scope': Class.PropertyScope.PRIVATE,
			'getter': function()
			{
				var i = this.getCurrNTuplesInfos();
				return i && i.varRawInfos;
			}
		});
	},
	/** @ignore */
	initPropValues: function()
	{
		this._initCurrVarInfos();
	},
	/** @private */
	_initCurrVarInfos: function()
	{
		this.setPropStoreFieldValue('currVarInfos', {});
		this.setPropStoreFieldValue('currNTuplesVarInfos', {});
	},
	/** @ignore */
	_initLdrHandlers: function()
	{
		var map = this.tryApplySuper('_initLdrHandlers');
		map['DATATYPE'] = this.doStoreSpectrumDataTypeLdr.bind(this, 'DATA TYPE');
		var dataTableLdrNames = this._getDataTableLdrNames();
		for (var i = 0, l = dataTableLdrNames.length; i < l; ++i)
			map[dataTableLdrNames[i]] = this.doStoreSpectrumDataLdr.bind(this);
		/*
		map['PEAK TABLE'] = this.doStoreSpectrumDataLdr.bind(this, 'PEAK TABLE');
		map['XYDATA'] = this.doStoreSpectrumDataLdr.bind(this, 'XYDATA');
		*/
		var varDefLdrNames = this._getDataTableVarDefLdrNames();
		for (var i = 0, l = varDefLdrNames.length; i < l; ++i)
			map[varDefLdrNames[i]] = this.doStoreDataVarInfoLdr.bind(this);
		var ntuplesVarDefLdrNames = this._getNTuplesDefinitionLdrNames();
		for (var i = 0, l = ntuplesVarDefLdrNames.length; i < l; ++i)
			map[ntuplesVarDefLdrNames[i]] = this.doStoreNTuplesAttributeLdr.bind(this);
		map['DATATABLE'] = this.doStoreNTuplesDataLdr.bind(this);   // NTuples data table
		return map;
	},
	/** @prviate */
	_getDataTableVarDefLdrNames: function()
	{
		return ['XUNITS', 'FIRSTX', 'LASTX', 'MAXX', 'MINX', 'XFACTOR', 'YUNITS', 'MAXY', 'MINY', 'FIRSTY', 'LASTY', 'YFACTOR', 'NPOINTS', /*'RESOLUTION',*/ 'DELTAX',
			'XLABEL', 'YLABEL',
			'RUNITS', 'AUNITS', 'FIRSTR', 'LASTR', 'DELTAR', 'MAXA', 'MINA', 'RFACTOR', 'AFACTOR', 'FIRSTA', 'ALIAS', 'ZPD'];
	},
	/** @private */
	_getNTuplesDefinitionLdrNames: function()
	{
		return ['NTUPLES', /*'VAR_NAME'*/'VARNAME', 'SYMBOL', /*'VAR_TYPE'*/'VARTYPE', /*'VAR_FORM'*/'VARFORM', /*'VAR_DIM'*/'VARDIM', 'UNITS', 'FIRST', 'LAST', 'MIN', 'MAX', 'FACTOR',
			'PAGE', 'POINTS', /*'NPOINTS'?,*/ 'CASNAME',
			/*'END NTUPLES'*/'ENDNTUPLES'];
	},
	/** @private */
	_getDataTableLdrNames: function()
	{
		return ['XYDATA', 'XYPOINTS', 'PEAKTABLE', 'PEAKASSIGNMENTS', 'ASSIGNMENTS', 'RADATA'];
	},
	/** @private */
	_isDataTableLabelName: function(labelName)
	{
		return this._getDataTableLdrNames().indexOf(labelName) >= 0;
	},

	/** @ignore */
	getLdrNamePrefixForInfoField: function(labelName, labelType, chemObj)
	{
		var result = this.tryApplySuper('getLdrNamePrefixForInfoField', [labelName, labelType, chemObj]);
		if (labelType === Jcamp.LabelType.SPECIFIC)  // data specified label
		{
			// the data type should already be stored in chemObj
			var spectrumType = chemObj.getSpectrumType();
			if (spectrumType)
				result += spectrumType + '.';
		}
		return result;
	},

	/* @ignore */
	/*
	getPendingLdrNames: function()
	{
		return this.tryApplySuper('getPendingLdrNames').concat(this._getDataTableLdrNames());
	},
	*/
	/** @private */
	doStoreDataVarInfoLdr: function(ldr, block, chemObj)
	{
		var info = this.getCurrVarInfos();
		info[ldr.labelName] = Jcamp.LdrValueParser.parseValue(ldr);
	},
	/** @private */
	doStoreNTuplesAttributeLdr: function(ldr, block, chemObj)
	{
		var info = this.getCurrNTuplesInfos();
		var value = Jcamp.LdrValueParser.parseValue(ldr);
		if (ldr.labelName === 'ENDNTUPLES')  // ntuples end, empty the var infos
		{
			if (value !== info.name)  // begin/end name not same
				Kekule.error(Kekule.$L('ErrorMsg.JCAMP_NTUPLES_BEGIN_END_NAME_NOT_MATCH', info.value, value));
			this.setPropStoreFieldValue('currNTuplesInfos', null);  // NTuples end, empty the info object
		}
		else if (ldr.labelName === 'NTUPLES')  // ntuples head
		{
			this.setPropStoreFieldValue('currNTuplesInfos', {'name': value, 'varRawInfos': {}});  // create a new NTuples info object
		}
		else if (ldr.labelName === 'PAGE')   // a new page
		{
			this._doStoreNTuplesPageAttributeLdr(ldr);
		}
		else
		{
			info.varRawInfos[ldr.labelName] = value;
		}
	},
	/** @private */
	_doStoreNTuplesPageAttributeLdr: function(ldr)
	{
		var info = this.getCurrNTuplesInfos();
		// analysis PageVar=Value pattern
		var s = ldr.valueLines.join('');
		var parts = s.split('=');
		if (parts.length !== 2)
			Kekule.error(Kekule.$L('ErrorMsg.JCAMP_NTUPLES_PAGE_DECLARATION_FORMAT_ERROR', s));
		else
		{
			var varSymbol = parts[0].trim();
			var sValue = parts[1].trim();
			info[ldr.labelName] = {'varSymbol': varSymbol, 'sValue': sValue};
		}
	},
	/** @private */
	doStoreSpectrumDataTypeLdr: function(ldrLabelName, ldr, block, chemObj)
	{
		var ldrValue = Jcamp.LdrValueParser.parseValue(ldr);
		if (ldrValue && ldrValue.toUpperCase)  // a normal string value
		{
			var SType = Kekule.Spectroscopy.SpectrumType;
			ldrValue = ldrValue.toUpperCase();
			var stype = (ldrValue.indexOf('INFRARED') >= 0)? SType.IR:
				(ldrValue.indexOf('NMR') >= 0)? SType.NMR:
				(ldrValue.indexOf('MASS') >= 0)? SType.MS:
				(ldrValue.indexOf('ION MOBILITY') >= 0 || ldrValue.indexOf('IMS') >= 0)? SType.IMS:
				(ldrValue.indexOf('RAMAN') >= 0)? SType.RAMAN:
				(ldrValue.indexOf('UV') >= 0)? SType.UV:
				SType.GENERAL;
			chemObj.setSpectrumType(stype);
		}
		// also save the full LDR value to info property
		this.doStoreLdrToChemObjInfoProp(ldrLabelName, ldr, block, chemObj);
	},
	/** @private */
	doStoreSpectrumDataLdr: function(ldr, block, chemObj)
	{
		//console.log('doStoreSpectrumDataLdr', ldr);
		// check whether the DATA_CLASS matches LDR label name, ensure this is the LDR containing the spectrum data
		if (this._isSpectrumDataLdr(ldr, chemObj))
		{
			if (this._isDataTableLabelName(ldr.labelName))
			{
				var dataValue = Jcamp.LdrValueParser.parseValue(ldr, {doValueCheck: true});
				//console.log(ldr, dataValue);
				/*
				var varFormat = dataValue.format;
				var formatDetail = Jcamp.Utils.getDataTableFormatDetails(varFormat);
				*/
				var formatDetail = dataValue.formatDetail;
				var varSymbols = formatDetail.vars;
				// retrieve var information, including first/last range and factor
				var varInfos = this._retrieveSpectrumDataVarInfos(varSymbols, block, chemObj);
				/*
				var varSymbolInc = formatDetail.varInc;
				var varSymbolLoop = formatDetail.varLoop;
				varInfos._bySymbol[varSymbolInc].dependency = Kekule.VarDependency.INDEPENDENT;
				*/
				// the first var should be independent
				varInfos[0].dependency = Kekule.VarDependency.INDEPENDENT;
				varInfos[1].dependency = Kekule.VarDependency.DEPENDENT;
				var varDefinitions = this._createSpectrumVariableDefinitions(varInfos);  // ensure X before Y
				//console.log(formatDetail);
				//console.log(varInfos);
				//console.log(dataValue);
				//var spectrumData = new Kekule.Spectroscopy.SpectrumData(null, varDefinitions);
				var spectrumData = chemObj.getData();
				spectrumData.setVariables(varDefinitions);
				var isContinuous = (ldr.labelName.indexOf('PEAK') < 0) && (ldr.labelName.indexOf('ASSIGNMENT') < 0);
				spectrumData.setMode(isContinuous? Kekule.Spectroscopy.DataMode.CONTINUOUS: Kekule.Spectroscopy.DataMode.PEAK);

				var spectrumDataSection = this._createSpectrumDataSectionByFormat(formatDetail, dataValue.values, varInfos, spectrumData);
				/*
				if (spectrumData)
					chemObj.setData(spectrumData);
				*/
			}
		}
		else  // use the default approach
			return this.doStoreLdrToChemObjInfoProp(ldr.labelName, ldr, block, chemObj);
	},
	/** @private */
	_retrieveSpectrumDataVarInfos: function(varSymbols, block, chemObj)
	{
		var result = [];
		result._symbols = [];
		result._bySymbol = {};
		var infoStorage = this.getCurrVarInfos();
		//console.log(infoStorage);
		var getVarInfoValue = function(name)
		{
			return infoStorage[name];
		}
		// since the data table LDR are handled last, information LDR now has already be stored in chemObj
		for (var i = 0, l = varSymbols.length; i < l; ++i)
		{
			var varSymbol = varSymbols[i];
			result.push({
				'symbol': varSymbol,
				'units': getVarInfoValue(varSymbol + 'UNITS'),
				'firstValue': getVarInfoValue('FIRST' + varSymbol),
				'lastValue': getVarInfoValue('LAST' + varSymbol),
				'maxValue': getVarInfoValue('MAX' + varSymbol),
				'minValue': getVarInfoValue('MIN' + varSymbol),
				'factor': getVarInfoValue(varSymbol + 'FACTOR')
			});
			result._symbols.push(varSymbol);
			result._bySymbol[varSymbol] = result[result.length - 1];
		}
		return result;
	},
	/** @private */
	_createSpectrumVariableDefinitions: function(varInfos)
	{
		var result = [];
		for (var i = 0, l = varInfos.length; i < l; ++i)
		{
			var info = varInfos[i];
			var vType = info.varType;
			if (vType)  // VAR_TYPE in NTUPLES
			{
				if (vType === 'DEPENDENT')
					info.dependency = Kekule.VarDependency.DEPENDENT;
				else if (vType === 'INDEPENDENT')
					info.dependency = Kekule.VarDependency.INDEPENDENT;
				else if (vType === 'PAGE')   // special page var in NTuples, ignore and do not create instance of VarDefinition
					continue;
			}

			var def = new Kekule.VarDefinition({
				'name': (info.name || '').toLowerCase(),  // LDR values are often uppercased
				'symbol': info.symbol,
				'units': Jcamp.DxUtils.dxUnitToMetricsUnitSymbol(info.units),
				//'minValue': info.minValue,
				//'maxValue': info.maxValue,
				'dependency': Kekule.ObjUtils.notUnset(info.dependency)? info.dependency: Kekule.VarDependency.DEPENDENT
			});
			if (Kekule.ObjUtils.notUnset(info.minValue) && Kekule.ObjUtils.notUnset(info.maxValue))
				def.setInfoValue('displayRange', {'min': info.minValue, 'max': info.maxValue});
			result.push(def);
		}
		return result;
	},
	/** @private */
	doStoreNTuplesDataLdr: function(ldr, block, chemObj)
	{
		//var varInfos = this._retrieveNTupleVariableInfos();
		//console.log(varInfos);
		var ntuplesInfos = this.getCurrNTuplesInfos();
		var varInfos =  this.getCurrNTuplesVarInfos();
		if (!varInfos)
		{
			varInfos = this._retrieveNTupleVariableInfos();
			ntuplesInfos.varInfos = varInfos;
		}
		var spectrumData = ntuplesInfos.spectrumData;
		if (!spectrumData)    // create new spectrum data instance when necessary
		{
			var varDefinitions = this._createSpectrumVariableDefinitions(varInfos);
			//spectrumData = new Kekule.Spectroscopy.SpectrumData(null, varDefinitions);
			//chemObj.setData(spectrumData);
			var spectrumData = chemObj.getData();
			spectrumData.setVariables(varDefinitions);
			ntuplesInfos.spectrumData = spectrumData;
		}
		//console.log(varDefinitions);

		var dataValue = Jcamp.LdrValueParser.parseValue(ldr, {doValueCheck: true});
		//var varFormat = dataValue.format;
		//var formatDetail = Jcamp.Utils.getDataTableFormatAndPlotDetails(varFormat);
		var formatDetail = dataValue.formatDetail;
		var plotDescriptor = formatDetail.plotDescriptor || '';
		var localVarSymbols = formatDetail.vars;

		var isContinuous = (plotDescriptor.indexOf('PEAK') < 0) && (plotDescriptor.indexOf('ASSIGNMENT') < 0);
		var dataMode = isContinuous? Kekule.Spectroscopy.DataMode.CONTINUOUS: Kekule.Spectroscopy.DataMode.PEAK;

		var spectrumDataSection = this._createSpectrumDataSectionByFormat(formatDetail, dataValue.values, varInfos, spectrumData);
		spectrumDataSection.setMode(dataMode);
		var pageInfo = ntuplesInfos['PAGE'];
		spectrumDataSection.setName(pageInfo.varSymbol + ': ' + pageInfo.sValue);
	},
	/** @private */
	_retrieveNTupleVariableInfos: function()
	{
		var result = [];
		result._bySymbol = {};
		result._symbols = [];
		var infoStorage = this.getCurrNTuplesVarRawInfos();
		//console.log(infoStorage);
		var getStorageValue = function(name)
		{
			return infoStorage[name];
		}
		var fillVarInfo = function(ldrKey, key, infoObj)
		{
			var standardizedLdrKey = Jcamp.Utils.standardizeLdrLabelName(ldrKey);
			var values = AU.toArray(getStorageValue(standardizedLdrKey));
			for (var i = 0, l = values.length; i < l; ++i)
			{
				if (!infoObj[i])
					infoObj[i] = {};
				infoObj[i][key] = values[i];
				if (ldrKey === 'SYMBOL')
					result._symbols[i] = values[i];
			}
			return infoObj;
		}
		fillVarInfo('VAR_NAME', 'name', result);
		fillVarInfo('SYMBOL', 'symbol', result);
		fillVarInfo('VAR_TYPE', 'varType', result);
		fillVarInfo('VAR_FORM', 'varForm', result);
		fillVarInfo('VAR_DIM', 'varDim', result);
		fillVarInfo('UNITS', 'units', result);
		fillVarInfo('FIRST', 'firstValue', result);
		fillVarInfo('LAST', 'lastValue', result);
		fillVarInfo('MIN', 'minValue', result);
		fillVarInfo('MAX', 'maxValue', result);
		fillVarInfo('FACTOR', 'factor', result);

		for (var i = 0, l = result.length; i < l; ++i)
		{
			if (result[i].symbol)
				result._bySymbol[result[i].symbol] = result[i];
		}
		return result;
	},
	/* @private */
	/*
	_ensureCreatingSpectrumNTuplesVariableDefinitions: function(spectrumData)
	{
		if (spectrumData.getVariableCount() <= 0)
		{
			var varDefs = this._createSpectrumVariableDefinitions(this._retrieveNTupleVariableInfos());
			spectrumData.setVariables(varDefs);
		}
		return spectrumData.getVariables();
	},
	*/

	/** @private */
	_calcActualVarValue: function(dataValue, varInfo)
	{
		return dataValue * (varInfo.factor || 1);
	},
	/** @private */
	_createSpectrumDataSectionByFormat: function(formatDetail, data, varinfos, parentSpectrumData)
	{
		var result;
		if (formatDetail.format === Jcamp.Consts.DATA_VARLIST_FORMAT_XYDATA)
		{
			result = this._createXyDataFormatSpectrumDataSection(formatDetail, data, varinfos, parentSpectrumData);
		}
		else if (formatDetail.format === Jcamp.Consts.DATA_VARLIST_FORMAT_XYPOINTS)
		{
			result = this._createXyPointsFormatSpectrumDataSection(formatDetail, data, varinfos, parentSpectrumData);
		}
		else if (formatDetail.format === Jcamp.Consts.DATA_VARLIST_FORMAT_VAR_GROUPS)
		{
			result = this._createVarGroupFormatSpectrumDataSection(formatDetail, data, varinfos, parentSpectrumData);
		}
		//console.log('data', formatDetail, varinfos, result);
		//console.log('section', result.calcDataRange('Y'));
		return result;
	},
	/** @private */
	_createXyDataFormatSpectrumDataSection: function(formatDetail, dataLines, varInfos, parentSpectrumData)
	{
		var varSymbolInc = formatDetail.varInc;
		var varSymbolLoop = formatDetail.varLoop;
		/*
		varInfos._bySymbol[varSymbolInc].dependency = Kekule.VarDependency.INDEPENDENT;
		var varDefinitions = this._createSpectrumVariableDefinitions(varInfos);  // ensure X before Y
		var result = new Kekule.Spectroscopy.SpectrumData(null, varDefinitions);
		*/
		var result = parentSpectrumData.createSection(/*varInfos._symbols*/formatDetail.vars, Kekule.Spectroscopy.DataMode.CONTINUOUS);
		result.beginUpdate();
		try
		{
			// calc first/lastX from data lines first
			var varIncValueRange = {firstValue: this._calcActualVarValue(dataLines[0][0], varInfos._bySymbol[varSymbolInc]), lastValue: null};
			if (dataLines.length > 1)  // more than one line, calc deltaX and lastX from the last two lines
			{
				var delta = (dataLines[dataLines.length - 1][0] - dataLines[dataLines.length - 2][0]) / (dataLines[dataLines.length - 2].length - 1);
				varIncValueRange.lastValue = this._calcActualVarValue(dataLines[dataLines.length - 1][0] + delta * (dataLines[dataLines.length - 1].length - 2), varInfos._bySymbol[varSymbolInc]);
			}
			else
			{
				varIncValueRange.lastValue = varInfos[varSymbolInc].lastValue;
			}
			// check first/lastX
			// console.log('var first/last compare', varIncValueRange.firstValue, varInfos._bySymbol[varSymbolInc].firstValue, varIncValueRange.lastValue, varInfos._bySymbol[varSymbolInc].lastValue);
			if (Jcamp.Utils.compareFloat(varIncValueRange.firstValue, varInfos._bySymbol[varSymbolInc].firstValue) !== 0
				|| Jcamp.Utils.compareFloat(varIncValueRange.lastValue, varInfos._bySymbol[varSymbolInc].lastValue) !== 0)
			{
				Kekule.error(Kekule.$L('ErrorMsg.JCAMP_DATA_TABLE_VALUE_FIRST_LAST_NOT_MATCH'));
			}

			// check pass, build the spectrum data
			result.setContinuousVarRange(varSymbolInc, varIncValueRange.firstValue, varIncValueRange.lastValue);
			for (var i = 0, ii = dataLines.length; i < ii; ++i)
			{
				var lineValues = dataLines[i];
				for (var j = 1, jj = lineValues.length; j < jj; ++j)
				{
					result.appendData([undefined, this._calcActualVarValue(lineValues[j], varInfos._bySymbol[varSymbolLoop])]);  // omit X
				}
			}
			result.setDataSorted(true);
		}
		finally
		{
			result.endUpdate();
		}
		//console.log(varDefinitions, result);
		return result;
	},
	/** @private */
	_createXyPointsFormatSpectrumDataSection: function(formatDetail, data, varInfos, parentSpectrumData)
	{
		/*
		var varDefinitions = this._createSpectrumVariableDefinitions(varInfos);  // ensure X before Y
		var result = new Kekule.Spectroscopy.SpectrumData(null, varDefinitions);
		*/
		var result = parentSpectrumData.createSection(/*varInfos._symbols*/formatDetail.vars);
		result.beginUpdate();
		try
		{
			for (var i = 0, l = data.length; i < l; ++i)
			{
				// each item is a data group, containing values of all variables
				result.appendData(data[i]);
			}
			result.setDataSorted(true);
		}
		finally
		{
			result.endUpdate();
		}
		return result;
	},
	/** @private */
	_createVarGroupFormatSpectrumDataSection: function(formatDetail, data, varInfos, parentSpectrumData)
	{
		/*
		var varDefinitions = this._createSpectrumVariableDefinitions(varInfos);  // ensure X before Y
		var result = new Kekule.Spectroscopy.SpectrumData(null, varDefinitions);
		*/
		var result = parentSpectrumData.createSection(/*varInfos._symbols*/formatDetail.vars);
		result.beginUpdate();
		try
		{
			for (var i = 0, l = data.length; i < l; ++i)
			{
				// each item is a data group, containing values of all variables
				result.appendData(data[i]);
			}
			result.setDataSorted(true);
		}
		finally
		{
			result.endUpdate();
		}
		return result;
	},
	/** @private */
	_isSpectrumDataLdr: function(ldr, chemObj)
	{
		//console.log(chemObj.getClassName());
		var result = (!chemObj.getData() || chemObj.getData().getSectionCount() <= 0);  // if spectrum data already be built, a data LDR has previously be parsed and this one should not be the data
		if (result)
		{
			var dataClassValue = chemObj.getInfoValue('DATA CLASS') || null;
			if (dataClassValue)
			{
				result = ldr.labelName.replace(/\s/g, '').indexOf(dataClassValue.replace(/\s/g, '')) >= 0;  // ignore space in names
			}
		}
		return result;
	},

	/** @ignore */
	doCreateChemObjForBlock: function(block)
	{
		var result;
		var meta = this._getBlockMeta(block);
		if (meta.blockType === Jcamp.BlockType.DATA && meta.format === Jcamp.Format.DX)
		{
			result = new Kekule.Spectroscopy.Spectrum();
			//result = [new Kekule.Spectroscopy.Spectrum()];   // TODO: if multiple NTUPLES exists in a file, there may be need to create several Spectrum instances
		}
		else
			result = this.tryApplySuper('doCreateChemObjForBlock', [block]);
		return result;
	}
});
Jcamp.BlockReaderManager.register(Jcamp.BlockType.DATA, Jcamp.Format.DX, Kekule.IO.Jcamp.DxDataBlockReader);


})();