/**
 * @fileoverview
 * File for supporting MDL CTAB/MOL/RXN V3000 data.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /core/kekule.elements.js
 * requires /core/kekule.electrons.js
 * requires /core/kekule.structures.js
 * requires /core/kekule.reactions.js
 * requires /utils/kekule.textHelper.js
 * requires /io/kekule.io.js
 * requires /io/kekule.io.mdlBase.js
 * requires /localization
 */

/**
 * Utility for MDL 3k format.
 * @class
 * @private
 */
Kekule.IO.Mdl3kUtils = {
	/**
	 * Get start tag of a block.
	 * @param {String} blockName
	 * @returns {String}
	 * @private
	 */
	get3kBlockStartTag: function(blockName)
	{
		return 'BEGIN ' + blockName.toUpperCase();
	},
	/**
	 * Get end tag of a block.
	 * @param {String} blockName
	 * @returns {String}
	 * @private
	 */
	get3kBlockEndTag: function(blockName)
	{
		return 'END ' + blockName.toUpperCase();
	},
	/**
	 * Check if value is a atom list rather than single element symbol.
	 * @param {Object} value
	 * @private
	 */
	isAtomList: function(value)
	{
		var reg = /\[.+\]/;
		return value.search(reg) >= 0;
	},
	/**
	 * If value is a atom list, analysis its content.
	 * @param {String} value
	 * @returns {Hash} {isNot(Bool), atoms(Array)}
	 * @private
	 */
	analysisAtomList: function(value)
	{
		var reg = /\[(.+)\]/g;
		//var r = value.match(reg);
		var r = reg.exec(value);
		if (r && (r.length >= 2))
		{
			var s = r[1];
			r = s.split(',');
			var result = {};
			result.isAllowList = !(value.trim().indexOf('NOT') == 0);
			result.symbols = [];
			for (var i = 0, l = r.length; i < l; ++i)
			{
				result.symbols.push(r[i].trim());
			}
			return result;
		}
		else
			return null;
	},

	/**
	 * Convert a MDL 3000 bond configuration value to {@link Kekule.BondStereo} value.
	 * @param {Int} value
	 * @returns {Int} Value from  {@link Kekule.BondStereo}
	 * @private
	 */
	bondCfgToKekule: function(value)
	{
		switch (value)
		{
			case 0: return Kekule.BondStereo.NONE;
			case 1: return Kekule.BondStereo.UP;
			case 2: return Kekule.BondStereo.UP_OR_DOWN;
			case 3: return Kekule.BondStereo.DOWN;
			default: return Kekule.BondStereo.NONE;
		}
	},
	/**
	 * Convert a {@link Kekule.BondStereo} value to MDL 3000 bond configuration value.
	 * @param {Int} value Value from  {@link Kekule.BondStereo}.
	 * @returns {Int}
	 * @private
	 */
	bondStereoToMdlCfg: function(value)
	{
		switch (value)
		{
			case Kekule.BondStereo.UP: return 1;
			case Kekule.BondStereo.UP_OR_DOWN: return 2;
			case Kekule.BondStereo.DOWN: return 3;
			//case Kekule.BondStereo.NONE: return 0;
			default: return 0;
		}
	},
	/**
	 * Turn a float coordinate value to a MDL V3000 string.
	 * @param {Float} value
	 * @returns {String}
	 * @private
	 */
	coordToStr: function(value)
	{
		return (value || 0).toFixed(6);
	}
};

/**
 * Utility to analysis a MDL 3000 line and split it into keywords/values.
 * @class
 * @private
 */
