/**
 * @fileoverview
 * Implementation of repository for editor.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /render/kekule.render.base.js
 * requires /render/kekule.render.extensions.js
 * requires /render/kekule.render.kekule.render.utils.js
 * requires /widgets/chem/editor/kekule.chemEditor.extensions.js
 */

(function(){
"use strict";

/**
 * Base repository item class.
 * @class
 * @augments ObjectEx
 *
 * @property {String} name The unique name of this repository item.
 */
Kekule.Editor.AbstractRepositoryItem = Class.create(ObjectEx,
/** @lends Kekule.Editor.AbstractRepositoryItem# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.AbstractRepositoryItem',
	/** @construct */
	initialize: function($super)
	{
		$super();
	},
	/** @private */
	initProperties: function()
	{
		//this.defineProp('repository', {'dataType': 'Kekule.ChemObject', 'serializable': false});
		this.defineProp('name', {'dataType': DataType.STRING});
	},

	/**
	 * Returns this repository item can be used in 2D/3D or both editor.
	 * @returns {Array}
	 */
	getAvailableCoordModes: function()
	{
		return [];
	},

	/**
	 * Returns chem objects which can stored in this repository.
	 * All objects will be be inserted into chem editor when execute this repository item.
	 * @param {Kekule.ChemObject} targetObj Existing object in editor that the repository objects based on.
	 *   Set it to null to indicate that the repository object should be created in blank space.
	 * @returns {Hash} A hash object that should containing the following fields:
	 *   {
	 *     objects: Array, identical. Objects created.
	  *    mergeObj: Kekule.ChemObject, optional. If created objects can merge with targetObj, this field decide the merge part.
	  *    mergeDest: Kekule.ChemObject, optional. Which object should this repository item merge to. If not set, means merge to targetObj.
	  *    baseObjCoord: The base object system coord to rotate objects added to editor after inserting immediately.
	  *    //centerCoord: Center coord of repository object.
	 *   }
	 */
	createObjects: function(targetObj)
	{
		// do nothing here
	},
	/**
	 * Returns default scale level of this repository object when adding to editor.
	 * @returns {Float}
	 */
	getScale: function()
	{
		return this.doGetScale() || 1;
	},
	/** @private */
	doGetScale: function()
	{
		return 1;
	},
	/**
	 * Returns ref length to adjust repository object coord and size in editor.
	 * @returns {Float}
	 */
	getRefLength: function()
	{
		return this.doGetRefLength() / (this.getScale() || 1);
	},
	/** @private */
	doGetRefLength: function()
	{
		// do nothing here
	},
	/**
	 * Returns if repository object created is one molecule (structure fragment).
	 * @returns {Bool}
	 */
	isOneStructureFragmentObj: function()
	{
		return false;
	}
});

/**
 * A base class for molecule structure based repository item.
 * @class
 * @augments Kekule.Editor.AbstractRepositoryItem
 *
 */
Kekule.Editor.MolRepositoryItem2D = Class.create(Kekule.Editor.AbstractRepositoryItem,
/** @lends Kekule.Editor.MolRepositoryItem2D# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.MolRepositoryItem2D',
	/** @construct */
	initialize: function($super)
	{
		$super();
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('molScale', {'dataType': DataType.FLOAT});
	},
	/** @ignore */
	doGetScale: function($super)
	{
		return this.getMolScale() || $super();
	},
	/** @ignore */
	getAvailableCoordModes: function()
	{
		return Kekule.CoordMode.COORD2D;  // only support 2D
	},
	/** @ignore */
	isOneStructureFragmentObj: function()
	{
		return true;
	},
	/** @ignore */
	createObjects: function(targetObj)
	{
		var mol = this.doCreateObjects(targetObj);
		if (!mol)
			return null;
		var mergeObj = null;
		var mergeDest = null;
		var baseCoord = {'x': 0, 'y': 0};
		if (targetObj)  // targetObj not empty, and a new mol is created, need to merge
		{
			mergeObj = (targetObj instanceof Kekule.ChemStructureNode)? this.doGetMergableNode(mol, targetObj):
					(targetObj instanceof Kekule.ChemStructureConnector)? this.doGetMergableConnector(mol, targetObj):
							null;
			if (mergeObj)
			{
				mergeDest = targetObj;
				baseCoord = mergeObj.getAbsBaseCoord2D();
			}
		}
		return {
			'objects': [mol],
			'mergeObj': mergeObj,
			'mergeDest': mergeDest,
			'baseObjCoord': baseCoord,
			'centerCoord': {'x': 0, 'y': 0}
		};
	},
	/**
	 * Do actual work of createObjects.
	 * Descendants should override this method.
	 * @param {Object} targetObj
	 * @private
	 */
	doCreateObjects: function(targetObj)
	{
		return null;  // do nothing here
	},
	/**
	 * Returns node in repository molecule that need to be merged with target.
	 * Descendants should override this method.
	 * @returns {Kekule.ChemStructureNode}
	 * @private
	 */
	doGetMergableNode: function(mol, targetNode)
	{
		return null;
	},
	/**
	 * Returns connector in repository molecule that need to be merged with target.
	 * Descendants should override this method.
	 * @returns {Kekule.ChemStructureConnector}
	 * @private
	 */
	doGetMergableConnector: function(mol, targetNode)
	{
		return null;
	}
});

