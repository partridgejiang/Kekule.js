/**
 * @fileoverview
 * This file contains basic classes to represent structural objects in molecule.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /data/kekule.dataUtils.js
 * requires /core/kekule.elements.js
 * requires /core/kekule.electrons.js
 * requires /core/kekule.valences.js
 * requires /utils/kekule.utils.js
 * requires /localizations/
 */

(function() {
"use strict";

/**
 * Enumeration of comparation of chem structure.
 * @enum
 */
Kekule.StructureComparationLevel = {
	/** Compare only topological graph, atom/bond details are ignored. */
	SKELETAL: 1,
	/** Compare only constitution, ignore stereo factors and charge. */
	CONSTITUTION: 2,
	/** Compare with stereo factors but ignore atom mass number and charge. */
	CONFIGURATION: 3,
	/** Compare with stereo factors and mass number / charge. */
	EXACT: 4,
	/** Default comparation level. */
	DEFAULT: 4
};

/*
 * Default options to compare chem structures.
 * @object
 */
/*
Kekule.globalOptions.structureComparation = {
	structureComparationLevel: Kekule.StructureComparationLevel.DEFAULT
};
*/

Kekule.globalOptions.add('algorithm.structureComparation', {
	structureComparationLevel: Kekule.StructureComparationLevel.DEFAULT
});

// extend method to Kekule.ObjComparer
Kekule.ObjComparer.compareStructure = function(obj1, obj2, options)
{
	var ops = Object.create(options || {});
	ops.method = Kekule.ComparisonMethod.CHEM_STRUCTURE;
	return Kekule.ObjComparer.compare(obj1, obj2, ops);
};
Kekule.ObjComparer.equalStructure = function(obj1, obj2, options)
{
	return Kekule.ObjComparer.compareStructure(obj1, obj2, options) === 0;
};
Kekule.ObjComparer.getStructureComparisonDetailOptions = function(initialOptions)
{
	var result = Object.extend({}, initialOptions);
	if (initialOptions /* && initialOptions.method === Kekule.ComparisonMethod.CHEM_STRUCTURE */)
	{
		var CL = Kekule.StructureComparationLevel;
		var level = initialOptions.structureLevel || initialOptions.level  // options.level for backward compatible
				|| Kekule.globalOptions.algorithm.structureComparation.structureComparationLevel;
		//if (Kekule.ObjUtils.notUnset(level))
		{
			var affectedFields = [
				'atom', 'mass', 'linkedConnectorCount', 'charge', 'radical', 'stereo',
				'hydrogenCount', 'connectedObjCount', 'bondType', 'bondOrder'
			];
			var detailOps;
			if (level === CL.SKELETAL)
				detailOps = {
					atom: false, mass: false, linkedConnectorCount: true, charge: false, radical: false,
					stereo: false, hydrogenCount: false,
					connectedObjCount: true, bondType: false, bondOrder: false
				};
			else if (level === CL.CONSTITUTION)
				detailOps = {
					atom: true, mass: false, linkedConnectorCount: true, charge: false, radical: false,
					stereo: false, hydrogenCount: true,
					connectedObjCount: true, bondType: true, bondOrder: true
				};
			else if (level === CL.CONFIGURATION)
				detailOps = {
					atom: true, mass: false, linkedConnectorCount: true, charge: false, radical: false,
					stereo: true, hydrogenCount: true,
					connectedObjCount: true, bondType: true, bondOrder: true
				};
			else if (level === CL.EXACT)
				detailOps = {
					atom: true, mass: true, linkedConnectorCount: true, charge: true, radical: true,
					stereo: true, hydrogenCount: true,
					connectedObjCount: true, bondType: true, bondOrder: true
				};

			// add compareXXX field to result, for backward compatibility
			/*
			var fields = Kekule.ObjUtils.getOwnedFieldNames(detailOps);
			for (var i = 0, l = fields.length; i < l; ++i)
			{
				var fieldName = fields[i];
				var value = detailOps[fieldName];
				var compatibleName = 'compare' + fieldName.capitalizeFirst();
				detailOps[compatibleName] = value;
			}
			*/
			for (var i = 0, l = affectedFields.length; i < l; ++i)
			{
				var fieldName = affectedFields[i];
				var compatibleFieldName = 'compare' + fieldName.capitalizeFirst();  // backward compatible
				var oldValue = result[fieldName];
				if (Kekule.ObjUtils.isUnset(oldValue))
					oldValue = result[compatibleFieldName];
				if (Kekule.ObjUtils.isUnset(oldValue))
				{
					result[fieldName] = detailOps[fieldName];
					result[compatibleFieldName] = detailOps[fieldName];
				}
				else
				{
					result[fieldName] = oldValue;
					result[compatibleFieldName] = oldValue;
				}
			}

			// override bool values
			//result = Object.extend(detailOps || {}, result);
		}
	}
	return result;
};

/**
 * An abstract structure object, either a node or a connector.
 * @class
 * @augments Kekule.ChemObject
 * @property {Kekule.ChemStructureObject} parent Parent of this object.
 *   For example, molecule is parent of its atoms and bonds.
 * @property {Array} linkedConnectors The connectors connected with this object.
 * @property {Array} linkedObjs Objects connected with this one through linkedConnectors. Read only.
 * @property {Array} linkedSiblings Sibling objects connected with this one through linkedConnectors. Read only.
 *   Note: if there are sub structures (subgroups) in connection table, and a object is linked with a inside object inside subgroup,
 *   linkedSiblings will returns the subgroup rather than the inside object.
 */
/**
 * Invoked when object is changed and the change is related with structure
 * (e.g. modify a bond, change a atomic number...).
 * Event has field: {origin: the change source object (may be a child of event.target}.
 * @name Kekule.ChemStructureObject#structureChange
 * @event
 */
Kekule.ChemStructureObject = Class.create(Kekule.ChemObject,
/** @lends Kekule.ChemStructureObject# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemStructureObject',
	/** @private */
	initProperties: function()
	{
		//this.defineProp('parent', {'dataType': 'Kekule.ChemStructureObject', 'serializable': false});
		this.defineProp('linkedConnectors', {
			'dataType': DataType.ARRAY,
			'serializable': false,
			'scope': Class.PropertyScope.PUBLIC,
			'setter': null,
			'getter': function()
				{
					if (!this.getPropStoreFieldValue('linkedConnectors'))
						this.setPropStoreFieldValue('linkedConnectors', []);
					return this.getPropStoreFieldValue('linkedConnectors');
				}
		});
		this.defineProp('linkedObjs', {
			'dataType': DataType.ARRAY,
			'serializable': false,
			'scope': Class.PropertyScope.PUBLIC,
			'setter': null,
			'getter': function()
				{
					var result = [];
					for (var i = 0, l = this.getLinkedConnectorCount(); i < l; ++i)
					{
						var connector = this.getLinkedConnectorAt(i);
						var objs = connector.getConnectedObjs();
						for (var j = 0, k = objs.length; j < k; ++j)
						{
							var currObj = objs[j];
							if (currObj !== this && !(this.hasChildObj && this.hasChildObj(currObj)))
								Kekule.ArrayUtils.pushUnique(result, objs[j]);
						}
					}
					return result;
				}
		});
		this.defineProp('linkedSiblings', {
			'dataType': DataType.ARRAY,
			'serializable': false,
			'scope': Class.PropertyScope.PUBLIC,
			'setter': null,
			'getter': function()
				{
					var result = [];
					var parent = this.getParent();
					for (var i = 0, l = this.getLinkedConnectorCount(); i < l; ++i)
					{
						var connector = this.getLinkedConnectorAt(i);
						var objs = connector.getConnectedObjs();
						for (var j = 0, k = objs.length; j < k; ++j)
						{
							var obj = objs[j];
							if (obj !== this)
							{
								if (result.indexOf(obj) < 0)
								{
									if (obj.getParent() !== parent)
										obj = parent.getDirectChildOfNestedNode(obj);
									if (obj)
										result.push(obj);
								}
							}
						}
					}
					return result;
				}
		});
	},
	/** @private */
	initPropValues: function($super)
	{
		$super();
		this.setPropStoreFieldValue('linkedConnectors', []);
		this.setSuppressChildChangeEventInUpdating(true);
	},
	/** @private */
	getAutoIdPrefix: function()
	{
		return 'o';
	},

	/** @ignore */
	doGetActualCompareOptions: function($super, options)
	{
		if (options && options.method === Kekule.ComparisonMethod.CHEM_STRUCTURE)
			return Kekule.ObjComparer.getStructureComparisonDetailOptions(options);
		else
			return $super(options);
	},
	/** @private */
	_getComparisonOptionFlagValue: function(options, flagName)
	{
		var compatibleName = 'compare' + flagName.capitalizeFirst();
		var result = options[compatibleName];
		if (Kekule.ObjUtils.isUnset(result))
			result = options[flagName];
		return result;
	},
	/** @ignore */
	doGetComparisonPropNames: function($super, options)
	{
		if (options.method === Kekule.ComparisonMethod.CHEM_STRUCTURE)
		{
			return [];
		}
		else
			return $super(options);
	},
	/** @ignore */
	doCompare: function($super, targetObj, options)
	{
		var result = $super(targetObj, options);
		if (!result && options.method === Kekule.ComparisonMethod.CHEM_STRUCTURE)  // can not find different in $super
		{
			if (this._getComparisonOptionFlagValue(options, 'linkedConnectorCount'))
			{
				var c1 = this.getLinkedNonHydrogenConnectors();
				var c2 = targetObj.getLinkedNonHydrogenConnectors && targetObj.getLinkedNonHydrogenConnectors();
				result = this.doCompareOnValue(c1.length, c2 && c2.length, options);
			}
		}
		return result;
	},
	/**
	 * Explicit set compare method to chem structure and compare to targetObj.
	 * @param {Kekule.ChemObject} targetObj
	 * @param {Hash} options
	 * @returns {Int}
	 */
	compareStructure: function(targetObj, options)
	{
		var ops = Object.create(options || {});
		ops.method = Kekule.ComparisonMethod.CHEM_STRUCTURE;
		return this.compare(targetObj, ops);
	},
	/**
	 * Check if this object and targetObj has equivalent chem structure.
	 * @param {Kekule.ChemObject} targetObj
	 * @param {Hash} options
	 * @returns {Bool}
	 */
	equalStructure: function(targetObj, options)
	{
		return this.compareStructure(targetObj, options) === 0;
	},

	/**
	 * If {@link Kekule.ChemStructureObject#parent} is a {@link Kekule.StructureFragment}, returns this fragment.
	 * @returns {Kekule.StructureFragment}
	 */
	getParentFragment: function()
	{
		var p = this.getParent();
		return (p instanceof Kekule.StructureFragment)? p: null;
	},
	/**
	 * Returns the root parent of {@link Kekule.StructureFragment}, rather than subgroups.
	 * @returns {Kekule.StructureFragment}
	 */
	getRootFragment: function()
	{
		var p = this.getParentFragment();
		if (p)
			return p.getRootFragment() || p;
		else
			return p;
	},

	/** @private */
	notifyLinkedConnectorsChanged: function()
	{
		this.notifyPropSet('linkedConnectors', this.getPropStoreFieldValue('linkedConnectors'));
	},

	/**
	 * Returns self or child object that can directly linked to a connector.
	 * For atom or other simple chem objetc, this function should just returns self,
	 * for structure fragment, this function need to returns an anchor node.
	 * @returns {Kekule.ChemStructureObject}
	 */
	getCurrConnectableObj: function()
	{
		return this;
	},

	/**
	 * Return count of linkedConnectors.
	 * @returns {Int}
	 */
	getLinkedConnectorCount: function()
	{
		return this.getLinkedConnectors().length;
	},
	/**
	 * Get linked connector object at index.
	 * @param {Int} index
	 * @returns {Kekule.ChemStructureConnector}
	 */
	getLinkedConnectorAt: function(index)
	{
		return this.getLinkedConnectors()[index];
	},
	/**
	 * Returns index of connector connected to node.
	 * @param {Kekule.ChemStructureConnector} connector
	 * @returns {Int}
	 */
	indexOfLinkedConnector: function(connector)
	{
		return this.getLinkedConnectors().indexOf(connector);
	},
	/**
	 * Link a connector to this node.
	 * @param {Kekule.ChemStructureConnector} connector
	 */
	appendLinkedConnector: function(connector)
	{
		var result = this._doAppendLinkedConnector(connector);
		if (connector)
			connector._doAppendConnectedObj(this);
		return result;
	},
	/** @private */
	_doAppendLinkedConnector: function(connector)
	{
		if (!connector)
			return -1;
		var linkedConnectors = this.getPropStoreFieldValue('linkedConnectors'); // IMPORTANT: do not use getLinkedConnectors() as it may be override by descendants
		var r = Kekule.ArrayUtils.pushUniqueEx(linkedConnectors, connector);
		if (r.isPushed)
			this.notifyLinkedConnectorsChanged();
		//console.log('append linked connector', linkedConnectors.length, this.getLinkedConnectors().length);
		return r.index;
	},
	/**
	 * Remove connector at index of linkedConnectors.
	 * @param {Int} index
	 */
	removeLinkedConnectorAt: function(index)
	{
		var connector = this.getLinkedConnectorAt(index);
		if (connector)
			connector._doRemoveConnectedObjAt(connector.indexOfConnectedObj(this));
		return this._doRemoveLinkedConnectorAt(index);
	},
	/** @private */
	_doRemoveLinkedConnectorAt: function(index)
	{
		var r = Kekule.ArrayUtils.removeAt(this.getLinkedConnectors(), index);
		if (r)
			this.notifyLinkedConnectorsChanged();
		return r;
	},
	/**
	 * Remove a connector in linkedContainer.
	 * @param {Kekule.ChemStructureConnector} connector
	 */
	removeLinkedConnector: function(connector)
	{
		var index = this.getLinkedConnectors().indexOf(connector);
		if (index >= 0)
			this.removeLinkedConnectorAt(index);
	},
	/**
	 * Get connector between this object and another object.
	 * @param {Kekule.ChemStructureObject} obj
	 * @returns {Kekule.ChemStructureConnector}
	 */
	getConnectorTo: function(obj)
	{
		for (var i = 0, l = this.getLinkedConnectorCount(); i < l; ++i)
		{
			var c = this.getLinkedConnectorAt(i);
			if (c.hasConnectedObj(obj))
				return c;
		}
		return null;
	},
	/**
	 * Remove this node from all linked connectors.
	 * Ths method should be called before a object is removed from a structure.
	 */
	removeThisFromLinkedConnector: function()
	{
		for (var i = this.getLinkedConnectorCount() - 1; i >= 0; --i)
		{
			var c = this.getLinkedConnectorAt(i);
			c.removeConnectedObj(this);
		}
	},

	/*
	 * Returns other objects connected to this one through all connectors.
	 * @returns {Array}
	 */
	/*
	getLinkedObjs: function()
	{
		var result = [];
		for (var i = 0, l = this.getLinkedConnectorCount(); i < l; ++i)
		{
			var connector = this.getLinkedConnectorAt(i);
			var objs = connector.getConnectedObjs();
			for (var j = 0, k = objs.length; j < k; ++j)
			{
				if (objs[j] !== this)
					Kekule.ArrayUtils.pushUnique(result, objs[j]);
			}
		}
		return result;
	},
	*/
	/**
	 * Returns other objects connected to this one through connector.
	 * @returns {Array}
	 */
	getLinkedObjsOnConnector: function(connector)
	{
		var result = [];
		var objs = connector.getConnectedObjs();
		for (var j = 0, k = objs.length; j < k; ++j)
		{
			if (objs[j] !== this)
				Kekule.ArrayUtils.pushUnique(result, objs[j]);
		}
		return result;
	},
	/**
	 * Returns connectors that connected to a non hydrogen node.
	 * @returns {Array}
	 */
	getLinkedNonHydrogenConnectors: function()
	{
		var result = [];
		for (var i = 0, l = this.getLinkedConnectorCount(); i < l; ++i)
		{
			var connector = this.getLinkedConnectorAt(i);
			if (!connector.isNormalConnectorToHydrogen || !connector.isNormalConnectorToHydrogen())
				Kekule.ArrayUtils.pushUnique(result, connector);
		}
		return result;
	},
	/**
	 * Returns linked objects except hydrogen atoms.
	 * @returns {Array}
	 */
	getLinkedNonHydrogenObjs: function()
	{
		var result = [];
		for (var i = 0, l = this.getLinkedConnectorCount(); i < l; ++i)
		{
			var connector = this.getLinkedConnectorAt(i);
			var objs = connector.getConnectedObjs();
			for (var j = 0, k = objs.length; j < k; ++j)
			{
				if (objs[j] !== this && (!objs[j].isHydrogenAtom || !objs[j].isHydrogenAtom()))
				{
					Kekule.ArrayUtils.pushUnique(result, objs[j]);
				}
			}
		}
		return result;
	},
	/**
	 * Returns linked hydrogen atoms.
	 * @returns {Array}
	 */
	getLinkedHydrogenAtoms: function()
	{
		var result = [];
		for (var i = 0, l = this.getLinkedConnectorCount(); i < l; ++i)
		{
			var connector = this.getLinkedConnectorAt(i);
			var objs = connector.getConnectedObjs();
			for (var j = 0, k = objs.length; j < k; ++j)
			{
				if (objs[j] !== this && (objs[j].isHydrogenAtom && objs[j].isHydrogenAtom()))
				{
					Kekule.ArrayUtils.pushUnique(result, objs[j]);
				}
			}
		}
		return result;
	},

	/**
	 * Returns property names that affects chem structure.
	 * Descendants should override this method.
	 * @private
	 */
	getStructureRelatedPropNames: function()
	{
		return ['linkedConnectors'];
	},
	/**
	 * Notify the structure of object has been changed.
	 * @param {Kekule.ChemStructureObject} originObj
	 * @private
	 */
	structureChange: function(originObj)
	{
		//console.log('structure change', originObj && originObj.getClassName(), this.getClassName());
		this.clearStructureFlags();
		this.invokeEvent('structureChange', {'origin': originObj || this});
	},
	/**
	 * Clear all flags of structure object that should be changed when structure is changed.
	 * Descendants may override this method.
	 */
	clearStructureFlags: function()
	{
		// do nothing here
	},

	/** @ignore */
	relayEvent: function($super, eventName, event)
	{
		// if structureChange event is received from child object, means the whole structure of self is also changed
		// invoke a new structureChange on self and "eat" the original one
		if (eventName === 'structureChange')
			this.structureChange(event.origin);
		else
			$super(eventName, event);
	},

	/** @ignore */
	doObjectChange: function($super, modifiedPropNames)
	{
		if (Kekule.ArrayUtils.intersect(modifiedPropNames || [], this.getStructureRelatedPropNames()).length)
		{
			//console.log('change struct by',  Kekule.ArrayUtils.intersect(modifiedPropNames || [], this.getStructureRelatedPropNames()));
			this.structureChange();
		}
	}
});

/**
 * Represent an abstract structure node (atom, atom group, or even node in path glyphs etc.).
 * @class
 * @augments Kekule.ChemStructureObject
 * @param {String} id Id of this node.
 * @param {Hash} coord2D The 2D coordinates of node, {x, y}, can be null.
 * @param {Hash} coord3D The 3D coordinates of node, {x, y, z}, can be null.
 *
 * @property {Hash} coord2D The 2D coordinates of node, {x, y}.
 * @property {Hash} coord3D The 3D coordinates of node, {x, y, z}.
 * @property {Hash} absCoord2D The absolute 2D coordinates of node, {x, y}.
 * @property {Hash} absCoord3D The absolute 3D coordinates of node, {x, y, z}.
 * @property {Int} zIndex2D A special property like zIndex in HTML, indicating the position of z-stack for 2D sketch.
 *
 * @borrows Kekule.ClassDefineUtils.CommonCoordMethods#getCoordOfMode as #getCoordOfMode
 * @borrows Kekule.ClassDefineUtils.CommonCoordMethods#setCoordOfMode as #setCoordOfMode
 * @borrows Kekule.ClassDefineUtils.Coord2DMethods#fetchCoord2D as #fetchCoord2D
 * @borrows Kekule.ClassDefineUtils.Coord2DMethods#hasCoord2D as #hasCoord2D
 * @borrows Kekule.ClassDefineUtils.Coord2DMethods#get2DX as #get2DX
 * @borrows Kekule.ClassDefineUtils.Coord2DMethods#set2DX as #set2DX
 * @borrows Kekule.ClassDefineUtils.Coord2DMethods#get2DY as #get2DY
 * @borrows Kekule.ClassDefineUtils.Coord2DMethods#set2DY as #set2DY
 * @borrows Kekule.ClassDefineUtils.Coord3DMethods#fetchCoord3D as #fetchCoord3D
 * @borrows Kekule.ClassDefineUtils.Coord3DMethods#hasCoord2D as #hasCoord3D
 * @borrows Kekule.ClassDefineUtils.Coord3DMethods#get3DX as #get3DX
 * @borrows Kekule.ClassDefineUtils.Coord3DMethods#set3DX as #set3DX
 * @borrows Kekule.ClassDefineUtils.Coord3DMethods#get3DY as #get3DY
 * @borrows Kekule.ClassDefineUtils.Coord3DMethods#set3DY as #set3DY
 * @borrows Kekule.ClassDefineUtils.Coord3DMethods#get3DZ as #get3DZ
 * @borrows Kekule.ClassDefineUtils.Coord3DMethods#set3DZ as #set3DZ
 */
Kekule.BaseStructureNode = Class.create(Kekule.ChemStructureObject,
/** @lends Kekule.BaseStructureNode# */
{
	/** @private */
	CLASS_NAME: 'Kekule.BaseStructureNode',
	/**
	 * @constructs
	 */
	initialize: function($super, id, coord2D, coord3D)
	{
		$super(id);
		if (coord2D)
			this.setCoord2D(coord2D);
		if (coord3D)
			this.setCoord3D(coord3D);
	},
	initProperties: function()
	{
		this.defineProp('zIndex2D', {'dataType': DataType.INT, 'scope': Class.PropertyScope.PUBLISHED});
	},
	/** @ignore */
	getStructureRelatedPropNames: function($super)
	{
		return $super().concat(['coord2D', 'coord3D']);
	},
	/** @private */
	getAutoIdPrefix: function()
	{
		return 'n';
	},
	/**
	 * Calculate the box to contain the object.
	 * Descendants may override this method.
	 * @param {Int} coordMode Determine to calculate 2D or 3D box. Value from {@link Kekule.CoordMode}.
	 * @param {Bool} allowCoordBorrow
	 * @returns {Hash} Box information. {x1, y1, z1, x2, y2, z2} (in 2D mode z1 and z2 will not be set).
	 */
	getContainerBox: function(coordMode, allowCoordBorrow)
	{
		var coord = this.getAbsCoordOfMode(coordMode, allowCoordBorrow);
		return Kekule.BoxUtils.createBox(coord, coord);
	},
	/**
	 * Calculate the 2D box to contain the object.
	 * @param {Bool} allowCoordBorrow
	 * @returns {Hash} Box information. {x1, y1, z1, x2, y2, z2} (in 2D mode z1 and z2 will not be set).
	 */
	getContainerBox2D: function(allowCoordBorrow)
	{
		return this.getContainerBox(Kekule.CoordMode.COORD2D, allowCoordBorrow);
	},
	/**
	 * Calculate the 3D box to contain the object.
	 * @param {Bool} allowCoordBorrow
	 * @returns {Hash} Box information. {x1, y1, z1, x2, y2, z2} (in 2D mode z1 and z2 will not be set).
	 */
	getContainerBox3D: function(allowCoordBorrow)
	{
		return this.getContainerBox(Kekule.CoordMode.COORD3D, allowCoordBorrow);
	}
});
Kekule.ClassDefineUtils.addStandardCoordSupport(Kekule.BaseStructureNode);

/**
 * Enumeration of stereo parity of node or connector.
 * @enum
 */
Kekule.StereoParity = {
	NONE: null,
	ODD: 1,
	EVEN: 2,
	UNKNOWN: 0
};

/**
 * Represent an abstract structure node (atom, atom group, etc.).
 * @class
 * @augments Kekule.BaseStructureNode
 * @param {String} id Id of this node.
 * @param {Hash} coord2D The 2D coordinates of node, {x, y}, can be null.
 * @param {Hash} coord3D The 3D coordinates of node, {x, y, z}, can be null.
 *
 * @property {Float} charge Charge of atom. As there may be partial charge on atom, so a float value is used.
 * @property {Int} radical Radical state of node, value should from {@link Kekule.RadicalType}.
 * @property {Int} parity Stereo parity of node if the node is a chiral one, following the MDL convention.
 * @property {Array} linkedChemNodes Neighbor nodes linked to this node through proper connectors.
 * @property {Bool} isAnchor Whether this node is among anchors in parent structure.
 */
Kekule.ChemStructureNode = Class.create(Kekule.BaseStructureNode,
/** @lends Kekule.ChemStructureNode# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemStructureNode',
	/**
	 * @constructs
	 */
	initialize: function($super, id, coord2D, coord3D)
	{
		$super(id);
		if (coord2D)
			this.setCoord2D(coord2D);
		if (coord3D)
			this.setCoord3D(coord3D);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('charge', {'dataType': DataType.FLOAT,
			'getter': function() { return this.getPropStoreFieldValue('charge') || 0; }
		});
		this.defineProp('radical', {'dataType': DataType.INT});
		this.defineProp('parity', {'dataType': DataType.INT});
		this.defineProp('isAnchor', {'dataType': DataType.BOOL, 'serializable': false,
			'getter': function()
			{
				var p = this.getParent();
				if (p && p.indexOfAnchorNode)
					return p.indexOfAnchorNode(this) >= 0;
				else
					return false;
			},
			'setter': function(value)
			{
				if (value !== this.getIsAnchor())
				{
					var p = this.getParent();
					if (p)
					{
						if (value && p.appendAnchorNode())
							p.appendAnchorNode(this);
						else if (!value && p.removeAnchorNode)
							p.removeAnchorNode(this);
					}
				}
			}
		});
	},
	/** @ignore */
	getStructureRelatedPropNames: function($super)
	{
		return $super().concat(['charge', 'radical']);
	},
	/**
	 * Returns a label that represents current node.
	 * Desendants should override this method.
	 * @returns {String}
	 */
	getLabel: function()
	{
		return null;
	},

	/** @ignore */
	doGetComparisonPropNames: function($super, options)
	{
		var result = $super(options);
		if (options.method === Kekule.ComparisonMethod.CHEM_STRUCTURE)
		{
			if (this._getComparisonOptionFlagValue(options, 'charge'))
				result.push('charge');
			if (this._getComparisonOptionFlagValue(options, 'radical'))
				result.push('radical');
			/*
			if (this._getComparisonOptionFlagValue(options, 'stereo'))
				result.push('parity');
			*/
		}
		return result;
	},
	/** @ignore */
	doCompare: function($super, targetObj, options)
	{
		var result = $super(targetObj, options);
		if (!result && options.method === Kekule.ComparisonMethod.CHEM_STRUCTURE)  // can not find different in $super
		{
			if (this._getComparisonOptionFlagValue(options, 'stereo'))  // parity null/0 should be regard as one in comparison
			{
				var c1 = this.getParity() || Kekule.StereoParity.UNKNOWN;
				var c2 = (targetObj.getParity && targetObj.getParity()) || Kekule.StereoParity.UNKNOWN;
				result = this.doCompareOnValue(c1, c2, options);
			}
		}
		return result;
	},

	/**
	 * Returns the most possible isotope of node.
	 * To {@link Kekule.Atom}, this should be simplely the isotope of atom
	 * while variable atom or pseudoatom may has its own implementation.
	 * This method returns null if isotope is uncertain to this node.
	 * Descendants need to override this method.
	 * @returns {Kekule.Isotope}
	 */
	getPrimaryIsotope: function()
	{
		return null;
	},
	/**
	 * Returns neighbor nodes linked to this node through proper connectors.
	 * @param {Bool} ignoreHydrogenAtoms Whether explicit hydrogen atoms are returned. Default is false.
	 * @return {Array}
	 */
	getLinkedChemNodes: function(ignoreHydrogenAtoms)
	{
		var linkedObjs = this.getLinkedObjs();
		var result = [];
		for (var i = 0, l = linkedObjs.length; i < l; ++i)
		{
			var obj = linkedObjs[i];
			if (obj instanceof Kekule.ChemStructureNode && (!ignoreHydrogenAtoms || !obj.isHydrogenAtom || !obj.isHydrogenAtom()))
				result.push(obj);
		}
		return result;
	},
	/**
	 * Returns linked instances of {@link Kekule.Bond} to this node.
	 * @param {Int} bondType
	 * @returns {Array}
	 */
	getLinkedBonds: function(bondType)
	{
		var result = [];
		for (var i = 0, l = this.getLinkedConnectorCount(); i < l; ++i)
		{
			var c = this.getLinkedConnectorAt(i);
			if ((c instanceof Kekule.Bond) && (!bondType || c.getBondType() === bondType))
				result.push(c);
		}
		return result;
	},
	/**
	 * Returns linked multiple covalent bond to this node.
	 * @returns {Array}
	 */
	getLinkedMultipleBonds: function()
	{
		var BO = Kekule.BondOrder;
		var result = [];
		for (var i = 0, l = this.getLinkedConnectorCount(); i < l; ++i)
		{
			var c = this.getLinkedConnectorAt(i);
			if ((c instanceof Kekule.Bond) && (c.getBondType() === Kekule.BondType.COVALENT))
			{
				var bondOrder = c.getBondOrder();
				if ((bondOrder === BO.DOUBLE) || (bondOrder === BO.TRIPLE) || (bondOrder === BO.QUAD) || (bondOrder === BO.EXPLICIT_AROMATIC))
					result.push(c);
			}
		}
		return result;
	},
	/**
	 * Returns linked double covalent bond to this node.
	 * @returns {Array}
	 */
	getLinkedDoubleBonds: function()
	{
		var BO = Kekule.BondOrder;
		var result = [];
		for (var i = 0, l = this.getLinkedConnectorCount(); i < l; ++i)
		{
			var c = this.getLinkedConnectorAt(i);
			if ((c instanceof Kekule.Bond) && (c.getBondType() === Kekule.BondType.COVALENT))
			{
				var bondOrder = c.getBondOrder();
				if (bondOrder === BO.DOUBLE)
					result.push(c);
			}
		}
		return result;
	},

	/** @ignore */
	clearStructureFlags: function()
	{
		//this.setParity(Kekule.StereoParity.NONE);
		this.setPropStoreFieldValue('parity', Kekule.StereoParity.NONE);  // avoid invoke change event
	},

	/**
	 * Returns whether this node is a H atom (but not D or T).
	 * @returns {Bool}
	 */
	isHydrogenAtom: function()
	{
		return false;
	}
});


