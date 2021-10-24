/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /utils/kekule.textHelper.js
 * requires /core/kekule.common.js
 * requires /spectrum/kekule.spectrum.core.js
 * requires /io/kekule.io.js
 * requires /io/jcamp/kekule.io.jcamp.base.js
 * requires /localization
 */

(function() {
"use strict";

var AU = Kekule.ArrayUtils;
var Jcamp = Kekule.IO.Jcamp;
var JcampConsts = Jcamp.Consts;

/**
 * Reader for JCAMP document.
 * Data fetch in should be a string.
 * @class
 * @augments Kekule.IO.ChemDataReader
 */
Kekule.IO.JcampReader = Class.create(Kekule.IO.ChemDataReader,
/** @lends Kekule.IO.JcampReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.JcampReader',
	/** @constructs */
	initialize: function(options)
	{
		this.tryApplySuper('initialize', options);
	},

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
		var slabel;
		var isEmptyLabel = false;
		if (p < 0)   // LDR with no '=', a empty label, e.g. ##END
		{
			slabel = lines[0].substring(JcampConsts.DATA_LABEL_FLAG.length).trim();
			isEmptyLabel = true;
		}
		else
		{
			var slabel = lines[0].substring(JcampConsts.DATA_LABEL_FLAG.length, p).trim();
		}
		if (!slabel)   // no label, leading with ##=, a comment LDR, currently bypass it
		{
			// TODO: handle comment LDR
			return null;
		}
		else
		{
			var valueLines = null;
			if (!isEmptyLabel)
			{
				valueLines = [this._removeInlineComments(lines[0].substr(p + 1)).trim()];
				for (var i = 1, l = lines.length; i < l; ++i)
				{
					valueLines.push(this._removeInlineComments(lines[i].trim()));
				}
			}
			return {'labelName': Jcamp.Utils.standardizeLdrLabelName(slabel), 'valueLines': valueLines};
		}
	},

	/**
	 * Create a JS object to store the LDRs in source data. The Block structures are also constructed in tree.
	 * @param {String} data
	 * @returns {Object} The result should be {'blocks': rootBlock, 'ldrs': [], 'ldrIndexes': {}}  (no LDR should be found outside rootBlock).
	 * @private
	 */
	doCreateAnalysisTree: function(data)
	{
		var _createBlock = Jcamp.Utils._createBlock;

		var root = _createBlock();
		var currBlock = root;
		var self = this;

		var _appendLdrInfo = function(lines, block)
		{
			var ldrParseResult = self._parseLdrLines(lines);
			if (ldrParseResult)
			{
				block.ldrs.push(ldrParseResult);
				block.ldrIndexes[ldrParseResult.labelName] = block.ldrs.length - 1;
			}
			return ldrParseResult;
		};
		var _pushLdrLineInfo = function(lastLdrLines)
		{
			var ldrParseResult = self._parseLdrLines(lastLdrLines);
			if (ldrParseResult)
			{
				if (Jcamp.Utils.ldrLabelNameEqual(ldrParseResult.labelName, JcampConsts.LABEL_BLOCK_BEGIN))  // file beginning or sub blocks begining
				{
					var subBlock = _createBlock(currBlock);
					currBlock.blocks.push(subBlock);
					currBlock = subBlock;
				}
				_appendLdrInfo(lastLdrLines, currBlock);
				if (Jcamp.Utils.ldrLabelNameEqual(ldrParseResult.labelName, JcampConsts.LABEL_BLOCK_END))  // end of sub blocks or file
				{
					currBlock = currBlock._parent;
				}
				/*
				// debug
				if (ldrParseResult.labelName === 'XYDATA')
				{
					// console.log('Found XYData field');
					Kekule.IO.JcampLdrValueParser.xyDataTableParser(ldrParseResult.valueLines, {doValueCheck: true});
				}
				*/
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
	/**
	 * Check if the analysis tree build be {@link Kekule.IO.JcampReader._createAnalysisTree} is valid and legal.
	 * If the structure not legal, error should be thrown.
	 * @param {Object} analysisTree
	 * @returns {Bool}
	 * @private
	 */
	doCheckAnalysisTree: function(analysisTree)
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
		if (Jcamp.Utils._getNestedBlockLevelCount(rootBlock) > 2)
		{
			Kekule.error(Kekule.$L('ErrorMsg.JCAMP_MORE_THAN_TWO_NEST_LEVEL'));
		}
		return true;
	},

	/**
	 * Create a JS object to store the LDRs in source data. The Block structures are also constructed in tree.
	 * @param {String} data
	 * @returns {Object} The result should be {'blocks': rootBlock, 'ldrs': [], 'ldrIndexes': {}}  (no LDR should be found outside rootBlock).
	 * @private
	 */
	buildAnalysisTree: function(data)
	{
		var tree = this.doCreateAnalysisTree(data);
		if (this.doCheckAnalysisTree(tree))
			return tree;
		else
			return null;
	},

	/** @private */
	doReadData: function(data, dataType, format, options)
	{
		var result;
		// phase 1, build the basic structure of analysis tree
		var tree = this.buildAnalysisTree(data);
		// phase 2, convert the raw data in analysis tree to JS values
		var rootBlock = tree.blocks[0];  // the root block
		var meta = Jcamp.Utils._getBlockMeta(rootBlock);
		var readerClass = Jcamp.BlockReaderManager.getReaderClass(meta.blockType, meta.format);
		if (readerClass)
		{
			var reader = new readerClass();
			try
			{
				result = reader.doReadData(rootBlock, null, null, options);   // use doReadData instead of readData, since child readers do not need to store srcInfo
			}
			finally
			{
				reader.finalize();
			}
		}
		return result;
	}
});

// register spectrum info prop namespace
Kekule.Spectroscopy.MetaPropNamespace.register('jcamp');

// register JCAMP data formats
Kekule.IO.DataFormat.JCAMP_DX = 'jcamp-dx';
Kekule.IO.MimeType.JCAMP_DX = 'chemical/x-jcamp-dx';
Kekule.IO.DataFormatsManager.register(Kekule.IO.DataFormat.JCAMP_DX, Kekule.IO.MimeType.JCAMP_DX, ['jcamp', 'dx', 'jdx', 'jcm'],
		Kekule.IO.ChemDataType.TEXT, 'JCAMP-DX format');
Kekule.IO.ChemDataReaderManager.register(Kekule.IO.DataFormat.JCAMP_DX, Kekule.IO.JcampReader, [Kekule.IO.DataFormat.JCAMP_DX]);

})();
