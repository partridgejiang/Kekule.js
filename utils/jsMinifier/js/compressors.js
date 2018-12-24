var srcRootPath = __dirname +  '/../../../src/';
var Kekule = require(srcRootPath + 'kekule.js').Kekule;
require('./kekule.dev.packageTools.js');

var fs = require('fs');
var path = require('path');
var minify = require('node-minify');

const defMinifierName = 'gcc';
const defMinifierOptions = {
	'yui': {},
	'gcc': {
		//compilationLevel: 'ADVANCED'
		//warningLevel: 'VERBOSE'
	}
};

var Compressor = class {
	constructor (destPath, minifierName, minifierOptions)
	{
		this.destPath = destPath;
		this.minifierName = minifierName || defMinifierName;
		this.minifierOptions = minifierOptions || defMinifierOptions[this.minifierName];
	}

	_compress(targetModuleNames, destPath)
	{
		if (destPath)
		{
			var details = Kekule.Dev.PackageUtils.getCompressFileDetails(targetModuleNames, true);
			var minFiles = details.targetMinFileNames;
			var fileMap = details.compressFileMap;

			//console.log('fileMap', fileMap);

			minFiles.forEach((minFileName) => {
				var srcFileNames = fileMap[minFileName];
				for (var i = 0, l = srcFileNames.length; i < l; ++i)
				{
					srcFileNames[i] = path.resolve(srcRootPath, srcFileNames[i]);
				}
				//console.log('now compress ' + destPath + minFileName);
				minify.minify({
					compressor: this.minifierName, //'uglifyjs',
					input: srcFileNames,
					output: path.resolve(destPath, minFileName),
					sync: true,
					options: this.minifierOptions || {},
					callback: function(err, min)
					{
						if (err)
							console.error(err);
						else
							console.log('Min file ' + minFileName + ' created!');
					}
				});
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
					console.log('Copy file ' + pair[1] + ' done!');
			});
		});
	}

	execute(targetModuleNames, destPath)
	{
		if (!destPath)
			destPath = this.destPath;
		if (destPath)
		{
			if (!fs.existsSync(destPath)){
				fs.mkdirSync(destPath);
			}
			this._compress(targetModuleNames, destPath);
			this._copyAdditionalJsFiles(targetModuleNames, destPath);
		}
	}
};

exports.Compressor = Compressor;


