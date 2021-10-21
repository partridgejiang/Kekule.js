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
	enableXYDataValueCheck: true
});

/**
 * Namespace of JCAMP IO.
 * @namespace
 */
Kekule.IO.Jcamp = {};
var Jcamp = Kekule.IO.Jcamp;

// Some consts related with JCAMP
/** @ignore */
Kekule.IO.Jcamp.Consts = {
	DATA_LABEL_FLAG: '##',
	DATA_LABEL_TERMINATOR: '=',
	PRIVATE_LABEL_PREFIX: '$',
	SPECIFIC_LABEL_PREFIX: '.',
	LABEL_BLOCK_BEGIN: 'TITLE',
	LABEL_BLOCK_END: 'END',
	INLINE_COMMENT_FLAG: '$$',
	TABLE_LINE_CONTI_MARK: '=',
	UNKNOWN_VALUE: NaN,  // special value indicating an unknown variable value in data table

	//LABEL_DX_VERSION: 'JCAMP-DX',
	LABEL_DX_VERSION: 'JCAMPDX',
	//LABEL_CS_VERSION: 'JCAMP-CS',
	LABEL_CS_VERSION: 'JCAMPCS',

	DATA_FORMAT_GROUP_LEADING: '(',
	DATA_FORMAT_GROUP_TAILING: ')',
	DATA_FORMAT_LOOP: '..',
	DATA_FORMAT_INC: '++',
	DATA_FORMAT_SYMBOL_ASSIGNMENT: 'A',
	DATA_FORMAT_PLOT_DESCRIPTOR_DELIMITER: ',',

	SIMPLE_VALUE_DELIMITER: ',',

	DATA_VARLIST_FORMAT_XYDATA: 1,
	DATA_VARLIST_FORMAT_XYPOINTS: 2,
	DATA_VARLIST_FORMAT_VAR_GROUPS: 3,

	GROUPED_VALUE_GROUP_DELIMITER: /[;\s]/g,
	GROUPED_VALUE_ITEM_DELIMITER: /,/g,
	GROUPED_VALUE_STR_ENCLOSER_LEADING: '<',
	GROUPED_VALUE_STR_ENCLOSER_TAILING: '>',
	GROUPED_VALUE_EXPLICIT_GROUP_LEADING: '(',
	GROUPED_VALUE_EXPLICIT_GROUP_TAILING: ')',

	VALUE_STR_EXPLICIT_QUOTE: '"',
};
var JcampConsts = Kekule.IO.Jcamp.Consts;

/**
 * Enumeration of JCAMP format standards.
 * @enum
 */
Kekule.IO.Jcamp.Format = {
	DX: 'dx',
	CS: 'cs'
};

/**
 * Enueration of JCAMP data block types.
 * @enum
 */
