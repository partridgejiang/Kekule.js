/**
 * @fileoverview
 * Implemetation of base class involves in displaying chem object (such as viewer or editor).
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /xbrowsers/kekule.x.js
 * requires /render/kekule.render.configs.js
 * requires /widgets/operation/kekule.actions.js
 * requires /widgets/kekule.widget.base.js
 * requires /widgets/kekule.widget.helpers.js
 * requires /widgets/kekule.widget.styleResources.js
 * requires /widgets/commonCtrls/kekule.widget.buttons.js
 * requires /widgets/commonCtrls/kekule.widget.tabViews.js
 * requires /widgets/commonCtrls/kekule.widget.dialogs.js
 * requires /widgets/commonCtrls/kekule.widget.formControls.js
 * requires /widgets/chem/kekule.chemWidget.base.js
 * requires /widgets/chem/kekule.chemWidget.dialogs.js
 */

(function(){

"use strict";

var PS = Class.PropertyScope;
var DU = Kekule.DomUtils;
var ZU = Kekule.ZoomUtils;
var CW = Kekule.ChemWidget;
//var CWT = Kekule.ChemWidgetTexts;
var CNS = Kekule.Widget.HtmlClassNames;
var CCNS = Kekule.ChemWidget.HtmlClassNames;

/** @ignore */
Kekule.ChemWidget.HtmlClassNames = Object.extend(Kekule.ChemWidget.HtmlClassNames, {
	DISPLAYER_DRAWCONTEXT_PARENT: 'K-Chem-Displayer-DrawContext-Parent',

	ACTION_MOL_DISPLAY_TYPE: 'K-Chem-MolDisplayType',
	ACTION_MOL_DISPLAY_SKELETAL: 'K-Chem-MolDisplaySkeletal',
	ACTION_MOL_DISPLAY_CONDENSED: 'K-Chem-MolDisplayCondensed',
	ACTION_MOL_DISPLAY_WIRE: 'K-Chem-MolDisplayWire',
	ACTION_MOL_DISPLAY_BALLSTICK: 'K-Chem-MolDisplayBallStick',
	ACTION_MOL_DISPLAY_STICKS: 'K-Chem-MolDisplaySticks',
	ACTION_MOL_DISPLAY_SPACEFILL: 'K-Chem-MolDisplaySpaceFill',
	ACTION_MOL_HIDE_HYDROGENS: 'K-Chem-MolHideHydrogens',
	ACTION_ZOOMIN: 'K-Chem-ZoomIn',
	ACTION_ZOOMOUT: 'K-Chem-ZoomOut',
	ACTION_RESET: 'K-Chem-Reset',
	ACTION_RESET_ZOOM: 'K-Chem-ResetZoom',
	ACTION_LOADFILE: 'K-Chem-LoadFile',
	ACTION_LOADDATA: 'K-Chem-LoadData',
	ACTION_SAVEFILE: 'K-Chem-SaveFile',
	ACTION_CLEAROBJS: 'K-Chem-ClearObjs',
	ACTION_CONFIG: 'K-Chem-Config',

	DIALOG_CHOOSE_FILE_FORAMT: 'K-Chem-Dialog-Choose-File-Format',
	DIALOG_CHOOSE_FILE_FORAMT_FORMATBOX: 'K-Chem-Dialog-Choose-File-Format-FormatBox',
	DIALOG_CHOOSE_FILE_FORAMT_PREVIEWER: 'K-Chem-Dialog-Choose-File-Format-Previewer'
});

/**
 * Root config class of {@link Kekule.ChemWidget.ChemObjDisplayer}.
 * @class
 * @augments Kekule.AbstractConfigs
 *
 * @property {Kekule.ChemWidget.ChemObjDisplayerIOConfigs} ioConfigs
 */
Kekule.ChemWidget.ChemObjDisplayerConfigs = Class.create(Kekule.AbstractConfigs,
/** @lends Kekule.ChemWidget.ChemObjDisplayerConfigs# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ChemObjDisplayerConfigs',

	/** @private */
	initProperties: function()
	{
		this.addConfigProp('ioConfigs', 'Kekule.ChemWidget.ChemObjDisplayerIOConfigs');
	},
	/** @private */
	initPropValues: function($super)
	{
		$super();
		this.setPropStoreFieldValue('ioConfigs', new Kekule.ChemWidget.ChemObjDisplayerIOConfigs());
	}
});
/**
 * Config class of I/O options for {@link Kekule.ChemWidget.ChemObjDisplayer}.
 * @class
 * @augments Kekule.AbstractConfigs
 *
 * @property {Bool} canonicalizeBeforeSave Whether canonicalize molecules in displayer before saving them.
 */
Kekule.ChemWidget.ChemObjDisplayerIOConfigs = Class.create(Kekule.AbstractConfigs,
/** @lends Kekule.ChemWidget.ChemObjDisplayerIOConfigs# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ChemObjDisplayerIOConfigs',
	/** @private */
	initProperties: function()
	{
		this.addBoolConfigProp('canonicalizeBeforeSave', true);
	}
});

/**
 * An widget related to display chem objects (especially molecules).
 * Note, this class is simply a base class for viewer and editor. User should not use this one directly.
 * @class
 * @augments Kekule.ChemWidget.AbstractWidget
 *
 * @param {Variant} parentOrElementOrDocument
 * @param {Kekule.ChemObject} chemObj
 * @param {Int} renderType Display in 2D or 3D. Value from {@link Kekule.Render.RendererType}.
 * @param {Kekule.ChemWidget.ChemObjDisplayerConfigs} displayerConfigs Configs of current displayer.
 *
 * @property {Kekule.ChemWidget.ChemObjDisplayerConfigs} displayerConfigs Configs of current displayer.
 * @property {Int} renderType Display in 2D or 3D. Value from {@link Kekule.Render.RendererType}. Read only.
 * @property {Kekule.ChemObject} chemObj Object to be drawn. Set this property will repaint the client.
 * @property {Bool} chemObjLoaded Whether the chemObj is successful loaded and drawn in viewer.
 * @property {Bool} resetAfterLoad Whether reset display (remove rotate, zoom and so on) after set a new chem obj.
 * @property {Object} renderConfigs Configuration for rendering.
 * @property {Int} moleculeDisplayType Display type of molecule in displayer. Value from {@link Kekule.Render.Molecule2DDisplayType} or {@link Kekule.Render.Molecule3DDisplayType}.
 * @property {Hash} drawOptions A series of params to render chem object.
 * @property {Float} zoom Zoom ratio to draw chem object, equal to drawOptions.zoom.
 * @property {Bool} autoSize Whether the widget change its size to fit the dimension of chem object.
 * @property {Int} padding Padding between chem object and edge of widget, in px. Only works when autoSize is true.
 * @property {Hash} baseCoordOffset Usually displayer draw object at center of widget, use this property to make
 *   the drawing center moved from widget center.
 *   Note: this property is useless when autoSize == true.
 * @property {Hash} transformParams A combination of (@link Kekule.ChemWidget.ChemObjDisplayer.drawOptions} and (@link Kekule.ChemWidget.ChemObjDisplayer.baseCoordOffset}.
 * @property {String} backgroundColor Get or set background color of displayer. Default is transparent.
 * @property {Bool} enableLoadNewFile Whether open a external file to displayer is allowed.
 * @property {Array} allowedInputFormatIds Formats that shown in input file dialog. Default is null, means accept all available formats.
 * @property {Array} allowedOutputFormatIds Formats that shown in output file dialog. Default is null, means accept all available formats.
 * @property {Hash} standardizationOptions Possible options when do standardization on molecule before saving.
 */
/**
 * Invoked when the an chem object (or null) is loaded into the displayer.
 *   event param of it has one fields: {obj: Object}
 * @name Kekule.ChemWidget.ChemObjDisplayer#load
 * @event
 */
