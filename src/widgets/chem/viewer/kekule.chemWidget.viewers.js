/**
 * @fileoverview
 * Base types and classes of chem viewer.
 * Viewer is a widget to show chem objects on HTML page.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /xbrowsers/kekule.x.js
 * requires /core/kekule.common.js
 * requires /widgets/kekule.widget.base.js
 * requires /widgets/kekule.widget.dialogs.js
 * requires /widgets/kekule.widget.helpers.js
 * requires /widgets/chem/kekule.chemWidget.base.js
 * requires /widgets/chem/kekule.chemWidget.chemObjDisplayers.js
 * requires /widgets/operation/kekule.actions.js
 * requires /widgets/commonCtrls/kekule.widget.buttons.js
 * requires /widgets/commonCtrls/kekule.widget.containers.js
 *
 * requires /localization/kekule.localize.widget.js
 */

(function(){

"use strict";

var PS = Class.PropertyScope;
var ZU = Kekule.ZoomUtils;
var BNS = Kekule.ChemWidget.ComponentWidgetNames;
var CW = Kekule.ChemWidget;
var CWT = Kekule.ChemWidgetTexts;
var EM = Kekule.Widget.EvokeMode;

/** @ignore */
Kekule.ChemWidget.HtmlClassNames = Object.extend(Kekule.ChemWidget.HtmlClassNames, {
	VIEWER: 'K-Chem-Viewer',
	VIEWER2D: 'K-Chem-Viewer2D',
	VIEWER3D: 'K-Chem-Viewer3D',
	VIEWER_ASSOC_EDITOR: 'K-Chem-Viewer-Assoc-Editor',
	VIEWER_CAPTION: 'K-Chem-Viewer-Caption',

	// predefined actions
	ACTION_ROTATE_LEFT: 'K-Chem-RotateLeft',
	ACTION_ROTATE_RIGHT: 'K-Chem-RotateRight',
	ACTION_ROTATE_X: 'K-Chem-RotateX',
	ACTION_ROTATE_Y: 'K-Chem-RotateY',
	ACTION_ROTATE_Z: 'K-Chem-RotateZ',
	ACTION_VIEWER_EDIT: 'K-Chem-Viewer-Edit'
});

var CNS = Kekule.Widget.HtmlClassNames;
var CCNS = Kekule.ChemWidget.HtmlClassNames;

/**
 * An universal viewer widget for chem objects (especially molecules).
 * @class
 * @augments Kekule.ChemWidget.ChemObjDisplayer
 *
 * @param {Variant} parentOrElementOrDocument
 * @param {Kekule.ChemObject} chemObj
 * @param {Int} renderType Display in 2D or 3D. Value from {@link Kekule.Render.RendererType}.
 * @param {Kekule.ChemWidget.ChemObjDisplayerConfigs} viewerConfigs
 *
 * @property {Int} renderType Display in 2D or 3D. Value from {@link Kekule.Render.RendererType}. Read only.
 * @property {Kekule.ChemObject} chemObj Object to be drawn. Set this property will repaint the client.
 * @property {Bool} chemObjLoaded Whether the chemObj is successful loaded and drawn in viewer.
 * //@property {Object} renderConfigs Configuration for rendering.
 * // This property should be an instance of {@link Kekule.Render.Render2DConfigs} or {@link Kekule.Render.Render3DConfigs}
 * //@property {Hash} drawOptions Options to draw object.
 * //@property {Float} zoom Zoom ratio to draw chem object. Note this setting will overwrite drawOptions.zoom.
 * //@property {Bool} autoSize Whether the widget change its size to fit the dimension of chem object.
 * //@property {Int} padding Padding between chem object and edge of widget, in px. Only works when autoSize is true.
 *
 * @property {Bool} enableDirectInteraction Whether interact without tool button is allowed (e.g., zoom/rotate by mouse).
 * @property {Bool} enableTouchInteraction Whether touch interaction is allowed. Note if enableDirectInteraction is false, touch interaction will also be disabled.
 * @property {Bool} enableEdit Whether a edit button is shown in toolbar to edit object in viewer. Works only in 2D mode.
 * @property {Bool} modalEdit Whether opens a modal dialog when editting object in viewer.
 *
 * @property {Array} toolButtons buttons in interaction tool bar. This is a array of predefined strings, e.g.: ['zoomIn', 'zoomOut', 'resetZoom', 'molDisplayType', ...].
 *   If not set, default buttons will be used.
 * @property {Bool} enableToolbar Whether show tool bar in viewer.
 * @property {Int} toolbarPos Value from {@link Kekule.Widget.Position}, position of toolbar in viewer.
 *   For example, set this property to TOP will make toolbar shows in the center below the top edge of viewer,
 *   TOP_RIGHT will make the toolbar shows at the top right corner. Default value is BOTTOM_RIGHT.
 *   Set this property to AUTO, viewer will set toolbar position (including margin) automatically.
 * @property {Int} toolbarMarginHorizontal Horizontal margin of toolbar to viewer edge, in px.
 *   Negative value means toolbar outside viewer.
 * @property {Int} toolbarMarginVertical Vertical margin of toolbar to viewer edge, in px.
 *   Negative value means toolbar outside viewer.
 * //@property {Array} toolbarShowEvents Events to cause the display of toolbar. If set to null, the toolbar will always be visible.
 * @property {Array} toolbarEvokeModes Interaction modes to show the toolbar. Array item values should from {@link Kekule.Widget.EvokeMode}.
 *   Set enableToolbar to true and include {@link Kekule.Widget.EvokeMode.ALWAYS} will always show the toolbar.
 * @property {Array} toolbarRevokeModes Interaction modes to hide the toolbar. Array item values should from {@link Kekule.Widget.EvokeMode}.
 * @property {Int} toolbarRevokeTimeout Toolbar should be hidden after how many milliseconds after shown.
 *   Only available when {@link Kekule.Widget.EvokeMode.EVOKEE_TIMEOUT} or {@link Kekule.Widget.EvokeMode.EVOKER_TIMEOUT} in toolbarRevokeModes.
 *
 * @property {Array} allowedMolDisplayTypes Molecule types can be changed in tool bar.
 */
/**
 * Invoked when the an chem object is loaded into the viewer.
 *   event param of it has one fields: {obj: Object}
 * @name Kekule.ChemWidget.Viewer#load
 * @event
 */
Kekule.ChemWidget.Viewer = Class.create(Kekule.ChemWidget.ChemObjDisplayer,
/** @lends Kekule.ChemWidget.viewer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.Viewer',
	/** @private */
	BINDABLE_TAG_NAMES: ['div', 'span', 'img'],
	/** @private */
	DEF_TOOLBAR_EVOKE_MODES: [/*EM.ALWAYS,*/ EM.EVOKEE_CLICK, EM.EVOKEE_MOUSE_ENTER, EM.EVOKEE_TOUCH],
	/** @private */
	DEF_TOOLBAR_REVOKE_MODES: [/*EM.ALWAYS,*/ /*EM.EVOKEE_CLICK,*/ EM.EVOKEE_MOUSE_LEAVE, EM.EVOKER_TIMEOUT],
	/** @construct */
	initialize: function($super, parentOrElementOrDocument, chemObj, renderType, viewerConfigs)
	{
		//this._errorReportElem = null;  // use internally
		this.setPropStoreFieldValue('renderType', renderType || Kekule.Render.RendererType.R2D); // must set this value first
		this.setPropStoreFieldValue('enableToolbar', false);
		this.setPropStoreFieldValue('toolbarEvokeModes', this.DEF_TOOLBAR_EVOKE_MODES);
		this.setPropStoreFieldValue('toolbarRevokeModes', this.DEF_TOOLBAR_REVOKE_MODES);
		this.setPropStoreFieldValue('enableDirectInteraction', true);
		this.setPropStoreFieldValue('enableTouchInteraction', false);
		this.setPropStoreFieldValue('toolbarPos', Kekule.Widget.Position.AUTO);
		this.setPropStoreFieldValue('toolbarMarginHorizontal', 10);
		this.setPropStoreFieldValue('toolbarMarginVertical', 10);
		$super(parentOrElementOrDocument, chemObj, renderType, viewerConfigs);
		this.setPadding(this.getRenderConfigs().getLengthConfigs().getActualLength('autofitContextPadding'));
		/*
		if (chemObj)
		{
			this.setChemObj(chemObj);
		}
		*/
		this.setUseCornerDecoration(true);
		this._isContinuousRepainting = false;  // flag, use internally
		//this._lastRotate3DMatrix = null;  // store the last 3D rotation information

		// debug
		/*
		this.setEnableEdit(true);
		*/
		this.setModalEdit(true);

		this.addIaController('default', new Kekule.ChemWidget.ViewerBasicInteractionController(this), true);
	},
	/** @private */
	doFinalize: function($super)
	{
		//this.getPainter().finalize();
		var toolBar = this.getToolbar();
		if (toolBar)
			toolBar.finalize();
		$super();
	},
	/** @private */
	initProperties: function()
	{
		/*
		this.defineProp('chemObj', {'dataType': 'Kekule.ChemObject', 'serializable': false,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('chemObj', value);
				this.chemObjChanged(value);
			}
		});
		this.defineProp('chemObjLoaded', {'dataType': DataType.BOOL, 'serializable': false, 'setter': null,
			'getter': function() { return this.getChemObj() && this.getPropStoreFieldValue('chemObjLoaded'); }
		});
		this.defineProp('renderType', {'dataType': DataType.INT, 'serializable': false, 'setter': null});

		this.defineProp('renderConfigs', {'dataType': DataType.OBJECT, 'serializable': false});
		this.defineProp('drawOptions', {'dataType': DataType.HASH, 'serializable': false,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('drawOptions');
				if (!result)
				{
					result = {};
					this.setPropStoreFieldValue('drawOptions', result);
				}
				return result;
			}
		});
		*/

		//this.defineProp('zoom', {'dataType': DataType.FLOAT, 'serializable': false});

		this.defineProp('viewerConfigs', {'dataType': 'Kekule.ChemWidget.ChemObjDisplayerConfigs', 'serializable': false,
			'getter': function() { return this.getDisplayerConfigs(); },
			'setter': function(value) { return this.setDisplayerConfigs(value); }
		});

		this.defineProp('allowedMolDisplayTypes', {'dataType': DataType.ARRAY, 'scope': PS.PUBLIC,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('allowedMolDisplayTypes', value);
				this.updateToolbar();
			}
		});

		/*
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

		this.defineProp('padding', {'dataType': DataType.INT, 'serializable': false});

		// private properties
		this.defineProp('drawBridge', {'dataType': DataType.OBJECT, 'serializable': false, 'setter': null,
			'getter': function()
				{
					var result = this.getPropStoreFieldValue('drawBridge');
					if (!result)
					{
						result = this.createDrawBridge();
						this.setPropStoreFieldValue('drawBridge', result);
					}
					return result;
				}
		});
		this.defineProp('drawContext', {'dataType': DataType.OBJECT, 'serializable': false, 'setter': null,
			'getter': function()
				{
					var result = this.getPropStoreFieldValue('drawContext');
					if (!result)
					{
						var bridge = this.getDrawBridge();
						if (bridge)
						{
							var elem = this.getElement();
							if (!elem)
								return null;
							else
							{
								var dim = Kekule.HtmlElementUtils.getElemScrollDimension(elem);
								//var dim = Kekule.HtmlElementUtils.getElemClientDimension(elem);
								//var dim = Kekule.HtmlElementUtils.getElemOffsetDimension(elem);
								result = bridge.createContext(elem, dim.width, dim.height);
								  // a little smaller than current element, avoid scroll bars in when setting CSS3's resize: both property
								this.setPropStoreFieldValue('drawContext', result);
							}
						}
					}
					return result;
				}
		});
		this.defineProp('painter', {'dataType': 'Kekule.Render.ChemObjPainter', 'serializable': false, 'setter': null,
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
		*/
		this.defineProp('enableEdit', {'dataType': DataType.BOOL,
			'getter': function()
			{
				// TODO: now only allows 2D editing
				return this.getPropStoreFieldValue('enableEdit') && (this.getCoordMode() !== Kekule.CoordMode.COORD3D);
			}
		});
		this.defineProp('modalEdit', {'dataType': DataType.BOOL});

		this.defineProp('toolButtons', {'dataType': DataType.HASH, 'serializable': false, 'scope': PS.PUBLIC,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('toolButtons');
				if (!result)  // create default one
				{
					result = this.getDefaultToolBarButtons();
					this.setPropStoreFieldValue('toolButtons', result);
				}
				return result;
			},
			'setter': function(value)
			{
				this.setPropStoreFieldValue('toolButtons', value);
				this.updateToolbar();
			}
		});
		// private
		this.defineProp('toolButtonNameMapping', {'dataType': DataType.HASH, 'serializable': false, 'scope': PS.PRIVATE,
			'setter': null,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('toolButtonNameMapping');
				if (!result)  // create default one
				{
					result = this.createDefaultToolButtonNameMapping();
					this.setPropStoreFieldValue('toolButtonNameMapping', result);
				}
				return result;
			}
		});
		// private
		this.defineProp('toolbar', {'dataType': 'Kekule.Widget.ButtonGroup', 'serializable': false, 'scope': PS.PRIVATE,
			'setter': function(value)
			{
				var old = this.getToolbar();
				var evokeHelper = this.getToolbarEvokeHelper();
				if (value !== old)
				{
					if (old)
					{
						old.finalize();
						var helper = this.getToolbarEvokeHelper();
						if (helper)
							helper.finalize();
						old = null;
					}
					if (evokeHelper)
						evokeHelper.finalize();
					this.setPropStoreFieldValue('toolbar', value);
					// hide the new toolbar and wait for the evoke helper to display it
					//value.setDisplayed(false);
					if (value)
					{
						this.setPropStoreFieldValue('toolbarEvokeHelper',
							new Kekule.Widget.DynamicEvokeHelper(this, value, this.getToolbarEvokeModes(), this.getToolbarRevokeModes()));
					}
				}
			}
		});

		this.defineProp('enableToolbar', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('enableToolbar', value);
				this.updateToolbar();
			}
		});

		this.defineProp('toolbarPos', {'dataType': DataType.INT, 'enumSource': Kekule.Widget.Position,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('toolbarPos', value);
				this.adjustToolbarPos();
			}
		});
		this.defineProp('toolbarMarginVertical', {'dataType': DataType.INT,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('toolbarMarginVertical', value);
				this.adjustToolbarPos();
			}
		});
		this.defineProp('toolbarMarginHorizontal', {'dataType': DataType.INT,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('toolbarMarginHorizontal', value);
				this.adjustToolbarPos();
			}
		});
		/*
		this.defineProp('toolbarShowEvents', {'dataType': DataType.ARRAY});
		this.defineProp('toolbarAlwaysShow', {'dataType': DataType.BOOL, 'serializable': false,
			'getter': function() { return !!this.getToolbarShowEvents(); },
			'setter': null
		});
		*/

		this.defineProp('toolbarEvokeHelper', {'dataType': 'Kekule.Widget.DynamicEvokeHelper',
			'serializable': false, 'setter': null, 'scope': PS.PRIVATE}); // private
		this.defineProp('toolbarEvokeModes', {'dataType': DataType.ARRAY, 'scope': PS.PUBLIC,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('toolbarEvokeModes', value || []);
				if (this.getToolbarEvokeHelper())
					this.getToolbarEvokeHelper().setEvokeModes(value || []);
			}
		});
		this.defineProp('toolbarRevokeModes', {'dataType': DataType.ARRAY, 'scope': PS.PUBLIC,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('toolbarRevokeModes', value || []);
				if (this.getToolbarEvokeHelper())
					this.getToolbarEvokeHelper().setRevokeModes(value || []);
			}
		});
		this.defineProp('toolbarRevokeTimeout', {'dataType': DataType.INT,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('toolbarRevokeTimeout', value);
				if (this.getToolbarEvokeHelper())
					this.getToolbarEvokeHelper().setTimeout(value);
			}
		});

		/*
		this.defineProp('caption', {'dataType': DataType.STRING,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('caption', value);
				this.captionChanged();
			}
		});
		this.defineProp('showCaption', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('showCaption', value);
				this.captionChanged();
			}
		});
		this.defineProp('captionElem', {'dataType': DataType.OBJECT, 'scope': PS.PRIVATE,
			'setter': null,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('captionElem');
				if (!result)  // create new
				{
					result = this.doCreateCaptionElem();
					this.setPropStoreFieldValue('captionElem', result);
				}
				return result;
			}
		});
		*/

		this.defineProp('actions', {'dataType': 'Kekule.ActionList', 'serializable': false, 'scope': PS.PUBLIC,
			'setter': null,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('actions');
				if (!result)
				{
					result = new Kekule.ActionList();
					this.setPropStoreFieldValue('actions', result);
				}
				return result;
			}
		});

		this.defineProp('enableDirectInteraction', {'dataType': DataType.BOOL});
		this.defineProp('enableTouchInteraction', {'dataType': DataType.BOOL});
	},

	/** @ignore */
	doObjectChange: function($super, modifiedPropNames)
	{
		$super(modifiedPropNames);
		this.updateActions();
	},

	/** @ignore */
	doSetElement: function($super, element)
	{
		var elem = element;
		if (elem)
		{
			var tagName = elem.tagName.toLowerCase();
			if (tagName === 'img')  // is an image element, need to use span to replace it
			{
				elem = Kekule.DomUtils.replaceTagName(elem, 'span');
				//this.setElement(elem);
				//console.log('replace img to span');
			}
		}
		return $super(elem);
	},
	/** @ignore */
	doUnbindElement: function($super, element)
	{
		// unbind old element, the context parent element should be set to null
		if (this._drawContextParentElem && this._drawContextParentElem.parentNode)
		{
			this._drawContextParentElem.parentNode.removeChild(this._drawContextParentElem);
			this._drawContextParentElem = null;
		}
		return $super(element);
	},

	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('div');
		return result;
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		var result = $super() + ' ' + CCNS.VIEWER;
		var additional = (this.getRenderType() === Kekule.Render.RendererType.R3D)?
			CCNS.VIEWER3D: CCNS.VIEWER2D;
		result += ' ' + additional;
		return result;
	},

	/** @ignore */
	doResize: function($super)
	{
		$super();
		this.adjustToolbarPos();
	},
	/** @ignore */
	doWidgetShowStateChanged: function(isShown)
	{
		if (isShown)
		{
			//console.log('update toolbar');
			//this.updateToolbar();
			this.updateActions();
		}
	},
	/** @ignore */
	refitDrawContext: function($super, doNotRepaint)
	{
		// resize context, means client size changed, so toolbar should also be adjusted.
		$super(doNotRepaint);
		this.adjustToolbarPos();
	},

	/** @private */
	doLoadEnd: function(chemObj)
	{
		this.updateActions();
	},

	/// Methods about caption: currently not used ///////////
	/* @private */
	/*
	doCreateCaptionElem: function()
	{
		var result = this.getDocument().createElement('span');
		result.className = CCNS.DYN_CREATED + ' ' + CCNS.VIEWER_CAPTION;
		this.getElement().appendChild(result);
		return result;
	},
	*/

	/*
	 * Called when caption or showCaption property has been changed.
	 * @private
	 */
	/*
	captionChanged: function()
	{
		var displayCaption = this.getShowCaption() && this.getCaption();
		var elem = this.getCaptionElem();
		Kekule.DomUtils.setElementText(elem, this.getCaption());
		elem.style.display = displayCaption? 'inherit': 'none';
	},
	*/

	/// Methods about popup editing ////////////////
	/**
	 * Open a popup editor to modify displayed object.
	 * @param {Kekule.Widget.BaseWidget} callerWidget Who invokes edit action, default is the viewer itself.
	 */
	openEditor: function(callerWidget)
	{
		if (this.getEnableEdit() && this.getChemObj())
		{
			var editor = this.createEditorWidget();
			if (editor)
			{
				editor.addClassName(CCNS.VIEWER_ASSOC_EDITOR);
				// load object in editor
				var chemObj = this.getChemObj();
				var cloneObj = chemObj.clone();  // edit this cloned one, avoid affect chemObj directly
				editor.setChemObj(cloneObj);
				// popup the editor in dialog
				var dialog = new Kekule.Widget.Dialog(this.getDocument(), CWT.CAPTION_EDIT_OBJ,
					[Kekule.Widget.DialogButtons.OK, Kekule.Widget.DialogButtons.CANCEL]
				);
				editor.appendToWidget(dialog);
				var self = this;
				var callback = function(dialogResult)
					{
						if (dialogResult === Kekule.Widget.DialogButtons.OK && editor.isDirty())  // feedback result
						{
							chemObj.assign(cloneObj);
							// clear src info data
							chemObj.setSrcInfo(null);
							//self.repaint();
							self.setChemObj(chemObj); // force repaint, as repaint() will not reflect to object changes
						}
						//console.log('done', dialogResult);
						editor.finalize();
						dialog.finalize();
					}
				if (this.getModalEdit())
					dialog.openModal(callback, callerWidget || this);
				else
					dialog.openPopup(callback, callerWidget || this);

				//editor.setChemObj(cloneObj);  // load obj in editor at last, as editor can not decide obj position when its not shown
			}
		}
	},
	/**
	 * Returns a new widget to edit object in viewer.
	 * @private
	 */
	createEditorWidget: function()
	{
		// TODO: currently fixed to composer
		var result = new Kekule.Editor.Composer(this.getDocument());
		var editor = result.getEditor();
		editor.setEnableCreateNewDoc(false);
		editor.setEnableLoadNewFile(false);
		editor.setAllowCreateNewChild(false);
		editor.addClassName(CNS.DYN_CREATED);
		return result;
	},


	////////////////////////////////////////////////
	/**
	 * Reset viewer to initial state (no zoom, rotation and so on).
	 */
	resetView: function()
	{
		return this.resetDisplay();
	},


	/**
	 * Returns current 2D rotation angle (in arc).
	 * @returns {Float}
	 */
	getCurr2DRotationAngle: function()
	{
		return this.getDrawOptions().rotateAngle || 0;
	},
	/**
	 * Do a 2D rotation base on delta.
 	 * @param {Float} delta In arc.
	 * @param {Bool} suspendRendering Set this to true if a immediate repaint is not needed.
	 */
	rotate2DBy: function(delta, suspendRendering)
	{
		return this.rotate2DTo(this.getCurr2DRotationAngle() + delta, suspendRendering);
	},
	/**
	 * Do a 2D rotation to angle.
	 * @param {Float} angle In arc.
	 * @param {Bool} suspendRendering Set this to true if a immediate repaint is not needed.
	 */
	rotate2DTo: function(angle, suspendRendering)
	{
		this.getDrawOptions().rotateAngle = angle;
		//this.drawOptionChanged();
		if (!suspendRendering)
			this.geometryOptionChanged();
		return this;
	},

	/**
	 * Returns current 3D rotation info.
	 * @returns {Hash} {rotateMatrix, rotateX, rotateY, rotateZ, rotateAngle, rotateAxisVector}
	 */
	getCurr3DRotationInfo: function()
	{
		var result = {};
		var fields = ['rotateMatrix', 'rotateX', 'rotateY', 'rotateZ', 'rotateAngle'];
		var ops = this.getDrawOptions();
		for (var i = 0, l = fields.length; i < l; ++i)
		{
			var field = fields[i];
			result[field] = ops[field] || 0;
		}
		// rotateAxisVector
		result.rotateAxisVector = ops.rotateAxisVector || null;
		return result;
	},
	/**
	 * Set 3D rotation matrix.
	 * @param {Array} matrix A 4X4 rotation matrix.
	 * @param {Bool} suspendRendering Set this to true if a immediate repaint is not needed.
	 */
	setRotate3DMatrix: function(matrix, suspendRendering)
	{
		this.getDrawOptions().rotateMatrix = matrix;
		//this.drawOptionChanged();
		if (!suspendRendering)
			this.geometryOptionChanged();
		return this;
	},

	/**
	 * Do a 3D rotation base on delta.
	 * @param {Float} deltaX In arc.
	 * @param {Float} deltaY In arc.
	 * @param {Float} deltaZ In arc.
	 * @param {Bool} suspendRendering Set this to true if a immediate repaint is not needed.
	 */
	rotate3DBy: function(deltaX, deltaY, deltaZ, suspendRendering)
	{
		var lastInfo = this.getCurr3DRotationInfo();
		var lastMatrix = lastInfo.rotateMatrix || Kekule.MatrixUtils.createIdentity(4);
		//console.log('lastMatrix', lastMatrix);
		var currMatrix = Kekule.CoordUtils.calcRotate3DMatrix({
			'rotateX': deltaX,
			'rotateY': deltaY,
			'rotateZ': deltaZ
		});
		//var matrix = Kekule.MatrixUtils.multiply(lastMatrix, currMatrix);
		var matrix = Kekule.MatrixUtils.multiply(currMatrix, lastMatrix);   // x/y/z system changes also after each rotation
		//console.log('nowMatrix', matrix);
		this.setRotate3DMatrix(matrix, suspendRendering);
		/*
		angles.rotateX += deltaX || 0;
		angles.rotateY += deltaY || 0;
		angles.rotateZ += deltaZ || 0;
		return this.rotate3DTo(angles.rotateX, angles.rotateY, angles.rotateZ);
		*/
		return this;
	},
	/**
	 * Do a 3D rotation around axis.
	 * @param {Float} angle In arc.
	 * @param {Hash} axisVector Axis vector coord.
	 * @param {Bool} suspendRendering Set this to true if a immediate repaint is not needed.
	 */
	rotate3DByAxis: function(angle, axisVector, suspendRendering)
	{
		var lastInfo = this.getCurr3DRotationInfo();
		var lastMatrix = lastInfo.rotateMatrix || Kekule.MatrixUtils.createIdentity(4);
		var currMatrix = Kekule.CoordUtils.calcRotate3DMatrix({
			'rotateAngle': angle,
			'rotateAxisVector': axisVector
		});
		var matrix = Kekule.MatrixUtils.multiply(currMatrix, lastMatrix);   // sequence is IMPORTANT!
		//var matrix = Kekule.MatrixUtils.multiply(lastMatrix, currMatrix);
		this.setRotate3DMatrix(matrix, suspendRendering);
		return this;
	},
	/*
	 * Do a 3D rotation to angle on x/y/z axis
	 * @param {Float} x Rotation on X axis
	 * @param {Float} y Rotation on Y axis
	 * @param {Float} z Rotation on Z axis
	 */
	/*
	rotate3DTo: function(x, y, z)
	{
		var ops = this.getDrawOptions();
		ops.rotateX = x || 0;
		ops.rotateY = y || 0;
		ops.rotateZ = z || 0;

		this.drawOptionChanged();
		return this;
	},
	*/

	// methods about tool buttons
	/** @private */
	getDefaultToolBarButtons: function()
	{
		var buttons = [
			//BNS.loadFile,
			BNS.loadData,
			BNS.saveFile,
			BNS.molDisplayType,
			BNS.molHideHydrogens,
			BNS.zoomIn, BNS.zoomOut,
		];
		// rotate
		if (this.getRenderType() === Kekule.Render.RendererType.R3D)
		{
			buttons = buttons.concat([BNS.rotateX, BNS.rotateY, BNS.rotateZ]);
		}
		else
		{
			buttons = buttons.concat([BNS.rotateLeft, BNS.rotateRight]);
		}
		buttons.push(BNS.reset);
		// debug
		buttons.push(BNS.openEditor);
		// config
		buttons.push(BNS.config);

		/*
		var result = {
			'buttons': buttons
		};
		return result;
		*/
		return buttons;
	},

	/** @private */
	createDefaultToolButtonNameMapping: function()
	{
		var result = {};
		result[BNS.loadFile] = CW.ActionDisplayerLoadFile;
		result[BNS.loadData] = CW.ActionDisplayerLoadData;
		result[BNS.saveFile] = CW.ActionDisplayerSaveFile;
		result[BNS.zoomIn] = CW.ActionDisplayerZoomIn;
		result[BNS.zoomOut] = CW.ActionDisplayerZoomOut;
		result[BNS.rotateLeft] = CW.ActionViewerRotateLeft;
		result[BNS.rotateRight] = CW.ActionViewerRotateRight;
		result[BNS.rotateX] = CW.ActionViewerRotateX;
		result[BNS.rotateY] = CW.ActionViewerRotateY;
		result[BNS.rotateZ] = CW.ActionViewerRotateZ;
		result[BNS.reset] = CW.ActionDisplayerReset;
		result[BNS.molHideHydrogens] = CW.ActionDisplayerHideHydrogens;
		result[BNS.openEditor] = CW.ActionViewerEdit;
		result[BNS.config] = Kekule.Widget.ActionOpenConfigWidget;

		return result;
	},

	/**
	 * Recalc and set toolbar position.
	 * @private
	 */
	adjustToolbarPos: function()
	{
		var toolbar = this.getToolbar();
		if (toolbar)
		{
			var WP = Kekule.Widget.Position;
			var viewerClientRect = this.getBoundingClientRect();
			var toolbarClientRect = toolbar.getBoundingClientRect();
			var pos = this.getToolbarPos();
			var hMargin = this.getToolbarMarginHorizontal();
			var vMargin = this.getToolbarMarginVertical();

			// default
			var hPosProp = 'left', vPosProp = 'top';
			var hPosPropUnused = 'right', vPosPropUnused = 'bottom';
			var hPosValue = (viewerClientRect.width - toolbarClientRect.width) / 2;
			var vPosValue = (viewerClientRect.height - toolbarClientRect.height) / 2;

			if (pos === WP.AUTO || !pos)  // auto decide position, including margin
			{
				var toolbarTotalW = ((hMargin > 0)? hMargin: 0) * 2 + toolbarClientRect.width;
				var toolbarTotalH = ((vMargin > 0)? vMargin: 0) * 2 + toolbarClientRect.height;
				if (toolbarTotalW > viewerClientRect.width)  // can not fit in viewer
				{
					pos |= WP.LEFT;
					hMargin = 0;
				}
				else
					pos |= WP.RIGHT;
				if (toolbarTotalH > viewerClientRect.height)  // can not fit in viewer
				{
					pos |= WP.BOTTOM;
					vMargin = -1;
				}
				else
					pos |= WP.BOTTOM;
			}

			// horizontal direction
			if (pos & WP.LEFT)
			{
				hPosProp = 'left';
				hPosPropUnused = 'right';
				hPosValue = (hMargin >= 0)? hMargin: hMargin - toolbarClientRect.width;
			}
			else if (pos & WP.RIGHT)
			{
				hPosProp = 'right';
				hPosPropUnused = 'left';
				hPosValue = (hMargin >= 0)? hMargin: hMargin - toolbarClientRect.width;
			}
			// vertical direction
			if (pos & WP.TOP)
			{
				vPosProp = 'top';
				vPosPropUnused = 'bottom';
				vPosValue = (vMargin >= 0)? vMargin: vMargin - toolbarClientRect.height;
			}
			else if (pos & WP.BOTTOM)
			{
				vPosProp = 'bottom';
				vPosPropUnused = 'top';
				vPosValue = (vMargin >= 0)? vMargin: vMargin - toolbarClientRect.height;
			}
			toolbar.removeStyleProperty(hPosPropUnused);
			toolbar.removeStyleProperty(vPosPropUnused);
			toolbar.setStyleProperty(hPosProp, hPosValue + 'px');
			toolbar.setStyleProperty(vPosProp, vPosValue + 'px');
		}
	},
	/**
	 * Update toolbar in viewer.
	 */
	updateToolbar: function()
	{
		if (this.getEnableToolbar())
		{
			this.createToolbar();
			this.adjustToolbarPos();
		}
		else
			this.setToolbar(null);
	},

	/**
	 * Update toolbar actions.
	 * @private
	 */
	updateActions: function()
	{
		if (this.getActions())
			this.getActions().updateAll();
	},

	/** @private */
	getToolButtonActionClass: function(btnName)
	{
		return this.getToolButtonNameMapping()[btnName];
	},

	/** @private */
	createToolbar: function()
	{
		this.getActions().clear();
		var toolBar = new Kekule.Widget.ButtonGroup(this);
		toolBar.addClassName(CNS.DYN_CREATED);
		toolBar.setDisplayed(false);  // hide at first, evokeHelper controls its visibility
		//console.log('After create, display to: ', toolBar.getDisplayed());
		//toolBar.show();
		// add buttons
		//var settings = this.getToolButtonSettings();
		var btns = this.getToolButtons(); //settings.buttons;
		for (var i = 0, l = btns.length; i < l; ++i)
		{
			var name = btns[i];
			var btn = this.createToolButton(name, toolBar);
		}
		toolBar.addClassName(CCNS.INNER_TOOLBAR);
		toolBar.setShowText(false);
		toolBar.doSetShowGlyph(true);
		toolBar.appendToElem(this.getElement());
			// IMPORTANT, must append to widget before setToolbar,
			// otherwise in Chrome the tool bar may be hidden at first even if we set it to always show
		//console.log('After append to widget: ', toolBar.getDisplayed());
		this.setToolbar(toolBar);
		//console.log('After set tool bar, display to: ', toolBar.getDisplayed());


		return toolBar;
	},
	/** @private */
	createToolButton: function(btnName, parentGroup)
	{
		var result = null;
		var beginContinuousRepaintingBind = this.beginContinuousRepainting.bind(this);
		var endContinuousRepaintingBind = this.endContinuousRepainting.bind(this);

		var rotateBtnNames = [BNS.rotateX, BNS.rotateY, BNS.rotateZ, BNS.rotateLeft, BNS.rotateRight];

		if (btnName === BNS.molDisplayType)  // in 2D or 3D mode, type differs a lot, need handle separately
		{
			this.createMolDisplayTypeButton(parentGroup);
		}

		var actionClass = this.getToolButtonActionClass(btnName);
		var btnClass = Kekule.Widget.Button;
		if (btnName === BNS.molHideHydrogens)
			btnClass = Kekule.Widget.CheckButton;
		if (actionClass)
		{
			result = new btnClass(parentGroup);
			//result.addClassName(CCNS.PREFIX + btnName);
			var action = new actionClass(this);
			this.getActions().add(action);
			result.setAction(action);
			if (rotateBtnNames.indexOf(btnName) >= 0)
			{
				result.setPeriodicalExecInterval(20);
				result.setEnablePeriodicalExec(true);
				result.addEventListener('activate', beginContinuousRepaintingBind);
				result.addEventListener('deactivate', endContinuousRepaintingBind);
			}
		}
		return result;
	},
	/** @private */
	createMolDisplayTypeButton: function(parentGroup)
	{
		var result = new Kekule.Widget.CompactButtonSet(parentGroup);
		result.getButtonSet().addClassName(CCNS.INNER_TOOLBAR);
		  // IMPORTANT: buttonSet may be popup and moved in DOM tree before showing,
		  // without this, the button size setting in CSS may be lost
		  // TODO: may find a better solution to solve popup widget style lost problem
		result.setShowText(false);
		//result.setHint(CWT.HINT_MOL_DISPLAY_TYPE);
		var action = new Kekule.ChemWidget.ActionViewerChangeMolDisplayTypeStub(this);
		result.setAction(action);
		this.getActions().add(action);

		// DONE: Now we fix the drop down direction
		//result.setDropPosition(Kekule.Widget.Position.TOP);

		var doc = this.getDocument();
		var actionClasses = (this.getRenderType() === Kekule.Render.RendererType.R3D)?
			CW.Viewer.molDisplayType3DActionClasses: CW.Viewer.molDisplayType2DActionClasses;
		var allowedType = this.getAllowedMolDisplayTypes();

		for (var i = 0, l = actionClasses.length; i < l; ++i)
		{
			var displayType = actionClasses[i].TYPE;
			if (allowedType && (allowedType.indexOf(displayType) < 0) && (displayType !== this.getCurrMoleculeDisplayType()))  // not in allowed type
				continue;

			var btn = new Kekule.Widget.RadioButton(doc);
			action = new actionClasses[i](this);
			this.getActions().add(action);
			btn.setAction(action);
			result.append(btn, displayType === this.getCurrMoleculeDisplayType());
		}
		return result;
	}
});

