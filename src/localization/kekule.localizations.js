/**
 * @fileoverview
 * Detect and auto select suitable language file.
 * @author Partridge Jiang
 */

/*
 * requires /localization
 */

(function($root){
"use strict";

	function analysisLanguage(lanName)
	{
		var parts = lanName.split('-');
		return {'language': parts[0], 'local': parts[1]};
	}

	var rootObj = Kekule;
	var DEF_LANGUAGE = 'en-US';
	var language = Kekule.language || ($root.navigator? navigator.language || navigator.browserLanguage: DEF_LANGUAGE);
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
	//Kekule.Localization

	var localizationRootObj = Kekule.LocalizationRes;
	function getLanguages()
	{
		var result = [];
		for (var name in localizationRootObj)
			result.push(name);
		return result;
	}
	function getLanguageRoot(languageName, canCreate, localRoot)
	{
		var result = localRoot || localizationRootObj[languageName];
		if (!result && canCreate)
		{
			result = {};
			localizationRootObj[languageName] = result;
		}
		return result;
	}
	function getLocalizationValueOfLan(cascadeName, languageName, localRoot)
	{
		var lanObj = getLanguageRoot(languageName, false, localRoot);
		if (lanObj)  // found suitable language
		{
			var value = Object.getCascadeFieldValue(cascadeName, lanObj);
			if (value !== undefined)
				return value;
		}
		return undefined;
	}
	function findLocalizationValue(cascadeName, preferedLanguageName, localRoot)
	{
		var lanNames = (preferedLanguageName? [preferedLanguageName]: []).concat(candicateLanNames);
		for (var j = 0, k = lanNames.length; j < k; ++j)
		{
			var lanName = lanNames[j];
			var value = getLocalizationValueOfLan(cascadeName, lanName, localRoot);
			if (value !== undefined)
				return value;
		}
		// not found
		return undefined;
	}
	function getLocalizationValue(cascadeName, preferedLanguageName, localRoot)
	{
		var result = findLocalizationValue(cascadeName, preferedLanguageName, localRoot);
		if (result === undefined)
			Kekule.error('Can not find localization resource: ' + cascadeName);
		else
			return result;
	}
	function setLocalizationValueOfLan(cascadeName, value, languageName, canCreate, localRoot)
	{
		var lanRoot = getLanguageRoot(languageName, canCreate, localRoot);
		if (lanRoot)
			return Object.setCascadeFieldValue(cascadeName, value, lanRoot, canCreate);
		else
			return false;
	}

	var locModuleNames = [];
	var currLocModuleName;
	var saveLocModuleInfo = !!($root || $root.window).__kekuleMarkLocalizationModuleInfo__;  // set this extra global var to true to save module information
	var locModuleInfo = {};
	function setCurrLocalizationModule(moduleName)
	{
		currLocModuleName = moduleName;
		if (locModuleNames.indexOf(moduleName) < 0)
			locModuleNames.push(moduleName);
	}
	function getLocModuleRootObj(moduleName, canCreate)
	{
		var moduleName = moduleName || 'GLOBAL';
		var result = Object.getCascadeFieldValue(moduleName, locModuleInfo);
		if (!result && canCreate)
			result = Object.setCascadeFieldValue(moduleName, {}, locModuleInfo, true);
		return result;
	}
	function getLocalizationModuleNames()
	{
		return locModuleNames;
	}

	function addLocalizationResources(languageName, resourceName, resources, localRoot)
	{
		if (!resources)
			return;
		var oldValue = getLocalizationValueOfLan(resourceName, languageName, localRoot);
		var newValue;
		if (!oldValue)
			newValue = JSON.parse(JSON.stringify(resources));  // force deep clone
		else
			newValue = Object.extendEx(oldValue, resources, {'cascade': true});
		setLocalizationValueOfLan(resourceName, newValue, languageName, true, localRoot);

		/*
		if (saveLocModuleInfo)
		{
			var moduleName = currLocModuleName || 'GLOBAL';
			var cascadeName = moduleName + '.' + resourceName;
			var fieldNames = []; //resources.getOwnPropertyNames();
			for (var fname in resources)
			{
				if (resources.hasOwnProperty(fname) && (typeof(resources[fname]) != 'function'))
					fieldNames.push(fname);
			}
			var oldValues = Object.getCascadeFieldValue(cascadeName, locModuleInfo);
			if (!oldValues)
				Object.setCascadeFieldValue(cascadeName, fieldNames, locModuleInfo, true);
			else
				Object.setCascadeFieldValue(cascadeName, oldValues.concat(fieldNames), locModuleInfo, true);
		}
		*/
	}
	function getLocalizationModuleInfos()
	{
		return locModuleInfo;
	}

	/** Short cut to get localization value */
	Kekule.$L = getLocalizationValue;
	Kekule.Localization.getLanguages = getLanguages;
	Kekule.Localization.getValue = getLocalizationValue;
	Kekule.Localization.findValue = findLocalizationValue;

	Kekule.Localization.getModuleInfos = getLocalizationModuleInfos;
	Kekule.Localization.setCurrModule = setCurrLocalizationModule;
	Kekule.Localization.getModuleNames = getLocalizationModuleNames;

	Kekule.Localization.addResource = function(languageName, resourceName, resources)
	{
		addLocalizationResources(languageName, resourceName, resources);
		if (saveLocModuleInfo)
		{
			var root = getLocModuleRootObj(currLocModuleName, true);
			addLocalizationResources(languageName, resourceName, resources, root);
		}
	}
})(this);