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
			&& (!(target instanceof Kekule.Molecule) || !(target.isExpanded && target.isExpanded))
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
		var id1 = node1 && node1.getId && node1.getId();
		var id2 = node2 && node2.getId && node2.getId();
		var msg =(id1 && id2)? Kekule.$L('ErrorCheckMsg.NODE_DISTANCE_TOO_CLOSE_WITH_ID').format(id1 + '/' + id2): Kekule.$L('ErrorCheckMsg.NODE_DISTANCE_TOO_CLOSE');
		return msg;
	}
});


})();