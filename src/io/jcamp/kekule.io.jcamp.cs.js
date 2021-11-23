/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /utils/kekule.textHelper.js
 * requires /core/kekule.common.js
 * requires /core/kekule.metrics.js
 * requires /core/kekule.structures.js
 * requires /io/kekule.io.js
 * requires /io/jcamp/kekule.io.jcamp.base.js
 * requires /localization
 */

(function(){

"use strict";

var OU = Kekule.ObjUtils;
var AU = Kekule.ArrayUtils;
var Jcamp = Kekule.IO.Jcamp;

Kekule.globalOptions.add('IO.jcamp', {
	determinateBondStereoByZIndex: true,  // whether use the z-index of raster to set the stereo (wedge or hash) of single bond
	enableCloserBondBetweenPositiveZIndexAtoms: true,   // if true, a single bond connecting two positive z-index atom will be marked as bold
	outputCsVersion: '3.7',    // The CS version when writing to JCAMP-CS data
	csCoordAllowedSavingErrorRatio: 0.0001,  // allow 0.01% error when saving atom coords to JCAMP-CS format
	csCoordPreferredScaledRange: {min: -16384, max: 16384},
	autoScaleCsRasterCoords: true,   // whether scale the XY raster value of CS data to a suitable length for rendering
	csRasterAutoScaleRefLength: Kekule.globalOptions.structure.defaultBondLength2D || 0.8
});

/** @ignore */
Object.extend(Jcamp.Consts, {
	MOL_STRUCTURE_VALUE_GROUP_DELIMITER: '\t',
	MOL_STRUCTURE_VALUE_GROUP_DELIMITER_PATTERN: /\s+/g,
	MOL_ATOM_SYMBOL_ANY: 'A',
	MOL_ATOM_MASS_NUMBER_PREFIX: '^',
	LABEL_MOL_NAMES: 'NAMES',
	LABEL_MOL_FORMULA: 'MOLFORM',
	LABEL_MOL_ATOMLIST: 'ATOMLIST',
	LABEL_MOL_BONDLIST: 'BONDLIST',
	LABEL_MOL_CHARGELIST: 'CHARGE',
	LABEL_MOL_RADICALLIST: 'RADICAL',
	LABEL_MOL_RASTERLIST: 'XYRASTER',
	LABEL_MOL_MAX_RASTER: 'MAXRASTER',
	LABEL_MOL_COORDLIST: 'XYZ',
	LABEL_MOL_COORD_FACTOR: 'XYZFACTOR',
	LABEL_MOL_MAX_COORD: 'MAXXYZ',
	// custom label to record the center coord/raster of molecule, based on the factor
	LABEL_MOL_COORD_CENTER: Jcamp.Consts.PRIVATE_LABEL_PREFIX + 'XYZCENTER',
	LABEL_MOL_RASTER_CENTER: Jcamp.Consts.PRIVATE_LABEL_PREFIX + 'XYRASTERCENTER',
	LABEL_MOL_RASTER_FACTOR: Jcamp.Consts.PRIVATE_LABEL_PREFIX + 'XYRASTERFACTOR'
});

// create some ldr info for CS format
Kekule.IO.Jcamp.LabelTypeInfos.createInfos([
	// IR
	//['RESOLUTION', Jcamp.ValueType.STRING],  // already defined in jcamp.base.js
	// MS
	[Jcamp.Consts.LABEL_MOL_FORMULA, Jcamp.ValueType.STRING, null, Jcamp.LabelCategory.GLOBAL],
	[Jcamp.Consts.LABEL_MOL_ATOMLIST, Jcamp.ValueType.STRING, null, Jcamp.LabelCategory.GLOBAL],
	[Jcamp.Consts.LABEL_MOL_BONDLIST, Jcamp.ValueType.STRING, null, Jcamp.LabelCategory.GLOBAL],
	[Jcamp.Consts.LABEL_MOL_COORD_FACTOR, Jcamp.ValueType.AFFN, null, Jcamp.LabelCategory.GLOBAL],
	[Jcamp.Consts.LABEL_MOL_COORD_CENTER, Jcamp.ValueType.STRING, Jcamp.LabelType.PRIVATE, Jcamp.LabelCategory.ANNOTATION],
	[Jcamp.Consts.LABEL_MOL_RASTER_FACTOR, Jcamp.ValueType.AFFN, Jcamp.LabelType.PRIVATE, Jcamp.LabelCategory.ANNOTATION],
	[Jcamp.Consts.LABEL_MOL_RASTER_CENTER, Jcamp.ValueType.STRING, Jcamp.LabelType.PRIVATE, Jcamp.LabelCategory.ANNOTATION],
	[Jcamp.Consts.LABEL_MOL_MAX_COORD, Jcamp.ValueType.AFFN, null, Jcamp.LabelCategory.GLOBAL],
	[Jcamp.Consts.LABEL_MOL_MAX_RASTER, Jcamp.ValueType.AFFN, null, Jcamp.LabelCategory.GLOBAL]
]);

/**
 * A helper class for JCAMP-CS formats.
 * @class
 */
Kekule.IO.Jcamp.CsUtils = {
	/** @private */
	getJcampIsotopeIdDetails: function(isotopeId)
	{
		var pattern = new RegExp('\\' + Jcamp.Consts.MOL_ATOM_MASS_NUMBER_PREFIX + '?([0-9]*)([A-z]+)');
		var matchResult = isotopeId.match(pattern);
		if (matchResult)
		{
			var massNumber = matchResult[1]? parseInt(matchResult[1]): null;
			var result = {
				'massNumber': massNumber,
				'symbol': matchResult[2]
			}
			return result;
		}
		else
			return null;
	},
	/**
	 * Convert a Jcamp isotope id (e.g. ^17O) to Kekule form (O17).
	 * @param {String} isotopeId
	 * @returns {String}
	 */
	jcampIsotopeIdToKekule: function(isotopeId)
	{
		var details = Jcamp.CsUtils.getJcampIsotopeIdDetails(isotopeId);
		return details? (details.symbol + details.massNumber): isotopeId;
	},
	/**
	 * Returns a Isotope id string of JCAMP-CS.
	 * @param {Kekule.Isotope} isotope
	 * @returns {String}
	 */
	kekuleIsotopeToJcampIsotopeId: function(isotope)
	{
		var result = isotope.getSymbol();
		var massNumber = isotope.getMassNumber();
		if (massNumber)
			result = Jcamp.Consts.MOL_ATOM_MASS_NUMBER_PREFIX + Math.round(massNumber) + result;
		return result;
	},
	/**
	 * Convert a JCAMP bond type string to corresponding {@link Kekule.BondType} and {@link Kekule.BondOrder}.
	 * @param {String} sBondType
	 * @returns {Hash} {bondType, bondOrder}
	 */
	jcampBondTypeToKekule: function(sBondType)
	{
		var BT = Kekule.BondType;
		var BO = Kekule.BondOrder;
		var s = sBondType.toUpperCase();
		var result = {};
		if (s === 'A')
		{
			result.bondType = BT.UNKNOWN;
			result.bondOrder = BO.UNSET;
		}
		else
		{
			result.bondType = BT.COVALENT;
			result.bondOrder = (s === 'S')? BO.SINGLE:
				(s === 'D')? BO.DOUBLE:
			  (s === 'T')? BO.TRIPLE:
				(s === 'Q')? BO.QUAD:
				BO.UNSET;
		}
		return result;
	},
	/**
	 * Get a JCAMP bond type string from {@link Kekule.BondType} and {@link Kekule.BondOrder}.
	 * @param {Int} bondType
	 * @param {Int} bondOrder
	 * @returns {String}
	 */
	kekuleBondTypeAndOrderToJcampBondType: function(bondType, bondOrder)
	{
		var BT = Kekule.BondType;
		var BO = Kekule.BondOrder;
		if (bondType === BT.COVALENT)
		{
			var result = (bondOrder === BO.QUAD)? 'Q':
				(bondOrder === BO.TRIPLE)? 'T':
				(bondOrder === BO.DOUBLE)? 'D':
				(bondOrder === BO.SINGLE)? 'S':
				'A';
			return result;
		}
		else
		{
			return 'A';
		}
	},
	// TODO: the radical conversion between Kekule and JCAMP should be rechecked?
	/**
	 * Convert a JCAMP CS radical value to corresponding {@link Kekule.RadicalOrder}
	 * @param {Int} jcampRadical
	 * @return {Int}
	 */
	jcampRadicalToKekule: function(jcampRadical)
	{
		return Math.round(jcampRadical);
	},
	/**
	 * Convert a {@link Kekule.RadicalOrder} value to JCAMP CS radical value.
	 * @param {Int} kekuleRadical
	 * @return {Int}
	 */
	kekuleRadicalToJcamp: function(kekuleRadical)
	{
		return Math.round(kekuleRadical);
	},
	/**
	 * Calculate the suitable factor to convert float coord to integer.
	 * @param {Hash} coordMin
	 * @param {Hash} coordMax
	 * @param {Number} allowedErrorRatio
	 * @param {Hash} preferredCoordMin
	 * @param {Hash} preferredCoordMax
	 * @returns {Number}
	 */
	calcFactorForCoordRange: function(coordMin, coordMax, allowedErrorRatio, preferredCoordMin, preferredCoordMax)
	{
		var fields = ['x', 'y', 'z'];
		var factorForError, factorForRange;
		// phase 1, to match the allowedErrorRatio
		for (var i = 0, l = fields.length; i < l; ++i)
		{
			var minValue = coordMin[fields[i]], maxValue = coordMax[fields[i]];
			if (OU.notUnset(minValue) && OU.notUnset(maxValue))
			{
				var factor = Jcamp.Utils.calcNumFactorForRange(minValue, maxValue, allowedErrorRatio);  //, preferredMin, preferredMax);
				if (OU.isUnset(factorForError) || factorForError > factor)
					factorForError = factor;
			}
		}
		// phase 2, try to scale to preferred range
		for (var i = 0, l = fields.length; i < l; ++i)
		{
			var minValue = coordMin[fields[i]], maxValue = coordMax[fields[i]];
			var preferredMin = preferredCoordMin[fields[i]], preferredMax = preferredCoordMax[fields[i]];
			var factor = Jcamp.Utils.calcNumFactorForRange(minValue, maxValue, null, preferredMin, preferredMax);
			if (OU.isUnset(factorForRange) || factorForRange > factor)
				factorForRange = factor;
		}
		return Math.min(factorForError, factorForRange);
	}
};

/**
 * Reader for reading a CS data block of JCAMP document tree.
 * @class
 * @augments Kekule.IO.Jcamp.DataBlockReader
 */
Kekule.IO.Jcamp.CsDataBlockReader = Class.create(Kekule.IO.Jcamp.DataBlockReader,
/** @lends Kekule.IO.Jcamp.CsDataBlockReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.Jcamp.CsDataBlockReader',
	/** @private */
	initProperties: function()
	{
		this.defineProp('currAtomInfos', {'dataType': DataType.ARRAY, 'setter': false, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});
		this.defineProp('currBondInfos', {'dataType': DataType.ARRAY, 'setter': false, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});
		this.defineProp('currChargeInfos', {'dataType': DataType.ARRAY, 'setter': false, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});
		this.defineProp('currRadicalInfos', {'dataType': DataType.ARRAY, 'setter': false, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});
		this.defineProp('currCoordFactor', {'dataType': DataType.FLOAT, 'setter': false, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});
		this.defineProp('currCoordCenter', {'dataType': DataType.HASH, 'setter': false, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});
		this.defineProp('currCoordInfos', {'dataType': DataType.ARRAY, 'setter': false, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});
		this.defineProp('currRasterFactor', {'dataType': DataType.FLOAT, 'setter': false, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});
		this.defineProp('currRasterCenter', {'dataType': DataType.HASH, 'setter': false, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});
		this.defineProp('currRasterInfos', {'dataType': DataType.ARRAY, 'setter': false, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});
	},
	/** @ignore */
	doCreateChemObjForBlock: function(block)
	{
		var result;
		var meta = this._getBlockMeta(block);
		if (meta.blockType === Jcamp.BlockType.DATA && meta.format === Jcamp.Format.CS)
		{
			result = new Kekule.Molecule();
		}
		else
			result = this.tryApplySuper('doCreateChemObjForBlock', [block]);
		return result;
	},
	/** @ignore */
	doSetChemObjFromBlock: function(block, chemObj)
	{
		var result = this.tryApplySuper('doSetChemObjFromBlock', [block, chemObj]);
		this._buildStructure(chemObj, {
			atomInfos: this.getCurrAtomInfos(),
			bondInfos: this.getCurrBondInfos(),
			chargeInfos: this.getCurrChargeInfos(),
			radicalInfos: this.getCurrRadicalInfos(),
			coordFactor: this.getCurrCoordFactor(),
			coordCenter: this.getCurrCoordCenter(),
			coordInfos: this.getCurrCoordInfos(),
			rasterFactor: this.getCurrRasterFactor(),
			rasterCenter: this.getCurrRasterCenter(),
			rasterInfos: this.getCurrRasterInfos()
		}, this.getCurrOptions());
		return result;
	},

	/** @ignore */
	doBuildCrossRef: function(srcObj, targetObj, refType, refTypeText)
	{
		this.tryApplySuper('doBuildCrossRef', [srcObj, targetObj, refType, refTypeText]);
		if (refType === Jcamp.CrossRefType.SPECTRUM && srcObj instanceof Kekule.StructureFragment && targetObj instanceof Kekule.Spectroscopy.Spectrum)
		{
			Jcamp.Utils.addMoleculeSpectrumCrossRef(targetObj, srcObj);
		}
	},

	/** @ignore */
	_initLdrHandlers: function()
	{
		var map = this.tryApplySuper('_initLdrHandlers');
		//map[Jcamp.Consts.LABEL_BLOCK_BEGIN] = this.doStoreTitleLdr.bind(this);
		// MOLFORM, ATOMLIST, BONDLIST, CHARGE
		map[Jcamp.Consts.LABEL_MOL_NAMES] = this.doStoreMolNamesLdr.bind(this);
		map[Jcamp.Consts.LABEL_MOL_FORMULA] = this.doStoreMolFormulaLdr.bind(this);
		map[Jcamp.Consts.LABEL_MOL_ATOMLIST] = this.doStoreMolAtomListLdr.bind(this);
		map[Jcamp.Consts.LABEL_MOL_BONDLIST] = this.doStoreMolBondListLdr.bind(this);
		map[Jcamp.Consts.LABEL_MOL_CHARGELIST] = this.doStoreMolChargeOrRadicalListLdr.bind(this, 'charge');
		map[Jcamp.Consts.LABEL_MOL_RADICALLIST] = this.doStoreMolChargeOrRadicalListLdr.bind(this, 'radical');
		map[Jcamp.Consts.LABEL_MOL_COORD_FACTOR] = this.doStoreMolCoordOrRasterFactorLdr.bind(this, 'coord');
		map[Jcamp.Consts.LABEL_MOL_COORD_CENTER] = this.doStoreMolCoordOrRasterCenterLdr.bind(this, 'coord');
		map[Jcamp.Consts.LABEL_MOL_COORDLIST] = this.doStoreMolCoordOrRasterListLdr.bind(this, 'coord');
		map[Jcamp.Consts.LABEL_MOL_RASTER_FACTOR] = this.doStoreMolCoordOrRasterFactorLdr.bind(this, 'raster');
		map[Jcamp.Consts.LABEL_MOL_RASTER_CENTER] = this.doStoreMolCoordOrRasterCenterLdr.bind(this, 'raster');
		map[Jcamp.Consts.LABEL_MOL_RASTERLIST] = this.doStoreMolCoordOrRasterListLdr.bind(this, 'raster');

		// RADICAL, STEREOCENTER, STEREOPAIR, STEREOMOLECULE

		// MAXRASTER, XYRASTER, XYZSOURCE, MAXXYZ, XYZFACTOR, XYZ

		// BLOCKID
	},
	/** @ignore */
	getIgnoredLdrNames: function()
	{
		return [
			'MAXRASTER', 'MAXXYZ',
			'STEREOCENTER', 'STEREOPAIR', 'STEREOMOLECULE'  // TODO: currently all stereo are not handled in reading JCAMP-CS
		];
	},
	/* @private */
	/*
	doStoreTitleLdr: function(ldr, block, chemObj, preferredInfoPropName)
	{
		chemObj.setInfoValue('title', Jcamp.LdrValueParserCoder.parseValue(ldr));
	},
	*/
	/** @private */
	doStoreMolNamesLdr: function(ldr, block, chemObj, preferredInfoPropName)
	{
		var name = ldr.valueLines[0].trim();  // TODO: now only set the name of molecule by the first name of NAMES ldr
		if (chemObj.setName)
			chemObj.setName(name);
	},
	/** @private */
	doStoreMolFormulaLdr: function(ldr, block, chemObj, preferredInfoPropName)
	{
		/*
		var formulaText = Jcamp.LdrValueParserCoder.parseValue(ldr).trim();
		// actually, the formula text can be used directly in Kekule.js, just need to replace the sub/sup prefixes
		formulaText = formulaText.replace(new RegExp(Jcamp.Consts.MOL_FORMULA_SUP_PREFIX, 'g'), ' ');
		formulaText = formulaText.replace(new RegExp(Jcamp.Consts.MOL_FORMULA_SUB_PREFIX, 'g'), '');
		var formula = Kekule.FormulaUtils.textToFormula(formulaText, chemObj);
		*/
		var formula = Jcamp.LdrValueParserCoder.parseValue(ldr);
		if (formula && formula instanceof Kekule.MolecularFormula)
			chemObj.setFormula(formula);
	},
	/** @private */
	doStoreMolAtomListLdr: function(ldr, block, chemObj, preferredInfoPropName)
	{
		var atomInfos = [];
		var lines = ldr.valueLines;
		for (var i = 0, l = lines.length; i < l; ++i)
		{
			var line = lines[i].trim();
			if (line)
			{
				var parts = line.split(Jcamp.Consts.MOL_STRUCTURE_VALUE_GROUP_DELIMITER_PATTERN);
				var atomIndex = parseInt(parts[0]);
				var atomSymbol = (parts[1] || '').trim();
				var implicitHCount = parseInt(parts[2]) || null;
				if (atomSymbol && OU.notUnset(atomIndex))
				{
					/*
					atomInfos.push({
						'index': atomIndex,
						'symbol': atomSymbol,
						'implicitHCount': implicitHCount
					});
					*/
					atomInfos[atomIndex] = {
						'symbol': atomSymbol,
						'implicitHCount': implicitHCount
					};
				}
			}
		}
		//console.log('atom infos', atomInfos);
		this.setPropStoreFieldValue('currAtomInfos', atomInfos);
	},
	/** @private */
	doStoreMolBondListLdr: function(ldr, block, chemObj, preferredInfoPropName)
	{
		var bondInfos = [];
		var lines = ldr.valueLines;
		for (var i = 0, l = lines.length; i < l; ++i)
		{
			var line = lines[i].trim();
			if (line)
			{
				var parts = line.split(Jcamp.Consts.MOL_STRUCTURE_VALUE_GROUP_DELIMITER_PATTERN);
				var atomIndex1 = parseInt(parts[0]);
				var atomIndex2 = parseInt(parts[1]);
				var sBondType = parts[2].trim();
				if (OU.notUnset(atomIndex1) && OU.notUnset(atomIndex2) && sBondType)
				{
					//var bondTypeAndOrder = Jcamp.CsUtils.jcampBondTypeToKekule(sBondType);
					bondInfos.push({
						'atomIndex1': atomIndex1,
						'atomIndex2': atomIndex2,
						/*
						'bondType': bondTypeAndOrder.bondType,
						'bondOrder': bondTypeAndOrder.bondOrder
						*/
						'bondType': sBondType
					});
				}
			}
		}
		this.setPropStoreFieldValue('currBondInfos', bondInfos);
	},
	/** @private */
	doStoreMolChargeOrRadicalListLdr: function(chargeOrRadical, ldr, block, chemObj, preferredInfoPropName)
	{
		var infos = [];
		var fieldName = chargeOrRadical;
		var lines = ldr.valueLines;
		for (var i = 0, l = lines.length; i < l; ++i)
		{
			var line = lines[i].trim();
			if (line)
			{
				var parts = line.split(Jcamp.Consts.MOL_STRUCTURE_VALUE_GROUP_DELIMITER_PATTERN);
				var value = parseFloat(parts[0]);
				var atomIndexes = [];
				// the charge is delocalized to a set of atoms
				for (var j = 1, jj = parts.length; j < jj; ++j)
				{
					var index = parseInt(parts[j]);
					if (OU.notUnset(index) && index >= 0)
						atomIndexes.push(index);
				}
				if (OU.notUnset(value) && atomIndexes.length)
				{
					var info = {'atomIndexes': atomIndexes};
					info[fieldName] = value;
					infos.push(info);
				}
			}
		}
		if (fieldName === 'charge')
			this.setPropStoreFieldValue('currChargeInfos', infos);
		else if (fieldName === 'radical')
			this.setPropStoreFieldValue('currRadicalInfos', infos);
	},
	/** @private */
	doStoreMolCoordOrRasterFactorLdr: function(fieldName, ldr, block, chemObj, preferredInfoPropName)
	{
		var value = Jcamp.LdrValueParserCoder.parseValue(ldr) || 1;
		if (fieldName === 'coord')
			this.setPropStoreFieldValue('currCoordFactor', value);
		else if (fieldName === 'raster')
			this.setPropStoreFieldValue('currRasterFactor', value);
	},
	/** @private */
	doStoreMolCoordOrRasterCenterLdr: function(fieldName, ldr, block, chemObj, preferredInfoPropName)
	{
		var line = ldr.valueLines[0];
		if (line)
		{
			var parts = line.split(Jcamp.Consts.MOL_STRUCTURE_VALUE_GROUP_DELIMITER_PATTERN);
			var value = {'x': parseFloat(parts[0]), 'y': parseFloat(parts[1])}
			if (parts[2])
				value.z = parseFloat(parts[2]);
			if (fieldName === 'coord')
				this.setPropStoreFieldValue('currCoordCenter', value);
			else if (fieldName === 'raster')
				this.setPropStoreFieldValue('currRasterCenter', value);
		}
	},
	/** @private */
	doStoreMolCoordOrRasterListLdr: function(fieldName, ldr, block, chemObj, preferredInfoPropName)
	{
		var infos = [];
		var lines = ldr.valueLines;
		for (var i = 0, l = lines.length; i < l; ++i)
		{
			var line = lines[i].trim();
			if (line)
			{
				var parts = line.split(Jcamp.Consts.MOL_STRUCTURE_VALUE_GROUP_DELIMITER_PATTERN);
				var atomIndex = parseInt(parts[0]);
				var coords = [];
				for (var j = 1, jj = parts.length; j < jj; ++j)
				{
					var value = parseFloat(parts[j]);
					if (OU.notUnset(value))
						coords.push(value);
				}
				if (OU.notUnset(atomIndex) && coords.length)
				{
					var info = {
						'atomIndex': atomIndex,
						'x': coords[0],
						'y': coords[1],
						'z': coords[2]
					};
					infos.push(info);
				}
			}
		}
		if (fieldName === 'coord')
			this.setPropStoreFieldValue('currCoordInfos', infos);
		else if (fieldName === 'raster')
			this.setPropStoreFieldValue('currRasterInfos', infos);
	},

	/** @private */
	_buildStructure: function(molecule, infos, options)
	{
		var molAtomInfos = infos.atomInfos || this.getCurrAtomInfos() || [];
		var molBondInfos = infos.bondInfos || this.getCurrBondInfos() || [];
		var molChargeInfos = infos.chargeInfos || this.getCurrChargeInfos() || [];
		var molRadicalInfos = infos.radicalInfos || this.getCurrRadicalInfos() || [];
		var molCoordInfos = infos.coordInfos || this.getCurrCoordInfos() || [];
		var molCoordFactor = infos.coordFactor || this.getCurrCoordFactor() || 1;
		var molCoordCenter = infos.coordCenter || this.getCurrCoordCenter();
		var molRasterInfos = infos.rasterInfos || this.getCurrRasterInfos() || [];
		var molRasterFactor = infos.rasterFactor || this.getCurrRasterFactor();
		var molRasterCenter = infos.rasterCenter || this.getCurrRasterCenter();
		var needRasterScale;
		//console.log(molAtomInfos, molBondInfos);
		//console.log(molRasterFactor, molRasterCenter);

		molecule.beginUpdate();

		try
		{

			// create atoms
			var atoms = [];
			for (var i = 0, l = molAtomInfos.length; i < l; ++i)
			{
				var info = molAtomInfos[i];
				if (info)
				{
					var atom;
					if (info.symbol && info.symbol !== Jcamp.Consts.MOL_ATOM_SYMBOL_ANY)
					{
						var isoDetails = Jcamp.CsUtils.getJcampIsotopeIdDetails(info.symbol);
						atom = molecule.appendAtom(isoDetails.symbol, isoDetails.massNumber);
					}
					else
					{
						atom = new Kekule.Pseudoatom(null, Kekule.PseudoatomType.ANY);
						molecule.appendNode(atom);
					}
					atoms[i] = atom;
				}
			}
			// set coord2D/3D of atoms by raster and coord infos
			var CU = Kekule.CoordUtils;
			if (molCoordInfos.length)
			{
				var centerCoord = molCoordCenter || {'x': 0, 'y': 0, 'z': 0};
				for (var i = 0, l = molCoordInfos.length; i < l; ++i)
				{
					var info = molCoordInfos[i];
					if (info)
					{
						var atom = atoms[info.atomIndex];
						if (atom)
						{
							var coord = CU.multiply(CU.add({'x': info.x, 'y': info.y, 'z': info.z}, centerCoord), molCoordFactor);
							atom.setCoord3D(coord);
						}
					}
				}
			}
			if (molRasterInfos.length)
			{
				needRasterScale = !molRasterFactor && options.autoScaleCsRasterCoords && options.csRasterAutoScaleRefLength;
				var centerCoord = molRasterCenter || {'x': 0, 'y': 0};
				for (var i = 0, l = molRasterInfos.length; i < l; ++i)
				{
					var info = molRasterInfos[i];
					if (info)
					{
						var atom = atoms[info.atomIndex];
						if (atom)
						{
							var coord = CU.multiply(CU.add({'x': info.x, 'y': info.y}, centerCoord), molRasterFactor || 1);
							//coord = CU.divide(coord, 10000);
							atom.setCoord2D(coord);
							if (info.z)  // set to zIndex2D property of atom
								atom.setZIndex2D(info.z);
						}
					}
				}
			}

			// create bonds
			var bondLengthes = [];
			for (var i = 0, l = molBondInfos.length; i < l; ++i)
			{
				var info = molBondInfos[i];
				if (info)
				{
					var atom1 = atoms[info.atomIndex1];
					var atom2 = atoms[info.atomIndex2];
					var sBondType = info.bondType;
					var bondTypeAndOrder = Jcamp.CsUtils.jcampBondTypeToKekule(sBondType);
					var bond = molecule.appendBond([atom1, atom2], bondTypeAndOrder.bondOrder, bondTypeAndOrder.bondType);
					if (needRasterScale)
					{
						var bondLength = CU.getDistance(atom1.getCoord2D(), atom2.getCoord2D());
						if (bondLength)
							bondLengthes.push(bondLength);
					}
					if (options.determinateBondStereoByZIndex)
					{
						if (bondTypeAndOrder.bondType === Kekule.BondType.COVALENT && bondTypeAndOrder.bondOrder === Kekule.BondOrder.SINGLE)
						{
							// determinate the wedge or hash bond style by z index of atom1/atom2
							var zIndex1 = atom1.getZIndex2D() || 0;
							var zIndex2 = atom2.getZIndex2D() || 0;
							var stereo = (zIndex1 < zIndex2) ? Kekule.BondStereo.UP :
								(zIndex1 > zIndex2) ? Kekule.BondStereo.DOWN :
								null;
							if (!stereo && zIndex1 > 0 && options.enableCloserBondBetweenPositiveZIndexAtoms)  // zIndex1 == zIndex2 > 0
								stereo = Kekule.BondStereo.CLOSER;
							if (stereo)
								bond.setStereo(stereo);
						}
					}
				}
			}
			// adjust raster coords if needed
			if (needRasterScale && bondLengthes.length)
			{
				var median = Kekule.ArrayUtils.getMedian(bondLengthes);
				var rasterScale = options.csRasterAutoScaleRefLength / median;
				for (var i = 0, l = atoms.length; i < l; ++i)
				{
					var atom = atoms[i];
					if (atom)
					{
						var oldRaster = atom.getCoord2D();
						if (oldRaster)
							atom.setCoord2D(CU.multiply(oldRaster, rasterScale));
					}
				}
			}

			// map charges and radicals
			for (var i = 0, l = molChargeInfos.length; i < l; ++i)
			{
				var info = molChargeInfos[i];
				if (info && info.charge)
				{
					// TODO: currently the charge a averaged to each delocalization atom
					var delocalizationAtomCount = info.atomIndexes.length;
					if (delocalizationAtomCount)
					{
						var chargedAtoms = [];
						for (var j = 0; j < delocalizationAtomCount; ++j)
						{
							var atomIndex = info.atomIndexes[j];
							if (atoms[atomIndex])
								chargedAtoms.push(atoms[atomIndex]);
						}
						var averageCharge = info.charge / chargedAtoms.length;
						for (var j = 0, jj = chargedAtoms.length; j < jj; ++j)
						{
							chargedAtoms[j].setCharge(averageCharge);
						}
					}
				}
			}
			for (var i = 0, l = molRadicalInfos.length; i < l; ++i)
			{
				var info = molRadicalInfos[i];
				var radical = info && info.radical;
				if (radical)
				{
					// all atoms has the same radical
					for (var j = 0, jj = info.atomIndexes.length; j < jj; ++j)
					{
						var atom = atoms[info.atomIndexes[j]];
						if (atom)
							atom.setRadical(Jcamp.CsUtils.jcampRadicalToKekule(radical));
					}
				}
			}

			// use the explicit H count to validate the molecule structure, or set explicit H count
			for (var i = 0, l = molAtomInfos.length; i < l; ++i)
			{
				var info = molAtomInfos[i];
				if (info)
				{
					var atom = atoms[i];
					var storedImplicitHCount = info.implicitHCount;
					if (OU.notUnset(storedImplicitHCount))
					{
						var calculatedImplicitHCount = atom.getImplicitHydrogenCount();
						if (storedImplicitHCount !== calculatedImplicitHCount)
						{
							if (atom.setExplicitHydrogenCount)
								atom.setExplicitHydrogenCount(storedImplicitHCount);
							else
								Kekule.error(Kekule.$L('ErrorMsg.JCAMP_IMPLICIT_HYDROGEN_COUNT_NOT_MATCH_DETAIL').format(i, info.symbol, storedImplicitHCount, calculatedImplicitHCount));
						}
					}
				}
			}

			// if molecule ctab been built, we shall now clear the formula of it to avoid possible insync
			if (molecule.hasCtab() && molecule.hasFormula())
				molecule.removeFormula();
		}
		finally
		{
			molecule.endUpdate();
		}
	}
});

/**
 * Writer for writing a CS data block from a chem structure to JCAMP document tree.
 * The input chem object should be an instance of {@link Kekule.StructureFragment}.
 * @class
 * @augments Kekule.IO.Jcamp.BlockWriter
 */
Kekule.IO.Jcamp.CsDataBlockWriter = Class.create(Kekule.IO.Jcamp.BlockWriter,
/** @lends Kekule.IO.Jcamp.CsDataBlockWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.Jcamp.CsDataBlockWriter',
		/** @private */
	initProperties: function()
	{
		this.defineProp('atomIndexMap', {'dataType': DataType.OBJECT, 'setter': false, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});
	},
	/** @ignore */
	_initLdrCreators: function()
	{
		this.tryApplySuper('_initLdrCreators');
	},
	/** @ignore */
	getTitleForBlock: function(chemObj)
	{
		return chemObj.getInfoValue('title') || chemObj.getName() || chemObj.getId();
	},
	/** @ignore */
	doSaveJcampVersionToBlock: function(chemObj, block, options)
	{
		this.saveToLdrInBlock(block, chemObj, '', options.outputCsVersion || Kekule.globalOptions.IO.jcamp.outputCsVersion, Jcamp.Consts.LABEL_CS_VERSION);
	},
	/** @ignore */
	doSaveChemObjToBlock: function(chemObj, block, options)
	{
		this.tryApplySuper('doSaveChemObjToBlock', [chemObj, block, options]);
		var atomIndexMap = new Kekule.MapEx();
		try
		{
			this.setPropStoreFieldValue('atomIndexMap', atomIndexMap);
			// flatten the molecule first, since the JCAMP-CS can not save sub group
			// also convert explicit aromatic bonds to single/double, since they are also unable to be saved in CS
			var clonedMol = chemObj.clone(true);
			try
			{
				if (clonedMol.kekulize())
					clonedMol.kekulize();
				var flattenedMol = clonedMol.getFlattenedShadowFragment();
			}
			finally
			{
				clonedMol.finalize();
			}
			// info
			//this.doSaveMolInfoToBlock(chemObj, block, options);
			// formula
			this.doSaveMolFormulaToBlock(chemObj, block, options);

			if (flattenedMol.hasCtab())
			{
				var atomLdrs = this.doGenerateMolAtomsLdrs(flattenedMol, options);
				var bondLdrs = this.doGenerateMolBondsLdrs(flattenedMol, options);

				// atom basic property, index and symbol, to ATOMS ldr
				if (atomLdrs.atoms)
					this.setLdrInBlock(block, atomLdrs.atoms);
				// bond, to BONDS ldr
				if (bondLdrs.bonds)
					this.setLdrInBlock(block, bondLdrs.bonds);

				// charge and radicals
				if (atomLdrs.charges)
					this.setLdrInBlock(block, atomLdrs.charges);
				if (atomLdrs.radicals)
					this.setLdrInBlock(block, atomLdrs.radicals);

				// atom coord and raster
				if (atomLdrs.rasters)
				{
					if (atomLdrs.maxRaster)
						this.setLdrInBlock(block, atomLdrs.maxRaster);
					if (atomLdrs.rasterFactor)
						this.setLdrInBlock(block, atomLdrs.rasterFactor);
					if (atomLdrs.rasterCenter)
						this.setLdrInBlock(block, atomLdrs.rasterCenter);
					this.setLdrInBlock(block, atomLdrs.rasters);
				}
				if (atomLdrs.coords && atomLdrs.coordFactor)
				{
					if (atomLdrs.maxCoord)
						this.setLdrInBlock(block, atomLdrs.maxCoord);
					this.setLdrInBlock(block, atomLdrs.coordFactor);
					if (atomLdrs.coordCenter)
						this.setLdrInBlock(block, atomLdrs.coordCenter);
					this.setLdrInBlock(block, atomLdrs.coords);
				}
			}
		}
		finally
		{
			atomIndexMap.finalize();
		}
	},
	/* @private */
	/*
	doSaveMolInfoToBlock: function(chemObj, block, options)
	{
		// infos
		var keys = chemObj.getInfoKeys();
		for (var i = 0, l = keys.length; i < l; ++i)
		{
			var key = keys[i];
			var jsValue = chemObj.getInfoValue(key);
			if (Kekule.ObjUtils.notUnset(jsValue))
			{
				this.doSaveMolInfoItemToBlock(chemObj, key, key, jsValue, block, options);
			}
		}
		// generate datetime
		this.saveToLdrInBlock(block, chemObj, '', new Date(), 'LONGDATE', false);
	},
	*/
	/* @private */
	/*
	doSaveMolInfoItemToBlock: function(chemObj, infoKey, infoJsCascadeName, infoValue, block, options)
	{
		var ignoredInfoKeys = ['title', 'date'];
		if (ignoredInfoKeys.indexOf(infoKey) >= 0)
			return;
		var ignoredLabels = [Jcamp.Consts.LABEL_BLOCK_BEGIN, Jcamp.Consts.LABEL_BLOCK_END, Jcamp.Consts.LABEL_DX_VERSION, Jcamp.Consts.LABEL_CS_VERSION];
		// those labels are handled individually, do not save here
		var jcampLabelName = Jcamp.Utils.kekuleLabelNameToJcamp(infoKey, null);
		if (ignoredLabels.indexOf(jcampLabelName) < 0)
		{
			this.saveToLdrInBlock(block, chemObj, infoJsCascadeName, infoValue, jcampLabelName, false);  // do not overwrite existing labels
		}
	},
	*/
	/** @private */
	doSaveMolFormulaToBlock: function(chemObj, block, options)
	{
		var formula = chemObj.calcFormula();
		/*
		var sections = AU.clone(formula.getSections());
		// sort
		var getSortIndexes = function(formulaSection)
		{
			var primary = 'ZZZZZ', secondary = 0;
			var atom = formulaSection.obj;
			if (atom)
			{
				if (atom.getSymbol)
					primary = atom.getSymbol();
				// C/H will be put to head of seq
				if (primary === 'C')
					primary = '0';
				else if (primary === 'H')
					primary = '1';
				if (atom.getMassNumber)
					secondary = atom.getMassNumber() || 0;
			}
			return [primary, secondary];
		};
		sections.sort(function(sec1, sec2){
			var i1 = getSortIndexes(sec1);
			var i2 = getSortIndexes(sec2);
			return AU.compare(i1, i2);
		});

		var outputItems = [];
		for (var i = 0, l = sections.length; i < l; ++i)
		{
			var sec = sections[i];
			var atom = sec.obj;
			var count = sec.count;
			var symbol = atom.getLabel && atom.getLabel();
			if (atom.getMassNumber && atom.getMassNumber())
				symbol = Jcamp.Consts.MOL_FORMULA_SUP_PREFIX + symbol;
			if (count > 1)
				symbol += count;
			outputItems.push(symbol);
		}
		var valueLine = outputItems.join(' ');
		*/
		if (formula)
			this.saveToLdrInBlock(block, chemObj, '', formula, Jcamp.Consts.LABEL_MOL_FORMULA);
	},
	/** @private */
	doGenerateMolAtomsLdrs: function(mol, options)
	{
		var atomIndexMap = this.getAtomIndexMap();
		var atomListLdr, atomChargeLdr, atomRadicalLdr,
			atomCoordLdr, atomCoordFactorLdr, atomCoordCenterLdr, atomRasterLdr, atomRasterFactorLdr, atomRasterCenterLdr,
			atomMaxCoordLdr, atomMaxRasterLdr;
		var currIndex = 1;
		var atomListValueLines = [''];
		var atomCoordLines = [''];
		var atomRasterLines = [''];
		var chargeItems = [];
		var radicalMap = [];
		var coords = [];
		var rasters = [];
		var getCoord = function(node, coordMode)
		{
			if (node.hasCoordOfMode(coordMode))
			{
				var method = node.getAbsCoordOfMode || node.getCoordOfMode;
				return method.apply(node, [coordMode]);
			}
			else
				return null;
		}
		var hasCoord3D, hasCoord2D;
		for (var i = 0, l = mol.getNodeCount(); i < l; ++i)
		{
			var node = mol.getNodeAt(i);
			if (node instanceof Kekule.ChemStructureNode)
			{
				var symbol;
				var isotope = node.getPrimaryIsotope && node.getPrimaryIsotope();
				if (isotope)
					symbol = Jcamp.CsUtils.kekuleIsotopeToJcampIsotopeId(isotope);
				else
					symbol = Jcamp.Consts.MOL_ATOM_SYMBOL_ANY;  // TODO: does pseudo atom is allowed in CS?
				var hCount = node.getHydrogenCount && node.getHydrogenCount(false);  //node.getImplicitHydrogenCount && node.getImplicitHydrogenCount();
				var parts = [currIndex, symbol];
				if (hCount)
					parts.push(hCount);
				atomListValueLines.push(parts.join(Jcamp.Consts.MOL_STRUCTURE_VALUE_GROUP_DELIMITER));

				// coord3D
				//if (hasCoord3D)
				{
					var coord3D = getCoord(node, Kekule.CoordMode.COORD3D);
					if (coord3D)
						hasCoord3D = true;
					else
						coord3D = {'x': 0, 'y': 0, 'z': 0};
					coord3D._index = currIndex;
					coords.push(coord3D);
					/*
					parts = [currIndex, coord3D.x || 0, coord3D.y || 0, coord3D.z || 0];
					atomCoordLines.push(parts.join(Jcamp.Consts.MOL_STRUCTURE_VALUE_GROUP_DELIMITER));
					*/
				}
				// coord2D
				//if (hasCoord2D)
				{
					var coord2D = getCoord(node, Kekule.CoordMode.COORD2D);
					if (coord2D)
						hasCoord2D = true;
					else
						coord2D = {'x': 0, 'y': 0};
					coord2D._index = currIndex;
					var zIndex = node.getZIndex2D && node.getZIndex2D();
					if (zIndex)
						coord2D.zIndex = zIndex;
					rasters.push(coord2D);
					/*
					atomRasterLines.push(parts.join(Jcamp.Consts.MOL_STRUCTURE_VALUE_GROUP_DELIMITER));
					*/
				}

				// charge
				var charge = node.getCharge && node.getCharge();
				if (charge)
					chargeItems.push({'charge': Math.round(charge), 'atomIndex': currIndex});
				// radical
				var radical = node.getRadical && node.getRadical();
				if (radical)
				{
					radical = Jcamp.CsUtils.kekuleRadicalToJcamp(radical);
					if (!radicalMap[radical])
						radicalMap[radical] = [currIndex];
					else
						radicalMap[radical].push(currIndex);
				}

				atomIndexMap.set(node, currIndex);
				++currIndex;
			}
		}

		// create atom list LDR
		if (atomListValueLines.length > 1)  // really has atoms
			atomListLdr = this.createLdrRaw(Jcamp.Consts.LABEL_MOL_ATOMLIST, atomListValueLines);

		// create atom charge list lDR
		if (chargeItems.length)
		{
			var valueLines = [''];
			for (var i = 0, l = chargeItems.length; i < l; ++i)
			{
				var item = chargeItems[i];
				if (item)
				{
					var sCharge = (item.charge > 0) ? '+' + item.charge : item.charge.toString();
					var parts = [sCharge, item.atomIndex];
					valueLines.push(parts.join(Jcamp.Consts.MOL_STRUCTURE_VALUE_GROUP_DELIMITER));
				}
			}
			atomChargeLdr = this.createLdrRaw(Jcamp.Consts.LABEL_MOL_CHARGELIST, valueLines);
		}
		// create atom radical LDR
		if (radicalMap.length)
		{
			var valueLines = [''];
			for (var i = 0, l = radicalMap.length; i < l; ++i)
			{
				var item = radicalMap[i];
				if (item)
				{
					var parts = [i];  // radical number
					parts = parts.concat(radicalMap[i]);  // atom indexes
					valueLines.push(parts.join(Jcamp.Consts.MOL_STRUCTURE_VALUE_GROUP_DELIMITER));
				}
			}
			if (valueLines.length > 1)
				atomRadicalLdr = this.createLdrRaw(Jcamp.Consts.LABEL_MOL_RADICALLIST, valueLines);
		}

		// create coord/raster LDR, note we need to convert the coords into integer
		var CU = Kekule.CoordUtils;
		var atomCoordSets = [hasCoord2D? rasters: [], hasCoord3D? coords: []];  // 2D and 3D coords
		for (var i = 0, l = atomCoordSets.length; i < l; ++i)
		{
			var maxCoordValue;
			var atomCoords = atomCoordSets[i];
			var valueLines = [''];
			var fields = (i === 0)? ['x', 'y']: ['x', 'y', 'z'];
			if (atomCoords.length)
			{
				// determinate the factor to convert all coords to integer
				/*
				var containerBox = CU.getContainerBox(atomCoords);
				var delta = {'x': containerBox.x2 - containerBox.x1, 'y': containerBox.y2 - containerBox.y1, 'z': (containerBox.z2 - containerBox.z1) || 0};
				var distance = CU.getDistance(delta, {'x': 0, 'y': 0, 'z': 0});
				var factor = 1 / options.csCoordAllowedSavingErrorRatio;
				var decimalPos = Kekule.NumUtils.getDecimalPointPos(distance);
				if (decimalPos < 0)
				{
					factor *= Math.pow(10, -decimalPos);
				}
				*/
				var centerCoord = CU.getCenter(atomCoords);
				var cornerCoords = CU.getContainerBoxCorners(atomCoords);
				cornerCoords.min = CU.substract(cornerCoords.min, centerCoord);
				cornerCoords.max = CU.substract(cornerCoords.max, centerCoord);
				var preferredCoordMin = {}, preferredCoordMax = {};
				preferredCoordMin.x = preferredCoordMin.y = preferredCoordMin.z = options.csCoordPreferredScaledRange.min;
				preferredCoordMax.x = preferredCoordMax.y = preferredCoordMax.z = options.csCoordPreferredScaledRange.max;
				var factor = Jcamp.CsUtils.calcFactorForCoordRange(cornerCoords.min, cornerCoords.max, options.csCoordAllowedSavingErrorRatio, preferredCoordMin, preferredCoordMax);
				//console.log(cornerCoords, centerCoord, factor);
				// convert coord values
				for (var j = 0, jj = atomCoords.length; j < jj; ++j)
				{
					var parts = [atomCoords[j]._index];  // atom index
					var coord = CU.divide(CU.substract(atomCoords[j], centerCoord), factor);
					for (var k = 0, kk = fields.length; k < kk; ++k)
					{
						var field = fields[k];
						var v = Math.round(coord[field] || 0);
						parts.push(v);
						if (Kekule.ObjUtils.isUnset(maxCoordValue) || v > maxCoordValue)
							maxCoordValue = v;
					}
					if (atomCoords[j].zIndex)  // zIndex in coord2D
						parts.push(atomCoords[j].zIndex);
					valueLines.push(parts.join(Jcamp.Consts.MOL_STRUCTURE_VALUE_GROUP_DELIMITER));
				}
				// center coord
				var coord = CU.divide(centerCoord, factor);
				var parts = [];
				for (var k = 0, kk = fields.length; k < kk; ++k)
				{
					var field = fields[k];
					parts.push(Math.round(coord[field] || 0));
				}
				var centerCoordValueLine = parts.join(Jcamp.Consts.MOL_STRUCTURE_VALUE_GROUP_DELIMITER);

				if (valueLines.length > 1)
				{
					if (i === 0)  // raster
					{
						atomRasterLdr = this.createLdrRaw(Jcamp.Consts.LABEL_MOL_RASTERLIST, valueLines);
						atomRasterFactorLdr = this.createLdr('', factor, Jcamp.Consts.LABEL_MOL_RASTER_FACTOR);
						atomRasterCenterLdr = this.createLdr('', centerCoordValueLine, Jcamp.Consts.LABEL_MOL_RASTER_CENTER);
						atomMaxRasterLdr = this.createLdr('', maxCoordValue, Jcamp.Consts.LABEL_MOL_MAX_RASTER);
					}
					else
					{
						atomCoordLdr = this.createLdrRaw(Jcamp.Consts.LABEL_MOL_COORDLIST, valueLines);
						atomCoordFactorLdr = this.createLdr('', factor, Jcamp.Consts.LABEL_MOL_COORD_FACTOR);
						atomCoordCenterLdr = this.createLdr('', centerCoordValueLine, Jcamp.Consts.LABEL_MOL_COORD_CENTER);
						atomMaxCoordLdr = this.createLdr('', maxCoordValue, Jcamp.Consts.LABEL_MOL_MAX_COORD);
					}
				}
			}
		}

		return {
			'atoms': atomListLdr,
			'charges': atomChargeLdr,
			'radicals': atomRadicalLdr,
			'rasters': atomRasterLdr,
			'rasterFactor': atomRasterFactorLdr,
			'rasterCenter': atomRasterCenterLdr,
			'coords': atomCoordLdr,
			'coordFactor': atomCoordFactorLdr,
			'coordCenter': atomCoordCenterLdr,
			'maxCoord': atomMaxCoordLdr,
			'maxRaster': atomMaxRasterLdr
		}
	},
	/** @private */
	doGenerateMolBondsLdrs: function(mol, options)
	{
		var atomIndexMap = this.getAtomIndexMap();
		var valueLines = [''];
		for (var i = 0, l = mol.getConnectorCount(); i < l; ++i)
		{
			var connector = mol.getConnectorAt(i);
			if (connector instanceof Kekule.Bond)
			{
				var parts = [];
				var nodes = connector.getConnectedChemNodes();
				for (var j = 0, jj = nodes.length; j < jj; ++j)
				{
					var index = atomIndexMap.get(nodes[j]);
					if (OU.notUnset(index))
					{
						parts.push(index);
						if (parts.length >= 2)  // CS format can only handles bond connecting two atoms
							break;
					}
				}
				var bondType = Jcamp.CsUtils.kekuleBondTypeAndOrderToJcampBondType(connector.getBondType(), connector.getBondOrder());
				parts.push(bondType);
				valueLines.push(parts.join(Jcamp.Consts.MOL_STRUCTURE_VALUE_GROUP_DELIMITER));
			}
		}
		var result = {};
		if (valueLines.length > 1)  // has real bonds
		{
			result.bonds = this.createLdrRaw(Jcamp.Consts.LABEL_MOL_BONDLIST, valueLines);
		}
		return result;
	}
});

// register
Jcamp.BlockReaderManager.register(Jcamp.BlockType.DATA, Jcamp.Format.CS, Kekule.IO.Jcamp.CsDataBlockReader);
Jcamp.BlockWriterManager.register(Kekule.StructureFragment, Kekule.IO.Jcamp.CsDataBlockWriter);

})();