Kekule.IO.Jcamp.BlockType = {
	/** Data block */
	DATA: 0,
	/** Link block */
	LINK: 1
};

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
Kekule.IO.Jcamp.Utils = {
	/**
	 * Check if two float values are equal in JCAMP file.
	 * @param {Number} v1
	 * @param {Number} v2
	 * @param {Number} allowedError
	 * @returns {Int}
	 */
	compareFloat: function(v1, v2, allowedError)
	{
		if (Kekule.ObjUtils.isUnset(allowedError))
			allowedError = Math.min(Math.abs(v1), Math.abs(v2)) * 0.01;  // TODO: current fixed to 1% of error
		return Kekule.NumUtils.compareFloat(v1, v2, allowedError);
	},
	/**
	 * Remove all slashes, dashes, spaces, underlines and make all letters captializd.
	 * @param {String} labelName
	 * @returns {String}
	 */
	standardizeLdrLabelName: function(labelName)
	{
		var result = labelName.replace(/[\/\\\-\_\s]/g, '');
		return result.toUpperCase();
	},
	/**
	 * Check if two LDR label names are same.
	 * @param {String} name1
	 * @param {String} name2
	 */
	ldrLabelNameEqual: function(name1, name2)
	{
		return JcampUtils.standardizeLdrLabelName(name1) === JcampUtils.standardizeLdrLabelName(name2);
	},
	/**
	 * Returns the core name and label type/data type/category of LDR.
	 * @param {String} labelName
	 * @returns {Hash} {coreName, labelType}
	 */
	analysisLdrLabelName: function(labelName)
	{
		var result;
		if (labelName.startsWith(JcampConsts.SPECIFIC_LABEL_PREFIX))
			result = {'coreName': JcampUtils.standardizeLdrLabelName(labelName.substr(JcampConsts.SPECIFIC_LABEL_PREFIX.length)), 'labelType': JLabelType.SPECIFIC, 'labelCategory': JLabelCategory.ANNOTATION};
		else if (labelName.startsWith(JcampConsts.PRIVATE_LABEL_PREFIX))
			result = {'coreName': JcampUtils.standardizeLdrLabelName(labelName.substr(JcampConsts.PRIVATE_LABEL_PREFIX.length)), 'labelType': JLabelType.PRIVATE, 'labelCategory': JLabelCategory.ANNOTATION};
		else
			result = {'coreName': labelName, 'labelType': JLabelType.GLOBAL, 'labelCategory': JLabelCategory.META};

		var detailInfo = JcampLabelTypeInfos.getInfo(result.coreName, result.labelType);
		if (detailInfo)
		{
			result.dataType = detailInfo.dataType;
			result.labelCategory = detailInfo.labelCategory;
		}
		//console.log('label info', result);

		return result;
	},
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
			++index;
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
				// when DUP, the lastValueType should returns the one of prevNumInfo
				if (prevNumInfo)
					result.lastValueType = prevNumInfo.digitType;
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
		var abscissaInterval;

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
							Kekule.error(Kekule.$L('ErrorMsg.JCAMP_DATA_TABLE_Y_VALUE_CHECK_ERROR'));
						else  // check passed, remove the tailing check value of previous line, not the heading Y value of this line!
						{
							lastValues.pop();
						}
					}
				}
			}
			if (doAbscissaValueCheck)
				checkAbscissaInterval(buffer, result[result.length - 1]);
			/*
			if (result[result.length - 1])
				console.log('push buffer', result[result.length - 1], (buffer[0] - result[result.length - 1][0]) / (result[result.length - 1].length - 1));
			*/
			result.push(buffer);
		}
		var checkAbscissaInterval = function(currGroup, prevGroup)
		{
			if (currGroup && prevGroup)
			{
				var curr = currGroup[0];
				var prev = prevGroup[0];
				var currInterval = (curr - prev) / (prevGroup.length - 1);  // the first item in prevGroup is X, so here we use length-1
				// console.log('prev interval', abscissaInterval, 'curr', currInterval);
				if (abscissaInterval)
				{
					//var allowedError = Math.max(Math.abs(currInterval)) * 0.001;  // TODO: current fixed to 0.1% of error
					//if (!Kekule.NumUtils.isFloatEqual(currInterval, abscissaInterval, allowedError))
					if (JcampUtils.compareFloat(currInterval, abscissaInterval) !== 0)
					{
						//console.log('X check error', currInterval, abscissaInterval);
						Kekule.error(Kekule.$L('ErrorMsg.JCAMP_DATA_TABLE_X_VALUE_CHECK_ERROR'));
					}
				}
				else
					abscissaInterval = currInterval;
			}
			return true;
		};

		for (var i = 0, l = strLines.length; i < l; ++i)
		{
			var currLine = strLines[i].trim();
			if (!currLine)
				continue;
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
	},

	/**
	 * Convert a line of data string in XYPOINTS/PEAK TABLE LDR.
	 * Usually the values are divided into groups with delimiter semicolons or space,
	 * and each item in a group is an AFFN value or string delimited by comma.
	 * @param {String} str
	 * @returns {Array}
	 */
	decodeAffnGroupLine: function(str)
	{
		var CharTypes = {
			DIGIT: 1,
			STRING: 2,
			ENCLOSED_STRING: 3,
			STR_ENCLOSER_LEADING: 11,
			STR_ENCLOSER_TAILING: 12,
			ITEM_DELIMITER: 21,
			GROUP_DELIMITER: 22,
			BLANK: 30,
			OTHER: 40
		};

		var input = str.trim();
		// if input surrounded with '()' (e.g., in peak assignment), removes them first
		if (input.startsWith(JcampConsts.GROUPED_VALUE_EXPLICIT_GROUP_LEADING) && input.endsWith(JcampConsts.GROUPED_VALUE_EXPLICIT_GROUP_TAILING))
			input = input.substr(JcampConsts.GROUPED_VALUE_EXPLICIT_GROUP_LEADING.length, input.length - JcampConsts.GROUPED_VALUE_EXPLICIT_GROUP_LEADING.length - JcampConsts.GROUPED_VALUE_EXPLICIT_GROUP_TAILING.length);

		var currToken = {
			'tokenType': null,
			'text': ''
		};
		var result = [];
		var currGroup = [];

		var parseCurrToken = function(tokenStr, tokenType)
		{
			return tokenStr?
				((tokenType === CharTypes.DIGIT)? parseFloat(tokenStr): tokenStr):
				undefined;
		};
		var parseAndPushCurrTokenToGroup = function(allowEmpty)
		{
			var v;
			if (allowEmpty || currToken.text)
			{
				v = parseCurrToken(currToken.text, currToken.tokenType);
				currGroup.push(v);
			}
			// clear curr token info
			currToken.tokenType = null;
			currToken.text = '';
			return v;
		};
		var pushCurrGroup = function()
		{
			if (currGroup.length)
				result.push(currGroup);
			currGroup = [];
		};

		var getCharType = function(c, insideEnclosedString, insideExplicitGroup)
		{
			if (insideEnclosedString)
				return c.match(JcampConsts.GROUPED_VALUE_STR_ENCLOSER_TAILING)? CharTypes.STR_ENCLOSER_TAILING: CharTypes.STRING;
			else
				return (c >= '0' && c <= '9' || c === '.')? CharTypes.DIGIT:
					c.match(/\s/)? CharTypes.BLANK:
					c.match(JcampConsts.GROUPED_VALUE_STR_ENCLOSER_LEADING)? CharTypes.STR_ENCLOSER_LEADING:
					c.match(JcampConsts.GROUPED_VALUE_STR_ENCLOSER_TAILING)? CharTypes.STR_ENCLOSER_TAILING:
					c.match(JcampConsts.GROUPED_VALUE_GROUP_DELIMITER)? (insideExplicitGroup? CharTypes.ITEM_DELIMITER: CharTypes.GROUP_DELIMITER):
					c.match(JcampConsts.GROUPED_VALUE_ITEM_DELIMITER)? CharTypes.ITEM_DELIMITER:
					CharTypes.STRING;
		};

		var prevIsBlankChar = false;
		for (var i = 0, l = input.length; i < l; ++i)
		{
			var c = input.charAt(i);
			var charType = getCharType(c, currToken.tokenType === CharTypes.ENCLOSED_STRING);

			if (charType === CharTypes.BLANK)
			{
				if (currToken.tokenType === CharTypes.ENCLOSED_STRING)
				{
					currToken.text += c;
					charType = currToken.tokenType;
				}
				else  // pending decision until next token char
				{

				}
			}

			if (charType < CharTypes.STR_ENCLOSER_LEADING)  // normal chars
			{
				if (prevIsBlankChar && currToken.text)  // blank between normal tokens, should be group delimiter?
				{
					parseAndPushCurrTokenToGroup();
					pushCurrGroup();
				}

				if (!currToken.tokenType)
					currToken.tokenType = charType;
				else
					currToken.tokenType = Math.max(currToken.tokenType, charType);  // if both string and digit type ocurrs, the token type shoud be string
				currToken.text += c;
			}
			else if (charType < CharTypes.ITEM_DELIMITER)  // < or >
			{
				if (charType === CharTypes.STR_ENCLOSER_LEADING)
				{
					if (prevIsBlankChar && currToken.text)  // blank before '<', should be group delimiter?
					{
						parseAndPushCurrTokenToGroup();
						pushCurrGroup();
					}
					else
						parseAndPushCurrTokenToGroup();
					currToken.tokenType = CharTypes.ENCLOSED_STRING;
				}
				else // if (charType === CharTypes.STR_ENCLOSER_TAILING)
				{
					//parseAndPushCurrTokenToGroup(true);
					currToken.tokenType = CharTypes.STRING;
				}
			}
			else  // delimiter
			{
				if (charType === CharTypes.ITEM_DELIMITER)
				{
					parseAndPushCurrTokenToGroup(true);
				}
				else if (charType === CharTypes.GROUP_DELIMITER)
				{
					parseAndPushCurrTokenToGroup(true);
					pushCurrGroup();
				}
			}
			prevIsBlankChar = (charType === CharTypes.BLANK);
		}
		// at last the remaining token
		parseAndPushCurrTokenToGroup();
		pushCurrGroup();
		return result;
	},
	/**
	 * Parse lines of data string in XYPOINTS/PEAK TABLE LDR.
	 * Usually the values are divided into groups with delimiter semicolons or space,
	 * and each item in a group is an AFFN value or string delimited by comma.
	 * @param {Array} lines
	 * @param {Hash} options Unused now.
	 * @returns {Array}
	 */
	decodeAffnGroupTableLines: function(lines, options)
	{
		var result = [];
		for (var i = 0, l = lines.length; i < l; ++i)
		{
			var line = lines[i];
			result = result.concat(JcampUtils.decodeAffnGroupLine(line));
		}
		return result;
	},

	/**
	 * Returns details about variable name and format from the format text.
	 * @param {String} formatText Such as (X++(Y..Y)), (XY..XY), etc.
	 * @returns {Hash}
	 */
	getDataTableFormatDetails: function(formatText)
	{
		/*
		##XYDATA: (X++(Y..Y))
		##XYPOINTS: (XY..XY)
		##PEAK TABLE: (XY..XY)
		##PEAK ASSIGNMENTS: (XYA) or (XYWA)
		*/
		if (!formatText.startsWith(JcampConsts.DATA_FORMAT_GROUP_LEADING) && !formatText.endsWith(JcampConsts.DATA_FORMAT_GROUP_TAILING))
			return Kekule.error(Kekule.$L('ErrorMsg.JCAMP_DATA_TABLE_VAR_LIST_FORMAT_ERROR', formatText));
		else
		{
			var text = formatText.substr(JcampConsts.DATA_FORMAT_GROUP_LEADING.length, formatText.length - JcampConsts.DATA_FORMAT_GROUP_LEADING.length - JcampConsts.DATA_FORMAT_GROUP_TAILING.length);
			// remove all internal spaces in text
			text = text.replace(/\s/g, '');
			// test XYData format
			var patternXYData = /^([a-zA-Z])\+\+\(([a-zA-Z])\.\.([a-zA-Z])\)$/;
			var matchResult = text.match(patternXYData);
			if (matchResult)
			{
				if (matchResult[2] !== matchResult[3])  // Y..Y
					return Kekule.error(Kekule.$L('ErrorMsg.JCAMP_DATA_TABLE_VAR_LIST_FORMAT_ERROR', formatText));
				else
					return {'format': JcampConsts.DATA_VARLIST_FORMAT_XYDATA, 'varInc': matchResult[1], 'varLoop': matchResult[2], 'vars': [matchResult[1], matchResult[2]]};
			}
			else
			{
				var patternXYPoint = /^([a-zA-Z]+)\s*\.\.\s*([a-zA-Z]+)$/;
				var matchResult = text.match(patternXYPoint);
				if (matchResult)
				{
					if (matchResult[1] !== matchResult[2])  // XY..XY
						return Kekule.error(Kekule.$L('ErrorMsg.JCAMP_DATA_TABLE_VAR_LIST_FORMAT_ERROR', formatText));
					else
					{
						var vars = [];
						for (var i = 0, l = matchResult[1].length; i < l; ++i)
						{
							if (!matchResult[1].charAt(i).match(/\s/))
								vars.push(matchResult[1].charAt(i));
						}
						return {'format': JcampConsts.DATA_VARLIST_FORMAT_XYPOINTS, 'vars': vars};
					}
				}
				else
				{
					var patternGroupList = /^(([a-zA-Z]\,?)+)$/;
					var matchResult = text.match(patternGroupList);
					if (matchResult)
					{
						var vars = [];
						for (var i = 0, l = matchResult[1].length; i < l; ++i)
						{
							if (matchResult[1].charAt(i) !== ',')
								vars.push(matchResult[1].charAt(i));
						}
						return {'format': JcampConsts.DATA_VARLIST_FORMAT_VAR_GROUPS, 'vars': vars};
					}
				}
			}
			return Kekule.error(Kekule.$L('ErrorMsg.JCAMP_DATA_TABLE_VAR_LIST_FORMAT_UNSUPPORTED', formatText));
		}
	},
	/**
	 * Returns details about variable name/format and plot descriptor from the format text of DATA TABLE LDR.
	 * @param {String} formatText Such as (X++(Y..Y)), XYDATA; (XY..XY), XYPOINTS etc.
	 * @returns {Hash}
	 */
	getDataTableFormatAndPlotDetails: function(formatText)
	{
		//var s = formatText.replace(/\s/g, '');   // remove all blanks first
		// The format part is always enclosed by '()', extract it first
		var p1 = formatText.indexOf(JcampConsts.DATA_FORMAT_GROUP_LEADING);
		var p2 = formatText.lastIndexOf(JcampConsts.DATA_FORMAT_GROUP_TAILING);
		if (p1 >= 0 && p2 >= 0)
		{
			var sFormat = formatText.substring(p1, p2 + 1);
			var result = JcampUtils.getDataTableFormatDetails(sFormat);
			// then the plot descriptor
			var sPlotDescriptor = formatText.substr(p2 + 1).trim();
			var p3 = sPlotDescriptor.indexOf(JcampConsts.DATA_FORMAT_PLOT_DESCRIPTOR_DELIMITER);
			if (p3 >= 0)
			{
				sPlotDescriptor = sPlotDescriptor.substr(JcampConsts.DATA_FORMAT_PLOT_DESCRIPTOR_DELIMITER.length);
				result.plotDescriptor = sPlotDescriptor;
			}
			else  // no plot descriptor, do nothing here
			{

			}
			return result;
		}
		else
			Kekule.error(Kekule.$L('ErrorMsg.JCAMP_DATA_TABLE_VAR_LIST_FORMAT_ERROR', formatText));
	},

	// methods about JCAMP block object from analysis tree
	/** @private */
	_createBlock: function(parent)
	{
		return {'blocks': [], 'ldrs': [], 'ldrIndexes': {}, '_parent': parent}
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
	 * Returns the specified LDR of a block.
	 * @param {Object} block
	 * @param {String} labelName
	 * @returns {Hash}
	 * @private
	 */
	_getBlockLdr: function(block, labelName)
	{
		var index = block.ldrIndexes[labelName];
		return (index >= 0)? block.ldrs[index]: null;
	},
	/**
	 * Returns the meta info (type, format...) of a block.
	 * @param {Object} block
	 * @private
	 */
	_getBlockMeta: function(block)
	{
		var result = block.meta;
		if (!result)
		{
			result = {
				'blockType': block.blocks.length ? Jcamp.BlockType.LINK : Jcamp.BlockType.DATA,
				'format': block.ldrIndexes[JcampConsts.LABEL_DX_VERSION]? Jcamp.Format.DX :
					block.ldrIndexes[JcampConsts.LABEL_CS_VERSION]? Jcamp.Format.CS :
						null  // unknown format
			};
			block.meta = result;
		}
		return result;
	}
};
var JcampUtils = Kekule.IO.Jcamp.Utils;

