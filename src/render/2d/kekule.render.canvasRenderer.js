/**
 * @fileoverview
 * 2D renderer using HTML5 canvas.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.structures.js
 * requires /render/kekule.render.base.js
 * requires /render/kekule.render.baseTextRender.js
 * requires /render/2d/kekule.render.def2DRenderer.js
 */

"use strict";

/**
 * Render bridge class of HTML5 Canvas.
 * @class
 */
Kekule.Render.CanvasRendererBridge = Class.create(
/** @lends Kekule.Render.CanvasRendererBridge# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.CanvasRendererBridge',
	/** @private */
	DEF_DOUBLE_BUFFERED: false,
	/** @pirvate */
	SHADOW_CANVAS_FIELD: '__$shadow_canvas__',
	/** @private */
	SHADOW_CONTEXT_FIELD: '__$shadow_context__',

	/**
	 * Returns shadow canvas context for double buffered drawing.
	 * @param {Object} context
	 * @returns {Object}
	 * @private
	 */
	getShadowContext: function(context)
	{
		return context[this.SHADOW_CONTEXT_FIELD];
	},
	/** @private */
	getShadowCanvas: function(context)
	{
		return context[this.SHADOW_CANVAS_FIELD];
	},
	/**
	 * Returns a context that need to be drawn immediately.
	 * In normal state, this function just returns the canvas itself.
	 * In double buffered mode, this function will returns the shadow canvas context.
	 * @param {Object} context
	 * @returns {Object}
	 */
	getOperatingContext: function(context)
	{
		return this.getShadowContext(context) || context;
	},

	/**
	 * Create a context element for drawing.
	 * @param {Element} parentElem
	 * @param {Int} width Width of context, in px.
	 * @param {Int} height Height of context, in px.
	 * @param {Bool} doubleBuffered Whether use double buffer to make smooth drawing.
	 * @returns {Object} Context used for drawing.
	 */
	createContext: function(parentElem, width, height, id, doubleBuffered)
	{

		if (doubleBuffered === undefined)
			doubleBuffered = this.DEF_DOUBLE_BUFFERED;

		var doc = parentElem.ownerDocument;
		var canvas = document.createElement('canvas');
		if (id)
			canvas.id = id;
		/*
		if (width)
		{
			canvas.setAttribute('width', width);
			canvas.style.width = width + 'px';
		}
		if (height)
		{
			canvas.setAttribute('height', height);
			canvas.style.height = height + 'px';
		}
		*/
		parentElem.appendChild(canvas);

		var ctx = canvas.getContext('2d');
		if (doubleBuffered)
		{
			var shadowCanvas = document.createElement('canvas');
			shadowCanvas.style.position = 'absolute';
			shadowCanvas.style.display = 'none';
			parentElem.appendChild(shadowCanvas);
			ctx[this.SHADOW_CANVAS_FIELD] = shadowCanvas;
			ctx[this.SHADOW_CONTEXT_FIELD] = shadowCanvas.getContext('2d');
		}

		this.setContextDimension(ctx, width, height);

		return ctx;
	},

	/**
	 * Destroy context created.
	 * @param {Object} context
	 */
	releaseContext: function(context)
	{
		var canvas = context.canvas;
		var shadowCanvas = this.getShadowCanvas(context);
		var parent = canvas.parentNode;
		if (parent)
		{
			parent.removeChild(canvas);
			if (shadowCanvas)
				parent.removeChild(shadowCanvas);
		}
	},

	/**
	 * Get width and height of context.
	 * @param {Object} context
	 * @returns {Hash} {width, height}
	 */
	getContextDimension: function(context)
	{
		return {'width': context.canvas.width, 'height': context.canvas.height};
	},

	/**
	 * Set new width and height of context.
	 * Note in canvas, the content should be redrawn after resizing.
	 * @param {Object} context
	 * @param {Int} width
	 * @param {Int} height
	 */
	setContextDimension: function(context, width, height)
	{
		var shadowCanvas = this.getShadowCanvas(context);
		if (width)
		{
			//context.setAttribute('width', width);
			context.canvas.width = width;
			context.canvas.style.width = width + 'px';
			if (shadowCanvas)
			{
				shadowCanvas.width = width;
				shadowCanvas.style.width = width + 'px';
			}
		}
		if (height)
		{
			//context.setAttribute('height', height);
			context.canvas.height = height;
			context.canvas.style.height = height + 'px';
			if (shadowCanvas)
			{
				shadowCanvas.height = height;
				shadowCanvas.style.height = height + 'px';
			}
		}
		this.clearContext(context);
	},

	/**
	 * Get context related element.
	 * @param {Object} context
	 */
	getContextElem: function(context)
	{
		return context? context.canvas: null;
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
		var elem = context.canvas;
		elem.width = elem.width;
		var shadowCanvas = this.getShadowCanvas(context);
		if (shadowCanvas)
			shadowCanvas.width = shadowCanvas.width;

		var clearColor = context.__$clearColor__;
		if (clearColor)
		{
			context.save();
			try
			{
				var dim = this.getContextDimension(context);
				this.drawRect(context, {x: 0, y: 0}, {x: dim.width, y: dim.height}, {'fillColor': clearColor, 'strokeColor': clearColor});
			}
			finally
			{
				context.restore();
			}
		}
	},
	/** @private */
	setClearColor: function(context, color)
	{
		if (context)
			context.__$clearColor__ = color;
	},

	renderContext: function(context)
	{
		var shadowCanvas = this.getShadowCanvas(context);
		if (shadowCanvas)  // double buffering
		{
			//console.log('double buffered');
			context.drawImage(shadowCanvas, 0, 0);
		}
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

	// methods to draw graphics
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

	_drawDashLine: function(context, coord1, coord2, dashLen)
	{
		if (dashLen == undefined) dashLen = 5;
		/*
		if (context.setLineDash || (context.mozDash !== undefined))
		{
			if (context.mozDash !== undefined)
			{
				context.mozDash = [5, 10];
				context.moveTo(coord1.x, coord1.y);
				context.lineTo(coord2.x, coord2.y);
				context.mozDash = [];
			}
			else if (context.setLineDash)
			{
				console.log(dashLen);
				//context.setLineDash([dashLen]);
				context.setLineDash([5, 10]);
				context.moveTo(coord1.x, coord1.y);
				context.lineTo(coord2.x, coord2.y);
				context.setLineDash([]);
			}
		}
		*/
		/*
		if (context.setLineDash && (typeof(context.lineDashOffset) == "number"))
		{
			context.setLineDash([dashLen]);
			context.moveTo(coord1.x, coord1.y);
			context.lineTo(coord2.x, coord2.y);
			context.setLineDash([]);
		}
		else
		*/
		{
	    context.moveTo(coord1.x, coord1.y);

	    var dX = coord2.x - coord1.x;
	    var dY = coord2.y - coord1.y;
	    var dashes = Math.floor(Math.sqrt(dX * dX + dY * dY) / dashLen);
	    var dashX = dX / dashes;
	    var dashY = dY / dashes;

	    var q = 0;
	    var x1 = coord1.x;
	    var y1 = coord1.y;

	    while (q++ < dashes) {
	        x1 += dashX;
	        y1 += dashY;
	        context[q % 2 == 0 ? 'moveTo' : 'lineTo'](x1, y1);
	    }
	    context[q % 2 == 0 ? 'moveTo' : 'lineTo'](coord2.x2, coord2.y);
		}
	},

	drawLine: function(ctx, coord1, coord2, options)
	{
		var context = this.getOperatingContext(ctx);

		context.beginPath();
		this.setDrawStyle(context, options);
		if (options.strokeDash && (!this.isLineDashSupported(context)))
		{
			this._drawDashLine(context, coord1, coord2, options.strokeDash);
		}
		else
		{
			context.moveTo(coord1.x, coord1.y);
			context.lineTo(coord2.x, coord2.y);
		}
		this.doneDraw(context, options);
	},
	drawTriangle: function(ctx, coord1, coord2, coord3, options)
	{
		var context = this.getOperatingContext(ctx);

		context.beginPath()
		this.setDrawStyle(context, options);
		context.moveTo(coord1.x, coord1.y);
		context.lineTo(coord2.x, coord2.y);
		context.lineTo(coord3.x, coord3.y);
		context.closePath();
		this.doneDraw(context, options);
		/*
		var path = Kekule.Render.DrawPathUtils.makePath(
			'M', [coord1.x, coord1.y],
			'L', [coord2.x, coord2.y],
			'L', [coord3.x, coord3.y],
			'Z'
		);
		this.drawPath(context, path, options);
		*/
	},
	drawRect: function(ctx, coord1, coord2, options)
	{
		var context = this.getOperatingContext(ctx);

		context.beginPath();
		this.setDrawStyle(context, options);
		context.rect(coord1.x, coord1.y, coord2.x - coord1.x, coord2.y - coord1.y);
		this.doneDraw(context, options);
	},
	drawRoundRect: function(ctx, coord1, coord2, cornerRadius, options)
	{
		// TODO: temp, draw a normal rect than a round rect
		return this.drawRect(ctx, coord1, coord2, options);
	},
	drawCircle: function(ctx, baseCoord, radius, options)
	{
		var context = this.getOperatingContext(ctx);
		context.beginPath();
		this.setDrawStyle(context, options);
		context.arc(baseCoord.x, baseCoord.y, radius, 0, 2 * Math.PI, false);
		this.doneDraw(context, options);
	},

	_PATH_CMDS: ['M', 'Z', 'L', 'C', 'Q'],
	_PATH_METHODS: ['moveTo', 'closePath', 'lineTo', 'bezierCurveTo', 'quadraticCurveTo'],
	drawPath: function(ctx, path, options)
	{
		var context = this.getOperatingContext(ctx);

		if (path.length <= 0)
			return;

		context.beginPath();
		this.setDrawStyle(context, options);

		var pathArgs;
		for (var i = 0, l = path.length; i < l; ++i)
		{
			pathArgs = [];
			var item = path[i];
			var c = item.method.toUpperCase();
			var index = this._PATH_CMDS.indexOf(c);
			var method;
			// TODO: currently S, T and A are not implemented
			if (index >= 0)
			{
				var method = this._PATH_METHODS[index];
				pathArgs = item.params;
				context[method].apply(context, pathArgs);
			}
		}
		this.doneDraw(context, options);
	},
	drawImage: function(ctx, src, baseCoord, size, options, callback, ctxGetter)
	{
		var context = this.getOperatingContext(ctx);
		// first load image into current document
		var contextElem = this.getContextElem(context);
		var doc = contextElem.ownerDocument;
		var imgElem = doc.createElement('img');
		imgElem.src = src;
		var self = this;
		imgElem.onload = function(){
			try
			{
				self.setDrawStyle(context, options);
				// draw after image is loaded
				// since actual drawing context may change after image is loaded,
				// here we must use a getter function to retrieve the real context used
				var actualCtx = ctx;
				if (ctxGetter)
					actualCtx = ctxGetter();
				actualCtx = self.getOperatingContext(actualCtx);
				actualCtx.drawImage(imgElem, baseCoord.x, baseCoord.y, size.x, size.y);
				if (callback)
					callback(true);
				self.doneDraw(context, options);
			}
			catch(e)
			{
				if (callback)
					callback(false);
				throw e;
			}
		};
		imgElem.src = src;
	},
	drawImageElem: function(ctx, imgElem, baseCoord, size, options)
	{
		var context = this.getOperatingContext(ctx);
		this.setDrawStyle(context, options);
		context.drawImage(imgElem, baseCoord.x, baseCoord.y, size.x, size.y);
		this.doneDraw(context, options);
	},

	/** @private */
	isLineDashSupported: function(context)
	{
		return (context.setLineDash && (typeof(context.lineDashOffset) == "number"));
	},

	setDrawStyle: function(context, options)
	{
		if (Kekule.ObjUtils.notUnset(options.strokeWidth))
			context.lineWidth = options.strokeWidth;
		else  // default
			context.lineWidth = 1;
		if (options.strokeColor)
			context.strokeStyle = options.strokeColor;

		//console.log('draw style', options, context.strokeStyle);

		if (this.isLineDashSupported(context))
		{
			if (options.strokeDash)
			{
				var dashStyle = (options.strokeDash === true)? [5]:
					Kekule.ArrayUtils.isArray(options.strokeDash)? options.strokeDash: [options.strokeDash];
				context.setLineDash(dashStyle)
			}
			else
				context.setLineDash([]);
		}
		if (options.fillColor)
			context.fillStyle = options.fillColor;
		else
			context.fillStyle = 'transparent';
		if (Kekule.ObjUtils.notUnset(options.opacity))
			context.globalAlpha = options.opacity;
		else  // default
			context.globalAlpha = 1;
	},
	doneDraw: function(context, options)
	{
		context.stroke();
		if (options.fillColor)  // has fill
			context.fill();
	},

	// Methods to draw text
	/** @private */
	getCanvasFontStyle: function(drawOptions)
	{
		var result = '';
		if (drawOptions.fontStyle)
			result += drawOptions.fontStyle + ' ';
		if (drawOptions.fontWeight)
			result += drawOptions.fontWeight + ' ';
		if (drawOptions.fontSize)
		{
			if (typeof(drawOptions.fontSize) === 'string')  // already contains unit
				result += drawOptions.fontSize + ' ';
			else  // integer value
				result += drawOptions.fontSize + 'px ';
		}
		if (drawOptions.fontFamily)
			result += drawOptions.fontFamily + ' ';
		return result;
	},

	/**
	 * Draw a plain text on context.
	 * @param {Object} context
	 * @param {Object} coord The top left coord to draw text.
	 * @param {Object} text
	 * @param {Object} options Draw options, may contain the following fields:
	 * 	 {fontSize, fontFamily}
	 * @returns {Object} Null or element drawn on context.
	 */
	drawText: function(ctx, coord, text, options)
	{
		//console.log('draw text', text);
		var context = this.getOperatingContext(ctx);

		var oldFontStyle = context.font;
		var oldFillStyle = context.fillStyle;
		//context.save();

		var fontStyle = this.getCanvasFontStyle(options);

		this.setDrawStyle(context, options);

		context.font = fontStyle;
		if (options.color)
			context.fillStyle = options.color;
		context.textBaseline = 'top';
		context.fillText(text, coord.x, coord.y);

		context.fontStyle = oldFontStyle;
		context.fillStyle = oldFillStyle;

		//console.log('CANVAS DRAW TEXT', text, coord);
		//context.restore();
	},

	/**
	 * Indicate whether this bridge and context can measure text dimension before drawing it.
	 * HTML Canvas is a typical environment of this type.
	 * @param {Object} context
	 * @returns {Bool}
	 */
	canMeasureText: function(context)
	{
		return true;
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
		var fontStyle = this.getCanvasFontStyle(options);
		context.font = fontStyle;
		var m = context.measureText(text);
		var fontSize = options.fontSize;
		if (typeof(fontSize) === 'string')  // with unit, e.g. 10px
			fontSize = Kekule.StyleUtils.analysisUnitsValue(fontSize).value;
		var result = {'width': m.width, 'height': fontSize};  // height can not be got from Canvas API, use font size instead
		return result;
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
	 * Indicate whether this bridge and context can change text content or position after drawing it.
	 * Raphael is a typical environment of this type.
	 * @param {Object} context
	 * @returns {Bool}
	 */
	canModifyText: function(context)
	{
		return false;
	},

	// group management is inavailable to canvas
	/** @ignore */
	createGroup: function(context)
	{

	},
	/** @ignore */
	addToGroup: function(elem, group)
	{

	},
	/** @ignore */
	removeFromGroup: function(elem, group)
	{

	},

	// methods about draw other glyph

	// export
	/** @ignore */
	exportToDataUri: function(context, dataType, options)
	{
		var elem = this.getContextElem(context);
		return elem? elem.toDataURL(dataType, options): null;
	}
});

/**
 * Check if current environment supports HTML canvas.
 * @returns {Bool}
 */
Kekule.Render.CanvasRendererBridge.isSupported = function()
{
	var result = false;
	if (document && document.createElement)
	{
		result = !!document.createElement('canvas').getContext;
	}
	return result;
};

//Kekule.ClassUtils.makeSingleton(Kekule.Render.CanvasRendererBridge);

Kekule.Render.DrawBridge2DMananger.register(Kekule.Render.CanvasRendererBridge, 20);