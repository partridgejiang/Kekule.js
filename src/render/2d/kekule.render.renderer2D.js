/**
 * @fileoverview
 * A default implementation of 2D molecule renderer.
 * @author Partridge Jiang
 */

/*
 * requires /core/kekule.common.js
 * requires /utils/kekule.utils.js
 * requires /core/kekule.structures.js
 * requires /core/kekule.reactions.js
 * requires /render/kekule.render.base.js
 * requires /render/kekule.render.utils.js
 * requires /render/kekule.baseTextRender.js
 * requires /localization/
 */

(function()
{

var RT = Kekule.Render.BondRenderType;
var D = Kekule.Render.TextDirection;
var BU = Kekule.BoxUtils;
var BO = Kekule.BondOrder;
var oneOf = Kekule.oneOf;

/**
 * Different renderer should provide different methods to draw element on context.
 * Those different implementations are wrapped in draw bridge classes.
 * Concrete bridge classes do not need to deprived from this class, but they
 * do need to implement all those essential methods.
 *
 * In all drawXXX methods, parameter options contains the style information to draw stroke or fill.
 * It may contain the following fields:
 *   {
 *     strokeWidth: Int, in pixel
 *     strokeColor: String, '#rrggbb'
 *     strokeDash: Bool, whether draw a dash line.
 *     fillColor: String, '#rrggbb'
 *     opacity: Float, 0-1
 *   }
 *
 * In all drawXXX methods, coord are based on context (not directly on screen).
 *
 * @class
 */
Kekule.Render.Abstract2DDrawBridge = Class.create(
/** @lends Kekule.Render.Abstract2DDrawBridge# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.Abstract2DDrawBridge',

	/**
	 * Create a context element for drawing.
	 * @param {Element} parentElem
	 * //@param {Int} contextOffsetX X coord of top-left corner of context, in px.
	 * //@param {Int} contextOffsetY Y coord of top-left corner of context, in px.
	 * @param {Int} width Width of context, in px.
	 * @param {Int} height Height of context, in px.
	 * @returns {Object} Context used for drawing.
	 */
	createContext: function(parentElem, width, height)
	{
		return null;
	},
	/**
	 * Destroy context created.
	 * @param {Object} context
	 */
	releaseContext: function(context)
	{

	},

	/**
	 * Get width and height of context.
	 * @param {Object} context
	 * @returns {Hash} {width, height}
	 */
	getContextDimension: function(context)
	{
		return {};
	},

	/**
	 * Set new width and height of context.
	 * @param {Object} context
	 * @param {Int} width
	 * @param {Int} height
	 */
	setContextDimension: function(context, width, height)
	{
		return null;
	},

	/**
	 * Get context related element.
	 * @param {Object} context
	 */
	getContextElem: function(context)
	{

	},

	/**
	 * Set the view box of context. This method will also change context dimension to w/h if param changeDimension is not false.
	 * @param {Object} context
	 * @param {Int} x Top left x coord.
	 * @param {Int} y Top left y coord.
	 * @param {Int} w Width.
	 * @param {Int} h Height.
	 * @param {Bool} changeDimension
	 */
	setContextViewBox: function(context, x, y, w, h, changeDimension)
	{

	},

	/**
	 * Clear the whole context.
	 * @param {Object} context
	 */
	clearContext: function(context)
	{
		return null;
	},
	/**
	 * Set background color of content.
	 * @param {Object} context
	 * @param {String} color Color in '#RRGGBB' mode. Null means transparent.
	 */
	setClearColor: function(context, color)
	{

	},

	/**
	 * Transform a context based coord to screen based one (usually in pixel).
	 * @param {Object} context
	 * @param {Hash} coord
	 * @return {Hash}
	 */
	transformContextCoordToScreen: function(context, coord)
	{
		return coord;
	},
	/**
	 * Transform a screen based coord to context based one.
	 * @param {Object} context
	 * @param {Hash} coord
	 * @return {Hash}
	 */
	transformScreenCoordToContext: function(context, coord)
	{
		return coord;
	},

	/**
	 * Indicate whether this bridge and context can change glyph content or position after drawing it.
	 * Raphael is a typical environment of this type while canvas should returns false.
	 * @param {Object} context
	 * @returns {Bool}
	 */
	canModifyGraphic: function(context)
	{
		return false;
	},
	/**
	 * Use SVG style path object to draw a path on context.
	 * @param {Object} context
	 * @param {Object} path
	 * @param {Hash} options
	 * @returns {Object} Element drawn on context
	 */
	drawPath: function(context, path, options)
	{

	},
	/**
	 * Draw a line on context.
	 * @param {Object} context
	 * @param {Hash} coord1
	 * @param {Hash} coord2
	 * @param {Hash} options
	 * @returns {Object} Element drawn on context
	 */
	drawLine: function(context, coord1, coord2, options)
	{

	},
	/**
	 * Draw a triangle on context.
	 * @param {Object} context
	 * @param {Hash} coord1
	 * @param {Hash} coord2
	 * @param {Hash} coord3
	 * @param {Hash} options
	 * @returns {Object} Element drawn on context
	 */
	drawTriangle: function(context, coord1, coord2, coord3, options)
	{

	},
	/**
	 * Draw a rectangle on context.
	 * @param {Object} context
	 * @param {Hash} coord1
	 * @param {Hash} coord2
	 * @param {Hash} options
	 * @returns {Object} Element drawn on context
	 */
	drawRect: function(context, coord1, coord2, options)
	{

	},
	/**
	 * Draw a round corner rectangle on context.
	 * @param {Object} context
	 * @param {Hash} coord1
	 * @param {Hash} coord2
	 * @param {Number} cornerRadius
	 * @param {Hash} options
	 * @returns {Object} Element drawn on context
	 */
	drawRoundRect: function(context, coord1, coord2, cornerRadius, options)
	{

	},
	/**
	 * Draw a cirle on context.
	 * @param {Object} context
	 * @param {Hash} baseCoord
	 * @param {Number} radius
	 * @param {Hash} options
	 * @returns {Object} Element drawn on context
	 */
	drawCircle: function(context, baseCoord, radius, options)
	{

	},
	/**
	 * Draw an image on context
	 * @param {Object} context
	 * @param {String} src Src url of image.
	 * @param {Hash} baseCoord
	 * @param {Hash} size Target size ({x, y} of drawing image.
	 * @param {Hash} options
	 * @param {Function} callback Since image may need to be loaded from src on net,
	 *   this method may draw concrete image on context async. When the draw job
	 *   is done or failed, callback(success) will be called.
	 * @returns {Object} Element drawn on context
	 */
	drawImage: function(context, src, baseCoord, size, options, callback)
	{

	},
	/**
	 * Draw the content of an image element on context
	 * @param {Object} context
	 * @param {HTMLElement} imgElem Source image element.
	 * @param {Hash} baseCoord
	 * @param {Hash} size Target size ({x, y} of drawing image.
	 * @param {Hash} options
	 * @returns {Object} Element drawn on context
	 */
	drawImageElem: function(context, imgElem, baseCoord, size, options)
	{

	},
	/**
	 * Create a nested structure on context.
	 * @param {Object} context
	 * @returns {Object}
	 */
	createGroup: function(context)
	{
		return null;
	},
	/**
	 * Ad an drawn element to group.
	 * @param {Object} elem
	 * @param {Object} group
	 */
	addToGroup: function(elem, group)
	{

	},
	/**
	 * Remove an element from group.
	 * @param {Object} elem
	 * @param {Object} group
	 */
	removeFromGroup: function(elem, group)
	{

	},

	/**
	 * Remove an element in context.
	 * @param {Object} context
	 * @param {Object} elem
	 */
	removeDrawnElem: function(context, elem)
	{

	},

	/**
	 * Export drawing content to a data URL for <img> tag to use.
	 * @param {Object} context
	 * @param {String} dataType Type of image data, e.g. 'image/png'.
	 * @param {Hash} options Export options, usually this is a number between 0 and 1
	 *   indicating image quality if the requested type is image/jpeg or image/webp.
	 * @returns {String}
	 */
	exportToDataUri: function(context, dataType, options)
	{

	}
});


/**
 * A base implementation of 2D chem object renderer.
 * You can call renderer.draw(context, chemObj, baseCoord, options) to draw the 2D structure,
 * where options can contain the settings of drawing style (strokeWidth, color...) and tranform params
 * (including scale, zoom, translate, rotateAngle...). The options can also have autoScale and autofit (Bool) field,
 * if autoScale is true, the scale value will be determinate by renderer while when autofit is true,
 * the drawn element will try to fullfill the whole context area (without margin). retainAspect will
 * decide whether aspect ratio will be preserved in autofit situation.
 * Note: zoom is not the same as scale. When scale is set or calculated, zoom will multiply on it and get the actual scale ratio.
 *   for example, scale is 100 and zoom is 1.5, then the actual scale value will be 150.
 *
 * @augments Kekule.Render.AbstractRenderer
 * @param {Kekule.ChemObject} chemObj Object to be drawn.
 * @param {Object} drawBridge A object that implements the actual draw job.
 * @param {Hash} options Options to draw object.
 * @param {Object} renderConfigs Global configuration for rendering.
 *   This property should be an instance of {@link Kekule.Render.Render2DConfigs}.
 * @param {Kekule.ObjectEx} parent Parent object of this renderer, usually another renderer or an instance of {@link Kekule.Render.ChemObjPainter}, or null.
 *
 * @property {Object} drawBridge A object that implements the actual draw job. Read only.
 * @property {Object} richTextDrawerClass Class of drawer to draw rich text on context. Default is {@link Kekule.Render.BaseRichTextDrawer}.
 * @class
 */
Kekule.Render.Base2DRenderer = Class.create(Kekule.Render.AbstractRenderer,
/** @lends Kekule.Render.Base2DRenderer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.Base2DRenderer',
	/** @constructs */
	initialize: function($super, chemObj, drawBridge, /*renderConfigs,*/ parent)
	{
		$super(chemObj, drawBridge, /*renderConfigs,*/ parent);
		/*
		if (!renderConfigs)
			this.setRenderConfigs(Kekule.Render.getRender2DConfigs());  // use default config
		*/
		//this.setRenderConfigs(null);
		this._richTextDrawer = null;
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('richTextDrawerClass', {'dataType': DataType.CLASS, 'serializable': false});
	},

	/** @private */
	getActualTargetContext: function(context)
	{
		/*
		if (this.getRedirectContext())
			console.log('CONTEXT redirected', context.canvas.parentNode.className , this.getRedirectContext().canvas.parentNode.className);
		*/
		return this.getRedirectContext() || context;
	},

	/** @private */
	getRendererType: function()
	{
		return Kekule.Render.RendererType.R2D;
	},

	/**
	 * Indicate whether current render and context can measure text dimension before drawing it.
	 * HTML Canvas is a typical environment of this type.
	 * @param {Object} context
	 * @returns {Bool}
	 */
	canMeasureText: function(context)
	{
		return this.getDrawBridge().canMeasureText(context);
	},

	/**
	 * Returns the standard draw length for calculation of autoScale. Usually this is the draw length of bond.
	 * Descendants can override this method to use another length.
	 * @returns {Float}
	 */
	getAutoScaleRefDrawLength: function(drawOptions)
	{
		return drawOptions.defBondLength; //this.getRenderConfigs().getLengthConfigs().getDefBondLength();
	},

	/**
	 * Returns the reference length in object to calculate autoscale.
	 * @returns {Float}
	 */
	getAutoScaleRefObjLength: function(chemObj, allowCoordBorrow)
	{
		var obj = chemObj || this.getChemObj();

		if (obj.getAllAutoScaleRefLengths)
		{
			var lengths = obj.getAllAutoScaleRefLengths(Kekule.CoordMode.COORD2D, allowCoordBorrow);
			if (lengths && lengths.length)
				return Kekule.ArrayUtils.getMedian(lengths);
		}
		else
			//Kekule.error(Kekule.ErrorMsg.INAVAILABLE_AUTOSCALE_REF_LENGTH);
			return null;  //1;
	},

	/**
	 * Returns an object to draw rich text on context.
	 * @private
	 */
	getRichTextDrawer: function()
	{
		if (!this._richTextDrawer)
		{
			var C = this.getRichTextDrawerClass() || Kekule.Render.BaseRichTextDrawer;
			this._richTextDrawer = new C(this.getDrawBridge());
		}
		return this._richTextDrawer;
	},

	// bridged draw methods
	drawPath: function(context, path, options)
	{
		return this.getDrawBridge().drawPath(this.getActualTargetContext(context), path, options);
	},
	drawLine: function(context, coord1, coord2, options)
	{
		/*
		var op = Object.create(options);
		// debug
		if (this.getRedirectContext())
		{
			op.color = op.strokeColor = '#ff0000';
		}
    */
		return this.getDrawBridge().drawLine(this.getActualTargetContext(context), coord1, coord2, options);
	},
	drawArrowLine: function(context, coord1, coord2, arrowParams, options)
	{
		var ctx = this.getActualTargetContext(context);
		if (!arrowParams)
			return this.drawLine(ctx, coord1, coord2, options);
		else
		{
			var result = this.createDrawGroup(ctx);
			// line
			var line = this.drawLine(ctx, coord1, coord2, options);
			this.addToDrawGroup(line, result);
			// arrow
			//if (arrowParams)
			{
				var dx = coord2.x - coord1.x;
				var dy = coord2.y - coord1.y;
				var alpha = Math.atan(dy / dx);

				var sign = Math.sign(dx) || 1;

				// with some default values
				var width = (arrowParams.width || 6) / 2;
				var length = arrowParams.length || 3;
				var beta = Math.atan(width / length);
				var l = Math.sqrt(Math.sqr(width) + Math.sqr(length)) * sign;

				var lcos1 = Math.cos(alpha - beta) * l;
				var lsin1 = Math.sin(alpha - beta) * l;
				var lcos2 = Math.cos(alpha + beta) * l;
				var lsin2 = Math.sin(alpha + beta) * l;

				line = this.drawLine(ctx, coord2, {'x': coord2.x - lcos1, 'y': coord2.y - lsin1}, options);
				this.addToDrawGroup(line, result);
				line = this.drawLine(ctx, coord2, {'x': coord2.x - lcos2, 'y': coord2.y - lsin2}, options);
				this.addToDrawGroup(line, result);
			}
			return result;
		}
	},
	drawTriangle: function(context, coord1, coord2, coord3, options)
	{
		return this.getDrawBridge().drawTriangle(this.getActualTargetContext(context), coord1, coord2, coord3, options);
	},
	drawRect: function(context, coord1, coord2, options)
	{
		var c1 = {'x': Math.min(coord1.x, coord2.x), 'y': Math.min(coord1.y, coord2.y)};
		var c2 = {'x': Math.max(coord1.x, coord2.x), 'y': Math.max(coord1.y, coord2.y)};
		/*
		// debug
		var op = Object.create(options);
		if (this.getRedirectContext())
		{
			op.color = op.strokeColor = '#ff0000';
		}
		return this.getDrawBridge().drawRect(this.getActualTargetContext(context), c1, c2, op);
		*/
		return this.getDrawBridge().drawRect(this.getActualTargetContext(context), c1, c2, options);
	},
	drawRoundRect: function(context, coord1, coord2, cornerRadius, options)
	{
		var c1 = {'x': Math.min(coord1.x, coord2.x), 'y': Math.min(coord1.y, coord2.y)};
		var c2 = {'x': Math.max(coord1.x, coord2.x), 'y': Math.max(coord1.y, coord2.y)};
		return this.getDrawBridge().drawRoundRect(this.getActualTargetContext(context), c1, c2, cornerRadius, options);
	},
	drawCircle: function(context, baseCoord, radius, options)
	{
		return this.getDrawBridge().drawCircle(this.getActualTargetContext(context), baseCoord, radius, options);
	},
	drawText: function(context, coord, text, options)
	{
		var drawer = this.getRichTextDrawer();
		var rt = Kekule.Render.RichTextUtils.strToRichText(text, options);
		// debug
		/*
		var op = Object.create(options || {});

		if (this.getRedirectContext())
		{
			op.color = op.strokeColor = '#ff0000';
		}
		*/
		return drawer.drawEx(this.getActualTargetContext(context), coord, rt, options/*op*/  /*, this.getRenderConfigs()*/);
	},
	drawRichText: function(context, coord, richText, options)  // note: return {drawnObj, boundRect}
	{
		var drawer = this.getRichTextDrawer();
		// debug
		//console.log('draw richText', richText, options);
		/*
		var op = Object.create(options || {});
		if (this.getRedirectContext())
		{
			op.color = op.strokeColor = '#ff0000';
		}
		*/

		return drawer.drawEx(this.getActualTargetContext(context), coord, richText, /*op*/ options /*, this.getRenderConfigs()*/);
	},
	drawImage: function(context, src, baseCoord, size, options, callback)
	{
		var self = this;
		// TODO: this approach need to be refined in the future
		return this.getDrawBridge().drawImage(this.getActualTargetContext(context), src, baseCoord, size, options, callback,
				function(){ return self.getActualTargetContext(context); });
	},
	drawImageElem: function(context, imgElem, baseCoord, size, options)
	{
		if (imgElem.complete)  // image already been loaded, can draw now
		{
			//console.log('do actual draw');
			return this.getDrawBridge().drawImageElem(this.getActualTargetContext(context), imgElem, baseCoord, size, options);
		}
		else  // need to bind to load event, try draw later
		{
			var XEvent = Kekule.X.Event;
			if (XEvent)
			{
				var self = this;
				var unlinkImgDrawProc = function()
				{
					XEvent.removeListener(imgElem, 'load', updateImgDrawing);
				};
				var updateImgDrawing = function()
				{
					//console.log('update draw', imgElem.complete);
					unlinkImgDrawProc(imgElem, updateImgDrawing);
					// force update the render, force redraw again
					self.update(self.getActualTargetContext(context), [{'obj': self.getChemObj()}], Kekule.Render.ObjectUpdateType.MODIFY);
				};
				XEvent.addListener(imgElem, 'load', updateImgDrawing);
				XEvent.addListener(imgElem, 'error', unlinkImgDrawProc);
			}
		}
	},
	createDrawGroup: function(context)
	{
		return this.getDrawBridge().createGroup(this.getActualTargetContext(context));
	},
	addToDrawGroup: function(elem, group)
	{
		return this.getDrawBridge().addToGroup(elem, group);
	},
	removeFromDrawGroup: function(elem, group)
	{
		return this.getDrawBridge().removeFromGroup(elem, group);
	},
	/**
	 * Remove an element in context.
	 * @param {Object} context
	 * @param {Object} elem
	 */
	removeDrawnElem: function(context, elem)
	{
		return this.getDrawBridge().removeDrawnElem(this.getActualTargetContext(context), elem);
	},

	/**
	 * Transform a screen based coord to context based one.
	 * Note that only 2D renderer can map screen coord back.
	 * @param {Object} context
	 * @param {Hash} coord
	 * @return {Hash}
	 */
	transformScreenCoordToContext: function(context, coord)
	{
		return this.doTransformScreenCoordToContext(this.getActualTargetContext(context), coord);
	},
	/** @private */
	doTransformScreenCoordToContext: function(context, coord)
	{
		var b = this.getDrawBridge();
		return (b && b.transformScreenCoordToContext)? b.transformScreenCoordToContext(this.getActualTargetContext(context), coord): coord;
	}
});

