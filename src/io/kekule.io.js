/**
 * @fileoverview
 * Abstract root classes for concrete strcuture reader/writers of different structure formats.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /utils/kekule.utils.js
 * requires /xbrowsers/kekule.x.js
 */

(function(){

/*
 * Root object of I/O default options
 * @object
 */
Kekule.globalOptions.add('IO', {});

/**
 * Name space for IO package of Kekule.
 * @namespace
 */
Kekule.IO = {};

/**
 * Enumeration of possible type of input data.
 * @class
 */
Kekule.IO.ChemDataType = {
	/** Plain Text, e.g. MOL data. */
	TEXT: 'text',
	/** DOM Structure, e.g. CML data */
	DOM: 'dom',
	/** JSON Object */
	JSON: 'json',
	/** Binary data */
	BINARY: 'bin',
	/** Other, not used now */
	OTHER: 'other',
	/** Unknown type, usually treat as binary. */
	UNKNOWN: 'unknown',
	/**
	 * Check if type is in binary format.
	 * @param {Int} dataType
	 * @returns {Bool}
	 */
	isBinaryType: function(dataType)
	{
		var T = Kekule.IO.ChemDataType;
		return (!dataType) || (dataType === T.BINARY)
			|| (dataType === T.OTHER) || (dataType === T.UNKNOWN);
	}
};

/**
 * Enumeration of common data format ids.
 * @class
 */
Kekule.IO.DataFormat = {

};

/**
 * Enumeration of common MIME types.
 * @class
 */
Kekule.IO.MimeType = {
	TEXT: 'text/plain',
	HTML: 'text/html',
	XML: 'text/xml',
	JSON: 'application/json',
	JAVASCRIPT: 'application/javascript',
	GIF: 'image/gif',
	JPEG: 'image/jpeg',
	PNG: 'image/png',
	XPNG: 'image/x-png',
	OCTSTREAM: 'application/octet-stream'
};

/**
 * Manager class of data formats.
 * Generally data format item is a hash containing the following fields:
 *   {
 *     id: String, unique ID of format.
 *     dataType: type of data, text, binary or other.
 *     fileExts: Array, possible file extension associated with this format.
 *     mimeType: String, MIME type associated with this format.
 *   }
 * @class
 */
Kekule.IO.DataFormatsManager = {
	/** @private */
	_formats: {},

	/**
	 * Register a new data format. If the mimeType already exists, settings will be merged.
	 * @param {String} id
	 * @param {String} mimeType
	 * @param {Array} fileExts
	 * @param {String} title
	 * @param {String} description
	 * @param {Hash} additionalInfo
	 */
	register: function(id, mimeType, fileExts, dataType, title, description, additionalInfo)
	{
		//var result = Kekule.IO.DataFormatsManager.findFormat(mimeType);
		var result = null;  // MDL 3000/2000 share the same mimeType, so can not use it to make unique
		/*
		if (result)
			console.log('merge', result.fileExts, result.fileExts.length, fileExts, mimeType);
		*/
		if (!result)
			result = FM._formats[id];
		if (!result)
		{
			result = {'id': id};
			FM._formats[id] = result;
		}
		result.mimeType = mimeType;
		var exts = DataType.isArrayValue(fileExts)? fileExts: [fileExts];
		if (!result.fileExts)
			result.fileExts = exts;
		else  // merge
			Kekule.ArrayUtils.pushUnique(result.fileExts, exts);
		if (dataType && (dataType !== Kekule.IO.ChemDataType.UNKNOWN))
			result.dataType = dataType;
		result.title = title;
		result.description = description;
		if (additionalInfo)
			result = Object.extend(result, additionalInfo);

		return result;
	},
	/**
	 * Unregister a data format.
	 * @param {String} id
	 */
	unregister: function(id)
	{
		if (FM._formats[id])
			delete FM._formats[id];
	},

	/**
	 * Returns all registered
	 */
	getAllIds: function()
	{
		return Kekule.ObjUtils.getOwnedFieldNames(FM._formats);
	},

	/**
	 * Returns format detail information. If id not found, null will be returned.
	 * @param {String} id
	 * @returns {Hash}
	 */
	getFormatInfo: function(id)
	{
		return FM._formats[id] || null;
	},

	/**
	 * Returns MIME type of format id.
	 * @param {String} id
	 * @returns {String}
	 */
	getMimeType: function(id)
	{
		var info = FM.getFormatInfo(id);
		return info? info.mimeType: null;
	},
	/**
	 * Returns file extensions of format id.
	 * @param {String} id
	 * @returns {Array}
	 */
	getFileExts: function(id)
	{
		var info = FM.getFormatInfo(id);
		return info? info.fileExts: null;
	},

	/**
	 * Find format detail item by mimeType or fileExt.
	 * @param {String} mimeType
	 * @param {String} fileExt
	 * @returns {Hash}
	 */
	findFormat: function(mimeType, fileExt)
	{
		if (!mimeType && !fileExt)
			return null;
		var ids = FM.getAllIds();
		var matched = false;
		for (var i = 0, l = ids.length; i < l; ++i)
		{
			var info = FM.getFormatInfo(ids[i]);
			/*
			matched = (!mimeType || (mimeType === info.mimeType))
				&& (!fileExt || (info.fileExts.indexOf(fileExt) >= 0));
			*/
			matched = (mimeType && (mimeType === info.mimeType));
			if (!matched)
				matched = (fileExt && (info.fileExts.indexOf(fileExt) >= 0));
			if (matched)
				return info;
		}
		return null;
	},
	/**
	 * Find format ID by mimeType or fileExt.
	 * @param {String} mimeType
	 * @param {String} fileExt
	 * @returns {String}
	 */
	findFormatId: function(mimeType, fileExt)
	{
		var info = Kekule.IO.DataFormatsManager.findFormat(mimeType, fileExt);
		return info? info.id: null;
	}
};

/** @ignore */
var FM = Kekule.IO.DataFormatsManager;
/** @ignore */
Kekule.IO.dataFormatsManager = Kekule.IO.DataFormatsManager;


/**
 * Abstract root class for all chemistry data readers.
 * @class
 * @augments ObjectEx
 * @param {Hash} options Some additional params passed to reader.
 */
Kekule.IO.ChemDataReader = Class.create(ObjectEx,
/** @lends Kekule.IO.ChemDataReader# */
{
	/** @constructs */
	initialize: function($super, options)
	{
		$super();
	},
	/** @private */
	CLASS_NAME: 'Kekule.IO.ChemDataReader',
	/*
	 * Read from data, create related instance and encapsulation the instance inside a {@link Kekule.ChemDocument}.
	 * @param {Variant} data
	 * @param {String} dataType Type of data, value should fom {@link Kekule.IO.ChemDataType}.
	 * @param {String} format Format ID.
	 * @returns {Kekule.ChemDocument} Instance created by data.
	 */
	/*
	readDocument: function(data, dataType, format)
	{
		return this.doReadDocument(data, dataType, format);
	},
	*/
	/*
	 * Do actual work for {@link Kekule.IO.ChemDataReader#readDocument}. Descendants should override this method.
	 * @param {Variant} data
	 * @param {String} dataType Type of data, value should fom {@link Kekule.IO.ChemDataType}.
	 * @param {String} format Format ID.
	 * @returns {Kekule.ChemDocument} Instance created by data.
	 */
	/*
	doReadDocument: function(data, dataType, format)
	{
		var doc;
		var r = this.readData(data, dataType, format);
		if (r && r.setOwner)
		{
			doc = new Kekule.ChemDocument();
			doc.setDocObj(r);
		}
		return doc;
	},
	*/
	/**
	 * Read from data and return a related instance.
	 * @param {Variant} data
	 * @param {String} dataType Type of data, value should fom {@link Kekule.ChemStructureDataType}.
	 * @param {String} format Format ID.
	 * @param {Hash} options Additional options to read data. Different reader may have different options.
	 * @returns {Variant} Instance created by data.
	 */
	readData: function(data, dataType, format, options)
	{
		if (!dataType)  // auto detect
		{
			var finfo = Kekule.IO.DataFormatsManager.getFormatInfo(format);
			dataType = finfo? finfo.dataType: null;
			if (!dataType)
				dataType = (typeof(data) === 'string')?
					Kekule.IO.ChemDataType.TEXT:
					(data.getElementsByTagName? Kekule.IO.ChemDataType.DOM: Kekule.IO.ChemDataType.BINARY );
		}
		var result = this.doReadData(data, dataType, format, options || {});
		if ((result instanceof Kekule.ChemObject) && (result.getSrcInfo))
		{
			var info = result.getSrcInfo();
			info.data = data;
			info.dataType = dataType;
			var formatDetail = Kekule.IO.DataFormatsManager.getFormatInfo(format);
			if (formatDetail)
			{
				info.format = format;
				info.mimeType = formatDetail.mimeType;
				info.possibleFileExts = formatDetail.fileExts;
			}
			//console.log('set src info', info);
		}
		return result;
	},
	/**
	 * Do actual work for {@link Kekule.IO.ChemDataReader#readData}. Descendants should override this method.
	 * @param {Variant} data
	 * @param {String} dataType Type of data, value should fom {@link Kekule.IO.ChemDataType}.
	 * @param {String} format Format ID.
	 * @param {Hash} options Additional options to read data. Different reader may have different options.
	 * @returns {Variant} Instance created by data.
	 */
	doReadData: function(data, dataType, format, options)
	{
		// do nothing here
	}
});

/**
 * Abstract root class for all chemistry data writers.
 * @class
 * @augments ObjectEx
 * @param {Hash} options Some additional params passed to reader.
 */
Kekule.IO.ChemDataWriter = Class.create(ObjectEx,
/** @lends Kekule.IO.ChemDataWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.ChemDataWriter',
	/** @constructs */
	initialize: function($super, options)
	{
		$super();
	},
	/*
	 * Read document object of {@link Kekule.ChemDocument} and write it to proper data form.
	 * @param {@link Kekule.ChemDocument} doc Document to write.
	 * @param {String} dataType Type of data, value should fom {@link Kekule.IO.ChemDataType}.
	 * @param {String} format Format ID.
	 * @returns {Variant} Data output, the type of data is decided by dataType param.
	 */
	/*
	writeDocument: function(doc, dataType, format)
	{
		return this.doWriteDocument(doc, dataType, format);
	},
	*/
	/*
	 * Do actual work for {@link Kekule.IO.ChemDataReader#writeDocument}. Descendants should override this method.
	 * @param {@link Kekule.ChemDocument} doc Document to write.
	 * @param {String} dataType Type of data, value should fom {@link Kekule.IO.ChemDataType}.
	 * @param {String} format Format ID.
	 * @returns {Variant} Data output, the type of data is decided by dataType param.
	 */
	/*
	doWriteDocument: function(doc, dataType, format)
	{
		return this.writeData(doc.docObj, dataType, format);
	},
	*/
	/**
	 * Write Kekule object to data.
	 * @param {Kekule.ChemObject} obj Object to write
	 * @param {String} dataType Type of data, value should fom {@link Kekule.IO.ChemDataType}.
	 * @param {String} format Format ID.
	 * @param {Hash} options Additional options to write data. Different writer may have different options.
	 * @returns {Variant} Data output, the type of data is decided by dataType param.
	 */
	writeData: function(obj, dataType, format, options)
	{
		//var dtype = dataType || Kekule.IO.ChemDataType.TEXT;
		if (!dataType)  // auto detect
		{
			var finfo = Kekule.IO.DataFormatsManager.getFormatInfo(format);
			dataType = finfo? finfo.dataType: null;
		}
		return this.doWriteData(obj, dataType, format, options || {});
	},
	/**
	 * Do actual work for {@link Kekule.IO.ChemDataReader#writeData}. Descendants should override this method.
	 * @param {Kekule.ChemObject} obj Object to write
	 * @param {String} dataType Type of data, value should fom {@link Kekule.IO.ChemDataType}.
	 * @param {String} format Format ID.
	 * @param {Hash} options Additional options to write data. Different writer may have different options.
	 * @returns {Variant} Data output, the type of data is decided by dataType param.
	 * @private
	 */
	doWriteData: function(obj, dataType, format, options)
	{
		// do nothing here
	}
});

/**
 * A manager to create suitable data reader.
 * @class
 */
Kekule.IO.ChemDataReaderManager = {
	/**
	 * Stores registered reader information. Each item including the following fields:
	 *   {
	 *     id: String,
	 *     readerClass: Class,
	 *     instances: Object  // reader instance, null at first
	 *     additionalInfos...
	 *   }
	 * @private
	 */
	_readers: [],
	/**
	 * Register a data reader.
	 * @param {String} id A UID string for reader.
	 * @param {Class} readerClass Class of reader.
	 * @param {Variant} formatId String or Array, associated format IDs.
	 * @param {Hash} additionalInfo More information on this reader class. Can include the following fields:
	 *   {
	 *     {Hash} createOptions: hash passed into reader's constructor.
	 *     (String) title: Reader title,
	 *     {String} formatId: id of data format
	 *     //(String) mimeType
	 *     //(Variant) fileExt: if load from a file, the file ext. Can be a string or Array of string.
	 *   }
	 */
	register: function(id, readerClass, formatId, additionalInfo)
	{
		if (!id || !readerClass || !formatId || (DataType.isArrayValue(formatId) && !formatId.length))  // empty format
			return;
		if (Kekule.IO.ChemDataReaderManager.getReaderInfoById(id)) // id can not be duplicate
		{
			Kekule.raise(/*Kekule.ErrorMsg.READER_ID_ALREADY_EXISTS*/Kekule.$L('ErrorMsg.READER_ID_ALREADY_EXISTS'));
			return null;
		}
		var item = {
			'id': id,
			'readerClass': readerClass,
			'formatId': DataType.isArrayValue(formatId)? formatId: [formatId]
		};
		item = Object.extend(item, additionalInfo);
		Kekule.IO.ChemDataReaderManager._readers.push(item);
		return item;
	},
	/**
	 * Returns all file format IDs that has corresponding reader.
	 * @returns {Array} Array of format id.
	 */
	getAllReadableFormatIds: function()
	{
		var result = [];
		var readers = Kekule.IO.ChemDataReaderManager._readers;
		for (var i = 0, l = readers.length; i < l; ++i)
		{
			var item = readers[i];
			var fids = item.formatId;
			//result = result.concat(fids || []);
			Kekule.ArrayUtils.pushUnique(result, fids);
		}
		return result;
	},
	/**
	 * Returns all file formats that has corresponding reader.
	 * @returns {Array} Array of format object.
	 */
	getAllReadableFormats: function()
	{
		var result = [];
		/*
		var readers = Kekule.IO.ChemDataReaderManager._readers;
		for (var i = 0, l = readers.length; i < l; ++i)
		{
			var item = readers[i];
			var fids = item.formatId;
			for (var j = 0, k = fids.length; j < k; ++j)
			{
				var fid = fids[j];
				var info = FM.getFormatInfo(fid);
				if (info)
					result.push(info);
			}
		}
		*/
		var ids = Kekule.IO.ChemDataReaderManager.getAllReadableFormatIds();
		for (var i = 0, l = ids.length; i < l; ++i)
		{
			var info = FM.getFormatInfo(ids[i]);
			if (info)
				result.push(info);
		}
		return result;
	},
	/**
	 * Get all available reader infos by condition provided and be suitable for targetClass.
	 * For example: Kekule.IO.ChemDataReaderManager.getAvailableReaderInfos({'id': 'mol'});
	 * @param {Hash} condition
	 * @returns {Array}
	 */
	getAvailableReaderInfos: function(condition)
	{
		var result = [];
		var rs = Kekule.IO.ChemDataReaderManager._readers;
		for (var i = rs.length - 1; i >=0; --i)
		{
			if (Kekule.ObjUtils.match(rs[i], condition))
			{
				result.push(rs[i]);
			}
		}
		return result;
	},
	/**
	 * Get reader information by condition provided.
	 * For example: Kekule.IO.ChemDataWriterManager.getReaderInfo({'formatId': 'cml'});
	 * @param {Hash} condition
	 * @returns {Hash}
	 */
	getReaderInfo: function(condition)
	{
		var rs = Kekule.IO.ChemDataReaderManager._readers;
		for (var i = rs.length - 1; i >=0; --i)
		{
			if (Kekule.ObjUtils.match(rs[i], condition))
				return rs[i];
		}
		return null;
	},
	/**
	 * Get reader information by Id.
	 * @param {String} id
	 * @returns {Hash}
	 */
	getReaderInfoById: function(id)
	{
		return Kekule.IO.ChemDataReaderManager.getReaderInfo({'id': id});
	},
	/**
	 * Get reader information by data format id.
	 * @param {String} formatId
	 * @param {Hash} otherConditions
	 * @returns {Hash}
	 */
	getReaderInfoByFormat: function(formatId, otherConditions)
	{
		var rs = Kekule.IO.ChemDataReaderManager._readers;
		for (var i = rs.length - 1; i >=0; --i)
		{
			if ((!otherConditions) || Kekule.ObjUtils.match(rs[i], otherConditions))
			{
				if (rs[i].formatId.indexOf(formatId) >= 0)
					return rs[i];
			}
		}
		return null;
	},
	/**
	 * Get reader information by file ext.
	 * @param {String} fileExt
	 * @param {Hash} otherConditions
	 * @returns {Hash}
	 */
	getReaderInfoByFileExt: function(fileExt, otherConditions)
	{
		/*
		var rs = Kekule.IO.ChemDataReaderManager._readers;
		for (var i = rs.length - 1; i >=0; --i)
		{
			if ((!otherConditions) || Kekule.ObjUtils.match(rs[i], otherConditions))
			{
				if (rs[i].fileExt == fileExt)
					return rs[i];
				else if (rs[i].fileExt.indexOf && (rs[i].fileExt.indexOf(fileExt) >= 0))
					return rs[i];
			}
		}
		return null;
		*/
		var fid = Kekule.IO.DataFormatsManager.findFormatId(null, fileExt);
		return fid? Kekule.IO.ChemDataReaderManager.getReaderInfoByFormat(fid, otherConditions): null;
	},
	/** @private */
	createReaderOfInfo: function(info)
	{
		return new info.readerClass(info.createOptions);
	},
	/** @private */
	getReaderOfInfo: function(info)
	{
		if (!info.instance)
			info.instance = Kekule.IO.ChemDataReaderManager.createReaderOfInfo(info);
		return info.instance;
	},
	/**
	 * Create a new reader instance by condition.
	 * @param {Hash} condition
	 * @returns {Kekule.IO.ChemDataReader}
	 */
	createReader: function(condition)
	{
		var info = Kekule.IO.ChemDataReaderManager.getReaderInfo(condition);
		if (info)
			return Kekule.IO.ChemDataReaderManager.createReaderOfInfo(info);
	},
	/**
	 * Get a reusable reader instance by condition.
	 * @param {Hash} condition
	 * @returns {Kekule.IO.ChemDataReader}
	 */
	getReader: function(condition)
	{
		var info = Kekule.IO.ChemDataReaderManager.getReaderInfo(condition);
		if (info)
			return Kekule.IO.ChemDataReaderManager.getReaderOfInfo(info);
	},
	/**
	 * Create a new reader instance by id.
	 * @param {String} id
	 * @returns {Kekule.IO.ChemDataReader}
	 */
	createReaderById: function(id)
	{
		return Kekule.IO.ChemDataReaderManager.createReader({'id': id});
	},
	/**
	 * Get a reusable reader instance by id.
	 * @param {String} id
	 * @returns {Kekule.IO.ChemDataReader}
	 */
	getReaderById: function(id)
	{
		return Kekule.IO.ChemDataReaderManager.getReader({'id': id});
	},
	/**
	 * Create new reader instance by formatId.
	 * @param {String} formatId
	 * @param {Hash} otherConditions
	 * @returns {Kekule.IO.ChemDataReader}
	 */
	createReaderByFormat: function(formatId, otherConditions)
	{
		var info = Kekule.IO.ChemDataReaderManager.getReaderInfoByFormat(formatId, otherConditions);
		return info? IO.ChemDataReaderManager.createReaderOfInfo(info): null;
	},
	/**
	 * Get reader instance by format Id.
	 * @param {String} fileExt
	 * @param {Hash} otherConditions
	 * @returns {Kekule.IO.ChemDataReader}
	 */
	getReaderByFormat: function(formatId, otherConditions)
	{
		var info = Kekule.IO.ChemDataReaderManager.getReaderInfoByFormat(formatId, otherConditions);
		return info? Kekule.IO.ChemDataReaderManager.getReaderOfInfo(info): null;
	},
	/**
	 * Create reader instance by file ext.
	 * @param {String} fileExt
	 * @param {Hash} otherConditions
	 * @returns {Kekule.IO.ChemDataReader}
	 */
	createReaderByFileExt: function(fileExt, otherConditions)
	{
		var info = Kekule.IO.ChemDataReaderManager.getReaderInfoByFileExt(fileExt, otherConditions);
		return info? Kekule.IO.ChemDataReaderManager.createReaderOfInfo(info): null;
	},
	/**
	 * Get reader instance by file ext.
	 * @param {String} fileExt
	 * @param {Hash} otherConditions
	 * @returns {Kekule.IO.ChemDataReader}
	 */
	getReaderByFileExt: function(fileExt, otherConditions)
	{
		var info = Kekule.IO.ChemDataReaderManager.getReaderInfoByFileExt(fileExt, otherConditions);
		return info? Kekule.IO.ChemDataReaderManager.getReaderOfInfo(info): null;
	},

	/**
	 * Create a new reader instance by MIME type.
	 * @param {String} mimeType
	 * @returns {Kekule.IO.ChemDataReader}
	 */
	createReaderByMimeType: function(mimeType)
	{
		//return Kekule.IO.ChemDataReaderManager.createReader({'mimeType': mimeType});
		var fid = Kekule.IO.DataFormatsManager.findFormatId(mimeType, null);
		return fid? Kekule.IO.ChemDataReaderManager.createReaderByFormat(fid): null;
	},
	/**
	 * Get a reusable reader instance by MIME type.
	 * @param {String} mimeType
	 * @returns {Kekule.IO.ChemDataReader}
	 */
	getReaderByMimeType: function(mimeType)
	{
		//return Kekule.IO.ChemDataReaderManager.getReader({'mimeType': mimeType});
		var fid = Kekule.IO.DataFormatsManager.findFormatId(mimeType, null);
		return fid? Kekule.IO.ChemDataReaderManager.getReaderByFormat(fid): null;
	}
};

/**
 * A manager to create suitable data writer.
 * @class
 */
Kekule.IO.ChemDataWriterManager = {
	/**
	 * Stores registered writer information. Each item including the following fields:
	 *   {
	 *     id: String,
	 *     srcClass: Class,
	 *     writerClass: Class,
	 *     instances: Object  // reader instance, null at first
	 *     additionalInfos...
	 *   }
	 * @private
	 */
	_writers: [],
	/**
	 * Register a data writer.
	 * @param {String} id A UID string for writer.
	 * @param {Class} writerClass Class of writer.
	 * @param {Array} srcClasses Instance of which classes can be written by this writer.
	 * @param {Variant} formatId Data format, string or array.
	 * @param {Hash} additionalInfo More information on this reader class. Can include the following fields:
	 *   {
	 *     {Hash} createOptions: hash passed into writer's constructor.
	 *     (String) title: Writer title,
	 *     (String) mimeType
	 *     (String) fileExt: if write to a file, the file ext.
	 *   }
	 */
	register: function(id, writerClass, srcClasses, formatId, additionalInfo)
	{
		if (!id || !writerClass || !formatId || (DataType.isArrayValue(formatId) && !formatId.length))  // empty format
			return;
		if (Kekule.IO.ChemDataWriterManager.getWriterInfoById(id)) // id can not be duplicate
		{
			Kekule.raise(/*Kekule.ErrorMsg.WRITER_ID_ALREADY_EXISTS*/Kekule.$L('ErrorMsg.WRITER_ID_ALREADY_EXISTS'));
			return null;
		}
		var item = {
			'id': id,
			'writerClass': writerClass,
			'srcClasses': srcClasses,
			'formatId': DataType.isArrayValue(formatId)? formatId: [formatId]
		};
		item = Object.extend(item, additionalInfo);
		Kekule.IO.ChemDataWriterManager._writers.push(item);
		return item;
	},
	/**
	 * Returns all file format IDs that has corresponding writer.
	 * @returns {Array} Array of format id.
	 */
	getAllWritableFormatIds: function()
	{
		var result = [];
		var writers = Kekule.IO.ChemDataWriterManager._writers;
		for (var i = 0, l = writers.length; i < l; ++i)
		{
			var item = writers[i];
			var fids = item.formatId;
			//result = result.concat(fids || []);
			Kekule.ArrayUtils.pushUnique(result, fids);
		}
		return result;
	},
	/**
	 * Returns all file formats that has corresponding writer.
	 * @returns {Array} Array of format object.
	 */
	getAllWritableFormats: function()
	{
		var result = [];
		var ids = Kekule.IO.ChemDataWriterManager.getAllWritableFormatIds();
		for (var i = 0, l = ids.length; i < l; ++i)
		{
			var info = FM.getFormatInfo(ids[i]);
			if (info)
				result.push(info);
		}
		return result;
	},
	/**
	 * Get all available writer infos by condition provided and suitble for srcObj.
	 * For example: Kekule.IO.ChemDataWriterManager.getWriterInfo({'id': 'mol'});
	 * @param {Hash} condition
	 * @param {Variant} srcObjOrClass
	 * @returns {Array}
	 */
	getAvailableWriterInfos: function(condition, srcObjOrClass)
	{
		var result = [];
		var srcClass = ClassEx.isClass(srcObjOrClass)? srcObjOrClass:
			srcObjOrClass.getClass? srcObjOrClass.getClass():
			srcObjOrClass? null:  // null, src set but no class found, special marked
			undefined;
		var ws = Kekule.IO.ChemDataWriterManager._writers;
		for (var i = ws.length - 1; i >=0; --i)
		{
			if (Kekule.ObjUtils.match(ws[i], condition))
			{
				if (srcClass !== undefined)
				{
					if (srcClass)
					{
						for (var j = 0, k = ws[i].srcClasses.length; j < k; ++j)
						{
							if (ClassEx.isOrIsDescendantOf(srcClass, ws[i].srcClasses[j]))
								result.push(ws[i]);
						}
					}
				}
				else
					result.push(ws[i]);
			}
		}
		return result;
	},
	/**
	 * Get writer info by condition provided and suitble for srcObj.
	 * For example: Kekule.IO.ChemDataWriterManager.getWriterInfo({'id': 'mol'});
	 * @param {Hash} condition
	 * @param {Kekule.ChemObject} srcObj
	 * @returns {Hash}
	 */
	getWriterInfo: function(condition, srcObj)
	{
		var ws = Kekule.IO.ChemDataWriterManager._writers;
		for (var i = ws.length - 1; i >=0; --i)
		{
			if (Kekule.ObjUtils.match(ws[i], condition))
			{
				if (srcObj)
				{
					for (var j = 0, k = ws[i].srcClasses.length; j < k; ++j)
					{
						if (srcObj instanceof ws[i].srcClasses[j])
							return ws[i];
					}
					return null;
				}
				else
					return ws[i];
			}
		}
		return null;
	},
	/**
	 * Get writer information by Id.
	 * @param {String} id
	 * @param {Kekule.ChemObject} srcObj
	 * @returns {Hash}
	 */
	getWriterInfoById: function(id, srcObj)
	{
		return Kekule.IO.ChemDataWriterManager.getWriterInfo({'id': id}, srcObj);
	},
	/**
	 * Get writer information by data format id.
	 * @param {String} formatId
	 * @param {Hash} otherConditions
	 * @returns {Hash}
	 */
	getWriterInfoByFormat: function(formatId, otherConditions, srcObj)
	{
		/*
		var condition = otherConditions || {};
		condition.formatId = formatId;
		return Kekule.IO.ChemDataWriterManager.getWriterInfo(condition, srcObj);
		*/

		var ws = Kekule.IO.ChemDataWriterManager._writers;
		for (var i = ws.length - 1; i >=0; --i)
		{
			if ((!otherConditions) || Kekule.ObjUtils.match(ws[i], otherConditions))
			{
				if (ws[i].formatId.indexOf(formatId) >= 0)
				{
					if (srcObj)
					{
						for (var j = 0, k = ws[i].srcClasses.length; j < k; ++j)
						{
							if (srcObj instanceof ws[i].srcClasses[j])
								return ws[i];
						}
						return null;
					}
					return ws[i];
				}
			}
		}
		return null;
	},
	/**
	 * Get writer information by file ext.
	 * @param {String} fileExt
	 * @param {Hash} otherConditions
	 * @param {Kekule.ChemObject} srcObj
	 * @returns {Hash}
	 */
	getWriterInfoByFileExt: function(fileExt, otherConditions, srcObj)
	{
		/*
		var ws = Kekule.IO.ChemDataWriterManager._writers;
		var result;
		for (var i = ws.length - 1; i >=0; --i)
		{
			result = null;
			if ((!otherConditions) || Kekule.ObjUtils.match(ws[i], otherConditions))
			{
				if (ws[i].fileExt == fileExt)
					result = ws[i];
				else if (ws[i].fileExt.indexOf && (ws[i].fileExt.indexOf(fileExt) >= 0))
					result = ws[i];
			}
			if (result)  // check srcObj
			{
				if (srcObj)
				{
					for (var j = 0, k = result.srcClasses; j < k; ++j)
					{
						if (srcObj instanceof result.srcClasses[j])
							return result;
					}
					result = null;
				}
				else
					return result;
			}
		}
		return null;
		*/
		var fid = Kekule.IO.DataFormatsManager.findFormatId(null, fileExt);
		return fid? Kekule.IO.ChemDataWriterManager.getWriterInfoByFormat(fid, otherConditions, srcObj): null;
	},
	/** @private */
	createWriterOfInfo: function(info)
	{
		return new info.writerClass(info.createOptions);
	},
	/** @private */
	getWriterOfInfo: function(info)
	{
		if (!info.instance)
			info.instance = Kekule.IO.ChemDataWriterManager.createWriterOfInfo(info);
		return info.instance;
	},
	/**
	 * Create a new writer instance by condition and suitable for srcObj.
	 * @param {Hash} condition
	 * @param {Kekule.ChemObject} srcObj
	 * @returns {Kekule.IO.ChemDataWriter}
	 */
	createWriter: function(condition, srcObj)
	{
		var info = Kekule.IO.ChemDataWriterManager.getWriterInfo(condition, srcObj);
		if (info)
			return Kekule.IO.ChemDataWriterManager.createWriterOfInfo(info);
		else
			return null;
	},
	/**
	 * Get a reusable writer instance by condition and suitable for srcObj.
	 * @param {Hash} condition
	 * @param {Kekule.ChemObject} srcObj
	 * @returns {Kekule.IO.ChemDataWriter}
	 */
	getWriter: function(condition, srcObj)
	{
		var info = Kekule.IO.ChemDataWriterManager.getWriterInfo(condition, srcObj);
		if (info)
			return Kekule.IO.ChemDataWriterManager.getWriterOfInfo(info);
		else
			return null;
	},
	/**
	 * Create a new writer instance by id and meet srcObj.
	 * @param {String} id
	 * @param {Kekule.ChemObject} srcObj
	 * @returns {Kekule.IO.ChemDataWriter}
	 */
	createWriterById: function(id, srcObj)
	{
		return Kekule.IO.ChemDataWriterManager.createWriter({'id': id}, srcObj);
	},
	/**
	 * Get a reusable writer instance by id and meet srcObj.
	 * @param {String} id
	 * @param {Kekule.ChemObject} srcObj
	 * @returns {Kekule.IO.ChemDataWriter}
	 */
	getWriterById: function(id, srcObj)
	{
		return Kekule.IO.ChemDataWriterManager.getWriter({'id': id}, srcObj);
	},
	/**
	 * Create new writer instance by formatId.
	 * @param {String} formatId
	 * @param {Hash} otherConditions
	 * @returns {Kekule.IO.ChemDataWriter}
	 */
	createWriterByFormat: function(formatId, otherConditions, srcObj)
	{
		var info = Kekule.IO.ChemDataWriterManager.getWriterInfoByFormat(formatId, otherConditions, srcObj);
		return info? Kekule.IO.ChemDataWriterManager.createWriterOfInfo(info): null;
	},
	/**
	 * Get new writer instance by formatId.
	 * @param {String} formatId
	 * @param {Hash} otherConditions
	 * @returns {Kekule.IO.ChemDataWriter}
	 */
	getWriterByFormat: function(formatId, otherConditions, srcObj)
	{
		var info = Kekule.IO.ChemDataWriterManager.getWriterInfoByFormat(formatId, otherConditions, srcObj);
		return info? Kekule.IO.ChemDataWriterManager.getWriterOfInfo(info): null;
	},
	/**
	 * Create writer instance by file ext.
	 * @param {String} fileExt
	 * @param {Hash} otherConditions
	 * @param {Kekule.ChemObject} srcObj
	 * @returns {Kekule.IO.ChemDataWriter}
	 */
	createWriterByFileExt: function(fileExt, otherConditions, srcObj)
	{
		var info = Kekule.IO.ChemDataWriterManager.getWriterInfoByFileExt(fileExt, otherConditions, srcObj);
		return info? Kekule.IO.ChemDataWriterManager.createWriterOfInfo(info): null;
	},
	/**
	 * Get a reusbale writer instance by file ext.
	 * @param {String} fileExt
	 * @param {Hash} otherConditions
	 * @param {Kekule.ChemObject} srcObj
	 * @returns {Kekule.IO.ChemDataWriter}
	 */
	getWriterByFileExt: function(fileExt, otherConditions, srcObj)
	{
		var info = Kekule.IO.ChemDataWriterManager.getWriterInfoByFileExt(fileExt, otherConditions, srcObj);
		return info? Kekule.IO.ChemDataWriterManager.getWriterOfInfo(info): null;
	},
	/**
	 * Create a new reader instance by MIME type.
	 * @param {String} mimeType
	 * @param {Kekule.ChemObject} srcObj
	 * @returns {Kekule.IO.ChemDataWriter}
	 */
	createWriterByMimeType: function(mimeType, srcObj)
	{
		//return Kekule.IO.ChemDataWriterManager.createWriter({'mimeType': mimeType});
		var fid = Kekule.IO.DataFormatsManager.findFormatId(mimeType, null);
		return fid? Kekule.IO.ChemDataWriterManager.createWriterByFormat(fid, null, srcObj): null;
	},
	/**
	 * Get a reusable new reader instance by MIME type.
	 * @param {String} mimeType
	 * @returns {Kekule.IO.ChemDataWriter}
	 */
	getWriterByMimeType: function(mimeType)
	{
		//return Kekule.IO.ChemDataWriterManager.getWriter({'mimeType': mimeType});
		var fid = Kekule.IO.DataFormatsManager.findFormatId(mimeType, null);
		return fid? Kekule.IO.ChemDataWriterManager.getWriterByFormat(fid, null, srcObj): null;
	}
};

/**
 * Load from content with certain format.
 * @param {String} content
 * @param {String} formatId
 * @param {Hash} options Additional options to read data. Different data format may have different options.
 * @returns {Kekule.ChemObject}
 */
Kekule.IO.loadFormatData = function(content, formatId, options)
{
	var reader = Kekule.IO.ChemDataReaderManager.getReaderByFormat(formatId);
	if (reader)
	{
		var result = reader.readData(content, null, formatId, options);
		/*
		if ((result instanceof Kekule.ChemObject) && (result.getSrcInfo))
		{
			var info = result.getSrcInfo();
			info.mimeType = mimeType;
			info.fileExt = fileExt;
			info.url = url;
		}
		*/
		if (!result)
		{
			var msg = Kekule.$L('ErrorMsg.FAIL_TO_READ_FORMAT') + formatId;
			Kekule.raise(msg);
		}
		return result;
	}
	else
	{
		var msg = /*Kekule.ErrorMsg.NO_SUITABLE_READER_FOR_FORMAT*/Kekule.$L('ErrorMsg.NO_SUITABLE_READER_FOR_FORMAT') + formatId;
		Kekule.raise(msg);
		return null;
	}
};
/**
 * Load from content with mimeType and create a new chem object.
 * @param {String} content
 * @param {String} mimeType
 * @param {Hash} options Additional options to read data. Different data format may have different options.
 * @returns {Kekule.ChemObject}
 */
Kekule.IO.loadMimeData = function(content, mimeType, options)
{
	/*
	var reader = Kekule.IO.ChemDataReaderManager.getReaderByMimeType(mimeType);
	if (reader)
	{
		var result = reader.readData(content);
		if ((result instanceof Kekule.ChemObject) && (result.getSrcInfo))
		{
			result.getSrcInfo().mimeType = mimeType;
		}
	}
	else
	{
		Kekule.raise(Kekule.ErrorMsg.NO_SUITABLE_READER_FOR_MIMETYPE + mimeType);
		return null;
	}
	*/
	return Kekule.IO.loadTypedData(content, mimeType, null, options);
};
/**
 * Load a typed content  and create a new chem object, the type is recognized by mimeType or the file extension.
 * @param {String} content
 * @param {String} mimeType
 * @param {String} url
 * @param {Hash} options Additional options to read data. Different data format may have different options.
 * @returns {Kekule.ChemObject}
 */
Kekule.IO.loadTypedData = function(content, mimeType, url, options)
{
	//var reader;
	var fileExt;
	if (url)
	{
		fileExt = Kekule.UrlUtils.extractFileExt(url);
		/*
		if (!fileExt)
			fileExt = urlOrFileExt;
		else
			url = urlOrFileExt;
		*/
	}

	/*
	if (mimeType)
		reader = Kekule.IO.ChemDataReaderManager.getReaderByMimeType(mimeType);

	if (!reader && fileExt)
	{
		reader = Kekule.IO.ChemDataReaderManager.getReaderByFileExt(fileExt);
	}


	if (reader)
	{
		var result = reader.readData(content);
		if ((result instanceof Kekule.ChemObject) && (result.getSrcInfo))
		{
			var info = result.getSrcInfo();
			if (mimeType)
				info.mimeType = mimeType;
			if (fileExt)
				info.fileExt = fileExt;
			if (url)
				info.url = url;
		}
		return result;
	}
	*/
	var formatId = Kekule.IO.DataFormatsManager.findFormatId(mimeType, mimeType? null: fileExt);
	var result;
	if (formatId)
		result = Kekule.IO.loadFormatData(content, formatId, options);
	if (result)
	{
		if ((result instanceof Kekule.ChemObject) && (result.getSrcInfo))
		{
			var info = result.getSrcInfo();
			if (mimeType)
				info.mimeType = mimeType;
			if (fileExt)
				info.fileExt = fileExt;
			if (url)
			{
				info.url = url;
				info.fileName = url;
			}
		}
		return result;
	}
	else
	{
		var msg = mimeType?
			(/*Kekule.ErrorMsg.NO_SUITABLE_READER_FOR_MIMETYPE*/Kekule.$L('ErrorMsg.NO_SUITABLE_READER_FOR_MIMETYPE') + mimeType):
			(/*Kekule.ErrorMsg.NO_SUITABLE_READER_FOR_FILEEXT*/Kekule.$L('ErrorMsg.NO_SUITABLE_READER_FOR_FILEEXT') + fileExt);
		Kekule.raise(msg);
		return null;
	}
};

/**
 * Load chem object from a File object.
 * Note this function relies on FileApi support.
 * @param {File} file
 * @param {Function} callback Callback function when the file is loaded. Has two params (chemObj, success).
 * @param {String} formatId If not set, format will be get from file name automatically.
 * @param {Hash} options Additional options to read data. Different data format may have different options.
 */
Kekule.IO.loadFileData = function(file, callback, formatId, options)
{
	if (Kekule.BrowserFeature.fileapi)
	{
		//try
		{
			var fileName = file.name;
			var ext = Kekule.UrlUtils.extractFileExt(fileName);
			var formatInfo;
			if (!formatId)
			{
				formatInfo = Kekule.IO.DataFormatsManager.findFormat(null, ext);
			}
			else
				formatInfo = Kekule.IO.DataFormatsManager.getFormatInfo(formatId);

			if (!formatInfo)
			{
				var msg = /*Kekule.ErrorMsg.NO_SUITABLE_READER_FOR_FILEEXT*/Kekule.$L('ErrorMsg.NO_SUITABLE_READER_FOR_FILEEXT') + ext;
				Kekule.raise(msg);
				return;
			}

			//var isBinary = (formatInfo.dataType === Kekule.IO.ChemDataType.BINARY);
			var isBinary = Kekule.IO.ChemDataType.isBinaryType(formatInfo.dataType);

			// try open it the file by FileReader
			var reader = new FileReader();
			reader.onload = function(e)
			{
				var content = reader.result;
				var chemObj = Kekule.IO.loadFormatData(content, formatInfo.id, options);
				var info = chemObj.getSrcInfo();
				info.fileName = fileName;
				var success = !!chemObj;
				callback(chemObj, success);
			};

			if (isBinary)
				//reader.readAsBinaryString(file);
				reader.readAsArrayBuffer(file);
			else
				reader.readAsText(file);
		}
		/*
		catch(e)
		{
			console.error('EXTRA ERROR HERE');
			Kekule.error(e);
		}
		*/
	}
	else
	{
		Kekule.error(/*Kekule.ErrorMsg.FILE_API_NOT_SUPPORTED*/Kekule.$L('ErrorMsg.FILE_API_NOT_SUPPORTED'));
	}
};

/**
 * Load chem object from a URL.
 * Note this function relies on AJAX support.
 * @param {String} fileUrl
 * @param {Function} callback Callback function when the file is loaded. Has two params (chemObj, success).
 * @param {String} formatId If not set, format will be get from file name automatically.
 * @param {Hash} options Additional options to read data. Different data format may have different options.
 */
Kekule.IO.loadUrlData = function(fileUrl, callback, formatId, options)
{
	if (Kekule.Ajax)
	{
		Kekule.Ajax.sendRequest(fileUrl, function(data, requestObj, success){
			if (data && success)
			{
				// try resolve file format
				var formatInfo;
				if (formatId)
					formatInfo = Kekule.IO.DataFormatsManager.getFormatInfo(formatId);
				if (!formatId)
				{
					var mimeType = Kekule.Ajax.getResponseMimeType(requestObj);
					formatInfo = Kekule.IO.DataFormatsManager.findFormat(mimeType);
				}
				if (!formatId)
				{
					var ext = Kekule.UrlUtils.extractFileExt(fileUrl);
					formatInfo = Kekule.IO.DataFormatsManager.findFormat(null, ext);
				}
				if (!formatInfo)
				{
					var msg = Kekule.$L('ErrorMsg.NO_SUITABLE_READER_FOR_FILEEXT') + ext;
					Kekule.raise(msg);
					return;
				}

				var chemObj = Kekule.IO.loadFormatData(data, formatInfo.id, options);
				var info = chemObj.getSrcInfo();
				info.fileName = fileUrl;
				var success = !!chemObj;
				callback(chemObj, success);
			}
			else
			{
				Kekule.raise(Kekule.$L('ErrorMsg.FAIL_TO_LOAD_FILE_URL') + fileUrl);
			}
		});
	}
	else
	{
		Kekule.raise(Kekule.$L('ErrorMsg.AJAX_FILELOADER_NOT_FOUND'));
		return null;
	}
};

/**
 * Save chemObj with certain format.
 * @param {String} content
 * @param {String} formatId
 * @param {Hash} options Additional options to save data. Different data format may have different options.
 * @returns {Kekule.ChemObject}
 */
Kekule.IO.saveFormatData = function(chemObj, formatId, options)
{
	var writer = Kekule.IO.ChemDataWriterManager.getWriterByFormat(formatId, null, chemObj);
	if (writer)
	{
		var result = writer.writeData(chemObj, null, formatId, options);
		return result;
	}
	else
	{
		var msg = /*Kekule.ErrorMsg.NO_SUITABLE_WRITER_FOR_FORMAT*/Kekule.$L('ErrorMsg.NO_SUITABLE_WRITER_FOR_FORMAT') + formatId;
		Kekule.raise(msg);
		return null;
	}
};
/**
 * Save chemObj to string of mimeType.
 * @param {Kekule.ChemObject} chemObj
 * @param {String} mimeType
 * @param {Hash} options Additional options to save data. Different data format may have different options.
 * @returns {String}
 */
Kekule.IO.saveMimeData = function(chemObj, mimeType, options)
{
	/*
	var writer = Kekule.IO.ChemDataWriterManager.getWriterByMimeType(mimeType);
	if (writer)
		return writer.writeData(chemObj);
	else
	{
		Kekule.raise(Kekule.ErrorMsg.NO_SUITABLE_WRITER_FOR_MIMETYPE + mimeType);
		return null;
	}
	*/
	return Kekule.IO.saveTypedData(chemObj, mimeType, null, options);
};
/**
 * Save chem object to a typed content. The type is recognized by mimeType or the file extension.
 * @param {Kekule.ChemObj} chemObj
 * @param {String} mimeType
 * @param {String} urlOrFileExt URL or file ext.
 * @param {Hash} options Additional options to save data. Different data format may have different options.
 * @returns {Variant}
 */
Kekule.IO.saveTypedData = function(chemObj, mimeType, urlOrFileExt, options)
{
	var fileExt;
	if (urlOrFileExt)
	{
		fileExt = Kekule.UrlUtils.extractFileExt(urlOrFileExt);
		if (!fileExt)
			fileExt = urlOrFileExt;
		/*
		if (!fileExt)
			fileExt = urlOrFileExt;
		else
			url = urlOrFileExt;
		*/
	}

	var formatId = Kekule.IO.DataFormatsManager.findFormatId(mimeType, mimeType? null: fileExt);
	var result;
	if (formatId)
		result = Kekule.IO.saveFormatData(chemObj, formatId, options);
	if (Kekule.ObjUtils.isUnset(result))
	{
		var msg = mimeType?
			(/*Kekule.ErrorMsg.NO_SUITABLE_WRITER_FOR_MIMETYPE*/Kekule.$L('ErrorMsg.NO_SUITABLE_WRITER_FOR_MIMETYPE') + mimeType):
			(/*Kekule.ErrorMsg.NO_SUITABLE_WRITER_FOR_FILEEXT*/Kekule.$L('ErrorMsg.NO_SUITABLE_WRITER_FOR_FILEEXT') + fileExt);
		Kekule.raise(msg);
		return null;
	}
	else
		return result;

	/*
	var writer;
	if (mimeType)
		writer = Kekule.IO.ChemDataReaderManager.getWriterByMimeType(mimeType);
	else if (urlOrFileExt)
	{
		var fileExt = Kekule.UrlUtils.extractFileExt(urlOrFileExt);
		if (!fileExt)
			fileExt = urlOrFileExt;
		writer = Kekule.IO.ChemDataReaderManager.getWriterByFileExt(fileExt);
	}
	if (writer)
		return writer.writeData(chemObj);
	else
	{
		var msg = mimeType?
			Kekule.ErrorMsg.NO_SUITABLE_WRITER_FOR_MIMETYPE + mimeType:
			NO_SUITABLE_WRITER_FOR_FILEEXT + fileExt;
		Kekule.raise(msg);
		return null;
	}
	*/
};

})();
