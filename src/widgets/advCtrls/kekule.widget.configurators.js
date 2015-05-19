/**
 * Created by ginger on 2015/1/28.
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /utils/kekule.domUtils.js
 * requires /xbrowsers/kekule.x.js
 * requires /widgets/kekule.widget.base.js
 * requires /widgets/operation/kekule.actions.js
 * requires /widgets/commonCtrls/kekule.widget.container.js
 * requires /widgets/commonCtrls/kekule.widget.tabViews.js
 * requires /widgets/advCtrls/objInspector/kekule.widget.objInspector.js
 */


(function(){
"use strict";

/** @ignore */
Kekule.Widget.HtmlClassNames = Object.extend(Kekule.Widget.HtmlClassNames, {
	WIDGET_CONFIGURATOR: 'K-Widget-Configurator',
	WIDGET_CONFIGURATOR_CLIENT: 'K-Widget-Configurator-Client',

	ACTION_OPEN_CONFIGURATOR: 'K-Action-Open-Configurator'
});
var CNS = Kekule.Widget.HtmlClassNames;

/**
 * A special widget class to open a config widget for ChemObjDisplayer.
 * Do not use this widget alone.
 * @class
 * @augments Kekule.Widget.Panel
 *
 * @param {Kekule.Widget.BaseWidget} widget
 * @property {Bool} autoUpdate Whether load and save config values automatically when configurator is shown or hide.
 */
/**
 * Invoked when the config has been changed. Event param of it has fields: {object, propertyName, oldValue, newValue}.
 * @name Kekule.Widget.Configurator#configChange
 * @event
 */
Kekule.Widget.Configurator = Class.create(Kekule.Widget.Panel,
/** @lends Kekule.Widget.Configurator# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.Configurator',
	/** @private */
	TAB_BTN_DATA_FIELD: '__$data__',
	/** @private */
	DEF_TAB_POSITION: Kekule.Widget.Position.RIGHT,
	/** @construct */
	initialize: function($super, widget)
	{
		this.setPropStoreFieldValue('widget', widget);
		this._objInspector = null;
		this._tabGroup = null;
		$super(widget);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('widget', {'dataType': 'Kekule.Widget.BaseWidget', 'serializable': false});
		this.defineProp('autoUpdate', {'dataType': DataType.BOOL});
		// TODO: tabPosition now is not totally workable
		this.defineProp('tabPosition', {'dataType': DataType.INT,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('tabPosition', value);
				if (this._tabGroup)
					this._tabGroup.setTabButtonPosition(value || this.DEF_TAB_POSITION);
			}
		});
	},
	/** @ignore */
	initPropValues: function($super)
	{
		$super();
		this.setLayout(Kekule.Widget.Layout.HORIZONTAL);
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.WIDGET_CONFIGURATOR;
	},
	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('div');
		return result;
	},
	/** @ignore */
	doCreateSubElements: function($super, doc, element)
	{
		var result = [];

		var rootElem = doc.createElement('div');
		rootElem.className = CNS.WIDGET_CONFIGURATOR_CLIENT;
		result.push(rootElem);

		// obj inspector
		var objInspector = new Kekule.Widget.ObjectInspector(this);
		objInspector.setShowObjsInfoPanel(false);
		objInspector.setSortField(null);
		objInspector.appendToElem(rootElem);
		this._objInspector = objInspector;
		objInspector.addEventListener('propertyChange', function(e){
			this.invokeEvent('configChange', {
				'obj': objInspector.getObjects()[0], 'propertyName': e.propertyInfo.name,
				'oldValue': e.oldValue, 'newValue': e.newValue
			});
			//console.log(objInspector.getObjects()[0]);
		}, this);

		// tab head
		var categories = this.getCategoryInfos();
		var tabBtnGroup = new Kekule.Widget.TabButtonGroup(this);
		this._tabGroup = tabBtnGroup;
		//console.log('tab position', this.getTabPosition());
		tabBtnGroup.setTabButtonPosition(this.getTabPosition() || this.DEF_TAB_POSITION/*Kekule.Widget.Position.RIGHT*/);
		var firstBtn;
		for (var i = 0, l = categories.length; i < l; ++i)
		{
			var c = categories[i];
			var btn = new Kekule.Widget.RadioButton(tabBtnGroup);
			btn.setText(c.title || c.name);
			btn.setHint(c.description || '');
			btn[this.TAB_BTN_DATA_FIELD] = c.obj;
			btn.appendToWidget(tabBtnGroup);
			if (i === 0)
			{
				firstBtn = btn;
			}
		}
		tabBtnGroup.addEventListener('execute', function(e){
			var btn = e.widget;
			if (btn instanceof Kekule.Widget.RadioButton)
				this._switchToTab(btn);
		}, this);
		tabBtnGroup.appendToElem(rootElem);
		if (categories.length <= 1)
			tabBtnGroup.setDisplayed('none');

		// switch
		firstBtn.setChecked(true);
		this._switchToTab(firstBtn);

		element.appendChild(rootElem);

		return result;
	},

	/** @ignore */
	doWidgetShowStateChanged: function($super, isShown)
	{
		$super(isShown);
		if (this.getAutoUpdate())
		{
			if (isShown)
				this.loadConfigValues();
			else
				this.saveConfigValues();
		}
	},

	/**
	 * Load config setting values from widget.
	 * Descendants may override this method.
	 */
	loadConfigValues: function()
	{
		// do nothing here
	},
	/**
	 * Save config setting values back to widget.
	 * Descendants may override this method.
	 */
	saveConfigValues: function()
	{
		// do nothing here
	},

	/**
	 * Get settings category, descendants need to override this method.
	 * @returns {Array}
	 */
	getCategoryInfos: function()
	{
		var widget = this.getWidget();
		var result = [];
		// configFacade
		var facade = widget.getSettingFacade();
		if (facade)
		{
			var propInfo = widget.getPropInfo('settingFacade');
			result.push({
				'obj': facade,
				'name': propInfo.name,
				'title': propInfo.title,
				'descrption': propInfo.description
			});
		}

		/*
		// renderConfigs and displayerConfigs
		var configObjs = [displayer.getDisplayerConfigs(), displayer.getRenderConfigs()];
		for (var j = 0, k = configObjs.length; j < k; ++j)
		{
			var config = configObjs[j];
			var props = config.getPropListOfScopes([Class.PropertyScope.PUBLISHED]);
			for (var i = 0, l = props.getLength(); i < l; ++i)
			{
				var propInfo = props.getPropInfoAt(i);
				var obj = config.getPropValue(propInfo.name);
				if (obj)
				{
					result.push({
						'obj': obj,
						'name': propInfo.name,
						'title': propInfo.title,
						'description': propInfo.description
					});
				}
			}
		}
		*/
		return result;
	},
	/** @private */
	_switchToTab: function(tabBtn)
	{
		var obj = tabBtn[this.TAB_BTN_DATA_FIELD];
		this._objInspector.setObjects(obj);
	}
});

