/**
 * @fileoverview
 * Utils method about chem objects.
 * @author Partridge Jiang
 */

/*
 * requires /utils/kekule.utils.js
 * requires /core/kekule.common.js
 * requires /core/kekule.valences.js
 * requires /core/kekule.structures.js
 */

(function () {

"use strict";

var AU = Kekule.ArrayUtils;

/**
 * Util class to manipulate ctab based chem structures.
 * @class
 */
Kekule.ChemStructureUtils = {
	/**
	 * Returns the cross connectors of subgroup, or connectors of a normal node.
	 * All these returned connectors are connecting a internal point of node to a external point.
	 * @param {Kekule.ChemStructureNode} node
	 * @returns {Array}
	 */
	getChemNodeXConnectors: function(node)
	{
		var connectors = [];
		if (node instanceof Kekule.StructureFragment)
		{
			connectors = node.getCrossConnectors();
		}
		else if (node instanceof Kekule.ChemStructureNode)
		{
			connectors = node.getLinkedConnectors();
		}
		return connectors;
	},
	/**
	 * Returns the order sum of all cross connectors of a node.
	 * @param {Kekule.ChemStructureNode} node
	 * @returns {Int}
	 */
	getChemNodeXConnectorsOrderSum: function(node)
	{
		var connectors = Kekule.ChemStructureUtils.getChemNodeXConnectors(node);
		var result = 0;
		for (var i = 0, l = connectors.length; i < l; ++i)
		{
			var connector = connectors[i];
			if (connector instanceof Kekule.Bond && connector.isCovalentBond())
			{
				var bondOrder = connector.getBondOrder() || 0;
				result += bondOrder;
			}
		}
		return result;
	},
	/**
	 * Returns median of all input connector lengths.
	 * @param {Array} connectors
	 * @param {Int} coordMode
	 * @param {Bool} allowCoordBorrow
	 * @return {Float}
	 */
	getConnectorLengthMedian: function(connectors, coordMode, allowCoordBorrow)
	{
		var lengths = [];
		for (var i = 0, l = connectors.length; i < l; ++i)
		{
			var connector = connectors[i];
			if (connector && connector.getLength)
			{
				var length = connector.getLength(coordMode, allowCoordBorrow);
				if (length)
					lengths.push(length);
			}
		}
		if (l === 0)  // no connectors at all
			return 1;  // TODO: this value should be calculated
		if (l <= 1)
			return lengths[0];
		else
		{
			// sort lengths to find the median one
			lengths.sort();
			var count = lengths.length;
			var result = (count % 2)? lengths[(count + 1) >> 1]: (lengths[count >> 1] + lengths[(count >> 1) - 1]) / 2;
			return result;
		}
	},
	/**
	 * Returns structured children of chemObj. The type of chemObj can be:
	 *   {@link Kekule.ChemObjList}: returns chemObj.getItems();
	 *   {@link Kekule.ChemStructureObjectGroup}: returns chemObj.getAllObjs();
	 *   {@link Kekule.CompositeMolecule}: returns chemObj.getSubMolecules().getAllObjs().
	 *   {@link Kekule.ChemSpaceElement} or {@link Kekule.ChemSpace}: returns all child structured objects inside it.
	 * Other types will simply return [chemObj].
	 * If param cascade is true, each childObj will also be checked.
	 * @param {Variant} chemObj
	 * @param {Bool} cascade
	 * @returns {Array}
	 */
	getChildStructureObjs: function(chemObj, cascade)
	{
		var isComplex = true;
		var result;
		if (chemObj instanceof Kekule.CompositeMolecule)
			result = chemObj.getSubMolecules().getAllObjs();
		else if (chemObj instanceof Kekule.ChemStructureObjectGroup)
			result = chemObj.getAllObjs();
		else if (chemObj instanceof Kekule.ChemObjList)
			result = chemObj.getItems();
		else if (chemObj instanceof Kekule.ChemSpaceElement)
			result = chemObj.getChildren().getItems();
		else if (chemObj instanceof Kekule.ChemSpace)
			result = chemObj.getChildren();
		else
		{
			isComplex = false;
			return [chemObj];
		}
		result = [].concat(result);  // clone result, avoid affect properties of chemObj

		// if not returned and cascade, need future check
		if (cascade && isComplex)
		{
			var newResult = [];
			for (var i = 0, l = result.length; i < l; ++i)
			{
				var obj = result[i];
				var cascadeChilds = Kekule.ChemStructureUtils.getChildStructureObjs(obj, cascade);
				if (!cascadeChilds.length || (cascadeChilds.length === 1 && cascadeChilds[0] === obj))  // can not find cascade children
					Kekule.ArrayUtils.pushUnique(newResult, obj);
				else  // children find, use them to replace obj
				{
					Kekule.ArrayUtils.pushUnique(newResult, cascadeChilds);
				}
			}
			result = newResult;
		}
		//console.log(result);
		return result;
	},

	/**
	 * Returns all child structure fragments among children of chemObj.
	 * @param {Variant} chemObj
	 * @param {Bool} cascade
	 * @returns {Array}
	 */
	getAllStructFragments: function(chemObj, cascade)
	{
		if (chemObj instanceof Kekule.StructureFragment)
			return [chemObj];

		var childObjs = Kekule.ChemStructureUtils.getChildStructureObjs(chemObj, cascade);
		var result = [];
		for (var i = 0, l = childObjs.length; i < l; ++i)
		{
			if (childObjs[i] instanceof Kekule.StructureFragment)
				Kekule.ArrayUtils.pushUnique(result, childObjs[i]);
		}
		return result;
	},

	/**
	 * Find all child structure fragments among children of chemObj, then merge them into one.
	 * @param {Variant} chemObj
	 * @param {Class} newFragmentClass If set, new fragment will be based on this class.
	 *   Otherwise an instance of {@link Kekule.Molecule} will be created.
	 * @return {Kekule.StructureFragment}
	 */
	getTotalStructFragment: function(chemObj, newFragmentClass)
	{
		var fragments = Kekule.ChemStructureUtils.getAllStructFragments(chemObj, true);
		var count = fragments.length;
		if (count <= 0)  // nothing found
			return null;
		else if (count === 1)  // only one, returns it directly
			return fragments[0];
		else  // need merge
		{
			return Kekule.ChemStructureUtils.mergeStructFragments(fragments, newFragmentClass);
		}
	},

	/**
	 * Returns nodes or connectors that should be removed cascadely with chemStructObj.
	 * @param {Object} chemStructObj
	 * @returns {Array}
	 * @deprecated
	 */
	getCascadeDeleteObjs: function(chemStructObj)
	{
		var result = [];
		// all usual connectors (two ends) connected to chemStructObj should be removed
		var linkedConnectors = chemStructObj.getLinkedConnectors? chemStructObj.getLinkedConnectors(): [];
		for (var i = 0, l = linkedConnectors.length; i < l; ++i)
		{
			var connector = linkedConnectors[i];
			if (connector.getConnectedObjs().length <= 2)
			{
				Kekule.ArrayUtils.pushUnique(result, connector);
				var newCascadeObjs = Kekule.ChemStructureUtils.getCascadeDeleteObjs(connector);
				Kekule.ArrayUtils.pushUnique(result, newCascadeObjs);
			}
		}

		if (chemStructObj instanceof Kekule.ChemStructureNode)
		{
			// no additional objects should be delete
		}
		else if (chemStructObj instanceof Kekule.ChemStructureConnector)
		{
			// nodes connected with and only with this connector should be removed
			var objs = chemStructObj.getConnectedObjs();
			for (var i = 0, l = objs.length; i < l; ++i)
			{
				var obj = objs[i];
				if (obj instanceof Kekule.ChemStructureNode)
				{
					if (obj.getLinkedConnectors().length <= 1)
						Kekule.ArrayUtils.pushUnique(result, obj);
				}
			}
		}
		else  // other objects
			;

		return result;
	},

	/**
	 * Move nodes and connectors from target to dest structure fragment.
	 * @param {Kekule.StructureFragment} target
	 * @param {Kekule.StructureFragment} dest
	 * @param {Array} moveNodes
	 * @param {Array} moveConnectors
	 * @param {Bool} ignoreAnchorNodes
	 */
	moveChildBetweenStructFragment: function(target, dest, moveNodes, moveConnectors, ignoreAnchorNodes)
	{
		/*
		var CU = Kekule.CoordUtils;

		target.beginUpdate();
		dest.beginUpdate();
		var anchorNodes = target.getAnchorNodes();
		try
		{
			// TODO: here we need change coord if essential
			var targetCoord2D = target.getAbsCoord2D();
			var targetCoord3D = target.getAbsCoord3D();
			var destCoord2D = dest.getAbsCoord2D();
			var destCoord3D = dest.getAbsCoord3D();

			var coordDelta2D = CU.substract(targetCoord2D, destCoord2D);
			var coordDelta3D = CU.substract(targetCoord3D, destCoord3D);

			//console.log('coordDelta', coordDelta2D, coordDelta3D);

			var nodes = Kekule.ArrayUtils.clone(moveNodes);
			var connectors = Kekule.ArrayUtils.clone(moveConnectors);
			for (var i = 0, l = nodes.length; i < l; ++i)
			{
				var node = nodes[i];
				var index = target.indexOfNode(node);
				if (index >= 0)
				{
					target.removeNodeAt(index, true);  // preserve linked connectors

					var oldCoord2D = node.getCoord2D();
					if (oldCoord2D)
					{
						var newCoord2D = CU.add(oldCoord2D, coordDelta2D);
						node.setCoord2D(newCoord2D);
					}
					var oldCoord3D = node.getCoord3D();
					if (oldCoord3D)
					{
						var newCoord3D = CU.add(oldCoord3D, coordDelta3D);
						node.setCoord2D(newCoord3D);
					}

					dest.appendNode(node);
					if (anchorNodes.indexOf(node)>= 0)
					{
						target.removeAnchorNode(node);
						if (!ignoreAnchorNodes)
							dest.appendAnchorNode(node);
					}
				}
			}
			for (var i = 0, l = connectors.length; i < l; ++i)
			{
				var connector = connectors[i];
				var index = target.indexOfConnector(connector);
				if (index >= 0)
				{
					target.removeConnectorAt(index, true);  // preserve linked objects
					dest.appendConnector(connector);
				}
			}
		}
		finally
		{
			//console.log('[struct merge done]');
			dest.endUpdate();
			target.endUpdate();
		}
		*/
		return Kekule.StructureFragment.moveChildBetweenStructFragment(target, dest, moveNodes, moveConnectors, ignoreAnchorNodes);
	},

	/** @private */
	_getCascadeConnectedNodesAndConnectors: function(connector, parentStructFragment)
	{
		var connectors = [];
		var nodes = [];
		var objs = connector.getConnectedObjs();
		for (var j = 0, k = objs.length; j < k; ++j)
		{
			var obj = objs[j];
			if (obj !== connector)
			{
				if (parentStructFragment)
					obj = parentStructFragment.findDirectChildOfObj(obj);
				if (obj instanceof Kekule.ChemStructureNode)
					Kekule.ArrayUtils.pushUnique(nodes, obj);
				else if (obj instanceof Kekule.ChemStructureConnector)
				{
					Kekule.ArrayUtils.pushUnique(connectors, obj);
					var connected = Kekule.ChemStructureUtils._getCascadeConnectedNodesAndConnectors(obj);
					Kekule.ArrayUtils.pushUnique(connectors, connected.connectors);
					Kekule.ArrayUtils.pushUnique(nodes, connected.nodes);
				}
			}
		}
		return {'connectors': connectors, 'nodes': nodes};
	},

	/**
	 * Merge all fragments into a big one (this one may be unconnected).
	 * @param {Array} fragments
	 * @param {Class} newFragmentClass If set, new fragment will be based on this class.
	 *   Otherwise an instance of {@link Kekule.Molecule} will be created.
	 * @return {Kekule.StructureFragment}
	 */
	mergeStructFragments: function(fragments, newFragmentClass)
	{
		if (fragments.length <= 1)
			return fragments[0];
		else
		{
			var fclass = newFragmentClass || Kekule.Molecule;
			var result = new fclass();

			for (var i = 0, l = fragments.length; i < l; ++i)
			{
				var frag = fragments[i].clone();
				Kekule.ChemStructureUtils.moveChildBetweenStructFragment(frag, result, frag.getNodes(), frag.getConnectors());
			}
			return result;
		}
	},

	/**
	 * Split structFragment with unconnected nodes to multiple ones.
	 * @param {Kekule.StructureFragment} structFragment
	 * @returns {Array}
	 */
	splitStructFragment: function(structFragment)
	{
		if (!structFragment.hasCtab())  // no ctab, can not split
			return [structFragment];

		var allNodes = structFragment.getNodes();
		if (allNodes.length <= 0)
			return [structFragment];

		var allConnectors = structFragment.getConnectors();

		var splits = [];
		var currNodes = [allNodes[0]];
		var currConnectors = [];
		var currIndex = 0;
		//while (currNodes.length < allNodes.length))
		do
		{
			var node = currNodes[currIndex];
			var connectors = node.getLinkedConnectors();
			if (node.getCrossConnectors)
				connectors.concat(node.getCrossConnectors() || []);
			Kekule.ArrayUtils.pushUnique(currConnectors, connectors);
			for (var i = 0, l = connectors.length; i < l; ++i)
			{
				var connected = Kekule.ChemStructureUtils._getCascadeConnectedNodesAndConnectors(connectors[i], structFragment);
				Kekule.ArrayUtils.pushUnique(currConnectors, connected.connectors);
				Kekule.ArrayUtils.pushUnique(currNodes, connected.nodes);
			}
			++currIndex;
		}
		while (currIndex < currNodes.length);

		splits.push(structFragment);

		var restNodes = Kekule.ArrayUtils.exclude(allNodes, currNodes);
		var restConnectors = Kekule.ArrayUtils.exclude(allConnectors, currConnectors);

		if (restNodes.length > 0)
		{
			var fragClass = structFragment.getClass();
			var newFragment = new fragClass();
			Kekule.ChemStructureUtils.moveChildBetweenStructFragment(structFragment, newFragment, restNodes, restConnectors);

			var newSplits = Kekule.ChemStructureUtils.splitStructFragment(newFragment);
			splits = splits.concat(newSplits);
		}
		return splits;
	},

	/**
	 * Returns a vector reflect coord2 - coord1.
	 * @param {Kekule.ChemStructureObject} obj1
	 * @param {Kekule.ChemStructureObject} obj2
	 * @param {Int} coordMode
	 * @param {Bool} allowCoordBorrow
	 * @returns {Hash}
	 */
	getAbsCoordVectorBetweenObjs: function(obj1, obj2, coordMode, allowCoordBorrow)
	{
		var coord1 = obj1.getAbsCoordOfMode(coordMode, allowCoordBorrow);
		var coord2 = obj2.getAbsCoordOfMode(coordMode, allowCoordBorrow);
		return Kekule.CoordUtils.substract(coord2, coord1);
	},

	/** @private */
	_getRef2DCoordOfObj: function(obj, allowCoordBorrow)
	{
		var coord = obj.getAbsBaseCoord2D? obj.getAbsBaseCoord2D(allowCoordBorrow):
				obj.getAbsCoord2D? obj.getAbsCoord2D(allowCoordBorrow): obj.getCoord2D(allowCoordBorrow);
		return coord;
	},
	/** @private */
	_getStandardizedLinkedObj2DRelCoords: function(baseObj, excludeObjs, allowCoordBorrow, includeAttachedMarkers, includeUnexposedSiblings)
	{
		var result = [];
		var baseCoord = Kekule.ChemStructureUtils._getRef2DCoordOfObj(baseObj, allowCoordBorrow);
		var linkedObjs = includeUnexposedSiblings? baseObj.getLinkedObjs(): baseObj.getLinkedExposedObjs();

		if (includeAttachedMarkers && baseObj.getAttachedMarkers)
		{
			linkedObjs = linkedObjs.concat(baseObj.getAttachedMarkers() || []);
		}

		if (excludeObjs && excludeObjs.length)
			linkedObjs = AU.exclude(linkedObjs, excludeObjs);

		for (var i = 0, l = linkedObjs.length; i < l; ++i)
		{
			var obj = linkedObjs[i];

			var coord = Kekule.ChemStructureUtils._getRef2DCoordOfObj(obj, allowCoordBorrow);
			var newCoord = Kekule.CoordUtils.substract(coord, baseCoord);
			newCoord = Kekule.CoordUtils.standardize(newCoord);
			result.push(newCoord);
		}
		return result;
	},
	/**
	 * Returns an array of connector (and attachedMarkers) angles ( to X-axis ) of object.
	 * @returns {Array}
	 * @private
	 */
	_calcLinkedObj2DAnglesOfObj: function(baseObj, excludeObjs, allowCoordBorrow, includeAttachedMarkers, includeUnexposedSiblings)
	{
		var result = [];
		var linkedObjCoords = Kekule.ChemStructureUtils._getStandardizedLinkedObj2DRelCoords(baseObj, excludeObjs, allowCoordBorrow, includeAttachedMarkers, includeUnexposedSiblings);
		for (var i = 0, l = linkedObjCoords.length; i < l; ++i)
		{
			var c = linkedObjCoords[i];
			if (c.x === 0 && c.y === 0)  // zero coord, bypass
				continue;
			var angle = Math.atan2(c.y, c.x);
			if (angle < 0)
				angle = Math.PI * 2 + angle;
			result.push(angle);
		}
		result.sort();
		return result;
	},
	/** @private */
	_getMostEmptyDirectionOfExistingAngles: function(angles)  // angles must be sorted first
	{
		var l = angles.length;
		if (l === 0)
			return 0;
		else if (l === 1)  // only one connector
			return Kekule.GeometryUtils.standardizeAngle(Math.PI + angles[0]);
		else  // more than two connectors
		{
			var max = 0;
			var index = 0;
			for (var i = 0; i < l; ++i)
			{
				var a1 = angles[i];
				var a2 = angles[(i + 1) % l];
				var delta = a2 - a1;
				if (delta < 0)
					delta += Math.PI * 2;
				if (delta > max)
				{
					max = delta;
					index = i;
				}
			}
			var result = angles[index] + max / 2;
			/* debug
			var msg = 'Angles: [';
			for (var i = 0; i < l; ++i)
				msg += (angles[i] * 180 / Math.PI) + ' '
			msg + ']';
			console.log(msg, result * 180 / Math.PI);
      */
			return result;
		}
	},
	/**
	 * Get the emptiest 2D direction around obj. Returns angle of that direction.
	 * @returns {Float}
	 * @private
	 */
	getMostEmptyDirection2DAngleOfObj: function(baseObj, excludeObjs, allowCoordBorrow, includeAttachedMarkers, includeUnexposedSiblings, avoidDirectionAngles)
	{
		var angles = Kekule.ChemStructureUtils._calcLinkedObj2DAnglesOfObj(baseObj, excludeObjs, allowCoordBorrow, includeAttachedMarkers, includeUnexposedSiblings);
		if (avoidDirectionAngles)
		{
			angles = angles.concat(avoidDirectionAngles);
			angles.sort();
		}
		var result = Kekule.ChemStructureUtils._getMostEmptyDirectionOfExistingAngles(angles);
		//console.log('angle', result * 180 / Math.PI, Math.cos(result), Math.sin(result));
		return result;
	},

	/**
	 * Check if two rings are the same. Param ring1/ring2 are object wth fields: {nodes, connectors}
	 * @param {Object} ring1
	 * @param {Object} ring2
	 * @returns {Bool}
	 */
	isSameRing: function(ring1, ring2)
	{
		if (ring1.nodes.length !== ring2.nodes.length)
			return false;
		if (ring1.connectors.length !== ring2.connectors.length)
			return false;
		if (AU.exclude(ring1.nodes, ring2.nodes).length > 0)
			return false;
		if (AU.exclude(ring1.connectors, ring2.connectors).length > 0)
			return false;
		return true;
	},

	/**
	 * Check if targetRing is in rings.
	 * @param {Object} targetRing
	 * @param {Array} rings
	 * @returns false;
	 */
	isInRings: function(targetRing, rings)
	{
		for (var i = 0, l = rings.length; i < l; ++i)
		{
			var ring = rings[i];
			if (targetRing === ring)
				return true;
			else if (Kekule.ChemStructureUtils.isSameRing(targetRing, ring))
				return true;
		}
		return false;
	},

	/**
	 * Guess and returns the implicit hydrogen count connected to an atom.
	 * @param {Int} atomicNum
	 * @param {Hash} params Additional params, may including fields {coValenceBondValenceSum, otherBondValenceSum, charge, radicalECount}
	 *  // Where allowNegative is a special flag, if true, when explicit bond order and hydrogen count too large, a negative value may be returned.
	 * @returns {Int}
	 */
	getImplicitHydrogenCount: function(atomicNum, params)
	{
		var p = Object.extend({coValenceBondValenceSum: 0, otherBondValenceSum: 0, charge: 0, radicalECount: 0}, params || {}, true);
		var valence = Kekule.ValenceUtils.getImplicitValence(atomicNum, p.charge, p.coValenceBondValenceSum);
		valence -= p.radicalECount;
		var result = valence - p.coValenceBondValenceSum - p.otherBondValenceSum;
		if (!p.allowNegative)
			result = Math.max(valence - p.coValenceBondValenceSum - p.otherBondValenceSum, 0);
		return result;
	}
};


/**
 * An abstract class to analysis and get tokens from text.
 * @augments ObjectEx
 * @class
 * @param {String} text Text to analysis.
 */
Kekule.TokenAnalyzer = Class.create(ObjectEx,
/** @lends Kekule.TokenAnalyzer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.TokenAnalyzer',
	/**
	 * @constructs
	 */
	initialize: function(/*$super, */text)
	{
		this.tryApplySuper('initialize')  /* $super() */;
		this.setSrcText(text);
	},
	/** @private */
	initProperties: function()
	{
		// private properties
		this.defineProp('srcText', {'dataType': DataType.STRING,
			'setter': function(value)
			{
				var v = value || '';
				this.setPropStoreFieldValue('srcText', v);
				this.setPropStoreFieldValue('srcLength', v.length);
				// this.setCurrPos(0);
			}
		});
		this.defineProp('srcLength', {'dataType': DataType.INT, 'setter': null, 'serializable': false})
		// this.defineProp('currPos', {'dataType': DataType.INT, 'serializable': false});
	},
	/**
	 * Returns type of char. Neighboring char with same type can be merged into a token.
	 * Descendants need to override this method.
	 * @param {String} c
	 * @returns {Variant}
	 * @private
	 */
	getCharType: function(c)
	{
		// do nothing here
		return 0;
	},
	/**
	 * Check if two char types are matched and can be merged into a token.
	 * Descendants may override this method.
	 * @param {Variant} currT
	 * @param {Variant} lastT
	 * @return {Bool}
	 */
	isCharTypeMatched: function(currT, lastT)
	{
		return currT === lastT;
	},
	/** @private */
	nextCharInfo: function(currPos)
	{
		var p = currPos; // this.getCurrPos();
		if (p >= this.getSrcLength())
			return null;
		else
		{
			var c = this.getSrcText().charAt(p);
			// this.setCurrPos(p + 1);
			return {'char': c, 'charType': this.getCharType(c)};
		}
	},
	/**
	 * Returns next token of srcText.
	 * @returns {Hash} {token, tokenType}
	 * @private
	 */
	nextTokenInfo: function(currPos)
	{
		var lastCharInfo = this.nextCharInfo(currPos);
		if (lastCharInfo)
		{
			var token = lastCharInfo['char'];  // .char will cause problem in YUI compressor
			var tokenType = lastCharInfo.charType;
			var tokenLength = token.length;
			var nextPos = currPos + tokenLength;
			var currCharInfo = this.nextCharInfo(nextPos);
			while (currCharInfo && this.isCharTypeMatched(currCharInfo.charType, lastCharInfo.charType))
			{
				nextPos += token.length;
				token += currCharInfo['char'];
				lastCharInfo = currCharInfo;
				currCharInfo = this.nextCharInfo(nextPos);
			}
			/*
			if (currCharInfo)  // now currCharInfo type is different from last, reverse a pos
				this.setCurrPos(this.getCurrPos() - 1);
			*/
			return {'token': token, 'tokenType': tokenType};
		}
		else
			return null;
	},
	/**
	 * Returns all token info in src text.
	 * @returns {Array} Each item is a hash of {token, tokenType}.
	 */
	getAllTokenInfos: function(startingPos)
	{
		var result = [];
		var currPos = startingPos || 0;
		var info = this.nextTokenInfo(currPos);
		while (info)
		{
			result.push(info);
			currPos += info.token.length;
			info = this.nextTokenInfo(currPos);
		}
		return result;
	}
});

/**
 * Enumeration of chem text token type.
 * @enum
 */
Kekule.ChemTextTypes = {
	// Chem text char types
	/** @private */
	CT_ATOM_SYMBOL_LEADING: 1,  // highercased alphabet, e.g. 'C' in 'Cu'
	/** @private */
	CT_ATOM_SYMBOL_FOLLOWING: 2,  // lowercased alphabet, e.g. 'u' in 'Cu'
	/** @private */
	CT_CHARGE_SYMBOL: 3,  // '+', '-'
	/** @private */
	CT_NUMBER: 4,
	/** @private */
	CT_BOND: 6,  // '-', '=', '#' etc.
	/** @private */
	CT_BRACKET_LEADING: 10,  // '(', '[' and '{'
	/** @private */
	CT_BRACKET_TAILING: 11,  // ')', ']' and '}'
	/** @private */
	CT_SEPARATOR: 20,  // space to separate texts
	/** @private */
	CT_UNKNOWN: 0,

	/** @private */
	CT_SUBGROUP: 101,
	CT_SINGLE_BOND_OR_NEGATIVE_CHARGE: 201,  // '-', as a single bond or negative charge?
};
var CT = Kekule.ChemTextTypes;

/**
 * A helper class to analysis chem text (e.g. formula).
 * @augments Kekule.TokenAnalyzer
 * @class
 * @param {String} text Text to analysis.
 */
Kekule.ChemTextAnalyzer = Class.create(Kekule.TokenAnalyzer,
/** @lends Kekule.ChemTextAnalyzer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemTextAnalyzer',
	/** @ignore */
	getCharType: function(c)
	{
		if (c === ' ')
			return CT.CT_SEPARATOR;
		if (c >= '0' && c <= '9')  // number
			return CT.CT_NUMBER;
		else if (['+', '-'].indexOf(c) >= 0)
			return CT.CT_CHARGE_SYMBOL;
		else if (['(', '[', '{'].indexOf(c) >= 0)
			return CT.CT_BRACKET_LEADING;
		else if ([')', ']', '}'].indexOf(c) >= 0)
			return CT.CT_BRACKET_TAILING;
		else if (c >= 'A' && c <= 'Z')
			return CT.CT_ATOM_SYMBOL_LEADING;
		else if (c >= 'a' && c <= 'z')
			return CT.CT_ATOM_SYMBOL_FOLLOWING;
		else
			return CT.CT_UNKNOWN;
	},
	/** @ignore */
	isCharTypeMatched: function(currT, lastT)
	{
		if (Kekule.ArrayUtils.intersect([CT.CT_BRACKET_LEADING, CT.CT_BRACKET_TAILING], [currT, lastT]).length)
			return false;
		else
			return (currT === lastT && lastT !== CT.CT_ATOM_SYMBOL_LEADING) ||
				(lastT === CT.CT_ATOM_SYMBOL_LEADING && currT === CT.CT_ATOM_SYMBOL_FOLLOWING);
	}
});

