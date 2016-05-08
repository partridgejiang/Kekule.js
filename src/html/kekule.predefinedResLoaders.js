/**
 * @fileoverview
 * Utils and classes to load chem resources embedded or linked in HTML page.
 *
 * The chem resources (usually a formatted file (.mol, .cml...) or a formatted string)
 * can be embedded in &lt;script&gt; tag:
 * <pre>
 * &lt;script id="chem1" type="chemical/x-mdl-molfile"&gt;
 * Untitled Document-1
 * ChemDraw09151219572D
 *
 * 2  1  0  0  0  0  0  0  0  0999 V2000
 *  -0.4125    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
 *   0.4125    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
 * 1  2  1  0
 * M  END
 * &lt;/script&gt;
 * </pre>
 *
 * or linked in by &lt;script&gt; or &lt;link&gt; tag as the follows:<br />
 *   &lt;script id="chem2" type="chemical/x-kekule-json" src="externalMol.kcj"&gt;&lt;/script&gt;<br />
 *   &lt;link id="chem3" type="chemical/x-cml" href="external.cml" /&gt;
 *
 * Afterwards, user can ref to chem resource by ID directly in HTML code, such as:<br />
 *   &lt;div data-kekule-role="Kekule.ChemWidget.Viewer2D" data-chem-obj="url(#chem1)" /&gt;
 * which will initialize a 2D viewer.
 *
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /utils/kekule.utils.js
 * requires /xbrowsers/kekule.x.js
 */


/**
 * A resource item predefined with an element.
 * Resource can be defined directly inside element, e.g.:
 *   &lt;script id="directResource"&gt;
 *     Resource content here...
 *   &lt;/script&gt;
 * or link in external content, e.g.:
 *   &lt;script id="externalResource" src="external.content"&gt;&lt;/script&gt;
 *   &lt;link id="externalResource" href="external.content" /&gt;
 * User can use url(#id) to refer to resource in HTML file:
 *   &lt;div data-object="url('#externalResource')" /&gt;
 * or use url directly:
 *   &lt;div data-object="url('externalContentUrl')" /&gt;
 * or even use JSON in html attribute directly:
 *   &lt;div data-object="{JSON code here}" /&gt;
 *
 * @class
 * @augments ObjectEx
 * @param {HTMLDocument} doc
 * @param {String} resUri URI to refer to resource, such as '#id' or 'http://url'.
 * @param {String} resType Resource type. If element is set, the type can be judged by element automatically.
 *
 * @property {HTMLDocument} doc Document contains this resource reference.
 * @property {String} resUri Text to refer to resource, such as '#id' or 'http://url'. Readonly.
 * @property {String} resType Resource type id, usually a MIME type text.
 */
