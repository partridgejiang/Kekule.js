/**
 * @fileoverview
 * Error checkers and related classes for the editor widget.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /core/kekule.structures.js
 * requires /chemDoc/errorCheckers/kekule.errorCheckers.js
 * requires /widgets/editor/kekule.chemEditor.baseEditors.js
 * requires /widgets/editor/kekule.chemEditor.operations.js
 *
 * requires /localization/kekule.localize.general.js
 */

(function(){

"use strict";

Kekule.IssueCheck.IssueCode = Object.extend(Kekule.IssueCheck.IssueCode, {
	WARNING_NODE_TOO_CLOSE: 2101
});
var EC = Kekule.IssueCheck.IssueCode;

Kekule.IssueCheck.CheckerIds = Object.extend(Kekule.IssueCheck.CheckerIds, {
	NODE_DISTANCE_2D: 'nodeDistance2D'
});
var CIDs = Kekule.IssueCheck.CheckerIds;
var ICM = Kekule.IssueCheck.CheckerManager;

var CU = Kekule.CoordUtils;

/**
 * A specified issue check executor for checking objects inside a chem editor.
 * @class
 * @augments Kekule.IssueCheck.Executor
 *
 * @param {Kekule.Editor.BaseEditor} editor
 *
 * @property {Kekule.Editor.BaseEditor} editor
 */
Kekule.IssueCheck.ExecutorForEditor = Class.create(Kekule.IssueCheck.Executor,
/** @lends Kekule.IssueCheck.ExecutorForEditor# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IssueCheck.ExecutorForEditor',
	/** @constructs */
	initialize: function(editor)
	{
		this.setPropStoreFieldValue('editor', editor);
		this.tryApplySuper('initialize');
		// debug
		//this.getCheckers().push(new Kekule.IssueCheck.Node2DDistanceChecker());
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('editor', {'dataType': 'Kekule.Editor.BaseEditor', 'serializable': false});
	},
	/** @ignore */
	doPrepareOptions: function(inputOptions)
	{
		var result = inputOptions? Object.create(inputOptions): {};
		var editor = this.getEditor();
		if (editor)
			result.editor = editor;
		return result;
	}
});

/**
 * A base class to generate operations to fix certain kind of issue.
 * @class
 * @augments ObjectEx
 */
Kekule.IssueCheck.IssueResolver = Class.create(ObjectEx,
/** @lends Kekule.IssueCheck.IssueResolver# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IssueCheck.IssueResolver',
	/** @constructs */
	initialize: function()
	{
		this.tryApplySuper('initialize');
	},
	/**
	 * Find the solutions to resolve issue.
	 * @param {Kekule.IssueCheck.CheckResult} issueResult
	 * @param {Object} caller The caller object, usually the editor widget.
	 * @returns {Array}
	 */
	createSolutions: function(issueResult, caller)
	{
		return this.doCreateSolutions(issueResult, caller);
	},
	/**
	 * Do actual work of {@link Kekule.IssueCheck.IssueResolver.createSolutions}.
	 * Descendants may should override this method.
	 * @param {Kekule.IssueCheck.CheckResult} issueResult
	 * @param {Object} caller The caller object, usually the editor widget.
	 * @returns {Array}
	 * @private
	 */
	doCreateSolutions: function(issueResult, caller)
	{
		return [];
	},
	/** @private */
	_createSolutionInstance: function(title, description, operation, issueResult, solutionClass)
	{
		if (!solutionClass)
			solutionClass = Kekule.IssueCheck.IssueSolution;
		return new solutionClass(title, description, operation, issueResult);
	},
	/** @private */
	_getEditorWidget: function(caller)
	{
		return (caller && (caller instanceof Kekule.Editor.BaseEditor))? caller: null;
	}
});

/**
 * The base issue solution class.
 * @class
 * @augments ObjectEx
 *
 * @param {String} title
 * @param {String} description
 * @param {Kekule.Operation} operation Execute this operation can solve the issue.
 *
 * @property {String} title
 * @property {String} description
 * @property {Kekule.Operation} operation Execute this operation can solve the issue.
 */
