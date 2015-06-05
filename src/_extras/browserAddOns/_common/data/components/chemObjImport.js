(function()
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

	// a special mark, whether the panel currently is used to modify an existing chem obj element
	isModify: false,

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
		{
			F.isModify = true;
			inserter.importFromElemAttribs(attribs);
		}
		else  //
			F.isModify = false;
		// If no curr selected chemObj, retain last one in viewer
		/*
		else
			inserter.setChemObj(null);
		*/
	},

	//
	submit: function()
	{
		if (F.AddonImpl && F.AddonImpl.submit)
			F.AddonImpl.submit();
	},
	cancel: function()
	{
		if (F.AddonImpl && F.AddonImpl.cancel)
			F.AddonImpl.cancel();
	},

	// resize inserter widget
	resizeWidget: function(size)
	{
		if (size && size.width && size.height)
			F.getChemObjInserter().setContextDimension(size);
	},
	// return object that contains the essential data that should be stored
	getWidgetStorageData: function()
	{
		var inserter = F.getChemObjInserter();
		var dimContext = inserter.getContextDimension();
		var chemObj = inserter.getChemObj();
		var sObjJson = chemObj? Kekule.IO.saveMimeData(chemObj, 'chemical/x-kekule-json'): undefined;
		return {
			'chemObj': sObjJson,
			'renderType': inserter.getRenderType(),
			'size': dimContext,
			'autoSizeExport': inserter.getAutoSizeExport(),
			'autofit': inserter.getAutofit(),
			'backgroundColor2D': inserter.getBackgroundColor2D(),
			'backgroundColor3D': inserter.getBackgroundColor3D()
		};
	},
	// restore widget properties from data
	restoreWidgetProps: function(data)
	{
		var inserter = F.getChemObjInserter();
		if (data)
		{
			if (data.chemObj)
			{
				var obj = Kekule.IO.loadMimeData(data.chemObj, 'chemical/x-kekule-json');
				inserter.setChemObj(obj || null);
			}
			else
				inserter.setChemObj(null);
			if (data.renderType)
				inserter.setRenderType(data.renderType);
			if (data.size)
				inserter.setContextDimension(data.size);
			if (data.autoSizeExport !== undefined)
				inserter.setAutoSizeExport(!!data.autoSizeExport);
			if (data.autofit !== undefined)
				inserter.setAutofit(!!data.autofit);
			if (data.backgroundColor2D)
				inserter.setBackgroundColor2D(data.backgroundColor2D);
			if (data.backgroundColor3D)
				inserter.setBackgroundColor3D(data.backgroundColor3D);
		}
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
		if (F.AddonImpl && F.AddonImpl.requestResizeContainer)
			F.AddonImpl.requestResizeContainer(forceResize);
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

	// called after inserter is resized
	inserterResized: function()
	{
		F.requestResizeContainer()
	},
	// called after inserter's config has been changed by configurator
	inserterConfigSaved: function()
	{
		// do nothing here
	},

	_init: function()
	{
		/*
		console.log('init');
		F.fitContainerView();
		*/
		F._initEventListeners();
		var inserter = F.getChemObjInserter();
		inserter.addEventListener('resize', function(e) { F.inserterResized(); });
		inserter.addEventListener('configSave', function(e) { F.inserterConfigSaved(); });
		Kekule.Widget.getWidgetById(F.idButtonOk).setText(Kekule.$L('WidgetTexts.CAPTION_OK')).addEventListener('execute', F.submit);
		Kekule.Widget.getWidgetById(F.idButtonCancel).setText(Kekule.$L('WidgetTexts.CAPTION_CANCEL')).addEventListener('execute', F.cancel);

		if (F.AddonImpl && F.AddonImpl._init)
			F.AddonImpl._init();
	},

	_initEventListeners: function()
	{
		if (F.AddonImpl && F.AddonImpl._initEventListeners)
			F.AddonImpl._initEventListeners();
	}
};
var F = FormChemObjImport;
ClientForms.FormChemObjImport = F;

Kekule.X.domReady(FormChemObjImport._init);


})();