/**
 * A class to store predefined molecule template.
 * @class
 * @augments Kekule.Editor.MolRepositoryItem2D
 * @param {Variant} structData Source data of structfragment.
 * @param {String} dataFormat Format id of structData.
 *
 * @property {Variant} structData Source data of structfragment.
 * @property {String} dataFormat Format id of structData.
 */
Kekule.Editor.StoredStructFragmentRepositoryItem2D = Class.create(Kekule.Editor.MolRepositoryItem2D,
/** @lends Kekule.Editor.StoredStructFragmentRepositoryItem2D# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.StoredStructFragmentRepositoryItem2D',
	/** @construct */
	initialize: function($super, structData, dataFormat, defScale)
	{
		$super();
		this.beginUpdate();
		try
		{
			if (dataFormat)
			{
				this.setDataFormat(dataFormat);
			}
			if (structData)  // create stored structfragment
			{
				this.setStructData(structData);
			}
			if (defScale)
				this.setMolScale(defScale);
		}
		finally
		{
			this.endUpdate();
		}
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('structureFragment', {'dataType': 'Kekule.StructureFragment', 'setter': null, 'serializable': false});
		this.defineProp('structData', {'dataType': DataType.STRING});
		this.defineProp('dataFormat', {'dataType': DataType.STRING});
	},
	/** @ignore */
	objectChange: function($super, modifiedProps)
	{
		$super(modifiedProps);
		if ((modifiedProps.indexOf('structData') >= 0) || (modifiedProps.indexOf('dataFormat') >= 0))
		{
			var structFragment = null;
			if (this.getStructData())
				structFragment = this._createTemplateStructFragment();
			this.setPropStoreFieldValue('structureFragment', structFragment);
		}
	},

	/** @private */
	_createTemplateStructFragment: function()
	{
		var structFragment = null;
		if (this.getStructData())
			structFragment = Kekule.IO.loadFormatData(this.getStructData(), this.getDataFormat() || Kekule.IO.DataFormat.KEKULE_JSON);
		if (structFragment)
		{
			// adjust coord
			this._adjustTemplateStructureFragmentCoords(structFragment);
		}
		return structFragment;
	},
	/** @private */
	_adjustTemplateStructureFragmentCoords: function(structFragment)
	{
		structFragment.setCoord2D({'x': 0, 'y': 0});
		var objBox = Kekule.Render.ObjUtils.getContainerBox(structFragment, Kekule.CoordMode.COORD2D, true);

		if (objBox)
		{
			var oldObjCoord = structFragment.getCoordOfMode ?
			structFragment.getCoordOfMode(Kekule.CoordMode.COORD2D, true) || {} :
			{};
			var delta = {};
			delta.x = -(objBox.x2 + objBox.x1) / 2;
			delta.y = -(objBox.y2 + objBox.y1) / 2;
			/*
			 var newObjCoord = Kekule.CoordUtils.add(oldObjCoord, delta);
			 if (structFragment.setCoordOfMode)
			 structFragment.setCoordOfMode(newObjCoord, Kekule.CoordMode.COORD2D);
			 */
			// transform coords of children
			structFragment.beginUpdate();
			try
			{
				for (var i = 0, l = structFragment.getNodeCount(); i < l; ++i)
				{
					var node = structFragment.getNodeAt(i);
					var coord = node.getCoord2D(true);
					coord = Kekule.CoordUtils.add(coord, delta);
					node.setCoord2D(coord);
				}
			}
			finally
			{
				structFragment.endUpdate();
			}
		}
	},

	/** @ignore */
	doGetRefLength: function()
	{
		var mol = this.getStructureFragment();
		return mol? mol.getConnectorLengthMedian(Kekule.CoordMode.COORD2D, true): 0;
	},
	/** @ignore */
	doCreateObjects: function(targetObj)
	{
		var structFragment = this.getStructureFragment();
		return structFragment? structFragment.clone(): null;
	},
	/** @ignore */
	doGetMergableNode: function(mol, targetNode)
	{
		return mol.getAnchorNodeAt(0) || mol.getNodeAt(0);
	},
	/** @ignore */
	doGetMergableConnector: function(mol, targetNode)
	{
		return null;
	}
});

