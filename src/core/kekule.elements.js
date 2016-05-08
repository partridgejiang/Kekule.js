/**
 * @fileoverview
 * This file contains basic classes to represent an element or isotope.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /data/kekule.dataUtils.js
 * requires /localization/
 */

/**
 * Enumeration of series of element.
 * @enum
 */
Kekule.ElementSeries = {
	NONMETAL: 'Nonmetals',
	METAL: 'Metals',
	ALKALI_METAL: 'Alkali Metals',
	ALKALI_EARTH_METAL: 'Alkali Earth Metals',
	TRANSITION_METAL: 'Transition Metals',
	METALLOID: 'Metalloids',
	HALOGEN: 'Halogens',
	NOBLE_GAS: 'Noble Gases',
	LANTHANIDE: 'Lanthanides',
	ACTINIDE: 'Actinides'
};

/**
 * Represent an element in periodical table.
 * @class
 * @augments Kekule.ChemObject
 * @param {Variant} symbolOrAtomicNumber Symbol(String) or atomic number(Int) of element.
 *
 * @property {Int} atomicNumber The atomic number of element. Read only.
 * @property {String} symbol The symbol of element. Read only.
 * @property {String} name Name of element. Read only.
 * @property {Int} group Group of element. Read only.
 * @property {Int} period Period of element. Read only.
 * @property {String} series Series of element, e.g. nonmetal.
 * @property {Float} naturalMass Natural mass of element.
 */