Kekule.ChemWidget.ChemObjDisplayer = Class.create(Kekule.ChemWidget.AbstractWidget,
/** @lends Kekule.ChemWidget.ChemObjDisplayer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ChemObjDisplayer',
	/** @construct */
	initialize: function($super, parentOrElementOrDocument, chemObj, renderType, displayerConfigs)
	{
		this._paintFlag = 0;  // used internally
		//this._errorReportElem = null;  // use internally
		this._bgColorMap = {};  // use internally
		this._contextTransformOpsMap = new Kekule.MapEx();
		this.setPropStoreFieldValue('resetAfterLoad', true);
		this.setPropStoreFieldValue('renderType', renderType || Kekule.Render.RendererType.R2D); // must set this value first
		$super(parentOrElementOrDocument);
		if (chemObj)
		{
			this.setChemObj(chemObj);
		}
		//this.setUseCornerDecoration(true);
		this.setEnableLoadNewFile(true);
		this.setPropStoreFieldValue('displayerConfigs', displayerConfigs || this.createDefaultConfigs());
	},
	/** @private */
	doFinalize: function($super)
	{
		this.setChemObj(null);
		this.getPainter().finalize();
		var b = this.getPropStoreFieldValue('drawBridge');
		var ctx = this.getPropStoreFieldValue('drawContext');
		if (ctx && b)
			b.releaseContext(ctx);
		if (b.finalize)
			b.finalize();
		this.setPropStoreFieldValue('drawBridge', null);
		this.setPropStoreFieldValue('drawContext', null);
		if (this._contextTransformOpsMap)
			this._contextTransformOpsMap.finalize();
		$super();
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('displayerConfigs', {'dataType': 'Kekule.ChemWidget.ChemObjDisplayerConfigs', 'serializable': false, 'scope': PS.PUBLIC});

		this.defineProp('enableLoadNewFile', {'dataType': DataType.BOOL});
		this.defineProp('allowedInputFormatIds', {'dataType': DataType.ARRAY});
		this.defineProp('allowedOutputFormatIds', {'dataType': DataType.ARRAY});

		this.defineProp('standardizationOptions', {'dataType': DataType.HASH});

		this.defineProp('resetAfterLoad', {'dataType': DataType.BOOL});
		this.defineProp('chemObj', {'dataType': 'Kekule.ChemObject', 'serializable': false, 'scope': PS.PUBLIC,
			'setter': function(value)
			{
				var oldObj = this.getPropStoreFieldValue('chemObj');
				//if (value !== oldObj)  // some times oldObj itself may change and may need to repaint
				{
					this.setPropStoreFieldValue('chemObj', value);
					this.chemObjChanged(value, oldObj);
				}
			}
		});
		this.defineProp('chemObjLoaded', {'dataType': DataType.BOOL, 'serializable': false, 'scope': PS.PUBLIC,
			'setter': null,
			'getter': function() { return this.getChemObj() && this.getPropStoreFieldValue('chemObjLoaded'); }
		});
		this.defineProp('renderType', {'dataType': DataType.INT, 'serializable': false, 'scope': PS.PUBLISHED,
			'setter': function(value)
			{
				if (!this.getAllowRenderTypeChange())
				{
					Kekule.error(Kekule.$L('ErrorMsg.RENDER_TYPE_CHANGE_NOT_ALLOWED'));
					return;
				}
				var oldValue = this.getRenderType();
				if (value !== oldValue)
				{
					this.setPropStoreFieldValue('renderType', value);
					this.resetRenderType(oldValue, value);
				}
			}
		});

		this.defineProp('renderConfigs', {'dataType': DataType.OBJECT, 'serializable': false, 'scope': PS.PUBLIC,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('renderConfigs');
				if (!result)
					result = (this.getRenderType() === Kekule.Render.RendererType.R3D)?
						Kekule.Render.Render3DConfigs.getInstance():
						Kekule.Render.Render2DConfigs.getInstance();
				return result;
			}
		});
		this.defineProp('backgroundColor', {'dataType': DataType.STRING, 'scope': PS.PUBLISHED,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('backgroundColor', value);
				//this.setBackgroundColorOfType(value, this.getRenderType());
				this._bgColorMap[this.getRenderType().toString()] = value;
				this.backgroundColorChanged();
			}
		});
		this.defineProp('transformParams', {'dataType': DataType.HASH, 'serializable': false, 'scope': PS.PUBLIC,
			'getter': function()
			{
				var result = Object.extend({}, this.getDrawOptions());
				result.screenCoordOffset = this.getBaseCoordOffset();
				return result;
			},
			'setter': function(value)
			{
				var param = value || {};
				this.setDrawOptions(param);
				this.setBaseCoordOffset(param.baseCoordOffset);
				this.drawOptionChanged();
			}
		});
		this.defineProp('drawOptions', {'dataType': DataType.HASH, 'serializable': false, 'scope': PS.PUBLIC,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('drawOptions');
				if (!result)
				{
					result = {};
					this.setPropStoreFieldValue('drawOptions', result);
				}
				return result;
			},
			'setter': function(value)
			{
				this.setPropStoreFieldValue('drawOptions', value);
				this.drawOptionChanged();
			}
		});
		this.defineProp('zoom', {'dataType': DataType.FLOAT, 'serializable': false,
			'getter': function()
			{
				var op = this.getDrawOptions() || {};
				return op.zoom;
			},
			'setter': function(value)
			{
				this.zoomTo(value);
				return this;
			}
		});
		this.defineProp('autofit', {'dataType': DataType.BOOL, 'serializable': false,
			'getter': function()
			{
				var op = this.getDrawOptions() || {};
				return op.autofit;
			},
			'setter': function(value)
			{
				var op = this.getDrawOptions() || {};
				op.autofit = value;
				return this.setDrawOptions(op);
			}
		});
		this.defineProp('moleculeDisplayType', {'dataType': DataType.INT, 'serializable': false,
			'getter': function()
			{
				var op = this.getDrawOptions() || {};
				return op.moleculeDisplayType;
			},
			'setter': function(value)
			{
				this.getDrawOptions().moleculeDisplayType = value;
				this.drawOptionChanged();
				return this;
			}
		});
		this.defineProp('allowCoordBorrow', {'dataType': DataType.BOOL, 'serializable': false, 'scope': PS.PUBLIC,
			'getter': function()
			{
				return Kekule.oneOf(this.getDrawOptions().allowCoordBorrow, this.getRenderConfigs().getGeneralConfigs().getAllowCoordBorrow());
			}
		});
		//this.defineProp('zoom', {'dataType': DataType.FLOAT, 'serializable': false});

		this.defineProp('autoSize', {'dataType': DataType.BOOL, 'serializable': false,
			'setter': function(value)
			{
				if (value != this.getAutoSize())
				{
					this.setPropStoreFieldValue('autoSize', value);
					if (value && this.allowAutoSize())
						this.drawOptionChanged(); // force repaint
				}
			}
		});

		this.defineProp('padding', {'dataType': DataType.INT, 'serializable': false,
			'setter': function(value)
			{
				if (value != this.getPadding())
				{
					this.setPropStoreFieldValue('padding', value);
					/*
					if (this.allowAutoSize())
						this.drawOptionChanged(); // force repaint
					*/
					this.getDrawOptions().autofitContextPadding = value;
					this.drawOptionChanged();
				}
			}
		});
		this.defineProp('baseCoordOffset', {'dataType': DataType.Hash, 'serializable': false,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('baseCoordOffset', value);
				if (this.getChemObjLoaded())
					this.repaint();
			}
		});

		// private properties
		this.defineProp('drawBridge', {'dataType': DataType.OBJECT, 'serializable': false, 'scope': PS.PRIVATE,
			'setter': null,
			'getter': function(slient)
			{
				var result = this.getPropStoreFieldValue('drawBridge');
				if (!result)
				{
					result = this.createDrawBridge(slient);
					this.setPropStoreFieldValue('drawBridge', result);
				}
				return result;
			}
		});
		this.defineProp('drawContext', {'dataType': DataType.OBJECT, 'serializable': false, 'scope': PS.PRIVATE,
			'setter': null,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('drawContext');
				if (!result)
				{
					var bridge = this.getDrawBridge();
					if (bridge)
					{
						var elem = this.getDrawContextParentElem();
						if (!elem)
							return null;
						else
						{
							//var dim = Kekule.HtmlElementUtils.getElemScrollDimension(elem);
							//var dim = Kekule.HtmlElementUtils.getElemClientDimension(elem);
							var dim = Kekule.HtmlElementUtils.getElemOffsetDimension(elem);
							result = bridge.createContext(elem, dim.width, dim.height);
							/*
							if (result !== elem)
								Kekule.HtmlElementUtils.addClass(result, CNS.DYN_CREATED);
							*/
							// a little smaller than current element, avoid scroll bars in when setting CSS3's resize: both property
							this.setPropStoreFieldValue('drawContext', result);
						}
					}
				}
				return result;
			}
		});
		this.defineProp('painter', {'dataType': 'Kekule.Render.ChemObjPainter', 'serializable': false, 'scope': PS.PRIVATE,
			'setter': null,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('painter');
				if (!result)
				{
					result = this.createNewPainter();
				}
				return result;
			}
		});
		this.defineProp('rootRenderer', {'dataType': 'Kekule.Render.AbstractRenderer', 'serializable': false, 'scope': PS.PRIVATE,
			'setter': null,
			'getter': function()
			{
				var p = this.getPainter();
				return p? p.getRenderer(): null;
			}
		});
	},
	initPropValues: function($super)
	{
		$super();
		this.setStandardizationOptions({'unmarshalSubFragments': false});
	},

	/** @ignore */
	doWidgetShowStateChanged: function($super, isShown)
	{
		$super(isShown);
		/*
		 As position/size calculation may be wrong when displayed = false,
		 during the show phase, whole context should be force repainted.
		 */
		if (isShown)
			this.setChemObj(this.getChemObj());
	},

	/**
	 * Whether changing render type is allowed in current type of displayer.
	 * Default is false, descendants may override this method.
	 * @returns {Bool}
	 */
	getAllowRenderTypeChange: function()
	{
		return false;
	},
	/**
	 * Notify the render type has been changed.
	 * Descendants may override this method.
	 * @private
	 */
	resetRenderType: function(oldType, newType)
	{
		var chemObj = this.getChemObj();
		var bridge = this.getPropStoreFieldValue('drawBridge');
		var context = this.getPropStoreFieldValue('drawContext');
		if (bridge)
		{
			if (context)
				bridge.releaseContext(context);
		}
		this.setPropStoreFieldValue('drawContext', null);
		this.setPropStoreFieldValue('drawBridge', null);
		var newBgColor = this.getBackgroundColorOfType(newType);
		this.getDrawOptions().moleculeDisplayType = this.getDefaultMoleculeDisplayType(newType);  // reset display type
		//this.setBackgroundColor(newBgColor);
		this.setPropStoreFieldValue('backgroundColor', newBgColor);
		this.backgroundColorChanged(true);  // notify back color change but not repaint, as painter currently is still old one
		//if (chemObj)  // repaint
		this.setChemObj(chemObj || null);
	},

	/**
	 * Create a default editor config object.
	 * Descendants may override this method.
	 * @returns {Kekule.Editor.BaseEditorConfigs}
	 * @private
	 */
	createDefaultConfigs: function()
	{
		return new Kekule.ChemWidget.ChemObjDisplayerConfigs();
	},

	/**
	 * Returns coord mode according to current renderType.
	 * @returns {Int}
	 */
	getCoordMode: function()
	{
		return (this.getRenderType() === Kekule.Render.RendererType.R3D)?
			Kekule.CoordMode.COORD3D: Kekule.CoordMode.COORD2D;
	},
	/**
	 * Set renderType according to coord mode.
	 * @param {Int} coordMode
	 */
	setCoordMode: function(coordMode)
	{
		var rType = (coordMode === Kekule.CoordMode.COORD3D)?
			Kekule.Render.RendererType.R3D: Kekule.Render.RendererType.R2D;
		this.setRenderType(rType);
	},

	/** @private */
	loadPredefinedResDataToProp: function(propName, resData, success)
	{
		if (propName === 'chemObj')  // only this property can be set by predefined resource
		{
			if (success)
			{
				try
				{
					//var ext = resData.uri? Kekule.UrlUtils.extractFileExt(resData.uri): null;
					var chemObj = Kekule.IO.loadTypedData(resData.data, resData.resType, resData.resUri);
					this.setChemObj(chemObj);
				}
				catch(e)
				{
					this.reportException(e);
				}
			}
			else  // else, failed
			{
				// NOTE: just report a text msg rather than an exception object.
				// In IE and Chrome, it seems that error object can not cross context, so that may cause Illegal invocation error in Kekule.ExceptionHandler
				this.reportException(/*Kekule.ErrorMsg.CANNOT_LOAD_RES_OF_URI*/Kekule.$L('ErrorMsg.CANNOT_LOAD_RES_OF_URI') + resData.resUri || '');
				//Kekule.throwException(Kekule.ErrorMsg.CANNOT_LOAD_RES_OF_URI + resData.resUri || '');
			}
		}
	},

	/** @private */
	reportException: function(e, exceptionLevel)
	{
		/*
		var msg = Kekule.getExceptionMsg(e);
		if (!this._errorReportElem)    // create error element
		{
			this._errorReportElem = this.getDocument().createElement('span');
			this._errorReportElem.className = Kekule.Widget.HtmlClassNames.PART_ERROR_REPORT;
			this.getElement().appendChild(this._errorReportElem);
		}
		this._errorReportElem.innerHTML = msg;
		Kekule.StyleUtils.setDisplay(this._errorReportElem, '');
		*/
		Kekule.raise(e, exceptionLevel || Kekule.ExceptionLevel.ERROR);
	},
	/* @private */
	/*
	hideExceptionReport: function()
	{
		if (this._errorReportElem)
		{
			Kekule.StyleUtils.setDisplay(this._errorReportElem, 'none');
		}
	},
	*/

	/** @private */
	createDrawBridge: function(slient)
	{
		var M = (this.getRenderType() === Kekule.Render.RendererType.R3D)?
			Kekule.Render.DrawBridge3DMananger: Kekule.Render.DrawBridge2DMananger;
		var result = M.getPreferredBridgeInstance();
		if (!result)   // can not find suitable draw bridge
		{
			if (!slient)
				Kekule.error(/*Kekule.ErrorMsg.DRAW_BRIDGE_NOT_SUPPORTED*/Kekule.$L('ErrorMsg.DRAW_BRIDGE_NOT_SUPPORTED'));
		}
		/* infinite loop, remove this part
		if (this.getBackgroundColor() && result.setClearColor)
			result.setClearColor(this.getDrawContext(), this.getBackgroundColor());
		*/
		return result;
	},

	/**
	 * Returns parent element to create draw context inside.
	 * Descendants can override this method.
	 */
	getDrawContextParentElem: function(disableAutoCreate)
	{
		//return this.getElement();
		var result = this._drawContextParentElem;
		if (!result && !disableAutoCreate)  // create new
		{
			result = this.getDocument().createElement('div'); // IMPORTANT: span may cause dimension calc problem of context
			this._drawContextParentElem = result;
			Kekule.HtmlElementUtils.addClass(result, CNS.DYN_CREATED);
			Kekule.HtmlElementUtils.addClass(result, CCNS.DISPLAYER_DRAWCONTEXT_PARENT);
			// IMPORTANT: force to fullfill the parent, otherwise draw context dimension calculation may have problem
			//result.style.display = 'block';
			result.style.width = '100%';
			result.style.height = '100%';
			// insert as first child
			var root = this.getElement();
			var currFirst = Kekule.DomUtils.getFirstChildElem(root);
			if (currFirst)
				root.insertBefore(result, currFirst);
			else
				root.appendChild(result);

		}
		return result;
	},

	/**
	 * Whether current painter can meet the requirement of auto size.
	 * @returns {Bool}
	 */
	allowAutoSize: function()
	{
		// TODO: Currently autosize is not enabled in 3D mode
		return this.getRenderType() === Kekule.Render.RendererType.R2D;
	},


	/**
	 * Whether context and draw bridge can modify existing graphic content.
	 * @returns {Bool}
	 */
	canModifyPartialGraphic: function(context)
	{
		var b = this.getDrawBridge();
		return b.canModifyGraphic? b.canModifyGraphic(context || this.getDrawContext()): false;
	},

	/** @private */
	doInsertedToDom: function()
	{
		this.doResize();
	},
	/** @private */
	doResize: function()
	{
		//console.log('refit draw context');
		// when the size of chem viewer is changed, context should also be adjusted and object should be redrawn.
		this.refitDrawContext(this.isPainting()); // if is paiting, do not call repaint
	},
	/** @private */
	refitDrawContext: function(doNotRepaint)
	{
		if (this.getDrawBridge(true) && this.getDrawContext())
		{
			//var dim = Kekule.HtmlElementUtils.getElemScrollDimension(this.getElement());
			var dim = Kekule.HtmlElementUtils.getElemClientDimension(this.getDrawContextParentElem());
			//console.log(this.getElement().id, dim, Kekule.HtmlElementUtils.getElemScrollDimension(this.getElement()));
			//this.getDrawBridge().setContextDimension(this.getDrawContext(), dim.width, dim.height);
			var success = this.changeContextDimension(dim);
			if (!doNotRepaint && success)
				this.repaint();
		}
	},

	/**
	 * Returns dimension of context.
	 * @returns {Hash}
	 */
	getContextDimension: function()
	{
		if (this.getDrawBridge() && this.getDrawContext())
			return this.getDrawBridge().getContextDimension(this.getDrawContext());
		else
			return null;
	},
	/**
	 * Change the dimension of context.
	 * @param {Hash} newDimension
	 * @returns {Bool} Return true if dimension change successfully.
	 */
	changeContextDimension: function(newDimension)
	{
		if (this.getDrawBridge() && this.getDrawContext())
		{
			this.getDrawBridge().setContextDimension(this.getDrawContext(), newDimension.width, newDimension.height);
			return true;
		}
		else
			return false;
	},

	/** @private */
	clearContext: function()
	{
		var c = this.getPropStoreFieldValue('drawContext');
		if (c)
		{
			var p = this.getPropStoreFieldValue('painter');
			if (p)
				p.clear(c);

			this.getDrawBridge().clearContext(c);
		}
	},
	/** @private */
	createNewPainter: function(chemObj)
	{
		var old = this.getPropStoreFieldValue('painter');
		if (old)
		{
			old.finalize();
		}
		var result = new Kekule.Render.ChemObjPainter(this.getRenderType(), chemObj, this.getDrawBridge());
		this.setPropStoreFieldValue('painter', result);
		return result;
	},

	/**
	 * Called when chemObj property has been changed.
	 * Usually this will cause the viewer repaint itself.
	 * @param {Kekule.ChemObject} newObj
	 * @private
	 */
	chemObjChanged: function(newObj, oldObj)
	{
		//if (newObj)
		//console.log('change to new Obj', newObj);
		this.doLoad(newObj);
		if (this.getResetAfterLoad() && oldObj)  // clear old draw options if oldObj is set
			this.resetDisplay();
	},

	/**
	 * Load and display chemObj in viewer
	 * @param {Kekule.ChemObject} chemObj
	 */
	load: function(chemObj)
	{
		this.setChemObj(chemObj);
	},
	/**
	 * Do actual job of loading a chemObj.
	 * @param {Kekule.ChemObject} chemObj
	 * @ignore
	 */
	doLoad: function(chemObj)
	{
		//console.log('doLoad', chemObj);
		this.refitDrawContext(true);  // ensure the context size is correct, but not force repaint.
		//this.hideExceptionReport();
		this.setPropStoreFieldValue('chemObjLoaded', false);
		//this.clearContext();
		try
		{
			if (chemObj)
			{
				/*
				// debug
				chemObj.addOverrideRenderOptionItem({
					'atomColor': '#ff0000', 'bondColor': '#00ff00',
					//'useAtomSpecifiedColor': false,
					'atomRadius': 3
				});
				*/

				var painter = this.createNewPainter(chemObj);
				painter.setRenderConfigs(this.getRenderConfigs());

				/*
				 var drawOptions = this.getDrawOptions();
				 var context = this.getDrawContext();
				 var baseCoord;

				 if (this.getAutoSize() && this.allowAutoSize())  // need to resize widget dimension
				 {
				 var padding = this.getPadding() || 0;
				 var renderBox = painter.estimateScreenBox(context, baseCoord, drawOptions);
				 var width = renderBox.x2 - renderBox.x1 + padding * 2;
				 var height = renderBox.y2 - renderBox.y1 + padding * 2;
				 this.getDrawBridge().setContextDimension(context, width, height);
				 this.setWidth(width + 'px');
				 this.setHeight(height + 'px');
				 baseCoord = {'x': width / 2, 'y': height / 2};
				 }
				 else
				 {
				 baseCoord = drawOptions? drawOptions.baseCoord: null;
				 if (!baseCoord)
				 {
				 var dim = Kekule.HtmlElementUtils.getElemClientDimension(this.getElement());
				 baseCoord = {'x': dim.width / 2, 'y': dim.height / 2};
				 }
				 }

				 painter.draw(context, baseCoord, drawOptions);
				 */
				this.repaint();
				this.setPropStoreFieldValue('chemObjLoaded', true);  // indicate obj loaded successful
				//this.invokeEvent('load', {'obj': chemObj});
			}
			else  // no object, clear
			{
				this.clearContext();
			}
			this.invokeEvent('load', {'obj': chemObj});  // even chemObj is null, this event should also be invoked
		}
		catch(e)
		{
			this.clearContext();
			this.reportException(e);
			//console.log(e);
			//throw e;
		}
		finally
		{
			this.doLoadEnd(this.getChemObj());
		}
	},

	/**
	 * Called when a chem object is loaded into widget.
	 * Descendants may override this method.
	 * @param {Kekule.ChemObject} chemObj If loading process is failed, this param may be null.
	 * @private
	 */
	doLoadEnd: function(chemObj)
	{
		// do nothing here
	},

	/**
	 * Load chem object from data of special MIME type or file format.
	 * @param {Variant} data Usually text content.
	 * @param {String} mimeType
	 * @param {String} fromUrlOrFileName From which file or url is this data loaded.
	 */
	loadFromData: function(data, mimeType, fromUrlOrFileName)
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
				//var ext = fromUrlOrFileName? Kekule.UrlUtils.extractFileExt(fromUrlOrFileName): null;
				var chemObj = Kekule.IO.loadTypedData(data, mimeType, fromUrlOrFileName);
				if (chemObj)
					this.setChemObj(chemObj);
				else
					Kekule.error(/*Kekule.ErrorMsg.LOAD_CHEMDATA_FAILED*/Kekule.$L('ErrorMsg.LOAD_CHEMDATA_FAILED'));
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
							self.setChemObj(chemObj);
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
	 * Returns object in displayer that to be saved.
	 * Usually this should be the chemObj itself.
	 * Descendants may override this method.
	 * @returns {Kekule.ChemObject}
	 * @private
	 */
	getSavingTargetObj: function()
	{
		return this.getChemObj();
	},

	/**
	 * Save loaded chem object to data.
	 * @param {String} formatId
	 * @param {Int} dataType Text or binary. Set null to use default type.
	 * @param {Kekule.ChemObject} obj Object to save, default is current chemObj loaded in displayer.
	 * @returns {Variant} Saved data.
	 */
	saveData: function(formatId, dataType, obj)
	{
	  var obj = obj || this.getSavingTargetObj(); /* this.getChemObj()*/
		this.prepareSaveData(obj);
		var writer = Kekule.IO.ChemDataWriterManager.getWriterByFormat(formatId, null, obj);
		if (writer)
		{
			var doCanonicalize = this._needToCanonicalizeBeforeSaving() && this.getDisplayerConfigs().getIoConfigs().getCanonicalizeBeforeSave();
			if (doCanonicalize && obj.standardize)  // canonicalize first
			{
				var obj = obj.clone? obj.clone(true): obj;  // clone with id
				obj.standardize(this.getStandardizationOptions());
			}
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
			Kekule.error(/*Kekule.ErrorMsg.NO_SUITABLE_WRITER_FOR_FORMAT*/Kekule.$L('ErrorMsg.NO_SUITABLE_WRITER_FOR_FORMAT'));
			return null;
		}
	},
	/**
	 * Return whether this displayer need to canonicalize molecule before save.
	 * Descendants may override this method.
	 * @returns {Bool}
	 * @private
	 */
	_needToCanonicalizeBeforeSaving: function()
	{
		return false;
	},
	/**
	 * Called before obj is saved. Descendants can overrride this method.
	 */
	prepareSaveData: function(obj)
	{
		// do nothing here
	},

	/** @private */
	getDrawClientDimension: function()
	{
		var dim = Kekule.HtmlElementUtils.getElemClientDimension(this.getCoreElement());
		return dim;
	},
	/**
	 * Set dimension of drawn client, descendant may override this method.
	 * @param {Int} width
	 * @param {Int} height
	 */
	setDrawDimension: function(width, height)
	{
		this.setDimension(width, height);
	},

	/** @private */
	calcDrawBaseCoord: function(drawOptions)
	{
		var baseCoord;
		var context = this.getDrawContext();
		var painter = this.getPainter();
		var newDimension;
		// note in continuous repainting phase (such as periodical rotation), we disable auto size
		if ((!this._isContinuousRepainting) && this.getAutoSize() && this.allowAutoSize())  // need to resize widget dimension
		{
			var padding = this.getPadding() || 0;
			var renderBox = painter.estimateScreenBox(context, baseCoord, drawOptions, this.getAllowCoordBorrow());
			if (renderBox)
			{
				var width = renderBox.x2 - renderBox.x1 + padding * 2;
				var height = renderBox.y2 - renderBox.y1 + padding * 2;
				//this.getDrawBridge().setContextDimension(context, width, height);
				this.changeContextDimension({'width': width, 'height': height});
				/*
				 this.setWidth(width + 'px');
				 this.setHeight(height + 'px');
				 */
				this.setDrawDimension(width, height);
				newDimension = {'width': width, 'height': height};
				baseCoord = {'x': width / 2, 'y': height / 2};
			}

			// debug
			/*
			 console.log('drawOutline', renderBox);
			 var c1 = {'x': renderBox.x1, 'y': renderBox.y1};
			 var c2 = {'x': renderBox.x2, 'y': renderBox.y2};
			 c1 = Kekule.CoordUtils.add(c1, baseCoord);
			 c2 = Kekule.CoordUtils.add(c2, baseCoord);
			 this.getDrawBridge().drawRect(context, c1, c2,
			 {'strokeWidth': 1, 'strokeColor': '#000000', 'fillColor': '#00ff00'}
			 );
			 */
		}
		else
		{
			baseCoord = drawOptions? drawOptions.baseCoord: null;
			if (!baseCoord)
			{
				var dim = this.getDrawClientDimension();
				baseCoord = {'x': dim.width / 2, 'y': dim.height / 2};
				//drawOptions.baseCoord = baseCoord;
				//if (this.getRenderType() !== Kekule.Render.RendererType.R3D)
				{
					var offset = this.getBaseCoordOffset();
					if (offset)
					{
						baseCoord = Kekule.CoordUtils.add(baseCoord, offset);
					}
				}
			}
		}
		baseCoord = this.getDrawBridge().transformScreenCoordToContext(context, baseCoord);
		return {'baseCoord': baseCoord, 'baseCoordPos': Kekule.Render.CoordPos.CENTER, 'newWidgetDimension': newDimension};
	},

	/**
	 * Returns draw options actually used by repaint method.
	 * Returned value may be different to drawOption property to make some custom modifications.
	 * Descendants may override this method.
	 * @returns {Hash}
	 * @private
	 */
	getActualDrawOptions: function()
	{
		return this.getDrawOptions();
	},

	/** @private */
	calcDrawParams: function(overrideOptions)
	{
		var ops = this.getActualDrawOptions();
		if (overrideOptions)
			ops = Object.extend(ops, overrideOptions);
		var baseCoordResult = this.calcDrawBaseCoord(ops);
		return {
			'drawOptions': ops,
			'baseCoord': baseCoordResult.baseCoord,
			'baseCoordPos': baseCoordResult.baseCoordPos,
			'newWidgetDimension': baseCoordResult.newWidgetDimension};
	},

	/** @private */
	_savePainterInitialRenderTransformOptions: function(context, painter)
	{
		var actualTransformOps = painter.getActualInitialRenderTransformOptions(context);
		this._contextTransformOpsMap.set(context, actualTransformOps);
		//console.log('store transform ops', actualTransformOps);
	},

	/**
	 * Repaint the context with current chem object.
	 * @param {Hash} overrideOptions Transform options to do repainting.
	 *   If this param is set to null, all transform options will be recalculated.
	 *   If overrideOptions.preserveTransformOptions is true, transform options remains same as
	 *   last painting process (rather than recalculated).
	 */
	repaint: function(overrideOptions)
	{
		this.beginPaint();
		try
		{
			//var start = (new Date()).getTime();
			if (!overrideOptions || !overrideOptions.doNotClear)
				this.clearContext();

			if (!this.getChemObj())
				return;

			var painter = this.getPainter();
			/*
			 var drawOptions = Object.create(this.getActualDrawOptions() || null);
			 if (overrideOptions)
			 drawOptions = Object.extend(drawOptions, overrideOptions);
			 var baseCoord = this.calcDrawBaseCoord(drawOptions);
			 */
			var context = this.getDrawContext();
			var drawParams;
			var transformOps;

			var transformOpsChanged = true;
			if (overrideOptions && overrideOptions.preserveTransformOptions)
			{
				transformOps = this._contextTransformOpsMap.get(context) || null;
				transformOpsChanged = false;
				//console.log(transformOps);
				drawParams = this.calcDrawParams(transformOps);
			}
			else
				drawParams = this.calcDrawParams(overrideOptions);

			this._lastBaseCoord = drawParams.baseCoord;  // save for next time use in drawOptionChanged
			//console.log('context center', baseCoord);

			// debug
			/*
			 if (this.getRenderType() === Kekule.Render.RendererType.R3D)
			 baseCoord = null;
			 */

			//console.log(drawParams, drawParams.baseCoord, drawParams.drawOptions);
			painter.draw(context, drawParams.baseCoord, drawParams.drawOptions);

			if (transformOpsChanged)
			{
				this._savePainterInitialRenderTransformOptions(context, painter);
			}

			//var end = (new Date()).getTime();
			//var duration = end - start;
			//console.log('draw in ' + duration + ' ms');
		}
		finally
		{
			this.endPaint();
		}
	},

	/** @private */
	beginPaint: function()
	{
		if (!this._paintFlag)
			this._paintFlag = 0;
		++this._paintFlag;
	},
	/** @private */
	endPaint: function()
	{
		if (this._paintFlag > 0)
			--this._paintFlag;
		if (this._paintFlag < 0)
			this._paintFlag = 0;
	},
	/**
	 * Returns whether in the painting process.
	 * @returns {Bool}
	 */
	isPainting: function()
	{
		return this._paintFlag > 0;
	},

	/**
	 * Returns background color used for a special renderType.
	 * @param {Int} renderType
	 * @returns {String}
	 */
	getBackgroundColorOfType: function(renderType)
	{
		return this._bgColorMap[renderType.toString()];
	},
	/**
	 * Set background color used for a special renderType.
	 * @param {String} color
	 * @param {Int} renderType
	 */
	setBackgroundColorOfType: function(color, renderType)
	{
		this._bgColorMap[renderType.toString()] = color;
		if (renderType === this.getRenderType())
			this.setBackgroundColor(color);
	},
	/**
	 * Called after background color is changed, should repaint the context.
	 */
	backgroundColorChanged: function(doNotRepaint)
	{
		var color = this.getBackgroundColor();
		if (color === 'transparent')
			color = null;
		var drawBridge = this.getDrawBridge(true);
		if (drawBridge && drawBridge.setClearColor)
		{
			drawBridge.setClearColor(this.getDrawContext(), color);
			if (!doNotRepaint)
				this.repaint();
		}
	},
	/**
	 * Called after draw options are changed. Should repaint the context.
	 * Repaint is a time-consuming job. So if only rotate/scale/translate options changes,
	 * geometryOptionChanged method should be used instead.
	 * @private
	 */
	drawOptionChanged: function()
	{
		this.repaint();
	},
	/**
	 * Called after only geometry options (translate, scale, rotations) are changed.
	 * @private
	 */
	geometryOptionChanged: function()
	{
		var painter = this.getPainter();
		var drawOptions = this.getDrawOptions();
		if (painter.supportGeometryOptionChange())
		{
			var context = this.getDrawContext();
			painter.changeGeometryOptions(context, drawOptions.baseCoord || this._lastBaseCoord, drawOptions);
			this._savePainterInitialRenderTransformOptions(context, painter);
		}
		else
			this.drawOptionChanged();
	},

	/**
	 * Notify the displayer that in following process, continuous repainting will start and auto size should be disabled.
	 * After this phase, endContinuousRepainting() must be called.
	 */
	beginContinuousRepainting: function()
	{
		this._isContinuousRepainting = true;
	},
	/**
	 * Notify the displayer that continuous phase has ended, turn into normal mode.
	 */
	endContinuousRepainting: function()
	{
		if (this._isContinuousRepainting)
		{
			this._isContinuousRepainting = false;
			this.repaint();
		}
	},

	/**
	 * Reset displayer to initial state (no zoom, rotation and so on).
	 */
	resetDisplay: function()
	{
		var op = this.getDrawOptions();
		op.zoom = 1;
		op.rotateX = 0;
		op.rotateY = 0;
		op.rotateZ = 0;
		op.rotateAngle = 0;
		op.rotateAxisVector = null;
		op.rotateMatrix = null;
		//this.drawOptionChanged();
		this.setBaseCoordOffset(null);
		this.geometryOptionChanged();
		return this;
	},

	/**
	 * Returns zoom property in drawOptions.
	 * @returns {Float}
	 */
	getCurrZoom: function()
	{
		return this.getDrawOptions().zoom || 1;
	},
	/**
	 * Zoom to a specified ratio
	 * @param {Float} value
	 * @param {Bool} suspendRendering Set this to true if a immediate repaint is not needed.
	 */
	zoomTo: function(value, suspendRendering)
	{
		this.getDrawOptions().zoom = value;
		//this.drawOptionChanged();
		if (!suspendRendering)
			this.geometryOptionChanged();
		return this;
	},
	/**
	 * Zoom in.
	 */
	zoomIn: function(step)
	{
		var curr = this.getCurrZoom();
		var ratio = ZU.getNextZoomInRatio(curr, step || 1);
		return this.zoomTo(ratio);
	},
	/**
	 * Zoom out.
	 */
	zoomOut: function(step)
	{
		var curr = this.getCurrZoom();
		var ratio = ZU.getNextZoomOutRatio(curr, step || 1);
		return this.zoomTo(ratio);
	},
	/**
	 * Reset to normal size.
	 */
	resetZoom: function()
	{
		return this.zoomTo(1);
	},

	/**
	 * Returns default mol display type in special render mode.
	 * @param {Int} renderType
	 * @return {Int}
	 * @private
	 */
	getDefaultMoleculeDisplayType: function(renderType)
	{
		return (renderType === Kekule.Render.RendererType.R3D)?
			Kekule.Render.Molecule3DDisplayType.DEFAULT: Kekule.Render.Molecule2DDisplayType.DEFAULT;
	},
	/**
	 * Returns current molecule display type.
	 * @returns {Int}
	 */
	getCurrMoleculeDisplayType: function()
	{
		var result = this.getDrawOptions().moleculeDisplayType;
		if (!result) // not set, use default
			result = this.getDefaultMoleculeDisplayType(this.getRenderType());
		return result;
	},
	/*
	 * Change molecule display type.
	 * @param {Int} newType Value from {@link Kekule.Render.Molecule2DDisplayType} or {@link Kekule.Render.Molecule3DDisplayType}.
	 */
	/*
	setMoleculeDisplayType: function(newType)
	{
		this.getDrawOptions().moleculeDisplayType = newType;
		this.drawOptionChanged();
		return this;
	},
	*/
	/**
	 * Hide or show all hydrogen atoms in 3D model.
	 * @param {Int} newType Value from {@link Kekule.Render.Molecule2DDisplayType} or {@link Kekule.Render.Molecule3DDisplayType}.
	 */
	setHideHydrogens: function(newValue)
	{
		this.getDrawOptions().hideHydrogens = newValue;
		this.drawOptionChanged();
		return this;
	},

	/**
	 * Export drawing content in viewer to a data URL for <img> tag to use.
	 * @param {String} dataType Type of image data, e.g. 'image/png'.
	 * @param {Hash} options Export options, usually this is a number between 0 and 1
	 *   indicating image quality if the requested type is image/jpeg or image/webp.
	 * @returns {String}
	 */
	exportToDataUri: function(dataType, options)
	{
		//console.log(this.getDrawBridge(), this.getDrawContext());
		return this.getDrawBridge().exportToDataUri(this.getDrawContext(), dataType, options);
	},

	////// about configurator
	/** @ignore */
	createConfigurator: function($super)
	{
		var result = $super();
		result.addEventListener('configChange', function(e){
			// render config change need to repaint context
			this.repaint();
		}, this);
		return result;
	}
});

