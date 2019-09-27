var _composer, _codeEditor;   // IMPORTANT: this variable should be set before running the functions in this file
var doc = document;
var N = Kekule.ChemWidget.ComponentWidgetNames;
var C = Kekule.Editor.ObjModifier.Category;
var AU = Kekule.ArrayUtils;

var defaultBtnSetting = {
	'common': Kekule.globalOptions.chemWidget.composer.commonToolButtons,
	//'chem': Kekule.globalOptions.chemWidget.composer.chemToolButtons,
	'chem': [
		{'name': N.manipulate, 'attached': [
			N.manipulateMarquee, N.manipulateLasso, N.manipulateBrush, N.manipulateAncestor, N.dragScroll, N.toggleSelect
		]},
		{'name': N.erase},
		{'name': N.molBond, 'attached': [
			N.molBondSingle, N.molBondDouble, N.molBondTriple,
			N.molBondWedgeUp,	N.molBondWedgeDown,
			N.molChain, N.trackInput,
			N.molRepFischer1, N.molRepSawhorseStaggered, N.molRepSawhorseEclipsed
		]},
		{'name': N.molAtomAndFormula, attached: [N.molAtom, N.molFormula]},
		{'name': N.molRing, attached: [
			N.molRing3, N.molRing4, N.molRing5, N.molRing6,
			N.molFlexRing, N.molRingAr6,
			N.molRepCyclopentaneHaworth1, N.molRepCyclohexaneHaworth1,
			N.molRepCyclohexaneChair1, N.molRepCyclohexaneChair2
		]},
		{'name': N.molCharge, attached: [
			N.molChargeClear, N.molChargePositive, N.molChargeNegative,
			N.molRadicalSinglet, N.molRadicalTriplet, N.molRadicalDoublet,
			N.molElectronLonePair
		]},
		{'name': N.glyph, attached: [
			N.glyphReactionArrowNormal, N.glyphReactionArrowReversible, N.glyphReactionArrowResonance, N.glyphReactionArrowRetrosynthesis,
			N.glyphRepSegment,
			N.glyphElectronPushingArrowDouble, N.glyphElectronPushingArrowSingle,
			N.glyphRepHeatSymbol, N.glyphRepAddSymbol
		]},
		{'name': N.textImage, attached: [N.textBlock, N.imageBlock]}
	]
};
var activeBtnSetting = JSON.parse(JSON.stringify(defaultBtnSetting));  // a deep clone

var currChemButtonItem = null;  // current selected chem button setting item

var defaultObjModifierSetting = [C.GENERAL, C.CHEM_STRUCTURE, C.GLYPH, C.STYLE, C.MISC];
var activeObjModifierSetting = AU.clone(defaultObjModifierSetting);


function _findButtonSettingItemInGroup(group, btnNameOrDetail)
{
	var result = null;
	for (var i = 0, l = group.length; i < l; ++i)
	{
		var item = group[i];
		if (item === btnNameOrDetail || (item.name && item.name === btnNameOrDetail))
			result = item;
		else if (item.attached)
		{
			result = _findButtonSettingItemInGroup(item.attached, btnNameOrDetail);
		}
		if (result)
			return result;
	}
	return result;
}
function _findButtonSettingItem(settingType, groupName, btnNameOrDetail)
{
	var setting = (settingType === 'default')? defaultBtnSetting: activeBtnSetting;
	var group = setting[groupName];
	if (group)
	{
		return _findButtonSettingItemInGroup(group, btnNameOrDetail);
	}
}
function findActiveButtonSettingItem(groupName, btnNameOrDetail)
{
	return _findButtonSettingItem('active', groupName, btnNameOrDetail);
}
function findDefaultButtonSettingItem(groupName, btnNameOrDetail)
{
	return _findButtonSettingItem('default', groupName, btnNameOrDetail);
}


var objModifierCategoryCheckers = [];
var btnDropZones = {common: null, chem: null};
var btnInfos;