Kekule.Element = Class.create(Kekule.ChemObject,
/** @lends Kekule.Element# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Element',
	/**
	 * @constructs
	 * @param {Variant} symbolOrAtomicNumber Symbol (String) or atomic number (Int) of element.
	 */
	initialize: function($super, symbolOrAtomicNumber)
	{
		$super();
		if (symbolOrAtomicNumber != Kekule.Element.UNSET_ELEMENT)
		{
			var elemInfo = this.getElementInfo(symbolOrAtomicNumber);
			if (elemInfo)
			{
				this.setPropStoreFieldValue('symbol', elemInfo.symbol);
				this.setPropStoreFieldValue('atomicNumber', elemInfo.atomicNumber);
				this.setPropStoreFieldValue('group', elemInfo.group);
				this.setPropStoreFieldValue('period', elemInfo.period);
				this.setPropStoreFieldValue('series', elemInfo.chemicalSerie);
				this.setPropStoreFieldValue('naturalMass', elemInfo.naturalMass);
				if (elemInfo.name)
					this.setPropStoreFieldValue('name', elemInfo.name);
			}
			else
			{
				Kekule.chemError(
					Kekule.hasLocalRes()?
						/*Kekule.ErrorMsg.INVALID_CHEMELEMENT*/Kekule.$L('ErrorMsg.INVALID_CHEMELEMENT') + ': ' + symbolOrAtomicNumber :
						'Invalid chemical element: ' + symbolOrAtomicNumber
				);
			}
		}
		else
		{
			this.setPropStoreFieldValue('symbol', Kekule.Element.UNSET_ELEMENT);
			this.setPropStoreFieldValue('atomicNumber', Kekule.Element.UNSET_ELEMENT);
			/*
			this.setPropStoreFieldValue('group', Kekule.Element.UNSET_ELEMENT);
			this.setPropStoreFieldValue('period', Kekule.Element.UNSET_ELEMENT);
			*/
		}
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('name', {'dataType': DataType.STRING, 'serializable': false, 'setter': null});
		// Atomic number must be setted in constructor
		this.defineProp('atomicNumber', {'dataType': DataType.INT, 'serializable': false, 'setter': null});
		// Symbol of element, read only. fsymbol must be setted in constructor
		this.defineProp('symbol', {'dataType': DataType.STRING, 'serializable': false, 'setter': null});

		this.defineProp('group', {'dataType': DataType.INT, 'serializable': false, 'setter': null});
		this.defineProp('period', {'dataType': DataType.INT, 'serializable': false, 'setter': null});
		this.defineProp('series', {'dataType': DataType.STRING, 'serializable': false, 'setter': null});
		this.defineProp('naturalMass', {'dataType': DataType.FLOAT, 'serializable': false, 'setter': null});
	},
	/**
	 * Get element info of symbolOrAtomicNumber. Support pseudo element.
	 * @param {Object} symbolOrAtomicNumber
	 */
	getElementInfo: function(symbolOrAtomicNumber)
	{
		if (symbolOrAtomicNumber == Kekule.Element.UNSET_ELEMENT)
			return {'symbol': Kekule.Element.UNSET_ELEMENT, 'atomicNumber': Kekule.Element.UNSET_ELEMENT};
		if (Kekule.Element.isDummyElement(symbolOrAtomicNumber))
			return {'symbol': Kekule.Element.DUMMY_ELEMENT, 'atomicNumber': Kekule.Element.DUMMY_ELEMENT_ATOMICNUM};
		else if (Kekule.Element.isRGroup(symbolOrAtomicNumber))
			return {'symbol': Kekule.Element.RGROUP_ELEMENT, 'atomicNumber': Kekule.Element.RGROUP_ELEMENT_ATMOICNUM};
		else
			return Kekule.ChemicalElementsDataUtil.getElementInfo(symbolOrAtomicNumber);
	},
	/**
	 * Roughly get the theoretic valence of an element in a certain group.
	 * The transitionmetal is not considered and will return null.
	 * @returns {Int} Theoretic valence or null on transitionmetal.
	 */
	getTheoreticValence: function()
	{
		if (this.getGroup())
			return Kekule.Element.getTheoreticValenceOfGroup(this.getGroup());
		else
			return null;
	},
	/**
	 * Check if current element is a "dummy" one.
	 * @returns {Bool}
	 */
	isDummyElement: function()
	{
		return this.getAtomicNumber() == Kekule.Element.DUMMY_ELEMENT_ATOMICNUM;
	},
	/**
	 * Check if this element is used to represent an RGroup
	 * @returns {Bool}
	 */
	isRGroupElement: function()
	{
		return this.getAtomicNumber() == Kekule.Element.RGROUP_ELEMENT_ATMOICNUM;
	},
	/**
	 * Check if this is a normal element (not pseudo one, not unset one).
	 * @returns {Bool}
	 */
	isNormalElement: function()
	{
		return Kekule.Element.isNormalElement(this.getAtomicNumber());
	},
	/**
	 * Check if symbolOrAtomicNumber is same with this object.
	 * @param {Variant} symbolOrAtomicNumber Symbol (String) or atomic number (Int) of element.
	 * @returns {Bool}
	 */
	isSameElement: function(symbolOrAtomicNumber)
	{
		if (symbolOrAtomicNumber == Kekule.Element.UNSET_ELEMENT)
			return this.getAtomicNumber() == Kekule.Element.UNSET_ELEMENT;
		else if (typeof(symbolOrAtomicNumber) == 'number')
			return this.getAtomicNumber() == symbolOrAtomicNumber;
		else
			return this.getSymbol() == symbolOrAtomicNumber;
	},
	/**
	 * Returns whether this element is a hetero one (e.g., N, S, Cl...).
	 * @returns {Bool}
	 */
	isHetero: function()
	{
		return ((this.getSeries() === Kekule.ElementSeries.NONMETAL) || (this.getSeries() === Kekule.ElementSeries.HALOGEN))
			&& (this.getAtomicNumber() !== 6) && (this.getAtomicNumber() !== 1); // not C/H
	},
	/**
	 * Returns a string label to represent this element.
	 * @returns {String}
	 */
	getLabel: function()
	{
		return this.getSymbol();
	}
});
// Copy all methods of Kekule.ChemicalElementsDataUtil to Element as shortcut
Object.extend(Kekule.Element, Kekule.ChemicalElementsDataUtil);


/**
 * Indicate the atomic number is unset and this is a unknown element.
 * @constant
 */
Kekule.Element.UNSET_ELEMENT = undefined;
/**
 * A pseudo element to indicate a dummy atom.
 * @constant
 */
