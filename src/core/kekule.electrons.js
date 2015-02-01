/**
 * @fileoverview
 * This file contains basic classes related with electrons (bond, lone pair...).
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /utils/kekule.utils.js
 */

/**
 * Represent an abstract electron set (bond, lone pair, etc.).
 * @class
 * @augments Kekule.ChemObject
 * @param {Float} electronCount Count of electrons in this set.
 *   Note that there may be partial electron in set, so a float value is used here.
 *
 * @property {Float} electronCount Count of electrons in this set.
 *   Note that there may be partial electron in set, so a float value is used here.
 */
Kekule.ElectronSet = Class.create(Kekule.ChemObject,
/** @lends Kekule.ElectronSet# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ElectronSet',
	/**
	 * @constructs
	 */
	initialize: function($super, electronCount)
	{
		$super();
		this.setElectronCount(electronCount || Kekule.ElectronSet.UNSET_ELECTRONCOUNT);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('electronCount', {'dataType': DataType.FLOAT});
	}
});
/**
 * Indicate the electron count is uncertain.
 * @constant
 */
Kekule.ElectronSet.UNSET_ELECTRONCOUNT = null;

/**
 * Represent unbonded form of electron sets.
 * @class
 * @augments Kekule.ElectronSet
 * @param {Float} electronCount Count of electrons in this set. If this param is not set,
 *   electron count will be regarded as bondOrder * 2.
 */
Kekule.UnbondedElectronSet = Class.create(Kekule.ElectronSet,
/** @lends Kekule.UnbondedElectronSet# */
{
	/** @private */
	CLASS_NAME: 'Kekule.UnBondedElectronSet',
	/**
	 * @constructs
	 */
	initialize: function($super, electronCount)
	{
		$super(electronCount);
	},
	/** @private */
	initProperties: function()
	{
	}
});

/**
 * Enumeration of bond types
 * @class
 */
Kekule.BondType = {
	/** Covalent bond, the default bond type */
	COVALENT: 'covalent',
	/** Ionic bond */
	IONIC: 'ionic',
	/** Coordinate bond */
	COORDINATE: 'coordinate',
	/** Metallic bond' */
	METALLIC: 'metallic',
	/** HYDROGEN bond */
	HYDROGEN: 'hydrogen',
	/** Unknown */
	UNKNOWN: null,
	/** Default type is covalent bond */
	DEFAULT: 'covalent'
};

/**
 * Enumeration of bond orders
 * @class
 */
Kekule.BondOrder = {
	/** Single bond */
	SINGLE: 1,
	/** Double bond. */
	DOUBLE: 2,
	/** Triple bond. */
	TRIPLE: 3,
	/** Quadruple bond. */
	QUAD: 4,
	/** Explicit Aromatic bond. */
	EXPLICIT_AROMATIC: 10,
	/** Other form of bond. */
	OTHER: 20,
	/** Uncertain bond. */
	UNSET: null,
	/** Default is a single bond */
	DEFAULT: 1,

	/**
	 * Get min valence of an atom to connect to a bond.
	 * @param {Object} bondOrder
	 * @returns {Float} Aromatic bond will return 1.5, means it is between single and double bond.
	 */
	getBondValence: function(bondOrder)
	{
		if (bondOrder === Kekule.BondOrder.UNSET)
			return 0;
		else if (bondOrder == Kekule.BondOrder.EXPLICIT_AROMATIC)
			return 1.5;
		else
			return bondOrder;
	}
};

/**
 * Represent a typical bond form of molecule.
 * @class
 * @augments Kekule.ElectronSet
 * @param {Int} bondOrder Order of bond. Usually electronCount / 2.
 * @param {Float} electronCount Count of electrons in this set. If this param is not set,
 *   electron count will be regarded as bondOrder * 2.
 * @param {String} bondType Type of bond, a value from {@link Kekule.BondType}.
 *   If not specified, the bond will be regarded as a covalent one.
 *
 * @property {String} bondType Type of bond, a value from {@link Kekule.BondType}.
 * @property {Num} bondOrder Order of bond. Values should be retrieved from {@link Kekule.BondOrder}.
 * @property {Num} bondValence Valence comsumed of an atom to connect to this bond. Note this value is different from {@link Kekule.BondForm#bondOrder},
 *   For example, bondOrder value for {@link Kekule.BondOrder.EXPLICIT_AROMATIC} is 10, but the valence is 1.5. This property is read only.
 */
