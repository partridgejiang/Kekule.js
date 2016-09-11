/**
 * @fileoverview
 * Implementation of resize gripper for other widgets or HTML elements.
 * @author Partridge Jiang
 */

(function(){

"use strict";

var EU = Kekule.HtmlElementUtils;
var EV = Kekule.X.Event;
var CNS = Kekule.Widget.HtmlClassNames;

/** @ignore */
Kekule.Widget.HtmlClassNames = Object.extend(Kekule.Widget.HtmlClassNames, {
	RESIZEGRIPPER: 'K-Resize-Gripper'
});

var PS = Class.PropertyScope;

/**
 * An gripper widget at the bottom right corner of parent to change the parent's dimension.
 * @class
 * @augments Kekule.Widget.BaseWidget
 *
 * @property {Object} target Target HTML element or widget to be resized.
 * @property {Bool} retainAspectRatio Whether retain width/height ratio when resizing.
 */
Kekule.Widget.ResizeGripper = Class.create(Kekule.Widget.BaseWidget,
/** @lends Kekule.Widget.ResizeGripper# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.ResizeGripper',
	/** @private */
	BINDABLE_TAG_NAMES: ['div', 'span'],
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument)
	{
		this.reactMousemoveBind = this.reactMousemove.bind(this);
		this.reactMouseupBind = this.reactMouseup.bind(this);
		this.reactTouchmoveBind = this.reactTouchmove.bind(this);
		this.reactTouchendBind = this.reactTouchend.bind(this);

		$super(parentOrElementOrDocument);
		if (!this.getTarget())
		{
			if (this.getParent())
				this.setTarget(this.getParent());
			else
			{
				var parentElem = this.getElement().parentNode;
				if (parentElem)
					this.setTarget(parentElem);
			}
		}
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('target', {'dataType': DataType.OBJECT, 'serializable': false,
			'setter': function(value)
			{
				if (this.getTarget() !== value)
				{
					this.setPropStoreFieldValue('target', value);
					this.targetChanged(value);
				}
			}
		});
		this.defineProp('retainAspectRatio', {'dataType': DataType.BOOL});
		// private properties
		this.defineProp('isUnderResizing', {'dataType': DataType.BOOL, 'serializable': false, 'setter': null, 'scope': PS.PRIVATE});
		this.defineProp('baseCoord', {'dataType': DataType.HASH, 'serializable': false, 'scope': PS.PRIVATE});
		//this.defineProp('currCoord', {'dataType': DataType.HASH, 'serializable': false, 'scope': PS.PRIVATE});
		this.defineProp('baseDimension', {'dataType': DataType.HASH, 'serializable': false, 'scope': PS.PRIVATE});
		this.defineProp('baseAspectRatio', {'dataType': DataType.FLOAT, 'serializable': false, 'scope': PS.PRIVATE});
	},

	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.RESIZEGRIPPER;
	},
	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('span');
		return result;
	},

	/**
	 * Called when target object is changed.
	 * @param {Object} value
	 * @private
	 */
	targetChanged: function(value)
	{
		var elem;
		// change parent of curr widget
		if (this.targetIsWidget(value))
		{
			elem = value.getResizerElement? value.getResizerElement(): value.getCoreElement();
		}
		else // HTML element
		{
			elem = value;
		}
		if (elem)
			this.appendToElem(elem);
	},
	/**
	 * Check if target object is a widget.
	 * @param {Object} target
	 * @returns {Bool}
	 * @private
	 */
	targetIsWidget: function(target)
	{
		return target instanceof Kekule.Widget.BaseWidget;
	},
	/**
	 * Returns dimension of target object.
	 * @param {Object} obj
	 * @returns {Hash}
	 * @private
	 */
	getTargetDimension: function(obj)
	{
		var target = obj || this.getTarget();
		if (this.targetIsWidget(target))
			return target.getDimension();
		else
			return Kekule.HtmlElementUtils.getElemBoundingClientRect(target, false);
	},
	/**
	 * Set dimension (in px) of target object.
	 * @param {Object} obj
	 * @param {Int} width
	 * @param {Int} height
	 */
	setTargetDimension: function(obj, width, height)
	{
		var target = obj || this.getTarget();
		if (this.targetIsWidget(target))
			target.setDimension(width, height);
		else  // HTML element
		{
			var style = target.style;
			style.width = width + 'px';
			style.height = height + 'px';
		}
	},

	/**
	 * Prepare to resize.
	 * @private
	 */
	prepareResizing: function(startingCoord)
	{
		if (!this.getIsUnderResizing())
		{
			var eventReceiver = this._getMoveEventReceiverElem(this.getElement());
			this._installEventHandlers(eventReceiver);

			this._setMouseCapture(this.getElement(), true);

			this.setBaseCoord(startingCoord);
			var dim = this.getTargetDimension();
			this.setBaseDimension(dim);
			this.setBaseAspectRatio(dim.width / dim.height);
			//this.getElement().setCapture(true);
			this.setPropStoreFieldValue('isUnderResizing', true);
			//this.setMouseCapture(true);
		}
	},
	/**
	 * Resizing process is over.
	 */
	doneResizing: function()
	{
		this._setMouseCapture(this.getElement(), false);

		var eventReceiver = this._getMoveEventReceiverElem(this.getElement());
		this._uninstallEventHandlers(eventReceiver);
		//this.getElement().setCapture(false);
		//this.setMouseCapture(false);
		this.setBaseCoord(null);
		this.setBaseDimension(null);
		this.setPropStoreFieldValue('isUnderResizing', false);
	},
	/**
	 * Resize to a proper size according to starting coord and curr coord.
	 * @param {Hash} currCoord
	 * @private
	 */
	resizeTo: function(currCoord)
	{
		var delta = Kekule.CoordUtils.substract(currCoord, this.getBaseCoord());
		var baseDim = this.getBaseDimension();
		var w = baseDim.width + delta.x;
		var h = baseDim.height + delta.y;
		if (this.getRetainAspectRatio())
		{
			var baseRatio = this.getBaseAspectRatio();
			if (w / h > baseRatio)
				w = baseRatio * h;
			else if (w / h < baseRatio)
				h = w / baseRatio;
		}
		this.setTargetDimension(this.getTarget(), w, h);
	},

	// event reactors
	/** @private */
	reactMousemove: function(e)
	{
		if (this.getIsUnderResizing())
		{
			var coord = {'x': e.getScreenX(), 'y': e.getScreenY()};
			this.resizeTo(coord);
			e.stopPropagation();
			e.preventDefault();
		}
	},
	/** @private */
	reactMouseup: function(e)
	{
		if (e.getButton() === Kekule.X.Event.MouseButton.LEFT)
		{
			if (this.getIsUnderResizing())
			{
				this.doneResizing();
				e.preventDefault();
			}
		}
	},
	/** @private */
	reactTouchmove: function(e)
	{
		if (this.getIsUnderResizing())
		{
			var coord = {'x': e.getScreenX(), 'y': e.getScreenY()};
			this.resizeTo(coord);
			e.stopPropagation();
			e.preventDefault();
		}
	},
	/** @private */
	reactTouchend: function(e)
	{
		if (this.getIsUnderResizing())
		{
			this.doneResizing();
			e.preventDefault();
		}
	},

	/** @private */
	_elemSupportCapture: function(elem)
	{
		return !!elem.setCapture;
	},
	/** @private */
	_setMouseCapture: function(elem, capture)
	{
		if (elem)
		{
			if (capture)
			{
				if (elem.setCapture)
					elem.setCapture(true);
			}
			else
			{
				if (elem.releaseCapture)
					elem.releaseCapture();
			}
		}
	},
	/** @private */
	_getMoveEventReceiverElem: function(gripperElem)
	{
		return (this._elemSupportCapture(gripperElem))?
				gripperElem: gripperElem.ownerDocument.documentElement;
	},
	/** @private */
	_installEventHandlers: function(receiver)
	{
		EV.addListener(receiver, 'mousemove', this.reactMousemoveBind);
		EV.addListener(receiver, 'touchmove', this.reactTouchmoveBind);
		EV.addListener(receiver, 'mouseup', this.reactMouseupBind);
		EV.addListener(receiver, 'touchend', this.reactTouchendBind);
	},
	/** @private */
	_uninstallEventHandlers: function(receiver)
	{
		EV.removeListener(receiver, 'mousemove', this.reactMousemoveBind);
		EV.removeListener(receiver, 'touchmove', this.reactTouchmoveBind);
		EV.removeListener(receiver, 'mouseup', this.reactMouseupBind);
		EV.removeListener(receiver, 'touchend', this.reactTouchendBind);
	},

	/** @ignore */
	//react_mousedown: function(e)
	doReactActiviting: function($super, e)
	{
		$super(e);
		//var evType = e.getType();
		{
			var coord = {'x': e.getScreenX(), 'y': e.getScreenY()};
			this.prepareResizing(coord);
		}
	}
	/** @ignore */
	//react_mouseup: function(e)
	/*
	doReactDeactiviting: function($super, e)
	{
		$super(e);
		//if (e.getButton() === Kekule.X.Event.MouseButton.LEFT)
		this.doneResizing();
	},
	*/
	/** @ignore */
	/*
	react_mousemove: function(e)
	{
		if (this.getIsUnderResizing())
		{
			var coord = {'x': e.getScreenX(), 'y': e.getScreenY()};
			this.resizeTo(coord);
			e.stopPropagation();
			e.preventDefault();
		}
	},
	*/
	/** @ignore */
	/*
	react_touchmove: function(e)
	{
		if (this.getIsUnderResizing())
		{
			var coord = {'x': e.getScreenX(), 'y': e.getScreenY()};
			this.resizeTo(coord);
			e.stopPropagation();
			e.preventDefault();
		}
	}
	*/
});

