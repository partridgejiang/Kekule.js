/**
 * @fileoverview
 * Canonicalizers for chemical structures, especially for ctab based ones.
 * The general process of canonicalization includes three phrases:
 *   1. An indexer object is called and assign index to each node in structure.
 *   2. An node sorter object is called and sort nodes according to canonicalization index
 *    in previous step.
 *   3. An connector sorter object is called to sort connectors according to sorted
 *    nodes.
 * Different canonicalization method may requires different indexer or node sorter.
 * Connector sorter usually do not need to vary.
 * @author Partridge Jiang
 */


/*
 * requires /core/kekule.common.js
 * requires /core/kekule.utils.js
 * requires /data/kekule.structures.js
 * requires /core/kekule.chemUtils.js
 * requires /algorithm/kekule.graph.js
 * requires /algorithm/kekule.structures.comparers.js
 */

(function()
{

var K = Kekule;
var AU = Kekule.ArrayUtils;
var BT = Kekule.BondType;

/**
 * An abstract class to assign index to nodes in connection table.
 * Different canonicalization method need different concrete indexes classes.
 * @class
 */
Kekule.CanonicalizationIndexer = Class.create(ObjectEx,
/** @lends Kekule.CanonicalizationIndexer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.CanonicalizationIndexer',
	/** @constructs */
	initialize: function($super)
	{
		$super();
	},
	/**
	 * Execute and assign index to each node in connection tab.
	 * @param {Variant} ctabOrStructFragment
	 */
	execute: function(ctabOrStructFragment)
	{
		var ctab = (ctabOrStructFragment instanceof Kekule.StructureFragment)?
			ctabOrStructFragment.getCtab(): ctabOrStructFragment;
		if (ctab)
			return this.doExecute(ctab);
		else
			return null;
	},
	/**
	 * Do actual job of indexing.
	 * Descendants should override this method.
	 * @param {Kekule.StructureConnectionTable} ctab
	 */
	doExecute: function(ctab)
	{
		// do nothing here
	}
});

/**
 * An abstract class to sort nodes according to canonicalization index.
 * Different canonicalization method need different concrete node sorter classes.
 * @class
 */
Kekule.CanonicalizationNodeSorter = Class.create(ObjectEx,
/** @lends Kekule.CanonicalizationNodeSorter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.CanonicalizationNodeSorter',
	/**
	 * Execute and sort nodes according to canonicalization index.
	 * @param {Variant} ctabOrStructFragment
	 */
	execute: function(ctabOrStructFragment)
	{
		var ctab = (ctabOrStructFragment instanceof Kekule.StructureFragment)?
			ctabOrStructFragment.getCtab(): ctabOrStructFragment;
		if (ctab)
			return this.doExecute(ctab, ctab.getNodes());
		else
			return null;
	},
	/**
	 * Do actual job of node sorting.
	 * Descendants should override this method.
	 * @param {Kekule.StructureConnectionTable} ctab
	 */
	doExecute: function(ctab)
	{
		// do nothing here
	}
});

/**
 * An abstract class to sort connectors according to sorted nodes.
 * @class
 */
Kekule.CanonicalizationConnectorSorter = Class.create(ObjectEx,
/** @lends Kekule.CanonicalizationConnectorSorter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.CanonicalizationConnectorSorter',
	/**
	 * Execute and sort connectors according connected nodes.
	 * @param {Variant} ctabOrStructFragment
	 */
	execute: function(ctabOrStructFragment)
	{
		var ctab = (ctabOrStructFragment instanceof Kekule.StructureFragment)?
			ctabOrStructFragment.getCtab(): ctabOrStructFragment;
		if (ctab)
			return this.doExecute(ctab, ctab.getConnectors());
		else
			return null;
	},
	/**
	 * Do actual job of connector sorting.
	 * Descendants should override this method.
	 * @param {Kekule.StructureConnectionTable} ctab
	 */
	doExecute: function(ctab)
	{
		// do nothing here
	}
});

/**
 * An abstract class to sort connected objects of each connector according to sorted nodes.
 * @class
 */
Kekule.CanonicalizationConnectorConnectedObjsSorter = Class.create(ObjectEx,
/** @lends Kekule.CanonicalizationConnectorConnectedObjsSorter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.CanonicalizationConnectorConnectedObjsSorter',
	/**
	 * Execute and sort connectors according connected nodes.
	 * @param {Variant} ctabOrStructFragment
	 */
	execute: function(ctabOrStructFragment)
	{
		var ctab = (ctabOrStructFragment instanceof Kekule.StructureFragment)?
				ctabOrStructFragment.getCtab(): ctabOrStructFragment;
		if (ctab)
			return this.doExecute(ctab, ctab.getConnectors());
		else
			return null;
	},
	/**
	 * Do actual job of connector sorting.
	 * Descendants should override this method.
	 * @param {Kekule.StructureConnectionTable} ctab
	 */
	doExecute: function(ctab)
	{
		// do nothing here
	}
});