Kekule.RadicalType = {
	NONE: 0,
	SINGLET: 1,
	DOUBLET: 2,
	TRIPLET: 3
};

/**
 * Represent an abstract atom, parent for dummy atom, concrete atom or variable atom.
 * @class
 * @augments Kekule.ChemStructureNode
 * @param {String} id Id of this node.
 * @param {Object} coord2D The 2D coordinates of node, {x, y}, can be null.
 * @param {Object} coord3D The 3D coordinates of node, {x, y, z}, can be null.
 *
 * @property {Int} explicitHydrogenCount Explicit hydrogen count on atom.
 */
Kekule.AbstractAtom = Class.create(Kekule.ChemStructureNode,
/** @lends Kekule.AbstractAtom# */
{
	/** @private */
	CLASS_NAME: 'Kekule.AbstractAtom',
	/**
	 * @constructs
	 */
	initialize: function($super, id, coord2D, coord3D)
	{
		$super(id, coord2D, coord3D);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('explicitHydrogenCount', {'dataType': DataType.INT});
	},
	/** @private */
	getAutoIdPrefix: function()
	{
		return 'a';
	},
	/** @ignore */
	getStructureRelatedPropNames: function($super)
	{
		return $super().concat(['explicitHydrogenCount']);
	},

	/** @ignore */
	doCompare: function($super, targetObj, options)
	{
		var result = $super(targetObj, options);
		if (!result && options.method === Kekule.ComparisonMethod.CHEM_STRUCTURE)
		{
			if (this._getComparisonOptionFlagValue(options, 'hydrogenCount'))
			{
				var c1 = this.getHydrogenCount(true);
				var c2 = targetObj.getHydrogenCount && targetObj.getHydrogenCount(true);
				result = this.doCompareOnValue(c1, c2, options);
			}
		}
		return result;
	},

	/**
	 * Returns hydrogen count linked to this atom.
	 * Same as getExplicitHydrogenCount if includingBondedHydrogen is false.
	 * @param {Bool} includingBondedHydrogen If true, hydrogen siblings will also be take into consideration.
	 */
	getHydrogenCount: function(includingBondedHydrogen)
	{
		var result = this.getExplicitHydrogenCount() || 0;
		if (includingBondedHydrogen)
		{
			var hatoms = this.getLinkedHydrogenAtoms();
			result += hatoms.length || 0;
		}
		return result;
	},
	/**
	 * Same as setExplicitHydrogenCount.
	 * @param {Int} value
	 */
	setHydrogenCount: function(value)
	{
		return this.setExplicitHydrogenCount(value);
	},

	/**
	 * Returns whether this atom is a saturated one.
	 * @returns {Bool}
	 */
	isSaturated: function()
	{
		return !this.getLinkedMultipleBonds().length;
	},

	/**
	 * Returns when this node is an atom of certain element or
	 * maybe or may include element (peusdo atom or atom list).
	 * @param {Variant} atomicNumberOrSymbol
	 * @returns {Bool}
	 */
	mayContainElement: function(atomicNumberOrSymbol)
	{
		var num;
		if (typeof(atomicNumberOrSymbol) === 'string')  // symbol
			num = Kekule.ChemicalElementsDataUtil.getAtomicNumber(atomicNumberOrSymbol);
		else
			num = atomicNumberOrSymbol;
		return this.doMayContainElement(num);
	},
	/**
	 * Do actual judge of method mayContainElement. Descendants need to override this method.
	 * @param {Int} atomicNum
	 * @returns {Bool}
	 */
	doMayContainElement: function(atomicNum)
	{
		return false;
	}
});

/**
 * Represent an atom in chemical structure.
 * @class
 * @augments Kekule.AbstractAtom
 * @param {String} id Id of this node.
 * @param {Variant} elemSymbolOrAtomicNumber Element symbol (String) or atomic number (Int) of atom.
 * @param {Int} massNumber Isotope mass number of atom, can be null.
 * @param {Object} coord2D The 2D coordinates of node, {x, y}, can be null.
 * @param {Object} coord3D The 3D coordinates of node, {x, y, z}, can be null.
 *
 * @property {Kekule.Isotope} isotope The isotope and element of atom.
 * @property {String} symbol The element symbol of atom.
 * @property {Int} atomicNumber The atomic number symbol of atom.
 * @property {Int} massNumber The isotope mass number symbol of atom.
 * @property {Hash} atomType The type if this atom, data is read from {@link kekule.structGenAtomTypesData.js}.
 *   Undefined or null means uncertain type.
 * @property {Int} hybridizationType Hybridization type (sp/sp2/sp3) of atom Undefined or null means uncertain type.
 */
Kekule.Atom = Class.create(Kekule.AbstractAtom,
/** @lends Kekule.Atom# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Atom',
	/**
	 * @constructs
	 */
	initialize: function($super, id, elemSymbolOrAtomicNumber, massNumber, coord2D, coord3D)
	{
		$super(id, coord2D, coord3D);
		if (elemSymbolOrAtomicNumber || massNumber)
			this.changeIsotope(elemSymbolOrAtomicNumber, massNumber);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('isotope', {'dataType': 'Kekule.Isotope', 'serializable': false});
		this.defineProp('isotopeId', {
			'dataType': DataType.STRING,
			'serializable': true,
			'getter': function()
				{
					var i = this.getIsotope();
					return i? i.getIsotopeId(): Kekule.Element.UNSET_ELEMENT;
				},
			'setter': function(value)
				{
					var newIsotope = Kekule.IsotopeFactory.getIsotopeById(value);
					//this.changeElement(value);
					if (newIsotope)
						this.setIsotope(newIsotope);
				}
		});
		this.defineProp('symbol', {
			'dataType': DataType.STRING,
			'serializable': false,
			'getter': function()
				{
					var i = this.getIsotope();
					var result = i? i.getSymbol(): Kekule.Element.UNSET_ELEMENT;
					return result;
				},
			'setter': function(value) { this.changeElement(value); }
		});
		this.defineProp('atomicNumber', {
			'dataType': DataType.INTEGER,
			'serializable': false,
			'getter': function()
				{
					var i = this.getIsotope();
					return i? i.getAtomicNumber(): 0;
				},
			'setter': function(value)
				{
					this.changeElement(value);
				}
		});
		this.defineProp('massNumber', {
			'dataType': DataType.INTEGER,
			'getter': function()
				{
					var i = this.getIsotope();
					return i? i.getMassNumber(): Kekule.Isotope.UNSET_MASSNUMBER;
				},
			'setter': function(value)
				{
					this.changeMassNumber(value);
				}
		});
		this.defineProp('isotopeAlias', {
			'dataType': DataType.STRING,
			'getter': function()
			{
				var i = this.getIsotope();
				return i? i.getIsotopeAlias(): undefined;
			},
			'setter': function(value)
			{
				this.changeElement(value);
			}
		});
		this.defineProp('atomType', {
			'dataType': DataType.OBJECT,
			'serializable': false,
			'scope': Class.PropertyScope.PUBLIC
			/*,
			'getter': function()
				{
					var result = this.getPropStoreFieldValue('atomType');
					return result? result: this.guessAtomType();
				}*/
		});
		// a property for persistent atomType, should not use it directly
		this.defineProp('atomTypeId', {
			'dataType': DataType.STRING,
			'getter': function()
				{
					var atype = this.getPropStoreFieldValue('atomType');
					return atype? atype.id: Kekule.AtomType.UNSET_ATOMTYPE;
				},
			'setter': function(value)
				{
					if (this.isNormalAtom())
					{
						var atype = Kekule.AtomTypeDataUtil.getAtomTypeFromId(this.getAtomicNumber(), value);
						this.setAtomType(atype);
					}
				}
		});
		this.defineProp('hybridizationType', {'dataType': DataType.INT, 'enumSource': Kekule.HybridizationType});
	},
	/** @private */
	getAutoIdPrefix: function()
	{
		return 'a';
	},
	/** @ignore */
	getStructureRelatedPropNames: function($super)
	{
		return $super().concat(['isotope', 'atomType']);
	},

	/** @ignore */
	doGetComparisonPropNames: function($super, options)
	{
		var result = $super(options);
		if (options.method === Kekule.ComparisonMethod.CHEM_STRUCTURE)
		{
			if (this._getComparisonOptionFlagValue(options, 'atom'))
				result.push('atomicNumber');
			if (this._getComparisonOptionFlagValue(options, 'mass'))
				result.push('massNumber');
		}
		return result;
	},

	/** @ignore */
	getPrimaryIsotope: function()
	{
		return this.getIsotope();
	},
	/** @ignore */
	getLabel: function()
	{
		return '' + (this.getMassNumber() || '') + this.getSymbol();
	},
	/** @ignore */
	doMayContainElement: function(atomicNum)
	{
		return this.getAtomicNumber() === atomicNum;
	},

	/**
	 * Change atom isotope to new symbol / atmoic number or new mass number
	 * @param {Variant} symbolOrAtomicNumber Symbol(String) or atomic number(Int) of element.
	 *   If undefined is assigned, the old atomic number will be used.
	 * @param {Int} massNumber Mass number of isotope.
	 */
	changeIsotope: function(symbolOrAtomicNumber, massNumber)
	{
		if (symbolOrAtomicNumber === Kekule.Element.UNSET_ELEMENT)
			massNumber = Kekule.Isotope.UNSET_MASSNUMBER;
		else if (!symbolOrAtomicNumber)
			symbolOrAtomicNumber = this.getAtomicNumber();

		if (!massNumber)
			massNumber = Kekule.Isotope.UNSET_MASSNUMBER;

		if (this.getAtomicNumber() !== symbolOrAtomicNumber)  // element change
			this.setAtomType(Kekule.AtomType.UNSET_ATOMTYPE);

		var isotope = Kekule.IsotopeFactory.getIsotope(symbolOrAtomicNumber, massNumber);
		//this.setPropStoreFieldValue('isotope', isotope);
		this.setIsotope(isotope);
	},
	/**
	 * Change atom isotope to new symbol / atmoic number
	 * @param {Variant} symbolOrAtomicNumber Symbol(String) or atomic number(Int) of element.
	 */
	changeElement: function(symbolOrAtomicNumber)
	{
		return this.changeIsotope(symbolOrAtomicNumber, Kekule.Isotope.UNSET_MASSNUMBER);
	},
	/**
	 * Change atom mass number. The element will remains the same.
	 * @param {Int} massNumber Mass number of isotope.
	 */
	changeMassNumber: function(massNumber)
	{
		return this.changeIsotope(null, massNumber);
	},

	/**
	 * Check if current atom is a certain element.
	 * @param {Variant} symbolOrAtomicNumber Symbol(String) or atomic number(Int) of element.
	 */
	isElement: function(symbolOrAtomicNumber)
	{
		return (this.getSymbol() === symbolOrAtomicNumber) || (this.getAtomicNumber() === symbolOrAtomicNumber);
	},

	/**
	 * Check if this is a normal atom (not a pseudo one or unset one)
	 */
	isNormalAtom: function()
	{
		var isotope = this.getIsotope();
		return isotope? isotope.isNormalElement(): false;
	},

	/** @ignore */
	isHydrogenAtom: function()
	{
		return this.isElement(1) && (!this.getMassNumber() || this.getMassNumber() <= 1);
	},

	/** @private */
	_getCurrCovalentBondsInfo: function()
	{
		var valenceSum = 0;
		var maxValence = 0;
		for (var i = 0, l = this.getLinkedConnectorCount(); i < l; ++i)
		{
			var connector = this.getLinkedConnectorAt(i);
			// check if connector is a covalance bond
			if ((connector instanceof Kekule.Bond)
				&& (connector.getBondType() == Kekule.BondType.COVALENT))
			{
				var v = connector.getBondValence();
				valenceSum += v;
				if (v > maxValence)
					maxValence = v;
			}
		}
		return {'valenceSum': valenceSum, 'maxValence': maxValence};
	},
	/** @private */
	_getCurrIonicBondsInfo: function()
	{
		var valenceSum = 0;
		var maxValence = 0;
		for (var i = 0, l = this.getLinkedConnectorCount(); i < l; ++i)
		{
			var connector = this.getLinkedConnectorAt(i);
			// check if connector is a covalance bond
			if ((connector instanceof Kekule.Bond)
					&& (connector.getBondType() == Kekule.BondType.IONIC))
			{
				var v = connector.getBondValence();
				valenceSum += v;
				if (v > maxValence)
					maxValence = v;
			}
		}
		return {'valenceSum': valenceSum, 'maxValence': maxValence};
	},

	/**
	 * If the atomType property is not set explicitly, use this function to guess the atom type.
	 * returns {Object} Atom type JSON object from {@link kekule.structGenAtomTypesData.js}
	 */
	guessAtomType: function()
	{
		if (this.isNormalAtom())
		{
			var possible = null, fallback = null;
			// get current bond order sum first
			var bondsInfo = this._getCurrCovalentBondsInfo();
			// all possible atom types
			var atomTypes = Kekule.AtomTypeDataUtil.getAllAtomTypes(this.getAtomicNumber());
			// as we already know that the atomTypes are sorted by bondOrderSum / maxBondOrder
			if (atomTypes)
			{
				for (var i = 0, l = atomTypes.length; i < l; ++i)
				{
					var atomType = atomTypes[i];
					fallback = atomType;
					if (atomType.bondOrderSum >= bondsInfo.valenceSum)
					{
						possible = atomType;
						if (atomType.maxBondOrder >= bondsInfo.maxValence)
						{
							return atomType;
						}
					}
				}
				// not found a suitable one
				return possible ? possible : fallback;
			}
		}
		return null;
	},

	/**
	 * Returns explicit atom type when property {@link Kekule.Atom@atomType} is set, or a guessed atom type.
	 * @returns {Hash}  Atom type JSON object from {@link kekule.structGenAtomTypesData.js}
	 */
	getProximalAtomType: function()
	{
		return this.getAtomType() || this.guessAtomType();
	},

	/**
	 * Guess and returns the implicit valence of atom.
	 */
	getImplicitValence: function()
	{
		if (this.isNormalAtom())
		{
			var bondsInfo = this._getCurrCovalentBondsInfo();
			var expValence = bondsInfo.valenceSum;
			var charge = Math.round(this.getCharge() || 0);

			var result = Kekule.ValenceUtils.getImplicitValence(this.getAtomicNumber(), charge, expValence);

			return result;
		}
		else
			return 0;
	},

	/**
	 * If {@link Kekule.Atom#explicitHydrogenCount} is not set, use this function to retrieve count implicit hydrogens.
	 * @returns {Int} Implicit hydrogen count.
	 */
	getImplicitHydrogenCount: function()
	{
		if (this.isNormalAtom())
		{
			//if (Kekule.ObjUtils.isUnset(this.getExplicitHydrogenCount()))
			{
				var coValentBondsInfo = this._getCurrCovalentBondsInfo();
				var ionicBondsInfo = this._getCurrIonicBondsInfo();
				/*
				var atype = this.getProximalAtomType();
				var valence = atype? atype.bondOrderSum: 0;
				var charge = Math.round(this.getCharge() || 0);
				*/
				var valence = this.getImplicitValence();

				// adjust with radical
				var radical = Kekule.RadicalOrder.getRadicalElectronCount(this.getRadical());
				valence -= radical;

				// DONE: some atoms such as C should be treat differently, as C+ can only link 3 bonds
				return Math.max(valence - coValentBondsInfo.valenceSum - ionicBondsInfo.valenceSum /* + charge */, 0);
			}
		}
		else
			return 0;
	},

	/**
	 * If explicitHydrogenCount is set, returns it, else returns implicit hydrogen count.
	 * @param {Bool} includingBondedHydrogen
	 */
	getHydrogenCount: function(includingBondedHydrogen)
	{
		var result;
		if (Kekule.ObjUtils.isUnset(this.getExplicitHydrogenCount()))
			result = this.getImplicitHydrogenCount() || 0;
		else
			result = this.getExplicitHydrogenCount() || 0;
		if (includingBondedHydrogen)
			result += this.getLinkedHydrogenAtoms().length || 0;
		return result;
	},
	/**
	 * Returns exact mass of current atom.
	 * @returns {Float}
	 */
	getAtomicMass: function()
	{
		var result = null;
		var isotope = this.getIsotope();
		if (isotope)
		{
			result = isotope.getExactMass() || isotope.getNaturalMass();
		}
		return result;
	}
});

/**
 * Enumeration of unreal atom types.
 * @class
 */
Kekule.PseudoatomType = {
	/** A dummy atom. */
	DUMMY: 'dummy',
	/** Unspecific atom. */
	ANY: 'any',
	/** Non C/H atom. */
	HETERO: 'hetero',
	/** User custom symbol */
	CUSTOM: 'custom'
};

/**
 * Represent an unreal atom, such as dummy atom (A point or object with no chemical semantics), a "any atom" and so on.
 * Examples can be centroids, bond-midpoints, orienting "atoms" in small z-matrices.
 * @class
 * @augments Kekule.AbstractAtom
 * @param {String} id Id of this node.
 * @param {String} atomType Unreal atom type, value from {@link Kekule.PseudoatomType}.
 * @param {Object} coord2D The 2D coordinates of node, {x, y}, can be null.
 * @param {Object} coord3D The 3D coordinates of node, {x, y, z}, can be null.
 *
 * @property {String} atomType Unreal atom type, value from {@link Kekule.PseudoatomType}.
 * @property {String} symbol User custom symbol. Meanless if atomType != Kekule.PseudoatomType.CUSTOM.
 */
Kekule.Pseudoatom = Class.create(Kekule.AbstractAtom,
/** @lends Kekule.Pseudoatom# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Pseudoatom',
	/** @constructs */
	initialize: function($super, id, atomType, symbol, coord2D, coord3D)
	{
		$super(id, coord2D, coord3D);
		if (atomType)
			this.setAtomType(atomType);
		if (symbol && (atomType == Kekule.PseudoatomType.CUSTOM))
			this.setSymbol(symbol);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('atomType', {'dataType': DataType.STRING, 'enumSource': Kekule.PseudoatomType});
		this.defineProp('symbol', {'dataType': DataType.STRING,
			'getter': function()
			{
				var t = this.getAtomType();
				var PT = Kekule.PseudoatomType;
				var NL = Kekule.ChemStructureNodeLabels;
				return (t === PT.DUMMY)? NL.DUMMY_ATOM:
					(t === PT.ANY)? NL.ANY_ATOM:
					(t === PT.HETERO)? NL.HETERO_ATOM:
					this.getPropStoreFieldValue('symbol') || NL.CUSTOM_ATOM;
			},
			'setter': function(value)
			{
				var PT = Kekule.PseudoatomType;
				var NL = Kekule.ChemStructureNodeLabels;
				if (value)
				{
					var t = (value === NL.DUMMY_ATOM) ? PT.DUMMY :
						(value === NL.ANY_ATOM) ? PT.ANY :
						(value === NL.HETERO_ATOM) ? PT.HETERO :
						PT.CUSTOM;
					this.setAtomType(t);
				}
				this.setPropStoreFieldValue('symbol', value);
			}
		});
	},
	/** @ignore */
	getStructureRelatedPropNames: function($super)
	{
		return $super().concat(['atomType', 'symbol']);
	},
	/** @ignore */
	getPrimaryIsotope: function()
	{
		return null;
	},
	/** @ignore */
	getLabel: function()
	{
		return this.getSymbol();
	},

	/** @ignore */
	doGetComparisonPropNames: function($super, options)
	{
		var result = $super(options);
		if (options.method === Kekule.ComparisonMethod.CHEM_STRUCTURE)
		{
			if (this._getComparisonOptionFlagValue(options, 'atom'))
				result.push('atomType');
		}
		return result;
	},
	/** @ignore */
	doCompare: function($super, targetObj, options)
	{
		var result = $super(targetObj, options);
		if (!result && options.method === Kekule.ComparisonMethod.CHEM_STRUCTURE)
		{
			if (this._getComparisonOptionFlagValue(options, 'atom'))
			{
				if (this.getAtomType() === Kekule.PseudoatomType.CUSTOM)  // custom pseudo atom, need to check symbol further
				{
					var v1 = this.getSymbol();
					var v2 = targetObj.getSymbol && targetObj.getSymbol();
					result = this.doCompareOnValue(v1, v2, options);
				}
			}
		}
		return result;
	},

	/** @ignore */
	doMayContainElement: function(atomicNum)
	{
		var PT = Kekule.PseudoatomType;
		var t = this.getAtomType();
		if (t === PT.ANY)
			return true;
		else if (t === PT.HETERO)
		{
			if ([1, 6].indexOf(atomicNum) >= 0)  // C/H not hetero
				return false;
			else
			{
				var elemInfo = Kekule.ChemicalElementsDataUtil.getElementInfo(atomicNum);
				return (eleminfo.chemicalSerie === "Nonmetals");
			}
		}
		else // dummy or custom
			return false;
	}
});

/**
 * Represent an variable atom,  In this type of atom, element/isotope can be one of a range.
 *   (such as atomlist in MDL CTAB).
 *
 * @class
 * @augments Kekule.AbstractAtom
 * @param {String} id Id of this node.
 * @param {Object} coord2D The 2D coordinates of node, {x, y}, can be null.
 * @param {Object} coord3D The 3D coordinates of node, {x, y, z}, can be null.
 *
 * @property {Array} allowedIsotopeIds Atom isotope may vary in this array.
 * @property {Array} disallowedIsotopeIds Atom isotope must not in the array.
 *   if {@link Kekule.VariableAtom#allowedIsotopeIds} is set, this property is ignored.
 */
Kekule.VariableAtom = Class.create(Kekule.AbstractAtom,
/** @lends Kekule.VariableAtom# */
{
	/** @private */
	CLASS_NAME: 'Kekule.VariableAtom',
	/** @private */
	initProperties: function()
	{
		this.defineProp('allowedIsotopeIds', {
			'dataType': DataType.ARRAY,
			'getter': function(canCreate)
				{
					var r = this.getPropStoreFieldValue('allowedIsotopeIds');
					if ((!r) && canCreate)
					{
						r = [];
						this.setPropStoreFieldValue('allowedIsotopeIds', r);
					}
					return r;
				}
		});
		this.defineProp('disallowedIsotopeIds', {
			'dataType': DataType.ARRAY,
			'getter': function(canCreate)
				{
					var r = this.getPropStoreFieldValue('disallowedIsotopeIds');
					if ((!r) && canCreate)
					{
						r = [];
						this.setPropStoreFieldValue('disallowedIsotopeIds', r);
					}
					return r;
				}
		});
		this.defineProp('allowedIsotopes', {
			'dataType': DataType.ARRAY,
			'setter': null,
			'getter': function()
			{
				return this._getIsotopesFromIds(this.getAllowedIsotopeIds());
			}
		});
		this.defineProp('disallowedIsotopes', {
			'dataType': DataType.ARRAY,
			'setter': null,
			'getter': function()
			{
				return this._getIsotopesFromIds(this.getDisallowedIsotopeIds());
			}
		});
	},
	/** @ignore */
	getStructureRelatedPropNames: function($super)
	{
		return $super().concat(['allowedIsotopeIds', 'disallowedIsotopeIds']);
	},

	/** @ignore */
	getPrimaryIsotope: function()
	{
		if (this.isDisallowedList())
			return null;
		else
		{
			var ids = this.getAllowedIsotopeIds();
			var id = ids? ids[0]: null;
			return id? Kekule.IsotopeFactory.getIsotopeById(id): null;
		}
	},
	/** @ignore */
	getLabel: function()
	{
		return Kekule.ChemStructureNodeLabels.VARIABLE_ATOM;
	},

	/** @ignore */
	doCompare: function($super, targetObj, options)
	{
		var result = $super(targetObj, options);
		if (!result && options.method === Kekule.ComparisonMethod.CHEM_STRUCTURE)
		{
			if (this._getComparisonOptionFlagValue(options, 'atom'))
			{
				var AU = Kekule.ArrayUtils;
				var allowedIds1 = this.getAllowedIsotopeIds();
				var allowedIds2 = targetObj.getAllowedIsotopeIds && targetObj.getAllowedIsotopeIds();
				if (allowedIds1)  // allowed will override disallowed
				{
					allowedIds1 = AU.clone(allowedIds1).sort();
					if (allowedIds2 && allowedIds2.length)
						allowedIds2 = AU.clone(allowedIds2).sort();
					result = this.doCompareOnValue(allowedIds1, allowedIds2, options);
				}
				else  // consider disallowed
				{
					if (allowedIds2)  // target use allowed list
						result = 1;
					else
					{
						var disallowedIds1 = this.getDisallowedIsotopeIds();
						var disallowedIds2 = targetObj.getDisallowedIsotopeIds && targetObj.getDisallowedIsotopeIds();
						if (disallowedIds1 && disallowedIds1.length)
							disallowedIds1 = AU.clone(disallowedIds1).sort();
						if (disallowedIds2 && disallowedIds2.length)
							disallowedIds2 = AU.clone(disallowedIds2).sort();
						result = this.doCompareOnValue(disallowedIds1, disallowedIds2, options);
					}
				}
			}
		}
		return result;
	},

	/** @ignore */
	doMayContainElement: function(atomicNum)
	{
		var atomicNumInIds = function(atomicNum, ids)
		{
			if (!ids)
				return false;
			for (var i = 0, l = ids.length; i < l; ++i)
			{
				var id = ids[i];
				var d = Kekule.IsotopesDataUtil.getIsotopeIdDetail(id);
				var symbol = d.symbol;
				var num = Kekule.ChemicalElementsDataUtil.getAtomicNumber(symbol);
				if (num === atomicNum)
					return true;
			}
			return false;
		};
		var isotopeIds = this.getAllowedIsotopeIds();
		if (isotopeIds)
		{
			return atomicNumInIds(atomicNum, isotopeIds);
		}
		else
		{
			isotopeIds = this.getDisallowedIsotopeIds();
			if (isotopeIds)
				return !atomicNumInIds(atomicNum, isotopeIds);
		}
	},

	/**
	 * Check whether this list has disallowedIsotopeIds instead of allowedIsotopeIds.
	 * @returns {Bool}
	 */
	isDisallowedList: function()
	{
		return this.getDisallowedIsotopeIds() && (!this.getAllowedIsotopeIds());
	},
	/**
	 * Check if neither allowed list nor disallowed list is set.
	 */
	isListEmpty: function()
	{
		var list = this.getAllowedIsotopeIds();
		var result = !list || !list.length;
		if (result)
		{
			list = this.getDisallowedIsotopeIds();
			result = !list || !list.length;
		}
		return result;
	},

	/**
	 * Get allowedIsotopeIds array, if null, create a new array
	 * @returns {Array}
	 */
	fetchAllowedIsotopeIds: function()
	{
		return this.doGetAllowedIsotopeIds(true);
	},
	/**
	 * Get disallowedIsotopeIds array, if null, create a new array
	 * @returns {Array}
	 */
	fetchDisallowedIsotopeIds: function()
	{
		return this.doGetDisallowedIsotopeIds(true);
	},

	/** @private */
	_getIsotopesFromIds: function(ids)
	{
		if (!ids)
			return null;
		var result = [];
		for (var i = 0, l = ids.length; i < l; ++i)
		{
			var id = ids[i];
			var isotope = Kekule.IsotopeFactory.getIsotopeById(id);
			if (isotope)
				result.push(isotope);
		}
		return result;
	}
});