/**
 * A base class to render a chem object.
 * @class
 * @augments Kekule.Render.Base2DRenderer
 */
Kekule.Render.ChemObj2DRenderer = Class.create(Kekule.Render.Base2DRenderer,
/** @lends Kekule.Render.ChemObj2DRenderer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.ChemObj2DRenderer',

	/** @private */
	doEstimateObjBox: function(context, options, allowCoordBorrow)
	{
		/*
		var box;
		var o = this.getChemObj();
		if (o.getExposedContainerBox2D)
			box = o.getExposedContainerBox2D(allowCoordBorrow);
		else if (o.getContainerBox2D)
			box = o.getContainerBox2D(allowCoordBorrow);
		else
			box = null;

		return box;
		*/
		return Kekule.Render.ObjUtils.getContainerBox(this.getChemObj(), Kekule.CoordMode.COORD2D, allowCoordBorrow);
	},

	/** @private */
	doEstimateRenderBox: function(context, baseCoord, options, allowCoordBorrow)
	{
		var objBox = this.estimateObjBox(context, options, allowCoordBorrow);
		if (objBox)  // a general approach is to scale the chem object box to context's scope
		{
			var p = this.prepareTransformParams(context, baseCoord, options, objBox);
			//var transformParams = this.getFinalTransformParams(context, p);
			var transformParams = p;  //.transformParams;
			return BU.transform2D(objBox, transformParams);
		}
		else
			return null;
	},

	/** @private */
	doGetAutoBaseCoord: function(drawOptions)
	{
		var transformParams = drawOptions.transformParams;
		if (transformParams)
		{
			var obj = this.getChemObj();
			var objCoord = obj.getAbsBaseCoord? obj.getAbsBaseCoord(Kekule.CoordMode.COORD2D):
				obj.getAbsBaseCoord2D? obj.getAbsBaseCoord2D(): null;

			//console.log('autoCoord', objCoord, transformParams);

			if (objCoord)
			{
				return Kekule.CoordUtils.transform2D(objCoord, transformParams);
			}
		}
		return null;
	},

	/** @ignore */
	doDraw: function($super, context, baseCoord, options)
	{
		// since options passed by draw method is already proteced, we are not worry about change it here.
		this.prepareTransformParams(context, baseCoord, options);
		this.prepareGeneralOptions(context, options);
		return $super(context, baseCoord, options);
	},

	prepareGeneralOptions: function(context, options)
	{
		/*
		var configs = this.getRenderConfigs();
		if (configs)
		{
			// since options passed by draw method is already proteced, we are not worry about change it here.
			if (Kekule.ObjUtils.isUnset(options.opacity))
				options.opacity = configs.getGeneralConfigs().getDrawOpacity();
		}
		return options;
		*/
	},
	/**
	 * Prepare 2D transform params from baseCoord and drawOptions.
	 * If drawOptions.transformParams already set, this method will do nothing.
	 * @param {Object} context
	 * @param {Hash} baseCoord
	 * @param {Hash} drawOptions
	 * @returns {Hash}
	 */
	prepareTransformParams: function(context, baseCoord, drawOptions, objBox)
	{
		var result;
		if (drawOptions.transformParams)
		{
			result = drawOptions.transformParams;
		}
		else
		{
			var p = this.generateTransformParams(context, baseCoord, drawOptions, objBox);
			drawOptions.transformParams = p;
			result = p;
		}
		var transformMatrix = Kekule.CoordUtils.calcTransform2DMatrix(result);
		var invTransformMatrix = Kekule.CoordUtils.calcInverseTransform2DMatrix(result);

		drawOptions.transformParams.transformMatrix = transformMatrix;
		drawOptions.transformParams.invTransformMtrix = invTransformMatrix;

		this.getRenderCache(context).transformParams = result;
		this.getRenderCache(context).transformMatrix = transformMatrix;
		this.getRenderCache(context).invTransformMatrix = invTransformMatrix;
		return result;
	},

	/** @private */
	calcPreferedTransformOptions: function(context, baseCoord, drawOptions, objBox)
	{
		var result = {};

		//var generalConfigs = this.getRenderConfigs().getGeneralConfigs();
		result.allowCoordBorrow = oneOf(drawOptions.allowCoordBorrow, /*generalConfigs.getAllowCoordBorrow(),*/ false);

		/*
		 var lengthConfigs = this.getRenderConfigs().getLengthConfigs();
		 var unitLength = drawOptions.unitLength || lengthConfigs.getUnitLength();
		 result.unitLength = unitLength;
		 */
		result.unitLength = drawOptions.unitLength || 1;

		if (!objBox)
		{
			objBox = this.estimateObjBox(context, drawOptions, result.allowCoordBorrow);
		}
		var boxCenter = {'x': (objBox.x1 + objBox.x2) / 2, 'y': (objBox.y1 + objBox.y2) / 2};

		var O = Kekule.ObjUtils;

		if (O.isUnset(drawOptions.translateX) && O.isUnset(drawOptions.translateY))  // if translate is set, baseCoord will be ignored
		{
			if (baseCoord)
			{
				result.translateX = baseCoord.x - boxCenter.x;
				result.translateY = baseCoord.y - boxCenter.y;
			}
		}
		else
		{
			result.translateX = drawOptions.translateX || 0;
			result.translateY = drawOptions.translateY || 0;
		}

		result.zoom = drawOptions.zoom || 1;

		if ((!drawOptions.scale) && (!drawOptions.scaleX) && (!drawOptions.scaleY))
		{

			if (drawOptions.autofit)
			{
				var contextDim = this.getDrawBridge().getContextDimension(context);
				contextDim.x = contextDim.width;
				contextDim.y = contextDim.height;
				contextDim = this.getDrawBridge().transformScreenCoordToContext(context, contextDim);
				contextDim.width = contextDim.x;
				contextDim.height = contextDim.y;

				var padding = drawOptions.autofitContextPadding;
				padding *= result.unitLength * 2;

				objBox.width = objBox.x2 - objBox.x1;
				objBox.height = objBox.y2 - objBox.y1;

				var sx = Math.max(contextDim.width - padding, 0) / (objBox.width || 1);  // avoid div by 0
				var sy = Math.max(contextDim.height - padding, 0) / (objBox.height || 1);
				if (O.isUnset(drawOptions.retainAspect) || (drawOptions.retainAspect))
				{
					result.scaleX = result.scaleY = Math.min(sx, sy);
				}
				else
				{
					result.scaleX = sx;
					result.scaleY = sy;
				}
			}
			else // if (drawOptions.autoScale)  // default is autoScale if no explicit scale set
			{
				// auto determinate the scale by defBondLength and median of ctab bond length
				var defDrawRefLength = oneOf(drawOptions.refDrawLength, this.getAutoScaleRefDrawLength(drawOptions)) || 1;
				var medianObjRefLength = this.getAutoScaleRefObjLength(this.getChemObj(), result.allowCoordBorrow);
				if (Kekule.ObjUtils.isUnset(medianObjRefLength))
				  medianObjRefLength = drawOptions.defScaleRefLength;
				result.scaleX = result.scaleY = (defDrawRefLength / medianObjRefLength) || 1;  // medianObjRefLength may be NaN
			}
		}
		else
		{
			result.scaleX = oneOf(drawOptions.scaleX, drawOptions.scale, 1);
			result.scaleY = oneOf(drawOptions.scaleY, drawOptions.scale, 1);
		}

		if (O.notUnset(drawOptions.rotateAngle))
			result.rotateAngle = drawOptions.rotateAngle;

		if (O.isUnset(drawOptions.center))  // center not set, use center coord of Ctab
		{
			result.center = boxCenter;  // rotation center
		}
		else
			result.center = drawOptions.center;

		// indicate the absolute center of drawn object
		if (baseCoord)
			result.drawBaseCoord = baseCoord;
		else
		{
			result.drawBaseCoord = Kekule.CoordUtils.transform2D(boxCenter, result);
		}

		return result;
	},

	/**
	 * Calculate the coordinate transform options from drawOptions.
	 * Descendants can override this method.
	 * Note that unit length and zoom is not take into consideration in this method.
	 * @param {Object} context
	 * @param {Hash} baseCoord
	 * @param {Hash} drawOptions
	 * @param {Hash} objBox
	 * @returns {Hash}
	 */
	generateTransformParams: function(context, baseCoord, drawOptions, objBox)
	{
		var result = this.calcPreferedTransformOptions(context, baseCoord, drawOptions, objBox);
		//console.log('preferedTransOptions', result);
		//console.log('calc with input param', baseCoord, drawOptions, objBox);

		var initialTransformOptions = Object.extend({}, result);

		result = this.getFinalTransformParams(context, result);
		result.initialTransformOptions = initialTransformOptions;

		//console.log('final render params: ', result);

		return result;
	},

	/**
	 * Calculate the final params for translation. Zoom and unit length are taken into consideration.
	 * @param {Object} context
	 * @param {Hash} transformParams
	 * @returns {Hash}
	 */
	getFinalTransformParams: function(context, transformParams)
	{
		var result = Object.create(transformParams);
		if (result.zoom)
		{
			result.scaleX *= result.zoom;
			result.scaleY *= result.zoom;
		}

		// Note: usually {0, 0} chem coord is on bottom left, y-direction should be flipped
		result.scaleY = -result.scaleY;

		if (result.unitLength)
		{
			result.translateX *= result.unitLength;
			result.translateY *= result.unitLength;

			result.drawBaseCoord.x *= result.unitLength;
			result.drawBaseCoord.y *= result.unitLength;
		}
		return result;
	},

	/*
	 * Calculate the actual coordinate transform options from baseOptions (drawOptions).
	 * Descendants can override this method.
	 * @param {Object} context
	 * @param {Object} chemObj
	 * @param {Hash} baseCoord
	 * @param {Hash} baseOptions
	 * @returns {Hash}
	 */
	/*
	calcActualTransformOptions: function(context, chemObj, baseCoord, baseOptions)
	{
		if (!chemObj)
			chemObj = this.getChemObj();

		var objBox = this.estimateObjBox(context, chemObj, baseOptions);

		var O = Kekule.ObjUtils;
		var op = Object.create(baseOptions || {});
		var unitLength = this.getRenderConfigs().getLengthConfigs().getUnitLength() || 1;
		if (op.translateX)
			op.translateX *= unitLength;
		if (op.tranlateY)
			op.translateY *= unitLength;
		if (baseCoord)
		{
			var boxCenter = {'x': (objBox.x1 + objBox.x2) / 2, 'y': (objBox.y1 + objBox.y2) / 2};
			op.translateX = (op.translateX || 0) + baseCoord.x - boxCenter.x;
			op.translateY = (op.translateY || 0) + baseCoord.y - boxCenter.y;
		}
		var zoom = op.zoom || 1;
		if (op.scale)
			op.scale *= unitLength * zoom;
		if (op.scaleX)
			op.scaleX *= unitLength * zoom;
		if (op.scaleY)
			op.scaleY *= unitLength * zoom;
		if ((!op.scale) && (!op.scaleX) && (!op.scaleY) && op.autoScale)
		{
			// auto determinate the scale by defBondLength and median of ctab bond length
			var defDrawRefLength = oneOf(op.refDrawLength, this.getAutoScaleRefDrawLength());
			var medianObjRefLength = this.getAutoScaleRefObjLength(chemObj);
			op.scale = defDrawRefLength / medianObjRefLength * unitLength * zoom;
		}

		if (O.isUnset(op.center))  // center not set, use center coord of Ctab
		{
			op.center = {};
			op.center.x = (objBox.x1 + objBox.x2) / 2;
			op.center.y = (objBox.y1 + objBox.y2) / 2;
		}
		/*
		if (op.baseOnRootCoord && chemObj.hasCoord2D && chemObj.hasCoord2D())  // consider coord of chemObj
		{
			var baseCoord = chemObj.getCoord2D();
			op.translateX = (op.translateX || 0) + baseCoord.x; // * op.scale;
			op.translateY = (op.translateY || 0) + baseCoord.y; // * op.scale;
			console.log(op.translateX, op.translateY);
		}
		*//*
		return op;
	}
	*/

	/** @ignore */
	getRenderFinalTransformParams: function(context)
	{
		return this.getRenderCache(context).transformParams;
	},
	/** @ignore */
	getRenderInitialTransformOptions: function(context)
	{
		var p = this.getRenderFinalTransformParams(context);
		return p? p.initialTransformOptions: null;
	},

	/** @private */
	doTransformCoordToObj: function(context, chemObj, coord)
	{
		var matrix = this.getRenderCache(context).invTransformMatrix;
		return Kekule.CoordUtils.transform2DByMatrix(coord, matrix);
	},
	/** @private	 */
	doTransformCoordToContext: function(context, chemObj, coord)
	{
		var matrix = this.getRenderCache(context).transformMatrix;
		return Kekule.CoordUtils.transform2DByMatrix(coord, matrix);
	}
});

/**
 * A base class to render text or rich text on context.
 * @class
 * @augments Kekule.Render.ChemObj2DRenderer
 */
Kekule.Render.RichTextBased2DRenderer = Class.create(Kekule.Render.ChemObj2DRenderer,
/** @lends Kekule.Render.RichTextBased2DRenderer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.RichTextBased2DRenderer',
	/** @private */
	DRAWN_OBJ_FIELD: '__$drawnObj__',
	/** @private */
	getDrawnObj: function(context)
	{
		return this.getExtraProp(context, this.DRAWN_OBJ_FIELD);
	},
	/** @private */
	setDrawnObj: function(context, value)
	{
		this.setExtraProp(context, this.DRAWN_OBJ_FIELD, value);
	},

	/**
	 * Returns rich text that need to be drawn of chemObj.
	 * Descendants should override this method.
	 * @param {Kekule.ChemObject} chemObj
	 * @returns {Object}
	 * @private
	 */
	getRichText: function(chemObj, drawOptions)
	{
		return null;  // do nothing here
	},
	/**
	 * Returns a hash object that contains the text draw options.
	 * Descendants should override this method.
	 * @param options
	 * @returns {Hash}
	 * @private
	 */
	extractRichTextDrawOptions: function(options)
	{
		var result = Object.create(options || {});
		result.horizontalAlign = oneOf(result.horizontalAlign, result.textHorizontalAlign);
		result.verticalAlign = oneOf(result.verticalAlign, result.textVerticalAlign);
		result.charDirection = oneOf(result.charDirection, result.textCharDirection);
		return result;
	},
	/**
	 * Returns the actual alignment coord to draw text.
	 * Decendants may override this method.
	 * @param {Hash} baseCoord
	 * @returns {Hash}
	 * @private
	 */
	getDrawTextCoord: function(context, baseCoord)
	{
		return baseCoord;
	},

	/** @private */
	doDraw: function($super, context, baseCoord, options)
	{
		$super(context, baseCoord, options);

		//console.log('draw text options', options);

		var chemObj = this.getChemObj();
		var transformOptions = options.transformParams;
		var richText = this.getRichText(this.getChemObj(), options);

		if (!richText)
			return null;

		if (!baseCoord)
			baseCoord = this.getAutoBaseCoord(options);

		var textCoord = this.getDrawTextCoord(context, baseCoord);

		//console.log('draw text', this.getChemObj().getText(), baseCoord);

		//console.log('draw text options', Kekule.Render.RichTextUtils.toText(richText), options, this.extractRichTextDrawOptions(options));

		var result = this.drawRichText(context, textCoord, richText,
			this.extractRichTextDrawOptions(options));
		//console.log(result);
		var rect = result.boundRect;
		//this.basicDrawObjectUpdated(context, chemObj, chemObj, this.createRectBoundInfo({x: rect.x1, y: rect.y1}, {x: rect.x2, y: rect.y2}), Kekule.Render.ObjectUpdateType.ADD);
		this.basicDrawObjectUpdated(context, chemObj, chemObj,
			this.createRectBoundInfo({x: rect.left, y: rect.top}, {x: rect.left + rect.width, y: rect.top + rect.height}), Kekule.Render.ObjectUpdateType.ADD);

		this.getRenderCache(context).drawnObj = result.drawnObj;
		this.setDrawnObj(context, result.drawnObj);

		return result.drawnObj;
	}
});

/**
 * A default class to render a text block.
 * @class
 * @augments Kekule.Render.RichTextBased2DRenderer
 */
Kekule.Render.TextBlock2DRenderer = Class.create(Kekule.Render.RichTextBased2DRenderer,
/** @lends Kekule.Render.TextBlock2DRenderer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.TextBlock2DRenderer',

	/** @private */
	getRichText: function(chemObj, drawOptions)
	{
		var result = Kekule.Render.RichTextUtils.strToRichText(chemObj.getText());
		return result;
	},

	/** @private */
	doEstimateObjBox: function(context, options, allowCoordBorrow)
	{
		return this.getChemObj().getBox2D(allowCoordBorrow);
	},

	/** @ignore */
	getDrawTextCoord: function(context, baseCoord)
	{
		var chemObj = this.getChemObj();
		// calc context size of text box
		var objBox = chemObj.getExposedContainerBox();
		var coord1 = {x: objBox.x1, y: objBox.y2};
		var coord2 = {x: objBox.x2, y: objBox.y1};
		var contextCoord1 = this.transformCoordToContext(context, chemObj, coord1);
		var contextCoord2 = this.transformCoordToContext(context, chemObj, coord2);
		var size = Kekule.CoordUtils.substract(contextCoord2, contextCoord1);

		// since baseCoord is at the center of object, we need calculate out the corner coord to draw text
		var result = {x: baseCoord.x - size.x / 2, y: baseCoord.y - size.y / 2};
		return result;
	},

	/** private */
	extractRichTextDrawOptions: function($super, options)
	{
		//var ops = Kekule.Render.RenderOptionUtils.extractRichTextDraw2DOptions(renderConfigs, options || {});
		var ops = $super(options);
		ops.fontSize = oneOf(ops.fontSize, ops.labelFontSize);
		ops.fontFamily = oneOf(ops.fontFamily, ops.labelFontFamily);
		ops.color = oneOf(ops.color, ops.labelColor);
		ops.textBoxXAlignment = Kekule.Render.BoxXAlignment.LEFT;
		ops.textBoxYAlignment = Kekule.Render.BoxYAlignment.TOP;

		return ops;
	}
});

/**
 * A default class to render a formula.
 * @class
 * @augments Kekule.Render.RichTextBased2DRenderer
 */