/**
 * Base class for do a custom molecule canonicalization job (do not use indexer, node or connector sorter).
 * @class
 */
Kekule.CanonicalizationCustomExecutor = Class.create(ObjectEx,
/** @lends Kekule.CanonicalizationCustomExecutor# */
{
	/** @private */
	CLASS_NAME: 'Kekule.CanonicalizationCustomExecutor',
	/**
	 * Execute canonicalization process on connection table.
	 * @params {Kekule.StructureConnectionTable} ctab
	 * @returns {Kekule.StructureConnectionTable}
	 */
	execute: function(ctab)
	{
		var newCtab = this.doExecute(ctab);
		// handle connected objects of each connector
		if (newCtab)
			this.doCanonicalizeConnectedObjs(newCtab);
		return newCtab;
	},
	/**
	 * Do actual work of {@link Kekule.CanonicalizationExecutor.execute}.
	 * Descendants should override this method.
	 * @param {Kekule.StructureConnectionTable} ctab
	 * @returns {Kekule.StructureConnectionTable}
	 * @private
	 */
	doExecute: function(ctab)
	{
		return ctab;
	},
	/** @private */
	doCanonicalizeConnectedObjs: function(ctab)
	{
		if (!ctab)
			return;
		/*
		var sortFunc = function(a, b)
		{
			var indexA = ctab.indexOfChild(a);
			var indexB = ctab.indexOfChild(b);
			return indexA - indexB;
		};
		for (var i = 0, l = ctab.getConnectorCount(); i < l; ++i)
		{
			var conn = ctab.getConnectorAt(i);
			var connObjs = conn.getConnectedObjs();
			connObjs.sort(sortFunc);
		}
		*/
		var connObjsSorter = new Kekule.CanonicalizationGeneralConnectorConnectedObjsSorter();
		connObjsSorter.execute(ctab);
	}
});

/**
 * An general class to sort connectors according to sorted nodes.
 * @arguments Kekule.CanonicalizationConnectorSorter
 * @class
 */
Kekule.CanonicalizationGeneralConnectorSorter = Class.create(Kekule.CanonicalizationConnectorSorter,
/** @lends Kekule.CanonicalizationGeneralConnectorSorter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.CanonicalizationGeneralConnectorSorter',
	/** @ignore */
	doExecute: function(ctab)
	{
		var connectedNodeSeqMap = new Kekule.MapEx();
		try
		{
			// assign comparation values
			for (var i = 0, l = ctab.getConnectorCount(); i < l; ++i)
			{
				var conn = ctab.getConnectorAt(i);
				var connectedObjs = conn.getConnectedObjs();
				var mvalues = [];
				for (var j = 0, k = connectedObjs.length; j < k; ++j)
				{
					var obj = connectedObjs[j];
					var mvalue;
					if (obj instanceof Kekule.ChemStructureNode)
					{
						mvalue = ctab.indexOfNode(obj);
						mvalues.push(mvalue);
					}
					else  // bypass connected connectors
					{

					}
				}
				mvalues.sort( function(a, b) { return a - b; });
				connectedNodeSeqMap.set(conn, mvalues);
			}
			// sort connectors
			ctab.sortConnectors(function(c1, c2){
				var mvalues1 = connectedNodeSeqMap.get(c1);
				var mvalues2 = connectedNodeSeqMap.get(c2);
				var result = AU.compare(mvalues1, mvalues2);
				if (result === 0)
					result = -(c1.getConnectedObjCount() - c2.getConnectedObjCount());
				return result;
			});
			/*
			// sort connected objs in connectors
			// Now this job is moved to CanonicalizationGeneralConnectorConnectedObjsSorter
			for (var i = 0, l = ctab.getConnectorCount(); i < l; ++i)
			{
				var conn = ctab.getConnectorAt(i);
				if (conn.getConnectedObjCount() === 2)  // usual connector, connect with two nodes
				{
					var o1 = conn.getConnectedObjAt(0);
					var o2 = conn.getConnectedObjAt(1);
					if (ctab.indexOfChild(o1) > ctab.indexOfChild(o2)) // swap two nodes, may reverse wedge direction also
						conn.reverseConnectedObjOrder();
				}
				else
					conn.sortConnectedObjs(function(o1, o2){
						return ctab.indexOfChild(o1) - ctab.indexOfChild(o2);
					});
			}
			*/
		}
		finally
		{
			connectedNodeSeqMap.finalize();
		}
	}
});

/**
 * An general sorter class to sort connected objects of each connector according to sorted nodes.
 * @arguments Kekule.CanonicalizationConnectorConnectedObjsSorter
 * @class
 */
