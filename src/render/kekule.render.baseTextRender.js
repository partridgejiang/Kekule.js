/**
 * @fileoverview
 * An abstract implementation of a rich text drawer.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.utils.js
 * requires /render/kekule.render.base.js
 * requires /render/kekule.render.utils.js
 * requires /render/kekule.render.configs.js
 */

(function ()
{

var RT = Kekule.Render.RichText;
var RTU = Kekule.Render.RichTextUtils;
var TD = Kekule.Render.TextDirection;
var TDU = Kekule.Render.TextDrawUtils;
var TA = Kekule.Render.TextAlign;

/**
 * Different renderer should provide different methods to draw text.
 * Those different implementations are wrapped in draw bridge classes.
 * Concrete bridge classes do not need to deprived from this class, but they
 * do need to implement all those essential methods.
 *
 * NOTE: Methods of the bridge (measureText, drawText, etc.) only need to handle
 * left to right text.
 * @class
 */
Kekule.Render.AbstractTextDrawBridge = Class.create(
/** @lends Kekule.Render.AbstractTextDrawBridge# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.AbstractTextDrawBridge',
	/**
	 * Draw a plain text on context.
	 * @param {Object} context
	 * @param {Object} coord The top left coord to draw text.
	 * @param {Object} text
	 * @param {Object} options Draw options, may contain the following fields:
	 * 	 {fontSize, fontFamily, color, rotation(based on coord)}
	 * @returns {Object} Null or element drawn on context.
	 */
	drawText: function(context, coord, text, options)
	{
		// do nothing here
		return null;
	},

	/**
	 * Indicate whether this bridge and context can measure text dimension before drawing it.
	 * HTML Canvas is a typical environment of this type.
	 * @param {Object} context
	 * @returns {Bool}
	 */
	canMeasureText: function(context)
	{
		return false;
	},
	/**
	 * Mearsure the width and height of text on context before drawing it.
	 * @param {Object} context
	 * @param {Object} text
	 * @param {Object} options
	 * @returns {Hash} An object with width and height fields.
	 */
	measureText: function(context, text, options)
	{
		// do nothing here
		return {};
	},

	/**
	 * Indicate whether this bridge and context can measure text dimension before drawing it.
	 * Raphael is a typical environment of this type.
	 * Such a bridge must also has the ability to modify text pos after drawn.
	 * @param {Object} context
	 * @returns {Bool}
	 */
	canMeasureDrawnText: function(context)
	{
		return false;
	},
	/**
	 * Mearsure the width and height of text on context after drawing it.
	 * @param {Object} context
	 * @param {Object} textElem Drawn text element on context.
	 * @param {Object} options
	 * @returns {Hash} An object with width and height fields, top and left is optional.
	 */
	measureDrawnText: function(context, textElem, options)
	{
		return {};
	},

	/**
	 * Indicate whether this bridge and context can change text content or position after drawing it.
	 * Raphael is a typical environment of this type.
	 * @param {Object} context
	 * @returns {Bool}
	 */
	canModifyText: function(context)
	{
		return false;
	},
	/**
	 * Change text drawn on context to a new coord. Not all context can apply this action.
	 * @param {Object} context
	 * @param {Object} textElem
	 * @param {Hash} newCoord The top left coord of text box.
	 */
	modifyDrawnTextCoord: function(context, textElem, newCoord)
	{
		// do nothing here
	},

	/**
	 * Create a group to store render elements. Descendants or bridge should override this method.
	 * Note that not all bridge (like canvas) support group.
	 * @param {Object} context
	 * @returns {Object}
	 */
	createGroup: function(context)
	{

	},
	/**
	 * Add an element to an existing group. Descendants or bridge should override this method.
	 * @param {Object} elem
	 * @param {Object} group
	 */
	addToGroup: function(elem, group)
	{

	},
	/**
	 * Remove an element to from existing group. Descendants or bridge should override this method.
	 * @param {Object} elem
	 * @param {Object} group
	 */
	removeFromGroup: function(elem, group)
	{

	}
});

/**
 * A base and abstract rich text drawer class.
 * @class
 * @augments ObjectEx
 * @param {Object} bridge Text draw bridge used.
 * @param {Hash} options Options to draw text.
 * @param {Object} drawConfigs instance of {@link Kekule.Render.Render2DConfigs}.
 * //  If not set, the singleton instance of Kekule.Render.Render2DConfigs will be used.
 */
Kekule.Render.BaseRichTextDrawer = Class.create(ObjectEx,
/** @lends Kekule.Render.BaseRichTextDrawer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.BaseRichTextDrawer',
	/** @private */
	ITEM_PARENT_FIELD: '__$parent__',
	/** @construct */
	initialize: function($super, bridge, options, drawConfigs)
	{
		$super();
		//this.paper = paper || null;
		this.options = options || {};

		if (bridge)
			this.setDrawBridge(bridge);

		if (drawConfigs)
			this.setDrawConfigs(drawConfigs);
	},
	/** @private */
	initProperties: function()
	{
		// private properties
		this.defineProp('drawBridge', {'dataType': 'Kekule.Render.AbstractTextDrawBridge', 'serializable': false});
		this.defineProp('drawConfigs', {'dataType': 'Kekule.Render.Render2DConfigs', 'serializable': false});
	},

	/**
	 * Fill this.options from a standard render config object (instance of {@link Kekule.Render.Render2DConfigs}).
	 * @param {Kekule.Render.Render2DConfigs} renderConfig
	 * @private
	 */
	fillOptions: function(renderConfig)
	{
		if (renderConfig)
		{
			var textFontConfig = renderConfig.getTextFontConfigs();
			var options = this.options;
			options.supFontSizeRatio = textFontConfig.getSupFontSizeRatio();
			options.subFontSizeRatio = textFontConfig.getSubFontSizeRatio();
			options.superscriptOverhang = textFontConfig.getSuperscriptOverhang();
			options.subscriptOversink = textFontConfig.getSubscriptOversink();

			options.textCharDirection = textFontConfig.getTextCharDirection();
			options.textLineDirection = textFontConfig.getTextLineDirection();
			options.textHorizontalAlign = textFontConfig.getTextHorizontalAlign();
			options.textVerticalAlign = textFontConfig.getTextVerticalAlign();
			options.textBoxXAlignment = textFontConfig.getTextBoxXAlignment();
			options.textBoxYAlignment = textFontConfig.getTextBoxYAlignment();
			options.textBoxAlignmentMode = textFontConfig.getTextBoxAlignmentMode();
		}
	},

	/**
	 * Make a deep clone of src rich text.
	 * @param {Object} src
	 * @returns {Object} Rich text cloned.
	 * @private
	 */
	cloneRichText: function(src)
	{
		return Kekule.Render.RichTextUtils.clone(src);
	},

	/** private */
	_FONT_OPTION_FIELDS: ['fontSize', 'fontFamily', 'fontWeight', 'fontStyle',
		'color', 'overhang', 'oversink', 'opacity', 'zoom'],
	/** @private */
	_DRAW_OPTIONS_FIELDS: ['textType', 'charDirection', 'defaultCharDirection',
		'fontSize', 'fontFamily', 'fontWeight', 'fontStyle', 'color',
		'horizontalAlign', 'verticalAlign', 'zoom'],
	/**
	 * Get local draw options of a item.
	 * @param {Object} richTextItem
	 * @param {Hash} options
	 * @returns {Object}
	 * @private
	 */
	_fillLocalDrawOptions: function(richTextItem, options)
	{
		var result = options || {};
		var fieldCount = 0;
		for (var i = 0, l = this._DRAW_OPTIONS_FIELDS.length; i < l; ++i)
		{
			var prop = this._DRAW_OPTIONS_FIELDS[i];
			var value = richTextItem[prop];
			if (Kekule.ObjUtils.notUnset(value))
			{
				result[prop] = value;
				++fieldCount;
			}
		}
		if (Kekule.ObjUtils.isUnset(richTextItem.charDirection))  // char direction is regarded as default when not set in item
			result.charDirection = TD.DEFAULT;
		else if (richTextItem.charDirection === TD.INHERIT)
			result.charDirection = options.charDirection;
		return result;
	},

	// some extra information need to store in rich text for drawing.
	/** @private */
	/*
	BOUNDRECT_FIELD: '__boundRect__',
	ALIGNRECT_FIELD: '__alignRect__',
	*/
	/** @private */
	RECT_INFO_FIELD: '__rectInfo__',
	/** @private */
	ACTUAL_FONT_FIELD: '__drawFont__',
	/** @private */
	RENDER_TEXT_FIELD: '__renderText__',
	/** @private */
	RENDER_ELEM_FIELD: '__renderElem__',
	/** @private */
	LOCAL_DRAW_OPTIONS_FIELD: '__drawOptions__',
	/** @private */
	_setItemRectInfo: function(richTextItem, boundRect, alignRect)
	{
		/*
		richTextItem[this.BOUNDRECT_FIELD] = boundBox;
		richTextItem[this.ALIGNRECT_FIELD] = alignBox;
		*/
		richTextItem[this.RECT_INFO_FIELD] = {'boundRect': Object.extend({}, boundRect), 'alignRect': Object.extend({}, alignRect)};
	},
	/** @private */
	_getItemRectInfo: function(richTextItem)
	{
		/*
		var result = {
			'boundRect': richTextItem[this.BOUNDRECT_FIELD],
			'alignRect': richTextItem[this.ALIGNRECT_FIELD]
		};
		return result;
		*/
		return richTextItem[this.RECT_INFO_FIELD];
	},
	/** @private */
	_setActualFontInfo: function(richTextItem, info)
	{
		richTextItem[this.ACTUAL_FONT_FIELD] = info;
	},
	/** @private */
	_getActualFontInfo: function(richTextItem)
	{
		return richTextItem[this.ACTUAL_FONT_FIELD];
	},
	/** @private */
	_setRenderText: function(richTextItem, text)
	{
		richTextItem[this.RENDER_TEXT_FIELD] = text;
	},
	/** @private */
	_getRenderText: function(richTextItem)
	{
		return richTextItem[this.RENDER_TEXT_FIELD] || richTextItem.text;
	},
	/** @private */
	_setRenderElem: function(richTextItem, elem)
	{
		richTextItem[this.RENDER_ELEM_FIELD] = elem;
	},
	/** @private */
	_getRenderElem: function(richTextItem)
	{
		return richTextItem[this.RENDER_ELEM_FIELD];
	},
	/** @private */
	/*
	_setLocalDrawOptions: function(richTextItem, options)
	{
		richTextItem[this.LOCAL_DRAW_OPTIONS_FIELD] = options;
	},
	*/
	/** @private */
	/*
	_getLocalDrawOptions: function(richTextItem)
	{
		return richTextItem[this.LOCAL_DRAW_OPTIONS_FIELD];
	},
	*/

	/** @private */
	_itemHasNoAlignRect: function(richTextItem)
	{
		var result = Kekule.ObjUtils.notUnset(richTextItem._noAlignRect)?
			(!!richTextItem._noAlignRect):
			(RTU.isSubscript(richTextItem) || RTU.isSuperscript(richTextItem));
		return result;
	},

	// methods related to draw

	/**
		 * Draw a rich text on coordinate.
		 * @param {Object} context Context (canvas, SVG, VML, WebGL...) to draw.
		 * @param {Hash} coord
		 * @param {Object} richText Rich text object to draw.
		 * @param {Object} options Options to draw text.
		 *   Can have the following fields:
		 *   {
		 *     fontSize, fontFamily, charDirection,
		 *     horizontalAlign, verticalAlign,
		 *     textBoxXAlignment, textBoxYAlignment,
		 *     textBoxAlignmentMode
		 *   }
		 *   Note here textBoxAlignmentMode decide the alignment style,
		 *   BOX means alignment based on the whole box,
		 *   ANCHOR means textBoxXAlignment and textBoxYAlignment affect on the childmost anchor item of richtext.
		 * @param {Object} drawConfigs instance of {@link Kekule.Render.Render2DConfigs}. This param will override drawer's drawConfigs property.
		 * @returns {Object} A two fields object:
		 * 	 {
		 * 	   drawnObj: object on context that display the text. Can be null to some context (such as canvas).
		 *     boundRect: bound rectangle of text on context.
		 *   }
		 */
	drawEx: function(context, coord, richText, options, drawConfigs)
	{
		//this.fillOptions(drawConfigs || this.getDrawConfigs() || Kekule.Render.getRender2DConfigs());
		var ops;
		if (!options)
			ops = this.options;
		else
		{
			ops = Object.create(this.options || {});
			ops = Object.extend(ops, options);
		}

		if (!ops.defaultCharDirection)
			ops.defaultCharDirection = ops.charDirection;

		//console.log('draw rich text ex', richText, ops);

		//this.doPrepare(richText);
		// clone richtext to modify the object freely
		var destRichText = this.cloneRichText(richText);
		//destRichText = RTU.tidy(destRichText);

		var bridge = this.getDrawBridge();
		var drawMode = {
			delayDrawing: bridge.canMeasureText(), // calculate out all sub item's coord, then draw
			adjustDrawing: bridge.canModifyText() // draw first and then adjust position
		};

		this.doPrepare(context, coord, destRichText, ops, drawMode);

		var drawnObj = this.doRenderRichText(context, destRichText, ops, drawMode);
		var rect = this._getItemRectInfo(destRichText).boundRect;
		var result = {
			'drawnObj': drawnObj,
			'boundRect': rect
		};
		return result;
	},
	/**
		 * Draw a rich text on coordinate.
		 * @param {Object} context Context (canvas, SVG, VML, WebGL...) to draw.
		 * @param {Hash} coord
		 * @param {Object} richText Rich text object to draw.
		 * @param {Object} options Options to draw text.
		 *   Can have the following fields:
		 *   {
		 *     fontSize, fontFamily, charDirection,
		 *     horizontalAlign, verticalAlign,
		 *     textBoxXAlignment, textBoxYAlignment,
		 *     textBoxAlignmentMode
		 *   }
		 *   Note here textBoxAlignmentMode decide the alignment style,
		 *   BOX means alignment based on the whole box,
		 *   ANCHOR means textBoxXAlignment and textBoxYAlignment affect on the childmost anchor item of richtext.
		 * @param {Object} drawConfigs instance of {@link Kekule.Render.Render2DConfigs}. This param will override drawer's drawConfigs property.
		 * @returns {Object} Object drawed on screen.
		 */
	draw: function(context, coord, richText, options, drawConfigs)
	{
		return this.drawEx(context, coord, richText, options, drawConfigs).drawnObj;
	},

	/** @private */
	doPrepare: function(context, coord, richText, options, drawMode)
	{
		var result = this.doPrepareItem(context, richText, options, drawMode);

		// adjust prepared rects to coord
		var anchorAlignRect = null;
		if (options.textBoxAlignmentMode === Kekule.Render.TextBoxAlignmentMode.ANCHOR)
		{
			anchorAlignRect = this.doGetRootAnchorItemAbsAlignRect(richText);
		}

		var rectInfo = this._getItemRectInfo(richText);
		var delta;
		if (anchorAlignRect)
		{
			var newAnchorAlignRect = this.doAlignRectToCoord(coord, anchorAlignRect, options.textBoxXAlignment, options.textBoxYAlignment);
			delta = {'x': newAnchorAlignRect.left - anchorAlignRect.left, 'y': newAnchorAlignRect.top - anchorAlignRect.top};
		}
		else  // align to whole richText box or has no anchor item
		{
			var newAlignRect = this.doAlignRectToCoord(coord, rectInfo.alignRect, options.textBoxXAlignment, options.textBoxYAlignment);
			delta = {'x': newAlignRect.left - rectInfo.alignRect.left, 'y': newAlignRect.top - rectInfo.alignRect.top};
		}
		var alignRect = Kekule.RectUtils.shiftRect(rectInfo.alignRect, delta.x, delta.y);
		var boundRect = Kekule.RectUtils.shiftRect(rectInfo.boundRect, delta.x, delta.y);

		this._setItemRectInfo(richText, boundRect, alignRect);

		return result;
	},

	/** @private */
	doAlignRectToCoord: function(coord, rect, xAlignment, yAlignment)
	{
		var XA = Kekule.Render.BoxXAlignment;
		var YA = Kekule.Render.BoxYAlignment;
		var xAdjustRatio = (xAlignment === XA.RIGHT)? -1:
			(xAlignment === XA.CENTER)? -0.5:
			0;  // left
		var yAdjustRatio = (yAlignment === YA.TOP)? 0:
			(yAlignment === YA.CENTER)? -0.5:
			-1;  // bottom
		var result = Object.extend({}, rect);
		result.left = coord.x + result.width * xAdjustRatio;
		result.top = coord.y + result.height * yAdjustRatio;
		return result;
	},

	/** @private */
	doGetRootAnchorItemAbsAlignRect: function(richText)
	{
		var curr = richText;
		if (curr.anchorItem)  // has anchor item
		{
			var currRect = this._getItemRectInfo(curr).alignRect;
			var coord = {'x': currRect.left, 'y': currRect.top};
			while (curr.anchorItem)
			{
				curr = curr.anchorItem;
				currRect = this._getItemRectInfo(curr).alignRect;
				coord.x += currRect.left;
				coord.y += currRect.top;
			}
			return Kekule.RectUtils.createRect(coord.x, coord.y, currRect.width, currRect.height);
		}
		else  // no anchor item
			return null;
	},

	/** @private */
	doCalcActualDrawFontInfo: function(richTextItem, ops)
	{
		function _multipyFontSize(fontSize, times)
		{
			if (typeof(fontSize) === 'string')  // united string, like '10px'
			{
				var details = Kekule.StyleUtils.analysisUnitsValue(fontSize);
				details.value = Math.round(Math.max(details.value * times, 1));  // minimal 1px
				return '' + details.value + details.units;
				//return Kekule.StyleUtils.multiplyUnitsValue(fontSize, times);
			}
			else  // integer
				return fontSize * times;
		}
		/*
		var result = {
			'fontFamily': ops.fontFamily, 'fontSize': ops.fontSize, 'sizeScale': 1,
			'fontWeight': ops.fontWeight, 'fontStyle': ops.fontStyle,
			'overhang': ops.overhang, 'oversink': ops.oversink, 'color': ops.color,
		};
		*/
		//var result = {'sizeScale': 1};
		var result = {'sizeScale': 1};
		for (var i = 0, l = this._FONT_OPTION_FIELDS.length; i < l; ++i)
		{
			var prop = this._FONT_OPTION_FIELDS[i];
			if (Kekule.ObjUtils.notUnset(ops[prop]))
				result[prop] = ops[prop];
		}

		//console.log(result, ops);

		if (Kekule.ObjUtils.notUnset(ops.zoom))
		{
			result.fontSize = _multipyFontSize(result.fontSize, ops.zoom || 1);
		}

		if (RTU.isSuperscript(richTextItem))
		{
			result.sizeScale = ops.supFontSizeRatio;
			//result.fontSize *= ops.supFontSizeRatio;
			result.fontSize = _multipyFontSize(result.fontSize, ops.supFontSizeRatio);
			result.isSup = true;
			if (Kekule.ObjUtils.isUnset(result.overhang))
				result.overhang = ops.superscriptOverhang || 0;
		}
		else if (RTU.isSubscript(richTextItem))
		{
			result.sizeScale = ops.subFontSizeRatio;
			//result.fontSize *= ops.subFontSizeRatio;
			result.fontSize = _multipyFontSize(result.fontSize, ops.subFontSizeRatio);
			result.isSub = true;
			if (Kekule.ObjUtils.isUnset(result.oversink))
				result.oversink = ops.subscriptOversink || 0;
		}

		return result;
	},

	/** @private */
	doPrepareItem: function(context, item, options, drawMode)
	{
		var itemType = RTU.getItemType(item);

		// get the actual draw options on item
		var ops = Object.create(options);
		ops = this._fillLocalDrawOptions(item, ops);
		if (ops.charDirection === TD.DEFAULT || Kekule.ObjUtils.isUnset(ops.charDirection))  // default char direction
		{
			ops.charDirection = ops.defaultCharDirection;
		}

		var result;
		switch (itemType)
		{
			case RT.SECTION: result = this.doPrepareSection(context, item, ops, drawMode); break;
			case RT.LINES: result = this.doPrepareLines(context, item, ops, drawMode); break;
			default: result = this.doPrepareGroup(context, item, ops, drawMode); break; // group or seq
		}
		return result;
	},

	/**
	 * Get section information for drawing and store it in section object.
	 * @private
	 */
	doPrepareSection: function(context, section, drawOptions, drawMode)
	{
		var bridge = this.getDrawBridge();

		// get actual draw font info
		var actualFontInfo = this.doCalcActualDrawFontInfo(section, drawOptions);
		//console.log('actualFonrInfo', actualFontInfo);
		this._setActualFontInfo(section, actualFontInfo);

		//this._setLocalDrawOptions(item, drawOptions);

		// prepare text for drawing
		var text = section.text;

		if (TDU.isVerticalLine(drawOptions.charDirection) && (text.length > 1))  // insert '\n' after each char in vertical line: can not use for HTML5 canvas
		{
			//text = text.toCharArray().join('\n');
			// a work-around: turn current section into a group with multiple char sections
			var group = section;
			group.role = 'group';
			delete group.text;
			group.charDirection = drawOptions.charDirection;
			var newDrawOptions = Object.create(drawOptions);
			newDrawOptions = Object.extend(newDrawOptions, actualFontInfo);
			//group.horizontalAlign = TA.CENTER;
			group.items = [];
			for (var i = 0, l = text.length; i < l; ++i)
			{
				RTU.appendText(group, text.charAt(i));
			}
			// force to prepare this group again
			return this.doPrepareItem(context, group, newDrawOptions, drawMode);
		}

		//if ((drawOptions.charDirection == TD.RTL) || (drawOptions.charDirection == TD.BTT)) // reversed direction, reverse text first and turn it into normal direction
		if (drawOptions.charDirection === TD.RTL)
		{
			text = text.reverse();
			//console.log('RTL, reverse', text.reverse());
		}

		this._setRenderText(section, text);

		var textDimension;
		if (drawMode.delayDrawing)  // delay draw, calculate text box first
		{
			textDimension = bridge.measureText(context, text, actualFontInfo);
		}
		else /*if (drawMode.adjustDrawing)*/  // draw section text in hidden place first and then calculate
		{
			var offScreenCoord = {'x': -10000, 'y': -10000};
			var drawElem = this.getDrawBridge().drawText(context, offScreenCoord, text, actualFontInfo);
			this._setRenderElem(section, drawElem);
			textDimension = bridge.measureDrawnText(context, drawElem, actualFontInfo);
		}

		var sectionRect = {'left': 0, 'top': 0, 'width': textDimension.width || 0, 'height': textDimension.height || 0};
		this._setItemRectInfo(section, sectionRect, sectionRect);  // a single section actually do not need alignBox
	},

	/** @private */
	doPrepareLines: function(context, group, drawOptions, drawMode)
	{
		//console.log('prepare lines');
		var charDirection = drawOptions.charDirection || TD.DEFAULT; // explicitly set to default
		var items = group.items;
		// line direction is calculated from charDirection
		var lineDirection = (charDirection === TD.TTB)? TD.RTL:
			(charDirection === TD.BTT)? TD.LTR:
			TD.TTB;	//((charDirection === TD.LTR) || (charDirection === TD.RTL))
		// copy char direction to child items explicitly, since we will change charDirection of group later
		for (var i = 0, l = items.length; i < l; ++i)
		{
			var item = items[i];
			if (!item.charDirection)
				item.charDirection = charDirection;
		}
		group.charDirection = lineDirection;
		drawOptions.charDirection = lineDirection;
		drawOptions._originCharDirection = charDirection;  // save the old direction for group prepare

		return this.doPrepareGroup(context, group, drawOptions, drawMode);
	},

	/** @private */
	doPrepareGroup: function(context, group, drawOptions, drawMode)
	{
		// prepare each items first to get basic dimension information
		var items = group.items;
		/*
		if (items.length <= 0)    // items.length should large than 1
			return null;
		*/

		for (var i = 0, l = items.length; i < l; ++i)
		{
			var item = items[i];
			this.doPrepareItem(context, item, drawOptions, drawMode);
		}

		// then adjust each item's position
		var direction = drawOptions.charDirection || TD.DEFAULT;
		var charDirection = drawOptions._originCharDirection || direction;
		var isHorizontalLine = TDU.isHorizontalLine(direction);

		var priDirCoord = isHorizontalLine? 'x': 'y';  // primary direction coord label
		var secDirCoord = isHorizontalLine? 'y': 'x';  // secondary direction coord label
		// assume base line is at 0 axis of secDirection
		var secDirAdjustRatio;
		var hAlign = TA.getAbsAlign(drawOptions.horizontalAlign, charDirection);
		var vAlign = TA.getAbsAlign(drawOptions.verticalAlign, charDirection);

		/*
		// debug
		if (hAlign !== drawOptions.horizontalAlign)
		{
			console.log('calc abs align', hAlign, drawOptions.horizontalAlign, charDirection, group);
		}
		else
			console.log('normal align', hAlign, direction, group);
		*/

		if (isHorizontalLine)
		{
			secDirAdjustRatio = (vAlign == TA.TOP)? 0:
				(vAlign == TA.CENTER)? -0.5:
				-1;  // Bottom
		}
		else
		{
			secDirAdjustRatio = (hAlign == TA.RIGHT)? -1:
				(hAlign == TA.CENTER)? -0.5:
				0;  // left, default
		}

		// adjust each item's box
		var offset = {'x': 0, 'y': 0};
		var priDirFactor = ((direction === TD.RTL) || (direction === TD.BTT))? -1: 1;
		var priDimensionDir = isHorizontalLine? 'left': 'top';
		var secDimensionDir = isHorizontalLine? 'top': 'left';
		var supSubItems = [];
		for (var i = 0, l = items.length; i < l; ++i)
		{
			var item = items[i];
			var rectInfo = this._getItemRectInfo(item);
			//console.log('rectInfo', rectInfo, item);
			var boundRect = rectInfo.boundRect;
			var alignRect = rectInfo.alignRect;

			// position in primary direction is easy to calculate, just sum up, by boundRect
			if (priDirFactor > 0)  // LTR or TTB
			{
				var deltaPriDir = offset[priDirCoord] - boundRect[priDimensionDir];
				boundRect[priDimensionDir] = offset[priDirCoord];
				//alignRect[priDimensionDir] = offset[priDirCoord];
				alignRect[priDimensionDir] += deltaPriDir;
			}

			var dimension = {'x': boundRect.width, 'y': boundRect.height};
			offset[priDirCoord] += dimension[priDirCoord] * priDirFactor;

			if (priDirFactor < 0)  // RTL or BTT
			{
				var deltaPriDir = offset[priDirCoord] - boundRect[priDimensionDir];
				boundRect[priDimensionDir] = offset[priDirCoord];
				//alignRect[priDimensionDir] = offset[priDirCoord];
				alignRect[priDimensionDir] += deltaPriDir;
			}

			// calc secondary adjustment, by AlignRect super or subscript should handle separately
			var dimension = {'x': alignRect.width, 'y': alignRect.height};
			var fontInfo = this._getActualFontInfo(item);
			if (fontInfo)
				isSupSub = fontInfo.isSup || fontInfo.isSub;
			else
				isSupSub = false;
			if (isSupSub && RTU.getActualRefItem(item, group))  // is sub/sup and has refItem, handle separately
			{
				supSubItems.push(item);
			}
			else
			{
				var oversink = fontInfo? (fontInfo.oversink || (-(fontInfo.overhang || 0))): 0;
				if (!isHorizontalLine)  // vertical line oversink should be at the left of base line
					oversink = -oversink;
				var secDirPos = dimension[secDirCoord] * (secDirAdjustRatio + oversink);
				var delta = alignRect[secDimensionDir] - secDirPos;
				alignRect[secDimensionDir] = secDirPos;
				boundRect[secDimensionDir] -= delta;
			}
		}

		// handle remaining sup/sub items' secDirection pos
		for (var i = 0, l = supSubItems.length; i < l; ++i)
		{
			var item = supSubItems[i];
			var refItem = RTU.getActualRefItem(item, group);
			var fontInfo = this._getActualFontInfo(item);
			var rectInfo = this._getItemRectInfo(item);
			var refRect = this._getItemRectInfo(refItem).alignRect;
			var boundRect = rectInfo.boundRect;
			var alignRect = rectInfo.alignRect;

			if (fontInfo.isSup)  // superscript, align to refItem's top/right, and consider the overhang
			{
				var overhang = fontInfo.overhang;
				if (isHorizontalLine)  // adjust top pos
				{
					alignRect.top = refRect.top;  // alignRect will not consider overhang
					alignRect.height = refRect.height;  // and assume has the same height of refItem
					boundRect.top = refRect.top - refRect.height * overhang;
				}
				else // vertical line, adjust left pos
				{
					alignRect.left = refRect.left;  // + refRect.width - boundRect.left;
					alignRect.width = refRect.width;
					//boundRect.left = alignRect.left + refRect.width * overhang;
					boundRect.left = refRect.lefy + refRect.width - boundRect.left + refRect.width * overhang;
				}
			}
			else /* if (fontInfo.isSub) */
			{
				var oversink = fontInfo.oversink;
				if (isHorizontalLine)  // adjust top pos
				{
					alignRect.top = refRect.top; // alignRect will not consider oversink + refRect.height - boundRect.height;
					alignRect.height = refRect.height;
					//boundRect.top = alignRect.top + refRect.height * oversink;
					boundRect.top = refRect.top + refRect.height - boundRect.height + refRect.height * oversink;
				}
				else  // vertical line, adjust left pos
				{
					alignRect.left = refRect.left;
					alignRect.width = refRect.width;
					boundRect.left = refRect.left - refRect.width * oversink;
				}
			}
		}

		// sum up and calculate the group's alignRect and boundRect
		var items = group.items;
		var gAlignRect = null;
		var gBoundRect = null;
		for (var i = 0, l = items.length; i < l; ++i)
		{
			var item = items[i];
			rectInfo = this._getItemRectInfo(item);

			if ((!this._itemHasNoAlignRect(item))
				|| ((!gAlignRect) && (i == l - 1)))  // if iterate to last item, gAlignRect is still not set, then the last item will decide the alignRect regardless of _noAlignRect setting of item
			{
				if (!gAlignRect)
					gAlignRect = Object.extend({}, rectInfo.alignRect);
				else
					gAlignRect = Kekule.RectUtils.getContainerRect(gAlignRect, rectInfo.alignRect);
			}
			//else
			//	console.log('noAlign');
			if (!gBoundRect)
				gBoundRect = Object.extend({}, rectInfo.boundRect);
			else
				gBoundRect = Kekule.RectUtils.getContainerRect(gBoundRect, rectInfo.boundRect);
		}

		if (items.length <= 0)  // no child item, gAlignRect/gBoundRect need to be set manually
		{
			gAlignRect = Kekule.RectUtils.createRect(0, 0, 0, 0);
			gBoundRect = Kekule.RectUtils.createRect(0, 0, 0, 0);
		}

		// Standard group rect, make alignRect.top/left = 0, adjust children's rects correspondingly
		var delta = {'x': -gAlignRect.left, 'y': -gAlignRect.top};
		if ((delta.x !== 0) || (delta.y !== 0))
		{
			for (var i = 0, l = items.length; i < l; ++i)
			{
				rectInfo = this._getItemRectInfo(items[i]);
				rectInfo.alignRect = Kekule.RectUtils.shiftRect(rectInfo.alignRect, delta.x, delta.y);
				rectInfo.boundRect = Kekule.RectUtils.shiftRect(rectInfo.boundRect, delta.x, delta.y);
			}
			gAlignRect.left = 0;
			gAlignRect.top = 0;
			gBoundRect.left += delta.x;
			gBoundRect.top += delta.y;
		}

		this._setItemRectInfo(group, gBoundRect, gAlignRect);
	},

	/** @private */
	doRenderRichText: function(context, richText, options, drawMode)
	{
		var bridge = this.getDrawBridge();
		var drawGroup = bridge.createGroup(context);
		// find all items in richText, calculate their absolute coords and draw texts
		this.doRenderItem(context, {'x': 0, 'y': 0}, richText, drawMode, drawGroup);
		return drawGroup;
	},

	/** @private */
	doRenderItem: function(context, baseCoord, item, drawMode, drawGroup)
	{
		var itemType = RTU.getItemType(item);

		var result;
		switch (itemType)
		{
			case RT.SECTION: result = this.doRenderSection(context, baseCoord, item, drawMode, drawGroup); break;
			default: result = this.doRenderGroup(context, baseCoord, item, drawMode, drawGroup); break; // group or seq
		}
		return result;
	},

	/** @private */
	doRenderGroup: function(context, baseCoord, group, drawMode, drawGroup)
	{
		var items = group.items;  // items.length should large than 1
		if (items.length <= 0)
			return null;

		var groupRectInfo = this._getItemRectInfo(group);
		var shiftCoord = {'x': baseCoord.x + groupRectInfo.alignRect.left, 'y': baseCoord.y + groupRectInfo.alignRect.top};

		// debug
		/*
		var rect = this._getItemRectInfo(group).alignRect;
		context.strokeStyle = '#0c0';
		context.strokeRect(baseCoord.x, baseCoord.y, rect.width, rect.height);
		var rect = this._getItemRectInfo(group).boundRect;
		context.strokeStyle = '#cc0';
		context.strokeRect(baseCoord.x + rect.left, baseCoord.y + rect.top, rect.width, rect.height);
		*/

		for (var i = 0, l = items.length; i < l; ++i)
			this.doRenderItem(context, shiftCoord, items[i], drawMode, drawGroup);
	},

	/** @private */
	doRenderSection: function(context, baseCoord, item, drawMode, drawGroup)
	{
		var rectInfo = this._getItemRectInfo(item);
		var boundRect = rectInfo.boundRect;
		var absCoord = {'x': boundRect.left, 'y': boundRect.top};
		absCoord = Kekule.CoordUtils.add(absCoord, baseCoord);

		//var drawOptions = this._getLocalDrawOptions(item);
		var text = this._getRenderText(item);
		var fontInfo = this._getActualFontInfo(item);

		var bridge = this.getDrawBridge();
		var textElem;
		if (drawMode.delayDrawing)
		{
			textElem = bridge.drawText(context, absCoord, text, fontInfo);
			// debug
			//context.strokeRect(absCoord.x, absCoord.y, boundRect.width, boundRect.height);
		}
		else if (drawMode.adjustDrawing)
		{
			textElem = this._getRenderElem(item);
			bridge.modifyDrawnTextCoord(context, textElem, absCoord);
		}
		bridge.addToGroup(textElem, drawGroup);
	}
});

})();