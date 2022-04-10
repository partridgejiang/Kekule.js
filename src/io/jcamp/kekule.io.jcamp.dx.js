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
var KS = Kekule.Spectroscopy;

var KU = Kekule.Unit;
var KSType = Kekule.Spectroscopy.SpectrumType;

/**
 * Enumeration of the data style in JCAMP DX.
 * @enum
 */
Kekule.IO.Jcamp.SpectrumDataStorageStyle = {
	/** Use the classic XYData/XYPoints/Peak Table labels. */
	CLASSIC: 1,
	/** Use the NTuple format. */
	NTUPLE: 2,
	/**
	 *  Use classic labels when there is only one section in spectrum,
	 *  and use NTuple when there are multiple sections.
	 */
	SMART: 0
};

/*
 * Default options to read/write JCAMP-DX format data.
 * @object
 */
Kekule.globalOptions.add('IO.jcamp', {
	outputDxVersion: '5.00',
	dxDataStorageStyle: Kekule.IO.Jcamp.SpectrumDataStorageStyle.SMART,
	dxDataAllowedLoadingErrorRatio: 0.001,  // allow 0.1% error when loading data from JCAMP-DX format
	dxDataAllowedSavingErrorRatio: 0.0001,  // allow 0.01% error when saving data to JCAMP-DX format
	dxDataPreferredOrdinateScaledRange: {min: -32767, max: 32767},
	dxDataAsdfTableOutputForm: Jcamp.AsdfForm.DIF_DUP,  // default output form of ASDF data table
	useDxMinMaxValueAsDisplayRange: false,   // whether regard the MINX/Y-MAXX/Y as the display range of all spectrum in file
	disablePeakAssignmentReading: false,
	disablePeakAssignmentWriting: false,
	autoHiddenSpectrumRefMolecule: true   // whether hide the ref molecule of spectrum automatically and display only the spectrum itself
});

/**
 * Some constants for JCAMP-DX format data.
 * @object
 * @ignore
 */
Kekule.IO.Jcamp.DxConsts = {
	CANDIDATE_INDEPENDENT_VAR_SYMBOLS: ['X', 'R', 'U', 'V', 'K', 'P'],
	CANDIDATE_DEPENDENT_VAR_SYMBOLS: ['Y', 'Z', 'A', 'B', 'C', 'D']
};

/**
 * A helper class for JCAMP-DX formats.
 * @class
 */
Kekule.IO.Jcamp.DxUtils = {
	/* @private */
	_spectrumTypeMap: [  // each item is [JcampSpectrumNameKeyPart, KekuleSpectrumType]
		// (since the JCAMP DATATYPE value various a lot, here we can only handle the key part of it)
		['INFRARED', KSType.IR],
		['NMR', KSType.NMR],
		['MASS', KSType.MS],
		['ION MOBILITY', KSType.IMS],
		['IMS', KSType.IMS],
		['RAMAN', KSType.RAMAN],
		['UV', KSType.UV_VIS],
		['VIS', KSType.UV_VIS],
		['', KSType.GENERAL]
	],
	/** @private */
	_dxUnitToMetricsObjMap: {
		// general
		'ARBITARY UNITS': KU.Arbitrary.ARBITRARY,
		'ARBITARY UNIT': KU.Arbitrary.ARBITRARY,
		'SECONDS': KU.Time.SECOND,
		'SECOND': KU.Time.SECOND,
		'MILLISECONDS': KU.Time.MILLISECOND,
		'MICROSECONDS': KU.Time.MICROSECOND,
		'NANOSECONDS': KU.Time.NANOSECOND,
		'PPM': KU.Dimensionless.PARTS_PER_MILLION,
		// NMR
		'HZ': KU.Frequency.HERTZ,
		// IR
		'1/CM': KU.WaveNumber.RECIPROCAL_CENTIMETER,
		'MICROMETERS': KU.Length.MICROMETER,
		'NANOMETERS': KU.Length.NANOMETER,
		'TRANSMITTANCE': KU.OpticalTransmittance.TRANSMITTANCE_PERCENT,
		'REFLECTANCE': KU.OpticalReflectance.REFLECTANCE,
		'ABSORBANCE': KU.OpticalAbsorbance.ABSORBANCE,
		'KUBELKA-MUNK': KU.OpticalKubelkaMunk.KUBELKA_MUNK,
		// MS
		'CHANNEL NUMBER': null,
		'COUNTS': KU.Misc.MS_COUNT,
		'COUNT': KU.Misc.MS_COUNT,
		'M/Z': KU.SpectrumMS.MS_MASS_CHARGE_RATIO,
		'RELATIVE ABUNDANCE ': KU.SpectrumMS.MS_RELATIVE_ABUNDANCE,
		// Other
		'MICROAMPERES': KU.ElectricCurrent.MICROAMPERE,
		'NANOAMPERES': KU.ElectricCurrent.NANOAMPERE,
		'PICOAMPERES': KU.ElectricCurrent.PICOAMPERE
	},
	/**
	 * Returns the corresponding spectrum type for a JCAMP-DX datatype value.
	 * @param {String} jcampType
	 * @returns {String}
	 */
	jcampSpectrumTypeToKekule: function(jcampType)
	{
		var map = Jcamp.DxUtils._spectrumTypeMap;
		var jType = (jcampType || '').toUpperCase();
		var result;
		for (var i = 0, l = map.length; i < l; ++i)
		{
			if (jType.indexOf(map[i][0]) >= 0)
			{
				result = map[i][1];
				break;
			}
		}
		if (!result)  // not found, use the original type name directly
			result = jType;
		return result;
	},
	/**
	 * Returns the core part of JCAMP-DX datatype value for a Kekule spectrum type.
	 * @param {String} spectrumType
	 * @returns {String}
	 */
	kekuleSpectrumTypeToJcampCoreName: function(spectrumType)
	{
		var map = Jcamp.DxUtils._spectrumTypeMap;
		var result;
		for (var i = 0, l = map.length; i < l; ++i)
		{
			if (spectrumType === map[i][1])
			{
				result = map[i][0];
				break;
			}
		}
		if (!result)  // not found, use the original type name directly
			result = jType;
		return result;
	},
	/**
	 * Returns a suitable unit string registered in metrics system of Kekule.js.
	 * @param {String} unitStr Unit label stored in DX file.
	 * @returns {String}
	 */
	dxUnitToMetricsUnitSymbol: function(unitStr)
	{
		if (!unitStr)
			return '';
		var map = Jcamp.DxUtils._dxUnitToMetricsObjMap;
		var metricsObj = map[unitStr];
		var result = metricsObj && metricsObj.symbol;
		if (!result)  // not found in map, return the raw string, but since in JCAMP all are uppercased, we need to convert to lower here
			result = unitStr.toLowerCase().upperFirst();
		return result;
	},
	/**
	 * Returns a unit symbol for JCAMP-DX data.
	 * @param {String} symbol
	 * @returns {String}
	 */
	mertricsUnitSymbolToDxUnit: function(symbol)
	{
		if (!symbol)
			return '';
		var map = Jcamp.DxUtils._dxUnitToMetricsObjMap;
		var names = Kekule.ObjUtils.getOwnedFieldNames(map);
		for (var i = 0, l = names.length; i < l; ++i)
		{
			var name = names[i];
			var unitObj = map[name];
			if (unitObj && unitObj.symbol === symbol)
			{
				return name;
			}
		}
		return symbol.toUpperCase();
	},
	/** @private */
	calcNumFactorForRange: function(minValue, maxValue, allowedErrorRatio, preferredScaleRangeMin, preferredScaleRangeMax)
	{
		return Jcamp.Utils.calcNumFactorForRange(minValue, maxValue, allowedErrorRatio, preferredScaleRangeMin, preferredScaleRangeMax);
	}
};

