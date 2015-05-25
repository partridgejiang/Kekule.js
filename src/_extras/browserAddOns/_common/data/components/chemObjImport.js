(function(addon)
{
/**
 * JS object corresponding to chemObjImport.html
 * @object
 */
var FormChemObjImport = {
	idChemObjInserter: 'chemObjInserter',
	idButtonPanel: 'buttonPanel',
	idButtonOk: 'btnOk',
	idButtonCancel: 'btnCancel',
	idContainer: 'container',
	panelExtraPadding: 10,
	getChemObjInserter: function()
	{
		return Kekule.Widget.getWidgetById(F.idChemObjInserter);
	},
	getChemViewer: function()
	{
		return F.getChemObjInserter().getViewer();
	},
	// Whether current 3D tab selected
	isActiveOn3D: function()
	{
		return F.getChemObjInserter().getIs3D();
	},

	getButtonPanel: function()
	{
		return Kekule.Widget.getWidgetById(F.idButtonPanel);
	},
	getContainerElem: function()
	{
		return document.getElementById(F.idContainer);
	},

	// Create a new element to display current chem object
	createInsertTargetElem: function(doc)
	{
		var objSetter = F.getChemObjInserter();
		return objSetter.createExportImgElement(doc);
	},

	loadChemObjElemAttribs: function(attribs)
	{
		var inserter = F.getChemObjInserter();
		//console.log('receive response', attribs);
		if (attribs)
			inserter.importFromElemAttribs(attribs);
		// If no curr selected chemObj, retain last one in viewer
		/*
		else
			inserter.setChemObj(null);
		*/
	},

	//
	submit: function()
	{
		if (addon)
		{
			var objInserter = F.getChemObjInserter();

			var elemAttribs = objInserter.getChemObj()? objInserter.getExportImgElemAttributes(): null;
			addon.port.emit(/*'submit'*/globalConsts.MSG_SUBMIT_REQUEST, {'attribs': elemAttribs});
		}
	},
	cancel: function()
	{
		if (addon)
		{
			addon.port.emit(/*'cancel'*/globalConsts.MSG_CANCEL);
		}
	},

	// resize inserter widget
	resizeWidget: function(size)
	{
		if (size && size.width && size.height)
			F.getChemObjInserter().setContextDimension(size);
	},
	// calc the proper size for view to contain all widgets
	getMinContainerSize: function()
	{
		var padding = Kekule.StyleUtils.getComputedStyle(document.body, 'padding-left');
		var pvalue = Kekule.StyleUtils.analysisUnitsValue(padding);
		padding = (pvalue.value || 0); // * 2;
		//console.log(padding);
		padding += F.panelExtraPadding;
		/*
		var dimBtnPanel = F.getButtonPanel().getDimension();
		var dimInserter = F.getChemObjInserter().getDimension();
		return {'width': dimInserter.width + padding, 'height': dimBtnPanel.bottom + padding};
		*/
		var dim = Kekule.HtmlElementUtils.getElemBoundingClientRect(F.getContainerElem());
		return {'width': dim.right + padding, 'height': dim.bottom + padding};
	},
	// send message to tell resize container panel to fit widget size
	requestResizeContainer: function(forceResize)
	{
		if (addon)
		{
			var requestDim = F.getMinContainerSize();
			//var dimInserter = F.getChemObjInserter().getContextDimension();
			//var viewportDim = Kekule.HtmlElementUtils.getViewportDimension(document);
			if (requestDim.width || requestDim.height)
				addon.port.emit(/*'resizeContainer'*/globalConsts.MSG_RESIZE_CONTAINER,
					{'width': requestDim.width, 'height': requestDim.height});
			//console.log('request resize', forceResize, dim);
		}
	},

	// auto size form, fit the view
	fitContainerView: function()
	{
		var dim = Kekule.HtmlElementUtils.getViewportDimension(document);
		F.getChemObjInserter().setDimension(dim.width, dim.height - 40);
		//console.log('fit view', dim);
	},
	// if not editable in content page, show warning information
	displayContentEditableInfo: function(editable)
	{
		var s = editable? '': Kekule.$L('BrowserAddonTexts.LABEL_TARGET_NOT_EDITABLE');
		var sclass = editable? 'Hidden': 'Warning';
		var elem = document.getElementById('info');
		elem.innerHTML = s;
		elem.className = sclass;
	},

	_init: function()
	{
		/*
		console.log('init');
		F.fitContainerView();
		*/
		F._initEventListeners();
		F.getChemObjInserter().addEventListener('resize', function(e) { F.requestResizeContainer(); });
		Kekule.Widget.getWidgetById(F.idButtonOk).setText(Kekule.$L('WidgetTexts.CAPTION_OK')).addEventListener('execute', F.submit);
		Kekule.Widget.getWidgetById(F.idButtonCancel).setText(Kekule.$L('WidgetTexts.CAPTION_CANCEL')).addEventListener('execute', F.cancel);
	},

	_initEventListeners: function()
	{
		if (addon)
		{
			addon.port.on(globalConsts.MSG_ERROR, function(msg) { Kekule.error(msg.message || Kekule.$L('ErrorMsg.UNABLE_TO_INSERT_ELEM')); } );
			// each time when showing, need to adjust panel size
			addon.port.on(/*'show'*/globalConsts.MSG_SHOW, function() { F.requestResizeContainer(true); } );
			//
			addon.port.on(globalConsts.MSG_RESIZE_WIDGET, function(msg) { F.resizeWidget(msg); } );
			//
			addon.port.on(globalConsts.MSG_STORE_WIDGET_PROP_REQUEST, function() {
				var inserter = F.getChemObjInserter();
				var dimContext = inserter.getContextDimension();
				addon.port.emit(/*'submit'*/globalConsts.MSG_STORE_WIDGET_PROP_RESPONSE, {
					'size': dimContext,
					'autoSizeExport': inserter.getAutoSizeExport(),
					'autofit': inserter.getAutofit(),
					'backgroundColor2D': inserter.getBackgroundColor2D(),
					'backgroundColor3D': inserter.getBackgroundColor3D()
				});
			});
			// load chem obj by attribs
			addon.port.on(/*'loadChemObjElemAttribs'*/globalConsts.MSG_LOAD_CHEMOBJ_ELEM_ATTRIBS, function(msg) {
				F.loadChemObjElemAttribs(msg && msg.attribs);
				F.displayContentEditableInfo(msg && msg.editable);
			});
		}
	}
};
var F = FormChemObjImport;

Kekule.X.domReady(FormChemObjImport._init);


})(this.addon);