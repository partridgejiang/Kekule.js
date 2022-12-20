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
		compilationLevel: 'SIMPLE'
	},
	'uglifyES': {
		mangle: { reserved: ['$super', '$origin'] }
	},
	'terser': {
		mangle: { reserved: ['$super', '$origin'] }
	}
};

var Compressor = class {
	constructor (destPath, minifierName, minifierOptions)
	{
		this.destPath = destPath;
		this.minifierName = minifierName || defMinifierName;
		this.minifierOptions = minifierOptions || defMinifierOptions[this.minifierName];
	}

	_doMinify(minifierName, minifierOptions, srcFileNames, destPath, minFileName, callbackFunc)
	{
		minify.minify({
			compressor: minifierName,
			input: srcFileNames,
			output: path.resolve(destPath, minFileName),
			sync: true,
			options: minifierOptions || {},
			callback: callbackFunc
		});
	}

	_getActualMinifyOptions()
	{
		return this.minifierOptions? JSON.parse(JSON.stringify(this.minifierOptions)) : {};  // some minifier seems to modify this object, so clone it first
	}

	_compress(compressFileDetails, destPath)
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
					minifierName, minifierOptions, srcFileNames, destPath, minFileName,
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

	_copyAdditionalJsFiles(targetModuleNames, destPath)
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
	_generateModuleExportJsFiles(kekuleModuleNames, compressFileDetails, destPath, moduleType)  // moduleType: 'es' or 'commonjs'
	{
		function generateImportLine(srcFileName, importExpression, moduleType, useImportFunc)
		{
			var result;
			if (moduleType === 'commonjs')
			{
				if (importExpression)
					result = 'var ' + importExpression + ' = require("' + srcFileName + '");';
				else
					result = 'require("' + srcFileName + '");';
			}
			else
			{
				if (useImportFunc)
				{
					// ignore importExpression here
					result = 'import("' + srcFileName + '");';
				}
				else
				{
					if (importExpression)
						result = 'import ' + importExpression + ' from "' + srcFileName + '";';
					else
						result = 'import "' + srcFileName + '";';
				}
			}
			return result;
		}

		var sIsWebpackCheck = 'if (typeof(__webpack_require__) === "function") '; // outside webpack env, we should not import the CSS or a exception will be raised in browser

		var destFileExt = (moduleType === 'commonjs')? '.js': '.mjs';
		var destEntranceFileCoreName = (moduleType === 'commonjs')?
		  Kekule.Dev.PackageUtils.COMMON_JS_ENTRANCE_FILE_CORE_NAME:
			Kekule.Dev.PackageUtils.ES_MODULE_ENTRANCE_FILE_CORE_NAME;
		var moduleEnvInitFileName = (moduleType === 'commonjs')?
			Kekule.Dev.PackageUtils.COMMON_JS_MODULE_ENV_INIT_DEST_FILE_CORE_NAME + destFileExt:
			Kekule.Dev.PackageUtils.ES_MODULE_ENV_INIT_DEST_FILE_CORE_NAME + destFileExt;
		var moduleEnvInitDestFileName = this._generateModuleExportEntranceFile(compressFileDetails, destPath, moduleEnvInitFileName, moduleType);

		var moduleExportLine = (moduleType === 'commonjs')?
			'module.exports = exporter();':
			'export default exporter();';
		var sSetScriptSrcLine = 'let _scriptSrc = (Kekule.scriptSrcInfo.path || "") + "{}"; Kekule.scriptSrcInfo.src = _scriptSrc; Kekule.environment.setEnvVar("kekule.scriptSrc", _scriptSrc);';
		var kekuleModuleQuotes = kekuleModuleNames.map(s => '"' + s + '"');
		var sKekuleModuleLine = 'Kekule.scriptSrcInfo.modules = [' + kekuleModuleQuotes.join(', ') + '];';

		// prod pack
		var lines = [];
		lines.push(sIsWebpackCheck + generateImportLine('./themes/default/kekule.css', null, moduleType, true));  // TODO: CSS file, currently path is fixed
		lines.push(generateImportLine('./' + moduleEnvInitDestFileName, 'exporter', moduleType));  // module env init file
		lines.push(generateImportLine('./' + compressFileDetails.targetStandaloneFileName, null, moduleType));  // kekule.min.js
		lines.push(sKekuleModuleLine);  // manually set loaded modules
		lines.push(sSetScriptSrcLine.replaceAll('{}', destEntranceFileCoreName + destFileExt));
		lines.push(moduleExportLine);
		fs.writeFileSync(path.resolve(destPath, destEntranceFileCoreName + destFileExt), lines.join('\n'));

		// dev pack
		var srcCssPath = this._normalizePath(path.relative(destPath, path.resolve(srcRootPath, 'widgets/themes/default/kekule.css')));
		lines = [];
		lines.push(sIsWebpackCheck + generateImportLine(srcCssPath, null, moduleType, true));  // TODO: CSS file, currently path is fixed
		lines.push(generateImportLine(this._normalizePath(path.relative(destPath, path.resolve(srcRootPath, moduleEnvInitDestFileName))), 'exporter', moduleType));  // module env init file
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
				lines.push(generateImportLine(this._normalizePath(path.relative(destPath, path.resolve(srcRootPath, srcFileName))), null, moduleType));
				//console.log('wrap into ', srcFileName);
			}
		});
		// mark not using min js files
		lines.push(sKekuleModuleLine);  // manually set loaded modules
		lines.push('Kekule.scriptSrcInfo.useMinFile = false;');
		lines.push('Kekule.environment.setEnvVar(\'kekule.useMinJs\', false);');
		lines.push(sSetScriptSrcLine.replaceAll('{}', 'kekule.esm.dev.js'));
		lines.push(moduleExportLine);
		//lines.push('export { Kekule };');
		// TODO: NOTE: also put the module env init file at the src directory
		fs.writeFileSync(path.resolve(srcRootPath, destEntranceFileCoreName + '.dev' + destFileExt), lines.join('\n'));
	}

	_generateModuleWrapperJsFiles(kekuleModuleNames, compressFileDetails, destPath)
	{
		this._generateModuleExportJsFiles(kekuleModuleNames, compressFileDetails, destPath, 'commonjs');
		console.log('CommonJS Module wrapper generated.');
		this._generateModuleExportJsFiles(kekuleModuleNames, compressFileDetails, destPath, 'es');
		console.log('ES Module wrapper generated.');
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

	execute(targetModuleNames, excludeModuleNames, singleBundleModuleNames, destPath)
	{
		if (!destPath)
			destPath = this.destPath;
		if (destPath)
		{
			if (!fs.existsSync(destPath)){
				fs.mkdirSync(destPath, {recursive: true});
			}
			var compressFileDetails = Kekule.Dev.PackageUtils.getCompressFileDetails(targetModuleNames, excludeModuleNames, singleBundleModuleNames, true);
			this._compress(compressFileDetails, destPath);
			this._copyAdditionalJsFiles(targetModuleNames, destPath);
			/*
			this._generateMinEs6ModuleWrapperJsFiles(compressFileDetails, destPath);
			this._generateWebpackWrapperFiles(compressFileDetails, destPath);
			*/
			this._generateModuleWrapperJsFiles(compressFileDetails.handledModules, compressFileDetails, destPath);
		}
	}
};

exports.Compressor = Compressor;