var XEvent = Kekule.X.Event;

/**
 * Basic Interaction controller for general viewers, can do zoomIn/out job.
 * @class
 * @augments Kekule.Widget.InteractionController
 *
 * @param {Kekule.ChemWidget.Viewer} viewer Viewer of current object being installed to.
 */
Kekule.ChemWidget.ViewerBasicInteractionController = Class.create(Kekule.Widget.InteractionController,
/** @lends Kekule.ChemWidget.ViewerBasicInteractionController# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ViewerBasicInteractionController',
	/** @constructs */
	initialize: function($super, viewer)
	{
		$super(viewer);
		this._enableMouseRotate = true;  // private
		this._transformInfo = {
			'isTransforming': false,
			//'isRotating': false,
			'lastCoord': null,
			'lastZoom': null
		};
		/*
		this._zoomInfo = {
			'isTransforming': false,
			'lastZoom': null
		}
		*/
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('viewer', {'dataType': 'Kekule.ChemWidget.Viewer', 'serializable': false,
			'getter': function() { return this.getWidget(); }, 'setter': function(value) { this.setWidget(value); } });
	},
	/** @private */
	getViewerRenderType: function()
	{
		return this.getViewer().getRenderType();
	},
	/** @private */
	getEnableInteraction: function()
	{
		var v = this.getViewer();
		var result = !!(v && v.getEnableDirectInteraction() && v.getChemObjLoaded());
		//console.log('enabledInteraction', result);
		return result;
	},
	/** @private */
	getEnableTouchInteraction: function()
	{
		var v = this.getViewer();
		var result = !!(v && v.getEnableDirectInteraction() && v.getEnableTouchInteraction() && v.getChemObjLoaded());
		return result;
	},
	/** @private */
	_initTransform: function()
	{
		var viewer = this.getViewer();
		var minLength = Math.min(viewer.getOffsetWidth(), viewer.getOffsetHeight());
		var info = this._transformInfo;
		info.angleRatio = 1 / minLength * Math.PI;
		//info.lastRotateXYZ = {'x': 0, 'y': 0, 'z': 0};
	},
	/** @private */
	zoomViewer: function(delta)
	{
		var v = this.getViewer();
		if (!v || !v.getChemObj())
			return;
		if (delta > 0)
		{
			if (v.zoomIn)
				v.zoomIn(delta);
		}
		else if (delta < 0)
		{
			if (v.zoomOut)
				v.zoomOut(-delta);
		}
	},
	/** @private */
	react_mousewheel: function(e)
	{
		if (this.getEnableInteraction())
		{
			var delta = e.wheelDeltaY || e.wheelDelta;
			if (delta)
				delta /= 120;
			this.zoomViewer(delta);
			e.preventDefault();
			return true;
		}
	},
	/** @private */
	react_mousedown: function(e)
	{
		if (!this.getEnableInteraction())
			return;
		if (e.getButton() === XEvent.MouseButton.LEFT)
		{
			// start mouse drag rotation in 3D render mode
			var viewer = this.getViewer();
			if (viewer && viewer.getChemObj())
			{
				//if (viewer.getRenderType() === Kekule.Render.RendererType.R3D)
				{
					var info = this._transformInfo;
					info.isTransforming = true;
					info.lastCoord = {'x': e.getScreenX(), 'y': e.getScreenY()};

					/*
					var minLength = Math.min(viewer.getOffsetWidth(), viewer.getOffsetHeight());
					info.angleRatio = 1 / minLength * Math.PI;
					*/
					this._initTransform();
				}
			}
		}
	},
	/** @private */
	react_mouseleave: function(e)
	{
		this._transformInfo.isTransforming = false;
	},
	/** @private */
	react_mouseup: function(e)
	{
		if (e.getButton() === XEvent.MouseButton.LEFT)
			this._transformInfo.isTransforming = false;
	},
	/** @private */
	react_mousemove: function(e)
	{
		if (!this.getEnableInteraction())
			return;
		/*
		var info = this._transformInfo;
		if (info && info.isRotating && (!info.calculating))
		{
			info.calculating = true;
			try
			{
				var viewer = this.getViewer();
				var currCoord = {'x': e.getScreenX(), 'y': e.getScreenY()};
				var delta = Kekule.CoordUtils.substract(currCoord, info.lastCoord);
				delta.y = -delta.y;
				var dis = Kekule.CoordUtils.getDistance({'x': 0, 'y': 0}, delta); // * Math.sign(delta.x * delta.y);
				var rotateAngle = dis * info.angleRatio;
				var axisVector = {'x': -delta.y, 'y': delta.x, 'z': 0};

				viewer.rotate3DByAxis(rotateAngle, axisVector);

				//console.log('distance: ', dis);
				//console.log('rotate: ', rotateAngle / Math.PI * 180);

				info.lastCoord = currCoord;
				info.calculating = false;
			}
			catch(e) {}   // fix IE finally bug
			finally
			{
				info.calculating = false;
			}
		}
		*/
		if (this.getViewerRenderType() === Kekule.Render.RendererType.R3D)
			this.rotateByXYDistance(e.getScreenX(), e.getScreenY());
		else
			this.moveByXYDistance(e.getScreenX(), e.getScreenY());
	},
	/** @private */
	moveByXYDistance: function(currX, currY)
	{
		var info = this._transformInfo;
		if (info && info.isTransforming && (!info.calculating))
		{
			var viewer = this.getViewer();
			if (viewer.getRenderType() === Kekule.Render.RendererType.R3D)
				return;
			info.calculating = true;
			try
			{
				var currCoord = {'x': currX, 'y': currY};
				var delta = Kekule.CoordUtils.substract(currCoord, info.lastCoord);
				var baseCoordOffset = viewer.getBaseCoordOffset() || {};
				baseCoordOffset = Kekule.CoordUtils.add(baseCoordOffset, delta);
				viewer.setBaseCoordOffset(baseCoordOffset);
				info.lastCoord = currCoord;
			}
			finally
			{
				info.calculating = false;
			}
		}
	},
	/** @private */
	rotateByXYDistance: function(currX, currY)
	{
		var info = this._transformInfo;
		if (info && info.isTransforming && (!info.calculating))
		{
			var viewer = this.getViewer();
			if (viewer.getRenderType() !== Kekule.Render.RendererType.R3D)
				return;
			info.calculating = true;
			try
			{
				var currCoord = {'x': currX, 'y': currY};
				var delta = Kekule.CoordUtils.substract(currCoord, info.lastCoord);
				delta.y = -delta.y;
				var dis = Kekule.CoordUtils.getDistance({'x': 0, 'y': 0}, delta);
				var rotateAngle = dis * info.angleRatio;
				var axisVector = {'x': -delta.y, 'y': delta.x, 'z': 0};

				viewer.rotate3DByAxis(rotateAngle, axisVector);

				info.lastCoord = currCoord;
				info.calculating = false;
			}
			catch(e) {}   // fix IE finally bug
			finally
			{
				info.calculating = false;
			}
		}
	},

	/** @private */
	react_transformstart: function(e)
	{
		if (!this.getEnableTouchInteraction())
			return;
		var viewer = this.getViewer();
		if (viewer)
		{
			var info = this._transformInfo;
			info.isTransforming = true;
			info.lastZoom = viewer.getCurrZoom();
			info.lastCoord = {'x': 0, 'y': 0};
			this._initTransform();
		}
	},
	/** @private */
	react_transformend: function(e)
	{
		if (!this.getEnableTouchInteraction())
			return;
		this._transformInfo.isTransforming = false;
	},
	/** @private */
	react_transform: function(e)
	{
		if (!this.getEnableTouchInteraction())
			return;
		var viewer = this.getViewer();
		var info = this._transformInfo;
		if (viewer && info.isTransforming && (!info.calculating))
		{
			try
			{
				// TODO: the event detail data is binded to hammer.js, may need to change later
				var gesture = e.gesture;
				if (gesture)
				{
					// zoom

					var scale = e.gesture.scale;
					viewer.zoomTo((info.lastZoom || 1) * scale, true);  // suspend render, as we will rotate further

					//console.log('new scale', scale);


					// rotate
					/*
					var rx = gesture.deltaY * info.angleRatio;
					var ry = gesture.deltaX * info.angleRatio;
					//var rz = gesture.angle * Math.PI / 180;
					var delta = {
						'x': rx - info.lastRotateXYZ.x,
						'y': ry - info.lastRotateXYZ.y,
						//'z': rz - info.lastRotateXYZ.z
						'z': 0
					};
					info.lastRotateXYZ.x = rx;
					info.lastRotateXYZ.y = ry;
					//info.lastRotateXYZ.z = rz;

					//console.log('new rotate', delta.x, delta.y, delta.z);

					viewer.rotate3DBy(delta.x, delta.y, delta.z);
					*/

					var dx = gesture.deltaX;
					var dy = gesture.deltaY;

					//console.log(dx, dy, info.lastCoord.x, info.lastCoord.y);
					this.rotateByXYDistance(dx, dy);

					e.gesture.preventDefault();
					e.gesture.stopPropagation();
				}
			}
			finally
			{
				//info.calculating = false;
			}
		}
		//console.log(e, e.gesture);
	},

	/** @private */
	doTestMouseCursor: function(coord, e)
	{
		var result = '';
		var info = this._transformInfo;
		if (info.isTransforming)
			result = 'move';  //'grabbing';
		return result;
	}
});

