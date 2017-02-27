/**
 * @fileoverview
 * Methods about basic chem structures searching and matching.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /core/kekule.structures.js
 * requires /utils/kekule.utils.js
 * requires /algorithm/kekule.canonicalizers.js
 */

(function(){
"use strict";

var AU = Kekule.ArrayUtils;
//var SC = Kekule.UnivChemStructObjComparer;

/*
 * Default options to do sub structure search.
 * @object
 */
Kekule.globalOptions.add('algorithm.structureSearch', {
	doStandardize: true
});

/**
 * A util class to search sub structures in ctab based molecule.
 * @class
 */
Kekule.ChemStructureSearcher = {
	/* @private */
	//OPS_SKELETAL: {'compareAtom': false, 'compareCharge': false, 'compareBondOrder': false, 'compareStereo': false, 'compareHydrogenCount': false},
	/* @private */
	//OPS_CONSTITUTION: {'compareStereo': false},
	/* @private */
	//OPS_CONFIGRATION: {'compareStereo': true},
	/**
	 * Search sub structure in molecule.
	 * @param {Kekule.StructureFragment} subStructure Structure to find.
	 * @param {Kekule.StructureFragment} sourceMol
	 * @param {Hash} options Search options, can include the following fields:
	 *   {
	 *     doStandardize: Bool, whether standardize molecule (especially perceive aromatic rings) before searching,
	 *       default is true.
	 *     exactMatch: Bool, if true, only the same structure with subStructure will be matched.
	 *     structureLevel: comparation level, value from {@link Kekule.StructureComparationLevel}. Default is constitution.
	 *     atom: Bool, if false, all node will be regarded as same. Default is true.
	 *     mass: Bool, whether mass number is compared. Default is false.
	 *     charge: Bool, whether charge of node is compared. Default is false.
	 *     bondOrder: Bool, whether order of bond is compared. Default is true.
	 *     stereo: Bool, whether stereo feature (chiral center, cis/trans of double bond) is taken into consideration. Default is false.
	 *   }
	 * @returns {Variant} If sub structure is found, an array of matching node and connectors will be returned.
	 *   Otherwise false will be returned.
	 */
	findSubStructure: function(subStructure, sourceMol, options)
	{
		// TODO: configuration search need to be rechecked
		var op = Object.extend(Object.extend({}, Kekule.globalOptions.algorithm.structureSearch), options);

		if (op.exactMatch)
		{
			var matched = sourceMol.isSameStructureWith(subStructure, op);
			if (matched)
				return [].concat(sourceMol.getNodes()).concat(sourceMol.getConnectors());
			else
				return false;
		}

		/*
		var KS = Kekule.ChemStructureSearcher;
		var initialCompareOptions = op.compareConfiguration? KS.OPS_CONFIGRATION:
			op.compareConstitution? KS.OPS_CONSTITUTION:
				op.compareSkeletal? KS.OPS_SKELETAL:
				{};

		op = Object.extend(op, initialCompareOptions);

		var objCompareOptions = Object.create({
			compareAtom: op.compareAtom,
			compareMass: op.compareMass,
			compareStereo: op.compareStereo,
			compareLinkedConnectorCount: false,
			compareCharge: op.compareCharge,
			compareHydrogenCount: false,
			compareConnectedObjCount: false,
			compareBondOrder: op.compareBondOrder
		});
		*/
		// initial options
		op = Object.extend({level: Kekule.StructureComparationLevel.CONSTITUTION,
			compareLinkedConnectorCount: false, compareHydrogenCount: false, compareConnectedObjCount: false}, op);
		/*
		var op1 = Kekule.UnivChemStructObjComparer.prepareCompareOptions(op);
		var op2 = Kekule.ObjComparer.getStructureComparisonDetailOptions(op);
		op = op2;
		console.log(op1);
		console.log(op2);
		console.log('===================');
		*/
		op = Kekule.ObjComparer.getStructureComparisonDetailOptions(op);
		var objCompareOptions = op;

		// standardize structures first, perceive aromatic rings
		//console.log(op);
		if (op.doStandardize)
		{
			var standardizeOps = {
				unmarshalSubFragments: !true,
				doCanonicalization: true,
				doAromaticPerception: true
			};
			if (!op.compareStereo)  // do not need perceive stereo
				standardizeOps.doCanonicalization = false;
			// here we ensure two structures are standardized (with their flattened shadows).
			subStructure.standardize(standardizeOps);
			sourceMol.standardize(standardizeOps);
		}
		var flattenedSrcMol = sourceMol.getFlattenedShadowFragment(true);
		var flattenedSubStruct = subStructure.getFlattenedShadowFragment(true);

		/*
		var targetStartingNode = subStructure.getNonHydrogenNodes()[0]; //subStructure.getNodeAt(0);
		var srcNodes = sourceMol.getNonHydrogenNodes(); //sourceMol.getNodes();
		*/
		var targetStartingNode = flattenedSubStruct.getNonHydrogenNodes()[0]; //subStructure.getNodeAt(0);
		var srcNodes = flattenedSrcMol.getNonHydrogenNodes(); //sourceMol.getNodes();

		var srcNodeCount = srcNodes.length;
		var srcIndex = 0;

		var initComparedTargetObjs = [];
		var initComparedSrcObjs = [];

		//console.log(options, objCompareOptions);

		var compareResult = false;
		while (!compareResult && (srcIndex < srcNodeCount))
		{
			compareResult = SM._compareNode(targetStartingNode, srcNodes[srcIndex], initComparedTargetObjs, initComparedSrcObjs, objCompareOptions);
			++srcIndex;
		}

		//if (srcIndex >= srcNodeCount)  // can not find
		if (!compareResult)
			return false;
		else
		{
			var matchedObjs = AU.toUnique(compareResult);
			// map back to original structure
			var result = sourceMol.getFlatternedShadowSourceObjs(matchedObjs);
			return result;
		}
	},

	/*
	__reportComparedObjsChange: function(objs, tag)
	{
		var nodeIds = [];
		for (var i = 0, l = objs.length; i < l; ++i)
		{
			var o = objs[i];
			if (o.getId)
				nodeIds.push(o.getId());
		}
		var s = '[' + nodeIds.join(', ') + ']';
		if (tag)
			s = '(' + tag + ') ' + s;
		console.log(s);
	},
	*/

	/** @private */
	_addToComparedObjs: function(obj, comparedObjs, tag)
	{
		/*
		if (comparedObjs.indexOf(obj) >= 0)
			console.log('dup', tag, obj.getId());
		*/
		//AU.pushUnique(comparedObjs, obj);
		comparedObjs.push(obj);
		//obj.setRenderOption('color', 'red');

		//SM.__reportComparedObjsChange(comparedObjs, tag);
	},
	/** @private */
	_removeFromComparedObjs: function(obj, comparedObjs, tag)
	{
		//AU.remove(comparedObjs, obj);
		var index = comparedObjs.indexOf(obj);
		comparedObjs.length = index;
		//obj.setRenderOption('color', null);

		//SM.__reportComparedObjsChange(comparedObjs, tag);
	},
	/** @private */
	_isSameMappedObj: function(targetObj, srcObj, comparedTargetObjs, comparedSrcObjs)
	{
		var srcIndex = comparedSrcObjs.indexOf(srcObj);
		var targetIndex = comparedTargetObjs.indexOf(targetObj);
		return (srcIndex >= 0) && (srcIndex === targetIndex);
	},
	/** @private */
	_compareComparedNeighbors: function(targetObjs, srcObjs, allComparedTargetObjs, allComparedSrcObjs)
	{
		if (targetObjs.length > srcObjs.length)
			return false;

		var targetIndexes = [];
		for (var i = 0, l = targetObjs.length; i < l; ++i)
		{
			targetIndexes.push(allComparedTargetObjs.indexOf(targetObjs[i]));
		}
		//targetIndexes.sort();
		var srcIndexes = [];
		for (var i = 0, l = srcObjs.length; i < l; ++i)
		{
			srcIndexes.push(allComparedSrcObjs.indexOf(srcObjs[i]));
		}
		//srcIndexes.sort();

		for (var i = 0, l = targetIndexes.length; i < l; ++i)
		{
			if (srcIndexes.indexOf(targetIndexes[i]) < 0)
				return false;
		}
		return true;
	},

	/** @private */
	_compareNode: function(targetNode, srcNode, comparedTargetObjs, comparedSrcObjs, compareOptions)
	{
		/*
		if (SM._isSameMappedObj(targetNode, srcNode, comparedTargetObjs, comparedSrcObjs))
			return true;

		var compareOptions = {
			compareLinkedConnectorCount: false,
			compareCharge: false,
			compareHydrogenCount: false
		};
		*/

		//if (SC.compare(targetNode, srcNode, compareOptions) !== 0)
		if (targetNode.compareStructure(srcNode, compareOptions) !== 0)
			return false;
		else
		{
			var targetConnectors = targetNode.getLinkedNonHydrogenConnectors(); // AU.clone(targetNode.getLinkedConnectors());
			var srcConnectors = srcNode.getLinkedNonHydrogenConnectors(); //AU.clone(srcNode.getLinkedConnectors());

			var targetConnectorCount = targetConnectors.length;  //targetNode.getLinkedConnectorCount();
			var srcConnectorCount = srcConnectors.length; //srcNode.getLinkedConnectorCount();
			if (targetConnectorCount > srcConnectorCount)
				return false;

			var dupComparedTargetObjs = AU.clone(comparedTargetObjs);
			var dupComparedSrcObjs = AU.clone(comparedSrcObjs);
			SM._addToComparedObjs(targetNode, dupComparedTargetObjs, 'target');
			SM._addToComparedObjs(srcNode, dupComparedSrcObjs, 'src');
			/*
			SM._addToComparedObjs(targetNode, comparedTargetObjs, 'target');
			SM._addToComparedObjs(srcNode, comparedSrcObjs, 'src');
			*/

			/*
			var targetConnectors = AU.exclude(AU.clone(targetNode.getLinkedConnectors()), comparedTargetObjs);
			var srcConnectors = AU.exclude(AU.clone(srcNode.getLinkedConnectors()), comparedSrcObjs);
			*/

			var targetComparedConnectors = AU.intersect(targetConnectors, dupComparedTargetObjs);
			var srcComparedConnectors = AU.intersect(srcConnectors, dupComparedSrcObjs);

			var result = true;
			if (!SM._compareComparedNeighbors(targetComparedConnectors, srcComparedConnectors, dupComparedTargetObjs, dupComparedSrcObjs))
				result = false;
			else
			{
				targetConnectors = AU.exclude(targetConnectors, targetComparedConnectors);
				srcConnectors = AU.exclude(srcConnectors, srcComparedConnectors);
				if (targetConnectors.length > srcConnectors.length)
					result = false;
			}

			var nextComparedObjs = [];
			while (result && targetConnectors.length)
			{
				var compareResult = false;
				var targetConn = targetConnectors.shift();
				var srcIndex = 0;
				var srcConn;
				while (srcConnectors.length && !compareResult && (srcIndex < srcConnectors.length))
				{
					srcConn = srcConnectors[srcIndex];
					compareResult = SM._compareConnector(targetConn, srcConn, dupComparedTargetObjs, dupComparedSrcObjs, compareOptions);
					if (compareResult)
						nextComparedObjs = nextComparedObjs.concat(compareResult);
					++srcIndex;
				}
				if (!compareResult)  // can not find match connector
				{
					result = false;
					break;
				}
				else
					AU.remove(srcConnectors, srcConn);
			}

			/*
			if (!result)  // remove targetConn and srcConn from compared
			{
				SM._removeFromComparedObjs(targetNode, comparedTargetObjs, 'target');
				SM._removeFromComparedObjs(srcNode, comparedSrcObjs, 'src');
			}
			*/

			if (result)  // compare success, returns all compared objects
				result = [srcNode].concat(nextComparedObjs) //dupComparedSrcObjs;
			return result;
		}
	},

	/** @private */
	_compareConnector: function(targetConn, srcConn, comparedTargetObjs, comparedSrcObjs, compareOptions)
	{
		// targetConn and srcConn are surely not connected to hydrogen atom
		/*
		if (SM._isSameMappedObj(targetConn, srcConn, comparedTargetObjs, comparedSrcObjs))
			return true;

		var compareOptions = {
			compareConnectedObjCount: false
		};
		*/

		//if (SC.compare(targetConn, srcConn, compareOptions) !== 0)
		if (targetConn.compareStructure(srcConn, compareOptions) !== 0)
			return false;
		else
		{
			var targetConnectedObjCount = targetConn.getConnectedObjCount();
			var srcConnectedObjCount = srcConn.getConnectedObjCount();
			if (targetConnectedObjCount > srcConnectedObjCount)
				return false;

			var dupComparedTargetObjs = AU.clone(comparedTargetObjs);
			var dupComparedSrcObjs = AU.clone(comparedSrcObjs);
			SM._addToComparedObjs(targetConn, dupComparedTargetObjs, 'target');
			SM._addToComparedObjs(srcConn, dupComparedSrcObjs, 'src');
			/*
			SM._addToComparedObjs(targetConn, comparedTargetObjs, 'target');
			SM._addToComparedObjs(srcConn, comparedSrcObjs, 'src');
			*/

			/*
			var targetConnectedObjs = AU.exclude(AU.clone(targetConn.getConnectedObjs()), comparedTargetObjs);
			var srcConnectedObjs = AU.exclude(AU.clone(srcConn.getConnectedObjs()), comparedSrcObjs);
			*/
			var targetConnectedObjs = AU.clone(targetConn.getConnectedObjs());
			var srcConnectedObjs = AU.clone(srcConn.getConnectedObjs());

			var targetComparedObjs = AU.intersect(targetConnectedObjs, dupComparedTargetObjs);
			var srcComparedObjs = AU.intersect(srcConnectedObjs, dupComparedSrcObjs);

			var result = true;
			if (!SM._compareComparedNeighbors(targetComparedObjs, srcComparedObjs, dupComparedTargetObjs, dupComparedSrcObjs))
				result = false;
			else
			{
				targetConnectedObjs = AU.exclude(targetConnectedObjs, targetComparedObjs);
				srcConnectedObjs = AU.exclude(srcConnectedObjs, srcComparedObjs);
				if (targetConnectedObjs.length > srcConnectedObjs.length)
					result = false;
			}

			var nextComparedObjs = [];
			while (result && targetConnectedObjs.length)
			{
				var compareResult = false;
				var targetObj = targetConnectedObjs.shift();
				var srcIndex = 0;
				var srcObj;
				while (srcConnectedObjs.length && !compareResult && (srcIndex < srcConnectedObjs.length))
				{
					srcObj = srcConnectedObjs[srcIndex];
					if (srcObj.getClass() !== targetObj.getClass())
						compareResult = false;
					else if (srcObj instanceof Kekule.ChemStructureNode)
						compareResult = SM._compareNode(targetObj, srcObj, dupComparedTargetObjs, dupComparedSrcObjs, compareOptions);
					else if (srcObj instanceof Kekule.ChemStructureConnector)
						compareResult = SM._compareConnector(targetObj, srcObj, dupComparedTargetObjs, dupComparedSrcObjs, compareOptions);
					else
						compareResult = false;

					if (compareResult)
						nextComparedObjs = nextComparedObjs.concat(compareResult);

					++srcIndex;
				}
				if (!compareResult)  // can not find match connector
				{
					result = false;
					break;
				}
				else
					AU.remove(srcConnectedObjs, srcObj);
			}

			/*
			if (!result)  // remove targetConn and srcConn from compared
			{
				SM._removeFromComparedObjs(targetConn, comparedTargetObjs, 'target');
				SM._removeFromComparedObjs(srcConn, comparedSrcObjs, 'src');
			}
			*/

			if (result)  // compare success, returns all compared objects
				result = [srcConn].concat(nextComparedObjs);  //dupComparedSrcObjs;

			return result;
		}
	}
};

var SM = Kekule.ChemStructureSearcher;

ClassEx.extend(Kekule.StructureFragment,
/** @lends Kekule.StructureFragment# */
{
	/**
	 * Search sub structure in this fragment.
	 * @param {Kekule.StructureFragment} subStructure Structure to find.
	 * @param {Hash} options Search options, can include the following fields:
	 *   {
	 *     doStandardize: Bool, whether standardize molecule (especially perceive aromatic rings) before searching.
	 *     exactMatch: Bool, if true, only the same structure with subStructure will be matched.
	 *     ignoreCharge: Bool
	 *     ignoreBondOrder: Bool
	 *   }
	 * @returns {Variant} If sub structure is found, an array of matching node and connectors will be returned.
	 *   Otherwise false will be returned.
	 */
	search: function(subStructure, options)
	{
		return SM.findSubStructure(subStructure, this, options);
	}
});

})();