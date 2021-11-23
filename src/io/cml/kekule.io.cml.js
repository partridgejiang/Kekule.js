/**
 * @fileoverview
 * File for supporting CML (Chemical Markup Language), especially on read/write molecules and reactions.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /lan/xmlJsons.js
 * requires /core/kekule.common.js
 * requires /core/kekule.elements.js
 * requires /core/kekule.electrons.js
 * requires /core/kekule.structures.js
 * requires /core/kekule.structureBuilder.js
 * requires /core/kekule.reactions.js
 * requires /utils/kekule.domHelper.js
 * requires /io/kekule.io.js
 * requires /localization
 */

(function(){

"use strict";

/*
 * Default options to read/write CML format data.
 * @object
 */
Kekule.globalOptions.add('IO.cml', {
	prettyPrint: true,
	enableReadRootObjList: true,  // if false, when reading <cml> with multiple child root elements, only the first will be returned by reader
	defaultRootObjListHolder: Kekule.ChemSpace  // when reading root obj list, put all objects into instance of this class
});

/**
 * Defines some constants about CML.
 * @class
 * @private
 */
Kekule.IO.CML = {
	CML2CORE_NAMESPACE_URI: 'http://www.xml-cml.org/schema/cml2/core',  //'http://www.xml-cml.org/schema',
	CML3_SCHEMA_NAMESPACE_URI: 'http://www.xml-cml.org/schema',
	ARRAY_VALUE_DELIMITER: ' ',
	TYPED_ELEM_NAMES: ['string', 'integer', 'float'],
	TYPED_ARRAY_ELEM_NAMES: ['stringArray', 'integerArray', 'floatArray'],
	ATOMS_REF_ATTRIBS: ['atomRef', 'atomRefs2', 'atomRefs3', 'atomRefs4', 'atomRefs', 'atomRefArray'],
	BONDS_REF_ATTRIBS: ['bondRef', 'bondRefs', 'bondRefArray'],
	MOL_REF_ATTRIBS: ['moleculeRef', 'moleculeRefs'],
	DEFAULT_VALUE_DELIMITER_PATTERN: /\s+/gm,
};
Kekule.IO.CML.LEGAL_CORE_NAMESPACE_URIS = [
	Kekule.IO.CML.CML2CORE_NAMESPACE_URI,
	Kekule.IO.CML.CML3_SCHEMA_NAMESPACE_URI
];

/**
 * A help class to handle CML
 * @class
 */
Kekule.IO.CmlUtils = {
	/** @private */
	_cmlUnitConvMap: [  // each item is an array of [cmlUnitCoreName, cmlUnitSymbol, kekuleUnitSymbol, isSiUnit(bool)]
		['m', 'm', 'm', true],
		['second', 's', 'sec', true],
		['hour', 'h', 'hr', false],
		['kg', 'kg', 'kg', true],
		['k', 'K', 'K', true],
		['mol', 'mol', 'mol', true],
		['candela', 'cd', 'cd', true],
		['radian', 'rad', 'rad', true],
		['steradian', 'sr', 'sr', true],
		['hertz', 'Hz', 'Hz', true],
		['newton', 'N', 'N', true],
		['joule', 'J', 'J', true],
		['watt', 'W', 'W', true],
		['pascal', 'Pa', 'Pa', true],
		['coulomb', 'C', 'C', true],
		['volt', 'V', 'V', true],
		['ampere', 'A', 'A', true],
		['ohm', '[Omega]', 'Ω', true],
		['farad', 'F', 'F', true],
		['siemens', 'S', 'S', true],
		['weber', 'Wb', 'Wb', true],
		['tesla', 'T', 'T', true],
		['henry', 'H', 'H', true],
		['becquerel', 'Bq', 'Bq', true],
		['gray', 'Gy', 'Gy', true],
		['sievert', 'Sv', 'Sv', true],
		['katal', 'kat', 'kat', true],
		['molarity', '_i_M__i_', 'mol/L', true],
		['molality', '_i_m__i_', 'mol/kg', true],
		['m2', 'm2', 'm2', true],
		['m3', 'm3', 'm3', true],
		['m.s-1', 'm.s-1', 'm/s', true],
		['m.s-2', 'm.s-2', 'm·s-2', true],
		['rad.s-1', 'rad.s-1', 'rad/s', true],
		['n.s', 'N.s', 'N·s', true],
		['n.m.s', 'N.m.s', 'N·m·s', true],
		['n.m', 'N.m', 'N·m', true],
		['m-1', 'm-1', 'm-1', true],
		['kg.m-3', 'kg.m-3', 'kg·m-3', true],
		['kg-1.m3', 'kg-1.m3', 'kg-1·m3', true],
		['m-3.mol', 'm-3.mol', 'm-3·mol', true],
		['m3.mol-1', 'm3.mol-1', 'm3/mol', true],
		['j.k-1', 'J.K-1', 'J/K', true],
		['j.k-1.mol-1', 'J.K-1.mol-1', 'J·K-1·mol-1', true],
		['j.k-1.kg-1', 'J.K-1.kg-1', 'J·K-1·kg-1', true],
		['j.mol-1', 'J.mol-1', 'J/mol', true],
		['j.kg-1', 'J.kg-1', 'J/kg', true],
		['j.m-3', 'J.m-3', 'J·m-3', true],
		['n.m-1', 'N.m-1 = J.m-2', 'N/m', true],
		['w.m-2', 'W.m-2', 'W·m-2', true],
		['w.m-1.k-1', 'W.m-1.K-1', 'W·m-1·K-1', true],
		['m2.s-1', 'm2.s-1', 'm2/s', true],
		['pa.s', 'Pa.s', 'Pa·s', true],
		['pa.s', 'N.s.m-2', 'Pa·s', true],
		['c.m-3', 'C.m-3', 'C·m-3', true],
		['a.m-2', 'A.m-2', 'A·m-2', true],
		['s.m-1', 'S.m-1', 'S/m', true],
		['s.m2.mol-1', 'S.m2.mol-1', 'S·m2/mol', true],
		['f.m-1', 'F.m-1', 'F/m', true],
		['h.m-1', 'H.m-1', 'H/m', true],
		['v.m-1', 'V.m-1', 'V/m', true],
		['a.m-1', 'A.m-1', 'A/m', true],
		['cd.m-2', 'cd.m-2', 'cd·m-2', true],
		['c.kg-1', 'C.kg-1', 'C/kg', true],
		['gy.s-1', 'Gy.s-1', 'Gy/s', true],
		['j.m-1', 'J.m-1', 'J/m', true],
		['ang', '[Aring]', 'Å', false],
		['deg', '[deg]', 'deg', false],
		['ang3', 'A3', 'Å3', false],
		['celsius', '[deg]C', '℃', false],
		['debye', 'D', 'D', false],
		['electron', 'e', 'e', false],
		['hartree', 'hart', 'hart', false],
		['gpa', 'GPa', 'GPa', false],
		['gpa-1', 'GPa-1', 'GPa-1', false],
		['atmosphere', 'atm', 'atm', false],
		['kcal.mol-1.ang-1', 'kcal mol-1 ang-1', 'kcal·mol-1·ang-1', false],
		['kj.mol-1', 'kj mol-1', 'kj/mol', false],
		['l', 'L', 'L', false],
		['ml', 'mL', 'mL', false],
		['kcal.ang-1', 'kcal.ang-1', 'kcal/Å', false],
		['kcal.rad-1', 'kcal.rad-1', 'kcal/rad', false],
		['ph', 'pH', 'pH', false],
		['centipoise', 'cp', 'cp', false],
		['km.s-1', 'km/s', 'km/s', false],
		['arbitrary', 'arb', 'arb', false],
	],
	/*
	 * Convert a JS type name to XSD type name to be used in <scalar>
	 * @param {String} dataTypeName
	 * returns {String}
	 */
	/*
	dataTypeToXsdType: function(dataTypeName)
	{
		var result =
				(dataTypeName == DataType.INT)? 'xsd:integer':
				(dataTypeName == DataType.FLOAT)? 'xsd:float':
				(dataTypeName == DataType.BOOL)? 'xsd:boolean':
				(dataTypeName == DataType.DATE)? 'xsd:dateTime':
				null;
	}
	*/
	/**
	 * Try convert a string to float. If fails, the original string will be returned.
	 * @param {String} str
	 * @returns {Variant}
	 */
	tryParseFloat: function(str)
	{
		var result = parseFloat(str);
		return Kekule.NumUtils.isNormalNumber(result)? result: str;
	},
	/**
	 * Based on cml datatype attribute, convert a simple string value to a proper js value.
	 * @param {String} sValue
	 * @param {String} xmlDataType
	 * @param {Bool} forceAllNumTypesToFloat If true, numbers will always be converted with parseFloat rather than parseInt for integer types.
	 * @returns {Variant}
	 */
	convertSimpleValueByDataType: function(sValue, xmlDataType, forceAllNumTypesToFloat)
	{
		var value;
		switch (xmlDataType)
		{
			case 'xsd:boolean':
			{
				value = Kekule.StrUtils.strToBool(sValue);
				break;
			}
			case 'xsd:float':
			case 'xsd:double':
			case 'xsd:duration':
			case 'xsd:decimal':
			{
				value = parseFloat(sValue);
				break;
			}
			case 'xsd:integer':
			case 'xsd:nonPositiveInteger':
			case 'xsd:negativeInteger':
			case 'xsd:long':
			case 'xsd:int':
			case 'xsd:short':
			case 'xsd:byte':
			case 'xsd:nonNegativeInteger':
			case 'xsd:unsignedLong':
			case 'xsd:unsignedInt':
			case 'xsd:unsignedShort':
			case 'xsd:unsignedByte':
			case 'xsd:positiveInteger':
			{
				value = parseInt(sValue);
				break;
			}
			default:
				value = sValue;
		}
		return value;
	},
	/**
	 * Returns the CML data type token for a Kekule data type.
	 * @param {String} dataType
	 * @returns {String}
	 */
	getCmlTypeForDataType: function(dataType)
	{
			var result =
				(dataType == DataType.INT)? 'xsd:integer':
				(dataType == DataType.FLOAT)? 'xsd:float':
				(dataType == DataType.BOOL)? 'xsd:boolean':
				null;
			return result;
	},
	/**
	 * Convert a namespaced string (xxx:yyyy) in CML to Kekule form.
	 * @param {String} s
	 * @returns {String}
	 */
	cmlNsTokenToKekule: function(s)
	{
		return s.replace(/\:/g, '.');
	},
	/**
	 * Convert a namespaced string (xxx.yyyy) in Kekule to CML form.
	 * @param {String} s
	 * @returns {String}
	 */
	kekuleNsTokenToCml: function(s)
	{
		return s.replace(/\./g, ':');
	},
	/**
	 * Returns the namespace and local part of cml namespaced value.
	 * E.g., returns {namespace: 'units', localName: 'hz'} for 'units:hz'.
	 * @param {String} s
	 * @returns {String}
	 */
	getCmlNsValueDetails: function(s)
	{
		var p = s.indexOf(':');
		var namespace = (p >= 0)? s.substring(0, p): '';
		var localName = (p >= 0)? s.substr(p + 1): s;
		return {'namespace': namespace, 'localName': localName};
	},
	/**
	 * Returns the local part of cml namespaced value.
	 * E.g., returns 'hz' for 'units:hz'.
	 * @param {String} s
	 * @returns {String}
	 */
	getCmlNsValueLocalPart: function(s)
	{
		var p = s.indexOf(':');
		var localName = (p >= 0)? s.substr(p + 1): s;
		return localName;
	},
	/**
	 * Get the suitable metric unit symbol for CML unit string.
	 * @param {String} cmlUnit
	 * @returns {String}
	 */
	cmlUnitStrToMetricsUnitSymbol: function(cmlUnit)
	{
		var coreUnit = Kekule.IO.CmlUtils.getCmlNsValueLocalPart(cmlUnit);
		var coreUnitLower = coreUnit.toLowerCase();
		// sometimes the unit name is suffixed with plural 's', we may need to remove it?
		var coreUnitLowerWithNoSuffix = ((coreUnitLower.length > 3) && coreUnitLower.endsWith('s'))? coreUnitLower.substr(0, coreUnitLower.length - 1): null;

		var KU = Kekule.Unit;
		/*
		var maps = [
			['arbitrary', KU.Arbitrary.ARBITRARY],
			['counts', KU.Counts.COUNTS],
			['cm-1', KU.WaveNumber.RECIPROCAL_CENTIMETER],
			['hertz', KU.Frequency.HERTZ],
			['hz', KU.Frequency.HERTZ]
		];
		*/
		var maps = Kekule.IO.CmlUtils._cmlUnitConvMap;
		var sunit;
		for (var i = 0, l = maps.length; i < l; ++i)
		{
			//if (coreUnitLower === maps[i][0].toLowerCase())
			if (coreUnit === maps[i][0] || coreUnit === maps[i][1])
			{
				sunit = maps[i][2];
				break;
			}
		}
		if (!sunit)
		{
			for (var i = 0, l = maps.length; i < l; ++i)
			{
				if (coreUnitLower === maps[i][0].toLowerCase() || coreUnitLower === maps[i][1].toLowerCase())
				{
					sunit = maps[i][2];
					break;
				}
			}
		}
		if (!sunit && coreUnitLowerWithNoSuffix)
		{
			for (var i = 0, l = maps.length; i < l; ++i)
			{
				if (coreUnitLowerWithNoSuffix === maps[i][0].toLowerCase() || coreUnitLowerWithNoSuffix === maps[i][1].toLowerCase())
				{
					sunit = maps[i][2];
					break;
				}
			}
		}
		if (!sunit)
		{
			var unitObj = Kekule.Unit.getUnit(coreUnit, true);  // ignore case
			sunit = unitObj && unitObj.symbol;
		}
		if (!sunit)
		{
			var unitObj = Kekule.Unit.getUnitByName(coreUnit, true);  // ignore case
			sunit = unitObj && unitObj.symbol;
		}
		if (!sunit && coreUnitLowerWithNoSuffix)
		{
			var unitObj = Kekule.Unit.getUnitByName(coreUnitLowerWithNoSuffix, true);  // ignore case
			sunit = unitObj && unitObj.symbol;
		}

		if (sunit)
			return sunit;
		else
			return coreUnit; // if unit not found, returns the core unit string directly
	},
	/**
	 * Convert a Kekule metrics unit symbol to a suitable CML unit.
	 * @param {String} unitSymbol
	 * @returns {String}
	 */
	metricsUnitSymbolToCmlUnitStr: function(unitSymbol)
	{
		var maps = Kekule.IO.CmlUtils._cmlUnitConvMap;
		var result;
		for (var i = 0, l = maps.length; i < l; ++i)
		{
			var map = maps[i];
			//if (coreUnitLower === maps[i][0].toLowerCase())
			if (unitSymbol === map[2])
			{
				var prefix = map[3]? 'siUnits:': 'units:';
				result = prefix + map[0];
				break;
			}
		}
		if (!result)  // not found in map, just use 'unit:symbol' form
			result = 'units:' + unitSymbol;
		return result;
	},
	/**
	 * Turn a CML bond order value to a Kekule one.
	 * @param {String} cmlOrder
	 * @returns {Int} Value from {Kekule.BondOrder}
	 */
	cmlBondOrderToKekule: function(cmlOrder)
	{
		var result = parseInt(cmlOrder);
		if (result !== result)  // result is NaN
		{
			switch (cmlOrder.toUpperCase())
			{
				case 'A': result = Kekule.BondOrder.EXPLICIT_AROMATIC; break;
				case 'D': result = Kekule.BondOrder.DOUBLE; break;
				case 'T': result = Kekule.BondOrder.TRIPLE; break;
				case 'S':
				default:
					result = Kekule.BondOrder.SINGLE; break;
			}
		}
		return result;
	},
	/**
	 * Turn a Kekule bond order value to a CML string.
	 * @param {Int} kekuleOrder
	 * @returns {String}
	 */
	kekuleBondOrderToCml: function(kekuleOrder)
	{
		switch (kekuleOrder)
		{
			case Kekule.BondOrder.EXPLICIT_AROMATIC: return 'A';
			case Kekule.BondOrder.QUAD: return '4';
			case Kekule.BondOrder.DOUBLE: return 'D';
			case Kekule.BondOrder.TRIPLE: return 'T';
			//case Kekule.BondOrder.SINGLE: return 'S';
			//case Kekule.BondOrder.OTHER: return 'S';
			default:
				return 'S';
		}
	},
	/**
	 * Turn a CML bond stereo value to a Kekule one.
	 * @param {String} cmlStereo
	 * @returns {Int} Value from {Kekule.BondStereo}
	 */
	cmlBondStereoToKekule: function(cmlStereo)
	{
		var result;
		switch (cmlStereo.toUpperCase())
		{
			case 'E': result = Kekule.BondStereo.E; break;
			case 'Z': result = Kekule.BondStereo.Z; break;
			case 'C': result = Kekule.BondStereo.CIS; break;
			case 'T': result = Kekule.BondStereo.TRANS; break;
			case 'W': result = Kekule.BondStereo.UP; break;
			case 'H': result = Kekule.BondStereo.DOWN; break;
			default: result = Kekule.BondStereo.NONE; break;
		}
		return result;
	},
	/**
	 * Turn a Kekule bond stereo value to a CML string.
	 * Note Kekule has invert stereo enumerations, when translate to CML,
	 * you have to manually invert the bond atom refs to get a correct stereo result.
	 * @param {Int} kekuleStereo Value from {Kekule.BondStereo}
	 * @returns {Hash} {value, invert}
	 */
	kekuleBondStereoToCml: function(kekuleStereo)
	{
		switch (kekuleStereo)
		{
			case Kekule.BondStereo.UP: return {'value': 'W'};
			case Kekule.BondStereo.UP_INVERTED: return {'value': 'W', 'invert': true};
			case Kekule.BondStereo.DOWN: return {'value': 'H'};
			case Kekule.BondStereo.DOWN_INVERTED: return {'value': 'H', 'invert': true};
			case Kekule.BondStereo.E: return {'value': 'E'};
			case Kekule.BondStereo.Z: return {'value': 'Z'};
			case Kekule.BondStereo.CIS: return {'value': 'C'};
			case Kekule.BondStereo.TRANS: return {'value': 'T'};
			//case Kekule.BondStereo.NONE: return null;
			default:
				return {'value': null};
		}
	},

	/**
	 * Turn a CML role value of reactant, product or substance to a Kekule one in {@link Kekule.ReactionRole}.
	 * If it is not a standard Kekule role, returns the origin value.
	 * @param {String} cmlRole
	 * @returns {String}
	 */
	reagentRoleToKekule: function(cmlRole)
	{
		var R = Kekule.ReactionRole;
		switch (cmlRole)
		{
			case 'reagent': return R.REAGENT;
			case 'catalyst': return R.CATALYST;
			case 'solvent': return R.CATALYST;
			default: return cmlRole;
		}
	},
	/**
	 * Turn a Kekule role value of reactant, product or substance to a CML one.
	 * If it is not a standard CML role, returns the origin value.
	 * @param {String} kekuleRole
	 * @returns {String}
	 */
	kekuleReagentRoleToCml: function(kekuleRole)
	{
		var R = Kekule.ReactionRole;
		switch (kekuleRole)
		{
			case R.REAGENT: return 'reagent';
			case R.CATALYST: return 'catalyst';
			case R.SOLVENT: return 'solvent';
			default: return kekuleRole;
		}
	},

	/**
	 * Check if an element type is standing for a dummy atom.
	 * @param {String} value
	 * @returns {Bool}
	 */
	isDummyElementType: function(value)
	{
		return ((value == 'Du') || (value == 'Dummy'));
	},
	/**
	 * Check if an element type is standing for a RGroup.
	 * @param {String} value
	 * @returns {Bool}
	 */
	isRGroupElementType: function(value)
	{
		return (value == 'R');
	},

	/**
	 * Check if an element type is standing for an atom list.
	 * NOTE: atom list is not native CML concept, just borrowed from MDL.
	 * @param {String} value
	 * @returns {Bool}
	 */
	isAtomListElementType: function(value)
	{
		return (value == 'L');
	},
	/**
	 * Get element symbol (used as elementType in CML) of a {@link Kekule.ChemStructureNode}.
	 * @param {Kekule.ChemStructureNode} node
	 * @return {String}
	 */
	getNodeElementType: function(node)
	{
		if (node instanceof Kekule.Atom)
			return node.getSymbol();
		else if (node instanceof Kekule.Pseudoatom)
		{
			//console.log(node);
			switch (node.getAtomType())
			{
				case Kekule.PseudoatomType.DUMMY: return 'Du';
				case Kekule.PseudoatomType.ANY: return 'A';
				case Kekule.PseudoatomType.HETERO: return 'Q';
				case Kekule.PseudoatomType.CUSTOM:
				default:
					{
						return node.getSymbol();
					}
			}
		}
		else if (node instanceof Kekule.VariableAtom)
			return 'R';  // 'L'; CML standard has no L
		else if (node instanceof Kekule.StructureFragment)
			return 'R';
		else if (node.getSymbol)
		{
			return node.getSymbol();
		}
		else
			return '*';  // do not know what's the proper symbol
	},

	/**
	 * Create a proper structure node by elementType of CML.
	 * @param {String} id
	 * @param {String} elemType
	 * @param {Number} massNumber Can be null.
	 * @returns {Kekule.ChemStructureNode}
	 */
	createNodeByCmdElementType: function(id, elemType, massNumber)
	{
		var result;
		if (Kekule.IO.CmlUtils.isDummyElementType(elemType))
				result = new Kekule.Pseudoatom(id, Kekule.PseudoatomType.DUMMY);
		else if (Kekule.IO.CmlUtils.isRGroupElementType(elemType))
			result = new Kekule.RGroup(id);
		else if (Kekule.IO.CmlUtils.isAtomListElementType(elemType))
			result = new Kekule.VariableAtom(id);
		else if (Kekule.Element.isElementSymbolAvailable(elemType)
			|| (elemType == Kekule.Element.UNSET_ELEMENT)) // a normal atom or unset element
		{
			// in CML, an isotope attribute can be a mass number or a accurate mass, so round it
			// here to get a integer mass number
			//var massNumber = attribs.isotope? Math.round(attribs.isotope): null;
			result = new Kekule.Atom(id, elemType, Math.round(massNumber));
		}
		else  // elemType not a real symbol symbol, create a pseudo atom
		{
			result = new Kekule.Pseudoatom(id, Kekule.PseudoatomType.CUSTOM, elemType);
		}
		return result;
	}
};
var CmlUtils = Kekule.IO.CmlUtils;

/**
 * A help class to do some DOM work on CML
 * @class
 */
Kekule.IO.CmlDomUtils = {
	/**
	 * Split a CML array string to a JavaScript array
	 * @param {Object} value
	 * @returns {Array}
	 */
	splitCmlArrayValue: function(value)
	{
		if ((typeof(value) == 'object') && (value.length))  // already an array
			return value;
		var s = Kekule.StrUtils.normalizeSpace(Kekule.StrUtils.trim(value));
		return s.split(Kekule.IO.CML.ARRAY_VALUE_DELIMITER);
	},
	/**
	 * Merge an array to a CML array string.
	 * @param {Array} arrayObj
	 * @returns {String}
	 */
	mergeToCmlArrayValue: function(arrayObj)
	{
		return arrayObj.join(' ');
	},
	/**
	 * Split a CML formula concise value to an array.
	 *   For example, 'S 1 O 4 -2' will be transformed to:
	 *   {'isotopes': [{'elementType': 'S', 'count': 1}, {'elementType': 'O', 'count': 4}], 'formalCharge': -2}
	 * @param {String} value
	 * @returns {Hash}
	 */
	analysisCmlFormulaConciseValue: function(value)
	{
		var tokens = Kekule.IO.CmlDomUtils.splitCmlArrayValue(value);
		var i = 0;
		var l = tokens.length;
		var isotopes = [];
		var currIsotope = null;
		var formalCharge;
		while (i < l)
		{
			var token = tokens[i];
			var count = parseFloat(token);
			if (count != count)  // count is NaN, so token is really not a number, first one of pair, should be a symbol
			{
				if (currIsotope)
					isotopes.push(currIsotope);
				currIsotope = {'elementType': token};
			}
			else if (currIsotope)  // second of pair, should be the count
			{
				currIsotope.count = count;
				isotopes.push(currIsotope);
				currIsotope = null;
			}
			else if (i == l - 1) // should be the last formal charge
				formalCharge = count;
			++i;
		}
		return {'isotopes': isotopes, 'formalCharge': formalCharge};
	},
	/**
	 * Get information of CML element with builtin attribute.
	 * @param {Object} elem
	 * @param {String} namespaceURI
	 * @param {Kekule.DomHelper} domHelper
	 * @returns {Hash} {name, value} while name is the builtin attribute and value is the content of element.
	 * @private
	 */
	getCmlBuiltinElemInfo: function(elem, namespaceURI, domHelper)
	{
		var propName = elem.getAttribute('builtin');
		if ((!propName) && namespaceURI)
		{
			if (elem.getAttributeNS)
				propName = elem.getAttributeNS(namespaceURI, 'builtin');
			else if (domHelper)
				propName = domHelper.getAttributeNS(namespaceURI, 'builtin', elem);
		}
		if (propName)
		{
			var propValue = Kekule.DomUtils.getElementText(elem);
			return {'name': propName, 'value': propValue};
		}
		else
			return null;
	},
	/**
	 * Read element of <string>, <integer> and <float>
	 * @param {Object} elem
	 * @param {String} namespaceURI
	 * @param {Kekule.DomHelper} domHelper
	 * @returns {Hash} {name, value}
	 * @private
	 */
	readCmlTypedPropertyElem: function(elem, namespaceURI, domHelper)
	{
		var propName;
		propName = elem.getAttribute('builtin');
		if ((!propName) && namespaceURI)
		{
			if (elem.getAttributeNS)
				propName = elem.getAttributeNS(namespaceURI, 'builtin');
			else if (domHelper)
				propName = domHelper.getAttributeNS(namespaceURI, 'builtin', elem);
		}

		if (propName)
		{
			var propValue = Kekule.DomUtils.getElementText(elem);
			switch (Kekule.DomUtils.getLocalName(elem))
			{
				case 'float':
					propValue = parseFloat(propValue);
					break;
				case 'integer':
					propValue = parseInt(propValue);
					break;
				default:
					; // string
			}
			return {'name': propName, 'value': propValue};
		}
		else
			return null;
	},
	/**
	 * Read element of <stringArray>, <integerArray> and <floatArray>
	 * @param {Object} elem
	 * @param {String} namespaceURI
	 * @param {Kekule.DomHelper} domHelper
	 * @returns {Hash} {name, values: [values]}
	 * @private
	 */
	readCmlTypedPropertyArrayElem: function(elem, namespaceURI, domHelper)
	{
		var propName;
		propName = elem.getAttribute('builtin');
		if ((!propName) && namespaceURI)
		{
			if (elem.getAttributeNS)
				propName = elem.getAttributeNS(namespaceURI, 'builtin');
			else if (domHelper)
				propName = domHelper.getAttributeNS(namespaceURI, 'builtin', elem);
		}

		if (propName)
		{
			var propValue = Kekule.DomUtils.getElementText(elem);
			var values = Kekule.IO.CmlDomUtils.splitCmlArrayValue(propValue);
			switch (Kekule.DomUtils.getLocalName(elem))
			{
				case 'float':
					for (var i = 0, l = values.length; i < l; ++i)
						values[i] = parseFloat(values[i]);
					break;
				case 'integer':
					for (var i = 0, l = values.length; i < l; ++i)
						values[i] = parseInt(values[i]);
					break;
				default:
					; // string
			}
			return {'name': propName, 'values': values};
		}
		else
			return null;
	},

	/**
	 * Check if an element has direct <string><integer> or <float> children
	 * @param {Object} elem
	 * @param {String} namespaceURI
	 * @returns {Bool}
	 */
	hasDirectCmlTypedElemChildren: function(elem, namespaceURI)
	{
		for (var i = 0, l = Kekule.IO.CML.TYPED_ELEM_NAMES.length; i < l; ++i)
		{
			var localName = Kekule.IO.CML.TYPED_ELEM_NAMES[i];
			var children = Kekule.DomUtils.getDirectChildElems(elem, null, localName, namespaceURI);
			if (children.length > 0)
				return true;
		}
		return false;
	},

	/**
	 * Check if an element has direct <stringArray>, <integerArray> or <floatArray> children
	 * @param {Object} elem
	 * @param {String} namespaceURI
	 * @returns {Bool}
	 */
	hasDirectCmlTypedArrayElemChildren: function(elem, namespaceURI)
	{
		for (var i = 0, l = Kekule.IO.CML.TYPED_ARRAY_ELEM_NAMES.length; i < l; ++i)
		{
			var localName = Kekule.IO.CML.TYPED_ARRAY_ELEM_NAMES[i];
			var children = Kekule.DomUtils.getDirectChildElems(elem, null, localName, namespaceURI);
			if (children.length > 0)
				return true;
		}
		return false;
	},

	/**
	 * Check if an element is <string><integer> or <float>
	 * @param {Object} elem
	 * @param {String} namespaceURI Can be null.
	 * @returns {Bool}
	 */
	isCmlTypedElem: function(elem, namespaceURI)
	{
		var result = (Kekule.IO.CML.TYPED_ELEM_NAMES.indexOf(Kekule.DomUtils.getLocalName(elem)) >= 0);
		if (namespaceURI)
			result = result && (elem.namespaceURI == namespaceURI);
		return result;
	},
	/**
	 * Check if an element is <stringArray>, <integerArray> or <floatArray>
	 * @param {Object} elem
	 * @param {String} namespaceURI Can be null.
	 * @returns {Bool}
	 */
	isCmlTypedArrayElem: function(elem, namespaceURI)
	{
		var result = (Kekule.IO.CML.TYPED_ARRAY_ELEM_NAMES.indexOf(Kekule.DomUtils.getLocalName(elem)) >= 0);
		if (namespaceURI)
			result = result && (elem.namespaceURI == namespaceURI);
		return result;
	},
	/**
	 * Check if an element has builtin attribute.
	 * @param {Object} elem
	 * @param {String} namespaceURI Can be null.
	 * @returns {Bool}
	 */
	isCmlBuiltInMarkedElem: function(elem, namespaceURI)
	{
		var result = Kekule.DomUtils.hasAttribute(elem, 'builtin');
		if (namespaceURI && result)
			result = elem.namespaceURI === namespaceURI;
		return result;
	},

	FILTER_TYPED_ELEM: 1,
	FILTER_TYPEDARRAY_ELEM: 2,
	FILTER_ALL: 3,
	/**
	 * Get child typed element with specified builtinName.
	 * @param {Object} parent
	 * @param {String} builtinName
	 * @param {Int} filter
	 * @returns {Object} Element found or null.
	 */
	getCmlTypedElem: function(parent, builtinName, filter)
	{
		var nsURI = parent.namespaceURI;
		var elems = Kekule.DomUtils.getDirectChildElemsOfAttribValues(parent, [{'builtin': builtinName}], null, null, nsURI);
		if (elems && (elems.length > 0))
		{
			for (var i = elems.length - 1; i >= 0; --i)
			{
				if ((filter & Kekule.IO.CmlDomUtils.FILTER_TYPED_ELEM) && Kekule.IO.CmlDomUtils.isCmlTypedElem(elems[i], nsURI))
					return elems[i];
				else if ((filter & Kekule.IO.CmlDomUtils.FILTER_TYPEDARRAY_ELEM) && Kekule.IO.CmlDomUtils.isCmlTypedArrayElem(elems[i], nsURI))
					return elems[i];
			}
		}
		return null;
	},
	/**
	 * Get all child typed elements with specified builtinName.
	 * @param {Object} parent
	 * @param {String} builtinName
	 * @param {Int} filter
	 * @returns {Array} Elements found or null.
	 */
	getCmlTypedElems: function(parent, builtinName, filter)
	{
		var result = [];
		var nsURI = parent.namespaceURI;
		var elems = Kekule.DomUtils.getDirectChildElemsOfAttribValues(parent, [{'builtin': builtinName}], null, null, nsURI);
		if (elems && (elems.length > 0))
		{
			for (var i = elems.length - 1; i >= 0; --i)
			{
				if ((filter & Kekule.IO.CmlDomUtils.FILTER_TYPED_ELEM) && Kekule.IO.CmlDomUtils.isCmlTypedElem(elems[i], nsURI))
					result.push(elems[i]);
				else if ((filter & Kekule.IO.CmlDomUtils.FILTER_TYPEDARRAY_ELEM) && Kekule.IO.CmlDomUtils.isCmlTypedArrayElem(elems[i], nsURI))
					result.push(elems[i]);
			}
		}
		return result.length? result: null;
	},
	/**
	 * Get value of child typed element with specified builtinName.
	 * @param {Object} parent
	 * @param {String} builtinName
	 * @param {Int} filter
	 * @returns {Variant} Value found or null.
	 */
	getCmlTypedElemValue: function(parent, builtinName, filter, domHelper)
	{
		if (!filter)
			filter = Kekule.IO.CmlDomUtils.FILTER_ALL;
		var elem = Kekule.IO.CmlDomUtils.getCmlTypedElem(parent, builtinName, filter);
		if (elem)
			//return Kekule.IO.CmlDomUtils.readCmlTypedPropertyElem(elem, parent.namespaceURI, domHelper);
			return Kekule.DomUtils.getElementText(elem);
	},
	/**
	 * Get value of child typed elements (maybe multiple) with specified builtinName.
	 * @param {Object} parent
	 * @param {String} builtinName
	 * @param {Int} filter
	 * @returns {Variant} Value found (array) or null.
	 */
	getMultipleCmlTypedElemValues: function(parent, builtinName, filter, domHelper)
	{
		if (!filter)
			filter = Kekule.IO.CmlDomUtils.FILTER_ALL;
		var elems = Kekule.IO.CmlDomUtils.getCmlTypedElems(parent, builtinName, filter);
		if (elems)
		{
			var result = [];
			//return Kekule.IO.CmlDomUtils.readCmlTypedPropertyElem(elem, parent.namespaceURI, domHelper);
			for (var i = 0, l = elems.length; i < l; ++i)
			{
				result.push(Kekule.DomUtils.getElementText(elems[i]));
			}
			return result;
		}
		else
			return null;
	},
	/**
	 * Get attribute value of elem. If attribName not found in elem's attributes,
	 *   this method will automatically check child <string>, <float> or <integer> elements.
	 * @param {Object} elem
	 * @param {String} attribName
	 * @param {Int} filter
	 * @returns {Variant} Value of attribute.
	 */
	getCmlElemAttribute: function(elem, attribName, filter, domHelper)
	{
		if (!filter)
			filter = Kekule.IO.CmlDomUtils.FILTER_ALL;
		var result = Kekule.DomUtils.getSameNSAttributeValue(elem, attribName, domHelper);
		//if ((result === null) || (result === undefined))  // attrib not found, check child typed elements
		if (!result)   // attrib not found, check child typed elements
		{
			result = Kekule.IO.CmlDomUtils.getCmlTypedElemValue(elem, attribName, filter, domHelper);
		}
		return result;
	},
	/**
	 * Get attribute values of (may) multiple elem. If attribName not found in elem's attributes,
	 *   this method will automatically check child <string>, <float> or <integer> elements.
	 * @param {Object} elem
	 * @param {String} attribName
	 * @param {Int} filter
	 * @returns {Variant} Value of attribute.
	 */
	getMultipleCmlElemAttribute: function(elem, attribName, filter, domHelper)
	{
		if (!filter)
			filter = Kekule.IO.CmlDomUtils.FILTER_ALL;
		var result = Kekule.DomUtils.getSameNSAttributeValue(elem, attribName, domHelper);
		//if ((result === null) || (result === undefined))  // attrib not found, check child typed elements
		if (!result)
		{
			result = Kekule.IO.CmlDomUtils.getMultipleCmlTypedElemValues(elem, attribName, filter, domHelper);
		}
		return result;
	},
	setCmlElemAttribute: function(elem, attribName, value, domHelper)
	{
		return Kekule.DomUtils.setSameNSAttributeValue(elem, attribName, value, domHelper);
	},

	/**
	 * Fetch all attribute values of CML element into an JSON object, including typed or typed array child elements.
	 * @param {Object} elem
	 * @param {Int} filter
	 * @param {Bool} mergeSameNameTypedElem If multiple child typed elements has same builtin, whether merge their values
	 * @param {Kekule.DomHelper} domHelper
	 * @returns {Hash} Each item is a hash: {name: value}.
	 */
	fetchCmlElemAttributeValuesToJson: function(elem, filter, mergeSameNameTypedElem, domHelper)
	{
		if (!filter)
			filter = Kekule.IO.CmlDomUtils.FILTER_ALL;
		var nsURI = elem.namespaceURI;
		// get all attributes first
		var result = Kekule.DomUtils.fetchAttributeValuesToJson(elem, nsURI, true);
		// then check child elements
		var childElems = Kekule.DomUtils.getDirectChildElems(elem, null, null, nsURI);
		for (var i = 0, l = childElems.length; i < l; ++i)
		{
			var childElem = childElems[i];
			if ((filter & Kekule.IO.CmlDomUtils.FILTER_TYPED_ELEM)
					&& (Kekule.IO.CmlDomUtils.isCmlTypedElem(childElem, nsURI) || Kekule.IO.CmlDomUtils.isCmlBuiltInMarkedElem(childElem, nsURI)))
			{
				var obj = Kekule.IO.CmlDomUtils.readCmlTypedPropertyElem(childElem, nsURI, domHelper);
				if (obj)
				{
					if (result[obj.name] && mergeSameNameTypedElem) // multiple elements with same builtin name, merge values
						result[obj.name] += Kekule.IO.CML.ARRAY_VALUE_DELIMITER + obj.value;
					else
						result[obj.name] = obj.value;
				}
			}
			else if ((filter & Kekule.IO.CmlDomUtils.FILTER_TYPEDARRAY_ELEM) && Kekule.IO.CmlDomUtils.isCmlTypedArrayElem(childElem, nsURI))
			{
				var obj = Kekule.IO.CmlDomUtils.getCmlBuiltinElemInfo(childElem, nsURI, domHelper);
				if (obj)
				{
					if (result[obj.name] && mergeSameNameTypedElem) // multiple elements with same builtin name, merge values
						result[obj.name] += Kekule.IO.CML.ARRAY_VALUE_DELIMITER + obj.value;
					else
						result[obj.name] = obj.value;
				}
			}
		}
		return result;
	},

	/**
	 * Check is element is <scalar>
	 * @param {Object} elem
	 * @param {String} namespaceURI Can be null.
	 * @returns {Bool}
	 */
	isScalarElem: function(elem, namespaceURI)
	{
		var result = (Kekule.DomUtils.getLocalName(elem) == 'scalar');
		if (namespaceURI)
			result = result && (elem.namespaceURI == namespaceURI);
		return result;
		//return ((elem.localName == 'scalar') && this.matchCoreNamespace(elem));
	},

	/**
	 * Get Id of CML element
	 * @param {Object} elem
	 * @returns {String}
	 */
	getCmlId: function(elem, domHelper)
	{
		return Kekule.IO.CmlDomUtils.getCmlElemAttribute(elem, 'id', Kekule.IO.CmlDomUtils.FILTER_TYPED_ELEM, domHelper);
	},
	/**
	 * Get Id attribute of CML element
	 * @param {String} id
	 * @param {Object} elem
	 */
	setCmlId: function(elem, id, domHelper)
	{
		return Kekule.IO.CmlDomUtils.setCmlElemAttribute(elem, 'id', id, domHelper);
	},
	/**
	 * Get title of CML element
	 * @param {Object} elem
	 * @returns {String}
	 */
	getCmlTitle: function(elem, domHelper)
	{
		return Kekule.IO.CmlDomUtils.getCmlElemAttribute(elem, 'title', Kekule.IO.CmlDomUtils.FILTER_TYPED_ELEM, domHelper);
	},
	/**
	 * Set title attribute of CML element
	 * @param {Object} elem
	 * @returns {String}
	 */
	setCmlTitle: function(elem, title, domHelper)
	{
		return Kekule.IO.CmlDomUtils.setCmlElemAttribute(elem, 'title', title, domHelper);
	}
};

var CmlDomUtils = Kekule.IO.CmlDomUtils;

/**
 * A manager to create suitable element reader for CML document.
 * @class
 */
Kekule.IO.CmlElementReaderFactory = {
	/** @private */
	_readers: {},
	/**
	 * Register new reader class.
	 * @param {Variant} elemLocalName Local name or array of names.
	 * @param {Object} readerClass Class of reader.
	 */
	register: function(elemLocalName, readerClass)
	{
		if (Kekule.ArrayUtils.isArray(elemLocalName))
		{
			for (var i = 0, l = elemLocalName.length; i < l; ++i)
				Kekule.IO.CmlElementReaderFactory.register(elemLocalName[i], readerClass);
		}
		else
			Kekule.IO.CmlElementReaderFactory._readers[elemLocalName.toLowerCase()] = readerClass;
	},
	/**
	 * Returns suitable reader for an CML element.
	 * @param {Variant} elemOrLocalName Element (Object) or element's local name (String).
	 * @returns {Kekule.IO.CmlElementReader}
	 */
	getReader: function(elemOrLocalName)
	{
		var name;
		if (typeof(elemOrLocalName) != 'string')
			name = Kekule.DomUtils.getLocalName(elemOrLocalName);
		else
			name = elemOrLocalName;
		var readerClass = Kekule.IO.CmlElementReaderFactory._readers[name.toLowerCase()];
		if (readerClass)
			return new readerClass();
		else
			return null;
	}
};

/**
 * A manager to create suitable element writer for CML document.
 * @class
 */
Kekule.IO.CmlElementWriterFactory = {
	/** @private */
	_writers: {},
	/**
	 * Register new writer class.
	 * @param {Variant} objTypeName Class name or type name or name array of source object.
	 * @param {Object} writerClass Class of writer.
	 */
	register: function(objTypeName, writerClass)
	{
		if (Kekule.ArrayUtils.isArray(objTypeName))
		{
			for (var i = 0, l = objTypeName.length; i < l; ++i)
				Kekule.IO.CmlElementWriterFactory.register(objTypeName[i], writerClass);
		}
		else
			Kekule.IO.CmlElementWriterFactory._writers[objTypeName] = writerClass;
	},
	/**
	 * Returns suitable writer.
	 * @param {Variant} objOrTypeName Object or object's type name.
	 * @returns {Kekule.IO.CmlElementWriter}
	 */
	getWriter: function(objOrTypeName)
	{
		var name;
		if (typeof(objOrTypeName) != 'string')
			name = DataType.getType(objOrTypeName);
		else
			name = objOrTypeName;
		var writerClass = Kekule.IO.CmlElementWriterFactory._writers[name];
		if ((!writerClass) && (objOrTypeName.getClassName))  // not found, check if obj is instance of type
		{
			var obj = objOrTypeName;
			var typeNames = Kekule.ObjUtils.getOwnedFieldNames(Kekule.IO.CmlElementWriterFactory._writers);
			for (var i = typeNames.length - 1; i >= 0; --i)  // the later the superior
			{
				var objClass = ClassEx.findClass(typeNames[i]);
				//if (obj instanceof eval(typeNames[i]))
				if (objClass && (obj instanceof objClass))
				{
					writerClass = Kekule.IO.CmlElementWriterFactory._writers[typeNames[i]];
					break;
				}
			}
		}
		if (writerClass)
			return new writerClass();
		else
			return null;
	}
};

/**
 * Base class for classes to read or write CML element.
 * @class
 * @augments ObjectEx
 *
 * @property {String} coreNamespaceURI Namespace URI of CML core.
 * @property {Array} namespaces Namespaces used in a CML document. Each item is has fields {prefix, namespaceURI}.
 */
Kekule.IO.CmlElementHandler = Class.create(ObjectEx,
/** @lends Kekule.IO.CmlElementHandler# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlElementHandler',
	/** @constructs */
	initialize: function()
	{
		this.tryApplySuper('initialize');
		this._childHandlers = [];  // a private field to storing all involved child readers
	},
	/** @ignore */
	doFinalize: function()
	{
		for (var i = this._childHandlers.length - 1; i >= 0; --i)
		{
			var childHandler = this._childHandlers[i];
			if (childHandler && childHandler.finalize)
				childHandler.finalize();
		}
		this.tryApplySuper('doFinalize');
	},
	/** @private */
	initProperties: function()
	{
		// a private property
		this.defineProp('domHelper', {
			'dataType': 'Kekule.DomHelper',
			'serializable': false,
			'getter': function()
				{
					if (!this.getPropStoreFieldValue('domHelper'))
						this.setPropStoreFieldValue('domHelper', new Kekule.DomHelper());
					return this.getPropStoreFieldValue('domHelper');
				}
		});

		this.defineProp('coreNamespaceURI', {
			'dataType': DataType.STRING, 'serializable': false
			// temp
			//'getter': function() { return Kekule.IO.CML.CML2CORE_NAMESPACE_URI; },
			//'setter': function() {}
		});
		this.defineProp('namespaces', {
			'dataType': DataType.ARRAY, 'serializable': false
		});
		/*
		this.defineProp('reactionNamespaceURI', {
			'dataType': DataType.STRING, 'serializable': false,
			// temp
			'getter': function() { return Kekule.IO.CML.CML2CORE_NAMESPACE_URI; },
			'setter': function() {}
		});
		*/
		// private, storing the root object (CmlReader/CmlWriter) that starting the read/write job
		this.defineProp('rootEvoker', {
			'dataType': DataType.Object, 'serializable': false
		});
	},

	/**
	 * Returns the defined prefix for a namespace URI.
	 * @param {String} uri
	 * @return {String} If prefix not found, undefined will be returned.
	 * @private
	 */
	getPrefixForNamespaceUri: function(uri)
	{
		var namespaces = this.getNamespaces();
		if (namespaces)
		{
			for (var i = 0, l = namespaces.length; i < l; ++i)
			{
				if (namespaces[i].namespaceURI === uri)
					return namespaces[i].prefix;
			}
		}
		return void(0);
	},

	/** @private */
	matchCoreNamespace: function(nodeOrNsURI)
	{
		var nsURI;
		if (!nodeOrNsURI)
			nsURI = '';
		else if (typeof(nodeOrNsURI) != 'string')
			nsURI = nodeOrNsURI.namespaceURI;
		else
			nsURI = nodeOrNsURI;
		return ((!this.getCoreNamespaceURI()) && (!nsURI)
			|| (this.getCoreNamespaceURI() && (this.getCoreNamespaceURI() == nsURI)));
	},
	/**
	 * Copy domHelper and coreNamespaceURI to child reader or writer.
	 * @param {Object} childHandler
	 * @private
	 */
	copySettingsToChildHandler: function(childHandler)
	{
		childHandler.setDomHelper(this.getDomHelper());
		childHandler.setCoreNamespaceURI(this.getCoreNamespaceURI());
		childHandler.setNamespaces(this.getNamespaces());
		childHandler.setRootEvoker(this.getRootEvoker());
	},
	/** @private */
	_appendChildHandler: function(handler)
	{
		Kekule.ArrayUtils.pushUnique(this._childHandlers, handler);
	},
	/**
	 * Call function to all child handlers.
	 * The function has param (handler).
	 * @param {Func} func
	 * @param {Object} thisArg
	 * @param {Bool} cascade If true, the children of child handlers will also be iterated.
	 * @private
	 */
	_iterateChildHandlers: function(func, thisArg, cascade)
	{
		if (func)
		{
			for (var i = 0, l = this._childHandlers.length; i < l; ++i)
			{
				var handler = this._childHandlers[i];
				if (handler)
				{
					func.apply(thisArg, [handler]);
					if (cascade && handler._iterateChildHandlers)
						handler._iterateChildHandlers(func, thisArg, cascade);
				}
			}
		}
	}
});

/**
 * Base class of readers to read different CML elements.
 * @class
 * @augments Kekule.IO.CmlElementHandler
 */
Kekule.IO.CmlElementReader = Class.create(Kekule.IO.CmlElementHandler,
/** @lends Kekule.IO.CmlElementReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlElementReader',

	/**
	 * Read an element in CML document and returns a proper Kekule object for parent reader or insert something into parentObj (if parentObj is set).
	 * @param {Object} elem
	 * @param {Kekule.ChemObject} parentObj
	 * @param {Kekule.IO.CmdElementReader} parentReader
	 * @param {Hash} options
	 * @returns {Variant}
	 */
	readElement: function(elem, parentObj, parentReader, options)
	{
		//console.log('read element', this.getClassName(), parentReader && parentReader.getClassName(), options);
		var result = this.doReadElement(elem, parentObj, parentReader, options);
		if (result && result.getId && (!result.getId()))
		{
			if (result.setId)
			{
				var id = Kekule.IO.CmlDomUtils.getCmlId(elem, this.getDomHelper);
				if (id)
				{
					//result.setId(id);
					this.setObjId(result, id);
				}
			}
		}
		return result;
	},
	/**
	 * Method to do the actual readElement job. Descendants should override this method.
	 * @param {Object} elem
	 * @param {Object} parentObj
	 * @param {Kekule.IO.CmdElementReader} parentReader
	 * @param {Hash} options
	 * @returns {Variant}
	 * @private
	 */
	doReadElement: function(elem, parentObj, parentReader, options)
	{
		// do nothing here
	},

	/**
	 * Read and handle child elements,
	 * @param {Object} elem
	 * @param {Object} parentObj
	 * @param {Kekule.IO.CmdElementReader} parentReader
	 * @returns {Variant}
	 */
	readChildElement: function(elem, parentObj, parentReader)
	{
		return this.doReadChildElement(elem, parentObj, parentReader);
	},
	/**
	 * The real job of readChildElem is done here. Descendants may override this.
	 * @param {Object} elem
	 * @param {Object} parentObj
	 * @param {Kekule.IO.CmdElementReader} parentReader
	 * @returns {Variant}
	 * @private
	 */
	doReadChildElement: function(elem, parentObj, parentReader)
	{
		return this.doReadChildElementDef(elem, parentObj, parentReader);
	},

	/**
	 * A default method to read child elements,
	 *   just ask CmlElementReaderFactory to create a suitable reader and use the reader to read.
	 * @param {Object} elem
	 * @param {Object} parentObj
	 * @param {Kekule.IO.CmdElementReader} parentReader
	 * @returns {Variant}
	 */
	readChildElementDef: function(elem, parentObj, parentReader)
	{
		return this.doReadChildElementDef(elem, parentObj, parentReader);
	},
	/**
	 * The real job of readChildElementDef is done here. Descendants may override this.
	 * @param {Object} elem
	 * @param {Object} parentObj
	 * @param {Kekule.IO.CmdElementReader} parentReader
	 * @returns {Variant}
	 * @private
	 */
	doReadChildElementDef: function(elem, parentObj, parentReader)
	{
		var reader = this.doGetChildElementReader(elem, parentObj, parentReader); //Kekule.IO.CmlElementReaderFactory.getReader(elem);
		if (reader)
		{
			try
			{
				//reader.setCoreNamespaceURI(this.getCoreNamespaceURI());
				//this.copySettingsToChildHandler(reader);
				var result = reader.readElement(elem, parentObj, parentReader);
				return result;
			}
			finally
			{
				//reader.finalize();  child readers will be released at the finalize method of parent reader
			}
		}
		else
			return null;
	},
	/**
	 * Get a reader instance to read CML data from child element.
	 * Descendants may override this method to returns customized reader.
	 * @param {Element} elem
	 * @param {Object} parentObj
	 * @param {Kekule.IO.CmdElementReader} parentReader
	 * @returns {Kekule.CmlElementReader}
	 * @private
	 */
	doGetChildElementReader: function(element, parentObj, parentReader)
	{
		var result = Kekule.IO.CmlElementReaderFactory.getReader(element);
		if (result)
		{
			this.copySettingsToChildHandler(result);
			this._appendChildHandler(result);
		}
		return result;
	},
	/**
	 * Iterate through and read all direct children of elem.
	 * @param {Object} elem
	 * @param {Object} parentObj
	 * @param {Kekule.IO.CmdElementReader} parentReader
	 * @param {Func} callback An optional callback function evoked when a child element is iterated and returned with a result.
	 *   The function has arguments (childElem, childResult, parentObj, parentReader).
	 * @private
	 */
	iterateChildElements: function(elem, parentObj, parentReader, callback)
	{
		var result = [];
		var children = Kekule.DomUtils.getDirectChildElems(elem, null, null, this.getCoreNamespaceURI());
		for (var i = 0, l = children.length; i < l; ++i)
		{
			var subResult = this.readChildElement(children[i], parentObj, parentReader);
			if (subResult)
			{
				result.push({'element': children[i], 'result': subResult});
				if (callback)
					callback(children[i], subResult, parentObj, parentReader);
			}
		}
		return result;
	},

	/**
	 * Called after the whole CML document is read and the corresponding chem objects are built.
	 * @param {Bool} cascade Whether calling the doneReadingDocument method of child readers.
	 * @private
	 */
	doneReadingDocument: function(cascade)
	{
		this.doDoneReadingDocument();
		if (cascade)
		{
			this._iterateChildHandlers(function(handler){
				if (handler && handler.doneReadingDocument)
					handler.doneReadingDocument(cascade);
			});
		}
	},
	/**
	 * Do the actual work of doneReadingDocument method.
	 * Descendants may override this method.
	 * @private
	 */
	doDoneReadingDocument: function()
	{
		// do nothing here
	},
	/**
	 * From all objects loaded by the root reader, returns the one with id.
	 * This method should be called in doneReadingDocument method,
	 * when all the objects in CML document are loaded.
	 * @param {String} id
	 * @returns {Object}
	 * @private
	 */
	getLoadedObjById: function(id)
	{
		var root = this.getRootEvoker();
		return root && root.getLoadedObjById && root.getLoadedObjById(id);
	},
	/**
	 * Add an id-obj pair to the map of root reader.
	 * @param {String} id
	 * @param {Object} obj
	 * @private
	 */
	setObjIdMapValue: function(id, obj)
	{
		var root = this.getRootEvoker();
		if (root.setObjIdMapValue)
			root.setObjIdMapValue(id, obj);
	},
	/** @private */
	setObjId: function(obj, id)
	{
		if (obj.setId)
			obj.setId(id);
		var newId = obj.getId && obj.getId();
		if (newId)
			this.setObjIdMapValue(newId, obj);
	},
	/**
	 * Create a parent object to hold all childObjs inside it.
	 * @param {Array} childObjs
	 * @param {Class} wrapperClass
	 * @returns {Object}
	 * @private
	 */
	_createChildObjsHolder: function(childObjs, wrapperClass)
	{
		var result = new wrapperClass();
		for (var i = 0, l = childObjs.length; i < l; ++i)
		{
			result.appendChild(childObjs[i]);
		}
		return result;
	}
});

