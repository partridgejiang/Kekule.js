/**
 * @fileoverview
 * Base (abstract) class of 2D or 3D molecule renderers.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /render/kekule.render.utils.js
 */

"use strict";

/**
 * Namespace for renderer system.
 * @namespace
 */
Kekule.Render = {};

/**
 * Enumeration of coord systems (chemObject, context or screen).
 * @class
 */
Kekule.Render.CoordSystem = {
	/** ChemObject system, used to mark the inner structure of chem objects. 2D or 3D. */
	CHEM: 0,
	/** Context system, used for draw bridges. 2D or 3D. */
	CONTEXT: 1,
	/** Screen system, 2D, usually in pixel. */
	SCREEN: 2
};

/*
 * Enumeration of interaction states of chem object (node or connector).
 * @class
 * @deprecated
 */
//Kekule.Render.InteractState = {
	/** Normal state. */
	//NORMAL: 'normal',
	/** Mouse hover above. */
	//HOVER: 'hover',
	/** Object is selected. */
	//ACTIVE: 'active'
//};

/**
 * Enumeration of renderer types: 2D or 3D.
 * @enum
 */
Kekule.Render.RendererType = {
	/** 2D renderer. */
	R2D: 2,
	/** 3D renderer. */
	R3D: 3
};

/**
 * The position of coord point in object box.
 * @enum
 */
Kekule.Render.CoordPos = {
	/** Center point of object. */
	CENTER: 0,
	/** Top left point of object, usually used in blocks of 2D context. */
	CORNER_TL: 21,
	/** Default value, same as CENTER. */
	DEFAULT: 0
};

/**
 * C is the most common element in organic molecule. So the label of C will be ignored in bond-line formula.
 * @constant
 */
Kekule.Render.DEF_ATOM_ATOMIC_NUM = 6;

/**
 * Enumeration of molecule display type, condensed formula or bond-line formula.
 * @enum
 */
Kekule.Render.MoleculeDisplayType = {
	/** bond-line formula */
	SKELETAL: 1,
	/** Condensed formula */
	CONDENSED: 2,
	DEFAULT: 1
};
Kekule.Render.Molecule2DDisplayType = Kekule.Render.MoleculeDisplayType;

/**
 * Enumeration of node label (usually atom label) display mode (especially in 2D renderer).
 * @enum
 */
Kekule.Render.NodeLabelDisplayMode = {
	/** Label is hidden */
	HIDDEN: -1,
	/** Label should be shown */
	SHOWN: 1,
	/** Whether show label is decided by the display type of molecule */
	SMART: 0,
	/** Default is SMART */
	DEFAULT: 0
}

/**
 * Enumeration of hydrongen display strategy (espcially in 2D renderer).
 * @enum
 */
Kekule.Render.HydrogenDisplayLevel = {
	/** No hydrongen is displayed */
	NONE: 0,
	/** Only display explicit hydrogens. */
	EXPLICIT: 1,
	/** Display explicit hydrogens only when the count is not the same as implicit. */
	UNMATCHED_EXPLICIT: 2,
	/** Display all hydrogens, whether explicit or implicit ones. */
	ALL: 10,
	/** Default is EXPLICIT. */
	DEFAULT: 1
};


/**
 * Enumeration of direction of text (especially rich text label).
 * @enum
 */
Kekule.Render.TextDirection = {
	/** @ignore */
	DEFAULT: 0,
	/** Left to right. */
	LTR: 1,
	/** Right to left. */
	RTL: 3,
	/** Top to bottom. */
	TTB: 2,
	/** Bottom to top */
	BTT: 4,
	/** Inherit from parent setting */
	INHERIT: 10
	/* Decide the direction by environment around. Useful when draw label in ctab. */
	/*SMART: 20*/
};


/**
 * Enumeration of horizontal / vertical alignment of text.
 * @enum
 */
Kekule.Render.TextAlign = {
	/*BASELINE: 0,  //??????*/
	DEFAULT: 0,
	LEFT: 1,
	RIGHT: 2,
	TOP: 3,
	BOTTOM: 4,
	CENTER: 5,
	LEADING: 10,
	TRAILING: 11,

	/**
	 * LEADING and TRAILING are related align mode, related to text direction.
	 * This function returns absolute align value due to textDirection.
	 * @returns {Int}
	 */
	getAbsAlign: function(textAlign, textDirection)
	{
		var result = textAlign;
		var TA = Kekule.Render.TextAlign;
		var TD = Kekule.Render.TextDirection;
		if ((textAlign === TA.LEADING) || (textAlign === TA.TRAILING))
		{
			var isLeading = textAlign == TA.LEADING;
			switch (textDirection)
			{
				case TD.RTL: result = isLeading? TA.RIGHT: TA.LEFT; break;
				case TD.TTB: result = isLeading? TA.TOP: TA.BOTTOM; break;
				case TD.BTT: result = isLeading? TA.BOTTOM: TA.TOP; break;
				case TD.LTR:
				default:
					result = isLeading? TA.LEFT: TA.RIGHT; break;
			}
		}
		return result;
	}
};

/**
 * Enumeration of alignment types of box in horizontal direction.
 * @enum
 */
Kekule.Render.BoxXAlignment = {
	LEFT: 0,
	RIGHT: 1,
	CENTER: 2
};
/**
 * Enumeration of alignment types of box in vertical direction.
 * @enum
 */
Kekule.Render.BoxYAlignment = {
	TOP: 0,
	BOTTOM: 1,
	CENTER: 2
};

/**
 * Enumeration of alignment mode of a rich text box.
 * @enum
 */
Kekule.Render.TextBoxAlignmentMode = {
	/** Alignment based on the whole text box */
	BOX: 0,
	/** Alignment based on the childmost anchor item of rich text */
	ANCHOR: 1
};

/**
 * Enumeration of types of rendering a bond line.
 * @enum
 */