function _initCustomizationSystem(concreteComposer, commonBtnZoneParent, chemBtnZoneParent, modifierZoneParent, codeEditor)
{
	if (concreteComposer)
		_composer = concreteComposer;
	if (codeEditor)
		_codeEditor = codeEditor;
	var commonCustom1 = createButtonInfo('"commonCustom1"', 'Custom Button 1', 'Custom action 1');
	var commonCustom2 = createButtonInfo('"commonCustom2"', 'Custom Button 2', 'Custom action 2');
	var chemCustom1 = createButtonInfo('"chemCustom1"', 'Custom Button 1', 'Custom action 1');
	var chemCustom2 = createButtonInfo('"chemCustom2"', 'Custom Button 2', 'Custom action 2');
	var chemCustom3 = createButtonInfo('"chemCustom3"', 'Custom Button 3', 'Custom action 3');
	commonCustom1.actionExpr = commonCustom2.actionExpr = 'Class.create(Kekule.Editor.ActionOnComposerAdv, {})';
	chemCustom1.actionExpr = chemCustom2.actionExpr = chemCustom3.actionExpr = 'Class.create(Kekule.Editor.ActionOnComposerAdv, {})';
	btnInfos = {
		'common': [
			createButtonInfo('N.newDoc'),
			createButtonInfo('N.loadData'),
			createButtonInfo('N.loadFile'),
			createButtonInfo('N.saveData'),
			createButtonInfo('N.undo'),
			createButtonInfo('N.redo'),
			createButtonInfo('N.copy'),
			createButtonInfo('N.cut'),
			createButtonInfo('N.paste'),
			createButtonInfo('N.cloneSelection'),
			createButtonInfo('N.zoomIn'),
			createButtonInfo('N.zoomOut'),
			//createButtonInfo('N.reset'),
			createButtonInfo('N.resetZoom'),
			createButtonInfo('N.config'),
			createButtonInfo('N.objInspector'),
			commonCustom1,
			commonCustom2
		],
		'chem': [
			createButtonInfo('N.manipulate', null, null, null, [
				createButtonInfo('N.manipulateMarquee'),
				createButtonInfo('N.manipulateLasso'),
				createButtonInfo('N.manipulateBrush'),
				createButtonInfo('N.manipulateAncestor'),
				createButtonInfo('N.dragScroll'),
				createButtonInfo('N.toggleSelect')
			]),
			createButtonInfo('N.erase', null, null, null, []),
			createButtonInfo('N.molBond', null, null, null, [
				createButtonInfo('N.molBondSingle'),
				createButtonInfo('N.molBondDouble'),
				createButtonInfo('N.molBondTriple'),
				createButtonInfo('N.molBondCloser'),  // not default
				createButtonInfo('N.molBondWedgeUp'),
				createButtonInfo('N.molBondWedgeDown'),
				createButtonInfo('N.molBondWedgeUpOrDown'),  // not default
				createButtonInfo('N.molBondDoubleEither'),  // not default
				createButtonInfo('N.molChain'),
				createButtonInfo('N.trackInput'),
				createButtonInfo('N.molRepSubBondMark'),  // not default
				createButtonInfo('N.molRepMethane'),  // not default
				createButtonInfo('N.molRepFischer1'),
				createButtonInfo('N.molRepFischer2'),  // not default
				createButtonInfo('N.molRepFischer3'),  // not default
				createButtonInfo('N.molRepSawhorseStaggered'),
				createButtonInfo('N.molRepSawhorseEclipsed')
			]),
			createButtonInfo('N.molAtomAndFormula', null, null, null, [
				createButtonInfo('N.molAtom'),
				createButtonInfo('N.molFormula')
			]),
			createButtonInfo('N.molRing', null, null, null, [
				createButtonInfo('N.molRing3'),
				createButtonInfo('N.molRing4'),
				createButtonInfo('N.molRing5'),
				createButtonInfo('N.molRing6'),
				createButtonInfo('N.molRing7'),  // not default
				createButtonInfo('N.molRing8'),  // not default
				createButtonInfo('N.molFlexRing'),
				createButtonInfo('N.molRingAr6'),
				createButtonInfo('N.molRingAr5'),  // not default
				createButtonInfo('N.molRepCyclopentaneHaworth1'),
				createButtonInfo('N.molRepCyclopentaneHaworth2'),  // not default
				createButtonInfo('N.molRepCyclohexaneHaworth1'),
				createButtonInfo('N.molRepCyclohexaneHaworth2'),  // not default
				createButtonInfo('N.molRepCyclohexaneChair1'),
				createButtonInfo('N.molRepCyclohexaneChair2')
			]),
			createButtonInfo('N.molCharge', null, null, null, [
				createButtonInfo('N.molChargeClear'),
				createButtonInfo('N.molChargePositive'),
				createButtonInfo('N.molChargeNegative'),
				createButtonInfo('N.molRadicalSinglet'),
				createButtonInfo('N.molRadicalTriplet'),
				createButtonInfo('N.molRadicalDoublet'),
				createButtonInfo('N.molElectronLonePair')
			]),
			createButtonInfo('N.glyph', null, null, null, [
				/*
				createButtonInfo('N.glyphRepOpenArrowLine'),
				createButtonInfo('N.glyphRepTriangleArrowLine'),
				createButtonInfo('N.glyphRepDiOpenArrowLine'),
				createButtonInfo('N.glyphRepDiTriangleArrowLine'),
				createButtonInfo('N.glyphRepReversibleArrowLine'),
				createButtonInfo('N.glyphRepOpenArrowDiLine'),
				createButtonInfo('N.glyphRepOpenArrowArc'),
				createButtonInfo('N.glyphRepSingleSideOpenArrowArc'),
				createButtonInfo('N.glyphRepLine'),
				*/
				createButtonInfo('N.glyphReactionArrowNormal'),
				createButtonInfo('N.glyphReactionArrowReversible'),
				createButtonInfo('N.glyphReactionArrowResonance'),
				createButtonInfo('N.glyphReactionArrowRetrosynthesis'),
				createButtonInfo('N.glyphRepSegment'),
				createButtonInfo('N.glyphElectronPushingArrowDouble'),
				createButtonInfo('N.glyphElectronPushingArrowSingle'),
				createButtonInfo('N.glyphRepHeatSymbol'),
				createButtonInfo('N.glyphRepAddSymbol')
			]),
			createButtonInfo('N.textImage', null, null, null, [
				createButtonInfo('N.textBlock'),
				createButtonInfo('N.imageBlock')
			]),
			// custom
			chemCustom1,
			chemCustom2,
			chemCustom3
		]
	};

	// flatten btnInfos.chem
	var chemBtns = btnInfos.chem;
	var flattened = [];  // AU.clone(chemBtns);
	for (var i = 0, l = chemBtns.length; i < l; ++i)
	{
		var btnInfo = chemBtns[i];
		flattened.push(btnInfo);
		if (btnInfo.attached)
		{
			flattened = flattened.concat(btnInfo.attached);
		}
	}
	btnInfos.chem = flattened;

	btnDropZones.common = createCommonButtonZoneGroup(commonBtnZoneParent.getElement());
	btnDropZones.chem = createChemButtonZoneGroup(chemBtnZoneParent.getElement());

	createObjModifierZone(modifierZoneParent.getElement());

	updateCode();
}

