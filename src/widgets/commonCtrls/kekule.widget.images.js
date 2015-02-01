/**
 * @fileoverview
 * Implementation of image related widgets.
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

var EU = Kekule.HtmlElementUtils;
var CNS = Kekule.Widget.HtmlClassNames;

/**
 * An widget to display a small image.
 * The image is actually set by CSS background property. CSS style can is setted by
 * different imgInfo properties (including normalInfo, hoverInfo and so on). All these
 * info hash can has the following fields:
 *   {
 *     className: class name add to element in the state.
 *     src: background image url.
 *     position: background position.
 *     repeat: background repeat style.
 *   }
 * @class
 * @augments Kekule.Widget.BaseWidget
 *
 * @property {Hash} normalInfo Infomation to draw glyph in normal state.
 * @property {Hash} focusedInfo Infomation to draw glyph in focus state.
 * @property {Hash} hoverInfo Infomation to draw glyph in hover state.
 * @property {Hash} activeInfo Infomation to draw glyph in active state.
 * @property {Hash} disabledInfo Infomation to draw glyph in disabled state.
 */
Kekule.Widget.Glyph = Class.create(Kekule.Widget.BaseWidget,
/** @lends Kekule.Widget.Glyph# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.Glyph',
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument, normalImgInfo)
	{
		this._imgElem = null;  // used internally
		$super(parentOrElementOrDocument);
		if (normalImgInfo)
			this.setNormalInfo(normalImgInfo);
	},
	/** @private */
	initProperties: function()
	{
		/*
		this.defineProp('src', {'dataType': DataType.STRING, 'serializable': false,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('src', value);
				this.getStyle().backgroundImage = value? 'url(' + value + ')': '';
			}
		});
		this.defineElemAttribMappingProp('spritePosition', 'backgroundPosition');
		*/
		/*
		this.defineProp('autoHide', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('autoHide', value);

			}
		});
		*/
		this.defineImgInfoProp('normalInfo', {'dataType': DataType.HASH});
		this.defineImgInfoProp('hoverInfo', {'dataType': DataType.HASH});
		this.defineImgInfoProp('focusedInfo', {'dataType': DataType.HASH});
		this.defineImgInfoProp('activeInfo', {'dataType': DataType.HASH});
		this.defineImgInfoProp('disabledInfo', {'dataType': DataType.HASH});
	},
	defineImgInfoProp: function(propName, options)
	{
		var ops = Object.extend({
			'setter': function(value)
			{
				if (value)
					this.setPropStoreFieldValue(propName, Object.extend({}, value));
				else
					this.setPropStoreFieldValue(propName, null);
				this.imgInfoChanged();
			}
		}, options);
		return this.defineProp(propName, ops);
	},
	/** @ignore */
	doGetWidgetClassName: function()
	{
		return 'K-Glyph';
	},
	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('span');
		return result;
	},
	/** @ignore */
	doBindElement: function($super, element)
	{
		$super();
		this.createImgContainer(element);
	},
	/** @ignore */
	createImgContainer: function(parentElem, imgInfo)
	{
		var doc = parentElem.ownerDocument;
		this._imgElem = doc.createElement('span');
		this._imgElem.className = CNS.FULLFILL;
		parentElem.innerHTML = '';
		parentElem.appendChild(this._imgElem);
	},

	/** @ignore */
	imgInfoChanged: function()
	{
		this.updateImg();
	},

	/** @ignore */
	stateChanged: function($super)
	{
		$super();
		this.updateImg();
	},
	/** @private */
	updateImg: function()
	{
		var WS = Kekule.Widget.State;
		var state = this.getState();
		var imgInfo =
			(state === WS.DISABLED)? this.getDisabledInfo():
			(state === WS.ACTIVE)? this.getActiveInfo() || this.getHoverInfo() || this.getFocusedInfo():
			(state === WS.HOVER)? this.getHoverInfo():
			(state === WS.FOCUSED)? this.getFocusedInfo():
			this.getNormalInfo();
		imgInfo = imgInfo || this.getNormalInfo();
		/*
		var imgInfo =
			(!this.getEnabled()? this.getDisabledInfo():
			this.getIsActive()? this.getActiveInfo():
			this.getIsHover()? this.getHoverInfo():
			this.getIsFocused()? this.getFocusedInfo():
			this.getNormalInfo())
				|| this.getNormalInfo();
		*/
		this.showImgOfInfo(imgInfo);
	},
	/** @private */
	showImgOfInfo: function(imgInfo)
	{
		var elem = this._imgElem;
		if (elem)
		{
			if (imgInfo)
			{
				if (imgInfo.className)
				{
					elem.className = CNS.FULLFILL;
					EU.addClass(elem, imgInfo.className);
				}
				else
					elem.className = CNS.FULLFILL;

				elem.style.backgroundImage = imgInfo.src? 'url(' + imgInfo.src + ')': '';
				elem.style.backgroundPosition = imgInfo.position || '';
				elem.style.backgroundRepeat = imgInfo.repeat || 'no-repeat';
			}
			else
				elem.style.backgroundImage = '';
		}
	}
});

})();