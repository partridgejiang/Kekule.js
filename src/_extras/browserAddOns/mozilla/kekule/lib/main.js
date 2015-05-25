var self = require("sdk/self");
var buttons = require('sdk/ui/button/action');
var tabs = require("sdk/tabs");
var panelEx = require('./components/panelEx.js');
const pageMod = require("sdk/page-mod");
const { PageModEx } = require('./components/pageModEx.js');
const { globalConsts } = require('./globalConsts.js');
const { ChemObjInserterPanel } = require('./components/chemObjInserterPanel.js');

// pageMod

//const insertionContentScripts = [];

var detectionPageMod = pageMod.PageMod({
	include: ['*'],
	contentScriptWhen: 'ready',
	contentScriptFile: [
		self.data.url('../lib/globalConsts.js'),
		self.data.url('./injectScripts/elemDetection.js')
		//self.data.url('./libs/Three.js'),
		//self.data.url('./libs/kekule/kekule.min.js')
	],
	attachTo: ["existing","top", "frame"],
	onAttach: function(worker)
	{
		worker.port.on(globalConsts.MSG_INJECT_KEKULE_LIB_REQUEST, function() {
			injectKekuleLib(worker);
		});
	}
});

function injectKekuleLib(worker)
{
	var scriptFiles = globalConsts.URLS_KEKULE_LIB_INJECT_SCRIPT;
	var styleFiles = globalConsts.URLS_KEKULE_LIB_INJECT_STYLE;
	for (var i = 0, l = scriptFiles.length; i < l; ++i)
	{
		scriptFiles[i] = self.data.url(scriptFiles[i]);
	}
	for (var i = 0, l = styleFiles.length; i < l; ++i)
	{
		styleFiles[i] = self.data.url(styleFiles[i]);
	}
	worker.port.emit(globalConsts.MSG_INJECT_KEKULE_LIB_RESPONSE, {
		'scriptFiles': scriptFiles,
		'styleFiles': styleFiles
	});
};

var insertionPageMod = PageModEx({
	include: ['*'],
	contentScriptWhen: 'ready',
	contentScriptFile: [
		self.data.url('../lib/globalConsts.js'),
		//self.data.url('./injectScripts/elemDetection.js'),
		self.data.url('./injectScripts/chemObjInsert.js')
	],
	attachTo: ["existing","top"/*, "frame"*/]
});


// UI definition
var btnChemObj = buttons.ActionButton({
	id: "kekule-chemObj",
	label: "Add or modify molecule",
	icon: {
		"16": self.data.url("icons/insertChemObj16.png"),
		"32": self.data.url("icons/insertChemObj32.png"),
		"64": self.data.url("icons/insertChemObj64.png")
	},
	onClick: showChemObjImporter
});

var chemObjInserterPanel = ChemObjInserterPanel({
	'insertionPageMod': insertionPageMod
});

function showChemObjImporter()
{
	chemObjInserterPanel.show({'querySelElem': true});
}