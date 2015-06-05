/**
 * Specified code related to Chrome addon for insert chem obj in web page.
 */

(function(){

	chrome.extension.onMessage.addListener(function(msg, sender, sendResponse){
		//console.log('msg received', msg);
		var message = msg.message;
		var data = msg.data;
		if(message === globalConsts.MSG_INS_CHEMOBJ_ELEM)
		{
			var result = ChemObjElemInserter.insertOrModifyChemObjElem(data.attribs, data.isModify);
			if (result.success)
			{
				var doc = DomUtils.getActiveDocument(DomUtils.getWindow().document);
				doc.defaultView.postMessage(globalConsts.MSG_INJECTION_DETECT_REQUEST, '*');
			}
			sendResponse(result);
		}
		else if (message === globalConsts.MSG_QUERY_SEL_ELEM_INFO)
		{
			var doc = DomUtils.getActiveDocument(DomUtils.getWindow().document);
			var selection = doc.getSelection();
			var attribs = SelectionUtils.getSelChemObjElemAttribs(selection);
			var editable = DomUtils.isActiveElemEditable();
			//console.log('query result', attribs, editable);
			sendResponse({'attribs': attribs, 'editable': editable});
		}
		else if (message === globalConsts.MSG_SELECT_CHEMOBJ_ELEM_AND_MODIFY)
		{
			if (lastChemObjElem)
				SelectionUtils.selectOnElem(lastChemObjElem);
			chrome.extension.sendMessage({'message': globalConsts.MSG_SHOW});  // envoke edit panel
		}
	});

	// observe mouseup event to notify the change of context menu
	/*  // disable these code, context menu is currently not supported in Chrome addon
	var lastChemObjElem;
	document.addEventListener('mousedown', function(e)
		{
			var elem = e.target;
			var isModify = false;
			var chemObjElem = DomUtils.getParentChemObjElem(elem);
			if (chemObjElem)  // inside chem obj elem, show modify menu
			{
				isModify = true;
				lastChemObjElem = chemObjElem;
			}
			else
				lastChemObjElem = null;
			chrome.extension.sendMessage({'message': globalConsts.MSG_SET_CONTEXT_MENU, 'isModify': isModify});
		}
	);
	*/

})();