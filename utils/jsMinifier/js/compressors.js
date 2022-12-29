var prjRootPath = __dirname +  '/../../../';
var srcRootPath = __dirname +  '/../../../src/';
var Kekule = require(srcRootPath + 'kekule.js').Kekule;
require('./kekule.dev.packageTools.js');


var fs = require('fs');
var path = require('path');
var minify = require('node-minify');
//const minifierNoCompress = require('@node-minify/no-compress');

const defMinifierName = 'terser';
const defMinifierOptions = {
	'yui': {
		'charset': 'utf8',
		'type': 'js'
	},
	'gcc': {
		//compilationLevel: 'ADVANCED'
		//warningLevel: 'VERBOSE'
		compilationLevel: 'SIMPLE',
		//createSourceMap: true
	},
	'uglifyES': {
		mangle: { reserved: ['$super', '$origin'] }
	},
	'terser': {
		mangle: { reserved: ['$super', '$origin'] },
		//sourceMap: url
	}
};

var Compressor = class {
	constructor (destPath, minifierName, minifierOptions)
	{
		this.destPath = destPath;
		this.minifierName = minifierName || defMinifierName;
		this.minifierOptions = minifierOptions || defMinifierOptions[this.minifierName];
	}

	_pushMinifySourceMapParams(minifierName, outputFileName, minifyParams)
	{
		if (minifierName === 'gcc')
			minifyParams.options.createSourceMap = true;
		else if (minifierName === 'terser')
		{
			// TODO: found bug in node-minify/lib/compressors/terser.js line 38,
			//  should write to settings.options.sourceMap.filename rather than settings.options.sourceMap.url.
			//  The source map can not be generated properly unless this bug is fixed.
			//  btw, seems same issue in node-minify/lib/compressors/yglifyjs.js
			var sourceMapFileName = outputFileName + '.map';
			var pathParseResult = path.parse(sourceMapFileName);
			var sourceMapUrl = pathParseResult.base;
			sourceMapFileName = path.resolve(pathParseResult.dir, pathParseResult.name + '.map');
			// sourceMapFileName = path.resolve('./', pathParseResult.name + '.map');
			minifyParams.options.sourceMap = { url: sourceMapUrl, filename: sourceMapFileName };
		}
	}
	_doMinify(minifierName, minifierOptions, srcFileNames, destPath, minFileName, withSourceMap, callbackFunc)
	{
		var outputFileName = path.resolve(destPath, minFileName);
		var outputPath = path.dirname(outputFileName);
		if (!fs.existsSync(outputPath)){
			fs.mkdirSync(outputPath);
		}
		var minifyParams = {
			compressor: minifierName,
			input: srcFileNames,
			output: outputFileName,
			sync: true,
			options: minifierOptions || {},
			callback: callbackFunc
		};
		if (withSourceMap)
			this._pushMinifySourceMapParams(minifierName, outputFileName, minifyParams);
		minify.minify(minifyParams);
	}

	_getActualMinifyOptions()
	{
		return this.minifierOptions? JSON.parse(JSON.stringify(this.minifierOptions)) : {};  // some minifier seems to modify this object, so clone it first
	}

	_compress(compressFileDetails, destPath, compressOptions)
	{
		if (destPath)
		{
			var details = compressFileDetails;
			var minFiles = details.targetMinFileNames;
			var fileMap = details.compressFileMap;

			//console.log('fileMap', fileMap);
			var compressedMinFileNames = [];
			var minifierName = this.minifierName;
			var self = this;
			var doMinify = function(minifierName, minifierOptions, srcFileNames, destPath, minFileName)
			{
				/*
				minify.minify({
					compressor: minifierName,
					input: srcFileNames,
					output: path.resolve(destPath, minFileName),
					sync: true,
					options: minifierOptions || {},
					callback: function(err, min) {
						if (err)
						//console.error(err);
							console.log(err);
						else
						{
							compressedMinFileNames.push(path.resolve(destPath, minFileName));
							console.log('Min file ' + minFileName + ' created');
						}
					}
				});
				*/
				self._doMinify(
					minifierName, minifierOptions, srcFileNames, destPath, minFileName, compressOptions.withSourceMap,
					function(err, min)
					{
						if (err)
							//console.error(err);
							console.log(err);
						else
						{
							compressedMinFileNames.push(path.resolve(destPath, minFileName));
							console.log('Min file ' + minFileName + ' created');
						}
					});
			};

			//console.log('need to compress', minFiles.length);
			minFiles.forEach((minFileName) => {
				//console.log('now compress ' + minFileName, this.minifierName, this.minifierOptions);
				/*
				if (this.minifierName === 'yui' && minFileName === details.targetStandaloneFileName)  // some times there may be problem in compress kekule.min.js in YUI
				{
					//console.log('another approach');
					// try another approach, combine the compressed module min files together
					if (compressedMinFileNames.length === minFiles.length - 1)  // only need to compress kekule.min.js now
					{
						doMinify('noCompress', null, compressedMinFileNames, destPath, details.targetStandaloneFileName);
					}
					else
					{
						console.log(compressedMinFileNames.length, minFiles.length);
					}
					return;
				}
				*/
				var srcFileNames = fileMap[minFileName];
				for (var i = 0, l = srcFileNames.length; i < l; ++i)
				{
					srcFileNames[i] = path.resolve(srcRootPath, srcFileNames[i]);
				}
				try
				{
					//var minifierOptions =  this.minifierOptions? JSON.parse(JSON.stringify(this.minifierOptions)) : {};  // some minifier seems to modify this object, so clone it first
					var minifierOptions = this._getActualMinifyOptions();
					doMinify(minifierName, minifierOptions, srcFileNames, destPath, minFileName);
				}
				catch(e)
				{
					throw e;
					//console.error('Error in creating', minFileName);
				}
			});
		}
	}

	_copyAdditionalJsFiles(targetModuleNames, destPath, compressOptions)
	{
		// copy extra js files
		var extraJsFilePairs = Kekule.Dev.PackageUtils.getStandaloneJsFileDetails(targetModuleNames);
		//console.dir(extraJsFilePairs);

		extraJsFilePairs.forEach(function(pair){
			var destFileName = path.resolve(destPath, pair[1]);
			var destDir = path.dirname(destFileName);
			if (!fs.existsSync(destDir)){
				fs.mkdirSync(destDir);
			}
			fs.copyFile(srcRootPath + pair[0], destFileName, function(err){
				if (err)
					console.error(err);
				else
					console.log('Copy file ' + pair[1] + ' done');
			});
		});
	}

	_normalizePath(targetPath)  // change path sep from '\' to '/' in windows env
	{
		if (path.sep === '\\')
		{
			return targetPath.replace(/\\/g, '/');
		}
		else
			return targetPath;
	}

	_generateModuleExportEntranceFile(compressFileDetails, destPath, destFileName, moduleType)
	{
		var srcFileNames = Kekule.Dev.PackageUtils.MODULE_ENV_INIT_SRC_FILES;
		var content = '';
		srcFileNames.forEach(fileName => {
			var srcConcreteFileName = path.resolve(srcRootPath, fileName);
			var srcContent = fs.readFileSync(srcConcreteFileName);
			content += srcContent;
		});
		if (moduleType === 'commonjs')
		{
			content = content.replace('"{{MODULE_URL}}"', '__filename');
			content = content.replace('"{{MODULE_PATH}}"', '__dirname + "/"');
			content = 'module.exports = ' + content;
		}
		else  // es module
		{
			content = content.replace('"{{MODULE_URL}}"', 'import.meta.url');
			content = content.replace('"{{MODULE_PATH}}"', 'null');
			content = 'export default ' + content;
		}
		fs.writeFileSync(path.resolve(destPath, destFileName), content);
		// TODO: NOTE: also put the module env init file at the src directory
		fs.writeFileSync(path.resolve(srcRootPath, destFileName), content)
		return destFileName;
	}

	_createModuleExportWrapperJsFileImportLine(srcFileName, importExpression, moduleType, useImportFunc)
	{
		var result;
		var outputSrcFileName = this._normalizePath(srcFileName);
		if (moduleType === 'commonjs')
		{
			if (importExpression)
				result = 'var ' + importExpression + ' = require("' + outputSrcFileName + '");';
			else
				result = 'require("' + outputSrcFileName + '");';
		}
		else
		{
			if (useImportFunc)
			{
				// ignore importExpression here
				result = 'import("' + outputSrcFileName + '");';
			}
			else
			{
				if (importExpression)
					result = 'import ' + importExpression + ' from "' + outputSrcFileName + '";';
				else
					result = 'import "' + outputSrcFileName + '";';
			}
		}
		return result;
	}
	_fillModuleExportWrapperJsFileImportLines(moduleType, kekuleModuleNames, lines, importUrls, moduleEnvInitFileUrl, kekuleEntranceFileUrl, withKekuleLoadCall, withExporter)
	{
		if (moduleEnvInitFileUrl)
			lines.push(this._createModuleExportWrapperJsFileImportLine(moduleEnvInitFileUrl, 'exporter', moduleType));  // module env init file
		if (kekuleEntranceFileUrl)
			lines.push(this._createModuleExportWrapperJsFileImportLine(kekuleEntranceFileUrl, null, moduleType));    // kekule.js entrance at first
		importUrls.forEach(url => {
			lines.push(this._createModuleExportWrapperJsFileImportLine(url, null, moduleType));
		});
		if (withExporter)    // the export {Kekule} from ... line should before manipulation of Kekule.XXXX
		{
			var moduleExportLine;
			if (moduleType === 'commonjs')
				moduleExportLine = 'module.exports = exporter();';
			else   // es
			{
				var exportVars = Kekule.Dev.PackageUtils.MODULE_EXPORT_VARS;
				var exportExpr = '{ ' + exportVars.join(', ') + '}';
				moduleExportLine = [
					'let ' + exportExpr + ' = exporter();',
					'export ' + exportExpr + ';'
				].join('\n');
			}
			lines.push(moduleExportLine);   // export line
		}
		if (kekuleModuleNames)
		{
			var kmodNameArrayExpress = '[' + kekuleModuleNames.map(n => '"' + n + '"').join(', ') + ']';
			lines.push('if(!Kekule.scriptSrcInfo.modules)Kekule.scriptSrcInfo.modules=[];')
			lines.push('Kekule.ArrayUtils.pushUnique(Kekule.scriptSrcInfo.modules, ' + kmodNameArrayExpress + ');');
		}
		if (withKekuleLoadCall)
			lines.push('if (typeof(Kekule) !== \'undefined\') { Kekule._loaded(); }');  // load line
	}

	_generateModuleExportJsFiles(kekuleModuleNames, compressFileDetails, destPath, moduleType, options)  // moduleType: 'es' or 'commonjs'
	{
		var result = {};
		var generateImportLine = this._createModuleExportWrapperJsFileImportLine;

		var sIsWebpackCheck = 'if (typeof(__webpack_require__) === "function") '; // outside webpack env, we should not import the CSS or a exception will be raised in browser

		var destFileExt = (moduleType === 'commonjs')? '.js': '.mjs';
		var destEntranceFileCoreName = (moduleType === 'commonjs')?
		  Kekule.Dev.PackageUtils.COMMON_JS_ENTRANCE_FILE_CORE_NAME:
			Kekule.Dev.PackageUtils.ES_MODULE_ENTRANCE_FILE_CORE_NAME;
		var moduleEnvInitFileName = (moduleType === 'commonjs')?
			Kekule.Dev.PackageUtils.COMMON_JS_MODULE_ENV_INIT_DEST_FILE_CORE_NAME + destFileExt:
			Kekule.Dev.PackageUtils.ES_MODULE_ENV_INIT_DEST_FILE_CORE_NAME + destFileExt;
		var moduleEnvInitDestFileName = this._generateModuleExportEntranceFile(compressFileDetails, destPath, moduleEnvInitFileName, moduleType);
		result.modEnvInitFileCoreName = moduleEnvInitDestFileName;

		var sSetScriptSrcLine = 'let _scriptSrc = (Kekule.scriptSrcInfo.path || "") + "{}"; Kekule.scriptSrcInfo.src = _scriptSrc; Kekule.environment.setEnvVar("kekule.scriptSrc", _scriptSrc);';
		/*
		var moduleExportLine = (moduleType === 'commonjs')?
			'module.exports = exporter();':
			'export default exporter();';
		var kekuleModuleQuotes = kekuleModuleNames.map(s => '"' + s + '"');
		var sKekuleModuleLine = 'Kekule.scriptSrcInfo.modules = [' + kekuleModuleQuotes.join(', ') + '];';
		*/
		// prod pack
		var defaultDividedMinFiles = compressFileDetails.defaultMinFileNames;
		var lines = [];
		var minFileUrls = defaultDividedMinFiles.map(fileName => './' + fileName);
		result.prodModuleInitFileName = './' + moduleEnvInitDestFileName;
		this._fillModuleExportWrapperJsFileImportLines(moduleType, kekuleModuleNames, lines, minFileUrls, result.prodModuleInitFileName, './kekule.js', true, true);

		/*
		//lines.push(sIsWebpackCheck + generateImportLine('./themes/default/kekule.css', null, moduleType, true));  // TODO: CSS file, currently path is fixed
		result.prodModuleInitFileName = './' + moduleEnvInitDestFileName;
		lines.push(generateImportLine(result.prodModuleInitFileName, 'exporter', moduleType));  // module env init file
		lines.push(generateImportLine('./kekule.js', null, moduleType));    // kekule.js entrance at first
		//lines.push(generateImportLine('./' + compressFileDetails.targetStandaloneFileName, null, moduleType));  // kekule.min.js
		defaultDividedMinFiles.forEach(fileName => {
			lines.push(generateImportLine('./' + fileName, null, moduleType));
		});
		lines.push(generateImportLine('./kekule.loaded.js', null, moduleType));    // kekule.loaded.js entrance at last
		lines.push(sKekuleModuleLine);  // manually set loaded modules
		lines.push(sSetScriptSrcLine.replaceAll('{}', destEntranceFileCoreName + destFileExt));
		lines.push(moduleExportLine);
		*/
		result.prodFileName = path.resolve(destPath, destEntranceFileCoreName + destFileExt);
		fs.writeFileSync(result.prodFileName, lines.join('\n'));


		// dev pack
		if (!options || !options.doNotUpdateSrcDir)
		{
			//var srcCssPath = this._normalizePath(path.relative(destPath, path.resolve(srcRootPath, 'widgets/themes/default/kekule.css')));
			var ignoredSrcFiles = Kekule.Dev.PackageUtils.SINGLE_BUNDLE_FLAG_FILES.map(s => path.resolve(srcRootPath, s));
			lines = [];
			var srcFiles = compressFileDetails.compressFileMap[compressFileDetails.targetStandaloneFileName];
			var srcFileUrls = srcFiles
				.filter(fname => ignoredSrcFiles.indexOf(fname) < 0)
				.map(fname => this._normalizePath(path.relative(destPath, path.resolve(srcRootPath, fname))));
			result.devModuleInitFileName = this._normalizePath(path.relative(destPath, path.resolve(srcRootPath, moduleEnvInitDestFileName)));
			// kekule.js already in srcFileUrls, we do not need to include it here
			this._fillModuleExportWrapperJsFileImportLines(moduleType, kekuleModuleNames, lines, srcFileUrls, result.devModuleInitFileName, null/*'/kekule.js'*/, true, true);

			/*

			srcFiles.forEach((srcFileName) =>
			{
				if (ignoredSrcFiles.indexOf(srcFileName) >= 0)
				{
					return;
				}
				else
				{
					lines.push(generateImportLine(this._normalizePath(path.relative(destPath, path.resolve(srcRootPath, srcFileName))), null, moduleType));
					//console.log('wrap into ', srcFileName);
				}
			});
			//lines.push(sIsWebpackCheck + generateImportLine(srcCssPath, null, moduleType, true));  // TODO: CSS file, currently path is fixed
			result.devModuleInitFileName = this._normalizePath(path.relative(destPath, path.resolve(srcRootPath, moduleEnvInitDestFileName)));


			lines.push(generateImportLine(result.devModuleInitFileName, 'exporter', moduleType));  // module env init file
			var srcFiles = compressFileDetails.compressFileMap[compressFileDetails.targetStandaloneFileName];
			var ignoredSrcFiles = Kekule.Dev.PackageUtils.SINGLE_BUNDLE_FLAG_FILES.map(s => path.resolve(srcRootPath, s));
			srcFiles.forEach((srcFileName) =>
			{
				if (ignoredSrcFiles.indexOf(srcFileName) >= 0)
				{
					//console.log('bypass', srcFileName);
					return;
				}
				else
				{
					lines.push(generateImportLine(this._normalizePath(path.relative(destPath, path.resolve(srcRootPath, srcFileName))), null, moduleType));
					//console.log('wrap into ', srcFileName);
				}
			});
			// mark not using min js files
			lines.push(sKekuleModuleLine);  // manually set loaded modules
			*/

			lines.push('Kekule.scriptSrcInfo.useMinFile = false;');
			lines.push('Kekule.environment.setEnvVar(\'kekule.useMinJs\', false);');
			lines.push(sSetScriptSrcLine.replaceAll('{}', 'kekule.esm.dev.js'));
			//lines.push(moduleExportLine);
			//lines.push('export { Kekule };');
			// TODO: NOTE: also put the module env init file at the src directory
			result.devFileName = path.resolve(srcRootPath, destEntranceFileCoreName + '.dev' + destFileExt);

			//console.log('write dev module ', result.devFileName);
			fs.writeFileSync(result.devFileName, lines.join('\n'));
		}

		return result;
	}

	// generate a module wrapper for each Kekule-Module
	_generateDividedModuleWrapperJsFiles(compressFileDetails, destPath, moduleEnvInitFileName, wrapperSubPath, jsModuleType)
	{
		var targetPath = path.resolve(destPath, wrapperSubPath);
		if (!fs.existsSync(targetPath))
			fs.mkdirSync(targetPath, {recursive: true});

		var moduleEnvInitFileAbsName = path.resolve(destPath, moduleEnvInitFileName);
		var moduleEnvInitFileRelName= path.relative(targetPath, moduleEnvInitFileAbsName);
		var moduleNames = compressFileDetails.handledModules;
		var moduleDependencies = compressFileDetails.handledModuleDependencies;

		/*
		var moduleExportLine = (jsModuleType === 'commonjs')?
			'module.exports = exporter();':
			'export default exporter();';
		*/
		var destFileTypeMark = (jsModuleType === 'commonjs')? '.cm': '.esm';
		var destFileExt = (jsModuleType === 'commonjs')? '.js': '.mjs';

		var result = {};
		moduleNames.forEach(modName => {
			var modMinFileName = moduleDependencies[modName].minFile;
			var wrappedKModules = [].concat(moduleDependencies[modName].requiredModules);
			if (wrappedKModules.indexOf(modName) < 0)
				wrappedKModules.push(modName);
			var wrappedMinFileNames = [].concat(moduleDependencies[modName].requiredMinFiles);
			if (wrappedMinFileNames.indexOf(modMinFileName) < 0)
				wrappedMinFileNames.push(modMinFileName);

			var minFileUrls = wrappedMinFileNames.map(fname => this._normalizePath(path.relative(targetPath, path.resolve(destPath, fname))));
			var kekuleEntranceUrl = this._normalizePath(path.relative(targetPath, path.resolve(destPath, 'kekule.js')));

			//console.log(modName, wrappedKModules, wrappedMinFileNames);

			// write module wrapper
			var lines = [];
			this._fillModuleExportWrapperJsFileImportLines(jsModuleType, wrappedKModules, lines, minFileUrls, moduleEnvInitFileRelName, kekuleEntranceUrl, true, true);

			/*
			lines.push(this._createModuleExportWrapperJsFileImportLine(moduleEnvInitFileRelName, 'exporter', jsModuleType));  // module env init file
			lines.push(this._createModuleExportWrapperJsFileImportLine(path.relative(targetPath, path.resolve(destPath, 'kekule.js')), null, jsModuleType));    // kekule.js entrance at first
			// each min js file
			wrappedMinFileNames.forEach(minFileName => {
				var relFileName = path.relative(targetPath, path.resolve(destPath, minFileName));
				lines.push(this._createModuleExportWrapperJsFileImportLine(relFileName, null, jsModuleType));
			})
			// add modules to script info
			var allModules = [].concat()
			var modNameArrayExpress = '[' + wrappedKModules.map(n => '"' + n + '"').join(', ') + ']';
			lines.push('Kekule.ArrayUtils.pushUnique(Kekule.scriptSrcInfo.modules, ' + modNameArrayExpress + ');');

			//lines.push(this._createModuleExportWrapperJsFileImportLine(path.relative(targetPath, path.resolve(destPath, 'kekule.loaded.js')), null, jsModuleType));    // kekule.loaded.js entrance at first
			lines.push('if (typeof(Kekule) !== \'undefined\') { Kekule._loaded(); }');  // load line
			// export line
			lines.push(moduleExportLine);
			*/
			var destFileName = modName + destFileTypeMark + destFileExt;
			var destFileAbsName = path.resolve(targetPath, destFileName);
			fs.writeFileSync(destFileAbsName, lines.join('\n'));

			result[modName] = destFileAbsName;
		});
		return result;
	}

	_generateModuleWrapperJsFiles(kekuleModuleNames, compressFileDetails, destPath, options)
	{
		var r1 = this._generateModuleExportJsFiles(kekuleModuleNames, compressFileDetails, destPath, 'commonjs', options);
		var dividedMapCm = this._generateDividedModuleWrapperJsFiles(compressFileDetails, destPath, r1.prodModuleInitFileName, compressFileDetails.subPaths.jsmodule, 'commonjs');
		console.log('CommonJS Module wrapper generated.');
		var r2 = this._generateModuleExportJsFiles(kekuleModuleNames, compressFileDetails, destPath, 'es', options);
		var dividedMapEsm = this._generateDividedModuleWrapperJsFiles(compressFileDetails, destPath, r2.prodModuleInitFileName, compressFileDetails.subPaths.jsmodule, 'es');
		console.log('ES Module wrapper generated.');

		var dividedFileMap = {};
		for (var modName in dividedMapCm)
			dividedFileMap[modName] = { 'cm': dividedMapCm[modName] };
		for (var modName in dividedMapEsm)
			dividedFileMap[modName]['esm'] = dividedMapEsm[modName];

		if (!options || !options.doNotUpdateSrcDir)
		{
			this._updatePackageJsonFile(kekuleModuleNames, compressFileDetails, destPath, dividedFileMap, options)
			console.log('package.json updated');
		}
	}

	_updatePackageJsonFile(kekuleModuleNames, compressFileDetails, destPath, dividedModFileMap, options)
	{
		var baseContent = fs.readFileSync(path.resolve(prjRootPath, 'package.base.json'));
		var packageJson = JSON.parse(baseContent);

		// package version, only reserves the first 3 parts XX.XX.XX
		var kVersionParts = Kekule.VERSION.split('.');
		var packageVersion = kVersionParts.slice(0, 3).join('.');
		packageJson.version = packageVersion;

		//console.log(dividedModFileMap);
		for (var modName in dividedModFileMap)
		{
			packageJson.exports['./mod/' + modName] = {
				'import': './' + this._normalizePath(path.relative(prjRootPath, dividedModFileMap[modName].esm)),
				'require': './' + this._normalizePath(path.relative(prjRootPath, dividedModFileMap[modName].cm))
			}
		}

		fs.writeFileSync(path.resolve(prjRootPath, 'package.json'), JSON.stringify(packageJson, null, '  '));
	}

	/*
	_generateMinEs6ModuleWrapperJsFiles(compressFileDetails, destPath)
	{
		// dist import entrance
		var esModuleEnvSetterFileName = Kekule.Dev.PackageUtils.ES6_MODULE_ENV_SETTER_FILES[0];
		var esModuleExportLine = 'export default exporter();';
		var sSetScriptSrcLine = 'let _scriptSrc=Kekule.scriptSrcInfo.path + "{}"; Kekule.scriptSrcInfo.src=_scriptSrc; Kekule.environment.setEnvVar("kekule.scriptSrc", _scriptSrc);';
		var lines = [];
		lines.push('import "./themes/default/kekule.css";');  // TODO: CSS file, currently path is fixed
		lines.push('import exporter from \"./' + esModuleEnvSetterFileName + '\"');  // module env setter file
		lines.push('import \"./' + compressFileDetails.targetStandaloneFileName + '"');  // kekule.min.js
		lines.push(sSetScriptSrcLine.replaceAll('{}', 'kekule.esm.js'));
		lines.push(esModuleExportLine);

		// write to file
		fs.writeFileSync(path.resolve(destPath, 'kekule.esm.js'), lines.join('\n'));

		// dev web pack entrance
		//var srcRelPath = path.relative(destPath, srcRootPath);
		var srcCssPath = this._normalizePath(path.relative(destPath, path.resolve(srcRootPath, 'widgets/themes/default/kekule.css'))); // TODO: CSS file, currently path is fixed
		lines = [];
		lines.push('import "' + srcCssPath + '"');  // TODO: CSS file, currently path is fixed
		// module env setter file
		lines.push('import exporter from "' + this._normalizePath(path.relative(destPath, path.resolve(srcRootPath, esModuleEnvSetterFileName))) + '"');
		var srcFiles = compressFileDetails.compressFileMap[compressFileDetails.targetStandaloneFileName];
		var ignoredSrcFiles = Kekule.Dev.PackageUtils.SINGLE_BUNDLE_FLAG_FILES.map(s => path.resolve(srcRootPath, s));
		srcFiles.forEach((srcFileName) => {
			if (ignoredSrcFiles.indexOf(srcFileName) >= 0)
			{
				//console.log('bypass', srcFileName);
				return;
			}
			else
			{
				lines.push('import "' + this._normalizePath(path.relative(destPath, path.resolve(srcRootPath, srcFileName))) + '"');
				//console.log('wrap into ', srcFileName);
			}
		});
		// mark not using min js files
		lines.push('Kekule.scriptSrcInfo.useMinFile = false;');
		lines.push('Kekule.environment.setEnvVar(\'kekule.useMinJs\', false);');
		lines.push(sSetScriptSrcLine.replaceAll('{}', 'kekule.esm.dev.js'));
		lines.push(esModuleExportLine);
		//lines.push('export { Kekule };');
		fs.writeFileSync(path.resolve(destPath, 'kekule.esm.dev.js'), lines.join('\n'));
		console.log('ES Module wrapper generated.');
	}

	_generateWebpackWrapperFiles(compressFileDetails, destPath)
	{
		// dist web pack entrance
		var lines = [];
		lines.push('require("./themes/default/kekule.css");');  // TODO: CSS file, currently path is fixed
		lines.push('module.exports = require(\"./' + compressFileDetails.targetStandaloneFileName + '");');  // kekule.min.js
		// write to file
		fs.writeFileSync(path.resolve(destPath, 'kekule.webpack.prod.js'), lines.join('\n'));

		// dev web pack entrance
		//var srcRelPath = path.relative(destPath, srcRootPath);
		var srcCssPath = this._normalizePath(path.relative(destPath, path.resolve(srcRootPath, 'widgets/themes/default/kekule.css'))); // TODO: CSS file, currently path is fixed
		lines = [];
		lines.push('require("' + srcCssPath + '");');  // TODO: CSS file, currently path is fixed
		var srcFiles = compressFileDetails.compressFileMap[compressFileDetails.targetStandaloneFileName];
		var ignoredSrcFiles = Kekule.Dev.PackageUtils.SINGLE_BUNDLE_FLAG_FILES.map(s => path.resolve(srcRootPath, s));
		srcFiles.forEach((srcFileName) => {
			if (ignoredSrcFiles.indexOf(srcFileName) < 0)
				lines.push('require("' + this._normalizePath(path.relative(destPath, path.resolve(srcRootPath, srcFileName))) + '");');
		});
		lines.push('module.exports = Kekule;');
		fs.writeFileSync(path.resolve(destPath, 'kekule.webpack.dev.js'), lines.join('\n'));
		console.log('Webpack wrapper generated.');
	}
	*/

	execute(targetModuleNames, excludeModuleNames, singleBundleModuleNames, destPath, compressOptions)
	{
		if (!destPath)
			destPath = this.destPath;
		if (destPath)
		{
			if (!fs.existsSync(destPath)){
				fs.mkdirSync(destPath, {recursive: true});
			}
			var compressFileDetails = Kekule.Dev.PackageUtils.getCompressFileDetails(targetModuleNames, excludeModuleNames, singleBundleModuleNames, true);
			//console.log(compressFileDetails);
			//return;

			this._compress(compressFileDetails, destPath, compressOptions);
			this._copyAdditionalJsFiles(targetModuleNames, destPath, compressOptions);
			/*
			this._generateMinEs6ModuleWrapperJsFiles(compressFileDetails, destPath);
			this._generateWebpackWrapperFiles(compressFileDetails, destPath);
			*/
			this._generateModuleWrapperJsFiles(compressFileDetails.handledModules, compressFileDetails, destPath, compressOptions);
		}
	}
};

exports.Compressor = Compressor;


