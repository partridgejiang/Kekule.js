/**
 * Created by ginger on 2020/7/9.
 */

var vm = require("vm");

var fs = require('fs');
var path = require('path');

var Kekule = require('../../src/kekule.js').Kekule.modules(['widget']);
var XmlUtility = require('../../src/kekule.js').DataType.XmlUtility;

const xmldom = require('./xmldom');
XmlUtility.DOM_PARSER = xmldom.DOMParser;
XmlUtility.DOM_IMPLEMENTATION = xmldom.DOMImplementation;
XmlUtility.XML_SERIALIZER = xmldom.XMLSerializer;

Kekule.IO.loadUrlData = function(fileUrl, callback, formatId, options)
{
	//var fileName = path.resolve(fileUrl);
	var fileName = fileUrl;
	var content = fs.readFile(fileName, 'utf8', function(err, data){
		if (err)
			throw err;
		else
		{
			if (!formatId)
			{
				var ext = Kekule.UrlUtils.extractFileExt(fileUrl);
				formatInfo = Kekule.IO.DataFormatsManager.findFormat(null, ext);
				formatId = formatInfo.id;
			}
			//console.log('load data', fileUrl, formatId);
			var chemObj = Kekule.IO.loadFormatData(data, formatId);
			callback(chemObj, true);
		}
	});
}

var TestMolLoader = require('./testMolBuilder.js').TestMolLoader;

//console.log(TestMolLoader);

var url = path.resolve(__dirname, './testMolBuilder.js');
var data = fs.readFileSync(url, 'utf8');
//var data = 'global.TestMolLoader = this.TestMolLoader';
//var data = 'console.log(this.TestMolLoader)';
vm.runInThisContext(data, {'filename': url});

//console.log('KekuleLoaded', Kekule.VERSION, TestMolLoader);

//global.TestMolLoader = TestMolLoader;

//exports.Kekule = Kekule;