// extend Kekule.Widget.BaseWidget, add resize ability to all widgets
ClassEx.extend(Kekule.Widget.BaseWidget, {
	resizableChanged: function()
	{
		if (this.getResizable())  // add new gripper widget
		{
			var gripper = new Kekule.Widget.ResizeGripper(this);
			gripper.setRetainAspectRatio(this.getResizeWithAspectRatio());
			this.setPropStoreFieldValue('resizeGripper', gripper);
		}
		else
		{
			var gripper = this.getResizeGripper();
			if (gripper)
				gripper.finalize();
			this.setPropStoreFieldValue('resizeGripper', null);
		}
	}
});

ClassEx.defineProps(Kekule.Widget.BaseWidget, [
	{
		'name': 'resizable', 'dataType': DataType.BOOL,
		'setter': function(value)
		{
			if (value !== this.getResizable())
			{
				this.setPropStoreFieldValue('resizable', value);
				this.resizableChanged();
			}
		}
	},
	{
		'name': 'resizeWithAspectRatio', 'dataType': DataType.BOOL,
		'setter': function(value)
		{
			this.setPropStoreFieldValue('resizeWithAspectRatio', value);
			if (this.getResizeGripper())
				this.getResizeGripper().setRetainAspectRatio(value);
		}
	},
	{
		'name': 'isResizing', 'dataType': DataType.BOOL, 'serializable': false, 'scope': PS.PRIVATE,
		'setter': null,
		'getter': function()
		{
			var resizer = this.getResizeGripper();
			return resizer? resizer.getIsUnderResizing(): false;
		}
	},
	{'name': 'resizeGripper', 'dataType': 'Kekule.Widget.ResizeGripper', 'serializable': false, 'setter': null, 'scope': PS.PRIVATE}
]);


})();
