function findPlaceHolders()
{
	var result = [];
	var elems = document.getElementsByTagName('span');
	for (var i = 0, l = elems.length; i < l; ++i)
	{
		var className = elems[i].className;
		if (className && className.indexOf('K-Chem-Question-Blank') >= 0)  // is a place holder
		{
			result.push(elems[i]);
		}
	}
	return result;
}

function createChemWidgets(placeHolderElems)
{
	for (var i = 0, l = placeHolderElems.length; i < l; ++i)
	{
		var placeHolder = placeHolderElems[i];
		//var molData = placeHolder.value;
		var className = placeHolder.getAttribute('data-widget-class');
		var widgetType = placeHolder.getAttribute('data-preferWidget');
		var ctrlName = placeHolder.getAttribute('data-name');
		var inputType = placeHolder.getAttribute('data-input-type');
		createChemWidget(placeHolder, ctrlName, className, widgetType, inputType);
	}
}

function createChemWidget(placeHolder, ansCtrlName, className, widgetType, inputType)
{
	var N = Kekule.ChemWidget.ComponentWidgetNames;
	var widgetClass, widgetProps;
	if (widgetType === 'composer')
	{
		widgetClass = Kekule.Editor.Composer;
		widgetProps = {
			resizable: true
		};

		if (inputType === 'doc')  // allow input document
		{
			widgetProps.predefinedSetting = 'fullFunc';
		}
		else  // molecule
		{
			widgetProps.predefinedSetting = 'molOnly';
		}
	}
	else {
		widgetClass = Kekule.ChemWidget.Viewer;
		widgetProps = {
			//predefinedSetting: 'editOnly',
			//resizable: true,
			autoSize: true,
			enableEditFromVoid: true
		};

		if (inputType === 'doc')  // allow input document
		{
			widgetProps.restrainEditorWithCurrObj = false;
			widgetProps.editorProperties = {
				'predefinedSetting': 'molOnly',
				'allowCreateNewChild': true
			};
		}
		else  // molecule
		{
			widgetProps.restrainEditorWithCurrObj = true;
			widgetProps.editorProperties = {
				'predefinedSetting': 'molOnly',
				'allowCreateNewChild': false
			};
		}
		widgetProps.editorProperties.minDimension = {'width': 450, height: 350};
		/*
		widgetProps.editorProperties.commonToolButtons = [
			N.newDoc,
			N.loadData,
			N.saveData,
			N.undo,
			N.redo,
			N.zoomIn,
			N.zoomOut
		];
		*/
	}

	var ctrlElem = getBlankRelatedElems(ansCtrlName).answer;

	var isEmpty = !ctrlElem;
	var jsonObj = null;
	if (ctrlElem)
	{
		// hide ctrlElem
		hideElem(ctrlElem);
		// get answer value from ctrlElem
		var ansValue = ctrlElem.value;
		if (ansValue)
		{
			//console.log(ansValue);
			jsonObj = parseAnswerString(ansValue);
			/*
			if (jsonObj && jsonObj.molData)
			{
				placeHolder.setAttribute('data-chem-obj', jsonObj.molData);
			}
			else
				isEmpty = true;
			*/
		}
		if (!jsonObj || !jsonObj.molData)
			isEmpty = true;
	}

	var result = new widgetClass(placeHolder);
	result.addClassName(className);
	result.__answerElem__ = ctrlElem;
	if (widgetProps)
		result.setPropValues(widgetProps);

	if (!isEmpty)  // load chem object
	{
		var molData = jsonObj.molData;
		var dataType = jsonObj.molDataType || Kekule.IO.MimeType.KEKULE_JSON;
		try
		{
			var chemObj = Kekule.IO.loadMimeData(molData, dataType);
			if (chemObj)
				result.setChemObj(chemObj);
		}
		catch(e)
		{
			console.error(e);
		}
	}

	if (widgetClass === Kekule.ChemWidget.Viewer)
	{
		// add copy structure button
		result.setToolButtons([{
			'widgetClass': Kekule.Widget.DropDownButton,
			'htmlClass': 'KM-Btn-Copy-Structure',
			'text': Kekule.$L('KekuleMoodleTexts.CAPTION_COPY_QUESTION_STRUCTURE'),
			'hint': Kekule.$L('KekuleMoodleTexts.HINT_COPY_QUESTION_STRUCTURE'),
			'dropDownWidgetGetter': _btnStructureCopyDropDownPanelGetter,
			'#dropDown': _reactBtnCopyStructureDropdown
		},
		Kekule.ChemWidget.ComponentWidgetNames.openEditor]);
	}

	// TODO: now only handle viewer event
	if (widgetClass === Kekule.ChemWidget.Viewer)
	{
		result.on('load', reactViewerChemObjLoad);
	}
	return result;
}