Kekule.Render.BondRenderType = {
	/** Usual single bond, draw in a thin line */
	SINGLE: 0,
	/** Usual double bond, draw in thin double line */
	DOUBLE: 1,
	/** Usual triple bond, draw in thin triple line */
	TRIPLE: 2,
	/* Usual quad bond, draw in thin quad line */
	QUAD: 3,
	/** Dashed bond line */
	DASHED: 4,
	/** Dashed double line */
	DASHED_DOUBLE: 5,
	/** Dashed triple line */
	DASHED_TRIPLE: 6,
	/** A sold and a dashed line, usually used for aromatic bond */
	SOLID_DASH: 7,
	/** A line with a arrow in the end, usually for coordinate-bond */
	ARROWED: 8,
	/** A line with a arrow in the head, usually for coordinate-bond */
	ARROWED_INV: 9,
	/** A hashed line */
	HASHED: 10,
	/** A bold line, usually for bond above paper */
	BOLD: 11,
	/** A bold and a normal line, usually for double bond above paper */
	BOLD_DOUBLE: 12,
	/** A bold and two normal line, usually for triple bond above paper */
	BOLD_TRIPLE: 13,
	/* A bold and three normal line, usually for quad bond above paper */
	BOLD_QUAD: 14,
	/** A bold and a dash line, usually for aromatic bond above paper */
	BOLD_DASH: 16,
	/** A solid wedge triangle from atom 1 to atom 2, usually for wedge up bond */
	WEDGED_SOLID: 20,
	/** A solid wedge triangle from atom 2 to atom 1, usually for wedge up bond */
	WEDGED_SOLID_INV: 21,
	/** A hollow wedge triangle from atom 1 to atom 2,  usually for wedge up bond */
	WEDGED_HOLLOW: 22,
	/** A hollow wedge triangle from atom 2 to atom 1, usually for wedge up bond */
	WEDGED_HOLLOW_INV: 23,
	/** A hased wedge triangle from atom 1 to atom 2, usually for wedge down bond */
	WEDGED_HASHED: 24,
	/** A hased wedge triangle from atom 2 to atom 1, usually for wedge down bond */
	WEDGED_HASHED_INV: 25,
	/** A bold rectangle, indicating a bond near the observer. Usually connected with wedged bonds. */
	WEDGED_SOLID_BOTH: 26,
	/** A bold hollow rectangle, indicating a bond near the observer. Usually connected with wedged bonds. */
	WEDGED_HOLLOW_BOTH: 27,
	/** A wavy line, usually used for bond with uncertain stereo */
	WAVY: 30,
	/** A cross double bond, means an uncertain E or Z stereo */
	SCISSORS_DOUBLE: 40
};


/**
 * Enumeration of types to render a charge on atom.
 * @enum
 */
Kekule.Render.ChargeMarkRenderType = {
	/** Number + symbol, such as 2+, 3- */
	NUM_WITH_SYMBOL: 1,
	DEFAULT: 1,
	/** Only symbol, such as ++, = */
	//SYMBOL_ONLY: 2,
	/** Surrond with a circle to emphasis, the circle will only be draw when charge = +1/-1 */
	CIRCLE_AROUND: 3
};

/**
 * Enumeration of graphic quality levels to render objects in 3D.
 * @enum
 */
Kekule.Render.Render3DGraphicQuality = {
	EXTREME_LOW: 1,
	LOW: 2,
	MEDIUM: 3,
	HIGH: 4,
	EXTREME_HIGH: 5
};

/**
 * Enumeration of types to render a molecule in 3D.
 * @enum
 */
Kekule.Render.Molecule3DDisplayType = {
	/** Wire frame */
	WIRE: 31,
	/** Sticks */
	STICKS: 32,
	/** Ball and stick */
	BALL_STICK: 33,
	/** Space fill */
	SPACE_FILL: 34,
	/** Default is ball and stick */
	DEFAULT: 33
}

/**
 * Enumeration of types to render a bond in 3D.
 * @enum
 */
Kekule.Render.Bond3DRenderMode = {
	/** do not render bond. */
	NONE: 0,
	/** One wire is used to represent one bond (multiple or not). */
	WIRE: 1,
	/** Multiple wires are used for multiple bond. */
	MULTI_WIRE: 2,
	/** One cylinder is used to represent one bond (multiple or not). */
	CYLINDER: 3,
	/** Use multiple cylinders for multiple bond. */
	MULTI_CYLINDER: 4,
	/**
	 * Check if connector / bond should be draw in lines.
	 * @param {Int} mode
	 * @returns {Bool}
	 */
	isWireMode: function(mode)
	{
		var M = Kekule.Render.Bond3DRenderMode;
		return (mode === M.WIRE) || (mode === M.MULTI_WIRE);
	},
	/**
	 * Check if connector / bond should be draw in cylinders.
	 * @param {Int} mode
	 * @returns {Bool}
	 */
	isCylinderMode: function(mode)
	{
		var M = Kekule.Render.Bond3DRenderMode;
		return (mode === M.CYLINDER) || (mode === M.MULTI_CYLINDER);
	}
};

/**
 * Enumeration of types to decide how a bond is splitted in 3D render.
 * @enum
 */
Kekule.Render.Bond3DSpliceMode = {
	/** Bond draw as a whole, not split. */
	UNSPLIT: 1,
	/** Split from the middle, as two line with the same length. */
	MID_SPLIT: 2,
	/** Split, a biger atom gains biger part of bond */
	WEIGHTING_SPLIT: 3
};

/**
 * Enumeration of types to draw a connector (bond) in 3D render.
 * @enum
 */
Kekule.Render.Bond3DRenderType = {
	/** Just one line or cylinder, used for most bonds. */
	SINGLE: 1,
	/** Double lines or cylinders, used for double bond. */
	DOUBLE: 2,
	/** Triple lines or cylinders, used for triple bond. */
	TRIPLE: 3,
	/** Dash line or cylinder, usually used for H-bond. */
	DASH: -1,
	/** One solid and a dash line or cylinder, used for aromatic bond. */
	SOLID_DASH: -2
};


/**
 * Enumeration of types to draw a node (atom) in 3D render.
 * @enum
 */
Kekule.Render.Node3DRenderMode = {
	/** Do not render explicit atom, used in WIRE display mode. */
	NONE: 0,
	/** Render atom as ball, used in BALL_STICK display mode. */
	BALL: 1,
	/** Render atom as a huge ball, according to Vdw radius, used in SPACE_FILL display mode. */
	SPACE: 2
	///** Render as small ball at the end of bond, used in STICKS display mode */
	//SMALL_CAP: 3
};

/**
 * Enumeration of shape types to describle meta shape info.
 * @enum
 */
