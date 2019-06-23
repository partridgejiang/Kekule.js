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
 */

(function(){
"use strict";

var NT = Kekule.Glyph.NodeType;
var PT = Kekule.Glyph.PathType;

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
	initialize: function($super, id, refLength, initialParams, coord2D, coord3D)
	{
		$super(id, refLength, initialParams, coord2D, coord3D);
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
	initialize: function($super, id, refLength, initialParams, coord2D, coord3D)
	{
		$super(id, refLength, initialParams, coord2D, coord3D);
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
	initialize: function($super, id, refLength, initialParams, coord2D, coord3D)
	{
		$super(id, refLength, initialParams, coord2D, coord3D);
	},
	/** @private */
	doCreateDefaultStructure: function(refLength, initialParams)
	{
		// initialParams can include additional field: lineLength
		var C = Kekule.CoordUtils;

		var coord2D = {'x': 0, 'y': 0};
		var coord3D = {'x': 0, 'y': 0, 'z': 0};
		var delta = {'x': refLength * (initialParams.lineLength || 1)};
		var controllerDelta = {'x': 0, 'y': delta.x / 2};
		var node1 = new Kekule.Glyph.PathGlyphNode(null, null, coord2D, coord3D);  // starting node
		var node2 = new Kekule.Glyph.PathGlyphNode(null, null, C.add(coord2D, delta), C.add(coord3D, delta));  // ending node
		//var node3 = new Kekule.Glyph.PathGlyphNode(null, Kekule.Glyph.NodeType.CONTROLLER, C.add(coord2D, controllerDelta), C.add(coord3D, controllerDelta));  // control node
		var connector = new Kekule.Glyph.PathGlyphArcConnector(null, [node1, node2]);
		this._applyParamsToConnector(connector, initialParams);
		var controlPoint = connector.getControlPoint();
		//controlPoint.setDistanceToChord(delta.x)
		controlPoint.setCoord2D(controllerDelta)
				.setCoord3D(controllerDelta);

		this.appendNode(node1);
		this.appendNode(node2);
		this.appendConnector(connector);

		connector.setInteractMode(Kekule.ChemObjInteractMode.HIDDEN);
		//node1.setInteractMode(Kekule.ChemObjInteractMode.HIDDEN);
		//node2.setInteractMode(Kekule.ChemObjInteractMode.HIDDEN);
	},
	/** @private */
	_applyParamsToConnector: function(connector, initialParams)
	{
		connector.setPathParams(initialParams);
	},
	/** @ignore */
	getAllowChildCoordStickTo: function(child, dest)
	{

		return !dest ||  // dest not set, a general test, just returns true
			((dest instanceof Kekule.ChemStructureNode) || (dest instanceof Kekule.ChemStructureConnector)) && (!this._isChildrenStickingTo(dest, [child]));
	},
	/** @ignore */
	getChildUseCoordStickOffset: function($super, child, stickDest)
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


})();