Kekule.IssueCheck.IssueSolution = Class.create(ObjectEx,
/** @lends Kekule.IssueCheck.IssueSolution# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IssueCheck.IssueSolution',
	/** @constructs */
	initialize: function(title, description, operation, issueResult)
	{
		this.setPropStoreFieldValue('issueResult', issueResult);
		this.setPropStoreFieldValue('title', title);
		this.setPropStoreFieldValue('description', description);
		this.setPropStoreFieldValue('operation', operation);
		this.tryApplySuper('initialize');
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('issueResult', {'dataType': 'Kekule.IssueCheck.CheckResult', 'serializable': false});
		this.defineProp('title', {'dataType': DataType.STRING});
		this.defineProp('description', {'dataType': DataType.STRING});
		this.defineProp('operation', {'dataType': 'Kekule.Operation', 'serializable': false});
	},
	/** @ignore */
	doFinalize: function()
	{
		var op = this.getOperation();
		if (op)
			op.finalize();
		this.tryApplySuper('doFinalize');
	}
});

/**
 * The util class to register and store issue resolver class info.
 * @class
 */
Kekule.IssueCheck.ResolverManager = {
	/** @private */
	_resolverMap: new Kekule.MapEx(),
	/** @private */
	_resolverInstanceMap: new Kekule.MapEx(),
	/**
	 * Register to manager.
	 * @param {Class} issueResultClass
	 * @param {Class} resolverClass
	 */
	register: function(issueResultClass, resolverClass)
	{
		var rclasses = IRM._resolverMap.get(issueResultClass);
		if (!rclasses)
		{
			rclasses = [];
			IRM._resolverMap.set(issueResultClass, rclasses);
		}
		if (rclasses.indexOf(resolverClass) < 0)
			rclasses.push(resolverClass);
	},
	/**
	 * Unregister from class.
	 * @param {Class} issueResultClass
	 * @param {Class} resolverClass
	 */
	unregister: function(issueResultClass, resolverClass)
	{
		var rclasses = IRM._resolverMap.get(issueResultClass);
		var index = rclasses.indexOf(resolverClass);
		if (index >= 0)
			rclasses.splice(index, 1);
	},
	/**
	 * Returns the registered resolver class.
	 * @param {Class} issueResultClass
	 * @returns {Array} Resolver classes found.
	 */
	getResolverClasses: function(issueResultClass)
	{
		return IRM._resolverMap.get(issueResultClass) || [];
	},
	/**
	 * Returns the instance of registered resolver class.
	 * Note the instance will be cached. So multiple calls of this function only returns one single instance.
	 * @param {Class} issueResultClass
	 * @returns {Array} Instances of {@link Kekule.IssueCheck.IssueResolver}.
	 */
	getResolverInstances: function(issueResultClass)
	{
		var result = [];
		var classes = IRM.getResolverClasses(issueResultClass);
		for (var i = 0, l = classes.length; i < l; ++i)
		{
			var rclass = classes[i];
			var instance = IRM._resolverInstanceMap.get(rclass);
			if (!instance)
			{
				instance = new rclass();
				IRM._resolverInstanceMap.set(rclass, instance);
			}
			result.push(instance);
		}
		return result;
	}
};
var IRM = Kekule.IssueCheck.ResolverManager;

// expand Kekule.IssueCheck.CheckResult, enable it can retreive solutions from Kekule.IssueCheck.ResolverManager
ClassEx.extend(Kekule.IssueCheck.CheckResult, {
	/**
	 * Returns resolver instances for this issue result.
	 * @returns {Array}
	 */
	getResolvers: function()
	{
		return IRM.getResolverInstances(this.getClass());
	},
	/**
	 * Create solution objects for this issue result.
	 * @param {Object} caller
	 * @returns {Array}
	 */
	fetchSolutions: function(caller)
	{
		var resolvers = this.getResolvers();
		var result = [];
		for (var i = 0, l = resolvers.length; i < l; ++i)
		{
			var r = resolvers[i];
			var solutions = r.createSolutions(this, caller);
			if (solutions && solutions.length)
				result = result.concat(solutions);
		}
		return result;
	}
});
/*
ClassEx.defineProp(Kekule.IssueCheck.CheckResult, 'solutions', {
	'dataType': DataType.ARRAY,
	'serializable': false,
	'setter': null
});
*/

