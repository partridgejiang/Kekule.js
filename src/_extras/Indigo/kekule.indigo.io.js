/**
 * Created by ginger on 2017/5/9.
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /io/kekule.io.js
 * requires /core/kekule.chemUtils.js
 * requires /_extras/OpenBabel/kekule.indigo.base.js
 * requires /_extras/kekule.emscriptenUtils.js
 * requires /localization
 */

(function(){
"use strict";

/** @ignore */
var EU = Kekule.EmscriptenUtils;
/** @ignore */
var KI = Kekule.Indigo;

/**
 * Writer utilizing Indigo library to read data, especially SMILES.
 * @class
 * @augments Kekule.IO.IndigoReader
 */
Kekule.IO.IndigoReader = Class.create(Kekule.IO.ChemDataReader,
/** @lends Kekule.IO.IndigoReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.InChIWriter',
	/** @private */
	doReadData: function(data, dataType, format)
	{
		var Indigo = KI.getIndigo();
		var iMol = Indigo.loadMoleculeFromString(data);
		if (iMol >= 0)  // success
		{
			if (format === Kekule.IO.DataFormat.SMILES)  // smiles format, need layout
			{
				//console.log('Before', Indigo.molfile(iMol));
				Indigo.setOption("smart-layout", "true");
				Indigo.layout(iMol);
				//console.log('After', Indigo.molfile(iMol));
			}
			// save to MDL mol format, then transfer it into Kekule object
			var molData = Indigo.molfile(iMol);
			Indigo.free(iMol);
			var result = Kekule.IO.loadFormatData(molData, Kekule.IO.DataFormat.MOL);
			return result;
		}
		else  // load failed
			return null;
	}
});
/** @ignore */
//Kekule.IO.IndigoReader.ALLOWED_CLASSES = [Kekule.StructureFragment, Kekule.Reaction, Kekule.ChemObjList, Kekule.ChemStructureObjectGroup, Kekule.ChemSpaceElement, Kekule.ChemSpace];

Kekule.IO.registerAllIndigoFormats = function()
{
	if (KI.isAvailable())
	{
		Kekule.IO.ChemDataReaderManager.register('Indigo-smiles', Kekule.IO.IndigoReader, Kekule.IO.DataFormat.SMILES);
	}
};

/**
 * A helper method to load inchi script library and register all I/O formats
 */
Kekule.IO.enableIndigoFormats = function()
{
	if (!KI.isAvailable())  // InChI not loaded?
	{
		KI.loadIndigoScript(document, function(){
			Kekule.IO.registerAllIndigoFormats();
		});
	}
	else
		Kekule.IO.registerAllIndigoFormats();
};
KI._enableFuncs.push(Kekule.IO.registerAllIndigoFormats);

//Kekule._registerAfterLoadProc(Kekule.IO.registerAllIndigoFormats);

})();