/**
 * Base class of readers to read different CML elements.
 * @class
 * @augments Kekule.IO.CmlElementHandler
 */
Kekule.IO.CmlElementWriter = Class.create(Kekule.IO.CmlElementHandler,
/** @lends Kekule.IO.CmlElementWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlElementWriter',
	/**
	 * Write Kekule obj to a new CML element in doc or insert new attributes to parentElem.
	 * @param {Kekule.ChemObject} obj
	 * @param {Object} parentElem
	 * @param {Hash} options
	 * @returns {Object} Element created.
	 */
	writeObject: function(obj, parentElem, options)
	{
		if (!(parentElem) && (!doc))
		{
			Kekule.error(/*Kekule.ErrorMsg.CML_CAN_NOT_OUTPUT_TO_EMPTY_ELEMENT*/Kekule.$L('ErrorMsg.CML_CAN_NOT_OUTPUT_TO_EMPTY_ELEMENT'));
			return null;
		}
		/*
		if ((!parentElem) && doc)
			parentElem = doc.documentElement;
		else if (!doc)
			doc = parentElem.ownerDocument;
		*/
		var doc = parentElem.ownerDocument;
		if (this.getDomHelper().getDocument != doc)
			this.getDomHelper().setDocument(doc);
		var targetElem = this.doCreateElem(obj, parentElem, doc);
		if (targetElem)
			parentElem.appendChild(targetElem);
		else // if no need to create child element, write directly on parentElem
 			targetElem = parentElem;
		var result = this.doWriteObject(obj, targetElem, options) || targetElem;
		if (result && obj)
		{
			// id
			this.writeObjId(obj, result);
			// scalar & info
			this.writeObjAdditionalInfo(obj, result, options);
		}

		return result;
	},
	writeObjId: function(obj, elem)
	{
		if (obj.getId)
		{
			var id = obj.getId();
			if (!id && obj.setId)  // force create an id, for the possible ref for other objects
			{
				id = this.autoIdentifyForObj(obj);
			}
			Kekule.IO.CmlDomUtils.setCmlId(elem, id, this.getDomHelper());
		}
	},

	/**
	 * Gives obj an auto id if its id is not explicit set.
	 * @private
	 */
	autoIdentifyForObj: function(obj)
	{
		if (obj.getId && !obj.getId())
		{
			if (obj.setId)
			{
				if (obj.getOwner && obj.getOwner() && obj.getOwner().getAutoId)  // use owner's auto id function
					obj.setId(obj.getOwner().getAutoId(obj));
				else
					obj.setId(this.getAutoIdForObj(obj));
			}
		}
		return obj.getId && obj.getId();
	},
	/**
	 * A very simple way to generate UID for object.
	 * @returns {String}
	 * @private
	 */
	getAutoIdForObj: function(obj)
	{
		var prefix = obj.getAutoIdPrefix? obj.getAutoIdPrefix(): 'obj';
		if (!Kekule.IO.CmlElementWriter._UID_SEED)
			Kekule.IO.CmlElementWriter._UID_SEED = (new Date()).getTime();
		++Kekule.IO.CmlElementWriter._UID_SEED;
		var s = Kekule.IO.CmlElementWriter._UID_SEED.toString();  //.substr(7);
		var r = '' + prefix + s;
		return r;
	},

	/**
	 * If obj has scalar property, write them.
	 * @param {Object} obj
	 * @param {Object} elem
	 * @private
	 */
	writeScalarAttribs: function(obj, elem, options)
	{
		if (obj.getScalarAttribs)
		{
			//var writer = Kekule.IO.CmlElementWriterFactory.getWriter('Kekule.Scalar');
			var writer = this.doGetChildObjectWriter('Kekule.Scalar');
			if (writer)
			{
				//this.copySettingsToChildHandler(writer);
				//var scalars = obj.getScalarAttribs();
				for (var i = 0, l = obj.getScalarAttribCount(); i < l; ++i)
					writer.writeObject(obj.getScalarAttribAt(i), elem, options);
			}
		}
	},
	/**
	 * If obj has info property, write it.
	 * @param {Object} obj
	 * @param {Object} elem
	 * @private
	 */
	writeObjInfoValues: function(obj, elem, options)
	{
		if (obj.getInfo)
		{
			var keys = this.getObjInfoKeysNeedToSaveToMetaList(obj); //obj.getInfoKeys();
			if (!keys || !keys.length)
				return;
			var metaListElem;
			for (var i = 0, l = keys.length; i < l; ++i)
			{
				/*
				var childElem = this.createChildElem('scalar', elem);
				Kekule.IO.CmlDomUtils.setCmlElemAttribute(childElem, 'title', keys[i], this.getDomHelper());
				Kekule.IO.CmlDomUtils.setCmlElemAttribute(childElem, 'value', keys[i], this.getDomHelper());
				*/
				var key = keys[i];
				var value = obj.getInfoValue(keys[i]);
				if (key && value && (!Kekule.IO.CmlDomUtils.getCmlElemAttribute(elem, key, this.getDomHelper()))) // attrib not set
				{
					//Kekule.IO.CmlDomUtils.setCmlElemAttribute(elem, keys[i], value, this.getDomHelper());
					// add meta
					if (!metaListElem)
						metaListElem = this.getOrCreateChildElem('metaDataList', elem);
					/*
					var metaElem = this.createChildElem('metaData', metaListElem);
					Kekule.IO.CmlDomUtils.setCmlElemAttribute(metaElem, 'name', key, this.getDomHelper());
					Kekule.IO.CmlDomUtils.setCmlElemAttribute(metaElem, 'content', DataType.StringUtils.serializeValue(value), this.getDomHelper());
					*/
					//this.writeObjMetaValueToListElem(obj, key, null, value, metaListElem);
					this.doWriteObjInfoValueItem(key, value, obj, metaListElem, options);
				}
			}
		}
	},
	/** @private */
	doWriteObjInfoValueItem: function(key, value, obj, parentListElem, options)
	{
		return this.writeObjMetaValueToListElem(obj, key, null, value, parentListElem);
	},
	/** @private */
	writeObjMetaValueToListElem: function(obj, key, value, metadataType, metaListElem, metaElemTagName, options)
	{
		if (!metaElemTagName)
			metaElemTagName = 'metaData';
		var metaElem = this.createChildElem(metaElemTagName, metaListElem);
		Kekule.IO.CmlDomUtils.setCmlElemAttribute(metaElem, 'name', key, this.getDomHelper());
		Kekule.IO.CmlDomUtils.setCmlElemAttribute(metaElem, 'content', DataType.StringUtils.serializeValue(value), this.getDomHelper());
		if (metadataType)
			Kekule.IO.CmlDomUtils.setCmlElemAttribute(metaElem, 'metadataType', metadataType, this.getDomHelper());
		return metaElem;
	},
	/**
	 * Returns the keys in obj's info property that need to be save to <metaDataList>.
	 * Descendants may override this value.
	 * @param {Kekule.ChemObject} obj
	 * @returns {Array}
	 * @private
	 */
	getObjInfoKeysNeedToSaveToMetaList: function(obj)
	{
		return obj.getInfoKeys? obj.getInfoKeys(): null;
	},
	/**
	 * Write scalarAttribs and info property of obj.
	 * @param {Object} obj
	 * @param {Object} elem
	 * @private
	 */
	writeObjAdditionalInfo: function(obj, elem, options)
	{
		//console.log('called', this.getClassName());
		this.writeScalarAttribs(obj, elem, options);
		this.writeObjInfoValues(obj, elem, options);
	},
	/**
	 * Create suitable new child element to write obj.
	 * Descendants may override this method.
	 * @param {Kekule.ChemObject} obj
	 * @param {Object} parentElem
	 * @returns {Object} Element created.
	 */
	doCreateElem: function(obj, parentElem)
	{
		// do nothing here
	},
	/**
	 * Create a new child element with qualifiedName with namespace.
	 * @param {String} qualifiedName
	 * @param {Object} parentElem
	 * @param {String} namespaceURI Can be null.
	 * @private
	 */
	createChildElem: function(qualifiedName, parentElem, namespaceURI)
	{
		var ns = namespaceURI || this.getCoreNamespaceURI();
		var result = this.getDomHelper().createElementNS(ns, qualifiedName);
		if (parentElem)
			parentElem.appendChild(result);
		return result;
	},
	/**
	 * Returns the child element of certain condition. If the element does not exists, just create it.
	 * @param {String} qualifiedName
	 * @param {Object} parentElem
	 * @param {String} namespaceURI
	 * @returns {Object}
	 * @private
	 */
	getOrCreateChildElem: function(localName, parentElem, namespaceURI)
	{
		var result = this.getDomHelper().getElementsByTagNameNS(namespaceURI, localName, parentElem)[0];
		if (!result)
			result = this.createChildElem(localName, parentElem, namespaceURI);
		return result;
	},
	/**
	 * Method to do the actual writeObject job. Descendants should override this method.
	 * @param {Kekule.ChemObject} obj
	 * @param {Object} targetElem
	 * @param {Hash} options
	 * @returns {Object}
	 */
	doWriteObject: function(obj, targetElem, options)
	{
		// do nothing here
	},
	/**
	 * Get a writer instance to write data to child element.
	 * Descendants may override this method to returns customized writer.
	 * @param {Variant} obj Object instance or class name string.
	 * @param {Object} parentObj
	 * @param {Kekule.IO.CmdElementWriter} parentWriter
	 * @returns {Kekule.CmlElementWriter}
	 * @private
	 */
	doGetChildObjectWriter: function(obj, parentObj, parentWriter)
	{
		var result = Kekule.IO.CmlElementWriterFactory.getWriter(obj);
		if (result)
		{
			this.copySettingsToChildHandler(result);
			this._appendChildHandler(result);
		}
		return result;
	},
	/**
	 * Report this writer is not proper for writing obj.
	 * @param {Object} obj
	 * @private
	 */
	reportTypeMismatchError: function(obj)
	{
		Kekule.error(/*Kekule.ErrorMsg.CML_ELEM_WRITER_TYPE_INPROPER*/
			Kekule.$L('ErrorMsg.CML_ELEM_WRITER_TYPE_INPROPER').format(this.getClassName(), DataType.getType(obj)));
	},

	/**
	 * Add namespace to XML document.
	 * @param {String} prefix
	 * @param {String} uri
	 * @private
	 */
	addNamespace: function(doc, prefix, uri, elem)
	{
		this.getDomHelper().addNamespace(doc, prefix, uri, elem);
	},
	/** @private */
	addNamespaces: function(doc, namespaces, elem)
	{
		for (var i = 0, l = namespaces.length; i < l; ++i)
		{
			this.addNamespace(doc, namespaces[i].prefix, namespaces[i].namespaceURI, elem);
		}
	},
	/**
	 * Called after the whole CML document is written.
	 * @param {Bool} cascade Whether calling the doneWritingDocument method of child writers.
	 * @private
	 */
	doneWritingDocument: function(cascade)
	{
		this.doDoneWritingDocument();
		if (cascade)
		{
			this._iterateChildHandlers(function(handler){
				if (handler && handler.doneWritingDocument)
					handler.doneWritingDocument(cascade);
			});
		}
	},
	/**
	 * Do the actual work of doneWritingDocument method.
	 * Descendants may override this method.
	 * @private
	 */
	doDoneWritingDocument: function()
	{
		// do nothing here
	}
});

