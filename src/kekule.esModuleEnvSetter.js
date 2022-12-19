/**
 * A special JS file that need pass the module url to kekule environment.
 */
export default (function() {
	var $root;
	if (typeof (self) === 'object')
		$root = self;
	else if (typeof (window) === 'object' && window && window.document)
		$root = window;
	else if (typeof (global) === 'object')  // node env
		$root = global;

	if (!$root)
		$root = this;

	if (!$root._kekule_environment_)
		$root._kekule_environment_ = {};

	var $env = $root._kekule_environment_;

	function setEnvFromModuleUrl(env, moduleUrl)
	{
		var u = new URL(moduleUrl);
		//var src = (u.origin || '') + (u.pathname || '');
		var pos = u.pathname.lastIndexOf('/');
		var path = (u.origin || '') + ((pos < u.pathname.length)? u.pathname.substring(0, pos + 1): u.pathname);
		var src = path + 'kekule.js';   // always use this as the entrance js name
		env.scriptSrc = src;
		env.scriptPath = path;
	}

	var moduleUrl = import.meta.url;
	if (moduleUrl)
	{
		setEnvFromModuleUrl($env, moduleUrl);
	}
	$env.manualLoadScriptFiles = true;

	return function(ops) {
		if (ops)
		{
			var keys = Object.getOwnPropertyNames(ops);
			for (var i = 0, l = keys.length; i < l; ++i)
			{
				if (keys[i] === 'moduleUrl')  // allow to set script src from function caller
				{
					setEnvFromModuleUrl($env, ops[keys[i]]);
				}
				else
					$env[keys[i]] = ops[keys[i]];
			}
		}
	};
})();