/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /xbrowsers/kekule.x.js
 * requires /core/kekule.common.js
 * requires /widgets/kekule.widget.base.js
 * requires /widgets/kekule.widget.buttons.js
 * requires /widgets/kekule.widget.menus.js
 * requires /widgets/chem/kekule.chemWidget.base.js
 * requires /widgets/chem/kekule.chemWidget.viewers.js
 * requires /widgets/operation/kekule.actions.js
 * requires /widgets/commonCtrls/kekule.widget.buttons.js
 *
 * requires /localization/kekule.localize.widget.js
 */

(function(){

"use strict";

Kekule._registerAfterLoadSysProc(function(){

// the following code will be run after both spectroscopy and widget modules are loaded
if (!Kekule.ChemWidget || !Kekule.Spectroscopy)
	return;

var OU = Kekule.ObjUtils;
var AU = Kekule.ArrayUtils;
var PS = Class.PropertyScope;

Kekule.ChemWidget.ComponentWidgetNames = Object.extend(Kekule.ChemWidget.ComponentWidgetNames, {
	changeSpectrumSection: 'changeSpectrumSection',
	correlateSpectrumDataAndObject: 'correlateSpectrumDataAndObject',
});
var BNS = Kekule.ChemWidget.ComponentWidgetNames;

/** @ignore */
Kekule.globalOptions.add('chemWidget.spectrumInspector', {
	toolButtons: [
		BNS.loadData,
		BNS.saveData,
		BNS.changeSpectrumSection,
		//BNS.correlateSpectrumDataAndObject,
		BNS.zoomIn, BNS.zoomOut,
		BNS.reset,
		BNS.copy,
		BNS.config
	],
	assocViewerToolButtons: [
		BNS.saveData,
		BNS.copy
	],
	'assocViewerSize': '25%',
	'enableToolbar': true,
	'enableDirectInteraction': true,
	'enableTouchInteraction': true,
	'enableGestureInteraction': false
});


/** @ignore */
Kekule.ChemWidget.HtmlClassNames = Object.extend(Kekule.ChemWidget.HtmlClassNames, {
	SPECTRUM_INSPECTOR: 'K-SpectrumInspector',
	SPECTRUM_INSPECTOR_ASSOC_LEADING: 'K-SpectrumInspector-AssocLeading',
	SPECTRUM_INSPECTOR_ASSOC_TAILING: 'K-SpectrumInspector-AssocTailing',
	SPECTRUM_INSPECTOR_IN_EDITING: 'K-SpectrumInspector-Editing',
	SPECTRUM_INSPECTOR_CLIENT: 'K-SpectrumInspector-Client',
	SPECTRUM_INSPECTOR_CLIENT_COMPONENT_HOLDER: 'K-SpectrumInspector-ClientComponentHolder',
	SPECTRUM_INSPECTOR_CLIENT_COMPONENT_HOLDER_SPECTRUM_VIEWER: 'K-SpectrumInspector-ClientComponentHolder-SpectrumViewer',
	SPECTRUM_INSPECTOR_CLIENT_COMPONENT_HOLDER_ASSOC_VIEWER: 'K-SpectrumInspector-ClientComponentHolder-AssocViewer',
	SPECTRUM_INSPECTOR_CLIENT_COMPONENT_HOLDER_MODIFIER_PANEL: 'K-SpectrumInspector-ClientComponentHolder-ModifierPanel',
	SPECTRUM_INSPECTOR_CLIENT_COMPONENT_HOLDER_HIDDEN_CANVAS: 'K-SpectrumInspector-ClientComponentHolder-HiddenCanvas',
	SPECTRUM_INSPECTOR_SPECTRUM_VIEWER: 'K-SpectrumInspector-SpectrumViewer',
	SPECTRUM_INSPECTOR_ASSOC_VIEWER: 'K-SpectrumInspector-AssocViewer',

	SPECTRUM_INSPECTOR_MENU_ITEM_SPECTRUM: 'K-SpectrumInspector-MenuItem-Spectrum',
	SPECTRUM_INSPECTOR_MENU_ITEM_SPECTRUM_DATASECTION: 'K-SpectrumInspector-MenuItem-SpectrumDataSection',

	ACTION_SPECTRUM_INSPECTOR_CHANGE_SECTION: 'K-SpectrumInspector-Change-Section',
	ACTION_SPECTRUM_INSPECTOR_CORRELATOR: 'K-SpectrumInspector-Correlator',
});
var CNS = Kekule.Widget.HtmlClassNames;
var CCNS = Kekule.ChemWidget.HtmlClassNames;

/**
 * An widget to view the spectrum and its correlation molecules.
 * This widget containing two main child viewer widgets: spectrumViewer and assocViewer, where the later is used to display the correlated molecule of spectrum.
 * @class
 * @augments Kekule.ChemWidget.AbstractWidget
 *
 * @param {Variant} parentOrElementOrDocument
 * @param {Kekule.ChemObject} chemObj
 * @param {Int} renderType Display in 2D or 3D. Value from {@link Kekule.Render.RendererType}.
 * @param {Kekule.ChemWidget.ChemObjDisplayerConfigs} displayerConfigs Configs of current displayer.
 *
 * @property {Kekule.ChemWidget.Viewer} spectrumViewer The child viewer displaying spectrum. Readonly.
 * @property {Kekule.ChemWidget.Viewer} assocViewer The child viewer displaying molecule. Readonly.
 * @property {Kekule.ChemWidget.SpectrumCorrelationConnector} correlationConnector The child correlation connector to link spectrum and assoc viewer. Readonly.
 * @property {Bool} autoSyncUiMarkerStyles Whether change the hot track / select UI marker styles in {@link Kekule.ChemWidget.SpectrumInspector.assocViewer} to meet the styles in {@link Kekule.ChemWidget.SpectrumInspector.spectrumViewer}.
 * @property {Bool} autoShowHideAssocViewer If true, when the loaded spectrum has no correlated molecule, the {@link Kekule.ChemWidget.SpectrumInspector.assocViewer} will be automatically hidden.
 * @property {Int} assocViewerPosition The position of assoc viewer, can be set with value from {@link Kekule.Widget.Position}.
 * @property {String} assocViewerSize CSS value to set the size of assoc viewer, e.g. '33%', '15em'.
 * @property {Int} assocViewerVisualMode Value from {@link Kekule.ChemWidget.SpectrumInspector.AssocViewerVisualMode}, determinates whether the assoc viewer is visible.
 * @property {Kekule.ChemObject} chemObj Chem object loaded in inspector.
 *   When set this property, child spectrums in chemObj will be extracted and displayed in {@link Kekule.ChemWidget.SpectrumInspector.spectrumViewer}.
 * @property {Array} spectrums Spectrums extracted from {@link Kekule.ChemWidget.SpectrumInspector.chemObj}.
 * @property {Kekule.Spectroscopy.Spectrum} activeSpectrum Spectrum currently be displayed in {@link Kekule.ChemWidget.SpectrumInspector.spectrumViewer}.
 * @property {Int} activeSpectrumIndex The index of {@link Kekule.ChemWidget.SpectrumInspector.activeSpectrum} in {@link Kekule.ChemWidget.SpectrumInspector.spectrums}.
 * @property {Kekule.Spectroscopy.SpectrumDataSection} activeDataSection The child data section of {@link Kekule.ChemWidget.SpectrumInspector.activeSpectrum} currently be displayed in {@link Kekule.ChemWidget.SpectrumInspector.spectrumViewer}.
 * @property {int} activeDataSecrtionIndex The index of {@link Kekule.ChemWidget.SpectrumInspector.activeDataSection} in {@link Kekule.ChemWidget.SpectrumInspector.activeSpectrum}.
 * @property {String} backgroundColor Background color of both viewers inside this widget.
 *
 * @property {Bool} enableHotTrack Whether hot tracking is enabled in both {@link Kekule.ChemWidget.SpectrumInspector.spectrumViewer} and {@link Kekule.ChemWidget.SpectrumInspector.assocViewer}.
 * @property {Bool} enableSelect Whether selecting is enabled in both {@link Kekule.ChemWidget.SpectrumInspector.spectrumViewer} and {@link Kekule.ChemWidget.SpectrumInspector.assocViewer}.
 * @property {Bool} enableMultiSelect Whether multi selecting is enabled in both {@link Kekule.ChemWidget.SpectrumInspector.spectrumViewer} and {@link Kekule.ChemWidget.SpectrumInspector.assocViewer}.
 *
 * @property {Bool} enableDirectInteraction
 * @property {Bool} enableTouchInteraction
 * @property {Bool} enableGestureInteraction
 *
 * //@property {Bool} enableEdit
 * //@property {Bool} isEditing
 */
/**
 * Invoked when the a chem object (or null) is loaded into the spectrum inspector.
 * The spectrum inside this chem object will then be loaded in the child spectrum viewer.
 *   event param of it has two fields: {obj, spectrums}.
 * @name Kekule.ChemWidget.SpectrumInspector#load
 * @event
 */
/**
 * Invoked when the a spectrum (or null) is actually be loaded into the child spectrum viewer.
 *   event param of it has one fields: {spectrum}.
 * @name Kekule.ChemWidget.SpectrumInspector#loadSpectrum
 * @event
 */
/**
 * Invoked when the a molecule (or null) is actually be loaded into the child assoc viewer.
 *   event param of it has one fields: {obj}.
 * @name Kekule.ChemWidget.SpectrumInspector#loadAssoc
 * @event
 */
/**
 * Invoked when spectrum data items / molecule assignment objects are selected in inspector.
 *   event param of it has field: {assignmentDetails: array}.
 *   In the array, each item is a hash of {spectrum, dataSection, dataValue, assignments}.
 * @name Kekule.ChemWidget.SpectrumInspector#spectrumAssignmentsSelected
 * @event
 */
/**
 * Invoked when spectrum data items / molecule assignment objects are hot tracked in inspector.
 *   event param of it has field: {assignmentDetails: array}.
 *   In the array, each item is a hash of {spectrum, dataSection, dataValue, assignments}.
 * @name Kekule.ChemWidget.SpectrumInspector#spectrumAssignmentsHotTracked
 * @event
 */
Kekule.ChemWidget.SpectrumInspector = Class.create(Kekule.ChemWidget.AbstractWidget,
/** @lends Kekule.ChemWidget.SpectrumInspector# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.SpectrumInspector',
	/** @private */
	SPECTRUM_SELECT_MENU_SPECTRUM_FIELD: '__$spectrumIndex$__',
	/** @private */
	SPECTRUM_SELECT_MENU_SPECTRUM_DATA_SECTION_FIELD: '__$spectrumDataSectionIndex$__',
	/** @construct */
	initialize: function(parentOrElementOrDocument)
	{
		this._spectrumViewerSetChemObjOverwriteBind = this._spectrumViewerSetChemObjOverwrite.bind(this);
		this._spectrumViewerCreateToolButtonOverwriteBind = this._spectrumViewerCreateToolButtonOverwrite.bind(this);
		this._spectrumViewerGetSavingTargetObjOverwriteBind = this._spectrumViewerGetSavingTargetObjOverwrite.bind(this);
		this._reactChildViewerShowStateChangeBind = this._reactChildViewerShowStateChange.bind(this);
		this.setPropStoreFieldValue('autoSyncUiMarkerStyles', true);
		this.setPropStoreFieldValue('assocViewerVisualMode', AVVM.AUTO);
		this.tryApplySuper('initialize', [parentOrElementOrDocument]);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('spectrumViewer', {'dataType': 'Kekule.ChemWidget.Viewer', 'serializable': false, 'setter': null});
		this.defineProp('assocViewer', {'dataType': 'Kekule.ChemWidget.Viewer', 'serializable': false, 'setter': null});
		this.defineProp('correlationConnector', {'dataType': 'Kekule.ChemWidget.SpectrumCorrelationConnector', 'serializable': false, 'setter': null});
		this.defineProp('autoSyncUiMarkerStyles', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				if (value != this.getAutoSyncUiMarkerStyles())
				{
					this.setPropStoreFieldValue('autoSyncUiMarkerStyles', !!value);
					if (value)
						this.syncHotTrackAndSelectStylesBetweenViewers();
				}
			}
		});
		this.defineProp('assocViewerVisualMode', {'dataType': DataType.INT, 'enumSource': Kekule.ChemWidget.SpectrumInspector.AssocViewerVisualMode,
			'setter': function(value)
			{
				var old = this.getAssocViewerVisualMode();
				if (value !== old)
				{
					this.setPropStoreFieldValue('assocViewerVisualMode', value);
					this.doAssocViewerVisualModeChange(value, old);
				}
			}
		});
		this.defineProp('autoShowHideAssocViewer', {'dataType': DataType.BOOL, 'scope': Class.PropertyScope.PUBLIC,
			'getter': function()
			{
				return this.getAssocViewerVisualMode() === AVVM.AUTO;
			},
			'setter': function(value)
			{
				var bValue = !!value;
				if (bValue !== this.getAutoShowHideAssocViewer())
				{
					if (bValue)
						this.setAssocViewerVisualMode(AVVM.AUTO);
					else
					{
						var assocViewer = this.getAssocViewer();
						var currVisible = assocViewer && assocViewer.isShown();
						this.setAssocViewerVisualMode(currVisible ? AVVM.VISIBLE : AVVM.INVISIBLE);
					}
				}
			}
		});

		this.defineProp('assocViewerPosition', {'dataType': DataType.INT, 'enumSource': Kekule.Widget.Position,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('assocViewerPosition', value);
				this.doChangeAssocViewerPosition(value);
			}
		});
		this.defineProp('assocViewerSize', {'dataType': DataType.STRING,
			'getter': function()
			{
				var elems = this.getClientComponentHolderElems();
				var elem = elems && elems.assocViewer;
				return elem && this.getStyleProperty('flexBasis', elem);
			},
			'setter': function(value)
			{
				var elems = this.getClientComponentHolderElems();
				var elem = elems && elems.assocViewer;
				if (elem)
					this.setStyleProperty('flexBasis', value, elem);
			}
		});

		this.defineProp('chemObj', {'dataType': 'Kekule.ChemObject', 'serializable': false,
			'setter': function(value)
			{
				var oldObj = this.getPropStoreFieldValue('chemObj');
				this.setPropStoreFieldValue('chemObj', value);
				this.chemObjChanged(value, oldObj);
			}
		});
		this.defineProp('spectrums', {'dataType': DataType.ARRAY, 'serializable': false, 'setter': null,
			'getter': function()
			{
				return this.getPropStoreFieldValue('spectrums') || [];
			}
		});
		this.defineProp('activeSpectrum', {'dataType': DataType.OBJECT, 'serializable': false,
			'getter': function()
			{
				return this.getSpectrums()[this.getActiveSpectrumIndex()];
			},
			'setter': function(value)
			{
				var index = this.getSpectrums().indexOf(value);
				this.setActiveSpectrumIndex(index);
			}
		});
		this.defineProp('activeSpectrumIndex', {'dataType': DataType.INT, 'serializable': false,
			'setter': function(value)
			{
				var oldSpectrum = this.getActiveSpectrum();
				this.setPropStoreFieldValue('activeSpectrumIndex', value);
				var newSpectrum = this.getActiveSpectrum();
				this.activeSpectrumChanged(newSpectrum, oldSpectrum);
			}
		});
		this.defineProp('activeDataSection', {'dataType': DataType.OBJECT, 'serializable': false,
			'getter': function()
			{
				var spectrum = this.getActiveSpectrum();
				return spectrum && spectrum.getActiveDataSection();
			},
			'setter': function(value)
			{
				var spectrum = this.getActiveSpectrum();
				if (spectrum)
				{
					var index = spectrum.indexOfDataSection(value);
					if (index >= 0)
						this.setActiveDataSectionIndex(index);
				}
			}
		});
		this.defineProp('activeDataSectionIndex', {'dataType': DataType.INT, 'serializable': false,
			'setter': function(value)
			{
				var spectrum = this.getActiveSpectrum();
				if (spectrum)
				{
					var oldSection = this.getActiveDataSection();
					//this.setPropStoreFieldValue('activeSpectrumIndex', value);
					spectrum.setActiveDataSectionIndex(value);
					var newSection = spectrum.getActiveDataSection();
					if (oldSection != newSection)
						this.activeSpectrumDataSectionChanged(newSection, oldSection);
				}
			}
		});
		this.defineProp('spectrumViewportRanges', {
			'dataType': DataType.HASH, 'serializable': false,
			'getter': function()
			{
				var sview = this.getSpectrumSubView();
				//return (sview? sview.getViewportRanges(): this.getPropStoreFieldValue('spectrumViewportRanges')) || {};
				return sview && sview.getViewportRanges();
			},
			'setter': function(value)
			{
				var sview = this.getSpectrumSubView();
				if (sview)
				{
					sview.setViewportRanges(value);
					sview.applyToRenderOptions();
				}
				//this.setPropStoreFieldValue('spectrumViewportRanges', value);
			}
		});
		this.defineProp('backgroundColor', {'dataType': DataType.STRING, 'scope': PS.PUBLISHED,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('backgroundColor', value);
				var sviewer = this.getSpectrumViewer();
				if (sviewer)
					sviewer.setBackgroundColor(value);
				var aviewer = this.getAssocViewer();
				if (aviewer)
					aviewer.setBackgroundColor(value);
			}
		});

		// private
		this.defineProp('clientElem', {'dataType': DataType.OBJECT, 'serializable': false, 'setter': null, 'scope': Class.PropertyScope.PRIVATE});
		this.defineProp('clientComponentHolderElems', {'dataType': DataType.ARRAY, 'serializable': false, 'setter': null, 'scope': Class.PropertyScope.PRIVATE});
		// private spectrum/data section select menu
		this.defineProp('spectrumDataSectionSelectMenu', {'dataType': DataType.OBJECT, 'serializable': false, 'setter': null});

		this.defineProp('enableHotTrack', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				var bValue = !!value;
				this._applyEnablePropertyToChildViewerConfigs('enableHotTrack', bValue);
				this.setPropStoreFieldValue('enableHotTrack', bValue);
			}
		});
		this.defineProp('enableSelect', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				var bValue = !!value;
				this._applyEnablePropertyToChildViewerConfigs('enableSelect', bValue);
				this.setPropStoreFieldValue('enableSelect', bValue);
			}
		});
		this.defineProp('enableMultiSelect', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				var bValue = !!value;
				this._applyEnablePropertyToChildViewerConfigs('enableMultiSelect', bValue);
				this.setPropStoreFieldValue('enableMultiSelect', bValue);
			}
		});
		this.defineProp('enableDirectInteraction', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				var bValue = !!value;
				this._applyPropertyToChildViewerProperty('enableDirectInteraction', bValue);
				this.setPropStoreFieldValue('enableDirectInteraction', bValue);
			}
		});
		this.defineProp('enableTouchInteraction', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				var bValue = !!value;
				this._applyPropertyToChildViewerProperty('enableTouchInteraction', bValue);
				this.setPropStoreFieldValue('enableTouchInteraction', bValue);
			}
		});
		this.defineProp('enableGestureInteraction', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				var bValue = !!value;
				this._applyPropertyToChildViewerProperty('enableGesture', bValue);
				this.setPropStoreFieldValue('enableGesture', bValue);
			}
		});

		// TODO: edit is now implemented yet
		this.defineProp('enableEdit', {'dataType': DataType.BOOL, 'scope': PS.PRIVATE});
		this.defineProp('isEditing', {'dataType': DataType.BOOL, 'serializable': false, 'setter': null, 'scope': PS.PRIVATE});

		// properties from child widgets
		this._defineSubWidgetDelegatedProperties([
			'autoLoadCorrelatedMolecule',
			['enableOperationFromSpectrumToMolecule', 'fromSpectrumToMolecule'], ['enableOperationFromMoleculeToSpectrum', 'fromMoleculeToSpectrum']
		], 'correlationConnector');
		this._defineSubWidgetDelegatedProperties([
			'viewerConfigs', 'enableHotKey',
			'toolButtons', 'toolbar', 'enableToolbar',
			'toolbarPos', 'toolbarMarginVertical', 'toolbarMarginHorizontal',
			'toolbarEvokeModes', 'toolbarRevokeModes', 'toolbarRevokeTimeout', 'toolbarParentElem',
			'menuItems', 'menu',
			'caption', 'showCaption', 'captionPos', 'autoCaption', 'captionElem',

			'renderConfigs', 'enableLoadNewFile', 'allowedInputFormatIds', 'allowedOutputFormatIds', 'resetAfterLoad',
			//'backgroundColor', 'inheritedRenderStyles', 'inheritedRenderColor', 'inheritedRenderBackgroundColor', 'enableCustomCssProperties',
			'zoom', 'initialZoom', 'padding',
			'chemObjData', 'chemObjLoaded',
			['spectrumViewerConfigs', 'viewerConfigs'], ['spectrumViewerRenderConfigs', 'renderConfigs'],
			['spectrumViewerDrawOptions', 'drawOptions'], ['spectrumViewerbackgroundColor', 'backgroundColor']
			//['spectrumViewerDisplayed', 'displayed'], ['spectrumViewerVisible', 'visible']
		], 'spectrumViewer');

		this._defineSubWidgetDelegatedProperties([
			//['assocViewerDisplayed', 'displayed'], ['assocViewerVisible', 'visible'],
			['assocViewerConfigs', 'viewerConfigs'], ['assocViewerbackgroundColor', 'backgroundColor'],
			['assocViewerAllowedMolDisplayTypes', 'allowedMolDisplayTypes'],
			['assocViewerRenderConfigs', 'renderConfigs'],
			['assocViewerDrawOptions', 'drawOptions'], ['assocViewerAllowCoordBorrow', 'allowCoordBorrow'],
			['assocViewerAutoSize', 'autoSize'], ['assocViewerAutofit', 'autofit'], ['assocViewerAutoShrink', 'autoShrink']

			/*
			['viewerConfigs', 'assocViewerConfigs'],
			//'enableHotKey',
			['assocViewerToolButtons', 'toolButtons'], ['assocViewerEnableToolbar', 'enableToolbar'],  // 'toolbar', ,
			'toolbarPos', 'toolbarMarginVertical', 'toolbarMarginHorizontal',
			'toolbarEvokeModes', 'toolbarRevokeModes', 'toolbarRevokeTimeout', 'toolbarParentElem',
			'menuItems', 'menu',
			'caption', 'showCaption', 'captionPos', 'autoCaption', 'captionElem',
			'enableDirectInteraction', 'enableTouchInteraction', 'enableGesture',

			'renderConfigs', 'enableLoadNewFile', 'allowedInputFormatIds', 'allowedOutputFormatIds', 'resetAfterLoad',
			//'backgroundColor', 'inheritedRenderStyles', 'inheritedRenderColor', 'inheritedRenderBackgroundColor', 'enableCustomCssProperties',
			'zoom', 'initialZoom', 'padding',
			'chemObjData', 'chemObjLoaded',
			*/
		], 'assocViewer');
		//this._defineSubWidgetDelegatedMethods([], 'spectrumViewer');
	},
	/** @ignore */
	initPropValues: function()
	{
		this.tryApplySuper('initPropValues');
		this.setEnableHotTrack(true)
			.setEnableSelect(true)
			.setEnableMultiSelect(false)
			.setUseCornerDecoration(true);
		var oneOf = Kekule.oneOf;
		var options = Kekule.globalOptions.get('chemWidget.spectrumInspector') || {};
		this.setEnableToolbar(oneOf(options.enableToolbar, true))
			.setEnableDirectInteraction(oneOf(options.enableDirectInteraction, true))
			.setEnableTouchInteraction(oneOf(options.enableTouchInteraction, true))
			.setEnableGestureInteraction(oneOf(options.enableGestureInteraction, true));
	},
	/** @private */
	doFinalize: function()
	{
		this._finalizeSubWidgets();
		this.tryApplySuper('doFinalize');
	},
	/** @private */
	_finalizeSubWidgets: function()
	{
		var correlationConnector = this.getCorrelationConnector();
		if (correlationConnector)
			correlationConnector.finalize();
		var dataSelectMenu = this.getSpectrumDataSectionSelectMenu();
		if (dataSelectMenu)
			dataSelectMenu.finalize();
		var assocViewer = this.getAssocViewer();
		if (assocViewer)
		{
			assocViewer.finalize();
		}
		var spectrumViewer = this.getSpectrumViewer();
		if (spectrumViewer)
		{
			spectrumViewer.finalize();
		}
	},
	/**
	 *  Defines methods directly calling a method of child widget.
	 *  The methodNames is a array, each item is either a simple string for the method name (same in this and targetWidget)
	 *  or an array of [methodNameForThis, methodNameInTarget].
	 *  @private
	 */
	_defineSubWidgetDelegatedMethods: function(methodNames, targetWidgetName)
	{
		if (!targetWidgetName)
			targetWidgetName = 'spectrumViewer'
		var proto = ClassEx.getPrototype(this.getClass());
		var methodName, targetMethodName;
		for (var i = 0, l = methodNames.length; i < l; ++i)
		{
			var item = methodNames[i];
			if (AU.isArray(item))
			{
				methodName = item[0];
				targetMethodName = item[1];
			}
			else
				methodName = item;
			if (!targetMethodName)
				targetMethodName = methodName;
			proto[methodName] = function()
			{
				var target = this.getPropValue(targetWidgetName);
				var result = target[targetMethodName].apply(target, arguments);
				if (result === target)   // fix for chain calling of methods
					result = this;
				return result;
			}
		}
	},
	/**
	 *  Defines properties directly reflecting properties of child widget.
	 *  The propNames is a array, each item is either a simple string for the property name (same in this and targetWidget)
	 *  or an array of [propertyNameForThis, propertyNameInTarget].
	 *  @private
	 */
	_defineSubWidgetDelegatedProperties: function(propNames, targetWidgetName)
	{
		if (!targetWidgetName)
			targetWidgetName = 'spectrumViewer';
		var targetWidgetPropInfo = this.getPropInfo(targetWidgetName);
		var targetWidgetClass = ClassEx.findClass(targetWidgetPropInfo.dataType);

		var self = this;
		var propName, targetPropName;
		for (var i = 0, l = propNames.length; i < l; ++i)
		{
			var item = propNames[i];
			targetPropName = null;
			if (AU.isArray(item))
			{
				propName = item[0];
				targetPropName = item[1];
			}
			else
				propName = item;
			if (!targetPropName)
				targetPropName = propName;
			(function(targetWidgetClass, propName, targetPropName){
				var targetPropInfo = ClassEx.getPropInfo(targetWidgetClass, targetPropName);
				var propOptions = Object.create(targetPropInfo);
				propOptions.getter = null;
				propOptions.setter = null;
				propOptions.serializable = false;
				//console.log(targetPropInfo);
				if (targetPropInfo.getter)
				{
					propOptions.getter = function()
					{
						//console.log('getter', targetWidgetName, targetPropName, self);
						var target = this.getPropValue(targetWidgetName);
						return target? target.getPropValue(targetPropName): undefined;
					};
				}
				if (targetPropInfo.setter)
				{
					propOptions.setter = function(value)
					{
						var target = this.getPropValue(targetWidgetName);
						if (target)
							target.setPropValue(targetPropName, value);
					}
				}
				self.defineProp(propName, propOptions);
			})(targetWidgetClass, propName, targetPropName);
		}
	},

	/** @ignore */
	doObjectChange: function(modifiedPropNames)
	{
		var result = this.tryApplySuper('doObjectChange', [modifiedPropNames]);
		// sync some properties of spectrum and assoc viewers
		var assocViewer = this.getAssocViewer();
		if (assocViewer)
		{
			var candicateSyncPropNames = ['toolbarEvokeModes', 'toolbarRevokeModes', 'toolbarRevokeTimeout', 'enableToolbar', 'enableHotKey'];
			var syncPropNames = AU.intersect(modifiedPropNames, candicateSyncPropNames);
			for (var i = 0, l = syncPropNames.length; i < l; ++i)
			{
				assocViewer.setPropValue(syncPropNames[i], this.getPropValue(syncPropNames[i]));
			}
		}
		return result;
	},

	/** @private */
	loadPredefinedResDataToProp: function(propName, resData, success)
	{
		if (propName === 'chemObj')
		{
			if (success)
			{
				var chemObj = Kekule.IO.loadTypedData(resData.data, resData.resType, resData.resUri);
				this.setChemObj(chemObj);
			}
			else  // else, failed
			{
				Kekule.error(Kekule.$L('ErrorMsg.CANNOT_LOAD_RES_OF_URI') + resData.resUri || '');
			}
		}
	},

	/* @ignore */
	/*
	doGetResizable: function()
	{
		return this.getSpectrumViewer() && this.getSpectrumViewer().getResizable();
	},
	*/
	/* @ignore */
	/*
	doSetResizable: function(value)
	{
		var spectrumViewer = this.getSpectrumViewer();
		if (spectrumViewer)
			spectrumViewer.setResizable(value);
		var assocViewer = this.getAssocViewer();
		if (assocViewer)
			assocViewer.setResizable(value);
	},
	*/

	/** @ignore */
	doGetWidgetClassName: function()
	{
		return this.tryApplySuper('doGetWidgetClassName') + ' ' + CCNS.SPECTRUM_INSPECTOR;
	},

	/** @ignore */
	canUsePlaceHolderOnElem: function(elem)
	{
		// When using a img element with src image, it may contains the figure of spectrum
		var imgSrc = elem.getAttribute('src');
		return (elem.tagName.toLowerCase() === 'img') && (!!imgSrc);
	},
	/** @ignore */
	doSetElement: function(element)
	{
		var elem = element;
		if (elem)
		{
			var tagName = elem.tagName.toLowerCase();
			if (tagName === 'img')  // is an image placeholder element, need to use span to replace it
			{
				elem = Kekule.DomUtils.replaceTagName(elem, 'span');
			}
		}
		return this.tryApplySuper('doSetElement', [elem]);
	},

	/** @ignore */
	getChildrenHolderElement: function()
	{
		return this.getClientElem();
	},
	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('span');
		return result;
	},
	/** @ignore */
	doCreateSubElements: function(doc, rootElem)
	{
		var result = this.tryApplySuper('doCreateSubElements', [doc, rootElem]);

		var self = this;
		this._finalizeSubWidgets();

		var clientElem = this._createClientElem(doc, rootElem);
		this.setPropStoreFieldValue('clientElem', clientElem);
		result.push(clientElem);

		var clientComponentHolderElems = {
			'spectrumViewer': this._createClientComponentHolderElem(doc, clientElem, CCNS.SPECTRUM_INSPECTOR_CLIENT_COMPONENT_HOLDER_SPECTRUM_VIEWER),
			'modifierPanel': this._createClientComponentHolderElem(doc, clientElem, CCNS.SPECTRUM_INSPECTOR_CLIENT_COMPONENT_HOLDER_MODIFIER_PANEL),
			'assocViewer': this._createClientComponentHolderElem(doc, clientElem, CCNS.SPECTRUM_INSPECTOR_CLIENT_COMPONENT_HOLDER_ASSOC_VIEWER),
			'hiddenCanvas': this._createClientComponentHolderElem(doc, clientElem, CCNS.SPECTRUM_INSPECTOR_CLIENT_COMPONENT_HOLDER_HIDDEN_CANVAS)
		};
		this.setPropStoreFieldValue('clientComponentHolderElems', clientComponentHolderElems);

		this.setPropStoreFieldValue('spectrumDataSectionSelectMenu', this._createSpectrumDataSectionSelectMenu());

		var spectrumViewer = this._createSubSpectrumViewer(clientComponentHolderElems.spectrumViewer);
		this.setPropStoreFieldValue('spectrumViewer', spectrumViewer);
		spectrumViewer.setToolButtons(this.getDefaultToolBarButtons()).setEnableToolbar(true);  // important, create tool button need to be after spectrumViewer property is set

		var assocViewer = this._createSubAssocViewer(clientComponentHolderElems.assocViewer);
		this.setPropStoreFieldValue('assocViewer', assocViewer);
		var options = Kekule.globalOptions.get('chemWidget.spectrumInspector') || {};
		if (Kekule.ObjUtils.notUnset(options.assocViewerSize))
			this.setAssocViewerSize(options.assocViewerSize);

		this._applyAllEnablePropertiesToChildViewerConfigs();

		this._createCorrelationConnector(spectrumViewer, assocViewer);

		return result;
	},
	/** @private */
	_createClientElem: function(doc, parentElem)
	{
		var result = doc.createElement('div');
		result.className = CCNS.SPECTRUM_INSPECTOR_CLIENT;
		parentElem.appendChild(result);
		return result;
	},
	/** @private */
	_createClientComponentHolderElem: function(doc, parentElem, className)
	{
		var result = doc.createElement('div');
		var cssClass = CCNS.SPECTRUM_INSPECTOR_CLIENT_COMPONENT_HOLDER;
		if (className)
			cssClass += ' ' + className;
		result.className = cssClass;
		parentElem.appendChild(result);
		return result;
	},
	/** @private */
	_createCorrelationConnector: function(spectrumViewer, assocViewer)
	{
		var self = this;
		var correlationConnector = new Kekule.ChemWidget.SpectrumCorrelationConnector(spectrumViewer, assocViewer);
		correlationConnector.addEventListener('assignmentSelected', function(e){
			self.getSpectrumViewer().updateActions();  // when object is selected, the enable state of some actions may be changed
			self.invokeEvent('spectrumAssignmentSelected', {'assignmentDetails': e.assignmentDetails});
		});
		correlationConnector.addEventListener('assignmentHotTracked', function(e){
			self.invokeEvent('spectrumAssignmentHotTracked', {'assignmentDetails': e.assignmentDetails});
		});
		this.setPropStoreFieldValue('correlationConnector', correlationConnector);
	},
	/** @private */
	_createSubSpectrumViewer: function(parentElem)
	{
		var spectrumViewer = new Kekule.ChemWidget.Viewer2D(this, null, Kekule.Render.RendererType.R2D);
		this._overwriteSubSpectrumViewerMethods(spectrumViewer);
		spectrumViewer.setViewerConfigs(new Kekule.ChemWidget.ViewerConfigs());
		spectrumViewer.setPadding(20);  // TODO: currently fixed here
		spectrumViewer.setUseCornerDecoration(false).setBackgroundColor(this.getBackgroundColor());
		spectrumViewer.addClassName(CCNS.SPECTRUM_INSPECTOR_SPECTRUM_VIEWER);
		var self = this;
		spectrumViewer.addEventListener('showStateChange', this._reactChildViewerShowStateChangeBind);
		spectrumViewer.addEventListener('load', function(e){ if (e.widget === self.getSpectrumViewer())  self.invokeEvent('loadSpectrum', {'spectrum': e.obj}); });
		spectrumViewer.appendToElem(parentElem);
		return spectrumViewer;
	},
	/** @private */
	_overwriteSubSpectrumViewerMethods: function(spectrumViewer)
	{
		spectrumViewer.overwriteMethod('doSetChemObj', this._spectrumViewerSetChemObjOverwriteBind);
		spectrumViewer.overwriteMethod('createToolButton', this._spectrumViewerCreateToolButtonOverwriteBind);
		spectrumViewer.overwriteMethod('getSavingTargetObj', this._spectrumViewerGetSavingTargetObjOverwriteBind);
		spectrumViewer.overwriteMethod('getDefaultToolBarButtons', this.getDefaultToolBarButtons.bind(this));
	},
	/** @private */
	_createSubAssocViewer: function(parentElem)
	{
		var assocViewer = new Kekule.ChemWidget.Viewer(this);
		assocViewer.setViewerConfigs(new Kekule.ChemWidget.ViewerConfigs());
		var iaConfigs = assocViewer.getViewerConfigs().getInteractionConfigs();
		// TODO: currently fixed
		iaConfigs.setEnableBasicObjectHotTrack(true);
		iaConfigs.setEnableBasicObjectSelect(true);
		iaConfigs.setEnableBasicObjectMultiSelect(true);
		assocViewer.addClassName(CCNS.SPECTRUM_INSPECTOR_ASSOC_VIEWER);
		assocViewer.setAutoShrink(true);
		assocViewer.setToolButtons(Kekule.globalOptions.chemWidget.spectrumInspector.assocViewerToolButtons).setEnableToolbar(true);
		assocViewer.setUseCornerDecoration(false).setBackgroundColor(this.getBackgroundColor());
		assocViewer.setDisplayed(false);  // hide it at first
		assocViewer.addEventListener('load', this._reactAssocViewerLoad.bind(this));
		var self = this;
		assocViewer.addEventListener('showStateChange', this._reactChildViewerShowStateChangeBind)
		assocViewer.addEventListener('load', function(e){ if (e.widget === self.getAssocViewer()) self.invokeEvent('loadAssoc', {'obj': e.obj}); });
		assocViewer.appendToElem(parentElem);
		return assocViewer;
	},
	/** @private */
	_reactAssocViewerLoad: function(e)
	{
		var assocViewer = this.getAssocViewer();
		if (e.widget === assocViewer)
		{
			if (this.getAutoShowHideAssocViewer())
			{
				/*
				var visible = !!e.obj;
				assocViewer.setDisplayed(visible);
				Kekule.StyleUtils.setDisplay(this.getClientComponentHolderElems().assocViewer, visible);
				*/
				this.doAutoShowHideAssocViewer();
			}
		}
	},
	/** @private */
	doChangeAssocViewerPosition: function(newPosition)
	{
		var P = Kekule.Widget.Position;
		if ((newPosition & P.BOTTOM) || (newPosition & P.RIGHT))  // spectrum on left and molecule on right
		{
			this.removeClassName(CCNS.SPECTRUM_INSPECTOR_ASSOC_LEADING);
			this.addClassName(CCNS.SPECTRUM_INSPECTOR_ASSOC_TAILING);
		}
		else  // default, spectrum on right and molecule on left
		{
			this.removeClassName(CCNS.SPECTRUM_INSPECTOR_ASSOC_TAILING);
			this.addClassName(CCNS.SPECTRUM_INSPECTOR_ASSOC_LEADING);
		}
	},
	/** @private */
	getAssocViewerActualPosition: function()
	{
		var L = Kekule.Widget.Layout;
		var P = Kekule.Widget.Position;
		var layout = this.getLayout();
		var pos = this.getAssocViewerPosition();
		var result;
		if (layout === L.VERTICAL)
		{
			if (pos & P.BOTTOM || pos & P.RIGHT)
				result = P.BOTTOM;
			else
				result = P.TOP;
		}
		else  // horizontal
		{
			if (pos & P.BOTTOM || pos & P.RIGHT)
				result = P.RIGHT;
			else
				result = P.LEFT;
		}
		return result;
	},
	/** @private */
	doAssocViewerVisualModeChange: function(newValue, oldValue)
	{
		var assocViewer = this.getAssocViewer();
		if (assocViewer)
		{
			var M = Kekule.ChemWidget.SpectrumInspector.AssocViewerVisualMode;
			if (newValue === M.AUTO)
			{
				this.doAutoShowHideAssocViewer();
			}
			else if (newValue === M.VISIBLE || newValue === M.INVISIBLE)
			{
				var visible = (newValue === M.VISIBLE);
				assocViewer.setDisplayed(visible);
				if (visible)
					assocViewer.setVisible(visible);
			}
		}
	},
	/** @private */
	doAutoShowHideAssocViewer: function()
	{
		var assocViewer = this.getAssocViewer();
		if (assocViewer)
		{
			var displayed = !!assocViewer.getChemObj();
			//this.setAssocViewerDisplayed(displayed);
			assocViewer.setDisplayed(displayed);
			if (displayed)
				assocViewer.setVisible(displayed);
			Kekule.StyleUtils.setDisplay(this.getClientComponentHolderElems().assocViewer, displayed);
		}
	},
	/** @private */
	_reactChildViewerShowStateChange: function(e)
	{
		var isShown = e.isShown;
		var targetHolderElem;
		if (e.widget === this.getAssocViewer())
		{
			targetHolderElem = this.getClientComponentHolderElems().assocViewer;
		}
		else if (e.widget === this.getSpectrumViewer())
		{
			targetHolderElem = this.getClientComponentHolderElems().spectrumViewer;
		}
		//console.log('show change', e.widget === this.getAssocViewer(), e.widget === this.getSpectrumViewer(), targetHolderElem, isShown, e.target.getElement(), e.widget.getElement());
		if (targetHolderElem)
			Kekule.StyleUtils.setDisplay(targetHolderElem, !!isShown);
	},

	/** @private */
	_createSpectrumDataSectionSelectMenu: function()
	{
		var result = new Kekule.Widget.PopupMenu(this);
		result.addClassName(CNS.DYN_CREATED);
		result.setDisplayed(false);  // hide at first;
		result.addEventListener('execute', this._reactSpectrumDataSectionSelectMenuItemExecute.bind(this));
		return result;
	},
	/** @private */
	_reactSpectrumDataSectionSelectMenuItemExecute: function(e)
	{
		var menuItem = e.widget;
		var spectrum = menuItem[this.SPECTRUM_SELECT_MENU_SPECTRUM_FIELD];
		var dataSection = menuItem[this.SPECTRUM_SELECT_MENU_SPECTRUM_DATA_SECTION_FIELD];
		var viewer = this.getSpectrumViewer();
		viewer.beginUpdate();
		try
		{
			if (spectrum !== this.getActiveSpectrum())
			{
				spectrum.setActiveDataSection(dataSection || spectrum.getDataSectionAt(0));
				this.setActiveSpectrum(spectrum);  // reload the viewer when setting this
			}
			else
			{
				if (dataSection && dataSection !== this.getActiveDataSection())
					this.setActiveDataSection(dataSection);
			}
		}
		finally
		{
			viewer.endUpdate();
		}
	},
	/** @private */
	_refillSpectrumDataSectionSelectMenu: function()
	{
		//console.log('refill menu');
		var spectrums = this.getSpectrums();
		var menu = this.getSpectrumDataSectionSelectMenu();
		menu.clearMenuItems();
		for (var i = 0, ii = spectrums.length; i < ii; ++i)
		{
			var spectrum = spectrums[i];
			var sectionCount = spectrum.getDataSectionCount();
			var spectrumTexts = this._getSpectrumTexts(spectrum, i, ii, true);
			if (sectionCount <= 0)  // no data section, by pass
				continue;
			if (sectionCount <= 1)  // less than one section, merge the spectrum and section menu item together
			{
				var sectionTexts = this._getSpectrumDataSectionTexts(spectrum, spectrum.getDataSectionAt(0), 0, sectionCount, false);
				if (sectionTexts.caption)
					spectrumTexts.caption = spectrumTexts.caption + ' - ' + sectionTexts.caption;
				if (sectionTexts.hint)
					spectrumTexts.hint = spectrumTexts.hint + ' - ' + sectionTexts.hint;
				var menuItem = this._createSpectrumDataSectionSelectMenuSubItem(menu, spectrum, spectrum.getDataSectionAt(0), spectrumTexts.caption, spectrumTexts.hint, CCNS.SPECTRUM_INSPECTOR_MENU_ITEM_SPECTRUM);
				menu.appendMenuItem(menuItem);
			}
			else
			{
				// the spectrum item
				var menuItem = this._createSpectrumDataSectionSelectMenuSubItem(menu, spectrum, null, spectrumTexts.caption, spectrumTexts.hint, CCNS.SPECTRUM_INSPECTOR_MENU_ITEM_SPECTRUM);
				menu.appendMenuItem(menuItem);
				for (var j = 0; j < sectionCount; ++j)
				{
					var sectionTexts = this._getSpectrumDataSectionTexts(spectrum, spectrum.getDataSectionAt(j), j, sectionCount, true);
					                                                                                                                                                                                                                                     menuItem = this._createSpectrumDataSectionSelectMenuSubItem(menu, spectrum, spectrum.getDataSectionAt(j), sectionTexts.caption, sectionTexts.hint, CCNS.SPECTRUM_INSPECTOR_MENU_ITEM_SPECTRUM_DATASECTION);
					menu.appendMenuItem(menuItem);
				}
			}
		}
		this._updateSpectrumDataSectionSelectMenuCheckState();
		return menu;
	},
	/* @private */
	/*
	_checkSpectrumDataSectionSelectMenuSubItem: function(menuItem)
	{
		var menu = this.getSpectrumDataSectionSelectMenu();
		var subItems = menu.getMenuItems();
		for (var i = 0, l = subItems.length; i < l; ++i)
		{
			var item = subItems[i];
			item.setChecked(item === menuItem);
		}
	},
	*/
	/** @private */
	_updateSpectrumDataSectionSelectMenuCheckState: function()
	{
		var spectrum = this.getActiveSpectrum();
		var activeSection = spectrum && spectrum.getActiveDataSection();
		var menu = this.getSpectrumDataSectionSelectMenu();
		var subItems = menu.getMenuItems();
		for (var i = 0, l = subItems.length; i < l; ++i)
		{
			var item = subItems[i];
			var itemSpectrum = item[this.SPECTRUM_SELECT_MENU_SPECTRUM_FIELD];
			var itemSection = item[this.SPECTRUM_SELECT_MENU_SPECTRUM_DATA_SECTION_FIELD];
			if (itemSpectrum === spectrum && itemSection === activeSection)
				item.setChecked(true);
			else
				item.setChecked(false);
		}
	},
	/** @private */
	_createSpectrumDataSectionSelectMenuSubItem: function(parentMenu, spectrum, dataSection, caption, hint, htmlClass)
	{
		var result = new Kekule.Widget.MenuItem(parentMenu, caption);
		result.addClassName(htmlClass);
		result[this.SPECTRUM_SELECT_MENU_SPECTRUM_FIELD] = spectrum;
		result[this.SPECTRUM_SELECT_MENU_SPECTRUM_DATA_SECTION_FIELD] = dataSection;
		return result;
	},
	/** @private */
	_getSpectrumTexts: function(spectrum, spectrumIndex, spectrumCount, allowDefault)
	{
		var caption = spectrum.getTitle() || spectrum.getName();
		if (!caption && allowDefault)
			caption = this._getDefaultSpectrumCaption(spectrum, spectrumIndex, spectrumCount);
		return {'caption': caption, 'hint': caption};
	},
	/** @private */
	_getDefaultSpectrumCaption: function(spectrum, spectrumIndex, spectrumCount)
	{
		return Kekule.$L('ChemWidgetTexts.CAPTION_SPECTRUM_WITH_INDEX').format(spectrumIndex + 1);
	},
	/** @private */
	_getSpectrumDataSectionTexts: function(spectrum, dataSection, sectionIndex, sectionCount, allowDefault)
	{
		var caption = dataSection.getTitle() || dataSection.getName();
		if (!caption && allowDefault)
			caption = this._getDefaultSpectrumDataSectionCaption(spectrum, dataSection, sectionIndex, sectionCount)
		return {'caption': caption, 'hint': caption};
	},
	/** @private */
	_getDefaultSpectrumDataSectionCaption: function(spectrum, dataSection, sectionIndex, sectionCount)
	{
		return Kekule.$L('ChemWidgetTexts.CAPTION_SPECTRUM_DATASECTION_WITH_INDEX').format(sectionIndex + 1);
	},
	/**
	 * This method overwrite the doSetChemObj of child spectrum viewer.
	 * @private
	 */
	_spectrumViewerSetChemObjOverwrite: function($origin, chemObj)
	{
		//console.log('override', chemObj, this._isLoadingFromSubSpectrumViewer);
		if (this._isLoadingFromSubSpectrumViewer)
			$origin(chemObj);
		else
		{
			this.load(chemObj);
			/*
			this._isLoadingFromSubSpectrumViewer = true;
			try
			{
				this.load(chemObj);
			}
			finally
			{
				this._isLoadingFromSubSpectrumViewer = false;
			}
			*/
		}
	},
	/**
	 * This method overwrite the createToolButton of child spectrum viewer.
	 * @private
	 */
	_spectrumViewerCreateToolButtonOverwrite: function($origin, btnName, parentGroup)
	{
		if (this._isCompActionDelegatableToSpectrumViewer(btnName))
		{
			//console.log('create tool button', btnName, this.getSpectrumViewer());
			var actionClass = this.getChildActionClass(btnName);
			var btnClass = (btnName === BNS.changeSpectrumSection)? Kekule.Widget.DropDownButton: Kekule.Widget.Button;
			var result = new btnClass(parentGroup);
			var action = this._getActionOfComp(btnName, true);
			if (action)
				result.setAction(action);
			if (btnName === BNS.changeSpectrumSection)
				result.setDropDownWidget(this.getSpectrumDataSectionSelectMenu());
			return result;
		}
		else
			return $origin(btnName, parentGroup);
	},
	/** @private */
	_spectrumViewerGetSavingTargetObjOverwrite: function($origin)
	{
		// ensure the save button of spectrumViewer saving the root chemObj, not only the spectrum in viewer
		return this.getChemObj();
	},
	/** @private */
	_isCompActionDelegatableToSpectrumViewer: function(compName)
	{
		return [BNS.changeSpectrumSection, BNS.correlateSpectrumDataAndObject, BNS.reset, BNS.config].indexOf(compName) >= 0
	},
	/** @private */
	_getActionOfComp: function(compName, canCreate, defActionClass)
	{
		//if (compNameOrComp === BNS.changeSpectrumSection)
		if (this._isCompActionDelegatableToSpectrumViewer(compName))
		{
			var spectrumViewer = this.getSpectrumViewer();
			var map = spectrumViewer.getActionMap();
			var result = map.get(compName);
			if (!result && canCreate)
			{
				var c = this.getChildActionClass(compName) || defActionClass;
				if (c)
				{
					result = new c(this);
					map.set(compName, result);
					spectrumViewer.getActions().add(result);
				}
			}
			return result;
		}
		else
			return null;
	},

	/** @private */
	getDefaultToolBarButtons: function()
	{
		return Kekule.globalOptions.chemWidget.spectrumInspector.toolButtons;
	},

	/////  methods about chemObj load/save
	/** @private */
	getSpectrumBaseClass: function()
	{
		return Kekule.Spectroscopy.Spectrum;
	},
	/** @private */
	chemObjChanged: function(newObj, oldObj)
	{
		var sClass = this.getSpectrumBaseClass();
		if (newObj)
		{
			var spectrums;
			if (newObj instanceof sClass)
				spectrums = [newObj];
			else
				spectrums = newObj.filterChildren(function(child){ return child && (child instanceof sClass); });
			var oldSpectrums = this.getSpectrums();
			this.invokeEvent('load', {'obj': newObj, 'spectrums': spectrums ||[]});
			this.spectrumsChanged(spectrums, oldSpectrums);
		}
		else  // clear objects in inspector
		{
			var oldSpectrums = this.getSpectrums();
			this.spectrumsChanged([], oldSpectrums);
		}
	},
	/** @private */
	spectrumsChanged: function(newSpectrums, oldSpectrums)
	{
		this.setPropStoreFieldValue('spectrums', newSpectrums);
		this.setActiveSpectrumIndex(0);
		this._refillSpectrumDataSectionSelectMenu();
	},
	/** @private */
	activeSpectrumChanged: function(newSpectrum, oldSpectrum)
	{
		//if (newSpectrum !== oldSpectrum)  // allow force update
		{
			this._loadInSpectrumViewer(newSpectrum);
			this._updateSpectrumDataSectionSelectMenuCheckState();
			if (this.getAutoSyncUiMarkerStyles())
				this.syncHotTrackAndSelectStylesBetweenViewers();
		}
	},
	/** @private */
	activeSpectrumDataSectionChanged: function(newSection, oldSection)
	{
		if (newSection != oldSection)
		{
			this._repaintSpectrumViewer();
			this._updateSpectrumDataSectionSelectMenuCheckState();
			if (this.getAutoSyncUiMarkerStyles())
				this.syncHotTrackAndSelectStylesBetweenViewers();
		}
	},
	/** @private */
	_loadInSpectrumViewer: function(chemObj)
	{
		this._isLoadingFromSubSpectrumViewer = true;
		try
		{
			this.getSpectrumViewer().load(chemObj);
		}
		finally
		{
			this._isLoadingFromSubSpectrumViewer = false;
		}
	},
	/** @private */
	_repaintSpectrumViewer: function()
	{
		this.getSpectrumViewer().requestRepaint();
	},

	/**
	 * Returns the viewer configs object of spectrum viewer.
	 * @returns {Kekule.ChemWidget.ViewerConfigs}
	 */
	getSpectrumViewerConfigs: function()
	{
		var v = this.getSpectrumViewer();
		return v && v.getViewerConfigs();
	},
	/**
	 * Returns the viewer configs object of assoc viewer.
	 * @returns {Kekule.ChemWidget.ViewerConfigs}
	 */
	getAssocViewerConfigs: function()
	{
		var v = this.getAssocViewer();
		return v && v.getViewerConfigs();
	},

	/** @private */
	_applyPropertyToChildViewerProperty: function(propName, propValue)
	{
		var v = this.getSpectrumViewer();
		if (v)
			v.setPropValue(propName, propValue);
		v = this.getAssocViewer();
		if (v)
			v.setPropValue(propName, propValue);
	},
	/** @private */
	_applyEnablePropertyToChildViewerConfigs: function(propName, propValue)
	{
		var spectrumViewConfigPropName, interactionConfigName;
		if (propName === 'enableHotTrack')
		{
			spectrumViewConfigPropName = 'enableSpectrumDataHotTrackOnMode';
			interactionConfigName = 'enableBasicObjectHotTrack';
		}
		else if (propName === 'enableSelect')
		{
			spectrumViewConfigPropName = 'enableSpectrumDataSelectOnMode';
			interactionConfigName = 'enableBasicObjectSelect';
		}
		else if (propName === 'enableMultiSelect')
		{
			spectrumViewConfigPropName = 'enableSpectrumDataMultiSelectOnMode';
			interactionConfigName = 'enableBasicObjectMultiSelect';
		}

		if (spectrumViewConfigPropName && interactionConfigName)
		{
			var spectrumViewerConfigs = this.getSpectrumViewerConfigs();
			var spectrumViewerSpectrumViewConfigs = spectrumViewerConfigs && spectrumViewerConfigs.getSpectrumViewConfigs();
			var spectrumViewerInteractionConfigs = spectrumViewerConfigs && spectrumViewerConfigs.getInteractionConfigs();
			var assocViewerConfigs = this.getAssocViewerConfigs();
			var assocViewerInteractionConfigs = assocViewerConfigs && assocViewerConfigs.getInteractionConfigs();
			if (assocViewerInteractionConfigs)
				assocViewerInteractionConfigs.setPropValue(interactionConfigName, propValue);
			if (spectrumViewerInteractionConfigs)
				spectrumViewerInteractionConfigs.setPropValue(interactionConfigName, propValue);
			if (spectrumViewerSpectrumViewConfigs)
			{
				var oldValue = spectrumViewerSpectrumViewConfigs.getPropValue(spectrumViewConfigPropName);
				if (oldValue)
					oldValue.default = propValue;
				else
					spectrumViewerSpectrumViewConfigs.setPropValue({'default': propValue});
			}
		}
	},
	/** @private */
	_applyAllEnablePropertiesToChildViewerConfigs: function()
	{
		var propNames = ['enableSelect', 'enableMultiSelect', 'enableHotTrack'];
		for (var i = 0, l = propNames.length; i < l; ++i)
		{
			var propName = propNames[i];
			var propValue = this.getPropValue(propName);
			this._applyEnablePropertyToChildViewerConfigs(propName, propValue);
		}
	},

	/**
	 * Copy hot track/select styles from spectrum viewer to assoc viewer widget.
	 * Ensure the UI markers are similar.
	 */
	syncHotTrackAndSelectStylesBetweenViewers: function()
	{
		var section = this.getActiveDataSection();
		if (section)  // sync styles of spectrum
		{
			var spectrumViewConfigs = this.getSpectrumViewer().getViewerConfigs().getSpectrumViewConfigs();
			var assocViewConfigs = this.getAssocViewer().getViewerConfigs().getUiMarkerConfigs();

			var dataMode = section.getMode();
			var hotTrackUiMarkerStyles = spectrumViewConfigs.getDataModeSpecifiedConfigValue('spectrumDataHotTrackUiMarkersOnMode', dataMode) && spectrumViewConfigs.getDataModeSpecifiedConfigValue('spectrumHotTrackDataPointMarkerDrawStyles', dataMode);
			var selectUiMarkerStyles = spectrumViewConfigs.getDataModeSpecifiedConfigValue('spectrumDataSelectUiMarkersOnMode', dataMode) && spectrumViewConfigs.getDataModeSpecifiedConfigValue('spectrumSelectDataPointMarkerDrawStyles', dataMode);
			var hotTrackObjStyles, selectObjStyles;
			//console.log('styles', hotTrackUiMarkerStyles, selectUiMarkerStyles);
			if (dataMode === Kekule.Spectroscopy.DataMode.PEAK)
			{
				hotTrackObjStyles = spectrumViewConfigs.getSpectrumPeakHotTrackStyles();
				selectObjStyles = spectrumViewConfigs.getSpectrumPeakSelectStyles();
			}
			var transparentStyles = {'opacity': 0, 'color': 'transparent'};
			// apply to assoc viewer
			if (hotTrackUiMarkerStyles)
				assocViewConfigs.setHotTrackMarkerStyles(Object.extend({}, hotTrackUiMarkerStyles));
			else
				assocViewConfigs.setHotTrackMarkerStyles(transparentStyles);
			if (selectUiMarkerStyles)
				assocViewConfigs.setSelectionMarkerStyles(Object.extend({}, selectUiMarkerStyles));
			else
				assocViewConfigs.setSelectionMarkerStyles(transparentStyles);
			if (hotTrackObjStyles)
				assocViewConfigs.setHotTrackedObjectStyles(Object.extend({'nodeDisplayMode': Kekule.Render.NodeLabelDisplayMode.SHOWN}, hotTrackObjStyles));  // ensure the node to be styled even it is C atom
			else
				assocViewConfigs.setHotTrackedObjectStyles({});
			if (selectObjStyles)
				assocViewConfigs.setSelectedObjectStyles(Object.extend({'nodeDisplayMode': Kekule.Render.NodeLabelDisplayMode.SHOWN}, selectObjStyles));
			else
				assocViewConfigs.setSelectedObjectStyles({});
		}
	},

	/**
	 * Returns the primary spectrum view in child spectrum viewer.
	 * @returns {Kekule.ChemWidget.Viewer.SpectrumSubView}
	 */
	getSpectrumSubView: function()
	{
		var v = this.getSpectrumViewer();
		return v && v.getSubView(this.getActiveSpectrum(), Kekule.ChemWidget.Viewer.SpectrumSubView, true);
	},

	/**
	 * Reset display to initial state (no zoom, rotation and so on).
	 */
	resetDisplay: function()
	{
		var v = this.getSpectrumViewer();
		if (v)
			v.resetDisplay();
		var v = this.getAssocViewer();
		if (v)
			v.resetDisplay();
	},

	/**
	 * Load and display chemObj in inspector
	 * @param {Kekule.ChemObject} chemObj
	 */
	load: function(chemObj)
	{
		//console.log('Load', chemObj.getClassName(), chemObj);
		return this.doLoad(chemObj);
	},
	/**
	 * Do actual job of loading a chemObj.
	 * @param {Kekule.ChemObject} chemObj
	 * @private
	 */
	doLoad: function(chemObj)
	{
		this.setChemObj(chemObj);
	},
	/**
	 * Load chem object from data of special MIME type or file format.
	 * @param {Variant} data Usually text content.
	 * @param {String} mimeType
	 * @param {String} fromUrlOrFileName From which file or url is this data loaded.
	 * @param {String} formatId
	 */
	loadFromData: function(data, mimeType, fromUrlOrFileName, formatId, objAfterLoadCallback)
	{
		try
		{
			if (!data)
			{
				this.setChemObj(null);
				return null;
			}
			else
			{
				var chemObj;
				if (formatId)
					chemObj = Kekule.IO.loadFormatData(data, formatId);
				else if (mimeType || fromUrlOrFileName)
					chemObj = Kekule.IO.loadTypedData(data, mimeType, fromUrlOrFileName);
				if (chemObj)
				{
					this.load(chemObj);
				}
				else
					Kekule.error(Kekule.$L('ErrorMsg.LOAD_CHEMDATA_FAILED'));
				return chemObj;
			}
		}
		catch(e)
		{
			this.reportException(e);
		}
	},
	/**
	 * Load chem object from file object.
	 * NOTE: browser must support File Reader API to use this method.
	 * @param {File} file
	 */
	loadFromFile: function(file)
	{
		if (!file)
			this.setChemObj(null);
		else
		{
			var self = this;
			try
			{
				Kekule.IO.loadFileData(file, function(chemObj, success)
					{
						if (success)
						{
							self.load(chemObj);
						}
					}
				);
			}
			catch (e)
			{
				this.reportException(e);
			}
		}
	},
	/**
	 * Returns object in inspector that to be saved.
	 * Usually this should be the active spectrum displayed in spectrum viewer .
	 * Descendants may override this method.
	 * @returns {Kekule.ChemObject}
	 * @private
	 */
	getSavingTargetObj: function()
	{
		//return this.getActiveSpectrum();
		return this.getChemObj();
	},
	/**
	 * Save loaded chem object in spectrum to data.
	 * @param {String} formatId
	 * @param {Int} dataType Text or binary. Set null to use default type.
	 * @param {Kekule.ChemObject} obj Object to save, default is current chemObj loaded in displayer.
	 * @returns {Variant} Saved data.
	 */
	saveData: function(formatId, dataType, obj)
	{
		var obj = obj || this.getSavingTargetObj();
		this.prepareSaveData(obj);
		var writer = Kekule.IO.ChemDataWriterManager.getWriterByFormat(formatId, null, obj);
		if (writer)
		{
			if (!dataType)
			{
				var formatInfo = Kekule.IO.DataFormatsManager.getFormatInfo(formatId);
				dataType = formatInfo.dataType;
			}
			var data = writer.writeData(obj, dataType, formatId);
			return data;
		}
		else
		{
			Kekule.error(Kekule.$L('ErrorMsg.NO_SUITABLE_WRITER_FOR_FORMAT'));
			return null;
		}
	},
	/**
	 * Called before obj is saved. Descendants can override this method.
	 * @private
	 */
	prepareSaveData: function(obj)
	{
		// do nothing here
	},

	//////////// methods to set spectrum data assignments ///////////////
	/**
	 * Returns the selected data items in spectrum viewer.
	 * @returns {Array} Each item containing fields {section, dataValue}.
	 */
	getSelectedSpectrumDataItemsEx: function()
	{
		var sview = this.getSpectrumSubView();
		return sview && sview.getSelectedDataItemsEx();
	},
	/**
	 * Returns the selected data items in spectrum viewer.
	 * @returns {Array} Each item is a dataValue hash.
	 */
	getSelectedSpectrumDataItems: function()
	{
		var sview = this.getSpectrumSubView();
		return sview && sview.getSelectedDataItems();
	},
	/**
	 * Returns the selected chem objects in assoc viewer.
	 * @returns {Array}
	 */
	getSelectedAssocObjects: function()
	{
		return (this.getAssocViewer() && this.getAssocViewer().getSelectedObjects());
	},
	/** @private */
	doSetSpectrumDataAssignments: function(spectrumDataExItems, assocObjects)
	{
		if (!spectrumDataExItems || !spectrumDataExItems.length || !assocObjects || !assocObjects.length)
			return this;
		//console.log('set assignments', spectrumDataExItems, assocObjects);
		for (var i = 0, l = spectrumDataExItems.length; i < l; ++i)
		{
			var dataValue = spectrumDataExItems[i].dataValue;
			var section = spectrumDataExItems[i].section;
			var extraInfo = section.getExtraInfoOf(dataValue);
			if (extraInfo && extraInfo.setAssignments)
				extraInfo.setAssignments(assocObjects);
			else  // create new
			{
				extraInfo = Kekule.Spectroscopy.Utils.createDefaultDataExtraInfoObject(section);
				extraInfo.setAssignments(assocObjects);
				section.setExtraInfoOf(dataValue, extraInfo);
			}
		}
		return this;
	},
	/**
	 * Set the spectrum data assignments by current selected data items / objects in spectrum / assoc viewer.
	 */
	setSpectrumDataAssignmentsBySelectedObjects: function()
	{
		var spectrumDataExItems = this.getSelectedSpectrumDataItemsEx();
		var assocObjects = this.getSelectedAssocObjects();
		return this.doSetSpectrumDataAssignments(spectrumDataExItems, assocObjects);
	},

	/////////////////////////////////////////////////////////
	/**
	 * Export drawing content in spectrum inspector to a data URL for <img> tag to use.
	 * Note this method is executed in an async way and need a callback function to
	 * receive results.
	 * @param {String} dataType Type of image data, e.g. 'image/png'.
	 * @param {Hash} options Export options, usually this is a number between 0 and 1
	 *   indicating image quality if the requested type is image/jpeg or image/webp.
	 * @param {Func} callback callback(dataUri, dimension)
	 * @returns {String}
	 */
	exportToDataUriAsync: function(dataType, options, callback)
	{
		var op = options || {};
		var spectrumViewer = this.getSpectrumViewer();
		var assocViewer = this.getAssocViewer();
		if (!assocViewer.isShown())
		{
			var dataUri = spectrumViewer.isShown() ? spectrumViewer.exportToDataUri(dataType, op) : '';
			callback(dataUri, spectrumViewer.getContextDimension());
		}
		else if (!spectrumViewer.isShown())
		{
			var dataUri = assocViewer.isShown() ? assocViewer.exportToDataUri(dataType, op) : '';
			callback(dataUri, assocViewer.getContextDimension());
		}
		else  // both viewers are shown, we need to combine two contexts
		{
			var assocDataUri = assocViewer.exportToDataUri(dataType, op);
			var spectrumDataUri = spectrumViewer.exportToDataUri(dataType, op);
			var assocPosition = this.getAssocViewerActualPosition();
			var subViewerExportInfos = this._calcSubViewerOffsetsAndDimensionsForExportDataUri(spectrumViewer, assocViewer, assocPosition);

			var parentElem = this.getClientComponentHolderElems().hiddenCanvas;
			var drawBridge = spectrumViewer.getDrawBridge();
			var context = drawBridge.createContext(parentElem, subViewerExportInfos.totalDimension.width, subViewerExportInfos.totalDimension.height);
			var readyState = {};
			var setReadyState = function(viewerName, value)
			{
				readyState[viewerName] = value;
				if (!value)  // error occurs
				{
					releaseContext();
					var errorMsg = (viewerName === 'assocViewer')? Kekule.$L('ErrorMsg.FAIL_TO_EXPORT_IMAGE_DATAURI_FOR_ASSOC'): Kekule.$L('ErrorMsg.FAIL_TO_EXPORT_IMAGE_DATAURI_FOR_SPECTRUM')
					Kekule.warn(errorMsg);
				}
				if (readyState.spectrumViewer && readyState.assocViewer)  // all done
				{
					done();
				}
			}
			var done = function()  // all child viewer image has been draw on context, now export the total data URI
			{
				var dataUri = drawBridge.exportToDataUri(context, dataType, op);
				if (callback)
					callback(dataUri, subViewerExportInfos.totalDimension);
				releaseContext();
			}
			var releaseContext = function()
			{
				if (context)
					drawBridge.releaseContext(context);
				context = null;
			}
			//try
			{
				drawBridge.drawImage(context, spectrumDataUri, subViewerExportInfos.spectrumViewerOffset,
					{'x': subViewerExportInfos.spectrumViewerDimension.width, 'y': subViewerExportInfos.spectrumViewerDimension.height}, {},
					function(success){
						//console.log('spectrumViewer', success);
						setReadyState('spectrumViewer', success);
					}
				);
				drawBridge.drawImage(context, assocDataUri, subViewerExportInfos.assocViewerOffset,
					{'x': subViewerExportInfos.assocViewerDimension.width, 'y': subViewerExportInfos.assocViewerDimension.height}, {},
					function(success){
						//console.log('assocViewer', success);
						setReadyState('assocViewer', success);
					}
				);
			}
			//finally
			{
				//drawBridge.releaseContext(context);
			}
		}
	},
	/** @private */
	_calcSubViewerOffsetsAndDimensionsForExportDataUri: function(spectrumViewer, assocViewer, assocPosition)
	{
		var assocDim = assocViewer.getContextDimension();
		var spectrumDim = spectrumViewer.getContextDimension();
		var assocOffset, spectrumOffset, dim;
		var P = Kekule.Widget.Position;
		if (assocPosition & P.TOP)  // assoc viewer on top and spectrum on bottom
		{
			assocOffset = {'x': 0, 'y': 0};
			spectrumOffset = {'x': 0, 'y': assocDim.height};
			dim = {'width': Math.max(spectrumDim.width, assocDim.width), 'height': spectrumDim.height + assocDim.height};
		}
		else if (assocPosition & P.BOTTOM)  // assoc viewer on bottom and spectrum on top
		{
			assocOffset = {'x': 0, 'y': spectrumDim.height};
			spectrumOffset = {'x': 0, 'y': 0};
			dim = {'width': Math.max(spectrumDim.width, assocDim.width), 'height': spectrumDim.height + assocDim.height};
		}
		else if (assocPosition & P.RIGHT)  // assoc viewer on right and spectrum on left
		{
			assocOffset = {'x': spectrumDim.width, 'y': 0};
			spectrumOffset = {'x': 0, 'y': 0};
			dim = {'width': spectrumDim.width + assocDim.width, 'height': Math.max(spectrumDim.height, assocDim.height)};
		}
		else // if (assocPosition & P.LEFT)  // assoc viewer on left and spectrum on right
		{
			assocOffset = {'x': 0, 'y': 0};
			spectrumOffset = {'x': assocDim.width, 'y': 0};
			dim = {'width': spectrumDim.width + assocDim.width, 'height': Math.max(spectrumDim.height, assocDim.height)};
		}
		return {'spectrumViewerOffset': spectrumOffset, 'assocViewerOffset': assocOffset, 'spectrumViewerDimension': spectrumDim, 'assocViewerDimension': assocDim, 'totalDimension': dim};
	},

	/**
	 * Repaint the child viewers inside spectrum inspector.
	 * @param {Hash} overrideOptions
	 */
	repaint: function(overrideOptions)
	{
		var viewer = this.getSpectrumViewer();
		if (viewer)
			viewer.repaint(overrideOptions);
		viewer = this.getAssocViewer();
		if (viewer)
			viewer.repaint(overrideOptions);
	},
	/**
	 * Request a repaint process. The actual repainting will be suspended till idle.
	 * Use this method rather than directly calling repaint() may reduce the concrete repainting times.
	 * @param {Hash} overrideOptions
	 */
	requestRepaint: function(overrideOptions)
	{
		var viewer = this.getSpectrumViewer();
		if (viewer)
			viewer.requestRepaint(overrideOptions);
		viewer = this.getAssocViewer();
		if (viewer)
			viewer.requestRepaint(overrideOptions);
	},

	/////////////////////////////////////////////////////////
	// TODO: the edit mode is not fully implemented yet
	/**
	 * Turn on the edit mode.
	 */
	beginEditing: function()
	{
		if (this.getEnableEdit())
			this.doBeginEditing();
		return this;
	},
	/** @private */
	doBeginEditing: function()
	{
		this.getCorrelationConnector().setEnabled(false);
		this.__enablePropValueStorage__ = {
			'enableHotTrack': this.getEnableHotTrack(),
			'enableSelect': this.getEnableSelect(),
			'enableMultiSelect': this.getEnableMultiSelect(),
		};
		// turn all these on for editing
		this.setEnableHotTrack(true);
		this.setEnableSelect(true);
		this.setEnableMultiSelect(true);
		this.addClassName(CCNS.SPECTRUM_INSPECTOR_IN_EDITING);
		this.setPropStoreFieldValue('isEditing', true);
	},
	/**
	 * Turn off the edit mode.
	 */
	endEditing: function()
	{
		if (this.getIsEditing())
			this.doEndEditing();
	},
	/** @private */
	doEndEditing: function()
	{
		var enablePropStorage = this.__enablePropValueStorage__;
		if (enablePropStorage)
		{
			this.setEnableHotTrack(enablePropStorage.enableHotTrack);
			this.setEnableSelect(enablePropStorage.enableSelect);
			this.setEnableMultiSelect(enablePropStorage.enableMultiSelect);
		}
		this.getCorrelationConnector().setEnabled(true);
		this.removeClassName(CCNS.SPECTRUM_INSPECTOR_IN_EDITING);
		this.setPropStoreFieldValue('isEditing', false);
	}
});