/**
 * Base reader to read list (<list>/<moleculeList>/<reactionList>...) element of CML.
 * @class
 * @augments Kekule.IO.CmlElementReader
 */
Kekule.IO.CmlBaseListReader = Class.create(Kekule.IO.CmlElementReader,
/** @lends Kekule.IO.CmlBaseListReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlBaseListReader',
	/** @private */
	doReadElement: function(elem, parentObj, parentReader, options)
	{
		var result = this.doCreateList(elem);
		result = this.doReadList(result, elem, parentObj, parentReader, this.getDomHelper());
		return result;
	},
	/**
	 * Create a suitable list object for CML elem.
	 * An simple array may be created to hold the created chem objects and passed to parent reader to do cocrete handling.
	 * Desendants should override this method.
	 * @returns {Kekule.ChemObject}
	 * @private
	 */
	doCreateList: function(elem)
	{
		/*
		switch (Kekule.DomUtils.getLocalName(elem))
		{
			case 'moleculeList': return new Kekule.MoleculeList(); break;
			case 'reactionList': return new Kekule.ReactionList(); break;
			default:
				return new Kekule.ChemObjList();
		}
		*/
		return [];  // return an simple array.
	},
	/**
	 * Append child chem object to list object created by doCreateList method.
	 * Desendants should override this method.
	 * @param {Object} obj
	 * @param {Variant} list
	 * @private
	 */
	doAppendObjToList: function(obj, list)
	{
		if (list && list.push)
			list.push(obj);
		return list;
	},
	/**
	 * Read the child object from a child element.
	 * Decendants may override this method.
	 * @private
	 */
	doReadChildElem: function(childElem, childReader, parentObj, parentReader, listObj)
	{
		var obj = childReader.readElement(childElem, listObj, this);
		return obj;
	},
	/** @private */
	doReadList: function(list, elem, parentObj, parentReader, domHelper)
	{
		var children = Kekule.DomUtils.getDirectChildElems(elem, null, null, this.getCoreNamespaceURI());
		if (children)
		{
			for (var i = 0, l = children.length; i < l; ++i)
			{
				var child = children[i];
				//var reader = Kekule.IO.CmlElementReaderFactory.getReader(child);
				var reader = this.doGetChildElementReader(child, parentObj, this);
				if (reader)
				{
					//this.copySettingsToChildHandler(reader);
					//var obj = reader.readElement(child, list, this);
					var obj = this.doReadChildElem(child, reader, parentObj, parentReader, list);
					if (obj)
					{
						//list.append(obj);
						this.doAppendObjToList(obj, list);
					}
				}
			}
		}
		return list;
	}
});

