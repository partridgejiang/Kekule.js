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

var OU = Kekule.ObjUtils;
var NT = Kekule.Glyph.NodeType;
var PT = Kekule.Glyph.PathType;

var EAU = Kekule.Glyph.ElectronArrowGlyphUtils;

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
	initialize: function(/*$super, */id, refLength, initialParams, coord2D, coord3D)
	{
		this.tryApplySuper('initialize', [id, refLength, initialParams, coord2D, coord3D])  /* $super(id, refLength, initialParams, coord2D, coord3D) */;
		if (this.setRenderOption)  // avoid error if render module is not loaded
			this.setRenderOption('strokeWidth', 1.5);
	},
	/** @ignore */
	getRefLengthRatio: function()
	{
		return 0.25;
	},
	/** @private */
	doCreateDefaultStructure: function(/*$super, */refLength, initialParams)
	{
		initialParams.edgeCount = 3;
		initialParams.nodeProps = Object.extend(initialParams.nodeProps || {}, {'interactMode': Kekule.ChemObjInteractMode.HIDDEN});
		initialParams.connectorProps = Object.extend(initialParams.connectorProps || {}, {'interactMode': Kekule.ChemObjInteractMode.HIDDEN});
		return this.tryApplySuper('doCreateDefaultStructure', [refLength, initialParams])  /* $super(refLength, initialParams) */;
	},
	/** @private */
	_applyParamsToConnector: function(/*$super, */connector, initialParams)
	{
		return this.tryApplySuper('_applyParamsToConnector', [connector, initialParams])  /* $super(connector, initialParams) */;
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
	initialize: function(/*$super, */id, refLength, initialParams, coord2D, coord3D)
	{
		this.tryApplySuper('initialize', [id, refLength, initialParams, coord2D, coord3D])  /* $super(id, refLength, initialParams, coord2D, coord3D) */;
		if (this.setRenderOption)  // avoid error if render module is not loaded
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
	REVERSIBLE: 'reversible',
	RESONANCE: 'resonance',
	RETROSYNTHESIS: 'retrosynthesis',
	CUSTOM: 'custom'
};
Kekule.Glyph.ReactionArrowType.getDefPathParamOfArrowType = function(arrowType)
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
		default:  // other situation is not a reaction arrow
			result = null;
	}
	return result;
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
	initPropValues: function(/*$super*/)
	{
		this.tryApplySuper('initPropValues')  /* $super() */;
		this.setReactionType(Kekule.Glyph.ReactionArrowType.NORMAL);
	},
	/** @ignore */
	doCreateDefaultStructure: function(/*$super, */refLength, initialParams)
	{
		var creationParams = initialParams;
		var rType = initialParams.reactionType || this.getReactionType();
		if (rType)
		{
			var defParams = this._getPathParamOfArrowType(rType);
			creationParams = Object.extend(defParams, initialParams);
		}
		var result = this.tryApplySuper('doCreateDefaultStructure', [refLength, creationParams])  /* $super(refLength, creationParams) */;
		if (rType)
			this.setReactionType(rType);
		return result;
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
		return Kekule.Glyph.ReactionArrowType.getDefPathParamOfArrowType(arrowType);
	}
});

////////////// Set of arc based glyphs //////////////////////

/**
 * Electron pushing arrow (usually connected with two bonds or bond/atom) in reaction.
 * @class
 * @augments Kekule.Glyph.BaseArc
 *
 * @property {Kekule.ChemStructureObject} Donor The electron donor node or connector.
 * @property {Kekule.ChemStructureObject} Receptor The electron receptor node or connector.
 * @property {Kekule.ChemStructureObject} DirectDonor The direct electron donor object (e.g., the lone pair) of donor node/connector.
 * @property {Kekule.ChemStructureObject} DirectReceptor The direct electron receptor object (e.g., the lone pair) of donor node/connector.
 */
