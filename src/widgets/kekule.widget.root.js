/**
 * @fileoverview
 * Root of Kekule widget namespace.
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

"use strict";

/**
 * Namespace for UI Widgets.
 * @namespace
 */
Kekule.Widget = {
	/** @private */
	DEF_EVENT_HANDLER_PREFIX: 'react_',
	/** @private */
	getEventHandleFuncName: function(eventName)
	{
		return Kekule.Widget.DEF_EVENT_HANDLER_PREFIX + eventName;
	},
	/** @private */
	getTouchGestureHandleFuncName: function(touchGestureName)
	{
		//return Kekule.Widget.DEF_TOUCH_GESTURE_HANDLER_PREFIX + touchGestureName;
		return Kekule.Widget.DEF_EVENT_HANDLER_PREFIX + touchGestureName;
	}
};



})();