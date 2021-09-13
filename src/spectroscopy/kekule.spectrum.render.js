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

var CU = Kekule.CoordUtils;

/**
 * Options to display a spectrum.
 * @class
 * @augments Kekule.AbstractConfigs
 *
 * @property {Hash} defSize2DRatio Default 2D spectrum size({x, y}), these value multiply the default ref length will get the actual size.
 * //@property {Int} spectrumIndicatorElements Default displayed indicator elements in spectrum.
 * @property {String} scaleFontFamily Font family to draw the scale numbers on axis.
 * @property {Number} scaleFontSize Font size to draw the scale numbers on axis.
 * @property {String} unitsFontFamily Font family to draw the unit of axis.
 * @property {Number} unitsFontSize Font size to draw the unit of axis.
 *
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
		this.addBoolConfigProp('reversedAxis', false);

		//this.addBoolConfigProp('spectrumAbscissaAxisOnMinEnd', true);
		//this.addBoolConfigProp('spectrumOrdinateAxisOnMinEnd', true);

		this.addStrConfigProp('dataColor', '#000000');
		this.addFloatConfigProp('dataStrokeWidthRatio', 0.025);
		this.addFloatConfigProp('dataStrokeWidthMin', 1);

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
		this.addIntConfigProp('axisScaleMarkPreferredCount', 5);
	},
	/** @ignore */
	initPropDefValues: function()
	{
		this.tryApplySuper('initPropDefValues');
		//var defScaleRefLength = 0.8; // Kekule.Render.getRender2DConfigs().getLengthConfigs().getDefScaleRefLength();
		this.setDefSize2DRatio({'x': 10, 'y': 6});
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
	 *     ordinateDataRange: hash of {min, max},
	 *     ordinateScales: array of scale numbers,
	 *     ordinateScaleBase: scale based number, e.g. 10e3
	 *     ordinateScaleUseSciForm: bool,
	 *     ordinateScaleFixedDigitCountAfterPoint: int,
	 *     //ordinateScaleMarkSize,
	 *     ordinateUnitLabel: rich text label for ordinate axis unit.
	 *     ordinateLabel: rich text label for ordinate axis
	 *     ordinateAxisPosition: int, 0 for on left and 1 for on right
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
				abscissaRenderBox.x1 += ordinateSizes.total.x;
			else
				abscissaRenderBox.x2 -= ordinateSizes.total.x;
		}
		if (abscissaSizes)
		{
			if (params.abscissaAxisPosition === 1)  // abscissa on top
				ordinateRenderBox.y1 += abscissaSizes.total.y;
			else
				ordinateRenderBox.y2 -= abscissaSizes.total.y;
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
				actualParams.abscissaUnitLabel, actualParams.abscissaLabel, abscissaSizes, renderOptions, true, actualParams.abscissaAxisPosition === 1);
			drawBridge.addToGroup(elem, result);
		}
		if (drawOrdinate)
		{
			var scaleLabels = ordinateScaleLabels;
			elem = ARU._drawSingleAxis(drawBridge, richTextDrawer, context, ordinateRenderBox,
				actualParams.ordinateDataRange, actualParams.ordinateScales, scaleLabels,
				actualParams.ordinateUnitLabel, actualParams.ordinateLabel, ordinateSizes, renderOptions, false, actualParams.ordinateAxisPosition !== 1);
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
	_drawSingleAxis: function(drawBridge, richTextDrawer, context, renderBox, dataRange, scales, scaleLabels, unitLabel, axisLabel, elementSizes, renderOptions, isAbscissa, isOnTopOrLeft)
	{
		var BXA = Kekule.Render.BoxXAlignment;
		var BYA = Kekule.Render.BoxYAlignment;
		var result = drawBridge.createGroup(context);
		var alignOnTopOrLeft = isOnTopOrLeft;
		var primaryAxis = isAbscissa? 'x': 'y';
		var secondaryAxis = isAbscissa? 'y': 'x';
		var primaryRectDir = isAbscissa? 'width': 'height';
		var secondaryRectDir = isAbscissa? 'height': 'width';
		var rOptions = (isAbscissa? renderOptions.abscissa: renderOptions.ordinate) || renderOptions;
		//var primarySizeDir = isAbscissa? 'width': 'height';
		//var secondarySizeDir = isAbscissa? 'height': 'width';

		var stageSize = {'x': renderBox.x2 - renderBox.x1, 'y': renderBox.y2 - renderBox.y1};
		var basePos = {'x': renderBox.x1, 'y': renderBox.y1};
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
			coord[secondaryAxis] = basePos[secondaryAxis] + (alignOnTopOrLeft? (elementSizes.axisLabel[secondaryAxis] / 2): (stageSize[secondaryAxis] - elementSizes.axisLabel[secondaryAxis] / 2));
			drawLabelOptions = Object.extend(Object.extend({}, rOptions.axisLabel),
				{'textBoxXAlignment': BXA.LEFT, 'textBoxYAlignment': BYA.CENTER});
			if (!isAbscissa)
				drawLabelOptions.transforms = [{'rotate': -Math.PI / 2, 'center': Object.extend({}, coord)}];
			//console.log('draw axis label', coord);
			//elem = drawBridge.drawRichText(context, coord, axisLabel, drawLabelOptions);
			var textDrawResult = richTextDrawer.drawEx(context, coord, axisLabel, drawLabelOptions);
			elem = textDrawResult.drawnObj;
			drawBridge.addToGroup(elem, result);
			occupiedSizeOnSecondaryDir += elementSizes.axisLabel[secondaryAxis];
		}
		var axisRenderOptions = rOptions.axis;
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
				(basePos[secondaryAxis] + occupiedSizeOnSecondaryDir + elementSizes.scaleLabel[secondaryAxis]):
				(basePos[secondaryAxis] + stageSize[secondaryAxis] - occupiedSizeOnSecondaryDir - elementSizes.scaleLabel[secondaryAxis]);
			var scaleLabelCoord = {};
			scaleLabelCoord[secondaryAxis] = coord[secondaryAxis];
			//console.log('scaleLabel pos', secondaryAxis, coord[secondaryAxis]);
			//drawBridge.drawRect(context, c2, Kekule.CoordUtils.add(c2, elementSizes.scaleLabel), rOptions.axis);
			for (var i = 0, l = scales.length; i < l; ++i)
			{
				var scalePos = (scales[i] - dataRange.min) / dRange * stageSize[primaryAxis] + basePos[primaryAxis];
				coord[primaryAxis] = scalePos;
				scaleLabelCoord[primaryAxis] = coord[primaryAxis];
				if (isAbscissa)
				{
					var scaleLabelRect = richTextDrawer.measure(context, scaleLabelCoord, scaleLabels[i], drawLabelOptions);
					scaleLabelCoord.x = coord.x - scaleLabelRect.width / 2;
				}
				else if (alignOnTopOrLeft)  // scale label in ordinate axis, adjust X position when need to align to right
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
				// scale mark
				coord2[primaryAxis] = scalePos;
				coord2[secondaryAxis] = coord[secondaryAxis] + elementSizes.scaleMark[secondaryAxis] * (isOnTopOrLeft? 1: -1);
				elem = drawBridge.drawLine(context, coord, coord2, axisRenderOptions);
				drawBridge.addToGroup(elem, result);
			}
			occupiedSizeOnSecondaryDir += elementSizes.scaleLabel[secondaryAxis] + elementSizes.scaleMark[secondaryAxis];  //+ elementSizes.axis[secondaryAxis];
		}
		// draw unit label
		if (unitLabel)
		{

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
		// here we check the first and last scale labels to roughly determinate the occupied dimensions of scale labels
		if (scaleLabels)
		{
			var scaleLabelsFirst = scaleLabels[0];
			var scaleLabelsLast = scaleLabels[scaleLabels.length - 1];
			var scaleLabelFirstDim = richTextDrawer.measure(context, {'x': 0, 'y': 0}, scaleLabelsFirst, rOptions.scaleLabel);
			var scaleLabelLastDim = richTextDrawer.measure(context, {'x': 0, 'y': 0}, scaleLabelsLast, rOptions.scaleLabel);
			scaleLabelSize = {'x': Math.max(scaleLabelFirstDim.width, scaleLabelLastDim.width), 'y': Math.max(scaleLabelFirstDim.height, scaleLabelLastDim.height)};
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
		if (axisLabel)
		{
			var axisLabelDim = richTextDrawer.measure(context, {'x': 0, 'y': 0}, axisLabel, rOptions.axisLabel);
			if (isAbscissa)
				axisLabelSize = {'x': axisLabelDim.width, 'y': axisLabelDim.height};
			else  // for ordinate axis, we need to draw the label with 90 deg rotation
				axisLabelSize = {'y': axisLabelDim.width, 'x': axisLabelDim.height};
			// console.log('axisLabelSize', Kekule.Render.RichTextUtils.toText(axisLabel), axisLabelSize);
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
			totalSize.y = scaleLabelSize.y + axisLabelSize.y + axisSize.y + scaleMarkSize.y;
		}
		else
		{
			totalSize.y = renderBox.y2 - renderBox.y1;
			totalSize.x = scaleLabelSize.x + axisLabelSize.x + axisSize.x + scaleMarkSize.x;
		}
		var result = {
			total: totalSize,
			axis: axisSize,
			scaleMark: scaleMarkSize,
			scaleLabel: scaleLabelSize,
			unitLabel: unitLabelSize,
			axisLabel: axisLabelSize
		};
		return result;
	}
};
var ARU = Kekule.Render.CoordAxisRender2DUtils;


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
		//options.spectrum_reversedAxis = true;
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
			var dataRange = this._getDisplayRangeOfSections(chemObj, chemObj.getData(), sections);

			var varSymbols = this.doGetDataVarSymbols(sections);

			result = this.createDrawGroup(context);
			var clientContextBox;

			// indicator elements
			// note: since here we call getDrawBridge() directly, the context should be returned by getActualTargetContext()
			var indicatorDrawParamsAndOptions = this._prepareAxisRenderParamsAndOptions(this.getActualTargetContext(context), chemObj, dataRange, varSymbols, actualRenderOptions);
			var indicatorDrawResult = Kekule.Render.CoordAxisRender2DUtils.drawAxises(this.getDrawBridge(), this.getRichTextDrawer(), this.getActualTargetContext(context), contextBox,
				indicatorDrawParamsAndOptions.drawParams, indicatorDrawParamsAndOptions.renderOptions);
			//console.log(indicatorDrawResult);
			if (indicatorDrawResult)
			{
				this.addToDrawGroup(indicatorDrawResult.drawnElem, result);
				clientContextBox = indicatorDrawResult.clientBox;
			}
			else
				clientContextBox = contextBox;

			var transformMatrix = this.doCalcSprectrumTransformMatrix(chemObj, sections, varSymbols, dataRange, clientContextBox, actualRenderOptions);

			// spectrum data
			var spectrumDataElem = this.doDrawDataSections(chemObj, sections, varSymbols, context, objBox, clientContextBox, transformMatrix, actualRenderOptions);
			if (spectrumDataElem)
				this.addToDrawGroup(spectrumDataElem, result);

			this.basicDrawObjectUpdated(context, chemObj, chemObj,
				this.createRectBoundInfo(contextBoxCoord1, contextBoxCoord2), Kekule.Render.ObjectUpdateType.ADD);
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
	_prepareAxisRenderParamsAndOptions: function(context, spectrumObj, dataRanges, dataVarSymbols, renderOptions)
	{
		var ops = renderOptions;
		var reversedAxis = ops.spectrum_reversedAxis;
		//var refLengthAbscissa = ops.contextRefLengthes.x;
		//var refLengthOrdinate = ops.contextRefLengthes.y;
		var refLengthIndependent = reversedAxis? ops.contextRefLengthes.y: ops.contextRefLengthes.x;
		var refLengthDependent = reversedAxis? ops.contextRefLengthes.x: ops.contextRefLengthes.y;
		var unitLength = ops.unitLength;
		var oneOf = Kekule.oneOf;

		var rOptions = {};
		var drawParams = {};

		var createSubOptions = function(baseOption, extensions)
		{
			var subOptions = Object.create(baseOption);
			subOptions = Object.extend(subOptions, extensions);
			//var subOptions = Object.clone(extensions);
			return subOptions;
		};
		var getAxisRenderOptionValue = function(options, fieldName, axisPrefix)
		{
			return oneOf(ops['spectrum_' + axisPrefix + fieldName], ops['spectrum_' + fieldName]);
		};
		var getActualSpectrumLengthValue = function(options, fieldName, axisPrefix, refLength, unitLength)
		{
			var ratio = oneOf(options['spectrum_' + axisPrefix + fieldName.upperFirst() + 'Ratio'], options['spectrum_' + fieldName + 'Ratio']);
			var min = oneOf(options['spectrum_' + axisPrefix + fieldName.upperFirst() + 'Min'], options['spectrum_' + fieldName + 'Min']);
			return Math.max(ratio * refLength, min) * unitLength;
		};
		var setDrawParam = function(params, fieldName, axisPrefix, value)
		{
			params[axisPrefix + fieldName.upperFirst()] = value;
		};
		var getVarLabel = function(spectrumObj, varSymbol)
		{
			var varDef = spectrumObj.getVariable(varSymbol);
			var text = varDef.getDisplayLabel() || varDef.getName() || varDef.getSymbol();
			if (!text)
				return null;
			else if (DataType.isObjectValue(text))  // already a rich text?
				return text;
			else
				return Kekule.Render.RichTextUtils.strToRichText(text);
		};
		var getVarUnitLabel = function(spectrumObj, varSymbol)
		{
			var varDef = spectrumObj.getVariable(varSymbol);
			var text = varDef.getUnit();       // TODO: here we may need to transform the unit to a propert rich text
			if (!text)
				return null;
			else if (DataType.isObjectValue(text))  // already a rich text?
				return text;
			else
				return Kekule.Render.RichTextUtils.strToRichText(text);
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

			if (ops['spectrum_displayIndependentAxisLabel'])
			{
				independentAxisOps['axisLabel'] = createSubOptions(ops, {
					'fontFamily': getAxisRenderOptionValue(ops, 'axisLabelFontFamily', 'independent'),
					'fontSize': getAxisRenderOptionValue(ops, 'axisLabelFontSize', 'independent') * unitLength,
					'color': getAxisRenderOptionValue(ops, 'axisLabelColor', 'independent')
				});
			}
			if (ops['spectrum_displayIndependentAxisScales'])
			{
				independentAxisOps['scaleLabel'] = createSubOptions(ops, {
					'fontFamily': getAxisRenderOptionValue(ops, 'axisScaleLabelFontFamily', 'independent'),
					'fontSize': getAxisRenderOptionValue(ops, 'axisScaleLabelFontSize', 'independent') * unitLength,
					'color': oneOf(getAxisRenderOptionValue(ops, 'axisScaleLabelColor', 'independent'), ops['color'])
				});
				independentAxisOps['axis']['scaleMarkSize'] = getActualSpectrumLengthValue(ops, 'axisScaleMarkSize', 'independent', refLengthIndependent, unitLength);
			}


			// draw params
			setDrawParam(drawParams, 'dataRange', paramPrefixIndependent, dataRanges[dataVarSymbols.independant]);
			setDrawParam(drawParams, 'axisPosition', paramPrefixIndependent, 0);
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
			if (ops['spectrum_displayIndependentAxisUnitLabel'])
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

			if (ops['spectrum_displayDependentAxisLabel'])
			{
				dependentAxisOps['axisLabel'] = createSubOptions(ops, {
					'fontFamily': getAxisRenderOptionValue(ops, 'axisLabelFontFamily', 'dependent'),
					'fontSize': getAxisRenderOptionValue(ops, 'axisLabelFontSize', 'dependent') * unitLength,
					'color': getAxisRenderOptionValue(ops, 'axisLabelColor', 'dependent')
				});
			}
			if (ops['spectrum_displayDependentAxisScales'])
			{
				dependentAxisOps['scaleLabel'] = createSubOptions(ops, {
					'fontFamily': getAxisRenderOptionValue(ops, 'axisScaleLabelFontFamily', 'dependent'),
					'fontSize': getAxisRenderOptionValue(ops, 'axisScaleLabelFontSize', 'dependent') * unitLength,
					'color': oneOf(getAxisRenderOptionValue(ops, 'axisScaleLabelColor', 'dependent'), ops['color'])
				});
				dependentAxisOps['axis']['scaleMarkSize'] = getActualSpectrumLengthValue(ops, 'axisScaleMarkSize', 'dependent', refLengthDependent, unitLength);
			}

			// draw params
			setDrawParam(drawParams, 'dataRange', paramPrefixDependent, dataRanges[dataVarSymbols.dependant]);
			setDrawParam(drawParams, 'axisPosition', paramPrefixDependent, 0);
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
			if (ops['spectrum_displayDependentAxisUnitLabel'])
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
	doGetDataVarSymbols: function(targetDataSections)
	{
		// get the independant and denpendant vars
		var dependantVarSymbol, independantVarSymbol;
		var varInfos = targetDataSections[0].getLocalVarInfos();   // we assume the vars in sections are same
		for (var i = 0, l = varInfos.length; i < l; ++i)
		{
			var varDef = varInfos[i].varDef;
			if (varDef.getDependency() === Kekule.VarDependency.DEPENDENT)
			{
				dependantVarSymbol = varDef.getSymbol();
			}
			else
			{
				independantVarSymbol = varDef.getSymbol();
			}
			if (dependantVarSymbol && independantVarSymbol)
				break;
		}
		if (!(dependantVarSymbol && independantVarSymbol))  // less than two variables, can not draw
			return;
		var varSymbols = {'independant': independantVarSymbol, 'dependant': dependantVarSymbol};
		return varSymbols;
	},
	/** @private */
	doCalcSprectrumTransformMatrix: function(spectrum, targetDataSections, varSymbols, sectionDataRange, contextBox, renderOptions)
	{
		var dependantVarSymbol = varSymbols.dependant, independantVarSymbol = varSymbols.independant;
		// retrieve data ranges of all sections and build the range box
		// var dataRange = spectrumData.calcDataRangeOfSections(sections);
		var dataRange = sectionDataRange;
		if (!dataRange[dependantVarSymbol] || !dataRange[independantVarSymbol])
			return;
		var boxCoords = !renderOptions.spectrum_reversedAxis?
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
		var internalTransformMatrix = Kekule.CoordUtils.calcTransform2DMatrix({
			'translateX': -dataRangeBox.x1,
			'translateY': -dataRangeBox.y1
		});
		internalTransformMatrix = Kekule.MatrixUtils.multiply(CU.calcTransform2DMatrix({
			'scaleX': (contextBox.x2 - contextBox.x1) / (dataRangeBox.x2 - dataRangeBox.x1),
			'scaleY': (contextBox.y2 - contextBox.y1) / (dataRangeBox.y2 - dataRangeBox.y1),
			'translateX': contextBox.x1,
			'translateY': contextBox.y1
		}), internalTransformMatrix);

		var dataTransformMatrix = internalTransformMatrix;
		renderOptions.spectrumDataTransformMatrix = dataTransformMatrix;

		return dataTransformMatrix;
	},

	/** @private */
	_getDisplayRangeOfSections: function(spectrum, spectrumData, sections)
	{
		var dataRange = spectrumData.getDisplayRangeOfSections(sections, null, true);
		//var dataRange2 = spectrumData.calcDataRangeOfSections(sections);
		//console.log('datarange', dataRange, dataRange2);
		return dataRange;
	},
	/** @private */
	doDrawDataSections: function(spectrum, sections, varSymbols, context, objBox, contextBox, dataTransformMatrix, options)
	{
		//console.log('doDraw', options);
		//var sectionRenderer = new Kekule.Render.SpectrumDataSection2DRenderer(null, this.getDrawBridge(), this);
		var result = this.createDrawGroup(context);
		for (var i = 0, l = sections.length; i < l; ++i)
		{
			var sectionResult = this.doDrawSectionData(spectrum, sections[i], context, contextBox, options, varSymbols, dataTransformMatrix);
			if (sectionResult)
				this.addToDrawGroup(sectionResult);
		}
		return result;
	},

	/** @private */
	_prepareSectionDataActualRenderOptions: function(spectrum, section, context, options)
	{
		var oneOf = Kekule.oneOf;
		var parentOptions = options;
		var localOptions = section.getRenderOptions() || {};
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
	doDrawSectionData: function(spectrum, section, context, contextBox, options, dataVarSymbols, dataTransferMatrix)
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
		return drawMethod && drawMethod.apply(this, [spectrum, section, context, contextBox, actualRenderOptions, dataVarSymbols, dataTransferMatrix]);
		/*
		if (dataMode === Kekule.Spectroscopy.DataMode.PEAK)
			return this.doDrawPeakSectionData(spectrum, section, context, contextBox, renderOptions, dataVarSymbols, dataTransferMatrix);
		else
			return this.doDrawContinuousSectionData(spectrum, section, context, contextBox, renderOptions, dataVarSymbols, dataTransferMatrix);
		*/
	},
	/** @private */
	doDrawPeakSectionData: function(spectrum, section, context, contextBox, renderOptions, dataVarSymbols, dataTransferMatrix)
	{
		var self = this;
		var result = this.createDrawGroup(context);
		section.forEach(function(dataValue, index){
			var peakRootValue = section.getPeakRootValueOf(dataValue);

			var coord1 = self._calcSectionDataValueContextCoord(dataValue, dataVarSymbols, dataTransferMatrix, renderOptions.spectrum_reversedAxis);
			var coord0 = self._calcSectionDataValueContextCoord(peakRootValue, dataVarSymbols, dataTransferMatrix, renderOptions.spectrum_reversedAxis);
			if (coord1 && coord0)
			{
				var line = self.drawLine(context, coord0, coord1, renderOptions);
				self.addToDrawGroup(result, line);
			}
		});
		return result;
	},
	/** @private */
	doDrawContinuousSectionData: function(spectrum, section, context, contextBox, options, dataVarSymbols, dataTransferMatrix)
	{
		var result = this.createDrawGroup(context);
		//var renderOptions = Object.create(options);
		var renderOptions = options;

		// calculate resample rate
		var resampleRate = 2;
		var contextXWidth = Math.abs(contextBox.x2 - contextBox.x1) * resampleRate;
		//var independantValueRange = section.calcDataRange(dataVarSymbols.independant);
		//var valueWidth = independantValueRange.max - independantValueRange.min;
		//var dataDetails = {};
		//dataDetails.averages = section.calcDataAverage(dataVarSymbols.dependant);
		var valueWidth = section.getDataCount();
		var mergeSampleWidth = (valueWidth > contextXWidth)? valueWidth / contextXWidth: 1;

		//console.log('mergeSampleWidth',valueWidth,contextXWidth, mergeSampleWidth);

		//section.sort();
		var sampleCount = 0;
		var coordSum = {'x': 0, 'y': 0};
		var valueBuffer = [];
		//var lastCoord = this._calcSectionDataValueContextCoord(section.getHashValueAt(0), dataVarSymbols, dataTransferMatrix)
		var lastCoords;
		for (var i = 0, l = section.getDataCount(); i < l; ++i)
		{
			valueBuffer.push(section.getHashValueAt(i));
			++sampleCount;
			if (sampleCount >= mergeSampleWidth || i >= l - 1)
			{
				//var calcValue = this._mergeSectionDataValues(valueBuffer, dataVarSymbols, dataDetails);
				/*
				var coord = this._calcSectionDataValueContextCoord(calcValue, dataVarSymbols, dataTransferMatrix);
				if (lastCoord)
				{
					// console.log('coord', coord, section.getHashValueAt(i));
					var line = this.drawLine(context, lastCoord, coord, renderOptions);
					this.addToDrawGroup(result, line);
				}
				lastCoord = coord;
				*/
				var typicalValues = this._getMergeSectionDataMinMaxValues(valueBuffer, dataVarSymbols);
				if (!typicalValues)  // no valid data in this merge section
					continue;
				var coord1 = this._calcSectionDataValueContextCoord(typicalValues[0], dataVarSymbols, dataTransferMatrix, options.spectrum_reversedAxis);
				var coord2 = this._calcSectionDataValueContextCoord(typicalValues[1], dataVarSymbols, dataTransferMatrix, options.spectrum_reversedAxis);
				if (lastCoords)
				{
					var connectionLine;
					var delta11 = (lastCoords[0].y - coord1.y);
					var delta21 = (lastCoords[1].y - coord1.y);
					var delta12 = (lastCoords[0].y - coord2.y);
					var delta22 = (lastCoords[1].y - coord2.y);
					if (Math.sign(delta11) !== Math.sign(delta21)	|| Math.sign(delta12) !== Math.sign(delta22))  // the two line intersects, no need to draw connection line
					{

					}
					else  // draw the connection line in closest end points
					{
						if (Math.abs(delta21) < Math.abs(delta12))
						{
							connectionLine = this.drawLine(context, lastCoords[1], coord1, renderOptions);
						}
						else
						{
							connectionLine = this.drawLine(context, lastCoords[0], coord2, renderOptions);
						}
					}
					if (connectionLine)
						this.addToDrawGroup(result, connectionLine);
				}
				var line = this.drawLine(context, coord1, coord2, renderOptions);
				this.addToDrawGroup(result, line);
				lastCoords = [coord1, coord2];

				valueBuffer = [];
				sampleCount = 0;
			}
		}
		return result;
	},
	/** @private */
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
	/** @private */
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

		// the dependant value should be recalculated, currently the algorithm is fixed
		/*
		var totalWeight = 0
		var weightedSum = 0;
		for (var i = 0; i < count; ++i)
		{
			var weight = Math.sqr(Math.sqr(values[i][dataVarSymbols.dependant] - average[dataVarSymbols.dependant]));
			totalWeight += weight;
			weightedSum += weight * values[i][dataVarSymbols.dependant];
		}
		var result = {};
		result[dataVarSymbols.independant] = average[dataVarSymbols.independant];
		result[dataVarSymbols.dependant] = weightedSum / totalWeight;
		*/
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