Kekule.Glyph.ElectronPushingArrow = Class.create(Kekule.Glyph.BaseArc,
/** @lends Kekule.Glyph.ElectronPushingArrow# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Glyph.ElectronPushingArrow',
	/** @private */
	initProperties: function()
	{
		this.defineProp('electronCount', {
			'dataType': DataType.INT,
			'getter': function() {
				var arrowSide = this._getValidArrowSide();
				var ASide = Kekule.Glyph.ArrowSide;
				if (arrowSide === ASide.BOTH)
					return 2;
				else if ([ASide.SINGLE, ASide.REVERSED].indexOf(arrowSide) >= 0)
					return 1;
				else
					return null;
			},
			'setter': function(value) {
				var ASide = Kekule.Glyph.ArrowSide;
				var arrowPos = this._getValidArrowPos();
				var conn = this.getConnectorAt(0);
				if (!arrowPos)
				{
					conn.getPathParams().endArrowType = Kekule.Glyph.ArrowType.OPEN;
					arrowPos = 'end';
				}
				var params = conn.getPathParams();
				if (value >= 2)
				{
					params[arrowPos + 'ArrowSide'] = ASide.BOTH;
				}
				else if (value === 1)
				{
					params[arrowPos + 'ArrowSide'] = ASide.SINGLE;
				}
				conn.setPathParams(params);
			}
		});
		this.defineProp('directReceptor', {
			'dataType': 'Kekule.ChemStructureObject',
			'getter': function() {
				var node = this.getNodeAt(1);
				return this._getValidElectronTarget(node);
			},
			'setter': function(value) {
				var node = this.getNodeAt(1);
				this._setValidElectronTarget(node, value);
			}
		});
		this.defineProp('directDonor', {
			'dataType': 'Kekule.ChemStructureObject',
			'getter': function() {
				var node = this.getNodeAt(0);
				return this._getValidElectronTarget(node);
			},
			'setter': function(value) {
				var node = this.getNodeAt(0);
				this._setValidElectronTarget(node, value);
			}
		});
		this.defineProp('receptor', {
			'dataType': 'Kekule.ChemStructureObject',
			'getter': function() {
				var node = this.getNodeAt(1);
				return this._getValidElectronTargetNodeOrConnector(node);
			},
			'setter': function(value) {
				var node = this.getNodeAt(1);
				this._setValidElectronTarget(node, value);
			}
		});
		this.defineProp('donor', {
			'dataType': 'Kekule.ChemStructureObject',
			'getter': function() {
				var node = this.getNodeAt(0);
				return this._getValidElectronTargetNodeOrConnector(node);
			},
			'setter': function(value) {
				var node = this.getNodeAt(0);
				this._setValidElectronTarget(node, value);
			}
		});
	},
	/** @ignore */
	doCreateDefaultStructure: function(/*$super, */refLength, initialParams)
	{
		var result = this.tryApplySuper('doCreateDefaultStructure', [refLength, initialParams])  /* $super(refLength, initialParams) */;
		if (initialParams.electronCount)
			this.setElectronCount(initialParams.electronCount);
		return result;
	},
	/** @private */
	_isValidElectronTarget: function(obj)
	{
		/*
		var result = (obj instanceof Kekule.ChemStructureNode) || (obj instanceof Kekule.ChemStructureConnector);
		if (!result)
		{
			var parent = obj.getParent && obj.getParent();
			if (parent)  // the marker of node/connector (e.g., electron pair) can also be a valid target
				result = (parent instanceof Kekule.ChemStructureNode) || (parent instanceof Kekule.ChemStructureConnector);
		}
		return result;
		*/
		return this._isValidChemNodeOrConnectorStickTarget(obj);
	},
	/** @private */
	_getValidElectronTarget: function(glyphNode)
	{
		/*
		var stickTarget = glyphNode && glyphNode.getCoordStickTarget && glyphNode.getCoordStickTarget();
		if (stickTarget && this._isValidElectronTarget(stickTarget))
			return stickTarget;
		else
			return null;
		*/
		return Kekule.Glyph.ElectronArrowGlyphUtils.getValidElectronTarget(glyphNode);
	},
	/** @private */
	_setValidElectronTarget: function(glyphNode, target)
	{
		/*
		if (glyphNode.getAllowCoordStickTo && glyphNode.getAllowCoordStickTo(target))
		{
			if (!target)
				glyphNode.setCoordStickTarget(null);
			else if (this._isValidElectronTarget(target))
				glyphNode.setCoordStickTarget(target);
		}
		*/
		Kekule.Glyph.ElectronArrowGlyphUtils.setValidElectronTarget(glyphNode, target);
		return this;
	},
	/** @private */
	_getValidElectronTargetNodeOrConnector: function(glyphNode)
	{
		/*
		var result = null;
		var target = this._getValidElectronTarget(glyphNode);
		if (target)
		{
			if (target instanceof Kekule.ChemMarker.BaseMarker)
				result = target.getParent();
			else
				result = target;
		}
		return result;
		*/
		return Kekule.Glyph.ElectronArrowGlyphUtils.getValidElectronTargetNodeOrConnector(glyphNode);
	},
	/** @private */
	_getValidArrowPos: function()
	{
		var conn = this.getConnectorAt(0);
		var params = conn && conn.getPathParams();
		if (params)
		{
			if (params.endArrowType)
				return 'end';
			else if (params.startArrowType)
				return 'start';
		}
		return null;
	},
	/** @private */
	_getValidArrowSide: function()
	{
		var conn = this.getConnectorAt(0);
		var params = conn && conn.getPathParams();
		if (params)
		{
			if (params.endArrowType)
				return params.endArrowSide || Kekule.Glyph.ArrowSide.DEFAULT;
			if (params.startArrowType)
				return params.startArrowSide || Kekule.Glyph.ArrowSide.DEFAULT;

		}
		return null;
	},
	/** @ignore */
	_applyParamsToConnector: function(connector, initialParams)
	{
		var p = Object.create(initialParams);
		if (Kekule.ObjUtils.isUnset(initialParams.autoOffset))
			p.autoOffset = true;
		connector.setPathParams(p);
	}
});