Kekule.Render.Formula2DRenderer = Class.create(Kekule.Render.RichTextBased2DRenderer,
/** @lends Kekule.Render.Formula2DRenderer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.Formula2DRenderer',

	/** @ignore */
	basicDrawObjectUpdated: function($super, context, obj, parentObj, boundInfo, updateType)
	{
		if (obj === this.getChemObj())
		{
			return $super(context, obj.getParent(), obj.getParent(), boundInfo, updateType);  // register with molecule, not formula itself
		}
		else
			return $super(context, obj, parentObj, boundInfo, updateType);
	},

	/** @private */
	getRichText: function(chemObj, drawOptions)
	{
		return chemObj.getDisplayRichText(true, drawOptions.displayLabelConfigs, drawOptions.partialChargeDecimalsLength, drawOptions.chargeMarkType);  // show charge
	},

	/** @private */
	doEstimateObjBox: function(context, options, allowCoordBorrow)
	{
		var parent = this.getChemObj()? this.getChemObj().getParent(): null;
		if (parent)
		{
			var coord = (parent) ? parent.getAbsBaseCoord2D(allowCoordBorrow) : {'x': 0, 'y': 0};
			return BU.createBox(coord, coord);  // formula has no box in chem object scope, only a point
		}
		else
			return null;
	},

	/** private */
	extractRichTextDrawOptions: function($super, options)
	{
		//var ops = Kekule.Render.RenderOptionUtils.extractRichTextDraw2DOptions(renderConfigs, options || {});
		var ops = $super(options);
		/*
		ops.fontSize = oneOf(ops.atomFontSize, ops.fontSize);
		ops.fontFamily = oneOf(ops.atomFontFamily, ops.fontFamily);
		*/
		ops.fontSize = oneOf(ops.fontSize, ops.atomFontSize);
		ops.fontFamily = oneOf(ops.fontFamily, ops.atomFontFamily);
		ops.color = oneOf(ops.color, ops.labelColor, ops.atomColor);
		ops.textBoxXAlignment = Kekule.Render.BoxXAlignment.CENTER;
		ops.textBoxYAlignment = Kekule.Render.BoxYAlignment.CENTER;

		return ops;
	}
});
//Kekule.ClassDefineUtils.addExtraObjMapSupport(Kekule.Render.Formula2DRenderer);

/**
 * Class to render a image block object.
 * @class
 * @augments Kekule.Render.ChemObj2DRenderer
 */
Kekule.Render.ImageBlock2DRenderer = Class.create(Kekule.Render.ChemObj2DRenderer,
/** @lends Kekule.Render.ImageBlock2DRenderer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.ImageBlock2DRenderer',
	/** @constructs */
	initialize: function($super, chemObj, drawBridge, parent)
	{
		$super(chemObj, drawBridge, parent);
	},
	/** @private */
	doDraw: function($super, context, baseCoord, options)
	{
		$super(context, baseCoord, options);

		//console.log('draw text options', options);

		var chemObj = this.getChemObj();
		var transformOptions = options.transformParams;

		if (!chemObj || !chemObj.getSrc || !chemObj.getSrc())
			return null;

		if (!baseCoord)
			baseCoord = this.getAutoBaseCoord(options);

		// calc context size of image
		var objBox = chemObj.getExposedContainerBox();
		/*
		var coord1 = chemObj.getCornerCoord1(Kekule.CoordMode.COORD2D, true);
		var coord2 = chemObj.getCornerCoord2(Kekule.CoordMode.COORD2D, true);
		*/
		var coord1 = {x: objBox.x1, y: objBox.y2};
		var coord2 = {x: objBox.x2, y: objBox.y1};
		var contextCoord1 = this.transformCoordToContext(context, chemObj, coord1);
		var contextCoord2 = this.transformCoordToContext(context, chemObj, coord2);
		var size = Kekule.CoordUtils.substract(contextCoord2, contextCoord1);

		// since baseCoord is at the center of object, we need calculate out the corner coord
		var drawCoord = {x: baseCoord.x - size.x / 2, y: baseCoord.y - size.y / 2};
		//var drawCoord = contextCoord1;

		/*
		var result = this.drawImage(context, chemObj.getSrc(), baseCoord, size,
				options);
		*/
		var result;
		var imgElem = chemObj.getCacheImg();

		if (imgElem)
		{
			result = this.drawImageElem(context, imgElem, drawCoord, size, options);
		}
		else
			result = this.drawImage(context, chemObj.getSrc(), drawCoord, size,
					options);

		// debug
		//var result = this.drawRect(context, contextCoord1, contextCoord2, options);

		this.basicDrawObjectUpdated(context, chemObj, chemObj,
				this.createRectBoundInfo(drawCoord, Kekule.CoordUtils.add(drawCoord, size)), Kekule.Render.ObjectUpdateType.ADD);

		//this.setObjDrawElem(context, chemObj, result);

		return result;
	},
	doDrawImgContent: function(imgElem)
	{

	}
});
Kekule.Render.Renderer2DFactory.register(Kekule.ImageBlock, Kekule.Render.ImageBlock2DRenderer);


	/**
 * A default implementation of 2D Ctab (in molecule or path glyph) renderer.
 * @class
 * @augments Kekule.Render.ChemObj2DRenderer
 */
Kekule.Render.Ctab2DRenderer = Class.create(Kekule.Render.ChemObj2DRenderer,
/** @lends Kekule.Render.Ctab2DRenderer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.Ctab2DRenderer',
	/** @private */
	DRAW_ELEM_FIELD: '__$drawElem__',
	/** @private */
	TRANSFORM_COORD_FIELD: '__$transCoord2D__',
	/** @private */
	TRANSFORM_MATRIX_FIELD: '__$transMatrix__',
	/** private */
	RENDERED_OBJS_FIELD: '__$renderedObjs__',
	/** @private */
	INV_TRANSFORM_MATRIX_FIELD: '__$inverseTransMatrix__',
	/** @private */
	CHILD_TRANSFORM_MATRIX_FIELD: '__$childTransMatrix__',

	/** @private */
	doEstimateObjBox: function(context, options, allowCoordBorrow)
	{
		// TODO: just a rough calc
		var box = this.getChemObj().getExposedContainerBox2D(allowCoordBorrow);
		return box;
	},

	/** @private */
	getObjDrawElem: function(context, obj)
	{
		return this.getExtraProp2(context, obj, this.DRAW_ELEM_FIELD);
	},
	/** @private */
	setObjDrawElem: function(context, obj, value)
	{
		this.setExtraProp2(context, obj, this.DRAW_ELEM_FIELD, value);
	},

	/** @private */
	getRenderedObjs: function(context)
	{
		return this.getExtraProp(context, this.RENDERED_OBJS_FIELD);
	},
	/** @private */
	addRenderedObj: function(context, obj)
	{
		//console.log('add rendered obj', obj.getClassName());
		var objs = this.getRenderedObjs(context);
		if (!objs)
		{
			objs = [obj];
			this.setExtraProp(context, this.RENDERED_OBJS_FIELD, objs);
		}
		else
		{
			Kekule.ArrayUtils.pushUnique(objs, obj);
		}
	},
	/** @private */
	removeRenderedObj: function(context, obj)
	{
		//console.log('remove rendered obj', obj.getClassName());
		var objs = this.getRenderedObjs(context);
		if (objs)
		{
			Kekule.ArrayUtils.remove(objs, obj);
		}
	},
	/** @private */
	clearRenderedObj: function(context)
	{
		this.setExtraProp(context, this.RENDERED_OBJS_FIELD, null);
	},


	/** @private */
	prepareGeneralOptions: function($super, context, options)
	{
		return $super(context, options);
		/*
		 var configs = this.getRenderConfigs();
		 if (configs)
		 {
		 // since options passed by draw method is already proteced, we are not worry about change it here.
		 if (Kekule.ObjUtils.isUnset(options.useAtomSpecifiedColor))
		 options.useAtomSpecifiedColor = configs.getColorConfigs().getUseAtomSpecifiedColor();
		 }
		 return options;
		 */
	},

	/** @private */
	doPrepare: function($super, context, chemObj, baseCoord, options)
	{
		$super(context, chemObj, baseCoord, options);
	},
	/** @private */
	handleNodeSpecifiedRenderOptions: function(currObj, parentOptions)
	{
		var localOptions = (currObj.getOverriddenRenderOptions? currObj.getOverriddenRenderOptions(): null) || {};
		var result = Object.create(parentOptions);
		result = Object.extend(result, localOptions);
		return result;
	},
	/** @private */
	handleConnectorSpecifiedRenderOptions: function($super, currObj, parentOptions)
	{
		var localOptions = (currObj.getOverriddenRenderOptions? currObj.getOverriddenRenderOptions(): null) || {};
		var result = Object.create(parentOptions || null);
		result = Object.extend(result, localOptions);
		return result;
	},
	/** @ignore */
	isChemObjRenderedBySelf: function($super, context, obj)
	{
		var renderedObjs = this.getRenderedObjs(context);
		var result = $super(context, obj) || (renderedObjs && (renderedObjs.indexOf(obj) >= 0))
			|| (this.getChemObj().hasChildObj(obj) && (!obj.isExposed || obj.isExposed()));
		//console.log('check if rendered', obj.getClassName(), result);
		return result;
	},
	/** @ignore */
	isChemObjRenderedDirectlyBySelf: function($super, context, obj)
	{
		/*
		var chemObj = this.getChemObj();
		var parentMol = chemObj.getParent && chemObj.getParent();
		console.log(parentMol && parentMol.getId());
		*/
		var renderedObjs = this.getRenderedObjs(context);
		return $super(context, obj) || (renderedObjs && (renderedObjs.indexOf(obj) >= 0));  // || (obj === parentMol);
	},

	/** @private */
	doDraw: function($super, context, baseCoord, options)
	{
		$super(context, baseCoord, options);

		//console.log(options);

		var chemObj = this.getChemObj();
		this._ctab = chemObj;

		//var originDisplayType = this.getMoleculeDisplayType();
		/*
		 if (Kekule.ObjUtils.notUnset(options.moleculeDisplayType))
		 this.setMoleculeDisplayType(options.moleculeDisplayType);
		 */

		//var transformOptions = this.calcActualTransformOptions(context, chemObj, baseCoord, options);
		//var transformOptions = this.getFinalTransformParams(context, options.transformParams);
		var transformOptions = options.transformParams;
		this.getRenderCache(context).transformOptions = transformOptions;
		this.transformCtabCoords2DToContext(context, chemObj, transformOptions);
		this.doPrepare(context, chemObj, baseCoord, options);

		this.getRenderCache(context).appliedOptions = options;

		var result = this.doDrawCore(context, chemObj, options, transformOptions);

		//this.setMoleculeDisplayType(originDisplayType);
		return result;
	},
	/** @private */
	doRedraw: function(context)
	{
		var p = this.getRenderCache(context);
		//this.clear(context);
		// no need to prepare, draw directly
		//console.log('redraw', p.appliedOptions);
		return this.doDrawCore(context, this.getChemObj(), p.appliedOptions, p.transformOptions);
		//return this.doDraw(context, p.baseCoord, p.options);
	},
	/** @private */
	doDrawCore: function(context, chemObj, options, finalTransformOptions)
	{
		this.clearRenderedObj(context);
		// create a new group to contain whole ctab
		var group = this.createDrawGroup(context);
		this.doDrawConnectors(context, group, chemObj, options, finalTransformOptions);
		this.doDrawNodes(context, group, chemObj, options, finalTransformOptions);
		this.setObjDrawElem(context, chemObj, group);
		return group;
	},

	/** @private */
	doUpdate: function($super, context, updatedObjDetails, updateType)
	{
		if (this.canModifyGraphic(context))
		{
			var r = false;
			var T = Kekule.Render.ObjectUpdateType;
			switch (updateType)
			{
				case T.ADD:
					r = this.doAddNew(context, updatedObjDetails);
					break;
				case T.MODIFY:
					r = this.doModify(context, updatedObjDetails);
					break;
				case T.REMOVE:
					r = this.doRemove(context, Kekule.Render.UpdateObjUtils._extractObjsOfUpdateObjDetails(updatedObjDetails));
					break;
				default:  // clear
					return $super(context, updatedObjDetails, updateType);
			}
			return r;
		}
		else
			return $super(context, updatedObjs, updateType);
	},

	/** @private */
	doAddNew: function(/*$super,*/ context, updatedObjDetails)
	{
		if (this.canModifyGraphic())
		{
			return this.doModify(context, updatedObjDetails);
		}
		else
		//return $super(context, updatedObjs);
			return false;
	},
	/** @private */
	doModify: function(/*$super,*/ context, updatedObjDetails)
	{
		if (this.canModifyGraphic())
		{
			// find old corresponding element to updatedObj and remove it
			/*
			 var elem = this.getObjDrawElem(updatedObj);
			 if (elem)
			 this.doRemoveElem(context, elem);
			 */
			// debug
			/*
			 {
			 var updatedObjs = Kekule.Render.UpdateObjUtils._extractObjsOfUpdateObjDetails(updatedObjDetails);
			 console.log('<modify>', updatedObjs.length, updatedObjs);
			 }
			 */
			var objs = this._extractObjsOfUpdateObjDetails(updatedObjDetails);
			this.remove(context, objs);
			// then update new ones
			var chemObj = this.getChemObj();
			var group = this.getObjDrawElem(context, chemObj);
			var cache = this.getRenderCache(context);
			//console.log(this.getClassName(), context.canvas.parentNode, cache);
			var options = cache.appliedOptions;  //cache.options;
			if (objs.indexOf(chemObj) >= 0)  // update whole ctab
			{
				//console.log('<update whole ctab>', chemObj.getParent());
				this.draw(context, cache.baseCoord, options);
			}
			for (var i = 0, l = objs.length; i < l; ++i)
			{
				var obj = objs[i];
				if (!obj.isExposed || obj.isExposed())
				{
					/*
					 if (obj === chemObj) // update whole ctab
					 {
					 this.draw(context, cache.baseCoord, options);
					 }
					 else
					 */
					{
						//console.log('modify', obj.getClassName(), chemObj.hasChildObj(obj));
						if (chemObj.hasConnector(obj)) // is connector
						{
							this.doDrawConnector(context, group, obj, this.getChemObj(), options, cache.transformParams || {});
							//console.log('draw connector', obj);
						}
						else if (chemObj.hasNode(obj)) // is node
						{
							this.doDrawNode(context, group, obj, this.getChemObj(), options, cache.transformParams);
						}
					}
				}
			}
			return true;
		}
		else
		{
			//return $super(context, updatedObjs);
			return false;
		}
	},
	/** @private */
	doRemove: function(/*$super,*/ context, removedObjs)
	{
		if (this.canModifyGraphic())
		{
			var objs = Kekule.ArrayUtils.toArray(removedObjs);
			for (var i = 0, l = objs.length; i < l; ++i)
			{
				var obj = objs[i];
				//console.log('remove', obj.getClass(), obj.getId());
				// find old corresponding element to updatedObj and remove it
				var elem = this.getObjDrawElem(context, obj);
				if (elem)
				{
					var group = this.getObjDrawElem(context, this.getChemObj()); //this.getObjDrawElem(context, chemObj);
					this.removeFromDrawGroup(elem, group);
					this.removeDrawnElem(context, elem);
				}
				this.removeRenderedObj(context, obj);
				this.removeExtraProp2(context, obj);   // delete cached coord and drawElem
				//console.log('obj removed', obj.getClassName());
				this.basicDrawObjectUpdated(context, obj, this.getChemObj(), null, Kekule.Render.ObjectUpdateType.REMOVE);
			}
			return true;
		}
		else
		//return $super(context, removedObjs);
			return false;
	},
	/* @private */
	/*
	 doClear: function($super, context)
	 {
	 var chemObj = this.getChemObj();
	 if (this.canModifyGraphic())
	 {
	 var drawElem = this.getObjDrawElem(context, chemObj); //this.getObjDrawElem(context, chemObj);
	 if (drawElem)
	 this.removeDrawnElem(context, drawElem);
	 }
	 else
	 return $super(context);
	 },
	 */
	/** @private */
	getCoordTransformOptions: function(context)
	{
		return this.getRenderCache(context).transformOptions;
	},
	/**
	 * Transform each 2D coordinates of objects in CTab to current render space.
	 * This function should be called before the whole draw phrase.
	 * @private
	 */
	transformCtabCoords2DToContext: function(context, ctab, transformOptions)
	{
		// TODO: note that usually chem structure coord (0, 0) is on bottom left rather than top left
		// so a y direction flip is essential
		/*
		 transformOptions.scaleX = transformOptions.scaleX || transformOptions.scale;
		 transformOptions.scaleY = (transformOptions.scaleY || transformOptions.scale);
		 */
		var allowCoordBorrow = transformOptions.allowCoordBorrow;

		var childTransformOptions = Object.extend({}, transformOptions);
		childTransformOptions.centerX = 0;
		childTransformOptions.centerY = 0;
		var coord;

		var coordTransformMatrix = transformOptions.transformMatrix;
		//Kekule.CoordUtils.calcTransform2DMatrix(transformOptions);
		this.setExtraProp2(context, ctab, this.TRANSFORM_MATRIX_FIELD, coordTransformMatrix);
		//var childCoordTransformMatrix = Kekule.CoordUtils.calcTransform2DMatrix(childTransformOptions);
		var childCoordTransformMatrix = coordTransformMatrix;
		this.setExtraProp2(context, ctab, this.CHILD_TRANSFORM_MATRIX_FIELD, coordTransformMatrix);
		// also calc for inversed transform matrix
		var invMatrix = transformOptions.invTransformMatrix;
		//Kekule.CoordUtils.calcInverseTransform2DMatrix(transformOptions);
		//console.log('INV CHECK', Kekule.MatrixUtils.multiply(this._coordTransformMatrix, invMatrix));
		this.setExtraProp2(context, ctab, this.INV_TRANSFORM_MATRIX_FIELD, invMatrix);

		for (var i = 0, l = ctab.getNodeCount(); i < l; ++i)
		{
			var node = ctab.getNodeAt(i);
			//this.transformObjCoord2D(node, transformOptions, childTransformOptions);
			this.transformObjCoord2DToContext(context, node, coordTransformMatrix, childCoordTransformMatrix, allowCoordBorrow);
		}
	},
	/**
	 * Transform 2D coordinates of node or connector to current render space.
	 * This function should be called by transformCtabCoords2D before the whole draw phrase.
	 * @private
	 */
	transformObjCoord2DToContext: function(context, obj, transformMatrix, childTransformMatrix, allowCoordBorrow)
	{
		//if (node && node.getBaseCoord2D)
		if (obj && obj.getAbsBaseCoord2D)
		{
			//coord = node.getBaseCoord2D();
			var coord = obj.getAbsBaseCoord2D(allowCoordBorrow);
			if (coord)
			{
				var newCoord = Kekule.CoordUtils.transform2DByMatrix(coord, transformMatrix);
				this.setTransformedCoord2D(context, obj, newCoord);
				//console.log(node[this.TRANSFORM_COORD_FIELD]);
			}
			if (obj.getNodes)  // has child nodes
			{
				// Done: not handle nested structure yet
				for (var i = 0, l = obj.getNodeCount(); i < l; ++i)
					this.transformObjCoord2DToContext(context, obj.getNodeAt(i), childTransformMatrix, childTransformMatrix, allowCoordBorrow);
			}
		}
	},
	/**
	 * Get transformed coord.
	 * @param {Object} context
	 * @param {Object} obj
	 * @private
	 */
	getTransformedCoord2D: function(context, obj, allowCoordBorrow)
	{
		if (Kekule.ObjUtils.isUnset(allowCoordBorrow))
		{
			allowCoordBorrow = this.getRenderCache(context).options.transformParams.allowCoordBorrow;
		}
		//if (!obj[this.TRANSFORM_COORD_FIELD])  // not transformed yet
		var isNode = obj instanceof Kekule.BaseStructureNode;
		var result = isNode && this.getExtraProp2(context, obj, this.TRANSFORM_COORD_FIELD);
		  // IMPORTANT: connector center coord is based on node and should not be cached
		if (!result)
		{
			/*
			 var transformOptions = this._transformOptions || {};
			 var childTransformOptions = Object.extend({}, transformOptions);
			 childTransformOptions.centerX = 0;
			 childTransformOptions.centerY = 0;
			 this.transformObjCoord2D(obj, transformOptions, childTransformOptions)
			 */
			var ctab = this.getChemObj();
			var transformMatrix = this.getExtraProp2(context, ctab, this.TRANSFORM_MATRIX_FIELD);
			var childTransformMatrix = this.getExtraProp2(context, ctab, this.CHILD_TRANSFORM_MATRIX_FIELD);
			if (ctab && (ctab.hasNode(obj, false) || ctab.hasConnector(obj, false)))  // is direct child of ctab
			{
				this.transformObjCoord2DToContext(context, obj, transformMatrix, childTransformMatrix, allowCoordBorrow);
			}
			else  // is nested child
				this.transformObjCoord2DToContext(context, obj, childTransformMatrix, childTransformMatrix, allowCoordBorrow);
		}
		//console.log('transformed: ', obj[this.TRANSFORM_COORD_FIELD]);
		//return obj[this.TRANSFORM_COORD_FIELD];
		return this.getExtraProp2(context, obj, this.TRANSFORM_COORD_FIELD);
	},
	/**
	 * Set transformed coord.
	 * @param {Object} context
	 * @param {Object} obj
	 * @param {Hash} coord
	 * @private
	 */
	setTransformedCoord2D: function(context, obj, coord)
	{
		//obj[this.TRANSFORM_COORD_FIELD] = coord;
		this.setExtraProp2(context, obj, this.TRANSFORM_COORD_FIELD, coord);
	},

	/** @private */
	doTransformCoordToObj: function(context, chemObj, coord)
	{
		var matrix = this.getExtraProp2(context, chemObj, this.INV_TRANSFORM_MATRIX_FIELD);
		return Kekule.CoordUtils.transform2DByMatrix(coord, matrix);
	},
	/** @private	 */
	doTransformCoordToContext: function(context, chemObj, coord)
	{
		var matrix = this.getExtraProp2(context, chemObj, this.TRANSFORM_MATRIX_FIELD);
		return Kekule.CoordUtils.transform2DByMatrix(coord, matrix);
	},

	/**
	 * Draw all nodes in ctab on context.
	 * @param {Object} context
	 * @param {Object} group
	 * @param {Object} ctab
	 * @param {Object} options
	 * @param {Object} finalTransformOptions
	 * @returns {Object} A rendered object.
	 * @private
	 */
	doDrawNodes: function(context, group, ctab, options, finalTransformOptions)
	{
		//console.log(finalTransformOptions);
		/*
		 var ops = Object.create(options);
		 ops.color = options.atomColor || options.color;  // use atomColor to override color settings
		 ops.atomColor = null;
		 ops.fontFamily = options.atomFontFamily || options.fontFamily;
		 ops.atomFontFamily = null;
		 ops.fontSize = options.atomFontSize || options.fontSize;
		 ops.atomFontSize = null;
		 */
		//var ops = this.handleNodeSpecifiedRenderOptions(ctab, options);

		var nodes = ctab.getExposedNodes();
		for (var i = 0, l = nodes.length; i < l; ++i)
		{
			var node = nodes[i];
			var ops = this.handleNodeSpecifiedRenderOptions(nodes[i], options);
			var elem = this.doDrawNode(context, group, node, ctab, ops, finalTransformOptions);
			/*
			 if (elem && group)
			 this.doAddToGroup(elem, group);
			 */
		}
	},

	/**
	 * Draw a node on context. Descendants need to override this method to do actual drawing.
	 * @param {Object} context
	 * @param {Object} group
	 * @param {Object} node
	 * @param {Object} parentChemObj
	 * @param {Object} options
	 * @param {Object} finalTransformOptions
	 * @returns {Object} A rendered object.
	 * @private
	 */
	doDrawNode: function(context, group, node, parentChemObj, options, finalTransformOptions)
	{
		// do nothing here
	},

	/**
	 * Draw all connectors in ctab on context.
	 * @param {Object} context
	 * @param {Object} group
	 * @param {Object} ctab
	 * @param {Object} options
	 * @param {Object} finalTransformOptions
	 * @returns {Object} A rendered object.
	 * @private
	 */
	doDrawConnectors: function(context, group, ctab, options, finalTransformOptions)
	{
		/*
		 var ops = Object.create(options);
		 ops.color = options.bondColor || options.color;  // use atomColor to override color settings
		 ops.bondColor = null;
		 */
		var ops = this.handleConnectorSpecifiedRenderOptions(ctab, options);

		var connectors = ctab.getExposedConnectors();
		for (var i = 0, l = connectors.length; i < l; ++i)
		{
			var connector = connectors[i];
			var elem = this.doDrawConnector(context, group, connector, ctab, ops, finalTransformOptions);
		}
	},
	/**
	 * Draw a connector on context.
	 * @param {Object} context
	 * @param {Object} group
	 * @param {Object} connector
	 * @param {Object} options
	 * @param {Object} finalTransformOptions
	 * @returns {Object} A rendered object.
	 * @private
	 */
	doDrawConnector: function(context, group, connector, parentChemObj, options, finalTransformOptions)
	{
		var result;
		// draw lines between every two connected objects
		//var objCount = connector.getConnectedObjCount();
		var objs = connector.getConnectedExposedObjs();
		var objCount = objs.length;

		if (objCount < 2)  // less than two connected object, can not draw
		{
			return null;
		}

		var obj1, obj2;
		var coord1, coord2;
		var elem;
		var subGroup = (objCount > 2)? this.createDrawGroup(context): null;
		var elemEx;
		var boundInfos = (objCount > 2)? []: null;

		/*
		 var renderOptions = Kekule.Render.RenderOptionUtils.mergeObjLocalRenderOptions(connector, options);
		 renderOptions.color = renderOptions.bondColor || renderOptions.color;
		 */
		var renderOptions = this.handleConnectorSpecifiedRenderOptions(connector, options);

		for (var i = 0; i < objCount; ++i)
		{
			obj1 = objs[i];
			coord1 = this.getTransformedCoord2D(context, obj1, finalTransformOptions.allowCoordBorrow);
			if (coord1)
			{
				for (var j = i + 1; j < objCount; ++j) // do not draw on self
				{
					obj2 = objs[j];
					coord2 = this.getTransformedCoord2D(context, obj2, finalTransformOptions.allowCoordBorrow);
					if (coord2)
					{
						//console.log('draw connector', coord1, coord2);
						elemEx = this.doDrawConnectorShape(context, connector, obj1, obj2, renderOptions, finalTransformOptions);
						if (elemEx)
						{
							elem = elemEx.element;
							//var elem = this.doDrawConnectorLine(context, coord1, coord2, 1, style);
							if (elem && subGroup)
								this.addToDrawGroup(elem, subGroup);
							//return elem;
							var boundInfo = elemEx.boundInfo;
							if (boundInfos)
								boundInfos.push(boundInfo);
						}
					}
				}
			}
		}

		result = subGroup || elem;
		if (result && group)
			this.addToDrawGroup(result, group);
		if (result)
		{
			//console.log(result);
			this.setObjDrawElem(context, connector, result);
			//this.basicObjectDrawn(connector, boundInfos || boundInfo);
		}
		else
			this.setObjDrawElem(context, connector, null);

		this.addRenderedObj(context, connector);

		if (boundInfo || boundInfos)  // has bound info, connector is actually drawn
			this.basicDrawObjectUpdated(context, connector, parentChemObj, boundInfos || boundInfo, Kekule.Render.ObjectUpdateType.ADD);

		return result;
	},
	/**
	 * Draw a connector connecting node1 and node2 on context. Descendants need to override this method to do actual drawing.
	 * @param {Object} context
	 * @param {Kekule.ChemStructureConnector} connector
	 * @param {Kekule.ChemStructureNode} node1
	 * @param {Kekule.ChemStructureNode} node2
	 * @param {Hash} renderOptions
	 * @param {Hash} finalTransformOptions
	 * @private
	 */
	doDrawConnectorShape: function(context, connector, node1, node2, renderOptions, finalTransformOptions)
	{
		// do nothing here
	}
});
//Kekule.ClassDefineUtils.addExtraObjMapSupport(Kekule.Render.Ctab2DRenderer);
Kekule.ClassDefineUtils.addExtraTwoTupleObjMapSupport(Kekule.Render.Ctab2DRenderer);