var BO = Kekule.BondOrder;

/**
 * A helper class to analysis chem text (e.g. formula).
 * @augments Kekule.ChemTextAnalyzer
 * @class
 *
 * @property {Array} subgroupItems Array of subgroup items, e.g., get from Kekule.Editor.RepositoryData.subgroups
 */
Kekule.CondensedFormulaTextAnalyzer = Class.create(Kekule.ChemTextAnalyzer,
/** @lends Kekule.CondensedFormulaTextAnalyzer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.CondensedFormulaTextAnalyzer',

	/** @private */
	initProperties: function()
	{
		// private properties
		this.defineProp('subgroupItems', {
			'dataType': DataType.ARRAY, serializable: false, scope: Class.PropertyScope.PRIVATE,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('subgroupItems', value);
				this.updateSubgroupItemDetails();
			}
		});
	},

	updateSubgroupItemDetails: function()
	{
		var subgroupItems = this.getSubgroupItems() || [];
		var subgroupItemDetails = [];
		for (var i = 0, l = subgroupItems.length; i < l; ++i)
		{
			var item = subgroupItems[i];
			var labelInfos = [];
			if (item.inputTexts)
			{
				for (var j = 0, jj = item.inputTexts.length; j < jj; ++j)
				{
					var inputTextInfo = this.getSubgroupInputTextInfo(item.inputTexts[j]);
					labelInfos.push(inputTextInfo);
				}
			}
			if (item.abbr)
			{
				labelInfos.push(this.getSubgroupInputTextInfo(item.abbr, true));
			}

			var detail = {
				subgroupItem: item,
				labelInfos: labelInfos
			};
			subgroupItemDetails.push(detail);
		}
		this._subgroupItemDetails = subgroupItemDetails;
	},

	/** @ignore */
	getCharType: function(c)
	{
		if (Kekule.CondensedFormulaUtils.SINGLE_BOND_OR_NEGATIVE_CHARGE_SYMBOLS.indexOf(c) >= 0)
			return CT.CT_SINGLE_BOND_OR_NEGATIVE_CHARGE;
		else if (c in Kekule.CondensedFormulaUtils.BOND_CHAR_MAP)
			return CT.CT_BOND;
		else
			return this.tryApplySuper('getCharType', [c]);
	},

	/** @ignore */
	isCharTypeMatched: function(currT, lastT)
	{
		if (currT.charType === CT.CT_SUBGROUP || lastT.charType === CT.CT_SUBGROUP)
			return false;
		else if (currT.charType === CT.CT_BOND || lastT.charType === CT.CT_BOND)
			return false;
		else if (currT.charType === CT.CT_SINGLE_BOND_OR_NEGATIVE_CHARGE || lastT.charType === CT.CT_SINGLE_BOND_OR_NEGATIVE_CHARGE)
			return false;
		else
			return this.tryApplySuper('isCharTypeMatched', [currT, lastT]);
	},
	/** @ignore */
	nextCharInfo: function(currPos)
	{
		return this.nextPossibleCharInfos(currPos)[0];
	},

	/** @ignore */
	nextTokenInfo: function()
	{
		return this.nextPossibleTokenInfos(currPos)[0];
	},

	/** @private */
	_isAmbiguousSubgroupText: function(text)
	{
		// CO has two possible parsing result, a C=O (e.g. MeCOMe, MeCOOEt) or C-O (e.g. Me3COH), where C=O is a repository group, we need to add C-O as two different tokens also
		// CHO also has the problem: e.g. MeCHO for C=O, CH2=CHOH for C-O
		// CH3 existed in repository, but we can also using atom to tokenize it
		// many other groups have the same problem
		// TODO: we may need a more accurate handle method for ambiguous subgroup
		// now simply return true
		return true;
		/*
		var ambiguousSubgroupTexts = [
			'CO', 'OC',
			'CHO', 'OHC',
			'CH3', 'H3C'
		];
		for (var i = 0, l = ambiguousSubgroupTexts.length; i < l; ++i)
		{
			var t = ambiguousSubgroupTexts[i];
			if (text.indexOf(t) >= 0)
				return true;
		}
		return false;
		*/
	},

	/** @pivate */
	nextPossibleCharInfos: function(currPos)
	{
		var p = currPos; // this.getCurrPos();
		if (p >= this.getSrcLength())
			return [];
		else
		{
			var srcText = this.getSrcText();
			var matchedSubgroupInfos = this.getMatchedSubgroupInfos(srcText, currPos, currPos === 0);
			if (matchedSubgroupInfos && matchedSubgroupInfos.length)
			{
				var result = [];
				var isAmbiguousSubgroup = false;
				for (var i = 0, l = matchedSubgroupInfos.length; i < l; ++i)
				{
					var info = matchedSubgroupInfos[i];
					result.push({'char': info.matchedText, 'subgroup': info.subgroup, 'charType': CT.CT_SUBGROUP, 'multipleEnabled': info.multipleEnabled});
					if (this._isAmbiguousSubgroupText(info.matchedText))
					{
						isAmbiguousSubgroup = true;
					}
				}

				if (isAmbiguousSubgroup)
				{
					result.push(this.tryApplySuper('nextCharInfo', [currPos]));
				}

				// sort by char length desc
				result.sort(function(a, b) {
					return -(a['char'].length - b['char'].length);
				});
				return result;
			}
			else
			{
				var charInfo = this.tryApplySuper('nextCharInfo', [currPos]);
				if (charInfo)
					return [charInfo];
				else
					return [];
			}
		}
	},
	/** @private */
	nextPossibleTokenInfos: function(currPos)
	{
		var possibleCharInfos = this.nextPossibleCharInfos(currPos);
		if (possibleCharInfos.length === 1 && possibleCharInfos[0].charType !== CT.CT_SUBGROUP)
		{
			// ordinary chars
			var tokenInfo = this.tryApplySuper('nextTokenInfo', [currPos]);
			return tokenInfo? [tokenInfo]: [];
		}
		else //if (possibleCharInfos.length >= 2 /*&& possibleCharInfos[0].charType === CT.CT_SUBGROUP*/)
		{
			// multiple possible subgroups
			var result = [];
			for (var i = 0, ii = possibleCharInfos.length; i < ii; ++i)
			{
				var charInfo = possibleCharInfos[i];
				if (charInfo.charType === CT.CT_SUBGROUP)
				{
					result.push({
						'token': charInfo['char'],
						'tokenType': charInfo.charType,
						'subgroup': charInfo.subgroup,
						// 'valences': charInfo.subgroup.valences || [1],
						'multipleEnabled': charInfo.multipleEnabled
					});
				}
				else
				{
					// not subgroup, may be an element symbol / number that can be merged with following chars
					var nextPos = currPos + charInfo['char'].length;
					var nextCharInfos = this.nextPossibleCharInfos(nextPos);
					for (var j = 0, jj = nextCharInfos.length; j < jj; ++j)
					{
						var currCharInfo = charInfo;
						var token = charInfo['char'];
						var tokenType = charInfo.charType;
						var nextCharInfo = nextCharInfos[j];
						while (nextCharInfo && this.isCharTypeMatched(nextCharInfo.charType, currCharInfo.charType))
						{
							nextPos += nextCharInfo['char'].length;
							token += nextCharInfo['char'];
							currCharInfo = nextCharInfo;
							nextCharInfo = this.nextCharInfo(nextPos);
						}
						result.push({
							'token': token, 'tokenType': tokenType
						});
					}
				}
			}
			return result;
		}
	},
	/** @private */
	getPossibleTokenInfoTree: function(startingPos)
	{
		var root = {isRoot: true};
		var currPos = startingPos || 0;
		this._fillPossibleTokenInfoTree(currPos, root);
		return root;
	},
	/** @private */
	_fillPossibleTokenInfoTree: function(startingPos, rootNode)
	{
		var currPos = startingPos || 0;
		var infos = this.nextPossibleTokenInfos(currPos);
		if (infos && infos.length)
		{
			rootNode._children = infos;
			for (var i = 0, l = infos.length; i < l; ++i)
			{
				this._fillPossibleTokenInfoTree(currPos + infos[i].token.length, infos[i]);
			}
		}
	},

	/** @private */
	getMatchedSubgroupInfos: function(text, startingPos, allowReversedText)
	{
		var subgroupItemDetails = this._subgroupItemDetails;
		if (!subgroupItemDetails || !subgroupItemDetails.length)
		{
			return [];
		}
		else
		{
			var result = [];
			for (var i = 0, ii = subgroupItemDetails.length; i < ii; ++i)
			{
				var currGroupChecked = false;
				var subgroupItem = subgroupItemDetails[i].subgroupItem;
				var subgroupItemDetail = subgroupItemDetails[i];
				if (subgroupItemDetail.labelInfos)
				{
					for (var j = 0, jj = subgroupItemDetail.labelInfos.length; j < jj; ++j)
					{
						var currLabels = [subgroupItemDetail.labelInfos[j].labelText];
						if (allowReversedText && subgroupItemDetail.labelInfos[j].reversed)
							currLabels.push(subgroupItemDetail.labelInfos[j].reversed);
						for (var k = 0, kk = currLabels.length; k < kk; ++k)
                        {
							if (text.substr(startingPos, currLabels[k].length) === currLabels[k])
							{
								result.push({
									'matchedText': currLabels[k],
									'subgroup': subgroupItem,
									// 'valences': subgroupItem.valences || [1],  // default valence is 1, connecting with one single bond
									'multipleEnabled': subgroupItemDetail.labelInfos[j].multipleEnabled
								});
								currGroupChecked = true;
								break;
							}
						}
						if (currGroupChecked)
							break;
					}
				}
			}
			return result;
		}
	},

	getSubgroupInputTextInfo: function(inputText, isAbbr)
	{
		var result = {
			labelText: inputText,
			reversable: false,
			sectionCount: 1,
			multipleEnabled: true
		};
		if (!isAbbr)
		{
			// convert inputText to formula, then reverse the formula section and get the output text
			try
			{
				var formula = Kekule.FormulaUtils.textToFormula(inputText);
				if (formula)
				{
					result.sectionCount = formula.getSectionCount();
					if (result.sectionCount > 1)
					{
						formula.reverseSections();
						result.reversable = true;
						result.reversed = Kekule.FormulaUtils.formulaToText(formula);
						result.multipleEnabled = false;
					}
					else
					{
						result.multipleEnabled = !(formula.getSectionAt(0).count > 1);
					}
				}
			}
			catch(e)
			{

			}
		}
		return result;
	}
});

