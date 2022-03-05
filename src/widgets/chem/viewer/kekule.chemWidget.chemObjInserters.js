/**
 * @fileoverview
 * A chem object setter widget based on Viewer.
 * This widget is mainly designed for extra web editor plugins or browser addons.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /xbrowsers/kekule.x.js
 * requires /core/kekule.common.js
 * requires /widgets/kekule.widget.base.js
 * requires /widgets/kekule.widget.helpers.js
 * requires /widgets/commonCtrls/kekule.widget.tabViewes.js
 * requires /widgets/commonCtrls/kekule.widget.buttons.js
 * requires /widgets/commonCtrls/kekule.widget.formControls.js
 * requires /widgets/advCtrls/kekule.widget.colorPickers.js
 * requires /widgets/chem/kekule.chemWidget.base.js
 * requires /widgets/chem/kekule.chemWidget.chemObjDisplayers.js
 * requires /widgets/chem/viewer/kekule.chemWidget.viewers.js
 * requires /widgets/chem/viewer/kekule.chemWidget.spectrumInspectors.js
 * requires /widgets/advCtrls/kekule.widget.widgetGrids.js
 * requires /widgets/chem/kekule.chemWidget.dialogs.js
 * requires /calculation/kekule.calc.base.js
 *
 * requires /localization/kekule.localize.widget.js
 */

