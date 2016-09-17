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
	/*
	FILE_CATEGORY_PATH_MAP: {
		core: ['lan/', 'core/', 'utils/', 'xbrowsers/', 'chemdoc/', 'html/', 'algorithm/'],
		io: ['io/'],
		render: ['render/'],
		widget: ['widgets/'],
		//chemWidget: ['widgets/chem/'],
		data: ['data/'],
		extra: ['_extras']
	},
	*/
	/** @private */
	DOC_COMMON_FILES: ['core/kekule.root.js'],  // file need to be put in every doc group
	/** @private */
	DIC_EXTENSION_FILE: '.extension',
	/** @private */
	DEF_DOC_PATH: './_jsdoc/output/',
	/** @private */
	DOC_EXCLUDE_SRC_FILES: ['lan/json2.js', 'lan/sizzle.js', 'xbrowsers/kekule.x.js'],
	/** @private */
	DOC_EXCLUDE_CATEGORIES: ['localization', 'data', 'extra'],
	/** @private */
	STANDALONE_ATTACH_FILES: ['kekule.loaded.js'],
	/** @private */
	RELEASE_WORKER_DIR: 'workers',

	getModuleStructures: function()
	{
		return Kekule.scriptSrcInfo.allModuleStructures;
	},

	/**
	 * Get all files need to be compressed in a module.
	 * @returns {Array}
	 */
	getSrcFiles: function(moduleName)
	{
		//return getKekuleIncludes();
		var structs = CU.getModuleStructures();
		var m = structs[moduleName];
		return m? m.files: [];
	},
	/**
	 * Returns all categories of src file.
	 */
	getSrcFileCategories: function()
	{
		//return Kekule.ObjUtils.getOwnedFieldNames(CU.FILE_CATEGORY_PATH_MAP);
		var structs = CU.getModuleStructures();
		return Kekule.ObjUtils.getOwnedFieldNames(structs);
	},
	getSrcFileModuleInfos: function()
	{
		var moduleNames = CU.getSrcFileCategories();
		var result = [];
		var structs = CU.getModuleStructures();
		for (var i = 0, l = moduleNames.length; i < l; ++i)
		{
			var mname = moduleNames[i];
			var m = structs[mname];
			if (m)
				result.push(Object.extend({'name': mname}, m));
		}
		return result;
	},

	/**
	 * Generate command line for compression.
	 * @param {String} targetFileName
	 * @param {Array} srcFiles
	 * @returns {String}
	 */
	generateCompressCmdLine: function(targetFileName, srcFiles)
	{
		var result = '';
		if (!targetFileName)
			targetFileName = 'kekule.min.js'; //'_compressed/kekule.compressed.js';
		/*
		if (!srcFiles)
			srcFiles = Kekule.CmdLineUtils.getSrcFiles();
		*/
		var moduleInfos = CU.getSrcFileModuleInfos();
		var targetMinFileNames = [];
		var compressFileMap = {};
		var allSrcFiles = [];
		for (var i = 0, l = moduleInfos.length; i < l; ++i)
		{
			var m = moduleInfos[i];
			var targetMinFileName = m.minFile || (m.name + '.min.js');
			var srcFiles = m.files;
			if (m.autoCompress !== false)
			{
				Kekule.ArrayUtils.pushUnique(targetMinFileNames, targetMinFileName);
				if (!compressFileMap[targetMinFileName])
				{
					compressFileMap[targetMinFileName] = [];
				}
				compressFileMap[targetMinFileName] = compressFileMap[targetMinFileName].concat(srcFiles);
				allSrcFiles = allSrcFiles.concat(srcFiles);
			}
		}
		// add a total compression file
		Kekule.ArrayUtils.pushUnique(targetMinFileNames, targetFileName);
		compressFileMap[targetFileName] = allSrcFiles.concat(CU.STANDALONE_ATTACH_FILES);
		//console.log(compressFileMap);

		for (var i = 0, l = targetMinFileNames.length; i < l; ++i)
		{
			var targetMinFileName = targetMinFileNames[i];
			var intFileName = '_int_' + targetMinFileName;
			var srcFiles = compressFileMap[targetMinFileName];
			var stemplate = '{0} -l 2 -ow {1} {2}';
			var srcList = srcFiles.join(' ');
			var lv1OutFile = '_compressed/' + intFileName;
			result += stemplate.format(Kekule.CmdLineUtils.COMPRESS_LV1_CMD, lv1OutFile, srcList);
			result += '\n';

			// level2 compress
			var stemplate = '{0} {1} -o {2}';
			result += stemplate.format(Kekule.CmdLineUtils.COMPRESS_LV2_CMD, lv1OutFile, '_compressed/' + targetMinFileName);
			result += '\n\n';
		}

		result += '\ncopy kekule.js _compressed\\kekule.js /Y';
		result += '\ncopy kekule.loaded.js _compressed\\kekule.loaded.js /Y';

		/*
		// level1 compress
		var stemplate = '{0} -l 2 -ow {1} {2}';
		var srcList = srcFiles.join(' ');
		var lv1OutFile = '_compressed/kekule.compressed._int.js';
		result = stemplate.format(Kekule.CmdLineUtils.COMPRESS_LV1_CMD, lv1OutFile, srcList);
		result += '\n\n';

		// level2 compress
		var stemplate = '{0} {1} -o {2}';
		result += stemplate.format(Kekule.CmdLineUtils.COMPRESS_LV2_CMD, lv1OutFile, targetFileName);
    */
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
	/* @private */
	/*
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
	*/
	/**
	 * Generate command line for compression.
	 * @param {String} category
	 * @param {String} srcRootDir
	 * @param {Array} srcFiles
	 * @param {String} outDir
	 * @returns {String}
	 */
	generateDocConfigJsons: function(category, srcRootDir, srcFiles, outDir)
	{
		/*
		if (!srcFiles)
			srcFiles = CU.getSrcFiles();
		*/
		if (!outDir)
		  outDir = CU.DEF_DOC_PATH;

		var moduleInfos = CU.getSrcFileModuleInfos();
		var targetCategories = [];
		var categoryFileMap = {};
		var allSrcFiles = [];
		for (var i = 0, l = moduleInfos.length; i < l; ++i)
		{
			var m = moduleInfos[i];
			var targetCategoryName = m.category || m.name;
			var srcFiles = Kekule.ArrayUtils.clone(m.files);
			srcFiles = Kekule.ArrayUtils.exclude(srcFiles, CU.DOC_EXCLUDE_SRC_FILES);
			if (targetCategoryName && CU.DOC_EXCLUDE_CATEGORIES.indexOf(targetCategoryName) < 0)
			{
				Kekule.ArrayUtils.pushUnique(targetCategories, targetCategoryName);
				if (!categoryFileMap[targetCategoryName])
				{
					categoryFileMap[targetCategoryName] = [];
				}
				categoryFileMap[targetCategoryName] = categoryFileMap[targetCategoryName].concat(srcFiles);
				allSrcFiles = allSrcFiles.concat(srcFiles);
			}
		}
		targetCategories.push('ALL');
		categoryFileMap['ALL'] = allSrcFiles;

		var result = [];
		for (var i = 0, l = targetCategories.length; i < l; ++i)
		{
			var category = targetCategories[i];
			var files = [].concat(categoryFileMap[category]);
			Kekule.ArrayUtils.pushUnique(files, CU.DOC_COMMON_FILES);
			if (srcRootDir)
			{
				for (var i = 0, l = files.length; i < l; ++i)
				{
					files[i] = srcRootDir + files[i];
				}
			}
			var item = {
				'name': category,
				'source': {
					'include': files
				},
				'opts': {
					'encoding': 'utf-8',
					'destination': outDir + category + '/'
				}
			};
			result.push(item);
		}

		return result;

		/*
		var actualfiles = Kekule.ArrayUtils.exclude(srcFiles, CU.DOC_EXCLUDE_SRC_FILES);
		var files = CU.getFilesOfCategory(category, actualfiles);
		Kekule.ArrayUtils.pushUnique(files, CU.COMMON_FILES);
		*/
		/*
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
		*/
	}
};

var CU = Kekule.CmdLineUtils;

})();