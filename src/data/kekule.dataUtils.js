/**
 * @fileoverview
 * Utils to manipulate chemical data from data JSON files.
 * @author Partridge Jiang
 */

/**
 *  A class with static methods to get information from kekule.chemicalElements.js JSON data.
 *  @class Kekule.ChemicalElementsDataUtil
 */
Kekule.ChemicalElementsDataUtil = {
	/** @private */
	_getElementInfoBySymbol: function(symbol)
	{
		var result;
		for (var i = 0, l = Kekule.chemicalElementsData.length; i < l; ++i)
		{
			result = Kekule.chemicalElementsData[i];
			if (result && (result.symbol == symbol))
				return result;
		}
		return null;
	},
	_getElementInfoByAtomicNumber: function(atomicNumber)
	{
		var result = Kekule.chemicalElementsData[atomicNumber - 1];
		if (result && (result.atomicNumber == atomicNumber))
			return result;
		else if ((!result) || (result.atomicNumber < atomicNumber))
		{
			for (var i = atomicNumber, l = Kekule.chemicalElementsData.length; i < l; ++i)
			{
				result = Kekule.chemicalElementsData[i];
				if (result && (result.atomicNumber == atomicNumber))
					return result;
			}
			for (var i = atomicNumber - 2; i >= 0; --i)
			{
				result = Kekule.chemicalElementsData[i];
				if (result && (result.atomicNumber == atomicNumber))
					return result;
			}
		}
		else // result.atomicNumber > atomicNumber
		{
			for (var i = atomicNumber - 2; i >= 0; --i)
			{
				result = Kekule.chemicalElementsData[i];
				if (result && (result.atomicNumber == atomicNumber))
					return result;
			}
			for (var i = atomicNumber, l = Kekule.chemicalElementsData.length; i < l; ++i)
			{
				result = Kekule.chemicalElementsData[i];
				if (result && (result.atomicNumber == atomicNumber))
					return result;
			}
		}
		return null;  // not found finally
	},
	/**
	 *  Get element information object by element symbol or atomic number.
	 *  @param {Varaint} symbolOrAtomicNumber Element symbol(String) or atomic number(Integer).
	 *  @returns A hash object containing element properties.
	 */
	getElementInfo: function(symbolOrAtomicNumber)
	{
		if (typeof(symbolOrAtomicNumber) == 'number')
			return Kekule.ChemicalElementsDataUtil._getElementInfoByAtomicNumber(symbolOrAtomicNumber);
		else
			return Kekule.ChemicalElementsDataUtil._getElementInfoBySymbol(symbolOrAtomicNumber);
	},
	/**
	 *  Get element property by element symbol or atomic number.
	 *  @param {Varaint} symbolOrAtomicNumber Element symbol(String) or atomic number(Integer).
	 *  @param {String} propName Property name to be retrieved.
	 *  @returns A hash object containing element properties.
	 */
	getElementProp: function(symbolOrAtomicNumber, propName)
	{
		var info = Kekule.ChemicalElementsDataUtil.getElementInfo(symbolOrAtomicNumber);
		return info? info[propName]: null;
	},
	/**
	 *  Get atomic number of a element symbol.
	 *  @param {String} symbol Element symbol, case sensitive.
	 *  @returns {Integer} Atomic number. If symbol not exists, returns 0.
	 */
	getAtomicNumber: function(symbol)
	{
		var info = Kekule.ChemicalElementsDataUtil._getElementInfoBySymbol(symbol);
		if (info)
			return info.atomicNumber;
		else
			return 0;
	},
	/**
	 *  Get a element symbol of a given atomic number
	 *  @param {Integer} atomicNumber Atomic number.
	 *  @returns {String} Element symbol. If element does not exist, returns null.
	 */
	getElementSymbol: function(atomicNumber)
	{
		var info = Kekule.ChemicalElementsDataUtil._getElementInfoByAtomicNumber(atomicNumber);
		if (info)
			return info.symbol;
		else
			return null;
	},
	/**
	 * Check if atomic number is legal in database
	 * @param {Int} atomicNumber
	 * @return {Bool}
	 */
	isAtomicNumberAvailable: function(atomicNumber)
	{
		var info = Kekule.ChemicalElementsDataUtil._getElementInfoByAtomicNumber(atomicNumber);
		return (!!info);
	},

	/**
	 * Check if element symbol is legal in database.
	 * @param {String} symbol
	 * @return {Bool}
	 */
	isElementSymbolAvailable: function(symbol)
	{
		return Kekule.ChemicalElementsDataUtil.getAtomicNumber(symbol) > 0;
	}
};

