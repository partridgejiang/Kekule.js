/**
 * @fileoverview
 * Implementation of line based glyphs defined by a series of nodes and paths.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /core/kekule.structures.js
 * requires /chemdoc/kekule.glyph.base.js
 * requires /chemdoc/kekule.glyph.pathGlyphs.js
 * requires /chemdoc/kekule.glyph.utils.js
 */

(function(){
"use strict";

var OU = Kekule.ObjUtils;
var NT = Kekule.Glyph.NodeType;
var PT = Kekule.Glyph.PathType;
var CU = Kekule.CoordUtils;
var CM = Kekule.CoordMode;

/**
 * A glyph of straight line.
 * @class
 * @augments Kekule.Glyph.PathGlyph
 */
Kekule.Glyph.StraightLine = Class.create(Kekule.Glyph.PathGlyph,
/** @lends Kekule.Glyph.StraightLine# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Glyph.StraightLine',
	/** @constructs */
	initialize: function(/*$super, */id, refLength, initialParams, coord2D, coord3D)
	{
		this.tryApplySuper('initialize', [id, refLength, initialParams, coord2D, coord3D])  /* $super(id, refLength, initialParams, coord2D, coord3D) */;
	},
	/** @private */
	doCreateDefaultStructure: function(refLength, initialParams)
	{
		// initialParams can include additional field: lineLength
		var C = Kekule.CoordUtils;

		var coord2D = {'x': 0, 'y': 0};
		var coord3D = {'x': 0, 'y': 0, 'z': 0};
		var delta = {'x': refLength * (initialParams.lineLength || 1)};
		var node1 = new Kekule.Glyph.PathGlyphNode(null, null, coord2D, coord3D);
		var node2 = new Kekule.Glyph.PathGlyphNode(null, null, C.add(coord2D, delta), C.add(coord3D, delta));
		var connector = new Kekule.Glyph.PathGlyphConnector(null, PT.LINE, [node1, node2]);
		this._applyParamsToConnector(connector, initialParams);
		this.appendNode(node1);
		this.appendNode(node2);
		this.appendConnector(connector);
	},
	/** @private */
	_applyParamsToConnector: function(connector, initialParams)
	{
		//connector.setPathParams(initialParams);

		var p = Object.create(initialParams);
		if (Kekule.ObjUtils.isUnset(initialParams.autoOffset))
			p.autoOffset = false;
		connector.setPathParams(p);
	},

	/** @ignore */
	getDirectManipulationTarget: function()
	{
		return this.getNodeAt(this.getNodeCount() - 1);
	}
	/* @ignore */
	/*
	getAllowChildCoordStickTo: function(child, dest)
	{
		return true;
	},
	*/
	/* @ignore */
	/*
	getChildAcceptCoordStickFrom: function(child, fromObj)
	{
		return true;
	}
	*/
});

/**
 * A glyph of polygon formed by straight lines.
 * @class
 * @augments Kekule.Glyph.PathGlyph
 */
Kekule.Glyph.Polygon = Class.create(Kekule.Glyph.PathGlyph,
/** @lends Kekule.Glyph.Polygon# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Glyph.Polygon',
	/** @constructs */
	initialize: function(/*$super, */id, refLength, initialParams, coord2D, coord3D)
	{
		this.tryApplySuper('initialize', [id, refLength, initialParams, coord2D, coord3D])  /* $super(id, refLength, initialParams, coord2D, coord3D) */;
	},
	/** @private */
	getRefLengthRatio: function()
	{
		return 1;
	},
	/** @private */
	doCreateDefaultStructure: function(refLength, initialParams)
	{
		// initialParams can include additional field: lineLength, edgeCount
		//   node props, connector props
		var C = Kekule.CoordUtils;
		var coord2D = {'x': 0, 'y': 0};
		var coord3D = {'x': 0, 'y': 0, 'z': 0};
		var nodeProps = initialParams.nodeProps;
		var connectorProps = initialParams.connectorProps;
		var r = refLength * (initialParams.lineLength || 1) * this.getRefLengthRatio();
		var edgeCount = initialParams.edgeCount || 3;
		var angleDelta = Math.PI * 2 / edgeCount;
		var startingAngle = (edgeCount % 2)?0: -angleDelta / 2;
		var currAngle = startingAngle;
		var firstNode, lastNode;
		for (var i = 0; i < edgeCount; ++i)
		{
			var c = {'x': r * Math.sin(currAngle), 'y': r * Math.cos(currAngle)};
			var node = new Kekule.Glyph.PathGlyphNode(null, null, C.add(coord2D, c), C.add(coord3D, c));
			if (nodeProps)
				node.setPropValues(nodeProps);
			this.appendNode(node);
			if (i === 0)
				firstNode = node;
			if (lastNode)
			{
				var connector = new Kekule.Glyph.PathGlyphConnector(null, PT.LINE, [lastNode, node]);
				if (connectorProps)
					connector.setPropValues(connectorProps);
				this._applyParamsToConnector(connector, initialParams);
				this.appendConnector(connector);
			}
			lastNode = node;
			currAngle += angleDelta;
		}
		var connector = new Kekule.Glyph.PathGlyphConnector(null, PT.LINE, [node, firstNode]);
		if (connectorProps)
			connector.setPropValues(connectorProps);
		this._applyParamsToConnector(connector, initialParams);
		this.appendConnector(connector);
	},
	/** @private */
	_applyParamsToConnector: function(connector, initialParams)
	{
		connector.setPathParams(initialParams);
	}
});

