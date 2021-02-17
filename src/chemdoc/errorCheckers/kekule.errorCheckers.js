/**
 * @fileoverview
 * Error checker are special classes that reports the error or warning of chem object structures.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /core/kekule.structures.js
 *
 * requires /localization/kekule.localize.general.js
 */

(function(){

"use strict";
var EL = Kekule.ErrorLevel;

/**
 * Namespace for error check system.
 * @namespace
 */
Kekule.ErrorCheck = {};

/**
 * Predefined error code of error checking.
 * @enum
 */
Kekule.ErrorCheck.ErrorCode = {
	ERROR_UNKNOWN: 0,
	ERROR_ATOM_VALENCE_ABNORMAL: 101,
	ERROR_BOND_ORDER_EXCEED: 201
};

var EC = Kekule.ErrorCheck.ErrorCode;

/**
 * A root object to perform error check on one root chem object.
 * It will extract all child objects that need to be check and pass them to the concrete checkers.
 * @class
 * @augments ObjectEx
 *
 * @property {Bool} ignoreUnexposedObjs Whether unexposed objects should be also checked.
 * @property {Array} checkers Concrete checkers.
 * @property {Bool} enabled If false, call the execute() method of executor will do nothing.
 */
Kekule.ErrorCheck.Executor = Class.create(ObjectEx,
/** @lends Kekule.ErrorCheck.Executor# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ErrorCheck.Executor',
	/** @constructs */
	initialize: function()
	{
		// debug
		this.setPropStoreFieldValue('checkers', [new Kekule.ErrorCheck.AtomValenceChecker(), new Kekule.ErrorCheck.BondOrderChecker()]);
		this.tryApplySuper('initialize');
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('checkers', {'dataType': DataType.ARRAY, 'serializable': false, 'setter': null});
		this.defineProp('ignoreUnexposedObjs', {'dataType': DataType.ARRAY});
		this.defineProp('enabled', {'dataType': DataType.BOOL})
	},
	/** @ignore */
	initPropValues: function()
	{
		this.tryApplySuper('initPropValues');
		this.setIgnoreUnexposedObjs(true);
		this.setEnabled(true);
	},
	/** @ignore */
	doFinalize: function()
	{
		this.setPropStoreFieldValue('checkers', null);
		this.tryApplySuper('doFinalize');
	},
	/**
	 * Perform the error check on root object (target).
	 * @param {Kekule.ChemObject} target
	 * @param {Hash} options
	 * @returns {Array} Report items of all checks.
	 */
	execute: function(target, options)
	{
		if (!this.getEnabled())
			return null;
		var startTime = Date.now();
		// first phrase, determinate which objects should be checked
		var op = options || {};
		var regMap = new Kekule.MapEx();
		var allCheckers = this.getCheckers();
		// filter out enabled checkers
		var checkers = [];
		for (var i = 0, l = allCheckers.length; i < l; ++i)
		{
			if (allCheckers[i].getEnabled())
				checkers.push(allCheckers[i]);
		}
		this._getAllObjsNeedCheck(target, checkers, regMap, op);
		// second phrase, do the concrete check of all checkers
		var result = [];
		for (var i = 0, l = checkers.length; i < l; ++i)
		{
			var checker = checkers[i];
			//try
			{
				var objs = regMap.get(checker);
				if (objs && objs.length)
				{
					var reportItems = checker.check(objs, op);
					if (reportItems && reportItems.length)
						result = result.concat(reportItems);
				}
			}
			//catch(e)
			{

			}
		}
		var endTime = Date.now();
		console.log('consume', endTime - startTime, 'ms');
		return result;
	},
	/**
	 * Perform a recheck on objects.
	 * @param {Kekule.ErrorCheck.BaseChecker} checker
	 * @param {Array} objects
	 * @param {Kekule.ChemObject} root
	 * @param {Hash} options
	 * @returns {Array} Report items. If no error is found any more, null will be returned.
	 */
	recheck: function(checker, objects, root, options)
	{
		var actualObjs;
		if (root)
		{
			actualObjs = [];
			// filter out the children of root
			for (var i = 0, l = objects.length; i < l; ++i)
			{
				if (objects[i].isChildOf(root))
				{
					actualObjs.push(objects[i]);
				}
			}
		}
		else
			actualObjs = objects;
		return actualObjs.length? checker.check(objects, options || {}): null;
	},
	/** @private */
	_getAllObjsNeedCheck: function(root, checkers, regMap, options)
	{
		var checkUnexposed = !this.getIgnoreUnexposedObjs();
		if (this._isObjExposed(root) || checkUnexposed)
		{
			for (var i = 0, l = root.getChildCount(); i < l; ++i)
			{
				var child = root.getChildAt(i);
				if (this._isObjExposed(child) || checkUnexposed)
				{
					for (var j = 0, k = checkers.length; j < k; ++j)
					{
						var checker = checkers[j];
						if (checker.applicable(child, options))
						{
							var regObjs = regMap.get(checker);
							if (!regObjs)
							{
								regObjs = [child];
								regMap.set(checker, regObjs);
							}
							else
								regObjs.push(child);
						}
					}
					// iterate child's children
					this._getAllObjsNeedCheck(child, checkers, regMap, options);
				}
			}
		}
	},
	/** @private */
	_isObjExposed: function(obj)
	{
		return !obj.isExposed || obj.isExposed();
	}
});

/**
 * Represent the checking result of a error checker object.
 * This is an abstract class, and should not be used directly.
 * Each concrete checker class should has a corresponding check result class.
 * @class
 * @augments ObjectEx
 * @param {Int} errorLevel Value from {@link Kekule.ErrorLevel}
 * @param {Int} errorCode A custom value to represent the error type.
 * @param {Hash} data Extra error data.
 * @param {Array} targets Related chem objects.
 * @param {Object} reporter The checker who has published this result.
 *
 * @property {Int} level Value from {@link Kekule.ErrorLevel}
 * @property {Int} code A custom value to represent the error type.
 * @property {Hash} data Extra error data.
 * @property {Array} targets Related chem objects.
 * @property {Object} reporter The checker who has published this result.
 */
Kekule.ErrorCheck.CheckResult = Class.create(ObjectEx,
/** @lends Kekule.ErrorCheck.CheckResult# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ErrorCheck.CheckResult',
	/** @private */
	DEF_ERROR_CODE: EC.UNKNOWN,
	/**
	 * @constructs
	 */
	initialize: function(errorLevel, errorCode, data, targets, reporter)
	{
		this.setPropStoreFieldValue('level', errorLevel || EL.ERROR);
		this.setPropStoreFieldValue('code', errorCode || this.DEF_ERROR_CODE);
		this.setPropStoreFieldValue('data', data);
		this.setPropStoreFieldValue('targets', targets);
		this.setPropStoreFieldValue('reporter', reporter);
		this.tryApplySuper('initialize');
	},
	doFinalize: function()
	{
		this.setData(null);
		this.setTargets(null);
		this.setReporter(null);
		this.tryApplySuper('doFinalize');
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('level', {'dataType': DataType.INT});
		this.defineProp('code', {'dataType': DataType.INT});
		this.defineProp('data', {'dataType': DataType.HASH});
		this.defineProp('targets', {'dataType': DataType.Array, 'serializable': false});
		this.defineProp('reporter', {'dataType': DataType.OBJECTEX, 'serializable': false});
		this.defineProp('msg', {'dataType': DataType.STRING, 'serializable': false, 'setter': null,
			'getter': function() { return this.getMessage(); }
		})
		//this.defineProp('hasSolution', {'dataType': DataType.BOOL});
	},
	/**
	 * Returns the value stored in data property.
	 * @param {String} key
	 * @returns {Variant}
	 */
	getDataValue: function(key)
	{
		return (this.getData() || {})[key];
	},
	/**
	 * Returns the human readable error message from error level, code and data.
	 * Desendants should override this method.
	 * @returns {String}
	 */
	getMessage: function()
	{
		return Kekule.$L('ErrorCheckMsg.GENERAL_ERROR_WITH_CODE').format(this.getErrorCode());
	}
});