/** @ignore */
Kekule.IsotopeAliasUtil = {
	enableAlias: true,
	ALIAS: [
		{'alias': 'D', 'atomicNumber': 1, 'massNumber': 2}
	],
	getAllAlias: function()
	{
		return Kekule.IsotopeAliasUtil.enableAlias? Kekule.IsotopeAliasUtil.ALIAS: [];
	},
	getAliasInfo: function(alias)
	{
		var as = Kekule.IsotopeAliasUtil.getAllAlias();
		for (var i = 0, l = as.length; i < l; ++i)
		{
			var a = as[i];
			if (a.alias === alias)
				return Object.extend(Kekule.IsotopesDataUtil.getIsotopeInfo(a.atomicNumber, a.massNumber), {'isotopeAlias': alias});
		}
		return null;
	},
	getAlias: function(atomicNumber, massNumber)
	{
		var as = Kekule.IsotopeAliasUtil.getAllAlias();
		for (var i = 0, l = as.length; i < l; ++i)
		{
			var a = as[i];
			if (a.atomicNumber === atomicNumber && a.massNumber === massNumber)
				return a.alias;
		}
		return null;
	}
};

/**
 *  A class with static methods to get information from kekule.isotopesData.js JSON data.
 *  @class Kekule.IsotopeDataUtil
 */
Kekule.IsotopesDataUtil = {
	/**
	 *  Get all available isotope information object of an element.
	 *  @param {Varaint} symbolOrAtomicNumber Element symbol(String) or atomic number(Integer).
	 *  @returns {Array} A array contains hash objects of isotope properties.
	 */
	getAllIsotopeInfos: function(symbolOrAtomicNumber)
	{
		var atomicNumber;
		if (typeof(symbolOrAtomicNumber) == 'number')
			atomicNumber = symbolOrAtomicNumber;
		else
			atomicNumber = Kekule.ChemicalElementsDataUtil.getAtomicNumber(symbolOrAtomicNumber);
		//var elemInfo = Kekule.ChemicalElementsDataUtil.getElementInfo(symbolOrAtomicNumber);
		var element = Kekule.isotopesData[atomicNumber - 1];

		if ((!element) || (element.atomicNumber != atomicNumber))
		{
			for (var i = 0, l = Kekule.isotopesData.length; i < l; ++i)
			{
				var element = Kekule.isotopesData[i];
				if (element && (element.atomicNumber == atomicNumber))
				{
					break;
				}
			}
		}
		if (element)
			return element.isotopes;
		else
			return null;
	},
	/**
	 *  Get isotope information object by element symbol or atomic number.
	 *  @param {Varaint} symbolOrAtomicNumber Element symbol(String) or atomic number(Integer).
	 *  @param {Int} massNumber Mass number of isotope.
	 *  @returns {Hash} A hash object containing isotope properties.
	 */
	getIsotopeInfo: function(symbolOrAtomicNumber, massNumber)
	{
		var result = null;
		var atomicNumber;
		if (!massNumber && typeof(symbolOrAtomicNumber) === 'string')  // check alias first
		{
			result = Kekule.IsotopeAliasUtil.getAliasInfo(symbolOrAtomicNumber);
			if (result)
				return result;
		}

		var isotopes = Kekule.IsotopesDataUtil.getAllIsotopeInfos(symbolOrAtomicNumber);
		if (isotopes)
		{
			if (massNumber)
			{
				for (var j = 0, k = isotopes.length; j < k; ++j)
				{
					result = isotopes[j];
					if (result && (result.massNumber == massNumber))
					{
						break;
					}
				}
			}
			else if (isotopes.length === 1)
				result = isotopes[0];
			if (result)
				return result;
		}
		return null;
	},
	/**
	 *  Get isotope information object by isotope id.
	 *  @param {String} isotopeId.
	 *  @returns {Hash} A hash object containing isotope properties.
	 */
	getIsotopeInfoById: function(isotopeId)
	{
		var detail = Kekule.IsotopesDataUtil.getIsotopeIdDetail(isotopeId);
		return Kekule.IsotopesDataUtil.getIsotopeInfo(detail.symbol, detail.massNumber);
	},
	/**
	 * Check if mass number is legal for an element
	 * @param {Varaint} symbolOrAtomicNumber Element symbol(String) or atomic number(Integer).
	 * @param {Int} massNumber
	 * @return {Bool}
	 */
	isMassNumberAvailable: function(symbolOrAtomicNumber, massNumber)
	{
		var info = Kekule.IsotopesDataUtil.getIsotopeInfo(symbolOrAtomicNumber, massNumber);
		return (!!info);
	},
	/**
	 * Generate a isotope id like H1, C12
	 * @param {Varaint} symbolOrAtomicNumber Element symbol(String) or atomic number(Integer).
	 * @param {Int} massNumber Mass number of isotope. Can be null.
	 * @returns {String}
	 */
	getIsotopeId: function(symbolOrAtomicNumber, massNumber)
	{
		// check if symbol is isotope alias
		{
			if (typeof(symbolOrAtomicNumber) === 'string' && !massNumber)
			{
				var isoInfo = Kekule.IsotopeAliasUtil.getAliasInfo(symbolOrAtomicNumber);
				if (isoInfo)
					return symbolOrAtomicNumber;  // return alias directly
			}
			else
			{
				var alias = Kekule.IsotopeAliasUtil.getAlias(symbolOrAtomicNumber, massNumber);
				if (alias)
					return alias;
			}
		}
		var elemInfo = Kekule.ChemicalElementsDataUtil.getElementInfo(symbolOrAtomicNumber);
		if (!elemInfo)
		{
			return null;
		}
		var symbol = elemInfo.symbol;
		if (massNumber)
			return symbol + massNumber.toString();
		else
			return symbol;
	},
	/**
	 * Read detail from an isotope id, get symbol and mass number from it.
	 * @param {String} id
	 * @returns {Hash} {symbol, massNumber}
	 */
	getIsotopeIdDetail: function(id)
	{
		if (!id)
			return null;
		var symbol = '';
		var massNumStr = '';
		for (var i = 0, l = id.length; i < l; ++i)
		{
			var c = id.charAt(i);
			if ((c >= '0') && (c <= '9'))  // number char
				massNumStr += c;
			else // symbol char
				symbol += c;
		}
		var massNum = massNumStr? parseInt(massNumStr, 10): null;
		var r = {'symbol': symbol};
		if (massNum)
			r.massNumber = massNum;
		return r;
	},
	/**
	 * Check if an id is legal. For example, 13Cuu is not legal (no element Cuu).
	 * @param {String} id
	 * @returns {Bool}
	 */
	isIsotopeIdAvailable: function(id)
	{
		var d = Kekule.IsotopesDataUtil.getIsotopeIdDetail(id);
		// check alias first
		if (!!Kekule.IsotopeAliasUtil.getAliasInfo(id))
			return true;
		var result = Kekule.ChemicalElementsDataUtil.isElementSymbolAvailable(d.symbol);
		if (result && d.massNum)
		{
			var info = Kekule.IsotopesDataUtil.getIsotopeInfo(d.symbol, d.massNum);
			result = !!info;
		}
		return result;
	}
};