/**
 * Enumeration of LDR value types
 * @enum
 */
Kekule.IO.Jcamp.ValueType = {
	AFFN: 1,         // single line AFFN value
	ASDF: 2,
	AFFN_ASDF: 3,
	MULTILINE_AFFN_ASDF: 5,   // AFFN or ASDF in multiple lines, e.g. in XYDATA, with a leading format line
	MULTILINE_AFFN_GROUP: 6,  // AFFN/string group, e.g. in XYPOINTS or PEAKTABLE, with a leading format line
	SIMPLE_AFFN_GROUP: 7,     // AFFN group, without leading format line
	STRING_GROUP: 8,  // string group, delimited by comma, e.g., many NTUPLES var definition LDRs
	DATA_TABLE: 9,    // NTuple data table, the format varies according to format string of the first line
	STRING: 10,
	SHORT_DATE: 21,  // date string in format YY/MM/DD
	SHORT_TIME: 22,  // time string in format hh:mm:ss
	DATETIME: 23,    // data/time string in format YYYY/MM/DD [HH:MM:SS[.SSSS] [±UUUU]]
	NONE: 0   // special marks, value should be ignored
};
var JValueType = Kekule.IO.Jcamp.ValueType;

/**
 * Enumeration of JCAMP label types.
 * @enum
 */