/**
 * Base writer to write list ({@link Kekule.MoleculeList}, {@link Kekule.ReactionList}) or array object to corresponding CML <list> series elements.
 * @class
 * @augments Kekule.IO.CmlElementWriter
 */
Kekule.IO.CmlBaseListWriter = Class.create(Kekule.IO.CmlElementWriter,
/** @lends Kekule.IO.CmlBaseListWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlBaseListWriter',
	/**
	 * Create a suitable CML element to hold the obj.
	 * @param {Kekule.ChemObject} obj List object.
	 * @param {Element} parentElem
	 * @returns {Element}
	 * @private
	 */
	doCreateElem: function(obj, parentElem)
	{
		var tagName = this.doGetListElemTagName(obj, parentElem);
		if (tagName)
			return this.createChildElem(tagName, parentElem);
		else
			return null;   // write directly to parentElem
	},
	/**
	 * Returns a suitable tag name for element to hold the data of list object.
	 * Decendants should override this method.
	 * @param {Kekule.ChemObject} obj List object.
	 * @param {Element} parentElem
	 * @returns {String}
	 * @private
	 */
	doGetListElemTagName: function(obj, parentElem)
	{
		return 'list';  // return a general list tag name
	},
	/** @private */
	doWriteObject: function(obj, targetElem, options)
	{
		var list = Kekule.ChemStructureUtils.getChildStructureObjs(obj, false);
		return this.writeList(list, targetElem, options);
	},
	/**
	 * Write list items to listElem.
	 * @private
	 */
	writeList: function(list, listElem, options)
	{
		for (var i = 0, l = list.length; i < l; ++i)
		{
			var item = list[i];
			if (item)
			{
				//var writer = Kekule.IO.CmlElementWriterFactory.getWriter(item);
				var writer = this.doGetChildObjectWriter(item);
				if (writer)
				{
					//this.copySettingsToChildHandler(writer);
					writer.writeObject(item, listElem, options);
				}
			}
		}
		return listElem;
	}
});

/**
 * CML <name> element reader.
 * @class
 * @augments Kekule.IO.CmlElementReader
 */
Kekule.IO.CmlNameReader = Class.create(Kekule.IO.CmlElementReader,
/** @lends Kekule.IO.CmlNameReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlNameReader',
	/** @constructs */
	initialize: function(/*$super*/)
	{
		this.tryApplySuper('initialize')  /* $super() */;
	},

	/**
	 * Read an <name> element in CML document.
	 * @param {Object} elem
	 * @returns {Hash} A hash of {name, convention}
	 * @private
	 */
	doReadElement: function(elem, parentObj, parentReader, options)
	{
		var name = Kekule.DomUtils.getElementText(elem);
		var convention = Kekule.IO.CmlDomUtils.getCmlElemAttribute(elem, 'convention');
		if (name)
		{
			var result = {};
			result.name = name;
			if (convention)
				result.convention = convention;
			else  // no convertion, regard it as a default name as insert to parentObj
			{
				if (parentObj && parentObj.setName)
					parentObj.setName(name);
			}
			return result;
		}
		return null;
	}
});

/**
 * CML <scalar> element reader.
 * @class
 * @augments Kekule.IO.CmlElementReader
 */
Kekule.IO.CmlScalarReader = Class.create(Kekule.IO.CmlElementReader,
/** @lends Kekule.IO.CmlScalarReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlScalarReader',
	/**
	 * Read an <scalar> element in CML document.
	 * @param {Object} elem
	 * @private
	 */
	doReadElement: function(elem, parentObj, parentReader, options)
	{
		/*
		var scalarInfo = this.readScalar(elem);
		// insert scalar into parentObj's info property
		var keys = Kekule.ObjUtils.getOwnedFieldNames(scalarInfo);
		var valueObj = {};
		var svalueKey = scalarInfo.dictRef?
			'dictRef'
			: scalarInfo.title? 'title': null;
		if (svalueKey)  // has key, insert directly into parentObj
		{
			for (var i = 0, l = keys.length; i < l; ++i)
			{
				if (keys[i] != svalueKey)
					valueObj[keys[i]] = scalarInfo[keys[i]];
			}
			parentObj.setInfoValue(scalarInfo[svalueKey], valueObj);
		}
		else  // may be used in other situation, do nothing and just return a JSON object
			;
		return scalarInfo;
		*/
		var scalar = this.readScalar(elem);
		if (parentObj && parentObj.appendScalarAttrib)  // parent is a ChemObject and can insert scalar attrib
			parentObj.appendScalarAttrib(scalar);
		else  // may be used in other situation, do nothing and just return a object
			;
		return scalar;
	},

	/** @private */
	readScalar: function(elem)
	{
		var jsonObj = Kekule.DomUtils.fetchAttributeValuesToJson(elem, this.getCoreNamespaceURI(), true);
		var value = Kekule.DomUtils.getElementText(elem);
		if (value)
			jsonObj.value = value;
		if (jsonObj.value) // check dataType and do the proper conversion
		{
			if (jsonObj.dataType)
			{
				/*
				switch (jsonObj.dataType)
				{
					case 'xsd:boolean':
					{
						jsonObj.value = Kekule.StrUtils.strToBool(jsonObj.value);
						break;
					}
					case 'xsd:float':
					case 'xsd:double':
					case 'xsd:duration':
					case 'xsd:decimal':
					case 'xsd:integer':
					case 'xsd:nonPositiveInteger':
					case 'xsd:negativeInteger':
					case 'xsd:long':
					case 'xsd:int':
					case 'xsd:short':
					case 'xsd:byte':
					case 'xsd:nonNegativeInteger':
					case 'xsd:unsignedLong':
					case 'xsd:unsignedInt':
					case 'xsd:unsignedShort':
					case 'xsd:unsignedByte':
					case 'xsd:positiveInteger':
					{
						jsonObj.value = parseFloat(jsonObj.value);
						if (jsonObj.errorValue)
							jsonObj.errorValue = parseFloat(jsonObj.errorValue);
						break;
					}
				}
				*/
				jsonObj.value = Kekule.IO.CmlUtils.convertSimpleValueByDataType(jsonObj.value, jsonObj.dataType);
				if (jsonObj.errorValue)
				{
					jsonObj.errorValue = Kekule.IO.CmlUtils.convertSimpleValueByDataType(jsonObj.errorValue, jsonObj.dataType, true);
				}
			}
			else
			{
				// without explicit data type, as scalar, try to convert value to number
				jsonObj.value = Kekule.IO.CmlUtils.tryParseFloat(jsonObj.value);
			}
		}
		// turn jsonObj to Kekule.Scalar instance
		var result;
		if (jsonObj)
		{
			result = new Kekule.Scalar();
			var keys = Kekule.ObjUtils.getOwnedFieldNames(jsonObj);
			for (var i = 0, l = keys.length; i < l; ++i)
			{
				var key = keys[i];
				var value = jsonObj[key];
				switch (key)
				{
					case 'value': result.setValue(value); break;
					case 'errorValue': result.setErrorValue(value); break;
					case 'units': result.setUnit(Kekule.IO.CmlUtils.cmlUnitStrToMetricsUnitSymbol(value)); break;
					case 'title': result.setTitle(value); break;
					case 'dictRef':
						result.setName(Kekule.IO.CmlUtils.cmlNsTokenToKekule(value));
						result.setInfoValue('dictRef', value);
						break;
					default: result.setInfoValue(key, value);
				}
			}
		}
		return result;
	}
});

/**
 * CML <scalar> element writer, save {@link Kekule.Scalar}.
 * @class
 * @augments Kekule.IO.CmlElementWriter
 */
Kekule.IO.CmlScalarWriter = Class.create(Kekule.IO.CmlElementWriter,
/** @lends Kekule.IO.CmlScalarWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlScalarWriter',
	/** @private */
	doCreateElem: function(obj, parentElem)
	{
		return this.createChildElem('scalar', parentElem);
	},
	/** @private */
	doWriteObject: function(obj, targetElem, options)
	{
		if (!(obj instanceof Kekule.Scalar))
		{
			this.reportTypeMismatchError(obj);
			return null;
		}
		var sValueType;
		if (!Kekule.ObjUtils.isUnset(obj.getValue()))
		{
			Kekule.DomUtils.setElementText(targetElem, obj.getValue());
			sValueType = DataType.getType(obj.getValue());
		}
		if (obj.getName())
			Kekule.IO.CmlDomUtils.setCmlElemAttribute(targetElem, 'dictRef', Kekule.IO.CmlUtils.kekuleNsTokenToCml(obj.getName()), this.getDomHelper());
		if (obj.getErrorValue())
			Kekule.IO.CmlDomUtils.setCmlElemAttribute(targetElem, 'errorValue', obj.getErrorValue(), this.getDomHelper());
		if (obj.getUnit())
			Kekule.IO.CmlDomUtils.setCmlElemAttribute(targetElem, 'units', Kekule.IO.CmlUtils.metricsUnitSymbolToCmlUnitStr(obj.getUnit()), this.getDomHelper());
		if (obj.getTitle())
			Kekule.IO.CmlDomUtils.setCmlElemAttribute(targetElem, 'title', obj.getTitle(), this.getDomHelper());
		// dataType
		if (sValueType)
		{
			/*
			var sDataType =
				(sValueType == DataType.INT)? 'xsd:integer':
				(sValueType == DataType.FLOAT)? 'xsd:float':
				(sValueType == DataType.BOOL)? 'xsd:boolean':
				null;
			*/
			var sDataType = CmlUtils.getCmlTypeForDataType(sValueType);
			if (sDataType)
				Kekule.IO.CmlDomUtils.setCmlElemAttribute(targetElem, 'datatype', sDataType, this.getDomHelper());
		}
	}
});

/**
 * CML <array> element reader.
 * @class
 * @augments Kekule.IO.CmlElementReader
 */
Kekule.IO.CmlArrayReader = Class.create(Kekule.IO.CmlElementReader,
/** @lends Kekule.IO.CmlArrayReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlArrayReader',
	/** @private */
	initProperties: function()
	{
		// a private property, whether expand the stepped array with concrete array values when reading
		this.defineProp('expandSteppedArray', {'dataType': DataType.BOOL, 'serializable': false});
		// a private property, the implicit XML data type of child items of array
		this.defineProp('defaultItemDataType', {'dataType': DataType.STRING, 'serializable': false});
	},
	/**
	 * Read an <array> element in CML document.
	 * @ignore
	 */
	doReadElement: function(elem, parentObj, parentReader, options)
	{
		return this.readArray(elem);
	},
	/** @private */
	readArray: function(elem)
	{
		var result = Kekule.DomUtils.fetchAttributeValuesToJson(elem, this.getCoreNamespaceURI(), true);
		if (result.size)  // size attrib may still exists without start/end attribs
			result.size = parseInt(result.size);
		if (Kekule.ObjUtils.notUnset(result.start) && Kekule.ObjUtils.notUnset(result.end))  // stepped array
		{
			result.start = parseFloat(result.start);
			result.end = parseFloat(result.end);
			if (result.stepSize)
				result.stepSize = parseFloat(result.stepSize);

			if (!result.size && result.stepSize)  // size = 0 or stepSize = 0 is illegal for an array
			{
				result.size = Math.round(Math.abs((arrayJson.end - arrayJson.start) / result.stepSize));
			}
			else if　(result.size && !result.stepSize)
			{
				result.stepSize = (result.end - result.start) / result.size;
			}
			//result.values = this._generateExplicitArray(result);
		}
		else  // explicit array
		{
			var innerText = Kekule.DomUtils.getElementText(elem);
			result.values = this._generateExplicitArray(result, innerText);
		}
		return result;
	},
	/**
	 * Generate object for array element with start/end/size(or stepSize) attributes.
	 * The array item should be number.
	 * @param {Hash} arrayJson
	 * @private
	 */
	_generateSteppedArray: function(arrayJson)
	{
		var result = null;
		var expandToConcrete = this.getExpandSteppedArray();
		if (expandToConcrete)
		{
			var arraySize = arrayJson.size;
			var stepSize = arrayJson.stepSize;
			var curr = arrayJson.start;
			result = [curr];
			for (var i = 0; i < arraySize; ++i)
			{
				curr += stepSize;
				if (curr > arrayJson.end)  // avoid float calculation errors
				{
					result.push(arrayJson.end);
					break;
				}
				else
					result.push(curr);
			}
		}
		return result;
	},
	/**
	 * Generate object for array element with explicit value text.
	 * The item of arrays should be read from those text.
	 * @param {Hash} arrayJson
	 * @param {String} valueText
	 * @private
	 */
	_generateExplicitArray: function(arrayJson, valueText)
	{
		var withCustomDelimiter = !!arrayJson.delimiter;
		var delimiter = withCustomDelimiter? arrayJson.delimiter: Kekule.IO.CML.DEFAULT_VALUE_DELIMITER_PATTERN;
		var svalues = valueText.split(delimiter);
		if (withCustomDelimiter)
		{
			// custom delimiter are used like <array delimiter)“|”>|3.0|4.0|5.0|6.0|7.0|8.0|9.0|10.0|</array>
			// the leading and trailing delimiters which ensure that XML prettifiers do not add whitespace.
			// So when parsing, we need to remove the first and last splitted value
			svalues.shift();
			svalues.pop();
		}
		var dataType = arrayJson.dataType || this.getDefaultItemDataType();
		//if (dataType)
		{
			var result = [];
			for (var i = 0, l = svalues.length; i < l; ++i)
			{
				var sItem = svalues[i].trim();
				if (!withCustomDelimiter && sItem)  // default delimiter, ignore all empty string items
				{
					if (dataType)
						result.push(Kekule.IO.CmlUtils.convertSimpleValueByDataType(sItem, dataType));
					else
						result.push(sItem)
				}
			}
			return result;
		}
	}
});

/**
 * CML <array> element writer.
 * This writer should not be used alone. Instead, it can cooperate with other writers.
 * @class
 * @augments Kekule.IO.CmlElementWriter
 */
Kekule.IO.CmlArrayWriter = Class.create(Kekule.IO.CmlElementWriter,
/** @lends Kekule.IO.CmlArrayWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlArrayWriter',
	/** @private */
	DEF_TAGNAME: 'array',
	/** @private */
	DEF_DELIMITER: ' ',
	/** @private */
	initProperties: function()
	{
		// private property, the implicit XML data type/unit of child items of array
		this.defineProp('defaultItemDataType', {'dataType': DataType.STRING, 'serializable': false});
		this.defineProp('defaultItemDataUnit', {'dataType': DataType.STRING, 'serializable': false});
	},
	/** @private */
	getArrayTagName: function()
	{
		return this.DEF_TAGNAME;
	},
	getDefaultArrayValueDelimiter: function()
	{
		return this.DEF_DELIMITER;
	},
	/** @ignore */
	doCreateElem: function(obj, parentElem)
	{
		return this.createChildElem(this.getArrayTagName(), parentElem);
	},
	/** @ignore */
	doWriteObject: function(obj, targetElem, options)
	{
		// the input obj may be a array or a object containing fields {unit, dataType, values}
		var arrayObj;
		if (DataType.isObjectValue(obj))
			arrayObj = Object.extend({}, obj);
		else if (DataType.isArrayValue(obj))
		{
			arrayObj = {values: obj};
		}
		else
		{
			this.reportTypeMismatchError(obj);
			return null;
		}
		arrayObj = Object.extend(arrayObj, {
			unit: arrayObj.unit || options.unit || this.getDefaultItemDataUnit(),
			dataType: arrayObj.dataType || options.dataType || this.getDefaultItemDataType(),
			delimiter: arrayObj.delimiter || options.delimiter || this.getDefaultArrayValueDelimiter()
		});
		return this.writeArrayObj(arrayObj, targetElem, options);
	},
	/** @private */
	writeArrayObj: function(arrayObj, targetElem, options)
	{
		var domHelper = this.getDomHelper();
		// simple info fields
		//var specialFields = ['unit', 'dataType', 'size', 'start', 'end', 'values'];
		//var fields = Kekule.ArrayUtils.exclude(Kekule.ObjUtils.getOwnedFieldNames(arrayObj), specialFields);
		var fields = ['id', 'title', 'dictRef'];
		for (var i = 0, l = fields.length; i < l; ++i)
		{
			var v = arrayObj[fields[i]];
			if (Kekule.ObjUtils.notUnset(v))
				CmlDomUtils.setCmlElemAttribute(targetElem, fields[i], v, domHelper);
		}

		// write unit / dataType attribs
		if (arrayObj.unit)
			CmlDomUtils.setCmlElemAttribute(targetElem, 'units', CmlUtils.metricsUnitSymbolToCmlUnitStr(arrayObj.unit), domHelper);
		if (arrayObj.dataType)
			CmlDomUtils.setCmlElemAttribute(targetElem, 'dataType', CmlUtils.getCmlTypeForDataType(arrayObj.dataType), domHelper);

		var values = arrayObj.values;
		var size = values? values.length: arrayObj.size;
		if (size)
			CmlDomUtils.setCmlElemAttribute(targetElem, 'size', size, domHelper);

		if (!values)  // is array var has been set a continuous range?
		{
			if (Kekule.ObjUtils.notUnset(arrayObj.start))
				CmlDomUtils.setCmlElemAttribute(targetElem, 'start', arrayObj.start, domHelper);
			if (Kekule.ObjUtils.notUnset(arrayObj.end))
				CmlDomUtils.setCmlElemAttribute(targetElem, 'end', arrayObj.end, domHelper);
		}
		else  // normal array, write array items
		{
			var valueDelimiter = arrayObj.delimiter || this.getDefaultArrayValueDelimiter();
			Kekule.DomUtils.setElementText(targetElem, values.join(valueDelimiter));
			if (valueDelimiter !== this.getDefaultArrayValueDelimiter())
			{
				CmlDomUtils.setCmlElemAttribute(targetElem, 'delimiter', valueDelimiter, domHelper);
			}
		}
	}
});

/**
 * CML <meta> element reader.
 * @class
 * @augments Kekule.IO.CmlElementReader
 */
Kekule.IO.CmlMetaDataReader = Class.create(Kekule.IO.CmlElementReader,
/** @lends Kekule.IO.CmlMetaReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlMetaReader',
	/** @private */
	doReadElement: function(elem, parentObj, parentReader, options)
	{
		var meta = this.readMeta(elem);
		if (parentObj && parentObj.setInfoValue)  // parent is a ChemObject and can insert info
		{
			if (meta.key && meta.value)
				parentObj.setInfoValue(meta.key, meta.value);
		}
		else  // may be used in other situation, do nothing and just return a object
			;
		return meta;
	},
	/** @private */
	readMeta: function(elem)
	{
		var jsonObj = Kekule.DomUtils.fetchAttributeValuesToJson(elem, this.getCoreNamespaceURI(), true);
		var result = {'key': jsonObj.name, 'value': DataType.StringUtils.deserializeValue(jsonObj.content) ,'metadataType': jsonObj.metadataType};
		return result;
	}
});

/**
 * CML <metaList> element reader.
 * @class
 * @augments Kekule.IO.CmlBaseListReader
 */
Kekule.IO.CmlMetaDataListReader = Class.create(Kekule.IO.CmlBaseListReader,
/** @lends Kekule.IO.CmlMetaListReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlMetaListReader',
	/* @private */
	/*
	doReadElement: function(elem, parentObj, parentReader)
	{
		var result = [];
		var metaElems = Kekule.DomUtils.getDirectChildElems(elem, null, 'metaData', this.getCoreNamespaceURI());
		for (var i = 0, l = metaElems.length; i < l; ++i)
		{
			var metaElem = metaElems[i];
			var reader = Kekule.IO.CmlElementReaderFactory.getReader(metaElem);
			if (reader)
			{
				this.copySettingsToChildHandler(reader);
				var metaData = reader.readElement(metaElem, parentObj, parentReader);
				if (metaData)
					result.push(metaData);
			}
		}
		return result;
	}
	*/
	/** @ignore */
	doReadChildElem: function(childElem, childReader, parentObj, parentReader, listObj)
	{
		var obj = childReader.readElement(childElem, parentObj, this);
		return obj;
	}
});

/**
 * CML <conditionList> element reader.
 * @class
 * @augments Kekule.IO.CmlBaseListReader
 */