function _resetCustomizationSystem(concreteComposer, commonBtnZoneParent, chemBtnZoneParent, modifierZoneParent, codeEditor)
{
	btnDropZones.common.src.finalize();
	btnDropZones.common.dest.finalize();
	btnDropZones.chem.src.finalize();
	btnDropZones.chem.dest.finalize();
	btnDropZones.chem.destAssoc.finalize();

	btnDropZones.common = null;
	btnDropZones.chem = null;

	activeBtnSetting = JSON.parse(JSON.stringify(defaultBtnSetting));  // a deep clone
	activeObjModifierSetting = AU.clone(defaultObjModifierSetting);

	_initCustomizationSystem(concreteComposer, commonBtnZoneParent, chemBtnZoneParent, modifierZoneParent, codeEditor);
}

function findButtonInfo(btnNameOrDetails, buttonInfos)
{
	var btnName = (typeof(btnNameOrDetails) === 'string')? btnNameOrDetails: btnNameOrDetails.name;
	var infos = buttonInfos;
	for (var i = 0, l = infos.length; i < l; ++i)
	{
		if (infos[i].name === btnName)
			return infos[i];
	}
	return null;
}
function findChildButtonInfos(btnNameOrDetails, buttonInfos)
{
	if (btnNameOrDetails.attached)
	{
		result = [];
		btnNameOrDetails.attached.forEach(function(child){
			var info = findButtonInfo(child, buttonInfos);
			if (info)
				result.push(info);
		});
		return result;
	}
	else
		return null;
}

function createButtonInfo(btnNameExpr, title, description, htmlClass, children)
{
	var btnName;
	try
	{
		btnName = eval(btnNameExpr);
	}
	catch(e)
	{
		if (typeof(btnNameExpr) === 'string')
			btnName = btnNameExpr;
	}
	if (!title)
	{
		// hack method to retrieve title and description from btnName
		/*
		var cProto = ClassEx.getPrototype(Kekule.Editor.Composer);
		var actionClass = cProto.getCompActionClass(btnName);
		*/
		var actionClass = _composer.getCompActionClass(btnName);
		if (actionClass)
		{
			var action = new actionClass();
			try
			{
				title = action.getText();
				description = action.getHint();
				htmlClass = action.getPrototype().HTML_CLASSNAME;
			}
			finally
			{
				action.finalize();
			}
		}
	}

	var result = {
		'name': btnName,
		'expression': btnNameExpr,
		'title': title,
		'description': description,
		'htmlClass': htmlClass,
		'attached': children
	};

	if (children)
	{
		children.forEach(function(child)
		{
			child._preferredParent = result;
		});
	}

	return result;
}

function findButtonOfNameInZone(zone, btnName)
{
	var children = zone.getChildWidgets();
	for (var i = 0, l = children.length; i < l; ++i)
	{
		var child = children[i];
		if (child._btnInfo.name === btnName)
			return child;
	}
	return null;
}


