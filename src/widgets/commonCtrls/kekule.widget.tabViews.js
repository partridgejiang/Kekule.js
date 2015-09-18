/**
 * @fileoverview
 * A tab widget.
 * @author Partridge Jiang
 */

(function(){
"use strict";

var EU = Kekule.HtmlElementUtils;
var CNS = Kekule.Widget.HtmlClassNames;
var AU = Kekule.ArrayUtils;

/** @ignore */
Kekule.Widget.HtmlClassNames = Object.extend(Kekule.Widget.HtmlClassNames, {
	TABVIEW: 'K-TabView',
	TABVIEW_TABBUTTON: 'K-TabView-TabButton',
	TABVIEW_CLIENT: 'K-TabView-Client',
	TABVIEW_PAGE: 'K-TabView-Page',
	TABVIEW_ACTIVE_PAGE: 'K-TabView-Active-Page',
	TABVIEW_TABBUTTON_CONTAINER: 'K-TabView-TabButton-Container',
	TABVIEW_PAGE_CONTAINER: 'K-TabView-Page-Container',

	TABBUTTONGROUP: 'K-TabButtonGroup',

	TAB_AT_LEFT: 'K-TabAtLeft',
	TAB_AT_RIGHT: 'K-TabAtRight',
	TAB_AT_TOP: 'K-TabAtTop',
	TAB_AT_BOTTOM: 'K-TabAtBottom'
});

/**
 * Tab page inside tab view widget. Do not use this class alone.
 * @class
 * @augments Kekule.Widget.BaseWidget
 *
 * @property {String} text Caption text of tab page. It will be shown in tab button of tab view.
 */
Kekule.Widget.TabPage = Class.create(Kekule.Widget.BaseWidget,
/** @lends Kekule.Widget.TabPage# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.TabPage',
	/** @private */
	initProperties: function()
	{
		this.defineProp('text', {'dataType': DataType.STRING});
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.TABVIEW_PAGE;
	},
	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('div');
		return result;
	}
});

/**
 * Tab button set inside tab view widget.
 * @class
 * @augments Kekule.Widget.ButtonGroup
 */
/**
 * Invoked when a new tab button is switched to.
 *   event param of it has fields: {button, index}
 * @name Kekule.Widget.TabButtonGroup#switch
 * @event
 */
Kekule.Widget.TabButtonGroup = Class.create(Kekule.Widget.ButtonGroup,
/** @lends Kekule.Widget.TabButtonGroup# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.TabButtonGroup',
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument)
	{
		$super(parentOrElementOrDocument);
		this.addEventListener('execute'/*'check'*/, function(e)
		{
			var target = e.target;
			if ((target instanceof Kekule.Widget.RadioButton)/* && (target.getChecked())*/)  // switch may fail and the tab button be not be checked
			{
				this.invokeEvent('switch', {'button': target});
			}
		}, this);
		this.tabButtonPosChanged();
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('tabButtonPosition', {'dataType': DataType.INT,
			'enumSource': Kekule.Widget.Position,
			'setter': function(value)
			{
				if (this.getTabButtonPosition() !== value)
				{
					this.setPropStoreFieldValue('tabButtonPosition', value);
					this.tabButtonPosChanged();
				}
			}
		});
	},
	/** @private */
	initPropValues: function($super)
	{
		$super();
		this.setUseCornerDecoration(false);
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.TABBUTTONGROUP;
	},

	/** @private */
	tabButtonPosChanged: function()
	{
		var WP = Kekule.Widget.Position;
		var pos = this.getTabButtonPosition();

		var isVertical = (pos & WP.LEFT) || (pos & WP.RIGHT)

		var tabPosClassName = (pos & WP.RIGHT)? CNS.TAB_AT_RIGHT:
			(pos & WP.BOTTOM)? CNS.TAB_AT_BOTTOM:
				(pos & WP.LEFT)? CNS.TAB_AT_LEFT:
					CNS.TAB_AT_TOP;  // default

		if (this._lastTabBtnPosClassName)
		{
			this.removeClassName(this._lastTabBtnPosClassName);
		}
		this._lastTabBtnPosClassName = tabPosClassName;
		this.addClassName(this._lastTabBtnPosClassName);
		this.setLayout(isVertical? Kekule.Widget.Layout.VERTICAL: Kekule.Widget.Layout.HORIZONTAL);
	}
});

/**
 * Tab view widget.
 * @class
 * @augments Kekule.Widget.Container
 *
 * @property {Array} tagPages All pages inside view.
 * @property {Kekule.Widget.TabPage} activeTabPage Currently selected tab page.
 * @property {Int} activeTabIndex Index of current active page.
 * @property {Int} tabButtonPosition Position of tab button, value from {@link Kekule.Widget.Position}.
 */
/**
 * Invoked when a new tab is switched to.
 *   event param of it has fields: {tabPage}
 * @name Kekule.Widget.TabView#switchTab
 * @event
 */