Kekule.Render.MetaShapeType = {
	// 2D shapes
	/** A single point on context. Can be determinated by a single coord ({[coord]}). */
	POINT: 0,
	/** A circle on context. Can be determinated by a single coord and a radius. ({[coord], radius}) */
	CIRCLE: 1,
	/** A line on context, determinated by two coords and a width property ({[coord1, coord2], width). */
	LINE: 2,
	/** A rectangle on context, determinated by two coords ({[coord1, coord2]}). */
	RECT: 3,
	/** Polygon, determinated by a set of coords ({[coord1, coord2, coord3, ... }). */
	POLYGON: 10,
	// 3D shapes
	/** A shpere on 3D context. Can be determinated by a single coord and a radius. ({[coord], radius}) */
	SPHERE: 101,
	/** Cylinder in 3D context. Can be determinated by two coords and a radius. ({[coord1, coord2], radius}) */
	CYLINDER: 102,
	/**
	 * A complex shape composited of a series of child shapes.
	 * In implementation, an array of meta shapes will map to this type.
	 */
	COMPOSITE: -1
};
// Alias of MetaShapeType
Kekule.Render.BoundShapeType = Kekule.Render.MetaShapeType;

/**
 * Enumeration of types of updating a object.
 * @enum
 */
Kekule.Render.ObjectUpdateType = {
	/** Modify a existing object. */
	MODIFY: 0,
	/** Add a new object. */
	ADD: 1,
	/** Remove a existing object. */
	REMOVE: 2,
	/** Clear whole object. */
	CLEAR: 3
};

/**
 * Base class for different types of concrete renderers.
 * @class
 * @augments ObjectEx
 * @param {Kekule.ChemObject} chemObj Object to be drawn.
 * @param {Object} drawBridge Concrete draw bridge to do the actual draw job.
 * //@param {Object} renderConfigs Configuration for rendering.
 * //  This property should be an instance of {@link Kekule.Render.Render2DConfigs} or {@link Kekule.Render.Render3DConfigs}.
 * @param {Kekule.ObjectEx} parent Parent object of this renderer, usually another renderer or an instance of {@link Kekule.Render.ChemObjPainter}, or null.
 *
 * @property {Kekule.ChemObject} chemObj Object to be drawn, read only.
 * @property {Object} drawBridge Concrete draw bridge to do the actual draw job.
 * //@property {Object} renderConfigs Configuration for rendering.
 * //  This property should be an instance of {@link Kekule.Render.Render2DConfigs} or {@link Kekule.Render.Render3DConfigs}
 * //@property {Object} renderCache Stores params (center coord, options, matrix...) on last draw process.
 * @property {Kekule.ObjectEx} parent Parent object of this renderer, usually another renderer or an instance of {@link Kekule.Render.ChemObjPainter}.
 * @property {Kekule.Render.AbstractRenderer} parentRenderer Parent renderer that calls this one.
 *
 * @property {Object} redirectContext If this property is set, renderer will draw on this one instead if the context in drawXXX methods.
 *   This property is used by editor. User should utilize this property with caution.
 */
/**
 * Invoked when a basic object (node, connector, glyph...) is drawn, updated or removed.
 *   event param of it has fields: {obj, parentObj, boundInfo, updateType}
 *   where boundInfo provides the bound box information of this object on context. It has the following fields:
 *   {
 *     context: drawing context object
 *     obj: drawn object
 *     parentObj: parent of drawn object
 *     boundInfo: a hash containing info of bound, including fields:
 *     {
	 *     shapeType: value from {@link Kekule.Render.MetaShapeType} or {@link Kekule.Render.Meta3DShapeType}.
	 *     coords: [Array of coords]
	 *   }
 *     updateType: add, modify or remove
 *   }
 *   boundInfo may also be a array for complex situation (such as multicenter bond): [boundInfo1, boundInfo2, boundInfo3...].
 *   Note that in removed event, boundInfo may be null.
 * @name Kekule.Render.AbstractRenderer#updateBasicDrawObject
 * @event
 */
/**
 * Invoked when whole chem object (molecule, reaction...) is prepared to be drawn in context.
 *   event param of it has two fields: {context, obj}
 * @name Kekule.Render.AbstractRenderer#prepareDrawing
 * @event
 */
/**
 * Invoked when whole chem object (molecule, reaction...) is drawn in context.
 *   event param of it has two fields: {context, obj}
 * @name Kekule.Render.AbstractRenderer#draw
 * @event
 */
/**
 * Invoked when whole chem object (molecule, reaction...) is cleared from context.
 *   event param of it has two fields: {context, obj}
 * NOTE: this event is not well implemented and may be buggy.
 * @name Kekule.Render.AbstractRenderer#clear
 * @event
 */
