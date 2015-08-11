/**
 * @fileoverview
 * Classes and functions related with native services (e.g., file picker dialog).
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /widget/kekule.widget.base.js
 * requires /xbrowsers/kekule.x.js
 */

(function(){
"use strict";

/**
 * The class to call native services (e.g., open file picker dialog).
 * @object
 */
Kekule.NativeServices = {
	/**
	 * Mode const to launch a open file dialog.
	 * @const
	 */
	MODE_OPEN: 'open',
	/**
	 * Mode const to launch a save file dialog.
	 * @const
	 */
	MODE_SAVE: 'save',
	/**
	 * A special file filter that list all file extension set.
	 * @const
	 */
	FILTER_ALL_SUPPORT: 'all',
	/**
	 * A special file filter that list any type of file.
	 * @const
	 */
	FILTER_ANY: 'any',
	/**
	 * Open a file picker dialog.
	 * @param {HTMLDocument} doc Current document.
	 * @param {Func} callback Callback function when dialog is closed, with params (result, file, files).
	 *   If the dialog closed with "OK" button, result should be true and selected file instance(s) will
	 *   be filled in file and files object.
	 * @param {Hash} options Additional options hash, can include:
	 *   {
	 *     mode: String, dialog mode, default is 'open'.
	 *     initialFileName: String,
	 *     filters: Array of filters of dialog, each item is a hash {title, filter},
	 *       e.g. {title: 'Mol2000 file', filter: '.mol'}.
	 *       filter file extension can be a string delimitered by ',', e.g., '.mol,.rd'
	 *     multiple: Bool, whether multi select is allowed.
	 *   }
	 */
	showFilePickerDialog: function(doc, callback, options)
	{
		if (Kekule.NativeServices.doShowFilePickerDialog)
			return Kekule.NativeServices.doShowFilePickerDialog(doc, callback, options);
	},
	/**
	 * Returns whether current service can load data from file.
	 * @param {HTMLDocument} doc
	 * @returns {Bool}
	 */
	canLoadFileData: function(doc)
	{
		return !!KNS.doLoadFileData || !!KNS.doShowFilePickerDialog;
	},
	/**
	 * Show an open file dialog and load data from a file.
	 * @param {HTMLDocument} doc Current document.
	 * @param {Func} callback Callback function when dialog is closed, with param (result, data, fileName).
	 *   If the dialog closed with "Cancel" button, result will be false and data/fileName will be null.
	 * @param {Hash} options Additional options hash, can include:
	 *   {
	 *     initialFileName: String,
	 *     filters: Array of filters of dialog, each item is a hash {title, filter},
	 *       e.g. {title: 'Mol2000 file', filter: '*.mol'}.
	 *     binaryDetector: Func(fileName, file)=>Bool, a function to detect whether current file is in binary mode.
	 *     If this function is not provided, the file will always be read in text mode.
	 *   }
	 */
	loadFileData: function(doc, callback, options)
	{
		if (Kekule.NativeServices.doLoadFileData)
			return Kekule.NativeServices.doLoadFileData(doc, callback, options);

		// else a default implementation using FileReader
		var ops = Object.create(options || {});
		ops.multiple = false;
		ops.mode = KNS.MODE_OPEN;
		var done = function(result, file, files)
		{
			if (!result || !file)  // dialog cancelled
			{
				callback(result, null, null);
			}
			else  // file selected
			{
				if (Kekule.BrowserFeature.fileapi)
				{
					var fileName = file.name;
					var isBinary = ops.binaryDetector && ops.binaryDetector(fileName, file);

					// try open it the file by FileReader
					var reader = new FileReader();
					reader.onload = function(e)
					{
						var content = reader.result;
						/*
						var info = chemObj.getSrcInfo();
						info.fileName = fileName;
						var success = !!chemObj;
						*/
						//console.log('load success', fileName, content);
						if (callback)
							callback(true, content, fileName);
					};
					reader.onerror = function()
					{
						if (callback)
							callback(false);
						Kekule.error(Kekule.$L('ErrorMsg.ERROR_LOADING_FILE' + fileName));
					}

					if (isBinary)
					//reader.readAsBinaryString(file);
						reader.readAsArrayBuffer(file);
					else
						reader.readAsText(file);
				}
				else
				{
					Kekule.error(/*Kekule.ErrorMsg.FILE_API_NOT_SUPPORTED*/Kekule.$L('ErrorMsg.FILE_API_NOT_SUPPORTED'));
				}
			}
		};
		// open file picker
		KNS.showFilePickerDialog(doc, done, ops);
	},
	/**
	 * Returns whether current service can save data to file.
	 * @param {HTMLDocument} doc
	 * @returns {Bool}
	 */
	canSaveFileData: function(doc)
	{
		return !!KNS.doSaveFileData;
	},
	/**
	 * Show an save file dialog and save data to a file.
	 * @param {HTMLDocument} doc Current document.
	 * @param {Variant} data to be saved
	 * @param {Func} callback Callback function when dialog is closed, with param (result, fileName).
	 *   If the dialog closed with "Cancel" button, result will be false and fileName will be null.
	 * @param {Hash} options Additional options hash, can include:
	 *   {
	 *     initialFileName: String,
	 *     filters: Array of filters of dialog, each item is a hash {title, filter},
	 *       e.g. {title: 'Mol2000 file', filter: '*.mol'}.
	 *     binary: Bool, whether the data is in binary format. Default is false.
	 *   }
	 */
	saveFileData: function(doc, data, callback, options)
	{
		if (Kekule.NativeServices.doSaveFileData)
			return Kekule.NativeServices.doSaveFileData(doc, data, callback, options);
	}
};
var KNS = Kekule.NativeServices;

/**
 * Default implementation of some native services functions based on HTML.
 * @object
 * @ignore
 */
Kekule.HtmlNativeServiceImpl = {
	/** @ignore */
	doShowFilePickerDialog: function(doc, callback, options)
	{
		//console.log('showFilePickerDialog', options);
		var elem = Kekule.HtmlNativeServiceImpl._createFileInputElem(doc, callback, options || {});
		elem.click();
	},
	/** @private */
	_createFileInputElem: function(doc, callback, options)
	{
		var result = doc.createElement('input');
		result.setAttribute('type', 'file');
		var ops = options || {};
		if (ops.multiple)
			result.setAttribute('multiple', 'multiple');
		if (ops.filters)
		{
			var filterValues = [];
			for (var i = 0, l = ops.filters.length; i < l; ++i)
			{
				var filterItem = ops.filters[i];
				if (filterItem === Kekule.NativeServices.FILTER_ALL_SUPPORT
					|| filterItem === Kekule.NativeServices.FILTER_ANY)   // these special filters need not to be handled in HTML
					continue;
				var sfilter = filterItem.filter;
				if (sfilter)
				{
					filterValues.push(sfilter);
				}
			}
			var sAllFilter = filterValues.join(',');
			result.setAttribute('accept', sAllFilter);
			//console.log(sFilter);
		}
		// IMPORTANT: some browser need this input file element visible to raise the open dialog
		// so we append it to document and "hidden" it
		var style = result.style;
		style.position = 'absolute';
		style.left = '-100000px';
		style.opacity = 0;

		doc.body.appendChild(result);
		//result.onchange = this.reactInputChangeBind;

		var reactChange = function(e)
		{
			var target = e.getTarget();
			var files = target.files;
			var firstFile = files && files[0];
			//console.log('file input change', target.files);
			if (callback)
				callback(true, firstFile, files);

			// dismiss input element
			Kekule.X.Event.removeListener(target, 'change', reactChange);
			target.ownerDocument.body.focus();
			if (target.parentNode)
			{
				//target.parentNode.removeChild(target);
			}
		};

		Kekule.X.Event.addListener(result, 'change', reactChange/*this.reactInputChangeBind*/);
		return result;
	},

	/** @ignore */
	doSaveFileData: function(doc, data, callback, options)
	{
		var fileName = options.initialFileName || null;
		//if (Kekule.BrowserFeature.downloadHref)
		{
			var dataElem = Kekule.HtmlNativeServiceImpl._createDataElem(doc, data, fileName);
			dataElem.click();  // save file dialog
			dataElem.parentNode.removeChild(dataElem);
		}
		/*
		else // IE, use execCommand to save
		{
			Kekule.HtmlNativeServiceImpl.doSaveFileDataIe(doc, data, fileName);
		}
		*/
		if (callback)
			callback(null, null);  // can not determine the final file name and result.
	},
	/** @private */
	_createDataElem: function(doc, data, fileName)
	{
		var elem = doc.createElement('a');
		var sHref= 'data:application/octet-stream,' + encodeURIComponent(data);
		elem.setAttribute('href', sHref);
		elem.setAttribute('download', fileName || '');
		//elem.innerHTML = 'dasdsdsadasds';
		//window.open(sHref);

		var style = elem.style;
		elem.position = 'absolute';
		elem.left = '-100000px';
		elem.opacity = 0;

		doc.body.appendChild(elem);
		return elem;
	},
	doSaveFileDataIe: function(doc, data, callback, options)
	{
		var fileName = options.initialFileName || null;
		//console.log('save ie');
		if (Kekule.BrowserFeature.blob && window.navigator.msSaveOrOpenBlob)  // IE 10 and above, use blob to save
		{
			var blobObject = new Blob([data]);
			window.navigator.msSaveBlob(blobObject, fileName);
		}
		else
		{
			// data must be string
			var iframeElem = Kekule.HtmlNativeServiceImpl._createAndExecDataIframe(doc, data, fileName);
			// after save remove iframe
			iframeElem.parentNode.removeChild(iframeElem);
		}
		if (callback)
			callback(null, null);  // can not determine the final file name and result.
	},
	/** @private */
	_createAndExecDataIframe: function(doc, data, fileName)
	{
		//console.log('iframe save');
		var result = doc.createElement('iframe');
		//result.style.display = 'none';
		doc.body.appendChild(result);
		var iframe = result.contentWindow || result.contentDocument;
		iframe.document.open("text/html", "replace");
		var s = data.toString();
		iframe.document.write(s);
		iframe.document.close();
		iframe.focus();
		iframe.document.execCommand('SaveAs', true, Kekule.UrlUtils.extractFileCoreName(fileName));  // extension IE don't know will supress the save dialog
		//iframe.document.execCommand('SaveAs', true, fileName);
		return result;
	}
};

// register
if (Kekule.BrowserFeature.fileapi)
	KNS.doShowFilePickerDialog = Kekule.HtmlNativeServiceImpl.doShowFilePickerDialog;
if (Kekule.Browser.IE || window.navigator.msSaveOrOpenBlob)
	KNS.doSaveFileData = Kekule.HtmlNativeServiceImpl.doSaveFileDataIe;
else if (Kekule.BrowserFeature.downloadHref)
	KNS.doSaveFileData = Kekule.HtmlNativeServiceImpl.doSaveFileData;

})();