/**
 * A special class to give a setting facade for ChemObjDisplayer.
 * Do not use this class alone.
 * @class
 * @augments Kekule.Widget.BaseWidget.Settings
 *
 * @param {Kekule.ChemWidget.ChemObjDisplayer} displayer
 * @ignore
 */
Kekule.ChemWidget.ChemObjDisplayer.Settings = Class.create(Kekule.Widget.BaseWidget.Settings,
/** @lends Kekule.ChemWidget.ChemObjDisplayer.Settings# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ChemObjDisplayer.Settings',
	/** @construct */
	initialize: function($super, displayer)
	{
		$super(displayer);
	},
	/** @private */
	initProperties: function()
	{
		//this.defineProp('displayer', {'dataType': 'Kekule.ChemWidget.ChemObjDisplayer', 'serializable': false, 'scope': PS.PUBLIC});
		this.defineDelegatedProps(['enableLoadNewFile']);
	},
	/** @ignore */
	getDisplayer: function()
	{
		return this.getWidget();
	}
});

/**
 * A special widget class to open a config widget for ChemObjDisplayer.
 * Do not use this widget alone.
 * @class
 * @augments Kekule.Widget.Configurator
 *
 * @param {Kekule.ChemWidget.ChemObjDisplayer} displayer
 */
