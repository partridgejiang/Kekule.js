/**
 * @fileoverview
 * Class to store UI marker information and the renderer to draw them on context.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /utils/kekule.utils.js
 * requires /render/kekule.render.base.js
 * requires /render/2d/kekule.renderer2D.js
 */

(function()
{

"use strict";

var oneOf = Kekule.oneOf;

/**
 * A abstract marker on context.
 * @class
 * @augments ObjectEx
 *
 * @property {Hash} drawStyles Styles to draw this marker. Can including the following fields:
 *   {
 * 	   strokeWidth, strokeColor: stroke property when drawing marker.
 *     strokeDash: whether the stroke is dashed.
 *     fillColor: fill color when drawing marker, if not set, the marker will not be filled.
 *     opacity: opacity to draw marker.
 * 	 }
 * @property {Bool} visible Whether this marker can be seen in context.
 */
Kekule.ChemWidget.AbstractUIMarker = Class.create(ObjectEx,
/** @lends Kekule.ChemWidget.AbstractUIMarker# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.AbstractUIMarker',
	/** @constructs */
	initialize: function($super)
	{
		$super();
		this.setVisible(true);
	},
	/** @private */
	initProperties: function()
	{
		// draw styles
		this.defineProp('drawStyles', {'dataType': DataType.OBJECT});
		this.defineProp('visible', {'dataType': DataType.BOOL});
	}
});

/**
 * A marker based on meta shape (line, rect, circle...)
 * @class
 * @augments Kekule.ChemWidget.AbstractUIMarker
 *
 * @property {Hash} shapeInfo Meta shape object.
 * @property {Int} shapeType Type of shape.
 */
Kekule.ChemWidget.MetaShapeUIMarker = Class.create(Kekule.ChemWidget.AbstractUIMarker,
/** @lends Kekule.ChemWidget.MetaShapeUIMarker# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.MetaShapeUIMarker',
	/** @constructs */
	initialize: function($super, shapeInfo)
	{
		$super();
		if (shapeInfo)
			this.setShapeInfo(shapeInfo);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('shapeInfo', {'dataType': DataType.OBJECT});
		this.defineProp('shapeType', {'dataType': DataType.INT, 'serializable': false, 'setter': null,
			'getter': function()
				{
					var info = this.getShapeInfo();
					return info? info.shapeType: null;
				}
		});
	}
});

/**
 * Represents all UI markers on context.
 * @class
 * @augments ObjectEx
 *
 * @property {Array} markers All markers.
 */
Kekule.ChemWidget.UiMarkerCollection = Class.create(ObjectEx,
/** @lends Kekule.ChemWidget.UiMarkerCollection# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.UiMarkerCollection',
	/** @private */
	initProperties: function()
	{
		this.defineProp('markers', {
			'dataType': DataType.ARRAY,
			'getter': function()
				{
					var result = this.getPropStoreFieldValue('markers');
					if (!result)
					{
						result = [];
						this.setPropStoreFieldValue('markers', result);
					}
					return result;
				},
			'setter': null
		});
	},
	/**
	 * Get marker count.
	 * @returns {Int}
	 */
	getMarkerCount: function()
	{
		return this.getMarkers().length;
	},
	/**
	 * Get marker at index.
	 * @param {Int} index
	 * @returns {Kekule.ChemWidget.AbstractMarker}
	 */
	getMarkerAt: function(index)
	{
		return this.getMarkers()[index];
	},
	/**
	 * Add a marker to collection.
	 * @param {Kekule.ChemWidget.AbstractMarker} marker
	 */
	addMarker: function(marker)
	{
		return this.getMarkers().push(marker);
	},
	/**
	 * Get index of marker in collection.
   * @param {Kekule.ChemWidget.AbstractMarker} marker
   * @returns {Int}
	 */
	indexOfMarker: function(marker)
	{
		return this.getMarkers().indexOf(marker);
	},
	/**
	 * Remove a marker in collection.
   * @param {Kekule.ChemWidget.AbstractMarker} marker
	 */
	removeMarker: function(marker)
	{
		var markers = this.getMarkers();
		var index = markers.indexOf(marker);
		if (index >= 0)
			markers.splice(index, 1);
	},
	/**
	 * Remove all markers in collection.
	 */
	clearMarkers: function()
	{
		this.setPropStoreFieldValue('markers', []);
	}
});


