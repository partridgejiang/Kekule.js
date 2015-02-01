/**
 * @fileoverview
 * Classes and utils to help to build a chemical structure (such as molecule).
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /lan/kekule.common.js
 * requires /data/kekule.dataUtils.js
 * requires /core/kekule.elements.js
 * requires /core/kekule.electrons.js
 * requires /core/kekule.structures.js
 */

/**
 * Class to help to build a legal chemical structure.
 * @class
 * @augments ObjectEx
 * @param {Kekule.StructureFragment} target Target object to build.
 *
 * @property {Kekule.StructureFragment} target Target object to build.
 */
Kekule.ChemStructureBuilder = Class.create(ObjectEx,
/** @lends Kekule.ChemStructureBuilder# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemStructureBuilder',
	/** @constructs */
	initialize: function($super, target)
	{
		$super();
		if (target)
			this.setTarget(target);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('target', {'dataType': 'Kekule.StructureFragment'});
		//this.defineProp('coordMode', {'dataType': DataType.INT, 'defaultValue': Kekule.CoordMode.COORD2D});
	},

	/**
	 * Set coordinates of a node. 2D or 3D will be automatically recognized.
	 * First parameter should be a node, then one or two hash of coordinates can be passed in.
	 * @param {Kekule.ChemStructureNode} node
	 * @param {Hash} coordinates
	 */
	setNodeCoord: function()
	{
		var a = Array.prototype.slice.call(arguments);
		var node = a.shift();
		var coords = a;
		for (var i = 0, l = coords.length; (i < l) && (i < 2); ++i)
		{
			var coord = coords[i];
			if (coord.z !== undefined)  // has z coord, a 3D one
				node.setCoordOfMode(coord, Kekule.CoordMode.COORD3D);
			else
				node.setCoordOfMode(coord, Kekule.CoordMode.COORD2D);
		}
	},

	/**
	 * A generic method to create a new {@link Kekule.ChemStructureNode}.
	 * The first parameter should be the class of node while second to be id of node.
	 * The third and forth parameters should be 2d and 3d coordinates.
	 * @returns {Kekule.ChemStructureNode}.
	 */
	createNode: function()
	{
		var a = Array.prototype.slice.call(arguments);
		var nodeClass = a.shift();
		var id = a.shift();
		var coords = a;
		var result = new nodeClass(id);
		this.setNodeCoord(result, coords);
		this.appendNode(result);
		return result;
	},

	/**
	 * Create a connector between connectedNodes.
	 * @param {Class} connectorClass
	 * @param {String} id Id of connector.
	 * @param {Array} connectedObjs
	 * @returns {Kekule.ChemStructureConnector}
	 */
	createConnector: function(connectorClass, id, connectedObjs)
	{
		var result = new connectorClass(id);
		result.setConnectedObjs(connectedObjs);
		return result;
	},

	/**
	 * Add a node to target structure.
	 * @param {Kekule.ChemStructureNode} node
	 * @returns {Kekule.ChemStructureNode}
	 */
	appendNode: function(node)
	{
		if (node && this.getTarget())
		{
			return this.getTarget().appendNode(node);
		}
		else
			return null;
	},

	/**
	 * Add a connector to target structure.
	 * @param {Kekule.ChemStructureConnector}
	 * @returns {Kekule.ChemStructureConnector}
	 */
	appendConnector: function(connector)
	{
		if (connector && this.getTarget())
		{
			return this.getTarget().appendConnector(connector);
		}
		else
			return null;
	},

	/**
	 * Create an atom object.
	 * First parameter should be id of atom.
	 * Second and third parameters should be elemSymbolOrAtomicNumber and massNumber,
	 * the rest of parameters should be coordinates of atom.
	 * @param {Object} elemSymbolOrAtomicNumber
	 * @param {Object} massNumber
	 */
	createAtom: function()
	{
		var a = Array.prototype.slice.call(arguments);
		var id = a.shift();
		var elemSymbolOrAtomicNumber = a.shift();
		var massNumber = a.shift();

		var result = new Kekule.Atom(id, elemSymbolOrAtomicNumber, massNumber);
		a.unshift(result);
		this.setNodeCoord.apply(this, a);
		this.appendNode(result)
		return result;
	},

	/**
	 * Create a bond berween connectedNodes.
	 * @param {String} id
	 * @param {Array} connectedObjs
	 * @param {Int} bondOrder
	 * @param {Int} bondStereo
	 * @param {String} bondType
	 */
	createBond: function(id, connectedObjs, bondOrder, bondStereo, bondType)
	{
		var result = new Kekule.Bond(id, connectedObjs, bondOrder);
		result.changeBondForm(bondOrder, null, bondType);
		if (bondStereo)
			result.setStereo(bondStereo);
		this.appendConnector(result);
		return result;
	},

	deleteNode: function()
	{

	},

	/**
	 * Group up nodes and turn them into a {@link Kekule.SubGroup}.
	 * @param {Array} groupNodes A set of {@link Kekule.ChemStructureNode}, must in target structure.
	 * @param {String} id of new sub group.
	 * @returns {Kekule.SubGroup}
	 */
	marshalSubGroup: function(groupNodes, id)
	{
		var target = this.getTarget();
		if (target && target.hasCtab())
		{
			var group = new Kekule.SubGroup(id);
			target.marshalSubFragment(groupNodes, group);
			return group;
		}
		else
			return null;
	}
});