Kekule.IO.Mdl3kValueUtils = {
	/** @private */
	SEPARATOR: ' ',
	/** @private */
	KEYVALUE_CONNECTOR: '=',
	/** @private */
	STR_QUOTE: '"',
	/** @private */
	ESC_QUOTE: '""',
	/** @private */
	VALUELIST_PATTERN: /\(.+\)/g,
	/**
	 * Split a string with separator.
	 * @param {Object} str
	 * @param {Object} separator If not set, space will be used.
	 * @returns {Array}
	 * @private
	 */
	split: function(str, separator)
	{
		var sep = separator || Kekule.IO.Mdl3kValueUtils.SEPARATOR;
		//return str.split(sep);
		var squote = Kekule.IO.Mdl3kValueUtils.STR_QUOTE;
		var result = [];
		var inQuote = false;
		var inBracket = false;
		var inParethsis = false;
		var curr = '';
		for (var i = 0, l = str.length; i < l; ++i)
		{
			var c = str.charAt(i);
			if (c == squote)
			{
				// check if not a ESC_QUOTE
				if (((!inQuote) && (str.charAt(i + 1) == squote))
					|| (inQuote && (str.charAt(i - 1) == squote)))  // ESC_QUOTE
					;
				else
					inQuote = !inQuote;
			}
			else if (c == '[')
				inBracket = true;
			else if (c == ']')
				inBracket = false;
			else if (c == '(')
				inParethsis = true;
			else if (c == ')')
				inParethsis = false;

			if (c == sep)
			{
				if ((!inQuote) && (!inBracket) && (!inParethsis) && curr)
				{
					result.push(curr);
					curr = '';
				}
				else
					curr += c;
			}
			else
				curr += c;
		}
		// last one at tail
		if (curr)
			result.push(curr);
		return result;
	},
	/**
	 * Merge string array to one string with separator.
	 * @param {Array} strs
	 * @param {Object} separator If not set, space will be used.
	 * @returns {String}
	 * @private
	 */
	merge: function(strs, separator)
	{
		var sep = separator || Kekule.IO.Mdl3kValueUtils.SEPARATOR;
		return strs.join(sep);
	},
	/**
	 * Check if a str is in key=value format
	 * @param {String} str
	 * @returns {Bool}
	 * @private
	 */
	isKeyValuePair: function(str)
	{
		return str.indexOf(Kekule.IO.Mdl3kValueUtils.KEYVALUE_CONNECTOR) >= 0;
	},
	/**
	 * Split a key=value pair to {key, value} hash. If '=' not found, regard whole string as value.
	 * @param {String} str
	 * @returns {Hash}
	 * @private
	 */
	splitKeyValue: function(str)
	{
		var result = {};
		var connector = Kekule.IO.Mdl3kValueUtils.KEYVALUE_CONNECTOR;
		var index = str.indexOf(connector);
		if (index < 0)  // connector not found, regard whole as value
			result.value = str;
		else  // key=value form
		{
			result.key = str.substr(0, index);
			result.value = str.substr(index + connector.length);
		}
		return result;
	},
	/**
	 * Merge value and key to a key=value string. If key not set, return value alone.
	 * @param {String} key
	 * @param {String} value
	 * @returns {String}
	 * @private
	 */
	mergeKeyValue: function(value, key)
	{
		if (!key)
			return value;
		else
			return '' + key + Kekule.IO.Mdl3kValueUtils.KEYVALUE_CONNECTOR + value;
	},
	/**
	 * Check if str is a value list surronded by '()'.
	 * In MDL 3000 CTAB file, multiple values can be grouped in (), for example:
	 *   (5 1 2 3 4 5)
	 * where first number is the count of values.
	 * @param {String} str
	 * @returns {Bool}
	 * @private
	 */
	isValueList: function(str)
	{
		var index = str.search(Kekule.IO.Mdl3kValueUtils.VALUELIST_PATTERN);
		return (index >= 0);
	},
	/**
	 * Split value list to an array of values
	 * @param {String} str
	 * @returns {Array}
	 * @private
	 */
	splitValueList: function(str)
	{
		var reg = /\((.+)\)/;
		var r = reg.exec(str);
		if (r && (r.length > 1))
		{
			var s = r[1];
			var arr = Kekule.IO.Mdl3kValueUtils.split(s);
			arr.shift();  // erase the leading count value
			return arr;
		}
		else
			return [str];
	},
	/**
	 * Merge strs to a MDL format value list (n val1 val2 ... valn)
	 * @param {Array} values
	 * @returns {String}
	 * @private
	 */
	mergeValueList: function(values)
	{
		var s = '(' + values.length;
		for (var i = 0, l = values.length; i < l; ++i)
			s += Kekule.IO.Mdl3kValueUtils.SEPARATOR + values[i];
		s += ')';
		return s;
	},
	/**
	 * Sometimes MDL 3000 value are surrounded with double quote("), such as "(value)" or "Val""ue". This function will remove the quote.
	 * @param {String} str
	 * @returns {String}
	 * @private
	 */
	unquoteValue: function(str)
	{
		var quote = Kekule.IO.Mdl3kValueUtils.STR_QUOTE;
		var result = str.trim();
		// check if start/end with quote
		if (result.substr(0, quote.length) == quote)
			result = result.substr(quote.length);
		if (result.substr(result.length - quote.length) == quote)
			result = result.substr(0, result.length - quote.length);
		// then turn inside "" to a single "
		var reg = new RegExp(quote + quote, 'g');
		result = result.replace(reg, quote);
		if (Kekule.IO.Mdl3kValueUtils.isValueList(result))
		{
			result = Kekule.IO.Mdl3kValueUtils.splitValueList(result);
		}
		return result;
	},
	/**
	 * If str has space, quote it as a single string.
	 * " is also be turned to "" according to MDL 3000 style.
	 * @param {String} str
	 * @returns {String}
	 * @private
	 */
	quoteValue: function(str)
	{
		var quote = Kekule.IO.Mdl3kValueUtils.STR_QUOTE;
		var result = '' + str;
		//turn inside " to a double ""
		var reg = new RegExp(quote, 'g');
		result = result.replace(reg, quote + quote);
		// then check if space exists, if ture, quote it
		if (result.indexOf(Kekule.IO.Mdl3kValueUtils.SEPARATOR) >= 0)
			result = quote + result + quote;
		return result;
	},
	/**
	 * Split a string to a set of legal MDL 3000 values.
	 * @param {String} str
	 * @returns {Array} Array of {key, value} hashes.
	 * @private
	 */
	splitValues: function(str)
	{
		var result = [];
		var tokens = Kekule.IO.Mdl3kValueUtils.split(str);
		for (var i = 0, l = tokens.length; i < l; ++i)
		{
			var pair = Kekule.IO.Mdl3kValueUtils.splitKeyValue(tokens[i]);
			if (pair.value)
				pair.value = Kekule.IO.Mdl3kValueUtils.unquoteValue(pair.value);
			result.push(pair);
		}
		return result;
	},
	/**
	 * Merge value or {key,value} pair to a MDL 3000 compatible string.
	 * @param {Array} pairs
	 * @returns {String}
	 * @private
	 */
	mergeValues: function(pairs)
	{
		var result;
		for (var i = 0, l = pairs.length; i < l; ++i)
		{
			var pair = pairs[i];
			var key, value;
			if ((typeof(pair) != 'object') || Kekule.ArrayUtils.isArray(pair))  // no key field
				value = pair;
			else
			{
				key = pair.key;
				value = pair.value;
			}
			var s;
			if (Kekule.ArrayUtils.isArray(value))
				s = Kekule.IO.Mdl3kValueUtils.mergeValueList(value);
			else
				s = Kekule.IO.Mdl3kValueUtils.quoteValue(value);
			if (key)
				s = Kekule.IO.Mdl3kValueUtils.mergeKeyValue(s, key);
			result = Kekule.IO.Mdl3kValueUtils.appendToken(result, s);
		}
		return result;
	},
	/**
	 * Append token to origin string, separate by separator.
	 * @param {String} origin
	 * @param {String} token
	 * @returns {String}
	 * @private
	 */
	appendToken: function(origin, token, separator)
	{
		var sep = separator || Kekule.IO.Mdl3kValueUtils.SEPARATOR;
		var s = origin || '';
		if ((!s) || (s.substr(s.length - sep.length, sep.length) == sep))
			s = token;
		else
			s += Kekule.IO.Mdl3kValueUtils.SEPARATOR + token;
		return s;
	}
};