/**
 * A default implementation of 2D a molecule's CTab renderer.
 * @class
 * @augments Kekule.Render.Ctab2DRenderer
 */
Kekule.Render.ChemCtab2DRenderer = Class.create(Kekule.Render.Ctab2DRenderer,
/** @lends Kekule.Render.ChemCtab2DRenderer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.ChemCtab2DRenderer',
	/** @private */
	OBJ_NEED_LABEL_FIELD: '__$needDrawLabel__',
	/** @private */
	OBJ_NEED_DOT_FIELD: '__$needDrawDot__',
	//* @private */
	//OBJ_HIDDEN_FIELD: '__$hidden__',

	/*
	 * Note: param passing to this function may be node or connector.
	 * @private
	 */
	/*
	getObjHidden: function(context, obj)
	{
		var result = this.getExtraProps(context, obj, this.OBJ_HIDDEN_FIELD);
		if (Kekule.ObjUtils.isUnset(result))
		{
			var drawOptions = this.getRenderCache(context).appliedOptions;
			result = this._needObjHidden(obj, drawOptions);
			//this.setExtraProp2(context, obj, this.OBJ_NEED_LABEL_FIELD, result);
			this.setObjNeedDrawLabel(context, obj, result);
		}
		return result;
	},
	*/
	/*
	 * @private
	 */
	/*
	setObjHidden: function(context, obj, value)
	{
		this.setExtraProp2(context, obj, this.OBJ_HIDDEN_FIELD, value);
	},
	*/
	/**
	 * Note: param passing to this function may be node or connector.
	 * @private
	 */
	getObjNeedDrawLabel: function(context, obj)
	{
		var result = this.getExtraProp2(context, obj, this.OBJ_NEED_LABEL_FIELD);
		if (Kekule.ObjUtils.isUnset(result))
		{
			var drawOptions = this.getRenderCache(context).appliedOptions;
			result = (obj instanceof Kekule.ChemStructureConnector)? false: this._needNodeDrawLabel(obj, drawOptions);
			//this.setExtraProp2(context, obj, this.OBJ_NEED_LABEL_FIELD, result);
			this.setObjNeedDrawLabel(context, obj, result);
		}
		return result;
	},
	/**
	 * @private
	 */
	setObjNeedDrawLabel: function(context, obj, value)
	{
		this.setExtraProp2(context, obj, this.OBJ_NEED_LABEL_FIELD, value);
	},
	/**
	 * Note: param passing to this function may be node or connector.
	 * @private
	 */
	getObjNeedDrawDot: function(context, obj)
	{
		/*
		var result = this.getExtraProp2(context, obj, this.OBJ_NEED_DOT_FIELD);
		if (Kekule.ObjUtils.isUnset(result))
		{
			var drawOptions = this.getRenderCache(context).appliedOptions;
			result = (obj instanceof Kekule.ChemStructureConnector)? false: this._needNodeDrawDot(context, obj, drawOptions);
			//this.setExtraProp2(context, obj, this.OBJ_NEED_LABEL_FIELD, result);
			this.setObjNeedDrawDot(context, obj, result);
		}
		*/
		var drawOptions = this.getRenderCache(context).appliedOptions;
		var result = (obj instanceof Kekule.ChemStructureConnector)? false: this._needNodeDrawDot(context, obj, drawOptions);
		return result;
	},

	/** @private */
	doPrepare: function($super, context, chemObj, baseCoord, options)
	{
		$super(context, chemObj, baseCoord, options);
		/*
		// generate draw options
		var c = this.getRenderCache(context);
		this._richTextDrawOptions = this.generateRichTextDrawOptions(this.getRenderConfigs(), options);
		this._chargeDrawOptions = this.generateChargeDrawOptions(this.getRenderConfigs(), options);
		this._connectorDrawOptions = this.generateConnectorDrawOptions(this.getRenderConfigs(), options);
		*/
		/*
		c.richTextDrawOptions = options; //this.generateRichTextDrawOptions(this.getRenderConfigs(), options);
		c.chargeDrawOptions = options; //this.generateChargeDrawOptions(this.getRenderConfigs(), options);
		c.connectorDrawOptions = options;  this.generateConnectorDrawOptions(this.getRenderConfigs(), options);
		*/

		//this._drawOptions = options;
		if (!options.fontSize)
		//if (options.atomFontSize)
			options.fontSize = options.atomFontSize;

		// for drawing atom labels
		options.textBoxXAlignment = Kekule.Render.BoxXAlignment.CENTER;
		options.textBoxYAlignment = Kekule.Render.BoxYAlignment.CENTER;

		//this.getRenderCache(context).appliedOptions = options;

		// iterate through nodes to see whether node label need to be set
		var nodes = chemObj.getExposedNodes();
		for (var i = 0, l = nodes.length; i < l; ++i)
		{
			var node = nodes[i];
			var needDrawLabel = this._needNodeDrawLabel(node, options);
			//node[this.NODE_NEED_LABEL_FIELD] = needDrawLabel;
			this.setObjNeedDrawLabel(context, node, needDrawLabel);
		}
	},
	/*
	 * @private
	 * @deprecated
	 */
	/*
	generateRichTextDrawOptions: function(renderConfigs, inheritedRenderOptions)
	{
		var ops = Kekule.Render.RenderOptionUtils.extractRichTextDraw2DOptions(renderConfigs, inheritedRenderOptions || {});
		ops.textBoxXAlignment = Kekule.Render.BoxXAlignment.CENTER;
		ops.textBoxYAlignment = Kekule.Render.BoxYAlignment.CENTER;
		return ops;
	},
	*/
	/*
	 * @private
	 * @deprecated
	 */
	/*
	generateChargeDrawOptions: function(renderConfigs, inheritedRenderOptions)
	{
		var inherited = inheritedRenderOptions || {};
		var op = {
				'showCharge': true,
				'chargeMarkType': oneOf(inherited.chargeMarkType, renderConfigs.getMoleculeDisplayConfigs().getDefChargeMarkType()),
				'chargeMarkFontSize': oneOf(inherited.chargeMarkFontSize, renderConfigs.getLengthConfigs().getChargeMarkFontSize()),
				'chargeMarkMargin': oneOf(inherited.chargeMarkMargin, renderConfigs.getLengthConfigs().getChargeMarkMargin()),
				'chargeMarkCircleWidth': oneOf(inherited.chargeMarkCircleWidth, renderConfigs.getLengthConfigs().getChargeMarkCircleWidth()),
				'partialChargeDecimalsLength': oneOf(inherited.partialChargeDecimalsLength, renderConfigs.getMoleculeDisplayConfigs().getPartialChargeDecimalsLength()),
				'color': oneOf(inherited.atomColor, inherited.color, renderConfigs.getColorConfigs().getAtomColor()),
				'opacity': oneOf(inherited.opacity, renderConfigs.getGeneralConfigs().getDrawOpacity()),
				'unitLength': oneOf(inherited.unitLength, renderConfigs.getLengthConfigs().getUnitLength())
			};
		return op;
	},
	*/
	/*
	 * @private
	 * @deprecated
	 */
	/*
	generateConnectorDrawOptions: function(renderConfigs, inheritedRenderOptions)
	{
		var inherited = inheritedRenderOptions || {};
		var op = renderConfigs.getLengthConfigs().toHash();
		op.color = oneOf(inherited.bondColor, inherited.color, renderConfigs.getColorConfigs().getBondColor());
		op.opacity = oneOf(inherited.opacity, renderConfigs.getGeneralConfigs().getDrawOpacity());
		op.atomLabelBoxExpandRatio = oneOf(inherited.atomLabelBoxExpandRatio, renderConfigs.getLengthConfigs().getAtomLabelBoxExpandRatio());
		return op;
	},
	*/

	/** @private */
	handleNodeSpecifiedRenderOptions: function($super, currObj, parentOptions)
	{
		var result = $super(currObj, parentOptions);
		// color
		//result.atomColor = oneOf(localOptions.atomColor, localOptions.color, result.atomColor, result.color);
		//result.atomColor = oneOf(localOptions.atomColor, result.atomColor);
		//result.color = result.atomColor;
		result.color = result.color || result.atomColor;
		// font
		//result.atomFontFamily = oneOf(localOptions.atomFontFamily, localOptions.fontFamily, result.atomFontFamily, result.fontFamily);
		//result.atomFontFamily = oneOf(localOptions.atomFontFamily, result.atomFontFamily);
		//console.log(localOptions.atomFontFamily, localOptions.fontFamily, result.atomFontFamily, result.fontFamily)
		//result.fontFamily = result.atomFontFamily || result.fontFamily;
		result.fontFamily = result.fontFamily || result.atomFontFamily;
		//result.atomFontSize = oneOf(localOptions.atomFontSize, localOptions.fontSize, result.atomFontSize, result.fontSize);
		//result.atomFontSize = oneOf(localOptions.atomFontSize, result.atomFontSize);
		//result.fontSize = result.atomFontSize || result.fontSize;
		result.fontSize = result.fontSize || result.atomFontSize;
		//console.log(result.atomFontSize, result.fontSize, localOptions, parentOptions);
		return result;
	},
	/** @private */
	handleConnectorSpecifiedRenderOptions: function($super, currObj, parentOptions)
	{
		/*
		var localOptions = (currObj.getOverriddenRenderOptions? currObj.getOverriddenRenderOptions(): null) || {};
		var result = Object.create(parentOptions);
		result = Object.extend(result, localOptions);
		*/
		var result = $super(currObj, parentOptions);
		// color
		//result.bondColor = oneOf(localOptions.bondColor, localOptions.color, result.bondColor, result.color);
		//result.bondColor = oneOf(localOptions.bondColor, result.bondColor);
		//result.color = result.bondColor;
		result.color = result.color || result.bondColor;
		return result;
	},


	/*
	 * Check if an object (connector or node) should be hidden from context.
	 * @param {Object} obj
	 * @param {Object} drawOptions
	 * @returns {Bool}
	 * @private
	 */
	/*
	_needObjHidden: function(context, obj, drawOptions)
	{
		if (obj instanceof Kekule.ChemStructureConnector)
			return this._needConnectorHidden(obj, drawOptions);
		else
			return this._needNodeHidden(obj, drawOptions);
	},
	_needNodeHidden: function(context, node, drawOptions)
	{
		// H should be hidden in implict hydrogen display mode
		var r = (node instanceof Kekule.Atom)
			&& (node.getAtomicNumber() === 1)
			&& (node.getMassNumber() === 1)
			&& (!node.getCharge());

		if (r)
		{
			var hDisplayLevel = this._getNodeHydrogenDisplayLevel(node, drawOptions.moleculeDisplayType);
			var HDL = Kekule.Render.HydrogenDisplayLevel;
		}
	},
	_needConnectorHidden: function(context, connector, drawOptions)
	{
		var r = this._isSimpleDefaultBond(connector);
		if (r)
		{
			// one end is hidden, the bond should also be hidden
			for (var i = 0, l = connector.getConnectedObjCount(); i < l;++i)
			{
				var obj = connector.getConnectedObjAt(i);
				if (this.getObjHidden(context, obj))
				{
					r = true;
					break;
				}
			}
		}
		return r;
	},
	_isSimpleDefaultBond: function(connector)
	{
		var r = connector instanceof Kekule.Bond;
		if (r)
		{
			r = (connector.getBondType() === Kekule.BondType.DEFAULT)
				&& (connector.getBondOrder() === Kekule.BondOrder.DEFAULT)
				&& (connector.getConnectedObjCount() === 2);
		}
		return r;
	},
	*/

	/**
	 * Draw a node on context.
	 * @param {Object} context
	 * @param {Object} group
	 * @param {Object} node
	 * @param {Object} parentChemObj
	 * @param {Object} options
	 * @param {Object} finalTransformOptions
	 * @returns {Object} A rendered object.
	 * @private
	 */
	doDrawNode: function(context, group, node, parentChemObj, options, finalTransformOptions)
	{
		var result;
		var boundInfo;
		var coord = this.getTransformedCoord2D(context, node, finalTransformOptions.allowCoordBorrow);
		//var renderConfigs = this.getRenderConfigs();

		var nodeRenderOptions = this.handleNodeSpecifiedRenderOptions(node, options);

		//var nodeRenderOptions = Kekule.Render.RenderOptionUtils.mergeObjLocalRenderOptions(node, options);

		//var richTextDrawOptions = Object.create(this.getRenderCache(context).richTextDrawOptions);

		var atomicNumber = node.getAtomicNumber? node.getAtomicNumber(): 0;
		var localOptions = node.getOverriddenRenderOptions() || {};
		//var localColor = localOptions.atomColor || localOptions.color;
		var localColor = localOptions.color || localOptions.atomColor;
		var atomSpecifiedColor = Kekule.Render.RenderColorUtils.getColor(atomicNumber, this.getRendererType());
		if (atomicNumber <= 0)  // not a real atom, may be subgroup or peseudo atom, etc.
		{
			var atomTypeName = node.getClassLocalName();
			atomSpecifiedColor = Kekule.Render.RenderColorUtils.getColor(atomTypeName, this.getRendererType());
		}
		var defColor = localColor ||
			(nodeRenderOptions.useAtomSpecifiedColor?
					atomSpecifiedColor:
				nodeRenderOptions.color);
		//console.log(defColor);
		nodeRenderOptions.color = defColor;
		/*
		nodeRenderOptions.fontFamily = nodeRenderOptions.atomFontFamily || nodeRenderOptions.fontFamily;
		nodeRenderOptions.fontSize = nodeRenderOptions.atomFontSize || nodeRenderOptions.fontSize;
		*/

		/*
		var localLabelDrawOptions = Object.create(options);
		localLabelDrawOptions = Object.extend(localLabelDrawOptions, Kekule.Render.RenderOptionUtils.getNodeLabelDrawOptions(node.getRenderOptions()));
		if (localLabelDrawOptions)
		{
			richTextDrawOptions = Object.extend(richTextDrawOptions, localLabelDrawOptions);
		}
		*/

		//if (!this._needNodeDrawLabel(node))
		if (this.getObjNeedDrawLabel(context, node))  // draw label and charge
		{
			/*
			 var localOptions = node.getRenderOptions() || {};
			 var renderOptions = Object.extend(renderConfigs, localOptions);
			 */
			// if a label is drawn, all hydrogens should be marked
			var hdisplayLevel = Kekule.Render.HydrogenDisplayLevel.ALL; //this._getNodeHydrogenDisplayLevel(node);
			//console.log(hdisplayLevel);
			var label = node.getDisplayRichText(hdisplayLevel, true, nodeRenderOptions.displayLabelConfigs /*renderConfigs.getDisplayLabelConfigs()*/, nodeRenderOptions.partialChargeDecimalsLength, nodeRenderOptions.chargeMarkType);

			// decide charDirection
			//label.charDirection = Kekule.ObjUtils.isUnset(nodeRenderOptions.charDirection) ? this._decideNodeLabelCharDirection(context, node) : nodeRenderOptions.charDirection;
			//console.log('nodeCharDirection', nodeRenderOptions.charDirection);
			//label.charDirection = !nodeRenderOptions.charDirection ? this._decideNodeLabelCharDirection(context, node) : nodeRenderOptions.charDirection;
			var labelCharDirection = !nodeRenderOptions.charDirection ? this._decideNodeLabelCharDirection(context, node) : nodeRenderOptions.charDirection;

			// recalc font size to px
			//richTextDrawOptions.fontSize *= localLabelDrawOptions.unitLength || renderConfigs.getLengthConfigs().getUnitLength();
			nodeRenderOptions.fontSize *= nodeRenderOptions.unitLength;
			//console.log('font size', nodeRenderOptions.fontSize);
			//console.log('drawLabel', label);
			/*
			if (nodeRenderOptions.textBoxXAlignment !== Kekule.Render.BoxXAlignment.CENTER)
				console.log('draw node label', nodeRenderOptions);
			*/
			//console.log('draw node label', nodeRenderOptions, label);
			var actualDrawOptions = Object.create(nodeRenderOptions);
			actualDrawOptions.charDirection = labelCharDirection;
			var elemEx = this.drawRichText(context, coord, label,
					actualDrawOptions/*nodeRenderOptions/*richTextDrawOptions*/);
			var elem = elemEx.drawnObj;
			var rect = elemEx.boundRect;
			// change boundInfo to a rect
			boundInfo = this.createRectBoundInfo({x: rect.left, y: rect.top}, {x: rect.left + rect.width, y: rect.top + rect.height});
			//console.log(rect);
			result = elem;
		}
		else
		{
			var nodeCoreElem, chargeElem;
			if (this.getObjNeedDrawDot(context, node) && Kekule.ObjUtils.isUnset(nodeRenderOptions.atomRadius))
			{
				nodeRenderOptions.atomRadius = nodeRenderOptions.allenCenterAtomRadius;
			}
			if (nodeRenderOptions.atomRadius)
			{
				var radius = nodeRenderOptions.atomRadius * nodeRenderOptions.unitLength;
				nodeRenderOptions.strokeColor = nodeRenderOptions.color;
				nodeRenderOptions.fillColor = nodeRenderOptions.color;
				nodeCoreElem = this.drawCircle(context, coord, radius, nodeRenderOptions);
				boundInfo = this.createCircleBoundInfo(coord, radius);
			}
			else
				boundInfo = this.createPointBoundInfo(coord);
			if (node.getCharge() || node.getRadical()) // draw charge or radical
			{
				/*
				var chargeOptions = this.getRenderCache(context).chargeDrawOptions;
				var localOptions = Kekule.Render.RenderOptionUtils.getChargeDrawOptions(node.getRenderOptions());
				var chargeOptions = Object.extend(chargeOptions, localOptions);

				var elemEx = this.doDrawElectronStateMark(context, group, node,
					chargeOptions.chargeMarkType,
					richTextDrawOptions.fontFamily,
					chargeOptions.chargeMarkFontSize * chargeOptions.unitLength,
					chargeOptions.chargeMarkMargin * chargeOptions.unitLength,
					chargeOptions.chargeMarkCircleWidth * chargeOptions.unitLength,
					chargeOptions.color, chargeOptions.opacity);
				*/
				var elemEx = this.doDrawElectronStateMark(context, group, node,
					nodeRenderOptions.chargeMarkType,
					nodeRenderOptions.partialChargeDecimalsLength,
					nodeRenderOptions.fontFamily,
					nodeRenderOptions.chargeMarkFontSize * nodeRenderOptions.unitLength,
					nodeRenderOptions.chargeMarkMargin * nodeRenderOptions.unitLength,
					nodeRenderOptions.chargeMarkCircleWidth * nodeRenderOptions.unitLength,
					nodeRenderOptions.color, nodeRenderOptions.opacity, nodeRenderOptions.zoom || 1);
				if (elemEx)
					chargeElem = elemEx.drawnObj;
			}
			if (nodeCoreElem && chargeElem)
			{
				result = this.createDrawGroup(context);
				this.addToDrawGroup(result, nodeCoreElem);
				this.addToDrawGroup(result, chargeElem);
			}
			else
				result = nodeCoreElem || chargeElem;
		}

		if (result)
		{
			this.setObjDrawElem(context, node, result);
			if (group)
				this.addToDrawGroup(result, group);
		}
		else
			this.setObjDrawElem(context, node, null);

		this.addRenderedObj(context, node);

		this.basicDrawObjectUpdated(context, node, parentChemObj, boundInfo, Kekule.Render.ObjectUpdateType.ADD);
		//console.log(boundInfo);
		return result;
	},
	/**
	 * Get font size of a node. If no specified size set in renderOptions, global size will be used.
	 * @private
	 */
	_getNodeFontSize: function(context, node, drawOptions)
	{
		if (!drawOptions)
			drawOptions = this.getRenderCache(context).appliedOptions || this.getRenderCache(context).options;
		var localLabelDrawOptions = Kekule.Render.RenderOptionUtils.getNodeLabelDrawOptions(node.getOverriddenRenderOptions()) || {};
		//return oneOf(localLabelDrawOptions.atomFontSize, localLabelDrawOptions.fontSize, drawOptions.atomFontSize, drawOptions.fontSize);
		return oneOf(localLabelDrawOptions.fontSize, drawOptions.fontSize, drawOptions.atomFontSize);
	},
	/**
	 * Get hydrogen display level of a node. If no specified size set in renderOptions, global setting will be used.
	 * @private
	 */
	_getNodeHydrogenDisplayLevel: function(node, drawOptions)
	{
		//if (this.getMoleculeDisplayType() === Kekule.Render.MoleculeDisplayType.CONDENSED)  // condensed, need display all hydrogens defaultly
		var localRenderOptions = node.getOverriddenRenderOptions();
		var localLevel = Kekule.Render.RenderOptionUtils.getHydrogenDisplayLevel(localRenderOptions);
		var hdisplayLevel = Kekule.ObjUtils.notUnset(localLevel)?
			localLevel:
			((drawOptions.moleculeDisplayType === Kekule.Render.MoleculeDisplayType.CONDENSED)?
					Kekule.Render.HydrogenDisplayLevel.ALL:
					drawOptions.hydrogenDisplayLevel);
					//this.getRenderConfigs().getMoleculeDisplayConfigs().getDefHydrogenDisplayLevel());
		return hdisplayLevel;
	},

	/**
	 * Check if a node is carbon atom between two multiple (double) bonds,
	 * so that a explicit dot should be drawn to avoid confusions in outlook.
	 * @param {Object} context
	 * @param {Object} node
	 * @param {Hash} drawOptions
	 * @private
	 */
	_needNodeDrawDot: function(context, node, drawOptions)
	{
		var renderOps = node.getOverriddenRenderOptions();
		if (!(node instanceof Kekule.Atom))
			return false;
		else if (node.getAtomicNumber() !== Kekule.Render.DEF_ATOM_ATOMIC_NUM)
			return false;
		else  // C atom
		{
			if (this.getObjNeedDrawLabel(context, node))
				return false;
			var connectors = node.getLinkedBonds();
			if (connectors.length === 2)
			{
				var bonds = node.getLinkedMultipleBonds();
				if (bonds.length === 2)
				{
					// we have two multiple bonds
					if (bonds[0].getBondOrder() === bonds[1].getBondOrder())
					{
						var bondOrder = bonds[0].getBondOrder();
						return bondOrder >= BO.DOUBLE && bondOrder < BO.EXPLICIT_AROMATIC;
					}
				}
			}
			return false;
		}
	},

	/**
	 * Check if a node label should be drawn.
	 * @param {Object} node
	 * @private
	 */
	_needNodeDrawLabel: function(node, drawOptions)
	{
		var U = Kekule.Render.RenderOptionUtils;
		var NM = Kekule.Render.NodeLabelDisplayMode;
		var renderOps = node.getOverriddenRenderOptions();

		var nodeLabelMode = U.getNodeDisplayMode(renderOps)
			|| drawOptions.nodeDisplayMode;
			//|| U.getNodeDisplayMode(/*this.getInheritedRenderOptions()*/drawOptions);
			//|| this.getRenderConfigs().getMoleculeDisplayConfigs().getDefNodeDisplayMode();
		if (!(node instanceof Kekule.ChemStructureNode))
			return false;
		if (nodeLabelMode === NM.HIDDEN)
			return false;
		else if (nodeLabelMode === NM.SHOWN)
			return true;
		else // smart
 		{
			var molDisplayType = drawOptions.moleculeDisplayType;  //this.getMoleculeDisplayType();
			if (molDisplayType === Kekule.Render.MoleculeDisplayType.CONDENSED)
				return true;
			else  // bond-line
			{
				var connectors = node.getLinkedConnectors();
				if (connectors.length <= 0)  // no connectors connected, a standalone node, label must be drawn
					return true;
				if ((node instanceof Kekule.Atom)
					&& (node.getAtomicNumber() === Kekule.Render.DEF_ATOM_ATOMIC_NUM)
					&& (!node.getMassNumber()))  // is a normal C atom
				{
					/*
					if ((node.getCharge() > 1) || (node.getCharge() < -1))  // has more than one charge, show label defaultly
						return true;
					*/

					// if custom label is set, must shown
					if (node.getRenderOption('customLabel'))
						return true;

					var hDisplayLevel = this._getNodeHydrogenDisplayLevel(node, drawOptions);
					var HDL = Kekule.Render.HydrogenDisplayLevel;
					if ((hDisplayLevel === HDL.ALL) || (hDisplayLevel === HDL.NONE))
					{
						return true;
					}
					else if (hDisplayLevel === HDL.UNMATCHED_EXPLICIT)
					{
						return (node.getImplicitHydrogenCount() !== node.getExplicitHydrogenCount());
					}
					else  // explicit
						return Kekule.ObjUtils.notUnset(node.getExplicitHydrogenCount());
				}
				else  // other atoms or groups need label draw
					return true;
			}
		}
	},

	/**
	 * Check if there are connectors to some direction in node.
	 * @param {Array} linkedObjCoords
	 * @param {Int} direction Value from {@link Kekule.Render.TextDirection}.
	 * @param {Float} threshold
	 * @returns {Bool}
	 */
	_isNodeHasConnectorToDirection: function(linkedObjCoords, direction, threshold)
	{
		if (Kekule.ObjUtils.isUnset(threshold))
			threshold = 1/5;
		for (var i = 0, l = linkedObjCoords.length; i < l; ++i)
		{
			var coord = linkedObjCoords[i];
			if ((direction === D.LTR) && (coord.x > threshold))
				return true;
			else if ((direction === D.RTL) && (coord.x < -threshold))
				return true;
			if ((direction === D.TTB) && (coord.y > threshold))
				return true;
			else if ((direction === D.BTT) && (coord.y < -threshold))
				return true;
		}
		return false;
	},
	/** @private */
	_calcConnectorVectorWeight: function(coords)
	{
		var totalX = 0;
		var totalY = 0;

		/** @ignore */
		var weightValues = function(x, y)
			{
				var maxValue = 100;
				{
					if (y == 0)
						return maxValue;
					else
						return Math.min(maxValue, Math.pow(x / y, 2));
				}
			};
		var fixedWeightX = 1;
		var fixedWeightY = 1;

		for (var i = 0, l = coords.length; i < l; ++i)
		{
			totalX += coords[i].x * weightValues(coords[i].x, coords[i].y) * fixedWeightX;
			totalY += coords[i].y * weightValues(coords[i].y, coords[i].x) * fixedWeightY;
		}

		return {'x': totalX, 'y': totalY};
	},
	/** @private */
	_calcConnectorVectorOfNode: function(context, node)
	{
		var result = {'x': 0, 'y': 0};
		var linkedObjCoords = this._getStandardizedLinkedObjRelCoords(context, node, null);
		for (var i = 0, l = linkedObjCoords.length; i < l; ++i)
		{
			result.x += linkedObjCoords[i].x;
			result.y += linkedObjCoords[i].y;
		}
		if (result.x === result.y === 0)
			result = {'x': 1, 'y': 0};
		return result;
	},
	/** @private */
	_calcVectorAxisDirection: function(vector)
	{
		var absX = Math.abs(vector.x);
		var absY = Math.abs(vector.y);
		if (absX >= absY)
			return (vector.x > 0)? D.LTR: D.RTL;
		else
			return (vector.y > 0)? D.TTB: D.BTT;
	},
	/**
	 * Get the automatic direction of node label. This direction should avoid bonds as well as possible.
	 * @param {Object} node
	 * @returns {Int} Value from {@link Kekule.Render.TextDirection}.
	 * @private
	 */
	_decideNodeLabelCharDirection: function(context, node)
	{
		var linkedObjCoords = this._getStandardizedLinkedObjRelCoords(context, node, null);

		var D = Kekule.Render.TextDirection;
		var directions = [D.LTR, D.RTL, D.TTB, D.BTT];
		var result;

		for (var i = 0, l = directions.length; i < l; ++i)
		{
			if (!this._isNodeHasConnectorToDirection(linkedObjCoords, directions[i]))
				return directions[i];
		}

		// all direction has connectors, further calculate
		var connectorVectorWeight = this._calcConnectorVectorWeight(linkedObjCoords);
		if (Math.abs(connectorVectorWeight.x) > Math.abs(connectorVectorWeight.y))
		{
			if (connectorVectorWeight.x <= 0)
				result = D.LTR;
			else
				result = D.RTL;
		}
		else
		{
			if (connectorVectorWeight.y <= 0)
				result = D.TTB;
			else
				result = D.BTT;
		}
		return result;
	},

	/**
	 * Returns an array of connector angles ( to X-axis ) of node.
	 * @param {Object} node
	 * @returns {Array}
	 * @private
	 */
	_calcConnectorAnglesOfNode: function(context, node)
	{
		var result = [];
		var linkedObjCoords = this._getStandardizedLinkedObjRelCoords(context, node, null);
		for (var i = 0, l = linkedObjCoords.length; i < l; ++i)
		{
			var c = linkedObjCoords[i];
			var angle = Math.atan2(c.y, c.x);
			if (angle < 0)
				angle = Math.PI * 2 + angle;
			result.push(angle);
		}
		result.sort();
		return result;
	},
	/**
	 * Get the emptiest direction around node. Returns angle of that direction.
	 * @param {Object} node
	 * @returns {Float}
	 * @private
	 */
	_getMostEmptyDirectionAngleOfNode: function(context, node)
	{
		var angles = this._calcConnectorAnglesOfNode(context, node);
		var l = angles.length;
		if (l === 0)
			return 0;
		else if (l === 1)  // only one connector
			return -angles[0]
		else  // more than two connectors
		{
			var max = 0;
			var index = 0;
			for (var i = 0; i < l; ++i)
			{
				var a1 = angles[i];
				var a2 = angles[(i + 1) % l];
				var delta = a2 - a1;
				if (delta < 0)
					delta += Math.PI * 2;
				if (delta > max)
				{
					max = delta;
					index = i;
				}
			}
			return angles[index] + max / 2;
		}
	},

	/**
	 * Draw charge mark (such as +, 2-) and radical mark (./..) on node, especially on C atom in skeletal formula.
	 * @private
	 */
	doDrawElectronStateMark: function(context, group, node, markType, partialChargeDecimalsLength, markFontFamily, markFontSize, markMargin, circleStrokeWidth, color, opacity, zoom)
	{
		var charge = node.getCharge();
		var radical = node.getRadical();
		var slabel = '';
		/*
		if (!charge)
			return null;
		*/

		/*
		var markType = options.chargeMarkType;
		var markSize = options.chargeMarkSize * options.unitLength;
		*/
		if ((!partialChargeDecimalsLength) || (Math.abs(charge) > Math.pow(10, -partialChargeDecimalsLength) / 2))
		{
			var widthCircleBorder = markType === Kekule.Render.ChargeMarkRenderType.CIRCLE_AROUND;
			// decide mark text
			// charge
			var isCircled = (markType === Kekule.Render.ChargeMarkRenderType.CIRCLE_AROUND);
			if (charge === 1)
				slabel = isCircled? '\u2295': '+';
			else if (charge === -1)
				slabel = isCircled? '\u2296': '\u2212';  //'-';
			else
			{
				var sCharge = partialChargeDecimalsLength? Kekule.NumUtils.toDecimals(Math.abs(charge), partialChargeDecimalsLength): Math.abs(charge).toString();
				slabel = sCharge + ((charge > 0)? '+': '\u2212' /*'-'*/);
			}
		}

		// radical
		if (radical)
		{
			//slabel += (radical === Kekule.RadicalOrder.DOUBLET)? '•': '••';
			slabel += Kekule.Render.ChemDisplayTextUtils.getRadicalDisplayText(radical);
		}

		if (!slabel)
			return null;

		var coord = this.getTransformedCoord2D(context, node);

		//console.log(slabel);

		// decide direction
		/*
		var vector = this._calcConnectorVectorOfNode(context, node);
		//console.log(vector);
		vector.x = -vector.x; vector.y = -vector.y;
		var vectorLength = Math.sqrt(Math.sqr(vector.x) + Math.sqr(vector.y));
		*/
		var dirAngle = this._getMostEmptyDirectionAngleOfNode(context, node);
		var vector = {'x': Math.cos(dirAngle), 'y': Math.sin(dirAngle)};
		var vectorLength = 1;
		// decide position
		//var markVectorLength = markMargin /* + markFontSize * chargeText.length*/;
		var ratio = markMargin / vectorLength;
		var markCoord = {'x': vector.x * ratio , 'y': vector.y * ratio};
		//console.log(markCoord);
		//alert(chargeText);
		markCoord = Kekule.CoordUtils.add(coord, markCoord);
		//markCoord = coord;

		var BXA = Kekule.Render.BoxXAlignment;
		var BYA = Kekule.Render.BoxYAlignment;
		var tboxXAlign, tboxYAlign;
		tboxXAlign = BXA.CENTER; tboxYAlign = BYA.CENTER;
		/*
		var textDirection = this._calcVectorAxisDirection(vector);

		switch (textDirection)
		{
			case D.LTR: tboxXAlign = BXA.LEFT; tboxYAlign = BYA.CENTER; break;
			case D.RTL: tboxXAlign = BXA.RIGHT; tboxYAlign = BYA.CENTER; break;
			case D.TTB: tboxXAlign = BXA.CENTER; tboxYAlign = BYA.TOP; break;
			case D.BTT: tboxXAlign = BXA.CENTER; tboxYAlign = BYA.BOTTOM; break;
		}
		*/

		var elem = this.drawText(context, markCoord, slabel, {
			'fontFamily': markFontFamily,
			'fontSize': markFontSize,
			'color': color,
			'opacity': opacity,
			'textBoxXAlignment': tboxXAlign,
			'textBoxYAlignment': tboxYAlign,
			'zoom': zoom || 1
		});
		/*
		//alert(textDirection);

		/*
		var chargeGroup, drawCircle;
		// draw text and circle
		if (((charge === 1) || (charge === -1)) &&
		(markType === Kekule.Render.ChargeMarkRenderType.CIRCLE_AROUND))
		{
			chargeGroup = this.doCreateGroup(context);
			drawCircle = true;
		}
		if (chargeGroup)
		{
			this.doAddToGroup(elem, chargeGroup);
			if (drawCircle)
			{
				var circleRadius = markFontSize / 2;
				var ratio = circleRadius / vectorLength;
				var baseCoord = {'x': vector.x * ratio , 'y': vector.y * ratio};
				var baseCoord = Kekule.CoordUtils.add(coord, baseCoord);
				elem = this.doDrawCircle(context, baseCoord, circleRadius,
					circleStrokeWidth, color);
				this.addToGroup(elem, chargeGroup);
			}
			return chargeGroup;
		}
		else
		*/
		return elem;
	},

	/**
	 * Draw a connector (bond) connecting node1 and node2 with a specified shape on context.
	 * @param {Object} context
	 * @param {Kekule.ChemStructureConnector} connector
	 * @param {Kekule.ChemStructureNode} node1
	 * @param {Kekule.ChemStructureNode} node2
	 * @param {Hash} renderOptions
	 * @param {Hash} finalTransformOptions
	 * @private
	 */
	doDrawConnectorShape: function(context, connector, node1, node2, renderOptions, finalTransformOptions)
	{
		var CU = Kekule.CoordUtils;
		//var globalOptions = this.getRenderConfigs().getLengthConfigs().toHash();
		//globalOptions.color = this.getRenderConfigs().getColorConfigs().getConnectorColor();
		/*
		var globalOptions = this.getRenderCache(context).connectorDrawOptions;
		var renderOptions = Object.create(globalOptions);
		var localRenderOptions = connector.getRenderOptions();
		var localOptions = Kekule.Render.RenderOptionUtils.getConnectorDrawParams(localRenderOptions);
		if (localOptions)
			renderOptions = Object.extend(renderOptions, localOptions);
		*/

		var coord1 = Object.extend({}, this.getTransformedCoord2D(context, node1, finalTransformOptions.allowCoordBorrow));
		var coord2 = Object.extend({}, this.getTransformedCoord2D(context, node2, finalTransformOptions.allowCoordBorrow));
		var nodes = [node1, node2];
		var coords = [coord1, coord2];
		var originDistance = CU.getDistance(coord1, coord2);
		var shrinkedDistance = 0;

		var unitLength = renderOptions.unitLength || 1;

		var lineLength = Math.sqrt(Math.sqr(coord2.x - coord1.x) + Math.sqr(coord2.y - coord1.y));
		var lineAdjustCoordDeltas = [];
		// line length scale ratio
		var doLineLengthScale = false, lineLengthScaleBaseNodeIndex;
		var lineLengthScaleRatio = renderOptions.bondLengthScaleRatio;
		if (Kekule.ObjUtils.notUnset(lineLengthScaleRatio))
		{
			var lineVector = CU.substract(coord2, coord1);
			doLineLengthScale = true;
			lineLengthScaleBaseNodeIndex = (lineLengthScaleRatio > 0)? 0: 1;
			var shrinkRatio = 1 - (Math.abs(lineLengthScaleRatio || 1));
			var sign = (lineLengthScaleBaseNodeIndex === 1)? -1: 1;
			//var sign = 1;
			lineAdjustCoordDeltas[lineLengthScaleBaseNodeIndex] = CU.multiply(lineVector, sign * shrinkRatio);
		}
		// node label eclipse line
		if (this.getObjNeedDrawLabel(context, node1) || this.getObjNeedDrawLabel(context, node2)) // the connector should avoid overlap with node label
		{
			//var expandRatio = this.getRenderConfigs().getLengthConfigs().getAtomLabelBoxExpandRatio();
			var expandRatio = renderOptions.atomLabelBoxExpandRatio;
			var halfLabelBoxWidth, halfLabelBoxHeight;
			var crossOnVerticalEdge;
			// line projection on X/Y axis
			var lineXPrj = coord2.x - coord1.x;
			var lineYPrj = coord2.y - coord1.y;
			var xSign = (lineXPrj >= 0)? 1: -1;
			var ySign = (lineYPrj >= 0)? 1: -1;
			var isVerticalLine = (lineXPrj === 0);
			if (!isVerticalLine)
				var angleTg = Math.abs(lineYPrj / lineXPrj);
			if (Math.abs(lineXPrj) >= Math.abs(lineYPrj))  // bond line cross with label box in vertical edge
				crossOnVerticalEdge = true;
			else  // cross in horizontal edge
				crossOnVerticalEdge = false;

			for (var i = 0, l = nodes.length; i < l; ++i)
			{
				var node = nodes[i];
				var coord = coords[i];
				var coordDelta = null;
				if (this.getObjNeedDrawLabel(context, node))
				{
					var fSize = this._getNodeFontSize(context, node) * (finalTransformOptions.zoom || 1);
					halfLabelBoxWidth = halfLabelBoxHeight = fSize * unitLength * expandRatio / 2;

					if (crossOnVerticalEdge)
					{
						/*
						coord.x += halfLabelBoxWidth * xSign;
						coord.y += halfLabelBoxWidth * angleTg * ySign;
						*/
						coordDelta = {'x': halfLabelBoxWidth * xSign, 'y': halfLabelBoxWidth * angleTg * ySign};
					}
					else
					{
						if (!isVerticalLine)
						{
							/*
							coord.y += halfLabelBoxHeight * ySign;
							coord.x += halfLabelBoxHeight / angleTg * xSign;
							*/
							coordDelta = {'x': halfLabelBoxHeight / angleTg * xSign, 'y': halfLabelBoxHeight * ySign};
						}
						else
						{
							/*
							coord.y += halfLabelBoxHeight * ySign;
							*/
							coordDelta = {'x': 0, 'y': halfLabelBoxHeight * ySign};
						}
					}
					if (coordDelta)
					{
						// compare with scale delta
						var scaleCoordDelta = lineAdjustCoordDeltas[i];
						if (scaleCoordDelta && (Math.abs(lineLengthScaleRatio) <= 1))  // if scale ratio > 1, the line will exceed atom label and must be cut
						{
							if (Math.abs(coordDelta.x) > Math.abs(scaleCoordDelta.x) || Math.abs(coordDelta.y) > Math.abs(scaleCoordDelta.y))
							  lineAdjustCoordDeltas[i] = coordDelta;
						}
						else
							lineAdjustCoordDeltas[i] = coordDelta;

						/*
						shrinkedDistance += CU.getDistance(coordDelta, {'x': 0, 'y': 0});
						var newCoord = CU.add(coord, coordDelta);
						coord.x = newCoord.x;
						coord.y = newCoord.y;
            */
					}
				}
				xSign *= -1;
				ySign *= -1;
			}
		}

		//console.log(coords, lineAdjustCoordDeltas, lineLengthScaleBaseNodeIndex);
		for (var i = 0, l = coords.length; i < l; ++i)
		{
			var coord = coords[i];
			var coordDelta = lineAdjustCoordDeltas[i];
			if (coordDelta)
			{
				shrinkedDistance += CU.getDistance(coordDelta, {'x': 0, 'y': 0});
				var newCoord = CU.add(coord, coordDelta);
				coord.x = newCoord.x;
				coord.y = newCoord.y;
			}
		}

		if (shrinkedDistance >= originDistance)  // label box too huge, can not draw connector shape
		{
			return null;
		}

		// calculate stroke / color and other styles
		var strokeWidth = (renderOptions.bondLineWidth || renderOptions.strokeWidth || 1) * (renderOptions.unitLength || 1);
		/*
		if (lineParams[0].isBold)
			strokeWidth *= renderOptions.boldBondLineWidthRatio;
		*/
		renderOptions.strokeWidth = strokeWidth;

		/*
		// temp
		//var elem = this.doDrawConnectorLine(context, coord1, coord2, 1, style);
		var elem = this.doDrawSymmetryLineConnector(context, node1, node2, coord1, coord2, lineLength, 3, false, true, localRenderOptions);
		return elem;
		*/


		// firstly decide draw type of connector
		var renderType = renderOptions.renderType; // Kekule.Render.RenderOptionUtils.getConnectorRenderType(localRenderOptions);
		var allowedTypes = Kekule.Render.ConnectorDrawUtils.getPossibleConnectorRenderTypes(connector);
		if (Kekule.ObjUtils.isUnset(renderType) || (allowedTypes.indexOf(renderType) < 0))  // render type in options is not available
			renderType = allowedTypes[0];  // use default type instead
		// different renderType may need different methods to draw
		var result;

		if (this.isLineBasedConnector(renderType))
		{
			result = this.doDrawLineBasedConnector(context, renderType, node1, node2,
				coord1, coord2, lineLength, renderOptions);
		}
		else if (this.isTriangleBasedConnector(renderType))
		{
			result = this.doDrawTriangleBasedConnector(context, renderType, node1, node2,
				coord1, coord2, lineLength, renderOptions);
		}
		else if (this.isTriangleHashBasedConnector(renderType))
		{
			result = this.doDrawTriangleHashBasedConnector(context, renderType, node1, node2,
				coord1, coord2, lineLength, renderOptions);
		}
		else if (this.isRectangleBasedConnector(renderType))
		{
			result = this.doDrawRectangleBasedConnector(context, renderType, node1, node2,
				coord1, coord2, lineLength, renderOptions);
		}
		else if (this.isWavyBasedConnector(renderType))
		{
			result = this.doDrawWavyBasedConnector(context, renderType, node1, node2,
				coord1, coord2, lineLength, renderOptions);
		}

		return result;
	},

	/** @private */
	_lineBasedConnectorTypes: [RT.SINGLE, RT.DOUBLE, RT.TRIPLE, RT.QUAD,
			RT.SCISSORS_DOUBLE,
			RT.BOLD, RT.BOLD_DOUBLE, RT.BOLD_TRIPLE,
			RT.DASHED, RT.DASHED_DOUBLE, RT.DASHED_TRIPLE, RT.SOLID_DASH, RT.BOLD_DASH,
			RT.ARROWED],
	_triangleBasedConnectorTypes: [RT.WEDGED_SOLID, RT.WEDGED_SOLID_INV,
			RT.WEDGED_HOLLOW, RT.WEDGED_HOLLOW_INV],
	_triangleHashBasedConnectorTypes: [RT.WEDGED_HASHED, RT.WEDGED_HASHED_INV, RT.HASHED],
	_rectangleBasedConnectorTypes: [RT.WEDGED_SOLID_BOTH, RT.WEDGED_HOLLOW_BOTH],
	/**
	 * Check if a connector's render type is based on line and can be drawn by doDrawLineBasedConnector.
	 * @param {Int} renderType
	 * @returns {Bool}
	 * @private
	 */
	isLineBasedConnector: function(renderType)
	{
		return (this._lineBasedConnectorTypes.indexOf(renderType) >= 0);
	},
	/**
	 * Check if a connector's render type is based on triangle and can be drawn by doDrawTriangleBasedConnector.
	 * @param {Int} renderType
	 * @returns {Bool}
	 * @private
	 */
	isTriangleBasedConnector: function(renderType)
	{
		return (this._triangleBasedConnectorTypes.indexOf(renderType) >= 0);
	},
	/**
	 * Check if a connector's render type is based on triangle hash and can be drawn by doDrawTrangleHashBasedConnector.
	 * @param {Int} renderType
	 * @returns {Bool}
	 * @private
	 */
	isTriangleHashBasedConnector: function(renderType)
	{
		return (this._triangleHashBasedConnectorTypes.indexOf(renderType) >= 0);
	},
	/**
	 * Check if a connector's render type is based on rectangle and can be drawn by doDrawRectangleBasedConnector.
	 * @param {Int} renderType
	 * @returns {Bool}
	 * @private
	 */
	isRectangleBasedConnector: function(renderType)
	{
		return (this._rectangleBasedConnectorTypes.indexOf(renderType) >= 0);
	},
	/**
	 * Check if a connector's render type is based on wavy line and can be drawn by doDrawWavyBasedConnector.
	 * @param {Int} renderType
	 * @returns {Bool}
	 * @private
	 */
	isWavyBasedConnector: function(renderType)
	{
		return renderType = RT.WAVY;
	},

	/**
	 * Draw line shape connectors.
	 * @param {Object} context
	 * @param {Object} node1
	 * @param {Object} node2
	 * @param {Object} coord1
	 * @param {Object} coord2
	 * @param {Float} lineLength
	 * @param {Object} options
	 * @returns {Object}
	 * @private
	 */
	doDrawLineBasedConnector: function(context, renderType, node1, node2, coord1, coord2, lineLength, options)
	{
		var lineParams = [];
		var param = {'isBold': false, 'isDash': false};
		var boldParam = {'isBold': true, 'isDash': false};
		var dashParam = {'isBold': false, 'isDash': true};
		switch (renderType)
		{
			case RT.DOUBLE:
			case RT.SCISSORS_DOUBLE: for (var i = 0; i < 2; ++i, lineParams.push(param)); break;
			case RT.TRIPLE: for (var i = 0; i < 3; ++i, lineParams.push(param)); break;
			case RT.QUAD: for (var i = 0; i < 4; ++i, lineParams.push(param)); break;
			case RT.BOLD: lineParams.push(boldParam); break;
			case RT.BOLD_DOUBLE: lineParams.push(boldParam); lineParams.push(param); break;
			case RT.BOLD_TRIPLE: lineParams.push(boldParam); for (var i = 0; i < 2; ++i, lineParams.push(param)); break;
			case RT.BOLD_QUAD: lineParams.push(boldParam); for (var i = 0; i < 3; ++i, lineParams.push(param)); break;
			case RT.DASHED: lineParams.push(dashParam); break;
			case RT.DASHED_DOUBLE: for (var i = 0; i < 2; ++i, lineParams.push(dashParam)); break;
			case RT.DASHED_TRIPLE: for (var i = 0; i < 3; ++i, lineParams.push(dashParam)); break;
			// TODO: which side is dash need to be further calculated for aromatic bond
			case RT.SOLID_DASH: lineParams.push(param); lineParams.push(dashParam); break;
			case RT.BOLD_DASH: lineParams.push(boldParam); lineParams.push(dashParam); break;
			case RT.ARROWED: param.isArrow = true; lineParams.push(param); break;
			case RT.SINGLE:
			default:
				lineParams.push(param);
		}
		var isCross = renderType === RT.SCISSORS_DOUBLE;
		return this.doDrawSymmetryLineConnector(context, node1, node2, coord1, coord2, lineLength, lineParams, isCross, options);
	},
	/** @private */
	doDrawSymmetryLineConnector: function(context, node1, node2, coord1, coord2, lineLength, lineParams, isCross, options)
	{
		var lineCount = lineParams.length;

		var group = null, line = null;

		if (lineCount === 1) // only one line
		{
			// draw first center line
			var strokeWidth = options.strokeWidth;
			if (lineParams[0].isBold)
				strokeWidth *= options.boldBondLineWidthRatio;

			var arrowParams = null;
			if (lineParams[0].isArrow)
			{
				arrowParams = {'width': options.bondArrowWidth * options.unitLength, 'length': options.bondArrowLength * options.unitLength};
			}

			var ops = {
				'strokeWidth': strokeWidth,
				'strokeColor': Kekule.Render.RenderOptionUtils.getColor(options),
				'strokeDash': lineParams[0].isDash,
				'opacity': options.opacity
			};
			//console.log('draw line options', ops);

			var line = this.drawArrowLine(context, coord1, coord2, arrowParams, ops);
			var boundInfo = this.createLineBoundInfo(coord1, coord2, strokeWidth);
		}
		else if (lineCount > 1) // multiple lines, create group
		{
			group = this.createDrawGroup(context);

			var lineGap = options.multipleBondSpacingAbs?
				options.multipleBondSpacingAbs:
				options.multipleBondSpacingRatio * lineLength;
			if (options.multipleBondMaxAbsSpacing)
				lineGap = Math.min(lineGap, options.multipleBondMaxAbsSpacing);
			lineGap *= options.unitLength;
			var w = coord2.x - coord1.x;
			var h = coord2.y - coord1.y;
			var actualLineLength = Math.sqrt(Math.sqr(w) + Math.sqr(h));
			var angleSin = h / actualLineLength;
			var angleCos = w / actualLineLength;
			var lastLineWidth = 0;
			//var adjusts = [0, 1, -1];

			// calculate line offset adjustment
			// positive value means to right side of curr direction, negative value means left side
			var adjusts = [];
			var initialBondAlign = 1;
			if (!(lineCount & 1))  // line count is even, must decide which direction should put one more lines
			{
				if (isCross)  // cross multiple bonds, always align to center
					initialBondAlign = 0;
				else
					initialBondAlign = Kekule.ObjUtils.isUnset(lineParams.bondAlign)?
						this._decideEvenBondAlign(context, node1, node2):
						lineParams.bondAlign;
				//console.log(initialBondAlign);
			}
			for (var i = 0; i < lineCount; ++i)
			{
				if (Kekule.ObjUtils.notUnset(lineParams[i].offsetAdjust))
					adjusts.push(lineParams[i].offsetAdjust);
				else  // calculate automatically
				{
					if ((i === 0) && (initialBondAlign !== 0))
						adjusts.push(0);
					else
					{
						var sign = (i & 1) ? 1 : -1; //(i mod 2)
						//if (lineCount & 1) // line count is odd, in other word, a set of symmetric lines
						if (initialBondAlign !== 0)  // not a symmetry double bond
						{
							var offsetAdjust = initialBondAlign * sign * ((i + 1) >> 1);
						}
						else // symmetry double bond and so on
						{
							var offsetAdjust = ((i >> 1) * 1 + 0.5) * sign;
						}
						adjusts.push(offsetAdjust);
					}
				}
			}

			var currGap = lineGap;

			if (currGap > maxGap)
				maxGap = currGap;
			if (currGap < minGap)
				minGap = currGap;

			var averCoord1 = {'x': 0, 'y': 0};
			var averCoord2 = {'x': 0, 'y': 0};
			var maxGap = 0, minGap = 0;

			var realDrawParams = [];
			for (var i = 0; i < lineCount; ++i)
			{
				var localOptions = Object.create(options);
				var deltaX = currGap * angleSin;
				var deltaY = currGap * angleCos;
				var newCoord1 = {
					'x': coord1.x - deltaX * adjusts[i],
					'y': coord1.y + deltaY * adjusts[i]
				};
				var newCoord2 = {
					'x': coord2.x - deltaX * adjusts[i],
					'y': coord2.y + deltaY * adjusts[i]
				};
				averCoord1 = Kekule.CoordUtils.add(averCoord1, newCoord1);
				averCoord2 = Kekule.CoordUtils.add(averCoord2, newCoord2);

				var arrowParams = null;
				if (lineParams[i].isArrow)
				{
					arrowParams = {
						'width': options.bondArrowWidth * options.unitLength,
						'length': options.bondArrowLength * options.unitLength
					};
				}
				var strokeWidth = options.strokeWidth;
				if (lineParams[i].isBold)
					strokeWidth *= options.boldBondLineWidthRatio;

				localOptions.strokeColor = options.color;
				localOptions.strokeDash = lineParams[i].isDash;

				/*
				var line = this.drawArrowLine(context, newCoord1, newCoord2, arrowParams, localOptions);
				this.addToDrawGroup(line, group);
				*/
				realDrawParams.push({
					'coord1': newCoord1,
					'coord2': newCoord2,
					'arrowParams': arrowParams,
					'drawOptions': localOptions
				});
				if (lineParams[i].isBold)
					currGap = lineGap + Math.floor(strokeWidth / 2);
				else
					currGap = lineGap;
			}

			// do real draw
			if (isCross)
			{
				//var middleLineIndex = (lineCount % 1)? (lineCount >> 1) + 1: null;
				for (var i = 0; i < lineCount; ++i)
				{
					var currPartParam = realDrawParams[i];
					var counterPartParam = realDrawParams[lineCount - i - 1];
					var line = this.drawArrowLine(context, currPartParam.coord1, counterPartParam.coord2, currPartParam.arrowParams, currPartParam.drawOptions);
					this.addToDrawGroup(line, group);
				}
			}
			else
			{
				for (var i = 0; i < lineCount; ++i)
				{
					var realParam = realDrawParams[i];
					var line = this.drawArrowLine(context, realParam.coord1, realParam.coord2, realParam.arrowParams, realParam.drawOptions);
					this.addToDrawGroup(line, group);
				}
			}

			averCoord1 = Kekule.CoordUtils.divide(averCoord1, lineCount);
			averCoord2 = Kekule.CoordUtils.divide(averCoord2, lineCount);
			var boundInfo = this.createLineBoundInfo(averCoord1, averCoord2, maxGap - minGap);
		}

		var result = {'element': group || line, 'boundInfo': boundInfo};
		return result;
	},
	/** @private */
	_getStandardizedLinkedObjRelCoords: function(context, node, excludeNode)
	{
		var result = [];
		var baseCoord = this.getTransformedCoord2D(context, node);
		//var linkedObjs = node.getLinkedObjs();
		var linkedObjs = node.getLinkedExposedObjs();
		for (var i = 0, l = linkedObjs.length; i < l; ++i)
		{
			var obj = linkedObjs[i];
			if (obj === excludeNode)
				continue;
			var coord = this.getTransformedCoord2D(context, obj);
			var newCoord = Kekule.CoordUtils.substract(coord, baseCoord);
			/*
			var len = Math.sqrt(Math.sqr(newCoord.x) + Math.sqr(newCoord.y));
			newCoord = {'x': newCoord.x / len, 'y': newCoord.y / len}
			*/
			newCoord = Kekule.CoordUtils.standardize(newCoord);
			result.push(newCoord);
		}
		return result;
	},
	/**
	 * Calculate how to align a double bond automatically.
	 * @param {Object} context
	 * @param {Object} node1
	 * @param {Object} node2
	 * @returns {Int} 1 (align to x/y increasing direction) or -1 (align to x/y decreasing direction) or 0 (align center).
	 */
	_decideEvenBondAlign: function(context, node1, node2)
	{
		var bondVector = Kekule.CoordUtils.substract(this.getTransformedCoord2D(context, node2),
			this.getTransformedCoord2D(context, node1));
		bondVector = Kekule.CoordUtils.standardize(bondVector);

		//var sign = -Math.sign(bondBox.x) * Math.sign(bondBox.y);
		// indicate this is a rather steep or gentle line
		//var sign = (Math.abs(bondBox.y) > Math.abs(bondBox.x))? -1: 1;

		var coords1 = this._getStandardizedLinkedObjRelCoords(context, node1, node2);
		var coords2 = this._getStandardizedLinkedObjRelCoords(context, node2, node1);
		var sumAlign = 0;
		var sumVector = {'x': 0, 'y': 0};
		for (var i = 0, l = coords1.length; i < l; ++i)
		{
			sumAlign += this._calcSinglePointAlign(coords1[i], bondVector);
			sumVector.x += coords1[i].x;
			sumVector.y += coords1[i].y;
		}
		for (var i = 0, l = coords2.length; i < l; ++i)
		{
			sumAlign += this._calcSinglePointAlign(coords2[i], bondVector);
			sumVector.x += coords2[i].x;
			sumVector.y += coords2[i].y;
		}
		if (sumAlign !== 0)
			return Math.sign(sumAlign);
		else
			return this._calcSinglePointAlign(sumVector, bondVector);

		/*
		var l = Math.sqrt(Math.sqr(sumX) + Math.sqr(sumY));
		sumX /= l;
		sumY /= l;
		//console.log(sumX, sumY, l);
		l = Math.sqrt(Math.sqr(bondBox.x) + Math.sqr(bondBox.y));
		bondBox.x /= l;
		bondBox.y /= l;
		var absSumX = Math.abs(sumX) - Math.abs(bondBox.x);
		var absSumY = Math.abs(sumY) - Math.abs(bondBox.y);

		//console.log(sumX, sumY, bondBox);

		var delta = absSumX - absSumY;
		console.log(delta);
		var thredhold = 1e-3;
		if (delta > thredhold)
		{
			return ((sumX >= 0)? 1: -1) * (-Math.sign(bondBox.y));
		}
		else if (delta < -thredhold)
		{
			return ((sumY >= 0)? 1: -1) * (Math.sign(bondBox.x));
		}
		else  // equal
			return 0;
		*/
	},

	/** @private */
	_calcSinglePointAlign: function(coord, baseVector)
	{
		var result;
		var thredhold = 1e-4;
		if (Math.abs(baseVector.x) < thredhold) // base vector is vertical line
		{
			if (Math.abs(coord.x) < thredhold)
				result = 0;
			else
				result = -Math.sign(coord.x) * Math.sign(baseVector.y);
			return result;
		}
		else
		{
			var y = baseVector.y * coord.x / baseVector.x;
			var delta = coord.y - y;
			if (delta > thredhold)
				result = 1
			else if (delta < -thredhold)
				result = -1
			else
				result = 0;
			result *= Math.sign(baseVector.x);
			return result;
		}
	},

	/**
	 * Draw triangle shape connectors.
	 * @param {Object} context
	 * @param {Object} node1
	 * @param {Object} node2
	 * @param {Object} coord1
	 * @param {Object} coord2
	 * @param {Float} lineLength
	 * @param {Object} options
	 * @returns {Object}
	 * @private
	 */
	doDrawTriangleBasedConnector: function(context, renderType, node1, node2, coord1, coord2, lineLength, options)
	{
		var isFilled = (renderType === RT.WEDGED_SOLID) || (renderType === RT.WEDGED_SOLID_INV);
		var isInverted = (renderType === RT.WEDGED_SOLID_INV) || (renderType === RT.WEDGED_HOLLOW_INV);
		var baseCoords = isInverted? [coord2, coord1]: [coord1, coord2];
		var w = options.bondWedgeWidth * options.unitLength;
		/*
		var bondBox = Kekule.CoordUtils.substract(baseCoords[1], baseCoords[0]);
		var len = Math.sqrt(Math.sqr(bondBox.x) + Math.sqr(bondBox.y));
		var angleSin = bondBox.y / len;
		var angleCos = bondBox.x / len;
		var coords = [baseCoords[0]];  // start point of triangle

		coords.push({'x': baseCoords[1].x + w * angleSin, 'y': baseCoords[1].y - w * angleCos});
		coords.push({'x': baseCoords[1].x - w * angleSin, 'y': baseCoords[1].y + w * angleCos});
		*/
		var coords = this._calcTriangleBaselineCoords(baseCoords[0], baseCoords[1], w);

		var localOptions = Object.create(options);
		localOptions.strokeColor = options.color;
		localOptions.fillColor = isFilled? options.color: null;

		//var result = this.doDrawTiangle(context, coords[0], coords[1], coords[2], options.strokeWidth);
		var elem = this.drawTriangle(context, baseCoords[0], coords[0], coords[1],
			/*
			{
				'strokeWidth': options.strokeWidth,
				'strokeColor': options.color,
				'fillColor': isFilled? options.color: null,
				'opacity': options.opacity
			}*/localOptions);
		var result = {'element': elem};
		result.boundInfo = this.createLineBoundInfo(baseCoords[0], baseCoords[1], w);
		return result;
	},
	/**
	 * Draw triangle hash shape connectors.
	 * @param {Object} context
	 * @param {Object} node1
	 * @param {Object} node2
	 * @param {Object} coord1
	 * @param {Object} coord2
	 * @param {Float} lineLength
	 * @param {Object} options
	 * @returns {Object}
	 * @private
	 */
	doDrawTriangleHashBasedConnector: function(context, renderType, node1, node2, coord1, coord2, lineLength, options)
	{
		var isInverted = (renderType === RT.WEDGED_HASHED_INV);
		var isTriangle = (renderType !== RT.HASHED);
		var baseCoords = isInverted? [coord2, coord1]: [coord1, coord2];
		var gap = options.hashSpacing * options.unitLength;
		var maxWidth = options.bondWedgeWidth * options.unitLength;
		var minWidth = (isTriangle)?
			options.bondWedgeHashMinWidth * options.unitLength:
			maxWidth;
		var deltaW = maxWidth - minWidth;
		var box = Kekule.CoordUtils.substract(baseCoords[1], baseCoords[0]);
		var totalLength = Math.sqrt(Math.sqr(box.x) + Math.sqr(box.y));
		var hashCount = Math.floor(totalLength / gap);
		var group = this.createDrawGroup(context);

		var localOptions = Object.create(options);
		localOptions.strokeColor = options.color;

		// draw hash lines
		for (var i = 0; i < hashCount; ++i)
		{
			//if (i === 0)  // first point, should be a point, not a line
			var l = gap * i;
			var ratio = l / totalLength;
			var stepCoord = {'x': box.x * ratio, 'y': box.y * ratio};
			stepCoord = Kekule.CoordUtils.add(stepCoord, baseCoords[0]);
			var baselineCoords = this._calcTriangleBaselineCoords(baseCoords[0], stepCoord, deltaW * ratio + minWidth);
			var elem = this.drawLine(context, baselineCoords[0], baselineCoords[1],
				/*
				{
					'strokeWidth': options.strokeWidth,
					'strokeColor': options.color,
					'opacity': options.opacity
				}*/localOptions);
			this.addToDrawGroup(elem, group);
		}
		var result = {'element': group};
		result.boundInfo = this.createLineBoundInfo(baseCoords[0], baseCoords[1], maxWidth);
		return result;
	},
	/** @private */
	_calcTriangleBaselineCoords: function(vertexCoord, midPointCoord, baseLineWidth)
	{
		var box = Kekule.CoordUtils.substract(midPointCoord, vertexCoord);
		var len = Math.sqrt(Math.sqr(box.x) + Math.sqr(box.y));
		var angleSin = box.y / len;
		var angleCos = box.x / len;
		var w = baseLineWidth / 2;
		var result = [];
		result.push({'x': midPointCoord.x + w * angleSin, 'y': midPointCoord.y - w * angleCos});
		result.push({'x': midPointCoord.x - w * angleSin, 'y': midPointCoord.y + w * angleCos});
		return result;
	},

	/**
	 * Draw rectangle shape connectors.
	 * @param {Object} context
	 * @param {Object} node1
	 * @param {Object} node2
	 * @param {Object} coord1
	 * @param {Object} coord2
	 * @param {Float} lineLength
	 * @param {Object} options
	 * @returns {Object}
	 * @private
	 */
	doDrawRectangleBasedConnector: function(context, renderType, node1, node2, coord1, coord2, lineLength, options)
	{
		//console.log('draw rectangle connector');
		var isFilled = (renderType === RT.WEDGED_SOLID_BOTH);
		var w = options.bondWedgeWidth * options.unitLength;

		var coords = this._calcRectangleCornerCoords(coord1, coord2, w);

		var localOptions = Object.create(options);
		localOptions.strokeColor = options.color;
		localOptions.fillColor = isFilled? options.color: null;

		var path = Kekule.Render.DrawPathUtils.makePath(
			'M', [coords[0].x, coords[0].y],
			'L', [coords[1].x, coords[1].y],
			'L', [coords[2].x, coords[2].y],
			'L', [coords[3].x, coords[3].y],
			'Z'
		);
		var elem = this.drawPath(context, path, localOptions);
		var result = {'element': elem};
		result.boundInfo = this.createLineBoundInfo(coord1, coord2, w);
		return result;
	},
	/** @private */
	_calcRectangleCornerCoords: function(end1Coord, end2Coord, baseLineWidth)
	{
		var box = Kekule.CoordUtils.substract(end2Coord, end1Coord);
		var len = Math.sqrt(Math.sqr(box.x) + Math.sqr(box.y));
		var angleSin = box.y / len;
		var angleCos = box.x / len;
		var w = baseLineWidth / 2;
		var result = [];
		var delta = {'x': w * angleSin, 'y': w * angleCos};
		result.push({'x': end1Coord.x + delta.x, 'y': end1Coord.y - delta.y});
		result.push({'x': end1Coord.x - delta.x, 'y': end1Coord.y + delta.y});
		result.push({'x': end2Coord.x - delta.x, 'y': end2Coord.y + delta.y});
		result.push({'x': end2Coord.x + delta.x, 'y': end2Coord.y - delta.y});
		return result;
	},

	/**
	 * Draw wavy shape connectors.
	 * @param {Object} context
	 * @param {Object} node1
	 * @param {Object} node2
	 * @param {Object} coord1
	 * @param {Object} coord2
	 * @param {Float} lineLength
	 * @param {Object} options
	 * @returns {Object}
	 * @private
	 */
	doDrawWavyBasedConnector: function(context, renderType, node1, node2, coord1, coord2, lineLength, options)
	{
		var CU = Kekule.CoordUtils;
		var refRadius = options.bondWavyRadius * options.unitLength;
		/*
		var dx = coord2.x - coord2.x;
		var dy = coord2.y - coord1.y;
		*/
		var bondLength = CU.getDistance(coord1, coord2);
		var arcCount = Math.round(bondLength / refRadius);
		var coordDelta = CU.divide(CU.substract(coord2, coord1), arcCount);
		var arcRadius = bondLength / arcCount;

		var pathParams = [];
		var beginCoord;
		var endCoord = coord1;
		var angle = Math.atan2(coordDelta.y, coordDelta.x) + Math.PI;
		var controlPointDelta = {
			'x': arcRadius / 1.5 * Math.sin(angle),
			'y': -arcRadius / 1.5  * Math.cos(angle)
		};
		//var controlPointDelta = {'x': 0, 'y': 20};
		var sign = 1;
		for (var i = 0; i < arcCount; ++i)
		{
			sign = -sign
			beginCoord = endCoord;
			endCoord = CU.add(beginCoord, coordDelta);
			var c = CU.multiply(controlPointDelta, sign);
			var ctrlCoord1 = CU.add(beginCoord, c);
			var ctrlCoord2 = CU.add(endCoord, c);

			if (i === 0)
			{
				pathParams.push('M');
				pathParams.push([beginCoord.x, beginCoord.y]);
			}
			pathParams.push('C');
			pathParams.push([ctrlCoord1.x, ctrlCoord1.y, ctrlCoord2.x, ctrlCoord2.y, endCoord.x, endCoord.y]);
		}

		var path = Kekule.Render.DrawPathUtils.makePath.apply(Kekule.Render.DrawPathUtils, pathParams);

		var localOptions = Object.create(options);
		localOptions.strokeColor = options.color;
		localOptions.fillColor = null;

		//var result = this.doDrawTiangle(context, coords[0], coords[1], coords[2], options.strokeWidth);
		var elem = this.drawPath(context, path, localOptions);
		var result = {'element': elem};
		result.boundInfo = this.createLineBoundInfo(coord1, coord2, arcRadius);
		return result;
	}
});