Kekule.ChemWidget.ChemObjDisplayer.Configurator = Class.create(Kekule.Widget.Configurator,
/** @lends Kekule.ChemWidget.ChemObjDisplayer.Configurator# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ChemObjDisplayer.Configurator',
	/** @private */
	TAB_BTN_DATA_FIELD: '__$data__',
	/** @construct */
	initialize: function($super, displayer)
	{
		$super(displayer);
	},
	/** @ignore */
	initPropValues: function($super)
	{
		$super();
		this.setLayout(Kekule.Widget.Layout.HORIZONTAL);
	},
	/** @private */
	getCategoryInfos: function($super)
	{
		var result = $super();
		var displayer = this.getDisplayer();

		// renderConfigs and displayerConfigs
		var configObjs = [displayer.getDisplayerConfigs(), displayer.getRenderConfigs()];
		for (var j = 0, k = configObjs.length; j < k; ++j)
		{
			var config = configObjs[j];
			var props = config.getPropListOfScopes([Class.PropertyScope.PUBLISHED]);
			for (var i = 0, l = props.getLength(); i < l; ++i)
			{
				var propInfo = props.getPropInfoAt(i);
				var obj = config.getPropValue(propInfo.name);
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
		}
		return result;
	},
	/** @private */
	getDisplayer: function()
	{
		return this.getWidget();
	}
});

