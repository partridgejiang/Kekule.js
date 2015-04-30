(function(){

	var ID_KCHEMDISPLAYER = 'kChemDisplayer';
	var DEF_WIDTH = 300;
	var DEF_HEIGHT = 300;

	var getDisplayerId = function(is3D)
	{
		var suffix = is3D? '3D': '2D';
		return ID_KCHEMDISPLAYER + suffix;
	};
	var getViewerWidgetName = function(is3D)
	{
		return is3D? 'Kekule.ChemWidget.Viewer3D': 'Kekule.ChemWidget.Viewer2D';
	};

	var createImgExportViewer = function(doc, chemObj, is3D)
	{
		var viewerClass = is3D? Kekule.ChemWidget.Viewer3D: Kekule.ChemWidget.Viewer2D;
		var viewer = new viewerClass(doc);
		viewer.setAutoSize(!is3D).setAutofit(is3D);
		if (is3D)
			viewer.setDimension(DEF_WIDTH, DEF_HEIGHT);
		viewer.setChemObj(chemObj);
		viewer.setVisible(false);
		return viewer;
	};

	var getDialogElements = function(is3D, editor)
	{
		var id = getDisplayerId(is3D);
		var coreHtml = is3D?
			'<div id="' + id + '" style="width:600px;height:400px;position:relative" ' +
				'data-kekule-widget="Kekule.ChemWidget.Viewer3D" ' +
				'data-predefined-setting="fullFunc" data-auto-size="false" ' +
				'data-toolbar-evoke-modes="[0]"' +
				'></div>':
			/*
			'<div id="' + id + '" style="width:600px;height:400px;position:relative" ' +
				'data-kekule-widget="Kekule.ChemWidget.Viewer2D" ' +
				'data-predefined-setting="fullFunc" data-auto-size="false" ' +
				'data-toolbar-evoke-modes="[0]"' +
				'></div>';
			*/
			'<div id="' + id + '" style="width:680px;height:400px;position:relative" ' +
				'data-kekule-widget="Kekule.Editor.Composer" ' +
				'></div>';
		var sLabelText = is3D? editor.lang.kekule.label_load_mol3D: editor.lang.kekule.label_load_or_edit_mol2D;
		var labelElemHtml = '<label class="K-CKEditor-Label	">' + sLabelText + ':</label>';
		return [
			{
				type: 'html',
				html: labelElemHtml + '\n' + coreHtml
			}
		];
	};
	//var autoLaunchInited = false;
	var getDialogDefinition = function(editor, is3D)
	{
		var sTitle = is3D? editor.lang.kekule.caption_ins_mol3D: editor.lang.kekule.caption_ins_mol2D;
		return  {
			title: sTitle, //'Insert Molecule',
			resizable: CKEDITOR.DIALOG_RESIZE_NONE,
			minWidth: 500,
			minHeight: 300,
			contents: [
				{
					id: 'tab1',
					label: 'Set Chem Object',
					title: 'Set Chem Object',
					expand: true,
					padding: 0,
					elements: getDialogElements(is3D, editor)
				}
			],
			buttons: [ CKEDITOR.dialog.okButton, CKEDITOR.dialog.cancelButton ],
			onShow: function()
			{
				var chemObj = null;
				/*
				// as Kekule.js is add to HTML dynamicly, so Widget.autoLauncher may not affect on dialog
				if (!autoLaunchInited)
					Kekule.Widget.autoLauncher.execute(document.body);
				*/
				// if editor has selection and selection is a chem viewer, load content
				var selElem = editor.getSelection().getSelectedElement();
				if (selElem)
				{
					var widgetName = selElem.getAttribute('data-kekule-widget');
					if (widgetName && widgetName === getViewerWidgetName(is3D))
					{
						var json = selElem.getAttribute('data-chem-obj');
						if (json)
						{
							try
							{
								var jsonObj = JsonUtility.parse(json);
								if (jsonObj)
								{
									var chemObj = ObjSerializerFactory.getSerializer('json').load(null, jsonObj);
								}
							}
							catch(e)
							{
								chemObj = null;
							}
						}
					}
				}

				// if 2D, create a new blank molecule to enable edit
				/*
				if (!is3D && !chemObj)
				{
					chemObj = new Kekule.Molecule(null, null, true);
				}
				*/

				// default, clear old content
				var displayer = Kekule.Widget.getWidgetById(getDisplayerId(is3D));
				if (displayer)
					displayer.setChemObj(chemObj);
			},
			onOk: function()
			{
				var displayer = Kekule.Widget.getWidgetById(getDisplayerId(is3D));
				var chemObj = displayer.getChemObj();
				// serialize to plain JSON
				var jsonObj = {};
				if (chemObj)
				{
					chemObj.saveObj(jsonObj, 'json');
					var jsonStr = JsonUtility.serializeToStr(jsonObj, {prettyPrint: false});
				}
				// snap chem object image first
				var exportViewer = createImgExportViewer(document, chemObj, is3D);
				exportViewer.appendToElem(document.body);

				// delay call the following process, allow object to be rendered
				setTimeout(function()
					{
						var dataUrl = exportViewer.exportToDataUrl();
						var dimension = exportViewer.getBoundingClientRect();
						var widgetClassName = exportViewer.getClassName();
						exportViewer.finalize();

						// create element in document first (to render object first) then insert it to document in editor.
						var viewerElem = /*document.createElement('span');*/ editor.document.createElement('img');
						var viewerDomElem = viewerElem.$;
						var DU = Kekule.DomUtils;
						viewerDomElem.src = dataUrl;
						viewerDomElem.style.width = dimension.width + 'px';
						viewerDomElem.style.height = dimension.height + 'px';
						/*
						if (is3D)
							viewerDomElem.style.backgroundColor = '#000';
						*/
						//viewerElem.setAttribute('data-widget', viewer.getClassName());
						viewerElem.addClass(exportViewer.getWidgetClassName());
						viewerElem.setAttribute('data-kekule-widget', widgetClassName);  // avoid 'widget' name confict with ckeditor
						viewerElem.setAttribute('data-predefined-setting', 'basic');
						viewerElem.setAttribute('data-auto-size', 'false');
						viewerElem.setAttribute('data-autofit', 'true');
						viewerElem.setAttribute('data-chem-obj', jsonStr);

						editor.insertElement(viewerElem);
					}, 50
				);
			}
		};
	}


	CKEDITOR.dialog.add( 'insertChemObjDialog2D', function(editor)
	{
		var definition = getDialogDefinition(editor, false);
		return definition;
	});
	CKEDITOR.dialog.add( 'insertChemObjDialog3D', function(editor)
	{
		var definition = getDialogDefinition(editor, true);
		return definition;
	});
})();


