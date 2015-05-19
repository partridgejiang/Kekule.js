(function(){

	var CLASS_NAME_VIEWER3D = 'K-Chem-Viewer3D';
	var CLASS_NAME_VIEWER2D = 'K-Chem-Viewer2D';
	var ID_KCHEMDISPLAYER = 'kChemObjSetter';
	var DEF_WIDTH = 300;
	var DEF_HEIGHT = 300;

	var getDisplayerId = function()
	{
		return ID_KCHEMDISPLAYER;
	};
	var getViewerWidgetName = function()
	{
		return 'Kekule.ChemWidget.Viewer';
	};

	var getDialogElements = function(is3D, editor)
	{
		var id = getDisplayerId();
		var coreHtml =
			'<div id="' + id + '" style="width:600px;height:400px;position:relative" ' +
			'data-kekule-widget="Kekule.ChemWidget.ChemObjInserter" data-auto-size-export="true" data-resizable="true"' +
			'></div>';
		var sLabelText = editor.lang.kekule.label_load_or_edit_mol;
		var labelElemHtml = '<label class="K-CKEditor-Label">' + sLabelText + '</label>';
		var result = [
			{
				type: 'html',
				html: labelElemHtml + '\n' + coreHtml
			}
		];
		//console.log('html def', result);
		return result;
	};


	var getDialogDefinition = function(editor, is3D)
	{
		var sTitle = editor.lang.kekule.caption_ins_mol;
		return  {
			title: sTitle,
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
				//var renderType = Kekule.Render.RendererType.R2D;

				// if editor has selection and selection is a chem viewer, load content
				var selElem = editor.getSelection().getSelectedElement();
				if (selElem)
				{
					/*
					var sRenderType = selElem.getAttribute('data-render-type');
					renderType = JsonUtility.parse(sRenderType);
					*/
					var widgetName = selElem.getAttribute('data-kekule-widget');
					/*
					if (widgetName && widgetName === getViewerWidgetName())
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
									//console.log(chemObj);
								}
							}
							catch(e)
							{
								chemObj = null;
							}
						}
					}
					*/
				}

				// default, clear old content
				var chemObjSetter = Kekule.Widget.getWidgetById(getDisplayerId());
				if (widgetName && widgetName === getViewerWidgetName())
					chemObjSetter.importFromElem(selElem.$);
				else
				{
					//chemObjSetter.setRenderType(renderType);
					//if (chemObj)
					chemObjSetter.setChemObj(null);
				}
			},
			onOk: function()
			{
				var chemObjSetter = Kekule.Widget.getWidgetById(getDisplayerId());
				var exportAttribs = chemObjSetter.getExportImgElemAttributes();

				// create element in document first (to render object first) then insert it to document in editor.
				var viewerElem = editor.document.createElement('img');
				var viewerDomElem = viewerElem.$;

				var DU = Kekule.DomUtils;
				DU.setElemAttributes(viewerDomElem, exportAttribs);
				if (chemObjSetter.getIs3D())
					viewerElem.addClass(CLASS_NAME_VIEWER3D);
				else
					viewerElem.addClass(CLASS_NAME_VIEWER2D);
				viewerElem.setAttribute('data-predefined-setting', 'basic');

				editor.insertElement(viewerElem);
			}
		};
	};

	CKEDITOR.dialog.add( 'insertChemObjDialog', function(editor)
	{
		var definition = getDialogDefinition(editor, false);
		//console.log('get definition', definition);
		return definition;
	});
})();