/**
 * Bond forming electron pushing arrow in reaction.
 * @class
 * @augments Kekule.Glyph.BaseTwinArc
 *
 * @property {Array} Donors The two electron donor nodes to form the bond.
 * @property {Array} DirectDonors The direct electron donor objects (e.g., the lone pair) of donor nodes.
 */
Kekule.Glyph.BondFormingElectronPushingArrow = Class.create(Kekule.Glyph.BaseTwinArc,
/** @lends Kekule.Glyph.BondFormingElectronPushingArrow# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Glyph.BondFormingElectronPushingArrow',
	/** @private */
	initProperties: function()
	{
		this.defineProp('electronCount', {
			'dataType': DataType.INT,
			'getter': function()
			{
				var result = null;
				for (var i = 0, l = this.getConnectorCount(); i < l; ++i)
				{
					var count = this._getConnectorElectronCount(this.getConnectorAt(i));
					if (OU.notUnset(count))
					{
						if (OU.isUnset(result))
							result = count;
						else if (result !== count)
							return null;
					}
				}
				return result * this.getConnectorCount();
			},
			'setter': function(value) {
				if (value === this.getElectronCount())
					return;
				var perValue = this.getConnectorCount()? value / this.getConnectorCount(): value;
				perValue = Math.round(perValue);
				if (perValue <= 0)
					perValue = 1;
				var ASide = Kekule.Glyph.ArrowSide;
				//var arrowPos = this._getValidArrowPos();
				var connectors = this.getConnectors();
				var arrowPos;
				for (var i = 0, l = connectors.length; i < l; ++i)
				{
					var conn = connectors[i];
					//if (!arrowPos)
					{
						conn.getPathParams().endArrowType = Kekule.Glyph.ArrowType.OPEN;
						arrowPos = 'end';
					}
					var params = conn.getPathParams();
					if (perValue >= 2)
					{
						params[arrowPos + 'ArrowSide'] = ASide.BOTH;
					}
					else if (perValue === 1)
					{
						params[arrowPos + 'ArrowSide'] = (i % 2)? ASide.SINGLE: ASide.REVERSED;
					}
					conn.setPathParams(params);
				}
			}
		});
		this.defineProp('directDonors', {
			'dataType': DataType.ARRAY,
			'getter': function() {
				var nodes = this._getArrowStartingNodes();
				var result = [];
				for (var i = 0, l = nodes.length; i < l; ++i)
				{
					var obj = EAU.getValidElectronTarget(nodes[i]);
					if (obj)
						result.push(obj);
				}
				return result;
			},
			'setter': function(value) {
				var nodes = this._getArrowStartingNodes();
				if (nodes.length)
				{
					for (var i = 0, l = nodes.length; i < l; ++i)
					{
						var node = nodes[i];
						var obj = value[i];
						EAU.setValidElectronTarget(node, value);
					}
				}
			}
		});
		this.defineProp('donors', {
			'dataType': DataType.ARRAY,
			'getter': function() {
				var nodes = this._getArrowStartingNodes();
				var result = [];
				for (var i = 0, l = nodes.length; i < l; ++i)
				{
					var obj = EAU.getValidElectronTargetNodeOrConnector(nodes[i]);
					if (obj)
						result.push(obj);
				}
				return result;
			},
			'setter': function(value) {
				this.setDirectDonors(value);
			}
		});
	},
	/** @private */
	_getConnectorElectronCount: function(connector)
	{
		var params = connector && connector.getPathParams();
		if (params)
		{
			var ASide = Kekule.Glyph.ArrowSide;
			var arrowSide = (params.endArrowType)? params.endArrowSide || Kekule.Glyph.ArrowSide.DEFAULT: null;
			if (arrowSide === ASide.BOTH)
				return 2;
			else if ([ASide.SINGLE, ASide.REVERSED].indexOf(arrowSide) >= 0)
				return 1;
		}
		return null;
	},

	/** @ignore */
	doCreateDefaultStructure: function(/*$super, */refLength, initialParams)
	{
		var result = this.tryApplySuper('doCreateDefaultStructure', [refLength, initialParams])  /* $super(refLength, initialParams) */;
		this.setElectronCount(initialParams.electronCount || 1);
		return result;
	},
});

})();