/**
 * Enumeration of the assoc viewer display mode in a spectrum inspector.
 * @enum
 */
Kekule.ChemWidget.SpectrumInspector.AssocViewerVisualMode = {
	/** The assoc viewer will always be shown, even if it is empty. */
	VISIBLE: 1,
	/** The assoc viewer will always be hidden, even if it is not empty. */
	INVISIBLE: 2,
	/** The assoc viewer will be shown when it is not empty. */
	AUTO: 0
};
/** @ignore */
var AVVM = Kekule.ChemWidget.SpectrumInspector.AssocViewerVisualMode;

/**
 * A special class to give a setting facade for SpectrumInspector.
 * Do not use this class alone.
 * @class
 * @augments Kekule.Widget.BaseWidget.Settings
 * @ignore
 */
Kekule.ChemWidget.SpectrumInspector.Settings = Class.create(Kekule.Widget.BaseWidget.Settings,
/** @lends Kekule.ChemWidget.SpectrumInspector.Settings# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.SpectrumInspector.Settings',
	/** @private */
	initProperties: function()
	{
		this.defineDelegatedProps([
			'enableLoadNewFile', 'enableHotTrack', 'enableSelect', 'enableMultiSelect',
			'enableDirectInteraction', 'enableTouchInteraction',
			'enableToolbar', 'toolbarPos', 'toolbarMarginHorizontal', 'toolbarMarginVertical',
			//'enableEdit', 'modalEdit',
			'autoSyncUiMarkerStyles', 'assocViewerVisualMode', 'assocViewerPosition', 'enableOperationFromSpectrumToMolecule', 'enableOperationFromMoleculeToSpectrum',
			'assocViewerAutoSize', 'assocViewerAutofit', 'assocViewerAutoShrink'
		]);
	},
	/** @private */
	getSpectrumInspector: function()
	{
		return this.getWidget();
	}
});

