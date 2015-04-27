/**
 * @fileoverview
 * Generally we can use getElementsByTagName, getAttribute to analysis a DOM tree. If the
 * DOM has namespaces, getElementsByTagNameNS and getAttributeNS should be used instead.
 * However, IE (and MSXML) does not support those NS methods. So this file is trying to
 * provide a cross-browser solution.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /localization/
 */

/**
 * DOM helper to help to analysis DOM trees (especially with namespaces).
 * @class
 * @augments ObjectEx
 * @param {Object} doc A HTML or XML document.
 *
 * @property {Object} document Document of current DOM tree. Either rootElement or document must be set before utilize this class.
 * @property {Object} rootElement Root element of DOM. Either rootElement or document must be set before utilize this class.
 * @property {Array} namespaces Namespaces of current document.
 *   Each items in array has two fields: {namespaceURI, prefix}.
 * @property {String} defNamespaceURI Default namespace URI of document.
 * @property {Bool} forceAnalysisDoc If NS methods is supported by browser, analysis of document
 *   is not essential. However, if turn this property to true, the analysis process will still execute.
 */
Kekule.DomHelper = Class.create(ObjectEx,
/** @lends Kekule.DomHelper# */
{
	/** @private */
	CLASS_NAME: 'Kekule.DomHelper',
	/** @private */
	NAMESPACE_DEFINE_PREFIX: 'xmlns',
	/** @private */
	NAMESPACE_DELIMITER: ':',
	/** @private */
	ERR_EMPTY_DOC: 'Document is empty',
	/** @private */
	ERR_ELEMENT_NOTSET: 'Element not set',
	/** @constructs */
	initialize: function($super, doc)
	{
		$super();
		this._supportNsMethods = null;
		if (doc)
			this.setDocument(doc);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('document', {
			'dataType': DataType.OBJECT,
			'serializable': false,
			'getter': function()
				{
					var result = this.getPropStoreFieldValue('document');
					if (!result)
					{
						var elem = this.getPropStoreFieldValue('rootElement');
						result = elem? elem.ownerDocument: null;
					}
					return result;
				},
			'setter': function(value)
				{
					if (value != this.getPropStoreFieldValue('document'))
					{
						this.setPropStoreFieldValue('document', value);
						this.analysisRootElem();
					}
				}
		});
		this.defineProp('rootElement', {
			'dataType': DataType.OBJECT,
			'serializable': false,
			'getter': function()
				{
					var result = this.getPropStoreFieldValue('rootElement');
					if (!result)
					{
						var doc = this.getPropStoreFieldValue('document');
						result = doc? doc.documentElement: null;
					}
					return result;
				},
			'setter': function(value)
				{
					this.setPropStoreFieldValue('rootElement', value);
					this.analysisRootElem();
				}
		});
		this.defineProp('namespaces', {
			'dataType': DataType.ARRAY,
			'serializable': false,
			'getter': function()
				{
					if (!this.getPropStoreFieldValue('namespaces'))
						this.setPropStoreFieldValue('namespaces', []);
					return this.getPropStoreFieldValue('namespaces')
				}
			});
		this.defineProp('defNamespaceURI', {'dataType': DataType.STRING, 'serializable': false});
		this.defineProp('forceAnalysisDoc', {'dataType': DataType.BOOL});
	},

	/**
	 * Analysis document and get basic namespace informations (mainly on documentElement).
	 * @private
	 */
	analysisRootElem: function()
	{
		this.setNamespaces([]);
		this.setDefNamespaceURI(null);
		/*
		var doc = this.getDocument();
		if (!doc)
			return;
		*/
		var docElem = this.getRootElement();
		if (!docElem)
			return;

		var doc = docElem.ownerDocument;
		// detect if browser support NS methods. IE will be false.
		this._supportNsMethods = !!doc.getElementsByTagNameNS;

		if ((!this._supportNsMethods) || (this.getForceAnalysisDoc()))
		{
			// check all docElem's attributes
			//var docElem = doc.documentElement;
			for (var i = 0, l = docElem.attributes.length; i < l; ++i)
			{
				var attrib = docElem.attributes[i];
				var attribName = attrib.name;
				if (attribName && attribName.indexOf(this.NAMESPACE_DEFINE_PREFIX) >= 0) // an namespace item
				{
					var ns = attrib.value;
					var delimiterPos = attribName.indexOf(this.NAMESPACE_DELIMITER);
					var prefix = (delimiterPos >= 0) ? attribName.substring(delimiterPos + 1) : null;
					this.getNamespaces().push({
						'namespaceURI': ns,
						'prefix': prefix
					});
					if (!prefix)
						this.setDefNamespaceURI(ns);
				}
			}
		}
	},

	/** @private */
	_getEmptyDocErrorMsg: function()
	{
		return !Kekule.hasLocalRes()? this.ERR_EMPTY_DOC: Kekule.$L('ErrorMsg.EMPTY_DOC'); //Kekule.ErrorMsg.EMPTY_DOC;
	},
	/** @private */
	_getElementNotSetErrorMsg: function()
	{
		return !Kekule.hasLocalRes()? this.ELEMENT_NOTSET: Kekule.$L('ErrorMsg.ELEMENT_NOTSET'); //Kekule.ErrorMsg.ELEMENT_NOTSET;
	},

	/** @private */
	assertDocAvailable: function(doc)
	{
		if (!doc)
		{
			Kekule.raise(this._getEmptyDocErrorMsg());
			return false;
		}
		else
			return true;
	},
	/** @private */
	assertElementAvailable: function(element)
	{
		if (!element)
		{
			Kekule.raise(this._getElementNotSetErrorMsg());
			return false;
		}
		else
			return true;
	},

	/**
	 * Get prefix of namespace in current document.
	 * @param {Object} namespaceURI
	 * @returns {String}
	 */
	getNsPrefix: function(namespaceURI)
	{
		if (namespaceURI == this.getDefNamespaceURI())
			return '';
		var namespaces = this.getNamespaces();
		for (var i = 0, l = namespaces.length; i < l; ++i)
		{
			if (namespaces[i].namespaceURI == namespaceURI)
				return namespaces[i].prefix;
		}
		return null;
	},
	/**
	 * Get qualified name (prefix:localName) of tag.
	 * @param {String} namespaceURI
	 * @param {String} localName
	 * @returns {String} Qualified name or null on fail.
	 */
	getQualifiedName: function(namespaceURI, localName)
	{
		var prefix = this.getNsPrefix(namespaceURI);
		if (prefix === null)  // prefix not found, namespace URI not exists
			return null;
		else
			return prefix? prefix + this.NAMESPACE_DELIMITER + localName: localName;
	},

	/**
	 * Create an element with namespace in current document.
	 * @param {String} namespace Namespace of the new element.
	 * @param {String} qualifiedName Qualified name (e.g. myns:element) of the element to create.
	 * @returns {Object} Element created or null on failed.
	 */
	createElementNS: function(namespace, qualifiedName)
	{
		var doc = this.getDocument();
		if (!this.assertDocAvailable(doc))
			return null;

		if (this._supportNsMethods)
			return doc.createElementNS(namespace, qualifiedName);
		else
		{
			// the qualifiedName still has a prefix, so create it alone seems to work either
			return doc.createElement(qualifiedName);
		}
	},

	/**
	 * Get all elements by name in namespace. If param element is not set, it is similar to
	 *   call document.getElementsByTagNameNS or rootElement.getElementsByTagNameNS,
	 *   otherwise element.getElementsByTagName.
	 * Note: here we do not support '*' for localname.
	 * @param {String} namespaceURI
	 * @param {String} localName
	 * @param {Object} element
	 * @returns {Array} Elements found or null on failed.
	 */
	getElementsByTagNameNS: function(namespaceURI, localName, element)
	{
		var root = this.getPropStoreFieldValue('document') || this.getPropStoreFieldValue('rootElement');
		var doc = this.getDocument();
		if (!this.assertDocAvailable(doc))
			return null;

		if (this._supportNsMethods)
		{
			if (element)
				return element.getElementsByTagNameNS(namespaceURI, localName);
			else
				return root.getElementsByTagNameNS(namespaceURI, localName);
		}
		else
		{
			var qualifiedName = this.getQualifiedName(namespaceURI, localName);
			if (qualifiedName === null)  // qualifiedName not available, namespace URI not exists
			{
				return [];
			}
			else
			{
				if (element)
					return element.getElementsByTagName(qualifiedName);
				else
					return root.getElementsByTagName(qualifiedName);
			}
		}
	},

	/**
	 * Element.getAttributeNodeNS
	 * @param {String} namespaceURI
	 * @param {String} localName
	 * @param {Object} element
	 * @returns {Object} Attribute node or null.
	 */
	getAttributeNodeNS: function(namespaceURI, localName, element)
	{
		if (!this.assertElementAvailable(element))
			return null;
		if (this._supportNsMethods)
			return element.getAttributeNodeNS(namespaceURI, localName);
		else
		{
			var qualifiedName = this.getQualifiedName(namespaceURI, localName);
			if (qualifiedName === null)  // qualifiedName not available, namespace URI not exists
			{
				return null;
			}
			else
			{
				return element.getAttributeNode(qualifiedName);
			}
		}
	},

	/**
	 * Element.getAttributeNS
	 * @param {String} namespaceURI
	 * @param {String} localName
	 * @param {Object} element
	 * @returns {String} Attribute value or null.
	 */
	getAttributeNS: function(namespaceURI, localName, element)
	{
		if (!this.assertElementAvailable(element))
			return null;
		if (this._supportNsMethods)
			return element.getAttributeNS(namespaceURI, localName);
		else
		{
			var qualifiedName = this.getQualifiedName(namespaceURI, localName);
			if (qualifiedName === null)  // qualifiedName not available, namespace URI not exists
			{
				return null;
			}
			else
			{
				return element.getAttribute(qualifiedName);
			}
		}
	},

	/**
	 * Element.setAttributeNS
	 * @param {String} namespaceURI
	 * @param {String} localName
	 * @param {String} value
	 * @param {Object} element
	 */
	setAttributeNS: function(namespaceURI, localName, value, element)
	{
		if (!this.assertElementAvailable(element))
			return null;
		if (this._supportNsMethods)
			return element.setAttributeNS(namespaceURI, localName, value);
		else
		{
			var qualifiedName = this.getQualifiedName(namespaceURI, localName);
			if (qualifiedName === null)  // qualifiedName not available, namespace URI not exists
			{
				return null;
			}
			else
			{
				return element.setAttribute(qualifiedName, value);
			}
		}
	}
});
