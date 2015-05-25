/**
 * @fileoverview
 * Script file need to inject to every page (including frames) to check if there is Kekule widget element.
 * @author Partridge Jiang
 */

(function(self, doc, win){

var MutationObserver = window.MutationObserver || window.MozMutationObserver || window.WebkitMutationObserver;

var DetectionUtils = {
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
					DetectionUtils.KEKULE_LIB_LOADED = true;
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
		if (DetectionUtils.KEKULE_LIB_LOADED)
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
		var selectors = DetectionUtils.WIDGET_SELECTORS;
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
		return !!elem.isContentEditable;
	},
	// start detect job, if found Kekule widget, emit message to request injection of kekule.min.js
	detect: function(docOrRootElem)
	{
		var done = false;
		if (DetectionUtils.isKekuleLibLoaded())  // already loaded, no need to inject
		{
			//console.log('Kekule lib already loaded');
			done = true;
		}
		else if (!DetectionUtils.INJECT_MSG_SENT && DetectionUtils.hasKekuleWidget(docOrRootElem))
		{
			//console.log('require insert Kekule lib');
			if (!DetectionUtils.isInEditMode(docOrRootElem))  // do not insert script to edit mode area
			{
				self.port.emit(globalConsts.MSG_INJECT_KEKULE_LIB_REQUEST);
				done = true;
			}
		}

		if (done)
		{
			DetectionUtils.INJECT_MSG_SENT = true;
			// once Kekule lib is injected, mutation observer is no longer needed
			if (DetectionUtils.mutationObserver)
				DetectionUtils.mutationObserver.disconnect();
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
		DetectionUtils._addScriptFile(doc, file, function()
			{
				DetectionUtils._addSeqScriptFiles(doc, urls, callback);
			}
		);
	},

	injectScriptFiles: function(scriptUrls)
	{
		var body = doc.body;
		var afterLoadScript = function()
		{
			/*
			console.log('<manually launch>', win.Kekule.Widget.AutoLauncher.enabled);
			*/
			if (win.Kekule.Widget.AutoLauncher.enabled)
				win.Kekule.Widget.autoLauncher.execute(body);
			//doc.defaultView.postMessage({'msg': 'kekule-widget-force-autolaunch'}, '*');
		}
		// I do not know why but the autolaunch need to be launched manually in unsafeWindow
		DetectionUtils._addSeqScriptFiles(doc, scriptUrls, function(){
			setTimeout(afterLoadScript, 10);
		});
		/*
		for (var i = 0, l = scriptUrls.length; i < l; ++i)
		{
			var elem = doc.createElement('script');
			elem.src = scriptUrls[i];
			body.appendChild(elem);
		}
		*/
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
		self.port.on(globalConsts.MSG_INJECT_KEKULE_LIB_RESPONSE, function(msg)
			{
				var scriptUrls = msg.scriptFiles || [];
				var styleUrls = msg.styleFiles || [];
				//console.log('inject scripts', scriptUrls);
				//console.log('inject styles', styleUrls);
				DetectionUtils.injectStyleFiles(styleUrls);
				DetectionUtils.injectScriptFiles(scriptUrls);
				//console.log('document ready state', doc.readyState, win.Kekule);
			}
		);

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
						DetectionUtils.detect(elem);
				});
			});

			observer.observe(targets[i], {
				attributes: true,
				childList: true
			});
		}
		DetectionUtils.mutationObserver = observer;
		DetectionUtils.detect(doc);
	}
};

// script is injected after DOM is ready, so we can always call _init and query here.
DetectionUtils.queryKekuleLibLoaded();
DetectionUtils._init(doc);

doc.defaultView.addEventListener('message', function(event)
	{
		//console.log('receive win message', event, event.data);
		if (event.data === globalConsts.MSG_INJECTION_DETECT_REQUEST)
			DetectionUtils.detect(doc);
	}, false
);

})(self, /*unsafeWindow? unsafeWindow.document:*/ document, unsafeWindow || window);