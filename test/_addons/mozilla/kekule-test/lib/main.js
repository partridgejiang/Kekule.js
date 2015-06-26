var buttons = require('sdk/ui/button/action');
var tabs = require("sdk/tabs");
var panel = require("sdk/panel");
var selection = require("sdk/selection");
var sidebar = require("sdk/ui/sidebar");


const editPageUrl = /*'./pages/chemObjEditParent.html'*/'./pages/chemObjEdit.html';
const injectScriptUrl = './scripts/inject.js';
const detectScriptUrl = './scripts/detect.js';

function getActiveTab()
{
	return tabs.activeTab;
}
function getActiveTabDocument(ensureReadyState)
{
	var tab = getActiveTab();
	if (!tab)
		return null;
	else
	{
		var doc = tab.window.document;
		//console.log('tab', tab, tab.window, tab.window.document);
		if (ensureReadyState && (doc.readyState !== 'complete') && (doc.readyState !== 'interactive'))
			return null;
		else
			return doc;
	}
}


selection.on('select', function(){
	console.log('select', selection.text);
});


var panelEditObj = panel.Panel({
	width: 750,
	height: 550,
	contentURL: editPageUrl,
	noautohide: true
});

var xulPanel = require('sdk/view/core').getActiveView(panelEditObj);
xulPanel.setAttribute('tooltip', 'aHTMLTooltip');
xulPanel.setAttribute('noautohide', 'true');


// Listen for messages called "cancel" coming from
// the content script. Which means discard changes.
panelEditObj.port.on("cancel", function()
{
	panelEditObj.hide();
});

// Listen for messages called "done" coming from
// the content script. Which means insert chem object to current cursor position.
panelEditObj.port.on("done", function(msg)
{
	//console.log('dataReceived', msg.is3D, msg.objData);
	var tab = getActiveTab();
	var worker = tab.attach({contentScriptFile: injectScriptUrl});
	worker.port.emit('insert', msg);
	panelEditObj.hide();
});

var inDialog = false;
var suspendShow = false;
panelEditObj.port.on("dialogOpened", function()
{
	console.log('in dialog');
	inDialog = true;
	//panelEditObj.show();
});
panelEditObj.on("hide", function() {
	console.log('hide panel', inDialog);
	if (inDialog)
	{
		suspendShow = true;
	}
});

panelEditObj.port.on("chemObjLoaded", function(data)
{
	console.log('chemObjLoaded');
	//panelEditObj.show();
});


/*
tabs.on('ready', function(tab){
	var worker = tab.attach({contentScriptFile: detectScriptUrl});
	worker.port.on('focus', function(msg)
	{
		console.log('[Focus]', msg.targetElem, msg.targetElemTag);
		if (suspendShow)
		{
			suspendShow = false;
			inDialog = false;
			panelEditObj.show();
		}
	});
});
*/

// When the panel is displayed it generated an event called
// "show": we will listen for that event and when it happens,
// send our own "show" event to the panel's script, so the
// script can prepare the panel for display.
panelEditObj.on("show", function() {
	panelEditObj.port.emit("show");
});


var btnChemObj = buttons.ActionButton({
	id: "kekule-chemObj",
	label: "Add or modify chem object",
	icon: {
		"16": "./icons/insertChemObj2D.png"
		//"32": "./icon-32.png",
		//"64": "./icon-64.png"
	},
	onClick: editChemObj
});

var winUtils = require('sdk/window/utils');
const dialog = require('./modules/dialog');

function editChemObj()
{
	panelEditObj.show();
	//showFilePicker();

	/*
	dialog.open({
		// both `foo.html` and `index.js` are supposed to
		// be in add-on's `data` folder
		url: editPageUrl,
		//contentScriptFile: './index.js',
		features: {
			width: 600,
			height: 550,
			resizable: true
		}
	});
	*/

	/*
	winUtils.openDialog(editPageUrl, {
		features: Object.keys({
			chrome: true,
			width: 200,
			height: 50,
			popup: true
		})
	});
	*/
};

var {Cc, Ci, Cr, Cu} = require("chrome");
var { viewFor } = require("sdk/view/core");
var windows = require("sdk/windows").browserWindows;

const fileIO = require("sdk/io/file");

Cu.importGlobalProperties( [ "File" ] );


function openFilePicker(callback, options)
{
	var domWin = viewFor(windows.activeWindow);
	//console.log('CHROME WIN', domWin, windows.activeWindow);
	var nsIFilePicker = Ci.nsIFilePicker;
	var fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	fp.init(domWin, /*"Select a File MMMMMMMMMM"*/null, nsIFilePicker.modeOpen);

	// filters
	var filters = options.filters || [];
	//console.log(filters);
	for (var i = 0, l = filters.length; i < l; ++i)
	{
		var item = filters[i];
		fp.appendFilter(item.title, '*' + item.filter);
	}

	var res = fp.show();

	if (res === nsIFilePicker.returnOK)
	{
		//var files = fp.files;
		var file = fp.file; //files[0];
		/*
		var fstream = Cc["@mozilla.org/network/file-input-stream;1"]
			.createInstance(Ci.nsIFileInputStream);
		fstream.init(file, -1, 0, 0);
		*/
		var path = file.path;
		var s = fileIO.read(path);
		console.log('file content', s);

		var domFile = File(file.path);

		panelEditObj.port.emit('fileLoad', {'result': true, 'data': s, 'fileName': path, 'file': domFile});
		//console.log('dom file', file);
		/*
		var hFiles = [];
		for (var file in files)
		{
			hFiles.push(File(file));
		}
		*/
		callback(true);  //, hFiles, hFiles[0]);
	}
	else if (res === nsIFilePicker.returnCancel)
	{
		panelEditObj.port.emit('fileLoad', {'result': false, 'data': null, 'fileName': null});
		callback(false);
	}
}


panelEditObj.port.on("requireOpenFileData", function(data)
{
	console.log('receive requireOpenFileData');
	var that = this;
	var done = function(result, files, file)
	{
		console.log('dialog closed', result);
		//panelEditObj.port.emit("dialogClosed", {});
		//callback(result, files, file);
		panelEditObj.show();
	};
	panelEditObj.hide();
	openFilePicker(done, data.options);
});


var pageMod = require("sdk/page-mod");
pageMod.PageMod({
	include: ["*", "file://*", "about:blank", "javascript:*"],
	contentScriptFile: detectScriptUrl,
	attachTo: ["existing","top", "frame"],
	onAttach: function(worker) {
		/*
		worker.port.emit("getElements", tag);
		worker.port.on("gotElement", function(elementContent) {
			console.log(elementContent);
		});
		*/
	}
});