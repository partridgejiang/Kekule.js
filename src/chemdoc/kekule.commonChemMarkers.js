/**
 * @fileoverview
 * Implementation of some concrete property markers (e.g. charge mark, lone pair, etc.) binding to the chem object.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /core/kekule.structures.js
 * requires /chemdoc/kekule.attachedMarkers.js
 * requires /chemdoc/kekule.contentBlocks.js
 */

(function(){

"use strict";

/**
 * Base class of chem marker representing chemical concepts (e.g. charge, lone pair...) of parent chem object.
 * @class
 * @augments Kekule.ChemObject
 * @param {String} id Id of this marker.
 * @param {Hash} coord2D The 2D coordinates of marker, {x, y}, can be null.
 * @param {Hash} coord3D The 3D coordinates of marker, {x, y, z}, can be null.
 *
 * @property {Variant} value Value of the property value of parent chem object.
 */
Kekule.ChemMarker.BaseMarker = Class.create(Kekule.ChemObject,
/** @lends Kekule.ChemMarker.BaseMarker# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemMarker.BaseMarker',
	/**
	 * @constructs
	 */
	initialize: function init($super, id, coord2D, coord3D)
	{
		$super(id, coord2D, coord3D);
	},
	/** @ignore */
	getAutoIdPrefix: function()
	{
		return 'marker';
	}
});
Kekule.ClassDefineUtils.addStandardCoordSupport(Kekule.ChemMarker.BaseMarker);

/**
 * Represent a lone pair marker in rendering parent chem object.
 * @class
 * @augments ChemMarker.BaseMarker
 */
Kekule.ChemMarker.UnbondedElectronSet = Class.create(Kekule.ChemMarker.BaseMarker,
/** @lends Kekule.ChemMarker.UnbondedElectronSet# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemMarker.UnbondedElectronSet',
	/** @private */
	initProperties: function()
	{
		this.defineProp('electronCount', {'dataType': DataType.VARIANT});
	},
	/** @ignore */
	initPropValues: function($super)
	{
		$super();
		this.setElectronCount(2);  // default is lone pair
	}
});

/**
 * Represent a marker represents property (e.g. charge, radical...) of parent chem object.
 * @class
 * @augments Kekule.ChemMarker.BaseMarker
 * @param {String} id Id of this node.
 * @param {Hash} coord2D The 2D coordinates of marker, {x, y}, can be null.
 * @param {Hash} coord3D The 3D coordinates of marker, {x, y, z}, can be null.
 *
 * @property {Variant} value Value of the property value of parent chem object.
 */
Kekule.ChemMarker.ChemPropertyMarker = Class.create(Kekule.ChemMarker.BaseMarker,
/** @lends Kekule.ChemMarker.ChemPropertyMarker# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemMarker.ChemPropertyMarker',
	/** @private */
	initProperties: function()
	{
		this.defineProp('value', {'dataType': DataType.VARIANT, 'serializable': false,
			'getter': function()
			{
				var result;
				var p = this.getParent();
				var propName = this.getPropertyName();
				if (p && propName)
				{
					result = p.getPropValue(propName);
					this.setPropStoreFieldValue('value', result);  // update cached value when possible
				}
				else
				{
					result = this.getPropStoreFieldValue('value');
				}
				return result;
			},
			'setter': function(value)
			{
				this.setPropStoreFieldValue('value', value);
				this.setParentPropValue(value);
			}
		});
	},
	/** @ignore */
	initPropValues: function($super)
	{
		$super();
		/*
		this.setNeedRecalcSize(true);
		this.setSize2D({'x': 0, 'y': 0});
		*/
	},
	/** @private */
	setParentPropValue: function(value)
	{
		var p = this.getParent();
		if (p)
		{
			var propName = this.getPropertyName();
			if (propName && p)
				p.setPropValue(propName, value);
		}
		return this;
	},
	/** @private */
	resetParentPropValue: function()
	{
		return this.setParentPropValue(undefined);
	},
	/* @ignore */
	/*
	doObjectChange: function($super, modifiedPropNames)
	{
		// when text block changed, size may need to be recalculated
		if (Kekule.ArrayUtils.intersect(['text', 'renderOptions'], modifiedPropNames).length)
			this.setNeedRecalcSize(true);
	},
	*/
	/**
	 * Returns the mapped property name of parent chem object.
	 * Descendants should override this method.
	 * @returns {Variant}
	 */
	getPropertyName: function()
	{
		return null;
	},

	// editor related methods
	/** @ignore */
	beforAddingByEditor: function($super, newParent, refSibling)
	{
		if (newParent) // when adding to new parent, update value of parent
		{
			var value = this.getPropStoreFieldValue('value');
			if (Kekule.ObjUtils.notUnset(value))
				this.setParentPropValue(value);  // update to parent
		}
		$super();
	},
	/** @ignore */
	beforeRemovingByEditor: function(parent)
	{
		// when removing from editor, usually we should reset the value of property
		// ensure cached the property value
		this.setPropStoreFieldValue('value', this.getValue());
		this.resetParentPropValue();
	}
});