function getButtonSettingOfZone(zone, group, disallowNest)
{
	var btns = AU.clone(zone.getChildWidgets());
	btns.sort(function(w1, w2) {
		var r1 = Kekule.HtmlElementUtils.getElemBoundingClientRect(w1.getElement());
		var r2 = Kekule.HtmlElementUtils.getElemBoundingClientRect(w2.getElement());
		return r1.y - r2.y;
	});
	var result = [];
	btns.forEach(function(btn){
		if (btn._btnInfo)
		{
			//if (btn._btnInfo.name)
			{
				var btnItem = findActiveButtonSettingItem(group, btn._btnInfo.name);
				if (btnItem)
				{
					//console.log(btnItem, btn._btnInfo);
					if (disallowNest)  // || !btnItem.attached || !btnItem.attached.length)
					{
						if (btn._btnInfo.name)
							result.push(btn._btnInfo.name);
						else
						{
							result.push(btnItem.name);
						}
					}
					else
						result.push(btnItem);
				}
				else
				{
					//console.log('not found', btn._btnInfo.name);
					var info = btn._btnInfo;
					var customSetting = {'name': info.name, 'text': info.title, 'hint': info.description, 'htmlClass': info.htmlClass};
					if (info.actionExpr)
						customSetting.actionExpr = info.actionExpr;
					result.push(customSetting);
				}
			}
		}
	});
	return result;
}
function refineButtonSetting(setting)
{
	var result = AU.clone(setting);
	for (var i = 0, l = result.length; i < l; ++i)
	{
		var item = result[i];
		if (typeof(item) === 'object' && item.name && (!item.attached || !item.attached.length))
		{
			result.splice(i, 1, item.name);
		}
	}
	return result;
}

var DEF_INDENT_STR = '\t';
function _indentCodeLines(lines, sIndent)
{
	var result = [];
	for (var i = 0, l = lines.length; i < l; ++i)
		result.push(sIndent + lines[i]);
	return result;
}
function _removeCodeLinesIndent(lines, sIndent)
{
	var result = [];
	for (var i = 0, l = lines.length; i < l; ++i)
	{
		if (lines[i].startsWith(sIndent))
			result.push(lines[i].substring(sIndent.length));
	}
	return result;
}
function _removeEmptyCodeLines(lines)
{
	var result = [];
	lines.forEach(function(line){
		if (line.trim())
			result.push(line);
	});
	return result;
}
function _generateButtonSettingCoreCodeLines(btnSetting, options, btnInfos)
{
	var result = [];
	for (var i = 0, l = btnSetting.length; i < l; ++i)
	{
		var item = btnSetting[i];
		var lines = _generateButtonSettingItemCodeLines(item, options, btnInfos);
		if (i < l - 1)
			lines[lines.length - 1] += ',';
		result = result.concat(lines);
	}
	return result;
}
function _generateButtonSettingItemCodeLines(settingItem, options, btnInfos)
{
	var result = [];
	var handled = false;
	//if (!options.useVarValue)
	{
		var btnInfo = findButtonInfo(settingItem, btnInfos);
		if (btnInfo)
		{
			var isStandardItem = btnInfo.expression.startsWith('N.');
			handled = true;
			if (typeof (settingItem) === 'string' || (isStandardItem && !settingItem.attached))
				result.push(options.useVarValue? ('"' + btnInfo.name + '"'): btnInfo.expression);
			else  // hash setting
			{
				var cloneObj = Object.extend({}, settingItem);
				if (cloneObj.name)
					delete cloneObj.name;
				if (cloneObj.attached)
					delete cloneObj.attached;
				if (cloneObj.actionExpr)
					delete cloneObj.actionExpr;
				var code = '';
				if (!isStandardItem)
				{
					var code = JSON.stringify(cloneObj, null, DEF_INDENT_STR);
					// erase leading and tailing {/}
					code = code.trim();
					if (code.charAt(0) === '{' && code.charAt(code.length - 1) === '}')
						code = code.substring(1, code.length - 1).trim();
				}
				if (code && settingItem.attached)
					code += ',';
				var codes = code.split('\n');
				codes = _removeCodeLinesIndent(codes, DEF_INDENT_STR);

				if (settingItem.actionExpr)
				{
					var actionCode = '"actionClass": ' + settingItem.actionExpr;
					if (settingItem.attached || codes.length)
						actionCode += ',';
					codes.unshift(actionCode);
					// add comment
					codes.unshift('// use your own Action class here to do some concrete work');
				}
				// add name
				if (settingItem.name)
				{
					var nameCode = '"name": ' + (options.useVarValue? ('"' + btnInfo.name + '"'): btnInfo.expression);
					if (settingItem.attached || settingItem.actionExpr || codes.length)
						nameCode += ',';
					codes.unshift(nameCode);
				}
				if (settingItem.attached)
				{
					var subCodes = _generateButtonSettingCoreCodeLines(settingItem.attached, options, btnInfos);
					codes.push('"attached": [');
					codes = codes.concat(_indentCodeLines(subCodes, DEF_INDENT_STR));
					codes.push(']');
				}

				result.push('{');
				result = result.concat(_indentCodeLines(codes, DEF_INDENT_STR));
				result.push('}');
			}
		}
	}

	if (!handled)
	{
		result = result.concat(JSON.stringify(settingItem, null, DEF_INDENT_STR).split('\n'));
	}
	return result;
}

