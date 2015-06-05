/**
 * @fileoverview
 * Global consts used by addon.
 * @author Partridge Jiang
 */

var globalConsts = {
	// messages
	MSG_REQUEST: '.request',
	MSG_RESPONSE: '.response',

	MSG_ERROR: 'error',

	MSG_SUBMIT: 'submit',
	//MSG_SUBMIT_REQUEST: 'submit.request',
	//MSG_SUBMIT_RESPONSE: 'submit.response',
	MSG_CANCEL: 'cancel',
	MSG_SHOW: 'show',
	MSG_RESIZE_CONTAINER: 'resizeContainer',
	MSG_RESIZE_WIDGET: 'resizeWidget',

	MSG_STORE_WIDGET_PROP: 'storeWidgetProp',
	//MSG_STORE_WIDGET_PROP_REQUEST: 'storeWidgetProp.request',
	//MSG_STORE_WIDGET_PROP_RESPONSE: 'storeWidgetProp.response',
	MSG_RESTORE_WIDGET_PROP: 'restoreWidgetProp',

	MSG_LOAD_CHEMOBJ_ELEM_ATTRIBS: 'loadChemObjElemAttribs',

	MSG_QUERY_SEL_ELEM_INFO: 'querySelElemInfo',
	//MSG_QUERY_SEL_ELEM_INFO_REQUEST: 'querySelElemInfo.request',
	//MSG_QUERY_SEL_ELEM_INFO_RESPONSE: 'querySelElemInfo.response',

	MSG_INS_CHEMOBJ_ELEM: 'insertChemObjElem',
	//MSG_INS_CHEMOBJ_ELEM_REQUEST: 'insertChemObjElem.request',
	//MSG_INS_CHEMOBJ_ELEM_RESPONSE: 'insertChemObjElem.response',

	MSG_QUERY_ACTIVE_ELEM_EDITABLE: 'queryActiveElemEditable',
	//MSG_QUERY_ACTIVE_ELEM_EDITABLE_REQUEST: 'queryActiveElemEditable.request',
	//MSG_QUERY_ACTIVE_ELEM_EDITABLE_RESPONSE: 'queryActiveElemEditable.response',

	MSG_QUERY_SEL_CHEMOBJ_ELEM_ATTRIBS: 'querySelChemObjElemAttribs',
	//MSG_QUERY_SEL_CHEMOBJ_ELEM_ATTRIBS_REQUEST: 'querySelChemObjElemAttribs.request',
	//MSG_QUERY_SEL_CHEMOBJ_ELEM_ATTRIBS_RESPONSE: 'querySelChemObjElemAttribs.response',

	MSG_LOAD_FILE_DATA: 'loadFileData',
	//MSG_LOAD_FILE_DATA_REQUEST: 'loadFileData.request',
	//MSG_LOAD_FILE_DATA_RESPONSE: 'loadFileData.response',
	MSG_SAVE_FILE_DATA: 'saveFileData',
	//MSG_SAVE_FILE_DATA_REQUEST: 'saveFileData.request',
	//MSG_SAVE_FILE_DATA_RESPONSE: 'saveFileData.response',

	MSG_INJECT_KEKULE_LIB: 'injectKekuleLib',
	//MSG_INJECT_KEKULE_LIB_REQUEST: 'injectKekuleLib.request',
	//MSG_INJECT_KEKULE_LIB_RESPONSE: 'injectKekuleLib.response',
	MSG_INJECTION_DETECT_REQUEST: 'injectionDetect.request',  // special message send to window to communicate

	MSG_SET_CONTEXT_MENU: 'setContextMenu',

	MSG_SELECT_CHEMOBJ_ELEM_AND_MODIFY: 'selectChemObjElemAndModify',

	// URLS (related to "data" directory
	URLS_KEKULE_LIB_INJECT_SCRIPT: [
		'./libs/Three.js',
		'./libs/kekule/kekule.min.js'
	],
	URLS_KEKULE_LIB_INJECT_STYLE: [
		'./styles/kekule/default.css',
		'./styles/kekule/defaultColor.css',
		'./styles/kekule/chemWidget.css',
		'./styles/kekule/chemWidgetColor.css'
	],

	// UI item
	MENU_MODIFY_CHEMOBJ: 'ModifyChemObj',
	CAPTION_MENU_MODIFY_CHEMOBJ: 'Modify Molecule...',
	CAPTION_BUTTON_ADD_CHEMOBJ: 'Add or modify molecule'
};

if (this.exports)
{
	exports.globalConsts = globalConsts;
}

