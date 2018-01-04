/**
 * @fileoverview
 * Utils and classes to identify and load Kekule Widget in HTML tag when a page is loaded.
 *
 * Generally, the auto launcher will iterate through elements in document. If an element is
 * with a data-widget attribute, it will be regarded as a Kekule related one. Then a
 * specified Kekule widget will be created (according to data-widget attribute) on this tag.
 * Widget property will also be set from "data-XXX" attribute.
 *
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /utils/kekule.utils.js
 * requires /xbrowsers/kekule.x.js
 * requires /widgets/kekule.widget.base.js
 */

(function(){

var DU = Kekule.DomUtils;
var AU = Kekule.ArrayUtils;

/**
 * Helper class to create and bind Kekule widgets while loading HTML page.
 * Generally, the auto launcher will iterate through elements in document. If an element is
 * with a data-widget attribute, it will be regarded as a Kekule related one. Then a
 * specified Kekule widget will be created (according to data-widget attribute) on this tag.
 * Widget property will also be set from "data-XXX" attribute.
 *
 * @class
 */
Kekule.Widget.AutoLauncher = Class.create(ObjectEx,
/** @lends Kekule.Widget.AutoLauncher# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.AutoLauncher',
	/** @private */
	WIDGET_ATTRIB: 'data-widget',
	/** @private */
	WIDGET_ATTRIB_ALT: 'data-kekule-widget',
	/** @private */
	PLACEHOLDER_ATTRIB: 'data-placeholder',
	/** @private */
	FIELD_PARENT_WIDGET_ELEM: '__$kekule_parent_widget_elem$__',
	/** @constructs */
	initialize: function($super)
	{
		$super();
		this._executingFlag = 0;  // private
		this._pendingWidgetRefMap = new Kekule.MapEx(true);  // non-weak, to get all keys
		this._pendingElems = [];  // elements that need to be launched
		this._handlingPendings = false;  // private flag

		this._execOnPendingBind = this._execOnPending.bind(this);

		var self = this;
		// delegate Kekule.Widget.Util method for auto launch purpose
		/** @ignore */
		Kekule.Widget.Utils._setWidgetRefPropFromId = function(widget, propName, id)
		{
			if (id)
			{
				var refWidget = Kekule.Widget.getWidgetById(id, widget.getDocument());
				if (refWidget)
					widget.setPropValue(propName, refWidget);
				else  // in auto launch mode, perhaps the corresponding widget has not been created
				{
					var elem = widget.getDocument().getElementById(id);
					if (elem && self.isExecuting())  // has the corresponding element, just save it and try to set widget again after auto launch
					{
						self.addPendingWidgetRefItem(elem, widget, propName);
					}
				}
			}
		};
	},
	/** @private */
	finalize: function($super)
	{
		this._pendingElems = null;
		this._pendingWidgetRefMap = null;
		$super();
	},

	// Methods about lanuchingElems
	/** @private */
	getPendingElems: function()
	{
		return this._pendingElems;
	},
	/** @private */
	addPendingElem: function(doc, elem, parent, widgetClass, execOnChildren)
	{
		//console.log('pending', elem, parent);
		this._pendingElems.push({'doc': doc, 'elem': elem, 'parent': parent, 'widgetClass': widgetClass, 'execOnChildren': execOnChildren});
	},
	/** @private */
	handlePendingElems: function(callback)
	{
		if (!this._handlingPendings)  // avoid duplicated call
		{
			this._handlingPendings = true;
			if (callback)
			{
				var elemItems = this._pendingElems;
				elemItems.push({'callback': callback});   // set callback to tail element item
			}
			this.beginExec();
			//this._execOnPendingBind.defer();
			setTimeout(this._execOnPendingBind, 0);
		}
	},
	/** @private */
	_execOnPending: function()
	{
		var currItem = this._pendingElems.shift();  // handle the first one
		if (!currItem)  // sequence is empty
		{
			this._handlingPendings = false;
			this.endExec();
		}
		else  // do actual create
		{
			try
			{
				if (currItem.elem)    // normal element lauch item
					this.createWidgetOnElem(currItem.doc, currItem.elem, currItem.parent);
				else if (currItem.callback)  // special callback item
					setTimeout(currItem.callback, 0);
			}
			finally
			{
				//this._execOnPendingBind.defer();
				setTimeout(this._execOnPendingBind, 0);
			}
		}
	},


	// Methods about pendingWidgetRefMap
	/** @private */
	getPendingWidgetRefMap: function()
	{
		return this._pendingWidgetRefMap;
	},
	/** @private */
	addPendingWidgetRefItem: function(refElem, widget, propName)
	{
		this._pendingWidgetRefMap.set(refElem, {'widget': widget, 'propName': propName});
	},
	/** @private */
	removePendingWidgetRefItem: function(refElem)
	{
		this._pendingWidgetRefMap.remove(refElem);
	},
	/** @private */
	handlePendingWidgetRef: function()
	{
		var pendingElems = this._pendingWidgetRefMap.getKeys();
		for (var i = 0, l = pendingElems.length; i < l; ++i)
		{
			var elem = pendingElems[i];
			var refWidget = Kekule.Widget.getWidgetOnElem(elem);
			if (refWidget)
			{
				var setting = this._pendingWidgetRefMap.get(elem);
				setting.widget.setPropValue(setting.propName, refWidget);
			}
			this.removePendingWidgetRefItem(elem);
		}
	},
	/** @private */
	beginExec: function()
	{
		++this._executingFlag;
		//this._startTime = Date.now();
	},
	/** @private */
	endExec: function()
	{
		if (this._executingFlag > 0)
			--this._executingFlag;
		if (this._executingFlag <= 0)  // finally execution done
		{
			this.handlePendingWidgetRef();
		}
		/*
		this._endTime = Date.now();
		console.log('elapse', this._endTime - this._startTime);
		*/
	},
	/** @private */
	isExecuting: function()
	{
		return this._executingFlag > 0;
	},

	/**
	 * Launch all widgets inside element.
	 * @param {HTMLElement} rootElem
	 * @param {Bool} deferCreation
	 * @param {Func} callback A callback function that will be called when the task is done (since deferCreation may be true).
	 */
	execute: function(rootElem, deferCreation, callback)
	{
		var deferring = Kekule.ObjUtils.notUnset(deferCreation)? deferCreation: Kekule.Widget.AutoLauncher.deferring;
		if (!deferring)
			this.beginExec();
		//var _tStart = Date.now();
		try
		{
			if (typeof(rootElem.querySelector) === 'function')  // support querySelector func, use fast approach
				this.executeOnElemBySelector(rootElem.ownerDocument, rootElem, null, deferring);
			else
				this.executeOnElem(rootElem.ownerDocument, rootElem, null, deferring);

			if (deferring)
				this.handlePendingElems(callback);
		}
		finally
		{
			if (!deferring)
			{
				this.endExec();
				if (callback)
					callback();
			}
		}
		//var _tEnd = Date.now();
		//console.log('Launch in ', _tEnd - _tStart, 'ms');
	},
	/**
	 * Execute launch process on element and its children. Widget created will be set as child of parentWidget.
	 * This method will use traditional element iterate method for heritage browsers that do not support querySelector.
	 * @param {HTMLDocument} doc
	 * @param {HTMLElement} elem
	 * @param {Variant} parentWidgetOrElem Can be null.
	 * @private
	 */
	executeOnElem: function(doc, elem, parentWidgetOrElem, deferring)
	{
		/*
		if (elem.isContentEditable && !Kekule.Widget.AutoLauncher.enableOnEditable)
			return;
		*/
		if (!this.isElemLaunchable(elem))
			return;

		/*
		// if elem already binded with a widget, do nothing
		if (Kekule.Widget.getWidgetOnElem(elem))
			return;
		// check if elem has widget specified attribute.
		var widgetName = elem.getAttribute(this.WIDGET_ATTRIB);
		if (!widgetName)
			widgetName = elem.getAttribute(this.WIDGET_ATTRIB_ALT);
		if (widgetName)  // may be a widget
		{
			var widgetClass = this.getWidgetClass(widgetName);
			if (widgetClass)
			{
				widget = this.createWidgetOnElem(doc, elem, widgetClass);
				if (widget)  // create successful
				{
					if (parentWidget)
						widget.setParent(parentWidget);
					currParent = widget;
				}
			}
		}
		*/
		var widget = null;
		var widgetClass = this.getElemWidgetClass(elem);
		var currParent = parentWidgetOrElem;
		if (deferring)  // deferring creation on element
		{
			if (widgetClass)
			{
				this.addPendingElem(doc, elem, parentWidgetOrElem, widgetClass, false/*Kekule.Widget.AutoLauncher.enableCascadeLaunch*/);
				currParent = elem;
			}
		}
		else  // create directly on element
		{
			var parentWidget = parentWidgetOrElem;
			if (parentWidget && !(parentWidget instanceof Kekule.Widget.BaseWidget))  // is element
				parentWidget = Kekule.Widget.getWidgetOnElem(parentWidgetOrElem);

			 widget = this.createWidgetOnElem(doc, elem, parentWidget, widgetClass);
			if (widget)
				currParent = widget;
			else
				currParent = elem;
		}
		{
			var shouldCascade = (deferring && !widgetClass) || (!deferring && !widget) || Kekule.Widget.AutoLauncher.enableCascadeLaunch;
			//if (!widget || Kekule.Widget.AutoLauncher.enableCascadeLaunch)
			if (shouldCascade)
			{
				// check child elements further
				var children = DU.getDirectChildElems(elem);
				for (var i = 0, l = children.length; i < l; ++i)
				{
					var child = children[i];
					this.executeOnElem(doc, child, currParent, deferring);
				}
			}
		}
	},
	/**
	 * Execute launch process on element and its children. Widget created will be set as child of parentWidget.
	 * This method will use querySelector method to perform a fast launch on supported browser.
	 * @param {HTMLDocument} doc
	 * @param {HTMLElement} rootElem
	 * @param {Kekule.Widget.BaseWidget} parentWidget Can be null.
	 */
	executeOnElemBySelector: function(doc, rootElem, parentWidget, deferring)
	{
		//console.log('Using selector');
		var selector = '[' + this.WIDGET_ATTRIB + '],[' + this.WIDGET_ATTRIB_ALT + ']';
		//var selector = '[' + this.WIDGET_ATTRIB + ']';
		var allElems = rootElem.querySelectorAll(selector);

		var rootWidgetClass = this.getElemWidgetClass(rootElem);  // if root element is a widget, shift it into allElems
		if (rootWidgetClass)
		{
			allElems = Array.prototype.slice.call(allElems);
			allElems.unshift(rootElem);
		}

		if (allElems && allElems.length)
		{
			/*
			// turn node list to array
			if (Array.from)
				allElems = Array.from(allElems);
			else
			{
				var temp = [];
				for (var i = 0, l = allElems.length; i < l; ++i)
				{
					temp.push(allElems[i]);
				}
				allElems = temp;
			}
			*/
			//console.log(allElems, typeof(allElems));
			// build tree relation of all those elements
			for (var i = 0, l = allElems.length; i < l; ++i)
			{
				var elem = allElems[i];
				//var candidateParentElems = allElems.slice(0, i - 1);
				// only leading elems can be parent of curr one
				var parentElem = this._findParentCandidateElem(elem, allElems, 0, i - 1);
				if (parentElem)
				{
					elem[this.FIELD_PARENT_WIDGET_ELEM] = parentElem;
					//console.log('Parent relation', elem.id + '/' + elem.getAttribute('data-widget'), parentElem.id + '/' + parentElem.getAttribute('data-widget'));
				}
			}
			// then create corresponding widgets
			for (var i = 0, l = allElems.length; i < l; ++i)
			{
				var elem = allElems[i];

				/*
				if (elem.isContentEditable && !Kekule.Widget.AutoLauncher.enableOnEditable)
					continue;
				*/
				if (!this.isElemLaunchable(elem))
					continue;

				var parentWidgetElem = elem[this.FIELD_PARENT_WIDGET_ELEM] || null;
				// create widget only on top level elem when enableCascadeLaunch is false
				if (Kekule.Widget.AutoLauncher.enableCascadeLaunch || !parentWidgetElem)
				{
					/*
					var pWidget = null;
					if (parentWidgetElem)
					{
						// we can be sure that the parentWidgetElem is before this one in array
						// and the widget on it has already been created
						var pWidget = Kekule.Widget.getWidgetOnElem(parentWidgetElem);
					}
					this.createWidgetOnElem(doc, elem, pWidget);
					*/
					if (deferring)  // deferring
						this.addPendingElem(doc, elem, parentWidgetElem, null, false);
					else  // create directly
						this.createWidgetOnElem(doc, elem, parentWidgetElem);
				}
			}
		}
	},
	/** @private */
	_findParentCandidateElem: function(elem, candidateElems, fromIndex, toIndex)
	{
	  var result= null;
		var parent = elem.parentNode;
		while (parent && !result)
		{
			for (var i = toIndex; i >= fromIndex; --i)
			{
				if (parent === candidateElems[i])
				{
					result = candidateElems[i];
					return result;
				}
			}
			if (!result)
				parent = parent.parentNode;
		}
		return result;
	},
	/**
	 * Create new widget on an element.
	 * @param {HTMLDocument} doc
	 * @param {HTMLElement} elem
	 * @param {Class} widgetClass
	 * @returns {Kekule.Widget.BaseWidget}
	 * @private
	 */
	createWidgetOnElem: function(doc, elem, parentWidgetOrElem, widgetClass)
	{
		var result = null;
		// if elem already binded with a widget, do nothing
		var old = Kekule.Widget.getWidgetOnElem(elem);
		if (old)
			return old;
		//console.log('Create widget on elem', elem, parentWidgetOrElem && parentWidgetOrElem.getElement());

		if (!widgetClass)
			widgetClass = this.getElemWidgetClass(elem);
		if (widgetClass)
		{
			var AL = Kekule.Widget.AutoLauncher;

			// check if using place holder
			var usingPlaceHolder = false;
			if (AL.placeHolderStrategy !== AL.PlaceHolderStrategies.DISABLED)
			{
				var attrPlaceholder = elem.getAttribute(this.PLACEHOLDER_ATTRIB) || '';
				usingPlaceHolder = ((AL.placeHolderStrategy === AL.PlaceHolderStrategies.EXPLICIT) && Kekule.StrUtils.strToBool(attrPlaceholder))
					|| (AL.placeHolderStrategy === AL.PlaceHolderStrategies.IMPLICIT);
				usingPlaceHolder = usingPlaceHolder && ClassEx.getPrototype(widgetClass).canUsePlaceHolderOnElem(elem);
			}
			//usingPlaceHolder = true;
			if (usingPlaceHolder)
			{
				result = new Kekule.Widget.PlaceHolder(elem, widgetClass);
			}
			else
				result = new widgetClass(elem);
			if (result)  // create successful
			{
				var parentWidget = parentWidgetOrElem;
				if (parentWidget && !(parentWidget instanceof Kekule.Widget.BaseWidget))  // is element
					parentWidget = Kekule.Widget.getWidgetOnElem(parentWidgetOrElem);

				if (parentWidget)
					result.setParent(parentWidget);
			}
		}

		return result;
	},

	/**
	 * Return whether the element should be launched as a widget.
	 * @param {HTMLElement} elem
	 * @returns {Bool}
	 */
	isElemLaunchable: function(elem)
	{
		if (elem.isContentEditable && !Kekule.Widget.AutoLauncher.enableOnEditable)
			return false;
		else
			return true;
	},
	/** @private */
	getElemWidgetClass: function(elem)
	{
		var result = null;
		// check if elem has widget specified attribute.
		var widgetName = elem.getAttribute(this.WIDGET_ATTRIB);
		if (!widgetName)
			widgetName = elem.getAttribute(this.WIDGET_ATTRIB_ALT);
		if (widgetName)  // may be a widget
		{
			result = this.getWidgetClass(widgetName);
		}
		return result;
	},

	/** @private */
	getWidgetClass: function(widgetName)
	{
		// TODO: here we simply create class from widget class name
		return ClassEx.findClass(widgetName);
	}
});
Kekule.ClassUtils.makeSingleton(Kekule.Widget.AutoLauncher);
Kekule.Widget.autoLauncher = Kekule.Widget.AutoLauncher.getInstance();

/**
 * PlaceHolder creation strategy for autolauncher
 * @enum
 */
Kekule.Widget.AutoLauncher.PlaceHolderStrategies = {
	/** PlaceHolder will be totally disabled. */
	DISABLED: 'disabled',
	/** Placeholder will be created when possible. */
	IMPLICIT: 'implicit',
	/** Placeholder will only be created when attribute placeholder is explicitly set to true in element. */
	EXPLICIT: 'explicit'
};

/** A flag to turn on or off auto launcher. */
Kekule.Widget.AutoLauncher.enabled = true;
/** A flag to enable or disable launching child widgets inside a widget element. */
Kekule.Widget.AutoLauncher.enableCascadeLaunch = true;
/** A flag to enable or disable checking dynamic inserted content in HTML page. */
Kekule.Widget.AutoLauncher.enableDynamicDomCheck = true;
/** A flag to enable or disable launching widgets on element in HTML editor (usually should not). */
Kekule.Widget.AutoLauncher.enableOnEditable = false;
/** If true, Placeholder maybe created during auto launching. */
Kekule.Widget.AutoLauncher.placeHolderStrategy = Kekule.Widget.AutoLauncher.PlaceHolderStrategies.EXPLICIT;
/** If true, the launch process on each element will be deferred, try not to block the UI. */
Kekule.Widget.AutoLauncher.deferring = false;

/**
 * A helper class to notify widget system is ready.
 * @class
 */
Kekule.Widget.WidgetsReady = {
	isReady: false,
	funcs: [],
	ready: function(fn)
	{
		if (WR.isReady)
		{
			fn();
		}
		else
		{
			WR.funcs.push(fn);
		}
	},
	fireReady: function()
	{
		if (WR.isReady)
			return;
		WR.isReady = true;
		var funcs = WR.funcs;
		while (funcs.length)
		{
			var fn = funcs.shift();
			fn();
		}
	}
};
var WR = Kekule.Widget.WidgetsReady;
/**
 * Invoked when widget system is constructed.
 * @param {Func} fn Callback function.
 * @function
 */
Kekule.Widget.ready = WR.ready;


var _doAutoLaunch = function()
{
	//console.log('do autolaunch', _doAutoLaunch.done, Kekule.Widget.AutoLauncher.enabled);
	if (_doAutoLaunch.done)
		return;

	if (!Kekule._isLoaded())  // the whole library is not completely loaded yet, may be some widget class unavailable, waiting
	{
		Kekule._registerAfterLoadProc(_doAutoLaunch);
		return;
	}

	// if deferring launch, must intercept the DOM ready handlers, ensures they are called after widgets created (for compatibility)
	var resumeDomReady = Kekule.Widget.AutoLauncher.deferring? function()
	{
		Kekule.X.DomReady.resume();
	}: null;
	var done = function()
	{
		try
		{
			WR.fireReady();
		}
		finally
		{
			if (resumeDomReady)
				resumeDomReady();
		}
	};

	if (Kekule.Widget.AutoLauncher.enabled)
	{
		//console.log('do autolaunch on body', document.body);
		if (Kekule.Widget.AutoLauncher.deferring)
			Kekule.X.DomReady.suspend();
		Kekule.Widget.autoLauncher.execute(document.body, null, done);
	}
	else
		done();
	// add dynamic node inserting observer
	if (Kekule.X.MutationObserver)
	{
		var observer = new Kekule.X.MutationObserver(
			function(mutations)
			{
				if (Kekule.Widget.AutoLauncher.enableDynamicDomCheck && Kekule.Widget.AutoLauncher.enabled)
				{
					for (var i = 0, l = mutations.length; i < l; ++i)
					{
						var m = mutations[i];
						if (m.type === 'childList')  // dom tree changes
						{
							var addedNodes = m.addedNodes;
							for (var j = 0, k = addedNodes.length; j < k; ++j)
							{
								var node = addedNodes[j];
								if (node.nodeType === Node.ELEMENT_NODE)
								{
									Kekule.Widget.autoLauncher.execute(node);
								}
							}
						}
					}
				}
			});
		observer.observe(document.body, {
			childList: true,
			subtree: true
		});
	}
	else // traditional DOM event method
	{
		Kekule.X.Event.addListener(document, 'DOMNodeInserted',
			function(e)
			{
				if (Kekule.Widget.AutoLauncher.enableDynamicDomCheck && Kekule.Widget.AutoLauncher.enabled)
				{
					var target = e.getTarget();
					if (target.nodeType === (Node.ELEMENT_NODE || 1))  // is element
					{
						Kekule.Widget.autoLauncher.execute(target);
					}
				}
			}
		);
	}
	_doAutoLaunch.done = true;
};

Kekule.X.domReady(_doAutoLaunch);

/*
if ($jsRoot && $jsRoot.addEventListener && $jsRoot.postMessage)
{
	// response to special message, force autolaunch widget.
	// This is usually requested by browser addon.
	$jsRoot.addEventListener('message', function(event)
	{
		console.log('receive message', event, event.source == $jsRoot);
		if (event.data && event.data.msg === 'kekule-widget-force-autolaunch' && event.source == $jsRoot)
		{
			console.log('force autolaunch');
			_doAutoLaunch();
		}
	}, false);
}
*/

})();