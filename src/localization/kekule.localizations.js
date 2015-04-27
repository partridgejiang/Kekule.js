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
	//var languageNameSpaces = ['Texts', 'ErrorMsg', 'WidgetTexts', 'ChemWidgetTexts', 'OBJDEF_TEXTS'];

	var candicateLanNames = [lanInfo.language + '_' + lanInfo.local, lanInfo.language,
		defLanInfo.language + defLanInfo.local, defLanInfo.language];

	/*
	for (var i = 0, l = languageNameSpaces.length; i < l; ++i)
	{
		var s = languageNameSpaces[i];
		var lanNameSpace = rootObj[s];
		if (lanNameSpace)
		{
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
	};
	*/


	Kekule.Localization = {};
	Kekule.LocalizationRes = {};

	var localizationRootObj = Kekule.LocalizationRes;
	function getLanugageRoot(languageName, canCreate)
	{
		var result = localizationRootObj[languageName];
		if (!result && canCreate)
		{
			result = {};
			localizationRootObj[languageName] = result;
		}
		return result;
	};
	function getLocalizationValueOfLan(cascadeName, languageName)
	{
		var lanObj = getLanugageRoot(languageName);
		if (lanObj)  // found suitable language
		{
			var value = Object.getCascadeFieldValue(cascadeName, lanObj);
			if (value !== undefined)
				return value;
		}
		return undefined;
	};
	function findLocalizationValue(cascadeName, preferedLanguageName)
	{
		var lanNames = (preferedLanguageName? [preferedLanguageName]: []).concat(candicateLanNames);
		for (var j = 0, k = lanNames.length; j < k; ++j)
		{
			var lanName = lanNames[j];
			var value = getLocalizationValueOfLan(cascadeName, lanName);
			if (value !== undefined)
				return value;
		}
		// not found
		return undefined;
	};
	function getLocalizationValue(cascadeName, preferedLanguageName)
	{
		var result = findLocalizationValue(cascadeName, preferedLanguageName);
		if (result === undefined)
			Kekule.error('Can not find localization resource: ' + cascadeName);
		else
			return result;
	};
	function setLocalizationValueOfLan(cascadeName, value, languageName, canCreate)
	{
		var lanRoot = getLanugageRoot(languageName, canCreate);
		if (lanRoot)
			return Object.setCascadeFieldValue(cascadeName, value, lanRoot, canCreate);
		else
			return false;
	};

	function addLocalizationResources(languageName, resourceName, resources)
	{
		var oldValue = getLocalizationValueOfLan(resourceName, languageName);
		var newValue;
		if (!oldValue)
			newValue = resources;
		else
			newValue = Object.extend(oldValue, resources);
		setLocalizationValueOfLan(resourceName, newValue, languageName, true);
	};
	/** Short cut to get localization value */
	Kekule.$L = getLocalizationValue;
	Kekule.Localization.getValue = getLocalizationValue;
	Kekule.Localization.findValue = findLocalizationValue;
	/** Short cut to set localization values */
	Kekule.Localization.addResource = addLocalizationResources;
})();