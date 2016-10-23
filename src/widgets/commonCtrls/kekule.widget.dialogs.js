/**
 * @fileoverview
 * Implementation of popup dialogs.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /utils/kekule.domUtils.js
 * requires /xbrowsers/kekule.x.js
 * requires /widgets/kekule.widget.base.js
 * requires /localization
 */

(function(){

"use strict";

var DU = Kekule.DomUtils;
var EU = Kekule.HtmlElementUtils;
var SU = Kekule.StyleUtils;
var CNS = Kekule.Widget.HtmlClassNames;

/** @ignore */
Kekule.Widget.HtmlClassNames = Object.extend(Kekule.Widget.HtmlClassNames, {
	DIALOG: 'K-Dialog',
	DIALOG_INSIDE: 'K-Dialog-Inside', // dialog smaller than current view port size
	DIALOG_OVERFLOW: 'K-Dialog-Overflow',  // dialog larger than current view port size
	DIALOG_CLIENT: 'K-Dialog-Client',
	DIALOG_CAPTION: 'K-Dialog-Caption',
	DIALOG_BTN_PANEL: 'K-Dialog-Button-Panel'
});

/**
 * Enumeration of predefined dialog buttons.
 * @class
 */
Kekule.Widget.DialogButtons = {
	OK: 'ok',
	CANCEL: 'cancel',
	YES: 'yes',
	NO: 'no',

	/**
	 * Whether button is a positive one (e.g. Ok, Yes).
	 * @param {String} btn
	 * @returns {Bool}
	 */
	isPositive: function(btn)
	{
		var DB = Kekule.Widget.DialogButtons;
		return ([DB.OK, DB.YES].indexOf(btn) >= 0);
	},
	/**
	 * Whether button is a negative one (e.g. Cancel, No).
	 * @param {String} btn
	 * @returns {Bool}
	 */
	isNegative: function(btn)
	{
		var DB = Kekule.Widget.DialogButtons;
		return ([DB.CANCEL, DB.NO].indexOf(btn) >= 0);
	}
};

/**
 * Enumeration of location of widget.
 * @class
 */
Kekule.Widget.Location = {
	/** Show widget as is, no special position handling will be done. */
	DEFAULT: 1,
	/** Show widget at center of browser window visible area. */
	CENTER: 2,
	/** Widget will fill all area of browser window visible area. */
	FULLFILL: 3,
	/**
	 * Widget will be shown at center of window if its initial size smaller than window,
	 * or fullfill the whole visible area if its intial size larger than window.
	 */
	CENTER_OR_FULLFILL: 4
};

/**
 * A popup dialog widget.
 * @class
 * @augments Kekule.Widget.BaseWidget
 *
 * @property {String} caption Caption of dialog. If no caption is set, the caption bar will be automatically hidden.
 * @property {Array} buttons Array of predefined button names that should be shown in dialog.
 * @property {String} result The name of button that close this dialog.
 * @property {Int} location Value from {@link Kekule.Widget.Location}, determine the position when dialog is popped up.
 */
Kekule.Widget.Dialog = Class.create(Kekule.Widget.BaseWidget,
/** @lends Kekule.Widget.Dialog# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.Dialog',
	/** @private */
	BINDABLE_TAG_NAMES: ['div', 'span'],
	/** @private */
	BTN_NAME_FIELD: '__$btnName__',
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument, caption, buttons)
	{
		this._dialogCallback = null;
		this._modalInfo = null;
		this._childButtons = [];
		this.setPropStoreFieldValue('location', Kekule.Widget.Location.CENTER);
		$super(parentOrElementOrDocument);
		this._dialogOpened = false;  // used internally
		this.setUseCornerDecoration(true);
		if (caption)
			this.setCaption(caption);
		if (buttons)
			this.setButtons(buttons);

		this.setDisplayed(false);
	},
	/** @private */
	doFinalize: function($super)
	{
		this.unprepareModal();  // if finalize during dialog show, modal preparation should always be unprepared
		$super();
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('caption', {'dataType': DataType.STRING,
			'getter': function() { return DU.getElementText(this.getCaptionElem()); },
			'setter': function(value)
			{
				DU.setElementText(this.getCaptionElem(), value);
				SU.setDisplay(this.getCaptionElem(), !!value);
			}
		});
		this.defineProp('buttons', {'dataType': DataType.ARRAY,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('buttons', value);
				if (this.getBtnPanelElem())
					SU.setDisplay(this.getBtnPanelElem(), value && value.length);
				this.buttonsChanged();
			}
		});
		this.defineProp('result', {'dataType': DataType.STRING, 'serializable': false, 'scope': Class.PropertyScope.PUBLIC});
		this.defineProp('location', {'dataType': DataType.INT});
		// private properties
		this.defineProp('clientElem', {'dataType': DataType.OBJECT, 'serializable': false, 'setter': null, 'scope': Class.PropertyScope.PUBLIC});
		this.defineProp('captionElem', {'dataType': DataType.OBJECT, 'serializable': false, 'setter': null, 'scope': Class.PropertyScope.PUBLIC});
		this.defineProp('btnPanelElem', {'dataType': DataType.OBJECT, 'serializable': false, 'setter': null, 'scope': Class.PropertyScope.PUBLIC});
	},
	/** @ignore */
	initPropValues: function($super)
	{
		$super();
		if (this.setMovable)
		{
			this.setMovable(true);
		}
	},
	/** @ignore */
	getDefaultMovingGripper: function()
	{
		return this.getCaptionElem();
	},

	/** @ignore */
	getCoreElement: function()
	{
		return this.getClientElem();
	},

	/** @ignore */
	doGetWidgetClassName: function()
	{
		return CNS.DIALOG;
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
		// caption element
		var elem = doc.createElement('div');
		elem.className = CNS.DIALOG_CAPTION;
		rootElem.appendChild(elem);
		this.setPropStoreFieldValue('captionElem', elem);
		result.push(elem);
		// click on caption to move
		if (this.setMovingGripper)
			this.setMovingGripper(elem);

		// client element
		var elem = doc.createElement('div');
		elem.className = CNS.DIALOG_CLIENT;
		rootElem.appendChild(elem);
		this.setPropStoreFieldValue('clientElem', elem);
		this.doCreateClientContents(elem);
		result.push(elem);

		// button panel element
		var elem = doc.createElement('div');
		elem.className = CNS.DIALOG_BTN_PANEL;
		rootElem.appendChild(elem);
		this.setPropStoreFieldValue('btnPanelElem', elem);
		result.push(elem);

		this.buttonsChanged();  // create buttons if essential

		return result;
	},

	/**
	 * Create essential child widgets (and other elements) in client area.
	 * Descendants may override this method.
	 * @param {HTMLElement} clientElem
	 * @private
	 */
	doCreateClientContents: function(clientElem)
	{
		// do nothing here
	},

	/**
	 * Called when buttons property is changed.
	 * @private
	 */
	buttonsChanged: function()
	{
		// clear old buttons
		for (var i = this._childButtons.length - 1; i >= 0; --i)
		{
			var btn = this._childButtons[i];
			btn.finalize();
		}
		var btns = this.getButtons() || [];
		for (var i = 0, l = btns.length; i < l; ++i)
		{
			this.createDialogButton(btns[i]);
		}
	},
	/** @private */
	createDialogButton: function(btnName, btnResName, doc, btnPanel)
	{
		var btnInfo = this._getPredefinedButtonInfo(btnName);
		if (!btnInfo)  // info can not get, a custom button
		{
			btnInfo = {'text': btnName};
		}
		if (btnInfo)
		{
			var btn = new Kekule.Widget.Button(this, btnInfo.text);
			btn[this.BTN_NAME_FIELD] = btnName;
			btn.addEventListener('execute', this._reactDialogBtnExec, this);
			btn.appendToElem(this.getBtnPanelElem());
			btn.__$name__ = btnName;
			var resName = btnResName || this._getDialogButtonResName(btnName);
			if (resName)
			{
				btn.linkStyleResource(resName);
			}
			this._childButtons.push(btn);
			return btn;
		}
		else
			return null;
	},
	/** @private */
	_getDialogButtonResName: function(btnName)
	{
		var DB = Kekule.Widget.DialogButtons;
		if ([DB.OK, DB.YES].indexOf(btnName) >= 0)
		{
			return Kekule.Widget.StyleResourceNames.BUTTON_YES_OK;
		}
		else if ([DB.CANCEL, DB.NO].indexOf(btnName) >= 0)
		{
			return Kekule.Widget.StyleResourceNames.BUTTON_NO_CANCEL;
		}
		else
			return null;
	},

	/** @private */
	_reactDialogBtnExec: function(e)
	{
		var DB = Kekule.Widget.DialogButtons;
		var closeButtons = [DB.OK, DB.YES, DB.CANCEL, DB.NO];
		var btn = e.target;
		if (btn)
		{
			var btnName = btn.__$name__;
			if (closeButtons.indexOf(btnName) >= 0)
			{
				this.setResult(btnName);
				this.close(btnName);
			}
		}
	},

	/** @private */
	_getPredefinedButtonInfo: function(btnName)
	{
		var DB = Kekule.Widget.DialogButtons;
		//var WT = Kekule.WidgetTexts;
		var btnNames = [DB.OK, DB.CANCEL, DB.YES, DB.NO];
		var btnTexts = [
			//WT.CAPTION_OK, WT.CAPTION_CANCEL, WT.CAPTION_YES, WT.CAPTION_NO
			Kekule.$L('WidgetTexts.CAPTION_OK'),
			Kekule.$L('WidgetTexts.CAPTION_CANCEL'),
			Kekule.$L('WidgetTexts.CAPTION_YES'),
			Kekule.$L('WidgetTexts.CAPTION_NO')
		];
		var index = btnNames.indexOf(btnName);
		return (index >= 0)? {'text': btnTexts[index]}: null;
	},

	/**
	 * Return a button object corresponding to btnName in dialog.
	 * @param {String} btnName
	 * @returns {Kekule.Widget.Button}
	 */
	getDialogButton: function(btnName)
	{
		for (var i = this._childButtons.length - 1; i >= 0; --i)
		{
			var btn = this._childButtons[i];
			if (btn[this.BTN_NAME_FIELD] === btnName)
				return btn;
		}
		return null;
	},

	/** @private */
	needAdjustPosition: function()
	{
		var showHideType = this.getShowHideType();
		var ST = Kekule.Widget.ShowHideType;
		var result = (showHideType !== ST.DROPDOWN);
		//console.log('need adjust pos', result, this.getShowHideType());
		return result;
	},

	/** @private */
	_storePositionInfo: function()
	{
		if (!this.needAdjustPosition())
			return;
		var elem = this.getElement();
		var style = elem.style;
		this._posInfo = {
			'left': style.left,
			'top': style.top,
			'right': style.right,
			'bottom': style.bottom,
			'width': style.width,
			'height': style.height,
			'position': style.position
		}
	},
	/** @private */
	_restorePositionInfo: function()
	{
		if (!this.needAdjustPosition())
			return;
		var elem = this.getElement();
		var style = elem.style;
		var info = this._posInfo;
		if (info)
		{
			style.left = info.left;
			style.top = info.top;
			style.right = info.right;
			style.bottom = info.bottom;
			style.width = info.width;
			style.height = info.height;
			style.position = info.position;
		}
	},

	/**
	 * Adjust the size and position of dialog before pop up.
	 * @private
	 */
	adjustLocation: function()
	{
		if (!this.needAdjustPosition())
			return;
		this._storePositionInfo();

		var L = Kekule.Widget.Location;
		var location = this.getLocation() || L.DEFAULT;
		var overflow = false;

		if (location !== L.DEFAULT)
		{
			var l, t, w, h, r, b;

			// set display first, otherwise the size may not be set properly
			var oldDisplayed = this.getDisplayed();
			var oldVisible = this.getVisible();
			try
			{
				this.setDisplayed(true, true);  // bypass widgetShowStateChange handle, or recursion
				this.setVisible(true, true);
				/*
				 var selfWidth = this.getOffsetWidth();
				 var selfHeight = this.getOffsetHeight();
				 */
				var viewPortDim = Kekule.DocumentUtils.getClientDimension(this.getDocument());
				var selfBoundingRect = Kekule.HtmlElementUtils.getElemBoundingClientRect(this.getElement());
				var selfWidth = selfBoundingRect.right - selfBoundingRect.left;
				var selfHeight = selfBoundingRect.bottom - selfBoundingRect.top;
				var parent = this.getOffsetParent();
				var parentBoundingRect = parent? Kekule.HtmlElementUtils.getElemBoundingClientRect(parent):
					{'left': 0, 'top': 0, 'width': 0, 'height': 0};
				overflow = (selfWidth >= viewPortDim.width) || (selfHeight >= viewPortDim.height);
			}
			finally
			{
				this.setVisible(oldVisible, true);
				this.setDisplayed(oldDisplayed, true);
			}

			if (location === L.CENTER_OR_FULLFILL)
			{
				if (overflow)
				{
					//location = L.FULLFILL;
					if (selfWidth >= viewPortDim.width)
					{
						l = 0;
						r = 0;
					}
					else  // width not exceed, center the dialog in horizontal direction
					{
						l = (viewPortDim.width - selfWidth) / 2;
					}
					if (selfHeight >= viewPortDim.height)
					{
						t = 0;
						b = 0;
					}
					else  // height not exceed, center in vertical direction
					{
						t = (viewPortDim.height - selfHeight) / 2;
					}
				}
				else
					location = L.CENTER;
			}

			if (location === L.FULLFILL)
			{
				/*
				w = viewPortDim.width;
				h = viewPortDim.height;
				*/
				l = 0; //-parentBoundingRect.left;
				t = 0; //-parentBoundingRect.top;
				r = 0;
				b = 0;
			}
			else if (location === L.CENTER)
			{
				/*
				l = (viewPortDim.width - selfWidth) / 2 - parentBoundingRect.left;
				t = (viewPortDim.height - selfHeight) / 2 - parentBoundingRect.top;
				*/
				l = (viewPortDim.width - selfWidth) / 2;
				t = (viewPortDim.height - selfHeight) / 2;
				//console.log('center', l, t);
			}

			if (overflow)  // use absolute position
			{
				this.removeClassName(CNS.DIALOG_INSIDE);
				this.addClassName(CNS.DIALOG_OVERFLOW);
				var viewPortScrollPos = Kekule.DocumentUtils.getScrollPosition(this.getDocument());
				l += viewPortScrollPos.left;
				t += viewPortScrollPos.top;
				// ensure left/top are not out of page region
				if (l < 0)
					l = 0;
				if (t < 0)
					t = 0;
			}
			else  // use fixed position
			{
				this.removeClassName(CNS.DIALOG_OVERFLOW);
				this.addClassName(CNS.DIALOG_INSIDE);
			}

			var style = this.getElement().style;
			var notUnset = Kekule.ObjUtils.notUnset;
			if (notUnset(l))
				style.left = l + 'px';
			if (notUnset(t))
				style.top = t + 'px';
			if (notUnset(r))
				style.right = r + 'px';
			if (notUnset(b))
				style.bottom = r + 'px';
			if (notUnset(w))
				style.width = w + 'px';
			if (notUnset(h))
				style.height = h + 'px';
			//style.position = 'fixed';

			this.adjustClientSize(w, h, overflow);

		}
		this._posAdjusted = true;
	},
	/** @private */
	adjustClientSize: function(dialogWidth, dialogHeight, overflow)
	{
		// TODO: do nothing here
	},

	/** @private */
	prepareShow: function(callback)
	{
		// if this dialog has no element parent, just append it to body
		var elem = this.getElement();
		if (!elem.parentNode)
			this.getDocument().body.appendChild(elem);

		var self = this;
		// defer the function, make sure it be called when elem really in DOM tree
		setTimeout(function()
			{
				self._dialogCallback = callback;
			},
		0);
		/*
		if (!this.isShown())
			this.adjustLocation();
		*/
	},

	/**
	 * Show a modal simulation dialog. When the dialog is closed,
	 * callback(modalResult) will be called.
	 * @param {Func} callback
	 * @param {Kekule.Widget.BaseWidget} caller Who calls the show method and make this dialog visible. Can be null.
	 */
	openModal: function(callback, caller)
	{
		//this.prepareModal();
		this.getGlobalManager().prepareModalWidget(this);
		  // important, must called before prepareShow, or DOM tree change will cause doWidgetShowStateChanged
		  // and make callback called even before dialog showing
		/*
		this.prepareShow(callback);
		this.show(caller, null, Kekule.Widget.ShowHideType.DIALOG);
		*/
		return this.open(callback, caller);
	},
	/**
	 * Show a popup dialog. When the dialog is closed,
	 * callback(modalResult) will be called.
	 * @param {Func} callback
	 * @param {Kekule.Widget.BaseWidget} caller Who calls the show method and make this dialog visible. Can be null.
	 */
	openPopup: function(callback, caller)
	{
		/*
		this.prepareShow(callback);
		this.show(caller, null, Kekule.Widget.ShowHideType.POPUP);
		*/
		return this.open(callback, caller, Kekule.Widget.ShowHideType.POPUP);
	},
	/**
	 * Show a modeless dialog. When the dialog is closed,
	 * callback(dialogResult) will be called.
	 * @param {Func} callback
	 * @param {Kekule.Widget.BaseWidget} caller Who calls the show method and make this dialog visible. Can be null.
	 * @param {Int} showType
	 */
	open: function(callback, caller, showType)
	{
		this.prepareShow(callback);
		this.show(caller, null, showType || Kekule.Widget.ShowHideType.DIALOG);
		this._dialogOpened = true;
		return this;
	},
	/**
	 * Close the dialog.
	 * @param {String} result What result should this dialog return when closed.
	 */
	close: function(result)
	{
		//var self = this;
		this.setResult(result);
		this.hide();
	},

	/**
	 * Returns whether the dialog result is a positive one (like Ok, Yes).
	 * @param {String} result Dialog result, if not set, current dialog result will be used.
	 * @returns {Bool}
	 */
	isPositiveResult: function(result)
	{
		return Kekule.Widget.DialogButtons.isPositive(result || this.getResult());
	},
	/**
	 * Returns whether the dialog result is a negative one (like Cancel, No).
	 * @param {String} result Dialog result, if not set, current dialog result will be used.
	 * @returns {Bool}
	 */
	isNegativeResult: function(result)
	{
		return Kekule.Widget.DialogButtons.isNegative(result || this.getResult());
	},

	/** @ignore */
	widgetShowStateBeforeChanging: function($super, isShown)
	{
		$super(isShown);

		if (isShown /*&& (!this.isShown())*/)  // show
		{
			this.adjustLocation();
			this.setResult(null);
		}
		else
		{
			// IMPORTANT, can not unprepare modal here, otherwise the modification of DOM tree
			// affects the disappear transition
			/*
			if (this._modalInfo)
				this.unprepareModal();
			*/
		}
	},
	/** @ignore */
	doWidgetShowStateChanged: function($super, isShown)
	{
		$super(isShown);
		if (!isShown)  // hide
		{
			if (this._dialogCallback)
			{
				//console.log('hide and call callback');
				this._dialogCallback(this.getResult());
				this._dialogCallback = null;  // avoid call twice
			}
		}
	},
	/** @ignore */
	widgetShowStateDone: function($super, isShown)
	{
		$super(isShown);
		if (!isShown && this._dialogOpened)  // hide after dialog open
		{
			if (this.getModalInfo())
			{
				this.getGlobalManager().unprepareModalWidget(this);
			}
			if (!this.isShown())
				this._restorePositionInfo();
			this._dialogOpened = false;
		}
	}
});

})();