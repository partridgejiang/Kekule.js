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
	FIELD_PARENT_WIDGET_ELEM: '__$kekule_parent_widget_elem$__',
	/** @constructs */
	initialize: function($super)
	{
		$super();
		this._executingFlag = 0;  // private
		this._pendingWidgetRefMap = new Kekule.MapEx(true);  // non-weak, to get all keys
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
		this._pendingWidgetRefMap = null;
		$super();
	},

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
		}
	},
	/** @private */
	beginExec: function()
	{
		++this._executingFlag;
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
	},
	/** @private */
	isExecuting: function()
	{
		return this._executingFlag > 0;
	},

	/**
	 * Launch all widgets inside element.
	 * @param {HTMLElement} rootElem
	 */
	execute: function(rootElem)
	{
		this.beginExec();
		//var _tStart = Date.now();
		try
		{
			if (typeof(rootElem.querySelector) === 'function')  // support querySelector func, use fast approach
				this.executeOnElemBySelector(rootElem.ownerDocument, rootElem, null);
			else
				this.executeOnElem(rootElem.ownerDocument, rootElem, null);
		}
		finally
		{
			this.endExec();
		}
		//var _tEnd = Date.now();
		//console.log('Launch in ', _tEnd - _tStart, 'ms');
	},
	/**
	 * Execute launch process on element and its children. Widget created will be set as child of parentWidget.
	 * This method will use traditional element iterate method for heritage browsers that do not support querySelector.
	 * @param {HTMLDocument} doc
	 * @param {HTMLElement} elem
	 * @param {Kekule.Widget.BaseWidget} parentWidget Can be null.
	 * @private
	 */
	executeOnElem: function(doc, elem, parentWidget)
	{
		if (elem.isContentEditable && !Kekule.Widget.AutoLauncher.enableOnEditable)
			return;
		var widget;
		var currParent = parentWidget;
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
		widget = this.createWidgetOnElem(doc, elem, currParent);
		if (widget)
			currParent = widget;

		if (!widget || Kekule.Widget.AutoLauncher.enableCascadeLaunch)
		{
			// check child elements further
			var children = DU.getDirectChildElems(elem);
			for (var i = 0, l = children.length; i < l; ++i)
			{
				var child = children[i];
				this.executeOnElem(doc, child, currParent);
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
	executeOnElemBySelector: function(doc, rootElem, parentWidget)
	{
		//console.log('Using selector');
		var selector = '[' + this.WIDGET_ATTRIB + '],[' + this.WIDGET_ATTRIB_ALT + ']';
		//var selector = '[' + this.WIDGET_ATTRIB + ']';
		var allElems = rootElem.querySelectorAll(selector);
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

				if (elem.isContentEditable && !Kekule.Widget.AutoLauncher.enableOnEditable)
					continue;

				var parentWidgetElem = elem[this.FIELD_PARENT_WIDGET_ELEM] || null;
				// create widget only on top level elem when enableCascadeLaunch is false
				if (Kekule.Widget.AutoLauncher.enableCascadeLaunch || !parentWidgetElem)
				{
					var pWidget = null;
					if (parentWidgetElem)
					{
						// we can be sure that the parentWidgetElem is before this one in array
						// and the widget on it has already been created
						var pWidget = Kekule.Widget.getWidgetOnElem(parentWidgetElem);
					}
					this.createWidgetOnElem(doc, elem, pWidget);
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
	createWidgetOnElem: function(doc, elem, parentWidget)
	{
		var result = null;
		// if elem already binded with a widget, do nothing
		var old = Kekule.Widget.getWidgetOnElem(elem);
		if (old)
			return old;
		//console.log('Create widget on elem', elem, parentWidget && parentWidget.getElement());
		// check if elem has widget specified attribute.
		var widgetName = elem.getAttribute(this.WIDGET_ATTRIB);
		if (!widgetName)
			widgetName = elem.getAttribute(this.WIDGET_ATTRIB_ALT);
		if (widgetName)  // may be a widget
		{
			var widgetClass = this.getWidgetClass(widgetName);
			if (widgetClass)
			{
				result = new widgetClass(elem);
				if (result)  // create successful
				{
					if (parentWidget)
						result.setParent(parentWidget);
				}
			}
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

/** A flag to turn on or off auto launcher. */
Kekule.Widget.AutoLauncher.enabled = true;
/** A flag to enable or disable launching child widgets inside a widget element. */
Kekule.Widget.AutoLauncher.enableCascadeLaunch = true;
/** A flag to enable or disable checking dynamic inserted content in HTML page. */
Kekule.Widget.AutoLauncher.enableDynamicDomCheck = true;
/** A flag to enable or disable launching widgets on element in HTML editor (usually should not). */
Kekule.Widget.AutoLauncher.enableOnEditable = false;


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

	if (Kekule.Widget.AutoLauncher.enabled)
	{
		//console.log('do autolaunch on body', document.body);
		Kekule.Widget.autoLauncher.execute(document.body);
	}
	// add dynamic node inserting observer
	if (Kekule.X.MutationObserver)
	{
		var observer = new Kekule.X.MutationObserver(
			function(mutations)
			{
				if (Kekule.Widget.AutoLauncher.enableDynamicDomCheck)
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
				if (Kekule.Widget.AutoLauncher.enableDynamicDomCheck)
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