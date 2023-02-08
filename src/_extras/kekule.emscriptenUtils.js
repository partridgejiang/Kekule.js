/**
 * @fileoverview
 * Helper method to communicate with Emscripten/embind.
 * @author Partridge Jiang
 */

/*
 * requires /core/kekule.common.js
 * requires /xbrowsers/kekule.x.js
 */

(function($init_root) {

var	$root = Kekule.$jsRoot || $init_root;  // this may be undefined in JS module, so we use Kekule.$jsRoot as default
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
		var result = EU._createdModules[moduleName];
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
		}
		if (result)
			EU._createdModules[moduleName] = result;

		return result;
	},
	setRootModule: function(moduleName, module)
	{
		EU._createdModules[moduleName] = module;
	},
	getModuleObj: function(moduleNameOrObj)
	{
		if (typeof(moduleNameOrObj) === 'object')
			return moduleNameOrObj;
		else
			return EU.getRootModule(moduleNameOrObj);
	},
	getMember: function(name, moduleNameOrObj)
	{
		return (EU.getModuleObj(moduleNameOrObj) || {}) [name];
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
	 * Init an emscripten module, when the runtime is ready, callback() will be called.
	 * @param {HTMLDocument} doc
	 * @param {Hash} options
	 * @param {Func} callback
	 */
	initModule: function(doc, options, callback)
	{
		if (!doc)
			doc = Kekule.$jsRoot.document;
		var moduleName = options.moduleName;
		var moduleInitEventName = options.moduleInitEventName;
		var moduleInitCallbackName = options.moduleInitCallbackName;
		var creationOptions = options.creationOptions;
		var callCallback = function(error)
		{
			if (callback)
				callback(error);
		};

		if (EU.isModuleReady(moduleName))  // module already inited
		{
			callCallback();
			return;
		}

		try
		{
			if (moduleInitEventName && doc && Kekule.X)
			{
				var reactLoadEvent = function() {
					callCallback();
					Kekule.X.Event.removeListener(doc, moduleInitEventName, reactLoadEvent);  // ensure call only once
					//console.log('EModule inited', moduleInitEventName);
				};
				// listen to module inited event
				Kekule.X.Event.addListener(doc, moduleInitEventName, reactLoadEvent);
			}
			else if (moduleInitCallbackName)
			{
				Kekule.$jsRoot[moduleInitCallbackName] = function() {
					callCallback();
				};
			}
			if (moduleName)
			{
				EU.getRootModule(moduleName, creationOptions);  // ensure the module is actually created and registered
			}
		}
		catch(e)
		{
			callCallback(e);
			throw e;
		}
	},

	/**
	 * Check if a em module is ready.
	 * @param {String} moduleName
	 * @returns {Bool}
	 */
	isModuleReady: function(moduleName)
	{
		return !!EU._createdModules[moduleName];
	},
	/**
	 * Ensure module is loaded and runtime is built.
	 * @param {HTMLDocument} doc
	 * @param {Hash} options
	 * @param {Func} callback
	 */
	ensureModuleReady: function(doc, options, callback)
	{
		return EU.initModule(doc, options, callback);
	},

	/**
	 * Load an emscripten script file. When script is loaded and runtime is initialized, callback() will be called
	 * @param {String} url
	 * @param {Func} callback
	 * @param {Object} doc
	 * @param {Hash} options
	 */
	loadScript: function(url, callback, doc, options)
	{
		if (!doc)
			doc = Kekule.$jsRoot.document;

		/*
		var moduleName = options.moduleName;
		var moduleInitEventName = options.moduleLoadEventName;
		var moduleInitCallbackName = options.moduleInitCallbackName;
		var callCallback = function()
		{
			if (callback)
				callback();
		};
		var done = function()
		{
			// when script is loaded, some initialization process should be done
			if (moduleInitEventName && doc)
			{
				var reactLoadEvent = function(){
					callCallback();
					Kekule.X.Event.removeListener(doc, moduleInitEventName, reactLoadEvent);  // ensure call only once
					console.log('EModule inited', moduleInitEventName);
				};
				// listen to module inited event
				Kekule.X.Event.addListener(doc, moduleInitEventName, reactLoadEvent);
			}
			else if (moduleInitCallbackName)
			{
				Kekule.$jsRoot[moduleInitCallbackName] = function() { callCallback();};
			}
			if (moduleName)
			{
				EU.getRootModule(moduleName);  // ensure the module is actually created
			}
		};
		*/
		var done = function(error)
		{
			if (error)
				callback(error);
			else  // success
				EU.initModule(doc, options, callback);
		};

		//console.log('module', Kekule.scriptSrcInfo.nodeModule);
		if (Kekule.environment.isNode)  // in node environment, the emscripten file should be loaded by "require" rather than other methods
		{
			try
			{
				var m = Kekule.environment.nodeRequire(url);
				if (options.moduleName)
				{
					/*
					if (m && typeof (m) === 'function')
					{
						Kekule.$jsRoot[options.moduleName] = m();
					}
					else
					{
						Kekule.$jsRoot[options.moduleName] = m;
					}
					//EU._createdModules[options.moduleName] = Kekule.$jsRoot[options.moduleName];  // register this module
					*/
					Kekule.$jsRoot[options.moduleName] = m;
				}
				done();
			}
			catch(e)
			{
				done(e);
				throw e;
			}
		}
		else
		{
			Kekule.ScriptFileUtils.appendScriptFile(doc, url, done);
		}
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