/**
 * An 2D viewer widget for chem objects, actually a specialization of {@link Kekule.ChemWidget.Viewer}.
 * @class
 * @augments Kekule.ChemWidget.Viewer
 *
 * @param {Variant} parentOrElementOrDocument
 * @param {Kekule.ChemObject} chemObj
 */
Kekule.ChemWidget.Viewer2D = Class.create(Kekule.ChemWidget.Viewer,
/** @lends Kekule.ChemWidget.Viewer2D# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.Viewer2D',
	/** @construct */
	initialize: function($super, parentOrElementOrDocument, chemObj)
	{
		$super(parentOrElementOrDocument, chemObj, Kekule.Render.RendererType.R2D);
	}
});

/**
 * An 3D viewer widget for chem objects, actually a specialization of {@link Kekule.ChemWidget.Viewer}.
 * @class
 * @augments Kekule.ChemWidget.Viewer
 *
 * @param {Variant} parentOrElementOrDocument
 * @param {Kekule.ChemObject} chemObj
 */
Kekule.ChemWidget.Viewer3D = Class.create(Kekule.ChemWidget.Viewer,
/** @lends Kekule.ChemWidget.Viewer3D# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.Viewer3D',
	/** @construct */
	initialize: function($super, parentOrElementOrDocument, chemObj)
	{
		$super(parentOrElementOrDocument, chemObj, Kekule.Render.RendererType.R3D);
	}
});