Kekule.CanonicalizationGeneralConnectorConnectedObjsSorter = Class.create(Kekule.CanonicalizationConnectorConnectedObjsSorter,
/** @lends Kekule.CanonicalizationGeneralConnectorConnectedObjsSorter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.CanonicalizationGeneralConnectorConnectedObjsSorter',
	/** @ignore */
	doExecute: function(ctab)
	{
		var connectedNodeSeqMap = new Kekule.MapEx();
		try
		{
			// sort connected objs in connectors
			for (var i = 0, l = ctab.getConnectorCount(); i < l; ++i)
			{
				var conn = ctab.getConnectorAt(i);
				if (conn.getConnectedObjCount() === 2)  // usual connector, connect with two nodes
				{
					var o1 = conn.getConnectedObjAt(0);
					var o2 = conn.getConnectedObjAt(1);
					var cIndex1 = ctab.indexOfChild(o1);
					var cIndex2 = ctab.indexOfChild(o2);
					// if o1 or o2 is outside ctab (may ocurr in crossConnector of subgroup,
					// this approach will compare their canonicalization index (the order in shadow flattern structure).
					if (cIndex1 < 0 || cIndex2 < 0)
					{
						cIndex1 = (o1.getCanonicalizationIndex? -o1.getCanonicalizationIndex(): 0) || 0;
						cIndex2 = (o2.getCanonicalizationIndex? -o2.getCanonicalizationIndex(): 0) || 0;
					}
					if (cIndex1 > cIndex2) // swap two nodes, may reverse wedge direction also
					{
						conn.reverseConnectedObjOrder();
					}
				}
				else
				{
					conn.sortConnectedObjs(function(o1, o2)
					{
						var cIndex1 = ctab.indexOfChild(o1);
						var cIndex2 = ctab.indexOfChild(o2);
						if (cIndex1 < 0 || cIndex2 < 0)  // same index, may be all -1, o1, o2 outside subgroup, compare their canonicalization index
						{
							cIndex1 = (o1.getCanonicalizationIndex ? -o1.getCanonicalizationIndex() : 0) || 0;
							cIndex2 = (o2.getCanonicalizationIndex ? -o2.getCanonicalizationIndex() : 0) || 0;
							result = (cIndex1 || 0) - (cIndex2 || 0);
						}
						var result = ctab.indexOfChild(o1) - ctab.indexOfChild(o2);
						return result;
					});
				}
			}
		}
		finally
		{
			connectedNodeSeqMap.finalize();
		}
	}
});

/**
 * An class to assign index to nodes in connection table by a modification of Morgan algorithm.
 * Morgan algorithm on molecule graph is first execute to calculate all ec values. Then from smaller to
 * larger, nodes are sorted by their ec values. If some node have the same ec value, other features will
 * be used to sort.
 * @arguments Kekule.CanonicalizationIndexer
 * @class
 */
