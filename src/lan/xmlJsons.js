/**
 * @fileoverview
 * Utilities to handle XML and JSON data.
 * @author Partridge Jiang
 */

(function($root){

"use strict";

var
/**
 *  Class to handle JSON file and data.
 *  @class JsonUtility
 */
JsonUtility = {
  /** Parse JSON object from text, return object. */
  parse: function(text)
  {
		return JSON.parse(text);
  },

  /** Serialize a object to JSON string.
   *  NOTE: this function only works in browser support JSON.stringify.
   *  @param {Object} srcObj Source JavaScript object.
   *  @param {Object} options Options for serializing:
   *    {
   *      prettyPrint: {Bool} whether format output JSON or use a compact one,
   *      indentSpaces: {Int} indent space count for formatting
   *    }
   *  @returns {String} JSON string.
   */
  serializeToStr: function(srcObj, options)
  {
    //return Object.toJSON(srcObj);
  	if (options && options.prettyPrint)
  		return JSON.stringify(srcObj, null, options.indentSpaces || 2);
  	else
  	  return JSON.stringify(srcObj);
  }
};

var
/**
 *  Class to handle XML file and data.
 *  This part is partly borrowed from Javascript - The Definitive Guide, 5th Ed
 *  and add some code of myself, mainly for Safari (do not support xmldoc.load)
 *  and including file handle
 *  @class XmlUtility
 */
XmlUtility = {
  // appoint explicit DOMParser/DOMImplementation/XMLSerializer classes
  DOM_PARSER: null,
  DOM_IMPLEMENTATION: null,
  XML_SERIALIZER: null,
	/** @private */
  DEF_INCLUDE_TAG_NAME: 'include',
  /** @private */
  DEF_INCLUDE_SRC_ATTRIB: 'src',
  /** @private */
  DEF_LOAD_TIMEOUT: 20000,
  /** @private */
  DEF_BYPASS_ROOT_ELEM: true,
  /** @private */
  DEF_SERIALIZE_TO_JSCODE_VARNAME: '__xmlStr__',
  /** @private */
  FILE_EXT_XML: '.xml',
  /** @private */
  FILE_EXT_XML_JS_WRAPPER: '.xmljs',

  /** Create a new XML document */
  newDocument: function(rootTagName, namespaceURL)
  {
    if (!rootTagName) rootTagName = "";
    if (!namespaceURL) namespaceURL = "";

    if (XmlUtility.DOM_IMPLEMENTATION)  // node enviroment
    {
      var doc = (new XmlUtility.DOM_IMPLEMENTATION()).createDocument(namespaceURL, rootTagName, null);
      return doc;
    }
    else if (typeof(document) !== 'undefined')  // is in web browser environment
    {
      if (document.implementation && document.implementation.createDocument)
      {
        // This is the W3C standard way to do it
        var doc = document.implementation.createDocument(namespaceURL,
          rootTagName, null);
        //console.log('Here: ', doc);
        return doc;
        /*
				if (doc.load)
					return doc;
				else   // Safari adn Google Chrome do not support xmldoc.load
				{
					var xmlhttp = new XMLHttpRequest();
					doc = xmlhttp;
					return doc;
				}
				*/
      }
      else if (typeof(ActiveXObject) !== "undefined")
      { // This is the IE way to do it
        // Create an empty document as an ActiveX object
        // If there is no root element, this is all we have to do
        var doc = new ActiveXObject("MSXML2.DOMDocument");

        // If there is a root tag, initialize the document
        if (rootTagName)
        {
          // Look for a namespace prefix
          var prefix = "";
          var tagname = rootTagName;
          var p = rootTagName.indexOf(':');
          if (p != -1)
          {
            prefix = rootTagName.substring(0, p);
            tagname = rootTagName.substring(p + 1);
          }

          /*
					// If we have a namespace, we must have a namespace prefix
					// If we don't have a namespace, we discard any prefix
					if (namespaceURL) {
							if (!prefix) prefix = "a0"; // What Firefox uses
					}
					else prefix = "";
					*/

          // Create the root element (with optional namespace) as a
          // string of text
          var text = "<" + (prefix ? (prefix + ":") : "") + tagname +
            (namespaceURL ?
              ((prefix ? " xmlns:" : " xmlns") + prefix + '="' + namespaceURL + '"')
              : "") +
            "/>";
          // And parse that text into the empty document
          doc.loadXML(text);
        }
        return doc;
      }
    }
  },

  /** parse Xml DOM from text, return XMLDocument */
  parse: function(text)
  {
    if (XmlUtility.DOM_PARSER)
      return (new XmlUtility.DOM_PARSER()).parseFromString(text, "application/xml");
    else if (typeof(document) !== 'undefined')  // is in web browser environment
    {
      if (typeof DOMParser != "undefined")
      {
        // Mozilla Firefox, Google Chrome and related browsers
        return (new DOMParser()).parseFromString(text, "application/xml");
      }
      else if (typeof ActiveXObject != "undefined")
      {
        // Internet Explorer.
        var doc = XmlUtility.newDocument();  // Create an empty document
        doc.loadXML(text);            // Parse text into it
        return doc;                   // Return it
      }
      else
      {
        // As a last resort, try loading the document from a data: URL
        // This is supposed to work in Safari. Thanks to Manos Batsis and
        // his Sarissa library (sarissa.sourceforge.net) for this technique.
        var url = "data:text/xml;charset=utf-8," + encodeURIComponent(text);
        var request = new XMLHttpRequest();
        request.open("GET", url, false);
        request.send(null);
        return request.responseXML;
      }
    }
  },

  /** load XML document from url. */
  load: function(url, callback, options)  // return XMLDocument
  // options: object include fields:
  //   timeout: Integer, in ms
  {
    // check file ext first, if is a Xml-Js-Wrapper, call corresponding method
    /*
    if (url.lastIndexOf(XmlUtility.FILE_EXT_XML_JS_WRAPPER) === url.length - XmlUtility.FILE_EXT_XML_JS_WRAPPER.length)  // end with this ext
      return XmlUtility.loadHelper.loadJsWrapper(url, callback, options);
    if (!options)
      options = {disableInclude: false};
    if (!options.disableInclude)
      return XmlUtility.loadHelper.loadAndHandleIncludeElement(url, callback, options);
    else
      return XmlUtility.loadHelper.loadSimple(url, callback, options.timeout);
     */
    return XmlUtility.loadHelper.loadSimple(url, callback, (options || {}).timeout);
  },

  /** @private */
  loadHelper: {
    // TODO: this method is unable to be used in Node.js environment
    /////////////////////////////////////////////////////////////////////
    //  Internal method for load to use
    ///////////////
  	/** @private */
    loadSimple: function(url, callback, loadTimeout)
      // return XMLDocument, if assigned callback, it runs async
      //   callback(xmlDoc, isloadSuccess)
      //   this function will try use XHR method in IE,
      // as IE can not load local XML file via XHR
    {
      var async = (callback != null);

      if ((loadTimeout === null) || (loadTimeout === undefined))
        loadTimeout = XmlUtility.DEF_LOAD_TIMEOUT;

      if (!(document.implementation && document.implementation.createDocument)) // ie
      {
        return XmlUtility.loadHelper.loadSimpleViaDoc(url, callback);
      }
      else  // other browse
      {
        var req = new XMLHttpRequest();
        var timeoutHandle = null;
        if (loadTimeout)
          timeoutHandle = setTimeout(function() // timeout, load failed
            {
              runCallBack(null, false);
            }, loadTimeout);

				/** @ignore */
        var runCallBack = function(xmldoc, isSuccess)
        {
          if (timeoutHandle)  // clear timeout handler
            clearTimeout(timeoutHandle);
          if (callback)
            callback(xmldoc, isSuccess);
        };

        if (async)
				{
					/** @ignore */
					req.onreadystatechange = function(){
						if (req.readyState == 4)
						{
							//if (req.status == 200)
							var xmldoc = req.responseXML;
							if (xmldoc && xmldoc.documentElement) // check documentElement, otherwise opera will cause error
							{
								runCallBack(xmldoc, true);
							}
							else
								runCallBack(null, false);
						}
					};
				}
        try
        {
          //console.log('open request', req);
          req.open('get', url, async);
          req.send(null);
        }
        catch(e)
        {
          runCallBack(null, false);  // load failed
        }

        var doc = req.responseXML;
        if (doc && doc.documentElement)
          return doc;
        else
          return null;
      }
    },
    /** @private */
    loadSimpleViaDoc: function(url, callback)  // use for IE
    {
      var tagInitial = 'dummy_dummy_dummy_dummy';
      var async = (callback != null);

      // Create a new document with the previously defined function
      var xmldoc = XmlUtility.newDocument(tagInitial);
      xmldoc.async = async;
      if (async)
      {
				/** @ignore */
      	xmldoc.onreadystatechange = function( ) {
           if (xmldoc.readyState == 4)
           {
             if ((!xmldoc.documentElement) || (xmldoc.documentElement.tag == tagInitial))
               callback(xmldoc, false);
             else
               callback(xmldoc, true);
           }
         };
      }
      xmldoc.load(url);      // Load and parse
      return xmldoc;         // Return the document
    }
  },

  /**
   * Serialize a XML node content to string.
   * @param {Object} node
   * @param {Object} options Options for serializing:
   *    {
   *      prettyPrint: {Bool} whether format output JSON or use a compact one,
   *    }
   */
  serializeNode: function(node, options)
  {
		if (options && options.prettyPrint)
		{
			return XmlUtility.serializeNodePretty(node);
		}
    if (XmlUtility.XML_SERIALIZER)
      return (new XmlUtility.XML_SERIALIZER()).serializeToString(node);
    else if (typeof XMLSerializer != "undefined")
      return (new XMLSerializer( )).serializeToString(node);
    else if (node.xml) return node.xml;
    else throw "XML.serialize is not supported or can't serialize " + node;
  },

  /** Try serialize node content to string in pretty mode. Not always possible in some browser. */
  serializeNodePretty: function(node)
  {
    try
    {
      if (XmlUtility.XML_SERIALIZER)
        return (new XmlUtility.XML_SERIALIZER()).serializeToString(node).toXMLString();
      else
        return new XMLSerializer().serializeToString(node).toXMLString();  // firefox
			  // TODO: E4X is deprecated in firefox 21, so need other methods
    }
    catch(e)
    {
      return XmlUtility.serializeNode(node);
    }
  },

  // utils functions
  /** Get url of a XML document */
  getXmlDocUrl: function(xmlDoc)
  {
    return xmlDoc.url  // IE
      || xmlDoc.documentURI  // firefox
      || xmlDoc.URL  // Safari
      || xmlDoc.location;  // Opera
  }
};

// export those two util class to DataType namespace
DataType.JsonUtility = JsonUtility;
DataType.XmlUtility = XmlUtility;

})(this);