var defCodeGeneratorOptions  = {
	'commonSetting': true,
	'chemSetting': true,
	'objModifierSetting': true,
	'useVarValue': false
};

function generateComposerCustomSettingCode(options)
{
	var ops = Object.extend({}, defCodeGeneratorOptions);
	var ops = Object.extend(ops, options);

	var result = [];
	if (!ops.useVarValue)
	{
		if (ops.commonSetting || ops.chemSetting)
			result.push('var N = Kekule.ChemWidget.ComponentWidgetNames;');
		if (ops.objModifierSetting)
			result.push('var C = Kekule.Editor.ObjModifier.Category;');
		result.push('');
	}

	if (ops.commonSetting)
	{
		var codes = [
			'// Common toolbar buttons',  // comment
			'composer.setCommonToolButtons(['
		];
		var setting = activeBtnSetting.common;
		var coreCodes = _generateButtonSettingCoreCodeLines(setting, ops, btnInfos.common);
		codes = codes.concat(_indentCodeLines(coreCodes, DEF_INDENT_STR));
		codes.push(']);');
		result = result.concat(_removeEmptyCodeLines(codes));
		result.push('');
	}
	if (ops.chemSetting)
	{
		var codes = [
			'// Chem toolbar buttons',
			'composer.setChemToolButtons([',
		];
		var setting = activeBtnSetting.chem;
		var coreCodes = _generateButtonSettingCoreCodeLines(setting, ops, btnInfos.chem);
		codes = codes.concat(_indentCodeLines(coreCodes, DEF_INDENT_STR));
		codes.push(']);');
		result = result.concat(_removeEmptyCodeLines(codes));
		result.push('');
	}
	if (ops.objModifierSetting)
	{
		var codes = [
			'// Object modifiers'
		];
		var setting = activeObjModifierSetting;
		var allowedCategoriesCode;
		var categoryNames = [];
		if (!ops.useVarValue)
		{
			var allCategoryNames = Kekule.ObjUtils.getOwnedFieldNames(C);
			allCategoryNames.forEach(function(name){
				if (setting.indexOf(C[name]) >= 0)
					categoryNames.push('C.' + name);
			});
			allowedCategoriesCode = categoryNames.join(', ');
		}
		else
		{
			setting.forEach(function(item){
				categoryNames.push('"' + item + '"');
			});
			allowedCategoriesCode = categoryNames.join(', ');
		}
		codes.push('composer.setAllowedObjModifierCategories([' + allowedCategoriesCode + ']);');
		result = result.concat(codes);
	}

	return result.join('\n');
}

function createButton(btnInfo, parentWidget, btnClass)
{
	var elem = doc.createElement('a');  // use button with A tag, otherwise it may not be draggable in Firefox
	var result = new (btnClass || Kekule.Widget.Button)(elem);
	result.setText(btnInfo.title).setShowText(true).setHint(btnInfo.description).setShowGlyph(true).setDraggable(true);
	result.addClassName(btnInfo.htmlClass).addClassName('BtnDrag');
	result._btnInfo = btnInfo;  // stores the button info
	if (parentWidget)
		result.appendToWidget(parentWidget);
	return result;
}

function createButtonDropZone(parentElem, text)
{
	var elem = doc.createElement('fieldset');
	var result = new Kekule.Widget.Panel(elem);
	result.setCaption(text);
	result.addClassName('BtnDropPanel ' + 'K-Chem-InnerToolbar');
	result.setStyleProperty('vertical-align', 'top');
	result.setDroppable(true);

	result.on('dragStart', _reactBtnDragStart);
	result.on('dragAcceptQuery', _reactZoneDragAcceptQuery);
	result.on('dragOver', _reactZoneDragOver);
	result.on('dragLeave', _reactZoneDragLeave);
	result.on('dragDrop', _reactZoneDragDrop);
	result.on('dragEnd', _reactZoneDragEnd);
	if (parentElem)
		result.appendToElem(parentElem);
	return result;
}

