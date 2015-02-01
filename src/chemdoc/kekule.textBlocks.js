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
"use strict"

/**
 * Represent an block of pure text in chem document (especially in 2D rendering).
 * @class
 * @augments Kekule.ChemObject
 * @param {String} id Id of this node.
 * @param {Hash} coord2D The top left 2D coordinates of text block, {x, y}, can be null.
 * @param {Hash} coord3D The min 3D coordinates of text block box, {x, y, z}, can be null. Usually unneeded.
 *
 * @property {String} text Texts in block, "\n" is allowed.
 * * @property {String} glyphName Name of this glyph.
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
Kekule.TextBlock = Class.create(Kekule.ChemObject,
/** @lends Kekule.TextBlock# */
{
	/** @private */
	CLASS_NAME: 'Kekule.TextBlock',
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
		this.setText('');
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
Kekule.ClassDefineUtils.addStandardCoordSupport(Kekule.TextBlock);
Kekule.ClassDefineUtils.addStandardSizeSupport(Kekule.TextBlock);

})();