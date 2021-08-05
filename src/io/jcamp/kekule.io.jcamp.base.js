/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /utils/kekule.textHelper.js
 * requires /core/kekule.common.js
 * requires /spectrum/kekule.spectrum.core.js
 * requires /io/kekule.io.js
 * requires /localization
 */

(function(){
"use strict";

var AU = Kekule.ArrayUtils;

/*
 * Default options to read/write JCAMP format data.
 * @object
 */
Kekule.globalOptions.add('IO.jcamp', {

});

// Some consts related with JCAMP
/** @ignore */
Kekule.IO.Jcamp = {
	DATA_LABEL_FLAG: '##',
	DATA_LABEL_TERMINATOR: '=',
	CUSTOM_LABEL_PREFIX: '$',
	SPECIFIC_LABEL_PREFIX: '.',
	LABEL_BLOCK_BEGIN: 'TITLE',
	LABEL_BLOCK_END: 'END',
	INLINE_COMMENT_FLAG: '$$',
	TABLE_LINE_CONTI_MARK: '=',
	UNKNOWN_VALUE: NaN  // special value indicating an unknown variable value in data table
};
var JcampConsts = Kekule.IO.Jcamp;

/**
 * Enumeration of JCAMP ASDF digit types.
 * @enum
 */
Kekule.IO.Jcamp.DigitCharType = {
	/*
	SYMBOL_POSITIVE: '+',
	SYMBOL_NEGTIVE: '-',
	ASCII_DIGITS: {fromChar: '0', toChar: '9', fromDigit: 0},
	SOZ_POSITIVE_DIGIT: {fromChar: '0', toChar: '9', fromDigit: 0},
	*/
	ASCII: 1,
	PAC: 2,
	SQZ: 3,
	DIF: 4,
	DUP: 5,
	_DECIMAL_POINT: 9,  // special mark, indicating a char is a decimal point
	_ABNORMAL_VALUE: 19  // ? mark in data table, indicating a lost or abnormal value that need not to be parsed
};
var JcampDigitType = Kekule.IO.Jcamp.DigitCharType;


/**
 * Some utils methods about JCAMP.
 * @class
 */
Kekule.IO.JcampUtils = {
	/**
	 * Returns the first non-empty string line of lines.
	 * @param {Array} lines
	 * @returns {string}
	 */
	getFirstNonemptyLine: function(lines)
	{
		var index = 0;
		var result;
		do
		{
			result = (lines[index] || '').trim();
		}
		while (!result && index < lines.length)
		return result || '';
	},

	/**
	 * Returns the information and corresponding value of a ASDF char.
	 * @param {String} char String with length 1.
	 * @returns {Hash}
	 */
	getAsdfDigitInfo: function(char)
	{
		var result = {};
		if (char === '?')
		{
			result.digitType = JcampDigitType._ABNORMAL_VALUE;
			result.value = null;
			result.sign = 1;
		}
		else if (char === '.')
		{
			result.digitType = JcampDigitType._DECIMAL_POINT;
			result.value = 0;
			result.sign = 1;
		}
		else if (char >= '0' && char <= '9')
		{
			result.digitType = JcampDigitType.ASCII;
			result.value = char.charCodeAt(0) - '0'.charCodeAt(0);
			result.sign = 1;
		}
		else if (char === '+')
		{
			result.digitType = JcampDigitType.PAC;
			result.value = 0;
			result.sign = 1;
		}
		else if (char === '-')
		{
			result.digitType = JcampDigitType.PAC;
			result.value = 0;
			result.sign = -1;
		}
		else if (char === '@')
		{
			result.digitType = JcampDigitType.SQZ;
			result.value = 0;
			result.sign = 1;
		}
		else if (char >= 'A' && char <= 'I')
		{
			result.digitType = JcampDigitType.SQZ;
			result.value = char.charCodeAt(0) - 'A'.charCodeAt(0) + 1;
			result.sign = 1;
		}
		else if (char >= 'a' && char <= 'i')
		{
			result.digitType = JcampDigitType.SQZ;
			result.value = char.charCodeAt(0) - 'a'.charCodeAt(0) + 1;
			result.sign = -1;
		}
		else if (char === '%')
		{
			result.digitType = JcampDigitType.DIF;
			result.value = 0;
			result.sign = 1;
		}
		else if (char >= 'J' && char <= 'R')
		{
			result.digitType = JcampDigitType.DIF;
			result.value = char.charCodeAt(0) - 'J'.charCodeAt(0) + 1;
			result.sign = 1;
		}
		else if (char >= 'j' && char <= 'r')
		{
			result.digitType = JcampDigitType.DIF;
			result.value = char.charCodeAt(0) - 'j'.charCodeAt(0) + 1;
			result.sign = -1;
		}
		else if (char >= 'S' && char <= 'Z')
		{
			result.digitType = JcampDigitType.DUP;
			result.value = char.charCodeAt(0) - 'S'.charCodeAt(0) + 1;
			result.sign = 1;
		}
		else if (char === 's')
		{
			result.digitType = JcampDigitType.DUP;
			result.value = 9;
			result.sign = 1;
		}
		else  // other chars
		{
			result.digitType = null;
			result.value = null;
		}
		return result;
	},
	/** @private */
	_calcAsdfNumber: function(asdfInfoGroup)
	{
		var ratio = 1;
		var value = 0;
		var decimalPointRatio = 1;
		var decimalPointCount = 0;
		var digitType;
		for (var i = asdfInfoGroup.length - 1; i >= 0; --i)
		{
			var info = asdfInfoGroup[i];
			if (info.digitType === JcampDigitType._DECIMAL_POINT)  // special handling of decimal point(.) in number chars
			{
				decimalPointRatio = ratio;
				++decimalPointCount;
				if (decimalPointCount > 1)  // more than one decimal point, error
					return null;
			}
			else
			{
				value += info.value * ratio;
				ratio *= 10;
				digitType = info.digitType;  // store the digitType of the head first item
			}
		}
		var sign = asdfInfoGroup[0].sign;
		value *= sign / decimalPointRatio;
		var result = {'value': value, 'digitType': digitType};
		// console.log(asdfInfoGroup, result, asdfInfoGroup[0].sign);
		return result;
	},
	/** @private */
	_pushAsdfNumberToSeq: function(seq, numInfo, prevNumInfo)
	{
		var result = {'seq': seq, 'lastValueType': numInfo.digitType};  // returns the last digit type, it may be used in Y-checked of XYData
		if (numInfo.digitType === JcampDigitType._ABNORMAL_VALUE)
		{
			seq.push(JcampConsts.UNKNOWN_VALUE);
		}
		else if (numInfo.digitType === JcampDigitType.ASCII || numInfo.digitType === JcampDigitType.PAC
			|| numInfo.digitType === JcampDigitType.SQZ)
		{
			seq.push(numInfo.value);
		}
		else
		{
			if (!seq.length)  // DIF or DUP require prev number, here fail to handle
				return false;
			var lastValue = seq[seq.length - 1];
			if (numInfo.digitType === JcampDigitType.DIF)
			{
				seq.push(lastValue + numInfo.value);
			}
			else if (numInfo.digitType === JcampDigitType.DUP)
			{
				if (prevNumInfo.digitType === JcampDigitType.PAC || prevNumInfo.digitType === JcampDigitType.DUP || !prevNumInfo.digitType)
					return false;
				for (var i = 1; i < numInfo.value; ++i)
				{
					// seq.push(lastValue);
					result = JcampUtils._pushAsdfNumberToSeq(seq, prevNumInfo, null);
				}
			}
			else  // unknown type
				return false;
		}
		return result;
	},
	/**
	 * Parse a AFFN or ASDF line, returns number array.
	 * @param {String} str
	 * @returns {Array}
	 */
	decodeAsdfLine: function(str)
	{
		var result = [];
		var currAsdfGroup = [];
		var prevNumInfo = null;
		var _pushToSeq = function(numSeq, asdfGroup, prevNumInfo)
		{
			if (asdfGroup.length)
			{
				var result;
				var numInfo = JcampUtils._calcAsdfNumber(asdfGroup);
				if (numInfo)
					result = JcampUtils._pushAsdfNumberToSeq(numSeq, numInfo, prevNumInfo);
				if (!numInfo || !result)   // has error
					Kekule.error(Kekule.$L('ErrorMsg.JCAMP_ASDF_FORMAT_ERROR_WITH_STR').format(str));

				// save the last digitType in numSeq, since it may be used in Y-check of XYData
				numSeq.__$lastValueType__ = result.lastValueType;

				return numInfo;
				/*
				if (!numInfo || !JcampUtils._pushAsdfNumberToSeq(numSeq, numInfo, prevNumInfo))  // has error
					Kekule.error(Kekule.$L('ErrorMsg.JCAMP_ASDF_FORMAT_ERROR_WITH_STR').format(str));
				return numInfo;
				*/
			}
		};
		for (var i = 0, l = str.length; i < l; ++i)
		{
			var digitInfo = JcampUtils.getAsdfDigitInfo(str.charAt(i));
			if (!digitInfo.digitType)  // unknown type, may be a space or delimiter?
			{
				// decode curr group and start a new blank one
				prevNumInfo = _pushToSeq(result, currAsdfGroup, prevNumInfo);
				currAsdfGroup = [];
			}
			else if (digitInfo.digitType === JcampDigitType._ABNORMAL_VALUE)  // ? mark, a unknown number
			{
				prevNumInfo = _pushToSeq(result, currAsdfGroup, prevNumInfo);

				_pushToSeq(result, [digitInfo], null);  // push a unknown digit
				currAsdfGroup = [];
			}
			else if (digitInfo.digitType === JcampDigitType._DECIMAL_POINT)
			{
				currAsdfGroup.push(digitInfo);
			}
			else if (digitInfo.digitType === JcampDigitType.ASCII)  // 0-9, push to curr group
			{
				currAsdfGroup.push(digitInfo);
			}
			else  // PAC/DIF/SQZ/DUP, need to end curr group and start a new one
			{
				prevNumInfo = _pushToSeq(result, currAsdfGroup, prevNumInfo);
				currAsdfGroup = [digitInfo];
			}
		}
		// last tailing group
		prevNumInfo = _pushToSeq(result, currAsdfGroup, prevNumInfo);
		// console.log('seq: ', result);
		return result;
	},
	/**
	 * Parse a AFFN or ASDF table, returns array of number groups ([[a,b,c], [e,f,g]]).
	 * @param {Array} strLines
	 * @param {Hash} options Additional options for value check. It should contain fields: {abscissaFirst, abscissaLast, pointCount}
	 * @returns {Array}
	 */
	decodeAsdfTableLines: function(strLines, options)
	{
		var op = options || {};
		var result = [];
		var buffer = [];
		var isNextContiLine = false;
		var prevEndWithDif = false;

		var appendDecodedBufferToResult = function(result, buffer, doAbscissaValueCheck, doOrdinateValueCheck)
		{
			if (doOrdinateValueCheck)
			{
				var lastValues = result[result.length - 1];
				//console.log('lastValues', lastValues, result);
				if (lastValues && lastValues.length)
				{
					// check the last value of prev line and first ordinate value of this line
					var prevEndOrdinateValue = lastValues[lastValues.length - 1];
					var currHeadOrdinateValue = buffer[1];
					//console.log(doOrdinateValueCheck, prevEndOrdinateValue, currHeadOrdinateValue);
					if ((typeof(prevEndOrdinateValue) === 'number' && Kekule.ObjUtils.notUnset(prevEndOrdinateValue))
						&& (typeof(currHeadOrdinateValue) === 'number' && Kekule.ObjUtils.notUnset(currHeadOrdinateValue)))
					{
						if (!Kekule.NumUtils.isFloatEqual(prevEndOrdinateValue, currHeadOrdinateValue))
							Kekule.error(Kekule.$L('ErrorMsg.JCAMP_DATA_TABLE_VALUE_CHECK_ERROR'));
						else  // check passed, remove the tailing check value of previous line
						{
							lastValues.pop();
						}
					}
				}
			}
			result.push(buffer);
		}

		for (var i = 0, l = strLines.length; i < l; ++i)
		{
			var currLine = strLines[i].trim();
			var endWithContiMark = (currLine.endsWith(JcampConsts.TABLE_LINE_CONTI_MARK));  // end with a conti-mark?
			if (endWithContiMark)
				currLine = currLine.substr(0, currLine.length - JcampConsts.TABLE_LINE_CONTI_MARK.length);
			var decodeValues = JcampUtils.decodeAsdfLine(currLine);
			if (isNextContiLine)  // continue from last, put decode values to buffer
				buffer = buffer.concat(decodeValues);
			else
				buffer = decodeValues;
			isNextContiLine = endWithContiMark;
			if (!isNextContiLine)  // no continous line, do value check and put buffer to result
			{
				appendDecodedBufferToResult(result, buffer, op.doValueCheck, op.doValueCheck && prevEndWithDif);
				buffer = [];
			}
			prevEndWithDif = decodeValues.__$lastValueType__ === JcampDigitType.DIF;  // if prev line ends with DIF, may need to do a value check on next line
		}
		if (buffer.length)    // last unhandled buffer
			appendDecodedBufferToResult(result, buffer, op.doValueCheck, op.doValueCheck && prevEndWithDif);
		return result;
	}
};
var JcampUtils = Kekule.IO.JcampUtils;

/**
 * Enumeration of LDR value types
 * @enum
 */
Kekule.IO.JcampValueType = {
	AFFN: 1,         // single line AFFN value
	ASDF: 2,
	AFFN_ASDF: 3,
	MULTILINE_AFFN_ASDF: 5,   // AFFN or ASDF in multiple lines
	STRING: 10,
	SHORT_DATE: 21,  // date string in format YY/MM/DD
	SHORT_TIME: 22,  // time string in format hh:mm:ss
	DATETIME: 23,    // data/time string in format YYYY/MM/DD [HH:MM:SS[.SSSS] [±UUUU]]
	NONE: 0   // special marks, value should be ignored
};
var JValueType = Kekule.IO.JcampValueType;

/**
 * Enumeration of JCAMP label types.
 * @enum
 */
Kekule.IO.JcampLabelType = {
	GLOBAL: 0,
	SPECIFIC: 1,
	PRIVATE: 2
}
var JLabelType = Kekule.IO.JcampLabelType;

Kekule.IO.JcampLabelTypeInfos = {

};
Kekule.IO.JcampLabelTypeInfos.createInfo = function(labelName, dataType, labelType)
{
	var result = {
		'labelName': labelName,
		'labelType': labelType,
		'dataType': dataType || Kekule.IO.JcampLabelType.GLOBAL
	};
	Kekule.IO.JcampLabelTypeInfos[labelName] = result;
	return result;
};
Kekule.IO.JcampLabelTypeInfos.createInfos = function(infoItems)
{
	for (var i = 0, l = infoItems.length; i < l; ++i)
	{
		var item = infoItems[i];
		Kekule.IO.JcampLabelTypeInfos.createInfo(item[0], item[1], item[2]);
	}
};
var _createLabelTypeInfos = Kekule.IO.JcampLabelTypeInfos.createInfos;
// create type infos
_createLabelTypeInfos([
	// global labels
	['TITLE', JValueType.STRING],
	['JCAMP-DX', JValueType.STRING],    // JCAMP-DX version
	['DATA TYPE', JValueType.STRING],   // spectrum type
	['BLOCKS', JValueType.AFFN],        // child block count
	['END', JValueType.NONE],           // block end mark, value should be ignored
	['XUNITS', JValueType.STRING],
	['YUNITS', JValueType.STRING],
	['XLABEL', JValueType.STRING],
	['YLABEL', JValueType.STRING],
	['FIRSTX', JValueType.AFFN],
	['LASTX', JValueType.AFFN],
	['FIRSTY', JValueType.AFFN],
	['MAXX', JValueType.AFFN],
	['MINX', JValueType.AFFN],
	['MAXY', JValueType.AFFN],
	['MINY', JValueType.AFFN],
	['DELTAX', JValueType.AFFN],
	['XFACTOR', JValueType.AFFN],
	['YFACTOR', JValueType.AFFN],
	['NPOINTS', JValueType.AFFN],       // number of components
	['RESOLUTION', JValueType.STRING],
	['XYDATA', JValueType.MULTILINE_AFFN_ASDF],
	['CLASS', JValueType.STRING],       // Coblentz Class of the spectrum (1,2,3, or 4) and the IUPAC Class of digital representation (A, B, C).3
	['ORIGIN', JValueType.STRING],      // Name of organization, address, telephone number, name of individual contributor, etc.,
	['OWNER', JValueType.STRING],       // Name of owner of a proprietary spectrum
	['DATE', JValueType.SHORT_DATE],    // YY/MM/DD
	['TIME', JValueType.SHORT_TIME],    // hh:mm:ss
	['LONGDATE', JValueType.DATETIME],  // YYYY/MM/DD [HH:MM:SS[.SSSS] [±UUUU]] , e.g. 1998/08/12 23:18:02.0000 -0500
	['SOURCE REFERENCE', JValueType.STRING],
	['CROSS REFERENCE', JValueType.STRING],
	['SAMPLE DESCRIPTION', JValueType.STRING],
	['CAS NAME', JValueType.STRING],
	['NAMES', JValueType.STRING],       // Common, trade, or other names. Multiple names are placed on separate lines
	['MOLFORM', JValueType.STRING],     // Molecular formula
	['CAS REGISTRY NO', JValueType.STRING],
	['WISWESSER', JValueType.STRING],
	['BEILSTEIN LAWSON NO', JValueType.STRING],
	['REFRACTIVE INDEX', JValueType.AFFN],   // In the form: ND = 1542A20 (index at 20°C for NaD line).
	['DENSITY', JValueType.AFFN],            // Density in g/cm3
	['MW', JValueType.AFFN],                 // Molecular weight
	['CONCENTRATIONS', JValueType.STRING],   // List of known components and impurities and their concentrations in the following form
	['SPECTROMETER/DATA SYSTEM', JValueType.STRING],   // manufacturer’s name, model of the spectrometer, software system, and release number, as appropriate
	['INSTRUMENTAL PARAMETERS', JValueType.STRING],
	['SAMPLING PROCEDURE', JValueType.STRING],
	['STATE', JValueType.STRING],           // Solid, liquid, gas, solution, KBr pellet, powder, nujol mull, etc.
	['PATH LENGTH', JValueType.STRING],     // Pathlength in cm
	['PRESSURE', JValueType.STRING],        // Sample pressure in appropriate units if significantly different from room temperature
	['TEMPERATURE', JValueType.STRING],     // Sample temperature in degrees C if significantly different from room temperature
	['DATA PROCESSING', JValueType.STRING],

	['RUNITS', JValueType.STRING],
	['AUNITS', JValueType.STRING],
	['FIRSTR', JValueType.AFFN],
	['LASTR', JValueType.AFFN],
	['FIRSTA', JValueType.AFFN],
	['MAXA', JValueType.AFFN],
	['MINA', JValueType.AFFN],
	['DELTAR', JValueType.AFFN],
	['RFACTOR', JValueType.AFFN],
	['AFACTOR', JValueType.AFFN],
	['ALIAS', JValueType.AFFN],
	['ZPD', JValueType.AFFN],
	['RADATA', JValueType.MULTILINE_AFFN_ASDF],

	// new global labels
	['APPLICATION', JValueType.STRING],
	['DATACLASS', JValueType.STRING],
	['DICTIONARY', JValueType.STRING],
	['BLOCKID', JValueType.STRING],
	['INDEX', JValueType.STRING],
	['SMILES', JValueType.STRING],

	['NTUPLES', JValueType.STRING],
	['VAR_NAME', JValueType.STRING],
	['SYMBOL', JValueType.STRING],
	['VAR_TYPE', JValueType.STRING],
	['VAR_FORM', JValueType.STRING],
	['VAR_DIM', JValueType.STRING],
	['UNITS', JValueType.STRING],
	['FIRST', JValueType.AFFN],
	['LAST', JValueType.AFFN],
	['MIN', JValueType.AFFN],
	['MAX', JValueType.AFFN],
	['FACTOR', JValueType.AFFN],
	['END NTUPLES', JValueType.STRING],
	['PAGE', JValueType.STRING],
	['DATA TABLE', JValueType.MULTILINE_AFFN_ASDF]
]);


Kekule.IO.JcampLdrValueParser = {
	stringParser: function(lines, options)
	{
		return lines.join('\n');
	},
	affnParser: function(lines, options)  // parse to a simple number value
	{
		var text = JcampUtils.getFirstNonemptyLine(lines);
		return parseFloat(text) || 0;
	},
	shortDateParser: function(lines, options)
	{
		var text = JcampUtils.getFirstNonemptyLine(lines);
		var parts = text.split('/');
		return {'year': parseInt(parts[0]) || 0, 'month': parseInt(parts[1]) || 0, 'day': parseInt(parts[2]) || 0};
	},
	shortTimeParser: function(lines, options)
	{
		var text = JcampUtils.getFirstNonemptyLine(lines);
		var parts = text.split('/');
		return {'hour': parseInt(parts[0]) || 0, 'minute': parseInt(parts[1]) || 0, 'second': parseInt(parts[2]) || 0};
	},
	longDateParser: function(lines, options)
	{
		var year = 0, month = 0, day = 0, hour = null, minute = null, second = null, millisecond = null, zone = null;
		var text = JcampUtils.getFirstNonemptyLine(lines);
		// YYYY/MM/DD [HH:MM:SS[.SSSS] [±UUUU]] , e.g. 1998/08/12 23:18:02.0000 -0500
		var parts = text.split(/\s+/g);  // split to date/time/zone parts
		// date
		var pattern = /(\d+)\/(\d+)\/(\d+)/;    // /(\d{4})\/(\d{2})\/(\d{2})/
		var matchResult = (parts[0] || '').match(pattern);
		if (matchResult)
		{
			year = parseInt(matchResult[1]) || 0;
			month = parseInt(matchResult[2]) || 0;
			day = parseInt(matchResult[3]) || 0;
		}
		// time
		var stime = (parts[1] || '').trim();
		if (stime)
		{
			pattern = /(\d+)\:(\d+)\:(\d+)(\.(\d+))?/;
			matchResult = stime.match(pattern);
			if (matchResult)
			{
				hour = parseInt(matchResult[1]);
				minute = parseInt(matchResult[2]);
				second = parseInt(matchResult[3]);
				millisecond = parseInt(matchResult[5]) || null;
			}
		}
		// TODO: time zone part in JCAMP longdate is not handled currently
		// var szone = (parts[2] || '').trim();

		//console.log(year, month, day, hour, minute, second, millisecond);
		return new Date(year, month, day, hour, minute, second, millisecond);
	},

	dataTableParser: function(lines, options)
	{
		var result = {
			'format': lines[0],  // first line is the format info, e.g. (X++(Y..Y)) // (X++(R..R)), XYDATA // etc.
			'values': JcampUtils.decodeAsdfTableLines(lines.slice(1))         // values are grouped in lines,
		};
		return result;
	},
	xyDataTableParser: function(lines, options)
	{
		var result = {
			'format': lines[0],  // first line is the format info, e.g. (X++(Y..Y)) // (X++(R..R)), XYDATA // etc.
			'values': JcampUtils.decodeAsdfTableLines(lines.slice(1), options)         // values are grouped in lines,
		};
		return result;
	}
}


Kekule.IO.JcampLabelValueSetter = Class.create({

});



/**
 * Reader for CML document.
 * Use CmlReader.readData() can retrieve a suitable Kekule.ChemObject.
 * Data fetch in can be a string, reader will parse it to XML automatically;
 *   otherwise it should be a XML document or XML element.
 * @class
 * @augments Kekule.IO.ChemDataReader
 */
Kekule.IO.JcampReader = Class.create(Kekule.IO.ChemDataReader,
/** @lends Kekule.IO.JcampReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.JcampReader',
	/** @private */
	_removeInlineComments: function(str)
	{
		var p = str.indexOf(JcampConsts.INLINE_COMMENT_FLAG);
		return (p >= 0)? str.substring(0, p): str;
	},
	/** @private */
	_parseLdrLines: function(lines)
	{
		var p = lines[0].indexOf(JcampConsts.DATA_LABEL_TERMINATOR);
		var slabel = lines[0].substring(JcampConsts.DATA_LABEL_FLAG.length, p).trim();
		if (!slabel)   // no label, leading with ##=, a comment LDR, currently bypass it
		{
			// TODO: handle comment LDR
			return null;
		}
		else
		{
			var valueLines = [this._removeInlineComments(lines[0].substr(p + 1)).trim()];
			for (var i = 1, l = lines.length; i < l; ++i)
			{
				valueLines.push(this._removeInlineComments(lines[i].trim()));
			}
			return {'labelName': slabel.toUpperCase(), 'valueLines': valueLines};
		}
	},
	/** @private */
	_appendLdrInfo: function(lines, targetArray)
	{
		var ldrParseResult = this._parseLdrLines(lines);
		if (ldrParseResult)
			targetArray.push(ldrParseResult);
		return ldrParseResult;
	},
	/**
	 * Build a JS object to reflect the LDRs in source data. The Block structures are constructed in tree.
	 * @param {String} data
	 * @returns {Object} The result should be {'blocks': rootBlock, 'ldrs': []}  (no LDR should be found outside rootBlock).
	 * @private
	 */
	_buildAnalysisTree: function(data)
	{
		var root = {'blocks': [], 'ldrs': []};
		var currBlock = root;
		var self = this;

		var _pushLdrLineInfo = function(lastLdrLines)
		{
			var ldrParseResult = self._parseLdrLines(lastLdrLines);
			if (ldrParseResult)
			{
				if (ldrParseResult.labelName === JcampConsts.LABEL_BLOCK_BEGIN)  // file beginning or sub blocks begining
				{
					var subBlock = {'ldrs': [], 'blocks': [], '_parent': currBlock};
					currBlock.blocks.push(subBlock);
					currBlock = subBlock;
				}
				self._appendLdrInfo(lastLdrLines, currBlock.ldrs);
				if (ldrParseResult.labelName === JcampConsts.LABEL_BLOCK_END)  // end of sub blocks or file
				{
					currBlock = currBlock._parent;
				}
				// debug
				if (ldrParseResult.labelName === 'XYDATA')
				{
					console.log('Found XYData field');
					Kekule.IO.JcampLdrValueParser.xyDataTableParser(ldrParseResult.valueLines, {doValueCheck: true});
				}
			}
		}

		var textBuffer = new Kekule.TextLinesBuffer(data);
		textBuffer.reset();
		var lastLdrLines = [];
		while (!textBuffer.eof())
		{
			var currLine = textBuffer.readLine().trim();
			if (currLine.startsWith(JcampConsts.DATA_LABEL_FLAG))  // new LDR
			{
				if (lastLdrLines.length)
				{
					_pushLdrLineInfo(lastLdrLines);
				}
				lastLdrLines = [currLine];
			}
			else
			{
				lastLdrLines.push(currLine);
			}
		}
		if (lastLdrLines.length)
		{
			_pushLdrLineInfo(lastLdrLines);
		}
		return root;
	},
	/** @private */
	_getNestedBlockLevelCount: function(analysisTree)
	{
		var result = 1;
		var blocks = analysisTree.blocks;
		if (blocks && blocks.length)
		{
			var maxSubBlockLevelCount = 0;
			for (var i = 0, l = blocks.length; i < l; ++i)
			{
				var c = this._getNestedBlockLevelCount(blocks[i]);
				if (c > maxSubBlockLevelCount)
					maxSubBlockLevelCount = c;
			}
			result += maxSubBlockLevelCount;
		}
		return result;
	},
	/**
	 * Read the analysis tree and create corresponding chem objects.
	 * @param {Object} analysisTree
	 * @returns {Kekule.ChemObject}
	 * @private
	 */
	_buildSpectrumObj: function(analysisTree)
	{
		if (analysisTree.ldrs.length)  // LDR outside root block, some label occurs before ##TITLE
		{
			Kekule.error(Kekule.$L('ErrorMsg.JCAMP_OTHER_LABEL_BEFORE_TITLE_LINE'));
		}
		if (analysisTree.blocks.length > 1)  // more than one root block
		{
			Kekule.error(Kekule.$L('ErrorMsg.JCAMP_MORE_THAN_ONE_ROOT_BLOCK'));
		}
		var rootBlock = analysisTree.blocks[0];
		if (!rootBlock)  // root block not found, the file is not started with ##TITLE label
		{
			Kekule.error(Kekule.$L('ErrorMsg.JCAMP_DATA_WITHOUT_TITLE_LINE'));
		}
		//console.log(this._getNestedBlockLevelCount(rootBlock));
		if (this._getNestedBlockLevelCount(rootBlock) > 2)
		{
			Kekule.error(Kekule.$L('ErrorMsg.JCAMP_MORE_THAN_TWO_NEST_LEVEL'));
		}

		// Some LDRs need to pend handling, most of them depends on other LDRs
		var pendingLdrNames = [
			'DATE', 'TIME'
		];
		var pendingLdrValues = {

		};

		console.log('Pass check');
	},
	/** @private */
	doReadData: function(data, dataType, format)
	{

	}
});


})();