var buttons = require('sdk/ui/button/action');
var tabs = require("sdk/tabs");
var panel = require("sdk/panel");
var selection = require("sdk/selection");


const editPageUrl = './pages/chemObjEdit.html';
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

tabs.on('ready', function(tab){
	var worker = tab.attach({contentScriptFile: detectScriptUrl});
	worker.port.on('focus', function(msg)
	{
		console.log('[Focus]', msg.targetElem, msg.targetElemTag);
	});
});

selection.on('select', function(){
	console.log('select', selection.text);
});


var panelEditObj = panel.Panel({
	width: 750,
	height: 550,
	contentURL: editPageUrl
});

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

function editChemObj()
{
	panelEditObj.show();
};