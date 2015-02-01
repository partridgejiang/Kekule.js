/**
 * @fileoverview
 * Utilities to handle XML and JSON data. Borrowed from WebShow.XML and WebShow.JSON.
 * @author Partridge Jiang
 */

var
/**
 *  Class to handle JSON file and data.
 *  @class JsonUtility
 */
JsonUtility = {
	/** @private */
  DEF_LOAD_TIMEOUT: 20000,
  /** @private */
  FILE_EXT_JSON: '.json',
  /** @private */
  FILE_EXT_JSON_JS_WRAPPER: '.jsonjs',
  /** @private */
  DEF_SERIALIZE_TO_JSCODE_VARNAME: '__jsonvar__',

  /** Parse JSON object from text, return object. */
  parse: function(text)
  {
		/*
    if (window.JSON)  // native support for JSON in browser
    	return JSON.parse(text);
		else // try use JSON2 lib
			return
		*/
		return JSON.parse(text);
  },

  /** Parse a JavaScript var wrapped JSON string */
  parseFromJsWrappedCode: function(code, jsVarName)
  {
    if (!jsVarName)
      jsVarName = JsonUtility.DEF_SERIALIZE_TO_JSCODE_VARNAME;
    eval(code);
    return JsonUtility.parse(eval(jsVarName));
  },

  /** Load JSON file of URL and return result in callback(jsonObj, isSuccess). */
  load: function(url, callback, options)
  // options: object include fields:
  //   timeout: Integer, in ms
  {
    // check file ext first, if is a Xml-Js-Wrapper, call corresponding method
    var ext = WebShow.URL.getFileExt(url);
    if (ext.toLowerCase() == JsonUtility.FILE_EXT_JSON_JS_WRAPPER)
      return JsonUtility.loadJsWrapper(url, callback, options);
    else
    {
      return JsonUtility.loadJson(url, callback, options);
    }
  },

  /** Load a JS wrapper JSON file, content like "var _varname = {};" */
  //   callback(jsonObj, isSuccess)
  loadJsWrapper: function(url, callback, options)
    // options: object include fields:
    //   wrapperVarName: string
    //   timeout: Integer, in ms
  {
    var loptions = options || {};
    var wrapperVarName = loptions.wrapperVarName || JsonUtility.DEF_SERIALIZE_TO_JSCODE_VARNAME;
    if (!loptions.timeout)
      loptions.timeout = JsonUtility.DEF_LOAD_TIMEOUT;

		/** @ignore */
    var runCallBack = function(jsonObj, isSuccess)
      {
        if (callback)
          callback(jsonObj, isSuccess);
      };
		/** @ignore */
    var wrapperCallback = function(src, isSuccess)
    {
      var jsonObj = null;
      if (isSuccess)
      {
        var wrapperVar = eval(wrapperVarName);
        // get wrappered JSON
        if (wrapperVar)
        {
          if (typeof(wrapperVar) == 'string')  // wrapped a JSON string
            jsonObj = JsonUtility.parse(wrapperVar);
          else // a object
            jsonObj = wrapperVar;
        }
        runCallBack(jsonObj, true);
      }
      else
        runCallBack(null, false);
    };

    WebShow.ScriptLoader.load(url, wrapperCallback, loptions);
  },

  /** Load a file that containers JSON string only, use WebShow.XHRLoader for AJAX loading. */
  loadJson: function(url, callback, options)
  {
    loptions = options || {};
    if (!loptions.timeout)
      loptions.timeout = JsonUtility.DEF_LOAD_TIMEOUT;

    loptions.resultType = WebShow.FileLoader.ResultType.TEXT;
    loptions.extractBody = false;

		/** @ignore */
    var wrapperCallback = function(content, isSuccess, url)
    {
      if (isSuccess)
      {
        var jsonObj = JsonUtility.parse(content);
        callback(jsonObj, true);
      }
      else
        callback(null, false);
    };

    var xhrLoader = new WebShow.XHRLoader();
    xhrLoader.load(url, wrapperCallback, loptions);
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
  },

  /** Serialize a object to JSON string wrapped in JavaScript var*/
  serializeToJsCode: function(srcObj, jsVarName, quoteChar)
  {
    if (!quoteChar)
      quoteChar = "'";
    if (!jsVarName)
      jsVarName = JsonUtility.DEF_SERIALIZE_TO_JSCODE_VARNAME;
    var jsonStr = JsonUtility.serializeToStr(srcObj);

    var sreg = new RegExp(quoteChar, 'g');
    jsonStr = jsonStr.replace(sreg, '\\' + quoteChar);

    return 'var ' + jsVarName + ' = ' + quoteChar + jsonStr + quoteChar;
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

    if (document.implementation && document.implementation.createDocument) {
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
    else { // This is the IE way to do it
        // Create an empty document as an ActiveX object
        // If there is no root element, this is all we have to do
        var doc = new ActiveXObject("MSXML2.DOMDocument");

        // If there is a root tag, initialize the document
        if (rootTagName) {
            // Look for a namespace prefix
            var prefix = "";
            var tagname = rootTagName;
            var p = rootTagName.indexOf(':');
            if (p != -1) {
                prefix = rootTagName.substring(0, p);
                tagname = rootTagName.substring(p+1);
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
            var text = "<" + (prefix?(prefix+":"):"") +  tagname +
                (namespaceURL?
                 ((prefix? " xmlns:": " xmlns") + prefix + '="' + namespaceURL +'"')
                 :"") +
                "/>";
            // And parse that text into the empty document
            doc.loadXML(text);
        }
        return doc;
    }
  },

  /** parse Xml DOM from text, return XMLDocument */
  parse: function(text)
  {
    if (typeof DOMParser != "undefined") {
        // Mozilla Firefox, Google Chrome and related browsers
        return (new DOMParser( )).parseFromString(text, "application/xml");
    }
    else if (typeof ActiveXObject != "undefined") {
        // Internet Explorer.
        var doc = XmlUtility.newDocument( );  // Create an empty document
        doc.loadXML(text);            // Parse text into it
        return doc;                   // Return it
    }
    else {
        // As a last resort, try loading the document from a data: URL
        // This is supposed to work in Safari. Thanks to Manos Batsis and
        // his Sarissa library (sarissa.sourceforge.net) for this technique.
        var url = "data:text/xml;charset=utf-8," + encodeURIComponent(text);
        var request = new XMLHttpRequest( );
        request.open("GET", url, false);
        request.send(null);
        return request.responseXML;
    }
  },

  /** load XML document from url. */
  load: function(url, callback, options)  // return XMLDocument, handle include tags
  // ATTENTION, currently load can only handle one-level include, that is,
  //   load(A) while include B, B include C, B but not C will be included in A.
  //   This limination is to avoid circulate include
  // options: object include fields:
  //   disableInclude: boolean, whether handle include tag, default true
  //   includeTagName: string,
  //   srcAttribName: string,
  //   bypassRootElem: boolean, whether insert the documentElement of the included xml doc
  //   timeout: Integer, in ms
  {
    // check file ext first, if is a Xml-Js-Wrapper, call corresponding method
    var ext = WebShow.URL.getFileExt(url);
    if (ext.toLowerCase() == XmlUtility.FILE_EXT_XML_JS_WRAPPER)
      return XmlUtility.loadHelper.loadJsWrapper(url, callback, options);
    if (!options)
      options = {disableInclude: false};
    if (!options.disableInclude)
      return XmlUtility.loadHelper.loadAndHandleIncludeElement(url, callback, options);
    else
      return XmlUtility.loadHelper.loadSimple(url, callback, options.timeout);
  },

  /** @private */
  loadHelper: {
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
          WebShow.reportError(e);
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
    },
    /** @private */
    loadAndHandleIncludeElement: function(url, callback, options)
    // options: object include fields:
    //   includeTagName: string,
    //   srcAttribName: string,
    //   bypassRootElem: boolean, whether insert the documentElement of the included xml doc
    //   timeout: Integer, in ms
    {
      var loadTimeout;
      if (options)
        loadTimeout = options.timeout;
      else
        loadTimeout = null;
      var sync = (callback == null);
      if (sync)
      {
        var xmldoc = XmlUtility.loadHelper.loadSimple(url, null, loadTimeout);
        if (xmldoc && xmldoc.documentElement)
        {
          XmlUtility.loadHelper.handleIncludedXmlInElement(xmldoc.documentElement, null, options);
          return xmldoc;
        }
        else
          return null;
      }
      else
        return XmlUtility.loadHelper.loadSimple(url, function(xmldoc, isSuccess)
          {
            if (!isSuccess)
              callback(xmldoc, false);
            else  // handle include element
            {
              XmlUtility.loadHelper.handleIncludedXmlInElement(xmldoc.documentElement, function(count)
                {
                  callback(xmldoc, true);  // what ever include, cann always return xmlDoc
                }, options);
            }
          }, loadTimeout);
    },
    /** @private */
    loadJsWrapper: function(url, callback, options)
    // options: object include fields:
    //   wrapperVarName: string
    //   timeout: Integer, in ms
    {
      options = options || {};
      var wrapperVarName = options.wrapperVarName || XmlUtility.DEF_SERIALIZE_TO_JSCODE_VARNAME;
      var loadTimeout = options.timeout;
      if ((loadTimeout === null) || (loadTimeout === undefined))
        loadTimeout = XmlUtility.DEF_LOAD_TIMEOUT;
			/** @ignore */
      var runCallBack = function(xmldoc, isSuccess)
        {
          /*
          if (timeoutHandle)  // clear timeout handler
            clearTimeout(timeoutHandle);
          */
          if (callback)
            callback(xmldoc, isSuccess);
        };
			/** @ignore */
      var wrapperCallback = function(src, isSuccess)
      {
        /*
        if (timeoutHandle)  // clear timeout handler
          clearTimeout(timeoutHandle);
        */
        if (isSuccess)
        {
          // get wrappered XML string
          var xmlContent = eval(wrapperVarName);
          // parse xml content
          var doc = XmlUtility.parse(xmlContent);
          runCallBack(doc, true);
        }
        else
          runCallBack(null, false);
      };

      /*
      var timeoutHandle = null;
        if (loadTimeout)
          timeoutHandle = setTimeout(function() // timeout, load failed
            {
              runCallBack(null, false);
            }, loadTimeout);
      */
      options.timeout = loadTimeout;
      WebShow.ScriptLoader.load(url, wrapperCallback, options);
    },
    /** @private */
    // for include tag handle
    getIncludeElements: function(rootElement, includeTagName)
    {
      var result = [];
      if (!includeTagName)
        includeTagName = XmlUtility.DEF_INCLUDE_TAG_NAME;

      return rootElement.getElementsByTagName(includeTagName);
    },
    /** @private */
    handleIncludedXmlInElement: function(rootElement, callback, options)
    // callback(includeHandleCount), if not assigned, run in sync mode
    // options: object include fields:
    //   includeTagName: string,
    //   srcAttribName: string,
    //   bypassRootElem: boolean, whether insert the documentElement of the included xml doc
    {
      if (!options)
        options = {};
      var includeTagName = options.includeTagName || XmlUtility.DEF_INCLUDE_TAG_NAME;
      var srcAttribName = options.srcAttribName || XmlUtility.DEF_INCLUDE_SRC_ATTRIB;
      var bypassRootElem = (options.bypassRootElem != null)? options.bypassRootElem : XmlUtility.DEF_BYPASS_ROOT_ELEM;
      var sync = (callback == null);
      var docURL = XmlUtility.getXmlDocUrl(rootElement.ownerDocument);
      var includeElems = XmlUtility.loadHelper.getIncludeElements(rootElement, includeTagName);

      if (!srcAttribName)


      var srcURL = null;
      var includeElem = null;
      var finishedLoadCount = 0;
      var totalLoadCount = includeElems.length;

      if (totalLoadCount <= 0)
      {
        if (callback)
          callback(0);
        return null;
      }

      var includedDoc;
      for (var i = includeElems.length - 1; i >= 0; --i)
      {
        includeElem = includeElems[i];
        srcURL = includeElem.getAttribute(srcAttribName);
        if (srcURL)  // srcLoc not null
        {
          srcURL = WebShow.URL.mergePath(srcURL, docURL);
          if (sync)
          {
            includedDoc = XmlUtility.loadHelper.loadSimple(srcURL);
            if (includedDoc)
              XmlUtility.loadHelper.insertIncludedSection(includedDoc, includeElem, bypassRootElem);
          }
          else  // async
            XmlUtility.loadHelper.loadSimple(srcURL, (function(originIncludeElem, doc, isSuccess)
              {
                if (isSuccess && doc)
                {
                  // replace include tag in parent xml
                  includedDoc = doc;
                  XmlUtility.loadHelper.insertIncludedSection(includedDoc, originIncludeElem, bypassRootElem);
                }
                //
                finishedLoadCount++;

                if (finishedLoadCount == totalLoadCount)  // all include xml finished
                {
                  callback(finishedLoadCount);
                }
              }).bind(this, includeElem));
        }
      }
      return rootElement;
    },
    /** @private */
    insertIncludedSection: function(includedDoc, originIncludeElem, bypassRootElem)
    {
      var
        elems = [];
      // fill element array that shoul be inserted to origin document
      if (bypassRootElem)
      {
        var child = includedDoc.documentElement.firstChild;
        while (child)
        {
          if (child.nodeType == Node.ELEMENT_NODE)  // child element
            elems.push(child);
          child = child.nextSibling;
        }
      }
      else
        elems.push(includedDoc.documentElement);
      // insert elements
      var elem;
      var originDoc = originIncludeElem.ownerDocument;
      var docElem = originDoc.documentElement;
      for (var i = 0, l = elems.length; i < l; ++i)
      {
        var elem = elems[i];
        if (originDoc.importNode)
          elem = originDoc.importNode(elem, true);
        originIncludeElem.parentNode.insertBefore(elem, originIncludeElem);
      }
      // delete old include tag
      originIncludeElem.parentNode.removeChild(originIncludeElem);
      return originDoc;
    }
    ///////////////
    //  Internal method for load to use END
    /////////////////////////////////////////////////////////////////////
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
    if (typeof XMLSerializer != "undefined")
      return (new XMLSerializer( )).serializeToString(node);
    else if (node.xml) return node.xml;
    else throw "XML.serialize is not supported or can't serialize " + node;
  },

  /** Try serialize node content to string in pretty mode. Not always possible in some browser. */
  serializeNodePretty: function(node)
  {
    try
    {
      return XML((new XMLSerializer( )).serializeToString(node)).toXMLString();  // firefox
			// TODO: E4X is deprecated in firefox 21, so need other methods
    }
    catch(e)
    {
      return XmlUtility.serializeNode(node);
    }
  },

  /** wrap XML string to a JavaScript var,
   *  like "var xmlStr = '<xml><data></data></xml>';"
   */
  serializeNodeToJsCode: function(node, jsVarName, quoteChar)
  {
    if (!quoteChar)
      quoteChar = "'";
    if (!jsVarName)
      jsVarName = XmlUtility.DEF_SERIALIZE_TO_JSCODE_VARNAME;
    var xmlString = XmlUtility.serializeNode(node);
    // escape all original quoteChars
    var sreg = new RegExp(quoteChar, 'g');
    xmlString = xmlString.replace(sreg, '\\' + quoteChar);

    return 'var ' + jsVarName + ' = ' + quoteChar + xmlString + quoteChar + ';';
  },

  /** Parse XML from a JavaScript string var */
  parseFromJsWrappedCode: function(code, jsVarName)
  {
    eval(code);
    var xmlText = eval(jsVarName);
    return XmlUtility.parse(xmlText);
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