function createCommonButtonZoneGroup(parentElem)
{
	var result = {
		'dest': createButtonDropZone(parentElem, 'Current'),
		'src': createButtonDropZone(parentElem, 'Available')
	};

	// save the paired drop zone
	result.src._relatedZones = result.dest._relatedZones = [result.src, result.dest];
	result.dest._isDest = true;
	result.src._isSrc = true;
	result.src.addClassName('SrcPanel');

	var	btnSetting = activeBtnSetting;
	var usedBtnNames = btnSetting.common;
	var availButtonInfos = AU.clone(btnInfos.common);

	// buttons currently used
	usedBtnNames.forEach(function(nameOrDetail){
		var btnInfo;
		/*
		if (typeof(nameOrDetail) === 'string')
			btnInfo = findButtonInfo(nameOrDetail, availButtonInfos);
		else
			btnInfo = findButtonInfo(nameOrDetail.name, availButtonInfos);
		*/
		btnInfo = findButtonInfo(nameOrDetail, availButtonInfos);
		if (btnInfo)
		{
			createButton(btnInfo, result.dest);
			AU.remove(availButtonInfos, btnInfo);
		}
	});
	// remaining buttons
	availButtonInfos.forEach(function(info){
		createButton(info, result.src);
	});
	return result;
}
function createChemButtonZoneGroup(parentElem)
{
	var result = {
		'dest': createButtonDropZone(parentElem, 'Current'),
		'destAssoc': createButtonDropZone(parentElem, 'Associated'),
		'src': createButtonDropZone(parentElem, 'Available')
	};

	result.dest._isDest = true;
	result.src._isSrc = true;
	result.src.addClassName('SrcPanel');
	result.destAssoc._isDest = true;
	result.destAssoc._isDestAssoc = true;
	result.src._relatedZones = result.dest._relatedZones = result.destAssoc._relatedZones = [result.src, result.dest, result.destAssoc];

	result.dest.on('check', function(e){   // react to chem button selected event
		var btn = e.widget;
		if (btn instanceof Kekule.Widget.RadioButton)
		{
			result.destAssoc.clearWidgets();

			var btnInfo = btn._btnInfo;
			var name = btnInfo.name;
			var btnItem = findActiveButtonSettingItem('chem', name);
			if (btnItem)
			{
				currChemButtonItem = btnItem;
				var childBtnInfos = findChildButtonInfos(btnItem, btnInfos.chem);
				if (childBtnInfos)
					childBtnInfos.forEach(function(info)
					{
						createButton(info, result.destAssoc, Kekule.Widget.RadioButton).setAutoCheck(false);
					});
			}

			updateZoneStates();
		}
	});

	var	btnSetting = activeBtnSetting;

	var usedBtnNames = btnSetting.chem;
	var availButtonInfos = AU.clone(btnInfos.chem);

	// buttons currently used
	usedBtnNames.forEach(function(nameOrDetail){
		var btnInfo = findButtonInfo(nameOrDetail, availButtonInfos);
		var childBtnInfos = findChildButtonInfos(nameOrDetail, availButtonInfos);
		if (btnInfo)
		{
			var btn = createButton(btnInfo, result.dest, Kekule.Widget.RadioButton);
			btn.setGroup('chem').setAutoCheck(true);
			AU.remove(availButtonInfos, btnInfo);
		}
		if (childBtnInfos)
		{
			childBtnInfos.forEach(function(info){
				AU.remove(availButtonInfos, info);
			});
		}
	});
	// remaining buttons
	availButtonInfos.forEach(function(info){
		createButton(info, result.src, Kekule.Widget.RadioButton).setAutoCheck(false).setGroup('chem');
	});

	// check the first dest button
	var firstChild = result.dest.getChildWidgets()[0];
	if (firstChild)
	{
		firstChild.setChecked(true);
	}

	return result;
}

function createObjModifierZone(parentElem)
{
	// objModifierCategoryCheckers
	//var allCategories = [C.GENERAL, C.CHEM_STRUCTURE, C.GLYPH, C.STYLE, C.MISC];
	objModifierCategoryCheckers = [
		_createObjModifierChecker(parentElem, C.GENERAL, 'General', ''),
		_createObjModifierChecker(parentElem, C.CHEM_STRUCTURE, 'Chemistry structure', ''),
		_createObjModifierChecker(parentElem, C.GLYPH, 'Glyph', ''),
		_createObjModifierChecker(parentElem, C.STYLE, 'Style', ''),
		_createObjModifierChecker(parentElem, C.MISC, 'Misc', '')
	];
}
function _createObjModifierChecker(parentElem, category, text, hint)
{
	var result = new Kekule.Widget.CheckBox(document);
	result.setText(text).setHint(hint);
	result._category = category;
	result.setChecked(activeObjModifierSetting.indexOf(category) >= 0);
	result.on('valueChange', _reactObjModifierCheckChanged);
	result.appendToElem(parentElem);
	return result;
}

function updateZoneStates()
{
	if (btnDropZones && btnDropZones.chem && btnDropZones.chem.destAssoc)
		btnDropZones.chem.destAssoc.setEnabled(!!currChemButtonItem);
}
function updateCode()
{
	if (_codeEditor)
	{
		var code = generateComposerCustomSettingCode();
		_codeEditor.setValue(code);
	}
}

var _currInsertMarker, _currRefSibling, _currZone;

