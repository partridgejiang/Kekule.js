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
	enableXYDataValueCheck: true,
	dataValueCheckAllowedErrorRatio: 0.001,   // allow 0.1% error of X/Y value check
	maxCharsPerLine: 80,   // theoretically, there should be no more than 80 chars per line in JCAMP file
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
	LABEL_DATA_TYPE: 'DATATYPE',
	//LABEL_DATA_CLASS: 'DATACLASS',
	LABEL_BLOCK_COUNT: 'BLOCKS',
	LABEL_BLOCK_ID: 'BLOCKID',
	LABEL_CROSS_REF: 'CROSSREFERENCE',

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

	CROSS_REF_TYPE_TERMINATOR: ':',  // to delimiter a cross reference text, e.g. 'STRUCTURE: BLOCK_ID= 1', 'NMR PEAK ASSIGNMENTS: BLOCK_ID= 2'

	DATA_VARLIST_FORMAT_XYDATA: 1,
	DATA_VARLIST_FORMAT_XYPOINTS: 2,
	DATA_VARLIST_FORMAT_XYWPOINTS: 2,  // (XYW...XYW) for peak table, now we can handle this same as XYPOINTS
	DATA_VARLIST_FORMAT_VAR_GROUPS: 5,

	GROUPED_VALUE_GROUP_DELIMITER: '\n',
	GROUPED_VALUE_GROUP_DELIMITER_PATTERN: /[;\s+]/g,
	GROUPED_VALUE_ITEM_DELIMITER: ',',
	GROUPED_VALUE_ITEM_DELIMITER_PATTERN: /,/g,
	GROUPED_VALUE_STR_ENCLOSER_LEADING: '<',
	GROUPED_VALUE_STR_ENCLOSER_TAILING: '>',
	GROUPED_VALUE_EXPLICIT_GROUP_LEADING: '(',
	GROUPED_VALUE_EXPLICIT_GROUP_TAILING: ')',

	NTUPLE_DEFINITION_ITEM_DELIMITER: ',\t',

	VALUE_STR_EXPLICIT_QUOTE: '"',

	VALUE_ABNORMAL_NUM: '?',

	MOL_FORMULA_SUP_PREFIX: '^',
	MOL_FORMULA_SUB_PREFIX: '/',
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
 * Enumeration of JCAMP data block types.
 * @enum
 */
Kekule.IO.Jcamp.BlockType = {
	/** Data block */
	DATA: 0,
	/** Link block */
	LINK: 1
};

/**
 * Enumeration of JCAMP cross reference target tyoes.
 * @enum
 */
Kekule.IO.Jcamp.CrossRefType = {
	SPECTRUM: 1,
	STRUCTURE: 2,
	UNKNOWN: 0
};

/**
 * Enumeration of JCAMP ASDF data forms.
 * @enum
 */
