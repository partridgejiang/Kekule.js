/**
 * @fileoverview
 * Extension methods to perceive aromatic rings in molecule ctab.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /core/kekule.structures.js
 * requires /utils/kekule.utils.js
 * requires /algorithm/kekule.structure.ringSearches.js
 */

(function(){
"use strict";

var AU = Kekule.ArrayUtils;
var BT = Kekule.BondType;
var BO = Kekule.BondOrder;
var CU = Kekule.ChemStructureUtils;

/**
 * Special markers of electron count of p orbit.
 * @enum
 * @private
 */
var PElectronCountMarkers = {
	SATURATED_CARBON: -1,
	ESTER_CARBON: -16,
	SULFONE_OR_SULFOXIDE_SULPHUR: -32
};

/**
 * Enumeration of aromatic detection types, aromatic(4n+2), antiaromatic(4n) or non aromatic
 * @enum
 */
Kekule.AromaticTypes = {
	/** Not an aromatic ring. */
	NONAROMATIC: 0,
	/** An aromatic ring. */
	EXPLICIT_AROMATIC: 1,
	/** An anti-aromatic ring. */
	ANTIAROMATIC: -1,
	/**
	 * Uncertain, maybe aromatic.
	 * For example, there is a variable atom on ring so that the pi electron number can not be exactly calculated.
	 */
	UNCERTAIN: 64
};

ClassEx.extend(Kekule.Atom,
	/** @lends Kekule.Atom# */
	{
	/** @private */
	isSulfoneOrSulfoxideSulphur: function()
	{
		if (this.getSymbol() === 'S')
		{
			var mbonds = this.getLinkedMultipleBonds();
			if (mbonds.length >= 1)
			{
				for (var i = 0, l = mbonds; i < l; ++i)
				{
					var connObjs = this.getLinkedObjsOnConnector(mbonds[i]);
					for (var j = 0, k = connObjs.length; j < k; ++j)
					{
						var obj = connObjs[j];
						if ((obj instanceof Kekule.Atom) && (obj.getSymbol() === 'O'))
							return true;
					}
				}
			}
		}
		return false;
	},
	/** @private */
	isEsterCarbon: function()
	{
		if (this.getSymbol() === 'C')
		{
			var bonds = this.getLinkedBonds(BT.COVALENT);
			var foundDoubleO, foundSingleO;
			for (var i = 0, l = bonds.length; i < l; ++i)
			{
				var b = bonds[i];
				if (b.isBondBetween('C', 'O'))
				{
					if (!foundSingleO && (b.getBondOrder() === BO.SINGLE))
						foundSingleO = true;
					else if (!foundDoubleO && (b.getBondOrder() === BO.DOUBLE))
						foundDoubleO = true;
					if (foundSingleO && foundDoubleO)
						return true;
				}
			}
		}
		return false;
	}
});

/*
 * Default options to percept aromatic rings.
 * @object
 */
Kekule.globalOptions.add('algorithm.aromaticRingsPerception', {
	allowUncertainRings: false
});

ClassEx.extend(Kekule.StructureConnectionTable,
	/** @lends Kekule.StructureConnectionTable# */
	{
	/**
	 * Returns Possible PI electron numbers of atom.
	 * @param node
	 * @param {Array} ctabRingNodes All nodes in cycle block. This array is used to help to find
	 *   if there is a out-of-ring double bond on node.
	 * @param {Array} ctabRingConnectors All connectors in cycle block. This array is used to help to find
	 *   if there is a out-of-ring double bond on node.
	 * @returns {Variant} A number when the pi number is exact or an array with all possible pi electron numbers when the electron count is uncertain.
	 * @private
	 */
	_getPossibleRingNodePiElectronCounts: function(node, ctabRingNodes, ctabRingConnectors)
	{
		/** @ignore */
		var _getRingElementPiElectronCount = function(elemSymbol, node, ctabRingNodes, ctabRingConnectors)
		{
			// TODO: charge on hetero atoms should be reconsidered
			var symbol = elemSymbol;
			var isotope = Kekule.IsotopeFactory.getIsotope(symbol);
			var charge = node.getCharge();
			//var bonds = node.getLinkedBonds(BT.COVALENT);  // now only consider covalent bonds
			var isSaturated = node.isSaturated && node.isSaturated();

			if (!isSaturated)  // check if the multiple bond is on ring or outside ring
			{
				var multipleBonds = node.getLinkedMultipleBonds();
				if (node.isSulfoneOrSulfoxideSulphur && node.isSulfoneOrSulfoxideSulphur())
					return PElectronCountMarkers.SULFONE_OR_SULFOXIDE_SULPHUR;
				else if (node.isEsterCarbon && node.isEsterCarbon())
					return PElectronCountMarkers.ESTER_CARBON;

				var multipleBondsOnRing = AU.intersect(multipleBonds, ctabRingConnectors);
				var multipleBondOnRingCount = multipleBondsOnRing.length;
				if (multipleBondOnRingCount)  // multiple bond on ring
				{
					if ((multipleBondOnRingCount === 2) && (multipleBondsOnRing[0].getBondOrder() === Kekule.BondOrder.EXPLICIT_AROMATIC))
					{
						if (isotope.isHetero && isotope.isHetero())  // hetero atom on aromatic bond may provide 1 or 2 e
						{
							return [1, 2];
						}
						else  // C
							return 1;
					}
					else if ((multipleBondOnRingCount === 1) && (multipleBondsOnRing[0].getBondOrder() === Kekule.BondOrder.DOUBLE))
						return 1;
					else
						return 0;  // C=C=C or triple bond has no aromatic
				}
				else  // multiple bond outside ring
				{
					if (symbol === 'C')
					{
						var hasHetero = false;
						for (var i = 0, l = multipleBonds.length; i < l; ++i)
						{
							var bond = multipleBonds[i];
							var linkedNodes = node.getLinkedObjsOnConnector(bond);
							if (linkedNodes.length === 1)
							{
								var n = linkedNodes[0];
								var linkedIsotope = n.getPrimaryIsotope();
								if (linkedIsotope.isHetero())
								{
									hasHetero = true;
									break;
								}
							}
						}
						if (hasHetero)  // C=O/N/S/P, C has no p electron
							return 0;
						else
							return 1;
					}
					else
						return 1;
				}
			}
			else // saturated
			{
				if (node.getRadical && (node.getRadical() === Kekule.RadicalOrder.DOUBLET))
					return 1;
				else if (isotope.isHetero())  // saturated N/S/P/O..., pX2
					return 2;
				else if (symbol === 'C')
				{
					if (charge > 0)  // +1
						return 0;
					else if (charge < 0)  // -1
						return 2;
					else  // no charge
					{
						return PElectronCountMarkers.SATURATED_CARBON;
					}
				}
			}
			return 0;  // default
		};

		if (node instanceof Kekule.VariableAtom)
		{
			var isotopeIds = node.getAllowedIsotopeIds();
			if (isotopeIds && isotopeIds.length)
			{
				var result = [];
				for (var i = 0, l = isotopeIds.length; i < l; ++i)
				{
					var isoId = isotopeIds[i];
					var symbol = Kekule.IsotopeFactory.getIsotopeById(isoId).getSymbol();
					AU.pushUnique(result, _getRingElementPiElectronCount(symbol, node, ctabRingNodes, ctabRingConnectors));
				}
				return result;
			}
			else
				return [0, 1, 2];
		}

		var isotope = node.getPrimaryIsotope();
		if (!isotope)  // isotope not certain, may be a subgroup or variable atom.
			return [0, 1, 2];  // returns all possible numbers
		else
		{
			var symbol = isotope.getSymbol();
			return _getRingElementPiElectronCount(symbol, node, ctabRingNodes, ctabRingConnectors);
		}
	},
	/**
	 * Check if a ring is a aromatic one.
	 * @param {Object} ring
	 * @returns {Int} Value from {@link Kekule.AromaticTypes}
	 * @private
	 */
	_checkRingAromaticType: function(ring, piECountMap)
	{
		if (piECountMap)
		{
			var nodes = ring.nodes;
			var nodeECounts = [];
			var currIndexes = [];

			// form a counts array
			var totalCount = nodes.length;
			for (var i = 0; i < totalCount; ++i)
			{
				var n = nodes[i];
				var counts = piECountMap.get(n);
				if (AU.isArray(counts))  // an array of all possible e counts
				{
					nodeECounts.push(counts);
				}
				else
					nodeECounts.push([counts]);
				currIndexes[i] = 0;
			}

			var incIndexesOnPos = function(pos, indexes)
			{
				var currValue = indexes[pos];
				var newValue = ++currValue;
				if (newValue >= nodeECounts[pos].length)
				{
					if (pos >= indexes.length - 1)  // highest pos, can not inc now
						return false;
					else
					{
						indexes[pos] = 0;
						return incIndexesOnPos(pos + 1, indexes);
					}
				}
				else
				{
					indexes[pos] = newValue;
					return true;
				}
			};
			var nextIndexes = function(indexes)
			{
				return incIndexesOnPos(0, indexes);
			};

			var finalResult;
			var lastResult = null;
			var tryCount = 0;
			// loop and calculate all possible pi e sums
			do
			{
				++tryCount;
				var eSum = 0;
				var currResult = null;  // Kekule.AromaticTypes.NONAROMATIC;
				for (var i = 0; i < totalCount; ++i)
				{
					var eCount = nodeECounts[i][currIndexes[i]];
					if (eCount >= 0)
						eSum += eCount;
					else // n < 0, not able to form aromatic ring
					{
						currResult = Kekule.AromaticTypes.NONAROMATIC;
						break;
					}
				}

				if (currResult === null)  // not determinated
				{
					var times = parseInt(eSum / 4);
					var mod = eSum % 4;
					if ((times <= 5) && (times !== 2))  // times = 2, 10 carbon ring, not aromatic
					{
						if (mod === 2)
							currResult = Kekule.AromaticTypes.EXPLICIT_AROMATIC;
						else if (!mod)
							currResult = Kekule.AromaticTypes.ANTIAROMATIC;
					}
				}

				if (lastResult !== null)  // check previous and curr result value
				{
					if (lastResult !== currResult)
					{
						if ((lastResult === Kekule.AromaticTypes.EXPLICIT_AROMATIC)
							|| (currResult === Kekule.AromaticTypes.EXPLICIT_AROMATIC))
						{
							return Kekule.AromaticTypes.UNCERTAIN;
							break;
						}
					}
				}
				else  // lastResult not set
					lastResult = currResult;
			}
			while (nextIndexes(currIndexes))

			return lastResult;
			/*
			var eSum = 0;
			for (var i = 0, l = nodes.length; i < l; ++i)
			{
				var n = nodes[i];
				var eCounts = piECountMap.get(n);
				if (AU.isArray(eCounts))  // an array of all possible e counts
				{

				}
				else
				{
					var eCount = eCounts;
					if (eCount >= 0)
					{
						eSum += eCount;
					}
					else // n < 0, not able to form aromatic ring
						return Kekule.AromaticTypes.NONAROMATIC;
				}
			}
			var times = parseInt(eSum / 4);
			var mod = eSum % 4;
			if ((times <= 5) && (times !== 2))  // times = 2, 10 carbon ring, not aromatic
			{
				if (mod === 2)
					return Kekule.AromaticTypes.EXPLICIT_AROMATIC;
				else if (!mod)
					return Kekule.AromaticTypes.ANTIAROMATIC;
			}
			return Kekule.AromaticTypes.NONAROMATIC;
			*/
		}
	},
	/** @private */
	_calcPossibleRingNodesPElectronCounts: function(piECountMap, rings, refRings)
	{
		var allNodes = [];
		var allConnectors = [];
		var targetNodes = [];
		if (!refRings)
		{
			for (var i = 0, l = rings.length; i < l; ++i)
			{
				AU.pushUnique(allNodes, rings[i].nodes);
				AU.pushUnique(allConnectors, rings[i].connectors);
			}
			targetNodes = allNodes;
		}
		else
		{
			for (var i = 0, l = refRings.length; i < l; ++i)
			{
				AU.pushUnique(allNodes, refRings[i].nodes);
				AU.pushUnique(allConnectors, refRings[i].connectors);
			}
			for (var i = 0, l = rings.length; i < l; ++i)
			{
				AU.pushUnique(targetNodes, rings[i].nodes);
			}
		}
		for (var i = 0, l = targetNodes.length; i < l; ++i)
		{
			var node = targetNodes[i];
			var eCounts = this._getPossibleRingNodePiElectronCounts(node, allNodes, allConnectors);
			piECountMap.set(node, eCounts);
			//node.setCharge(eCount);  // debug
		}
	},
	/**
	 * Perceive and all aromatic rings in ctab.
	 * @param {Bool} allowUncertainRings Whether uncertain rings (e.g., with variable atom) be included in result.
	 * @param {Array} candidateRings Rings in ctab that the detection will be performed.
	 *   If this param is not set, all memebers of SSSR of ctab will be checked.
	 * @return {Array} Found aromatic rings.
	 */
	perceiveAromaticRings: function(allowUncertainRings, candidateRings)
	{
		if (Kekule.ObjUtils.isUnset(allowUncertainRings))
			allowUncertainRings = Kekule.globalOptions.algorithm.aromaticRingsPerception.allowUncertainRings;

		// TODO: need to detect azulene and some other special aromatic rings
		var rings = candidateRings || this.findSSSR();
		var result = [];

		/*
		// mark all pi electron number of all nodes in rings
		var allNodes = [];
		var allConnectors = [];
		for (var i = 0, l = rings.length; i < l; ++i)
		{
			AU.pushUnique(allNodes, rings[i].nodes);
			AU.pushUnique(allConnectors, rings[i].connectors);
		}
		*/
		var piECountMap = new Kekule.MapEx();
		try
		{
			/*
			for (var i = 0, l = allNodes.length; i < l; ++i)
			{
				var node = allNodes[i];
				var eCount = this._getPossibleRingNodePiElectronCounts(node, allNodes, allConnectors);
				piECountMap.set(node, eCount);
				//node.setCharge(eCount);  // debug
			}
			*/
			this._calcPossibleRingNodesPElectronCounts(piECountMap, rings, null);
			// calc pi e count of rings
			for (var i = 0, l = rings.length; i < l; ++i)
			{
				var ring = rings[i];
				var aromaticType = this._checkRingAromaticType(ring, piECountMap);
				if ((aromaticType === Kekule.AromaticTypes.EXPLICIT_AROMATIC)
					|| (allowUncertainRings && (aromaticType === Kekule.AromaticTypes.UNCERTAIN)))
					result.push(ring);
			}
			return result;
		}
		finally
		{
			piECountMap.finalize();
		}
	},
	/**
	 * Perceive and all aromatic rings in ctab, same as method perceiveAromaticRings.
	 * @param {Bool} allowUncertainRings Whether uncertain rings (e.g., with variable atom) be included in result.
	 * @param {Array} candidateRings Rings in ctab that the detection will be performed.
	 *   If this param is not set, all memebers of SSSR of ctab will be checked.
	 * @return {Array} Found aromatic rings.
	 */
	findAromaticRings: function(allowUncertainRings, candidateRings)
	{
		return this.perceiveAromaticRings(allowUncertainRings, candidateRings);
	},

	/**
	 * Returns aromatic type of a ring.
	 * @param {Object} ring
	 * @param {Array} refRings Should list all related rings to ring, help to determine the p electron number.
	 *   If this value is not set, SSSR of ctab will be used instead.
	 */
	getRingAromaticType: function(ring, refRings)
	{
		if (!refRings)
			refRings = this.findSSSR();
		var result;
		var piECountMap = new Kekule.MapEx();
		try
		{
			this._calcPossibleRingNodesPElectronCounts(piECountMap, [ring], refRings);
			result = this._checkRingAromaticType(ring, piECountMap);
		}
		finally
		{
			piECountMap.finalize();
		}
		return result;
	}
});


ClassEx.extend(Kekule.StructureFragment,
/** @lends Kekule.StructureFragment# */
{
	/**
	 * Perceive and mark all aromatic rings in molecule. Found rings will be stored in aromaticRings
	 * property of structure fragment object.
	 * @param {Bool} allowUncertainRings Whether uncertain rings (e.g., with variable atom) be included in result.
	 * @param {Array} candidateRings Rings in molecule that the detection will be performed.
	 *   If this param is not set, all memebers of SSSR of molecule will be checked.
	 * @return {Array} Found aromatic rings.
	 */
	perceiveAromaticRings: function(allowUncertainRings, candidateRings)
	{
		var result = this.hasCtab()? this.getCtab().perceiveAromaticRings(allowUncertainRings, candidateRings): [];
		this.setAromaticRings(result || []);
		return result;
	},
	/**
	 * Perceive and all aromatic rings in molecule, same as method perceiveAromaticRings.
	 * @param {Bool} allowUncertainRings Whether uncertain rings (e.g., with variable atom) be included in result.
	 * @param {Array} candidateRings Rings in ctab that the detection will be performed.
	 *   If this param is not set, all memebers of SSSR of ctab will be checked.
	 * @return {Array} Found aromatic rings.
	 */
	findAromaticRings: function(allowUncertainRings, candidateRings)
	{
		return this.perceiveAromaticRings(allowUncertainRings, candidateRings);
	},
	/**
	 * Returns aromatic type of a ring.
	 * @param {Object} ring
	 * @param {Array} refRings Should list all related rings to ring, help to determine the p electron number.
	 *   If this value is not set, SSSR of molecule will be used instead.
	 */
	getRingAromaticType: function(ring, refRings)
	{
		return this.hasCtab()? this.getCtab().getRingAromaticType(ring, refRings): null;
	}
});

ClassEx.extend(Kekule.ChemObject,
	/** @lends Kekule.ChemObject# */
	{
	/**
	 * Perceive and mark all aromatic rings in chem object. Found rings will be stored in aromaticRings
	 * property of structure fragment object.
	 * @param {Bool} allowUncertainRings Whether uncertain rings (e.g., with variable atom) be included in result.
	 * @param {Array} candidateRings Rings in molecule that the detection will be performed.
	 *   If this param is not set, all memebers of SSSR of molecule will be checked.
	 * @return {Array} Found aromatic rings.
	 */
	perceiveAromaticRings: function(allowUncertainRings, candidateRings)
	{
		var ss = CU.getAllStructFragments(this);
		var result = [];
		for (var i = 0, l = ss.length; i < l; ++i)
		{
			var rings = ss[i].perceiveAromaticRings(allowUncertainRings, candidateRings);
			if (rings)
				result = result.concat(rings);
		}
		return result.length? result: null;
	},
	/**
	 * Perceive and all aromatic rings in chem object, same as method perceiveAromaticRings.
	 * @param {Bool} allowUncertainRings Whether uncertain rings (e.g., with variable atom) be included in result.
	 * @param {Array} candidateRings Rings in ctab that the detection will be performed.
	 *   If this param is not set, all memebers of SSSR of ctab will be checked.
	 * @return {Array} Found aromatic rings.
	 */
	findAromaticRings: function(allowUncertainRings, candidateRings)
	{
		return this.perceiveAromaticRings(allowUncertainRings, candidateRings);
	}
});

})();