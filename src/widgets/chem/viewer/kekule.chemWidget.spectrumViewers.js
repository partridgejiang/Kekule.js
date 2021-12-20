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

var ZU = Kekule.ZoomUtils;

Kekule.globalOptions.add('chemWidget.viewer', {
	enableSpectrumMode: true,
	enableLocalSpectrumMode: true
});

/**
 * Config class of spectrum view for {@link Kekule.ChemWidget.ChemObjDisplayer}.
 * @class
 * @augments Kekule.AbstractConfigs
 *
 * @property {Number} spectrumAxisLabelFontSizeMin The minimal font size to draw spectrum axis labels.
 * @property {Number} spectrumAxisLabelFontSizeMax The maximal font size to draw spectrum axis labels.
 * @property {Number} spectrumAxisLabelFontSizeFixed If this value is set, the spectrum axis labels will always be drawn in this size,
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

		this.defineProp('spectrumZoomPrimaryModifierKeys', {'dataType': DataType.ARRAY});
		this.defineProp('spectrumZoomSecondaryModifierKeys', {'dataType': DataType.ARRAY});
		this.defineProp('spectrumZoomBothModifierKeys', {'dataType': DataType.ARRAY});
	},
	/** @ignore */
	initPropDefValues: function()
	{
		this.tryApplySuper('initPropDefValues');
		this.setSpectrumZoomPrimaryModifierKeys([]);
		this.setSpectrumZoomSecondaryModifierKeys(['shift']);
		this.setSpectrumZoomBothModifierKeys(['alt']);
	},
	/** @ignore */
	initPropValues: function()
	{
		this.tryApplySuper('initPropValues');
		this.setEnableSpectrumMode(Kekule.globalOptions.chemWidget.viewer.enableSpectrumMode);
		this.setEnableLocalSpectrumMode(Kekule.globalOptions.chemWidget.viewer.enableLocalSpectrumMode);
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
		// whether the spectrum is displayed with reversed axises position in spectrum view
		this.defineProp('isSpectrumWithReversedAxises', {
			'dataType': DataType.BOOL,
			'serializable': false,
			//'getter': function() { return this.getViewer().getIsSpectrumViewWithReversedAxises(); },
			'setter': null,
			'getter': function()
			{
				var spectrum = this.getSpectrum();
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

	/**
	 * Reset the spectrum view settings.
	 */
	resetView: function()
	{
		this.resetViewportRange();
	}

	/*
	///////// spectrum coord transform methods ////////////
	contextCoordToSpectrum: function(coord)
	{

	},
	screenCoordToSpectrum: function(coord)
	{

	}
	*/
});

// extend the Viewer widget
ClassEx.extendMethods(Kekule.ChemWidget.Viewer, {
	/** @private */
	_createSpectrumView: function()
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
				&& this.getDisplayerConfigs().getSpectrumViewConfigs().getEnableSpectrumMode()
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
				&& this.getDisplayerConfigs().getSpectrumViewConfigs().getEnableLocalSpectrumMode();
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

// Extend the ViewerBasicInteractionController to enable the move/zoom interactions of spectrum in viewer
ClassEx.extendMethods(Kekule.ChemWidget.ViewerBasicInteractionController, {
	/** @private */
	_getSpectrumObjAtScreenCoord: function($origin, coord)
	{
		//var coord = this.
		var viewer = this.getViewer();
		var boundObj = viewer.getTopmostBasicObjectAtCoord(coord);
		return (boundObj instanceof Kekule.Spectroscopy.Spectrum)? boundObj: null;
	},

	/** @ignore */
	_beginInteractTransformAtCoord: function($origin, screenX, screenY, clientX, clientY, htmlEvent)
	{
		//this.tryApplySuper('_beginInteractTransformAtCoord', [screenX, screenY, clientX, clientY, htmlEvent]);
		$origin(screenX, screenY, clientX, clientY, htmlEvent);
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
				}
				else
				{
					this._transformInfo.currSpectrum = undefined;
					this._transformInfo.initSpectrumViewportRanges = undefined;
				}
			}
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
	react_dblclick: function($origin, e)
	{
		if (this.needReactEvent(e))
		{
			var spectrumReset = false;
			var viewer = this.getViewer();
			viewer.beginUpdate();
			try
			{
				if (viewer.enableSpectrumInteraction())
				{
					var spectrum = this._getSpectrumObjAtScreenCoord(this._getEventMouseCoord(e));
					if (spectrum)
					{
						var sview = viewer.getSpectrumView(spectrum)
						if (sview)
						{
							sview.resetView();
							spectrumReset = true;
						}
					}
				}
				if (!spectrumReset)
					$origin(e);
			}
			finally
			{
				viewer.endUpdate();
			}
		}
	},
	/** @private */
	react_mousewheel: function($origin, e)
	{
		var viewer = this.getViewer();

		//if (viewer.isInSpectrumMode())
		if (viewer.enableSpectrumInteraction())
		{
			if (this.needReactEvent(e))
			{
				var spectrum = this._getSpectrumObjAtScreenCoord(this._getEventMouseCoord(e));
				//console.log('on spectrum', spectrum, this._getEventMouseCoord(e, viewer.getDrawContextParentElem()));
				var sview = viewer.getSpectrumView(spectrum)
				if (sview)
				{
					var configs = viewer.getDisplayerConfigs().getSpectrumViewConfigs();
					var delta = e.wheelDeltaY || e.wheelDelta;
					if (delta)
						delta /= 120;
					var centerCoord = e.getOffsetCoord();

					var directions = Kekule.ChemWidget.SpectrumViewUtils.getZoomDirectionsFromEvent(e, configs);
					this.doZoomSpectrumViewer(spectrum, delta, centerCoord, directions);
					e.preventDefault();
					return true;
				}
			}
		}
		//else
		//return this.tryApplySuper('react_mousewheel', [e]);
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