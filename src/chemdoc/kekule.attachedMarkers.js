/**
 * @fileoverview
 * Implementation of property markers (e.g. charge mark, lone pair, etc.) binding to the chem object.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /core/kekule.structures.js
 */

(function(){
"use strict";

var AU = Kekule.ArrayUtils;


// extend chemObject, enable associate descriptive glyphs to it
/** @ignore */
ClassEx.extend(Kekule.ChemObject,
/** @lends Kekule.ChemObject# */
{
	/**
	 * Notify {@link Kekule.ChemObject#attachedMarkers} property has been changed
	 * @private
	 */
	notifyAttachedMarkersChanged: function()
	{
		this.notifyPropSet('attachedMarkers', this.getPropStoreFieldValue('attachedMarkers'));
	},

	/**
	 * Return count of attached markers.
	 * @returns {Int}
	 */
	getMarkerCount: function()
	{
		return this.getAttachedMarkers().length;
	},
	/**
	 * Get attached marker at index.
	 * @param {Int} index
	 * @returns {Kekule.ChemObject}
	 */
	getMarkerAt: function(index)
	{
		return this.getAttachedMarkers()[index];
	},
	/**
	 * Get index of attached marker in marker array.
	 * @param {Kekule.ChemObject} marker
	 * @returns {Int}
	 */
	indexOfMarker: function(marker)
	{
		return this.getAttachedMarkers().indexOf(marker);
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
			var result = this.getAttachedMarkers().push(marker);
			if (marker.setOwner)
				marker.setOwner(this.getOwner());
			if (marker.setParent)
				marker.setParent(this);
			this.notifyAttachedMarkersChanged();
			return result;
		}
	},
	/**
	 * Insert marker to index. If index is not set, marker will be inserted to the tail of the marker array.
	 * @param {Kekule.ChemObject} marker
	 * @param {Int} index
	 */
	insertMarkerAt: function(marker, index)
	{
		var i = this.indexOfMarker(marker);
		var markers = this.getAttachedMarkers();
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
		var markers = this.getAttachedMarkers();
		var i = this.indexOfMarker(marker);
		if (i >= 0)  // already inside, adjust position
		{
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
			this.getAttachedMarkers().splice(index, 1);
			if (marker.setOwner)
				marker.setOwner(null);
			if (marker.setParent)
				marker.setParent(null);
			this.notifyAttachedMarkersChanged();
		}
	},
	/**
	 * Remove an attached marker.
	 * @param {Kekule.ChemObject} marker
	 */
	removeMarker: function(marker)
	{
		var index = this.getMarkerAt(marker);
		if (index >= 0)
			this.removeMarkerAt(index);
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
		var oldMarkers = AU.clone(this.getAttachedMarkers());
		this.setPropStoreFieldValue('attachedMarkers', []);

		for (var i = 0, l = oldMarkers.length; i < l; ++i)
		{
			var marker = oldMarkers[i];
			if (marker.setOwner)
				marker.setOwner(null);
			if (marker.setParent)
				marker.setParent(null);
		}

		this.notifyAttachedMarkersChanged();
		return this;
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

ClassEx.defineProp(Kekule.ChemObject, 'attachedMarkers',
{
	'dataType': DataType.ARRAY, 'scope':  Class.PropertyScope.PUBLISHED,
	'getter': function()
	{
		var result = this.getPropStoreFieldValue('attachedMarkers');
		if (!result)
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


})();