Kekule.CanonicalizationMorganIndexer = Class.create(Kekule.CanonicalizationIndexer,
/** @lends Kekule.CanonicalizationMorganIndexer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.CanonicalizationMorganIndexer',
	/** @ignore */
	doExecute: function(ctab)
	{
		// clear old indexes
		/*
		for (var i = 0, l = ctab.getNodeCount(); i < l; ++i)
		{
			ctab.getNodeAt(i).setCanonicalizationIndex(null);
		}
		*/
		// turn ctab into pure graph first (with sub structure degrouped)
		var graph = Kekule.GraphAdaptUtils.ctabToGraph(ctab, null, {'expandSubStructures': true, ignoreBondedHydrogen: true});
		if (!graph)
			return null;
		//console.log('graph size', graph.getVertexes().length);
		// calc EC values of graph
		var ecResult = this._calcGraphFinalECs(graph);
		var ecMapping = ecResult.ecMapping;
		/*
		if (ecResult.ecCount < graph.getVertexes().length)  // some vertexes has same ec value, need to index it further
		{

		}
		else
		{

		}
		*/

		/*
		var sortedNodes = [];
		var vertexGroups = this._groupVertexesByEcValue(graph, ecMapping);
		for (var i = 0, l = vertexGroups.length; i < l; ++i)
		{
			var vertexGroup = vertexGroups[i];
			var nodes = this._vertexesToNodes(vertexGroup.vertexes);
			if (nodes.length === 1)
				AU.pushUnique(sortedNodes, nodes[0]);
			else
			{
				var groups = this._groupNodesWithSameEcValue(nodes, sortedNodes);
				sortedNodes = sortedNodes.concat(groups);
			}
		}
		*/
		var sortedNodes = this._sortNodeByEcMapping(graph, ecMapping);
		// at last assign indexes
		this._setCanonicalizationIndexToNodeGroups(sortedNodes);
	},

	/** @private */
	_sortNodeByEcMapping: function(graph, ecMapping)
	{
		var sortedNodes = [];
		var vertexGroups = this._groupVertexesByEcValue(graph, ecMapping);
		for (var i = 0, l = vertexGroups.length; i < l; ++i)
		{
			var vertexGroup = vertexGroups[i];
			var nodes = this._vertexesToNodes(vertexGroup.vertexes);
			if (nodes.length === 1)
				AU.pushUnique(sortedNodes, nodes[0]);
			else
			{
				var groups = this._groupNodesWithSameEcValue(nodes, sortedNodes);
				sortedNodes = sortedNodes.concat(groups);
			}
		}
		return sortedNodes;
	},

	/** @private */
	_setCanonicalizationIndexToNodeGroups: function(sortedNodes)
	{
		for (var i = 0, l = sortedNodes.length; i < l; ++i)
		{
			var vIndex = i + 1;
			var item = sortedNodes[i];
			if (AU.isArray(item))
			{
				for (var j = 0, k = item.length; j < k; ++j)
				{
					//console.log('set cano index', item[j].getSymbol(), vIndex, j, k);
					item[j].setCanonicalizationIndex(vIndex);
				}
			}
			else
			{
				//console.log('set cano index', item.getSymbol(), vIndex);
				item.setCanonicalizationIndex(vIndex);
			}
		}
	},

	/** @private */
	_vertexesToNodes: function(vertexes)
	{
		var result = [];
		for (var i = 0, l = vertexes.length; i < l; ++i)
		{
			var node = vertexes[i].getData('object');
			result.push(node);
		}
		return result;
	},
	/**
	 * Calculate EC value of each vertex in graph and store the values into newECMapping.
	 * Set isInitialRun to true to set the initial EC values.
	 * @param graph
	 * @param newECMapping
	 * @param oldECMapping
	 * @param isInitialRun
	 * @returns {Int} Different EC values calculated in process.
	 * @private
	 */
	_processECs: function(graph, newECMapping, oldECMapping, isInitialRun)
	{
		var ecValues = [];
		var vertexes = graph.getVertexes();
		for (var i = 0, l = vertexes.length; i < l; ++i)
		{
			var vertex = vertexes[i];
			var sum = 0;
			if (!isInitialRun)
			{
				var neighbors = vertex.getNeighbors();
				for (var j = 0, k = neighbors.length; j < k; ++j)
				{
					sum += oldECMapping.get(neighbors[j]) || 0;
				}
			}
			else
			{
				sum = vertex.getEdgeCount();
			}
			newECMapping.set(vertex, sum);
			AU.pushUnique(ecValues, sum);
		}
		return ecValues.length;
	},

	/**
	 * Calculate the final EC value mapping of a graph.
	 * @param {Object} graph
	 * @returns {Hash} {ecCount: Int, ecMapping: Kekule.MapEx}
	 * @private
	 */
	_calcGraphFinalECs: function(graph)
	{
		var ecMappings = [
			new Kekule.MapEx(), new Kekule.MapEx()
		];
		try
		{
			var index = 0;
			var currECMapping = ecMappings[0];
			var oldECMapping = ecMappings[0];
			var ecMemberCount = this._processECs(graph, currECMapping, oldECMapping, true);
			var oldEcMemberCount = 0;
			while (ecMemberCount > oldEcMemberCount)
			{
				oldEcMemberCount = ecMemberCount;
				++index;
				//var j = index % 2;
				oldECMapping = currECMapping;
				currECMapping = ecMappings[index % 2];
				//oldECMapping = ecMappings[(index + 1) % 2];
				ecMemberCount = this._processECs(graph, currECMapping, oldECMapping);
			}

			//console.log(oldECMapping);
			// debug, mark EC values
			/*
			 var vertexes = graph.getVertexes();
			 for (var i = 0, l = vertexes.length; i < l; ++i)
			 {
				 var node = vertexes[i].getData('object');
				 var value = oldECMapping.get(vertexes[i]);
				 //node.setRenderOption('customLabel', '' + value);
				 node.setCharge(value);
			 }
      */
		}
		finally
		{
			currECMapping.finalize();
		}

		// finally get actual ec values
		//var actualEcMapping = oldEcMapping;
		return {ecMapping: oldECMapping, ecCount: oldEcMemberCount};
	},

	/** @private */
	_groupVertexesByEcValue: function(graph, ecMapping)
	{
		var groups = [];
		var ecValues = [];
		var vertexes = graph.getVertexes();
		for (var i = 0, l = vertexes.length; i < l; ++i)
		{
			var v = vertexes[i];
			var ecValue = ecMapping.get(v);
			AU.pushUnique(ecValues, ecValue);
			if (!groups[ecValue])
				groups[ecValue] = [];
			groups[ecValue].push(v);
		}
		ecValues.sort(function(a, b) { return a - b; } );
		//console.log(ecValues);
		var result = [];
		for (var i = 0, l = ecValues.length; i < l; ++i)
		{
			var vs = groups[ecValues[i]];
			result.push({
				ecValue: ecValues[i],
				vertexes: vs,
				vertexesCount: vs.length
			});
		}
		return result;
	},
	/** @private */
	_groupNodesWithSameEcValue: function(nodes, sortedNodes)
	{
		var formAssocCompareArray = function(node, sortedNodes)
		{
			var linkedObjs = node.getLinkedObjs();
			var linkedNodes = AU.intersect(linkedObjs, sortedNodes);
			var ncompareValues = [];  // calc from node
			var ccompareValues = [];  // calc from connector
			for (var i = 0, l = linkedNodes.length; i < l; ++i)
			{
				var n = linkedNodes[i];
				ncompareValues.push(sortedNodes.indexOf(n));
			}
			ncompareValues.sort( function(a, b) { return a - b; });
			for (var i = 0, l = ncompareValues.length; i < l; ++i)
			{
				var n = sortedNodes[ncompareValues[i]];
				var conn = node.getConnectorTo(n);
				var connOrder = conn.getBondOrder? conn.getBondOrder() || 0: 0;
				ccompareValues.push(connOrder);
			}
			return {
				nodeOrders: ncompareValues, connectorOrders: ccompareValues
			};
		};

		var nodeGroups = AU.group(nodes, function(n1, n2)
			{
				//var result = Kekule.UnivChemStructObjComparer.compare(n1, n2);
				var result = n1.compareStructure(n2);
				if (result === 0)  // same compare value, need further check
				{
					var compareValue1 = formAssocCompareArray(n1, sortedNodes);
					var compareValue2 = formAssocCompareArray(n2, sortedNodes);
					result = AU.compare(compareValue1.nodeOrders, compareValue2.nodeOrders);
					if (result === 0)  // connected node can not distinguish, need to check linked connectors
					{
						result = AU.compare(compareValue1.connectorOrders, compareValue2.connectorOrders);
					}
				}
				return result;
			});
		//console.log('group nodes', nodes, nodeGroups);

		return nodeGroups;
	}
});