/**
 * Render to draw markers of a {@link Kekule.ChemWidget.UIElementCollection}
 * @class
 * @augments Kekule.Render.Base2DRenderer
 */
Kekule.ChemWidget.UiMarkersRenderer = Class.create(Kekule.Render.Base2DRenderer,
/** @lends Kekule.ChemWidget.UiMarkersRenderer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.UiMarkersRenderer',
	/** @private */
	DRAW_ELEM_FIELD: '__$drawElem__',
	/* @constructs */
	initialize: function($super, obj, renderBridge)
	{
		$super(obj, renderBridge);
		this._drawGroup = null;
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('dummy', {'dataType': DataType.OBJECT, 'serializable': false});
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
	doEstimateRenderBox: function(context, baseCoord, options, allowCoordBorrow)
	{
		return null;  // usually do not need render box information
	},
	/** @private */
	doDraw: function($super, context, baseCoord, options)
	{
		$super(context, baseCoord, options);
		//this._drawParams = {'baseCoord': baseCoord, 'options': options};
		// some params (such as baseCoord) are useless here
		var collection = this.getChemObj();
		var group = this.createDrawGroup(context);
		this.setObjDrawElem(context, collection, group);
		if (collection.getMarkerCount() > 0)
		{
			this.doDrawMarkers(context, group, collection.getMarkers(), options);
		}
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
					var objs = this._extractObjsOfUpdateObjDetails(updatedObjDetails);
					r = this.doRemove(context, objs);
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
		if (this.canRemoveElem())
			return this.doModify(context, updatedObjDetails);
		else
			return false;
			//return $super(context, updatedObj);
	},
	/** @private */
	doModify: function(/*$super,*/ context, updatedObjDetails)
	{
		if (this.canRemoveElem())
		{
			// find old corresponding element to updatedObj and remove it
			/*
			var elem = this.getObjDrawElem(updatedObj);
			if (elem)
				this.doRemoveElem(context, elem);
			*/
			var objs = this._extractObjsOfUpdateObjDetails(updatedObjDetails);
			this.remove(context, objs);
			// then update new one
			var chemObj = this.getChemObj();
			var group = this.getObjDrawElem(chemObj);
			var params = this.getDrawParams();
			if (objs.indexOf(chemObj) >= 0) // update whole
			{
				this.draw(context, params.baseCoord, params.options);
			}
			else
			{
				this.doDrawMarkers(context, group, objs, params.options);
			}
		}
		else
			return false;
			//return $super(context, chemObj, updatedObj);
	},
	/** @private */
	doRemove: function(/*$super,*/ context, removedObj)
	{
		if (this.canRemoveElem())
		{
			// find old corresponding element to updatedObj and remove it
			var elem = this.getObjDrawElem(removedObj);
			if (elem)
			{
				var group = this.getObjDrawElem(this.getChemObj());
				this.doRemoveFromGroup(elem, group);
				this.doRemoveElem(context, elem);
				this.setObjDrawElem(removedObj, null);
			}
		}
		else
			return false;
			//return $super(context, removedObj);
	},
	/** @private */
	doDrawMarkers: function(context, group, markers, options)
	{
		for (var i = 0, l = markers.length; i < l; ++i)
		{
			var marker = markers[i];
			if (marker.getVisible())
				this.doDrawMarker(context, group, marker, options);
		}
	},
	/** @private */
	doDrawMarker: function(context, group, marker, options)
	{
		var shapeInfo = marker.getShapeInfo();
		if (!shapeInfo)
			return null;

		/*
		var ops = options || {};
		var styles = marker.getDrawStyles() || {};
		var strokeWidth = oneOf(styles.strokeWidth, ops.strokeWidth, 1);
		var strokeColor = oneOf(styles.strokeColor, ops.strokeColor, styles.color, ops.color);
		var fillColor = oneOf(styles.fillColor, ops.fillColor, styles.color, ops.color);
		var opacity = oneOf(styles.opacity, ops.opacity, 1);
		var strokeDash = oneOf(styles.strokeDash, ops.strokeDash, null);

		var drawOptions = {
			'strokeWidth': strokeWidth,
			'strokeColor': strokeColor,
			'fillColor': fillColor,
			'opacity': opacity,
			'strokeDash': strokeDash
		};
		*/
		var ops = Object.create(options);
		ops = Object.extend(marker.getDrawStyles() || {});

		// set stroke & fill color and so on
		if (ops.color)
		{
			if (!ops.strokeColor)
				ops.strokeColor = ops.color;
			if (!ops.fillColor)
				ops.fillColor = ops.color;
		}

		var result;
		// TODO: now only handles meta shape markers
		if (Kekule.ArrayUtils.isArray(shapeInfo))  // composite shapes
		{
			if (shapeInfo.length > 1)  // more than one shape, need draw group
			{
				result = this.createDrawGroup(context);
				for (var i = 0, l = shapeInfo.length; i < l; ++i)
				{
					var shape = shapeInfo[i];
					this.doDrawShape(context, result, shape, ops);
				}
			}
			else if (shapeInfo.length === 1)  // only one shape, no need of group
			{
				result = this.doDrawShape(context, null, shapeInfo[0], ops);
			}
			else  // no actual shapes
				return null;
		}
		else
			result = this.doDrawShape(context, null, shapeInfo, ops);
		if (result)
		{
			this.setObjDrawElem(context, marker, result);
			if (group)
				this.addToDrawGroup(result, group);
		}
		return result;
	},

	/**
	 * Draw a single shape of marker.
	 * @param context
	 * @param markerGroup
	 * @param shape
	 * @param options
	 * @private
	 */
	doDrawShape: function(context, markerGroup, shape, options)
	{
		var T = Kekule.Render.MetaShapeType;
		var result;

		if (Kekule.Render.MetaShapeUtils.isCompositeShape(shape))  // complex shape
		{
			result = this.createDrawGroup(context);
			for (var i = 0, l = shape.length; i < l; ++i)
			{
				var childResult = this.doDrawShape(context, result, shape[i], options);
			}
		}
		else  // simple shape
		{
			var coords = shape.coords;
			switch (shape.shapeType)
			{
				// TODO: Point and circle currently does not support stroke dash
				case T.POINT:
					result = this.drawCircle(context, coords[0], 1, options); break;
				case T.CIRCLE:
					result = this.drawCircle(context, coords[0], shape.radius, options); break;
				case T.LINE:
				{
					var ops = options;
					if (shape.width)
					{
						ops = Object.create(options);
						ops.strokeWidth = shape.width;
					}
					result = this.drawLine(context, coords[0], coords[1], ops); break;
				}
				case T.RECT:
				{
					/*
					 if (!strokeDash)
					 result = this.doDrawRect(context, coords[0], coords[1], strokeWidth, strokeColor, fillColor, opacity);
					 else
					 {
					 result = this.doCreateGroup(context);
					 var coords = [coords[0], {x: coords[0].x, y: coords[1].y}, coords[1], {x: coords[1].x, y: coords[0].y}, coords[0]];
					 var args = [];
					 for (var i = 0, l = coords.length; i < l; ++i)
					 {
					 var sMethod = (i === 0)? 'M': 'L';
					 args.push(sMethod);
					 var coordArray = [coords[i].x, coords[i].y];
					 args.push(coordArray);
					 }
					 var path = Kekule.Render.DrawPathUtils.makePath.apply(this, args);
					 result = this.doDrawPath(context, path, strokeWidth, strokeColor, strokeDash, fillColor, opacity);
					 }
					 */
					result = this.drawRect(context, coords[0], coords[1], options);
					break;
				}
				case T.POLYGON:
				{
					var args = [];
					for (var i = 0, l = coords.length; i < l; ++i)
					{
						var sMethod = (i === 0)? 'M': 'L';
						args.push(sMethod);
						var coordArray = [coords[i].x, coords[i].y];
						args.push(coordArray);
					}
					// close
					args.push('L');
					coordArray = [coords[0].x, coords[0].y];
					args.push(coordArray);
					var path = Kekule.Render.DrawPathUtils.makePath.apply(this, args);
					result = this.drawPath(context, path, options);
					break;
				}
			}
		}
		if (markerGroup)
			this.addToDrawGroup(result, markerGroup);
		return result;
	}
});
//Kekule.ClassDefineUtils.addExtraObjMapSupport(Kekule.ChemWidget.UIElementsRenderer);
Kekule.ClassDefineUtils.addExtraTwoTupleObjMapSupport(Kekule.ChemWidget.UiMarkersRenderer);

// register renderers
Kekule.Render.Renderer2DFactory.register(Kekule.ChemWidget.UiMarkerCollection, Kekule.ChemWidget.UiMarkersRenderer);

})();
