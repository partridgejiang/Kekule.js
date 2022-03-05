YUI.add('moodle-atto_kekulechem-button', function (Y, NAME) {

// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/*
 * @package    atto_strike
 * @copyright  2013 Damyon Wiese  <damyon@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * @module moodle-atto_kekulechem-button
 */

var KC = Y.namespace('M.atto_kekulechem');


/**
 * Atto text editor strike plugin.
 *
 * @namespace M.atto_kekulechem
 * @class button
 * @extends M.editor_atto.EditorPlugin
 */
KC.Button = Y.Base.create('button', Y.M.editor_atto.EditorPlugin, [], {
	BTN_NAME_OBJ_INSERT: 'kekuleChemObjInsert',
	BTN_NAME_SPECTRUM_INSERT: 'kekuleSpectrumObjInsert',
	CHEM_OBJ_INSERTER_CLASS: 'KekuleChemObjInserter',
	CHEM_OBJ_VIEWER_CLASS: 'KekuleChemObjViewer',
	SPECTRUM_INSPECTOR_CLASS: 'KekuleSpectrumInspector',
	CHEM_OBJ_TAGNAME: 'img',
	initializer: function() {
		this._preparingForSubmit = false;  // a flag

		//console.log(this.get('host'));

		// ChemObjInserter button
		var iconUrl = this.get('attoKekulePluginPath') + 'pix/icon.png';  // M.cfg.wwwroot
		//console.log('iconUrl', iconUrl);
		this.addButton({
			buttonName: this.BTN_NAME_OBJ_INSERT,
			title: 'captionKekuleChemObj',
			//iconurl: iconUrl,
			icon: 'icons/kekulechem',
			iconComponent: 'atto_kekulechem',
			callback: this._executeChemObjInserter
		});
		// SpectrumObjInserter button
		var iconUrl = this.get('attoKekulePluginPath') + 'pix/spctrumInsertIcon.png';  // TODO: need to prepare this png
		this.addButton({
			buttonName: this.BTN_NAME_SPECTRUM_INSERT,
			title: 'captionKekuleSpectrum',
			icon: 'icons/kekulespectrum',
			iconComponent: 'atto_kekulechem',
			callback: this._executeSpectrumObjInserter
		});


		// add essential CSS
		this._addEssentialFiles();

		var editor = this.get('host');

		var self = this;
		var form = editor.textarea.getDOMNode().form;

		/* When creating button, Kekule may not be ready */
		if (typeof(Kekule) !== 'undefined') {
			Kekule.X.domReady(function () {
				self._setEditorConfigs();
			});
			Kekule.X.domReady(function(){
				self._prepareForDisplay();
			});
			/*
			Kekule.X.Event.addListener(form, 'submit', function (e) {
				//if (e.getTarget() === form)
				self._prepareForSubmit();
				//console.log(e);
				//alert('Submit form');
				//e.preventDefault();
			});
			*/
		}
		else
		{
			//document.addEventListener('load', )
		}

		form.onsubmit = function()
		{
			self._prepareForSubmit();
		};

		//console.log('init', editor.textarea.value);

		editor.on('change', function(){
			self._prepareForDisplay();
		});

		/*
		Kekule.X.domReady(function(){
			self._prepareForDisplay();
		});
		*/
	},

	_setEditorConfigs: function()
	{
		// avoid student to input unwanted pseudo atoms
		if (Kekule.Editor.ChemSpaceEditorConfigs && Kekule.Editor.ChemSpaceEditorConfigs.getInstance)
		{
			var editorConfigs = Kekule.Editor.ChemSpaceEditorConfigs.getInstance();
			editorConfigs.getInteractionConfigs().setAllowUnknownAtomSymbol(false);
		}
	},

	_getPurifyHtml: function()
	{
		var s = this.get('purifyHtml');
		return Kekule.StrUtils.strToBool(s);
	},

	// utils methods
	_addEssentialFiles: function()
	{
		var cssKekule = this.get('kekuleCssUrl'); //M.util.get_string('kekuleCssUrl', 'atto_kekulechem');
		var cssKekuleMoodle = this.get('kekuleMoodleCssUrl');
		this._addCssUrl(cssKekule);
		this._addCssUrl(cssKekuleMoodle);
		//console.log('[ESSENTIALFILES]', cssKekule, cssKekuleMoodle);
	},
	_addCssUrl: function(url)
	{
		var elem = document.createElement('link');
		elem.setAttribute('rel', 'stylesheet');
		elem.setAttribute('type', 'text/css');
		elem.setAttribute('href', url);

		document.head.appendChild(elem);
		//console.log('add CSS', url);
	},

	_prepareForDisplay: function()
	{
		if (typeof(Kekule) === 'undefined')
			return;
		if (this._preparingForSubmit)
			return;
		if (!this._getPurifyHtml())  // purifier not used, no need to prepare
			return;  // replace all chemObjDataWrapper in content to img
		else
		{
			var rootElem = this._getEditorRootElem();
			var elems = rootElem.getElementsByTagName(KC.ChemObjDataWrapperUtils.CHEM_OBJ_WRAPPER_TAGNAME);
			//console.log('replace', elems);
			for (var i = elems.length - 1; i >= 0; --i)
			{
				var elem = elems[i];
				if (elem && Kekule.HtmlElementUtils.hasClass(elem, KC.ChemObjDataWrapperUtils.CHEM_OBJ_WRAPPER_CLASSNAME))  // is wrapper, replace
				{
					KC.ChemObjDataWrapperUtils.replaceDataWrappersWithImg(elem);
				}
			}
		}
	},
	_prepareForSubmit: function()
	{
		if (!this._getPurifyHtml())  // purifier not used, no need to prepare
		{
			return;
		}
		else
		{
			this._preparingForSubmit = true;
			try
			{
				//console.log('purify html');
				var rootElem = this._getEditorRootElem();
				var elems = rootElem.getElementsByTagName(this.CHEM_OBJ_TAGNAME);
				for (var i = elems.length - 1; i >= 0; --i)
				{
					var elem = elems[i];
					if (elem && Kekule.HtmlElementUtils.hasClass(elem, this.CHEM_OBJ_VIEWER_CLASS))  // is chem obj img, replace
					{
						//console.log('on elem', elem);
						KC.ChemObjDataWrapperUtils.replaceImgsWithDataWrapper(elem);
					}
				}
				this.markUpdated();
				//alert('purify done');
			}
			finally
			{
				var self = this;
				(function(){
					self._preparingForSubmit = false;
				}).defer();
			}
		}
	},

	// return currently selected chem viewer target Y node
	_getSelectedInserterTargetNode: function(elemClassName, elemWidgetTypeName)
	{
		var editor = this.get('host');
		var selNodes = editor.getSelectedNodes();
		var selRange = editor.getSelection()[0];
		var targets = [];
		var self = this;

		//console.log('selRange', selRange, 'nodes', selNodes);

		if (!selRange || selRange.collapsed)  // a collapsed selection, start/end at same point, actually no selection
		{
			return null;
		}

		selNodes.some(function (node) {
			var targetElem = null;
			var domNode = node.getDOMNode();
			if (domNode && domNode.tagName)  // dom Node is element
			{
				/*
				var ancestor = Kekule.DomUtils.getNearestAncestorByTagName(domNode, self.CHEM_OBJ_TAGNAME, true);
				if (ancestor && (ancestor.className || '').indexOf(self.CHEM_OBJ_VIEWER_CLASS) >= 0)
					targetElem = ancestor;
				*/
				//targetElem = self._getParentChemObjElement(domNode, self._getEditorRootElem());
				targetElem = self._getParentKekuleWidgetPlaceholderElement(domNode, self._getEditorRootElem(), elemClassName, elemWidgetTypeName);
			}

			if (targetElem)
			{
				targets.push(targetElem);
				if (targets.length > 1)  // more than one matched, exit
					return true;
			}
		});
		if (targets.length >= 1)  // just select one
			return targets[0];
		else
			return null;
	},
	_getSelectedChemObjTarget: function()
	{
		return this._getSelectedInserterTargetNode(this.CHEM_OBJ_VIEWER_CLASS, 'ChemWidget.Viewer');
	},
	_getSelectedSpectrumObjTarget: function()
	{
		return this._getSelectedInserterTargetNode(this.SPECTRUM_INSPECTOR_CLASS, 'ChemWidget.SpectrumInspector');
	},

	_getEditorRootElem: function()
	{
		return this.get('host').editor.getDOMNode();
	},
	_getParentKekuleWidgetPlaceholderElement: function(childElem, rootElem, elemClassName, elemWidgetTypeName)
	{
		if (Kekule.HtmlElementUtils.hasClass(childElem, elemClassName)) // has class tag
			return childElem;
		else if ((childElem.getAttribute('data-kekule-widget') || '').indexOf(elemWidgetTypeName) >= 0)
		{
			// some times class may be lost due to cut/paste operations, check data- attribute instead
			return childElem;
		}
		else if (childElem !== rootElem)
		{
			return this._getParentChemObjElement(childElem.parentNode, rootElem);
		}
		else
			return null;
	},
	_getParentChemObjElement: function(childElem, rootElem)
	{
		return this._getParentKekuleWidgetPlaceholderElement(childElem, rootElem, this.CHEM_OBJ_VIEWER_CLASS, 'ChemWidget.Viewer');
	},
	_getParentSpectrumObjElement: function(childElem, rootElem)
	{
		return this._getParentKekuleWidgetPlaceholderElement(childElem, rootElem, this.SPECTRUM_INSPECTOR_CLASS, 'ChemWidget.SpectrumInspector');
	},

	// open ChemObj importer
	_executeChemObjInserter: function()
	{
		var currSelElem = this._getSelectedChemObjTarget();
		if (currSelElem)
		{
			this._targetElem = currSelElem;
		}
		else
		{
			this._targetElem = null;
		}
		//var editor = this.get('host');
		//console.log('open chemObj inserter dialog');
		this._setEditorConfigs();
		this._openChemObjInserterDialog(currSelElem);
	},

	// open spectrum obj inserter
	_executeSpectrumObjInserter: function()
	{
		var currSelElem = this._getSelectedSpectrumObjTarget();
		if (currSelElem)
		{
			this._targetElem = currSelElem;
		}
		else
		{
			this._targetElem = null;
		}
		this._openSpectrumObjInserterDialog(currSelElem);
	},
	/*
	_openDialog: function()
	{
		var sCaption = this._targetElem?
				M.util.get_string('captionEditChemObj', 'atto_kekulechem'):
				M.util.get_string('captionAddChemObj', 'atto_kekulechem');
		//console.log(sCaption, this._targetElem);

		var dialogue = this.getDialogue({
				headerContent: sCaption,
				focusAfterHide: true,
				//focusOnShowSelector: SELECTORS.CAPTION,
				//width: DIALOGUE.WIDTH
				width: '650px'
		});
		// Set the dialogue content, and then show the dialogue.
		dialogue.set('bodyContent', this._getDialogueContent(this._addNew))
			.show();
		// create inserterWidget to dialog
		var inserterWidget;
		if (this._chemObjInserterYNode)
		{
			var elem = this._chemObjInserterYNode.getDOMNode();
			var inserterWidget = new Kekule.ChemWidget.ChemObjInserter(elem);
		}

		// if edit existing chem obj, import it to inserter
		if (this._targetElem && this._chemObjInserterYNode)
		{
			inserterWidget.importFromElem(this._targetElem);
		}
	},
	_getDialogueContent: function(addNew)
	{
		var sOk = M.util.get_string('ok', 'moodle');
		var sCancel = M.util.get_string('cancel', 'moodle');
		var coreHtml =
			'<div class="' + this.CHEM_OBJ_INSERTER_CLASS + '" style="width:600px;height:400px;position:relative" ' +
			'data-auto-size-export="true" data-resizable="true"' +
			'></div>' +
			'<div></div>';
	  var footerHtml = '<div class="mdl-align"><br />'
			+ '<button class="submit ok" type="button">' + sOk + '</button>'
			+ '<button class="cancel" type="button">' + sCancel + '</button>'
			+ '</div>';

		var html = coreHtml + footerHtml;
		var result = Y.Node.create(html);
		this._dialogContent = result;  // save dialog content to object
		this._chemObjInserterYNode = result.one('.' + this.CHEM_OBJ_INSERTER_CLASS);
		//console.log('inserter', this._chemObjInserterElem, result.one('.submit'));
		result.one('.submit').on('click', this._submitChemObj, this);
		result.one('.cancel').on('click', this._cancelChemObj, this);
		return result;
	},

	// event listener of dialog buttons
	_submitChemObj: function(e)
	{
		var yNode = this._chemObjInserterYNode;
		if (yNode)
		{
			var inserter = Kekule.Widget.getWidgetOnElem(yNode.getDOMNode());
			var details = inserter.getExportImgElemAttributes();
			// add viewer class flag to element
			if (!details['class'])
				details['class'] = '';
			details['class'] = ' ' + this.CHEM_OBJ_VIEWER_CLASS;

			if (!this._targetElem)  // add new, insert new chem obj
			{
				var htmlCode = this._generateElemHtmlCode(this.CHEM_OBJ_TAGNAME, null, details);
				//console.log(htmlCode);
				var editor = this.get('host');
				editor.insertContentAtFocusPoint(htmlCode);
			}
			else  // modify existing chem obj element
			{
				Kekule.DomUtils.setElemAttributes(this._targetElem, details);
			}
			this.markUpdated();
		}
		// Hide the dialogue.
		this.getDialogue({
			focusAfterHide: null
		}).hide();
	},
	_cancelChemObj: function(e)
	{
		// Hide the dialogue.
		this.getDialogue({
			focusAfterHide: null
		}).hide();
	}
	*/
	_openInserterDialog: function(targetElem, insertBtnName, dialog, objInserter, executeCallback)
	{
		var btnElem = null;
		var selfBtn = this.buttons[insertBtnName];
		if (selfBtn)
			btnElem = selfBtn.getDOMNode();
		//console.log(selfBtn, this.buttons);

		var self = this;
		dialog.openModal(function(dialogResult){
			if (dialogResult === Kekule.Widget.DialogButtons.OK)
			{
				//self._submitChemObj();
				executeCallback();
			}
		}, btnElem);

		//if (this._targetElem)
		if (targetElem)  // import from element (and set dimension of inserter after the inserter is actually be inserted into DOM)
		{
			//console.log('import from element', targetElem);
			//objInserter.importFromElem(this._targetElem);
			objInserter.importFromElem(targetElem);
		}
		else  // create new
		{
			objInserter.setChemObj(null);
		}

		//this._forceChemObjInserterResize.bind(this).delay();
		(function(){ objInserter.resized(); }).bind(this).delay();
		return dialog;
	},

	_openChemObjInserterDialog: function(targetElem)
	{
		if (!this._chemObjInserterDialog)
			this._chemObjInserterDialog = this._createChemObjInserterDialog();
		var dialog = this._chemObjInserterDialog;
		var sCaption = targetElem? // this._targetElem?
				M.util.get_string('captionEditChemObj', 'atto_kekulechem'):
				M.util.get_string('captionAddChemObj', 'atto_kekulechem');
		dialog.setCaption(sCaption);

		/*
		if (this._targetElem)
		{
			this._chemObjInserter.importFromElem(this._targetElem);
		}
		else  // create new
		{
			this._chemObjInserter.setChemObj(null);
		}

		var btnElem = null;
		var selfBtn = this.buttons[this.BTN_NAME_OBJ_INSERT];
		if (selfBtn)
			btnElem = selfBtn.getDOMNode();
		//console.log(selfBtn, this.buttons);

		var self = this;
		dialog.openModal(function(dialogResult){
			if (dialogResult === Kekule.Widget.DialogButtons.OK)
			{
				self._submitChemObj();
			}
		}, btnElem);

		this._forceChemObjInserterResize.bind(this).delay();
		return dialog;
		*/
		return this._openInserterDialog(targetElem, this.BTN_NAME_OBJ_INSERT, dialog,
			this._chemObjInserter, this._submitChemObj.bind(this, targetElem));
	},
	/*
	_forceChemObjInserterResize: function()
	{
		this._chemObjInserter.resized();  // hack, force recalculate inserter children pos
	},
	*/
	_openSpectrumObjInserterDialog: function(targetElem)
	{
		if (!this._spectrumObjInserterDialog)
			this._spectrumObjInserterDialog = this._createSpectrumObjInserterDialog();
		var dialog = this._spectrumObjInserterDialog;
		var sCaption = targetElem?  //this._targetElem?
			M.util.get_string('captionModifySpectrum', 'atto_kekulechem'):
			M.util.get_string('captionAddSpectrum', 'atto_kekulechem');
		dialog.setCaption(sCaption);
		return this._openInserterDialog(targetElem, this.BTN_NAME_SPECTRUM_INSERT, dialog, this._spectrumObjInserter,
			this._submitSpectrumObj.bind(this, targetElem));
	},
	_createDialogForInsert: function()
	{
		var result = new Kekule.Widget.Dialog(document);
		result.setButtons([Kekule.Widget.DialogButtons.OK, Kekule.Widget.DialogButtons.CANCEL]);
		var clientElem = result.getClientElem();
		clientElem.style.minWidth = '500px';
		clientElem.style.minHeight = '250px';
		/*
		result.setStyleProperty('minWidth', '500px');
		result.setStyleProperty('minHeight', '200px');
		*/
		return result;
	},
	_createChemObjInserterDialog: function()
	{
		var result = this._createDialogForInsert();
		var inserter = new Kekule.ChemWidget.ChemObjInserter(document);
		inserter.setResizable(true);

		var toolButtons = this._extractInserterToolButtons(this.get('chemObjInserterToolButtons'));
		//console.log('ChemObjInserter toolbuttons', toolButtons);
		if (toolButtons)
			inserter.setToolButtons(toolButtons);

		inserter.getViewer().setEditorProperties({
			'predefinedSetting': 'fullFunc',
			'commonToolButtons': null,
			'chemToolButtons': null,
			'allowCreateNewChild': true
		});

		inserter.setEnable3DStructureAutoGeneration(!!this.get('enableChemObjInserterAuto3DGeneration') || false);

		inserter.appendToWidget(result);
		this._chemObjInserter = inserter;
		return result;
	},
	_createSpectrumObjInserterDialog: function()
	{
		var result = this._createDialogForInsert();
		var inserter = new Kekule.ChemWidget.SpectrumObjInserter(document);
		inserter.setResizable(true);

		var toolButtons = this._extractInserterToolButtons(this.get('chemObjInserterToolButtons'));
		//console.log('SpectrumObjInserter toolbuttons', toolButtons);
		if (toolButtons)
			inserter.setToolButtons(toolButtons);

		inserter.appendToWidget(result);
		this._spectrumObjInserter = inserter;
		return result;
	},
	_extractInserterToolButtons: function(btnNameLines)
	{
		if (!btnNameLines)
			return null;
		var result = btnNameLines.split('\n');
		for (var i = 0, l = result.length; i < l; ++i)
		{
			result[i] = result[i].trim();
		}
		return result;
	},
	_submitChemObj: function(targetElem)
	{
		var self = this;
		var inserter = this._chemObjInserter;
		inserter.getExportImgElemAttributesAsync(null, null, function(details){
			// add viewer class flag to element
			if (!details['class'])
				details['class'] = '';
			details['class'] = ' ' + self.CHEM_OBJ_VIEWER_CLASS + ' K-Transparent-Background';

			var editor = self.get('host');
			editor.focus();   // IMPORTANT: must focus back to editor, otherwise insertion may failed in blured editor

			if (!targetElem)
			{
				var htmlCode = self._getNormalHtmlCode(details);
				editor.insertContentAtFocusPoint(htmlCode);
			}
			else  // modify existing chem obj element
			{
				Kekule.DomUtils.setElemAttributes(targetElem, details);
			}

			// debug
			//this._prepareForSubmit();

			self.markUpdated();
		});
	},
	_submitSpectrumObj: function(targetElem)
	{
		var self = this;
		var inserter = this._spectrumObjInserter;
		inserter.getExportImgElemAttributesAsync(null, null, function(details){
			// add viewer class flag to element
			if (!details['class'])
				details['class'] = '';
			details['class'] = ' ' + self.SPECTRUM_INSPECTOR_CLASS + ' K-Transparent-Background';

			//console.log('export detail', details);

			var editor = self.get('host');
			editor.focus();   // IMPORTANT: must focus back to editor, otherwise insertion may failed in blured editor

			//if (!self._targetElem)  // add new, insert new chem obj
			if (!targetElem)
			{
				var htmlCode = self._getNormalHtmlCode(details);
				editor.insertContentAtFocusPoint(htmlCode);
				//console.log('insert new HTML', htmlCode);
			}
			else  // modify existing chem obj element
			{
				//console.log('set attribs', details);
				//Kekule.DomUtils.setElemAttributes(self._targetElem, details);
				Kekule.DomUtils.setElemAttributes(targetElem, details);
			}

			// debug
			//this._prepareForSubmit();

			self.markUpdated();
		});
	},

	// returns HTML code to insert chemObj when purifier is not used
	_getNormalHtmlCode: function(exportObjDetails)
	{
		var htmlCode = this._generateElemHtmlCode(this.CHEM_OBJ_TAGNAME, null, exportObjDetails);
		return htmlCode;
	},
	// returns HTML code to insert chemObj when purifier is used
	/*
	_getPurifierHtmlCode: function(exportObjDetails)
	{
		var imgElemDefine = {
			tagName: this.CHEM_OBJ_PURIFIER_IMG_TAGNAME,
			className: 'Kekule-ChemObj-Img',
			width: exportObjDetails.width,
			height: exportObjDetails.height,
			style: exportObjDetails.style,
			src: exportObjDetails.src
		};
		var dataDetails = Object.extend({}, exportObjDetails);
		dataDetails['data-width'] = exportObjDetails.width + 'px';
		dataDetails['data-height'] = exportObjDetails.height + 'px';
		var dataElemDefine = {
			tagName: this.CHEM_OBJ_PURIFIER_DATA_TAGNAME,
			className: KekuleMoodle.WidgetDataWrapper.WRAPPER_DATA_HTML_CLASS,
			style: 'display: none',  // data element should be hidden at first
			content: JSON.stringify(dataDetails)
		};
		var elemDefines = {
			tagName: this.CHEM_OBJ_PURIFIER_WRAPPER_TAGNAME,
			className: KekuleMoodle.WidgetDataWrapper.WRAPPER_HTML_CLASS, //'Kekule-ChemObj-Wrapper',
			children: [imgElemDefine, dataElemDefine],
			style: 'display:inline-block'
		};

		return this._generateHtmlElemsCode(elemDefines);
	},
	*/

	_generateElemHtmlCode: function(tagName, content, attributes)
	{
		//console.log('generate', tagName, content, attributes);
		var result = '<' + tagName;
		var props = Kekule.ObjUtils.getOwnedFieldNames(attributes);
		for (var i = 0, l = props.length; i < l; ++i)
		{
			var prop = props[i];
			if (prop)
			{
				var value = attributes[prop];
				if (value)
				{
					value = value.toString();
					// replace quotes to avoid conflict
					value = value.replace('/\"/g', '&quot;');
					value = value.replace('/\'/g', '&#039;');
					value = value.replace('/\</g', '&lt;');
					value = value.replace('/\>/g', '&gt;');
				}
				//if (prop && value)
				{
					if (prop === 'className')
						prop = 'class';
					result += ' ' + prop + '=\'' + value + '\'';
				}
			}
		}
		result += '>';
		if (content)
			result += content;
		result += '</' + tagName + '>';
		return result;
	},

	_generateHtmlElemsCode: function(elemDefines)
	{
		var children = elemDefines.children || [];
		var tagName = elemDefines.tagName;
		var content = elemDefines.content || '';
		var attribs = Object.extend({}, elemDefines);
		delete attribs.tagName;
		delete attribs.content;
		delete attribs.children;

		// get children string
		var childrenCode = '';
		for (var i = 0, l = children.length; i < l; ++i)
		{
			var code = this._generateHtmlElemsCode(children[i]);
			childrenCode += code;
		}
		// wrap parent string
		var result = this._generateElemHtmlCode(tagName, content + childrenCode, attribs);
		return result;
	}
},
{
	ATTRS: {
		kekuleCssUrl: {
			value: ''
		},
		kekuleMoodleCssUrl: {
			value: ''
		},
		attoKekulePluginPath: {
			value: ''
		},
		purifyHtml: {
			value: false
		},
		enableChemObjInserterAuto3DGeneration: {
			value: false
		},
		chemObjInserterToolButtons: {
			value: null
		},
		spectrumInserterToolButtons: {
			value: null
		}
	}
});

KC.ChemObjDataWrapperUtils = {
	CHEM_OBJ_WRAPPER_TAGNAME: 'span',
	CHEM_OBJ_DATA_TAGNAME: 'span',
	CHEM_OBJ_IMG_TAGNAME: 'img',
	CHEM_OBJ_WRAPPER_CLASSNAME: 'Kekule-ChemObj-Wrapper',
	CHEM_OBJ_DATA_CLASSNAME: 'Kekule-ChemObj-Wrapper-Data',
	CHEM_OBJ_IMG_CLASSNAME: 'Kekule-ChemObj-Wrapper-Img',

	/**
	 * Returns detailed informations of wrapper element
	 * @param elem
	 * @returns {Hash} {dataElement, imgElement, srcData, data(hash)}
	 */
	getWrapperDetails: function(elem)
	{
		if (Kekule.HtmlElementUtils.hasClass(elem, KC.ChemObjDataWrapperUtils.CHEM_OBJ_WRAPPER_CLASSNAME))  // is actually a wrapper
		{
			var result = {};
			// find img and data elements
			var children = Kekule.DomUtils.getDirectChildElems(elem);
			if (children && children.length)  // has children
			{
				for (var i = 0, l = children.length; i < l; ++i)
				{
					var child = children[i];
					if (Kekule.HtmlElementUtils.hasClass(child, KC.ChemObjDataWrapperUtils.CHEM_OBJ_DATA_CLASSNAME))  // data element
						result.dataElement = child;
					else if (Kekule.HtmlElementUtils.hasClass(child, KC.ChemObjDataWrapperUtils.CHEM_OBJ_IMG_CLASSNAME))  // img element
						result.imgElement = child;
				}
			}
			// get detailed data
			var dataElem = result.dataElement || elem;  // some times child data element is missing
			result.srcData = Kekule.DomUtils.getElementText(dataElem);
			try
			{
				result.data = JSON.parse(result.srcData);
			}
			catch(e)
			{

			}
			return result;
		}
		else
			return null;
	},
	/**
	 * Update wrapper element with data.
	 * @param elem
	 * @param data
	 */
	updateWrapperElem: function(elem, data)
	{
		var details = KC.ChemObjDataWrapperUtils.getWrapperDetails(elem);
		if (details)
		{
			var doc = elem.ownerDocument;
			if (!details.dataElement)
			{
				Kekule.DomUtils.setElementText(elem, '');
				details.dataElement = doc.createElement(KC.ChemObjDataWrapperUtils.CHEM_OBJ_DATA_TAGNAME);
				details.dataElement.className = KC.ChemObjDataWrapperUtils.CHEM_OBJ_DATA_CLASSNAME;
				elem.appendChild(details.dataElement);
			}
			if (!details.imgElement)
			{
				details.imgElement = doc.createElement(KC.ChemObjDataWrapperUtils.CHEM_OBJ_IMG_TAGNAME);
				details.imgElement.className = KC.ChemObjDataWrapperUtils.CHEM_OBJ_IMG_CLASSNAME;
				elem.appendChild(details.imgElement);
			}
		}
		// update data element content
		Kekule.HtmlElementUtils.addClass(details.dataElement, KekuleMoodle.WidgetDataWrapper.WRAPPER_DATA_HTML_CLASS);
		Kekule.DomUtils.setElementText(details.dataElement, JSON.stringify(data));
		Kekule.StyleUtils.setDisplay(details.dataElement, 'none');  // data element should always be hidden
		// update img element content
		var imgElem = details.imgElement;
		var imgElemAttribs = {
			width: data.width,
			height: data.height,
			style: data.style,
			src: data.src
		};
		Kekule.DomUtils.setElemAttributes(imgElem, imgElemAttribs);

		Kekule.HtmlElementUtils.addClass(elem, KekuleMoodle.WidgetDataWrapper.WRAPPER_HTML_CLASS);
	},

	/**
	 * Create new wrapper element.
	 * @param doc
	 * @param data
	 */
	createWrapperElem: function(doc, data)
	{
		var result = doc.createElement(KC.ChemObjDataWrapperUtils.CHEM_OBJ_WRAPPER_TAGNAME);
		result.className = KC.ChemObjDataWrapperUtils.CHEM_OBJ_WRAPPER_CLASSNAME;
		KC.ChemObjDataWrapperUtils.updateWrapperElem(result, data);
		return result;
	},


	replaceDataWrappersWithImg: function(dataWrapperElem)
	{
		var details = KC.ChemObjDataWrapperUtils.getWrapperDetails(dataWrapperElem);
		var imgElemAttribs = Object.extend({
			dataWidget: details.widget
		}, details.data);
		//console.log('img attribs', imgElemAttribs);
		var doc = dataWrapperElem.ownerDocument;
		var parent = dataWrapperElem.parentNode;
		var result = doc.createElement('img');
		Kekule.DomUtils.setElemAttributes(result, imgElemAttribs);
		parent.insertBefore(result, dataWrapperElem);
		parent.removeChild(dataWrapperElem);
		return result;
	},
	replaceImgsWithDataWrapper: function(imgElem)
	{
		var doc = imgElem.ownerDocument;
		var parent = imgElem.parentNode;
		var details = Kekule.DomUtils.fetchAttributeValuesToJson(imgElem);
		var result = KC.ChemObjDataWrapperUtils.createWrapperElem(doc, details);
		parent.insertBefore(result, imgElem);
		parent.removeChild(imgElem);
		return result;
	}
};



}, '@VERSION@', {"requires": ["moodle-editor_atto-plugin", "kekule", "local_kekulejs", "local_kekulejs/kekuleInitials"]});