Kekule.Element.DUMMY_ELEMENT = 'DU';
Kekule.Element.DUMMY_ELEMENT_ATOMICNUM = -1;
/**
 * A pseudo element to indicate a R-Group
 * @constant
 */
Kekule.Element.RGROUP_ELEMENT = 'R';
Kekule.Element.RGROUP_ELEMENT_ATOMICNUM = -2;
/**
 * Label for deuterium.
 * @constant
 */
Kekule.Element.DEUTERIUM = 'D';
/**
 * Check if symbolOrAtomicNumber is a normal element (not pseudo one, not unset one).
 * @function
 * @param {Variant} symbolOrAtomicNumber
 * @returns {Bool}
 */
Kekule.Element.isNormalElement = function(symbolOrAtomicNumber)
{
	return (symbolOrAtomicNumber != Kekule.Element.UNSET_ELEMENT)
		&& (!Kekule.Element.isPseudoElement(symbolOrAtomicNumber))
};
/**
 * Check if symbolOrAtomicNumber is a pseudo element of dummy or RGroup.
 * @function
 * @param {Variant} symbolOrAtomicNumber
 * @returns {Bool}
 * @funtion
 */
Kekule.Element.isPseudoElement = function(symbolOrAtomicNumber)
{
	if (typeof(symbolOrAtomicNumber) == 'string')
		return (symbolOrAtomicNumber == Kekule.Element.DUMMY_ELEMENT) || (symbolOrAtomicNumber == Kekule.Element.RGROUP_ELEMENT);
	else
		return (symbolOrAtomicNumber == Kekule.Element.DUMMY_ELEMENT_ATOMICNUM) || (symbolOrAtomicNumber == Kekule.Element.RGROUP_ELEMENT_ATMOICNUM);
};
/**
 * Check if symbolOrAtomicNumber is a dummy element.
 * @function
 * @param {Variant} symbolOrAtomicNumber
 * @returns {Bool}
 */
Kekule.Element.isDummyElement = function(symbolOrAtomicNumber)
{
	return (symbolOrAtomicNumber === Kekule.Element.DUMMY_ELEMENT) || (symbolOrAtomicNumber === Kekule.Element.DUMMY_ELEMENT_ATOMICNUM);
};
/**
 * Check if symbolOrAtomicNumber is a RGroup
 * @function
 * @param {Variant} symbolOrAtomicNumber
 * @returns {Bool}
 */
Kekule.Element.isRGroup = function(symbolOrAtomicNumber)
{
	return (symbolOrAtomicNumber === Kekule.Element.RGROUP_ELEMENT) || (symbolOrAtomicNumber === Kekule.Element.RGROUP_ELEMENT_ATOMICNUM);
};
/**
 * Roughly get the theoretic valence of an element in a certain group.
 * The transitionmetal is not considered and will return null.
 * @function
 * @param {Int} group
 * @returns {Int} Theoretic valence or null on transitionmetal.
 */
Kekule.Element.getTheoreticValenceOfGroup = function(group)
{
	if (group <= 2)
		return group;
	else if (group <= 12)
		return null;
	else if (group <= 17)
		return group - 10;
	else  // group 18
		return 0;
};
/**
 * Roughly get the theoretic valence of an element. Only consider the group of element.
 * The transitionmetal is not considered and will return null.
 * @function
 * @param {Object} symbolOrAtomicNumber
 * @returns {Int} Theoretic valence or null on transitionmetal.
 */
Kekule.Element.getTheoreticValence = function(symbolOrAtomicNumber)
{
	var atomInfo = Kekule.ChemicalElementsDataUtil.getElementInfo(symbolOrAtomicNumber);
	return atomInfo.group? Kekule.Element.getTheoreticValenceOfGroup(atomInfo.group): null;
};

// Static methods of Kekule.Element
Object.extend(Kekule.Element,
/** @lends Kekule.Element */
{
	/**
	 * Check if atomic number is legal in database
	 * @param {Int} atomicNumber
	 * @returns {Bool}
	 */
	isAtomicNumberAvailable: function(atomicNumber)
	{
		return  Kekule.ChemicalElementsDataUtil.isAtomicNumberAvailable(atomicNumber);
	},
	/**
	 * Check if element symbol is legal in database.
	 * @param {Int} atmoicNumber
	 * @return {Bool}
	 */
	isElementSymbolAvailable: function(symbol)
	{
		return Kekule.ChemicalElementsDataUtil.isElementSymbolAvailable(symbol);
	}
});

