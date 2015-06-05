/**
 * Background JS page for Chrome extension.
 */

function sendMessageToActiveTab(msg, callback)
{
	chrome.tabs.getSelected(null, function(tab) {
		chrome.tabs.sendMessage(tab.id, msg, callback)
	});
}


// define context menus
function createModifyChemObjMenu()
{
	return chrome.contextMenus.create({
		type: 'normal',
		title: globalConsts.CAPTION_MENU_MODIFY_CHEMOBJ,
		id: 'modifyChemObj',
		contexts: ['all', 'page', 'selection', 'link', 'editable'],
		onclick: function()
		{
			sendMessageToActiveTab({'message': globalConsts.MSG_SELECT_CHEMOBJ_ELEM_AND_MODIFY});
		}
	});
}
var menuModifyChemObj = createModifyChemObjMenu();

chrome.extension.onMessage.addListener(function(msg, sender, sendResponse){
	console.log('msg in back', msg);
	if (msg.message === globalConsts.MSG_SET_CONTEXT_MENU)  // adjust context menu
	{
		var isModify = !!msg.isModify;
		chrome.contextMenus.update(menuModifyChemObj, {'enabled': isModify});
		/*
		if (isModify)  // add menu
		{
			if (!menuModifyChemObj)
			{
				menuModifyChemObj = createModifyChemObjMenu();
			}
		}
		else  // remove menu
		{
			if (menuModifyChemObj)
			{
				chrome.contextMenus.remove(menuModifyChemObj);
				menuModifyChemObj = null;
			}
		}
		*/
	}
	else if (msg.message === globalConsts.MSG_SHOW)  // require to show popup
	{
		var url = chrome.extension.getURL('/data/components/chemObjImport.html');
		console.log(url);
		chrome.windows.create({'url': url, 'type': 'popup'});
	}
});