Kekule.Render.AbstractRenderer = Class.create(ObjectEx,
/** @lends Kekule.Render.AbstractRenderer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.AbstractRenderer',
	/** @private */
	RENDER_CACHE_FIELD: '__$renderCache$__',
	/** @constructs */
	initialize: function($super, chemObj, drawBridge, /*renderConfigs,*/ parent)
	{
		$super();
		this.setPropValue('chemObj', chemObj, true); // since we have no setChemObj method, use this instead
		/*
		if (renderConfigs)
			this.setRenderConfigs(renderConfigs);
		*/
		if (parent)
			this.setParent(parent);
		this.setDrawBridge(drawBridge);

		this.setBubbleEvent(true);  // allow event bubble

		this._suspendUpdateStatus = 0;  // used internal
		this._suspendUpdateInfos = [];
	},
	finalize: function($super)
	{
		//console.log('release renderer', this.getClassName());
		this.setPropValue('chemObj', null, true);
		this.setDrawBridge(null);
		$super();
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('chemObj', {'dataType': 'Kekule.ChemObject', 'serializable': false, 'setter': null});  // readonly
		/*
		this.defineProp('baseCoord', {'dataType': DataType.HASH, 'serializable': false,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('baseCoord');
				if (!result)
					result = this.getAutoBaseCoord();
				return result;
			}
		});
		*/
		this.defineProp('drawBridge', {'dataType': DataType.OBJECT, 'serializable': false});
		//this.defineProp('renderConfigs', {'dataType': DataType.OBJECT, 'serializable': false});
		//this.defineProp('renderCache', {'dataType': DataType.OBJECT, 'serializable': false});
		this.defineProp('parent', {'dateType': DataType.OBJECT, 'serializable': false});
		this.defineProp('parentRenderer',
			{
				'dateType': 'Kekule.Render.AbstractRenderer', 'serializable': false,
				'getter': function()
					{
						var p = this.getParent();
						return (p instanceof Kekule.Render.AbstractRenderer)? p: null;
					},
				'setter': function(value)
					{
						this.setParent(value);
					}
			});

		this.defineProp('redirectContext', {'dataType': DataType.OBJECT, 'serializable': false});

		this.defineEvent('clear');
		this.defineEvent('updateBasicDrawObject');
	},

	/**
	 * Check if current renderer is the topmost one (without parent renderer, but maybe has parent painter).
	 */
	isRootRenderer: function()
	{
		return !this.getParentRenderer();
	},

	/** @private */
	getHigherLevelObj: function()
	{
		return this.getParent();
	},

	/**
	 * Report the type (2D or 3D) of this renderer.
	 * @returns {Int} Value from {@link Kekule.Render.RendererType}.
	 */
	getRendererType: function()
	{
		return Kekule.Render.RendererType.R2D;  // default is 2D renderer
	},

	/**
	 * Returns draw params (center coord, options, matrix...) on last draw process on context.
	 * @returns {Hash}
	 */
	getRenderCache: function(context)
	{
		var result = this.getExtraProp(context, this.RENDER_CACHE_FIELD);
		if (!result)
		{
			result = {};
			this.setExtraProp(context, this.RENDER_CACHE_FIELD, result);
		}
		return result;
		/*
		var result = this._cache; //[this.RENDER_CACHE_FIELD];
		if (!result)
		{
			this._cache = {'field': 'value'};
			result = this._cache;
			console.log('initial render cache', this.getClassName());
		}
		return result;
		*/
	},

	/**
	 * A method that will be called before draw().
	 * Some preparation job can be done here.
	 * Note that only the root renderer will call this method.
	 * @private
	 */
	beginDraw: function(context, baseCoord, options)
	{
		var b = this.getDrawBridge();
		if (b.prepareContext)
			b.prepareContext(context);
	},
	/**
	 * A method that will be called after draw().
	 * Note that only the root renderer will call this method.
	 * @private
	 */
	endDraw: function(context, baseCoord, options)
	{
		// some draw bridge (such as Three.js need to call render method to do actual draw job.
		var b = this.getDrawBridge();
		if (b.renderContext)
			b.renderContext(context);
	},

	/** @private */
	updateDrawInfoInCache: function(chemObj, context, baseCoord, options, realDrawOptions)
	{
		var p = this.getRenderCache(context);
		if (context)
			p.context = context;
		if (baseCoord)
			p.baseCoord = baseCoord;
		if (chemObj)
			p.chemObj = chemObj;
		if (options)
			p.options = options;
		if (realDrawOptions)
			p.realDrawOptions = realDrawOptions;
	},

	/** @private */
	_isCurrChemObjNeedToBeDrawn: function(partialDrawObjs, context)
	{
		var selfObj = this.getChemObj();
		for (var i = 0, l = partialDrawObjs.length; i < l; ++i)
		{
			var obj = partialDrawObjs[i];
			if ((obj === selfObj) || (obj.isChildOf(selfObj)))
				return true;
		}
		return false;
	},

	/**
	 * Auto calculate draw context coord by coord of chem obj. When no baseCoord is provided in draw method,
	 * this result may be used instead.
	 * @param {Hash} drawOptions
	 * @returns {Hash}
	 */
	getAutoBaseCoord: function(drawOptions)
	{
		return this.doGetAutoBaseCoord(drawOptions);
	},
	/**
	 * Do actual work of getAutoBaseCoord.
	 * Descendants need to override this method.
	 * @param {Hash} drawOptions
	 * @returns {Hash}
	 * @private
	 */
	doGetAutoBaseCoord: function(drawOptions)
	{
		return null;
	},

	/** @ignore */
	getCachedDrawOptions: function(context)
	{
		return this.getRenderCache(context).options;
	},
	/** @ignore */
	getCachedDrawnElem: function(context)
	{
		return this.getRenderCache(context).drawnElem;
	},

	/**
	 * Draw an instance of ChemObject to context.
	 * The actual job is done in doDraw method. Descendants should override doDraw.
	 * @param {Object} context Context to be drawn, such as Canvas, SVG, VML and so on.
	 * @param {Hash} baseCoord Base coord to draw this object, can be null to use coord of chemObj itself.
	 *   This coord is based on context.
	 * @param {Hash} options Draw options, such as draw rectangle, draw style, zoom and so on.
	 *   Different renderer may requires different option params.
	 *   In options hash object, there may be one special array field: partialDrawObjs. If this field is set,
	 *   then only chem objects in this array will be actually drawn.
	 * @returns {Object} Drawn element on context (such as SVG) or null on direct context (such as canvas).
	 */
	draw: function(context, baseCoord, options)
	{
		/*
		var p = this.getRenderCache(context);
		p.context = context;
		p.baseCoord = baseCoord;
		p.chemObj = this.getChemObj();
		*/

		//console.log('baseDraw', baseCoord, p);
		//this.updateDrawInfoInCache(this.getChemObj(), context, baseCoord, options);

		var ops = {};
		// actual draw options should also inherited from parent renderer
		var parentOps;
		var parent = this.getParentRenderer();
		if (parent)
		{
			var parentOps = parent.getRenderCache().options;
			/*
			if (parentOps)
				ops = Object.create(parentOps);
			*/
		}
		if (parentOps)
		{
			ops = Object.create(parentOps);
			ops = Object.extend(ops, options);  // self options should override parent one
		}
		else
			ops = Object.create(options || null);

		var chemObj = this.getChemObj();

		var partialDrawObjs = ops.partialDrawObjs;

		/*
		if ((this instanceof Kekule.Render.Ctab2DRenderer))
			console.log(this.getClassName(), partialDrawObjs, !partialDrawObjs || this._isCurrChemObjNeedToBeDrawn(partialDrawObjs, context));
    */

		if (partialDrawObjs && (!this._isCurrChemObjNeedToBeDrawn(partialDrawObjs, context)))
			return null;
		/*
		else if (partialDrawObjs)
			console.log('partial draw objects', this.getClassName(), partialDrawObjs && partialDrawObjs.length);
    */
		//p.options = ops;

		var renderOptionsGetter = (this.getRendererType() === Kekule.Render.RendererType.R3D)?
			'getOverriddenRender3DOptions': 'getOverriddenRenderOptions';

		var localOps = chemObj[renderOptionsGetter]? chemObj[renderOptionsGetter](): null;

		ops = Kekule.Render.RenderOptionUtils.mergeRenderOptions(localOps || {}, ops);

		this.updateDrawInfoInCache(this.getChemObj(), context, baseCoord, options, ops);

		var isRoot = this.isRootRenderer();

		this.invokeEvent('prepareDrawing', {'context': context, 'obj': this.getChemObj()});

		//console.log('DRAW', isRoot);
		if (isRoot)
			this.beginDraw(context, baseCoord, ops);

		var result = this.doDraw(context, baseCoord, ops);
		this.getRenderCache(context).drawnElem = result;
		if (isRoot)
			this.endDraw(context, baseCoord, ops);

		this.invokeEvent('draw', {'context': context, 'obj': this.getChemObj()});

		return result;
	},
	/**
	 * Do actual work of {@link Kekule.Render.AbstractRenderer.draw}.
	 * @param {Object} context Context to be drawn, such as Canvas, SVG, VML and so on.
	 * @param {Hash} baseCoord Coord on context to draw the center of chemObj.
	 * @param {Hash} options Actual draw options, such as draw rectangle, draw style and so on.
	 * @returns {Object} Drawn element on context (such as SVG) or null on direct context (such as canvas).
	 * @private
	 */
	doDraw: function(context, baseCoord, options)
	{
		// do nothing here
		return null;
	},
	/**
	 * Redraw previous object on context with same draw options. Should not be called before draw.
	 * @param {Object} context
	 */
	redraw: function(context)
	{
		var isRoot = this.isRootRenderer();

		//console.log('REDRAW', this.getClassName(), isRoot);
		if (isRoot)
		{
			var cache = this.getRenderCache(context) || {};
			this.beginDraw(context, cache.baseCoord, cache.options);
		}
		var result = this.doRedraw(context);
		this.getRenderCache(context).drawnElem = result;
		if (isRoot)
			this.endDraw(context, cache.baseCoord, cache.options);
		return result;
	},
	/**
	 * Do actual work of {@link Kekule.Render.AbstractRenderer.redraw}. Descendants may override this method.
	 * @param {Object} context
	 * @private
	 */
	doRedraw: function(context)
	{
		// A default implementation. Descendants can override this to provide a more efficient one.
		var p = this.getRenderCache(context);
		//this.clear(context);
		//return this.doDraw(context, p.baseCoord, p.realDrawOptions);
		return this.draw(context, p.baseCoord, p.options);
	},

	/**
	 * Whether current renderer can modify elements drawn on context.
	 * @param {Object} context
	 * @returns {Bool}
	 */
	canModifyGraphic: function(context)
	{
		var b = this.getDrawBridge();
		return b.canModifyGraphic? b.canModifyGraphic(context): false;
	},

	/**
	 * Call this method before a series of rendered element updating job (for instance, call update method)
	 * to avoid unnecessary redraw.
	 */
	beginUpdateRenderer: function()
	{
		++this._suspendUpdateStatus;
	},
	/**
	 * Call this method after a series of rendered element updateing job,
	 * notify the renderer to redraw the context.
	 */
	endUpdateRenderer: function()
	{
		--this._suspendUpdateStatus;
		if (this._suspendUpdateStatus <= 0)
			this._suspendUpdateStatus = 0;
		if (!this.isUpdatingRenderer())
		{
			this.doEndUpdateRenderer();
		}
	},
	/** @private */
	doEndUpdateRenderer: function()
	{
		this.updateEx(this._suspendUpdateInfos);
		this._suspendUpdateInfos = [];
	},
	/**
	 * Check if beginUpdateRenderer is called and endUpdateRenderer is not called yet.
	 * @returns {Bool}
	 */
	isUpdatingRenderer: function()
	{
		return this._suspendUpdateStatus > 0;
	},

	/**
	 * Do a update job according to info provided by updateItems. Must be called after draw.
	 * @param {Array} updateInfos Each item has format: {context, items: [{updateType, updatedObjDetails: [{obj, propNames}]}]}
	 * @returns {Bool}
	 */
	updateEx: function(updateInfos)
	{
		var canModify;
		var result = true;
		if (!this.isUpdatingRenderer())
		{
			canModify = this.canModifyGraphic(context);
			if (canModify)
			{
				//result = this.doUpdate(context, updatedObjs, updateType);
				for (var i = 0, l = updateInfos.length; i < l; ++i)
				{
					var info = updateInfos[i];
					var context = info.context;
					for (var j = 0, k = info.items.length; j < k; ++j)
					{
						var item = info.items[j];
						result = result && this.doUpdate(context, item.updatedObjDetails, item.updateType);
						if (!result)  // update individual failed
							break;
					}
					if (!result)
						break;
				}
			}
			//if (!result)  // can not update by self, call parent or repaint the whole context
			else  // can not modify graphic, call parent to update the whole context
			{
				var isRoot = this.isRootRenderer();
				if (isRoot)
				{
					//console.log('update root', this.getClassName());
					var contexts = [];
					for (var i = 0, l = updateInfos.length; i < l; ++i)
					{
						var info = updateInfos[i];
						var context = info.context;
						Kekule.ArrayUtils.pushUnique(contexts, context);
					}
					for (var i = 0, l = contexts.length; i < l; ++i)
					{
						this.getDrawBridge().clearContext(context);
						var cache = this.getRenderCache(context);
						//console.log('draw root once', this.getClassName());
						this.draw(context, cache.baseCoord, cache.options);
					}
					return true;
				}
				else
				{
					var p = this.getParentRenderer();
					return p.updateEx(updateInfos);
				}
			}
			return result;
		}
		else // updating, suspend
		{
			if (!this._suspendUpdateInfos)
				this._suspendUpdateInfos = [];
			this._mergeRendererUpdateInfo(this._suspendUpdateInfos, updateInfos);
			return true;
		}
	},
	/**
	 * Merge src into dest
	 * @private
	 */
	_mergeRendererUpdateInfo: function(dest, src)
	{
		for (var i = 0, l = src.length; i < l; ++i)
		{
			var info = src[i];
			var index = this._indexOfContextInRendererUpdateInfos(info.context, dest);
			if (index < 0)
				dest.push(info);
			else
			{
				var old = dest[index];
				// TODO: updateType not yet merged
				old.items = old.items.concat(info.items);
			}
		}
		return dest;
	},
	/** @private */
	_indexOfContextInRendererUpdateInfos: function(context, infos)
	{
		for (var i = 0, l = infos.length; i < l; ++i)
		{
			var info = infos[i];
			if (info.context === context)
				return i;
		}
		return -1;
	},

	/**
	 * Update a child object inside chemObj. Must be called after draw.
	 * @param {Object} context
	 * @param {Variant} updatedObjDetails Object detail containing field {obj, propNames} or array of details.
	 * @param {Int} updateType Value from {@link Kekule.Render.ObjectUpdateType}
	 * @returns {Bool}
	 */
	update: function(context, updatedObjDetails, updateType)
	{
		/*
		var result = false;
		if (this.canModifyGraphic(context))
		{
			result = this.doUpdate(context, updatedObjs, updateType);
		}
		if (!result)  // can not update by self, call parent or repaint the whole context
		{
			if (this.isRootRenderer())
			{
				this.getDrawBridge().clearContext(context);
				var cache = this.getRenderCache(context);
				this.draw(context, cache.baseCoord, cache.options);
				return true;
			}
			else
			{
				var p = this.getParentRenderer();
				return p.update(context, updatedObjs, updateType);
			}
		}
		return result;
		*/
		var objDetails = [];
		for (var i = 0, l = updatedObjDetails.length; i < l; ++i)
		{
			var obj = updatedObjDetails[i].obj;
			if (this.isChemObjRenderedBySelf(context, obj))
				objDetails.push(updatedObjDetails[i]);
		}
		if (objDetails.length)
			return this.updateEx([{'context': context, items: [{'updateType': updateType, 'updatedObjDetails': objDetails/*updatedObjs*/}]}]);
		else
			return true;
	},
	/**
	 * Do actual work of update. Descendants should override this.
	 * @param {Object} context
	 * @param {Array} updatedObjDetails  Object detail containing field {obj, propNames} or array of details.
	 * @param {Int} updateType Value from {@link Kekule.Render.ObjectUpdateType}
	 * @returns {Bool}
	 * @private
	 */
	doUpdate: function(context, updatedObjDetails, updateType)
	{
		var r = false;
		if (this.canModifyGraphic(context))
		{
			/*  // TODO: now has bugs, disable it
			    // work well now? 2014-06-06
			 */
			/*
			if (updatedObjs.indexOf(this.getChemObj()))
			{
				if (updateType === Kekule.Render.ObjectUpdateType.CLEAR)
					return this.doClear(context);
				else
				{
					//console.log('update by redraw', this.getClassName(), updatedObjs);
					// simpliest method to update is to redraw the whole chemObj
					this.doClear(context);
					var p = this.getRenderCache(context);
					return this.draw(context, p.baseCoord, p.options);
				}
			}
			*/
			var redrawSelf = false;
			var chemObj = this.getChemObj();
			for (var i = 0, l = updatedObjDetails.length; i < l; ++i)
			{
				var detail = updatedObjDetails[i];
				if (detail.obj === chemObj)
				{
					redrawSelf = true;
					break;
				}
			}
			if (redrawSelf)
			{
				if (updateType === Kekule.Render.ObjectUpdateType.CLEAR)
					return this.doClear(context);
				else
				{
					//console.log('update by redraw', this.getClassName(), updatedObjs);
					// simpliest method to update is to redraw the whole chemObj
					this.doClear(context);
					var p = this.getRenderCache(context);
					return this.draw(context, p.baseCoord, p.options);
				}
			}
			/**/
			/*
			var T = Kekule.Render.ObjectUpdateType;
			switch (updateType)
			{
				case T.ADD:
					r = this.doAddNew(context, updatedObjs);
					break;
				case T.MODIFY:
					r = this.doModify(context, updatedObjs);
					break;
				case T.REMOVE:
					r = this.doRemove(context, updatedObjs);
					break;
				case T.CLEAR:
					r = this.doClear(context);
					this.invokeEvent('clear', {'context': context, 'obj': this.getChemObj()});
					break;
			}
			*/
		}
		return r;
	},

	/** @ignore */
	_extractObjsOfUpdateObjDetails: function(updatedObjDetails)
	{
		return Kekule.Render.UpdateObjUtils._extractObjsOfUpdateObjDetails(updatedObjDetails);
	},
	/** @ignore */
	_createUpdateObjDetailsFromObjs: function(updatedObjs)
	{
		return Kekule.Render.UpdateObjUtils._createUpdateObjDetailsFromObjs(updatedObjs);
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
		var details = this._createUpdateObjDetailsFromObjs(updatedObjs);
		return this.update(context, details, Kekule.Render.ObjectUpdateType.ADD);
	},
	/*
	 * Do actual work of addNew. Descendants should override this.
	 * This function should return true after actual work done. Otherwise false should be returned.
	 * @param {Object} context
	 * @param {Variant} updatedObjs
	 * @returns {Bool}
	 * @private
	 * @deprecated
	 */
	/*
	doAddNew: function(context, updatedObjs)
	{
		return false;
	},
	*/
	/**
	 * Modify chemObj or a child object inside chemObj. Must be called after draw.
	 * @param {Object} context
	 * @param {Variant} updatedObjs
	 * @returns {Bool} Whether the actual modify job is done.
	 * @private
	 */
	modify: function(context, updatedObjDetails)
	{
		return this.update(context, updatedObjDetails, Kekule.Render.ObjectUpdateType.MODIFY);
	},
	/*
	 * Do actual work of modify. Descendants should override this.
	 * This function should return true after actual work done. Otherwise false should be returned.
	 * @param {Object} context
	 * @param {Variant} updatedObjs
	 * @returns {Bool}
	 * @private
	 * @deprecated
	 */
	/*
	doModify: function(context, updatedObjs)
	{
		return false;
	},
	*/
	/**
	 * Remove a child object inside chemObj and update the rendering. Must be called after draw.
	 * @param {Object} context
	 * @param {Variant} removedObjs
	 * @returns {Bool} Whether the actual remove job is done.
	 * @private
	 */
	remove: function(context, removedObjs)
	{
		var details = this._createUpdateObjDetailsFromObjs(removedObjs);
		return this.update(context, details, Kekule.Render.ObjectUpdateType.REMOVE);
	},
	/*
	 * Do actual work of remove. Descendants should override this.
	 * This function should return true after actual work done. Otherwise false should be returned.
	 * @param {Object} context
	 * @param {Variant} removedObjs
	 * @returns {Bool}
	 * @private
	 * @deprecated
	 */
	/*
	doRemove: function(context, removedObjs)
	{
		return false;
	},
	*/

	/**
	 * Clear whole chemObj on context.
	 * @param {Object} context
	 * @returns {Bool} Whether the actual clear job is done.
	 */
	clear: function(context)
	{
		//return this.update(context, Kekule.Render.UpdateObjUtils._createUpdateObjDetailsFromObjs([this.getChemObj()]), Kekule.Render.ObjectUpdateType.CLEAR);
		var result = this.doClear(context);
		this.invokeEvent('clear', {'context': context, 'obj': this.getChemObj()});
	},
	/**
	 * Do actual job of clear. Descendants should override this method.
	 * This function should return true after actual work done. Otherwise false should be returned.
	 * @param {Object} context
	 * @returns {Bool}
	 */
	doClear: function(context)
	{
		if (this.canModifyGraphic())
		{
			//console.log('clear', this.getClassName());
			var drawnElem = this.getRenderCache(context).drawnElem;
			//console.log('clear', drawnElem);
			if (drawnElem)
				this.getDrawBridge().removeDrawnElem(context, drawnElem);
			this.getRenderCache(context).drawnElem = null;
		}
		else
			return false;
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
		var box = this.doEstimateObjBox(context, options, allowCoordBorrow);
		// if box has some field which is undefined or null, set it to 0
		box = this._fillBoxDefaultValue(box, this.getRendererType());
		return box;
	},
	/**
	 * Do actual work of {@link Kekule.Render.AbstractRenderer.estimateObjBox}.
	 * @param {Object} context
	 * @param {Object} options
	 * @param {Bool} allowCoordBorrow
	 * @returns {Hash} A 2D or 3D box.
	 * @private
	 */
	doEstimateObjBox: function(context, options, allowCoordBorrow)
	{
		// do nothing here
		return null;
	},

	/**
	 * Estimate the bound box need to render current chemObj (in context coord system).
	 * Note: this method should not be called outside draw(). Otherwise the result may be unreliable or even no result can be returned.
	 * @param {Object} context
	 * @param {Hash} baseCoord Center coord in context to draw object. Can be null.
	 * @param {Object} options
	 * @param {Bool} allowCoordBorrow
	 * @returns {Hash} A 2D or 3D box, in context's coord system.
	 */
	estimateRenderBox: function(context, baseCoord, options, allowCoordBorrow)
	{
		var box = this.doEstimateRenderBox(context, baseCoord, options, allowCoordBorrow);
		// if box has some field which is undefined or null, set it to 0
		box = this._fillBoxDefaultValue(box, this.getRendererType());
		return box;
	},
	/**
	 * Do actual work of {@link Kekule.Render.AbstractRenderer.estimateRenderBox}.
	 * @param {Object} context
	 * @param {Hash} baseCoord Center coord in context to draw object. Can be null.
	 * @param {Object} options
	 * @param {Bool} allowCoordBorrow
	 * @returns {Hash} A 2D or 3D box.
	 * @private
	 */
	doEstimateRenderBox: function(context, baseCoord, options, allowCoordBorrow)
	{
		// do nothing here
		return null;
	},

	/** @private */
	_fillBoxDefaultValue: function(box, rendererType)
	{
		if (!box)
			box = {};
		var is3D = rendererType === Kekule.Render.RendererType.R3D;
		var r = {
			'x1': box.x1 || 0,
			'x2': box.x2 || 0,
			'y1': box.y1 || 0,
			'y2': box.y2 || 0
		};
		if (is3D)
		{
			r.z1 = box.z1 || 0;
			r.z2 = box.z2 || 0;
		}
		return r;
	},

	/**
	 * Transform a context based coord to inner coord basd on chemObj coord system.
	 * @param {Object} context
	 * @param {Kekule.ChemObject} chemObj
	 * @param {Hash} coord
	 * @returns {Hash}
	 */
	transformCoordToObj: function(context, chemObj, coord)
	{
		return this.doTransformCoordToObj(context, chemObj, coord);
	},
	/** @private */
	doTransformCoordToObj: function(context, chemObj, coord)
	{
		return coord;
	},
	/**
	 * Transform a chemObj based inner coord to context based one.
	 * @param {Object} context
	 * @param {Kekule.ChemObject} chemObj
	 * @param {Hash} coord
	 * @returns {Hash}
	 */
	transformCoordToContext: function(context, chemObj, coord)
	{
		return this.doTransformCoordToContext(context, chemObj, coord);
	},
	/** @private */
	doTransformCoordToContext: function(context, chemObj, coord)
	{
		return coord;
	},
	/**
	 * Transform a context based coord to screen based one (usually in pixel).
	 * @param {Object} context
	 * @param {Hash} coord
	 * @return {Hash}
	 */
	transformContextCoordToScreen: function(context, coord)
	{
		return this.doTransformContextCoordToScreen(context, coord);
	},
	/** @private */
	doTransformContextCoordToScreen: function(context, coord)
	{
		var b = this.getDrawBridge();
		return (b && b.transformContextCoordToScreen)? b.transformContextCoordToScreen(context, coord): coord;
	},

	/**
	 * Should be called when a basic object (node, connector, glyph...) is drawn on context.
	 * @param {Object} obj
	 * @param {Object} boundInfo
	 * @private
	 */
	basicDrawObjectUpdated: function(context, obj, parentObj, boundInfo, updateType)
	{
		/*
		if (!boundInfo)
			console.log(arguments.callee.caller.toString());
		*/
		this.invokeEvent('updateBasicDrawObject', {'context': context, 'obj': obj, 'parentObj': parentObj, 'boundInfo': boundInfo, 'updateType': updateType});
	},

	/**
	 * Indicate whether a chemObj (including childObj) is rendered by this renderer, or should be rendered by this renderer.
	 * Descendants may override this method.
	 * @param {Object} context
	 * @param {Object} obj
	 * @returns {boolean}
	 */
	isChemObjRenderedBySelf: function(context, obj)
	{
		return (obj === this.getRenderCache(context).chemObj);
	},
	/**
	 * Indicate whether a chemObj (including childObj) is rendered directly by this renderer (not by child renderers).
	 * Descendants may override this method.
	 * @param {Object} context
	 * @param {Object} obj
	 * @returns {boolean}
	 */
	isChemObjRenderedDirectlyBySelf: function(context, obj)
	{
		if (obj && this.getRenderCache(context).chemObj)
			return (obj === this.getRenderCache(context).chemObj);
		else
			return false;
	},

	/** @private */
	createBoundInfo: function(boundType, coords, additionalInfos)
	{
		return Kekule.Render.MetaShapeUtils.createShapeInfo(boundType, coords, additionalInfos);
	},
	/** @private */
	createPointBoundInfo: function(coord)
	{
		return this.createBoundInfo(Kekule.Render.BoundShapeType.POINT, [coord]);
	},
	/** @private */
	createCircleBoundInfo: function(coord, radius)
	{
		return this.createBoundInfo(Kekule.Render.BoundShapeType.CIRCLE, [coord], {'radius': radius});
	},
	/** @private */
	createLineBoundInfo: function(coord1, coord2, width)
	{
		return this.createBoundInfo(Kekule.Render.BoundShapeType.LINE, [coord1, coord2], {'width': width});
	},
	/** @private */
	createRectBoundInfo: function(coord1, coord2)
	{
		return this.createBoundInfo(Kekule.Render.BoundShapeType.RECT, [coord1, coord2]);
	},
	/** @private */
	createSphereBoundInfo: function(coord, radius)
	{
		return this.createBoundInfo(Kekule.Render.BoundShapeType.SPHERE, [coord], {'radius': radius});
	},
	/** @private */
	createCylinderBoundInfo: function(coord1, coord2, radius)
	{
		return this.createBoundInfo(Kekule.Render.BoundShapeType.CYLINDER, [coord1, coord2], {'radius': radius});
	}
});
Kekule.ClassDefineUtils.addExtraObjMapSupport(Kekule.Render.AbstractRenderer);

