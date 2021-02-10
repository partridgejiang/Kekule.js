//(function(){

var doc = document;

console.log(Kekule.Widget.BaseEventsReceiver);

var EventRelayer = Class.create(Kekule.Widget.BaseEventsReceiver, {
	initialize: function($super, doc, eventRoot, globalManager)
	{
		//console.log('init called');
		this._globalManager = globalManager;
		$super(doc, eventRoot);
	},

	/** @private */
	reactUiEvent: function($super, e)
	{
		$super(e);
		//console.log('relay event', e.getTarget(), e);
		var result = this._globalManager.reactUiEvent(e);
		e.stopPropagation();
		return result;
	},

	reactDomMutation: function(mutations)
	{
		console.log(mutations);
		return this._globalManager.reactDomMutation(mutations);
	},

	reactDomNodeInsertEvent: function(e)
	{
		console.log('internal DOM insert', e);
		e.stopPropagation();
		return this._globalManager.reactDomNodeInsertEvent(e);
	},

	reactDomNodeRemoveEvent: function(e)
	{
		console.log('internal DOM remove', e);
		e.stopPropagation();
		return this._globalManager.reactDomNodeRemoveEvent(e);
	},
});


class PopupWidgetLayer extends HTMLElement {
	constructor()
	{
		console.log('Create popup context');
		super();
		var shadow = this.attachShadow({mode: 'open'});
		this._importStyleSheet(shadow);
		var containerElem = this.ownerDocument.createElement('div');
		shadow.appendChild(containerElem);
		this._containerElem = containerElem;

		var eventRelayer = new EventRelayer(document, containerElem, Kekule.Widget.globalManager);
	}

	_importStyleSheet(shadow)
	{
		Kekule.Widget.globalManager.loadTheme(shadow);
	}

	get containerElem()
	{
		return this._containerElem;
	}
}


/*
var PopupWidgetLayer = Class.create(HTMLElement, {
	initialize: function()
	{
		console.log('Create popup context');
		this.__proto__.constructor();
		var shadow = this.attachShadow({mode: 'open'});
		this._prepareStyles(shadow);
		var containerElem = this.ownerDocument.createElement('div');
		shadow.appendChild(containerElem);
		this._containerElem = containerElem;

		var eventRelayer = new EventRelayer(document, shadow, Kekule.Widget.globalManager);

		this.defineProperty(this, 'containerElem', {
			'get': function() { return this._containerElem; }
		});
	},
	_prepareStyles: function(shadow)
	{
		Kekule.Widget.globalManager.loadTheme(shadow);
	}
});
*/

class ComposerComponent extends HTMLElement
{
	constructor()
	{
		console.log('Create composer');
		super();
		this._createWidget();
	}

	static get observedAttributes() {
		var wClass = Kekule.Editor.Composer;
		var props = ClassEx.getAllPropList(wClass);
		var attributes = [];
		for (var i = 0, l = props.getLength(); i < l; ++i)
		{
			var pname = props.getPropInfoAt(i).name;
			attributes.push(pname.dasherize());
			attributes.push('data-' + pname.dasherize());
		}
		return attributes;
	}

	attributeChangedCallback(name, oldVal, newVal) {
		console.log('set attrib', name, oldVal, newVal)
		Kekule.Widget.Utils.setWidgetPropFromElemAttrib(this._widget, name, newVal);
		//var pname = name.camelize;
		//this._widget.setPropValue(pname, newVal);
	}

	_importStyleSheet(shadow)
	{
		/*
		var elem = document.createElement('style');
		var path = Kekule.Widget.Utils.getThemeUrl();
		elem.innerHTML = '@import "' + path + '"';
		//elem.innerHTML = '@import "../../src/widgets/themes/default/kekule.css"';
		shadow.appendChild(elem);
		*/
		Kekule.Widget.globalManager.loadTheme(shadow);
	}

	_exposeWidgetProperties(widget)
	{
		var wClass = widget.getClass();
		var props = ClassEx.getAllPropList(wClass);
		for (var i = 0, l = props.getLength(); i < l; ++i)
		{
			var propInfo = props.getPropInfoAt(i);
			// ClassEx.defineProp(this.constructor.__proto__, prop.propName, prop);

			//if (__definePropertyAvailable__)
			{
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
					var getFunc = this['get' + propInfo.name.upperFirst()] = new Function('return this._widget.getPropValue("' + propInfo.name + '");');
					descs.get = getFunc;

					/*
					descs.get = function() {
						//console.log('getter', getterName, widget[getterName]);
						var func = widget[getterName];
						return func.apply(widget);
					};
					*/
				}
				if (propInfo.setter)
				{
					var setterName = propInfo.setter;
					var setFunc = this['set' + propInfo.name.upperFirst()]
						= new Function(
							'value',
							//'var attribName = "' + propInfo.name.dasherize() + '";' +
							//'this.setAttribute(attribName, JSON.stringify(value));' +
							//'console.log("set prop value", "' + propInfo.name + '", value);'+
							'return this._widget.setPropValue("' + propInfo.name + '", value);'
					);
					descs.set = setFunc;
					/*
					descs.set = function(value) {
						widget[propInfo.setter].apply(widget, [value]);
						return this;
					};
					*/
				}

				//prop.descriptor = descs;
				try
				{
					Object.defineProperty(this, propInfo.name, descs);
				}
				catch(e)
				{
					//console.log(this.getClassName(), propName);
					throw e;
				}
			}

		}
	}

	_createWidget()
	{
		// 创建一个 shadow root
		var shadow = this.attachShadow({mode: 'open'});
		//this.style.position = 'relative';

		this._importStyleSheet(shadow);

		var composerWidget = new Kekule.Editor.Composer(document);
		composerWidget.setResizable(true);

		var eventRelayer = new EventRelayer(document, /*shadow*/composerWidget.getElement(), composerWidget.getGlobalManager());

		composerWidget.appendToElem(shadow);
		this._widget = composerWidget;


		/*  DOM mutation can not be fired in shadow!!
		shadow.addEventListener('DOMNodeInserted', function(e){
			console.log('DOMNodeInserted in Component', e.target, e);
		});

		document.body.addEventListener('DOMNodeInserted', function(e){
			console.log('DOMNodeInserted in body', e.target, e);
		});
    */
		this._exposeWidgetProperties(composerWidget);
	}

	get widget() { return this._widget; }
}

customElements.define('kekule-composer', ComposerComponent);
customElements.define('kekule-popup-layer', PopupWidgetLayer);


var popupLayer;
ClassEx.extendMethod(Kekule.Widget.GlobalManager, 'getWidgetContextRootElement', function($origin, widget){
	var elem = widget.getElement();
	if (elem.getRootNode() instanceof ShadowRoot)
	{
		if (!popupLayer)
		{
			/*
			popupLayer = document.createElement('kekule-popup-layer');
			document.body.appendChild(popupLayer);
			*/
			popupLayer = new PopupWidgetLayer();
			document.body.appendChild(popupLayer);
		}
		return popupLayer.containerElem;
	}
	else
		return $origin(widget);
});

//})();