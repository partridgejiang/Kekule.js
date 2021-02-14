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
 * A root object to perform error check on one root chem object.
 * It will extract all child objects that need to be check and pass them to the concrete checkers.
 * @class
 * @augments ObjectEx
 *
 * @property {Bool} ignoreUnexposedObjs Whether unexposed objects should be also checked.
 * @property {Array} checkers Concrete checkers.
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
	},
	/** @ignore */
	initPropValues: function()
	{
		this.tryApplySuper('initPropValues');
		this.setIgnoreUnexposedObjs(true);
	},
	/**
	 * Perform the error check on root object (target).
	 * @param {Kekule.ChemObject} target
	 * @returns {Array} Report items of all checks.
	 */
	execute: function(target)
	{
		var startTime = Date.now();
		// first phrase, determinate which objects should be checked
		var regMap = new Kekule.MapEx();
		var checkers = this.getCheckers();
		this._getAllObjsNeedCheck(target, checkers, regMap);
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
					var reportItems = checker.check(objs);
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
	 * @returns {Array} Report items. If no error is found any more, null will be returned.
	 */
	recheck: function(checker, objects, root)
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
		return actualObjs.length? checker.check(objects): null;
	},
	/** @private */
	_getAllObjsNeedCheck: function(root, checkers, regMap)
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
						if (checker.applicable(child))
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
					this._getAllObjsNeedCheck(child, checkers, regMap);
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
 * Represent a piece of error report from the error checker.
 * @class
 * @augments ObjectEx
 * @param {Int} errorLevel Value from {@link Kekule.ErrorLevel}
 * @param {String} msg Error message.
 * @param {Array} targets Related chem objects.
 * @param {Object} reporter The checker who has published this report.
 *
 * @property {Int} errorLevel Value from {@link Kekule.ErrorLevel}
 * @property {String} msg Error message.
 * @property {Array} targets Related chem objects.
 * @property {Object} reporter The checker who has published this report.
 */
Kekule.ErrorCheck.ReportItem = Class.create(ObjectEx,
/** @lends Kekule.ErrorCheck.ReportItem# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ErrorCheck.ReportItem',
	/**
	 * @constructs
	 */
	initialize: function(level, msg, targets, reporter)
	{
		this.setPropStoreFieldValue('level', level);
		this.setPropStoreFieldValue('msg', msg);
		this.setPropStoreFieldValue('targets', targets);
		this.setPropStoreFieldValue('reporter', reporter);
		this.tryApplySuper('initialize');
	},
	doFinalize: function()
	{
		this.setTargets(null);
		this.setReporter(null);
		this.tryApplySuper('doFinalize');
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('level', {'dataType': DataType.INT});
		this.defineProp('msg', {'dataType': DataType.STRING});
		this.defineProp('targets', {'dataType': DataType.Array, 'serializable': false});
		this.defineProp('reporter', {'dataType': DataType.OBJECTEX, 'serializable': false});
		//this.defineProp('hasSolution', {'dataType': DataType.BOOL});
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
	},
	/** @private */
	_createReportItem: function(level, msg, targets)
	{
		return new Kekule.ErrorCheck.ReportItem(level, msg, targets, this);
	},
	/**
	 * Check whether this checker can be applied to target object.
	 * Descendants should override this method.
	 * @param {Kekule.ChemObject} target
	 * @returns {Bool}
	 */
	applicable: function(target)
	{
		return false;
	},
	/**
	 * Check on a series of target objects.
	 * Note the targets are all passed the detection and all be applicable.
	 * @param {Array} targets
	 * @returns {Array} Report items.
	 */
	check: function(targets)
	{
		return this.doCheck(targets);
	},
	/**
	 * Do actual work of {@link Kekule.ErrorCheck.BaseChecker.check}.
	 * Descendants should override this method.
	 * @param {Array} targets
	 * @returns {Array} Report items.
	 */
	doCheck: function(targets)
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
	applicable: function(target)
	{
		return (target instanceof Kekule.Atom) && (target.isNormalAtom());
	},
	/** @ignore */
	doCheck: function(targets)
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
			var msg = (possibleValences.length <= 1)? Kekule.$L('ErrorCheckMsg.ATOM_VALENCE_ERROR_WITH_SUGGEST'): Kekule.$L('ErrorCheckMsg.ATOM_VALENCE_ERROR_WITH_SUGGESTS');
			var atomId = atom.getId();
			var atomSymbol = atom.getSymbol();
			var atomLabel = atomId? atomId + '(' + atomSymbol + ')': atomSymbol;
			var suggests = possibleValences.join('/');
			return this._createReportItem(EL.ERROR, msg.format(atomLabel, currValence, suggests), [atom]);
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
	applicable: function(target)
	{
		return (target instanceof Kekule.Bond) && target.isCovalentBond();
	},
	/** @ignore */
	doCheck: function(targets)
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
					var bondLabel = bond.getId() || '';
					var msg = bondLabel? Kekule.$L('ErrorCheckMsg.BOND_WITH_ID_VALENCE_EXCEED_ALLOWED_WITH_SUGGEST').format(bondLabel, maxOrder)
						: Kekule.$L('ErrorCheckMsg.BOND_VALENCE_EXCEED_ALLOWED_WITH_SUGGEST').format(maxOrder);
					return this._createReportItem(EL.ERROR, msg, [bond]);
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

})();