function reactViewerChemObjLoad(e)
{
	var viewer = e.currentTarget || e.target;
	if (viewer instanceof Kekule.ChemWidget.Viewer)  // avoid event invoked by composer
	{
		var ansElem = viewer.__answerElem__;
		if (ansElem)
		{
			var sAnswer = '';
			var molData = '', smiles = '', smilesNoStereo = '';
			var chemObj = viewer.getChemObj();
			if (chemObj)
			{
				try
				{
					molData = Kekule.IO.saveMimeData(chemObj, Kekule.IO.MimeType.KEKULE_JSON);
					smiles = Kekule.IO.saveMimeData(chemObj, Kekule.IO.MimeType.SMILES, {'ignoreStereo': false});
					smilesNoStereo = Kekule.IO.saveMimeData(chemObj, Kekule.IO.MimeType.SMILES, {'ignoreStereo': true});
				}
				catch(e)
				{

				}
				var saveObj = {
					'smiles': smiles || '',
					'smilesNoStereo': smilesNoStereo || '',
					'molData': molData || ''
				};
				sAnswer = JSON.stringify(saveObj);
			}
			ansElem.value = sAnswer;
		}
	}
}

function _btnStructureCopyDropDownPanelGetter(btn)
{
	var doc = btn.getDocument();
	/*
	var result = new Kekule.Widget.Panel(doc);
	var grid = new Kekule.ChemWidget.ViewerGrid2D(result);
	result._grid = grid;
	result._parentViewer = btn.getParent().getParent(); // mark
	*/
	var result = new KekuleMoodle.Widget.ChemObjSelectorPanel(doc);
	result._questionElem = getQuestionRootElem(btn.getParent().getParent().getElement());
	result.setCaption(Kekule.$L('KekuleMoodleTexts.CAPTION_COPY_QUESTION_STRUCTURE'));
	result.on('select', _reactStructureCopyDropDownPanelSelect);
	_refreshMoleculesInDropdownPanel(btn, result);

	return result;
}

function _reactStructureCopyDropDownPanelSelect(e)
{
	var panel = e.target;
	//console.log(panel._invokerViewer, e.chemObj);
	var mol = e.chemObj;
	if (mol && mol instanceof Kekule.StructureFragment)
	{
		var viewer = panel._invokerViewer;
		viewer.setChemObj(mol.clone());
	}
}

function _refreshMoleculesInDropdownPanel(btn, panel)
{
	//var grid = panel._grid;
	var molecules = [];
	var viewerBlank = btn.getParent().getParent();
	//var viewerBlank = panel._parentViewer;
	var viewerBlankElem = viewerBlank.getElement();
	var questionRootElem = getQuestionRootElem(viewerBlankElem);
	var viewersInQuestion = getViewerWidgetsInsideElem(questionRootElem);
	if (viewersInQuestion)
	{
		Kekule.ArrayUtils.remove(viewersInQuestion, viewerBlank);  // filter out viewers in question content
		molecules = molecules.concat(getExistedMoleculesInViewers(viewersInQuestion));
	}
	// some <img> elements may has not been created into viewer
	var proxyElems = getViewerProxiesInsideElem(questionRootElem) || [];
	for (var i = 0, l = proxyElems.length; i < l; ++i)
	{
		var proxy = proxyElems[i];
		var data = proxy.getAttribute('data-chem-obj');
		if (data)
		{
			//try
			{
				var json = JSON.parse(data);
				var serializer = Class.ObjSerializerFactory.getSerializer('json');
				var chemObj = serializer.load(null, json)
				if (chemObj)
				{
					molecules = molecules.concat(getMoleculesInChemObj(chemObj));
				}
			}
			//catch(e)
			{

			}
		}
	}

	console.log(molecules);
	/*
	grid.clearWidgets();
	for (var i = 0, l = molecules.length; i < l; ++i)
	{
		grid.addChemObj(molecules[i]);
	}
	*/
	panel.setObjects(molecules);
}
function _reactBtnCopyStructureDropdown(e)
{
	//console.log('execute');
	var btn = e.target;
	var panel = btn.getDropDownWidget();
	panel._invokerViewer = btn.getParent().getParent();
	//var parentViewer = btn.getParent().getParent();
	var questionElem = getQuestionRootElem(btn.getParent().getParent().getElement());
	if (questionElem !== panel._questionElem)
	{
		//console.log('refresh');
		panel._questionElem = questionElem;
		_refreshMoleculesInDropdownPanel(btn, panel);
	}
}

