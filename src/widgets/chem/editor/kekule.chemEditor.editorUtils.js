/**
 * @fileoverview
 * Util methods for chem editor.
 * @author Partridge Jiang
 */

/*
 * requires /core/kekule.common.js
 * requires /core/kekule.structures.js
 * requires /core/kekule.chemUtils.js
 * requires /utils/kekule.utils.js
 */

(function()
{

/**
 * Util methods about chem structure.
 * @class
 */
Kekule.Editor.StructureUtils = {
	/**
	 * Returns nodes or connectors that should be removed cascadely with chemStructObj.
	 * @param {Object} chemStructObj
	 * @returns {Array}
	 * @deprecated
	 */
	getCascadeDeleteObjs: function(chemStructObj)
	{
		return Kekule.ChemStructureUtils.getCascadeDeleteObjs(chemStructObj);
	},
	/**
	 * Returns objects directly link arround chemObj.
	 * If chemObj is a node, returns node.getLinkedObjs(); if chemObj is connector, returns connector.getLinkedObjs() + connector.getConnectedObjs()
	 */
	getSurroundingObjs: function(chemObj)
	{
		var objs = chemObj.getLinkedObjs();

		if (chemObj instanceof Kekule.ChemStructureConnector)  // a connector, should also consider other connectors connecting it
		{
			var extraObjs = chemObj.getConnectedObjs();
			Kekule.ArrayUtils.pushUnique(objs, extraObjs);
		}
		return objs;
	},
	/**
	 * Get direction angle most empty space to a chem object.
	 * This function is in 2D mode.
	 * @param {Kekule.ChemStructureObject} obj
	 * @param {Array} linkedObjs Objects around obj.
	 * @param {Bool} allowCoordBorrow
	 * @returns {Float}
	 */
	calcMostEmptyDirectionAngleOfChemObj: function(obj, linkedObjs, allowCoordBorrow)
	{
		var angles = [];
		if (!linkedObjs)
			linkedObjs = obj.getLinkedObjs();
		var baseCoord = obj.getAbsBaseCoord2D(allowCoordBorrow);
		for (var i = 0, l = linkedObjs.length; i < l; ++i)
		{
			var c = linkedObjs[i].getAbsBaseCoord2D(allowCoordBorrow);
			c = Kekule.CoordUtils.substract(c, baseCoord);
			var angle = Math.atan2(c.y, c.x);
			if (angle < 0)
				angle = Math.PI * 2 + angle;
			angles.push(angle);
		}
		angles.sort();

		var l = angles.length;
		if (l === 0)
			return 0;
		else if (l === 1)  // only one connector
			return -angles[0];
		else  // more than two connectors
		{
			var max = 0;
			var index = 0;
			for (var i = 0; i < l; ++i)
			{
				var a1 = angles[i];
				var a2 = angles[(i + 1) % l];
				var delta = a2 - a1;
				if (delta < 0)
					delta += Math.PI * 2;
				if (delta > max)
				{
					max = delta;
					index = i;
				}
			}
			var result = angles[index] + max / 2;
			return result;
		}
	},
	/**
	 * When adding a new bond to a node, this function will calculate the most suitable angle (related to X axis) of the bond direction.
	 * @param {Object} startingObj
	 * @param {Float} defBondAngle Default bond angle of this type of bond.
	 * @param {Bool} allowCoordBorrow
	 * @returns {Float}
	 */
	calcPreferred2DBondGrowingDirection: function(startingObj, defBondAngle, allowCoordBorrow)
	{
		var startingCoord = startingObj.getAbsBaseCoord2D(allowCoordBorrow);
		var connectedObjs = Kekule.Editor.StructureUtils.getSurroundingObjs(startingObj);
		var connectedObjCount = connectedObjs? connectedObjs.length: 0;
		switch (connectedObjCount)
		{
			case 0:   // no object connected, just add a bond in defAngle
			{
				return defBondAngle; //(Math.PI - defAngle) / 2;
			}
			case 1:   // only one bond, add to defAngles
			{
				var refObj = connectedObjs[0];
				var refCoord = refObj.getAbsBaseCoord2D(allowCoordBorrow);
				var refVector = Kekule.CoordUtils.substract(refCoord, startingCoord);
				var refAngle = Math.atan2(refVector.y, refVector.x);

				var angle1 = refAngle - defBondAngle;
				var angle2 = refAngle + defBondAngle;
				if (angle1 < 0)
					angle1 += Math.PI * 2;
				if (angle2 < 0)
					angle2 += Math.PI * 2;
				var finalAngle;
				// we have two appliable angles, if they are not the same, choose the one closest to horizontal line
				if (angle1 !== angle2)
				{
					var ca1 = Math.min((angle1 > Math.PI)? Math.abs(angle1 - Math.PI * 2): angle1, Math.abs(angle1 - Math.PI));
					var ca2 = Math.min((angle2 > Math.PI)? Math.abs(angle2 - Math.PI * 2): angle2, Math.abs(angle2 - Math.PI));
					finalAngle = (ca1 <= ca2)? angle1: angle2;
				}
				else
					finalAngle = angle1;

				return finalAngle;
			}
			default:  // more than one bond, add to most empty direction
			{
				var finalAngle = Kekule.Editor.StructureUtils.calcMostEmptyDirectionAngleOfChemObj(startingObj, connectedObjs, allowCoordBorrow);
				return finalAngle;
			}
		}
	},
	/**
	 * When adding a new bond to a node, this function will calculate the most suitable location of the bond direction.
	 * @param {Object} startingObj
	 * @param {Float} bondLength
	 * @param {Float} defAngle Default bond angle of this type of bond.
	 * @param {Bool} allowCoordBorrow
	 * @returns {Hash} Coord of the bond's ending point.
	 */
	calcPreferred2DBondGrowingLocation: function(startingObj, bondLength, defAngle, allowCoordBorrow)
	{
		var startingCoord = startingObj.getAbsBaseCoord2D(allowCoordBorrow);
		/*
		 var connectedObjs = startingObj.getLinkedObjs();
		 if (startingObj instanceof Kekule.ChemStructureConnector)  // a connector, should also consider other connectors connecting it
		 {
		 var extraObjs = startingObj.getConnectedObjs();
		 Kekule.ArrayUtils.pushUnique(connectedObjs, extraObjs);
		 }
		 */
		/*
		var connectedObjs = Kekule.Editor.StructureUtils.getSurroundingObjs(startingObj);
		var connectedObjCount = connectedObjs? connectedObjs.length: 0;
		switch (connectedObjCount)
		{
			case 0:   // no object connected, just add a bond in defAngle
			{
				var direction = defAngle; //(Math.PI - defAngle) / 2;
				return Kekule.CoordUtils.add(startingCoord, {'x': bondLength * Math.cos(direction), 'y': bondLength * Math.sin(direction)});
				//return Kekule.CoordUtils.add(startingCoord, {'x': bondLength, 'y': 0});
			}
			case 1:   // only one bond, add to defAngles
			{
				var refObj = connectedObjs[0];
				var refCoord = refObj.getAbsBaseCoord2D();
				var refVector = Kekule.CoordUtils.substract(refCoord, startingCoord);
				var refAngle = Math.atan2(refVector.y, refVector.x);

				var angle1 = refAngle - defAngle;
				var angle2 = refAngle + defAngle;
				if (angle1 < 0)
					angle1 += Math.PI * 2;
				if (angle2 < 0)
					angle2 += Math.PI * 2;
				var finalAngle;
				// we have two appliable angles, if they are not the same, choose the one closest to horizontal line
				if (angle1 !== angle2)
				{
					var ca1 = Math.min((angle1 > Math.PI)? Math.abs(angle1 - Math.PI * 2): angle1, Math.abs(angle1 - Math.PI));
					var ca2 = Math.min((angle2 > Math.PI)? Math.abs(angle2 - Math.PI * 2): angle2, Math.abs(angle2 - Math.PI));
					finalAngle = (ca1 <= ca2)? angle1: angle2;
				}
				else
					finalAngle = angle1;
				var result = {'x': bondLength * Math.cos(finalAngle), 'y': bondLength * Math.sin(finalAngle)};
				result = Kekule.CoordUtils.add(result, startingCoord);
				return result;
			}
			default:  // more than one bond, add to most empty direction
			{
				var finalAngle = Kekule.Editor.StructureUtils.calcMostEmptyDirectionAngleOfChemObj(startingObj, connectedObjs);
				var result = {'x': bondLength * Math.cos(finalAngle), 'y': bondLength * Math.sin(finalAngle)};
				result = Kekule.CoordUtils.add(result, startingCoord);
				return result;
			}
		}
		*/
		var direction = Kekule.Editor.StructureUtils.calcPreferred2DBondGrowingDirection(startingObj, defAngle, allowCoordBorrow);
		return Kekule.CoordUtils.add(startingCoord, {'x': bondLength * Math.cos(direction), 'y': bondLength * Math.sin(direction)});
	},

	/**
	 * Check if two hash object that stores bond properties (type, order, stereo) is same in chemical means.
	 * @param {Hash} src
	 * @param {Hash} target
	 * @param {Array} propNames Property names to be compared
	 * @returns {boolean}
	 */
	isBondPropsMatch: function(src, target, propNames)
	{
		var specialFields = ['bondType', 'bondOrder', 'stereo'];  // these three fields should be compared specially, since they may bave default null/undefined values
		//var normalFields = AU.exclude(propNames, specialFields);
		var result = true;
		// compare special fields, regard null/undefined/0 as same
		if (result && propNames.indexOf('bondType') >= 0)
			result = (src.bondType == target.bondType || (!src.bondType && !target.bondType));
		if (result && src.bondType === Kekule.BondType.COVALENT)  // order/stereo only works in covalent bond
		{
			if (result && propNames.indexOf('bondOrder') >= 0 || (!src.bondOrder && !target.bondOrder))
				result = (src.bondOrder == target.bondOrder);
			if (result && propNames.indexOf('stereo') >= 0)
			{
				result = (src.stereo == target.stereo || (!src.stereo && !target.stereo));
			}
		}
		if (result)
			result = Kekule.ObjUtils.equal(src, target, specialFields);
		return result;
	},

	/**
	 * Returns label represents the chem node situation.
	 * @param {Kekule.ChemStructureNode} node
	 * @param {Object} labelConfigs
	 * @param {Hash} options
	 * @returns {String}
	 */
	getChemStructureNodeLabel: function(node, labelConfigs, options)
	{
		//var labelConfigs = this.getLabelConfigs();
		if (node.getIsotopeId)  // atom
		{
			var s = node.getIsotopeId();
			if (options && options.includeExplicitHydrogens)
			{
				var explicitHCount = node.getExplicitHydrogenCount && node.getExplicitHydrogenCount();
				if (explicitHCount > 0)
					s += 'H';
				if (explicitHCount > 1)
					s += explicitHCount.toString();
			}
			return s;
		}
		else if (node instanceof Kekule.SubGroup)
		{
			var groupLabel = node.getAbbr() || node.getFormulaText();
			if (labelConfigs)
				groupLabel = groupLabel || labelConfigs.getRgroup();
			return groupLabel;
		}
		else
		{
			var ri = node.getCoreDisplayRichTextItem(null, null, labelConfigs);
			return Kekule.Render.RichTextUtils.toText(ri);
		}
	},
	/**
	 * Returns label represents all the chem nodes situation.
	 * @param {Array} nodes
	 * @param {Object} labelConfigs
	 * @param {Hash} options
	 * @returns {String}
	 */
	getAllChemStructureNodesLabel: function(nodes, labelConfigs, options)
	{
		var nodeLabel;
		for (var i = 0, l = nodes.length; i < l; ++i)
		{
			var node = nodes[i];
			var currLabel = Kekule.Editor.StructureUtils.getChemStructureNodeLabel(node, labelConfigs, options);
			if (!nodeLabel)
				nodeLabel = currLabel;
			else
			{
				if (nodeLabel !== currLabel)  // different label, currently has different nodes
				{
					return null;
				}
			}
		}
		return nodeLabel;
	},
	/**
	 * Returns HTML code represents all the chem nodes situation.
	 * @param {Array} nodes
	 * @param {Object} labelConfigs
	 * @returns {String}
	 */
	getAllChemStructureNodesHtmlCode: function(nodes, hydrogenDisplayLevel, showCharge, labelConfigs)
	{
		var result;
		for (var i = 0, l = nodes.length; i < l; ++i)
		{
			var node = nodes[i];
			var currRichText = node.getCoreDisplayRichTextItem(hydrogenDisplayLevel, showCharge, labelConfigs);
			var currHtmlCode = Kekule.Render.RichTextUtils.toSimpleHtmlCode(currRichText);
			if (!result)
				result = currHtmlCode;
			else
			{
				if (result !== currHtmlCode)  // different label, currently has different nodes
				{
					return null;
				}
			}
		}
		return result;
	},

	/**
	 * Returns center abs base coord of a structure.
	 * @param {Kekule.StructureFragment} structureFragment
	 * @param {Int} coordMode
	 * @param {Bool} allowCoordBorrow
	 * @returns {Hash}
	 */
	getStructureCenterAbsBaseCoord: function(structureFragment, coordMode, allowCoordBorrow)
	{
		var result = null;
		var add = Kekule.CoordUtils.add;
		var nodeCount = structureFragment.getNodeCount();
		for (var i = 0; i < nodeCount; ++i)
		{
			var n = structureFragment.getNodeAt(i);
			var coord = n.getAbsBaseCoord(coordMode, allowCoordBorrow);
			if (!result)
				result = coord;
			else
				result = add(result, coord);
		}
		result = Kekule.CoordUtils.divide(result, nodeCount);
		return result;
	}
};

/**
 * Util methods about chem structure in repositories.
 * @class
 */
Kekule.Editor.RepositoryStructureUtils = {
	/** @private */
	_calcNodeMergeAdjustRotateAngle: function(editor, mergeNode, destNode)
	{
		var result = 0;
		var coordMode = editor.getCoordMode();

		// TODO: currently only handles 2D situation
		if (coordMode !== Kekule.CoordMode.COORD3D)
		{
			var allowCoordBorrow = editor.getAllowCoordBorrow();
			var structConfigs = editor.getEditorConfigs().getStructureConfigs();
			var targetSurroundingObjs = Kekule.Editor.StructureUtils.getSurroundingObjs(mergeNode);
			var destSurroundingObjs = Kekule.Editor.StructureUtils.getSurroundingObjs(destNode);

			if (targetSurroundingObjs.length === 1)  // only one bond connected to mergeNode in repository
			{
				var connector = mergeNode.getLinkedConnectorAt(0);
				var bondOrder = connector.getBondOrder? connector.getBondOrder(): 0;
				var bondAngle = structConfigs.getNewBondDefAngle(destNode, bondOrder);
				refAngle = Kekule.Editor.StructureUtils.calcPreferred2DBondGrowingDirection(destNode, bondAngle, allowCoordBorrow);

				var vector = Kekule.ChemStructureUtils.getAbsCoordVectorBetweenObjs(mergeNode, targetSurroundingObjs[0], coordMode, allowCoordBorrow);
				var targetOriginAngle = Math.atan2(vector.y, vector.x);
				result = refAngle - targetOriginAngle;
			}
			else if (destSurroundingObjs.length === 1)  // only one bond connected to dest node
			{
				var connector = destNode.getLinkedConnectorAt(0);
				var bondOrder = connector.getBondOrder? connector.getBondOrder(): 0;
				var bondAngle = structConfigs.getNewBondDefAngle(mergeNode, bondOrder);
				var refAngle = Kekule.Editor.StructureUtils.calcPreferred2DBondGrowingDirection(mergeNode, bondAngle, allowCoordBorrow);

				var vector = Kekule.ChemStructureUtils.getAbsCoordVectorBetweenObjs(destNode, destSurroundingObjs[0], coordMode, allowCoordBorrow);
				var destOriginAngle = Math.atan2(vector.y, vector.x);
				result = destOriginAngle - refAngle;
			}
			else  // more than one bonds in both mergeNode and destNode
			{
				var bondAngle = structConfigs.getNewBondDefAngle(destNode, null);
				var refAngle = Kekule.Editor.StructureUtils.calcPreferred2DBondGrowingDirection(destNode, bondAngle, allowCoordBorrow);

				var targetBondAngleRange = {};
				for (var i = 0, l = targetSurroundingObjs.length; i < l; ++i)
				{
					var vector = Kekule.ChemStructureUtils.getAbsCoordVectorBetweenObjs(mergeNode, targetSurroundingObjs[i], coordMode, allowCoordBorrow);
					var angle = Math.atan2(vector.y, vector.x);
					if (Kekule.ObjUtils.isUnset(targetBondAngleRange.min) || (angle < targetBondAngleRange.min))
						targetBondAngleRange.min = angle;
					if (Kekule.ObjUtils.isUnset(targetBondAngleRange.max) || (angle > targetBondAngleRange.max))
						targetBondAngleRange.max = angle;
				}
				var middleAngle = (targetBondAngleRange.max + targetBondAngleRange.min) / 2;
				result = refAngle - middleAngle;
			}
		}
		return result;
	},
	/** @private */
	_calcConnectorMergeTransformParams: function(editor, mergeConnector, destConnector)
	{
		var targetObj0 = mergeConnector.getConnectedObjAt(0);
		var targetObj1 = mergeConnector.getConnectedObjAt(1);
		var destObj0 = destConnector.getConnectedObjAt(0);
		var destObj1 = destConnector.getConnectedObjAt(1);

		var targetCoord0 = editor.getObjCoord(targetObj0);
		var targetCoord1 = editor.getObjCoord(targetObj1);
		var destCoord0 = editor.getObjCoord(destObj0);
		var destCoord1 = editor.getObjCoord(destObj1);

		// TODO: currently only handles 2D situation
		var result = Kekule.CoordUtils.calcCoordGroup2DTransformParams(targetCoord0, targetCoord1, destCoord1, destCoord0);
		// targetCoord0 map to destCoord1, as in merging of ring, ring order are always reversed
		return result;
	},

	/** @private */
	calcRepObjInitialTransformParams: function(editor, repItem, repResult, destObj, targetCoord)
	{
		var repBaseCoord = repResult.baseObjCoord;

		var editorRefLength = editor.getDefBondLength();
		var coordScale = editorRefLength / repItem.getRefLength();
		var rotateAngle;
		var center = repBaseCoord;

		//var targetCoord = screenCoord;
		if (repResult.mergeObj)
		{
			var destObj = repResult.mergeDest || destObj;
			if (destObj)  // targetCoord decide by merge position
			{
				targetCoord = editor.getObjectScreenCoord(destObj);

				if ((repResult.mergeObj instanceof Kekule.ChemStructureNode)
						&& (destObj instanceof Kekule.ChemStructureNode))  // node merge, calc initial angle by bond
				{
					rotateAngle = Kekule.Editor.RepositoryStructureUtils._calcNodeMergeAdjustRotateAngle(editor, repResult.mergeObj, destObj);
					//console.log(center);
				}
				else if ((repResult.mergeObj instanceof Kekule.ChemStructureConnector)
						&& (destObj instanceof Kekule.ChemStructureConnector))  // connector merge
				{
					// return directly
					return Kekule.Editor.RepositoryStructureUtils._calcConnectorMergeTransformParams(editor, repResult.mergeObj, destObj);
				}
			}
		}

		var objCoord = editor.translateCoord(targetCoord, Kekule.Editor.CoordSys.SCREEN, Kekule.Editor.CoordSys.CHEM);
		if (repBaseCoord)
		{
			objCoord = Kekule.CoordUtils.substract(objCoord, repBaseCoord);
		}

		var transformParams = {
			'scale': coordScale,
			'translateX': objCoord.x,
			'translateY': objCoord.y,
			'translateZ': objCoord.z,
			'rotateAngle': rotateAngle,
			'center': center
		};

		return transformParams;
	},

	/** @private */
	transformChemObjectsCoordAndSize: function(editor, objects, transformParams)
	{
		var coordMode = editor.getCoordMode();
		var allowCoordBorrow = editor.getAllowCoordBorrow();
		var matrix = (coordMode === Kekule.CoordMode.COORD3D)?
				Kekule.CoordUtils.calcTransform3DMatrix(transformParams):
				Kekule.CoordUtils.calcTransform2DMatrix(transformParams);
		var childTransformParams = Object.extend({}, transformParams);
		childTransformParams = Object.extend(childTransformParams, {
			'translateX': 0,
			'translateY': 0,
			'translateZ': 0,
			'center': {'x': 0, 'y': 0, 'z': 0}
		});
		var childMatrix = (coordMode === Kekule.CoordMode.COORD3D)?
				Kekule.CoordUtils.calcTransform3DMatrix(childTransformParams):
				Kekule.CoordUtils.calcTransform2DMatrix(childTransformParams);

		for (var i = 0, l = objects.length; i < l; ++i)
		{
			var obj = objects[i];
			obj.transformAbsCoordByMatrix(matrix, childMatrix, coordMode, true, allowCoordBorrow);
			obj.scaleSize(transformParams.scale, coordMode, true, allowCoordBorrow);
		}
	}
};

/**
 * Util methods about operations for editor.
 * @class
 */
Kekule.Editor.OperationUtils = {
	/**
	 * Create a node modification operation for editor.
	 * @param {Kekule.ChemStructureNode} node
	 * @param {Kekule.ChemStructureNode} newNode
	 * @param {Class} newNodeClass
	 * @param {Hash} modifiedProps
	 * @param {Kekule.Editor.BaseEditor} editor
	 * @returns {Kekule.Operation}
	 */
	createNodeModificationOperation: function(node, newNode, newNodeClass, modifiedProps, editor)
	{
		var operGroup, oper;
		var oldNodeClass = node.getClass();
		if (newNode && !newNodeClass)
			newNodeClass = newNode.getClass();
		if (newNode || newNodeClass !== oldNodeClass)  // need to replace node
		{
			operGroup = new Kekule.MacroOperation();
			if (!newNode)
				newNode = new newNodeClass();
			var tempNode = new Kekule.ChemStructureNode();
			tempNode.assign(node);
			newNode.assign(tempNode);  // copy some basic info of old node
			var operReplace = new Kekule.ChemStructOperation.ReplaceNode(node, newNode, null, editor);
			operGroup.add(operReplace);
		}
		else  // no need to replace
			newNode = node;

		if (modifiedProps)
		{
			if (Kekule.ObjUtils.match(newNode, modifiedProps))
			{
				// old value same as new value, no need to create operation
				// console.log(modifiedProps);
			}
			else
			{
				oper = new Kekule.ChemObjOperation.Modify(newNode, modifiedProps, editor);
				if (operGroup)
					operGroup.add(oper);
			}
		}

		var operation = operGroup || oper;
		return operation;
	},
	/**
	 * Create a node modification operation for editor.
	 * @param {Kekule.ChemStructureNode} node
	 * @param {Hash} newData
	 * @param {Kekule.Editor.BaseEditor} editor
	 * @returns {Kekule.Operation}
	 */
	createNodeModificationOperationFromData: function(node, newData, editor)
	{
		if (!newData)
			return null;

		var nodeClass = newData.nodeClass;
		var modifiedProps = newData.props;
		var repItem = newData.repositoryItem;
		var newNode;

		if (repItem)  // need to apply structure repository item
		{
			var repResult = repItem.createObjects(node) || {};
			var repObjects = repResult.objects;
			var transformParams = Kekule.Editor.RepositoryStructureUtils.calcRepObjInitialTransformParams(editor, repItem, repResult, node, null);
			editor.transformCoordAndSizeOfObjects(repObjects, transformParams);
			newNode = repObjects[0];
			nodeClass = newNode.getClass();
		}

		if (newData.isUnknownPseudoatom && !editor.getEditorConfigs().getInteractionConfigs().getAllowUnknownAtomSymbol())
			nodeClass = null;

		if (!nodeClass)
		{
			Kekule.error(Kekule.$L('ErrorMsg.INVALID_ATOM_SYMBOL'));
			return null;
		}
		else
		{
			if (modifiedProps)
			{
				var mProps = Object.extend({}, modifiedProps);  // clone this object to protect it, since we may change props in the following code
				if (node.getExplicitHydrogenCount && node.getExplicitHydrogenCount())  // has old explicit hydrogen count, explicitly clear it
				{
					mProps.explicitHydrogenCount = null;
				}
				if (mProps.inputHydrogenCount && mProps.isotopeId)  // user has input hydrogen count, comparing with implicit HCount, if different, use it as explicit HCount
				{
					var newImplicitHCount;
					var modifyTargetNode = newNode || node;
					if (modifyTargetNode && modifyTargetNode.getDisableImplicitHydrogenEstimation && modifyTargetNode.getDisableImplicitHydrogenEstimation())
					{
						newImplicitHCount = 0;
					}
					else
					{
						var oldCovalentBondsInfo = (node._getCurrCovalentBondsInfo && node._getCurrCovalentBondsInfo()) || {};
						var oldIonicBondsInfo = (node._getCurrIonicBondsInfo && node._getCurrIonicBondsInfo()) || {};
						var atomicSymbol = Kekule.IsotopesDataUtil.getIsotopeIdDetail(mProps.isotopeId).symbol;
						var atomicNum = Kekule.ChemicalElementsDataUtil.getAtomicNumber(atomicSymbol);
						var charge = Math.round((node.getCharge && node.getCharge()) || 0);
						var radicalECount = node.getRadical ? Kekule.RadicalOrder.getRadicalElectronCount(node.getRadical()) : 0;
						newImplicitHCount = Kekule.ChemStructureUtils.getImplicitHydrogenCount(atomicNum, {
							'coValenceBondValenceSum': oldCovalentBondsInfo.valenceSum || 0,
							'otherBondValenceSum': oldIonicBondsInfo.valenceSum || 0,
							'charge': charge,
							'radicalECount': radicalECount
						});
					}
					//console.log('impl expl compare', newImplicitHCount, mProps.inputHydrogenCount);
					if (newImplicitHCount !== mProps.inputHydrogenCount)  // not match, use the inputHydrogenCount as explicit HCount
					{
						mProps.explicitHydrogenCount = mProps.inputHydrogenCount;
						delete mProps.inputHydrogenCount;
						//console.log('explicit HCount', mProps.inputHydrogenCount, newImplicitHCount);
					}
				}
			}
			return Kekule.Editor.OperationUtils.createNodeModificationOperation(node, newNode, nodeClass, mProps, editor);
		}
	}
};

})();