// register predefined settings of viewer
var SM = Kekule.ObjPropSettingManager;
SM.register('Kekule.ChemWidget.Viewer.fullFunc', {  // viewer with all functions
	enableToolbar: true,
	enableDirectInteraction: true,
	enableTouchInteraction: true,
	enableEdit: true,
	toolButtons: null   // create all default tool buttons
});
SM.register('Kekule.ChemWidget.Viewer.basic', {  // viewer with basic function, suitable for embedded chem object with limited size
	enableToolbar: true,
	enableDirectInteraction: true,
	enableTouchInteraction: false,
	toolButtons: [BNS.saveFile, BNS.molDisplayType, BNS.zoomIn, BNS.zoomOut]
});
SM.register('Kekule.ChemWidget.Viewer.static', {  // viewer with no interaction ability, suitable for static embedded chem object
	enableToolbar: false,
	enableDirectInteraction: false,
	enableTouchInteraction: false,
	toolButtons: []
});

/**
 * A special class to give a setting facade for Chem Viewer.
 * Do not use this class alone.
 * @class
 * @augments Kekule.ChemWidget.ChemObjDisplayer.Settings
 * @ignore
 */
Kekule.ChemWidget.Viewer.Settings = Class.create(Kekule.ChemWidget.ChemObjDisplayer.Settings,
/** @lends Kekule.ChemWidget.Viewer.Settings# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.Viewer.Settings',
	/** @private */
	initProperties: function()
	{
		this.defineDelegatedProps([
			'enableDirectInteraction', 'enableTouchInteraction',
			'enableToolbar', 'toolbarPos', 'toolbarMarginHorizontal', 'toolbarMarginVertical',
			'enableEdit', 'modalEdit'
		]);
	},
	/** @private */
	getViewer: function()
	{
		return this.getWidget();
	}
});