Kekule.Widget.TabView = Class.create(Kekule.Widget.Container,
/** @lends Kekule.Widget.TabView# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.TabView',
	/** @private */
	TAB_BTN_FIELD: '__$tabButton__',
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument)
	{
		this._tabBtnContainer = null;
		this._pageContainer = null;
		$super(parentOrElementOrDocument);
		if (Kekule.ObjUtils.isUnset(this.getUseCornerDecoration()))
			this.setUseCornerDecoration(true);
		this.tabButtonPosChanged();  // update tab button pos

		this.addEventListener('change', this.reactTabPagePropChange, this);  // actually listen children's change event
	},
	/** @ignore */
	doFinalize: function($super)
	{
		if (this.getTabGroup())
			this.getTabGroup().finalize();
		$super();
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('tabPages', {
			'dataType': DataType.ARRAY, 'serializable': false,
			'getter': function () {
				var result = this.getPropStoreFieldValue('tabPages');
				if (!result) {
					result = [];
					this.setPropStoreFieldValue('tabPages', result);
				}
				return result;
			},
			setter: null
		});
		this.defineProp('activeTabPage', {'dataType': 'Kekule.Widget.TabPage', 'serializable': false,
			'setter': function(value)
			{
				var old = this.getActiveTabPage();
				if (old !== value)
				{
					if (this.hasChild(value))
					{
						this.setPropStoreFieldValue('activeTabPage', value);
						if (old)
						{
							old.removeClassName(CNS.TABVIEW_ACTIVE_PAGE);
							this._getPageTabButton(old).setChecked(false);
						}
						if (value)
						{
							value.addClassName(CNS.TABVIEW_ACTIVE_PAGE);
							this._getPageTabButton(value).setChecked(true);
							this.invokeEvent('switchTab', {'tabPage': value});
						}
					}
				}
			}
		});
		this.defineProp('activeTabIndex', {'dataType': DataType.INT, 'serializable': false,
			'getter': function()
			{
				return this.getTabPages().indexOf(this.getActiveTabPage());
			},
			'setter': function(value)
			{
				var page = this.getTabPages()[value];
				if (page)
					this.setActiveTabPage(page);
			}
		});
		this.defineProp('tabButtonPosition', {'dataType': DataType.INT,
			'enumSource': Kekule.Widget.Position,
			'setter': function(value)
			{
				if (this.getTabButtonPosition() !== value)
				{
					this.setPropStoreFieldValue('tabButtonPosition', value);
					this.tabButtonPosChanged();
				}
			}
		});
		this.defineProp('showTabButtons', {'dataType': DataType.BOOL,
			'getter': function()
			{
				var t = this.getTabGroup();
				return t && t.getDisplayed();
			},
			'setter': function(value)
			{
				var t = this.getTabGroup();
				if (t)
					t.setDisplayed(value);
			}
		});
		// private
		this.defineProp('tabGroup', {'dataType': 'Kekule.Widget.ButtonGroup', 'serializable': false, 'setter': null, 'scope': Class.PropertyScope.PRIVATE});
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.TABVIEW;
	},

	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('div');
		return result;
	},
	/** @ignore */
	doCreateSubElements: function(doc, rootElem)
	{
		var result = [];
		var tabBtnContainer = doc.createElement('div');
		tabBtnContainer.className = CNS.TABVIEW_TABBUTTON_CONTAINER;
		var pageContainer = doc.createElement('div');
		pageContainer.className = CNS.TABVIEW_PAGE_CONTAINER;
		this._tabBtnContainer = tabBtnContainer;
		this._pageContainer = pageContainer;
		rootElem.appendChild(tabBtnContainer);
		rootElem.appendChild(pageContainer);
		this.setPropStoreFieldValue('tabGroup', this.doCreateTabbar(doc, tabBtnContainer));
		return result;
	},
	/** @private */
	doCreateTabbar: function(doc, parentElem)
	{
		var result = new Kekule.Widget.TabButtonGroup(doc);
		result.appendToElem(parentElem);
		result.addEventListener('switch', function(e){
			var btn = e.button;
			//if (btn.getChecked())  // when switching begins, the btn may not be checked yet
			{
				var page = this._getPageOfTabButton(btn);
				if (page)
				{
					this.setActiveTabPage(page);
				}
			}
		}, this);
		return result;
	},
	/** @ignore */
	getChildrenHolderElement: function()
	{
		return this._pageContainer;
	},
	getContainerElement: function()
	{
		return this._pageContainer;
	},

	/** @private */
	_getPageTabButton: function(tabPage)
	{
		return tabPage[this.TAB_BTN_FIELD];
	},
	/** @private */
	_setPageTabButton: function(tabPage, button)
	{
		tabPage[this.TAB_BTN_FIELD] = button;
	},
	/** @private */
	_getPageOfTabButton: function(button)
	{
		var pages = this.getTabPages();
		for (var i = 0, l = pages.length; i < l; ++i)
		{
			var p = pages[i];
			if (this._getPageTabButton(p) === button)
				return p;
		}
		return null;
	},

	/** @ignore */
	childWidgetAdded: function($super, widget)
	{
		$super(widget);
		if (widget instanceof Kekule.Widget.TabPage)  // a new page is added, update tab buttons
		{
			var isFirstPage = !this.getTabPages().length;
			// ensure add to page container
			widget.appendToElem(this._pageContainer);
			this.getTabPages().push(widget);
			this._insertTabButtonBefore(widget);
			if (isFirstPage)
				this.setActiveTabPage(widget);
		}
	},
	/** @private */
	childWidgetRemoved: function($super, widget)
	{
		$super(widget);
		if (widget instanceof Kekule.Widget.TabPage)  // a old page is removed, update tab buttons
		{
			AU.remove(this.getTabPages(), widget);
			this._removeTabButton(widget);
		}
	},
	/** @private */
	childWidgetMoved: function($super, widget, newIndex)
	{
		$super(widget, newIndex);
		if (widget instanceof Kekule.Widget.TabPage)  // page index changed, update tab buttons
		{
			this._changeTabIndex(widget, newIndex);
		}
	},

	/** @private */
	_insertTabButtonBefore: function(tabPage, refButton)
	{
		var btnGroup = this.getTabGroup();
		var newButton = new Kekule.Widget.RadioButton(this.getDocument());
		this._updateTabButton(tabPage, newButton);
		this._setPageTabButton(tabPage, newButton);
		if (refButton)
			newButton.insertToWidget(btnGroup, refButton);
		else
			newButton.appendToWidget(btnGroup);
	},
	/** @private */
	_updateTabButton: function(tabPage, button)
	{
		if (!button)
			button = this._getPageTabButton(tabPage);
		button.setText(tabPage.getText() || '');
		if (tabPage.getHint())
			button.setHint(tabPage.getHint());
	},
	/** @private */
	_removeTabButton: function(tabPage)
	{
		var btn = this._getPageTabButton(tabPage);
		if (btn)
			btn.finalize();
	},
	/** @private */
	_changeTabIndex: function(tabPage, newIndex)
	{
		var btn = this._getPageTabButton(tabPage);
		this.getTabGroup()._moveChild(btn, newIndex);
		var pages = this.getTabPages();
		var oldIndex = pages.indexOf(tabPage);
		if (oldIndex >= 0 && oldIndex !== newIndex)
		{
			AU.changeItemIndex(pages, tabPage, newIndex);
		}
	},

	/** @private */
	reactTabPagePropChange: function(e)
	{
		var target = e.target;
		if (target instanceof Kekule.Widget.TabPage)
		{
			var btn = this._getPageTabButton(target);
			if (btn)
				this._updateTabButton(target, btn);
		}
	},

	/** @private */
	tabButtonPosChanged: function()
	{
		var WP = Kekule.Widget.Position;
		var pos = this.getTabButtonPosition();

		var isAtTailing = (pos & WP.BOTTOM) || (pos & WP.RIGHT);
		var isVertical = (pos & WP.LEFT) || (pos & WP.RIGHT)

		var tabPosClassName = (pos & WP.RIGHT)? CNS.TAB_AT_RIGHT:
			(pos & WP.BOTTOM)? CNS.TAB_AT_BOTTOM:
			(pos & WP.LEFT)? CNS.TAB_AT_LEFT:
			CNS.TAB_AT_TOP;  // default

		if (this._lastTabBtnPosClassName)
		{
			this.removeClassName(this._lastTabBtnPosClassName);
			//this.getTabGroup().removeClassName(this._lastTabBtnPosClassName);
		}
		this._lastTabBtnPosClassName = tabPosClassName;
		this.addClassName(this._lastTabBtnPosClassName);
		//this.getTabGroup().addClassName(this._lastTabBtnPosClassName);

		//this.getTabGroup().setLayout(isVertical? Kekule.Widget.Layout.VERTICAL: Kekule.Widget.Layout.HORIZONTAL);
		this.getTabGroup().setTabButtonPosition(pos);

		if (isAtTailing)
			this.getElement().appendChild(this._tabBtnContainer);
		else
			this.getElement().insertBefore(this._tabBtnContainer, this._pageContainer);
	},

	/**
	 * Create a new tab page in tab view.
	 * @param {String} title Tab title
	 * @param {String} hint
	 * @param {Kekule.Widget.TabPage} refPage If this value is set, new page will be inserted before it.
	 * @return {Kekule.Widget.TabPage}
	 */
	createNewTabPage: function(title, hint, refPage)
	{
		var doc = this.getDocument();
		var result = new Kekule.Widget.TabPage(doc);
		result.setText(title);
		result.setHint(hint);
		result.appendToWidget(this);
		// adjust index
		if (refPage)
		{
			var refIndex = this.getChildWidgets().indexOf(refPage);
			this._moveChild(result, refIndex);
		}
		return result;
	}
});


})();