Kekule.IO.Jcamp.LabelType = {
	GLOBAL: 0,
	SPECIFIC: 1,
	PRIVATE: 2
}
var JLabelType = Kekule.IO.Jcamp.LabelType;

/**
 * Enumeration of JCAMP label categories.
 * @enum
 */
Kekule.IO.Jcamp.LabelCategory = {
	GLOBAL: 'global',
	META: 'meta',
	PARAMTER: 'parameter',
	CONDITION: 'condition',
	ANNOTATION: 'annotation'
};
var JLabelCategory = Kekule.IO.Jcamp.LabelCategory;

Kekule.IO.Jcamp.LabelTypeInfos = {
	_DEFAULT_TYPE: JValueType.STRING
};
Kekule.IO.Jcamp.LabelTypeInfos.createInfo = function(labelName, dataType, labelType, labelCategory, specificType)
{
	var name = JcampUtils.standardizeLdrLabelName(labelName);
	var defaultLabelType = specificType? JLabelType.SPECIFIC: JLabelType.GLOBAL;
	if (!labelType)
		labelType = defaultLabelType;
	if (!labelCategory)
		labelCategory = (labelType === JLabelType.GLOBAL)? JLabelCategory.META: JLabelCategory.ANNOTATION;
	if (labelType === JLabelType.SPECIFIC && !name.startsWith(JcampConsts.SPECIFIC_LABEL_PREFIX))
		name = JcampConsts.SPECIFIC_LABEL_PREFIX + name;
	else if (labelType === JLabelType.PRIVATE && !name.start(JcampConsts.PRIVATE_LABEL_PREFIX))
		name = JcampConsts.PRIVATE_LABEL_PREFIX + name;
	var result = {
		'labelName': name,
		'labelType': labelType,
		'labelCategory': labelCategory,
		'dataType': dataType
	};
	if (specificType)
		result.specificType = specificType;
	Kekule.IO.Jcamp.LabelTypeInfos[name] = result;
	return result;
};
Kekule.IO.Jcamp.LabelTypeInfos.createInfos = function(infoItems)
{
	for (var i = 0, l = infoItems.length; i < l; ++i)
	{
		var item = infoItems[i];
		Kekule.IO.Jcamp.LabelTypeInfos.createInfo.apply(null, item);
	}
};
Kekule.IO.Jcamp.LabelTypeInfos.getType = function(labelName)
{
	var info = JcampLabelTypeInfos[labelName];
	return (info && info.dataType) || JcampLabelTypeInfos._DEFAULT_TYPE;
};
Kekule.IO.Jcamp.LabelTypeInfos.getCategory = function(labelName)
{
	var info = JcampLabelTypeInfos[labelName];
	return (info && info.labelCategory) || JLabelCategory.ANNOTATION;
};
Kekule.IO.Jcamp.LabelTypeInfos.getInfo = function(labelName, labelType)
{
	var result = JcampLabelTypeInfos[labelName];
	if (result && labelType && result.labelType !== labelType)  // label type not match
		return null;
	return result;
}
var JcampLabelTypeInfos = Kekule.IO.Jcamp.LabelTypeInfos;
var _createLabelTypeInfos = Kekule.IO.Jcamp.LabelTypeInfos.createInfos;
// create type infos
_createLabelTypeInfos([
	// global labels
	['TITLE', JValueType.STRING, null, JLabelCategory.GLOBAL],
	//['JCAMP-DX', JValueType.STRING],    // JCAMP-DX version
	['JCAMPDX', JValueType.STRING],    // JCAMP-DX version
	['JCAMPCX', JValueType.STRING],    // JCAMP-CX version
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
	['RESOLUTION', JValueType.STRING, null, JLabelCategory.PARAMTER],

	['XYDATA', JValueType.MULTILINE_AFFN_ASDF],
	['XYPOINTS', JValueType.MULTILINE_AFFN_GROUP],
	['PEAK TABLE', JValueType.MULTILINE_AFFN_GROUP],
	//['PEAKTABLE', JValueType.MULTILINE_AFFN_GROUP],
	['PEAK ASSIGNMENTS', JValueType.MULTILINE_AFFN_GROUP],
	//['PEAKASSIGNMENTS', JValueType.MULTILINE_AFFN_GROUP],

	['CLASS', JValueType.STRING],       // Coblentz Class of the spectrum (1,2,3, or 4) and the IUPAC Class of digital representation (A, B, C).3
	['ORIGIN', JValueType.STRING],      // Name of organization, address, telephone number, name of individual contributor, etc.,
	['OWNER', JValueType.STRING],       // Name of owner of a proprietary spectrum
	['DATE', JValueType.SHORT_DATE, null, JLabelCategory.GLOBAL],    // YY/MM/DD
	['TIME', JValueType.SHORT_TIME, null, JLabelCategory.GLOBAL],    // hh:mm:ss
	['LONGDATE', JValueType.DATETIME, null, JLabelCategory.GLOBAL],  // YYYY/MM/DD [HH:MM:SS[.SSSS] [±UUUU]] , e.g. 1998/08/12 23:18:02.0000 -0500
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
	['MP', JValueType.AFFN],                 // Melting point in C
	['BP', JValueType.AFFN],                 // boiling point in C
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
	['VAR_NAME', JValueType.STRING_GROUP],
	['SYMBOL', JValueType.STRING_GROUP],
	['VAR_TYPE', JValueType.STRING_GROUP],
	['VAR_FORM', JValueType.STRING_GROUP],
	['VAR_DIM', JValueType.SIMPLE_AFFN_GROUP],
	['UNITS', JValueType.STRING_GROUP],
	['FIRST', JValueType.SIMPLE_AFFN_GROUP],
	['LAST', JValueType.SIMPLE_AFFN_GROUP],
	['MIN', JValueType.SIMPLE_AFFN_GROUP],
	['MAX', JValueType.SIMPLE_AFFN_GROUP],
	['FACTOR', JValueType.SIMPLE_AFFN_GROUP],
	['END NTUPLES', JValueType.STRING],
	['PAGE', JValueType.STRING],
	['DATA TABLE', JValueType.DATA_TABLE]
]);


