/**
 * @fileoverview
 * Detect and auto select suitable language file.
 * @author Partridge Jiang
 */

/*
 * requires /localization
 */

(function(){
"use strict";

var KL = Kekule.Localization;


Kekule.Localization.TranslatorUtils = {
	MODULE_SET_TEMPLATE: 'Kekule.Localization.setCurrModule("{0}");\n\n',
	RES_ADD_TEMPLATE: 'Kekule.Localization.addResource("{0}", "{1}", \n{2});\n',

	getModuleInfoHash: function(moduleName)
	{
		var moduleInfoRoot = Kekule.Localization.getModuleInfos();
		var moduleInfoHash = Object.getCascadeFieldValue(moduleName, moduleInfoRoot);
		return moduleInfoHash;
	},

	createLocalModuleObj: function(languageName, moduleName)
	{
		var info = TU.getModuleInfoHash(moduleName);
		var cascadeNames = Kekule.ObjUtils.getLeafFieldCascadeNames(info);
		//console.log(info, cascadeNames);

		var result = {};
		for (var i = 0, l = cascadeNames.length; i < l; ++i)
		{
			var name = cascadeNames[i];
			var value = Kekule.$L(name, languageName);
			Object.setCascadeFieldValue(name, value, result, true);
			//console.log('set value', name, value);
		}
		return result;
	},

	generateLocalModuleContent: function(languageName, moduleName, moduleObj)
	{
		if (!moduleObj)
			moduleObj = TU.createLocalModuleObj(languageName, moduleName);
		var result = TU.MODULE_SET_TEMPLATE.format(moduleName);
		var contentObj = moduleObj; // Object.getCascadeFieldValue(moduleName, moduleRootObj);
		var directFields = Kekule.ObjUtils.getOwnedFieldNames(contentObj);
		for (var i = 0, l = directFields.length; i < l; ++i)
		{
			var fname = directFields[i];
			var value = contentObj[fname];
			var json = JSON.stringify(value, null, '\t');
			var sContent = TU.RES_ADD_TEMPLATE.format(languageName, fname, json);
			result += sContent;
			result += '\n';
		}
		return result;
	}
};
var TU = Kekule.Localization.TranslatorUtils;

})();