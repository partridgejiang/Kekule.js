/**
 * @fileoverview
 * Implementation of property markers (e.g. charge mark, lone pair, etc.) binding to the chem object.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /core/kekule.structures.js
 * requires /core/kekule.chemUtils.js
 */

(function(){
"use strict";

var AU = Kekule.ArrayUtils;

/**
 * A recommended namespace for all attach marker classes
 * @namespace
 */
Kekule.ChemMarker = {};

// extend chemObject, enable associate descriptive glyphs to it
/** @ignore */
ClassEx.extend(Kekule.ChemObject,
/** @lends Kekule.ChemObject# */
{
	/**
	 * Returns whether current object is an attachedMarker of parent object.
	 * @returns {Bool}
	 */
	isAttachedMarker: function()
	{
		var p = this.getParent();
		return (p && p.hasMarker(this));
	},
	/**
	 * Notify {@link Kekule.ChemObject#attachedMarkers} property has been changed
	 * @private
	 */
	notifyAttachedMarkersChanged: function()
	{
		this.notifyPropSet('attachedMarkers', this.getPropStoreFieldValue('attachedMarkers'));
	},
	/** @private */
	_attachedMarkerAdded: function(marker)
	{
		// do nothing here
	},
	/** @private */
	_attachedMarkerRemoved: function(marker)
	{
		// do nothing here
	},

	/**
	 * Return count of attached markers.
	 * @returns {Int}
	 */
	getMarkerCount: function()
	{
		var markers = this.getPropStoreFieldValue('attachedMarkers');
		return markers? markers.length: 0;
	},
	/**
	 * Get attached marker at index.
	 * @param {Int} index
	 * @returns {Kekule.ChemObject}
	 */
	getMarkerAt: function(index)
	{
		var markers = this.getPropStoreFieldValue('attachedMarkers');
		return markers? markers[index]: null;
	},
	/**
	 * Returns the first child marker of a specified class type.
	 * @param {Class} classType
	 * @param {Bool} exactMatch If true, only marker of classType (not its descendants) should be returned.
	 * @returns {Kekule.ChemObject}
	 */
	getMarkerOfType: function(classType, exactMatch)
	{
		for (var i = 0, l = this.getMarkerCount(); i < l; ++i)
		{
			var marker = this.getMarkerAt(i);
			if ((exactMatch && marker.getClass() === classType) || (marker instanceof classType))
				return marker;
		}
		return null;
	},
	/**
	 * Returns all child markers of a specified class type.
	 * @param {Class} classType
	 * @param {Bool} exactMatch If true, only markers of classType (not its descendants) should be returned.
	 * @returns {Array}
	 */
	getMarkersOfType: function(classType, exactMatch)
	{
		var result = [];
		for (var i = 0, l = this.getMarkerCount(); i < l; ++i)
		{
			var marker = this.getMarkerAt(i);
			if ((exactMatch && marker.getClass() === classType) || (marker instanceof classType))
				result.push(marker);
		}
		return result;
	},
	/**
	 * Get attached marker of classType. If no such a marker currently and canCreate is true, a new marker will be created.
	 * @param {Class} classType
	 * @param {Bool} canCreate
	 * @param {Bool} exactMatch If true, only marker of classType (not its descendants) should be returned.
	 * @param {Hash} defProps If create a new marker, those prop values will be applied.
	 * @returns {Kekule.ChemObject}
	 */
	fetchMarkerOfType: function(classType, canCreate, exactMatch, defProps)
	{
		var result = this.getMarkerOfType(classType, exactMatch);
		if (!result && canCreate)
		{
			result = new classType();
			result.beginUpdate();
			try
			{
				if (defProps)
				{
					result.setPropValues(defProps);
				}
				//console.log('fetch create on', this.getId());
				this.appendMarker(result);
			}
			finally
			{
				result.endUpdate();
			}
		}
		return result;
	},
	/**
	 * Returns markers that has no coord on coordMode
	 * @param {Int} coordMode
	 * @return {Array}
	 */
	getUnplacedMarkers: function(coordMode)
	{
		var result = [];
		for (var i = 0, l = this.getMarkerCount(); i < l; ++i)
		{
			var marker = this.getMarkerAt(i);
			if (!marker.getCoordOfMode(coordMode))
				result.push(marker);
		}
		return result;
	},
	/**
	 * Get index of attached marker in marker array.
	 * @param {Kekule.ChemObject} marker
	 * @returns {Int}
	 */
	indexOfMarker: function(marker)
	{
		var markers = this.getPropStoreFieldValue('attachedMarkers');
		return markers? markers.indexOf(marker): -1;
	},
	/**
	 * Check if a marker has been attached to this object.
	 * @param {Kekule.ChemObject} marker
	 * @returns {Bool}
	 */
	hasMarker: function(marker)
	{
		return this.indexOfMarker(marker) >= 0;
	},
	/**
	 * Returns whether there exists child markers of a specified class type.
	 * @param {Class} classType
	 * @param {Bool} exactMatch If true, only markers of classType (not its descendants) should be considered.
	 * @returns {Bool}
	 */
	hasMarkerOfType: function(classType, exactMatch)
	{
		return !!this.getMarkerOfType(classType, exactMatch);
	},
	/**
	 * Attach a marker to this object. If marker already exists, nothing will be done.
	 * @param {Kekule.ChemObject} marker
	 */
	appendMarker: function(marker)
	{
		var index = this.indexOfMarker(marker);
		if (index >= 0) // already exists
			return index;// do nothing
		else
		{
			var result = this.getAttachedMarkers(true).push(marker);
			marker.beginUpdate();
			try
			{
				if (marker.setOwner)
					marker.setOwner(this.getOwner());
				if (marker.setParent)
					marker.setParent(this);
				this._attachedMarkerAdded(marker);
			}
			finally
			{
				marker.endUpdate();
			}
			this.notifyAttachedMarkersChanged();
			return result;
		}
	},
	/**
	 * Insert marker before refMarker in marker list. If refMarker is null or does not exists, marker will be append to tail of list.
	 * @param {Kekule.ChemObject} marker
	 * @param {Kekule.ChemObject} refMarker
	 * @return {Int} Index of obj after inserting.
	 */
	insertMarkerBefore: function(marker, refMarker)
	{
		var refIndex = this.indexOfMarker(refMarker);
		return this.insertMarkerAt(marker, refIndex);
	},
	/**
	 * Insert marker to index. If index is not set, marker will be inserted to the tail of the marker array.
	 * @param {Kekule.ChemObject} marker
	 * @param {Int} index
	 */
	insertMarkerAt: function(marker, index)
	{
		var i = this.indexOfMarker(marker);
		var markers = this.getAttachedMarkers(true);
		if (Kekule.ObjUtils.isUnset(index) || (index < 0))
			index = markers.length;
		if (i >= 0)  // already inside, adjust position
		{
			markers.splice(i, 1);
			markers.splice(index, 0, marker);
		}
		else // new one
		{
			markers.splice(index, 0, marker);
			if (marker.setOwner)
				marker.setOwner(this.getOwner());
			if (marker.setParent)
				marker.setParent(this);
			this._attachedMarkerAdded(marker);
		}
		this.notifyAttachedMarkersChanged();
		return index;
	},
	/**
	 * Change index of marker.
	 * @param {Kekule.ChemObject} marker
	 * @param {Int} index
	 */
	setMarkerIndex: function(marker, index)
	{
		var i = this.indexOfMarker(marker);
		if (i >= 0)  // already inside, adjust position
		{
			var markers = this.getPropStoreFieldValue('attachedMarkers'); // this.getAttachedMarkers();
			markers.splice(i, 1);
			markers.splice(index, 0, marker);
		}
	},
	/**
	 * Remove marker at index in attached marker list.
	 * @param {Int} index
	 */
	removeMarkerAt: function(index)
	{
		var marker = this.getMarkerAt(index);
		if (marker)
		{
			var result = this.getAttachedMarkers(true).splice(index, 1);
			if (marker.setOwner)
				marker.setOwner(null);
			if (marker.setParent)
				marker.setParent(null);
			this._attachedMarkerRemoved(marker);
			this.notifyAttachedMarkersChanged();
			return result;
		}
	},
	/**
	 * Remove an attached marker.
	 * @param {Kekule.ChemObject} marker
	 */
	removeMarker: function(marker)
	{
		var index = this.indexOfMarker(marker);
		if (index >= 0)
			return this.removeMarkerAt(index);
	},
	/**
	 * Replace oldMarker with new one.
	 * @param {Kekule.ChemObject} oldMarker
	 * @param {Kekule.ChemObject} newMarker
	 */
	replaceMarker: function(oldMarker, newMarker)
	{
		var oldIndex = this.indexOfMarker(oldMarker);
		if (oldIndex < 0)  // old marker not exists
		{
			return this;
		}
		else
		{
			this.removeMarkerAt(oldIndex);
			this.insertMarkerAt(newMarker, oldIndex);
			return this;
		}
	},
	/**
	 * Remove all attached markers.
	 */
	clearMarkers: function()
	{
		//var oldMarkers = AU.clone(this.getAttachedMarkers());
		var oldMarkers = this.getPropStoreFieldValue('attachedMarkers');
		if (oldMarkers)
			oldMarkers = AU.clone(oldMarkers);

		this.setPropStoreFieldValue('attachedMarkers', null);

		if (oldMarkers)
		{
			for (var i = 0, l = oldMarkers.length; i < l; ++i)
			{
				var marker = oldMarkers[i];
				if (marker.setOwner)
					marker.setOwner(null);
				if (marker.setParent)
					marker.setParent(null);
				this._attachedMarkerRemoved(marker);
			}
		}

		this.notifyAttachedMarkersChanged();
		return this;
	},

	autoSetMarker2DPos: function(marker, offset, allowCoordBorrow, avoidDirectionAngles)
	{
		if (this.hasMarker(marker))
		{
			var angle = Kekule.ChemStructureUtils.getMostEmptyDirection2DAngleOfObj(this, [marker], allowCoordBorrow, true, false, avoidDirectionAngles);
			var coord = {'x': offset * Math.cos(angle), 'y': offset * Math.sin(angle)};
			//console.log('angle2', coord);
			marker.setCoord2D(coord);
		}
	},

	/** @private */
	_updateAttachedMarkersOwner: function(owner)
	{
		if (!owner)
			owner = this.getOwner();
		for (var i = 0, l = this.getMarkerCount(); i < l; ++i)
		{
			var marker = this.getMarkerAt(i);
			if (marker.setOwner)
				marker.setOwner(owner);
		}
	},
	/** @private */
	_updateAttachedMarkersParent: function(parent)
	{
		if (!parent)
			parent = this;
		/*
		if (this.getMarkerCount() > 0)
			console.log('set parent', parent.getClassName());
    */
		for (var i = 0, l = this.getMarkerCount(); i < l; ++i)
		{
			var marker = this.getMarkerAt(i);
			if (marker.setParent)
				marker.setParent(parent);
		}
	}
});
ClassEx.extendMethod(Kekule.ChemObject, 'ownerChanged', function($origin, newOwner){
	$origin(newOwner);
	this._updateAttachedMarkersOwner(newOwner);
});
ClassEx.extendMethod(Kekule.ChemObject, 'removeChild', function($origin, child){
	//console.log('remove child', child.getClassName(), child.getId());
	var result = $origin(child);
	if (!result)
		result = this.removeMarker(child);  // || $origin(child);
	return result;
});
ClassEx.extendMethod(Kekule.ChemObject, 'insertBefore', function($origin, child, refChild){
	var result = $origin(child, refChild);
	if (result < 0)
	{
		if (refChild && this.hasMarker(refChild) || child instanceof Kekule.ChemMarker.BaseMarker)
			result = this.insertMarkerBefore(child, refChild);
	}
	return result;
});

ClassEx.defineProp(Kekule.ChemObject, 'attachedMarkers',
{
	'dataType': DataType.ARRAY, 'scope':  Class.PropertyScope.PUBLISHED,
	'getter': function(autoCreate)
	{
		var result = this.getPropStoreFieldValue('attachedMarkers');
		if (!result && autoCreate)
		{
			result = [];
			this.setPropStoreFieldValue('attachedMarkers', result);
		}
		return result;
	},
	'setter': function(value)
	{
		//console.log('set markers', value, this.getClassName());
		this.clearMarkers();
		this.setPropStoreFieldValue('attachedMarkers', value);
		this._updateAttachedMarkersOwner();
		this._updateAttachedMarkersParent();
		//console.log('after set', this.getAttachedMarkers());
	}
});
/*
// if true, position of newly added marker will be set automatically
ClassEx.defineProp(Kekule.ChemObject, 'autoSetAttachedMarkerPos',
{
	'dataType': DataType.BOOL, 'scope':  Class.PropertyScope.PUBLISHED
});
*/


})();