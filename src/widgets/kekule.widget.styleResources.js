/**
 * @fileoverview
 * Style resource is a special object that links to a CSS style selector (usually a CSS class).
 * User can appoint resource to a widget to change its style.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /utils/kekule.domUtils.js
 * requires /xbrowsers/kekule.x.js
 * requires/widgets/kekule.widget.base.js
 */

(function(){

"use strict"

var EU = Kekule.HtmlElementUtils;

/**
 * A base class to associate with CSS styles.
 * User can set the instance of this class to widget to set special styles.
 * @class
 * @augments ObjectEx
 *
 * @property {String} name Name of resource. Can not be modified after created.
 * @property {String} cssClassName CSS class name associated with this resource. When apply to widget, this name
 *   will be added to HTML element.
 *   Note, user can use space separated string to add multiple classes, e.g. 'Class1 Class2 Class3'.
 */
Kekule.Widget.StyleResource = Class.create(ObjectEx,
/** @lends Kekule.Widget.StyleResource# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.StyleResource',
	/** @constructs */
	initialize: function($super, name, cssClassName)
	{
		$super();
		this.setPropStoreFieldValue('name', name);
		if (cssClassName)
			this.setCssClassName(cssClassName);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('name', {'dataType': DataType.STRING, 'setter': null});
		this.defineProp('cssClassName', {'dataType': DataType.STRING});
	},
	/**
	 * Apply style to widget or HTML element.
	 * Descendants can override this method to do more complex job.
	 * @param {Variant} target A widget or HTML element.
	 */
	linkTo: function(target)
	{
		EU.addClass(this._getElement(target), this.getCssClassName());
		return this;
	},
	/**
	 * Remove style from widget or HTML element.
	 * Descendants can override this method to do more complex job.
	 * @param {Variant} target A widget or HTML element.
	 */
	unlinkFrom: function(target)
	{
		EU.removeClass(this._getElement(target), this.getCssClassName());
	},
	/** @private */
	_getElement: function(target)
	{
		if (target instanceof Kekule.Widget.BaseWidget)
			return target.getElement();
		else
			return target;
	}
});

/**
 * A global manager for register style resources.
 * @class
 */
Kekule.Widget.StyleResourceManager = {
	/** @private */
	_resources: {},
	/**
	 * Register a named resource.
	 * @param {Kekule.Widget.StyleResource} resource
	 */
	register: function(resource)
	{
		var name = resource.getName();
		if (name)
		{
			RM._resources[name] = resource;
		}
		return RM;
	},
	/**
	 * Register a named resource.
	 * @param {Variant} resourceOrName
	 */
	unregister: function(resourceOrName)
	{
		var name;
		if (typeof(resourceOrName) === 'string')
			name = resourceOrName;
		else if (resourceOrName.getName)
			name = resourceOrName.getName();
		if (name)
			delete RM._resources[name];
		return RM;
	},
	/**
	 * Returns resource object registered with name.
	 * @param {String} name
	 * @returns {Kekule.Widget.StyleResource}
	 */
	getResource: function(name)
	{
		return RM._resources[name];
	}
};

/**
 * Some predefined resource names
 * @class
 */
Kekule.Widget.StyleResourceNames = {
	/** Style resource name should all start with this prefix. */
	PREFIX: '$$',
	/** Rotate cursor */
	CURSOR_ROTATE: '$$cursor_rotate',
	CURSOR_ROTATE_NE: '$$cursor_rotate_ne',
	CURSOR_ROTATE_NW: '$$cursor_rotate_nw',
	CURSOR_ROTATE_SE: '$$cursor_rotate_se',
	CURSOR_ROTATE_SW: '$$cursor_rotate_sw',
	/* Color picker icon */
	ICON_COLOR_PICK: '$$icon_color_pick',
	ICON_COLOR_NOTSET: '$$icon_color_default',
	ICON_COLOR_MIXED: '$$icon_color_mixed',
	/* Dialog buttons */
	BUTTON_YES_OK: '$$btn_yes_ok',
	BUTTON_NO_CANCEL: '$$btn_no_cancel',
	BUTTON_LOAD_FILE: '$$btn_load_file'
};

var RM = Kekule.Widget.StyleResourceManager;
var SR = Kekule.Widget.StyleResource;
var SRN = Kekule.Widget.StyleResourceNames;

// register some predefined resources
RM.register(new SR(SRN.CURSOR_ROTATE, 'K-Res-Cursor-Rotate'));
RM.register(new SR(SRN.CURSOR_ROTATE_NE, 'K-Res-Cursor-Rotate-NE'));
RM.register(new SR(SRN.CURSOR_ROTATE_NW, 'K-Res-Cursor-Rotate-NW'));
RM.register(new SR(SRN.CURSOR_ROTATE_SE, 'K-Res-Cursor-Rotate-SE'));
RM.register(new SR(SRN.CURSOR_ROTATE_SW, 'K-Res-Cursor-Rotate-SW'));
RM.register(new SR(SRN.ICON_COLOR_PICK, 'K-Res-Icon-Color-Pick'));
RM.register(new SR(SRN.ICON_COLOR_NOTSET, 'K-Res-Icon-Color-NotSet'));
RM.register(new SR(SRN.ICON_COLOR_MIXED, 'K-Res-Icon-Color-Mixed'));
RM.register(new SR(SRN.BUTTON_YES_OK, 'K-Res-Button-YesOk'));
RM.register(new SR(SRN.BUTTON_NO_CANCEL, 'K-Res-Button-NoCancel'));
RM.register(new SR(SRN.BUTTON_LOAD_FILE, 'K-Res-Button-LoadFile'));

})();