function _btnDragDropAllowed(srcBtn, destZone)
{
	var btnParent = srcBtn.getParent();
	var relatedZones = btnParent._relatedZones;
	//console.log(btnParent === destZone, destZone._isDest, btnParent === destZone._related);
	var result = (relatedZones && relatedZones.indexOf(destZone) >= 0) && (destZone._isDest || (btnParent !== destZone));
	result = result && destZone.getEnabled();
	if (result)  // further check if has child items in chem zone
	{
		if (btnParent._isDest && destZone._isDestAssoc)
		{
			var btnInfo = srcBtn._btnInfo;
			var btnItem = findActiveButtonSettingItem('chem', btnInfo.name);
			result = !(btnItem && btnItem.attached && btnItem.attached.length);
		}
	}
	return result;
}
function _getBtnDragRefSibling(htmlEvent, zone)
{
	function doGet(htmlEvent, zone)
	{
		var currCoord = {'x': htmlEvent.getPageX(), 'y': htmlEvent.getPageY()};
		//console.log('currCoord', currCoord);
		var currDeltaY;
		var children = AU.clone(zone.getChildWidgets());
		children.sort(function(w1, w2) {
			var r1 = Kekule.HtmlElementUtils.getElemBoundingClientRect(w1.getElement(), true);
			var r2 = Kekule.HtmlElementUtils.getElemBoundingClientRect(w2.getElement(), true);
			return r1.y - r2.y;
		});
		for (var i = 0, l = children.length; i < l; ++i)
		{
			var child = children[i];
			var rect = Kekule.HtmlElementUtils.getElemBoundingClientRect(child.getElement(), true);
			//console.log('find rect', rect);
			var center = {'x': (rect.left + rect.right) / 2, 'y': (rect.top + rect.bottom) / 2};
			if (currCoord.y >= rect.top && currCoord.y <= rect.bottom)  // just on child widget
			{
				return (currCoord.y - center.y < 0) ? child : children[i + 1];
			}
			else  // between child widgets
			{
				var delta = currCoord.y - center.y;
				if (delta < 0)
					return child;
			}
		}
	}
	var result = doGet(htmlEvent, zone);
	return result;
}
function _getInsertMarkerOfZone(zone)
{
	if (!zone._insertMarker)
	{
		var marker = doc.createElement('span');
		marker.className = 'InsertMarker';
		marker.style.display = 'none';
		zone.getElement().appendChild(marker);
		zone._insertMarker = marker;
	}
	return zone._insertMarker;
}
function _showInsertMarker(zone)
{
	var marker = _getInsertMarkerOfZone(zone);
	marker.style.display = 'inline-block';
	_currInsertMarker = marker;
}
function _hideInsertMarker(zone)
{
	var marker = _getInsertMarkerOfZone(zone);
	marker.style.display = 'none';
}

function _reactBtnDragStart(e)
{
	//e.dataTransfer.effectAllowed = 'move';
	//e.dataTransfer.dropEffect = 'none';
}
function _reactZoneDragAcceptQuery(e)
{
	var btn = e.srcWidget;
	var zone = e.widget;
	e.result = _btnDragDropAllowed(btn, zone);
}
function _reactZoneDragOver(e)
{
	var btn = e.srcWidget;
	var zone = e.widget;
	if (_btnDragDropAllowed(btn, zone))
	{
		zone.addClassName('DragOver');
		_currZone = zone;

		//console.log('drag over', dragPosRefSibling === _currRefSibling);
		_showInsertMarker(zone);

		if (zone._isDest)
		{

			var dragPosRefSibling = _getBtnDragRefSibling(e.htmlEvent, zone);
			if (dragPosRefSibling !== _currRefSibling)
			{
				var marker = _getInsertMarkerOfZone(zone);
				zone.getElement().removeChild(marker);
				if (dragPosRefSibling)
				{
					zone.getElement().insertBefore(marker, dragPosRefSibling.getElement());
				}
				else
				{
					zone.getElement().appendChild(marker);
				}
				_currRefSibling = dragPosRefSibling;
			}
		}
		else if (zone._isSrc)
		{
			var marker = _getInsertMarkerOfZone(zone);
			zone.getElement().removeChild(marker);
			zone.getElement().appendChild(marker);
		}
	}
}