/**
 * A special helper class to read / write text data in MDL 3000 files.
 * All lines in V3000 file CTAB must begin with "M  V30", columns exceed 80 may have "-"
 * to continue to next line, this convention is exordinate and handled in this class.
 * @class
 * @augments Kekule.TextLinesBuffer
 * @param {String} text A pack of text to read.
 * @private
 */
Kekule.IO.Mdl3kTextBuffer = Class.create(Kekule.TextLinesBuffer,
/** @lends Kekule.Mdl3kTextBuffer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Mdl3kTextBuffer',
	/** @private */
	LEADING_TAG: 'M  V30 ',
	/** @private */
	LINE_CONTI_MARK: '-',
	/** @private */
	MAX_COL_WIDTH: 80,
	/** @constructs */
	initialize: function($super, text)
	{
		$super(text);
	},
	/** @private */
	isStartWithLeadingTag: function(line)
	{
		return (line.substr(0, this.LEADING_TAG.length) == this.LEADING_TAG);
	},
	/** @private */
	isEndWithContinueMark: function(line)
	{
		var s = line.trim();
		return (s.substr(s.length - this.LINE_CONTI_MARK.length) == this.LINE_CONTI_MARK);
	},
	/** @private */
	getLineWithout3kTag: function(line)
	{
		var l = this.LEADING_TAG.length;
		if (line.substr(0, l) == this.LEADING_TAG)
			return line.substr(l);
		else
			return line;
	},
	/**
	 * Get value of line in index. 'M  V30' tag will be removed from head of line.
	 * If the line end with '-', next line is its continuous and will appended to the end of this line.
	 * @param {Int} index
	 * @returns {Hash} {line, lineCount} If line continued with other line, lineCount will report total lines actually read.
	 */
	getLineAtEx: function(index)
	{
		var line = this.getLineAt(index);
		var count = 1;
		// check end mark
		if (line && this.isEndWithContinueMark(line) && this.isStartWithLeadingTag(this.getLines()[index]))
		{
			// remove continue mark
			var p = line.lastIndexOf(this.LINE_CONTI_MARK);
			line = line.substr(0, p);
			var nextResult = this.getLineAtEx(index + 1);
			line += nextResult.line;
			count += nextResult.lineCount;
		}
		var result = {'line': line, 'lineCount': count};
		return result;
	},
	/**
	 * Get value of line in index. 'M  V30' tag will be removed from head of line.
	 * Note the continue mark is not handled in this function.
	 * @param {Int} index
	 * @returns {String}
	 */
	getLineAt: function($super, index)
	{
		var line = $super(index);
		return this.getLineWithout3kTag(line);
	},
	/**
	 * Get value of current line and move currLineNo to next line.
	 * @returns {String}
	 */
	readLine: function()
	{
		var r = this.getLineAtEx(this.getCurrLineNo());
		this.incCurrLineNo(r.lineCount);
		return r.line;
	},
	/**
	 * Insert a line at current position and move currLineNo to next line.
	 * @param {String} line
	 * @param {Bool} not3kMode If in 3k mode, each line will automatically start with M  V30
	 *   and line longer than 80 cols will be wrapped
	 */
	writeLine: function($super, line, not3kMode)
	{
		if (!not3kMode)
		{
			var s = line;
			// add leading tag
			if (!this.isStartWithLeadingTag(line))
				s = this.LEADING_TAG + s;
			// wrap lines
			var sexceed;
			if (s.length > this.MAX_COL_WIDTH)
			{
				var cmark = this.LINE_CONTI_MARK;
				var sep = Kekule.IO.Mdl3kValueUtils.SEPARATOR;
				var firstLineWidth = this.MAX_COL_WIDTH - cmark.length/* - sep.length*/;
				sexceed = s.substr(firstLineWidth);
				s = s.substr(0, firstLineWidth);
				// add continue mark
				s += /*sep + */cmark;
			}
			var r = $super(s);
			if (sexceed)
				r = this.writeLine(sexceed, not3kMode);
			return r;
		}
		else
			return $super(line);
	},
	/**
	 * Insert array of lines at current position and move currLineNo.
	 * @param {Array} lines
	 */
	writeLines: function($super, lines, not3kMode)
	{
		for (var i = 0, l = lines.length; i < l; ++i)
			this.writeLine(lines[i], not3kMode);
	},
	/**
	 * Read lines to extract a whole block and returns a new buffer to it.
	 * @param {String} blockName
	 * @param {String} reservePos
	 * @returns {Kekule.IO.Mdl3kTextBuffer}
	 */
	getBlockBuffer: function(blockName, reservePos)
	{
		var result;
		var startTag = Kekule.IO.Mdl3kUtils.get3kBlockStartTag(blockName);
		var endTag = Kekule.IO.Mdl3kUtils.get3kBlockEndTag(blockName);
		var oldPos = this.getCurrLineNo();
		this.reset();
		var line = this.readLine().trim();
		while ((line != startTag) && (!this.eof()))
		{
			line = this.readLine().trim();
		}
		if (this.eof())  // not found
			result = null;
		else  // find end tag
		{
			var startPos = this.getCurrLineNo();
			endPos = this.getCurrLineNo();
			line = this.readLine().trim();
			while ((line != endTag) && (!this.eof()))
			{
				endPos = this.getCurrLineNo();
				line = this.readLine().trim();
			}
			if (line == endTag)
				var lines = this.getLines().slice(startPos, endPos);
			else  // if eof, the block is to the end of data
				var lines = this.getLines().slice(startPos);
			result = new Kekule.IO.Mdl3kTextBuffer(lines);
		}
		// reverse currLineNo
		if (reservePos)
			this.setCurrLineNo(oldPos);
		return result;
	}
});

