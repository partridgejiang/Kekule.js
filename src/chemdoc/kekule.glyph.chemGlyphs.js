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
		initialParams.nodeProps = Object.extend(initialParams.nodeProps || {}, {'interactMode': Kekule.ChemObjInteractMode.HIDDEN});
		initialParams.connectorProps = Object.extend(initialParams.connectorProps || {}, {'interactMode': Kekule.ChemObjInteractMode.HIDDEN});
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

/////////////// Set of line based glyphs ////////////////////

/**
 * A simple line segment glyph.
 * @class
 * @augments Kekule.Glyph.StraightLine
 */
Kekule.Glyph.Segment = Class.create(Kekule.Glyph.StraightLine,
/** @lends Kekule.Glyph.Segment# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Glyph.Segment'
});

/**
 * Enumeration of reaction arrow types.
 * @enum
 */
Kekule.Glyph.ReactionArrowType = {
	NORMAL: 'normal',
	REVERSIBLE: 'Reversible',
	RESONANCE: 'resonance',
	RETROSYNTHESIS: 'retrosynthesis'
};

/**
 * A simple line segment glyph.
 * @class
 * @augments Kekule.Glyph.StraightLine
 */
Kekule.Glyph.ReactionArrow = Class.create(Kekule.Glyph.StraightLine,
/** @lends Kekule.Glyph.ReactionArrow# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Glyph.ReactionArrow',
	/** @private */
	initProperties: function() {
		this.defineProp('reactionType', {
			'dataType': DataType.STRING,
			'enumSource': Kekule.Glyph.ReactionArrowType,
			'setter': function(value) {
				this.setPropStoreFieldValue('reactionType', value);
				this.reactionTypeChanged(value);
			}
		});
	},
	/** @ignore */
	initPropValues: function($super)
	{
		$super();
		this.setReactionType(Kekule.Glyph.ReactionArrowType.NORMAL);
	},
	/** @ignore */
	doCreateDefaultStructure: function($super, refLength, initialParams)
	{
		var creationParams = initialParams;
		var rType = this.getReactionType();
		if (rType)
		{
			var defParams = this._getPathParamOfArrowType(rType);
			creationParams = Object.extend(defParams, initialParams);
		}
		return $super(refLength, creationParams);
	},
	/** @private */
	reactionTypeChanged: function(newArrowType)
	{
		var pParams = this._getPathParamOfArrowType(newArrowType);
		if (pParams)
		{
			// update path params
			var connector = this.getConnectorAt(0);
			if (connector)
				connector.modifyPathParams(pParams);
		}
	},
	/** @private */
	_getPathParamOfArrowType: function(arrowType)
	{
		var RAT = Kekule.Glyph.ReactionArrowType;
		var AT = Kekule.Glyph.ArrowType;
		var AS = Kekule.Glyph.ArrowSide;
		var result;
		switch (arrowType)
		{
			case RAT.NORMAL:
				result = {
					'startArrowType': AT.NONE,
					'endArrowType': AT.OPEN,
					'endArrowSide': AS.BOTH,
					'lineCount': 1
				};
				break;
			case RAT.REVERSIBLE:
				result = {
					'startArrowType': AT.OPEN,
					'startArrowSide': AS.REVERSED,
					'endArrowType': AT.OPEN,
					'endArrowSide': AS.SINGLE,
					'lineGap': 0.1,
					'lineCount': 2
				};
				break;
			case RAT.RESONANCE:
				result = {
					'startArrowType': AT.OPEN,
					'startArrowSide': AS.BOTH,
					'endArrowType': AT.OPEN,
					'endArrowSide': AS.BOTH,
					'lineCount': 1
				};
				break;
			case RAT.RETROSYNTHESIS:
				result = {
					'startArrowType': AT.NONE,
					'endArrowType': AT.OPEN,
					'endArrowSide': AS.BOTH,
					'lineGap': 0.1,
					'lineCount': 2
				};
				break;
		}
		return result;
	}
});

////////////// Set of arc based glyphs //////////////////////

/**
 * Electron pushing arrow (usually connected with two bonds or bond/atom) in reaction.
 * @class
 * @augments Kekule.Glyph.PathGlyph
 */
Kekule.Glyph.ElectronPushingArrow = Class.create(Kekule.Glyph.Arc,
/** @lends Kekule.Glyph.ElectronPushingArrow# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Glyph.ElectronPushingArrow',
	/* @ignore */
	/*
	getAllowChildCoordStickTo: function(child)
	{
		return true;  // allow coord stick of child nodes
	},
	*/
	/* @ignore */
	/*
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
	*/
	/** @ignore */
	_applyParamsToConnector: function(connector, initialParams)
	{
		var p = Object.create(initialParams);
		if (Kekule.ObjUtils.isUnset(initialParams.autoOffset))
			p.autoOffset = true;
		connector.setPathParams(p);
	}
});

})();