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

	function analysisLanguage(lanName)
	{
		var parts = lanName.split('-');
		return {'language': parts[0], 'local': parts[1]};
	};

	var rootObj = Kekule;
	var DEF_LANGUAGE = 'en-US';
	var language = navigator? navigator.language || navigator.browserLanguage: DEF_LANGUAGE;
	rootObj.language = language;  // save language info
	var lanInfo = analysisLanguage(language);
	var defLanInfo = analysisLanguage(DEF_LANGUAGE);
	var languageNameSpaces = ['Texts', 'ErrorMsg', 'WidgetTexts', 'ChemWidgetTexts', 'OBJDEF_TEXTS'];

	var candicateLanNames = [lanInfo.language + '_' + lanInfo.local, lanInfo.language,
		defLanInfo.language + defLanInfo.local, defLanInfo.language];


	for (var i = 0, l = languageNameSpaces.length; i < l; ++i)
	{
		var s = languageNameSpaces[i];
		var lanNameSpace = rootObj[s];
		for (var j = 0, k = candicateLanNames.length; j < k; ++j)
		{
			var lanName = candicateLanNames[j];
			if (lanNameSpace[lanName])  // found suitable language
			{
				rootObj[s] = lanNameSpace[lanName];  // override parent, import all language consts
				//console.log('use language', lanName, 'for', s);
				break;
			}
		}
	}
})();