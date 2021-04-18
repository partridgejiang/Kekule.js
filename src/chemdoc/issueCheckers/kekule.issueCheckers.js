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
Kekule.IssueCheck = {};

/**
 * Predefined error code of error checking.
 * @enum
 */
Kekule.IssueCheck.IssueCode = {
	ERROR_UNKNOWN: 0,
	ERROR_ATOM_VALENCE_ABNORMAL: 1101,
	ERROR_BOND_ORDER_EXCEED: 1201
};
var EC = Kekule.IssueCheck.IssueCode;

Kekule.IssueCheck.CheckerIds = {
	ATOM_VALENCE: 'atomValence',
	BOND_ORDER: 'bondOrder'
};
var CIDs = Kekule.IssueCheck.CheckerIds;

/**
 * The util class to register and store checker class info and instance.
 * @class
 */
Kekule.IssueCheck.CheckerManager = {
	_checkerMap: {},
	/**
	 * Register to manager.
	 * @param {String} id
	 * @param {Class} checkerClass
	 */
	register: function(id, checkerClass)
	{
		if (!id)
			id = ClassEx.getClassName(checkerClass);
		var old = ICM._checkerMap[id];
		if (!old || old.checkerClass !== checkerClass)
			ICM._checkerMap[id] = {'checkerClass': checkerClass};
	},
	/**
	 * Unregister from class.
	 * @param {String} id
	 */
	unregister: function(id)
	{
		ICM._checkerMap[id] = null;
	},
	/**
	 * Returns the registered checker class.
	 * @param {String} id
	 * @returns {Class} Checker class or null if not found.
	 */
	getCheckerClass: function(id)
	{
		var item = ICM._checkerMap[id];
		return item && item.checkerClass;
	},
	/**
	 * Returns the instance of registered checker class.
	 * Note the instance will be cached in manager. So multiple calls of this function only returns one single instance.
	 * @param {String} id
	 * @returns {Kekule.IssueCheck.BaseChecker} Checker instance or null if not found.
	 */
	getCheckerInstance: function(id)
	{
		var result = null;
		var item = ICM._checkerMap[id];
		if (item)
		{
			if (!item.instance)
			{
				var checkerClass = item.checkerClass;
				item.instance = new checkerClass();
			}
			result = item.instance;
		}
		return result;
	}
};
var ICM = Kekule.IssueCheck.CheckerManager;

/**
 * A root object to perform issue check on one root chem object.
 * It will extract all child objects that need to be check and pass them to the concrete checkers.
 * @class
 * @augments ObjectEx
 *
 * @property {Bool} ignoreUnexposedObjs Whether unexposed objects should be also checked.
 * @property {Bool} enabled If false, call the execute() method of executor will do nothing.
 * // @property {Array} checkers Concrete checkers.
 * @property {Array} checkerIds IDs of checker classes used in this executor.
 * @property {Number} durationLimit In millisecond. If this value is set, the executor will try to end the check within this limit.
 * @property {Bool} allFinished Whether all the check job has been finished within durationLimit.
 */
/**
 * Invoked after do a checking process.
 *   event param of it has field: {checkResults}
 * @name Kekule.IssueCheck.Executor#execute
 * @event
 */
