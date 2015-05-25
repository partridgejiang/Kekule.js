/**
 * @fileoverview
 * Add on panel to insert chem object.
 * @author Partridge Jiang
 */

//var {Cc, Ci, Cr, Cu} = require("chrome");
const { Class, extend } = require("sdk/core/heritage");
const self = require("sdk/self");
const viewCore = require("sdk/view/core");
const tabs = require("sdk/tabs");
const simpleStorage = require("sdk/simple-storage");
//const privateBrowsing = require("sdk/private-browsing");
//var panel = require("sdk/panel");
const { PanelEx } = require('./panelEx.js');
const nativeServicesBinder = require('../modules/nativeServicesBinder.js');
const { globalConsts } = require('../globalConsts.js');

const contentURL = './components/chemObjImport.html';
const minWidth = 600;
const minHeight = 500;
const wigetPropStoreField = 'chemObjInserterProps';

const ChemObjInserterPanel = Class({
	extends: PanelEx,
	setup: function setup(options)
	{
		var ops = extend({
			width: 600,
			height: 500,
			showHtmlTip: true
		}, options || {});
		ops.contentURL = contentURL;
		var result = PanelEx.prototype.setup.apply(this, [ops]);

		this.insertionPageMod = ops.insertionPageMod;

		nativeServicesBinder.bind(this);
		this.addEventHandlers();

		//this.restoreWidgetSize();

		return result;
	},
	show: function(options, anchor)
	{
		var ops = options || {};
		var that = this;
		var done = function()
		{
			PanelEx.prototype.show.apply(that, [options, anchor]);
		};
		if (!this._sizeRestored)
		{
			this._sizeRestored = true;
			this.restoreWidgetSize();
		}
		this.initWorker();
		if (ops.querySelElem)
			this.queryCurrSelElemOnContent(done);
		else
			done();
		return this;
	},

	storeWidgetProps: function(data)
	{
		//console.log('store size', width, height);
		simpleStorage.storage[wigetPropStoreField] = data;
	},
	restoreWidgetSize: function()
	{
		/*
		// debug
		console.log('request resize widget');
		this.port.emit(globalConsts.MSG_RESIZE_WIDGET, {'width': 200, 'height': 200});
		return;
		*/
		var data = simpleStorage.storage[wigetPropStoreField];
		if (data && data.size)
		{
			this.port.emit(globalConsts.MSG_RESIZE_WIDGET, {'width': data.size.width, 'height': data.size.height});
		}
	},

	initWorker: function()
	{
		var worker = this.getWorkerOnTab() || null;
		if (worker !== this.currWorker)
			this.currWorker = worker;
		if (worker)
		{
			// do nothing here
		}
		else // no worker fond no tab
		{
			this.port.emit(globalConsts.MSG_ERROR, {'message': 'Can not find worker for current page'});
		}
	},

	getWorkerOnTab: function(tab)
	{
		if (!tab)
			tab = tabs.activeTab;
		var worker;
		if (this.insertionPageMod)
		{
			worker = this.insertionPageMod.getWorkerOnTab(tab);
		}
		/*
		if (!worker)
		{
			worker = tab.attach({
				contentScript: self.data.url('./scripts/chemObjInsert.js')
			});
		}
		*/
		return worker;
	},

	queryCurrSelElemOnContent: function(callback)
	{
		var that = this;
		var done = function(msg)
		{
			that.queryCurrSelElemOnContentDone(msg, that);
			if (callback)
				callback(msg && msg.attribs);
		};

		var worker = this.currWorker;  //this.getWorkerOnTab();
		if (worker)
		{
			worker.port.on(globalConsts.MSG_QUERY_SEL_ELEM_INFO_RESPONSE, function(msg)
			{
				done(msg);
			});
			worker.port.emit(globalConsts.MSG_QUERY_SEL_ELEM_INFO_REQUEST);
		}
		else
		{
			done(null);
		}
	},
	queryCurrSelElemOnContentDone: function(msg, thisArg)
	{
		/*
		var editable = msg.editable;
		var attribs = msg.attribs;
		*/
		thisArg.port.emit(globalConsts.MSG_LOAD_CHEMOBJ_ELEM_ATTRIBS, msg);
	},

	insertChemObjElem: function(insertMsg, tab)
	{
		var worker = this.currWorker;  // this.getWorkerOnTab(tab);
		if (worker)
		{
			var that = this;
			worker.port.on(globalConsts.MSG_INS_CHEMOBJ_ELEM_RESPONSE, function(msg)
			{
				if (msg.success)
					that.hide();
				else  // error
				{
					that.port.emit(globalConsts.MSG_ERROR, {'message': msg.message});
				}
			});
			worker.port.emit(/*'insertChemObjElem'*/globalConsts.MSG_INS_CHEMOBJ_ELEM_REQUEST, insertMsg);
		}
		//console.log('send insert msg', tab, worker);
	},

	addEventHandlers: function()
	{
		var result = this;
		//
		result.on('show', function(){
			/*
			// check if current selection is chemObj elment. If so, load its chem obj
			this.queryCurrSelElemOnContent(function(){
				result.port.emit('show');  // show after chemObj is loaded
			});
			*/
			//console.log('load curr sel');
			result.port.emit(/*'show'*/globalConsts.MSG_SHOW);
		});
		result.on('hide', function(){
			result.port.emit(globalConsts.MSG_STORE_WIDGET_PROP_REQUEST);
		});
		result.port.on(globalConsts.MSG_STORE_WIDGET_PROP_RESPONSE, function(msg)
		{
			result.storeWidgetProps(msg);
		});

		// event listeners
		// resize panel
		result.port.on(/*'resizeContainer'*/globalConsts.MSG_RESIZE_CONTAINER, function(msg)
		{
			var padding = 0;  //chemObjImportPanel.panelPadding;
			//console.log('receive resize request', msg);
			if (msg.width)
				result.width = Math.max(msg.width + padding, minWidth);
			if (msg.height)
				result.height = Math.max(msg.height + padding, minHeight);
		});

		// Listen for messages called "cancel" coming from
		// the content script. Which means discard changes.
		result.port.on(/*"cancel"*/globalConsts.MSG_CANCEL, function()
		{
			result.hide();
		});
		// Listen for messages called "done" coming from
		// the content script. Which means insert chem object to current cursor position.
		result.port.on(/*"submit"*/globalConsts.MSG_SUBMIT_REQUEST, function(msg)
		{
			if (msg.attribs)  // if attribs is null, means chem obj is null in inserter
			{
				result.insertChemObjElem(msg, tabs.activeTab);
			}
			//result.hide();
		});

		return result;
	}
});

exports.ChemObjInserterPanel = ChemObjInserterPanel;