/**
 * A special widget class to open a config widget for SpectrumInspector.
 * Do not use this widget alone.
 * @class
 * @augments Kekule.Widget.Configurator
 *
 * @param {Kekule.ChemWidget.SpectrumInspector} spectrumInspector
 */
Kekule.ChemWidget.SpectrumInspector.Configurator = Class.create(Kekule.Widget.Configurator,
/** @lends Kekule.ChemWidget.SpectrumInspector.Configurator# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.SpectrumInspector.Configurator',
	/** @private */
	TAB_BTN_DATA_FIELD: '__$data__',
	/** @construct */
	initialize: function(spectrumInspector)
	{
		this.tryApplySuper('initialize', [spectrumInspector]);
	},
	/** @ignore */
	initPropValues: function()
	{
		this.tryApplySuper('initPropValues');
		this.setLayout(Kekule.Widget.Layout.HORIZONTAL);
	},
	/** @private */
	getCategoryInfos: function()
	{
		var result = this.tryApplySuper('getCategoryInfos');
		var inspector = this.getSpectrumInspector();

		var configPropNames = ['spectrumViewerConfigs', 'spectrumViewerRenderConfigs', 'assocViewerConfigs', 'assocViewerRenderConfigs'];
		for (var i = 0, l = configPropNames.length; i < l; ++i)
		{
			var propInfo = inspector.getPropInfo(configPropNames[i]);
			var obj = inspector.getPropValue(configPropNames[i]);
			if (obj)
			{
				result.push({
					'obj': obj,
					'name': propInfo.name,
					'title': propInfo.title,
					'description': propInfo.description
				});
			}
		}

		return result;
	},
	/** @private */
	getSpectrumInspector: function()
	{
		return this.getWidget();
	}
});

