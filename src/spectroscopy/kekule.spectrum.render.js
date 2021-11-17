/**
 * @fileoverview
 * Renderer for spectrum objects.
 * @author Partridge Jiang
 */

/*
 * requires /core/kekule.common.js
 * requires /utils/kekule.utils.js
 * requires /render/kekule.render.base.js
 * requires /render/kekule.render.utils.js
 * requires /render/kekule.baseTextRender.js
 * requires /spectroscopy/kekule.spectrum.core.js
 * requires /localization/
 */

(function(){
"use strict";

if (!Kekule.Render || !Kekule.Render.ChemObj2DRenderer)
	return;

Kekule.globalOptions.add('render.spectrum', {
	continuousSpectrumResampleRatio: 1
});

var CU = Kekule.CoordUtils;
var AU = Kekule.ArrayUtils;

/**
 * Options to display a spectrum.
 * @class
 * @augments Kekule.AbstractConfigs
 *
 * @property {Hash} defSize2DRatio Default 2D spectrum size({x, y}), these value multiply the default ref length will get the actual size.
 * @property {Bool} reversedAxises Whether reverse the X/Y axis and rotate the spectrum with 90 degree.
 * //@property {Int} spectrumIndicatorElements Default displayed indicator elements in spectrum.
 * @property {Bool} reverseIndependentDataDirection Whether reverse the min->max direction of independent data from the usual convention.
 * @property {Bool} reverseDependentDataDirection Whether reverse the min->max direction of dependent data from the usual convention.
 * @property {Bool} reverseIndependentAxisAlign Whether reverse alignment of independent data axis from the usual convention.
 * @property {Bool} reverseDependentAxisAlign Whether reverse alignment of dependent data axis from the usual convention.
 *
 * @property {String} dataColor Color to draw the spectrum data curve.
 * @property {Number} dataStrokeWidthRatio The actual stroke width of data curve is calculated from max(dataStrokeWidthRatio * refLength, dataStrokeWidthMin).
 * @property {Number} dataStrokeWidthMin The actual stroke width of data curve is calculated from max(dataStrokeWidthRatio * refLength, dataStrokeWidthMin).
 *
 * @property {Bool} displayIndependentAxis Whether rendering the independent data axis.
 * @property {Bool} displayIndependentAxisScales Whether rendering the scales in independent data axis.
 * @property {Bool} displayIndependentAxisLabel Whether rendering the axis label of independent data.
 * @property {Bool} displayIndependentAxisUnit Whether rendering the unit of independent data.
 * @property {Bool} displayDependentAxis Whether rendering the dependent data axis.
 * @property {Bool} displayDependentAxisScales Whether rendering the scales in dependent data axis.
 * @property {Bool} displayDependentAxisLabel Whether rendering the axis label of dependent data.
 * @property {Bool} displayDependentAxisUnit Whether rendering the unit of dependent data.
 *
 * @property {String} axisScaleLabelFontFamily Font family to render axis scale labels.
 * @property {Number} axisScaleLabelFontSize Font size to render axis scale labels.
 * @property {String} axisScaleLabelColor Color to render axis scale labels.
 * @property {String} axisLabelFontFamily Font family to render axis label.
 * @property {Number} axisLabelFontSize Font size to render axis label.
 * @property {String} axisLabelColor Color to render axis label.
 *
 * @property {Color} axisColor Color to render data axis.
 * @property {Number} axisWidthRatio The actual stroke width of data axis is calculated from max(axisWidthRatio * refLength, axisWidthMin).
 * @property {Number} axisWidthMin The actual stroke width of data axis is calculated from max(axisWidthRatio * refLength, axisWidthMin).
 * @property {Number} axisScaleMarkSizeRatio The actual size of scale marks in axis is calculated from max(axisScaleMarkSizeRatio * refLength, axisScaleMarkSizeMin).
 * @property {Number} axisScaleMarkSizeMin The actual size of scale marks in axis is calculated from max(axisScaleMarkSizeRatio * refLength, axisScaleMarkSizeMin).
 * @property {Number} axisUnlabeledScaleSizeRatio The size of scale mark without a label is calculated from max(axisUnlabeledScaleSizeRatio * axisScaleMarkSizeRatio * refLength, axisScaleMarkSizeMin).
 * @property {Number} axisLabelPaddingRatio The padding of axis label is calculated from axisLabelPaddingRatio * refLength.
 * @property {Number} axisScaleLabelPaddingRatio The padding of axis scale labels is calculated from axisLabelPaddingRatio * refLength.
 *
 * @property {Number} axisScaleMarkPreferredCount Preferred scale count in data axis.
 */
Kekule.Render.SpectrumDisplayConfigs = Class.create(Kekule.AbstractConfigs,
/** @lends Kekule.Render.SpectrumDisplayConfigs# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.SpectrumDisplayConfigs',
	/** @private */
	initProperties: function()
	{
		this.addHashConfigProp('defSize2DRatio');
		//this.addHashConfigProp('defSpectrumSize3D');

		//this.addBoolConfigProp('spectrumAbscissaAxisOnMinEnd', true);
		this.addBoolConfigProp('reversedAxises', false);

		this.addBoolConfigProp('reverseIndependentDataDirection', false);
		this.addBoolConfigProp('reverseDependentDataDirection', false);
		this.addBoolConfigProp('reverseIndependentAxisAlign', false);
		this.addBoolConfigProp('reverseDependentAxisAlign', false);

		//this.addBoolConfigProp('spectrumAbscissaAxisOnMinEnd', true);
		//this.addBoolConfigProp('spectrumOrdinateAxisOnMinEnd', true);

		this.addStrConfigProp('dataColor', '#000000');
		this.addFloatConfigProp('dataStrokeWidthRatio', 0.025);
		this.addFloatConfigProp('dataStrokeWidthMin', 1);

		// default data range
		this.addFloatConfigProp('visibleIndependentDataRangeFrom', 0);
		this.addFloatConfigProp('visibleIndependentDataRangeTo', 1);
		this.addFloatConfigProp('visibleDependentDataRangeFrom', -0.05);
		this.addFloatConfigProp('visibleDependentDataRangeTo', 1.05);

		// specified data range for peak/continuous spectrum
		this.addFloatConfigProp('visibleIndependentDataRangeFrom_Peak', -0.05);
		this.addFloatConfigProp('visibleIndependentDataRangeTo_Peak', 1.05);
		this.addFloatConfigProp('visibleDependentDataRangeFrom_Peak', -0.05);
		this.addFloatConfigProp('visibleDependentDataRangeTo_Peak', 1.05);
		this.addFloatConfigProp('visibleIndependentDataRangeFrom_Continuous', 0);
		this.addFloatConfigProp('visibleIndependentDataRangeTo_Continuous', 1);
		this.addFloatConfigProp('visibleDependentDataRangeFrom_Continuous', -0.05);
		this.addFloatConfigProp('visibleDependentDataRangeTo_Continuous', 1.05);

		// config about displayed elements
		//this.addBoolConfigProp('displaySpectrumGrid', true);
		this.addBoolConfigProp('displayIndependentAxis', true);
		this.addBoolConfigProp('displayIndependentAxisScales', true);
		this.addBoolConfigProp('displayIndependentAxisLabel', true);
		this.addBoolConfigProp('displayIndependentAxisUnit', true);
		this.addBoolConfigProp('displayDependentAxis', true);
		this.addBoolConfigProp('displayDependentAxisScales', true);
		this.addBoolConfigProp('displayDependentAxisLabel', true);
		this.addBoolConfigProp('displayDependentAxisUnit', true);
		// configs of elements
		this.addStrConfigProp('axisScaleLabelFontFamily', 'Arial, Helvetica, sans-serif');
		this.addFloatConfigProp('axisScaleLabelFontSize', 7);
		this.addStrConfigProp('axisScaleLabelColor', '#000000');
		this.addStrConfigProp('axisLabelFontFamily', 'Arial, Helvetica, sans-serif');
		this.addFloatConfigProp('axisLabelFontSize', 10);
		this.addStrConfigProp('axisLabelColor', '#000000');
		this.addStrConfigProp('axisColor', '#000000');
		this.addFloatConfigProp('axisWidthRatio', 0.025);
		this.addFloatConfigProp('axisWidthMin', 1);
		this.addFloatConfigProp('axisScaleMarkSizeRatio', 0.1);
		this.addFloatConfigProp('axisScaleMarkSizeMin', 3);
		this.addFloatConfigProp('axisUnlabeledScaleSizeRatio', 0.7);
		this.addIntConfigProp('axisScaleMarkPreferredCount', 10);
		this.addFloatConfigProp('axisLabelPaddingRatio', 0.02);
		this.addFloatConfigProp('axisScaleLabelPaddingRatio', 0.02);
	},
	/** @ignore */
	initPropDefValues: function()
	{
		this.tryApplySuper('initPropDefValues');
		//var defScaleRefLength = 0.8; // Kekule.Render.getRender2DConfigs().getLengthConfigs().getDefScaleRefLength();
		this.setDefSize2DRatio({'x': 12, 'y': 8});
		//this.setDefSpectrumSize3D({'x': defScaleRefLength * 10, 'y': defScaleRefLength * 10, 'z': defScaleRefLength * 10});
	},
	/** @ignore */
	doGetPropNameToHashPrefix: function()
	{
		return 'spectrum_';
	}
});

// extents some render config classes
/** @ignore */
ClassEx.extendMethod(Kekule.Render.Render2DConfigs, 'initProperties',
	function(originMethod)
	{
		originMethod();
		this.addConfigProp('spectrumDisplayConfigs', 'Kekule.Render.SpectrumDisplayConfigs');
	});
/** @ignore */
ClassEx.extendMethod(Kekule.Render.Render2DConfigs, 'initPropDefValues',
	function(originMethod)
	{
		originMethod();
		this.setPropStoreFieldValue('spectrumDisplayConfigs', new Kekule.Render.SpectrumDisplayConfigs());
	});

// extents Spectrum class to init with the default size
ClassEx.extendMethod(Kekule.Spectroscopy.Spectrum, 'initPropValues',
	function(originMethod)
	{
		originMethod();
		var size2D = this.getSize2D();
		if (!size2D)  // initial a default 2D size of spectrum
		{
			var configs = Kekule.Render.Render2DConfigs.getInstance();
			var sizeRatio = configs.getSpectrumDisplayConfigs().getDefSize2DRatio();
			var refLength = configs.getLengthConfigs().getDefScaleRefLength();
			if (sizeRatio && refLength)
				size2D = CU.multiply(sizeRatio, refLength);
			this.setSize2D(size2D);
		}
	});
ClassEx.extendMethod(Kekule.Spectroscopy.Spectrum, 'doGetObjAnchorPosition',
	function(originMethod, coordMode)
	{
		return Kekule.ObjAnchorPosition.CENTER;
	});

// extend Kekule.Render.RenderOptionUtils.getOptionDefinitions for property editors for spectrum objects
/** @ignore */
function extendRenderOptionPropEditors()
{
	var appendDefinitionItem = function(definitions, fieldName, dataType, targetClasses, fieldNamePrefixes)
	{
		var classes = AU.toArray(targetClasses);
		var prefixes = fieldNamePrefixes || [''];
		for (var i = 0, l = classes.length; i < l; ++i)
		{
			for (var j = 0, k = prefixes.length; j < k; ++j)
			{
				var name = prefixes[j]? (prefixes[j] + fieldName.upperFirst()): fieldName;
				definitions.push({'name': 'spectrum_' + name, 'dataType': dataType, 'targetClass': classes[i]});
			}
		}
	};

	//Kekule.Render.RenderOptionUtils.getOptionDefinitions = function()
	var getSpectrumObjRenderOptionFieldList = function()
	{
		//var result = Kekule.Render.RenderOptionUtils.getOptionDefinitions();
		var result = [];
		var SpectrumClass = Kekule.Spectroscopy.Spectrum;
		var SpectrumDataSectionClass = Kekule.Spectroscopy.SpectrumDataSection;
		var axisPrefixes = ['', 'independent', 'dependent'];

		appendDefinitionItem(result, 'reversedAxises', DataType.BOOL, SpectrumClass);
		appendDefinitionItem(result, 'reverseIndependentDataDirection', DataType.BOOL, SpectrumClass);
		appendDefinitionItem(result, 'reverseDependentDataDirection', DataType.BOOL, SpectrumClass);
		appendDefinitionItem(result, 'reverseIndependentAxisAlign', DataType.BOOL, SpectrumClass);
		appendDefinitionItem(result, 'reverseDependentAxisAlign', DataType.BOOL, SpectrumClass);
		appendDefinitionItem(result, 'dataColor', DataType.STRING, [SpectrumClass, SpectrumDataSectionClass]);
		appendDefinitionItem(result, 'dataStrokeWidthRatio', DataType.FLOAT, [SpectrumClass, SpectrumDataSectionClass]);
		appendDefinitionItem(result, 'dataStrokeWidthMin', DataType.NUMBER, [SpectrumClass, SpectrumDataSectionClass]);
		appendDefinitionItem(result, 'visibleIndependentDataRangeFrom', DataType.FLOAT, SpectrumClass);
		appendDefinitionItem(result, 'visibleIndependentDataRangeTo', DataType.FLOAT, SpectrumClass);
		appendDefinitionItem(result, 'visibleDependentDataRangeFrom', DataType.FLOAT, SpectrumClass);
		appendDefinitionItem(result, 'visibleDependentDataRangeTo', DataType.FLOAT, SpectrumClass);
		appendDefinitionItem(result, 'visibleIndependentDataRangeFrom', DataType.BOOL, SpectrumClass);

		appendDefinitionItem(result, 'displayIndependentAxis', DataType.BOOL, SpectrumClass);
		appendDefinitionItem(result, 'displayIndependentAxisScales', DataType.BOOL, SpectrumClass);
		appendDefinitionItem(result, 'displayIndependentAxisLabel', DataType.BOOL, SpectrumClass);
		appendDefinitionItem(result, 'displayIndependentAxisUnit', DataType.BOOL, SpectrumClass);
		appendDefinitionItem(result, 'displayDependentAxis', DataType.BOOL, SpectrumClass);
		appendDefinitionItem(result, 'displayDependentAxisScales', DataType.BOOL, SpectrumClass);
		appendDefinitionItem(result, 'displayDependentAxisLabel', DataType.BOOL, SpectrumClass);
		appendDefinitionItem(result, 'displayDependentAxisUnit', DataType.BOOL, SpectrumClass);

		appendDefinitionItem(result, 'axisScaleLabelFontFamily', DataType.STRING, SpectrumClass, axisPrefixes);
		appendDefinitionItem(result, 'axisScaleLabelFontSize', DataType.NUMBER, SpectrumClass, axisPrefixes);
		appendDefinitionItem(result, 'axisScaleLabelColor', DataType.STRING, SpectrumClass, axisPrefixes);
		appendDefinitionItem(result, 'axisLabelFontFamily', DataType.STRING, SpectrumClass, axisPrefixes);
		appendDefinitionItem(result, 'axisLabelFontSize', DataType.NUMBER, SpectrumClass, axisPrefixes);
		appendDefinitionItem(result, 'axisLabelColor', DataType.STRING, SpectrumClass, axisPrefixes);
		appendDefinitionItem(result, 'axisColor', DataType.STRING, SpectrumClass, axisPrefixes);
		appendDefinitionItem(result, 'axisWidthRatio', DataType.FLOAT, SpectrumClass, axisPrefixes);
		appendDefinitionItem(result, 'axisWidthMin', DataType.NUMBER, SpectrumClass, axisPrefixes);
		appendDefinitionItem(result, 'axisScaleMarkSizeRatio', DataType.FLOAT, SpectrumClass, axisPrefixes);
		appendDefinitionItem(result, 'axisScaleMarkSizeMin', DataType.NUMBER, SpectrumClass, axisPrefixes);
		appendDefinitionItem(result, 'axisUnlabeledScaleSizeRatio', DataType.FLOAT, SpectrumClass, axisPrefixes);
		appendDefinitionItem(result, 'axisScaleMarkPreferredCount', DataType.NUMBER, SpectrumClass, axisPrefixes);
		appendDefinitionItem(result, 'axisLabelPaddingRatio', DataType.FLOAT, SpectrumClass, axisPrefixes);
		appendDefinitionItem(result, 'axisScaleLabelPaddingRatio', DataType.NUMBER, SpectrumClass, axisPrefixes);

		return result;
	}

	// hack
	if (Kekule.PropertyEditor && Kekule.PropertyEditor.ChemRender2DOptionsEditor)
	{
		var proto = ClassEx.getPrototype(Kekule.PropertyEditor.ChemRender2DOptionsEditor);
		proto.CHILD_FIELD_INFOS = proto.CHILD_FIELD_INFOS.concat(getSpectrumObjRenderOptionFieldList());
	}
};

Kekule._registerAfterLoadSysProc(extendRenderOptionPropEditors);

/**
 * Helper Util class to render coordinate axises in spectrum.
 * @class
 */
Kekule.Render.CoordAxisRender2DUtils = {
	/**
	 * Draw abscissa and ordinate axis.
	 * @param {Object} drawBridge
	 * @param {Object} richTextDrawer
	 * @param {Object} context
	 * @param {Hash} renderBox
	 * @param {Hash} params Params to draw axises.
	 *   It may contain the following fields:
	 *   {
	 *     abscissaDataRange: hash of {min, max},
	 *     abscissaScales: array of scale numbers,
	 *     abscissaScaleBase: scale based number, e.g. 10e3
	 *     abscissaScaleUseSciForm: bool,
	 *     abscissaScaleFixedDigitCountAfterPoint: int,
	 *     //abscissaScaleMarkSize,
	 *     abscissaUnitLabel: rich text label for abscissa axis unit.
	 *     abscissaLabel: rich text label for abscissa axis,
	 *     abscissaAxisPosition: int, 0 for on bottom and 1 for on top
	 *     abscissaReversedDirection: bool, set true to draw min value on right and max on left
	 *     ordinateDataRange: hash of {min, max},
	 *     ordinateScales: array of scale numbers,
	 *     ordinateScaleBase: scale based number, e.g. 10e3
	 *     ordinateScaleUseSciForm: bool,
	 *     ordinateScaleFixedDigitCountAfterPoint: int,
	 *     //ordinateScaleMarkSize,
	 *     ordinateUnitLabel: rich text label for ordinate axis unit.
	 *     ordinateLabel: rich text label for ordinate axis
	 *     ordinateAxisPosition: int, 0 for on left and 1 for on right
	 *     ordinateReversedDirection: bool, set true to draw min value on top and max on bottom
	 *   }
	 * @param {Hash} renderOptions
	 * @Returns {Hash} A hash object containing fields: {drawnElem, clientBox}
	 */
	drawAxises: function(drawBridge, richTextDrawer, context, renderBox, params, renderOptions)
	{
		//console.log('drawAxises', renderBox, params, renderOptions);
		var getScaleRichTexts = function(scales, fixDigitsCountAfterPoint, scaleBase, useSciForm)
		{
			var RU = Kekule.Render.RichTextUtils;
			var result = [];
			var sciFormExponent = useSciForm? Math.round(Math.log10(scaleBase)): null;
			//var digitCountAfterPoint = (scaleBase > 1)? 0:
			for (var i = 0, l = scales.length; i < l; ++i)
			{
				var scale = scales[i];
				//var digitCount = Math.log10(Math.abs(scale));
				//var useSciForm = digitCount > 6;  // TODO: Currently fixed
				var num = sciFormExponent? scale / scaleBase: scale;
				var snum = num.toFixed(fixDigitsCountAfterPoint);
				var rt;
				if (!sciFormExponent || Kekule.NumUtils.isFloatEqual(snum, 0))  // normal form
					rt = RU.strToRichText(snum);
				else
				{
					rt = RU.createGroup(null, {'charDirection': Kekule.Render.TextDirection.LTR});
					var coreSec = RU.appendText2(rt, snum + '×10');
					RU.appendText(rt, sciFormExponent.toFixed(0), {'textType': Kekule.Render.RichText.SUP, 'refItem': coreSec});
				}
				result.push(rt);
			}
			return result;
		};

		var drawAbscissa = !!params.abscissaDataRange;
		var drawOrdinate = !!params.ordinateDataRange;

		if (!drawAbscissa && !drawOrdinate)
			return null;

		var abscissaScaleLabels = (drawAbscissa && params.abscissaScales)?
			getScaleRichTexts(params.abscissaScales, params.abscissaScaleFixedDigitCountAfterPoint, params.abscissaScaleBase, params.abscissaScaleUseSciForm): null;
		var ordinateScaleLabels = (drawOrdinate && params.ordinateScales)?
			getScaleRichTexts(params.ordinateScales, params.ordinateScaleFixedDigitCountAfterPoint, params.ordinateScaleBase, params.ordinateScaleUseSciForm): null;

		// TODO: currently we always draw axis label and unit together
		var RTU = Kekule.Render.RichTextUtils;
		var actualParams = Object.create(params);
		if (drawAbscissa)
		{
			if (actualParams.abscissaLabel && actualParams.abscissaUnitLabel)  // merge two labels
			{
				var newLabel = Kekule.Render.RichTextUtils.createGroup(null, {'charDirection': Kekule.Render.TextDirection.LTR});
				RTU.append(newLabel, actualParams.abscissaLabel);
				RTU.appendText(newLabel, ' (');
				RTU.append(newLabel, actualParams.abscissaUnitLabel);
				RTU.appendText(newLabel, ')');
				actualParams.abscissaLabel = newLabel;
			}
			else
				actualParams.abscissaLabel = actualParams.abscissaLabel || actualParams.abscissaUnitLabel;
			actualParams.abscissaUnitLabel = null;
		}
		if (drawOrdinate)
		{
			if (actualParams.ordinateLabel && actualParams.ordinateUnitLabel)  // merge two labels
			{
				var newLabel = Kekule.Render.RichTextUtils.createGroup(null, {'charDirection': Kekule.Render.TextDirection.LTR});
				RTU.append(newLabel, actualParams.ordinateLabel);
				RTU.appendText(newLabel, ' (');
				RTU.append(newLabel, actualParams.ordinateUnitLabel);
				RTU.appendText(newLabel, ')');
				actualParams.ordinateLabel = newLabel;
			}
			else
				actualParams.ordinateLabel = actualParams.ordinateLabel || actualParams.ordinateUnitLabel;
			actualParams.ordinateUnitLabel = null;
		}

		// estimate the size of axis
		var abscissaSizes = drawAbscissa?
			ARU._estimateAxisSizes(drawBridge, richTextDrawer, context, renderBox, abscissaScaleLabels, actualParams.abscissaUnitLabel, actualParams.abscissaLabel, renderOptions, true, actualParams.abscissaAxisPosition === 1):
			null;
		var ordinateSizes = drawOrdinate?
			ARU._estimateAxisSizes(drawBridge, richTextDrawer, context, renderBox, ordinateScaleLabels, actualParams.ordinateUnitLabel, actualParams.ordinateLabel, renderOptions, false, actualParams.ordinateAxisPosition === 0):
			null;

		// do the concrete drawing
		var result = drawBridge.createGroup(context);
		var elem;

		var abscissaRenderBox = Object.create(renderBox);
		var ordinateRenderBox = Object.create(renderBox);

		// adjust sizes of axis, avoid overlaping
		if (ordinateSizes)
		{
			if (params.ordinateAxisPosition === 0)  // ordinate on left
				abscissaRenderBox.x1 += Math.min(ordinateSizes.total.x, abscissaRenderBox.x2 - abscissaRenderBox.x1);  // avoid x1 > x2
			else
				abscissaRenderBox.x2 -= Math.min(ordinateSizes.total.x, abscissaRenderBox.x2 - abscissaRenderBox.x1);  // avoid x1 > x2
		}
		if (abscissaSizes)
		{
			if (params.abscissaAxisPosition === 1)  // abscissa on top
				ordinateRenderBox.y1 += Math.min(abscissaSizes.total.y, ordinateRenderBox.y2 - ordinateRenderBox.y1);  // avoid y2 > y1
			else
				ordinateRenderBox.y2 -= Math.min(abscissaSizes.total.y, ordinateRenderBox.y2 - ordinateRenderBox.y1);  // avoid y2 > y1
		}

		if (drawAbscissa)
		{
			var scaleLabels = abscissaScaleLabels;
				/*
				params.abscissaScales?
				getScaleRichTexts(params.abscissaScales, params.abscissaScaleFixedDigitCountAfterPoint, params.abscissaScaleBase, params.abscissaScaleUseSciForm):
				null;
				*/
			elem = ARU._drawSingleAxis(drawBridge, richTextDrawer, context, abscissaRenderBox,
				actualParams.abscissaDataRange, actualParams.abscissaScales, scaleLabels,
				actualParams.abscissaUnitLabel, actualParams.abscissaLabel, abscissaSizes, renderOptions, true, actualParams.abscissaAxisPosition === 1,
				actualParams.abscissaReversedDirection);
			if (elem)
				drawBridge.addToGroup(elem, result);
		}
		if (drawOrdinate)
		{
			var scaleLabels = ordinateScaleLabels;
			elem = ARU._drawSingleAxis(drawBridge, richTextDrawer, context, ordinateRenderBox,
				actualParams.ordinateDataRange, actualParams.ordinateScales, scaleLabels,
				actualParams.ordinateUnitLabel, actualParams.ordinateLabel, ordinateSizes, renderOptions, false, actualParams.ordinateAxisPosition !== 1,
				actualParams.ordinateReversedDirection);
			if (elem)
				drawBridge.addToGroup(elem, result);
		}

		/*
		var clientBox = {
			'left': abscissaRenderBox.left,
			'width': abscissaRenderBox.width,
			'top': ordinateRenderBox.top,
			'height': ordinateRenderBox.height
		};
		*/
		var clientBox = {
			'x1': abscissaRenderBox.x1,
			'x2': abscissaRenderBox.x2,
			'y1': ordinateRenderBox.y1,
			'y2': ordinateRenderBox.y2,
		};

		return {
			'drawnElem': result,
			'clientBox': clientBox
		};
	},
	/** @private */
	_drawSingleAxis: function(drawBridge, richTextDrawer, context, renderBox, dataRange, scales, scaleLabels, unitLabel, axisLabel, elementSizes, renderOptions, isAbscissa, isOnTopOrLeft, isReversedDir)
	{
		var BXA = Kekule.Render.BoxXAlignment;
		var BYA = Kekule.Render.BoxYAlignment;
		var alignOnTopOrLeft = isOnTopOrLeft;
		var primaryAxis = isAbscissa? 'x': 'y';
		var secondaryAxis = isAbscissa? 'y': 'x';
		var primaryRectDir = isAbscissa? 'width': 'height';
		var secondaryRectDir = isAbscissa? 'height': 'width';
		var rOptions = (isAbscissa? renderOptions.abscissa: renderOptions.ordinate) || renderOptions;
		//var primarySizeDir = isAbscissa? 'width': 'height';
		//var secondarySizeDir = isAbscissa? 'height': 'width';

		var stageSize = {'x': renderBox.x2 - renderBox.x1, 'y': renderBox.y2 - renderBox.y1};
		if (stageSize.x <= 0 || stageSize.y <= 0)  // size is too small to draw
			return null;

		var result = drawBridge.createGroup(context);
		var basePos = {'x': renderBox.x1, 'y': renderBox.y1};
		var isMaxValueOnRightOrBottom = isAbscissa? !isReversedDir: isReversedDir;
		var coord = {}, coord2 = {};
		var drawLabelOptions;
		var occupiedSizeOnSecondaryDir = 0;
		var elem;
		// TODO: currently many drawing options are fixed
		// TODO: since the alignRect of richText does not consider sub/sup, need to calculate the pos of all labels with left alignment
		// draw axis label
		if (axisLabel)
		{
			coord[primaryAxis] = basePos[primaryAxis] + stageSize[primaryAxis] / 2 - elementSizes.axisLabel[primaryAxis] / 2 * (isAbscissa? 1: -1);
			coord[secondaryAxis] = basePos[secondaryAxis]
				+ (alignOnTopOrLeft?
						(elementSizes.axisLabelPadding[secondaryAxis] + elementSizes.axisLabel[secondaryAxis] / 2):
						(stageSize[secondaryAxis] - (elementSizes.axisLabelPadding[secondaryAxis] + elementSizes.axisLabel[secondaryAxis] / 2))
					);
			drawLabelOptions = Object.extend(Object.extend({}, rOptions.axisLabel),
				{'textBoxXAlignment': BXA.LEFT, 'textBoxYAlignment': BYA.CENTER});
			if (!isAbscissa)
				drawLabelOptions.transforms = [{'rotate': -Math.PI / 2, 'center': Object.extend({}, coord)}];
			//elem = drawBridge.drawRichText(context, coord, axisLabel, drawLabelOptions);
			var textDrawResult = richTextDrawer.drawEx(context, coord, axisLabel, drawLabelOptions);
			elem = textDrawResult.drawnObj;
			drawBridge.addToGroup(elem, result);
			occupiedSizeOnSecondaryDir += elementSizes.axisLabel[secondaryAxis] + elementSizes.axisLabelPadding[secondaryAxis] * 2;
		}
		var axisRenderOptions = Object.create(rOptions.axis);
		if (!axisRenderOptions.strokeColor)
			axisRenderOptions.strokeColor = axisRenderOptions.color;
		if (!axisRenderOptions.fillColor)
			axisRenderOptions.fillColor = axisRenderOptions.color;

		// draw scale markers and scale labels
		if (scales && scaleLabels)
		{
			var dRange = dataRange.max - dataRange.min;  // here we should use from/to?
			/*
			var labelRenderAlignOps = isAbscissa?
				{'textBoxXAlignment': BXA.CENTER, 'textBoxYAlignment': alignOnTopOrLeft? BYA.BOTTOM: BYA.TOP}:
				{'textBoxXAlignment': alignOnTopOrLeft? BXA.RIGHT: BXA.LEFT, 'textBoxYAlignment': BYA.CENTER};
			*/
			var labelRenderAlignOps = isAbscissa?
				{'textBoxXAlignment': BXA.LEFT, 'textBoxYAlignment': alignOnTopOrLeft? BYA.BOTTOM: BYA.TOP}:
				{'textBoxXAlignment': BXA.LEFT, 'textBoxYAlignment': BYA.CENTER};
			drawLabelOptions = Object.extend(Object.create(rOptions.scaleLabel), labelRenderAlignOps);
			coord[secondaryAxis] = alignOnTopOrLeft?
				(basePos[secondaryAxis] + occupiedSizeOnSecondaryDir + elementSizes.scaleLabel[secondaryAxis] + elementSizes.scaleLabelPadding[secondaryAxis]):
				(basePos[secondaryAxis] + stageSize[secondaryAxis] - occupiedSizeOnSecondaryDir - elementSizes.scaleLabel[secondaryAxis] - elementSizes.scaleLabelPadding[secondaryAxis]);
			var scaleLabelCoord = {};
			scaleLabelCoord[secondaryAxis] = coord[secondaryAxis];
			//console.log('scaleLabel pos', secondaryAxis, coord[secondaryAxis]);
			//drawBridge.drawRect(context, c2, Kekule.CoordUtils.add(c2, elementSizes.scaleLabel), rOptions.axis);

			// if the scaleLabel size overlaps each other, we need to bypass some of them
			var basedScaleLabelSize = stageSize[primaryAxis] / (scaleLabels.length - 1);
			var currScaleLabelSize = basedScaleLabelSize;
			var labelPerScales = 1;
			while (currScaleLabelSize < elementSizes.scaleLabel[primaryAxis] && basedScaleLabelSize > 0)
			{
				++labelPerScales;
				currScaleLabelSize += basedScaleLabelSize;
			}

			for (var i = 0, l = scales.length; i < l; ++i)
			{
				var scalePosDelta = isMaxValueOnRightOrBottom? (scales[i] - dataRange.min): (dataRange.max - scales[i]);
				var scalePos = scalePosDelta / dRange * stageSize[primaryAxis] + basePos[primaryAxis];
				coord[primaryAxis] = scalePos;

				// scale
				var scaleLabeled = false;
				if (i % labelPerScales === 0)
				{
					scaleLabelCoord[primaryAxis] = coord[primaryAxis];
					if (isAbscissa)
					{
						var scaleLabelRect = richTextDrawer.measure(context, scaleLabelCoord, scaleLabels[i], drawLabelOptions);
						scaleLabelCoord.x = coord.x - scaleLabelRect.width / 2;
					} else if (alignOnTopOrLeft)  // scale label in ordinate axis, adjust X position when need to align to right
					{
						var scaleLabelRect = richTextDrawer.measure(context, scaleLabelCoord, scaleLabels[i], drawLabelOptions);
						scaleLabelCoord.x = coord.x - scaleLabelRect.width;
					}
					//elem = drawBridge.drawRichText(context, coord, scaleLabels[i], drawLabelOptions);
					var textDrawResult = richTextDrawer.drawEx(context, scaleLabelCoord, scaleLabels[i], drawLabelOptions);
					elem = textDrawResult.drawnObj;
					/* debug
					var bound = textDrawResult.alignRect;
					drawBridge.drawRect(context, {x: bound.left, y: bound.top}, {'x': bound.left + bound.width, 'y': bound.top + bound.height}, rOptions);
					console.log('scale bound', bound);
					*/
					drawBridge.addToGroup(elem, result);
					scaleLabeled = true;
				}
				// scale mark
				var coord1 = {'x': coord.x, 'y': coord.y};
				var scaleMarkSize = elementSizes.scaleMark[secondaryAxis];
				coord1[secondaryAxis] += (scaleMarkSize + elementSizes.scaleLabelPadding[secondaryAxis]) * (isOnTopOrLeft? 1: -1);
				if (!scaleLabeled)
					scaleMarkSize *= (axisRenderOptions.unlabeledScaleSizeRatio || 1);
				coord2[primaryAxis] = scalePos;
				coord2[secondaryAxis] = coord1[secondaryAxis] - scaleMarkSize * (isOnTopOrLeft? 1: -1);
				elem = drawBridge.drawLine(context, coord1, coord2, axisRenderOptions);
				drawBridge.addToGroup(elem, result);
			}
			occupiedSizeOnSecondaryDir += elementSizes.scaleLabel[secondaryAxis] + elementSizes.scaleLabelPadding[secondaryAxis] * 2 + elementSizes.scaleMark[secondaryAxis];  //+ elementSizes.axis[secondaryAxis];
		}

		// draw axis
		coord[primaryAxis] = basePos[primaryAxis];
		coord[secondaryAxis] = alignOnTopOrLeft?
			(basePos[secondaryAxis] + occupiedSizeOnSecondaryDir + elementSizes.axis[secondaryAxis] / 2):
			(basePos[secondaryAxis] + stageSize[secondaryAxis] - occupiedSizeOnSecondaryDir - elementSizes.axis[secondaryAxis] / 2);
		coord2[primaryAxis] = coord[primaryAxis] + stageSize[primaryAxis];
		coord2[secondaryAxis] = coord[secondaryAxis];
		elem = drawBridge.drawLine(context, coord, coord2, Object.extend({'lineCap': 'square'}, axisRenderOptions));
		drawBridge.addToGroup(elem, result);

		return result;
	},
	/** @private */
	_estimateAxisSizes: function(drawBridge, richTextDrawer, context, renderBox, scaleLabels, unitLabel, axisLabel, renderOptions, isAbscissa, isOnTopOrLeft)
	{
		var rOptions = (isAbscissa? renderOptions.abscissa: renderOptions.ordinate) || renderOptions;
		var scaleLabelSize = {'x': 0, 'y': 0};
		var scaleLabelPaddingSize = {'x': 0, 'y': 0};
		// here we check the first and last scale labels to roughly determinate the occupied dimensions of scale labels
		if (scaleLabels && scaleLabels.length)
		{
			var scaleLabelsFirst = scaleLabels[0];
			var scaleLabelsLast = scaleLabels[scaleLabels.length - 1];
			var scaleLabelFirstDim = richTextDrawer.measure(context, {'x': 0, 'y': 0}, scaleLabelsFirst, rOptions.scaleLabel);
			var scaleLabelLastDim = richTextDrawer.measure(context, {'x': 0, 'y': 0}, scaleLabelsLast, rOptions.scaleLabel);
			scaleLabelSize = {'x': Math.max(scaleLabelFirstDim.width, scaleLabelLastDim.width), 'y': Math.max(scaleLabelFirstDim.height, scaleLabelLastDim.height)};
			scaleLabelPaddingSize = {'x': (rOptions.scaleLabel.padding || 0), 'y': (rOptions.scaleLabel.padding || 0)};
		}
		// the unit label
		var unitLabelSize = {'x': 0, 'y': 0};
		if (unitLabel)
		{
			var unitLabelDim = richTextDrawer.measure(context, {'x': 0, 'y': 0}, unitLabel, rOptions.unitLabel);
			unitLabelSize.x = Math.max(scaleLabelSize.x, unitLabelDim.width);
			unitLabelSize.y = Math.max(scaleLabelSize.y, unitLabelDim.height);
		}
		// the axis label
		var axisLabelSize = {'x': 0, 'y': 0};
		var axisLabelPaddingSize = {'x': 0, 'y': 0};
		if (axisLabel)
		{
			var axisLabelDim = richTextDrawer.measure(context, {'x': 0, 'y': 0}, axisLabel, rOptions.axisLabel);
			if (isAbscissa)
				axisLabelSize = {'x': axisLabelDim.width, 'y': axisLabelDim.height};
			else  // for ordinate axis, we need to draw the label with 90 deg rotation
				axisLabelSize = {'y': axisLabelDim.width, 'x': axisLabelDim.height};
			// console.log('axisLabelSize', Kekule.Render.RichTextUtils.toText(axisLabel), axisLabelSize);
			axisLabelPaddingSize = {'x': (rOptions.axisLabel && rOptions.axisLabel.padding || 0), 'y': (rOptions.axisLabel && rOptions.axisLabel.padding || 0)};
		}
		// the scale marks
		var axisOptions = rOptions.axis;
		var scaleMarkSize = isAbscissa? {'x': 0, 'y': axisOptions.scaleMarkSize}: {'x': axisOptions.scaleMarkSize, 'y': 0};
		// the axis
		var axisSize = isAbscissa? {'x': 0, 'y': axisOptions.strokeWidth}: {'x': axisOptions.strokeWidth, 'y': 0};

		// sum up
		var totalSize = {};
		if (isAbscissa)
		{
			totalSize.x = renderBox.x2 - renderBox.x1;
			totalSize.y = scaleLabelSize.y + axisLabelSize.y + axisSize.y + scaleMarkSize.y + scaleLabelPaddingSize.y * 2 + axisLabelPaddingSize.y * 2;
		}
		else
		{
			totalSize.y = renderBox.y2 - renderBox.y1;
			totalSize.x = scaleLabelSize.x + axisLabelSize.x + axisSize.x + scaleMarkSize.x + scaleLabelPaddingSize.x * 2 + axisLabelPaddingSize.x * 2;
		}
		var result = {
			total: totalSize,
			axis: axisSize,
			scaleMark: scaleMarkSize,
			scaleLabel: scaleLabelSize,
			scaleLabelPadding: scaleLabelPaddingSize,
			unitLabel: unitLabelSize,
			axisLabel: axisLabelSize,
			axisLabelPadding: axisLabelPaddingSize,
		};
		return result;
	}
};
var ARU = Kekule.Render.CoordAxisRender2DUtils;

/**
 * Some util functions for 2D spectrum rendering.
 * @class
 */
Kekule.Render.Spectrum2DRenderUtils = {
	/**
	 * Returns false if the axis direction should be reversed.
	 * @param {String} spectrumType
	 * @param {Bool} isIndependent
	 * @param {String} axisUnitSymbol
	 * @private
	 */
	_getDataDefaultAxisDirection: function(spectrumType, isIndependent, axisUnitSymbol)
	{
		var ST = Kekule.Spectroscopy.SpectrumType;
		var KU = Kekule.Unit;
		var result = true;
		if (spectrumType === ST.NMR)
		{
			if (isIndependent)  // ppm, Hz... should be from right to left
				result = false;
		}
		if (spectrumType === ST.IR)
		{
			if (isIndependent)
			{
				if (axisUnitSymbol)
				{
					var unitObj = KU.getUnit(axisUnitSymbol);
					if (unitObj.category === KU.WaveNumber)
						return false;
				}
				/*
				if (axisUnitSymbol === KU.WaveNumber.RECIPROCAL_CENTIMETER)
					result = false;
				*/
			}
		}
		return result;
	},
	/**
	 * Returns false if the axis should be at the left/bottom rather than the right/top.
	 * @param {String} spectrumType
	 * @param {Bool} isIndependent
	 * @param {String} axisUnitSymbol
	 * @private
	 */
	_getDataDefaultAxisAlign: function(spectrumType, isIndependent, axisUnitSymbol)
	{
		var ST = Kekule.Spectroscopy.SpectrumType;
		var KU = Kekule.Unit;
		var result = true;
		return result;
	},

	getDefaultAxisDirectionAndAlignInfo: function(spectrumType, isIndependant, axisUnitSymbol)
	{
		var defaultDirection = Kekule.Render.Spectrum2DRenderUtils._getDataDefaultAxisDirection(spectrumType, isIndependant, axisUnitSymbol);
		var defaultAlign = Kekule.Render.Spectrum2DRenderUtils._getDataDefaultAxisAlign(spectrumType, isIndependant, axisUnitSymbol);
		return {
			'reversedDirection': !defaultDirection,
			'reversedAlign': !defaultAlign
		}
	}
};


/**
 * Base spectrum render.
 * @class
 * @augments Kekule.Render.ChemObj2DRenderer
 */
Kekule.Render.Spectrum2DRenderer = Class.create(Kekule.Render.ChemObj2DRenderer,
/** @lends Kekule.Render.Spectrum2DRenderer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.Spectrum2DRenderer',
	/** @constructs */
	initialize: function(chemObj, drawBridge, parent)
	{
		this.tryApplySuper('initialize', [chemObj, drawBridge, parent]);
		this._initSectionDataDrawerMap();
	},
	/** @private */
	_initSectionDataDrawerMap: function()
	{
		Kekule.Render.Spectrum2DRenderer.sectionDataDrawerMap[Kekule.Spectroscopy.DataMode.CONTINUOUS] = this.doDrawContinuousSectionData;
		Kekule.Render.Spectrum2DRenderer.sectionDataDrawerMap[Kekule.Spectroscopy.DataMode.PEAK] = this.doDrawPeakSectionData;
	},
	/** @private */
	_initSpectrumDefSize: function(chemObj, drawOptions)
	{
		if (!chemObj.getSize2D())   // the spectrum size has not been set yet, use the default one in render config
		{
			var size2D = CU.multiply(drawOptions.spectrum_defSize2DRatio, drawOptions.defScaleRefLength * (drawOptions.unitLength || 1));
			chemObj.setSize2D(size2D);
		}
	},
	/* @ignore */
	/*
	getChildObjs: function()
	{
		var spectrumData = this.getChemObj() && this.getChemObj().getData();
		var section = spectrumData && spectrumData.getActiveSection();
		var result = this.tryApplySuper('getChildObjs');
		return result? result.concat(section): [section];
	},
	*/
	/** @ignore */
	doDrawSelf: function(context, baseCoord, options)
	{
		//console.log('render options', options);
		this.tryApplySuper('doDrawSelf', [context, baseCoord, options]);
		var chemObj = this.getChemObj();
		if (!baseCoord)
			baseCoord = this.getAutoBaseCoord(options);

		this._initSpectrumDefSize(chemObj, options);
		// debug
		//options.spectrum_reversedAxises = true;
		// calc context size of image
		var objBox = chemObj.getExposedContainerBox();

		var coord1 = {x: objBox.x1, y: objBox.y2};
		var coord2 = {x: objBox.x2, y: objBox.y1};
		var contextCoord1 = this.transformCoordToContext(context, chemObj, coord1);
		var contextCoord2 = this.transformCoordToContext(context, chemObj, coord2);
		var size = Kekule.CoordUtils.substract(contextCoord2, contextCoord1);

		// since baseCoord is at the center of object, we need calculate out the corner coord
		var drawCoord = {x: baseCoord.x - size.x / 2, y: baseCoord.y - size.y / 2};
		var contextBoxCoord1 = drawCoord;
		var contextBoxCoord2 = Kekule.CoordUtils.add(drawCoord, size);
		var contextBox = Kekule.BoxUtils.createBox(contextBoxCoord1, contextBoxCoord2);

		//console.log('draw', baseCoord, drawCoord, options, objBox, size);

		var actualRenderOptions = this._getActualRenderOptions(context, chemObj, options);

		var result;
		var sections = this.doGetTargetDataSections(chemObj);
		if (sections && sections.length)  // Need to do concrete drawing
		{
			var varInfos = this.doGetDataVarInfos(sections);
			if (varInfos)   // we can not render without proper variable information
			{
				var visibleDataRange = this._getDisplayRangeOfSections(chemObj, chemObj.getData(), sections, varInfos, actualRenderOptions);
				var varSymbols = varInfos.varSymbols;

				if (Kekule.NumUtils.isFloatEqual(visibleDataRange[varSymbols.independant].min, visibleDataRange[varSymbols.independant].max)
					|| Kekule.NumUtils.isFloatEqual(visibleDataRange[varSymbols.dependant].min, visibleDataRange[varSymbols.dependant].max))  // visible range is empty
				{
					Kekule.error(Kekule.$L('ErrorMsg.VISIBLE_DATA_RANGE_IS_EMPTY'));
					return null;  // do not need to do concrete drawing
				}

				// check the axis alignment and direction
				var axisDirectionAndAlignInfo = this._getAxisDirectionAndAlignInfo(context, chemObj, visibleDataRange, varSymbols, varInfos.varUnitSymbols, actualRenderOptions);

				result = this.createDrawGroup(context);
				var clientContextBox;

				// indicator elements
				// note: since here we call getDrawBridge() directly, the context should be returned by getActualTargetContext()
				var indicatorDrawParamsAndOptions = this._prepareAxisRenderParamsAndOptions(this.getActualTargetContext(context), chemObj, visibleDataRange, varSymbols, actualRenderOptions, axisDirectionAndAlignInfo);
				var indicatorDrawResult = Kekule.Render.CoordAxisRender2DUtils.drawAxises(this.getDrawBridge(), this.getRichTextDrawer(), this.getActualTargetContext(context), contextBox,
					indicatorDrawParamsAndOptions.drawParams, indicatorDrawParamsAndOptions.renderOptions);
				//console.log(indicatorDrawResult);
				if (indicatorDrawResult) {
					this.addToDrawGroup(indicatorDrawResult.drawnElem, result);
					clientContextBox = indicatorDrawResult.clientBox;
				} else
					clientContextBox = contextBox;

				var transformMatrix = this.doCalcSprectrumTransformMatrix(chemObj, sections, varSymbols, visibleDataRange, clientContextBox, actualRenderOptions, axisDirectionAndAlignInfo);

				// spectrum data
				var spectrumDataElem = this.doDrawDataSections(chemObj, sections, varSymbols, context, objBox, clientContextBox, transformMatrix, visibleDataRange, actualRenderOptions);
				if (spectrumDataElem)
					this.addToDrawGroup(spectrumDataElem, result);

				this.basicDrawObjectUpdated(context, chemObj, chemObj,
					this.createRectBoundInfo(contextBoxCoord1, contextBoxCoord2), Kekule.Render.ObjectUpdateType.ADD);
			}
		}

		return result;
	},

	/** @private */
	_getActualRenderOptions: function(context, spectrumObj, renderOptions)
	{
		var listObj = spectrumObj.getData().getSections();
		var listObjRenderOps = listObj.getRenderOptions();
		var result = Object.create(renderOptions);
		result = Object.extend(result, listObjRenderOps);
		return result;
	},
	/** @private */
	_getAxisDirectionAndAlignInfo: function(context, spectrumObj, dataRanges, dataVarSymbol, dataVarUnitSymbols, actualRenderOptions)
	{
		var spectrumType = spectrumObj.getSpectrumType();
		var independentInfo = Kekule.Render.Spectrum2DRenderUtils.getDefaultAxisDirectionAndAlignInfo(spectrumType, true, dataVarUnitSymbols.independant);
		var dependentInfo = Kekule.Render.Spectrum2DRenderUtils.getDefaultAxisDirectionAndAlignInfo(spectrumType, false, dataVarUnitSymbols.dependant);
		if (actualRenderOptions.spectrum_reverseIndependentDataDirection)
			independentInfo.reversedDirection = !independentInfo.reversedDirection;
		if (actualRenderOptions.spectrum_reverseIndependentAxisAlign)
			independentInfo.reversedAlign = !independentInfo.reversedAlign;
		if (actualRenderOptions.spectrum_reverseDependentDataDirection)
			dependentInfo.reversedDirection = !dependentInfo.reversedDirection;
		if (actualRenderOptions.spectrum_reverseDependentAxisAlign)
			dependentInfo.reversedAlign = !dependentInfo.reversedAlign;
		return {
			'independent': independentInfo, 'dependent': dependentInfo
		};
	},
	/** @private */
	_prepareAxisRenderParamsAndOptions: function(context, spectrumObj, dataRanges, dataVarSymbols, renderOptions, directionAndAlignInfo)
	{
		var ops = renderOptions;
		var reversedAxis = ops.spectrum_reversedAxises;
		//var refLengthAbscissa = ops.contextRefLengthes.x;
		//var refLengthOrdinate = ops.contextRefLengthes.y;
		var refLengthIndependent = reversedAxis? ops.contextRefLengthes.y: ops.contextRefLengthes.x;
		var refLengthDependent = reversedAxis? ops.contextRefLengthes.x: ops.contextRefLengthes.y;
		var unitLength = ops.unitLength;
		var oneOf = Kekule.oneOf;

		var rOptions = {};
		var drawParams = {};
		var self = this;

		var createSubOptions = function(baseOption, extensions)
		{
			var subOptions = Object.create(baseOption);
			subOptions = Object.extend(subOptions, extensions);
			//var subOptions = Object.clone(extensions);
			return subOptions;
		};
		var getAxisRenderOptionValue = function(options, fieldName, axisPrefix)
		{
			return oneOf(options['spectrum_' + axisPrefix + fieldName.upperFirst()], options['spectrum_' + fieldName]);
		};
		var getActualSpectrumLengthValue = function(options, fieldName, axisPrefix, refLength, unitLength)
		{
			var ratio = oneOf(options['spectrum_' + axisPrefix + fieldName.upperFirst() + 'Ratio'], options['spectrum_' + fieldName + 'Ratio']);
			var min = oneOf(options['spectrum_' + axisPrefix + fieldName.upperFirst() + 'Min'], options['spectrum_' + fieldName + 'Min']);
			return (min? Math.max(ratio * refLength, min): (ratio * refLength)) * unitLength;
		};
		var setDrawParam = function(params, fieldName, axisPrefix, value)
		{
			params[axisPrefix + fieldName.upperFirst()] = value;
		};
		var getVarLabel = function(spectrumObj, varSymbol)
		{
			var varDef = spectrumObj.getVariable(varSymbol);
			var text = varDef.getDisplayLabel() || varDef.getName();  // || varDef.getSymbol();
			if (!text)
				return null;
			else if (DataType.isObjectValue(text))  // already a rich text?
				return text;
			else
				return Kekule.Render.RichTextUtils.strToRichText(text);
		};
		var getVarUnitLabel = function(spectrumObj, varSymbol)
		{
			var result;
			var varDef = spectrumObj.getVariable(varSymbol);
			var sunit = self.doGetVarDefUnit(varDef);       // TODO: here we may need to transform the unit to a propert rich text
			if (!sunit)
				return null;
			else
			{
				var unitObj = Kekule.Unit.getUnit(sunit);
				if (unitObj)
				{
					if (unitObj.symbolHtml)
						result = Kekule.Render.RichTextUtils.fromSimpleHtmlCode(unitObj.symbolHtml);
					else if (unitObj.getKey())
						result = Kekule.Render.RichTextUtils.strToRichText(unitObj.getKey());
				}
				else if (DataType.isObjectValue(sunit))  // already a rich text?
					result = sunit;
				else
					result = Kekule.Render.RichTextUtils.strToRichText(sunit);
				return result;
			}
		};

		var paramPrefixDependent = reversedAxis? 'abscissa': 'ordinate';
		var paramPrefixIndependent = reversedAxis? 'ordinate': 'abscissa';

		var independentAxisOps = {}, dependentAxisOps = {};
		if (ops['spectrum_displayIndependentAxis'])
		{
			if (reversedAxis)
				rOptions.ordinate = independentAxisOps;
			else
				rOptions.abscissa = independentAxisOps;

			independentAxisOps['axis'] = createSubOptions(ops, {
				'strokeWidth': getActualSpectrumLengthValue(ops, 'axisWidth', 'independent', refLengthIndependent, unitLength),
				'scaleMarkSize': 0,    // if scale mark need to be rendered, we will set it later
				'color': oneOf(getAxisRenderOptionValue(ops, 'axisColor', 'independent'), ops['color'])
			});

			if (ops['spectrum_displayIndependentAxisLabel'] || ops['spectrum_displayIndependentAxisUnit'])
			{
				independentAxisOps['axisLabel'] = createSubOptions(ops, {
					'fontFamily': getAxisRenderOptionValue(ops, 'axisLabelFontFamily', 'independent'),
					'fontSize': getAxisRenderOptionValue(ops, 'axisLabelFontSize', 'independent') * unitLength,
					'color': getAxisRenderOptionValue(ops, 'axisLabelColor', 'independent'),
					'padding': getActualSpectrumLengthValue(ops, 'axisLabelPadding', 'independent', refLengthIndependent, unitLength)
				});
			}
			if (ops['spectrum_displayIndependentAxisScales'])
			{
				independentAxisOps['scaleLabel'] = createSubOptions(ops, {
					'fontFamily': getAxisRenderOptionValue(ops, 'axisScaleLabelFontFamily', 'independent'),
					'fontSize': getAxisRenderOptionValue(ops, 'axisScaleLabelFontSize', 'independent') * unitLength,
					'color': oneOf(getAxisRenderOptionValue(ops, 'axisScaleLabelColor', 'independent'), ops['color']),
					'padding': getActualSpectrumLengthValue(ops, 'axisScaleLabelPadding', 'independent', refLengthIndependent, unitLength)
				});
				independentAxisOps['axis']['scaleMarkSize'] = getActualSpectrumLengthValue(ops, 'axisScaleMarkSize', 'independent', refLengthIndependent, unitLength);
				independentAxisOps['axis']['unlabeledScaleSizeRatio'] = getAxisRenderOptionValue(ops, 'axisUnlabeledScaleSizeRatio', 'independent');
			}


			// draw params
			setDrawParam(drawParams, 'dataRange', paramPrefixIndependent, dataRanges[dataVarSymbols.independant]);
			setDrawParam(drawParams, 'axisPosition', paramPrefixIndependent, directionAndAlignInfo.independent.reversedAlign? 1: 0);
			setDrawParam(drawParams, 'reversedDirection', paramPrefixIndependent, directionAndAlignInfo.independent.reversedDirection);
			if (ops['spectrum_displayIndependentAxisScales'])
			{
				//console.log(dataRanges, dataVarSymbols);
				var preferredScaleMarkCount = getAxisRenderOptionValue(ops, 'axisScaleMarkPreferredCount', 'independent');
				var scaleInfo = Kekule.Spectroscopy.Utils.calcScalePointInfo(dataRanges[dataVarSymbols.independant].min, dataRanges[dataVarSymbols.independant].max, preferredScaleMarkCount);
				setDrawParam(drawParams, 'scales', paramPrefixIndependent, scaleInfo.scaleValues);
				setDrawParam(drawParams, 'scaleBase', paramPrefixIndependent, scaleInfo.scaleBase);
				setDrawParam(drawParams, 'scaleUseSciForm', paramPrefixIndependent, scaleInfo.useSciForm);
				setDrawParam(drawParams, 'scaleFixedDigitCountAfterPoint', paramPrefixIndependent, scaleInfo.fixDigitsCountAfterPoint);
				//setDrawParam(drawParams, 'scaleMarkSize', paramPrefixIndependent, getActualSpectrumLengthValue(ops, 'axisScaleMarkSize', 'independent', refLengthIndependent, unitLength));
			}
			if (ops['spectrum_displayIndependentAxisLabel'])
			{
				setDrawParam(drawParams, 'label', paramPrefixIndependent, getVarLabel(spectrumObj, dataVarSymbols.independant));
			}
			if (ops['spectrum_displayIndependentAxisUnit'])
			{
				setDrawParam(drawParams, 'unitLabel', paramPrefixIndependent, getVarUnitLabel(spectrumObj, dataVarSymbols.independant));
			}
		}

		if (ops['spectrum_displayDependentAxis'])
		{
			if (reversedAxis)
				rOptions.abscissa = dependentAxisOps;
			else
				rOptions.ordinate = dependentAxisOps;

			dependentAxisOps['axis'] = createSubOptions(ops, {
				'strokeWidth': getActualSpectrumLengthValue(ops, 'axisWidth', 'dependent', refLengthDependent, unitLength),
				//'scaleMarkSize': getActualSpectrumLengthValue(ops, 'axisScaleMarkSize', 'dependent', refLengthDependent, unitLength),
				'scaleMarkSize': 0,    // if scale mark need to be rendered, we will set it later
				'color': oneOf(getAxisRenderOptionValue(ops, 'axisColor', 'dependent'), ops['color'])
			});

			if (ops['spectrum_displayDependentAxisLabel'] || ops['spectrum_displayDependentAxisUnit'])
			{
				dependentAxisOps['axisLabel'] = createSubOptions(ops, {
					'fontFamily': getAxisRenderOptionValue(ops, 'axisLabelFontFamily', 'dependent'),
					'fontSize': getAxisRenderOptionValue(ops, 'axisLabelFontSize', 'dependent') * unitLength,
					'color': getAxisRenderOptionValue(ops, 'axisLabelColor', 'dependent'),
					'padding': getActualSpectrumLengthValue(ops, 'axisLabelPadding', 'dependent', refLengthDependent, unitLength)
				});
			}
			if (ops['spectrum_displayDependentAxisScales'])
			{
				dependentAxisOps['scaleLabel'] = createSubOptions(ops, {
					'fontFamily': getAxisRenderOptionValue(ops, 'axisScaleLabelFontFamily', 'dependent'),
					'fontSize': getAxisRenderOptionValue(ops, 'axisScaleLabelFontSize', 'dependent') * unitLength,
					'color': oneOf(getAxisRenderOptionValue(ops, 'axisScaleLabelColor', 'dependent'), ops['color']),
					'padding': getActualSpectrumLengthValue(ops, 'axisScaleLabelPadding', 'dependent', refLengthDependent, unitLength)
				});
				dependentAxisOps['axis']['scaleMarkSize'] = getActualSpectrumLengthValue(ops, 'axisScaleMarkSize', 'dependent', refLengthDependent, unitLength);
				dependentAxisOps['axis']['unlabeledScaleSizeRatio'] = getAxisRenderOptionValue(ops, 'axisUnlabeledScaleSizeRatio', 'dependent');
			}

			// draw params
			setDrawParam(drawParams, 'dataRange', paramPrefixDependent, dataRanges[dataVarSymbols.dependant]);
			setDrawParam(drawParams, 'axisPosition', paramPrefixDependent, directionAndAlignInfo.dependent.reversedAlign? 1: 0);
			setDrawParam(drawParams, 'reversedDirection', paramPrefixDependent, directionAndAlignInfo.dependent.reversedDirection);
			if (ops['spectrum_displayDependentAxisScales'])
			{
				var preferredScaleMarkCount = getAxisRenderOptionValue(ops, 'axisScaleMarkPreferredCount', 'dependent');
				var scaleInfo = Kekule.Spectroscopy.Utils.calcScalePointInfo(dataRanges[dataVarSymbols.dependant].min, dataRanges[dataVarSymbols.dependant].max, preferredScaleMarkCount);
				setDrawParam(drawParams, 'scales', paramPrefixDependent, scaleInfo.scaleValues);
				setDrawParam(drawParams, 'scaleBase', paramPrefixDependent, scaleInfo.scaleBase);
				setDrawParam(drawParams, 'scaleUseSciForm', paramPrefixDependent, scaleInfo.useSciForm);
				setDrawParam(drawParams, 'scaleFixedDigitCountAfterPoint', paramPrefixDependent, scaleInfo.fixDigitsCountAfterPoint);
				//setDrawParam(drawParams, 'scaleMarkSize', paramPrefixDependent, getActualSpectrumLengthValue(ops, 'axisScaleMarkSize', 'dependent', refLengthDependent, unitLength));
			}
			if (ops['spectrum_displayDependentAxisLabel'])
			{
				setDrawParam(drawParams, 'label', paramPrefixDependent, getVarLabel(spectrumObj, dataVarSymbols.dependant));
			}
			if (ops['spectrum_displayDependentAxisUnit'])
			{
				setDrawParam(drawParams, 'unitLabel', paramPrefixDependent, getVarUnitLabel(spectrumObj, dataVarSymbols.dependant));
			}
		}

		//console.log('return ', rOptions, drawParams);

		return {'renderOptions': rOptions, 'drawParams': drawParams};
	},

	/** @private */
	doGetTargetDataSections: function(spectrum)
	{
		return [spectrum.getActiveDataSection()];  // TODO: currently handles active section only
	},
	/** @private */
	doGetDataVarInfos: function(targetDataSections)
	{
		// get the independant and denpendant vars
		var dependantVarSymbol, independantVarSymbol;
		var varInfos = targetDataSections[0].getActualLocalVarInfos();   // we assume the vars in sections are same
		var varUnitSymbols = {};
		var varSymbols = {};
		for (var i = 0, l = varInfos.length; i < l; ++i)
		{
			//var varDef = varInfos[i].varDef;
			var varDef = targetDataSections[0].getLocalVarDef(i);
			if (varDef.getDependency() === Kekule.VarDependency.DEPENDENT)
			{
				varSymbols.dependant = varDef.getSymbol();
				varUnitSymbols.dependant = this.doGetVarDefUnit(varDef);
			}
			else
			{
				varSymbols.independant = varDef.getSymbol();
				varUnitSymbols.independant = this.doGetVarDefUnit(varDef);
			}
			if (varSymbols.dependant && varSymbols.independant)
				break;
		}
		if (!(varSymbols.dependant && varSymbols.independant))  // less than two variables, can not draw
			return null;

		return {
			'varSymbols': varSymbols,
			'varUnitSymbols': varUnitSymbols
		};
	},
	/** @private */
	doGetVarDefUnit: function(varDef)
	{
		return (varDef.getActualExternalUnit && varDef.getActualExternalUnit()) || varDef.getUnit();
	},
	/** @private */
	doCalcSprectrumTransformMatrix: function(spectrum, targetDataSections, varSymbols, sectionDataRange, contextBox, renderOptions, axisDirectionAndAlignInfo)
	{
		var dependantVarSymbol = varSymbols.dependant, independantVarSymbol = varSymbols.independant;
		// retrieve data ranges of all sections and build the range box
		// var dataRange = spectrumData.calcDataRangeOfSections(sections);
		var dataRange = sectionDataRange;
		if (!dataRange[dependantVarSymbol] || !dataRange[independantVarSymbol])
			return;

		var reverseX, reverseY;
		if (axisDirectionAndAlignInfo.independent.reversedDirection)
		{
			if (renderOptions.spectrum_reversedAxises)
				reverseY = true;
			else
				reverseX = true;
		}
		if (axisDirectionAndAlignInfo.dependent.reversedDirection)
		{
			if (renderOptions.spectrum_reversedAxises)
				reverseX = true;
			else
				reverseY = true;
		}
		var boxCoords = !renderOptions.spectrum_reversedAxises?
			[
				{'x': dataRange[independantVarSymbol].min, 'y': dataRange[dependantVarSymbol].min},
				{'x': dataRange[independantVarSymbol].max, 'y': dataRange[dependantVarSymbol].max}
			]:
			[
				{'y': dataRange[independantVarSymbol].min, 'x': dataRange[dependantVarSymbol].min},
				{'y': dataRange[independantVarSymbol].max, 'x': dataRange[dependantVarSymbol].max}
			];
		var dataRangeBox = Kekule.BoxUtils.createBox(boxCoords[0], boxCoords[1]);

		//console.log('contextbox', contextBox, 'dataRange', dataRange, 'dataRangeBox', dataRangeBox);

		// calculate internal transform params
		var transOps1 = {
			//'translateX': -dataRangeBox.x1,
			'translateX': reverseX? -dataRangeBox.x2: -dataRangeBox.x1,
			'translateY': reverseY? -dataRangeBox.y1: -dataRangeBox.y2,  //-dataRangeBox.y1
		};

		var internalTransformMatrix = Kekule.CoordUtils.calcTransform2DMatrix(transOps1);
		var transOps2 = {
			'scaleX': (contextBox.x2 - contextBox.x1) / (dataRangeBox.x2 - dataRangeBox.x1),
			'scaleY': -(contextBox.y2 - contextBox.y1) / (dataRangeBox.y2 - dataRangeBox.y1),
			'translateX': contextBox.x1,
			'translateY': contextBox.y1
		};
		if (reverseX)
			transOps2.scaleX = -transOps2.scaleX;
		if (reverseY)
			transOps2.scaleY = -transOps2.scaleY;

		internalTransformMatrix = Kekule.MatrixUtils.multiply(CU.calcTransform2DMatrix(transOps2), internalTransformMatrix);

		var dataTransformMatrix = internalTransformMatrix;
		renderOptions.spectrumDataTransformMatrix = dataTransformMatrix;

		return dataTransformMatrix;
	},

	/** @private */
	_getDisplayRangeOfSections: function(spectrum, spectrumData, sections, varInfos, renderOptions)
	{
		// adjust the dataRange with render options
		var calcVisibleRange = function(dataRangeOfVar, varSymbol, isDependentVar, dataMode, renderOptions)
		{
			var renderOptionNameSuffix = (dataMode === Kekule.Spectroscopy.DataMode.PEAK)? '_Peak':
				(dataMode === Kekule.Spectroscopy.DataMode.CONTINUOUS)? '_Continuous': '';
			var varType = isDependentVar? 'dependent': 'independent';
			var visibleRange = {
				'rangeFrom': renderOptions['spectrum_visible' + varType.upperFirst() + 'DataRangeFrom' + renderOptionNameSuffix] || 0,
				'rangeTo': renderOptions['spectrum_visible' + varType.upperFirst() + 'DataRangeTo' + renderOptionNameSuffix] || 1,
			};
			var range = dataRangeOfVar;
			if (visibleRange.rangeFrom !== 0 || visibleRange.rangeTo !== 1)  // need adjust
			{
				var newFrom = (range.max - range.min) * visibleRange.rangeFrom + range.min;
				var newTo = (range.max - range.min) * (visibleRange.rangeTo - 1) + range.max;
				return {'min': Math.min(newFrom, newTo), 'max': Math.max(newFrom, newTo)};
			}
			else
				return range;
		}

		/*
		var dataRange = spectrumData.getDisplayRangeOfSections(sections, null, {autoCalc: true});
		var indepVar = varInfos.varSymbols.independant;
		var depVar = varInfos.varSymbols.dependant;
		var visibleDataRange = {};
		visibleDataRange[indepVar] = calcVisibleRange(dataRange[indepVar], indepVar, false, renderOptions);
		visibleDataRange[depVar] = calcVisibleRange(dataRange[depVar], depVar, true, renderOptions);

		//return dataRange;
		return visibleDataRange;
		*/

		var indepVar = varInfos.varSymbols.independant;
		var depVar = varInfos.varSymbols.dependant;
		var result = {};
		var visibleDataRange = {};
		for (var i = 0, l = sections.length; i < l; ++i)
		{
			var sectionRange = spectrumData.getDisplayRangeOfSection(sections[i], null, {autoCalc: true});
			visibleDataRange[indepVar] = calcVisibleRange(sectionRange[indepVar], indepVar, false, sections[i].getMode(), renderOptions);
			visibleDataRange[depVar] = calcVisibleRange(sectionRange[depVar], depVar, true, sections[i].getMode(), renderOptions);
			result = Kekule.Spectroscopy.Utils.mergeDataRange(result, visibleDataRange);
		}
		return result;
	},
	/*
	 * Returns a hash to indicating whether the data point is in or out of data range.
	 * @returns {Hash} Result[varSymbol] is a int, -1 means dataPoint[varSymbol] is less than range.min, 0 in range, +1 greator than range.max.
	 * @private
	 */
	/*
	_getDataPointRangeRelation: function(dataPoint, dataRange, varSymbols)
	{
		var result = {};
		for (var i = 0, l = varSymbols.length; i < l; ++i)
		{
			var varSymbol = varSymbols[i];
			var value = dataPoint[varSymbol];
			var range = dataRange[varSymbol];
			if (value < range.min)
				result[varSymbol] = -1
			else if (value > range.max)
				result[varSymbol] = 1;
			else
				result[varSymbol] = 0;
		}
		return result;
	},
	*/

	/*
	 * Returns the data value actually be rendered inside the visible data range.
	 * @param dataValue
	 * @param dataVarSymbols
	 * @param visibleDataRange
	 * @returns {Hash}
	 * @private
	 */
	/*
	_getRenderableDataValueInsideVisibleDataRender: function(dataValue, dataVarSymbols, visibleDataRange)
	{
		var result = {};
		var varSymbolList = [dataVarSymbols.independant, dataVarSymbols.dependant];
		var relations = this._getDataPointRangeRelation(dataValue, visibleDataRange, varSymbolList);
		if (relations[dataVarSymbols.independant] !== 0)  // x value out of range, need not to render
			return null;
		else
			result[dataVarSymbols.independant] = dataValue[dataVarSymbols.independant];
		if (relations[dataVarSymbols.dependant] < 0)  // if y value out of range, reset it into min/max value of range
			result[dataVarSymbols.dependant] = visibleDataRange[dataVarSymbols.dependant].min;
		else if (relations[dataVarSymbols.dependant] > 0)
			result[dataVarSymbols.dependant] = visibleDataRange[dataVarSymbols.dependant].max;
		else
			result[dataVarSymbols.dependant] = dataValue[dataVarSymbols.dependant];
		result._dependentValueRelation = relations[dataVarSymbols.dependant];  // and record the original y relation, if relations of two key points are same (all less or great, this point need not to be drawn)
		//console.log('original', dataValue, 'result', result);
		return result;
	},
	*/
	/**
	 * Clip the line formed by dataValues[0]-dataValues[1] to the visibleDataRange
	 * @param dataValue1
	 * @param dataValue2
	 * @param dataVarSymbols
	 * @param visibleDataRange
	 * @returns {Array} Clipped data values of line ends or null.
	 * @private
	 */
	_clipDataValuePairInsideVisibleRange: function(dataValue1, dataValue2, dataVarSymbols, visibleDataRange)
	{
		var coords = [
			CU.create(dataValue1[dataVarSymbols.independant], dataValue1[dataVarSymbols.dependant]),
			CU.create(dataValue2[dataVarSymbols.independant], dataValue2[dataVarSymbols.dependant])
		];
		var boxCoords = [
			CU.create(visibleDataRange[dataVarSymbols.independant].min, visibleDataRange[dataVarSymbols.dependant].min),
			CU.create(visibleDataRange[dataVarSymbols.independant].max, visibleDataRange[dataVarSymbols.dependant].max)
		];
		var clippedCoords = Kekule.GeometryUtils.clipLineSegmentByBox(coords, boxCoords);
		if (clippedCoords)
		{
			var d0 = {}, d1 = {};
			d0[dataVarSymbols.independant] = clippedCoords[0].x;
			d0[dataVarSymbols.dependant] = clippedCoords[0].y;
			d1[dataVarSymbols.independant] = clippedCoords[1].x;
			d1[dataVarSymbols.dependant] = clippedCoords[1].y;
			return [d0, d1];
		}
		else
			return null;
	},

	/** @private */
	doDrawDataSections: function(spectrum, sections, varSymbols, context, objBox, contextBox, dataTransformMatrix, visibleDataRange, options)
	{
		//console.log('doDraw', options);
		//var sectionRenderer = new Kekule.Render.SpectrumDataSection2DRenderer(null, this.getDrawBridge(), this);
		var result = this.createDrawGroup(context);
		for (var i = 0, l = sections.length; i < l; ++i)
		{
			var sectionResult = this.doDrawSectionData(spectrum, sections[i], context, contextBox, options, varSymbols, dataTransformMatrix, visibleDataRange);
			if (sectionResult)
				this.addToDrawGroup(sectionResult, result);
		}
		return result;
	},

	/** @private */
	_mergeParentAndLocalSpectrumDataRenderOptions: function(parentOptions, localOptions)
	{
		var oneOf = Kekule.oneOf;
		var refLength = parentOptions.contextRefLengthes.xy;
		var unitLength = oneOf(localOptions.unitLength, parentOptions.unitLength, 1);

		var dataStrokeWidthRatio = oneOf(localOptions.spectrum_dataStrokeWidthRatio, parentOptions.spectrum_dataStrokeWidthRatio) || 0;
		var dataStrokeWidthMin = oneOf(localOptions.spectrum_dataStrokeWidthMin, parentOptions.spectrum_dataStrokeWidthMin) || 0;
		var strokeWidth = (Math.max(dataStrokeWidthRatio * refLength, dataStrokeWidthMin) || oneOf(localOptions.strokeWidth, parentOptions.strokeWidth, 1)) * unitLength;
		var result = Object.create(parentOptions);
		var result = Object.extend(result, {
			'strokeColor': oneOf(localOptions.spectrum_dataColor, localOptions.color, parentOptions.spectrum_dataColor, parentOptions.color),
			'strokeWidth': strokeWidth
		});
		return result;
	},
	/** @private */
	_prepareSectionDataActualRenderOptions: function(spectrum, section, context, options)
	{
		//var oneOf = Kekule.oneOf;
		var parentOptions = options;
		var localOptions = section.getRenderOptions() || {};
		/*
		var refLength = parentOptions.contextRefLengthes.xy;
		var unitLength = oneOf(localOptions.unitLength, parentOptions.unitLength, 1);

		var dataStrokeWidthRatio = oneOf(localOptions.spectrum_dataStrokeWidthRatio, parentOptions.spectrum_dataStrokeWidthRatio) || 0;
		var dataStrokeWidthMin = oneOf(localOptions.spectrum_dataStrokeWidthMin, parentOptions.spectrum_dataStrokeWidthMin) || 0;
		var strokeWidth = (Math.max(dataStrokeWidthRatio * refLength, dataStrokeWidthMin) || oneOf(localOptions.strokeWidth, parentOptions.strokeWidth, 1)) * unitLength;
		var result = Object.create(parentOptions);
		var result = Object.extend(result, {
			'strokeColor': oneOf(localOptions.spectrum_dataColor, localOptions.color, parentOptions.spectrum_dataColor, parentOptions.color),
			'strokeWidth': strokeWidth
		});
		return result;
		*/
		return this._mergeParentAndLocalSpectrumDataRenderOptions(parentOptions, localOptions);
	},
	/** @private */
	_getSpectrumDataValueItemRenderOptions: function(spectrum, section, dataValue) // returns the renderOptions setting of a single data value
	{
		var extra = section.getExtraInfoOf(dataValue);
		return extra && extra.renderOptions;
	},

	/** @private */
	doDrawSectionData: function(spectrum, section, context, contextBox, options, dataVarSymbols, dataTransferMatrix, visibleDataRange)
	{
		if (section.getDataCount() <= 0)
			return null;
		var renderOptions = Object.create(options);
		// TODO: need to set draw options here
		//renderOptions.strokeWidth = 1;
		//renderOptions.strokeColor = 'rgba(0,0,0,1)';
		var dataMode = section.getMode();
		var drawMethod = Kekule.Render.Spectrum2DRenderer.sectionDataDrawerMap[dataMode];
		var actualRenderOptions = this._prepareSectionDataActualRenderOptions(spectrum, section, context, options);
		return drawMethod && drawMethod.apply(this, [spectrum, section, context, contextBox, actualRenderOptions, dataVarSymbols, dataTransferMatrix, visibleDataRange]);
		/*
		if (dataMode === Kekule.Spectroscopy.DataMode.PEAK)
			return this.doDrawPeakSectionData(spectrum, section, context, contextBox, renderOptions, dataVarSymbols, dataTransferMatrix);
		else
			return this.doDrawContinuousSectionData(spectrum, section, context, contextBox, renderOptions, dataVarSymbols, dataTransferMatrix);
		*/
	},
	/** @private */
	doDrawPeakSectionData: function(spectrum, section, context, contextBox, renderOptions, dataVarSymbols, dataTransferMatrix, visibleDataRange)
	{
		var self = this;

		var addNewPeakRootValue = function(peakRootValue, peakRootValues, dataVarSymbols)
		{
			// check if the dependent value of peakRootValue is same with the last one of peakRoots,
			// if so, these values can be merged
			var last = peakRootValues[peakRootValues.length - 1];
			if (peakRootValues.length > 1 && Kekule.NumUtils.isFloatEqual(last[dataVarSymbols.dependant], peakRootValue[dataVarSymbols.dependant]))
			{
				last[dataVarSymbols.independant] = peakRootValue[dataVarSymbols.independant];
			}
			else
				peakRootValues.push(peakRootValue);
		}
		var getClippedContextCoordOfDataValues = function(dataValue1, dataValue2)
		{
			var clippedValues = self._clipDataValuePairInsideVisibleRange(dataValue1, dataValue2, dataVarSymbols, visibleDataRange);
			if (clippedValues)
			{
				var coord0 = self._calcSectionDataValueContextCoord(clippedValues[0], dataVarSymbols, dataTransferMatrix, renderOptions.spectrum_reversedAxises);
				var coord1 = self._calcSectionDataValueContextCoord(clippedValues[1], dataVarSymbols, dataTransferMatrix, renderOptions.spectrum_reversedAxises);
				return [coord0, coord1];
			}
			return null;
		};
		var generatePathArgsOfDataValueContextCoords = function(coords)
		{
			var pathArgs = [];
			if (coords && coords.length > 1)
			{
				var coord0 = coords[0];
				pathArgs.push('M');
				pathArgs.push([coord0.x, coord0.y]);
				for (var i = 1, l = coords.length; i < l; ++i)
				{
					pathArgs.push('L');
					pathArgs.push([coords[i].x, coords[i].y]);
				}
			}
			return pathArgs;
		};

		var pathArgs = [];
		var peakRootValues = [];
		var drawnElems = [];
		section.forEach(function(dataValue, index){
			var peakRootValue = section.getPeakRootValueOf(dataValue);
			if (!peakRootValue || !dataValue )
				return;

			addNewPeakRootValue(peakRootValue, peakRootValues, dataVarSymbols);
			var contextCoords = getClippedContextCoordOfDataValues(peakRootValue, dataValue);
			if (contextCoords)
			{
				var localRenderOptions = self._getSpectrumDataValueItemRenderOptions(spectrum, section, dataValue);
				if (localRenderOptions)  // this peak has different render style, need to handle separately
				{
					localRenderOptions = self._mergeParentAndLocalSpectrumDataRenderOptions(renderOptions, localRenderOptions);
					var drawnElem = self.drawLine(context, contextCoords[0], contextCoords[1], localRenderOptions);
					drawnElems.push(drawnElem);
				}
				else  // draw with the common style
				{
					var subPathArgs = generatePathArgsOfDataValueContextCoords(contextCoords);
					if (subPathArgs && subPathArgs.length)
						pathArgs = pathArgs.concat(subPathArgs);
				}
			}
		});
		// handle peak root line
		if (peakRootValues.length > 1)
		{
			if (peakRootValues.length === 2)   // just a straighline, we may expand it to the whole data range
			{
				peakRootValues[0][dataVarSymbols.independant] = visibleDataRange[dataVarSymbols.independant].min;
				peakRootValues[1][dataVarSymbols.independant] = visibleDataRange[dataVarSymbols.independant].max;
			}
			for (var i = 1, l = peakRootValues.length; i < l; ++i)
			{
				var contextCoords = getClippedContextCoordOfDataValues(peakRootValues[i - 1], peakRootValues[i]);
				if (contextCoords)
				{
					pathArgs.push('M');
					pathArgs.push([contextCoords[0].x, contextCoords[0].y]);
					pathArgs.push('L');
					pathArgs.push([contextCoords[1].x, contextCoords[1].y]);
				}
			}
		}

		if (pathArgs && pathArgs.length)
		{
			var path = Kekule.Render.DrawPathUtils.makePath.apply(this, pathArgs);
			drawnElems.unshift(this.drawPath(context, path, renderOptions));  // the line drawn with global style should be at bottom most level
		}

		var result;
		if (drawnElems.length < 1)
			result = null;
		else if (drawnElems.length === 1)
			result = drawnElems[0];
		else
		{
			result = this.createDrawGroup(context);
			for (var i = 0, l = drawnElems.length; i < l; ++i)
				this.addToDrawGroup(drawnElems[i], result);
		}

		return result;
	},

	/** @private */
	doDrawContinuousSectionData: function(spectrum, section, context, contextBox, options, dataVarSymbols, dataTransferMatrix, visibleDataRange)
	{
		var result;
		var renderOptions = Object.create(options);
		renderOptions.lineCap = 'round';  // for a more smooth curve

		var self = this;
		var getRenderableTypicalValues = function(dataValues)
		{
			return self._clipDataValuePairInsideVisibleRange(dataValues[0], dataValues[1], dataVarSymbols, visibleDataRange);
		};
		var calcDataValueContextCoords = function(dataValues, dataVarSymbols, dataTransferMatrix, isReversedAxis)
		{
			var result = [];
			for (var i = 0, l = dataValues.length; i < l; ++i)
			{
				var coord = self._calcSectionDataValueContextCoord(dataValues[i], dataVarSymbols, dataTransferMatrix, isReversedAxis);
				result.push(coord);
			}
			return result;
		};

		//var timeStart = new Date();

		// calculate resample rate
		var resampleRate = Kekule.globalOptions.render.spectrum.continuousSpectrumResampleRatio || 1;
		var contextXWidth = Math.abs(contextBox.x2 - contextBox.x1) * resampleRate;

		var dataSampleMergeWidth = (visibleDataRange[dataVarSymbols.independant].max - visibleDataRange[dataVarSymbols.independant].min) / contextXWidth;
		var getSampleMergeGroupIndex = function(dataValue)
		{
			return Math.floor((dataValue[dataVarSymbols.independant] - visibleDataRange[dataVarSymbols.independant].min) / dataSampleMergeWidth);
		}

		var pathArgs = [];
		var lastSampleMergeIndex = null;
		var valueBuffer = [];
		//var totalValueBuffer = [];  // debug
		var lastCoords;
		var lastTypicalDataValues;
		var contextBoxCornerCoords = [CU.create(contextBox.x1, contextBox.y1), CU.create(contextBox.x2, contextBox.y2)];
		for (var i = 0, l = section.getDataCount(); i < l; ++i)
		{
			var dataValue = section.getHashValueAt(i);
			// check if dataValue inside visible data range
			var dataValueIndep = dataValue[dataVarSymbols.independant];
			if (dataValueIndep < visibleDataRange[dataVarSymbols.independant].min || dataValueIndep > visibleDataRange[dataVarSymbols.independant].max)
				continue;

			//totalValueBuffer.push(dataValue);

			var mergeIndex = getSampleMergeGroupIndex(dataValue);
			if (lastSampleMergeIndex === null)
				lastSampleMergeIndex = mergeIndex;
			//console.log('curr', mergeIndex, lastSampleMergeIndex, dataSampleMergeWidth);
			if (i == l - 1 || mergeIndex !== lastSampleMergeIndex)  // mergeIndex different from last, need to handle the old buffer and create new one
			{
				if (i === l - 1)
					valueBuffer.push(dataValue);
				if (valueBuffer.length)
				{
					var typicalValues = this._getMergeSectionDataTypicalValues(valueBuffer, dataVarSymbols);
					//console.log(typicalValues, mergeIndex, valueBuffer.length);

					// clear buffer first, avoid the following continue breaks
					valueBuffer = [];
					lastSampleMergeIndex = mergeIndex;
					if (i < l - 1)
						valueBuffer.push(dataValue);

					if (!typicalValues)  // no valid data in this merge section
					{
						continue;
					}

					//var renderableTypicalValues = getRenderableTypicalValuePair(typicalValues);
					var renderableTypicalValues = getRenderableTypicalValues(typicalValues);

					//console.log(typicalValues, renderableTypicalValues, valueBuffer.length);

					var currLineCoords = null, connectionToVisibleLineCoords = null, connectionToInvisibleLineCoords = null;
					//console.log(mergeIndex, typicalValues[0], typicalValues[1], renderableTypicalValues);
					if (!renderableTypicalValues)  // need not to draw line of this data
					{
						// but may still need to draw the connection line to last visible line
						if (lastCoords)
						{
							var dValue = typicalValues[0];
							if (dValue)
							{
								var dCoord = this._calcSectionDataValueContextCoord(dValue, dataVarSymbols, dataTransferMatrix, options.spectrum_reversedAxises);
								connectionToInvisibleLineCoords = Kekule.GeometryUtils.clipLineSegmentByBox([lastCoords[lastCoords.length - 1], dCoord], contextBoxCornerCoords);
							}
						}
						lastCoords = null;
					}
					else
					{
						var coords = calcDataValueContextCoords(renderableTypicalValues, dataVarSymbols, dataTransferMatrix, options.spectrum_reversedAxises);
						currLineCoords = coords;
						//console.log(currLineCoords[0], currLineCoords[1]);
						if (lastCoords)
						{
							connectionToVisibleLineCoords = [lastCoords[lastCoords.length - 1], coords[0]];
						}
						else if (lastTypicalDataValues)  // last data values are out of box, but the connection line to this one may need to be drawn
						{
							var lastDValue = lastTypicalDataValues[lastTypicalDataValues.length - 1];
							var lastDCoord = this._calcSectionDataValueContextCoord(lastDValue, dataVarSymbols, dataTransferMatrix, options.spectrum_reversedAxises);
							connectionToInvisibleLineCoords = Kekule.GeometryUtils.clipLineSegmentByBox([lastDCoord, coords[0]], contextBoxCornerCoords);
						}
						lastCoords = currLineCoords;
					}
					lastTypicalDataValues = typicalValues;

					// do the concrete path generation
					if (currLineCoords && currLineCoords.length > 1)
					{
						pathArgs.push('M');
						pathArgs.push([currLineCoords[0].x, currLineCoords[0].y]);
						for (var j = 1, k = currLineCoords.length; j < k; ++j)
						{
							/*
							var line = this.drawLine(context, currLineCoords[j - 1], currLineCoords[j], renderOptions);
							this.addToDrawGroup(line, result);
							*/
							pathArgs.push('L');
							pathArgs.push(currLineCoords[j].x, currLineCoords[j].y);
						}
					}
					if (connectionToVisibleLineCoords)
					{
						/*
						var connectionLineRenderOptions = Object.create(renderOptions);  // debug
						connectionLineRenderOptions.strokeColor = 'red';
						connectionLineRenderOptions.opacity = 0.3;
						//console.log('draw connection line', lastCoords[1], coord1, renderableTypicalValues, typicalValues);
						var connectionLine = this.drawLine(context, connectionToVisibleLineCoords[0], connectionToVisibleLineCoords[1], connectionLineRenderOptions);
						this.addToDrawGroup(connectionLine, result);
						*/
						pathArgs.push('M');
						pathArgs.push([connectionToVisibleLineCoords[0].x, connectionToVisibleLineCoords[0].y]);
						pathArgs.push('L');
						pathArgs.push([connectionToVisibleLineCoords[1].x, connectionToVisibleLineCoords[1].y]);
					}
					if (connectionToInvisibleLineCoords)
					{
						/*
						var clippedConnectionLineRenderOptions = Object.create(renderOptions);  // debug
						clippedConnectionLineRenderOptions.strokeColor = 'green';
						clippedConnectionLineRenderOptions.opacity = 0.3;
						var connectionLine = this.drawLine(context, connectionToInvisibleLineCoords[0], connectionToInvisibleLineCoords[1], clippedConnectionLineRenderOptions);
						this.addToDrawGroup(connectionLine, result);
						*/
						pathArgs.push('M');
						pathArgs.push([connectionToInvisibleLineCoords[0].x, connectionToInvisibleLineCoords[0].y]);
						pathArgs.push('L');
						pathArgs.push([connectionToInvisibleLineCoords[1].x, connectionToInvisibleLineCoords[1].y]);
					}
				}
			}
			else /*if (lastSampleMergeIndex === null || mergeIndex === lastSampleMergeIndex)*/  // in the same merge group, push to valueBuffer to handle later
			{
				valueBuffer.push(dataValue);
			}
		}

		//console.log('total', totalValueBuffer.length, this._getMergeSectionDataTypicalValues(totalValueBuffer, dataVarSymbols));
		//var timeEnd = new Date();
		//var calcDuration = timeEnd - timeStart;

		//timeStart = new Date();
		if (pathArgs.length)
		{
			var path = Kekule.Render.DrawPathUtils.makePath.apply(this, pathArgs);
			result = this.drawPath(context, path, renderOptions);
		}
		//timeEnd = new Date();
		//var paintDuration = timeEnd - timeStart;
		//console.log('Calc, paint', calcDuration, paintDuration, paintDuration / calcDuration);

		return result;
	},
	/* @private */
	/*
	_getMergeSectionDataMinMaxValues: function(values, dataVarSymbols)
	{
		var countIndep = 0;
		var countDep = 0;
		var sumIndep = 0;
		var minDep, maxDep;
		var isNum = Kekule.NumUtils.isNormalNumber;
		// calculate the average value
		for (var i = 0; i < values.length; ++i)
		{
			var v = values[i][dataVarSymbols.independant];
			if (isNum(v))
			{
				sumIndep += v;
				++countIndep;
			}
			v = values[i][dataVarSymbols.dependant];
			if (isNum(v))
			{
				if (!isNum(minDep) || (minDep > v))
					minDep = v;
				if (!isNum(maxDep) || (maxDep < v))
					maxDep = v;
				++countDep;
			}
		}
		var averIndep = sumIndep / countIndep;
		if (countIndep > 0 && countDep > 0)
		{
			var v1 = {};
			v1[dataVarSymbols.independant] = averIndep;
			v1[dataVarSymbols.dependant] = minDep;
			var v2 = {};
			v2[dataVarSymbols.independant] = averIndep;
			v2[dataVarSymbols.dependant] = maxDep;
			return [v1, v2];
		}
		else
			return null;
	},
	*/
	/** @private */
	_getMergeSectionDataTypicalValues: function(values, dataVarSymbols)
	{
		var countIndep = 0;
		var countDep = 0;
		var sumIndep = 0;
		var minDep, maxDep, firstIndep, lastIndep, currAvailIndep;
		var minDepOriginValue, maxDepOriginValue, minDepIndex, maxDepIndex;
		var isNum = Kekule.NumUtils.isNormalNumber;

		for (var i = 0; i < values.length; ++i)
		{
			var v = values[i][dataVarSymbols.independant];
			if (isNum(v))
			{
				if (!isNum(firstIndep))
					firstIndep = v;
				currAvailIndep = v;
			}
			v = values[i][dataVarSymbols.dependant];
			if (isNum(v))
			{
				if (!isNum(minDep) || (minDep > v))
				{
					minDep = v;
					minDepOriginValue = {};
					minDepOriginValue[dataVarSymbols.independant] = currAvailIndep;  // avoid values[i][dataVarSymbols.independant] is not a number
					minDepOriginValue[dataVarSymbols.dependant] = v;
					minDepIndex = i;
				}
				if (!isNum(maxDep) || (maxDep < v))
				{
					maxDep = v;
					maxDepOriginValue = {};
					maxDepOriginValue[dataVarSymbols.independant] = currAvailIndep;  // avoid values[i][dataVarSymbols.independant] is not a number
					maxDepOriginValue[dataVarSymbols.dependant] = v;
					maxDepIndex = i;
				}
			}
		}
		lastIndep = currAvailIndep;

		if (isNum(firstIndep) && isNum(lastIndep) && isNum(minDep) && isNum(maxDep))
		{
			var isMinFirst = minDepIndex < maxDepIndex;
			var v1 = {}, v2 = {};
			if (isMinFirst)
			{
				v1[dataVarSymbols.independant] = firstIndep;
				v1[dataVarSymbols.dependant] = minDep;
				v2[dataVarSymbols.independant] = lastIndep;
				v2[dataVarSymbols.dependant] = maxDep;
			} else
			{
				v1[dataVarSymbols.independant] = firstIndep;
				v1[dataVarSymbols.dependant] = maxDep;
				v2[dataVarSymbols.independant] = lastIndep;
				v2[dataVarSymbols.dependant] = minDep;
			}
			return [v1, v2];
		}
		else  // values are not number, illegal
			return null;
	},
	/* @private */
	/*
	_mergeSectionDataValues: function(values, dataVarSymbols, dataDetails)
	{
		var count = values.length;

		// calculate the average value
		var sum = {};
		sum[dataVarSymbols.independant] = 0;
		sum[dataVarSymbols.dependant] = 0;
		var globalAverageDependant = dataDetails.averages && dataDetails.averages[dataVarSymbols.dependant];
		for (var i = 0; i < count; ++i)
		{
			sum[dataVarSymbols.independant] += values[i][dataVarSymbols.independant] || 0;
			if (globalAverageDependant === undefined)
				sum[dataVarSymbols.dependant] += values[i][dataVarSymbols.dependant] || 0;
		}
		var average = {};
		average[dataVarSymbols.independant] = sum[dataVarSymbols.independant] / count;
		if (globalAverageDependant === undefined)
			average[dataVarSymbols.dependant] = sum[dataVarSymbols.independant] / count;
		else
			average[dataVarSymbols.dependant] = globalAverageDependant;

		var vDependant, maxAbs = 0;
		for (var i = 0; i < count; ++i)
		{
			var vAbs = Math.abs(values[i][dataVarSymbols.dependant] - average[dataVarSymbols.dependant]);
			if (vAbs > maxAbs)
			{
				maxAbs = vAbs;
				vDependant = values[i][dataVarSymbols.dependant];
			}
		}
		var result = {};
		result[dataVarSymbols.independant] = average[dataVarSymbols.independant];
		result[dataVarSymbols.dependant] = vDependant;

		return result;
	},
	*/
	/** @private */
	_calcSectionDataValueContextCoord: function(dataValue, dataVarSymbols, dataTransferMatrix, reverseAxis)
	{
		var coord = reverseAxis? {'y': dataValue[dataVarSymbols.independant], 'x': dataValue[dataVarSymbols.dependant]}
			: {'x': dataValue[dataVarSymbols.independant], 'y': dataValue[dataVarSymbols.dependant]};
		//return Kekule.CoordUtils.transform2DByMatrix(coord, dataTransferMatrix);
		if (Kekule.NumUtils.isNormalNumber(coord.x) && Kekule.NumUtils.isNormalNumber(coord.y))
		{
			var result = Kekule.CoordUtils.transform2DByMatrix(coord, dataTransferMatrix);
			//console.log('transform', result);
			return result;
		}
		else
			return null;
	}
});
/** @private */
Kekule.Render.Spectrum2DRenderer.sectionDataDrawerMap = {};


Kekule.Render.Renderer2DFactory.register(Kekule.Spectroscopy.Spectrum, Kekule.Render.Spectrum2DRenderer);


})();