/**
 * A base glyph of arc segment.
 * @class
 * @augments Kekule.Glyph.PathGlyph
 */
Kekule.Glyph.BaseArc = Class.create(Kekule.Glyph.PathGlyph,
/** @lends Kekule.Glyph.BaseArc# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Glyph.BaseArc',
	/** @constructs */
	initialize: function(/*$super, */id, refLength, initialParams, coord2D, coord3D)
	{
		this.tryApplySuper('initialize', [id, refLength, initialParams, coord2D, coord3D])  /* $super(id, refLength, initialParams, coord2D, coord3D) */;
	},
	/** @ignore */
	doCreateDefaultStructure: function(refLength, initialParams)
	{
		// initialParams can include additional field: lineLength
		var C = Kekule.CoordUtils;

		var coord2D = {'x': 0, 'y': 0};
		var coord3D = {'x': 0, 'y': 0, 'z': 0};
		var delta = {'x': refLength * (initialParams.lineLength || 1)};
		//var controllerDelta = {'x': 0, 'y': delta.x / 2};

		var node1 = new Kekule.Glyph.PathGlyphNode(null, null, coord2D, coord3D);  // starting node
		var node2 = new Kekule.Glyph.PathGlyphNode(null, null, C.add(coord2D, delta), C.add(coord3D, delta));  // ending node
		this.appendNode(node1);
		this.appendNode(node2);

		//var node3 = new Kekule.Glyph.PathGlyphNode(null, Kekule.Glyph.NodeType.CONTROLLER, C.add(coord2D, controllerDelta), C.add(coord3D, controllerDelta));  // control node
		var connector = new Kekule.Glyph.PathGlyphArcConnector(null, [node1, node2]);
		this._applyParamsToConnector(connector, initialParams);

		/*
		var controlPoint = connector.getControlPoint();
		//controlPoint.setDistanceToChord(delta.x)
		controlPoint.setCoord2D(controllerDelta)
				.setCoord3D(controllerDelta);
		*/

		this.appendConnector(connector);

		connector.setInteractMode(Kekule.ChemObjInteractMode.HIDDEN);
		//node1.setInteractMode(Kekule.ChemObjInteractMode.HIDDEN);
		//node2.setInteractMode(Kekule.ChemObjInteractMode.HIDDEN);
	},

	/** @ignore */
	getDirectManipulationTarget: function()
	{
		return this.getNodeAt(this.getNodeCount() - 1);
	},

	/** @private */
	_isValidChemNodeOrConnectorStickTarget: function(targetObj)
	{
		/*
		var result = (targetObj instanceof Kekule.ChemStructureNode) || (targetObj instanceof Kekule.ChemStructureConnector);
		if (!result && (targetObj instanceof Kekule.ChemMarker.BaseMarker))
		{
			var parent = targetObj.getParent && targetObj.getParent();
			if (parent)  // the marker of node/connector (e.g., electron pair) can also be a valid target
				result = (parent instanceof Kekule.ChemStructureNode) || (parent instanceof Kekule.ChemStructureConnector);
		}
		return result;
		*/
		return Kekule.Glyph.ElectronArrowGlyphUtils.isValidChemNodeOrConnectorStickTarget(targetObj);
	},
	/** @private */
	_applyParamsToConnector: function(connector, initialParams)
	{
		connector.setPathParams(initialParams);
	},
	/** @ignore */
	getAllowChildCoordStickTo: function(child, dest)
	{
		var result = !dest  // dest not set, a general test, just returns true
			|| (this._isValidChemNodeOrConnectorStickTarget(dest, child) && !this._isChildrenStickingTo(dest, [child]));
			/*
			|| ((dest instanceof Kekule.ChemStructureNode) || (dest instanceof Kekule.ChemStructureConnector)) && (!this._isChildrenStickingTo(dest, [child]))
			|| (dest instanceof Kekule.ChemMarker.BaseMarker);
			*/
		//console.log('allow stick to', dest && dest.getClassName(), result);
		return result;
	},
	/** @ignore */
	getChildUseCoordStickOffset: function(/*$super, */child, stickDest)
	{
		if (stickDest instanceof Kekule.ChemStructureNode || stickDest instanceof Kekule.ChemStructureConnector)
		{
			return true;
		}
		else
		{
			return false;
			//return $super(child, stickDest);
		}
	},
	/** @private */
	_isChildrenStickingTo: function(dest, excludeChildren)
	{
		var nodes = this.getNodes();
		nodes = Kekule.ArrayUtils.exclude(nodes, excludeChildren || []);
		for (var i = 0, l = nodes.length; i < l; ++i)
		{
			var n = nodes[i];
			if (n.getCoordStickTarget() === dest)
				return true;
		}
		return false;
	}
});