/**
 * Action for loading a file in chem displayer.
 * @class
 * @augments Kekule.ActionLoadFileData
 */
Kekule.ChemWidget.ActionDisplayerLoadFile = Class.create(/*Kekule.ActionFileOpen*/Kekule.ActionLoadFileData,
/** @lends Kekule.ChemWidget.ActionDisplayerLoadFile# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionDisplayerLoadFile',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_LOADFILE,
	/** @constructs */
	initialize: function($super, displayer)
	{
		$super();
		this.setDisplayer(displayer);
		this.setText(/*CWT.CAPTION_LOADFILE*/Kekule.$L('ChemWidgetTexts.CAPTION_LOADFILE'));
		this.setHint(/*CWT.HINT_LOADFILE*/Kekule.$L('ChemWidgetTexts.HINT_LOADFILE'));
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('displayer', {'dataType': 'Kekule.ChemWidget.ChemObjDisplayer', 'serializable': false});
	},
	/** @private */
	doUpdate: function($super)
	{
		$super();
		var displayer = this.getDisplayer();
		this.setEnabled(this.getEnabled() && displayer && displayer.getEnabled() && displayer.getEnableLoadNewFile());
	},
	/* @private */
	/*
	doFileOpened: function(files)
	{
		if (files && files.length)
		{
			var file = files[0];
			this.getDisplayer().loadFromFile(file);
		}
	}
	*/
	/** @private */
	doDataLoaded: function(data, fileName, loaded)
	{
		//console.log('do data loaded', fileName);
		if (loaded)
			this.getDisplayer().loadFromData(data, null, fileName);
	}
});