/**
 * The base checker class.
 * @class
 * @augments ObjectEx
 */
Kekule.ErrorCheck.BaseChecker = Class.create(ObjectEx,
/** @lends Kekule.ErrorCheck.BaseChecker# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ErrorCheck.BaseChecker',
	/** @constructs */
	initialize: function()
	{
		this.tryApplySuper('initialize');
	},
	/** @private */
	initProperties: function()
	{
		//this.defineProp('targets', {'dataType': DataType.ARRAY});
		this.defineProp('enabled', {'dataType': DataType.BOOL});
	},
	/** @ignore */
	initPropValues: function()
	{
		this.tryApplySuper('initPropValues');
		this.setEnabled(true);
	},
	/** @private */
	_createReport: function(reportClass, level, code, data, targets)
	{
		return new reportClass(level, code, data, targets, this);
	},
	/**
	 * Check whether this checker can be applied to target object.
	 * @param {Kekule.ChemObject} target
	 * @param {Hash} options
	 * @returns {Bool}
	 */
	applicable: function(target, options)
	{
		return this.doApplicable(target, options || {});
	},
	/**
	 * Do actual work of {@link Kekule.ErrorCheck.BaseChecker.applicable}
	 * Desendants should override this method.
	 * @param {Kekule.ChemObject} target
	 * @param {Hash} options
	 * @returns {Bool}
	 */
	doApplicable: function(target, options)
	{
		return false;
	},
	/**
	 * Check on a series of target objects.
	 * Note the targets are all passed the detection and all be applicable.
	 * @param {Array} targets
	 * @param {Hash} options
	 * @returns {Array} Report items.
	 */
	check: function(targets, options)
	{
		return this.doCheck(targets, options || {});
	},
	/**
	 * Do actual work of {@link Kekule.ErrorCheck.BaseChecker.check}.
	 * Descendants should override this method.
	 * @param {Array} targets
	 * @param {Hash} options
	 * @returns {Array} Report items.
	 */
	doCheck: function(targets, options)
	{
		return [];
	}
});

