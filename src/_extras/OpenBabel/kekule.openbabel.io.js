/**
 * @fileoverview
 * IO reader/writer utilizing OpenBabel library.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /io/kekule.io.js
 * requires /core/kekule.chemUtils.js
 * requires /_extras/OpenBabel/kekule.openbabel.adapters.js
 * requires /_extras/kekule.emscriptenUtils.js
 * requires /localization
 */

(function(){

/** @ignore */
var EU = Kekule.EmscriptenUtils;
/** @ignore */
var OB = Kekule.OpenBabel;
/** @ignore */
var AU = Kekule.OpenBabel.AdaptUtils;


/**
 * Reader utilizing OpenBabel library to read a huge amount of chem data formats.
 * @class
 * @augments Kekule.IO.ChemDataReader
 */
Kekule.IO.OpenBabelReader = Class.create(Kekule.IO.ChemDataReader,
/** @lends Kekule.IO.OpenBabelReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.OpenBabelReader',
	/** @constructs */
	initialize: function($super, options)
	{
		$super();
		//this._obConv = new (OB.getClassCtor('ObConversionWrapper'))();
	},
	/** @ignore */
	finalize: function($super)
	{
		//this._obConv = null;
		$super();
	},
	/**
	 * Decide output object type: molecule or reaction.
	 * @param {Object} obFormatWrapper
	 */
	getFormatTargetObClassName: function(obFormatWrapper)
	{
		var tname = obFormatWrapper.getTypeName();
		var isReaction =( tname.toLowerCase().indexOf('reaction') >= 0);
		return isReaction? 'OBReaction': 'OBMol';
	},

	/** @private */
	doReadData: function(data, dataType, format)
	{
		this._obConv = new (OB.getClassCtor('ObConversionWrapper'))();
		try
		{
			var fInfo = Kekule.IO.DataFormatsManager.getFormatInfo(format);
			//console.log(format, fInfo);
			var mimeType = fInfo.mimeType;
			var fileExt = fInfo.fileExts[0];
			//console.log(mimeType, fileExt);
			// decide type
			var fmt = this._obConv.setInFormat(mimeType, fileExt);
			//console.log('Format of : ' + format, mimeType, fileExt, fmt);
			var obClassName = this.getFormatTargetObClassName(fmt);

			try
			{
				/*
				var obObj = new (OB.getClassCtor(obClassName))();
				this._obConv.readString(obObj, data);
				var kObj = AU.obObjToKekule(obObj);
				return kObj;
				*/

				// use new loop interface
				var kObjs = [];
				this._obConv.setInStr(data);
				//console.log(data);
				var obObj = new (OB.getClassCtor(obClassName))();
				//try
				{
					var hasObj = this._obConv.readFromInput(obObj);
					while (hasObj)
					{
						if (obObj.NumAtoms && (obObj.NumAtoms() > 0))  // bypass empty molecule with no atoms
						{
							kObj = AU.obObjToKekule(obObj);
							kObjs.push(kObj);
							//console.log(obObj, kObj.getNodeCount());
						}
						hasObj = this._obConv.readFromInput(obObj);
					}
				}
				//catch(e)
				{

				}

				/*
				this._obConv.setOutFormat('', 'mol'); // must set a output format, otherwise convert will return 0

				var convCount = this._obConv.convert();
				console.log(convCount, 'molecule converted');
				if (convCount > 0)
				{
					while (!this._obConv.isLastChemObject())
					{
						var obObj = this._obConv.getChemObj();
						if (obObj)
						{
							try
							{
								var kObj = AU.obObjToKekule(obObj);
								if (kObj)
									kObjs.push(kObj);
							}
							finally
							{
								obObj.delete();
							}
						}
					}
				}
				else
					return null;
				*/

				var length = kObjs.length;
				if (length <= 0)
					return null;
				else if (length === 1)
					return kObjs[0]
				else  // create a new ChemObjList
				{
					var result = new Kekule.ChemObjList();
					for (var i = 0; i < length; ++i)
					{
						result.append(kObjs[i]);
					}
					return result;
				}

				/*
				// debug
				//this._obConv.setOutFormat(mimeType, fileExt);
				this._obConv.setOutFormat('', 'mol');
				var str = this._obConv.writeString(obObj, true);
				console.log(str);
				*/


				// convert to Kekule one
				/*
				var mol = AU.obMolToKekule(obObj, null);
				console.log(mol);
				return mol;
				*/
				/*
				var kObj = AU.obObjToKekule(obObj);
				//console.log(kObj.getClassName(), kObj);
				return kObj;
				*/
			}
			finally
			{
				if (obObj)
				{
					//obObj.delete();
					obObj['delete']();  // avoid exception in older version of IE
					obObj = null;
				}
			}
		}
		finally
		{
			if (this._obConv)
			{
				//this._obConv.delete();
				this._obConv['delete']();  // avoid exception in older version of IE
				this._obConv = null;
			}
		}
	}
});

/**
 * Writer utilizing OpenBabel library to write a huge amount of chem data formats.
 * @class
 * @augments Kekule.IO.ChemDataWriter
 */
Kekule.IO.OpenBabelWriter = Class.create(Kekule.IO.ChemDataWriter,
/** @lends Kekule.IO.OpenBabelWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.OpenBabelWriter',
	/** @constructs */
	initialize: function($super, options)
	{
		$super(options);
		//this._obConv = new (OB.getClassCtor('ObConversionWrapper'))();
	},
	/** @ignore */
	finalize: function($super)
	{
		//this._obConv = null;
		$super();
	},
	/** @private */
	doWriteData: function(obj, dataType, format)
	{
		this._obConv = new (OB.getClassCtor('ObConversionWrapper'))();
		try
		{
			var fInfo = Kekule.IO.DataFormatsManager.getFormatInfo(format);
			var mimeType = fInfo.mimeType;
			var fileExt = fInfo.fileExts[0];
			this._obConv.setOutFormat(mimeType, fileExt);
			//this._obConv.clearOut();

			var kObjs = Kekule.ChemStructureUtils.getChildStructureObjs(obj, true);

			// use new loop interface to write multiple basic objects
			for (var i = 0, l = kObjs.length; i < l; ++i)
			{
				var kObj = kObjs[i];
				if (kObj)
				{
					var obObj = AU.kObjToOB(kObj);
					if (obObj)
					{
						try
						{
							var success = this._obConv.writeToOutput(obObj);
							if (!success)
							{
								break;
							}
						}
						finally
						{
							//obObj.delete();
							obObj['delete']();  // avoid exception in older version of IE
							obObj = null;
						}
					}
				}
			}

			var result = this._obConv.getOutStr();
			return result;

			/*
			var obObj = AU.kObjToOB(obj);
			try
			{
				//console.log(obMol.NumAtoms(), obMol.NumBonds())
				var result = this._obConv.writeString(obObj, true);
				return result;
			}
			finally
			{
				if (obObj)
					obObj.delete();
			}
			*/
		}
		finally
		{
			if (this._obConv)
			{
				//this._obConv.delete();
				this._obConv['delete']();  // avoid exception in older version of IE
			}
		}
	},
	/** @private */
	isAllowedObj: function(kObj)
	{
		var classes = Kekule.IO.OpenBabelWriter.ALLOWED_CLASSES;
		return Kekule.ObjUtils.isInstanceOf(kObj, classes);
	}
});
/** @ignore */
Kekule.IO.OpenBabelWriter.ALLOWED_CLASSES = [Kekule.StructureFragment, Kekule.Reaction, Kekule.ChemObjList, Kekule.ChemStructureObjectGroup, Kekule.ChemSpaceElement, Kekule.ChemSpace];