// register predefined settings of viewer
var SM = Kekule.ObjPropSettingManager;
SM.register('Kekule.ChemWidget.SpectrumInspector.fullFunc', {
	enableToolbar: true,
	enableDirectInteraction: true,
	enableTouchInteraction: true,
	enableEdit: true,
	toolButtons: null   // create all default tool buttons
});
SM.register('Kekule.ChemWidget.SpectrumInspector.basic', {  // inspector with basic function, suitable for embedded spectrum object with limited size
	enableToolbar: true,
	enableDirectInteraction: true,
	enableTouchInteraction: true,
	toolButtons: [/*BNS.loadData,*/ BNS.saveData, BNS.changeSpectrumSection, BNS.zoomIn, BNS.zoomOut]
	// TODO: BNS.changeSpectrumSection action has problem when displaying in menu
	//menuItems: [BNS.saveData, BNS.changeSpectrumSection, '-', BNS.zoomIn, BNS.zoomOut]
});
SM.register('Kekule.ChemWidget.SpectrumInspector.mini', {  // inspector with only one menu button
	enableToolbar: true,
	enableDirectInteraction: true,
	enableTouchInteraction: false,
	toolButtons: [BNS.changeSpectrumSection]
	//menuItems: [BNS.saveData, BNS.changeSpectrumSection, '-', BNS.zoomIn, BNS.zoomOut]
});
SM.register('Kekule.ChemWidget.SpectrumInspector.static', {  // inspector with no interaction ability, suitable for static embedded chem object
	enableToolbar: false,
	enableDirectInteraction: false,
	enableTouchInteraction: false,
	toolButtons: [],
	menuItems: []
});