/**
 * An class to sort nodes by morgan algorithm.
 * Different canonicalization method need different concrete node sorter classes.
 * @arguments Kekule.CanonicalizationNodeSorter
 * @class
 */
Kekule.CanonicalizationMorganNodeSorter = Class.create(Kekule.CanonicalizationNodeSorter,
/** @lends Kekule.CanonicalizationMorganNodeSorter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.CanonicalizationMorganNodeSorter',
	/**
	 * Do actual job of node sorting.
	 * Descendants should override this method.
	 * @param {Kekule.StructureConnectionTable} ctab
	 */
	doExecute: function(ctab)
	{
		var sortedNodes = this._getNodeSortedArray(ctab);
		var sortedNodesLength = sortedNodes.length;
		var self = this;
		ctab.sortNodes(function(a, b){
			var indexA = sortedNodes.indexOf(a);
			var indexB = sortedNodes.indexOf(b);
			// sortedNodes may not contain hydrogen atoms, put it to tail
			if (indexA < 0)
				indexA = sortedNodesLength;
			if (indexB < 0)
				indexB = sortedNodesLength;
			var result = indexA - indexB;
			if (result === 0 && indexA === sortedNodesLength)  // H hydrogen, need compare
			{
				result = self._getNeighborNodesMinIndex(a, sortedNodes) - self._getNeighborNodesMinIndex(b, sortedNodes);
			}
			return result;
		});
	},
	/** @private */
	_getNeighborNodesMinIndex: function(node, sortedNodes)
	{
		var neighbors = node.getLinkedChemNodes();
		var result = sortedNodes.length;
		for (var i = 0, l = neighbors.length; i < l; ++i)
		{
			var index = sortedNodes.indexOf(neighbors[i]);
			if (index > 0 && index < result)
				result = index;
		}
		return result;
	},
	/** @private */
	_getNodeSortedArray: function(ctab)
	{
		var result = [];
		/*
		var nodeSeq = AU.clone(ctab.getNodes());
		nodeSeq.sort(function(a, b){
			return ((a.getCanonicalizationIndex() || -1) - (b.getCanonicalizationIndex() || -1));
		});
		*/
		/*
		var sortFunc = function(n1, n2)
		{
			return nodeSeq.indexOf(n1) - nodeSeq.indexOf(n2);
		};
		*/
		var nodeCompareFunc = function(startingNode, n1, n2)
		{
			var result;
			var cIndex1 = n1.getCanonicalizationIndex();
			var cIndex2 = n2.getCanonicalizationIndex();
			// console.log('INDEX', n1.getSymbol(), cIndex1, n2.getSymbol(), cIndex2);
			result = (cIndex1 || -1) - (cIndex2 || -1);

			if (result === 0)  // canonicalization index is same, compare connector\
			{
				if (startingNode)
				{
					var connector1 = startingNode.getConnectorTo(n1);
					var connector2 = startingNode.getConnectorTo(n2);
					//result = Kekule.UnivChemStructObjComparer.compare(connector1, connector2);
					result = connector1.compareStructure(connector2);
				}
				if (result === 0) // still same, compare coord if possible
				{
					if (n1.hasCoord3D(true) && n2.hasCoord3D(true))  // allow borrow from 2D
					{
						var deltaCoord = Kekule.CoordUtils.substract(n1.getAbsCoord3D(true), n2.getAbsCoord3D(true));
						result = deltaCoord.z || deltaCoord.y || deltaCoord.x;
					}
				}
			}
			return result;
		};
		//var nodeIndexMap = new Kekule.MapEx();
		try
		{
			//var remainingNodes = AU.clone(nodeSeq);
			var remainingNodes = AU.clone(ctab.getNodes());
			/*
			remainingNodes.forEach(function(n) {
				console.log('node', n.getSymbol(), n.getCanonicalizationIndex());
			});
			*/
			// first seek out the starting node with highest canonicalization index
			var currNode, currNodeIndex;
			for (var i = 0, l = remainingNodes.length; i < l; ++i)
			{
				var node = remainingNodes[i];
				if (!currNode)
				{
					currNode = node;
					currNodeIndex = i;
				}
				else
				{
					if (nodeCompareFunc(null, node, currNode) > 0)
					{
						currNode = node;
						currNodeIndex = i;
					}
				}
			}

			//console.log('starting node', currNode.getSymbol(), i);

			//var currNode = nodeSeq[nodeSeq.length - 1];
			//remainingNodes.splice(nodeSeq.length - 1, 1);
			remainingNodes.splice(currNodeIndex, 1);
			var sortedNodes = [];
			var sortedUnindexedNodes = [];  // sorted hydrogen atom that has no cannonicalization index

			sortedNodes.push(currNode);
			//nodeIndexMap.set(currNode, 0);

			for (var i = 0; i < sortedNodes.length; ++i)
			{
				var currNode = sortedNodes[i];
				if (i !== 0)
				{
					var vIndex = remainingNodes.indexOf(currNode);
					if (vIndex >= 0)
					{
						sortedNodes.push(currNode);
						//nodeIndexMap.set(currNode, sortedNodes.length - 1);
						remainingNodes.splice(vIndex, 1);
					}
				}
				var neighbors = currNode.getLinkedObjs();
				neighbors = AU.intersect(neighbors, remainingNodes);
				if (neighbors.length)
				{
					//neighbors.sort(sortFunc);
					neighbors.sort(function(a, b){
						var startingNode = currNode;
						return nodeCompareFunc(startingNode, a, b);
					});
					for (var j = neighbors.length - 1; j >= 0; --j)
					{
						var neighbor = neighbors[j];
						vIndex = remainingNodes.indexOf(neighbor);
						if (vIndex >= 0)
						{
							var canoIndex = neighbor.getCanonicalizationIndex();
							if (Kekule.ObjUtils.isUnset(canoIndex))
								sortedUnindexedNodes.push(neighbor);
							else
								sortedNodes.push(neighbor);
							//nodeIndexMap.set(neighbors[j], sortedNodes.length - 1);
							remainingNodes.splice(vIndex, 1);
						}
					}
				}
			}

			sortedNodes = sortedNodes.concat(sortedUnindexedNodes);

			return sortedNodes;
		}
		finally
		{
			//nodeIndexMap.finalize();
		}
	}
});

