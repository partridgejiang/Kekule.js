/**
 * @fileoverview
 * File to support read or write chemical data in JSON or XML format by built-in serializers.
 * The JSON data serialized directly from Kekule.ChemObject is called KCJ (Kekule Chem JSON),
 * while the XML data is called KCX (Kekule Chem XML).
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /lan/serializations.js
 * requires /core/kekule.common.js
 */

/*
 * Default options to read/write KCJ/KCX/JSON/XML format data.
 * @object
 */
Kekule.globalOptions.add('IO.kekuleNative', {
	prettyPrint: true
});

/**
 * Reader for KCJ JSON data.
 * Use KcjReader.readData() can retrieve a suitable Kekule object.
 * Data fetch in should be a string or a JSON.
 * @class
 * @augments Kekule.IO.ChemDataReader
 */
Kekule.IO.KcjReader = Class.create(Kekule.IO.ChemDataReader,
/** @lends Kekule.IO.KcjReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.KcjReader',
	/** @private */
	readData: function($super, data, dataType)
	{
		var dtype = dataType || Kekule.IO.ChemDataType.TEXT;
		var jsonObj;
		if (dtype == Kekule.IO.ChemDataType.JSON)
			jsonObj = data;
		if (dtype == Kekule.IO.ChemDataType.TEXT)
			jsonObj = JsonUtility.parse(data);
		else // can not understand data other than text or JSON
		{
			Kekule.error(/*Kekule.ErrorMsg.KCJ_INPUT_DATATYPE_NOT_JSON_OR_TEXT*/Kekule.$L('ErrorMsg.KCJ_INPUT_DATATYPE_NOT_JSON_OR_TEXT'));
			return null;
		}
		return $super(jsonObj, Kekule.IO.ChemDataType.JSON);
	},
	/** @private */
	doReadData: function(data, dataType)
	{
		var serializer = ObjSerializerFactory.getSerializer('json');
		if (!serializer)
		{
			Kekule.error(/*Kekule.ErrorMsg.JSON_SERIALIZER_NOT_EXISTS*/Kekule.$L('ErrorMsg.JSON_SERIALIZER_NOT_EXISTS'));
			return null;
		}
		return serializer.load(null, data);  // create new object
	}
});

/**
 * Writer for KCJ JSON data.
 * Use KcjWriter.writeData() to save a Kekule.ChemObject.
 * @class
 * @augments Kekule.IO.ChemDataWriter
 */
Kekule.IO.KcjWriter = Class.create(Kekule.IO.ChemDataWriter,
/** @lends Kekule.IO.KcjWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.KcjWriter',
	/** @private */
	initialize: function($super, options)
	{
		$super(options);
		var op = options || {};
		this.setPrettyPrint(Kekule.ObjUtils.isUnset(op.prettyPrint)? Kekule.globalOptions.IO.kekuleNative.prettyPrint: op.prettyPrint);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('prettyPrint', {'dataType': DataType.BOOL, 'defaultValue': true});
	},
	/** @private */
	writeData: function($super, obj, dataType, format, options)
	{
		var dtype = dataType || Kekule.IO.ChemDataType.TEXT;
		if ((dtype != Kekule.IO.ChemDataType.JSON) && (dtype != Kekule.IO.ChemDataType.TEXT))
			// can not output data other than text or JSON
		{
			Kekule.error(/*Kekule.ErrorMsg.KCJ_OUTPUT_DATATYPE_NOT_JSON_OR_TEXT*/Kekule.$L('ErrorMsg.KCJ_OUTPUT_DATATYPE_NOT_JSON_OR_TEXT'));
			return null;
		}

		var result = $super(obj, Kekule.IO.ChemDataType.JSON);
		if (dtype == Kekule.IO.ChemDataType.JSON)
			return result;
		if (dtype == Kekule.IO.ChemDataType.TEXT)
		{
			//console.log(JsonUtility.serializeToStr(result, {'prettyPrint': false}));
			var prettyPrint = (options && Kekule.ObjUtils.notUnset(options.prettyPrint))? options.prettyPrint: this.getPrettyPrint();
			return JsonUtility.serializeToStr(result, {'prettyPrint': prettyPrint});
		}
	},
	/** @private */
	doWriteData: function(obj, dataType, format, options)
	{
		var serializer = ObjSerializerFactory.getSerializer('json');
		if (!serializer)
		{
			Kekule.error(/*Kekule.ErrorMsg.JSON_SERIALIZER_NOT_EXISTS*/Kekule.$L('ErrorMsg.JSON_SERIALIZER_NOT_EXISTS'));
			return null;
		}
		var jsonObj = {};
		serializer.save(obj, jsonObj);  // create new object
		return jsonObj;
	}
});

