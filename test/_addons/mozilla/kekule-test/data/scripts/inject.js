/**
 * Created by Partridge on 2015/5/11.
 * File to insert element in content document.
 */

//if (!this.__$kekuleInjected__)
{
	(function()
	{

		console.log('INJECTED inject.js');

		function getUeEditorInstance(rootWindow, editDoc)
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
		}

		function createChemObjElem(doc, imgAttribs)
		{
			var result = doc.createElement('img');
			/*
			result.src = imgDataUri;
			result.setAttribute('data-chem-obj', objData);
			*/
			for (var prop in imgAttribs)
			{
				var value = imgAttribs[prop];
				//if (typeof(value) === 'string')
				result.setAttribute(prop, value);
			}
			return result;
		}

		function createChemObjElemCode(doc, imgAttribs)
		{
			//var result = "<img src='" + imgDataUri + "' data-chem-obj='" + objData + "' />";
			var result = "<img ";
			for (var prop in imgAttribs)
			{
				var value = imgAttribs[prop];
				//if (typeof(value) === 'string')
				result += (prop + "='" + value + "' ");
			}
			result += " />";
			return result;
		}

		function getActiveDocument(rootDoc)
		{
			if (!rootDoc)
				rootDoc = document;
			var result;
			var activeElem = rootDoc.activeElement;
			var tagName = activeElem.tagName.toLowerCase();
			if (tagName === 'iframe' || tagName === 'frame')  // may contain child window
			{
				result = getActiveDocument(activeElem.contentDocument);
			}
			return result || rootDoc;
		}

		function insertChemObjToDocument(doc, imgAttribs)
		{
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
			else if (unsafeWindow.UE) // using UE editor, workaround
			{
				var uEditor = getUeEditorInstance(unsafeWindow, doc);
				if (uEditor)
				{
					range = uEditor.selection._bakRange;
					console.log('is UE', range);
				}
			}


			if (range)
			{
				//if (range)
				{
					var endNode = range.endContainer;
					if (endNode)
					{
						if (!parentElem)
							parentElem = (endNode.nodeType === Node.TEXT_NODE) ? endNode.parentNode : endNode;
						var imgElem = createChemObjElem(doc, imgAttribs);
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
					}
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
						var sImgCode = createChemObjElemCode(doc, imgAttribs);
						//console.log('insert img code', sImgCode);
						var result = doc.execCommand('insertHTML', sImgCode);
						if (!result)  // still can not insert, just append to tail
						{
							var imgElem = createChemObjElem(doc, objData, imgDataUri);
							activeElem.appendChild(imgElem);
						}
					}
				}
			}
		}

		// "self" is a global object in content scripts
		// Listen for a "drawBorder"
		self.port.on("insert", function(msg)
		{
			insertChemObjToDocument(getActiveDocument((unsafeWindow || window).document), msg);
		});

	})();

	//this.__$kekuleInjected__ = true;
}