Kekule.BondForm = Class.create(Kekule.ElectronSet,
/** @lends Kekule.BondForm# */
{
	/** @private */
	CLASS_NAME: 'Kekule.BondForm',
	/**
	 * @constructs
	 */
	initialize: function($super, bondOrder, electronCount, bondType)
	{
		$super(electronCount);
		this.setBondOrder(bondOrder || Kekule.BondOrder.DEFAULT);
		if (Kekule.ObjUtils.notUnset(bondType))
			this.setBondType(bondType);
		if (Kekule.ObjUtils.notUnset(electronCount))
			this.setElectronCount(electronCount);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('bondType', {
			'dataType': DataType.STRING,
			'enumSource': Kekule.BondType,
			'getter': function() { var r = this.getPropStoreFieldValue('bondType'); return (r? r: Kekule.BondType.DEFAULT); }
		});
		this.defineProp('bondOrder', {
			'dataType': DataType.FLOAT,
			'enumSource': Kekule.BondOrder,
			'setter': function(value)
				{
					if (this.getPropStoreFieldValue('bondOrder') != value)
					{
						this.setPropStoreFieldValue('bondOrder', value);
						if (value)
						{
							if (this.getBondType() == Kekule.BondType.COVALENT)
							{
								this.setElectronCount(this.getBondValence() * 2);
							}
						}
						else if (value === Kekule.BondOrder.UNSET)
							this.setElectronCount(Kekule.ElectronSet.UNSET_ELECTRONCOUNT);
					}
				}
		});
		this.defineProp('electronCount', {
			'dataType': DataType.FLOAT
		});
		this.defineProp('bondValence', {
			'dataType': DataType.FLOAT,
			'serializable': false,
			'getter': function() { return Kekule.BondOrder.getBondValence(this.getBondOrder()); },
			'setter': null
		});
	}
});

/*
 * Indicate the bond order is uncertain.
 * @constant
 */
//Kekule.BondForm.UNSET_BONDORDER = null;

//======================================================
/**
 * Factory to create and get suitable bond form objects.
 * @class
 */
Kekule.BondFormFactory = {
	/** @private */
	_bondForms: {},
	/** @private */
	getBondFormId: function(bondOrder, electronCount, bondType)
	{
		var result = '';
		if (bondType)
			result += bondType + '_';
		if (bondOrder)
			result += Number(bondOrder).toString();
		if (electronCount)
			result += '_' + Number(electronCount).toString();
		return result;
	},
	/**
	 * Returns a suitable {@link Kekule.BondForm} object.
	 * @param {Int} bondOrder Order of bond.
	 * @param {Float} electronCount Number of electrons. Usually you can bypass this param.
	 * @param {String} bondType Type of bond.
	 * @returns {Kekule.BondForm}
	 */
	getBondForm: function(bondOrder, electronCount, bondType)
	{
		if ((!bondOrder) && (!electronCount) && (!bondType))
			return undefined;
		if (!bondType)
			bondType = Kekule.BondType.DEFAULT;
		if ((!electronCount) && (bondOrder) && (bondType === Kekule.BondType.COVALENT))
		{
			var bondValence = Kekule.BondOrder.getBondValence(bondOrder);
			electronCount = bondValence * 2;
		}
		var id = Kekule.BondFormFactory.getBondFormId(bondOrder, electronCount, bondType);
		if (!Kekule.BondFormFactory._bondForms[id])
			Kekule.BondFormFactory._bondForms[id] = new Kekule.BondForm(bondOrder, electronCount, bondType);
		return Kekule.BondFormFactory._bondForms[id];
	}
};

/**
 * Enumeration of radical types
 * @class
 */
Kekule.RadicalOrder = {
	NONE: 0,
	SINGLET: 1,
	DOUBLET: 2,
	TRIPLET: 3,
	DEFAULT: 0,

	/**
	 * Returns the electron number of this radical.
	 * @param {Int} radicalOrder Value from {@link Kekule.RadicalOrder}.
	 * @returns {Int}
	 */
	getRadicalElectronCount: function(radicalOrder)
	{
		var O = Kekule.RadicalOrder;
		if (Kekule.ObjUtils.isUnset(radicalOrder) || (radicalOrder === O.NONE))
			return 0;
		else if (radicalOrder === O.DOUBLET)
			return 1;
		else
			return 2;
	}
};

/**
 * Enumeration of hybridization types
 * @class
 */
Kekule.HybridizationType = {
	/** hybridization type is not determined. **/
	UNKNOWN: null,
	/** sp. **/
	SP: 1,
	/** sp2 **/
	SP2: 2,
	/** sp3 **/
	SP3: 3,
	/** Explicitly no hybridization. */
	NONE: 0
};