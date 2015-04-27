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
	DIALOG_LOADDATA_SRCEDITOR: 'K-Chem-Dialog-LoadData-SrcEditor',
	DIALOG_LOADDATA_BTN_LOADFROMFILE: 'K-Chem-Dialog-LoadData-Btn-LoadFromFile'
});

/**
 * A dialog to load chem object from external file or user input data.
 * @class
 * @augments Kekule.Widget.Dialog
 *
 * @property {Kekule.ChemObject} chemObj Loaded chem object.
 */
Kekule.ChemWidget.LoadDataDialog = Class.create(Kekule.Widget.Dialog,
/** @lends Kekule.ChemWidget.LoadDataDialog# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.LoadDataDialog',
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument, caption, buttons)
	{
		this._openFileAction = new Kekule.ActionFileOpen();
		this._openFileAction.update();
		this._openFileAction.addEventListener('open', this.reactFileLoad, this);
		this._sBtnLoadFromFile = Kekule.$L('ChemWidgetTexts.CAPTION_LOADDATA_FROM_FILE'); //CWT.CAPTION_LOADDATA_FROM_FILE

		$super(parentOrElementOrDocument, caption || /*CWT.CAPTION_LOADDATA*/ Kekule.$L('ChemWidgetTexts.CAPTION_LOADDATA'),
			buttons || [Kekule.Widget.DialogButtons.OK, Kekule.Widget.DialogButtons.CANCEL]);
	},
	/** @ignore */
	finalize: function($super)
	{
		this._openFileAction.finalize();
		$super();
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('chemObj', {'dataType': 'Kekule.ChemObject', 'serializable': false, 'setter': null});
	},
	/** @ignore */
	initPropValues: function($super)
	{
		$super();
		//this.setButtons([Kekule.Widget.DialogButtons.OK, Kekule.Widget.DialogButtons.CANCEL]);
	},

	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CCNS.DIALOG_LOADDATA;
	},
	/** @ignore */
	doCreateClientContents: function($super, clientElem)
	{
		$super();
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
		var readerInfos = this.getAvailableReaderInfos();
		var formatItems = this.getFormatSelectorItems(readerInfos);
		formatSelector.setItems(formatItems);
		// label
		var elem = doc.createElement('div');
		elem.innerHTML = Kekule.$L('ChemWidgetTexts.CAPTION_DATA_SRC'); //CWT.CAPTION_DATA_SRC;
		clientElem.appendChild(elem);
		// preview textarea
		elem = doc.createElement('div');
		clientElem.appendChild(elem);
		var dataEditor = new Kekule.Widget.TextEditor(this); //new Kekule.Widget.TextArea(result);
		dataEditor.setWrap('off');
		dataEditor.setToolbarPos(Kekule.Widget.Position.BOTTOM);
		dataEditor.addClassName(CCNS.DIALOG_LOADDATA_SRCEDITOR);
		dataEditor.appendToElem(elem);
		this._dataEditor = dataEditor;
	},

	/** @private */
	getAvailableReaderInfos: function()
	{
		return Kekule.IO.ChemDataReaderManager.getAvailableReaderInfos();
	},
	/** @private */
	getFormatSelectorItems: function(readerInfos)
	{
		var result = [];
		var formatIds = [];

		for (var i = 0, l = readerInfos.length; i < l; ++i)
		{
			var info = readerInfos[i];
			Kekule.ArrayUtils.pushUnique(formatIds, info.formatId);
		}

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
				result.push({
					'value': idInfo.mimeType, //idInfo.id,
					'text': text,
					'title': idInfo.mimeType,
					'data': idInfo
					//'selected': selected
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

	/** @ignore */
	doSetButtons: function($super, value)
	{
		var buttons = value || [];
		if (buttons.indexOf(this._sBtnLoadFromFile) < 0)
		{
			buttons.unshift(this._sBtnLoadFromFile);
		}
		$super(buttons);

		var btnOpenFile = this.getDialogButton(this._sBtnLoadFromFile);
		btnOpenFile.setAction(this._openFileAction);
		btnOpenFile.linkStyleResource(Kekule.Widget.StyleResourceNames.BUTTON_LOAD_FILE);
		btnOpenFile.addClassName(CCNS.DIALOG_LOADDATA_BTN_LOADFROMFILE);
		btnOpenFile.setEnabled(this._openFileAction.getEnabled());
	},

	/** @private */
	reactFileLoad: function(e)
	{
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
			catch(e)
			{
				Kekule.raise(e, Kekule.ExceptionLevel.ERROR);
			}
		}
	},

	/** @ignore */
	open: function($super, callback, caller, showType)
	{
		this.setPropStoreFieldValue('chemObj', null);
		return $super(callback, caller, showType);
	},
	/** @ignore */
	close: function($super, result)
	{
		if (!this.getChemObj())  // chemObj not load by file, need to analysis direct input data
		{
			if (this.isPositiveResult(result))
			{
				var data = this._dataEditor.getValue();
				var mimeType = this._formatSelector.getValue();
				try
				{
					var chemObj = Kekule.IO.loadTypedData(data, mimeType);
					if (chemObj)
						this.setPropStoreFieldValue('chemObj', chemObj);
					else
						Kekule.error(/*Kekule.ErrorMsg.LOAD_CHEMDATA_FAILED*/Kekule.$L('ErrorMsg.LOAD_CHEMDATA_FAILED'));
				}
				catch(e)
				{
					Kekule.raise(e, Kekule.ExceptionLevel.ERROR);
				}
			}
		}
		return $super(result);
	}
});

})();