Kekule.IO.Jcamp.LdrValueParser = {
	/** @private */
	_parserFuncs: {
		byLabelName: {},
		byDataType: {}
	},
	/**
	 * Register a parser function for LDR value, based on labelName or dataType.
	 * @param {String} labelName
	 * @param {Int} dataType
	 * @param {Function} func
	 */
	registerParser: function(labelName, dataType, func)
	{
		if (labelName)
			JcampLdrValueParser._parserFuncs.byLabelName[JcampUtils.standardizeLdrLabelName(labelName)] = func;
		else if (dataType)
			JcampLdrValueParser._parserFuncs.byDataType[dataType] = func;
	},
	/**
	 * Returns the suitable parser function for a LDR.
	 * @param {Hash} ldr
	 * @returns {Func}
	 */
	getParserFunc: function(ldr)
	{
		var labelName = Jcamp.Utils.standardizeLdrLabelName(ldr.labelName);
		var result = JcampLdrValueParser._parserFuncs.byLabelName[labelName];
		if (!result)
		{
			var valueType = JcampLabelTypeInfos.getType(labelName);
			result = JcampLdrValueParser._parserFuncs.byDataType[valueType];
		}
		if (!result)
			result = JcampLdrValueParser._parserFuncs['_default'];
		return result;
	},
	/**
	 * Parse the LDR value, returns the suitable type.
	 * @param {Hash} ldr
	 * @param {Hash} options
	 * @returns {Variant}
	 */
	parseValue: function(ldr, options)
	{
		var func = JcampLdrValueParser.getParserFunc(ldr);
		var result = func(ldr.valueLines, options);
		return result;
	},

	stringParser: function(lines, options)
	{
		return lines.join('\n');
	},
	affnParser: function(lines, options)  // parse to a simple number value
	{
		var text = JcampUtils.getFirstNonemptyLine(lines);
		var result = parseFloat(text);
		return (Kekule.NumUtils.isNormalNumber(result))? result: NaN;
	},
	asdfParser: function(lines, options)
	{
		var text = JcampUtils.getFirstNonemptyLine(lines);
		var vs = JcampUtils.decodeAsdfLine(text);
		return vs && vs[0];
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
		var parts = text.split(':');
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
		return new Date(year, month - 1, day, hour, minute, second, millisecond);  // note month is 0-based
	},
	stringGroupParser: function(lines, options)
	{
		var v = lines.join(' ').trim();
		if (v.endsWith(JcampConsts.SIMPLE_VALUE_DELIMITER))  // ignore the tailing delimiter
			v = v.substr(0, v.length - JcampConsts.SIMPLE_VALUE_DELIMITER.length);
		var result = v.split(JcampConsts.SIMPLE_VALUE_DELIMITER);
		for (var i = 0, l = result.length; i < l; ++i)
		{
			result[i] = result[i].trim();
			var s = result[i];
			if (s.startsWith(JcampConsts.VALUE_STR_EXPLICIT_QUOTE) && s.endsWith(JcampConsts.VALUE_STR_EXPLICIT_QUOTE))
				result[i] = s.substr(JcampConsts.VALUE_STR_EXPLICIT_QUOTE.length, s.length - JcampConsts.VALUE_STR_EXPLICIT_QUOTE.length * 2);
		}

		return result;
	},
	simpleAffnGroupParser: function(lines)
	{
		var v = lines.join(' ');
		var result = v.split(JcampConsts.SIMPLE_VALUE_DELIMITER);
		for (var i = 0, l = result.length; i < l; ++i)
		{
			result[i] = parseFloat(result[i].trim());
		}
		return result;
	},

	xyDataTableParser: function(lines, options)
	{
		var result = {format: lines[0], formatDetail: Jcamp.Utils.getDataTableFormatAndPlotDetails(lines[0])};
		var needToDoValueCheck = Kekule.globalOptions.IO.jcamp.enableXYDataValueCheck && (options && options.doValueCheck) && !!result.formatDetail.varInc;  // only X++(Y..Y) format (with varInc) need to do value check
		var op = Object.extend(options || {}, {'doValueCheck': needToDoValueCheck});
		result.values = JcampUtils.decodeAsdfTableLines(lines.slice(1), op);         // values are grouped in lines,
		/*
		var result = {
			'format': lines[0],  // first line is the format info, e.g. (X++(Y..Y)) // (X++(R..R)), XYDATA // etc.
			'values': JcampUtils.decodeAsdfTableLines(lines.slice(1), options)         // values are grouped in lines,
		};
		*/
		return result;
	},
	groupedDataTableParser: function(lines, options)
	{
		var result = {
			'format': lines[0],
			'formatDetail': Jcamp.Utils.getDataTableFormatAndPlotDetails(lines[0]),
			'values': JcampUtils.decodeAffnGroupTableLines(lines.slice(1), options)
		};
		return result;
	},
	ntuplesDataTableParser: function(lines, options)
	{
		var result;
		var formatDetail = Jcamp.Utils.getDataTableFormatAndPlotDetails(lines[0]);
		//var valueLines = lines.slice(1);

		if (formatDetail.format === Jcamp.Consts.DATA_VARLIST_FORMAT_XYDATA)
		{
			result = JcampLdrValueParser.xyDataTableParser(lines, options);
		}
		else if (formatDetail.format === Jcamp.Consts.DATA_VARLIST_FORMAT_XYPOINTS)
		{
			result = JcampLdrValueParser.groupedDataTableParser(lines, options);
		}
		else if (formatDetail.format === Jcamp.Consts.DATA_VARLIST_FORMAT_VAR_GROUPS)
		{
			result = JcampLdrValueParser.groupedDataTableParser(lines, options);
		}
		return result;
	}
}
var JcampLdrValueParser = Kekule.IO.Jcamp.LdrValueParser;
JcampLdrValueParser._parserFuncs._default = JcampLdrValueParser.stringParser;
JcampLdrValueParser.registerParser(null, JValueType.AFFN, JcampLdrValueParser.affnParser);
JcampLdrValueParser.registerParser(null, JValueType.ASDF, JcampLdrValueParser.asdfParser);
JcampLdrValueParser.registerParser(null, JValueType.STRING, JcampLdrValueParser.stringParser);
JcampLdrValueParser.registerParser(null, JValueType.SHORT_DATE, JcampLdrValueParser.shortDateParser);
JcampLdrValueParser.registerParser(null, JValueType.SHORT_TIME, JcampLdrValueParser.shortTimeParser);
JcampLdrValueParser.registerParser(null, JValueType.DATETIME, JcampLdrValueParser.longDateParser);
JcampLdrValueParser.registerParser(null, JValueType.MULTILINE_AFFN_ASDF, JcampLdrValueParser.xyDataTableParser);
JcampLdrValueParser.registerParser(null, JValueType.MULTILINE_AFFN_GROUP, JcampLdrValueParser.groupedDataTableParser);
JcampLdrValueParser.registerParser(null, JValueType.DATA_TABLE, JcampLdrValueParser.ntuplesDataTableParser);
JcampLdrValueParser.registerParser(null, JValueType.STRING_GROUP, JcampLdrValueParser.stringGroupParser);
JcampLdrValueParser.registerParser(null, JValueType.SIMPLE_AFFN_GROUP, JcampLdrValueParser.simpleAffnGroupParser);