/**
 * The checker to check whether the valence of atom in molecule is right.
 * @class
 * @augments Kekule.ErrorCheck.BaseChecker
 */
Kekule.ErrorCheck.AtomValenceChecker = Class.create(Kekule.ErrorCheck.BaseChecker,
/** @lends Kekule.ErrorCheck.AtomValenceChecker# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ErrorCheck.AtomValenceChecker',
	/** @constructs */
	initialize: function()
	{
		this.tryApplySuper('initialize');
	},
	/** @ignore */
	doApplicable: function(target, options)
	{
		return (target instanceof Kekule.Atom) && (target.isNormalAtom());
	},
	/** @ignore */
	doCheck: function(targets, options)
	{
		var result = [];
		for (var i = 0, l = targets.length; i < l; ++i)
		{
			var reportItem = this.checkValence(targets[i]);
			if (reportItem)
				result.push(reportItem);
		}
		return result;
	},
	/** @private */
	checkValence: function(atom)
	{
		var currValence = atom.getValence();
		var charge = atom.getCharge() || 0;
		var possibleValences = this._getPossibleValences(atom.getAtomicNumber(), charge);
		if (possibleValences.length && possibleValences.indexOf(currValence) < 0)  // current is abnormal
		{
			return this._createReport(Kekule.ErrorCheck.AtomValenceChecker.Result,
				EL.ERROR, EC.ERROR_ATOM_VALENCE_ABNORMAL,
				{'currValence': currValence, 'possibleValences': possibleValences},
				[atom]);
		}
		else  // no error
			return null;
	},
	/** @private */
	_getPossibleValences: function(atomicNum, charge)
	{
		var result = [];
		var info = Kekule.ValenceUtils.getPossibleMdlValenceInfo(atomicNum, charge);
		if (info && info.valences && !info.unexpectedCharge)  // if abnormal charge is meet, we can not determinate the valence precisely, just ignore here
		{
			result = [].concat(info.valences);
		}
		return result;
	}
});

/**
 * Represent the checking result of {@link Kekule.ErrorCheck.AtomValenceChecker}.
 * @class
 * @augments Kekule.ErrorCheck.CheckResult
 */
