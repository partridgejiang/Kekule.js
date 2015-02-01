/**
 * @fileoverview
 * Utils method about chem objects.
 * @author Partridge Jiang
 */

/*
 * requires /utils/kekule.utils.js
 * requires /core/kekule.common.js
 * requires /kekule.structures.js
 */

(function () {

Kekule.ChemStructureUtils = {
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
			return (count % 2)? lengths[(count + 1) >> 1]: (lengths[count >> 1] + lengths[(count >> 1) + 1]) / 2;
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
			return [chemObj];
		}
		result = [].concat(result);  // clone result, avoid affect properties of chemObj

		// if not returned and cascade, need future check
		if (cascade)
		{
			var newResult = [];
			for (var i = 0, l = result.length; i < l; ++i)
			{
				var obj = result[i];
				var cascadeChilds = Kekule.ChemStructureUtils.getChildStructureObjs(obj, cascade);
				if (cascadeChilds.length <= 1)  // can not find cascade children
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
	_getCascadeConnectedNodesAndConnectors: function(connector)
	{
		var connectors = [];
		var nodes = [];
		var objs = connector.getConnectedObjs();
		for (var j = 0, k = objs.length; j < k; ++j)
		{
			var obj = objs[j];
			if (obj !== connector)
			{
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
			Kekule.ArrayUtils.pushUnique(currConnectors, connectors);
			for (var i = 0, l = connectors.length; i < l; ++i)
			{
				var connected = Kekule.ChemStructureUtils._getCascadeConnectedNodesAndConnectors(connectors[i]);
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
	}
};

})();
