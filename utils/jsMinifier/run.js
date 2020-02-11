var path = require('path');
var argv = require('minimist')(process.argv.slice(2));

// process args
var moduleNames = null;
if (argv.modules || argv.m)
{
	moduleNames = (argv.modules || argv.m).split(',');
}
var destPath = '../../dist/';  // default path
if (argv.dest || argv.d)
{
	destPath = argv.dest || argv.d;
}
var minifierName = argv.minifier || null;

// CSS compressor
const CssCompressor = require('./js/cssCompressors.js').CssCompressor;
var cssCompressor = new CssCompressor(path.resolve(destPath, 'themes/default'));
cssCompressor.execute();

// JS compressor
const Compressor = require('./js/compressors.js').Compressor;
var compress = new Compressor(destPath, minifierName);
compress.execute(moduleNames);