/**
 * Class to render for {@link Kekule.StructureFragment}.
 * The class will use {@link Kekule.Render.ChemCtab2DRenderer} or {@link Kekule.Render.Formula2DRenderer} to draw actual structure.
 * @class
 * @augments Kekule.Render.ChemObj2DRenderer
 *
 * @param {Kekule.ChemObject} chemObj Object to be drawn.
 * @param {Object} drawBridge A object that implements the actual draw job.
 * @param {Object} renderConfigs Global configuration for rendering.
 *   This property should be an instance of {@link Kekule.Render.Render2DConfigs}.
 * //@param {Int} moleculeDisplayType Display type of molecule of current ctab.
 * @param {Kekule.ObjectEx} parent Parent object of this renderer, usually another renderer or an instance of {@link Kekule.Render.ChemObjPainter}, or null.
 *
 * //@property {Int} moleculeDisplayType Display type of molecule.
 */
Kekule.Render.StructFragment2DRenderer = Class.create(Kekule.Render.ChemObj2DRenderer,
/** @lends Kekule.Render.StructFragment2DRenderer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.StructFragment2DRenderer',
	/** @constructs */
	initialize: function($super, chemObj, drawBridge, /*renderConfigs,*/ parent)
	{
		$super(chemObj, drawBridge, /*renderConfigs,*/ parent);

		this._concreteRenderer = null;
		this._concreteChemObj = null;

		this.initConcreteRenderer();
		//this.setMoleculeDisplayType(moleculeDisplayType || Kekule.Render.MoleculeDisplayType.BOND_LINE);
	},
	finalize: function($super)
	{
		$super();
		if (this._concreteRenderer)
		{
			this._concreteRenderer.finalize();
			this._concreteRenderer = null;
		}
	},
	/** @private */
	initConcreteRenderer: function()
	{
		var chemObj = this.getChemObj();
		var drawBridge = this.getDrawBridge();
		if (this._isRendererMismatch(this._concreteRenderer, chemObj) && this._concreteRenderer)
		{
			this._concreteRenderer.finalize();
			this._concreteRenderer = null;
			this._concreteChemObj = null;
		}
		if (!this._concreteRenderer && chemObj)
		{
			if (chemObj.hasCtab())
			{
				this._concreteChemObj = chemObj.getCtab();
				this._concreteRenderer = new Kekule.Render.ChemCtab2DRenderer(chemObj.getCtab(), drawBridge, /*renderConfigs,*/ this);
			}
			else if (chemObj.hasFormula())
			{
				this._concreteChemObj = chemObj.getFormula();
				this._concreteRenderer = new Kekule.Render.Formula2DRenderer(chemObj.getFormula(), drawBridge, /*renderConfigs,*/ this);
			}
		}
		return this._concreteRenderer;
	},
	/** @private */
	_isRendererMismatch: function(renderer, chemObj)
	{
		return (renderer && !chemObj) ||
			((renderer instanceof Kekule.Render.ChemCtab2DRenderer) && !chemObj.hasCtab()) ||
			((renderer instanceof Kekule.Render.Formula2DRenderer) && !chemObj.hasFormula());
	},
	/** @private */
	getConcreteRenderer: function()
	{
		this.initConcreteRenderer();
		return this._concreteRenderer;
	},
	/** @private */
	/*
	initProperties: function()
	{
		this.defineProp('moleculeDisplayType',
			{
				'dataType': DataType.INT, 'serializable': false,
				'getter': function()
					{
						if (this._concreteRenderer.getMoleculeDisplayType)
							return this._concreteRenderer.getMoleculeDisplayType();
						else
							return null;
					},
				'setter': function(value)
					{
						if (this._concreteRenderer.setMoleculeDisplayType)
							return this._concreteRenderer.setMoleculeDisplayType(value);
						else
							return null;
					}
			});
	},
	*/

	/** @private */
	/*
	doEstimateObjBox: function(context, options)
	{
		return this._concreteRenderer.estimateObjBox(context, options);
	},
	*/
	/** @private */
	/*
	doEstimateRenderBox: function(context, baseCoord, options)
	{
		return this._concreteRenderer.estimateRenderBox(context, baseCoord, options);
	},
	*/

	//* @private */
	/*
	applyConfigs: function()
	{
		this._concreteRenderer.setRenderConfigs(this.getRenderConfigs());
		this._concreteRenderer.setDrawBridge(this.getDrawBridge());
	},
	*/

	/** @ignore */
	getRenderCache: function($super, context)
	{
		return $super(context);
		/*
		var r = this.getConcreteRenderer();
		return r? r.getRenderCache(context): {};
		*/
	},

	/** @private */
	_getConcreteRendererDrawOptions: function(options)
	{
		/*
		var ops = Object.create(options);
		var chemObj = this.getChemObj();
		var objOptions = (this.getRendererType() === Kekule.Render.RendererType.R3D)?
			chemObj.getOverriddenRender3DOptions(): chemObj.getOverriddenRenderOptions();

		ops = Object.extend(ops, objOptions || {});
		return ops;
		*/
		return options;
	},

	/** @ignore */
	isChemObjRenderedBySelf: function($super, context, obj)
	{
		var r = this.getConcreteRenderer();
		var result = $super(context, obj) || (obj === this.getChemObj()) || (r && r.isChemObjRenderedBySelf(context, obj));
		return result;
	},
	/** @ignore */
	isChemObjRenderedDirectlyBySelf: function($super, context, obj)
	{
		var r = this.getConcreteRenderer();
		return $super(context, obj) || (obj === this.getChemObj()) || (obj === this._concreteChemObj); // || (r && r.isChemObjRenderedDirectlyBySelf(context, obj));
	},

	/** @private */
	doSetRedirectContext: function($super, value)
	{
		$super(value);
		var r = this.getConcreteRenderer();
		if (r)
			r.setRedirectContext(value);
	},

	/** @ignore */
	doDraw: function($super, context, baseCoord, options)
	{
		//this.applyConfigs();

		$super(context, baseCoord, options);
		/*
		var transformOptions = this.calcActualTransformOptions(context, this.getChemObj(), baseCoord, options);
		var op = Object.create(options);
		op = Object.extend(op, transformOptions);
		op.baseOnRootCoord = false;
		console.log(options, op);
		*/

		var chemObj = this.getChemObj();
		var actualBaseCoord = baseCoord;
		var r = this.getConcreteRenderer();
		//console.log('actualBaseCoord before', actualBaseCoord, options.transformParams);
		if ((!actualBaseCoord) && (r instanceof Kekule.Render.Formula2DRenderer))  // need calc center coord for formula manually
		{
			if (chemObj.getAbsBaseCoord2D)
			{
				var coord = chemObj.getAbsBaseCoord2D(options.allowCoordBorrow);
				//console.log('chemObj coord', coord);
				actualBaseCoord = Kekule.CoordUtils.transform2D(coord, options.transformParams);
			}
			//console.log('actualBaseCoord', actualBaseCoord);
		}
		/*
		else
			console.log('baseCoord set', baseCoord);
		*/

		if (!chemObj.hasFormula() && !chemObj.hasCtab())  // no context, need not to draw
			return null;
		else if (r)
		{
			//console.log('concrete draw', r.getClassName(), options.partialDrawObjs, !!r.getRedirectContext());
			var op = Object.create(options);
			if (op.partialDrawObjs)  // molecule is a whole and can not be partial drawn
				op.partialDrawObjs = null;
			return r.draw(context, actualBaseCoord, this._getConcreteRendererDrawOptions(op));
		}
	},
	/** @ignore */
	doRedraw: function($super, context)
	{
		return $super(context);
		/*
		var r = this.getConcreteRenderer();
		if (r)
			return r.redraw(context);
		*/
	},
	/** @ignore */
	doUpdate: function(context, updatedObjDetails, updateType)
	{
		var objs = this._extractObjsOfUpdateObjDetails(updatedObjDetails);

		if (objs.indexOf(this.getChemObj()) >= 0)  // root object need to be updated
		{
			var p = this.getRenderCache(context);
			this.doClear(context);
			return this.draw(context, p.baseCoord, p.options);
		}

		var r = this.getConcreteRenderer();
		if (r)
			return r.doUpdate(context, updatedObjDetails, updateType);
	},
	/** @ignore */
	doClear: function(context)
	{
		var r = this.getConcreteRenderer();
		if (r)
			return r.clear(context);
	},
	/** @ignore */
	estimateRenderBox: function(context, baseCoord, options, allowCoordBorrow)
	{
		var r = this.getConcreteRenderer();
		if (r)
			return r.estimateRenderBox(context, baseCoord, this._getConcreteRendererDrawOptions(options), allowCoordBorrow);
		else
			return null;
	},
	/** @ignore */
	transformCoordToObj: function(context, chemObj, coord)
	{
		//console.log(chemObj, this.getChemObj(), chemObj === this.getChemObj());
		var obj = (this.getChemObj() === chemObj)? this._concreteChemObj: chemObj;
		var r = this.getConcreteRenderer();
		if (r)
			return r.transformCoordToObj(context, obj, coord);
		else
			return coord;
	},
	/** @ignore */
	transformCoordToContext: function(context, chemObj, coord)
	{
		//console.log(chemObj, this.getChemObj(), chemObj === this.getChemObj());
		var obj = (this.getChemObj() === chemObj)? this._concreteChemObj: chemObj;
		var r = this.getConcreteRenderer();
		if (r)
			return r.transformCoordToContext(context, obj, coord);
		else
			return coord;
	}
});

