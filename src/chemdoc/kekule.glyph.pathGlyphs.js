/**
 * @fileoverview
 * Implementation of glyphs defined by a series of nodes and paths.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /core/kekule.structures.js
 * requires /chemdoc/kekule.glyph.base.js
 */

(function(){
"use strict";

/**
 * Represent an node in glyph path.
 * @class
 * @augments Kekule.StructureAbstractNode
 * @param {String} id Id of this node.
 * @param {String} nodeType Type of this glyph node. Value from {@link Kekule.Glyph.NodeType}.
 * @param {Hash} coord2D The 2D coordinates of node, {x, y}, can be null.
 * @param {Hash} coord3D The 3D coordinates of node, {x, y, z}, can be null.
 *
 * @property {String} nodeType Type of this glyph node.
 */
Kekule.Glyph.PathGlyphNode = Class.create(Kekule.BaseStructureNode,
/** @lends Kekule.Glyph.PathGlyphNode# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Glyph.PathGlyphNode',
	initialize: function($super, id, nodeType, coord2D, coord3D)
	{
		$super(id);
		if (coord2D)
			this.setCoord2D(coord2D);
		if (coord3D)
			this.setCoord3D(coord3D);
		this.setNodeType(nodeType || Kekule.Glyph.NodeType.LOCATION);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('nodeType', {
			'dataType': DataType.STRING,
			'scope': Class.PropertyScope.PUBLIC
		});
	}
});

/**
 * Enumeration of path types.
 * @class
 */
Kekule.Glyph.NodeType = {
	/* A default node, same as location point, do not need to draw. */
	/*
	DEFAULT: 'default',
	*/
	/** Location point, do not need to draw. Default value of node type. */
	LOCATION: 'location',
	/** Do not need to draw and can not manipulate in editor. */
	HIDDEN: 'hidden'
};

/**
 * Implements the concept of a connections between two or more structure nodes.
 * @class
 * @augments Kekule.BaseStructureConnector
 * @param {String} id Id of this connector.
 * @param {String} pathType Type of path to draw between connected nodes.
 * @param {Array} connectedObjs Objects ({@link Kekule.ChemStructureObject}) connected by connected, usually a connector connects two nodes.
 *
 * @property {String} pathType Type of path to draw between connected nodes, value from {@link Kekule.Glyph.PathType}.
 * @property {Hash} pathParams Other params to control the outlook of path. Mayb including the following fields:
 *   {
 *     lineCount: {Int} need to draw single or multiple line in path?
 *     lineGap: {Float} gap between multiple lines
 *     startArrowType:
 *     startArrowSide:
 *     startArrowLength, startArrowWidth:
 *     endArrowType:
 *     endArrowSide:
 *     endArrowLength, endArrowWidth:
 *   }
 */
Kekule.Glyph.PathGlyphConnector = Class.create(Kekule.BaseStructureConnector,
/** @lends Kekule.Glyph.PathGlyphConnector# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Glyph.PathGlyphConnector',
	/** @constructs */
	initialize: function($super, id, pathType, connectedObjs)
	{
		$super(id, connectedObjs);
		this.setPathType(pathType);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('pathType', {
			'dataType': DataType.STRING,
			'scope': Class.PropertyScope.PUBLISHED,
			'enumSource': Kekule.Glyph.PathType
		});
		this.defineProp('pathParams', {
			'dataType': DataType.HASH,
			'scope': Class.PropertyScope.PUBLISHED,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('pathParams');
				if (!result)
				{
					result = {};
					this.setPropStoreFieldValue('pathParams', result);
				}
				return result;
			},
			'setter': function(value)
			{
				if (!value)
					this.setPropStoreFieldValue('pathParams', null);
				else
					this.setPropStoreFieldValue('pathParams', Object.extend({}, value, true));
			}
		});
	}
});

/**
 * Enumeration of path types.
 * @class
 */
Kekule.Glyph.PathType = {
	/** A straight line, may contains arrow at beginning and ending. */
	LINE: 'L'
};

/**
 * Enumeration of path end arrow types.
 * @class
 */
Kekule.Glyph.ArrowType = {
	NONE: null,
	OPEN: 'open',
	TRIANGLE: 'triangle'
};
/**
 * Enumeration of arrow location around path.
 * @class
 */
Kekule.Glyph.ArrowSide = {
	BOTH: 0,  // default
	SINGLE: 1,  // one one side of path
	REVERSED: -1   // one side but at the different side of SINGLE
};

/**
 * A glyph defined by a series of nodes and connectors (paths).
 * @class
 * @augments Kekule.Glyph
 * @param {String} id Id of this node.
 * @param {Float} refLength ref length of editor, this value will be used to create suitable connector length.
 * @param {Hash} initialParams InitialParams used for creating connector and nodes.
 *   Can including all the fields in pathParams property of connector.
 *   Note: in initialParams, length fields(e.g. startArrowLength, endArrowLength) are based on refLength,
 *   field * refLength will be the actual length passed to connector. In private method createDefaultStructure,
 *   those length fields will be converted into actual length and passed into doCreateDefaultStructure.
 * @param {Object} coord2D The 2D coordinates of node, {x, y}, can be null.
 * @param {Object} coord3D The 3D coordinates of node, {x, y, z}, can be null.
 *
 * @property {Array} nodes All nodes in this glyph.
 * @property {Array} connectors Connectors (paths) in this glyph.
 */
Kekule.Glyph.PathGlyph = Class.create(Kekule.Glyph.Base,
/** @lends Kekule.Glyph.PathGlyph# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Glyph.PathGlyph',
	/**
	 * @constructs
	 */
	initialize: function($super, id, refLength, initialParams, coord2D, coord3D)
	{
		$super(id, coord2D, coord3D);
		this.createDefaultStructure(refLength || 1, initialParams || {});
	},
	doFinalize: function($super)
	{
		if (this.hasCtab())
			this.getCtab().finalize();
		$super();
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('ctab', {
			'dataType': 'Kekule.StructureConnectionTable',
			'scope': Class.PropertyScope.PUBLIC,
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
				}

				this.setPropStoreFieldValue('ctab', value);
			}
		});
		// values are read from ctab
		this.defineProp('nodes', {
			'dataType': DataType.ARRAY,
			'serializable': false,
			'scope': Class.PropertyScope.PUBLIC,
			'setter': null,
			'getter': function() { return this.hasCtab()? this.getCtab().getNodes(): []; }
		});
		this.defineProp('connectors', {
			'dataType': DataType.ARRAY,
			'serializable': false,
			'scope': Class.PropertyScope.PUBLIC,
			'setter': null,
			'getter': function() { return this.hasCtab()? this.getCtab().getConnectors(): []; }
		});
	},

	/**
	 * Create default structure by ref length.
	 * @param {Float} refLength
	 * @param {Hash} initialParams
	 * @private
	 */
	createDefaultStructure: function(refLength, initialParams)
	{
		if (!refLength)
			refLength = 1;
		var actualParams = {};
		var lengthFields = ['lineGap', 'startArrowLength', 'startArrowWidth', 'endArrowLength', 'endArrowWidth'];
		for (var field in initialParams)
		{
			if (lengthFields.indexOf(field) >= 0)
			{
				actualParams[field] = initialParams[field] * refLength;
				//console.log('transform', field, refLength, initialParams[field], actualParams[field]);
			}
			else
				actualParams[field] = initialParams[field];
		}
		return this.doCreateDefaultStructure(refLength, actualParams);
	},
	/**
	 * Do actual work of createDefaultStructure.
	 * Descendants need to override this method.
	 * @param {Float} refLength
	 * @param {Hash} initialParams
	 * @private
	 */
	doCreateDefaultStructure: function(refLength, initialParams)
	{
		// do nothing here
	},

	/** @private */
	getAutoIdPrefix: function()
	{
		return 'p';
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
		if (this.hasCtab())
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
		return this.getCtab().isEmpty();
	},
	/** @private */
	createCtab: function()
	{
		var ctab = new Kekule.StructureConnectionTable(this.getOwner(), this);
		this.setPropStoreFieldValue('ctab', ctab);
		// install event listeners to ctab
		ctab.addEventListener('propValueSet',
			function(e)
			{
				if (e.propName == 'nodes')
				{
					this.notifyPropSet(e.propName, e.propValue);
				}
			}, this);
		ctab.setEnablePropValueSetEvent(true); // to enable propValueSet event
	},
	/**
	 * Check whether a connection table is used to represent this fragment.
	 */
	hasCtab: function()
	{
		return (!!this.getPropStoreFieldValue('ctab'));
	},
	/**
	 * Calculate the box to fit whole glyph.
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
		else
			console.log('no ctab');
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
	}
});

})();