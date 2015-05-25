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
	// Whether auto find title and description text for object property
	/** @ignore */
	PROP_AUTO_TITLE: true
};

/**
 * Root object of JavaScript environment, usually window.
 */
var $jsRoot = this;

Kekule.scriptSrcInfo = $jsRoot['__$kekule_load_info__'];

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
