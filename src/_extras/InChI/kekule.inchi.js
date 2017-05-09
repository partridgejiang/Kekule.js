/**
 * Created by ginger on 2017/5/8.
 */


/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /io/kekule.io.js
 * requires /core/kekule.chemUtils.js
 * requires /_extras/kekule.emscriptenUtils.js
 * requires /xbrowsers/kekule.x.js
 * requires /localization
 */

(function(){
"use strict";

/** @ignore */
var EU = Kekule.EmscriptenUtils;

/**
 * Initialization options of OpenBabel js module.
 * @private
 * @ignore
 */
var inchiInitOptions = {
	usingModulaize: true,  // whether using modularize option to build OpenBabel.js
	moduleName: 'InChIModule' // the name of OpenBabl module
};

/**
 * Namespace of OpenBabel related objects.
 * @namespace
 */
Kekule.InChI = {
	/** @private */
	_scriptLoaded: false,
	/** @private */
	_module: null, // a variable to store created OpenBabel module object
	/** Base URL of OpenBabel script file. */
	SCRIPT_FILE: 'inchi.js',
	getModule: function()
	{
		if (!InChI._module)
		{
			InChI._module = EU.getRootModule(inchiInitOptions.moduleName);
		}
		return InChI._module;
	},
	getInChIPath: function()
	{
		var isMin = Kekule.scriptSrcInfo.useMinFile;
		var path = isMin? 'extra/': '_extras/InChI/';
		path = Kekule.scriptSrcInfo.path + path;
		return path;
	},
	getInChIScriptUrl: function()
	{
		var result = InChI.getInChIPath() + InChI.SCRIPT_FILE;
		var isMin = Kekule.scriptSrcInfo.useMinFile;
		if (!isMin)
			result += '.dev';
		return result;
	},
	loadInChIScript: function(doc, callback)
	{
		if (!doc)
			doc = document;
		if (!InChI._scriptLoaded)
		{
			var filePath = InChI.getInChIScriptUrl();
			EU.loadScript(filePath, callback, doc);
			InChI._scriptLoaded = true;
		}
		else
		{
			if (callback)
				callback();
		}
	},

	/**
	 * Input MDL mol format data and output corresponding InChI result.
	 * @param {String} molData
	 * @param {String} options
	 * @returns {Hash}
	 */
	molDataToInChI: function(molData, options)
	{
		var convFunc = InChI._molToInChI;
		if (!convFunc)
			convFunc = InChI.getModule().cwrap('molToInchiJson', 'string', ['string', 'string']);
		var sInChIResult = convFunc(molData, options);
		return JSON.parse(sInChIResult);
	},

	/**
	 * Returns all InChI info (including inchi and auxInfo) of a molecule.
	 * @param {Kekule.StructureFragment} molecule
	 * @returns {Hash}
	 */
	getInChIInfo: function(molecule)
	{
		// firstly save obj in MDL mol format
		var molData = Kekule.IO.saveFormatData(molecule, Kekule.IO.DataFormat.MOL);
		// then to InChI
		var inchi = InChI.molDataToInChI(molData);
		return inchi;
	}
};

var InChI = Kekule.InChI;

/**
 * Writer utilizing InChI library to write a huge amount of chem data formats.
 * @class
 * @augments Kekule.IO.ChemDataWriter
 */
Kekule.IO.InChIWriter = Class.create(Kekule.IO.ChemDataWriter,
/** @lends Kekule.IO.InChIWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.InChIWriter',
	/** @private */
	doWriteData: function(obj, dataType, format)
	{
		var info = InChI.getInChIInfo(obj);
		if (info && info.inchi)
		{
			var result = info.inchi;
			if (info.auxInfo)
				result += '\n' + info.auxInfo;
			return result;
		}
		else
			return null;
	},
	/** @private */
	isAllowedObj: function(obj)
	{
		var classes = Kekule.IO.InChIWriter.ALLOWED_CLASSES;
		return Kekule.ObjUtils.isInstanceOf(obj, classes);
	}
});
/** @ignore */
Kekule.IO.InChIWriter.ALLOWED_CLASSES = [Kekule.StructureFragment, Kekule.Reaction, Kekule.ChemObjList, Kekule.ChemStructureObjectGroup, Kekule.ChemSpaceElement, Kekule.ChemSpace];

Kekule.IO.registerAllInChIFormats = function()
{
	if (EU.isSupported(inchiInitOptions.moduleName))
	{
		var fmtInChI = 'inchi';
		Kekule.IO.DataFormat.INCHI = fmtInChI;
		Kekule.IO.MimeType.INCHI = 'chemical/x-inchi';

		Kekule.IO.DataFormatsManager.register(fmtInChI, Kekule.IO.MimeType.INCHI, 'inchi',
				Kekule.IO.ChemDataType.TEXT, 'InChI format');
		Kekule.IO.ChemDataWriterManager.register('inchi', Kekule.IO.InChIWriter, Kekule.IO.InChIWriter.ALLOWED_CLASSES, fmtInChI);
	}
};

/**
 * A helper method to load inchi script library and register all I/O formats
 */
Kekule.IO.enableInChIFormats = function()
{
	if (!EU.isSupported(inchiInitOptions.moduleName))  // InChI not loaded?
	{
		InChI.loadInChIScript(document, function(){
			Kekule.IO.registerAllInChIFormats();
		});
	}
	else
		Kekule.IO.registerAllInChIFormats();
};

Kekule._registerAfterLoadProc(Kekule.IO.registerAllInChIFormats);

})();