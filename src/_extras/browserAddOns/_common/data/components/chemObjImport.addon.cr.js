/**
 * Specified code related to Chrome addon.
 */

(function(win){

	function sendMessageToActiveTab(msg, callback)
	{
		chrome.tabs.getSelected(null, function(tab) {
			chrome.tabs.sendMessage(tab.id, msg, callback)
		});
	}

	var widgetStoreField = 'chemObjInserterProps';

	var F = ClientForms.FormChemObjImport;

	F.Utils = {
		queryCurrSelElemOnContent: function()
		{
			sendMessageToActiveTab({
					'message': globalConsts.MSG_QUERY_SEL_ELEM_INFO
				},
				function(result)
				{
					//console.log('query result', result);
					F.loadChemObjElemAttribs(result && result.attribs);
					F.displayContentEditableInfo(result && result.editable);
				});
		},

		storeWidgetProps: function()
		{
			var data = F.getWidgetStorageData();
			console.log('store infos', data);
			var s = JSON.stringify(data);
			localStorage.setItem(widgetStoreField, s);
		},
		restoreWidgetProps: function()
		{
			var s = localStorage.getItem(widgetStoreField);
			var data = JSON.parse(s);
			console.log('restore widget', data);
			if (data)
				F.restoreWidgetProps(data);
		}
	}

	F.AddonImpl = {

		submit: function()
		{
			var objInserter = F.getChemObjInserter();
			var elemAttribs = objInserter.getChemObj() ? objInserter.getExportImgElemAttributes() : null;

			if (elemAttribs)
			{
				sendMessageToActiveTab({
						'message': globalConsts.MSG_INS_CHEMOBJ_ELEM,
						'data': {'attribs': elemAttribs, 'isModify': F.isModify}
					},
					function(result)
					{
						if (result.success)
						{
							console.log('success');
							win.close();
						}
						else // error occurs
						{
							Kekule.error(result.message);
						}
					});
			}
		},
		cancel: function()
		{
			win.close();
		},

		_initEventListeners: function()
		{
			//console.log('init event listeners');

			/* use unload to save state of popup seems unusable in Chrome
			win.addEventListener('unload', function(){
				sendMessageToActiveTab({
					'message': 'popup unload'
				});
				FU.storeWidgetProps();
			});
			*/
			var inserter = F.getChemObjInserter();
			inserter.addEventListener('resize', function(e) { FU.storeWidgetProps(); });
			inserter.addEventListener('configSave', function(e) { FU.storeWidgetProps(); });
		},
		_init: function()  // called each time when dom is ready (that is to say, each time the popup panel is opened)
		{
			//console.log('init');
			FU.queryCurrSelElemOnContent();
			FU.restoreWidgetProps();
		}
	};
	var FU = F.Utils;
	var FI = F.AddonImpl;

})(window);