Kekule.IO.CmlConditionListReader = Class.create(Kekule.IO.CmlBaseListReader,
/** @lends Kekule.IO.CmlConditionListReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlConditionListReader'
});

/**
 * CML <parameter> element reader.
 * @class
 * @augments Kekule.IO.CmlBaseListReader
 */
Kekule.IO.CmlParameterReader = Class.create(Kekule.IO.CmlElementReader,
/** @lends Kekule.IO.CmlParameterReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlParameterReader',
	/** @private */
	doReadElement: function(elem, parentObj, parentReader, options)
	{
		var result = this.readParameter(elem, parentObj, parentReader);
		return result;  // simply returns the result, do not modify parentObj directly
	},
	/** @private */
	readParameter: function(elem, parentObj, parentReader)
	{
		var jsonObj = Kekule.DomUtils.fetchAttributeValuesToJson(elem, this.getCoreNamespaceURI(), true);
		var result = {'key': jsonObj.name || jsonObj.dictRef, 'value': DataType.StringUtils.deserializeValue(jsonObj.value), 'title': jsonObj.title};
		// may containing <scale> element as value
		var childResults = this.iterateChildElements(elem, parentObj, parentReader, function(childElem, childResult){
			if (Kekule.DomUtils.getLocalName(childElem).toLowerCase() === 'scalar')
			{
				result.value = childResult;
			}
		});
		return result;
	}
});

/**
 * CML <parameterList> element reader.
 * @class
 * @augments Kekule.IO.CmlBaseListReader
 */
Kekule.IO.CmlParameterListReader = Class.create(Kekule.IO.CmlBaseListReader,
/** @lends Kekule.IO.CmlParameterListReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlParameterListReader'
});

/**
 * Reader to read a molecule structure in CML.
 * Base class of {@link Kekule.IO.CmlFormulaReader} and {@link Kekule.IO.CmlMoleculeReader}.
 * @class
 * @augments Kekule.IO.CmlElementReader
 */
Kekule.IO.CmlChemStructureReader = Class.create(Kekule.IO.CmlElementReader,
/** @lends Kekule.IO.CmlChemStructureReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlChemStructureReader',
	/** @constructs */
	initialize: function(/*$super*/)
	{
		this.tryApplySuper('initialize')  /* $super() */;
	},
	/**
	 * Check if a <atomArray> element has child <atom> elements.
	 * @param {Object} elem
	 * @param {Object} domHelper
	 */
	hasAtomChildren: function(elem, domHelper)
	{
		var atomElems = domHelper.getElementsByTagNameNS(this.getCoreNamespaceURI(), 'atom', elem);
		return atomElems.length;
	},
	/**
	 * Returns child <atom> elements of <atomArray>.
	 * @param {Object} elem
	 * @param {Object} domHelper
	 */
	getAtomChildren: function(elem, domHelper)
	{
		var atomElems = domHelper.getElementsByTagNameNS(this.getCoreNamespaceURI(), 'atom', elem);
		return atomElems;
	},

	/**
	 * Read and analysis an atom element of CML and fetch informations to a JSON object.
	 * @param {Object} elem
	 * @param {Object} domHelper
	 * @returns {Hash}
	 * @private
	 */
	atomInfoToJSON: function(elem, domHelper)
	{
		var result;
		var attribs = {}; // store properties of this atom
		//var hasChildInfoElems = false;  // in mode I, atom may has scalar, electron, atomParity... to store additional information
		// check if elem has string/integer/float children, if so, the old CML1 mode
		//hasChildInfoElems = !Kekule.IO.CmlDomUtils.hasDirectCmlTypedElemChildren(elem, this.getCoreNamespaceURI());
		attribs = Kekule.IO.CmlDomUtils.fetchCmlElemAttributeValuesToJson(elem, Kekule.IO.CmlDomUtils.FILTER_TYPED_ELEM, true, domHelper);
		return attribs;
	},

	/**
	 * Read <atomArray> array information and create an array of JSON to store atom informations.
	 * @returns {Array} Array of JSON of atom attribs.
	 * @private
	 */
	arrayedAtomInfosToJSON: function(elem, domHelper)
	{
		var arrayedAttribNames = ['id', 'atomID', 'elementType', 'isotope', 'hydrogenCount', 'formalCharge', 'count',
			'xFract', 'yFract', 'zFract',
			'x2', 'y2', 'x3', 'y3', 'z3'];
		var attribNames = ['id', 'id', 'elementType', 'isotope', 'hydrogenCount', 'formalCharge', 'count',
			'xFract', 'yFract', 'zFract',
			'x2', 'y2', 'x3', 'y3', 'z3'];
		var atomAttribs = [];

		//var childElems = Kekule.DomUtils.getDirectChildElems(elem, null, null, this.getCoreNamespaceURI());

		for (var i = 0, l = arrayedAttribNames.length; i < l; ++i)
		{
			var svalue;
			var values = [];

			svalue = Kekule.IO.CmlDomUtils.getCmlElemAttribute(elem, arrayedAttribNames[i], Kekule.IO.CmlDomUtils.FILTER_TYPEDARRAY_ELEM, domHelper);
			if (svalue)
				values = Kekule.IO.CmlDomUtils.splitCmlArrayValue(svalue);

			for (var j = 0, k = values.length; j < k; ++j)
			{
				if (!atomAttribs[j])
					atomAttribs[j] = {};
				if (values[j])
					atomAttribs[j][attribNames[i]] = values[j];
			}
		}

		return atomAttribs;
	}
});

/**
 * CML <formula> element reader.
 * @class
 * @augments Kekule.IO.CmlChemStructureReader
 */
Kekule.IO.CmlFormulaReader = Class.create(Kekule.IO.CmlChemStructureReader,
/** @lends Kekule.IO.CmlFormulaReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlFormulaReader',
	/**
	 * Read a <formula> element and returns new Kekule.MolecularFormula.
	 * @param {Object} elem
	 * @returns {Kekule.MolecularFormula}
	 * @private
	 */
	doReadElement: function(elem, parentObj, parentReader, options)
	{
		return this.readFormula(elem, this.getDomHelper());
	},

	/**
	 * Read an formula a CML formula element.
	 * @param {Object} elem
	 * @param {Object} domHelper
	 * @returns {Kekule.MolecularFormula}
	 */
	readFormula: function(elem, domHelper)
	{
		var result = new Kekule.MolecularFormula();
		var charge = Kekule.IO.CmlDomUtils.getCmlElemAttribute(elem, 'formalCharge', Kekule.IO.CmlDomUtils.FILTER_TYPED_ELEM, domHelper);
		if (charge)
			result.setCharge(parseFloat(charge));
		var concise = Kekule.IO.CmlDomUtils.getCmlElemAttribute(elem, 'concise', Kekule.IO.CmlDomUtils.FILTER_TYPED_ELEM, domHelper);
		var inlineText = Kekule.IO.CmlDomUtils.getCmlElemAttribute(elem, 'inline', Kekule.IO.CmlDomUtils.FILTER_TYPED_ELEM, domHelper);
		if (concise)
		{
			this.setConcise(result, concise);
		}
		else if (inlineText)
		{
			this.setInlineFormula(result, inlineText);
		}
		else
		{
			// iterate through direct children of molecule element
			var childElems = Kekule.DomUtils.getDirectChildElems(elem, null, null, this.getCoreNamespaceURI());
			for (var i = 0, l = childElems.length; i < l; ++i)
			{
				// Check node name for different function
				switch (Kekule.DomUtils.getLocalName(childElems[i]))
				{
					case 'formula':
						this.readSubFormula(result, childElems[i], domHelper);
						break;
					case 'atomArray':
						this.readAtomArray(result, childElems[i], domHelper);
						break;
					default:
						{
							// bypass CML1 style typed elements
							if (Kekule.IO.CmlDomUtils.isCmlTypedElem(elem) || Kekule.IO.CmlDomUtils.isCmlTypedArrayElem(elem))
								;
							else
								this.readChildElementDef(elem, result);
						}
				}
			}
		}
		return result;
	},
	/**
	 * Read concise directly and return a formula object.
	 * Sometimes formula attrib are in molecule element directly, such as <molecule formula="H 2 O 1" />,
	 * use this method to analysis and return proper object instead of {@link Kekule.IO.CmlFormulaReader.readElement}.
	 * @param {String} concise
	 * @returns {Kekule.MolecularFormula}
	 */
	readConsice: function(concise)
	{
		var result = null;
		if (concise)
		{
			result = new Kekule.MolecularFormula();
			this.setConcise(result, concise);
		}
		return result;
	},

	/** @private */
	setConcise: function(formula, concise)
	{
		var info = Kekule.IO.CmlDomUtils.analysisCmlFormulaConciseValue(concise);
		if (info.isotopes && info.isotopes.length)
		{
			this.createSectionsFromAtomAttribs(formula, info.isotopes);
		}
		if (info.formalCharge)
			formula.setCharge(info.formalCharge);
		return formula;
	},
	/** @private */
	setInlineFormula: function(formula, inlineText)
	{
		Kekule.FormulaUtils.textToFormula(inlineText, null, formula);
		return formula;
	},

	/**
	 * Read <atomArray> element inside <formula>
	 * @param {Object} parentFormula
	 * @param {Object} elem
	 * @param {Object} domHelper
	 * @private
	 */
	readAtomArray: function(parentFormula, elem, domHelper)
	{
		var atomAttribs = [];
		var atomElems = this.getAtomChildren(elem, domHelper);
		if (atomElems.length > 0)  // has child atom elements
		{
			for (var i = 0, l = atomElems.length; i < l; ++i)
			{
				var atomElem = atomElems[i];
				var atomAttrib = this.atomInfoToJSON(atomElem, domHelper);
				atomAttribs.push(atomAttrib);
			}
		}
		else  // no child atom element, in array mode
		{
			atomAttribs = this.arrayedAtomInfosToJSON(elem, domHelper);
		}
		// add information in atomAttribs to parentFormula
		this.createSectionsFromAtomAttribs(parentFormula, atomAttribs);
		return parentFormula;
	},
	/** @private */
	createSectionsFromAtomAttribs: function(formula, atomAttribs)
	{
		// add information in atomAttribs to parentFormula
		for (var i = 0, l = atomAttribs.length; i < l; ++i)
		{
			var symbol = atomAttribs[i].elementType;
			if (symbol)
			{
				//var isotope = Kekule.IsotopeFactory.getIsotope(symbol, atomAttribs[i].isotope || null);
				var atom = Kekule.IO.CmlUtils.createNodeByCmdElementType(null, symbol);
				var charge = (atomAttribs[i].formalCharge) || 0;
				var count = atomAttribs[i].count;
				//var charge = atomAttribs[i].formalCharge;
				formula.appendSection(atom, count, charge);
			}
		}
	},
	/**
	 * Read nested formula element.
	 * @param {Object} parentFormula
	 * @param {Object} elem
	 * @param {Object} domHelper
	 * @private
	 */
	readSubFormula: function(parentFormula, elem, domHelper)
	{
		var formula = this.readElement(elem, domHelper);
		// check sub formula count
		var count = Kekule.IO.CmlDomUtils.getCmlElemAttribute(elem, 'count', Kekule.IO.CmlDomUtils.FILTER_TYPED_ELEM, domHelper);
		parentFormula.appendSection(formula, parseFloat(count) || 1, formula.getCharge() || 0);
		//formula.setCharge(0);
	}
});

/**
 * CML <formula> element writer for outputting {@link Kekule.MolecularFormula}.
 * @class
 * @augments Kekule.IO.CmlElementWriter
 */
Kekule.IO.CmlFormulaWriter = Class.create(Kekule.IO.CmlElementWriter,
/** @lends Kekule.IO.CmlFormulaWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlFormulaWriter',
	/** @private */
	doCreateElem: function(obj, parentElem)
	{
		return this.createChildElem('formula', parentElem);
	},
	/** @private */
	doWriteObject: function(obj, targetElem, options)
	{
		if (!(obj instanceof Kekule.MolecularFormula))
		{
			this.reportTypeMismatchError(obj);
			return null;
		}
		var atomSymbols = [];
		var counts = [];
		var charges = [];
		for (var i = 0, l = obj.getSectionCount(); i < l; ++i)
		{
			var section = obj.getSectionAt(i);
			if (section.obj instanceof Kekule.MolecularFormula)  // sub formula
			{
				// write atoms before this sub formula
				this.createAtomArrayElem(atomSymbols, counts, charges, targetElem);
				// empty them
				atomSymbols = [];
				counts = [];
				charges = [];
				// create sub formula element
				var subElem = this.writeSubFormula(section.obj, section.count || 1, targetElem, options);
			}
			else
			{
				atomSymbols.push(Kekule.IO.CmlUtils.getNodeElementType(section.obj));
				counts.push(section.count || 1);
				//charges.push(section.obj.getCharge? (section.obj.getCharge() || 0): 0);
				charges.push(obj.getSectionCharge(section) || 0);
				if (i == l - 1)  // last item, write to element
				{
					this.createAtomArrayElem(atomSymbols, counts, charges, targetElem);
				}
			}
		}
		if (obj.getCharge())
			Kekule.IO.CmlDomUtils.setCmlElemAttribute(targetElem, 'formalCharge', obj.getCharge(), this.getDomHelper());
	},
	/** @private */
	writeSubFormula: function(formula, count, parentElem, options)
	{
		var result = this.createChildElem('formula', parentElem);
		this.doWriteObject(formula, result, options);  // as formula has no id, doWrite is the same as write
		if (count > 1)
			Kekule.IO.CmlDomUtils.setCmlElemAttribute(result, 'count', count, this.getDomHelper());
		return result;
	},
	/** @private */
	createAtomArrayElem: function(atomSymbols, counts, charges, parentElem)
	{
		if (atomSymbols.length <= 0)
			return;
		var result = this.createChildElem('atomArray', parentElem);
		var sSymbols = Kekule.IO.CmlDomUtils.mergeToCmlArrayValue(atomSymbols);
		var scounts = Kekule.IO.CmlDomUtils.mergeToCmlArrayValue(counts);
		Kekule.IO.CmlDomUtils.setCmlElemAttribute(result, 'elementType', sSymbols, this.getDomHelper());
		Kekule.IO.CmlDomUtils.setCmlElemAttribute(result, 'count', scounts, this.getDomHelper());
		// check if charges need to be set explicitly
		var needCharge = false;
		for (var i = 0, l = charges.length; i < l; ++i)
		{
			if (charges[i])
			{
				needCharge = true;
				break;
			}
		}
		if (needCharge)
		{
			var scharges = Kekule.IO.CmlDomUtils.mergeToCmlArrayValue(counts);
			Kekule.IO.CmlDomUtils.setCmlElemAttribute(result, 'formalCharge', scharges, this.getDomHelper());
		}
		return result;
	}
});

/**
 * CML <molecule> element reader.
 * @class
 * @augments Kekule.IO.CmlChemStructureReader
 */