/**
 * A class to store predefined subgroup templates.
 * @class
 * @augments Kekule.Editor.StoredStructFragmentRepositoryItem2D
 * @param {Variant} structData Source data of structfragment.
 * @param {String} dataFormat Format id of structData.
 *
 * @property {Variant} structData Source data of structfragment.
 * @property {String} dataFormat Format id of structData.
 * @property {Array} inputTexts Strings that can direcly used to be insert subgroup,
 *   e.g, COOH and CO2H can both input a carboxyl.
 */
Kekule.Editor.StoredSubgroupRepositoryItem2D = Class.create(Kekule.Editor.StoredStructFragmentRepositoryItem2D,
/** @lends Kekule.Editor.StoredSubgroupRepositoryItem2D# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.StoredSubgroupRepositoryItem2D',
	/** @construct */
	initialize: function($super, structData, dataFormat, defScale)
	{
		$super(structData, dataFormat, defScale);
	},
	/** @private */
	initProperties: function()
	{
		//this.defineProp('abbr', {'dataType': DataType.STRING});
		this.defineProp('inputTexts', {'dataType': DataType.STRING});
	},
	/** @ignore */
	doCreateObjects: function(targetObj)
	{
		var structFragment = this.getStructureFragment();
		if (structFragment)
		{
			var result = new Kekule.SubGroup();  // always returns sub group even if structureFragment is in molecule class
			result.assign(structFragment, false);  // do not copy id
			return result;
		}
		else
			return null;
	},
	/** @ignore */
	createObjects: function($super, targetObj)
	{
		var result = $super(targetObj);
		return result;
		/*
		 var mol = result.objects[0];
		 if (mol && mol.getAnchorNodeCount() >= 0)
		 {
		 var coord = (mol.getAnchorNodeAt(0) || mol.getNodeAt(0)).getAbsCoord2D(true);
		 result.baseObjCoord = coord;
		 }
		 return result;
		 */
	},

	/** @ignore */
	_adjustTemplateStructureFragmentCoords: function(structFragment)
	{
		structFragment.setCoord2D({'x': 0, 'y': 0});
		var anchorNode = structFragment.getCurrConnectableObj();
		if (anchorNode)
		{
			var delta = Kekule.CoordUtils.substract({x: 0, y: 0}, anchorNode.getCoord2D(true));

			// transform coords of children
			structFragment.beginUpdate();
			try
			{
				for (var i = 0, l = structFragment.getNodeCount(); i < l; ++i)
				{
					var node = structFragment.getNodeAt(i);
					var coord = node.getCoord2D(true);
					coord = Kekule.CoordUtils.add(coord, delta);
					node.setCoord2D(coord);
				}
			}
			finally
			{
				structFragment.endUpdate();
			}
		}
	}
});

// utils functions
Kekule.Editor.StoredSubgroupRepositoryItem2D.getRepItemOfInputText = function(inputText)
{
	var repItems = Kekule.Editor.RepositoryItemManager.getAllItems(Kekule.Editor.StoredSubgroupRepositoryItem2D) || [];
	for (var i = 0, l = repItems.length; i < l; ++i)
	{
		var repItem = repItems[i];
		if ((repItem.getInputTexts() || []).indexOf(inputText) >= 0)
			return repItem;
	}
	return null;
};


/**
 * A base class to generate ring structure based repository item.
 * @class
 * @augments Kekule.Editor.MolRepositoryItem2D
 * @param {Int} ringAtomCount Atom count on ring.
 * @param {Float} bondLength Default bond length to generate ring.
 *
 * @property {Int} ringAtomCount Atom count on ring.
 * @property {Float} bondLength Default bond length to generate ring.
 * @property {Bool} isAromatic Whether this ring is a aromatic one (single/double bond intersect),
 */
