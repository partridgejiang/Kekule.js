(function()
{
	var DEF_WIDTH = 400;
	var DEF_HEIGHT = 400;

	var idChemObjSetter = 'chemObjSetter';

	function getChemObjSetter()
	{
		return Kekule.Widget.getWidgetById(idChemObjSetter);
	}

	// Whether current 3D tab selected
	function isActiveOn3D()
	{
		return getChemObjSetter().getIs3D();
	}

	function createImgExportViewer(doc/*, chemObj, is3D*/)
	{
		/*
		var viewerClass = is3D? Kekule.ChemWidget.Viewer3D: Kekule.ChemWidget.Viewer2D;
		var viewer = new viewerClass(doc);
		viewer.setAutoSize(!is3D).setAutofit(is3D);
		if (is3D)
			viewer.setDimension(DEF_WIDTH, DEF_HEIGHT);
		viewer.setChemObj(chemObj);
		viewer.setVisible(false);
		return viewer;
		*/
		var objSetter = getChemObjSetter();
		return objSetter.createExportImgElement(doc);
	};

	// Returns active chem object displayer widget:
	// composer of 2D or chemViewer of 3D
	function getActiveDisplayer()
	{
		return isActiveOn3D()? getViewer3D(): getComposer2D().getEditor();
	}
	// Returns chem object in active chem displayer
	function getExportChemObj()
	{
		var displayer = getActiveDisplayer();
		return displayer && displayer.getSavingTargetObj();
	}

	/*

	*/
	var that = this;
	var oldOpenFilePicker;
	/*
	function openFilePicker(doc, callback)
	{
		console.log('send require open dialog');
		//var result = oldOpenFilePicker(doc, callback);
		that.addon.port.emit('requireOpenDialog');
		//return result;
	}
	*/
	function loadFileData(doc, callback, options)
	{
		loadDataViaFilePicker(doc, callback, options);
	}
	function loadDataViaFilePicker(doc, callback, options)
	{
		loadDataViaFilePicker.callback = callback;
		console.log('send require open dialog');
		that.addon.port.emit('requireOpenFileData', {'options': options});
	}

	if (this.addon)
	{
		this.addon.port.on("fileLoad", function (msg)
		{
			console.log('fileLoaded', msg.result, msg.fileName, msg.file);
			/*
			var viewer = Kekule.Widget.getWidgetById('chemObjSetter').getViewer();
			viewer.loadFromData(msg.data, null, msg.fileName);
			*/
			if (loadDataViaFilePicker.callback)
				loadDataViaFilePicker.callback(msg.result, msg.data, msg.fileName);
		});
	}

	function replaceFileProcessMethods()
	{
		var NS = Kekule.NativeServices;
		NS.doLoadFileData = loadFileData;
	}


	function init()
	{
		//console.log('OLD FileOPen', Kekule.ActionFileOpen.openFilePicker);

		replaceFileProcessMethods();

		var setter = getChemObjSetter();
		/*
		var toolButtons = setter.getToolButtons() || setter.getViewer().getDefaultToolBarButtons();
		var AU = Kekule.ArrayUtils;
		var BNS = Kekule.ChemWidget.ComponentWidgetNames;
		var index = toolButtons.indexOf(BNS.loadData);
		if (index >= 0)
			toolButtons[index] = BNS.loadFile;
		else
			toolButtons.unshift(BNS.loadFile);
		setter.setToolButtons(toolButtons);
		*/
		setter.getViewer().getElement().setAttribute('tooltip', 'My Viewer');


		getChemObjSetter().addEventListener('load', function(e)
		{
			console.log('chem obj loaded');
			this.addon.port.emit('chemObjLoaded' /*{'obj': getChemObjSetter().getChemObj()}*/);
		}, this);
		Kekule.Widget.getWidgetById('btnOk').addEventListener('execute', done);
		Kekule.Widget.getWidgetById('btnCancel').addEventListener('execute', cancel);
	};

	Kekule.X.domReady(init);


	if (this.addon)
	{
		function done()
		{
			var objSetter = getChemObjSetter();
			var imgAttribs = objSetter.getExportImgElemAttributes();
			this.addon.port.emit("done", imgAttribs);

			// snap chem object image first
			/*
			var exportViewer = createImgExportViewer(document, obj, is3D);
			exportViewer.appendToElem(document.body);

			var that = this;

			// delay call the following process, allow object to be rendered
			setTimeout(function()
				{
					var dataUrl = exportViewer.exportToDataUri();
					//var dimension = exportViewer.getBoundingClientRect();

					var imgData= dataUrl;
					var msg = {
						'is3D': isActiveOn3D(),
						'objData': objData,
						'imgData': imgData
					};
					that.addon.port.emit("done", msg);
				}, 50
			);
			*/
		}

		function cancel()
		{
			if (this.addon)
				this.addon.port.emit("cancel");
		};


		this.addon.port.on("fileLoad", function (msg)
		{
			console.log('fileLoaded', msg.fileName, msg.file);
			var viewer = Kekule.Widget.getWidgetById('chemObjSetter').getViewer();
			viewer.loadFromData(msg.data, null, msg.fileName);
		});

		// Listen for the "show" event being sent from the
		// main add-on code. It means that the panel's about
		// to be shown.
		this.addon.port.on("show", function onShow()
		{
			console.log('Panel shown!!!');
		});
	}

})();