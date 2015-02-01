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
	 * Returns ref length to adjust repository object coord and size in editor.
	 * @returns {Float}
	 */
	getRefLength: function()
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
 * A base class to generate ring structure based repository item.
 * @class
 * @augments Kekule.Editor.AbstractRepositoryItem
 * @param {Int} ringAtomCount Atom count on ring.
 * @param {Float} bondLength Default bond length to generate ring.
 *
 * @property {Int} ringAtomCount Atom count on ring.
 * @property {Float} bondLength Default bond length to generate ring.
 * @property {Bool} isAromatic Whether this ring is a aromatic one (single/double bond intersect),
 */
Kekule.Editor.MolRingRepositoryItem2D = Class.create(Kekule.Editor.AbstractRepositoryItem,
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
	getAvailableCoordModes: function()
	{
		return Kekule.CoordMode.COORD2D;  // only support 2D
	},
	/** @ignore */
	getRefLength: function()
	{
		return this.getBondLength();
	},
	/** @ignore */
	isOneStructureFragmentObj: function()
	{
		return true;
	},
	/** @ignore */
	createObjects: function(targetObj)
	{
		var ring = this.generateRing();
		var mergeObj = null;
		var mergeDest = null;
		var baseCoord = {'x': 0, 'y': 0};
		if (targetObj)  // targetObj not empty, and a new mol is created, need to merge
		{
			mergeObj = (targetObj instanceof Kekule.ChemStructureNode)? ring.getNodeAt(0):
					(targetObj instanceof Kekule.ChemStructureConnector)? ring.getConnectorAt(0):
					null;
			if (mergeObj)
				mergeDest = targetObj;
			baseCoord = mergeObj.getAbsBaseCoord2D();
		}
		return {
			'objects': [ring],
			'mergeObj': mergeObj,
			'mergeDest': mergeDest,
			'baseObjCoord': baseCoord,
			'centerCoord': {'x': 0, 'y': 0}
		};
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
	getRefLength: function()
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

})();