/**
 * A formula for representing a simple (especially inorganic) molecule or group.
 * @class
 * @augments ObjectEx
 * @param {Kekule.StructureFragment} parent Parent to hold this formula.
 *
 * @property {Kekule.StructureFragment} parent Parent to hold this Ctab. Read only.
 * @property {Float} charge Formal charge of this molecular.
 *   This charge is not on a certain atom but deployed in the whole formula.
 * @property {Int} radical Value from {@link Kekule.RadicalOrder}, radical state of this formula.
 *   Seldom used in formula.
 * @property {Array} sections Array of atom or sub formula maps in this formula.
 *   [{'obj': atom, 'count': count}, {'obj': subFormula, 'count': count}, ...]
 *   (charge is stored in atom or subFormula).
 *   where atom is a {@link Kekule.AbstractAtom} and subFormula is an instance of {@link Kekule.MolecularFormula}.
 *   For instance, [Cu(NH3)4]2+ SO42-] can be divided into two sub formulas: [Cu(NH3)4]2+ and SO42-,
 *   and [Cu(NH3)4]2+ can be further divided into two sub ones: Cu2+ and NH3
 */
Kekule.MolecularFormula = Class.create(ObjectEx,
/** @lends Kekule.MolecularFormula# */
{
	/** @private */
	CLASS_NAME: 'Kekule.MolecularFormula',
	/**
	 * @constructs
	 */
	initialize: function($super, parent)
	{
		$super();
		this.setPropStoreFieldValue('sections', []);
		if (parent)
			this.setPropStoreFieldValue('parent', parent);
		this.setBubbleEvent(true);  // allow event bubble
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('parent', {
			'dataType': 'Kekule.StructureFragment', 'serializable': false, 'setter': null,
			'scope': Class.PropertyScope.PUBLIC
		});
		this.defineProp('sections', {'dataType': DataType.ARRAY, 'setter': null});
		this.defineProp('charge', {'dataType': DataType.FLOAT, 'getter': function() { return this.getPropStoreFieldValue('charge') || 0; } });
		this.defineProp('radical', {'dataType': DataType.INT, 'getter': function() { return this.getPropStoreFieldValue('radical') || 0; } });
	},
	/** @private */
	getHigherLevelObj: function()
	{
		return this.getParent();
	},
	/**
	 * Check if this formula contains no data.
	 * @returns {Bool}
	 */
	isEmpty: function()
	{
		return this.getSectionCount() <= 0;
	},

	/** @private */
	notifySectionsChanged: function()
	{
		this.notifyPropSet('sections', this.getPropStoreFieldValue('sections'));
	},

	/** @private */
	createSectionItem: function(atomOrSubFormula, count, charge)
	{
		var result = {'obj': atomOrSubFormula, 'count': count || 1/*, 'charge': charge || 0*/};
		if (charge)
			//result.charge = charge;
			atomOrSubFormula.setCharge(charge);
		if (atomOrSubFormula.setParent)
			atomOrSubFormula.setParent(this.getParent());
		return result;
	},

	/**
	 * Returns charge sum-up of this whole formula.
	 * @returns {Number}
	 */
	getTotalCharge: function()
	{
		var result = 0;
		var sections = this.getSections();
		for (var i = 0, l = sections.length; i < l; ++i)
		{
			/*
			if (sections[i].charge)
				result += sections[i].charge;
			else*/
			if (sections[i].obj.getCharge)
				result += sections[i].obj.getCharge() * (section.count || 1);
			/*
			if (sections[i].charge)
				result += sections[i].charge;
			*/
		}
		if (this.getCharge())
			result += this.getCharge();
		return result;
	},

	/**
	 * Get index of atomOrSubFormula in sections.
	 * @param {Variant} atomOrSubFormula Instance of {@link Kekule.AbstractAtom} or {@link Kekule.MolecularFormula}
	 * @returns {Int} Index of searched object or -1 (when not found).
	 */
	indexOfObj: function(atomOrSubFormula)
	{
		var sections = this.getSections();
		for (var i = 0, l = sections.length; i < l; ++i)
		{
			if (sections[i].obj == atomOrSubFormula)
				return i;
		}
		return -1;
	},
	/**
	 * Returns the count of sections in this formula.
	 * @returns {Int}
	 */
	getSectionCount: function()
	{
		return this.getSections().length;
	},
	/**
	 * Returns a section item at index.
	 * @param {Int} index
	 * @returns {Object}
	 */
	getSectionAt: function(index)
	{
		return this.getSections()[index];
	},
	/**
	 * Get charge of a section.
	 * @param {Variant} itemOrIndex Section item or section index.
	 */
	getSectionCharge: function(itemOrIndex)
	{
		var result = 0;
		var sec;
		if (typeof(itemOrIndex) != 'object')
			sec = this.getSectionAt(itemOrIndex);
		else
			sec = itemOrIndex;
		/*
		if (sec.charge)
			result += sec.charge;
		*/
		if (sec.obj.getCharge)
			result += (sec.obj.getCharge() || 0);
		return result;
	},
	/**
	 * Append a new section.
	 * @param {Variant} atomOrSubFormula Instance of {@link Kekule.AbstractAtom} or {@link Kekule.MolecularFormula}
	 * @param {Float} count Count of added object in formula. Float value (0.5 and so on) are allowed. Default is 1.
	 * @param {Float} charge Charge of this object, can be float to indicate partial charge. Default is 0.
	 * @returns {Object} Section item added.
	 */
	appendSection: function(atomOrSubFormula, count, charge)
	{
		//console.log('append', atomOrSubFormula.getClassName(), atomOrSubFormula.getSymbol && atomOrSubFormula.getSymbol(), count, charge);
		var result = this.createSectionItem(atomOrSubFormula, count, charge);
		this.getSections().push(result);
		this.notifySectionsChanged();
		return result;
	},
	/**
	 * Insert a new section to specified position. If index > this.getSectionCount(), the item
	 *   will be appended to the tail.
	 * @param {Int} index Prefered position of new section item.
	 * @param {Variant} atomOrSubFormula Instance of {@link Kekule.AbstractAtom} or {@link Kekule.MolecularFormula}
	 * @param {Float} count Count of added object in formula. Float value (0.5 and so on) are allowed.
	 * @param {Float} charge Charge of this object, can be float to indicate partial charge. Default is 0.
	 * @returns {Object} Section item added.
	 */
	insertSection: function(index, atomOrSubFormula, count, charge)
	{
		var result = this.createSectionItem(atomOrSubFormula, count, charge);
		this.getSections().splice(index, 0, result);
		this.notifySectionsChanged();
		return result;
	},
	/**
	 * Remove a section at index.
	 * @param {Int} index
	 */
	removeSectionAt: function(index)
	{
		var r = this.getSections().splice(index, 1);
		if (r)
			this.notifySectionsChanged();
		return r;
	},
	/**
	 * Clear all sections and empty the whole formula object.
	 */
	clear: function()
	{
		this.beginUpdate();
		try
		{
			this.setCharge(null);
			this.setRadical(null);
			this.setPropStoreFieldValue('sections', []);
			this.notifySectionsChanged();
		}
		finally
		{
			this.endUpdate();
		}
	},
	/**
	 * Remove a section with atomOrSubFormula.
	 * @param {Variant} atomOrSubFormula Instance of {@link Kekule.AbstractAtom} or {@link Kekule.MolecularFormula}
	 */
	removeObj: function(atomOrSubFormula)
	{
		var i = this.indexOfObj(atomOrSubFormula);
		if (i >= 0)
		{
			var r = this.removeSectionAt(i);
			this.notifySectionsChanged();
		}
		else
			return null;
	},

	/**
	 * Returns max nested level of current formula object.
	 * For example, [Cu(NH3)2]2+SO42-, level of [Cu(NH3)2] is 1 and (NH3) is 0.
	 * @returns {Int}
	 */
	getMaxNestedLevel: function()
	{
		var result = 0;
		for (var i = 0, l = this.getSectionCount(); i < l; ++i)
		{
			var section = this.getSectionAt(i);
			if (section.obj instanceof Kekule.MolecularFormula)
			{
				var nestLevel = section.obj.getMaxNestedLevel() + 1;
				if (nestLevel > result)
					result = nestLevel;
			}
		}
		return result;
	},

	/**
	 * Returns a pure array of {isotope, count, charge}.
	 * For example, [Cu(NH3)4]2+ SO4 2-] will be regarded as CuN4H12SO4
	 */
	getSimpleIsotopeMaps: function()
	{
		//TODO: not finished
	}
});


/**
 * A connection table for representing a complex (especially organic) molecule or group.
 * @class
 * @augments ObjectEx
 * @param {Kekule.ChemSpace} owner Owner for each objects in connection table.
 * @param {Kekule.StructureFragment} parent Parent to hold this Ctab.
 *
 * @property {Kekule.ChemSpace} owner Owner for each objects in connection table.
 * @property {Kekule.StructureFragment} parent Parent to hold this Ctab. Read only.
 * @property {Array} nodes All structure nodes in this connection table.
 * @property {Array} anchorNodes Nodes that can have bond connected to other structure fragments.
 * @property {Array} connectors Connectors (usually bonds) in this connection table.
 * @property {Array} nonHydrogenNodes All structure nodes except hydrogen atoms in this connection table.
 * @property {Array} nonHydrogenConnectors Connectors except ones connected to hydrogen atoms in this connection table.
 */