/**
 * Base class for actions for chem viewer.
 * @class
 * @augments Kekule.ChemWidget.ActionOnDisplayer
 *
 * @param {Kekule.ChemWidget.viewer} viewer Target viewer widget.
 * @param {String} caption
 * @param {String} hint
 */
Kekule.ChemWidget.ActionOnViewer = Class.create(Kekule.ChemWidget.ActionOnDisplayer,
/** @lends Kekule.ChemWidget.ActionOnViewer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionOnViewer',
	/** @constructs */
	initialize: function($super, viewer, caption, hint)
	{
		$super(viewer, caption, hint);
	},
	/** @private */
	doUpdate: function()
	{
		var displayer = this.getDisplayer();
		this.setEnabled(displayer && displayer.getChemObj() && displayer.getChemObjLoaded() && displayer.getEnabled());
	},
	/**
	 * Returns target chem viewer.
	 * @returns {Kekule.ChemWidget.Viewer}
	 */
	getViewer: function()
	{
		var result = this.getDisplayer();
		return (result instanceof Kekule.ChemWidget.Viewer)? result: null;
	}
});

/**
 * Base action for make rotation in viewer.
 * @class
 * @augments Kekule.ChemWidget.ActionOnViewer
 *
 * @property {Float} delta The rotation angle.
 */