function _reactZoneDragLeave(e)
{
	var zone = e.widget;
	zone.removeClassName('DragOver');
	if (_currZone === zone)
		_currZone = null;
	if (zone._isDest)
	{
		if (e.htmlEvent.relatedTarget && !Kekule.DomUtils.isOrIsDescendantOf(e.htmlEvent.relatedTarget, zone.getElement()))
		{
			//console.log('leave', e.htmlEvent.target.tagName);
			_hideInsertMarker(zone);
		}
	}
}
function _reactZoneDragDrop(e)
{
	var btn = e.srcWidget;
	var zone = e.widget;
	var fromZone = btn.getParent();  // record the previous parent of btn
	//console.log('drop', btn.getElement(), zone.getElement());
	if (_btnDragDropAllowed(btn, zone))
	{
		/*
		if (btn.getParent() !== zone)
		{
			//btn.setParent(zone);
			btn.appendToWidget(zone);
		}
		*/
		if (zone._isDest)
		{
			var dragPosRefSibling = _getBtnDragRefSibling(e.htmlEvent, zone);
			if (dragPosRefSibling)
			{
				if (dragPosRefSibling !== btn)
					btn.insertToWidget(zone, dragPosRefSibling);
			}
			else
			{
				btn.appendToWidget(zone);
			}
			_hideInsertMarker(zone);
		}
		else  // zone._isSrc
			btn.appendToWidget(zone);
		zone.removeClassName('DragOver');

		if (zone === btnDropZones.common.src || zone === btnDropZones.common.dest)  // update common btn settings
		{
			var settings = getButtonSettingOfZone(btnDropZones.common.dest, 'common');
			activeBtnSetting.common = settings;
		}
		else if (zone === btnDropZones.chem.src || zone === btnDropZones.chem.dest || zone === btnDropZones.chem.destAssoc)
		{
			if (zone === btnDropZones.chem.dest)
				btn.setAutoCheck(true);
			else
			{
				btn.setAutoCheck(false).setChecked(false);
			}

			if (fromZone === btnDropZones.chem.dest && zone === btnDropZones.chem.src)  // drop from dest to src
			{
				var btnInfo = btn._btnInfo;
				var btnItem = findActiveButtonSettingItem('chem', btnInfo.name);
				if (btnItem)
				{
					if (btnItem === currChemButtonItem)
					{
						btnDropZones.chem.destAssoc.clearWidgets();
						currChemButtonItem = null;
					}
					// move all child buttons to src also
					var childBtnInfos = findChildButtonInfos(btnItem, btnInfos.chem);
					if (childBtnInfos)
					{
						childBtnInfos.forEach(function(info) {
							createButton(info, btnDropZones.chem.src, Kekule.Widget.RadioButton).setAutoCheck(false);
						});
					}
				}
			}

			var chemSettings = getButtonSettingOfZone(btnDropZones.chem.dest, 'chem');
			var assocSettings = getButtonSettingOfZone(btnDropZones.chem.destAssoc, 'chem', true);

			activeBtnSetting.chem = chemSettings;
			if (currChemButtonItem && assocSettings)
			{
				if (typeof(currChemButtonItem) === 'string')
				{
					var index = chemSettings.indexOf(currChemButtonItem);
					currChemButtonItem = {'name': currChemButtonItem};
					chemSettings.splice(index, 1, currChemButtonItem);
				}
				currChemButtonItem.attached = assocSettings;
			}
			/*
			for (var i = 0, l = chemSettings.length; i < l; ++i)
			{
				var s = chemSettings[i];
				if (typeof(s) === 'object' && (!s.attached || !s.attached.length))
				{
					chemSettings.splice(i, 1, s.name);
					if (s === currChemButtonItem)
						currChemButtonItem = s.name;
				}
			}
			*/

			if (fromZone === btnDropZones.chem.src && zone === btnDropZones.chem.dest)
			{
				var btnInfo = btn._btnInfo;
				var btnItem = findActiveButtonSettingItem('chem', btnInfo.name);
				var defBtnItem = findDefaultButtonSettingItem('chem', btnInfo.name);
				if (btnItem && (!btnItem.attached || !btnItem.attached.length) && defBtnItem && defBtnItem.attached && defBtnItem.attached.length)
				{
					// if has default children, add them to active settings
					if (typeof(btnItem) === 'string')
					{
						var index  = chemSettings.indexOf(btnItem);
						var newBtnItem = {'name': btnItem, 'attached': []};
						chemSettings.splice(index, 1, newBtnItem);
						btnItem = newBtnItem;
					}
					//btnItem.attached = AU.clone(defBtnItem.attached);

					// remove those child items from src panel, add to curr btnItem
					defBtnItem.attached.forEach(function(item){
						var btn = findButtonOfNameInZone(btnDropZones.chem.src, item.name || item);
						if (btn)
						{
							btn.finalize();
							btnItem.attached.push(item);
						}
					});
				}
			}
			//console.log(chemSettings);
		}
		updateZoneStates();
		updateCode();
	}
}
function _reactZoneDragEnd(e)
{
	if (_currInsertMarker)
		_currInsertMarker.style.display = 'none';
	if (_currZone)
	{
		_currZone.removeClassName('DragOver');
		_currZone = null;
	}
}

function _reactObjModifierCheckChanged(e)
{
	var categories = [];
	objModifierCategoryCheckers.forEach(function(c){
		if (c.getChecked())
			categories.push(c._category);
	});
	activeObjModifierSetting = categories;
	updateCode();
}