/**
 * @fileoverview
 * Helper utils to generate a command line to compress the Kekule source code into
 * a single compressed JavaScript file.
 * @author Partridge Jiang
 */

(function(){

"use strict";

/** @ignore */
Kekule.Dev.PackageUtils = {
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
	PREREQUEST_MODULES: ['lan', 'root', 'localization', 'localizationData', 'common'],
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
	SINGLE_BUNDLE_FLAG_FILES: ['kekule.singleBundleFlag.js'],
	/** @private */
	ES6_MODULE_ENV_SETTER_FILES: ['kekule.esModuleEnvSetter.js'],
	/** @private */
	MODULE_ENV_INIT_SRC_FILES: ['kekule.moduleEnvInits.js'],
	/** @private */
	COMMON_JS_MODULE_ENV_INIT_DEST_FILE_CORE_NAME: 'kekule.moduleEnvInits.cm',
	/** @private */
	ES_MODULE_ENV_INIT_DEST_FILE_CORE_NAME: 'kekule.moduleEnvInits.esm',
	/** @private */
	COMMON_JS_ENTRANCE_FILE_CORE_NAME: 'kekule.cm',
	/** @private */
	ES_MODULE_ENTRANCE_FILE_CORE_NAME: 'kekule.esm',
	/** @private */
	MODULE_EXPORT_VARS: ['Kekule', 'Class', 'ClassEx', 'ObjectEx', 'DataType'],
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
		var structs = PU.getModuleStructures();
		var m = structs[moduleName];
		return m? m.files: [];
	},
	/**
	 * Returns all categories of src file.
	 */
	getSrcFileCategories: function()
	{
		//return Kekule.ObjUtils.getOwnedFieldNames(PU.FILE_CATEGORY_PATH_MAP);
		var structs = PU.getModuleStructures();
		return Kekule.ObjUtils.getOwnedFieldNames(structs);
	},
	getSrcFileModuleInfos: function()
	{
		var moduleNames = PU.getSrcFileCategories();
		var result = [];
		var structs = PU.getModuleStructures();
		for (var i = 0, l = moduleNames.length; i < l; ++i)
		{
			var mname = moduleNames[i];
			var m = structs[mname];
			if (m)
				result.push(Object.extend({'name': mname}, m));
		}
		return result;
	},

	getEssentialModuleNames: function(moduleNames)
	{
		var ms = PU.PREREQUEST_MODULES.concat(moduleNames);
		var result = [];
		var moduleStructs = PU.getModuleStructures();

		var pushModule = function(modules, moduleName)
		{
			if (modules.indexOf(moduleName) < 0)
			{
				var module = moduleStructs[moduleName];
				if (module && module.requires)
				{
					for (var j = 0, k = module.requires.length; j < k; ++j)
					{
						var rm = module.requires[j];
						pushModule(modules, rm);
					}
				}
				modules.push(moduleName);
			}
		};
		for (var i = 0, l = ms.length; i < l; ++i)
		{
			var module = ms[i];
			pushModule(result, module);
		}
		return result;
	},

	getCompressFileDetails: function(targetModuleNames, excludeModuleNames, singleBundleModuleNames, ignoreAutoCompressFlag)
	{
		var	targetFileName = 'kekule.min.js'; //'_compressed/kekule.compressed.js';
		/*
		if (!srcFiles)
			srcFiles = Kekule.Dev.PackageUtils.getSrcFiles();
		*/
		var subPaths = {
			'min': Kekule.scriptSrcInfo.dividedMinSubPath,
			'jsmodule': Kekule.scriptSrcInfo.dividedModuleExporterSubPath
		}

		var moduleInfos = PU.getSrcFileModuleInfos();
		var actualModuleNames = null, actualSingleBundleModuleNames = null;

		if (targetModuleNames)  // limited to these modules
		{
			actualModuleNames = PU.getEssentialModuleNames(targetModuleNames);
		}
		if (singleBundleModuleNames)
			actualSingleBundleModuleNames = PU.getEssentialModuleNames(singleBundleModuleNames);
		else
			actualSingleBundleModuleNames = actualModuleNames;
		var targetMinFileNames = [];
		var compressFileMap = {};
		var defaultMinFileNames = [];
		var allSrcFiles = [], singleBundleSrcFiles = [];
		var handledModuleNames = [];
		var handledModuleDependencies = {};
		var dividedMinSubPath = Kekule.scriptSrcInfo.dividedMinSubPath || '';
		for (var i = 0, l = moduleInfos.length; i < l; ++i)
		{
			var m = moduleInfos[i];
			var inInclude = !(actualModuleNames && actualModuleNames.indexOf(m.name) < 0);
			var inExclude = (excludeModuleNames && excludeModuleNames.indexOf(m.name) >= 0);
			var inSingleBundle = !(actualSingleBundleModuleNames && actualSingleBundleModuleNames.indexOf(m.name) < 0);

			if (!inInclude && !inSingleBundle)
				continue;
			if (inExclude && !inSingleBundle)
				continue;

			var targetMinFileName = dividedMinSubPath + (m.minFile || (m.name + '.min.js'));
			var srcFiles = m.files;
			if (m.autoCompress !== false || ignoreAutoCompressFlag)
			{
				if (inInclude)
				{
					Kekule.ArrayUtils.pushUnique(targetMinFileNames, targetMinFileName);
					if (!compressFileMap[targetMinFileName])
					{
						compressFileMap[targetMinFileName] = [];
					}
					compressFileMap[targetMinFileName] = compressFileMap[targetMinFileName].concat(srcFiles);
					allSrcFiles = allSrcFiles.concat(srcFiles);
				}
				if (inSingleBundle)
				{
					singleBundleSrcFiles = singleBundleSrcFiles.concat(srcFiles);
					Kekule.ArrayUtils.pushUnique(defaultMinFileNames, targetMinFileName);
				}
				handledModuleNames.push(m.name);
				handledModuleDependencies[m.name] = {
					minFile: targetMinFileName,
					requiredModules: Kekule.Dev.PackageUtils.getEssentialModuleNames(m.requires || [])
				};
			}
		}

		for (var i = 0, ii = handledModuleNames.length; i < ii; ++i)
		{
			var modName = handledModuleNames[i];
			var requiredMods = handledModuleDependencies[modName].requiredModules;
			handledModuleDependencies[modName].requiredMinFiles = [];
			for (var j = 0, jj = requiredMods.length; j < jj; ++j)
			{
				var currMinFile = handledModuleDependencies[requiredMods[j]].minFile;

				if (handledModuleDependencies[modName].requiredMinFiles.indexOf(currMinFile) < 0)
					handledModuleDependencies[modName].requiredMinFiles.push(currMinFile);
			}
			//console.log('mod info', modName, requiredMods, handledModuleDependencies[modName].requiredMinFiles);
			//handledModuleDependencies[modName]
		}

		// add a total compression file
		Kekule.ArrayUtils.pushUnique(targetMinFileNames, targetFileName);
		//compressFileMap[targetFileName] = allSrcFiles.concat(PU.STANDALONE_ATTACH_FILES);
		compressFileMap[targetFileName] = singleBundleSrcFiles.concat(PU.STANDALONE_ATTACH_FILES);
		compressFileMap[targetFileName].unshift('kekule.js');  // put the entrance js at the beginning of single kekule.min.js, for analysis script params
		compressFileMap[targetFileName] = PU.SINGLE_BUNDLE_FLAG_FILES.concat(compressFileMap[targetFileName]);  // put the single bundle flag file at beginning
		return {targetStandaloneFileName: targetFileName, targetMinFileNames: targetMinFileNames, compressFileMap: compressFileMap,
			'defaultModuleNames': actualSingleBundleModuleNames, 'defaultMinFileNames': defaultMinFileNames,  // default Kekule modules and min files to loading in usual settings
			handledModules: handledModuleNames, handledModuleDependencies: handledModuleDependencies, subPaths: subPaths};
	},

	getStandaloneJsFileDetails: function(targetModuleNames)
	{
		// TODO: now these values are fixed here, may be has a more flexible solution in the future
		var allStandaloneJsFilePairInfo = {
			common: [
				['kekule.js', 'kekule.js'],
				['kekule.loaded.js', 'kekule.loaded.js'],
				//['kekule.esModuleEnvSetter.js', 'kekule.esModuleEnvSetter.js']
			],
			openbabel: [
				['_extras/OpenBabel/openbabel.js.dev', 'extra/openbabel.js'],
				['_extras/OpenBabel/openbabel.wasm', 'extra/openbabel.wasm'],
				['_extras/OpenBabel/openbabel.data', 'extra/openbabel.data'],
				//['_extras/OpenBabel/workers/kekule.worker.obStructureGenerator.js', 'extra/workers/kekule.worker.obStructureGenerator.js']
				['_extras/OpenBabel/kekule.worker.obStructureGenerator.js', 'extra/kekule.worker.obStructureGenerator.js']
			],
			indigo: [
				['_extras/Indigo/indigo.js.dev', 'extra/indigo.js'],
				['_extras/Indigo/indigo.wasm', 'extra/indigo.wasm'],
				['_extras/Indigo/indigoAdapter.js', 'extra/indigoAdapter.js']
			],
			inchi: [
				['_extras/InChI/inchi.js.dev', 'extra/inchi.js'],
				['_extras/InChI/inchi.wasm', 'extra/inchi.wasm']
			]
		};
		var result = [];
		var allModuleNames = Kekule.ObjUtils.getOwnedFieldNames(allStandaloneJsFilePairInfo);
		var moduleNames = PU.getEssentialModuleNames(targetModuleNames? Kekule.ArrayUtils.intersect(allModuleNames, targetModuleNames): allModuleNames);

		for (var i = 0, l = moduleNames.length; i < l; ++i)
		{
			var name = moduleNames[i];
			var pairs = allStandaloneJsFilePairInfo[name];
			if (pairs)
				result = result.concat(pairs);
		}
		return result;
	},

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
			srcFiles = PU.getSrcFiles();
		*/
		if (!outDir)
		  outDir = PU.DEF_DOC_PATH;

		var moduleInfos = PU.getSrcFileModuleInfos();
		var targetCategories = [];
		var categoryFileMap = {};
		var allSrcFiles = [];
		for (var i = 0, l = moduleInfos.length; i < l; ++i)
		{
			var m = moduleInfos[i];
			var targetCategoryName = m.category || m.name;
			var srcFiles = Kekule.ArrayUtils.clone(m.files);
			srcFiles = Kekule.ArrayUtils.exclude(srcFiles, PU.DOC_EXCLUDE_SRC_FILES);
			if (targetCategoryName && PU.DOC_EXCLUDE_CATEGORIES.indexOf(targetCategoryName) < 0)
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
			Kekule.ArrayUtils.pushUnique(files, PU.DOC_COMMON_FILES);
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
	}
};

var PU = Kekule.Dev.PackageUtils;

})();