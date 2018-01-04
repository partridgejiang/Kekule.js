/**
 * @fileoverview
 * File for supporting reading/writing molecule to SMILES format.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /core/kekule.elements.js
 * requires /core/kekule.electrons.js
 * requires /core/kekule.structures.js
 * requires /algorithm/kekule.graph.js
 * requires /algorithm/kekule.aromatics.js
 * requires /io/kekule.io.js
 * requires /localization
 */

(function(){
"use strict";

var AU = Kekule.ArrayUtils;

/**
 * Some constants for SMILES supporting.
 * @class
 */
Kekule.IO.SMILES = {
	ATOM_BRACKET_LEFT: '[',
	ATOM_BRACKET_RIGHT: ']',
	ATOM_WILDCARD: '*',
	ATOM_H: 'H',
	ORGAN_SUBSET_ATOMS: ['B', 'C', 'N', 'O', 'S', 'P', 'F', 'Cl', 'Br', 'I'],
	AROMATIC_SUBSET_ATOMS: ['B', 'C', 'N', 'O', 'S', 'P'],
	BOND_SINGLE: '-',
	BOND_DOUBLE: '=',
	BOND_TRIPLE: '#',
	BOND_QUAD: '$',
	BOND_AROMATIC: ':',
	BOND_FAKE: '.',
	RING_BOND_TWO_DIGIT_NO_PREFIX: '%',
	BRANCH_BRACKET_LEFT: '(',
	BRANCH_BRACKET_RIGHT: ')',
	ROTATION_DIR_CLOCKWISE: '@@',
	ROTATION_DIR_ANTICLOCKWISE: '@',
	DIRECTION_BOND_SYMBOLS: ['/', '\\']
};

/** @private */
var SMI = Kekule.IO.SMILES;


/**
 * A helper class for SMILES I/O.
 * @class
 */
Kekule.IO.SmilesUtils = {
	/**
	 * Create a depth first spanning tree, and record the longest path from startingVertex
	 * as the main chain for SMILES.
	 * @param {Kekule.Graph} graph
	 * @param {Kekule.GraphVertex} startingVertex
	 * @returns {Array} Each item is a hash that contains the follow fields:
	 *   {
	 *     vertexes: Array of all found vertexes.
	 *     edges: Array of all found edges.
	 *     longestPath: {
	 *       vertexes,
	 *       //edges,
	 *       length: edge count of longest path
	 *     }
	 *   }
	 *   As the graph may be unconnected, so spanning tree result may be more than one.
	 */
	createGraphDepthSpanningTreesEx: function(graph, startingVertex)
	{
		var VISITED_KEY = '__$visitedEx__';

		var _doTravers = function(startingVertex)
		{
			var result = {
				vertexes: [],
				edges: [],
				longestPath: {vertexes: [], edges: [], length: 0}
			};
			var vertex = startingVertex;

			//var vertexUnvisitedBefore = false;
			if (!vertex.getData(VISITED_KEY))
			{
				result.vertexes.push(vertex);
				vertex.setData(VISITED_KEY, true);
				//vertexUnvisitedBefore = true;
			}

			var edges = vertex.getEdges();
			var unvisitedVertexes = [];
			var longestTargetNeighborEdge;
			for (var i = 0, l = edges.length; i < l; ++i)
			{
				var edge = edges[i];
				var neighbor = vertex.getNeighborOnEdge(edge);
				if (!neighbor.getData(VISITED_KEY))
				{
					result.vertexes.push(neighbor);
					result.edges.push(edge);
					neighbor.setData(VISITED_KEY, true);
					//result.longestPath.length

					var nextResult = _doTravers(neighbor);
					result.vertexes = result.vertexes.concat(nextResult.vertexes);
					result.edges = result.edges.concat(nextResult.edges);
					if (nextResult.longestPath.length > result.longestPath.length || !result.longestPath.length)
					{
						result.longestPath.vertexes = nextResult.longestPath.vertexes;
						result.longestPath.edges = nextResult.longestPath.edges;
						result.longestPath.length = nextResult.longestPath.length;
						longestTargetNeighborEdge = edge;
					}
				}
			}

			if (longestTargetNeighborEdge)
			{
				result.longestPath.edges.unshift(longestTargetNeighborEdge);
				result.longestPath.length = (result.longestPath.length || 0) + 1;
			}
			result.longestPath.vertexes.unshift(vertex);

			return result;
		};

		var remainingVertexes = AU.clone(graph.getVertexes());
		// init
		for (var i = 0, l = remainingVertexes.length; i < l; ++i)
		{
			remainingVertexes[i].setData(VISITED_KEY, false);
		}
		var result = [];
		while (remainingVertexes.length)
		{
			var currVertex;
			if (startingVertex && (remainingVertexes.indexOf(startingVertex) >= 0))
				currVertex = startingVertex;
			else
				currVertex = remainingVertexes[0];
			//while (remainingVertexes.length)
			{
				var seq = {
					vertexes: [],
					edges: [],
					longestPath: {vertexes: [], edges: [], length: 0}
				};
				var partialResult = _doTravers(currVertex);
				seq.vertexes = seq.vertexes.concat(partialResult.vertexes);
				seq.edges = seq.edges.concat(partialResult.edges);
				seq.longestPath.length = (seq.longestPath.length || 0) + partialResult.longestPath.length;
				seq.longestPath.vertexes = seq.longestPath.vertexes.concat(partialResult.longestPath.vertexes);
				seq.longestPath.edges = seq.longestPath.edges.concat(partialResult.longestPath.edges);
				remainingVertexes = AU.exclude(remainingVertexes, partialResult.vertexes);
			}
			result.push(seq);
		}
		return result;
	}
};


/**
 * Writer for saving molecule to SMILES format text data.
 * Use smilesMolWriter.writeData(mol) to save molecule to SMILES text.
 * @class
 * @augments Kekule.IO.ChemDataWriter
 */
Kekule.IO.SmilesMolWriter = Class.create(Kekule.IO.ChemDataWriter,
/** @lends Kekule.IO.SmilesMolWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.SmilesMolWriter',
	/** @private */
	doWriteData: function(obj, dataType, format, options)
	{
		/*
		 if (dataType != Kekule.IO.ChemDataType.TEXT) // can not understand data other than text
		 {
		 Kekule.error(Kekule.ErrorMsg.MDL_OUTPUT_DATATYPE_NOT_TEXT);
		 return null;
		 }
		 else
		 */
		{
			/*
			var writer = new Kekule.IO.MdlMoleculeWriter(this.getMdlVersion(), this.getCoordMode());
			return writer.writeBlock(obj);
			*/
			var mol = this.getMolecule(obj);
			return this.writeStructFragment(mol, options);
		}
	},
	/**
	 * Get molecule data from an object.
	 * @param {Variant} obj
	 */
	getMolecule: function(obj)
	{
		return Kekule.ChemStructureUtils.getTotalStructFragment(obj);
	},

	/** @private */
	writeStructFragment: function(mol, options)
	{
		if (mol.hasCtab())
		{
			// standardize molecule and mark the aromatic rings
			var dupMol = mol.clone();
			//var aromaticRings = dupMol.perceiveAromaticRings();
			if (dupMol.standardize)
			{
				dupMol.standardize();
			}
			var aromaticNodes = [];
			var aromaticConnectors = [];
			if (dupMol.getAromaticRings)
			{
				var aromaticRings = dupMol.getAromaticRings();
				for (var i = 0, l = aromaticRings.length; i < l; ++i)
				{
					var ring = aromaticRings[i];
					AU.pushUnique(aromaticNodes, ring.nodes);
					AU.pushUnique(aromaticConnectors, ring.connectors);
				}
			}

			var molGraph = Kekule.GraphAdaptUtils.ctabToGraph(dupMol.getCtab(), null, {expandSubStructures: true, ignoreBondedHydrogen: true});
			// get the longest path as the main chain, starting from the last vertex
			var graphVertexes = molGraph.getVertexes();
			var graphEdges = molGraph.getEdges();
			var startingVertex = graphVertexes[graphVertexes.length - 1];
			var depthSpanningTrees = Kekule.IO.SmilesUtils.createGraphDepthSpanningTreesEx(molGraph, startingVertex);

			// mark all the ring edges
			//var ringEdges = AU.exclude(graphEdges, depthSpanningTree.edges);


			var ringEdgeRepo = [];
			var result;
			for (var i = 0, l = depthSpanningTrees.length; i < l; ++i)
			{
				var depthSpanningTree = depthSpanningTrees[i];
				var mainChainPath = depthSpanningTree.longestPath;
				//console.log(mainChainPath);
				var partResult = '';
				// enumeration all vertexes and connectors
				//var remainingVertexes = AU.clone(depthSpanningTree.vertexes);
				//var remainingEdges = AU.clone(depthSpanningTree.edges);
				var currVertex = mainChainPath.vertexes[0]; //startingVertex;
				partResult = this._writeMolVertex(currVertex, null, mainChainPath.edges, depthSpanningTree.edges, ringEdgeRepo, aromaticNodes, aromaticConnectors, options);

				if (i === 0)
					result = partResult;
				else
					result += SMI.BOND_FAKE + partResult;
			}
			return result;
		}
		else
			return '';
	},
	/** @private */
	_writeMolVertex: function(vertex, prevEdge, mainChainEdges, spanningTreeEdges, ringEdgeRepo, aromaticNodes, aromaticRingConnectors, options)
	{
		var node = vertex.getData('object');
		var edges = vertex.getEdges();
		//var edges = AU.intersect(vertex.getEdges(), spanningTreeEdges);
		var mainChainStr;
		var branchStrs = [];
		var mainChainVertex;
		var branchVertexes = [];
		var ringStrs = [];
		var ringedVertexes = [];
		var connectorParity;
		var nextBondStereoStr = '';
		var ignoreBondStereo = options.ignoreStereoBond;
		if (Kekule.ObjUtils.isUnset(ignoreBondStereo))
			ignoreBondStereo = options.ignoreStereo || false;
		for (var i = edges.length - 1; i >= 0; --i)
		{
			var edge = edges[i];
			if (edge === prevEdge)
				continue;

			var connector = edge.getData('object');
			if (!ignoreBondStereo && connector.getParity && connector.getParity())  // next is stereo double bond
			{
				var keyNodes = Kekule.MolStereoUtils.getStereoBondKeyNodes(connector);
				if (keyNodes)
				{
					var nextVertex = vertex.getNeighborOnEdge(edge);
					var nextNode = nextVertex.getData('object');
					var initDirSymbols = this._getStereoDoubleBondInitialDirectionSymbols(connector);
					var dirSymbol = initDirSymbols[0];
					if (keyNodes.indexOf(nextNode) < 0)
						dirSymbol = this._getInvertBondDirectionSymbol(dirSymbol);
				}
				nextBondStereoStr = dirSymbol;
			}

			if (spanningTreeEdges.indexOf(edge) >= 0)  // edge on spanning tree, not ring edge
			{
				var nextVertex = vertex.getNeighborOnEdge(edge);
				var str = this._writeMolVertex(nextVertex, edge, mainChainEdges, spanningTreeEdges, ringEdgeRepo, aromaticNodes, aromaticRingConnectors, options);
				if (mainChainEdges.indexOf(edge) >= 0)  // edge on main chain
				{
					mainChainVertex = nextVertex;
					mainChainStr = str;
				}
				else
				{
					branchVertexes.push(nextVertex);
					branchStrs.push(str);
				}
			}
			else  // ring edge
			{
				// TODO: currently more than 99 ring edges and ring number reuse are not considered
				var ringEdgeIndex = ringEdgeRepo.indexOf(edge);
				if (ringEdgeIndex < 0)  // not registered
				{
					ringEdgeIndex = ringEdgeRepo.length;
					ringEdgeRepo.push(edge);
				}
				ringedVertexes.push(vertex.getNeighborOnEdge(edge));
				var ringStr = this._outputConnectorStr(connector,
					edge.getVertexes()[0].getData('object'), edge.getVertexes()[1].getData('object'), aromaticNodes, aromaticRingConnectors);
				ringEdgeIndex = ringEdgeIndex + 1;  // avoid index 0
				ringStr += (ringEdgeIndex < 10)? ringEdgeIndex: SMI.RING_BOND_TWO_DIGIT_NO_PREFIX + ringEdgeIndex;
				ringStrs.push(ringStr);
			}
		}

		// form result string
		var result = '';
		var prevNode;
		var prevBondStereoStr = '';
		if (prevEdge)
		{
			if (nextBondStereoStr)
				result += nextBondStereoStr;

			var prevVertex = vertex.getNeighborOnEdge(prevEdge);
			prevNode = prevVertex.getData('object');
			var prevConnector = prevEdge.getData('object');

			if (!ignoreBondStereo && prevConnector.getParity && prevConnector.getParity())  // curr vertex is the end vertex of stereo bond
			{
				var keyNodes = Kekule.MolStereoUtils.getStereoBondKeyNodes(prevConnector);
				if (keyNodes)
				{
					var initDirSymbols = this._getStereoDoubleBondInitialDirectionSymbols(prevConnector);
					var dirSymbol = initDirSymbols[1];
					if (keyNodes.indexOf(prevNode) < 0)
						dirSymbol = this._getInvertBondDirectionSymbol(dirSymbol);
				}
				prevBondStereoStr += dirSymbol;
			}

			result += this._outputConnectorStr(prevConnector,
				prevEdge.getVertexes()[0].getData('object'), prevEdge.getVertexes()[1].getData('object'), aromaticNodes, aromaticRingConnectors); // + result;
		}
		var nextNodes = [];
		for (var i = 0, l = ringedVertexes.length; i < l; ++i)
		{
			nextNodes.push(ringedVertexes[i].getData('object'));
		}
		for (var i = 0, l = branchVertexes.length; i < l; ++i)
		{
			nextNodes.push(branchVertexes[i].getData('object'));
		}
		if (mainChainVertex)
			nextNodes.push(mainChainVertex.getData('object'));
		result += this._outputNodeStr(node, aromaticNodes.indexOf(node) >= 0, prevNode, nextNodes, options);

		for (var i = 0, l = ringStrs.length; i < l; ++i)
		{
			result += ringStrs[i];
		}
		if (!mainChainStr && branchStrs.length)  // vertex not on main chain, regard the first branch as sub-main chain
			mainChainStr = branchStrs.shift();
		for (var i = 0, l = branchStrs.length; i < l; ++i)
		{
			result += SMI.BRANCH_BRACKET_LEFT + branchStrs[i] + SMI.BRANCH_BRACKET_RIGHT;
		}
		result += prevBondStereoStr;
		if (mainChainStr)
			result += mainChainStr;
		return result;
	},
	/** @private */
	_outputNodeStr: function(node, isAromatic, prevNode, nextNodes, options)
	{
		var result;
		var symbol;
		// symbol
		if (node instanceof Kekule.Atom)
		{
			symbol = node.getSymbol();
			result = symbol;
			if (isAromatic)
				result = result.toLowerCase();
		}
		else
		{
			result = SMI.ATOM_WILDCARD;
		}

		// chiral?
		var ignoreAtomStereo = options.ignoreStereoAtom;
		if (Kekule.ObjUtils.isUnset(ignoreAtomStereo))
			ignoreAtomStereo = options.ignoreStereo || false;
		var schiralRot;
		if (!ignoreAtomStereo && node.getParity && node.getParity())
		{
			// calc rotation direction
			if (nextNodes && nextNodes.length)
			{
				var hcount = node.getHydrogenCount? (node.getHydrogenCount(true) || 0): 0;  // calc bonded Hs, as they are excluded from graph
				// looking from prev node, calc rotation of nextNodes, if implicit H exists, it should be considered as first or last next node (result are same)
				var dir = Kekule.MolStereoUtils.calcTetrahedronChiralCenterRotationDirection(null, node, prevNode, nextNodes, !!hcount, false);
				var schiralRot = (dir === Kekule.RotationDir.CLOCKWISE)? SMI.ROTATION_DIR_CLOCKWISE:
					(dir === Kekule.RotationDir.ANTICLOCKWISE)? SMI.ROTATION_DIR_ANTICLOCKWISE:
						'';
				if (schiralRot)
				{
					result += schiralRot;
				}
			}
		}

		// hydrogen, show if explicit H count is set or non-C aromatic atom link with H
		var explicitHCount;
		if (schiralRot)  // if chiral center, H is always be listed
			explicitHCount = node.getHydrogenCount? (node.getHydrogenCount(true) || 0): 0;  // calc bonded Hs, as they are excluded from graph
		else
		{
			explicitHCount = node.getExplicitHydrogenCount ? node.getExplicitHydrogenCount() : 0;
			if (!explicitHCount && isAromatic && (symbol !== 'C') && node.getImplicitHydrogenCount)
			{
				explicitHCount = node.getImplicitHydrogenCount();
			}
		}
		// write explicit H count after chiral
		if (explicitHCount)
		{
			result += SMI.ATOM_H;
			var hcount = Math.round(explicitHCount);
			if (hcount > 1)
				result += hcount;
		}

		// charge
		var charge = Math.round(node.getCharge());
		if (charge)
		{
			var chargeStr = (charge > 0)? '+': '-';
			if (charge > 1 || charge < -1)
				chargeStr = Math.abs(charge) + chargeStr;
			result += chargeStr;
		}

		// isotope
		var massNum = node.getMassNumber? node.getMassNumber(): null;
		if (massNum)
			result = Math.abs(massNum) + result;

		var simpleOrgAtom = false;
		if (!explicitHCount && !charge && !massNum && !schiralRot)  // no special property is set
		{
			if ((!isAromatic &&SMI.ORGAN_SUBSET_ATOMS.indexOf(symbol) >= 0)
				|| (isAromatic && SMI.AROMATIC_SUBSET_ATOMS.indexOf(symbol) >= 0))
			{
				simpleOrgAtom = true;
			}
		}
		if (!simpleOrgAtom)
			result = SMI.ATOM_BRACKET_LEFT + result + SMI.ATOM_BRACKET_RIGHT;
		return result;
	},
	/** @private */
	_outputConnectorStr: function(connector, connectedNode1, connectedNode2, aromaticNodes, aromaticConnectors)
	{
		if (connector instanceof Kekule.Bond)
		{
			if (connector.getBondType() === Kekule.BondType.COVALENT)
			{
				if (aromaticConnectors.indexOf(connector) >= 0)   // connector on aromatic ring
					return '';
				else
				{
				  var connectBothAromaticNodes = (aromaticNodes.indexOf(connectedNode1) >= 0) && (aromaticNodes.indexOf(connectedNode2) >= 0);
					var bondOrder = connector.getBondOrder();
					var BO = Kekule.BondOrder;
					return (bondOrder === BO.DOUBLE)? SMI.BOND_DOUBLE:
						(bondOrder === BO.TRIPLE)? SMI.BOND_TRIPLE:
						(bondOrder === BO.QUAD)? SMI.BOND_QUAD:
						connectBothAromaticNodes? SMI.BOND_SINGLE: '';  // default, single, no need to add bond string
					// TODO: bond stereo
				}
			}
		}
		// default
		return SMI.BOND_FAKE;
	},
	/** @private */
	_getStereoDoubleBondInitialDirectionSymbols: function(bond)
	{
		var parity = bond.getParity();
		if (parity === Kekule.StereoParity.EVEN)
			return [SMI.DIRECTION_BOND_SYMBOLS[0], SMI.DIRECTION_BOND_SYMBOLS[0]];
		else
			return [SMI.DIRECTION_BOND_SYMBOLS[0], SMI.DIRECTION_BOND_SYMBOLS[1]];
	},
	/** @private */
	_getInvertBondDirectionSymbol: function(dirSymbol)
	{
		if (dirSymbol === SMI.DIRECTION_BOND_SYMBOLS[1])
			return SMI.DIRECTION_BOND_SYMBOLS[0];
		else
			return SMI.DIRECTION_BOND_SYMBOLS[1];
	}
});

// extents mime type consts
Kekule.IO.MimeType.SMILES = 'chemical/x-daylight-smiles';

// register chem data formats
Kekule.IO.DataFormat.SMILES = 'smi';
var smilesFmtId = 'smi';

Kekule.IO.DataFormatsManager.register(Kekule.IO.DataFormat.SMILES, Kekule.IO.MimeType.SMILES, ['smi', 'smiles'],
	Kekule.IO.ChemDataType.TEXT, 'SMILES format');

var suitableClasses = [Kekule.StructureFragment, Kekule.ChemObjList, Kekule.ChemStructureObjectGroup, Kekule.ChemSpaceElement, Kekule.ChemSpace];
Kekule.IO.ChemDataWriterManager.register('SMILES', Kekule.IO.SmilesMolWriter,
	suitableClasses,
	[Kekule.IO.DataFormat.SMILES]);
})();