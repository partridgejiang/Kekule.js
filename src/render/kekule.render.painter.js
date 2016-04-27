/**
 * @fileoverview
 * This file contains classes to draw ChemSpace objects in 2D or 3D context.
 * Usually the user do not need to call renderer classes to draw, but use painter instances instead.
 * @author Partridge Jiang
 */

/*
 * requires /core/kekule.common.js
 * requires /utils/kekule.utils.js
 * requires /render/kekule.render.base.js
 * requires /render/kekule.render.configs.js
 * //requires /render/kekule.render.boundInfoRecorder.js
 */

(function(){

/**
 * Painter used by user to draw a chem object.
 *
 * @augments ObjectEx
 *
 * @param {Int} renderType Display in 2D or 3D. Value from {@link Kekule.Render.RendererType}.
 * @param {Kekule.ChemObject} chemObj Object to be drawn.
 * @param {Object} drawBridge A object that implements the actual draw job.
 * //@param {Hash} options Options to draw object.
 * @param {Object} renderConfigs Global configuration for rendering.
 *   This property should be an instance of {@link Kekule.Render.Render2DConfigs} or {@link Kekule.Render.Render3DConfigs}.
 *   Set this param to null to use default configs.
 *
 * @property {Int} renderType Display in 2D or 3D. Value from {@link Kekule.Render.RendererType}.
 * @property {Kekule.ChemObject} chemObj Object to be drawn.
 * @property {Object} drawBridge A object that implements the actual draw job. Read only.
 * @property {Object} renderConfigs Configuration for rendering.
 *   This property should be an instance of {@link Kekule.Render.Render2DConfigs} or {@link Kekule.Render.Render3DConfigs}
 * @propety {Kekule.Render.AbstractRenderer} renderer Renderer to draw the chem object.
 * @class
 */
Kekule.Render.ChemObjPainter = Class.create(ObjectEx,
/** @lends Kekule.Render.ChemObjPainter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.ChemObjPainter',
	/** @constructs */
	initialize: function($super, renderType, chemObj, drawBridge, renderConfigs)
	{
		$super();
		var rtype = renderType || Kekule.Render.RendererType.R2D;
		this.setPropStoreFieldValue('renderType', rtype);
		this.setPropStoreFieldValue('chemObj', chemObj);
		this.setPropStoreFieldValue('drawBridge', drawBridge ||
			((rtype === Kekule.Render.RendererType.R3D)?
					Kekule.Render.DrawBridge3DMananger.getPreferredBridgeInstance():
					Kekule.Render.DrawBridge2DMananger.getPreferredBridgeInstance()));
		if (renderConfigs)
			this.setPropStoreFieldValue('renderConfigs', renderConfigs);
		/*
		else
		{
			this.setPropStoreFieldValue('renderConfigs', (rtype === Kekule.Render.RendererType.R3D)?
				Kekule.Render.Render3DConfigs.getInstance():
				Kekule.Render.Render2DConfigs.getInstance());
		}
		*/
		//this.setPropStoreFieldValue('boundInfoRecorder', new Kekule.Render.BoundInfoRecorder(this));
	},
	finalize: function($super)
	{
		if (this.getRenderer())
			this.getRenderer().finalize();
		$super();
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('renderType', {'dataType': DataType.INT, 'serializable': false, 'setter': null});
		this.defineProp('chemObj', {'dataType': 'Kekule.ChemObject', 'serializable': false, 'setter': null});
		this.defineProp('drawBridge', {'dataType': DataType.OBJECT, 'serializable': false, 'setter': null});
		this.defineProp('renderConfigs', {'dataType': DataType.OBJECT, 'serializable': false,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('renderConfigs');
				if (!result)
					result = (this.getRenderType() === Kekule.Render.RendererType.R3D)?
						Kekule.Render.Render3DConfigs.getInstance():
						Kekule.Render.Render2DConfigs.getInstance();
				return result;
			}
		});

		this.defineProp('renderer', {'dateType': 'Kekule.Render.AbstractRenderer', 'serializable': false, 'setter': null});

		// private property
		//this.defineProp('boundInfoRecorder', {'dateType': 'Kekule.Render.BoundInfoRecorder', 'serializable': false, 'setter': null });
	},

	/** @private */
	getDrawOptionFromConfigs: function(renderConfigs)
	{
		var U = Kekule.Render.RenderOptionUtils;
		return U.convertConfigsToPlainHash(renderConfigs);
	},

	/** @private */
	prepareRenderer: function()
	{
		if (this.getRenderer())  // renderer already set
			return this.getRenderer();
		var func = (this.getRenderType() === Kekule.Render.RendererType.R3D)?
			Kekule.Render.get3DRendererClass: Kekule.Render.get2DRendererClass;
		var c = func(this.getChemObj());
		//console.log('prepare renderer',c);
		if (c)
		{
			var r = new c(this.getChemObj(), this.getDrawBridge(), /*this.getRenderConfigs(),*/ this);
			this.setPropStoreFieldValue('renderer', r);
			return r;
		}
		else  // can not find suitable renderer
		{
			Kekule.error(/*Kekule.ErrorMsg.CANNOT_FIND_SUITABLE_RENDERER_FOR_OBJ*/Kekule.$L('ErrorMsg.CANNOT_FIND_SUITABLE_RENDERER_FOR_OBJ'));
			return null;
		}
	},

	/**
	 * Create an suitable context for drawing.
	 * @param {Element} parentElem HTML element, context will be append to it.
	 * @param {Int} width
	 * @param {Int} height
	 * @returns {Object}
	 */
	createContext: function(parentElem, width, height)
	{
		var b = this.getDrawBridge();
		return b.createContext(parentElem, width, height);
	},

	/** @private */
	_convertContextBoxToScreen: function(context, box)
	{
		if (!box)
			return {};
		var bridge = this.getDrawBridge();
		var coord1 = bridge.transformContextCoordToScreen(context, {'x': box.x1, 'y': box.y1});
		var coord2 = bridge.transformContextCoordToScreen(context, {'x': box.x2, 'y': box.y2});
		return Kekule.BoxUtils.createBox(coord1, coord2);
	},

	/**
	 * Estimate the bound box around current chemObj (in chem coord system).
	 * @param {Object} context
	 * @param {Object} options
	 * @param {Bool} allowCoordBorrow
	 * @returns {Hash} A 2D or 3D box, in chemObj's coord system.
	 */
	estimateObjBox: function(context, options, allowCoordBorrow)
	{
		var ops = this._generateDrawOptions(options);
		this.prepareRenderer();
		return this.getRenderer().estimateObjBox(context, options, allowCoordBorrow);
	},
	/**
	 * Estimate the bound box need to render current chemObj (in context coord system).
	 * @param {Object} context
	 * @param {Hash} baseCoord Center coord in context to draw object. Can be null.
	 * @param {Object} options
	 * @param {Bool} allowCoordBorrow
	 * @returns {Hash} A 2D or 3D box, in context's coord system.
	 */
	estimateRenderBox: function(context, baseCoord, options, allowCoordBorrow)
	{
		var ops = this._generateDrawOptions(options);
		this.prepareRenderer();
		var renderer = this.getRenderer();
		return renderer.estimateRenderBox(context, baseCoord, ops, allowCoordBorrow);
	},
	/**
	 * Estimate the bound box need to render current chemObj (in screen coord system).
	 * @param {Object} context
	 * @param {Hash} baseCoord Center coord in context to draw object. Can be null.
	 * @param {Object} options
	 * @param {Bool} allowCoordBorrow
	 * @returns {Hash} A 2D or 3D box, in context's coord system.
	 */
	estimateScreenBox: function(context, baseCoord, options, allowCoordBorrow)
	{
		var box = this.estimateRenderBox(context, baseCoord, options, allowCoordBorrow);
		return box? this._convertContextBoxToScreen(context, box): null;
	},

	/*
	 * Calculate the precise drawing box of chemObj, in context coord.
	 * This method must be called after draw.
	 * @param {Object} context
	 * @returns {Hash}
	 */
	/*
	calcActualRenderBox: function(context)
	{
		return this.getBoundInfoRecorder().getContainerBox(context);
	},
	*/
	/*
	 * Calculate the precise drawing box of chemObj, in screen coord.
	 * This method must be called after draw.
	 * @param {Object} context
	 * @returns {Hash}
	 */
	/*
	calcActualScreenBox: function(context)
	{
		var box = this.calcActualRenderBox(context);
		return this._convertContextBoxToScreen(context, box);
	},
	*/

	/** @private */
	_generateDrawOptions: function(inputOptions)
	{
		var configs = this.getRenderConfigs();
		var ops = configs? this.getDrawOptionFromConfigs(configs): {};
		ops = Object.extend(ops, inputOptions);
		return ops;
	},

	/**
	 * Draw an instance of ChemObject to context.
	 * The actual job is done in doDraw method. Descendants should override doDraw.
	 * @param {Object} context Context to be drawn, such as Canvas, SVG, VML and so on.
	 * @param {Hash} baseCoord Coord of center to draw this object, can be null. This coord is based on context.
	 * @param {Hash} options Draw options, such as draw rectangle, draw style, zoom and so on.
	 *   Different coordMode may requires different option params.
	 */
	draw: function(context, baseCoord, options)
	{
		this.prepareRenderer();
		//this.getBoundInfoRecorder().clear(context);
		/*
		var configs = this.getRenderConfigs();
		var ops = configs? this.getDrawOptionFromConfigs(configs): {};
		ops = Object.extend(ops, options);
		*/
		var ops = this._generateDrawOptions(options);
		var r = this.getRenderer();
		//console.log('painter draw', r.getClassName(), r);
		var result = r.draw(context, baseCoord, ops);
		return result;
	},

	/**
	 * Redraw previous object on context with same draw options. Should not be called before draw.
	 * @param {Object} context
	 */
	redraw: function(context)
	{
		//this.getBoundInfoRecorder().clear(context);
		return this.getRenderer().redraw(context);
	},

	/*
	 * Calculate prefered input transform options (but not the final transform params).
	 * @param {Object} context
	 * @param {Hash} baseCoord
	 * @param {Hash} drawOptions
	 * @param {Hash} objBox
	 * @returns {Hash}
	 */
	/*
	calcPreferedTransformOptions: function(context, baseCoord, drawOptions, objBox)
	{
		var r = this.getRenderer();
		if (r)
			return r.calcPreferedTransformOptions(context, baseCoord, drawOptions, objBox);
		else
		{
			return null;
		}
	},
	*/

	/**
	 * Get the actual transform params used by current root renderer.
	 * @param {Object} context
	 * @param {Hash} baseCoord
	 * @param {Hash} drawOptions
	 * @returns {hash}
	 * @ignore
	 */
	getActualRenderTransformParams: function(context)
	{
		var r = this.getRenderer();
		if (r)
		{
			return r.getRenderFinalTransformParams(context);
		}
		else
			return null;
	},
	/** @ignore */
	getActualInitialRenderTransformOptions: function(context)
	{
		var r = this.getRenderer();
		if (r)
		{
			return r.getRenderInitialTransformOptions(context);
		}
		else
			return null;
	},

	/**
	 * Repaint with only geometry options (translate/zoom/rotate) changes (without the modification of chemobj or draw color, molecule type...).
	 * In 3D mode sometimes this repainting can be achieved by the modify of camera position (without recalc the position of node and connectors)
	 * so that the speed may enhance greatly.
	 * @param {Object} context
	 * @param {Hash} newOptions
	 */
	changeGeometryOptions: function(context, baseCoord, newOptions)
	{
		var r = this.getRenderer();
		if (r && r.changeGeometryOptions)
		{
			var ops = this._generateDrawOptions(newOptions);
			return r.changeGeometryOptions(context, baseCoord, ops);
		}
		else
		{
			this.clearContext(context);
			return this.draw(context, baseCoord, newOptions);
		}
	},
	/**
	 * Check if changeGeometryOptions is availble to current renderer.
	 * @returns {Bool}
	 */
	supportGeometryOptionChange: function()
	{
		var r = this.getRenderer();
		return r && r.changeGeometryOptions;
	},

	/**
	 * Call this method before a series of rendered element updating job (for instance, call update method)
	 * to avoid unnecessary redraw.
	 */
	beginUpdatePainter: function()
	{
		return this.getRenderer().beginUpdateRenderer();
	},
	/**
	 * Call this method after a series of rendered element updateing job,
	 * notify the painter to redraw the context.
	 */
	endUpdatePainter: function()
	{
		return this.getRenderer().endUpdateRenderer();
	},
	/**
	 * Update a child object inside chemObj. Must be called after draw.
	 * @param {Object} context
	 * @param {Variant} updatedObjs Object or Array
	 * @param {Int} updateType Value from {@link Kekule.Render.ObjectUpdateType}
	 */
	update: function(context, updatedObjs, updateType)
	{
		return this.getRenderer().update(context, updatedObjs, updateType);
	},

	/**
	 * Add a new child object to chemObj. Must be called after draw.
	 * @param {Object} context
	 * @param {Variant} updatedObjs
	 * @returns {Bool} Whether the actual add job is done.
	 * @private
	 */
	addNew: function(context, updatedObjs)
	{
		return this.getRenderer().addNew(context, updatedObjs);
	},
	/**
	 * Modify chemObj or a child object inside chemObj. Must be called after draw.
	 * @param {Object} context
	 * @param {Variant} updatedObjs
	 * @returns {Bool} Whether the actual modify job is done.
	 * @private
	 */
	modify: function(context, updatedObjs)
	{
		return this.getRenderer().modify(context, updatedObjs);
	},
	/**
	 * Remove a child object inside chemObj and update the rendering. Must be called after draw.
	 * @param {Object} context
	 * @param {Variant} removedObjs
	 * @returns {Bool} Whether the actual remove job is done.
	 * @private
	 */
	remove: function(context, removedObjs)
	{
		return this.getRenderer().remove(context, removedObjs);
	},
	/**
	 * Clear whole chemObj on context.
	 * @param {Object} context
	 * @returns {Bool} Whether the actual clear job is done.
	 */
	clear: function(context)
	{
		var renderer = this.getRenderer();
		if (renderer)
			renderer.clear(context);
		return this;
	},

	/**
	 * Clear the painted objects in whole context.
	 * @param {Object} context
	 */
	clearContext: function(context)
	{
		return this.getDrawBridge().clearContext(context);
	}
});