/**
 * Base class of readers to read different MDL 3000 blocks.
 * @class
 * @augments Kekule.IO.MdlBlockReader
 * @private
 */
Kekule.IO.Mdl3kBlockReader = Class.create(Kekule.IO.MdlBlockReader,
/** @lends Kekule.IO.Mdl3kBlockReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.Mdl3kBlockReader',
	/** @private */
	createTextBuffer: function()
	{
		return (new Kekule.IO.Mdl3kTextBuffer());
	},
	/** @private */
	doReadBlock: function(textBuffer, parentObj)
	{
		var buffer;
		var newBuffer = !(textBuffer instanceof Kekule.IO.Mdl3kTextBuffer);
		if (newBuffer)  // need to wrap
		{
			buffer = new Kekule.IO.Mdl3kTextBuffer();
			buffer.setLines(textBuffer.getUnreadLines());
			buffer.reset();
		}
		else
			buffer = textBuffer;

		var startLineNo = buffer.getCurrLineNo();
		var result = this.doRead3kBlock(buffer, parentObj);
		var endLineNo = buffer.getCurrLineNo();

		if (newBuffer)  // move old textBuffer line cusor to corresponding position
		{
			var readLineCount = endLineNo - startLineNo;
			textBuffer.incCurrLineNo(readLineCount);
		}
		return result;
	},
	/** @private */
	doRead3kBlock: function(textBuffer, parentObj)
	{
		// do nothing here
	}
});

/**
 * Base class of readers to read different MDL 3000 blocks.
 * @class
 * @augments Kekule.IO.MdlBlockWriter
 * @private
 */
Kekule.IO.Mdl3kBlockWriter = Class.create(Kekule.IO.MdlBlockWriter,
/** @lends Kekule.IO.Mdl3kBlockWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.Mdl3kBlockWriter',
	/** @private */
	createTextBuffer: function()
	{
		return (new Kekule.IO.Mdl3kTextBuffer());
	},
	/** @private */
	writeStartTag: function(blockName, textBuffer)
	{
		textBuffer.writeLine(Kekule.IO.Mdl3kUtils.get3kBlockStartTag(blockName));
	},
	/** @private */
	writeEndTag: function(blockName, textBuffer)
	{
		textBuffer.writeLine(Kekule.IO.Mdl3kUtils.get3kBlockEndTag(blockName));
	},
	/** @private */
	doWriteBlock: function(obj, textBuffer)
	{
		var buffer;
		var newBuffer = !(textBuffer instanceof Kekule.IO.Mdl3kTextBuffer);
		if (newBuffer)  // need to wrap
		{
			buffer = new Kekule.IO.Mdl3kTextBuffer();
			buffer.setLines(textBuffer.getUnreadLines());
			buffer.reset();
		}
		else
			buffer = textBuffer;

		var result = this.doWrite3kBlock(obj, buffer);
		if (newBuffer)
		{
			textBuffer.appendLines(newBuffer.getLines());
		}

		return result;
	},
	/** @private */
	doWrite3kBlock: function(obj, textBuffer)
	{
		// do nothing here
	}
});

/**
 * Class to read and anaylsis MDL 3000 Connection Table block.
 * @class
 * @augments Kekule.IO.Mdl3kBlockReader
 * @private
 */
