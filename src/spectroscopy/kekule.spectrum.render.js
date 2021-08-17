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

// extents some render config classes
ClassEx.extendMethod(Kekule.Render.LengthConfigs, 'initProperties',
	function(originMethod)
	{
		originMethod();
		this.addHashConfigProp('defSpectrumSize2D');
		this.addHashConfigProp('defSpectrumSize3D');
	});
ClassEx.extendMethod(Kekule.Render.LengthConfigs, 'initPropDefValues',
	function(originMethod)
	{
		originMethod();
		this.setDefSpectrumSize2D({'x': this.getDefScaleRefLength() * 10, 'y': this.getDefScaleRefLength() * 6});
		this.setDefSpectrumSize3D({'x': this.getDefScaleRefLength() * 10, 'y': this.getDefScaleRefLength() * 10, 'z': this.getDefScaleRefLength() * 10});
	});

/**
 * Base spectrum render.
 * @class
 * @augments Kekule.Render.ChemObj2DRenderer
 */
Kekule.Render.Spectrum2DRenderer = Class.create(Kekule.Render.ChemObj2DRenderer,
/** @lends Kekule.Spectroscopy.Spectrum2DRenderer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Spectroscopy.Spectrum2DRenderer',
	/** @private */
	_initSpectrumDefSize: function(chemObj, drawOptions)
	{
		if (!chemObj.getSize2D())   // the spectrum size has not been set yet, use the default one in render config
		{
			var size2D = CU.multiply(drawOptions.defSpectrumSize2D, drawOptions.unitLength || 1);
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
		this.tryApplySuper('doDrawSelf', [context, baseCoord, options]);
		var chemObj = this.getChemObj();
		if (!baseCoord)
			baseCoord = this.getAutoBaseCoord(options);

		this._initSpectrumDefSize(chemObj, options);
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

		// TODO: currently handles active section only
		var activeSection = chemObj.getData().getActiveSection();
		var result = null;
		if (activeSection)
		{
			result = this.doDrawDataSections(chemObj, [activeSection], context, objBox, contextBox, options);
		}

		this.basicDrawObjectUpdated(context, chemObj, chemObj,
			this.createRectBoundInfo(contextBoxCoord1, contextBoxCoord2), Kekule.Render.ObjectUpdateType.ADD);
		return result;
	},
	/** @private */
	_getDisplayRangeOfSections: function(spectrum, spectrumData, sections)
	{
		var dataRange = spectrumData.getDisplayRangeOfSections(sections, null, true);
		var dataRange2 = spectrumData.calcDataRangeOfSections(sections);
		console.log('datarange', dataRange, dataRange2);
		return dataRange;
	},
	/** @private */
	doDrawDataSections: function(spectrum, sections, context, objBox, contextBox, options)
	{
		var spectrumData = spectrum.getData();
		// get the independant and denpendant vars
		var dependantVarSymbol, independantVarSymbol;
		var varInfos = sections[0].getLocalVarInfos();
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

		// retrieve data ranges of all sections and build the range box
		// var dataRange = spectrumData.calcDataRangeOfSections(sections);
		var dataRange = this._getDisplayRangeOfSections(spectrum, spectrumData, sections);
		if (!dataRange[dependantVarSymbol] || !dataRange[independantVarSymbol])
			return;
		var dataRangeBox = Kekule.BoxUtils.createBox({'x': dataRange[independantVarSymbol].min, 'y': dataRange[dependantVarSymbol].min},
			{'x': dataRange[independantVarSymbol].max, 'y': dataRange[dependantVarSymbol].max});

		// calculate internal transform params
		/*
		var internalTransformParams = {
			'scaleX': (contextBox.x2 - contextBox.x1) / (dataRangeBox.x2 - dataRangeBox.x1),
			'scaleY': (contextBox.y2 - contextBox.y1) / (dataRangeBox.y2 - dataRangeBox.y1),
			'translateX': contextBox.x1, //-dataRangeBox.x1,
			'translateY': contextBox.y1//-dataRangeBox.y1
		};
		var internalTransformMatrix = CU.calcTransform2DMatrix(internalTransformParams);
		//var toContextDrawCoordTransformMatrix = Kekule.CoordUtils.calcTransform2DMatrix({'translateX': contextBox.x1, 'translateY': contextBox.y1});
		//internalTransformMatrix = Kekule.MatrixUtils.multiply(toContextDrawCoordTransformMatrix, internalTransformMatrix);
		//var internalInverseTransformMatrix = Kekule.CoordUtils.calcInverseTransform2DMatrix(internalTransformParams);
		*/
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

		//var dataTransformMatrix = Kekule.MatrixUtils.multiply(internalTransformMatrix, options.transformParams.transformMatrix);
		var dataTransformMatrix = internalTransformMatrix;
		//var dataInverseTransformMatrix = Kekule.MatrixUtils.multiply(options.transformParams.transformMatrix, internalTransformMatrix);

		//console.log(contextBox);

		options.spectrumDataTransformMatrix = dataTransformMatrix;

		// draw sections
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
	doDrawSectionData: function(spectrum, section, context, contextBox, options, dataVarSymbols, dataTransferMatrix)
	{
		if (section.getDataCount() <= 0)
			return null;
		var renderOptions = Object.create(options);
		// TODO: need to set draw options here
		//renderOptions.strokeWidth = 1;
		//renderOptions.strokeColor = 'rgba(0,0,0,1)';
		var dataMode = section.getMode();
		if (dataMode === Kekule.Spectroscopy.DataMode.PEAK)
			return this.doDrawPeakSectionData(spectrum, section, context, contextBox, renderOptions, dataVarSymbols, dataTransferMatrix);
		else
			return this.doDrawContinuousSectionData(spectrum, section, context, contextBox, renderOptions, dataVarSymbols, dataTransferMatrix);
	},
	/** @private */
	doDrawPeakSectionData: function(spectrum, section, context, contextBox, renderOptions, dataVarSymbols, dataTransferMatrix)
	{
		var self = this;
		var result = this.createDrawGroup(context);
		section.forEach(function(dataValue, index){
			var peakRootValue = section.getPeakRootValueOf(dataValue);

			var coord1 = self._calcSectionDataValueContextCoord(dataValue, dataVarSymbols, dataTransferMatrix);
			var coord0 = self._calcSectionDataValueContextCoord(peakRootValue, dataVarSymbols, dataTransferMatrix);
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
				var coord1 = this._calcSectionDataValueContextCoord(typicalValues[0], dataVarSymbols, dataTransferMatrix);
				var coord2 = this._calcSectionDataValueContextCoord(typicalValues[1], dataVarSymbols, dataTransferMatrix);
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
	_calcSectionDataValueContextCoord: function(dataValue, dataVarSymbols, dataTransferMatrix)
	{
		var coord = {'x': dataValue[dataVarSymbols.independant], 'y': dataValue[dataVarSymbols.dependant]};
		//return Kekule.CoordUtils.transform2DByMatrix(coord, dataTransferMatrix);
		if (Kekule.NumUtils.isNormalNumber(coord.x) && Kekule.NumUtils.isNormalNumber(coord.y))
			return Kekule.CoordUtils.transform2DByMatrix(coord, dataTransferMatrix);
		else
			return null;
	}
});

Kekule.Render.Renderer2DFactory.register(Kekule.Spectroscopy.Spectrum, Kekule.Render.Spectrum2DRenderer);


})();