/**
 * Painter used by user to draw a chem object in 2D.
 *
 * @augments Kekule.Render.ChemObjPainter
 *
 * @param {Kekule.ChemObject} chemObj Object to be drawn.
 * @param {Object} drawBridge A object that implements the actual draw job.
 * @param {Hash} options Options to draw object.
 * @param {Object} renderConfigs Global configuration for rendering.
 *   This property should be an instance of {@link Kekule.Render.Render2DConfigs} or {@link Kekule.Render.Render3DConfigs}.
 *   Set this param to null to use default configs.
 *
 * @class
 */
Kekule.Render.ChemObjPainter2D = Class.create(Kekule.Render.ChemObjPainter,
/** @lends Kekule.Render.ChemObjPainter2D# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.ChemObjPainter2D',
	/** @constructs */
	initialize: function($super, chemObj, drawBridge, renderConfigs)
	{
		$super(Kekule.Render.RendererType.R2D, chemObj, drawBridge, renderConfigs);
	}
});

/**
 * Painter used by user to draw a chem object in 3D.
 *
 * @augments Kekule.Render.ChemObjPainter
 *
 * @param {Kekule.ChemObject} chemObj Object to be drawn.
 * @param {Object} drawBridge A object that implements the actual draw job.
 * @param {Hash} options Options to draw object.
 * @param {Object} renderConfigs Global configuration for rendering.
 *   This property should be an instance of {@link Kekule.Render.Render2DConfigs} or {@link Kekule.Render.Render3DConfigs}.
 *   Set this param to null to use default configs.
 *
 * @class
 */
Kekule.Render.ChemObjPainter3D = Class.create(Kekule.Render.ChemObjPainter,
/** @lends Kekule.Render.ChemObjPainter3D# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.ChemObjPainter3D',
	/** @constructs */
	initialize: function($super, chemObj, drawBridge, renderConfigs)
	{
		$super(Kekule.Render.RendererType.R3D, chemObj, drawBridge, renderConfigs);
	}
});

})();