function getChemObjSetter()
{
	return Kekule.Widget.getWidgetById(idChemObjSetter);
}

// Whether current 3D tab selected
function isActiveOn3D()
{
	return getChemObjSetter().getIs3D();
}

function done()
{
	chrome.tabs.getSelected(null, function(tab) {
		chrome.tabs.sendMessage(tab.id, {'msg': 'insertText', 'data': 'Hello Kekule'}, function(response){
			console.log('msg send', response);
		});
	});
}

function init()
{
	Kekule.Widget.getWidgetById('btnOk').addEventListener('execute', done);
}

Kekule.X.domReady(init);