Kekule.ChemWidget.ActionViewerRotateBase = Class.create(Kekule.ChemWidget.ActionOnViewer,
/** @lends Kekule.ChemWidget.ActionViewerRotateBase# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionViewerRotateBase',
	/** @constructs */
	initialize: function($super, viewer, caption, hint)
	{
		$super(viewer, caption, hint);
		this.setDelta(2 * Math.PI / 180);  // TODO: this default value should be configurable
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('delta', {'dataType': DataType.FLOAT});
	}
});
/**
 * Base action for make rotation in 2D viewer.
 * @class
 * @augments Kekule.ChemWidget.ActionViewerRotateBase
 *
 * @property {Float} delta The rotation angle.
 */
Kekule.ChemWidget.ActionViewerRotateBase2D = Class.create(Kekule.ChemWidget.ActionViewerRotateBase,
/** @lends Kekule.ChemWidget.ActionViewerRotateBase2D# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionViewerRotateBase2D',
	/** @private */
	doUpdate: function($super)
	{
		$super();
		var viewer = this.getViewer();
		var flag = viewer && (viewer.getRenderType() === Kekule.Render.RendererType.R2D);
		this.setDisplayed(this.getDisplayed() && flag).setEnabled(this.getEnabled() && flag);
	}
});
/**
 * Base action for make rotation in 3D viewer.
 * @class
 * @augments Kekule.ChemWidget.ActionViewerRotateBase
 *
 * @property {Float} delta The rotation angle.
 */
