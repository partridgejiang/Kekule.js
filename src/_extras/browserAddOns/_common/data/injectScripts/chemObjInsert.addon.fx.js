/**
 * Specified code related to Firefox addon for insert chem obj in web page.
 */

(function(self, doc){

// Listen for event
MsgUtils.onRequest(self.port, globalConsts.MSG_INS_CHEMOBJ_ELEM, function(msg)
{
	var doc = DomUtils.getActiveDocument(DomUtils.getWindow().document);
	var result = ChemObjElemInserter.insertOrModifyChemObjElem(msg.attribs, msg.isModify);
	if (result.success)
		doc.defaultView.postMessage(globalConsts.MSG_INJECTION_DETECT_REQUEST, '*');
	// response to addon
	MsgUtils.emitResponse(self.port, globalConsts.MSG_INS_CHEMOBJ_ELEM, result);
});

MsgUtils.onRequest(self.port, globalConsts.MSG_QUERY_ACTIVE_ELEM_EDITABLE, function(msg)
{
	var result = DomUtils.isActiveElemEditable();
	MsgUtils.emitResponse(self.port, globalConsts.MSG_QUERY_ACTIVE_ELEM_EDITABLE, {'editable': result});
});

MsgUtils.onRequest(self.port, globalConsts.MSG_QUERY_SEL_CHEMOBJ_ELEM_ATTRIBS, function(msg)
{
	var doc = DomUtils.getActiveDocument(DomUtils.getWindow().document);
	var selection = doc.getSelection();
	var attribs = SelectionUtils.getSelChemObjElemAttribs(selection);
	MsgUtils.emitResponse(self.port, globalConsts.MSG_QUERY_SEL_CHEMOBJ_ELEM_ATTRIBS, {'attribs': attribs});
});

MsgUtils.onRequest(self.port, globalConsts.MSG_QUERY_SEL_ELEM_INFO, function(msg){
	var doc = DomUtils.getActiveDocument(DomUtils.getWindow().document);
	var selection = doc.getSelection();
	var attribs = SelectionUtils.getSelChemObjElemAttribs(selection);
	var editable = DomUtils.isActiveElemEditable();
	MsgUtils.emitResponse(self.port, globalConsts.MSG_QUERY_SEL_ELEM_INFO, {'attribs': attribs, 'editable': editable});
});

})(self, document);  // "self" is a global object in content scripts