/**
 * Base class for actions for chem displayer.
 * @class
 * @augments Kekule.Action
 *
 * @param {Kekule.ChemWidget.ChemObjDisplayer} displayer Target displayer widget.
 *
 * @property {Kekule.ChemWidget.ChemObjDisplayer} displayer Target displayer widget.
 */
Kekule.ChemWidget.ActionOnDisplayer = Class.create(Kekule.Action,
/** @lends Kekule.ChemWidget.ActionOnDisplayer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionOnDisplayer',
	/** @constructs */
	initialize: function($super, displayer, caption, hint)
	{
		$super();
		this.setDisplayer(displayer);
		this.setText(caption);
		this.setHint(hint);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('displayer', {'dataType': 'Kekule.ChemWidget.ChemObjDisplayer', 'serializable': false});
	},
	/** @private */
	doUpdate: function()
	{
		var displayer = this.getDisplayer();
		this.setEnabled(displayer && displayer.getChemObj() && displayer.getChemObjLoaded() && displayer.getEnabled());
	}
});

/**
 * Action for set chem object to null in chem displayer.
 * @class
 * @augments Kekule.ActionOnDisplayer
 */
Kekule.ChemWidget.ActionDisplayerClear = Class.create(Kekule.ChemWidget.ActionOnDisplayer,
/** @lends Kekule.ChemWidget.ActionDisplayerClear# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionDisplayerClear',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_CLEAROBJS,
	/** @constructs */
	initialize: function($super, displayer)
	{
		$super(displayer, Kekule.$L('ChemWidgetTexts.CAPTION_CLEAROBJS'), Kekule.$L('ChemWidgetTexts.HINT_CLEAROBJS'));
	},
	/** @private */
	doUpdate: function($super)
	{
		$super();
		var displayer = this.getDisplayer();
		this.setEnabled(displayer && displayer.getEnabled() && displayer.getChemObj() /* && displayer.getChemObjLoaded()*/);
	},
	/** @private */
	doExecute: function(target)
	{
		var displayer = this.getDisplayer();
		displayer.setChemObj(null);
	}
});

/**
 * Action for loading chem object (either from file or from pasted text) to chem displayer.
 * @class
 * @augments Kekule.ActionOnDisplayer
 */
Kekule.ChemWidget.ActionDisplayerLoadData = Class.create(Kekule.ChemWidget.ActionOnDisplayer,
/** @lends Kekule.ChemWidget.ActionDisplayerLoadData# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionDisplayerLoadData',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_LOADDATA,
	/** @constructs */
	initialize: function($super, displayer)
	{
		$super(displayer, /*CWT.CAPTION_LOADDATA, CWT.HINT_LOADDATA*/Kekule.$L('ChemWidgetTexts.CAPTION_LOADDATA'), Kekule.$L('ChemWidgetTexts.HINT_LOADDATA'));
		//this.setDisplayer(displayer);
		//this.setText(CWT.CAPTION_LOADDATA);
		//this.setHint(CWT.HINT_LOADDATA);
		/*
		this._openFileAction = new Kekule.ActionFileOpen();
		this._openFileAction.update();
		this._openFileAction.addEventListener('open', this.reactFileLoad, this);
		this._sBtnLoadFromFile = CWT.CAPTION_LOADDATA_FROM_FILE;
		*/
	},
	/** @ignore */
	finalize: function($super)
	{
		//this._openFileAction.finalize();
		$super();
	},
	initPropValues: function($super)
	{
		$super();
		this.setDialogShowType(Kekule.Widget.ShowHideType.DROPDOWN);
	},
	/** @private */
	initProperties: function()
	{
		// private
		this.defineProp('dataDialog', {'dataType': 'Kekule.ChemWidget.LoadDataDialog', 'serializable': false, 'setter': null,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('dataDialog');
				if (!result)
				{
					result = this.createDataDialog();
					this.setPropStoreFieldValue('dataDialog', result);
				}
				return result;
			}
		});
		this.defineProp('dialogShowType', {'dataType': DataType.INT});
	},
	/** @private */
	createDataDialog: function()
	{
		var doc = this.getDisplayer().getDocument();
		var result = new Kekule.ChemWidget.LoadDataDialog(doc);
		return result;
	},

	/** @private */
	doUpdate: function($super)
	{
		$super();
		var displayer = this.getDisplayer();
		this.setEnabled(displayer && displayer.getEnabled() && displayer.getEnableLoadNewFile());
	},
	/** @private */
	doExecute: function(target)
	{
		var self = this;
		var dialog = this.getDataDialog();
		dialog.setAllowedFormatIds(this.getDisplayer().getAllowedInputFormatIds() || Kekule.IO.ChemDataReaderManager.getAllReadableFormatIds());

		var formatSelector = dialog._formatSelector;

		//var formatItems = this.getFormatSelectorItems(chemObj, writerInfos);
		//formatSelector.setItems(formatItems);

		// open a dialog to choose format first, then save to file
		var showType = this.getDialogShowType();
		var openMethod = (showType === Kekule.Widget.ShowHideType.DIALOG)? dialog.openModal: dialog.open;
		openMethod.apply(dialog, [
			function(result)
			{
				if (dialog.isPositiveResult(result))  // load
				{
					/*
					var data = dialog._dataEditor.getValue();
					var mimeType = dialog._formatSelector.getValue();

					//self.setLastFormat(formatId);
					var displayer = self.getDisplayer();
					displayer.loadFromData(data, mimeType);
					*/
					var displayer = self.getDisplayer();
					displayer.load(dialog.getChemObj());
				}
			}, target, showType]);
	}
});

/**
 * Action for saving chem object to file in chem displayer.
 * @class
 * @augments Kekule.ActionOnDisplayer
 *
 * @property {Int} dialogShowType Value from {@link Kekule.Widget.ShowHideType}, diplay type of save dialog.
 */
