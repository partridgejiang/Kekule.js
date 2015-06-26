console.log('[JS file injected]');

function insertText(text)
{
	var currElem = document.activeElement;
	var newElem = document.createElement('span');
	newElem.innerHTML = text;
	currElem.appendChild(newElem);
}

chrome.extension.onMessage.addListener(function(message, sender, sendResponse){
	console.log('msg received', message);
	if(message.msg == 'insertText'){
		insertText(message.data);
		sendResponse('text inserted');
	}
});