// Molecule renderer, actually an alias of structFragment renderer
Kekule.Render.Mol2DRenderer = Kekule.Render.StructFragment2DRenderer;

/**
 * Base class to render composite chem objects, such as composite molecule, chem space and so on.
 * The class will use concrete renderer for each child object inside.
 * @class
 * @augments Kekule.Render.ChemObj2DRenderer
 *
 * @param {Kekule.ChemObject} chemObj Object to be drawn.
 * @param {Object} drawBridge A object that implements the actual draw job.
 * @param {Object} renderConfigs Global configuration for rendering.
 *   This property should be an instance of {@link Kekule.Render.Render2DConfigs}.
 * @param {Kekule.ObjectEx} parent Parent object of this renderer, usually another renderer or an instance of {@link Kekule.Render.ChemObjPainter}, or null.
 */
Kekule.Render.CompositeObj2DRenderer = Class.create(Kekule.Render.ChemObj2DRenderer,
/** @lends Kekule.Render.CompositeObj2DRenderer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.CompositeObj2DRenderer'
	/* @constructs */
	/*
	initialize: function($super, chemObj, drawBridge, renderConfigs, parent)
	{
		$super(chemObj, drawBridge, renderConfigs, parent);
	}
	*/
});
Kekule.Render.RendererDefineUtils.addCompositeRenderSupport(Kekule.Render.CompositeObj2DRenderer);