(function(){
"use strict";

var PS = Class.PropertyScope;
var OU = Kekule.ObjUtils;
var DU = Kekule.DomUtils;
var AU = Kekule.ArrayUtils;
var CW = Kekule.ChemWidget;
var BNS = Kekule.ChemWidget.ComponentWidgetNames;
//var CWT = Kekule.ChemWidgetTexts;

/** @ignore */
Kekule.ChemWidget.HtmlClassNames = Object.extend(Kekule.ChemWidget.HtmlClassNames, {
	CHEMOBJSETTER: 'K-Chem-Obj-Setter',
	CHEMOBJSETTER_FLEX_LAYOUT: 'K-Chem-Obj-Setter-Flex-Layout',  // a special class indicating that the composer is using CSS flex layout
	CHEMOBJSETTER_TOOLBAR_AREA: 'K-Chem-Obj-Setter-Toolbar-Area',
	CHEMOBJSETTER_CLIENT: 'K-Chem-Obj-Setter-Client',
	CHEMOBJSETTER_VIEWER: 'K-Chem-Obj-Setter-Viewer',
	CHEMOBJSETTER_TABGROUP: 'K-Chem-Obj-Setter-TabGroup',
	CHEMOBJSETTER_INFOLABEL: 'K-Chem-Obj-Setter-InfoLabel',
	CHEMOBJSETTER_STATUSLABEL: 'K-Chem-Obj-Setter-StatusLabel',
	CHEMOBJSETTER_REGION: 'K-Chem-Obj-Setter-Region',
	CHEMOBJSETTER_REGION_LABEL: 'K-Chem-Obj-Setter-Region-Label',
	CHEMOBJSETTER_LINE: 'K-Chem-Obj-Setter-Line',
	//CHEMOBJSETTER_OPTIONPANEL: 'K-Chem-Obj-Setter-OptionPanel',

	CHEMOBJSETTER_CONFIGURATOR: 'K-Chem-Obj-Setter-Configurator',

	SPECTRUMOBJ_INSERTER: 'K-SpectrumObjInserter',
	SPECTRUMOBJ_INSERTER_CONTAINER_ELEM: 'K-SpectrumObjInserter-Container',
	SPECTRUMOBJ_INSERTER_CLIENT: 'K-SpectrumObjInserter-Client',
	SPECTRUMOBJ_INSERTER_TOOLBAR_AREA: 'K-SpectrumObjInserter-Toolbar-Area',
	SPECTRUMOBJ_INSERTER_INFOLABEL: 'K-SpectrumObjInserter-InfoLabel',
	SPECTRUMOBJ_INSERTER_SPECTRUM_INSPECTOR: 'K-SpectrumObjInserter-SpectrumInspector',

	SPECTRUMOBJ_INSERTER_CONFIGURATOR: 'K-SpectrumObjInserter-Configurator',
});

var CNS = Kekule.Widget.HtmlClassNames;
var CCNS = Kekule.ChemWidget.HtmlClassNames;

/** @ignore */
Kekule.globalOptions.add('chemWidget.chemObjInserter', {
	'autoSizeExport': true,
	'backgroundColor3D': '#000000',
	'exportViewerPredefinedSetting': 'basic',
	'enable3DStructureAutoGeneration': false,

	toolButtons: [
		BNS.loadData,
		BNS.saveData,
		BNS.clearObjs,
		BNS.molDisplayType,
		BNS.molHideHydrogens,
		BNS.molAutoGenerateCoords,
		BNS.zoomIn, BNS.zoomOut,
		BNS.rotateX, BNS.rotateY, BNS.rotateZ,
		BNS.rotateLeft, BNS.rotateRight,
		BNS.reset,
		//BNS.copy,
		BNS.openEditor,
		BNS.config
	]
});


/**
 * A chem widget to insert chem viewer elements to HTML document.
 * This widget is mainly designed for extra web editor plugins or browser addons.
 * @class
 * @augments Kekule.ChemWidget.AbstractWidget
 *
 * @property {Kekule.ChemWidget.Viewer} viewer The viewer instance embedded in this widget.
 * @property {Int} renderType Display in 2D or 3D. Value from {@link Kekule.Render.RendererType}.
 * @property {Kekule.ChemObject} chemObj The root object in viewer.
 * @property {Bool} showInfo Whether info label is shown.
 * //@property {Bool} enable3DStructureGeneration Whether show an extra button to convert 2D structures to 3D.
 * @property {Bool} enable3DStructureAutoGeneration Whether generate the 3D structure from 2D automatically when the 3D tab is empty.
 */
Kekule.ChemWidget.ChemObjInserter = Class.create(Kekule.ChemWidget.AbstractWidget,
/** @lends Kekule.ChemWidget.ChemObjInserter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ChemObjInserter',
	/** @private */
	DEF_BGCOLOR_2D: 'transparent',
	/** @private */
	DEF_BGCOLOR_3D: '#000000',
	/** @construct */
	initialize: function(/*$super, */parentOrElementOrDocument, chemObj, renderType, viewerConfigs)
	{
		this._configAction = new Kekule.Widget.ActionOpenConfigWidget(this);
		this._toolbarParentElem = null;
		this._infoLabel = null;
		this._infoLabelTemplate = Kekule.$L('ChemWidgetTexts.CAPTION_WIDTH_HEIGHT');
		//this.setPropStoreFieldValue('enable3DStructureGeneration', true);
		//this.setPropStoreFieldValue('enable3DStructureAutoGeneration', true);
		this.tryApplySuper('initialize', [parentOrElementOrDocument])  /* $super(parentOrElementOrDocument) */;
		var viewer = this.getViewer();
		if (renderType)
			viewer.setRenderType(renderType);
		if (viewerConfigs)
			viewer.setViewerConfigs(viewerConfigs);

		this.adjustChildrenSizes();
	},
	/** @private */
	doFinalize: function(/*$super*/)
	{
		if (this._configAction)
			this._configAction.finalize();
		var viewer = this.getPropStoreFieldValue('viewer');
		if (viewer)
			viewer.finalize();
		this.tryApplySuper('doFinalize')  /* $super() */;
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('viewer', {
			'dataType': 'Kekule.ChemWidget.Viewer', 'serializable': false, 'setter': null,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('viewer');
				if (!result)
				{
					result = this.createViewer();
					this.setPropStoreFieldValue('viewer', result);
				}
				return result;
			}
		});
		this.defineProp('chemObj', {'dataType': 'Kekule.ChemObject', 'serializable': false, 'scope': PS.PUBLIC,
			'getter': function()
			{
				/*
				var viewer = this.getPropStoreFieldValue('viewer');
				return viewer? viewer.getChemObj(): this.getPropStoreFieldValue('chemObj');
				*/
				return this.getPropStoreFieldValue('chemObj');
			},
			'setter': function(value)
			{
				//var oldObj = this.getPropStoreFieldValue('chemObj');
				//if (value !== oldObj)  // some times oldObj itself may change and may need to repaint
				{
					this.setPropStoreFieldValue('chemObj', value);
					if (this.getViewer())
						this.getViewer().setChemObj(value);
				}
			}
		});
		// 3D structure generated from chemObj, private property
		this.defineProp('assoc3DChemObj', {'dataType': 'Kekule.ChemObject', 'serializable': false, 'scope': PS.PRIVATE,
			'setter': function(value)
			{
				var old = this.getAssoc3DChemObj();
				if (value !== old)
				{
					this.setPropStoreFieldValue('assoc3DChemObj', value);
					if (this.getRenderType() === Kekule.Render.RendererType.R3D)
					{
						var newDisplayedChemObj = this._getDisplayedChemObjForRenderType(this.getRenderType());
						this._changeDisplayedChemObj(newDisplayedChemObj);
					}
				}
			}
		});
		// Current displayed object in viewer, may not same to chemObj property, private
		this.defineProp('currDisplayedChemObj', {'dataType': 'Kekule.ChemObject', 'serializable': false, 'scope': PS.PRIVATE,
			'setter': null,
			'getter': function()
			{
				var viewer = this.getPropStoreFieldValue('viewer');
				return viewer && viewer.getChemObj();
			}
		});

		this.defineProp('renderType', {'dataType': DataType.INT, 'serializable': false, 'scope': PS.PUBLIC,
			'setter': function(value)
			{
				var oldValue = this.getRenderType();
				if (value !== oldValue)
				{
					this.setPropStoreFieldValue('renderType', value);
					var oldDisplayedChemObj = this._getDisplayedChemObjForRenderType(oldValue);
					var newDisplayedChemObj = this._getDisplayedChemObjForRenderType(value);
					this.getViewer().setRenderType(value);
					if (oldDisplayedChemObj !== newDisplayedChemObj)
					{
						this._changeDisplayedChemObj(newDisplayedChemObj);
					}
					var tabs = this.getTabs();
					if (tabs)
					{
						var index = (value === Kekule.Render.RendererType.R3D)? 1: 0;
						tabs.getChildWidgets()[index].setChecked(true);
					}
				}
			}
		});
		this.defineProp('is3D', {'dataType': DataType.BOOL, 'serializable': false,
			'getter': function() { return this.getRenderType() === Kekule.Render.RendererType.R3D; },
			'setter': function(value) { this.setRenderType(value? Kekule.Render.RendererType.R3D: Kekule.Render.RendererType.R2D); }
		});
		//this.defineProp('enable3DStructureGeneration', {'dataType': DataType.BOOL});
		this.defineProp('enable3DStructureAutoGeneration', {'dataType': DataType.BOOL});

		this.defineProp('showInfo', {'dataType': DataType.BOOL, 'serializable': false,
			'getter': function()
			{
				return this._infoLabel && Kekule.StyleUtils.isShown(this._infoLabel);
			},
			'setter': function(value)
			{
				if (this._infoLabel)
					Kekule.StyleUtils.setDisplay(this._infoLabel, value);
			}
		});
		this.defineProp('statusMessage', {'dataType': DataType.STRING, 'serializable': false, 'scope': PS.PUBLIC,
			'getter': function() { var elem = this._statusLabel; return elem && elem.innerHTML; },
			'setter': function(value) { this._updateStatusLabel(value); }
		});
		this.defineProp('autoSizeExport', {'dataType': DataType.BOOL});
		this.defineProp('backgroundColor2D', {'dataType': DataType.STRING,
			'setter': function(value) { this.setPropStoreFieldValue('backgroundColor2D', value); this.backgroundColorChange(); }
		});
		this.defineProp('backgroundColor3D', {'dataType': DataType.STRING,
			'setter': function(value) { this.setPropStoreFieldValue('backgroundColor3D', value); this.backgroundColorChange(); }
		});
		this.defineProp('exportViewerPredefinedSetting', {'dataType': DataType.STRING});

		this.defineProp('clientPanel', {'dataType': DataType.OBJECT, 'serializable': false, 'setter': false, 'scope': PS.PRIVATE});
		this.defineProp('tabs', {'dataType': DataType.OBJECT, 'serializable': false, 'setter': false, 'scope': PS.PRIVATE});
		//this.defineProp('optionPanel', {'dataType': DataType.OBJECT, 'serializable': false, 'setter': false, 'scope': PS.PRIVATE});
		//this.defineProp('infoLabel', {'dataType': DataType.OBJECT, 'serializable': false, 'setter': false, 'scope': PS.PRIVATE});


		// viewer delegated property
		// from ChemObjDisplayer
		this._defineViewerDelegatedProp('chemObjLoaded');
		this._defineViewerDelegatedProp('renderConfigs');
		this._defineViewerDelegatedProp('drawOptions');
		this._defineViewerDelegatedProp('allowCoordBorrow');
		// from viewer
		this._defineViewerDelegatedProp('autoSize');
		this._defineViewerDelegatedProp('autofit');
		this._defineViewerDelegatedProp('autoShrink');
		this._defineViewerDelegatedProp('viewerConfigs');
		this._defineViewerDelegatedProp('allowedMolDisplayTypes');
		this._defineViewerDelegatedProp('enableEdit');
		this._defineViewerDelegatedProp('enableEditFromVoid');
		this._defineViewerDelegatedProp('modalEdit');
		this._defineViewerDelegatedProp('restrainEditorWithCurrObj');
		this._defineViewerDelegatedProp('editorProperties');
		this._defineViewerDelegatedProp('toolButtons');
		this._defineViewerDelegatedProp('enableDirectInteraction');
		this._defineViewerDelegatedProp('enableTouchInteraction');
		this._defineViewerDelegatedProp('enableGesture');
	},
	/** @ignore */
	initPropValues: function(/*$super*/)
	{
		this.tryApplySuper('initPropValues')  /* $super() */;
		/*
		this.setAutoSizeExport(true);
		this.setBackgroundColor3D(this.DEF_BGCOLOR_3D);
		this.setExportViewerPredefinedSetting('basic');
		*/
		var options = Object.extend({
			'autoSizeExport': true,
			'backgroundColor3D': this.DEF_BGCOLOR_3D,
			'exportViewerPredefinedSetting': 'basic',
			'enable3DStructureAutoGeneration': false,
		}, Kekule.globalOptions.get('chemWidget.chemObjInserter'), {});

		this.setAutoSizeExport(options.autoSizeExport);
		this.setBackgroundColor3D(options.backgroundColor3D);
		this.setExportViewerPredefinedSetting(options.exportViewerPredefinedSetting);
	},
	/**
	 * Define property that directly mapped to viewer's property.
	 * @param {String} propName
	 * @param {String} viewerPropName Name of corresponding property in editor.
	 * @return {Object} Property info object added to property list.
	 * @private
	 */
	_defineViewerDelegatedProp: function(propName, viewerPropName)
	{
		if (!viewerPropName)
			viewerPropName = propName;
		var viewerPropInfo = ClassEx.getPropInfo(Kekule.ChemWidget.Viewer, viewerPropName);
		var propOptions = Object.create(viewerPropInfo);
		propOptions.getter = null;
		propOptions.setter = null;
		if (viewerPropInfo.getter)
		{
			propOptions.getter = function()
			{
				return this.getViewer().getPropValue(viewerPropName);
			};
		}
		if (viewerPropInfo.setter)
		{
			propOptions.setter = function(value)
			{
				this.getViewer().setPropValue(viewerPropName, value);
			}
		}
		return this.defineProp(propName, propOptions);
	},

	/** @private */
	loadPredefinedResDataToProp: function(propName, resData, success)
	{
		if (propName === 'chemObj')  // only this property can be set by predefined resource
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

	/** @ignore */
	doGetWidgetClassName: function(/*$super*/)
	{
		var result = this.tryApplySuper('doGetWidgetClassName')  /* $super() */ + ' ' + CCNS.CHEMOBJSETTER;
		if (this._isUsingFlexLayout())
			result += ' ' + CCNS.CHEMOBJSETTER_FLEX_LAYOUT;
		return result;
	},
	/** @private */
	_isUsingFlexLayout: function()
	{
		return Kekule.BrowserFeature.cssFlex;
	},

	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('div');
		return result;
	},
	/** @ignore */
	doCreateSubElements: function(/*$super, */doc, rootElem)
	{
		var result = this.tryApplySuper('doCreateSubElements', [doc, rootElem])  /* $super(doc, rootElem) */;

		// create child widgets
		// toolbar
		this.createToolbarParent(rootElem);
		// client
		var clientPanel = new Kekule.Widget.Panel(this);
		clientPanel.addClassName(CCNS.CHEMOBJSETTER_CLIENT);
		clientPanel.setUseCornerDecoration(false);
		clientPanel.appendToElem(rootElem);
		this.setPropStoreFieldValue('clientPanel', clientPanel);
		this.createViewer(clientPanel.getCoreElement());
		//this.createOptionPanel(clientPanel.getCoreElement());
		this.createInfoLabel(rootElem, this.getViewer());
		this.createStatusLabel(rootElem, this.getViewer());
		// tab
		this.createTabs(rootElem);

		return result;
	},

	/** @ignore */
	elementBound: function(element)
	{
		this.setObserveElemResize(true);
	},

	/** @ignore */
	doResize: function(/*$super*/)
	{
		// notify children
		//this.getViewer().resized();
		this.adjustChildrenSizes();
	},
	/** @ignore */
	doWidgetShowStateChanged: function(/*$super, */isShown)
	{
		this.tryApplySuper('doWidgetShowStateChanged', [isShown])  /* $super(isShown) */;
		this.adjustChildrenSizes();
	},

	/** @ignore */
	getResizerElement: function()
	{
		return this.getClientPanel()? this.getClientPanel().getCoreElement(): this.getCoreElement();
	},

	/** @private */
	getBackgroundColor: function(renderType)
	{
		var result = (renderType === Kekule.Render.RendererType.R3D)? this.getBackgroundColor3D(): this.getBackgroundColor2D();
		if (result === Kekule.Widget.ColorPicker.SpecialColors.TRANSPARENT)
			result = 'transparent';
		return result;
	},
	/** @private */
	setBackgroundColor: function(color, renderType)
	{
		if (renderType === Kekule.Render.RendererType.R3D)
		{
			var value = color || this.DEF_BGCOLOR_3D;
			this.setBackgroundColor3D(value);
		}
		else
		{
			var value = color || this.DEF_BGCOLOR_2D;
			this.setBackgroundColor2D(value);
		}
	},
	/** @private */
	backgroundColorChange: function()
	{
		var color = this.getBackgroundColor(this.getRenderType());
		var viewer = this.getPropStoreFieldValue('viewer');
		if (viewer)
		{
			//console.log('set back color', color);
			/*
			var elem = viewer.getElement();
			elem.style.backgroundColor = color || 'transparent';
			*/
			viewer.setBackgroundColor(color);
		}
	},

	/**
	 * Adjust size and positions of children when widget size is changed.
	 * @private
	 */
	adjustChildrenSizes: function()
	{
		if (this._isUsingFlexLayout())
		{
			// do nothing here
		}
		else // traditional absolute layout
		{
			//var selfRect = this.getBoundingClientRect();
			var selfRect = this.getPageRect();
			//var toolbarRect = Kekule.HtmlElementUtils.getElemBoundingClientRect(this._toolbarParentElem);
			var toolbarRect = Kekule.HtmlElementUtils.getElemPageRect(this._toolbarParentElem);
			var tabs = this.getTabs();
			//var tabRect = tabs && tabs.getBoundingClientRect();
			var tabRect = tabs && tabs.getPageRect();
			var h = tabRect.top - toolbarRect.bottom;
			//console.log(selfRect.height, toolbarRect.height, tabRect.height, h);
			this.getClientPanel().setHeight(h + 'px');
			//console.log('set height', h, tabRect, toolbarRect);
			/*
			if (tabRect)
			{
				// client
				var panel = this.getClientPanel();
				var style = panel.getElement().style;
				style.top = tabRect.height + 'px';
				style.bottom = '0px';
				panel.resized();
				// viewer
				this.getViewer().resized();
			}
			*/
		}
		this.getViewer().resized();
		//var clientRect = this.getClientPanel().getBoundingClientRect();
	},

	/** @private */
	createViewer: function(rootElem)
	{
		var BNS = Kekule.ChemWidget.ComponentWidgetNames;
		var EM = Kekule.Widget.EvokeMode;
		var result = new Kekule.ChemWidget.Viewer(this, null, this.getRenderType());
		result.addClassName([CNS.DYN_CREATED, CCNS.CHEMOBJSETTER_VIEWER]);

		// set default value
		result.setRenderType(Kekule.Render.RendererType.R2D);
		result.setEnableEdit(true);
		result.setEnableEditFromVoid(true);
		result.setRestrainEditorWithCurrObj(false);  // can edit anything defaultly
		result.setEnableToolbar(true);
		result.setPredefinedSetting('fullFunc');  // enable all functions of composer

		var self = this;
		result.overwriteMethod('createToolButton', function($origin, btnName, parentGroup){
			if (btnName === BNS.config)
			{
				var result = new Kekule.Widget.Button(parentGroup);
				var action = self._configAction
				if (action)
					result.setAction(action);
				return result;
			}
			else
				return $origin(btnName, parentGroup);
		});
		/*
		var buttons = AU.exclude(result.getDefaultToolBarButtons(), BNS.config);
		buttons.push({
			'action': this._configAction
		});
		buttons.splice(2, 0, BNS.clearObjs);
		*/
		var buttons = Kekule.globalOptions.chemWidget.chemObjInserter.toolButtons;
		result.setToolbarParentElem(this._toolbarParentElem);
		result.setToolButtons(buttons); //.concat([{'text': 'MyButton', 'hint': 'Custom'}]));
		result.setToolbarPos(Kekule.Widget.Position.BOTTOM);
		result.setToolbarMarginVertical(-2);
		result.setToolbarEvokeModes([EM.ALWAYS]);

		result.addEventListener('resize', this.updateInfoLabel, this);
		result.addEventListener('load', this._reactViewerLoad, this);

		result.appendToElem(rootElem);
		//result.setToolbarEvokeModes([EM.ALWAYS]);
		result.setChemObj(this.getChemObj());

		this.setPropStoreFieldValue('viewer', result);

		this.backgroundColorChange();  // force change background color

		return result;
	},
	/** @private */
	_reactViewerLoad: function(e)
	{
		//console.log('load', e);
		// when loading a new object, empty the assoc3DChemObj
		if (!this._changingDisplayedChemObjFlag || this._changingDisplayedChemObjFlag <= 0)
		{
			var chemObj = e.obj || null;
			this.setPropStoreFieldValue('chemObj', chemObj);
			this.setAssoc3DChemObj(null);
			this.tryAutoGenerate3DCoordsForChemObjInViewer();
		}
	},
	/** @private */
	createToolbarParent: function(rootElem)
	{
		var result = rootElem.ownerDocument.createElement('div');
		result.className = CCNS.CHEMOBJSETTER_TOOLBAR_AREA;
		rootElem.appendChild(result);
		this._toolbarParentElem = result;
		return result;
	},
	/** @private */
	createTabs: function(rootElem)
	{
		var tabTexts = [Kekule.$L('ChemWidgetTexts.CAPTION_2D'), Kekule.$L('ChemWidgetTexts.CAPTION_3D')];
		var selIndex = (this.getRenderType() === Kekule.Render.RendererType.R3D)? 1: 0;
		var result = new Kekule.Widget.TabButtonGroup(this);
		result.setTabButtonPosition(Kekule.Widget.Position.BOTTOM);
		result.addClassName([CNS.DYN_CREATED, CCNS.CHEMOBJSETTER_TABGROUP]);
		var btns = [];
		for (var i = 0, l = tabTexts.length; i < l; ++i)
		{
			var btn = new Kekule.Widget.RadioButton(result);
			btn.setText(tabTexts[i]);
			if (i === selIndex)
				btn.setChecked(true);
			btns.push(btn);
		}
		result.addEventListener('switch', function(e){
			var btn = e.button;
			var index = btns.indexOf(btn);
			var rType = (index === 1)? Kekule.Render.RendererType.R3D: Kekule.Render.RendererType.R2D;
			this.setRenderType(rType);
			this.backgroundColorChange();  // force change background color
			this.tryAutoGenerate3DCoordsForChemObjInViewer();
		}, this);
		result.appendToElem(rootElem);
		this.setPropStoreFieldValue('tabs', result);

		return result;
	},
	/* @private */
	/*
	createOptionPanel: function(rootElem)
	{
		var result = new Kekule.Widget.Panel(this);
		result.addClassName([CNS.DYN_CREATED, CCNS.CHEMOBJSETTER_OPTIONPANEL]);
		result.appendToElem(rootElem);
		this.setPropStoreFieldValue('optionPanel', result);
		return result;
	},
	*/
	/** @private */
	createInfoLabel: function(rootElem, viewer)
	{
		var result = this.getDocument().createElement('div');
		result.className = CNS.DYN_CREATED + ' ' + CCNS.CHEMOBJSETTER_INFOLABEL;
		viewer.getElement().appendChild(result);
		this._infoLabel = result;
		return result;
	},
	/** @private */
	updateInfoLabel: function()
	{
		var viewer = this.getViewer();
		if (viewer && this._infoLabel)
		{
			var dim = viewer.getContextDimension();
			var s = dim? this._infoLabelTemplate.format(Math.round(dim.width), Math.round(dim.height)): '';
			Kekule.DomUtils.setElementText(this._infoLabel, s);
		}
	},
	/** @private */
	createStatusLabel: function(rootElem, viewer)
	{
		var result = this.getDocument().createElement('div');
		result.className = CNS.DYN_CREATED + ' ' + CCNS.CHEMOBJSETTER_STATUSLABEL;
		//result.innerHTML = 'status';
		viewer.getElement().appendChild(result);
		this._statusLabel = result;
		return result;
	},
	/** @private */
	_updateStatusLabel: function(message)
	{
		if (this._statusLabel)
		{
			this._statusLabel.innerHTML = message;
		}
	},

	/**
	 * Returns dimension of viewer context.
	 * @returns {Hash}
	 */
	getContextDimension: function()
	{
		return this.getViewer().getContextDimension();
	},

	/**
	 * Resize self to make viewer context at dimension.
	 * @param {Hash} dimension
	 */
	setContextDimension: function(dimension)
	{
		var oldDim = this.getContextDimension();
		var deltaW = dimension.width - oldDim.width;
		var deltaH = dimension.height - oldDim.height;
		//var elem = this.getElement();
		//Kekule.StyleUtils.getComputedStyle()
		var selfOldDim = this.getDimension();
		var selfNewDim = {'width': selfOldDim.width + deltaW, 'height': selfOldDim.height + deltaH};
		this.setDimension(selfNewDim.width, selfNewDim.height);
		return this;
	},

	/** @private */
	_getDisplayedChemObjForRenderType: function(renderType)
	{
		if (renderType === Kekule.Render.RendererType.R3D)
			return this.getAssoc3DChemObj() || this.getChemObj();
		else
			return this.getChemObj();
	},
	/** @private */
	_changeDisplayedChemObj: function(chemObj)
	{
		if (!this._changingDisplayedChemObjFlag)
			this._changingDisplayedChemObjFlag = 0
		++this._changingDisplayedChemObjFlag;
		try
		{
			this.getViewer().setChemObj(chemObj);
		}
		finally
		{
			--this._changingDisplayedChemObjFlag;
		}
	},

	// methods about 3D structure generation
	/**
	 * Returns the child object of chemObj that containing ctab.
	 * @returns {Bool}
	 * @private
	 */
	_getContainingMoleculesWithCtab: function(chemObj)
	{
		if (!chemObj)
			chemObj = this.getChemObj();
		if (chemObj instanceof Kekule.StructureFragment)
			return chemObj.hasCtab()? [chemObj]: [];
		else
		{
			var result = [];
			var structFragments = Kekule.ChemStructureUtils.getAllStructFragments(chemObj);
			for (var i = 0, l = structFragments.length; i < l; ++i)
			{
				var mol = structFragments[i];
				if (mol.hasCtab && mol.hasCtab())
					result.push(mol);
			}
			return result;
		}
	},
	/**
	 * Check if the chemObj is a single molecule without 3D coordinate and can do the 3D generation, if true, returns the generation target.
	 * @returns {Kekule.StructureFragment}
	 * @private
	 */
	_get3DCoordGenerationTargetForChemObj: function(chemObj)
	{
		if (!chemObj)
			chemObj = this.getChemObj();

		var mols = this._getContainingMoleculesWithCtab(chemObj);
		if (mols && mols.length === 1)
		{
			var mol = mols[0];
			return mol.nodesHasCoord3D(false)? null: mol;
		}
		else
			return null;
	},

	/** @private */
	_isCoordGeneratorAvailable: function(coordMode)
	{
		return this.getViewer()._isCoordGeneratorAvailable(coordMode);
		/*
		if ( Kekule.Calculator && Kekule.Calculator.Services)
		{
			var serviceName = (coordMode === Kekule.CoordMode.COORD3D) ? Kekule.Calculator.Services.GEN3D : Kekule.Calculator.Services.GEN2D;
			return Kekule.Calculator.hasService(serviceName)
		}
		else
			return false;
		*/
	},
	/*
	 * Returns whether a 3D coordinates generation can be done to current loaded chem object.
	 * @private
	 */
	/*
	canGenerate3DCoordForChemObj: function(chemObj)
	{
		if (!chemObj)
			chemObj = this.getChemObj();
		var result = !!(this._isCoordGeneratorAvailable(Kekule.CoordMode.COORD3D) && chemObj && this._get3DCoordGenerationTargetForChemObj(chemObj));
		return result;
	},
	*/
	/**
	 * Automatically generate 3D coordinates for loaded chem object.
	 * @param {Func} callback Callback of the 3D generation, has params (err, generatedMol);
	 * @private
	 */
	doGenerate3DCoordsForChemObjInViewer: function(callback)
	{
		var chemObj = this.getChemObj();
		var self = this;
		var done = function(err, generatedMol)
		{
			self.setStatusMessage('');  // calculation done, clear status
			if (callback)
				callback(err, generatedMol);
		};
		if (chemObj)
		{
			//if (Kekule.Calculator && Kekule.Calculator.hasService(Kekule.Calculator.Services.GEN3D))
			if (this._isCoordGeneratorAvailable(Kekule.CoordMode.COORD3D))
			{
				var targetMol = this._get3DCoordGenerationTargetForChemObj(chemObj);
				if (targetMol)  // we really can do the generation
				{
					self.setStatusMessage(Kekule.$L('ChemWidgetTexts.CAPTION_CHEMOBJINSERTER_GENERATING_3D_STRUCTURE'));
					/*
					Kekule.Calculator.generate3D(targetMol, null,
						function(generatedMol){
							done(null, generatedMol);
						},
						function(err){
							//console.log('error', err);
							done(err, null);
						});
					*/
					try
					{
						this.getViewer().autoGenerateChemObjCoords(done.bind(this, null), targetMol, Kekule.CoordMode.COORD3D);
					}
					catch(e)
					{
						done(e, chemObj);
					}
					return this;
				}
			}
		}
		// default, can not do the generation, return chemObj directly
		done(null, chemObj);
		return this;
	},
	/**
	 * Automatically generate 3D coordinates for loaded chem object.
	 * @param {Func} callback Callback of the 3D generation, has params (err, generatedMol);
	 * @private
	 */
	generate3DCoordsForChemObjInViewer: function(callback)
	{
		var self = this;
		this.doGenerate3DCoordsForChemObjInViewer(function(err, generatedMol){
			if (!err && generatedMol)  // the generation is done, show generatedMol in 3D viewer
			{
				self.setAssoc3DChemObj(generatedMol);
			}
		});
	},

	/** @private */
	_isMolContainingCoordsOfMode: function(mol, coordMode)
	{
		var hasCoords = (mol.getNodeCount() <= 0) || mol.nodesHasCoordOfMode(coordMode, false, true);
		return hasCoords;
	},
	/**
	 * If property enable3DStructureAutoGeneration is true, this function will automatically generate the 3D structure when switching to or loading mol in 3D viewer.
	 * @param {Func} callback Callback of the 3D generation, has params (err, generatedMol);
	 * @private
	 */
	tryAutoGenerate3DCoordsForChemObjInViewer: function(callback)
	{
		if (this.getEnable3DStructureAutoGeneration())
		{
			var renderType = this.getRenderType();
			if (renderType === Kekule.Render.RendererType.R3D && !this.getAssoc3DChemObj())
			{
				var chemObj = this.getChemObj();
				var targetObj = this._get3DCoordGenerationTargetForChemObj(chemObj);
				if (targetObj && !this._isMolContainingCoordsOfMode(targetObj, Kekule.CoordMode.COORD3D))  // need to auto generate
				{
					this.generate3DCoordsForChemObjInViewer(callback);
				}
			}
		}
	},

	// methods of export
	/**
	 * Export drawing content in viewer to a data URL for <img> tag to use.
	 * @param {String} dataType Type of image data, e.g. 'image/png'.
	 * @param {Hash} options Export options, usually this is a number between 0 and 1
	 *   indicating image quality if the requested type is image/jpeg or image/webp.
	 * @returns {String}
	 */
	exportToDataUri: function(dataType, options)
	{
		/*
		if (this.getAutoSizeExport())
			this.setAutoSize(true);
		*/
		var result = this.getViewer().exportToDataUri(dataType, options);
		//alert(result);
		/*
		if (this.getAutoSizeExport())  // restore
		{
			this.setAutoSize(false);
			var elem = this.getViewer().getElement();
			elem.style.width = 'auto';
			elem.style.height = 'auto';
			this.getViewer().resized();
		}
		*/
		return result;
	},
	/**
	 * Export drawing content in viewer and with additional informations (such as draw options).
	 * @param {String} dataType
	 * @param {Hash}options
	 * @returns {Hash}
	 * @deprecated
	 */
	exportDetails: function(dataType, options)
	{
		if (this.getAutoSizeExport())
			this.setAutoSize(true);
		var ops = this.getViewer().getActualDrawOptions();
		var dim = this.getViewer().getContextDimension();
		var currDisplayedObj = this.getCurrDisplayedChemObj();
		var result = currDisplayedObj? {
			'dataUri': this.exportToDataUri(dataType, options),
			'drawOptions': ops,
			'drawOptionsJson': JSON.stringify(ops),
			'chemObj': currDisplayedObj, //this.getChemObj(),
			'chemObjJson': Kekule.IO.saveMimeData(currDisplayedObj, 'chemical/x-kekule-json'),
			'autoSize': this.getAutoSizeExport(),
			'autofit': this.getAutofit(),
			'width': Math.round(dim.width),
			'height': Math.round(dim.height),
			'renderType': this.getRenderType() || Kekule.Render.RendererType.R2D,
			'backgroundColor': this.getBackgroundColor(this.getRenderType()),
			'predefinedSetting': this.getExportViewerPredefinedSetting()
		}: null;
		if (this.getAutoSizeExport())  // restore
		{
			this.setAutoSize(false);
			var elem = this.getViewer().getElement();
			elem.style.width = 'auto';
			elem.style.height = 'auto';
			this.getViewer().resized();
		}
		return result;
	},
	/**
	 * Returns the detail information about export drawing content in viewer and with additional informations.
	 * @param {String} dataType
	 * @param {Hash}options
	 * @param {Func} callback Callback function with a Hash param details.
	 * @deprecated
	 */
	getImgExportDetailsAsync: function(imgDataType, options, callback)
	{
		var details = this.exportDetails(imgDataType, options);
		callback(details);
	},

	/**
	 * If export viewer to a HTML img element, this method returns the essential attributes.
	 * @param {String} dataType Export image data type.
	 * @param {Hash} options
	 * @returns {Hash} Attribute/value pairs.
	 * @deprecated
	 */
	getExportImgElemAttributes: function(dataType, options)
	{
		var detail = this.exportDetails(dataType, options);
		if (!detail)
			return null;
		var style = 'width:' + detail.width + 'px; height:' + detail.height + 'px';
		/*
		if (detail.backgroundColor)
			style += '; background-color: ' + detail.backgroundColor;
		else if (this.getIs3D())
			style += '; background-color: #000';
		*/
		var result = {
			'src': detail.dataUri,
			'style': style,
			'width': detail.width,
			'height': detail.height,
			'data-kekule-widget': 'Kekule.ChemWidget.Viewer',
			'data-render-type': detail.renderType,
			'data-chem-obj': detail.chemObjJson,
			'data-draw-options': detail.drawOptionsJson,
			'data-predefined-setting': detail.predefinedSetting
		};
		if (Kekule.ObjUtils.notUnset(detail.autoSize))
			result['data-auto-size'] = detail.autoSize;
		if (Kekule.ObjUtils.notUnset(detail.autofit))
			result['data-autofit'] = detail.autofit;
		if (Kekule.ObjUtils.notUnset(detail.backgroundColor))
			result['data-background-color'] = detail.backgroundColor;
		return result;
	},
	/**
	 * If export viewer to a HTML img element, this method returns the essential attributes.
	 * @param {String} dataType Export image data type.
	 * @param {Hash} options
	 * @param {Func} callback A call back function with attribs param.
	 */
	getExportImgElemAttributesAsync: function(dataType, options, callback)
	{
		var attribs = this.getExportImgElemAttributes(dataType, options);
		callback(attribs);
	},

	/**
	 * Export viewer to a new created HTML img element.
	 * @param {HTMLElement} doc
	 * @param {String} dataType Export image data type
	 * @param {Hash} options
	 * @returns {HTMLElement}
	 */
	createExportImgElement: function(doc, dataType, options)
	{
		var attribs = this.getExportImgElemAttributes(dataType, options) || {};
		if (attribs)
		{
			//var detail = this.exportDetails(dataType, options);
			var result = doc.createElement('img');
			Kekule.DomUtils.setElemAttributes(result, attribs);
			return result;
		}
		else
			return null;
	},
	/**
	 * Export viewer to a new created HTML element.
	 * @param {HTMLElement} doc
	 * @param {String} imgDataType Export image data type
	 * @param {Hash} options
	 * @returns {HTMLElement}
	 */
	createExportHtmlElement: function(doc, imgDataType, options)
	{
		return this.createExportImgElement(doc, imgDataType, options);
	},
	/**
	 * Export viewer to a new created HTML element (async way).
	 * @param {HTMLElement} doc
	 * @param {String} imgDataType Export image data type
	 * @param {Hash} options
	 * @param {Func} callback callback(htmlElement)
	 * @returns {HTMLElement}
	 */
	createExportHtmlElementAsync: function(doc, imgDataType, options, callback)
	{
		try
		{
			var elem = this.createExportImgElement(doc, imgDataType, options);
			if (callback)
				callback(elem);
		}
		catch(e)
		{
			callback(null);
			throw e;
		}
	},

	/**
	 * Load a chem object and apply settings in this widget from specified attribs.
	 * @param {Kekule.ChemObject} chemObj
	 * @param {Hash} detail
	 * @deprecated
	 */
	importChemObjWithDetails: function(chemObj, detail)
	{
		this.setChemObj(chemObj);
		//if (detail.renderType)
		this.setRenderType(detail.renderType || Kekule.Render.RendererType.R2D);
		//console.log(detail);
		if (Kekule.ObjUtils.notUnset(detail.autoSize))
			this.setAutoSizeExport(!!detail.autoSize);
		if (Kekule.ObjUtils.notUnset(detail.autofit))
			this.setAutofit(!!detail.autofit);
		if (detail.width && detail.height && (!detail.autoSize || detail.renderType === Kekule.Render.RendererType.R3D))
			this.setContextDimension({'width': detail.width, 'height': detail.height});
		if (detail.drawOptions)
			this.getViewer().setDrawOptions(detail.drawOptions);
		if (detail.backgroundColor)
			this.setBackgroundColor(detail.backgroundColor, this.getRenderType());
		return this;
	},
	/**
	 * Load a chem object and apply settings in this widget from specified attribs.
	 * @param {Kekule.ChemObject} chemObj
	 * @param {Hash} detail
	 */
	importFromDetails: function(chemObj, detail)
	{
		return this.importChemObjWithDetails(chemObj, details);
	},

	/**
	 * Load a chem object and apply settings in this widget from hash attribs of an HTML element prviously exported.
	 * @param {Hash} attribs
	 */
	importFromElemAttribs: function(attribs)
	{
		//if (!attribs.width)
		attribs.width = DataType.JsonUtility.parse(attribs.width);
		//if (!attribs.height)
		attribs.height = DataType.JsonUtility.parse(attribs.height);
		var chemObjJson = attribs['data-chem-obj'];
		var chemObj = chemObjJson? Kekule.IO.loadMimeData(chemObjJson, 'chemical/x-kekule-json'): null;
		if (attribs['data-render-type'])
			attribs.renderType = DataType.JsonUtility.parse(attribs['data-render-type']);
		if (attribs['data-draw-options'])
			attribs.drawOptions = DataType.JsonUtility.parse(attribs['data-draw-options']);
		if (attribs['data-auto-size'])
			attribs.autoSize = DataType.JsonUtility.parse(attribs['data-auto-size']);
		if (attribs['data-autofit'])
			attribs.autofit = DataType.JsonUtility.parse(attribs['data-autofit']);
		if (attribs['data-background-color'])
			attribs.backgroundColor = attribs['data-background-color'];
		return this.importChemObjWithDetails(chemObj, attribs);
	},

	/**
	 * Load a chem object and apply settings in this widget from an HTML element previously exported.
	 * @param {HTMLElement} element
	 */
	importFromElem: function(element)
	{
		//var dim = Kekule.HtmlElementUtils.getElemBoundingClientRect(element);
		var dim = Kekule.HtmlElementUtils.getElemPageRect(element);
		var attribs = Kekule.DomUtils.fetchAttributeValuesToJson(element);
		if (!attribs.width)
			attribs.width = dim.width;
		if (!attribs.height)
			attribs.height = dim.height;
		return this.importFromElemAttribs(attribs);
	}
});

