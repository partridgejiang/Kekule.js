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
			var elem = pendingElems[i]
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
		try
		{
			this.executeOnElem(rootElem.ownerDocument, rootElem, null);
		}
		finally
		{
			this.endExec();
		}
	},
	/**
	 * Execute launch process on element and its children. Widget created will be set as child of parentWidget.
	 * @param {HTMLDocument} doc
	 * @param {HTMLElement} elem
	 * @param {Kekule.Widget.BaseWidget} parentWidget Can be null.
	 */
	executeOnElem: function(doc, elem, parentWidget)
	{
		if (elem.isContentEditable && !Kekule.Widget.AutoLauncher.enableOnEditable)
			return;
		var widget;
		var currParent = parentWidget;
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
	 * Create new widget on an element.
	 * @param {HTMLDocument} doc
	 * @param {HTMLElement} elem
	 * @param {Class} widgetClass
	 * @returns {Kekule.Widget.BaseWidget}
	 */
	createWidgetOnElem: function(doc, elem, widgetClass)
	{
		var result = new widgetClass(elem);
		/* No need to check data field here, as this job is done in widget.bindElement method.
		// iterate data-XXX attribute to set widget properties
		var dataset = DU.getDataset(elem);
		for (var key in dataset)
		{
			if (dataset.hasOwnProperty(key))
			{
				var value = dataset[key];
				if (value)
				{
					Kekule.Widget.Utils.setWidgetPropFromElemAttrib(result, key, value);
				}
			}
		}
		*/
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