/**
 * Class to render composite molecule.
 * @class
 * @augments Kekule.Render.CompositeObj2DRenderer
 */
Kekule.Render.CompositeMolecule2DRenderer = Class.create(Kekule.Render.CompositeObj2DRenderer,
/** @lends Kekule.Render.CompositeMolecule2DRenderer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.CompositeMolecule2DRenderer',

	/** @ignore */
	getChildObjs: function()
	{
		var r = [];
		var group = this.getChemObj().getSubMolecules();
		for (var i = 0, l = group.getItemCount(); i < l; ++i)
		{
			var o = group.getObjAt(i);
			r.push(o);
		}
		return r;
	}
});

/**
 * Class to render ChemObjList or ChemStructureObjectGroup.
 * @class
 * @augments Kekule.Render.CompositeObj2DRenderer
 */
Kekule.Render.ChemObjGroupList2DRenderer = Class.create(Kekule.Render.CompositeObj2DRenderer,
/** @lends Kekule.Render.CompositeMolecule2DRenderer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.CompositeMolecule2DRenderer',

	/** @ignore */
	getChildObjs: function()
	{
		var obj = this.getChemObj();
		if (obj instanceof Kekule.ChemObjList)
		{
			var r = [];
			for (var i = 0, l = obj.getItemCount(); i < l; ++i)
			{
				r.push(obj.getItemAt(i));
			}
		}
		else if (obj instanceof Kekule.ChemStructureObjectGroup)
		{
			r = obj.getAllObjs();
		}

		return r;
	}
});