Kekule.StructureConnectionTable = Class.create(ObjectEx,
/** @lends Kekule.StructureConnectionTable# */
{
	/** @private */
	CLASS_NAME: 'Kekule.StructureConnectionTable',
	/**
	 * @constructs
	 */
	initialize: function($super, owner, parent)
	{
		$super();
		if (owner)
			this.setOwner(owner);
		if (parent)
			this.setPropStoreFieldValue('parent', parent);
		//this.setBubbleEvent(true);  // allow event bubble
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('owner', {
			'dataType': 'Kekule.ChemSpace',
			'serializable': false,
			'scope': Class.PropertyScope.PUBLIC,
			'setter': function(value)
				{
					if (value != this.getPropStoreFieldValue('owner'))
					{
						this.setPropStoreFieldValue('owner', value);
						this.ownerChanged(value);
					}
				}
		});
		this.defineProp('parent', {
			'dataType': 'Kekule.StructureFragment', 'serializable': false,
			'scope': Class.PropertyScope.PUBLIC,
			'setter': function(value)
				{
					if (value != this.getPropStoreFieldValue('parent'))
					{
						this.setPropStoreFieldValue('parent', value);
						this.parentChanged(value);
					}
				}
		});

		// Usually you are not to set nodes property directly. But some canonicalizers may need to replace the while node field.
		this.defineProp('nodes', {'dataType': DataType.ARRAY});

		this.defineProp('anchorNodes', {'dataType': DataType.ARRAY, 'setter': null});

		// Usually you are not to set connectors property directly. But some canonicalizers may need to replace the while connector field.
		this.defineProp('connectors', {'dataType': DataType.ARRAY});

		this.defineProp('nonHydrogenNodes', {
			'dataType': DataType.ARRAY,
			'scope': Class.PropertyScope.PUBLIC,
			'serializable': false,
			'setter': null,
			'getter': function()
			{
				var result = [];
				for (var i = 0, l = this.getNodeCount(); i < l; ++i)
				{
					var node = this.getNodeAt(i);
					if (!node.isHydrogenAtom || !node.isHydrogenAtom())
						result.push(node);
				}
				return result;
			}
		});
		this.defineProp('nonHydrogenConnectors', {
			'dataType': DataType.ARRAY,
			'scope': Class.PropertyScope.PUBLIC,
			'serializable': false,
			'setter': null,
			'getter': function()
			{
				var result = [];
				for (var i = 0, l = this.getConnectorCount(); i < l; ++i)
				{
					var conn = this.getConnectorAt(i);
					if (!conn.isNormalConnectorToHydrogen || !conn.isNormalConnectorToHydrogen())
						result.push(conn);
				}
				return result;
			}
		});
	},
	/** @private */
	initPropValues: function($super)
	{
		$super();
		this.setPropStoreFieldValue('nodes', []);
		this.setPropStoreFieldValue('anchorNodes', []);
		this.setPropStoreFieldValue('connectors', []);
	},
	/** @private */
	getHigherLevelObj: function()
	{
		return this.getParent() || this.getOwner();
	},

	// custom save / load method
	/** @private */
	doSaveProp: function(obj, prop, storageNode, serializer)
	{
		var propName = prop.name;
		switch (propName)
		{
			case 'anchorNodes':
				{
					var indexes = [];
					for (var i = 0, l = obj.getAnchorNodeCount(); i < l; ++i)
					{
						var node = obj.getAnchorNodeAt(i);
						var index = obj.indexOfNode(node);
						indexes.push(index);
					}
					var subNode = serializer.createChildStorageNode(storageNode, serializer.propNameToStorageName(propName), true); // create sub node for array
					serializer.save(indexes, subNode);
					return true;  // this property is handled, do not use default save method
					break;
				}
			case 'connectors':
				{
					// TODO: now cross connectors (connected node outside this ctab) is not considered
					var subNode = serializer.createChildStorageNode(storageNode, serializer.propNameToStorageName(propName), true); // create sub node for array
					for (var i = 0, l = obj.getConnectorCount(); i < l; ++i)
					{
						var item = obj.getConnectorAt(i);
						var nodeName = serializer.getNameForArrayItemStorageNode(item);
						var itemNode = serializer.appendArrayItemStorageNode(subNode,
							serializer.propNameToStorageName(nodeName), serializer.isArray(item));

						serializer.setStorageNodeExplicitType(itemNode, serializer.getValueExplicitType(item));
						serializer.save(item, itemNode);
						// as connector's connectedObjs property is marked as unserializable, need to be handled here
						/*
						var connectedNodes = [];
						var connectedConnectors = [];
						*/
						var connectedObjs = [];
						for (var j = 0, k = item.getConnectedObjCount(); j < k; ++j)
						{
							var conObj = item.getConnectedObjAt(j);
							/*
							var index = obj.indexOfNode(conObj);
							if (index >= 0)
								connectedNodes.push(index);
							else
							{
								index = obj.indexOfConnector(conObj);
								if (index >= 0)
									connectedConnectors.push(index);
								else  // not in direct children, check nested structures's nodes
								{
									var indexStack = obj.indexStackOfNode(conObj);
									if ((indexStack !== null)&& (typeof(indexStack) !== 'undefined'))
									{
										connectedNodes.push(indexStack);
									}
								}
							}
							*/
							var index = obj.indexOfChild(conObj);
							if (index >= 0)
								connectedObjs.push(index);
							else  // not in direct children, check nested structures's nodes
							{
								var indexStack = obj.indexStackOfChild(conObj);
								if ((indexStack !== null)&& (typeof(indexStack) !== 'undefined'))
								{
									connectedObjs.push(indexStack);
								}
							}
						}
						// save connected array
						/*
						if (connectedNodes.length)
						{
							var conNodeNode = serializer.createChildStorageNode(itemNode, serializer.propNameToStorageName('connectedNodes'), true); // create sub node for array
							serializer.save(connectedNodes, conNodeNode);
						}
						if (connectedConnectors.length)
						{
							var conConnectorNode = serializer.createChildStorageNode(itemNode, serializer.propNameToStorageName('connectedConnectors'), true); // create sub node for array
							serializer.save(connectedConnectors, conConnectorNode);
						}
						*/
						if (connectedObjs.length)
						{
							var conObjsNode = serializer.createChildStorageNode(itemNode, serializer.propNameToStorageName('connectedObjs'), true); // create sub node for array
							serializer.save(connectedObjs, conObjsNode);
						}
					}
					return true;
					break;
				}
			default:
				return false;  // use default save method
		}
	},
	/** @private */
	doLoadProp: function(obj, prop, storageNode, serializer)
	{
		var propName = prop.name;
		switch (propName)
		{
			case 'anchorNodes':
				{
					var indexes = [];
					var subNode = serializer.getChildStorageNode(storageNode, serializer.propNameToStorageName(propName)); // get sub node for array
					serializer.load(indexes, subNode);
					obj.__load_anchorNodes_indexes = indexes; // save the indexes and handle it after all properties are loaded
					return true;  // this property is handled, do not use default save method
					break;
				}
			case 'connectors':
			{
				var subNode = serializer.getChildStorageNode(storageNode, serializer.propNameToStorageName(propName)); // get sub node for array
				var itemNodes = serializer.getAllArrayItemStorageNodes(subNode);
				var connector;
				for (var i = 0, l = itemNodes.length; i < l; ++i)
				{
					var itemNode = itemNodes[i];
					var valueType = serializer.getStorageNodeExplicitType(itemNode) || serializer.getStorageNodeName(itemNode);
					if (valueType)
					{
						connector = DataType.createInstance(valueType);
						serializer.load(connector, itemNode);
						// then handle connectedObjs array
						var conObjsNode = serializer.getChildStorageNode(itemNode, serializer.propNameToStorageName('connectedObjs'));
						// as some object in Ctab may not be loaded, we just mark the indexes and handle it after loading process is done
						if (conObjsNode)
						{
							var connectedObjs = [];
							serializer.load(connectedObjs, conObjsNode);
							connector.__load_connectedObj_indexes = connectedObjs;
						}

						// conNode/conConnector are for back compatity
						var conNodeNode = serializer.getChildStorageNode(itemNode, serializer.propNameToStorageName('connectedNodes'));
						// as some object in Ctab may not be loaded, we just mark the indexes and handle it after loading process is done
						if (conNodeNode)
						{
							var connectedNodes = [];
							serializer.load(connectedNodes, conNodeNode);
							connector.__load_connectedNode_indexes = connectedNodes;
						}
						var conConnectorNode = serializer.getChildStorageNode(itemNode, serializer.propNameToStorageName('connectedConnectors'));
						if (conConnectorNode)
						{
							var connectedConnectors = [];
							serializer.load(connectedConnectors, conConnectorNode);
							connector.__load_connectedConnector_indexes = connectedConnectors;
						}

						obj.appendConnector(connector);
					}
				}
				return true;
				break;
			}
			default:
				return false;  // use default save method
		}
	},
	/** @private */
	loaded: function($super)
	{
		// after loaded, set anchorNodes
		if (this.__load_anchorNodes_indexes)
		{
			for (var i = 0, l = this.__load_anchorNodes_indexes.length; i < l; ++i)
			{
				var index = this.__load_anchorNodes_indexes[i];
				this.appendAnchorNode(this.getNodeAt(index));
			}
			delete this.__load_anchorNodes_indexes;
		}
		// and set connectedObjs of each connectors
		for (var i = 0, l = this.getConnectorCount(); i < l; ++i)
		{
			var connector = this.getConnectorAt(i);
			if (connector.__load_connectedObj_indexes)
			{
				for (var j = 0, k = connector.__load_connectedObj_indexes.length; j < k; ++j)
				{
					var index = connector.__load_connectedObj_indexes[j];
					var connObj;
					if (typeof(index) == 'object')  // is array, actually the index stack
						connObj = this.getChildAtIndexStack(index);
					else  // normal stack
						connObj = this.getChildAt(index);
					if (connObj)
						connector.appendConnectedObj(connObj);
				}
				delete connector.__load_connectedObj_indexes;
			}
			//else // for back compatity
			{
				if (connector.__load_connectedNode_indexes)
				{
					for (var j = 0, k = connector.__load_connectedNode_indexes.length; j < k; ++j)
					{
						var index = connector.__load_connectedNode_indexes[j];
						if (typeof(index) == 'object')  // is array, actually the index stack
							connector.appendConnectedObj(this.getNodeAtIndexStack(index));
						else  // normal stack
							connector.appendConnectedObj(this.getNodeAt(index));
					}
					delete connector.__load_connectedNode_indexes;
				}
				if (connector.__load_connectedConnector_indexes)
				{
					for (var j = 0, k = connector.__load_connectedConnector_indexes.length; j < k; ++j)
					{
						var index = connector.__load_connectedConnector_indexes[j];
						connector.appendConnectedObj(this.getConnectorAt(index));
					}
					delete connector.__load_connectedConnector_indexes;
				}
			}
		}
		this.ownerChanged(this.getOwner());
		this.parentChanged(this.getParent());  // update owner and parent of child objects
		$super();
	},
	/**
	 * Notify {@link Kekule.StructureConnectionTable#nodes} property has been changed
	 * @private
	 */
	notifyNodesChanged: function()
	{
		this.notifyPropSet('nodes', this.getPropStoreFieldValue('nodes'));
	},
	/**
	 * Notify {@link Kekule.StructureConnectionTable#anchorNodes} property has been changed
	 * @private
	 */
	notifyAnchorNodesChanged: function()
	{
		this.notifyPropSet('anchorNodes', this.getPropStoreFieldValue('anchorNodes'));
	},
	/**
	 * Notify {@link Kekule.StructureConnectionTable#connectors} property has been changed
	 * @private
	 */
	notifyConnectorsChanged: function()
	{
		this.notifyPropSet('connectors', this.getPropStoreFieldValue('connectors'));
	},

	/**
	 * Called after a new owner property is set.
	 * Note Connection table is not inherited from ChemObject, so no $super() need to be called.
	 * @private
	 */
	ownerChanged: function(newOwner)
	{
		// change nodes and connectors' owner
		for (var i = 0, l = this.getNodeCount(); i < l; ++i)
			this.getNodeAt(i).setOwner(newOwner);
		for (var i = 0, l = this.getConnectorCount(); i < l; ++i)
			this.getConnectorAt(i).setOwner(newOwner);
	},
	/**
	 * Called after a new parent property is set.
	 * Note Connection table is not inherited from ChemObject, so no $super() need to be called.
	 * @private
	 */
	parentChanged: function(newParent)
	{
		// change nodes and connectors' parent
		for (var i = 0, l = this.getNodeCount(); i < l; ++i)
			this.getNodeAt(i).setParent(newParent);
		for (var i = 0, l = this.getConnectorCount(); i < l; ++i)
			this.getConnectorAt(i).setParent(newParent);
	},

	/**
	 * Returns if this fragment has no formula or ctab, or ctab has no nodes or connectors.
	 * @return {Bool}
	 */
	isEmpty: function()
	{
		return (this.getNodeCount() <= 0) && (this.getConnectorCount() <= 0);
	},

	/**
	 * Get a structure node object with a specified id.
	 * @param {String} id
	 * @returns {Kekule.ChemStructureNode}
	 */
	getNodeById: function(id)
	{
		var nodes = this.getNodes();
		for (var i = 0, l = nodes.length; i < l; ++i)
		{
			if (nodes[i].getId() == id)
				return nodes[i];
		}
		return null;
	},
	/**
	 * Get a structure connector object with a specified id.
	 * @param {String} id
	 * @returns {Kekule.ChemStructureConnector}
	 */
	getConnectorById: function(id)
	{
		var connectors = this.getConnectors();
		for (var i = 0, l = connectors.length; i < l; ++i)
		{
			if (connectors[i].getId() == id)
				return connectors[i];
		}
		return null;
	},
	/**
	 * Get a structure node or connector object with a specified id.
	 * @param {String} id
	 * @returns {Kekule.ChemStructureObject}
	 */
	getObjectById: function(id)
	{
		var node = this.getNodeById(id);
		return node? node: this.getConnectorById(id);
	},
	/**
	 * Return count of nodes.
	 * @returns {Int}
	 */
	getNodeCount: function()
	{
		return this.getNodes().length;
	},
	/**
	 * Get node at index.
	 * @param {Int} index
	 * @returns {Kekule.ChemStructureNode}
	 */
	getNodeAt: function(index)
	{
		return this.getNodes()[index];
	},
	/**
	 * Get index of node in nodes list.
	 * @param {Kekule.ChemStructureNode} node
	 * @returns {Int}
	 */
	indexOfNode: function(node)
	{
		return this.getNodes().indexOf(node);
	},
	/**
	 * Check if a node exists in structure.
	 * @param {Kekule.ChemStructureNode} node Node to seek.
	 * @param {Bool} checkNestedStructure If true the nested sub groups will also be checked.
	 * @returns {Bool}
	 */
	hasNode: function(node, checkNestedStructure)
	{
		var found = this.indexOfNode(node) >= 0;
		if ((!found) && checkNestedStructure)
		{
			for (var i = 0, l = this.getNodeCount(); i < l; ++i)
			{
				var n = this.getNodeAt(i);
				//if (n instanceof Kekule.StructureFragment)
				if (n.hasNode)
					found = n.hasNode(node, true);
				if (found)
					break;
			}
		}
		return found;
	},
	/**
	 * Returns index of node. If node exists in nested sub group, index in sub group will be pushed to stack as well.
	 * @param {Kekule.ChemStructureNode} node
	 * @returns {Variant} If node is the direct child of this structure, returns {Int}, otherwise stack {Array} will be returned.
	 */
	indexStackOfNode: function(node)
	{
		var index = this.indexOfNode(node);
		if (index >= 0)
			return index;
		else  // check nested structures
		{
			var stack = null;
			for (var i = 0, l = this.getNodeCount(); i < l; ++i)
			{
				var n = this.getNodeAt(i);
				//if (n instanceof Kekule.StructureFragment)
				if (n.indexStackOfNode)
				{
					stack = n.indexStackOfNode(node);
					if (!Kekule.ObjUtils.isUnset(stack))  // found
					{
						// push index of n to stack
						if (typeof(stack) != 'object')
							stack = [stack];
						stack.unshift(i);
						//console.log('get stack: ', stack);
						return stack;
					}
				}
			}
			return stack;
		}
	},
	/**
	 * Get node at indexStack.
	 * For example, indexStack is [2, 3, 1], then this.getNodeAt(2).getNodeAt(3).getNodeAt(1) will be returned.
	 * @param {Array} indexStack Array of integers.
	 * @returns {Kekule.ChemStructureNode}
	 */
	getNodeAtIndexStack: function(indexStack)
	{
		indexStack = Kekule.ArrayUtils.toArray(indexStack);
		if (indexStack.length <= 0)
			return null;
		else
		{
			var node = this.getNodeAt(indexStack[0]);
			for (var i = 1, l = indexStack.length; i < l; ++i)
			{
				if (node && node.getNodeAt)
					node = node.getNodeAt(indexStack[i]);
				else
					return null;
			}
			return node;
		}
	},
	/**
	 * Add node to connection table. If node already inside, nothing will be done.
	 * @param {Kekule.ChemStructureNode} node
	 */
	appendNode: function(node)
	{
		var r = Kekule.ArrayUtils.pushUniqueEx(this.getNodes(), node);
		if (r.isPushed)
		{
			if (node.setOwner)
				node.setOwner(this.getOwner());
			if (node.setParent)
				node.setParent(this.getParent());
			this.notifyNodesChanged();
		}
		return r.index;
	},
	/**
	 * Insert node to index. If index is not set, node will be inserted to the tail of node list of ctab.
	 * @param {Kekule.ChemStructureNode} node
	 * @param {Int} index
	 */
	insertNodeAt: function(node, index)
	{
		var i = this.indexOfNode(node);
		var nodes = this.getNodes();
		if (Kekule.ObjUtils.isUnset(index) || (index < 0))
			index = nodes.length;
		if (i >= 0)  // already inside, adjust position
		{
			nodes.splice(i, 1);
			nodes.splice(index, 0, node);
		}
		else // new one
		{
			nodes.splice(index, 0, node);
			if (node.setOwner)
				node.setOwner(this.getOwner());
			if (node.setParent)
				node.setParent(this.getParent());
		}
		this.notifyNodesChanged();
	},
	/**
	 * Change index of node.
	 * @param {Kekule.ChemStructureNode} node
	 * @param {Int} index
	 */
	setNodeIndex: function(node, index)
	{
		var nodes = this.getNodes();
		var i = this.indexOfNode(node);
		if (i >= 0)  // already inside, adjust position
		{
			nodes.splice(i, 1);
			nodes.splice(index, 0, node);
		}
	},
	/**
	 * Remove node at index in connection table.
	 * @param {Int} index
	 * @param {Bool} preserveLinkedConnectors Whether remove relations between this node and linked connectors.
	 */
	removeNodeAt: function(index, preserveLinkedConnectors)
	{
		var node = this.getNodes()[index];
		if (node)
		{
			// remove from connectors
			if (!preserveLinkedConnectors)
				node.removeThisFromLinkedConnector();
			//this.removeConnectNode(node);
			//this.getNodes().removeAt(index);
			this.getNodes().splice(index, 1);
			if (node.setOwner)
				node.setOwner(null);
			if (node.setParent)
				node.setParent(null);
			this.notifyNodesChanged();
		}
	},
	/**
	 * Remove a node in connection table.
	 * @param {Kekule.ChemStructureNode} node
	 * @param {Bool} preserveLinkedConnectors Whether remove relations between this node and linked connectors.
	 */
	removeNode: function(node, preserveLinkedConnectors)
	{
		var index = this.getNodes().indexOf(node);
		if (index >= 0)
			this.removeNodeAt(index, preserveLinkedConnectors);
	},
	/**
	 * Replace oldNode with new one, preserve coords and all linked connectors.
	 * @param {Kekule.ChemStructureNode} oldNode Must be direct child of current ctab (node in nested structure fragment will be ignored).
	 * @param {Kekule.ChemStructureNode} newNode
	 */
	replaceNode: function(oldNode, newNode)
	{
		if (!this.hasNode(oldNode))
		{
			return this;
		}
		else
		{
			//console.log('replace', oldNode.getClassName(), newNode.getClassName());
			this.insertBefore(newNode, oldNode);
			// replace in anchor nodes
			var anchorNodes = this.getAnchorNodes();
			var anchorIndex = anchorNodes.indexOf(oldNode);
			if (anchorIndex >= 0)
				anchorNodes.splice(anchorIndex, 1, [newNode]);
			// replace connectors
			var connectors = Kekule.ArrayUtils.clone(oldNode.getLinkedConnectors());  // clone array, otherwise linked connectors will change
			for (var i = 0, l = connectors.length; i < l; ++i)
			{
				var connector = connectors[i];
				connector.replaceConnectedObj(oldNode, newNode);
			}

			// replace related cross connectors of oldNode (when it is subgroup)
			if (oldNode.getNodes && oldNode.getCrossConnectors)
			{
				var crossConnectors = Kekule.ArrayUtils.clone(oldNode.getCrossConnectors());
				for (var i = 0, l = crossConnectors.length; i < l; ++i)
				{
					var connector = crossConnectors[i];
					if (this.indexOfConnector(connector) >= 0)  // is connector in this ctab
					{
						for (var j = 0, k = connector.getConnectedObjCount(); j < k; ++j)
						{
							var obj = connector.getConnectedObjAt(j);
							if (oldNode.indexOfChild(obj) >= 0)  // obj is inside oldNode group, replace it with new Node
							  connector.replaceConnectedObj(obj, newNode);
						}
					}
					connector.replaceConnectedObj(oldNode, newNode);
				}
			}

			this.removeNode(oldNode);
		}
	},
	/**
	 * Remove all nodes from connection table.
	 */
	clearNodes: function()
	{
		this.clearAnchorNodes();
		this.setPropStoreFieldValue('nodes', []);
		this.notifyAnchorNodesChanged();
		this.notifyNodesChanged();
	},

	/**
	 * Sort direct child nodes in ctab.
	 * @param {Function} sortFunc Function to determine the priority of nodes.
	 */
	sortNodes: function(sortFunc)
	{
		if (sortFunc)
		{
			this.getNodes().sort(sortFunc);
			this.notifyNodesChanged();
		}
		else
			Kekule.error(/*Kekule.ErrorMsg.SORT_FUNC_UNSET*/Kekule.$L('ErrorMsg.SORT_FUNC_UNSET'));
	},

	/**
	 * Check if child nodes has 2D coord.
	 * @param {Bool} allowCoordBorrow
	 * @returns {Bool}
	 */
	nodesHasCoord2D: function(allowCoordBorrow)
	{
		var nodes = this.getNodes();
		for (var i = 0, l = nodes.length; i < l; ++i)
		{
			if (nodes[i].hasCoord2D(allowCoordBorrow))
				return true;
		}
		return false;
	},
	/**
	 * Check if child nodes has 3D coord.
	 * @param {Bool} allowCoordBorrow
	 * @returns {Bool}
	 */
	nodesHasCoord3D: function(allowCoordBorrow)
	{
		var nodes = this.getNodes();
		for (var i = 0, l = nodes.length; i < l; ++i)
		{
			if (nodes[i].hasCoord3D(allowCoordBorrow))
				return true;
		}
		return false;
	},

	/**
	 * Create a new Kekule.Atom instance.
	 * @param {Variant} elemSymbolOrAtomicNumber
	 * @param {Number} massNumber
	 * @param {Hash} coord2D
	 * @param {Hash} coord3D
	 * @returns {Kekule.Atom}
	 * @private
	 */
	_createAtom: function(elemSymbolOrAtomicNumber, massNumber, coord2D, coord3D)
	{
		var atom = new Kekule.Atom(null, elemSymbolOrAtomicNumber, massNumber, coord2D, coord3D);
		return atom;
	},

	/**
	 * Util method to create a new Kekule.Atom instance and append to current connection table.
	 * @param {Variant} elemSymbolOrAtomicNumber
	 * @param {Number} massNumber
	 * @param {Hash} coord2D
	 * @param {Hash} coord3D
	 * @returns {Kekule.Atom}
	 * @private
	 */
	appendAtom: function(elemSymbolOrAtomicNumber, massNumber, coord2D, coord3D)
	{
		var atom = this._createAtom(elemSymbolOrAtomicNumber, massNumber, coord2D, coord3D);
		if (atom)
			this.appendNode(atom);
		return atom;
	},

	/**
	 * Return count of anchorNodes.
	 * @returns {Int}
	 */
	getAnchorNodeCount: function()
	{
		return this.getAnchorNodes().length;
	},
	/**
	 * Get index of node in anchorNodes list.
	 * @param {Kekule.ChemStructureNode} node
	 * @returns {Int}
	 */
	indexOfAnchorNode: function(node)
	{
		return this.getAnchorNodes().indexOf(node);
	},
	/**
	 * Get anchor node at index.
	 * @param {Int} index
	 * @returns {Kekule.ChemStructureNode}
	 */
	getAnchorNodeAt: function(index)
	{
		return this.getAnchorNodes()[index];
	},
	/**
	 * Add anchor node of connection table. If node not in nodes, nothing will be done.
	 * @param {Kekule.ChemStructureNode} node
	 */
	appendAnchorNode: function(node)
	{
		if (!node)
			return -1;
		if (this.getNodes().indexOf(node) >= 0)
		{
			var r = Kekule.ArrayUtils.pushUniqueEx(this.getAnchorNodes(), node);
			if (r.isPushed)
				this.notifyAnchorNodesChanged();
			return r.index;
		}
		else
			return -1;
	},
	/**
	 * Remove node at index of anchorNodes.
	 * @param {Int} index
	 */
	removeAnchorNodeAt: function(index)
	{
		var node = this.getAnchorNodes()[index];
		if (node)
		{
			//this.getAnchorNodes().removeAt(index);
			this.getAnchorNodes().splice(index, 1);
			this.notifyAnchorNodesChanged();
		}
	},
	/**
	 * Remove a node in anchorNodes.
	 * @param {Kekule.ChemStructureNode} node
	 */
	removeAnchorNode: function(node)
	{
		var index = this.getAnchorNodes().indexOf(node);
		if (index >= 0)
			this.removeAnchorNodeAt(index);
	},
	/**
	 * Remove all anchor nodes from connection table.
	 */
	clearAnchorNodes: function()
	{
		this.setPropStoreFieldValue('anchorNodes', []);
		notifyAnchorNodesChanged();
	},
	/**
	 * Return count of connectors.
	 * @returns {Int}
	 */
	getConnectorCount: function()
	{
		return this.getConnectors().length;
	},
	/**
	 * Get index of connector in connectors list.
	 * @param {Kekule.ChemStructureConnector} connector
	 * @returns {Int}
	 */
	indexOfConnector: function(connector)
	{
		return this.getConnectors().indexOf(connector);
	},
	/**
	 * Get connector at index.
	 * @param {Int} index
	 * @returns {Kekule.ChemStructureConnector}
	 */
	getConnectorAt: function(index)
	{
		return this.getConnectors()[index];
	},

	/**
	 * Returns index of connector. If connector exists in nested sub group, index in sub group will be pushed to stack as well.
	 * @param {Kekule.ChemStructureConnector} connector
	 * @returns {Variant} If connector is the direct child of this structure, returns {Int}, otherwise stack {Array} will be returned.
	 */
	indexStackOfConnector: function(connector)
	{
		var index = this.indexOfConnector(connector);
		if (index >= 0)
			return index;
		else  // check nested structures
		{
			var stack = null;
			for (var i = 0, l = this.getNodeCount(); i < l; ++i)
			{
				var n = this.getNodeAt(i);
				if (n.indexStackOfConnector)
				{
					stack = n.indexStackOfConnector(connector);
					if (!Kekule.ObjUtils.isUnset(stack))  // found
					{
						// push index of n to stack
						if (typeof(stack) != 'object')
							stack = [stack];
						stack.unshift(i);
						//console.log('get stack: ', stack);
						return stack;
					}
				}
			}
			return stack;
		}
	},
	/**
	 * Get connector at indexStack.
	 * For example, indexStack is [2, 3, 1], then this.getNodeAt(2).getNodeAt(3).getConnectorAt(1) will be returned.
	 * @param {Array} indexStack Array of integers.
	 * @returns {Kekule.ChemStructureNode}
	 */
	getConnectorAtIndexStack: function(indexStack)
	{
		indexStack = Kekule.ArrayUtils.toArray(indexStack);
		if (indexStack.length <= 0)
			return null;
		else if (indexStack.length === 1)
		{
			return this.getConnectorAt(indexStack[0]);
		}
		else
		{
			var stackTail = indexStack.length - 1;
			var node = this.getNodeAt(indexStack[0]);
			for (var i = 1; i < stackTail; ++i)
			{
				if (node && node.getNodeAt)
					node = node.getNodeAt(indexStack[i]);
				else
					return null;
			}
			if (node)
				return node.getConnectorAt(indexStack[stackTail]);
			else
				return null;
		}
	},

	/**
	 * Add connector to connection table.
	 * @param {Kekule.ChemStructureConnector} connector
	 */
	appendConnector: function(connector)
	{
		var r = Kekule.ArrayUtils.pushUniqueEx(this.getConnectors(), connector);
		if (r.isPushed)
		{
			if (connector.setOwner)
				connector.setOwner(this.getOwner());
			if (connector.setParent)
				connector.setParent(this.getParent());
			this.notifyConnectorsChanged();
		}
		return r.index;
	},
	/**
	 * Insert connector to index. If index is not set, node will be inserted as the first connector of ctab.
	 * @param {Kekule.ChemStructureConnector} connector
	 * @param {Int} index
	 */
	insertConnectorAt: function(connector, index)
	{
		var i = this.indexOfConnector(connector);
		var connectors = this.getConnectors();
		if (Kekule.ObjUtils.isUnset(index) || (index < 0))
			index = connectors.length;
		if (i >= 0)  // already inside, adjust position
		{
			connectors.splice(i, 1);
			connectors.splice(index, 0, connector);
		}
		else // new one
		{
			connectors.splice(index, 0, connector);
			if (connector.setOwner)
				connector.setOwner(this.getOwner());
			if (connector.setParent)
				connector.setParent(this.getParent());
		}
		this.notifyConnectorsChanged();
	},
	/**
	 * Change index of connector.
	 * @param {Kekule.ChemStructureConnector} connector
	 * @param {Int} index
	 */
	setConnectorIndex: function(connector, index)
	{
		var connectors = this.getConnectors();
		var i = this.indexOfConnector(connector);
		if (i >= 0)  // already inside, adjust position
		{
			connectors.splice(i, 1);
			connectors.splice(index, 0, connector);
		}
	},
	/**
	 * Remove connector at index of connectors.
	 * @param {Int} index
	 * @param {Bool} preserveConnectedObjs Whether delte relations between this connector and related nodes.
	 */
	removeConnectorAt: function(index, preserveConnectedObjs)
	{
		var connector = this.getConnectors()[index];
		if (connector)
		{
			//this.getConnectors().removeAt(index);
			if (!preserveConnectedObjs)
				connector.removeThisFromConnectedObjs();
			this.getConnectors().splice(index, 1);
			if (connector.setOwner)
				connector.setOwner(null);
			if (connector.setParent)
				connector.setParent(null);
			this.notifyConnectorsChanged();
		}
	},
	/**
	 * Remove a connector in connection table.
	 * @param {Kekule.ChemStructureConnector} connector
	 * @param {Bool} preserveConnectedObjs Whether delte relations between this connector and related nodes.
	 */
	removeConnector: function(connector, preserveConnectedObjs)
	{
		var index = this.getConnectors().indexOf(connector);
		if (index >= 0)
			this.removeConnectorAt(index, preserveConnectedObjs);
	},
	/**
	 * Remove all connectors from connection table.
	 */
	clearConnectors: function()
	{
		this.setPropStoreFieldValue('connectors', []);
		this.notifyConnectorsChanged();
	},
	/**
	 * Check if a connector exists in structure.
	 * @param {Kekule.ChemStructureConnector} connector Connector to seek.
	 * @param {Bool} checkNestedStructure If true the nested sub groups will also be checked.
	 * @returns {Bool}
	 */
	hasConnector: function(connector, checkNestedStructure)
	{
		var found = this.indexOfConnector(connector) >= 0;
		if ((!found) && checkNestedStructure)
		{
			for (var i = 0, l = this.getNodeCount(); i < l; ++i)
			{
				var n = this.getNodeAt(i);
				//if (n instanceof Kekule.StructureFragment)
				if (n.hasConnector)
					found = n.hasConnector(connector, true);
				if (found)
					break;
			}
		}
		return found;
	},

	/**
	 * Sort direct child connectors in ctab.
	 * @param {Function} sortFunc Function to determine the priority of connectors.
	 */
	sortConnectors: function(sortFunc)
	{
		if (sortFunc)
		{
			this.getConnectors().sort(sortFunc);
			this.notifyConnectorsChanged();
		}
		else
			Kekule.error(/*Kekule.ErrorMsg.SORT_FUNC_UNSET*/Kekule.$L('ErrorMsg.SORT_FUNC_UNSET'));
	},

	/**
	 * A util method to create a new bond object connected with node only.
	 * @param {Array} nodesOrIndexes Array of connected nodes or indexes of those nodes
	 * @param {Int} bondOrder Order of bond.
	 * @param {Int} bondType Type of bond.
	 * @returns {Kekule.Bond}
	 * @private
	 */
	_createBond: function(nodesOrIndexes, bondOrder, bondType)
	{
		var connectedObjs = [];
		for (var i = 0, l = nodesOrIndexes.length; i < l; ++i)
		{
			var a = nodesOrIndexes[i];
			if (DataType.isSimpleValue(a))  // not node object, should be index of node
				a = this.getNodeAt(a);
			connectedObjs.push(a);
		}
		var result = new Kekule.Bond(null, connectedObjs, bondOrder, null, bondType);
		return result;
	},
	/**
	 * A util method to create a new bond object connected with nodes and append to current connection table.
	 * @param {Array} nodesOrIndexes Array of connected nodes or indexes of those nodes
	 * @param {Int} bondOrder Order of bond.
	 * @param {Int} bondType Type of bond.
	 * @returns {Kekule.Bond}
	 */
	appendBond: function(nodesOrIndexes, bondOrder, bondType)
	{
		var bond = this._createBond(nodesOrIndexes, bondOrder, bondType);
		if (bond)
			this.appendConnector(bond);
		return bond;
	},

	/**
	 * Returns nodes or connectors that should be removed cascadely with chemStructObj.
	 * @param {Object} childObj
	 * @returns {Array}
	 * @private
	 */
	_getObjsNeedToBeCascadeRemoved: function(childObj, ignoredChildObjs)
	{
		var result = [];
		// all usual connectors (two ends) connected to chemStructObj should be removed
		var linkedConnectors = childObj.getLinkedConnectors? childObj.getLinkedConnectors(): [];
		for (var i = 0, l = linkedConnectors.length; i < l; ++i)
		{
			var connector = linkedConnectors[i];
			if ((!ignoredChildObjs) || (ignoredChildObjs.indexOf(connector) < 0))
			{
				if (connector.getConnectedObjs().length <= 2)
					Kekule.ArrayUtils.pushUnique(result, connector);
			}
		}

		if (childObj instanceof Kekule.ChemStructureNode)
		{
			// no additional objects should be delete
		}
		else if (childObj instanceof Kekule.ChemStructureConnector)
		{
			// nodes connected with and only with this connector should be removed
			var objs = childObj.getConnectedObjs();
			for (var i = 0, l = objs.length; i < l; ++i)
			{
				var obj = objs[i];
				if ((!ignoredChildObjs) || (ignoredChildObjs.indexOf(obj) < 0))
				{
					if (obj instanceof Kekule.ChemStructureNode)
					{
						if (obj.getLinkedConnectors().length <= 1)
							Kekule.ArrayUtils.pushUnique(result, obj);
					}
				}
			}
		}
		else  // other objects
			;

		// then iterate each objects in result, check second level cascade remove objects
		var ignoredObjs = [].concat(result);
		ignoredObjs.push(childObj);
		var secondLevelObjs = [];
		for (var i = 0, l = result.length; i < l; ++i)
		{
			var obj = result[i];
			if (obj !== childObj)
				var cascadeObjs = this._getObjsNeedToBeCascadeRemoved(obj, ignoredObjs);
			Kekule.ArrayUtils.pushUnique(secondLevelObjs, cascadeObjs);
		}
		Kekule.ArrayUtils.pushUnique(result, secondLevelObjs);

		return result;
	},

	/**
	 * Remove childObj from connection table.
	 * @param {Variant} childObj A child node or connector.
	 * @param {Bool} cascadeRemove Whether remove related objects (e.g., bond connected to an atom).
	 * @param {Bool} freeRemoved Whether free all removed objects.
	 */
	removeChildObj: function(childObj, cascadeRemove, freeRemoved)
	{
		var objs;
		if (cascadeRemove)
		{
			objs = this._getObjsNeedToBeCascadeRemoved(childObj);
			Kekule.ArrayUtils.pushUnique(objs, childObj);
		}
		else
		{
			objs = [childObj];
		}
		for (var i = 0, l = objs.length; i < l; ++i)
		{
			var obj = objs[i];
			if (obj instanceof Kekule.BaseStructureConnector)
				this.removeConnector(obj);
			else if (obj instanceof Kekule.BaseStructureNode)
				this.removeNode(obj);
		}
		if (freeRemoved)
		{
			for (var i = objs.length - 1; i >= 0; --i)
			{
				var obj = objs[i];
				if (obj.finalize)
					obj.finalize();
			}
		}
	},
	/**
	 * Remove child obj directly from connection table.
	 * @param {Variant} childObj A child node or connector.
	 */
	removeChild: function(obj)
	{
		return this.removeChildObj(obj);
	},

	/**
	 * Remove and free childObj from connection table.
	 * @param {Variant} childObj A child node or connector.
	 * @param {Bool} cascadeDelete Whether delete related objects (e.g., bond connected to an atom).
	 */
	deleteChildObj: function(childObj, cascadeDelete)
	{
		return this.removeChildObj(childObj, cascadeDelete, true);
	},

	/**
	 * Check if childObj is a child node or connector of this ctab.
	 * @param {Kekule.ChemObject} childObj
	 * @returns {Bool}
	 */
	hasChildObj: function(childObj)
	{
		return this.hasNode(childObj) || this.hasConnector(childObj);
	},

	/**
	 * Returns next sibling node or connector to childObj.
	 * @param {Variant} childObj Node or connector.
	 * @returns {Variant}
	 */
	getNextSiblingOfChild: function(childObj)
	{
		if (childObj instanceof Kekule.ChemStructureNode)
		{
			var index = this.indexOfNode(childObj);
			if (index >= 0)
				return this.getNodeAt(index + 1);
		}
		else if (childObj instanceof Kekule.ChemStructureConnector)
		{
			var index = this.indexOfConnector(childObj);
			if (index >= 0)
				return this.getConnectorAt(index + 1);
		}
		return null;
	},

	/**
	 * Insert obj before refChild in node or connector list. If refChild is null or does not exists, obj will be append to tail of list.
	 * @param {Variant} obj A node or connector.
	 * @param {Variant} refChild Ref node or connector
	 * @return {Int} Index of obj after inserting.
	 */
	insertBefore: function(obj, refChild)
	{
		if (obj instanceof Kekule.BaseStructureNode)
		{
			var refIndex = this.indexOfNode(refChild);
			return this.insertNodeAt(obj, refIndex);
		}
		else if (obj instanceof Kekule.BaseStructureConnector)
		{
			var refIndex = this.indexOfConnector(refChild);
			return this.insertConnectorAt(obj, refIndex);
		}
	},

	/**
	 * Clear all nodes, anchor nodes and connectors in connection table.
	 */
	clear: function()
	{
		this.clearNodes();
		this.clearConnectors();
	},

	/**
	 * Get count of child objects (including both nodes and connectors).
	 * @returns {Int}
	 */
	getChildCount: function()
	{
		return this.getNodeCount() + this.getConnectorCount();
	},
	/**
	 * Get child object (including both nodes and connectors) at index.
	 * @param {Int} index
	 * @returns {Variant}
	 */
	getChildAt: function(index)
	{
		var nodeCount = this.getNodeCount();
		if (index < nodeCount)
			return this.getNodeAt(index);
		else
			return this.getConnectorAt(index - nodeCount);
	},
	/**
	 * Get the index of obj in children list.
	 * @param {Variant} obj
	 * @returns {Int} Index of obj or -1 when not found.
	 */
	indexOfChild: function(obj)
	{
		var result;
		if (obj instanceof Kekule.BaseStructureNode)
			result = this.indexOfNode(obj);
		else if (obj instanceof Kekule.BaseStructureConnector)
		{
			result = this.indexOfConnector(obj);
			if (result >= 0)
			{
				var nodeCount = this.getNodeCount();
				result += nodeCount;
			}
		}
		else
			result = -1;
		return result;
	},

	/**
	 * Get child object at indexStack.
	 * For example, indexStack is [2, 3, 1], then this.getNodeAt(2).getNodeAt(3).getChildAt(1) will be returned.
	 * @param {Array} indexStack Array of integers.
	 * @returns {Kekule.ChemStructureObject}
	 */
	indexStackOfChild: function(obj)
	{
		var result;
		if (obj instanceof Kekule.BaseStructureNode)
			result = this.indexStackOfNode(obj);
		else if (obj instanceof Kekule.BaseStructureConnector)
		{
			var nodeCount = this.getNodeCount();
			result = this.indexStackOfConnector(obj);
			if (result.length)  // is array
			{
				result[result.length - 1] += nodeCount;
			}
			else  // simple int value
			{
				result += nodeCount;
			}
		}
		else
			result = -1;
		return result;
	},
	/**
	 * Get child object at indexStack.
	 * For example, indexStack is [2, 3, 1], then this.getChildAt(2).getChildAt(3).getChildAt(1) will be returned.
	 * @param {Array} indexStack Array of integers.
	 * @returns {Kekule.ChemStructureObject}
	 */
	getChildAtIndexStack: function(indexStack)
	{
		indexStack = Kekule.ArrayUtils.toArray(indexStack);
		if (indexStack.length <= 0)
			return null;
		else
		{
			var child = this.getChildAt(indexStack[0]);
			for (var i = 1, l = indexStack.length; i < l; ++i)
			{
				if (child && child.getChildAt)
					child = child.getChildAt(indexStack[i]);
				else
					return null;
			}
			return child;
		}
	},

	/**
	 * Check if a node has a sub structure (has child nodes).
	 * Note if a sub group has no children, it will not be regarded as sub fragment.
	 * @param {Kekule.ChemStructureNode} node
	 * @returns {Bool}
	 */
	isSubFragment: function(node)
	{
		return (node.getNodeCount && (node.getNodeCount() > 0));
	},
	/**
	 * Get all sub fragments (node that have children, usually SubGroup).
	 * Note if a sub group has no children, it will not be regarded as sub fragment.
	 * @returns {Array} Array of {@link Kekule.StructureFragment}.
	 */
	getSubFragments: function()
	{
		var result = [];
		for (var i = 0, l = this.getNodeCount(); i < l; ++i)
		{
			var node = this.getNodeAt(i);
			if (this.isSubFragment(node))
				result.push(node);
		}
		return result;
	},
	/**
	 * Returns whether there are sub fragment(s) (node that have children, usually SubGroup) in this ctab.
	 * Note if a sub group has no children, it will not be regarded as sub fragment.
	 * @returns {Bool}
	 */
	hasSubFragments: function()
	{
		var subs = this.getSubFragments();
		return subs && subs.length;
	},
	/**
	 * Get all leaf nodes (node that do not have children, usually atom).
	 * Note if a sub group has no children, it will be regarded as leaf node too.
	 * @returns {Array} Array of {@link Kekule.ChemStructureNode}.
	 */
	getLeafNodes: function()
	{
		var result = [];
		for (var i = 0, l = this.getNodeCount(); i < l; ++i)
		{
			var node = this.getNodeAt(i);
			if (!this.isSubFragment(node))
				result.push(node);
			else if (node.getLeafNodes)
			{
				var leafs = node.getLeafNodes();
				result = result.concat(leafs);
			}
		}
		return result;
	},
	/**
	 * Returns the direct node/substructure that contains originObj.
	 * originObj may be a child node or connector of substructure in this ctab.
	 * If originObj is actually not in this ctab, null will be returned.
	 * @param {Kekule.ChemStructureObject} originObj
	 * @returns {Kekule.ChemStructureNode}
	 */
	findDirectChildOfObj: function(originObj)
	{
		var obj = originObj;
		while (obj && this.indexOfChild(obj) < 0)
		{
			obj = obj.getParent? obj.getParent(): null;
		}
		return obj;
	},
	/**
	 * Return all bonds in structure as well as in sub structure.
	 * @returns {Array} Array of {Kekule.ChemStructureConnector}.
	 */
	getAllChildConnectors: function()
	{
		var result = [].concat(this.getConnectors());
		var subFrags = this.getSubFragments();
		for (var i = 0, l = subFrags.length; i < l; ++i)
		{
			if (subFrags[i].getAllChildConnectors)
				result = result.concat(subFrags[i].getAllChildConnectors());
		}
		return result;
	},
	/**
	 * Return all bonds in structure as well as in sub structure.
	 * @returns {Array} Array of {Kekule.ChemStructureConnector}.
	 */
	getAllContainingConnectors: function()
	{
		return this.getAllChildConnectors();
	},

	/**
	 * Returns an array of all isotope, count and charge map, used for calculation of formula.
	 * @private
	 */
	getIsotopeMaps: function()
	{
		var nodes = this.getNodes();
		if (nodes.length <= 0)
			return [];
		else
		{
			/** @private */
			var addIsotope = function(maps, isotope, count, charge)
				{
					var isOldIsotope = false;
					for (var j = 0, k = maps.length; j < k; ++j)
					{
						if (isotope.isSame(maps[j].isotope))
						{
							isOldIsotope = true;
							maps[j].count += count;
							maps[j].charge += charge || 0;
						}
					}
					if (!isOldIsotope)  // new one, add an item
					{
						var item = {'isotope': isotope, 'count': count, 'charge': node.getCharge() || 0};
						maps.push(item);
					}
					return maps;
				};

			var result = [];
			for (var i = 0, l = nodes.length; i < l; ++i)
			{
				var node = nodes[i];
				if (node instanceof Kekule.StructureFragment)
				{
					var subMaps = node.getIsotopeMaps();
					for (var i = 0, l = subMaps.length; i < l; ++i)  // merge with current maps
					{
						result = addIsotope(result, subMaps[i].isotope, subMaps[i].count, subMaps[i].charge || 0);
					}
				}
				else if (node instanceof Kekule.Atom)
				{
					var isotope = node.getIsotope();
					result = addIsotope(result, node.getIsotope(), 1, node.getCharge() || 0);
					// add H connected to node
					var hcount = node.getHydrogenCount();  // || node.getImplicitHydrogenCount();
					if (hcount > 0)
					{
						var helem = Kekule.IsotopeFactory.getIsotope(1);
						result = addIsotope(result, helem, hcount, 0);
					}
				}
			}
		}
		return result;
	},

	/**
	 * Calculate molecular formula from this connection table.
	 * @returns {Kekule.MolecularFormula}
	 */
	calcFormula: function()
	{
		var isotopeMaps = this.getIsotopeMaps();
		if (isotopeMaps.length <= 0)
			return null;

		var result = new Kekule.MolecularFormula();
		for (var i = 0, l = isotopeMaps.length; i < l; ++i)
		{
			// create fake atom
			var fakeAtom = new Kekule.Atom();
			fakeAtom.setIsotope(isotopeMaps[i].isotope);
			//result.appendSection(isotopeMaps[i].isotope, isotopeMaps[i].count, isotopeMaps[i].charge);
			result.appendSection(fakeAtom, isotopeMaps[i].count, isotopeMaps[i].charge);
		}
		return result;
	},

	/**
	 * Calculate the absolute box to fit all nodes.
	 * @param {Array} nodes
	 * @param {Int} coordMode Determine to calculate 2D or 3D box. Value from {@link Kekule.CoordMode}.
	 * @param {Bool} allowCoordBorrow
	 * @returns {Hash} Box information. {x1, y1, z1, x2, y2, z2} (in 2D mode z1 and z2 will not be set).
	 */
	getNodesContainBox: function(nodes, coordMode, allowCoordBorrow)
	{
		//console.log('begin');
		var is3D = (coordMode === Kekule.CoordMode.COORD3D);
		var result = {};
		for (var i = 0, l = nodes.length; i < l; ++i)
		{
			var node = nodes[i];
			//var coord = is3D? node.getCoord3D(): node.getCoord2D();
			//var coord = is3D? node.getAbsCoord3D(allowCoordBorrow): node.getAbsCoord2D(allowCoordBorrow);
			var coord = node.getAbsCoordOfMode(coordMode, allowCoordBorrow);

			if (i == 0)
			{
				result.x1 = result.x2 = coord.x;
				result.y1 = result.y2 = coord.y;
				if (is3D)
					result.z1 = result.z2 = coord.z;
			}
			else
			{
				(coord.x < result.x1)?
					result.x1 = coord.x: (
						(coord.x > result.x2)? result.x2 = coord.x: null);
				(coord.y < result.y1)?
					result.y1 = coord.y: (
						(coord.y > result.y2)? result.y2 = coord.y: null);
				if (is3D)
					(coord.z < result.z1)?
						result.z1 = coord.z: (
							(coord.z > result.z2)? result.z2 = coord.z: null);
			}
		}
		//console.log('end', result);
		return result;
	},

	/**
	 * Calculate the box to fit all nodes in CTable of molecule.
	 * @param {Int} coordMode Determine to calculate 2D or 3D box. Value from {@link Kekule.CoordMode}.
	 * @param {Bool} allowCoordBorrow
	 * @returns {Hash} Box information. {x1, y1, z1, x2, y2, z2} (in 2D mode z1 and z2 will not be set).
	 */
	getContainerBox: function(coordMode, allowCoordBorrow)
	{
		/*
		var is3D = (coordMode === Kekule.CoordMode.COORD3D);
		var result = {};
		for (var i = 0, l = this.getNodeCount(); i < l; ++i)
		{
			var node = this.getNodeAt(i);
			var coord = is3D? node.getCoord3D(): node.getCoord2D();
			if (i == 0)
			{
				result.x1 = result.x2 = coord.x;
				result.y1 = result.y2 = coord.y;
				if (is3D)
					result.z1 = result.z2 = coord.z;
			}
			else
			{
				(coord.x < result.x1)?
					result.x1 = coord.x: (
						(coord.x > result.x2)? result.x2 = coord.x: null);
				(coord.y < result.y1)?
					result.y1 = coord.y: (
						(coord.y > result.y2)? result.y2 = coord.y: null);
				if (is3D)
					(coord.z < result.z1)?
						result.z1 = coord.z: (
							(coord.z > result.z2)? result.z2 = coord.z: null);
			}
		}
		return result;
		*/
		return this.getNodesContainBox(this.getNodes(), coordMode, allowCoordBorrow);
	},
	/**
	 * Calculate the 2D box to fit all nodes in CTable.
	 * @param {Bool} allowCoordBorrow
	 * @returns {Hash} 2D box information. {x1, y1, x2, y2, width, height}.
	 */
	getContainerBox2D: function(allowCoordBorrow)
	{
		var result = this.getContainerBox(Kekule.CoordMode.COORD2D, allowCoordBorrow);
		result.width = result.x2 - result.x1;
		result.height = result.y2 - result.y1;
		return result;
	},
	/**
	 * Calculate the 3D box to fit all nodes in CTable.
	 * @param {Bool} allowCoordBorrow
	 * @returns {Hash} 3D box information. {x1, y1, z1, x2, y2, z2, deltaX, deltaY, deltaZ}.
	 */
	getContainerBox3D: function(allowCoordBorrow)
	{
		var result = this.getContainerBox(Kekule.CoordMode.COORD3D, allowCoordBorrow);
		result.deltaX = result.x2 - result.x1;
		result.deltaY = result.y2 - result.y1;
		result.deltaZ = result.z2 - result.z1;
		return result;
	}
});

