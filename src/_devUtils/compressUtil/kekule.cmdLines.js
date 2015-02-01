/**
 * @fileoverview
 * Helper utils to generate a command line to compress the Kekule source code into
 * a single compressed JavaScript file.
 * @author Partridge Jiang
 */

(function(){

"use strict";

/** @ignore */
Kekule.CmdLineUtils = {
	/** @private */
	COMPRESS_LV1_CMD: 'cscript ESC.wsf',
	/** @private */
	COMPRESS_LV2_CMD: 'java -jar yuicompressor.jar',
	/** @private */
	FILE_CATEGORY_PATH_MAP: {
		core: ['lan/', 'core/', 'utils/', 'xbrowsers/', 'chemdoc/', 'html/', 'algorithm/'],
		io: ['io/'],
		render: ['render/'],
		widget: ['widgets/'],
		//chemWidget: ['widgets/chem/'],
		data: ['data/'],
		extra: ['_extras']
	},
	/** @private */
	COMMON_FILES: ['core/kekule.common.js'],  // file need to be put in every doc group
	/** @private */
	DEF_DOC_PATH: './_jsdoc/output/',
	/** @private */
	DOC_EXCLUDE_SRC_FILES: ['lan/json2.js', 'lan/sizzle.js', 'xbrowsers/kekule.x.js'],

	/**
	 * Get all files need to be compressed.
	 * @returns {Array}
	 */
	getSrcFiles: function()
	{
		return getKekuleIncludes();
	},
	/**
	 * Returns all categories of src file.
	 */
	getSrcFileCategories: function()
	{
		return Kekule.ObjUtils.getOwnedFieldNames(CU.FILE_CATEGORY_PATH_MAP);
	},

	/**
	 * Generate command line for compression.
	 * @param {String} targetFileName
	 * @param {Array} srcFiles
	 * @returns {String}
	 */
	generateCompressCmdLine: function(targetFileName, srcFiles)
	{
		var result;
		if (!targetFileName)
			targetFileName = '_compressed/kekule.compressed.js';
		if (!srcFiles)
			srcFiles = Kekule.CmdLineUtils.getSrcFiles();

		// level1 compress
		var stemplate = '{0} -l 2 -ow {1} {2}';
		var srcList = srcFiles.join(' ');
		var lv1OutFile = '_compressed/kekule.compressed._int.js';
		result = stemplate.format(Kekule.CmdLineUtils.COMPRESS_LV1_CMD, lv1OutFile, srcList);
		result += '\n\n';

		// level2 compress
		var stemplate = '{0} {1} -o {2}';
		result += stemplate.format(Kekule.CmdLineUtils.COMPRESS_LV2_CMD, lv1OutFile, targetFileName);

		return result;
	},

	/** @private */
	_splitDocumentGroup: function(srcFiles)
	{
		var result = {};
		var categories = Kekule.ObjUtils.getOwnedFieldNames(CU.FILE_CATEGORY_PATH_MAP);
		for (var i = 0, l = categories.length; i < l; ++i)
		{
			var c = categories[i];
			var files = CU.getFilesOfCategory(c, srcFiles);
			result[c] = files;
		}
		return result;
	},
	/** @private */
	_startWithPaths: function(fileName, paths)
	{
		for (var i = 0, l = paths.length; i < l; ++i)
		{
			if (fileName.startsWith(paths[i]))
				return true;
		}
		return false;
	},
	/** @private */
	getFilesOfCategory: function(category, srcFiles)
	{
		if (category)
		{
			var paths = CU.FILE_CATEGORY_PATH_MAP[category];
			var files = [];
			for (var j = 0, k = srcFiles.length; j < k; ++j)
			{
				var fileName = srcFiles[j];
				if (CU._startWithPaths(fileName, paths))
					files.push(fileName);
			}
			return files;
		}
		else  // category not set, returns all files
			return srcFiles;
	},
	/**
	 * Generate command line for compression.
	 * @param {String} category
	 * @param {String} srcRootDir
	 * @param {Array} srcFiles
	 * @param {String} outDir
	 * @returns {String}
	 */
	generateDocConfigJson: function(category, srcRootDir, srcFiles, outDir)
	{
		if (!srcFiles)
			srcFiles = CU.getSrcFiles();
		if (!outDir)
		  outDir = CU.DEF_DOC_PATH;
		var actualfiles = Kekule.ArrayUtils.exclude(srcFiles, CU.DOC_EXCLUDE_SRC_FILES);
		var files = CU.getFilesOfCategory(category, actualfiles);
		Kekule.ArrayUtils.pushUnique(files, CU.COMMON_FILES);
		if (srcRootDir)
		{
			for (var i = 0, l = files.length; i < l; ++i)
			{
				files[i] = srcRootDir + files[i];
			}
		}
		var result = {
			'source': {
				'include': files
			},
			'opts': {
				'encoding': 'utf-8',
				'destination': outDir + category + '/'
			}
		};
		return result;
	}
};

var CU = Kekule.CmdLineUtils;

})();