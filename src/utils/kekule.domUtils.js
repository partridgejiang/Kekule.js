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
	 * @param {HTMLElement} elem
	 * @param {String} text
	 * @param {Bool} multiline If true, text with multiple lines will automatically insert <br /> tags in elem.
	 */
	setElementText: function(elem, text, multiline)
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
		var lines = multiline? (text || '').split('\n'): [text || ''];
		for (var i = 0, l = lines.length; i < l; ++i)
		{
			if (i > 0)
			{
				var elemBr = elem.ownerDocument.createElement('br');
				elem.appendChild(elemBr);
			}
			var textNode = elem.ownerDocument.createTextNode(lines[i]);
			elem.appendChild(textNode);
		}
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
	 * Returns the parent node of node.
	 * @param {Node} node
	 * @param {Hash} options Currently the options can be {acrossShadowRoot: bool}.
	 * @returns {Node}
	 */
	getParentNode: function(node, options)
	{
		var op = options || {};
		var result = node.parentNode;
		if (result)
			return result;
		else if (op.acrossShadowRoot && node.host)  // host of shadow node
			return node.host;
		else
			return null;
	},
	/**
	 * Check if childElem is inside parentElem.
	 * @param {Object} childElem
	 * @param {Object} parentElem
	 * @param {Hash} options Currently the options can be {acrossShadowRoot: bool}.
	 * @returns {Bool}
	 */
	isDescendantOf: function(childElem, parentElem, options)
	{
		var op = options || {};
		try
		{
			if (childElem && parentElem)
			{
				if (childElem.documentElement)  // no one can be the root of a document
					return false;
				if (childElem.ownerDocument === parentElem)   // parent is document
					return true;

				var getParent = Kekule.DomUtils.getParentNode;
				var parent =  getParent(childElem, op); // childElem.parentNode;
				while (parent)
				{
					if (parent === parentElem)
						return true;
					parent = getParent(parent, op); //parent.parentNode;
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
	 * @param {Hash} options Currently the options can be {acrossShadowRoot: bool}.
	 * @returns {Bool}
	 */
	isOrIsDescendantOf: function(childElem, parentElem, options)
	{
		return (childElem === parentElem) || Kekule.DomUtils.isDescendantOf(childElem, parentElem, options);
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
	 * @param {Hash} options Currently the options can be {acrossShadowRoot: bool}.
	 * @returns {Bool}
	 */
	isInDomTree: function(node, doc, options)
	{
		var op = options || {};
		if (!node)
			return false;
		if (!doc)
			doc = node.ownerDocument;
		if (doc)
		{
			if (!op.acrossShadowRoot && node.getRootNode)
			{
				return (node.getRootNode() === doc);
			}
			else
			{
				var docElem = doc.documentElement;
				return Kekule.DomUtils.isDescendantOf(node, docElem, options) || node === docElem;
			}
		}
		else
			return false;
	},

	/**
	 * Check if node is in a shadow root context.
	 * @param {Node} node
	 * @returns {Bool}
	 */
	isInShadowRoot: function(node)
	{
		if (typeof(ShadowRoot) !== 'undefined')
		{
			try
			{
				var rootNode = node.getRootNode && node.getRootNode();
				return rootNode instanceof ShadowRoot;
			}
			catch(e)
			{
				return false;
			}
		}
		else
			return false;
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
	 * @param {Func} callback Callback(error). If error is null, the loading process is success.
	 * @returns {HTMLElement} New created script element.
	 */
	appendScriptFile: function(doc, url, callback)
	{
		var exists;
		if (doc)
		{
			exists = Kekule.ScriptFileUtils._existedScriptUrls.get(doc);
			if (!exists)
			{
				exists = [];
				Kekule.ScriptFileUtils._existedScriptUrls.set(doc, exists);
			}

			if (exists.indexOf(url) >= 0)  // already loaded
			{
				if (callback)
					callback(null);
				return;
			}
			var result = doc.createElement('script');
			result.src = url;
			result.onerror = function(error){
				if (callback)
					callback(error);
			};
			result.onload = result.onreadystatechange = function(e) {
				if (result._loaded)
					return;
				var readyState = result.readyState;
				if (readyState === undefined || readyState === 'loaded' || readyState === 'complete')
				{
					result._loaded = true;
					result.onload = result.onreadystatechange = null;
					exists.push(url);
					if (callback)
						callback(null);
				}
			};
			(doc.getElementsByTagName('head')[0] || doc.body).appendChild(result);
			//console.log('load script', url);
			return result;
		}
		else // doc is null, maybe in node environment
		{
			var rawUtil = Kekule.$jsRoot['__$kekule_scriptfile_utils__'];
			if (rawUtil && rawUtil.appendScriptFile)
				return rawUtil.appendScriptFile(doc, url, callback);
		}
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

		var _appendScriptFilesCore = function(doc, urls, callback, errors)
		{
			if (urls.length <= 0)
			{
				if (callback)
				{
					if (!errors.length)
						callback(null);
					else
						callback(new Error('Error in loading: ' + errors.join('; ')));
				}
				return;
			}
			var file = urls.shift();
			Kekule.ScriptFileUtils.appendScriptFile(doc, file, function(error)
			{
				if (error)
				{
					errors.push(file + ': ' + error? (error.message || error): '');
				}
				_appendScriptFilesCore(doc, urls, callback, errors);
			});
		};

		_appendScriptFilesCore(doc, dupUrls, callback, []);
	}
};


})();