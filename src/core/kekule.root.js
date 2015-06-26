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
	VERSION: '0.6.0',
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
var $jsRoot = this;

Kekule.scriptSrcInfo = $jsRoot['__$kekule_load_info__'];

Kekule.getScriptPath = function()
{
	return Kekule.scriptSrcInfo.path;
}

if ($jsRoot && $jsRoot.addEventListener && $jsRoot.postMessage)
{
	// response to special message, returns Kekule sys info.
	// This query is usually requested by browser addon to check
	// if Kekule lib is loaded into a web page
	$jsRoot.addEventListener('message', function(event)
	{
		if (event.data === 'kekule-sys-info-query')
		{
			$jsRoot.postMessage({
				'msg': 'kekule-sys-info-result',
				'libName': Kekule.LIBNAME,
				'version': Kekule.VERSION
				//'scriptSrcInfo': Kekule.scriptSrcInfo
			}, '*');
		}
	}, false);
}
