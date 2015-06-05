/**
 * @fileoverview
 * Implementation of native services (e.g., file picker dialog) using XPCOM objects.
 * @author Partridge Jiang
 */

var {Cc, Ci, Cr, Cu} = require("chrome");
var { viewFor } = require("sdk/view/core");
var windows = require("sdk/windows").browserWindows;
var fileIO = require("sdk/io/file");
var textStream = require("sdk/io/text-streams");

/**
 * Implementation of native services (e.g., file picker dialog) using XPCOM objects.
 * @object
 */
XpComNativeServiceImpl = {
	/**
	 * Open a file picker dialog.
	 * @param {Func} callback Callback(result, file, files).
	 * @param {Hash} options Additional options hash, can include:
	 *   {
	 *     mode: String, dialog mode, default is 'open'.
	 *     initialFileName: String,
	 *     filters: Array of filters of dialog, each item is a hash {title, filter},
	 *       e.g. {title: 'Mol2000 file', filter: '.mol'}.
	 *     multiple: Bool, whether multi select is allowed.
	 *   }
	 */
	openFilePicker: function(callback, options)
	{
		if (!options)
			options = {};
		var domWin = viewFor(windows.activeWindow);
		var nsIFilePicker = Ci.nsIFilePicker;
		var fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
		var mode = (options.mode === 'save')? nsIFilePicker.modeSave:
			options.multiple? nsIFilePicker.modeOpenMultiple:
				nsIFilePicker.modeOpen;
		fp.init(domWin, null, mode);

		// filters
		var filterExtsToNsFilterExts = function(fileExts)
		{
			var exts = fileExts.split(',');
			var s = '*' + exts.join(';*');
			return s;
		};

		var filters = options.filters || [];
		var nsFilterItems = [];
		var allFilterExts = [];
		var hasAllFilter, hasAnyFilter;
		//console.log('filters', filters);
		if (filters.length)
		{
			for (var i = 0, l = filters.length; i < l; ++i)
			{
				var item = filters[i];
				//fp.appendFilter(item.title, '*' + item.filter);
				if (item === 'all')
					hasAllFilter = true;
				else if (item === 'any')
					hasAnyFilter = true;
				else  // normal file extension filters
				{
					nsFilterItems.push({'title': item.title, 'filter': item.filter});
					allFilterExts = allFilterExts.concat(item.filter.split(','));
				}
			}
		}
		// handle special filters
		if (hasAllFilter)
			nsFilterItems.unshift({'title': 'All supported', 'filter': allFilterExts.join(',')});

		// add filter to nsIFilePicker
		for (var i = 0, l = nsFilterItems.length; i < l; ++i)
		{
			var item = nsFilterItems[i];
			fp.appendFilter(item.title, filterExtsToNsFilterExts(item.filter));
		}

		if (hasAnyFilter)
			fp.appendFilters(nsIFilePicker.filterAll);

		// default file
		if (options.initialFileName)
			fp.defaultString = options.initialFileName;

		var res = fp.show();
		var success = (res === nsIFilePicker.returnOK) || (res === nsIFilePicker.returnReplace);
		callback(success, fp.file, fp.files);
		return res;
	},

	/**
	 * Open a file picker dialog to select a file, then load data from it.
	 * @param {Func} callback Callback(result, data, filePath, file ).
	 * @param {Hash} options Additional options hash, can include:
	 *   {
	 *     mode: String, dialog mode, default is 'open'.
	 *     initialFileName: String,
	 *     filters: Array of filters of dialog, each item is a hash {title, filter},
	 *       e.g. {title: 'Mol2000 file', filter: '.mol'}.
	 *   }
	 */
	loadFileData: function(callback, options)
	{
		var ops = Object.create(options);
		ops.mode = 'open';
		ops.multiple = false;
		var done = function(success, file, files)
		{
			if (success)
			{
				//try
				{
					var path = file.path;
					var data = fileIO.read(path);
					return callback(success, data, path, file);
				}
				//catch(e)
				{

				}

			}
			else
				return callback(false, null, null, null);
		};
		return XpComNativeServiceImpl.openFilePicker(done, ops);
	},

	/**
	 * Open a file picker dialog to select a file, then save data to it (currently only support text data).
	 * @param {String} data
	 * @param {Func} callback Callback(result, data, filePath, file).
	 * @param {Hash} options Additional options hash, can include:
	 *   {
	 *     mode: String, dialog mode, default is 'save'.
	 *     initialFileName: String,
	 *     filters: Array of filters of dialog, each item is a hash {title, filter},
	 *       e.g. {title: 'Mol2000 file', filter: '.mol'}.
	 *   }
	 */
	saveFileData: function(data, callback, options)
	{
		var ops = Object.create(options);
		ops.mode = 'save';
		ops.multiple = false;
		var done = function(success, file, files)
		{
			if (success)
			{
				var path = file.path;
				var textWriter = fileIO.open(path, 'w');
				if (!textWriter.closed)
				{
					textWriter.write(data);
					textWriter.close();
				}
				return callback(success, data, path, file);
			}
			else
				return callback(false, null, null, null);
		};
		return XpComNativeServiceImpl.openFilePicker(done, ops);
	}
};

exports.openFilePicker = XpComNativeServiceImpl.openFilePicker;
exports.loadFileData = XpComNativeServiceImpl.loadFileData;
exports.saveFileData = XpComNativeServiceImpl.saveFileData;