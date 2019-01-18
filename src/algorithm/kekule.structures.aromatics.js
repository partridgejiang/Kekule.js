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

var OU = Kekule.ObjUtils;
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
			//var implValence = node.getImplicitValence && node.getImplicitValence();

			var isSaturated = node.isSaturated && node.isSaturated();

			if (!isSaturated)  // check if the multiple bond is on ring or outside ring
			{
				var baseECount;
				var multipleBonds = node.getLinkedMultipleBonds();
				if (node.isSulfoneOrSulfoxideSulphur && node.isSulfoneOrSulfoxideSulphur())
					return PElectronCountMarkers.SULFONE_OR_SULFOXIDE_SULPHUR;
				else if (node.isEsterCarbon && node.isEsterCarbon())
					return PElectronCountMarkers.ESTER_CARBON;

				var multipleBondsOnRing, multipleBondOnRingCount;
				if (ctabRingConnectors)
				{
					multipleBondsOnRing = AU.intersect(multipleBonds, ctabRingConnectors);
					multipleBondOnRingCount = multipleBondsOnRing.length;
				}
				else  // sometimes ctabRingConnectors are not set (e.g., in kekulize method), we suppose the multiple bond is on ring
				{
					multipleBondsOnRing = null;    // flag
					multipleBondOnRingCount = 1;
				}
				if (multipleBondOnRingCount)  // multiple bond on ring
				{
					if ((multipleBondOnRingCount === 2) && (multipleBondsOnRing[0].getBondOrder() === Kekule.BondOrder.EXPLICIT_AROMATIC))
					{
						if (isotope.isHetero && isotope.isHetero())  // hetero atom on aromatic bond may provide 1 or 2 e
						{
							baseECount = [1, 2];
						}
						else  // C
							baseECount = 1;
					}
					else if ((multipleBondOnRingCount === 1) && (multipleBondsOnRing && multipleBondsOnRing[0].getBondOrder() === Kekule.BondOrder.DOUBLE))
						baseECount = 1;
					else if ((multipleBondOnRingCount === 1) && !multipleBondsOnRing)   // receive special flag
						baseECount = 1;
					else
						return -1;  //0;  // C=C=C or triple bond has no aromatic, returns directly
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
							baseECount = 0;
						else
							baseECount = 1;
					}
					else
						baseECount = 1;
				}
				// adjust with charge
				if (AU.isArray(baseECount))
				{
					for (var i = 0, l = baseECount.length; i < l; ++i)
					{
						baseECount[i] = Math.min(Math.max(baseECount[i] - charge, 0), 2);
					}
					return baseECount;
				}
				else
					return Math.min(Math.max(baseECount - charge, 0), 2);  // C=C(+), C+ has 0 pi e.
			}
			else // saturated
			{
				if (node.getRadical && (node.getRadical() === Kekule.RadicalOrder.DOUBLET))
					return 1;
				else if (isotope.isHetero())  // saturated N/S/P/O..., pX2
				{
					//return 2;
					return Math.min(Math.max(2 - charge, 0), 2);
				}
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
				/*
				result._isVar = true;
				console.log(result);
				*/
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
	 * @returns {Hash} A {result, eMap} Hash, where result is a value from {@link Kekule.AromaticTypes},
	 *   while the eMap stores the possible aromatic pi electron count of each node in ring.
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
			var aromaticEIndexes = null;
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
						{
							currResult = Kekule.AromaticTypes.EXPLICIT_AROMATIC;
							aromaticEIndexes = AU.clone(currIndexes);
						}
						else if (!mod)
							currResult = Kekule.AromaticTypes.ANTIAROMATIC;
					}
				}

				if (lastResult !== null)  // check previous and curr result value
				{
					if (currResult && lastResult !== currResult)
					{
						if ((lastResult === Kekule.AromaticTypes.EXPLICIT_AROMATIC)
							|| (currResult === Kekule.AromaticTypes.EXPLICIT_AROMATIC))
						{
							finalResult = Kekule.AromaticTypes.UNCERTAIN;
							break;
						}
					}
				}
				else  // lastResult not set
					lastResult = currResult;
			}
			while (nextIndexes(currIndexes));

			if (!finalResult)
				finalResult = lastResult;

			if (aromaticEIndexes)  // find aromatic electron set, returns it too
			{
				var eMap = new Kekule.MapEx();
				for (var i = 0, l = aromaticEIndexes.length; i < l; ++i)
				{
					eMap.set(nodes[i], nodeECounts[i][aromaticEIndexes[i]]);
				}
			}

			//return lastResult;
			return {'result': finalResult, 'eMap': eMap};
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
			var cachedECount = node.getStructureCacheData('piElectronCount');
			if (Kekule.ObjUtils.notUnset(cachedECount))
			{
				piECountMap.set(node, [cachedECount]);
			}
			else
			{
				var eCounts = this._getPossibleRingNodePiElectronCounts(node, allNodes, allConnectors);
				piECountMap.set(node, eCounts);
			}
			//node.setCharge(eCount);  // debug
		}
	},
	_storeAromaticCacheToRingInfo: function(ring, aromaticType, piECountMap)
	{
		ring.aromaticType = aromaticType;
		if (aromaticType === Kekule.AromaticTypes.EXPLICIT_AROMATIC)
		{
			// store pi electron map to nodes in ring
			var nodes = ring.nodes;
			for (var i = 0, l = nodes.length; i < l; ++i)
			{
				var node = nodes[i];
				if (Kekule.ObjUtils.isUnset(node.getStructureCacheData('piElectronCount')))
				{
					if (piECountMap)
					{
						var eCount = piECountMap.get(node);
						if (Kekule.ObjUtils.notUnset(eCount))
						{
							node.setStructureCacheData('piElectronCount', eCount);
						}
					}
				}
			}
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
				var aromaticType;
				if (Kekule.ObjUtils.notUnset(ring.aromaticType))
					aromaticType = ring.aromaticType;
				else
				{
					var checkResult = this._checkRingAromaticType(ring, piECountMap);
					aromaticType = checkResult.result;
					//if (aromaticType === Kekule.AromaticTypes.EXPLICIT_AROMATIC)
					this._storeAromaticCacheToRingInfo(ring, aromaticType, checkResult.eMap);
				}
				if ((aromaticType === Kekule.AromaticTypes.EXPLICIT_AROMATIC)
					|| (allowUncertainRings && (aromaticType === Kekule.AromaticTypes.UNCERTAIN)))
				{
					result.push(ring);
				}
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
	 * @return {Int} Value from {@link Kekule.AromaticTypes}.
	 */
	getRingAromaticType: function(ring, refRings)
	{
		// restore from cache first
		if (Kekule.ObjUtils.notUnset(ring.aromaticType))
			return ring.aromaticType;
		if (!refRings)
			refRings = this.findSSSR();
		var result;
		var piECountMap = new Kekule.MapEx();
		try
		{
			this._calcPossibleRingNodesPElectronCounts(piECountMap, [ring], refRings);
			var checkResult = this._checkRingAromaticType(ring, piECountMap);
			result = checkResult.result;
			this._storeAromaticCacheToRingInfo(ring, result, checkResult.eMap);
		}
		finally
		{
			piECountMap.finalize();
		}
		return result;
	},
	/**
	 * Returns the bond order changes that need to be done on aromatic rings when do a hucklization.
	 * @param {Array} targetBonds Optional, the target bonds. If this param is not set, all aromatic rings in connection table will be handled.
	 * @param {Hash} options Option object, can include fields: {
	 *   allowUncertainRings: Whether uncertain rings (e.g., with variable atom) be included in result. Default is false.
	 * }.
	 * @returns {Array} Each item is a hash of {bond, (new)bondOrder (always be explicit aromatic)}.
	 */
	getHucklizationChanges: function(targetBonds, options)
	{
		var allowUncertainRings = options && options.allowUncertainRings;
		var BO = Kekule.BondOrder;
		var result = [];
		var mol = this.getParent();

		var aromaticRings = this.findAromaticRings(allowUncertainRings);
		for (var i = 0, l = aromaticRings.length; i < l; ++i)
		{
			var bonds = aromaticRings[i].connectors;
			for (var j = 0, k = bonds.length; j < k; ++j)
			{
				var bond = bonds[j];
				if (!targetBonds || targetBonds.indexOf(bond) >= 0)
				{
					var currOrder = bond.getBondOrder && bond.getBondOrder();
					if (currOrder === BO.SINGLE || currOrder === BO.DOUBLE)  // triple bond will not be affected
					{
						if (bond.setBondOrder)
						{
							result.push({'bond': bond, 'bondOrder': Kekule.BondOrder.EXPLICIT_AROMATIC});
						}
					}
				}
			}
		}

		return result;
	},
	/**
	 * Set the orders of Kekule form bonds (single/double bonds) in aromatic rings to {@link Kekule.BondOrder.EXPLICIT_AROMATIC}.
 	 * @param {Array} targetBonds Optional, the target bonds. If this param is not set, all aromatic rings in connection table will be handled.
	 * @param {Hash} options Option object, can include fields: {
	 *   allowUncertainRings: Whether uncertain rings (e.g., with variable atom) be included in result. Default is false.
	 * }.
	 * @return {Array} Hucklized bonds.
	 */
	hucklize: function(targetBonds, options)
	{
		var allowUncertainRings = options && options.allowUncertainRings;
		var BO = Kekule.BondOrder;
		var result = [];
		var mol = this.getParent();

		mol.setAutoClearStructureCache(false);  // the structure after hucklization should be the same with current one, so cache need not to be cleared
		mol.beginUpdate();
		try
		{
			/*
			var aromaticRings = this.findAromaticRings(allowUncertainRings);
			for (var i = 0, l = aromaticRings.length; i < l; ++i)
			{
				var bonds = aromaticRings[i].connectors;
				for (var j = 0, k = bonds.length; j < k; ++j)
				{
					var bond = bonds[j];
					if (!targetBonds || targetBonds.indexOf(bond) >= 0)
					{
						var currOrder = bond.getBondOrder && bond.getBondOrder();
						if (currOrder === BO.SINGLE || currOrder === BO.DOUBLE)  // triple bond will not be affected
						{
							if (bond.setBondOrder)
							{
								bond.setBondOrder(Kekule.BondOrder.EXPLICIT_AROMATIC);
								result.push(bond);
							}
						}
					}
				}
			}
			*/
			var changes = this.getHucklizationChanges(targetBonds, options);
			if (changes)
			{
				for (var i = 0, l = changes.length; i < l; ++i)
				{
					var bond = changes[i].bond;
					var order = changes[i].bondOrder;
					if (bond.setBondOrder)
					{
						bond.setBondOrder(order);
						result.push(bond);
					}
				}
			}
		}
		finally
		{
			mol.endUpdate();
			mol.setAutoClearStructureCache(true);
		}
		return result;
	},

	/**
	 * Returns the bond order changes that need to be done on explicit aromatic bonds.
	 * @param {Array} targetBonds Target explicit aromatic bonds. If not set, all aromatic bonds in molecule will be handled.
	 * @param {Hash} options Options for kekulization process. It may include the following fields:
	 *   {
	 *     doAromaticTests: Whether do an aromatic ring perception to determinate the pi electron count before carrying out the calculation. Default is false.
	 *     includingSubgroups: Whether do kekulization on sub groups too. Default is true.
	 *     expandSubFragments: Whether expand all sub structures before kekulization.
	 *     useShadow: Whether use a shadow fragment for calculating the changes to avoid affect current molecule. Default is true.
	 *       Note: if not using shadow, the bond modifications will be applied directly to structure, rather than record them.
	 *   }
	 * @returns {Array} Each item is a hash of {bond, (new)bondOrder}.
	 */
	getKekulizationChanges: function(targetBonds, options)
	{
		var ops = Object.extend({
			doAromaticTests: false,
			includingSubFragments: true,
			expandSubFragments: false,
			useShadow: true
		}, options || {});

		var result = [];

		var mol = this.getParent();
		if (ops.doAromaticTests)
			this.perceiveAromaticRings();

		var targetFragment;
		if (ops.useShadow)
		{
			var shadow = mol.createShadow();
			targetFragment = shadow.getShadowFragment();
		}
		else
			targetFragment = mol;

		try
		{
			if (ops.expandSubFragments && ops.useShadow)
				targetFragment.unmarshalAllSubFragments(true);    // perform on the flattened shadow

			// map target bonds to shadow first
			var actualTargetBonds;
			if (targetBonds)
			{
				actualTargetBonds = [];
				if (ops.useShadow)
				{
					for (var i = 0, l = targetBonds.length; i < l; ++i)
					{
						var shadowBond = shadow.getShadowObj(targetBonds[i]);
						if (shadowBond)
							actualTargetBonds.push(shadowBond);
					}
				}
				else
					actualTargetBonds = targetBonds;
			}
			else
				actualTargetBonds = (ops.includingSubFragments && !ops.expandSubFragments)?
					targetFragment.getAllContainingConnectors(): targetFragment.getConnectors();

			// filter out explicit aromatic ones
			var explicitAromaticBonds = [];
			for (var i = 0, l = actualTargetBonds.length; i < l; ++i)
			{
				var b = actualTargetBonds[i];
				if (b.getBondType() === Kekule.BondType.COVALENT && b.getBondOrder() === Kekule.BondOrder.EXPLICIT_AROMATIC
					&& b.getConnectedChemNodeCount() === 2)
					explicitAromaticBonds.push(b);
			}

			targetFragment.setAutoClearStructureCache(false);  // the structure after kekulization should be the same with current one, so cache need not to be cleared
			targetFragment.beginUpdate();
			try
			{
				// split aromatic bonds to unconnected parts
				var parts = this._splitConnectorsToContinuousParts(explicitAromaticBonds) || [];
				// handle each parts
				var partResult;
				for (var i = 0, l = parts.length; i < l; ++i)
				{
					var part = parts[i];
					partResult = this._kekulizeContinousBonds(part, shadow, targetFragment, mol);
					if (partResult)  // some bonds need to be modified
					{
						for (var j = 0, k = part.length; j < k; ++j)
						{
							var newBondOrder = part[j].getBondOrder();
							if (newBondOrder !== BO.EXPLICIT_AROMATIC)
							{
								var originalBond = ops.useShadow? shadow.getSourceObj(part[j]): part[j];
								result.push({'bond': originalBond, 'bondOrder': newBondOrder});
							}
						}
					}
				}

			}
			finally
			{
				targetFragment.endUpdate();
				targetFragment.setAutoClearStructureCache(true);
			}
		}
		finally
		{
			if (ops.useShadow)
			{
				shadow.finalize();
				//targetFragment.finalize();
			}
		}

		result._useShadow = ops.useShadow;  // a special flag field
		return result;
	},

	/**
	 * Set the orders of Kekule form bonds (single/double bonds) in aromatic rings to {@link Kekule.BondOrder.EXPLICIT_AROMATIC}.
	 * @param {Array} targetBonds Target explicit aromatic bonds. If not set, all aromatic bonds in molecule will be handled.
	 * @param {Hash} options Options for kekulization process. It may include the following fields:
	 *   {
	 *     doAromaticTests: Whether do an aromatic ring perception to determinate the pi electron count before carrying out the calculation. Default is false.
	 *     includingSubgroups: Whether do kekulization on sub groups too. Default is true.
	 *     expandSubFragments: Whether expand all sub structures before kekulization.
	 *     useShadow: Whether use a shadow fragment for calculating the changes to avoid affect current molecule. Default is true.
	 *       Note: if not using shadow, the bond modifications will be applied directly to structure, rather than record them.
	 *   }
	 * @return {Array} Changed bonds.
	 */
	kekulize: function(targetBonds, options)
	{
		var result = [];
		var changes = this.getKekulizationChanges(targetBonds, options);
		if (changes && changes._useShadow)
		{
			var mol = this.getParent();
			try
			{
				mol.setAutoClearStructureCache(false);  // the structure after kekulization should be the same with current one, so cache need not to be cleared
				mol.beginUpdate();
				for (var i = 0, l = changes.length; i < l; ++i)
				{
					var change = changes[i];
					change.bond.setBondOrder(change.bondOrder);
					result.push(change.bond);
				}
			}
			finally
			{
				mol.endUpdate();
				mol.setAutoClearStructureCache(true);
			}
		}
		return result;
	},

	/** @private */
	_kekulizeContinousBonds: function(targetBonds, shadow, shadowMol, originalMol)
	{
		// get all related nodes first
		var targetNodes = [];
		for (var i = 0, l = targetBonds.length; i < l; ++i)
		{
			var connNodes = targetBonds[i].getConnectedChemNodes() || [];
			AU.pushUnique(targetNodes, connNodes);
		}

		var determinatedMap = new Kekule.MapEx(false);
		// if original nodes has pi e information, stores it
		for (var i = 0, l = targetNodes.length; i < l; ++i)
		{
			var shadowNode = targetNodes[i];
			var originalNode = shadow? shadow.getSourceObj(shadowNode): shadowNode;  //originalMol.getFlatternedShadowSourceObj(shadowNode);
			var cachedPiECount = originalNode && originalNode.getStructureCacheData('piElectronCount');
			if (OU.notUnset(cachedPiECount))
			{
				determinatedMap.set(shadowNode, {'cachedPiElectronCount': cachedPiECount});
			}
		}
		var result = this._doKekulizeContinousBondSys(0, targetBonds, targetNodes, determinatedMap);
		return result;
	},
	/** @private */
	_doKekulizeContinousBondSys: function(currBondIndex, undeterminatedBonds, sysNodes, determinatedMap)  // determinatedMap should be all filled with null to each node/bond
	{
		var self = this;
		// returns explicit bond order, or bond order calculated in this process
		var getBondOrder = function(bond)
		{
			var bondOrder;
			var bondInfo = determinatedMap.get(bond);
			if (bondInfo)
				bondOrder = bondInfo.bondOrder;
			else if (undeterminatedBonds.indexOf(bond) < 0)  // bond outside this system
				bondOrder = bond.getBondOrder();
			if (OU.notUnset(bondOrder))
				return bondOrder;
			else
				return null;
		};
		// function to return whether a bond is double or triple order
		var isMultipleBond = function(bond)
		{
			var bondOrder = getBondOrder(bond);
			if ((bondOrder > BO.SINGLE) && (bondOrder <= BO.QUAD))
				return true;
			else
				return false;
		};
		// function to check if there is a double/triple bond connected to this connector
		var hasMultibondNeighborConnector = function(bond)
		{
			var neighborBonds = bond.getNeighboringBonds();
			for (var i = 0, l = neighborBonds.length; i < l; ++i)
			{
				var bond = neighborBonds[i];
				if (isMultipleBond(bond))
					return true;
			}
			return false;
		};
		// check if all bond orders are determinated or outside this calcuation system
		var allBondsDeterminated = function(bonds)
		{
			var bondsInSys = AU.intersect(bonds, undeterminatedBonds);
			var result = !bondsInSys || !bondsInSys.length;
			if (!result)
			{
				result = true;
				for (var i = 0, l = bondsInSys.length; i < l; ++i)
				{
					var b = bondsInSys[i];
					if (!determinatedMap.get(b))  // this bond has not been calculated
					{
						result = false;
						break;
					}
				}
			}
			return result;
		};
		// function to returns the calculated pi electron count of a node before
		var getNodeDeterminatedPiECount = function(node)
		{
			// check structure cache first
			var cachedData = determinatedMap.get(node);
			var result = cachedData && cachedData.cachedPiElectronCount;
			// if not set, check if node connected with multiple bonds
			if (OU.isUnset(result))
			{
				var linkedConns = node.getLinkedBonds(Kekule.BondType.COVALENT);
				var isAllConnectorsDeterminated = allBondsDeterminated(linkedConns);
				if (isAllConnectorsDeterminated)
				{
					var possiblePiECount = AU.toArray(self._getPossibleRingNodePiElectronCounts(node, null, null));
					if (!possiblePiECount || !possiblePiECount.length || possiblePiECount[0] < 0)  // not a aromatic result
						return -1;
					else
						return possiblePiECount[0];  // any positive value is ok
				}

				var multipleBondCount = 0, singleBondCount = 0;
				for (var i = 0, l = linkedConns.length; i < l; ++i)
				{
					var conn = linkedConns[i];
					var bondOrder = getBondOrder(conn);
					if (OU.notUnset(bondOrder))
					{
						if (bondOrder === BO.DOUBLE || bondOrder === BO.TRIPLE || bondOrder === BO.QUAD)
							++multipleBondCount;
						else // if (bondOrder === BO.SINGLE)
							++singleBondCount;
					}
					else
					{
						// can not determinate
					}
				}
				// decide e count, or raise error according to bond situation
				if (multipleBondCount)
				{
					if (multipleBondCount === 1)
						result = 1;
					else  // more than one multipleBond, error
						result = -1;
				}
				else  // no multiple bond, unknown
				{
					/*
					var isotope = node.getIsotope && node.getIsotope();
					var isHetero = isotope.isHetero && isotope.isHetero();
					*/
				}
			}
			return result;
		};
		var connectedNodeHas2PiElectron = function(bond, nodes)
		{
			var pi2Count = 0, pi1Count = 0;
			for (var i = 0, l = nodes.length; i < l; ++i)
			{
				var count = getNodeDeterminatedPiECount(nodes[i]);
				if (OU.notUnset(count))
				{
					if (count >= 2)
						++pi2Count;
					else // if (count <= 1)
						++pi1Count;
				}
			}
			if (pi2Count > 0)
				return true;
			else if (pi1Count >= 2)  // all with 1 pi count
				return false;
			else
				return null;  // undeterminated
		};

		var currBond = undeterminatedBonds[currBondIndex];
		var currNodes = currBond.getConnectedChemNodes();
		var possibleBondOrders = [];

		if (!determinatedMap.get(currBond))  // this bond has not be determinated
		{
			if (hasMultibondNeighborConnector(currBond))  // has double/triple neighbor bond, this bond should always has single order
			{
				possibleBondOrders = [BO.SINGLE];
			}
			else  // neighbors are all single, may be double or single order (e.g., C-N in pyrrole)
			{
				var has2PiElectron = connectedNodeHas2PiElectron(currBond, currNodes);
				if (has2PiElectron)
					possibleBondOrders = [BO.SINGLE];
				else if (has2PiElectron !== null)  // has2PiElectron === false, 1 pi e count
					possibleBondOrders = [BO.DOUBLE];
				else  // has2PiElectron === null, undeterminated
				{
					possibleBondOrders = [BO.DOUBLE, BO.SINGLE];
				}
			}

			//console.log('possible bond order', possibleBondOrders, currNodes[0].getSymbol(), currNodes[1].getSymbol());
			var result;
			// try all possible bond orders
			for (var i = 0, l = possibleBondOrders.length; i < l; ++i)
			{
				result = true;
				//console.log('try', currBondIndex, i, [possibleBondOrders]);
				var currBondOrder = possibleBondOrders[i];
				determinatedMap.set(currBond, {'bondOrder': currBondOrder});
				currBond.setBondOrder(currBondOrder);
				// check curr node pi e count, to see if this setting has error
				for (var j = 0, k = currNodes.length; j < k; ++j)
				{
					var node = currNodes[j];
					if (getNodeDeterminatedPiECount(node) < 0)
					{
						result = false;
						break;
					}
				}

				//console.log('node check pass', i, result, currBondOrder, possibleBondOrders);
				//alert('node check pass ' + i + ' ' + result);

				if (result)  // node check passed
				{
					//console.log('True on', currBondIndex, currBond.getId(), currBondOrder);
					// continue to determinate the rest bonds
					if (currBondIndex < undeterminatedBonds.length - 1)
					{
						result = this._doKekulizeContinousBondSys(currBondIndex + 1, undeterminatedBonds, sysNodes, determinatedMap);
						if (result)  // kekulize successful,returns
							break;
					}
					else
					{
						result = true;
						break;
					}
				}
			}

			if (!result)  // kekulize failed, maybe there is error in previous bond, rollback
			{
				//console.log('failed', currBondIndex);
				currBond.setBondOrder(BO.EXPLICIT_AROMATIC);  // restore the bond order of curr bond
				determinatedMap.remove(currBond);
				return false;
			}
			else
			{
				return true;
			}
		}

	},
	/** @private */
	_splitConnectorsToContinuousParts: function(connectors)
	{
		if (!connectors || !connectors.length)
			return null;

		var _getNeighboringConnectorNet = function(startingConnector, remainingConnectors)
		{
			/*
			if (traversedConnectors.indexOf(startingConnector) >= 0)
				return [];
			*/
			var startingIndex = remainingConnectors.indexOf(startingConnector);
			if (startingIndex < 0)
				return [];
			else
				remainingConnectors.splice(startingIndex, 1);

			var result = [startingConnector];
			//traversedConnectors.push(startingConnector);
			var neighbors = startingConnector.getNeighboringConnectors();
			for (var i = 0, l = neighbors.length; i < l; ++i)
			{
				var neighbor = neighbors[i];
				if (/*traversedConnectors.indexOf(neighbor) < 0 &&*/ remainingConnectors.indexOf(neighbor) >= 0)
				{
					// traversedConnectors.push(neighbor);
					result = result.concat(_getNeighboringConnectorNet(neighbor, remainingConnectors));
				}
			}
			return result;
		};

		var result = [];
		var remainingConnectors = AU.clone(connectors);
		while (remainingConnectors.length)
		{
			var startingConnector = remainingConnectors[0];
			var neighborNet = _getNeighboringConnectorNet(startingConnector, remainingConnectors);
			if (neighborNet && neighborNet.length)
			{
				result.push(neighborNet);
			}
		}
		return result;
	},
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
	},

	/**
	 * Returns the bond order changes that need to be done on aromatic rings when do a hucklization.
	 * @param {Array} targetBonds Optional, the target bonds. If this param is not set, all aromatic rings in connection table will be handled.
	 * @param {Hash} options Option object, can include fields: {
	 *   allowUncertainRings: Whether uncertain rings (e.g., with variable atom) be included in result. Default is false.
	 * }.
	 * @returns {Array} Each item is a hash of {bond, (new)bondOrder (always be explicit aromatic)}.
	 */
	getHucklizationChanges: function(targetBonds, options)
	{
		return this.hasCtab()? this.getCtab().getHucklizationChanges(targetBonds, options): [];
	},
	/**
	 * Set the orders of Kekule form bonds (single/double bonds) in aromatic rings to {@link Kekule.BondOrder.EXPLICIT_AROMATIC}.
	 * @param {Array} targetBonds Optional, the target bonds. If this param is not set, all aromatic rings in connection table will be handled.
	 * @param {Hash} options Option object, can include fields: {
	 *   allowUncertainRings: Whether uncertain rings (e.g., with variable atom) be included in result. Default is false.
	 * }.
	 * @return {Array} Hucklized bonds.
	 */
	hucklize: function(targetBonds, options)
	{
		return this.hasCtab()? this.getCtab().hucklize(targetBonds, options): [];
	},
	/**
	 * Returns the bond order changes that need to be done on explicit aromatic bonds.
	 * @param {Array} targetBonds Target explicit aromatic bonds. If not set, all aromatic bonds in molecule will be handled.
	 * @param {Hash} options
	 * @returns {Array} Each item is a hash of {bond, (new)bondOrder}.
	 */
	getKekulizationChanges: function(targetBonds, options)
	{
		return this.hasCtab()? this.getCtab().getKekulizationChanges(targetBonds, options): [];
	},
	/**
	 * Set the orders of Kekule form bonds (single/double bonds) in aromatic rings to {@link Kekule.BondOrder.EXPLICIT_AROMATIC}.
	 * @param {Array} targetBonds Target explicit aromatic bonds. If not set, all aromatic bonds in molecule will be handled.
	 * @param {Hash} options Options for kekulization process. It may include the following fields:
	 *   {
	 *     doAromaticTests: Whether do an aromatic ring perception to determinate the pi electron count before carrying out the calculation. Default is false.
	 *     includingSubgroups: Whether do kekulization on sub groups too. Default is true.
	 *     expandSubFragments: Whether expand all sub structures before kekulization.
	 *     useShadow: Whether use a shadow fragment for calculating the changes to avoid affect current molecule. Default is true.
	 *       Note: if not using shadow, the bond modifications will be applied directly to structure, rather than record them.
	 *   }
	 * @return {Array} Changed bonds.
	 */
	kekulize: function(targetBonds, options)
	{
		return this.hasCtab()? this.getCtab().kekulize(targetBonds, options): [];
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
	},

	/** @private */
	_groupActualTargetBondsOfKekulizationOrHucklization: function(structFragments, targetBonds, options)
	{
		var result = [];
		if (!targetBonds)
		{
			for (var i = 0, l = structFragments.length; i < l; ++i)
				result.push({'structFragment': structFragments[i], 'bonds': null});
		}
		else
		{
			for (var i = 0, l = targetBonds.length; i < l; ++i)
			{
				var bond = targetBonds[i];
				for (var j = 0, k = structFragments.length; j < k; ++j)
				{
					var mol = structFragments[j];
					if (bond.isChildOf(mol))
					{
						if (!result[j])
							result[j] = {'structFragment': mol, 'bonds': [bond]};
						else
							result[j].bonds.push(bond);
					}
				}
			}
		}
		return result;
	},
	/**
	 * Returns the bond order changes that need to be done on aromatic rings when do a hucklization.
	 * @param {Array} targetBonds Optional, the target bonds. If this param is not set, all aromatic rings in connection table will be handled.
	 * @param {Hash} options Option object, can include fields: {
	 *   allowUncertainRings: Whether uncertain rings (e.g., with variable atom) be included in result. Default is false.
	 * }.
	 * @returns {Array} Each item is a hash of {bond, (new)bondOrder (always be explicit aromatic)}.
	 */
	getHucklizationChanges: function(targetBonds, options)
	{
		var result = [];
		var ss = CU.getAllStructFragments(this);
		var group = this._groupActualTargetBondsOfKekulizationOrHucklization(ss, targetBonds, options);
		for (var i = 0, l = group.length; i < l; ++i)
		{
			var item = group[i];
			if (item)
				result = result.concat(item.structFragment.getHucklizationChanges(item.bonds, options) || []);
		}
		/*
		for (var i = 0, l = ss.length; i < l; ++i)
		{
			result = result.concat(ss[i].getHucklizationChanges(targetBonds, options) || []);
		}
		*/
		return result;
	},
	/**
	 * Set the orders of Kekule form bonds (single/double bonds) in aromatic rings to {@link Kekule.BondOrder.EXPLICIT_AROMATIC}.
	 * @param {Array} targetBonds Optional, the target bonds. If this param is not set, all aromatic rings in connection table will be handled.
	 * @param {Hash} options Option object, can include fields: {
	 *   allowUncertainRings: Whether uncertain rings (e.g., with variable atom) be included in result. Default is false.
	 * }.
	 * @return {Array} Hucklized bonds.
	 */
	hucklize: function(targetBonds, options)
	{
		var result = [];
		var ss = CU.getAllStructFragments(this);
		/*
		for (var i = 0, l = ss.length; i < l; ++i)
		{
			result = result.concat(ss[i].hucklize(targetBonds, options) || []);
		}
		*/
		var group = this._groupActualTargetBondsOfKekulizationOrHucklization(ss, targetBonds, options);
		for (var i = 0, l = group.length; i < l; ++i)
		{
			var item = group[i];
			if (item)
				result = result.concat(item.structFragment.hucklize(item.bonds, options) || []);
		}
		return result;
	},
	/**
	 * Returns the bond order changes that need to be done on explicit aromatic bonds.
	 * @param {Array} targetBonds Target explicit aromatic bonds. If not set, all aromatic bonds in molecule will be handled.
	 * @param {Hash} options Options for kekulization process. It may include the following fields:
	 *   {
	 *     doAromaticTests: Whether do an aromatic ring perception to determinate the pi electron count before carrying out the calculation. Default is false.
	 *     includingSubgroups: Whether do kekulization on sub groups too. Default is true.
	 *     expandSubFragments: Whether expand all sub structures before kekulization.
	 *     useShadow: Whether use a shadow fragment for calculating the changes to avoid affect current molecule. Default is true.
	 *       Note: if not using shadow, the bond modifications will be applied directly to structure, rather than record them.
	 *   }
	 * @returns {Array} Each item is a hash of {bond, (new)bondOrder}.
	 */
	getKekulizationChanges: function(targetBonds, options)
	{
		var result = [];
		var ss = CU.getAllStructFragments(this);
		/*
		for (var i = 0, l = ss.length; i < l; ++i)
		{
			result = result.concat(ss[i].getKekulizationChanges(targetBonds, options) || []);
		}
		*/
		var group = this._groupActualTargetBondsOfKekulizationOrHucklization(ss, targetBonds, options);
		for (var i = 0, l = group.length; i < l; ++i)
		{
			var item = group[i];
			if (item)
				result = result.concat(item.structFragment.getKekulizationChanges(item.bonds, options) || []);
		}
		return result;
	},
	/**
	 * Set the orders of Kekule form bonds (single/double bonds) in aromatic rings to {@link Kekule.BondOrder.EXPLICIT_AROMATIC}.
	 * @param {Array} targetBonds Target explicit aromatic bonds. If not set, all aromatic bonds in molecule will be handled.
	 * @param {Hash} options
	 * @return {Array} Changed bonds.
	 */
	kekulize: function(targetBonds, options)
	{
		var result = [];
		var ss = CU.getAllStructFragments(this);
		/*
		for (var i = 0, l = ss.length; i < l; ++i)
		{
			result = result.concat(ss[i].kekulize(targetBonds, options) || []);
		}
		*/
		var group = this._groupActualTargetBondsOfKekulizationOrHucklization(ss, targetBonds, options);
		for (var i = 0, l = group.length; i < l; ++i)
		{
			var item = group[i];
			if (item)
				result = result.concat(item.structFragment.kekulize(item.bonds, options) || []);
		}
		return result;
	}
});

})();