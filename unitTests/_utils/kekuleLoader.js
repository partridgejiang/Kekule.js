/**
 * Created by ginger on 2017/2/21.
 */

(function(doc){

function loadKekuleLib(doc, libMode, optionStr)
{
	var actualMode = libMode || 'src';
	var src;
	if (actualMode === 'release')
		src = '../release/kekule.js';
	else if (actualMode === 'min')
		src = '../release/kekule.min.js';
	else  // 'src'
	{
		src = '../src/kekule.js';
	}

	var paramStr = optionStr || '';
	if (actualMode === 'src')
		paramStr += '&min=false';

	if (paramStr)
		src += '?' + paramStr;

	/*
	var result = doc.createElement('script');
	result.src = src;
	(doc.getElementsByTagName('head')[0] || doc.body).appendChild(result);
	console.log('add src', src);
	return result;
	*/
	doc.write('<script type="text/javascript" src="'+src+'"><\/script>');
}

function init()
{
	var mode, kekuleParams;
	// Get mode
	var queryStr = document.location.search;
	var patternMode = /^(.*\/?)mode\=([^\&]+)/;

	var matchResult = queryStr.match(patternMode);
	mode = matchResult? matchResult[2].toLowerCase(): 'src';

	// Get loading params
	var loaderSrc = /^(.*\/?)kekuleLoader\.js(\?.*)?$/;
	var scriptElems = doc.getElementsByTagName('script');
	for (var j = scriptElems.length - 1; j >= 0; --j)
	{
		var elem = scriptElems[j];
		var scriptSrc = decodeURIComponent(elem.src);  // sometimes the URL is escaped, ',' becomes '%2C'(e.g. in Moodle)
		if (scriptSrc)
		{
			var matchResult = scriptSrc.match(loaderSrc);
			if (matchResult)
			{
				var pstr = matchResult[2];
				if (pstr)
				{
					pstr = pstr.substr(1);  // eliminate starting '?'
					kekuleParams = pstr;
				}
				break;
			}
		}
	}

	//console.log(mode, kekuleParams);
	loadKekuleLib(doc, mode, kekuleParams);
}

init();

})(document);
