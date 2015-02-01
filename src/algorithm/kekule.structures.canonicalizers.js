/**
 * @fileoverview
 * Canonicalizers for chemical structures, especially for ctab based ones.
 * @author Partridge Jiang
 */


/*
 * requires /core/kekule.common.js
 * requires /core/kekule.utils.js
 * requires /data/kekule.structures.js
 * requires /core/kekule.chemUtils.js
 * requires /algorithm/kekule.graph.js
 */

(function()
{

var K = Kekule;
var AU = Kekule.ArrayUtils;
var BT = Kekule.BondType;

/**
 * A comparer to decide which chem structure object is "bigger" or "superior" than another one.
 * In the comparer, each structure object is turned to a int value with the fixed format.
 *
 * For node, the value will be 0xTTNNAAABBBLLCCHH  (16 digitals)
 *   [Atom]:
 *   TT: 00-FF, object major type, always be 10 to a node.
 *   NN: object class, 11: Atom, 12: Pseudoatom, 13: VariableAtom, 10: unspecified atom (atom not the in the previous three types), 00: other node.
 *   AAA: atom major property. Atomic number for usual atom, FFE for pseudoatom, FFF for variable atom, 000 for other types of node.
 *   BBB: atom mass number, if mass number is not specified, 000 will be used. For other node, this value is always 000.
 *   LL: Linked conector count.
 *   CC: charge. 40 for a neutral node, 41 for +1, 42 for +2, 3F for -1, 3E for -2 and so on.
 *   HH: Hydrogen count.
 *   [Fragment]:
 *   TT: 00-FF, object major type, always be 10 to a node.
 *   NN: object class, 31: subgroup, 35: molecule, 30: other fragment.
 *   AAA: atom count in fragment. 000 for unknown.
 *   BBB: bond count in fragment, 000 for unknown.
 *   LL: Linked conector count.
 *   CC: charge. 40 for a neutral node, 41 for +1, 42 for +2, 3F for -1, 3E for -2 and so on.
 *   HH: Hydrogen count, usually 00.
 * For connector the value will be 0xTTCBNNAA  (8 digitals)
 *   TT: 00-FF, object major type, always be 00 to a connector.
 *   C: connector type. 1 for bond and 0 for other types of connector.
 *   B: bond type. 1: covalent, 2: ionic, 3: coordinate, 4: metallic, 9: hydrogen, 0: other
 *   NN: bond electron count. 02: single, 04: double, 06: triple, 03: aromatic, 00: other
 *   AA: connected object count.
 */
Kekule.UnivChemStructObjComparer = {
	/** @private */
	NODE_CLASS_MAP: (new K.MapEx()).set(K.Atom, 0x11).set(K.Pseudoatom, 0x12).set(K.VariableAtom, 0x13).set(K.AbstractAtom, 0x10).set(K.ChemStructureNode, 0),
	/** @private */
	CHARGE_BASE: 0x40,
	/** @private */
	BOND_TYPE_MAP: (new K.MapEx(true)).set(BT.COVALENT, 1).set(BT.IONIC, 2).set(BT.COORDINATE, 3).set(BT.METALLIC, 4).set(BT.HYDROGEN, 9),
	/** @private */
	_P36: Math.pow(2, 36),
	_P48: Math.pow(2, 48),
	_P24: Math.pow(2, 24),
	/**
	 * Get a digital value for comparing object.
	 * @param {Kekule.ChemStructureObject} chemObj
	 * @param {options} Value getter options. Can including fields:
	 *   {
	 *     (for node)
	 *     compareLinkedConnectorCount: Bool,
	 *     compareCharge: Bool,
	 *     compareHydrogenCount: Bool,
	 *     (for connector)
	 *     compareConnectedObjCount: Bool,
	 *     compareBondType: Bool,
	 *     compareBondOrder: Bool
	 *   }
	 *   All fields' default value are true.
	 * @returns {Int}
	 */
	getCompareValue: function(chemObj, options)
	{
		var ops = Object.extend({
			compareLinkedConnectorCount: true,
			compareCharge: true,
			compareHydrogenCount: true,
			compareConnectedObjCount: true,
			compareBondType: true,
			compareBondOrder: true
		}, options);
		if (!chemObj)
			return 0;
		else if (chemObj instanceof K.ChemStructureNode)
			return K.UnivChemStructObjComparer.getNodeCompareValue(chemObj, ops);
		else if (chemObj instanceof K.ChemStructureConnector)
			return K.UnivChemStructObjComparer.getConnectorCompareValue(chemObj, ops);
		else
			return 0;
	},
	/**
	 * Compare the priority of two objects. Result = 0 if objects are the same, < 0 if obj1 < obj2 and > 0 if obj1 > obj2.
	 * Note: the comparation of structure fragments should be taken out after canonicalizing them.
	 * @param {Kekule.ChemStructureObject} obj1
	 * @param {Kekule.ChemStructureObject} obj2
	 * @param {Hash} compareOptions  Can including fields:
	 *   {
	 *     (for node)
	 *     compareLinkedConnectorCount: Bool,
	 *     compareCharge: Bool,
	 *     compareHydrogenCount: Bool,
	 *     (for connector)
	 *     compareConnectedObjCount: Bool,
	 *     compareBondType: Bool,
	 *     compareBondOrder: Bool
	 *   }
	 *   All fields' default value are true.
	 * @returns {Int}
	 */
	compare: function(obj1, obj2, compareOptions)
	{
		var U = K.UnivChemStructObjComparer;
		var v1 = U.getCompareValue(obj1, compareOptions);
		var v2 = U.getCompareValue(obj2, compareOptions);
		var result =  v1 - v2;
		if ((result === 0) && (obj1.getNodes && obj2.getNodes))  // structure fragment, if with same node and connector count, compare nodes and connectors
		{
			var nodes1 = obj1.getNodes();
			var nodes2 = obj2.getNodes();
			for (var i = 0, l = nodes1.length; i < l; ++i)
			{
				var result = U.compare(nodes1[i], nodes2[i]);
				if (result !== 0)
					break;
			}
		}
		if ((result === 0) && (obj1.getConnectors && obj2.getConnectors))
		{
			var connectors1 = obj1.getConnectors();
			var connectors2 = obj2.getConnectors();
			for (var i = 0, l = connectors1.length; i < l; ++i)
			{
				var result = U.compare(connectors1[i], connectors2[i]);
				if (result !== 0)
					break;
			}
		}
		return result;
	},
	/**
	 * Get the object with max priority.
	 * @param {Variant} obj You can pass multiple {@link Kekule.ChemStructureObject} in the param, or pass an array of object.
	 * @returns {Kekule.ChemStructureObject}
	 */
	max: function()
	{
		var max = -1;
		var objs = arguments;
		if ((objs.length === 1) && (DataType.isArrayValue(objs)))
			objs = objs[0];
		var result = null;
		for (var i = 0, l = objs.length; i < l; ++i)
		{
			var obj = objs[i];
			var v = Kekule.UnivChemStructObjComparer.getCompareValue(obj);
			if (v > max)
				result = obj;
		}
		return result;
	},
	/**
	 * Sort an array of chem objects.
	 * @param {Array} objs
	 * @param {Bool} ascendOrder
	 * @returns {Array}
	 */
	sort: function(objs, ascendOrder)
	{
		objs.sort(
			function(obj1, obj2)
			{
				var r = Kekule.UnivChemStructObjComparer.compare(obj1, obj2);
				if (ascendOrder)
					r = -r;
				return r;
			}
		);
		return objs;
	},
	/** @private */
	getNodeCompareValue: function(node, options)
	{
		var U = K.UnivChemStructObjComparer;
		var result = 0x1000000000000000;  // node always start with 10
		// object class
		var nodeClass = node.getClass();
		var vclass = K.UnivChemStructObjComparer.NODE_CLASS_MAP.get(nodeClass);
		var detailValue = 0;
		if (K.ObjUtils.isUnset(vclass))
		{
			if (node instanceof K.AbstractAtom)
			{
				vclass = (node instanceof K.Atom)? 0x11:
					(node instanceof K.Pseudoatom)? 0x12:
						(node instanceof K.VariableAtom)? 0x13: 0x10;
				//detailValue = K.UnivChemStructObjComparer.getAtomDetailCompareValue(node);
			}
			if (node instanceof K.StructureFragment)
			{
				//vclass = 0x30;
				vclass = (node instanceof K.SubGroup)? 0x31:
					(node instanceof K.Molecule)? 0x35: 0x30;
				//detailValue = K.UnivChemStructObjComparer.getAtomDetailCompareValue(node);
			}
			else
			{
				vclass = 0;
				//detailValue = K.UnivChemStructObjComparer.getAtomDetailCompareValue(node);
			}
		}
		detailValue = K.UnivChemStructObjComparer.getAtomDetailCompareValue(node);
		result += vclass * U._P48; //(vclass << (12 * 4));
		result += detailValue;

		// Linked conector count
		if (options.compareLinkedConnectorCount)
		{
			var vlinkedConnector = node.getLinkedConnectorCount();
			result += (vlinkedConnector << (4 * 4));
		}

		// charge
		if (options.compareCharge)
		{
			var vcharge = Math.round(node.getCharge() || 0) + K.UnivChemStructObjComparer.CHARGE_BASE; // there may be partial charge, so a round function is used here
			result += (vcharge << (2 * 4));
		}
		// hydrogen count
		if (options.compareHydrogenCount)
		{
			var vhydrogen = node.getHydrogenCount? node.getHydrogenCount() || 0: 0;
			result += vhydrogen;
		}

		return result;
	},
	/** @private */
	getAtomDetailCompareValue: function(atom)
	{
		var U = K.UnivChemStructObjComparer;
		var result = 0;
		// atom major property and atom mass number
		var vmajorProp, vmass = 0;
		var nodeClass = atom.getClass();
		if (nodeClass === K.Atom)
		{
			vmajorProp = atom.getAtomicNumber() || 0;
			vmass = atom.getMassNumber() || 0;
		}
		else if (nodeClass === K.Pseudoatom)
			vmajorProp = 0xFFE;
		else if (nodeClass === K.VariableAtom)
			vmajorProp = 0xFFF;
		else
			vmajorProp = 0;
		result += vmajorProp * U._P36 + vmass * U._P24; //(vmajorProp << (9 * 4)) | (vmass << (6 * 4));

		return result;
	},
	/** @private */
	getFragmentDetailCompareValue: function(fragment)
	{
		var result = 0;
		result += (fragment.getNodeCount() || 0) * U._P36 + (fragment.getConnectorCount() || 0) * U._P24;

		return result;
	},

	/** @private */
	getConnectorCompareValue: function(connector, options)
	{
		var U = K.UnivChemStructObjComparer;
		var result = 0;  // as result alway start with 00, the actual digital is 8, so bit operations can be used
		var isBond = connector instanceof Kekule.Bond;
		// connector type
		result |= isBond? (1 << (5 * 4)): 0;
		// bond type
		if (options.compareBondType)
		{
			var vBondType;
			if (isBond)
			{
				vBondType = U.BOND_TYPE_MAP.get(connector.getBondType());
				if (K.ObjUtils.isUnset(vBondType))
					vBondType = 0;
			}
			else
				vBondType = 0;
			result |= (vBondType << (4 * 4));
		}
		// bond electron count
		if (options.compareBondOrder)
		{
			var electronCount = isBond? Math.round(connector.getElectronCount()): 0;
			result |= electronCount << (4 * 2);
		}
		// connected object count
		if (options.compareConnectedObjCount)
		{
			result |= (connector.getConnectedObjCount() || 0);
		}
		return result;
	}
};

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
	 * @param {Class} executorClass
	 * @param {Bool} asDefault Whether this executor should be the default one to canonicalize molecule.
	 */
	registerExecutor: function(id, executorClass, asDefault)
	{
		this._executorClasses[id] = executorClass;
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
			var eClass = this._executorClasses[id];
			if (eClass)
			{
				result = new eClass();
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
		var executor = this.getExecutor(executorId || this._defExecutorId);
		if (!executor)
		{
			Kekule.error(Kekule.ErrorMsg.REGISTERED_CANONICALIZATION_EXECUTOR_NOT_FOUND);
		}
		else
		{
			var ctab = structFragmentOrCtab.getCtab? structFragmentOrCtab.getCtab(): structFragmentOrCtab;
			return executor.execute(ctab);
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
ClassEx.extend(Kekule.ChemObject, {
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
ClassEx.extend(Kekule.StructureConnectionTable, {
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
ClassEx.extend(Kekule.StructureFragment, {
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

/**
 * Base class for do a concrete molecule canonicalization job.
 * @class
 */
Kekule.CanonicalizationExecutor = Class.create(
/** @lends Kekule.CanonicalizationExecutor# */
{
	/** @private */
	CLASS_NAME: 'Kekule.CanonicalizationExecutor',
	/**
	 * Execute canonicalization process on connection table.
	 * @params {Kekule.StructureConnectionTable} ctab
	 * @returns {Kekule.StructureConnectionTable}
	 */
	execute: function(ctab)
	{
		var newCtab = this.doExecute(ctab);
		// handle connected objects of each connector
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
	}
});

/**
 * Ctab based canonicalization method based on Morgan's algorithm.
 * Note: if the ctab has bond-bond connection, Morgan's algorithm may not work properly.
 * @class
 * @augments Kekule.CanonicalizationExecutor
 */
Kekule.MorganCanonicalizationExecutor = Class.create(Kekule.CanonicalizationExecutor,
/** @lends Kekule.MorganCanonicalizationExecutor# */
{
	/** @private */
	CLASS_NAME: 'Kekule.MorganCanonicalizationExecutor',

	/** @ignore */
	doExecute: function(ctab)
	{
		// turn ctab into pure graph first (with sub structure degrouped)
		var graph = Kekule.GraphAdaptUtils.ctabToGraph(ctab, null, {'expandSubStructures': true});
		//console.log('graph size', graph.getVertexes().length);
		// calc EC values of graph
		var ecMapping = this._calcGraphFinalECs(graph);
		// then sort graph vertexes
		var sortedResult = this._sortVertexesAndEdges(graph, ecMapping);
		// reindex ctab nodes according to sorted vertexes
		this._sortNodesAndConnectors(ctab, sortedResult.sortedVertexes, sortedResult.sortedEdges);
		return ctab;
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
	 * @returns {Kekule.MapEx}
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
				node.setRenderOption('customLabel', '' + value);
			}
			*/
		}
		finally
		{
			currECMapping.finalize();
		}

		// finally get actual ec values
		//var actualEcMapping = oldEcMapping;
		return oldECMapping;
	},

	/**
	 * Sort vertex in graph by EC values and property of chem node.
	 * @param graph
	 * @param ecMapping
	 * @returns {Hash} Sorted vertex and edges.
	 * @private
	 */
	_sortVertexesAndEdges: function(graph, ecMapping)
	{
		var vertexes = graph.getVertexes();
		var edges = graph.getEdges();

		if (!vertexes.length)  // empty molecule, no need to sort
			return {
				'sortedVertexes': vertexes,
				'sortedEdges': edges
			};

		var vertexSeq = AU.clone(vertexes);
		vertexSeq.sort(function(v1, v2)
			{
				var ec1 = ecMapping.get(v1);
				var ec2 = ecMapping.get(v2);
				var result = (ec1 - ec2);  // large ec value first
				if (result === 0) // compare by property of chem node
				{
					var node1 = v1.getData('object');
					var node2 = v2.getData('object');
					result = Kekule.UnivChemStructObjComparer.compare(node1, node2);
				}
				return result;
			}
		);
		//var remainingVertexes = graph.clone(vertexSeq);
		var vertexIndexMap = new Kekule.MapEx();
		var sortFunc = function(v1, v2)
			{
				return vertexSeq.indexOf(v1) - vertexSeq.indexOf(v2);
			};
		try
		{
			var remainingVertexes = AU.clone(vertexSeq);
			var sortedVertexes = [];
			var currVertex = vertexSeq[vertexSeq.length - 1];

			sortedVertexes.push(currVertex);
			vertexIndexMap.set(currVertex, 0);
			remainingVertexes.splice(vertexSeq.length - 1, 1);

			for (var i = 0; i < sortedVertexes.length; ++i)
			{
				var currVertex = sortedVertexes[i];
				if (i !== 0)
				{
					var vIndex = remainingVertexes.indexOf(currVertex);
					if (vIndex >= 0)
					{
						sortedVertexes.push(currVertex);
						vertexIndexMap.set(currVertex, sortedVertexes.length - 1);
						remainingVertexes.splice(vIndex, 1);
					}
				}
				var neighbors = currVertex.getNeighbors();
				neighbors = AU.intersect(neighbors, remainingVertexes);
				if (neighbors.length)
				{
					neighbors.sort(sortFunc);
					for (var j = neighbors.length - 1; j >= 0; --j)
					{
						var neighbor = neighbors[j];
						vIndex = remainingVertexes.indexOf(neighbor);
						if (vIndex >= 0)
						{
							sortedVertexes.push(neighbor);
							vertexIndexMap.set(neighbors[j], sortedVertexes.length - 1);
							remainingVertexes.splice(vIndex, 1);
							/*
							var edge = currVertex.getEdgeTo(neighbor);
							sortedEdges.push(edge);
							*/
						}
					}
				}
			}

			/*
			vertexes.sort(function(v1, v2)
				{
					//return (vertexIndexMap.get(v1) - vertexIndexMap.get(v2));
					return sortedVertexes.indexOf(v1) - sortedVertexes.indexOf(v2);
				}
			);
			*/

			// handle edges
			var sortedEdges = AU.clone(edges);
			{
				var compareVertexIndex = function(v1, v2)
				{
					return (vertexIndexMap.get(v1) - vertexIndexMap.get(v2))
				}
				if (sortedEdges.length > 1)
				{
					for (var i = 0, l = sortedEdges.length; i < l; ++i)
					{
						var edge = sortedEdges[i];
						edge.getVertexes().sort(compareVertexIndex);
					}
					sortedEdges.sort(function(edge1, edge2)
						{
							var vs1 = edge1.getVertexes();
							var vs2 = edge2.getVertexes();
							var result = 0;
							for (var i = 0; i < 2; ++i)
							{
								result = compareVertexIndex(vs1[i], vs2[i]);
								if (result !== 0)
									return result;
							}
							return result;
						});
				}
			}
		}
		finally
		{
			vertexIndexMap.finalize();
		}
		//return vertexes;
		//console.log(sortedEdges.length, sortedVertexes.length);
		//return sortedVertexes;
		return {
			'sortedVertexes': sortedVertexes,
			'sortedEdges': sortedEdges
		}
	},
	/*
	 * Sort graph edge by already sorted vertexes.
	 * @param graph
	 * @param sortedVertexes
	 * @returns {Array} sorted edge array.
	 * @private
	 */
	/*
	_sortEdges: function(graph, sortedVertexes)
	{
		var edges = graph.getEdges();
		edges.sort(function(e1, e2) {
			var vertexes1 = e1.getVertexes();
			var vertexes2 = e2.getVertexes();
			var result = vertexes1.length - vertexes2.length;
			if (result === 0)
			{
				var compareVertex = function(v1, v2)
				{
					return sortedVertexes.indexOf(v1) - sortedVertexes.indexOf(v2);
				}
				vertexes1.sort(compareVertex);
				vertexes2.sort(compareVertex);
				for (var i = 0, l = vertexes1.length; i < l; ++i)
				{
					var v1 = vertexes1[i];
					var v2 = vertexes2[i];
					// ....
				}
			}
		});
	}
	*/

	/** @private */
	_sortNodesAndConnectors: function(ctab, sortedVertexes, sortedEdges)
	{
		var nodeSeq = [];
		for (var i = 0, l = sortedVertexes.length; i < l; ++i)
		{
			nodeSeq.push(sortedVertexes[i].getData('object'));
		}
		var connectorSeq = [];
		for (var i = 0, l = sortedEdges.length; i < l; ++i)
		{
			connectorSeq.push(sortedEdges[i].getData('object'));
		}
		// reindex node by nodeSeq
		var labelMap = new Kekule.MapEx();
		try
		{
			this._calcChildNodeLabels(ctab, labelMap, nodeSeq);
			this._reindexCtabNodesAndConnectors(ctab, labelMap, nodeSeq, connectorSeq);
		}
		finally
		{
			labelMap.finalize();
		}
	},

	/**
	 * Returns min index of child nodes in ctab.
	 * @private
	 */
	_calcChildNodeLabels: function(ctab, labelMap, sortedNodeSeq)
	{
		var minIndex = null;
		var directChildNodes = ctab.getNodes();
		for (var i = 0, l = directChildNodes.length; i < l; ++i)
		{
			var node = directChildNodes[i];
			var index = sortedNodeSeq.indexOf(node) + 1;  // avoid 0
			if (index < 1)  // not in seq, a sub-group node?
			{
				//console.log('not in seq');
				if (node.hasCtab && node.hasCtab())
				{
					//console.log('recalc child ctab');
					index = -this._calcChildNodeLabels(node.getCtab(), labelMap, sortedNodeSeq); // mark sub group < 0
				}
				else
				{
					// should not has this situation
				}
			}
			labelMap.set(node, index);
			if (index >= 0)
			{
				if ((minIndex === null) || (minIndex > index))
					minIndex = index;
			}
		}
		return minIndex;
	},

	/** @private */
	_reindexCtabNodesAndConnectors: function(ctab, nodeLabelMap, nodeSeq, connectorSeq)
	{
		ctab.sortNodes(function(a, b) {
			var indexA = nodeLabelMap.get(a);
			var indexB = nodeLabelMap.get(b);
			/*
			var indexA = nodeSeq.indexOf(a);
			var indexB = nodeSeq.indexOf(b);
			*/
			if (indexA > 0 && indexB > 0)
				return indexA - indexB;
			else if (indexA < 0 && indexB < 0)
				return -(indexA - indexB);
			else // A < 0 & B > 0, or A > 0 & B < 0
			{
				return (indexA > 0)? -1: 1;
			}
		});
		ctab.sortConnectors(function(a, b) {
			var indexA = connectorSeq.indexOf(a);
			var indexB = connectorSeq.indexOf(b);
			return indexA - indexB;
		});
		var nodes = ctab.getNodes();
		for (var i = 0, l = nodes.length; i < l; ++i)
		{
			var node = nodes[i];
			if (node.hasCtab && node.hasCtab() && nodeSeq.indexOf(node) < 0)  // subgroup and not in seq, need handle child nodes
				this._reindexCtabNodesAndConnectors(node.getCtab(), nodeLabelMap, nodeSeq, connectorSeq);
		}
	}
});
// register and as default
Kekule.canonicalizer.registerExecutor('morgan', Kekule.MorganCanonicalizationExecutor, true);



})();
