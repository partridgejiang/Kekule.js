/**
 * @fileoverview
 * Implementation of text/rich text block in 2D drawing.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 */

(function(){
"use strict";

var CM = Kekule.CoordMode;
var CU = Kekule.CoordUtils;

/**
 * Represent an block of content in chem document (especially in 2D rendering，drawing in rect),
 * like text block or image.
 * @class
 * @augments Kekule.ChemObject
 * @param {String} id Id of this block.
 * @param {Hash} coord2D The top left 2D coordinates of block, {x, y}, can be null.
 * @param {Hash} coord3D The min 3D coordinates of block box, {x, y, z}, can be null. Usually unneeded.
 *
 * @property {Hash} coord2D The 2D coordinates of glyph, {x, y}.
 * @property {Hash} coord3D The 3D coordinates of glyph, {x, y, z}.
 * @property {Hash} absCoord2D The absolute 2D coordinates of glyph, {x, y}.
 * @property {Hash} absCoord3D The absolute 3D coordinates of glyph, {x, y, z}.
 * @property {Hash} size2D The 2D dimension (width, height) of glyph, {x, y}.
 * @property {Hash} size3D The 3D dimension (width, height, depth) of glyph, {x, y, z}.
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
 * @borrows Kekule.ClassDefineUtils.CommonSizeMethods#getSizeOfMode as #getSizeOfMode
 * @borrows Kekule.ClassDefineUtils.CommonSizeMethods#setSizeOfMode as #setSizeOfMode
 * @borrows Kekule.ClassDefineUtils.CommonSizeMethods#getBoxOfMode as #getBoxOfMode
 * @borrows Kekule.ClassDefineUtils.Size2DMethods#fetchSize2D as #fetchSize2D
 * @borrows Kekule.ClassDefineUtils.Size2DMethods#hasSize2D as #hasSize2D
 * @borrows Kekule.ClassDefineUtils.Size2DMethods#get2DSizeX as #get2DSizeX
 * @borrows Kekule.ClassDefineUtils.Size2DMethods#set2DSizeX as #set2DSizeX
 * @borrows Kekule.ClassDefineUtils.Size2DMethods#get2DSizeY as #get2DSizeY
 * @borrows Kekule.ClassDefineUtils.Size2DMethods#set2DSizeY as #set2DSizeY
 * @borrows Kekule.ClassDefineUtils.CommonSizeMethods#getBox2D as #getBox2D
 * @borrows Kekule.ClassDefineUtils.Size3DMethods#fetchSize3D as #fetchSize3D
 * @borrows Kekule.ClassDefineUtils.Size3DMethods#hasSize3D as #hasSize3D
 * @borrows Kekule.ClassDefineUtils.Size3DMethods#get3DSizeX as #get3DSizeX
 * @borrows Kekule.ClassDefineUtils.Size3DMethods#set3DSizeX as #set3DSizeX
 * @borrows Kekule.ClassDefineUtils.Size3DMethods#get3DSizeY as #get3DSizeY
 * @borrows Kekule.ClassDefineUtils.Size3DMethods#set3DSizeY as #set3DSizeY
 * @borrows Kekule.ClassDefineUtils.CommonSizeMethods#getBox3D as #getBox3D
 */
Kekule.ContentBlock = Class.create(Kekule.ChemObject,
/** @lends Kekule.ContentBlock# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ContentBlock',
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

	},
	/** @private */
	getAutoIdPrefix: function()
	{
		return 'b';
	},
	/**
	 * Returns coord of top-left corner of block.
	 * @param {Int} coordMode
	 * @param {Bool} allowCoordBorrow
	 * @returns {Object}
	 */
	getCornerCoord1: function(coordMode, allowCoordBorrow)
	{
		return this.getCoordOfMode(coordMode, allowCoordBorrow);
	},
	/*
	 * Set coord of top-left corner of block.
	 * @param {Hash} value
	 * @param {Int} coordMode
	 */
	/*
	setCornerCoord1: function(value, coordMode)
	{
		this.setCoordOfMode(value, coordMode);
		return this;
	},
	*/
	/**
	 * Returns coord of bottom-right corner of block.
	 * @param {Int} coordMode
	 * @param {Bool} allowCoordBorrow
	 * @returns {Object}
	 */
	getCornerCoord2: function(coordMode, allowCoordBorrow)
	{
		var cornerCoord1 = this.getCornerCoord1(coordMode, allowCoordBorrow);
		var size = this.getSizeOfMode(coordMode, allowCoordBorrow);
		return Kekule.CoordUtils.add(cornerCoord1, size);
	},
	/*
	 * Set coord of bottom corner of block.
	 * @param {Hash} value
	 * @param {Int} coordMode
	 */
	/*
	setCornerCoord2: function(value, coordMode)
	{
		var cornerCoord1 = this.getCornerCoord1(coordMode, allowCoordBorrow);
		var delta = Kekule.CoordUtils.substract(value, cornerCoord1);
		this.setSizeOfMode(delta, coordMode);
		return this;
	},
	*/
	/**
	 * Calculate the box to fit the image on context.
	 * @param {Int} coordMode Determine to calculate 2D or 3D box. Value from {@link Kekule.CoordMode}.
	 * @param {Bool} allowCoordBorrow
	 * @returns {Hash} Box information. {x1, y1, z1, x2, y2, z2} (in 2D mode z1 and z2 will not be set).
	 */
	getContainerBox: function($super, coordMode, allowCoordBorrow)
	{
		var coord1 = this.getAbsCoordOfMode(coordMode, allowCoordBorrow) || {};
		var size = this.getSizeOfMode(coordMode, allowCoordBorrow) || {};
		if (coordMode === Kekule.CoordMode.COORD3D)
			var coord2 = Kekule.CoordUtils.add(coord1, this.getSizeOfMode(coordMode, allowCoordBorrow) || {});
		else // 2D
		{
			coord2 = {
				x: coord1.x + size.x,
				y: coord1.y - size.y
			};
		}
		/*
		var result = {'x1': coord1.x, 'y1': coord1.y, 'x2': coord2.x, 'y2': coord2.y};
		if (coordMode === Kekule.CoordMode.COORD3D)
		{
			result.z1 = coord1.z;
			result.z2 = coord2.z;
		}
		*/
		var result = Kekule.BoxUtils.createBox(coord1, coord2);
		return result;
	}
});
Kekule.ClassDefineUtils.addStandardCoordSupport(Kekule.ContentBlock);
Kekule.ClassDefineUtils.addStandardSizeSupport(Kekule.ContentBlock);

/**
 * Represent an block of pure text in chem document (especially in 2D rendering).
 * @class
 * @augments Kekule.ContentBlock
 * @param {String} id Id of this node.
 * @param {String} text Texts in block, "\n" is allowed.
 * @param {Hash} coord2D The top left 2D coordinates of text block, {x, y}, can be null.
 * @param {Hash} coord3D The min 3D coordinates of text block box, {x, y, z}, can be null. Usually unneeded.
 *
 * @property {String} text Texts in block, "\n" is allowed.
 */
Kekule.TextBlock = Class.create(Kekule.ContentBlock,
/** @lends Kekule.TextBlock# */
{
	/** @private */
	CLASS_NAME: 'Kekule.TextBlock',
	/**
	 * @constructs
	 */
	initialize: function($super, id, text, coord2D, coord3D)
	{
		$super(id, coord2D, coord3D);
		this.setText(text || '');
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('text', {'dataType': DataType.STRING});
	},
	/** @private */
	getAutoIdPrefix: function()
	{
		return 't';
	}
});

/**
 * A image block in chem document.
 * @class
 * @augments Kekule.ContentBlock
 * @param {String} id Id of this node.
 * @param {String} src Src url of image.
 * @param {Object} coord2D The 2D coordinates of image top-left, {x, y}, can be null.
 * @param {Object} coord3D The 3D coordinates of image top-left, {x, y, z}, can be null.
 *
 * @property {String} src Src url of image.
 * @property {Hash} size2D Size of image, {x, y}.
 */
Kekule.ImageBlock = Class.create(Kekule.ContentBlock,
/** @lends Kekule.ImageBlock# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ImageBlock',
	/**
	 * @constructs
	 */
	initialize: function($super, id, src, coord2D, coord3D)
	{
		$super(id, coord2D, coord3D);
		if (src)
			this.setSrc(src);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('src', {
			'dataType': DataType.STRING,
			'scope': Class.PropertyScope.PUBLISHED,
			'setter': function(value)
			{
				if (value !== this.getSrc())
				{
					this.setPropStoreFieldValue('src', value);
					this._clearCacheImg();
				}
			}
		});
		this.defineProp('cacheImg', {
			'dataType': DataType.OBJECT,
			'scope': Class.PropertyScope.PUBLIC,
			'serializable': false,
			'setter': null,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('cacheImg');
				if (!result && Kekule.$document)
				{
					result = this._createCacheImg(this.getSrc());
				}
				return result;
			}
		});
	},
	/** @private */
	getAutoIdPrefix: function()
	{
		return 'g';
	},
	/** @private */
	_createCacheImg: function(src)
	{
		var result;
		var doc = Kekule.$document;
		if (doc && doc.body && doc.createElement)
		{
			result = doc.createElement('img');
			result.src = src;
		}
		return result;
	},
	_clearCacheImg: function()
	{
		var img = this.getPropStoreFieldValue('cacheImg');
		if (img)
		{
			img.src = '';
			try
			{
				// clear img prev width/height
				delete img.width;
				delete img.height;
			}
			catch(e)
			{

			}
		}
	}
});

})();