/**
 * Defines root namespace of Kekule.js.
 */

/**
 * @namespace
 * @description Root namespace of Kekule library.
 */
var Kekule = {
	LIBNAME: 'Kekule.js',
	LIBNAME_CORE: 'Kekule',
	VERSION: '0.9.3.19090200',
	/**
	 * A flag that indicate whether all essential Kekule modules are loaded into document.
	 * @ignore
	 */
	LOADED: false,
	/**
	 * An array of functions that need be called after load all Kekule modules.
	 * @private
	 */
	_afterLoadSysProcedures: [],
	/**
	 * An array of user functions that need be called after load all Kekule modules.
	 * @private
	 */
	_afterLoadUserProcedures: [],
	// Whether auto find title and description text for object property
	/** @ignore */
	PROP_AUTO_TITLE: true
};

/**
 * Called when all essential modules is loaded.
 * User should not call this function directly.
 * @private
 */
Kekule._loaded = function()
{
	if (Kekule.LOADED)
		return;
	Kekule.LOADED = true;
	var procs = Kekule._afterLoadSysProcedures;
	while (procs.length)
	{
		var proc = procs.shift();
		if (proc)
			proc();
	}

	var procs = Kekule._afterLoadUserProcedures;
	while (procs.length)
	{
		var proc = procs.shift();
		if (proc)
			proc();
	}

	// at last try fire a custom event
	var doc = Kekule.$jsRoot && Kekule.$jsRoot.document;
	if (doc && doc.createEvent && doc.body && doc.body.dispatchEvent)
	{
		var event = doc.createEvent('Event');
		event.initEvent('kekuleload', true, true);
		doc.body.dispatchEvent(event);
	}
};
/**
 * Return whether the whole lib is loaded.
 * @returns {boolean}
 * @private
 */
Kekule._isLoaded = function()
{
	return Kekule.LOADED;
};
/**
 * Register system procedure that need to be called after all modules are loaded.
 * User should not call this method directly.
 * @param {Func} proc
 * @private
 */
Kekule._registerAfterLoadSysProc = function(proc)
{
	if (proc)
	{
		if (Kekule.LOADED)
			proc();
		else
			Kekule._afterLoadSysProcedures.push(proc);
	}
};
/**
 * Register procedure that need to be called after all modules are loaded and all initial operations has been done.
 * @param {Func} proc
 * @private
 */
Kekule._ready = function(proc)
{
	if (proc)
	{
		if (Kekule.LOADED)
			proc();
		else
			Kekule._afterLoadUserProcedures.push(proc);
	}
};
Kekule._registerAfterLoadProc = Kekule._ready;  // for backward

/**
 * Root object of JavaScript environment, usually window.
 */
Kekule.$jsRoot = this;

if (typeof(self) === 'object')
	Kekule.$jsRoot = self;
else if (typeof(window) === 'object' && window.document)
	Kekule.$jsRoot = window;
else if (typeof(global) === 'object')  // node env
	Kekule.$jsRoot = global;

Kekule.$jsRoot.Kekule = Kekule;

/**
 * Root document of JavaScript environment.
 * Can be null in Node.js.
 */
Kekule.$document = this.document || null;

if (!Kekule.scriptSrcInfo)  // scriptSrcInfo maybe set already in node.js environment
{
	Kekule.scriptSrcInfo = Kekule.$jsRoot['__$kekule_load_info__'];
}
if (Kekule.scriptSrcInfo && Kekule.scriptSrcInfo.language)  // force Language
{
	Kekule.language = Kekule.scriptSrcInfo.language;
}
if (!Kekule.scriptSrcInfo && Kekule.$jsRoot.document)  // script info not found, may be use Kekule.min.js directly
{
	Kekule.scriptSrcInfo = (function ()
	{
		var entranceSrc = /^(.*\/?)kekule\..*\.js(\?.*)?$/;
		var scriptElems = document.getElementsByTagName('script');
		var loc;
		for (var i = scriptElems.length - 1; i >= 0; --i)
		{
			var elem = scriptElems[i];
			if (elem.src)
			{
				var matchResult = elem.src.match(entranceSrc);
				if (matchResult)
				{
					var pstr = matchResult[2];
					if (pstr)
						pstr = pstr.substr(1);  // eliminate starting '?'
					var result = {
						'src': elem.src,
						'path': matchResult[1],
						'paramStr': pstr,
						'useMinFile': true
					};
					return result;
				}
			}
		}
		return null;
	})();
}

Kekule.getScriptPath = function()
{
	return Kekule.scriptSrcInfo.path;
};
Kekule.getScriptSrc = function()
{
	return Kekule.scriptSrcInfo.src;
};
Kekule.getStyleSheetPath = function()
{
	//var cssFileName = 'themes/default/kekule.css';
	var cssPath;
	var scriptInfo = Kekule.scriptSrcInfo;
	if (scriptInfo.useMinFile)
		cssPath = scriptInfo.path;
	else
		cssPath = scriptInfo.path + 'widgets/';
	return cssPath;
};
Kekule.getStyleSheetUrl = function()
{
	var path = Kekule.getStyleSheetPath();
	return path + 'themes/default/kekule.css';
};

if (Kekule.$jsRoot && Kekule.$jsRoot.addEventListener && Kekule.$jsRoot.postMessage)
{
	// response to special message, returns Kekule sys info.
	// This query is usually requested by browser addon to check
	// if Kekule lib is loaded into a web page
	Kekule.$jsRoot.addEventListener('message', function(event)
	{
		if (event.data === 'kekule-sys-info-query')
		{
			Kekule.$jsRoot.postMessage({
				'msg': 'kekule-sys-info-result',
				'libName': Kekule.LIBNAME,
				'version': Kekule.VERSION
				//'scriptSrcInfo': Kekule.scriptSrcInfo
			}, '*');
		}
	}, false);
}

/**
 * A namespace for development tools.
 * @namespace
 */
Kekule.Dev = {};

// Also store Class/ClassEx/ObjectEx/DataType in Kekule namespace
/** @ignore */
Kekule.Class = Class;
Kekule.ClassEx = ClassEx;
Kekule.ObjectEx = ObjectEx;
Kekule.DataType = DataType;