/**
 * A special widget class to open a config widget for ChemObjDisplayer.
 * Do not use this widget alone.
 * @class
 * @augments Kekule.Widget.Configurator
 */
Kekule.ChemWidget.ChemObjInserter.Configurator = Class.create(Kekule.Widget.Configurator,
/** @lends Kekule.ChemWidget.ChemObjInserter.Configurator# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ChemObjInserter.Configurator',
	/** @construct */
	initialize: function(/*$super, */widget)
	{
		this._checkBoxAutoSize = null;
		this._checkBoxAutofit = null;
		this._checkBoxShowInfo = null;
		this._textBoxWidth = null;
		this._textBoxHeight = null;
		this._colorPicker = null;
		this.tryApplySuper('initialize', [widget])  /* $super(widget) */;

		this.addEventListener('valueChange', function(e){ this.saveConfigValues(); }, this);
	},
	/** @ignore */
	initPropValues: function(/*$super*/)
	{
		this.tryApplySuper('initPropValues')  /* $super() */;
		this.setAutoUpdate(true);
	},
	/** @ignore */
	doGetWidgetClassName: function(/*$super*/)
	{
		return this.tryApplySuper('doGetWidgetClassName')  /* $super() */ + ' ' + CCNS.CHEMOBJSETTER_CONFIGURATOR;
	},
	/** @ignore */
	doCreateSubElements: function(doc, element)
	{
		// autosize and autofit
		var region = doc.createElement('div');
		region.className = CCNS.CHEMOBJSETTER_REGION;

		var checkBox = new Kekule.Widget.CheckBox(this);
		checkBox.setText(Kekule.$L('ChemWidgetTexts.CAPTION_AUTOSIZE'));
		checkBox.addClassName(CCNS.CHEMOBJSETTER_LINE);
		checkBox.appendToElem(region);
		this._checkBoxAutoSize = checkBox;
		var assocText = doc.createElement('span');
		assocText.className = CNS.PART_ASSOC_TEXT_CONTENT;
		DU.setElementText(assocText, Kekule.$L('ChemWidgetTexts.HINT_AUTOSIZE'));
		region.appendChild(assocText);

		var checkBox = new Kekule.Widget.CheckBox(this);
		checkBox.setText(Kekule.$L('ChemWidgetTexts.CAPTION_AUTOFIT'));
		checkBox.addClassName(CCNS.CHEMOBJSETTER_LINE);
		checkBox.appendToElem(region);
		this._checkBoxAutofit = checkBox;
		var assocText = doc.createElement('span');
		assocText.className = CNS.PART_ASSOC_TEXT_CONTENT;
		DU.setElementText(assocText, Kekule.$L('ChemWidgetTexts.HINT_AUTOFIT'));
		region.appendChild(assocText);

		element.appendChild(region);

		// width/height setter
		var region = doc.createElement('div');
		region.className = CCNS.CHEMOBJSETTER_REGION;
		var labelElem = doc.createElement('label');
		labelElem.className = CCNS.CHEMOBJSETTER_REGION_LABEL;
		DU.setElementText(labelElem, Kekule.$L('ChemWidgetTexts.CAPTION_LABEL_SIZE'));
		region.appendChild(labelElem);
		region.appendChild(doc.createElement('br'));
		var textBox = new Kekule.Widget.TextBox(this);
		textBox.setPlaceholder(Kekule.$L('ChemWidgetTexts.PLACEHOLDER_WIDTH'));
		textBox.appendToElem(region);
		this._textBoxWidth = textBox;
		var labelElem = doc.createElement('span');
		DU.setElementText(labelElem, '×');
		region.appendChild(labelElem);
		var textBox = new Kekule.Widget.TextBox(this);
		textBox.setPlaceholder(Kekule.$L('ChemWidgetTexts.PLACEHOLDER_HEIGHT'));
		textBox.appendToElem(region);
		this._textBoxHeight = textBox;
		var checkBox = new Kekule.Widget.CheckBox(this);
		checkBox.setText(Kekule.$L('ChemWidgetTexts.CAPTION_SHOWSIZEINFO'));
		checkBox.appendToElem(region);
		this._checkBoxShowInfo = checkBox;
		element.appendChild(region);

		// background color setter
		var region = doc.createElement('div');
		region.className = CCNS.CHEMOBJSETTER_REGION;
		var labelElem = doc.createElement('label');
		labelElem.className = CCNS.CHEMOBJSETTER_REGION_LABEL;
		DU.setElementText(labelElem, Kekule.$L('ChemWidgetTexts.CAPTION_BACKGROUND_COLOR'));
		region.appendChild(labelElem);
		region.appendChild(doc.createElement('br'));
		var colorPicker = new Kekule.Widget.ColorPicker(this);
		colorPicker.setSpecialColors([
			Kekule.Widget.ColorPicker.SpecialColors.TRANSPARENT
		]);
		colorPicker.appendToElem(region);
		this._colorPicker = colorPicker;
		element.appendChild(region);
	},
	/** @private */
	loadConfigValues: function(/*$super*/)
	{
		this.tryApplySuper('loadConfigValues')  /* $super() */;
		var w = this.getWidget();
		if (w)
		{
			var is2D = !w.getIs3D();
			this._checkBoxAutoSize.setChecked(is2D && w.getAutoSizeExport());
			this._checkBoxAutoSize.setEnabled(is2D);
			this._checkBoxAutofit.setChecked(is2D && w.getAutofit());
			this._checkBoxAutofit.setEnabled(is2D);
			this._checkBoxShowInfo.setChecked(w.getShowInfo());
			var dim = w.getContextDimension();
			this._textBoxWidth.setText(Math.round(dim.width));
			this._textBoxHeight.setText(Math.round(dim.height));
			var color = is2D? w.getBackgroundColor2D(): w.getBackgroundColor3D();
			this._colorPicker.setValue(color || Kekule.Widget.ColorPicker.SpecialColors.TRANSPARENT);
		}
	},
	/** @private */
	saveConfigValues: function(/*$super*/)
	{
		this.tryApplySuper('saveConfigValues')  /* $super() */;
		var w = this.getWidget();
		if (w)
		{
			var is2D = !w.getIs3D();
			if (is2D)
			{
				w.setAutoSizeExport(this._checkBoxAutoSize.getChecked());
				w.setAutofit(this._checkBoxAutofit.getChecked());

				w.setBackgroundColor2D(this._colorPicker.getValue());
			}
			else
			{
				w.setBackgroundColor3D(this._colorPicker.getValue());
			}
			w.setShowInfo(this._checkBoxShowInfo.getChecked());
			var dim = {width: parseInt(this._textBoxWidth.getText()), height: parseInt(this._textBoxHeight.getText())};
			w.setContextDimension(dim);

			w.invokeEvent('configSave');  // a special event invoked on parent widget, indicating the config value has been changed
		}
	}
});


