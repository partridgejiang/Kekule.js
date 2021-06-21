/**
 * @fileoverview
 * Utility functions about HTML DOM, Styles and so on.
 * This file is splitted from kekule.domUtils.js
 * @author Partridge Jiang
 */

(function(){

/**
 * Util methods about CSS and style values.
 * @object
 */
Kekule.StyleUtils = {
	/**
	 * Remove a property from inline style.
	 * @param {Object} style Inline style object if element.
	 * @param {String} propName
	 */
	removeStyleProperty: function(style, propName)
	{
		if (style.removeProperty)
			style.removeProperty(propName);
		else if (style.removeAttribute)
			style.removeAttribute(propName);
		else
			style[propName] = null;
	},
	/**
	 * Split a units value to {value, units} hash.
	 * @param {String} value
	 * @returns {Hash}
	 */
	analysisUnitsValue: function(value)
	{
		var r = {};
		r.total = value;
		r.value = parseFloat(value);
		var sunit;
		if (value && value.length && (r.value !== undefined) && (!isNaN(r.value)))
		{
			sunit = '';
			for (var i = value.length - 1; i >= 0; --i)
			{
				var c = value.charAt(i);
				var isDigital = (c >= '0') && (c <= '9');
				if ((!isDigital) && (c !== '.') && (c !== '-'))
					sunit = c + sunit;
			}
		}
		r.units = sunit || '';
		return r;
	},
	/**
	 * Multiple a units string value.
	 * @param {String} value
	 * @param {Num} times
	 * @returns {String}
	 */
	multiplyUnitsValue: function(value, times)
	{
		var v = Kekule.StyleUtils.analysisUnitsValue(value);
		v.value *= times;
		return '' + v.value + v.units;
	},
	/**
	 * Turn a #RRGGBB or #RGB style string to a integer value.
	 * @param {String} str
	 * @returns {Int}
	 * @deprecated
	 */
	colorStrToValue: function(str)
	{
		/*
		var isLongFormat = str.length > 4;
		var sR = isLongFormat? str.substr(1, 2): str.substr(1, 1);
		var sG = isLongFormat? str.substr(3, 2): str.substr(2, 1);
		var sB = isLongFormat? str.substr(5, 2): str.substr(3, 1);
		if (!isLongFormat)
		{
			sR += sR;
			sG += sG;
			sB += sB;
		}
		var result = (parseInt(sR, 16) << 16) + (parseInt(sG, 16) << 8) + parseInt(sB, 16);
		return result;
		*/
		var v = Kekule.StyleUtils.analysisCssColor(str, true);
		var result = (Math.round(v.r) << 16) + (Math.round(v.g) << 8) + (Math.round(v.b));
		return result;
	},
	/**
	 * Convert CSS #RRGGBB(AA) or #RGB or rgb/rgba() or hsl/hsla() style string into a hash.
	 * @param {String} str
	 * @param {Bool} convertToRgb Whether convert HSL values to RGB.
	 * @returns {Hash} A hash with {r, g, b, a}.
	 */
	analysisCssColor: function(str, convertToRgb)
	{
		var SU = Kekule.StyleUtils;
		var s = (str || '').toLowerCase();
		if (s.indexOf('#') === 0)  // #RGB or #RRGGBB
		{
			var sHex = s.substr(1);
			return SU._analyisCssColorHex(sHex);
		}
		else if (s.indexOf('rgb') === 0)  // rgb() or rgba()
		{
			var i1 = s.indexOf('(');
			var i2 = s.indexOf(')');
			if (i1 < 0 || i2 < 0)  // not a legal value
				return null;
			// extract the values inside ()
			return SU._analysisCssColorRgbOrHsl(s.substring(i1 + 1, i2), false);
		}
		else if (s.indexOf('hsl') === 0)  // hsl or hsla
		{
			var i1 = s.indexOf('(');
			var i2 = s.indexOf(')');
			if (i1 < 0 || i2 < 0)  // not a legal value
				return null;
			// extract the values inside ()
			var result = SU._analysisCssColorRgbOrHsl(s.substring(i1 + 1, i2), true);
			if (convertToRgb)
			{
				result = Object.extend(result, SU._convertHslToRgb(result));  // preseve alpha value
			}
			return result;
		}
		else
			return null;
	},
	/** @private */
	_analyisCssColorHex: function(sHex)
	{
		var l = sHex.length;
		var isCompact = (l === 3);  // Check if in #RGB mode
		var partLength = isCompact? 1: 2;
		var partCount = Math.min(4, Math.floor(l / partLength));  // max part count is 4 in #RRGGBBAA
		var splitted = [];
		for (var i = 0; i < partCount; ++i)
		{
			var currIndex = i * partLength;
			var sPart = sHex.substr(currIndex, partLength);
			if (isCompact)
				sPart += sPart;
			splitted.push(parseInt(sPart, 16));
		}
		var result = {'r': splitted[0] || 0, 'g': splitted[1] || 0, 'b': splitted[2] || 0};
		if (Kekule.ObjUtils.notUnset(splitted[3]))
			result.a = splitted[3] / 255;
		else
			result.a = 1;
		return result;
	},
	/** @private */
	_analysisCssColorRgbOrHsl: function(sValues, isHsl)
	{
		var _convertCssNumOrPercentageToNum = Kekule.StyleUtils._convertCssNumOrPercentageToNum;
		var result;
		var splitted = sValues.split(',');
		if (isHsl)
		{
			var hue = _convertCssNumOrPercentageToNum(splitted[0], 360);
			var sat = _convertCssNumOrPercentageToNum(splitted[1]);
			var light = _convertCssNumOrPercentageToNum(splitted[2]);
			result = {'h': hue, 's': sat, 'l': light};
		}
		else  // rgb
		{
			result = {
				'r': _convertCssNumOrPercentageToNum(splitted[0], 255),
				'g': _convertCssNumOrPercentageToNum(splitted[1], 255),
				'b': _convertCssNumOrPercentageToNum(splitted[2], 255)
			};
		}
		if (Kekule.ObjUtils.notUnset(splitted[3]))
			result.a = _convertCssNumOrPercentageToNum(splitted[3]);
		else
			result.a = 1;
		return result;
	},
	/** @private */
	_convertHslToRgb: function(hsl, rgbValueRangeMax)
	{
		if (!rgbValueRangeMax)
			rgbValueRangeMax = 255;
		var h = hsl.h;
		var s = hsl.s;
		var l = hsl.l;
		var r, g, b;
		if (s === 0)  // no saturation, gray
		{
			r = g = b = l;
		}
		else
		{
			var q = (l < 0.5)? (l * (1 + s)): (l + s - l * s);
			var p = 2 * l - q;
			var hk = h / 360;
			var tr = hk + 1/3;
			var tg = hk;
			var tb = hk - 1/3;
			var t3s = [tr, tg, tb];
			for (var i = 0, l = t3s.length; i < l; ++i)
			{
				if (t3s[i] < 0)
				  t3s[i] = t3s[i] + 1;
				else if (t3s[i] > 1)
					t3s[i] = t3s[i] - 1;

				if (6 * t3s[i] < 1)
					t3s[i] = p + (q - p) * 6 * t3s[i];
				else if (2 * t3s[i] < 1)
					t3s[i] = q;
				else if (3 * t3s[i] < 2)
					t3s[i] = p + (q - p) * 6 * (2/3 - t3s[i]);
				else
					t3s[i] = p;
			}
			r = t3s[0], g = t3s[1], b = t3s[2];
		}
		return {'r': r * rgbValueRangeMax, 'g': g * rgbValueRangeMax, 'b': b * rgbValueRangeMax};
	},
	/** @private */
	_convertCssNumOrPercentageToNum: function(sValue, percentageRangeMax)
	{
		var n = parseFloat(sValue) || 0;
		if (sValue.endsWith('%'))  // percentage
		{
			n = n / 100 * (percentageRangeMax || 1);
		}
		return n;
	},
	/**
	 * Returns computed style of element. If propName not set, all computed result will be returned.
	 * @param {Object} elem
	 * @param {String} propName Can either by in JS('backgroundColor') or CSS('background-color') form.
	 * @returns {Variant}
	 */
	getComputedStyle: function(elem, propName)
	{
		var styles;
		var doc = elem.ownerDocument;
		if (!doc)
			return null;
		var view = doc.defaultView;
		if (view && view.getComputedStyle)
		{
			styles = view.getComputedStyle(elem, null);
		}
		else if (elem.currentStyle)  // IE
		{
			styles = elem.currentStyle;
		}

		if (styles)  // some times IE can not fetch currentStyle
		{
			if (propName)
			{
				var inCssForm = (propName.indexOf('-') >= 0);
				if (inCssForm && styles.getPropertyValue)
					return styles.getPropertyValue(propName);
				else
					return styles[propName];
			}
			else  // return while style object
				return styles;
		}
		else
		{
			return null;
		}
	},

	/**
	 * Check if element is likely to be visible on page (only display and visibility style are checked).
	 * @param {HTMLElement} elem
	 * @returns {Bool}
	 */
	isShown: function(elem)
	{
		var U = Kekule.StyleUtils;
		return (U.isDisplayed(elem) && U.isVisible(elem));
	},

	/**
	 * Check if element's CSS display property is not set to 'none'.
	 * @param {HTMLElement} elem
	 * @return {Bool}
	 */
	isDisplayed: function(elem)
	{
		return (Kekule.StyleUtils.getComputedStyle(elem, 'display') || '').toLowerCase() !== 'none';
	},
	/**
	 * Get display style of element.
	 * @param {HTMLElement} elem
	 * @returns (String}
	 */
	getDisplayed: function(elem)
	{
		return Kekule.StyleUtils.getComputedStyle(elem, 'display');
	},
	/**
	 * Set display style of element.
	 * @param {HTMLElement} elem
	 * @param (Variant} value If value is a string, the string will be set to display style.
	 *   If it is a boolean, display style will be set to 'none'/'' on false/true.
	 */
	setDisplay: function(elem, value)
	{
		if (elem)
		{
			if (typeof(value) === 'string')
				elem.style.display = value;
			else
				elem.style.display = (!!value) ? '' : 'none';
		}
	},

	/**
	 * Check if element's CSS visibility property is not set to 'hidden'.
	 * @param {HTMLElement} elem
	 * @return {Bool}
	 */
	isVisible: function(elem)
	{
		return (Kekule.StyleUtils.getComputedStyle(elem, 'visibility') || '').toLowerCase() !== 'hidden';
	},
	/**
	 * Get visibility style of element.
	 * @param {HTMLElement} elem
	 * @returns (String}
	 */
	getVisibility: function(elem)
	{
		return Kekule.StyleUtils.getComputedStyle(elem, 'visibility');
	},
	/**
	 * Set visibility style of element.
	 * @param {HTMLElement} elem
	 * @param (Variant} value If value is a string, the string will be set to visibility style.
	 *   If it is a boolean, visibility style will be set to 'hidden'/'' on false/true.
	 */
	setVisibility: function(elem, value)
	{
		if (elem)
		{
			if (typeof(value) === 'string')
				elem.style.visibility = value;
			else
				elem.style.visibility = (!!value) ? '' : 'hidden';
		}
	},

	/**
	 * Returns whether the element generates a block element box.
	 * @param {HTMLElement} elem
	 * @returns {Bool}
	 */
	isBlockElem: function(elem)
	{
		var display = Kekule.StyleUtils.getComputedStyle(elem, 'display');
		return ['block', 'list-item', 'table', 'flex', 'grid'].indexOf(display) >= 0;
	},

	/**
	 * Check if an element is set with absolute or fixed position style.
	 * @param {HTMLElement} elem
	 * @returns {Bool}
	 */
	isAbsOrFixPositioned: function(elem)
	{
		var position = Kekule.StyleUtils.getComputedStyle(elem, 'position') || '';
		position = position.toLowerCase();
		return (position === 'absolute') || (position === 'fixed');
	},
	/** @private */
	_fillAbsOrFixedPositionStyleStack: function(elem, stack)
	{
		if (Kekule.DomUtils.isElement(elem))  // if elem is not readlly an element (e.g., shadowRoot), bypass the style compute to avoid error
		{
			var position = Kekule.StyleUtils.getComputedStyle(elem, 'position') || '';
			position = position.toLowerCase();
			if ((position === 'absolute') || (position === 'fixed'))
			{
				stack.push(position.toLocaleLowerCase());
			}
		}
		var parent = elem.parentNode;
		if (parent && parent.ownerDocument)
			Kekule.StyleUtils._fillAbsOrFixedPositionStyleStack(parent, stack);
		return stack;
	},
	/**
	 * Check the ancestors of elem, if one is set to absolute or fixed position,
	 * returns its position style.
	 * @param {HTMLElement} elem
	 * @returns {Bool}
	 */
	isAncestorPositionFixed: function(elem)
	{
		var parent = elem.parentNode;
		if (parent)
		{
			return Kekule.StyleUtils.isSelfOrAncestorPositionFixed(elem);
		}
		else
			return false;
	},
	/**
	 * Check the elem and its ancestor, if one is set to fixed position, result is true.
	 * @param {HTMLElement} elem
	 * @returns {Bool}
	 */
	isSelfOrAncestorPositionFixed: function(elem)
	{
		var positionStack = [];
		Kekule.StyleUtils._fillAbsOrFixedPositionStyleStack(elem, positionStack);
		if (!positionStack.length)
			return null;
		for (var i = positionStack.length - 1; i >= 0; --i)
		{
			var p = positionStack[i];
			if (p === 'fixed')
				return true;
		}
		return false;
	},

	/**
	 * Set cursor style of an element.
	 * @param {HTMLElement} elem
	 * @param {Variant} cursor A string CSS cursor value or an array of cursor keywords.
	 *   If this param is an array, the first cursor keywords available in current browser will actually be used.
	 * @returns {String} The actually used cursor value.
	 */
	setCursor: function(elem, cursor)
	{
		if (DataType.isArrayValue(cursor))
		{
			for (var i = 0, l = cursor.length; i < l; ++i)
			{
				var currCursor = cursor[i];
				elem.style.cursor = currCursor;
				if (elem.style.cursor === currCursor)  // successfully setted
					return currCursor;
			}
			return elem.style.cursor;
		}
		else // normal string
		{
			elem.style.cursor = cursor;
			return elem.style.cursor;
		}
	},

	/** @private */
	_cssTransformValuesToMatrix: function(cssTransformValues)
	{
		var matrix = Kekule.MatrixUtils.create(3, 3, 0);
		matrix[0][0] = cssTransformValues.a;
		matrix[1][0] = cssTransformValues.b;
		matrix[0][1] = cssTransformValues.c;
		matrix[1][1] = cssTransformValues.d;
		matrix[0][2] = cssTransformValues.tx;
		matrix[1][2] = cssTransformValues.ty;
		return matrix;
	},
	/** @private */
	_matrixToCssTransformValues: function(matrix)
	{
		var result = {
			'a': matrix[0][0],
			'b': matrix[1][0],
			'c': matrix[0][1],
			'd': matrix[1][1],
			'tx': matrix[0][2],
			'ty': matrix[1][2]
		};
		return result;
	},

	/**
	 * Check if an element has a CSS transform.
	 * @param {HTMLElement} elem
	 * @returns {Bool}
	 */
	hasTransform: function(elem)
	{
		var transform = Kekule.StyleUtils.getComputedStyle(elem, 'transform');
		return transform && (transform !== 'none');
	},
	/**
	 * Returns matrix function values of CSS transform property.
	 * @param {HTMLElement} elem
	 * @returns {Hash} {a, b, c, d, tx, ty}
	 */
	getTransformMatrixValues: function(elem)
	{
		var matrix = Kekule.StyleUtils.getComputedStyle(elem, 'transform') || '';
		var values = matrix.match(/-?[\d\.]+/g);
		if (values)
			return {'a': values[0], 'b': values[1], 'c': values[2], 'd': values[3], 'tx': values[4], 'ty': values[5]};
		else
			return null;
	},
	/**
	 * Set the matrix values of CSS transform.
	 * @param {HTMLElement} elem
	 * @param {Array} values
	 */
	setTransformMatrixArrayValues: function(elem, values)
	{
		if (values)
		{
			var sMatrix = 'matrix(' + values.join(',') + ')';
			elem.style.transform = sMatrix;
		}
	},
	/**
	 * Returns a matrix object that represent the 2D transform of element.
	 * @param {HTMLElement} elem
	 * @returns {Array}
	 */
	getTransformMatrix: function(elem)
	{
		var values = Kekule.StyleUtils.getTransformMatrixValues(elem);
		if (values)
		{
			return Kekule.StyleUtils._cssTransformValuesToMatrix(values);
		}
		else
			return null;
	},
	/**
	 * A transformed element may be nested in another transformed parent.
	 * This function returns all the transform matrixes from parent to child.
	 * @param {HTMLElement} elem
	 * @param {Array}
	 */
	getCascadeTranformMatrixes: function(elem)
	{
		var result = [];
		var currElem = elem;
		while (currElem)
		{
			if (currElem.nodeType === 1)  // Node.ELEMENT_NODE, if not element (e.g., shadow root), bypass to parent
			{
				var m = Kekule.StyleUtils.getTransformMatrix(currElem);
				if (m)
					result.unshift(m);
			}
			currElem = currElem.parentNode;
		}
		return result;
	},
	/**
	 * A transformed element may be nested in another transformed parent.
	 * This function returns product of all those transform matrixes from parent to child.
	 * @param {HTMLElement} elem
	 * @param {Array}
	 */
	getTotalTransformMatrix: function(elem)
	{
		var matrixes = Kekule.StyleUtils.getCascadeTranformMatrixes(elem);
		var result = null;
		// child on left, parent on right
		for (var i = matrixes.length - 1; i >= 0; --i)
		{
			var m = matrixes[i];
			if (!result)
				result = m;
			else
				result = Kekule.MatrixUtils.multiply(result, m);
		}
		return result;
	},
	calcInvertTransformMatrix: function(matrix)
	{
		var transValues = Kekule.StyleUtils._matrixToCssTransformValues(matrix);
		var v = transValues;

		// calc inverted values, algorithm from https://blog.csdn.net/qq_17429661/article/details/51985344
		var det = v.a * v.d - v.b * v.c;
		if (Math.abs(det) < 0.000001)  // Singular Matrix
			return false;  // can not calculate

		var v1 = {
			a: v.d / det,
			b: -v.b / det,
			c: -v.c / det,
			d: v.a / det,
			tx: (v.c * v.ty - v.d * v.tx) / det,
			ty: (v.b * v.tx - v.a * v.ty) / det
		};
		var result = Kekule.StyleUtils._cssTransformValuesToMatrix(v1);

		return result;
	}
};

/**
 * Utils methods for HTML elements.
 * @object
 */
Kekule.HtmlElementUtils = {
	/**
	 * Get classes used by element.
	 * @param {HTMLElement} elem
	 * @returns {Array}
	 */
	getClassNames: function(elem)
	{
		//return Kekule.StrUtils.splitTokens(elem.className || '');  // elem.className may be of SVGAnimatedString when dealing SVG element
		return Kekule.StrUtils.splitTokens(elem.getAttribute('class') || '');
	},
	/**
	 * Check if a class is associate with element.
	 * @param {HTMLElement} elem
	 * @param {String} className
	 * @return {Bool}
	 */
	hasClass: function(elem, className)
	{
		var names = Kekule.HtmlElementUtils.getClassNames(elem);
		return (names.indexOf(className) >= 0);
	},
	/**
	 * Add class name(s) to element.
	 * @param {HTMLElement} elem
	 * @param {Variant} className Can be a simple name, or a series of name separated by space ('name1 name2')
	 * 	or an array of strings.
	 */
	addClass: function(elem, className)
	{
		var U = Kekule.HtmlElementUtils;
		var names = Kekule.ArrayUtils.isArray(className)? className: Kekule.StrUtils.splitTokens(className);
		for (var i = 0, l = names.length; i < l; ++i)
		{
			if (!U.hasClass(elem, names[i]))
				elem.className += ' ' + names[i];
		}
		return U;
	},
	/**
	 * remove class(es) from element.
	 * @param {HTMLElement} elem
	 * @param {Variant} className Can be a simple name, or a series of name separated by space ('name1 name2')
	 * 	or an array of strings.
	 */
	removeClass: function(elem, className)
	{
		var U = Kekule.HtmlElementUtils;
		var removedNames = Kekule.ArrayUtils.isArray(className)? className: Kekule.StrUtils.splitTokens(className);
		var names = U.getClassNames(elem);
		for (var i = names.length; i >= 0; --i)
		{
			var index = removedNames.indexOf(names[i]);
			if (index >= 0)
				names.splice(i, 1);
		}
		elem.className = names.join(' ');
		return U;
	},
	/**
	 * Toggle class(es) from element.
	 * @param {HTMLElement} elem
	 * @param {Variant} className Can be a simple name, or a series of name separated by space ('name1 name2')
	 * 	or an array of strings.
	 */
	toggleClass: function(elem, className)
	{
		var U = Kekule.HtmlElementUtils;
		var names = Kekule.ArrayUtils.isArray(className)? className: Kekule.StrUtils.splitTokens(className);
		for (var i = 0, l = names.length; i < l; ++i)
		{
			if (U.hasClass(elem, names[i]))
				U.removeClass(elem, names[i]);
			else
				U.addClass(elem, names[i]);
		}
		return U;
	},

	/**
	 * Returns text (without tag) inside an element.
	 * @param {HTMLElement} elem
	 * @returns {String}
	 */
	getInnerText: function(elem)
	{
		/*
		if (elem.innerText)  // IE
			return elem.innerText;
		else
		{
			var children = elem.children;
			for (var i = 0, l = children.length; i < l; ++i)
			{
				var node = children[i];
				if (node.nodeType === Node.textContent)
			}
		}
		*/
		return elem.innerText || elem.textContent;
	},

	/**
	 * Resize a HTML element.
	 * @param {HTMLElement} elem
	 * @param {Number} width
	 * @param {Number} height
	 * @param {String} unit Default is px.
	 */
	resizeElem: function(elem, width, height, unit)
	{
		elem.style.width = width + (unit || 'px');
		elem.style.height = height + (unit || 'px');
	},
	/**
	 * Get element client width and height.
	 * @param {HTMLElement} elem
	 * @returns {Hash} A combination of {width, height}, in px.
	 */
	getElemClientDimension: function(elem)
	{
		return {'width': elem.clientWidth, 'height': elem.clientHeight};
	},
	/**
	 * Get element scroll width and height.
	 * @param {HTMLElement} elem
	 * @returns {Hash} A combination of {width, height}, in px.
	 */
	getElemScrollDimension: function(elem)
	{
		return {'width': elem.scrollWidth, 'height': elem.scrollHeight};
	},
	/**
	 * Returns computed width/height in px.
	 * @param {HTMLElement} elem
	 * @returns {Hash} A combination of {width, height}, in px.
	 */
	getElemComputedDimension: function(elem)
	{
		var SU = Kekule.StyleUtils;
		var dim = {'width': SU.getComputedStyle(elem, 'width'), 'height': SU.getComputedStyle(elem, 'height')};
		var wInfo = SU.analysisUnitsValue(dim.width);
		var hInfo = SU.analysisUnitsValue(dim.height);
		var result = {};
		if (wInfo.units === 'px')
			result.width = wInfo.value;
		if (hInfo.units === 'px')
			result.height = wInfo.value;
		return result;
	},
	/**
	 * Get element offset width and height.
	 * @param {HTMLElement} elem
	 * @returns {Hash} A combination of {width, height}, in px.
	 */
	getElemOffsetDimension: function(elem)
	{
		return {'width': elem.offsetWidth, 'height': elem.offsetHeight};
	},

	/**
	 * Get size of view port.
	 * @param {Variant} elemOrDocOrViewport
	 * @returns {Hash}
	 */
	getViewportDimension: function(elemOrDocOrViewport)
	{
		// Use the specified window or the current window if no argument
		var w;
		if (elemOrDocOrViewport)
		{
			if (elemOrDocOrViewport.ownerDocument)
				w = Kekule.DocumentUtils.getDefaultView(elemOrDocOrViewport.ownerDocument);
			else if (elemOrDocOrViewport.defaultView)
				w = elemOrDocOrViewport.defaultView;
			else if (elemOrDocOrViewport.parentWindow)
				w = elemOrDocOrViewport.parentWindow;
			else
				w = elemOrDocOrViewport;
		}
		w = w || window;

		// This works for all browsers except IE8 and before
		if (w.innerWidth != null) return { 'width': w.innerWidth, 'height': w.innerHeight };

		// For IE (or any browser) in Standards mode
		var d = w.document;
		if (d.compatMode == "CSS1Compat")
			return { 'width': d.documentElement.clientWidth,
				'height': d.documentElement.clientHeight };

		// For browsers in Quirks mode
		return { 'width': d.body.clientWidth, 'height': d.body.clientHeight };
	},

	/**
	 * Returns coord of top-left and bottom-right of visible viewport part in browser window.
	 * @param {Variant} elemOrDocOrViewport
	 * @returns {Hash}
	 */
	getViewportVisibleBox: function(elemOrDocOrViewport)
	{
		// Use the specified window or the current window if no argument
		var w;
		if (elemOrDocOrViewport)
		{
			if (elemOrDocOrViewport.ownerDocument)
				w = Kekule.DocumentUtils.getDefaultView(elemOrDocOrViewport.ownerDocument);
			else if (elemOrDocOrViewport.defaultView)
				w = elemOrDocOrViewport.defaultView;
			else if (elemOrDocOrViewport.parentWindow)
				w = elemOrDocOrViewport.parentWindow;
			else
				w = elemOrDocOrViewport;
		}
		w = w || window;
		var doc = w.document;

		var dim = Kekule.HtmlElementUtils.getViewportDimension(w);
		var offset = Kekule.DocumentUtils.getScrollPosition(doc);

		var result = {'x1': offset.left, 'y1': offset.top, 'x2': dim.width, 'y2': dim.height};
		result.left = result.x1;
		result.top = result.y1;
		result.right = result.x2;
		result.bottom = result.y2;
		return result;
	},

	/**
	 * Returns bounding client rectangle for element.
	 * @param {HTMLElement} elem
	 * @param {Bool} includeScroll If this value is true, scrollTop/Left of documentElement will be added to result.
	 * @returns {Hash} {top, left, bottom, right, width, height}
	 */
	getElemBoundingClientRect: function(elem, includeScroll)
	{
		var r = Object.extend({}, elem.getBoundingClientRect());
		if (Kekule.ObjUtils.isUnset(r.width))
			r.width = r.right - r.left;
		if (Kekule.ObjUtils.isUnset(r.height))
			r.height = r.bottom - r.top;

		if (includeScroll)
		{
			var doc = elem.ownerDocument;
			var scrollTop = doc.documentElement.scrollTop || doc.body.scrollTop || 0;
			var scrollLeft = doc.documentElement.scrollLeft || doc.body.scrollLeft || 0;
			r.left += scrollLeft;
			r.right += scrollLeft;
			r.top += scrollTop;
			r.bottom += scrollTop;
		}

		//var result = {'left': r.left, 'top': r.top, 'width': r.width, 'height': r.height};
		var result = r;
		result.x = result.left;
		result.y = result.top;
		return result;
	},
	/**
	 * Get position relative to top-left corner of HTML page or current viewport (if includeDocScroll is true).
	 * @param {HTMLElement} elem
	 * @param {Bool} relToViewport
	 * @returns {Hash}
	 */
	getElemPagePos: function(elem, relToViewport)
	{

		var xPosition = 0;
		var yPosition = 0;

		/*
		if (elem.getBoundingClientRect)
		{
			var box = elem.getBoundingClientRect();
			var doc = elem.ownerDocument;
			var body = doc.body;
			var docElem = doc.documentElement;
			var clientTop = docElem.clientTop || body.clientTop || 0;
			var clientLeft = docElem.clientLeft || body.clientLeft || 0;
			yPosition = box.top  + (window && window.pageYOffset || docElem && docElem.scrollTop  || body.scrollTop ) - clientTop,
			xPosition = box.left + (window && window.pageXOffset || docElem && docElem.scrollLeft || body.scrollLeft) - clientLeft;
		}
		else
		*/
		{
			var currElem = elem;
			while(currElem)
			{
				// TODO: Here Chrome report body.scrollLeft unavailable in strict mode warning
				xPosition += (currElem.offsetLeft - currElem.scrollLeft + currElem.clientLeft);
				yPosition += (currElem.offsetTop - currElem.scrollTop + currElem.clientTop);
				currElem = currElem.offsetParent;
			}
			if (relToViewport)
			{
				var doc = elem.ownerDocument;
				var scrollTop = doc.documentElement.scrollTop || doc.body.scrollTop || 0;
				var scrollLeft = doc.documentElement.scrollLeft || doc.body.scrollLeft || 0;
				xPosition -= scrollLeft;
				yPosition -= scrollTop;
			}
		}
		return { x: xPosition, y: yPosition };
	},
	/**
	 * Get position relative to top-left corner of HTML page togather with width/height of elem.
	 * @param {HTMLElement} elem
	 * @param {Bool} relToViewport
	 * @returns {Hash} {x, y, top, left, bottom, right, width, height}
	 */
	getElemPageRect: function(elem, relToViewport)
	{
		var pos = Kekule.HtmlElementUtils.getElemPagePos(elem, relToViewport);
		var dim = Kekule.HtmlElementUtils.getElemClientDimension(elem);
		return {
			'x': pos.x, 'y': pos.y, 'left': pos.x, 'top': pos.y,
			'right': pos.x + dim.width, 'bottom': pos.y + dim.height,
			'width': dim.width, 'height': dim.height
		};
	},
	/**
	 * Get position relative to top-left corner of viewport.
	 * @param {HTMLElement} elem
	 * @returns {Hash}
	 */
	getElemViewportPos: function(elem)
	{
		//var rect = Kekule.HtmlElementUtils.getElemBoundingClientRect(elem);
		var rect = Kekule.HtmlElementUtils.getElemPagePos(elem, true);
		return {'x': rect.left, 'y': rect.top};
	},

	/**
	 * Set element's position style to make it to a absolute, relative or fixed one (but retain element's position).
	 * @param {HTMLElement} elem
	 */
	makePositioned: function(elem)
	{
		var p = Kekule.StyleUtils.getComputedStyle(elem, 'position');
		if (!p || p.toLowerCase() === 'static')
			elem.style.position = 'relative';
	},

	/**
	 * Check if element is a form control (input, button, select and textarea).
	 * @param elem
	 */
	isFormCtrlElement: function(elem)
	{
		var formCtrlTags = ['input', 'button', 'textarea', 'select'];
		var tagName = elem && elem.tagName.toLowerCase();
		return !!tagName && formCtrlTags.indexOf(tagName) >= 0;
	},

	/**
	 * Issues an asynchronous request to make the element be displayed full-screen.
	 * @param {HTMLElement} elem
	 */
	requestFullScreen: function(elem)
	{
		var func = elem.requestFullScreen || elem.mozRequestFullScreen || elem.webkitRequestFullScreen || elem.msRequestFullScreen;
		return func? func.apply(elem): null;
	},
	/**
	 * Issues an asynchronous request to make the element exit full-screen mode.
	 * @param {HTMLElement} elem
	 */
	exitFullScreen: function(elem)
	{
		var func = elem.exitFullScreen || elem.mozExitFullScreen || elem.webkitExitFullScreen || elem.msExitFullScreen;
		return func? func.apply(elem): null;
	}
};


/**
 * Utils on document.
 * @object
 */
Kekule.DocumentUtils = {
	/**
	 * Returns the default view (window) of current document.
	 * @param {HTMLDocument} document
	 * @returns {Object}
	 */
	getDefaultView: function(document)
	{
		return document.defaultView || document.parentWindow;
	},
	/**
	 * Returns scroll top/left of document element.
	 * @param {HTMLDocument} document
	 * @returns {Hash} {left, top}
	 */
	getScrollPosition: function(document)
	{
		var win = Kekule.DocumentUtils.getDefaultView(document);
		var result = {
			'left': ((win.pageXOffset !== undefined)?
					win.pageXOffset:
					(document.documentElement || document.body.parentNode || document.body).scrollLeft) || 0,
			'top': ((win.pageYOffset !== undefined)?
					win.pageYOffset:
					(document.documentElement || document.body.parentNode || document.body).scrollTop) || 0
		};
		result.x = result.left;
		result.y = result.top;
		return result;
	},
	/**
	 * Returns dimension of viewport visible client.
	 * @param {HTMLDocument} document
	 * @returns {Hash} {width, height}
	 */
	getClientDimension: function(document)
	{
		if (document.compatMode == "BackCompat")
		{
			return {
				'width': document.body.clientWidth,
				'height': document.body.clientHeight
			}
		}
		else
		{
			return	{
				'width': document.documentElement.clientWidth,
				'height': document.documentElement.clientHeight
			}
		}
	},
	/**
	 * Returns top-left and bottom-right coords and width/height of viewport visible client.
	 * @param {HTMLDocument} document
	 * @returns {Hash} {left, top, right, bottom, x1, x2, y1, y2, width, height}
	 */
	getClientVisibleBox: function(document)
	{
		var offset = Kekule.DocumentUtils.getScrollPosition(document);
		var dim = Kekule.DocumentUtils.getInnerClientDimension(document);
		var result = {};
		result.left = result.x1 = offset.left;
		result.top = result.y1 = offset.top;
		result.right = result.x2 = dim.width + offset.left;
		result.bottom = result.y2 = dim.height + offset.top;
		result.width = dim.width;
		result.height = dim.height;
		return result;
	},
	/**
	 * Returns innerWidth and innerHeight property of a window.
	 * @param {HTMLDocument} document
	 * @returns {Hash} {width, height}
	 */
	getWindowInnerDimension: function(document)
	{
		var win = Kekule.DocumentUtils.getDefaultView(document);
		return {'width': Math.min(win.innerWidth, win.outerWidth), 'height': Math.min(win.innerHeight, win.outerHeight)};
	},
	/**
	 * Returns the visible viewport dimension (on mobile device) or the dimension of whole viewport client (ondesktop).
	 * @param {HTMLDocument} document
	 * @returns {Hash} {width, height}
	 */
	getInnerClientDimension: function(document)
	{
		var clientDim = Kekule.DocumentUtils.getClientDimension(document);
		var innerDim = Kekule.DocumentUtils.getWindowInnerDimension(document);
		return {
			'width': innerDim.width? Math.min(innerDim.width, clientDim.width): clientDim.width,
			'height': innerDim.height? Math.min(innerDim.height, clientDim.height): clientDim.height
		};
	},

	/**
	 * Returns the scale level of current page in mobile browser.
	 * @param {HTMLDocument} document
	 * @returns {Float}
	 */
	getClientScaleLevel: function(document)
	{
		return (document.compatMode == "BackCompat")?
			document.body.clientWidth / window.innerWidth:
			document.documentElement.clientWidth / window.innerWidth;
	},
	/**
	 * Returns the ratio of actual device pixel to CSS 1px.
	 * @param {HTMLDocument} document
	 * @returns {Number}
	 */
	getPixelZoomLevel: function(document)
	{
		var scale = Kekule.DocumentUtils.getClientScaleLevel(document);
		return scale * (Kekule.DocumentUtils.getDefaultView(document).devicePixelRatio || 1);
	},

	/**
	 * Returns PPI of current device.
	 * The algorithm is from https://jsfiddle.net/pgLo6273/2/.
	 * @param {HTMLDocument} document
	 * @returns {Number}
	 */
	getDevicePPI: function(document)
	{
		var win = Kekule.DocumentUtils.getDefaultView(document);
		if (win.matchMedia)
		{
			var minRes = 0;
			var maxRes = 0;
			var curRes = 200;
			var trc = [];
			while (!maxRes || ((maxRes - minRes) > 1))
			{
				if (win.matchMedia('(min-resolution: ' + curRes + 'dpi)').matches)
				{ // ppi >= curRes
					if (maxRes)
					{
						minRes = curRes;
						curRes = Math.round((minRes + maxRes) / 2);
					}
					else
					{
						minRes = curRes;
						curRes = 2 * curRes;
					}
				}
				else
				{ // ppi < curRes
					maxRes = curRes;
					curRes = Math.round((minRes + maxRes) / 2);
				}
			}
			return curRes;
		}
		else
			return 96;  // old device, assume to be a fixed one
	}
};

})();