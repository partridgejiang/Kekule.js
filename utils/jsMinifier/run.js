var path = require('path');
var argv = require('minimist')(process.argv.slice(2));

// process args
var moduleNames = null, excludeModuleNames = null, singleBundleMinModuleNames = null;
if (argv.modules || argv.m)
{
	moduleNames = (argv.modules || argv.m).split(',');
}
if (argv.excludemodules || argv.e)
{
	excludeModuleNames = (argv.excludemodules || argv.e).split(',');
}
if (argv.singlebundlemodules || argv.s)
{
	singleBundleMinModuleNames = (argv.singlebundlemodules || argv.s).split(',');
}

var destPath;
var defDestPath = '../../dist/';  // default path
if (argv.dest || argv.d)
{
	destPath = argv.dest || argv.d;
}
var minifierName = argv.minifier || null;

var compressOptions = {};
if (argv.sourceMap)
{
	compressOptions.withSourceMap = true;
}
if (argv.keepsrcdir || !!destPath)  // when use a non-default dest path, we keep src dir intact
{
	compressOptions.doNotUpdateSrcDir = true;
}
if (!destPath)
	destPath = defDestPath;

// CSS compressor
const CssCompressor = require('./js/cssCompressors.js').CssCompressor;
var cssCompressor = new CssCompressor(path.resolve(destPath, 'themes/default'));
cssCompressor.execute();

// JS compressor
const Compressor = require('./js/compressors.js').Compressor;
var compress = new Compressor(destPath, minifierName);
compress.execute(moduleNames, excludeModuleNames, singleBundleMinModuleNames, destPath, compressOptions);



