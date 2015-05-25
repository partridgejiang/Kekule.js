/**
 * @fileoverview
 * Script file need to inject to every page (but not frames) opened in browser to insert chem obj element.
 * @author Partridge Jiang
 */

(function(self){

var DomUtils = {
	getWindow: function()
	{
		return unsafeWindow || window;
	},
	// Returns current focused document. Iframe/frame is considered.
	getActiveDocument: function(rootDoc)
	{
		if (!rootDoc)
			rootDoc = DomUtils.getWindow().document; //document;

		/*
		 var selection = rootDoc.getSelection();
		 if (selection)  // the direct child of selection is active document
		 {
		 var node = selection.focusNode;
		 if (node)
		 return node.ownerDocument;
		 }
		 */

		var result;
		var activeElem = rootDoc.activeElement;
		//console.log('activeElem', activeElem.tagName, activeElem);
		var tagName = activeElem.tagName.toLowerCase();
		if (tagName === 'iframe' || tagName === 'frame')  // may contain child window
		{
			result = DomUtils.getActiveDocument(activeElem.contentDocument);
		}
		return result || rootDoc;
	},
	// Returns active element. Iframe/frame is considered.
	getActiveElem: function(rootDoc)
	{
		var doc = DomUtils.getActiveDocument(rootDoc);
		return doc.activeElement;
	},
	// Return if an active element's isContentEditable property is true.
	isActiveElemEditable: function(rootDoc)
	{
		var elem = DomUtils.getActiveElem(rootDoc);
		return (elem && elem.isContentEditable);
	}
};

var SelectionUtils = {
	/**
	 * Check if an element is related to chem object viewer.
	 * @param elem
	 */
	isChemObjElem: function(elem)
	{
		var widgetClass = elem.getAttribute('data-widget') || elem.getAttribute('data-kekule-widget');
		if (widgetClass && widgetClass.indexOf('Kekule.ChemWidget.Viewer') >= 0)
			return true;
		else
			return false;
	},
	/**
	 * If selection containing only one element, returns it.
	 * Otherwise returns null.
	 * @param {Selection} selection
	 */
	getSingleSelectedElem: function(selection)
	{
		var result = null;
		var rangeCount = selection.rangeCount;
		if (rangeCount === 1)
		{
			var range = selection.getRangeAt(0);
			if (range.startContainer === range.endContainer && range.startContainer.nodeType === Node.ELEMENT_NODE && !range.collapsed)
			{
				if (range.endOffset - range.startOffset === 1)
					result = range.startContainer.childNodes[range.startOffset];
			}
		}
		return result;
	},
	/**
	 * If selection select only one chem obj element, returns its related attribs.
	 * @param {Selection} selection
	 */
	getSelChemObjElemAttribs: function(selection)
	{
		var result = null;
		var elem = SelectionUtils.getSingleSelectedElem(selection);
		if (elem && SelectionUtils.isChemObjElem(elem))
		{
			result = {};
			for (var i = 0, l = elem.attributes.length; i < l; ++i)
			{
				var attrib = elem.attributes[i];
				var name = attrib.name;
				result[name] = attrib.value;
			}
			// width & height
			if (!result.width || !result.height)
			{
				var dim = elem.getBoundingClientRect();
				result.width = dim.width;
				result.height = dim.height;
			}
		}
		return result;
	}
};


var ChemObjElemInserter = {
	getUeEditorInstance: function(rootWindow, editDoc)
	{
		var instances = rootWindow.UE.instants;
		if (instances)
		{
			for (var prop in instances)
			{
				if (instances[prop].document === editDoc)
					return instances[prop];
			}
		}
		return null;
	},

	// Create an img element to display chem viewer
	createChemObjElem: function(doc, imgAttribs)
	{
		var result = doc.createElement('img');
		for (var prop in imgAttribs)
		{
			var value = imgAttribs[prop];
			result.setAttribute(prop, value);
		}
		return result;
	},
	// get HTML code of chem viewer element
	createChemObjElemHtml: function(doc, imgAttribs)
	{
		var result = "<img ";
		for (var prop in imgAttribs)
		{
			var value = imgAttribs[prop];
			result += (prop + "='" + value + "' ");
		}
		result += " />";
		return result;
	},

	// insert chem object element defined by attribs to doc.
	// If successful, returns true
	insertChemObjToDocument: function(doc, imgAttribs)
	{
		var result = false;
		var currWin = doc.defaultView;
		var selection = doc.getSelection();
		var range;

		if (selection && selection.rangeCount)
		{
			var endNode = selection.focusNode;
			var parentElem = (endNode.nodeType === Node.TEXT_NODE) ? endNode.parentNode : endNode;
			if (parentElem.isContentEditable)  // is in editable area, remove selection and try insert again
			{
				doc.execCommand('delete');
				selection = doc.getSelection();
			}
		}

		if (selection && selection.rangeCount)
		{
			range = selection.getRangeAt(selection.rangeCount - 1);
		}
		else if (currWin && currWin.UE) // using UE editor, workaround
		{
			var uEditor = ChemObjElemInserter.getUeEditorInstance(currWin, doc);
			if (uEditor)
			{
				range = uEditor.selection._bakRange;
				//console.log('is UE', range);
			}
		}

		if (range)
		{
			var endNode = range.endContainer;
			if (endNode)
			{
				if (!parentElem)
					parentElem = (endNode.nodeType === Node.TEXT_NODE) ? endNode.parentNode : endNode;
				var imgElem = ChemObjElemInserter.createChemObjElem(doc, imgAttribs);
				var offset = range.endOffset;
				//console.log('create img', endNode, imgElem);

				if (endNode.nodeType === Node.TEXT_NODE)
				{
					var text = endNode.textContent;

					var prevText = text.substr(0, offset);
					var remainText = text.substr(offset);

					if (prevText && remainText)  // insert one between two part of texts
					{
						endNode.textContent = remainText;
						parentElem.insertBefore(imgElem, endNode);
						var newTextNode = doc.createTextNode(prevText);
						parentElem.insertBefore(newTextNode, imgElem);
					}
					else if (remainText)  // insert before text node
					{
						parentElem.insertBefore(imgElem, endNode);
					}
					else // append after text node
					{
						var sibling = endNode.nextSibling;
						if (sibling)
							parentElem.insertBefore(imgElem, sibling);
						else
							parentElem.appendChild(imgElem);
					}
				}
				else  // focus node is a element, parent of current selection
				{
					var nextElem = parentElem.childNodes[offset];
					if (nextElem)
						parentElem.insertBefore(imgElem, nextElem);
					else
						parentElem.appendChild(imgElem);
				}
				result = true;
			}
		}
		else  // can not find selection, maybe in editable mode?
		{
			var activeElem = doc.activeElement;
			if (activeElem)
			{
				//console.log('active element editable', activeElem.isContentEditable);
				if (activeElem.isContentEditable)  // insert throw command
				{
					var sImgCode = ChemObjElemInserter.createChemObjElemHtml(doc, imgAttribs);
					//console.log('insert img code', sImgCode);
					var ret = doc.execCommand('insertHTML', sImgCode);
					if (!ret)  // still can not insert, just append to tail
					{
						var imgElem = ChemObjElemInserter.createChemObjElem(doc, imgAttribs);
						activeElem.appendChild(imgElem);
					}
					result = true;
				}
				else  // not editable, append to tail
				{
					var imgElem = ChemObjElemInserter.createChemObjElem(doc, imgAttribs);
					activeElem.appendChild(imgElem);
					result = true;
				}
			}
		}
		return result;
	}
};



// "self" is a global object in content scripts
// Listen for event
self.port.on(/*"insertChemObjElem"*/globalConsts.MSG_INS_CHEMOBJ_ELEM_REQUEST, function(msg)
{
	var resultMsg;
	try
	{
		var doc = DomUtils.getActiveDocument(DomUtils.getWindow().document);
		var result = ChemObjElemInserter.insertChemObjToDocument(
			doc,
			msg.attribs);
		//doc.defaultView.postMessage({'msg': globalConsts.MSG_INJECTION_DETECT_REQUEST}, '*'); // can not send object message in worker, otherwise causes exception
		doc.defaultView.postMessage(globalConsts.MSG_INJECTION_DETECT_REQUEST, '*');
	}
	catch(e)
	{
		result = false;
		resultMsg = e.message;
		//throw e;
	}
	// response to addon
	//console.log('response', result, resultMsg, globalConsts.MSG_INJECTION_DETECT_REQUEST);
	self.port.emit(globalConsts.MSG_INS_CHEMOBJ_ELEM_RESPONSE, {'success': result, 'message': resultMsg});
});
self.port.on(/*'queryActiveElemEditable.request'*/globalConsts.MSG_QUERY_ACTIVE_ELEM_EDITABLE_REQUEST, function(msg)
{
	var result = DomUtils.isActiveElemEditable();
	self.port.emit(/*'queryActiveElemEditable.response'*/globalConsts.MSG_QUERY_ACTIVE_ELEM_EDITABLE_RESPONSE, {'editable': result});
});
self.port.on(/*'querySelChemObjElemAttribs.request'*/globalConsts.MSG_QUERY_SEL_CHEMOBJ_ELEM_ATTRIBS_REQUEST, function(msg)
{
	var doc = DomUtils.getActiveDocument(DomUtils.getWindow().document);
	var selection = doc.getSelection();
	var attribs = SelectionUtils.getSelChemObjElemAttribs(selection);
	self.port.emit(/*'querySelChemObjElemAttribs.response'*/globalConsts.MSG_QUERY_SEL_CHEMOBJ_ELEM_ATTRIBS_RESPONSE, {'attribs': attribs});
});
self.port.on(globalConsts.MSG_QUERY_SEL_ELEM_INFO_REQUEST, function(msg){
	var doc = DomUtils.getActiveDocument(DomUtils.getWindow().document);
	var selection = doc.getSelection();
	var attribs = SelectionUtils.getSelChemObjElemAttribs(selection);
	var editable = DomUtils.isActiveElemEditable();
	self.port.emit(globalConsts.MSG_QUERY_SEL_ELEM_INFO_RESPONSE, {'attribs': attribs, 'editable': editable});
});

})(self);