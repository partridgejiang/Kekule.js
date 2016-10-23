/**
 * @fileoverview
 * 2D renderer using Raphael.js.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.structures.js
 * requires /render/kekule.render.base.js
 * requires /render/kekule.render.baseTextRender.js
 * requires /render/2d/kekule.render.def2DRenderer.js
 */

// Some helper methods of Raphael
if (this.Raphael)
{
	// draw a simple line
	/** @ignore */
	Raphael.fn.line = function(x1, y1, x2, y2)
	{
		return this.path('M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2);
	};
	/** @ignore */
	Raphael.fn.arrowLine = function (x1, y1, x2, y2, arrowParams)
	{
		// TODO: arrow still has bug in drawing in IE/VML
		if (!arrowParams)
			return this.line(x1, y1, x2, y2);
		var result = this.set();
		/*
    var angle = Math.atan2(x1-x2,y2-y1);
    angle = (angle / (2 * Math.PI)) * 360;
		var width = (arrowParams.width || 6) / 2;
		var length = arrowParams.length || 3;
		result.push(
			// arrow path
			this.path('M' + x2 + ' ' + y2 + ' L' + (x2 - length) + ' ' + (y2 - width) +
				' M' + x2 + ' ' + y2 +
				' L' + (x2 - length) + ' ' + (y2 + width)).rotate((90+angle),x2,y2),
			// line path
    	this.path('M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2)
		);
    //return [linePath,arrowPath];
		*/
		var dx = x2 - x1;
		var dy = y2 - y1;
		var alpha = Math.atan(dy / dx);

		var width = (arrowParams.width || 6) / 2;
		var length = arrowParams.length || 3;
		var beta = Math.atan(width / length);
		var l = Math.sqrt(Math.sqr(width) + Math.sqr(length));

		result.push(
			// arrow path
			this.path('M' + x2 + ' ' + y2
				+ ' L' + (x2 - l * Math.cos(alpha - beta)) + ' ' + (y2 - l * Math.sin(alpha - beta))
				+ ' M' + x2 + ' ' + y2
				+ ' L' + (x2 - l * Math.cos(alpha + beta)) + ' ' + (y2 - l * Math.sin(alpha + beta))),
			// line path
    	this.path('M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2)
		);
		return result;
	};
	/** @ignore */
	Raphael.fn.triangle = function(x1, y1, x2, y2, x3, y3)
	{
		return this.path('M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2 + ' L'
			+ x3 + ' ' + y3 + ' L' + x1 + ' ' + y1);
	};
	/** @ignore */
	Raphael.fn.polygon = function(coords)
	{
		var s = 'M' + coords[0].x + ' ' + coords[0].y;
		for (var i = 1, l = coords.length; i < l; ++i)
		{
			s += ' L' + coords[i].x + ' ' + coords[i].y;
		}
		s += 'L' + coords[0].x + ' ' + coords[0].y;
		return this.path(s);
	};
	// translate coordinate of a element with delta
	/** @ignore */
	Raphael.el.translateCoord = function(delta)
	{
		if (this.forEach)  // is set
			this.forEach(function(e) { e.translateCoord(delta); });
		else
		{
			var coord = this.attr(['x', 'y']);
			if ((typeof(coord.x) != 'undefined') && (typeof(coord.y) != 'undefined'))
				this.attr({'x': coord.x + delta.x, 'y': coord.y + delta.y});
		}
		//this.transform('t' + delta.x + ',' + delta.y);
		return this;
	};
	/** @ignore */
	Raphael.st.translateCoord = function(delta)
	{
		if (this.forEach)  // is set
			this.forEach(function(e) { e.translateCoord(delta); });
		//this.transform('t' + delta.x + ',' + delta.y);
		return this;
	};
	/** @ignore */
	Raphael.st.remove = function(delta)
	{
		// remove all children first
		this.forEach(function(elem)
			{
				elem.remove();
			}, this);
		this.clear();
	};
}

/**
 * Render bridge class of Raphael.
 * @class
 */
Kekule.Render.RaphaelRendererBridge = Class.create(
/** @lends Kekule.Render.RaphaelRendererBridge# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.RaphaelRendererBridge',

	/**
	 * Create a context element for drawing.
	 * @param {Element} parentElem
	 * @param {Int} width Width of context, in px.
	 * @param {Int} height Height of context, in px.
	 * @returns {Object} Context used for drawing.
	 */
	createContext: function(parentElem, width, height)
	{
		return Raphael(parentElem, width, height);
	},
	/**
	 * Destroy context created.
	 * @param {Object} context
	 */
	releaseContext: function(context)
	{
		context.remove();
	},

	/**
	 * Get width and height of context.
	 * @param {Object} context
	 * @returns {Hash} {width, height}
	 */
	getContextDimension: function(context)
	{
		return {'width': context.width, 'height': context.height};
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
		context.setSize(width, height);
		this.clearContext(context);
	},

	/**
	 * Clear the whole context.
	 * @param {Object} context
	 */
	clearContext: function(context)
	{
		context.clear();
		var clearColor = context.__$clearColor__;
		if (clearColor)
		{
			var dim = this.getContextDimension(context);
			this.drawRect(context, {x: 0, y: 0}, {x: dim.width, y: dim.height}, {'fillColor': clearColor, 'strokeColor': clearColor});
		}
	},

	setClearColor: function(context, color)
	{
		if (context)
			context.__$clearColor__ = color;
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
		return true;
	},
	drawPath: function(context, path, options)
	{
		var sPath = '';
		for (var i = 0, l = path.length; i < l; ++i)
		{
			var item = path[i];
			sPath += item.method;
			if (item.params && item.params.length)
			{
				for (var j = 0, k = item.params.length; j < k; ++j)
				{
					sPath += (j === 0) ? '' : ',';
					if (DataType.isArrayValue(item.params[j]))
						sPath += item.params[j].join(',');
					else
						sPath += item.params[j];
				}
			}
		}
		var result = context.path(sPath);
		this.setBasicElemAttribs(result, options)
		return result;
	},
	drawLine: function(context, coord1, coord2, options)
	{
		var result = context.line(coord1.x, coord1.y, coord2.x, coord2.y);
		this.setBasicElemAttribs(result, options);
		return result;
	},
	drawTriangle: function(context, coord1, coord2, coord3, options)
	{
		var result = context.triangle(coord1.x, coord1.y, coord2.x, coord2.y, coord3.x, coord3.y);
		this.setBasicElemAttribs(result, options);
		return result;
	},
	drawRect: function(context, coord1, coord2, options)
	{
		var result = context.rect(coord1.x, coord1.y, coord2.x - coord1.x, coord2.y - coord1.y);
		this.setBasicElemAttribs(result, options);
		return result;
	},
	drawRoundRect: function(context, coord1, coord2, cornerRadius, options)
	{
		var result = context.rect(coord1.x, coord1.y, coord2.x - coord1.x, coord2.y - coord1.y, cornerRadius);
		this.setBasicElemAttribs(result, options);
		return result;
	},
	drawCircle: function(context, baseCoord, radius, options)
	{
		var result = context.circle(baseCoord.x, baseCoord.y, radius);
		this.setBasicElemAttribs(result, options);
		return result;
	},
	drawImage: function(context, src, baseCoord, size, options, callback)
	{
		try
		{
			var result = context.image(src, baseCoord.x, baseCoord.y, size.x, size.y);
			this.setBasicElemAttribs(result, options);
			if (callback)
				callback(true);
		}
		catch(e)
		{
			if (callback)
				callback(false);
			throw e;
		}
		return result;
	},
	drawImageElem: function(context, imgElem, baseCoord, size, options)
	{
		return this.drawImage(context, imgElem.src, baseCoord, size, options);
	},

	/** @private */
	setBasicElemAttribs: function(elem, options)
	{
		if (Kekule.ObjUtils.notUnset(options.strokeWidth))
			elem.attr('stroke-width', options.strokeWidth);
		if (options.strokeColor)
			elem.attr('stroke', options.strokeColor);
		if (options.strokeDash)
		{
			// TODO: currently ignore all complex dash styles
			var dashStyle = '- ';  //(options.strokeDash === true)? '- ': options.strokeDash;
			elem.attr('stroke-dasharray', dashStyle);
		}
		if (options.fillColor)
			elem.attr('fill', options.fillColor);
		if (options.opacity)
		{
			elem.attr({
				'stroke-opacity': options.opacity,
				'fill-opacity': options.opacity
			});
		}
	},

	/** @private */
	getRaphaelFontStyle: function(drawOptions)
	{
		// NOTE: in VML, can not set style "font: 14px" (without font family)
		// so we set attribs separately
		var result = {};
		if (drawOptions.fontStyle)
			result['font-style'] = drawOptions.fontStyle;
		if (drawOptions.fontWeight)
			result['font-weight'] = drawOptions.fontWeight;
		if (drawOptions.fontSize)
			result['font-size'] = drawOptions.fontSize + 'px';
		if (drawOptions.fontFamily)
			result['font-family'] = drawOptions.fontFamily;
		/*
		if (drawOptions.color)
		{
			result['fill'] = drawOptions.color;
			result['stroke'] = drawOptions.color;
		}
		*/

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
	drawText: function(context, coord, text, options)
	{
		// hack, otherwise the leading and tailing space may not be displayed in SVG
		if (text.endsWith(' '))
			text = text.substring(0, text.length - 1) + '\u00A0';
		if (text.startsWith(' '))
			text = '\u00A0' + text.substr(1);


		var fontStyle = this.getRaphaelFontStyle(options);
		//console.log(text, options);

		var elem = context.text(-10000, -10000, text); // Raphael set text center to coord, so need to adjust after draw
		elem.attr(/*'font', */fontStyle);
		if (options.color)
			elem.attr({'stroke': options.color, 'fill': options.color});
		this.modifyDrawnTextCoord(context, elem, coord);
		this.setBasicElemAttribs(elem, options);
		//console.log('RAPHAEL DRAW TEXT', text, coord);
		return elem;
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
	 * Indicate whether this bridge and context can measure text dimension before drawing it.
	 * Raphael is a typical environment of this type.
	 * Such a bridge must also has the ability to modify text pos after drawn.
	 * @param {Object} context
	 * @returns {Bool}
	 */
	canMeasureDrawnText: function(context)
	{
		return true;
	},

	/**
	 * Indicate whether this bridge and context can change text content or position after drawing it.
	 * Raphael is a typical environment of this type.
	 * @param {Object} context
	 * @returns {Bool}
	 */
	canModifyText: function(context)
	{
		return true;
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
		var oneOf = Kekule.oneOf;
		var box = textElem.getBBox();
		var result = {};
		result.width = oneOf(box.width, (box.x2 - box.x1));
		result.height = oneOf(box.height, (box.y2 - box.y1));
		//console.log('measure box', box, result, textElem);
		return result;
	},
	/**
	 * Change text drawn on context to a new coord. Not all context can apply this action.
	 * @param {Object} context
	 * @param {Object} textElem
	 * @param {Hash} newCoord The top left coord of text box.
	 */
	modifyDrawnTextCoord: function(context, textElem, newCoord)
	{
		// Raphael set text center to coord, so need to adjust to suitable position
		var dimension = this.measureDrawnText(context, textElem, null);
		textElem.attr({'x': newCoord.x + dimension.width / 2, 'y': newCoord.y + dimension.height / 2});
	},

	/** @ignore */
	createGroup: function(context)
	{
		return context.set();
	},
	/** @ignore */
	addToGroup: function(elem, group)
	{
		return group.push(elem);
	},
	/** @ignore */
	removeFromGroup: function(elem, group)
	{
		if (elem !== group)
			return group.exclude(elem);
		else
			return false;
	},

	/**
	 * Remove an element in context.
	 * @param {Object} context
	 * @param {Object} elem
	 */
	removeDrawnElem: function(context, elem)
	{
		elem.remove();  // remove element or clear set
	},

	// export
	/** @ignore */
	exportToDataUri: function(context, dataType, options)
	{
		if (context.toSVG)  // if Rapheal.Export lib used
		{
			var svg = context.toSVG();
			return 'data:image/svg+xml;base64,' + btoa(svg);
		}
		else if (context.canvas && (context.canvas.tagName.toLowerCase() === 'svg'))
		{
			var svg = XmlUtility.serializeNode(context.canvas);
			return 'data:image/svg+xml;base64,' + btoa(svg);
		}
	}
});

/**
 * Check if current environment supports Raphael (SVG or VML).
 * @returns {Bool}
 */
Kekule.Render.RaphaelRendererBridge.isSupported = function()
{
	var result = false;
	if (Kekule.$jsRoot.Raphael)
	{
		result = !!(Raphael.svg || Raphael.vml);
	}
	return result;
};

//Kekule.ClassUtils.makeSingleton(Kekule.Render.RaphaelRendererBridge);

Kekule.Render.DrawBridge2DMananger.register(Kekule.Render.RaphaelRendererBridge, 10);