/**
 * The manager to store and create suitable JCAMP block reader for different types of blocks.
 * @class
 * @private
 */
Kekule.IO.Jcamp.BlockReaderManager = {
	/** @private */
	'_readerClasses': [],
	/** @private */
	_findRegisteredItemIndex: function(blockType, blockFormat, readerClass, allowWildcard)
	{
		var iu = Kekule.ObjUtils.isUnset;
		var cs = jcampBlockReaderManager._readerClasses;
		for (var i = cs.length - 1; i >= 0; --i)
		{
			var item = cs[i];
			if ((iu(blockType) || blockType === item.blockType || (allowWildcard && item.blockType === '*'))
				&& (iu(blockFormat) || blockFormat === item.blockFormat || (allowWildcard && item.blockFormat === '*'))
				&& (iu(readerClass) || readerClass === item.readerClass))
				return i;
		}
		return -1;
	},
	register: function(blockType, blockFormat, readerClass)
	{
		if (jcampBlockReaderManager._findRegisteredItemIndex(blockType, blockFormat, readerClass) < 0)
			jcampBlockReaderManager._readerClasses.push({'blockType': blockType, 'blockFormat': blockFormat, 'readerClass': readerClass});
	},
	unregister: function(blockType, blockFormat, readerClass)
	{
		var index = jcampBlockReaderManager._findRegisteredItemIndex(blockType, blockFormat, readerClass);
		jcampBlockReaderManager._readerClasses.splice(index, 1);
	},
	getReaderClass: function(blockType, blockFormat)
	{
		var index = jcampBlockReaderManager._findRegisteredItemIndex(blockType, blockFormat, null, true);
		return (index >= 0)? jcampBlockReaderManager._readerClasses[index].readerClass: null;
	}
};
var jcampBlockReaderManager = Kekule.IO.Jcamp.BlockReaderManager;

/**
 * Base reader for block of JCAMP document tree.
 * The input data is a analysis tree object.
 * Concrete descendants should be implemented for different types of blocks.
 * @class
 * @augments Kekule.IO.ChemDataReader
 */
