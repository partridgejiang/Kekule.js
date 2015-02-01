/**
 * @fileoverview
 * Glyphs of some chem symbols.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /core/kekule.structures.js
 * requires /chemdoc/kekule.glyph.base.js
 * requires /chemdoc/kekule.glyph.pathGlyphs.js
 * requires /chemdoc/kekule.glyph.lines.js
 */

(function(){
"use strict";

var NT = Kekule.Glyph.NodeType;
var PT = Kekule.Glyph.PathType;

/**
 * Heat symbol (a triangle) of reaction equation.
 * @class
 * @augments Kekule.Glyph.Polygon
 */
Kekule.Glyph.HeatSymbol = Class.create(Kekule.Glyph.Polygon,
/** @lends Kekule.Glyph.HeatSymbol# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Glyph.HeatSymbol',
	/** @constructs */
	initialize: function($super, id, refLength, initialParams, coord2D, coord3D)
	{
		$super(id, refLength, initialParams, coord2D, coord3D);
		this.setRenderOption('strokeWidth', 1.5);
	},
	/** @ignore */
	getRefLengthRatio: function()
	{
		return 0.25;
	},
	/** @private */
	doCreateDefaultStructure: function($super, refLength, initialParams)
	{
		initialParams.edgeCount = 3;
		initialParams.nodeProps = Object.extend(initialParams.nodeProps || {}, {'interactMode': Kekule.ChemObjInteractMode.HIDDEN})
		initialParams.connectorProps = Object.extend(initialParams.connectorProps || {}, {'interactMode': Kekule.ChemObjInteractMode.HIDDEN})
		return $super(refLength, initialParams);
	},
	/** @private */
	_applyParamsToConnector: function($super, connector, initialParams)
	{
		return $super(connector, initialParams);
	}
});

/**
 * A glyph "add" symbol in reaction.
 * @class
 * @augments Kekule.Glyph.PathGlyph
 */
Kekule.Glyph.AddSymbol = Class.create(Kekule.Glyph.PathGlyph,
/** @lends Kekule.Glyph.AddSymbol# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Glyph.AddSymbol',
	/** @constructs */
	initialize: function($super, id, refLength, initialParams, coord2D, coord3D)
	{
		$super(id, refLength, initialParams, coord2D, coord3D);
		this.setRenderOption('strokeWidth', 1.5);
	},
	/** @private */
	getRefLengthRatio: function()
	{
		return 0.5;
	},
	/** @private */
	doCreateDefaultStructure: function(refLength, initialParams)
	{
		var nodeProps = {'interactMode': Kekule.ChemObjInteractMode.HIDDEN};
		var connectorProps = {'interactMode': Kekule.ChemObjInteractMode.HIDDEN};

		// initialParams can include additional field: lineLength
		var C = Kekule.CoordUtils;

		var coord2D = {'x': 0, 'y': 0};
		var coord3D = {'x': 0, 'y': 0, 'z': 0};
		var length = refLength * this.getRefLengthRatio() * (initialParams.lineLength || 1) / 2;
		var baseNode = new Kekule.Glyph.PathGlyphNode(null, null, coord2D, coord3D);
		baseNode.setPropValues(nodeProps);
		this.appendNode(baseNode);
		var adjustDeltas = [
			{x: -length, y: 0},
			{x: 0, y: -length},
			{x: length, y: 0},
			{x: 0, y: length}
		];
		for (var i = 0, l = adjustDeltas.length; i < l; ++i)
		{
			var delta = adjustDeltas[i];
			var node = new Kekule.Glyph.PathGlyphNode(null, null, C.add(coord2D, delta), C.add(coord3D, delta));
			node.setPropValues(nodeProps);
			var connector = new Kekule.Glyph.PathGlyphConnector(null, PT.LINE, [baseNode, node]);
			connector.setPropValues(connectorProps);
			this._applyParamsToConnector(connector, initialParams);
			this.appendNode(node);
			this.appendConnector(connector);
		}
	},
	/** @private */
	_applyParamsToConnector: function(connector, initialParams)
	{
		connector.setPathParams(initialParams);
	}
});

})();