Kekule.IO.CmlMoleculeReader = Class.create(Kekule.IO.CmlChemStructureReader,
/** @lends Kekule.IO.CmlMoleculeReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlMoleculeReader',
	/** @constructs */
	initialize: function(/*$super*/)
	{
		this.tryApplySuper('initialize')  /* $super() */;
		//this._coreNamespaceURI = '';  // used internally
	},
	/** @private */
	initProperties: function()
	{
		// a private property
		this.defineProp('structureBuilder', {
			'dataType': 'Kekule.ChemStructureBuilder',
			'serializable': false,
			// clone result object so that user can not modify x/y directly from getter
			'getter': function()
				{
					if (!this.getPropStoreFieldValue('structureBuilder'))
						this.setPropStoreFieldValue('structureBuilder', new Kekule.ChemStructureBuilder());
					return this.getPropStoreFieldValue('structureBuilder');
				},
			'setter': null
		});
	},

	/**
	 * Read a <molecule> element and returns new Kekule.Molecule.
	 * @param {Object} elem
	 * @returns {Variant}
	 * @private
	 */
	doReadElement: function(elem, parentObj, parentReader, options)
	{
		return this.readMolecule(elem, parentReader, this.getDomHelper());
	},

	/**
	 * Override to handle child elements of molecule.
	 * @private
	 */
	doReadChildElement: function(/*$super, */elem, parentObj, parentReader)
	{
		if ((Kekule.DomUtils.getLocalName(elem) == 'molecule') && (this.matchCoreNamespace(elem))) // has sub molecule
		{
			if (parentObj && parentObj.getSubMolecules)
			{
				var result = this.readElement(elem, parentObj, parentReader);
				if (result)
				{
					// sub molecule element should has amount attribute
					var amount =
						Kekule.IO.CmlDomUtils.getCmlElemAttribute(elem, 'amount', Kekule.IO.CmlDomUtils.FILTER_TYPED_ELEM)
							|| Kekule.IO.CmlDomUtils.getCmlElemAttribute(elem, 'count', Kekule.IO.CmlDomUtils.FILTER_TYPED_ELEM);
					var attributes = amount? {'amount': parseFloat(amount)}: null;
					parentObj.getSubMolecules().appendObj(result, attributes);
				}
				return result;
			}
			else
				return null;
		}
		else
			return this.tryApplySuper('doReadChildElement', [elem, parentObj, parentReader])  /* $super(elem, parentObj) */;
	},

	/**
	 * check if a <molecule> elemen has sub molecules
	 * @param {Object} elem
	 * @private
	 */
	hasSubMolecule: function(elem)
	{
		var subElems = Kekule.DomUtils.getDirectChildElems(elem, null, 'molecule', this.getCoreNamespaceURI());
		return (subElems.length > 0);
	},

	/**
	 * Read an molecule structure from a CML molecule element. This function can handle sub molecules.
	 * @param {Object} elem
	 * @param {Object} parentReader
	 * @param {Object} domHelper
	 * @private
	 */
	readMolecule: function(elem, parentReader, domHelper)
	{
		var result;
		if (this.hasSubMolecule(elem))
		{
			result = new Kekule.CompositeMolecule();
			this.iterateChildElements(elem, result, parentReader);
		}
		else  // a pure molecule
		{
			result = this.readMoleculeCore(elem, domHelper);
		}
		this.readMoleculeAttribs(result, elem, domHelper);
		return result;
	},

	/**
	 * Read and analysis attributes of molecule element.
	 * @param {Object} molecule
	 * @param {Object} elem
	 * @param {Object} domHelper
	 * @private
	 */
	readMoleculeAttribs: function(molecule, elem, domHelper)
	{
		// read molecule element attributes
		var attribs = Kekule.IO.CmlDomUtils.fetchCmlElemAttributeValuesToJson(elem, null, true, domHelper);
		var attribKeys = Kekule.ObjUtils.getOwnedFieldNames(attribs);
		for (var i = 0, l = attribKeys.length; i < l; ++i)
		{
			var key = attribKeys[i];
			var value = attribs[key];
			switch (key)
			{
				case 'id':
					//molecule.setId(value);
					this.setObjId(molecule, value);
					break;
				case 'title':
					molecule.setInfoValue('title', value);
					break;
				case 'formalCharge':
					if (value)
						molecule.setCharge(parseFloat(value));
					break;
				case 'formula':  // formula embedded in attribute, rather than an element
					this.readFormulaAttrib(molecule, value);
					break;
				case 'amount':
				case 'count':  // used for sub-molecule, handled by parent molecule, not here
					break;
				default:
					// TODO: bypassed attributes: [dictRef, chirality[], ref,
					//   spinMultiplicity, symmetryOriented, role]
					molecule.setInfoValue(key, value);
			}
		}
	},

	/**
	 * Read an molecule structure from a CML molecule element. This function only handles
	 *   a "pure" molecule tag (with no sub-molecule elements).
	 * In CML, there is four forms to define a molecule's connection table:
	 *
	 *   I. Use detailed elements:
	 *
<cml title="schematic molecule example">
  <molecule id="dummyId">
    <atomArray>
      <atom id="a1" elementType="C"
        hydrogenCount="0" x2="6.1964" y2="8.988"/>
      <atom id="a2" elementType="C"
        hydrogenCount="0" x2="6.1964" y2="7.587"/>
      <atom id="a3" elementType="C"
        hydrogenCount="2" x2="4.983" y2="6.887"/>
<!-- omitted -->
      <atom id="a28" elementType="C"
        hydrogenCount="3" x2="15.777" y2="6.554"/>
      <atom id="a29" elementType="O"
        hydrogenCount="0" x2="13.388" y2="6.188"/>
    </atomArray>
    <bondArray>
      <bond atomRefs2="a1 a2" order="1"/>
      <bond atomRefs2="a2 a3" order="1"/>
      <bond atomRefs2="a3 a4" order="1"/>
<!-- omitted -->
      <bond atomRefs2="a11 a15" order="1"/>
      <bond atomRefs2="a12 a18" order="1">
        <bondStereo>W</bondStereo>
      </bond>
      <bond atomRefs2="a2 a19" order="1">
        <bondStereo>W</bondStereo>
      </bond>
      <bond atomRefs2="a5 a20" order="2"/>
      <bond atomRefs2="a17 a21" order="1"/>
      <bond atomRefs2="a21 a22" order="1"/>
<!-- omitted -->
      <bond atomRefs2="a10 a9" order="1"/>
      <bond atomRefs2="a16 a29" order="2"/>
    </bondArray>
  </molecule>
</cml>
	 *
	 * II. Use array property:
	 *
<cml title="electron example">
  <molecule id="m1">
    <atomArray atomID="a1 a2 a3 a4 a5 a6"/>
    <bondArray
      order="A A A A A A"
      bondID="b1 b2 b3 b4 b5 b6"
      atomRef1="a1 a2 a3 a4 a5 a6"
      atomRef2="a6 a1 a2 a3 a4 a5"/>
    <electron count="6"
      bondRefs="b1 b2 b3 b4 b5 b6"
      atomRefs="a1 a2 a3 a4 a5 a6"/>
  </molecule>
</cml>
	 *
	 *  III. Deprecated form in CML1
	 *
<cml title="curan molecule">
	<molecule convention="MDLMol" id="curan">
	  <metadataList>
	    <metadata name="dc:date">2000-08-27</metadata>
	  </metadataList>
	  <atomArray>
	    <atom id="a1">
	      <string builtin="elementType">C</string>
	      <float builtin="x2">10.62</float>
	      <float builtin="y2">-9.0918</float>
	    </atom>
	    <atom id="a2">
	      <string builtin="elementType">C</string>
	      <float builtin="x2">10.62</float>
	      <float builtin="y2">-10.0442</float>
	    </atom>
	    <!-- ... -->
	  </atomArray>
	  <bondArray>
	    <bond id="b1">
	      <string builtin="atomRef">a1</string>
	      <string builtin="atomRef">a3</string>
	      <string builtin="order">2</string>
	    </bond>
	    <bond id="b2">
	      <string builtin="atomRef">a2</string>
	      <string builtin="atomRef">a4</string>
	      <string builtin="order">2</string>
	    </bond>
	    <!-- ... -->
	  </bondArray>
	</molecule>
</cml>
	 *
	 *  IV. Deprecated form 2 in CML1
	 *
<cml title="CML-1 JCICS examples">
	<molecule id="formamide">
		<atomArray>
			<stringArray builtin="atomId">H1 C1 O1 N1 Me1 Me2</stringArray>
			<stringArray builtin="elementType">H C O N C C</stringArray>
			<integerArray builtin="hydrogenCount">0 1 0 1 3	3</integerArray>
		</atomArray>
		<bondArray>
			<stringArray builtin="atomRef">C1 C1 C1 N1 N1</stringArray>
			<stringArray builtin="atomRef">H1 O1 N1 Me1 Me2</stringArray>
			<stringArray builtin="order">1 2 1 1 1</stringArray>
		</bondArray>
	</molecule>
</cml>
	 *
	 * @private
	 * @param {Object} elem
	 * @param {Kekule.DomHelper} domHelper
	 * @returns {Kekule.Molecule}
	 */
	readMoleculeCore: function(elem, domHelper)
	{
		var result = new Kekule.Molecule();
		this.getStructureBuilder().setTarget(result);
		// iterate through direct children of molecule element
		var node = elem.firstChild;
		while (node)
		{
			if (node.nodeType != Node.ELEMENT_NODE) // bypass non-element nodes
				;
			else if (!this.matchCoreNamespace(node)) // ignore element of other namespaces
				;
			else
			{
				// Check node name for different function
				switch (Kekule.DomUtils.getLocalName(node))
				{
					case 'atomArray':
						this.readMoleculeAtomArray(result, node, this.getStructureBuilder(), domHelper);
						break;
					case 'bondArray':
						this.readMoleculeBondArray(result, node, this.getStructureBuilder(), domHelper);
						break;
					case 'formula':
						this.readFormula(result, node, domHelper);
						break;
					case 'atom':   // sometimes atom or bond is directly add to molecule element
						this.getStructureBuilder().setTarget(result);
						var structureNode = this.readAtom(node, domHelper);
						this.getStructureBuilder().appendNode(structureNode);
						break;
					case 'bond':
						this.getStructureBuilder().setTarget(result);
						var connector = this.readBond(result, node, domHelper);
						this.getStructureBuilder().appendConnector(connector);
						break;
					case 'molecule':
						break;  // do nothing, as pure molecule element should not contain sub-molecule
					default:
						{
							// bypass CML1 style typed elements
							if (Kekule.IO.CmlDomUtils.isCmlTypedElem(node) || Kekule.IO.CmlDomUtils.isCmlTypedArrayElem(node))
								;
							else
								this.readChildElementDef(node, result);
						}
				}
			}
			node = node.nextSibling;
		}

		if (result.hasCtab())
			this.connectUpBondAndAtom(result);

		return result;
	},

	/**
	 * As we do not know whether atomArray or bondArray is read first, all connection info
	 * are stored in private fields temporarily. After all atoms and bonds object are created,
	 * we need to connect them togather.
	 * @private
	 */
	connectUpBondAndAtom: function(molecule)
	{
		var bonds = molecule.getConnectors();
		for (var i = 0, l = bonds.length; i < l; ++i)
		{
			var bond = bonds[i];
			// add bond-atom relation
			var atomIds = bond[this._BOND_ATOM_REF_TEMP_FIELD];
			if (atomIds && atomIds.length)
			{
				for (var j = 0, k = atomIds.length; j < k; ++j)
				{
					var refedAtom = molecule.getNodeById(atomIds[j]);
					if (refedAtom)
						bond.appendConnectedObj(refedAtom);
					else
					{
						Kekule.raise(
							(Kekule.hasLocalRes()?	/*Kekule.ErrorMsg.ATOMID_NOT_EXISTS*/Kekule.$L('ErrorMsg.ATOMID_NOT_EXISTS'): 'Atom id not exists: ')
								+ atomIds[j]
						);
					}
				}
			}
			delete bond[this._BOND_ATOM_REF_TEMP_FIELD];
			// as bond element may have refs to another not created bond or atom, handle this after all bonds are created
			var bondIds = bond[this._BOND_BOND_REF_TEMP_FIELD];
			if (bondIds && bondIds.length)
			{
				for (var j = 0, k = bondIds.length; j < k; ++j)
				{
					var refedBond = molecule.getConnectorById(bondIds[j]);
					if (refedBond)
						bond.appendConnectedObj(refedBond);
					else
					{
						Kekule.raise(
							(Kekule.hasLocalRes()?	/*Kekule.ErrorMsg.BONDID_NOT_EXISTS*/Kekule.$L('ErrorMsg.BONDID_NOT_EXISTS'): 'Bond id not exists: ')
								+ bondIds[j]
						);
					}
				}
			}
			delete bond[this._BOND_BOND_REF_TEMP_FIELD];
		}
	},

	/**
	 * Read atomArray element in CML.
	 * @param {Kekule.Molecule} molecule
	 * @param {Object} elem
	 * @param {Kekule.ChemStructureBuilder} structureBuilder
	 * @param {Object} domHelper
	 * @private
	 */
	readMoleculeAtomArray: function(molecule, elem, structureBuilder, domHelper)
	{
		structureBuilder.setTarget(molecule);
		// check if has atom child, if true, in mode I or III
		//var atomElems = domHelper.getElementsByTagNameNS(this.getCoreNamespaceURI(), 'atom', elem);
		var atomElems = this.getAtomChildren(elem, domHelper);
		if (atomElems.length > 0)  // in mode I or III
		{
			for (var i = 0, l = atomElems.length; i < l; ++i)
			{
				var atomElem = atomElems[i];
				var structureNode = this.readAtom(atomElem, domHelper);
				structureBuilder.appendNode(structureNode);
			}
		}
		else  // may in mode II or IV
		{
			var atoms = this.readArrayedAtoms(elem, domHelper);
			for (var i = 0, l = atoms.length; i < l; ++i)
			{
				structureBuilder.appendNode(atoms[i]);
			}
		}
	},

	/**
	 * Read and analysis an atom element of CML
	 * @param {Object} elem
	 * @param {Object} domHelper
	 * @returns {Variant} Return values may be Kekule.Atom, Kekule.UnrealAtom or Kekule.SubGroup or null
	 * @private
	 */
	readAtom: function(elem, domHelper)
	{
		var result;
		//var attribs = []; // store properties of this atom
		//var hasChildInfoElems = false;  // in mode I, atom may has scalar, electron, atomParity... to store additional information
		// check if elem has string/integer/float children, if so, the old CML1 mode
		var hasChildInfoElems = !Kekule.IO.CmlDomUtils.hasDirectCmlTypedElemChildren(elem, this.getCoreNamespaceURI());
		//attribs = Kekule.IO.CmlDomUtils.fetchCmlElemAttributeValuesToJson(elem, Kekule.IO.CmlDomUtils.FILTER_TYPED_ELEM, true, domHelper);
		var attribs = this.atomInfoToJSON(elem, domHelper);

		result = this.createStructureNodeOfAttribs(attribs);

		if (hasChildInfoElems)  // additional info, check child elements
		{
			// TODO: currently ignore electron and atomParity element, only consider <scalar>
			var children = Kekule.DomUtils.getDirectChildElems(elem, null, null, this.getCoreNamespaceURI());
			for (var i = 0, l = children.length; i < l; ++i)
			{
				var elem = children[i];
				/*
				if (Kekule.IO.CmlDomUtils.isScalarElem(elem, this.getCoreNamespaceURI()))
				{
					var scalarInfo = this.readScalar(elem);
					// add scalar info to result
					var keys = Kekule.ObjUtils.getOwnedFieldNames(scalarInfo);
					for (var i = 0, l = keys.length; i < l; ++i)
					{
						result.setInfoValue(keys[i], scalarInfo[keys[i]]);
					}
				}
				*/
				/*
				var reader = Kekule.IO.CmlElementReaderFactory.getReader(elem);
				reader.setCoreNamespaceURI(this.getCoreNamespaceURI());
				if (reader)
					reader.readElement(elem, result);
				*/
				this.readChildElementDef(elem, result);
			}
		}

		return result;
	},

	/**
	 * Read array information and create all atoms
	 * @returns {Array} Array of Kekule.Atom
	 * @private
	 */
	readArrayedAtoms: function(elem, domHelper/*, useTypedArrayElem*/)
	{
		/*
		var arrayedAttribNames = ['atomID', 'elementType', 'isotope', 'hydrogenCount', 'formalCharge',
			'xFract', 'yFract', 'zFract',
			'x2', 'y2', 'x3', 'y3', 'z3'];
		var attribNames = ['id', 'elementType', 'isotope', 'hydrogenCount', 'formalCharge',
			'xFract', 'yFract', 'zFract',
			'x2', 'y2', 'x3', 'y3', 'z3'];
		var atomAttribs = [];

		//var childElems = Kekule.DomUtils.getDirectChildElems(elem, null, null, this.getCoreNamespaceURI());

		for (var i = 0, l = arrayedAttribNames.length; i < l; ++i)
		{
			var svalue;
			var values = [];

			svalue = Kekule.IO.CmlDomUtils.getCmlElemAttribute(elem, arrayedAttribNames[i], Kekule.IO.CmlDomUtils.FILTER_TYPEDARRAY_ELEM, domHelper);
			if (svalue)
				values = Kekule.IO.CmlDomUtils.splitCmlArrayValue(svalue);

			for (var j = 0, k = values.length; j < k; ++j)
			{
				if (!atomAttribs[j])
					atomAttribs[j] = {};
				if (values[j])
					atomAttribs[j][attribNames[i]] = values[j];
			}
		}
		*/
		var atomAttribs = this.arrayedAtomInfosToJSON(elem, domHelper);

		var result = [];
		for (var i = 0, l = atomAttribs.length; i < l; ++i)
		{
			var atom = this.createStructureNodeOfAttribs(atomAttribs[i]);
			if (atom)
				result.push(atom);
		}

		return result;
	},

	/**
	 * Create atom by JSON attribs object.
	 * @param {Hash} attribs
	 * @returns {Kekule.ChemStructureNode}
	 * @private
	 */
	createStructureNodeOfAttribs: function(attribs)
	{
		var result;
		// analysis attribs to create atom
		if (!attribs.elementType)
			attribs.elementType = Kekule.Element.UNSET_ELEMENT;
		//if (attribs.elementType)
		{
			// id
			var id = null;
			if (attribs.id !== undefined)
			{
				id = attribs.id;
			}
			delete attribs['id'];

			/*
			if (Kekule.IO.CmlUtils.isDummyElementType(attribs.elementType))
				result = new Kekule.Pseudoatom(id, Kekule.PseudoatomType.DUMMY);
			else if (Kekule.IO.CmlUtils.isRGroupElementType(attribs.elementType))
			{
				result = new Kekule.RGroup(id);
			}
			else  // a normal atom
			{
				// in CML, an isotope attribute can be a mass number or a accurate mass, so round it
				// here to get a integer mass number
				var massNumber = attribs.isotope? Math.round(attribs.isotope): null;
				result = new Kekule.Atom(id, attribs.elementType, massNumber);

				// hydrogen count
				if (attribs.hydrogenCount !== undefined)
				{
					result.setHydrogenCount(parseInt(attribs.hydrogenCount));
					delete attribs['hydrogenCount'];
				}
			}
			*/
			// in CML, an isotope attribute can be a mass number or a accurate mass, so round it
			// here to get a integer mass number
			var massNumber = attribs.isotope? Math.round(attribs.isotope): null;
			result = Kekule.IO.CmlUtils.createNodeByCmdElementType(id, attribs.elementType, massNumber);
			delete attribs['elementType'];
			// hydrogen count
			if (attribs.hydrogenCount !== undefined)
			{
				if (result.setExplicitHydrogenCount)
					result.setExplicitHydrogenCount(parseInt(attribs.hydrogenCount, 10));
			}
			delete attribs['hydrogenCount'];

			// charge
			if (attribs.formalCharge)
			{
				result.setCharge(parseInt(attribs.formalCharge)); // in CML formalCharge has no partial ones, all int
			}
			delete attribs['formalCharge'];
			// title
			if (attribs.title)
			{
				result.setInfoValue('title', attribs.title);
			}
			delete attribs['title'];
			// role
			if (attribs.role)
			{
				result.setInfoValue('role', attribs.role);
			}
			delete attribs['role'];

			// coordinates
			var coord2D, coord3D;
			if ((attribs.x2 !== undefined) && (attribs.y2 !== undefined))  // has x2/y2
			{
				coord2D = {'x': parseFloat(attribs.x2), 'y': parseFloat(attribs.y2)};
			}
			else if (attribs.xy2)  // has xy2
			{
				var xy = Kekule.IO.CmlDomUtils.splitCmlArrayValue(attribs.xy2);
				if (xy.length == 2)
				{
					coord2D = {'x': parseFloat(xy[0]), 'y': parseFloat(xy[1])};
				}
			}
			delete attribs['x2'];
			delete attribs['y2'];
			delete attribs['xy2'];
			if ((attribs.x3 !== undefined) && (attribs.y3 !== undefined) && (attribs.z3 !== undefined))  // has x3/y3/z3
			{
				coord3D = {'x': parseFloat(attribs.x3), 'y': parseFloat(attribs.y3), 'z': parseFloat(attribs.z3)};
			}
			else if (attribs.xyz3)  // has xyz2
			{
				var xyz = Kekule.IO.CmlDomUtils.splitCmlArrayValue(attribs.xyz3);
				if (xyz.length == 3)
				{
					coord2D = {'x': parseFloat(xyz[0]), 'y': parseFloat(xyz[1]), 'z': parseFloat(xyz[2])};
				}
			}
			delete attribs['x3'];
			delete attribs['y3'];
			delete attribs['z3'];
			delete attribs['xyz3'];
			if (coord2D)
				result.setCoord2D(coord2D);
			if (coord3D)
				result.setCoord3D(coord3D);

			// TODO: ignore attribs: [occupancy, xFract, xyzFract, yFract, convention, dictRef, ref]
			// rest of attribs will be set to info property of result
			for (var keyName in attribs)
			{
				if (attribs.hasOwnProperty(keyName) && (typeof(attribs[keyName]) == 'string'))
					result.setInfoValue(keyName, attribs[keyName]);
			}
		}
		return result;
	},

	/** @private */
	_BOND_ATOM_REF_TEMP_FIELD: '__cml_atomRefs',
	/** @private */
	_BOND_BOND_REF_TEMP_FIELD: '__cml_bondRefs',

	/**
	 * Read <bondArray> element from molecule.
	 * @param {Object} molecule
	 * @param {Object} elem
	 * @param {Kekule.ChemStructureBuilder} structureBuilder
	 * @param {Kekule.DomHelper} domHelper
	 * @private
	 */
	readMoleculeBondArray: function(molecule, elem, structureBuilder, domHelper)
	{
		structureBuilder.setTarget(molecule);
		// check if has bond child, if true, in mode I or III
		var bondElems = domHelper.getElementsByTagNameNS(this.getCoreNamespaceURI(), 'bond', elem);
		if (bondElems.length > 0)  // in mode I or III
		{
			for (var i = 0, l = bondElems.length; i < l; ++i)
			{
				var bondElem = bondElems[i];
				var connector = this.readBond(molecule, bondElem, domHelper);
				structureBuilder.appendConnector(connector);
			}
		}
		else  // may in mode II or IV
		{
			var bonds = this.readArrayedBonds(molecule, elem, domHelper);
			for (var i = 0, l = bonds.length; i < l; ++i)
			{
				structureBuilder.appendConnector(bonds[i]);
			}
		}

		/*
		var bonds = molecule.getConnectors();
		for (var i = 0, l = bonds.length; i < l; ++i)
		{
			var bond = bonds[i];
			// add bond-atom relation
			var atomIds = bond[this._BOND_ATOM_REF_TEMP_FIELD];
			if (atomIds && atomIds.length)
			{
				for (j = 0, k = atomIds.length; j < k; ++j)
				{
					var refedAtom = molecule.getNodeById(atomIds[j]);
					if (refedAtom)
						bond.appendConnectedObj(refedAtom);
					else
						Kekule.raise(Kekule.ErrorMsg.ATOMID_NOT_EXISTS + atomIds[j]);
				}
			}
			delete bond[this._BOND_ATOM_REF_TEMP_FIELD];
			// as bond element may have refs to another not created bond or atom, handle this after all bonds are created
			var bondIds = bond[this._BOND_BOND_REF_TEMP_FIELD];
			if (bondIds && bondIds.length)
			{
				for (j = 0, k = bondIds.length; j < k; ++j)
				{
					var refedBond = molecule.getConnectorById(bondIds[j]);
					if (refedBond)
						bond.appendConnectedObj(refedBond);
					else
						Kekule.raise(Kekule.ErrorMsg.BONDID_NOT_EXISTS + bondIds[j]);
				}
			}
			delete bond[this._BOND_BOND_REF_TEMP_FIELD];
		}
		*/
	},

	/**
	 * Read and analysis an <bond> element of CML
	 * @param {Kekule.StructureFragment} molecule
	 * @param {Object} elem
	 * @param {Object} domHelper
	 * @returns {Kekule.Bond}
	 * @private
	 */
	readBond: function(molecule, elem, domHelper)
	{
		var result;
		var attribs = []; // store properties of this bond
		var hasChildInfoElems = false;  // in mode I, atom may has scalar, electron, atomParity... to store additional information
		// check if elem has string/integer/float children, if so, the old CML1 mode
		hasChildInfoElems = !Kekule.IO.CmlDomUtils.hasDirectCmlTypedElemChildren(elem, this.getCoreNamespaceURI());
		attribs = Kekule.IO.CmlDomUtils.fetchCmlElemAttributeValuesToJson(elem, Kekule.IO.CmlUtils.FILTER_TYPED_ELEM, true, domHelper);
		result = this.createStructureConnectorOfAttribs(molecule, attribs);

		if (hasChildInfoElems)  // additional info, check child elements
		{
			// TODO: currently only consider <scalar> and <bondStereo>
			var children = Kekule.DomUtils.getDirectChildElems(elem, null, null, this.getCoreNamespaceURI());
			for (var i = 0, l = children.length; i < l; ++i)
			{
				var elem = children[i];
				/*
				if (Kekule.IO.CmlDomUtils.isScalarElem(elem, this.getCoreNamespaceURI()))
				{
					var scalarInfo = this.readScalar(elem);
					// add scalar info to result
					var keys = Kekule.ObjUtils.getOwnedFieldNames(scalarInfo);
					for (var i = 0, l = keys.length; i < l; ++i)
					{
						result.setInfoValue(keys[i], scalarInfo[keys[i]]);
					}
				}
				else*/
				if (Kekule.DomUtils.getLocalName(elem) == 'bondStereo') // check bondStereo element
				{
					// TODO: haven't handle convertion and convertionValue attribs
					var cmlStereo = Kekule.DomUtils.getElementText(elem);
					if (!cmlStereo)
						cmlStereo = Kekule.IO.CmlDomUtils.getCmlElemAttribute(elem, 'conversionValue', Kekule.IO.CmlDomUtils.FILTER_TYPED_ELEM, domHelper);
					if (!cmlStereo)
						cmlStereo = Kekule.IO.CmlUtils.getCmlNsValueLocalPart(Kekule.IO.CmlDomUtils.getCmlElemAttribute(elem, 'dictRef', Kekule.IO.CmlDomUtils.FILTER_TYPED_ELEM, domHelper));
					var kStereo = Kekule.IO.CmlUtils.cmlBondStereoToKekule(cmlStereo);
					if ((kStereo != Kekule.BondStereo.NONE) && result.setStereo)
						result.setStereo(kStereo);
				}
				else
				{
					/*
					var reader = Kekule.IO.CmlElementReaderFactory.getReader(elem);
					reader.setCoreNamespaceURI(this.getCoreNamespaceURI());
					if (reader)
						reader.readElement(elem, result);
					*/
					this.readChildElementDef(elem, result);
				}
			}
		}

		return result;
	},

	/**
	 * Read array information and create all bonds
	 * @returns {Array} Array of Kekule.Bond
	 * @private
	 */
	readArrayedBonds: function(molecule, elem, domHelper)
	{
		var arrayedAttribNames = ['id', 'bondID', /*'atomRefs',*/ 'atomRef1', 'atomRef2', 'order', 'bondStereo'];
		var attribNames = ['id', 'id', /*'atomRefs',*/ 'atomRefs2', 'atomRefs2', 'order', 'bondStereo'];
		var bondAttribs = [];

		// handle atomRefs attrib first, as it may concern to multiple child elems
		var svalues = Kekule.IO.CmlDomUtils.getMultipleCmlElemAttribute(elem, 'atomRefs', Kekule.IO.CmlDomUtils.FILTER_TYPEDARRAY_ELEM, domHelper);
		if (svalues && svalues.length)
		{
			for (var i = 0, l = svalues.length; i < l; ++i)
			{
				var svalue = svalues[i];
				var values = Kekule.IO.CmlDomUtils.splitCmlArrayValue(svalue);;
				for (var j = 0, k = values.length; j < k; ++j)
				{
					if (!bondAttribs[j])
						bondAttribs[j] = {};
					if (bondAttribs[j]['atomRefs'] == undefined)
						bondAttribs[j]['atomRefs'] = [];
					(bondAttribs[j]['atomRefs']).push(values[j]);
				}
			}
		}

		for (var i = 0, l = arrayedAttribNames.length; i < l; ++i)
		{
			var svalue;
			var values = [];

			svalue = Kekule.IO.CmlDomUtils.getCmlElemAttribute(elem, arrayedAttribNames[i], Kekule.IO.CmlDomUtils.FILTER_TYPEDARRAY_ELEM, domHelper);
			if (svalue)
				values = Kekule.IO.CmlDomUtils.splitCmlArrayValue(svalue);

			//console.log(arrayedAttribNames[i], svalue, values);

			for (var j = 0, k = values.length; j < k; ++j)
			{
				if (!bondAttribs[j])
					bondAttribs[j] = {};
				if (values[j])
				{
					/*
					if (arrayedAttribNames[i] == 'atomRefs')
					{
						if (bondAttribs[j]['atomRefs'] == undefined)
							bondAttribs[j]['atomRefs'] = [];
						(bondAttribs[j]['atomRefs']).push(values[j]);
					}
					else
					*/
					if ((arrayedAttribNames[i] == 'atomRef1') || (arrayedAttribNames[i] == 'atomRef2'))
					{
						if (bondAttribs[j]['atomRefs2'] == undefined)
							bondAttribs[j]['atomRefs2'] = [];
						if (arrayedAttribNames[i] == 'atomRef1')
							bondAttribs[j]['atomRefs2'][0] = values[j];
						else
							bondAttribs[j]['atomRefs2'][1] = values[j];
					}
					else
						bondAttribs[j][attribNames[i]] = values[j];
				}
			}
		}

		var result = [];
		for (var i = 0, l = bondAttribs.length; i < l; ++i)
		{
			var bond = this.createStructureConnectorOfAttribs(molecule, bondAttribs[i]);
			if (bond)
				result.push(bond);
		}

		return result;
	},

	/**
	 * Create connector (mainly bond) by JSON attribs object.
	 * @param {Kekule.StructureFragment} molecule
	 * @param {Hash} attribs
	 * @returns {Kekule.ChemStructureConnector}
	 * @private
	 */
	createStructureConnectorOfAttribs: function(molecule, attribs)
	{
		var result;
		var id, bondOrder;
		if (attribs.id)
		{
			id = attribs.id;
		}
		delete attribs['id'];
		if (attribs.order !== undefined)
		{
			bondOrder = Kekule.IO.CmlUtils.cmlBondOrderToKekule(attribs.order);
		}
		delete attribs['order'];
		result = new Kekule.Bond(id, null, bondOrder);

		if (attribs.bondStereo)
		{
			// TODO: haven't handle convertion and convertionValue attribs
			var kStereo = Kekule.IO.CmlUtils.cmlBondStereoToKekule(attribs.bondStereo);
			if ((kStereo != Kekule.BondStereo.NONE) && result.setStereo)
				result.setStereo(kStereo);
		}
		delete attribs['bondStereo'];

		// check referenced atoms
		for (var i = 0 , l = Kekule.IO.CML.ATOMS_REF_ATTRIBS.length; i < l; ++i)
		{
			var arName = Kekule.IO.CML.ATOMS_REF_ATTRIBS[i];
			if (attribs[arName] != undefined)
			{
				var atomIds = Kekule.IO.CmlDomUtils.splitCmlArrayValue(attribs[arName]);
				// as atoms may not added to molecule yet, we store the ids here to handle it later
				if (atomIds.length > 0)
					result[this._BOND_ATOM_REF_TEMP_FIELD] = atomIds;
				delete attribs[arName];
				break;
			}
		}
		// check referenced bonds
		for (var i = 0, l = Kekule.IO.CML.BONDS_REF_ATTRIBS.length; i < l; ++i)
		{
			var arName = Kekule.IO.CML.BONDS_REF_ATTRIBS[i];
			if (attribs[arName] != undefined)
			{
				var bondIds = Kekule.IO.CmlDomUtils.splitCmlArrayValue(attribs[arName]);
				// as bond are not added to molecule yet, we store the ids here to handle it later
				if (bondIds.length > 0)
					result[this._BOND_BOND_REF_TEMP_FIELD] = bondIds;
				delete attribs[arName];
				break;
			}
		}

		// TODO: ignore attribs: [convention, dictRef, ref]
		// rest of attribs will be set to info property of result
		for (var keyName in attribs)
		{
			if (attribs.hasOwnProperty(keyName) && (typeof(attribs[keyName]) == 'string'))
				result.setInfoValue(keyName, attribs[keyName]);
		}

		return result;
	},

	/**
	 * Read child formula element.
	 * @param {Object} molecule
	 * @param {Object} elem
	 * @param {Object} domHelper
	 * @private
	 */
	readFormula: function(molecule, elem, domHelper)
	{
		//var reader = Kekule.IO.CmlElementReaderFactory.getReader(elem);
		var reader = this.doGetChildElementReader(elem);
		if (reader)
		{
			//reader.setCoreNamespaceURI(this.getCoreNamespaceURI());
			this.copySettingsToChildHandler(reader);
			//reader.setDomHelper(domHelper);
			var formula = reader.readElement(elem, molecule, this);
			if (formula)
				molecule.setFormula(formula);
		}
	},
	/**
	 * Read formula info directly from formula attrib of <molecule>.
	 * For example <molecule formula="H 2 O 1" />.
	 * @param {Object} molecule
	 * @param {String} concise
	 */
	readFormulaAttrib: function(molecule, concise)
	{
		//var reader = Kekule.IO.CmlElementReaderFactory.getReader('formula');
		var reader = this.doGetChildElementReader('formula');
		if (reader)
		{
			var formula = reader.readConsice ? reader.readConsice(concise) : null;
			if (formula)
				molecule.setFormula(formula);
		}
	}
});