/**
 * The resolver class for {@link Kekule.IssueCheck.BondOrderChecker.Result}.
 * @class
 * @augments Kekule.IssueCheck.IssueResolver
 */
Kekule.IssueCheck.BondOrderChecker.Resolver = Class.create(Kekule.IssueCheck.IssueResolver,
/** @lends Kekule.IssueCheck.BondOrderChecker.Resolver# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IssueCheck.BondOrderChecker.Resolver',
	/** @ignore */
	doCreateSolutions: function(issueResult, caller)
	{
		var bond = issueResult.getTargets()[0];
		var currOrder = bond.getBondOrder();
		var maxOrder = issueResult.getData().maxOrder;
		var editor = this._getEditorWidget(caller);

		if (bond && maxOrder && editor)
		{
			// create operation to change current bond order to maxOrder
			var op = new Kekule.ChemObjOperation.Modify(bond, {'bondOrder': maxOrder}, editor);
			var title = Kekule.$L('ErrorCheckMsg.TITLE_CHANGE_BOND_ORDER_TO').format(maxOrder);
			var description = Kekule.$L('ErrorCheckMsg.DESCRIPTION_CHANGE_BOND_ORDER_TO').format(currOrder, maxOrder);
			return [
				this._createSolutionInstance(title, description, op, issueResult)
			];
		}
		else
			return [];
	}
});
IRM.register(Kekule.IssueCheck.BondOrderChecker.Result, Kekule.IssueCheck.BondOrderChecker.Resolver);

/**
 * The checker to check if two nodes are too close to be merged together.
 * Note this class check only the 2D issues.
 * @class
 * @augments Kekule.IssueCheck.BaseChecker
 */
