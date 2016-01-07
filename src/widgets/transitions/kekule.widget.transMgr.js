/**
 * @fileoverview
 * A helper unit to control the universal transition style (especially show/hide animation) of widgets.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /utils/kekule.utils.js
 * requires /utils/kekule.domUtils.js
 * requires /xbrowsers/kekule.x.js
 * requires /widget/kekule.widget.base.js
 * requires /widgets/transitions/kekule.widgert.transitions.js
 */


(function(){

/** @ignore */
SU = Kekule.StyleUtils;

/**
 * A singleton class to manage some global behavior of widgets show/hide process (especially with transitions).
 * User should not use this class directly.
 * @augments {ObjectEx}
 * @class
 *
 * @property {Kekule.Widget.ShowHideTransitionSelector} transitionSelector The helper object to select proper transition.
 * @property {Bool} enableTransition Whether use transition to show/hide widget.
 * @property {Int} showDuration Duration of appear transition, in ms.
 * @property {Int} hideDuration Duration of disappear transition, in ms.
 *
 * @private
 *
 */
Kekule.Widget.ShowHideManager = Class.create(ObjectEx,
/** @lends Kekule.Widget.ShowHideManager# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.ShowHideManager',
	/** @constructs */
	initialize: function($super)
	{
		$super();
		this.setEnableTransition(true);  // debug setting
		this.setShowDuration(300);
		this.setHideDuration(300);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('enableTransition', {'dataType': DataType.BOOL});
		this.defineProp('transitionSelector', {'dataType': 'Kekule.Widget.ShowHideTransitionSelector', 'serializable': false});
		//this.defineProp('transitionExecutor', {'dataType': 'Kekule.Widget.BaseTransition', 'serializable': false});
		this.defineProp('showDuration', {'dataType': DataType.INT});
		this.defineProp('hideDuration', {'dataType': DataType.INT});
	},

	/** @private */
	_getCallerElement: function(caller)
	{
		if (!caller)
			return null;
		else
			return caller.getElement? caller.getElement():
				Kekule.DomUtils.isElement(caller)? caller:
				null;
	},

	/** @private */
	isUsingTransition: function()
	{
		return this.getEnableTransition() && this.getTransitionSelector();
	},
	/**
	 * Select a proper transition by transitionSelector.
	 * @private
	 */
	selectTransition: function(widget, caller, showHideType)
	{
		var selector = this.getTransitionSelector();
		if (!selector)
			return null;
		else
		{
			var result = selector.selectTransition(widget, caller, showHideType);
			if (result && caller)
				result.setCaller(/*caller.getElement()*/this._getCallerElement(caller));
		}
		return result;
	},
	/**
	 * Show the widget. When the show process is done, callback() will be called.
	 * @param {Kekule.Widget.BaseWidget} widget
	 * @param {Kekule.Widget.BaseWidget} caller Who calls the show method and make this widget visible.
	 * @param {Function} callback
	 * @param {Int} showType, value from {@link Kekule.Widget.ShowHideType).
	 * @param {Hash} extraOptions Extra options passed to transition executor.
	 */
	show: function(widget, caller, callback, showType, extraOptions)
	{
		// prepare transition
		/*
		if (this.getEnabledTransition())
			this.prepareShow(widget);

		widget.setVisible(true);
		widget.setDisplayed(true);
		*/
		var transOptions = Object.extend(extraOptions || {}, {
			'from': 0,
			'to': 1,
			'isAppear': true,
			'duration': this.getShowDuration()
		});
		var transExecutor = this.selectTransition(widget, caller, showType);

		if (transExecutor && this.isUsingTransition() && transExecutor.canExecute(widget.getElement(), transOptions))
		{
			var done = function(e)
			{
				//console.log('callback show');
				// ensure displayed
				// here call setDisplayed and setVisible with second param, avoid call widgetShowStateChanged multiple times
				widget.setVisible(true, true);
				widget.setDisplayed(true, true);
				if (callback)
					callback();
			};
			//console.log('do transition');
			// do transition
			return transExecutor.execute(widget.getElement(), /*caller && caller.getElement()*/this._getCallerElement(caller), done, transOptions);
		}
		else  // no transition, show directly
		{
			// here call setDisplayed and setVisible with second param, avoid call widgetShowStateChanged multiple times
			widget.setVisible(true, true);
			widget.setDisplayed(true, true);
			if (callback)
				callback();
		}
		return null;  // if no transition, return nothing
	},
	/**
	 * Hide the widget. When the hide process is done, callback() will be called.
	 * @param {Kekule.Widget.BaseWidget} widget
	 * @param {Function} callback
	 * @param {Kekule.Widget.BaseWidget} caller
	 * @param {Int} hideType, value from {@link Kekule.Widget.ShowHideType).
	 * @param {Bool} useVisible If true CSS visible property will be set to hidden finally to hide widget, otherwise display: none will be used.
	 * @param {Hash} extraOptions Extra options passed to transition executor, can include special field:
	 *   {
	 *     useVisible: If true CSS visible property will be set to hidden finally to hide widget, otherwise display: none will be used.
	 *     callerPageRect: Sometimes caller widget is hidden and the ref rect can not be calculated directly from caller,
	 *       if so, this value ,may be used by transition executor.
	 *   }
	 */
	hide: function(widget, caller, callback, hideType, useVisible, extraOptions)
	{
		var transOptions = Object.extend(extraOptions, {
			'from': 1,
			'to': 0,
			'isDisappear': true,
			'duration': this.getHideDuration()
		});
		var useVisible = !!extraOptions.useVisible;
		var transExecutor = this.selectTransition(widget, caller, hideType);

		if (transExecutor && this.isUsingTransition() && transExecutor.canExecute(widget.getElement(), transOptions))
		{
			// ensure hide
			// here call setDisplayed and setVisible with second param, avoid call widgetShowStateChanged multiple times
			var done = function()
			{
				if (widget)
				{
					if (useVisible)
						widget.setVisible(false, true);
					else
						widget.setDisplayed(false, true);
				}
				if (callback)
					callback();
			};
			// do transition
			return transExecutor.execute(widget.getElement(), /*caller && caller.getElement()*/this._getCallerElement(caller), done, transOptions);
		}
		else  // no transition, hide directly
		{
			// here call setDisplayed and setVisible with second param, avoid call widgetShowStateChanged multiple times
			if (useVisible)
				widget.setVisible(false, true);
			else
				widget.setDisplayed(false, true);
			if (callback)
				callback();
		}
		return null;  // if no transition, returns nothing
	}
});
Kekule.ClassUtils.makeSingleton(Kekule.Widget.ShowHideManager);
Kekule.Widget.showHideManager = Kekule.Widget.ShowHideManager.getInstance();


/**
 * A class select proper transition in show/hide widgets.
 * User should not use this class directly.
 * @augments {ObjectEx}
 * @class
 *
 * //@property {Class} defaultTransitionClass Transition in showing/hiding drop down widgets (e.g. dropDown button group).
 * //@property {Class} popupTransitionClass Transition in showing/hiding popup widgets (e.g., popup dialog).
 * //@property {Class} defaultTransitionClass Transition in showing/hiding other widgets.
 *
 * @private
 */
Kekule.Widget.ShowHideTransitionSelector = Class.create(ObjectEx,
/** @lends Kekule.Widget.ShowHideTransitionSelector# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.ShowHideTransitionSelector',
	/** @constructs */
	initialize: function($super)
	{
		$super();
		this.setTransitionClassMap({});
	},
	/** @private */
	initProperties: function()
	{
		/*
		this.defineProp('defaultTransitionClass', {'dataType': DataType.CLASS, 'serializable': false});
		this.defineProp('dropDownTransitionClass', {'dataType': DataType.CLASS, 'serializable': false});
		this.defineProp('popupTransitionClass', {'dataType': DataType.CLASS, 'serializable': false});
		*/
		this.defineProp('transitionClassMap', {'dataType': DataType.OBJECT, 'serializable': false});
	},

	/** @private */
	_getTransClassOfType: function(showHideType)
	{
		var map = this.getTransitionClassMap();
		return map[showHideType] || map[Kekule.Widget.ShowHideType.DEFAULT];
	},

	/**
	 * Add a transition class mapping on showHideType.
	 * @param {Int} showHideType
	 * @param {Class} transClass
	 */
	addTransitionClass: function(showHideType, transClass)
	{
		this.getTransitionClassMap()[showHideType] = transClass;
	},

	/**
	 * Select a proper transition by input conditions.
	 * @param {Kekule.Widget.BaseWidget} widget
	 * @param {Kekule.Widget.BaseWidget} caller
	 * @param {Int} showHideType
	 * @returns {Kekule.Widget.BaseTransition}
	 */
	selectTransition: function(widget, caller, showHideType)
	{
		var transClass;
		var ST = Kekule.Widget.ShowHideType;
		if (caller)
		{
			/*
			if (showHideType === ST.POPUP)
				transClass = this.getPopupTransitionClass();
			else if (showHideType === ST.DROPDOWN)
				transClass = this.getDropDownTransitionClass();
			else
				transClass = this.getDefaultTransitionClass();
			*/
			transClass = this._getTransClassOfType(showHideType);
		}
		else
			//transClass = this.getDefaultTransitionClass();
			transClass = this._getTransClassOfType(Kekule.Widget.ShowHideType.DEFAULT);

		//console.log(showHideType, transClass);

		if (transClass)
			return new transClass();
		else
			return null;
	}
});