/**
 * CML <molecule> element writer for outputting {@link Kekule.Molecule} or {@link Kekule.CompositeMolecule}.
 * @class
 * @augments Kekule.IO.CmlElementWriter
 *
 * @property {Bool} allowCascadeGroup If true,sub group in molecule will be output in nested element,
 *   otherwise, all atoms in molecule will be put togather regardless of sub groups.
 */
Kekule.IO.CmlMoleculeWriter = Class.create(Kekule.IO.CmlElementWriter,
/** @lends Kekule.IO.CmlMoleculeWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlMoleculeWriter',
	/** @private */
	initProperties: function()
	{
		this.defineProp('allowCascadeGroup', {'dataType': DataType.BOOL});
	},
	/** @private */
	doCreateElem: function(obj, parentElem)
	{
		return this.createChildElem('molecule', parentElem);
	},
	/** @private */
	doWriteObject: function(obj, targetElem, options)
	{
		return this.writeMolecule(obj, targetElem, options);
	},
	writeMolecule: function(molecule, targetElem, options)
	{
		var result;
		this.writeMoleculeAttribs(molecule, targetElem);
		if (molecule instanceof Kekule.CompositeMolecule)
			result = this.writeCompositeMolecule(molecule, targetElem, options);
		else  // Kekule.Molecule
			result = this.writeMoleculeCore(molecule, targetElem, options);
		return result;
	},
	writeMoleculeAttribs: function(molecule, targetElem)
	{
		var attribs = [];
		if (molecule.getCharge())
			attribs.push({'key': 'formalCharge', 'value': molecule.getCharge()});

		var cmlInfoAttribs = ['title', 'dictRef', 'chirality', 'ref', 'spinMultiplicity', 'symmetryOriented', 'role'];
		for (var i = 0, l = cmlInfoAttribs.length; i < l; ++i)
		{
			var key = cmlInfoAttribs[i];
			var value = molecule.getInfoValue(key);
			if (!Kekule.ObjUtils.isUnset(value))
				attribs.push({'key': key, 'value': molecule.getInfoValue(key)});
		}
		// write to CML element
		for (var i = 0, l = attribs.length; i < l; ++i)
		{
			Kekule.IO.CmlDomUtils.setCmlElemAttribute(targetElem, attribs[i].key, attribs[i].value, this.getDomHelper());
		}
	},
	/**
	 * Write composite molecule (with sub molecules)
	 */
	writeCompositeMolecule: function(compositeMolecule, targetElem, options)
	{
		var subMolGroup = compositeMolecule.getSubMolecules();
		for (var i = 0, l = subMolGroup.getItemCount(); i < l; ++i)
		{
			var subItem = subMolGroup.getItemAt(i);
			var subMol = subItem.obj;
			//var subElem = this.createChildElem('molecule', targetElem);
			//this.writeObject(subMol, subElem);
			var subElem = this.writeObject(subMol, targetElem, options);
			if (subItem.amount)
				Kekule.IO.CmlDomUtils.setCmlElemAttribute(subElem, 'amount', subItem.amount, this.getDomHelper());
		}
		return targetElem;
	},
	/**
	 * Write a pure molecule.
	 * @private
	 */
	writeMoleculeCore: function(molecule, targetElem, options)
	{
		//console.log('has F:', molecule.hasFormula, molecule instanceof ObjectEx);
		if (molecule.hasFormula())
		{
			var formula = molecule.getFormula();
			//var formulaWriter = Kekule.IO.CmlElementWriterFactory.getWriter(formula);
			//this.copySettingsToChildHandler(formulaWriter);
			var formulaWriter = this.doGetChildObjectWriter(formula);
			formulaWriter.writeObject(formula, targetElem, options);
		}
		if (molecule.hasCtab())
		{
			this.writeCtab(molecule.getCtab(), molecule, targetElem, options);
		}
	},
	/**
	 * Write Ctab nodes and connectors to element.
	 * @param {Object} ctab
	 * @param {Object} elem
	 */
	writeCtab: function(ctab, molecule, elem, options)
	{
		// firstly we should make every nodes and connectors in ctab has a unique Id to be refed
		this.identifyObjsInCtab(ctab, molecule);
		// nodes
		var nodes = this.getAllowCascadeGroup()? ctab.getNodes(): ctab.getLeafNodes();
		if (nodes.length > 0)
		{
			var atomsElem = this.createChildElem('atomArray', elem);
			for (var i = 0, l = nodes.length; i < l; ++i)
				this.writeCtabNode(nodes[i], atomsElem, options);
		}
		// connectors
		var connectors = this.getAllowCascadeGroup()? ctab.getConnectors(): ctab.getAllChildConnectors();
		if (connectors.length > 0)
		{
			var bondsElem = this.createChildElem('bondArray', elem);
			for (var i = 0, l = connectors.length; i < l; ++i)
				this.writeCtabConnector(connectors[i], bondsElem, options);
		}
	},
	/** @private */
	writeCtabNode: function(node, elem, options)
	{
		var result = this.createChildElem('atom', elem);
		this.writeObjId(node, result);
		// symbol
		var elementType = Kekule.IO.CmlUtils.getNodeElementType(node);
		Kekule.IO.CmlDomUtils.setCmlElemAttribute(result, 'elementType', elementType, this.getDomHelper());
		// mass number
		var massNumber = node.getMassNumber? node.getMassNumber(): null;
		if (massNumber)
			Kekule.IO.CmlDomUtils.setCmlElemAttribute(result, 'isotope', massNumber, this.getDomHelper());
		// hydrongen count
		var hcount = node.getExplicitHydrogenCount? node.getExplicitHydrogenCount(): null;
		if (!Kekule.ObjUtils.isUnset(hcount))
			Kekule.IO.CmlDomUtils.setCmlElemAttribute(result, 'hydrogenCount', hcount, this.getDomHelper());
		// charge
		var charge = node.getCharge? node.getCharge(): null;
		if (charge)
			Kekule.IO.CmlDomUtils.setCmlElemAttribute(result, 'formalCharge', charge, this.getDomHelper());
		// TODO: radical was ignored, as CML do not have corresponding attribute
		// parity
		var parity = node.getParity? node.getParity(): null;
		if (parity)  // stereo center, and if stereo center is perceived, the whole molecule should be standardized
		{
			//var neighbors = node.linkedChemNodes();
			// TODO: how to handle atomRef4 attribute when there is a implicit H?
		}
		// title
		var title = node.getInfoValue? node.getInfoValue('title'): null;
		if (title)
			Kekule.IO.CmlDomUtils.setCmlElemAttribute(result, 'title', title, this.getDomHelper());
		// role
		var role = node.getInfoValue? node.getInfoValue('role'): null;
		if (role)
			Kekule.IO.CmlDomUtils.setCmlElemAttribute(result, 'role', role, this.getDomHelper());
		// coordinates
		if (node.hasCoord2D && node.hasCoord2D())
		{
			var coord2D = node.getAbsCoord2D();
			Kekule.ObjUtils.isUnset(coord2D.x)? null: Kekule.IO.CmlDomUtils.setCmlElemAttribute(result, 'x2', coord2D.x, this.getDomHelper());
			Kekule.ObjUtils.isUnset(coord2D.y)? null: Kekule.IO.CmlDomUtils.setCmlElemAttribute(result, 'y2', coord2D.y, this.getDomHelper());
		}
		if (node.hasCoord3D && node.hasCoord3D())
		{
			var coord3D = node.getAbsCoord3D();
			Kekule.ObjUtils.isUnset(coord3D.x)? null: Kekule.IO.CmlDomUtils.setCmlElemAttribute(result, 'x3', coord3D.x, this.getDomHelper());
			Kekule.ObjUtils.isUnset(coord3D.y)? null: Kekule.IO.CmlDomUtils.setCmlElemAttribute(result, 'y3', coord3D.y, this.getDomHelper());
			Kekule.ObjUtils.isUnset(coord3D.z)? null: Kekule.IO.CmlDomUtils.setCmlElemAttribute(result, 'z3', coord3D.z, this.getDomHelper());
		}
		// some infoValues that need to be put to attribute
		var cmlAdditionalAttribs = ['occupancy', 'xFract', 'xyzFract', 'yFract', 'convention', 'dictRef', 'ref'];
		for (var i = 0, l = cmlAdditionalAttribs.length; i < l; ++i)
		{
			var key = cmlAdditionalAttribs[i];
			var value = node.getInfoValue(key);
			if (value)
				Kekule.IO.CmlDomUtils.setCmlElemAttribute(result, key, value, this.getDomHelper());
		}
		// write addiitioanl meta
		this.writeObjAdditionalInfo(node, result, options);
		return result;
	},
	/** @private */
	writeCtabConnector: function(connector, elem, options)
	{
		var invertAtoms = false;
		var result = this.createChildElem('bond', elem);
		this.writeObjId(connector, result);
		// order
		var order = connector.getBondOrder? connector.getBondOrder(): null;
		if (order)
		{
			var cmlOrder = Kekule.IO.CmlUtils.kekuleBondOrderToCml(order);
			if (cmlOrder)
				Kekule.IO.CmlDomUtils.setCmlElemAttribute(result, 'order', cmlOrder, this.getDomHelper());
		}
		// stereo
		var stereo = connector.getStereo? connector.getStereo(): null;
		if (stereo)
		{
			var cmlStereo = Kekule.IO.CmlUtils.kekuleBondStereoToCml(stereo);
			if (cmlStereo.value)
			{
				//Kekule.IO.CmlDomUtils.setCmlElemAttribute(result, 'bondStereo', cmlStereo.value, this.getDomHelper());
				// stereo should be put in child element according to CML standard
				var stereoElem = this.createChildElem('bondStereo', result);
				Kekule.DomUtils.setElementText(stereoElem, cmlStereo.value);
				if (cmlStereo.invert)
					invertAtoms = true;
			}
			// NOTE later we will check cmlStereo.invert
		}
		// ref atom / bond ids
		var refAtomIds = [];
		var refBondIds = [];
		for (var i = 0, l = connector.getConnectedObjCount(); i < l; ++i)
		{
			var obj = connector.getConnectedObjAt(i);
			if (obj.getId && obj.getId())
			{
				var id = obj.getId();
				if (obj instanceof Kekule.ChemStructureNode)
				{
					if (invertAtoms)
						refAtomIds.unshift(id);
					else
						refAtomIds.push(id);
				}
				else if (obj instanceof Kekule.ChemStructureConnector)
					refBondIds.push(id);
			}
		}
		var length = refAtomIds.length;
		if (length)
		{
			var attribName =
				(length == 1)? 'atomRefs':
				((length >= 2) && (length <= 4))? 'atomRefs' + length: 'atomRefs';
			Kekule.IO.CmlDomUtils.setCmlElemAttribute(result, attribName,
				Kekule.IO.CmlDomUtils.mergeToCmlArrayValue(refAtomIds), this.getDomHelper());
		}
		var length = refBondIds.length;
		if (length)
		{
			//var attribName = (length == 1)? 'bondRefs': 'bondRefs';
			var attribName = 'bondRefs';
			Kekule.IO.CmlDomUtils.setCmlElemAttribute(result, attribName,
				Kekule.IO.CmlDomUtils.mergeToCmlArrayValue(refBondIds), this.getDomHelper());
		}

		// some infoValues that need to be put to attribute
		var cmlAdditionalAttribs = ['convention', 'dictRef', 'ref'];
		for (var i = 0, l = cmlAdditionalAttribs.length; i < l; ++i)
		{
			var key = cmlAdditionalAttribs[i];
			var value = connector.getInfoValue(key);
			if (value)
				Kekule.IO.CmlDomUtils.setCmlElemAttribute(result, key, value, this.getDomHelper());
		}

		this.writeObjAdditionalInfo(connector, result, options);
		return result;
	},
	/**
	 * Set id of every objects in ctab.
	 * @private
	 */
	identifyObjsInCtab: function(ctab, molecule)
	{
		for (var i = 0, l = ctab.getNodeCount(); i < l; ++i)
		{
			var node = ctab.getNodeAt(i);
			if (!node.getId())
				this.autoIdentifyForObj(node, molecule);
			if (ctab.isSubFragment(node) && node.hasCtab && node.hasCtab())
				this.identifyObjsInCtab(node.getCtab(), molecule);
		}
		for (var i = 0, l = ctab.getConnectorCount(); i < l; ++i)
		{
			var connector = ctab.getConnectorAt(i);
			if (!connector.getId())
				this.autoIdentifyForObj(connector, molecule);
		}
	}
});
/**
 * A Class var to store seed to generate UIDs.
 * @private
 */
Kekule.IO.CmlMoleculeWriter._UID_SEED = null;

/**
 * Reader to read <reactant>, <product> and <substance> element inside <reaction>.
 * @class
 * @augments Kekule.IO.CmlElementReader
 */
Kekule.IO.CmlReactionReagentReader = Class.create(Kekule.IO.CmlElementReader,
/** @lends Kekule.IO.CmlReactionReagentReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlReactionReagentReader',
	/** @private */
	doReadElement: function(elem, parentObj, parentReader, options)
	{
		return this.readReagent(elem, parentReader, this.getDomHelper());
	},
	/** @private */
	readReagent: function(elem, parentReadr, domHelper)
	{
		var map = null;
		// read sub <molecule> element first
		var molElems = Kekule.DomUtils.getDirectChildElems(elem, null, 'molecule', this.getCoreNamespaceURI());
		if (molElems && molElems.length)  // has molecule
		{
			var molElem = molElems[molElems.length - 1];
			//var reader = Kekule.IO.CmlElementReaderFactory.getReader(molElem);
			//this.copySettingsToChildHandler(reader);
			var reader = this.doGetChildElementReader(molElem);
			var molecule = reader.readElement(molElem, null, this);
			if (molecule)
			{
				map = {};
				Kekule.RoleMapUtils.setItem(map, molecule);
				// get attributes
				this.readReagentAttribs(map, elem, domHelper);
			}
		}
		else // no explicit molecule, bypass elem
			;
		return map;
	},
	/**
	 * Read attributes of elem and fetch them to current map.
	 * @private
	 */
	readReagentAttribs: function(map, elem, domHelper)
	{
		var attribs = Kekule.IO.CmlDomUtils.fetchCmlElemAttributeValuesToJson(elem,
			Kekule.IO.CmlDomUtils.FILTER_TYPED_ELEM, true, domHelper);
		var keys = Kekule.ObjUtils.getOwnedFieldNames(attribs);
		for (var i = 0, l = keys.length; i < l; ++i)
		{
			var key = keys[i];
			var value = attribs[key];
			switch (key)
			{
				case 'role': map.role = Kekule.IO.CmlUtils.reagentRoleToKekule(value); break;
				case 'amount':
				case 'count':  map.amount = parseFloat(value); break;
				default: map[key] = value;
			}
		}
		return map;
	}
});

/**
 * Reader to read <reaction> element.
 * @class
 * @augments Kekule.IO.CmlElementReader
 */
Kekule.IO.CmlReactionReader = Class.create(Kekule.IO.CmlElementReader,
/** @lends Kekule.IO.CmlReactionReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlReactionReader',
	/** @private */
	doReadElement: function(elem, parentObj, parentReader, options)
	{
		return this.readReaction(elem, this.getDomHelper());
	},
	/**
	 * Read <reaction> element and create a {@link Kekule.Reaction} object.
	 * @param {Object} elem
	 * @param {Object} domHelper
	 * @returns {Kekule.Reaction}
	 * @private
	 */
	readReaction: function(elem, domHelper)
	{
		var result = new Kekule.Reaction();
		var children = Kekule.DomUtils.getDirectChildElems(elem, null, null, this.getCoreNamespaceURI());
		for (var i = 0, l = children.length; i < l; ++i)
		{
			if (this.isComponentListElem(children[i]))
				this.readComponentList(result, children[i], domHelper);
			else  // other normal children
				this.readChildElement(children[i], result);
		}
		// reaction element attribs
		var attribs = Kekule.IO.CmlDomUtils.fetchCmlElemAttributeValuesToJson(elem,
			Kekule.IO.CmlDomUtils.FILTER_TYPED_ELEM, null, this.getDomHelper());
		var attribKeys = Kekule.ObjUtils.getOwnedFieldNames(attribs);
		for (var i = 0, l = attribKeys.length; i < l; ++i)
		{
			var key = attribKeys[i];
			var value = attribs[key];
			switch (key)
			{
				case 'name': result.setName(value); break;
				case 'title': result.setTitle(value); break;
				case 'type': result.setReactionType(value); break;
				case 'yield': result.setYield(parseFloat(value)); break;
				default: // ignored: [dictRef, convention, format, ref, role, type, state, yield]
					result.setInfoValue(key, value);
			}
		}
		return result;
	},
	/**
	 * Read <reactantList>/<productList>/<substanceList>/<conditionList>
	 * @param {Kekule.Reaction} reaction
	 * @param {Object} elem
	 * @param {Object} domHelper
	 * @private
	 */
	readComponentList: function(reaction, elem, domHelper)
	{
		var compName = this.getListElemComponentName(elem);
		var compArray = reaction.getComponentArray(compName, true);
		if (compArray)
		{
			// get direct children of elem and analysis
			var children = Kekule.DomUtils.getDirectChildElems(elem, null, null, this.getCoreNamespaceURI());
			for (var i = 0, l = children.length; i < l; ++i)
			{
				// childObj is generally objects returned by CmlReactionReagentReader, but condition list be contains objects directly
				var childObj = this.readChildElement(children[i], /*reaction*/compArray);
				if (childObj)
				{
					if ((compName == Kekule.ReactionComponent.CONDITION) && (childObj instanceof ObjectEx)) // not returned by CmlReactionReagentReader
						reaction.appendItem(compName, childObj);
					else
						reaction.appendMap(compName, childObj);
				}
			}
		}
	},
	/**
	 * Check if element is <reactantList>/<productList>/<substanceList>/<conditionList>
	 * @param {Object} elem
	 * @returns {Bool}
	 * @private
	 */
	isComponentListElem: function(elem)
	{
		return ['reactantList', 'productList', 'substanceList', 'conditionList'].indexOf(Kekule.DomUtils.getLocalName(elem)) >= 0;
	},
	/**
	 * Find out the list is corresponding to which component in reaction.
	 * @param {Object} elem
	 * @returns {String}
	 * @private
	 */
	getListElemComponentName: function(elem)
	{
		switch (Kekule.DomUtils.getLocalName(elem))
		{
			case 'reactantList': return Kekule.ReactionComponent.REACTANT;
			case 'productList': return Kekule.ReactionComponent.PRODUCT;
			case 'conditionList': return Kekule.ReactionComponent.CONDITION;
			//case 'substanceList':
			default:
				return Kekule.ReactionComponent.SUBSTANCE;
		}
	}
});

