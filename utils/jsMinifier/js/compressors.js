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

	_generateMinEs6ModuleWrapperJsFiles(compressFileDetails, destPath)
	{
		/*
		var concatModuleJsFiles = function(path, filePathNames,  outputFilePathName)
		{
			var contents = [];
			filePathNames.forEach(filePathName => {
				contents.push(fs.readFileSync(filePathName, 'utf8'));
			});
			fs.writeFileSync(outputFilePathName, contents.join('\n'), 'utf8');
		}

		var moduleFlagFileNames = Kekule.Dev.PackageUtils.ES6_MODULE_FLAG_FILES;
		var moduleFlagFilePathNames = moduleFlagFileNames.map(s => path.resolve(srcRootPath, s));
		//var targetPath = path.resolve(destPath, 'temp');
		var targetPath = destPath;
		var targetMinModuleFlagFileName = '__moduleFlag__.min.js';
		this._doMinify(
			this.minifierName, this._getActualMinifyOptions(), moduleFlagFilePathNames, targetPath, targetMinModuleFlagFileName,
			function(err, min){
			  if (err)
					console.error(err);
				else  // compress successful, concat the compressed module flag with kekule.js and kekule.min.js
			  {
				  var jsFileNames = ['kekule.js', 'kekule.min.js'];
					var outputFileNames = ['kekule.esm.js', 'kekule.min.esm.js'];
				  jsFileNames.forEach((jsFileName, index) => {
						var jsFilePathName = path.resolve(destPath, jsFileName);
						if (fs.existsSync(jsFilePathName))
						{
							concatModuleJsFiles(destPath,
								[path.resolve(targetPath, targetMinModuleFlagFileName), path.resolve(destPath, jsFileName)],
								path.resolve(destPath, outputFileNames[index]));
							console.log('ES6 module min file ' + outputFileNames[index] + ' created');
						}
				  });
					fs.unlinkSync(path.resolve(targetPath, targetMinModuleFlagFileName));
			  }
		});
		*/
		// dist import entrance
		var esModuleEnvSetterFileName = Kekule.Dev.PackageUtils.ES6_MODULE_ENV_SETTER_FILES[0];
		var lines = [];
		lines.push('import "./themes/default/kekule.css";');  // TODO: CSS file, currently path is fixed
		lines.push('import \"./' + esModuleEnvSetterFileName + '\"');  // module env setter file
		lines.push('import \"./' + compressFileDetails.targetStandaloneFileName + '"');  // kekule.min.js
		// write to file
		fs.writeFileSync(path.resolve(destPath, 'kekule.esm.js'), lines.join('\n'));

		// dev web pack entrance
		//var srcRelPath = path.relative(destPath, srcRootPath);
		var srcCssPath = this._normalizePath(path.relative(destPath, path.resolve(srcRootPath, 'widgets/themes/default/kekule.css'))); // TODO: CSS file, currently path is fixed
		lines = [];
		lines.push('import "' + srcCssPath + '"');  // TODO: CSS file, currently path is fixed
		// module env setter file
		lines.push('import envSetter from"' + this._normalizePath(path.relative(destPath, path.resolve(srcRootPath, esModuleEnvSetterFileName))) + '"');
		lines.push('envSetter({"scriptUseMinFile": false})');
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
			this._generateMinEs6ModuleWrapperJsFiles(compressFileDetails, destPath);
			this._copyAdditionalJsFiles(targetModuleNames, destPath);
			this._generateWebpackWrapperFiles(compressFileDetails, destPath);
		}
	}
};

exports.Compressor = Compressor;


