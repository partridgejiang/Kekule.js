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

/**
 * Atto text editor strike plugin.
 *
 * @namespace M.atto_strike
 * @class button
 * @extends M.editor_atto.EditorPlugin
 */

Y.namespace('M.atto_kekulechem').Button = Y.Base.create('button', Y.M.editor_atto.EditorPlugin, [], {
	BTN_NAME_OBJ_INSERT: 'kekuleChemObjInsert',
	CHEM_OBJ_INSERTER_CLASS: 'KekuleChemObjInserter',
	CHEM_OBJ_VIEWER_CLASS: 'KekuleChemObjViewer',
	CHEM_OBJ_TAGNAME: 'img',
	initializer: function() {
		var iconUrl = this.get('attoKekulePluginPath') + 'pix/icon.gif';
		this.addButton({
				buttonName: this.BTN_NAME_OBJ_INSERT,
				//exec: 'strikeThrough',
				//icon: 'e/strikethrough',
				'iconurl': iconUrl,
				callback: this._execute,

				// Watch the following tags and add/remove highlighting as appropriate:
				tags: 'strike'
		});
		// add essential CSS
		this._addEssentialFiles();
	},

	// utils methods
	_addEssentialFiles: function()
	{
		var cssKekule = this.get('kekuleCssUrl'); //M.util.get_string('kekuleCssUrl', 'atto_kekulechem');
		this._addCssUrl(cssKekule);
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

	// return currently selected chem viewer target Y node
	_getSelectedChemObjTarget: function()
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
				var ancestor = Kekule.DomUtils.getNearestAncestorByTagName(domNode, self.CHEM_OBJ_TAGNAME, true);
				if (ancestor && (ancestor.className || '').indexOf(self.CHEM_OBJ_VIEWER_CLASS) >= 0)
					targetElem = ancestor;
			}

			if (targetElem)
			{
				targets.push(targetElem);
				if (targets.length > 1)  // more than one matched, exit
					return true;
			}
		});
		if (targets.length === 1)  // just select one
			return targets[0];
		else
			return null;
	},

	// open ChemObj importer
	_execute: function()
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
		var editor = this.get('host');
		this._openDialog();
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

	_openDialog: function()
	{
		if (!this._inserterDialog)
			this._inserterDialog = this._createDialog();
		var dialog = this._inserterDialog;
		var sCaption = this._targetElem?
				M.util.get_string('captionEditChemObj', 'atto_kekulechem'):
				M.util.get_string('captionAddChemObj', 'atto_kekulechem');
		dialog.setCaption(sCaption);
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

		this._forceInserterResize.bind(this).delay();
		return dialog;
	},
	_forceInserterResize: function()
	{
		this._chemObjInserter.resized();  // hack, force recalculate inserter children pos
	},
	_createDialog: function()
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

		var inserter = new Kekule.ChemWidget.ChemObjInserter(document);
		inserter.setResizable(true);
		inserter.appendToWidget(result);
		this._chemObjInserter = inserter;
		return result;
	},
	_submitChemObj: function()
	{
		var inserter = this._chemObjInserter;
		var details = inserter.getExportImgElemAttributes();
		// add viewer class flag to element
		if (!details['class'])
			details['class'] = '';
		details['class'] = ' ' + this.CHEM_OBJ_VIEWER_CLASS;

		//console.log('export detail', details);

		var editor = this.get('host');
		editor.focus();   // IMPORTANT: must focus back to editor, otherwise insertion may failed in blured editor
		//editor.restoreSelection(this._editorSelection);
		if (!this._targetElem)  // add new, insert new chem obj
		{
			var htmlCode = this._generateElemHtmlCode(this.CHEM_OBJ_TAGNAME, null, details);
			editor.insertContentAtFocusPoint(htmlCode);
			//console.log('insert new HTML', htmlCode);
		}
		else  // modify existing chem obj element
		{
			Kekule.DomUtils.setElemAttributes(this._targetElem, details);
		}

		this.markUpdated();
	},

	_generateElemHtmlCode: function(tagName, content, attributes)
	{
		var result = '<' + tagName;
		var props = Kekule.ObjUtils.getOwnedFieldNames(attributes);
		for (var i = 0, l = props.length; i < l; ++i)
		{
			var prop = props[i];
			var value = (attributes[prop]).toString();
			// replace quotes to avoid conflict
			value = value.replace('/\"/g', '&quot;');
			value = value.replace('/\'/g', '&#039;');
			value = value.replace('/\</g', '&lt;');
			value = value.replace('/\>/g', '&gt;');
			if (prop && value)
				result += ' ' + prop + '=\'' + value + '\'';
		}
		result += '>';
		if (content)
			result += content;
		result += '</' + tagName + '>';
		return result;
	}
},
{
	ATTRS: {
		kekuleCssUrl: {
			value: ''
		},
		attoKekulePluginPath: {
			value: ''
		}
	}
});
