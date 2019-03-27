/**
 * @fileoverview
 * Basic classes and methods related with stereo chemistry.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /core/kekule.structures.js
 * requires /utils/kekule.utils.js
 * requires /algorithm/kekule.structures.comparers.js
 * requires /algorithm/kekule.structure.canonicalizers.js
 * requires /algorithm/kekule.structure.ringSearches.js
 */

(function(){
"use strict";

var AU = Kekule.ArrayUtils;
var CU = Kekule.CoordUtils;

	/**
	 * Enumeration of rotation directions.
	 * @enum
	 */
Kekule.RotationDir = {
	CLOCKWISE: 1,
	ANTICLOCKWISE: -1,
	UNKNOWN: 0
};
var RD = Kekule.RotationDir;

/**
 * Default options to do stereo identification.
 * @object
 */
Kekule.globalOptions.add('algorithm.stereoPerception', {
	useFlattenedShadow: true,
	perceiveStereoConnectors: true,
	perceiveChiralNodes: true,
	calcParity: true,
	strictStereoBondGeometry: false,
	strictStereoAtomGemoetry: false,
	wedgeBondPrior: true
});

/**
 * Util class about stereo chemistry.
 * @class
 */
Kekule.MolStereoUtils = {
	/** @private */
	FISCHER_PROJECTION_BOND_ALLOWED_ERROR: 0.08,
	/**
	 * Returns dihedral angle of plane (n1, n2, n3) and (n2, n3, n4).
	 * @param {Kekule.ChemStructureNode} n1
	 * @param {Kekule.ChemStructureNode} n2
	 * @param {Kekule.ChemStructureNode} n3
	 * @param {Kekule.ChemStructureNode} n4
	 * @param {Int} coordMode
	 * @param {Bool} allowCoordBorrow Default is true.
	 * @returns {Float}
	 */
	getDihedralAngleOfNodes: function(n1, n2, n3, n4, coordMode, allowCoordBorrow)
	{
		if (Kekule.ObjUtils.isUnset(allowCoordBorrow))
			allowCoordBorrow = true;

		if (Kekule.ObjUtils.isUnset(coordMode))
		{
			if (n2.hasCoord3D())
				coordMode = Kekule.CoordMode.COORD3D;  // default use 3D coord to calculate
			else
				coordMode = Kekule.CoordMode.COORD2D;
		}

		var getNodeCoord = Kekule.MolStereoUtils._getNodeCoordForBondParity;

		var axisBond = n2.getConnectorTo(n3);
		var axisIsDoubleBond = axisBond && axisBond.isDoubleBond && axisBond.isDoubleBond();

		var c2 = getNodeCoord(n2, null, null, coordMode, allowCoordBorrow);
		var c3 = getNodeCoord(n3, null, null, coordMode, allowCoordBorrow);
		var c1 = getNodeCoord(n1, n2, c2, coordMode, allowCoordBorrow, axisIsDoubleBond);
		var c4 = getNodeCoord(n4, n3, c3, coordMode, allowCoordBorrow, axisIsDoubleBond);
		if (c1 && c2 && c3 && c4)
		{
			var result = Kekule.GeometryUtils.getDihedralAngleOfPoints(c1, c2, c3, c4);
			//console.log('dihedral', result * 180 / Math.PI, c1, c2, c3, c4);
			return result;
		}
		else  // null in coord, c1-4, can not calculate angle
			return -1;
	},

	/**
	 * Returns the stereo parity of node sequence n1 to n4.
	 * @param {Kekule.ChemStructureNode} n1
	 * @param {Kekule.ChemStructureNode} n2
	 * @param {Kekule.ChemStructureNode} n3
	 * @param {Kekule.ChemStructureNode} n4
	 * @param {Int} coordMode
	 * @param {Bool} allowCoordBorrow
	 * @returns {Int} If n1 and n4 at the same side of line n2-n3, parity is odd(1), otherwise even(2) will be returned.
	 */
	getParityOfNodeSeq: function(n1, n2, n3, n4, coordMode, allowCoordBorrow)
	{
		var SP = Kekule.StereoParity;
		var angle = Kekule.MolStereoUtils.getDihedralAngleOfNodes(n1, n2, n3, n4, coordMode, allowCoordBorrow);
		var result = (angle < 0)? SP.UNKNOWN:
			(angle < Math.PI * 2 / 5 || angle > Math.PI * 8 / 5)? SP.ODD:
				(angle > Math.PI * 3 / 5 && angle < Math.PI * 7 / 5)? SP.EVEN:
					SP.UNKNOWN;
		return result;
	},

	/** @private */
	_getNodeCoordForBondParity: function(node, centerNode, centerCoord, coordMode, allowCoordBorrow, axisIsDoubleBond)
	{
		if (coordMode !== Kekule.CoordMode.COORD2D)  // 3D, get 3D absolute coord directly
			return node.getAbsCoordOfMode(coordMode, true);  // allow borrow
		else  // coord 2D, add z value, consider wedge bonds
		{
			var result = node.getAbsCoordOfMode(coordMode, true);  // allow borrow
			if (centerNode && centerCoord)
			{
				var connector = node.getConnectorTo(centerNode);
				if (connector.getStereo)
				{
					var bondStereo = connector.getStereo();
					var BS = Kekule.BondStereo;
					var wedgeDirs = [BS.UP, BS.UP_INVERTED, BS.DOWN, BS.DOWN_INVERTED];
					if (wedgeDirs.indexOf(bondStereo) >= 0)
					{
						var index = connector.indexOfConnectedObj(node) - connector.indexOfConnectedObj(centerNode);
						if (index < 0)
							bondStereo = BS.getInvertedDirection(bondStereo);
						var zFactors = [1, -1, -1, 1];
						var distance = CU.getDistance(result, centerCoord);
						result.z = distance * zFactors[wedgeDirs.indexOf(bondStereo)];
						//console.log(node.getId(), result);
						/*
						 if (axisIsDoubleBond)
						 result.y = 0;
						 */
					}
					else if ([BS.UP_OR_DOWN, BS.UP_OR_DOWN_INVERTED].indexOf(bondStereo) >= 0)  // direction not certain
						return null;  // return a special mark, can determinate angle calculation
				}
			}
			result.z = result.z || 0;
			return result;
		}
	},

	/** @private */
	_calcParityOfCoordPairs: function(c1, c2, a1, a2, b1, b2, strictStereoBondGeometry)
	{
		var SP = Kekule.StereoParity;
		var axisVector = CU.substract(c2, c1);  // vector of bond
		//console.log('input coords', c1, c2, a1, a2, b1, b2, axisVector);
		if (!axisVector.x && !axisVector.y)  // c1, c2 are same, can not calc parity
			return SP.UNKNOWN;
		var axisAngle = Math.atan2(axisVector.y, axisVector.x);
		// rotate bond to X axis and align to zero
		var matrix = CU.calcTransform2DMatrix({
			'rotateAngle': -axisAngle, 'center': c1,
			'translateX': -c1.x, 'translateY': -c1.y
		});
		var originCoords = [c1, c2, a1, a2, b1, b2];
		var transformedCoords = [];
		for (var i = 0, l = originCoords.length; i < l; ++i)
		{
			var coord = originCoords[i];
			if (coord)
				transformedCoords[i] = CU.transform2DByMatrix(coord, matrix);
			else
				transformedCoords[i] = null;
		}
		var tc1 = transformedCoords[0], tc2 = transformedCoords[1];
		//var bondDirection = Math.sign(tc2.x);
		var ta1 = transformedCoords[2], ta2 = transformedCoords[3];  // tc1 is [0, 0] after transform
		var tb1 = CU.substract(transformedCoords[4], tc2), tb2 = transformedCoords[5]? CU.substract(transformedCoords[5], tc2): null;

		// compare direction of ta1/ta2, tb1/tb2
		var getDirectionSign = function(v1, v2, threshold, refDir)
		{
			var result = 0;
			var lenV1 = Math.sqrt(Math.sqr(v1.x) + Math.sqr(v1.y));
			if (!v2)
			{
				var d = v1.y / lenV1;
				if (Math.abs(d) < threshold)
					result = 0;
				else
					result = Math.sign(v1.y);
			}
			else
			{
				var lenV2 = Math.sqrt(Math.sqr(v2.x) + Math.sqr(v2.y));
				var d = v1.y / lenV1 - v2.y / lenV2;   // standard y coord
				if (Math.abs(d) < threshold)
					result = 0;
				else
				{
					if (Math.sign(v1.y) !== Math.sign(v2.y))  // v1, v2 or different side of bond (x-axis)
					{
						result = Math.sign(d) * refDir;
					}
					else  // v1, v2 on same side
					{
						if (strictStereoBondGeometry)
							return 0;
						else
						{
							var ctg1 = v1.x / v1.y;
							var ctg2 = v2.x / v2.y;
							d = -(ctg1 - ctg2);
							result = Math.sign(d);
						}
					}
				}
			}
			return result;
		};
		var threshold = 5e-2; // CU.getDistance(c2, c1) / 1e3;
		var sa = getDirectionSign(ta1, ta2, threshold, -1);
		var sb = getDirectionSign(tb1, tb2, threshold, 1);

		var result;
		if (!sa || !sb)
			result = SP.UNKNOWN;
		else if (sa === sb)  // ta1/tb1 on same side of bond
			result = SP.ODD;
		else
			result = SP.EVEN;

		//console.log('compare', tc1, tc2, ta1, ta2, tb1, tb2, sa, sb, result);
		//console.log('compare', sa, sb, result);
		return result;
	},

	/**
	 * Check if a connector is a double bond that connects with two different groups on each end (may has trans or cis configurature).
	 * Note: the parent structure should be canonicalized before calling this method.
	 * @param {Kekule.ChemStructureConnector} connector
	 * @returns {Bool}
	 */
	isStereoBond: function(connector)
	{
		var isUnset = Kekule.ObjUtils.isUnset;
		if (connector.getBelongedRingMinSize)
		{
			var ringSize = connector.getBelongedRingMinSize() || 0;
			if (ringSize > 0 && ringSize <= 10)  // connector in small ring, never has configurature problem
				return false;
		}
		var result = false;
		var isDouble = connector.isDoubleBond && connector.isDoubleBond();
		if (isDouble && (connector.getConnectedObjCount() === 2))
		{
			var endNodes = connector.getConnectedChemNodes(); // [connector.getConnectedObjAt(0), connector.getConnectedObjAt(1)];
			if (endNodes.length === 2)
			{
				var result = true;
				for (var i = 0; i < 2; ++i)
				{
					var node = endNodes[i];
					var hydroCount = node.getHydrogenCount(true);  // include explicit bonded H atoms
					var sideObjs = AU.exclude(node.getLinkedChemNodes(), endNodes);
					if ((hydroCount >= 2) || (!sideObjs.length))
					{
						result = false;
						break;
					}
					if (/*hydroCount === 1 && */ sideObjs.length === 1)  // N=N double bond may has no hydro count
					{
						// result = true;
					}
					else if (sideObjs.length === 2)
					{
						if (isUnset(sideObjs[0].getCanonicalizationIndex()) && isUnset(sideObjs[1].getCanonicalizationIndex())
							|| (sideObjs[0].getCanonicalizationIndex() === sideObjs[1].getCanonicalizationIndex()))
						{
							result = false;
							break;
						}
					}

					// check side bond, if not single, no stereo
					for (var j = 0, k = sideObjs.length; j < k; ++j)
					{
						var bond = node.getConnectorTo(sideObjs[j]);
						if (!bond.isSingleBond || !bond.isSingleBond())
						{
							result = false;
							break;
						}
					}
					if (!result)
						break;
				}
			}
		}
		else
			result = false;
		return result;
	},
	/**
	 * Find stereo double bond in struct fragment or ctab.
	 * Note, before finding, if param ignoreCanonicalization is false,
	 * the struct fragment will be canonicalized by morgan algorithm to set node cano index.
	 * @param {Variant} structFragmentOrCtab
	 * @param {Bool} ignoreCanonicalization
	 * @returns {Array}
	 * @private
	 */
	doFindStereoBonds: function(structFragmentOrCtab, ignoreCanonicalization)
	{
		var result = [];
		if (!ignoreCanonicalization)
			Kekule.canonicalizer.canonicalize(structFragmentOrCtab, 'morganEx');
		for (var i = 0, l = structFragmentOrCtab.getConnectorCount(); i < l; ++i)
		{
			var conn = structFragmentOrCtab.getConnectorAt(i);
			if (Kekule.MolStereoUtils.isStereoBond(conn))
				result.push(conn);
		}
		return result;
	},

	/**
	 * Returns essential nodes to determine the stereo of a double bond.
	 * @param {Kekule.ChemStructureConnector} connector
	 * @returns {Array} Array of nodes.
	 */
	getStereoBondKeyNodes: function(connector)
	{
		var result = null;
		if (connector.getConnectedObjCount() === 2)
		{
			var endNodes = connector.getConnectedChemNodes();
			if (endNodes.length === 2)
			{
				var refNodes = [];
				for (var i = 0; i < 2; ++i)
				{
					var node = endNodes[i];
					//var hydroCount = node.getHydrogenCount();
					var sideObjs = AU.exclude(node.getLinkedChemNodes(), endNodes);
					if (/*hydroCount === 1 && */ sideObjs.length === 1)  // N=N double bond may has no hydro count
					{
						refNodes.push(sideObjs[0]);
					}
					else if (sideObjs.length === 2)
					{
						var index1 = sideObjs[0].getCanonicalizationIndex() || -1;  // cano index maybe undefined to explicit H atom
						var index2 = sideObjs[1].getCanonicalizationIndex() || -1;
						refNodes.push((index2 > index1)? sideObjs[1]: sideObjs[0]);
					}
					else // too many sideObjs number, maybe a incorrect structure?
					{
						return null;
					}
				}
				result = [refNodes[0], endNodes[0], endNodes[1], refNodes[1]];
			}
		}
		return result;
	},

	/**
	 * Returns all related nodes to determine the stereo of a double bond
	 * (including two bond atoms and four possible connected atoms).
	 * @param {Kekule.ChemStructureConnector} connector
	 * @returns {Array} Array of nodes.
	 *   For structure A1/A2 >C1=C2< B1/B2, the return sequence should be [C1, C2, A1, A2, B1, B2]
	 *   where A1/B1 has superior canonicalization index.
	 */
	getStereoBondRelNodes: function(connector)
	{
		var result = null;
		if (connector.getConnectedObjCount() === 2)
		{
			var endNodes = connector.getConnectedChemNodes();
			if (endNodes.length === 2)
			{
				var relNodes = [];
				for (var i = 0; i < 2; ++i)
				{
					var node = endNodes[i];
					//var hydroCount = node.getHydrogenCount();
					var sideObjs = AU.exclude(node.getLinkedChemNodes(), endNodes);
					if (/*hydroCount === 1 && */ sideObjs.length === 1)  // N=N double bond may has no hydro count
					{
						relNodes.push(sideObjs[0]);
						relNodes.push(null); // an empty node
					}
					else if (sideObjs.length === 2)
					{
						var index1 = sideObjs[0].getCanonicalizationIndex() || -1;  // cano index maybe undefined to explicit H atom
						var index2 = sideObjs[1].getCanonicalizationIndex() || -1;
						relNodes.push((index2 > index1)? sideObjs[1]: sideObjs[0]);
						relNodes.push((index2 > index1)? sideObjs[0]: sideObjs[1]);
					}
					else // too many sideObjs number, maybe a incorrect structure?
					{
						return null;
					}
				}
				result = [endNodes[0], endNodes[1], relNodes[0], relNodes[1], relNodes[2], relNodes[3]];
			}
		}
		return result;
	},

	/**
	 * Calc and returns MDL stereo parity of a stereo double bond.
	 * If two superior group (with larger canonicalization index) at the same side of bond, parity = 1, otherwise parity = 2.
	 * Note: the parent structure fragment should be canonicalized before calculation.
	 * @param {Kekule.ChemStructureConnector} connector
	 * @param {Int} coordMode Use 2D or 3D coord to calculate.
	 * //@param {Kekule.StructureFragment} parentMol
	 * @returns {Int} Value from {@link Kekule.StereoParity}.
	 */
	calcStereoBondParity: function(connector, coordMode, ignoreStereoCheck, strictStereoBondGeometry)
	{
		var SP = Kekule.StereoParity;
		if (!ignoreStereoCheck && !Kekule.MolStereoUtils.isStereoBond(connector))
			return SP.NONE;
		if (connector.getStereo && [Kekule.BondStereo.E_OR_Z, Kekule.BondStereo.CIS_OR_TRANS].indexOf(connector.getStereo()) >= 0)
			return SP.NONE;

		var result = SP.UNKNOWN;
		/*
		if (connector.getConnectedObjCount() === 2)
		{
			var endNodes = connector.getConnectedChemNodes(); // [connector.getConnectedObjAt(0), connector.getConnectedObjAt(1)];
			if (endNodes.length === 2)
			{
				var refNodes = [];
				for (var i = 0; i < 2; ++i)
				{
					var node = endNodes[i];
					var hydroCount = node.getHydrogenCount();
					var sideObjs = AU.exclude(node.getLinkedChemNodes(), endNodes);
					if (sideObjs.length === 1)  // N=N double bond may has no hydro count
					{
						refNodes.push(sideObjs[0]);
					}
					else if (sideObjs.length === 2)
					{
						var index1 = sideObjs[0].getCanonicalizationIndex();
						var index2 = sideObjs[1].getCanonicalizationIndex();
						refNodes.push((index2 > index1)? sideObjs[1]: sideObjs[0]);
					}
				}
				result = Kekule.MolStereoUtils.getParityOfNodeSeq(refNodes[0], endNodes[0], endNodes[1], refNodes[1], coordMode);
			}
		}
		*/
		var keyNodes = Kekule.MolStereoUtils.getStereoBondKeyNodes(connector);
		if (keyNodes && keyNodes.length)
		{
			if (Kekule.ObjUtils.isUnset(coordMode))
			{
				if (keyNodes[1].hasCoord3D())
					coordMode = Kekule.CoordMode.COORD3D;  // default use 3D coord to calculate
				else
					coordMode = Kekule.CoordMode.COORD2D;
			}

			/*
			result = Kekule.MolStereoUtils.getParityOfNodeSeq(keyNodes[0], keyNodes[1], keyNodes[2], keyNodes[3], coordMode);
			return result;
			*/
			if (coordMode === Kekule.CoordMode.COORD3D)
			{
				var angle = Kekule.MolStereoUtils.getDihedralAngleOfNodes(keyNodes[0], keyNodes[1], keyNodes[2], keyNodes[3], coordMode);
				if (angle < 0 || (angle > Math.PI * 2 / 5 && angle < Math.PI * 3 / 5) || (angle > Math.PI * 7 / 5 && angle < Math.PI * 8 / 5))
					return SP.UNKNOWN;  // dihedral angle identity not clear enough
			}

			var allowCoordBorrow = true;  // allow coord borrow
			var getNodeCoord = Kekule.MolStereoUtils._getNodeCoordForBondParity;
			var extractCoord = function(coord, coordAxises)
			{
				if (!coord)
					return null;
				else
					return {
						x: coord[coordAxises[0]],
						y: coord[coordAxises[1]]
					}
			};

			// if pass dihedral test, check parity on X/Y, X/Z, X/Z planet projection
			var relNodes = Kekule.MolStereoUtils.getStereoBondRelNodes(connector);
			// For structure A1/A2 >C1=C2< B1/B2
			var relCoords = [
				getNodeCoord(relNodes[0], null, null, coordMode, allowCoordBorrow),  // C1
				getNodeCoord(relNodes[1], null, null, coordMode, allowCoordBorrow)   // C2
			];
			relCoords = relCoords.concat([
				getNodeCoord(relNodes[2], relNodes[0], relCoords[0], coordMode, allowCoordBorrow, true),  // A1
				relNodes[3]? getNodeCoord(relNodes[3], relNodes[0], relCoords[0], coordMode, allowCoordBorrow, true): null, // A2
				getNodeCoord(relNodes[4], relNodes[1], relCoords[1], coordMode, allowCoordBorrow, true),  // B1
				relNodes[5]? getNodeCoord(relNodes[5], relNodes[1], relCoords[1], coordMode, allowCoordBorrow, true): null  // B2
			]);

			//console.log('---------- calc parity --------------');

			var prjPlanets = (coordMode === Kekule.CoordMode.COORD2D)? [['x', 'y']]:  [['x', 'y'], ['x', 'z'], ['y', 'z']];
			var prjResult = null;
			for (var i = 0, l = prjPlanets.length; i < l; ++i)
			{
				var currPrjCoords = [];
				for (var j = 0, k = relCoords.length; j < k; ++j)
				{
					if (relCoords[j])
						currPrjCoords.push(extractCoord(relCoords[j], prjPlanets[i]));
					else
						currPrjCoords.push(null);
				}
				var prjParity = Kekule.MolStereoUtils._calcParityOfCoordPairs(
						currPrjCoords[0], currPrjCoords[1], currPrjCoords[2], currPrjCoords[3], currPrjCoords[4], currPrjCoords[5],
						strictStereoBondGeometry
				);
				if (prjParity !== SP.UNKNOWN)
				{
					if (prjResult === null)
						prjResult = prjParity;
					else if (prjResult !== prjParity)  // parity not match on different planet
						return SP.UNKNOWN;
				}
			}
			// pass planet projection check
			result = prjResult;
		}
		return result;
	},

	/**
	 * Detect and mark parity of all stereo bonds in structure fragment.
	 * @param {Variant} structFragmentOrCtab
	 * @param {Int} coordMode Use 2D or 3D coord to calculate.
	 * @param {Bool} ignoreCanonicalization If false, ctab will be canonicalized before perception.
	 * @returns {Array} Array of all chiral nodes.
	 * @private
	 */
	doPerceiveStereoConnectors: function(structFragmentOrCtab, coordMode, ignoreCanonicalization, strictStereoBondGeometry)
	{
		var result = Kekule.MolStereoUtils.doFindStereoBonds(structFragmentOrCtab, ignoreCanonicalization);
		structFragmentOrCtab.beginUpdate();
		try
		{
			if (result && result.length)
			{
				for (var i = 0, l = result.length; i < l; ++i)
				{
					var c = result[i];
					var parity = Kekule.MolStereoUtils.calcStereoBondParity(c, coordMode, true, strictStereoBondGeometry);
					if (c.setParity)
						c.setParity(parity);
				}
			}
		}
		finally
		{
			structFragmentOrCtab.endUpdate();
		}
		return result;
	},

	/**
	 * Check if a chem structure node is a chiral one.
	 * Note: now only C/Si/S/P/N/B atoms are considered, and the parent structure fragment may be standardized.
	 * @param {Kekule.ChemStructureNode} node
	 */
	isChiralNode: function(node)
	{
		var result = false;
		if (node.mayContainElement)  // is abstract atom
		{
			var diffNeighborCount;
			var maxMultiBondCount;
			var possibleCharges = null;
			var mayBeChiral = false;
			// check C first
			if (node.mayContainElement('C') || node.mayContainElement('Si'))  // must has four different attached groups
			{
				diffNeighborCount = 4;
				maxMultiBondCount = 0;
				possibleCharges = [0];
				mayBeChiral = true;
			}
			else if (node.mayContainElement('N'))  // must has four different attached groups
			{
				diffNeighborCount = 4;
				maxMultiBondCount = 0;
				mayBeChiral = true;
			}
			else if (node.mayContainElement('S') || node.mayContainElement('P'))  // must has three different attached groups
			{
				diffNeighborCount = 3;
				maxMultiBondCount = 0;
				mayBeChiral = true;
			}
			else if (node.mayContainElement('B'))
			{
				diffNeighborCount = 3;
				maxMultiBondCount = 0;
				possibleCharges = [-1];
				mayBeChiral = true;
			}

			if (mayBeChiral)
			{
				var multicenterBonds = node.getLinkedMultiCenterBonds();
				if (multicenterBonds.length)
				{
					return false;  // there should be no chiral in node connected with multicenter bond
				}
				var neighbors = node.getLinkedChemNodes();
				var multibonds = node.getLinkedMultipleBonds();
				var hydroCount = node.getHydrogenCount ? node.getHydrogenCount() : 0;
				var allHydroCount = node.getHydrogenCount ? node.getHydrogenCount(true) : 0;
				var charge = node.getCharge() || 0;
				//console.log(charge);
				if (multibonds.length > maxMultiBondCount || allHydroCount >= 2 || neighbors.length + hydroCount < diffNeighborCount
					|| (possibleCharges && possibleCharges.indexOf(charge) < 0))
					result = false;
				else  // check cano index of neighbors, see whether they are different
				{
					result = true;
					var canoIndexCounts = [];
					for (var i = 0, l = neighbors.length; i < l; ++i)
					{
						var n = neighbors[i];
						var canoIndex = n.getCanonicalizationIndex() || 0;
						if (!canoIndexCounts[canoIndex])
							canoIndexCounts[canoIndex] = 1;
						else  // duplicate canoIndex
						{
							result = false;
							break;
						}
					}
				}
			}
		}

		return result;
	},

	/**
	 * Find chiral nodes in struct fragment or ctab.
	 * Note, before finding, if param ignoreCanonicalization is false,
	 * the struct fragment will be canonicalized by morgan algorithm to set node cano index.
	 * @param {Variant} structFragmentOrCtab
	 * @param {Bool} ignoreCanonicalization
	 * @returns {Array}
	 * @private
	 */
	doFindChiralNodes: function(structFragmentOrCtab, ignoreCanonicalization)
	{
		var result = [];
		//structFragment.canonicalize('morgan');
		if (!ignoreCanonicalization)
			Kekule.canonicalizer.canonicalize(structFragmentOrCtab, 'morganEx');
		for (var i = 0, l = structFragmentOrCtab.getNodeCount(); i < l; ++i)
		{
			var node = structFragmentOrCtab.getNodeAt(i);
			if (Kekule.MolStereoUtils.isChiralNode(node))
				result.push(node);
		}
		return result;
	},

	/**
	 * Judge the direction of coord1 to coord3 when looking from refCoord to centerCoord
	 * (or put refCoord behide center coord if refCoordBehind param is true).
	 * All coords should have x/y/z values.
	 * @param {Hash} centerCoord
	 * @param {Hash} refCoord
	 * @param {Hash} coord1
	 * @param {Hash} coord2
	 * @param {Hash} coord3
	 * @param {Bool} refCoordBehind
	 * @returns {Int} Value from {@link Kekule.RotationDir}, clockwise, anti-clockwise or unknown.
	 */
	calcRotationDirection: function(centerCoord, refCoord, coord1, coord2, coord3, refCoordBehind)
	{
		// calc the looking direction vector
		var lookingVector = refCoordBehind? CU.substract(centerCoord, refCoord):
			CU.substract(refCoord, centerCoord);
		// now rotate the lookingVector to z-axis
		var rotateAxisVector, rotateAngle;
		var rotateMatrix = null;
		if (!(lookingVector.x === 0 && lookingVector.y === 0))
		{
			rotateAxisVector = Kekule.GeometryUtils.getVectorCrossProduct(lookingVector, {'x': 0, 'y': 0, 'z': 1});
			rotateAngle = Kekule.GeometryUtils.getVectorIncludedAngle(lookingVector, {'x': 0, 'y': 0, 'z': 1});  // get from asin, so always less than 90 degree
			if (lookingVector.z < 0)  // if lookingVector on negative axis of z, the lookingVector should rotate more than 90 degree
				rotateAngle = Math.PI - rotateAngle;
		}
		else if (lookingVector.z < 0)  // lookingVector.x === 0 && lookingVector.y === 0 but z < 0, need to rotate 180 degree
		{
			rotateAxisVector = {'x': 1, 'y': 0, 'z': 0};
			rotateAngle = Math.PI;
		}
		if (rotateAxisVector && rotateAngle)
		{
			rotateMatrix = CU.calcRotate3DMatrix({
				'rotateAngle': rotateAngle,
				'rotateAxisVector': rotateAxisVector,
				'center': {'x': 0, 'y': 0, 'z': 0}
			});
		}
		var v1 = CU.substract(coord1, centerCoord);
		var v2 = CU.substract(coord2, centerCoord);
		var v3 = CU.substract(coord3, centerCoord);
		if (rotateMatrix)
		{
			v1 = CU.transform3DByMatrix(v1, rotateMatrix);
			v2 = CU.transform3DByMatrix(v2, rotateMatrix);
			v3 = CU.transform3DByMatrix(v3, rotateMatrix);
		}
		// now map three rotated vectors to simple X-Y 2D plane, rotate v1 to x axis
		var rotateAngle = -Math.atan2(v1.y, v1.x);
		var rotateMatrix = CU.calcTransform2DMatrix({
			'rotateAngle': rotateAngle,
			'center': {'x': 0, 'y': 0, 'z': 0}
		});
		var c2 = CU.transform2DByMatrix(v2, rotateMatrix);
		var c3 = CU.transform2DByMatrix(v3, rotateMatrix);
		// at last, calc angle of c2 and c3, determinate clockwise or anti
		if (c2.x === 0 || c3.x === 0)  // c2 or c3 also lap with x axis, stereo is unknown
			return RD.UNKNOWN;

		var angle2 = Math.atan2(c2.y, c2.x);
		var angle3 = Math.atan2(c3.y, c3.x);
		if (angle3 < 0)
			angle3 = Math.PI * 2 + angle3;
		if (angle2 < 0)
			angle2 = Math.PI * 2 + angle2;
		return (angle2 < angle3)? RD.ANTICLOCKWISE:
			(angle2 > angle3)? RD.CLOCKWISE:
				RD.UNKNOWN;
	},

	/**
	 * Check if a node is carbon atom in Fischer projection center and returns related information.
	 * Note: only 2D coord will be checked in this function.
	 * @param {Kekule.ChemStructureNode} node
	 * @param {Array} siblings
	 * @param {Hash} options, including:
	 *   {
	 *     allowedError: the allowed error when checking vertical and horizontal line, default is 0.08 (deltaY/deltaX or vice versa, about 4.5 degree).
	 *     reversedDirection: If true, the node on vertical line will be toward observer instead,
	 *     allowExplicitHydrogen: Whether the simplification in saccharide chain form is allowed (H is omitted from structure).
	 *     allowExplicitVerticalHydrogen: Whether the implicit hydrogen on vertical direction is allowed (used in SMILES generation).
	 *     ignoreStructure: Whether structure information should not be checked.
	 *   }
	 * @returns {Hash} The information about this Fischer projection, including:
	 *   {
	 *     horizontalSiblings: array,
	 *     verticalSiblings: array,
	 *     towardSiblings: array, usually siblings on horizontal line,
	 *     awaySiblings: array, usually siblings on vertical line
	 *     implicitTowardSibling, implicitAwaySibling: bool
	 *   }.
	 *   If the node is not a Fischer projection center, null will be returned.
	 * @private
	 */
	_getFischerProjectionInfo: function(node, siblings, options)
	{
		var ops = Object.create(options || null);
		ops.allowExplicitVerticalHydrogen = true;  // TODO: now fixed to true, since the C-H bond may be removed in the standardize process
		ops.allowExplicitHydrogen = true;
		if (siblings.length < 3 || siblings.length > 4)
			return null;
		if (siblings.length === 3 && !ops.allowExplicitHydrogen)
			return null;

		var coordMode = Kekule.CoordMode.COORD2D;
		var allowedError = ops.allowedError || Kekule.MolStereoUtils.FISCHER_PROJECTION_BOND_ALLOWED_ERROR;

		if (!ops.ignoreStructure)  // ensure center node is a C atom with atom symbol hidden
		{
			var isCenterLegal = (node instanceof Kekule.Atom) && (node.getAtomicNumber() === 6);
			if (isCenterLegal && node.getRenderOption)
				isCenterLegal = node.getRenderOption('nodeDisplayMode') !== Kekule.Render.NodeLabelDisplayMode.SHOWN;
			if (!isCenterLegal)
				return null;
		}

		var nodeCoord = node.getAbsCoordOfMode(coordMode, true); // allow borrow

		var nodeSeq = [];  // 0: Top, 1: Right, 2: Bottom: 3: Left
		var verticalNodeCount = 0;

		var _setNodeSeqItem = function(seq, index, value)
		{
			if (seq[index])  // already has item
				return false;
			else
			{
				seq[index] = value;
				return true;
			}
		};

		for (var i = 0, l = siblings.length; i < l; ++i)
		{
			var sibling = siblings[i];

			if (!ops.ignoreStructure)  // check bond, must be unstereo one (simple single covalence bond)
			{
				var bond = sibling.getConnectorTo(node);
				var bondStereo = bond.getStereo() || Kekule.BondStereo.NONE;
				var isLegalBond = (bond instanceof Kekule.Bond) && (bondStereo === Kekule.BondStereo.NONE);
				if (!isLegalBond)
					return null;
			}

			var siblingCoord = sibling.getAbsCoordOfMode(coordMode, true);  // allow borrow
			var delta = CU.substract(siblingCoord, nodeCoord);
			var absDeltaX = Math.abs(delta.x);
			var absDeltaY = Math.abs(delta.y);

			if (Kekule.NumUtils.isFloatEqual(absDeltaX, 0) && Kekule.NumUtils.isFloatEqual(absDeltaY, 0))  // x/y too small
				return null;

			var seqIndex;
			var bondLengthRatio;
			if (absDeltaX > absDeltaY)  // on horizontal line
			{
				bondLengthRatio = absDeltaY / absDeltaX;
				seqIndex = (delta.x > 0)? 1: 3;
			}
			else  // on vertical line
			{
				bondLengthRatio = absDeltaX / absDeltaY;
				seqIndex = (delta.y > 0)? 0: 2;
				++verticalNodeCount;
			}
			if (bondLengthRatio > allowedError)  // not vertical
				return null;
			else
			{
				if (!_setNodeSeqItem(nodeSeq, seqIndex, sibling))
					return null;
			}
		}

		// check that must be two vertical nodes (even when H is implicited in saccharide)
		if (verticalNodeCount !== 2 && !ops.allowExplicitVerticalHydrogen)
			return null;

		// sum up, returns successful result
		var result = {
			horizontalSiblings: [nodeSeq[3], nodeSeq[1]],
			verticalSiblings: [nodeSeq[0], nodeSeq[2]]
		};
		if (!ops.reversedDirection)
		{
			result.towardSiblings = result.horizontalSiblings;
			result.awaySiblings = result.verticalSiblings;
			result.implicitTowardSibling = (!nodeSeq[1] || !nodeSeq[3]);
			result.implicitAwaySibling = (!nodeSeq[0] || !nodeSeq[2]);
		}
		else
		{
			result.towardSiblings = result.verticalSiblings;
			result.awaySiblings = result.horizontalSiblings;
			result.implicitTowardSibling = (!nodeSeq[0] || !nodeSeq[2]);
			result.implicitAwaySibling = (!nodeSeq[1] || !nodeSeq[3]);
		}

		return result;
	},

	/**
	 * Returns rotation direction of a tetrahedron chiral center. Rotation follows the sequence of param siblings.
	 * @param {Kekule.ChemStructureNode} centerNode Center node used to get center coord. If this param is not set, geometric center
	 *   of sibling nodes will be used instead.
	 * @param {Kekule.ChemStructureNode} refSibling Sibling node to determine the looking direction.
	 * @param {Array} siblings Array of {@link Kekule.ChemStructureNode}, should not include refSibling.
	 * @param {hash} options Calculation option, may include the following fields: <br />
	 *   { <br />
	 *     coordMode: Int, use 2D or 3D coord of nodes. <br />
	 *     withImplicitSibling: Bool, whether there is a implicit sibling (e.g., implicit H atom). Coord of implicit node will be calculated from other sibling nodes.
	 *       If this param is true and param refSibling is null, this implicit node will be regarded as refSibling, otherwise the
	 *       implicit node will be regarded as the last one of siblings. <br />
	 *     implicitFischerProjection: Bool, whether the "+" cross of Fischer projection need to be recognized and take into consideration.
	 *       Default is true. Only works when coord mode is 2D.
	 *     fischerAllowedError: the allowed error when checking vertical and horizontal line in Fischer projection cross,
	 *       default is 0.08 (deltaY/deltaX or vice versa, about 4.5 degree).
	 *     reversedFischer: If true, the node on vertical line will be toward observer instead,
	 *     allowExplicitHydrogenInFischer: Whether the simplification Fischer projection in saccharide chain form is allowed (H is omitted from structure).
	 *       Default is true.
	 *     allowExplicitVerticalHydrogen: Whether the implicit hydrogen on vertical direction is allowed (used in SMILES generation).
	 *   }
	 * @returns {Int} Value from {@link Kekule.RotationDir}, clockwise, anti-clockwise or unknown.
	 */
	calcTetrahedronChiralCenterRotationDirectionEx: function(centerNode, refSibling, siblings, options)
	{
		var ops = Object.extend({
			implicitFischerProjection: true,
			allowExplicitHydrogenInFischer: true
		}, options);

		var coordMode = ops.coordMode;
		var withImplicitSibling = !!ops.withImplicitSibling;
		var refSiblingBehind = !!ops.refSiblingBehind;
		var implicitFischerProjection = !!ops.implicitFischerProjection;

		if (!coordMode)
		{
			var node = centerNode || refSibling || siblings[0];
			if (!node)
				return RD.UNKNOWN;
			if (node.hasCoord3D())
				coordMode = Kekule.CoordMode.COORD3D;  // default use 3D coord to calculate chirality
			else
				coordMode = Kekule.CoordMode.COORD2D;
		}

		var is2D = coordMode === Kekule.CoordMode.COORD2D;

		var explicitSiblingCount = siblings.length;
		var totalSiblingCount = explicitSiblingCount;
		if (refSibling)
			++totalSiblingCount;
		if (withImplicitSibling)
			++totalSiblingCount;

		if (totalSiblingCount < 4)  // not a tetrahedron
			return RD.UNKNOWN;

		var getNodeCoord = function(node, centerNode, centerCoord, coordMode, fischerInfo)
		{
			/*
			 var is2D = coordMode === Kekule.CoordMode.COORD2D;
			 if (is2D && !node.hasCoord2D())
			 coordMode = Kekule.CoordMode.COORD3D;
			 if (!is2D && !node.hasCoord3D())
			 coordMode = Kekule.CoordMode.COORD2D;
			 */
			if (coordMode !== Kekule.CoordMode.COORD2D)  // 3D, get 3D absolute coord directly
				return node.getAbsCoordOfMode(coordMode, true);  // allow borrow
			else  // coord 2D, add z value, consider wedge bonds and special "zIndex2D" property expliciting z stack of 2D sketch
			{
				var result = node.getAbsCoordOfMode(coordMode, true);  // allow borrow
				var defCoordZ;
				if (centerNode && centerCoord)
				{
					defCoordZ = centerCoord.z;
					var connector = node.getConnectorTo(centerNode);
					if (connector.getStereo)
					{
						var connDirection = connector.indexOfConnectedObj(node) - connector.indexOfConnectedObj(centerNode);
						var BS = Kekule.BondStereo;
						var bondStereo = connector.getStereo() || BS.NONE;
						if (bondStereo === BS.NONE && fischerInfo)  // with fischer projection info, there is implicit bond stereo
						{
							if (fischerInfo.towardSiblings.indexOf(node) >= 0)
								bondStereo = (connDirection < 0)? BS.UP_INVERTED: BS.UP;
							else if (fischerInfo.awaySiblings.indexOf(node) >= 0)
								bondStereo = (connDirection < 0)? BS.DOWN_INVERTED: BS.DOWN;
						}
						var wedgeDirs = [BS.UP, BS.UP_INVERTED, BS.DOWN, BS.DOWN_INVERTED];
						if (wedgeDirs.indexOf(bondStereo) >= 0)
						{
							if (connDirection < 0)
								bondStereo = BS.getInvertedDirection(bondStereo);

							// use a larger factor for wedge bond than the dashes one when wedge is considered prior in chiral calculation
							var zFactors = ops.wedgeBondPrior? [2, -2, -1, 1]: [1, -1, -1, 1];

							var distance = CU.getDistance(result, /*centerNode.getAbsCoordOfMode(coordMode)*/centerCoord);
							result.z = distance * zFactors[wedgeDirs.indexOf(bondStereo)];
						}
						else if ([BS.UP_OR_DOWN, BS.UP_OR_DOWN_INVERTED].indexOf(bondStereo) >= 0)  // direction not certain
							return null;  // return a special mark, can determinate angle calculation
					}
				}
				if (Kekule.ObjUtils.isUnset(result.z) && node.getZIndex2D)  // check zIndex2D property of node
				{
					result.z = node.getZIndex2D();
					if (Kekule.ObjUtils.isUnset(result.z))
						result.z = defCoordZ;
				}
				result.z = result.z || 0;
				return result;
			}
		};

		// calc all essetianl coords: centerCoord, coords of rotation siblings, coord of implict node
		var centerCoord = centerNode? getNodeCoord(centerNode, null, null, coordMode): null;
		var fischerOptions = {
			'allowedError': ops.fischerAllowedError,
			'reversedDirection': ops.reversedFischer,
			'allowExplicitHydrogen': ops.allowExplicitHydrogenInFischer,
			'allowExplicitVerticalHydrogen': ops.allowExplicitVerticalHydrogen
		};
		var allAroundSiblings = [].concat(siblings);
		if (refSibling)
			Kekule.ArrayUtils.pushUnique(allAroundSiblings, refSibling);
		var fischerInfo = (centerNode && ops.implicitFischerProjection)? Kekule.MolStereoUtils._getFischerProjectionInfo(centerNode, allAroundSiblings, fischerOptions): null;

		var coords = [];
		for (var i = 0; i < explicitSiblingCount; ++i)
		{
			var coord = getNodeCoord(siblings[i], centerNode, centerCoord, coordMode, fischerInfo);
			coords.push(coord);
		}
		var allExplicitSiblingCoords = AU.clone(coords);
		var refCoord = refSibling ? getNodeCoord(refSibling, centerNode, centerCoord, coordMode, fischerInfo) : null;
		if (refCoord)
			allExplicitSiblingCoords.push(refCoord);

		if (allExplicitSiblingCoords.indexOf(null) >= 0)  // coords has null value (special mark returned by function getNodeCoord, can not calculate
			return RD.UNKNOWN;

		if (!centerCoord)
		{
			var coordSum = {};
			for (var i = 0, l = allExplicitSiblingCoords.length; i < l; ++i)
			{
				coordSum = CU.add(allExplicitSiblingCoords[i], coordSum);
			}
			centerCoord = CU.divide(coordSum, allExplicitSiblingCoords.length);
		}

		// turn all coords to relative one to centerCoord, affect items of both allExplicitSiblingCoords and coords
		var wedgeNodeCount = 0;
		for (var i = 0, l = allExplicitSiblingCoords.length; i < l; ++i)
		{
			var oldCoord = allExplicitSiblingCoords[i];
			var c = CU.substract(oldCoord, centerCoord);
			oldCoord.x = c.x;
			oldCoord.y = c.y;
			oldCoord.z = c.z;
			if (is2D && !!c.z)  // z coord not 0 in 2D mode
				++wedgeNodeCount;
		}
		if (is2D && wedgeNodeCount <= 0)  // in 2D mode but with no wedge bond, can not determine
			return RD.UNKNOWN;

		centerCoord = {'x': 0, 'y': 0, 'z': 0};

		if (withImplicitSibling)  // calc coord of implicit siblings
		{
			var maxAbsZCoord = 0;
			var coordSum = {};
			for (var i = 0, l = allExplicitSiblingCoords.length; i < l; ++i)
			{
				coordSum = CU.add(allExplicitSiblingCoords[i], coordSum);
				maxAbsZCoord = Math.max(maxAbsZCoord, allExplicitSiblingCoords[i].z || 0);
			}
			var implicitCoord = CU.substract({'x': 0, 'y': 0, 'z': 0}, coordSum);

			if (fischerInfo)
			{
				if (fischerInfo.implicitTowardSibling || fischerInfo.implicitTowardSibling)  // the implicit coord is on Fischer projection
				{
					implicitCoord.z = fischerInfo.implicitTowardSibling? maxAbsZCoord: -maxAbsZCoord;
				}
			}

			if (!refSibling)
				refCoord = implicitCoord;
			else
				coords.push(implicitCoord);
		}

		// now we have all essential coords, begin the calculation
		if (coords.length === 3 && coords.indexOf(null) < 0)
			return Kekule.MolStereoUtils.calcRotationDirection(centerCoord, refCoord, coords[0], coords[1], coords[2], refSiblingBehind);
		else
			return RD.UNKNOWN;
	},
	/**
	 * Returns rotation direction of a tetrahedron chiral center. Rotation follows the sequence of param siblings.
	 * @param {Int} coordMode Use 2D or 3D coord of nodes.
	 * @param {Kekule.ChemStructureNode} centerNode Center node used to get center coord. If this param is not set, geometric center
	 *   of sibling nodes will be used instead.
	 * @param {Kekule.ChemStructureNode} refSibling Sibling node to determine the looking direction.
	 * @param {Array} siblings Array of {@link Kekule.ChemStructureNode}, should not include refSibling.
	 * @param {Bool} withImplicitSibling Whether there is a implicit sibling (e.g., implicit H atom). Coord of implicit node will be calculated from other sibling nodes.
	 *   If this param is true and param refSibling is null, this implicit node will be regarded as refSibling, otherwise the
	 *   implicit node will be regarded as the last one of siblings.
	 * @param {Hash} additionalOptions
	 * @param {Bool} refSiblingBehind Whether put refCoord behide center coord.
	 * @returns {Int} Value from {@link Kekule.RotationDir}, clockwise, anti-clockwise or unknown.
	 */
	calcTetrahedronChiralCenterRotationDirection: function(coordMode, centerNode, refSibling, siblings, withImplicitSibling, refSiblingBehind, additionalOptions)
	{
		var ops = Object.create(additionalOptions);
		return Kekule.MolStereoUtils.calcTetrahedronChiralCenterRotationDirectionEx(centerNode, refSibling, siblings, Object.extend(ops, {
			'coordMode': coordMode,
			'withImplicitSibling': withImplicitSibling,
			'refSiblingBehind': refSiblingBehind
		}));
	},

	/**
	 * Calc and returns MDL stereo parity of a chiral node.
	 * Note: the parent structure fragment should be canonicalized.
	 * @param {Kekule.ChemStructureNode} node
	 * @param {Int} coordMode Use 2D or 3D coord to calculate.
	 *
	 * @param {Hash} options Chiral calculation options, including:
	 *   { <br/>
	 *     ignoreChiralCheck: Bool, Whether bypass the check to ensure node is a chiral center. <br/>
	 *     implicitFischerProjection: Bool, whether the "+" cross of Fischer projection need to be recognized and take into consideration.
	 *       Only works when coord mode is 2D. <br/>
	 *     fischerAllowedError: the allowed error when checking vertical and horizontal line in Fischer projection cross,
	 *       default is 0.08 (deltaY/deltaX or vice versa, about 4.5 degree). <br/>
	 *     reversedFischer: If true, the node on vertical line will be toward observer instead,
	 *     allowExplicitHydrogenInFischer: Whether the simplification Fischer projection in saccharide chain form is allowed (H is omitted from structure). <br/>
	 *   }
	 * //@param {Kekule.StructureFragment} parentMol
	 * @returns {Int} Value from {@link Kekule.StereoParity}.
	 */
	calcTetrahedronChiralNodeParity: function(node, coordMode, options)
	{
		var ops = Object.create(options || null);
		if (!coordMode)
		{
			if (node.hasCoord3D())
				coordMode = Kekule.CoordMode.COORD3D;  // default use 3D coord to calculate chirality
			else
				coordMode = Kekule.CoordMode.COORD2D;
		}
		ops.coordMode = coordMode;
		ops.refSiblingBehind = true;


		var KS = Kekule.StereoParity;
		/*
		if (!parentMol)
			parentMol = node.getParent();
		*/
		var ignoreChiralCheck = ops.ignoreChiralCheck;
		if (!ignoreChiralCheck && !Kekule.MolStereoUtils.isChiralNode(node))
			return KS.NONE;
		var siblings = node.getLinkedChemNodes();

		if (coordMode === Kekule.CoordMode.COORD2D && options.strictStereoAtomGeometry)  // ensure the bond stereo are legal
		{
			if (!Kekule.MolStereoUtils._isSiblingBond2DGeometryLegal(node, siblings))
			{
				return KS.UNKNOWN;
			}
		}

		var hydroCount = node.getHydrogenCount();
		ops.withImplicitSibling = !!hydroCount || (siblings.length < 4);  // S/P, may three sibling with a electron pair
		//var allSiblingCount = siblings.length + hydroCount;
		//var atomicSymbol = node.getSymbol? node.getSymbol(): null;
		siblings.sort(function(a, b){
			return -((a.getCanonicalizationIndex() || 0) - (b.getCanonicalizationIndex() || 0));
		});
		var refSibling = ops.withImplicitSibling? null: siblings[3];
		siblings = siblings.slice(0, 3);
		//var rotationDir = Kekule.MolStereoUtils.calcTetrahedronChiralCenterRotationDirection(coordMode, node, refSibling, siblings, withImplicitNode, true);
		var rotationDir = Kekule.MolStereoUtils.calcTetrahedronChiralCenterRotationDirectionEx(node, refSibling, siblings, ops);
		return (rotationDir === RD.CLOCKWISE)? KS.ODD:
			(rotationDir === RD.ANTICLOCKWISE)? KS.EVEN:
				KS.UNKNOWN;
	},
	/** @private */
	_isSiblingBond2DGeometryLegal: function(node, siblings)
	{
		var connectors = [];
		var BS = Kekule.BondStereo;
		var checkingBondStereos = [BS.NONE, /*BS.UP, BS.UP_INVERTED, BS.DOWN, BS.DOWN_INVERTED,*/ BS.CLOSER];
		var checkingBondStereosMaxCounts = [2, 2];
		var stereoBondCounts = [];

		for (var i = 0, l = siblings.length; i < l; ++i)
		{
			var sibling = siblings[i];
			if (sibling.getZIndex2D())  // if sibling has explicit non-zero index, ignore
			{
				continue;
			}
			else
			{
				var bond = node.getConnectorTo(sibling);
				if (bond.getStereo)
				{
					var bondStereo = bond.getStereo();
					if (checkingBondStereos.indexOf(bondStereo) >= 0)
					{
						if (!stereoBondCounts[bondStereo])
							stereoBondCounts[bondStereo] = 1;
						else
						{
							++stereoBondCounts[bondStereo];
							if (stereoBondCounts[bondStereo] > checkingBondStereosMaxCounts[bondStereo])  // more than max count of same stereo, these bonds is implied on the same planet, wrong structure
							{
								return false;
							}
						}
					}
				}
			}
		}
		return true;
	},

	/**
	 * Detect and mark parity of all chiral nodes in structure fragment.
	 * @param {Variant} structFragmentOrCtab
	 * @param {Int} coordMode Use 2D or 3D coord to calculate.
	 * @param {Bool} ignoreCanonicalization If false, ctab will be canonicalized before perception.
	 * @param {Hash} options Chiral calculation options, including:
	 *   { <br/>
	 *     implicitFischerProjection: Bool, whether the "+" cross of Fischer projection need to be recognized and take into consideration.
	 *       Only works when coord mode is 2D. <br/>
	 *     fischerAllowedError: the allowed error when checking vertical and horizontal line in Fischer projection cross,
	 *       default is 0.08 (deltaY/deltaX or vice versa, about 4.5 degree). <br/>
	 *     reversedFischer: If true, the node on vertical line will be toward observer instead,
	 *     allowExplicitHydrogenInFischer: Whether the simplification Fischer projection in saccharide chain form is allowed (H is omitted from structure). <br/>
	 *   }
	 * @returns {Array} Array of all chiral nodes.
	 * @private
	 */
	doPerceiveChiralNodes: function(structFragmentOrCtab, coordMode, ignoreCanonicalization, options)
	{
		var ops = Object.create(options || null);
		var parityCalcOps = Object.create(ops);
		parityCalcOps.ignoreChiralCheck = true;
		var result = Kekule.MolStereoUtils.doFindChiralNodes(structFragmentOrCtab, ignoreCanonicalization);
		structFragmentOrCtab.beginUpdate();
		try
		{
			if (result && result.length)
			{
				for (var i = 0, l = result.length; i < l; ++i)
				{
					var n = result[i];
					var parity = Kekule.MolStereoUtils.calcTetrahedronChiralNodeParity(n, coordMode, parityCalcOps);
					if (n.setParity)
					{
						//console.log('set parity', n.getId(), parity);
						n.setParity(parity);
					}
				}
			}
		}
		finally
		{
			structFragmentOrCtab.endUpdate();
		}
		return result;
	},

	/**
	 * Detect and mark parity of all chiral nodes/connectors in structure fragment.
	 * @param {Variant} structFragmentOrCtab
	 * @param {Int} coordMode Use 2D or 3D coord to calculate.
	 * @param {Bool} ignoreCanonicalization If false, ctab will be canonicalized before perception.
	 * @param {Hash} options Chiral calculation options, including:
	 *   { <br/>
	 *     useFlattenedShadow: Bool, use flatterned shadow structure to perceive stereo. Default is true. <br />
	 *     perceiveStereoConnectors: Bool, whether find out the all stereo bonds, default is true. <br />
	 *     perceiveChiralNodes: Bool, whether find out all stereo atoms, default is true. <br />
	 *     calcParity: Bool, whether calculate the parity of stereo bonds and node found, default is true. <br />
	 *     strictStereoBondGeometry: Bool, if true, the illegal bond geometry will be ignored in calculation (e.g., two connected atoms on same side of a double bond). <br />
	 *     strictStereoAtomGeometry:
	 *     implicitFischerProjection: Bool, whether the "+" cross of Fischer projection need to be recognized and take into consideration.
	 *       Only works when coord mode is 2D. <br/>
	 *     fischerAllowedError: the allowed error when checking vertical and horizontal line in Fischer projection cross,
	 *       default is 0.08 (deltaY/deltaX or vice versa, about 4.5 degree). <br/>
	 *     reversedFischer: If true, the node on vertical line will be toward observer instead. <br />
	 *     allowExplicitHydrogenInFischer: Whether the simplification Fischer projection in saccharide chain form is allowed (H is omitted from structure). <br/>
	 *   }
	 * @returns {Array} Array of all nodes and connectors with special stereo parities.
	 */
	perceiveStereos: function(structFragmentOrCtab, coordMode, ignoreCanonicalization, options)
	{
		/*
		var ops = Object.extend({
			useFlattenedShadow: true,
			perceiveStereoConnectors: true,
			perceiveChiralNodes: true,
			calcParity: true
		}, options);
		*/
		var ops = Object.extend(Object.extend({}, Kekule.globalOptions.algorithm.stereoPerception), options);

		var result;

		var srcStructFragment = (structFragmentOrCtab instanceof Kekule.StructureConnectionTable) ? structFragmentOrCtab.getParent() : structFragmentOrCtab;

		var targetFragment;
		if (ops.useFlattenedShadow)
		{
			targetFragment = srcStructFragment.getFlattenedShadowFragment(true);
		}
		else
			targetFragment = srcStructFragment;

		// Canonicalize first
		if (!ignoreCanonicalization)
		{
			Kekule.canonicalizer.canonicalize(targetFragment, 'morganEx');
		}

		targetFragment.beginUpdate();
		try
		{
			// then perceive and calculate stereo
			var stereoBonds, chiralNodes;
			if (ops.perceiveStereoConnectors)
			{
				if (ops.calcParity)
					stereoBonds = Kekule.MolStereoUtils.doPerceiveStereoConnectors(targetFragment, coordMode, true, ops.strictStereoBondGeometry);
				else
					stereoBonds = Kekule.MolStereoUtils.doFindStereoBonds(targetFragment, true);
			}
			if (ops.perceiveChiralNodes)
			{
				if (ops.calcParity)
					chiralNodes = Kekule.MolStereoUtils.doPerceiveChiralNodes(targetFragment, coordMode, true, ops);
				else
					chiralNodes = Kekule.MolStereoUtils.doFindChiralNodes(targetFragment, true);
			}
			var stereoObjs = (chiralNodes || []).concat(stereoBonds || []);
			//console.log(ops, stereoBonds, chiralNodes, stereoObjs);

			if (ops.useFlattenedShadow && !srcStructFragment.getFlattenedShadowOnSelf())  // map back to src fragment
			{
				result = [];
				srcStructFragment.beginUpdate();
				try
				{
					//var shadowInfo = srcStructFragment.getFlattenedShadow();
					for (var i = 0, l = stereoObjs.length; i < l; ++i)
					{
						var srcObj = srcStructFragment.getFlatternedShadowSourceObj(stereoObjs[i]);
						if (srcObj)
						{
							if (ops.calcParity)
								srcObj.setParity(stereoObjs[i].getParity());
							result.push(srcObj);
						}
					}
				}
				finally
				{
					srcStructFragment.endUpdate();
				}
			}
			else
				result = stereoObjs;
		}
		finally
		{
			targetFragment.endUpdate();
		}

		return result;

		/*
		var stereoBonds = Kekule.MolStereoUtils.perceiveStereoConnectors(structFragmentOrCtab, coordMode, ignoreCanonicalization);
		var chiralNodes = Kekule.MolStereoUtils.perceiveChiralNodes(structFragmentOrCtab, coordMode, true, options);  // already canonicalized when finding bonds
		if (stereoBonds)
			result = result.concat(stereoBonds);
		if (chiralNodes)
			result = result.concat(chiralNodes);
		//console.log(result, stereoBonds, chiralNodes);
		return result;
		*/
	},

	/**
	 * Find stereo double bond in struct fragment or ctab.
	 * Note, before finding, if param ignoreCanonicalization is false,
	 * the struct fragment will be canonicalized by morgan algorithm to set node cano index.
	 * @param {Variant} structFragmentOrCtab
	 * @param {Bool} ignoreCanonicalization
	 * @returns {Array}
	 * @deprecated
	 */
	findStereoConnectors: function(structFragmentOrCtab, ignoreCanonicalization)
	{
		return Kekule.MolStereoUtils.perceiveStereos(structFragmentOrCtab, null, ignoreCanonicalization,
				{
					perceiveStereoConnectors: true,
					perceiveChiralNodes: false,
					calcParity: false
				});
	},

	/**
	 * Detect and mark parity of all stereo bonds in structure fragment.
	 * @param {Variant} structFragmentOrCtab
	 * @param {Int} coordMode Use 2D or 3D coord to calculate.
	 * @param {Bool} ignoreCanonicalization If false, ctab will be canonicalized before perception.
	 * @param {Bool} strictStereoBondGeometry
	 * @returns {Array} Array of all chiral nodes.
	 * @deprecated
	 */
	perceiveStereoConnectors: function(structFragmentOrCtab, coordMode, ignoreCanonicalization, strictStereoBondGeometry)
	{
		return Kekule.MolStereoUtils.perceiveStereos(structFragmentOrCtab, coordMode, ignoreCanonicalization,
				{
					'perceiveStereoConnectors': true,
					'perceiveChiralNodes': false,
					'calcParity': true,
					'strictStereoBondGeometry': strictStereoBondGeometry
				});
	},

	/**
	 * Find chiral nodes in struct fragment or ctab.
	 * Note, before finding, if param ignoreCanonicalization is false,
	 * the struct fragment will be canonicalized by morgan algorithm to set node cano index.
	 * @param {Variant} structFragmentOrCtab
	 * @param {Bool} ignoreCanonicalization
	 * @returns {Array}
	 * @deprecated
	 */
	findChiralNodes: function(structFragmentOrCtab, ignoreCanonicalization)
	{
		return Kekule.MolStereoUtils.perceiveStereos(structFragmentOrCtab, null, ignoreCanonicalization,
				{
					perceiveStereoConnectors: false,
					perceiveChiralNodes: true,
					calcParity: false
				});
	},

	/**
	 * Detect and mark parity of all chiral nodes in structure fragment.
	 * @param {Variant} structFragmentOrCtab
	 * @param {Int} coordMode Use 2D or 3D coord to calculate.
	 * @param {Bool} ignoreCanonicalization If false, ctab will be canonicalized before perception.
	 * @param {Hash} options Chiral calculation options, including:
	 *   { <br/>
	 *     implicitFischerProjection: Bool, whether the "+" cross of Fischer projection need to be recognized and take into consideration.
	 *       Only works when coord mode is 2D. <br/>
	 *     fischerAllowedError: the allowed error when checking vertical and horizontal line in Fischer projection cross,
	 *       default is 0.08 (deltaY/deltaX or vice versa, about 4.5 degree). <br/>
	 *     reversedFischer: If true, the node on vertical line will be toward observer instead,
	 *     allowExplicitHydrogenInFischer: Whether the simplification Fischer projection in saccharide chain form is allowed (H is omitted from structure). <br/>
	 *     strictStereoAtomGeometry
	 *   }
	 * @returns {Array} Array of all chiral nodes.
	 * @deprecated
	 */
	perceiveChiralNodes: function(structFragmentOrCtab, coordMode, ignoreCanonicalization, options)
	{
		var ops = Object.create(options || null);
		ops = Object.extend(ops, {
			perceiveStereoConnectors: false,
			perceiveChiralNodes: true,
			calcParity: true
		});
		return Kekule.MolStereoUtils.perceiveStereos(structFragmentOrCtab, coordMode, ignoreCanonicalization, ops);
	}
};

/**
 * An extensive canonicalization indexer class based on Morgan algorithm but consider of stereo.
 * @arguments Kekule.CanonicalizationMorganIndexer
 * @class
 */
Kekule.CanonicalizationMorganExIndexer = Class.create(Kekule.CanonicalizationMorganIndexer,
/** @lends Kekule.CanonicalizationMorganExIndexer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.CanonicalizationMorganExIndexer',
	/** @ignore */
	doExecute: function($super, ctab)
	{
		// do a normal morgan indexer first
		//$super(ctab);
		var graphInfo = this.doCalcGraphAndEcResult(ctab);
		this.doExecuteOnGraphEcResult(graphInfo.graph, graphInfo.ecMapping, graphInfo.vertexGroup);

		//var nodes = ctab.getNodes();
		var nodes = ctab.getNonHydrogenNodes();
		var sortedNodes = this._groupNodesByCanoIndex(nodes);
		// then detect stereo factors based on indexes
		var stereoObjs = null;
		var stereoObjCount = 0;
		stereoObjs = Kekule.MolStereoUtils.perceiveStereos(ctab, null, true) || [];  // do not canonicalize again
		while (stereoObjCount < stereoObjs.length)  // repeat until no more stereo objects is found
		{
			// if new stereo objects is found, reindex nodes via stereo information
			sortedNodes = this._regroupSortedNodes(sortedNodes);
			this._setCanonicalizationIndexToNodeGroups(sortedNodes);

			stereoObjCount = stereoObjs.length;
			stereoObjs = Kekule.MolStereoUtils.perceiveStereos(ctab, null, true) || [];
			//console.log('here', stereoObjCount, stereoObjs.length);
		}
		if (stereoObjCount > 0)  // has stereo, need to do node sort again
		{
			//$super(ctab);
			this.doExecuteOnGraphEcResult(graphInfo.graph, graphInfo.ecMapping, graphInfo.vertexGroup);
		}
	},

	/** @private */
	_groupNodesByCanoIndex: function(nodes)
	{
		return AU.group(nodes, function(a, b) {
			return (a.getCanonicalizationIndex() || -1) - (b.getCanonicalizationIndex() || -1);
		});
	},
	/** @private */
	_regroupSortedNodes: function(sortedNodes)
	{
		var oldNodeGroupCount, newNodeGroupCount;
		var result = sortedNodes;
		do
		{
			oldNodeGroupCount = result.length;
			result = this._doRegroupSortedNodes(result);
			//console.log('do regroup', result);
			newNodeGroupCount = result.length;
		}
		while (newNodeGroupCount > oldNodeGroupCount);

		return result;
	},
	/** @private */
	_doRegroupSortedNodes: function(sortedNodes)
	{
		var result = [];
		for (var i = 0, l = sortedNodes.length; i < l; ++i)
		{
			var n = sortedNodes[i];
			if (!AU.isArray(n))
			{
				result.push(n);
			}
			else
			{
				/*
				var getConnectorCompareValues = function(node)
				{
					var result = [];
					for (var i = 0, l = node.getLinkedConnectorCount(); i < l; ++i)
					{
						var conn = node.getLinkedConnectorAt(i);
						result.push(Kekule.UnivChemStructObjComparer.getCompareValue(conn));
					}
					result.sort(function(a, b) { return a - b; });
					return result;
				};
				*/
				var resorted = AU.group(n, function(a, b) {
					//var result = Kekule.UnivChemStructObjComparer.compare(a, b);
					var result = a.compareStructure(b);
					if (result === 0)  // still can not distinguish, check linked bonds
					{
						/*
						var cvaluesA = getConnectorCompareValues(a);
						var cvaluesB = getConnectorCompareValues(b);
						result = AU.compare(cvaluesA, cvaluesB);
            */

						var connsA = a.getLinkedConnectors();
						var connsB = b.getLinkedConnectors();
						result = Kekule.ObjComparer.compareStructure(connsA, connsB);
					}
					return result;
				});
				result = result.concat(resorted);
			}
		}
		return result;
	}
});
// register morganEx canonicalizer, and as default
Kekule.canonicalizer.registerExecutor('morganEx', [Kekule.CanonicalizationMorganExIndexer, Kekule.CanonicalizationMorganNodeSorter], true);

/** @ignore */
ClassEx.extend(Kekule.StructureFragment,
/** @lends Kekule.StructureFragment# */
{
	/**
	 * Detect and mark parity of all chiral nodes in structure fragment.
	 * @param {Int} coordMode Use 2D or 3D coord to calculate.
	 * @param {Bool} ignoreCanonicalization: Bool. If false, ctab will be canonicalized before perception. <br/>
	 * @param {Hash} options Chiral calculation options, including:
	 *   { <br/>
	 *     implicitFischerProjection: Bool, whether the "+" cross of Fischer projection need to be recognized and take into consideration.
	 *       Only works when coord mode is 2D. <br/>
	 *     fischerAllowedError: the allowed error when checking vertical and horizontal line in Fischer projection cross,
	 *       default is 0.08 (deltaY/deltaX or vice versa, about 4.5 degree). <br/>
	 *     reversedFischer: If true, the node on vertical line will be toward observer instead,
	 *     allowExplicitHydrogenInFischer: Whether the simplification Fischer projection in saccharide chain form is allowed (H is omitted from structure). <br/>
	 *   }
	 * @returns {Array} Array of all chiral nodes.
	 */
	perceiveChiralNodes: function(coordMode, ignoreCanonicalization, options)
	{
		return Kekule.MolStereoUtils.perceiveChiralNodes(this, coordMode, ignoreCanonicalization, options);
	},
	/**
	 * Detect and mark parity of all stereo connectors in structure fragment.
	 * @param {Int} coordMode Use 2D or 3D coord to calculate.
	 * @returns {Array} Array of all chiral nodes.
	 */
	perceiveStereoConnectors: function(coordMode, ignoreCanonicalization)
	{
		return Kekule.MolStereoUtils.perceiveStereoConnectors(this, coordMode, ignoreCanonicalization);
	},
	/**
	 * Detect and mark parity of all chiral nodes/connectors in structure fragment.
	 * @param {Int} coordMode Use 2D or 3D coord to calculate.
	 * @param {Bool} ignoreCanonicalization: Bool. If false, ctab will be canonicalized before perception. <br/>
	 * @param {Hash} options Chiral calculation options, including:
	 *   { <br/>
	 *     implicitFischerProjection: Bool, whether the "+" cross of Fischer projection need to be recognized and take into consideration.
	 *       Only works when coord mode is 2D. <br/>
	 *     fischerAllowedError: the allowed error when checking vertical and horizontal line in Fischer projection cross,
	 *       default is 0.08 (deltaY/deltaX or vice versa, about 4.5 degree). <br/>
	 *     reversedFischer: If true, the node on vertical line will be toward observer instead,
	 *     allowExplicitHydrogenInFischer: Whether the simplification Fischer projection in saccharide chain form is allowed (H is omitted from structure). <br/>
	 *   }
	 * @returns {Array} Array of all nodes and connectors with special stereo parities.
	 */
	perceiveStereos: function(coordMode, ignoreCanonicalization, options)
	{
		return Kekule.MolStereoUtils.perceiveStereos(this, coordMode, ignoreCanonicalization, options);
	}
});

})();