Kekule.ChemWidget.ActionViewerRotateBase3D = Class.create(Kekule.ChemWidget.ActionViewerRotateBase,
/** @lends Kekule.ChemWidget.ActionViewerRotateBase3D# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionViewerRotateBase3D',
	/** @private */
	doUpdate: function($super)
	{
		$super();
		var viewer = this.getViewer();
		var flag = viewer && (viewer.getRenderType() === Kekule.Render.RendererType.R3D);
		this.setDisplayed(this.getDisplayed()  && flag).setEnabled(this.getEnabled() && flag);
	}
});

/**
 * Action for do anticlockwise rotation in 2D mode.
 * @class
 * @augments Kekule.ChemWidget.ActionViewerRotateBase2D
 */
Kekule.ChemWidget.ActionViewerRotateLeft = Class.create(Kekule.ChemWidget.ActionViewerRotateBase2D,
/** @lends Kekule.ChemWidget.ActionViewerRotateLeft# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionViewerRotateLeft',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_ROTATE_LEFT,
	/** @constructs */
	initialize: function($super, viewer)
	{
		$super(viewer, CWT.CAPTION_ROTATELEFT, CWT.HINT_ROTATELEFT);
	},
	/** @private */
	doExecute: function()
	{
		this.getViewer().rotate2DBy(this.getDelta());
	}
});
/**
 * Action for do clockwise rotation in 2D mode.
 * @class
 * @augments Kekule.ChemWidget.ActionViewerRotateBase2D
 */