Kekule.IO.Jcamp.AsdfForm = {
	AFFN: 1,
	PAC: 2,
	SQZ: 3,
	DIF: 4,
	SQZ_DUP: 13,
	DIF_DUP: 14
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
 * Storing the label map between JCAMP and Kekule spectrum.
 * @class
 */
Kekule.IO.Jcamp.Labels = {
	/** @private */
	_maps: [], // each item is an array of [jcampLabel, kekuleLabel]
	/**
	 * Returns all map items.
	 * @returns {Array}
	 */
	getMaps: function()
	{
		return JcampLabels._maps;
	},
	/**
	 * Add map items.
	 * @param {Array} items
	 */
	addMaps: function(items)
	{
		AU.pushUnique(JcampLabels._maps, items, true);
	}
};
var JcampLabels = Kekule.IO.Jcamp.Labels;

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
			allowedError = Math.max(Math.abs(v1), Math.abs(v2)) * 0.01;  // TODO: current fixed to 1% of error
		return Kekule.NumUtils.compareFloat(v1, v2, allowedError);
	},
	/**
	 * Calculate a suitable factor for converting to integers from a set of floats.
	 * This function is used for storing spectrum data into JCAMP-DX data table, or converting atom coord to integer in JCAMP-CS.
	 * @param {Number} minValue Min value of original data set.
	 * @param {Number} maxValue Max value of original data set.
	 * @param {Float} allowErrorRatio Permitted error, e.g. 0.001 for 0.1%.
	 * @param {Int} preferredScaleRangeMin If set, the rescaled data items should be larger than this value. It should be a negative value.
	 * @param {Int} preferredScaleRangeMax If set, the rescaled data items should be less than this value. It should be a positive value.
	 */
	calcNumFactorForRange: function(minValue, maxValue, allowedErrorRatio, preferredScaleRangeMin, preferredScaleRangeMax)
	{
		//var factor = Math.min(Math.abs(minValue), Math.abs(maxValue)) * allowedErrorRatio;
		if (Kekule.NumUtils.isFloatEqual(minValue, maxValue))
		{
			if (Kekule.ObjUtils.notUnset(preferredScaleRangeMin) && Kekule.ObjUtils.notUnset(preferredScaleRangeMax))
			{
				if (minValue > preferredScaleRangeMin && maxValue < preferredScaleRangeMax)
					return 1;
			}
		}
		var factor = 1;
		var errorBase = Math.abs(maxValue - minValue) || Math.max(Math.abs(maxValue), Math.abs(minValue));
		if (allowedErrorRatio)
			factor = errorBase * allowedErrorRatio;
		//var factor = Math.min(allowedError / Math.abs(minValue), allowedError / Math.abs(maxValue));
		if (Kekule.ObjUtils.notUnset(preferredScaleRangeMin) && Kekule.ObjUtils.notUnset(preferredScaleRangeMax))
		{
			if (minValue / factor > preferredScaleRangeMin && maxValue / factor < preferredScaleRangeMax)  // we can even use a smaller factor?
			{
				var pfactor1 = Math.max(minValue / preferredScaleRangeMin, 0);  // avoid negative factor
				var pfactor2 = Math.max(maxValue / preferredScaleRangeMax, 0);
				var pfactor = (!pfactor1) ? pfactor2 :
					(!pfactor2) ? pfactor1 :
						Math.max(pfactor1, pfactor2);
				if (pfactor)
					factor = Math.min(factor, pfactor);
			}
		}
		//console.log(minValue, maxValue, factor);
		return factor;
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
	 * @param {Bool} checkDataType
	 * @returns {Hash} {coreName, labelType}
	 */
	analysisLdrLabelName: function(labelName, checkDataType)
	{
		var result;
		if (labelName.startsWith(JcampConsts.SPECIFIC_LABEL_PREFIX))
			result = {'coreName': JcampUtils.standardizeLdrLabelName(labelName.substr(JcampConsts.SPECIFIC_LABEL_PREFIX.length)), 'labelType': JLabelType.SPECIFIC, 'labelCategory': JLabelCategory.ANNOTATION};
		else if (labelName.startsWith(JcampConsts.PRIVATE_LABEL_PREFIX))
			result = {'coreName': JcampUtils.standardizeLdrLabelName(labelName.substr(JcampConsts.PRIVATE_LABEL_PREFIX.length)), 'labelType': JLabelType.PRIVATE, 'labelCategory': JLabelCategory.ANNOTATION};
		else
			result = {'coreName': labelName, 'labelType': JLabelType.GLOBAL, 'labelCategory': JLabelCategory.META};

		if (checkDataType === undefined || checkDataType)
		{
			var detailInfo = JcampLabelTypeInfos.getInfo(result.coreName, result.labelType);
			if (detailInfo)
			{
				result.dataType = detailInfo.dataType;
				result.labelCategory = detailInfo.labelCategory;
			}
		}
		//console.log('label info', result);

		return result;
	},
	/**
	 * Get the corresponding info key name of Kekule spectrum for a JCAMP LDR name.
	 * @param {String} jcampName
	 * @param {String} spectrumType
	 * @returns {String}
	 */
	jcampLabelNameToKekule: function(jcampName, spectrumType)
	{
		var MetaPropNamespace = Kekule.Spectroscopy.MetaPropNamespace;
		var jname = JcampUtils.standardizeLdrLabelName(jcampName);
		if (jname.startsWith(JcampConsts.PRIVATE_LABEL_PREFIX))  // a private label
		{
			var coreName = jname.substr(JcampConsts.PRIVATE_LABEL_PREFIX.length);
			return MetaPropNamespace.createPropertyName(MetaPropNamespace.CUSTOM, coreName);
		}
		else  // need to check for map
		{
			var maps = JcampLabels.getMaps();
			var candicateResult;
			for (var i = 0, l = maps.length; i < l; ++i)
			{
				var map = maps[i];
				if (jname === map[0])
				{
					var kname = map[1];
					var kNameDetail = MetaPropNamespace.getPropertyNameDetail(kname);
					if (spectrumType && kNameDetail.namespace && kNameDetail.namespace !== MetaPropNamespace.CUSTOM)  // check if the spectrum type matches
					{
						if (spectrumType === kNameDetail.namespace)
							return kname;
						else
							candicateResult = kname;
					}
					else
						return kname;
				}
			}
			if (candicateResult)
				return candicateResult;
			// not found
			if (jname.startsWith(JcampConsts.SPECIFIC_LABEL_PREFIX))  // spectrum specific label
			{
				var coreName = jname.substr(JcampConsts.SPECIFIC_LABEL_PREFIX.length);
				return MetaPropNamespace.createPropertyName(spectrumType, coreName);
			}
			else  // global label
			{
				return MetaPropNamespace.createPropertyName('jcamp', jname);
			}
		}
	},
	/**
	 * Get the corresponding JCAMP LDR name for Kekule spectrum info property name.
	 * @param {String} kekuleName
	 * @param {String} spectrumType
	 * @param {Bool} convOnlyAssured
	 * @returns {String}
	 */
	kekuleLabelNameToJcamp: function(kekuleName, spectrumType, convOnlyAssured)
	{
		var MetaPropNamespace = Kekule.Spectroscopy.MetaPropNamespace;
		var maps = JcampLabels.getMaps();
		for (var i = 0, l = maps.length; i < l; ++i)
		{
			var map = maps[i];
			if (kekuleName === map[1])
				return map[0];
		}
		if (!convOnlyAssured)
		{
			// not found, regard it as private label
			var nameDetail = MetaPropNamespace.getPropertyNameDetail(kekuleName);
			return JcampConsts.PRIVATE_LABEL_PREFIX + nameDetail.coreName.toUpperCase();
		}
		else
			return null;
	},

	/**
	 * Retrieve detail of cross reference from the text
	 * @param {String} crossRefText
	 * @returns {Hash} Including fields {refType, refTypeText, blockID}.
	 */
	getCrossReferenceDetail: function(crossRefText)
	{
		var parts = crossRefText.split(JcampConsts.CROSS_REF_TYPE_TERMINATOR);
		var refTypeText = parts[0].trim();
		var refType = (refTypeText.toUpperCase() === 'STRUCTURE')? Jcamp.CrossRefType.STRUCTURE: Jcamp.CrossRefType.SPECTRUM;
		var blockPart = parts[1] && parts[1].trim();
		var blockId;
		if (blockPart && blockPart.toUpperCase().indexOf('BLOCK') >= 0)  // here we check just word block, since the total key may be 'BLOCK_ID', 'BLOCK ID'...
		{
			var blockId = blockPart.split(JcampConsts.DATA_LABEL_TERMINATOR)[1];
			if (blockId)
				blockId = blockId.trim();
		}
		var result = {'refType': refType, 'refTypeText': refTypeText, 'blockId': blockId};
		return result;
	},

	/**
	 * Add molecule to the {@link Kekule.Spectroscopy.Spectrum.refMolecules}.
	 * @param {Kekule.Spectroscopy.Spectrum} spectrum
	 * @param {Kekule.StructureFragment} molecule
	 */
	addMoleculeSpectrumCrossRef: function(spectrum, molecule)
	{
		var refMols = spectrum.getRefMolecules() || [];
		if (refMols.indexOf(molecule) < 0)
		{
			refMols.push(molecule);
			spectrum.setRefMolecules(refMols);
		}
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
		if (char === JcampConsts.VALUE_ABNORMAL_NUM)
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
	 * Encode an array of integes into ASDF format.
	 * @param {Array} numbers
	 * @param {String} format Compression format.
	 * @returns {String}
	 */
	encodeAsdfLine: function(numbers, format)
	{
		var F = Kekule.IO.Jcamp.AsdfForm;
		if (format === F.AFFN)
			return JcampUtils._encodeNumbersToAffnLine(numbers);
		else if (format === F.PAC)
			return JcampUtils._encodeNumbersToPacLine(numbers);
		else if (format === F.SQZ)
			return JcampUtils._encodeNumbersToSqzLine(numbers, false);
		else if (format === F.SQZ_DUP)
			return JcampUtils._encodeNumbersToSqzLine(numbers, true);
		else if (format === F.DIF)
			return JcampUtils._encodeNumbersToDifLine(numbers, false);
		else if (format === F.DIF_DUP)
			return JcampUtils._encodeNumbersToDifLine(numbers, true);
		else  // default
			return JcampUtils._encodeNumbersToDifLine(numbers, true);
	},
	/** @private */
	_encodeNumbersToAffnLine: function(numbers)
	{
		var seq = [];
		for (var i = 0, l = numbers.length; i < l; ++i)
		{
			var n = numbers[i];
			var s = (Kekule.NumUtils.isNormalNumber(n))? n.toString(): JcampConsts.VALUE_ABNORMAL_NUM;
			seq.push(s);
		}
		return seq.join(' ');
	},
	/** @private */
	_encodeNumbersToPacLine: function(numbers)
	{
		var strs = [];
		for (var i = 0, l = numbers.length; i < l; ++i)
		{
			var s;
			var n = numbers[i];
			if (Kekule.NumUtils.isNormalNumber(n))
			{
				var sign = (n >= 0)? '+': '-';
				s = sign + Math.abs(n).toString();
			}
			else
				s = JcampConsts.VALUE_ABNORMAL_NUM;
			strs.push(s);
		}
		return strs.join('');
	},
	/** @private */
	_encodeNumbersToSqzLine: function(numbers, enableDup)
	{
		return JcampUtils._numSeqToCompressedFormString(numbers, 'A', 'a', '@', enableDup);
	},
	/** @private */
	_encodeNumbersToDifLine: function(numbers, enableDup)
	{
		/*
		var sHead = JcampUtils._encodeNumbersToSqzLine([numbers[0]]);  // the first number should always be in SQZ form
		var difSeq = [];
		var last = 0;
		for (var i = 0, l = numbers.length; i < l; ++i)
		{
			var n = numbers[i];
			if (Kekule.NumUtils.isNormalNumber(n))
			{
				var dif = numbers[i] - last;
				difSeq.push(dif);
				last = n;
			}
			else
			{
				difSeq.push(n);
				last = 0;
			}
		}
		var result = sHead + JcampUtils._numSeqToCompressedFormString(difSeq, 'J', 'j', '%', enableDup);
		return result;
		*/
		// we need to split the numbers to several sub sequences, at the heading and when meeting the abnormal number,
		// a new seq should be created and starting with a SQZ number
		var subsets = [];
		var currSet = {'seq': []};
		subsets.push(currSet);
		var pushToCurrSet = function(num)
		{
			var isNormalNum = Kekule.NumUtils.isNormalNumber(num);
			if (!isNormalNum)
			{
				if (Kekule.ObjUtils.isUnset(currSet.head))
					currSet.head = num;
				else
					currSet.seq.push(num);
				currSet = {'seq': []};  // create new set
				subsets.push(currSet);
			}
			else  // is normal number
			{
				if (Kekule.ObjUtils.isUnset(currSet.head))
				{
					currSet.head = num;
				}
				else
				{
					currSet.seq.push(num - currSet.last);
				}
				currSet.last = num;
			}
		}
		for (var i = 0, l = numbers.length; i < l; ++i)
		{
			var n = numbers[i];
			pushToCurrSet(n);
		}
		// iterate subsets
		var strs = [];
		for (var i = 0, l = subsets.length; i < l; ++i)
		{
			var subset = subsets[i];
			if (Kekule.ObjUtils.notUnset(subset.head))  // subset not empty
			{
				strs.push(JcampUtils._encodeNumbersToSqzLine([subset.head]));
				if (subset.seq.length)
					strs.push(JcampUtils._numSeqToCompressedFormString(subset.seq, 'J', 'j', '%', enableDup));
			}
		}
		return strs.join('');
	},
	/** @private */
	_numToCompressedFormString: function(number, positiveBase, negativeBase, zeroBase)
	{
		// assume number is a int
		if (!Kekule.NumUtils.isNormalNumber(number))
			return JcampConsts.VALUE_ABNORMAL_NUM;
		else if (number === 0)
			return zeroBase;
		var s = Math.abs(number).toString();
		var firstDigit = Kekule.NumUtils.getHeadingDigit(number);
		var sFirst = (number > 0)? String.fromCharCode(positiveBase.charCodeAt(0) + (firstDigit - 1)):
			String.fromCharCode(negativeBase.charCodeAt(0) + (firstDigit - 1));
		s = sFirst + s.substr(1);
		return s;
	},
	/** @private */
	_numSeqToCompressedFormString: function(numSeq, positiveBase, negativeBase, zeroBase, enableDup)
	{
		var seq = [];
		var lastNum;
		var dupCount = 0;
		var dupChars = ['S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 's'];  // The dup 1 (S) is actually useless
		for (var i = 0, l = numSeq.length; i < l; ++i)
		{
			var dupHandled = false;
			var n = numSeq[i];
			if (enableDup)
			{
				if (n === lastNum)  // NaN !== NaN
				{
					++dupCount;
					dupHandled = true;
				}
				else
				{
					if (dupCount)  // output last dup
					{
						seq.push(dupChars[dupCount]);
						dupCount = 0;
					}
				}
			}
			if (!dupHandled)  // output the normal number
			{
				var s = JcampUtils._numToCompressedFormString(n, positiveBase, negativeBase, zeroBase);
				seq.push(s);
			}
			lastNum = n;
		}
		if (enableDup && dupCount)
			seq.push(dupChars[dupCount]);
		return seq.join('');
	},
	/**
	 * Parse a AFFN or ASDF table, returns array of number groups ([[a,b,c], [e,f,g]]).
	 * @param {Array} strLines
	 * @param {Hash} options Additional options for value check.
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
		var lineCount = strLines.length;

		var appendDecodedBufferToResult = function(result, buffer, doAbscissaValueCheck, doOrdinateValueCheck, prevEndWithDif, totalLineCount)
		{
			//if (doOrdinateValueCheck)
			if (prevEndWithDif)  // prev line end with DIF form, next line should has a duplicated value check item
			{
				var lastValues = result[result.length - 1];
				//console.log('lastValues', lastValues, result);
				if (lastValues && lastValues.length)
				{
					if (doOrdinateValueCheck)
					{
						// check the last value of prev line and first ordinate value of this line
						var prevEndOrdinateValue = lastValues[lastValues.length - 1];
						var currHeadOrdinateValue = buffer[1];
						//console.log(doOrdinateValueCheck, prevEndOrdinateValue, currHeadOrdinateValue);
						if ((typeof (prevEndOrdinateValue) === 'number' && Kekule.ObjUtils.notUnset(prevEndOrdinateValue))
							&& (typeof (currHeadOrdinateValue) === 'number' && Kekule.ObjUtils.notUnset(currHeadOrdinateValue)))
						{
							if (!Kekule.NumUtils.isFloatEqual(prevEndOrdinateValue, currHeadOrdinateValue))
								Kekule.error(Kekule.$L('ErrorMsg.JCAMP_DATA_TABLE_Y_VALUE_CHECK_ERROR'));
							else  // check passed, remove the tailing check value of previous line, not the heading Y value of this line!
							{
								lastValues.pop();
							}
						}
					}
					else // bypass the check, but still remove the duplicated ordinate value
					{
						lastValues.pop();
					}
				}
			}
			if (doAbscissaValueCheck)
				checkAbscissaInterval(buffer, result[result.length - 1], totalLineCount);
			/*
			if (result[result.length - 1])
				console.log('push buffer', result[result.length - 1], (buffer[0] - result[result.length - 1][0]) / (result[result.length - 1].length - 1));
			*/
			result.push(buffer);
		}
		var checkAbscissaInterval = function(currGroup, prevGroup, lineCount)
		{
			if (currGroup && prevGroup)
			{
				var curr = currGroup[0];
				var prev = prevGroup[0];
				var currInterval = (curr - prev) / (prevGroup.length - 1);  // the first item in prevGroup is X, so here we use length-1
				// console.log('prev interval', abscissaInterval, 'curr', currInterval);
				if (abscissaInterval)
				{
					var abscissaRange = Math.min(Math.abs(currInterval), Math.abs(abscissaInterval)) * (lineCount || 1);
					var allowedError = abscissaRange * (Kekule.globalOptions.IO.jcamp.dataValueCheckAllowedErrorRatio || 0.0001);
					//if (!Kekule.NumUtils.isFloatEqual(currInterval, abscissaInterval, allowedError))
					if (JcampUtils.compareFloat(currInterval, abscissaInterval, allowedError) !== 0)
					{
						console.log('X check error', currInterval, abscissaInterval, allowedError);
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
				appendDecodedBufferToResult(result, buffer, op.doValueCheck, op.doValueCheck && prevEndWithDif, prevEndWithDif, lineCount);
				buffer = [];
			}
			prevEndWithDif = decodeValues.__$lastValueType__ === JcampDigitType.DIF;  // if prev line ends with DIF, may need to do a value check on next line
		}
		if (buffer.length)    // last unhandled buffer
			appendDecodedBufferToResult(result, buffer, op.doValueCheck, op.doValueCheck && prevEndWithDif, prevEndWithDif, lineCount);
		return result;
	},

	/**
	 * Encode a AFFN or ASDF table, returns array of strings ([line1, line2]).
	 * @param {Array} numLines Each item is a line of numbers.
	 * @param {Int} asdfForm
	 * @param {Hash} options Additional options for encode. Can include fields: {abscissaFirst}
	 * @returns {Array}
	 */
	encodeAsdfTableLines: function(numLines, asdfForm, options)
	{
		var op = options || {};
		var result = [];
		for (var i = 0, l = numLines.length; i < l; ++i)
		{
			var numbers = numLines[i];
			var numSeq;
			var s = '';
			if (numbers.length)
			{
				if (op.abscissaFirst)  // the first number is abscissa value while the rest are ordinates
				{
					s += JcampUtils._encodeNumbersToAffnLine([numbers[0]]) + ' ';  // the first is always be AFFN
					numSeq = numbers.slice(1);
				}
				else
					numSeq = numbers;
				s += JcampUtils.encodeAsdfLine(numSeq, asdfForm);
			}
			result.push(s);
		}
		//console.log('encode', numLines, result);
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
					c.match(JcampConsts.GROUPED_VALUE_GROUP_DELIMITER_PATTERN)? (insideExplicitGroup? CharTypes.ITEM_DELIMITER: CharTypes.GROUP_DELIMITER):
					c.match(JcampConsts.GROUPED_VALUE_ITEM_DELIMITER_PATTERN)? CharTypes.ITEM_DELIMITER:
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
	 * Encode a line of data string for XYPOINTS/PEAK TABLE LDR.
	 * Usually the values are numbers, but it may contain strings too.
	 * @param {Array} values
	 * @param {Hash} options;
	 * @returns {String}
	 */
	encodeAffnGroupLine: function(values, options)
	{
		var parts = [];
		for (var i = 0, l = values.length; i < l; ++i)
		{
			var v = values[i];
			var sv;
			if (typeof(v) === 'number')
				sv = Kekule.NumUtils.isNormalNumber(v)? v.toString(): JcampConsts.VALUE_ABNORMAL_NUM;
			else   // a string value
				sv = JcampConsts.GROUPED_VALUE_STR_ENCLOSER_LEADING + v.toString() + JcampConsts.GROUPED_VALUE_STR_ENCLOSER_TAILING;
			parts.push(sv);
		}
		return parts.join(JcampConsts.GROUPED_VALUE_ITEM_DELIMITER);
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
	 * Encode strings from value groups for XYPOINTS/PEAK TABLE LDR.
	 * @param {Array} valueGroups Each item is a child array of individual values.
	 * @param {Hash} options;
	 * @returns {Array}
	 */
	encodeAffnGroupTableLines: function(valueGroups, options)
	{
		var result = [];
		for (var i = 0, l = valueGroups.length; i < l; ++i)
		{
			var group = valueGroups[i];
			var s = JcampUtils.encodeAffnGroupLine(group, options);
			if (options && options.explicitlyEnclosed)
				s = JcampConsts.GROUPED_VALUE_EXPLICIT_GROUP_LEADING + s + JcampConsts.GROUPED_VALUE_EXPLICIT_GROUP_TAILING;
			result.push(s);
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
						return (vars.length <= 2)?
							{'format': JcampConsts.DATA_VARLIST_FORMAT_XYPOINTS, 'vars': vars}:
							{'format': JcampConsts.DATA_VARLIST_FORMAT_XYWPOINTS, 'vars': vars};
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
	 * Generate a data table format string from format and var symbols.
	 * @param {Int} format
	 * @param {Array} varSymbols
	 * @returns {String} Format string such as (X++(Y..Y)), (XY..XY), etc.
	 */
	generateDataTableFormatDescriptor: function(format, varSymbols)
	{
		if (format === JcampConsts.DATA_VARLIST_FORMAT_XYDATA)
		{
			return (JcampConsts.DATA_FORMAT_GROUP_LEADING + '{0}++' + JcampConsts.DATA_FORMAT_GROUP_LEADING +
				'{1}' + JcampConsts.DATA_FORMAT_LOOP + '{1}' + JcampConsts.DATA_FORMAT_GROUP_TAILING + JcampConsts.DATA_FORMAT_GROUP_TAILING).format(varSymbols[0], varSymbols[1]);
		}
		else if (format === JcampConsts.DATA_VARLIST_FORMAT_XYPOINTS || format === JcampConsts.DATA_VARLIST_FORMAT_XYWPOINTS)
		{
			var varListTemplateParts = [];
			for (var i = 0, l = varSymbols.length; i < l; ++i)
			{
				varListTemplateParts.push('{' + i + '}');
			}
			var varListTemplate = varListTemplateParts.join('');
			var template = JcampConsts.DATA_FORMAT_GROUP_LEADING + varListTemplate + JcampConsts.DATA_FORMAT_LOOP + varListTemplate + JcampConsts.DATA_FORMAT_GROUP_TAILING;
			return template.format.apply(template, varSymbols);
		}
		else if (format === JcampConsts.DATA_VARLIST_FORMAT_VAR_GROUPS)
		{
			return JcampConsts.DATA_FORMAT_GROUP_LEADING + varSymbols.join('') + JcampConsts.DATA_FORMAT_GROUP_TAILING;
		}
		else
			return '';
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
	/**
	 * Generate a data table format string and plot string from format and var symbols.
	 * @param {Int} format
	 * @param {Array} varSymbols
	 * @returns {Hash} Such as {format: '(X++(Y..Y))', plot: 'XYDATA'}.
	 */
	generateDataTableFormatAndPlotDescriptors: function(format, varSymbols)
	{
		var sFormat = JcampUtils.generateDataTableFormatDescriptor(format, varSymbols);
		var sPlot;
		if (format === JcampConsts.DATA_VARLIST_FORMAT_XYDATA)
			sPlot = 'XYDATA';
		else if (format === JcampConsts.DATA_VARLIST_FORMAT_XYPOINTS)
			sPlot = 'XYPOINTS';
		else if (format === JcampConsts.DATA_VARLIST_FORMAT_VAR_GROUPS)
		{
			if (varSymbols.length <= 2)
				sPlot = 'PEAK TABLE';
			else
				sPlot = 'PEAK ASSIGNMENTS'
		}
		return {'format': sFormat, 'plot': sPlot};
	},
	/**
	 * Generate a data table format string and plot from format and var symbols.
	 * @param {Int} format
	 * @param {Array} varSymbols
	 * @returns {String} Format string such as (X++(Y..Y)), XYDATA ; (XY..XY), XYPOINTS etc.
	 */
	generateDataTableFormatAndPlotString: function(format, varSymbols)
	{
		var details = JcampUtils.generateDataTableFormatAndPlotDescriptors(format, varSymbols);
		return details.format + JcampConsts.DATA_FORMAT_PLOT_DESCRIPTOR_DELIMITER + details.plot;
	}
};
var JcampUtils = Kekule.IO.Jcamp.Utils;

Kekule.IO.Jcamp.BlockUtils = {
	// methods about JCAMP block object from analysis tree
	/**
	 * Create a new JCAMP block object.
	 * @param {Object} parent Parent block.
	 * @returns {Object}
	 */
	createBlock: function(parent)
	{
		return {'blocks': [], 'ldrs': [], 'ldrIndexes': {}, '_parent': parent}
	},
	/** @private */
	setBlockParent: function(block, parent)
	{
		block._parent = parent;
		return block;
	},
	/**
	 * Returns the index of label in block.
	 * @param {String} labelName
	 * @param {Object} block
	 * @returns {Int}
	 */
	getLabelIndex: function(labelName, block)
	{
		return block.ldrIndexes[labelName] || -1;
	},
	/**
	 * Get the LDR object at index of block.
	 * @param {Int} index
	 * @param {Object} block
	 * @returns {Object}
	 */
	getLdrAt: function(index, block)
	{
		return block.ldrs[index];
	},
	/**
	 * Add a ldr record to JCAMP block.
	 * @param {Object} block
	 * @param {Object} ldrObj Should has fields {labelName, valueLines}.
	 */
	addLdrToBlock: function(block, ldrObj)
	{
		block.ldrs.push(ldrObj);
		block.ldrIndexes[ldrObj.labelName] = block.ldrs.length - 1;
	},
	/**
	 * Returns the nested level of a JCAMP analysis tree.
	 * @param {Object} analysisTree
	 * @returns {Int}
	 */
	getNestedBlockLevelCount: function(analysisTree)
	{
		var result = 1;
		var blocks = analysisTree.blocks;
		if (blocks && blocks.length)
		{
			var maxSubBlockLevelCount = 0;
			for (var i = 0, l = blocks.length; i < l; ++i)
			{
				var c = JcampBlockUtils.getNestedBlockLevelCount(blocks[i]);
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
	 */
	getBlockLdr: function(block, labelName)
	{
		var index = block.ldrIndexes[labelName];
		return (index >= 0)? block.ldrs[index]: null;
	},
	/**
	 * Returns the meta info (type, format...) of a block.
	 * @param {Object} block
	 * @returns {Hash}
	 */
	getBlockMeta: function(block)
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

var JcampBlockUtils = Kekule.IO.Jcamp.BlockUtils;

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
	else if (labelType === JLabelType.PRIVATE && !name.startsWith(JcampConsts.PRIVATE_LABEL_PREFIX))
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
	['JCAMPDX', JValueType.STRING, null, JLabelCategory.ANNOTATION],    // JCAMP-DX version
	['JCAMPCX', JValueType.STRING, null, JLabelCategory.ANNOTATION],    // JCAMP-CX version
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


Kekule.IO.Jcamp.LdrValueParserCoder = {
	/** @private */
	_parserFuncs: {
		byLabelName: {},
		byDataType: {}
	},
	/** @private */
	_coderFuncs: {
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
	 * Register a coder function for LDR, based on labelName or dataType.
	 * @param {String} labelName
	 * @param {Int} dataType
	 * @param {Function} func
	 */
	registerCoder: function(labelName, dataType, func)
	{
		if (labelName)
			JcampLdrValueParser._coderFuncs.byLabelName[JcampUtils.standardizeLdrLabelName(labelName)] = func;
		else if (dataType)
			JcampLdrValueParser._coderFuncs.byDataType[dataType] = func;
	},
	/**
	 * Returns the suitable coder function for a LDR.
	 * @param {String} ldrLabelName
	 * @returns {Func}
	 */
	getCoderFunc: function(ldrLabelName)
	{
		var labelName = Jcamp.Utils.standardizeLdrLabelName(ldrLabelName);
		var result = JcampLdrValueParser._coderFuncs.byLabelName[labelName];
		if (!result)
		{
			var valueType = JcampLabelTypeInfos.getType(labelName);
			result = JcampLdrValueParser._coderFuncs.byDataType[valueType];
		}
		if (!result)
			result = JcampLdrValueParser._coderFuncs['_default'];
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

	/**
	 * Encode jsValue to the LDR value lines.
	 * @param {String} labelName
	 * @param {Variant} jsValue
	 * @param {Hash} options
	 * @returns {Array} Array of strings.
	 */
	encodeValue: function(labelName, jsValue, options)
	{
		var func = JcampLdrValueParser.getCoderFunc(labelName);
		var result = func(jsValue, options);
		return Kekule.ArrayUtils.toArray(result);
	},

	/** @private */
	stringParser: function(lines, options)
	{
		return lines.join('\n');
	},
	/** @private */
	stringCoder: function(value, options)
	{
		return value.toString().split('\n');
	},
	/** @private */
	affnParser: function(lines, options)  // parse to a simple number value
	{
		var text = JcampUtils.getFirstNonemptyLine(lines);
		var result = parseFloat(text);
		return (Kekule.NumUtils.isNormalNumber(result))? result: NaN;
	},
	/** @private */
	affnCoder: function(value, options)
	{
		return (Kekule.NumUtils.isNormalNumber(value))? value.toString(): JcampConsts.VALUE_ABNORMAL_NUM;
	},
	/** @private */
	asdfParser: function(lines, options)
	{
		var text = JcampUtils.getFirstNonemptyLine(lines);
		var vs = JcampUtils.decodeAsdfLine(text);
		return vs && vs[0];
	},
	/** @private */
	asdfCoder: function(value, options)
	{
		Kekule.error('not implemented yet');
	},
	/** @private */
	shortDateParser: function(lines, options)
	{
		var text = JcampUtils.getFirstNonemptyLine(lines);
		var parts = text.split('/');
		return {'year': parseInt(parts[0]) || 0, 'month': parseInt(parts[1]) || 0, 'day': parseInt(parts[2]) || 0};
	},
	/** @private */
	shortTimeParser: function(lines, options)
	{
		var text = JcampUtils.getFirstNonemptyLine(lines);
		var parts = text.split(':');
		return {'hour': parseInt(parts[0]) || 0, 'minute': parseInt(parts[1]) || 0, 'second': parseInt(parts[2]) || 0};
	},
	/** @private */
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
	/** @private */
	longDateCoder: function (value, options)
	{
		// value should be a Date
		var year = value.getFullYear();
		var month = value.getMonth() + 1;
		var date = value.getDate();
		var hour = value.getHours();
		var minute = value.getMinutes();
		var second = value.getSeconds();
		var millisecond = value.getMilliseconds();
		// YYYY/MM/DD [HH:MM:SS[.SSSS] [±UUUU]] , e.g. 1998/08/12 23:18:02.0000 -0500
		var result = [year.toString().lpad(4, '0'), month.toString().lpad(2, '0'), date.toString().lpad(2, '0')].join('/') + ' '
			+ [hour.toString().lpad(2, '0'), minute.toString().lpad(2, '0'), second.toString().lpad(2, '0')].join(':');
		if (millisecond)
			result += '.'	+ millisecond.toString().lpad(4, '0');
		return result;
	},
	/** @private */
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
	/** @private */
	stringGroupCoder: function(value, options)
	{
		// value should be an array
		var vs = Kekule.ArrayUtils.toArray(value);
		var isStringItem = false;
		for (var i = 0, l = vs.length; i < l; ++i)
		{
			if (typeof(vs[i]) === 'string')
			{
				isStringItem = true;
				break;
			}
		}
		var strs = [];
		var strCoder = Jcamp.LdrValueParserCoder.stringCoder;
		for (var i = 0, l = vs.length; i < l; ++i)
		{
			var s = strCoder(vs[i], options);
			if (isStringItem)
				s = JcampConsts.VALUE_STR_EXPLICIT_QUOTE + s + JcampConsts.VALUE_STR_EXPLICIT_QUOTE;
			strs.push(s)
		}
		return strs.join(JcampConsts.SIMPLE_VALUE_DELIMITER);
	},
	/** @private */
	simpleAffnGroupParser: function(lines, options)
	{
		var v = lines.join(' ');
		var result = v.split(JcampConsts.SIMPLE_VALUE_DELIMITER);
		for (var i = 0, l = result.length; i < l; ++i)
		{
			result[i] = parseFloat(result[i].trim());
		}
		return result;
	},
	/** @private */
	simpleAffnGroupCoder: function(value, options)
	{
		// value should be an array
		var vs = Kekule.ArrayUtils.toArray(value);
		return vs.join(JcampConsts.SIMPLE_VALUE_DELIMITER);
	},

	/** @private */
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
	/** @private */
	xyDataTableCoder: function(numLines, options)
	{
		var result = [options.dataFormat];  // ['(X++(Y..Y))'];
		result = result.concat(JcampUtils.encodeAsdfTableLines(numLines, options.asdfForm, options));
		return result;
	},

	/** @private */
	groupedDataTableParser: function(lines, options)
	{
		var result = {
			'format': lines[0],
			'formatDetail': Jcamp.Utils.getDataTableFormatAndPlotDetails(lines[0]),
			'values': JcampUtils.decodeAffnGroupTableLines(lines.slice(1), options)
		};
		return result;
	},
	/** @private */
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
	},

	/** @private */
	molecularFormulaParser: function(lines, options)
	{
		var formula;
		var formulaText = lines[0].trim();
		if (formulaText && Kekule.MolecularFormula)
		{
			// actually, the formula text can be used directly in Kekule.js, just need to replace the sub/sup prefixes
			formulaText = formulaText.replace(new RegExp(Jcamp.Consts.MOL_FORMULA_SUP_PREFIX, 'g'), ' ');
			formulaText = formulaText.replace(new RegExp(Jcamp.Consts.MOL_FORMULA_SUB_PREFIX, 'g'), '');
			formula = Kekule.FormulaUtils.textToFormula(formulaText);
		}
		return formula || formulaText;
	},
	/** @private */
	molecularFormulaCoder: function(value, options)
	{
		if (Kekule.MolecularFormula && value instanceof Kekule.MolecularFormula)  // value is formula
		{
			var sections = AU.clone(value.getSections());
			// sort
			var getSortIndexes = function(formulaSection)
			{
				var primary = 'ZZZZZ', secondary = 0;
				var atom = formulaSection.obj;
				if (atom)
				{
					if (atom.getSymbol)
						primary = atom.getSymbol();
					// C/H will be put to head of seq
					if (primary === 'C')
						primary = '0';
					else if (primary === 'H')
						primary = '1';
					if (atom.getMassNumber)
						secondary = atom.getMassNumber() || 0;
				}
				return [primary, secondary];
			};
			sections.sort(function(sec1, sec2){
				var i1 = getSortIndexes(sec1);
				var i2 = getSortIndexes(sec2);
				return AU.compare(i1, i2);
			});

			var outputItems = [];
			for (var i = 0, l = sections.length; i < l; ++i)
			{
				var sec = sections[i];
				var atom = sec.obj;
				var count = sec.count;
				var symbol = atom.getLabel && atom.getLabel();
				if (atom.getMassNumber && atom.getMassNumber())
					symbol = Jcamp.Consts.MOL_FORMULA_SUP_PREFIX + symbol;
				if (count > 1)
					symbol += count;
				outputItems.push(symbol);
			}
			var valueLine = outputItems.join(' ');
			return [valueLine];
		}
		else   // value is simple string
			return [value];
	}
}
var JcampLdrValueParser = Kekule.IO.Jcamp.LdrValueParserCoder;
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
JcampLdrValueParser.registerParser('MOLFORM', null, JcampLdrValueParser.molecularFormulaParser);
JcampLdrValueParser.registerCoder(null, JValueType.AFFN, JcampLdrValueParser.affnCoder);
JcampLdrValueParser.registerCoder(null, JValueType.ASDF, JcampLdrValueParser.asdfCoder);
JcampLdrValueParser.registerCoder(null, JValueType.STRING, JcampLdrValueParser.stringCoder);
JcampLdrValueParser.registerCoder(null, JValueType.DATETIME, JcampLdrValueParser.longDateCoder);
JcampLdrValueParser.registerCoder(null, JValueType.STRING_GROUP, JcampLdrValueParser.stringGroupCoder);
JcampLdrValueParser.registerCoder(null, JValueType.SIMPLE_AFFN_GROUP, JcampLdrValueParser.simpleAffnGroupCoder);
JcampLdrValueParser.registerCoder('MOLFORM', null, JcampLdrValueParser.molecularFormulaCoder);


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
		if (index >= 0)
			jcampBlockReaderManager._readerClasses.splice(index, 1);
	},
	getReaderClass: function(blockType, blockFormat)
	{
		var index = jcampBlockReaderManager._findRegisteredItemIndex(blockType, blockFormat, null, true);
		return (index >= 0)? jcampBlockReaderManager._readerClasses[index].readerClass: null;
	}
};

/**
 * The manager to store and create suitable JCAMP block writer for different types of chem objects.
 * @class
 * @private
 */
Kekule.IO.Jcamp.BlockWriterManager = {
	/** @private */
	'_writerClasses': [],
	/** @private */
	_findRegisteredItemIndex: function(chemObjClass, writerClass)
	{
		var iu = Kekule.ObjUtils.isUnset;
		var ws = jcampBlockWriterManager._writerClasses;
		for (var i = ws.length - 1; i >= 0; --i)
		{
			var item = ws[i];
			if ((iu(chemObjClass) || ClassEx.isOrIsDescendantOf(chemObjClass, item.objClass))
				&& (iu(writerClass) || writerClass === item.writerClass))
				return i;
		}
		return -1;
	},
	register: function(chemObjClass, writerClass)
	{
		if (jcampBlockWriterManager._findRegisteredItemIndex(chemObjClass, writerClass) < 0)
			jcampBlockWriterManager._writerClasses.push({'objClass': chemObjClass, 'writerClass': writerClass});
	},
	unregister: function(chemObjClass, writerClass)
	{
		var index = jcampBlockWriterManager._findRegisteredItemIndex(chemObjClass, writerClass);
		if (index >= 0)
			jcampBlockWriterManager._writerClasses.splice(index, 1);
	},
	getWriterClass: function(chemObjOrClass)
	{
		var objClass = (DataType.isObjectExValue(chemObjOrClass))? chemObjOrClass.getClass(): chemObjOrClass;
		var index = jcampBlockWriterManager._findRegisteredItemIndex(objClass, null);
		return (index >= 0)? jcampBlockWriterManager._writerClasses[index].writerClass: null;
	}
};
var jcampBlockReaderManager = Kekule.IO.Jcamp.BlockReaderManager;
var jcampBlockWriterManager = Kekule.IO.Jcamp.BlockWriterManager;

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
		// Each functions has params (ldr, block, targetChemObj, preferredInfoPropName)
		this.defineProp('ldrHandlerMap', {'dataType': DataType.HASH, 'setter': false, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});
		// storing current block id
		this.defineProp('blockId', {'dataType': DataType.STRING, 'setter': false, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});

		this.defineProp('currOptions', {'dataType': DataType.HASH, 'setter': false, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});
		this.defineProp('parentReader', {'dataType': DataType.OBJECT, 'serializable': false, 'scope': Class.PropertyScope.PUBLIC});
		this.defineProp('rootReader', {'dataType': DataType.OBJECT, 'serializable': false, 'scope': Class.PropertyScope.PUBLIC,
			'setter': null,
			'getter': function()
			{
				var p = this.getParentReader();
				if (p)
					return p.getRootReader? p.getRootReader(): p;
				else
					return this;
			}
		});
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
		//map[JcampConsts.LABEL_BLOCK_BEGIN] = this.doStoreLdrToChemObjInfoProp.bind(this, JcampConsts.LABEL_BLOCK_BEGIN);  // TITLE
		map[JcampConsts.LABEL_BLOCK_BEGIN] = this.doStoreTitleLdr.bind(this);  // TITLE
		map[JcampConsts.LABEL_DX_VERSION] = this.doStoreLdrToChemObjInfoProp.bind(this, JcampConsts.LABEL_DX_VERSION);  // JCAMP-DX
		map[JcampConsts.LABEL_CS_VERSION] = this.doStoreLdrToChemObjInfoProp.bind(this, JcampConsts.LABEL_CS_VERSION);  // JCAMP-CS
		//map[JcampConsts.LABEL_BLOCK_ID] = this.doStoreBlockIdLdr.bind(this);   // BLOCK_ID // no longer needed, as we will store the ID at the beginning of read process
		map[JcampConsts.LABEL_BLOCK_END] = this._ignoreLdrHandler;  // block end, need not to store value of this ldr
		var doStoreDateTimeLdrBind = this.doStoreDateTimeLdr.bind(this);
		map['DATE'] = doStoreDateTimeLdrBind;
		map['TIME'] = doStoreDateTimeLdrBind;
		map['LONGDATE'] = doStoreDateTimeLdrBind;
		map[JcampConsts.LABEL_CROSS_REF] = this.doStoreCrossRefLdr.bind(this);
		return map;
	},
	/** @private */
	_defaultLdrHandler: function(ldr, block, targetChemObj, preferredInfoPropName)
	{
		return this.saveLdrValueToChemObjInfoProp(ldr.labelName, JcampLdrValueParser.parseValue(ldr), targetChemObj, preferredInfoPropName);
	},
	/** @private */
	_ignoreLdrHandler: function(ldr, block, targetChemObj, preferredInfoPropName)
	{
		// bypass this ldr
	},

	/** @private */
	_getBlockMeta: function(block)
	{
		return JcampBlockUtils.getBlockMeta(block);
	},

	/**
	 * Add a map item of blockId-chemObject.
	 * @param {String} blockId
	 * @param {Kekule.ChemObject} chemObj
	 */
	setObjWithBlockId: function(blockId, chemObj)
	{
		var rootReader = this.getRootReader();
		if (rootReader && rootReader.setObjWithBlockId)
			rootReader.setObjWithBlockId(blockId, chemObj);
	},
	/**
	 * Retrieve a chem object from block id in map.
	 * @param {String} blockId
	 * @returns {Kekule.ChemObject}
	 */
	getObjFromBlockId: function(blockId)
	{
		var rootReader = this.getRootReader();
		if (rootReader && rootReader.getObjFromBlockId)
			return rootReader.getObjFromBlockId(blockId);
		else
			return null;
	},
	/**
	 * Add a new cross reference item that need to be handled later.
	 * @param {String} targetBlockId
	 * @param {Int} refType
	 * @param {String} refTypeText
	 */
	addCrossRef: function(targetBlockId, refType, refTypeText)
	{
		var rootReader = this.getRootReader();
		if (rootReader && rootReader.addCrossRefItem)
			rootReader.addCrossRefItem(this, this.getBlockId(), targetBlockId, refType, refTypeText);
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
	saveLdrValueToChemObjInfoProp: function(ldrName, ldrValue, chemObj, preferredInfoPropName)
	{
		var params = this.getLdrStorageParamsForInfoField(ldrName, chemObj);
		//var fname = params.fullName;
		var fname = preferredInfoPropName;
		var category = params.labelCategory;
		var saveMethod;

		//console.log(ldrName, fname, category);
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
	doStoreTitleLdr: function(ldr, block, chemObj, preferredInfoPropName)
	{
		chemObj.setInfoValue('title', Jcamp.LdrValueParserCoder.parseValue(ldr));
	},
	/* @private */
	/*
	doStoreBlockIdLdr: function(ldr, block, chemObj, preferredInfoPropName)
	{
		this.setPropStoreFieldValue('blockId', Jcamp.LdrValueParserCoder.parseValue(ldr));
	},
	*/
	/** @private */
	doStoreCrossRefLdr: function(ldr, block, chemObj, preferredInfoPropName)
	{
		var value = Jcamp.LdrValueParserCoder.parseValue(ldr);
		var detail = Jcamp.Utils.getCrossReferenceDetail(value);
		if (detail.blockId)  // ref to another block, and the block may be not read yet, we must store the reference and handle later
		{
			this.addCrossRef(detail.blockId, detail.refType, detail.refTypeText);
		}
	},
	/** @private */
	doStoreLdrToChemObjInfoProp: function(name, ldr, block, chemObj, preferredInfoPropName)
	{
		var ldrValue = JcampLdrValueParser.parseValue(ldr);
		//chemObj.setInfoValue(infoFieldName, ldrValue);
		this.saveLdrValueToChemObjInfoProp(name, ldrValue, chemObj, preferredInfoPropName);
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
	doStoreDateTimeLdr: function(ldr, block, chemObj, preferredInfoPropName)
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
			var timeLdr = JcampBlockUtils.getBlockLdr(block, 'TIME');
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
			this.saveLdrValueToChemObjInfoProp(fieldName, infoFieldValue, chemObj, fieldName);
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
		var spectrumType = chemObj && chemObj.getSpectrumType && chemObj.getSpectrumType();
		var preferredInfoPropName = JcampUtils.jcampLabelNameToKekule(labelName, spectrumType);
		//console.log('LDR', labelName, preferredInfoPropName);
		var handlerMap = this.getLdrHandlerMap();
		var handler = handlerMap[labelName] || handlerMap['_default'];
		if (handler)
			handler(ldr, block, chemObj, preferredInfoPropName);
	},
	/**
	 * Build the cross reference relation between src/target object.
	 * Descendants may override this method.
	 * @param {Kekule.ChemObject} srcObj
	 * @param {Kekule.ChemObject} targetObj
	 * @param {Int} refType
	 * @param {String} refTypeText
	 * @private
	 */
	doBuildCrossRef: function(srcObj, targetObj, refType, refTypeText)
	{
		// do nothing here
		//console.log('doBuildCrossRef', srcObj, targetObj, refType, refTypeText);
	},
	/**
	 * Retrieve block ID at the beginning of read prcess.
	 * @param {Hash} block
	 */
	doReadBlockId: function(block)
	{
		var ldr = Jcamp.BlockUtils.getBlockLdr(block, JcampConsts.LABEL_BLOCK_ID);
		if (ldr)
		{
			this.setPropStoreFieldValue('blockId', Jcamp.LdrValueParserCoder.parseValue(ldr));
		}
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
	 * @private
	 */
	doReadBlock: function(block, options)
	{
		this.setPropStoreFieldValue('currOptions', options || {});
		var result = this.doCreateChemObjForBlock(block);
		if (result)
		{
			this.doReadBlockId(block);  // retrieve block ID first, since other information may rely on it
			this.doSetChemObjFromBlock(block, result);
			if (this.getBlockId())
				this.setObjWithBlockId(this.getBlockId(), result);
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
/** @lends Kekule.IO.Jcamp.LinkBlockReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.Jcamp.LinkBlockReader',
	/** @private */
	initProperties: function()
	{
		this.defineProp('childReaders', {'dataType': DataType.ARRAY, 'serializable': false, 'scope': Class.PropertyScope.PUBLIC});
	},
	/** @ignore */
	doFinalize: function()
	{
		this._finalizeChildReaders();
		this.tryApplySuper('doFinalize');
	},
	/** @private */
	_finalizeChildReaders: function()
	{
		var childReaders = this.getChildReaders();
		if (childReaders)
		{
			for (var i = 0, l = childReaders.length; i < l; ++i)
			{
				childReaders[i].finalize();
			}
		}
		this.setPropStoreFieldValue('childReaders', []);
	},
	/** @ignore */
	_initLdrHandlers: function()
	{
		var map = this.tryApplySuper('_initLdrHandlers');
		map[JcampConsts.LABEL_DATA_TYPE] = this._ignoreLdrHandler;
		map[JcampConsts.LABEL_BLOCK_COUNT] = this._ignoreLdrHandler;
	},
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
			result = this.tryApplySuper('doReadBlock', [block, options]);
		}
		// handle child blocks
		this._finalizeChildReaders();  // free old child readers
		var childObjs = [];
		for (var i = 0, l = block.blocks.length; i < l; ++i)
		{
			var childBlock = block.blocks[i];
			var meta = this._getBlockMeta(childBlock);
			var readerClass = jcampBlockReaderManager.getReaderClass(meta.blockType, meta.format);
			if (readerClass)
			{
				//var reader = new readerClass();
				var reader = this._createChildReader(readerClass);
				try
				{
					var childObj = reader.doReadData(childBlock, null, null, options);    // use doReadData instead of readData, since child readers do not need to store srcInfo
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
					//reader.finalize();
					// do not finalize child reader here, since it may be used in handling cross references later
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
	/** @private */
	_createChildReader: function(readerClass)
	{
		var result = new readerClass();
		if (result)
		{
			result.setParentReader(this);
			this.getChildReaders().push(result);
		}
		return result;
	}
});
jcampBlockReaderManager.register(Jcamp.BlockType.LINK, '*', Kekule.IO.Jcamp.LinkBlockReader);  // register
jcampBlockReaderManager.register(Jcamp.BlockType.DATA, '*', Kekule.IO.Jcamp.DataBlockReader);  // register

/**
 * Base writer to write chem data to JCAMP block.
 * Concrete descendants should be implemented for different types of chem objects.
 * @class
 * @augments Kekule.IO.ChemDataWriter
 */
Kekule.IO.Jcamp.BlockWriter = Class.create(Kekule.IO.ChemDataWriter,
/** @lends Kekule.IO.Jcamp.BlockWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.Jcamp.BlockWriter',
	/** @constructs */
	initialize: function(options)
	{
		this.setPropStoreFieldValue('ldrCreatorMap', {});
		this.tryApplySuper('initialize', options);
		this._initLdrCreators();
	},
	/** @private */
	initProperties: function()
	{
		// Indicating whether a block ID ldr should be created
		//this.defineProp('needBlockIdLdr', {'dataType': DataType.BOOL, 'scope': Class.PropertyScope.PRIVATE});
		// storing current block id
		this.defineProp('blockId', {'dataType': DataType.STRING, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});
		this.defineProp('blockDataType', {'dataType': DataType.STRING, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});
		// private, a hash object. The hash key is jsName (usually cascaded property name), value is the function to create LDR.
		// ldrHandlerMap['_default'] is treated as the default creator.
		// Each functions has params (jsName, jsValue, chemObj, preferredJcampLabelName) returning a new LDR object or null.
		// The former will be saved to block.
		this.defineProp('ldrCreatorMap', {'dataType': DataType.HASH, 'setter': false, 'scope': Class.PropertyScope.PRIVATE});

		this.defineProp('parentWriter', {'dataType': DataType.OBJECT, 'serializable': false, 'scope': Class.PropertyScope.PUBLIC});
		this.defineProp('rootWriter', {'dataType': DataType.OBJECT, 'serializable': false, 'scope': Class.PropertyScope.PUBLIC,
			'setter': null,
			'getter': function()
			{
				var p = this.getParentWriter();
				if (p)
					return p.getRootWriter? p.getRootWriter(): p;
				else
					return this;
			}
		});
	},

	/**
	 * Generate a unique block id and suitable data type for this chemObj.
	 * @returns {String}
	 * @private
	 */
	assignBlockIdAndDataType: function(chemObj)
	{
		var rootWriter = this.getRootWriter();
		var id = rootWriter && rootWriter.generateUniqueBlockId();
		if (id)
		{
			this.setBlockId(id);
		}
		var dataType = this.doGetDataTypeForBlock(chemObj)
		if (dataType)
			this.setBlockDataType(dataType);
		if (chemObj)
			this.setBlockInfoForObj(chemObj, {'id': id, 'dataType': dataType});
		return id;
	},
	/**
	 * Set a chemObj-block info map.
	 * @param {Kekule.ChemObject} chemObj
	 * @param {Hash} blockInfo
	 * @private
	 */
	setBlockInfoForObj: function(chemObj, blockInfo)
	{
		var rootWriter = this.getRootWriter();
		if (rootWriter)
			rootWriter.setBlockInfoForObj(chemObj, blockInfo);
	},
	/**
	 * Retrieve the block info associated with chem object.
	 * @param {Kekule.ChemObject} chemObj
	 * @returns {Hash}
	 * @private
	 */
	getBlockInfoFromObj: function(chemObj)
	{
		var rootWriter = this.getRootWriter();
		return rootWriter && rootWriter.getBlockInfoFromObj(chemObj);
	},

	/** @private */
	getLdrCreator: function(jsName)
	{
		var map = this.getLdrCreatorMap();
		var result = map[jsName] || map['_default'];
		//console.log('get ldr creator', jsName, map[jsName]);
		return result;
	},
	/** @private */
	_initLdrCreators: function()
	{
		var map = this.getLdrCreatorMap();
		map['_default'] = this._defaultLdrCreator.bind(this);
	},
	/** @private */
	_defaultLdrCreator: function(jsName, jsValue, chemObj, preferredJcampLabelName)
	{
		/*
		var lines = Kekule.ObjUtils.notUnset(jsValue)? this._convToLdrValueLines(preferredJcampLabelName, jsValue): [];
		return {'labelName': preferredJcampLabelName, 'valueLines': lines};
		*/
		return this.createLdr(jsName, jsValue, preferredJcampLabelName);
	},
	/** @private */
	_ignoreLdrCreator: function(jcampLabelName, jsValue, chemObj, preferredJcampLabelName)
	{
		// bypass this ldr
	},
	/** @ignore */
	doWriteData: function(obj, dataType, format, options)  // returns a JCAMP block object
	{
		var op = Object.extend({}, Kekule.globalOptions.IO.jcamp);
		op = Object.extend(op, options || {});
		return this.doWriteBlock(obj, op);
	},
	/** @private */
	doWriteBlock: function(chemObj, options)
	{
		var result = JcampBlockUtils.createBlock();
		if (result)
		{
			// block begin
			var title = this.getTitleForBlock(chemObj);
			this.saveToLdrInBlock(result, chemObj,'', title, JcampConsts.LABEL_BLOCK_BEGIN);
			this.doSaveJcampVersionToBlock(chemObj, result, options);
			var dataType = this.getDataTypeForBlock(chemObj);
			if (dataType)
				this.saveToLdrInBlock(result, chemObj, '', dataType, JcampConsts.LABEL_DATA_TYPE);
			if (this.getBlockId())
				this.doSaveBlockIdToBlock(chemObj, result, options);
			this.doSaveChemObjInfoToBlock(chemObj, result, options);
			this.doSaveChemObjToBlock(chemObj, result, options);
			// block end
			this.saveToLdrInBlock(result, chemObj,'', '', JcampConsts.LABEL_BLOCK_END);
		}
		return result;
	},
	/**
	 * Returns the title that need to be write to block.
	 * Descendants should override this method.
	 * @param {Kekule.ChemObject} chemObj
	 * @returns {String}
	 */
	getTitleForBlock: function(chemObj)
	{
		return null;
	},
	/**
	 * Returns the suitable data type string of block that need to be write to block.
	 * @param {Kekule.ChemObject} chemObj
	 * @returns {String}
	 * @private
	 */
	getDataTypeForBlock: function(chemObj)
	{
		return (this.getBlockDataType()) || this.doGetDataTypeForBlock(chemObj);
	},
	/**
	 * Do concrete work of getDataTypeForBlock.
	 * Descendants should override this method.
	 * @param {Kekule.ChemObject} chemObj
	 * @returns {String}
	 * @private
	 */
	doGetDataTypeForBlock: function(chemObj)
	{
		return null;
	},
	/**
	 * Save the JCAMP-DX/CS version to block.
	 * Descendants should override this method to do the concrete job.
	 * @param {Kekule.ChemObject} chemObj
	 * @param {Object} block
	 * @param {Hash} options
	 * @private
	 */
	doSaveJcampVersionToBlock: function(chemObj, block, options)
	{
		// do nothing here
	},
	/**
	 * Create a blockId LDR to block.
	 * @param {Kekule.ChemObject} chemObj
	 * @param {Object} block
	 * @param {Hash} options
	 * @private
	 */
	doSaveBlockIdToBlock: function(chemObj, block, options)
	{
		var id = this.getBlockId();
		if (id)
		{
			this.saveToLdrInBlock(block, chemObj, '', id, JcampConsts.LABEL_BLOCK_ID);
		}
	},
	/**
	 * Save the info values of chemObj to block.
	 * Descendants should override this method to do the concrete job.
	 * @param {Kekule.ChemObject} chemObj
	 * @param {Object} block
	 * @param {Hash} options
	 * @private
	 */
	doSaveChemObjInfoToBlock: function(chemObj, block, options)
	{
		// infos
		var keys = chemObj.getInfoKeys();
		var ignoredInfoKeys = this.doGetIgnoredChemObjInfoKeys(chemObj, options);
		for (var i = 0, l = keys.length; i < l; ++i)
		{
			var key = keys[i];
			if (ignoredInfoKeys.indexOf(key) >= 0)
				continue;
			var jsValue = chemObj.getInfoValue(key);
			if (Kekule.ObjUtils.notUnset(jsValue))
			{
				this.doSaveChemObjInfoItemToBlock(chemObj, key, 'info.' + key, jsValue, block, options);
			}
		}
		// generate datetime if it does not exists
		if (!Jcamp.BlockUtils.getBlockLdr(block, 'LONGDATE'))
			this.saveToLdrInBlock(block, chemObj, '', new Date(), 'LONGDATE', false);
	},
	/** @private */
	doSaveChemObjInfoItemToBlock: function(chemObj, infoKey, infoJsCascadeName, infoValue, block, options)
	{
		var ignoredLabels = this.doGetIgnoredChemObjInfoJcampLabelNames(chemObj, options);
		// those labels are handled individually, do not save here
		var jcampLabelName = Jcamp.Utils.kekuleLabelNameToJcamp(infoKey, null);
		if (ignoredLabels.indexOf(jcampLabelName) < 0)
		{
			this.saveToLdrInBlock(block, chemObj, infoJsCascadeName, infoValue, jcampLabelName, false);  // do not overwrite existing labels
		}
	},
	/** @private */
	doGetIgnoredChemObjInfoKeys: function(chemObj, options)
	{
		return ['title', /* 'date' */];
	},
	/** @private */
	doGetIgnoredChemObjInfoJcampLabelNames: function(chemObj, options)
	{
		return [Jcamp.Consts.LABEL_BLOCK_BEGIN, Jcamp.Consts.LABEL_BLOCK_END, Jcamp.Consts.LABEL_DX_VERSION, Jcamp.Consts.LABEL_CS_VERSION];
	},
	/**
	 * Write chem object to a JCAMP block object.
	 * Descendants should override this method to do the concrete job.
	 * @param {Kekule.ChemObject} chemObj
	 * @param {Object} block
	 * @param {Hash} options
	 * @returns {Object}
	 * @private
	 */
	doSaveChemObjToBlock: function(chemObj, block, options)
	{
		// do nothing here
	},
	/*
	 * Save some basic meta LDRs to block, including OWNER/ORIGIN, etc.
	 * @param {Kekule.ChemObject} chemObj
	 * @param {Object} block
	 * @param {Hash} options
	 * @private
	 */
	/*
	doSaveBasicMetaToBlock: function(chemObj, block, options)
	{

	},
	*/
	/*
	 * Returns a hash that containing the basic meta key/values to writing to JCAMP data.
	 * Descendants may override this method.
	 * @param {Kekule.ChemObject} chemObj
	 * @param {Hash} options
	 * @returns {Hash} The result should containing the following fields: {OWNER, ORIGIN}.
	 * @private
	 */
	/*
	getBasicMetaForJcamp: function(chemObj, options)
	{
		return {};
	},
	*/
	/** @private */
	createLdr: function(jsName, jsValue, preferredJcampLabelName)
	{
		var lines = Kekule.ObjUtils.notUnset(jsValue)? this._convToLdrValueLines(preferredJcampLabelName, jsValue): [];
		return {'labelName': preferredJcampLabelName, 'valueLines': lines};
	},
	/** @private */
	createLdrRaw: function(jcampLabelName, jcampValueLines)
	{
		return {'labelName': jcampLabelName, 'valueLines': AU.toArray(jcampValueLines)};
	},
	/**
	 * Set a LDR with label and value.
	 * The value is in normal JS type, it will automatically be converted to string by the type recognized by JCAMP label name.
	 * If the label already exists in block, it will be overwritten when overwriteExisted param is true.
	 * @param {Object} block
	 * @param {Kekule.ChemObject} chemObj,
	 * @param {String} jsName
	 * @param {Variant} jsValue
	 * @param {String} jcampLabelName
	 * @param {Bool} overwriteExisted
	 * @private
	 */
	saveToLdrInBlock: function(block, chemObj, jsName, jsValue, jcampLabelName, overwriteExistedLdr)
	{
		var handler = this.getLdrCreator(jsName);
		var ldr = handler && handler(jsName, jsValue, block, jcampLabelName);
		if (ldr)
			this.setLdrInBlock(block, ldr, overwriteExistedLdr);
	},
	/**
	 * Set a LDR in block.
	 * If the label already exists in block, it will be overwritten when overwriteExisted param is true.
	 * @param {Object} block
	 * @param {Object} ldr
	 * @param {Bool} overwriteExisted If true, the old value will be overwritten, else the LDR will be appended to the tail.
	 * @private
	 */
	setLdrInBlock: function(block, ldr, overwriteExisted)
	{
		//var ldr = this._createLdr(labelName, value);
		/*
		var handler = this.getLdrHandler(labelName);
		var ldr = handler && handler(labelName, value, block);
		*/
		if (!ldr)
			return;
		// check if this label already existed in block
		var labelName = ldr.labelName;
		var index = Jcamp.BlockUtils.getLabelIndex(labelName, block);
		if (index >= 0 && overwriteExisted)   // replace the old one
		{
			var oldLdr = Jcamp.BlockUtils.getLdrAt(index, block);
			oldLdr.valueLines = ldr.valueLines;
		}
		else  // create new one
			Jcamp.BlockUtils.addLdrToBlock(block, ldr);
	},
	/**
	 * Convert the complex typed value (e.g. Kekule.Scalar) to simple JS type, for saving into JCAMP.
	 * @param {Variant} value
	 * @returns {Variant}
	 * @private
	 */
	_convJsValueToBasicType: function(value)
	{
		// TODO: now handling Scalar only
		if (value instanceof Kekule.Scalar)
		{
			return value.getValue();
		}
		return value;
	},
	/** @private */
	_convToLdrValueLines: function(labelName, value)
	{
		//var labelInfo = Jcamp.Utils.analysisLdrLabelName(labelName, true);
		return JcampLdrValueParser.encodeValue(labelName, this._convJsValueToBasicType(value));
	}
});

/**
 * Base writer to write {@link Kekule.ChemObjList} or {@link Kekule.ChemSpace} data to JCAMP link block.
 * @class
 * @augments Kekule.IO.Jcamp.BlockWriter
 */
Kekule.IO.Jcamp.LinkBlockWriter = Class.create(Kekule.IO.Jcamp.BlockWriter,
/** @lends Kekule.IO.Jcamp.LinkBlockWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.Jcamp.LinkBlockWriter',
	/** @private */
	initProperties: function()
	{
		// private, a object to map child object with its writer instances
		this.defineProp('childObjWriterClassMap', {'dataType': DataType.OBJECT, 'setter': false, 'scope': Class.PropertyScope.PRIVATE});
		this.defineProp('targetChildObjs', {'dataType': DataType.ARRAY, 'setter': false, 'scope': Class.PropertyScope.PRIVATE});
	},
	/** @ignore */
	doWriteData: function(obj, dataType, format, options)  // returns a JCAMP block object
	{
		var mapDetail = this.doCreateChildObjWriterClassMap(obj);
		if (mapDetail.children.length > 0)
		{
			this.setPropStoreFieldValue('childObjWriterClassMap', mapDetail.map);
			this.setPropStoreFieldValue('targetChildObjs', mapDetail.children);
			return this.tryApplySuper('doWriteData', [obj, dataType, format, options]);
		}
		else
			return null;
	},
	/** @ignore */
	getTitleForBlock: function(chemObj)
	{
		return chemObj.getInfoValue('title') || chemObj.getId();
	},
	/** @ignore */
	doSaveJcampVersionToBlock: function(chemObj, block, options)
	{
		this.saveToLdrInBlock(block, chemObj, '', options.outputDxVersion, Jcamp.Consts.LABEL_DX_VERSION);
	},
	/** @ignore */
	doGetDataTypeForBlock: function(chemObj)
	{
		return 'LINK';
	},
	/** @ignore */
	doSaveChemObjToBlock: function(chemObj, block, options)
	{
		/*
		// set the DATATYPE to link block
		this.saveToLdrInBlock(block, chemObj, '', 'LINK', Jcamp.Consts.LABEL_DATA_TYPE);
		*/
		// then iterate the children
		var childObjs = this.getTargetChildObjs();
		//if (chemObj.getChildAt && chemObj.getChildCount)
		if (childObjs.length)
		{
			//var spectrumObjs = [], otherObjs = [];
			var writerMap = new Kekule.MapEx();
			try
			{
				// iterate children, create a obj-writer map and assign the block id
				//for (var i = 0, l = chemObj.getChildCount(); i < l; ++i)
				for (var i = 0, l = childObjs.length; i < l; ++i)
				{
					//var child = chemObj.getChildAt(i);
					var child = childObjs[i];
					if (child)
					{
						var childWriterClass = this.getChildObjWriterClassMap().get(child);
						if (childWriterClass)
						{
							var childWriter = this._createChildWriter(childWriterClass);
							childWriter.assignBlockIdAndDataType(child);
							writerMap.set(child, childWriter);
							/*
							if (child instanceof Kekule.Spectroscopy.Spectrum)
								spectrumObjs.push(child);
							else
								otherObjs.push(child);
							*/
						}
					}
				}
				//var targetObjs = otherObjs.concat(spectrumObjs);  // ensure spectrums be created last, for the cross references
				var targetObjs = childObjs;
				// do the concrete writing
				for (var i = 0, l = targetObjs.length; i < l; ++i)
				{
					var child = targetObjs[i];
					var childWriter = writerMap.get(child);
					try
					{
						var childBlock = childWriter.writeData(child, null, null, options);
						if (childBlock)
						{
							this.doAppendChildBlock(block, childBlock, options);
						}
					}
					finally
					{
						childWriter.finalize();
					}
				}
			}
			finally
			{
				writerMap.finalize();
			}
			/*
			for (var i = 0, l = chemObj.getChildCount(); i < l; ++i)
			{
				var child = chemObj.getChildAt(i);
				if (child)
				{
					var childWriterClass = this.getChildObjWriterClassMap().get(child);
					if (childWriterClass)
					{
						try
						{
							var childWriter = this._createChildWriter(childWriterClass);
							var childBlock = childWriter.writeData(child, null, null, options);
							if (childBlock)
							{
								this.doAppendChildBlock(block, childBlock, options);
							}
						}
						finally
						{
							childWriter.finalize();
						}
					}
				}
			}
			*/
		}
		// block count
		this.saveToLdrInBlock(block, chemObj, '', block.blocks.length, Jcamp.Consts.LABEL_BLOCK_COUNT, true);
	},
	/** @private */
	doCreateChildObjWriterClassMap: function(rootObj)
	{
		var self = this;
		var result = {'map': new Kekule.MapEx(), 'children': null};
		var spectrumObjs = [], otherObjs = [];
		var iterateForChildWriter = function(parentObj)
		{
			if (!parentObj.getChildCount || !parentObj.getChildAt)
				return;
			else
			{
				for (var i = 0, l = parentObj.getChildCount(); i < l; ++i)
				{
					var child = parentObj.getChildAt(i);
					if (child)
					{
						var childWriterClass = self.doGetChildWriterClass(child);
						if (childWriterClass)
						{
							if (childWriterClass === self.getClass())   // child is actually a list, we need to iterate its children
							{
								iterateForChildWriter(child);
							}
							else
							{
								result.map.set(child, childWriterClass);
								//result.children.push(child);parentObj
								//++result.childCount;
								if (child instanceof Kekule.Spectroscopy.Spectrum)
									spectrumObjs.push(child);
								else
									otherObjs.push(child);
							}
						}
					}
				}
			}
		};

		iterateForChildWriter(rootObj);
		result.children = otherObjs.concat(spectrumObjs);   // ensure spectrum after molecule for cross references
		return result;
	},
	/** @private */
	doGetChildWriterClass: function(chemObj)
	{
		var wClass = Jcamp.BlockWriterManager.getWriterClass(chemObj);
		return wClass || null;
	},
	/** @private */
	_createChildWriter: function(childWriterClass)
	{
		var result = new childWriterClass();
		result.setParentWriter(this);
		return result;
	},
	/**
	 * Append child block data to current block.
	 * @param {Object} block
	 * @param {Object} childBlock
	 * @param {Hash} options
	 */
	doAppendChildBlock: function(block, childBlock, options)
	{
		if (childBlock)
			block.blocks.push(childBlock);
	}
});

Jcamp.BlockWriterManager.register(Kekule.ChemObjList, Kekule.IO.Jcamp.LinkBlockWriter);
Jcamp.BlockWriterManager.register(Kekule.ChemSpace, Kekule.IO.Jcamp.LinkBlockWriter);

})();