/**
 * A entry class to execute molecule canonicalization job.
 * User should use this class rather than call concrete CanonicalizationExecutor directly.
 * @class
 */
Kekule.Canonicalizer = Class.create(
/** @lends Kekule.Canonicalizer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Canonicalizer',
	/** @constructs */
	initialize: function()
	{
		this._executorClasses = {};
		this._executorInstances = {};
		this._defExecutorId = null;
	},
	/**
	 * Register a canonicalization executor class.
	 * Executor class should be a descendant of {@link Kekule.CanonicalizationExecutor}.
	 * @param {String} id
	 * @param {Variant} executorClasses Array of three related classes: [Indexer, NodeSorter, ConnectorSorter],
	 *   or a custom canonicalization class deprived from {@link Kekule.CanonicalizationCustomExecutor}.
	 * @param {Bool} asDefault Whether this executor should be the default one to canonicalize molecule.
	 */
	registerExecutor: function(id, executorClasses, asDefault)
	{
		if (AU.isArray(executorClasses))
		{
			this._executorClasses[id] = {
				'indexer': executorClasses[0],
				'nodeSorter': executorClasses[1],
				'connectorSorter': executorClasses[2] || Kekule.CanonicalizationGeneralConnectorSorter,
				'connectorConnectedObjsSorter': executorClasses[3] || Kekule.CanonicalizationGeneralConnectorConnectedObjsSorter
			};
		}
		else
			this._executorClasses[id] = {'customExecutor': executorClasses};
		if (asDefault)
			this._defExecutorId = id;
	},
	/**
	 * Returns a instance of registered executor class.
	 * @param {String} id
	 * @returns {Kekule.CanonicalizationExecutor}
	 */
	getExecutor: function(id)
	{
		if (!id)
			return null;
		var result = this._executorInstances[id];
		if (!result)
		{
			var eClasses = this._executorClasses[id];
			if (eClasses)
			{
				if (eClasses.customExecutor)
				{
					result = {'customExecutor': new (eClasses.customExecutor)()};
				}
				else
				{
					result = {
						'indexer': new (eClasses.indexer)(),
						'nodeSorter': new (eClasses.nodeSorter)(),
						'connectorSorter': new (eClasses.connectorSorter)(),
						'connectorConnectedObjsSorter': new (eClasses.connectorConnectedObjsSorter)()
					};
				}
				this._executorInstances[id] = result;
			}
		}
		return result;
	},
	/**
	 * Use specified method or default one (if executorId is not set) to canonicalize a structure fragment or ctab.
	 * @param {Variant} structFragmentOrCtab
	 * @param {String} executorId
	 */
	canonicalize: function(structFragmentOrCtab, executorId)
	{
		structFragmentOrCtab.beginUpdate();
		try
		{
			var id = executorId || this._defExecutorId;
			var executor = this.getExecutor(id);
			if (!executor)
			{
				Kekule.error(Kekule.$L('ErrorMsg.REGISTERED_CANONICALIZATION_EXECUTOR_NOT_FOUND')/*Kekule.ErrorMsg.REGISTERED_CANONICALIZATION_EXECUTOR_NOT_FOUND*/);
			}
			else
			{
				var struct = (structFragmentOrCtab instanceof Kekule.StructureFragment)? structFragmentOrCtab: null;
				var canoInfo = struct.getCanonicalizationInfo();
				if (canoInfo && canoInfo.id === id)   // already do a cano job, no need to run again
				{
					return structFragmentOrCtab;
				}
				var ctab = structFragmentOrCtab.getCtab? structFragmentOrCtab.getCtab(): structFragmentOrCtab;
				if (!ctab)  // empty structure
					return;
				var structFragment = ctab.getParent();
				if (executor.customExecutor)
					executor.customExecutor.execute(ctab);
				else  // use default approach
				{
					this._doDefaultCanonicalize(executor, ctab, structFragment);
				}
				struct.setCanonicalizationInfo({'id': id});  // save cano info
			}
		}
		finally
		{
			structFragmentOrCtab.endUpdate();
		}
		return structFragmentOrCtab;
	},
	/**
	 * Default approach to do canonicalization.
	 * @private
	 */
	_doDefaultCanonicalize: function(executor, ctab, structFragment)
	{
		// ensure the canonicalization is executed on flattened structure (without subgroups)
		var flatternedStruct = structFragment.getFlattenedShadowFragment();

		/*
		var data = Kekule.IO.saveFormatData(flatternedStruct, 'mol');
		console.log('FLATTERN');
		console.log(data);
		*/
		var ctab = flatternedStruct.getCtab();
		ctab.beginUpdate();
		try
		{
			executor.indexer.execute(ctab);
			executor.nodeSorter.execute(ctab);
			executor.connectorSorter.execute(ctab);
			executor.connectorConnectedObjsSorter.execute(ctab);
		}
		finally
		{
			ctab.endUpdate();
		}

		// if structFragment has subgroup (flattenedShadow not self), handle it
		if (!structFragment.getFlattenedShadowOnSelf())
		{
			structFragment.beginUpdate();
			try
			{
				// now the flatterned structure is canonicalization, we index the original structure based on it
				this._sortSrcStructBaseOnShadow(structFragment, flatternedStruct/*, structFragment.getFlattenedShadow()*/);
				// at last sort connected objs of each connector
				executor.connectorConnectedObjsSorter.execute(structFragment.getCtab());
			}
			finally
			{
				structFragment.endUpdate();
			}
		}
	},
	/** @private */
	_sortSrcStructBaseOnShadow: function(srcStruct, shadowStruct/*, shadowInfo*/)
	{
		var FLATTERN_INDEX_KEY = '__$flattern_index$__';
		var getFlatternIndex = function(obj)
		{
			return obj[FLATTERN_INDEX_KEY];
		};
		var setFlatternIndex = function(obj, value)
		{
			obj[FLATTERN_INDEX_KEY] = value;
		};
		var _setSrcNodeFlatternIndex = function(rootStruct, node, index, allChildrenCount)
		{
			//node.setCanonicalizationIndex(index);
			setFlatternIndex(node, index);
			// if node is in a subgroup, set index of its parent
			var parent = node.getParent();
			if (parent.isChildOf(srcStruct))
			{
				//var pIndex = parent.getCanonicalizationIndex();
				var pIndex = getFlatternIndex(parent);
				var newPIndex = index + allChildrenCount;  // ensure subgroup sort after all single nodes
				if (Kekule.ObjUtils.isUnset(pIndex) || pIndex > newPIndex)
				{
					//parent.setCanonicalizationIndex(newPIndex);
					_setSrcNodeFlatternIndex(rootStruct, parent, newPIndex, allChildrenCount);
				}
			}
		};
		var _sortSrcStructure = function(struct)
		{
			struct.beginUpdate();
			try
			{
				// sort first level children
				struct.sortNodes(function(a, b)
				{
					//return a.getCanonicalizationIndex() - b.getCanonicalizationIndex();
					return getFlatternIndex(a) - getFlatternIndex(b);
				});
				struct.sortConnectors(function(a, b)
				{
					return getFlatternIndex(a) - getFlatternIndex(b);
				});
				// then handle nested subgroups
				for (var i = 0, l = struct.getNodeCount(); i < l; ++i)
				{
					var node = struct.getNodeAt(i);
					if (node instanceof Kekule.StructureFragment) // is subgroup, sort
						_sortSrcStructure(node);
				}
			}
			finally
			{
				struct.endUpdate();
			}
		};

		// first save index of each flattern shadow / source children (nodes and connectors)
		srcStruct.cascadeOnChildren(function(obj){
			/*
			if (obj.setCanonicalizationIndex)
				obj.setCanonicalizationIndex(null);
			*/
			if (obj)
				setFlatternIndex(obj, null);
		});
		// the subgroup canonicalization index is calculated based on its own child nodes
		var shadowChildCount = shadowStruct.getChildCount();
		srcStruct.beginUpdate();
		try
		{
			for (var i = 0; i < shadowChildCount; ++i)
			{
				var childObj = shadowStruct.getChildAt(i);
				if (childObj instanceof Kekule.ChemStructureNode)
				{
					var shadowNode = childObj;
					var srcNode = srcStruct.getFlatternedShadowSourceObj(shadowNode);
					if (srcNode)
					{
						_setSrcNodeFlatternIndex(srcStruct, srcNode, i, shadowChildCount);
						srcNode.setCanonicalizationIndex(shadowNode.getCanonicalizationIndex());
					}
				}
				else if (childObj instanceof Kekule.ChemStructureConnector)
				{
					var shadowConn = childObj;
					var srcConn = srcStruct.getFlatternedShadowSourceObj(shadowConn);
					//srcConn.setCanonicalizationIndex(i);
					setFlatternIndex(srcConn, i);
				}
			}

			// then sort source struct cascadlly
			_sortSrcStructure(srcStruct);
		}
		finally
		{
			srcStruct.endUpdate();
		}
	}
});
Kekule.ClassUtils.makeSingleton(Kekule.Canonicalizer);
/**
 * A singleton instance of {@link Kekule.Canonicalizer}.
 */
