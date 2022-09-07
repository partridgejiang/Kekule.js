/**
 * @fileoverview
 * Some common dialogs used by other chem widgets.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /xbrowsers/kekule.x.js
 * requires /render/kekule.render.configs.js
 * requires /widgets/operation/kekule.actions.js
 * requires /widgets/kekule.widget.base.js
 * requires /widgets/kekule.widget.helpers.js
 * requires /widgets/kekule.widget.styleResources.js
 * requires /widgets/commonCtrls/kekule.widget.buttons.js
 * requires /widgets/commonCtrls/kekule.widget.dialogs.js
 * requires /widgets/commonCtrls/kekule.widget.formControls.js
 * requires /widgets/advCtrls/kekule.widget.textEditors.js
 * requires /widgets/chem/kekule.chemWidget.base.js
 */

(function(){
"use strict";

var PS = Class.PropertyScope;
var CW = Kekule.ChemWidget;
var CNS = Kekule.Widget.HtmlClassNames;
var CCNS = Kekule.ChemWidget.HtmlClassNames;
//var CWT = Kekule.ChemWidgetTexts;

Kekule.ChemWidget.HtmlClassNames = Object.extend(Kekule.ChemWidget.HtmlClassNames, {
	DIALOG_LOADDATA: 'K-Chem-Dialog-LoadData',
	DIALOG_LOADDATA_FORMATBOX: 'K-Chem-Dialog-LoadData-FormatBox',
	DIALOG_LOADDATA_SRCEDITOR_REGION: 'K-Chem-Dialog-LoadData-SrcEditorRegion',
	DIALOG_LOADDATA_SRCEDITOR: 'K-Chem-Dialog-LoadData-SrcEditor',
	DIALOG_LOADDATA_BTN_LOADFROMFILE: 'K-Chem-Dialog-LoadData-Btn-LoadFromFile',
	DIALOG_LOADAPPENDDATA: 'K-Chem-Dialog-LoadAppendData',
	DIALOG_LOADAPPENDDATA_APPENDCHECKBOX: 'K-Chem-Dialog-LoadAppendData-AppendCheckBox'
});

/**
 * A dialog to load chem object from external file or user input data.
 * @class
 * @augments Kekule.Widget.Dialog
 *
 * @property {Kekule.ChemObject} chemObj Loaded chem object.
 * @property {Hash} dataDetails Loaded data details, including fields: {data, fileName, mimeType, formatId}.
 * @property {Array} allowedFormatIds
 */
Kekule.ChemWidget.LoadDataDialog = Class.create(Kekule.Widget.Dialog,
/** @lends Kekule.ChemWidget.LoadDataDialog# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.LoadDataDialog',
	/** @constructs */
	initialize: function(/*$super, */parentOrElementOrDocument, caption, buttons)
	{
		this._openFileAction = new Kekule.ActionLoadFileData(); //new Kekule.ActionFileOpen();
		this._openFileAction.setBinaryDetector(this._detectBinaryFormat);
		this._openFileAction.update();
		//this._openFileAction.addEventListener('open', this.reactFileLoad, this);
		this._openFileAction.addEventListener('load', this.reactFileLoad, this);
		this._sBtnLoadFromFile = Kekule.$L('ChemWidgetTexts.CAPTION_LOADDATA_FROM_FILE'); //CWT.CAPTION_LOADDATA_FROM_FILE
		this._formatItems = null;

		this.tryApplySuper('initialize', [parentOrElementOrDocument, caption || /*CWT.CAPTION_LOADDATA*/ Kekule.$L('ChemWidgetTexts.CAPTION_LOADDATA_DIALOG'),
			buttons || [Kekule.Widget.DialogButtons.OK, Kekule.Widget.DialogButtons.CANCEL]])  /* $super(parentOrElementOrDocument, caption || \*CWT.CAPTION_LOADDATA*\ Kekule.$L('ChemWidgetTexts.CAPTION_LOADDATA_DIALOG'),
			buttons || [Kekule.Widget.DialogButtons.OK, Kekule.Widget.DialogButtons.CANCEL]) */;

		if (this.setResizable)
			this.setResizable(true);
	},
	/** @ignore */
	finalize: function(/*$super*/)
	{
		this._openFileAction.finalize();
		this.tryApplySuper('finalize')  /* $super() */;
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('chemObj', {'dataType': 'Kekule.ChemObject', 'serializable': false, 'setter': null,
			'getter': function()
			{
				var details = this.getDataDetails();
				if (details && details.data)
				{
					return Kekule.IO.loadTypedData(details.data, details.mimeType, details.fileName);
				}
				else
					return null;
			}
		});
		this.defineProp('allowedFormatIds', {'dataType': DataType.ARRAY,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('allowedFormatIds', value);
				this.updateFormatItems();
			}
		});
		//this.defineProp('fileFilters', {'dataType': DataType.ARRAY});
		this.defineProp('defaultFormatId', {'dataType': DataType.STRING,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('defaultFormatId', value);
				this.updateFormatItems();
			}
		});
		this.defineProp('dataDetails', {'dataType': DataType.HASH, 'setter': null, 'serializable': false});
	},
	/** @ignore */
	initPropValues: function(/*$super*/)
	{
		this.tryApplySuper('initPropValues')  /* $super() */;
		this.setAutoAdjustSizeOnPopup(true);
		//this.setButtons([Kekule.Widget.DialogButtons.OK, Kekule.Widget.DialogButtons.CANCEL]);
	},

	/** @ignore */
	doGetWidgetClassName: function(/*$super*/)
	{
		return this.tryApplySuper('doGetWidgetClassName')  /* $super() */ + ' ' + CCNS.DIALOG_LOADDATA;
	},
	/** @ignore */
	doCreateClientContents: function(/*$super, */clientElem)
	{
		this.tryApplySuper('doCreateClientContents')  /* $super() */;
		var doc = this.getDocument();
		// label
		var elem = doc.createElement('div');
		elem.innerHTML = Kekule.$L('ChemWidgetTexts.CAPTION_DATA_FORMAT'); //CWT.CAPTION_DATA_FORMAT;
		clientElem.appendChild(elem);
		// format selector
		elem = doc.createElement('div');
		clientElem.appendChild(elem);
		var formatSelector = new Kekule.Widget.SelectBox(this);
		formatSelector.addClassName(CCNS.DIALOG_LOADDATA_FORMATBOX);
		formatSelector.appendToElem(elem);
		this._formatSelector = formatSelector;
		// fill format selector
		//var readerInfos = this.getAvailableReaderInfos();
		//var formatItems = this.getFormatSelectorItems(/*readerInfos*/);
		//formatSelector.setItems(formatItems);
		this.updateFormatItems();
		// label
		var elem = doc.createElement('div');
		elem.innerHTML = Kekule.$L('ChemWidgetTexts.CAPTION_DATA_SRC'); //CWT.CAPTION_DATA_SRC;
		clientElem.appendChild(elem);
		// preview textarea
		elem = doc.createElement('div');
		elem.className = CCNS.DIALOG_LOADDATA_SRCEDITOR_REGION;
		clientElem.appendChild(elem);
		var dataEditor = new Kekule.Widget.TextEditor(this); //new Kekule.Widget.TextArea(result);
		dataEditor.setWrap('off').setAutoWrapThreshold(true).setFileDroppable(true);  // enable file drop in editor
		dataEditor.setToolbarPos(Kekule.Widget.Position.BOTTOM);
		dataEditor.addClassName(CCNS.DIALOG_LOADDATA_SRCEDITOR);
		dataEditor.appendToElem(elem);
		this._dataEditor = dataEditor;
	},

	/* @private */
	/*
	getAvailableReaderInfos: function()
	{
		return Kekule.IO.ChemDataReaderManager.getAvailableReaderInfos();
	},
	*/
	/** @private */
	getFormatSelectorItems: function(readerInfos)
	{
		var result = [];
		//var formatIds = [];
		var formatIds = this.getAllowedFormatIds() || Kekule.IO.ChemDataReaderManager.getAllReadableFormatIds();
		//console.log(formatIds);
		var defFormatId = this.getDefaultFormatId();

		/*
		for (var i = 0, l = readerInfos.length; i < l; ++i)
		{
			var info = readerInfos[i];
			Kekule.ArrayUtils.pushUnique(formatIds, info.formatId);
		}
		*/

		for (var i = 0, l = formatIds.length; i < l; ++i)
		{
			var idInfo = Kekule.IO.DataFormatsManager.getFormatInfo(formatIds[i]);
			if (idInfo)
			{
				var fileExts = Kekule.ArrayUtils.clone(Kekule.ArrayUtils.toArray(idInfo.fileExts));
				for (var j = 0, k = fileExts.length; j < k; ++j)
				{
					fileExts[j] = '*.' + fileExts[j];
				}
				var sFileExt = fileExts.join(', ');
				var text = idInfo.title;
				/*
				 if (idInfo.mimeType)
				 text += ' | ' + idInfo.mimeType;
				 */
				if (sFileExt)
					text += ' (' + sFileExt + ')';
				var selected = defFormatId && defFormatId === idInfo.id;
				result.push({
					'value': idInfo.id,
					'formatId': idInfo.id,
					'text': text,
					'title': idInfo.mimeType,
					'data': idInfo,
					'selected': selected
				});
			}
		}
		result.sort(function(a, b)
			{
				return (a.text < b.text)? -1:
					(a.text > b.text)? 1:
						0;
			}
		);
		return result;
	},
	/** @private */
	getFileFilters: function(formatItems)
	{
		var result = [];
		for (var i = 0, l = formatItems.length; i < l; ++i)
		{
			var format = formatItems[i];
			var info = format.data;
			var title = format.text || format.title || format.value;
			var exts = Kekule.ArrayUtils.toArray(info.fileExts);
			/*
			for (var j = 0, k = exts.length; j < k; ++j)
			{
				result.push({'title': title, 'filter': '.' + exts[j]});
			}
			*/
			result.push({'title': title, 'filter': '.' + exts.join(',.')});
		}
		// add all and any filter
		result.push(Kekule.NativeServices.FILTER_ALL_SUPPORT);
		result.push(Kekule.NativeServices.FILTER_ANY);
		//console.log(result);
		return result;
	},
	/** @private */
	updateFormatItems: function()
	{
		this._formatItems = this.getFormatSelectorItems();
		this._formatSelector.setItems(this._formatItems);
		var filters = this.getFileFilters(this._formatItems);
		this._openFileAction.setFilters(filters);
	},

	/** @ignore */
	doSetButtons: function(/*$super, */value)
	{
		var buttons = value || [];
		if (buttons.indexOf(this._sBtnLoadFromFile) < 0)
		{
			buttons.unshift(this._sBtnLoadFromFile);
		}
		this.tryApplySuper('doSetButtons', [buttons])  /* $super(buttons) */;

		var btnOpenFile = this.getDialogButton(this._sBtnLoadFromFile);
		btnOpenFile.setAction(this._openFileAction);
		btnOpenFile.linkStyleResource(Kekule.Widget.StyleResourceNames.BUTTON_LOAD_FILE);
		btnOpenFile.addClassName(CCNS.DIALOG_LOADDATA_BTN_LOADFROMFILE);
		btnOpenFile.setEnabled(this._openFileAction.getEnabled());
	},

	/** @private */
	reactFileLoad: function(e)
	{
		/*
		var files = e.files;
		if (files && files.length)
		{
			var file = files[0];
			//this.getDisplayer().loadFromFile(file);
			var self = this;
			var dialogResult = null;
			try
			{
				Kekule.IO.loadFileData(file, function(chemObj, success)
					{
						if (success)
						{
							self.setPropStoreFieldValue('chemObj', chemObj);
							dialogResult = Kekule.Widget.DialogButtons.OK;
						}
						self.close(dialogResult);
					}
				);
			}
			catch(err)
			{
				Kekule.raise(err, Kekule.ExceptionLevel.ERROR);
			}
		}
		*/
		var data = e.data;
		var fileName = e.fileName;
		var chemObj;
		try
		{
			if (e.success && Kekule.ObjUtils.notUnset(data) && fileName)
			{
				//console.log('load', data);
				/*
				chemObj = Kekule.IO.loadTypedData(data, null, fileName);
				this.setPropStoreFieldValue('chemObj', chemObj);
				*/
				this.setPropStoreFieldValue('dataDetails', {'data': data, 'fileName': fileName});
				var dialogResult = Kekule.Widget.DialogButtons.OK;
				this.close(dialogResult);
			}
			else
				chemObj = null;
		}
		catch(err)
		{
			Kekule.error(err);
		}
	},

	/** @ignore */
	open: function(/*$super, */callback, caller, showType)
	{
		//this.setPropStoreFieldValue('chemObj', null);
		this.setPropStoreFieldValue('dataDetails', {});
		return this.tryApplySuper('open', [callback, caller, showType])  /* $super(callback, caller, showType) */;
	},
	/** @ignore */
	close: function(/*$super, */result)
	{
		var dataDetails = this.getDataDetails();
		if (!dataDetails || (!dataDetails.data && !dataDetails.fileName))  // not closed by child file dialog
		{  // feed dataDetails before closing
			if (this.isPositiveResult(result))
			{
				var data = this._dataEditor.getValue();
				//var mimeType = this._formatSelector.getValue();
				var formatData = this._formatSelector.getSelectedItemData();
				var formatId = formatData.id;
				var mimeType = formatData.mimeType;
				try
				{
					/*
					var chemObj = Kekule.IO.loadTypedData(data, mimeType);
					if (chemObj)
						this.setPropStoreFieldValue('chemObj', chemObj);
					else
						Kekule.error(Kekule.$L('ErrorMsg.LOAD_CHEMDATA_FAILED'));
					*/
					this.setPropStoreFieldValue('dataDetails', {'data': data, 'mimeType': mimeType, 'formatId': formatId});
				}
				catch(e)
				{
					Kekule.raise(e, Kekule.ExceptionLevel.ERROR);
				}
			}
		}
		return this.tryApplySuper('close', [result])  /* $super(result) */;
	},

	/**
	 * A custom method returns whether a file is in binary format.
	 * @private
	 */
	_detectBinaryFormat: function(fileName, file)
	{
		if (file && fileName)
		{
			var ext = Kekule.UrlUtils.extractFileExt(fileName);
			var formatInfo = Kekule.IO.DataFormatsManager.findFormat(null, ext);
			if (formatInfo)
			{
				var isBinary = Kekule.IO.ChemDataType.isBinaryType(formatInfo.dataType);
				return isBinary;
			}
		}
		return false;
	}
});