/**
 * Represent an abstract container of nodes (molecule, substitution, group...) in chemical structure.
 * @class
 * @augments Kekule.ChemStructureNode
 * @param {String} id Id of this node.
 * @param {Object} coord2D The 2D coordinates of node, {x, y}, can be null.
 * @param {Object} coord3D The 3D coordinates of node, {x, y, z}, can be null.
 *
 * @property {Kekule.MolecularFormula} formula Formula of this container.
 *   Usually used for some simple structures (such as inorganic molecules).
 *   Formual can also be calculated from {@link Kekule.StructureConnectionTable}.
 * @property {Kekule.StructureConnectionTable} ctab Connection table of this container.
 *   Usually used for some complex structures (such as organic molecules).
 * @property {Array} nodes All structure nodes in this fragment.
 * @property {Array} anchorNodes Nodes that can have bond connected to other structure nodes.
 * @property {Array} connectors Connectors (usually bonds) in this container.
 * @property {Array} crossConnectors Connectors outside the fragment connected to nodes inside fragment. Read only.
 * @property {Array} nonHydrogenNodes All structure nodes except hydrogen atoms in this fragment.
 * @property {Array} nonHydrogenConnectors Connectors except ones connected to hydrogen atoms in this fragment.
 * @property {Kekule.StructureFragmentShadow} flattenedShadow A shadow that "flatten" this structure fragment,
 *   unmarshalling all subgroups. Some algorithms (e.g., stereo detection) need to be carried out on flattened
 *   structure, this shadow may prevent the original structure from being modified.
 */
