module.exports = (function() {
	var $root;
	if (typeof (window) === 'object' && window && window.document)  // browser
		$root = window;
	else if (typeof (global) === 'object')  // node env
		$root = global;
	else if (typeof (self) === 'object')
		$root = self;

	if (!$root)
		$root = this;

	if (!$root._kekule_environment_)
		$root._kekule_environment_ = {};

	var $env = $root._kekule_environment_;

	function setEnvFromModuleUrl(env, moduleUrl, modulePath)
	{
		var u = new URL(moduleUrl);
		//var src = (u.origin || '') + (u.pathname || '');
		var pos = u.pathname.lastIndexOf('/');
		var path = modulePath? modulePath:
			((u.protocol.startsWith('file'))?	(u.protocol + '//'): (u.origin || '')) + ((pos < u.pathname.length)? u.pathname.substring(0, pos + 1): u.pathname);
		var src = (path || '') + 'kekule.js';   // always use this as the entrance js name
		env.scriptSrc = src;
		env.scriptPath = path;
	}

	var moduleUrl = __filename;  // a special tag, to be replaced with actual url getter code like 'import.meta.url' or '__filename';
	var modulePath = __dirname + "/";  // a special tag, to be replaced with actual path getter code like '__dirname';
	if (moduleUrl || modulePath)
	{
		setEnvFromModuleUrl($env, moduleUrl, modulePath);
	}
	$env.manualLoadScriptFiles = true;

	return function() {   // a function to returns object need to be exported by Kekule
		var exportedObjs = {
			'Kekule': $root.Kekule,
			'ObjectEx': $root.ObjectEx,
			'ClassEx': $root.ClassEx,
			'Class': $root.Class,
			'DataType': $root.DataType
		}
		return exportedObjs;
	};
})();