// debug
// TODO: need a factory to manage transition executors
// TODO: need a more flexible way to control the duration and style of show/hide transitions
//  for instance, may we have a "near/far" property in invoking transition?
//  When near is at left and far to right, use slideRight, when near=top and far=right, use SlideDown.
//Kekule.Widget.showHideManager.setTransitionExecutor(new Kekule.Widget.Css3OpacityTrans());
//Kekule.Widget.showHideManager.setTransitionExecutor(new Kekule.Widget.Css3SlideTransition(Kekule.Widget.Direction.AUTO));
//Kekule.Widget.showHideManager.setTransitionExecutor(new Kekule.Widget.Css3GrowTransition());

var defSelector = new Kekule.Widget.ShowHideTransitionSelector();
/*
defSelector.setDefaultTransitionClass(Kekule.Widget.Css3OpacityTrans);
defSelector.setDropDownTransitionClass(Kekule.Widget.Css3SlideTransition);
defSelector.setPopupTransitionClass(Kekule.Widget.Css3GrowTransition);
*/
var SHT = Kekule.Widget.ShowHideType;
defSelector.addTransitionClass(SHT.DEFAULT, Kekule.Widget.Css3OpacityTrans);
defSelector.addTransitionClass(SHT.DROPDOWN, Kekule.Widget.Css3SlideTransition);
defSelector.addTransitionClass(SHT.POPUP, Kekule.Widget.Css3GrowTransition);
defSelector.addTransitionClass(SHT.DIALOG, Kekule.Widget.Css3GrowTransition);

Kekule.Widget.showHideManager.setTransitionSelector(defSelector);

// debug
	//Kekule.Widget.showHideManager = null;


})();