Kekule.StructureFragment = Class.create(Kekule.ChemStructureNode,
/** @lends Kekule.StructureFragment# */
{
	/** @private */
	CLASS_NAME: 'Kekule.StructureFragment',
	/**
	 * @constructs
	 */
	initialize: function($super, id, coord2D, coord3D)
	{
		$super(id, coord2D, coord3D);
	},
	doFinalize: function($super)
	{
		if (this.hasFormula())
			this.getFormula().finalize();
		if (this.hasCtab())
			this.getCtab().finalize();
		$super();

		/*
		this.addEventListener('change', function(e){
			var target = e.target;
			if (target instanceof Kekule.ChemStructureObject)
			{
				// clear aromaticRings, change of node or connector may cause aromatic change
				this.setPropStoreFieldValue('aromaticRings', []);
			}
		});
		*/
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('formula', {
			'dataType': 'Kekule.MolecularFormula',
			'getter': function(allowCreate)
				{
					if (!this.getPropStoreFieldValue('formula'))
					{
						if (allowCreate)
						{
							this.createFormula();
						}
					}
					return this.getPropStoreFieldValue('formula');
				},
			'setter': function(value)
				{
					var old = this.getPropStoreFieldValue('formula');
					if (old)
					{
						old.finalize();
						old = null;
					}

					if (value)
					{
						value.setPropValue('parent', this, true);
						value.addEventListener('change', function(e){
							this.notifyPropSet('formula', this.getFormula());
						}, this);
					}

					this.setPropStoreFieldValue('formula', value);
				}
		});
		this.defineProp('ctab', {
			'dataType': 'Kekule.StructureConnectionTable',
			'getter': function(allowCreate)
				{
					if (!this.getPropStoreFieldValue('ctab'))
					{
						if (allowCreate)
							this.createCtab();
					}
					return this.getPropStoreFieldValue('ctab');
				},
			'setter': function(value)
			{
				var old = this.getPropStoreFieldValue('ctab');
				if (old)
				{
					old.finalize();
					old = null;
				}

				if (value)
				{
					value.setPropValue('parent', this, true);
					value.setOwner(this.getOwner());
					// install event listeners to ctab
					value.addEventListener('propValueSet',
						function(e)
						{
							if ((e.propName == 'nodes') || (e.propName == 'anchorNodes') || (e.propName == 'connectors'))
							{
								//console.log('mol prop set', e.propName, e.propValue);
								this.notifyPropSet(e.propName, e.propValue);
							}
						}, this);
					value.setEnablePropValueSetEvent(true); // to enable propValueSet event
				}

				this.setPropStoreFieldValue('ctab', value);
			}
		});
		// values are read from ctab
		this.defineProp('nodes', {
			'dataType': DataType.ARRAY,
			'serializable': false,
			'scope': Class.PropertyScope.PUBLISHED,
			'setter': null,
			'getter': function() { return this.hasCtab()? this.getCtab().getNodes(): []; }
		});
		this.defineProp('anchorNodes', {
			'dataType': DataType.ARRAY,
			'serializable': false,
			'scope': Class.PropertyScope.PUBLISHED,
			'setter': null,
			'getter': function() { return this.hasCtab()? this.getCtab().getAnchorNodes(): []; }
		});
		this.defineProp('connectors', {
			'dataType': DataType.ARRAY,
			'serializable': false,
			'scope': Class.PropertyScope.PUBLISHED,
			'setter': null,
			'getter': function() { return this.hasCtab()? this.getCtab().getConnectors(): []; }
		});

		this.defineProp('crossConnectors', {
			'dataType': DataType.ARRAY,
			'serializable': false,
			'setter': null,
			'scope': Class.PropertyScope.PUBLIC,
			'getter': function()
				{
					//var result = [].concat(this.getLinkedConnectors());
					var result = [].concat(this.getPropStoreFieldValue('linkedConnectors'));
					// check external connectors of anchor nodes
					for (var i = 0, l = this.getNodeCount(); /*this.getAnchorNodeCount();*/ i < l; ++i)
					{
						//var connectors = this.getAnchorNodeAt(i).getLinkedConnectors();
						var node = this.getNodeAt(i);
						var connectors = node.getLinkedConnectors() || [];
						/*
						if (node.getCrossConnectors())
							Kekule.ArrayUtils.pushUnique(connectors, node.getCrossConnectors());
						*/
						for (var j = 0, k = connectors.length; j < k; ++j)
						{
							if (this.indexOfConnector(connectors[j]) < 0) // external connector
							{
								Kekule.ArrayUtils.pushUnique(result, connectors[j]);
							}
						}
					}
					return result;
				}
		});
		this.defineProp('nonHydrogenNodes', {
			'dataType': DataType.ARRAY,
			'scope': Class.PropertyScope.PUBLIC,
			'serializable': false,
			'setter': null,
			'getter': function()
			{
				return this.hasCtab()? this.getCtab().getNonHydrogenNodes(): [];
			}
		});
		this.defineProp('nonHydrogenConnectors', {
			'dataType': DataType.ARRAY,
			'scope': Class.PropertyScope.PUBLIC,
			'serializable': false,
			'setter': null,
			'getter': function()
			{
				return this.hasCtab()? this.getCtab().getNonHydrogenConnectors(): [];
			}
		});
		this.defineProp('canonicalizationInfo', {
			'dataType': DataType.OBJECT,
			'serializable': false,
			'scope': Class.PropertyScope.PUBLIC
		});
		this.defineProp('aromaticRings', {
			'dataType': DataType.ARRAY,
			'serializable': false,
			'scope': Class.PropertyScope.PUBLIC,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('aromaticRings');
				if (!result)
				{
					result = [];
					this.setPropStoreFieldValue('aromaticRings', result);
				}
				return result;
			}
		});

		this.defineProp('flattenedShadow', {
			'dataType': 'Kekule.StructureFragmentShadow',
			'serializable': false,
			'scope': Class.PropertyScope.PRIVATE,
			'getter': function(autoCreate)
			{
				var result = null;
				if (Kekule.ObjUtils.isUnset(autoCreate))
					autoCreate = true;
				var shadowOnSelf = this.getFlattenedShadowOnSelf();
				if (shadowOnSelf)   // no explicit shadow object, shadow maps on self
					return null;
				else // has sub fragment, need explicit shadow object
				{
					result = this.getPropStoreFieldValue('flattenedShadow');
					if (!result && autoCreate)
					{
						//console.log('create shadow');
						result = new Kekule.StructureFragmentShadow(this);
						var shadowFragment = result.getShadowFragment();// this.getFlattenedShadowFragment();
						shadowFragment.unmarshalAllSubFragments(true);
						// copy structure info (e.g., ringInfo, aromatic info) to shadow
						this._copyAdditionalInfoToShadowFragment(shadowFragment, result.getSourceToShadowMap(), result.getShadowToSourceMap());
						this.setPropStoreFieldValue('flattenedShadow', result);
					}
				}

				return result;
			}
		});
		// a special property, marks that this fragment has no subgroup, and the flattenedShadow is actually map to itself
		this.defineProp('flattenedShadowOnSelf', {'dataType': DataType.BOOL, 'serializable': false, 'scope': Class.PropertyScope.PROVATE,
			'setter': null,
			'getter': function()
			{
				var result = this.setPropStoreFieldValue('flattenedShadowOnSelf');
				if (Kekule.ObjUtils.isUnset(result))
				{
					result = !this.hasSubFragments();
					this.setPropStoreFieldValue('flattenedShadowOnSelf', result);
				}
				return result;
			}
		});
	},
	/** @private */
	getAutoIdPrefix: function()
	{
		return 'f';
	},
	/** @ignore */
	getStructureRelatedPropNames: function($super)
	{
		return $super().concat(['ctab', 'formula', 'nodes', 'anchorNodes', 'connectors']);
	},

	/** @ignore */
	doCompare: function($super, targetObj, options)
	{
		var result = $super(targetObj, options);
		if (!result && options.method === Kekule.ComparisonMethod.CHEM_STRUCTURE)
		{
			//if (this._getComparisonOptionFlagValue(options, 'atom'))
			{
				// TODO: now only check whether contains ctab or formula
				var hasCtab1 = this.hasCtab();
				var hasCtab2 = targetObj.hasCtab && targetObj.hasCtab();
				result = hasCtab1? (hasCtab2? 0: 1): (hasCtab2? -1: 0);
				if (!result)
				{
					var hasFormula1 = this.hasFormula();
					var hasFormula2 = targetObj.hasFormula && targetObj.hasFormula();
					result = hasFormula1? (hasFormula2? 0: 1): (hasFormula2? -1: 0);
				}

				// both has ctab, comparing child nodes and connectors
				if (!result && this.hasCtab())
				{
					if ((result === 0) && (this.getNonHydrogenNodes && targetObj.getNonHydrogenNodes))  // structure fragment, if with same node and connector count, compare nodes and connectors
					{
						var nodes1 = this.getNonHydrogenNodes();
						var nodes2 = targetObj.getNonHydrogenNodes();
						result = nodes1.length - nodes2.length;
						if (result === 0)
						{
							for (var i = 0, l = nodes1.length; i < l; ++i)
							{
								result = this.doCompareOnValue(nodes1[i], nodes2[i], options);
								if (result !== 0)
									break;
							}
						}
					}
					if ((result === 0) && (this.getConnectors && targetObj.getConnectors))
					{
						var connectors1 = this.getNonHydrogenConnectors();
						var connectors2 = targetObj.getNonHydrogenConnectors();
						result = connectors1.length - connectors2.length;
						if (result === 0)
						{
							for (var i = 0, l = connectors1.length; i < l; ++i)
							{
								result = this.doCompareOnValue(connectors1[i], connectors2[i], options);
								if (result !== 0)
									break;
							}
						}
					}
				}
			}
		}
		return result;
	},

	/** @ignore */
	structureChange: function($super, originObj)
	{
		// when structure is changed, clear old shadow fragment
		this.setPropStoreFieldValue('flattenedShadowOnSelf', null);
		var shadow = this.getFlattenedShadow(false);
		if (shadow)
		{
			shadow.finalize();
			this.setPropStoreFieldValue('flattenedShadow', null);
		}
		$super(originObj);
	},
	/** @ignore */
	clearStructureFlags: function($super)
	{
		$super();
		this.setPropStoreFieldValue('canonicalizationInfo', null);
		this.setPropStoreFieldValue('aromaticRings', []);

		// also clear flags of children (e.g., parity of atoms and bonds)
		for (var i = 0, l = this.getChildCount(); i < l; ++i)
		{
			var c = this.getChildAt(i);
			if (c.clearStructureFlags)
				c.clearStructureFlags();
		}
	},
	/** @private */
	ownerChanged: function($super, newOwner)
	{
		if (this.hasCtab())
			this.getCtab().setOwner(newOwner);
		$super(newOwner);
	},
	/** @private */
	_removeChildObj: function(obj)
	{
		if (this.hasFormula())
		{
			var formula = this.getFormula();
			if (formula === obj)
			{
				this.removeFormula();
			}
		}
		else if (this.hasCtab())
		{
			var ctab = this.getCtab();
			if (ctab === obj)
				this.removeCtab();
			else
			{
				if (ctab.hasChildObj(obj))
					ctab.removeChildObj(obj);
			}
		}
	},

	/**
	 * Returns if this fragment has no formula or ctab, or ctab has no nodes or connectors.
	 * @return {Bool}
	 */
	isEmpty: function()
	{
		//var result = $super();
		//if (result)
		var result;
		{
			result = !this.hasFormula();
			if (result)
			{
				result = !this.hasCtab();
				if (!result)  // check if ctab is empty
				{
					result = this.getCtab().isEmpty();
				}
			}
		}
		return result;
	},
	/**
	 * Returns if the ctab of this structure fragment has no nodes or connectors.
	 * @return {Bool}
	 */
	isCtabEmpty: function()
	{
		return !this.hasCtab() || this.getCtab().isEmpty();
	},

	/** @ignore */
	doGetLinkedConnectors: function()
	{
		return this.getCrossConnectors();
	},
	/* @ignore */

	appendLinkedConnector: function($super, connector)
	{
		var actualLinkedNode = this.getCurrConnectableObj();
		if (actualLinkedNode && actualLinkedNode !== this) // instead of link connector to self, we'd rather link connector to child anchor node
			return actualLinkedNode.appendLinkedConnector(connector);
		else  // no child, link to self
		  return $super(connector);
	},


	/** @ignore */
	getCurrConnectableObj: function()
	{
		// instead of link connector to self, we'd rather link connector to child anchor node
		var candidates = (this.getAnchorNodeCount() > 0)? this.getAnchorNodes(): this.getNodes();
		if (candidates.length <= 0)
			return this;
		else  // iterate all candidates, find the first one with min cross connector count
		{
			var allCrossConnectors = this.getCrossConnectors();
			var minCrossConnectorCount = null;
			var minNode = null;
			for (var i = 0, l = candidates.length; i < l; ++i)
			{
				var node = candidates[i];
				var connectors = node.getLinkedConnectors();
				var crossConnectors = Kekule.ArrayUtils.intersect(connectors, allCrossConnectors);
				var crossConnectorCount = crossConnectors.length;
				if (minCrossConnectorCount === null || minCrossConnectorCount > crossConnectorCount)
				{
					minCrossConnectorCount = crossConnectorCount;
					minNode = node;
				}
			}
			return minNode;
		}
		//return this.getAnchorNodeAt(0) || this.getNodeAt(0) || this.getChildAt(0) || this;
	},

	/** @private */
	createCtab: function()
	{
		var ctab = new Kekule.StructureConnectionTable(this.getOwner(), this);
		this.setCtab(ctab);
	},
	/** @private */
	createFormula: function()
	{
		var formula = new Kekule.MolecularFormula(this);
		this.setFormula(formula);
	},
	/*
	// Notify {@link Kekule.StructureFragment#nodes} property has been changed
	notifyNodesChanged: function()
	{
		this.notifyPropSet('nodes', this.getPropStoreFieldValue('nodes'));
	},
	// Notify {@link Kekule.StructureFragment#anchorNodes} property has been changed
	notifyAnchorNodesChanged: function()
	{
		this.notifyPropSet('anchorNodes', this.getPropStoreFieldValue('anchorNodes'));
	},
	// Notify {@link Kekule.StructureFragment#connectors} property has been changed
	notifyConnectorsChanged: function()
	{
		this.notifyPropSet('connectors', this.getPropStoreFieldValue('connectors'));
	},
	*/

	/**
	 * Check whether a connection table is used to represent this fragment.
	 */
	hasCtab: function()
	{
		return (!!this.getPropStoreFieldValue('ctab'));
	},
	/**
	 * Check whether a formula is used to represent this fragment.
	 */
	hasFormula: function()
	{
		return (!!this.getPropStoreFieldValue('formula'));
	},

	/**
	 * Delete formula info from this fragment.
	 */
	removeFormula: function()
	{
		var f = this.getPropStoreFieldValue('formula');
		if (f)
		{
			f.finalize();
			f = null;
			this.setPropStoreFieldValue('formula', null);
		}
		return this;
	},
	/**
	 * Delete ctab info from this fragment.
	 */
	removeCtab: function()
	{
		var f = this.getPropStoreFieldValue('ctab');
		if (f)
		{
			f.finalize();
			f = null;
			this.setPropStoreFieldValue('ctab', null);
		}
		return this;
	},

	/**
	 * Calculate the box to fit all sub molecule.
	 * @param {Int} coordMode Determine to calculate 2D or 3D box. Value from {@link Kekule.CoordMode}.
	 * @param {Bool} allowCoordBorrow
	 * @returns {Hash} Box information. {x1, y1, z1, x2, y2, z2} (in 2D mode z1 and z2 will not be set).
	 */
	getContainerBox: function($super, coordMode, allowCoordBorrow)
	{
		if (this.hasCtab())
		{
			return this.getCtab().getContainerBox(coordMode, allowCoordBorrow);
		}
		else
			return $super(coordMode);
	},

	/**
	 * Get a structure node object with a specified id.
	 * @param {String} id
	 * @returns {Kekule.ChemStructureNode}
	 */
	getNodeById: function(id)
	{
		/*
		var nodes = this.getNodes();
		for (var i = 0, l = nodes.length; i < l; ++i)
		{
			if (nodes[i].getId() == id)
				return nodes[i];
		}
		return null;
		*/
		return this.hasCtab()? this.getCtab().getNodeById(id): null;
	},
	/**
	 * Get a structure connector object with a specified id.
	 * @param {String} id
	 * @returns {Kekule.ChemStructureConnector}
	 */
	getConnectorById: function(id)
	{
		/*
		var connectors = this.getConnectors();
		for (var i = 0, l = connectors.length; i < l; ++i)
		{
			if (connectors[i].getId() == id)
				return connectors[i];
		}
		return null;
		*/
		return this.hasCtab()? this.getCtab().getConnectorById(id): null;
	},
	/**
	 * Get a structure node or connector object with a specified id.
	 * @param {String} id
	 * @returns {Kekule.ChemStructureObject}
	 */
	getObjectById: function(id)
	{
		var node = this.getNodeById(id);
		return node? node: this.getConnectorById(id);
	},
	/**
	 * Return count of nodes.
	 * @returns {Int}
	 */
	getNodeCount: function()
	{
		return this.hasCtab()? this.getCtab().getNodeCount(): 0;
	},
	/**
	 * Get node at index.
	 * @param {Int} index
	 * @returns {Kekule.ChemStructureNode}
	 */
	getNodeAt: function(index)
	{
		return this.hasCtab()? this.getCtab().getNodeAt(index): null;
	},
	/**
	 * Get index of node.
	 * @param {Kekule.ChemStructureNode} node
	 * @returns {Int}
	 */
	indexOfNode: function(node)
	{
		return this.hasCtab()? this.getCtab().indexOfNode(node): -1;
	},
	/**
	 * Check if a node exists in structure.
	 * @param {Kekule.ChemStructureNode} node Node to seek.
	 * @param {Bool} checkNestedStructure If true the nested sub groups will also be checked.
	 * @returns {Bool}
	 */
	hasNode: function(node, checkNestedStructure)
	{
		return this.hasCtab()? the.getCtab().hasNode(node, checkNestedStructure): null;
	},
	/**
	 * Returns index of node. If node exists in nested sub group, index in sub group will be pushed to stack as well.
	 * @param {Kekule.ChemStructureNode} node
	 * @returns {Variant} If node is the direct child of this structure, returns {Int}, otherwise stack {Array} will be returned.
	 */
	indexStackOfNode: function(node)
	{
		return this.hasCtab()? this.getCtab().indexStackOfNode(node): -1;
	},
	/**
	 * Get node at indexStack.
	 * For example, indexStack is [2, 3, 1], then this.getNodeAt(2).getNodeAt(3).getNodeAt(1) will be returned.
	 * @param {Array} indexStack Array of integers.
	 * @returns {Kekule.ChemStructureNode}
	 */
	getNodeAtIndexStack: function(indexStack)
	{
		return this.hasCtab()? this.getCtab().getNodeAtIndexStack(indexStack): null;
	},
	/**
	 * Returns direct child object of ctab which hold node as nested child.
	 * @returns {Kekule.StructureFragment}
	 */
	getDirectChildOfNestedNode: function(node)
	{
		var p = node.getParent();
		if (!p)
			return null;
		else if (p === this)
			return p;
		else
		{
			var curr = node;
			while (p && (p.getParent) && (p !== this))
			{
				curr = p;
				p = p.getParent();
			}
			if (p === this)
				return curr;
			else
				return null;
		}
	},
	/**
	 * Add node to container. If node already in container, nothing will be done.
	 * @param {Kekule.ChemStructureNode} node
	 */
	appendNode: function(node)
	{
		/*
		if (this.getNodes().indexOf(node) >= 0) // already exists
			;// do nothing
		else
		{
			var result = this.getNodes().push(node);
			this.notifyNodesChanged();
			return result;
		}
		*/
		return this.doGetCtab(true).appendNode(node);
	},
	/**
	 * Insert node to index. If index is not set, node will be inserted as the first node of ctab.
	 * @param {Kekule.ChemStructureNode} node
	 * @param {Int} index
	 */
	insertNodeAt: function(node, index)
	{
		return this.doGetCtab(true).insertNodeAt(node, index);
	},
	/**
	 * Remove node at index in container.
	 * @param {Int} index
	 * @param {Bool} preserveLinkedConnectors Whether remove relations between this node and linked connectors.
	 */
	removeNodeAt: function(index, preserveLinkedConnectors)
	{
		/*
		var node = this.getNodes()[index];
		if (node)
		{
			// remove from connectors
			this.removeConnectNode(node);
			this.getNodes().removeAt(index);
			this.notifyNodesChanged();
		}
		*/
		if (!this.hasCtab())
			return null;
		return this.getCtab().removeNodeAt(index, preserveLinkedConnectors);
	},
	/**
	 * Remove a node in container.
	 * @param {Kekule.ChemStructureNode} node
	 * @param {Bool} preserveLinkedConnectors Whether remove relations between this node and linked connectors.
	 */
	removeNode: function(node, preserveLinkedConnectors)
	{
		/*
		var index = this.getNodes().indexOf(node);
		if (index >= 0)
			this.removeNodeAt(index);
		*/
		if (!this.hasCtab())
			return null;
		return this.getCtab().removeNode(node, preserveLinkedConnectors);
	},
	/**
	 * Replace oldNode with new one, preserve coords and all linked connectors.
	 * @param {Kekule.ChemStructureNode} oldNode Must be direct child of current fragment (node in nested structure fragment will be ignored).
	 * @param {Kekule.ChemStructureNode} newNode
	 */
	replaceNode: function(oldNode, newNode)
	{
		if (!this.hasCtab())
			return null;
		return this.getCtab().replaceNode(oldNode, newNode);
	},
	/**
	 * Remove all nodes.
	 */
	clearNodes: function()
	{
		if (this.hasCtab())
			return this.getCtab().clearNodes();
	},
	/**
	 * Sort direct child nodes in structure fragment.
	 * @param {Function} sortFunc Function to determine the priority of nodes.
	 */
	sortNodes: function(sortFunc)
	{
		if (this.hasCtab())
			return this.getCtab().sortNodes(sortFunc);
	},
	/**
	 * Check if child nodes has 2D coord.
	 * @param {Bool} allowCoordBorrow
	 * @returns {Bool}
	 */
	nodesHasCoord2D: function(allowCoordBorrow)
	{
		if (!this.hasCtab())
			return false;
		return this.getCtab().nodesHasCoord2D(allowCoordBorrow);
	},
	/**
	 * Check if child nodes has 3D coord.
	 * @param {Bool} allowCoordBorrow
	 * @returns {Bool}
	 */
	nodesHasCoord3D: function(allowCoordBorrow)
	{
		if (!this.hasCtab())
			return false;
		return this.getCtab().nodesHasCoord3D(allowCoordBorrow);
	},

	/**
	 * Check if a node is in aromatic ring stored in aromaticRings property.
	 * @param {Kekule.ChemStructureNode} node
	 * @returns {Bool}
	 */
	isNodeInAromaticRing: function(node)
	{
		var rings = this.getAromaticRings();
		for (var i = 0, l = rings.length; i < l; ++i)
		{
			var nodes = rings[i].nodes;
			if (nodes.indexOf(node) >= 0)
				return true;
		}
		return false;
	},

	/**
	 * Util method to create a new Kekule.Atom instance and append to current connection table.
	 * @param {Variant} elemSymbolOrAtomicNumber
	 * @param {Number} massNumber
	 * @param {Hash} coord2D
	 * @param {Hash} coord3D
	 * @returns {Kekule.Atom}
	 * @private
	 */
	appendAtom: function(elemSymbolOrAtomicNumber, massNumber, coord2D, coord3D)
	{
		return this.doGetCtab(true).appendAtom(elemSymbolOrAtomicNumber, massNumber, coord2D, coord3D);
	},

	/**
	 * Return count of anchorNodes.
	 * @returns {Int}
	 */
	getAnchorNodeCount: function()
	{
		return this.hasCtab()? this.getCtab().getAnchorNodeCount(): 0;
	},
	/**
	 * Get anchor node at index.
	 * @param {Int} index
	 * @returns {Kekule.ChemStructureNode}
	 */
	getAnchorNodeAt: function(index)
	{
		//return this.getAnchorNodes()[index];
		return this.hasCtab()? this.getCtab().getAnchorNodeAt(index): null;
	},
	/**
	 * Get index of anchor node.
	 * @param {Kekule.ChemStructureNode} node
	 * @returns {Int}
	 */
	indexOfAnchorNode: function(node)
	{
		return this.hasCtab()? this.getCtab().indexOfAnchorNode(node): -1;
	},
	/**
	 * Add anchor node of container. If node not in nodes container, nothing will be done.
	 * @param {Kekule.ChemStructureNode} node
	 */
	appendAnchorNode: function(node)
	{
		/*
		if (this.getNodes().indexOf(node) >= 0)
		{
			if (this.getAnchorNodes().indexOf(node) < 0)
			{
				this.getAnchorNodes().push(node);
				this.notifyAnchorNodesChanged();
			}
		}
		*/
		return this.doGetCtab(true).appendAnchorNode(node);
	},
	/**
	 * Remove node at index of anchorNodes.
	 * @param {Int} index
	 */
	removeAnchorNodeAt: function(index)
	{
		/*
		var node = this.getAnchorNodes()[index];
		if (node)
		{
			this.getAnchorNodes().removeAt(index);
			this.notifyAnchorNodesChanged();
		}
		*/
		if (!this.hasCtab())
			return null;
		return this.getCtab().removeAnchorNodeAt(index);
	},
	/**
	 * Remove a node in anchorNodes.
	 * @param {Kekule.ChemStructureNode} node
	 */
	removeAnchorNode: function(node)
	{
		/*
		var index = this.getAnchorNodes().indexOf(node);
		if (index >= 0)
			this.removeAnchorNodeAt(index);
		*/
		if (!this.hasCtab())
			return null;
		return this.getCtab().removeAnchorNode(node);
	},
	/**
	 * Remove all anchor nodes.
	 */
	clearAnchorNodes: function()
	{
		if (this.hasCtab())
			return this.getCtab().clearAnchorNodes();
	},
	/**
	 * Return count of connectors.
	 * @returns {Int}
	 */
	getConnectorCount: function()
	{
		return this.hasCtab()? this.getCtab().getConnectorCount(): 0;
	},
	/**
	 * Get connector at index.
	 * @param {Int} index
	 * @returns {Kekule.ChemStructureConnector}
	 */
	getConnectorAt: function(index)
	{
		//return this.getConnectors()[index];
		return this.hasCtab()? this.getCtab().getConnectorAt(index): null;
	},
	/**
	 * Get index of connector inside fragment.
	 * @param {Kekule.ChemStructureConnector} connector
	 * @returns {Int}
	 */
	indexOfConnector: function(connector)
	{
		return this.hasCtab()? this.getCtab().indexOfConnector(connector): -1;
	},
	/**
	 * Check if a connector exists in structure.
	 * @param {Kekule.ChemStructureConnector} connector Connector to seek.
	 * @param {Bool} checkNestedStructure If true the nested sub groups will also be checked.
	 * @returns {Bool}
	 */
	hasConnector: function(connector, checkNestedStructure)
	{
		return this.hasCtab()? this.getCtab().hasConnector(connector, checkNestedStructure): null;
	},
	/**
	 * Add connector to container.
	 * @param {Kekule.ChemStructureConnector} connector
	 */
	appendConnector: function(connector)
	{
		/*
		if (this.getConnectors().indexOf(connector) >= 0) // already exists
			;// do nothing
		else
		{
			return this.getConnectors().push(connector);
			this.notifyConnectorsChanged();
		}
		*/
		return this.doGetCtab(true).appendConnector(connector);
	},
	/**
	 * Insert connector to index. If index is not set, node will be inserted as the first connector of ctab.
	 * @param {Kekule.ChemStructureConnector} connector
	 * @param {Int} index
	 */
	insertConnectorAt: function(connector, index)
	{
		return this.doGetCtab(true).insertConnectorAt(connector, index);
	},
	/**
	 * Remove connector at index of connectors.
	 * @param {Int} index
	 * @param {Bool} preserveConnectedObjs Whether delte relations between this connector and related nodes.
	 */
	removeConnectorAt: function(index, preserveConnectedObjs)
	{
		/*
		var connector = this.getConnectors()[index];
		if (connector)
		{
			this.getConnectors().removeAt(index);
			this.notifyConnectorsChanged();
		}
		*/
		if (!this.hasCtab())
			return null;
		return this.getCtab().removeConnectorAt(index, preserveConnectedObjs);
	},
	/**
	 * Remove a connector in container.
	 * @param {Kekule.ChemStructureConnector} connector
	 * @param {Bool} preserveConnectedObjs Whether delte relations between this connector and related nodes.
	 */
	removeConnector: function(connector, preserveConnectedObjs)
	{
		/*
		var index = this.getConnectors().indexOf(connector);
		if (index >= 0)
			this.removeConnectorAt(index);
		*/
		if (!this.hasCtab())
			return null;
		return this.getCtab().removeConnector(connector, preserveConnectedObjs);
	},
	/**
	 * Remove all connectors.
	 */
	clearConnectors: function()
	{
		if (this.hasCtab())
			return this.getCtab().clearConnectors();
	},
	/**
	 * Sort direct child connectors in structure fragment.
	 * @param {Function} sortFunc Function to determine the priority of nodes.
	 */
	sortConnectors: function(sortFunc)
	{
		if (this.hasCtab())
			return this.getCtab().sortConnectors(sortFunc);
	},

	/**
	 * Check if a connector is in aromatic ring stored in aromaticRings property.
	 * @param {Kekule.ChemStructureConnector} connector
	 * @returns {Bool}
	 */
	isConnectorInAromaticRing: function(connector)
	{
		var rings = this.getAromaticRings();
		for (var i = 0, l = rings.length; i < l; ++i)
		{
			var connectors = rings[i].connectors;
			if (connectors.indexOf(connector) >= 0)
				return true;
		}
		return false;
	},

	/**
	 * A util method to create a new bond object connected with nodes and append to current connection table.
	 * @param {Array} nodesOrIndexes Array of connected nodes or indexes of those nodes
	 * @param {Int} bondOrder Order of bond.
	 * @param {Int} bondType Type of bond.
	 * @returns {Kekule.Bond}
	 */
	appendBond: function(nodesOrIndexes, bondOrder, bondType)
	{
		return this.doGetCtab(true).appendBond(nodesOrIndexes, bondOrder, bondType);
	},

	/**
	 * Insert obj before refChild in node or connector list of ctab.
	 * If refChild is null or does not exists, obj will be append to tail of list.
	 * @param {Variant} obj A node or connector.
	 * @param {Variant} refChild Ref node or connector
	 * @return {Int} Index of obj after inserting.
	 */
	insertBefore: function(obj, refChild)
	{
		if (this.hasCtab())
			return this.getCtab().insertBefore(obj, refChild);
	},

	/**
	 * Returns nodes or connectors that should be removed cascadely with childObj.
	 * @param {Object} childObj
	 * @returns {Array}
	 * @private
	 */
	_getObjsNeedToBeCascadeRemoved: function(childObj, ignoredChildObjs)
	{
		if (this.hasCtab())
			return this.getCtab()._getObjsNeedToBeCascadeRemoved(childObj, ignoredChildObjs);
		else
			return [];
	},

	/**
	 * Remove childObj from connection table.
	 * @param {Variant} childObj A child node or connector.
	 * @param {Bool} cascadeRemove Whether remove related objects (e.g., bond connected to an atom).
	 * @param {Bool} freeRemoved Whether free all removed objects.
	 */
	removeChildObj: function(childObj, cascadeRemove, freeRemoved)
	{
		if (this.hasCtab())
			this.getCtab().removeChildObj(childObj, cascadeRemove, freeRemoved);
	},
	/**
	 * Remove child obj directly from connection table.
	 * @param {Variant} childObj A child node or connector.
	 */
	removeChild: function(obj)
	{
		return this.removeChildObj(obj);
	},

	/**
	 * Check if childObj is a child node or connector of this fragment's ctab.
	 * @param {Kekule.ChemObject} childObj
	 * @returns {Bool}
	 */
	hasChildObj: function(childObj)
	{
		if (this.hasCtab())
		{
			return this.getCtab().hasChildObj(childObj);
		}
		else
			return false;
	},

	/**
	 * Returns next sibling node or connector to childObj.
	 * @param {Variant} childObj Node or connector.
	 * @returns {Variant}
	 */
	getNextSiblingOfChild: function(childObj)
	{
		if (this.hasCtab())
			return this.getCtab().getNextSiblingOfChild(childObj);
		else
			return null;
	},

	/**
	 * Get count of child objects (including both nodes and connectors).
	 * @returns {Int}
	 */
	getChildCount: function()
	{
		if (this.hasCtab())
			return this.getCtab().getChildCount();
		else
			return 0;
	},
	/**
	 * Get child object (including both nodes and connectors) at index.
	 * @param {Int} index
	 * @returns {Variant}
	 */
	getChildAt: function(index)
	{
		if (this.hasCtab())
			return this.getCtab().getChildAt(index);
		else
			return null;
	},
	/**
	 * Get the index of obj in children list.
	 * @param {Variant} obj
	 * @returns {Int} Index of obj or -1 when not found.
	 */
	indexOfChild: function(obj)
	{
		if (this.hasCtab())
			return this.getCtab().indexOfChild(obj);
		else
			return -1;
	},

	/**
	 * Check if a node has a sub structure (has child nodes).
	 * Note if a sub group has no children, it will not be regarded as sub fragment.
	 * @param {Kekule.ChemStructureNode} node
	 * @returns {Bool}
	 */
	isSubFragment: function(node)
	{
		return (node.getNodeCount && (node.getNodeCount() > 0));
	},
	/**
	 * Get all sub fragments (node that have children, usually SubGroup).
	 * Note if a sub group has no children, it will not be regarded as sub fragment.
	 * @returns {Array} Array of {@link Kekule.StructureFragment}.
	 */
	getSubFragments: function()
	{
		return this.hasCtab()? this.getCtab().getSubFragments(): [];
	},
	/**
	 * Returns whether there are sub fragment(s) (node that have children, usually SubGroup) in this fragment.
	 * Note if a sub group has no children, it will not be regarded as sub fragment.
	 * @returns {Bool}
	 */
	hasSubFragments: function()
	{
		return this.hasCtab()? this.getCtab().hasSubFragments(): false;
	},
	/**
	 * Get all leaf nodes (node that do not have children, usually atom).
	 * Note if a sub group has no children, it will be regarded as leaf node too.
	 * @returns {Array} Array of {@link Kekule.ChemStructureNode}.
	 */
	getLeafNodes: function()
	{
		/*
		var result = [];
		for (var i = 0, l = this.getNodeCount(); i < l; ++i)
		{
			var node = this.getNodeAt(i);
			if (!this.isSubFragment(node))
				result.push(node);
			else if (node.getLeafNodes)
			{
				var leafs = node.getLeafNodes();
				result = result.concat(leafs);
			}
		}
		return result;
		*/
		return this.hasCtab()? this.getCtab().getLeafNodes(): [];
	},
	/**
	 * Returns the direct node/substructure that contains originObj.
	 * originObj may be a child node or connector of substructure in this structure fragment.
	 * If originObj is actually not in this ctab, null will be returned.
	 * @param {Kekule.ChemStructureObject} originObj
	 * @returns {Kekule.ChemStructureNode}
	 */
	findDirectChildOfObj: function(originObj)
	{
		return this.hasCtab()? this.getCtab().findDirectChildOfObj(originObj): null;
	},
	/**
	 * Return all bonds in structure as well as in sub structure.
	 * @returns {Array} Array of {Kekule.ChemStructureConnector}.
	 */
	getAllChildConnectors: function()
	{
		/*
		var result = [].concat(this.getConnectors());
		var subFrags = this.getSubFragments();
		for (var i = 0, l = subFrags.length; i < l; ++i)
		{
			if (subFrags[i].getAllChildConnectors)
				result = result.concat(subFrags[i].getAllChildConnectors());
		}
		return result;
		*/
		return this.hasCtab()? this.getCtab().getAllChildConnectors(): [];
	},
	/**
	 * Return all bonds in structure as well as in sub structure.
	 * @returns {Array} Array of {Kekule.ChemStructureConnector}.
	 */
	getAllContainingConnectors: function()
	{
		return this.hasCtab()? this.getCtab().getAllContainingConnectors(): [];
	},

	/**
	 * Clear all CTab and formula struuctures.
	 */
	clear: function()
	{
		if (this.hasCtab())
			this.setCtab(undefined);
		if (this.hasFormula())
			this.setFormula(undefined);
	},

	/**
	 * Calculate molecular formula from this connection table.
	 * @returns {Kekule.MolecularFormula}
	 */
	calcFormula: function()
	{
		if (this.hasCtab())
			return this.getCtab().calcFormula();
		else if (this.hasFormula())
			return this.getFormula();
		else
			return null;
	},

	/**
	 * Group up nodes and turn them into a new sub {@link Kekule.StructureFragment}.
	 * @param {Array} groupNodes A set of {@link Kekule.ChemStructureNode}, must in target structure.
	 * @param {Kekule.StructureFragment} subFragment new sub group.
	 * @returns {Kekule.StructureFragment}
	 */
	marshalSubFragment: function(groupNodes, subFragment)
	{
		if (this.hasCtab())
		{
			this.beginUpdate();
			try
			{
				this.appendNode(subFragment);
				var nodes = [];
				var anchors = [];
				var innerConnectors = [];
				var externalConnectors = [];
				// find out how many nodes and connectors should be moved to subFragment
				for (var i = 0, l = groupNodes.length; i < l; ++i)
				{
					var node = groupNodes[i];
					if (this.indexOfNode(node) < 0) // node not in this, bypass
						continue;
					var isAnchor = false;
					var connectors = node.getLinkedConnectors();
					for (var j = 0, k = connectors.length; j < k; ++j)
					{
						var connector = connectors[j];
						var isExternalConnector = false;
						var objs = connector.getConnectedObjs();
						for (var m = 0, n = objs.length; m < n; ++m)
						{
							var obj = objs[m];
							if (obj != node)
							{
								if (groupNodes.indexOf(obj) < 0) // has link external to nodes, this node should be an anchor
								{
									//anchors.push(node);
									isAnchor = true;
									isExternalConnector = true;
								}
							}
						}
						if (isExternalConnector)
							Kekule.ArrayUtils.pushUnique(externalConnectors, connector);
						else
							Kekule.ArrayUtils.pushUnique(innerConnectors, connector);
					}
					Kekule.ArrayUtils.pushUnique(nodes, node);
					if (isAnchor)
						Kekule.ArrayUtils.pushUnique(anchors, node);
				}

				// TODO: need test here
				// then remove node and internal connectors from original structure, but preserve relations
				for (var i = innerConnectors.length - 1; i >= 0; --i)
					this.removeConnector(innerConnectors[i], true);
				for (var i = nodes.length - 1; i >= 0; --i)
					this.removeNode(nodes[i], true);
				// then add them to the new subFragment
				subFragment.beginUpdate();
				try
				{
					for (var i = 0, l = nodes.length; i < l; ++i)
						subFragment.appendNode(nodes[i]);
					for (var i = 0, l = anchors.length; i < l; ++i)
						subFragment.appendAnchorNode(anchors[i]);
					for (var i = 0, l = innerConnectors.length; i < l; ++i)
						subFragment.appendConnector(innerConnectors[i]);
				}
				finally
				{
					subFragment.endUpdate();
				//subFragment.recalcCoords();
				}
			}
			finally
			{
				this.endUpdate();
			}

			return subFragment;
		}
		else
			return null;
	},
	/**
	 * Remove sub {@link Kekule.StructureFragment} and move its nodes and connectors into this fragment.
	 * @param {Kekule.StructureFragment} subFragment Sub fragment to be ungrouped.
	 * @param {Bool} cascade If subfragment should also unmarshal its children fragments.
	 */
	unmarshalSubFragment: function(subFragment, cascade)
	{
		if (this.hasCtab())
		{
			this.beginUpdate();
			try
			{
				subFragment.beginUpdate();
				try
				{
					if (cascade && subFragment.unmarshalAllSubFragments)
						subFragment.unmarshalAllSubFragments(cascade);

					var ctab = this.getCtab();
					/*
					for (var i = 0, l = subFragment.getNodeCount(); i < l; ++i)
						ctab.appendNode(subFragment.getNodeAt(i));
					for (var i = 0, l = subFragment.getConnectorCount(); i < l; ++i)
						ctab.appendConnector(subFragment.getConnectorAt(i));
					*/
					Kekule.StructureFragment.moveChildBetweenStructFragment(subFragment, this,
						subFragment.getNodes(), subFragment.getConnectors(), true);  // ignore anchor nodes
					subFragment.clear();
					ctab.removeNode(subFragment);
				}
				finally
				{
					subFragment.endUpdate();
					subFragment.finalize();
				}
			}
			finally
			{
				this.endUpdate();
			}
		}
	},
	/**
	 * Remove all sub {@link Kekule.StructureFragment} and move their nodes and connectors into this fragment.
	 * @param {Bool} cascade If subfragments should also unmarshal their children fragments.
	 */
	unmarshalAllSubFragments: function(cascade)
	{
		var sfs = this.getSubFragments();
		if (sfs)
		{
			for (var i = 0, l = sfs.length; i < l; ++i)
			{
				/*
				if (cascade && (sfs[i].unmarshalSubFragment))
					sfs[i].unmarshalSubFragment(cascade);
				*/
				this.unmarshalSubFragment(sfs[i], cascade);
			}
		}
	},

	/**
	 * Recalculate coords of group and child notes.
	 * The coords of child nodes are based on group coord, while group coord is calculated
	 * by anchorNodes. So those value may need to be recalculate when anchor nodes changed.
	 */
	recalcCoords: function()
	{
		if (this.hasCtab())
		{
			this.beginUpdate();
			try
			{
				//var has2D = this.hasCoord2D();
				//var has3D = this.hasCoord3D();
				var newCenter2D = {};  //{'x': 0, 'y': 0};
				var newCenter3D = {};  //{'x': 0, 'y': 0, 'z': 0};
				var anchorCount = this.getAnchorNodeCount();
				for (var i = 0, l = anchorCount; i < l; ++i)
				{
					var node = this.getAnchorNodeAt(i);
					//if (has2D)
						//newCenter2D = Kekule.CoordUtils.add(newCenter2D, node.fetchCoord2D());
					newCenter2D = Kekule.CoordUtils.add(newCenter2D, node.getCoord2D() || {});
					//if (has3D)
						//newCenter3D = Kekule.CoordUtils.add(newCenter3D, node.fetchCoord3D());
					newCenter3D = Kekule.CoordUtils.add(newCenter3D, node.getCoord3D() || {});
				}

				//if (has2D)
				var notUnset = Kekule.ObjUtils.notUnset;
				var has2D = (notUnset(newCenter2D.x) || notUnset(newCenter2D.y));
				var has3D = (notUnset(newCenter3D.x) || notUnset(newCenter3D.y) || notUnset(newCenter3D.z));
				if (has2D)
				{
					var delta2D = Kekule.CoordUtils.substract({}, newCenter2D);
					this.setCoord2D(Kekule.CoordUtils.substract(this.fetchCoord2D(), delta2D));
				}
				if (has3D)
				{
					var delta3D = Kekule.CoordUtils.substract({}, newCenter3D);
					this.setCoord3D(Kekule.CoordUtils.substract(this.fetchCoord3D(), delta3D));
				}

				for (var i = 0, l = this.getNodeCount(); i < l; ++i)
				{
					var node = this.getNodeAt(i);
					if (has2D)
						node.setCoord2D(Kekule.CoordUtils.add(node.fetchCoord2D(), delta2D));
					if (has3D)
						node.setCoord3D(Kekule.CoordUtils.add(node.fetchCoord3D(), delta3D));
				}
			}
			finally
			{
				this.endUpdate();
			}
		}
	},

	/**
	 * Copy additional structure info to shadow fragment.
	 * @param shadowFragment
	 * @param srcToShadowMap
	 * @param shadowToSrcMap
	 * @private
	 */
	_copyAdditionalInfoToShadowFragment: function(shadowFragment, srcToShadowMap, shadowToSrcMap)
	{
		var sourceFragment = this;
		// copy aromatic rings info
		var srcAromaticRings = sourceFragment.getAromaticRings();
		if (srcAromaticRings && srcAromaticRings.length)
		{
			var shadowAromaticRings = [];
			for (var i = 0, l = srcAromaticRings.length; i < l; ++i)
			{
				var srcAromaticRing = srcAromaticRings[i];
				var shadowNodes = [], shadowConnectors = [];
				for (var j = 0, k = srcAromaticRing.nodes.length; j < k; ++j)
				{
					var shadowObj = srcToShadowMap.get(srcAromaticRing.nodes[j]);
					if (shadowObj)
						shadowNodes.push(shadowObj);
				}
				for (var j = 0, k = srcAromaticRing.connectors.length; j < k; ++j)
				{
					var shadowObj = srcToShadowMap.get(srcAromaticRing.connectors[j]);
					if (shadowObj)
						shadowConnectors.push(shadowObj);
				}
				shadowAromaticRings.push({'nodes': shadowNodes, 'connectors': shadowConnectors});
			}
			shadowFragment.setAromaticRings(shadowAromaticRings);
		}
	},
	/**
	 * Returns the shadow fragment with all subgroups unmarshalled
	 * @param {Bool} autoCreate Whether allow to create new one when the shadow does not exists.
	 * @returns {Kekule.StructureFragment}
	 */
	getFlattenedShadowFragment: function(autoCreate)
	{
		if (this.getFlattenedShadowOnSelf())
			return this;
		else
		{
			var shadow = this.getFlattenedShadow(autoCreate);
			return shadow ? shadow.getShadowFragment() : null;
		}
	},
	/**
	 * Returns the flatterned shadowed object of source.
	 * @param {Kekule.ChemStructureObject} srcObj
	 * @returns {Kekule.ChemStructureObject}
	 */
	getFlatternedShadowShadowObj: function(srcObj, autoCreate)
	{
		if (this.getFlattenedShadowOnSelf())
			return srcObj;
		else
		{
			var shadow = this.getFlattenedShadow(autoCreate);
			return shadow ? shadow.getShadowObj(srcObj) : null;
		}
	},
	/**
	 * Returns the source object from flatterned shadow.
	 * @param {Kekule.ChemStructureObject} shadowObj
	 * @returns {Kekule.ChemStructureObject}
	 */
	getFlatternedShadowSourceObj: function(shadowObj, autoCreate)
	{
		if (this.getFlattenedShadowOnSelf())
			return shadowObj;
		else
		{
			var shadow = this.getFlattenedShadow(autoCreate);
			return shadow ? shadow.getSourceObj(shadowObj) : null;
		}
	},

	/**
	 * Returns the flatterned shadowed objects of source.
	 * @param {Array} srcObjs
	 * @returns {Array}
	 */
	getFlatternedShadowShadowObjs: function(srcObjs, autoCreate)
	{
		if (this.getFlattenedShadowOnSelf())
			return srcObjs;
		else
		{
			var shadow = this.getFlattenedShadow(autoCreate);
			var result = [];
			if (shadow)
			{
				for (var i = 0, l = srcObjs.length; i < l; ++i)
				{
					result.push(shadow.getShadowObj(srcObjs[i]))
				}
			}
			return result
		}
	},
	/**
	 * Returns the source objects from flatterned shadow.
	 * @param {Array} shadowObjs
	 * @returns {Array}
	 */
	getFlatternedShadowSourceObjs: function(shadowObjs, autoCreate)
	{
		if (this.getFlattenedShadowOnSelf())
			return shadowObjs;
		else
		{
			var shadow = this.getFlattenedShadow(autoCreate);
			var result = [];
			if (shadow)
			{
				for (var i = 0, l = shadowObjs.length; i < l; ++i)
				{
					result.push(shadow.getSourceObj(shadowObjs[i]));
				}
			}
			return result;
		}
	}
});

/**
 * Move nodes and connectors from target to dest structure fragment.
 * @param {Kekule.StructureFragment} target
 * @param {Kekule.StructureFragment} dest
 * @param {Array} moveNodes
 * @param {Array} moveConnectors
 * @param {Bool} ignoreAnchorNodes
 */