Kekule.IssueCheck.Executor = Class.create(ObjectEx,
/** @lends Kekule.IssueCheck.Executor# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IssueCheck.Executor',
	/** @constructs */
	initialize: function()
	{
		// debug
		//this.setPropStoreFieldValue('checkers', [new Kekule.IssueCheck.AtomValenceChecker(), new Kekule.IssueCheck.BondOrderChecker()]);
		this.tryApplySuper('initialize');
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('ignoreUnexposedObjs', {'dataType': DataType.ARRAY});
		this.defineProp('enabled', {'dataType': DataType.BOOL});
		this.defineProp('durationLimit', {'dataType': DataType.NUMBER});
		this.defineProp('allFinished', {'dataType': DataType.BOOL, 'setter': null, 'serializable': false});
		this.defineProp('checkerIds', {'dataType': DataType.ARRAY,
			'setter': function(value)
			{
			  var checkers = [];
			  var ids = Kekule.ArrayUtils.toArray(value);
			  for (var i = 0, l = ids.length; i < l; ++i)
			  {
			  	var checker = ICM.getCheckerInstance(ids[i]);
			  	if (checker)
			  		checkers.push(checker);
			  }
			  this.setPropStoreFieldValue('checkers', checkers);
			}
		});
		// private
		this.defineProp('checkers', {'dataType': DataType.ARRAY, 'serializable': false, 'setter': null});
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
		var durationLimit = this.getDurationLimit();
		var deadline = durationLimit && Date.now() + durationLimit;
		//var startTime = Date.now();
		// first phrase, determinate which objects should be checked
		var op = this.doPrepareOptions(options);
		var regMap = new Kekule.MapEx();
		var allCheckers = this.getCheckers();
		// filter out enabled checkers
		var checkers = [];
		for (var i = 0, l = allCheckers.length; i < l; ++i)
		{
			if (allCheckers[i].getEnabled())
				checkers.push(allCheckers[i]);
		}
		this._getAllObjsNeedCheck(target, target, checkers, regMap, op);
		// second phrase, do the concrete check of all checkers
		var allFinished = true;
		var result = [];
		for (var i = 0, l = checkers.length; i < l; ++i)
		{
			var checker = checkers[i];
			checker.setDeadline(deadline);
			//try
			{
				var objs = regMap.get(checker);
				if (objs && objs.length)
				{
					var reportItems = checker.check(objs, target, op);
					if (reportItems && reportItems.length)
						result = result.concat(reportItems);
					allFinished = allFinished && checker.getAllFinished();
				}
			}
			//catch(e)
			{

			}
		}
		this.setPropStoreFieldValue('allFinished', allFinished);
		this.invokeEvent('execute', {'checkResults': result, 'allFinished': allFinished});
		//var endTime = Date.now();
		//console.log('consume', endTime - startTime, 'ms');
		return result;
	},
	/**
	 * Perform a recheck on objects.
	 * @param {Kekule.IssueCheck.BaseChecker} checker
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
	/**
	 * Prepare the check options from input.
	 * Desendants may override this method.
	 * @private
	 */
	doPrepareOptions: function(inputOptions)
	{
		return options || {};
	},
	/** @private */
	_getAllObjsNeedCheck: function(root, parent, checkers, regMap, options)
	{
		var checkUnexposed = !this.getIgnoreUnexposedObjs();
		if (this._isObjExposed(root) || checkUnexposed)
		{
			for (var i = 0, l = parent.getChildCount(); i < l; ++i)
			{
				var child = parent.getChildAt(i);
				if (this._isObjExposed(child) || checkUnexposed)
				{
					for (var j = 0, k = checkers.length; j < k; ++j)
					{
						var checker = checkers[j];
						if (checker.applicable(child, root, options))
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
					this._getAllObjsNeedCheck(root, child, checkers, regMap, options);
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
 * Represent the checking result of a issue checker object.
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
Kekule.IssueCheck.CheckResult = Class.create(ObjectEx,
/** @lends Kekule.IssueCheck.CheckResult# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IssueCheck.CheckResult',
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
 *
 * @property {Bool} enabled
 * @property {Number} deadline Milliseconds elapsed since January 1, 1970 00:00:00 UTC.
 *   If this value is set, the checker should try to end the job before this.
 * @property {Bool} allFinished Whether all the check job has been finished before deadline.
 */
Kekule.IssueCheck.BaseChecker = Class.create(ObjectEx,
/** @lends Kekule.IssueCheck.BaseChecker# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IssueCheck.BaseChecker',
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
		this.defineProp('deadline', {'dataType': DataType.NUMBER, 'serializable': false});
		this.defineProp('allFinished', {'dataType': DataType.BOOL, 'setter': null, 'serializable': false});
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
	 * @param {Kekule.ChemObject} rootObj
	 * @param {Hash} options
	 * @returns {Bool}
	 */
	applicable: function(target, rootObj, options)
	{
		return this.doApplicable(target, rootObj, options || {});
	},
	/**
	 * Do actual work of {@link Kekule.IssueCheck.BaseChecker.applicable}
	 * Desendants should override this method.
	 * @param {Kekule.ChemObject} target
	 * @param {Kekule.ChemObject} rootObj
	 * @param {Hash} options
	 * @returns {Bool}
	 */
	doApplicable: function(target, rootObj, options)
	{
		return false;
	},
	/**
	 * Check on a series of target objects.
	 * Note the targets are all passed the detection and all be applicable.
	 * @param {Array} targets
	 * @param {Kekule.ChemObject} rootObj
	 * @param {Hash} options
	 * @returns {Array} Report items.
	 */
	check: function(targets, rootObj, options)
	{
		return this.doCheck(targets, rootObj, options || {});
	},
	/**
	 * Do actual work of {@link Kekule.IssueCheck.BaseChecker.check}.
	 * Descendants may override this method.
	 * @param {Array} targets
	 * @param {Kekule.ChemObject} rootObj
	 * @param {Hash} options
	 * @returns {Array} Report items.
	 */
	doCheck: function(targets, rootObj, options)
	{
		this.setPropStoreFieldValue('allFinished', false);
		var result = [];
		var ddl = this.getDeadline() || null;
		var terminated = false;
		for (var i = 0, l = targets.length; i < l; ++i)
		{
			if (ddl)
			{
				var currTime = Date.now();
				if (currTime >= ddl)
				{
					terminated = true;
					break;
				}
			}
			var childResult = this.doCheckOnTarget(targets[i], i, targets, rootObj, options) || [];
			result = result.concat(childResult);
		}
		this.setPropStoreFieldValue('allFinished', !!terminated);
		return result;
	},
	/**
	 * Do concrete check on single target.
	 * Descendants may override this method.
	 * @param {Object} target
	 * @param {Int} targetIndex
	 * @param {Array} targets
	 * @param {Kekule.ChemObject} rootObj
	 * @param {Hash} options
	 * @returns {Array} Report items.
	 */
	doCheckOnTarget: function(target, targetIndex, targets, rootObj, options)
	{

	}
});

/**
 * The checker to check whether the valence of atom in molecule is right.
 * @class
 * @augments Kekule.IssueCheck.BaseChecker
 */
Kekule.IssueCheck.AtomValenceChecker = Class.create(Kekule.IssueCheck.BaseChecker,
/** @lends Kekule.IssueCheck.AtomValenceChecker# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IssueCheck.AtomValenceChecker',
	/** @constructs */
	initialize: function()
	{
		this.tryApplySuper('initialize');
	},
	/** @ignore */
	doApplicable: function(target, rootObj, options)
	{
		return (target instanceof Kekule.Atom) && (target.isNormalAtom());
	},
	/** @ignore */
	doCheckOnTarget: function(target, targetIndex, targets, rootObj, options)
	{
		var reportItem = this.checkValence(target);
		return reportItem? [reportItem]: null;
	},
	/** @private */
	checkValence: function(atom)
	{
		var currValence = atom.getValence();
		var charge = atom.getCharge() || 0;
		var possibleValences = this._getPossibleValences(atom.getAtomicNumber(), charge);
		if (possibleValences.length && possibleValences.indexOf(currValence) < 0)  // current is abnormal
		{
			return this._createReport(Kekule.IssueCheck.AtomValenceChecker.Result,
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
// register
ICM.register(CIDs.ATOM_VALENCE, Kekule.IssueCheck.AtomValenceChecker);

/**
 * Represent the checking result of {@link Kekule.IssueCheck.AtomValenceChecker}.
 * @class
 * @augments Kekule.IssueCheck.CheckResult
 */
Kekule.IssueCheck.AtomValenceChecker.Result = Class.create(Kekule.IssueCheck.CheckResult,
/** @lends Kekule.IssueCheck.AtomValenceChecker.Result# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IssueCheck.AtomValenceChecker.Result',
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
		//var atomSymbol = atom.getSymbol();
		//var atomLabel = atomId? atomId + '(' + atomSymbol + ')': atomSymbol;
		var atomLabel = atom.getLabel? atom.getLabel(): atom.getSymbol();
		var suggests = possibleValences.join('/');
		return msg.format(atomLabel, currValence, suggests);
	}
});

/**
 * The checker to check whether the order of bond is suitable.
 * @class
 * @augments Kekule.IssueCheck.BaseChecker
 */
Kekule.IssueCheck.BondOrderChecker = Class.create(Kekule.IssueCheck.BaseChecker,
/** @lends Kekule.IssueCheck.BondOrderChecker# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IssueCheck.BondOrderChecker',
	/** @ignore */
	doApplicable: function(target, rootObj, options)
	{
		return (target instanceof Kekule.Bond) && target.isCovalentBond();
	},
	/** @ignore */
	doCheckOnTarget: function(target, targetIndex, targets, rootObj, options)
	{
		var reportItem = this.checkBondOrder(target);
		return reportItem? [reportItem]: null;
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
					return this._createReport(Kekule.IssueCheck.BondOrderChecker.Result, EL.ERROR, EC.ERROR_BOND_ORDER_EXCEED,
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
// register
ICM.register(CIDs.BOND_ORDER, Kekule.IssueCheck.BondOrderChecker);

/**
 * Represent the checking result of {@link Kekule.IssueCheck.BondOrderChecker}.
 * @class
 * @augments Kekule.IssueCheck.CheckResult
 */
Kekule.IssueCheck.BondOrderChecker.Result = Class.create(Kekule.IssueCheck.CheckResult,
/** @lends Kekule.IssueCheck.BondOrderChecker.Result# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IssueCheck.BondOrderChecker.Result',
	/** @private */
	DEF_ERROR_CODE: EC.ERROR_BOND_ORDER_EXCEED,
	/** @ignore */
	getMessage: function()
	{
		var currOrder = this.getDataValue('currOrder');
		var maxOrder = this.getDataValue('maxOrder');
		var bond = this.getTargets()[0];
		//var bondLabel = bond.getId() || '';
		var connectedNodes = bond.getConnectedChemNodes();
		var nodeLabels = [];
		for (var i = 0, l = connectedNodes.length; i < l; ++i)
		{
			var node = connectedNodes[i];
			var nodeLabel = node.getLabel && node.getLabel();
			if (nodeLabel)
				nodeLabels.push(nodeLabel);
		}
		var bondLabel = (nodeLabels.length > 1)? nodeLabels.join('-'): null;
		var msg = bondLabel? Kekule.$L('ErrorCheckMsg.BOND_WITH_ID_ORDER_EXCEED_ALLOWED_WITH_SUGGEST').format(bondLabel, currOrder, maxOrder)
			: Kekule.$L('ErrorCheckMsg.BOND_ORDER_EXCEED_ALLOWED_WITH_SUGGEST').format(currOrder, maxOrder);
		return msg;
	}
});

})();