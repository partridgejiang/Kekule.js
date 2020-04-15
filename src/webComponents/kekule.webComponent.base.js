/**
 * @fileoverview
 * Build web components from Kekule widgets.
 * Note since web component is only supported in modern browsers, here we use the class keyword to create JS class.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /utils/kekule.domUtils.js
 * requires /xbrowsers/kekule.x.js
 * requires /widget/kekule.widget.base.js
 */

(function(){
"use strict";

/**
 * Base namespace of web component functions and classes.
 * @namespace
 */
Kekule.WebComponent = {};

Kekule.globalOptions.add('webComponent.init', {
	shadowInitOptions: {mode: 'open'}
});
Kekule.globalOptions.add('webComponent.widgetWrapper', {
	exposeWidgetProperties: true,
	exposeWidgetMethods: false,
	// widget properties may conflict with element, should not be exposed in wrapping
	ignoredProperties: ['id', 'draggable', 'droppable', 'innerHTML', 'style', 'offsetParent', 'offsetLeft', 'offsetTop', 'offsetWidth', 'offsetHeight'],
	ignoredMethods: [
		'constructor', 'initialize', 'finalize', 'doFinalize', 'afterInitialization', 'initProperties', 'initPropValues', 'saved', 'loaded',
		'invokeEvent',
	]
});


/** @ignore */
var WC = Kekule.WebComponent;

var DU = Kekule.DomUtils;

/**
 * A helper class to transfer HTML events from web component shadow root to widget event global manager.
 * User should not use this class directly.
 * @augments {Kekule.Widget.BaseEventsReceiver}
 * @class
 */
Kekule.WebComponent.WebComponentContextEventRelayer = Class.create(Kekule.Widget.BaseEventsReceiver,
/** @lends Kekule.WebComponent.WebComponentContextEventRelayer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.WebComponent.WebComponentContextEventRelayer',
	/** @constructs */
	initialize: function(/*$super, */doc, eventRoot, globalManager)
	{
		this._globalManager = globalManager;
		this.tryApplySuper('initialize', [doc, eventRoot])  /* $super(doc, eventRoot) */;
		this._isInShadow = eventRoot && DU.isInShadowRoot(eventRoot);
		this._globalManager.setHasWebComponentContext(true);  // notify GM that web component context has been built
	},

	/**
	 * Returns whether the event root object is inside the shadow root of web component.
	 * @returns {Bool}
	 */
	isInShadow: function()
	{
		return this._isInShadow;
	},

	// here we only relay UI and DOM insert/remove events.
	// Window event are handled directly by global manager, and hammer touch event are handled directly by widget itself.
	/** @ignore */
	reactUiEvent: function(/*$super, */e)
	{
		var result = this.tryApplySuper('reactUiEvent', [e])  /* $super(e) */;
		if (this.isInShadow())
		{
			result = this._globalManager.reactUiEvent(e);
			e.stopPropagation();
		}
		return result;
	},
	/** @ignore */
	reactDomNodeInsertEvent: function(/*$super, */e)
	{
		if (this.isInShadow())
		{
			e.stopPropagation();
			return this._globalManager.reactDomNodeInsertEvent(e);
		}
		else
			return this.tryApplySuper('reactDomNodeInsertEvent', [e])  /* $super(e) */;
	},
	/** @ignore */
	reactDomNodeRemoveEvent: function(/*$super, */e)
	{
		if (this.isInShadow())
		{
			e.stopPropagation();
			return this._globalManager.reactDomNodeRemoveEvent(e);
		}
		else
			return this.tryApplySuper('reactDomNodeRemoveEvent', [e])  /* $super(e) */;
	},
	/** @ignore */
	reactDomMutation: function(/*$super, */mutations)
	{
		if (this.isInShadow())
			return this._globalManager.reactDomMutation(mutations);
		else
			return this.tryApplySuper('reactDomMutation')  /* $super() */;
	}
});


/**
 * A helper class to hold the popups of Kekule widget system.
 * User should not use this class directly.
 * @augments {HTMLElement}
 * @class
 * @ignore
 */
class WebComponentContextPopupHost extends HTMLElement
{
	constructor()
	{
		super();
		var shadow = this.attachShadow(Kekule.globalOptions.webComponent.init.shadowInitOptions);
		this._initStyles(shadow);
		this._importStyleSheet(shadow);
		this._createSubElements(shadow);

		var eventRelayer = new Kekule.WebComponent.WebComponentContextEventRelayer(this.ownerDocument, this.hostElem, Kekule.Widget.globalManager);
	}

	_createSubElements(host)
	{
		var containerElem = this.ownerDocument.createElement('div');
		host.appendChild(containerElem);
		this._hostElem = containerElem;
	}

	_importStyleSheet(shadow)
	{
		Kekule.Widget.globalManager.loadTheme(shadow);
	}

	_initStyles(shadow)
	{
		var styleElem = shadow.ownerDocument.createElement('style');
		styleElem.innerHTML = ':host { position: static; width: 0px; height: 0px; left: 0px; top: 0px; }';
		shadow.appendChild(styleElem);
	}

	ensureToBeLast()
	{
		var body = this.ownerDocument.body;
		if (body.lastChild !== this)
		{
			body.appendChild(this);
		}
	}

	get hostElem()
	{
		return this._hostElem;
	}
}
Kekule.WebComponent.WebComponentContextPopupHost = WebComponentContextPopupHost;

// important, must register custom element, otherwise the caller of WebComponentContextPopupHost constructor causes error
if (typeof(customElements) !== 'undefined')
	customElements.define('kekule-webcomponent-popup-host', WebComponentContextPopupHost);

////////////// Extend Container /////////////////
/*
ClassEx.extendMethod(Kekule.Widget.Container, 'getChildHolderSlot', function($origin){
	if (Kekule.BrowserFeature.htmlSlot)
	{
		var elem = this.getChildrenHolderElement();
		if (elem && elem.tagName.toLowerCase() === 'slot')
			return elem;
	}
	return null;
});
ClassEx.defineProp(Kekule.Widget.Container, 'childHolderSlotName', {
	'dataType': DataType.STRING, 'serializable': false,
	'getter': function() { var elem = this.getChildHolderSlot(); return elem && elem.name; },
	'setter': function(value) { var elem = this.getChildHolderSlot(); if (elem) elem.name = value; }
});
*/

////////////// Extend GlobalManager /////////////////
/** @ignore */
Kekule.WebComponent.widgetWrapperPopupHost = null;

ClassEx.extend(Kekule.Widget.GlobalManager, {
	/** @private */
	getWebComponentContextRootElem: function()
	{
		if (!Kekule.WebComponent.widgetWrapperPopupHost)
		{
			Kekule.WebComponent.widgetWrapperPopupHost = new WebComponentContextPopupHost();
			document.body.appendChild(Kekule.WebComponent.widgetWrapperPopupHost);
		}
		Kekule.WebComponent.widgetWrapperPopupHost.ensureToBeLast(); // ensure it is always the last element in body
		return Kekule.WebComponent.widgetWrapperPopupHost.hostElem;
	},
	isWidgetEnvironmentSetupIn: function(contextName)
	{
		if (contextName === 'webComponent')
			return !!this.getHasWebComponentContext();
		else   // default, document context
		{
			if (!this._docContextEnvironmentSetup)
			{
				var defThemeLoaded = this._detectIfThemeLoaded(this.getDocContextRootElem());
				if (defThemeLoaded)  // document context already setup, store it
				{
					this._docContextEnvironmentSetup = true;
				}
			}
			return this._docContextEnvironmentSetup;
		}
	}
});

ClassEx.extendMethod(Kekule.Widget.GlobalManager, 'getWidgetContextRootElement', function($origin, widget){
	if (widget && widget.isWrappedInWebComponent())
	{
		/*
		if (!Kekule.WebComponent.widgetWrapperPopupHost)
		{
			Kekule.WebComponent.widgetWrapperPopupHost = new WebComponentContextPopupHost();
			document.body.appendChild(Kekule.WebComponent.widgetWrapperPopupHost);
		}
		Kekule.WebComponent.widgetWrapperPopupHost.ensureToBeLast(); // ensure it is always the last element in body
		return Kekule.WebComponent.widgetWrapperPopupHost.hostElem;
		*/
		return this.getWebComponentContextRootElem();
	}
	else
		return $origin(widget);
});
ClassEx.extendMethod(Kekule.Widget.GlobalManager, 'getDefaultContextRootElem', function($origin){
	if (this.isWidgetEnvironmentSetupIn('document'))
		return this.getDocContextRootElem();
	else if (this.isWidgetEnvironmentSetupIn('webComponent'))
		return this.getWebComponentContextRootElem();
	else
		return $origin();
});
/*
ClassEx.extendMethod(Kekule.Widget.GlobalManager, '_retrieveTouchEventActualTarget', function($origin, event){
	var result = $origin(event);
	if (result.shadowRoot)  // has shadow DOM, event may be evoked by child in the shadow
	{
		if (result.widget && result.widget instanceof Kekule.Widget.BaseWidget)  // has wrapped widget
		{
			var shadow = result.shadowRoot;
			var actualTarget = shadow.elementFromPoint(event.clientX, event.clientY) || result;
			return actualTarget;
		}
	}
	return result;
});
*/


// A special property indicating whether the web component context has been built
ClassEx.defineProp(Kekule.Widget.GlobalManager, 'hasWebComponentContext', {'dataType': DataType.BOOL, 'serializable': false});


ClassEx.extend(Kekule.Widget.BaseWidget, {
	isWrappedInWebComponent: function()
	{
		if (typeof(ShadowRoot) === 'undefined')
			return false;

		var elem = this.getElement();
		var root = elem.getRootNode && elem.getRootNode();
		return !!(root && root instanceof ShadowRoot)
	}
});

/**
 * A base class for component wrapped from Kekule widget.
 * User should not use this class directly.
 * @augments {HTMLElement}
 * @class
 */
Kekule.WebComponent.BaseWidgetWrapper = class extends HTMLElement {
	constructor()
	{
		super();

		var shadow = this.attachShadow(Kekule.globalOptions.webComponent.init.shadowInitOptions);
		this._shadow = shadow;
		var widget = this._createWidget(this.constructor.widgetClass, shadow);
		this._prepareStyles(shadow);

		var eventRelayer = new Kekule.WebComponent.WebComponentContextEventRelayer(this.ownerDocument, widget.getElement()/*shadow*/, Kekule.Widget.globalManager);

		this._reflectingChangedAttributes = [];
	}

	connectedCallback()
	{
		// set up prop values from attribute
		var attribNames = this.getAttributeNames();
		var observedAttribNames = this.constructor.observedAttributes;
		attribNames = Kekule.ArrayUtils.intersect(attribNames, observedAttribNames);
		for (var i = 0, l = attribNames.length; i < l; ++i)
		{
			var value = this.getAttribute(attribNames[i]);
			//Kekule.Widget.Utils.setWidgetPropFromElemAttrib(this.widget, attribNames[i], value);
			this._setWidgetPropValueFromAttribute(attribNames[i], value);
		}
	}

	static get observedAttributes()
	{
		var attributes = [];
		if (this._exposedWidgetProperties)
		{
			for (var i = 0, l = this._exposedWidgetProperties.length; i < l; ++i)
			{
				var propInfo = this._exposedWidgetProperties[i];
				var pname = propInfo.name;
				attributes.push(pname.dasherize());
				attributes.push('data-' + pname.dasherize());
			}
		}
		//Kekule.ArrayUtils.pushUnique(attributes, 'slot-name');  // always observe this
		return attributes;
	}

	attributeChangedCallback(name, oldVal, newVal)
	{
		if (!this._isChangingPropFromAttribute(name))  // avoid recurse
		{
			try
			{
				this._reflectingChangedAttributes.push(name);
				this._setWidgetPropValueFromAttribute(name, newVal);
			}
			finally
			{
				Kekule.ArrayUtils.remove(this._reflectingChangedAttributes, name);
			}
		}
	}

	_setWidgetPropValueFromAttribute(attribName, value)
	{
		/*
		if (attribName === 'slot-name')
			this.slotName = value;
		else
		*/
		Kekule.Widget.Utils.setWidgetPropFromElemAttrib(this.widget, attribName, value);
	}

	_isChangingPropFromAttribute(attribName)
	{
		return this._reflectingChangedAttributes.indexOf(attribName) >= 0;
	}

	static get widgetClass()
	{
		return this._widgetClass;
	}
	static set widgetClass(value)
	{
		this._widgetClass = value;
	}

	static _exposeWidgetProperties(exposedProps, ignoredProps, options)
	{
		var op = options || {};
		var wClass = this.widgetClass;
		var props = ClassEx.getAllPropList(wClass);
		var exposedPropInfos = [];
		var getterSetterMethods = [];

		for (var i = 0, l = props.getLength(); i < l; ++i)
		{
			var propInfo = props.getPropInfoAt(i);
			if (exposedProps && exposedProps.indexOf(propInfo.name) < 0)
				continue;
			if (ignoredProps && ignoredProps.indexOf(propInfo.name) >= 0)
				continue;

			if (Kekule.ObjUtils.getPropertyDescriptor(this.prototype, propInfo.name, true))  // already has this property
			{
				if (!op.overwriteExisitedProperties)
				{
					continue;
				}
			}

			//if (__definePropertyAvailable__)
			{
				exposedPropInfos.push(propInfo);

				var descs = {
					'enumerable': propInfo.enumerable,
					'configurable': false
				};
				if (descs.enumerable === undefined)
					descs.enumerable = true;
				//console.log('define prop', propInfo);
				if (propInfo.getter)
				{
					var getterName = propInfo.getter;
					var selfGetterName = 'get' + propInfo.name.upperFirst();
					//var getFunc = this.prototype[selfGetterName] = new Function('return this.widget.getPropValue("' + propInfo.name + '");');
					(function(propName, descs){
						var getFunc = function(){
							return this.widget.getPropValue(propName);
						};
						descs.get = getFunc;
					})(propInfo.name, descs);
					getterSetterMethods.push(selfGetterName);
				}
				if (propInfo.setter)
				{
					var setterName = propInfo.setter;
					var selfSetterName = 'set' + propInfo.name.upperFirst();
					/*
					var setFunc = this.prototype[selfSetterName]
						= new Function(
						'value',
						'var result = this.widget.setPropValue("' + propInfo.name + '", value);' +
						'var newVal = this.widget.getPropValue("' + propInfo.name + '");' +
						'this._exposedPropValueChanged("' + propInfo.name + '", newVal);' +
						'return result;'
					);
					*/
					(function(propName, descs){
						var setFunc = function(value){
							var result = this.widget.setPropValue(propName, value);
							var newVal = this.widget.getPropValue(propName);
							this._exposedPropValueChanged(propName, newVal);
							return result;
						};
						descs.set = setFunc;
					})(propInfo.name, descs);
					getterSetterMethods.push(selfSetterName);
				}

				try
				{
					Object.defineProperty(this.prototype, propInfo.name, descs);
				}
				catch(e)
				{
					throw e;
				}
			}
		}
		this._exposedWidgetProperties = exposedPropInfos;
		return {
			'exposedPropInfos': exposedPropInfos,
			'getterSetterMethodNames': getterSetterMethods
		};
	}

	static _exposeWidgetMethods(exposedMethods, ignoredMethods, options)
	{
		var op = options || {};

		function _getOwnedMethodNames(aClass)
		{
			var proto = ClassEx.getPrototype(aClass);
			var superClass = ClassEx.getSuperClass(aClass);
			var superProto = superClass && ClassEx.getPrototype(superClass);
			var fields = Object.getOwnPropertyNames(proto);
			var result = [];
			for (var i = 0, l = fields.length; i < l; ++i)
			{
				var name = fields[i];
				var descriptor = Object.getOwnPropertyDescriptor(proto, name);
				if (descriptor && descriptor.value && typeof(descriptor.value) === 'function')  // ensure is function
				{
					result.push(name);
				}
			}
			return result;
		}
		function _getAllMethodNamesOfClass(aClass, rootClass)   // aClass must be descendant of ObjectEx
		{
			var result = _getOwnedMethodNames(aClass);
			if (aClass !== rootClass)
			{
				var superClass = ClassEx.getSuperClass(aClass);
				if (superClass)
				{
					var superNames = _getAllMethodNamesOfClass(superClass, rootClass);
					result = superNames.concat(result);
				}
			}
			return result;
		}

		var wClass = this.widgetClass;
		var proto = ClassEx.getPrototype(wClass);
		var methodNames = _getAllMethodNamesOfClass(wClass, Kekule.Widget.BaseWidget);
		//var ignoredSuperClassMethodNames = _getAllMethodNamesOfClass(ClassEx.getSuperClass(Kekule.Widget.BaseWidget), ObjectEx);  // ignore all methods of super classes
		var excludeSuperClassProto = ClassEx.getPrototype(ClassEx.getSuperClass(Kekule.Widget.BaseWidget));

		var exposedMethodNames = [];
		for (var i = 0, l = methodNames.length; i < l; ++i)
		{
			var name = methodNames[i];
			var explicitExpose = exposedMethods && exposedMethods.indexOf(name) >= 0;

			if (ignoredMethods && ignoredMethods.indexOf(name) >= 0)
				continue;
			if (exposedMethods && exposedMethods.indexOf(name) < 0)
				continue;

			if (!explicitExpose && (name in excludeSuperClassProto))  // exclude all methods before Kekule.Widget.BaseWidget
				continue;
			if (!explicitExpose && name.startsWith('_'))  // bypass private methods
				continue;

			if (Object.getOwnPropertyDescriptor(name))
				continue;
			try
			{
				if (name in this)  // can not overwrite existed
				{
					continue;
				}
			}
			catch(e)
			{

			}

			/*
			this.prototype[name] = new Function('',
				'var func = this.widget["' + name +'"];' +
			  'return func.apply(this.widget, arguments);'
			);
			*/
			(function(self, name, exposedMethodNames){
				self.prototype[name] = function(){
					var func = this.widget[name];
					return func.apply(this.widget, arguments);
				};
				exposedMethodNames.push(name);
			})(this, name, exposedMethodNames);
		}
		//console.log('expose method names', exposedMethodNames);
		return exposedMethodNames;
	}

	_createWidget(widgetClass, shadow)
	{
		this._widget = new widgetClass(this.ownerDocument);
		this._widget.beginUpdate();
		try
		{
			var style = this._widget.getElement().style;
			style.width = '100%';
			style.height = '100%';  // widget fulfill the component element
			//this._installSlotEventHandler(this._widget);
			this._widget.appendToElem(shadow);
		}
		finally
		{
			this._widget.endUpdate();
		}
		return this._widget;
	}

	/*
	_installSlotEventHandler(widget)
	{
		//var EU = Kekule.
		if (widget.getChildHolderSlot)
		{
			widget.getElement().addEventListener('slotchange', function(e){
				var slot = widget.getChildHolderSlot()
				if (slot && slot === e.target)
				{
					if (Kekule.DomUtils.isElement(e.currentTarget))
					{
						var currTargetWidget = Kekule.Widget.getWidgetOnElem(e.currentTarget);
						if (currTargetWidget)
						{
							var assignedNodes = slot.assignedNodes();
							if (assignedNodes.indexOf(e.currentTarget) < 0)  // a new node added
							{
								//widget.childWidgetAdded(currTargetWidget);
								//console.log('widget inserted', currTargetWidget.getClassName(), e.currentTarget);
							}
							else  // old node removed
							{
								widget.childWidgetRemoved(currTargetWidget);
							}
							//console.log(e.target, slot.assignedNodes(), e.target in slot.assignedNodes());
						}
					}
				}
			});
		}
	}
  */
	_prepareStyles(shadow)
	{
		Kekule.Widget.globalManager.loadTheme(shadow);
		var styleElem = shadow.ownerDocument.createElement('style');
		styleElem.innerHTML = ':host { display: inline-block; position: relative; vertical-align: bottom; }\n' +
			':host([hidden]) { display: none }';
		shadow.appendChild(styleElem);
	}

	_exposedPropValueChanged(propName, value)
	{
		var propInfo = this.widget.getPropInfo(propName);
		if (propInfo && DataType.isSimpleValue(value))  // only feedback the simple value attributes
		{
			var attribName = propName.dasherize();
			this.setAttribute(attribName, value);
		}
	}

	get widgetHost()
	{
		return this._shadow;
	}
	get widget()
	{
		return this._widget;
	}
	/*
	get slotName()
	{
		return this.widget.getChildHolderSlotName();
	}
	set slotName(value)
	{
		this.widget.setChildHolderSlotName(value);
	}
	*/
};

/**
 * Some util functions about web component
 * @class
 */
Kekule.WebComponent.Utils = {
	/**
	 * Wrap a Kekule widget into web component.
	 * @param {Class} widgetClass
	 * @param {String} customElemTag Custom element tag name binding with this component.
	 * @param {Hash} options May include fields:
	 *   {
	 *     exposeWidgetProperties: bool,
	 *     exposedProperties: array,
	 *     ignoredProperties: array,
	 *     overwriteExisitedProperties: bool,
	 *     exposeWidgetMethods: bool,
	 *     exposedMethods: array,
	 *     ignoredMethods: array,
	 *     //overwriteExisitedProperties: bool
	 *   }
	 * @returns {Class} Web component class.
	 */
	wrapWidget: function(widgetClass, customElemTag, options)
	{
		var globalOptions = Kekule.globalOptions.webComponent.widgetWrapper;
		var op = Object.extend({
			exposeWidgetProperties: globalOptions.exposeWidgetProperties,
			ignoredProperties: globalOptions.ignoredProperties,
			exposeWidgetMethods: globalOptions.exposeWidgetMethods,
			ignoredMethods: globalOptions.ignoredMethods
		}, options || {});
		var result = class extends Kekule.WebComponent.BaseWidgetWrapper {
			constructor()
			{
				super();
			}
		};
		result.widgetClass = widgetClass;
		var exposedPropResult;
		if (op.exposeWidgetProperties)
		{
			exposedPropResult = result._exposeWidgetProperties(op.exposedProperties, op.ignoredProperties, {overwriteExisitedProperties: op.overwriteExisitedProperties});
		}
		if (op.exposeWidgetMethods)
		{
			var ignoredMethods = op.ignoredMethods || [];
			if (exposedPropResult)
				ignoredMethods = ignoredMethods.concat(exposedPropResult.getterSetterMethodNames);
			result._exposeWidgetMethods(op.exposedMethods, ignoredMethods, {});
		}
		if (customElemTag && typeof(customElements) !== 'undefined')
			customElements.define(customElemTag, result);
		return result;
	}
}

})();