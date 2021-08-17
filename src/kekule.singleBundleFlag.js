/**
 * A special JS file that need to be compressed into kekule.min.js, indicating this is the single bundle.
 */

(function() {
	var $root;
	if (typeof (self) === 'object')
		$root = self;
	else if (typeof (window) === 'object' && window && window.document)
		$root = window;
	else if (typeof (global) === 'object')  // node env
		$root = global;
	$root.__$kekule_single_min_bundle__ = true;
})();