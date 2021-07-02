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
	moduleName: 'InChIModule', // the name of OpenBabl module
	moduleInitEventName: 'InChI.Initialized',
	moduleInitCallbackName: '__$inChIInitialized$__'
};

/**
 * Namespace of OpenBabel related objects.
 * @namespace
 */
Kekule.InChI = {
	/**
	 * A flag, whether auto enable InChI function when find InChI lib is already loaded.
	 */
	_autoEnabled: true,
	/** @private */
	_scriptLoadedBySelf: false,
	/** @private */
	_module: null, // a variable to store created OpenBabel module object
	/** @private */
	_enableFuncs: [],
	/** Base URL of OpenBabel script file. */
	SCRIPT_FILE: 'inchi.js',
	isScriptLoaded: function()
	{
		return EU.isSupported(inchiInitOptions.moduleName);
	},
	getInchiInitOptions: function()
	{
		return inchiInitOptions;
	},
	getModule: function()
	{
		if (!InChI._module)
		{
			InChI._module = EU.getRootModule(inchiInitOptions.moduleName, inchiInitOptions);
		}
		return InChI._module;
	},
	setModule: function(module)
	{
		InChI._module = module;
		EU.setRootModule(inchiInitOptions.moduleName, module);
	},
	getInChIPath: function()
	{
		var path = Kekule.environment.getEnvVar('inchi.path');
		if (!path)
		{
			//var isMin = Kekule.scriptSrcInfo.useMinFile;
			var isMin = Kekule.isUsingMinJs();
			path = isMin ? 'extra/' : '_extras/InChI/';
			path = Kekule.getScriptPath() + path;  // Kekule.scriptSrcInfo.path + path;
		}
		return path;
	},
	getInChIScriptUrl: function()
	{
		var result = Kekule.environment.getEnvVar('inchi.scriptSrc');
		if (!result)
		{
			result = InChI.getInChIPath() + InChI.SCRIPT_FILE;
			var isMin = Kekule.isUsingMinJs();  // Kekule.scriptSrcInfo.useMinFile;
			if (!isMin)
				result += '.dev';
		}
		return result;
	},
	loadInChIScript: function(doc, callback)
	{
		if (!doc)
			doc = Kekule.$jsRoot.document;
		var done = function(error){
			InChI._scriptLoadedBySelf = !error;
			if (callback)
				callback(error);
		};
		if (!InChI._scriptLoadedBySelf && !InChI.isScriptLoaded())
		{
			var filePath = InChI.getInChIScriptUrl();
			EU.loadScript(filePath, done, doc, inchiInitOptions);
		}
		else
		{
			done();
		}

		/*
		if (!InChI.isScriptLoaded() && !InChI._scriptLoadedBySelf)
		{
			var filePath = InChI.getInChIScriptUrl();
			EU.loadScript(filePath, callback, doc, inchiInitOptions);
			InChI._scriptLoadedBySelf = true;
		}
		else
		{
			InChI._scriptLoadedBySelf = true;
			if (callback)
				callback();
		}
		*/
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
		{
			var module = InChI.getModule();
			convFunc = module.cwrap('molToInchiJson', 'string', ['string', 'string']);
		}

		var sInChIResult = convFunc(molData, options);
		return JSON.parse(sInChIResult);
	},
	/**
	 * Returns InChIKey from InChI source string
	 * @param {String} inchiSource
	 * @param {Int} xtra1
	 * @param {Int} xtra2
	 * @returns {Hash}
	 */
	getInChIKeyFromInChI: function(inchiSource, xtra1, xtra2)
	{
		var convFunc = InChI._getInChIKeyFromInChI;
		if (!convFunc)
		{
			var module = InChI.getModule();
			convFunc = module.cwrap('getInChIKeyJson', 'string', ['string', 'number', 'number']);
		}
		var sResult = convFunc(inchiSource, xtra1, xtra2);
		return JSON.parse(sResult);
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
	},

	/**
	 * Load InChI.js lib and enable all related functions
	 */
	enable: function(callback)
	{
		if (!InChI.isScriptLoaded())  // InChI not loaded?
		{
			InChI.loadInChIScript(Kekule.$jsRoot.document, function(error){
				//Kekule.IO.registerAllInChIFormats();
				if (!error)
					InChI._enableAllFunctions();
				if (callback)
					callback(error);
			});
		}
		else
		{
			InChI._enableAllFunctions();
			if (callback)
				callback();
		}
	},
	_enableAllFunctions: function()
	{
		//if (InChI.isScriptLoaded())
		if (EU.isModuleReady(inchiInitOptions.moduleName))
		{
			var funcs = InChI._enableFuncs;
			for (var i = 0, l = funcs.length; i < l; ++i)
			{
				var func = funcs[i];
				if (func)
					func();
			}
		}
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

			// debug, with InChI key
			var inchiKeyInfo = InChI.getInChIKeyFromInChI(info.inchi, 1, 1);
			result += '\n' + JSON.stringify(inchiKeyInfo);

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
	if (InChI.isScriptLoaded())
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
	//Kekule.IO.registerAllInChIFormats();
	InChI.enable();
};
InChI._enableFuncs.push(Kekule.IO.registerAllInChIFormats);

Kekule._registerAfterLoadSysProc(function() {
	if (InChI._autoEnabled && InChI.isScriptLoaded())
	{
		EU.ensureModuleReady(Kekule.$jsRoot.document, inchiInitOptions, InChI._enableAllFunctions);
	}
});

})();