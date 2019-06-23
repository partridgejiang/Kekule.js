/**
 * @fileoverview
 * Extend some core classes for editing purpose.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.structures.js
 * requires /utils/kekule.utils.js
 */

(function()
{

var K = Kekule;
var C = Kekule.CoordMode;
var AU = Kekule.ArrayUtils;

ClassEx.extend(Kekule.ChemObject,
/** @lends Kekule.ChemObject# */
{
	/**
	 * Check if this chem object is independent and can be cloned in editor.
	 * @returns {Bool}
	 */
	isStandalone: function()
	{
		//return true;
		return !this.getIsAttachedToParent();
	},
	/**
	 * If this object is standalone, this method will return this directly.
	 * Otherwise will find the nearest standalone parent object.
	 */
	getStandaloneAncestor: function()
	{
		var result = this;
		while (result.isStandalone && (!result.isStandalone()) && result.getParent && result.getParent())
		{
			result = result.getParent();
		}
		return result;
	},
	/**
	 * Returns objects that should be removed cascadely when deleting this one in editor.
	 * @returns {Array}
	 */
	getCascadeDeleteObjs: function()
	{
		return [];
	},
	/**
	 * Remove this object (from parent object), then notify parent to remove dependant objects.
	 * This method will be used to delete objects in editor.
	 * @param {Bool} freeObj If this param is set to true, current object will be immediately finalized.
	 */
	cascadeRemove: function(freeObj)
	{
		var parent = this.getParent();
		if (parent && parent.notifyBeforeCascadeRemove)
			parent.notifyBeforeCascadeRemove(this);
		if (freeObj)
			this.finalize();
		else
			this.removeSelf();
		if (parent && parent.notifyAfterCascadeRemove)
			parent.notifyAfterCascadeRemove(this);
	},
	/**
	 * The method will be called from child that will be cascadely removed.
	 * Parent can do some related removing job here (e.g., remove dependant objects).
	 * @param {Kekule.ChemObject} childToBeDeleted
	 * @param {Bool} freeObj If this param is set to true, the removed object will be immediately finalized.
	 * @private
	 */
	notifyBeforeCascadeRemove: function(childToBeDeleted, freeObj)
	{
		// do nothing here
	},
	/**
	 * The method will be called from child that has been already cascadely removed.
	 * Parent can do some related removing job here (e.g., remove dependant objects).
	 * @param {Kekule.ChemObject} childBeDeleted
	 * @param {Bool} freeObj If this param is set to true, the removed object will be immediately finalized.
	 * @private
	 */
	notifyAfterCascadeRemove: function(childBeDeleted, freeObj)
	{
		// do nothing here
		if ((!this.getKeepEmptyEvenOnCascadeRemove()) && this.isEmpty())
		{
			this.cascadeRemove(freeObj);
		}
	},

	/**
	 * Whether the coord of chem object is calculated from other object (like connector).
	 * @returns {Bool}
	 */
	isCoordDependent: function()
	{
		return false;
	},
	/**
	 * If coord is calculated from other objects, this function will return them.
	 * If this object is coord independent, this function will return object itself.
	 * @return {Array}
	 */
	getCoordDependentObjects: function()
	{
		var result = [];
		if (!this.isCoordDependent())
			result.push(this);
		return result;
	},
	/**
	 * If this object determinate other object's coord, this method should returns them.
	 * @return {Array}
	 */
	getCoordDeterminateObjects: function()
	{
		var result = [];
		if (this.getAttachedMarkers)
		{
			var markers = this.getAttachedMarkers() || [];
			for (var i = 0, l = markers.length; i < l; ++i)
			{
				result = result.concat(markers[i].getCoordDependentObjects());
			}
		}
		return result;
	},

	/**
	 * Return all bonds in this chemObject as well as in child objects.
	 * @returns {Array} Array of {Kekule.ChemStructureConnector}.
	 */
	getAllContainingConnectors: function()
	{
		return [];
	},

	/**
	 * Returns the stub object (e.g. the rotation center object in constraint bond rotation) in constraint manipulation.
	 * Null means constraint manipulation is not available.
	 * Descendants may override this method.
	 * @returns {Object}
	 * @private
	 */
	getConstraintManipulationBaseObj: function()
	{
		if (this.isAttachedMarker && this.isAttachedMarker())
		{
			var p = this.getParent();
			if (p instanceof Kekule.StructureFragment) // molecule total charge will be be constrainted
				return null;
			else
				return p;
			//return p;
		}
		else
			return null;
	},

	/**
	 * Transform abs coord of object by transformMatrix.
	 * @param {Array} transformMatrix
	 * @param {Array} childTransformMatrix Usually this matrix exclude translate.
	 * @param {Int} coordMode
	 * @param {Bool} cascade Whether transform child objects. Default is true.
	 * @param {Bool} allowCoordBorrow
	 */
	transformAbsCoordByMatrix: function(transformMatrix, childTransformMatrix, coordMode, cascade, allowCoordBorrow, _useChildCoord)
	{
		// transform children
		if (this.getChildCount && (cascade || Kekule.ObjUtils.isUnset(cascade)))
		{
			for (var i = 0, l = this.getChildCount(); i < l; ++i)
			{
				var child = this.getChildAt(i);
				if (child && child.transformAbsCoordByMatrix)
					child.transformAbsCoordByMatrix(childTransformMatrix, childTransformMatrix, coordMode, cascade, allowCoordBorrow, true);
			}
		}
		var transformFunc = (coordMode === Kekule.CoordMode.COORD3D)? Kekule.CoordUtils.transform3DByMatrix
			:Kekule.CoordUtils.transform2DByMatrix;
		// transform self
		if (_useChildCoord)
		{
			if (this.getCoordOfMode && this.setCoordOfMode)
			{
				var coord = this.getCoordOfMode(coordMode, allowCoordBorrow);
				var newCoord = transformFunc(coord, transformMatrix);
				this.setCoordOfMode(newCoord, coordMode);
			}
		}
		else if (this.getAbsCoordOfMode && this.setAbsCoordOfMode)
		{
			var coord = this.getAbsCoordOfMode(coordMode, allowCoordBorrow);
			var newCoord = transformFunc(coord, transformMatrix);
			this.setAbsCoordOfMode(newCoord, coordMode);
		}
	},
	/**
	 * Scale size of object.
	 * @param {Float} scale
	 * @param {Int} coordMode
	 * @param {Bool} cascade Whether scale child objects, default is true.
	 * @param {Bool} allowCoordBorrow
	 */
	scaleSize: function(scale, coordMode, cascade, allowCoordBorrow)
	{
		if (this.getSizeOfMode && this.setSizeOfMode)
		{
			var size = this.getSizeOfMode(coordMode, allowCoordBorrow);
			var newSize = Kekule.CoordUtils.multiply(size, scale);
			this.setSizeOfMode(newSize, coordMode);
		}
		if (this.getChildCount && (cascade || Kekule.ObjUtils.isUnset(cascade)))
		{
			for (var i = 0, l = this.getChildCount(); i < l; ++i)
			{
				var child = this.getChildAt(i);
				if (child && child.scaleSize)
					child.scaleSize(scale, coordMode, cascade, allowCoordBorrow);
			}
		}
	}
});
ClassEx.extendMethod(Kekule.ChemObject, '_attachedMarkerAdded', function($origin, marker){
	var result = $origin(marker);
	if (marker)
		marker.setIsAttachedToParent(true);
	return result;
});
ClassEx.extendMethod(Kekule.ChemObject, '_attachedMarkerRemoved', function($origin, marker){
	var result = $origin(marker);
	if (marker)
		marker.setIsAttachedToParent(false);
	return result;
});
ClassEx.defineProps(Kekule.ChemObject, [
	// If this value is true, on cascade deleting, this object will not be deleted even if it is empty (without any children and data).
	{'name': 'keepEmptyEvenOnCascadeRemove', 'dataType': DataType.BOOL, 'scope': Class.PropertyScope.PUBLIC},
	// Explicit whether this object is attached to another one as an attached marker
	{'name': 'isAttachedToParent', 'dataType': DataType.BOOL, 'scope': Class.PropertyScope.PUBLIC}
]);

ClassEx.extend(Kekule.ChemStructureObject,
/** @lends Kekule.ChemStructureObject# */
{
	/** @ignore */
	getCascadeDeleteObjs: function($super)
	{
		// TODO: here nested substructures is not considered
		var result = $super();
		var linkedConnectors = this.getLinkedConnectors? this.getLinkedConnectors(): [];
		for (var i = 0, l = linkedConnectors.length; i < l; ++i)
		{
			var connector = linkedConnectors[i];
			if (connector.getConnectedObjs().length <= 2)
			{
				Kekule.ArrayUtils.pushUnique(result, connector);
				var newCascadeObjs = connector.getCascadeDeleteObjs();
				Kekule.ArrayUtils.pushUnique(result, newCascadeObjs);
			}
		}
		return result;
	},
	/** @ignore */
	isStandalone: function($super)
	{
		return false;  // structure object usually is child of struct fragment
	},

	/**
	 * If this object determinate other object's coord, this method should returns them.
	 * @return {Array}
	 */
	getCoordDeterminateObjects: function($super)
	{
		var result = $super();
		var connectors = this.getLinkedConnectors();
		for (var i = 0, l = connectors.length; i < l; ++i)
		{
			var connector = connectors[i];
			AU.pushUnique(result, connector);
			AU.pushUnique(result, connector.getCoordDeterminateObjects());
		}
		var coordStickNodes = this.getAttachedCoordStickNodes();
		for (var i = 0, l = coordStickNodes.length; i < l; ++i)
		{
			var node = coordStickNodes[i];
			AU.pushUnique(result, node);
			AU.pushUnique(result, node.getCoordDeterminateObjects());
		}
		return result;
	}
});

ClassEx.extend(/*Kekule.ChemStructureNode*/Kekule.BaseStructureNode,
/** @lends Kekule.BaseStructureNode# */
{
	/** @ignore */
	getCascadeDeleteObjs: function($super)
	{
		return $super();
	},
	/**
	 * Whether the coord of chem object is calculated from other object (like connector).
	 * @returns {Bool}
	 */
	isCoordDependent: function()
	{
		return false;
		//return !!this.getCoordStickTarget();
	},
	/**
	 * If coord is calculated from other objects, this function will return them.
	 * @return {Array}
	 */
	getCoordDependentObjects: function($super)
	{
		return $super();
		/*
		if (this.getCoordStickTarget())  // has coord stick target
		{
			var result = $super() || [];
			result = result.concat(this.getCoordStickTarget());
			return result;
		}
		else
			return $super();
		*/
	},
	/**
	 * Move node by delta.
	 * @param {Hash} delta
	 * @param {Int} coordMode
	 * @returns {Hash} New coord after moving.
	 */
	move: function(delta, coordMode)
	{
		var oldCoord = this.getCoordOfMode(coordMode);
		var newCoord = Kekule.CoordUtils.add(oldCoord, delta);
		this.setCoordOfMode(newCoord, coordMode);
		return newCoord;
	},
	/**
	 * Move node 2D coord by delta.
	 * @param {Hash} delta
	 * @returns {Hash} New coord after moving.
	 */
	move2D: function(delta)
	{
		return this.move(delta, C.COORD2D);
	},
	/**
	 * Move node 3D coord by delta.
	 * @param {Hash} delta
	 * @returns {Hash} New coord after moving.
	 */
	move3D: function(delta)
	{
		return this.move(delta, C.COORD3D);
	}
});

ClassEx.extend(/*Kekule.ChemStructureConnector*/Kekule.BaseStructureConnector,
/** @lends Kekule.BaseStructureConnector# */
{
	/** @ignore */
	getCascadeDeleteObjs: function($super)
	{
		var result = $super();
		var objs = this.getConnectedObjs();
		for (var i = 0, l = objs.length; i < l; ++i)
		{
			var obj = objs[i];
			if (obj instanceof Kekule.BaseStructureNode)
			{
				if (obj.getLinkedConnectors().length <= 1)
					Kekule.ArrayUtils.pushUnique(result, obj);
			}
		}
		return result;
	},
	/**
	 * Whether the coord of chem object is not calculated from other object (like connector).
	 * @returns {Bool}
	 */
	isCoordDependent: function()
	{
		return true;
	},
	/**
	 * If coord is calculated from other objects, this function will return them.
	 * @return {Array}
	 */
	getCoordDependentObjects: function($super)
	{
		var result = $super();  // []
		var objs = this.getConnectedObjs();
		// if objs is a nested node in fragment and the fragment is not expanded, return the fragment instead
		for (var i = 0, l = objs.length; i < l; ++i)
		{
			var obj = objs[i];
			var connObj;
			if (obj.isExposed)
			{
				var connObj = obj.isExposed()? obj: obj.getExposedAncestor();
				/*
				if (obj.isExposed())
					result.push(obj);
				else
					result.push(obj.getExposedAncestor());
				*/
			}
			else
				connObj = obj;
				//result.push(obj);
				//result = result.concat(obj);
			if (connObj)
				AU.pushUnique(result, connObj.getCoordDependentObjects());
				//result.push(connObj);
		}
		return result;
	},
	/**
	 * Move connector by delta. Actually this action will move all nodes connected with this connector.
	 * @param {Hash} delta
	 * @param {Int} coordMode
	 */
	move: function(delta, coordMode)
	{
		for (var i = 0, l = this.getConnectedObjCount(); i < l; ++i)
		{
			var obj = this.getConnectedObjAt(i);
			if (obj.move)
				obj.move(delta, coordMode);
		}
	},
	/**
	 * Move connector 2D coord by delta.
	 * @param {Hash} delta
	 * @returns {Hash} New coord after moving.
	 */
	move2D: function(delta)
	{
		return this.move(delta, C.COORD2D);
	},
	/**
	 * Move connector 3D coord by delta.
	 * @param {Hash} delta
	 * @returns {Hash} New coord after moving.
	 */
	move3D: function(delta)
	{
		return this.move(delta, C.COORD3D);
	},
	/**
	 * Set absolute center coord of connector.
	 * Actually mode all conntected nodes.
	 * @param {Hash} value
	 * @param {Int} coordMode
	 */
	setAbsBaseCoord: function(value, coordMode)
	{
		var old = this.getAbsBaseCoord();
		var delta = Kekule.CoordUtils.substract(value, old);
		this.move(delta, coordMode);
	},
	setAbsBaseCoord2D: function(value)
	{
		this.setAbsCoordOfMode(value, Kekule.CoordMode.COORD2D);
	},
	setAbsBaseCoord3D: function(value)
	{
		this.setAbsCoordOfMode(value, Kekule.CoordMode.COORD3D);
	}
});

ClassEx.extend(Kekule.ChemStructureNode,
/** @lends Kekule.ChemStructureNode# */
{
	/** @ignore */
	getConstraintManipulationBaseObj: function($super)
	{
		var linkedObjs = this.getLinkedObjs();
		return (linkedObjs.length === 1)? linkedObjs[0]: $super();
	}
});

ClassEx.extend(Kekule.Glyph.PathGlyphNode,
/** @lends Kekule.Glyph.PathGlyphNode# */
{
	/** @ignore */
	getCascadeDeleteObjs: function($super)  // to glyph element, delte one means delete the whole glyph
	{
		/*
		var result = $super();
		result.push(this.getParent());
		*/
		var result = [this.getParent()];
		return result;
	},
	/** @ignore */
	getConstraintManipulationBaseObj: function($super)
	{
		var linkedObjs = this.getLinkedObjs();
		return (linkedObjs.length === 1)? linkedObjs[0]: $super();
	}
});
ClassEx.extend(Kekule.Glyph.PathGlyphConnectorControlNode,
/** @lends Kekule.Glyph.PathGlyphConnectorControlNode# */
{
	/**
	 * If coord is calculated from other objects, this function will return them.
	 * @return {Array}
	 */
	/*
	getCoordDependentObjects: function($super)
	{
		var result = $super();  // []
		var connector = this.getParentConnector();
		if (connector)
			result = (result || []).concat([connector]);
		return result;
	}
	*/
	/**
	 * If this object determinate other object's coord, this method should returns them.
	 * @return {Array}
	 * @ignore
	 */
	getCoordDeterminateObjects: function($super)
	{
		var result = $super();  // []
		var connector = this.getParentConnector();
		if (connector)
			result = (result || []).concat([connector]);
		return result;
	},
});
ClassEx.extend(Kekule.Glyph.PathGlyphConnector,
/** @lends Kekule.Glyph.PathGlyphConnector# */
{
	/** @ignore */
	getCascadeDeleteObjs: function($super)  // to glyph element, delte one means delete the whole glyph
	{
		/*
		var result = $super();
		result.push(this.getParent());
		*/
		var result = [this.getParent()];
		return result;
	},
	/**
	 * If coord is calculated from other objects, this function will return them.
	 * @return {Array}
	 * @ignore
	 */
	getCoordDependentObjects: function($super)
	{
		var result = $super();  // []
		var controlPoints = this.getControlPoints && this.getControlPoints();
		if (controlPoints && controlPoints.length)
		{
			result = (result || []).concat(controlPoints);
		}
		return result;
	}
});

ClassEx.extend(Kekule.StructureFragment,
/** @lends Kekule.StructureFragment# */
{
	/** @ignore */
	isStandalone: function($super)
	{
		return !this.getCrossConnectors().length;  // cross connector means this fragment is child of another fragment
	},
	/** @private */
	notifyBeforeCascadeRemove: function($super, childToBeDeleted, freeObj)
	{
		// get dependant objects
		var dependantObjs = this._getObjsNeedToBeCascadeRemoved(childToBeDeleted);
		if (dependantObjs && dependantObjs.length)
		{
			for (var i = dependantObjs.length - 1; i >= 0; --i)
			{
				var obj = dependantObjs[i];
				//obj.cascadeDelete();  // DONE: is this safe? not safe, may cause recursion.
				if (freeObj)
					obj.finalize();
				else
					obj.removeSelf();
			}
		}
		$super(childToBeDeleted, freeObj);
	},
	/** @private */
	getCoordDependentObjects: function($super)  // when manipulate mol in editor, actually the nodes are moved or rotated
	{
		if (this.isExpanded && !this.isExpanded())
		{
			return $super();
		}
		else if (!this.hasCtab())
			return $super();
		else
		{
			var result = []; // $super();
			var childCount = this.getChildCount();
			for (var i = 0; i < childCount; ++i)
			{
				var child = this.getChildAt(i);
				AU.pushUnique(result, child.getCoordDependentObjects());
			}
			return result;
		}
	},
	/** @ignore */
	transformAbsCoordByMatrix: function($super, transformMatrix, childTransformMatrix, coordMode, cascade, allowCoordBorrow, _useChildCoord)
	{
		// transform node only
		if (cascade || Kekule.ObjUtils.isUnset(cascade))
		{
			for (var i = 0, l = this.getNodeCount(); i < l; ++i)
			{
				var node = this.getNodeAt(i);
				if (node && node.transformAbsCoordByMatrix)
					node.transformAbsCoordByMatrix(childTransformMatrix, childTransformMatrix, coordMode, cascade, allowCoordBorrow, true);
			}
		}
		// then transform self
		$super(transformMatrix, childTransformMatrix, coordMode, false, allowCoordBorrow, _useChildCoord);
	}
});

/*
ClassEx.extend(Kekule.CompositeMolecule, {
	notifyAfterCascadeDelete: function($super, childBeDeleted)
	{
		$super(childToBeDeleted);

		// if self is empty, release self
		if (this.getSubMoleculeCount() <= 0)
			this.cascadeDelete();
	}
});
*/

ClassEx.extend(Kekule.Glyph.Base,
/** @lends Kekule.Glyph.Base# */
{
	/** @ignore */
	isStandalone: function($super)
	{
		return /*true && */ $super();
	}
});

ClassEx.extend(Kekule.Glyph.PathGlyph,
/** @lends Kekule.Glyph.PathGlyph# */
{
	/** @private */
	getCoordDependentObjects: function()
	{
		var result = [];
		var nodeCount = this.getNodeCount();
		for (var i = 0; i < nodeCount; ++i)
		{
			var node = this.getNodeAt(i);
			result.push(node);
		}
		return result;
	},
	/** @ignore */
	transformAbsCoordByMatrix: function($super, transformMatrix, childTransformMatrix, coordMode, cascade, allowCoordBorrow, _useChildCoord)
	{
		// transform node only
		if (cascade || Kekule.ObjUtils.isUnset(cascade))
		{
			for (var i = 0, l = this.getNodeCount(); i < l; ++i)
			{
				var node = this.getNodeAt(i);
				if (node && node.transformAbsCoordByMatrix)
					node.transformAbsCoordByMatrix(childTransformMatrix, childTransformMatrix, coordMode, cascade, allowCoordBorrow, true);
			}
		}
		// then transform self
		$super(transformMatrix, childTransformMatrix, coordMode, false, allowCoordBorrow, _useChildCoord);
	}
});

ClassEx.extend(Kekule.Glyph.BaseArc,
/** @lends Kekule.Glyph.BaseArc# */
{
	/** @ignore */
	ownerChanged: function($super, newOwner, oldOwner)
	{
		var needAutoAdjustClass = (!oldOwner && newOwner);  // when first inserting to a space, may need to adjust class
		var result = $super(newOwner, oldOwner);
		if (needAutoAdjustClass && this.getIsEditing())
		{
			this._autoAdjustClass();
		}
		return result;
	},
	/** @private */
	_getChemStickTargets: function()
	{
		var result = [];
		for (var i = 0, l = this.getNodeCount(); i < l; ++i)
		{
			var node = this.getNodeAt(i);
			var stickTarget = node.getCoordStickTarget();
			if (stickTarget && (stickTarget instanceof Kekule.ChemStructureNode || stickTarget instanceof Kekule.ChemStructureConnector))
				result.push(stickTarget);
		}
		return result;
	},
	/** @ignore */
	notifyChildCoordStickTargetChanged: function(child, oldTarget, newTarget)
	{
		this._autoAdjustClass();
	},
	_autoAdjustClass: function()
	{
		if (this.getIsEditing())
		{
			var stickTargets = this._getChemStickTargets();
			var isEPushingArrow = stickTargets.length >= 2;
			if (isEPushingArrow)
			{
				if (!(this instanceof Kekule.Glyph.ElectronPushingArrow))
				{
					//console.log('change to e arrow');
					this.__changeClass__(Kekule.Glyph.ElectronPushingArrow);
				}
			}
			else
			{
				if (this instanceof Kekule.Glyph.ElectronPushingArrow)
				{
					//console.log('change to arc');
					this.__changeClass__(Kekule.Glyph.Arc);
				}
			}
		}
	}
});
ClassEx.extendMethod(Kekule.Glyph.BaseArc, 'createDefaultStructure', function($origin, refLength, initialParams)
{
	var result = $origin(refLength, initialParams);
	this._autoAdjustClass();
	return result;
});

})();