Kekule.IssueCheck.Node2DDistanceChecker = Class.create(Kekule.IssueCheck.BaseChecker,
/** @lends Kekule.IssueCheck.Node2DDistanceChecker# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IssueCheck.Node2DDistanceChecker',
	/** @ignore */
	doApplicable: function(target, rootObj, options)
	{
		// only check exposed nodes in a chem space
		return (rootObj instanceof Kekule.ChemSpace)
			&& (target instanceof Kekule.ChemStructureNode)
			&& (!(target instanceof Kekule.Molecule) || !(target.isExpanded && target.isExpanded()))
			&& !((target instanceof Kekule.SubGroup) && (target.isExpanded && target.isExpanded()))  // expanded subgroup will always too near to child atoms
			&& (!target.isExposed || target.isExposed());
	},
	/* @ignore */
	/*
	doCheck: function(targets, rootObj, options)
	{
		var result = [];
		for (var i = 0, l = targets.length; i < l; ++i)
		{
			var node1 = targets[i];
			for (var j = i + 1; j < l; ++j)
			{
				var node2 = targets[j];
				var repItem = this.doCheckDistance(node1, node2, rootObj, options);
				if (repItem)
					result.push(repItem);
			}
		}
		return result;
	},
	*/
	/** @ignore */
	doCheckOnTarget: function(target, targetIndex, targets, rootObj, options)
	{
		var result = [];
		var node1 = target;
		for (var i = targetIndex + 1, l = targets.length; i < l; ++i)
		{
			var node2 = targets[i];
			if (node2)
			{
				var repItem = this.doCheckDistance(node1, node2, rootObj, options);
				if (repItem)
					result.push(repItem);
			}
		}
		return result;
	},
	/** @private */
	doCheckDistance: function(node1, node2, rootObj, options)
	{
		var threshold = this._getDistanceRefLength(rootObj) / 5;
		var editor = options.editor;
		var allowCoordBorrow = editor? editor.getAllowCoordBorrow(): false;
		if (this._isNodesDistanceTooClose(node1, node2, threshold, allowCoordBorrow, editor))
		{
			// (errorLevel, errorCode, data, targets, reporter)
			var repItem = new Kekule.IssueCheck.Node2DDistanceChecker.Result(Kekule.ErrorLevel.WARNING,
				EC.WARNING_NODE_TOO_CLOSE, null, [node1, node2], this);
			return repItem;
		}
		else
			return null;
	},
	/** @private */
	_getDistanceRefLength: function(rootObj)
	{
		// in doApplicable method, we are sure that the rootObj is an instanceof ChemSpace
		return rootObj.getDefAutoScaleRefLength();
	},
	/** @private */
	_getEditor: function(checkOptions)
	{
		return checkOptions.editor;
	},
	/** @private */
	_isNodesDistanceTooClose: function(node1, node2, objDistanceThreshold, allowCoordBorrow, editor)
	{
		if (editor)
		{
			// get threshold in screen sys, for checking with screen bound shape more quickly
			var screenDistanceThreshold = editor.translateDistance(objDistanceThreshold, Kekule.Render.CoordSystem.CHEM, Kekule.Render.CoordSystem.SCREEN);
			// check bound of two nodes
			return this._isNodesDistanceTooCloseByBound(node1, node2, objDistanceThreshold, screenDistanceThreshold, editor);
		}
		else
		{
			var distance = this._getNodesDistanceByCoord(node1, node2, allowCoordBorrow);
			return distance < distanceThreshold;
		}
	},
	/** @private */
	_getNodesDistanceByCoord: function(node1, node2, allowCoordBorrow)
	{
		var coord1 = node1.getAbsCoord2D(allowCoordBorrow);
		var coord2 = node2.getAbsCoord2D(allowCoordBorrow);
		return CU.getDistance(coord1, coord2);
	},
	/** @private */
	_isNodesDistanceTooCloseByBound: function(node1, node2, objDistanceThreshold, screenDistanceThreshold, editor)
	{
		var ST = Kekule.Render.BoundShapeType;
		var MU = Kekule.Render.MetaShapeUtils;
		var shape1 = editor.getChemObjBounds(node1)[0];  // node usually has only one bound (point or atom label rectange)
		var shape2 = editor.getChemObjBounds(node2)[0];
		if (!shape1 || !shape2)
			return false;

		if (this._isPointOrCircleShape(shape1) && this._isPointOrCircleShape(shape2))  // calc distance of two points
		{
			var screenDistance = CU.getDistance(shape1.coords[0], shape2.coords[0]) - (shape1.radius || 0) - (shape1.radius || 0);
			//console.log(node1.getId(), node2.getId(), screenDistance, editor.getDefBondScreenLength());
			//console.log(node1.getId(), node2.getId(), shape1, shape2, distance, distanceThreshold);
			return screenDistance < screenDistanceThreshold;
		}
		else if (this._isPointOrCircleShape(shape1) || this._isPointOrCircleShape(shape2))  // one of the shape is point, the other should be rect, ensure they does not overlap
		{
			var isShape1Point = this._isPointOrCircleShape(shape1);
			var pointCoord = isShape1Point? shape1.coords[0]: shape2.coords[0];
			var radius = isShape1Point? (shape1.radius || 0): (shape2.radius || 0);
			var complexShape = isShape1Point? shape2: shape1;
			var checkShape = MU.inflateShape(complexShape, screenDistanceThreshold);
			var screenDistance = MU.getDistance(pointCoord, checkShape) - radius;
			return screenDistance < 0;
		}
		else // both shapes are rect, atom with label, check if they intersects
		{
			for (var i = 0, l = shape1.coords.length; i < l; ++i)
			{
				var c = shape1.coords[i];
				if (MU.isCoordInside(c, shape2))
					return true;
			}
			for (var i = 0, l = shape2.coords.length; i < l; ++i)
			{
				var c = shape2.coords[i];
				if (MU.isCoordInside(c, shape1))
					return true;
			}
			return false;
		}
	},
	/** @private */
	_isPointOrCircleShape: function(shape)
	{
		var ST = Kekule.Render.BoundShapeType;
		return shape.shapeType === ST.POINT || shape.shapeType === ST.CIRCLE;
	}
});
// register
ICM.register(CIDs.NODE_DISTANCE_2D, Kekule.IssueCheck.Node2DDistanceChecker);

/**
 * Represent the checking result of {@link Kekule.IssueCheck.AtomValenceChecker}.
 * @class
 * @augments Kekule.IssueCheck.CheckResult
 */