Kekule.IO.Jcamp.BlockReader = Class.create(Kekule.IO.ChemDataReader,
/** @lends Kekule.IO.Jcamp.BlockReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.Jcamp.BlockReader',
	/** @constructs */
	initialize: function(options)
	{
		this.setPropStoreFieldValue('ldrHandlerMap', {});
		this.tryApplySuper('initialize', options);
		this._initLdrHandlers();
	},
	/** @private */
	initProperties: function()
	{
		// private, a hash object. The hash key is LDR label name, value is the function to store some predefined functions to handle LDRs.
		// A false value means this LDR need not to be handled.
		// ldrSetterMap['_default'] is treated as the default setter.
		// Each functions has params (ldr, targetChemObj)
		this.defineProp('ldrHandlerMap', {'dataType': DataType.HASH, 'setter': false, 'scope': Class.PropertyScope.PRIVATE});
	},
	/** @private */
	_initLdrHandlers: function()
	{
		var map = this.getLdrHandlerMap();
		/*
		map['_default'] = function(ldr, block, targetChemObj) {
			targetChemObj.setInfoValue(ldr.labelName, JcampLdrValueParser.parseValue(ldr));
		};
		*/
		map['_default'] = this._defaultLdrHandler.bind(this);
		//map[JcampConsts.LABEL_BLOCK_BEGIN] = this.doStoreLdrToChemObjProp.bind(this, 'title');  // TITLE
		map[JcampConsts.LABEL_BLOCK_BEGIN] = this.doStoreLdrToChemObjInfoProp.bind(this, 'title');  // TITLE
		map[JcampConsts.LABEL_DX_VERSION] = map[JcampConsts.LABEL_DX_VERSION_2] = this.doStoreLdrToChemObjInfoProp.bind(this, 'jcampDxVersion');  // JCAMP-DX
		map[JcampConsts.LABEL_BLOCK_END] = this._ignoreLdrHandler;  // block end, need not to store value of this ldr
		var doStoreDateTimeLdrBind = this.doStoreDateTimeLdr.bind(this);
		map['DATE'] = doStoreDateTimeLdrBind;
		map['TIME'] = doStoreDateTimeLdrBind;
		map['LONGDATE'] = doStoreDateTimeLdrBind;
		return map;
	},
	/** @private */
	_defaultLdrHandler: function(ldr, block, targetChemObj)
	{
		return this.saveLdrValueToChemObjInfoProp(ldr.labelName, JcampLdrValueParser.parseValue(ldr), targetChemObj);
	},
	/** @private */
	_ignoreLdrHandler: function(ldr, block, targetChemObj)
	{
		// bypass this ldr
	},

	/** @private */
	_getBlockMeta: function(block)
	{
		return JcampUtils._getBlockMeta(block);
	},

	/**
	 * Create a suitable chem object for a block in analysis tree.
	 * Descendants should override this method.
	 * @param {Hash} block
	 * @returns {Kekule.ChemObject}
	 * @private
	 */
	doCreateChemObjForBlock: function(block)
	{
		return null;
	},
	/*
	 * Create a suitable chem object tree for analysis tree.
	 * Descendants may override this method.
	 * @param {Hash} rootBlock
	 * @returns {Kekule.MapEx} The map mapping block to a chem object.
	 * @private
	 */
	/*
	doCreateChemObjTree: function(rootBlock)
	{
		var map = new Kekule.MapEx();
		var rootObj = this.doCreateChemObjForBlock(rootBlock);
		if (rootObj)
			map.set(rootBlock, rootObj);
		for (var i = 0, l = rootBlock.blocks.length; i < l; ++i)
		{
			var childObj = this.doCreateChemObjForBlock(rootBlock.blocks[i], rootObj);
			if (childObj)
			{
				map.set(rootBlock.blocks[i], childObj);
				rootObj.appendChild(childObj);
			}
		}
		return map;
	},
	*/

	/** @private */
	getLdrNamePrefixForInfoField: function(labelName, labelType, chemObj)
	{
		var result = 'jcamp.';
		if (labelType === JLabelType.SPECIFIC)
		{
			// do nothing here
		}
		else if (labelType === JLabelType.PRIVATE)
		{
			result += 'custom.'
		}
		return result;
	},
	/** @private */
	getLdrStorageParamsForInfoField: function(labelName, chemObj)
	{
		var ldrNameInfo = Jcamp.Utils.analysisLdrLabelName(labelName);
		var labelType = ldrNameInfo.labelType;
		var prefix = this.getLdrNamePrefixForInfoField(labelName, labelType, chemObj);
		var fullName = prefix? prefix + ldrNameInfo.coreName: ldrNameInfo.coreName;
		var result = {
			'fullName': fullName,
			'labelType': labelType,
			'labelCategory': ldrNameInfo.labelCategory,
		}
		return result;
	},
	/** @private */
	saveLdrValueToChemObjInfoProp: function(ldrName, ldrValue, chemObj)
	{
		var params = this.getLdrStorageParamsForInfoField(ldrName, chemObj);
		var fname = params.fullName;
		var category = params.labelCategory;
		var saveMethod;

		if (category === JLabelCategory.ANNOTATION)
			saveMethod = chemObj.setAnnotation;
		else if (category === JLabelCategory.PARAMTER)
			saveMethod = chemObj.setParameter;
		else if (category === JLabelCategory.CONDITION)
			saveMethod = chemObj.setCondition;
		else if (category === JLabelCategory.META)
			saveMethod = chemObj.setMeta;
		else if (category === JLabelCategory.GLOBAL)
			saveMethod = chemObj.setInfoValue;
		else if (params.labelType === JLabelType.PRIVATE)
			saveMethod = chemObj.setAnnotation;
		if (!saveMethod)
			saveMethod = chemObj.setInfoValue;  // default
		saveMethod.apply(chemObj, [fname, ldrValue]);
	},

	/** @private */
	doStoreLdrToChemObjInfoProp: function(name, ldr, block, chemObj)
	{
		var ldrValue = JcampLdrValueParser.parseValue(ldr);
		//chemObj.setInfoValue(infoFieldName, ldrValue);
		this.saveLdrValueToChemObjInfoProp(name, ldrValue, chemObj);
	},
	/* @private */
	/*
	doStoreLdrToChemObjProp: function(propName, ldr, block, chemObj)
	{
		var ldrValue = JcampLdrValueParser.parseValue(ldr);
		chemObj.setCascadePropValue([propName], ldrValue);
	},
	*/
	/** @private */
	doStoreDateTimeLdr: function(ldr, block, chemObj)
	{
		var fieldName = 'date';
		var infoFieldValue;
		var labelName = ldr.labelName;
		var ldrValue = JcampLdrValueParser.parseValue(ldr);
		if (labelName === 'LONGDATE')
		{
			infoFieldValue = ldrValue;
		}
		else if (labelName === 'DATE')
		{
			infoFieldValue = new Date(ldrValue.year, ldrValue.month - 1, ldrValue.day);  // note month is 0-based
			var timeLdr = JcampUtils._getBlockLdr(block, 'TIME');
			if (timeLdr)
			{
				var timeLdrValue = JcampLdrValueParser.parseValue(timeLdr);
				infoFieldValue.setHours(timeLdrValue.hour, timeLdrValue.minute, timeLdrValue.second);
			}
		}
		else if (labelName === 'TIME')
		{
			// bypass the TIME ldr, since it is processed in DATE
		}
		if (infoFieldValue)
		{
			//chemObj.setInfoValue(fieldName, infoFieldValue);
			this.saveLdrValueToChemObjInfoProp(fieldName, infoFieldValue, chemObj);
		}
	},

	/**
	 * Returns an array of names of LDRs which need to be handled after other normal LDRs (e.g., data table).
	 * Descendants may override this method.
	 * @returns {Array}
	 * @private
	 */
	getPendingLdrNames: function()
	{
		return [];
	},
	/**
	 * Returns an array of names of LDRs which need not to be handled.
	 * Descendants may override this method.
	 * @returns {Array}
	 */
	getIgnoredLdrNames: function()
	{
		return [];
	},
	/** @private */
	processLdr: function(block, ldr, chemObj)
	{
		return this.doProcessLdr(block, ldr, chemObj);
	},
	/** @private */
	doProcessLdr: function(block, ldr, chemObj)
	{
		var labelName = ldr.labelName;
		var handlerMap = this.getLdrHandlerMap();
		var handler = handlerMap[labelName] || handlerMap['_default'];
		if (handler)
			handler(ldr, block, chemObj);
	},
	/**
	 * Process a block in the analysis tree.
	 * Decendants may override this method.
	 * @param {Hash} block
	 * @param {Kekule.ChemObject} chemObj
	 * @private
	 */
	doSetChemObjFromBlock: function(block, chemObj)
	{
		if (chemObj)
		{
			var ignoredLdrNames = this.getIgnoredLdrNames() || [];
			var pendingLdrNames = this.getPendingLdrNames() || [];
			var pendingLdrs = [];
			// LDRs of block
			for (var i = 0, l = block.ldrs.length; i < l; ++i)
			{
				var ldr = block.ldrs[i];
				if (ignoredLdrNames.indexOf(ldr.labelName) >= 0)
					continue;
				if (pendingLdrNames.indexOf(ldr.labelName) >= 0)
				{
					pendingLdrs.push(ldr);
					continue;
				}
				this.processLdr(block, ldr, chemObj);
			}
			for (var i = 0, l = pendingLdrs.length; i < l; ++i)
			{
				var ldr = pendingLdrs[i];
				this.processLdr(block, ldr, chemObj);
			}
		}
		return chemObj;
	},

	/**
	 * Read block of JCAMP data and create corresponding chem object.
	 * @param {Object} block
	 * @param {Hash} options
	 * @returns {Kekule.ChemObject}
	 */
	doReadBlock: function(block, options)
	{
		var result = this.doCreateChemObjForBlock(block);
		if (result)
		{
			this.doSetChemObjFromBlock(block, result);
		}
		return result;
	},
	/** @private */
	doReadData: function(data, dataType, format, options)
	{
		var result = this.doReadBlock(data, options);
		return result;
	}
});

