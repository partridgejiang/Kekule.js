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
	/** @ignore */
	doFinalize: function()
	{
		this.tryApplySuper('doFinalize');
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('blockIdObjMap', {'dataType': DataType.HASH, 'setter': false, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});
		// an array to save the information of cross references, each item containing fields: {refType, srcBlockId, targetBlockId, srcReader}
		this.defineProp('crossRefs', {'dataType': DataType.ARRAY, 'setter': false, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});
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
				valueLines = [];
				var s = this._removeInlineComments(lines[0].substr(p + 1)).trim();
				//if (s)
				valueLines.push(s || '');
				for (var i = 1, l = lines.length; i < l; ++i)
				{
					s = this._removeInlineComments(lines[i].trim());
					if (s)
						valueLines.push(s);
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
		var _createBlock = Jcamp.BlockUtils.createBlock;

		var root = _createBlock();
		var currBlock = root;
		var self = this;

		var _appendLdrInfo = function(lines, block)
		{
			var ldrParseResult = self._parseLdrLines(lines);
			if (ldrParseResult)
			{
				/*
				block.ldrs.push(ldrParseResult);
				block.ldrIndexes[ldrParseResult.labelName] = block.ldrs.length - 1;
				*/
				Jcamp.BlockUtils.addLdrToBlock(block, ldrParseResult);
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
		if (Jcamp.BlockUtils.getNestedBlockLevelCount(rootBlock) > 2)
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

	/**
	 * Add a map item of blockId-chemObject.
	 * @param {String} blockId
	 * @param {Kekule.ChemObject} chemObj
	 */
	setObjWithBlockId: function(blockId, chemObj)
	{
		this.getBlockIdObjMap()[blockId] = chemObj;
	},
	/**
	 * Retrieve a chem object from block id in map.
	 * @param {String} blockId
	 * @returns {Kekule.ChemObject}
	 */
	getObjFromBlockId: function(blockId)
	{
		return this.getBlockIdObjMap()[blockId];
	},
	/**
	 * Add a cross reference item that need to be handled later.
	 * @param {Kekule.IO.ChemDataReader} srcReader
	 * @param {String} srcBlockId
	 * @param {String} targetBlockId
	 * @param {Int} refType
	 * @param {String} refTypeText
	 */
	addCrossRefItem: function(srcReader, srcBlockId, targetBlockId, refType, refTypeText)
	{
		this.getCrossRefs().push({
			'srcReader': srcReader,
			'srcBlockId': srcBlockId,
			'targetBlockId': targetBlockId,
			'refType': refType,
			'refTypeText': refTypeText
		});
	},

	/**
	 * Build the cross reference relations after all objects are read from data.
	 * @private
	 */
	doHandleCrossRefs: function()
	{
		var refs = this.getCrossRefs() || [];
		for (var i = 0, l = refs.length; i < l; ++i)
		{
			var item = refs[i];
			var reader = item.srcReader;
			if (reader && reader.doBuildCrossRef)
			{
				var srcObj = this.getObjFromBlockId(item.srcBlockId);
				var targetObj = this.getObjFromBlockId(item.targetBlockId);
				if (srcObj && targetObj)
				{
					reader.doBuildCrossRef(srcObj, targetObj, item.refType, item.refTypeText);
				}
			}
		}
	},

	/** @private */
	doReadData: function(data, dataType, format, options)
	{
		var result;
		// phase 1, build the basic structure of analysis tree
		var tree = this.buildAnalysisTree(data);
		// phase 2, convert the raw data in analysis tree to JS values
		var rootBlock = tree.blocks[0];  // the root block
		var meta = Jcamp.BlockUtils.getBlockMeta(rootBlock);
		var readerClass = Jcamp.BlockReaderManager.getReaderClass(meta.blockType, meta.format);
		if (readerClass)
		{
			var reader = new readerClass();
			reader.setParentReader(this);
			try
			{
				var op = Object.extend({}, Kekule.globalOptions.IO.jcamp);
				op = Object.extend(op, options || {});
				this.setPropStoreFieldValue('blockIdObjMap', {});
				this.setPropStoreFieldValue('crossRefs', []);
				result = reader.doReadData(rootBlock, null, null, op);   // use doReadData instead of readData, since child readers do not need to store srcInfo
				this.doHandleCrossRefs();
			}
			finally
			{
				reader.finalize();
			}
		}
		return result;
	}
});

/**
 * Writer for JCAMP document.
 * It receives a chem object and output JCAMP format string.
 * @class
 * @augments Kekule.IO.ChemDataWriter
 */
Kekule.IO.JcampWriter = Class.create(Kekule.IO.ChemDataWriter,
/** @lends Kekule.IO.JcampWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.JcampWriter',
	/** @private */
	initProperties: function()
	{
		// storing the max value of child block id
		this.defineProp('maxBlockId', {'dataType': DataType.INT, 'setter': false, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});
		// a private object to map source chem object to block
		this.defineProp('objBlockIdMap', {'dataType': DataType.OBJECT, 'setter': false, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});
	},
	/** @ignore */
	doWriteData: function(obj, dataType, format, options)
	{
		var targetObj = obj;
		var concreteWriter = this.doGetChildWriter(targetObj);
		if (!concreteWriter && obj.getChildAt && obj.getChildCount)
		{
			for (var i = 0, l = obj.getChildCount(); i < l; ++i)
			{
				var child = obj.getChildAt(i);
				if (child)
				{
					concreteWriter = this.doGetChildWriter(child);
					if (concreteWriter)
					{
						targetObj = child;
						break;
					}
				}
			}
		}
		if (concreteWriter && targetObj)
		{
			this._prepareWriting();
			var op = Object.extend({}, Kekule.globalOptions.IO.jcamp);
			op = Object.extend(op, options || {});
			concreteWriter.setParentWriter(this);
			var block = concreteWriter.writeData(targetObj, dataType, format, op);
			var lines = [];
			if (block)
				lines = this.encodeBlockToTextLines(block);
			concreteWriter.finalize();
			return lines.join('\n');
		}
		else
			return '';
	},
	/** @private */
	_prepareWriting: function()
	{
		this.setPropStoreFieldValue('maxBlockId', 0);
		if (this.getObjBlockIdMap())
			this.getObjBlockIdMap().finalize();
		this.setPropStoreFieldValue('objBlockIdMap', new Kekule.MapEx());
	},
	/** @private */
	doGetChildWriter: function(chemObj)
	{
		var wClass = Jcamp.BlockWriterManager.getWriterClass(chemObj);
		if (wClass)
			return new wClass();
		else
			return null;
	},
	/**
	 * Output block to text.
	 * @param {Object} block
	 * @returns {Array} Array of string.
	 */
	encodeBlockToTextLines: function(block)
	{
		var ldrs = block.ldrs;
		var codes = [];
		var blockEndLdr;
		for (var i = 0, l = ldrs.length; i < l; ++i)
		{
			var ldr = ldrs[i];
			var labelName = ldr.labelName;
			if (labelName === JcampConsts.LABEL_BLOCK_END)  // the end label must be written after child blocks
			{
				blockEndLdr = ldr;
			}
			else
			{
				var valueLines = ldr.valueLines || [];
				//console.log(labelName, valueLines);
				var s = Jcamp.Consts.DATA_LABEL_FLAG + labelName + Jcamp.Consts.DATA_LABEL_TERMINATOR + valueLines.join('\n');
				codes.push(s);
			}
		}
		// child blocks
		var childBlocks = block.blocks || [];
		for (var i = 0, l = childBlocks.length; i < l; ++i)
		{
			codes = codes.concat(this.encodeBlockToTextLines(childBlocks[i]));
		}
		// write the end LDR
		if (blockEndLdr)
		{
			var s = Jcamp.Consts.DATA_LABEL_FLAG + blockEndLdr.labelName + Jcamp.Consts.DATA_LABEL_TERMINATOR + (ldr.valueLines || []).join('\n');
			codes.push(s);
		}
		return codes;
	},

	/**
	 * Generate a unique block id for child writer.
	 * @returns {String}
	 */
	generateUniqueBlockId: function()
	{
		var i = this.getMaxBlockId();
		var newId = ++i;
		this.setPropStoreFieldValue('maxBlockId', newId);
		return newId.toString();
	},
	/**
	 * Set a chemObj-block id map.
	 * @param {Kekule.ChemObject} chemObj
	 * @param {Hash} blockInfo Including fields {id, dataType}
	 */
	setBlockInfoForObj: function(chemObj, blockInfo)
	{
		this.getObjBlockIdMap().set(chemObj, blockInfo);
	},
	/**
	 * Retrieve the block info associated with chem object.
	 * @param {Kekule.ChemObject} chemObj
	 * @returns {Hash}
	 */
	getBlockInfoFromObj: function(chemObj)
	{
		return this.getObjBlockIdMap().get(chemObj);
	}
});

// register spectrum info prop namespace
Kekule.Spectroscopy.MetaPropNamespace.register('jcamp');

// register JCAMP data formats
Kekule.IO.DataFormat.JCAMP_DX = 'jcamp-dx';
Kekule.IO.MimeType.JCAMP_DX = 'chemical/x-jcamp-dx';
Kekule.IO.DataFormatsManager.register(Kekule.IO.DataFormat.JCAMP_DX, Kekule.IO.MimeType.JCAMP_DX, ['jdx', 'dx', 'jcm', 'jcamp'],
		Kekule.IO.ChemDataType.TEXT, 'JCAMP-DX format');
Kekule.IO.ChemDataReaderManager.register(Kekule.IO.DataFormat.JCAMP_DX, Kekule.IO.JcampReader, [Kekule.IO.DataFormat.JCAMP_DX]);
Kekule.IO.ChemDataWriterManager.register(Kekule.IO.DataFormat.JCAMP_DX, Kekule.IO.JcampWriter,
		[Kekule.Spectroscopy.Spectrum, Kekule.StructureFragment, Kekule.ChemObjList, Kekule.ChemSpace],
		[Kekule.IO.DataFormat.JCAMP_DX]);

})();