Kekule.ChemWidget.ActionDisplayerSaveFile = Class.create(Kekule.ChemWidget.ActionOnDisplayer,
/** @lends Kekule.ChemWidget.ActionDisplayerSaveFile# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionDisplayerSaveFile',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_SAVEFILE,
	/** @constructs */
	initialize: function($super, displayer)
	{
		$super(displayer, /*CWT.CAPTION_SAVEFILE, CWT.HINT_SAVEFILE*/Kekule.$L('ChemWidgetTexts.CAPTION_SAVEFILE'), Kekule.$L('ChemWidgetTexts.HINT_SAVEFILE'));
		//this.setDisplayer(displayer);
		//this.setText(CWT.CAPTION_SAVEFILE);
		//this.setHint(CWT.HINT_SAVEFILE);
		this._saveAction = new Kekule.ActionFileSave();
	},
	/** @ignore */
	finalize: function($super)
	{
		this._saveAction.finalize();
		$super();
	},
	/** @ignore */
	initPropValues: function($super)
	{
		$super();
		this.setDialogShowType(Kekule.Widget.ShowHideType.DROPDOWN);
	},
	/** @private */
	initProperties: function()
	{
		// private
		this.defineProp('formatDialog', {'dataType': 'Kekule.Widget.Dialog', 'serializable': false, 'setter': null,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('formatDialog');
				if (!result)
				{
					result = this.createFormatDialog();
					this.setPropStoreFieldValue('formatDialog', result);
				}
				return result;
			}
		});
		this.defineProp('lastFormat', {'dataType': DataType.STRING, 'serializable': false});
		this.defineProp('currSaveData', {'dataType': DataType.VARIANT, 'serializable': false});
		this.defineProp('dialogShowType', {'dataType': DataType.INT});
	},

	/** @private */
	getChemObjSrcInfo: function(chemObj)
	{
		var displayer = this.getDisplayer();
		return displayer.getChemObjSrcInfo? displayer.getChemObjSrcInfo(chemObj):
			chemObj.getSrcInfo? chemObj.getSrcInfo():
			null;
	},
	/** @private */
	getChemObjSrcFormat: function(chemObj)
	{
		var srcInfo = this.getChemObjSrcInfo(chemObj);
		return srcInfo? srcInfo.format: null;
	},

	/** @private */
	createFormatDialog: function()
	{
		var doc = this.getDisplayer().getDocument();
		var result = new Kekule.Widget.Dialog(doc, /*CWT.CAPTION_CHOOSEFILEFORMAT*/Kekule.$L('ChemWidgetTexts.CAPTION_CHOOSEFILEFORMAT'), [Kekule.Widget.DialogButtons.OK, Kekule.Widget.DialogButtons.CANCEL]);
		result.addClassName(CCNS.DIALOG_CHOOSE_FILE_FORAMT);
		// label
		var elem = doc.createElement('div');
		elem.innerHTML = Kekule.$L('ChemWidgetTexts.CAPTION_SELECT_FORMAT'); //CWT.CAPTION_SELECT_FORMAT;
		result.getClientElem().appendChild(elem);
		// format selector
		elem = doc.createElement('div');
		result.getClientElem().appendChild(elem);
		var formatSelector = new Kekule.Widget.SelectBox(result);
		formatSelector.addClassName(CCNS.DIALOG_CHOOSE_FILE_FORAMT_FORMATBOX);
		formatSelector.appendToElem(elem);
		formatSelector.addEventListener('valueChange', this.reactFormatSelectorChange, this);
		result._formatSelector = formatSelector;
		// label
		var elem = doc.createElement('div');
		elem.innerHTML = Kekule.$L('ChemWidgetTexts.CAPTION_PREVIEW_FILE_CONTENT'); //CWT.CAPTION_PREVIEW_FILE_CONTENT;
		result.getClientElem().appendChild(elem);
		// preview textarea
		elem = doc.createElement('div');
		result.getClientElem().appendChild(elem);
		var previewTextArea = new Kekule.Widget.TextEditor(result); //new Kekule.Widget.TextArea(result);
		previewTextArea.setReadOnly(true);
		previewTextArea.setWrap('off');
		previewTextArea.setToolbarPos(Kekule.Widget.Position.BOTTOM);
		previewTextArea.addClassName(CCNS.DIALOG_CHOOSE_FILE_FORAMT_PREVIEWER);
		previewTextArea.appendToElem(elem);
		result._previewTextArea = previewTextArea;
		return result;
	},
	/** @private */

	getAvailableWriterInfos: function(chemObj)
	{
		//var obj = this.getDisplayer().getChemObj();
		if (!chemObj)
			return [];
		else
		{
			var result = Kekule.IO.ChemDataWriterManager.getAvailableWriterInfos(null, chemObj);
			return result;
		}
	},

	/** @private */
	getFormatSelectorItems: function(chemObj, writerInfos)
	{
		//console.log(writerInfos);
		var result = [];
		var formatIds = [];

		var srcInfo = this.getChemObjSrcInfo(chemObj);
		var srcFormat = (srcInfo)? srcInfo.format: null;

		for (var i = 0, l = writerInfos.length; i < l; ++i)
		{
			var info = writerInfos[i];
			Kekule.ArrayUtils.pushUnique(formatIds, info.formatId);
		}
		formatIds = Kekule.ArrayUtils.intersect(this.getAllowedFormatIds(), formatIds);

		for (var i = 0, l = formatIds.length; i < l; ++i)
		{
			var idInfo = Kekule.IO.DataFormatsManager.getFormatInfo(formatIds[i]);
			if (idInfo)
			{
				var fileExts = Kekule.ArrayUtils.clone(Kekule.ArrayUtils.toArray(idInfo.fileExts));
				for (var j = 0, k = fileExts.length; j < k; ++j)
				{
					fileExts[j] = '*.' + fileExts[j];
				}
				var sFileExt = fileExts.join(', ');
				var text = idInfo.title;
				/*
				if (idInfo.mimeType)
					text += ' | ' + idInfo.mimeType;
				*/
				if (sFileExt)
					text += ' (' + sFileExt + ')';
				var selected = srcFormat? (formatIds[i] === srcFormat):
					this.getLastFormat()? (this.getLastFormat() === formatIds[i]):
					i === 0;
				result.push({
					'value': idInfo.id,
					'text': text,
					'title': idInfo.mimeType,
					'data': idInfo,
					'selected': selected
				});
			}
		}
		result.sort(function(a, b)
			{
				return (a.text < b.text)? -1:
					(a.text > b.text)? 1:
						0;
			}
		);
		return result;
	},
	/** @private */
	getAllowedFormatIds: function()
	{
		return this.getDisplayer().getAllowedOutputFormatIds() || Kekule.IO.ChemDataWriterManager.getAllWritableFormatIds();
	},
	/** @private */
	getFileFilters: function(formatItems)
	{
		var result = [];
		for (var i = 0, l = formatItems.length; i < l; ++i)
		{
			var format = formatItems[i];
			var info = format.data;
			var title = format.text || format.title || format.value;
			var exts = Kekule.ArrayUtils.toArray(info.fileExts);
			/*
			for (var j = 0, k = exts.length; j < k; ++j)
			{
				result.push({'title': title, 'filter': '.' + exts[j]});
			}
			*/
			result.push({'title': title, 'filter': '.' + exts.join(',.')});
		}
		// add all and any filter
		result.push(Kekule.NativeServices.FILTER_ALL_SUPPORT);
		result.push(Kekule.NativeServices.FILTER_ANY);
		return result;
	},
	/** @private */
	updateFormatItems: function(chemObj)
	{
		this._formatItems = this.getFormatSelectorItems(chemObj, this.getAvailableWriterInfos());
		this._formatSelector.setItems(this._formatItems);
		var filters = this.getFileFilters(this._formatItems);
		this._saveAction.setFilters(filters);
	},
	/** @private */
	reactFormatSelectorChange: function()
	{
		var formatId = this.getFormatDialog()._formatSelector.getValue();
		this.updatePreview(formatId, this.getFormatDialog());
	},
	/** @private */
	updatePreview: function(formatId, dialogWidget)
	{
		var textArea = dialogWidget._previewTextArea;
		textArea.setValue('');
		if (formatId)
		{
			var formatInfo = Kekule.IO.DataFormatsManager.getFormatInfo(formatId);
			var obj = this.getTargetObj();
			var srcInfo = this.getChemObjSrcInfo(obj);
			if (srcInfo && srcInfo.format === formatId && srcInfo.data)  // can use src data
			{
				textArea.setValue(srcInfo.data);
				this.setCurrSaveData(srcInfo.data);
			}
			else
			{
				// get suitable writer
				/*
				var writer = Kekule.IO.ChemDataWriterManager.getWriterByFormat(formatId, null, obj);
				if (writer)
				{
					var doCanonicalize = this.getDisplayer().getDisplayerConfigs().getIoConfigs().getCanonicalizeBeforeSave();
					if (doCanonicalize && obj.canonicalize)  // canonicalize first
					{
						var obj = obj.clone? obj.clone(true): obj;  // clone with id
						obj.canonicalize();
					}
					var data = writer.writeData(obj, formatInfo.dataType, formatId);
					textArea.setValue(data);
					this.setCurrSaveData(data);
				}
				*/
				var data = this.getDisplayer().saveData(formatId, formatInfo.dataType, obj);
				textArea.setValue(data);
				this.setCurrSaveData(data);
			}
		}
	},
	/** @private */
	getTargetObj: function(formatId)
	{
		return this.getDisplayer().getSavingTargetObj();
	},
	/** @private */
	doUpdate: function($super)
	{
		$super();
		var displayer = this.getDisplayer();
		if (this._saveAction)
			this._saveAction.update();
		this.setEnabled(displayer && displayer.getEnabled() && displayer.getChemObj()/* && this._saveAction.getEnabled()*/);
	},
	/** @private */
	doExecute: function(target)
	{
		var self = this;
		var dialog = this.getFormatDialog();
		var chemObj = this.getTargetObj(); //this.getDisplayer().getChemObj();

		var formatSelector = dialog._formatSelector;
		var writerInfos = this.getAvailableWriterInfos(chemObj);
		var formatItems = this.getFormatSelectorItems(chemObj, writerInfos);
		formatSelector.setItems(formatItems);
		this.reactFormatSelectorChange();

		// update OK button enabled
		var saveEnabled = false;
		if (this._saveAction)
		{
			//this._saveAction.update();
			saveEnabled = this._saveAction.getEnabled();
		}
		var btn = dialog.getDialogButton(Kekule.Widget.DialogButtons.OK);
		if (btn)
			btn.setEnabled(saveEnabled);

		// open a dialog to choose format first, then save to file
		var showType = this.getDialogShowType();
		var openMethod = (showType === Kekule.Widget.ShowHideType.DIALOG)? dialog.openModal: dialog.open;
		openMethod.apply(dialog, [
			function(result)
			{
				if (result === Kekule.Widget.DialogButtons.OK)  // save
				{
					//var data = dialog._previewTextArea.getValue();
					var data = self.getCurrSaveData();
					self._saveAction.setData(data);
					var formatId = dialog._formatSelector.getValue();
					self.setLastFormat(formatId);
					//var fileExts = Kekule.IO.DataFormatsManager.getFileExts(formatId);
					var formatInfo = Kekule.IO.DataFormatsManager.getFormatInfo(formatId);
					var fileExts = formatInfo.fileExts;
					var ext = Kekule.ArrayUtils.toArray(fileExts[0] || fileExts);
					var filters = [
						{'title': formatInfo.title || formatInfo.mimeType, 'filter': '.' + ext.join(',.')},
						Kekule.NativeServices.FILTER_ANY
					];
					var fileName = /*CWT.S_DEF_SAVE_FILENAME*/Kekule.$L('ChemWidgetTexts.S_DEF_SAVE_FILENAME') + '.' + ext;
					self._saveAction.setFileName(fileName);
					self._saveAction.setFilters(filters);
					//console.log(fileName);
					self._saveAction.execute(target);
				}
			}, target, showType]
		);
	}
});

/**
 * Action for reset viewer.
 * @class
 * @augments Kekule.ChemWidget.ActionOnDisplayer
 */
Kekule.ChemWidget.ActionDisplayerReset = Class.create(Kekule.ChemWidget.ActionOnDisplayer,
/** @lends Kekule.ChemWidget.ActionDisplayerReset# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionDisplayerReset',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_RESET,
	/** @constructs */
	initialize: function($super, displayer)
	{
		$super(displayer, /*CWT.CAPTION_RESETVIEW, CWT.HINT_RESETVIEW*/Kekule.$L('ChemWidgetTexts.CAPTION_RESETVIEW'), Kekule.$L('ChemWidgetTexts.HINT_RESETVIEW'));
	},
	/** @private */
	doExecute: function()
	{
		this.getDisplayer().resetDisplay();
	}
});

/**
 * Action for zoom in the viewer.
 * @class
 * @augments Kekule.ChemWidget.ActionViewer
 */
Kekule.ChemWidget.ActionDisplayerZoomIn = Class.create(Kekule.ChemWidget.ActionOnDisplayer,
/** @lends Kekule.ChemWidget.ActionDisplayerZoomIn# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionDisplayerZoomIn',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_ZOOMIN,
	/** @constructs */
	initialize: function($super, displayer)
	{
		$super(displayer, /*CWT.CAPTION_ZOOMIN, CWT.HINT_ZOOMIN*/Kekule.$L('ChemWidgetTexts.CAPTION_ZOOMIN'), Kekule.$L('ChemWidgetTexts.HINT_ZOOMIN'));
	},
	/** @private */
	doExecute: function()
	{
		this.getDisplayer().zoomIn();
	}
});
/**
 * Action for zoom out the viewer.
 * @class
 * @augments Kekule.ChemWidget.ActionViewer
 */