/**
 * Base class for actions for spectrum inspector widget.
 * @class
 * @augments Kekule.Action
 *
 * @param {Kekule.Widget.BaseWidget} widget Target spectrum inspector or sub spectrum vieer widget.
 * @param {String} caption
 * @param {String} hint
 */
Kekule.ChemWidget.ActionOnSpectrumInspector = Class.create(Kekule.Action,
/** @lends Kekule.ChemWidget.ActionOnSpectrumInspector# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionOnSpectrumInspector',
	/** @constructs */
	initialize: function(widget, caption, hint)
	{
		this.tryApplySuper('initialize');
		this.setTargetWidget(widget);
		this.setText(caption);
		this.setHint(hint);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('targetWidget', {'dataType': 'Kekule.Widget.BaseWidget', 'serializable': false});
	},
	/** @private */
	getSpectrumInspector: function(widget)
	{
		if (!widget)
			widget = this.getTargetWidget();
		if (widget instanceof Kekule.ChemWidget.SpectrumInspector)
			return widget;
		else if (widget && widget.getParent() instanceof Kekule.ChemWidget.SpectrumInspector)
			return widget.getParent();
		else
			return undefined;
	},
	/** @private */
	doUpdate: function()
	{
		var inspector = this.getSpectrumInspector();
		this.setEnabled(inspector && inspector.getChemObj() && inspector.getChemObjLoaded() && inspector.getEnabled());
	},
	/** @ignore */
	execute: function(target, htmlEvent)
	{
		if (!this.getSpectrumInspector() && target instanceof Kekule.ChemWidget.SpectrumInspector)
			this.setSpectrumInspector(target);
		return this.tryApplySuper('execute', [target, htmlEvent]);
	}
});

