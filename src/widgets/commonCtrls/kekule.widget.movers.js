/**
 * @fileoverview
 * Enable widget or element to be movable by mouse or touch.
 * @author Partridge Jiang
 */


/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /utils/kekule.domUtils.js
 * requires /xbrowsers/kekule.x.js
 * requires /widgets/kekule.widget.base.js
 */

(function(){

"use strict";

var EU = Kekule.HtmlElementUtils;
var SU = Kekule.StyleUtils;
var EV = Kekule.X.Event;
var PS = Class.PropertyScope;

/**
 * An helper class tp make an element or widget movable.
 * @class
 * @augments ObjectEx
 *
 * @property {Bool} enabled
 * @property {Object} target Target HTML element or widget to be moved.
 *   Note, the target element must be an absiolute positioned one.
 * @property {Object} gripper When mouse down or touch down on gripper element/widget, movement begins.
 *   If this property is not set, click on target itself will start the moving.
 * @property {Bool} isMoving
 * @property {String} cssPropX CSS property name to set position on X axis, default is 'left'.
 * @property {String} cssPropY CSS property name to set position on Y axis, default is 'top'.
 * @property {String} movingCursor Cursor changed to this one when the moving starts.
 * @property {Int} movingCursorDelay When mouse down, after this delayed millisecond, cursor will be changed to moving one.
 */
Kekule.Widget.MoveHelper = Class.create(ObjectEx,
/** @lends Kekule.Widget.MoveHelper# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.MoveHelper',
	/** @constructs */
	initialize: function($super, target, gripper)
	{
		$super();

		this.reactMouseDownBind = this.reactMouseDown.bind(this);
		this.reactMouseUpBind = this.reactMouseUp.bind(this);
		this.reactMouseMoveBind = this.reactMouseMove.bind(this);
		this.reactTouchDownBind = this.reactTouchDown.bind(this);
		this.reactTouchEndBind = this.reactTouchEnd.bind(this);
		this.reactTouchMoveBind = this.reactTouchMove.bind(this);

		this.__$K_initialMoverInfo__ = {};  // private

		this.setCssPropX('left').setCssPropY('top').setMovingCursor('move').setMovingCursorDelay(500);

		this.setTarget(target);
		this.setGripper(gripper);
		this.setEnabled(true);
	},
	doFinalize: function($super)
	{
		this.setGripper(null);  // uninstall all event handlers
		$super();
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('enabled', {'dataType': DataType.BOOL});
		this.defineProp('target', {'dataType': DataType.OBJECT, 'serializable': false});
		this.defineProp('gripper', {'dataType': DataType.OBJECT, 'serializable': false,
			'getter': function()
			{
				return this.getPropStoreFieldValue('gripper') || this.getTarget();
			},
			'setter': function(value)
			{
				var oldValue = this.getPropStoreFieldValue('gripper');
				if (value !== oldValue)
				{
					this.setPropStoreFieldValue('gripper', value);
					this.gripperChanged(value, oldValue);
				}
			}
		});
		this.defineProp('isMoving', {'dataType': DataType.BOOL, 'serializable': false});
		this.defineProp('cssPropX', {'dataType': DataType.STRING});
		this.defineProp('cssPropY', {'dataType': DataType.STRING});
		this.defineProp('movingCursor', {'dataType': DataType.STRING});
		this.defineProp('movingCursorDelay', {'dataType': DataType.INT});
		this.defineProp('movable', {'dataType': DataType.BOOL, 'setter': null,
			'getter': function()
			{
				return this.getEnabled() && this.getGripper();
			}
		})
	},

	/** @private */
	_objIsWidget: function(obj)
	{
		return obj instanceof Kekule.Widget.BaseWidget;
	},
	/** @private */
	_getElement: function(obj)
	{
		if (this._objIsWidget(obj))
			return obj.getElement();
		else
			return obj;
	},
	/** @private */
	getTargetElement: function()
	{
		var t = this.getTarget();
		return this._objIsWidget(t)? t.getElement(): t;
	},
	/** @private */
	getGripperElement: function()
	{
		var g = this.getGripper();
		return this._objIsWidget(g)? g.getElement(): g;
	},
	/** @private */
	/*
	getGripperWidget: function(gripperElem)
	{
		var g = gripperElem || this.getGripper();
		return this._objIsWidget(g)? g: null;
	},
	*/
	/** @private */
	gripperChanged: function(newGripper, oldGripper)
	{
		if (oldGripper)
			this.installEventHandlers(this._getElement(oldGripper));
		if (newGripper)
			this.installEventHandlers(this._getElement(newGripper));
	},
	/** @private */
	installEventHandlers: function(gripperElem)
	{
		if (gripperElem)
		{
			EV.addListener(gripperElem, 'mousedown', this.reactMouseDownBind);
			//EV.addListener(gripperElem, 'mouseup', this.reactMouseUpBind);
			//EV.addListener(gripperElem, 'mousemove', this.reactMouseMoveBind);
			EV.addListener(gripperElem, 'touchstart', this.reactTouchDownBind);
			//EV.addListener(gripperElem, 'touchend', this.reactTouchEndBind);
			//EV.addListener(gripperElem, 'touchmove', this.reactTouchMoveBind);
		}
	},
	/** @private */
	uninstallEventHandlers: function(gripperElem)
	{
		if (gripperElem)
		{
			EV.removeListener(gripperElem, 'mousedown', this.reactMouseDownBind);
			//EV.removeListener(gripperElem, 'mouseup', this.reactMouseUpBind);
			//EV.removeListener(gripperElem, 'mousemove', this.reactMouseMoveBind);
			EV.removeListener(gripperElem, 'touchstart', this.reactTouchDownBind);
			//EV.removeListener(gripperElem, 'touchend', this.reactTouchEndBind);
			//EV.removeListener(gripperElem, 'touchmove', this.reactTouchMoveBind);
		}
	},

	/** @private */
	_elemSupportCapture: function(elem)
	{
		return !!elem.setCapture;
	},
	/** @private */
	_getMoveEventReceiverElem: function(gripperElem)
	{
		return (/*this.getGripperWidget(gripperElem) ||*/ this._elemSupportCapture(gripperElem))?
				gripperElem: gripperElem.ownerDocument.documentElement;
	},
	/** @private */
	setMouseCapture: function(capture)
	{
		/*
		var w = this.getGripperWidget();
		if (w)
		{
			w.setMouseCapture(capture);
		}
		else // gripper is not widget, just element
		*/
		{
			var gripperElem = this.getGripperElement();
			if (gripperElem)
			{
				if (capture)
				{
					if (gripperElem.setCapture)
						gripperElem.setCapture(true);
				}
				else
				{
					if (gripperElem.releaseCapture)
						gripperElem.releaseCapture();
				}
			}
		}
	},

	/** @private */
	beginMoving: function(initialScreenCoord)
	{
		if (this.getIsMoving())
			return;

		var targetElem = this.getTargetElement();
		EU.makePositioned(targetElem);

		// save initial information
		this.saveInitialInformation(initialScreenCoord);

		// install move event listener
		var moveReceiver = this._getMoveEventReceiverElem(this.getGripperElement());
		EV.addListener(moveReceiver, 'mousemove', this.reactMouseMoveBind);
		EV.addListener(moveReceiver, 'touchmove', this.reactTouchMoveBind);
		EV.addListener(moveReceiver, 'mouseup', this.reactMouseUpBind);
		EV.addListener(moveReceiver, 'touchend', this.reactTouchEndBind);

		/*
		var gripperElem = this.getGripperElement();
		if (gripperElem.setCapture)
			gripperElem.setCapture(true);
		*/
		this.setMouseCapture(true);
		this._setCursorHandle = this.delaySetMoveCursor();
		this.setIsMoving(true);
		//console.log('begin move');
	},
	/** @private */
	endMoving: function()
	{
		this.setIsMoving(false);
		this.setMouseCapture(false);
		// restore gripper cursor and remove moving event listener
		var gripper = this.getGripperElement();
		var moveReceiver = this._getMoveEventReceiverElem(gripper);
		EV.removeListener(moveReceiver, 'mousemove', this.reactMouseMoveBind);
		EV.removeListener(moveReceiver, 'touchmove', this.reactTouchMoveBind);
		EV.removeListener(moveReceiver, 'mouseup', this.reactMouseUpBind);
		EV.removeListener(moveReceiver, 'touchend', this.reactTouchEndBind);

		// restore cursor
		this.clearCursorSetter();
		if (gripper)
		{
			var cursor = this.__$K_initialMoverInfo__.cursor;
			gripper.style.cursor = cursor || '';
			this.__$K_initialMoverInfo__.cursor = null;
		}
		//console.log('begin move');
	},
	/** @private */
	moveTo: function(newPointerCoord)
	{
		// set move cursor instantly
		this.clearCursorSetter();
		this.doSetMoveCursor();
		//console.log('move to ', newPointerCoord);
		var elem = this.getTargetElement();
		if (!elem)
			return;
		var initInfo = this.__$K_initialMoverInfo__;
		var coordDelta = Kekule.CoordUtils.substract(newPointerCoord, initInfo.pointerCoord);
		//console.log(initInfo.pointerCoord.y, newPointerCoord.y, initInfo.elemCoord.y);
		//var newElemPos = Kekule.CoordUtils.add(initInfo.elemCoord, coordDelta);
		if ((this.getCssPropX() || '').toLowerCase() === 'right')
			elem.style.right = (initInfo.elemCoord.x - coordDelta.x) + 'px';
		else
			elem.style.left = (initInfo.elemCoord.x + coordDelta.x) + 'px';
		if ((this.getCssPropY() || '').toLowerCase() === 'bottom')
			elem.style.bottom = (initInfo.elemCoord.y - coordDelta.y) + 'px';
		else
			elem.style.top = (initInfo.elemCoord.y + coordDelta.y) + 'px';
	},
	/** @privat */
	delaySetMoveCursor: function()
	{
		return setTimeout(this.doSetMoveCursor.bind(this), this.getMovingCursorDelay() || 0);
	},
	/** @private */
	doSetMoveCursor: function()
	{
		var gripper = this.getGripperElement();
		if (gripper && this.getMovingCursor())
			gripper.style.cursor = this.getMovingCursor();
	},
	/** @private */
	clearCursorSetter: function()
	{
		if (this._setCursorHandle)
			clearTimeout(this._setCursorHandle);
	},
	/** @private */
	saveInitialInformation: function(pointerScreenCoord)
	{
		var elem = this.getTargetElement();
		if (elem)
		{
			// save mouse initial position
			this.__$K_initialMoverInfo__.pointerCoord = pointerScreenCoord;
			var coord;
			var p = (SU.getComputedStyle(elem, 'position') || '').toLowerCase();
			// save element initial position
			var cssPropX = (this.getCssPropX() || 'left').toLowerCase();
			var cssPropY = (this.getCssPropY() || 'top').toLowerCase();
			if (p === 'relative')
			{
				var left = SU.analysisUnitsValue(SU.getComputedStyle(elem, 'left')).value || 0;
				var top = SU.analysisUnitsValue(SU.getComputedStyle(elem, 'top')).value || 0;
				coord = {'x': left, 'y': top};
				// relative element always need to be moved by t/l
				cssPropX = 'left';
				cssPropY = 'top';
			}
			else  // absolute or fixed
				coord = {'x': elem.offsetLeft, 'y': elem.offsetTop};

			var dim = EU.getElemOffsetDimension(elem);
			if (cssPropX === 'right')
				coord.x += dim.width;
			if (cssPropY === 'bottom')
				coord.y += dim.height;
			this.__$K_initialMoverInfo__.elemCoord = coord;
			if (this.getGripperElement())
			{
				//if (!this.__$K_initialMoverInfo__.cursor)  // avoid set cursor twice
				this.__$K_initialMoverInfo__.cursor = this.getGripperElement().style.cursor;
			}
		}
	},

	/////////// Event handlers //////////////

	/** @private */
	reactMouseDown: function(e)
	{
		if (this.getTargetElement() && this.getEnabled())
		{
			if (e.getButton() === EV.MouseButton.LEFT)
			{
				this.beginMoving({'x': e.getScreenX(), 'y': e.getScreenY()}, e.getTarget());
				e.preventDefault();
			}
		}
	},
	/** @private */
	reactMouseUp: function(e)
	{
		if (e.getButton() === EV.MouseButton.LEFT)
		{
			if (this.getIsMoving())
			{
				this.endMoving();
				e.preventDefault();
			}
		}
	},
	/** @private */
	reactMouseMove: function(e)
	{
		if (this.getIsMoving())
		{
			var mouseCoord = {'x': e.getScreenX(), 'y': e.getScreenY()};
			this.moveTo(mouseCoord);
			e.preventDefault();
		}
	},

	/** @private */
	reactTouchDown: function(e)
	{
		if (this.getEnabled())
		{
			this.beginMoving({'x': e.getScreenX(), 'y': e.getScreenY()}, e.getTarget());
			e.preventDefault();
		}
	},
	/** @private */
	reactTouchEnd: function(e)
	{
		if (this.getIsMoving())
		{
			this.endMoving();
			e.preventDefault();
		}
	},
	/** @private */
	reactTouchMove: function(e)
	{
		if (this.getIsMoving())
		{
			var coord = {'x': e.getScreenX(), 'y': e.getScreenY()};
			this.moveTo(coord);
			e.preventDefault();
		}
	}
});

// extend Kekule.Widget.BaseWidget, add move ability to all widgets
ClassEx.extend(Kekule.Widget.BaseWidget,
/** @lends Kekule.Widget.BaseWidget# */
{
	/** @private */
	_getMoveHelper: function(canCreate)
	{
		var result = this.getMoveHelper();
		if (!result && canCreate)
			result = new Kekule.Widget.MoveHelper(this);
		return result;
	},
	/** @private */
	movingGripperChanged: function()
	{
		var gripper = this.getMovingGripper();
		if (gripper)  // movable now
		{
			var helper = this._getMoveHelper(true);
			helper.setGripper(gripper);
		}
		else  // not movable
		{
			var helper = this._getMoveHelper(false);
			if (helper)
			{
				helper.setGripper(null);
			}
		}
	}
});

ClassEx.defineProps(Kekule.Widget.BaseWidget, [
	{
		'name': 'movable', 'dataType': DataType.BOOL,
		'getter': function()
		{
			return this._getMoveHelper() && this._getMoveHelper().getMovable();
		},
		'setter': function(value)
		{
			var old = this.getMovable();
			if (value !== old)
			{
				if (value)  // setMovable(true)
					this.setMovingGripper((this.getDefaultMovingGripper && this.getDefaultMovingGripper()) || this);
				else  // false
				{
					var helper = this._getMoveHelper();
					if (helper)
						helper.setEnabled(false);
				}
			}
		}
	},
	{
		'name': 'movingGripper', 'dataType': DataType.OBJECT,
		'setter': function(value)
		{
			if (value !== this.getMovingGripper())
			{
				this.setPropStoreFieldValue('movingGripper', value);
				this.movingGripperChanged();
			}
		}
	},
	{
		'name': 'isMoving', 'dataType': DataType.BOOL, 'serializable': false, 'scope': PS.PRIVATE,
		'setter': null,
		'getter': function()
		{
			var helper = this.getMoveHelper();
			return helper? helper.getIsMoving(): false;
		}
	},
	{'name': 'moveHelper', 'dataType': 'Kekule.Widget.MoveHelper', 'serializable': false, 'setter': null, 'scope': PS.PRIVATE}
]);


})();