Kekule.ChemWidget.ActionDisplayerZoomOut = Class.create(Kekule.ChemWidget.ActionOnDisplayer,
/** @lends Kekule.ChemWidget.ActionDisplayerZoomOut# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionDisplayerZoomOut',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_ZOOMOUT,
	/** @constructs */
	initialize: function($super, displayer)
	{
		$super(displayer, /*CWT.CAPTION_ZOOMOUT, CWT.HINT_ZOOMOUT*/Kekule.$L('ChemWidgetTexts.CAPTION_ZOOMOUT'), Kekule.$L('ChemWidgetTexts.HINT_ZOOMOUT'));
	},
	/** @private */
	doExecute: function()
	{
		this.getDisplayer().zoomOut();
	}
});
/**
 * Action for reset zoom to 1 on viewer.
 * @class
 * @augments Kekule.ChemWidget.ActionViewer
 */
Kekule.ChemWidget.ActionDisplayerResetZoom = Class.create(Kekule.ChemWidget.ActionOnDisplayer,
/** @lends Kekule.ChemWidget.ActionDisplayerResetZoom# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionDisplayerResetZoom',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_RESETZOOM,
	/** @constructs */
	initialize: function($super, displayer)
	{
		$super(displayer, /*CWT.CAPTION_RESETZOOM, CWT.HINT_RESETZOOM*/Kekule.$L('ChemWidgetTexts.CAPTION_RESETZOOM'), Kekule.$L('ChemWidgetTexts.HINT_RESETZOOM'));
	},
	/** @private */
	doExecute: function()
	{
		this.getDisplayer().resetZoom();
	}
});

/**
 * Action for show or hide all hydrogen atoms in 3D mode displayer.
 * @class
 * @augments Kekule.ChemWidget.ActionOnDisplayer
 */
Kekule.ChemWidget.ActionDisplayerHideHydrogens = Class.create(Kekule.ChemWidget.ActionOnDisplayer,
/** @lends Kekule.ChemWidget.ActionDisplayerHideHydrogens# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionDisplayerHideHydrogens',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_MOL_HIDE_HYDROGENS,
	/** @constructs */
	initialize: function($super, displayer)
	{
		$super(displayer, /*CWT.CAPTION_HIDEHYDROGENS, CWT.HINT_HIDEHYDROGENS*/Kekule.$L('ChemWidgetTexts.CAPTION_HIDEHYDROGENS'), Kekule.$L('ChemWidgetTexts.HINT_HIDEHYDROGENS'));
	},
	/** @private */
	doUpdate: function($super)
	{
		$super();
		var displayer = this.getDisplayer();
		var flag = displayer && (displayer.getRenderType() === Kekule.Render.RendererType.R3D);
		this.setDisplayed(/*this.getDisplayed() &&*/ flag).setEnabled(this.getEnabled() && flag);
	},
	/** @private */
	doExecute: function()
	{
		var checked = !this.getChecked();
		this.setChecked(checked);
		this.getDisplayer().setHideHydrogens(checked);
	}
});

/**
 * Base action for change molecule display type of displayer.
 * @class
 * @augments Kekule.ChemWidget.ActionOnDisplayer
 */
Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeBase = Class.create(Kekule.ChemWidget.ActionOnDisplayer,
/** @lends Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeBase# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeBase',
	/** @constructs */
	initialize: function($super, displayer, caption, hint, displayType)
	{
		$super(displayer, caption, hint);
		this._displayType = displayType;
		this.setCheckGroup('__molDisplayType__');
	},
	/** @private */
	doUpdate: function($super)
	{
		$super();
		var displayer = this.getDisplayer();
		this.setChecked(displayer && displayer.getCurrMoleculeDisplayType() === this.getMolDisplayType());
	},
	/** @private */
	doExecute: function()
	{
		this.getDisplayer().setMoleculeDisplayType(this._displayType);
		this.setChecked(true);
	},
	/**
	 * Returns molecule display type set by this action.
	 * @returns {Int}
	 */
	getMolDisplayType: function()
	{
		return this._displayType;
	}
});
/**
 * Base action for change 2D molecule display type of displayer.
 * @class
 * @augments Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeBase
 */
Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeBase2D = Class.create(Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeBase,
/** @lends Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeBase2D# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeBase2D',
	/** @private */
	doUpdate: function($super)
	{
		$super();
		var displayer = this.getDisplayer();
		var flag = displayer && (displayer.getRenderType() === Kekule.Render.RendererType.R2D);
		this.setDisplayed(/*this.getDisplayed() &&*/ flag).setEnabled(this.getEnabled() && flag);
	}
});
/**
 * Base action for change 3D molecule display type of displayer.
 * @class
 * @augments Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeBase
 */
Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeBase3D = Class.create(Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeBase,
/** @lends Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeBase3D# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeBase3D',
	/** @private */
	doUpdate: function($super)
	{
		$super();
		var displayer = this.getDisplayer();
		var flag = displayer && (displayer.getRenderType() === Kekule.Render.RendererType.R3D);
		this.setDisplayed(/*this.getDisplayed() &&*/ flag).setEnabled(this.getEnabled() && flag);
	}
});
/**
 * Action change displayer's molecule display type to {@link Kekule.Render.Molecule2DDisplayType.SKELETAL}.
 * @class
 * @augments Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeBase2D
 */
Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeSkeletal = Class.create(Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeBase2D,
/** @lends Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeSkeletal# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeSkeletal',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_MOL_DISPLAY_SKELETAL,
	/** @constructs */
	initialize: function($super, viewer)
	{
		$super(viewer, /*CWT.CAPTION_SKELETAL, CWT.HINT_SKELETAL,*/
			Kekule.$L('ChemWidgetTexts.CAPTION_SKELETAL'), Kekule.$L('ChemWidgetTexts.HINT_SKELETAL'),
			Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeSkeletal.TYPE);
	}
});
/** @Ignore */
Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeSkeletal.TYPE = Kekule.Render.Molecule2DDisplayType.SKELETAL;
/**
 * Action change displayer's molecule display type to {@link Kekule.Render.Molecule2DDisplayType.CONDENSED}.
 * @class
 * @augments Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeBase2D
 */
Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeCondensed = Class.create(Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeBase2D,
/** @lends Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeCondensed# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeCondensed',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_MOL_DISPLAY_CONDENSED,
	/** @constructs */
	initialize: function($super, viewer)
	{
		$super(viewer, /*CWT.CAPTION_CONDENSED, CWT.HINT_CONDENSED,*/
			Kekule.$L('ChemWidgetTexts.CAPTION_CONDENSED'), Kekule.$L('ChemWidgetTexts.HINT_CONDENSED'),
			Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeCondensed.TYPE);
	}
});
/** @Ignore */
Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeCondensed.TYPE = Kekule.Render.Molecule2DDisplayType.CONDENSED;
/**
 * Action change displayer's molecule display type to {@link Kekule.Render.Molecule3DDisplayType.WIRE}.
 * @class
 * @augments Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeBase3D
 */
Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeWire = Class.create(Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeBase3D,
/** @lends Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeWire# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeWire',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_MOL_DISPLAY_WIRE,
	/** @constructs */
	initialize: function($super, viewer)
	{
		$super(viewer, /*CWT.CAPTION_WIRE, CWT.HINT_WIRE,*/
			Kekule.$L('ChemWidgetTexts.CAPTION_WIRE'), Kekule.$L('ChemWidgetTexts.HINT_WIRE'),
			Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeWire.TYPE);
	}
});
/** @Ignore */
Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeWire.TYPE = Kekule.Render.Molecule3DDisplayType.WIRE;
/**
 * Action change displayer's molecule display type to {@link Kekule.Render.Molecule3DDisplayType.STICKS}.
 * @class
 * @augments Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeBase3D
 */
Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeSticks = Class.create(Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeBase3D,
/** @lends Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeSticks# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeSticks',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_MOL_DISPLAY_STICKS,
	/** @constructs */
	initialize: function($super, viewer)
	{
		$super(viewer, /*CWT.CAPTION_STICKS, CWT.HINT_STICKS,*/
			Kekule.$L('ChemWidgetTexts.CAPTION_STICKS'), Kekule.$L('ChemWidgetTexts.HINT_STICKS'),
			Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeSticks.TYPE);
	}
});
/** @Ignore */
Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeSticks.TYPE = Kekule.Render.Molecule3DDisplayType.STICKS;
/**
 * Action change displayer's molecule display type to {@link Kekule.Render.Molecule3DDisplayType.BALL_STICK}.
 * @class
 * @augments Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeBase3D
 */
Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeBallStick = Class.create(Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeBase3D,
/** @lends Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeBallStick# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeBallStick',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_MOL_DISPLAY_BALLSTICK,
	/** @constructs */
	initialize: function($super, viewer)
	{
		$super(viewer, /*CWT.CAPTION_BALLSTICK, CWT.HINT_BALLSTICK,*/
			Kekule.$L('ChemWidgetTexts.CAPTION_BALLSTICK'), Kekule.$L('ChemWidgetTexts.HINT_BALLSTICK'),
			Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeBallStick.TYPE);
	}
});
/** @Ignore */
Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeBallStick.TYPE = Kekule.Render.Molecule3DDisplayType.BALL_STICK;
/**
 * Action change displayer's molecule display type to {@link Kekule.Render.Molecule3DDisplayType.SPACE_FILL}.
 * @class
 * @augments Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeBase3D
 */
Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeSpaceFill = Class.create(Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeBase3D,
/** @lends Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeSpaceFill# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeSpaceFill',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_MOL_DISPLAY_SPACEFILL,
	/** @constructs */
	initialize: function($super, viewer)
	{
		$super(viewer, /*CWT.CAPTION_SPACEFILL, CWT.HINT_SPACEFILL,*/
			Kekule.$L('ChemWidgetTexts.CAPTION_SPACEFILL'), Kekule.$L('ChemWidgetTexts.HINT_SPACEFILL'),
			Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeSpaceFill.TYPE);
	}
});
/** @Ignore */
Kekule.ChemWidget.ActionDisplayerChangeMolDisplayTypeSpaceFill.TYPE = Kekule.Render.Molecule3DDisplayType.SPACE_FILL;


})();