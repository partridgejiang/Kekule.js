/**
 * @fileoverview
 * Contains utility class and methods to compare node or connectors in chem structure.
 * @author Partridge Jiang
 */


/*
 * requires /core/kekule.common.js
 * requires /core/kekule.utils.js
 * requires /data/kekule.structures.js
 * requires /core/kekule.chemUtils.js
 * requires /algorithm/kekule.graph.js
 */

(function(){
"use strict";

var K = Kekule;
var AU = Kekule.ArrayUtils;
var BT = Kekule.BondType;

/**
 * A comparer to decide which chem structure object is "bigger" or "superior" than another one.
 * In the comparer, each structure object is turned to a int value with the fixed format.
 *
 * For node, the value will be 0xTNAAABBBLLCPH  (13 digitals)
 *   [Atom]:
 *   T: 0-F, object major type, always be 1 to a node.
 *   N: object class, 1: Atom, 2: Pseudoatom, 3: VariableAtom, E: unspecified atom (atom not the in the previous three types), 0: other node.
 *   AAA: atom major property. Atomic number for usual atom, FFE for pseudoatom, FFF for variable atom, 000 for other types of node.
 *   BBB: atom mass number, if mass number is not specified, 000 will be used. For other node, this value is always 000.
 *   LL: Linked conector count. Connector to hydrogen will not be considered.
 *   C: charge. 7 for a neutral node, 8 for +1, 9 for +2, 6 for -1, 5 for -2 and so on.
 *   P: parity. Stereo parity, 0 for no stereo, 1 for odd and 2 for even.
 *   H: Hydrogen count.
 *   [Fragment]:
 *   T: 0-F, object major type, always be 1 to a node.
 *   N: object class, 1: subgroup, 5: molecule, 0: other fragment.
 *   AAA: atom count in fragment. 000 for unknown. Hydrogen atoms are ignored.
 *   BBB: bond count in fragment, 000 for unknown. Bond to hydrogens are ignored.
 *   LL: Linked conector count.
 *   C: charge. 7 for a neutral node, 8 for +1, 9 for +2, 6 for -1, 5 for -2 and so on.
 *   P: parity. Stereo parity, 0 for no stereo, 1 for odd and 2 for even.
 *   H: Hydrogen count, usually 0.
 * For connector the value will be 0xTCBPNNAA  (8 digitals)
 *   T: 0-F, object major type, always be 0 to a connector.
 *   C: connector type. 1 for bond and 0 for other types of connector.
 *   B: bond type. 1: covalent, 2: ionic, 3: coordinate, 4: metallic, 9: hydrogen, 0: other
 *   P: parity.
 *   NN: bond electron count. 02: single, 04: double, 06: triple, 03: aromatic, 00: other
 *   AA: connected object count.
 *
 * @deprecated
 */
Kekule.UnivChemStructObjComparer = {
	/** @private */
	NODE_CLASS_MAP: (new K.MapEx()).set(K.Atom, 0x1).set(K.Pseudoatom, 0x2).set(K.VariableAtom, 0x3).set(K.AbstractAtom, 0xE).set(K.ChemStructureNode, 0),
	/** @private */
	CHARGE_BASE: 0x7,
	/** @private */
	BOND_TYPE_MAP: (new K.MapEx(true)).set(BT.COVALENT, 1).set(BT.IONIC, 2).set(BT.COORDINATE, 3).set(BT.METALLIC, 4).set(BT.HYDROGEN, 9),
	/** @private */
	_P32: Math.pow(2, 32),
	/** @private */
	_P44: Math.pow(2, 44),
	/** @private */
	_P20: Math.pow(2, 20),

	/**
	 * Analysis input options and forms a detail option object for other comparation methods.
	 * @param {Hash} options May include the following fields:
	 *   {
	 *     level: comparation level, value from {@link Kekule.StructureComparationLevel}.
	 *     (for node)
	 *     compareAtom: Bool,
	 *     compareMass: Bool,
	 *     compareLinkedConnectorCount: Bool,
	 *     compareCharge: Bool,
	 *     compareStereo: Bool,
	 *     compareHydrogenCount: Bool,
	 *     (for connector)
	 *     compareConnectedObjCount: Bool,
	 *     compareBondType: Bool,
	 *     compareBondOrder: Bool
	 *     compareStereo: Bool
	 *   }
	 *   The detailed bool values will override settings in level.
	 * @returns {Hash}
	 */
	prepareCompareOptions: function(options)
	{
		var CL = Kekule.StructureComparationLevel;
		var level = (options && options.level) || Kekule.globalOptions.structureComparation.structureComparationLevel; /*CL.DEFAULT*/
		var result;
		if (level === CL.SKELETAL)
			result = {
				compareAtom: false, compareMass: false, compareLinkedConnectorCount: true, compareCharge: false,
				compareStereo: false, compareHydrogenCount: false,
				compareConnectedObjCount: true, compareBondType: false, compareBondOrder: false};
		else if (level === CL.CONSTITUTION)
			result = {
				compareAtom: true, compareMass: false, compareLinkedConnectorCount: true, compareCharge: false,
				compareStereo: false, compareHydrogenCount: true,
				compareConnectedObjCount: true, compareBondType: true, compareBondOrder: true};
		else if (level === CL.CONFIGURATION)
			result = {
				compareAtom: true, compareMass: false, compareLinkedConnectorCount: true, compareCharge: false,
				compareStereo: true, compareHydrogenCount: true,
				compareConnectedObjCount: true, compareBondType: true, compareBondOrder: true};
		else if (level === CL.EXACT)
			result = {
				compareAtom: true, compareMass: true, compareLinkedConnectorCount: true, compareCharge: true,
				compareStereo: true, compareHydrogenCount: true,
				compareConnectedObjCount: true, compareBondType: true, compareBondOrder: true};
		// override bool values
		result = Object.extend(result, options || {});
		return result;
	},
	/**
	 * Get a digital value for comparing object.
	 * @param {Kekule.ChemStructureObject} chemObj
	 * @param {options} Value getter options. Can including fields:
	 *   {
	 *     (for node)
	 *     compareAtom: Bool,
	 *     compareMass: Bool,
	 *     compareLinkedConnectorCount: Bool,
	 *     compareCharge: Bool,
	 *     compareStereo: Bool,
	 *     compareHydrogenCount: Bool,
	 *     (for connector)
	 *     compareConnectedObjCount: Bool,
	 *     compareBondType: Bool,
	 *     compareBondOrder: Bool
	 *     compareStereo: Bool
	 *   }
	 *   All fields' default value are true.
	 * @returns {Int}
	 */
	getCompareValue: function(chemObj, options)
	{
		/*
		var ops = Object.extend({
			compareAtom: true,
			compareMass: true,
			compareLinkedConnectorCount: true,
			compareCharge: true,
			compareStereo: true,
			compareHydrogenCount: true,
			compareConnectedObjCount: true,
			compareBondType: true,
			compareBondOrder: true
		}, options);
		*/
		var ops = Kekule.UnivChemStructObjComparer.prepareCompareOptions(options);
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
 *     compareStereo: Bool,
 *     compareHydrogenCount: Bool,
 *     (for connector)
 *     compareConnectedObjCount: Bool,
 *     compareBondType: Bool,
 *     compareBondOrder: Bool,
 *     compareStereo: Bool
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
		if (obj1 && obj2)
		{
			if ((result === 0) && (obj1.getNodes && obj2.getNodes))  // structure fragment, if with same node and connector count, compare nodes and connectors
			{
				var nodes1 = obj1.getNonHydrogenNodes(); // obj1.getNodes();
				var nodes2 = obj2.getNonHydrogenNodes(); // obj2.getNodes();
				result = nodes1.length - nodes2.length;
				if (result === 0)
				{
					for (var i = 0, l = nodes1.length; i < l; ++i)
					{
						var result = U.compare(nodes1[i], nodes2[i], compareOptions);
						if (result !== 0)
							break;
					}
				}
			}
			if ((result === 0) && (obj1.getConnectors && obj2.getConnectors))
			{
				var connectors1 = obj1.getNonHydrogenConnectors(); //obj1.getConnectors();
				var connectors2 = obj2.getNonHydrogenConnectors(); //obj2.getConnectors();
				result = connectors1.length - connectors2.length;
				if (result === 0)
				{
					for (var i = 0, l = connectors1.length; i < l; ++i)
					{
						var result = U.compare(connectors1[i], connectors2[i], compareOptions);
						if (result !== 0)
							break;
					}
				}
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
	 * @param {Hash} compareOptions
	 * @returns {Array}
	 */
	sort: function(objs, ascendOrder, compareOptions)
	{
		objs.sort(
			function(obj1, obj2)
			{
				var r = Kekule.UnivChemStructObjComparer.compare(obj1, obj2, compareOptions);
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
		var result = 0x1000000000000;  // node always start with 1
		// object class
		if (options.compareAtom)
		{
			var nodeClass = node.getClass();
			var vclass = K.UnivChemStructObjComparer.NODE_CLASS_MAP.get(nodeClass);
			var detailValue = 0;
			if (K.ObjUtils.isUnset(vclass))
			{
				if (node instanceof K.AbstractAtom)
				{
					vclass = (node instanceof K.Atom) ? 0x1 :
						(node instanceof K.Pseudoatom) ? 0x2 :
							(node instanceof K.VariableAtom) ? 0x3 : 0x0;
					//detailValue = K.UnivChemStructObjComparer.getAtomDetailCompareValue(node);
				}
				if (node instanceof K.StructureFragment)
				{
					//vclass = 0x30;
					vclass = (node instanceof K.SubGroup) ? 0x1 :
						(node instanceof K.Molecule) ? 0x5 : 0x0;
					//detailValue = K.UnivChemStructObjComparer.getAtomDetailCompareValue(node);
				}
				else
				{
					vclass = 0;
					//detailValue = K.UnivChemStructObjComparer.getAtomDetailCompareValue(node);
				}
			}
		}
		else
		  var vclass = 0;
		detailValue = K.UnivChemStructObjComparer.getAtomDetailCompareValue(node, options);
		result += vclass * U._P44; //(vclass << (12 * 4));
		result += detailValue;

		// Linked conector count
		if (options.compareLinkedConnectorCount)
		{
			var vlinkedConnector = node.getLinkedNonHydrogenConnectors().length; //node.getLinkedConnectorCount();
			result += (vlinkedConnector << (4 * 4));
		}

		// charge
		if (options.compareCharge)
		{
			var vcharge = Math.round(node.getCharge() || 0) + K.UnivChemStructObjComparer.CHARGE_BASE; // there may be partial charge, so a round function is used here
			result += (vcharge << (3 * 4));
		}
		// parity
		if (options.compareStereo)
		{
			var parity = node.getParity? (node.getParity() || 0): 0;
			result += parity << (2 * 4);
		}
		// hydrogen count
		if (options.compareHydrogenCount)
		{
			var vhydrogen = node.getHydrogenCount? node.getHydrogenCount(true) || 0: 0;
			result += vhydrogen;
		}

		return result;
	},
	/** @private */
	getAtomDetailCompareValue: function(atom, options)
	{
		var U = K.UnivChemStructObjComparer;
		var result = 0;
		// atom major property and atom mass number
		var vmajorProp, vmass = 0;
		if (options.compareAtom)
		{
			var nodeClass = atom.getClass();
			if (nodeClass === K.Atom)
			{
				vmajorProp = atom.getAtomicNumber() || 0;
				if (options.compareMass)
					vmass = atom.getMassNumber() || 0;
			}
			else if (nodeClass === K.Pseudoatom)
				vmajorProp = 0xFFE;
			else if (nodeClass === K.VariableAtom)
				vmajorProp = 0xFFF;
			else
				vmajorProp = 0;
			result += vmajorProp * U._P32 + vmass * U._P20; //(vmajorProp << (9 * 4)) | (vmass << (6 * 4));
		}
		return result;
	},
	/** @private */
	getFragmentDetailCompareValue: function(fragment, options)
	{
		var result = 0;
		result += (fragment.getNodeCount() || 0) * U._P32 + (fragment.getConnectorCount() || 0) * U._P20;

		return result;
	},

	/** @private */
	getConnectorCompareValue: function(connector, options)
	{
		var U = K.UnivChemStructObjComparer;
		var result = 0;  // as result alway start with 0, the actual digital is 8, so bit operations can be used
		var isBond = connector instanceof Kekule.Bond;
		// connector type
		result |= isBond? (1 << (6 * 4)): 0;
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
			result |= (vBondType << (5 * 4));
		}
		// parity
		if (options.compareStereo)
		{
			var parity = connector.getParity? (connector.getParity() || 0): 0;
			result += parity << (4 * 4);
		}
		// bond electron count
		if (options.compareBondOrder)
		{
			var electronCount = isBond? Math.round(connector.getElectronCount()): 0;
			result |= electronCount << (2 * 4);
		}
		// connected object count
		if (options.compareConnectedObjCount)
		{
			result |= (connector.getConnectedObjCount() || 0);
		}
		return result;
	}
};


})();