/**
 * @fileoverview
 * Implementation of a panel to display special informations.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /utils/kekule.domUtils.js
 * requires /xbrowsers/kekule.x.js
 * requires /widgets/kekule.widget.base.js
 * requires /widgets/kekule.widget.containers.js
 */

(function(){
"use strict";

var EU = Kekule.HtmlElementUtils;
var CNS = Kekule.Widget.HtmlClassNames;

/** @ignore */
Kekule.Widget.HtmlClassNames = Object.extend(Kekule.Widget.HtmlClassNames, {
	MSGPANEL: 'K-MsgPanel',
	MSGPANEL_CONTENT: 'K-MsgPanel-Content',
	MSGGROUP: 'K-MsgGroup',
	MSGGROUP_FOR_WIDGET: 'K-Widget-MsgGroup',

	MSG_NORMAL: 'K-Msg-Normal',
	MSG_INFO: 'K-Msg-Info',
	MSG_WARNING: 'K-Msg-Warning',
	MSG_ERROR: 'K-Msg-Error'
});

/**
 * Enumeration of message type shown in message panel.
 * @class
 */
Kekule.Widget.MsgType = {
	NORMAL: '',
	INFO: 'info',
	WARNING: 'warning',
	ERROR: 'error'
}

/**
 * An panel to display special text message (and other informations).
 * @class
 * @augments Kekule.Widget.BaseWidget
 *
 * @param {String} text
 * @param {String} msgType
 *
 * @property {String} text Text on panel.
 * @property {Bool} showLeadingGlyph
 * @property {Bool} showTailingGlyph
 * @property {String} msgType Type of message, value from {@link Kekule.Widget.MsgType}.
 */
Kekule.Widget.MsgPanel = Class.create(Kekule.Widget.BaseWidget,
/** @lends Kekule.Widget.MsgPanel# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.MsgPanel',
	/** @private */
	BINDABLE_TAG_NAMES: ['span', 'div'],
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument, text, msgType)
	{
		this._contentElem = null;
		this._elemTextPart = null;  // used internally
		this._elemLeadingGlyphPart = null;
		this._elemTailingGlyphPart = null;
		this.setPropStoreFieldValue('showText', true);
		/*
		this.setPropStoreFieldValue('showLeadingGlyph', true);
		this.setPropStoreFieldValue('showTailingGlyph', true);
		*/
		$super(parentOrElementOrDocument);
		if (text)
			this.setText(text);
		if (msgType)
			this.setMsgType(msgType);
		this.setUseCornerDecoration(true);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('text', {'dataType': DataType.STRING, 'serializable': false,
			'getter': function() { return Kekule.HtmlElementUtils.getInnerText(this.getElement()); },
			'setter': function(value) { this.changeContentText(value); }
		});
		this.defineProp('showLeadingGlyph', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('showLeadingGlyph', value);
				this._elemLeadingGlyphPart.style.display = value? '': 'none';
			}
		});
		this.defineProp('showTailingGlyph', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('showTailingGlyph', value);
				this._elemTailingGlyphPart.style.display = value? '': 'none';
			}
		});
		this.defineProp('msgType', {'dataType': DataType.STRING,
			'setter': function(value)
			{
				var old = this.getMsgType();
				if (old !== value)
				{
					var oldClass = this.getClassNameForMsgType(old);
					var newClass = this.getClassNameForMsgType(value);
					if (oldClass !== newClass)
					{
						this.removeClassName(oldClass);
						this.addClassName(newClass);
					}
					this.setPropStoreFieldValue('msgType', value);
				}
			}
		});
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.MSGPANEL;
	},
	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('span');
		return result;
	},
	/** @ignore */
	doCreateSubElements: function($super, doc, rootElem)
	{
		var text = EU.getInnerText(rootElem);
		rootElem.innerHTML = '';  // clear old content first
		var element = doc.createElement('span');
		element.className = CNS.MSGPANEL_CONTENT;
		rootElem.appendChild(element);
		this._contentElem = element;
		this._elemTextPart = this.createTextContent(text, element);
		this._elemLeadingGlyphPart = this.createGlyphContent(element, this._elemTextPart, CNS.PART_PRI_GLYPH_CONTENT);
		this._elemTailingGlyphPart = this.createGlyphContent(element, null, CNS.PART_ASSOC_GLYPH_CONTENT);
	},
	/** @ignore */
	doSetUseCornerDecoration: function($super, value)
	{
		$super(value);
		if (value)
		  Kekule.HtmlElementUtils.addClass(this._contentElem, CNS.CORNER_ALL);
		else
			Kekule.HtmlElementUtils.removeClass(this._contentElem, CNS.CORNER_ALL);
	},
	/** @ignore */
	getTextSelectable: function()
	{
		return true;
	},
	/** @private */
	changeContentText: function(newText)
	{
		Kekule.DomUtils.setElementText(this._elemTextPart, newText || '')
		//this._elemTextPart.innerHTML = newText || '';
	},
	/** @private */
	getClassNameForMsgType: function(msgType)
	{
		var MT = Kekule.Widget.MsgType;
		switch (msgType)
		{
			case MT.INFO: return CNS.MSG_INFO;
			case MT.WARNING: return CNS.MSG_WARNING;
			case MT.ERROR: return CNS.MSG_ERROR;
			default: return CNS.MSG_NORMAL;
		}
	}
});

