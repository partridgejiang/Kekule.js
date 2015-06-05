/**
 * Specified code related to Firefox addon.
 */

(function(addon)
{
	if (addon)
	{
		var F = ClientForms.FormChemObjImport;

		F.AddonImpl = {
			submit: function()
			{
				var objInserter = F.getChemObjInserter();
				var elemAttribs = objInserter.getChemObj() ? objInserter.getExportImgElemAttributes() : null;
				MsgUtils.emitRequest(addon.port, globalConsts.MSG_SUBMIT, {
					'data': {'attribs': elemAttribs, 'isModify': F.isModify}
				});
			},
			cancel: function()
			{
				addon.port.emit(globalConsts.MSG_CANCEL);
			},
			requestResizeContainer: function(forceResize)
			{
				var requestDim = F.getMinContainerSize();
				if (requestDim.width || requestDim.height)
					addon.port.emit(globalConsts.MSG_RESIZE_CONTAINER,
						{'width': requestDim.width, 'height': requestDim.height});
			},
			_initEventListeners: function()
			{
				addon.port.on(globalConsts.MSG_ERROR, function(msg) { Kekule.error(msg.message || Kekule.$L('ErrorMsg.UNABLE_TO_INSERT_ELEM')); } );
				// each time when showing, need to adjust panel size
				addon.port.on(/*'show'*/globalConsts.MSG_SHOW, function() {
					F.requestResizeContainer(true);
					//F.isModify = false;
				} );
				//
				addon.port.on(globalConsts.MSG_RESIZE_WIDGET, function(msg) { F.resizeWidget(msg); } );
				addon.port.on(globalConsts.MSG_RESTORE_WIDGET_PROP, function(msg) { F.restoreWidgetProps(msg); } );
				//
				MsgUtils.onRequest(addon.port, globalConsts.MSG_STORE_WIDGET_PROP, function(){
					var data = F.getWidgetStorageData();
					MsgUtils.emitResponse(addon.port, globalConsts.MSG_STORE_WIDGET_PROP, data);
				});
				// load chem obj by attribs
				addon.port.on(/*'loadChemObjElemAttribs'*/globalConsts.MSG_LOAD_CHEMOBJ_ELEM_ATTRIBS, function(msg) {
					F.loadChemObjElemAttribs(msg && msg.attribs);
					F.displayContentEditableInfo(msg && msg.editable);
				});
			},

			_init: function()
			{
				// remove explicit class of body, as it is only used in Chrome
				document.body.className = '';
			}
		};
	}
})(this.addon);