/** @ignore */
Kekule.OpenBabel.IORegHelper = Class.create({
	listFormatInfo: function(ioType, converter)
	{
		var result = [];
		var delimiter = '\n';
		var itemSep = '--';
		var formatListStr;

		if (ioType === 'in')
			formatListStr = converter.getSupportedInputFormatsStr(delimiter);
			//formatListStr = Kekule.OpenBabel.obGetSupportedInputFormatsStr(delimiter);
		else
			formatListStr = converter.getSupportedOutputFormatsStr(delimiter);
			//formatListStr = Kekule.OpenBabel.obGetSupportedOutputFormatsStr(delimiter);

		var basicStrArray = formatListStr.split(delimiter);
		for (var i = 0, l = basicStrArray.length; i < l; ++i)
		{
			var s = basicStrArray[i];
			// get str before '--', only the id
			var pos = s.indexOf(itemSep);
			if (pos > 0)
			{
				var id = s.substring(0, pos).trim();
				// then get more details from id
				var info = converter.getFormatInfoById(id);
				result.push(info);
				//console.log(info);
			}
		}
		/*
		var lister = Kekule.OpenBabel.obGetSupportedFormatsDetailStr;
		if (lister)
		{
			formatListStr = lister(ioType, delimiter, itemSep);
			// analysis format list str
			var sitems = formatListStr.split(delimiter);
			for (var i = 0, l = sitems.length; i < l; ++i)
			{
				var s = sitems[i];
				var details = s.split(itemSep);
				var info = {
					'id': details[0],
					'mimeType': details[1],
					'description': details[2]
				};
				result.push(info);
			}
		}
		*/

		return result;
	},
	registerByInfos: function(infos, ioType)
	{
		//var iOManager = (ioType === 'in')? Kekule.IO.ChemDataReaderManager: Kekule.IO.ChemDataWriterManager;
		var formatManager = Kekule.IO.DataFormatsManager;
		var handleIds = [];
		//console.log(infos);
		for (var i = 0, l = infos.length; i < l; ++i)
		{
			var info = infos[i];
			var id = info.id;
			var mimeType = info.mimeType;
			// check if fileExts or mimeType already exists

			// find by both mimeType and file exts, if mimeType exists but file ext not in, still register
			var fmtId = formatManager.findFormatId(mimeType);
			if (fmtId)
				fmtId = formatManager.findFormatId(null, id);
			/*
			if (!fmtId)
				fmtId = formatManager.findFormatId(null, id);
			*/
			if (!fmtId)  // file ext or MIME type not exists, register
			{
				/*
				if (ioType === 'in')
					console.log(id, mimeType);
				*/
				// TODO: dataType is unknown from info.
				var fmtInfo = formatManager.register(id, mimeType, id, Kekule.IO.ChemDataType.UNKNOWN, info.description, info.description, {'specificationUrl': info.specificationURL});
				var fmtId = fmtInfo.id;
				//console.log('[register]', id, mimeType, info);
			}
			/*
			else
			{
				console.log('[EXISTS]', fmtId, mimeType, info);
			}
			*/

			// check if fileExts or mimeType already has reader/writer
			var readerWriterInfo = (ioType === 'in')?
				Kekule.IO.ChemDataReaderManager.getReaderInfoByFormat(fmtId):
				Kekule.IO.ChemDataWriterManager.getWriterInfoByFormat(fmtId);
			if (!readerWriterInfo)  // not has reader/writer, register open babel one
			{
				Kekule.ArrayUtils.pushUnique(handleIds, fmtId);
			}
		}
		//console.log(ioType, handleIds);
		if (handleIds.length)
		{
			if (ioType === 'in')
			{
				Kekule.IO.ChemDataReaderManager.register('openbabel', Kekule.IO.OpenBabelReader, handleIds);
			}
			else
			{
				Kekule.IO.ChemDataWriterManager.register('openbabel', Kekule.IO.OpenBabelWriter,
						Kekule.IO.OpenBabelWriter.ALLOWED_CLASSES, handleIds);
			}
		}
	},

	registerAll: function()
	{
		var converter = new (OB.getClassCtor('ObConversionWrapper'))();
		try
		{
			//console.log(converter);
			var infos = this.listFormatInfo('in', converter);
			//console.log('in', infos.length);
			this.registerByInfos(infos, 'in');
			//console.log('out', infos.length);
			var infos = this.listFormatInfo('out', converter);
			this.registerByInfos(infos, 'out');
		}
		finally
		{
			//converter.delete();
			converter['delete']();  // avoid exception in older version of IE
		}
	  /*
		var infos = this.listFormatInfo('in');
		this.registerByInfos(infos, 'in');
		var infos = this.listFormatInfo('out');
		this.registerByInfos(infos, 'out');
		*/
	}
});