/**
 * An group of message panels.
 * @class
 * @augments Kekule.Widget.WidgetGroup
 *
 * @property {Bool} reversedOrder If true, message will be added to group from bottom to top or right to left.
 * @property {Int} maxMsgCount If this value is set to a non zero value, when message in group larger than count,
 *   older messages will be automatically hidden.
 * @property {Int} msgFlashTime In millisecond. If this value is set, message will be automatically hidden
 *   after this time.
 */
Kekule.Widget.MsgGroup = Class.create(Kekule.Widget.WidgetGroup,
/** @lends Kekule.Widget.MsgGroup# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.MsgGroup',
	/** @private */
	BINDABLE_TAG_NAMES: ['span', 'div'],
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument)
	{
		$super(parentOrElementOrDocument);
		//this._childMsgPanels = [];
		this.setLayout(Kekule.Widget.Layout.VERTICAL);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('reversedOrder', {'dataType': DataType.BOOL});
		this.defineProp('maxMsgCount', {'dataType': DataType.INT,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('maxMsgCount', value);
				this.clearExcessiveMsgs();
			}
		});
		this.defineProp('msgFlashTime', {'dataType': DataType.INT})
	},
	/** @ignore */
	initPropValues: function($super)
	{
		$super();
		this.setMsgFlashTime(6000);
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.MSGGROUP;
	},
	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('div');
		return result;
	},

	/**
	 * Add a message to group.
	 * @param {String} msg
	 * @param {String} msgType
	 * @param {Int} flashTime
	 * @param {String} className Additional HTML class name need to add to new message panel widget.
	 * @returns {Kekule.Widget.MsgPanel} New message panel added to group.
	 */
	addMessage: function(msg, msgType, flashTime, className)
	{
		if (msg || msgType)
		{
			var result = new Kekule.Widget.MsgPanel(this, msg, msgType);
			result.setFinalizeAfterHiding(true);
			if (className)
				result.addClassName(className);
			var reversed = this.getReversedOrder();
			if (reversed)
				result.insertToWidget(this, this.getChildAt(0));
			else
				result.appendToWidget(this);
			var time = Kekule.ObjUtils.isUnset(flashTime)? this.getMsgFlashTime(): flashTime;
			if (time)
				result.flash(time, this);
			else
				result.show(this);
			//this._childMsgPanels.push(result);
			this.clearExcessiveMsgs();
			return result;
		}
	},
	/** @private */
	clearExcessiveMsgs: function()
	{
		var maxCount = this.getMaxMsgCount();
		if (maxCount && maxCount > 0)
		{
			//var count = this._childMsgPanels.length;
			var count = this.getChildWidgets().length;
			var excessCount = count - maxCount;
			if (excessCount > 0)
			{
				var index = 0;
				var self = this;
				var panel;
				var callback = function()
				{
					/*
					if (panel)
						self.removeWidget(panel, false);  // finalize last
					*/
					if (index < excessCount)
					{
						panel = self.getOldestMsgPanel();
						self.hideMsgPanel(panel, callback);
						++index;
					}
				};
				//this.hideMsgPanel(callback);
				callback();
			}
		}
	},
	/** @private */
	getOldestMsgPanel: function()
	{
		return this.getReversedOrder()? this.getLastChild(): this.getFirstChild();
	}, 	/** @private */
	hideMsgPanel: function(panel, callback)
	{
		//var panel = this._childMsgPanels[0];  // oldest
		//var panel = this.getOldestMsgPanel();
		panel.hide(this, callback);
		return panel;
	}
});


// Extent BaseWidget, provide reportMessage method for all widgets.
ClassEx.defineProp(Kekule.Widget.BaseWidget, 'msgReporter', {
	'dataType': 'Kekule.Widget.MsgGroup',
	'serializable': false,
	'setter': null,
	'getter': function(canCreate)
	{
		var result = this.getPropStoreFieldValue('msgReporter');
		if (!result && canCreate)
		{
			result = new Kekule.Widget.MsgGroup(this);
			//result.setDisplayed(false);
			result.addClassName(CNS.MSGGROUP_FOR_WIDGET);
			result.appendToWidget(this);
			//result.appendToElem(document.body);
			//console.log(result.getElement());
			this.setPropStoreFieldValue('msgReporter', result);
		}
		return result;
	}
});

ClassEx.extend(Kekule.Widget.BaseWidget, {
	/**
	 * Add a message to message reporter of widget.
	 * If flashTime is not set, the message will always be shown in reporter.
	 * @param {String} msg
	 * @param {String} msgType
	 * @param {Int} flashTime
	 * @param {String} className Additional HTML class name need to add to new message panel widget.
	 * @returns {Kekule.Widget.MsgPanel} New message panel added to reporter.
	 */
	reportMessage: function(msg, msgType, flashTime, className)
	{
		var msgReporter = this.getMsgReporter(true);  // can create
		var result = msgReporter.addMessage(msg, msgType, flashTime || 0, className);
		msgReporter.setDisplayed(true);
		return result;
	},
	/**
	 * Add a flash message to message reporter of widget.
	 * If flashTime param is not set, default value will be used.
	 * @param {String} msg
	 * @param {String} msgType
	 * @param {Int} flashTime
	 * @param {String} className Additional HTML class name need to add to new message panel widget.
	 * @returns {Kekule.Widget.MsgPanel} New message panel added to reporter.
	 */
	flashMessage: function(msg, msgType, flashTime, className)
	{
		return this.reportMessage(msg, msgType, flashTime || this.getMsgReporter(true).getMsgFlashTime(), className);
	},
	/**
	 * Remove a message from reporter.
	 * @param msgPanel
	 */
	removeMessage: function(msgPanel)
	{
		msgPanel.hide();
	}
});

})();