/**
 * A base glyph of double arc glyph (for bond forming electron pushing arrow).
 * @class
 * @augments Kekule.Glyph.PathGlyph
 */
Kekule.Glyph.BaseTwinArc = Class.create(Kekule.Glyph.PathGlyph,
/** @lends Kekule.Glyph.BaseTwinArc# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Glyph.BaseTwinArc',
	/** @private */
	DEF_MIN_PATH_END_DISTANCE_RATIO: 0.05,
	/** @private */
	DEF_INIT_PATH_END_GAP_RATIO: 0.2,
	/** @private */
	FIELD_ARC_END_NODE_FLAG: '__$arcEndNode$__',
	/**
	 * @constructs
	 */
	initialize: function(/*$super, */id, refLength, initialParams, coord2D, coord3D)
	{
		/*
		this._insideNodeGetIndirectCoordRefLengthsBind = this._insideNodeGetIndirectCoordRefLengths.bind(this);
		this._insideNodeGetIndirectCoordRefCoordsBind = this._insideNodeGetIndirectCoordRefCoords.bind(this);
		this._insideNodeCalcIndirectCoordStorageBind = this._insideNodeCalcIndirectCoordStorage.bind(this);
		this._insideNodeCalcIndirectCoordValueBind = this._insideNodeCalcIndirectCoordValue.bind(this);
		*/
		this.setPropStoreFieldValue('minPathEndDistanceRatio', this.DEF_MIN_PATH_END_DISTANCE_RATIO);
		this.tryApplySuper('initialize', [id, refLength, initialParams, coord2D, coord3D])  /* $super(id, refLength, initialParams, coord2D, coord3D) */;
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('minPathEndDistanceRatio', {'dataType': DataType.FLOAT});
		this.defineProp('oppositePathEndArrowSides', {
			'dataType': DataType.BOOL, 'serializable': false,
			'getter': function()
			{
				return this._isPathArrowSideOpposite('end');
			},
			'setter': function(value)
			{
				this._setPathArrowSideOpposite('end', !!value);
			}
		});
		this.defineProp('oppositePathStartArrowSides', {
			'dataType': DataType.BOOL, 'serializable': false,
			'getter': function()
			{
				return this._isPathArrowSideOpposite('start');
			},
			'setter': function(value)
			{
				this._setPathArrowSideOpposite('start', !!value);
			}
		});
	},

	/** @ignore */
	loaded: function(/*$super*/)
	{
		var result = this.tryApplySuper('loaded')  /* $super() */;
		// when add new child object, and the two arcs are ready, handle the arc end nodes
		if (this._isTwinArcSetup())
		{
			this._setupArcEndNode(this.getNodeAt(1));
			this._setupArcEndNode(this.getNodeAt(2));
		}
		return result;
	},

	/** @private */
	_isPathArrowSideOpposite: function(arrowPos)
	{
		// arrowPos is a string, either of 'start' or 'end'
		var connCount = this.getConnectorCount();
		if (connCount < 2)
			return null;  // undeterminated
		else
		{
			var lastSide;
			var result = null;
			for (var i = 0; i < connCount; ++i)
			{
				var conn = this.getConnectorAt(i);
				var pathParam = conn.getPathParams();
				var arrowType = pathParam[arrowPos + 'ArrowType'];
				if (arrowType === Kekule.Glyph.ArrowType.NONE)  // no side
					return null;
				var arrowSide = pathParam[arrowPos + 'ArrowSide'];
				if (arrowSide === Kekule.Glyph.ArrowSide.BOTH)
					return null;
				if (i === 0)
					lastSide = arrowSide;
				else
				{
					var currResult = (lastSide === arrowSide)? false: true;
					if (OU.isUnset(result))
						result = currResult;
					else if (result !== currResult)
						return null;
					lastSide = arrowSide;
				}
			}
			return result;
		}
	},
	/** @private */
	_setPathArrowSideOpposite: function(arrowPos, reversed)
	{
		// arrowPos is a string, either of 'start' or 'end'
		var connCount = this.getConnectorCount();
		if (connCount < 2)
			return null;  // undeterminated
		else
		{
			var ASide = Kekule.Glyph.ArrowSide;
			var lastSide;
			var applicable = true;
			for (var i = 0; i < connCount; ++i)
			{
				var conn = this.getConnectorAt(i);
				var pathParam = conn.getPathParams();
				var arrowType = pathParam[arrowPos + 'ArrowType'];
				if (arrowType === Kekule.Glyph.ArrowType.NONE)  // no side
					applicable = false;
				var arrowSide = pathParam[arrowPos + 'ArrowSide'];
				if (arrowSide === Kekule.Glyph.ArrowSide.BOTH)
					applicable = false;
				if (!applicable)
				{
					lastSide = null;
				}
				else
				{
					if (OU.isUnset(lastSide))
						lastSide = arrowSide;
					else
					{
						var currSide;
						if (reversed)
							currSide = (lastSide === ASide.SINGLE)?	ASide.REVERSED: ASide.SINGLE;
						else
							currSide = lastSide;
						pathParam[arrowPos + 'ArrowSide'] = currSide;
						lastSide = currSide;
					}
				}
			}
			return null;
		}
	},

	/** @private */
	_isTwinArcSetup: function()
	{
		return (this.getConnectorCount() === 2) && (this.getNodeCount() === 4);
	},

	/** @ignore */
	getDirectManipulationTarget: function()
	{
		return this.getNodeAt(this.getNodeCount() - 1);
	},

	/** @ignore */
	doCreateDefaultStructure: function(refLength, initialParams)
	{
		// initialParams can include additional field: lineLength
		var C = Kekule.CoordUtils;

		var coord2D = {'x': 0, 'y': 0};
		var coord3D = {'x': 0, 'y': 0, 'z': 0};
		var lineLength = initialParams.lineLength || 1;
		var minPathEndDistanceRatio = (initialParams.minPathEndDistanceRatio || this.getMinPathEndDistanceRatio() || this.DEF_MIN_PATH_END_DISTANCE_RATIO);  // min distance bewteen arc ends
		var minPathEndDistance = lineLength * minPathEndDistanceRatio;
		this.setMinPathEndDistanceRatio(minPathEndDistanceRatio);

		var pathEndGap = (initialParams.pathEndGap || lineLength * this.DEF_INIT_PATH_END_GAP_RATIO);
		pathEndGap = Math.max(pathEndGap, minPathEndDistance);


		var deltaLine = {'x': refLength * ((lineLength - pathEndGap) / 2)};
		var deltaGap = {'x': refLength * pathEndGap};
		var deltaTotal = {'x': refLength * lineLength};

		var node1 = new Kekule.Glyph.PathGlyphNode(null, null, coord2D, coord3D);  // starting node of first arc
		var node2 = new Kekule.Glyph.PathGlyphNode(null, null);  // ending node of first arc
		this._setupArcEndNode(node2);

		var node3 = new Kekule.Glyph.PathGlyphNode(null, null);  // ending node of second arc
		var node4 = new Kekule.Glyph.PathGlyphNode(null, null, C.add(coord2D, deltaTotal), C.add(coord3D, deltaTotal));  // starting node of second arc
		this._setupArcEndNode(node3);

		this.appendNode(node1);
		this.appendNode(node2);
		this.appendNode(node3);
		this.appendNode(node4);

		node2.setCoord2D(C.add(coord2D, deltaLine)).setCoord3D(C.add(coord3D, deltaLine));
		node3.setCoord2D(C.add(coord2D, CU.add(deltaLine, deltaGap))).setCoord3D(C.add(coord3D, CU.add(deltaLine, deltaGap)));

		var connector1 = new Kekule.Glyph.PathGlyphArcConnector(null, [node1, node2]);
		var connector2 = new Kekule.Glyph.PathGlyphArcConnector(null, [node4, node3]);
		this._applyParamsToConnector(connector1, initialParams);
		this._applyParamsToConnector(connector2, initialParams);
		connector2.getControlPointAt(0).setDistanceToChord(-connector2.getControlPointAt(0).getDistanceToChord());  // ensure the two arc arrow at same side

		this.appendConnector(connector1);
		this.appendConnector(connector2);

		connector1.setInteractMode(Kekule.ChemObjInteractMode.HIDDEN);
		connector2.setInteractMode(Kekule.ChemObjInteractMode.HIDDEN);
	},
	/** @private */
	_applyParamsToConnector: function(connector, initialParams)
	{
		connector.setPathParams(initialParams);
	},
	/** @private */
	_setupArcEndNode: function(node)
	{
		if (!node[this.FIELD_ARC_END_NODE_FLAG])
		{
			this._overwriteChildPathNodeMethods(node);
			node.setEnableIndirectCoord(true);
			node[this.FIELD_ARC_END_NODE_FLAG] = true;
		}
	},
	/** @private */
	_overwriteChildPathNodeMethods: function(node)
	{
		node.overwriteMethod('getIndirectCoordRefLengths', this._insideNodeGetIndirectCoordRefLengths)
			.overwriteMethod('getIndirectCoordRefCoords', this._insideNodeGetIndirectCoordRefCoords)
			.overwriteMethod('calcIndirectCoordStorage', this._insideNodeCalcIndirectCoordStorage)
			.overwriteMethod('calcIndirectCoordValue', this._insideNodeCalcIndirectCoordValue)
			.overwriteMethod('_childPathNodeGetParentGlyph', this._childPathNodeGetParentGlyph)
			.overwriteMethod('_childPathNodeGetGlyphMinPathEndDistanceRatio', this._childPathNodeGetGlyphMinPathEndDistanceRatio);
	},

	/** @private */
	_getArrowStartingNodes: function()
	{
		var result = [];
		if (this._isTwinArcSetup())
		{
			for (var i = 0, l = this.getConnectorCount(); i < l; ++i)
			{
				var connector = this.getConnectorAt(i);
				var node = connector.getConnectedObjAt(0);
				if (node)
					result.push(node);
			}
		}
		return result;
	},

	// overwrite methods of two inside nodes of arcs, so this these methods, this var refers to the node but not the glyph
	/** @private */
	_childPathNodeGetParentGlyph: function($old)  // return this parent glyph of path node
	{
		var p = this.getParent();
		if (p instanceof Kekule.Glyph.BaseTwinArc)
			return p;
		else
			return null;
	},
	/** @private */
	_childPathNodeGetGlyphMinPathEndDistanceRatio: function($old)
	{
		var p = this._childPathNodeGetParentGlyph();
		return p && p.getMinPathEndDistanceRatio();
	},
	/** @private */
	_insideNodeGetIndirectCoordRefLengths: function($old, coordMode, allowCoordBorrow)
	{
		var glyph = this.getParent();
		if (glyph && coordMode === Kekule.CoordMode.COORD2D)
		{
			var nodeStart = glyph.getNodeAt(0);
			var nodeEnd = glyph.getNodeAt(glyph.getNodeCount() - 1);
			if (nodeStart && nodeEnd)
			{
				var coord1 = nodeStart.getAbsCoordOfMode(coordMode);
				var coord2 = nodeEnd.getAbsCoordOfMode(coordMode);
				var d = Kekule.CoordUtils.getDistance(coord2, coord1);
				var result = {'x': d, 'y': d, 'length': d};
				//console.log('_insideNodeGetIndirectCoordRefLengths', result);
				return result;
			}
		}
		else
			return $old(coordMode, allowCoordBorrow);
	},
	/** @private */
	_insideNodeGetIndirectCoordRefCoords: function($old, coordMode, allowCoordBorrow)
	{
		var glyph = this.getParent();
		if (glyph && coordMode === CM.COORD2D)
		{
			var nodeStart = glyph.getNodeAt(0);
			var nodeEnd = glyph.getNodeAt(glyph.getNodeCount() - 1);
			if (nodeStart && nodeEnd)
			{
				/*
				var coord1 = nodeStart.getAbsCoordOfMode(coordMode);
				var coord2 = nodeEnd.getAbsCoordOfMode(coordMode);
				*/
				var coord1 = nodeStart.getCoordOfMode(coordMode);
				var coord2 = nodeEnd.getCoordOfMode(coordMode);
				//console.log('_insideNodeGetIndirectCoordRefCoords', coord);
				return [coord1, coord2];
			}
		}
		else
			return $old(coordMode, allowCoordBorrow);
	},
	/** @private */
	_insideNodeCalcIndirectCoordStorage: function($old, coordMode, coordValue, oldCoordValue, allowCoordBorrow)
	{
		var glyph = this.getParent();
		if (glyph && coordMode === CM.COORD2D)
		{
			//var refLength = this._insideNodeGetIndirectCoordRefLengths(null, coordMode, allowCoordBorrow).length;
			var refCoords = this.getIndirectCoordRefCoords(coordMode, allowCoordBorrow);
			//var refLength = CU.getDistance(refCoords[1], refCoords[0]);
			if (refCoords)
			{
				var nodeStart = glyph.getNodeAt(0);
				var baseCoord = nodeStart.getCoordOfMode(coordMode);

				var crossPoint = Kekule.GeometryUtils.getPerpendicularCrossPointFromCoordToLine(coordValue, refCoords[0], refCoords[1], false);
				if (!crossPoint)  // outside ref line
				{
					var d0 =CU.getDistance(coordValue, refCoords[0]);
					var d1 =CU.getDistance(coordValue, refCoords[1]);
					if (d0 < d1)
						crossPoint = refCoords[0];
					else
						crossPoint = refCoords[1];
				}
				var crossPointDistance = CU.getDistance(baseCoord, crossPoint);
				var refDistance = CU.getDistance(refCoords[1], refCoords[0]);

				var ratio = refDistance? crossPointDistance / refDistance: 0;
				var minDistanceRatio = this._childPathNodeGetGlyphMinPathEndDistanceRatio() || 0;

				if (ratio < minDistanceRatio)
				{
					ratio = minDistanceRatio;
				}
				else if (ratio > 1 - minDistanceRatio)
				{
					ratio = 1 - minDistanceRatio;
				}

				return {'x': ratio, 'y': ratio, 'ratio': ratio};
			}
		}

		return $old(coordMode, coordValue, oldCoordValue, allowCoordBorrow);
	},
	/** @private */
	_insideNodeCalcIndirectCoordValue: function($old, coordMode, allowCoordBorrow)
	{
		var glyph = this.getParent();
		if (glyph && coordMode === CM.COORD2D)
		{
			var refCoords = this.getIndirectCoordRefCoords(coordMode, allowCoordBorrow);
			if (refCoords)
			{
				var refDelta = CU.substract(refCoords[1], refCoords[0]);
				var nodeStart = glyph.getNodeAt(0);
				var baseCoord = nodeStart.getCoordOfMode(coordMode);
				var ratio = this.getIndirectCoordStorageOfMode(coordMode)['ratio'];
				if (Kekule.ObjUtils.notUnset(ratio))
				{
					var delta = CU.multiply(refDelta, ratio);
					var result = CU.add(baseCoord, delta);
					//console.log('calc', this.getIndirectCoordStorageOfMode(coordMode), ratio, delta, result);
					return result;
				}
			}
		}

		return $old(coordMode, allowCoordBorrow);
	},

	/** @private */
	_isValidChemNodeOrConnectorStickTarget: function(targetObj)
	{
		var result = (targetObj instanceof Kekule.ChemStructureNode) || (targetObj instanceof Kekule.ChemStructureConnector);
		if (!result && (targetObj instanceof Kekule.ChemMarker.BaseMarker))
		{
			var parent = targetObj.getParent && targetObj.getParent();
			if (parent)  // the marker of node/connector (e.g., electron pair) can also be a valid target
				result = (parent instanceof Kekule.ChemStructureNode) || (parent instanceof Kekule.ChemStructureConnector);
		}
		return result;
	},
	/** @ignore */
	getAllowChildCoordStickTo: function(child, dest)
	{
		var index = this.indexOfNode(child);
		if (index === 0 || index === this.getNodeCount() - 1)  // only the leading and tailing node can be sticked
		{
			var result = !dest  // dest not set, a general test, just returns true
				|| (this._isValidChemNodeOrConnectorStickTarget(dest, child) && !this._isChildrenStickingTo(dest, [child]));
			return result;
		}
		else
			return false;
	},
	/** @ignore */
	getChildUseCoordStickOffset: function(/*$super, */child, stickDest)
	{
		if (stickDest instanceof Kekule.ChemStructureNode || stickDest instanceof Kekule.ChemStructureConnector)
		{
			return true;
		}
		else
		{
			return false;
		}
	},
	/** @private */
	_isChildrenStickingTo: function(dest, excludeChildren)
	{
		var nodes = this._getArrowStartingNodes();
		nodes = Kekule.ArrayUtils.exclude(nodes, excludeChildren || []);
		for (var i = 0, l = nodes.length; i < l; ++i)
		{
			var n = nodes[i];
			if (n.getCoordStickTarget() === dest)
				return true;
		}
		return false;
	}
});


/**
 * A general arc glyph.
 * @class
 * @augments Kekule.Glyph.BaseArc
 */
Kekule.Glyph.Arc = Class.create(Kekule.Glyph.BaseArc,
/** @lends Kekule.Glyph.Arc# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Glyph.Arc'
});

/**
 * A general twin arc glyph.
 * @class
 * @augments Kekule.Glyph.BaseTwinArc
 */
Kekule.Glyph.TwinArc = Class.create(Kekule.Glyph.BaseTwinArc,
/** @lends Kekule.Glyph.TwinArc# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Glyph.TwinArc'
});


})();