Kekule.PredefinedResLoader = Class.create(ObjectEx,
/** @lends Kekule.PredefinedResLoader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.PredefinedResLoader',
	/** @constructs */
	initialize: function($super, doc, /*elementOrUrl*/resUri, resType)
	{
		$super();
		/*
		if (elementOrUrl)
		{
			if (typeof(elementOrUrl) === 'string')  // is Url
			{
				this.setUrl(elementOrUrl);
			}
			else  // is element
			{
				this.setElement(elementOrUrl);
			}
		}
		*/
		if (!resUri)
			Kekule.Error(/*Kekule.ErrorMsg.EMPTY_RESURI*/Kekule.$L('ErrorMsg.EMPTY_RESURI'));
		else
		{
			this.setPropStoreFieldValue('resUri', resUri);
			this.setDoc(doc);
			if (resType)
				this.setResType(resType);
		}
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('doc', {'dataType': DataType.OBJECT, 'serializable': false});
		this.defineProp('resUri', {'dataType': DataType.STRING, 'serializable': false, 'setter': null});
		this.defineProp('resType', {'dataType': DataType.STRING, 'serializable': false});
		/*
		this.defineProp('element', {'dataType': DataType.OBJECT, 'serializable': false});
		this.defineProp('url', {'dataType': DataType.STRING, 'serializable': false,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('url');
				if (!result && this.getElement())
					result = this.getLinkedResUrl(this.getElement());
				return result;
			}
		});
		this.defineProp('resType', {'dataType': DataType.STRING, 'serializable': false,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('resType');;
				if (!result && this.getElement())
					result = this.getElemResType(this.getElement());
				return result;
			}
		});
		*/
	},

	/**
	 * Returns url linked in by element.
	 * Usually "href" attribute of <link> element or "src" element of <script> element.
	 * @param {Element} elem
	 * @returns {String}
	 * @private
	 */
	getLinkedResUrl: function(elem)
	{
		var tagName = elem.tagName.toLowerCase();
		if (tagName === 'link')
			return elem.getAttribute('href');
		else if (tagName === 'script')
			return elem.getAttribute('src');
		else
			return null;
	},
	/**
	 * Returns resource type appointed by element.
	 * Usually "type" attribute of &lt;link&gt; element or &lt;script&gt; element.
	 * @param {Element} elem
	 * @returns {String}
	 * @private
	 */
	getElemResType: function(elem)
	{
		return elem.getAttribute('type');
	},

	/**
	 * Load content of resource.
	 * Note if resource if defined by a URL (&lt;script src&gt; or &lt;link href&gt;, the content
	 *   will be load by AJAX asychronously. So a callback function is used here.
	 * @param {Func} callback Called after resource is loaded. The callback function has the
	 *   following params:
	 *     callback(resInfo, success)
	 *   where resInfo is a hash object, contains the following fields: {data, text, resType, resUri, success}.
	 *   If load fails, data and text field of resInfo will be null.
	 */
	load: function(callback)
	{
		// TODO: currently only handle direct embedded data or simple AJAX data
		//var url = this.getUrl();
		var uri = this.getResUri();
		var resElem, url;
		var idMark = Kekule.PredefinedResReferer.ID_MARK;
		if (uri.startsWith(idMark))  // ref to an element
		{
			var id = uri.substr(idMark.length).trim();
			resElem = this.getDoc().getElementById(id);
			if (resElem)  // check element linked url
			{
				url = this.getLinkedResUrl(resElem);
				var resType = this.getElemResType(resElem);
				if (resType)
					this.setResType(resType);
			}
		}
		else  // direct url
		{
			url = uri;
		}

		var resInfo = {'resType': this.getResType(), 'resUri': uri};
		if (url)
		{
			Kekule.X.Ajax.sendRequest(url, function(data, req, success)
			{
				if (success)
				{
					resInfo = Object.extend(resInfo, {'data': data, 'text': req.responseText, 'success': true});
					if (!resInfo.resType)
					{
						resInfo.resType = Kekule.X.Ajax.getResponseMimeType(req);
						if (resInfo.resType === Kekule.IO.MimeType.OCTSTREAM)  // returns oct stream mimetype, server may can not reconganize a chem format file
						{
							// determine proper mime type by file extension
							var fileExt = Kekule.UrlUtils.extractFileExt(url);
							if (fileExt)
							{
								var chemFormat = Kekule.IO.DataFormatsManager.findFormat(null, fileExt);
								if (chemFormat)
									resInfo.resType = chemFormat.mimeType;
							}
						}
					}
					callback(resInfo, success);
				}
				else  // failed
				{
					callback(resInfo, false);
				}
			}, null, null, this.getResType() || null);
		}
		else if (resElem)  // element set but no url, a internal embedded resource
		{
			var content = resElem.innerHTML;
			// innerHTML often start with a blank lines, erase it
			// eliminate the first blank line
			var lbreak = 2;
			var p = content.indexOf('\r\n');
			if (p < 0)
			{
				p = content.indexOf('\n');
				lbreak = 1;
			}
			if (p === 0)
			 	content = content.substring(lbreak);
			//content = content.ltrim();
			resInfo = Object.extend(resInfo, {'data': content, 'text': content, 'resType': resInfo.resType || 'text/plain', 'success': true});
			callback(resInfo, true);  // success
		}
		else  // no corresponding resource
		{
			callback(resInfo, false);
		}
	}
});

/**
 * Utility class to handle values refered to a predefined resource.
 * @class
 */