/**
 *  A class with static methods to get information from kekule.structGenAtomTypesData.js JSON data.
 *  @class Kekule.AtomTypeDataUtil
 */
Kekule.AtomTypeDataUtil = {
	/**
	 *  Get atom type info object by element symbol or atomic number.
	 *  @private
	 *  @param {Varaint} symbolOrAtomicNumber Element symbol(String) or atomic number(Integer).
	 *  @returns {Object} A object containing all possible atom type info.
	 */
	getAtomTypeInfoObj: function(symbolOrAtomicNumber)
	{
		if (typeof(symbolOrAtomicNumber) == 'number')
			atomicNumber = symbolOrAtomicNumber;
		else
			atomicNumber = Kekule.ChemicalElementsDataUtil.getAtomicNumber(symbolOrAtomicNumber);
		var result = Kekule.structGenAtomTypesData[atomicNumber - 1];
		if (result && (result.atomicNumber == atomicNumber))
			return result;
		else
		{
			for (var i = 0, l = Kekule.structGenAtomTypesData.length; i < l; ++i)
			{
				result = Kekule.structGenAtomTypesData[i];
				if (result && (result.atomicNumber == atomicNumber))
					return result;
			}
			return null;
		}
	},
	/**
	 *  Get all atom type objects by element symbol or atomic number.
	 *  @param {Varaint} symbolOrAtomicNumber Element symbol(String) or atomic number(Integer).
	 *  @returns {Array} An array containing all possible atom type objects.
	 *    If data not found, returns null.
	 */
	getAllAtomTypes: function(symbolOrAtomicNumber)
	{
		var info = Kekule.AtomTypeDataUtil.getAtomTypeInfoObj(symbolOrAtomicNumber);
		if (info)
			return info.atomTypes;
		else
			return null;
	},
	/**
	 * Get a type object by element info and type id.
	 * @param {Varaint} symbolOrAtomicNumber Element symbol(String) or atomic number(Integer).
	 * @param {String} id Id of type.
	 * @returns {Hash} Atom type info object.
	 */
	getAtomTypeFromId: function(symbolOrAtomicNumber, id)
	{
		if (!symbolOrAtomicNumber)  // symbolOrAtomicNumber not set, get from id
		{
			var s = '';
			for (var i = 0, l = id.length; i < l; ++i)
			{
				var c = id.chatAt(i);
				if ((c < '0') || (c > '9'))
					s += c;
			}
			symbolOrAtomicNumber = s;
		}
		if (symbolOrAtomicNumber)
		{
			var types = Kekule.AtomTypeDataUtil.getAllAtomTypes(symbolOrAtomicNumber);
			for (var i = 0, l = types.length; i < l; ++i)
			{
				if (types[i].id == id)
					return types[i];
			}
		}
		return null;
	}
};