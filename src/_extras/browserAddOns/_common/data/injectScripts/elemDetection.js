/**
 * @fileoverview
 * Script file need to inject to every page (including frames) to check if there is Kekule widget element.
 * @author Partridge Jiang
 */

var DetectionUtils;

(function(self, doc, win){

var MutationObserver = window.MutationObserver || window.MozMutationObserver || window.WebkitMutationObserver;

var DU = {
	WIDGET_SELECTORS: ['*[data-widget]', '*[data-kekule-widget]'],
	INJECT_MSG_SENT: false,
	KEKULE_LIB_LOADED: false,

	mutationObserver: null,

	// Note: this function need message request/response and is not sync.
	queryKekuleLibLoaded: function(callback)
	{
		// if result is returned, Kekule lib is surely loaded
		doc.defaultView.addEventListener('message', function(event)
			{
				if (event.data && event.data.msg === 'kekule-sys-info-result')
				{
					//console.log('result message received!');
					DU.KEKULE_LIB_LOADED = true;
					if (callback)
						callback(event.data);
				}
			}
		);
		doc.defaultView.postMessage('kekule-sys-info-query', '*');
	},
	// Check if Kekule.js is injected or loaded into document
	isKekuleLibLoaded: function()
	{
		if (DU.KEKULE_LIB_LOADED)
			return true;
		var doc = win.document;
		var result = win.Kekule && win.Kekule.Widget;
		/*
		if (!result)  // maybe unsafeWindow is unusable? Check script tags
		{
			var entranceSrc = /^(.*\/?)kekule.*\.js(\?.*)?$/;
			var scriptElems = doc.getElementsByTagName('script');
			for (var i = scriptElems.length - 1; i >= 0; --i)
			{
				var elem = scriptElems[i];
				if (elem.src)
				{
					var matchResult = elem.src.match(entranceSrc);
					if (matchResult)
					{
						result = true;
						break;
					}
				}
			}
		}
		*/
		return result;
	},

	// check if there are Kekule widget elements in document
	hasKekuleWidget: function(docOrRootElem)
	{
		var selectors = DU.WIDGET_SELECTORS;
		for (var i = 0, l = selectors.length; i < l; ++i)
		{
			if (docOrRootElem.querySelector && docOrRootElem.querySelector(selectors[i]))
				return true;
		}
		return false;
	},
	// check if document's body or an element is in edit mode
	isInEditMode: function(docOrRootElem)
	{
		var elem = docOrRootElem.body || docOrRootElem;
		var doc = elem.ownerDocument;
		return !!(elem.isContentEditable || doc.designMode === 'on');
	},

	requestInjectKekuleLib: function()
	{
		if (DU.doRequestInjectKekuleLib)
			return DU.doRequestInjectKekuleLib();
	},

	// start detect job, if found Kekule widget, emit message to request injection of kekule.min.js
	detect: function(docOrRootElem)
	{
		var done = false;
		if (DU.isKekuleLibLoaded())  // already loaded, no need to inject
		{
			//console.log('Kekule lib already loaded');
			done = true;
		}
		else if (!DU.INJECT_MSG_SENT && DU.hasKekuleWidget(docOrRootElem))
		{
			//console.log('require insert Kekule lib');
			if (!DU.isInEditMode(docOrRootElem))  // do not insert script to edit mode area
			{
				DU.requestInjectKekuleLib();
				done = true;
			}
		}

		if (done)
		{
			DU.INJECT_MSG_SENT = true;
			// once Kekule lib is injected, mutation observer is no longer needed
			if (DU.mutationObserver)
				DU.mutationObserver.disconnect();
		}
	},

	_addScriptFile: function(doc, url, callback)
	{
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
				if (callback)
					callback();
			}
		};
		(doc.getElementsByTagName('head')[0] || doc.body).appendChild(result);
		//console.log('load script', url);
		return result;
	},
	_addSeqScriptFiles: function(doc, urls, callback)
	{
		//console.log('add seq script', urls);
		if (urls.length <= 0)
		{
			if (callback)
				callback();
			return;
		}
		var file = urls.shift();
		DU._addScriptFile(doc, file, function()
			{
				DU._addSeqScriptFiles(doc, urls, callback);
			}
		);
	},

	injectScriptFiles: function(scriptUrls)
	{
		var body = doc.body;
		/*
		var afterLoadScript = function()
		{
			if (win.Kekule)
			{
				if (win.Kekule.Widget.AutoLauncher.enabled)
					win.Kekule.Widget.autoLauncher.execute(body);
			}
			else
				doc.defaultView.postMessage({'msg': 'kekule-widget-force-autolaunch'}, '*');
		};
		*/
		// I do not know why but the autolaunch need to be launched manually in unsafeWindow
		// DONE: this bug has been fixed and no additional need to call autolaunch
		DU._addSeqScriptFiles(doc, scriptUrls/*, function(){
			//setTimeout(afterLoadScript, 100);
		}*/);
	},
	injectStyleFiles: function(urls)
	{
		var root = doc.getElementsByTagName('head')[0];
		if (!root)
			root = doc.body;
		for (var i = 0, l = urls.length; i < l; ++i)
		{
			var elem = doc.createElement('link');
			elem.setAttribute('rel', 'stylesheet');
			elem.setAttribute('type', 'text/css');
			elem.setAttribute('href', urls[i]);
			root.appendChild(elem);
		}
	},

	_init: function(doc)
	{
		// event handlers
		/*
		self.port.on(globalConsts.MSG_INJECT_KEKULE_LIB_RESPONSE, function(msg)
			{
				var scriptUrls = msg.scriptFiles || [];
				var styleUrls = msg.styleFiles || [];
				//console.log('inject scripts', scriptUrls);
				//console.log('inject styles', styleUrls);
				DU.injectStyleFiles(styleUrls);
				DU.injectScriptFiles(scriptUrls);
				//console.log('document ready state', doc.readyState, win.Kekule);
			}
		);
		*/

		// install mutation observe to check dynamicly inserted elements
		// observe both window and unsafeWindow
		var targets = [doc.body];
		if (win.document.body !== targets[0])
			targets.push(win.document.body);
		for (var i = 0, l = targets.length; i < l; ++i)
		{
			var observer = new MutationObserver(function(mutations)
			{
				//console.log('mutation', mutations);
				mutations.forEach(function(mutation)
				{
					var elem = (mutation.type === 'attributes') ? mutation.target.parent : mutation.target;
					if (elem)
						DU.detect(elem);
				});
			});

			observer.observe(targets[i], {
				attributes: true,
				childList: true
			});
		}
		DU.mutationObserver = observer;
		DU.detect(doc);
	}
};

// script is injected after DOM is ready, so we can always call and query here.
DU.queryKekuleLibLoaded();
//DU._init(doc);  // _init call will be delayed to elemDetection.addon.js

doc.defaultView.addEventListener('message', function(event)
	{
		//console.log('receive win message', event, event.data);
		if (event.data === globalConsts.MSG_INJECTION_DETECT_REQUEST)
			DU.detect(doc);
	}, false
);

DetectionUtils = DU;

})(self, /*unsafeWindow? unsafeWindow.document:*/ document, this.unsafeWindow || window);