Kekule.PredefinedResReferer = {
	/** @private */
	REFER_PATTERN: /^\s*url\((\S+)\)\s*$/,
	/** @private */
	ID_MARK: '#',
	/* @private */
	//JSON_PATTERN: /^\s*(\{\S+\})\s*$/,
	/**
	 * Check if a str is a resource referer (like url(#id) or url('url')) or JSON text.
	 * Both types may be used as resource.
	 * @param {String} str
	 * @returns {Bool}
	 */
	isResValue: function(str)
	{
		//return Kekule.PredefinedResReferer.isResReferrer(str) || Kekule.PredefinedResReferer.isDirectJson(str);
		return Kekule.PredefinedResReferer.isResReferrer(str);
	},
	/**
	 * Check if a str is a resource referrer (like url(#id) or url('url')).
	 * @param {String} str
	 * @returns {Bool}
	 */
	isResReferrer: function(str)
	{
		return Kekule.PredefinedResReferer.REFER_PATTERN.test(str);
	},
	/*
	 * Check if a str is a JSON text.
	 * @param {String} str
	 * @returns {Bool}
	 */
	/*
	isDirectJson: function(str)
	{
		return Kekule.PredefinedResReferer.JSON_PATTERN.test(str);
	},
	*/
	/**
	 * Extract value inside resource referer's parenthesis (e.g. #id from url(#id), url from url('url')).
	 * @param {String} str
	 * @returns {String}
	 */
	extractReferedValue: function(str)
	{
		var result = Kekule.PredefinedResReferer.REFER_PATTERN.exec(str);
		if (result)
		{
			var value = result[1];
			if (value)
			{
				value = Kekule.StrUtils.unquote(value);
				return value;
			}
		}
		return null;
	},
	/*
	 * Extract JSON str inside HTML attributes.
	 * @param {String} str
	 * @returns {String}
	 */
	/*
	extractJsonText: function(str)
	{
		var result = Kekule.PredefinedResReferer.JSON_PATTERN.exec(str);
		if (result)
		{
			var s = result[1];
			if (s)
			{
				return s;
			}
		}
		return null;
	},
	*/
	/**
	 * Get resource content from resource reference string.
	 * When the retrieve is done, callback will be called.
	 * @param {String} refStr
	 * @param {Function} callback Called after resource is loaded. The callback function has the
	 *   following params:
	 *     callback(resInfo, success)
	 *   resInfo will be null if loading failed.
	 *   On success,resInfo is a hash object, contains the following fields: {data, text, resType, resUrl}.
	 * @param {String} resType
	 */
	loadResource: function(refStr, callback, resType, doc)
	{
		if (!doc)
			doc = document;
		var R = Kekule.PredefinedResReferer;
		//if (R.isResReferrer(refStr))
		{
			var refValue = R.extractReferedValue(refStr);
			var resLoader;
			/*
			if (refValue.startsWith(R.ID_MARK))  // ref to an element
			{
				var id = value.substr(1).trim();
				var resElem = doc.getElementById(id);
				if (resElem)
				{
					resLoader = new Kekule.PredefinedResLoader(resElem);
				}
			}
			else  // direct url
			{
				resLoader = new Kekule.PredefinedResLoader(refValue);
			}
			*/
			resLoader = new Kekule.PredefinedResLoader(doc, refValue);

			if (resLoader)
			{
				//console.log(resLoader);
				if (resType)
					resLoader.setResType(resType);
				resLoader.load(callback);
			}
		}
		/*
		else if (R.isDirectJson(refStr))
		{
			var s = R.extractJsonText(refStr);
			if (s)
			{
				//var jsonObj = JSON.parse(s);
				var resInfo = {'resType': Kekule.IO.MimeType.JSON, 'data': s, 'text': s, 'success': true};
				callback(resInfo, true);
			}
		}
		*/
	}
};

// extend Kekule.IO method to load predefined resource
if (Kekule.IO)
{
	/**
	 * Load chem object from a predefined resource.
	 * When the loading process is done, callback will be called.
	 * @param {String} refStr
	 * @param {Function} callback Called after chem object is loaded.
	 *   The callback Has two params (chemObj, success).
	 * @param {String} Manually set the resource type.
	 *   If not set, the type will be generated automatically.
	 * @param {DOcument} doc Root HTML document. If not set, current document will be used.
	 */
	Kekule.IO.loadResourceData = function(refStr, callback, resType, doc)
	{
		Kekule.PredefinedResReferer.loadResource(refStr, function(resData, success){
			var chemObj;
			if (success)
			{
				chemObj = Kekule.IO.loadTypedData(resData.data, resData.resType, resData.resUri);
			}
			if (callback)
				callback(chemObj, success);
		}, resType, doc);
	}
}