Kekule.IO.Mdl3kCTabReader = Class.create(Kekule.IO.Mdl3kBlockReader,
/** @lends Kekule.IO.Mdl3kCTabReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.Mdl3kCTabReader',
	/** @private */
	doRead3kBlock: function(textBuffer, parentObj)
	{
		// get Ctab block from textBuffer, if begin tag not found, regard the block start from the first line
		var buffer = textBuffer.getBlockBuffer('CTAB');
		if (!buffer)
			buffer = textBuffer;
		return this.analysisCTab(buffer);
	},
	/**
	 * Analysis the whole ctab
	 * @param {Kekule.TextLinesBuffer} textBuffer
	 * @private
	 */
	analysisCTab: function(textBuffer)
	{
		var result = {};
		// count line
		var line = textBuffer.readLine();
		var countInfo = this.analysisCountLine(line);
		if (!countInfo)  // error
			return null;
		// atom block
		var atomIndexMap = [];
		var atomInfo;
		var atomBuffer = textBuffer.getBlockBuffer('ATOM');
		if (atomBuffer)
			atomInfo = this.analysisAtomBlock(atomBuffer, atomIndexMap);
		else // atom block not found, illegal
 		{
			Kekule.raise(/*Kekule.ErrorMsg.MDL3000_ATOMBLOCK_NOT_FOUND*/Kekule.$L('ErrorMsg.MDL3000_ATOMBLOCK_NOT_FOUND'));
			return null;
		}

		// bond block
		var bondInfo;
		var bondBuffer = textBuffer.getBlockBuffer('BOND');
		if (bondBuffer)
			bondInfo = this.analysisBondBlock(bondBuffer, atomIndexMap);

		// link atom line, ignore currently
		// Sgroup block
		var sgroupInfo;
		var sgroupBuffer = textBuffer.getBlockBuffer('SGROUP');
		if (sgroupBuffer)
			sgroupInfo = this.analysisSGroupBlock(sgroupBuffer, atomIndexMap);

		// other blocks are currently ignored
		result.countInfo = countInfo;
		result.atomInfos = atomInfo;
		result.atomIndexMap = atomIndexMap;
		if (bondInfo)
			result.bondInfos = bondInfo;
		if (sgroupInfo)
			result.sgInfos = sgroupInfo;
		return result;
	},
	/**
	 * Read count line of CTAB.
	 * @private
	 */
	analysisCountLine: function(line)
	{
		var result = {};
		var values = Kekule.IO.Mdl3kValueUtils.splitValues(line);
		// format: M V30 COUNTS na nb nsg n3d chiral [REGNO=regno]
		var tag = values.shift().value;
		// COUNTS tag, assert the count line format is correct
		if (tag != 'COUNTS')
		{
			Kekule.raise(/*Kekule.ErrorMsg.MALFORMED_MDL3000_COUNTLINE*/Kekule.$L('ErrorMsg.MALFORMED_MDL3000_COUNTLINE'));
			return;
		}
		// na: number of atoms
		var s = values.shift().value;
		result.atomCount = parseInt(s, 10);
		// nb: number of bonds
		s = values.shift().value;
		result.bondCount = parseInt(s, 10);
		// nsg: Sgroup count. This info does not exist in MDL 2000 CTAB
		s = values.shift().value;
		result.sgroupCount = parseInt(s, 10);
		// chiral
		s = values.shift().value;
		result.isChiral = (parseInt(s, 10) != 0);
		// regno, ignore
		return result;
	},
	/** @private */
	analysisAtomBlock: function(textBuffer, atomIndexMap)
	{
		var coordMode = Kekule.CoordMode.COORD2D;
		var atomInfos = [];
		//atomInfos.isCoord3D = false;
		//for (var i = 0; i < countInfo.atomCount; ++i)
		while (!textBuffer.eof())
		{
			line = textBuffer.readLine();
			var atomInfo = this.analysisAtomLine(line);
			var actualIndex = atomInfos.push(atomInfo) - 1;
			// as index of atom in MDL file may be disordered, here use a map to keep
			// the relation between array index and MDL atom index
			atomIndexMap[atomInfo.index] = actualIndex;
			// check coord mode
			if (atomInfo.z)  // has z value
				coordMode = Kekule.CoordMode.COORD3D;
		}
		atomInfos.coordMode = coordMode;
		atomInfos.isCoord3D = (coordMode == Kekule.CoordMode.COORD3D);
		return atomInfos;
	},
	/** @private */
	analysisAtomLine: function(line, atomIndexMap)
	{
		var result = {};
		// format: M V30 index type x y z aamap [optional key/values]
		var values = Kekule.IO.Mdl3kValueUtils.splitValues(line);
		// index
		result.index = parseInt(values.shift().value, 10);
		// type
		var s = values.shift().value.trim();
		if (Kekule.IO.Mdl3kUtils.isAtomList(s))
		{
			var atomListInfo = Kekule.IO.Mdl3kUtils.analysisAtomList(s);
			if (atomListInfo)
			{
				result.atomListInfo = atomListInfo;
				result.symbol = 'L';
			}
		}
		else
			result.symbol = s;
		// x y z
		result.x = parseFloat(values.shift().value);
		result.y = parseFloat(values.shift().value);
		result.z = parseFloat(values.shift().value);
		/*
		s = values.shift().value;
		if (s === '0') // 0, not 0.0000000, means no z coordinate
			result.coordMode = Kekule.CoordMode.COORD2D;
		else
		{
			result.z = parseFloat(values.shift().value);
			result.coordMode = Kekule.CoordMode3D;
		}
		*/
		// aamap: Atom-atom mapping, for reaction, ignored currently
		values.shift();
		// the rest if optional values in key=value form
		for (var i = 0, l = values.length; i < l; ++i)
		{
			var pair = values[i];
			var key = pair.key;
			var value = pair.value;
			switch (key)
			{
				case 'CHG': // Atom charge
				{
					var c = parseInt(value, 10);
					if (c)
						result.charge = c;
					break;
				}
				case 'RAD': // radical
				{
					var c = parseInt(value, 10);
					if (c)
						result.radical = c;
					break;
				}
				case 'CFG': // Stereo configuration
				{
					var c = parseInt(value, 10);
					if (c)
						result.parity = c;
					break;
				}
				case 'MASS': // isotope mass
				{
					result.massNumber = parseFloat(value);
					break;
				}
				case 'VAL':  // Valence
				{
					// TODO: ignored currently
					break;
				}
				case 'HCOUNT':  // Query hydrogen count
				{
					var c = parseInt(value, 10);
					if (c)
						result.hydrongenCount = (c == -1)? 0: c - 1;
					break;
				}
				case 'RGROUPS':  // nvals is the number of Rgroups that comprise this R# atom.
				{
					var c = parseInt(value, 10);
					if (c)
						result.rgroupCount = c;
					break;
				}
				/*
				case 'STBOX': // Stereo box
				case 'INVRET':  // Configuration inversion, for reaction
				case 'EXACHG': // Exact change, for reaction
				case 'SUBST': // Query substitution count
				case 'UNSAT': // Query unsaturation flag
				case 'RBCNT': // Query ring bond count
				case 'ATTCHPT':  // Rgroup member attachment points
				case 'ATTCHORD': //
				case 'CLASS': // provides the class information for a collapsed template atom
				case 'SEQID': // supports a positive integer value to capture residue sequence id information for a template
				{
					// ignored
					break;
				}
				*/
			}
		}
		return result;
	},
	/** @private */
	analysisBondBlock: function(textBuffer, atomIndexMap)
	{
		var bondInfos = [];
		//for (var i = 0; i < countInfo.bondCount; ++i)
		while (!textBuffer.eof())
		{
			line = textBuffer.readLine();
			var bondInfo = this.analysisBondLine(line, atomIndexMap);
			bondInfos[bondInfo.index] = bondInfo;
		}
		return bondInfos;
	},
	/** @private */
	analysisBondLine: function(line, atomIndexMap)
	{
		var result = {};
		// format: M  V30 index type atom1 atom2 [optional key/values]
		var values = Kekule.IO.Mdl3kValueUtils.splitValues(line);
		// index
		result.index = parseInt(values.shift().value, 10);
		// type (bond order)
		var s = values.shift().value;
		result.order = Kekule.IO.MdlUtils.bondTypeToKekuleOrder(parseInt(s, 10));
		// atom1 atom2: atom indexes
		result.atomIndex1 = atomIndexMap[parseInt(values.shift().value, 10)];
		result.atomIndex2 = atomIndexMap[parseInt(values.shift().value, 10)];
		// optional key/values
		for (var i = 0, l = values.length; i < l; ++i)
		{
			var key = values[i].key;
			var value = values[i].value;
			switch (key)
			{
				case 'CFG': // Bond configuration
				{
					var c = parseInt(value, 10);
					result.stereo = Kekule.IO.Mdl3kUtils.bondCfgToKekule(c);
					break;
				}
				case 'ENDPTS': // multiple endpoint,
				// One-to-all for organometallics or one-to-any for generics. For example,
        //  ENDPTS=(5 1 2 3 4 5) ATTACH=ALL
				{
					if (Kekule.ArrayUtils.isArray(value))  // list value
					{
						result.endAtomIndexes = [];
						for (var j = 0, k = value.length; j < k; ++j)
						{
							result.endAtomIndexes.push(atomIndexMap[parseInt(value[j], 10)]);
						}
					}
					else  // number value?
						result.endAtomIndexes = [atomIndexMap[parseInt(value, 10)]];
				}
				case 'TOPO': // topological query property, chain or ring, ignore
				case 'RXCTR': // Reacting center status, ignore
				case 'STBOX': // Stereo box, ignore
				{
					break;
				}
			}
		}
		return result;
	},
	/** @private */
	analysisSGroupBlock: function(textBuffer, atomIndexMap)
	{
		var sgroupInfos = [];
		var defValues = null;
		// check if the first line is default value
		// [M  V30 DEFAULT [CLASS=class] -]
		var pos = textBuffer.getCurrLineNo();
		line = textBuffer.readLine();
		var values = Kekule.IO.Mdl3kValueUtils.splitValues(line);
		if (values.shift().value == 'DEFAULT')  // default line, fetch all default values
			defValues = this.fetchSGroupOptionalValues(line, atomIndexMap);
		else  // not default line, turn textBuffer pos back
			textBuffer.setCurrLineNo(pos);
		// iterate
		while (!textBuffer.eof())
		{
			line = textBuffer.readLine();
			var sgInfo = this.analysisSGroupLine(line, atomIndexMap, defValues);
			sgroupInfos[sgInfo.index] = sgInfo;
		}
		return sgroupInfos;
	},
	/** @private */
	analysisSGroupLine: function(line, atomIndexMap, defValues)
	{
		var result = {};
		var values = Kekule.IO.Mdl3kValueUtils.splitValues(line);
		// format:
		// M  V30 index type extindex [optional]
		// index
		result.index = parseInt(values.shift().value, 10);
		// type
		result.sgType = values.shift().value.trim();
		// extIndex
		result.extIndex = parseInt(values.shift().value, 10);  // no use currently
		// optional values
		var opValues = this.fetchSGroupOptionalValues(values, atomIndexMap);
		// merge with defValues
		if (defValues)
			opValues = Object.extend(defValues, opValues);
		result = Object.extend(result, opValues);
		return result;
	},
	/** @private */
	fetchSGroupOptionalValues: function(pairs, atomIndexMap)
	{
		var result = {};
		for (var i = 0, l = pairs.length; i < l; ++i)
		{
			var key = pairs[i].key;
			var value = pairs[i].value;

			switch (key)
			{
				case 'ATOMS': // atom indexes that define the Sgroup
				{
					result.atomIndexes = [];
					for (var j = 0, k = value.length; j < k; j++)
						result.atomIndexes.push(atomIndexMap[value[j]]);
					break;
				}
				case 'XBONDS':  // indexes of xbonds
				{
					result.crossBondIndexes = [].concat(value);
					break;
				}
				case 'SUBTYPE':  // Sgroup subtype, not used now
				{
					result.subType = value;
					break;
				}
				case 'LABEL':  // display label for sgroup
				{
					result.label = value;
					break;
				}
				case 'CSTATE':
					// xbond is the crossing bond of the expanded abbreviation Sgroup
					// cbvx - cvbz is the vector to contracted abbreviation Sgroup
				{
					if (!result.bondVectors)
						result.bondVectors = [];
					// first one is bond index
					var bondIndex = parseInt(value.shift(), 10);
					var x = parseFloat(value.shift()) || 0;
					var y = parseFloat(value.shift()) || 0;
					var z = parseFloat(value.shift()) || 0;
					result.bondVectors[bondIndex] = {
						'bondIndex': bondIndex,
						'x': x, 'y': y, 'z': z
					};
					break;
				}
				case 'CLASS':  // character string for abbreviation Sgroup class
				{
					result.sgClass = value;
					break;
				}
				/*
				case 'CBONDS':  // Only used for data Sgroups, ignore
				case 'PATOMS': // atom indexes of an atom in the paradigmatic repeating unit for a multiple group, ignore
				case 'MULT':  // multiple group multiplier, ignore
				case 'CONNECT':  // connectivity, EU, HH, or HT, ignore
				case 'PARENT':  // parent Sgroup index, ignore
				case 'COMPNO':  // component order number, ignore
				case 'XBHEAD':  // crossing bonds that cross the ��head�� bracket, ignore
				case 'XBCORR':  // pairs of crossing-bond correspondence, ignore
				case 'BRKXYZ':  // double (X,Y,Z) display coordinates in each bracket, ignore
				case 'ESTATE':  // expanded display state information for abbreviation Sgroups, ignore
				case 'FIELDNAME': // the name of data field for Data Sgroup, ignore
				case 'FIELDDISP': // Data Sgroup field display information, ignore
				case 'FIELDDATA': // query or field data, ignore
				case 'FIELDINFO':  // program-specific field information, ignore
				case 'QUERYTYPE':  // type of query or no query if missing, ignore
				case 'QUERYOP':  // query operator, ignore
				case 'BRKTYP':  // displayed bracket style, ignore
				case 'SEQID':  // a positive integer value to capture residue sequence id information, ignore
				case 'SAP':  // ignore
				{
					break;
				}
				*/
			}
		}
		return result;
	}
});