Kekule._registerAfterLoadSysProc(function(){

// the following code will be run after both spectroscopy and widget modules are loaded
if (!Kekule.ChemWidget || !Kekule.Spectroscopy)
	return;

/** @ignore */
Kekule.globalOptions.add('chemWidget.spectrumObjInserter', {
	toolButtons: [
		BNS.loadData,
		BNS.saveData,
		BNS.clearObjs,
		BNS.changeSpectrumSection,
		BNS.zoomIn, BNS.zoomOut,
		BNS.reset,
		BNS.copy,
		BNS.config
	]
});

/**
 * A widget to insert spectrum elements to HTML document.
 * This widget is mainly designed for extra web editor plugins or browser addons.
 * @class
 * @augments Kekule.ChemWidget.AbstractWidget
 *
 * @property {Kekule.ChemWidget.SpectrumInspector} spectrumInspector The SpectrumInspector instance embedded in this widget.
 * @property {Kekule.ChemObject} chemObj The root object in spectrum inspector.
 * @property {Bool} showInfo Whether info label is shown.
 */
Kekule.ChemWidget.SpectrumObjInserter = Class.create(Kekule.ChemWidget.AbstractWidget,
/** @lends Kekule.ChemWidget.SpectrumObjInserter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.SpectrumObjInserter',
	/** @private */
	DEF_BGCOLOR_2D: 'transparent',
	/** @construct */
	initialize: function(parentOrElementOrDocument, spectrum)
	{
		this._configAction = new Kekule.Widget.ActionOpenConfigWidget(this);
		this._toolbarParentElem = null;
		this._infoLabel = null;
		this._infoLabelTemplate = Kekule.$L('ChemWidgetTexts.CAPTION_WIDTH_HEIGHT');
		this.tryApplySuper('initialize', [parentOrElementOrDocument]);
	},
	/** @private */
	doFinalize: function()
	{
		if (this._configAction)
			this._configAction.finalize();
		var inspector = this.getPropStoreFieldValue('spectrumInspector');
		if (inspector)
			inspector.finalize();
		var panel = this.getPropStoreFieldValue('clientPanel');
		if (panel)
			panel.finalize();
		this.tryApplySuper('doFinalize');
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('spectrumInspector', {
			'dataType': 'Kekule.ChemWidget.SpectrumInspector', 'serializable': false, 'setter': null,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('spectrumInspector');
				if (!result)
				{
					result = this.createSpectrumInspector();
					this.setPropStoreFieldValue('spectrumInspector', result);
				}
				return result;
			}
		});
		this.defineProp('chemObj', {'dataType': 'Kekule.ChemObject', 'serializable': false, 'scope': PS.PUBLIC,
			'getter': function()
			{
				var inspector = this.getPropStoreFieldValue('spectrumInspector');
				return inspector? inspector.getChemObj(): this.getPropStoreFieldValue('chemObj');
			},
			'setter': function(value)
			{
				//var oldObj = this.getPropStoreFieldValue('chemObj');
				//if (value !== oldObj)  // some times oldObj itself may change and may need to repaint
				{
					this.setPropStoreFieldValue('chemObj', value);
					if (this.getSpectrumInspector())
						this.getSpectrumInspector().setChemObj(value);
				}
			}
		});
		this.defineProp('showInfo', {'dataType': DataType.BOOL, 'serializable': false,
			'getter': function()
			{
				return this._infoLabel && Kekule.StyleUtils.isShown(this._infoLabel);
			},
			'setter': function(value)
			{
				if (this._infoLabel)
					Kekule.StyleUtils.setDisplay(this._infoLabel, value);
			}
		});
		/*
		this.defineProp('backgroundColor', {'dataType': DataType.STRING,
			'setter': function(value) { this.setPropStoreFieldValue('backgroundColor', value); this.backgroundColorChange(); }
		});
		*/
		//this.defineProp('exportViewerPredefinedSetting', {'dataType': DataType.STRING});

		this.defineProp('clientPanel', {'dataType': DataType.OBJECT, 'serializable': false, 'setter': false, 'scope': PS.PRIVATE});

		// spectrum inspector delegated properties
		this._defineSpectrumInspectorDelegatedProperties([
			'spectrumViewportRanges', 'backgroundColor',
			'enableHotTrack', 'enableSelect', 'enableMultiSelect',
			'enableDirectInteraction', 'enableTouchInteraction', 'enableGestureInteraction',
			'chemObjLoaded', 'renderConfigs', 'viewerConfigs', 'toolButtons',
			'spectrumViewerDrawOptions',
			'assocViewerDrawOptions', 'assocViewerConfigs', 'assocViewerAllowCoordBorrow',
			'assocViewerAutoSize', 'assocViewerAutofit', 'assocViewerAutoShrink',
			'assocViewerAllowedMolDisplayTypes', 'assocViewerVisualMode', 'assocViewerSize'
		]);
	},

	/**
	 *  Defines properties directly map to properties of spectrum inspector.
	 *  The propNames is a array, each item is either a simple string for the property name (same in this and targetWidget)
	 *  or an array of [propertyNameForThis, propertyNameInTarget].
	 *  @param {Array} propNames
	 *  @private
	 */
	_defineSpectrumInspectorDelegatedProperties: function(propNames)
	{
		var targetWidgetClass = Kekule.ChemWidget.SpectrumInspector;

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
				if (targetPropInfo.getter)
				{
					propOptions.getter = function()
					{
						var target = this.getSpectrumInspector();
						return target? target.getPropValue(targetPropName): undefined;
					};
				}
				if (targetPropInfo.setter)
				{
					propOptions.setter = function(value)
					{
						var target = this.getSpectrumInspector();
						if (target)
							target.setPropValue(targetPropName, value);
					}
				}
				self.defineProp(propName, propOptions);
			})(targetWidgetClass, propName, targetPropName);
		}
	},
	/** @private */
	loadPredefinedResDataToProp: function(propName, resData, success)
	{
		if (propName === 'chemObj')  // only this property can be set by predefined resource
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
	/** @ignore */
	doGetWidgetClassName: function(/*$super*/)
	{
		var result = this.tryApplySuper('doGetWidgetClassName') + ' ' + CCNS.SPECTRUMOBJ_INSERTER;
		return result;
	},
	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('div');
		return result;
	},
	/** @ignore */
	doCreateSubElements: function(doc, rootElem)
	{
		var result = this.tryApplySuper('doCreateSubElements', [doc, rootElem]);
		var containerElem = doc.createElement('div');
		containerElem.className = CCNS.SPECTRUMOBJ_INSERTER_CONTAINER_ELEM;
		this._containerElem = containerElem;
		// create child widgets
		// toolbar
		this.createToolbarParent(containerElem);
		// client
		var clientPanel = new Kekule.Widget.Panel(this);
		clientPanel.addClassName(CCNS.SPECTRUMOBJ_INSERTER_CLIENT);
		clientPanel.setUseCornerDecoration(false);
		clientPanel.appendToElem(containerElem);
		this.setPropStoreFieldValue('clientPanel', clientPanel);
		this.createSpectrumInspector(clientPanel.getCoreElement());
		this.createInfoLabel(clientPanel.getCoreElement(), this.getSpectrumInspector());

		rootElem.appendChild(containerElem);

		if (this.setResizable)
			this.setResizable(true);

		return result;
	},

	/** @ignore */
	getResizerElement: function()
	{
		return this.getClientPanel()? this.getClientPanel().getCoreElement(): this.getCoreElement();
	},

	/** @private */
	createSpectrumInspector: function(rootElem)
	{
		var BNS = Kekule.ChemWidget.ComponentWidgetNames;
		var EM = Kekule.Widget.EvokeMode;
		var result = new Kekule.ChemWidget.SpectrumInspector(this);
		result.addClassName([CNS.DYN_CREATED, CCNS.SPECTRUMOBJ_INSERTER_SPECTRUM_INSPECTOR]);

		// set default value
		/*
		var buttons = AU.exclude(result.getToolButtons(), BNS.config);
		buttons.push({
			'action': this._configAction
		});
		buttons.splice(2, 0, BNS.clearObjs);
		*/
		var self = this;
		result.getSpectrumViewer().overwriteMethod('createToolButton', function($origin, btnName, parentGroup){
			if (btnName === BNS.config)
			{
				var result = new Kekule.Widget.Button(parentGroup);
				var action = self._configAction
				if (action)
					result.setAction(action);
				return result;
			}
			else
				return $origin(btnName, parentGroup);
		});

		var buttons = Kekule.globalOptions.chemWidget.spectrumObjInserter.toolButtons;
		result.setToolbarParentElem(this._toolbarParentElem);
		result.setToolButtons(buttons);
		result.setToolbarPos(Kekule.Widget.Position.BOTTOM);
		result.setToolbarMarginVertical(-2);
		result.getSpectrumViewer().setToolbarEvokeModes([EM.ALWAYS]);
		result.getAssocViewer().setToolbarEvokeModes([]);
		//result.setResizable(true);

		//result.getAssocViewerConfigs().getInteractionConfigs().setEnableBasicObjectSelect(false).setEnableBasicObjectHotTrack(false);
		//result.getSpectrumViewerConfigs().getInteractionConfigs().setEnableBasicObjectSelect(false).setEnableBasicObjectHotTrack(false);
		//result.getSpectrumViewerConfigs().getSpectrumViewConfigs().setEnableSpectrumDataSelectOnMode({'default': false}).setEnableSpectrumDataHotTrackOnMode({'default': false});

		result.addEventListener('resize', this.updateInfoLabel, this);
		result.appendToElem(rootElem);
		result.setChemObj(this.getChemObj());

		this.setPropStoreFieldValue('spectrumInspector', result);

		//this.backgroundColorChange();  // force change background color

		return result;
	},
	/** @private */
	createToolbarParent: function(rootElem)
	{
		var result = rootElem.ownerDocument.createElement('div');
		result.className = CCNS.SPECTRUMOBJ_INSERTER_TOOLBAR_AREA;
		rootElem.appendChild(result);
		this._toolbarParentElem = result;
		return result;
	},
	/** @private */
	createInfoLabel: function(parentElem, spectrumInspector)
	{
		var result = this.getDocument().createElement('div');
		result.className = CNS.DYN_CREATED + ' ' + CCNS.SPECTRUMOBJ_INSERTER_INFOLABEL;
		parentElem.appendChild(result);
		this._infoLabel = result;
		return result;
	},
	/** @private */
	updateInfoLabel: function()
	{
		var spectrumInspector = this.getSpectrumInspector();
		if (spectrumInspector && this._infoLabel)
		{
			var dim = spectrumInspector.getDimension();
			var s = dim? this._infoLabelTemplate.format(Math.round(dim.width), Math.round(dim.height)): '';
			Kekule.DomUtils.setElementText(this._infoLabel, s);
		}
	},
	/**
	 * Returns dimension of spectrum inspector.
	 * @returns {Hash}
	 */
	getSpectrumInspectorDimension: function()
	{
		return this.getSpectrumInspector().getDimension();
	},
	/**
	 * Resize self to make viewer context at dimension.
	 * @param {Hash} dimension
	 */
	setSpectrumInspectorDimension: function(dimension)
	{
		var oldDim = this.getSpectrumInspectorDimension();
		var deltaW = dimension.width - oldDim.width;
		var deltaH = dimension.height - oldDim.height;
		var selfOldDim = this.getDimension();
		var selfNewDim = {'width': selfOldDim.width + deltaW, 'height': selfOldDim.height + deltaH};
		//console.log(oldDim, dimension, deltaW, deltaH, selfOldDim, selfNewDim);
		this.setDimension(selfNewDim.width, selfNewDim.height);
		return this;
	},
	/** @private */
	getImgExportDetailsAsync: function(imgDataType, options, callback)
	{
		try
		{
			var spectrumInspector = this.getSpectrumInspector();
			var chemObj = spectrumInspector.getChemObj();
			if (chemObj)
			{
				var details = {
					'backgroundColor': spectrumInspector.getBackgroundColor(),
					'enableHotTrack': spectrumInspector.getEnableHotTrack(),
					'enableSelect': spectrumInspector.getEnableSelect(),
					'enableMultiSelect': spectrumInspector.getEnableMultiSelect(),
					'spectrumViewerDrawOptions': spectrumInspector.getSpectrumViewerDrawOptions(), //spectrumInspector.getSpectrumViewer().getActualDrawOptions(),
					'spectrumViewerDrawOptionsJson': spectrumInspector.getSpectrumViewerDrawOptions() ?
						JSON.stringify(spectrumInspector.getSpectrumViewerDrawOptions()) : '',
					'spectrumViewportRanges': spectrumInspector.getSpectrumViewportRanges(),
					'spectrumViewportRangesJson': spectrumInspector.getSpectrumViewportRanges() ?
						JSON.stringify(spectrumInspector.getSpectrumViewportRanges()) : '',
					'assocViewerDrawOptions': spectrumInspector.getAssocViewerDrawOptions(), // spectrumInspector.getAssocViewer().getActualDrawOptions(),
					'assocViewerDrawOptionsJson': spectrumInspector.getAssocViewerDrawOptions() ?
						JSON.stringify(spectrumInspector.getAssocViewerDrawOptions()) : '',
					'assocViewerVisualMode': spectrumInspector.getAssocViewerVisualMode(),
					'assocViewerSize': spectrumInspector.getAssocViewerSize(),
					'chemObj': chemObj,
					'chemObjJson': Kekule.IO.saveMimeData(this.getChemObj(), Kekule.IO.MimeType.KEKULE_JSON)
				};
				spectrumInspector.exportToDataUriAsync(imgDataType, options, function (dataUri, dimension)
				{
					details.dataUri = dataUri;
					details.width = Math.round(dimension.width);
					details.height = Math.round(dimension.height);
					callback(details);
				});
			}
			else
			{
				callback(null);
			}
		}
		catch(e)
		{
			callback(null);
			throw e;
		}
	},
	/**
	 * If export spectrum to a HTML img element, this method returns the essential attributes.
	 * @param {String} dataType Export image data type.
	 * @param {Hash} options
	 * @param {Func} callback With hash param attribs.
	 * @returns {Hash} Attribute/value pairs.
	 */
	getExportImgElemAttributesAsync: function(dataType, options, callback)
	{
		this.getImgExportDetailsAsync(dataType, options, function(detail){
			if (detail)
			{
				var style = 'width:' + detail.width + 'px; height:' + detail.height + 'px';
				var attribs = {
					'src': detail.dataUri,
					'style': style,
					'width': detail.width,
					'height': detail.height,
					'data-kekule-widget': 'Kekule.ChemWidget.SpectrumInspector',
					'data-chem-obj': detail.chemObjJson,
					'data-spectrum-viewer-draw-options': detail.spectrumViewerDrawOptionsJson,
					'data-assoc-viewer-draw-options': detail.assocViewerDrawOptionsJson
				};
				if (Kekule.ObjUtils.notUnset(detail.assocViewerVisualMode))
					attribs['data-assoc-viewer-visual-mode'] = JSON.stringify(detail.assocViewerVisualMode);
				if (Kekule.ObjUtils.notUnset(detail.assocViewerSize))
					attribs['data-assoc-viewer-size'] = detail.assocViewerSize;
				if (detail.spectrumViewportRangesJson)
					attribs['data-spectrum-viewport-ranges'] = detail.spectrumViewportRangesJson;
				if (OU.notUnset(detail.enableHotTrack))
					attribs['data-enable-hot-track'] = detail.enableHotTrack;
				if (OU.notUnset(detail.enableSelect))
					attribs['data-enable-select'] = detail.enableSelect;
				if (OU.notUnset(detail.enableMultiSelect))
					attribs['data-enable-multi-select'] = detail.enableMultiSelect;
				if (Kekule.ObjUtils.notUnset(detail.backgroundColor))
					attribs['data-background-color'] = detail.backgroundColor;
				callback(attribs);
			}
			else
				callback(null);
		});

		/*
		if (detail.backgroundColor)
			style += '; background-color: ' + detail.backgroundColor;
		else if (this.getIs3D())
			style += '; background-color: #000';
		*/

	},
	/** @private */
	exportToSingleImgElementAsync: function(doc, imgDataType, options, callback)
	{
		//this.getImgExportDetailsAsync(imgDataType, options, function(details){
		this.getExportImgElemAttributesAsync(imgDataType, options, function(details){
			if (!details)  // failed
			{
				callback(null);
			}
			else  // success
			{
				var img = doc.createElement('img');
				/*
				img.setAttribute('style', 'width:' + details.width + 'px; height:' + details.height + 'px');
				img.setAttribute('src', details.dataUri);
				img.setAttribute('data-kekule-widget', 'Kekule.ChemWidget.SpectrumInspector');
				if (details.chemObj)
					img.setAttribute('data-chem-obj', details.chemObjJson);
				if (details.spectrumViewportRanges)
					img.setAttribute('data-spectrum-viewport-ranges', details.spectrumViewportRangesJson);
				if (details.spectrumViewerDrawOptions)
					img.setAttribute('data-spectrum-viewer-draw-options', details.spectrumViewerDrawOptionsJson);
				if (details.assocViewerDrawOptions)
					img.setAttribute('data-assoc-viewer-draw-options', details.assocViewerDrawOptionsJson);
				if (details.backgroundColor)
					img.setAttribute('data-background-color', details.backgroundColor);
				if (OU.notUnset(details.enableHotTrack))
					img.setAttribute('data-enable-hot-track', details.enableHotTrack);
				if (OU.notUnset(details.enableSelect))
					img.setAttribute('data-enable-select', details.enableSelect);
				if (OU.notUnset(details.enableMultiSelect))
					img.setAttribute('data-enable-multi-select', details.enableMultiSelect);
				*/
				Kekule.DomUtils.setElemAttributes(img, details);
				callback(img);
			}
		});
	},
	/*
	 * Export viewer to a new created HTML element.
	 * @param {HTMLElement} doc
	 * @param {String} imgDataType Export image data type
	 * @param {Hash} options
	 * @returns {HTMLElement}
	 */
	/*
	createExportHtmlElement: function(doc, imgDataType, options)
	{

	},
	*/
	/**
	 * Export viewer to a new created HTML element (async way).
	 * @param {HTMLElement} doc
	 * @param {String} imgDataType Export image data type
	 * @param {Hash} options
	 * @param {Func} callback callback(htmlElement)
	 * @returns {HTMLElement}
	 */
	createExportHtmlElementAsync: function(doc, imgDataType, options, callback)
	{
		this.exportToSingleImgElementAsync(doc, imgDataType, options, function(imgElem){
			if (callback)
				callback(imgElem);
		});
	},

	/**
	 * Load spectrum object and apply settings in this widget from specified attribs.
	 * @param {Kekule.ChemObject} chemObj
	 * @param {Hash} detail
	 */
	importFromDetails: function(chemObj, detail)
	{
		this.setChemObj(chemObj);

		this.getSpectrumInspector().beginUpdate();
		try
		{
			if (detail.spectrumViewportRanges)
				this.setSpectrumViewportRanges(detail.spectrumViewportRanges);
			if (detail.spectrumViewerDrawOptions)
				this.setSpectrumViewerDrawOptions(detail.spectrumViewerDrawOptions);
			if (detail.assocViewerDrawOptions)
				this.setAssocViewerDrawOptions(detail.assocViewerDrawOptions);
			if (detail.backgroundColor)
				this.setBackgroundColor(detail.backgroundColor);
			if (OU.notUnset(detail.enableHotTrack))
				this.setEnableHotTrack(detail.enableHotTrack);
			if (OU.notUnset(detail.enableSelect))
				this.setEnableSelect(detail.enableSelect);
			if (OU.notUnset(detail.enableMultiSelect))
				this.setEnableMultiSelect(detail.enableMultiSelect);
			if (OU.notUnset(detail.assocViewerVisualMode))
				this.setAssocViewerVisualMode(detail.assocViewerVisualMode);
			if (OU.notUnset(detail.assocViewerSize))
				this.setAssocViewerSize(detail.assocViewerSize);
			if (detail.width && detail.height)
			{
				this.setSpectrumInspectorDimension({width: detail.width, height: detail.height});
			}
		}
		finally
		{
			this.getSpectrumInspector().endUpdate();
		}
		return this;
	},

	/**
	 * Load spectrum and apply settings in this widget from hash attribs of an HTML element previously exported.
	 * @param {Hash} attribs
	 */
	importFromElemAttribs: function(attribs)
	{
		//if (!attribs.width)
		attribs.width = DataType.JsonUtility.parse(attribs.width);
		//if (!attribs.height)
		attribs.height = DataType.JsonUtility.parse(attribs.height);
		var chemObjJson = attribs['data-chem-obj'];
		var chemObj = chemObjJson? Kekule.IO.loadMimeData(chemObjJson, 'chemical/x-kekule-json'): null;
		if (attribs['data-spectrum-viewport-ranges'])
			attribs.spectrumViewportRanges = DataType.JsonUtility.parse(attribs['data-spectrum-viewport-ranges']);
		if (attribs['data-spectrum-viewer-draw-options'])
			attribs.spectrumViewerDrawOptions = DataType.JsonUtility.parse(attribs['data-spectrum-viewer-draw-options']);
		if (attribs['data-assoc-viewer-draw-options'])
			attribs.assocViewerDrawOptions = DataType.JsonUtility.parse(attribs['data-assoc-viewer-draw-options']);
		if (attribs['data-background-color'])
			attribs.backgroundColor = attribs['data-background-color'];
		if (attribs['data-enable-hot-track'])
			attribs.enableHotTrack = DataType.JsonUtility.parse(attribs['data-enable-hot-track']);
		if (attribs['data-enable-select'])
			attribs.enableSelect = DataType.JsonUtility.parse(attribs['data-enable-select']);
		if (attribs['data-enable-multi-select'])
			attribs.enableMultiSelect = DataType.JsonUtility.parse(attribs['data-enable-multi-select']);
		if (attribs['data-assoc-viewer-visual-mode'])
			attribs.assocViewerVisualMode = DataType.JsonUtility.parse(attribs['data-assoc-viewer-visual-mode']);
		return this.importFromDetails(chemObj, attribs);
	},

	/**
	 * Load spectrum object and apply settings in this widget from an HTML element previously exported.
	 * @param {HTMLElement} element
	 */
	importFromElem: function(element)
	{
		var dim = Kekule.HtmlElementUtils.getElemPageRect(element);
		var attribs = Kekule.DomUtils.fetchAttributeValuesToJson(element);
		if (!attribs.width)
			attribs.width = dim.width;
		if (!attribs.height)
			attribs.height = dim.height;
		return this.importFromElemAttribs(attribs);
	}
});

