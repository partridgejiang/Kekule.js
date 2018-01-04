/**
 * @fileoverview
 * Implementation of graph structure for some algorithms on ctab.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /core/kekule.structures.js
 * requires /core/kekule.chemUtils.js
 * requires /utils/kekule.utils.js
 */

(function(){
"use strict";

var AU = Kekule.ArrayUtils;

/**
 * A class to represent an abstract graph child (vertex or edge).
 * @class
 * @augments ObjectEx
 */
Kekule.GraphElement = Class.create(ObjectEx,
/** @lends Kekule.GraphElement# */
{
	/** @private */
	CLASS_NAME: 'Kekule.GraphElement',
	/** @constructs */
	initialize: function($super)
	{
		$super();
		this._data = {};
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('storedData', {
			'dataType': DataType.HASH,
			'getter': function() { return this._data; },
			'setter': function(data) { this._data = data || {}; }
		});
	},
	/**
	 * Returns stored data value. If key name not set,
	 * a hash of al data will be returned.
	 * @param {String} keyName
	 * @returns {Variant}
	 */
	getData: function(keyName)
	{
		return keyName? this._data[keyName]: this._data;
	},
	/**
	 * Store a key-value pair in data.
	 * @param {String} keyName
	 * @param {Variant} value
	 */
	setData: function(keyName, value)
	{
		if (keyName)
			this._data[keyName] = value;
		return this;
	},
	/**
	 * Remove a stored data item.
	 * @param {String} keyName
	 */
	removeData: function(keyName)
	{
		if (this._data[keyName])
			delete this._data[keyName];
		return this;
	}
});

/**
 * A class to represent a abstract graph vertex.
 * @class
 * @augments Kekule.GraphElement
 *
 * //@property {Hash} data Extra data assocaited with this vertex (e.g., color).
 * @property {Array} edges Connected edges to this vertex.
 */
Kekule.GraphVertex = Class.create(Kekule.GraphElement,
/** @lends Kekule.GraphVertex# */
{
	/** @private */
	CLASS_NAME: 'Kekule.GraphVertex',
	/** @constructs */
	initialize: function($super)
	{
		$super();
		this.setPropStoreFieldValue('edges', []);
		//this.setData({});
	},
	/** @private */
	initProperties: function()
	{
		//this.defineProp('data', {'dataType': DataType.HASH});
		this.defineProp('edges', {'dataType': DataType.ARRAY, 'serializable': false, 'setter': null});
	},

	/**
	 * Returns count of connected edges (degree).
	 * @returns {Int}
	 */
	getEdgeCount: function()
	{
		return this.getEdges().length;
	},
	/**
	 * Return an array of neighboring vertexes.
	 * @returns {Array}
	 */
	getNeighbors: function()
	{
		var result = [];
		var edges = this.getEdges();
	  for (var i = 0, l = edges.length; i < l; ++i)
		{
			var vs = edges[i].getVertexes();
			AU.pushUnique(result, AU.exclude(vs, this));
		}
		return result;
	},
	/**
	 * Returns neighboring vertex connected by edge.
	 * @param {Kekule.GraphEdge} edge
	 * @returns {Kekule.GraphVertex}
	 */
	getNeighborOnEdge: function(edge)
	{
		var vs = edge.getVertexes();
		for (var i = 0, l = vs.length; i < l; ++i)
		{
			if (vs[i] !== this)
				return vs[i];
		}
	},
	/**
	 * Returns edge that connects neighborVertex and this vertex.
	 * @param {Kekule.GraphVertex} neighborVertex
	 * @returns {Kekule.GraphEdge}
	 */
	getEdgeTo: function(neighborVertex)
	{
		var edges = this.getEdges();
		for (var i = 0, l = edges.length; i < l; ++i)
		{
			var vs = edges[i].getVertexes();
			if (vs.indexOf(neighborVertex) >= 0)
				return edges[i];
		}
		return null;
	},
	/**
	 * Connect new edge to vertex.
	 * @param {Kekule.GraphEdge} edge
	 * @private
	 */
	doAppendEdge: function(edge)
	{
		Kekule.ArrayUtils.pushUnique(this.getEdges(), edge);
		return this;
	},
	/**
	 * Disconnect an edge.
	 * @param {Kekule.GraphEdge} edge
	 * @private
	 */
	doRemoveEdge: function(edge)
	{
		Kekule.ArrayUtils.remove(this.getEdges(), edge);
		return this;
	},
	/**
	 * Disconnect all edges.
	 * @private
	 */
	doClearEdges: function()
	{
		var edges = this.getEdges();
		for (var i = edges.length - 1; i >= 0; --i)
		{
			this.removeEdge(edges[i]);
		}
		return this;
	}
});

/**
 * A class to represent a abstract graph edge.
 * @class
 * @augments Kekule.GraphElement
 *
 * @property {Hash} data Extra data assocaited with this edge (e.g., weight).
 * @property {Array} vertexes Connected vertexes on this edge.
 */
Kekule.GraphEdge = Class.create(Kekule.GraphElement,
/** @lends Kekule.GraphEdge# */
{
	/** @private */
	CLASS_NAME: 'Kekule.GraphEdge',
	/** @constructs */
	initialize: function($super)
	{
		$super();
		this.setPropStoreFieldValue('vertexes', []);
		//this.setData({});
	},
	/** @private */
	initProperties: function()
	{
		//this.defineProp('data', {'dataType': DataType.HASH});
		this.defineProp('vertexes', {'dataType': DataType.ARRAY, 'serializable': false, 'setter': null});
	}
});

/**
 * Enumeration of traverse mode of graph
 * @enum
 */
Kekule.GraphTraverseMode = {
	/** Depth first. */
	DEPTH_FIRST: 0,
	/** Breadth first. */
	BREADTH_FIRST: 1
};

/**
 * A class to represent a abstract graph.
 * @class
 * @augments ObjectEx
 *
 * @property {Array} vertexes All nodes in this graph.
 * @property {Array} edges Connectors in this graph.
 */
Kekule.Graph = Class.create(ObjectEx,
/** @lends Kekule.Graph# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Graph',
	/** @private */
	VISITED_KEY: '__$visited__',
	/** @constructs */
	initialize: function($super)
	{
		$super();
		this.setPropStoreFieldValue('vertexes', []);
		this.setPropStoreFieldValue('edges', []);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('vertexes', {'dataType': DataType.ARRAY, 'serializable': false, 'setter': null});
		this.defineProp('edges', {'dataType': DataType.ARRAY, 'serializable': false, 'setter': null});
	},

	/**
	 * Add a new vertex to graph.
	 * @param {Kekule.GraphVertex} vertex
	 */
	addVertex: function(vertex)
	{
		Kekule.ArrayUtils.pushUnique(this.getVertexes(), vertex);
		return this;
	},
	/**
	 * Create a new vertex in graph.
	 * @returns {Kekule.GraphVertex}
	 */
	newVertex: function()
	{
		var result = new Kekule.GraphVertex();
		this.addVertex(result);
		return result;
	},
	/**
	 * Remove a vertex (and its connected edges) from graph.
	 * @param {Kekule.GraphVertex} vertex
	 */
	removeVertex: function(vertex)
	{
		if (Kekule.ArrayUtils.remove(this.getVertexes(), vertex))  // remove successful
		{
			var edges = vertex.getEdges();
			for (var i = 0, l = edges.length; i < l; ++i)
				this.removeEdge(edges[i]);
		}
	},

	/**
	 * Add an edge to graph and connect it to vertex1 and vertex2.
	 * @param {Kekule.GraphEdge} edge
	 * @param {Kekule.GraphVertex} vertex1
	 * @param {Kekule.GraphVertex} vertex2
	 */
	addEdge: function(edge, vertex1, vertex2)
	{
		if (Kekule.ArrayUtils.pushUnique(this.getEdges(), edge))
		{
			edge.setPropStoreFieldValue('vertexes', [vertex1, vertex2]);
			vertex1.doAppendEdge(edge);
			vertex2.doAppendEdge(edge);
		}
		return this;
	},
	/**
	 * Create a new edge in graph and connect it to vertex1 and vertex2.
	 * @param {Kekule.GraphVertex} vertex1
	 * @param {Kekule.GraphVertex} vertex2
	 * @returns {Kekule.GraphEdge}
	 */
	newEdge: function(vertex1, vertex2)
	{
		var result = new Kekule.GraphEdge();
		this.addEdge(result, vertex1, vertex2);
		return result;
	},
	/**
	 * Remove an edge from graph.
	 * @param {Kekule.GraphEdge} edge
	 */
	removeEdge: function(edge)
	{
		var vertexes = edge.getVertexes();
		for (var i = 0, l = vertexes.length; i < l; ++i)
		{
			var v = vertexes[i];
			v.doRemoveEdge(edge);
		}
		Kekule.ArrayUtils.remove(this.getEdges(), edge);
		return this;
	},

	/**
	 * Traverse the whole graph. Each vertex or edge traversed will be passed in callback function.
	 * @param {Func} callback Callback(currObj, isEdge).
	 * @param {Kekule.GraphVertex} startingVertex If not set, first vertex of graph will be used as starting point.
	 * @param {Int} mode Traverse mode, depth or breadth first, value from {@link Kekule.GraphTraverseMode}.
	 * @returns {Array} Items are hash object containing the following fields:
	 *   {
	 *     vertexes: Array,
	 *     edges: Array
	 *   }
	 *   which stores the traverse sequence.
	 *   As the graph may not be a connected one, so several sequence may be returned.
	 */
	traverse: function(callback, mode, startingVertex)
	{
		var result = [];

		var remainingVertexes = AU.clone(this.getVertexes());
		// init
		for (var i = 0, l = remainingVertexes.length; i < l; ++i)
		{
			remainingVertexes[i].setData(this.VISITED_KEY, false);
		}
		while (remainingVertexes.length)
		{
			var seq = {
				vertexes: [],
				edges: []
			};
			var currVertex;
			if (startingVertex && (remainingVertexes.indexOf(startingVertex) >= 0))
				currVertex = startingVertex;
			else
				currVertex = remainingVertexes[0];
			//while (remainingVertexes.length)
			{
				var partialResult = this._doTravers(callback, mode, currVertex);
				seq.vertexes = seq.vertexes.concat(partialResult.vertexes);
				seq.edges = seq.edges.concat(partialResult.edges);
				remainingVertexes = AU.exclude(remainingVertexes, partialResult.vertexes);
			}
			result.push(seq);
		}
		return result;
	},

	_doTravers: function(callback, mode, startingVertex)
	{
		var result = {
			vertexes: [],
			edges: []
		};
		var vertex = startingVertex;

		if (!vertex.getData(this.VISITED_KEY))
		{
			result.vertexes.push(vertex);
			vertex.setData(this.VISITED_KEY, true);
			if (callback)
				callback(vertex, false);
		}

		var edges = vertex.getEdges();
		var unvisitedVertexes = [];
		var breadthFirst = mode === Kekule.GraphTraverseMode.BREADTH_FIRST;
		for (var i = 0, l = edges.length; i < l; ++i)
		{
			var edge = edges[i];
			var neighbor = vertex.getNeighborOnEdge(edge);
			if (!neighbor.getData(this.VISITED_KEY))
			{
				result.vertexes.push(neighbor);
				result.edges.push(edge);
				neighbor.setData(this.VISITED_KEY, true);
				if (callback)
				{
					callback(edge, true);
					callback(neighbor, false);
				}

				if (breadthFirst)
					unvisitedVertexes.push(neighbor);
				else // depth first
				{
					var nextResult = this._doTravers(callback, mode, neighbor);
					result.vertexes = result.vertexes.concat(nextResult.vertexes);
					result.edges = result.edges.concat(nextResult.edges);
				}
			}
		}

		if (breadthFirst)
		{
			for (var i = 0, l = unvisitedVertexes.length; i < l; ++i)
			{
				var v = unvisitedVertexes[i];
				var nextResult = this._doTravers(callback, mode, v);
				result.vertexes = result.vertexes.concat(nextResult.vertexes);
				result.edges = result.edges.concat(nextResult.edges);
			}
		}
		return result;
	}
});

/*
 * Default options to convert ctab to graph.
 * @object
 */
Kekule.globalOptions.add('algorithm.molToGraph', {
	expandSubStructures: true,
	ignoreBondedHydrogen: true
});

/**
 * Util class to help to convert other structures (e.g., molecule ctab) to graph.
 * @class
 */
Kekule.GraphAdaptUtils = {
	/**
	 * Create corresponding graph from a ctab.
	 * @param {Kekule.StructureConnectionTable} connTab
	 * @param {Kekule.Graph} graph If not set, a new graph will be created.
	 * @param {Hash} options Options to convert to graph. Can include fields:
	 *   {
	 *     nodeClasses: array, only node instanceof those classes will be included in graph.
	 *     connectorClasses: array, only connector instanceof those classes will be included in graph.
	 *     bondTypes: array, only bond types in this array will be converted into edge in graph.
	 *     expandSubStructures: bool, when put nodes and connectors in graph also. Default is true.
	 *     ignoreBondedHydrogen: Whether bonded hydrogen atom (on bond end) are converted into graph. Default is true.
	 *
	 *     nodeFilter: func(node, allCtabConnectors), returns bool, a custom function, if false returned, this node will be ignored
	 *     connectorFilter: func(connector, allCtabNodes), returns bool, a custom function, if false returned, this connector will be ignored
	 *   }
	 * @returns {Kekule.Graph} Original node and connector can be retrieved by vertexOrEdge.getData('object').
	 */
	ctabToGraph: function(connTab, graph, options)
	{
		var op = Object.extend(Object.extend({}, Kekule.globalOptions.algorithm.molToGraph), options || {});
		var ctab = connTab;
		var AU = Kekule.ArrayUtils;
		var result = null;

		var expandSub = op.expandSubStructures;

		/*
		if (ctab.getSubFragments().length)  // has sub fragment, degroup it first
		{
			var clone = ctab.clone();
			clone.unmarshalAllSubFragments();
			//console.log(clone.getNodeCount(), clone.getConnectorCount());
			ctab = clone;
		}
		*/

		if (ctab)
		{
			var nodeFilter = op.nodeFilter || function(node, allConnectors) {  // default node filter
						if (op.nodeClasses)
						{
							var nc = node.getClass();
							if (!ClassEx.isOrIsDescendantOfClasses(nc, op.nodeClasses))
								return false;
						}
						if (op.ignoreBondedHydrogen)
						{
							if (node.isHydrogenAtom && node.isHydrogenAtom())
							{
								var linkedConns = node.getLinkedConnectors();
								if (allConnectors)
									linkedConns = AU.intersect(linkedConns, allConnectors);
								if (linkedConns.length <= 1)
									return false;
							}
						}
						return true;
					};
			var connectorFilter = op.connectorFilter || function(connector, allNodes) {  // default connector filter
						if (op.connectorClasses)
						{
							var cc = connector.getClass();
							if (!ClassEx.isOrIsDescendantOfClasses(cc, op.connectorClasses))
								return false;
						}
						if (connector.getBondType && op.bondTypes)
						{
							if (op.bondTypes.indexOf(connector.getBondType()) < 0)
								return false;
						}
						/*
						if (op.ignoreBondedHydrogen && connector.isNormalConnectorToHydrogen && connector.isNormalConnectorToHydrogen())
						{
							return false;
						}
						*/
						return true;
					};

			var result = graph || new Kekule.Graph();
			var connectors = expandSub? ctab.getAllContainingConnectors(): ctab.getConnectors();
			var nodes = expandSub? ctab.getLeafNodes(): ctab.getNodes();

			var addedNodes = [];
			var vertexMap = new Kekule.MapEx();
			for (var i = 0, l = connectors.length; i < l; ++i)
			{
				var connector = connectors[i];

				if (!connectorFilter(connector))
					continue;

				var connNodes = [];
				var connectedObjs = expandSub? connector.getConnectedObjs(): connector.getConnectedSiblings();
				for (var j = 0, k = connectedObjs.length; j < k; ++j)
				{
					var connObj = connectedObjs[j];
					if (nodes.indexOf(connObj) >= 0)  // add nodes, bypass connected connectors
					{
						if (nodeFilter(connObj, connectors))  // bypass ignored nodes
							connNodes.push(connObj);
						else
							AU.pushUnique(addedNodes, connObj);
						if (connNodes.length >= 2)
						{
							var newNodes = AU.exclude(connNodes, addedNodes);
							for (var ii = 0, ll = newNodes.length; ii < ll; ++ii)
							{
								var v = result.newVertex();
								//v.getData().object = newNodes[ii];
								v.setData('object', newNodes[ii]);
								vertexMap.set(newNodes[ii], v);
							}
							var e = result.newEdge(vertexMap.get(connNodes[0]), vertexMap.get(connNodes[1]));
							//e.getData().object = connector;
							e.setData('object', connector);
							AU.pushUnique(addedNodes, connNodes);
							break;
						}
					}
				}
			}

			// if there still unadded nodes
			var remainingNodes = AU.exclude(nodes, addedNodes);
			for (var i = 0, l = remainingNodes.length; i < l; ++i)
			{
				var node = remainingNodes[i];
				if (nodeFilter(node, connectors))
				{
					var v = result.newVertex();
					v.setData('object', node);
					//vertexMap.set(newNodes[ii], v);
				}
			}

			vertexMap.finalize();
		}
		return result;
	},
	/**
	 * Create corresponding graph from a molecule ctab.
	 * @param {Kekule.StructureFragment} mol
	 * @param {Kekule.Graph} graph If not set, a new graph will be created.
	 * @param {Hash} options Options to convert to graph. Can include fields:
	 *   {
	 *     connectorClasses: array, only connector instanceof those classes will be included in graph.
	 *     bondTypes: array, only bond types in this array will be converted into edge in graph.
	 *     expandSubStructures: bool, when put nodes and connectors in graph also. Default is true.
	 *     ignoreBondedHydrogen: Whether bonded hydrogen atom are converted into graph. Default is true.
	 *   }
	 * @returns {Kekule.Graph}
	 */
	molToGraph: function(mol, graph, options)
	{
		var AU = Kekule.ArrayUtils;
		var result = null;
		if (!mol || !mol.hasCtab())
			return null;
		var ctab = mol.getCtab();
		/*
		if (mol.getSubFragments().length)  // has sub fragment, degroup it first
		{
			var clone = mol.clone();
			clone.unmarshalAllSubFragments();
			//console.log(clone.getNodeCount(), clone.getConnectorCount());
			ctab = clone.getCtab();
		}
		else
			ctab = mol.getCtab();
		*/

		if (ctab)
		{
			return Kekule.GraphAdaptUtils.ctabToGraph(ctab, graph, options);
			/*
			var result = graph || new Kekule.Graph();
			var connectors = ctab.getConnectors();
			var nodes = ctab.getNodes();

			var addedNodes = [];
			var vertexMap = new Kekule.MapEx();
			for (var i = 0, l = connectors.length; i < l; ++i)
			{
				var connector = connectors[i];
				var connNodes = [];
				for (var j = 0, k = connector.getConnectedObjCount(); j < k; ++j)
				{
					var connObj = connector.getConnectedObjAt(j);
					if (nodes.indexOf(connObj) >= 0)  // add nodes bypass connected connectors
					{
						connNodes.push(connObj);
						if (connNodes.length >= 2)
						{
							var newNodes = AU.exclude(connNodes, addedNodes);
							for (var ii = 0, ll = newNodes.length; ii < ll; ++ii)
							{
								var v = result.newVertex();
								//v.getData().object = newNodes[ii];
								v.setData('object', newNodes[ii]);
								vertexMap.set(newNodes[ii], v);
							}
							var e = result.newEdge(vertexMap.get(connNodes[0]), vertexMap.get(connNodes[1]));
							//e.getData().object = connector;
							e.setData('object', connector);
							AU.pushUnique(addedNodes, connNodes);
							break;
						}
					}
				}
			}
			vertexMap.finalize();
			*/
		}
		return result;
	},
	/**
	 * Create corresponding graph from any chem object.
	 * @param {Kekule.ChemObject} obj
	 * @param {Kekule.Graph} graph If not set, a new graph will be created.
	 * @param {Hash} options Options to convert to graph. Can include fields:
	 *   {
	 *     connectorClasses: array, only connector instanceof those classes will be included in graph.
	 *     bondTypes: array, only bond types in this array will be converted into edge in graph.
	 *     expandSubStructures: bool, when put nodes and connectors in graph also. Default is true.
	 *     ignoreBondedHydrogen: Whether bonded hydrogen atom are converted into graph. Default is true.
	 *   }
	 * @returns {Kekule.Graph}
	 */
	chemObjToGraph: function(obj, graph, options)
	{
		var mols = Kekule.ChemStructureUtils.getAllStructFragments(obj, true);
		var result = graph || new Kekule.Graph();
		for (var i = 0, l = mols.length; i < l; ++i)
		{
			Kekule.GraphAdaptUtils.molToGraph(mols[i], result, options);
		}
		return result;
	}
};

/**
 * Util class to do common algorithms on graph.
 * @class
 */
Kekule.GraphAlgorithmUtils = {
	// private constants
	/** @private */
	SEQ_KEY: '__$seq__',
	/** @private */
	RESD_DEGREE_KEY: '__$resdDegree__',
	/** @private */
	VISIT_EDGE_DEGREE_KEY: '__$visitedEdgeDegree__',
	/** @private */
	TYPE_KEY: '__$type__',
	/** @private */
	TYPE_CYCLE: 'cycle',
	/** @private */
	TYPE_BRIDGE: 'bridge',
	/** @private */
	VISITED_KEY: '__$visited',
	/**
	 * Creating a depth first spanning tree (child graph) of graph.
	 * @param {Kekule.Graph} graph
	 * @param {int} traverseMode Depth or breadth first.
	 * @returns {Array} Items are hashes that contains the follow fields:
	 *   {
	 *     vertexes: Array of all found vertexes.
	 *     edges: Array of all found edges.
	 *   }
	 *   which indicate a spanning tree in graph. As the graph may not be connected,
	 *   so several spanning trees may exists.
	 */
	createSpanningTrees: function(graph, traverseMode)
	{
		return graph.traverse(null, traverseMode);
	},

	/**
	 * Returns all vertexes and edges in cylce block.
	 * @param {Kekule.Graph} graph
	 * @returns {Array} An array containing a series of hash with fields:
	 *   {
	 *     vertexes: Array of all found vertexes.
	 *     edges: Array of all found edges.
	 *   }
	 *   Each array item marks a cycle block.
	 */
	findCycleBlocks: function(graph)
	{
		/*
		var result = {
			vertexes: [],
			edges: []
		};
		*/
		var result = [];

		var U = Kekule.GraphAlgorithmUtils;
		var SEQ_KEY = U.SEQ_KEY;
		var RESD_DEGREE_KEY = U.RESD_DEGREE_KEY;
		var VISIT_EDGE_DEGREE_KEY = U.VISIT_EDGE_DEGREE_KEY;
		var TYPE_KEY = U.TYPE_KEY;
		var TYPE_CYCLE = U.TYPE_CYCLE;
		var TYPE_BRIDGE = U.TYPE_BRIDGE;

		// init
		var edges = graph.getEdges();
		for (var i = 0, l = edges.length; i < l; ++i)
		{
			edges[i].removeData(SEQ_KEY);
		}
		var vertexes = graph.getVertexes();
		for (var i = 0, l = vertexes.length; i < l; ++i)
		{
			vertexes[i].removeData(TYPE_KEY);
		}

		// create spanning tree
		var edgeIndex = 1;
		var vertexIndex = 1;
		var vertexSeqs = [];
		var edgeSeqs = [];
		var startingVertexSeqs = [];
		var traverseResult = graph.traverse(function(obj, isEdge)
			{
				if (isEdge)
				{
					obj.setData(SEQ_KEY, edgeIndex);
					edgeSeqs.push(obj);
					++edgeIndex;
				}
				else // vertex
				{
					obj.setData(SEQ_KEY, vertexIndex);
					++vertexIndex;
					vertexSeqs.push(obj);
				}
			}
		);

		// calc resident degree and edge degree of each vertex
		for (var i = 0, l = vertexSeqs.length; i < l; ++i)
		{
			var obj = vertexSeqs[i];
			var connEdges = obj.getEdges();
			obj.setData(RESD_DEGREE_KEY, connEdges.length);
			var visitedDegree = 0;
			for (var j = 0, k = connEdges.length; j < k; ++j)
			{
				var edge = connEdges[j];
				if (edge.getData(SEQ_KEY))  // already visited
					++visitedDegree;
			}
			obj.setData(VISIT_EDGE_DEGREE_KEY, visitedDegree);
			if (visitedDegree < connEdges.length)
			{
				startingVertexSeqs.push(obj);
				//console.log(obj.getData('object').getId(), visitedDegree, connEdges.length);
			}
		}

		// a function to get the first edge on vertex
		var getFirstVisitedEdge = function(vertex, ignoreStartingVertex)
		{
			if (ignoreStartingVertex && vertex.getData(SEQ_KEY) <= 1)  // first vertex, no first edge
				return null;
			var edges = vertex.getEdges();
			var firstEdge = null;
			var firstEdgeSeq = null;
			for (var i = 0, l = edges.length; i < l; ++i)
			{
				var seq = edges[i].getData(SEQ_KEY);
				if (seq)
				{
					if (!firstEdgeSeq)  // not set, this is the first one
					{
						firstEdge = edges[i];
						firstEdgeSeq = seq;
					}
					else if (seq < firstEdgeSeq)
					{
						firstEdge = edges[i];
						firstEdgeSeq = seq;
					}
				}
			}
			if (firstEdge)  // && firstEdgeSeq < vertex.getData(SEQ_KEY));
				return firstEdge;
			else
				return null;
		};
		// a function to get first edge unvisited
		var getUnvisitedEdge = function(vertex)
		{
			var edges = vertex.getEdges();
			for (var i = 0, l = edges.length; i < l; ++i)
			{
				if (!edges[i].getData(SEQ_KEY) && !edges[i].getData(TYPE_KEY))
					return edges[i];
			}
			return null;
		}
		// a function to mark all cycle path from a startingVertex that edgeDegree < resdDegree
		/** @ignore */
		var markCyclePath = function(startingVertex)
		{
			var cycleVertexes = [], cycleEdges = [];

			var visitedEdgeDegree = startingVertex.getData(VISIT_EDGE_DEGREE_KEY);
			var resdEdgeDegree = startingVertex.getData(RESD_DEGREE_KEY);
			var delta = resdEdgeDegree - visitedEdgeDegree;  // delta is the number of unfound chords
			if (delta > 0)  // startingVertex is in a cycle
			{
				startingVertex.setData(TYPE_KEY, TYPE_CYCLE);
				AU.pushUnique(cycleVertexes, startingVertex);

				for (var i = 0; i < delta; ++i)
				{
					startingVertex.setData(RESD_DEGREE_KEY, resdEdgeDegree + 1);

					var edge = getUnvisitedEdge(startingVertex);
					if (edge)  // mark unvisited edge as cycle one
					{
						edge.setData(TYPE_KEY, TYPE_CYCLE);
						AU.pushUnique(cycleEdges, edge);

						var nextVertex = startingVertex.getNeighborOnEdge(edge);
						nextVertex.setData(RESD_DEGREE_KEY, nextVertex.getData(RESD_DEGREE_KEY) + 1);
						nextVertex.setData(TYPE_KEY, TYPE_CYCLE);
						AU.pushUnique(cycleVertexes, nextVertex);

						do
						{
							//console.log('do loop on', nextVertex.getData('object').getId());
							var visitedEdgeDegree = nextVertex.getData(VISIT_EDGE_DEGREE_KEY);
							var resdEdgeDegree = nextVertex.getData(RESD_DEGREE_KEY);
							if (visitedEdgeDegree < resdEdgeDegree)   // nextVertex is in a cycle
							{
								var childResult = markCyclePath(nextVertex);
								AU.pushUnique(cycleVertexes, childResult.vertexes);
								AU.pushUnique(cycleEdges, childResult.edges);
							}
							var firstEdge = getFirstVisitedEdge(nextVertex, false);
							if (!firstEdge)
							{
								//console.log('no first edge', nextVertex.getData('object').getId());
								break;
							}
							//if (firstEdge)
							{
								firstEdge.setData(TYPE_KEY, TYPE_CYCLE);
								AU.pushUnique(cycleEdges, firstEdge);
								var v = nextVertex.getNeighborOnEdge(firstEdge);
								//console.log('new v', v.getData('object').getId(), v.getData(TYPE_KEY));
								if (!v.getData(TYPE_KEY))
								{
									v.setData(TYPE_KEY, TYPE_CYCLE);
									AU.pushUnique(cycleVertexes, v);
									nextVertex = v;
								}
								else
								{
									break;
								}
							}
						}
						while (true)
					}
				}
			}

			return {
				'vertexes': cycleVertexes,
				'edges': cycleEdges
			};
		};

		// check
		//var ringSetCount = 0;
		var currVertex = vertexSeqs.shift();
		//var currVertex = startingVertexSeqs.shift();
		while (currVertex)
		{
			//var nextLoopVertexSetted = false;
			if (currVertex.getData(TYPE_KEY))  // type already assigned, visited
			{
				// do nothing
			}
			else  // unvisited
			{
				var visitedEdgeDegree = currVertex.getData(VISIT_EDGE_DEGREE_KEY);
				var resdEdgeDegree = currVertex.getData(RESD_DEGREE_KEY);
				var delta = resdEdgeDegree - visitedEdgeDegree;  // delta is the number of unfound chords
				if (delta > 0)  // currVertex is in a cycle
				{
					var partResult = markCyclePath(currVertex);
					result.push(partResult);
					//++ringSetCount;
				}
				else  // is bridge vertex, mark vertex and first edge on it as bridge one
				{
					currVertex.setData(TYPE_KEY, TYPE_BRIDGE);
					//AU.pushUnique(result.vertexes, currVertex);
					var firstEdge = getFirstVisitedEdge(currVertex, true);
					if (firstEdge)
					{
						firstEdge.setData(TYPE_KEY, TYPE_BRIDGE);
						//AU.pushUnique(result.edges, firstEdge);
					}
				}
			}

			/*
			 // check if currVertex's edgeDegree still less than resdDegree, if so, means there is another
			 // cycle, repeat loop, else step to next vertex
			 var visitedEdgeDegree = currVertex.getData(VISIT_EDGE_DEGREE_KEY);
			 var resdEdgeDegree = currVertex.getData(RESD_DEGREE_KEY);
			 if (visitedEdgeDegree >= resdEdgeDegree)
			 */
			currVertex = vertexSeqs.shift();
		}

		// summary
		/*
		var vertexes = graph.getVertexes();
		var edges = graph.getEdges();
		for (var i = 0, l = vertexes.length; i < l; ++i)
		{
			if (vertexes[i].getData(TYPE_KEY) === TYPE_CYCLE)
			{
				result.vertexes.push(vertexes[i]);
				//console.log(vertexes[i].getData('object').getId());
			}
		}
		for (var i = 0, l = edges.length; i < l; ++i)
		{
			if (edges[i].getData(TYPE_KEY) === TYPE_CYCLE)
				result.edges.push(edges[i]);
		}
		*/

		//console.log('ringSet count', ringSetCount);

		return result;
	},

	/**
	 * Returns all vertexes and edges in end chain of a graph.
	 * @param {Kekule.Graph} graph
	 * @returns {Hash} A hash that contains the follow fields:
	 *   {
	 *     vertexes: Array of all found vertexes.
	 *     edges: Array of all found edges.
	 *   }
	 */
	findEndChains: function(graph)
	{
		var AU = Kekule.ArrayUtils;
		var CURR_CONNECTIVITY_FIELD = '__$currConnectivity__';
		var result = {
			vertexes: [],
			edges: []
		};
		var remainingVertexes = AU.clone(graph.getVertexes());
		var initEndVertexes = [];
		// init
		for (var i = 0, l = remainingVertexes.length; i < l; ++i)
		{
			var v = remainingVertexes[i];
			var degree = v.getEdgeCount();
			v.setData(CURR_CONNECTIVITY_FIELD, degree);
			if (degree <= 1)  // end vertex or alone vertex
				initEndVertexes.push(v);
		}
		// iterate
		if (initEndVertexes.length)
		{
			var currVertex = initEndVertexes.pop();
			AU.remove(remainingVertexes, currVertex);
			result.vertexes.push(currVertex);
			while (remainingVertexes.length)
			{
				var flag = false;

				var edges = AU.exclude(currVertex.getEdges(), result.edges);

				if (edges.length)
				{
					//AU.pushUnique(result.edges, edges);
					result.edges = result.edges.concat(edges);
					var nextVertex = currVertex.getNeighborOnEdge(edges[0]);
					var degree = nextVertex.getData(CURR_CONNECTIVITY_FIELD) - 1;
					nextVertex.setData(CURR_CONNECTIVITY_FIELD, degree);
					if (degree <= 1)
					{
						currVertex = nextVertex;
						AU.remove(remainingVertexes, currVertex);
						result.vertexes.push(currVertex);
						flag = true;
					}
				}

				if (!flag)
				{
					if (initEndVertexes.length)
					{
						var currVertex = initEndVertexes.pop();
						AU.remove(remainingVertexes, currVertex);
						result.vertexes.push(currVertex);
					}
					else
						break;
				}
			}
		}
		return result;
	},

	/**
	 * Removes all side end chains from graph.
	 * @param {Kekule.Graph} graph
	 * @returns {Hash}  A hash that contains the follow fields:
	 *   {
	 *     vertexes: Array of all removed vertexes.
	 *     edges: Array of all removed edges.
	 *   }
	 *   which stores vertexes and edges been removed.
	 */
	removeEndChains: function(graph)
	{
		var chainElems = Kekule.GraphAlgorithmUtils.findEndChains(graph);
		//console.log('before', graph.getVertexes().length, graph.getEdges().length);
		for (var i = 0, l = chainElems.vertexes.length; i < l; ++i)
		{
			graph.removeVertex(chainElems.vertexes[i]);
		}
		//console.log('after', graph.getVertexes().length, graph.getEdges().length, l);
		return chainElems;
	},

	/**
	 * Returns all vertexes and edges in bridge chain of a graph.
	 * Note: this function must be called after (@link Kekule.GraphAlgorithmUtils.removeEndChains}.
	 * @param {Kekule.Graph} graph
	 * @returns {Hash} A hash that contains the follow fields:
	 *   {
	 *     vertexes: Array of all found vertexes.
	 *     edges: Array of all found edges.
	 *   }
	 */
	findBridgeChains: function(graph)
	{
		var vs = graph.getVertexes();
		var es = graph.getEdges();
		var cycleParts = Kekule.GraphAlgorithmUtils.findCycleBlocks(graph);
		for (var i = 0, l = cycleParts.length; i < l; ++i)
		{
			vs = AU.exclude(vs, cycleParts[i].vertexes);
			es = AU.exclude(es, cycleParts[i].edges);
		}
		var result = {
			vertexes: vs,
			edges: es
		};

		return result;
	},

	/**
	 * Removes all vertexes and edges in bridge chain of a graph.
	 * Note: this function must be called after (@link Kekule.GraphAlgorithmUtils.removeEndChains}.
	 * @param {Kekule.Graph} graph
	 * @returns {Hash} A hash that contains the follow fields:
	 *   {
	 *     vertexes: Array of all removed vertexes.
	 *     edges: Array of all removed edges.
	 *   }
	 */
	removeBridgeChains: function(graph)
	{
		var bridgeElems = Kekule.GraphAlgorithmUtils.findBridgeChains(graph);
		//console.log('before', graph.getVertexes().length, graph.getEdges().length);
		for (var i = 0, l = bridgeElems.vertexes.length; i < l; ++i)
		{
			graph.removeVertex(chainElems.vertexes[i]);
		}
		//console.log('after', graph.getVertexes().length, graph.getEdges().length, l);
		return bridgeElems;
	},

	/**
	 * Returns all rings in a graph.
	 * @param {Variant} graphOrGraphPart A instance of Kekule.Graph
	 *   or a graph cycle part ({vertexes, edsges}) found by {@link Kekule.GraphAlgorithmUtils.findCycleBlocks}.
	 * @returns {Array} An array containing a series of hash with fields:
	 *   {
	 *     vertexes: Array of all found vertexes.
	 *     edges: Array of all found edges.
	 *   }
	 *   Each array item marks a ring.
	 */
	findAllRings: function(graphOrCycleBlock)
	{
		var U = Kekule.GraphAlgorithmUtils;
		var PATH_DETAIL_KEY = '__$path_detail__';
		var VERTEX_PART_DEGREE_KEY = '__$vertextPartDegree__';

		var result = [];

		var cycleParts;
		if (graphOrCycleBlock instanceof Kekule.Graph)
		{
			// find and separate cycle parts first
			cycleParts = U.findCycleBlocks(graphOrCycleBlock);
		}
		else
		  cycleParts = [graphOrCycleBlock];

		// function to check if a cycle part is a single ring
		/** @private */
		var isSingleRingPart = function(cycleBlock)
		{
			return cycleBlock.vertexes.length === cycleBlock.edges.length;
		};

		// check if a path vector connected with vertex
		/** @private */
		var isPathEndWithVertex = function(pathVector, vertex)
		{
			var vertexes = pathVector.vertexes;
			var l = vertexes.length;
			return l && ((vertexes[0] === vertex) || (vertexes[l - 1] === vertex));
		};

		// Check if merge of pv1 and pv2 lead to a fake path
		/** @private */
		var isFakePathMerging = function(pv1, pv2, commonVertex)
		{
			var v1 = AU.clone(pv1.vertexes);
			var v2 = AU.clone(pv2.vertexes);
			v1.shift();
			v1.pop();
			v2.shift();
			v2.pop();
			var commonVertexes = AU.intersect(v1, v2);
			return (commonVertexes.length >= 1);
		};

		// merge two path vectors into one
		// note, this function do not check whether pv1/2 end with commonVertex
		/** @private */
		var mergePathVectors = function(pv1, pv2, commonVertex)
		{
			var pvs1 = AU.clone(pv1.vertexes);
			var pvs2 = AU.clone(pv2.vertexes);
			var pes1 = AU.clone(pv1.edges);
			var pes2 = AU.clone(pv2.edges);
			if (pvs1[0] === commonVertex)
			{
				pvs1.reverse();
				pes1.reverse();
			}
			if (pvs2[pvs2.length - 1] === commonVertex)
			{
				pvs2.reverse();
				pes2.reverse();
			}
			pvs1.pop();
			var mergedVs = pvs1.concat(pvs2);
			var mergedEs = pes1.concat(pes2)
			return {
				'vertexCount': pv1.vertexCount + pv2.vertexCount - 1,
				'vertexes': mergedVs,
				'edges': mergedEs
			}
		};

		// function to handle a complex cycle part
		/** @private */
		var handleComplexCycleBlock = function(cycleBlock)
		{
			var result = [];
			var sv = AU.clone(cycleBlock.vertexes);
			var partEdges = cycleBlock.edges;
			// calc degrees of vertexes
			for (var i = 0, l = sv.length; i < l; ++i)
			{
				var v = sv[i];
				var es = AU.intersect(v.getEdges(), partEdges);
				v.setData(VERTEX_PART_DEGREE_KEY, es.length);
			}
			// sort by resd degree
			sv.sort(function(a, b)
				{
					//return (a.getData(U.RESD_DEGREE_KEY) - b.getData(U.RESD_DEGREE_KEY));
					/*
					var eas = AU.intersect(a.getEdges(), partEdges);
					var ebs = AU.intersect(b.getEdges(), partEdges);
					return eas.length - ebs.length;
					*/
					return (a.getData(VERTEX_PART_DEGREE_KEY) - b.getData(VERTEX_PART_DEGREE_KEY));
				}
			);

			// generate path vector set
			var sp = [];
			for (var i = 0, l = cycleBlock.edges.length; i < l; ++i)
			{
				var edge = cycleBlock.edges[i];
				var edgeVertexes = edge.getVertexes();
				sp.push({
					'vertexCount': edgeVertexes.length,
					'vertexes': [edgeVertexes[0], edgeVertexes[1]],
					'edges': [edge]
				});
			}

			while (sv.length)
			{
				var vx = sv.shift();
				var px = null;
				var pindex = -1;
				// find edges connected to vx and merge them
				for (var i = sp.length - 1; i >= 0; --i)
				{
					var p = sp[i];
					if (isPathEndWithVertex(p, vx))
					{
						px = p;
						//pindex = i;
						//break;

						for (var j = i - 1; j >= 0; --j)
						{
							var p = sp[j];
							if (isPathEndWithVertex(p, vx))
							{
								if (!isFakePathMerging(px, p, vx))  // not fake merge, do actual merging
								{
									var newp = mergePathVectors(px, p, vx);
									// check if newp is a ring
									var newpVs = newp.vertexes;
									if (newpVs[0] === newpVs[newpVs.length - 1])  // is ring
									{
										newpVs.pop();
										result.push(newp);
									}
									else
									{
										sp.push(newp);
									}
								}
							}
						}

						// delete px from sp
						sp.splice(i, 1);
					}
				}
			}

			return result;
		};

		for (var i = 0, l = cycleParts.length; i < l; ++i)
		{
			var part = cycleParts[i];
			if (isSingleRingPart(part))
			{
				//console.log('simple');
				result.push({
					'vertexes': AU.clone(part.vertexes),
					'edges': AU.clone(part.edges)
				});
			}
			else  // complex part, need further check
			{
				var ringVectors = handleComplexCycleBlock(part);
				for (var j = 0, k = ringVectors.length; j < k; ++j)
				{
					var ringVector = ringVectors[j];
					result.push({
						'vertexes': AU.clone(ringVector.vertexes),
						'edges': AU.clone(ringVector.edges)
					});
				}
			}
		}

		return result;
	},

	/**
	 * Returns Smallest set of smallest rings of graph or cycle part.
	 * @param {Variant} graphOrGraphPart A instance of Kekule.Graph
	 *   or a graph cycle part ({vertexes, edsges}) found by {@link Kekule.GraphAlgorithmUtils.findCycleBlocks}.
	 * @param {Array} allRings All rings of cycle block, input this param can reduce the calculation time.
	 *   Note: this param will only be used when the previous param is a graph part.
	 * @returns {Array} An array containing a series of hash with fields:
	 *   {
	 *     vertexes: Array of all found vertexes.
	 *     edges: Array of all found edges.
	 *   }
	 *   Each array item marks a SSSR ring.
	 */
	findSSSR: function(graphOrCycleBlock, allRings)
	{
		var U = Kekule.GraphAlgorithmUtils;
		var result = [];

		var cycleParts;
		if (graphOrCycleBlock instanceof Kekule.Graph)
		{
			// find and separate cycle parts first
			cycleParts = U.findCycleBlocks(graphOrCycleBlock);
			allRings = null;
		}
		else
			cycleParts = [graphOrCycleBlock];

		// Check if ring is liner related to ringSet
		/* @private */
		/*
		var isLinerRelated = function(ring, ringSet)
		{

		};
		*/

		// find SSSR on single cycle part
		/** @deprecated */
		var findSSSROfPart_wrong = 1 || function(cycle)
		{
			var result = [];
			var SSSRCount = cycleBlock.edges.length - cycleBlock.vertexes.length + 1;
			if (SSSRCount <= 0)
				return [];

			var rings = U.findAllRings(cycleBlock);

			// prepare and sort rings
			var ringGroupMap = new Kekule.MapEx(true);
			//var ringGroups = [];
			for (var i = 0, l = rings.length; i < l; ++i)
			{
				var ringSize = rings[i].edges.length;
				var group = ringGroupMap.get(ringSize);
				if (!group)
				{
					group = [];
					ringGroupMap.set(ringSize, group);
				}
				group.push(rings[i]);
				//rings[i]._ringGroup_ = group;  // save belonged group
			}
			var ringGroupKeys = ringGroupMap.getKeys();
			ringGroupKeys.sort(function(a, b) { return a - b; });

			/*
			rings.sort(function(a, b)
				{
					return a.vertexes.length - b.vertexes.length;
				}
			);
			*/

			var ring;
			var remainEdges = AU.clone(cycleBlock.edges);

			var getUncheckedEdgeCount = function(remainEdges, ring)
			{
				return AU.intersect(remainEdges, ring.edges).length;
			};
			var addRingToResult = function(ring)
			{
				result.push(ring);
				remainEdges = AU.exclude(remainEdges, ring.edges);
			};


			for (var j = 0, k = ringGroupKeys.length; j < k; ++j)
			{
				var key = ringGroupKeys[j];
				var g = ringGroupMap.get(key);


				{
					if (g.length <= 1)  // only one ring in group
					{
						if (result.length === 0)  // first ring, always add to set
						{
							ring = g.shift();
							addRingToResult(ring);
						}
						else  // non-first ring, need to check
						{
							ring = g.shift();
							if (!!getUncheckedEdgeCount(remainEdges, ring))
							{
								addRingToResult(ring);
							}
						}
					}
					else  // multiple rings in group
					{
						//console.log('multiple rings', g.length);
						while (g.length && (result.length < SSSRCount) && remainEdges.length)
						{
							if (result.length === 0)  // first ring, always add to set
							{
								ring = g.shift();
								addRingToResult(ring);
							}
							else  // non-first ring, need to check
							{
								// sort all ring in group to reduce edge in lowest speed
								for (var i = g.length - 1; i >= 0; --i)
								{
									ring = g[i];
									var uncheckedEdgeCount = getUncheckedEdgeCount(remainEdges, ring);
									if (uncheckedEdgeCount <= 0)  // no new edge in ring, remove it from group
										g.splice(i, 1);
									else
										ring.__uncheckedEdgeCount__ = uncheckedEdgeCount;
								}
								g.sort(function(a, b)
									{
										return a.__uncheckedEdgeCount__ - b.__uncheckedEdgeCount__;
									}
								)

								ring = g.shift();
								addRingToResult(ring);
							}
						}
					}
				}

				/*
				if (addedRing)
					remainEdges = AU.exclude(remainEdges, addedRing.edges);
				*/

				if ((result.length >= SSSRCount) || (remainEdges.length <= 0))
					break;
			}
			/*
			var ring = rings.shift();
			var checkedVertexes = AU.clone(ring.vertexes);
			var checkedEdges = AU.clone(ring.edges);
			result.push(ring);  // put the smallest ring into SSSR first

			console.log('SSSRCount', SSSRCount);
			while ((result.length < SSSRCount) && rings.length)
			{
				ring = rings.shift();
				var ringSize = ring.edges.length;

				// find all rings with same size


				// check if ring liner related to already checked ring set
				var vs = ring.vertexes;
				var es = ring.edges;
				var uncheckedVertexes = AU.exclude(vs, checkedVertexes);
				var uncheckedEdges = AU.exclude(es, checkedEdges)
				if (uncheckedVertexes.length || uncheckedEdges.length)  // not related, put to SSSR
				{
					result.push(ring);
					checkedVertexes = checkedVertexes.concat(uncheckedVertexes);
					checkedEdges = checkedEdges.concat(uncheckedEdges);
				}
			}
			*/

			return result;
		};

		// find SSSR on single cycle part
		/** @private */
		var findSSSROfPart = function(cycleBlock, allRings)
		{
			var result = [];
			var SSSRCount = cycleBlock.edges.length - cycleBlock.vertexes.length + 1;
			if (SSSRCount <= 0)
				return [];

			//console.log('SSSRCount', SSSRCount);

			//console.log('all rings set', allRings);

			var rings = allRings? AU.clone(allRings): U.findAllRings(cycleBlock);
			rings.sort(function(a, b)
				{
					return a.vertexes.length - b.vertexes.length;
				}
			);

			// find SSSR
			//var remainEdges = AU.clone(cycleBlock.edges);
			var addRingToResult = function(ring)
			{
				result.push(ring);
				//remainEdges = AU.exclude(remainEdges, ring.edges);
			};

			var ringVector;
			var foundVectors = [];
			var RU = Kekule.RingVectorUtils;

			RU.prepareConvertRingToVector(cycleBlock);

			// add first one to SSSR
			var ring = rings.shift();
			addRingToResult(ring);
			ringVector = RU.convertRingToVector(ring, cycleBlock);
			foundVectors.push(ringVector);

			// then check following ones
			while ((result.length < SSSRCount) && rings.length)
			{
				ring = rings.shift();
				ringVector = RU.convertRingToVector(ring, cycleBlock);
				if (!RU.isLinearDependant(ringVector, foundVectors))
				{
					foundVectors.push(ringVector);
					addRingToResult(ring);
				}
			}

			return result;
		};

		for (var i = 0, l = cycleParts.length; i < l; ++i)
		{
			var part = cycleParts[i];
			var rings = findSSSROfPart(part, allRings);

			result = result.concat(rings);
		}

		return result;
	},

	/**
	 * Returns ring system details of graph or cycle block.
	 * @param {Variant} graphOrGraphPart A instance of Kekule.Graph
	 *   or a graph cycle block ({vertexes, edsges}) found by {@link Kekule.GraphAlgorithmUtils.findCycleBlocks}.
	 * @returns {Array} An array, each items is a cycle block detail. Item containing a series of hash with fields:
	 *   {
	 *     vertexes: Array of all vertexes in cycle block.
	 *     edges: Array of all edges in cycle block.
	 *     sssrRings: Array, each item containing edges and vertexes in a SSSR member ring.
	 *   }
	 */
	analysisRings: function(graphOrCycleBlock)
	{
		var U = Kekule.GraphAlgorithmUtils;
		var result = [];

		var cycleParts;
		if (graphOrCycleBlock instanceof Kekule.Graph)
		{
			// find and separate cycle parts first
			cycleParts = U.findCycleBlocks(graphOrCycleBlock);
		}
		else
			cycleParts = [graphOrCycleBlock];

		for (var i = 0, l = cycleParts.length; i < l; ++i)
		{
			var part = cycleParts[i];
			//var tStart = Date.now();
			var allRings = U.findAllRings(part);
			//var tEnd = Date.now();
			//console.log('Find all rings in ', tEnd - tStart);
			//var tStart = Date.now();
			var sssrRings = U.findSSSR(part, allRings);
			//var tEnd = Date.now();
			//console.log('Find SSSR in ', tEnd - tStart);

			result.push({
				'vertexes': part.vertexes,
				'edges': part.edges,
				'allRings': allRings,
				'sssrRings': sssrRings
			});
		}

		return result;
	}
};


/**
 * Util class to do some calculation on ring vectors.
 * @class
 * @private
 */
Kekule.RingVectorUtils = {
	/** @private */
	MAX_INT_BITNUM: 23,
	/** @private */
	EDGE_INDEX_FIELD: '__$index__',
	/**
	 * Mark index of all edges in cycle part, prepare for converting ring to vector.
	 * @param {Object} cycleBlock
	 * @private
	 */
	prepareConvertRingToVector: function(cycleBlock)
	{
		var edges = cycleBlock.edges;
		for (var i = 0, l = edges.length; i < l; ++i)
		{
			edges[i][Kekule.RingVectorUtils.EDGE_INDEX_FIELD] = i;
		}
	},
	/**
	 * Convert a ring to ring vector. This function must be called after {@link Kekule.RingVectorUtils.prepareConvertRingToVector}.
	 * @param {Object} ring
	 * @param {Object} cycleBlock
	 * @returns {Variant} A bitwise vector or an array when cycleBlock contains more than XXX edges.
	 * @private
	 */
	convertRingToVector: function(ring, cycleBlock)
	{
		var result;
		var edgeCount = cycleBlock.edges.length;
		var ringEdges = ring.edges;
		if (edgeCount < Kekule.RingVectorUtils.MAX_INT_BITNUM)  // can use a bitwise integer to represent vector
		{
			result = 0;
			for (var i = 0, l = ringEdges.length; i < l; ++i)
			{
				var edge = ringEdges[i];
				var index = edge[Kekule.RingVectorUtils.EDGE_INDEX_FIELD];
				result += 1 << index;
			}
		}
		else  // must use array to represent
		{
			result = [];
			for (var i = 0, l = ringEdges.length; i < l; ++i)
			{
				var edge = ringEdges[i];
				var index = edge[Kekule.RingVectorUtils.EDGE_INDEX_FIELD];
				result[index] = true;
			}
		}
		return result;
	},
	/**
	 * Check if a vector are not null one (at least a position is 1).
	 * @param vector
	 */
	vectorNotNull: function(vector)
	{
		if (DataType.isSimpleValue(vector))  // v1/v2 are integers
		{
			return !!vector;
		}
		else  // are arrays
		{
			for (var i = 0; i < vector.length; ++i)
			{
				if (vector[i])
					return true;
			}
			return false;
		}
	},
	/** @private */
	getVectorLength: function(vector)
	{
		if (DataType.isSimpleValue(vector))  // v1/v2 are integers
		{
			return vector.toString(2).length;
		}
		else  // are arrays
		{
			return vector.length;
		}
	},
	/**
	 * And operation on two ring vectors.
	 * @param {Variant} v1
	 * @param {Variant} v2
	 * @returns {Variant}
	 * @private
	 */
	ringVectorAnd: function(v1, v2)
	{
		if (DataType.isSimpleValue(v1))  // v1/v2 are integers
		{
			return v1 & v2;
		}
		else  // are arrays
		{
			var result = [];
			var l = Math.min(v1.length, v2.length);
			for (var i = 0; i < l; ++i)
			{
				result[i] = v1[i] && v2[i];
			}
			return result;
		}
	},
	/**
	 * And operation on all ring vectors.
	 * @param {Array} vectors
	 * @returns {Variant}
	 * @private
	 */
	ringVectorAndAll: function(vectors)
	{
		if (vectors.length < 2)
			return vectors[0];
		var RU = Kekule.RingVectorUtils;
		var result = RU.ringVectorAnd(vectors[0], vectors[1]);
		for (var i = 2, l = vectors.length; i < l; ++i)
		{
			result = RU.ringVectorAnd(result, vectors[i]);
		}
		return result;
	},
	/**
	 * Or operation on two ring vectors.
	 * @param {Variant} v1
	 * @param {Variant} v2
	 * @returns {Variant}
	 * @private
	 */
	ringVectorOr: function(v1, v2)
	{
		if (DataType.isSimpleValue(v1))  // v1/v2 are integers
		{
			return v1 | v2;
		}
		else  // are arrays
		{
			var result = [];
			var l = Math.max(v1.length, v2.length);
			for (var i = 0; i < l; ++i)
			{
				result[i] = v1[i] || v2[i];
			}
			return result;
		}
	},
	/**
	 * Or operation on all ring vectors.
	 * @param {Array} vectors
	 * @returns {Variant}
	 * @private
	 */
	ringVectorOrAll: function(vectors)
	{
		if (vectors.length < 2)
			return vectors[0];
		var RU = Kekule.RingVectorUtils;
		var result = RU.ringVectorOr(vectors[0], vectors[1]);
		for (var i = 2, l = vectors.length; i < l; ++i)
		{
			result = RU.ringVectorOr(result, vectors[i]);
		}
		return result;
	},
	/**
	 * Xor operation on two ring vectors.
	 * @param {Variant} v1
	 * @param {Variant} v2
	 * @returns {Variant}
	 * @private
	 */
	ringVectorXor: function(v1, v2)
	{
		if (DataType.isSimpleValue(v1))  // v1/v2 are integers
		{
			return v1 ^ v2;
		}
		else  // are arrays
		{
			var result = [];
			var l = Math.max(v1.length, v2.length);
			for (var i = 0; i < l; ++i)
			{
				result[i] = !!(v1[i] ^ v2[i]);
			}
			return result;
		}
	},
	/**
	 * Xor operation on all ring vectors.
	 * @param {Array} vectors
	 * @returns {Variant}
	 * @private
	 */
	ringVectorXorAll: function(vectors)
	{
		if (vectors.length < 2)
			return vectors[0];
		var RU = Kekule.RingVectorUtils;
		var result = RU.ringVectorXor(vectors[0], vectors[1]);
		for (var i = 2, l = vectors.length; i < l; ++i)
		{
			result = RU.ringVectorXor(result, vectors[i]);
		}
		return result;
	},
	/**
	 * Not operation on vector.
	 * @param {Variant} vector
	 * @returns {Variant}
	 * @private
	 */
	ringVectorNot: function(vector)
	{
		if (DataType.isSimpleValue(vector))  // v1/v2 are integers
		{
			return ~vector;
		}
		else  // are arrays
		{
			var result = [];
			for (var i = 0, l = vector.length; i < l; ++i)
			{
				result[i] = !vector[i];
			}
			return result;
		}
	},

	/**
	 * Check if vector is linear dependant on baseVectors.
	 * @param ring
	 * @param vector
	 * @param baseVectors
	 * @returns {Bool}
	 * @private
	 * @deprecated
	 */
	isLinearDependant: function(vector, baseVectors)
	{
		var RU = Kekule.RingVectorUtils;
		var allEdgeVector = RU.ringVectorOrAll(baseVectors);
		var newEdges = RU.ringVectorAnd(vector, RU.ringVectorNot(allEdgeVector));
		if (RU.vectorNotNull(newEdges))
			return false;
		else
		{
			var baseVectorCount = baseVectors.length;
			// combine base vectors to try to generate the new vector
			/*
			var indexes = [];
			for (var i = 0; i < baseVectorCount; ++i)
			{
				indexes[i] = 0;
			}
			*/

			/** @private */
			/*
			var incVectorIndexesOnPos = function(indexes, baseVectorCount, pos)
			{
				if (indexes[pos] < baseVectorCount - 1)
				{
					++indexes[pos];
					return true;
				}
				else
				{
					if (pos >= baseVectorCount - 1)  // overflow
						return false;
					indexes[pos] = 0;
					return incVectorIndexesOnPos(indexes, baseVectorCount, pos + 1);
				}
			}
			*/
			/** @private */
			/*
			var incVectorIndexes = function(indexes, baseVectorCount)
			{
				return incVectorIndexesOnPos(indexes, baseVectorCount, 0);
			}
			*/
			/** @private */
			var initVectorIndexes = function(indexCount)
			{
				var result = [];
				for (var i = 0; i < indexCount; ++i)
				{
					result[i] = indexCount - i - 1;
				}
				return result;
			};
			var incVectorIndexValueOnPos = function(indexes, pos, maxVectorCount)
			{
				var oldValue = indexes[pos];
				var value = ++oldValue;
				if (value >= maxVectorCount - pos)
				{
					if (pos >= indexes.length - 1)
						return false;
					else
						return incVectorIndexValueOnPos(indexes, pos + 1, maxVectorCount);
				}
				else
				{
					indexes[pos] = value;
					var nv = value;
					// increase following pos also
					for (var i = pos - 1; i >= 0; --i)
					{
						++nv;
						indexes[i] = nv;
					}
					return true;
				}
			};
			/** @private */
			var nextVectorIndexes = function(indexes, maxVectorCount)
			{
				return incVectorIndexValueOnPos(indexes, 0, maxVectorCount);
			};

			var count = 0;
			var result = false;

			for (var vCount = 2; vCount <= baseVectorCount; ++vCount)  // vCount: number of combined base vectors
			{
				var vectorIndexes = initVectorIndexes(vCount);
				while (true)
				{
					++count;
					var selVectors = [];
					for (var i = 0, l = vectorIndexes.length; i < l; ++i)
					{
						selVectors.push(baseVectors[vectorIndexes[i]]);
					}
					var combineVector = RU.ringVectorXorAll(selVectors);
					if (!RU.vectorNotNull(RU.ringVectorXor(combineVector, vector)))  // found
					{
						result = true;
						break;
					}
					if (!nextVectorIndexes(vectorIndexes, baseVectorCount))  // search all, but still not found
					{
						result = false;
						break;
					}
				}
				if (result)
					break;
			}

			/*
			while (true)
			{
				++count;
				var selVectors = [];
				for (var i = 0, l = indexes.length; i < l; ++i)
				{
					AU.pushUnique(selVectors, baseVectors[indexes[i]]);
				}
				var combineVector = RU.ringVectorXorAll(selVectors);
				if (!RU.vectorNotNull(RU.ringVectorXor(combineVector, vector)))  // found
				{
					result = true;
					break;
				}
				if (!incVectorIndexes(indexes, baseVectorCount))  // search all, but still not found
				{
					result = false;
					break;
				}
			}
			*/
			//console.log('tried ', count, result);
			return result;
		}
	},

	/**
	 * Check if vector is linear dependant on baseVectors.
	 * @param ring
	 * @param vector
	 * @param baseVectors
	 * @returns {Bool}
	 * @private
	 * @deprecated
	 */
	isLinearDependant_wrong: null && function(vector, baseVectors)
	{
		var RU = Kekule.RingVectorUtils;
		var allEdgeVector = RU.ringVectorOrAll(baseVectors);
		var newEdges = RU.ringVectorAnd(vector, RU.ringVectorNot(allEdgeVector));
		if (RU.vectorNotNull(newEdges))
			return false;
		else
		{

			// get all base vectors that share one or more edge of vector
			var vectorEdgeCount = RU.getVectorLength(vector);
			var baseVectorCount = baseVectors.length;
			//var overlapRingMap = new Kekule.MapEx(true);
			var overlapedVectorGroups = [];
			try
			{
				var isIntVector = DataType.isSimpleValue(vector);

				if (isIntVector)
				{
					for (var i = 0; i < vectorEdgeCount; ++i)
					{
						var testVector = 1 << i;
						if (testVector & vector)
						{
							var group = [];
							overlapedVectorGroups.push(group);
							for (var j = 0; j < baseVectorCount; ++j)
							{
								if (baseVectors[j] & testVector)
									group.push(baseVectors[j])
							}
						}
					}
				}
				else
				{
					for (var i = 0; i < vectorEdgeCount; ++i)
					{
						if (vector[i])
						{
							var group = [];
							overlapedVectorGroups.push(group);
							for (var j = 0; j < baseVectorCount; ++j)
							{
								if (baseVectors[j][i])
									group.push(baseVectors[j])
							}
						}
					}
				}

				// combine those overlapped base vectors to try to generate vector
				var groupCounts = [];
				var indexes = [];
				for (var i = 0, l = overlapedVectorGroups.length; i < l; ++i)
				{
					groupCounts[i] = overlapedVectorGroups[i].length;
					indexes[i] = 0;
				}

				/** @private */
				var incVectorIndexesOnPos = function(indexes, groupCounts, pos)
				{
					if (indexes[pos] < groupCounts[pos] - 1)
					{
						++indexes[pos];
						return true;
					}
					else
					{
						if (pos >= groupCounts.length - 1)  // overflow
							return false;
						indexes[pos] = 0;
						return incVectorIndexesOnPos(indexes, groupCounts, pos + 1);
					}
				}
				/** @private */
				var incVectorIndexes = function(indexes, groupCounts)
				{
					return incVectorIndexesOnPos(indexes, groupCounts, 0);
				}

				var count = 0;
				var result;
				while (true)
				{
					++count;
					var selVectors = [];
					for (var i = 0, l = indexes.length; i < l; ++i)
					{
						AU.pushUnique(selVectors, overlapedVectorGroups[i][indexes[i]]);
					}
					if ((overlapedVectorGroups.length === 4)/* && (selVectors.length === 5)*/)
					{
						console.log('new vector edge count', overlapedVectorGroups.length, 'selVector count', selVectors.length);
						console.log(selVectors);
					}
					var combineVector = RU.ringVectorXorAll(selVectors);
					if (!RU.vectorNotNull(RU.ringVectorXor(combineVector, vector)))  // found
					{
						result = true;
						break;
					}
					if (!incVectorIndexes(indexes, groupCounts))  // search all, but still not found
					{
						result = false;
						break;
					}
				}
				console.log('tried ', count, result);
				return result;
			}
			finally
			{
				//overlapRingMap.finalize();
			}
		}
	}
};

})();