Kekule.IssueCheck.Node2DDistanceChecker.Result = Class.create(Kekule.IssueCheck.CheckResult,
/** @lends Kekule.IssueCheck.NodeDistanceChecker.Result# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IssueCheck.NodeDistanceChecker.Result',
	/** @private */
	DEF_ERROR_CODE: EC.WARNING_NODE_TOO_CLOSE,
	/** @ignore */
	getMessage: function()
	{
		var node1 = this.getTargets()[0];
		var node2 = this.getTargets()[1];
		//var id1 = node1 && node1.getId && node1.getId();
		//var id2 = node2 && node2.getId && node2.getId();
		//var msg =(id1 && id2)? Kekule.$L('ErrorCheckMsg.NODE_DISTANCE_TOO_CLOSE_WITH_ID').format(id1 + '/' + id2): Kekule.$L('ErrorCheckMsg.NODE_DISTANCE_TOO_CLOSE');
		var label1 = (node1.getLabel && node1.getLabel()) || (node1.getId && node1.getId());
		var label2 = (node2.getLabel && node2.getLabel()) || (node2.getId && node2.getId());
		var msg = (label1 && label1)? Kekule.$L('ErrorCheckMsg.NODE_DISTANCE_TOO_CLOSE_WITH_LABEL').format(label1 + '/' + label2): Kekule.$L('ErrorCheckMsg.NODE_DISTANCE_TOO_CLOSE');
		return msg;
	}
});

/**
 * The resolver class for {@link Kekule.IssueCheck.Node2DDistanceChecker.Result}.
 * @class
 * @augments Kekule.IssueCheck.IssueResolver
 */
Kekule.IssueCheck.Node2DDistanceChecker.Resolver = Class.create(Kekule.IssueCheck.IssueResolver,
/** @lends Kekule.IssueCheck.Node2DDistanceChecker.Resolver# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IssueCheck.Node2DDistanceChecker.Resolver',
	/** @ignore */
	doCreateSolutions: function(issueResult, caller)
	{
		var node1 = issueResult.getTargets()[0];
		var node2 = issueResult.getTargets()[1];
		var label1 = (node1.getLabel && node1.getLabel()); // || (node1.getId && node1.getId());
		var label2 = (node2.getLabel && node2.getLabel()); // || (node2.getId && node2.getId());
		var sameLabel = label1 === label2;
		if (!label1 || sameLabel)
		{
			var id1 = node1.getId && node1.getId();
			if (id1)
				label1 = label1? label1 + '(' + id1 + ')': id1;
		}
		if (!label1 || sameLabel)
		{
			var id2 = node2.getId && node2.getId();
			if (id2)
				label2 = label2? label2 + '(' + id2 + ')': id2;
		}

		var editor = this._getEditorWidget(caller);

		var result = [];
		if (node1 && node2 && editor)
		{
			var canMergeStructFragment = editor.getEditorConfigs().getInteractionConfigs().getEnableStructFragmentMerge();
			var canMergeNeighborNodes = editor.getEditorConfigs().getInteractionConfigs().getEnableNeighborNodeMerge();
			if (Kekule.ChemStructOperation.MergeNodes.canMerge(node1, node2, canMergeStructFragment, canMergeNeighborNodes))  // can merge node1 to node2
			{
				var op = new Kekule.ChemStructOperation.MergeNodes(node1, node2, canMergeStructFragment, editor);
				result.push(this._createSolutionInstance(
					Kekule.$L('ErrorCheckMsg.TITLE_MERGE_TO').format(label1, label2),
					Kekule.$L('ErrorCheckMsg.DESCRIPTION_MERGE_TO').format(label1, label2),
					op,
					issueResult
				));
			}
			if (Kekule.ChemStructOperation.MergeNodes.canMerge(node2, node1, canMergeStructFragment, canMergeNeighborNodes))  // can merge node2 to node1
			{
				var op = new Kekule.ChemStructOperation.MergeNodes(node2, node1, canMergeStructFragment, editor);
				result.push(this._createSolutionInstance(
					Kekule.$L('ErrorCheckMsg.TITLE_MERGE_TO').format(label2, label1),
					Kekule.$L('ErrorCheckMsg.DESCRIPTION_MERGE_TO').format(label2, label1),
					op,
					issueResult
				));
			}
		}

		return result;
	}
});
IRM.register(Kekule.IssueCheck.Node2DDistanceChecker.Result, Kekule.IssueCheck.Node2DDistanceChecker.Resolver);


})();