/**
 * Class to render reactions.
 * @class
 * @augments Kekule.Render.CompositeObj2DRenderer
 */
Kekule.Render.Reaction2DRenderer = Class.create(Kekule.Render.CompositeObj2DRenderer,
/** @lends Kekule.Render.Reaction2DRenderer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.Reaction2DRenderer',

	/** @ignore */
	getChildObjs: function()
	{
		var r = [];
		var reaction = this.getChemObj();
		var r = [];
		// reactants
		for (var i = 0, l = reaction.getReactantCount(); i < l; ++i)
		{
			var o = reaction.getReactantAt(i);
			r.push(o);
		}
		// products
		for (var i = 0, l = reaction.getProductCount(); i < l; ++i)
		{
			var o = reaction.getProductAt(i);
			r.push(o);
		}
		return r;
		// TODO: currently the reagent is not considered
	}
});

/**
 * Class to render ChemSpaceElement instance.
 * The class will use concrete renderer for each child object inside.
 * @class
 * @augments Kekule.Render.CompositeObj2DRenderer
 *
 * @param {Kekule.ChemObject} chemObj Object to be drawn.
 * @param {Object} drawBridge A object that implements the actual draw job.
 * @param {Object} renderConfigs Global configuration for rendering.
 *   This property should be an instance of {@link Kekule.Render.Render2DConfigs}.
 */
Kekule.Render.ChemSpaceElement2DRenderer = Class.create(Kekule.Render.CompositeObj2DRenderer,
/** @lends Kekule.Render.ChemSpaceElement2DRenderer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.ChemSpaceElement2DRenderer',

	/** @ignore */
	getChildObjs: function()
	{
		var elem = this.getChemObj();
		return elem.getChildren().toArray();
	}
});


/**
 * Class to render ChemSpace instance.
 * The class will use concrete renderer for each child object inside.
 * @class
 * @augments Kekule.Render.CompositeObj2DRenderer
 *
 * @param {Kekule.ChemObject} chemObj Object to be drawn.
 * @param {Object} drawBridge A object that implements the actual draw job.
 * @param {Object} renderConfigs Global configuration for rendering.
 *   This property should be an instance of {@link Kekule.Render.Render2DConfigs}.
 */
Kekule.Render.ChemSpace2DRenderer = Class.create(Kekule.Render.CompositeObj2DRenderer,
/** @lends Kekule.Render.ChemSpace2DRenderer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.ChemSpace2DRenderer',

	/** @ignore */
	getChildObjs: function()
	{
		//return this.getChemObj().getRoot().getChildren().toArray();
		return [this.getChemObj().getRoot()];
	},

	/** @private */
	doEstimateObjBox: function($super, context, options, allowCoordBorrow)
	{
		var size = this.getChemObj().getSize2D();
		if (size.x && size.y && options.useExplicitSpaceSize)
		{
			var result = {
				'x1': 0,
				'y1': 0,
				'x2': size.x,
				'y2': size.y
			};
			//console.log('space box', result);
			return result;
		}
		else
			return $super(context, options, allowCoordBorrow);
	}

	/* @private */
	/*
	doDraw: function($super, context, baseCoord, options)
	{
		$super(context, baseCoord, options);

		var chemObj = this.getChemObj();
		var size = chemObj.getSize2D();
		var transformOptions = options.transformParams;

		var coord1 = Kekule.CoordUtils.transform2D({'x': 0, 'y': 0}, transformOptions);
		var coord2 = Kekule.CoordUtils.transform2D({'x': size.x, 'y': size.y}, transformOptions);


		var drawOptions = {
			'strokeColor': '#ff0000',
			'fillColor': '#00ff00',
			'opacity': 0.2
		};

		//console.log('draw space', coord1, coord2, transformOptions);
		//console.log('matrix', Kekule.CoordUtils.calcTransform2DMatrix(transformOptions));

		var result = this.drawRect(context, coord1, coord2, drawOptions);

		return result;
	}
	*/
});

// register renderers
Kekule.Render.Renderer2DFactory.register(Kekule.TextBlock, Kekule.Render.TextBlock2DRenderer);
Kekule.Render.Renderer2DFactory.register(Kekule.StructureFragment, Kekule.Render.StructFragment2DRenderer);
Kekule.Render.Renderer2DFactory.register(Kekule.CompositeMolecule, Kekule.Render.CompositeMolecule2DRenderer);
Kekule.Render.Renderer2DFactory.register(Kekule.Reaction, Kekule.Render.Reaction2DRenderer);
Kekule.Render.Renderer2DFactory.register(Kekule.ChemObjList, Kekule.Render.ChemObjGroupList2DRenderer);
Kekule.Render.Renderer2DFactory.register(Kekule.ChemStructureObjectGroup, Kekule.Render.ChemObjGroupList2DRenderer);
Kekule.Render.Renderer2DFactory.register(Kekule.ChemSpaceElement, Kekule.Render.ChemSpaceElement2DRenderer);
Kekule.Render.Renderer2DFactory.register(Kekule.ChemSpace, Kekule.Render.ChemSpace2DRenderer);

})();