/**
 * Action for reset viewers in spectrum inspector widget.
 * @class
 * @augments Kekule.ChemWidget.ActionOnSpectrumInspector
 */
Kekule.ChemWidget.ActionSpectrumInspectorReset = Class.create(Kekule.ChemWidget.ActionOnSpectrumInspector,
/** @lends Kekule.ChemWidget.ActionSpectrumInspectorReset# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionSpectrumInspectorReset',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_RESET,
	/** @constructs */
	initialize: function(inspector)
	{
		this.tryApplySuper('initialize', [inspector, Kekule.$L('ChemWidgetTexts.CAPTION_RESETVIEW'), Kekule.$L('ChemWidgetTexts.HINT_RESETVIEW')]);
	},
	/** @private */
	doExecute: function(target)
	{
		this.tryApplySuper('doExecute', [target]);
		var inspector = this.getSpectrumInspector();
		inspector.resetDisplay();
		// this.getDisplayer().resetDisplay();
	}
});

/**
 * Action used for the stub button to switch displayed spectrum/data sections.
 * @class
 * @augments Kekule.ChemWidget.ActionOnSpectrumInspector
 */
Kekule.ChemWidget.ActionSpectrumInspectorChangeSpectrumSectionStub = Class.create(Kekule.ChemWidget.ActionOnSpectrumInspector,
/** @lends Kekule.ChemWidget.ActionSpectrumInspectorChangeSpectrumSectionStub# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionSpectrumInspectorChangeSpectrumSectionStub',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_SPECTRUM_INSPECTOR_CHANGE_SECTION,
	/** @ignore */
	initialize: function(inspector)
	{
		this.tryApplySuper('initialize', [inspector, Kekule.$L('ChemWidgetTexts.CAPTION_CHANGE_SPECTRUM_SECTION'), Kekule.$L('ChemWidgetTexts.HINT_CHANGE_SPECTRUM_SECTION')]);
	},
	/** @private */
	doExecute: function(target)
	{
		this.tryApplySuper('doExecute', [target]);
		// do nothing else
	},
	/** @ignore */
	doUpdate: function()
	{
		this.tryApplySuper('doUpdate');
		//var inspector = this.getSpectrumInspector();
		//this.setEnabled(this.getEnabled() && this._hasMultipleDisplayItems(inspector));
	},
	/** @private */
	_hasMultipleDisplayItems: function(spectrumInspector)
	{
		var result = false;
		var spectrums = spectrumInspector.getSpectrums();
		if (spectrums.length > 1)
			result = true;
		else
		{
			var currSpectrum = spectrums[0];
			// TODO: currently we regard each different data section in different displaying group
			result = currSpectrum && (currSpectrum.getDataSectionCount() > 1);
		}
		return result;
	}
});