/**
 * Action for open a widget to change widget configs.
 * @class
 * @augments Kekule.ActionDisplayerOpenConfigWidget
 */
Kekule.Widget.ActionOpenConfigWidget = Class.create(Kekule.Action,
/** @lends Kekule.Widget.ActionOpenConfigWidget# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.ActionOpenConfigWidget',
	/** @private */
	HTML_CLASSNAME: CNS.ACTION_OPEN_CONFIGURATOR,
	/** @constructs */
	initialize: function($super, widget)
	{
		$super();
		this.setWidget(widget);
		this.setText(/*Kekule.WidgetTexts.CAPTION_CONFIG*/Kekule.$L('WidgetTexts.CAPTION_CONFIG'));
		this.setHint(/*Kekule.WidgetTexts.HINT_CONFIG*/Kekule.$L('WidgetTexts.HINT_CONFIG'));
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('widget', {'dataType': 'Kekule.Widget.BaseWidget', 'serializable': false});
	},
	/** @private */
	doUpdate: function()
	{
		var w = this.getWidget();
		this.setEnabled(w && w.getEnabled());
	},
	/** @private */
	doExecute: function(target)
	{
		this.getWidget().openConfigurator(target);
	}
});

ClassEx.extend(Kekule.Widget.BaseWidget,
/** @lends Kekule.Widget.BaseWidget# */
{
	/** @private */
	getSettingFacadeClass: function()
	{
		var c = this.getClass();
		var result = null;
		do
		{
			var className = ClassEx.getClassName(c) + '.Settings';
			result = ClassEx.findClass(className);
			c = ClassEx.getSuperClass(c);
		}
		while (c && !result)

		return result;
	},

	/**
	 * Returns configurator class of displayer. Descendants may override this method.
	 * @returns {Class}
	 * @private
	 */
	getConfiguratorClass: function()
	{
		var c = this.getClass();
		var result = null;
		do
		{
			var className = ClassEx.getClassName(c) + '.Configurator';
			result = ClassEx.findClass(className);
			c = ClassEx.getSuperClass(c);
		}
		while (c && !result)

		return result;
	},
	/**
	 * Create a new configurator.
	 * @private
	 */
	createConfigurator: function()
	{
		var cclass = this.getConfiguratorClass();
		return new cclass(this);
	},
	/**
	 * Returns widget instance of configurator.
	 * @returns {Kekule.Widget.BaseWidget}
	 */
	getConfigurator: function()
	{
		if (!this._configurator)
		{
			this._configurator = this.createConfigurator();
		}
		return this._configurator;
	},
	/**
	 * Open a popup configurator to modify settings of displayer.
	 * @param {Kekule.Widget.BaseWidget} callerWidget Who invokes the action.
	 */
	openConfigurator: function(callerWidget)
	{
		var c = this.getConfigurator();
		//c.appendToWidget(this);
		c.show(callerWidget || this, null, Kekule.Widget.ShowHideType.DROPDOWN);
	}
});

