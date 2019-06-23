/**
 * @fileoverview
 * A default implementation of 2D renderer to render small glyphs.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /render/2d/kekule.render.render2D.js
 */

(function()
{

/** @ignore */
var PU = Kekule.Render.DrawPathUtils;
var CU = Kekule.CoordUtils;
var oneOf = Kekule.oneOf;

var NT = Kekule.Glyph.NodeType;
var PT = Kekule.Glyph.PathType;

/**
 * Class to render a of small glyph.
 * @class
 * @augments Kekule.Render.ChemObj2DRenderer
 */
Kekule.Render.BaseGlyph2DRenderer = Class.create(Kekule.Render.ChemObj2DRenderer,
/** @lends Kekule.Render.BaseGlyph2DRenderer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.BaseGlyph2DRenderer',
	/** @private */
	doDraw: function($super, context, baseCoord, options)
	{
		var ops = Object.create(options);
		ops.strokeColor = options.strokeColor || options.glyphStrokeColor;
		ops.fillColor = options.fillColor || options.glyphFillColor;
		ops.strokeWidth = options.strokeWidth || options.glyphStrokeWidth;
		return $super(context, baseCoord, ops);
	}
});

/**
 * A default implementation of 2D a molecule's CTab renderer.
 * @class
 * @augments Kekule.Render.Ctab2DRenderer
 */
Kekule.Render.PathGlyphCtab2DRenderer = Class.create(Kekule.Render.Ctab2DRenderer,
/** @lends Kekule.Render.PathGlyphCtab2DRenderer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.PathGlyphCtab2DRenderer',
	/** @constructs */
	initialize: function($super, chemObj, drawBridge, parent)
	{
		$super(chemObj, drawBridge, parent);
		this._nodeCoordOverrideMap = new Kekule.MapEx(true);  // non-weak, for clear call
	},
	/** @ignore */
	doFinalize: function($super)
	{
		this._nodeCoordOverrideMap.finalize();
		$super();
	},

	/** @private */
	extractGlyphDrawOptions: function(renderOptions)
	{
		var unitLength = renderOptions.unitLength || 1;
		return {
			'strokeColor': renderOptions.strokeColor || renderOptions.color || renderOptions.glyphStrokeColor,
			'fillColor': renderOptions.fillColor || renderOptions.color || renderOptions.glyphFillColor,
			'strokeWidth': (renderOptions.strokeWidth || renderOptions.glyphStrokeWidth) * unitLength
		}
	},
	/** @private */
	doDraw: function($super, context, baseCoord, options)
	{
		//console.log('do draw ctab');
		var result = $super(context, baseCoord, options);
		this._nodeCoordOverrideMap.clear();  // clear override map after a full draw
		return result;
	},
	/** @private */
	doDrawNode: function(context, group, node, parentChemObj, options, finalTransformOptions)
	{
		var boundInfo;
		var nodeType = node.getNodeType();
		if (!nodeType || nodeType === NT.LOCATION || nodeType === NT.CONTROLLER)  // no need to draw, but add bound info
		{
			var overrideCoord = this._nodeCoordOverrideMap.get(node);  // node coord maybe overrided by connector drawing for offset bounds
			var coord = overrideCoord || this.getTransformedCoord2D(context, node, finalTransformOptions.allowCoordBorrow);
			boundInfo = this.createPointBoundInfo(coord);
		}

		if (boundInfo)
		{
			this.basicDrawObjectUpdated(context, node, parentChemObj, boundInfo, Kekule.Render.ObjectUpdateType.ADD);
		}
	},
	/** @private */
	doDrawConnector: function($super, context, group, connector, parentChemObj, options, finalTransformOptions)
	{
		var result = $super(context, group, connector, parentChemObj, options, finalTransformOptions);

		// if connector has control point, add bound info
		var controlPoints = connector.getControlPoints && connector.getControlPoints();
		if (controlPoints)
		{
			for (var i = 0, l = controlPoints.length; i < l; ++i)
			{
				var coord = this.getTransformedCoord2D(context, controlPoints[i], finalTransformOptions.allowCoordBorrow);
				//console.log('transformed control point coord', coord);
				var boundInfo = this.createPointBoundInfo(coord);
				this.basicDrawObjectUpdated(context, controlPoints[i], connector, boundInfo, Kekule.Render.ObjectUpdateType.ADD);
			}
		}

		return result;
	},
	/** @private */
	doDrawConnectorShape: function(context, connector, nodes, renderOptions, finalTransformOptions)
	{
		/*
		var coord1 = Object.extend({}, this.getTransformedCoord2D(context, node1, finalTransformOptions.allowCoordBorrow));
		var coord2 = Object.extend({}, this.getTransformedCoord2D(context, node2, finalTransformOptions.allowCoordBorrow));
		*/
		var AS = Kekule.Glyph.ArrowSide;

		var node1 = nodes[0];
		var node2 = nodes[1];
		var coord1 = CU.clone(this.getTransformedCoord2D(context, node1, finalTransformOptions.allowCoordBorrow));
		var coord2 = CU.clone(this.getTransformedCoord2D(context, node2, finalTransformOptions.allowCoordBorrow));
		var drawOptions = this.extractGlyphDrawOptions(renderOptions);

		var pathType = connector.getPathType();
		var pathParams = connector.getPathParams() || {};

		var ctab = this.getChemObj();

		// prepare draw parell paths
		var lineGap = (pathParams.lineGap || 0) * renderOptions.defScaleRefLength;
		var lineCount = lineGap? (pathParams.lineCount || 1): 1;
		//var isEven = lineCount & 1;  // even or order number
		//if ((lineCount > 1) && lineGap)

		/*
		var coordDelta  = CU.substract(coord2, coord1);
		var w = coordDelta.x;
		var h = coordDelta.y;
		var l = CU.getDistance(coord1, coord2);
		var angleSin = h / l;
		var angleCos = w / l;

		var deltaObjVector = {'y': lineGap * angleCos, 'x': lineGap * angleSin};
		var deltaScreenCoord = CU.substract(
			this.transformCoordToContext(context, ctab, {'x': 0, 'y': 0}),
			this.transformCoordToContext(context, ctab, deltaObjVector)
		);
		var lineScreenGap = CU.getDistance(deltaScreenCoord, {'x': 0, 'y': 0});
		var totalDeltaScreenCoord = CU.multiply(deltaScreenCoord, (lineCount - 1) / 2);
		*/

		// prepare draw arrows
		var startArrowParams, endArrowParams;
		var arrowElems = [];
		if (!!pathParams.startArrowType && pathParams.startArrowWidth)
		{
			var transedLengthes = this._transformArrowLength(context, pathParams.startArrowLength, pathParams.startArrowWidth);
			startArrowParams = {
				arrowLength: transedLengthes.arrowLength,
				arrowWidth: transedLengthes.arrowWidth,
				arrowType: pathParams.startArrowType,
				arrowSide: pathParams.startArrowSide,
				drawOnCenter: (!pathParams.startArrowSide || pathParams.startArrowSide === AS.BOTH)
				//arrowOffset: pathParams.startArrowOffset
			};
		}
		if (!!pathParams.endArrowType && pathParams.endArrowWidth)
		{
			var transedLengthes = this._transformArrowLength(context, pathParams.endArrowLength, pathParams.endArrowWidth);
			var endArrowParams = {
				arrowLength: transedLengthes.arrowLength,
				arrowWidth: transedLengthes.arrowWidth,
				arrowType: pathParams.endArrowType,
				arrowSide: pathParams.endArrowSide,
				//arrowOffset: pathParams.endArrowOffset
				drawOnCenter: (!pathParams.endArrowSide || pathParams.endArrowSide === AS.BOTH)
			};
		}

		// calculate the autoOffset positions
		var offsetBounds = [];
		var inflateShape = Kekule.Render.MetaShapeUtils.inflateShape;
		for (var i = 0, l = nodes.length; i < l; ++i)
		{
			var nodeParams = nodes[i].getPathNodeParams();
			if (nodeParams.useStickingOffset)
			{
				var offsetBound = this.getStickingTargetRenderBound(context, nodes[i]);
				if (offsetBound)
				{
					var offsetRelLength = nodeParams.stickingOffsetRelLength;
					if (Kekule.ObjUtils.isUnset(offsetRelLength))
					{
						offsetRelLength = renderOptions.glyphStickOffsetRelLength;
					}
					if (offsetRelLength)
					{
						var offsetContextLength = this._doGetStickOffsetContextLength(context, offsetRelLength, renderOptions);
						offsetBound = inflateShape(offsetBound, offsetContextLength);
					}
					offsetBounds[i] = offsetBound;
				}
			}
		}
		/*
		var offsetBound1, offsetBound2;
		if (pathParams.autoOffset)
		{
			offsetBound1 = this.getStickingTargetRenderBound(context, node1);
			offsetBound2 = this.getStickingTargetRenderBound(context, node2);
			//console.log(connector.getClassName(), 'autoOffset', offsetBound1, offsetBound2);
			// calculate the glyphStickOffsetRefLength, do the offset
		}
		//var offsetBounds = [offsetBound1, offsetBound2];
		if (offsetBound1 || offsetBound2)
		{
			//console.log(renderOptions);
			var offsetRelLength = pathParams.glyphStickOffsetRelLength || renderOptions.glyphStickOffsetRelLength;
			var offsetContextLength = offsetRelLength? this._doGetStickOffsetContextLength(context, offsetRelLength, renderOptions): null;
			if (offsetContextLength)
			{
				var inflateShape = Kekule.Render.MetaShapeUtils.inflateShape;
				for (var i = 0, l = offsetBounds.length; i < l; ++i)
				{
					if (offsetBounds[i])
					{
						//console.log('before inflate', offsetBounds[i], offsetContextLength);
						offsetBounds[i] = inflateShape(offsetBounds[i], offsetContextLength);
						//console.log('after inflate', offsetBounds[i]);
					}
				}
			}
		}
		*/

		// draw parrel lines
		var drawnElems = [];
		var boundInfos = [];
		/*
		var distance = l;
		var midNo = (lineCount - 1) / 2;
		*/

		var deltaObjVector = {'y': 0, 'x': lineGap};
		var deltaScreenCoord = CU.substract(
				this.transformCoordToContext(context, ctab, {'x': 0, 'y': 0}),
				this.transformCoordToContext(context, ctab, deltaObjVector)
		);
		var lineScreenGap = CU.getDistance(deltaScreenCoord, {'x': 0, 'y': 0});

		if (pathType === PT.LINE)
		{
			var lineResult = this._doDrawLineConnectorShape(context, ctab, connector, nodes, coord1, coord2, lineCount, lineScreenGap, startArrowParams, endArrowParams, offsetBounds, drawOptions, renderOptions);
			drawnElems = lineResult.drawnElems;
			arrowElems = lineResult.arrowElems;
			boundInfos = lineResult.boundInfos;
		}
		else if (pathType === PT.ARC)
		{
			var controlPoints = connector.getControlPoints && connector.getControlPoints();
			var controlPoint = controlPoints && controlPoints[0];
			if (controlPoint)  // can drawn only when has control point
			{
				var coordController = CU.clone(this.getTransformedCoord2D(context, controlPoint, finalTransformOptions.allowCoordBorrow));

				var lineResult = this._doDrawArcConnectorShape(context, ctab, connector, nodes, coord1, coord2, coordController, lineCount, lineScreenGap, startArrowParams, endArrowParams, offsetBounds, drawOptions, renderOptions);
				drawnElems = lineResult.drawnElems;
				arrowElems = lineResult.arrowElems;
				boundInfos = lineResult.boundInfos;
			}
		}

		if (!boundInfos.length)
			boundInfos = null;

		if ((lineCount <= 1) && !arrowElems.length)
			return {element: drawnElems && drawnElems[0], boundInfo: boundInfos && boundInfos[0]};
		else
		{
			var drawnGroup = this.createDrawGroup(context);
			for (var i = 0; i < lineCount; ++i)
			{
				if (drawnElems[i])
					this.addToDrawGroup(drawnElems[i], drawnGroup);
			}
			for (var i = 0, l = arrowElems.length; i < l; ++i)
			{
				if (arrowElems[i])
					this.addToDrawGroup(arrowElems[i], drawnGroup);
			}
			return {element: drawnGroup, boundInfo: boundInfos};
		}
	},
	/** @private */
	_doGetStickOffsetContextLength: function(context, offsetRelLength, renderOptions)
	{
		var objLength = offsetRelLength * renderOptions.medianObjRefLength;
		var coord0 = {x: 0, y: 0};
		var coord1 = {x: objLength, y: 0};
		var renderer = this.getRootRenderer();
		var contextCoord0 = renderer.transformCoordToContext(context, this.getChemObj(), coord0);
		var contextCoord1 = renderer.transformCoordToContext(context, this.getChemObj(), coord1);
		return CU.getDistance(contextCoord0, contextCoord1)
	},
	/* @private */
	/*
	_doCalcBoundInterectPointToLinePath: function(bound, coord1, coord2)
	{

	},
	*/

	/** @private */
	_doDrawLineConnectorShape: function(context, ctab, connector, nodes, coord1, coord2, lineCount, lineGap, startArrowParams, endArrowParams, offsetBounds, shapeDrawOptions, otherRenderOptions)
	{
		// TODO: currently a very rough approach, only support rect bound (for drawing line to atom label)
		var actualEndCoords = [coord1, coord2];
		var testVector = [coord1, coord2];
		var midCoord = CU.divide(CU.add(coord1, coord2), 2);
		for (var i = 0; i < 2; ++i)
		{
			var offsetBound = offsetBounds[i];
			if (offsetBound)
			{
				var crossPoints = Kekule.Render.MetaShapeUtils.getCrossPointsOfVectorToShapeEdges(testVector, offsetBound, true); // shortcut when find the first cross point
				//console.log('line cross', crossPoints);
				if (crossPoints && crossPoints.length)  // we should draw line to this point rather than the original end point
				{
					//actualEndCoords[i] = this._getNearestCoordToPoint(midCoord, crossPoints);
					actualEndCoords[i] = crossPoints[0];
					// set override
					this._nodeCoordOverrideMap.set(nodes[i], actualEndCoords[i]);
				}
			}
		}

		var AS = Kekule.Glyph.ArrowSide;

		var drawnElems = [];
		var boundInfos = [];
		var arrowElems = [];

		var adjustC1, adjustC2;

		var coordDelta  = CU.substract(actualEndCoords[1], actualEndCoords[0]);
		var w = coordDelta.x;
		var h = coordDelta.y;
		var l = CU.getDistance(actualEndCoords[0], actualEndCoords[1]);
		var angleSin = h / l;
		var angleCos = w / l;

		var distance = l;
		var midNo = (lineCount - 1) / 2;

		var lineScreenGap = lineGap;
		var deltaScreenCoord = {'y': lineScreenGap * angleCos, 'x': -lineScreenGap * angleSin};
		// console.log('l', l, 'w', w, 'h', h, 'sin', angleSin, 'cos', angleCos, 'gap', lineScreenGap, 'delta', deltaScreenCoord);
		var totalDeltaScreenCoord = CU.multiply(deltaScreenCoord, (lineCount - 1) / 2);

		var initialOffsetCoord = CU.multiply(deltaScreenCoord, (lineCount - 1) / 2);
		var c1 = CU.substract(actualEndCoords[0], initialOffsetCoord);
		var c2 = CU.substract(actualEndCoords[1], initialOffsetCoord);

		for (var i = 0; i < lineCount; ++i)
		{
			adjustC1 = null;
			adjustC2 = null;
			if (i !== 0)
			{
				c1 = CU.add(c1, deltaScreenCoord);
				c2 = CU.add(c2, deltaScreenCoord);
			}
			// consider arrow, adjust ending coord
			if (startArrowParams || endArrowParams)
			{
				var offsetIndex = i - midNo;
				var currGap = lineScreenGap * Math.abs(offsetIndex);
				//var arrowAdjustCoord = CU.multiply(deltaScreenCoord, Math.abs(i - midNo));
				// start
				if (startArrowParams)
				{
					if (startArrowParams.drawOnCenter &&
							(!startArrowParams.arrowSide
							|| (startArrowParams.arrowSide === AS.SINGLE && offsetIndex < 0)
							|| (startArrowParams.arrowSide === AS.REVERSED && offsetIndex > 0)))
					{
						var adjustLength = (startArrowParams.arrowType === Kekule.Glyph.ArrowType.OPEN) ?
						startArrowParams.arrowLength * currGap / (startArrowParams.arrowWidth / 2) :
								startArrowParams.arrowLength;
						var adjustC1 = CU.add(c1, CU.multiply(coordDelta, adjustLength / distance));
						//var adjustC1 = CU.add(c1, arrowAdjustCoord);
					}
					if (startArrowParams.drawOnCenter && i === 0)
						Kekule.ArrayUtils.pushUnique(arrowElems, this.doDrawArrowShape(context, connector, actualEndCoords[1], actualEndCoords[0], startArrowParams, shapeDrawOptions, true));
					if (!startArrowParams.drawOnCenter &&
							((startArrowParams.arrowSide === AS.SINGLE && i === 0) ||
							(startArrowParams.arrowSide === AS.REVERSED && i === lineCount - 1)))
					{
						Kekule.ArrayUtils.pushUnique(arrowElems, this.doDrawArrowShape(context, connector, c2, c1, startArrowParams, shapeDrawOptions, true));
					}
				}
				if (endArrowParams)
				{
					if (endArrowParams.drawOnCenter &&
							(!endArrowParams.arrowSide
							|| (endArrowParams.arrowSide === AS.SINGLE && offsetIndex < 0)
							|| (endArrowParams.arrowSide === AS.REVERSED && offsetIndex > 0)))
					{
						var adjustLength = (endArrowParams.arrowType === Kekule.Glyph.ArrowType.OPEN) ?
						endArrowParams.arrowLength * currGap / (endArrowParams.arrowWidth / 2) :
								endArrowParams.arrowLength;
						var adjustC2 = CU.substract(c2, CU.multiply(coordDelta, adjustLength / distance));
						//var adjustC2 = CU.substract(c2, arrowAdjustCoord);
					}

					if (endArrowParams.drawOnCenter && i === 0)
						Kekule.ArrayUtils.pushUnique(arrowElems, this.doDrawArrowShape(context, connector, actualEndCoords[0], actualEndCoords[1], endArrowParams, shapeDrawOptions));

					if (!endArrowParams.drawOnCenter &&
							((endArrowParams.arrowSide === AS.SINGLE && i === 0) ||
							(endArrowParams.arrowSide === AS.REVERSED && i === lineCount - 1)))
					{
						Kekule.ArrayUtils.pushUnique(arrowElems, this.doDrawArrowShape(context, connector, c1, c2, endArrowParams, shapeDrawOptions));
					}
				}
			}

			var	lineResult = this.doDrawLineShape(context, connector,
					adjustC1 || c1, adjustC2 || c2, shapeDrawOptions, otherRenderOptions);

			drawnElems.push(lineResult.element);
			boundInfos.push(lineResult.boundInfo);
		}

		return {'drawnElems': drawnElems, 'boundInfos': boundInfos, 'arrowElems': arrowElems};
	},

	/** @private */
	_doDrawArcConnectorShape: function(context, ctab, connector, nodes, coord1, coord2, controllerCoord, lineCount, lineGap, startArrowParams, endArrowParams, offsetBounds, shapeDrawOptions, otherRenderOptions)
	{
		var drawnElems = [], boundInfos = [], arrowElems = [];
		var actualEndCoords = [coord1, coord2];

		/*
		// consider the offset bound
		// TODO: currently a very rough approach, only support rect bound (for drawing arc to atom label)
		var testVectors = [[coord1, controllerCoord], [controllerCoord, coord2]];
		for (var i = 0; i < 2; ++i)
		{
			var offsetBound = offsetBounds[i];
			if (offsetBound)
			{
				if (offsetBound.shapeType === Kekule.Render.BoundShapeType.RECT)
				{
					var crossPoints = Kekule.Render.MetaShapeUtils.getCrossPointsOfVectorToShapeEdges(testVectors[i], offsetBound, true);
					if (crossPoints && crossPoints.length === 1)  // we should draw arc to this point rather than the original end point
					{
						actualEndCoords[i] = crossPoints[0];  // should have only one cross point
						// set override
						this._nodeCoordOverrideMap.set(nodes[i], actualEndCoords[i]);
					}
				}
			}
		}
		*/

		// calculate out the arc center and radius, angles
		// algorithm from https://blog.csdn.net/kezunhai/article/details/39476691
		var midCoord1 = CU.divide(CU.add(controllerCoord, actualEndCoords[0]), 2);
		var midCoord2 = CU.divide(CU.add(actualEndCoords[1], controllerCoord), 2);
		var k1 = -(actualEndCoords[0].x - controllerCoord.x) / (actualEndCoords[0].y - controllerCoord.y);
		var k2 = -(actualEndCoords[1].x - controllerCoord.x) / (actualEndCoords[1].y - controllerCoord.y);
		var centerCoord = {
			'x': (midCoord2.y - midCoord1.y- k2* midCoord2.x + k1*midCoord1.x)/(k1 - k2),
			'y': midCoord1.y + k1*( midCoord2.y - midCoord1.y - k2*midCoord2.x + k2*midCoord1.x)/(k1-k2)
		};
		var radius = CU.getDistance(centerCoord, actualEndCoords[0]);
		var vector1 = CU.substract(actualEndCoords[0], centerCoord);
		var vector2 = CU.substract(actualEndCoords[1], centerCoord);
		var vectorController = CU.substract(controllerCoord, centerCoord);
		var startAngle = Kekule.GeometryUtils.standardizeAngle(Math.atan2(vector1.y, vector1.x));
		var endAngle = Kekule.GeometryUtils.standardizeAngle(Math.atan2(vector2.y, vector2.x));
		var controllerAngle = Kekule.GeometryUtils.standardizeAngle(Math.atan2(vectorController.y, vectorController.x));

		// consider the offset bound
		var overrideAngles = [];
		for (var i = 0; i < 2; ++i)
		{
			var offsetBound = offsetBounds[i];
			if (offsetBound)
			{
				//if (offsetBound.shapeType === Kekule.Render.BoundShapeType.RECT)
				{
					var crossAnglesAndCoords = this._getCrossCoordsAndAnglesOfArcToShapeEdges(centerCoord, radius, startAngle, endAngle, controllerAngle, offsetBound);
					if (crossAnglesAndCoords && crossAnglesAndCoords.length >= 1)  // we should draw arc to this angle rather than the original one
					{
						var actualCoord = crossAnglesAndCoords[0].coord;
						var actualAngle = crossAnglesAndCoords[0].angle;
						// set override
						overrideAngles[i] = actualAngle;
						actualEndCoords[i] = actualCoord;
						this._nodeCoordOverrideMap.set(nodes[i], actualCoord);
					}
				}
			}
		}

		if (overrideAngles[0])
			startAngle = overrideAngles[0];
		if (overrideAngles[1])
			endAngle = overrideAngles[1];

		var angleDelta0 = endAngle - startAngle;
		var angleDelta1 = controllerAngle - startAngle;
		var angleDelta2 = controllerAngle - endAngle;

		var controllerSign = Math.sign(angleDelta1) * Math.sign(angleDelta2);
		var arcSign = Math.sign(angleDelta0);

		var anticlockwise = (controllerSign * arcSign) > 0;

		// get arrow directions
		var startArrowRefVector, endArrowRefVector;
		var arrowRefLength = radius + lineGap * lineCount;  // a sufficient length
		var refAngleDelta = 10 / radius;  // a moderate angle, large radius, smaller ref angle
		if (startArrowParams)
		{
			var refAngle = startAngle - (anticlockwise? refAngleDelta: -refAngleDelta);
			startArrowRefVector = {'x': Math.cos(refAngle), 'y': Math.sin(refAngle)};
		}
		if (endArrowParams)
		{
			var refAngle = endAngle + (anticlockwise? refAngleDelta: -refAngleDelta);
			endArrowRefVector = {'x': Math.cos(refAngle), 'y': Math.sin(refAngle)};
			//var refCoordDelta = {'x': radius * Math.cos(refAngle), 'y': radius * Math.sin(refAngle)};
			//endArrowRefCoord = CU.add(centerCoord, refCoordDelta);
		}

		var midNo = (lineCount - 1) / 2;
		var initialRadius = radius - lineGap * midNo;

		// draw arc
		for (var i = 0; i < lineCount; ++i)
		{
			var r = initialRadius + i * lineGap;  // radius of current child arc

			if (startArrowParams || endArrowParams && lineCount <= 1)  // TODO: now arrow can only be drawn with one child arc
			{
				if (startArrowParams)
				{
					//if (startArrowParams.drawOnCenter && i === 0)
					if (i === 0)
					{
						var arrowRefCoord = CU.add(centerCoord, CU.multiply(startArrowRefVector, r));
						Kekule.ArrayUtils.pushUnique(arrowElems, this.doDrawArrowShape(context, connector, arrowRefCoord, actualEndCoords[0], endArrowParams, shapeDrawOptions, true));
					}
				}
				if (endArrowParams)
				{
					//if (endArrowParams.drawOnCenter && i === 0)
					if (i === 0)
					{
						var arrowRefCoord = CU.add(centerCoord, CU.multiply(endArrowRefVector, r));
						Kekule.ArrayUtils.pushUnique(arrowElems, this.doDrawArrowShape(context, connector, arrowRefCoord, actualEndCoords[1], endArrowParams, shapeDrawOptions, true));
					}
				}
			}

			var pathResult = this.doDrawArcShape(context, centerCoord, r, startAngle, endAngle, anticlockwise, shapeDrawOptions);

			if (pathResult.element)
				drawnElems.push(pathResult.element);
			if (pathResult.boundInfo)
				boundInfos.push(pathResult.boundInfo);
		}

		var result = {'drawnElems': drawnElems, 'boundInfos': boundInfos, 'arrowElems': arrowElems};
		return result;
	},

	/** @private */
	_getCrossCoordsAndAnglesOfArcToShapeEdges: function(arcCenter, arcRadius, arcStartAngle, arcEndAngle, arcControllerAngle, shapeInfo)
	{
		var edgeElements = Kekule.Render.MetaShapeUtils.getEdgeBasicElements(shapeInfo);
		var edgeVectors = edgeElements.vectors;
		var candidates = [];
		for (var i = 0, l = edgeVectors.length; i < l; ++i)
		{
			var edge = edgeVectors[i];
			var crossPoints = Kekule.GeometryUtils.getCrossPointsOfVectorToCircle(edge, arcCenter, arcRadius, 1e-4);  // TODO: currently threshold fixed, a rather large value for screen coord sys
			if (crossPoints && crossPoints.length)
			{
				candidates = candidates.concat(crossPoints);
			}
		}
		var edgeCircles = edgeElements.circles;
		for (var i = 0, l = edgeCircles.length; i < l; ++i)
		{
			var edge = edgeCircles[i];
			var crossPoints = Kekule.GeometryUtils.getCrossPointsOfCircles(edge.center, edge.radius, arcCenter, arcRadius, 1e-4);  // TODO: currently threshold fixed, a rather large value for screen coord sys
			if (crossPoints && crossPoints.length)
			{
				candidates = candidates.concat(crossPoints);
			}
		}
		//console.log(edgeElements, candidates);

		var result = [];
		var sign = Math.sign((arcControllerAngle - arcStartAngle) * (arcControllerAngle - arcEndAngle));
		for (var i = 0, l = candidates.length; i < l; ++i)
		{
			var delta = CU.substract(candidates[i], arcCenter);
			var angle = Kekule.GeometryUtils.standardizeAngle(Math.atan2(delta.y, delta.x));
			if (Math.sign((angle - arcStartAngle) * (angle - arcEndAngle)) === sign)
				result.push({'angle': angle, 'coord': candidates[i]});
		}
		return result;
	},

	/** @private */
	_getNearestCoordToPoint: function(pointCoord, coords)
	{
		var result = null;
		var minDistance = null;
		for (var i = 0, l = coords.length; i < l; ++i)
		{
			var distance = CU.getDistance(coords[i], pointCoord);
			if (!result || distance < minDistance)
			{
				result = coords[i];
				minDistance = distance;
			}
		}
		return result;
	},

	/** @private */
	_transformArrowLength: function(context, arrowLength, arrowWidth)
	{
		var coord = {'x': arrowLength || 0, 'y': arrowWidth || 0};
		var transformed = Kekule.CoordUtils.substract(
			this.transformCoordToContext(context, this.getChemObj(), coord),
			this.transformCoordToContext(context, this.getChemObj(), {'x': 0, 'y': 0})
		);
		return {
			'arrowLength': Math.abs(transformed.x),
			'arrowWidth': Math.abs(transformed.y)
		};
	},
	/** @private */
	doDrawArrowShape: function(context, connector, coord1, coord2, arrowParams, drawOptions, reversed)
	{
		// draw an arrow at end of line (coord2)
		var AS = Kekule.Glyph.ArrowSide;
		var AT = Kekule.Glyph.ArrowType;

		var coordDelta = CU.substract(coord2, coord1);
		var distance = CU.getDistance(coord2, coord1);
		var sinAngle = coordDelta.y / distance;
		var cosAngle = coordDelta.x / distance;

		var arrowLength = arrowParams.arrowLength; // || 3;
		var arrowWidth = arrowParams.arrowWidth;  // || 6;
		var halfArrowWidth = arrowWidth / 2;

		var basePointCoord = CU.substract(coord2, CU.multiply(coordDelta, arrowLength / distance));
		var offsetCoord = {
			'x': halfArrowWidth * sinAngle,
			'y': -halfArrowWidth * cosAngle
		};
		var arrowWingEnd1;
		var arrowWingEnd2;

		var PU = Kekule.Render.DrawPathUtils;
		var pathArray = [];
		//var elems = [];
		// wingEnd1
		if (!arrowParams.arrowSide
			|| (!reversed && arrowParams.arrowSide === AS.SINGLE)
			|| (reversed && arrowParams.arrowSide === AS.REVERSED))
		{
			arrowWingEnd1 = CU.add(basePointCoord, offsetCoord);
			/*
			var elem = this.drawLine(context, coord2, arrowWingEnd1, drawOptions);
			if (elem)
				elems.push(elem);
			*/
			pathArray.push('M');
			pathArray.push([arrowWingEnd1.x, arrowWingEnd1.y]);
			pathArray.push('L');
			pathArray.push([coord2.x, coord2.y]);
		}
		else
		{
			pathArray.push('M');
			pathArray.push([coord2.x, coord2.y]);
		}
		// wingEnd2
		if (!arrowParams.arrowSide
			|| (!reversed && arrowParams.arrowSide === AS.REVERSED)
			|| (reversed && arrowParams.arrowSide === AS.SINGLE))
		{
			arrowWingEnd2 = CU.substract(basePointCoord, offsetCoord);
			/*
			elem = this.drawLine(context, coord2, arrowWingEnd2, drawOptions);
			if (elem)
				elems.push(elem);
			*/
			pathArray.push('L');
			pathArray.push([arrowWingEnd2.x, arrowWingEnd2.y]);
		}

		var doFill = false;
		// close line
		if (arrowParams.arrowType === AT.TRIANGLE)
		{
			/*
			var elem = this.drawLine(context, arrowWingEnd1 || basePointCoord, arrowWingEnd2 || basePointCoord, drawOptions);
			if (elem)
				elems.push(elem);
			*/
			var endCoord = (arrowWingEnd1 && arrowWingEnd2)? null: basePointCoord;
			if (endCoord)
			{
				pathArray.push('L');
				pathArray.push([endCoord.x, endCoord.y]);
			}
			pathArray.push('Z');
			doFill = true;
		}
		//return elems;
		var path = PU.makePath.apply(this, pathArray);
		var drawOps = Object.create(drawOptions);
		if (!doFill)
		{
			drawOps.fillColor = 'transparent';
		}
		return this.drawPath(context, path, drawOps);
	},
	/** @private */
	doDrawLineShape: function(context, connector, coord1, coord2, drawOptions, renderOptions)
	{
		var elem = this.drawLine(context, coord1, coord2, drawOptions);
		var boundInfo = this.createLineBoundInfo(coord1, coord2, drawOptions.strokeWidth);
		return {'element': elem, 'boundInfo': boundInfo};
	},
	/** @private */
	doDrawArcShape: function(context, centerCoord, radius, startAngle, endAngle, anticlockwise, drawOptions)
	{
		var overrideDrawOps = Object.create(drawOptions);
		overrideDrawOps.fillColor = null;  // do not fill, only stroke

		var elem = this.drawArc(context, centerCoord, radius, startAngle, endAngle, anticlockwise, overrideDrawOps);
		var boundInfo = this.createArcBoundInfo(centerCoord, radius, startAngle, endAngle, anticlockwise, overrideDrawOps.strokeWidth);
		return {'element': elem, 'boundInfo': boundInfo};
	}
});

