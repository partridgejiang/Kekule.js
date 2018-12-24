var fs = require('fs');
var minify = require('node-minify');
var compressorName = 'gcc';
var compressOptions = {
	'yui': {},
	'gcc': {
		//compilationLevel: 'ADVANCED'
		//warningLevel: 'VERBOSE'
	}
};

var srcRootPath = __dirname +  '/../../../src/';
var destPath = __dirname + '/../dist/';
var Kekule = require(srcRootPath + 'kekule.js').Kekule;
require('./kekule.dev.packageTools.js');

//console.log(Kekule.CmdLineUtils);
//console.log(Kekule.scriptSrcInfo);

var details = Kekule.Dev.PackageUtils.getCompressFileDetails(null, true);
var minFiles = details.targetMinFileNames;
var fileMap = details.compressFileMap;

minFiles.forEach(function(minFileName){
	var srcFileNames = fileMap[minFileName];
	for (var i = 0, l = srcFileNames.length; i < l; ++i)
	{
		srcFileNames[i] = srcRootPath + srcFileNames[i];
	}
	//console.log('now compress ' + destPath + minFileName);
	minify.minify({
		compressor: compressorName, //'uglifyjs',
		input: srcFileNames,
		output: destPath + minFileName,
		sync: true,
		options: compressOptions[compressorName] || {},
		callback: function(err, min)
		{
			if (err)
				console.error(err);
			else
				console.log('Min file ' + minFileName + ' created!');
		}
	});
});

// copy extra js files
var extraJsFilePairs = [
	['kekule.js', 'kekule.js'],
	['kekule.loaded.js', 'kekule.loaded.js'],
	['_extras/OpenBabel/openbabel.js.dev', 'extra/openbabel.js'],
	['_extras/Indigo/indigo.js.dev', 'extra/indigo.js'],
	['_extras/Indigo/indigoAdapter.js', 'extra/indigoAdapter.js'],
	['_extras/InChI/inchi.js.dev', 'extra/inchi.js']
];

extraJsFilePairs.forEach(function(pair){
	fs.copyFile(srcRootPath + pair[0], destPath + pair[1], function(err){
		if (err)
			console.error(err);
		else
			console.log('Copy file ' + pair[1] + ' done!');
	});
});

