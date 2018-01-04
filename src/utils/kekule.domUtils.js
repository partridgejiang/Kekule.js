/**
 * @fileoverview
 * Utility functions about DOM, Script and so on.
 * @author Partridge Jiang
 */

(function(){

/*
if (typeof(Kekule) === 'undefined')
{
	var Kekule = {};
}
*/


/**
 *  An class with static methods handle HTML or XML DOM.
 *  @object
 */
Kekule.DomUtils = {
	/**
	 * Check if node.namespaceURI == namespaceURI or no namespace info on node
	 * @param {Object} node
	 * @param {String} namespaceURI
	 * @param {Bool} allowEmptyNamespace Whether return true if node.namespaceURI is empty
	 * @returns {Bool}
	 */
	namespaceMatched: function(node, namespaceURI, allowEmptyNamespace)
	{
		if (allowEmptyNamespace === undefined)
			allowEmptyNamespace = true;
		return ((node.namespaceURI == namespaceURI) || (allowEmptyNamespace && (!node.namespaceURI)));
	},
	/**
	 * Check if an object is element.
	 * @param {Variant} obj
	 */
	isElement: function(obj)
	{
		return (obj && obj.tagName && obj.nodeType);
	},
	/**
	 * Get text content of an element.
	 *  This function will not consider child elements, just direct text.
	 */
	getElementText: function(elem)
	{
		var result = '';
		for (var i = 0, l = elem.childNodes.length; i < l; ++i)
		{
			if (elem.childNodes[i].nodeType == 3)  // Node.TEXT_NODE
				result += elem.childNodes[i].nodeValue;
		}
		return result;
	},
	/**
	 * Set text content of an element.
	 *  This function will not consider child elements, just replace current first text node or
	 *  append a new text node to the tail of element's children.
	 */
	setElementText: function(elem, text)
	{
		var result = '';
		for (var i = 0, l = elem.childNodes.length; i < l; ++i)
		{
			if (elem.childNodes[i].nodeType == 3) // Node.TEXT_NODE
			{
				elem.childNodes[i].nodeValue = text;
				return text;
			}
		}
		// no text node, append a new one
		var textNode = elem.ownerDocument.createTextNode(text);
		elem.appendChild(textNode);
		return text;
	},
	/**
	 * Get local name of element.
	 * In standard browser, this function should return elem.localName. However,
	 * IE (<= 8) does not implement localName property, so we have to check baseName
	 * or nodeName instead.
	 * @param {Object} elemOrAttrib
	 * @returns {String}
	 */
	getLocalName: function(elemOrAttrib)
	{
		return elemOrAttrib.localName || elemOrAttrib.baseName || elemOrAttrib.nodeName;
	},
	/**
	 * Returns a list of child nodes with specified type.
	 * @param {DOMNode} node
	 * @param {Array} nodeTypes
	 */
	getChildNodesOfTypes: function(node, nodeTypes)
	{
		var result = [];
		var types = Kekule.ArrayUtils.toArray(nodeTypes);
		for (var i = 0, l = node.childNodes.length; i < l; ++i)
		{
			var child = node.childNodes[i];
			if (!nodeTypes || (types.indexOf(child.nodeType) >= 0))
				result.push(child);
		}
		return result;
	},
	/**
	 * Get first element child of elem.
	 * @param {Object} elem
	 * @param {String} tagName
	 * @param {String} localName
	 * @param {String} namespaceURI
	 * @returns {Array} Direct element children of elem.
	 */
	getFirstChildElem: function(elem, tagName, localName, namespaceURI)
	{
		for (var i = 0, l = elem.childNodes.length; i < l; ++i)
		{
			var node = elem.childNodes[i];
			if (node.nodeType === Node.ELEMENT_NODE)
			{
				if ((tagName && (tagName.toLowerCase() === node.tagName.toLowerCase())) ||
					(localName && (localName.toLowerCase() === Kekule.DomUtils.getLocalName(node).toLowerCase())) ||
					((!tagName) && (!localName)))
				{
					if ((!namespaceURI) || Kekule.DomUtils.namespaceMatched(node, namespaceURI))
						return node;
				}
			}
		}
	},
	/**
	 * Get first level element children of elem.
	 * @param {Object} elem
	 * @param {String} tagName
	 * @param {String} localName
	 * @param {String} namespaceURI
	 * @returns {Array} Direct element children of elem.
	 */
	getDirectChildElems: function(elem, tagName, localName, namespaceURI)
	{
		var result = [];
		for (var i = 0, l = elem.childNodes.length; i < l; ++i)
		{
			var node = elem.childNodes[i];
			if (node.nodeType === Node.ELEMENT_NODE)
			{
				if ((tagName && (tagName.toLowerCase() === node.tagName.toLowerCase())) ||
					(localName && (localName.toLowerCase() === Kekule.DomUtils.getLocalName(node).toLowerCase())) ||
					((!tagName) && (!localName)))
				{
					if ((!namespaceURI) || Kekule.DomUtils.namespaceMatched(node, namespaceURI))
						result.push(node);
				}
			}
		}
		return result;
	},
	/**
	 * Get first level element children of elem with given attrib values
	 * @param {Object} elem
	 * @param {Array} attribValues Array of hash ({attrib: value}).
	 * @param {Object} tagName
	 * @param {Object} localName
	 * @param {Object} namespaceURI
	 */
	getDirectChildElemsOfAttribValues: function(elem, attribValues, tagName, localName, namespaceURI)
	{
		var elems = Kekule.DomUtils.getDirectChildElems(elem, tagName, localName, namespaceURI);
		var result = [];
		for (var i = 0, l = elems.length; i < l; ++i)
		{
			var fitAttribValue = true;
			for (var j = 0, k = attribValues.length; j < k; ++j)
			{
				var attribName = Kekule.ObjUtils.getOwnedFieldNames(attribValues[j])[0];
				if (elems[i].getAttribute(attribName) != attribValues[j][attribName])
				{
					fitAttribValue = false;
					break;
				}
			}
			if (fitAttribValue)
				result.push(elems[i]);
		}
		return result;
	},
	/**
	 * Check if childElem is inside parentElem.
	 * @param {Object} childElem
	 * @param {Object} parentElem
	 * @returns {Bool}
	 */
	isDescendantOf: function(childElem, parentElem)
	{
		try
		{
			if (childElem && parentElem)
			{
				if (childElem.documentElement)  // no one can be the root of a document
					return false;
				if (childElem.ownerDocument === parentElem)   // parent is document
					return true;

				var parent = childElem.parentNode;
				while (parent)
				{
					if (parent === parentElem)
						return true;
					parent = parent.parentNode;
				}
			}
			return false;
		}
		catch(e)
		{
			return false;
		}
	},
	/**
	 * Check if childElem is inside parentElem or is parentElem itself.
	 * @param {Object} childElem
	 * @param {Object} parentElem
	 * @returns {Bool}
	 */
	isOrIsDescendantOf: function(childElem, parentElem)
	{
		return (childElem === parentElem) || Kekule.DomUtils.isDescendantOf(childElem, parentElem);
	},
	/**
	 * Get nearest ancestor element with specified tag name.
	 * @param {Object} elem
	 * @param {String} tagName
	 * @param {Bool} includingSelf If true, elem will also be check if it is in tagName
	 * @returns {Object}
	 */
	getNearestAncestorByTagName: function(elem, tagName, includingSelf)
	{
		var tag = tagName.toLowerCase();
		if (includingSelf && elem.tagName && (elem.tagName.toLowerCase() === tag))
			return elem;
		var result = elem.parentNode;
		while (result && result.tagName)
		{
			if (result.tagName.toLowerCase() === tag)
				return result;
			result = result.parentNode;
		}
		return null;
	},
	/**
	 * Get value of attribute with the same namespace of elem.
	 * @param {Object} elem
	 * @param {String} attribName
	 * @returns {String} Value or null.
	 * @private
	 */
	getSameNSAttributeValue: function(elem, attribName, domHelper)
	{
		/*
		 var namespaceURI = elem.namespaceURI;
		 var result = elem.getAttribute(attribName);
		 if ((!result) && namespaceURI)
		 {
		 if (elem.getAttributeNS)
		 result = elem.getAttributeNS(namespaceURI, attribName);
		 else if (domHelper)
		 result = domHelper.getAttributeNS(namespaceURI, attribName, elem);
		 }
		 */
		var result = elem.getAttribute(attribName);  // XML attrib are generally not in any namespace
		return result;
	},
	/**
	 * Set value of attribute with the same namespace of elem.
	 * @param {Object} elem
	 * @param {String} attribName
	 * @returns {String} Value or null.
	 * @private
	 */
	setSameNSAttributeValue: function(elem, attribName, value, domHelper)
	{
		/*
		 var namespaceURI = elem.namespaceURI;
		 //var result = elem.getAttribute(attribName);
		 if (namespaceURI)
		 {
		 if (elem.setAttributeNS)
		 result = elem.setAttributeNS(namespaceURI, attribName, value);
		 else if (domHelper)
		 result = domHelper.setAttributeNS(namespaceURI, attribName, value, elem);
		 }
		 else
		 */
		var result = elem.setAttribute(attribName, value);  // XML attrib are generally not in any namespace
		return result;
	},
	/**
	 * Fetch all attribute values into an array
	 * @param {Object} elem
	 * @param {String} namespaceURI
	 * @param {Boolean} useLocalName. Whether fetch attribute's localName rather than name.
	 * @returns {Array} Each item is a hash: {name: '', value: ''}.
	 */
	fetchAttributeValuesToArray: function(elem, namespaceURI, useLocalName)
	{
		var result = [];
		for (var i = 0, l = elem.attributes.length; i < l; ++i)
		{
			var attrib = elem.attributes[i];
			if (namespaceURI && (!Kekule.DomUtils.namespaceMatched(attrib, namespaceURI, true)))
				continue;
			var name;
			if (useLocalName)
			{
				try { name = Kekule.DomUtils.getLocalName(attrib); } catch(e) {name = attrib.name; }
			}
			else
				name = attrib.name;
			result.push({'name': name, 'value': attrib.value});
		}
		return result;
	},
	/**
	 * Fetch all attribute values into an JSON object
	 * @param {Object} elem
	 * @param {String} namespaceURI
	 * @param {Boolean} useLocalName. Whether fetch attribute's localName rather than name.
	 * @returns {Hash} Each item is a hash: {name: value}.
	 */
	fetchAttributeValuesToJson: function(elem, namespaceURI, useLocalName)
	{
		var result = {};
		for (var i = 0, l = elem.attributes.length; i < l; ++i)
		{
			var attrib = elem.attributes[i];
			if (namespaceURI && (!Kekule.DomUtils.namespaceMatched(attrib, namespaceURI, true)))
				continue;
			var name;
			if (useLocalName)
			{
				try { name = Kekule.DomUtils.getLocalName(attrib); } catch(e) {name = attrib.name; }
			}
			else
				name = attrib.name;
			result[name] = attrib.value;
		}
		return result;
	},
	/**
	 * Check if elem has an attribute.
	 * @param {Element} elem
	 * @param {String} attribName
	 * @returns {Bool}
	 */
	hasAttribute: function(elem, attribName)
	{
		if (elem.hasAttribute)
			return elem.hasAttribute(attribName);
		else
		{
			var value = elem.getAttribute(attribName);
			//return Kekule.ObjUtils.notUnset(value);
			return !!value;
		}
	},
	/**
	 * Returns if a name starts with 'data-'.
	 * @param {String} attribName
	 * @returns {Bool}
	 */
	isDataAttribName: function(attribName)
	{
		return attribName.toString().startsWith('data-');
	},
	/**
	 * Returns attribName without 'data-' prefix.
	 * If attribName is not a data attribute, null will be returned.
	 * @param {String} attribName
	 * @returns {String}
	 */
	getDataAttribCoreName: function(attribName)
	{
		if (Kekule.DomUtils.isDataAttribName(attribName))
			return attribName.substr(5);
		else
			return null;
	},
	/**
	 * Get value of HTML5 data-* attribute.
	 * @param {Object} elem
	 * @param {String} attribName
	 * @returns {String}
	 */
	getDataAttrib: function(elem, attribName)
	{
		if (elem.dataset)  // HTML5 way
			return elem.dataset[attribName];
		else  // DOM way
			return elem.getAttribute('data-' + attribName.toString().hyphenize());
	},
	/**
	 * Set value of HTML5 data-* attribute.
	 * @param {Object} elem
	 * @param {String} attribName
	 * @param {String} value
	 */
	setDataAttrib: function(elem, attribName, value)
	{
		if (elem.dataset)  // HTML5 way
			elem.dataset[attribName] = value;
		else  // DOM way
			elem.setAttribute('data-' + attribName.toString().hyphenize(), value);
	},
	/**
	 * Fetch whole HTML dataset of elem.
	 * @param {Object} elem
	 * @returns {Hash}
	 */
	getDataset: function(elem)
	{
		if (elem.dataset)  // HTML5 way
			return elem.dataset;
		else
		{
			var result = {};
			var attribs = elem.attributes;
			for (var i = 0, l = attribs.length; i < l; ++i)
			{
				var attrib = attribs[i];
				var name = attrib.name;
				if (name.toLowerCase().indexOf('data-') === 0)
				{
					var prop = name.substring(5).camelize();
					result[prop] = attrib.value;
				}
			}
			return result;
		}
	},
	/**
	 * Clear child element/text node but reserves attribute nodes.
	 * @param {Element} parentElem
	 */
	clearChildContent: function(parentElem)
	{
		var children = Kekule.ArrayUtils.toArray(parentElem.childNodes);
		for (var i = children.length - 1; i >= 0; --i)
		{
			var node = children[i];
			if (node.nodeType === Node.ATTRIBUTE_NODE)
				continue;

			parentElem.removeChild(node);
		}
		return parentElem;
	},

	/**
	 * Replace tag name of element.
	 * This method actually create a new element and replace the old one.
	 * @param {HTMLElement} elem
	 * @param {String} newTagName
	 * @returns {HTMLElement} New element created.
	 */
	replaceTagName: function(elem, newTagName)
	{
		if (elem.tagName.toLowerCase() !== newTagName.toLowerCase())
		{
			var newElem = elem.ownerDocument.createElement(newTagName);
			// clone attribs
			var attribs = Kekule.DomUtils.fetchAttributeValuesToArray(elem);
			for (var i = 0, l = attribs.length; i < l; ++i)
			{
				newElem.setAttribute(attribs[i].name, attribs[i].value);
			}
			// move children
			var children = Kekule.DomUtils.getDirectChildElems(elem);
			for (var i = 0, l = children.length; i < l; ++i)
			{
				newElem.appendChild(children[i]);
			}
			// change DOM tree
			var parent = elem.parentNode;
			var sibling = elem.nextSibling;
			parent.removeChild(elem);
			if (sibling)
				parent.insertBefore(newElem, sibling);
			else
				parent.appendChild(newElem);
			return newElem;
		}
		else
			return elem;
	},

	/**
	 * Set elem's attributes by values appointed by hash object.
	 * @param {Element} elem
	 * @param {Hash} hash
	 */
	setElemAttributes: function(elem, hash)
	{
		var props = Kekule.ObjUtils.getOwnedFieldNames(hash);
		for (var i = 0, l = props.length; i < l; ++i)
		{
			var prop = props[i];
			var value = hash[prop];
			if (prop && value)
				elem.setAttribute(prop, value);
		}
		return elem;
	},

	/**
	 * Check if node has been inserted to DOM tree of document.
	 * @param {DOMNode} node
	 * @param {Document} doc
	 * @returns {Bool}
	 */
	isInDomTree: function(node, doc)
	{
		if (!node)
			return false;
		if (!doc)
			doc = node.ownerDocument;
		if (doc)
		{
			var docElem = doc.documentElement;
			return Kekule.DomUtils.isDescendantOf(node, docElem) || node === docElem;
		}
		else
			return false;
	}
};

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
		if (value && value.length && (r.value !== undefined) && (r.value !== NaN))
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
	 */
	colorStrToValue: function(str)
	{
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
	},
	/**
	 * Returns computed style of element. If propName not set, all computed result will be returned.
	 * @param {Object} elem
	 * @param {String} propName
	 * @returns {Variant}
	 */
	getComputedStyle: function(elem, propName)
	{
		var styles;
		var view = elem.ownerDocument.defaultView;
		if (view && view.getComputedStyle)
		{
			styles = view.getComputedStyle(elem, null);
		}
		else if (elem.currentStyle)  // IE
		{
			styles = elem.currentStyle;
		}

		if (styles)  // some times IE can not fetch currentStyle
			return propName? styles[propName]: styles;
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
		return Kekule.StrUtils.splitTokens(elem.className);
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
	 * @param {Variant} elemOrViewport
	 * @returns {Hash}
	 */
	getViewportDimension: function(elemOrDocOrViewport)
	{
		// Use the specified window or the current window if no argument
		var w;
		if (elemOrDocOrViewport)
		{
			if (elemOrDocOrViewport.ownerDocument)
				w = elemOrDocOrViewport.ownerDocument.defaultView;
			else if (elemOrDocOrViewport.defaultView)
				w = elemOrDocOrViewport.defaultView;
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
	 * Get position relative to top-left corner of HTML page.
	 * @param {HTMLElement} elem
	 * @returns {Hash}
	 */
	getElemPagePos: function(elem)
	{

		var xPosition = 0;
		var yPosition = 0;

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
		{
			while(elem)
			{
				// TODO: Here Chrome report body.scrollLeft unavailable in strict mode warning
				xPosition += (elem.offsetLeft - elem.scrollLeft + elem.clientLeft);
				yPosition += (elem.offsetTop - elem.scrollTop + elem.clientTop);
				elem = elem.offsetParent;
			}
		}
		return { x: xPosition, y: yPosition };
	},
	/**
	 * Get position relative to top-left corner of HTML page togather with width/height of elem.
	 * @param {HTMLElement} elem
	 * @returns {Hash} {x, y, width, height}
	 */
	getElemPageRect: function(elem)
	{
		var pos = Kekule.HtmlElementUtils.getElemPagePos(elem);
		var dim = Kekule.HtmlElementUtils.getElemClientDimension(elem);
		return {
			'x': pos.x, 'y': pos.y, 'left': pos.x, 'top': pos.y,
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
		var rect = Kekule.HtmlElementUtils.getElemBoundingClientRect(elem);
		return {'x': rect.left, 'y': left.top};
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
		var tagName = elem.tagName.toLowerCase();
		return formCtrlTags.indexOf(tagName) >= 0;
	}
};


/**
 * Utils on document.
 * @object
 */
Kekule.DocumentUtils = {
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
	 * Returns scroll top/left of document element.
	 * @param {HTMLDocument} document
	 * @returns {Hash} {left, top}
	 */
	getScrollPosition: function(document)
	{
		var result = {
			'left': document.documentElement.scrollLeft || document.body.scrollLeft || 0,
			'top': document.documentElement.scrollTop || document.body.scrollTop || 0
		};
		result.x = result.left;
		result.y = result.top;
		return result;
	}
};

/**
 * Utils to handle 'url(XXXX)' type of attribute value.
 * it may has three format
 *   content directly
 *   url(http://...)
 *   url(#id)
 * @object
 */
Kekule.DataSrcAttribUtils = {
	/**
	 * Check if str starts with 'url('.
	 * @param {String} str
	 * @returns {Bool}
	 */
	isUrlBasedValue: function(str)
	{
		var p = str.toLowerCase().indexOf('url(');
		return (p === 0);
	},
	/**
	 * Get string value inside 'url()' parenthesis
	 * @return {String}
	 */
	getUrl: function(str)
	{
		var result = str.trim();
		var p = result.toLowerCase().indexOf('url(');
		if (p === 0)
		{
			var p2 = result.lastIndexOf(')');
			result = result.substring(4, p2);
			return result;
		}
		else
			return null;
	},
	/**
	 * Get inside content of element.
	 * @private
	 */
	getElementContent: function(elem)
	{
		if (!elem)
			return null;
		var content = elem.innerHTML;
		// innerHTML often start with a blank line, erase it
		// eliminate the first blank line
		/*
		 var p = content.indexOf('\n');
		 if (p === 0)
		 content = content.substring(1);
		 */
		content = content.ltrim();
		return content;
	},
	/**
	 * Get mimeType mark of elem.
	 * @private
	 */
	getElementMimeType: function(elem)
	{
		return elem.getAttribute('type');
	}
	/*
	 * Fetch actual value of url containing attribute value.
	 * @param {String} str
	 * @param {Object} doc Which document to search for element with ID.
	 * @param {Func} callback As sometimes an AJAX call need to be used to retrieve content of an URL, the result will be returned by this callback.
	 *   The callback has one param: callback(content, mimeType). If retrieving failed, content will be null.
	 * @deprecated
	 */
	/*
	fetchContent: function(str, doc, callback)
	{
		if (!doc)
			doc = document;
		var U = Kekule.DataSrcAttribUtils;
		if (U.isUrlBasedValue(str))
		{
			var url = U.getUrl(str);
			if (url)
			{
				url = url.trim();
				// check if start with '#'
				if (url.charAt(0) === '#')  // follows an id
				{
					var id = url.substring(1);
					var elem = doc.getElementById(id);
					callback(U.getElementContent(elem), U.getElementMimeType(elem));
				}
				else  // a url, need to retrieve content by AJAX
				{
					// TODO: AJAX code is unfinished
				}
			}
			else
				callback(null);
		}
		else
			callback(str);
	}
	*/
};

/**
 * Utils to handle JavaScript file.
 * @object
 */
Kekule.ScriptFileUtils = {
	/** @private */
	_existedScriptUrls: new Kekule.MapEx(),
	/**
	 * Append script file to document. When the script is loaded, callback is then called.
	 * @param {HTMLDocument} doc
	 * @param {String} url
	 * @param {Func} callback
	 * @returns {HTMLElement} New created script element.
	 */
	appendScriptFile: function(doc, url, callback)
	{
		var exists = Kekule.ScriptFileUtils._existedScriptUrls.get(doc);
		if (!exists)
		{
			exists = [];
			Kekule.ScriptFileUtils._existedScriptUrls.set(doc, exists);
		}
		if (exists.indexOf(url) >= 0)  // already loaded
		{
			if (callback)
				callback();
			return;
		}
		var result = doc.createElement('script');
		result.src = url;
		result.onload = result.onreadystatechange = function(e)
		{
			if (result._loaded)
				return;
			var readyState = result.readyState;
			if (readyState === undefined || readyState === 'loaded' || readyState === 'complete')
			{
				result._loaded = true;
				result.onload = result.onreadystatechange = null;
				exists.push(url);
				if (callback)
					callback();
			}
		};
		(doc.getElementsByTagName('head')[0] || doc.body).appendChild(result);
		//console.log('load script', url);
		return result;
	},
	/**
	 * Append script files to document. When the all scripts are loaded, callback is then called.
	 * @param {HTMLDocument} doc
	 * @param {String} urls
	 * @param {Func} callback
	 */
	appendScriptFiles: function(doc, urls, callback)
	{
		var dupUrls = [].concat(urls);

		var _appendScriptFilesCore = function(doc, urls, callback)
		{
			if (urls.length <= 0)
			{
				if (callback)
					callback();
				return;
			}
			var file = urls.shift();
			Kekule.ScriptFileUtils.appendScriptFile(doc, file, function()
				{
					Kekule.ScriptFileUtils.appendScriptFiles(doc, urls, callback);
				}
			);
		};

		_appendScriptFilesCore(doc, dupUrls, callback);
	}
};


})();