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
		var graphInfo = this.doCalcGraphAndEcResult(ctab);

		this.doExecuteOnGraphEcResult(graphInfo.graph, graphInfo.ecMapping, graphInfo.vertexGroup);
	},
	/** @private */
	doCalcGraphAndEcResult: function(ctab)
	{
		// turn ctab into pure graph first (with sub structure degrouped)
		var graph = Kekule.GraphAdaptUtils.ctabToGraph(ctab, null, {'expandSubStructures': true, ignoreBondedHydrogen: true});
		if (!graph)
			return null;

		// calc EC values of graph
		var ecResult = this._calcGraphFinalECs(graph);
		var ecMapping = ecResult.ecMapping;
		var vertexGroup = ecResult.vertexGroup;

		return {
			'graph': graph,
			'ecMapping': ecMapping,
			'vertexGroup': vertexGroup
		};
	},
	/** @private */
	doExecuteOnGraphEcResult: function(graph, ecMapping, vertexGroup)
	{
		var sortedNodes = this._sortNodeByEcMapping(graph, ecMapping, vertexGroup);

		// assign cano indexes to indication the symmetric information
		this._setCanonicalizationIndexToNodeGroups(sortedNodes);

		// then also sort graph and generate a assoc spanning tree
		this._fillSpanningTreeInfo(graph);
	},
	/** @private */
	_fillSpanningTreeInfo: function(graph)
	{
		var vertexes = graph.getVertexes();
		if (vertexes && vertexes.length)
		{
			vertexes.sort(function(v1, v2) {
				var node1 = v1.getData('object');
				var node2 = v2.getData('object');
				if (!node1 && !node2)
					return 0;
				else if (!node1)
					return 1;
				else if (!node2)
					return -1;
				else  // node1 node2 all assigned
				{
					// node with larger cano index first
					var result = (node2.getCanonicalizationIndex() || -1) - (node1.getCanonicalizationIndex() || -1);
					if (result === 0) // still same, compare coord if possible
					{
						if (node1.hasCoord3D(true) && node2.hasCoord3D(true))  // allow borrow from 2D
						{
							var deltaCoord = Kekule.CoordUtils.substract(node2.getAbsCoord3D(true), node1.getAbsCoord3D(true));
							//console.log('compare coord', deltaCoord);
							result = deltaCoord.z || deltaCoord.y || deltaCoord.x;
						}
					}
					return result;
				}
			});

			var edges = graph.getEdges();
			if (edges && edges.length)
			{
				var _getConnectedVertexIndexes = function(edge, vertexesSeq) {
					var seqLength = vertexesSeq.length;
					var result = [];
					var vs = edge.getVertexes();
					for (var i = 0, l = vs.length; i < l; ++i)
					{
						var index = vertexesSeq.indexOf(vs[i]);
						if (index < 0)  // not found in seq, set a large value
							index = seqLength;
						result.push(index);
					}
					result.sort();
					return result;
				};

				var vertexes = graph.getVertexes();
				edges.sort(function(e1, e2) {
					var vs1 = _getConnectedVertexIndexes(e1, vertexes);
					var vs2 = _getConnectedVertexIndexes(e2, vertexes);
					return Kekule.ArrayUtils.compare(vs1, vs2);
				});
			}

			vertexes = graph.getVertexes();
			for (var i = 0, l = vertexes.length; i < l; ++i)
			{
				var v = vertexes[i];
				var linkedEdges = v.getEdges();
				linkedEdges.sort(function(e1, e2) {
					var index1 = edges.indexOf(e1);
					var index2 = edges.indexOf(e2);
					return index1 - index2;
				});
			}

			/*
			// debug
			vertexes = graph.getVertexes();
			for (var i = 0, l = vertexes.length; i < l; ++i)
			{
				var v = vertexes[i];
				var node = v.getData('object');
				console.log(i, node.getId(), node.getCanonicalizationIndex(), node.getAbsCoord3D(true));
			}
			*/
		}


		// at last set the spanning tree index of nodes
		this._setSpanningTreeIndexToNodeOfGraph(graph);
	},
	/** @private */
	_sortNodeByEcMapping: function(graph, ecMapping, ecVertexGroup)
	{
		var result = this._doSortNodeByEcMapping(graph, ecMapping, ecVertexGroup);
		return result;
	},
	/** @private */
	_doSortNodeByEcMapping: function(graph, ecMapping, ecVertexGroup)
	{
		// 1st phase, sort by ecMapping
		var sortedNodes1st = this._doSortNodeByEcMappingDirectly(ecVertexGroup);
		//console.log('before 2nd sorted', sortedNodes1st);

		// 2nd phase, sort all nodes by previous sorted ones
		var sortedNodes = this._doSortNodeBySortedNodeList(sortedNodes1st);

		//console.log('sorted', sortedNodes);

		// after 2nd vertex sort, using the largest vertex as starting point, generate a min distance array and sort for 3rd time
		/*
		var largestNodes = sortedNodes[sortedNodes.length - 1];
		var startingNode = AU.isArray(largestNodes) ? largestNodes[largestNodes.length - 1] : largestNodes;
		var startingVertex;
		var allVertexes = graph.getVertexes();
		for (var i = 0, l = allVertexes.length; i < l; ++i)
		{
			var v = allVertexes[i];
			if (v.getData('object') === startingNode)
			{
				startingVertex = v;
				break;
			}
		}
		if (startingVertex)
		{
			var minDistances = Kekule.GraphAlgorithmUtils.calcMinDistances(graph, startingVertex);
			var distanceMap = new Kekule.MapEx();
			for (var i = 0, l = minDistances.length; i < l; ++i)
			{
				v = allVertexes[i];
				var currNode = v.getData('object');
				if (currNode)
					distanceMap.set(currNode, minDistances[i]);
			}

			var sortedNodes3rd = [];
			//console.log('before', sortedNodes);
			for (var i = 0, l = sortedNodes.length; i < l; ++i)
			{
				var currNodes = sortedNodes[i];
				if (!AU.isArray(currNodes))   // only one node, input into sortedNodes
					sortedNodes3rd.push(currNodes);
				else if (currNodes.length === 1)
					sortedNodes3rd.push(currNodes[0]);
				else  // compare by min distances
				{
					var groupedCurrNodes = AU.group(currNodes, function(n1, n2){
						var d1 = distanceMap.get(n1) || Infinity;
						var d2 = distanceMap.get(n2) || Infinity;
						return (d1 - d2);
					});
					sortedNodes3rd = sortedNodes3rd.concat(groupedCurrNodes);
				}
			}
			sortedNodes = sortedNodes3rd;
			//console.log('after', sortedNodes);
		}
		*/

		// at last, standardize array
		var result = [];
		for (var i = 0, l = sortedNodes.length; i < l; ++i)
		{
			var currNodes = sortedNodes[i];
			if (!AU.isArray(currNodes))   // only one node, input into sortedNodes
				result.push(currNodes);
			else if (currNodes.length === 1)
				result.push(currNodes[0]);
			else
				result.push(currNodes);
		}

		return result;
	},
	/** @private */
	_doSortNodeByEcMappingDirectly: function(ecVertexGroup)
	{
		var sortedNodes1st = [];
		var vertexGroups = ecVertexGroup;  // || this._groupVertexesByEcValue(graph, ecMapping);
		// 1st pass, from top to bottom
		for (var i = 0, l = vertexGroups.length; i < l; ++i)
		{
			var vertexGroup = vertexGroups[i];
			var nodes = this._vertexesToNodes(vertexGroup.vertexes);
			if (nodes.length === 1)
				AU.pushUnique(sortedNodes1st, nodes[0]);
			else
			{
				var groups = this._groupNodesWithSameEcValue(nodes, sortedNodes1st);
				sortedNodes1st = sortedNodes1st.concat(groups);
			}
		}
		return sortedNodes1st;
	},
	/** @private */
	_doSortNodeBySortedNodeList: function(sortedNodes1st)
	{
		var currResult = this._doSortNodeBySortedNodeListCore(sortedNodes1st);
		var currGroupCount = currResult.length;
		var count = 0;
		do
		{
			var prevResult = currResult;
			var prevGroupCount = currGroupCount;
			var currResult = this._doSortNodeBySortedNodeListCore(prevResult);
			var currGroupCount = currResult.length;
		}
		while(currGroupCount > prevGroupCount);
		return prevResult;
	},
	/** @private */
	_doSortNodeBySortedNodeListCore: function(sortedNodes1st)
	{
		// 2nd pass, from top to bottom
		var sortedNodes = [];
		var handledNodes = [];
		for (var i = 0, l = sortedNodes1st.length; i < l; ++i)
		{
			var currNodes = sortedNodes1st[i];
			if (!AU.isArray(currNodes))   // only one node, input into sortedNodes
			{
				sortedNodes.push([currNodes]);
				handledNodes.push(currNodes);
			}
			else  // need compare
			{
				var _getSortLevel = function(node, repositoryNodes) {
					for (var i = 0, l = repositoryNodes.length; i < l; ++i)
					{
						if (!AU.isArray(repositoryNodes[i]))
						{
							if (repositoryNodes[i] === node)
								return i;
						}
						else if (repositoryNodes[i].indexOf(node) >= 0)
							return i;
					}
					return -1;
				};
				var _getSortLevels = function(centerNode, connectedNodes, repositoryNodes) {
					var result = [];
					for (var i = 0, l = connectedNodes.length; i < l; ++i)
					{
						result.push(_getSortLevel(connectedNodes[i], repositoryNodes));
					}
					result.sort(function(a, b) {
						return b - a;
					});
					//console.log(result);
					return result;
				};
				var _compFunc = function(n1, n2) {
					var connNodes1 = AU.intersect(n1.getLinkedObjs(), handledNodes);
					var connNodes2 = AU.intersect(n2.getLinkedObjs(), handledNodes);
					// compare connected node count
					var result = connNodes1.length - connNodes2.length;
					// compare connected node sorted level
					if (result === 0 && connNodes1.length > 0)
					{
						var sortLevels1 = _getSortLevels(n1, connNodes1, sortedNodes);
						var sortLevels2 = _getSortLevels(n2, connNodes2, sortedNodes);
						result = AU.compare(sortLevels1, sortLevels2);
					}
					if (result === 0)
					{
						// still same, check the first level sort array
						var connNodes1 = AU.intersect(n1.getLinkedObjs(), sortedNodes1st);
						var connNodes2 = AU.intersect(n2.getLinkedObjs(), sortedNodes1st);
						// compare connected node count
						var result = connNodes1.length - connNodes2.length;
						if (result === 0)
						{
							var sortLevels1 = _getSortLevels(n1, connNodes1, sortedNodes1st);
							var sortLevels2 = _getSortLevels(n2, connNodes2, sortedNodes1st);
							result = AU.compare(sortLevels1, sortLevels2);
						}
					}
					//console.log(result, n1.getId(), sortLevels1, n2.getId(), sortLevels2);
					return result;
				};
				var groupedCurrNodes = AU.group(currNodes, _compFunc);
				//console.log(groupedCurrNodes.map(function(item){ return item.getId(); }));
				sortedNodes = sortedNodes.concat(groupedCurrNodes);

				handledNodes = handledNodes.concat(currNodes);
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
	_setSpanningTreeIndexToNodeOfGraph: function(graph)
	{
		var spanningTrees = Kekule.GraphAlgorithmUtils.createSpanningTrees(graph, Kekule.GraphTraverseMode.DEPTH_FIRST);
		for (var i = 0, l = spanningTrees.length; i < l; ++i)
		{
			var tree = spanningTrees[i];
			if (tree.vertexes)
			{
				var length = tree.vertexes.length;
				for (var j = 0; j < length; ++j)
				{
					var node = tree.vertexes[j].getData('object');
					if (node && node.setCanonicalizationAssocIndex)
					{
						node.setCanonicalizationAssocIndex(length - j);
					}
				}
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
		if (isInitialRun)
			return this._initECs(graph, newECMapping);

		var ecValues = [];
		var ecTable = [];
		var vertexes = graph.getVertexes();
		for (var i = 0, l = vertexes.length; i < l; ++i)
		{
			var vertex = vertexes[i];
			var newEC = this._usePrimeECs? 1: 0;
			if (this._usePrimeECs)
				var primes = this._getPrimeArray();
			var neighbors = vertex.getNeighbors();
			for (var j = 0, k = neighbors.length; j < k; ++j)
			{
				if (this._usePrimeECs)
				{
					newEC *= primes[(oldECMapping.get(neighbors[j]) - 1) || 0];
				}
				else
					newEC += oldECMapping.get(neighbors[j]) || 0;
			}
			AU.pushUnique(ecValues, newEC);
			if (!ecTable[newEC])
				ecTable[newEC] = [vertex];
			else
				ecTable[newEC].push(vertex);
		}
		//console.log('ecValues-Old', ecValues);
		ecValues.sort(function(a, b){ return a - b; });
		//console.log('ecValues-New', ecValues);
		var vertexGroup = [];
		for (var i = 0, l = ecValues.length; i <l; ++i)
		{
			var ecValue = ecValues[i];
			if (ecTable[ecValue])
				vertexGroup.push(ecTable[ecValue]);
		}
		this._setECValueByVertexGroup(vertexGroup, newECMapping);
		//console.log('ECs: ', ecValues);
		return vertexGroup.length;
	},
	/*
	_processECs_OLD: function(graph, newECMapping, oldECMapping, isInitialRun)
	{
		if (isInitialRun)
			return this._initECs(graph, newECMapping);

		var ecValues = [];
		var vertexes = graph.getVertexes();
		for (var i = 0, l = vertexes.length; i < l; ++i)
		{
			var vertex = vertexes[i];
			var sum = 0;
			//if (!isInitialRun)
			{
				var neighbors = vertex.getNeighbors();
				for (var j = 0, k = neighbors.length; j < k; ++j)
				{
					sum += oldECMapping.get(neighbors[j]) || 0;
				}
			}
			newECMapping.set(vertex, sum);
			AU.pushUnique(ecValues, sum);
		}
		//console.log('ECs: ', ecValues);
		return ecValues.length;
	},
	*/
	/** @private */
	_initECs: function(graph, newECMapping)
	{
		// using Unique SMILES method to group EC
		var ecValueTable = [];
		var vertexes = graph.getVertexes();
		// calc connection count first
		for (var i = 0, l = vertexes.length; i < l; ++i)
		{
			var vertex = vertexes[i];
			var edgeCount = vertex.getEdgeCount();
			if (!ecValueTable[edgeCount])
			{
				ecValueTable[edgeCount] = [vertex];
			}
			else
				ecValueTable[edgeCount].push(vertex);
		}
		//console.log(ecValueTable.length, ecValueTable);
		// then consider the difference of atoms
		var vertexGroup = [];
		for (var i = 0, l = ecValueTable.length; i < l; ++i)
		{
			var vertexes = ecValueTable[i];
			//console.log(vertexes);
			if (vertexes)
			{
				if (vertexes.length === 1)  // single vertex, put in directly
					vertexGroup.push(vertexes);
				else  // a group of same edge count, need group them further by atoms
				{
					var subGroups = AU.group(vertexes, function(v1, v2){
						var node1 = v1.getData('object');
						var node2 = v2.getData('object');
						//var result = node1.getLinkedConnectorCount() - node2.getLinkedConnectorCount();
						var result = (node1.getLinkedNonHydrogenConnectors() || []).length - (node2.getLinkedNonHydrogenConnectors() || []).length;
						if (!result)
						{
							result = node1.compareStructure(node2);
							if (!result)
								result = (node1.getHydrogenCount? node1.getHydrogenCount(true): 0) - (node2.getHydrogenCount? node2.getHydrogenCount(true): 0);
						}
						return result;
					});
					//console.log(vertexes, subGroups);
					for (var j = 0, k = subGroups.length; j < k; ++j)
					{
						vertexGroup.push(AU.toArray(subGroups[j]));
					}
				}
			}
		}
		//console.log(vertexGroup);
		// at last assign EC values to each vertexes
		this._setECValueByVertexGroup(vertexGroup, newECMapping);
		return vertexGroup.length;
	},
	/** @private */
	_setECValueByVertexGroup: function(vertexGroup, ECMapping)
	{
		for (var i = 0, l = vertexGroup.length; i < l; ++i)
		{
			var vertexes = vertexGroup[i];
			for (var j = 0, k = vertexes.length; j < k; ++j)
			{
				ECMapping.set(vertexes[j], i + 1);
			}
		}
	},
	/** @private */
	_getPrimeArray: function()
	{
		//return [];
		if (!Kekule.CanonicalizationMorganIndexer.primes)
			Kekule.CanonicalizationMorganIndexer.primes = Kekule.NumUtils.getPrimes(10000);
		return Kekule.CanonicalizationMorganIndexer.primes;
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
			if (graph.getVertexes().length < this._getPrimeArray().length)  // can use prime EC values
				this._usePrimeECs = true;
			else
				this._usePrimeECs = false;

			var index = 0;
			var currECMapping = ecMappings[0];
			var oldECMapping = ecMappings[0];
			var oldEcMemberCount = 0;
			var lastVertexGroup, currVertexGroup;
			var storedVertexGroups = [];  // stores vertex groups of all same EC length
			var ecMemberCount = this._processECs(graph, currECMapping, oldECMapping, true);
			//var currVertexGroup = this._groupVertexesByEcValue(graph, currECMapping);
			var doProcess = true;
			//while (ecMemberCount >= oldEcMemberCount)
			while (doProcess)
			{
				oldEcMemberCount = ecMemberCount;
				lastVertexGroup = currVertexGroup;
				oldECMapping = currECMapping;
				++index;
				//var j = index % 2;
				currECMapping = ecMappings[index % 2];
				//oldECMapping = ecMappings[(index + 1) % 2];
				ecMemberCount = this._processECs(graph, currECMapping, oldECMapping);
				currVertexGroup = null;

				doProcess = ecMemberCount > oldEcMemberCount;  // if ec count arises, continue process

				if (ecMemberCount === oldEcMemberCount)  // some times occurs
				{
					currVertexGroup = this._groupVertexesByEcValue(graph, currECMapping);
					if (!lastVertexGroup && oldECMapping)  // calculate only when needed
					{
						lastVertexGroup = this._groupVertexesByEcValue(graph, oldECMapping);
					}
					storedVertexGroups.push(lastVertexGroup);
					//doProcess = this._compareEcVertexGroup(currVertexGroup, lastVertexGroup) !== 0;
					doProcess = !this._hasVertexGroup(currVertexGroup, storedVertexGroups);
				}
				else  // new group count differs from last, clear stored vertex groups
				{
					storedVertexGroups = [];
				}
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
		return {ecMapping: oldECMapping, ecCount: oldEcMemberCount,
			vertexGroup: lastVertexGroup || this._groupVertexesByEcValue(graph, oldECMapping)};
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
	_hasVertexGroup: function(group, groups)
	{
		for (var i = 0, l = groups.length; i < l; ++i)
		{
			if (this._compareEcVertexGroup(group, groups[i]) === 0)
				return true;
		}
		return false;
	},
	/** @private */
	_compareEcVertexGroup: function(group1, group2)
	{
		var count = group1.length;
		var result = count - group2.length;
		if (result === 0)  // further check
		{
			var vSame;
			for (var i = 0; i < count; ++i)
			{
				result = group1[i].vertexes.length - group2[i].vertexes.length;
				if (result === 0)
					result = AU.exclude(group1[i].vertexes, group2[i].vertexes).length;
				if (result !== 0)
					break;
			}
		}
		return result;
	},
	/** @private */
	_groupNodesWithSameEcValue: function(nodes, sortedNodes)
	{
		var formAssocCompareArray = function(node, sortedNodes)
		{
			var flattenSortedNodes = AU.flatten(sortedNodes);
			var linkedObjs = node.getLinkedObjs();
			var linkedNodes = AU.intersect(linkedObjs, flattenSortedNodes);
			var nIndexCompareValues = [];  // calc from node
			/*
			var cOrderCompareValues = [];  // calc from connector
			var cTypeCompareValues = [];
			var cParityCompareValues = [];
			*/
			var connectors = [];
			for (var i = 0, l = linkedNodes.length; i < l; ++i)
			{
				var n = linkedNodes[i];
				//nIndexCompareValues.push(sortedNodes.indexOf(n));
				var indexStack = AU.indexStackOfElem(n, sortedNodes);
				nIndexCompareValues.push(indexStack);
			}
			//nIndexCompareValues.sort( function(a, b) { return a - b; });
			nIndexCompareValues.sort( function(a, b) { return AU.compare(a, b); });
			for (var i = 0, l = nIndexCompareValues.length; i < l; ++i)
			{
				//var n = sortedNodes[nIndexCompareValues[i]];
				//console.log('stack', nIndexCompareValues[i]);
				var n = AU.getElemByIndexStack(sortedNodes, nIndexCompareValues[i]);
				if (!n)
					console.error('not found', n, nIndexCompareValues[i]);
				var conn = node.getConnectorTo(n);
				//if (conn.getParity())
				//console.log('conn ', conn.getId(), conn.getParity());
				/*
				var connType = conn.getBondType? conn.getBondType() || Kekule.BondType.DEFAULT: null;
				var connOrder = (conn.getBondOrder && conn.getBondOrder()) || Kekule.BondOrder.DEFAULT;
				var connParity = (conn.getParity && conn.getParity()) || Kekule.StereoParity.UNKNOWN;
				cOrderCompareValues.push(connOrder);
				cTypeCompareValues.push(connType);
				cParityCompareValues.push(connParity);
				*/
				connectors.push(conn);
			}
			//console.log(flattenSortedNodes, linkedNodes, nIndexCompareValues);
			return {
				nodeIndexValues: nIndexCompareValues,
				//nodeParityValues: nParityCompareValues,
				/*
				connectorTypeValues: cOrderCompareValues,
				connectorOrderValues: cOrderCompareValues,
				connectorParityValues: cParityCompareValues
				*/
				connectors: connectors
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
					//console.log(n1.getId(), compareValue1, n2.getId(),compareValue2);
					result = AU.compare(compareValue1.nodeIndexValues, compareValue2.nodeIndexValues);

					// connected node can not distinguish, need to check linked connectors
					/*
					if (result === 0)
						result = AU.compare(compareValue1.connectorTypeValues, compareValue2.connectorTypeValues);
					if (result === 0)
						result = AU.compare(compareValue1.connectorOrderValues, compareValue2.connectorOrderValues);
					if (result === 0)
						result === AU.compare(compareValue1.connectorParityValues, compareValue2.connectorParityValues);
					*/
					var conns1 = compareValue1.connectors, conns2 =compareValue2.connectors;
					for (var i = 0, l = conns1.length; i < l; ++i)  // we are sure that conns1/2 has the same length
					{
						result = conns1[i].compareStructure(conns2[i]);
						if (result !== 0)
							break;
					}

					// still can not distinguish, check ring situation
					if (result === 0)
					{
						var sssr1 = (n1.getBelongedSssrRings && n1.getBelongedSssrRings()) || [];
						var sssr2 = (n2.getBelongedSssrRings && n2.getBelongedSssrRings()) || [];
						result = sssr1.length - sssr2.length;
						if (result === 0)  // check ring sizes
						{
							var ringSizes1 = [], ringSizes2 = [];
							for (var i = 0, l = sssr1.length; i < l; ++i)
							{
								ringSizes1.push(sssr1[i].nodes.length);
								ringSizes2.push(sssr2[i].nodes.length);
							}
							ringSizes1.sort();
							ringSizes2.sort();
							result = AU.compare(ringSizes1, ringSizes2);
						}
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
		var nodeCompareFunc = function(startingNode, n1, n2, nodeMinDistanceMap)
		{
			var result;
			var cIndex1 = n1.getCanonicalizationIndex();
			var cIndex2 = n2.getCanonicalizationIndex();
			// console.log('INDEX', n1.getSymbol(), cIndex1, n2.getSymbol(), cIndex2);
			result = (cIndex1 || -1) - (cIndex2 || -1);

			if (result === 0)  // canonicalization index is same, compare connectors
			{
				if (startingNode)
				{
					var connector1 = startingNode.getConnectorTo(n1);
					var connector2 = startingNode.getConnectorTo(n2);
					//result = Kekule.UnivChemStructObjComparer.compare(connector1, connector2);
					result = connector1.compareStructure(connector2);
				}
				/*
				if (result === 0)  // same, check other connected objects of n1/n2
				{
					var neighborNodesOfN1 = n1.getLinkedObjs();
					var neighborNodesOfN2 = n2.getLinkedObjs();
					//if ()
				}
				*/
				if (result === 0)  // same, check distances to starting node
				{
					if (nodeMinDistanceMap)
					{
						var d1 = nodeMinDistanceMap.get(n1) || Infinity;
						var d2 = nodeMinDistanceMap.get(n2) || Infinity;
						result = d1 - d2;
					}
				}
				if (result === 0)  // same, check cano assoc index
				{
					var aIndex1 = n1.getCanonicalizationAssocIndex();
					var aIndex2 = n2.getCanonicalizationAssocIndex();
					result = (aIndex1 || -1) - (aIndex2 || -1);
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

			// calc the min distance map
			// var minDistanceMap = this._calcMinDistanceMap(ctab, currNode);

			//console.log('starting node', currNode.getSymbol(), i);

			//var currNode = nodeSeq[nodeSeq.length - 1];
			//remainingNodes.splice(nodeSeq.length - 1, 1);
			remainingNodes.splice(currNodeIndex, 1);
			var sortedNodes = [];
			var sortedUnindexedNodes = [];  // sorted hydrogen atom that has no cannonicalization index

			if (currNode)
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
						return nodeCompareFunc(startingNode, a, b /*, minDistanceMap*/);
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
	},

	/* @private */
	/*
	_calcMinDistanceMap: function(ctab, fromNode)
	{
		var graph = Kekule.GraphAdaptUtils.ctabToGraph(ctab);
		var vertexes = graph.getVertexes();
		var fromVertex;
		for (var i = 0, l = vertexes.length; i < l; ++i)
		{
			var v = vertexes[i];
			if (v.getData('object') === fromNode)
			{
				fromVertex = v;
				break;
			}
		}
		var distances = Kekule.GraphAlgorithmUtils.calcMinDistances(graph, fromVertex || 0);

		var result = new Kekule.MapEx();
		for (var i = 0, l = distances.length; i < l; ++i)
		{
			var v = vertexes[i];
			var node = v.getData('object');
			if (node)
			{
				result.set(node, distances[i]);
			}
		}
		return result;
	}
	*/
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
				if (!ctab || ctab.isEmpty())  // empty structure
					return structFragmentOrCtab;
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
ClassEx.defineProp(Kekule.ChemStructureObject, 'canonicalizationIndex', {'dataType': DataType.INT, 'serializable': false, 'scope': Class.PropertyScope.PUBLISHED});
ClassEx.defineProp(Kekule.ChemStructureObject, 'canonicalizationAssocIndex', {'dataType': DataType.INT, 'serializable': false, 'scope': Class.PropertyScope.PUBLISHED});


// register morgan as default
Kekule.canonicalizer.registerExecutor('morgan', [Kekule.CanonicalizationMorganIndexer, Kekule.CanonicalizationMorganNodeSorter], true);



})();