/**
 * A special widget class to open a config widget for ChemObjDisplayer.
 * Do not use this widget alone.
 * @class
 * @augments Kekule.Widget.Configurator
 */
Kekule.ChemWidget.SpectrumObjInserter.Configurator = Class.create(Kekule.Widget.Configurator,
/** @lends Kekule.ChemWidget.SpectrumObjInserter.Configurator# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.SpectrumObjInserter.Configurator',
	/** @construct */
	initialize: function(widget)
	{
		this.tryApplySuper('initialize', [widget])  /* $super(widget) */;

		this.addEventListener('valueChange', this._reactInputWidgetValueChange.bind(this));
	},
	/** @ignore */
	initPropValues: function(/*$super*/)
	{
		this.tryApplySuper('initPropValues')  /* $super() */;
		this.setAutoUpdate(true);
	},
	/** @ignore */
	doGetWidgetClassName: function(/*$super*/)
	{
		return this.tryApplySuper('doGetWidgetClassName')  + ' ' + CCNS.SPECTRUMOBJ_INSERTER_CONFIGURATOR
			+ ' ' + CCNS.CHEMOBJSETTER_CONFIGURATOR;  // copy styles from chemObjSetter
	},
	/** @ignore */
	doCreateSubElements: function(doc, element)
	{
		// interactions
		var region = doc.createElement('div');
		region.className = CCNS.CHEMOBJSETTER_REGION;

		var labelElem = doc.createElement('label');
		labelElem.className = CCNS.CHEMOBJSETTER_REGION_LABEL;
		DU.setElementText(labelElem, Kekule.$L('ChemWidgetTexts.CAPTION_INTERACTIONS'));
		region.appendChild(labelElem);
		region.appendChild(doc.createElement('br'));

		var checkBox = new Kekule.Widget.CheckBox(this);
		checkBox.setText(Kekule.$L('ChemWidgetTexts.CAPTION_ENABLE_HOTTRACK'))
			.addClassName(CCNS.CHEMOBJSETTER_LINE)
			.appendToElem(region);
		this._checkBoxEnableHotTrack = checkBox;

		var checkBox = new Kekule.Widget.CheckBox(this);
		checkBox.setText(Kekule.$L('ChemWidgetTexts.CAPTION_ENABLE_SELECT'))
			.addClassName(CCNS.CHEMOBJSETTER_LINE)
			.appendToElem(region);
		this._checkBoxEnableSelect = checkBox;

		var checkBox = new Kekule.Widget.CheckBox(this);
		checkBox.setText(Kekule.$L('ChemWidgetTexts.CAPTION_ENABLE_MULTISELECT'))
			.addClassName(CCNS.CHEMOBJSETTER_LINE)
			.appendToElem(region);
		this._checkBoxEnableMultiSelect = checkBox;

		element.appendChild(region);

		// assoc visual mode
		var region = doc.createElement('div');
		region.className = CCNS.CHEMOBJSETTER_REGION;
		var labelElem = doc.createElement('label');
		labelElem.className = CCNS.CHEMOBJSETTER_REGION_LABEL;
		DU.setElementText(labelElem, Kekule.$L('ChemWidgetTexts.CAPTION_ASSOC_VIEWER_VISUAL_MODE'));
		region.appendChild(labelElem);
		region.appendChild(doc.createElement('br'));

		var AVVM = Kekule.ChemWidget.SpectrumInspector.AssocViewerVisualMode;
		var selectBox = new Kekule.Widget.SelectBox(this);
		selectBox.setItems([
			{text: Kekule.$L('ChemWidgetTexts.CAPTION_ASSOC_VIEWER_VISUAL_MODE_AUTO'), value: AVVM.AUTO},
			{text: Kekule.$L('ChemWidgetTexts.CAPTION_ASSOC_VIEWER_VISUAL_MODE_VISIBLE'), value: AVVM.VISIBLE},
			{text: Kekule.$L('ChemWidgetTexts.CAPTION_ASSOC_VIEWER_VISUAL_MODE_INVISIBLE'), value: AVVM.INVISIBLE}
		])
			.addClassName(CCNS.CHEMOBJSETTER_LINE)
			.appendToElem(region);
		this._selectBoxAssocViewerVisualMode = selectBox;

		// assoc size
		var region = doc.createElement('div');
		region.className = CCNS.CHEMOBJSETTER_REGION;
		var labelElem = doc.createElement('label');
		labelElem.className = CCNS.CHEMOBJSETTER_REGION_LABEL;
		DU.setElementText(labelElem, Kekule.$L('ChemWidgetTexts.CAPTION_ASSOC_VIEWER_SIZE'));
		region.appendChild(labelElem);
		region.appendChild(doc.createElement('br'));
		var inputElem = doc.createElement('input');
		inputElem.setAttribute('type', 'range');
		inputElem.setAttribute('min', '0');
		inputElem.setAttribute('max', '100');
		inputElem.setAttribute('step', '5');
		var reactRawInputElemValueChangeBind = this._reactRawInputElemValueChange.bind(this);
		Kekule.X.Event.addListener(inputElem, 'change', reactRawInputElemValueChangeBind);
		Kekule.X.Event.addListener(inputElem, 'input', reactRawInputElemValueChangeBind);
		this._assocViewerSizeInputElem = inputElem;
		region.appendChild(inputElem);

		element.appendChild(region);

		// background color setter
		var region = doc.createElement('div');
		region.className = CCNS.CHEMOBJSETTER_REGION;
		var labelElem = doc.createElement('label');
		labelElem.className = CCNS.CHEMOBJSETTER_REGION_LABEL;
		DU.setElementText(labelElem, Kekule.$L('ChemWidgetTexts.CAPTION_BACKGROUND_COLOR'));
		region.appendChild(labelElem);
		region.appendChild(doc.createElement('br'));
		var colorPicker = new Kekule.Widget.ColorPicker(this);
		colorPicker.setSpecialColors([
			Kekule.Widget.ColorPicker.SpecialColors.TRANSPARENT
		]);
		colorPicker.appendToElem(region);
		this._colorPicker = colorPicker;
		element.appendChild(region);
	},

	/** @private */
	_reactInputWidgetValueChange: function(e)
	{
		this.saveConfigValues();
	},
	/** @private */
	_reactRawInputElemValueChange: function(e)
	{
		this.saveConfigValues();
	},

	/** @private */
	_getSpectrumInspectorAssovViewerSizePercent: function()
	{
		var result = this.__$spectrumInspectorAssocViewerSizePercent$__;
		if (OU.isUnset(result))
		{
			var w = this.getWidget();
			w = w && w.getSpectrumInspector();
			if (w)
			{
				var size = w.getAssocViewerSize();
				if (size && typeof(size) === 'string')
				{
					var unitsValue = Kekule.StyleUtils.analysisUnitsValue(size);
					if (unitsValue.units = '%')
						result = unitsValue.value;
				}

				if (OU.isUnset(result))
				{
					var totalDim = w.getDimension() || {};
					var assocViewerDim = w.getAssocViewer().getDimension() || {};
					var layout = w.getLayout();
					var sizeField = (layout === Kekule.Widget.Layout.VERTICAL) ? 'height' : 'width';
					result = 100 * (assocViewerDim[sizeField] || 0) / (totalDim[sizeField] || 1);
				}
			}
		}
		if (result < 0)
			result = 0;
		else if (result > 100)
			result = 100;
		return result;
	},
	/** @private */
	_setSpectrumInspectorAssovViewerSizePercent: function(value)
	{
		this.__$spectrumInspectorAssocViewerSizePercent$__ = value;
		var w = this.getWidget();
		w = w && w.getSpectrumInspector();
		if (w)
		{
			w.setAssocViewerSize(Math.round(value) + '%');
		}
	},

	/** @private */
	loadConfigValues: function()
	{
		this.tryApplySuper('loadConfigValues');
		var w = this.getWidget();
		if (w)
		{
			this._checkBoxEnableHotTrack.setChecked(w.getEnableHotTrack());
			this._checkBoxEnableSelect.setChecked(w.getEnableSelect());
			this._checkBoxEnableMultiSelect.setChecked(w.getEnableMultiSelect());
			var color = w.getBackgroundColor();
			this._colorPicker.setValue(color || Kekule.Widget.ColorPicker.SpecialColors.TRANSPARENT);
			this._selectBoxAssocViewerVisualMode.setValue(w.getAssocViewerVisualMode());
			this._assocViewerSizeInputElem.value = Math.round(this._getSpectrumInspectorAssovViewerSizePercent());
		}
	},
	/** @private */
	saveConfigValues: function()
	{
		this.tryApplySuper('saveConfigValues');
		var w = this.getWidget();
		if (w)
		{
			w.beginUpdate();
			try
			{
				w.setEnableHotTrack(this._checkBoxEnableHotTrack.getChecked());
				w.setEnableSelect(this._checkBoxEnableSelect.getChecked());
				w.setEnableMultiSelect(this._checkBoxEnableMultiSelect.getChecked());
				w.setBackgroundColor(this._colorPicker.getValue());
				w.setAssocViewerVisualMode(this._selectBoxAssocViewerVisualMode.getValue());
				this._setSpectrumInspectorAssovViewerSizePercent(parseFloat(this._assocViewerSizeInputElem.value));
				w.invokeEvent('configSave');  // a special event invoked on parent widget, indicating the config value has been changed
			}
			finally
			{
				w.endUpdate();
			}
		}
	}
});

});

})();