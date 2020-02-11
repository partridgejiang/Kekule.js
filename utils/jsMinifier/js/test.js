var fs = require('fs');
const CssCompressor = require('./cssCompressors.js').CssCompressor;

var compressor = new CssCompressor('');


var content = compressor.execute();
fs.writeFileSync('./test.css', content, 'utf-8');

//console.log(compressor.execute());