Kekule.StructureFragment.moveChildBetweenStructFragment = function(target, dest, moveNodes, moveConnectors, ignoreAnchorNodes)
{
	var CU = Kekule.CoordUtils;

	target.beginUpdate();
	dest.beginUpdate();
	var anchorNodes = target.getAnchorNodes();
	try
	{
		// TODO: here we need change coord if essential
		var targetCoord2D = target.getAbsCoord2D();
		var targetCoord3D = target.getAbsCoord3D();
		var destCoord2D = dest.getAbsCoord2D();
		var destCoord3D = dest.getAbsCoord3D();

		var coordDelta2D = CU.substract(targetCoord2D, destCoord2D);
		var coordDelta3D = CU.substract(targetCoord3D, destCoord3D);

		//console.log('coordDelta', coordDelta2D, coordDelta3D);

		var nodes = Kekule.ArrayUtils.clone(moveNodes);
		var connectors = Kekule.ArrayUtils.clone(moveConnectors);
		for (var i = 0, l = nodes.length; i < l; ++i)
		{
			var node = nodes[i];
			var index = target.indexOfNode(node);
			if (index >= 0)
			{
				target.removeNodeAt(index, true);  // preserve linked connectors

				var oldCoord2D = node.getCoord2D();
				if (oldCoord2D)
				{
					var newCoord2D = CU.add(oldCoord2D, coordDelta2D);
					node.setCoord2D(newCoord2D);
				}
				var oldCoord3D = node.getCoord3D();
				if (oldCoord3D)
				{
					var newCoord3D = CU.add(oldCoord3D, coordDelta3D);
					node.setCoord2D(newCoord3D);
				}

				dest.appendNode(node);
				if (anchorNodes.indexOf(node)>= 0)
				{
					target.removeAnchorNode(node);
					if (!ignoreAnchorNodes)
						dest.appendAnchorNode(node);
				}
			}
		}
		for (var i = 0, l = connectors.length; i < l; ++i)
		{
			var connector = connectors[i];
			var index = target.indexOfConnector(connector);
			if (index >= 0)
			{
				target.removeConnectorAt(index, true);  // preserve linked objects
				dest.appendConnector(connector);
			}
		}
	}
	finally
	{
		//console.log('[struct merge done]');
		dest.endUpdate();
		target.endUpdate();
	}
};

/**
 * Represent an "shadow" of structure fragment.
 * The shadow is cloned fragment from source with two maps (source->shadow and shadow->source)
 * to connect all child nodes/connectors between shadow and source fragment.
 * @class
 * @augments ObjectEx
 *
 * @param {Kekule.StructureFragment} srcFragment
 *
 * @property {Kekule.MapEx} shadowToSourceMap
 * @property {Kekule.MapEx} sourceToShadowMap
 * @property {Kekule.StructureFragment} shadowFragment
 */
Kekule.StructureFragmentShadow = Class.create(ObjectEx,
/** @lends Kekule.StructureFragmentShadow# */
{
	/** @private */
	CLASS_NAME: 'Kekule.StructureFragmentShadow',
	initialize: function($super, srcFragment)
	{
		if (!srcFragment)
		{
			Kekule.error(Kekule.$L('ErrorMsg.SOURCE_FRAGMENT_NOT_SET'));
			return;
		}
		$super();
		this.setPropStoreFieldValue('shadowToSourceMap', new Kekule.MapEx());
		this.setPropStoreFieldValue('sourceToShadowMap', new Kekule.MapEx());
		var shadowFragment = this._createShadowFragment(srcFragment, this.getSourceToShadowMap(), this.getShadowToSourceMap());
		this.setPropStoreFieldValue('shadowFragment', shadowFragment);
	},
	doFinalize: function($super)
	{
		this.getShadowToSourceMap().finalize();
		this.getSourceToShadowMap().finalize();
		this.getShadowFragment().finalize();
		this.setPropStoreFieldValue('shadowToSourceMap', null);
		this.setPropStoreFieldValue('sourceToShadowMap', null);
		this.setPropStoreFieldValue('shadowFragment', null);
		$super();
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('shadowFragment', {'dataType': 'Kekule.StructureFragment', 'setter': null});
		this.defineProp('sourceToShadowMap', {'dataType': 'Kekule.MapEx', 'setter': null});
		this.defineProp('shadowToSourceMap', {'dataType': 'Kekule.MapEx', 'setter': null});
	},

	/**
	 * Create the shadow fragment from source, and fill the two direction maps.
	 * @param sourceFragment
	 * @private
	 */
	_createShadowFragment: function(sourceFragment, srcToShadowMap, shadowToSrcMap)
	{
		var result = sourceFragment.clone();
		this._mapFragmentChildren(sourceFragment, result, srcToShadowMap, shadowToSrcMap);
		return result;
	},
	/** @private */
	_mapFragmentChildren: function(src, shadow, srcToShadowMap, shadowToSrcMap)
	{
		for (var i = 0, l = src.getChildCount(); i < l; ++i)
		{
			var srcObj = src.getChildAt(i);
			var shadowObj = shadow.getChildAt(i);
			srcToShadowMap.set(srcObj, shadowObj);
			shadowToSrcMap.set(shadowObj, srcObj);
			// if object is nested, cascade the mapping
			if (srcObj.getChildCount && shadowObj.getChildCount)
			{
				this._mapFragmentChildren(srcObj, shadowObj, srcToShadowMap, shadowToSrcMap);
			}
		}
	},

	/**
	 * Returns the shadowed object of source.
	 * @param {Kekule.ChemStructureObject} srcObj
	 * @returns {Kekule.ChemStructureObject}
	 */
	getShadowObj: function(srcObj)
	{
		return this.getSourceToShadowMap().get(srcObj);
	},
	/**
	 * Returns the source object from shadow.
	 * @param {Kekule.ChemStructureObject} shadowObj
	 * @returns {Kekule.ChemStructureObject}
	 */
	getSourceObj: function(shadowObj)
	{
		return this.getShadowToSourceMap().get(shadowObj);
	}
});

/**
 * Represent an substituent group.
 * @class
 * @augments Kekule.StructureFragment
 * @param {String} id Id of this node.
 * @param {String} abbr Abbreviation of group.
 * @param {String} name Name of group.
 * @param {Object} coord2D The 2D coordinates of node, {x, y}, can be null.
 * @param {Object} coord3D The 3D coordinates of node, {x, y, z}, can be null.
 *
 * @property {String} name Name of group.
 * @property {String} abbr Abbreviation of group, e.g. OMe.
 * @property {String} formulaText Formula in plain text to represent subgroup, e.g. CO2H.
 *   This property has nothing to do with the actual formula of subgroup.
 */
Kekule.SubGroup = Class.create(Kekule.StructureFragment,
/** @lends Kekule.SubGroup# */
{
	/** @private */
	CLASS_NAME: 'Kekule.SubGroup',
	/**
	 * @constructs
	 */
	initialize: function($super, id, abbr, name, coord2D, coord3D)
	{
		$super(id, coord2D, coord3D);
		this.setPropStoreFieldValue('abbr', abbr);
		this.setPropStoreFieldValue('name', name);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('abbr', {'dataType': DataType.STRING});
		this.defineProp('formulaText', {'dataType': DataType.STRING});
		this.defineProp('name', {'dataType': DataType.STRING});
	},
	/** @private */
	getAutoIdPrefix: function()
	{
		return 'g';
	},
	/** @private */
	doPropChanged: function($super, propName, newValue)
	{
		if (propName == 'anchorNodes')  // anchor nodes changed, need to recalculate coords of group and child nodes
		{
			this.recalcCoords();
		}
		return $super(propName, newValue);
	},
	/** @ignore */
	getLabel: function()
	{
		return Kekule.ChemStructureNodeLabels.SUBGROUP;
	}
});
// RGroup is often used in organic chemistry, here we define it as an alias of SubGroup
Kekule.RGroup = Kekule.SubGroup;

/**
 * Represent an molecule.
 * @class
 * @augments Kekule.StructureFragment
 * @param {String} id Id of this molecule.
 * @param {String} name Name of molecule.
 * @param {Bool} withCtab Create a new molecule with a new ctab.
 *
 * @property {String} name Name of molecule.
 */
Kekule.Molecule = Class.create(Kekule.StructureFragment,
/** @lends Kekule.Molecule# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Molecule',
	/**
	 * @constructs
	 */
	initialize: function($super, id, name, withCtab)
	{
		$super(id);
		this.setPropStoreFieldValue('name', name);
		if (withCtab)
			this.setCtab(new Kekule.StructureConnectionTable());
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('name', {'dataType': DataType.STRING});
	},
	/** @private */
	getAutoIdPrefix: function()
	{
		return 'm';
	}
});


//=========================================================

/**
 * Implements the concept of a connections between two or more structure nodes.
 * @class
 * @augments Kekule.ChemStructureObject
 * @param {String} id Id of this connector.
 * @param {Array} connectedObjs Objects ({@link Kekule.ChemStructureObject}) connected by connected, usually a connector connects two nodes.
 *
 * @property {Array} connectedObjs Structure objects ({@link Kekule.ChemStructureObject}) connected by connector.
 *   Usually a connector connects two nodes. However, there are some compounds that has bond-atom bond
 *   (such as Zeise's salt: [Cl3Pt(CH2=CH2)]), so here array of {@link Kekule.ChemStructureObject}
 *   rather than array of {@link Kekule.ChemStructureNode} is used.
 */
Kekule.BaseStructureConnector = Class.create(Kekule.ChemStructureObject,
/** @lends Kekule.BaseStructureConnector# */
{
	/** @private */
	CLASS_NAME: 'Kekule.BaseStructureConnector',
	/** @constructs */
	initialize: function($super, id, connectedObjs)
	{
		$super(id);
		//this.setPropStoreFieldValue('connectedObjs', connectedObjs || []);
		this.setConnectedObjs(connectedObjs || []);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('connectedObjs', {
			'dataType': DataType.ARRAY,
			'serializable': false,
			'scope': Class.PropertyScope.PUBLISHED,
			'setter': function(value)
				{
					var objs = this.getPropStoreFieldValue('connectedObjs');
					if (!objs)
					{
						this.setPropStoreFieldValue('connectedObjs', []);
						objs = this.getPropStoreFieldValue('connectedObjs');
					}
					// remove linkedConnectors in all existed connectedObjs
					for (var i = 0, l = objs.length; i < l; ++i)
					{
						objs[i].removeLinkedConnector(this);
					}

					if (value)
					{
						// assert all items in value can be linked in
						for (var i = 0, l = value.length; i < l; ++i)
							this.assertConnectedObjLegal(value[i]);
						for (var i = 0, l = value.length; i < l; ++i)
						{
							var obj = value[i];
							var actualConnObj = obj.getCurrConnectableObj? obj.getCurrConnectableObj(): obj;
							Kekule.ArrayUtils.pushUnique(objs, actualConnObj);
						}
					}
					else
						this.setPropStoreFieldValue('connectedObjs', []);

					// add new linkedConnectors in new connectedObjs
					objs = this.getPropStoreFieldValue('connectedObjs');
					for (var i = 0, l = objs.length; i < l; ++i)
					{
						objs[i].appendLinkedConnector(this);
					}

					this.notifyConnectedObjsChanged();
				}
		});
	},
	/** @private */
	getAutoIdPrefix: function()
	{
		return 'c';
	},
	/** @ignore */
	getStructureRelatedPropNames: function($super)
	{
		return $super().concat(['connectedObjs']);
	},

	/** @ignore */
	doCompare: function($super, targetObj, options)
	{
		var result = $super(targetObj, options);
		if (!result && options.method === Kekule.ComparisonMethod.CHEM_STRUCTURE)
		{
			if (this._getComparisonOptionFlagValue(options, 'connectedObjCount'))
			{
				var c1 = this.getConnectedObjCount();
				var c2 = targetObj.getConnectedObjCount && targetObj.getConnectedObjCount();
				result = this.doCompareOnValue(c1, c2, options);
			}
		}
		return result;
	},

	/**
	 * Notify {@link Kekule.ChemStructureConnector#connectedObjs} property has been changed
	 * @private
	 */
	notifyConnectedObjsChanged: function()
	{
		this.notifyPropSet('connectedObjs', this.getPropStoreFieldValue('connectedObjs'));
	},

	/**
	 * Check if an obj can be added to connectedObjs array.
	 * Generally, an object with same owner of current connector can be added. If not so,
	 * a exception will be raised.
	 * @param {Kekule.ChemStructureObject} obj
	 * @returns {Bool}
	 */
	assertConnectedObjLegal: function(obj)
	{
		if ((!obj) || (!obj.getOwner))
		{
			Kekule.chemError(
				Kekule.hasLocalRes()?
					/*Kekule.ErrorMsg.UNABLE_ADD_MISTYPED_NODE*/Kekule.$L('ErrorMsg.UNABLE_ADD_MISTYPED_NODE') :
					'Unable to link mistyped node to connector'
			);
		}
		else if (obj.getOwner() && obj.getOwner() != this.getOwner())
		// if owner is null, still allow connect, this may occur when undo remove a subgroup in editor
		{
			Kekule.chemError(
				Kekule.hasLocalRes()?
					/*Kekule.ErrorMsg.UNABLE_ADD_DIFF_OWNER_OBJ*/Kekule.$L('ErrorMsg.UNABLE_ADD_DIFF_OWNER_OBJ') :
					'Object with different owner can not be linked to connector'
			);
			return false;
		}
		else
			return true;
	},
	/**
	 * Called when a connected object is added to list.
	 * @private
	 */
	connectedObjAdded: function(obj)
	{
		this.notifyConnectedObjsChanged();
	},
	/**
	 * Get count of connected objects.
	 * @returns {Int}
	 */
	getConnectedObjCount: function()
	{
		return this.getConnectedObjs().length;
	},
	/**
	 * Get index of obj in connectedObjs array.
	 * @param {Kekule.ChemStructureObject} obj
	 * @returns {Int}
	 */
	indexOfConnectedObj: function(obj)
	{
		return this.getConnectedObjs().indexOf(obj);
	},
	/**
	 * Get connectedObj at index.
	 * @param {Int} index
	 * @returns {Kekule.ChemStructureObject}
	 */
	getConnectedObjAt: function(index)
	{
		return this.getConnectedObjs()[index];
	},
	/**
	 * Set connectedObj at index.
	 * @param {Int} index
	 * @param {Kekule.ChemStructureObject} value
	 */
	setConnectedObjAt: function(index, value)
	{
		this.assertConnectedObjLegal(value);
		var node = this.getConnectedObjs()[index];
		if (node)
			node.removeLinkedConnector(this);
		// in node.removeLinkedConnector, this.connectedObjs already changes and count declines 1
		// do should not change array with index directly but do a insert
		this.insertConnectedObjAt(value, index);
		//this.getConnectedObjs()[index] = value;
		this.connectedObjAdded(value);
	},
	/**
	 * Add a object to connectedObjs array. If obj already in connectedObjs, nothing will be done.
	 * @param {Kekule.ChemStructureObject} obj
	 */
	appendConnectedObj: function(obj)
	{
		this.assertConnectedObjLegal(obj);
		var actualConnObj = obj.getCurrConnectableObj? obj.getCurrConnectableObj(): obj;
		var result = this._doAppendConnectedObj(actualConnObj);
		if (actualConnObj)
			actualConnObj.appendLinkedConnector(this);
		return result;
	},
	/** @private */
	_doAppendConnectedObj: function(obj)
	{
		var r = Kekule.ArrayUtils.pushUniqueEx(this.getConnectedObjs(), obj);
		if (r.isPushed)
			this.connectedObjAdded(obj);
		return r.index;
	},
	/**
	 * Insert obj at index of connectedObjs array. If index is not set, obj will be put as the first obj.
	 * @param {Kekule.ChemStructureObject} obj
	 * @param {Int} index
	 */
	insertConnectedObjAt: function(obj, index)
	{
		this.assertConnectedObjLegal(obj);
		var actualConnObj = obj.getCurrConnectableObj? obj.getCurrConnectableObj(): obj;
		var i = this.indexOfConnectedObj(actualConnObj);
		var objs = this.getConnectedObjs();
		if (i >= 0)  // already inside, adjust position
		{
			objs.splice(i, 1);
			objs.splice(index, 0, actualConnObj);
			this.notifyConnectedObjsChanged();
		}
		else // new one
		{
			objs.splice(index, 0, actualConnObj);
			if (actualConnObj)
				actualConnObj.appendLinkedConnector(this);
			//console.log('insert new one', obj.getLinkedConnectorCount());
			this.connectedObjAdded(actualConnObj);
		}
	},
	/**
	 * Remove object at index in connectedObjs property.
	 * @param {Int} index
	 */
	removeConnectedObjAt: function(index)
	{
		var node = this.getConnectedObjs()[index];
		if (node)
		{
			//this.getConnectedObjs().removeAt(index);
			//this.getConnectedObjs().splice(index, 1);
			this._doRemoveConnectedObjAt(index);
			//node.removeLinkedConnector(this);
			node._doRemoveLinkedConnectorAt(node.indexOfLinkedConnector(this));
			this.notifyConnectedObjsChanged();
		}
	},
	/** @private */
	_doRemoveConnectedObjAt: function(index)
	{
		this.getConnectedObjs().splice(index, 1);
	},
	/**
	 * Remove a object in connectedObjs property.
	 * @param {Kekule.ChemStructureObject} obj
	 */
	removeConnectedObj: function(obj)
	{
		var index = this.getConnectedObjs().indexOf(obj);
		if (index >= 0)
			this.removeConnectedObjAt(index);
	},
	/**
	 * Replace old connected object with new one and remove connection to old object.
	 * @param {Kekule.ChemStructureObject} oldObj
	 * @param {Kekule.ChemStructureObject} newObj
	 */
	replaceConnectedObj: function(oldObj, newObj)
	{
		var index = this.indexOfConnectedObj(oldObj);
		if (index >= 0)
			this.setConnectedObjAt(index, newObj);
	},
	/**
	 * Clear all connected objects.
	 */
	clearConnectedObjs: function()
	{
		this.setConnectedObjs([]);
	},
	/**
	 * Check if a object is connected with this connector.
	 * @param {Kekule.ChemStructureObject} obj
	 */
	hasConnectedObj: function(obj)
	{
		return (this.getConnectedObjs().indexOf(obj) >= 0);
	},
	/**
	 * Check if a object is connected with this connector.
	 * Same as {@link Kekule.ChemStructureConnector#hasConnectedObj}
	 * @param {Kekule.ChemStructureObject} obj
	 */
	isConnectingWithObj: function(obj)
	{
		return this.hasConnectedObj(obj);
	},
	/**
	 * Sort the array of connected objs.
	 * @param {Function} compareFunc
	 */
	sortConnectedObjs: function(compareFunc)
	{
		this.getConnectedObjs().sort(compareFunc);
	},
	/**
	 * Reverse the order of connected object.
	 */
	reverseConnectedObjOrder: function()
	{
		this.setPropStoreFieldValue('connectedObjs', Kekule.ArrayUtils.reverse(this.getConnectedObjs()));
		this.notifyConnectedObjsChanged();
	},

	/**
	 * Remove this connector from all linked objects.
	 * Ths method should be called before a connector is removed from a structure.
	 */
	removeThisFromConnectedObjs: function()
	{
		for (var i = this.getConnectedObjCount() - 1; i >= 0; --i)
		{
			var o = this.getConnectedObjAt(i);
			o.removeLinkedConnector(this);
		}
	},

	/**
	 * Returns connected objects with the same parent of this connector.
	 * For example, connector connected to a child node in subgroup, then the subgroup
	 * rather than the child node will be returned.
	 * @returns {Array}
	 */
	getConnectedSiblings: function()
	{
		var objs = this.getConnectedObjs();
		var result = [];
		var parent = this.getParent();

		/** @ignore */
		var getSiblingParent = function(childObj)
		{
			if (childObj.getParent)
			{
				var p = childObj.getParent();
				if (p === parent)
					return p;
				else
					return getSiblingParent(p);
			}
			else
				return childObj;
		};

		for (var i = 0, l = objs.length; i < l; ++i)
		{
			var obj = objs[i];
			if (!obj.getParent || (obj.getParent() === parent))
				result.push(obj);
			else
			{
				var o = getSiblingParent(obj);
				if (o)
					result.push(o);
			}
		}

		return result;
	},

	/**
	 * Check if this connector connected to another connector (e.g, bond ends with another bond).
	 */
	isConnectingConnector: function()
	{
		for (var i = 0, l = this.getConnectedObjCount(); i < l; ++i)
		{
			var o = this.getConnectedObjAt(i);
			if (o instanceof Kekule.ChemStructureConnector)
				return true;
		}
		return false;
	}
});

/**
 * Implements the concept of a connections between two or more structure nodes.
 * @class
 * @augments Kekule.BaseStructureConnector
 *
 * @property {Array} connectedChemNodes Nodes connected with this connector.
 * @property {Int} parity Stereo parity of connector.
 */
Kekule.ChemStructureConnector = Class.create(Kekule.BaseStructureConnector,
/** @lends Kekule.ChemStructureConnector# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemStructureConnector',
	/** @private */
	initProperties: function()
	{
		this.defineProp('parity', {'dataType': DataType.INT});
		this.defineProp('connectedChemNodes', {
			'dataType': DataType.ARRAY,
			'serializable': false,
			'scope': Class.PropertyScope.PUBLIC,
			'setter': null,
			'getter': function()
			{
				var result = [];
				for (var i = 0, l = this.getConnectedObjCount(); i < l; ++i)
				{
					var obj = this.getConnectedObjAt(i);
					if (obj instanceof Kekule.ChemStructureNode)
						result.push(obj);
				}
				return result;
			}
		});
	},

	/** @ignore */
	doCompare: function($super, targetObj, options)
	{
		var result = $super(targetObj, options);
		if (!result && options.method === Kekule.ComparisonMethod.CHEM_STRUCTURE)
		{
			if (this._getComparisonOptionFlagValue(options, 'stereo'))  // parity null/0 should be regard as one in comparison
			{
				var c1 = this.getParity() || Kekule.StereoParity.UNKNOWN;
				var c2 = (targetObj.getParity && targetObj.getParity()) || Kekule.StereoParity.UNKNOWN;
				result = this.doCompareOnValue(c1, c2, options);
			}
		}
		return result;
	},

	/** @ignore */
	clearStructureFlags: function()
	{
		this.setParity(Kekule.StereoParity.NONE);
	},

	/**
	 * Get count of connected chem nodes.
	 * @returns {Int}
	 */
	getConnectedChemNodeCount: function()
	{
		return this.getConnectedChemNodes().length;
	},
	/**
	 * Returns connected objects except hydrogen atoms.
	 * @returns {Array}
	 */
	getConnectedNonHydrogenObjs: function()
	{
		var result = [];
		var objs = this.getConnectedObjs();
		for (var i = 0, l = objs.length; i < l; ++i)
		{
			var obj = objs[i];
			if (!obj.isHydrogenAtom || !obj.isHydrogenAtom())
				result.push(obj);
		}
		return result;
	},
	/**
	 * Whether this connector connect hydrogen atom to another node.
	 * @returns {Bool}
	 */
	isNormalConnectorToHydrogen: function()
	{
		return this.getConnectedNonHydrogenObjs().length <= 1;
	}
});

/**
 * Enumeration of possible stereo types of two-atom bonds. The
 * Stereo type defines not just define the stereochemistry, but also the
 * which atom is the stereo center for which the Stereo is defined.
 * The first atom in the bond (index = 0) is the start atom, while
 * the second atom (index = 1) is the end atom.
 * @class
 */
Kekule.BondStereo = {
	/** A bond for which there is no stereochemistry. */
	NONE: 0,
	/** A bond pointing up of which the start atom is the stereocenter and
	 * the end atom is above the drawing plane. */
	UP: 1,
	/** A bond pointing up of which the end atom is the stereocenter and
	 * the start atom is above the drawing plane. */
	UP_INVERTED: 2,
	/** A bond pointing down of which the start atom is the stereocenter
	 * and the end atom is below the drawing plane. */
	DOWN: 3,
	/** A bond pointing down of which the end atom is the stereocenter and
	 * the start atom is below the drawing plane. */
	DOWN_INVERTED: 4,
	/** A bond for which there is stereochemistry, we just do not know
	 *  if it is UP or DOWN. The start atom is the stereocenter.
	 */
	UP_OR_DOWN: 8,
  /** A bond for which there is stereochemistry, we just do not know
   *  if it is UP or DOWN. The end atom is the stereocenter.
   */
  UP_OR_DOWN_INVERTED: 9,
	/** A bond is closer to observer than papaer, often used in ring structures. */
	CLOSER: 10,
	/** Indication that this double bond has a fixed, but unknown E/Z
	 * configuration.
	 */
	E_OR_Z: 20,
  /** Indication that this double bond has a E configuration.
   */
  E: 21,
  /** Indication that this double bond has a Z configuration.
   */
  Z: 22,
	/** Indication that this double bond has a fixed configuration, defined
	 * by the 2D and/or 3D coordinates.
	 */
	E_Z_BY_COORDINATES: 23,
	/** Indication that this double bond has a fixed, but unknown cis/trans
	 * configuration.
	 */
	CIS_OR_TRANS: 30,
	/** Indication that this double bond has a Cis configuration.
   */
	CIS: 31,
	/** Indication that this double bond has a Trans configuration.
   */
	TRANS: 32,

	/**
	 * Get inverted stereo direction value.
	 * @param {Int} direction
	 * @returns {Int}
	 */
	getInvertedDirection: function(direction)
	{
		var S = Kekule.BondStereo;
		switch (direction)
		{
			case S.UP: return S.UP_INVERTED;
			case S.UP_INVERTED: return S.UP;
			case S.DOWN: return S.DOWN_INVERTED;
			case S.DOWN_INVERTED: return S.DOWN;
			case S.UP_OR_DOWN: return S.UP_OR_DOWN_INVERTED;
			default:
				return direction;
		}
	}
};

/**
 * Implements the concept of a covalent bond between two or more atoms. A bond is
 * considered to be a number of electrons connecting two or more of atoms.
 * @class
 * @augments Kekule.ChemStructureConnector
 * @param {String} id Id of this node.
 * @param {Array} connectedObjs Objects connected by connector, usually a connector connects two nodes.
 * @param {Int} bondOrder Order of bond. Usually electronCount / 2.
 * @param {Float} electronCount Count of electrons in this set.
 * @param {String} bondType Type of bond, value from {@link Kekule.BondType}.
 *
 * @property {Kekule.BondForm} bondForm Form of bond, single, double or other.
 * @property {String} bondType Type of bond, value from {@link Kekule.BondType}.
 * @property {Num} bondOrder Order of bond. Values should be retrieved from {@link Kekule.BondOrder}.
 * @property {Num} bondValence Valence comsumed of an atom to connect to this bond. Note this value is different from {@link Kekule.Bond#bondOrder},
 *   For example, bondOrder value for {@link Kekule.BondOrder.EXPLICIT_AROMATIC} is 10, but the valence is 1.5. This property is read only.
 * @property {Float} electronCount Count of electrons in this set.
 *   Note that there may be partial electron in set, so a float value is used here.
 * @property {Int} stereo Stereo type of bond.
 * @property {Bool} isInAromaticRing A flag to indicate the bond is in a aromatic ring and is a aromatic bond.
 *   User should not set this property directly, instead, this value will be marked
 *   in aromatic detection routine.
 */
