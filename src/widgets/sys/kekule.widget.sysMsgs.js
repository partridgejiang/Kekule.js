/**
 * @fileoverview
 * A special message panel group to display system exception informations.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /common/kekule.exceptions.js
 * requires /utils/kekule.utils.js
 * requires /utils/kekule.domUtils.js
 * requires /xbrowsers/kekule.x.js
 * requires /widgets/kekule.widget.base.js
 * requires /widgets/commonCtrls/kekulw.widget.msgPanels.js
 */

(function(){
"use strict";

var EU = Kekule.HtmlElementUtils;
var CNS = Kekule.Widget.HtmlClassNames;

/** @ignore */
Kekule.Widget.HtmlClassNames = Object.extend(Kekule.Widget.HtmlClassNames, {
	SYSMSGGROUP: 'K-SysMsgGroup'
});


/**
 * An message group to display special system message (mainly Kekule exceptions).
 * @class
 * @augments Kekule.Widget.MsgGroup
 */
Kekule.Widget.SysMsgGroup = Class.create(Kekule.Widget.MsgGroup,
/** @lends Kekule.Widget.SysMsgGroup# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.SysMsgGroup',
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument)
	{
		$super(parentOrElementOrDocument);
	},
	/** @ignore */
	initPropValues: function($super)
	{
		$super();
		// default values
		this.setMaxMsgCount(6);
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.SYSMSGGROUP;
	}
});


/**
 * Exception handler that can report exceptions and messages by widget system.
 * @class
 * @augments Kekule.ExceptionHandler
 */
Kekule.Widget.ExceptionHandler = Class.create(Kekule.ExceptionHandler,
/** @lends Kekule.Widget.ExceptionHandler# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.ExceptionHandler',
	/** @private */
	initProperties: function()
	{
		this.defineProp('document', {'dataType': DataType.OBJECT, 'serializable': false,
			'getter': function()
			{
				return this.getPropStoreFieldValue('document') || document;
			}
		});
		this.defineProp('sysMsgGroup', {'dataType': 'Kekule.Widget.SysMsgGroup', 'serializable': false, 'setter': null,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('sysMsgGroup');
				if (!result)
				{
					result = new Kekule.Widget.SysMsgGroup(this.getDocument());
					result.appendToElem(this.getDocument().body);
					this.setPropStoreFieldValue('sysMsgGroup', result);
				}
				return result;
			}
		});
	},

	/** @ignore */
	throwException: function($super, e, exceptionLevel)
	{
		var EL = Kekule.ExceptionLevel;
		var MT = Kekule.Widget.MsgType;
		if (!exceptionLevel)
			exceptionLevel = EL.ERROR;
		var msg;
		if (typeof(e) === 'string')
			msg = e;
		else
			msg = e.message;
		if (msg)
		{
			var msgType =
				(exceptionLevel === EL.ERROR) || !exceptionLevel? MT.ERROR:
				(exceptionLevel === EL.WARNING)? MT.WARNING:
				(exceptionLevel === EL.NOTE)? MT.INFO:
					MT.NORMAL;
			this.getSysMsgGroup().addMessage(msg, msgType);
		}
		return $super(e, exceptionLevel);
	}
});
Kekule.ClassUtils.makeSingleton(Kekule.Widget.ExceptionHandler);

// register exception handler
Kekule.X.domReady(function()
{
	Kekule.exceptionHandler = Kekule.Widget.ExceptionHandler.getInstance();
});


})();