/**
 * A dummy renderer that does nothing.
 * @class
 * @augments Kekule.Render.AbstractRenderer
 */
Kekule.Render.DummyRenderer = Class.create(Kekule.Render.AbstractRenderer,
/** @lends Kekule.Render.DummyRenderer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.DummyRenderer',
	/** @ignore */
	draw: function(context, baseCoord, options)
	{
		return;
	},
	/** @ignore */
	redraw: function(context)
	{
		return;
	}
});

/**
 * 2D renderer factory.
 * @class
 */
Kekule.Render.Renderer2DFactory = Kekule.FactoryUtils.createSimpleFactory(Kekule.FactoryUtils.MATCH_BY_CLASS);
/**
 * Returns a suitable 2D renderer class for chemObj
 * @param {Object} chemObj
 * @returns {Kekule.Render.AbstractRenderer}
 * @function
 */
Kekule.Render.get2DRendererClass = function(chemObj)
{
	var aClass = (chemObj instanceof ObjectEx)? chemObj.getClass(): chemObj;
	return Kekule.Render.Renderer2DFactory.getClass(aClass);
};
/**
 * 3D renderer factory.
 * @class
 */
Kekule.Render.Renderer3DFactory = Kekule.FactoryUtils.createSimpleFactory(Kekule.FactoryUtils.MATCH_BY_CLASS);
/**
 * Returns a suitable 3D renderer class for chemObj
 * @param {Object} chemObj
 * @returns {Kekule.Render.AbstractRenderer}
 * @function
 */
