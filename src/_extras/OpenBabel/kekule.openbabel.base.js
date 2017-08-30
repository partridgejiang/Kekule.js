/**
 * @fileoverview
 * OpenBabel is a famous open source chemoinformatics project written in C++.
 * Using Emscripten, we compiler it into JavaScript and expose classes for calling from JavaScript code.
 * This file provides a series of adapters to convert between OpenBabel object (OBReaction/OBMol/OBAtom/OBBond and so on)
 * and Kekule native objects (Reaction/Molecule/Atom/Bond and so on).
 * @author Partridge Jiang
 */

/*
 * requires /utils/kekule.utils.js
 * requires /core/kekule.common.js
 * requires /core/kekule.structures.js
 * requires /_extras/kekule.emscriptenUtils.js
 * requires /localization/
 */

(function(){

/** @ignore */
var EU = Kekule.EmscriptenUtils;

/**
 * Initialization options of OpenBabel js module.
 * @private
 * @ignore
 */
var obInitOptions = {
	usingModulaize: true,  // whether using modularize option to build OpenBabel.js
	moduleName: 'OpenBabelModule' // the name of OpenBabl module
};

/**
 * Namespace of OpenBabel related objects.
 * @namespace
 */
Kekule.OpenBabel = {
	/**
	 * A flag, whether auto enable InChI function when find InChI lib is already loaded.
	 */
	_autoEnabled: true,
	/** @private */
	_module: null, // a variable to store created OpenBabel module object
	/** Base URL of OpenBabel script file. */
	SCRIPT_FILE: 'openbabel.js',
	/** @private */
	_enableFuncs: [],
	/** OpenBabel Bond order constants. */
	BondOrder: {
		SINGLE: 1,
		DOUBLE: 2,
		TRIPLE: 3,
		EXPLICIT_AROMATIC: 5
	},
	getObInitOptions: function()
	{
		return obInitOptions;
	},
	getModule: function()
	{
		if (!OB._module)
		{
			OB._module = EU.getRootModule(obInitOptions.moduleName);
		}
		return OB._module;
	},
	getClassCtor: function(className)
	{
		return EU.getClassCtor(className, OB.getModule());
	},
	isScriptLoaded: function()
	{
		return EU.isSupported(obInitOptions.moduleName);
	},

	/**
	 * Load OpenBabel.js lib and enable all related functions
	 */
	enable: function(callback)
	{
		if (!OB.isScriptLoaded())  // OpenBabel not loaded?
		{
			OB.loadObScript(document, function(){
				//Kekule.IO.registerAllInChIFormats();
				OB._enableAllFunctions();
				if (callback)
					callback();
			});
		}
		else
		{
			OB._enableAllFunctions();
			if (callback)
				callback();
		}
	},
	_enableAllFunctions: function()
	{
		if (OB.isScriptLoaded())
		{
			var funcs = OB._enableFuncs;
			for (var i = 0, l = funcs.length; i < l; ++i)
			{
				var func = funcs[i];
				if (func)
					func();
			}
		}
	}
};

Kekule._registerAfterLoadProc(function() {if (OB._autoEnabled) OB._enableAllFunctions()} );

/** @ignore */
Kekule.OpenBabel.getObPath = function()
{
	var isMin = Kekule.scriptSrcInfo.useMinFile;
	var path = isMin? 'extra/': '_extras/OpenBabel/';
	path = Kekule.scriptSrcInfo.path + path;
	return path;
};
/** @ignore */
Kekule.OpenBabel.getObScriptUrl = function()
{
	var result = Kekule.OpenBabel.getObPath() + Kekule.OpenBabel.SCRIPT_FILE;
	var isMin = Kekule.scriptSrcInfo.useMinFile;
	if (!isMin)
		result += '.dev';
	return result;
};
/** @ignore */
Kekule.OpenBabel.loadObScript = function(doc, callback)
{
	if (!doc)
		doc = document;
	if (!OB._obScriptLoadedBySelf && !OB.isScriptLoaded())
	{
		//console.log('load');
		var filePath = Kekule.OpenBabel.getObScriptUrl();
		EU.loadScript(filePath, callback, doc);
		OB._obScriptLoadedBySelf = true;
	}
	else
	{
		OB._obScriptLoadedBySelf = true;
		if (callback)
			callback();
	}
};

var OB = Kekule.OpenBabel;

/**
 * Util class to convert object between OpenBabel and Kekule.
 * @class
 */
Kekule.OpenBabel.AdaptUtils = {
	/** @private */
	DEF_ATOM_ID_PREFIX: 'A',
	/** @private */
	DEF_BOND_ID_PREFIX: 'B',
	/** @private */
	DEF_MOL_ID_PREFIX: 'M',

	/**
	 * Wrap all exported C functions to Kekule.OpenBabel namespace.
	 */
	wrapCFuncs: function()
	{
		if (!Kekule.OpenBabel._funcInited)
		{
			var funcs = {
				//'obGetSupportedFormatsDetailStr': EU.cwrap('obGetSupportedFormatsDetailStr', 'string', ['string', 'string', 'string'], Kekule.OpenBabel.getModule())
			};
			Object.extend(Kekule.OpenBabel, funcs);
			Kekule.OpenBabel._funcInited = true;
		}
	},

	/**
	 * Check if OpenBabel js file is successful loaded and available.
	 * @returns {Bool}
	 */
	isAvailable: function()
	{
		return typeof(OB.getClassCtor('ObBaseHelper')) !== 'undefined'; // || (Module && Module._obGetSupportedFormatsDetailStr);
	},

	/*
	 * Returns corresponding Kekule class to ob class name.
	 * For example, this function will returns {@link Kekule.Reaction} when the param is 'OBReaction'.
	 * @param {String} obClassName
	 * @returns {Class}
	 * @deprecated
	 */
	/*
	getCorrespondingKekuleClass: function(obClassName)
	{
		if (obClassName === 'OBMol')
			return Kekule.Molecule;
		else if (obClassName === 'OBReaction')
			return Kekule.Reaction;
		else if (obClassName === 'OBAtom')
			return Kekule.Atom;
		else if (obClassName === 'OBBond')
			return Kekule.Bond;
		else
			return Kekule.ChemObject;
	},
	*/
	/**
	 * Convert an OB object to corresponding Kekule one.
	 * Type of Kekule object is automatically decided by the type of obObj.
	 * @param {Object} obObj
	 * @returns {Kekule.ChemObject}
	 */
	obObjToKekule: function(obObj)
	{
		var AU = Kekule.OpenBabel.AdaptUtils;
		var obName = Kekule.ObjUtils.getPrototypeOf(obObj).constructor.name;
		var convFunc = (obName === 'OBReaction')? AU.obReactionToKekule:
			(obName === 'OBMol')? AU.obMolToKekule:
			(obName === 'OBAtom')? AU.obAtomToKekule:
			(obName === 'OBBond')? AU.obBondToKekule:
				AU.obBaseToKekule;
		return convFunc(obObj);
	},
	/**
	 * Convert an Kekule chem object to corresponding Open Babel one.
	 * Type of Open Babel object is automatically decided by the type of kChemObj.
	 * @param {Object} obObj
	 * @returns {Kekule.ChemObject}
	 */
	kObjToOB: function(kChemObj)
	{
		var AU = Kekule.OpenBabel.AdaptUtils;
		var convFunc = (kChemObj instanceof Kekule.Reaction)? AU.kReactionToOB:
			(kChemObj instanceof Kekule.StructureFragment)? AU.kMolToOB:
			(kChemObj instanceof Kekule.ChemStructureNode)? AU.kChemNodeToOB:
			(kChemObj instanceof Kekule.ChemStructureConnector)? AU.kBondToOB:
				null;  // AU.kChemNodeToOB;
		if (convFunc)
			return convFunc(kChemObj);
		else
			return null;
	},

	/**
	 * Turn string based Kekule ID to Int based OB id.
	 * @param {String} id
	 * @returns {Int}
	 */
	kIdToOB: function(id)
	{

		var	v = parseInt(id, 10);
		if (v)
			return v;
		else
			return null;
	},

	/**
	 * Returns corresponding Kekule.BondOrder constants.
	 * @param {Int} obBondOrder
	 * @returns {Int}
	 */
	obBondOrderToKekule: function(obBondOrder)
	{
		if (obBondOrder <= 3)
			return obBondOrder;   // single, double, triple bond
		else if (obBondOrder === Kekule.OpenBabel.BondOrder.EXPLICIT_AROMATIC)
			return Kekule.BondOrder.EXPLICIT_AROMATIC;
		else
			return Kekule.BondOrder.OTHER;
	},
	/**
	 * Returns corresponding OpenBabel bond order constants.
	 * @param {Int} kBondOrder
	 * @returns {Int}
	 */
	kBondOrderToOB: function(kBondOrder)
	{
		if (kBondOrder <= 3)
			return kBondOrder;
		else if (kBondOrder === Kekule.BondOrder.EXPLICIT_AROMATIC)
			return Kekule.OpenBabel.BondOrder.EXPLICIT_AROMATIC;
		else
			return 0;  // unmatched bond to OB
	},

	/**
	 * Convert OBBase instance to Kekule ChemObject instance.
	 * @param {Object} obBase
	 * @param {Kekule.ChemObject} kChemObj This object will be modified according to obBase. If this value is not set, a new instance of Kekule.ChemObject will be created.
	 * @returns {Kekuel.ChemObject}
	 */
	obBaseToKekule: function(obBase, kChemObj)
	{
		var result = kChemObj || new Kekule.ChemObject();
		var helper = new (OB.getClassCtor('ObBaseHelper'))(obBase);
		// title
		var title = helper.getTitle();
		if (title && result.setName)
			result.setName(title);
		// TODO: data info, how to convert exactly?
		var dataSize = helper.getDataSize();
		if (dataSize)
		{
			var info = result.getInfo(true);
			for (var i = 0; i < dataSize; ++i)
			{
				var data = helper.getDataAt(i);
				if (data)
				{
					var key = data.GetAttribute();
					var value = data.GetValue();
					if (key && value)
						info[key] = value;
				}
			}
		}
		return result;
	},
	/**
	 * Convert Kekule.ChemObject instance to OBBase instance
	 * @param {Kekule.ChemObject} kChemObj
	 * @param {Object} obBase
	 * @returns {Object}
	 */
	kChemObjToOB: function(kChemObj, obBase)
	{
		var result = obBase || new (OB.getClassCtor('OBBase'))();
		if (kChemObj.getName && result.SetTitle)
			result.SetTitle(kChemObj.getName());
		var info = kChemObj.getInfo();
		if (info)
		{
			var keys = Kekule.ObjUtils.getOwnedFieldNames(info);
			for (var i = 0, l = keys.length; i < l; ++i)
			{
				var key = keys[i];
				var value = info[key];
				if (key && value)
				{
					var data = new (OB.getClassCtor('OBPairData'))();
					data.SetAttribute('' + key);  // ensure string
					data.SetValue('' + value);  // ensure string
					result.SetData(data);
				}
			}
		}
	},
	/**
	 * Convert OBAtom object to Kekule ones.
	 * @param {Object} obAtom
	 * @param {Kekule.ChemStructureNode} kNode This node will be modified according to obAtom. If this value is not set, a new instance of suitable type will be created.
	 * @param {Int} coordMode
	 * @returns {Kekule.ChemStructureNode}
	 */
	obAtomToKekule: function(obAtom, kNode, coordMode)
	{
		var atomicNum = obAtom.GetAtomicNum();
		// TODO: How babel represent group exactly? Only knows that atom list is not supported by babel.
		var preferredClass = atomicNum? Kekule.Atom: Kekule.SubGroup;
		if (kNode && (!(kNode instanceof preferredClass)))  // provide kAtom not suitable
			Kekule.Error(/*Kekule.ErrorMsg.OpenBabel.CHEM_NODE_TYPE_NOT_SUITABLE*/Kekule.$L('ErrorMsg.OpenBabel.CHEM_NODE_TYPE_NOT_SUITABLE'));
		var result = kNode || new preferredClass();
		Kekule.OpenBabel.AdaptUtils.obBaseToKekule(obAtom, result);

		var v;
		// id
		v = obAtom.GetId();
		if (Kekule.ObjUtils.notUnset(v))
			result.setId(Kekule.OpenBabel.AdaptUtils.DEF_ATOM_ID_PREFIX + v);
		// charge
		v = obAtom.GetFormalCharge(); // || obAtom.GetPartialCharge();
		if (v)
			result.setCharge(v);
		// SpinMultiplicity
		v = obAtom.GetSpinMultiplicity();
		if (v)
			result.setRadical(v);
		// coord
		v = {'x': obAtom.GetX(), 'y': obAtom.GetY()};
		if (coordMode === Kekule.CoordMode.COORD3D)
			v.z = obAtom.GetZ();
		if (result.setAbsCoordOfMode)
			result.setAbsCoordOfMode(v, coordMode);
		else
			result.setCoordOfMode(v, coordMode);
		// TODO: explicit H count?

		if (result instanceof Kekule.Atom)
		{
			// atomic number
			if (atomicNum)
				result.setAtomicNumber(atomicNum);
			// Isotope
			v = obAtom.GetIsotope();
			if (v)
				result.setMassNumber(v);
			// hybridization
			v = obAtom.GetHyb();
			if (v)
				result.setHybridizationType(v);
		}
		return result;
	},
	/**
	 * Convert OBAtom object to Kekule ones.
	 * @param {Kekule.ChemStructureNode} kNode
	 * @param {Object} obAtom If not set, a new OBAtom instance will be created and returned.
	 * @param {Int} coordMode
	 * @returns {Object}
	 */
	kChemNodeToOB: function(kNode, obAtom, coordMode)
	{
		var result = obAtom || new (OB.getClassCtor('OBAtom'))();
		var v;
		// id
		v = kNode.getId();
		v = Kekule.OpenBabel.AdaptUtils.kIdToOB(v);
		if (Kekule.ObjUtils.notUnset(v))
		{
			result.SetId(v);
		}

		// charge
		v = kNode.getCharge();
		if (v)
		{
			if (parseInt(v, 10) === parseFloat(v))  // is Int
				result.SetFormalCharge(v);
			else  // float
			{
				var i = parseInt(v, 10);
				var f = v - i;
				result.SetFormalCharge(i);
				result.SetPartialCharge(f);
			}
		}
		// radical
		v = kNode.getRadical();
		if (v)
			result.SetSpinMultiplicity(v);

		// coord
		v = kNode.getAbsCoordOfMode? kNode.getAbsCoordOfMode(coordMode):
			kNode.getCoordOfMode(coordMode);
		/*
		result.SetX(v.x);
		result.SetY(v.y);
		if (coordMode === Kekule.CoordMode.COORD3D)
			result.SetZ(v.z);
		*/
		result.SetVector(v.x || 0, v.y || 0, v.z || 0);

		if (kNode instanceof Kekule.Atom)
		{
			// atomic number
			result.SetAtomicNum(kNode.getAtomicNumber());
			// isotope
			v = kNode.getMassNumber();
			if (v)
				result.SetIsotope(v);
			// hybridization
			v = kNode.getHybridizationType();
			if (v)
				result.SetHyb(v);
		}
		else // subgroup, pseudo atom...
		{
			result.SetAtomicNum(0);
			// TODO: More properties should be handled here
		}
		return result;
	},

	/**
	 * Convert OBBond instance to Kekule.Bond. The connected atom info will be generated by atomMapping (if exists).
	 * @param {Object} obBond
	 * @param {Kekule.Bond} kBond
	 * @param {Kekule.MapEx} atomMapping
	 */
	obBondToKekule: function(obBond, kBond, atomMapping)
	{
		var result = kBond || new Kekule.Bond();
		Kekule.OpenBabel.AdaptUtils.obBaseToKekule(obBond, result);

		var v;
		// id
		v = obBond.GetId();
		if (Kekule.ObjUtils.notUnset(v))
			result.setId(Kekule.OpenBabel.AdaptUtils.DEF_BOND_ID_PREFIX + v);
		// bond order
		v = obBond.GetBondOrder();
		result.setBondOrder(Kekule.OpenBabel.AdaptUtils.obBondOrderToKekule(v));
		// stereo
		var BS = Kekule.BondStereo;
		v = obBond.IsWedge()? BS.UP:
			obBond.IsHash()? BS.DOWN:
			obBond.IsWedgeOrHash()? BS.UP_OR_DOWN:
			obBond.IsCisOrTrans()? BS.CIS_OR_TRANS:
			obBond.IsDoubleBondGeometry()? BS.E_Z_BY_COORDINATES:
				BS.NONE;
		// TODO: IsUp/IsDown not handled
		result.setStereo(v);

		// atom mapping
		if (atomMapping)
		{
			v = null;
			var atoms = [obBond.GetBeginAtom(), obBond.GetEndAtom()];
			for (var i = 0, l = atoms.length; i < l; ++i)
			{
				var atom = atoms[i];
				if (atom)
				{
					//v = atomMapping.get(atom);
					// IMPORTANT: must use Int index, if use obAtom directly, in bond procedure get(obAtom) will return null
					v = atomMapping.get(atom.GetIdx());
					if (v)
						result.appendConnectedObj(v);
				}
			}
		}
		return result;
	},
	/**
	 * Convert instance Kekule.Bond to OBBond. The connected atom info will be generated by atomMapping (if exists).
	 * @param {Kekule.Bond} kBond
	 * @param {Object} obBond
	 * @param {Kekule.MapEx} atomMapping
	 * @param {Object} obMol
	 */
	kBondToOB: function(kBond, obBond, atomMapping, obMol)
	{
		var result = obBond || new (OB.getClassCtor('OBBond'))();
		Kekule.OpenBabel.AdaptUtils.kChemObjToOB(kBond, result);

		var v;
		// id
		v = Kekule.OpenBabel.AdaptUtils.kIdToOB(kBond.getId());
		if (Kekule.ObjUtils.notUnset(v))
		{
			result.SetId(v);
		}
		// bond order
		v = kBond.getBondOrder();
		if (v)
		{
			result.SetBondOrder(Kekule.OpenBabel.AdaptUtils.kBondOrderToOB(v));
			if (v === Kekule.BondOrder.EXPLICIT_AROMATIC)
				result.SetAromatic();
		}
		// stereo
		result.UnsetHash();
		result.UnsetWedge();
		result.UnsetUp();
		result.UnsetDown();
		result.UnsetAromatic();

		var BS = Kekule.BondStereo;
		v = kBond.getStereo();
		if (v === BS.UP)
			result.SetWedge();
		else if (v === BS.DOWN)
			result.SetHash();
		else if (v === BS.UP_OR_DOWN)
			result.SetWedgeOrHash();

		// atoms
		if (atomMapping)
		{
			var curr = 0;
			for (var i = 0, l = kBond.getConnectedObjCount(); i < l; ++i)
			{
				var obj = kBond.getConnectedObjAt(i);
				// connector may connected to another connector in Kekule, but this situation is unsupported in OpenBabel
				// so we filter node out
				if (obj && (obj instanceof Kekule.ChemStructureNode))
				{
					//var idx = atomMapping.get(obj);
					var v = atomMapping.get(obj);  //obMol.GetAtom(idx);

					//console.log(idx, v);
					if (v)
					{
						if (curr === 0)
							result.SetBegin(v);
						else if (curr === 1)
							result.SetEnd(v);
						++curr;
					}
					if (curr > 1)
						break;
				}
			}
		}
		return result;
	},

	/**
	 * Convert instance of OBMol to Kekule.Molecule.
	 * @param {Object} obMol
	 * @param {Kekule.Molecule} kMol
	 * @returns {Kekule.Molecule}
	 */
	obMolToKekule: function(obMol, kMol)
	{
		var result = kMol || new Kekule.Molecule();
		Kekule.OpenBabel.AdaptUtils.obBaseToKekule(obMol, result);

		var coordMode = obMol.Has3D()? Kekule.CoordMode.COORD3D: Kekule.CoordMode.COORD2D;

		result.clearNodes();
		result.clearConnectors();

		var atomMapping = new Kekule.MapEx(true);

		// atoms
		var count = obMol.NumAtoms();
		//console.log('atom count: ', count);
		for (var i = 0; i < count; ++i)
		{
			var obAtom = obMol.GetAtom(i + 1);  // NOTE: in OpenBabel, currently atom index starts from 1
			if (obAtom)
			{
				var kNode = Kekule.OpenBabel.AdaptUtils.obAtomToKekule(obAtom, null,coordMode);
				if (kNode)
				{
					result.appendNode(kNode);
					//atomMapping.set(obAtom, kNode);
					// IMPORTANT: must use Int index, if use obAtom directly, in bond procedure get(obAtom) will return null
					atomMapping.set(obAtom.GetIdx(), kNode);
				}
			}
		}
		//console.log(atomMapping);
		// bonds
		var count = obMol.NumBonds();
		for (var i = 0; i < count; ++i)
		{
			var obBond = obMol.GetBond(i);  // NOTE: in OpenBabel, bond index starts from 0
			if (obBond)
			{
				var kBond = Kekule.OpenBabel.AdaptUtils.obBondToKekule(obBond, null, atomMapping);
				if (kBond)
					result.appendConnector(kBond);
			}
		}
		atomMapping.finalize();
		atomMapping = null;
		return result;
	},

	/**
	 * Convert instance of Kekule.StructureFragment to OBMol.
	 * @param {Kekule.StructureFragment} kMol
	 * @param {Object} obMol
	 * @returns {Kekule.Molecule}
	 */
	kMolToOB: function(kMol, obMol)
	{
		var coordMode = kMol.nodesHasCoord3D()? Kekule.CoordMode.COORD3D: Kekule.CoordMode.COORD2D;
		var result = obMol || new (OB.getClassCtor('OBMol'))();
		//Kekule.OpenBabel.AdaptUtils.kChemObjToOB(kMol, result);

		if (obMol)  // not created new
			result.Clear();

		var atomMapping = new Kekule.MapEx(false);

		// atoms
		for (var i = 0, l = kMol.getNodeCount(); i < l; ++i)
		{
			var kNode = kMol.getNodeAt(i);
			if (kNode)
			{
				var obAtom = Kekule.OpenBabel.AdaptUtils.kChemNodeToOB(kNode, result.NewAtom(), coordMode);
				if (obAtom)
				{
					//result.AddAtom(obAtom);
					atomMapping.set(kNode, obAtom);
				}
			}
		}
		// bonds
		for (var i = 0, l = kMol.getConnectorCount(); i < l; ++i)
		{
			var kBond = kMol.getConnectorAt(i);
			if (kBond && (kBond instanceof Kekule.Bond))
			{
				var obBond = Kekule.OpenBabel.AdaptUtils.kBondToOB(kBond, result.NewBond(), atomMapping, result);
				/*
				if (obBond)
					result.AddBond(obBond);
				*/
			}
		}
		atomMapping.finalize();
		atomMapping = null;
		return result;
	},

	/**
	 * Convert instance of OBReaction to Kekule.Reaction.
	 * @param {Object} obReaction
	 * @param {Kekule.Reaction} kMol
	 * @returns {Kekule.Reaction}
	 */
	obReactionToKekule: function(obReaction, kReaction)
	{
		var result = kReaction || new Kekule.Reaction();
		result.clearAll();

		Kekule.OpenBabel.AdaptUtils.obBaseToKekule(obReaction, result);

		// direction
		result.setDirection(obReaction.IsReversible()? Kekule.ReactionDirection.BIDIRECTION: Kekule.ReactionDirection.FORWARD);

		// reactants
		for (var i = 0, l = obReaction.NumReactants(); i < l; ++i)
		{
			var obMol = obReaction.GetReactant(i);
			var kMol = Kekule.OpenBabel.AdaptUtils.obMolToKekule(obMol);
			result.appendReactant(kMol);
		}
		// products
		for (var i = 0, l = obReaction.NumProducts(); i < l; ++i)
		{
			var obMol = obReaction.GetProduct(i);
			var kMol = Kekule.OpenBabel.AdaptUtils.obMolToKekule(obMol);
			result.appendProduct(kMol);
		}
		// TODO: transition state not handled

		return result;
	},
	/**
	 * Convert instance of Kekule.Reaction to OBReaction.
	 * @param {Kekule.Reaction} kMol
	 * @param {Object} obReaction
	 * @returns {Kekule.Reaction}
	 */
	kReactionToOB: function(kReaction, obReaction)
	{
		var result = obReaction || new (OB.getClassCtor('OBReaction'))();
		result.Clear();

		Kekule.OpenBabel.AdaptUtils.kChemObjToOB(kReaction, result);

		// direction
		var isReversed = false;
		var direction = kReaction.getDirection();
		if (direction === Kekule.ReactionDirection.BIDIRECTION)
			result.SetReversible(true);
		else if (direction === Kekule.ReactionDirection.BACKWARD)
		  isReversed = true;

		// reactants
		for (var i = 0, l = kReaction.getReactantCount(); i < l; ++i)
		{
			var kMol = kReaction.getReactantAt(i);
			if (kMol)
			{
				var obMol = Kekule.OpenBabel.AdaptUtils.kMolToOB(kMol);
				if (isReversed)
					result.AddProduct(obMol);
				else
					result.AddReactant(obMol);
			}
		}
		// products
		for (var i = 0, l = kReaction.getProductCount(); i < l; ++i)
		{
			var kMol = kReaction.getProductAt(i);
			if (kMol)
			{
				var obMol = Kekule.OpenBabel.AdaptUtils.kMolToOB(kMol);
				if (isReversed)
					result.AddReactant(obMol);
				else
					result.AddProduct(obMol);
			}
		}
	}
};

//Kekule.OpenBabel.AdaptUtils.wrapCFuncs();

})();