/**
 * Reader to write {@link Kekule.Reaction} to CML <reaction> element.
 * @class
 * @augments Kekule.IO.CmlElementWriter
 */
Kekule.IO.CmlReactionWriter = Class.create(Kekule.IO.CmlElementWriter,
/** @lends Kekule.IO.CmlReactionWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlReactionWriter',
	/** @private */
	doCreateElem: function(obj, parentElem)
	{
		return this.createChildElem('reaction', parentElem);
	},
	/** @private */
	doWriteObject: function(obj, targetElem, options)
	{
		return this.writeReaction(obj, targetElem, options);
	},
	/** @private */
	writeReaction: function(reaction, targetElem, options)
	{
		var reactionCompNames = [
			Kekule.ReactionComponent.REACTANT,
			Kekule.ReactionComponent.PRODUCT,
			Kekule.ReactionComponent.SUBSTANCE,
			Kekule.ReactionComponent.CONDITION
		];
		for (var i = 0, l = reactionCompNames.length; i < l; ++i)
			this.writeCompList(reaction, reactionCompNames[i], targetElem, options);
		this.writeReactionAttribs(reaction, targetElem, options);
		return targetElem;
	},
	/**
	 * Write attribs of reaction directly to targetElem's attributes
	 * @private
	 */
	writeReactionAttribs: function(reaction, targetElem, options)
	{
		var attribs = [];
		reaction.getName()? attribs.push({'key': 'name', 'value': reaction.getName()}): null;
		reaction.getTitle()? attribs.push({'key': 'title', 'value': reaction.getTitle()}): null;
		reaction.getReactionType()? attribs.push({'key': 'type', 'value': reaction.getReactionType()}): null;
		reaction.getYield()? attribs.push({'key': 'yield', 'value': reaction.getYield()}): null;

		var infoAttribs = ['dictRef', 'convention', 'format', 'ref', 'role', 'type',
			'state', 'yield', 'atomMap', 'electronMap'];
		for (var i = 0, l = infoAttribs.length; i < l; ++i)
		{
			if (!Kekule.ObjUtils.isUnset(reaction.getInfoValue(infoAttribs[i])))
				attribs.push({'key': infoAttribs[i], 'value': reaction.getInfoValue(infoAttribs[i])});
		}

		for (var i = 0, l = attribs.length; i < l; ++i)
		{
			Kekule.IO.CmlDomUtils.setCmlElemAttribute(targetElem, attribs[i].key, attribs[i].value, this.getDomHelper());
		}
	},
	/**
	 * Write reactant, product, substance or condition list to targetElem.
	 * @private
	 */
	writeCompList: function(reaction, compName, targetElem, options)
	{
		if (reaction.getComponentItemCount(compName) <= 0)  // no component inside, skip
			return null;
		else // really has component inside
		{
			var cmlTagName = this.getReactionComponentCmlName(compName);
			// create list element
			var listElem = this.createChildElem(cmlTagName + 'List', targetElem);
			// write each component
			for (var i = 0, l = reaction.getComponentItemCount(compName); i < l; ++i)
			{
				var compMap = reaction.getMapAt(compName, i);
				var obj = reaction.getMapItemAt(compName, i);
				if (compMap && obj)
				{
					var elem;
					// conditionList do not need child <condition> element,
					// while reactant, product and substance do need them
					if (compName != Kekule.ReactionComponent.CONDITION)
					{
						elem = this.createChildElem(cmlTagName, listElem);
						// and need to set amount / role attribs as well
						if (!Kekule.ObjUtils.isUnset(compMap.amount))
							Kekule.IO.CmlDomUtils.setCmlElemAttribute(elem, 'amount', compMap.amount, this.getDomHelper());
						if (compMap.role)
							Kekule.IO.CmlDomUtils.setCmlElemAttribute(elem, 'role', Kekule.IO.CmlUtils.kekuleReagentRoleToCml(compMap.role), this.getDomHelper());
					}
					else  // condition
						elem = listElem;
					//var writer = Kekule.IO.CmlElementWriterFactory.getWriter(obj);
					var writer = this.doGetChildObjectWriter(obj);
					if (writer)
					{
						//this.copySettingsToChildHandler(writer);
						writer.writeObject(obj, elem, options);
					}
				}
			}
		}
	},

	/**
	 * Find out the CML tagName corresponding to certain component in reaction.
	 * @param {String} compName
	 * @returns {String}
	 * @private
	 */
	getReactionComponentCmlName: function(compName)
	{
		switch (compName)
		{
			case Kekule.ReactionComponent.REACTANT: return 'reactant';
			case Kekule.ReactionComponent.PRODUCT: return 'product';
			case Kekule.ReactionComponent.CONDITION: return 'condition';
			//case Kekule.ReactionComponent.SUBSTANCE:
			default:
				return 'substance';
		}
	}
});

/**
 * Reader to read list (<list>/<moleculeList>/<reactionList>...) element of CML.
 * @class
 * @augments Kekule.IO.CmlBaseListReader
 */
Kekule.IO.CmlListReader = Class.create(Kekule.IO.CmlBaseListReader,
/** @lends Kekule.IO.CmlListReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlListReader',
	/** @ignore */
	doCreateList: function(elem)
	{
		switch (Kekule.DomUtils.getLocalName(elem))
		{
			case 'moleculeList': return new Kekule.MoleculeList(); break;
			case 'reactionList': return new Kekule.ReactionList(); break;
			default:
				return new Kekule.ChemObjList();
		}
	},
	/** @ignore */
	doAppendObjToList: function(obj, list)
	{
		if (list && list.append)
			list.append(obj);
		else
			this.tryApplySuper('doAppendObjToList', [obj, list]);
		return list;
	}
	/* @private */
	/*
	readList: function(list, elem, parentReadr, domHelper)
	{
		var children = Kekule.DomUtils.getDirectChildElems(elem, null, null, this.getCoreNamespaceURI());
		if (children)
		{
			for (var i = 0, l = children.length; i < l; ++i)
			{
				var child = children[i];
				var reader = Kekule.IO.CmlElementReaderFactory.getReader(child);
				if (reader)
				{
					this.copySettingsToChildHandler(reader);
					var obj = reader.readElement(child, null, this);
					if (obj)
						list.append(obj);
				}
			}
		}
		return list;
	}
	*/
});

/**
 * Writer to write {@link Kekule.MoleculeList}, {@link Kekule.ReactionList} and so on to CML <list> series elements.
 * @class
 * @augments Kekule.IO.CmlBaseListWriter
 */
Kekule.IO.CmlListWriter = Class.create(Kekule.IO.CmlBaseListWriter,
/** @lends Kekule.IO.CmlListWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlListWriter',
	/* @private */
	/*
	doCreateElem: function(obj, parentElem)
	{
		var tagName;
		switch (DataType.getType(obj))
		{
			case 'Kekule.MoleculeList': tagName = 'moleculeList'; break;
			case 'Kekule.ReactionList': tagName = 'reactionList'; break;
			default: tagName = 'list';  // ChemObjList
		}
		return this.createChildElem(tagName, parentElem);
	},
	*/
	/** @ignore */
	doGetListElemTagName: function(obj, parentElem)
	{
		var tagName;
		switch (DataType.getType(obj))
		{
			case 'Kekule.MoleculeList': tagName = 'moleculeList'; break;
			case 'Kekule.ReactionList': tagName = 'reactionList'; break;
			default: tagName = this.tryApplySuper('doGetListElemTagName', [obj, parentElem]);  // ChemObjList
		}
		return tagName;
	}
	/* @private */
	/*
	doWriteObject: function(obj, targetElem)
	{
		var list = Kekule.ChemStructureUtils.getChildStructureObjs(obj, false);
		return this.writeList(list, targetElem);
	},
	*/
	/*
	 * Write list items to listElem.
	 * @private
	 */
	/*
	writeList: function(list, listElem)
	{
		for (var i = 0, l = list.length; i < l; ++i)
		{
			var item = list[i];
			if (item)
			{
				var writer = Kekule.IO.CmlElementWriterFactory.getWriter(item);
				if (writer)
				{
					this.copySettingsToChildHandler(writer);
					writer.writeObject(item, listElem);
				}
			}
		}
		return listElem;
	}
	*/
});

/**
 * Writer to write list object directly to parent element (usually a <cml> root).
 * @class
 * @augments Kekule.IO.CmlBaseListWriter
 */
Kekule.IO.CmlTransparentListWriter = Class.create(Kekule.IO.CmlBaseListWriter,
/** @lends Kekule.IO.CmlTransparentListWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlTransparentListWriter',
	/** @ignore */
	doGetListElemTagName: function(obj, parentElem)
	{
		return null;
	}
});

/**
 * Reader to read <cml> element.
 * @class
 * @augments Kekule.IO.CmlElementReader
 */
Kekule.IO.CmlRootReader = Class.create(Kekule.IO.CmlElementReader,
/** @lends Kekule.IO.CmlRootReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlRootReader',
	/** @private */
	doReadElement: function(elem, parentObj, parentReader, options)
	{
		this.analysisElem(elem);
		// iterate through elem and direct children and find first readable one
		var reader;
		if (Kekule.DomUtils.getLocalName(elem) != 'cml')
			reader = this.getReader(elem);
		if (reader)
			return reader.readElement(elem, null, this, options);
		else
		{
			var enableReadList = options.defaultRootObjListHolder && options.enableReadRootObjList;
			var resultObjs = [];
			var children = Kekule.DomUtils.getDirectChildElems(elem, null, null, this.getCoreNamespaceURI());
			if (children)
			{
				for (var i = 0, l = children.length; i < l; ++i)
				{
					reader = this.getReader(children[i]);
					if (reader)
					{
						var obj = reader.readElement(children[i], null, this, options);
						if (!enableReadList)
						{
							return obj;
							break;
						}
						else
						{
							resultObjs.push(obj);
						}
					}
				}
				if (resultObjs.length <= 0)
					return null;
				if (resultObjs.length <= 1)  // only when readable obj, return it directly
					return resultObjs[0];
				else  // return obj list
				{
					return this._createChildObjsHolder(resultObjs, options.defaultRootObjListHolder);
				}
			}
		}
		return null;
	},
	/**
	 * Get a suitable reader for elem.
	 * @private
	 */
	getReader: function(elem)
	{
		/*
		var reader = Kekule.IO.CmlElementReaderFactory.getReader(elem);
		if (reader)
		{
			this.copySettingsToChildHandler(reader);
			return reader;
		}
		return null;
		*/
		return this.doGetChildElementReader(elem);
	},
	/**
	 * Init domHelper, analysis root element and find the suitable namespace.
	 * @private
	 */
	analysisElem: function(rootElem)
	{
		var domHelper = this.getDomHelper();
		domHelper.setForceAnalysisDoc(true);  // force analysis doc even in Gecko and Webkit to get namespaces info
		this.getDomHelper().setRootElement(rootElem);
		// check namespaces info, find out which is for CML CORE
		var namespaces = domHelper.getNamespaces();
		var legalCoreUri = null;
		for (var i = 0, l = namespaces.length; i < l; ++i)
		{
			var uri = namespaces[i].namespaceURI;
			if (Kekule.IO.CML.LEGAL_CORE_NAMESPACE_URIS.indexOf(uri) >= 0)  // find
			{
				legalCoreUri = uri;
				break;
			}
		}
		this.setCoreNamespaceURI(legalCoreUri || null);
		this.setNamespaces(namespaces);
	}
});

/**
 * Reader to write {@link Kekule.ChemDocument} to CML <cml> element.
 * @class
 * @augments Kekule.IO.CmlElementWriter
 */
Kekule.IO.CmlRootWriter = Class.create(Kekule.IO.CmlElementWriter,
/** @lends Kekule.IO.CmlRootWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlRootWriter',
	/** @private */
	/*
	doGetCoreNamespaceURI: function()
	{
		var result = this.getPropStoreFieldValue('coreNamespaceURI');
		if (!result)  // return a default one
			result = Kekule.IO.CML.CML3_SCHEMA_NAMESPACE_URI;
		return result;
	},
	*/
	/**
	 * Get a suitable writer for obj.
	 * @private
	 */
	getWriter: function(obj)
	{
		/*
		var writer = Kekule.IO.CmlElementWriterFactory.getWriter(obj);
		if (writer)
		{
			this.copySettingsToChildHandler(writer);
			return writer;
		}
		return null;
		*/
		return this.doGetChildObjectWriter(obj);
	},
	/** @private */
	/*
	doCreateElem: function(obj, parentElem)
	{
		if (parentElem && (Kekule.DomUtils.getLocalName(parentElem) == 'cml'))  // already a cml root
			return null;
		else
			return this.createChildElem('cml', parentElem);
	},
	*/
	/** @private */
	/*
	doWriteObject: function(obj, targetElem)
	{
		var writer = this.getWriter(obj);
		if (writer)
			return writer.writeObject(obj, targetElem);
		else
			return null;
	},
	*/
	/** @private **/
	writeObject: function(/*$super,*/ obj, parentElem, options)
	{
		// initialize domHelper
		var domHelper = this.getDomHelper();
		domHelper.setForceAnalysisDoc(true);
		this.getDomHelper().setRootElement(parentElem);

		var o;
		/*
		if (obj.docObj)  // obj is a chem space
			o = obj.docObj;
		*/
		if (obj instanceof Kekule.ChemSpace)
			o = obj.getRoot();
		else
			o = obj;

		var writer = this.getWriter(o);
		if (writer)
			return writer.writeObject(o, parentElem, options);
		else
			return null;
		//return $super(obj, parentElem, doc);
	}
});

/**
 * Reader for CML document.
 * Use CmlReader.readData() can retrieve a suitable Kekule.ChemObject.
 * Data fetch in can be a string, reader will parse it to XML automatically;
 *   otherwise it should be a XML document or XML element.
 * @class
 * @augments Kekule.IO.ChemDataReader
 */
Kekule.IO.CmlReader = Class.create(Kekule.IO.ChemDataReader,
/** @lends Kekule.IO.CmlReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlReader',
	/** @private */
	initProperties: function()
	{
		// a private property, storing the id-obj map when reading, used for building up objRef relations
		this.defineProp('objIdMap', {
			'dataType': DataType.HASH,
			'serializable': false
		});
	},
	/** @private */
	doReadData: function(data, dataType, format, options)
	{
		var rootElem;
		if (dataType != Kekule.IO.ChemDataType.DOM) // not a dom doc, parse it first
		{
			var doc = DataType.XmlUtility.parse(data);
			rootElem = doc.documentElement;
		}
		else
		{
			if (data.documentElement)  // is document
				rootElem = data.documentElement;
			else
				rootElem = data;
		}
		var result;
		var reader = Kekule.IO.CmlElementReaderFactory.getReader('cml');
		if (reader)
		{
			try
			{
				this.setObjIdMap({});
				reader.setRootEvoker(this);
				var op = Object.extend({}, Kekule.globalOptions.IO.cml);
				op = Object.extend(op, options || {});
				result = reader.readElement(rootElem, null, null, op);
				reader.doneReadingDocument(true);  // notify the whole document is read
			}
			finally
			{
				reader.finalize();
				this.setObjIdMap(null);  // clear the id-obj map
			}
		}
		return result;
	},
	/**
	 * From all objects loaded, returns the one with id.
	 * @param {String} id
	 * @returns {Object}
	 */
	getLoadedObjById: function(id)
	{
		var map = this.getObjIdMap();
		return map && map[id];
	},
	/**
	 * Add an id-obj pair to the map.
	 * @param {String} id
	 * @param {Object} obj
	 */
	setObjIdMapValue: function(id, obj)
	{
		var map = this.getObjIdMap();
		if (map)
			map[id] = obj;
	}
});

/**
 * Writer for CML document.
 * Use CmlWriter.writeData() to write a Kekule.ChemObject to suitable CML element.
 * @class
 * @augments Kekule.IO.ChemDataReader
 */
Kekule.IO.CmlWriter = Class.create(Kekule.IO.ChemDataWriter,
/** @lends Kekule.IO.CmlWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.CmlWriter',
	/** @private */
	initialize: function(/*$super, */options)
	{
		this.tryApplySuper('initialize', [options])  /* $super(options) */;
		var op = options || {};
		this.setPrettyPrint(Kekule.ObjUtils.isUnset(op.prettyPrint)? Kekule.globalOptions.IO.cml.prettyPrint: op.prettyPrint);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('prettyPrint', {'dataType': DataType.BOOL, 'defaultValue': true});
		// private, storing the root element writer
		this.defineProp('rootElemWriter', {'dataType': DataType.OBJECT, 'setter': null, 'serializable': false});
	},
	/** @private */
	doWriteData: function(obj, dataType, format, options)
	{
		var nsUri = Kekule.IO.CML.CML3_SCHEMA_NAMESPACE_URI;
		// create a new XML document
		var xmlDoc = DataType.XmlUtility.newDocument('cml', nsUri);
		var writer = Kekule.IO.CmlElementWriterFactory.getWriter('Kekule.ChemDocument');
		if (writer)
		{
			var result;
			try
			{
				this.setPropStoreFieldValue('rootElemWriter', writer);
				var op = Object.extend({}, Kekule.globalOptions.IO.cml);
				op = Object.extend(op, options || {});
				writer.setCoreNamespaceURI(nsUri);
				//writer.setCoreNamespaceURI('');
				result = writer.writeObject(obj, xmlDoc.documentElement, op);
				writer.doneWritingDocument(true);  // notify the whole document is read
				if (dataType == Kekule.IO.ChemDataType.TEXT) // convert DOM to text
				{
					result = DataType.XmlUtility.serializeNode(xmlDoc.documentElement, {'prettyPrint': op.prettyPrint || this.getPrettyPrint()});
				}
			}
			finally
			{
				this.setPropStoreFieldValue('rootElemWriter', null);
				writer.finalize();
			}
			return result;
		}
		else
		{
			Kekule.error(/*Kekule.ErrorMsg.UNABLE_TO_OUTPUT_AS_CML*/Kekule.$L('ErrorMsg.UNABLE_TO_OUTPUT_AS_CML').format(DataType.getType(obj)));
			return null;
		}
	}
});


(function ()
{
	// extends mime type consts
	Kekule.IO.MimeType.CML = 'chemical/x-cml';

	// register default CML element readers and writers
	var RF = Kekule.IO.CmlElementReaderFactory;
	RF.register('name', Kekule.IO.CmlNameReader);
	RF.register('scalar', Kekule.IO.CmlScalarReader);
	RF.register('metaData', Kekule.IO.CmlMetaDataReader);
	RF.register('metaDataList', Kekule.IO.CmlMetaDataListReader);
	RF.register('formula', Kekule.IO.CmlFormulaReader);
	RF.register('molecule', Kekule.IO.CmlMoleculeReader);
	RF.register(['reactant', 'product', 'substance'], Kekule.IO.CmlReactionReagentReader);
	RF.register('reaction', Kekule.IO.CmlReactionReader);
	RF.register(['list', 'moleculeList', 'reactionList'], Kekule.IO.CmlListReader);
	RF.register(['conditionlist'], Kekule.IO.CmlConditionListReader);
	RF.register(['parameter'], Kekule.IO.CmlParameterReader);
	RF.register(['parameterlist'], Kekule.IO.CmlParameterListReader);
	RF.register(['array'], Kekule.IO.CmlArrayReader);
	RF.register('cml', Kekule.IO.CmlRootReader);

	var WF = Kekule.IO.CmlElementWriterFactory;
	WF.register(DataType.ARRAY, Kekule.IO.CmlArrayWriter);
	WF.register('Kekule.Scalar', Kekule.IO.CmlScalarWriter);
	WF.register('Kekule.MolecularFormula', Kekule.IO.CmlFormulaWriter);
	WF.register(['Kekule.ChemStructureFragment', 'Kekule.Molecule', 'Kekule.CompositeMolecule'], Kekule.IO.CmlMoleculeWriter);
	WF.register('Kekule.Reaction', Kekule.IO.CmlReactionWriter);
	WF.register(['Kekule.ChemObjList', 'Kekule.ChemStructureObjectGroup'/*, 'Kekule.ChemSpaceElement', 'Kekule.ChemSpace'*/], Kekule.IO.CmlListWriter);
	WF.register(['Kekule.ChemSpaceElement', 'Kekule.ChemSpace'], Kekule.IO.CmlTransparentListWriter);
	WF.register('Kekule.ChemDocument', Kekule.IO.CmlRootWriter);

	// register chem data formats
	Kekule.IO.DataFormat.CML = 'cml';
	Kekule.IO.DataFormatsManager.register('cml', Kekule.IO.MimeType.CML, 'cml', Kekule.IO.ChemDataType.TEXT, 'Chemical Markup Language');

	// register ChemData reader and writer
	/*
	Kekule.IO.ChemDataReaderManager.register('cml', Kekule.IO.CmlReader, {
		'title': 'Chemical Markup Language',
		'mimeType': 'chemical/x-cml',
		'fileExt': 'cml'
	});
	Kekule.IO.ChemDataWriterManager.register('cml', Kekule.IO.CmlWriter,
		['Kekule.Scalar', 'Kekule.ChemStructureFragment', 'Kekule.Reaction',
		 'Kekule.ChemObjList', 'Kekule.ChemDocument'],
		{
			'title': 'Chemical Markup Language',
			'mimeType': 'chemical/x-cml',
			'fileExt': 'cml'
		});
	*/
	var cmdFmtId = Kekule.IO.DataFormatsManager.findFormatId(Kekule.IO.MimeType.CML);

	Kekule.IO.ChemDataReaderManager.register('cml', Kekule.IO.CmlReader, [cmdFmtId]);
	Kekule.IO.ChemDataWriterManager.register('cml', Kekule.IO.CmlWriter,
		[Kekule.Scalar, Kekule.StructureFragment, Kekule.Reaction,
			Kekule.ChemObjList, Kekule.ChemSpace],
		[cmdFmtId]);
})();

})();