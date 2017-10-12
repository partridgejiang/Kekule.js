/**
 * Created by ginger on 2016/8/19.
 */

/*
var QTYPE_KEKULE_CHEM_FLAG = {};

// initial function called by PHP
function _startup(Y, qtypeKekuleFlagKey, qtypeKekuleFlagValue)
{
	QTYPE_KEKULE_CHEM_FLAG.Key = qtypeKekuleFlagKey;
	QTYPE_KEKULE_CHEM_FLAG.Value = qtypeKekuleFlagValue;
}
*/

function findViewerPlaceHolders()
{
	var result = [];
	var elems = document.getElementsByTagName('textarea');
	for (var i = 0, l = elems.length; i < l; ++i)
	{
		var className = elems[i].className;
		if (className && className.indexOf('K-Chem-Question-Design-AnswerBlank') >= 0)  // is a place holder
		{
			result.push(elems[i]);
		}
	}
	return result;
}

function getInputType(placeHolderElems)
{
	var result = null;
	var elem = placeHolderElems[0];
	var form = elem && elem.form;
	if (form)
	{
		var inputTypeElem = form.elements['inputtype'];
		result = inputTypeElem && inputTypeElem.value;
	}
	return result;
}

function createChemViewers(placeHolderElems)
{
	var inputType = getInputType(placeHolderElems);
	for (var i = 0, l = placeHolderElems.length; i < l; ++i)
	{
		var placeHolder = placeHolderElems[i];
		var ansData = placeHolder.value;
		var molData = null;
		var molDataType = null;
		try
		{
			var ansJSON = JSON.parse(ansData);
			molData = ansJSON.molData;
			molDataType = ansJSON.molDataType;
		}
		catch(e)
		{

		}
		var className = placeHolder.getAttribute('data-widget-class');
		createChemViewer(placeHolder, molData, molDataType, className, inputType);
	}
}
function createChemViewer(placeHolder, molData, molDataType, className, inputType)
{
	var BNS = Kekule.ChemWidget.ComponentWidgetNames;
	var placeHolderName = placeHolder.name || '';
	var ansIndex = getAnsRelatedElemIndex(placeHolder);
	if (ansIndex >= 0)
	{
		var widgetProps = {};
		if (inputType === '1')  // doc, allow input document
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

		var container = document.createElement('span');
		var linebreak = document.createElement('br');
		/*
		if (molData)
			container.setAttribute('data-chem-obj', molData);
		*/
		var parentElem = placeHolder.parentNode;
		parentElem.insertBefore(container, placeHolder);
		parentElem.insertBefore(linebreak, placeHolder);
		//parentElem.removeChild(placeHolder);
		hideElem(placeHolder);
		var result = new Kekule.ChemWidget.Viewer(container);
		result.setPropValues(widgetProps);
		result.setPredefinedSetting('editOnly').setToolButtons([BNS.loadData, BNS.saveData, BNS.openEditor])
				.setResizable(true).setEnableEditFromVoid(true);
		if (className)
			result.addClassName(className);
		if (molData)
		{
			var dataType = molDataType || Kekule.IO.MimeType.KEKULE_JSON;
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
		// save ansIndex
		result.__answerIndex__ = ansIndex;
		var ansRelElems = getAnsRelatedElems(ansIndex);
		result.__answerRelElems__ = ansRelElems;
		result.on('load', reactChemObjLoad);
		return result;
	}
	else
		return null;
}

function reactChemObjLoad(e)
{
	var viewer = e.currentTarget || e.target;
	if (viewer instanceof Kekule.ChemWidget.Viewer)  // avoid event invoked by composer
	{
		var viewerElem = viewer.getElement();
		/*
		var ansIndex = viewer.__answerIndex__;
		var ansRelElems = getAnsRelatedElems(ansIndex);
		*/
		var ansRelElems = viewer.__answerRelElems__;
		//var molDataElem = ansRelElems.molData;
		//var smilesElem = ansRelElems.smiles;
		var answerElem = ansRelElems.answer;
		if (/*molDataElem && smilesElem &&*/ answerElem)
		{
			var molData = '', smiles = '', smilesNoStereo = '';
			var chemObj = viewer.getChemObj();
			if (chemObj)
			{
				var sAnswer = '';
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
					'smiles': smiles,
					'smilesNoStereo': smilesNoStereo,
					'molDataType': Kekule.IO.MimeType.KEKULE_JSON,
					'molData': molData
				};
				sAnswer = JSON.stringify(saveObj);
			}
			//molDataElem.value = molData;
			//smilesElem.value = smiles;
			answerElem.value = sAnswer;
		}
	}
}

function getAnsRelatedElemIndex(elem)
{
	var result = -1;
	var name = elem.name;
	var matchResult = name.match(/\[(\d+)\]/);
	if (matchResult)
	{
		result = parseInt(matchResult[1]);
	}
	return result;
}
function getAnsRelatedElems(ansIndex)
{
	return {
		//'molData': document.getElementsByName('moldata[' + ansIndex + ']')[0],
		//'smiles': document.getElementsByName('smiles[' + ansIndex + ']')[0],
		'answer': document.getElementsByName('answer[' + ansIndex + ']')[0]
	};
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

	var placeHolders = findViewerPlaceHolders();
	createChemViewers(placeHolders);
}

Kekule.X.domReady(init);
