/**
 * @fileoverview
 * Some system functions of Kekule widget lib.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /widget/kekule.widget.base.js
 * requires /xbrowsers/kekule.x.js
 */

(function(){
"use strict";

/** @ignore */
var _FontDetector = function() {
	// a font will be compared against all the three default fonts.
	// and if it doesn't match all 3 then that font is not available.
	var baseFonts = ['monospace', 'sans-serif', 'serif'];

	//we use m or w because these two characters take up the maximum width.
	// And we use a LLi so that the same matching fonts can get separated
	var testString = "mmmmmmmmmmlli";

	//we test using 72px font size, we may use any size. I guess larger the better.
	var testSize = '72px';

	var h = document.getElementsByTagName("body")[0];

	// create a SPAN in the document to get the width of the text we use to test
	var s = document.createElement("span");
	s.style.fontSize = testSize;
	s.innerHTML = testString;
	var defaultWidth = {};
	var defaultHeight = {};
	for (var index in baseFonts) {
		//get the default width for the three base fonts
		s.style.fontFamily = baseFonts[index];
		h.appendChild(s);
		defaultWidth[baseFonts[index]] = s.offsetWidth; //width for the default font
		defaultHeight[baseFonts[index]] = s.offsetHeight; //height for the defualt font
		h.removeChild(s);
	}

	function detect(font) {
		var detected = false;
		for (var index in baseFonts) {
			s.style.fontFamily = font + ',' + baseFonts[index]; // name of the font along with the base font for fallback.
			h.appendChild(s);
			var matched = (s.offsetWidth != defaultWidth[baseFonts[index]] || s.offsetHeight != defaultHeight[baseFonts[index]]);
			h.removeChild(s);
			detected = detected || matched;
		}
		return detected;
	}

	this.detect = detect;
};
var _fontDetector;

/**
 * A util class to detect if a font is available in browser.
 * The detection method is borrowed from http://www.lalit.org/lab/javascript-css-font-detect/.
 * @class
 */
Kekule.Widget.FontDetector = {
	/**
	 * Check if a font family is available in browser.
	 * @param {String} fontFamily
	 * @returns {Bool}
	 */
	detect: function(fontFamily)
	{
		var d = _fontDetector;
		if (!d)
		{
			d = new _FontDetector();
			_fontDetector = d;
		}
		return d.detect(fontFamily);
	}
};

var _defFontList = [
	'Arial, Helvetica, sans-serif',
	'Georgia, Times New Roman, Times, serif',
	'Courier New, Courier, monospace',
	'Tahoma, Geneva, sans-serif',
	'Trebuchet MS, Arial, Helvetica, sans-serif',
	'Arial Black, Gadget, sans-serif',
	'Palatino Linotype, Book Antiqua, Palatino, serif',
	'Lucida Sans Unicode, Lucida Grande, sans-serif',
	'MS Serif, New York, serif',
	'Lucida Console, Monaco, monospace',
	'Comic Sans MS, cursive'
];
/**
 * A util class to list a set of fonts available for Kekule widget system.
 * @class
 */
Kekule.Widget.FontEnumerator = {
	/**
	 * Returns a list of available fonts in browser out of candidateFonts.
	 * If candidateFonts is not set, a default font set will be used.
	 * @param {Array} candidateFonts
	 * @returns {Array}
	 */
	getAvailableFontFamilies: function(candidateFonts)
	{
		if (!candidateFonts)
			candidateFonts = _defFontList;
		var result = [];
		for (var i = 0, l = candidateFonts.length; i < l; ++i)
		{
			var fn = candidateFonts[i];
			if (Kekule.Widget.FontDetector.detect(fn))
				result.push(fn);
		}
		return result;
	}
};

})();