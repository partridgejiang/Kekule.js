/**
 * @fileoverview
 * Constants and functions about basic metrics.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.root.js
 * requires /localization
 */

(function(){

"use strict";

/**
 * Root name space for units.
 * @namespace
 */
Kekule.Unit = {
	/** @private */
	ALL: {},
	/** @private */
	_KEY_MAP: {},
	/**
	 * Register a unit.
	 * After register, a Kekule.Unit[category][name.capitalized] will be set with value symbol (e.g., Kekule.Unit.Frequency.HERTZ = 'Hz').
	 * @param {String} symbol The symbol of unit, e.g. 'Hz'.
	 *   This value will be regarded as key of unit. If this value is empty, name will be regarded as key instead.
	 * @param {String} name Name of unit, e.g., 'Hertz'.
	 * @param {String} category Category of unit, e.g. 'Frequency'.
	 *   Note the first letter of category is recommended to be capitalized.
	 * @param {Number} rateToStandard The conversion rate to SI standard unit in this category.
	 *   For example, this value should be 1e-3 to millimeter.
	 *   If this value is 1, this unit will be treated as the standard one in this category.
	 * @param {Hash} extraParams Additional information of unit.
	 * @returns {Object} Unit object created.
	 */
	register: function(symbol, name, category, rateToStandard, extraParams)
	{
		var categoryObj = KU[category];
		if (!categoryObj)
		{
			categoryObj = KU._createCategoryObj(category);
			KU[category] = categoryObj;
		}
		var id = name.toUpperCase();
		categoryObj[id] = KU._createUnitObj(symbol, name, categoryObj, rateToStandard, extraParams);
		if (rateToStandard === 1)
			categoryObj.setStandardUnit(categoryObj[id]);
		KU.ALL[id] = categoryObj[id];  // also set ALL value
		KU._KEY_MAP[categoryObj[id].getKey()] = categoryObj[id];  // register a key map item
		return categoryObj[id];
	},
	/**
	 * Unregister a unit object from category.
	 * @param {Object} symbolOrId
	 */
	unregister: function(symbolOrId)
	{
		var unitObj = KU.getUnit(symbolOrId);
		if (unitObj)
		{
			var id = unitObj.getKey().toUpperCase();
			delete KU.ALL[id];
			delete KU._KEY_MAP[id];
			var category = unitObj.category;
			delete category[id];
		}
	},
	/**
	 * Returns an unit object.
	 * @param {String} key
	 * @returns {Object}
	 */
	getUnit: function(key)
	{
		if (typeof(key) === 'object')  // already an object?
			return key.getKey? key: null;
		else
			return KU._KEY_MAP[key];
	},

	/** @private */
	_createCategoryObj: function(category)
	{
		var result = Object.create(KU._categoryObjProto);
		result.name = category;
		return result;
	},
	/** @private */
	_createUnitObj: function(symbol, name, categoryObj, rateToStandard, params)
	{
		var result = Object.create(Kekule.Unit._unitObjProto);
		Object.extend(result, {
			'symbol': symbol,
			'name': name,
			'category': categoryObj,
			'rateToStandard': rateToStandard
		});
		if (params)
			Object.extend(result, params);
		return result;
	}
};
var KU = Kekule.Unit;

/**
 * Prototype of unit category objects.
 * @object
 * @private
 */
Kekule.Unit._categoryObjProto = {
	getName: function()
	{
		return this.name;
	},
	getStandardUnit: function()
	{
		return this._standardUnit;
	},
	setStandardUnit: function(unitObj)
	{
		this._standardUnit = unitObj;
	},
	/**
	 * Returns all unit objects of this category.
	 * @returns {Array}
	 */
	getAllUnits: function()
	{
		var keys = Kekule.ObjUtils.getOwnedFieldNames(this, false);
		var result = [];
		for (var i = 0, l = keys.length; i < l; ++i)
		{
			if (keys[i] !== '_standardUnit')
			{
				var v = this[keys[i]];
				if (Kekule.ObjUtils.getPrototypeOf(v) === Kekule.Unit._unitObjProto)
					result.push(v);
			}
		}
		return result;
	}
};

/**
 * Prototype of all unit objects.
 * @object
 * @private
 */
Kekule.Unit._unitObjProto = {
	getKey: function()
	{
		return this.symbol || this.name;
	},
	/**
	 * Check whether this object is the standard one in category.
	 * @returns {Bool}
	 */
	isStandard: function()
	{
		return this.rateToStandard === 1;
	},
	/**
	 * Returns the value with this unit can be converted to another unit.
	 * @param {Object} toUnitObj
	 * @param {Hash} extraParams
	 * @returns {Bool}
	 */
	canConvertValueTo: function(toUnitObj, extraParams)
	{
		return (toUnitObj.category === this.category);
	},
	/**
	 * Convert a value with this unit to another one.
	 * @param {Number} value
	 * @param {Variant} toUnit Unit object or name.
	 * @param {Hash} extraParams
	 * @returns {Number}
	 */
	convertValueTo: function(value, toUnit, extraParams)
	{
		var toUnitObj = (typeof(toUnit) === 'string')? KU.getUnit(toUnit): toUnit;
		if (toUnitObj)
		{
			return this.doConvertValueTo(value, toUnitObj, extraParams);
		}
		else
		{
			Kekule.error(Kekule.$L('ErrorMsg.UNIT_NOT_FOUND').format(toUnit.symbol || toUnit.name || toUnit));
		}
	},
	/**
	 * Convert a value with the standard unit of this category to this unit.
	 * @param {Number} value
	 * @param {Hash} extraParams
	 * @return {Number}
	 */
	convertValueFromStandard: function(value, extraParams)
	{
		var sunit = this.category.getStandardUnit();
		if (!sunit)
			Kekule.error(Kekule.$L('ErrorMsg.STANDARD_UNIT_OF_CATEGORY_NOT_FOUND').format(this.category.name));
		else
			return sunit.convertValueTo(value, this, extraParams);
	},
	/**
	 * Convert a value with this unit to the standard unit of this category.
	 * @param {Number} value
	 * @param {Hash} extraParams
	 * @return {Number}
	 */
	convertValueToStandard: function(value, extraParams)
	{
		return this.convertValueToStandardEx(value, extraParams).value;
	},
	/**
	 * Convert a value with this unit to the standard unit of this category.
	 * @param {Number} value
	 * @param {Hash} extraParams
	 * @return {Hash} A {value, unit} hash.
	 */
	convertValueToStandardEx: function(value, extraParams)
	{
		var sunit = this.category.getStandardUnit();
		if (!sunit)
			Kekule.error(Kekule.$L('ErrorMsg.STANDARD_UNIT_OF_CATEGORY_NOT_FOUND').format(this.category.name));
		else
			return {'value': this.convertValueTo(value, sunit, extraParams), 'unit': sunit};
	},
	/** @private */
	doConvertValueTo: function(value, toUnitObj, extraParams)
	{
		if (toUnitObj === this)
			return value;
		// check if category is same
		if (/*toUnitObj.category !== this.category*/ !this.canConvertValueTo(toUnitObj, extraParams))  // defaultly we can not convert this
			Kekule.error(Kekule.$L('ErrorMsg.UNABLE_TO_CONVERT_BETWEEN_UNITS').format(this.getKey(), toUnitObj.getKey()));
		else
		{
			var r1 = toUnitObj.rateToStandard;
			var r0 = this.rateToStandard;
			if (!r1 || !r0)
				Kekule.error(Kekule.$L('ErrorMsg.UNABLE_TO_CONVERT_BETWEEN_UNITS').format(this.getKey(), toUnitObj.getKey()));
			else
			{
				return value * r0 / r1;
			}
		}
	}
};

/**
 * Util methods about metrics units.
 * @class
 */
Kekule.UnitUtils = {
	/**
	 * Convert to a value based with another unit.
	 * @param {Number} fromValue
	 * @param {Variant} fromUnit String or unit object.
	 * @param {Variant} toUnit String or unit object.
	 * @param {Hash} extraParams
	 * @returns {Number}
	 */
	convertValue: function(fromValue, fromUnit, toUnit, extraParams)
	{
		var fuObj = KU.getUnit(fromUnit);
		return fuObj.convertValueTo(fromValue, toUnit, extraParams);
	}
};

var register = KU.register;

// register common used units
register('', 'arbitrary', 'General', null);

register('', 'one', 'Ratio', 1);
register('%', 'percent', 'Ratio', 1e-2);
register('‰', 'thousandth', 'Ratio', 1e-3);
register('ppm', 'millionth', 'Ratio', 1e-6);

register('hr', 'hour', 'Time', 3600);
register('min', 'minute', 'Time', 60);
register('sec', 'second', 'Time', 1);
register('ms', 'millisecond', 'Time', 1e-3);
register('μs', 'microsecond', 'Time', 1e-6);
register('ns', 'nanosecond', 'Time', 1e-9);

register('m', 'meter', 'Length', 1);
register('cm', 'centimeter', 'Length', 1e-2);
register('mm', 'millimeter', 'Length', 1e-3);
register('μm', 'micrometer', 'Length', 1e-6);
register('nm', 'nanometer', 'Length', 1e-9);
register('Å', 'angstrom', 'Length', 1e-10);

register('mol', 'mole', 'AmountOfSubstance', 1);

register('g', 'gram', 'Weight', 1);
register('kg', 'kilogram', 'Weight', 1e3);

register('K', 'kelvin', 'Temperature', 1);

register('A', 'ampere', 'ElectricCurrent', 1);
register('μA', 'microampere', 'ElectricCurrent', 1e-6);
register('nA', 'nanoampere', 'ElectricCurrent', 1e-9);
register('pA', 'picoampere', 'ElectricCurrent', 1e-12);

register('V', 'volts', 'ElectricVoltage', 1);

register('Hz', 'hertz', 'Frequency', 1);
register('kHz', 'kilohertz', 'Frequency', 1e3);
register('MHz', 'megahertz', 'Frequency', 1e6);


})();