Kekule.Editor.MolRingRepositoryItem2D = Class.create(Kekule.Editor.MolRepositoryItem2D,
/** @lends Kekule.Editor.MolRingRepositoryItem2D# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.MolRingRepositoryItem2D',
	/** @construct */
	initialize: function($super, ringAtomCount, bondLength)
	{
		$super();
		this.setRingAtomCount(ringAtomCount);
		this.setBondLength(bondLength || 1);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('ringAtomCount', {'dataType': DataType.INT});
		this.defineProp('bondLength', {'dataType': DataType.FLOAT});
		this.defineProp('isAromatic', {'dataType': DataType.BOOL});
		/*
		this.defineProp('ring', {'dataType': 'Kekule.StructureFragment', 'serializable': false,
			'setter': null,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('ring');
				if (!result)
				{
					result = this.generateRing();
					this.setPropStoreFieldValue('ring', result);
				}
				return result;
			}
		});
		*/
	},
	/* @private */
	/*
	objectChange: function($super, modifiedProps)
	{
		$super(modifiedProps);
		if ((modifiedProps.indexOf('ringAtomCount') >= 0) || (modifiedProps.indexOf('bondLength') >= 0))
			this.setPropStoreFieldValue('ring', null);
	},
	*/
	/** @ignore */
	doGetRefLength: function()
	{
		return this.getBondLength();
	},

	/** @ignore */
	doCreateObjects: function(targetObj)
	{
		return this.generateRing();
	},
	/** @ignore */
	doGetMergableNode: function(mol, targetNode)
	{
		return mol.getNodeAt(0);
	},
	/** @ignore */
	doGetMergableConnector: function(mol, targetNode)
	{
		return mol.getConnectorAt(0);
	},

	/**
	 * Generate a ring structure fragment either in targetMol
	 * or a new molecule based on newStructFragmentClass if targetMol is null.
	 * @private
	 */
	generateRing: function(targetMol, newStructFragmentClass)
	{
		if (!newStructFragmentClass)
			newStructFragmentClass = Kekule.Molecule;

		var mol;
		//var children = [];
		if (targetMol)
			mol = targetMol;
		else
			mol = new newStructFragmentClass();
		var atomCount = this.getRingAtomCount();
		var bondLength = this.getBondLength();
		var halfCenterAngle = Math.PI / atomCount;
		var sinHalfCenterAngle = Math.sin(halfCenterAngle);
		//var cosHalfCenterAngle = Math.sin(halfCenterAngle);
		var centerAngle = 2 * halfCenterAngle;
		//var bondAngle = Math.PI - centerAngle;
		var centerAtomLength = bondLength / 2 / sinHalfCenterAngle;
		var startingAngle = ((atomCount === 4) || (atomCount === 8))? -Math.PI / 2 -centerAngle / 2: -Math.PI / 2;

		var lastAtom;
		var lastAtomIndex;
		var firstAtom;
		// generate atoms and bonds
		for (var i = 0; i < atomCount; ++i)
		{
			var atom = this._generateAtom(i);
			var angle = startingAngle + centerAngle * i;
			// set atom coord
			var x = centerAtomLength * Math.cos(angle);
			var y = centerAtomLength * Math.sin(angle);
			atom.setCoord2D({'x': x, 'y': y});
			mol.appendNode(atom);
			//children.push(atom);

			if (i === 0)
				firstAtom = atom;

			// connect with bond
			if (lastAtom)
			{
				var bond = this._generateBond(lastAtomIndex, i);
				mol.appendConnector(bond);
				bond.appendConnectedObj(lastAtom);
				bond.appendConnectedObj(atom);
				//children.push(bond);
			}
			lastAtom = atom;
			lastAtomIndex = i;
		}
		// seal the last bond
		var bond = this._generateBond(atomCount - 1, 0);
		mol.appendConnector(bond);
		bond.appendConnectedObj(lastAtom);
		bond.appendConnectedObj(firstAtom);
		//children.push(bond);

		/*
		if (!targetMol)
			return mol;
		else
			return children;
		*/
		return mol;
	},
	/** @private */
	_generateAtom: function(atomIndex)
	{
		return new Kekule.Atom(null, 'C');  // default use C element
	},
	/** @private */
	_generateBond: function(atomIndex1, atomIndex2)
	{
		var bondOrder = Kekule.BondOrder.SINGLE;
		if (this.getIsAromatic())
		{
			if (atomIndex1 % 2)  // even index
			  bondOrder = Kekule.BondOrder.DOUBLE;
		}
		return new Kekule.Bond(null, null, bondOrder);
	}
});


/**
 * A base class to generate path glyphs.
 * @class
 * @augments Kekule.Editor.AbstractRepositoryItem
 * @param {Class} glyphClass Class to create glyph.
 * @param {Float} glyphRefLength Default length to generate glyph.
 * @property {Hash} glyphInitialParams Initial params to create glyph.
 *
 * @property {Class} glyphClass Class to create glyph.
 * @property {Float} glyphRefLength Default length to generate glyph.
 * @property {Hash} glyphInitialParams Initial params to create glyph.
 */