/**
 * Reader for KCX XML data.
 * Use KcxReader.readData() can retrieve a suitable Kekule object.
 * Data fetch in should be a string or a XML node.
 * @class
 * @augments Kekule.IO.ChemDataReader
 */
Kekule.IO.KcxReader = Class.create(Kekule.IO.ChemDataReader,
/** @lends Kekule.IO.KcxReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.KcxReader',
	/** @private */
	readData: function($super, data, dataType)
	{
		var dtype = dataType || Kekule.IO.ChemDataType.TEXT;
		var srcElem;
		if (dtype == Kekule.IO.ChemDataType.DOM)
			srcElem = data;
		if (dtype == Kekule.IO.ChemDataType.TEXT)
		{
			var doc = XmlUtility.parse(data);
			srcElem = doc.documentElement;
		}
		else // can not understand data other than text or DOM
 		{
			Kekule.error(/*Kekule.ErrorMsg.KCX_INPUT_DATATYPE_NOT_DOM_OR_TEXT*/Kekule.$L('ErrorMsg.KCX_INPUT_DATATYPE_NOT_DOM_OR_TEXT'));
			return null;
		}
		return $super(srcElem, Kekule.IO.ChemDataType.DOM);
	},
	/** @private */
	doReadData: function(data, dataType)
	{
		var serializer = ObjSerializerFactory.getSerializer('xml');
		if (!serializer)
		{
			Kekule.error(/*Kekule.ErrorMsg.XML_SERIALIZER_NOT_EXISTS*/Kekule.$L('ErrorMsg.XML_SERIALIZER_NOT_EXISTS'));
			return null;
		}
		return serializer.load(null, data);  // create new object
	}
});

/**
 * Writer for KCX XML data.
 * Use KcxWriter.writeData() to save a Kekule.ChemObject.
 * @class
 * @augments Kekule.IO.ChemDataWriter
 */
Kekule.IO.KcxWriter = Class.create(Kekule.IO.ChemDataWriter,
/** @lends Kekule.IO.KcxWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.KcxWriter',
	/** @private */
	initialize: function($super, options)
	{
		$super(options);
		var op = options || {};
		this.setPrettyPrint(Kekule.ObjUtils.isUnset(op.prettyPrint)? Kekule.globalOptions.IO.kekuleNative.prettyPrint: op.prettyPrint);
		this.setRootTag(op.rootTag || 'kcx');
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('prettyPrint', {'dataType': DataType.BOOL, 'defaultValue': true});
		this.defineProp('rootTag', {'dataType': DataType.STRING});
	},
	/** @private */
	writeData: function($super, obj, dataType)
	{
		var dtype = dataType || Kekule.IO.ChemDataType.TEXT;
		if ((dtype != Kekule.IO.ChemDataType.DOM) && (dtype != Kekule.IO.ChemDataType.TEXT))
			// can not output data other than DOM or text
		{
			Kekule.error(/*Kekule.ErrorMsg.KCX_OUTPUT_DATATYPE_NOT_DOM_OR_TEXT*/Kekule.$L('ErrorMsg.KCX_OUTPUT_DATATYPE_NOT_DOM_OR_TEXT'));
			return null;
		}

		var result = $super(obj, Kekule.IO.ChemDataType.DOM);
		if (dtype == Kekule.IO.ChemDataType.DOM)
			return result;
		if (dtype == Kekule.IO.ChemDataType.TEXT)
		{
			var options = {'prettyPrint': this.getPrettyPrint()};
			return XmlUtility.serializeNode(result, options);
		}
	},
	/** @private */
	doWriteData: function(obj, dataType)
	{
		var serializer = ObjSerializerFactory.getSerializer('xml');
		if (!serializer)
		{
			Kekule.error(/*Kekule.ErrorMsg.XML_SERIALIZER_NOT_EXISTS*/Kekule.$L('ErrorMsg.XML_SERIALIZER_NOT_EXISTS'));
			return null;
		}
		var doc = XmlUtility.newDocument(this.getRootTag());
		serializer.save(obj, doc.documentElement);  // create new object
		return doc.documentElement;
	}
});