ClassEx.defineProp(Kekule.Widget.BaseWidget, 'settingFacade', {'dataType': DataType.OBJECTEX, 'serializable': false, 'scope': Class.PropertyScope.PUBLIC,
	'setter': null,
	'getter': function()
	{
		var result = this.getPropStoreFieldValue('settingFacade');
		if (!result)
		{
			var c = this.getSettingFacadeClass();
			if (c)
			{
				result = new c(this);
				this.setPropStoreFieldValue('settingFacade', result);
			}
		}
		return result;
	}
});

/**
 * A special class to give a setting facade for BaseWidget.
 * Should use the following naming pattern: BaseClass.Settings (e.g. Kekule.ChemObject.Settings).
 * Do not use this class alone.
 * @class
 * @augments ObjectEx
 *
 * @param {Kekule.Widget.BaseWidget} widget
 * @ignore
 */
Kekule.Widget.BaseWidget.Settings = Class.create(ObjectEx,
/** @lends Kekule.Widget.BaseWidget.Settings# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.BaseWidget.Settings',
	/** @construct */
	initialize: function($super, widget)
	{
		this._basedClass = null;
		$super();
		this.setWidget(widget);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('widget', {'dataType': 'Kekule.Widget.BaseWidget', 'serializable': false, 'scope': Class.PropertyScope.PUBLIC});
		//this.defineProp('widgetClass', {'dataType': DataType.CLASS, 'serializable': false, 'setter': null, 'scope': Class.PropertyScope.PUBLIC});
	},
	/** @private */
	getBasedClass: function()
	{
		if (!this.hasOwnProperty('_basedClass') || !this._basedClass) // important, must check own property to avoid conflict by parent classes
		{
			var className = this.getClassName();
			var cascadeNames = className.split('.');
			cascadeNames.pop();  // remove '.Settings'
			className = cascadeNames.join('.');
			this._basedClass = ClassEx.findClass(className);
		}
		return this._basedClass;
	},
	/**
	 * Define property that directly mapped to widget's property.
	 * @param {String} propName
	 * @param {String} widgetPropName Name of corresponding property in widget.
	 * @return {Object} Property info object added to property list.
	 * @private
	 */
	defineDelegatedProp: function(propName, widgetPropName)
	{
		if (!widgetPropName)
			widgetPropName = propName;
		var widgetPropInfo = ClassEx.getPropInfo(this.getBasedClass(), widgetPropName);
		/*
		 var propOptions = {
		 'serializable': widgetPropInfo.serializable,
		 'dataType': widgetPropInfo.dataType,
		 'title': widgetPropInfo.title,
		 'description': widgetPropInfo.description,
		 'getter': null,
		 'setter': null
		 };
		 */
		var propOptions = Object.create(widgetPropInfo);
		// clear getter and setter
		propOptions.setter = null;
		propOptions.getter = null;
		if (widgetPropInfo.getter)
		{
			propOptions.getter = function()
			{
				//console.log('get delegate value', widgetPropName, this.getWidget().getPropValue(widgetPropName));
				return this.getWidget().getPropValue(widgetPropName);
			};
		}
		if (widgetPropInfo.setter)
		{
			propOptions.setter = function(value)
			{
				this.getWidget().setPropValue(widgetPropName, value);
			}
		}
		//console.log('define delegate prop', propOptions);
		this.defineProp(propName, propOptions);
	},
	/**
	 * Define a series of property that directly mapped to widget's property.
	 * @param {Array} propNames
	 * @param {Array} widgetPropNames Names of corresponding property in widget.
	 * @private
	 */
	defineDelegatedProps: function(propNames, widgetPropNames)
	{
		if (!widgetPropNames)
			widgetPropNames = [];
		for (var i = 0, l = propNames.length; i < l; ++i)
		{
			var propName = propNames[i];
			var widgetPropName = widgetPropNames[i] || propName;
			this.defineDelegatedProp(propName, widgetPropName);
		}
	}
});


})();