/**
 * Class to render a path glyph object.
 * @class
 * @augments Kekule.Render.BaseGlyph2DRenderer
 */
Kekule.Render.PathGlyph2DRenderer = Class.create(Kekule.Render.BaseGlyph2DRenderer,
/** @lends Kekule.Render.PathGlyph2DRenderer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.PathGlyph2DRenderer',
	/** @constructs */
	initialize: function($super, chemObj, drawBridge, parent)
	{
		$super(chemObj, drawBridge, parent);
		this._concreteChemObj = chemObj.getCtab();
		this._concreteRenderer = new Kekule.Render.PathGlyphCtab2DRenderer(chemObj.getCtab(), drawBridge, this);
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
	/** ignore */
	_getRenderSortIndex: function($super)
	{
		if (this._concreteRenderer)
			return this._concreteRenderer._getRenderSortIndex();
		else
			return $super();
	},
	/** @ignore */
	getRenderCache: function(context)
	{
		return this._concreteRenderer.getRenderCache(context);
	},
	/** @private */
	_getConcreteRendererDrawOptions: function(options)
	{
		return options;
	},
	/** @ignore */
	isChemObjRenderedBySelf: function($super, context, obj)
	{
		var result = $super(context, obj) || (obj === this.getChemObj()) || this._concreteRenderer.isChemObjRenderedBySelf(context, obj);
		return result;
	},
	/** @ignore */
	isChemObjRenderedDirectlyBySelf: function($super, context, obj)
	{
		return $super(context, obj) || (obj === this.getChemObj());
	},
	/** @private */
	doSetRedirectContext: function($super, value)
	{
		$super(value);
		this._concreteRenderer.setRedirectContext(value);
	},
	/** @ignore */
	doDraw: function($super, context, baseCoord, options)
	{
		//console.log('dodraw path', this._concreteRenderer.getClassName());
		$super(context, baseCoord, options);

		var chemObj = this.getChemObj();
		var op = Object.create(options);
		if (op.partialDrawObjs)  // path glyph is a whole and can not be partial drawn
			op.partialDrawObjs = null;
		return this._concreteRenderer.draw(context, baseCoord, this._getConcreteRendererDrawOptions(op));
	},
	/** @ignore */
	doRedraw: function(context)
	{
		return this._concreteRenderer.redraw(context);
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

		return this._concreteRenderer.doUpdate(context, updatedObjDetails, updateType);
	},
	/** @ignore */
	doClear: function(context)
	{
		return this._concreteRenderer.clear(context);
	},
	/** @ignore */
	estimateRenderBox: function(context, options, allowCoordBorrow)
	{
		return this._concreteRenderer.estimateRenderBox(context, this._getConcreteRendererDrawOptions(options), allowCoordBorrow);
	},
	/** @ignore */
	transformCoordToObj: function(context, chemObj, coord)
	{
		//console.log(chemObj, this.getChemObj(), chemObj === this.getChemObj());
		var obj = (this.getChemObj() === chemObj)? this._concreteChemObj: chemObj;
		return this._concreteRenderer.transformCoordToObj(context, obj, coord);
	},
	/** @ignore */
	transformCoordToContext: function(context, chemObj, coord)
	{
		//console.log(chemObj, this.getChemObj(), chemObj === this.getChemObj());
		var obj = (this.getChemObj() === chemObj)? this._concreteChemObj: chemObj;
		return this._concreteRenderer.transformCoordToContext(context, obj, coord);
	}
});
Kekule.Render.Renderer2DFactory.register(Kekule.Glyph.PathGlyph, Kekule.Render.PathGlyph2DRenderer);

})();