/**
 * Represent a charge marker (+/-) in rendering parent chem object.
 * @class
 * @augments Kekule.ChemMarker.ChemPropertyMarker
 * @param {String} id Id of this node.
 * @param {Hash} coord2D The 2D coordinates of marker, {x, y}, can be null.
 * @param {Hash} coord3D The 3D coordinates of marker, {x, y, z}, can be null.
 */
Kekule.ChemMarker.Charge = Class.create(Kekule.ChemMarker.ChemPropertyMarker,
/** @lends Kekule.ChemMarker.Charge# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemMarker.Charge',
	/** @ignore */
	getPropertyName: function()
	{
		return 'charge';
	}
});

/**
 * Represent a radical marker in rendering parent chem object.
 * @class
 * @augments Kekule.ChemMarker.ChemPropertyMarker
 * @param {String} id Id of this node.
 * @param {Hash} coord2D The 2D coordinates of marker, {x, y}, can be null.
 * @param {Hash} coord3D The 3D coordinates of marker, {x, y, z}, can be null.
 */
Kekule.ChemMarker.Radical = Class.create(Kekule.ChemMarker.ChemPropertyMarker,
/** @lends Kekule.ChemMarker.Radical# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemMarker.Radical',
	/** @ignore */
	getPropertyName: function()
	{
		return 'radical';
	}
});


ClassEx.extend(Kekule.ChemStructureNode,
/** @lends Kekule.ChemStructureNode# */
{
	/**
	 * Get charge marker of node. If no such a marker currently and canCreate is true, a new marker will be created.
	 * @returns {Kekule.ChemMarker.ChemPropertyMarker}
	 */
	fetchChargeMarker: function(canCreate, defProps)
	{
		return this.fetchMarkerOfType(Kekule.ChemMarker.Charge, canCreate, false, defProps);
	},
	/**
	 * Get radical marker of node. If no such a marker currently and canCreate is true, a new marker will be created.
	 * @returns {Kekule.ChemMarker.ChemPropertyMarker}
	 */
	fetchRadicalMarker: function(canCreate, defProps)
	{
		return this.fetchMarkerOfType(Kekule.ChemMarker.Radical, canCreate, false, defProps);
	}
});

ClassEx.defineProp(Kekule.AbstractAtom, 'lonePairCount', {
	'dataType': DataType.INT, 'scope': Class.PropertyScope.PUBLISHED, 'serializable': false,
	'setter': null,  // currently disable setter
	'getter': function()
	{
		var result = 0;
		var unbondedESets = this.getMarkersOfType(Kekule.ChemMarker.UnbondedElectronSet);
		for (var i = 0, l = unbondedESets.length; i < l; ++i)
		{
			var eSet = unbondedESets[i];
			if (eSet.getElectronCount() === 2)  // a lone pair
				++result;
		}
		return result;
	}
});
ClassEx.extendMethod(Kekule.AbstractAtom, 'doCompare', function($origin, targetObj, options)
	{
		var result = $origin(targetObj, options);
		if (!result && options.method === Kekule.ComparisonMethod.CHEM_STRUCTURE)  // can not find different in origin method
		{
			if (this._getComparisonOptionFlagValue(options, 'lonePair') ||
					this._getComparisonOptionFlagValue(options, 'unbondedElectron'))  // parity null/0 should be regard as one in comparison
			{
				/*
				 var c1 = this.getLonePairCount() || 0;
				 var c2 = (targetObj.getLonePairCount && targetObj.getLonePairCount()) || 0;
				 result = this.doCompareOnValue(c1, c2, options);
				 */
				var _getUnbondedElectronArray = function(atom)
				{
					var result = [];
					if (atom.getMarkersOfType)
					{
						var unbondedESets = atom.getMarkersOfType(Kekule.ChemMarker.UnbondedElectronSet);
						for (var i = 0, l = unbondedESets.length; i < l; ++i)
						{
							var eSet = unbondedESets[i];
							result.push(eSet.getElectronCount())
						}
					}
					result.sort();
					return result;
				};
				var a1 = _getUnbondedElectronArray(this);
				var a2 = _getUnbondedElectronArray(targetObj);
				return Kekule.ArrayUtils.compare(a1, a2);
			}
		}
		return result;
	});

})();