function isQuestionRootElem(elem)
{
	return (elem.className || '').indexOf('que ') >= 0;
}

function getQuestionRootElem(childElem)  // returns the root of a question section
{
	if (isQuestionRootElem(childElem))
		return childElem;
	else if (childElem === childElem.ownerDocument.body)
		return childElem;
	else
		return getQuestionRootElem(childElem.parentNode);
}

function getViewerWidgetsInsideElem(elem)  // returns all viewer widgets under one element
{
	var result = [];
	var widgets = Kekule.Widget.Utils.getWidgetsInsideElem(elem);
	for (var i = 0, l = widgets.length; i < l; ++i)
	{
		if (widgets[i] instanceof Kekule.ChemWidget.Viewer)
			result.push(widgets[i]);
	}
	return result;
}
function getViewerProxiesInsideElem(elem)  // return <img> elements that has not been created into viewer
{
	var result = [];
	var imgs = elem.getElementsByTagName('img');
	for (var i = 0, l = imgs.length; i < l; ++i)
	{
		var img = imgs[i];
		if ((img.getAttribute('data-kekule-widget') || img.getAttribute('data-widget')) === 'Kekule.ChemWidget.Viewer')
		{
			result.push(img);
		}
	}
	return result;
}

function getMoleculesInChemObj(obj)
{
	var result = [];
	var objClass = Kekule.StructureFragment;
	var filter = function(child){ return child && (child instanceof objClass) && (child.hasCtab && child.hasCtab()); };

	if (obj instanceof objClass)
		result.push(obj);
	else if (obj instanceof Kekule.ChemSpace)
	{
		var objs = obj.filterChildren(filter, true);
		result = result.concat(objs);
	}
	return result;
}

function getExistedMoleculesInViewers(viewers)
{
	var result = [];
	for (var i = 0, l = viewers.length; i < l; ++i)
	{
		var viewer = viewers[i];
		var obj = viewer.getChemObj();
		if (obj)
		{
			result = result.concat(getMoleculesInChemObj(obj));
		}
	}
	return result;
}

function getBlankRelatedElems(ctrlName)
{
	// get response form control
	return {
		'answer': document.getElementsByName(ctrlName)[0]
	};
}

function parseAnswerString(answer)
{
	try
	{
		var jsonObj = JSON.parse(answer);
		if (typeof(jsonObj) !== 'object')
			return {};
		else
			return jsonObj;
	}
	catch(e)
	{
		return {};
	}
}

function hideElem(elem)
{
	elem.style.display = 'none';
}

function init()
{
	// avoid student to input unwanted pseudo atoms
	if (Kekule.Editor.ChemSpaceEditorConfigs && Kekule.Editor.ChemSpaceEditorConfigs.getInstance)
	{
		var editorConfigs = Kekule.Editor.ChemSpaceEditorConfigs.getInstance();
		editorConfigs.getInteractionConfigs().setAllowUnknownAtomSymbol(false);
	}

	var placeHolders = findPlaceHolders();
	createChemWidgets(placeHolders);
}

Kekule.X.domReady(init);