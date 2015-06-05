/**
 * Specified code related to Firefox addon for detect the use of Kekule widget in web page.
 */

(function(self){

var DU = DetectionUtils;

DU.Impl = {

}

// extend DU
DU.doRequestInjectKekuleLib = function()
{
	//self.port.emit(globalConsts.MSG_INJECT_KEKULE_LIB_REQUEST);
	MsgUtils.emitRequest(self.port, globalConsts.MSG_INJECT_KEKULE_LIB, {
		'responseCallback': function(data)
		{
			var scriptUrls = data.scriptFiles || [];
			var styleUrls = data.styleFiles || [];
			DU.injectStyleFiles(styleUrls);
			DU.injectScriptFiles(scriptUrls);
		}
	});
}

DU._init(document);

})(self);
