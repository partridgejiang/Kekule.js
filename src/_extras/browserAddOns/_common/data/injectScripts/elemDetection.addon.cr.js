/**
 * Specified code related to Chrome addon for detect the use of Kekule widget in web page.
 */

(function(doc){

var DU = DetectionUtils;

// extend DU
DU.doRequestInjectKekuleLib = function()
{
	/*
	chrome.extension.sendMessage({
		'message': globalConsts.MSG_INJECT_KEKULE_LIB
	},
	function(response) {
		var scriptUrls = response.scriptFiles || [];
		var styleUrls = response.styleFiles || [];
		DU.injectStyleFiles(styleUrls);
		DU.injectScriptFiles(scriptUrls);
	});
	*/
	var scriptFiles = globalConsts.URLS_KEKULE_LIB_INJECT_SCRIPT;
	var styleFiles = globalConsts.URLS_KEKULE_LIB_INJECT_STYLE;
	for (var i = 0, l = scriptFiles.length; i < l; ++i)
	{
		scriptFiles[i] = chrome.extension.getURL('data/' + scriptFiles[i]);
	}
	for (var i = 0, l = styleFiles.length; i < l; ++i)
	{
		styleFiles[i] = chrome.extension.getURL('data/' + styleFiles[i]);
	}

	DU.injectStyleFiles(styleFiles);
	DU.injectScriptFiles(scriptFiles);
	//console.log('require script injection', styleFiles, scriptFiles);
};

DU._init(doc);

})(document);
