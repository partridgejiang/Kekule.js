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

const Compressor = require('./js/compressors.js').Compressor;

var compress = new Compressor(destPath);
compress.execute(moduleNames);
