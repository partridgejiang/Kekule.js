/**
 * Specified code related to Firefox addon for insert chem obj in web page.
 */

(function(self){

// Listen for event
//self.port.on(/*"insertChemObjElem"*/globalConsts.MSG_INS_CHEMOBJ_ELEM_REQUEST, function(msg)
MsgUtils.onRequest(self.port, globalConsts.MSG_INS_CHEMOBJ_ELEM, function(msg)
{
	var resultMsg;
	try
	{
		var attribs = Object.create(msg.attribs);
		attribs['data-observe-element-attrib-changes'] = 'true';  // always turn this attrib to true
		var result = false;
		var doc = DomUtils.getActiveDocument(DomUtils.getWindow().document);
		if (msg.isModify)  // modify mode
		{
			var selection = doc.getSelection();
			// get modify target
			var elem = SelectionUtils.getSingleSelectedElem(selection);
			if (SelectionUtils.isChemObjElem(elem))
			{
				//console.log('modify', elem.tagName);
				result = ChemObjElemInserter.modifyChemObjElem(elem, attribs);
			}
		}

		if (!result)
		{
			result = ChemObjElemInserter.insertChemObjToDocument(
				doc,
				attribs);
		}
		//doc.defaultView.postMessage({'msg': globalConsts.MSG_INJECTION_DETECT_REQUEST}, '*'); // can not send object message in worker, otherwise causes exception
		doc.defaultView.postMessage(globalConsts.MSG_INJECTION_DETECT_REQUEST, '*');
	}
	catch(e)
	{
		result = false;
		resultMsg = e.message;
	}
	// response to addon
	//console.log('response', result, resultMsg, globalConsts.MSG_INJECTION_DETECT_REQUEST);
	//self.port.emit(globalConsts.MSG_INS_CHEMOBJ_ELEM_RESPONSE, {'success': result, 'message': resultMsg});
	MsgUtils.emitResponse(self.port, globalConsts.MSG_INS_CHEMOBJ_ELEM, {'success': result, 'message': resultMsg});
});
//self.port.on(/*'queryActiveElemEditable.request'*/globalConsts.MSG_QUERY_ACTIVE_ELEM_EDITABLE_REQUEST, function(msg)
MsgUtils.onRequest(self.port, globalConsts.MSG_QUERY_ACTIVE_ELEM_EDITABLE, function(msg)
{
	var result = DomUtils.isActiveElemEditable();
	//self.port.emit(/*'queryActiveElemEditable.response'*/globalConsts.MSG_QUERY_ACTIVE_ELEM_EDITABLE_RESPONSE, {'editable': result});
	MsgUtils.emitResponse(self.port, globalConsts.MSG_QUERY_ACTIVE_ELEM_EDITABLE, {'editable': result});
});
//self.port.on(/*'querySelChemObjElemAttribs.request'*/globalConsts.MSG_QUERY_SEL_CHEMOBJ_ELEM_ATTRIBS_REQUEST, function(msg)
MsgUtils.onRequest(self.port, globalConsts.MSG_QUERY_SEL_CHEMOBJ_ELEM_ATTRIBS, function(msg)
{
	var doc = DomUtils.getActiveDocument(DomUtils.getWindow().document);
	var selection = doc.getSelection();
	var attribs = SelectionUtils.getSelChemObjElemAttribs(selection);
	//self.port.emit(/*'querySelChemObjElemAttribs.response'*/globalConsts.MSG_QUERY_SEL_CHEMOBJ_ELEM_ATTRIBS_RESPONSE, {'attribs': attribs});
	MsgUtils.emitResponse(self.port, globalConsts.MSG_QUERY_SEL_CHEMOBJ_ELEM_ATTRIBS, {'attribs': attribs});
});
//self.port.on(globalConsts.MSG_QUERY_SEL_ELEM_INFO_REQUEST, function(msg){
MsgUtils.onRequest(self.port, globalConsts.MSG_QUERY_SEL_ELEM_INFO, function(msg){
	var doc = DomUtils.getActiveDocument(DomUtils.getWindow().document);
	var selection = doc.getSelection();
	var attribs = SelectionUtils.getSelChemObjElemAttribs(selection);
	var editable = DomUtils.isActiveElemEditable();
	//self.port.emit(globalConsts.MSG_QUERY_SEL_ELEM_INFO_RESPONSE, {'attribs': attribs, 'editable': editable});
	MsgUtils.emitResponse(self.port, globalConsts.MSG_QUERY_SEL_ELEM_INFO, {'attribs': attribs, 'editable': editable});
});

})(self);  // "self" is a global object in content scripts