/**
 * Util class to manipulate molecule formulas.
 * @class
 */
Kekule.FormulaUtils = {
	/**
	 * Nestable brackets used to display formula.
	 * @private
	 */
	FORMULA_BRACKETS: [['(', ')'], ['[', ']'], ['{', '}']],
	/** @private */
	FORMULA_BRACKET_TYPE_COUNT: 3,

	/**
	 * Symbols to represent bond, used for handle the incomingBondOrder field of formula section.
	 * @private
	 */
	BOND_SYMBOLS: [null, '-', '=', '𝄘'],

	getBondSymbol: function(bondOrder, bondType)
	{
		return FU.BOND_SYMBOLS[bondOrder] || '';
	},

	/**
	 * Create a formula object from plain text.
	 * @param {String} text
	 * @param {Kekule.ChemObject} parent Parent object of formula.
	 * @param {Kekule.MoleculeFormula} formula If this param is set, changes will be take on this object.
	 *   Otherwise a new instance of formula will be created and returned.
	 * @returns {Kekule.MoleculeFormula}
	 */
	textToFormula: function(text, parent, formula)
	{
		var result = formula || null;
		if (result)
		{
			result.clear();
		}
		var analyzer = new Kekule.ChemTextAnalyzer(text);
		try
		{
			var tokenInfos = analyzer.getAllTokenInfos();
			//console.log(tokenInfos);
			if (!result)
				result = new Kekule.MolecularFormula(parent);
			var tokenLength =  tokenInfos.length;
			if (tokenLength)
			{
				var currObj, currSection, lastTokenInfo = null, currCharge;
				var currFormula = result;
				currSection = {};

				var createNewSection = function()
				{
					currSection = {};
				};
				var wrapUpCurrSection = function()
				{
					if (currSection && currSection.obj)
						currFormula.appendSection(currSection.obj, currSection.count, currSection.charge);
				};

				// iterate through tokens
				for (var i = 0; i < tokenLength; ++i)
				{
					var tokenInfo = tokenInfos[i];
					var tokenType = tokenInfo.tokenType;
					var token = tokenInfo.token;
					var handled = false;   // mark if currToken is handled
					if (tokenType === CT.CT_BRACKET_LEADING)  // bracket, new layer
					{
						wrapUpCurrSection();
						var subFormula = new Kekule.MolecularFormula(parent);
						subFormula._parentFormula = currFormula;
						currFormula = subFormula;
						createNewSection();
						handled = true;
					}
					else if (tokenType === CT.CT_BRACKET_TAILING)
					{
						wrapUpCurrSection();
						createNewSection();
						currSection.obj = currFormula;
						currFormula = currFormula._parentFormula;
						tokenInfo.asSymbol = true;
						handled = true;
					}
					else if ([CT.CT_ATOM_SYMBOL_LEADING, CT.CT_ATOM_SYMBOL_FOLLOWING].indexOf(tokenType) >= 0)  // atom symbol
					{
						if (currSection.obj)
						{
							wrapUpCurrSection();
							createNewSection();
						}
						// TODO: currently only atom can be created
						var massNum = currSection.massNum;
						if (!massNum)  // check if lastToken is unhandled number, if so, it may be the mass num of current symbol
						{
							if (lastTokenInfo && !lastTokenInfo.handled && (lastTokenInfo.tokenType === CT.CT_NUMBER))
								massNum = parseInt(lastTokenInfo.token, 10) || null;
						}
						var slabel = '' + (massNum || '') + token;
						currSection.obj = Kekule.ChemStructureNodeFactory.createByLabel(slabel);
						//currSection.obj = new Kekule.Atom(null, token, massNum);
						tokenInfo.asSymbol = true;
						handled = true;
					}
					else if (tokenType === CT.CT_CHARGE_SYMBOL)
					{
						currCharge = (token === '+')? +1: -1;
						tokenInfo.asCharge = true;
						if (lastTokenInfo.tokenType === CT.CT_NUMBER)
						{
							var schargeCount;
							if (lastTokenInfo.asCount)
							{
								if (lastTokenInfo.token.length > 1)  // last digit should be charge
								{
									var t = lastTokenInfo.token;
									schargeCount = t.substr(t.length - 1);
									if (lastTokenInfo.asCount)
										currSection.count = parseInt(t.substring(0, t.length - 1), 10);
								}
								else
								{
									schargeCount = lastTokenInfo.token;
									if (lastTokenInfo.asCount)
										currSection.count = 1;
								}
							}
							else
							{
								schargeCount = lastTokenInfo.token;
								lastTokenInfo.asChargeCount = true;
							}
							currCharge *= parseInt(schargeCount, 10);
						}
						currSection.charge = currCharge;
						handled = true;
					}
					else if (tokenType === CT.CT_NUMBER)
					{
						var num = parseInt(token, 10);
						if (currCharge && lastTokenInfo.tokenType === CT.CT_CHARGE_SYMBOL && lastTokenInfo.asCharge)  // last token is charge
						{
							currCharge *= num;
							currSection.charge = currCharge;
							tokenInfo.asChargeCount = true;
							handled = true;
						}
						else if (currSection.obj && lastTokenInfo.asSymbol)  // atom symbol already set, number is count
						{
							currSection.count = num;
							tokenInfo.asCount = true;
							handled = true;
						}
						else if (!currSection.obj)  // symbol not set, this leading number should be the isotope number
						{
							currSection.massNum = num;
							handled = true;
						}
						else  // do not know the use of number, may be the mass num of next atom symbol
						{

						}
					}
					tokenInfo.handled = handled;
					lastTokenInfo = tokenInfo;
				}

				if (currSection && currSection.obj)
					wrapUpCurrSection();
			}
			// debug
			//var rt = result.getDisplayRichText();
			//console.log(Kekule.Render.RichTextUtils.toText(rt));
			return result;
		}
		finally
		{
			analyzer.finalize();
		}
	},

	/**
	 * Returns plain text generated by formula.
	 * @param {Kekule.MolculeFormula} formula
	 * @param {Bool} showCharge Whether display formula charge.
	 * @param {Int} partialChargeDecimalsLength
	 * @returns {String}
	 */
	formulaToText: function(formula, showCharge, partialChargeDecimalsLength)
	{
		/*
		var result = '';
		var sections = formula.getSections();
		*/
		/*
		var rt = Kekule.Render.ChemDisplayTextUtils.formulaToRichText(formula, true, true);
		var result = Kekule.Render.RichTextUtils.toText(rt);
		return result;
		*/
		if (Kekule.ObjUtils.isUnset(showCharge))
			showCharge = true;
		return FU._convFormulaToText(formula, false, showCharge, partialChargeDecimalsLength);
	},

	/** @private */
	_convFormulaToText: function(formula, showBracket, showCharge, partialChargeDecimalsLength)
	{
		var result = '';
		var sections = formula.getSections();
		if (showBracket)
		{
			var bracketIndex = formula.getMaxNestedLevel(true) % FU.FORMULA_BRACKET_TYPE_COUNT;
			var bracketStart =FU.FORMULA_BRACKETS[bracketIndex][0];
			var bracketEnd = FU.FORMULA_BRACKETS[bracketIndex][1];
			result += bracketStart;
		}
		for (var i = 0, l = sections.length; i < l; ++i)
		{
			var obj = sections[i].obj;
			var charge = formula.getSectionCharge(sections[i]);
			var subgroup = null;
			if (obj instanceof Kekule.MolecularFormula)  // a sub-formula
			{
				// TODO: sometimes bracket is unessential, such as SO42- and so on, need more judge here
				// now we use a special implicitSubgroup flag
				var implicitSubgroup = !!sections[i].implicitSubgroup;
				var showSectionBracket = !implicitSubgroup;
				subgroup = FU._convFormulaToText(obj, showSectionBracket, false, false, partialChargeDecimalsLength); // do not show charge right after, we will add it later
			}
			else if (obj.getLabel) // an atom/isotope
			{
				var subgroup = obj.getLabel();
				if (obj.getMassNumber && obj.getMassNumber())  // explicit mass number atom, add a separator before it
					subgroup = (result? ' ': '') + subgroup;
			}

			if (subgroup)
			{
				if (sections[i].incomingBondOrder)
				{
					var bondSymbol = FU.getBondSymbol(sections[i].incomingBondOrder);
					if (bondSymbol)
						subgroup = bondSymbol + subgroup;
				}
				var explicitCount = false;
				// count
				if (sections[i].count != 1)
				{
					subgroup += sections[i].count;
					explicitCount = true;
				}

				// charge is draw after count
				if (showCharge && charge)
				{
					var chargelabel = FU._convChargeToText(charge, partialChargeDecimalsLength);
					//chargelabel += chargeSign;
					subgroup += (explicitCount? ' ': '') + chargelabel;  // separate count and charge
				}

				result += subgroup;
			}
		}
		if (showBracket)
			result += bracketEnd;

		if (showCharge)
		{
			var charge = formula.getCharge();
			if (charge)
			{
				var chargelabel = FU._convChargeToText(charge, partialChargeDecimalsLength);
				result += chargelabel;
			}
		}

		return result;
	},
	/** @private */
	_convChargeToText: function(charge, partialChargeDecimalsLength)
	{
		if (!charge)
			return null;
		var chargeSign = (charge > 0)? '+': '-';
		var chargeAmount = Math.abs(charge);
		var chargelabel = chargeSign;
		if (chargeAmount != 1)
		{
			chargelabel = (partialChargeDecimalsLength? Kekule.NumUtils.toDecimals(chargeAmount, partialChargeDecimalsLength): chargeAmount.toString()) + chargeSign;
		}
		return chargelabel;
	},

	/**
	 * Compare two formula objects.
	 * @param {Kekule.MolculeFormula} formula1
	 * @param {Kekule.MolculeFormula} formula2
	 * @param {Hash} options
	 * @returns {Int}
	 */
	compareFormula(formula1, formula2, options) {
		var sections1 = [].concat(formula1.getSections() || []);
		var sections2 = [].concat(formula2.getSections() || []);
		// sort from large to small
		sections1.sort(function(s1, s2) {
			return -FU._compareFormulaSection(s1, s2, options);
		});
		sections2.sort(function(s1, s2) {
			return -FU._compareFormulaSection(s1, s2, options);
		});
		for (var i = 0, l = Math.min(sections1.length, sections2.length); i < l; ++i)
		{
			var result = FU._compareFormulaSection(sections1[i], sections2[i], options);
			if (result)
				return result;
		}
		var result = sections1.length - sections2.length;
		return (result > 0)? 1: (result < 0)? -1: 0;
	},

	/** @private */
	_compareFormulaSection(section1, section2, options) {
		var result = 0;
		var sectionObj1 = section1.obj;
		var sectionObj2 = section2.obj;
		if (sectionObj1 instanceof Kekule.MolecularFormula || sectionObj2 instanceof Kekule.MolecularFormula)
		{
			if (sectionObj1 instanceof Kekule.MolecularFormula && sectionObj2 instanceof Kekule.MolecularFormula)
			{
				result = FU.compareFormula(sectionObj1, sectionObj2, options);
			}
			else if (sectionObj1 instanceof Kekule.MolecularFormula)
			{
				// sectionObj2 is atom
				result = 1;
			}
			else if (sectionObj2 instanceof Kekule.MolecularFormula)
			{
				// sectionObj1 is atom
				result = -1;
			}
		}
		else
		{
			// both sectionObjs are atom
			result = sectionObj1.compare(sectionObj2, options);
			// console.log('compare atom result', sectionObj1.getSymbol(), sectionObj2.getSymbol(), result);
		}

		if (result === 0)
		{
			// need to further check count
			result = (section1.count || 1) - (section2.count || 1);
			result = (result > 0)? 1: (result < 0)? -1: 0;
		}

		return result;
	}
};

