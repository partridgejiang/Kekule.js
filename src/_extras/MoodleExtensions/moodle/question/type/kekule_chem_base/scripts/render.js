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
	var widgetClass, widgetProps;
	if (widgetType === 'composer')
	{
		widgetClass = Kekule.Editor.Composer;
		widgetProps = {
			resizable: true
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
	}

	if (inputType === 'doc')  // allow input document
	{
		widgetProps.restrainEditorWithCurrObj = false;
		widgetProps.editorProperties = {
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