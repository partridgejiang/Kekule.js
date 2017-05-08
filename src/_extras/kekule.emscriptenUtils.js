/**
 * @fileoverview
 * Helper method to communicate with Emscripten/embind.
 * @author Partridge Jiang
 */

/*
 * requires /core/kekule.common.js
 * requires /xbrowsers/kekule.x.js
 */

(function($root) {
/** ignore */
Kekule.EmscriptenUtils = {
	/** @private */
	DEF_MODULE_NAME: 'Module',
	/** @private */
	_createdModules: {},
	_getActualModule: function(moduleName)
	{
		return $root[moduleName || EU.DEF_MODULE_NAME];
	},
	isSupported: function(moduleName)
	{
		return (typeof(EU._getActualModule(moduleName)) !== 'undefined');
	},
	getRootModule: function(moduleName, creationOptions)
	{
		// if already created, returns
		var name = EU._getActualModule(moduleName);
		var result = EU._createdModules[name];
		if (result)
		{
			return result;
		}

		// else try to create
		var m = EU._getActualModule(moduleName);
		result = m;
		if (typeof(m) === 'function')  // compiled with modularized option
		{
			result = m(creationOptions);
			EU._createdModules[name] = result;
		}
		return result;
	},
	getModuleObj: function(moduleNameOrObj)
	{
		if (typeof(moduleNameOrObj) === 'object')
			return moduleNameOrObj;
		else
			return EU.getRootModule(moduleNameOrObj);
	},
	getClassCtor: function(className, moduleNameOrObj)
	{
		/*
		if (Kekule.EmscriptenUtils.isSupported(moduleName))
			return EU.getRootModule(moduleName)[className];
		else
			return undefined;
		*/
		return (EU.getModuleObj(moduleNameOrObj) || {}) [className];
	},
	cwrap: function(funcName, retType, inTypes, moduleNameOrObj)
	{
		/*
		if (Kekule.EmscriptenUtils.isSupported(moduleName))
			return EU.getRootModule(moduleName).cwrap(funcName, retType, inTypes);
		else
			return null;
		*/
		var m = EU.getModuleObj(moduleNameOrObj);
		return (m && m.cwrap && m.cwrap(funcName, retType, inTypes));
	},

	/**
	 * Load an emscripten script file. When ready, callback() will be called
	 * @param {String} url
	 * @param {Func} callback
	 * @param {Object} doc
	 */
	loadScript: function(url, callback, doc)
	{
		if (!doc)
			doc = document;
		Kekule.ScriptFileUtils.appendScriptFile(doc, url, callback);
	}
};

var EU = Kekule.EmscriptenUtils;

// install error message log handler to Module
/*
if (typeof(Module) === 'undefined')
	Module = {};
Module = Object.extend(Module, {
	'preRun': function()
	{
		console.log('Me called');
		FS.init(
			null,
			function(x) {console.log('[OUTPUT]', x);},
			function(x) {Kekule.error('CUSTOM ERR', x); }
		);
	}
});
*/


})(this);