/**
 * A helper method to register all I/O formats supported by open babel.
 */
Kekule.IO.registerAllOpenBabelFormats = function()
{
	if (Kekule.OpenBabel.AdaptUtils.isAvailable())
	{
		try
		{
			var helper = new Kekule.OpenBabel.IORegHelper();
			helper.registerAll();
		}
		finally
		{
			helper = null;
		}
	}
};
Kekule.OpenBabel._enableFuncs.push(Kekule.IO.registerAllOpenBabelFormats);

/**
 * A helper method to load open babel script library and register all I/O formats
 */
Kekule.IO.enableOpenBabelFormats = function()
{
	if (!Kekule.OpenBabel.AdaptUtils.isAvailable())  // OB not loaded?
	{
		Kekule.OpenBabel.loadObScript(document, function(){
			Kekule.IO.registerAllOpenBabelFormats();
		});
	}
	else
		Kekule.IO.registerAllOpenBabelFormats();
};

(function(){
	/*
	// register chem data formats

	Kekule.IO.DataFormatsManager.register('pdb', 'chemical/x-pdb', ['pdb', 'ent'],
		Kekule.IO.ChemDataType.TEXT, 'PDB format');
	Kekule.IO.DataFormatsManager.register('smiles', 'chemical/x-daylight-smiles', ['smi'],
		Kekule.IO.ChemDataType.TEXT, 'SMILES format');
	Kekule.IO.DataFormatsManager.register('mol2', 'chemical/x-mol2', ['mol2'],
		Kekule.IO.ChemDataType.TEXT, 'Sybyl mol2');
	Kekule.IO.DataFormatsManager.register('cdx', 'chemical/x-cdx', ['cdx'],
		Kekule.IO.ChemDataType.BINARY, 'ChemDraw CDX');

	Kekule.IO.DataFormatsManager.register('ct', 'chemical/x-ct', ['ct'],
		Kekule.IO.ChemDataType.TEXT, 'ct');

	// register ChemData reader and writer
	Kekule.IO.ChemDataReaderManager.register('OpenBabel', Kekule.IO.OpenBabelReader,
		['MDL-mol', 'MDL-rxn', 'pdb', 'smiles', 'mol2', 'cdx', 'ct']);
	Kekule.IO.ChemDataWriterManager.register('OpenBabel', Kekule.IO.OpenBabelWriter, [Kekule.StructureFragment],
		['MDL-mol', 'pdb', 'smiles', 'mol2', 'cdx', 'ct']);
	Kekule.IO.ChemDataWriterManager.register('OpenBabel-Rxn', Kekule.IO.OpenBabelWriter, [Kekule.Reaction],
		['MDL-rxn']);
	*/
	//Kekule.X.domReady(function()
	/*
	Kekule._registerAfterLoadProc(function()
	{
		Kekule.IO.registerAllOpenBabelFormats();
	});
	*/
})();

})();
