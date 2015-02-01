/**
 * @fileoverview
 * Helper method to communicate with Emscripten/embind.
 * @author Partridge Jiang
 */

/*
 * requires /core/kekule.common.js
 * requires /xbrowsers/kekule.x.js
 */

(function() {
/** ignore */
Kekule.EmscriptenUtils = {
	isSupported: function()
	{
		return (typeof(Module) !== 'undefined');
	},
	getRootModule: function()
	{
		return Module;
	},
	getClassCtor: function(className)
	{
		if (Kekule.EmscriptenUtils.isSupported())
			return EU.getRootModule()[className];
		else
			return undefined;
	}
}

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


})();