/**
 * Represent an isotope in periodical table.
 * @class
 * @augments Kekule.Element
 * @param {Variant} symbolOrAtomicNumber Symbol(String) or atomic number(Int) of isotope.
 * @param {Int} massNumber Mass number of isotope.
 *
 * @property {Int} massNumber The mass number of isotope. Read only. Setting to null means a genenral element.
 * @property {Float} exactMass Read only.
 * @property {Float} naturalAbundance Read only.
 * @property {String} isotopeAlias Alias of isotope (such as D for H2). Read only.
 */
Kekule.Isotope = Class.create(Kekule.Element,
/** @lends Kekule.Isotope# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Isotope',
	/**
	 * @constructs
	 * @param {Variant} symbolOrAtomicNumber Symbol (String) or atomic number (Int) of element.
	 * @param {Int} massNumber Isotope mass number.
	 */
	initialize: function($super, symbolOrAtomicNumber, massNumber)
	{
		var atomicNum = symbolOrAtomicNumber;
		var massNum = massNumber;
		// check if symbol is isotope alias
		var isoInfo = Kekule.IsotopesDataUtil.getIsotopeInfo(symbolOrAtomicNumber, massNumber);
		if (isoInfo)
		{
			//console.log(isoInfo);
			if (isoInfo.atomicNumber)
				atomicNum = isoInfo.atomicNumber;
			massNum = isoInfo.massNumber;
		}

		$super(atomicNum);
		this.setPropStoreFieldValue('massNumber', massNum);
		if (isoInfo && isoInfo.isotopeAlias)
			this.setPropStoreFieldValue('isotopeAlias', isoInfo.isotopeAlias);
		/*
		if ((symbolOrAtomicNumber != Kekule.Element.UNSET_ELEMENT)
			&& (!Kekule.Element.isPseudoElement(symbolOrAtomicNumber))
			&& (massNumber != Kekule.Isotope.UNSET_MASSNUMBER))
		*/
		if (Kekule.Element.isNormalElement(atomicNum)
			&& (massNum !== Kekule.Isotope.UNSET_MASSNUMBER))
		{
			// get rest of properties' value from isotope data
			var isotopeInfo = Kekule.IsotopesDataUtil.getIsotopeInfo(this.getAtomicNumber(), massNum);
			if (isotopeInfo)
			{
				this.setPropStoreFieldValue('exactMass', isotopeInfo.exactMass);
				this.setPropStoreFieldValue('naturalAbundance', isotopeInfo.naturalAbundance);
			}
			else
			{
				Kekule.chemError(
					(Kekule.hasLocalRes() ? /*Kekule.ErrorMsg.INVALID_ISOTOPE*/Kekule.$L('ErrorMsg.INVALID_ISOTOPE') : 'Invalid isotope')
					+ ': ' + this.getSymbol() + '/' + massNumber);
			}
		}
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('massNumber', {'dataType': DataType.INTEGER, 'serializable': false, 'setter': null});
		this.defineProp('exactMass', {'dataType': DataType.FLOAT, 'serializable': false, 'setter': null});
		this.defineProp('naturalAbundance', {'dataType': DataType.FLOAT, 'serializable': false, 'setter': null});
		this.defineProp('isotopeAlias', {'dataType': DataType.STRING, 'serializable': false, 'setter': null});
	},
	/* @ignore */
	/*
	doGetSymbol: function($super)
	{
		if (this.getAtomicNumber() === 1 && this.getMassNumber() === 2)  // DEUTERIUM
			return Kekule.Element.DEUTERIUM;
		else
			return $super();
	},
	*/
	/**
	 * Check if obj is the same isotope with this one.
	 * @param {Object} obj
	 * @returns {Bool}
	 */
	isSame: function(obj)
	{
		if (obj instanceof Kekule.Isotope)
		{
			return (obj === this) ||
			  ((obj.getAtomicNumber() == this.getAtomicNumber())
			    && (obj.getMassNumber() == this.getMassNumber()));
		}
		return false;
	},
	/**
	 * Get an unique id for current isotope.
	 * @returns {String}
	 */
	getIsotopeId: function()
	{
		return Kekule.IsotopesDataUtil.getIsotopeId(this.getAtomicNumber(), this.getMassNumber());
	},
	/** @ignore */
	getLabel: function()
	{
		return '' + (this.getMassNumber() || '') + this.getSymbol();
	}
});