/**
 * Class to write MDL 3000 Connection Table block.
 * @class
 * @augments Kekule.IO.Mdl3kBlockWriter
 * @private
 */
Kekule.IO.Mdl3kCTabWriter = Class.create(Kekule.IO.Mdl3kBlockWriter,
/** @lends Kekule.IO.Mdl3kCTabWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.Mdl3kCTabWriter',
	/** @constructs */
	initialize: function($super, coordMode)
	{
		$super();
		this.setCoordMode(coordMode || Kekule.CoordMode.UNKNOWN);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('coordMode', {'dataType': DataType.INT, 'deaultValue': Kekule.CoordMode.UNKNOWN});
		// Whether write a 2k style countline before Ctab block for compatibility
		// this.defineProp('writeCompatibilityCountline', {'dataType': DataType.BOOL});
	},
	/** @private */
	doWrite3kBlock: function(obj, textBuffer)
	{
		Kekule.IO.MdlUtils.assertIlegalForCtabOutput(obj);
		return this.outputCtab(obj, textBuffer);
	},
	/**
	 * Output atoms and bonds in molecule to text data.
	 * @param {Kekule.StructureFragment} mol
	 * @param {Kekule.IO.Mdl3kTextBuffer} textBuffer
	 * @private
	 */
	outputCtab: function(mol, textBuffer)
	{
		var molInfo = Kekule.IO.MdlStructureUtils.getMoleculeCtabStructureInfo(mol);
		/*
		if (this.getWriteCompatibilityCountline())
			textBuffer.writeLine(this.generateCompatibilityCountLine(molInfo));
		*/
		// write start tag
		this.writeStartTag('CTAB', textBuffer);
		// decide coordMode
		if (this.getCoordMode() != Kekule.CoordMode.UNKNOWN)
			molInfo.coordMode = this.getCoordMode();
		// count line
		textBuffer.writeLine(this.generateCountLine(molInfo));
		// atom block
		this.outputAtomBlock(mol, molInfo, textBuffer);
		// bond block
		this.outputBondBlock(mol, molInfo, textBuffer);
		// Sgroup block
		this.outputSgroupBlock(mol, molInfo, textBuffer);
		// write end tag
		this.writeEndTag('CTAB', textBuffer);
	},
	/**
	 * Generate 2k style count line string of molecule for compatibility.
	 * @param {Hash} molInfo Info returned by {@link Kekule.IO.MdlStructureUtils.getMoleculeCtabStructureInfo}.
	 * @returns {String}
	 * @private
	 */
	generateCompatibilityCountLine: function(molInfo)
	{
		return Kekule.IO.MdlStructureUtils.generateClassicStyleCountLine(molInfo, Kekule.IO.MdlVersion.V3000);
	},
	/**
	 * Generate count line string of molecule.
	 * @param {Hash} molInfo Info returned by {@link Kekule.IO.MdlStructureUtils.getMoleculeCtabStructureInfo}.
	 * @returns {String}
	 * @private
	 */
	generateCountLine: function(molInfo)
	{
		// format: M V30 COUNTS na nb nsg n3d chiral [REGNO=regno]
		var values = ['COUNTS'];  // tag
		values.push(molInfo.atoms.length);  // na: atom count
		values.push(molInfo.bonds.length);  // nb: bond count
		values.push(molInfo.subGroups.length);  // sg: sgroup count
		values.push(0);  // n3d, number of 3D constraints, ignored
		values.push(0);  //TODO: chiral: chiral mark, ignored currently
		return Kekule.IO.Mdl3kValueUtils.mergeValues(values);
	},
	/**
	 * Output atom block to textBuffer.
	 * @private
	 */
	outputAtomBlock: function(mol, molInfo, textBuffer)
	{
		this.writeStartTag('ATOM', textBuffer);
		for (var i = 0, l = molInfo.atoms.length; i < l; ++i)
		{
			var atom = molInfo.atoms[i];
			var line = this.generateAtomLine(i, molInfo.coordMode, atom);
			textBuffer.writeLine(line);
		}
		this.writeEndTag('ATOM', textBuffer);
	},
	/**
	 * Generate a line about atom in atom block.
	 * @private
	 */
	generateAtomLine: function(index, coordMode, atom)
	{
		// Coordinate convert function
		var cf = Kekule.IO.Mdl3kUtils.coordToStr;
		// format: M V30 index type x y z aamap [optional key/values]
		var values = [index + 1, Kekule.IO.MdlStructureUtils.getAtomTypeStr(atom)];
		// coord
		if (coordMode == Kekule.CoordMode.COORD2D)
		{
			var coord = atom.getAbsCoord2D();
			values = values.concat([cf(coord.x), cf(coord.y), cf(0)]);
		}
		else
		{
			var coord = atom.getAbsCoord3D();
			values = values.concat([cf(coord.x), cf(coord.y), cf(coord.z)]);
		}
		// aamap, ignore
		values.push(0);
		// additional properties
		if (atom.getCharge && atom.getCharge())
			values.push({'key': 'CHG', 'value': atom.getCharge()});
		if (atom.getRadical && atom.getRadical())
			values.push({'key': 'RAD', 'value': atom.getRadical()});
		if (atom.getParity && atom.getParity())
			values.push({'key': 'CFG', 'value': atom.getParity()});
		if (atom.getMassNumber && atom.getMassNumber())
			values.push({'key': 'MASS', 'value': atom.getMassNumber()});
		if (atom.getExplicitHydrogenCount && (!Kekule.ObjUtils.isUnset(atom.getExplicitHydrogenCount())))
			values.push({'key': 'HCOUNT', 'value': atom.getExplicitHydrogenCount() + 1});
		return Kekule.IO.Mdl3kValueUtils.mergeValues(values);
	},
	/**
	 * Output bond block to textBuffer.
	 * @private
	 */
	outputBondBlock: function(mol, molInfo, textBuffer)
	{
		if (molInfo.bonds.length <= 0)
			return;
		this.writeStartTag('BOND', textBuffer);
		for (var i = 0, l = molInfo.bonds.length; i < l; ++i)
		{
			var bond = molInfo.bonds[i];
			var line = this.generateBondLine(i, bond, molInfo.atoms);
			textBuffer.writeLine(line);
		}
		this.writeEndTag('BOND', textBuffer);
	},
	/**
	 * Generate a line about bond in bond block.
	 * @private
	 */
	generateBondLine: function(index, bond, atomList)
	{
		// format: M  V30 index type atom1 atom2 [optional key/values]
		var values = [index + 1,
			Kekule.IO.MdlUtils.kekuleBondOrderToMdlType(
				bond.getBondOrder? bond.getBondOrder(): Kekule.BondOrder.UNSET
			)];
		// atom1 atom2
		var count = 0;
		var atoms = [];
		var endPoints = [];
		var nodeGroup = Kekule.IO.MdlStructureUtils.splitConnectedNodes(bond);
		atoms = [atomList.indexOf(nodeGroup.primaryNodes[0]) + 1, atomList.indexOf(nodeGroup.primaryNodes[1]) + 1];
		  // if indexOf not found, it will returns -1, plus 1 just got zero
		if (nodeGroup.remainNodes && nodeGroup.remainNodes.length)
		{
			for (var i = 0, l = nodeGroup.remainNodes.length; i < l; ++i)
				endPoints.push(atomList.indexOf(nodeGroup.remainNodes[i]) + 1);
		}
		values = values.concat(atoms);
		// optional values
		if (bond.getStereo && bond.getStereo())
			values.push({'key': 'CFG', 'value': Kekule.IO.Mdl3kUtils.bondStereoToMdlCfg(bond.getStereo())});
		if (endPoints.length > 0)
		{
			values.push({'key': 'ENDPTS', 'value': endPoints});
			values.push({'key': 'ATTACH', 'value': 'ALL'});  // currrent assume connectivity is all
		}
		return Kekule.IO.Mdl3kValueUtils.mergeValues(values);
	},
	/**
	 * Output Sgroup block to textBuffer.
	 * @private
	 */
	outputSgroupBlock: function(mol, molInfo, textBuffer)
	{
		if (molInfo.subGroups.length <= 0)
			return;
		this.writeStartTag('SGROUP', textBuffer);
		// here we handle sub-group (super-atom) only.
		for (var i = 0, l = molInfo.subGroups.length; i < l; ++i)
		{
			var line = this.generateSgroupLine(i, molInfo.subGroups[i], molInfo);
			textBuffer.writeLine(line);
		}
		this.writeEndTag('SGROUP', textBuffer);
	},
	/**
	 * Generate a line about sub-group in Sgroup block.
	 * @private
	 */
	generateSgroupLine: function(index, subGroup, molInfo)
	{
		var atomList = molInfo.atoms;
		var bondList = molInfo.bonds;
		// format: // M  V30 index type extindex [optional]
		var values = [index + 1, 'SUP', index + 1];
		// optional values
		// ATOMS: atom indexes that define the Sgroup
		var atomIndexes = [];
		var atoms = subGroup.getLeafNodes();
		for (var i = 0, l = atoms.length; i < l; ++i)
		{
			var index = atomList.indexOf(atoms[i]);
			if (index >= 0)
				atomIndexes.push(index + 1);
		}
		atomIndexes = atomIndexes.sort();
		values.push({'key': 'ATOMS', 'value': atomIndexes});
		// LABEL: display label
		var slabel = (subGroup.getAbbr && subGroup.getAbbr())
				|| (subGroup.getFormulaText && subGroup.getFormulaText())
				|| (subGroup.getName && subGroup.getName());
		if (slabel)
			values.push({'key': 'LABEL', 'value': slabel});
		// XBONDS: indexes of xbonds
		// CSTATE: xbond vector
		var xbonds = subGroup.getCrossConnectors();
		var xbondIndexes = [];
		var xbondVectors = [];
		var cf = Kekule.IO.Mdl3kUtils.coordToStr;
		for (var i = 0, l = xbonds.length; i < l; ++i)
		{
			var index = bondList.indexOf(xbonds[i]);
			if (index >= 0)
			{
				xbondIndexes.push(index + 1);
				// vector: bondIndex, x,y z
				var vectorArray = [index + 1];  // index
				// vector x/y/z calculation
				var nodeGroup = Kekule.IO.MdlStructureUtils.splitConnectedNodes(xbonds[i]);
				var atoms = nodeGroup.primaryNodes;
				var vector = {};
				if (atoms.length == 2)
				{
					if (molInfo.coordMode == Kekule.CoordMode.COORD2D)
					{
						vector = Kekule.CoordUtils.substract(atoms[0].getAbsCoord2D(), atoms[1].getAbsCoord2D());
						vectorArray = vectorArray.concat([cf(vector.x), cf(vector.y), 0]);
					}
					else
					{
						vector = Kekule.CoordUtils.substract(atoms[0].getAbsCoord3D(), atoms[1].getAbsCoord3D());
						vectorArray = vectorArray.concat([cf(vector.x), cf(vector.y), cf(vector.z)]);
					}
				}
				xbondVectors.push(vectorArray);
			}
		}

		xbondIndexes = xbondIndexes.sort();
		values.push({'key': 'XBONDS', 'value': xbondIndexes});
		for (var i = 0, l = xbondVectors.length; i < l; ++i)
			values.push({'key': 'CSTATE', 'value': xbondVectors[i]});

		return Kekule.IO.Mdl3kValueUtils.mergeValues(values);
	}
});