// create some ldr info for DX format
Kekule.IO.Jcamp.LabelTypeInfos.createInfos([
	// IR
	//['RESOLUTION', Jcamp.ValueType.STRING],  // already defined in jcamp.base.js
	// MS
	['SPECTROMETER TYPE', Jcamp.ValueType.STRING, null, Jcamp.LabelCategory.PARAMTER, KS.SpectrumType.MS],
	['INLET', Jcamp.ValueType.STRING, null, Jcamp.LabelCategory.PARAMTER, KS.SpectrumType.MS],
	['IONIZATION MODE', Jcamp.ValueType.STRING, null, Jcamp.LabelCategory.PARAMTER, KS.SpectrumType.MS],
	// NMR
	['OBSERVE FREQUENCY', Jcamp.ValueType.AFFN, null, Jcamp.LabelCategory.PARAMTER, KS.SpectrumType.NMR],  // in MHz
	['OBSERVE NUCLEUS', Jcamp.ValueType.STRING, null, Jcamp.LabelCategory.PARAMTER, KS.SpectrumType.NMR],
	['SOLVENT REFERENCE', Jcamp.ValueType.AFFN, null, Jcamp.LabelCategory.PARAMTER, KS.SpectrumType.NMR],  // Solvent lock signal in ppm
	['DELAY', Jcamp.ValueType.SIMPLE_AFFN_GROUP, null, Jcamp.LabelCategory.PARAMTER, KS.SpectrumType.NMR],
	['ACQUISITION MODE', Jcamp.ValueType.STRING, null, Jcamp.LabelCategory.PARAMTER, KS.SpectrumType.NMR],
	// IMS
	['IMS PRESSURE', Jcamp.ValueType.AFFN, null, Jcamp.LabelCategory.PARAMTER, KS.SpectrumType.IMS],  // in kilopascal
	['CARRIER GAS', Jcamp.ValueType.STRING, null, Jcamp.LabelCategory.PARAMTER, KS.SpectrumType.IMS],
	['DRIFT GAS', Jcamp.ValueType.STRING, null, Jcamp.LabelCategory.PARAMTER, KS.SpectrumType.IMS],
	['ELECTRIC FIELD', Jcamp.ValueType.SIMPLE_AFFN_GROUP, null, Jcamp.LabelCategory.PARAMTER, KS.SpectrumType.IMS],  // actually a (AFFN, AFFN) pair
	['ION POLARITY', Jcamp.ValueType.STRING, null, Jcamp.LabelCategory.PARAMTER, KS.SpectrumType.IMS],
	['IONIZATION MODE', Jcamp.ValueType.STRING, null, Jcamp.LabelCategory.PARAMTER, KS.SpectrumType.IMS],
	['IMS TEMPERATURE', Jcamp.ValueType.SIMPLE_AFFN_GROUP, null, Jcamp.LabelCategory.PARAMTER, KS.SpectrumType.IMS],   // actually (AFFN[, AFFN])
	['SHUTTER OPENING TIME', Jcamp.ValueType.AFFN, null, Jcamp.LabelCategory.PARAMTER, KS.SpectrumType.IMS],
	// chromatography/ms
	['MASS ANALYSER', Jcamp.ValueType.STRING, null, Jcamp.LabelCategory.PARAMTER, KS.SpectrumType.CHROMATOGRAPHY],
	['TANDEM SCANNING METHOD', Jcamp.ValueType.STRING, null, Jcamp.LabelCategory.PARAMTER, KS.SpectrumType.CHROMATOGRAPHY], // actually (STRING, {AFFN})
	['INTERFACE', Jcamp.ValueType.STRING, null, Jcamp.LabelCategory.PARAMTER, KS.SpectrumType.CHROMATOGRAPHY],
	['CHROMATOGRAPHY TYPE', Jcamp.ValueType.STRING, null, Jcamp.LabelCategory.PARAMTER, KS.SpectrumType.CHROMATOGRAPHY],
	['CHROMATOGRAPHY SOLVENTS', Jcamp.ValueType.STRING, null, Jcamp.LabelCategory.PARAMTER, KS.SpectrumType.CHROMATOGRAPHY],  // actually lines of (N,C,U)
	['ADDITIVES', Jcamp.ValueType.STRING, null, Jcamp.LabelCategory.PARAMTER, KS.SpectrumType.CHROMATOGRAPHY],   // actually lines of (N,C,U)
	['DIMENSIONALITY', Jcamp.ValueType.AFFN, null, Jcamp.LabelCategory.PARAMTER, KS.SpectrumType.CHROMATOGRAPHY]
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
		this.defineProp('currDataClass', {'dataType': DataType.STRING, 'setter': false, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});
		this.defineProp('currVarInfos', {'dataType': DataType.HASH, 'setter': false, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});
		this.defineProp('currNTuplesInfos', {'dataType': DataType.HASH, 'setter': false, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});
		this.defineProp('currNTuplesVarInfos', {'dataType': DataType.HASH, 'setter': false, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE,
			'getter': function()
			{
				var i = this.getCurrNTuplesInfos();
				return i && i.varInfos;
			}
		});
		this.defineProp('currNTuplesVarRawInfos', {'dataType': DataType.HASH, 'setter': false, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE,
			'getter': function()
			{
				var i = this.getCurrNTuplesInfos();
				return i && i.varRawInfos;
			}
		});
		this.defineProp('dataSectionsWithPeakAssignments', {'dataType': DataType.ARRAY, 'setter': false, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});
	},
	/** @ignore */
	initPropValues: function()
	{
		this.tryApplySuper('initPropValues');
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

		map[Jcamp.Consts.LABEL_BLOCK_BEGIN] = this.doStoreSpectrumTitleLdr.bind(this);

		map['DATATYPE'] = this.doStoreSpectrumDataTypeLdr.bind(this, 'DATATYPE');
		map['DATACLASS'] = this.doStoreSpectrumDataClassLdr.bind(this);
		var doStoreSpectrumDataLdrBind = this.doStoreSpectrumDataLdr.bind(this);
		var dataTableLdrNames = this._getDataTableLdrNames();
		for (var i = 0, l = dataTableLdrNames.length; i < l; ++i)
			map[dataTableLdrNames[i]] = doStoreSpectrumDataLdrBind;
		/*
		map['PEAK TABLE'] = this.doStoreSpectrumDataLdr.bind(this, 'PEAK TABLE');
		map['XYDATA'] = this.doStoreSpectrumDataLdr.bind(this, 'XYDATA');
		*/
		var varDefLdrNames = this._getDataTableVarDefLdrNames();
		var doStoreDataVarInfoLdrBind = this.doStoreDataVarInfoLdr.bind(this);
		for (var i = 0, l = varDefLdrNames.length; i < l; ++i)
			map[varDefLdrNames[i]] = doStoreDataVarInfoLdrBind;

		var ntuplesVarDefLdrNames = this._getNTuplesDefinitionLdrNames();
		var doStoreNTuplesAttributeLdrBind = this.doStoreNTuplesAttributeLdr.bind(this)
		for (var i = 0, l = ntuplesVarDefLdrNames.length; i < l; ++i)
			map[ntuplesVarDefLdrNames[i]] = doStoreNTuplesAttributeLdrBind;
		map['DATATABLE'] = this.doStoreNTuplesDataLdr.bind(this);   // NTuples data table

		var spectrumParamLdrNames = this._getSpectrumParamLdrNames();
		var spectrumNames = Kekule.ObjUtils.getOwnedFieldNames(spectrumParamLdrNames);
		for (var i = 0, ii = spectrumNames.length; i < ii; ++i)
		{
			var spectrumName = spectrumNames[i];
			var doStoreSpectrumParamLdrBindWithName = this.doStoreSpectrumParamLdr.bind(this, spectrumName);
			var ldrNames = spectrumParamLdrNames[spectrumName];
			for (var j = 0, jj = ldrNames.length; j < jj; ++j)
			{
				map[ldrNames[j]] = doStoreSpectrumParamLdrBindWithName;
			}
		}

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
			'PAGE', 'POINTS', /*'NPOINTS'?,*/ /* 'CASNAME',*/
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
	/** @private */
	_getSpectrumParamLdrNames: function()
	{
		return {
			'ir': ['RESOLUTION'],
			'uv_vis': ['RESOLUTION'],
			'nmr': ['.OBSERVEFREQUENCY', '.OBSERVENUCLEUS', '.SOLVENTREFERENCE', '.DELAY', '.ACQUISITIONMODE'],
			'ms': ['.SPECTROMETERTYPE', '.INLET', '.IONIZATIONMODE'],
			'ims': ['.IMSPRESSURE', '.CARRIERGAS', '.DRIFTGAS', '.ELECTRICFIELD', '.IONPOLARITY', '.IONIZATIONMODE', '.IMSTEMPERATURE', '.SHUTTEROPENINGTIME'],
			'chromatography': ['.MASSANALYSER', '.TANDEMSCANNINGMETHOD', '.INTERFACE', '.CHROMATOGRAPHYTYPE', '.CHROMATOGRAPHYSOLVENTS', '.ADDITIVES', '.DIMENSIONALITY']
		}
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

	/** @ignore */
	getPendingLdrNames: function()
	{
		var names = [
			'RESOLUTION'   // need to detect the unit of XAxis
		];
		return this.tryApplySuper('getPendingLdrNames').concat(names);
	},
	/** @private */
	doStoreSpectrumTitleLdr: function(ldr, block, chemObj, preferredInfoPropName)
	{
		chemObj.setTitle(Jcamp.LdrValueParserCoder.parseValue(ldr));
	},
	/** @private */
	doStoreDataVarInfoLdr: function(ldr, block, chemObj, preferredInfoPropName)
	{
		var info = this.getCurrVarInfos();
		info[ldr.labelName] = Jcamp.LdrValueParserCoder.parseValue(ldr);
	},
	/** @private */
	doStoreNTuplesAttributeLdr: function(ldr, block, chemObj, preferredInfoPropName)
	{
		var info = this.getCurrNTuplesInfos();
		var value = Jcamp.LdrValueParserCoder.parseValue(ldr);
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
	doStoreSpectrumDataTypeLdr: function(ldrLabelName, ldr, block, chemObj, preferredInfoPropName)
	{
		var ldrValue = Jcamp.LdrValueParserCoder.parseValue(ldr);
		if (ldrValue && ldrValue.toUpperCase)  // a normal string value
		{
			var stype = Jcamp.DxUtils.jcampSpectrumTypeToKekule(ldrValue);
			/*
			var SType = Kekule.Spectroscopy.SpectrumType;
			ldrValue = ldrValue.toUpperCase();
			var stype = (ldrValue.indexOf('INFRARED') >= 0)? SType.IR:
				(ldrValue.indexOf('NMR') >= 0)? SType.NMR:
				(ldrValue.indexOf('MASS') >= 0)? SType.MS:
				(ldrValue.indexOf('ION MOBILITY') >= 0 || ldrValue.indexOf('IMS') >= 0)? SType.IMS:
				(ldrValue.indexOf('RAMAN') >= 0)? SType.RAMAN:
				(ldrValue.indexOf('UV') >= 0)? SType.UV_VIS:
				SType.GENERAL;
			*/
			chemObj.setSpectrumType(stype);
		}
		// Removed: also save the full LDR value to info property
		// this.doStoreLdrToChemObjInfoProp(ldrLabelName, ldr, block, chemObj, preferredInfoPropName);
	},
	/** @private */
	doStoreSpectrumDataClassLdr: function(ldr, block, chemObj, preferredInfoPropName)
	{
		var ldrValue = Jcamp.LdrValueParserCoder.parseValue(ldr);
		this.setPropStoreFieldValue('currDataClass', ldrValue);  // record the data class value, for analyis the spectrum data later
	},
	/** @private */
	doStoreSpectrumDataLdr: function(ldr, block, chemObj, preferredInfoPropName)
	{
		//console.log('doStoreSpectrumDataLdr', ldr);
		// check whether the DATA_CLASS matches LDR label name, ensure this is the LDR containing the spectrum data
		if (this._isSpectrumDataLdr(ldr, block, chemObj))
		{
			if (this._isDataTableLabelName(ldr.labelName))
			{
				var dataValue = Jcamp.LdrValueParserCoder.parseValue(ldr, {doValueCheck: true});
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
				// rest of them should be dependent
				for (var i = 1, l = varInfos.length; i < l; ++i)
				{
					varInfos[i].dependency = Kekule.VarDependency.DEPENDENT;
				}
				var varDefinitions = this._createSpectrumVariableDefinitions(varInfos);  // ensure X before Y
				//console.log(formatDetail);
				//console.log(varInfos);
				//console.log(dataValue);
				//var spectrumData = new Kekule.Spectroscopy.SpectrumData(null, varDefinitions);
				var spectrumData = chemObj.getData();
				spectrumData.setVariables(varDefinitions);
				var isContinuous = (ldr.labelName.indexOf('PEAK') < 0) && (ldr.labelName.indexOf('ASSIGNMENT') < 0);
				var isPeakAssignments = (ldr.labelName.indexOf('ASSIGNMENT') >= 0);
				spectrumData.setMode(isContinuous? Kekule.Spectroscopy.DataMode.CONTINUOUS: Kekule.Spectroscopy.DataMode.PEAK);

				var spectrumDataSection = this._createSpectrumDataSectionByFormat(formatDetail, dataValue.values, varInfos, spectrumData, isPeakAssignments, this.getCurrOptions());
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
			var info = {
				'symbol': varSymbol,
				'units': getVarInfoValue(varSymbol + 'UNITS'),
				'firstValue': getVarInfoValue('FIRST' + varSymbol),
				'lastValue': getVarInfoValue('LAST' + varSymbol),
				'maxValue': getVarInfoValue('MAX' + varSymbol),
				'minValue': getVarInfoValue('MIN' + varSymbol),
				'factor': getVarInfoValue(varSymbol + 'FACTOR')
			};
			if (!info.units && i === 2 && varSymbol === 'W')   // W in XYW peak table or XYWA peak assignments, its units follows X
				info.units = getVarInfoValue('XUNITS');
			result.push(info);
			result._symbols.push(varSymbol);
			result._bySymbol[varSymbol] = result[result.length - 1];
		}
		return result;
	},
	/** @private */
	_createSpectrumVariableDefinitions: function(varInfos)
	{
		var result = [];
		var options = this.getCurrOptions();
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

			var def = new Kekule.Spectroscopy.SpectrumVarDefinition({
				'name': (info.name || '').toLowerCase(),  // LDR values are often uppercased
				'symbol': info.symbol,
				'unit': Jcamp.DxUtils.dxUnitToMetricsUnitSymbol(info.units),
				//'minValue': info.minValue,
				//'maxValue': info.maxValue,
				'dependency': Kekule.ObjUtils.notUnset(info.dependency)? info.dependency: Kekule.VarDependency.DEPENDENT
			});

			if (Kekule.ObjUtils.notUnset(info.minValue) && Kekule.ObjUtils.notUnset(info.maxValue) && options.useDxMinMaxValueAsDisplayRange)
			{
				if (info.minValue !== info.maxValue)  // some times these value are all 0, means unavailable values?
					def.setInfoValue('displayRange', {'min': info.minValue, 'max': info.maxValue});
			}

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

		var dataValue = Jcamp.LdrValueParserCoder.parseValue(ldr, {doValueCheck: true});
		//var varFormat = dataValue.format;
		//var formatDetail = Jcamp.Utils.getDataTableFormatAndPlotDetails(varFormat);
		var formatDetail = dataValue.formatDetail;
		var plotDescriptor = formatDetail.plotDescriptor || '';
		var localVarSymbols = formatDetail.vars;

		var isContinuous = (plotDescriptor.indexOf('PEAK') < 0) && (plotDescriptor.indexOf('ASSIGNMENT') < 0);
		var isPeakAssignments = (plotDescriptor.indexOf('ASSIGNMENT') >= 0);
		var dataMode = isContinuous? Kekule.Spectroscopy.DataMode.CONTINUOUS: Kekule.Spectroscopy.DataMode.PEAK;

		var spectrumDataSection = this._createSpectrumDataSectionByFormat(formatDetail, dataValue.values, varInfos, spectrumData, isPeakAssignments, this.getCurrOptions());
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
	doStoreSpectrumParamLdr: function(spectrumName, ldr, block, chemObj, preferredInfoPropName)  // save the spectrum specified key params
	{
		var spectrumType = spectrumName.toUpperCase();
		// first ensure the spectrumName matches current spectrum type, if not, bypass this LDR
		if (chemObj.getSpectrumType() && chemObj.getSpectrumType() !== spectrumType)
			return;
		else
		{
			var labelName = ldr.labelName;
			var value = Jcamp.LdrValueParserCoder.parseValue(ldr);
			var defaultHandler = function(newValue)
			{
				/*
				var name = labelName;
				if (name.startsWith(Jcamp.Consts.SPECIFIC_LABEL_PREFIX))
					name = name.substr(Jcamp.Consts.SPECIFIC_LABEL_PREFIX.length);
				chemObj.setParameter(name.toLowerCase(), value);
				*/
				chemObj.setParameter(preferredInfoPropName, newValue);
			};
			if (spectrumType === KS.SpectrumType.IR || spectrumType === KS.SpectrumType.UV_VIS)
			{
				if (labelName === 'RESOLUTION')  // may be a number or R1,X1,; . . . ;Ri,Xi, same unit to X axis
				{
					var isSingleNum = value.indexOf(Jcamp.Consts.SIMPLE_VALUE_DELIMITER) < 0;
					if (isSingleNum)
					{
						value = parseFloat(value) || value;
						// get the independent var unit
						var unit;
						for (var i = 0, l = chemObj.getVariableCount(); i < l; ++i)
						{
							var varDef = chemObj.getVariable(i);
							if (varDef.isIndependent())
							{
								var unitSymbol = varDef.getUnit();
								var unitObj = unitSymbol && Kekule.Unit.getUnit(unitSymbol);
								if (unitObj.category === Kekule.Unit.Length)
								{
									unit = unitSymbol;
									break;
								}
							}
						}
						if (unit)
							value = Kekule.Scalar.create(value, unit);
					}
					//chemObj.setParameter('resolution', value);
					defaultHandler(value);
				}
			}
			else if (spectrumType === KS.SpectrumType.NMR)
			{
				if (labelName === '.OBSERVENUCLEUS')
				{
					var targetNucleus = (value.indexOf('C') >= 0 && value.indexOf('13') >= 0)? KS.SpectrumNMR.TargetNucleus.C13:
						(value.indexOf('H') >= 0)? KS.SpectrumNMR.TargetNucleus.H:
						value;
					//chemObj.setParameter('nucleus', targetNucleus);
					defaultHandler(targetNucleus);
				}
				else if (labelName === '.OBSERVEFREQUENCY')
				{
					if (Kekule.NumUtils.isNormalNumber(value))
						value = Kekule.Scalar.create(value, Kekule.Unit.Frequency.MEGAHERTZ.symbol);  // the value is stored in MHz in Jcamp-DX
					defaultHandler(value);
					//chemObj.setParameter('observeFrequency', Kekule.Scalar.create(value, Kekule.Unit.Frequency.MEGAHERTZ.symbol)); // the value is stored in MHz in Jcamp-DX
				}
				else if (labelName === '.SOLVENTREFERENCE')
				{
					if (Kekule.NumUtils.isNormalNumber(value))
						value = Kekule.Scalar.create(value, Kekule.Unit.Dimensionless.PARTS_PER_MILLION.symbol);
					defaultHandler(value);
					//	chemObj.setParameter('solventReference', Kekule.Scalar.create(value, Kekule.Unit.Dimensionless.PARTS_PER_MILLION.symbol));
				}
				else if (labelName === '.DELAY')
				{
					if (Kekule.NumUtils.isNormalNumber(value))
						value = Kekule.Scalar.create(value, Kekule.Unit.Time.MICROSECOND.symbol);
					defaultHandler(value);
					//	chemObj.setParameter('delays', Kekule.Scalar.create(value, Kekule.Unit.Time.MICROSECOND.symbol));
				}
				/*
				else if (labelName === '.ACQUISITIONMODE')
				{
					chemObj.setParameter('acquisitionMode', value.toLowerCase());
				}
				*/
				else
					defaultHandler(value);
			}
			else if (spectrumType === KS.SpectrumType.MS)
			{
				defaultHandler(value);
			}
			else if (spectrumType === KS.SpectrumType.IMS)
			{
				defaultHandler(value);
			}
			else
				defaultHandler(value);
			// TODO: more spectrum type handlers
		}
	},

	/** @private */
	_calcActualVarValue: function(dataValue, varInfo)
	{
		return dataValue * (varInfo.factor || 1);
	},
	/** @private */
	_createSpectrumDataSectionByFormat: function(formatDetail, data, varinfos, parentSpectrumData, isPeakAssignments, options)
	{
		var result;
		if (formatDetail.format === Jcamp.Consts.DATA_VARLIST_FORMAT_XYDATA)
		{
			result = this._createXyDataFormatSpectrumDataSection(formatDetail, data, varinfos, parentSpectrumData, options);
		}
		else if (formatDetail.format === Jcamp.Consts.DATA_VARLIST_FORMAT_XYPOINTS)
		{
			result = this._createXyPointsFormatSpectrumDataSection(formatDetail, data, varinfos, parentSpectrumData, options);
		}
		else if (formatDetail.format === Jcamp.Consts.DATA_VARLIST_FORMAT_VAR_GROUPS) // may containing peak assignments
		{
			if (isPeakAssignments)
				result = this._createPeakAssignmentsVarGroupFormatSpectrumDataSection(formatDetail, data, varinfos, parentSpectrumData, options);
			else
				result = this._createVarGroupFormatSpectrumDataSection(formatDetail, data, varinfos, parentSpectrumData, options);
		}
		//console.log('data', formatDetail, varinfos, result);
		//console.log('section', result.calcDataRange('Y'));
		return result;
	},
	/** @private */
	_createXyDataFormatSpectrumDataSection: function(formatDetail, dataLines, varInfos, parentSpectrumData, options)
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
			var allowedError = Math.abs(varIncValueRange.lastValue - varIncValueRange.firstValue) * options.dxDataAllowedLoadingErrorRatio;
			if (Jcamp.Utils.compareFloat(varIncValueRange.firstValue, varInfos._bySymbol[varSymbolInc].firstValue, allowedError) !== 0
				|| Jcamp.Utils.compareFloat(varIncValueRange.lastValue, varInfos._bySymbol[varSymbolInc].lastValue, allowedError) !== 0)
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
	_createXyPointsFormatSpectrumDataSection: function(formatDetail, data, varInfos, parentSpectrumData, options)
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
				var dataValues = data[i];
				var actualValues = [];
				for (var j = 0, jj = dataValues.length; j < jj; ++j)
				{
					var v = this._calcActualVarValue(dataValues[j], varInfos[j]);
					actualValues.push(v);
				}
				result.appendData(actualValues);
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
	_createVarGroupFormatSpectrumDataSection: function(formatDetail, data, varInfos, parentSpectrumData, options)
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
				var dataValues = data[i];
				var actualValues = [];
				for (var j = 0, jj = dataValues.length; j < jj; ++j)
				{
					var v = this._calcActualVarValue(dataValues[j], varInfos[j]);
					actualValues.push(v);
				}
				result.appendData(actualValues);
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
	_createPeakAssignmentsVarGroupFormatSpectrumDataSection: function(formatDetail, data, varInfos, parentSpectrumData, options)
	{
		//console.log(formatDetail, varInfos);
		var hasAssignments = false;
		// check if there is really assignment var (A) and peak width (W)
		// TODO: in NTuple, how to find out the assignment and width var if they are with different symbol?
		var normalVarSymbols = formatDetail.vars.slice(0, 2);
		var specialVarTypes = [null, null];  // A: assignment, W: peak width, M: multiplicity
		if (formatDetail.vars.length > 2)  // XYA or XYWA
		{
			for (var i = 2, l = formatDetail.vars.length; i < l; ++i)
			{
				var symbolType = formatDetail.vars[i].toUpperCase()[0];
				if (['A', 'W', 'M'].indexOf(symbolType) >= 0)
					specialVarTypes.push(symbolType);
				else
				{
					specialVarTypes.push(null);
					normalVarSymbols.push(formatDetail.vars[i]);
				}
			}

			var hasPeakAssignments = false;
			var result = parentSpectrumData.createSection(normalVarSymbols);
			result.beginUpdate();
			try
			{
				var dataRows = [];
				for (var i = 0, l = data.length; i < l; ++i)
				{
					// each item is a data group, containing values of all variables
					if (specialVarTypes.length)
					{
						var originValues = data[i];
						var inputValues = [];
						var extraDataItem = {};
						for (var j = 0, jj = specialVarTypes.length; j < jj; ++j)  // handle special var values
						{
							var vType = specialVarTypes[j];
							if (vType === 'M')  // muliplicity
							{
								// TODO: does JCAMP support peak muliplicity? And how to do the conversion?
							}
							else if (vType === 'W')  // width
							{
								inputValues.push(originValues[j]);
							}
							else if (vType === 'A')  // peak assignment
							{
								if (Kekule.ObjUtils.notUnset(originValues[j]) && !options.disablePeakAssignmentReading)
									extraDataItem.peakAssignmentRaw = [originValues[j]];
							}
							else
							{
								var actualValue = this._calcActualVarValue(originValues[j], varInfos[j]);
								inputValues.push(actualValue);
							}
						}
						if (Kekule.ObjUtils.getOwnedFieldNames(extraDataItem).length)
						{
							inputValues._extra = new Kekule.Spectroscopy.SpectrumPeakDetails();
							inputValues._extra._peakAssignmentRaw = extraDataItem.peakAssignmentRaw;
							hasPeakAssignments = true;
						}
						//console.log(originValues, inputValues);
						dataRows.push(inputValues);
						//result.appendData(inputValues);
					}
					else
						dataRows.push(data[i]);
						//result.appendData(data[i]);
				}

				// merge data rows of same value (but different assigment), e.g.:
				//   (6.71349,0.34, ,<14>)
				//   (6.71349,0.34, ,<15>)
				// which actually means this peak is with two assignment atoms
				if (hasPeakAssignments)
					dataRows = this._mergePeakAssignmentDataRows(dataRows, specialVarTypes);

				for (var i = 0, l = dataRows.length; i < l; ++i)
				{
					result.appendData(dataRows[i]);
				}
				result.setDataSorted(true);
				if (hasPeakAssignments)
					this.getDataSectionsWithPeakAssignments().push(result);
			}
			finally
			{
				result.endUpdate();
			}
			return result;
		}
		else  // with no special assigment
			return this._createVarGroupFormatSpectrumDataSection(formatDetail, data, varInfos, parentSpectrumData, options);
	},
	/** @private */
	_mergePeakAssignmentDataRows: function(dataRows, specialVarTypes)
	{
		var NU = Kekule.NumUtils;
		var isSamePeak = function(row1, row2)
		{
			var result = true;
			for (var i = 0, l = specialVarTypes.length; i < l; ++i)
			{
				if (specialVarTypes[i] !== 'A')
				{
					var v1 = row1[i];
					var v2 = row2[i];
					if (v1 != v2 && (NU.isNormalNumber(v1) && NU.isNormalNumber(v2) && !Kekule.NumUtils.isFloatEqual(v1, v2)))
					{
						result = false;
						break;
					}
				}
			}
			return result;
		}
		var findSamePeakRow = function(row, targetRows)
		{
			for (var i = 0, l = targetRows.length; i < l; ++i)
			{
				if (isSamePeak(row, targetRows[i]))
					return targetRows[i];
			}
			return null;
		}
		if (specialVarTypes.indexOf('A') >= 0)  // may need to merge peak assignments
		{
			var result = [];
			for (var i = 0, l = dataRows.length; i < l; ++i)
			{
				var row = dataRows[i];
				//console.log(row, row._extra);
				var samePeakRow = findSamePeakRow(row, result);
				if (samePeakRow && row._extra._peakAssignmentRaw)  // find the same peak row, need to merge
				{
					if (samePeakRow._extra._peakAssignmentRaw)
						samePeakRow._extra._peakAssignmentRaw = samePeakRow._extra._peakAssignmentRaw.concat(row._extra._peakAssignmentRaw);
					else
						samePeakRow._extra._peakAssignmentRaw = row._extra._peakAssignmentRaw;
				}
				else
					result.push(row);
			}
			return result;
		}
		else
			return dataRows;
	},
	/** @private */
	_isSpectrumDataLdr: function(ldr, block, chemObj)
	{
		//console.log(chemObj.getClassName());
		var result = (!chemObj.getData() || chemObj.getData().getSectionCount() <= 0);  // if spectrum data already be built, a data LDR has previously be parsed and this one should not be the data
		if (result)
		{
			//var dataClassValue = chemObj.getInfoValue('DATA CLASS') || null;
			var dataClassValue = this.getCurrDataClass() || null;
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
			this.setPropStoreFieldValue('dataSectionsWithPeakAssignments', []);
		}
		else
			result = this.tryApplySuper('doCreateChemObjForBlock', [block]);
		return result;
	},
	/** @ignore */
	doBuildCrossRef: function(srcObj, targetObj, refType, refTypeText)
	{
		this.tryApplySuper('doBuildCrossRef', [srcObj, targetObj, refType, refTypeText]);
		if (refType === Jcamp.CrossRefType.STRUCTURE && targetObj instanceof Kekule.StructureFragment && srcObj instanceof Kekule.Spectroscopy.Spectrum)
		{
			Jcamp.Utils.addMoleculeSpectrumCrossRef(srcObj, targetObj);
			var sections = this.getDataSectionsWithPeakAssignments();
			if (sections.length)
			{
				for (var i = 0, l = sections.length; i < l; ++i)
				{
					this._buildPeakAssignmentRefs(sections[i], targetObj);
				}
			}
			var options = this.getCurrOptions();
			if (options.autoHiddenSpectrumRefMolecule && targetObj.setVisible)
				targetObj.setVisible(false);
		}
	},
	/** @private */
	_buildPeakAssignmentRefs: function(dataSection, targetMol)
	{
		for (var i = 0, l = dataSection.getDataCount(); i < l; ++i)
		{
			var extra = dataSection.getExtraInfoAt(i);
			if (extra && extra._peakAssignmentRaw)
			{
				var atoms = [];
				for (var j = 0, jj = extra._peakAssignmentRaw.length; j < jj; ++j)
				{
					var assign = extra._peakAssignmentRaw[j];
					var atomIndex = parseInt(assign);
					if (Kekule.NumUtils.isNormalNumber(atomIndex) && atomIndex > 0)  // the atom index starts with 1
					{
						var atom = targetMol.getNodeAt(atomIndex - 1);
						if (atom)
						{
							AU.pushUnique(atoms, atom);
						}
					}
				}
				extra.setAssignments(atoms);
				delete extra._peakAssignmentRaw;
			}
		}
	}
});

/**
 * Writer for writing a DX data block to JCAMP document tree.
 * The input chem object should be an instance of {@link Kekule.Spectroscopy.Spectrum}.
 * @class
 * @augments Kekule.IO.Jcamp.BlockWriter
 */
Kekule.IO.Jcamp.DxDataBlockWriter = Class.create(Kekule.IO.Jcamp.BlockWriter,
/** @lends Kekule.IO.Jcamp.DxDataBlockWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.Jcamp.DxDataBlockWriter',
		/** @private */
	initProperties: function()
	{
		// private ,storing the map of Jcamp var symbol to Kekule var symbol
		this.defineProp('varSymbolMap', {'dataType': DataType.HASH, 'setter': false, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});
		//this.defineProp('sectionPeakAssignmentInfoCache', {'dataType': DataType.OBJECT, 'setter': false, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});
		//this.defineProp('peakSectionInfo', {'dataType': DataType.HASH, 'setter': false, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});
	},
	/** @ignore */
	_initLdrCreators: function()
	{
		this.tryApplySuper('_initLdrCreators');
		var map = this.getLdrCreatorMap();
		map['metaData.date'] = this._dateLdrCreator.bind(this);
		map['parameters.NMR.ObserveNucleus'] = this._nmrObserveNucleusLdrCreator.bind(this);;
		map['parameters.NMR.ObserveFrequency'] = this._scalarWithSpecifiedUnitLdrCreator.bind(this, Kekule.Unit.Frequency.MEGAHERTZ);
		map['parameters.NMR.SolventReference'] = this._scalarWithSpecifiedUnitLdrCreator.bind(this, Kekule.Unit.Dimensionless.PARTS_PER_MILLION);
		map['parameters.NMR.Delay'] = this._scalarWithSpecifiedUnitLdrCreator.bind(this, Kekule.Unit.Time.MICROSECOND);
	},
	/* @ignore */
	doWriteBlock: function(chemObj, options)
	{
		// retrieve and store peak information first
		//this.setPropStoreFieldValue('peakSectionInfo', new Kekule.MapEx());
		return this.tryApplySuper('doWriteBlock', [chemObj, options]);
	},
	/** @ignore */
	getTitleForBlock: function(chemObj)
	{
		return chemObj.getTitle() || chemObj.getName() || chemObj.getId();
	},
	/** @ignore */
	doSaveJcampVersionToBlock: function(chemObj, block, options)
	{
		this.saveToLdrInBlock(block, chemObj, '', options.outputDxVersion || Kekule.globalOptions.IO.jcamp.outputDxVersion, Jcamp.Consts.LABEL_DX_VERSION);
	},
	/** @ignore */
	doGetDataTypeForBlock: function(chemObj)
	{
		return this.doGetJcampSpectrumDataType(chemObj);
	},
	/** @ignore */
	doSaveChemObjToBlock: function(chemObj, block, options)
	{
		this.tryApplySuper('doSaveChemObjToBlock', [chemObj, block, options]);
		// DATA CLASS placeholder
		this.saveToLdrInBlock(block, chemObj, '', '', 'DATA CLASS');
		// cross ref
		this.doSaveChemObjCrossRefToBlock(chemObj, block, options);
		// spectrum data
		this.doSaveSpectrumDataToBlock(chemObj, block, options);
	},
	/** @private */
	doSaveChemObjCrossRefToBlock: function(chemObj, block, options)
	{
		var refMol = chemObj.getRefMolecule();
		//console.log(refMol);
		if (refMol)
		{
			var refBlockInfo = this.getBlockInfoFromObj(refMol);
			if (refBlockInfo && refBlockInfo.id)
			{
				var refText = 'STRUCTURE' + Jcamp.Consts.CROSS_REF_TYPE_TERMINATOR +
					' BLOCK_ID' + Jcamp.Consts.DATA_LABEL_TERMINATOR + refBlockInfo.id;
				this.saveToLdrInBlock(block, chemObj, '', refText, Jcamp.Consts.LABEL_CROSS_REF);
			}
		}
	},
	/** @ignore */
	doSaveChemObjInfoToBlock: function(chemObj, block, options)
	{
		// do not inherited parent method here, since we have specified saving functions here
		this.doSaveSpectrumKeyMetaToBlock(chemObj, block, options);
		this.doSaveSpectrumInfoToBlock(chemObj, block, options);
	},
	/** @private */
	doSaveSpectrumKeyMetaToBlock: function(chemObj, block, options)
	{
		/*
		// save the spectrum type
		var jcampType = this.doGetJcampSpectrumDataType(chemObj);
		this.saveToLdrInBlock(block, chemObj, '', jcampType, Jcamp.Consts.LABEL_DATA_TYPE, true);
		*/
	},
	/** @private */
	doGetJcampSpectrumDataType: function(spectrum)
	{
		var result;
		var spectrumType = spectrum.getSpectrumType();
		//var coreName = Jcamp.DxUtils.kekuleSpectrumTypeToJcampCoreName(spectrumType || KSType.GENERAL);
		var peakDetails = this._getSpectrumPeakDetails(spectrum);
		if (spectrumType === KSType.IR)
		{
			result = peakDetails.isPeak? 'INFRARED PEAK TABLE': 'INFRARED SPECTRUM';
		}
		else if (spectrumType === KSType.RAMAN)
		{
			result = 'RAMAN SPECTRUM';
		}
		else if (spectrumType === KSType.NMR)
		{
			// TODO: 'NMR FID" is not handled
			result = peakDetails.isPeakAssignment? 'NMR PEAK ASSIGNMENTS':
				peakDetails.isPeak? 'NMR PEAK TABLE':
				'NMR SPECTRUM';
		}
		else if (spectrumType === KSType.MS)
		{
			result = peakDetails.isPeak? 'MASS SPECTRUM': 'CONTINUOUS MASS SPECTRUM';
		}
		else if (spectrumType === KSType.UV_VIS)
		{
			result = 'UV/VIS SPECTRUM';   // TODO: is this suffcient?
		}
		else if (spectrumType === KSType.IMS)
		{
			result = peakDetails.isPeakAssignment? 'IMS PEAK ASSIGNMENTS':
				peakDetails.isPeak? 'IMR PEAK TABLE':
				'ION MOBILITY SPECTRUM';
		}
		else  // general
		{
			result = null;
		}
		return result;
	},
	/** @private */
	_getSpectrumPeakDetails: function(spectrum)  // returns whether all sections are peak table/peak assignments
	{
		var result = {isPeak: true, isPeakAssignment: true};
		for (var i = 0, l = spectrum.getDataSectionCount(); i < l; ++i)
		{
			var section = spectrum.getDataSectionAt(i);
			result.isPeak = result.isPeak && section.isPeakSection();
			result.isPeakAssignment = result.isPeakAssignment && section.hasPeakAssignments();
			if (!result.isPeak && !result.isPeakAssignment)
				break;
		}
		return result;
	},
	/** @private */
	doSaveSpectrumInfoToBlock: function(chemObj, block, options)
	{
		var spectrumType = chemObj.getSpectrumType();

		// meta/parameter/condition/annotations
		var infoCategories = chemObj.getSpectrumInfoCategories();
		AU.pushUnique(infoCategories, '');   // include the top level info keys/values
		for (var i = 0, l = infoCategories.length; i < l; ++i)
		{
			var category = infoCategories[i];
			var keys = chemObj.getSpectrumInfoKeysOfCategory(category);
			for (var j = 0, jj = keys.length; j < jj; ++j)
			{
				var key = keys[j];
				var jsName = category + '.' + key;
				var jsValue = chemObj.getSpectrumInfoValue(key, category);
				if (Kekule.ObjUtils.notUnset(jsValue))
				{
					this.doSaveSpectrumInfoItemToBlock(chemObj, key, jsName, jsValue, block, spectrumType, options);
				}
			}
		}
	},
	/** @private */
	doSaveSpectrumInfoItemToBlock: function(chemObj, infoKey, infoJsCascadeName, infoValue, block, spectrumType, options)
	{
		var ignoredLabels = [Jcamp.Consts.LABEL_BLOCK_BEGIN, Jcamp.Consts.LABEL_BLOCK_END, Jcamp.Consts.LABEL_DX_VERSION, Jcamp.Consts.LABEL_CS_VERSION];
		  // those labels are handled individually, do not save here
		var jcampLabelName = Jcamp.Utils.kekuleLabelNameToJcamp(infoKey, spectrumType);
		if (ignoredLabels.indexOf(jcampLabelName) < 0)
		{
			this.saveToLdrInBlock(block, chemObj, infoJsCascadeName, infoValue, jcampLabelName, false);  // do not overwrite existing labels
		}
	},
	/** @private */
	doInsertDataClassToBlock: function(chemObj, block, dataClass, options)
	{
		if (dataClass)
		{
			var ldr = this.createLdrRaw('DATA CLASS', [dataClass]);
			this.setLdrInBlock(block, ldr, true);  // overwrite the placeholder
		}
	},
	/** @private */
	doSaveSpectrumDataToBlock: function(spectrum, block, options)
	{
		var storageStyle = this.doGetSpectrumDataStorageStyle(spectrum, options);
		if (storageStyle === Jcamp.SpectrumDataStorageStyle.CLASSIC)
		{
			// the classis style can only save one data section of spectrum
			this.doSaveSpectrumSectionDataToClassic(spectrum, spectrum.getActiveDataSection(), block, options);
		}
		else
		{
			var targetSections = [];
			// filter out empty sections
			for (var i = 0, l = spectrum.getDataSectionCount(); i < l; ++i)
			{
				var sec = spectrum.getDataSectionAt(i);
				if (sec.getDataCount())
					targetSections.push(sec);
			}
			this.doSaveSpectrumSectionsDataToNTuple(spectrum, targetSections, block, options);
		}
	},
	/** @private */
	doGetSpectrumDataStorageStyle: function(spectrum, options) // output to NTuple, or tranditional XYData/Peak Table?
	{
		var result = Kekule.oneOf(options.dxDataStorageStyle, Kekule.globalOptions.IO.jcamp.dxDataStorageStyle);
		if (result === Jcamp.SpectrumDataStorageStyle.SMART)
		{
			var sectionCount = spectrum.getDataSectionCount();
			result = (sectionCount > 1)? Jcamp.SpectrumDataStorageStyle.NTUPLE: Jcamp.SpectrumDataStorageStyle.CLASSIC;
		}
		return result;
	},
	/**
	 * Returns the preferred data format for storing data in dataSection.
	 * @private
	 */
	doGetSpectrumSectionDataStorageFormat: function(spectrum, dataSection, options)
	{
		var isPeak = dataSection.isPeakSection();
		//var isPeakAssignment = dataSection.hasPeakAssignments();
		if (isPeak)  // TODO: currently the assignments are not considered
		{
			var varCount = dataSection.getActualLocalVarInfos().length;

			var hasAssignments = dataSection.hasPeakAssignments();
			if (hasAssignments && !options.disablePeakAssignmentWriting)
				return Jcamp.Consts.DATA_VARLIST_FORMAT_VAR_GROUPS;
			else
				return (varCount <= 2)? Jcamp.Consts.DATA_VARLIST_FORMAT_XYPOINTS: Jcamp.Consts.DATA_VARLIST_FORMAT_XYWPOINTS;
		}
		else  // continuous data
		{
			var indepVarDef = spectrum.getVariablesOfDependency(Kekule.VarDependency.INDEPENDENT)[0];  // assume there is only one indep var
			if (indepVarDef && dataSection.getContinuousVarRange(indepVarDef))
				return Jcamp.Consts.DATA_VARLIST_FORMAT_XYDATA;
			else
				return Jcamp.Consts.DATA_VARLIST_FORMAT_XYPOINTS;
		}
	},
	/** @private */
	doGetSpectrumVariableInfoOfSections: function(spectrum, spectrumSections, options)
	{
		var result = [];
		var hasPeakAssignment = false;
		// collect all used varDefs
		var varDefs = [];
		var sectionDataDetailsMap = new Kekule.MapEx();
		for (var i = 0, l = spectrumSections.length; i < l; ++i)
		{
			var section = spectrumSections[i];
			hasPeakAssignment = hasPeakAssignment || section.hasPeakAssignments();
			var firstSectionValue = {}, lastSectionValue = {};
			if (section.getDataCount())
			{
				firstSectionValue = section.getValueAt(0);
				lastSectionValue = section.getValueAt(section.getDataCount() - 1);
			}
			var varInfos = section.getActualLocalVarInfos();
			for (var j = 0, jj = varInfos.length; j < jj; ++j)
			{
				var varDef = section.getLocalVarDef(j);
				if (varDefs.indexOf(varDef) < 0)
				{
					varDefs.push(varDef);
					sectionDataDetailsMap.set(varDef, {
						'dataCount': section.getDataCount(),
						'firstValue': firstSectionValue[varDef.getSymbol()],
						'lastValue': lastSectionValue[varDef.getSymbol()]
					});
				}
				else  // already exists
				{
					var details = sectionDataDetailsMap.get(varDef);
					details.dataCount = Math.max(details.dataCount, section.getDataCount());
					var oldFirst = details.firstValue;
					var oldLast = details.lastValue;
					if (Kekule.ObjUtils.notUnset(firstSectionValue[varDef.getSymbol()]))
					{
						if (Kekule.ObjUtils.isUnset(oldFirst) || firstSectionValue[varDef.getSymbol()] < oldFirst)
							details.firstValue = firstSectionValue[varDef.getSymbol()];
					}
					if (Kekule.ObjUtils.notUnset(lastSectionValue[varDef.getSymbol()]))
					{
						if (Kekule.ObjUtils.isUnset(oldLast) || lastSectionValue[varDef.getSymbol()] > oldLast)
							details.lastValue = lastSectionValue[varDef.getSymbol()];
					}
				}
			}
		}
		var varRanges = spectrum.getData().calcDataRangeOfSections(spectrumSections, varDefs, {basedOnInternalUnit: true, ignorePeakRoot: true});
		var usedSymbols = [];
		// get information from varDefs
		for (var i = 0, l = varDefs.length; i < l; ++i)
		{
			var varDef = varDefs[i];
			//var symbol = this._kekuleVarSymbolToJcamp(varDef, l, usedSymbols);
			//if (symbol)
			{
				var sectionDataDetails = sectionDataDetailsMap.get(varDef);
				var details = {
					//'symbol': symbol, // varDef.getSymbol(),
					//'originalSymbol': varDef.getSymbol(),
					'symbol': varDef.getSymbol(),
					'name': varDef.getName() || varDef.getDisplayLabel(),
					'isIndependent': varDef.isIndependent(),
					'dependency': varDef.getDependency(),
					'unit': varDef.getUnit() || Kekule.Unit.Arbitrary.ARBITRARY.symbol,
					'dim': sectionDataDetails.dataCount,
					'_varDef': varDef
				};
				// first/last
				details.first = sectionDataDetails.firstValue || 0;
				details.last = sectionDataDetails.lastValue || 0;
				// range
				var range = varRanges[details.symbol];
				details.range = range;
				// calculator factor for range
				if (range)
				{
					var factor = Jcamp.DxUtils.calcNumFactorForRange(
						range.min, range.max,
						options.dxDataAllowedSavingErrorRatio,
						options.dxDataPreferredOrdinateScaledRange.min, options.dxDataPreferredOrdinateScaledRange.max);  // TODO: currently apply this preferred range to all vars, not only ordinate
					details.factor = factor;
					details.min = range.min;
					details.max = range.max;
				}
				result.push(details);
				usedSymbols.push(details.symbol);
			}
			/*
			else
			{
				Kekule.error(Kekule.$L('ErrorMsg.FAILED_TO_ASSIGN_SYMBOL_TO_VARIABLE').format(varDef.getName() || varDef.getSymbol() || ''));
				break;
			}
			*/
		}

		if (hasPeakAssignment)  // add additional peak assignment var A
		{
			result.push({
				'symbol': 'A',
				'Name': 'Peak assignment',
				'isIndependent': false,
				'dependency': Kekule.VarDependency.DEPENDENT,
				'unit': Kekule.Unit.Arbitrary.ARBITRARY.symbol,
				'dim': null,
				'varForm': 'STRING',
				'_varDef': new Kekule.Spectroscopy.SpectrumVarDefinition(),
				'_isPeakAssignment': true   // special flag for peak assignment
			});
		}

		sectionDataDetailsMap.finalize();
		return result;
	},
	/** @private */
	_getVarDetailOfDefinition: function(varDef, varDetails)
	{
		for (var i = 0, l = varDetails.length; i < l; ++i)
		{
			if (varDetails[i]._varDef === varDef)
				return varDetails[i];
		}
		return null;
	},
	/* @private */
	/*
	_kekuleVarSymbolToJcamp: function(varDef, varCount, usedSymbols)  // get a suitable var symbol for storing JCAMP
	{
		var kSymbol = varDef.getSymbol() || varDef.getName() || '';
		if (kSymbol.length)
		{
			if (kSymbol.length <= 1)  // just one letter, use it directly
				return kSymbol.toUpperCase();
			else   // try to use the first letter of kSymbol
			{
				var c = kSymbol.charAt(0).toUpperCase();
				if (usedSymbols.indexOf(c) < 0)
					return c;
			}
		}
		// no symbol set in varDef, or failed to generate one in the above process, find a suitable name depending on dependency
		{
			var isIndependent = varDef.isIndependent();
			var candicates = isIndependent? Jcamp.DxConsts.CANDIDATE_INDEPENDENT_VAR_SYMBOLS: Jcamp.DxConsts.CANDIDATE_DEPENDENT_VAR_SYMBOLS;
			// TODO: a very rough implementation
			for (var i = 0, l = candicates.length; i < l; ++i)
			{
				var c = candicates[i];
				if (usedSymbols.indexOf(c) < 0)
					return c;
			}
			return null;
		}
		//return result;
	},
	*/
	/**
	 * Generate a list of single letter var symbols for saving to JCAMP.
	 * @param {Array} varDetails
	 * @returns {Array}
	 * @private
	 */
	_generateNTupleVarSymbolsForJcamp: function(varDetails)
	{
		var result = [];
		var getUnusedJcampSymbol = function(startPoint, occupiedLetters)
		{
			var result = startPoint;
			if (occupiedLetters.length >= 26)  // all letters are used
				return null;
			var base = 'A'.charCodeAt(0);
			while (occupiedLetters.indexOf(result) >= 0)
			{
				var i = ((result.charCodeAt(0) - base) % 26) + 1 + base;
				result = String.fromCharCode(i);
			}
			return result;
		};
		for (var i = 0, l = varDetails.length; i < l; ++i)
		{
			var originalSymbol = varDetails[i].symbol || varDetails[i].name;
			var newSymbol = originalSymbol.charAt(0).toUpperCase();
			newSymbol = getUnusedJcampSymbol(newSymbol, result);
			if (!newSymbol)  // the symbol number exceeds limited, ignore the rest
				break;
			result.push(newSymbol);
		}
		return result;
	},

	/** @private */
	doSaveSpectrumSectionDataToClassic: function(spectrum, section, block, options)
	{
		var varDetails = this.doGetSpectrumVariableInfoOfSections(spectrum, [section], options);

		var indepVarDetailList = [], depVarDetailList = [];
		for (var i = 0, l = varDetails.length; i < l; ++i)
		{
			var detail = varDetails[i];
			/*
			if (detail.isIndependent && !indepVarDetail)
				indepVarDetail = detail;
			else if (!detail.isIndependent && !depVarDetail)
				depVarDetail = detail;
			*/
			if (detail.isIndependent)
				indepVarDetailList.push(detail);
			else if (!detail.isIndependent)
				depVarDetailList.push(detail);
		}

		// In classic form, we can record only two vars units/range...
		var indepVarDetail = indepVarDetailList[0];
		var depVarDetail = depVarDetailList[0];
		// save var unit/range to block
		this.doSaveSepctrumSectionVarInfoToClassic(spectrum, section, indepVarDetail, depVarDetail, block, options);
		// save the actual data
		this.saveToLdrInBlock(block, spectrum, '', section.getDataCount() || 0, 'NPOINTS');

		if (section.getDataCount())
		{
			var dataStorageFormat = this.doGetSpectrumSectionDataStorageFormat(spectrum, section, options);
			var dataLines, labelName, formatDescriptor;
			if (dataStorageFormat === Jcamp.Consts.DATA_VARLIST_FORMAT_XYDATA)
			{
				var indepRange = section.getContinuousVarRange(indepVarDetail.symbol);
				if (indepRange)
				{
					this.saveToLdrInBlock(block, spectrum, '', indepRange.fromValue, 'FIRSTX');
					this.saveToLdrInBlock(block, spectrum, '', indepRange.toValue, 'LASTX');
				}

				dataLines = this._createXyDataFormatDataLines(section, indepVarDetail, depVarDetail, options);
				formatDescriptor = Jcamp.Utils.generateDataTableFormatDescriptor(dataStorageFormat, ['X', 'Y']);
				//dataLines.unshift('(X++(Y..Y))');  // format string
				labelName = 'XYDATA';
			}
			else if (dataStorageFormat === Jcamp.Consts.DATA_VARLIST_FORMAT_XYPOINTS || dataStorageFormat === Jcamp.Consts.DATA_VARLIST_FORMAT_XYWPOINTS)
			{
				var dataLines = this._createXyPointsFormatDataLines(section, indepVarDetail, depVarDetail, options);
				//dataLines.unshift('(XY..XY)');  // format string
				formatDescriptor = Jcamp.Utils.generateDataTableFormatDescriptor(dataStorageFormat, ['X', 'Y']);
				//labelName = 'XYPOINTS';
				labelName = section.isPeakSection()? 'PEAK TABLE': 'XYPOINTS';
			}
			else if (dataStorageFormat === Jcamp.Consts.DATA_VARLIST_FORMAT_VAR_GROUPS)  // may has peak assigments
			{
				//if (!section.hasPeakAssignments())  // normal
				/*
				var dataLines = this._createVarGroupFormatDataLines(section, indepVarDetailList, depVarDetailList, options);
				formatDescriptor = Jcamp.Utils.generateDataTableFormatDescriptor(dataStorageFormat, ['X', 'Y']);
				labelName = 'PEAK TABLE';
				*/
				var hasPeakAssignments = section.hasPeakAssignments();
				// XY, or XYW, or XYWA only one independent var, and at most three dependent vars
				var varSymbols = (varDetails.length <= 2)? ['X', 'Y']:
					(varDetails.length <= 3)? (hasPeakAssignments? ['X', 'Y', 'A']: ['X', 'Y', 'W']):
					['X', 'Y', 'W', 'A'];
				var dataLines = this._createVarGroupFormatDataLines(section, indepVarDetailList, depVarDetailList, hasPeakAssignments, options);
				formatDescriptor = Jcamp.Utils.generateDataTableFormatDescriptor(dataStorageFormat, varSymbols);
				labelName = hasPeakAssignments? 'PEAK ASSIGNMENTS': 'PEAK TABLE';
			}

			if (dataLines && formatDescriptor)
			{
				dataLines.unshift(formatDescriptor);
			}
			if (labelName && dataLines)
			{
				var ldr = {'labelName': labelName, 'valueLines': dataLines};
				this.setLdrInBlock(block, ldr, true);
				this.doInsertDataClassToBlock(spectrum, block, labelName, options);
			}
		}
	},
	/** @private */
	doSaveSepctrumSectionVarInfoToClassic: function(spectrum, section, indepVarDetail, depVarDetail, block, options)
	{
		var details = [indepVarDetail, depVarDetail];
		var labelVarSymbols = ['X', 'Y'];
		var self = this;
		var saveVarDefLdr = function(labelName, value)
		{
			var ldr = self.createLdr('', value, labelName);
			self.setLdrInBlock(block, ldr, true);
		};
		for (var i = 0, l = details.length; i < l; ++i)
		{
			var varDetail = details[i];
			var labelVarSymbol = labelVarSymbols[i];
			if (varDetail.unit)
			{
				var dxUnit = Jcamp.DxUtils.mertricsUnitSymbolToDxUnit(varDetail.unit);
				saveVarDefLdr(labelVarSymbol + 'UNITS', dxUnit);
			}
			if (varDetail.name)
				saveVarDefLdr(labelVarSymbol + 'LABEL', varDetail.name);
			if (varDetail.range)
			{
				saveVarDefLdr('MIN' + labelVarSymbol, varDetail.range.min);
				saveVarDefLdr('MAX' + labelVarSymbol, varDetail.range.max);
			}
			if (varDetail.factor)
				saveVarDefLdr(labelVarSymbol + 'FACTOR', varDetail.factor);
			// TODO: unfinished
		}
	},
	/** @private */
	doSaveSpectrumSectionsDataToNTuple: function(spectrum, sections, block, options)
	{
		var varDetails = this.doGetSpectrumVariableInfoOfSections(spectrum, sections, options);
		//console.log(varDetails);
		// add additional page var for NTuple  // TODO: currently the page var settings are fixed
		varDetails.push({
			'_varDef': null,
			'symbol': 'n',
			'name': 'Page number',
			'dependency': 'PAGE', //Kekule.VarDependency.INDEPENDENT,
			'isIndependent': true,
			'isPageNumber': true,
			'dim': sections.length,
			'factor': 1,
			'unit': Kekule.Unit.Arbitrary.ARBITRARY.symbol,
			'min': 1,
			'max': sections.length,
			'first': 1,
			'last': sections.length,
		});
		// use single letter var symbols for saving to JCAMP-DX
		var jcampVarSymbols = this._generateNTupleVarSymbolsForJcamp(varDetails);
		// build the var symbol map
		var jcampPageVarSymbol;
		var jcampVarSymbolMap = {};
		var varDefJcampSymbolMap = new Kekule.MapEx();
		for (var i = 0, l = jcampVarSymbols.length; i < l; ++i)
		{
			var jcampSymbol = jcampVarSymbols[i];
			jcampVarSymbolMap[jcampSymbol] = varDetails[i];
			if (varDetails[i]._varDef)
				varDefJcampSymbolMap.set(varDetails[i]._varDef, jcampSymbol);
			if (varDetails[i].isPageNumber)
				jcampPageVarSymbol = jcampSymbol;
		}

		var ntupleName = this.doGetJcampSpectrumDataType(spectrum);
		// NTuple head
		this.saveToLdrInBlock(block, spectrum, '', ntupleName, 'NTUPLES');
		// save var info to NTuple LDRs
		this.doSaveSpectrumSectionVarInfoToNTuple(spectrum, sections, varDetails, jcampVarSymbols, jcampVarSymbolMap, block, options);
		// save individual section to NTuple page
		for (var i = 0, l = sections.length; i < l; ++i)
		{
			this.doSaveSpectrumSectionDataToNTuplePage(spectrum, sections[i], varDetails, varDefJcampSymbolMap, jcampPageVarSymbol, i, block, options);
		}
		// NTuple end
		this.saveToLdrInBlock(block, spectrum, '', ntupleName, 'END NTUPLES');

		this.doInsertDataClassToBlock(spectrum, block, 'NTUPLES', options);

		varDefJcampSymbolMap.finalize();
	},
	/** @private */
	doSaveSpectrumSectionDataToNTuplePage: function(spectrum, section, varDetails, varDefJcampSymbolMap, jcampPageVarSymbol, pageIndex, block, options)
	{
		// page header
		var sPageNumber = jcampPageVarSymbol + '=' + (pageIndex + 1);
		this.saveToLdrInBlock(block, spectrum, '', sPageNumber, 'PAGE');
		this.saveToLdrInBlock(block, spectrum, '', section.getDataCount(), 'NPOINTS');  // data count in section may differ from the var dim
		// get vars in this section
		var varInfos = section.getActualLocalVarInfos();
		var indepVarDetails = [], depVarDetails = [];
		var indepVarJcampSymbols = [], depVarJcampSymbols = [];
		for (var i = 0, l = varInfos.length; i < l; ++i)
		{
			var varDef = section.getLocalVarDef(i);
			var jcampVarSymbol = varDefJcampSymbolMap.get(varDef);
			if (varDef)  // page number var has no concrete var def
			{
				var varDetail = this._getVarDetailOfDefinition(varDef, varDetails);
				if (varDef.isIndependent())
				{
					indepVarDetails.push(varDetail);
					indepVarJcampSymbols.push(jcampVarSymbol);
				}
				else
				{
					depVarDetails.push(varDetail);
					depVarJcampSymbols.push(jcampVarSymbol);
				}
			}
		}
		var hasPeakAssignments = false;
		// check if peak assignment var detail exists and push it to dep vars
		for (var i = varDetails.length - 1; i >= 0; --i)
		{
			var varDetail = varDetails[i];
			if (varDetail._isPeakAssignment)
			{
				hasPeakAssignments = true;
				depVarDetails.push(varDetail);
				var jcampVarSymbol = varDefJcampSymbolMap.get(varDetail._varDef);
				depVarJcampSymbols.push(jcampVarSymbol);
				break;
			}
		}

		// the concrete data
		var dataStorageFormat = this.doGetSpectrumSectionDataStorageFormat(spectrum, section, options);
		var dataLines, dataFormatStr, formatDescriptor;
		if (dataStorageFormat === Jcamp.Consts.DATA_VARLIST_FORMAT_XYDATA)
		{
			dataFormatStr = 'XYDATA';
			var indepVarDetail = indepVarDetails[0], depVarDetail = depVarDetails[0];
			dataLines = this._createXyDataFormatDataLines(section, indepVarDetail, depVarDetail, options);
			formatDescriptor = Jcamp.Utils.generateDataTableFormatDescriptor(dataStorageFormat, [indepVarJcampSymbols[0], depVarJcampSymbols[0]]);
		}
		else if (dataStorageFormat === Jcamp.Consts.DATA_VARLIST_FORMAT_XYPOINTS || dataStorageFormat === Jcamp.Consts.DATA_VARLIST_FORMAT_XYWPOINTS)
		{
			dataFormatStr = section.isPeakSection()? 'PEAK TABLE': 'XYPOINTS';
				//(dataStorageFormat === Jcamp.Consts.DATA_VARLIST_FORMAT_XYWPOINTS)? 'XYWPOINTS': 'XYPOINTS';
			// In XYPoints format, we can record only two vars
			var indepVarDetail = indepVarDetails[0], depVarDetail = depVarDetails[0];
			dataLines = this._createXyPointsFormatDataLines(section, indepVarDetail, depVarDetail, options);
			//dataLines.unshift('(XY..XY)');  // format string
			formatDescriptor = Jcamp.Utils.generateDataTableFormatDescriptor(dataStorageFormat, [indepVarJcampSymbols[0], depVarJcampSymbols[0]]);
		}
		else if (dataStorageFormat === Jcamp.Consts.DATA_VARLIST_FORMAT_VAR_GROUPS)  // peak assignment
		{
			dataFormatStr = hasPeakAssignments? 'PEAK ASSIGNMENTS': 'PEAK TABLE';
			var varSymbols = [].concat(indepVarJcampSymbols).concat(depVarJcampSymbols);
			formatDescriptor = Jcamp.Utils.generateDataTableFormatDescriptor(dataStorageFormat, varSymbols);
			dataLines = this._createVarGroupFormatDataLines(section, indepVarDetails, depVarDetails, hasPeakAssignments, options);
		}

		if (dataLines)
		{
			dataLines.unshift(formatDescriptor + Jcamp.Consts.GROUPED_VALUE_ITEM_DELIMITER + ' ' + dataFormatStr);
			var ldr = this.createLdrRaw('DATA TABLE', dataLines);
			this.setLdrInBlock(block, ldr);
		}
	},
	/** @private */
	doSaveSpectrumSectionVarInfoToNTuple: function(spectrum, sections, varDetails, jcampVarSymbols, varSymbolDetailMap, block, options)
	{
		var ldrItems = {};
		var addValueToLdrItem = function(labelName, value)
		{
			var values = ldrItems[labelName];
			if (!values)
			{
				values = [];
				ldrItems[labelName] = values;
			}
			values.push(value);
		}
		var encodeAffnVarDefValue = function(value)
		{
			return Kekule.ObjUtils.isUnset(value)? '': Jcamp.LdrValueParserCoder.affnCoder(value);
		}

		//console.log(jcampVarSymbols, varDetails);
		for (var i = 0, l = jcampVarSymbols.length; i < l; ++i)
		{
			var jcampSymbol = jcampVarSymbols[i];
			var varDetail = varDetails[i];
			var varType = varDetail.isPageNumber? 'PAGE':
				varDetail.isIndependent? 'INDEPENDENT': 'DEPENDENT';
			addValueToLdrItem('SYMBOL', jcampSymbol);
			addValueToLdrItem('VARNAME', varDetail.name || '');
			addValueToLdrItem('VARTYPE', varType);
			addValueToLdrItem('VARFORM', varDetail.varForm || 'ASDF');  //TODO: var form, AFFN or ASDF, currently fixed to ASDF, anyway AFFN is also a specified form of ASDF
			addValueToLdrItem('VARDIM', encodeAffnVarDefValue(varDetail.dim || 0));
			addValueToLdrItem('UNITS', varDetail.unit? Jcamp.DxUtils.mertricsUnitSymbolToDxUnit(varDetail.unit): '');
			addValueToLdrItem('FIRST', encodeAffnVarDefValue(varDetail.first));
			addValueToLdrItem('LAST', encodeAffnVarDefValue(varDetail.last));
			addValueToLdrItem('MIN',  encodeAffnVarDefValue(varDetail.min));
			addValueToLdrItem('MAX', encodeAffnVarDefValue(varDetail.max));
			addValueToLdrItem('FACTOR', encodeAffnVarDefValue(varDetail.factor));
		}
		//console.log(ldrItems);
		// create LDR and save to block
		var labelNames = Kekule.ObjUtils.getOwnedFieldNames(ldrItems, false);
		for (var i = 0, l = labelNames.length; i < l; ++i)
		{
			var labelName = labelNames[i];
			var value = ldrItems[labelName].join(Jcamp.Consts.NTUPLE_DEFINITION_ITEM_DELIMITER);
			//this.saveToLdrInBlock(block, spectrum, '', value, labelName);
			var ldr = this.createLdrRaw(labelName, value);
			this.setLdrInBlock(block, ldr, false);
		}
	},

	/** @private */
	_createVarGroupFormatDataLines: function(spectrumSection, indepVarDetailList, depVarDetailList, withPeakAssignment, options)
	{
		var allVarDetails = [].concat(indepVarDetailList).concat(depVarDetailList);
		var valueGroups = [];
		var refMolecule = spectrumSection.getParentSpectrum().getRefMolecule();
		//var handlePeakAssignment = withPeakAssignment && refMolecule;  // if refMolecule is empty, peak will actually not be handled
		spectrumSection.forEach(function(hashValue, index){
			var valueItems = [];  // we may need to generate multiple lines for one peak with multi-assignments
			var valueItem = [];
			var needToExpandVarIndex = false;
			for (var i = 0, l = allVarDetails.length; i < l; ++i)
			{
				var v;
				var varDetail = allVarDetails[i];
				if (!varDetail._isPeakAssignment)
				{
					var originalValue = hashValue[varDetail.symbol];
					// original value may be string in XYMA
					if (typeof(originalValue) === 'number')
						v = Math.round(originalValue / varDetail.factor || 1);
					else
						v = originalValue;
				}
				else if (withPeakAssignment)  // handle A (assignment) string
				{
					v = '';  // default, no assignment
					var assignmentIndex = -1;
					var extra = spectrumSection.getExtraInfoOf(hashValue);
					if (extra && extra.getAssignments && refMolecule)
					{
						var assignmentObjs = extra.getAssignments();
						var assignIndexes = [];
						for (var j = 0, jj = assignmentObjs.length; j < jj; ++j)
						{
							var assignmentObj = assignmentObjs[j];
							if (assignmentObj && refMolecule)
								assignmentIndex = refMolecule.indexOfNode(assignmentObj);
							if (assignmentIndex >= 0)
								assignIndexes.push((assignmentIndex + 1).toString());
							else    // no assignment, do nothing
								;
						}
						if (assignIndexes.length <= 0)  // no assignment
							v = 0;
						else if (assignIndexes.length === 1)  // one simple assignment
							v = assignIndexes[0];
						else  // multiple, need to expand to several rows later
						{
							v = assignIndexes;
							needToExpandVarIndex = i;
						}
					}
				}
				valueItem.push(v);
			}
			if (needToExpandVarIndex !== false)
			{
				var needToExpandValues = valueItem[needToExpandVarIndex];
				var valueItems = [];
				for (var i = 0, l = needToExpandValues.length; i < l; ++i)
				{
					var expandedItem = AU.clone(valueItem);
					expandedItem[needToExpandVarIndex] = needToExpandValues[i];
					valueItems.push(expandedItem);
				}
			}
			else
				valueItems = [valueItem];
			//valueGroups.push(valueItem);
			valueGroups = valueGroups.concat(valueItems);
		});
		var result = Jcamp.Utils.encodeAffnGroupTableLines(valueGroups, {explicitlyEnclosed: true});
		return result;
	},
	/** @private */
	_createXyPointsFormatDataLines: function(spectrumSection, indepVarDetails, depVarDetails, options)
	{
		//'(XY..XY)'
		var indepFactor = indepVarDetails.factor;
		var depFactor = depVarDetails.factor;
		var valueGroups = [];
		spectrumSection.forEach(function(hashValue, index){
			var indepValue = Math.round(hashValue[indepVarDetails.symbol] / indepFactor);
			var depValue = Math.round(hashValue[depVarDetails.symbol] / depFactor);
			valueGroups.push([indepValue, depValue]);
		});

		var result = Jcamp.Utils.encodeAffnGroupTableLines(valueGroups);
		return result;
	},
	/** @private */
	_createXyDataFormatDataLines: function(spectrumSection, indepVarDetails, depVarDetails, options)
	{
		var getMaxStrLengthForValueInRange = function (minValue, maxValue)
		{
			// TODO: currently we use a very rough algorithm, only consider the str length of AFFN
			var smin = Math.round(minValue).toFixed(0).length;
			var smax = Math.round(maxValue).toFixed(0).length;
			return Math.max(smin, smax);
		};

		// independent var, should be continuous
		var indepRange = spectrumSection.getContinuousVarRange(indepVarDetails.symbol);  // range in section maybe different to in all spectrum
		var indepFactor = indepVarDetails.factor;
		var indepValueFrom = indepRange.fromValue;
		var indepValueTo = indepRange.toValue;

		// dependent var, should be concrete values
		var depFactor = depVarDetails.factor;
		var depRange = spectrumSection.calcDataRange([depVarDetails.symbol], {basedOnInternalUnit: true})[depVarDetails.symbol];

		// determinate how many dep values per line
		var indepStrLength = getMaxStrLengthForValueInRange(indepValueFrom, indepValueTo) + 1;  // 1 for the delimiter of indep / dep values
		var depStrLength = getMaxStrLengthForValueInRange(depRange.min / depFactor, depRange.max / depFactor) + 1;
			// 1 for the delimiter for AFFN values
		var depValueCountPerLine = Math.floor((options.maxCharsPerLine - indepStrLength) / depStrLength);

		// group values into lines
		var dataForm = options.dxDataAsdfTableOutputForm;
		var doOrdinateCheck = dataForm === Jcamp.AsdfForm.DIF || dataForm === Jcamp.AsdfForm.DIF_DUP;
		var dataCount = spectrumSection.getDataCount();
		var currDepValueCount = 0;
		var valueGroups = [];
		var values = [];
		var lastValues;
		spectrumSection.forEach(function(hashValue, index){
			var originalDepValue = hashValue[depVarDetails.symbol];
			var isValidDepValue = Kekule.NumUtils.isNormalNumber(originalDepValue);
			var isLastDataValue = index >= dataCount;

			var depValue;
			if (isValidDepValue)
				depValue = Math.round(originalDepValue / depFactor);
			else
				depValue = NaN;

			if (!lastValues || isLastDataValue || (isValidDepValue && (currDepValueCount > depValueCountPerLine)))
				// need to start a new line and ensure the new line is always starts with a validate number
				// what's more, ensure the last line containing and only containing a ordinate check value
			{
				// start a new line
				values = [];
				valueGroups.push(values);
				currDepValueCount = 0;
				// if in DIF form, we need to add a check Y value to the tail of last group
				if (doOrdinateCheck && lastValues)
					lastValues.push(depValue);
				// the first value of a new group should be indep
				values.push(Math.round(hashValue[indepVarDetails.symbol] / indepFactor));

				lastValues = values;
			}

			// then the dep value
			values.push(depValue);
			++currDepValueCount;
		}, this, {basedOnInternalUnit: true});
		//console.log('form array', valueGroups);

		var result = Jcamp.Utils.encodeAsdfTableLines(valueGroups, dataForm, {abscissaFirst: true});

		return result;
	},


	/** @private */
	_getSpectrumDataLabelAndVarFormatOfSection: function(spectrum, section, varInfos)
	{
		var result;
		if (section.isPeak())
		{
			if (section.hasPeakAssignments())
				result = 'PEAKASSIGNMENTS';    // XYMA
			else
				result = 'PEAKTABLE';    // XY or XYW
		}
		else
		{
			var csymbols = section.getContinuousVarSymbols() || [];
			if (csymbols)
				result = 'XYDATA';     // X++(Y..Y)
			else
				result = 'XYPOINTS';   //
		}
		return result;
	},

	// custom ldr creators
	_dateLdrCreator: function(jsName, jsValue, chemObj, preferredJcampLabelName)
	{
		var jcampLabelName = 'LONGDATE';  // force to save to long date LDR
		return this.createLdr(jsName, jsValue, jcampLabelName);
	},
	_scalarWithSpecifiedUnitLdrCreator: function(requiredUnitObj, jsName, jsValue, chemObj, preferredJcampLabelName)
	{
		var value;
		if (jsValue instanceof Kekule.Scalar)
		{
			// check the unit of frequency, in JCAMP-DX, it should be in MHz
			value = jsValue.getValue();
			if (value && Kekule.NumUtils.isNormalNumber(value))
			{
				var oldUnit = jsValue.getUnit();
				if (oldUnit && oldUnit !== requiredUnitObj.symbol)
				{
					var oldUnitObj = Kekule.Unit.getUnit(oldUnit);
					if (oldUnitObj && oldUnitObj.category === requiredUnitObj.category)
					{
						value = oldUnitObj.convertValueTo(value, requiredUnitObj);
					}
					else
					{
						var msg = Kekule.$L('ErrorMsg.JCAMP_LDR_TARGET_UNIT_NOT_MATCH_WITH_DETAIL')
							.format(jsName, oldUnit, requiredUnitObj.symbol, preferredJcampLabelName);
						Kekule.warn(msg);
					}
				}
			}
		}
		if (Kekule.NumUtils.isNormalNumber(value))
			return this.createLdr(jsName, value, preferredJcampLabelName);
		else
			return null;
	},
	_nmrObserveNucleusLdrCreator: function(jsName, jsValue, chemObj, preferredJcampLabelName)
	{
		var TN = Kekule.Spectroscopy.SpectrumNMR.TargetNucleus;
		var jcampValue = (jsValue === TN.C13)? '^13C':
			(jsValue === TN.H)? '^1H':
			jsValue;
		return this.createLdr(jsName, jcampValue, preferredJcampLabelName);
	}
});

Jcamp.BlockReaderManager.register(Jcamp.BlockType.DATA, Jcamp.Format.DX, Kekule.IO.Jcamp.DxDataBlockReader);
Jcamp.BlockWriterManager.register(Kekule.Spectroscopy.Spectrum, Kekule.IO.Jcamp.DxDataBlockWriter);


})();