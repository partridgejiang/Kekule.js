/**
 * @fileoverview
 * This file provides some essential helper classes for algorithms on chem structures.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /core/kekule.structures.js
 * requires /data/kekule.dataUtils.js
 * requires /utils/kekule.utils.js
 * requires /localizations/
 */

(function(){

"use strict";

/**
 * A container class contains nodes and/or connectors as a "partial structure fragment".
 * @class
 * @augments ObjectEx
 *
 * @property {Array} nodes All structure nodes in this container.
 * @property {Array} connectors Connectors (usually bonds) in this container.
 */
Kekule.ChemStructObjContainer = Class.create(ObjectEx,
/** @lends Kekule.ChemStructObjContainer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemStructObjContainer',
	/** @constructs */
	initialize: function($super)
	{
		$super();
		this.setPropStoreFieldValue('nodes', []);
		this.setPropStoreFieldValue('connectors', []);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('nodes', {'dataType': DataType.ARRAY, 'serializable': false, 'setter': null});
		this.defineProp('connectors', {'dataType': DataType.ARRAY, 'serializable': false, 'setter': null});
	},
	/**
	 * Clear all nodes and connectors in container.
	 */
	clear: function()
	{
		this.getNodes().length = 0;
		this.getConnectors().length = 0;
		return this;
	},

	/**
	 * Add new node or connector into container.
	 * @param {Kekule.ChemStructureObject} obj
	 */
	add: function(obj)
	{
		var a = null;
		if (obj instanceof Kekule.ChemStructureConnector)
			a = this.getConnectors();
		else if (obj instanceof Kekule.ChemStructureNode)
			a = this.getNodes();

		if (!a)  // not connector or node, report error
			Kekule.error(Kekule.$L('ErrorMsg.CANNOT_ADD_NON_NODE_NOR_CONNECTOR_TO_STRUCT_CONTAINER')/*Kekule.ErrorMsg.CANNOT_ADD_NON_NODE_NOR_CONNECTOR_TO_STRUCT_CONTAINER*/);
		else
			Kekule.ArrayUtils.pushUnique(a, obj);
		return this;
	},

	/**
	 * Remove an object from container.
	 * @param {Kekule.ChemStructureObject} obj
	 */
	remove: function(obj)
	{
		var a = null;
		if (obj instanceof Kekule.ChemStructureConnector)
			a = this.getConnectors();
		else // if (obj instanceof Kekule.ChemStructureNode)
			a = this.getNodes();

		Kekule.ArrayUtils.remove(a, obj);
		return this;
	}
});

})();