/**
 * A dialog to load or append new chem object from external file or user input data.
 * @class
 * @augments Kekule.ChemWidget.LoadDataDialog
 *
 * @property {Bool} displayAppendCheckBox Whether show append check box in dialog.
 * @property {Bool} isAppending Whether the append check box is checked
 */
Kekule.ChemWidget.LoadOrAppendDataDialog = Class.create(Kekule.ChemWidget.LoadDataDialog,
/** @lends Kekule.ChemWidget.LoadOrAppendDataDialog# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.LoadOrAppendDataDialog',
	/** @construct */
	initialize: function(/*$super, */parentOrElementOrDocument, caption, buttons)
	{
		this._appendCheckBox = null;
		this.tryApplySuper('initialize', [parentOrElementOrDocument, caption, buttons])  /* $super(parentOrElementOrDocument, caption, buttons) */;
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('displayAppendCheckBox', {'dataType': DataType.BOOL});
		this.defineProp('isAppending', {'dataType': DataType.BOOL, 'serializable': false,
			'getter': function() { return this._appendCheckBox && this._appendCheckBox.getChecked(); },
			'setter': function(value) { if (this._appendCheckBox) this._appendCheckBox.setChecked(!!value); }
		});
	},
	/** @ignore */
	doGetWidgetClassName: function(/*$super*/)
	{
		return this.tryApplySuper('doGetWidgetClassName')  /* $super() */ + ' ' + CCNS.DIALOG_LOADAPPENDDATA;
	},
	/** @ignore */
	doCreateClientContents: function(/*$super, */clientElem)
	{
		this.tryApplySuper('doCreateClientContents', [clientElem])  /* $super(clientElem) */;
		var doc = this.getDocument();
		// append check box
		var appendCheckBox = new Kekule.Widget.CheckBox(this);
		appendCheckBox.addClassName(CCNS.DIALOG_LOADAPPENDDATA_APPENDCHECKBOX);
		appendCheckBox.setText(Kekule.$L('ChemWidgetTexts.CAPTION_LOADDATA_DIALOG_APPENDMODE'));
		appendCheckBox.appendToElem(clientElem);
		appendCheckBox.setDisplayed(this.getDisplayAppendCheckBox());
		this._appendCheckBox = appendCheckBox;
	},
	/** @ignore */
	open: function(/*$super, */callback, caller, showType)
	{
		this.setIsAppending(false);  // always auto uncheck append
		this._appendCheckBox.setDisplayed(this.getDisplayAppendCheckBox());
		return this.tryApplySuper('open', [callback, caller, showType])  /* $super(callback, caller, showType) */;
	}
});


})();