Kekule.Editor.PathGlyphRepositoryItem2D = Class.create(Kekule.Editor.AbstractRepositoryItem,
/** @lends Kekule.Editor.PathGlyphRepositoryItem2D# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.PathGlyphRepositoryItem2D',
	/** @construct */
	initialize: function($super, glyphClass, glyphRefLength, glyphInitialParams)
	{
		$super();
		this.setGlyphClass(glyphClass);
		this.setGlyphRefLength(glyphRefLength || 1);
		this.setGlyphInitialParams(glyphInitialParams);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('glyphRefLength', {'dataType': DataType.FLOAT});
		this.defineProp('glyphClass', {'dataType': DataType.CLASS, 'serializable': false});
		this.defineProp('glyphInitialParams', {'dataType': DataType.HASH});
	},

	/** @ignore */
	getAvailableCoordModes: function()
	{
		return Kekule.CoordMode.COORD2D;  // only support 2D
	},
	/** @ignore */
	doGetRefLength: function()
	{
		return this.getGlyphRefLength();
	},

	/** @ignore */
	createObjects: function(targetObj)
	{
		var glyph = this.generateGlyph();
		var baseCoord = {'x': 0, 'y': 0};
		return {
			'objects': [glyph],
			'mergeObj': null,
			'mergeDest': null,
			'baseObjCoord': baseCoord,
			'centerCoord': baseCoord
		};
	},

	/** @private */
	generateGlyph: function()
	{
		var gClass = this.getGlyphClass();
		var obj = new gClass(null, this.getGlyphRefLength(), this.getGlyphInitialParams());
		return obj;
	}
});


/**
 * A manager to store all predefined subgroup repositories
 * @class
 */
Kekule.Editor.RepositoryItemManager = {
	/** @private */
	_itemClassMap: new Kekule.MapEx(true),
	/** @private */
	_itemNameMap: new Kekule.MapEx(true),
	/**
	 * Returns all repository items of a particular repository class.
	 * @param {Class} repClass
	 * @returns {Array}
	 */
	getAllItems: function(repClass)
	{
		return RM._itemClassMap.get(repClass);
	},
	getItem: function(name)
	{
		return RM._itemNameMap.get(name);
	},
	/**
	 * Register a repository item.
	 * @param {Kekule.Editor.AbstractRepositoryItem} repItem
	 */
	register: function(repItem)
	{
		var name = repItem.getName();
		var replacedItem;
		if (name)		// add to name map
		{
			replacedItem = RM.getItem();
			RM._itemNameMap.set(name, repItem);
		}
		// add to class map
		var repClass = repItem.getClass();
		var items = RM.getAllItems(repClass);
		if (!items)
		{
			items = [repItem];
			RM._itemClassMap.set(repClass, items);
		}
		else
		{
			if (replacedItem)  // replace old
				Kekule.ArrayUtils.replace(items, replacedItem, repItem);
			else  // add new
				Kekule.ArrayUtils.pushUnique(items, repItem);
		}
	},
	/**
	 * Unregister a repository item.
	 * @param {Kekule.Editor.AbstractRepositoryItem} repItem
	 */
	unregister: function(repItem)
	{
		var repClass = repItem.getClass();
		// remove from class map
		var items = RM.getAllItems(repClass);
		if (items)
		{
			Kekule.ArrayUtils.remove(items, repItem);
		}
		// remove from name map
		var name = repItem.getName();
		if (name)
		{
			RM._itemNameMap.remove(name);
		}
	}
};
var RM = Kekule.Editor.RepositoryItemManager;


// register all predefined subgroup rep items
Kekule._registerAfterLoadProc(function (){
	if (Kekule.Editor.RepositoryData)
	{
		var data = Kekule.Editor.RepositoryData.subGroups || [];
		for (var i = 0, l = data.length; i < l; ++i)
		{
			var detail = data[i];
			var repItem = new Kekule.Editor.StoredSubgroupRepositoryItem2D(detail.structData, detail.dataFormat, detail.scale);
			repItem.setInputTexts(detail.inputTexts).setName(detail.name || detail.inputTexts[0]);
			RM.register(repItem);
			//console.log('reg', repItem);
		}
		var data = Kekule.Editor.RepositoryData.fragments || [];
		for (var i = 0, l = data.length; i < l; ++i)
		{
			var detail = data[i];
			var repItem = new Kekule.Editor.StoredStructFragmentRepositoryItem2D(detail.structData, detail.dataFormat, detail.scale);
			repItem.setName(detail.name);
			RM.register(repItem);
			//console.log('reg', repItem);
		}
	}
});

})();