/**
 * Reader for reading a general data block of JCAMP document tree.
 * @class
 * @augments Kekule.IO.Jcamp.BlockReader
 */
Kekule.IO.Jcamp.DataBlockReader = Class.create(Kekule.IO.Jcamp.BlockReader,
/** @lends Kekule.IO.Jcamp.DataBlockReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.Jcamp.DataBlockReader'
});
/**
 * Reader for reading link block of JCAMP document tree.
 * @class
 * @augments Kekule.IO.Jcamp.BlockReader
 */
Kekule.IO.Jcamp.LinkBlockReader = Class.create(Kekule.IO.Jcamp.BlockReader,
/** @lends Kekule.IO.Jcamp.BlockReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.Jcamp.LinkBlockReader',
	/** @ignore */
	doCreateChemObjForBlock: function(block)
	{
		var result;
		var meta = this._getBlockMeta(block);
		if (meta.blockType === Jcamp.BlockType.LINK)
		{
			result = new Kekule.ChemObjList();
		}
		else
			result = this.tryApplySuper('doCreateChemObjForBlock', [block]);
		return result;
	},
	/** @ignore */
	doReadBlock: function(block, options)
	{
		var result;
		if (block.blocks.length <= 0)  // no child block, nothing will be returned
		{
			return null;
		}
		else  // create obj list
		{
			result = this.tryApplySuper('doReadBlock', [block]);
		}
		// handle child blocks
		var childObjs = [];
		for (var i = 0, l = block.blocks.length; i < l; ++i)
		{
			var childBlock = block.blocks[i];
			var meta = this._getBlockMeta(childBlock);
			var readerClass = jcampBlockReaderManager.getReaderClass(meta.blockType, meta.format);
			if (readerClass)
			{
				var reader = new readerClass();
				try
				{
					var childObj = reader.doReadData(childBlock, options);    // use doReadData instead of readData, since child readers do not need to store srcInfo
					if (childObj)
					{
						/*
						if (!result)  // only one child block, returns this childObj directly
							result = childObj;
						else
							result.appendChild(childObj);
						*/
						childObjs.push(childObj);
					}
				}
				finally
				{
					reader.finalize();
				}
			}
		}

		if (childObjs.length <= 1)  // no need to return list, just an object only
		{
			result.finalize();
			return childObjs[0];
		}
		else
		{
			for (var i = 0, l = childObjs.length; i < l; ++i)
				result.appendChild(childObjs[i]);
			return result;
		}
	},
});
jcampBlockReaderManager.register(Jcamp.BlockType.LINK, '*', Kekule.IO.Jcamp.LinkBlockReader);  // register
jcampBlockReaderManager.register(Jcamp.BlockType.DATA, '*', Kekule.IO.Jcamp.DataBlockReader);  // register

})();