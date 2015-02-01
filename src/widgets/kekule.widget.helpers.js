/**
 * @fileoverview
 * Some helper classes for widgets.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /utils/kekule.utils.js
 * requires /utils/kekule.domUtils.js
 * requires /xbrowsers/kekule.x.js
 */

(function(){

/**
 * Enumeration of modes to evoke/revoke associated widget.
 * @class
 */
Kekule.Widget.EvokeMode = {
	/** Alway be evoked or revoked. */
	ALWAYS: 0,

	/** Click on evokee widget. */
	EVOKEE_CLICK: 1,
	/** Mouse enter the evokee widget. */
	EVOKEE_MOUSE_ENTER: 2,
	/** Mouse leave the evokee widget. */
	EVOKEE_MOUSE_LEAVE: 3,
	/** Mouse down on the evokee widget. */
	EVOKEE_MOUSE_DOWN: 4,
	/** Mouse up on the evokee widget. */
	EVOKEE_MOUSE_UP: 5,
	/** Mouse move on evokee widget. */
	EVOKEE_MOUSE_MOVE: 6,
	/** Touch on the evokee widget. */
	EVOKEE_TOUCH: 7,

	/** Click on evoker widget. */
	EVOKER_CLICK: 11,
	/** Mouse enter the evoker widget. */
	EVOKER_MOUSE_ENTER: 12,
	/** Mouse leave the evoker widget. */
	EVOKER_MOUSE_LEAVE: 13,
	/** Mouse down on the evoker widget. */
	EVOKER_MOUSE_DOWN: 14,
	/** Mouse up on the evoker widget. */
	EVOKER_MOUSE_UP: 15,
	/** Mouse move on evoker widget. */
	EVOKER_MOUSE_MOVE: 16,
	/** Touch on the evoker widget. */
	EVOKER_TOUCH: 17,

	/** Timeout and not focused on evokee widget. */
	EVOKEE_TIMEOUT: 21,
	/** Timeout and not focused on evoker widget. */
	EVOKER_TIMEOUT: 22
};
/** @ignore */
var EM = Kekule.Widget.EvokeMode;

/**
 * A class help to evoke (show) / hide associated widgets.
 * User should not use this class directly.
 * @class
 * @augments ObjectEx
 *
 * @property {Kekule.Widget.BaseWidget} evokee Widget to raise the evoking (usually the parent widget).
 * @property {Kekule.Widget.BaseWidget} evoker Widget to be evoked (usually the child widget).
 * @property {Array} evokeModes Modes to evoke (show) the evoker.
 * @property {Array} revokeModes Modes to revoke (hide) the evoker.
 * @property {Int} timeout If {@link Kekule.Widget.EvokeMode.EVOKEE_TIMEOUT} or {@link Kekule.Widget.EvokeMode.EVOKER_TIMEOUT} in mode,
 *   this property will decide after how many milliseconds of evoke, the revoke should be called.
 * @property {Int} showHideType
 * @private
 */
Kekule.Widget.DynamicEvokeHelper = Class.create(ObjectEx,
/** @lends Kekule.Widget.DynamicEvokeHelper# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.DynamicEvokeHelper',
	/** @private */
	evokeEvents: ['click', /*'mouseover', 'mouseout',*/ 'mouseenter', 'mouseleave', 'mousedown', 'mouseup', 'touchstart'],
	/** @private */
	DEF_TIMEOUT: 5000,
	/** @constructs */
	initialize: function($super, evokee, evoker, evokeModes, revokeModes, timeout)
	{
		$super();
		this._timeoutRevokeHandle = null;  // private
		this.reactEvokeEventsBind = this.reactEvokeEvents.bind(this);  // IMPORTANT, linkWidgets use reactEvokeEventsBind
		this.checkTimeoutRevokeBind = this.checkTimeoutRevoke.bind(this); // IMPORTAN, timeout settings may be used after linkWidgets
		this.setTimeout(timeout || this.DEF_TIMEOUT);
		//console.log('create', evokeModes, revokeModes);
		this.setPropStoreFieldValue('evokeModes', evokeModes || []);
		this.setPropStoreFieldValue('revokeModes', revokeModes || []);
		this.linkWidgets(evokee, evoker);
	},
	/** @ignore */
	finalize: function($super)
	{
		this.unlinkWidgets(this.getEvokee(), this.getEvoker());
		$super();
	},

	/** @private */
	initProperties: function()
	{
		this.defineProp('evokee', {'dataType': 'Kekule.Widget.BaseWidget', 'serializable': false, setter: null});
		this.defineProp('evoker', {'dataType': 'Kekule.Widget.BaseWidget', 'serializable': false, setter: null});
		this.defineProp('evokeModes', {'dataType': DataType.ARRAY});
		this.defineProp('revokeModes', {'dataType': DataType.ARRAY});
		this.defineProp('timeout', {'dataType': DataType.INT});  // in seconds
		this.defineProp('showHideType', {'dataType': DataType.INT});
	},

	/**
	 * Invoke the evoker (usually shows it).
	 */
	evoke: function()
	{
		if (this.getEvoker())
		{
			// clear prev timeout handler (if exists)
			clearTimeout(this._timeoutRevokeHandle);

			this.getEvoker().show(this.getEvokee(), null, this.getShowHideType());
			this.postponeTimeoutCheck();
		}
	},
	/**
	 * Revoke the evoker (usually hide it).
	 */
	revoke: function()
	{
		if (this.getEvoker())
		{
			// clear prev timeout handler (if exists)
			clearTimeout(this._timeoutRevokeHandle);

			// set focus out from evoker
			var doc = this.getEvoker().getDocument();
			doc.body.focus();

			// then hide the evoker
			this.getEvoker().hide(this.getEvokee(), null, this.getShowHideType());
		}
	},

	/** @private */
	doObjectChange: function($super, modifiedPropNames)
	{
		$super(modifiedPropNames);
		var inter = Kekule.ArrayUtils.intersect(modifiedPropNames, ['evokeModes', 'revokeModes']);
		if (inter.length > 0)
			this.evokeModesChanged();
	},

	/** @private */
	linkWidgets: function(evokee, evoker)
	{
		this.setPropStoreFieldValue('evokee', evokee);
		this.setPropStoreFieldValue('evoker', evoker);
		this.installEventHandlers(evokee, this.evokeEvents, this.reactEvokeEventsBind);
		this.installEventHandlers(evoker, this.evokeEvents, this.reactEvokeEventsBind);

		this.updateOnAlwaysMode();
	},
	/** @private */
	unlinkWidgets: function(evokee, evoker)
	{
		this.uninstallEventHandlers(evokee, this.evokeEvents, this.reactEvokeEventsBind);
		this.uninstallEventHandlers(evoker, this.evokeEvents, this.reactEvokeEventsBind);
	},
	/** @private */
	installEventHandlers: function(widget, events, handler)
	{
		for (var i = 0, l = events.length; i < l; ++i)
		{
			widget.addEventListener(events[i], handler);
		}
	},
	/** @private */
	uninstallEventHandlers: function(widget, events, handler)
	{
		for (var i = 0, l = events.length; i < l; ++i)
		{
			widget.removeEventListener(events[i], handler);
		}
	},

	/** @private */
	evokeModesChanged: function()
	{
		this.updateOnAlwaysMode();
	},
	/** @private */
	updateOnAlwaysMode: function()
	{
		if (this.getEvokeModes().indexOf(EM.ALWAYS) >= 0)  // always evoke
		{
			//console.log('updateOnAlwaysMode', this.getEvokeModes(), this.getRevokeModes(), this.getEvoker());
			this.evoke();
			//console.log('after evoke', this.getEvoker().getDisplayed());
		}
		else if (this.getRevokeModes().indexOf(EM.ALWAYS) >= 0)  // always revoke
		{
			this.revoke();
		}
	},

	/** @private */
	checkTimeoutRevoke: function(onEvoke)
	{
		if (!this.getEvoker())
			return;

		var DU = Kekule.DomUtils;
		/*
		if (onEvoke)  // evoke after a period of time
		{
			// do nothing here

		}
		else  // revoke
		*/
		// TODO: currently do not support timeout evoke
		{
			var doc = this.getEvoker().getDocument();
			var activeElem = doc.activeElement;
			var modes = this.getRevokeModes();
			var checkElems = [];
			if (modes.indexOf(EM.EVOKEE_TIMEOUT) >= 0)
				checkElems.push(this.getEvokee().getElement());
			if (modes.indexOf(EM.EVOKER_TIMEOUT) >= 0)
				checkElems.push(this.getEvoker().getElement());

			var postpone = false;
			for (var i = 0, l = checkElems.length; i < l; ++i)
			{
				var elem = checkElems[i];
				if ((activeElem === elem) || DU.isDescendantOf(activeElem, elem))
				{
					postpone = true;
					break;
				}
			}
			if (postpone)
				this.postponeTimeoutCheck();
			else
				this.revoke();
		}
	},
	/** @private */
	postponeTimeoutCheck: function()
	{
		if (this.hasTimeoutMode(this.getRevokeModes()))
		{
			//console.log(this.checkTimeoutRevokeBind, this.getTimeout());
			if (this.getEvokeModes().indexOf(EM.ALWAYS) >= 0)  // always evoke
				return;
			else
				this._timeoutRevokeHandle = setTimeout(this.checkTimeoutRevokeBind, this.getTimeout());
		}
	},

	/** @private */
	hasTimeoutMode: function(evokeModes)
	{
		//return false;
		return Kekule.ArrayUtils.intersect([EM.EVOKEE_TIMEOUT, EM.EVOKER_TIMEOUT], evokeModes).length > 0;
	},

	/** @private */
	getEventTypeOfMode: function(evokeMode)
	{
		switch (evokeMode)
		{
			case EM.EVOKEE_CLICK:
			case EM.EVOKER_CLICK: return 'click';
			case EM.EVOKEE_MOUSE_ENTER:
			case EM.EVOKER_MOUSE_ENTER: return 'mouseenter';
			case EM.EVOKEE_MOUSE_LEAVE:
			case EM.EVOKER_MOUSE_LEAVE: return 'mouseleave';
			case EM.EVOKEE_MOUSE_DOWN:
			case EM.EVOKER_MOUSE_DOWN: return 'mousedown';
			case EM.EVOKEE_MOUSE_UP:
			case EM.EVOKER_MOUSE_UP: return 'mouseup';
			case EM.EVOKEE_MOUSE_MOVE:
			case EM.EVOKER_MOUSE_MOVE: return 'mousemove';
			case EM.EVOKEE_TOUCH:
			case EM.EVOKER_TOUCH: return 'touchstart';
		}
	},
	/** @private */
	isEvokeTargetOnEvokee: function(evokeMode)
	{
		return (evokeMode >= EM.EVOKEE_CLICK) && (evokeMode <= EM.EVOKEE_TOUCH);
	},

	/** @private */
	reactEvokeEvents: function(e)
	{
		var evtType = e.htmlEvent.getType();
		var target = e.target;

		if ((target !== this.getEvokee()) && (target !== this.getEvoker()))
			return;

		var isOnEvokee = (e.target === this.getEvokee());
		var isEvoke = !this.getEvoker().isShown();

		if (isEvoke)
		{
			if ((this.getRevokeModes().indexOf(EM.ALWAYS) >= 0))  // always revoke, do not show it
				return;
			var modes = this.getEvokeModes();
			for (var i = 0, l = modes.length; i < l; ++i)
			{
				if (isOnEvokee === this.isEvokeTargetOnEvokee(modes[i])
					&& (evtType === this.getEventTypeOfMode(modes[i])))  // meet
				{
					this.evoke();
					return;
				}
			}
		}
		else
		{
			//console.log('ready to revoke', this.getEvokeModes().indexOf(EM.ALWAYS));
			if (this.getEvokeModes().indexOf(EM.ALWAYS) >= 0)  // always evoke, do not hide it
				return;

			var modes = this.getRevokeModes();
			for (var i = 0, l = modes.length; i < l; ++i)
			{
				if (isOnEvokee === this.isEvokeTargetOnEvokee(modes[i])
					&& (evtType === this.getEventTypeOfMode(modes[i])))  // meet
				{
					//console.log('helper', isOnEvokee, evtType, e);
					this.revoke();
					return;
				}
			}
		}
	}
});

})();