var FU = Kekule.FormulaUtils;

// extend MoleculeFormula class
ClassEx.defineProp(Kekule.MolecularFormula, 'text', {
	'dataType': DataType.STRING, 'serializable': false,
	'getter': function() { return FU.formulaToText(this); },
	'setter': function(value)
	{
		FU.textToFormula(value, this.getParent(), this);
	}
});

/**
 * Util class to manipulate condensed formula (e.g. EtOH, MeCOOH, PhCH2CH2COMe).
 * @class
 */
Kekule.CondensedFormulaUtils = {
	/**
	 * Nestable brackets used to display formula.
	 * @private
	 */
	FORMULA_BRACKETS: [['(', ')'], ['[', ']'], ['{', '}']],
	/** @private */
	FORMULA_BRACKET_TYPE_COUNT: 3,

	/** @private */
	BOND_CHAR_MAP: {
		'-': BO.SINGLE,
		'——': BO.SINGLE,
		'－': BO.SINGLE,
		'–': BO.SINGLE,
		'=': BO.DOUBLE,
		'＝': BO.DOUBLE,
		'#': BO.TRIPLE,
		'Ξ': BO.TRIPLE,
		'𝄘': BO.TRIPLE,
		'𝄙': BO.QUAD
	},
	/** @private */
	SINGLE_BOND_OR_NEGATIVE_CHARGE_SYMBOLS: ['-', '－', '–'],

	/**
	 * Parse the condensed formula text and generate concrete structure/molecule formula object representation.
	 * @param {String} text
	 * @param {Int} linkedBondOrder If need to create a subgroup, this indicating the order of bond linked to main structure. Otherwise, the order should be 0.
	 * @param {Array} subgroupItems	Repository subgroup items using for parsing the text.
	 * @param {Hash} options May have field {formula: bool, structure: bool(default true), structureClass: Class, atomSymbolWhitelist: []}.
	 * @returns {Kekule.StructureFragment}
	 */
	parse: function(text, linkedBondOrder, subgroupItems, options)
	{
		var op = Object.create(options || {});
		if (op.structure === undefined)
			op.structure = true;
		var createMolecule = !linkedBondOrder;
		if (createMolecule && !op.structureClass)
			op.structureClass = Kekule.Molecule;
		var outputStructure = op.structure;
		var outputFormula = op.formula;
		var outputRichText = op.richText;
		var outputStructUnits = op.structureUnits;

		var analyzer = new Kekule.CondensedFormulaTextAnalyzer(text);
		analyzer.setSubgroupItems(subgroupItems || []);
		try
		{
			var tokenInfoTreeRoot = analyzer.getPossibleTokenInfoTree();
			// the root should be an empty node, we iterate its children
			// var rootChildren = tokenInfoTreeRoot.getChildren();

			// iterate possible tree paths and form token list, try to generate structure from these token lists, if one structure is generated, just skip out
			var subgroupInfoMap = new Kekule.MapEx();
			var creationResult = this._fillFullPathTokenListsAndHandle(tokenInfoTreeRoot, [], function(tokenList) {
				try
				{
					var structUnitList = Kekule.CondensedFormulaUtils._convertTokenListToStructureUnitList(tokenList, op);
					if (structUnitList && structUnitList.length)
					{
						if (outputStructure)
						{
							var result = Kekule.CondensedFormulaUtils._createStructureFragFromUnitListEx(structUnitList, 0, linkedBondOrder, op, subgroupInfoMap);
							var fragment = result && result.frag;  // .frag is type of SubGroup
							if (fragment) {
								//if (!createMolecule)
								if (fragment.setAnchorNodes)
								{
									// mark the anchor node of fragment
									var anchorNodes = result.anchorNodes || result.anchorNodesLeading;
									fragment.setAnchorNodes(anchorNodes);
								}
								// creation successful, skip out
								return {success: true, result: {fragment: fragment, structureUnits: structUnitList}};
							}
						}
						else
						{
							// no need to create structure, we just return this structUnitList
							return {success: true, result: {structureUnits: structUnitList}};
						}
					}
				}
				catch(e)
				{
					// ignore creation errors
					// console.error(e);
				}
			});
			if (creationResult && creationResult.success)
			{
				// we successfully create a structure, now returns the final result;
				var result = {};
				if (outputStructure)
					result.structure = creationResult.result.fragment;
				if (outputStructUnits)
					result.structureUnits = creationResult.result.structureUnits;
				if (outputFormula)
				{
					var formula = Kekule.CondensedFormulaUtils._doCreateFormulaFromUnitList(creationResult.result.structureUnits, op, subgroupInfoMap);
					if (formula)
						result.formula = formula;
				}
				if (outputRichText)
				{
					var rt = Kekule.CondensedFormulaUtils._createRichTextLabelFromUnitList(creationResult.result.structureUnits, op, subgroupInfoMap);
					if (rt)
						result.richText = rt;
				}
				return result;
			}
			else
			{
				throw new Error(Kekule.$L('ErrorMsg.INVALID_CONDENSED_FORMULA_TEXT'));
			}
		}
		finally
		{
			analyzer.finalize();
		}
	},

	/**
	 * Convert condensed formula text to a structure fragment.
	 * @param {String} text
	 * @param {Int} linkedBondOrder If need to create a subgroup, this indicating the order of bond linked to main structure. Otherwise, the order should be 0.
	 * //@param {Kekule.StructureFragment} parent Parent of the newly created structure fragment. If a standalone molecule need to be created, parent should be set to null.
	 * @param {Array} subgroupItems	Repository subgroup items using for parsing the text.
	 * @param {Hash} options
	 * @returns {Kekule.StructureFragment}
	 */
	textToStructureFragment: function(text, linkedBondOrder, subgroupItems, options)
	{
		var op = Object.create(options || {});
		op.structure = true;  // ensure create the structure
		var parseResult = Kekule.CondensedFormulaUtils.parse(text, linkedBondOrder, subgroupItems, options);
		return parseResult && parseResult.structure;
	},

	_fillFullPathTokenListsAndHandle: function(startingTokenInfo, tokenList, handler)
	{
		var currTokenList = [].concat(tokenList);
		currTokenList.push(startingTokenInfo);
		var children = startingTokenInfo._children;
		if (children && children.length)
		{
			for (var i = 0, l = children.length; i < l; ++i)
			{
				var child = children[i];
				var handleResult = this._fillFullPathTokenListsAndHandle(child, currTokenList, handler);
				if (handleResult && handleResult.success === true)
					return handleResult;
			}
		}
		else
		{
			// no child, the leaf node, we can now do the handling
			// the handler returns {success: true, other} indicating the handle job is done, and no need to try other paths
			return handler(currTokenList);
		}
	},

	_loadSubgroup: function(subGroupItem)
	{
		var result = Kekule.IO.loadFormatData(subGroupItem.structData, subGroupItem.dataFormat || Kekule.IO.DataFormat.KEKULE_JSON);
		return result;
	},
	_getBondOrder: function(bondChar)
	{
		if (bondChar in Kekule.CondensedFormulaUtils.BOND_CHAR_MAP)
			return Kekule.CondensedFormulaUtils.BOND_CHAR_MAP[bondChar];
		else
			return 0;
	},

	_convertTokenListToStructureUnitList: function(tokenInfoList, options)
	{
		var result = [];
		var branchStack = [result];
		var currStructUnitInfo = null;
		var currStructure;

		var pushBranch = function()
		{
			var result = [];
			branchStack.push(result);
			return result;
		};
		var popBranch = function()
		{
			return branchStack.pop();
		};
		var getCurrBranch = function()
		{
			return branchStack[branchStack.length - 1];
		};

		var createNewUnit = function()
		{
			currStructUnitInfo = {tokenSeq: []};
			return currStructUnitInfo;
		};
		var getCurrUnit = function(canCreate)
		{
			var result = currStructUnitInfo;
			if (!result && canCreate)
				result = createNewUnit();
			return result;
		};
		var wrapUpCurrUnit = function(explicitEnd)
		{
			if (!currStructUnitInfo)
				return;
			if (currStructUnitInfo.structType)
			{
				if (explicitEnd && currStructUnitInfo.structType === 'atom' && currStructUnitInfo.possibleNegativeCharge && currStructUnitInfo.tokenSeq[currStructUnitInfo.tokenSeq.length - 1] === CT.CT_SINGLE_BOND_OR_NEGATIVE_CHARGE)
				{
					// an explicity ending unit, last char is '-', then it is a negative charge
					delete currStructUnitInfo.possibleNegativeCharge;
					currStructUnitInfo.chargeSignal = -1;
					currStructUnitInfo.tokenSeq[currStructUnitInfo.tokenSeq.length - 1] = CT.CT_CHARGE_SYMBOL;
				}

				var currBranch = getCurrBranch();
				// try merge tailing atom units with H
				var handled = false;
				if (currStructUnitInfo.structType === 'atom')
				{
					var mergedUnit = tryMergeHAtomUnit(currStructUnitInfo, currBranch[currBranch.length - 1]);
					if (mergedUnit)
					{
						currBranch[currBranch.length - 1] = mergedUnit;
						handled = true;
					}
				}
				if (!handled)
				{
					currBranch.push(currStructUnitInfo);
				}
				// force to create new unit
				currStructUnitInfo = null;
			}
			else
			{
				// can not wrap up, throw error
				throw new Error('Can not wrap up current structure unit');
			}
		};
		var wrapUpCurrIfFulfillable = function()
		{
			if (!currStructUnitInfo)
				return;
			if (isUnitFulfillable(currStructUnitInfo))
				wrapUpCurrUnit();
		};
		var isUnitFulfillable = function(unitInfo)
		{
			if (unitInfo.structType === 'subgroup')
				return true;
			else if (unitInfo.structType === 'atom')
				return unitInfo.atomSymbol;
			else if (unitInfo.structType === 'branch')
				return unitInfo.branch && unitInfo.branch.length;
			else
				return false;
		};

		var tryMergeHAtomUnit = function(currUnit, prevUnit)
		{
			var result = null;
			if (currUnit && prevUnit &&currUnit.structType === 'atom' && prevUnit.structType === 'atom')
			{
				var atomUnitH, atomUnitNonH, order;
				// we may merge something like CH2, OH, etc. into one structure unit, H as HCount
				if (currUnit.atomSymbol === 'H' && prevUnit.atomSymbol !== 'H')
				{
					atomUnitH = currUnit;
					atomUnitNonH = prevUnit;
					order = 1;
				}
				else if (currUnit.atomSymbol !== 'H' && prevUnit.atomSymbol === 'H')
				{
					atomUnitH = prevUnit;
					atomUnitNonH = currUnit;
					order = -1;
				}
				if (atomUnitH && atomUnitNonH)
				{
					if (atomUnitNonH.hCount === undefined && !atomUnitH.incomingBondOrder && !atomUnitH.chargeSignal &&!atomUnitH.massNum)
					{
						// do the merge
						atomUnitNonH.hCount = atomUnitH.count || 1;
						atomUnitNonH.hOrder = order;  // record in the original text, H is before or after non-H atom, useful when converting to formula
						result = atomUnitNonH;
						// copy the tokenSeq from atomUnitH to atomUnitNonH
						if (order > 0)
							result.tokenSeq = atomUnitNonH.tokenSeq.concat(atomUnitH.tokenSeq);
						else
							result.tokenSeq = atomUnitH.tokenSeq.concat(atomUnitNonH.tokenSeq);
					}
				}
			}
			return result;
		}

		var concreteTokenInfoList = tokenInfoList;
		if (tokenInfoList[0] && tokenInfoList[0].isRoot)
		{
			// leading is the root of original token tree,
			// since the root does not represent a chem structure, we need to remove it
			concreteTokenInfoList = tokenInfoList.slice(1);
		}

		for (var i = 0, l = concreteTokenInfoList.length; i < l; ++i)
		{
			var tokenInfo = concreteTokenInfoList[i];
			var tokenType = tokenInfo.tokenType;

			// special handle of CT_SINGLE_BOND_OR_NEGATIVE_CHARGE
			if (tokenType === CT.CT_SINGLE_BOND_OR_NEGATIVE_CHARGE)
			{
				if (!currStructUnitInfo)
				{
					// no leading struct unit, then - will surely be an incoming bond
					tokenType = CT.CT_BOND;
				}
				else if (currStructUnitInfo.chargeSignal > 0)
				{
					// already has a positive charge, then - will surely be an incoming bond
					tokenType = CT.CT_BOND;
				}
			}

			if (tokenType === CT.CT_SEPARATOR)
			{
				wrapUpCurrUnit(true);
			}
			else if (tokenType === CT.CT_SINGLE_BOND_OR_NEGATIVE_CHARGE)
			{
				// since the single bond is the default bonding type, we only need to handle the charge possibility
				var unitInfo = getCurrUnit(false);
				if (unitInfo && isUnitFulfillable(unitInfo))
				{
					unitInfo.possibleNegativeCharge = true;
					unitInfo.tokenSeq.push(CT.CT_SINGLE_BOND_OR_NEGATIVE_CHARGE);
				}
				else
					throw new Error('Invalid negative charge symbol');
			}
			else if (tokenType === CT.CT_BOND)
			{
				var bondOrder = Kekule.CondensedFormulaUtils._getBondOrder(tokenInfo.token);
				if (bondOrder <= 0)
					throw new Error('Invalid bond char: ' + tokenInfo.token);
				else
				{
					// mark the outgoing bond of prev unit, this information is not used currently
					var unitInfo = getCurrUnit(false);
					if (unitInfo && isUnitFulfillable(unitInfo))
					{
						unitInfo.outgoingBondOrder = bondOrder;
					}

					// incoming bond char must be at the beginning of a unit
					wrapUpCurrUnit(true);
					unitInfo = getCurrUnit(true);
					unitInfo.incomingBondOrder = bondOrder;
					unitInfo.tokenSeq.push(CT.CT_BOND);
				}
			}
			else if (tokenType === CT.CT_BRACKET_LEADING)  // bracket, new branch
			{
				wrapUpCurrUnit(true);
				var branch = pushBranch();
			}
			else if (tokenType === CT.CT_BRACKET_TAILING)
			{
				wrapUpCurrUnit(true);
				var branch = popBranch();
				var unitInfo = getCurrUnit(true);
				unitInfo.branch = branch;
				unitInfo.structType = 'branch';
				unitInfo.multipleEnabled = true;
				// check the first unit of branch, if it has incoming bond order, this should be the order of whole branch
				if (branch.length && branch[0].incomingBondOrder)
				{
					unitInfo.incomingBondOrder = branch[0].incomingBondOrder;
				}
			}
			else if (tokenType === CT.CT_SUBGROUP)
			{
				var unitInfo = getCurrUnit(false);
				if (unitInfo)
				{
					if (isUnitFulfillable(unitInfo))
						wrapUpCurrUnit();
					else if (!(unitInfo.tokenSeq.length === 1 && unitInfo.incomingBondOrder))
					{
						// already has unit more than an incoming bond, throw error
						throw new Error('Invalid structure format before a subgroup');
					}
				}

				unitInfo = getCurrUnit(true);
				unitInfo.originTokenInfo = tokenInfo; // record the original token, for storing in subgroup structure map
				unitInfo.subgroup = tokenInfo.subgroup;
				unitInfo.multipleEnabled = tokenInfo.multipleEnabled;
				unitInfo.text = tokenInfo.token;
				unitInfo.valences = tokenInfo.subgroup.valences || [1];  // default valence is 1, connecting with one single bond
				unitInfo.structType = 'subgroup';
				unitInfo.tokenSeq.push(CT.CT_SUBGROUP);
			}
			else if ([CT.CT_ATOM_SYMBOL_LEADING, CT.CT_ATOM_SYMBOL_FOLLOWING].indexOf(tokenType) >= 0)  // atom symbol
			{
				wrapUpCurrIfFulfillable();
				var atomSymbol = tokenInfo.token;
				/*
				if (atomSymbol === 'H')
				{
					// hydrogen atom (but not D), may attach to other atom as explicit/implicit hydrogen
					if (!currStructUnitInfo)
						currStructUnitInfo = {};
					currStructUnitInfo.attachHydrogens = true;
				}
				*/
				var unitInfo = getCurrUnit(true);
				unitInfo.structType = 'atom';

				// check if the atom symbol is in white list
				if (options.atomSymbolWhitelist && options.atomSymbolWhitelist.length)
				{
					if (options.atomSymbolWhitelist.indexOf(atomSymbol) < 0)
						throw new Error(Kekule.$L('ErrorMsg.ATOM_SYMBOL_NOT_IN_CONDENSED_FORMULA_WHITELIST').replaceAll('{0}', atomSymbol));
				}

				// check of the atom symbol is correct
				if (!Kekule.IsotopesDataUtil.getIsotopeId(atomSymbol))
				{
					throw new Error(Kekule.$L('ErrorMsg.INVALID_CHEMELEMENT'));
				}

				unitInfo.atomSymbol = atomSymbol;  // TODO: handle D, T?
				unitInfo.multipleEnabled = true;
				unitInfo.text = tokenInfo.token;

				if (unitInfo.prefixNumber)
				{
					// number before atom symbol, should be a mass number
					unitInfo.massNum = unitInfo.prefixNumber;
					delete unitInfo.prefixNumber;
				}

				unitInfo.tokenSeq.push(CT.CT_ATOM_SYMBOL_LEADING);
			}
			else if (tokenType === CT.CT_CHARGE_SYMBOL)
			{
				var unitInfo = getCurrUnit(false);
				if (!unitInfo || unitInfo.structType !== 'atom')
				{
					// charge can not set on subgroup, or unfulfilled struct unit
					throw new Error('Charge must be attached to atom');
				}
				var chargeSignal = (tokenInfo.token === '+')? +1: -1;
				unitInfo.chargeSignal = chargeSignal;
				unitInfo.tokenSeq.push(CT.CT_CHARGE_SYMBOL);
			}
			else if (tokenType === CT.CT_NUMBER)
			{
				var num = parseInt(tokenInfo.token, 10);
				var unitInfo = getCurrUnit(true);
				if (unitInfo.tokenSeq[unitInfo.tokenSeq.length - 1] === CT.CT_CHARGE_SYMBOL)  // last token is charge
				{
					unitInfo.chargeMultiple = num;
				}
				else if (unitInfo.tokenSeq[unitInfo.tokenSeq.length - 1] === CT.CT_SINGLE_BOND_OR_NEGATIVE_CHARGE) // surely the prev '-' is a charge mark
				{
					unitInfo.tokenSeq[unitInfo.tokenSeq.length - 1] = CT.CT_CHARGE_SYMBOL;
					unitInfo.chargeMultiple = num;
					unitInfo.chargeSignal = -1;
					delete unitInfo.possibleNegativeCharge;
				}
				else if (isUnitFulfillable(unitInfo))
				{
					if (unitInfo.multipleEnabled /* && getCurrBranch().length > 0*/) // atom symbol or subgroup already set /*, and not the first subgroup/atom of list, (e.g. Me3CH) */ number is count
						unitInfo.count = num;
					else  // should be next prefix
					{
						wrapUpCurrUnit();
						var newUnitInfo = getCurrUnit(true);
						newUnitInfo.prefixNumber = num;
					}
				}
				else if (!unitInfo.structType)  // symbol/subgroup not set, this leading number should be the isotope number?
				{
					unitInfo.prefixNumber = num;
				}
				else  // do not know the use of number
				{
					throw new Error('Unknown number usage');
				}
			}
		}
		wrapUpCurrUnit();  // the tailing unit

		return result;
	},

	_createStructureFragFromUnitListEx: function(structUnitList, incomingBondCount, incomingBondOrder, options, subgroupInfoMap)
	{
		var creationResult = Kekule.CondensedFormulaUtils._doCreateStructureFragFromUnitListEx(structUnitList, incomingBondCount, incomingBondOrder, options, subgroupInfoMap);
		var createdAtomInfos = creationResult.createdAtomInfos;
		var createdFragExs = creationResult.createdFragExs;
		var fragment = creationResult.frag;

		// check atom h count
		var anchorNodes = creationResult.anchorNodes || [];
		for (var i = 0, l = createdAtomInfos.length; i < l; ++i)
		{
			var atom = createdAtomInfos[i].atom;
			var structUnit = createdAtomInfos[i].structUnit;
			var hCount = structUnit.hCount || 0;
			// if hCount not matched with implicit hydrogen count, set explicit
			var implicitHCount = atom.getImplicitHydrogenCount();
			if (atom === anchorNodes[0])
			{
				// is the anchor nodes linked to external molecule, should consider the incomingBondOrder when calculate hCount
				implicitHCount -= (incomingBondOrder || 0);
			}
			var failed = implicitHCount !== hCount;
			if (failed && structUnit.possibleNegativeCharge)
			{
				// may the different is caused by charge, set charge and recheck
				atom.setCharge(-1 * (structUnit.chargeMultiple || 1));
				implicitHCount = atom.getImplicitHydrogenCount();
				failed = implicitHCount !== hCount;
				if (failed)
				{
					// restore
					atom.setCharge(0);
				}
				else
				{
					structUnit.chargeSignal = -1;
					delete structUnit.possibleNegativeCharge;
				}
			}
			if (failed)
			{
				if (options.enableExplicitHydrogen)
					atom.setExplicitHydrogenCount(hCount);
				else
				{
					throw new Error('Wrong hydrogen count, expect ' + implicitHCount + ' , but got ' + hCount);
					return null;
				}
			}
		}

		// do the final validation
		// check subgroup and anchor node valences
		for (var i = 0, l = createdFragExs.length; i < l; ++i)
		{
			var structNodeResult = createdFragExs[i];
			var structUnit = createdFragExs[i].structUnit;
			if (structUnit.structType === 'subgroup' || structUnit === 'branch')  // StructFragment created
			{
				if (!options.ignoreSubgroupValence)
				{
					//var frag = structNodeResult.frag;
					//frag.crossConnectors();
					var availValences = structUnit.valences || [1];
					var externalBondOrder = structNodeResult.externalBondOrder;
					if (availValences.indexOf(externalBondOrder) < 0)  // subgroup valence not matched, structure is abnormal
					{
						throw new Error('Wrong subgroup valence, expect ' + availValences.join(',') + ' , but got ' + externalBondOrder);
						return null;
					}
				}
			}
			else if (structUnit.structType === 'atom')
			{
				var atomCheckFailed = false;
				var atom = structNodeResult.frag;
				var currValence = atom.getValence();
				var charge = atom.getCharge() || 0;
				var valenceInfo = Kekule.ValenceUtils.getPossibleMdlValenceInfo(atom.getAtomicNumber(), charge);
				var possibleValences;
				if (valenceInfo && valenceInfo.valences && !valenceInfo.unexpectedCharge)  // if abnormal charge is meet, we can not determinate the valence precisely, just ignore here
				{
					possibleValences = [].concat(valenceInfo.valences || []);
				}
				if (possibleValences.length && possibleValences.indexOf(currValence) < 0)  // current is abnormal, this structure should not exists
					atomCheckFailed = true;

				// if the above check is failed and atom may have a negative charge, we can try to check again
				if (atomCheckFailed && structUnit.possibleNegativeCharge)
				{
					var charge = -1 * (structUnit.chargeMultiple || 1);
					var valenceInfo = Kekule.ValenceUtils.getPossibleMdlValenceInfo(atom.getAtomicNumber(), charge);
					if (valenceInfo.valences.indexOf(currValence) >= 0)
					{
						// passed, now we can set the charge
						atom.setCharge(charge);
						atomCheckFailed = false;
					}
				}

				if (atomCheckFailed && !options.ignoreAtomValence)
				{
					throw new Error('Wrong atom valence, expect ' + possibleValences.join(',') + ' , but got ' + currValence);
					return null;
				}
			}
		}

		// after the validation, flatten the structure
		fragment.unmarshalAllSubFragments(true);

		// and marks the anchorNodes
		if (incomingBondOrder > 0 && anchorNodes.length)
		{
			//fragment.setAnchorNodes(anchorNodes);
			for (var i = 0, l = anchorNodes.length; i < l; ++i)
			{
				anchorNodes[i].setIsAnchor(true);
			}
		}

		return {
			frag: fragment,
			anchorNodesLeading: creationResult.anchorNodesLeading, anchorNodesTailing: creationResult.anchorNodesTailing,
			anchorNodes: creationResult.anchorNodes || creationResult.anchorNodesLeading,
		};
	},

	_doCreateStructureFragFromUnitListEx: function(structUnitList, incomingBondCount, incomingBondOrder, options, subgroupInfoMap)
	{
		var createStructNodeEx = Kekule.CondensedFormulaUtils._doCreateStructNodeFromUnitEx;

		var connectWithBond = function(currFragEx, prevFragEx, bondOrder, parent, anchorNodeList, prevFragExUsingTailingAnchor)
		{
			var prevAnchorNodes = (prevFragExUsingTailingAnchor? prevFragEx.anchorNodesTailing: prevFragEx.anchorNodesLeading) || prevFragEx.anchorNodes;
			var currAnchorNodes = currFragEx.anchorNodes || currFragEx.anchorNodesLeading;
			var prevAnchorNode = prevAnchorNodes[prevFragEx.externalBondCount % prevAnchorNodes.length];
			var currAnchorNode = currAnchorNodes[currFragEx.externalBondCount % currAnchorNodes.length];
			var bond = new Kekule.Bond(null, [prevAnchorNode, currAnchorNode], bondOrder);
			parent.appendConnector(bond);
			// bond.setConnectedObjs([prevAnchorNode, currAnchorNode]);
			prevFragEx.externalBondOrder += bondOrder;
			currFragEx.externalBondOrder += bondOrder;
			++prevFragEx.externalBondCount;
			++currFragEx.externalBondCount;
			if (anchorNodeList.indexOf(currAnchorNode) < 0)
				anchorNodeList.push(currAnchorNode);
			if (anchorNodeList.indexOf(prevAnchorNode) < 0)
				anchorNodeList.push(prevAnchorNode);
		};

		var markChildNotApplicableForAutoRefLength = function(structFrag)
		{
			// TODO: we simply use visible to do the flag
			for (var i = 0, l = structFrag.getChildCount(); i < l; ++i)
			{
				var child = structFrag.getChildAt(i);
				if (child instanceof Kekule.StructureFragment)
				{
					markChildNotApplicableForAutoRefLength(child);
					child.setVisible(false);
				}
				else if (child instanceof Kekule.ChemStructureNode || child instanceof Kekule.ChemStructureConnector)
				{
					child.setVisible(false);
				}
			}
		};

		var op = Object.create(options || {});
		//result = op.createMolecule? new Kekule.Molecule(): new Kekule.SubGroup();
		var fragClass = op.structureClass || Kekule.SubGroup;
		var result = new fragClass();

		// the nested creation process should always create child subgroup
		op.createMolecule = false;

		// var groupAnchorNodes, groupIncomingBondOrder;
		var prevFragEx = null;
		var createdAtomInfos = [];
		var anchorNodes = [];
		var createdFragExs = [];
		var pendingFragExs = [];  // structure fragment has not been connected to main structure, e.g. Me3CH, before creating the C atom, Me3 could not create a linking bond
		var possibleGroupAnchorSeq = [];
		for (var i = 0, l = structUnitList.length; i < l; ++i)
		{
			var currExternalBondCount = (i === 0)? incomingBondCount: 0;
			var currExternalBondOrder = (i === 0)? incomingBondOrder: 0;
			var structUnit = structUnitList[i];
			var count = structUnit.count || 1;
			var structNodeResult;
			for (var j = 0; j < count; ++j)
			{
				structNodeResult = createStructNodeEx(structUnit, currExternalBondCount, currExternalBondOrder, options, subgroupInfoMap);
				if (!structNodeResult)  //abnormal
					return null;
				structNodeResult.structUnit = structUnit;
				createdAtomInfos = createdAtomInfos.concat(structNodeResult.createdAtomInfos || []);
				result.appendNode(structNodeResult.frag);
				if (prevFragEx)
				{
					// using bond to link prev frag and current frag
					var bondOrder = structUnit.incomingBondOrder || 1;
					/*
					var prevAnchorNode = prevFragEx.anchorNodes[prevFragEx.externalBondCount % prevFragEx.anchorNodes.length];
					var currAnchorNode = structNodeResult.anchorNodes[structNodeResult.externalBondCount % structNodeResult.anchorNodes.length];
					var bond = new Kekule.Bond(null, [prevAnchorNode, currAnchorNode], bondOrder);
					result.appendConnector(bond);
					// bond.setConnectedObjs([prevAnchorNode, currAnchorNode]);
					prevFragEx.externalBondOrder += bondOrder;
					structNodeResult.externalBondOrder += bondOrder;
					++prevFragEx.externalBondCount;
					++structNodeResult.externalBondCount;
					if (anchorNodes.indexOf(currAnchorNode) < 0)
						anchorNodes.push(currAnchorNode);
					if (anchorNodes.indexOf(prevAnchorNode) < 0)
						anchorNodes.push(prevAnchorNode);
					*/
					connectWithBond(structNodeResult, prevFragEx, bondOrder, result, anchorNodes);
				}
				else
				{
					// no prev frag to connect, add to pending list
					pendingFragExs.push(structNodeResult);
				}
				createdFragExs.push(structNodeResult);
			}

			// the first single unit should be the starting point of whole structure
			if (count === 1 && structUnit.structType !== 'branch' && structNodeResult)
			{
				possibleGroupAnchorSeq.push(structNodeResult.anchorNodes);
				//groupAnchorNodes = structNodeResult.anchorNodes;
			}

			if (count === 1 && pendingFragExs && structUnit.structType !== 'branch')
			{
				// if this is a single struct frag, and there are previous pending frags, try to connect them
				for (var k = 0, kk = pendingFragExs.length; k < kk; ++k)
				{
					var bondOrder = structUnit.incomingBondOrder || 1;
					var pendingFragEx = pendingFragExs[k];
					if (pendingFragEx !== structNodeResult)
					{
						// connect the tailing of pending frag with current frag
						connectWithBond(structNodeResult, pendingFragEx, bondOrder, result, anchorNodes, true);
					}
				}
				pendingFragExs = [];

				prevFragEx = structNodeResult;
			}

			/*
			if (count === 1 && structUnit.structType !== 'branch' && structNodeResult)
				prevFragEx = structNodeResult;
			*/
		}

		// since we do not consider the coords of atoms in the struct frag generation, mark all connectors/nodes as not usable in auto ref length calculation
		if (result)
			markChildNotApplicableForAutoRefLength(result);

		return {
			frag: result,
			anchorNodes: possibleGroupAnchorSeq[0],
			anchorNodesLeading: possibleGroupAnchorSeq[0], anchorNodesTailing: possibleGroupAnchorSeq[possibleGroupAnchorSeq.length - 1],
			createdFragExs: createdFragExs, createdAtomInfos: createdAtomInfos
		};
	},
	_doCreateStructNodeFromUnitEx: function(structUnit, incomingBondCount, incomingBondOrder, options, subgroupInfoMap)
	{
		var result;
		if (structUnit.structType === 'branch')
		{
			result = Kekule.CondensedFormulaUtils._doCreateStructureFragFromUnitListEx(structUnit.branch, incomingBondCount, incomingBondOrder, options, subgroupInfoMap);
			if (!result)  // abnormal
				return null;

		}
		else if (structUnit.structType === 'subgroup')
		{
            var srcFrag = subgroupInfoMap.get(structUnit);
            if (!srcFrag)
            {
                srcFrag = Kekule.CondensedFormulaUtils._loadSubgroup(structUnit.subgroup);
                subgroupInfoMap.set(structUnit, srcFrag);
            }
			var frag = srcFrag.clone();
			var anchorNodes = frag.getAnchorNodes();
			if (!anchorNodes || !anchorNodes.length && frag.getNodeCount())
				anchorNodes = [frag.getNodes()[0]];
			result = {frag: frag, anchorNodes: [].concat(anchorNodes || [])};
		}
		else if (structUnit.structType === 'atom')
		{
			var atom = new Kekule.Atom(null, structUnit.atomSymbol, structUnit.massNum);
			if (structUnit.chargeSignal)
			{
				atom.setCharge(structUnit.chargeSignal * (structUnit.chargeMultiple || 1));
			}

			result = {frag: atom, anchorNodes: [atom], createdAtomInfos: [{atom: atom, structUnit: structUnit}]}
		}
		result.externalBondCount = incomingBondCount;
		result.externalBondOrder = incomingBondOrder;
		// result.frag.__structUnit__ = structUnit;  // stores the original struct unit
		return result;
	},

	_createFormulaFromUnitList: function(structUnitList, options, subgroupInfoMap)
	{
		return Kekule.CondensedFormulaUtils._doCreateFormulaFromUnitList(structUnitList, options, subgroupInfoMap);
	},
	_doCreateFormulaFromUnitList: function(structUnitList, options, subgroupInfoMap)
	{
		var result = new Kekule.MolecularFormula();
		for (var i = 0, l = structUnitList.length; i < l; ++i)
		{
			var subObj = null;
			var structUnit = structUnitList[i];
			if (structUnit.structType === 'branch')
			{
				// create sub formula
				subObj = Kekule.CondensedFormulaUtils._doCreateFormulaFromUnitList(structUnit.branch, options, subgroupInfoMap);
			}
			else if (structUnit.structType === 'subgroup')
			{
				subObj = Kekule.FormulaUtils.textToFormula(structUnit.text);
			}
			else if (structUnit.structType === 'atom')
			{
				var fragResult = Kekule.CondensedFormulaUtils._doCreateStructNodeFromUnitEx(structUnit, 0, 0, options, subgroupInfoMap);
				subObj = fragResult && fragResult.frag;  // get the concrete atom object
			}
			if (subObj)
			{
				var hAtom = null;
				if (structUnit.hCount)  // has attached hydrogen
				{
					hAtom = new Kekule.Atom(null, 1);
				}
				if (hAtom && structUnit.hOrder < 0)
					result.appendSection(hAtom, structUnit.hCount, 0);
				var section = result.appendSection(subObj, structUnit.count || 1, (structUnit.chargeSignal || 0) * (structUnit.chargeMultiple || 1));
				if (structUnit.structType === 'subgroup')
					section.implicitSubgroup = true;
				if (structUnit.incomingBondOrder && structUnit.incomingBondOrder > BO.SINGLE)
					section.incomingBondOrder = structUnit.incomingBondOrder;
				if (hAtom && structUnit.hOrder > 0)
					result.appendSection(hAtom, structUnit.hCount, 0);
			}
		}

		return result;
	},

	_createRichTextLabelFromUnitList: function(structUnitList, options, subgroupInfoMap)
	{
		return Kekule.CondensedFormulaUtils._doCreateRichTextLabelFromUnitListEx(structUnitList, options, subgroupInfoMap).richText;
	},
	_doCreateRichTextLabelFromUnitListEx: function(structUnitList, options, subgroupInfoMap)
	{
		if (!Kekule.Render || !Kekule.Render.RichTextUtils)
			return null;

		var hAtom = new Kekule.Atom(null, 1);  // used for attached hCoutn
		var maxBranchLevel = 0;

		var resultRt = Kekule.Render.RichTextUtils.create();
		for (var i = 0, l = structUnitList.length; i < l; ++i)
		{
			var RTU = Kekule.Render.RichTextUtils;
			var subRts = [];
			var structUnit = structUnitList[i];
			if (structUnit.structType === 'branch')
			{
				var subRt = RTU.createGroup('group', {'charDirection': Kekule.Render.TextDirection.LTR});
				// create sub rich text
				var branchResult = Kekule.CondensedFormulaUtils._doCreateRichTextLabelFromUnitListEx(structUnit.branch, options, subgroupInfoMap);
				RTU.append(subRt, branchResult.richText);
				// var subRt = branchResult.richText;
				var insideBranchLevel = branchResult.maxBranchLevel;
				if (maxBranchLevel < insideBranchLevel + 1)
					maxBranchLevel = insideBranchLevel + 1;

				// surround it with bracket
				var bracketPairs = Kekule.CondensedFormulaUtils.FORMULA_BRACKETS;
				var bracketPair = bracketPairs[insideBranchLevel % bracketPairs.length];
				RTU.insertText(subRt, 0, bracketPair[0], {_noAnchor: true}, false);
				RTU.appendText(subRt, bracketPair[1], {_noAnchor: true}, false);
				//subRt._noAnchor = true;
				subRts.push(subRt);
			}
			else if (structUnit.structType === 'subgroup')
			{
				var subRt = null;
				var subgroup = subgroupInfoMap.get(structUnit);
				var textIsPlain = false;
				if (subgroup)
				{
					textIsPlain = (subgroup.formulaText !== structUnit.text) && (subgroup.abbr === structUnit.text);
				}
				else
				{
					textIsPlain = !structUnit.text.match(/.+\d/);  // has number in text, may be formula
				}
				if (!textIsPlain)  // has number in text, may be formula
				{
					var formula = Kekule.FormulaUtils.textToFormula(structUnit.text);
					subRt = Kekule.Render.ChemDisplayTextUtils.formulaToRichText(formula, true);
				}
				else   // can use plain text
				{
					subRt = RTU.strToRichText(structUnit.text, {'charDirection': Kekule.Render.TextDirection.LTR});
				}
				subRts.push(subRt);
			}
			else if (structUnit.structType === 'atom')
			{
				var fragResult = Kekule.CondensedFormulaUtils._doCreateStructNodeFromUnitEx(structUnit, 0, 0, options, null);
				var atom = fragResult && fragResult.frag;  // get the concrete atom object

				if (atom)
				{
					var formula = new Kekule.MolecularFormula();
					// get the Hx part
					var hPart = null;
					if (structUnit.hCount) {
						formula.appendSection(hAtom, structUnit.hCount, 0);
						hPart = Kekule.Render.ChemDisplayTextUtils.formulaToRichText(formula, true);
					}
					// the main part
					formula.clear();
					formula.appendSection(atom, structUnit.count || 1, (structUnit.chargeSignal || 0) * (structUnit.chargeMultiple || 1));
					var mainPart = Kekule.Render.ChemDisplayTextUtils.formulaToRichText(formula, true);

					if (structUnit.hOrder < 0)
						subRts.push(hPart);
					subRts.push(mainPart)
					if (structUnit.hOrder > 0)
						subRts.push(hPart);
					/*
					subRt = Kekule.Render.RichTextUtils.create();
					if (structUnit.hOrder < 0)
						Kekule.Render.RichTextUtils.append(subRt, hPart);
					Kekule.Render.RichTextUtils.append(subRt, mainPart);
					if (structUnit.hOrder > 0)
						Kekule.Render.RichTextUtils.append(subRt, hPart);
					subRt.anchorItem = mainPart;
					*/
					/*
					if (structUnit.hCount && structUnit.hOrder < 0)
						formula.appendSection(hAtom, structUnit.hCount, 0);
					formula.appendSection(atom, structUnit.count || 1, (structUnit.chargeSignal || 0) * (structUnit.chargeMultiple || 1));
					if (structUnit.hCount && structUnit.hOrder > 0)
						formula.appendSection(hAtom, structUnit.hCount, 0);
					subRt = Kekule.Render.ChemDisplayTextUtils.formulaToRichText(formula, true);
					*/
				}
			}

			if (subRts && subRts.length)
			{
				if (structUnit.incomingBondOrder && structUnit.incomingBondOrder > BO.SINGLE)
				{
					var bondSymbol = Kekule.FormulaUtils.getBondSymbol(structUnit.incomingBondOrder);
					//RTU.insertText(subRt, 0, bondSymbol, false);
					RTU.insertText(subRts[0], 0, bondSymbol, false);
				}
				if (structUnit.count && structUnit.count > 1 && structUnit.structType !== 'atom')
				{
					// here we handle the count of branch or subgroup, since the count already be handled in atom section, no need to add here
					var countPart = RTU.strToRichText(structUnit.count.toString(), {'textType': Kekule.Render.RichText.SUB});
					subRts.push(countPart);
				}

				if (subRts.length <= 1)
					RTU.append(resultRt, subRts[0]);
				else
				{
					var rtGroup = RTU.createGroup('group', {'charDirection': Kekule.Render.TextDirection.LTR});
					RTU.appendItems(rtGroup, subRts)
					RTU.append(resultRt, rtGroup);
				}

				//RTU.appendItems(resultRt, subRts);
			}
		}

		return {richText: resultRt, maxBranchLevel: maxBranchLevel};
	},

	/**
	 * Guess the formula text of an input text.
	 * Note, this function only *guess* the type, will not return an accurate result.
	 * @param {String} text
	 * @returns {string} 'normal' or 'condensed'.
	 */
	guessFormulaTextType: function(text)
	{
		// if there are bond chars (exclude -, which may be a charge symbol), then the text should be condensed formula
		var bondChars = Object.keys(Kekule.CondensedFormulaUtils.BOND_CHAR_MAP);
		bondChars = Kekule.ArrayUtils.exclude(bondChars, Kekule.CondensedFormulaUtils.SINGLE_BOND_OR_NEGATIVE_CHARGE_SYMBOLS);
		for (var i = 0, l = bondChars.length; i < l; ++i)
		{
			if (text.indexOf(bondChars[i]) >= 0)
				return 'condensed';
		}

		var result = 'normal';
		// then we convert the text to normal formula, check if there are many duplicate atoms (e.g., CH3CH2CH2OH, there are multiple C/H), if so, it should be condensed formula
		try
		{
			var testResult = Kekule.CondensedFormulaUtils.parse(text, 0, [], {structure: false, structureUnits: true});
			if (testResult.structureUnits)
			{
				var atomCountMap = {};
				var assocHGroupCount = 0;
				for (var i = 0, l = testResult.structureUnits.length; i < l; ++i)
				{
					var unit = testResult.structureUnits[i];
					if (unit.structType === 'atom')
					{
						var atomSymbol = unit.atomSymbol;
						atomCountMap[atomSymbol] = (atomCountMap[atomSymbol] || 0) + 1;
						if (unit.hCount)  // has explict H
						{
							++assocHGroupCount;
						}

						if (assocHGroupCount > 3 || atomCountMap[atomSymbol] > 3)
						{
							result = 'condensed';
							break;
						}
					}
				}
				var atomCount = Object.keys(atomCountMap).length;

				// TODO: now the check threshold is fixed
				if (result !== 'condensed' && atomCount * 2 < testResult.structureUnits.length)
				{
					result = 'condensed';
				}
			}
		}
		catch(e)
		{
			result = 'normal';
		}

		return result;
	}
};

})();
