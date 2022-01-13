/**
 * @fileoverview
 * Related types and classes of spectrum viewer.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /xbrowsers/kekule.x.js
 * requires /core/kekule.common.js
 * requries /spectroscopy/kekule.spectrum.core.js
 * requires /widgets/kekule.widget.base.js
 * requires /widgets/kekule.widget.menus.js
 * requires /widgets/kekule.widget.dialogs.js
 * requires /widgets/kekule.widget.helpers.js
 * requires /widgets/kekule.widget.keys.js
 * requires /widgets/chem/kekule.chemWidget.base.js
 * requires /widgets/chem/kekule.chemWidget.chemObjDisplayers.js
 * requires /widgets/chem/kekule.chemWidget.viewers.js
 * requires /widgets/operation/kekule.actions.js
 *
 * requires /localization/kekule.localize.widget.js
 */

(function(){

"use strict";

Kekule._registerAfterLoadSysProc(function(){

// the following code will be run after both spectroscopy and widget modules are loaded

if (!Kekule.ChemWidget || !Kekule.Spectroscopy)
	return;

var AU = Kekule.ArrayUtils;
var OU = Kekule.ObjUtils;
var ZU = Kekule.ZoomUtils;

Kekule.globalOptions.add('chemWidget.viewer', {
	enableSpectrumMode: true,
	enableLocalSpectrumMode: false
});

/**
 * Config class of spectrum view for {@link Kekule.ChemWidget.ChemObjDisplayer}.
 * @class
 * @augments Kekule.AbstractConfigs
 *
 * @property {Bool} enableSpectrumMode Whether turning on the spectrum view mode when a single spectrum object is loaded in viewer.
 * @property {Bool} enableLocalSpectrumMode Whether applying specified interactions to a spectrum inside chem space (with other types of objects) in viewer.
 * //@property {Bool} enableSpectrumDataHint Whether displaying the hint with numberic data of spectrum value in current cursor position in viewer.
 * @property {Number} spectrumAxisLabelFontSizeMin The minimal font size to draw spectrum axis labels in spectrum mode.
 * @property {Number} spectrumAxisLabelFontSizeMax The maximal font size to draw spectrum axis labels in spectrum mode.
 * @property {Number} spectrumAxisLabelFontSizeFixed If this value is set, the spectrum axis labels will always be drawn in this size in spectrum mode,
 *   regardless of the zoom settings.
 */
Kekule.ChemWidget.ChemObjDisplayerSpectrumViewConfigs = Class.create(Kekule.AbstractConfigs,
/** @lends Kekule.ChemWidget.ChemObjDisplayerSpectrumViewConfigs# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ChemObjDisplayerSpectrumViewConfigs',
	/** @private */
	initProperties: function()
	{
		this.addBoolConfigProp('enableSpectrumMode', undefined);
		this.addBoolConfigProp('enableLocalSpectrumMode', undefined);
		this.addNumConfigProp('spectrumAxisLabelFontSizeMin', 15);
		this.addNumConfigProp('spectrumAxisLabelFontSizeMax', 35);
		this.addNumConfigProp('spectrumAxisLabelFontSizeFixed', 15);

		// configs about spectrum data UI marker
		this.addHashConfigProp('enableSpectrumDataHotTrackOnMode', undefined);
		this.addHashConfigProp('enableSpectrumDataSelectOnMode', undefined);
		this.addHashConfigProp('spectrumDataHotTrackUiMarkersOnMode', undefined);
		this.addHashConfigProp('spectrumDataSelectUiMarkersOnMode', undefined);

		//this.addBoolConfigProp('enableSpectrumDataPointMarker', true);
		//this.addBoolConfigProp('enableSpectrumDataPointDetailMarker', true);
		this.addHashConfigProp('spectrumHotTrackDataPointMarkerDrawStyles', undefined);
		this.addHashConfigProp('spectrumSelectDataPointMarkerDrawStyles', undefined);
		this.addHashConfigProp('spectrumHotTrackDataPointDetailMarkerDrawStyles', undefined);
		this.addHashConfigProp('spectrumSelectDataPointDetailMarkerDrawStyles', undefined);
		this.addIntConfigProp('spectrumDataPointMarkerSize', 15);
		this.addIntConfigProp('spectrumDataPointMarkerWidth', 2);
		this.addIntConfigProp('spectrumDataPointDetailMarkerValuePrecision', 8);
		this.addIntConfigProp('spectrumDataPointDetailMarkerPadding', 5);

		//this.addBoolConfigProp('enableSpectrumPeakHotTrack', true);
		//this.addBoolConfigProp('enableSpectrumPeakSelect', true);
		this.addHashConfigProp('spectrumPeakHotTrackStyles', undefined);
		this.addHashConfigProp('spectrumPeakSelectStyles', undefined);
		//this.addBoolConfigProp('hideSpectrumDataPointMarkerOnHotTrackedPeak', true);

		this.addNumConfigProp('spectrumDataPointSelectInflation', 1.5);


		//this.addBoolConfigProp('enableSpectrumDataHint', true);

		this.defineProp('spectrumZoomPrimaryModifierKeys', {'dataType': DataType.ARRAY});
		this.defineProp('spectrumZoomSecondaryModifierKeys', {'dataType': DataType.ARRAY});
		this.defineProp('spectrumZoomBothModifierKeys', {'dataType': DataType.ARRAY});
	},
	/** @ignore */
	initPropDefValues: function()
	{
		this.tryApplySuper('initPropDefValues');

		var DM = Kekule.Spectroscopy.DataMode;
		var value = {'default': true};
		value[DM.CONTINUOUS] = true;
		value[DM.PEAK] = true;
		this.setEnableSpectrumDataHotTrackOnMode(value);
		var value = {'default': false};
		value[DM.CONTINUOUS] = false;
		value[DM.PEAK] = true;
		this.setEnableSpectrumDataSelectOnMode(value);
		var value = {};
		value[DM.CONTINUOUS] = [SVM.DATA_POINT, SVM.DATA_DETAIL];
		value[DM.PEAK] = [SVM.PEAK, SVM.DATA_DETAIL];
		this.setSpectrumDataHotTrackUiMarkersOnMode(value);
		var value = {};
		value[DM.CONTINUOUS] = [SVM.DATA_POINT/*, SVM.DATA_DETAIL*/];
		value[DM.PEAK] = [SVM.PEAK/*, SVM.DATA_DETAIL*/];
		this.setSpectrumDataSelectUiMarkersOnMode(value);

		this.setSpectrumHotTrackDataPointMarkerDrawStyles({
			'color': '#c21717',
			'strokeWidth': 1,
			'opacity': 1
		});
		this.setSpectrumSelectDataPointMarkerDrawStyles({
			'color': '#1919b4',
			'strokeWidth': 1,
			'opacity': 1
		});
		this.setSpectrumHotTrackDataPointDetailMarkerDrawStyles({
			'fontFamily': 'Arial, Helvetica, sans-serif',
			'fontSize': 15,
			'color': '#c21717',
			'strokeWidth': 2,
			'opacity': 1
		});
		this.setSpectrumSelectDataPointDetailMarkerDrawStyles({
			'fontFamily': 'Arial, Helvetica, sans-serif',
			'fontSize': 15,
			'color': '#1919b4',
			'strokeWidth': 2,
			'opacity': 1
		});

		this.setSpectrumPeakHotTrackStyles({
			'color': '#c21717'
		});
		this.setSpectrumPeakSelectStyles({
			//'color': '#f50f0f'
			'color': '#1919b4',
			'spectrum_dataStrokeWidthRatio': 0.05
		});

		this.setSpectrumZoomPrimaryModifierKeys([]);
		this.setSpectrumZoomSecondaryModifierKeys(['shift']);
		this.setSpectrumZoomBothModifierKeys(['alt']);
	},
	/** @ignore */
	initPropValues: function()
	{
		this.tryApplySuper('initPropValues');
		//this.setEnableSpectrumMode(Kekule.globalOptions.chemWidget.viewer.enableSpectrumMode);
		//this.setEnableLocalSpectrumMode(Kekule.globalOptions.chemWidget.viewer.enableLocalSpectrumMode);
	},
	getActualEnableSpectrumMode: function()
	{
		return Kekule.oneOf(this.getEnableSpectrumMode(), Kekule.globalOptions.chemWidget.viewer.enableSpectrumMode);
	},
	getActualEnableLocalSpectrumMode: function()
	{
		return Kekule.oneOf(this.getEnableLocalSpectrumMode(), Kekule.globalOptions.chemWidget.viewer.enableLocalSpectrumMode);
	},

	getDataModeSpecifiedConfigValue: function(propName, dataMode)
	{
		var configValue = this.getPropValue(propName);
		if (DataType.isObjectValue(configValue))
		{
			var result = configValue[dataMode];
			if (result === undefined)
				result = configValue.default;
			return result;
		}
		else
			return configValue;
	},
	setDataModeSpecifiedConfigValue: function(propName, value, dataMode)
	{
		var configValue = this.getPropValue(propName);
		if (!configValue)
		{
			configValue = {};
			this.setPropValue(propName, configValue);
		}
		if (Kekule.ObjUtils.notUnset(dataMode))
			configValue[dataMode] = value;
		else
			configValue.default = value;
	},
	/** @private */
	getDataModeSpecifiedBoolConfigValueOfModeList: function(propName, dataModes, opAnd)
	{
		var modes = AU.toArray(dataModes);
		var result = this.getDataModeSpecifiedConfigValue(propName, modes[0]);
		if (!result && opAnd)
			return result;
		for (var i = 0, l = modes.length; i < l; ++i)
		{
			if (opAnd)
			{
				result = result && this.getDataModeSpecifiedConfigValue(propName, modes[i]);
				if (!result)
					return result;
			}
			else
				result = result || this.getDataModeSpecifiedConfigValue(propName, modes[i]);
		}
		return result;
	}
});

// Extend ChemObjDisplayerConfigs, add ChemObjDisplayerSpectrumViewConfigs into it
ClassEx.extendMethods(Kekule.ChemWidget.ChemObjDisplayerConfigs, {
	'initProperties': function($origin)
	{
		$origin();
		this.addConfigProp('spectrumViewConfigs', 'Kekule.ChemWidget.ChemObjDisplayerSpectrumViewConfigs');
	},
	'initPropDefValues': function($origin)
	{
		$origin();
		this.setPropStoreFieldValue('spectrumViewConfigs', new Kekule.ChemWidget.ChemObjDisplayerSpectrumViewConfigs());
	}
});

/**
 * A facade sub view class to wrap all methods about spectrum for {@link Kekule.ChemWidget.Viewer}.
 * @class
 * @augments Kekule.ChemWidget.ChemObjDisplayerSubView
 */
Kekule.ChemWidget.Viewer.SpectrumSubView = Class.create(Kekule.ChemWidget.ChemObjDisplayerSubView,
/** @lends Kekule.ChemWidget.Viewer.SpectrumSubView# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.Viewer.SpectrumSubView',
	/** @constructs */
	initialize: function(parent, targetObj)
	{
		this.tryApplySuper('initialize', [parent, targetObj]);
	},
	/** @private */
	initProperties: function() {
		this.defineProp('viewer', {
			'dataType': 'Kekule.ChemWidget.Viewer',
			'serializable': false,
			'setter': null,
			'getter': function() { return this.getParent(); }
		});
		// the target spectrum object
		this.defineProp('spectrum', {
			'dataType': 'Kekule.Spectroscopy.Spectrum',
			'serializable': false,
			'getter': function() { return this.getTarget(); }
		});
		// the viewport range of spectrum view
		this.defineProp('viewportRanges', {
			'dataType': DataType.HASH,
			'serializable': false
			/*
			'getter': function()
			{
				var cache = this._getSpectrumRenderCache();
				return cache && cache.viewportRanges;
			},
			'setter': function(value)
			{
				var cache = this._getSpectrumRenderCache();
				if (cache)
					cache.viewportRanges = value;
			}
			*/
			//'getter': function() { return this.getViewer().getSpectrumViewportRanges(); },
			//'setter': function(value) { this.getViewer().setSpectrumViewportRanges(value); }
		});
		// private, the hot tracked and selected spectrum peak
		this.defineProp('hotTrackedDataItem', {
			'dataType': DataType.OBJECT,
			'serializable': false,
			'getter': function()
			{
				var itemEx = this.getHotTrackedDataItemEx();
				return itemEx && itemEx.dataItem;
			},
			'setter': function(value)
			{
				var section = value && this._findSectionOfDataItem(value, true);
				var itemEx = section? {'section': section, 'dataValue': value}: null;
				this.changeHotTrackedDataItem(itemEx, true);
			}
		});
		this.defineProp('hotTrackedDataItemEx', {
			'dataType': DataType.OBJECT,
			'serializable': false,
			'setter': function(value)
			{
				this.changeHotTrackedDataItem(value, true);
			}
		});
		this.defineProp('selectedDataItem', {
			'dataType': DataType.OBJECT,
			'serializable': false,
			'getter': function(value)
			{
				var itemEx = this.getSelectedDataItemEx();
				return itemEx && itemEx.dataItem;
			},
			'setter': function(value)
			{
				var section = value && this._findSectionOfDataItem(value, true);
				var itemEx = section? {'section': section, 'dataValue': value}: null;
				this.changeSelectedDataItem(itemEx, true);
			}
		});
		this.defineProp('selectedDataItemEx', {
			'dataType': DataType.OBJECT,
			'serializable': false,
			'setter': function(value)
			{
				this.changeSelectedDataItem(value, true);
			}
		});
		// whether the spectrum is displayed with reversed axises position in spectrum view
		this.defineProp('isSpectrumWithReversedAxises', {
			'dataType': DataType.BOOL,
			'serializable': false,
			'setter': null,
			'getter': function()
			{
				var renderCache = this._getSpectrumRenderCache();
				return !!(renderCache && renderCache.spectrum_reversedAxises);
			}
		});
	},

	/** @ignore */
	appliableToTarget: function(obj)
	{
		return obj instanceof Kekule.Spectroscopy.Spectrum;
	},

	/** @private */
	_getSpectrumRenderer: function()
	{
		var spectrum = this.getSpectrum();
		if (spectrum)
		{
			var context = this.getViewer().getDrawContext();
			var rootRenderer = this.getViewer().getRootRenderer();
			var renderer = rootRenderer && rootRenderer.getDirectRendererForChildObj && rootRenderer.getDirectRendererForChildObj(context, spectrum);
			return renderer;
		}
		else
			return null;
	},
	/** @private */
	_getSpectrumRenderCache: function()
	{
		var renderer = this._getSpectrumRenderer();
		var context = this.getViewer().getDrawContext();
		return renderer && renderer.getRenderCache(context);
	},

	/**
	 * Returns all the data modes of displayed data section of spectrum.
	 * @returns {Array}
	 */
	getDisplayedDataModes: function()
	{
		var spectrum = this.getSpectrum();
		var sections = (spectrum && spectrum.getDisplayedDataSections() || []);
		var result = [];
		for (var i = 0, l = sections.length; i < l; ++i)
		{
			result.push(sections[i].getMode());
		}
		return result;
	},

	/**
	 * Returns the client screen box of spectrum data curve (without the axis and labels).
	 * @returns {Hash}
	 */
	getClientScreenBox: function()
	{
		var viewer = this.getViewer();
		//if (viewer.isInSpectrumMode())
		{
			var spectrum = this.getSpectrum(); //viewer.getChemObj();
			if (spectrum)
			{
				var boundInfoRecorder = viewer.getBoundInfoRecorder();
				var bound = boundInfoRecorder && boundInfoRecorder.getBound(viewer.getDrawContext(), spectrum.getPseudoRenderSubObject('data'));
				if (bound.shapeType === Kekule.Render.MetaShapeType.RECT)
				{
					return Kekule.BoxUtils.createBox(bound.coords[0], bound.coords[1]);
				}
				else
					return null;
			}
		}
		return null;
	},
	/** @private */
	fetchViewportRanges: function()
	{
		var result = {};
		var VD = Kekule.VarDependency;
		result[VD.INDEPENDENT] = this.getViewportRange(VD.INDEPENDENT);
		result[VD.DEPENDENT] = this.getViewportRange(VD.DEPENDENT);
		return result;
	},
	/**
	 * Returns the actual spectrum view port range of a var axis.
	 * @param {Int} varDependency
	 * @returns {Hash}
	 */
	getViewportRange: function(varDependency)
	{
		var result = (this.getViewportRanges() || {})[varDependency] || {};
		return Object.extend({'rangeFrom': 0, 'rangeTo': 1}, result);
	},
	/**
	 * Set the spectrum viewport range of a var axis.
	 * @param {Int} varDependency
	 * @param {Number} rangeFrom
	 * @param {Number} rangeTo
	 */
	setViewportRange: function(varDependency, rangeFrom, rangeTo)
	{
		var ranges = this.getViewportRanges();
		if (!ranges)
		{
			ranges = {};
			this.setViewportRanges(ranges);
		}
		var range = ranges[varDependency];
		if (!range)
		{
			range = {};
			ranges[varDependency] = range;
		}
		range.rangeFrom = Kekule.oneOf(rangeFrom, 0);
		range.rangeTo = Kekule.oneOf(rangeTo, 1);
		this.applyToRenderOptions();
		return this;
	},
	/**
	 * Reset the spectrum viewport range.
	 * @param {Int} varDependency If not set, both dep/indep vars will be reset.
	 */
	resetViewportRange: function(varDependency)
	{
		if (Kekule.ObjUtils.isUnset(varDependency))
			this.setViewportRanges(undefined);
		else
		{
			var old = this.getViewportRange(varDependency);
			if (old && old[varDependency])
				delete old[varDependency];
		}
		this.applyToRenderOptions();
	},
	/** @private */
	getViewportZoomInfo: function(varDependency)
	{
		if (!varDependency)
			varDependency = Kekule.VarDependency.INDEPENDENT;
		var range = this.getViewportRange(varDependency);
		return {
			'zoom': 1 / Math.abs(range.rangeTo - range.rangeFrom),
			'center': (range.rangeTo + range.rangeFrom) / 2
		};
	},
	/** @private */
	setViewportZoom: function(varDependency, zoom, zoomCenter)
	{
		if (!varDependency)
			varDependency = Kekule.VarDependency.INDEPENDENT;

		if (Kekule.ObjUtils.isUnset(zoomCenter))
		{
			var oldZoomInfo = this.getViewportZoomInfo(varDependency);
			zoomCenter = oldZoomInfo.center;
		}
		var delta = 1 / zoom / 2;
		var range = {
			'rangeFrom': zoomCenter - delta,
			'rangeTo': zoomCenter + delta
		};
		this.setViewportRange(varDependency, range.rangeFrom, range.rangeTo);
	},

	/** @private */
	_zoomViewportTo: function(value, zoomCenterCoord, direction, varDependency)
	{
		var clientBox = this.getClientScreenBox();
		var currViewportRange = this.getViewportRange(varDependency);
		var oldRangeValue = currViewportRange.rangeTo - currViewportRange.rangeFrom;
		var newRangeValue = 1 / value;
		var rangeDelta = newRangeValue - oldRangeValue;
		var fixedPointRatio;
		if (!zoomCenterCoord)
			fixedPointRatio = 0.5;
		else
		{
			fixedPointRatio = (direction === 'x')?
				((zoomCenterCoord.x - clientBox.x1) / (clientBox.x2 - clientBox.x1)):
				((clientBox.y2 - zoomCenterCoord.y) / (clientBox.y2 - clientBox.y1));
		}
		var newRangeFrom = currViewportRange.rangeFrom - rangeDelta * fixedPointRatio;
		var newRangeTo = currViewportRange.rangeTo + rangeDelta * (1 - fixedPointRatio);
		this.setViewportRange(varDependency, newRangeFrom, newRangeTo);

		return this;
	},
	/**
	 * Zoom the spectrum viewport.
	 * @param {Number} delta
	 * @param {Hash} zoomCenterCoord
	 * @param {Array} directions e.g. ['x', 'y'].
	 * @private
	 */
	zoomViewportByDelta: function(delta, zoomCenterCoord, directions)
	{
		var viewer = this.getViewer();
		//if (viewer.isInSpectrumMode())
		//if (viewer.enableSpectrumInteraction())
		{
			viewer.beginUpdate();
			try
			{
				for (var i = 0, l = directions.length; i < l; ++i)
				{
					var direction = directions[i];
					var targetOnIndep = direction === 'x';
					var reversedAxises = this.getIsSpectrumWithReversedAxises();
					if (reversedAxises)
						targetOnIndep = !targetOnIndep;

					var varDependency = targetOnIndep ? Kekule.VarDependency.INDEPENDENT : Kekule.VarDependency.DEPENDENT;

					var zoomRatio;
					var curr = this.getViewportZoomInfo(varDependency).zoom;
					if (delta > 0)
					{
						zoomRatio = ZU.getNextZoomInRatio(curr, delta);
					}
					else if (delta < 0)
					{
						zoomRatio = ZU.getNextZoomOutRatio(curr, -delta);
					}
					this._zoomViewportTo(zoomRatio, zoomCenterCoord, direction, varDependency);
				}
			}
			finally
			{
				viewer.endUpdate();  // repaint here
			}
			//viewer.geometryOptionChanged();
		}
	},

	/** @private */
	_applyViewportRanges: function(/*affectedOptions*/)
	{
		var viewer = this.getViewer();
		//if (viewer.isInSpectrumMode())
		{
			var varDependencies = [Kekule.VarDependency.INDEPENDENT, Kekule.VarDependency.DEPENDENT];
			var varTypes = ['independent', 'dependent'];

			var targetSpectrum = this.getTarget();
			for (var i = 0, ii = varTypes.length; i < ii; ++i)
			{
				var viewPortRange = this.getViewportRange(varDependencies[i]);
				var optionNameFrom = 'spectrum_viewport' + varTypes[i].upperFirst() + 'DataRangeFrom';
				var optionNameTo = 'spectrum_viewport' + varTypes[i].upperFirst() + 'DataRangeTo';
				/*
				affectedOptions[optionNameFrom] = viewPortRange.rangeFrom;
				affectedOptions[optionNameTo] = viewPortRange.rangeTo;
				*/
				var overrideOptions = {};
				overrideOptions[optionNameFrom] = viewPortRange.rangeFrom;
				overrideOptions[optionNameTo] = viewPortRange.rangeTo;
				targetSpectrum.addOverrideRenderOptionItem(overrideOptions);
			}
		}
	},
	/**
	 * Apply spectrum view settings to render options of viewer.
	 * @param {Object} renderOptions
	 * @private
	 */
	applyToRenderOptions: function(/*renderOptions*/)
	{
		this._applyViewportRanges(/*renderOptions*/);
		var viewer = this.getViewer();
		var renderer = viewer.getRootRenderer();
		if (renderer)
		{
			//console.log('request update');
			renderer.update(viewer.getDrawContext(), [{'obj': this.getTarget()}]);
		}
	},

	/** @private */
	_getHotTrackedDataItemRenderStyles: function()
	{
		var viewer = this.getViewer();
		return viewer && viewer.getDisplayerConfigs().getSpectrumViewConfigs().getSpectrumPeakHotTrackStyles();
	},
	/** @private */
	_getSelectedDataItemRenderStyles: function()
	{
		var viewer = this.getViewer();
		return viewer && viewer.getDisplayerConfigs().getSpectrumViewConfigs().getSpectrumPeakSelectStyles();
	},

	/** @private */
	_findSectionOfDataItem: function(dataItem, displayedSectionOnly)
	{
		var spectrum = this.getSpectrum();
		var sections = displayedSectionOnly? spectrum.getDisplayedDataSections(): spectrum.getDataSections();
		for (var i = 0, l = sections.length; i < l; ++i)
		{
			var section = sections[i];
			if (section.indexOfDataItem(dataItem) >= 0)
				return section;
		}
		return null;
	},
	/**
	 * Called when the hot tracked peak item is changed.
	 * @private
	 */
	_hotTrackedDataItemChanged: function(oldItemEx, newItemEx)
	{
		this._hotTrackedOrSelectDataItemChanged(oldItemEx, newItemEx, false);
	},
	/**
	 * Called when the selected peak item is changed.
	 * @private
	 */
	_selectedDataItemChanged: function(oldItemEx, newItemEx)
	{
		this._hotTrackedOrSelectDataItemChanged(oldItemEx, newItemEx, true);
		/*
		var spectrum = this.getSpectrum();
		if (oldItemEx)
		{
			if (this._selectedDataItemRenderStyles)
				spectrum.removeDataItemOverrideRenderOptionItem(oldItemEx.dataValue, this._selectedDataItemRenderStyles);
		}
		if (newItemEx)
		{
			var renderStyles = this._getSelectedDataItemRenderStyles();
			if (renderStyles)
			{
				spectrum.addDataItemOverrideRenderOptionItem(newItemEx.dataValue, renderStyles);
				this._selectedDataItemRenderStyles = renderStyles;
			}
		}
		*/
	},
	/** @private */
	_hotTrackedOrSelectDataItemChanged: function(oldItemEx, newItemEx, isSelect)
	{
		var viewer = this.getViewer();
		var spectrum = this.getSpectrum();
		var configs = this.getViewer().getDisplayerConfigs().getSpectrumViewConfigs();
		var dataItemRenderStylesField = isSelect? '_selectDataItemRenderStyles': '_hotTrackedDataItemRenderStyles';
		if (newItemEx)  // empty hot tracked or select item in other sub views
		{
			this._removeHotTrackedOrSelectedDataItemInSiblingSpectrumViews(isSelect);
		}
		if (oldItemEx)
		{
			if (this[dataItemRenderStylesField])
			{
				spectrum.removeDataItemOverrideRenderOptionItem(oldItemEx.dataValue, this[dataItemRenderStylesField]);
			}
		}
		var uiMarkerElements = (newItemEx && newItemEx.dataValue)?
			(isSelect? this._getSpectrumDataSelectElements(configs, newItemEx.section): this._getSpectrumDataHotTrackElements(configs, newItemEx.section)):
			[];
		var dataPointMarkerVisible = uiMarkerElements.indexOf(SVM.DATA_POINT) >= 0;
		var dataDetailMarkerVisible = uiMarkerElements.indexOf(SVM.DATA_DETAIL) >= 0;
		var detailMarker = viewer.getSpectrumUiMarker(isSelect? 'selectDataDetail': 'hotTrackDataDetail', !!dataDetailMarkerVisible);
		var pointMarker = viewer.getSpectrumUiMarker(isSelect? 'selectDataPoint': 'hotTrackDataPoint', !!dataPointMarkerVisible);

		//console.log('hot track', newItemEx, hotTrackElements);

		if (newItemEx && uiMarkerElements.length)  // do need to display some hot track elements
		{
			var dataValue = newItemEx.dataValue;
			var dataSection = newItemEx.section;

			//if (hotTrackElements.length)  // do need to display some hot track elements
			{
				if (dataSection.isPeakSection() && (uiMarkerElements.indexOf(SVM.PEAK) >= 0))  // hot track peak
				{
					var renderStyles = isSelect? this._getSelectedDataItemRenderStyles(): this._getHotTrackedDataItemRenderStyles();
					if (renderStyles)
					{
						spectrum.addDataItemOverrideRenderOptionItem(newItemEx.dataValue, renderStyles);
						this[dataItemRenderStylesField] = renderStyles;
					}
				}

				if (dataPointMarkerVisible || dataDetailMarkerVisible)
				{
					var clientBox = this.getClientScreenBox();
					var baseContextCoord = this.calcCoordAtSpectrumData(dataValue, Kekule.Render.CoordSystem.CONTEXT);
					var detailText = null;

					if (dataDetailMarkerVisible)  // data detail
						detailText = this._formatSpectrumDataValueString(dataValue, configs.getSpectrumDataPointDetailMarkerValuePrecision());
					//console.log('update', dataValue, detailText);
					//this._updateSpectrumCurrDataPointMarker(baseContextCoord, detailText, dataPointMarkerVisible, dataDetailMarkerVisible, clientBox);
				}
				var detailStyles = isSelect? configs.getSpectrumSelectDataPointDetailMarkerDrawStyles(): configs.getSpectrumHotTrackDataPointDetailMarkerDrawStyles();
				var pointStyles = isSelect? configs.getSpectrumSelectDataPointMarkerDrawStyles(): configs.getSpectrumHotTrackDataPointMarkerDrawStyles();
				this._updateDataDetailMarker(detailMarker, baseContextCoord, {'text': detailText}, dataDetailMarkerVisible, detailStyles, clientBox, false);
				this._updateDataPointMarker(pointMarker, baseContextCoord, null, dataPointMarkerVisible, pointStyles, clientBox, false);
			}
		}
		else
		{
			if (detailMarker)
				viewer.hideUiMarker(detailMarker, false);
			if (pointMarker)
				viewer.hideUiMarker(pointMarker, false);
		}
		viewer.repaintUiMarker();
	},
	/** @private */
	_removeHotTrackedOrSelectedDataItemInSiblingSpectrumViews(isSelect)
	{
		var viewer = this.getViewer();
		var self = this;
		viewer.iterateSubViews(function(subView){
			if (subView !== self && subView instanceof Kekule.ChemWidget.Viewer.SpectrumSubView)
			{
				if (isSelect)
					subView.changeSelectedDataItem(null, false);
				else
					subView.changeHotTrackedDataItem(null, false);
			}
		});
	},

	/** @private */
	changeHotTrackedDataItem: function(newItemEx, doRepaint)
	{
		var old = this.getHotTrackedDataItemEx();
		if (old !== newItemEx)
		{
			this.setPropStoreFieldValue('hotTrackedDataItemEx', newItemEx);
			this._hotTrackedDataItemChanged(old, newItemEx);
			if (doRepaint)
				this.getViewer().requestRepaint();
		}
	},
	/** @private */
	changeSelectedDataItem: function(newItemEx, doRepaint)
	{
		var old = this.getSelectedDataItemEx();
		if (old !== newItemEx)
		{
			this.setPropStoreFieldValue('selectedDataItemEx', newItemEx);
			this._selectedDataItemChanged(old, newItemEx);
			if (doRepaint)
				this.getViewer().requestRepaint();
		}
	},

	// methods about UI markers /////////
	/** @private */
	_getSpectrumDataHotTrackElements: function(spectrumViewConfigs, dataSection)
	{
		var configs = spectrumViewConfigs;
		var dataMode = dataSection.getMode();
		var needHotTrack = configs.getDataModeSpecifiedConfigValue('enableSpectrumDataHotTrackOnMode', dataMode);

		var activeMarkers = !needHotTrack? []: configs.getDataModeSpecifiedConfigValue('spectrumDataHotTrackUiMarkersOnMode', dataMode);
		return activeMarkers;
	},
	/** @private */
	_getSpectrumDataSelectElements: function(spectrumViewConfigs, dataSection)
	{
		var configs = spectrumViewConfigs;
		var dataMode = dataSection.getMode();
		var needSelect = configs.getDataModeSpecifiedConfigValue('enableSpectrumDataSelectOnMode', dataMode);

		var activeMarkers = !needSelect? []: configs.getDataModeSpecifiedConfigValue('spectrumDataSelectUiMarkersOnMode', dataMode);
		return activeMarkers;
	},
	/** @private */
	_formatSpectrumDataValueString: function(spectrumDataValue, precision)
	{
		var dataVarSymbols = Kekule.ObjUtils.getOwnedFieldNames(spectrumDataValue);
		var detailTextParts = [];
		for (var i = 0, l = dataVarSymbols.length; i < l; ++i)
		{
			if (Kekule.NumUtils.isNormalNumber(spectrumDataValue[dataVarSymbols[i]]))
				detailTextParts.push(dataVarSymbols[i] + ': ' + spectrumDataValue[dataVarSymbols[i]].toPrecision(precision));
		}
		return detailTextParts.join(', ');
	},

	/** @private */
	_updateDataPointMarker: function(marker, contextCoord, params, visible, styles, spectrumClientBox, doRepaint)
	{
		if (!marker)
			return;
		var viewer = this.getViewer();
		var pVisible = visible && contextCoord;
		if (pVisible)
		{
			var isInideBox = Kekule.CoordUtils.isInsideBox(contextCoord, spectrumClientBox);
			pVisible = !!isInideBox;
		}
		if (!pVisible)
		{
			viewer.hideUiMarker(marker, doRepaint);
		}
		else // if (pVisible)
		{
			//if (pVisible)
			{
				var configs = viewer.getDisplayerConfigs().getSpectrumViewConfigs();
				var unitLength = viewer.getRenderConfigs().getLengthConfigs().getUnitLength() || 1;

				// TODO: currently the shape is fixed to a cross
				var shapeInfo;
				var lineWidth = (configs.getSpectrumDataPointMarkerWidth() || 1) * unitLength;
				var c = contextCoord;
				if (configs.getSpectrumDataPointMarkerSize())
				{
					var halfSize = (configs.getSpectrumDataPointMarkerSize() / 2) * unitLength;
					shapeInfo = [
						Kekule.Render.MetaShapeUtils.createShapeInfo(
							Kekule.Render.MetaShapeType.LINE,
							[{'x': c.x - halfSize, 'y': c.y}, {'x': c.x + halfSize, 'y': c.y}], {'width': lineWidth}
						),
						Kekule.Render.MetaShapeUtils.createShapeInfo(
							Kekule.Render.MetaShapeType.LINE,
							[{'x': c.x, 'y': c.y - halfSize}, {'x': c.x, 'y': c.y + halfSize}], {'width': lineWidth}
						)
					];
				}
				else if (spectrumClientBox)  // a cross all over spectrum client area
				{
					shapeInfo = [
						Kekule.Render.MetaShapeUtils.createShapeInfo(
							Kekule.Render.MetaShapeType.LINE,
							[{'x': spectrumClientBox.x1, 'y': c.y}, {'x': spectrumClientBox.x2, 'y': c.y}], {'width': lineWidth}
						),
						Kekule.Render.MetaShapeUtils.createShapeInfo(
							Kekule.Render.MetaShapeType.LINE,
							[{'x': c.x, 'y': spectrumClientBox.y1}, {'x': c.x, 'y': spectrumClientBox.y2}], {'width': lineWidth}
						)
					];
				}

				var pointDrawStyles = Object.create(/*configs.getSpectrumDataPointMarkerDrawStyles()*/styles);
				pointDrawStyles.strokeWidth *= unitLength;

				viewer.modifyShapeBasedMarker(marker, shapeInfo, pointDrawStyles, false);
				viewer.showUiMarker(marker, doRepaint);
			}
		}
	},
	/** @private */
	_updateDataDetailMarker: function(marker, contextCoord, params, visible, styles, spectrumClientBox, doRepaint)
	{
		if (!marker)
			return;
		var viewer = this.getViewer();
		var text = params.text;
		var pVisible = visible && contextCoord && text;
		if (pVisible)
		{
			var isInideBox = Kekule.CoordUtils.isInsideBox(contextCoord, spectrumClientBox);
			pVisible = !!isInideBox;
		}
		if (!pVisible)
		{
			viewer.hideUiMarker(marker, doRepaint);
		}
		else
		{
			var configs = viewer.getDisplayerConfigs().getSpectrumViewConfigs();
			var unitLength = viewer.getRenderConfigs().getLengthConfigs().getUnitLength() || 1;

			var detailDrawStyles = Object.create(/*configs.getSpectrumDataPointDetailMarkerDrawStyles()*/styles);
			detailDrawStyles.fontSize *= unitLength;

			if (text)
			{
				// determinate the position of detail text
				var drawBridge = viewer.getDrawBridge();
				var textBox = drawBridge.measureText(viewer.getDrawContext(), text, detailDrawStyles);
				var textPadding = (configs.getSpectrumDataPointDetailMarkerPadding() || 0) * unitLength;
				var spaceings = {
					'x1': contextCoord.x - spectrumClientBox.x1,
					'x2': spectrumClientBox.x2 - contextCoord.x,
					'y1': contextCoord.y - spectrumClientBox.y1,
					'y2': spectrumClientBox.y2 - contextCoord.y
				}
				var textBoxXAlignment, textBoxYAlignment;
				var textCoord = {};
				if (spaceings.x2 - textPadding >= textBox.width)
				{
					textCoord.x = contextCoord.x + textPadding;
					textBoxXAlignment = Kekule.Render.BoxXAlignment.LEFT;
				}
				else if (spaceings.x1 - textPadding >= textBox.width)
				{
					textCoord.x = contextCoord.x - textPadding;
					textBoxXAlignment = Kekule.Render.BoxXAlignment.RIGHT;
				}
				else if (spaceings.x2 >= spaceings.x1)
				{
					textCoord.x = spectrumClientBox.x2 - textBox.width;
					textBoxXAlignment = Kekule.Render.BoxXAlignment.LEFT;
				}
				else
				{
					textCoord.x = spectrumClientBox.x1 + textBox.width;
					textBoxXAlignment = Kekule.Render.BoxXAlignment.RIGHT;
				}

				if (spaceings.y1 - textPadding >= textBox.height)
				{
					textCoord.y = contextCoord.y - textPadding;
					textBoxYAlignment = Kekule.Render.BoxYAlignment.BOTTOM;
				}
				else if (spaceings.y2 - textPadding >= textBox.height)
				{
					textCoord.y = contextCoord.y + textPadding;
					textBoxYAlignment = Kekule.Render.BoxYAlignment.TOP;
				}
				else if (spaceings.y1 >= spaceings.y2)
				{
					textCoord.y = spectrumClientBox.y1 + textBox.height;
					textBoxYAlignment = Kekule.Render.BoxYAlignment.BOTTOM;
				}
				else
				{
					textCoord.y = spectrumClientBox.y2 - textBox.height;
					textBoxYAlignment = Kekule.Render.BoxYAlignment.TOP;
				}


				detailDrawStyles.textBoxXAlignment = textBoxXAlignment;
				detailDrawStyles.textBoxYAlignment = textBoxYAlignment;
			}

			//console.log(textCoord, textBoxXAlignment, textBoxYAlignment);

			viewer.modifyTextBasedMarker(marker, textCoord, text, detailDrawStyles, false);
			viewer.showUiMarker(marker, doRepaint);
		}
	},

	/////////////////////////////////////

	/**
	 * Reset the spectrum view settings.
	 */
	resetView: function()
	{
		this.changeHotTrackedDataItem(null, false);
		this.changeSelectedDataItem(null, false);
		this.resetViewportRange();
	},

	/** @private */
	getSpectrumDataValueInfoFromIndependent: function(independentValues, candicateSections, extraOptions)
	{
		var spectrum = this.getSpectrum();
		var sections = candicateSections || spectrum.getDisplayedDataSections() || [];
		for (var i = 0, l = sections.length; i < l; ++i)
		{
			var sec = sections[i];
			var v = sec.getDataValueFromIndependent(independentValues, extraOptions);
			if (Kekule.ObjUtils.notUnset(v))
				return {'value': v, 'section': sec};
		}
		return null;
	},
	/**
	 * Calculate values of dependant variable values from independent variable values.
	 * @param {Variant} independentValues A hash value with symbol: number map, or an array of values, or a single number value.
	 * @param {Hash} extraOptions
	 * @returns {Hash}
	 */
	calcValueFromIndependent: function(independentValues, extraOptions)
	{
		var indepHashValues = {};
		if (typeof(independentValues) === 'number')  // a direct number value,
			indepHashValues = this._convArrayToSymboledHash([independentValues], this.getLocalVarSymbolsOfDependency(Kekule.VarDependency.INDEPENDENT));
		else if (DataType.isArrayValue(independentValues))
			indepHashValues = this._convArrayToSymboledHash(independentValues, this.getLocalVarSymbolsOfDependency(Kekule.VarDependency.INDEPENDENT));
		else
			indepHashValues = independentValues;
		return this.doCalcValueFromIndependent(indepHashValues, extraOptions);
	},

	///////// spectrum coord transform methods ////////////
	/**
	 * Translate a coord in fromCoordSys to coord values of spectrum internal data.
	 * @param {Object} coord
	 * @param {Int} fromCoordSys
	 * @returns {Object} coord in spectrum data scope, {x, y}.
	 */
	translateCoordToSpectrum: function(coord, fromCoordSys)
	{
		var contextCoord = this.getViewer().translateCoord(coord, fromCoordSys, Kekule.Render.CoordSystem.CONTEXT);
		var transMatrix = this._getSpectrumRenderCache().spectrumInvDataTransformMatrix;
		var transformFunc = this.getViewer().getRenderType() === Kekule.Render.RendererType.R3D?
			Kekule.CoordUtils.transform3DByMatrix: Kekule.CoordUtils.transform2DByMatrix;
		return transMatrix? transformFunc(contextCoord, transMatrix): contextCoord;
	},
	/**
	 * Translate a coord from spectrum internal data scope to toCoordSys.
	 * @param {Object} coord {x, y}.
	 * @param {Int} toCoordSys
	 * @returns {Object} coord in toCoordSys.
	 */
	translateCoordFromSpectrum: function(coord, toCoordSys)
	{
		var transMatrix = this._getSpectrumRenderCache().spectrumDataTransformMatrix;
		var transformFunc = this.getViewer().getRenderType() === Kekule.Render.RendererType.R3D?
			Kekule.CoordUtils.transform3DByMatrix: Kekule.CoordUtils.transform2DByMatrix;
		var contextCoord = transMatrix? transformFunc(coord, transMatrix): coord;
		return this.getViewer().translateCoord(contextCoord, Kekule.Render.CoordSystem.CONTEXT, toCoordSys);
	},

	/**
	 * Returns the data item info at current coord {x, y}.
	 * @param {Object} coord
	 * @param {Int} fromCoordSys
	 * @param {Hash} options
	 * @returns {Object} Including fields {dataValue, dataSection}
	 */
	getSpectrumDataValueItemInfoAtCoord: function(coord, fromCoordSys, options)
	{
		var specCoord = this.translateCoordToSpectrum(coord, fromCoordSys);
		var indepValue = this.getIsSpectrumWithReversedAxises()? specCoord.y: specCoord.x;
		var spectrum = this.getSpectrum();
		var sections = spectrum.getDisplayedDataSections() || [];
		for (var i = 0, l = sections.length; i < l; ++i)
		{
			var section = sections[i];
			var dataValue = section.getDataValueFromIndependent(indepValue, options);
			if (dataValue)
				return {'dataValue': dataValue, 'dataSection': section};
		}
		return null;
	},
	/**
	 * Calculate out the actual spectrum data value from the independent variable values at current coord {x, y}.
	 * @param {Object} coord
	 * @param {Int} fromCoordSys
	 * @param {Hash} options
	 * @returns {Object}
	 */
	calcSpectrumDataAtCoord: function(coord, fromCoordSys, options)
	{
		var specCoord = this.translateCoordToSpectrum(coord, fromCoordSys);
		var indepValue = this.getIsSpectrumWithReversedAxises()? specCoord.y: specCoord.x;
		var spectrum = this.getSpectrum();
		var sections = spectrum.getDisplayedDataSections() || [];
		for (var i = 0, l = sections.length; i < l; ++i)
		{
			var section = sections[i];
			var dataValue = section.calcValueFromIndependent(indepValue, options);
			if (dataValue)
				return dataValue;
		}
		return null;
	},
	/**
	 * Calculate out the actual spectrum data range from the independent variable value range between coords.
	 * @param {Array} coords
	 * @param {Int} fromCoordSys
	 * @param {Hash} options
	 * @returns {Object}
	 */
	calcSpectrumDataRangeInCoordRange: function(coords, fromCoordSys, options)
	{
		var isReversedAxises = this.getIsSpectrumWithReversedAxises();
		var fromCoordIndepField = isReversedAxises? 'y': 'x';
		var fromCoordRange = Kekule.Spectroscopy.Utils.expandDataRange({}, coords);
		var specCoords = [
			this.translateCoordToSpectrum({'x': fromCoordRange.x.min, 'y': fromCoordRange.y.min}, fromCoordSys),
			this.translateCoordToSpectrum({'x': fromCoordRange.x.max, 'y': fromCoordRange.y.max}, fromCoordSys)
		];
		var indepValues = [specCoords[0][fromCoordIndepField], specCoords[1][fromCoordIndepField]];
		var indepValueRange = {'min': Math.min(indepValues[0], indepValues[1]), 'max': Math.max(indepValues[0], indepValues[1])};

		var spectrum = this.getSpectrum();
		var sections = spectrum.getDisplayedDataSections() || [];
		for (var i = 0, l = sections.length; i < l; ++i)
		{
			var section = sections[i];
			var dataValueRangeEx = section.calcValueRangeFromIndependentRangeEx([indepValueRange], options);
			if (dataValueRangeEx && dataValueRangeEx.range)
			{
				dataValueRangeEx.dataSection = section;  // add additional section info
				return dataValueRangeEx;
			}
		}
		return null;
	},
	/**
	 * Calculate out the primary data value from the independent variable value range between coords.
	 * @param {Array} coords
	 * @param {Int} fromCoordSys
	 * @param {Hash} options
	 * @returns {Hash} {dataSection, dataValue}
	 */
	calcSpectrumPrimaryDataValueInCoordRangeEx: function(coords, fromCoordSys, options)
	{
		var op = Object.create(options || null);
		op.findNearest = true;
		var rangeEx = this.calcSpectrumDataRangeInCoordRange(coords, fromCoordSys, options);
		if (!rangeEx)
			return null;

		var dataSection = rangeEx.dataSection;
		var dataValue;
		if (dataSection.isPeakSection() && rangeEx.nearest)
			dataValue = rangeEx.nearest.dataValue;
		else
		{
			var depVarSymbol = dataSection.getLocalVarSymbolsOfDependency(Kekule.VarDependency.DEPENDENT)[0];
			if (depVarSymbol)
			{
				var spectrum = this.getSpectrum();
				var peakPosition = Kekule.Spectroscopy.Utils.getSpectrumPeakPosition(spectrum);
				var dataValues = rangeEx.dataValues;
				var matchedValue = dataValues[0];
				for (var i = 1, l = dataValues.length; i < l; ++i)
				{
					var v = dataValues[i];
					if ((peakPosition === Kekule.Spectroscopy.DataPeakPosition.MIN && v[depVarSymbol] < matchedValue[depVarSymbol])
						|| (v[depVarSymbol] > matchedValue[depVarSymbol]))
						matchedValue = v;
				}
				dataValue = matchedValue;
			}
			else
				dataValue = dataValues[Math.round((dataValues.length - 1) / 2) + 1];
		}
		return {'dataValue': dataValue, 'dataSection': dataSection};
	},
	/**
	 * Calculate out the primary data value from the independent variable value range between coords.
	 * @param {Array} coords
	 * @param {Int} fromCoordSys
	 * @param {Hash} options
	 * @returns {Object} The data value.
	 */
	calcSpectrumPrimaryDataValueInCoordRange: function(coords, fromCoordSys, options)
	{
		return this.calcSpectrumPrimaryDataValueInCoordRangeEx(coords, fromCoordSys, options).dataValue;
	},
	/**
	 * Calculate out the coord {x, y} of an actual spectrum data value.
	 * @param {Hash} dataValue
	 * @param {Int} toCoordSys
	 * @param {Hash} options
	 * @returns {Object}
	 */
	calcCoordAtSpectrumData: function(dataValue, toCoordSys, options)
	{
		var isReversedAxis = this.getIsSpectrumWithReversedAxises();
		var spectrum = this.getSpectrum();
		var section = (spectrum.getDisplayedDataSections() || [])[0];  // all displayed sections should has the same var settings
		if (section)
		{
			var specCoord = this._spectrumSectionDataValueToSpectrumCoord(dataValue, section, isReversedAxis);
			return specCoord && this.translateCoordFromSpectrum(specCoord, toCoordSys);
		}
		else
			return null;
	},
	/**
	 * Calculate out the coord {x, y} of the actual spectrum data at indepValues.
	 * @param {Hash} indepValues
	 * @param {Int} toCoordSys
	 * @param {Hash} options
	 * @returns {Object}
	 */
	calcCoordAtSpectrumDataFromIndependent: function(indepValues, toCoordSys, options)
	{
		var spectrum = this.getSpectrum();
		var sections = spectrum.getDisplayedDataSections() || [];
		var isReversedAxis = this.getIsSpectrumWithReversedAxises();
		for (var i = 0, l = sections.length; i < l; ++i)
		{
			var section = sections[i];
			var dataValue = section.calcValueFromIndependent(indepValue, options);
			if (dataValue)
			{
				var specCoord = this._spectrumSectionDataValueToSpectrumCoord(dataValue, section, isReversedAxis);
				return specCoord && this.translateCoordFromSpectrum(specCoord, toCoordSys);
			}
		}
		return null;
	},
	/** @private */
	_spectrumSectionDataValueToSpectrumCoord: function(dataValue, dataSection, isReversedAxies)
	{
		var indepVarSymbols = dataSection.getLocalVarSymbolsOfDependency(Kekule.VarDependency.INDEPENDENT);
		var depVarSymbols = dataSection.getLocalVarSymbolsOfDependency(Kekule.VarDependency.DEPENDENT);
		var retrieveFirstValueOfSymbols = function(dataValue, symbols)
		{
			for (var i = 0, l = symbols.length; i < l; ++i)
			{
				var v = dataValue[symbols[i]]
				if (Kekule.ObjUtils.notUnset(v))
					return v;
			}
			return null;
		};
		var indepValue = retrieveFirstValueOfSymbols(dataValue, indepVarSymbols);
		var depValue = retrieveFirstValueOfSymbols(dataValue, depVarSymbols);
		var result = {
			'x': isReversedAxies? depValue: indepValue,
			'y': isReversedAxies? indepValue: depValue
		};
		return result;
	}
});

ClassEx.defineProp(Kekule.ChemWidget.Viewer, 'spectrumUiMarkers', {
	'dataType': DataType.HASH,
	'serializable': false,
	'setter': null,
	'getter': function()
	{
		var result = this.getPropStoreFieldValue('spectrumUiMarkers');
		if (!result)
		{
			result = {};
			this.setPropStoreFieldValue('spectrumUiMarkers', result);
		}
		return result;
	}
});

ClassEx.extend(Kekule.ChemWidget.Viewer, {
	/** @private */
	createShapeBasedSpectrumUiMarker: function(markerName)
	{
		var result = this.createShapeBasedMarker(null, null, false);
		this.getSpectrumUiMarkers()[markerName] = result;
		return result;
	},
	/** @private */
	createTextBasedSpectrumUiMarker: function(markerName)
	{
		var result = this.createTextBasedMarker(null, null, null, false);
		this.getSpectrumUiMarkers()[markerName] = result;
		return result;
	},
	/** @private */
	_finalizeSpectrumUiMarkers: function()
	{
		var markers = this.getSpectrumUiMarkers();
		var keys = Kekule.ObjUtils.getOwnedFieldNames(markers);
		for (var i = 0, l = keys.length; i < l; ++i)
		{
			markers[keys[i]].finalize();
		}
		this.setPropStoreFieldValue('spectrumUiMarkers', undefined);
	},
	/** @private */
	getSpectrumUiMarker: function(markerName, autoCreate)
	{
		var result = this.getSpectrumUiMarkers()[markerName];
		if (!result && autoCreate)
		{
			// create new one automatically
			var textBased = markerName.indexOf('DataDetail') >= 0;
			result = textBased? this.createTextBasedSpectrumUiMarker(markerName): this.createShapeBasedSpectrumUiMarker(markerName);
			this.getSpectrumUiMarkers()[markerName] = result;
		}
		return result;
	}
});

// extend the Viewer widget
ClassEx.extendMethods(Kekule.ChemWidget.Viewer, {
	/** @ignore */
	doFinalize: function($origin)
	{
		this._finalizeSpectrumUiMarkers();
		$origin();
	},
	/** @private */
	_createSpectrumView: function($origin)
	{
		return this.fetchSubView(this.getChemObj(), Kekule.ChemWidget.Viewer.SpectrumSubView);
		//return new Kekule.ChemWidget.Viewer.SpectrumView(this);
	},
	/**
	 * Check if the viewer loaded only a spectrum.
	 * @returns {Bool}
	 * @private
	 */
	_isDisplayingSingleSpectrum: function($origin)
	{
		var obj = this.getChemObj();
		return !!(obj && obj instanceof Kekule.Spectroscopy.Spectrum);
	},

	/**
	 * Returns a sub view for target spectrum.
	 * @param {Kekule.Spectroscopy.Spectrum} target
	 * @returns {Kekule.ChemWidget.Viewer.SpectrumSubView}
	 */
	getSpectrumView: function($origin, target)
	{
		return this.fetchSubView(target || this.getChemObj(), Kekule.ChemWidget.Viewer.SpectrumSubView);
	},
	/**
	 * Check if the loaded object should be displayed in spectrum mode.
	 * @returns {Bool}
	 */
	isInSpectrumMode: function($origin)
	{
		if (!Kekule.Spectroscopy || !Kekule.Spectroscopy.Spectrum)
			return false;
		else
			return (this.getRenderType() === Kekule.Render.RendererType.R2D)
				&& this.getDisplayerConfigs().getSpectrumViewConfigs().getActualEnableSpectrumMode()
				&& this._isDisplayingSingleSpectrum();
	},
	/**
	 * Check if local spectrum mode is enabled in this viewer.
	 * @returns {Bool}
	 */
	enableLocalSpectrumMode: function($origin)
	{
		if (!Kekule.Spectroscopy || !Kekule.Spectroscopy.Spectrum)
			return false;
		else
			return (this.getRenderType() === Kekule.Render.RendererType.R2D)
				&& this.getDisplayerConfigs().getSpectrumViewConfigs().getActualEnableLocalSpectrumMode();
	},
	/**
	 * Check if the viewer is in spectrum or local spectrum mode.
	 * @returns {Bool}
	 */
	enableSpectrumInteraction: function($origin)
	{
		return this.isInSpectrumMode() || this.enableLocalSpectrumMode();
	},
	/** @ignore */
	getEnableUiContext: function($origin)
	{
		return true;
	},
	/** @ignore */
	allowAutoSize: function($origin)
	{
		if (this.isInSpectrumMode())  // autoSize should be disabled in spectrum view
			return false;
		else
			return $origin();
	},
	/** @ignore */
	getActualDrawOptions: function($origin)
	{
		var ops = $origin();
		if (this.isInSpectrumMode() && this.getSpectrumView())
		{
			var result = Object.create(ops);
			if (Kekule.ObjUtils.isUnset(ops.retainAspect))
				result.retainAspect = false;
			// force spectrum to fit the client area of viewer
			//result.autoSize = false;
			result.autofit = true;
			return result;
		}
		else
			return ops;
	},
	/** @ignore */
	doLoad: function($origin, chemObj)
	{
		if (this.isInSpectrumMode())
		{
			var sview = this.getSpectrumView();
			if (sview)
				sview.resetView();
			/*
			var spectrumIaController = this.getIaController('spectrum');
			if (!spectrumIaController)
				this.addIaController('spectrum', new Kekule.ChemWidget.SpectrumViewerBasicInteractionController(this), true);
			else
				this.setDefIaControllerId('spectrum');
			*/
		}
		/*
		else   // exit spectrum view, use the default IA controller
			//this.setDefIaControllerId('default');
			this.setDefIaControllerId('spectrum');
		*/
		return $origin(chemObj);
	},
	/* @ignore */
	/*
	chemObjRendered: function($origin, chemObj, renderOptions)
	{
		if (this.isInSpectrumMode())
		{
			var sview = this.getSpectrumView();
			sview.setPropStoreFieldValue('isSpectrumViewWithReversedAxises', !!renderOptions.spectrum_reversedAxises);
		}
		return $origin(chemObj, renderOptions);
	},
	*/
	/** @ignore */
	_repaintCore: function($origin, overrideOptions)
	{
		var isInSpectrumMode = this.isInSpectrumMode();
		var enableLocalSpectrumMode = this.enableLocalSpectrumMode();
		if (isInSpectrumMode || enableLocalSpectrumMode)
		{
			var ops = Object.create(overrideOptions || {});
			ops._spectrum_render_enable_sub_bounds = true;
			//var sview = this.getSpectrumView();
			//if (sview)
			if (isInSpectrumMode)
			{
				var configs = this.getDisplayerConfigs().getSpectrumViewConfigs();
				ops.spectrum_axisLabelFontSizeMin = configs.getSpectrumAxisLabelFontSizeMin(); // 15;
				ops.spectrum_axisLabelFontSizeMax = configs.getSpectrumAxisLabelFontSizeMax(); // 35;
				ops.spectrum_axisScaleLabelFontSizeFixed = configs.getSpectrumAxisLabelFontSizeFixed();  //15;
				//sview.applyToRenderOptions(ops);
			}
			return $origin(ops);
		}
		else
			return $origin(overrideOptions);
	},
	/** @ignore */
	getCurrZoom: function($origin)
	{
		if (this.isInSpectrumMode() && this.getSpectrumView())
		{
			return this.getSpectrumView().getViewportZoomInfo().zoom;
		}
		else
			return $origin();
	},
	/** @ignore */
	zoomTo: function($origin, value, suspendRendering, zoomCenterCoord)
	{
		if (this.isInSpectrumMode())
		{
			var sview = this.getSpectrumView();
			if (sview)
			{
				var clientBox = sview.getClientScreenBox();
				var currViewportRange = sview.getViewportRange(Kekule.VarDependency.INDEPENDENT);
				var oldRangeValue = currViewportRange.rangeTo - currViewportRange.rangeFrom;
				var newRangeValue = 1 / value;
				var rangeDelta = newRangeValue - oldRangeValue;
				var fixedPointRatio = zoomCenterCoord ? ((zoomCenterCoord.x - clientBox.x1) / (clientBox.x2 - clientBox.x1)) : 0.5;
				var newRangeFrom = currViewportRange.rangeFrom - rangeDelta * fixedPointRatio;
				var newRangeTo = currViewportRange.rangeTo + rangeDelta * (1 - fixedPointRatio);
				sview.setViewportRange(Kekule.VarDependency.INDEPENDENT, newRangeFrom, newRangeTo);
				if (!suspendRendering)
					this.geometryOptionChanged();
			}
			else
				$origin(value, suspendRendering, zoomCenterCoord);
		}
		else
			$origin(value, suspendRendering, zoomCenterCoord);
		return this;
	},
	/** @ignore */
	resetZoom: function($origin, zoomCenterCoord)
	{
		if (this.isInSpectrumMode())
		{
			var sview = this.getSpectrumView();
			if (sview)
			{
				sview.resetViewportRange();
				//this.geometryOptionChanged();
				return this;
			}
			else
				return $origin(zoomCenterCoord);
		}
		else
			return $origin(zoomCenterCoord);
	},
	/** @ignore */
	resetDisplay: function($origin)
	{
		if (this.isInSpectrumMode())
		{
			var sview = this.getSpectrumView();
			if (sview)
				sview.resetView();
		}
		return $origin();  // this.geometryOptionChanged() will be called here
	}
});

/** @private */
Kekule.ChemWidget.Viewer.SpectrumSubView.UiMarker = {
	DATA_POINT: 1,
	DATA_DETAIL: 2,
	PEAK:	4
};
var SVM = Kekule.ChemWidget.Viewer.SpectrumSubView.UiMarker;

ClassEx.defineProp(Kekule.ChemWidget.ViewerBasicInteractionController, 'spectrumUiMarkers', {
	'dataType': DataType.HASH,
	'serializable': false,
	'setter': null,
	'getter': function()
	{
		return this.getViewer().getSpectrumUiMarkers();
	}
});

/*
ClassEx.defineProp(Kekule.ChemWidget.ViewerBasicInteractionController, 'spectrumCurrDataPointMarker', {
	'dataType': 'Kekule.ChemWidget.AbstractUIMarker',
	'serializable': false,
	'getter': function()
	{
		var result = this.getPropStoreFieldValue('spectrumCurrDataPointMarker');
		if (!result)
		{
			result = this.createSpectrumCurrDataPointMarker();
			this.setPropStoreFieldValue('spectrumCurrDataPointMarker', result);
		}
		return result;
	}
});
ClassEx.defineProp(Kekule.ChemWidget.ViewerBasicInteractionController, 'spectrumCurrDataPointDetailMarker', {
	'dataType': 'Kekule.ChemWidget.AbstractUIMarker',
	'serializable': false,
	'getter': function()
	{
		var result = this.getPropStoreFieldValue('spectrumCurrDataPointDetailMarker');
		if (!result)
		{
			result = this.createSpectrumCurrDataPointDetailMarker();
			this.setPropStoreFieldValue('spectrumCurrDataPointDetailMarker', result);
		}
		return result;
	}
});
*/

ClassEx.extend(Kekule.ChemWidget.ViewerBasicInteractionController, {
	/** @private */
	getSpectrumUiMarker: function(markerName, autoCreate)
	{
		return this.getViewer().getSpectrumUiMarker(markerName, autoCreate);
	},

	/** @private */
	_setSpectrumUiMarkersVisible: function(visible, updateRenderer)
	{
		var viewer = this.getViewer();
		var pointMarker = this.getSpectrumUiMarker('hotTrackDataPoint', visible); //this.getSpectrumCurrDataPointMarker();
		var detailMarker = this.getSpectrumUiMarker('hotTrackDataDetail', visible);  //this.getSpectrumCurrDataPointDetailMarker();
		if (visible)
		{
			if (pointMarker)
				viewer.showUiMarker(pointMarker, false);
			if (detailMarker)
				viewer.showUiMarker(detailMarker, false);
		}
		else
		{
			if (pointMarker)
				viewer.hideUiMarker(pointMarker, false);
			if (detailMarker)
				viewer.hideUiMarker(detailMarker, false);
		}
		if (updateRenderer)
			viewer.repaintUiMarker();
	},
	/** @private */
	hideSpectrumUiMarkers: function(updateRenderer)
	{
		this._setSpectrumUiMarkersVisible(false, updateRenderer);
	},
	/** @private */
	showSpectrumUiMarkers: function(updateRenderer)
	{
		this._setSpectrumUiMarkersVisible(true, updateRenderer);
	},

	/** @private */
	_getSpectrumObjAtScreenCoord: function(coord)
	{
		//var coord = this.
		var viewer = this.getViewer();
		var boundObj = viewer.getTopmostBasicObjectAtCoord(coord);
		return (boundObj instanceof Kekule.Spectroscopy.Spectrum)? boundObj: null;
	},
	/** @private */
	getActiveSpectrumViewAtScreenCoord: function(screenCoord)
	{
		var result;
		var viewer = this.getViewer();
		if (viewer.enableSpectrumInteraction())
		{
			var currSpectrum = this._getSpectrumObjAtScreenCoord(screenCoord);
			if (currSpectrum)
			{
				result = viewer.getSpectrumView(currSpectrum);
			}
		}
		return result;
	},

	/** @private */
	isTransformingSpectrum: function()
	{
		return !!this._transformInfo.currSpectrum;
	}
});

// Extend the ViewerBasicInteractionController to enable the move/zoom interactions of spectrum in viewer
ClassEx.extendMethods(Kekule.ChemWidget.ViewerBasicInteractionController, {
	/** @ignore */
	doFinalize: function($origin)
	{
		this._finalizeSpectrumUiMarkers();
		$origin();
	},

	/** @ignore */
	_beginInteractTransformAtCoord: function($origin, screenX, screenY, clientX, clientY, htmlEvent, pointerId)
	{
		//this.tryApplySuper('_beginInteractTransformAtCoord', [screenX, screenY, clientX, clientY, htmlEvent]);
		$origin(screenX, screenY, clientX, clientY, htmlEvent, pointerId);
		/*
		//console.log('begin interaction');
		var viewer = this.getViewer();
		//if (viewer.isInSpectrumMode())
		if (viewer.enableSpectrumInteraction())
		{
			var currSpectrum = this._getSpectrumObjAtScreenCoord(this._getEventMouseCoord(htmlEvent));
			//console.log('begin inter', currSpectrum);
			if (currSpectrum)
			{
				var sview = viewer.getSpectrumView(currSpectrum);
				if (sview)
				{
					this._transformInfo.currSpectrum = currSpectrum;
					this._transformInfo.initSpectrumViewportRanges = sview.fetchViewportRanges();
					//this._transformInfo.initSpectrumViewportRanges = viewer.getSpectrumView().fetchViewportRanges();
					this._updateSpectrumCurrDataPointMarker(null, null, false);
				}
				else
				{
					this._transformInfo.currSpectrum = undefined;
					this._transformInfo.initSpectrumViewportRanges = undefined;
				}
			}
		}
		*/
		var sview = this.getActiveSpectrumViewAtScreenCoord(this._getEventMouseCoord(htmlEvent));
		if (sview)
		{
			var currSpectrum = sview.getSpectrum();
			this._transformInfo.currSpectrum = currSpectrum;
			this._transformInfo.initSpectrumViewportRanges = sview.fetchViewportRanges();
			//this._transformInfo.initSpectrumViewportRanges = viewer.getSpectrumView().fetchViewportRanges();
			this.hideSpectrumUiMarkers(true);
		}
		else
		{
			this._transformInfo.currSpectrum = undefined;
			this._transformInfo.initSpectrumViewportRanges = undefined;
		}
	},
	/** @ignore */
	_endInteractTransform: function($origin)
	{
		this._transformInfo.currSpectrum = undefined;
		this._transformInfo.initSpectrumViewportRanges = undefined;
		//this.tryApplySuper('_endInteractTransform');
		$origin();
	},

	/** @ignore */
	moveByXYDistance: function($origin, currX, currY)
	{
		var viewer = this.getViewer();
		//if (viewer.isInSpectrumMode())
		if (viewer.enableSpectrumInteraction())
		{
			var info = this._transformInfo;
			if (info && info.isTransforming && (!info.calculating))
			{
				/*
				if (viewer.getRenderType() === Kekule.Render.RendererType.R3D)
					return;
				*/
				var sview = info.currSpectrum && viewer.getSpectrumView(info.currSpectrum);
				if (sview)
				{
					info.calculating = true;
					try
					{
						var currCoord = {'x': currX, 'y': currY};
						var delta = Kekule.CoordUtils.substract(currCoord, info.transformInitCoord);
						var clientBox = sview.getClientScreenBox();
						var moveRatios = [
							delta.x / (clientBox.x2 - clientBox.x1),  // x
							-delta.y / (clientBox.y2 - clientBox.y1)  // y
						];
						var reversedAxises = sview.getIsSpectrumWithReversedAxises();
						var varDependencies = reversedAxises ?
							[Kekule.VarDependency.DEPENDENT, Kekule.VarDependency.INDEPENDENT] :
							[Kekule.VarDependency.INDEPENDENT, Kekule.VarDependency.DEPENDENT];

						viewer.beginUpdate();
						try
						{
							for (var i = 0, l = moveRatios.length; i < l; ++i)
							{
								var moveRatio = moveRatios[i];
								var viewportRange = info.initSpectrumViewportRanges[varDependencies[i]] || {};
								var viewportRangeFrom = viewportRange.rangeFrom || 0;
								var viewportRangeTo = viewportRange.rangeTo || 1;
								var rangeDelta = (viewportRangeTo - viewportRangeFrom) * moveRatio;
								sview.setViewportRange(varDependencies[i], viewportRangeFrom - rangeDelta, viewportRangeTo - rangeDelta);
							}
						}
						finally
						{
							viewer.endUpdate();
						}
						//viewer._repaintCore();

						info.lastCoord = currCoord;
					} finally
					{
						info.calculating = false;
					}
				}
				else
					//return this.tryApplySuper('moveByXYDistance', [currX, currY]);
					return $origin(currX, currY);
			}
		}
		else
			//return this.tryApplySuper('moveByXYDistance', [currX, currY]);
			return $origin(currX, currY);
	},

	/** @private */
	doZoomSpectrumViewer: function($origin, spectrum, delta, zoomCenterCoord, directions)
	{
		var v = this.getViewer();
		//if (v.isInSpectrumMode())
		if (v.enableSpectrumInteraction())
		{
			var sview = v.getSpectrumView(spectrum);
			if (sview)
				sview.zoomViewportByDelta(delta, zoomCenterCoord, directions);
		}
	},

	/** @private */
	_mayNeedSpectrumDataHotTrack: function($origin, spectrumView, spectrumViewConfigs)
	{
		var spectrum = spectrumView.getSpectrum();
		var displayedDataModes = spectrumView.getDisplayedDataModes();
		var configs = spectrumViewConfigs;
		return configs && configs.getDataModeSpecifiedBoolConfigValueOfModeList('enableSpectrumDataHotTrackOnMode', displayedDataModes);
		/*
		return configs && (configs.getEnableSpectrumDataPointMarker() || configs.getEnableSpectrumDataPointDetailMarker()
			|| configs.getEnableSpectrumPeakHotTrack());
		*/
	},

	/** @private */
	_getSpectrumDataSelectCoordInflationRange: function($origin, screenCoord, spectrumViewConfigs)
	{
		var selectInflation = spectrumViewConfigs.getSpectrumDataPointSelectInflation();
		var coordDelta = {x: selectInflation, y: selectInflation};
		var screenCoords = [
			Kekule.CoordUtils.substract(screenCoord, coordDelta),
			Kekule.CoordUtils.add(screenCoord, coordDelta),
		];
		return screenCoords;
	},

	/** @private */
	doTrySelectSpectrumData: function($origin, screenCoord)
	{
		var viewer = this.getViewer();
		{
			var sview = this.getActiveSpectrumViewAtScreenCoord(screenCoord);
			if (sview)
			{
				var selectDataItemEx = null;
				var configs = viewer.getDisplayerConfigs().getSpectrumViewConfigs();
				if (configs.getDataModeSpecifiedBoolConfigValueOfModeList('enableSpectrumDataSelectOnMode', sview.getDisplayedDataModes()))
				{
					//var peakDataValue = null;
					var clientBox = sview.getClientScreenBox();
					if (Kekule.CoordUtils.isInsideBox(screenCoord, clientBox))
					{
						var screenCoords = this._getSpectrumDataSelectCoordInflationRange(screenCoord, configs);
						var spectrumDataValueResult = sview.calcSpectrumPrimaryDataValueInCoordRangeEx(screenCoords, Kekule.Render.CoordSystem.SCREEN);
						if (spectrumDataValueResult)  // do has the primary value need to be selected
						{
							var dataSection = spectrumDataValueResult.dataSection;
							var dataValue = spectrumDataValueResult.dataValue;

							/*
							if (dataValue && dataSection.isPeakSection() && configs.getDataModeSpecifiedConfigValue('enableSpectrumDataSelectOnMode', dataSection.getMode()))  // select peak
								peakDataValue = dataValue;
							*/

							selectDataItemEx = {'section': dataSection, 'dataValue': dataValue};
						}
					}
				}
				sview.setSelectedDataItemEx(selectDataItemEx);
			}
		}
	},
	/** @private */
	doTryHotTrackSpectrumData: function($origin, screenCoord)
	{
		var viewer = this.getViewer();
		var configs = viewer.getDisplayerConfigs().getSpectrumViewConfigs();
		var sview = this.getActiveSpectrumViewAtScreenCoord(screenCoord);
		if (sview)
		{
			//var spectrum = sview.getSpectrum();
			//var hotTrackElements = 0;
			var hotTrackDataItemEx = null;
			if (this._mayNeedSpectrumDataHotTrack(sview, configs))
			{
				// check if pointer moves over spectrum client box and need to displaying the data point marker
				var clientBox = sview.getClientScreenBox();
				if (Kekule.CoordUtils.isInsideBox(screenCoord, clientBox))
				{
					/*
					var selectInflation = configs.getSpectrumDataPointSelectInflation();
					var coordDelta = {x: selectInflation, y: selectInflation};
					var screenCoords = [
						Kekule.CoordUtils.substract(screenCoord, coordDelta),
						Kekule.CoordUtils.add(screenCoord, coordDelta),
					];
					*/
					var screenCoords = this._getSpectrumDataSelectCoordInflationRange(screenCoord, configs);
					var spectrumDataValueResult = sview.calcSpectrumPrimaryDataValueInCoordRangeEx(screenCoords, Kekule.Render.CoordSystem.SCREEN);
					if (spectrumDataValueResult)  // do has the primary value need to be hot tracked first
					{
						var dataSection = spectrumDataValueResult.dataSection;
						var dataValue = spectrumDataValueResult.dataValue;

						hotTrackDataItemEx = {'section': dataSection, 'dataValue': dataValue};
					}
				}
			}
			sview.setHotTrackedDataItemEx(hotTrackDataItemEx);
		}
	},

	/** @private */
	react_click: function($origin, e)
	{
		if (this.needReactEvent(e) && !this.isTransformingSpectrum())
		{
			var screenCoord = this._getEventMouseCoord(e);
			this.doTrySelectSpectrumData(screenCoord);
		}
		// return $origin(e);  // there is no click even handler in base class, so we can not call $origin here
	},
	/** @private */
	react_dblclick: function($origin, e)
	{
		if (this.needReactEvent(e))
		{
			var spectrumReset = false;
			var sview = this.getActiveSpectrumViewAtScreenCoord(this._getEventMouseCoord(e));
			if (sview)
			{
				var viewer = this.getViewer();
				viewer.beginUpdate();
				try
				{
					if (sview)
					{
						sview.resetView();
						spectrumReset = true;
					}
				}
				finally
				{
					viewer.endUpdate();
				}
			}
			else
				$origin(e);
		}
	},
	/** @private */
	react_pointermove: function($origin, e)
	{
		if (this.needReactEvent(e) && !this.isTransformingSpectrum())
		{
			var screenCoord = this._getEventMouseCoord(e);
			this.doTryHotTrackSpectrumData(screenCoord);
		}
		return $origin(e);
	},
	/** @private */
	react_pointerleave: function($origin, e)
	{
		this.hideSpectrumUiMarkers(true);
		return $origin(e);
	},
	/** @private */
	react_mousewheel: function($origin, e)
	{
		if (this.needReactEvent(e))
		{
			var sview = this.getActiveSpectrumViewAtScreenCoord(this._getEventMouseCoord(e));
			if (sview)
			{
				var viewer = this.getViewer();
				var spectrum = sview.getSpectrum();
				//this._updateSpectrumCurrDataPointMarker(null, null, false);
				this.hideSpectrumUiMarkers(true);

				var configs = viewer.getDisplayerConfigs().getSpectrumViewConfigs();
				var delta = e.wheelDeltaY || e.wheelDelta;
				if (delta)
					delta /= 120;
				//var centerCoord = e.getOffsetCoord();
				var centerCoord = this._getEventMouseCoord(e);

				var directions = Kekule.ChemWidget.SpectrumViewUtils.getZoomDirectionsFromEvent(e, configs);
				this.doZoomSpectrumViewer(spectrum, delta, centerCoord, directions);
				e.preventDefault();
				return true;
			}
		}
		return $origin(e);
	}
});

ClassEx.extendMethods(Kekule.ChemWidget.ActionDisplayerZoomIn, {
	doExecute: function($origin, target, htmlEvent)
	{
		var viewer = this.getDisplayer();
		if (viewer.isInSpectrumMode && viewer.isInSpectrumMode())
		{
			var directions = Kekule.ChemWidget.SpectrumViewUtils.getZoomDirectionsFromEvent(htmlEvent, viewer.getDisplayerConfigs().getSpectrumViewConfigs());
			var sview = viewer.getSpectrumView();
			if (sview)
				sview.zoomViewportByDelta(1, null, directions);
			else
				$origin();
		}
		else
			$origin();
	}
});
ClassEx.extendMethods(Kekule.ChemWidget.ActionDisplayerZoomOut, {
	doExecute: function($origin, target, htmlEvent)
	{
		var viewer = this.getDisplayer();
		if (viewer.isInSpectrumMode && viewer.isInSpectrumMode())
		{
			var directions = Kekule.ChemWidget.SpectrumViewUtils.getZoomDirectionsFromEvent(htmlEvent, viewer.getDisplayerConfigs().getSpectrumViewConfigs());
			var sview = viewer.getSpectrumView();
			if (sview)
				sview.zoomViewportByDelta(-1, null, directions);
			else
				$origin();
		}
		else
			$origin();
	}
});


/** @private */
Kekule.ChemWidget.SpectrumViewUtils = {
	getZoomDirectionsFromEvent: function(htmlEvent, spectrumViewConfigs)
	{
		var KU = Kekule.Widget.KeyboardUtils;
		var modifierKeyParams = KU.getKeyParamsFromEvent(htmlEvent, true);
		var directions;
		if (KU.matchKeyParams(modifierKeyParams, KU.createModifierKeyParamsFromArray(spectrumViewConfigs.getSpectrumZoomSecondaryModifierKeys()), true))
			directions = ['y'];
		else if (KU.matchKeyParams(modifierKeyParams, KU.createModifierKeyParamsFromArray(spectrumViewConfigs.getSpectrumZoomBothModifierKeys()), true))
			directions = ['x', 'y'];
		else
			directions = ['x'];
		return directions;
	}
};

});

})();