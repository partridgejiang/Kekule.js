/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /utils/kekule.textHelper.js
 * requires /core/kekule.common.js
 * requires /spectrum/kekule.spectrum.core.js
 * requires /io/kekule.io.js
 * requires /io/jcamp/kekule.io.jcamp.js
 * requires /localization
 */

(function(){
"use strict";

var Jcamp = Kekule.IO.Jcamp;

/**
 * Reader for reading a DX data block of JCAMP document tree.
 * @class
 * @augments Kekule.IO.Jcamp.DataBlockReader
 */
Kekule.IO.Jcamp.DxDataBlockReader = Class.create(Kekule.IO.Jcamp.DataBlockReader,
/** @lends Kekule.IO.Jcamp.DxDataBlockReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.Jcamp.DxDataBlockReader',
	/** @ignore */
	doCreateChemObjForBlock: function(block)
	{
		console.log('do create');
		var result;
		var meta = this._getBlockMeta(block);
		if (meta.blockType === Jcamp.BlockType.DATA && meta.format === Jcamp.Format.DX)
		{
			result = new Kekule.Spectroscopy.Spectrum();
		}
		else
			result = this.tryApplySuper('doCreateChemObjForBlock', [block]);
		return result;
	}
});
Jcamp.BlockReaderManager.register(Jcamp.BlockType.DATA, Jcamp.Format.DX, Kekule.IO.Jcamp.DxDataBlockReader);


})();