Kekule.canonicalizer = Kekule.Canonicalizer.getInstance();

// extend ctab and molecule class for a easy way to do canonicalization
// even add method to ChemObject, make it easy to canonicalize all children
/** @ignore */
ClassEx.extend(Kekule.ChemObject,
	/** @lends Kekule.ChemObject# */
	{
	/**
	 * Canonicalize object and all possible children by canonicalizer. If canonicalizerId is not set,
	 * the default one will be used.
	 * @param {String} canonicalizerId
	 */
	canonicalize: function(canonicalizerId)
	{
		// find out all molecule
		var mols = Kekule.ChemStructureUtils.getAllStructFragments(this, true);
		for (var i = 0, l = mols.length; i < l; ++i)
		{
			mols[i].canonicalize(canonicalizerId);
		}
		return this;
	}
});

/** @ignore */
ClassEx.extend(Kekule.StructureConnectionTable,
/** @lends Kekule.StructureConnectionTable# */
{
	/**
	 * Canonicalize a structure fragment by canonicalizer. If canonicalizerId is not set,
	 * the default one will be used.
	 * @param {String} canonicalizerId
	 */
	canonicalize: function(canonicalizerId)
	{
		Kekule.canonicalizer.canonicalize(this);
		return this;
	}
});
/** @ignore */
ClassEx.extend(Kekule.StructureFragment,
/** @lends Kekule.StructureFragment# */
{
	/**
	 * Canonicalize a structure fragment by canonicalizer. If canonicalizerId is not set,
	 * the default one will be used.
	 * @param {String} canonicalizerId
	 */
	canonicalize: function(canonicalizerId)
	{
		Kekule.canonicalizer.canonicalize(this);
		//console.log('do canonicalize to', this.getClassName(), this.getId());
		return this;
	}
});

// A special property to store cano-label of atoms or bonds
ClassEx.defineProp(Kekule.ChemStructureObject, 'canonicalizationIndex', {'dataType': DataType.INT, 'serializable': false/*, 'scope': Class.PropertyScope.PUBLISHED*/});


// register morgan as default
Kekule.canonicalizer.registerExecutor('morgan', [Kekule.CanonicalizationMorganIndexer, Kekule.CanonicalizationMorganNodeSorter], true);



})();