Kekule.Render.get3DRendererClass = function(chemObj)
{
	var aClass = (chemObj instanceof ObjectEx)? chemObj.getClass(): chemObj;
	return Kekule.Render.Renderer3DFactory.getClass(aClass);
};


/**
 * Implemtation of 2D/3D draw bridge manager.
 * @class
 * @ignore
 */
Kekule.Render.DrawBridgeManager = Class.create({
	/** @private */
	CLASS_NAME: 'Kekule.Render.DrawBridgeManager',
	/** @ignore */
	initialize: function()
	{
		this._items = [];
		this._preferredItem = null;
	},
	/** @private */
	_indexOfBridgeClass: function(bridgeClass)
	{
		for (var i = 0, l = this._items.length; i < l; ++i)
		{
			var item = this._items[i];
			if (item.bridgeClass === bridgeClass)
				return i;
		}
		return -1;
	},
	/** @private */
	_sortItems: function()
	{
		this._items.sort(
			function(item1, item2)
			{
				return (item1.priorityLevel || 0) - (item2.priorityLevel || 0);
			}
		)
	},
	/** @private */
	_reselectPreferred: function()
	{
		this._sortItems();
		for (var i = this._items.length - 1; i >= 0; --i)
		{
			var item = this._items[i];
			if (item.isSupported)
			{
				this._preferredItem = item;
				return item;
			}
		}
		this._preferredItem = null;
		return null;
	},

	/**
	 * Register a bridge.
	 * @param {Class} bridgeClass
	 * @param {Int} priorityLevel
	 * @returns {Object}
	 * @ignore
	 */
	register: function(bridgeClass, priorityLevel)
	{
		if (!priorityLevel)
			priorityLevel = 0;
		var index = this._indexOfBridgeClass(bridgeClass);
		var item;
		if (index >= 0)
		{
			item = this._items[index];
			item.priorityLevel = priorityLevel;
		}
		else
		{
			item = {'bridgeClass': bridgeClass, 'priorityLevel': priorityLevel};
			item.isSupported = bridgeClass.isSupported? bridgeClass.isSupported(): false;
			this._items.push(item);
		}
		this._sortItems();

		if ((!this._preferredItem) || (this._preferredItem.priorityLevel < priorityLevel))
		{
			if (item.isSupported)  // if isSupported method not exists, assure it always not be supported
				this._preferredItem = item;
		}

		return item;
	},

	/**
	 * Unregister a bridge.
	 * @param {Class} bridgeClass
	 * @returns {Object}
	 * @ignore
	 */
	unregister: function(bridgeClass)
	{
		var item = null;
		var i = this._indexOfBridgeClass(bridgeClass);
		if (i >= 0)
		{
			item = this._items[i];
			this._items.splice(i, 1);
			if (item === this._preferredItem)
				this._reselectPreferred();
		}
		return item;
	},

	/**
	 * Gets most suitable bridge class in current environment.
	 * @returns {Class}
	 * @ignore
	 */
	getPreferredBridgeClass: function()
	{
		return (this._preferredItem)? this._preferredItem.bridgeClass: null;
	},
	/**
	 * Returns instance of preferred bridge in current environment.
	 * @returns {Object}
	 * @ignore
	 */
	getPreferredBridgeInstance: function()
	{
		var c = this.getPreferredBridgeClass();
		if (c)
		{
			/*
			if (!c.getInstance)  // class has not been singletoned
				Kekule.ClassUtils.makeSingleton(c);
			return c.getInstance()
			*/
			return new c();
		}
		else
			return null;
	}
});

/**
 * Draw bridge manager for 2D rendering.
 * @object
 */
Kekule.Render.DrawBridge2DMananger = new Kekule.Render.DrawBridgeManager();
/**
 * Draw bridge manager for 3D rendering.
 * @object
 */
Kekule.Render.DrawBridge3DMananger = new Kekule.Render.DrawBridgeManager();