// Copy all methods of Kekule.IsotopesDataUtil to Isotope as shortcut
Object.extend(Kekule.Isotope, Kekule.IsotopesDataUtil);


/**
 * Indicate the mass number is unset and this is a general element.
 * @constant
 */
Kekule.Isotope.UNSET_MASSNUMBER = undefined;
/**
 * Get an unique id for isotope.
 * @param {Variant} symbolOrAtomicNumber
 * @param {Int} massNumber
 * @returns {String}
 * @function
 */
Kekule.Isotope.getIsotopeId = function(symbolOrAtomicNumber, massNumber)
{
	return Kekule.IsotopesDataUtil.getIsotopeId(symbolOrAtomicNumber, massNumber);
};

Object.extend(Kekule.Isotope,
/** @lends Kekule.Isotope */
{
	/**
	 * Check if mass number is legal for an element
	 * @param {Varaint} symbolOrAtomicNumber Element symbol(String) or atomic number(Integer).
	 * @param {Int} massNumber
	 * @return {Bool}
	 */
	isMassNumberAvailable: function(symbolOrAtomicNumber, massNumber)
	{
		return Kekule.IsotopesDataUtil.isMassNumberAvailable(symbolOrAtomicNumber, massNumber);
	}
});

/**
 * Factory to create and get suitable isotope.
 * @class
 */
Kekule.IsotopeFactory = {
	/** @private */
	GENERIC_ELEMENT_ID: '__GENERIC__',
	/** @private */
	_isotopes: {},
	/** @private */
	getIsotopeId: function(symbolOrAtomicNumber, massNumber)
	{
		if (!symbolOrAtomicNumber)  // an generic element
			return Kekule.IsotopeFactory.GENERIC_ELEMENT_ID;
		else
			return Kekule.IsotopesDataUtil.getIsotopeId(symbolOrAtomicNumber, massNumber);
	},
	/**
	 * Returns a suitable isotope object.
	 * @param {Varaint} symbolOrAtomicNumber Element symbol(String) or atomic number(Integer).
	 * @param {Int} massNumber
	 * @returns {Kekule.Isotope}
	 */
	getIsotope: function(symbolOrAtomicNumber, massNumber)
	{
		var id = Kekule.IsotopeFactory.getIsotopeId(symbolOrAtomicNumber, massNumber);
		if (!Kekule.IsotopeFactory._isotopes[id])
		{
			var isotope = new Kekule.Isotope(symbolOrAtomicNumber, massNumber);
			Kekule.IsotopeFactory._isotopes[id] = isotope;
		}
		return Kekule.IsotopeFactory._isotopes[id];
	},
	/**
	 * Returns a suitable isotope by id.
	 * @param {String} id Isotope ID, such as H2, C13.
	 * @returns {Kekule.Isotope}
	 */
	getIsotopeById: function(id)
	{
		if (Kekule.IsotopeFactory._isotopes[id])
		{
			return Kekule.IsotopeFactory._isotopes[id];
		}
		else
		{
			var detail = Kekule.IsotopesDataUtil.getIsotopeIdDetail(id);
			if (detail)
				return Kekule.IsotopeFactory.getIsotope(detail.symbol, detail.massNumber);
			else
				return null;
		}
	}
};

/**
 * @class
 */
Kekule.AtomType = {
		/**
		 * Indicate the atom type is unset.
		 * @constant
		 */
		UNSET_ATOMTYPE: undefined
};
