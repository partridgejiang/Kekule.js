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
	 * Returns an unit object by unit key (usually the unit symbol).
	 * @param {String} key
	 * @param {Bool} ignoreCase Whether ignore the case of key in searching for unit objects.
	 * @returns {Object}
	 */
	getUnit: function(key, ignoreCase)
	{
		if (typeof(key) === 'object')  // already an object?
			return key.getKey? key: null;
		else
		{
			var result = KU._KEY_MAP[key];
			if (!result && ignoreCase)
			{
				var keyLower = key.toLowerCase();
				var names = Kekule.ObjUtils.getOwnedFieldNames(KU._KEY_MAP);
				for (var i = 0, l = names.length; i < l; ++i)
				{
					if (keyLower === names[i].toLowerCase())
					{
						result = KU._KEY_MAP[names[i]];
						break;
					}
				}
			}
			return result;
		}
	},
	/**
	 * Returns an unit object by unit name.
	 * @param {String} key
	 * @param {Bool} ignoreCase Whether ignore the case of key in searching for unit objects.
	 * @returns {Object}
	 */
	getUnitByName: function(name, ignoreCase)
	{
		var keys = Kekule.ObjUtils.getOwnedFieldNames(KU._KEY_MAP);
		var nameLower = ignoreCase && name.toLowerCase();
		for (var i = 0, l = keys.length; i < l; ++i)
		{
			var unitObj = KU._KEY_MAP[keys[i]];
			var unitName = unitObj.name;
			if (name === unitName || (ignoreCase && nameLower === unitName.toLowerCase()))
			{
				return unitObj;
			}
		}
		return null;
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
	 * Returns all unit objects matches filter in this category.
	 * @param {Func} filter With param (unitObj), returns a bool value.
	 * @returns {Array}
	 */
	getUnitsOf: function(filter)
	{
		var keys = Kekule.ObjUtils.getOwnedFieldNames(this, false);
		var result = [];
		for (var i = 0, l = keys.length; i < l; ++i)
		{
			if (keys[i] !== '_standardUnit')
			{
				var v = this[keys[i]];
				if (Kekule.ObjUtils.getPrototypeOf(v) === Kekule.Unit._unitObjProto && (!filter || filter(v)))
					result.push(v);
			}
		}
		return result;
	},
	/**
	 * Returns all unit objects of this category.
	 * @returns {Array}
	 */
	getAllUnits: function()
	{
		return this.getUnitsOf();
	},
	/**
	 * Returns all unit objects which can be converted between each other with a simple ratio multiplier of this category.
	 * @returns {Array}
	 */
	getConvertableUnits: function()
	{
		return this.getUnitsOf(function(unit){
			return !!unit.rateToStandard;
		});
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
		{
			var currValue = this._convFromStandard? this._convFromStandard(value, extraParams): sunit.convertValueTo(value, this, extraParams);
			return currValue;
		}
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
		{
			var stdValue = this._convToStandard? this._convToStandard(value, extraParams): this.convertValueTo(value, sunit, extraParams);
			return {'value': stdValue, 'unit': sunit};
		}
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
			if (r1 && r0)
				return value * r0 / r1;
			else // try to convert to/from standard
			{
				var canConvThisToStd = (r0 || this._convToStandard);  // can convert this to standard?
				var canConvStdToDest = (r1 || toUnitObj._convFromStandard);  // can convert standard to dest?
				if (canConvThisToStd && canConvStdToDest)
				{
					var stdValue = this.convertValueToStandard(value, extraParams);
					return toUnitObj.convertValueFromStandard(stdValue, extraParams);
				}
				else
					Kekule.error(Kekule.$L('ErrorMsg.UNABLE_TO_CONVERT_BETWEEN_UNITS').format(this.getKey(), toUnitObj.getKey()));
			}
			/*
			if (!r1 || !r0)
				Kekule.error(Kekule.$L('ErrorMsg.UNABLE_TO_CONVERT_BETWEEN_UNITS').format(this.getKey(), toUnitObj.getKey()));
			else
			{
				return value * r0 / r1;
			}
			*/
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

register('unk', 'Unknown', 'Unknown', null);

register('', 'counts', 'Counts', 1);
register('arb', 'arbitrary', 'Arbitrary', null);

register('', 'one', 'Dimensionless', 1);
register('%', 'percent', 'Dimensionless', 1e-2);
register('‰', 'thousandth', 'Dimensionless', 1e-3);
register('ppm', 'parts_per_million', 'Dimensionless', 1.0E-6);

register('pH', 'pH', 'AcidicScake', 1);

register('sec', 'second', 'Time', 1.0);
	register('hr', 'hour', 'Time', 3600);
	register('min', 'minute', 'Time', 60);
	register('ms', 'millisecond', 'Time', 1e-3);
	register('μs', 'microsecond', 'Time', 1e-6);
	register('ns', 'nanosecond', 'Time', 1e-9);

register('m', 'meter', 'Length', 1.0);
	register('cm', 'centimeter', 'Length', 1e-2);
	register('mm', 'millimeter', 'Length', 1e-3);
	register('μm', 'micrometer', 'Length', 1e-6);
	register('nm', 'nanometer', 'Length', 1e-9);
	register('Å', 'Angstrom', 'Length', 1e-10);

	register('A-1', 'Angstrom-1', 'InverseLength', 1.0E10, {'symbolHtml': 'A<sup>-1</sup>'});

register('A', 'ampere', 'ElectricCurrent', 1.0);
	register('μA', 'microampere', 'ElectricCurrent', 1e-6);
	register('nA', 'nanoampere', 'ElectricCurrent', 1e-9);
	register('pA', 'picoampere', 'ElectricCurrent', 1e-12);

register('kg', 'kilogram', 'Mass', 1.0);
	register('g', 'gram', 'Mass', 1e-3);

register('K', 'kelvin', 'Temperature', 1.0);
	register('℃', 'Celsius', 'Temperature', null,
		{
			'_convToStandard': function(value) { return value + 273.15; },
			'_convFromStandard': function(value) { return value - 273.15; }
		}
	);

register('mol', 'mole', 'AmountOfSubstance', 1.0);
register('cd', 'candela', 'LuminousIntensity', 1.0);

register('rad', 'radian', 'Angle', 1.0);
	register('deg', 'degree', 'Angle', 0.01745329, {'symbolHtml': '°'});

register('sr', 'steradian', 'SolidAngle', 1.0);

register('Hz', 'Hertz', 'Frequency', 1.0);
	register('kHz', 'kilohertz', 'Frequency', 1e3);
	register('MHz', 'megahertz', 'Frequency', 1e6);

register('N', 'Newton', 'Force', 1.0);
	register('kcal/Å', 'kilocalorie_per_angstrom', 'Force', null);

register('J', 'Joule', 'Energy', 1.0);
	register('cal', 'calorie', 'Energy', 4.184);
	register('kcal', 'kilocalorie', 'Energy', 4184);
	register('kcal/rad', 'kilocalorie_per_radian', 'Energy', null);
	register('eV', 'electron_volt', 'Energy', 1.60217733E-19);
	register('hart', 'Hartree', 'Energy', 4.3597482E-18);

register('W', 'Watt', 'Power', 1.0);

register('Pa', 'Pascal', 'Pressure', 1.0);
	register('GPa', 'gigaPascal', 'Pressure', 1.0E+09);
	register('bar', 'Bar', 'Pressure', 1E5);
	register('kbar', 'kbar', 'Pressure', 1E8);
	register('atm', 'Atmosphere', 'Pressure', 1.01325027E5);

	register('GPa-1', 'gigaPascal-1', 'InversePressure', 1.0E-09, {'symbolHtml': 'GPa<sup>-1</sup>'});

register('C', 'Coulomb', 'ElectricCharge', 1.0);
	register('e', 'electron_charge', 'ElectricCharge', 1.60217733E-19);
	
register('V', 'Volt', 'ElectricPotentialDifference', 1.0);
register('Ω', 'Ohm', 'ElectricResistance', 1.0);
register('F', 'Farad', 'ElectricCapacitance', 1.0);
register('S', 'Siemens', 'ElectricConductance', 1.0);
register('Wb', 'Weber', 'MagneticFlux', 1.0);
register('T', 'Tesla', 'MagneticFluxDensity', 1.0);
register('H', 'Henry', 'MagneticInductance', 1.0);
register('Bq', 'Becquerel', 'Radioactivity', 1.0);
register('Gy', 'Gray', 'RadioactiveAbsorbedDose', 1.0);
register('Sv', 'Sievert', 'RadioactiveEquivalentDose', 1.0);
register('kat', 'Katal', 'CatalyticActivity', 1.0);
register('cp', 'Centipoise', 'DynamicVicosity', null);
register('mol/L', 'Molarity', 'Molarity', 1.0);
register('mol/kg', 'Molality', 'Molality', 1.0);

register('m2', 'Square_meter', 'Area', 1.0, {'symbolHtml': 'm<sup>2</sup>'});
	register('cm2', 'centimeter_squared', 'Area', 1.0E-04, {'symbolHtml': 'cm<sup>2</sup>'});

register('m3', 'Cubic_meter', 'Volume', 1.0, {'symbolHtml': 'm<sup>3</sup>'});
	register('Å3', 'Angstrom_cubed', 'Volume', 1.0E-30, {'symbolHtml': 'Å<sup>3</sup>'});
	register('L', 'litre', 'Volume', 1.0E-03);
	register('mL', 'millilitre', 'Volume', 1.0E-06);

register('m/s', 'Meter_per_second', 'Velocity', 1.0);
	register('km/s', 'kilometers_per_second', 'Velcity', 1000);

register('m·s-2', 'Meter_per_second_squared', 'Acceleration', 1.0, {'symbolHtml': 'm·s<sup>-2</sup>'});
register('rad/s', 'radian_per_second', 'AngularVelocity', 1.0);
register('N·s', 'newton_second', 'Momentum', 1.0);
register('N·m·s', 'newton_meter_second', 'AngularMomentum', 1.0);
register('N·m', 'newton_meter', 'Torque', 1.0);

register('m-1', 'reciprocal_meter', 'WaveNumber', 1.0, {'symbolHtml': 'm<sup>-1</sup>'});	
	register('cm-1', 'reciprocal_centimeter', 'WaveNumber', 1e2, {'symbolHtml': 'cm<sup>-1</sup>'});

register('kg·m-3', 'Kilogram_per_cubic_meter', 'MassDensity', 1.0, {'symbolHtml': 'kg·m<sup>-3</sup>'});
register('kg-1·m3', 'cubic_meter_per_kilogram', 'SpecificVolume', 1.0, {'symbolHtml': 'kg<sup>-1</sup>·m<sup>3</sup>'});
register('m-3·mol', 'mole_per_cubic_meter', 'AmountConcentration', 1.0, {'symbolHtml': 'm<sup>-3</sup>·mol'});
register('m3/mol', 'cubic_meter_per_mole', 'MolarVolume', 1.0, {'symbolHtml': 'm<sup>3</sup>/mol'});
register('J/K', 'joule_per_kelvin', 'HeatCapacity', 1.0);
register('J·K-1·mol-1', 'joule_per_kelvin_mole', 'MolarHeatCapacity', 1.0, {'symbolHtml': 'J·K<sup>-1</sup>·mol<sup>-1</sup>'});
register('J·K-1·kg-1', 'joule_per_kilogram_kelvin', 'SpecificHeatCapacity', 1.0, {'symbolHtml': 'J·K<sup>-1</sup>·kg<sup>-1</sup>'});
register('J/mol', 'joule_per_mole', 'MolarEnergy', 1.0);
register('J/kg', 'joule_per_kilogram', 'SpecificEnergy', 1.0);
register('J·m-3', 'joule_per_cubic_meter', 'EnergyDensity', 1.0, {'symbolHtml': 'J·m<sup>-3</sup>'});
register('N/m', 'newton_per_meter', 'SurfaceTension', 1.0);
register('W·m-2', 'watt_per_square_meter', 'HeatFluxDensity', 1.0, {'symbolHtml': 'W·m<sup>-2</sup>'});
register('W·m-1·K-1', 'watt_per_meter_kelvin', 'ThermalConductivity', 1.0, {'symbolHtml': 'W·m<sup>-1</sup>·K<sup>-1</sup>'});
register('m2/s', 'square_meter_per_second', 'KinematicViscosity', 1.0, {'symbolHtml': 'm<sup>2</sup>/s'});
register('Pa·s', 'Pascal_second', 'DynamicViscosity', 1.0);
register('C·m-3', 'coulomb_per_cubic_meter', 'ElectricChargeDensity', 1.0, {'symbolHtml': 'C·m<sup>-3</sup>'});
register('A·m-2', 'ampere_per_square_meter', 'ElectricCurrentDensity', 1.0, {'symbolHtml': 'A·m<sup>-2</sup>'});
register('S/m', 'siemens_per_meter', 'ElectricalConductivity', 1.0);
register('S·m2/mol', 'siemens_square_meter_per_mole', 'MolarConductivity', 1.0, {'symbolHtml': 'S·m<sup>2</sup>/mol'});
register('F/m', 'farad_per_meter', 'Permittivity', 1.0);
register('H/m', 'henry_per_meter', 'Permeability', 1.0);
register('V/m', 'volt_per_meter', 'ElectricFieldStrength', 1.0);
register('A/m', 'ampere_per_meter', 'MagneticFieldStrength', 1.0);
register('cd·m-2', 'candela_per_square_meter', 'Luminance', 1.0, {'symbolHtml': 'cd·m<sup>-2</sup>'});
register('C/kg', 'coulomb_per_kilogram', 'Exposure', 1.0);
register('Gy/s', 'gray_per_second', 'AbsorbedDoseRate', 1.0);
register('J/m', 'joule_per_meter', 'EnergyLengthGradient', 1.0);

register('kj/mol', 'kj_per_mole', 'MolarEnergy', 1000);
//register('kcal·mol-1·ang-1', 'kcal_per_mole_per_Angstrom', 'Xx', null, {'symbolHtml': 'kcal·mol<sup>-1</sup>·ang<sup>-1</sup>'});

register('D', 'debye', 'Dipole', 3.335641E-30);


})();