/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /utils/kekule.textHelper.js
 * requires /core/kekule.common.js
 * requires /spectrum/kekule.spectrum.core.js
 * requires /io/kekule.io.js
 * requires /io/jcamp/kekule.io.jcamp.js
 * requires /localization
 */

(function(){
"use strict";

var Jcamp = Kekule.IO.Jcamp;

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
	},
	/** @ignore */
	_initLdrHandlers: function()
	{
		var map = this.tryApplySuper('_initLdrHandlers');
		map['DATA TYPE'] = this.doStoreSpectrumDataTypeLdr.bind(this, 'DATA TYPE');
		map['PEAK TABLE'] = this.doStoreSpectrumDataLdr.bind(this, 'PEAK TABLE');
		map['XYDATA'] = this.doStoreSpectrumDataLdr.bind(this, 'XYDATA');
		var varDefLdrNames = this._getDataTableVarDefLdrNames();
		for (var i = 0, l = varDefLdrNames.length; i < l; ++i)
			map[varDefLdrNames[i]] = this.doStoreDataVarInfoLdr.bind(this);
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
	_getDataTableLdrNames: function()
	{
		return ['XYDATA', 'XYPOINTS', 'PEAK TABLE', 'PEAKTABLE', 'PEAK ASSIGNMENTS', 'PEAKASSIGNMENTS', 'ASSIGNMENTS', 'RADATA'];
	},
	/** @private */
	_isDataTableLabelName: function(labelName)
	{
		return this._getDataTableLdrNames().indexOf(labelName) >= 0;
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
	doStoreSpectrumDataLdr: function(ldrLabelName, ldr, block, chemObj)
	{
		// check whether the DATA_CLASS matches LDR label name, ensure this is the LDR containing the spectrum data
		if (this._isSpectrumDataLdr(ldr, chemObj))
		{
			if (this._isDataTableLabelName(ldr.labelName))
			{
				var dataValue = Jcamp.LdrValueParser.parseValue(ldr, {doValueCheck: true});
				var varFormat = dataValue.format;
				var formatDetail = Jcamp.Utils.getDataTableFormatDetails(varFormat);
				var varSymbols = formatDetail.vars;
				// retrieve var information, including first/last range and factor
				var varInfos = this._retrieveSpectrumDataVarInfos(varSymbols, block, chemObj);
				//console.log(formatDetail);
				//console.log(varInfos);
				//console.log(dataValue);
				var spectrumData = this._createSpectrumDataByFormat(formatDetail, dataValue.values, varInfos);
				if (spectrumData)
					chemObj.setData(spectrumData);
			}
		}
		else  // use the default approach
			return this.doStoreLdrToChemObjInfoProp(ldrLabelName, ldr, chemObj);
	},
	/** @private */
	_retrieveSpectrumDataVarInfos: function(varSymbols, block, chemObj)
	{
		var result = [];
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
			var def = new Kekule.VarDefinition({
				'symbol': info.symbol,
				'units': info.units,
				'minValue': info.minValue,
				'maxValue': info.maxValue,
				'dependency': Kekule.ObjUtils.notUnset(info.dependency)? info.dependency: Kekule.VarDependency.DEPENDENT
			});
			result.push(def);
		}
		return result;
	},
	/** @private */
	_calcActualVarValue: function(dataValue, varInfo)
	{
		return dataValue * (varInfo.factor || 1);
	},
	/** @private */
	_createSpectrumDataByFormat: function(formatDetail, data, varinfos)
	{
		var result;
		if (formatDetail.format === Jcamp.Consts.DATA_VARLIST_FORMAT_XYDATA)
		{
			result = this._createXyDataFormatSpectrumData(formatDetail, data, varinfos);
		}
		else if (formatDetail.format === Jcamp.Consts.DATA_VARLIST_FORMAT_XYPOINTS)
		{
			result = this._createXyPointsFormatSpectrumData(formatDetail, data, varinfos);
		}
		else if (formatDetail.format === Jcamp.Consts.DATA_VARLIST_FORMAT_VAR_GROUPS)
		{
			result = this._createVarGroupFormatSpectrumData(formatDetail, data, varinfos);
		}
		//console.log('data', formatDetail, varinfos, result);
		return result;
	},
	/** @private */
	_createXyDataFormatSpectrumData: function(formatDetail, dataLines, varInfos)
	{
		var varSymbolInc = formatDetail.varInc;
		var varSymbolLoop = formatDetail.varLoop;
		varInfos._bySymbol[varSymbolInc].dependency = Kekule.VarDependency.INDEPENDENT;
		var varDefinitions = this._createSpectrumVariableDefinitions(varInfos);  // ensure X before Y
		var result = new Kekule.Spectroscopy.ContinuousData(null, varDefinitions);
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
		result.setVarRange(varSymbolInc, varIncValueRange.firstValue, varIncValueRange.lastValue);
		for (var i = 0, ii = dataLines.length; i < ii; ++i)
		{
			var lineValues = dataLines[i];
			for (var j = 1, jj = lineValues.length; j < jj; ++j)
			{
				result.append([undefined, this._calcActualVarValue(lineValues[j], varInfos._bySymbol[varSymbolLoop])]);  // omit X
			}
		}
		//console.log(varDefinitions, result);
		return result;
	},
	/** @private */
	_createXyPointsFormatSpectrumData: function(formatDetail, data, varInfos)
	{
		return this._createVarGroupFormatSpectrumData(formatDetail, data, varInfos)
	},
	/** @private */
	_createVarGroupFormatSpectrumData: function(formatDetail, data, varInfos)
	{
		var varDefinitions = this._createSpectrumVariableDefinitions(varInfos);  // ensure X before Y
		var result = new Kekule.Spectroscopy.DiscreteData(null, varDefinitions);
		for (var i = 0, l = data.length; i < l; ++i)
		{
			// each item is a data group, containing values of all variables
			result.append(data[i]);
		}
		return result;
	},
	/** @private */
	_isSpectrumDataLdr: function(ldr, chemObj)
	{
		//console.log(chemObj.getClassName());
		var result = !chemObj.getData();  // if spectrum data already be built, a data LDR has previously be parsed and this one should not be the data
		if (result)
		{
			var dataClassValue = chemObj.getInfoValue('DATA CLASS') || null;
			if (dataClassValue)
			{
				result = dataClassValue.replace(/\s/g, '') === ldr.labelName.replace(/\s/g, '');  // ignore space in names
			}
		}
		return result;
	},

	/**
	 * Read XYDATA values and set the spectrum data.
	 * @param {Kekule.Spectroscopy.Spectrum} spectrum
	 * @param {Hash} xyData
	 * @private
	 */
	_readXyData: function(spectrum, xyData)
	{

	},
	/** @ignore */
	doCreateChemObjForBlock: function(block)
	{
		var result;
		var meta = this._getBlockMeta(block);
		if (meta.blockType === Jcamp.BlockType.DATA && meta.format === Jcamp.Format.DX)
		{
			result = new Kekule.Spectroscopy.Spectrum();
		}
		else
			result = this.tryApplySuper('doCreateChemObjForBlock', [block]);
		return result;
	}
});
Jcamp.BlockReaderManager.register(Jcamp.BlockType.DATA, Jcamp.Format.DX, Kekule.IO.Jcamp.DxDataBlockReader);


})();