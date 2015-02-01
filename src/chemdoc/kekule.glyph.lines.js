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
 * A glyph of straight line be.
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
		connector.setPathParams(initialParams);
	}
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


})();