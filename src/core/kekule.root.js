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
	VERSION: '0.7.6.17110500',
	/**
	 * A flag that indicate whether all essential Kekule modules are loaded into document.
	 * @ignore
	 */
	LOADED: false,
	/**
	 * An array of functions that need be called after load all Kekule modules.
	 * @private
	 */
	_afterLoadProcedures: [],
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
	Kekule.LOADED = true;
	var procs = Kekule._afterLoadProcedures;
	while (procs.length)
	{
		var proc = procs.shift();
		if (proc)
			proc();
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
 * Register procedure that need to be called after all modules are loaded.
 * @param {Func} proc
 * @private
 */
Kekule._registerAfterLoadProc = function(proc)
{
	if (proc)
		Kekule._afterLoadProcedures.push(proc);
};

/**
 * Root object of JavaScript environment, usually window.
 */
Kekule.$jsRoot = this;
/**
 * Root document of JavaScript environment.
 * Can be null in Node.js.
 */
Kekule.$document = this.document || null;

Kekule.scriptSrcInfo = Kekule.$jsRoot['__$kekule_load_info__'];
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