Kekule.ChemWidget.ActionViewerRotateRight = Class.create(Kekule.ChemWidget.ActionViewerRotateBase2D,
/** @lends Kekule.ChemWidget.ActionViewerRotateRight# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionViewerRotateRight',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_ROTATE_RIGHT,
	/** @constructs */
	initialize: function($super, viewer)
	{
		$super(viewer, CWT.CAPTION_ROTATERIGHT, CWT.HINT_ROTATERIGHT);
	},
	/** @private */
	doExecute: function()
	{
		this.getViewer().rotate2DBy(-this.getDelta());
	}
});
/**
 * Action for do rotation around X axis in 3D mode.
 * @class
 * @augments Kekule.ChemWidget.ActionViewerRotateBase3D
 */
Kekule.ChemWidget.ActionViewerRotateX = Class.create(Kekule.ChemWidget.ActionViewerRotateBase3D,
/** @lends Kekule.ChemWidget.ActionViewerRotateX# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionViewerRotateX',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_ROTATE_X,
	/** @constructs */
	initialize: function($super, viewer)
	{
		$super(viewer, CWT.CAPTION_ROTATEX, CWT.HINT_ROTATEX);
	},
	/** @private */
	doExecute: function()
	{
		this.getViewer().rotate3DBy(-this.getDelta(), 0, 0);
	}
});
/**
 * Action for do rotation around Y axis in 3D mode.
 * @class
 * @augments Kekule.ChemWidget.ActionViewerRotateBase3D
 */
Kekule.ChemWidget.ActionViewerRotateY = Class.create(Kekule.ChemWidget.ActionViewerRotateBase3D,
/** @lends Kekule.ChemWidget.ActionViewerRotateY# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionViewerRotateY',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_ROTATE_Y,
	/** @constructs */
	initialize: function($super, viewer)
	{
		$super(viewer, CWT.CAPTION_ROTATEY, CWT.HINT_ROTATEY);
	},
	/** @private */
	doExecute: function()
	{
		this.getViewer().rotate3DBy(0, -this.getDelta(), 0);
	}
});
/**
 * Action for do rotation around Z axis in 3D mode.
 * @class
 * @augments Kekule.ChemWidget.ActionViewerRotateBase3D
 */
Kekule.ChemWidget.ActionViewerRotateZ = Class.create(Kekule.ChemWidget.ActionViewerRotateBase3D,
/** @lends Kekule.ChemWidget.ActionViewerRotateZ# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionViewerRotateZ',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_ROTATE_Z,
	/** @constructs */
	initialize: function($super, viewer)
	{
		$super(viewer, CWT.CAPTION_ROTATEZ, CWT.HINT_ROTATEZ);
	},
	/** @private */
	doExecute: function()
	{
		this.getViewer().rotate3DBy(0, 0, -this.getDelta());
	}
});

/**
 * Action used for molecule display type stub button of compact button set in viewer.
 * @class
 * @augments Kekule.ChemWidget.ActionViewer
 */
Kekule.ChemWidget.ActionViewerChangeMolDisplayTypeStub = Class.create(Kekule.ChemWidget.ActionOnDisplayer,
/** @lends Kekule.ChemWidget.ActionViewerChangeMolDisplayTypeStub# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionViewerChangeMolDisplayTypeStub',
	/** @constructs */
	initialize: function($super, viewer)
	{
		$super(viewer, CWT.CAPTION_MOL_DISPLAY_TYPE, CWT.HINT_MOL_DISPLAY_TYPE);
	},
	/** @private */
	doExecute: function(target)
	{
		// do nothing
	}
});

/**
 * Action to edit object in viewer.
 * @class
 * @augments Kekule.ChemWidget.ActionOnViewer
 *
 * @property {Float} delta The rotation angle.
 */
Kekule.ChemWidget.ActionViewerEdit = Class.create(Kekule.ChemWidget.ActionOnViewer,
/** @lends Kekule.ChemWidget.ActionViewerEdit# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionViewerEdit',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_VIEWER_EDIT,
	/** @constructs */
	initialize: function($super, viewer)
	{
		$super(viewer, CWT.CAPTION_OPENEDITOR, CWT.HINT_OPENEDITOR);
	},
	/** @private */
	doUpdate: function($super)
	{
		$super();
		var viewer = this.getViewer();
		this.setEnabled(this.getEnabled() && viewer.getChemObj() && viewer.getEnableEdit());
		this.setDisplayed(viewer.getEnableEdit());
	},
	/** @private */
	doExecute: function(target)
	{
		var viewer = this.getViewer();
		viewer.openEditor(target);
	}
});

/** @private */
Kekule.ChemWidget.Viewer.rotate2DActionClasses = [
	CW.ActionViewerRotateLeft,
	CW.ActionViewerRotateRight
];
/** @private */
Kekule.ChemWidget.Viewer.rotate3DActionClasses = [
	CW.ActionViewerRotateX,
	CW.ActionViewerRotateY,
	CW.ActionViewerRotateZ
];
/** @private */
Kekule.ChemWidget.Viewer.molDisplayType2DActionClasses = [
	CW.ActionDisplayerChangeMolDisplayTypeSkeletal,
	CW.ActionDisplayerChangeMolDisplayTypeCondensed
];
/** @private */
Kekule.ChemWidget.Viewer.molDisplayType3DActionClasses = [
	CW.ActionDisplayerChangeMolDisplayTypeWire,
	CW.ActionDisplayerChangeMolDisplayTypeSticks,
	CW.ActionDisplayerChangeMolDisplayTypeBallStick,
	CW.ActionDisplayerChangeMolDisplayTypeSpaceFill
];

})();