(function(){
	// extents mime type consts
	Kekule.IO.MimeType.KEKULE_JSON = 'chemical/x-kekule-json';
	Kekule.IO.MimeType.KEKULE_XML = 'chemical/x-kekule-xml';

	Kekule.IO.DataFormat.KEKULE_JSON = 'Kekule-JSON';
	Kekule.IO.DataFormat.KEKULE_XML = 'Kekule-XML';

	// register chem data formats
	Kekule.IO.DataFormatsManager.register('JSON', Kekule.IO.MimeType.JSON, 'json',
		Kekule.IO.ChemDataType.TEXT, 'JSON format');
	Kekule.IO.DataFormatsManager.register(Kekule.IO.DataFormat.KEKULE_JSON, Kekule.IO.MimeType.KEKULE_JSON, 'kcj',
		Kekule.IO.ChemDataType.TEXT, 'Kekule Chemical JSON format');
	Kekule.IO.DataFormatsManager.register(Kekule.IO.DataFormat.KEKULE_XML, Kekule.IO.MimeType.KEKULE_XML, 'kcx',
		Kekule.IO.ChemDataType.TEXT, 'Kekule Chemical XML format');

	// register ChemData reader and writer
	/*
	Kekule.IO.ChemDataReaderManager.register('kcj', Kekule.IO.KcjReader, {
		'title': 'Kekule Chemical JSON format',
		'mimeType': 'chemical/x-kekule-json',
		'fileExt': 'kcj'
	});
	Kekule.IO.ChemDataWriterManager.register('kcj', Kekule.IO.KcjWriter,
		[Kekule.ChemObject],
		{
			'createOptions': {'prettyPrint': true},
			'title': 'Kekule Chemical JSON format',
			'mimeType': 'chemical/x-kekule-json',
			'fileExt': 'kcj'
		});

	Kekule.IO.ChemDataReaderManager.register('kcx', Kekule.IO.KcxReader, {
		'title': 'Kekule Chemical XML format',
		'mimeType': 'chemical/x-kekule-xml',
		'fileExt': 'kcx'
	});
	Kekule.IO.ChemDataWriterManager.register('kcx', Kekule.IO.KcxWriter,
		[Kekule.ChemObject],
		{
			'createOptions': {'prettyPrint': true},
			'title': 'Kekule Chemical XML format',
			'mimeType': 'chemical/x-kekule-xml',
			'fileExt': 'kcx'
		});
	*/
	var jsonFmtId = Kekule.IO.DataFormatsManager.findFormatId(Kekule.IO.MimeType.JSON);
	var kcjFmtId = Kekule.IO.DataFormatsManager.findFormatId(Kekule.IO.MimeType.KEKULE_JSON);
	var kcxFmtId = Kekule.IO.DataFormatsManager.findFormatId(Kekule.IO.MimeType.KEKULE_XML);

	Kekule.IO.ChemDataReaderManager.register('json', Kekule.IO.KcjReader, jsonFmtId);
	Kekule.IO.ChemDataReaderManager.register('kcj', Kekule.IO.KcjReader, kcjFmtId);
	Kekule.IO.ChemDataReaderManager.register('kcx', Kekule.IO.KcxReader, kcxFmtId);
	/* Avoid display two loaders
	Kekule.IO.ChemDataWriterManager.register('json', Kekule.IO.KcjWriter, [Kekule.ChemObject], kcjFmtId,
		{
			'createOptions': {'prettyPrint': !true}
		}
	);
	*/
	Kekule.IO.ChemDataWriterManager.register('kcj', Kekule.IO.KcjWriter, [Kekule.ChemObject], kcjFmtId,
		{
			'createOptions': {'prettyPrint': !true}
		}
	);
	Kekule.IO.ChemDataWriterManager.register('kcx', Kekule.IO.KcxWriter, [Kekule.ChemObject], kcxFmtId,
		{
			'createOptions': {'prettyPrint': true}
		}
	);
})();