/**
 * Action for link the selected spectrum peaks and molecule children together..
 * @class
 * @augments Kekule.ChemWidget.ActionOnSpectrumInspector
 */
Kekule.ChemWidget.ActionSpectrumInspectorAssignmentCorrelate = Class.create(Kekule.ChemWidget.ActionOnSpectrumInspector,
/** @lends Kekule.ChemWidget.ActionSpectrumInspectorAssignmentCorrelate# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionSpectrumInspectorAssignmentCorrelate',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_SPECTRUM_INSPECTOR_CORRELATOR,
	/** @ignore */
	initialize: function(inspector)
	{
		this.tryApplySuper('initialize', [inspector, Kekule.$L('ChemWidgetTexts.CAPTION_SET_SPECTRUM_DATA_ASSIGNMENT'), Kekule.$L('ChemWidgetTexts.HINT_SET_SPECTRUM_DATA_ASSIGNMENT')]);
	},
	/** @private */
	doExecute: function(target)
	{
		this.tryApplySuper('doExecute', [target]);
		var inspector = this.getSpectrumInspector();
		inspector.setSpectrumDataAssignmentsBySelectedObjects();
	},
	/** @ignore */
	doUpdate: function()
	{
		this.tryApplySuper('doUpdate');
		var inspector = this.getSpectrumInspector();
		var selDataItems = inspector.getSelectedSpectrumDataItems();
		var selChemObjs = inspector.getSelectedAssocObjects();
		this.setEnabled(this.getEnabled() && (selDataItems && selDataItems.length) && (selChemObjs && selChemObjs.length));
	},
});

// register actions to spectrum inspector widget
Kekule._registerAfterLoadSysProc(function()
{
	var AM = Kekule.ActionManager;
	var CW = Kekule.ChemWidget;
	var widgetClass = Kekule.ChemWidget.SpectrumInspector;
	var reg = AM.registerNamedActionClass;

	reg(BNS.reset, CW.ActionSpectrumInspectorReset, widgetClass);
	reg(BNS.changeSpectrumSection, CW.ActionSpectrumInspectorChangeSpectrumSectionStub, widgetClass);
	reg(BNS.correlateSpectrumDataAndObject, CW.ActionSpectrumInspectorAssignmentCorrelate, widgetClass);
	reg(BNS.config, Kekule.Widget.ActionOpenConfigWidget, widgetClass);
});

});

})();