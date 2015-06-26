chrome.extension.onRequest.addListener(function(message, sender, sendResponse){
	console.log('msg received', message, sender);
	/*
	if(message.msg == 'insertText'){
		sendResponse('background received');
		chrome.extension.sendRequest(message, function(response){

		});
	}
	*/
});