Kekule.Bond = Class.create(Kekule.ChemStructureConnector,
/** @lends Kekule.Bond# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Bond',
	/** @constructs */
	initialize: function($super, id, connectedObjs, bondOrder, electronCount, bondType)
	{
		$super(id, connectedObjs || []);
		if (bondOrder || electronCount || bondType)
			this.setBondForm(Kekule.BondFormFactory.getBondForm(bondOrder, electronCount, bondType));
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('bondForm', {'dataType': 'Kekule.BondForm', 'serializable': false, 'scope': Class.PropertyScope.PUBLIC});
		this.defineProp('bondType', {
			'dataType': DataType.STRING,
			'enumSource': Kekule.BondType,
			'getter': function()
				{
					var f = this.getBondForm();
					return f? f.getBondType(): Kekule.BondType.DEFAULT;
				},
			'setter': function(value)
				{
					this.changeBondForm(this.getBondOrder(), Kekule.ElectronSet.UNSET_ELECTRONCOUNT, value);
				}
		});
		this.defineProp('bondOrder', {
			'dataType': DataType.INT,
			'enumSource': Kekule.BondOrder,
			'getter': function()
				{
					var f = this.getBondForm();
					return f? f.getBondOrder(): Kekule.BondOrder.UNSET;
				},
			'setter': function(value)
				{
					this.changeBondForm(value, Kekule.ElectronSet.UNSET_ELECTRONCOUNT, this.getBondType());
				}
		});
		this.defineProp('bondValence', {
			'dataType': DataType.INT,
			'serializable': false,
			'getter': function()
				{
					var f = this.getBondForm();
					return f? f.getBondValence(): 0;
				},
			'setter': null
		});
		this.defineProp('electronCount', {
			'dataType': DataType.FLOAT,
			'getter': function()
				{
					if (this.isAromatic())
						return 3;
					var f = this.getBondForm();
					return f? f.getElectronCount(): Kekule.ElectronSet.UNSET_ELECTRONCOUNT;
				},
			'setter': function(value)
				{
					var order = this.getBondOrder();
					this.changeBondForm(order, value, this.getBondType());
				}
		});
		this.defineProp('stereo', {'dataType': DataType.INT, 'enumSource': Kekule.BondStereo, 'defaultValue': Kekule.BondStereo.NONE});
		this.defineProp('isInAromaticRing', {'dataType': DataType.BOOL,
			'setter': null,
			'getter': function()
			{
				var result = false;
				var parent = this.getParent();
				if (parent && parent.isConnectorInAromaticRing)
					return parent.isConnectorInAromaticRing(this);
				else
					return false;
			}
		});
	},
	/** @private */
	initPropValues: function($super)
	{
		$super();
		this.setPropStoreFieldValue('stereo', Kekule.BondStereo.NONE);
	},
	/** @private */
	getAutoIdPrefix: function()
	{
		return 'b';
	},
	/** @ignore */
	getStructureRelatedPropNames: function($super)
	{
		return $super().concat(['bondForm', 'stereo']);
	},
	/** @ignore */
	clearStructureFlags: function()
	{
		this.setPropStoreFieldValue('isInAromaticRing', null);
	},
	/** @ignore */
	doGetParity: function($super)  // override parity getter, only double bond can have parity value
	{
		if (this.isDoubleBond())
			return $super();
		else
			return null;
	},

	/** @ignore */
	doGetComparisonPropNames: function($super, options)
	{
		var result = $super(options);
		if (options.method === Kekule.ComparisonMethod.CHEM_STRUCTURE)
		{
			if (this._getComparisonOptionFlagValue(options, 'bondType'))
				result.push('bondType');
			/* Bond order must handle seperatorly, as there may be aromatic bond
			if (this._getComparisonOptionFlagValue(options, 'bondOrder'))
				result.push('bondOrder');
			*/
		}
		return result;
	},
	/** @ignore */
	doCompare: function($super, targetObj, options)
	{
		var result = $super(targetObj, options);
		if (!result && options.method === Kekule.ComparisonMethod.CHEM_STRUCTURE)
		{
			if (this._getComparisonOptionFlagValue(options, 'connectedObjCount'))
			{
				var c1 = this.getConnectedObjCount();
				var c2 = targetObj.getConnectedObjCount && targetObj.getConnectedObjCount();
				result = this.doCompareOnValue(c1, c2, options);
			}
			if (!result && this._getComparisonOptionFlagValue(options, 'bondOrder'))
			{
				var eCount1 = Math.round(this.getElectronCount());
				var eCount2 = Math.round(targetObj.getElectronCount());
				result = this.doCompareOnValue(eCount1, eCount2, options);
			}
		}
		return result;
	},

	/**
	 * Change bond form to new order or electron number.
	 * @private
	 */
	changeBondForm: function(bondOrder, electronCount, bondType)
	{
		this.setBondForm(Kekule.BondFormFactory.getBondForm(bondOrder, electronCount, bondType));
	},
	/** @private */
	canInvertBondDirection: function()
	{
		var BT = Kekule.BondType;
		var bType = this.getBondType();
		return [BT.COVALENT, BT.IONIC, BT.METALLIC, BT.HYDROGEN, BT.UNKNOWN].indexOf(bType) >= 0;
	},
	/**
	 * Change bond direction to a inverted one (in case when connected object order swapped).
	 * @private
	 */
	invertBondDirection: function()
	{
		this.setStereo(Kekule.BondStereo.getInvertedDirection(this.getStereo()));
	},

	/** @ignore */
	reverseConnectedObjOrder: function($super)
	{
		if (this.canInvertBondDirection())
		{
			$super();
			// direction of bond also need to be reversed
			this.invertBondDirection();
		}
		else // can not reverse a directed bond, do nothing
		{

		}
	},

	/**
	 * Turn bond direction to a normal up or down one (not up_inverted or down_inverted).
	 */
	normalizeDirection: function()
	{
		var S = Kekule.BondStereo;
		var inverted = [S.UP_INVERTED, S.DOWN_INVERTED, S.UP_OR_DOWN_INVERTED];
		var d = this.getBondStereo();
		if (inverted.indexOf(d) >= 0)
			this.reverseConnectedObjOrder();
	},

	/**
	 * Returns if bond is a single covalence bond.
	 * @returns {Bool}
	 */
	isSingleBond: function()
	{
		return (this.getBondType() === Kekule.BondType.COVALENT) && (this.getBondOrder() === Kekule.BondOrder.SINGLE)
			&& (!this.getIsInAromaticRing());
	},
	/**
	 * Returns if bond is a double covalence bond.
	 * @returns {Bool}
	 */
	isDoubleBond: function()
	{
		return (this.getBondType() === Kekule.BondType.COVALENT) && (this.getBondOrder() === Kekule.BondOrder.DOUBLE)
			&& (!this.getIsInAromaticRing());
	},
	/**
	 * Returns if bond is a triple covalence bond.
	 * @returns {Bool}
	 */
	isTripleBond: function()
	{
		return (this.getBondType() === Kekule.BondType.COVALENT) && (this.getBondOrder() === Kekule.BondOrder.TRIPLE);
	},

	/**
	 * Returns if bond is a aromatic one.
	 * @returns {Bool}
	 */
	isAromatic: function()
	{
		return (!!this.getIsInAromaticRing() || (this.getBondOrder() === Kekule.BondOrder.EXPLICIT_AROMATIC))
			&& (this.getBondType() === Kekule.BondType.COVALENT);
	},

	/**
	 * Check if this bond is between two specified atoms.
	 * @param {Variant} atomicNumberOrSymbol1
	 * @param {Variant} atomicNumberOrSymbol2
	 * @returns {Bool}
	 */
	isBondBetween: function(atomicNumberOrSymbol1, atomicNumberOrSymbol2)
	{
		var objs = this.getConnectedObjs();
		if (objs.length !== 2)
			return false;
		var found1, found2;
		for (var i = 0, l = objs.length; i < l; ++i)
		{
			var obj = objs[i];
			if (obj instanceof Kekule.Atom)
			{
				if (obj.isElement(atomicNumberOrSymbol1))
					found1 = true;
				else if (obj.isElement(atomicNumberOrSymbol2))
					found2 = true;

				if (found1 && found2)
					return true;
			}
		}
		return false;
	}
});

/**
 * A group of structure object. Each items in the group is in attrib=>obj form.
 * @class
 * @augments Kekule.ChemStructureObject
 * @param {String} id Id of this group.
 *
 * @property {Array} items Items in this group. Each item is a hash: {obj, amount, role...}
 *   where obj is the real ChemStructureObject and the rests are related attributes.
 * @property {Bool} raiseExceptionOnTypeMismatch Whether raise exception when wrong type
 *   of object is added to group.
 */
Kekule.ChemStructureObjectGroup = Class.create(Kekule.ChemStructureObject,
/** @lends Kekule.ChemStructureObjectGroup# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemStructureObjectGroup',
	/** @private */
	ITEM_BASE_CLASSES: ['Kekule.ChemStructureObject', 'Kekule.ChemStructureObjectGroup'], // the allowed base class of each items in group
	/**
	 * @constructs
	 */
	initialize: function($super, id)
	{
		$super(id);
		this.setPropStoreFieldValue('items', []);
		this.setPropStoreFieldValue('raiseExceptionOnTypeMismatch', []);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('items', {'dataType': DataType.ARRAY});
		this.defineProp('raiseExceptionOnTypeMismatch', {'dataType': DataType.BOOL, 'defaultValue': true, 'scope': Class.PropertyScope.PUBLIC});
	},
	/** @private */
	getAutoIdPrefix: function()
	{
		return 'sg';
	},
	/** @ignore */
	getStructureRelatedPropNames: function($super)
	{
		return $super().concat(['items']);
	},

	/** @ignore */
	doGetComparisonPropNames: function($super, options)
	{
		var result = $super(options);
		if (options.method === Kekule.ComparisonMethod.CHEM_STRUCTURE)
		{
			result.push('items');
		}
		return result;
	},

	/** @private */
	ownerChanged: function($super, newOwner)
	{
		var items = this.getItems();
		for (var i = 0, l = items.length; i < l; ++i)
		{
			var obj = items[i].obj;
			if (obj && obj.setOwner)
				obj.setOwner(newOwner);
		}
		$super(newOwner);
	},

	/** @private */
	_removeChildObj: function(obj)
	{
		var index = this.indexOfObj(obj);
		if (index < 0)
			index = this.indexOfItem(obj);
		if (index >= 0)
		{
			this.removeObjAt(index);
		}
	},

	/** @private */
	getObjectBaseClasses: function()
	{
		return this.getPrototype().ITEM_BASE_CLASSES;
	},
	/**
	 * Ensure item added to group is really an instance of ITEM_BASE_CLASS
	 * @private
	 */
	ensureItemClass: function(obj)
	{
		var classes = this.getObjectBaseClasses();
		if (classes.length > 0)
		{
			for (var i = 0, l = classes.length; i < l; ++i)
			{
				if (obj instanceof ClassEx.findClass(classes[i]))
					return true;
			}
			// not match
			if (this.getRaiseExceptionOnTypeMismatch())
			{
				var msg =
					Kekule.hasLocalRes()?
						/*Kekule.ErrorMsg.CHEMSTRUCTUREOBJECTGROUP_ITEMCLASS_MISMATCH*/Kekule.$L('ErrorMsg.CHEMSTRUCTUREOBJECTGROUP_ITEMCLASS_MISMATCH') :
						'Mismatched group item class';
				Kekule.raise(msg);
			}
			return false;
		}
		else  // not specified base classes, every object is allowed
			return true;
	},

	/** Notify {@link Kekule.ChemStructureObjectGroup#objs} property has been changed */
	notifyItemsChanged: function()
	{
		this.notifyPropSet('items', this.getPropStoreFieldValue('items'));
	},

	/**
	 * Get index of item in items array.
	 * @param {Object} item
	 * @returns {Int} Index of item in array. If not found, returns -1.
	 */
	indexOfItem: function(item)
	{
		return this.getItems().indexOf(item);
	},
	/**
	 * Get index of obj in items array.
	 * @param {Object} obj
	 * @returns {Int} Index of object in array. If not found, returns -1.
	 */
	indexOfObj: function(obj)
	{
		var items = this.getItems();
		for (var i = 0, l = items.length; i < l; ++i)
		{
			if (items[i].obj == obj)
				return i;
		}
		return -1;
	},
	/**
	 * Check if obj exists in items.
	 * @param {Object} obj
	 * @returns {Bool}
	 */
	hasObj: function(obj)
	{
		return this.indexOfObj(obj) >= 0;
	},
	/**
	 * Set additional fields of item at index.
	 * @param {Object} index
	 * @param {Object} attributes
	 */
	setAttributesAt: function(index, attributes)
	{
		var item = this.getItems()[index];
		if (item)
		{
			var keys = Kekule.ObjUtils.getOwnedFieldNames(attributes);
			for (var i = 0, l = keys.length; i < l; ++i)
			{
				item[keys[i]] = attributes[keys[i]];
			}
		}
	},
	/**
	 * Get count of items in group.
	 * @returns {Int}
	 */
	getItemCount: function()
	{
		return this.getItems().length;
	},
	/**
	 * Get item at index of items array.
	 * @param {Int} index
	 * @return {Object}
	 */
	getItemAt: function(index)
	{
		return this.getItems()[index];
	},
	/**
	 * Append an attrib-object pair item in group.
	 * @param {Hash} item
	 */
	appendItem: function(item)
	{
		this.getItems().push(item);
		return this;
	},
	/**
	 * Insert an attrib-object pair item in group at index.
	 * @param {Hash} item
	 * @param {Int} index
	 */
	insertItem: function(item, index)
	{
		return Kekule.ArrayUtils.insertUniqueEx(this.getItems(), item, index).index;
	},
	/**
	 * Remove an attrib-object pair item at index in group.
	 * @param {Int} index
	 */
	removeItemAt: function(index)
	{
		var item = this.getItems()[index];
		if (item)
		{
			this.getItems().splice(index, 1);
			this.notifyItemsChanged();
		}
	},
	/**
	 * Remove an attrib-object pair item in group.
	 * @param {Kekule.ChemStructureObject} obj
	 */
	removeItem: function(item)
	{
		var index = this.getItems().indexOf(item);
		if (index >= 0)
			this.removeItemAt(index);
	},

	/**
	 * Get object stored in item at index.
	 * @param {Int} index
	 * @return {Object}
	 */
	getObjAt: function(index)
	{
		var item = this.getItemAt(index);
		return item? item.obj: null;
	},
	/**
	 * Insert an attrib-object pair item in group at index.
	 * @param {Hash} item
	 * @param {Int} index
	 * @param {Hash} attributes Additional attributes of this object. Can be null.
	 */
	insertObj: function(obj, index, attributes)
	{
		if (!obj)
			return;
		if (this.indexOfObj(obj) >= 0) // already exists
			;// do nothing
		else
		{
			if (this.ensureItemClass(obj))
			{
				var item = {'obj': obj};
				this.beginUpdate();
				try
				{
					var result = this.insertItem(item, index);
					if (attributes)
						this.setAttributesAt(result, attributes);
					this.notifyItemsChanged();
				}
				finally
				{
					this.endUpdate();
				}
				return result;
			}
		}
	},
	/**
	 * Add object to group. If object already in group, nothing will be done.
	 * @param {Kekule.ChemStructureObject} obj
	 * @param {Hash} attributes Additional attributes of this object. Can be null.
	 */
	appendObj: function(obj, attributes)
	{
		/*
		if (!obj)
			return;
		if (this.indexOfObj(obj) >= 0) // already exists
			;// do nothing
		else
		{
			if (this.ensureItemClass(obj))
			{
				var item = {'obj': obj};
				var result = this.getItems().push(item);
				if (attributes)
					this.setAttributesAt(this.getItems().length - 1, attributes);
				this.notifyItemsChanged();
				return result;
			}
		}
		*/
		return this.insertObj(obj, null, attributes);
	},
	/**
	 * Remove object at index in group.
	 * @param {Int} index
	 */
	removeObjAt: function(index)
	{
		var item = this.getItems()[index];
		if (item)
		{
			//this.getItems().removeAt(index);
			this.getItems().splice(index, 1);
			this.notifyItemsChanged();
		}
	},
	/**
	 * Remove an object in group.
	 * @param {Kekule.ChemStructureObject} obj
	 */
	removeObj: function(obj)
	{
		var index = this.indexOfObj(obj);
		if (index >= 0)
			this.removeObjAt(index);
	},

	/**
	 * Returns an array containing the child objects (without attribute).
	 * @returns {Array}
	 */
	getAllObjs: function()
	{
		var result = [];
		for (var i = 0, l = this.getItemCount(); i < l; ++i)
		{
			result.push(this.getObjAt(i));
		}
		return result;
	},

	/**
	 * Get count of child objects in root.
	 * @returns {Int}
	 */
	getChildCount: function()
	{
		return this.getItemCount();
	},
	/**
	 * Get child object at index.
	 * @param {Int} index
	 * @returns {Variant}
	 */
	getChildAt: function(index)
	{
		return this.getObjAt(index);
	},
	/**
	 * Get the index of obj (object or object-attribute item) in children list of root.
	 * @param {Variant} obj
	 * @returns {Int} Index of obj or -1 when not found.
	 */
	indexOfChild: function(obj)
	{
		var result = this.indexOfObj(obj);
		if (result < 0)
			result = this.indexOfItem(obj);
		return result;
	},
	/**
	 * Returns next sibling item to child item or object.
	 * @param {Variant} child Item or object.
	 * @returns {Hash}
	 */
	getNextSiblingOfChild: function(child)
	{
		var refIndex = this.indexOfItem(child);
		if (refIndex < 0)
			refIndex = this.indexOfObj(child);
		return (refIndex >= 0)? this.getChildAt(index + 1): null;
	},
	/**
	 * Append obj to children list. If obj already inside, nothing will be done.
	 * @param {Object} obj
	 * @returns {Int} Index of obj after appending.
	 */
	appendChild: function(obj)
	{
		if (obj instanceof Kekule.ChemObject)
			return this.appendObj(obj);
		else  // item
			return this.appendItem(obj);
	},
	/**
	 * Insert obj to index of children list. If obj already inside, its position will be changed.
	 * @param {Object} obj
	 * @param {Object} index
	 * @return {Int} Index of obj after inserting.
	 */
	insertChild: function(obj, index)
	{
		if (obj instanceof Kekule.ChemObject)
			return this.insertObj(obj, index);
		else  // item
			return this.insertItem(obj);
	},
	/**
	 * Insert attrib-object pair item before refChild in group.
	 * If refChild is null or does not exists, item will be append to tail of list.
	 * @param {Hash} item
	 * @param {Hash} refItem
	 */
	insertBefore: function(item, refChild)
	{
		var refIndex = this.indexOfItem(refChild);
		if (refIndex < 0)
			refIndex = this.indexOfObj(refChild);
		return this.insertChild(item, refChild);
	},
	/**
	 * Remove a child at index.
	 * @param {Int} index
	 * @returns {Variant} Child object removed.
	 */
	removeChildAt: function(index)
	{
		return this.removeItemAt(index);
	},
	/**
	 * Remove an object or attrib-object pair item from group.
	 * @param {Variant} obj
	 */
	removeChild: function(obj)
	{
		var index = this.indexOfItem(obj);
		if (index <= 0)
			index = this.indexOfObj(obj);
		if (index >= 0)
			this.removeItemAt(index);
	}
});

/**
 * A group of structure fragment.
 * @class
 * @augments Kekule.ChemStructureObjectGroup
 */
Kekule.StructureFragmentGroup = Class.create(Kekule.ChemStructureObjectGroup,
/** @lends Kekule.ChemStructureObjectGroup# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemStructureObjectGroup',
	/** @private */
	ITEM_BASE_CLASSES: ['Kekule.StructureFragment', 'Kekule.StructureFragmentGroup'] // the base class of each items in group
});

/**
 * A group of molecule.
 * @class
 * @augments Kekule.ChemStructureObjectGroup
 */
Kekule.MoleculeGroup = Class.create(Kekule.ChemStructureObjectGroup,
/** @lends Kekule.MoleculeGroup# */
{
	/** @private */
	CLASS_NAME: 'Kekule.MoleculeGroup',
	/** @private */
	ITEM_BASE_CLASSES: ['Kekule.Molecule', 'Kekule.MoleculeGroup'] // the base class of each items in group
});

/**
 * A molecule composited by a few sub molecules.
 * @class
 * @augments Kekule.Molecule
 * @param {String} id Id of this molecule.
 * @param {String} name Name of molecule.
 *
 * @property {String} name Name of molecule.
 */
Kekule.CompositeMolecule = Class.create(Kekule.Molecule,
/** @lends Kekule.CompositeMolecule# */
{
	/** @private */
	CLASS_NAME: 'Kekule.CompositeMolecule',
	/**
	 * @constructs
	 */
	initialize: function($super, id, name)
	{
		$super(id, name);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('subMolecules', {
			'dataType': 'Kekule.MoleculeGroup',
			'getter': function()
				{
					if (!this.getPropStoreFieldValue('subMolecules'))
						this.setPropStoreFieldValue('subMolecules', new Kekule.MoleculeGroup());
					return this.getPropStoreFieldValue('subMolecules');
				}});
	},

	/** @ignore */
	doGetComparisonPropNames: function($super, options)
	{
		var result = $super(options);
		if (options.method === Kekule.ComparisonMethod.CHEM_STRUCTURE)
		{
			result.push('subMolecules');
		}
		return result;
	},

	/** @private */
	ownerChanged: function($super, newOwner)
	{
		var subMols = this.getPropStoreFieldValue('subMolecules');
		if (subMols)
			subMols.setOwner(newOwner);
		$super(newOwner);
	},

	/**
	 * Returns the number of sub molecules.
	 * @returns {Int}
	 */
	getSubMoleculeCount: function()
	{
		var subs = this.getPropStoreFieldValue('subMolecules');
		return subs? subs.length: 0;
	},

	// as composite molecule are consisted by individual molecules, itself has no ctab nor formula
	/**
	 * Check whether a connection table is used to represent this fragment.
	 * @returns {Bool}
	 */
	hasCtab: function()
	{
		return false;
	},
	/**
	 * Check whether a formula is used to represent this fragment.
	 * @returns {Bool}
	 */
	hasFormula: function()
	{
		return false;
	},
	/**
	 * Return all bonds in structure as well as in sub structure.
	 * @returns {Array} Array of {Kekule.ChemStructureConnector}.
	 */
	getAllContainingConnectors: function()
	{
		var subMols = this.getSubMolecules();
		var result = [];
		for (var i = 0, l = subMols.getItemCount(); i < l; ++i)
		{
			var m = subMols.getObjAt(i);
			if (m.getAllContainingConnectors)
			{
				var a = m.getAllContainingConnectors();
				if (a && a.length)
					result = result.concat(a);
			}
		}
		return result;
	},

	/**
	 * Calculate the box to fit all sub molecule.
	 * @param {Int} coordMode Determine to calculate 2D or 3D box. Value from {@link Kekule.CoordMode}.
	 * @returns {Hash} Box information. {x1, y1, z1, x2, y2, z2} (in 2D mode z1 and z2 will not be set).
	 */
	getContainerBox: function(coordMode)
	{
		var result = null;
		var subMols = this.getPropStoreFieldValue('subMolecules');
		if (subMols)
		{
			for (var i = 0, l = subMols.getItemCount(); i < l; ++i)
			{
				var mol = subMols.getObjAt(i);
				var box = mol.getContainerBox(coordMode);
				if (box)
				{
					if (!result)
						result = Object.extend({}, box);
					else
						result = Kekule.BoxUtils.getContainerBox(result, box);
				}
			}
		}
		return result;
	},

	/** @private */
	doGetCtab: function() { return null; },
	/** @private */
	doSetCtab: function() {},
	/** @private */
	doGetFormula: function() { return null; },
	/** @private */
	doSetFormula: function() {},

	/**
	 * Get count of child molecules.
	 * @returns {Int}
	 */
	getChildCount: function()
	{
		return this.getSubMolecules().getChildCount();
	},
	/**
	 * Get child object at index.
	 * @param {Int} index
	 * @returns {Variant}
	 */
	getChildAt: function(index)
	{
		return this.getSubMolecules().getChildAt(index);
	},
	/**
	 * Get the index of obj in children list of root.
	 * @param {Variant} obj
	 * @returns {Int} Index of obj or -1 when not found.
	 */
	indexOfChild: function(obj)
	{
		return this.getSubMolecules().indexOfChild(obj);
	},
	/**
	 * Returns next sibling object to childObj.
	 * @param {Object} childObj
	 * @returns {Object}
	 */
	getNextSiblingOfChild: function(childObj)
	{
		return this.getSubMolecules().getNextSiblingOfChild(childObj);
	},
	/**
	 * Append obj to children list of root. If obj already inside, nothing will be done.
	 * @param {Object} obj
	 * @returns {Int} Index of obj after appending.
	 */
	appendChild: function(obj)
	{
		return this.getSubMolecules().appendChild(obj);
	},
	/**
	 * Insert obj to index of children list of root. If obj already inside, its position will be changed.
	 * @param {Object} obj
	 * @param {Object} index
	 * @return {Int} Index of obj after inserting.
	 */
	insertChild: function(obj, index)
	{
		return this.getSubMolecules().insertChild(obj, index);
	},
	/**
	 * Insert obj before refChild in list of root. If refChild is null or does not exists, obj will be append to tail of list.
	 * @param {Object} obj
	 * @param {Object} refChild
	 * @return {Int} Index of obj after inserting.
	 */
	insertBefore: function(obj, refChild)
	{
		return this.getSubMolecules().insertBefore(obj, refChild);
	},
	/**
	 * Remove a child at index.
	 * @param {Int} index
	 * @returns {Variant} Child object removed.
	 */
	removeChildAt: function(index)
	{
		return this.getSubMolecules().removeChildAt(index);
	},
	/**
	 * Remove obj from children list of root.
	 * @param {Variant} obj
	 * @returns {Variant} Child object removed.
	 */
	removeChild: function(obj)
	{
		return this.getSubMolecules().removeChild(obj);
	}
});

/**
 * A list of molecule.
 * @class
 * @augments Kekule.ChemObjList
 * @param {String} id Id of list.
 */
Kekule.MoleculeList = Class.create(Kekule.ChemObjList,
/** @lends Kekule.MoleculeList# */
{
	/** @private */
	CLASS_NAME: 'Kekule.MoleculeList',
	/** @private */
	/** @constructs */
	initialize: function($super, id)
	{
		$super(id, Kekule.Molecule);
	}
});

/**
 * Class to store label strings of different structure node (e.g., atom list, RGroup...).
 * @class
 */
Kekule.ChemStructureNodeLabels = {
	/** Whether display isotope alias (e.g., D instead of 2H). */
	ENABLE_ISOTOPE_ALIAS: true,

	/** Label for unset element. */
	UNSET_ELEMENT: '?',

	/* Label for deuterium */
	//DEUTERIUM: 'D',

	// for Pseudoatom
	/** Label for dummy atom. */
	DUMMY_ATOM: 'Du',
	/** Label for Non C/H atom. */
	HETERO_ATOM: 'Q',
	/** Label for Unspecific atom */
	ANY_ATOM: 'A',
	/** Label for Custom atom */
	CUSTOM_ATOM: '@',

	// for VariableAtom
	/** Label for Unspecific atom */
	VARIABLE_ATOM: 'L',

	/** Default label for sub group */
	SUBGROUP: 'R',

	// for VariableAtom
	/** Display isotope list in bracket, such as [H, 13C, O, P]. */
	ISO_LIST_LEADING_BRACKET: '[',
	/** Display isotope list in bracket, such as [H, 13C, O, P]. */
	ISO_LIST_TAILING_BRACKET: ']',
	/** Default delimiter for each isotope in list */
	ISO_LIST_DELIMITER: ',',
	/** Default prefix to indicate it is a disallow list. */
	ISO_LIST_DISALLOW_PREFIX: 'NOT'
}

/**
 * A factory class to create suitable structure node by node symbol (atomic symbol, R, L and so on).
 * @class
 */
Kekule.ChemStructureNodeFactory = {
	/** @private */
	CANDIDATE_CLASSES: [Kekule.SubGroup, Kekule.VariableAtom, Kekule.Pseudoatom /*, Kekule.Atom*/],

	getClassByLabel: function(label, defaultClass)
	{
		if (defaultClass === undefined)
		{
			defaultClass = Kekule.Pseudoatom;
		}
		var NL = Kekule.ChemStructureNodeLabels;
		var candidateLabels = [
			[NL.SUBGROUP],
			[NL.VARIABLE_ATOM],
			[NL.DUMMY_ATOM, NL.HETERO_ATOM, NL.ANY_ATOM, NL.CUSTOM_ATOM]
		];
		var classes = Kekule.ChemStructureNodeFactory.CANDIDATE_CLASSES;
		var cclass;
		for (var i = 0, l = classes.length; i < l; ++i)
		{
			var c = classes[i];
			var suitLabels = candidateLabels[i];
			if (suitLabels.indexOf(label) >= 0)  // class found
			{
				cclass = c;
				break;
			}
		}
		if (!cclass)  // class not found, check if it is atom or use default one
		{
			/*
			if (label === Kekule.ChemStructureNodeLabels.DEUTERIUM)
				cclass = Kekule.Atom;
			else
			*/
			if (Kekule.IsotopesDataUtil.isIsotopeIdAvailable(label))
				cclass = Kekule.Atom;
			else
				cclass = defaultClass;
		}
		return cclass;
	},

	createByLabel: function(label)
	{
		var cclass = Kekule.ChemStructureNodeFactory.getClassByLabel(label);
		var result = new cclass();
		if (result instanceof Kekule.Pseudoatom)
			result.setSymbol(label);
		else if (result instanceof Kekule.Atom)
		{
			result.setIsotopeId(label);
		}
		return result;
	}
}

})();
