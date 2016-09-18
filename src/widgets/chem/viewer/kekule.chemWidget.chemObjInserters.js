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
 * requires /widgets/chem/kekule.chemWidget.viewers.js
 * requires /widgets/advCtrls/kekule.widget.widgetGrids.js
 * requires /widgets/chem/kekule.chemWidget.dialogs.js
 *
 * requires /localization/kekule.localize.widget.js
 */

(function(){
"use strict";

var PS = Class.PropertyScope;
var DU = Kekule.DomUtils;
var AU = Kekule.ArrayUtils;
var CW = Kekule.ChemWidget;
//var CWT = Kekule.ChemWidgetTexts;

/** @ignore */
Kekule.ChemWidget.HtmlClassNames = Object.extend(Kekule.ChemWidget.HtmlClassNames, {
	CHEMOBJSETTER: 'K-Chem-Obj-Setter',
	CHEMOBJSETTER_TOOLBAR_AREA: 'K-Chem-Obj-Setter-Toolbar-Area',
	CHEMOBJSETTER_CLIENT: 'K-Chem-Obj-Setter-Client',
	CHEMOBJSETTER_VIEWER: 'K-Chem-Obj-Setter-Viewer',
	CHEMOBJSETTER_TABGROUP: 'K-Chem-Obj-Setter-TabGroup',
	CHEMOBJSETTER_INFOLABEL: 'K-Chem-Obj-Setter-InfoLabel',
	CHEMOBJSETTER_REGION: 'K-Chem-Obj-Setter-Region',
	CHEMOBJSETTER_REGION_LABEL: 'K-Chem-Obj-Setter-Region-Label',
	CHEMOBJSETTER_LINE: 'K-Chem-Obj-Setter-Line',
	//CHEMOBJSETTER_OPTIONPANEL: 'K-Chem-Obj-Setter-OptionPanel',

	CHEMOBJSETTER_CONFIGURATOR: 'K-Chem-Obj-Setter-Configurator'
});

var CNS = Kekule.Widget.HtmlClassNames;
var CCNS = Kekule.ChemWidget.HtmlClassNames;


/**
 * A chem widget to insert chem viewer elements to HTML document.
 * This widget is mainly designed for extra web editor plugins or browser addons.
 * @class
 * @augments Kekule.ChemWidget.AbstractWidget
 *
 * @property {Kekule.ChemWidget.Viewer} viewer The viewer instance embedded in this widget.
 * @property {Int} renderType Display in 2D or 3D. Value from {@link Kekule.Render.RendererType}.
 * @property {Kekule.ChemObject} chemObj The root object in editor.
 * @property {Bool} showInfo Whether info label is shown.
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
	initialize: function($super, parentOrElementOrDocument, chemObj, renderType, viewerConfigs)
	{
		this._configAction = new Kekule.Widget.ActionOpenConfigWidget(this);
		this._toolbarParentElem = null;
		this._infoLabel = null;
		this._infoLabelTemplate = Kekule.$L('ChemWidgetTexts.CAPTION_WIDTH_HEIGHT');
		$super(parentOrElementOrDocument);
		var viewer = this.getViewer();
		if (renderType)
			viewer.setRenderType(renderType);
		if (viewerConfigs)
			viewer.setViewerConfigs(viewerConfigs);

		this.adjustChildrenSizes();
	},
	/** @private */
	doFinalize: function($super)
	{
		if (this._configAction)
			this._configAction.finalize();
		$super();
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
				var viewer = this.getPropStoreFieldValue('viewer');
				return viewer? viewer.getChemObj(): this.getPropStoreFieldValue('chemObj');
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
		this.defineProp('renderType', {'dataType': DataType.INT, 'serializable': false, 'scope': PS.PUBLIC,
			'setter': function(value)
			{
				var oldValue = this.getRenderType();
				if (value !== oldValue)
				{
					this.setPropStoreFieldValue('renderType', value);
					this.getViewer().setRenderType(value);
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
		this._defineViewerDelegatedProp('viewerConfigs');
		this._defineViewerDelegatedProp('allowedMolDisplayTypes');
		this._defineViewerDelegatedProp('enableEdit');
		this._defineViewerDelegatedProp('enableEditFromVoid');
		this._defineViewerDelegatedProp('modalEdit');
		this._defineViewerDelegatedProp('toolButtons');
		this._defineViewerDelegatedProp('enableDirectInteraction');
		this._defineViewerDelegatedProp('enableTouchInteraction');
	},
	/** @ignore */
	initPropValues: function($super)
	{
		$super();
		this.setAutoSizeExport(true);
		this.setBackgroundColor3D(this.DEF_BGCOLOR_3D);
		this.setExportViewerPredefinedSetting('basic');
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
	doGetWidgetClassName: function($super)
	{
		var result = $super() + ' ' + CCNS.CHEMOBJSETTER;
		return result;
	},

	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('div');
		return result;
	},
	/** @ignore */
	doCreateSubElements: function($super, doc, rootElem)
	{
		var result = $super(doc, rootElem);

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
		// tab
		this.createTabs(rootElem);

		return result;
	},

	/** @ignore */
	doResize: function($super)
	{
		// notify children
		//this.getViewer().resized();
		this.adjustChildrenSizes();
	},
	/** @ignore */
	doWidgetShowStateChanged: function($super, isShown)
	{
		$super(isShown);
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
		var selfRect = this.getBoundingClientRect();
		var toolbarRect = Kekule.HtmlElementUtils.getElemBoundingClientRect(this._toolbarParentElem);
		var tabs = this.getTabs();
		var tabRect = tabs && tabs.getBoundingClientRect();
		var h = tabRect.top - toolbarRect.bottom;
		//console.log(selfRect.height, toolbarRect.height, tabRect.height, h);
		this.getClientPanel().setHeight(h + 'px');
		this.getViewer().resized();
		//var clientRect = this.getClientPanel().getBoundingClientRect();
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
		var buttons = AU.exclude(result.getDefaultToolBarButtons(), BNS.config);
		buttons.push({
			'action': this._configAction
		});
		buttons.splice(2, 0, BNS.clearObjs);
		result.setToolbarParentElem(this._toolbarParentElem);
		result.setToolButtons(buttons); //.concat([{'text': 'MyButton', 'hint': 'Custom'}]));
		result.setToolbarPos(Kekule.Widget.Position.BOTTOM);
		result.setToolbarMarginVertical(-2);
		result.setToolbarEvokeModes([EM.ALWAYS]);

		result.addEventListener('resize', this.updateInfoLabel, this);

		result.appendToElem(rootElem);
		//result.setToolbarEvokeModes([EM.ALWAYS]);
		result.setChemObj(this.getChemObj());

		this.setPropStoreFieldValue('viewer', result);

		this.backgroundColorChange();  // force change background color

		return result;
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
	 */
	exportDetails: function(dataType, options)
	{
		if (this.getAutoSizeExport())
			this.setAutoSize(true);
		var ops = this.getViewer().getActualDrawOptions();
		var dim = this.getViewer().getContextDimension();
		var result = {
			'dataUri': this.exportToDataUri(dataType, options),
			'drawOptions': ops,
			'drawOptionsJson': JSON.stringify(ops),
			'chemObj': this.getChemObj(),
			'chemObjJson': Kekule.IO.saveMimeData(this.getChemObj(), 'chemical/x-kekule-json'),
			'autoSize': this.getAutoSizeExport(),
			'autofit': this.getAutofit(),
			'width': Math.round(dim.width),
			'height': Math.round(dim.height),
			'renderType': this.getRenderType() || Kekule.Render.RendererType.R2D,
			'backgroundColor': this.getBackgroundColor(this.getRenderType()),
			'predefinedSetting': this.getExportViewerPredefinedSetting()
		};
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
	 * If export viewer to a HTML img element, this method returns the essential attributes.
	 * @param {String} dataType Export image data type.
	 * @param {Hash} options
	 * @returns {Hash} Attribute/value pairs.
	 */
	getExportImgElemAttributes: function(dataType, options)
	{
		var detail = this.exportDetails(dataType, options);
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
			result['data-auto-fit'] = detail.autofit;
		if (Kekule.ObjUtils.notUnset(detail.backgroundColor))
			result['data-background-color'] = detail.backgroundColor;
		return result;
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
		//var detail = this.exportDetails(dataType, options);
		var result = doc.createElement('img');
		var attribs = this.getExportImgElemAttributes(dataType, options);
		Kekule.DomUtils.setElemAttributes(result, attribs);
		return result;
	},

	/**
	 * Load a chem object and apply settings in this widget from specified attribs.
	 * @param {Kekule.ChemObject} chemObj
	 * @param {Hash} detail
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
	 * Load a chem object and apply settings in this widget from hash attribs of an HTML element prviously exported.
	 * @param {Hash} attribs
	 */
	importFromElemAttribs: function(attribs)
	{
		//if (!attribs.width)
		attribs.width = JsonUtility.parse(attribs.width);
		//if (!attribs.height)
		attribs.height = JsonUtility.parse(attribs.height);
		var chemObjJson = attribs['data-chem-obj'];
		var chemObj = chemObjJson? Kekule.IO.loadMimeData(chemObjJson, 'chemical/x-kekule-json'): null;
		if (attribs['data-render-type'])
			attribs.renderType = JsonUtility.parse(attribs['data-render-type']);
		if (attribs['data-draw-options'])
			attribs.drawOptions = JsonUtility.parse(attribs['data-draw-options']);
		if (attribs['data-auto-size'])
			attribs.autoSize = JsonUtility.parse(attribs['data-auto-size']);
		if (attribs['data-autofit'])
			attribs.autofit = JsonUtility.parse(attribs['data-autofit']);
		if (attribs['backgroundColor'])
			attribs.backgroundColor = attribs['backgroundColor'];
		return this.importChemObjWithDetails(chemObj, attribs);
	},

	/**
	 * Load a chem object and apply settings in this widget from an HTML element previously exported.
	 * @param {HTMLElement} element
	 */
	importFromElem: function(element)
	{
		var dim = Kekule.HtmlElementUtils.getElemBoundingClientRect(element);
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
	initialize: function($super, widget)
	{
		this._checkBoxAutoSize = null;
		this._checkBoxAutofit = null;
		this._checkBoxShowInfo = null;
		this._textBoxWidth = null;
		this._textBoxHeight = null;
		this._colorPicker = null;
		$super(widget);

		this.addEventListener('valueChange', function(e){ this.saveConfigValues(); }, this);
	},
	/** @ignore */
	initPropValues: function($super)
	{
		$super();
		this.setAutoUpdate(true);
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CCNS.CHEMOBJSETTER_CONFIGURATOR;
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
	loadConfigValues: function($super)
	{
		$super();
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
	saveConfigValues: function($super)
	{
		$super();
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

})();