Kekule.ErrorCheck.AtomValenceChecker.Result = Class.create(Kekule.ErrorCheck.CheckResult,
/** @lends Kekule.ErrorCheck.AtomValenceChecker.Result# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ErrorCheck.AtomValenceChecker.Result',
	/** @private */
	DEF_ERROR_CODE: EC.ERROR_ATOM_VALENCE_ABNORMAL,
	/** @ignore */
	getMessage: function()
	{
		var currValence = this.getDataValue('currValence');
		var possibleValences = this.getDataValue('possibleValences');
		var msg = (possibleValences.length <= 1)?
			Kekule.$L('ErrorCheckMsg.ATOM_VALENCE_ERROR_WITH_SUGGEST'):
			Kekule.$L('ErrorCheckMsg.ATOM_VALENCE_ERROR_WITH_SUGGESTS');
		var atom = this.getTargets()[0];
		var atomId = atom.getId();
		var atomSymbol = atom.getSymbol();
		var atomLabel = atomId? atomId + '(' + atomSymbol + ')': atomSymbol;
		var suggests = possibleValences.join('/');
		return msg.format(atomLabel, currValence, suggests);
	}
});

/**
 * The checker to check whether the order of bond is suitable.
 * @class
 * @augments Kekule.ErrorCheck.BaseChecker
 */
Kekule.ErrorCheck.BondOrderChecker = Class.create(Kekule.ErrorCheck.BaseChecker,
/** @lends Kekule.ErrorCheck.BondOrderChecker# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ErrorCheck.BondOrderChecker',
	/** @ignore */
	doApplicable: function(target, options)
	{
		return (target instanceof Kekule.Bond) && target.isCovalentBond();
	},
	/** @ignore */
	doCheck: function(targets, options)
	{
		var result = [];
		for (var i = 0, l = targets.length; i < l; ++i)
		{
			var reportItem = this.checkBondOrder(targets[i]);
			if (reportItem)
				result.push(reportItem);
		}
		return result;
	},
	/** @private */
	checkBondOrder: function(bond)
	{
		var bondValence = bond.getBondValence && bond.getBondValence();
		if (bondValence)
		{
			var connectedNodes = bond.getConnectedChemNodes();
			var maxOrder = 0;
			for (var i = 0, l = connectedNodes.length; i < l; ++i)
			{
				var m = this._getAllowedMaxBondOrder(connectedNodes[i]);
				if (m > 0 && (!maxOrder || m < maxOrder))
					maxOrder = m;
			}
			if (maxOrder)
			{
				if (bondValence > maxOrder)   // error
				{
					return this._createReport(Kekule.ErrorCheck.BondOrderChecker.Result, EL.ERROR, EC.ERROR_BOND_ORDER_EXCEED,
						{'currOrder': bondValence, 'maxOrder': maxOrder}, [bond]);
				}
			}
		}
		return null;
	},
	/** @private */
	_getAllowedMaxBondOrder: function(atom)
	{
		var result = 0;
		if (atom instanceof Kekule.Atom && atom.isNormalAtom())
		{
			var currValence = atom.getValence();
			var atomTypes = Kekule.AtomTypeDataUtil.getAllAtomTypes(atom.getAtomicNumber());
			if (atomTypes)
			{
				for (var i = 0, l = atomTypes.length; i < l; ++i)
				{
					if (currValence <= atomTypes[i].bondOrderSum)
					{
						result = atomTypes[i].maxBondOrder;
						break;
					}
				}
			}
		}
		return result;
	}
});

/**
 * Represent the checking result of {@link Kekule.ErrorCheck.AtomValenceChecker}.
 * @class
 * @augments Kekule.ErrorCheck.CheckResult
 */
Kekule.ErrorCheck.BondOrderChecker.Result = Class.create(Kekule.ErrorCheck.CheckResult,
/** @lends Kekule.ErrorCheck.BondOrderChecker.Result# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ErrorCheck.BondOrderChecker.Result',
	/** @private */
	DEF_ERROR_CODE: EC.ERROR_BOND_ORDER_EXCEED,
	/** @ignore */
	getMessage: function()
	{
		var currOrder = this.getDataValue('currOrder');
		var maxOrder = this.getDataValue('maxOrder');
		var bond = this.getTargets()[0];
		var bondLabel = bond.getId() || '';
		var msg = bondLabel? Kekule.$L('ErrorCheckMsg.BOND_WITH_ID_ORDER_EXCEED_ALLOWED_WITH_SUGGEST').format(bondLabel, currOrder, maxOrder)
			: Kekule.$L('ErrorCheckMsg.BOND_ORDER_EXCEED_ALLOWED_WITH_SUGGEST').format(currOrder, maxOrder);
		return msg;
	}
});

})();