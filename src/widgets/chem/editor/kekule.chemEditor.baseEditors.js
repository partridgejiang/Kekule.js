/**
 * @fileoverview
 * Base types and classes used by chem editor.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /widgets/operation/kekule.operations.js
 * requires /render/kekule.render.base.js
 * requires /render/kekule.render.boundInfoRecorder.js
 * requires /html/xbrowsers/kekule.x.js
 * requires /widgets/kekule.widget.base.js
 * requires /widgets/chem/kekule.chemWidget.chemObjDisplayers.js
 * requires /widgets/chem/editor/kekule.chemEditor.extensions.js
 * requires /widgets/chem/editor/kekule.chemEditor.editorUtils.js
 * requires /widgets/chem/editor/kekule.chemEditor.configs.js
 * requires /widgets/chem/editor/kekule.chemEditor.operations.js
 */

var Class = require('../../../lan/classes').Class
var ClassEx = require('../../../lan/classes').ClassEx
var DataType = require('../../../lan/classes').DataType
module.exports = function(Kekule){


var OU = Kekule.ObjUtils;
var AU = Kekule.ArrayUtils;
var EU = Kekule.HtmlElementUtils;
var CU = Kekule.CoordUtils;
var CNS = Kekule.Widget.HtmlClassNames;
var CCNS = Kekule.ChemWidget.HtmlClassNames;

/** @ignore */
Kekule.ChemWidget.HtmlClassNames = Object.extend(Kekule.ChemWidget.HtmlClassNames, {
	EDITOR: 'K-Chem-Editor',
	EDITOR_CLIENT: 'K-Chem-Editor-Client',
	EDITOR_UIEVENT_RECEIVER: 'K-Chem-Editor-UiEvent-Receiver',
	EDITOR2D: 'K-Chem-Editor2D',
	EDITOR3D: 'K-Chem-Editor3D'
});

/**
 * Namespace for chem editor.
 * @namespace
 */
Kekule.ChemWidget.Editor = {};
/**
 * Alias to {@link Kekule.ChemWidget.Editor}.
 * @namespace
 */
Kekule.Editor = Kekule.ChemWidget.Editor;

/**
 * In editor, there exist three types of coord: one based on object system (inner coord),
 * another one based on context of editor (outer coord, context coord),
 * and the third based on screen.
 * This enum is an alias of Kekule.Render.CoordSystem
 * @class
 */
Kekule.Editor.CoordSys = Kekule.Render.CoordSystem;



/**
 * Enumeration of regions in/out box.
 * @enum
 * @ignore
 */
Kekule.Editor.BoxRegion = {
	OUTSIDE: 0,
	CORNER_TL: 1,
	CORNER_TR: 2,
	CORNER_BL: 3,
	CORNER_BR: 4,
	EDGE_TOP: 11,
	EDGE_LEFT: 12,
	EDGE_BOTTOM: 13,
	EDGE_RIGHT: 14,
	INSIDE: 20
};

/**
 * Enumeration of mode in selecting object in editor.
 * @enum
 * @ignore
 */
Kekule.Editor.SelectMode = {
	/** Draw a box in editor when selecting, select all object inside a box. **/
	RECT: 0,
	/** Draw a curve in editor when selecting, select all object inside this curve polygon. **/
	POLYGON: 1,
	/** Draw a curve in editor when selecting, select all object intersecting this curve. **/
	POLYLINE: 2,
	/** Click on a child object to select the whole standalone ancestor. **/
	ANCESTOR: 10
};

/**
 * A base chem editor.
 * @class
 * @augments Kekule.ChemWidget.ChemObjDisplayer
 * @param {Variant} parentOrElementOrDocument
 * @param {Kekule.ChemObject} chemObj initially loaded chemObj.
 * @param {Int} renderType Display in 2D or 3D. Value from {@link Kekule.Render.RendererType}.
 * @param {Kekule.Editor.BaseEditorConfigs} editorConfigs Configuration of this editor.
 *
 * @property {Kekule.Editor.BaseEditorConfigs} editorConfigs Configuration of this editor.
 * @property {Bool} enableCreateNewDoc Whether create new object in editor is allowed.
 * @property {Bool} initOnNewDoc Whether create a new doc when editor instance is initialized.
 *   Note, the new doc will only be created when property enableCreateNewDoc is true.
 * @property {Bool} enableOperHistory Whether undo/redo is enabled.
 * @property {Kekule.OperationHistory} operHistory History of operations. Used to enable undo/redo function.
 * @property {Int} renderType Display in 2D or 3D. Value from {@link Kekule.Render.RendererType}.
 * @property {Kekule.ChemObject} chemObj The root object in editor.
 * @property {Bool} enableOperContext If this property is set to true, object being modified will be drawn in a
 *   separate context to accelerate the interface refreshing.
 * @property {Object} objContext Context to draw basic chem objects. Can be 2D or 3D context. Alias of property drawContext
 * @property {Object} operContext Context to draw objects being operated. Can be 2D or 3D context.
 * @property {Object} uiContext Context to draw UI marks. Usually this is a 2D context.
 * @property {Object} objDrawBridge Bridge to draw chem objects. Alias of property drawBridge.
 * @property {Object} uiDrawBridge Bridge to draw UI markers.
 * @property {Int} selectMode Value from Kekule.Editor.SelectMode, set the mode of selecting operation in editor.
 * @property {Array} selection An array of selected basic object.
 * @property {Hash} zoomCenter The center coord (based on client element) when zooming editor.
 * //@property {Bool} standardizeObjectsBeforeSaving Whether standardize molecules (and other possible objects) before saving them.
 */

/**
 * Invoked when the an chem object is loaded into editor.
 *   event param of it has one fields: {obj: Object}
 * @name Kekule.Editor.BaseEditor#load
 * @event
 */
/**
 * Invoked when the chem object inside editor is changed.
 *   event param of it has one fields: {obj: Object, propNames: Array}
 * @name Kekule.Editor.BaseEditor#editObjChanged
 * @event
 */
/**
 * Invoked when multiple chem objects inside editor is changed.
 *   event param of it has one fields: {objChangeDetails}.
 * @name Kekule.Editor.BaseEditor#editObjsChanged
 * @event
 */
/**
 * Invoked when chem objects inside editor is changed and the changes has been updated by editor.
 *   event param of it has one fields: {objChangeDetails}.
 * Note: this event is not the same as editObjsChanged. When beginUpdateObj is called, editObjsChanged
 * event still will be invoked but editObjsUpdated event will be suppressed.
 * @name Kekule.Editor.BaseEditor#editObjsUpdated
 * @event
 */
/**
 * Invoked when the selected objects in editor has been changed.
 * When beginUpdateObj is called, selectedObjsUpdated event will be suppressed.
 *   event param of it has one fields: {objs}.
 * @name Kekule.Editor.BaseEditor#selectedObjsUpdated
 * @event
 */
/**
 * Invoked when the selection in editor has been changed.
 * @name Kekule.Editor.BaseEditor#selectionChange
 * @event
 */
/**
 * Invoked when the operation history has modifications.
 * @name Kekule.Editor.BaseEditor#operChange
 * @event
 */
/**
 * Invoked when the an operation is pushed into operation history.
 *   event param of it has one fields: {operation: Kekule.Operation}
 * @name Kekule.Editor.BaseEditor#operPush
 * @event
 */
/**
 * Invoked when the an operation is popped from history.
 *   event param of it has one fields: {operation: Kekule.Operation}
 * @name Kekule.Editor.BaseEditor#operPop
 * @event
 */
/**
 * Invoked when one operation is undone.
 *   event param of it has two fields: {operation: Kekule.Operation, currOperIndex: Int}
 * @name Kekule.Editor.BaseEditor#operUndo
 * @event
 */
/**
 * Invoked when one operation is redone.
 *   event param of it has two fields: {operation: Kekule.Operation, currOperIndex: Int}
 * @name Kekule.Editor.BaseEditor#operRedo
 * @event
 */
/**
 * Invoked when the operation history is cleared.
 *   event param of it has one field: {currOperIndex: Int}
 * @name Kekule.Editor.BaseEditor#operHistoryClear
 * @event
 */
Kekule.Editor.BaseEditor = Class.create(Kekule.ChemWidget.ChemObjDisplayer,
/** @lends Kekule.Editor.BaseEditor# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.BaseEditor',
	/** @private */
	BINDABLE_TAG_NAMES: ['div', 'span'],
	/** @private */
	OBSERVING_GESTURES: ['rotate', 'rotatestart', 'rotatemove', 'rotateend', 'rotatecancel',
		'pinch', 'pinchstart', 'pinchmove', 'pinchend', 'pinchcancel', 'pinchin', 'pinchout'],
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument, chemObj, renderType, editorConfigs)
	{
		this._objSelectFlag = 0;  // used internally
		this._objectUpdateFlag = 0;  // used internally
		this._objectManipulateFlag = 0;  // used internally
		this._uiMarkerUpdateFlag = 0;  // used internally
		this._updatedObjectDetails = []; // used internally
		this._operatingObjs = [];  // used internally
		this._operatingRenderers = [];  // used internally
		this._initialRenderTransformParams = null;  // used internally, must init before $super
		  // as in $super, chemObj may be loaded and _initialRenderTransformParams will be set at that time
		this._objChanged = false;   // used internally, mark whether some changes has been made to chem object
		this._lengthCaches = {};  // used internally, stores some value related to distance and length

		this.setPropStoreFieldValue('enableCreateNewDoc', true);
		this.setPropStoreFieldValue('enableOperHistory', true);
		this.setPropStoreFieldValue('enableOperContext', true);
		this.setPropStoreFieldValue('initOnNewDoc', true);
		//this.setPropStoreFieldValue('initialZoom', 1.5);

		//this.setPropStoreFieldValue('selectMode', Kekule.Editor.SelectMode.POLYGON);  // debug

		$super(parentOrElementOrDocument, chemObj, renderType);
		//this.initEventHandlers();

		if (!this.getChemObj() && this.getInitOnNewDoc() && this.getEnableCreateNewDoc())
			this.newDoc();

		this.setPropStoreFieldValue('editorConfigs', editorConfigs || this.createDefaultConfigs());
		//this.setPropStoreFieldValue('uiMarkers', []);
		this.setEnableGesture(true);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('editorConfigs', {'dataType': 'Kekule.Editor.BaseEditorConfigs', 'serializable': false,
			'getter': function() { return this.getDisplayerConfigs(); },
			'setter': function(value) { return this.setDisplayerConfigs(value); }
		});
		this.defineProp('defBondLength', {'dataType': DataType.FLOAT, 'serializable': false,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('defBondLength');
				if (!result)
					result = this.getEditorConfigs().getStructureConfigs().getDefBondLength();
				return result;
			}
		});
		this.defineProp('defBondScreenLength', {'dataType': DataType.FLOAT, 'serializable': false, 'setter': null,
			'getter': function()
			{
				/*
				var result = this.getPropStoreFieldValue('defBondScreenLength');
				if (!result)
				{
					var bLength = this.getDefBondLength();
					result = this.translateDistance(bLength, Kekule.Render.CoordSys.CHEM, Kekule.Render.CoordSys.SCREEN);
				}
				return result;
				*/
				var cached = this._lengthCaches.defBondScreenLength;
				if (cached)
					return cached;
				else
				{
					var bLength = this.getDefBondLength() || 0;
					var result = this.translateDistance(bLength, Kekule.Render.CoordSystem.CHEM, Kekule.Render.CoordSystem.SCREEN);
					this._lengthCaches.defBondScreenLength = result;
					return result;
				}
			}
		});
		// Different pointer event (mouse, touch) has different bound inflation settings, stores here
		this.defineProp('currBoundInflation', {'dataType': DataType.NUMBER, 'serializable': false, 'setter': null,
			'getter': function(){
				var pType = this.getCurrPointerType();
				return this.getInteractionBoundInflation(pType);
			}
		});
		// The recent pointer device interacted with this editor
		this.defineProp('currPointerType', {'dataType': DataType.STRING, 'serializable': false});

		//this.defineProp('standardizeObjectsBeforeSaving', {'dataType': DataType.BOOL});

		this.defineProp('enableCreateNewDoc', {'dataType': DataType.BOOL, 'serializable': false});
		this.defineProp('initOnNewDoc', {'dataType': DataType.BOOL, 'serializable': false});
		this.defineProp('enableOperHistory', {'dataType': DataType.BOOL, 'serializable': false});
		this.defineProp('operHistory', {
			'dataType': 'Kekule.OperationHistory', 'serializable': false,
			'getter': function()
			{
				/*
				if (!this.getEnableOperHistory())
					return null;
				*/
				var result = this.getPropStoreFieldValue('operHistory');
				if (!result)
				{
					result = new Kekule.OperationHistory();
					this.setPropStoreFieldValue('operHistory', result);
					// install event handlers
					result.addEventListener('push', this.reactOperHistoryPush, this);
					result.addEventListener('pop', this.reactOperHistoryPop, this);
					result.addEventListener('undo', this.reactOperHistoryUndo, this);
					result.addEventListener('redo', this.reactOperHistoryRedo, this);
					result.addEventListener('clear', this.reactOperHistoryClear, this);
					result.addEventListener('change', this.reactOperHistoryChange, this);
				}
				return result;
			},
			'setter': null
		});

		this.defineProp('selection', {'dataType': DataType.ARRAY, 'serializable': false,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('selection');
				if (!result)
				{
					result = [];
					this.setPropStoreFieldValue('selection', result);
				}
				return result;
			},
			'setter': function(value)
			{
				this.setPropStoreFieldValue('selection', value);
				this.selectionChanged();
			}
		});
		this.defineProp('selectMode', {'dataType': DataType.INT,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('selectMode');
				if (Kekule.ObjUtils.isUnset(result))
					result = Kekule.Editor.SelectMode.RECT;  // default value
				return result;
			},
			'setter': function(value)
			{
				if (this.getSelectMode() !== value)
				{
					//console.log('set select mode', value);
					this.setPropStoreFieldValue('selectMode', value);
					this.hideSelectingMarker();
				}
			}
		});
		// private, whether defaultly select in toggle mode
		this.defineProp('isToggleSelectOn', {'dataType': DataType.BOOL});


		this.defineProp('hotTrackedObjs', {'dataType': DataType.ARRAY, 'serializable': false,
			'setter': function(value)
			{
				/*
				if (this.getHotTrackedObjs() === value)
					return;
				*/
				var objs = value? Kekule.ArrayUtils.toArray(value): [];
				//console.log('setHotTrackedObjs', objs);
				if (this.getEditorConfigs() && this.getEditorConfigs().getInteractionConfigs().getEnableHotTrack())
				{
					this.setPropStoreFieldValue('hotTrackedObjs', objs);
					var bounds;
					if (objs && objs.length)
					{
						bounds = [];
						for (var i = 0, l = objs.length; i < l; ++i)
						{
							var bound = this.getBoundInfoRecorder().getBound(this.getObjContext(), objs[i]);
							if (bounds)
							{
								//bounds.push(bound);
								Kekule.ArrayUtils.pushUnique(bounds, bound);  // bound may be an array of composite shape
							}
						}
					}
					if (bounds)
					{
						this.changeHotTrackMarkerBounds(bounds);
						//console.log('show');
					}
					else
					{
						if (this.getUiHotTrackMarker().getVisible())
							this.hideHotTrackMarker();
						//console.log('hide');
					}
				}
			}
		});
		this.defineProp('hotTrackedObj', {'dataType': DataType.OBJECT, 'serializable': false,
			'getter': function() { return this.getHotTrackedObjs() && this.getHotTrackedObjs()[0]; },
			'setter': function(value) { this.setHotTrackedObjs(value); }
		});


		this.defineProp('enableOperContext', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('enableOperContext', !!value);
				if (!value)  // release operContext
				{
					var ctx = this.getPropStoreFieldValue('operContext');
					var b = this.getPropStoreFieldValue('drawBridge');
					if (b && ctx)
						b.releaseContext(ctx);
				}
			}
		});

		this.defineProp('enableGesture', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				var bValue = !!value;
				if (this.getEnableGesture() !== bValue)
				{
					this.setPropStoreFieldValue('enableGesture', bValue);
					if (bValue)
					{
						this.startObservingGestureEvents(this.OBSERVING_GESTURES);
					}
					else
					{
						this.startObservingGestureEvents(this.OBSERVING_GESTURES);
					}
				}
			}
		});

		// private
		this.defineProp('uiEventReceiverElem', {'dataType': DataType.OBJECT, 'serializable': false, setter: null});

		// context parent properties, private
		this.defineProp('objContextParentElem', {'dataType': DataType.OBJECT, 'serializable': false, setter: null});
		this.defineProp('operContextParentElem', {'dataType': DataType.OBJECT, 'serializable': false, setter: null});
		this.defineProp('uiContextParentElem', {'dataType': DataType.OBJECT, 'serializable': false, setter: null});

		this.defineProp('objContext', {'dataType': DataType.OBJECT, 'serializable': false, setter: null,
			'getter': function() { return this.getDrawContext(); }
		});
		this.defineProp('operContext', {'dataType': DataType.OBJECT, 'serializable': false, 'setter': null,
			'getter': function()
			{
				if (!this.getEnableOperContext())
					return null;
				else
				{
					var result = this.getPropStoreFieldValue('operContext');
					if (!result)
					{
						var bridge = this.getDrawBridge();
						if (bridge)
						{
							var elem = this.getOperContextParentElem();
							if (!elem)
								return null;
							else
							{
								var dim = Kekule.HtmlElementUtils.getElemScrollDimension(elem);
								result = bridge.createContext(elem, dim.width, dim.height);
								this.setPropStoreFieldValue('operContext', result);
							}
						}
					}
					return result;
				}
			}
		});
		this.defineProp('uiContext', {'dataType': DataType.OBJECT, 'serializable': false,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('uiContext');
				if (!result)
				{
					var bridge = this.getUiDrawBridge();
					if (bridge)
					{
						var elem = this.getUiContextParentElem();
						if (!elem)
							return null;
						else
						{
							var dim = Kekule.HtmlElementUtils.getElemScrollDimension(elem);
							//var dim = Kekule.HtmlElementUtils.getElemClientDimension(elem);
							result = bridge.createContext(elem, dim.width, dim.height);
							this.setPropStoreFieldValue('uiContext', result);
						}
					}
				}
				return result;
			}
		});

		this.defineProp('objDrawBridge', {'dataType': DataType.OBJECT, 'serializable': false, 'setter': null,
			'getter': function() { return this.getDrawBridge(); }
		});
		this.defineProp('uiDrawBridge', {'dataType': DataType.OBJECT, 'serializable': false, 'setter': null,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('uiDrawBridge');
				if (!result)
				{
					result = this.createUiDrawBridge();
					this.setPropStoreFieldValue('uiDrawBridge', result);
				}
				return result;
			}
		});

		this.defineProp('uiPainter', {'dataType': 'Kekule.Render.ChemObjPainter', 'serializable': false, 'setter': null,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('uiPainter');
				if (!result)
				{
					// ui painter will always in 2D mode
					var markers = this.getUiMarkers();
					result = new Kekule.Render.ChemObjPainter(Kekule.Render.RendererType.R2D, markers, this.getUiDrawBridge());
					result.setCanModifyTargetObj(true);
					this.setPropStoreFieldValue('uiPainter', result);
					return result;
				}
				return result;
			}
		});
		this.defineProp('uiRenderer', {'dataType': 'Kekule.Render.AbstractRenderer', 'serializable': false, 'setter': null,
			'getter': function()
			{
				var p = this.getUiPainter();
				if (p)
				{
					var r = p.getRenderer();
					if (!r)
						p.prepareRenderer();
					return p.getRenderer() || null;
				}
				else
					return null;
			}
		});

		// private ui marks properties
		//this.defineProp('uiMarkers', {'dataType': DataType.ARRAY, 'serializable': false, 'setter': null});
		this.defineProp('uiMarkers', {'dataType': 'Kekule.ChemWidget.UiMarkerCollection', 'serializable': false, 'setter': null,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('uiMarkers');
				if (!result)
				{
					result = new Kekule.ChemWidget.UiMarkerCollection();
					this.setPropStoreFieldValue('uiMarkers', result);
				}
				return result;
			}
		});
		/*
		this.defineProp('uiHotTrackMarker', {'dataType': 'Kekule.ChemWidget.AbstractUIMarker', 'serializable': false,
			'getter': function() { return this.getUiMarkers().hotTrackMarker; },
			'setter': function(value) { this.getUiMarkers().hotTrackMarker = value; }
		});
		this.defineProp('uiSelectionAreaMarker', {'dataType': 'Kekule.ChemWidget.AbstractUIMarker', 'serializable': false,
			'getter': function() { return this.getUiMarkers().selectionAreaMarker; },
			'setter': function(value) { this.getUiMarkers().selectionAreaMarker = value; }
		});
		this.defineProp('uiSelectingMarker', {'dataType': 'Kekule.ChemWidget.AbstractUIMarker', 'serializable': false,
			'getter': function() { return this.getUiMarkers().selectingMarker; },
			'setter': function(value) { this.getUiMarkers().selectingMarker = value; }
		}); // marker of selecting rubber band
		*/
		this._defineUiMarkerProp('uiHotTrackMarker');
		this._defineUiMarkerProp('uiSelectionAreaMarker');   // marker of selected range
		this._defineUiMarkerProp('uiSelectingMarker');   // marker of selecting rubber band

		this.defineProp('uiSelectionAreaContainerBox',
			{'dataType': DataType.Object, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE});


		// a private chemObj-renderer map
		this.defineProp('objRendererMap', {'dataType': 'Kekule.MapEx', 'serializable': false, 'setter': null,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('objRendererMap');
				if (!result)
				{
					result = new Kekule.MapEx(true);
					this.setPropStoreFieldValue('objRendererMap', result);
				}
				return result;
			}
		});
		// private object to record all bound infos
		this.defineProp('boundInfoRecorder', {'dataType': 'Kekule.Render.BoundInfoRecorder', 'serializable': false, 'setter': null});

		this.defineProp('zoomCenter', {'dataType': DataType.HASH});
	},

	/** @private */
	_defineUiMarkerProp: function(propName, uiMarkerCollection)
	{
		return this.defineProp(propName, {'dataType': 'Kekule.ChemWidget.AbstractUIMarker', 'serializable': false,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue(propName);
				if (!result)
				{
					result = this.createShapeBasedMarker(propName, null, null, false); // prop value already be set in createShapeBasedMarker method
				}
				return result;
			},
			'setter': function(value)
			{
				if (!uiMarkerCollection)
					uiMarkerCollection = this.getUiMarkers();
				var old = this.getPropValue(propName);
				if (old)
				{
					uiMarkerCollection.removeMarker(old);
					old.finalize();
				}
				uiMarkerCollection.addMarker(value);
				this.setPropStoreFieldValue(propName, value);
			}
		});
	},
	/** @private */
	doFinalize: function($super)
	{
		var h = this.getPropStoreFieldValue('operHistory');
		if (h)
		{
			h.finalize();
			this.setPropStoreFieldValue('operHistory', null);
		}
		var b = this.getPropStoreFieldValue('objDrawBridge');
		var ctx = this.getPropStoreFieldValue('operContext');
		if (b && ctx)
		{
			b.releaseContext(ctx);
		}
		this.setPropStoreFieldValue('operContext', null);
		var b = this.getPropStoreFieldValue('uiDrawBridge');
		var ctx = this.getPropStoreFieldValue('uiContext');
		if (b && ctx)
		{
			b.releaseContext(ctx);
		}
		this.setPropStoreFieldValue('uiDrawBridge', null);
		this.setPropStoreFieldValue('uiContext', null);

		var r = this.getPropStoreFieldValue('boundInfoRecorder');
		if (r)
			r.finalize();
		this.setPropStoreFieldValue('boundInfoRecorder', null);

		var m = this.getPropStoreFieldValue('objRendererMap');
		if (m)
			m.finalize();
		this.setPropStoreFieldValue('objRendererMap', null);
		$super();
	},

	/**
	 * Create a default editor config object.
	 * Descendants may override this method.
	 * @returns {Kekule.Editor.BaseEditorConfigs}
	 * @ignore
	 */
	createDefaultConfigs: function()
	{
		return new Kekule.Editor.BaseEditorConfigs();
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
		var elem = doc.createElement('div');
		elem.className = CCNS.EDITOR_CLIENT;
		rootElem.appendChild(elem);
		this._editClientElem = elem;
		return [elem];
	},
	/** @ignore */
	getCoreElement: function($super)
	{
		return this._editClientElem || $super();
	},
	/** @private */
	getEditClientElem: function()
	{
		return this._editClientElem;
	},
	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		var result = $super() + ' ' + CCNS.EDITOR;
		var additional = (this.getRenderType() === Kekule.Render.RendererType.R3D)?
			CCNS.EDITOR3D: CCNS.EDITOR2D;
		result += ' ' + additional;
		return result;
	},

	/** @private */
	doBindElement: function(element)
	{
		this.createContextParentElems();
		this.createUiEventReceiverElem();
	},

	// override getter and setter of intialZoom property
	/** @ignore */
	doGetInitialZoom: function($super)
	{
		var result;
		var config = this.getEditorConfigs();
		if (config)
			result = config.getInteractionConfigs().getEditorInitialZoom();
		if (!result)
			result = $super();
		return result;
	},
	/** @ignore */
	doSetInitialZoom: function($super, value)
	{
		var config = this.getEditorConfigs();
		if (config)
			config.getInteractionConfigs().setEditorInitialZoom(value);
		$super(value);
	},

	/** @ignore */
	zoomTo: function($super, value, suspendRendering, zoomCenterCoord)
	{
		var CU = Kekule.CoordUtils;
		var currZoomLevel = this.getCurrZoom();
		var zoomLevel = value;
		var result = $super(value, suspendRendering);
		// adjust zoom center
		var selfElem = this.getElement();
		var currScrollCoord = {'x': selfElem.scrollLeft, 'y': selfElem.scrollTop};
		if (!zoomCenterCoord)
			zoomCenterCoord = this.getZoomCenter();
		if (!zoomCenterCoord )  // use the center of client as the zoom center
		{
			zoomCenterCoord = CU.add(currScrollCoord, {'x': selfElem.clientWidth / 2, 'y': selfElem.clientHeight / 2});
		}
		//console.log('zoom center info', this.getZoomCenter(), zoomCenterCoord);
		//if (zoomCenterCoord)
		// {
		// 	var scrollDelta = CU.multiply(zoomCenterCoord, zoomLevel / currZoomLevel - 1);
		// 	selfElem.scrollLeft += scrollDelta.x;
		// 	selfElem.scrollTop += scrollDelta.y;
		// }
		return result;
	},
	/**
	 * Zoom in.
	 */
	zoomIn: function(step, zoomCenterCoord)
	{
		var curr = this.getCurrZoom();
		var ratio = Kekule.ZoomUtils.getNextZoomInRatio(curr, step || 1);
		return this.zoomTo(ratio, null, zoomCenterCoord);
	},
	/**
	 * Zoom out.
	 */
	zoomOut: function(step, zoomCenterCoord)
	{
		var curr = this.getCurrZoom();
		var ratio = Kekule.ZoomUtils.getNextZoomOutRatio(curr, step || 1);
		return this.zoomTo(ratio, null, zoomCenterCoord);
	},
	/**
	 * Reset to normal size.
	 */
	resetZoom: function(zoomCenterCoord)
	{
		return this.zoomTo(this.getInitialZoom() || 1, null, zoomCenterCoord);
	},

	/**
	 * Change the size of client element.
	 * Width and height is based on px.
	 * @private
	 */
	changeClientSize: function(width, height, zoomLevel)
	{
		this._initialRenderTransformParams = null;

		var elem = this.getCoreElement();
		var style = elem.style;

		if (!zoomLevel)
			zoomLevel = 1;

		var w = width * zoomLevel;
		var h = height * zoomLevel;

		if (w)
			style.width = w + 'px';
		if (h)
			style.height = h + 'px';

		var ctxes = [this.getObjContext(), this.getOperContext(), this.getUiContext()];
		for (var i = 0, l = ctxes.length; i < l; ++i)
		{
			var ctx = ctxes[i];
			if (ctx)  // change ctx size also
			{
				this.getDrawBridge().setContextDimension(ctx, w, h);
			}
		}
		this.repaint();
	},

	/**
	 * Returns the screen box (x1, y1, x2, y2) of current visible client area in editor.
	 * @returns {Hash}
	 */
	getVisibleClientScreenBox: function()
	{
		var elem = this.getEditClientElem().parentNode;
		var result = Kekule.HtmlElementUtils.getElemClientDimension(elem);
		var pos = this.getClientScrollPosition();
		result.x1 = pos.x;
		result.y1 = pos.y;
		result.x2 = result.x1 + result.width;
		result.y2 = result.y1 + result.height;
		return result;
	},
	/**
	 * Returns the context box (x1, y1, x2, y2, in a specified coord system) of current visible client area in editor.
	 * @param {Int} coordSys
	 * @returns {Hash}
	 */
	getVisibleClientBoxOfSys: function(coordSys)
	{
		var screenBox = this.getVisibleClientScreenBox();
		var coords = Kekule.BoxUtils.getMinMaxCoords(screenBox);
		var c1 = this.translateCoord(coords.min, Kekule.Editor.CoordSys.SCREEN, coordSys);
		var c2 = this.translateCoord(coords.max, Kekule.Editor.CoordSys.SCREEN, coordSys);
		var result = Kekule.BoxUtils.createBox(c1, c2);
		return result;
	},
	/**
	 * Returns the context box (x1, y1, x2, y2, in object coord system) of current visible client area in editor.
	 * @param {Int} coordSys
	 * @returns {Hash}
	 */
	getVisibleClientObjBox: function(coordSys)
	{
		return this.getVisibleClientBoxOfSys(Kekule.Editor.CoordSys.CHEM);
	},

	/**
	 * Returns whether the chem object inside editor has been modified since load.
	 * @returns {Bool}
	 */
	isDirty: function()
	{
		if (this.getEnableOperHistory())
			return this.getOperHistory().getCurrIndex() >= 0;
		else
			return this._objChanged;
	},

	/**
	 * Returns srcInfo of chemObj. If editor is dirty (object been modified), srcInfo will be unavailable.
	 * @param {Kekule.ChemObject} chemObj
	 * @returns {Object}
	 */
	getChemObjSrcInfo: function(chemObj)
	{
		if (this.isDirty())
			return null;
		else
			return chemObj.getSrcInfo? chemObj.getSrcInfo(): null;
	},

	/* @private */
	/*
	_calcPreferedTransformOptions: function()
	{
		var drawOptions = this.getDrawOptions();
		return this.getPainter().calcPreferedTransformOptions(
			this.getObjContext(), this.calcDrawBaseCoord(drawOptions), drawOptions);
	},
	*/

	/** @private */
	getActualDrawOptions: function($super)
	{
		var old = $super();
		if (this._initialRenderTransformParams)
		{
			var result = Object.extend({}, this._initialRenderTransformParams);
			result = Object.extend(result, old);
			//var result = Object.create(old);
			//result.initialRenderTransformParams = this._initialRenderTransformParams;
			//console.log('extended', this._initialRenderTransformParams, result);
			return result;
		}
		else
			return old;
	},

	/** @ignore */
		/*
	getDrawClientDimension: function()
	{

	},
	*/

	/** @ignore */
	repaint: function($super, overrideOptions)
	{
		var ops = overrideOptions;
		//console.log('repaint called', overrideOptions);
		//console.log('repaint', this._initialRenderTransformParams);
		/*
		if (this._initialRenderTransformParams)
		{
			ops = Object.create(overrideOptions || {});
			//console.log(this._initialRenderTransformParams);
			ops = Object.extend(ops, this._initialRenderTransformParams);
		}
		else
		{
			ops = overrideOptions;
			//this._initialRenderTransformParams = this._calcPreferedTransformOptions();
			//console.log('init params: ', this._initialRenderTransformParams, drawOptions);
		}
		*/
		var result = $super(ops);

		// after paint the new obj the first time, save up the transform params (especially the translates)
		if (!this._initialRenderTransformParams)
		{
			this._initialRenderTransformParams = this.getPainter().getActualInitialRenderTransformOptions(this.getObjContext());
		}

		// redraw ui markers
		this.recalcUiMarkers();

		return result;
	},

	/**
	 * Create a new object and load it in editor.
	 */
	newDoc: function()
	{
		//if (this.getEnableCreateNewDoc()) // enable property only affects UI, always could create new doc in code
		this.load(this.doCreateNewDocObj());
	},
	/**
	 * Create a new object for new document.
	 * Descendants may override this method.
	 * @private
	 */
	doCreateNewDocObj: function()
	{
		return new Kekule.Molecule();
	},

	/**
	 * Returns array of classes that can be exported (saved) from editor.
	 * Descendants can override this method.
	 * @returns {Array}
	 */
	getExportableClasses: function()
	{
		var obj = this.getChemObj();
		if (!obj)
			return [];
		else
			return obj.getClass? obj.getClass(): null;
	},
	/**
	 * Returns exportable object for specified class.
	 * Descendants can override this method.
	 * @param {Class} objClass Set null to export default object.
	 * @returns {Object}
	 */
	exportObj: function(objClass)
	{
		return this.exportObjs(objClass)[0];
	},
	/**
	 * Returns all exportable objects for specified class.
	 * Descendants can override this method.
	 * @param {Class} objClass Set null to export default object.
	 * @returns {Array}
	 */
	exportObjs: function(objClass)
	{
		var obj = this.getChemObj();
		if (!objClass)
			return [obj];
		else
		{
			return (obj && (obj instanceof objClass))? [obj]: [];
		}
	},

	/** @private */
	doLoad: function($super, chemObj)
	{
		// deselect all old objects first
		this.deselectAll();
		this._initialRenderTransformParams = null;
		// clear rendererMap so that all old renderer info is removed
		this.getObjRendererMap().clear();
		if (this.getOperHistory())
			this.getOperHistory().clear();
		$super(chemObj);
		this._objChanged = false;
	},

	/** @private */
	doLoadEnd: function($super, chemObj)
	{
		$super();
		//console.log('loadend: ', chemObj);
		if (!chemObj)
			this._initialRenderTransformParams = null;
		/*
		else
		{
			// after load the new obj the first time, save up the transform params (especially the translates)
			var transParam = this.getPainter().getActualRenderTransformParams(this.getObjContext());
			if (transParam)
			{
				var trans = {}
				var unitLength = transParam.unitLength || 1;
				if (Kekule.ObjUtils.notUnset(transParam.translateX))
					trans.translateX = transParam.translateX / unitLength;
				if (Kekule.ObjUtils.notUnset(transParam.translateY))
					trans.translateY = transParam.translateY / unitLength;
				if (Kekule.ObjUtils.notUnset(transParam.translateZ))
					trans.translateZ = transParam.translateZ / unitLength;

				this._initialRenderTransformParams = trans;
				console.log(this._initialRenderTransformParams, this);
			}
		}
		*/
	},

	/** @private */
	doResize: function($super)
	{
		//console.log('doResize');
		this._initialRenderTransformParams = null;  // transform should be recalculated after resize
		$super();
	},

	/** @ignore */
	geometryOptionChanged: function($super)
	{
		var zoom = this.getDrawOptions().zoom;
		this.zoomChanged(zoom);
		// clear some length related caches
		this._clearLengthCaches();
		$super();
	},

	/** @private */
	zoomChanged: function(zoomLevel)
	{
		// do nothing here
	},

	/** @private */
	_clearLengthCaches: function()
	{
		this._lengthCaches = {};
	},

	/**
	 * @private
	 */
	chemObjChanged: function($super, newObj, oldObj)
	{
		$super(newObj, oldObj);
		if (newObj !== oldObj)
		{
			if (oldObj)
				this._uninstallChemObjEventListener(oldObj);
			if (newObj)
				this._installChemObjEventListener(newObj);
		}
	},

	/** @private */
	_installChemObjEventListener: function(chemObj)
	{
		chemObj.addEventListener('change', this.reactChemObjChange, this);
	},
	/** @private */
	_uninstallChemObjEventListener: function(chemObj)
	{
		chemObj.removeEventListener('change', this.reactChemObjChange, this);
	},

	/**
	 * Create a transparent div element above all other elems of editor,
	 * this element is used to receive all UI events.
	 */
	createUiEventReceiverElem: function()
	{
		var parent = this.getCoreElement();
		if (parent)
		{
			var result = parent.ownerDocument.createElement('div');
			result.className = CCNS.EDITOR_UIEVENT_RECEIVER;
			/*
			result.id = 'overlayer';
			*/
			/*
			var style = result.style;
			style.background = 'transparent';
			//style.background = 'yellow';
			//style.opacity = 0;
			style.position = 'absolute';
			style.left = 0;
			style.top = 0;
			style.width = '100%';
			style.height = '100%';
			*/
			//style.zIndex = 1000;
			parent.appendChild(result);
			EU.addClass(result, CNS.DYN_CREATED);

			this.setPropStoreFieldValue('uiEventReceiverElem', result);
			return result;
		}
	},

	/** @private */
	createContextParentElems: function()
	{
		var parent = this.getCoreElement();
		if (parent)
		{
			parent.style.height = '340px';
			var doc = parent.ownerDocument;
			this._createContextParentElem(doc, parent, 'objContextParentElem');
			this._createContextParentElem(doc, parent, 'operContextParentElem');
			this._createContextParentElem(doc, parent, 'uiContextParentElem');
		}
	},
	/** @private */
	_createContextParentElem: function(doc, parentElem, contextElemPropName)
	{
		var result = doc.createElement('div');
		result.style.position = 'absolute';
		result.className = contextElemPropName + ' ' + CNS.DYN_CREATED;  // debug
		this.setPropStoreFieldValue(contextElemPropName, result);
		parentElem.appendChild(result);
		return result;
	},

	/** @private */
	createNewPainter: function($super, chemObj)
	{
		var result = $super(chemObj);
		if (result)
		{
			result.setCanModifyTargetObj(true);
			this.installPainterEventHandlers(result);
			// create new bound info recorder
			this.createNewBoundInfoRecorder(this.getPainter());
		}
		return result;
	},
	/** @private */
	createNewBoundInfoRecorder: function(renderer)
	{
		var old = this.getPropStoreFieldValue('boundInfoRecorder');
		if (old)
			old.finalize();
		var recorder = new Kekule.Render.BoundInfoRecorder(renderer);
		//recorder.setTargetContext(this.getObjContext());
		this.setPropStoreFieldValue('boundInfoRecorder', recorder);
	},

	/** @private */
	getDrawContextParentElem: function()
	{
		return this.getObjContextParentElem();
	},

	/** @private */
	createUiDrawBridge: function()
	{
		// UI marker will always be in 2D
		var result = Kekule.Render.DrawBridge2DMananger.getPreferredBridgeInstance();
		if (!result)   // can not find suitable draw bridge
		{
			Kekule.error(/*Kekule.ErrorMsg.DRAW_BRIDGE_NOT_SUPPORTED*/Kekule.$L('ErrorMsg.DRAW_BRIDGE_NOT_SUPPORTED'));
		}
		return result;
	},

	/* @private */
	/*
	refitDrawContext: function($super, doNotRepaint)
	{
		//var dim = Kekule.HtmlElementUtils.getElemScrollDimension(this.getElement());
		var dim = Kekule.HtmlElementUtils.getElemClientDimension(this.getElement());
		//this._resizeContext(this.getObjDrawContext(), this.getObjDrawBridge(), dim.width, dim.height);
		this._resizeContext(this.getOperContext(), this.getObjDrawBridge(), dim.width, dim.height);
		this._resizeContext(this.getUiContext(), this.getUiDrawBridge(), dim.width, dim.height);
		$super(doNotRepaint);
	},
	*/
	/** @private */
	changeContextDimension: function($super, newDimension)
	{
		var result = $super(newDimension);
		if (result)
		{
			this._resizeContext(this.getOperContext(), this.getObjDrawBridge(), newDimension.width, newDimension.height);
			this._resizeContext(this.getUiContext(), this.getUiDrawBridge(), newDimension.width, newDimension.height);
		}
		return result;
	},
	/** @private */
	_resizeContext: function(context, bridge, width, height)
	{
		if (context && bridge)
			bridge.setContextDimension(context, width, height);
	},

	/** @private */
	_clearSpecContext: function(context, bridge)
	{
		if (bridge && context)
			bridge.clearContext(context);
	},
	/**
	 * Clear the main context.
	 * @private
	 */
	clearObjContext: function()
	{
		//console.log('clear obj context', this.getObjContext() === this.getDrawContext());
		this._clearSpecContext(this.getObjContext(), this.getDrawBridge());
		if (this.getBoundInfoRecorder())
			this.getBoundInfoRecorder().clear(this.getObjContext());
	},
	/**
	 * Clear the operating context.
	 * @private
	 */
	clearOperContext: function()
	{
		this._clearSpecContext(this.getOperContext(), this.getDrawBridge());
	},
	/**
	 * Clear the UI layer context.
	 * @private
	 */
	clearUiContext: function()
	{
		this._clearSpecContext(this.getUiContext(), this.getUiDrawBridge());
	},

	/** @private */
	clearContext: function()
	{
		this.clearObjContext();
		if (this._operatingRenderers)
			this.clearOperContext();
	},

	/**
	 * Repaint the operating context only (not the whole obj context).
	 * @private
	 */
	repaintOperContext: function(ignoreUiMarker)
	{
		if (this._operatingRenderers && this._operatingObjs)
		{
			this.clearOperContext();

			var options = {'partialDrawObjs': this._operatingObjs, 'doNotClear': true};
			this.repaint(options);

			/*
			var context = this.getObjContext();
			//console.log(this._operatingRenderers.length);
			for (var i = 0, l = this._operatingRenderers.length; i < l; ++i)
			{
				var renderer = this._operatingRenderers[i];
				console.log('repaint oper', renderer.getClassName(), renderer.getChemObj().getId(), !!renderer.getRedirectContext(), this._operatingRenderers.length);
				renderer.redraw(context);
			}

			if (!ignoreUiMarker)
				this.recalcUiMarkers();
			*/
		}
	},

	/** @private */
	getOperatingRenderers: function()
	{
		if (!this._operatingRenderers)
			this._operatingRenderers = [];
		return this._operatingRenderers;
	},
	/** @private */
	setOperatingRenderers: function(value)
	{
		this._operatingRenderers = value;
	},

	//////////////////////////////////////////////////////////////////////

	/////////////////// methods about painter ////////////////////////////

	/** @private */
	installPainterEventHandlers: function(painter)
	{
		painter.addEventListener('prepareDrawing', this.reactChemObjPrepareDrawing, this);
		painter.addEventListener('clear', this.reactChemObjClear, this);
	},
	/** @private */
	reactChemObjPrepareDrawing: function(e)
	{
		var ctx = e.context;
		var obj = e.obj;
		if (obj && ((ctx === this.getObjContext()) || (ctx === this.getOperContext())))
		{
			var renderer = e.target;
			this.getObjRendererMap().set(obj, renderer);
			//console.log('object drawn', obj, obj.getClassName(), renderer, renderer.getClassName());

			// check if renderer should be redirected to oper context
			if (this.getEnableOperContext())
			{
				var operObjs = this._operatingObjs || [];
				var needRedirect = false;
				for (var i = 0, l = operObjs.length; i < l; ++i)
				{
					if (this._isChemObjDirectlyRenderedByRenderer(this.getObjContext(), operObjs[i], renderer))
					{
						needRedirect = true;
						break;
					}
				}
				if (needRedirect)
				{
					this._setRendererToOperContext(renderer);
					//console.log('do redirect', renderer.getClassName(), obj && obj.getId && obj.getId());
					AU.pushUnique(this.getOperatingRenderers(), renderer);
				}
				/*
				else
				{
					this._unsetRendererToOperContext(renderer);
					console.log('unset redirect', renderer.getClassName(), obj && obj.getId && obj.getId());
				}
				*/
			}
		}
	},
	/** @private */
	reactChemObjClear: function(e)
	{
		var ctx = e.context;
		var obj = e.obj;
		if (obj && ((ctx === this.getObjContext()) || (ctx === this.getOperContext())))
		{
			var renderer = e.target;
			this.getObjRendererMap().remove(obj);
			AU.remove(this.getOperatingRenderers(), renderer);
		}
	},

	//////////////////////////////////////////////////////////////////////

	/////////////////// event handlers of nested objects ///////////////////////
	/**
	 * React to change event of loaded chemObj.
	 * @param {Object} e
	 */
	reactChemObjChange: function(e)
	{
		var target = e.target;
		var propNames = e.changedPropNames || [];
		var bypassPropNames = ['id', 'owner', 'ownedObjs'];  // these properties do not affect rendering
		propNames = Kekule.ArrayUtils.exclude(propNames, bypassPropNames);
		if (propNames.length || !e.changedPropNames)  // when changedPropNames is not set, may be change event invoked by parent when suppressing child objects
		{
			//console.log('chem obj change', target.getClassName(), propNames, e);
			this.objectChanged(target, propNames);
		}
	},

	/** @private */
	reactOperHistoryPush: function(e)
	{
		this.invokeEvent('operPush', e);
	},
	/** @private */
	reactOperHistoryPop: function(e)
	{
		this.invokeEvent('operPop', e);
	},
	/** @private */
	reactOperHistoryUndo: function(e)
	{
		this.invokeEvent('operUndo', e);
	},
	/** @private */
	reactOperHistoryRedo: function(e)
	{
		this.invokeEvent('operRedo', e);
	},
	reactOperHistoryClear: function(e)
	{
		this.invokeEvent('operHistoryClear', e);
	},
	reactOperHistoryChange: function(e)
	{
		this.invokeEvent('operChange', e);
	},
	/////////////////////////////////////////////////////////////////////////////

	///////////// Methods about object changing notification ////////////////////
	/**
	 * Call this method to temporarily suspend object change notification.
	 */
	beginUpdateObject: function()
	{
		if (this._objectUpdateFlag >= 0)
		{
			this.invokeEvent('beginUpdateObject');
		}
		--this._objectUpdateFlag;
	},
	/**
	 * Call this method to indicate the update process is over and objectChanged will be immediately called.
	 */
	endUpdateObject: function()
	{
		++this._objectUpdateFlag;
		if (!this.isUpdatingObject())
		{
			if ((this._updatedObjectDetails && this._updatedObjectDetails.length))
			{
				this.objectsChanged(this._updatedObjectDetails);
				this._updatedObjectDetails = [];
			}
			this.invokeEvent('endUpdateObject'/*, {'details': Object.extend({}, this._updatedObjectDetails)}*/);
		}
	},
	/**
	 * Check if beginUpdateObject is called and should not send object change notification immediately.
	 */
	isUpdatingObject: function()
	{
		return (this._objectUpdateFlag < 0);
	},
	/** @private */
	_mergeObjUpdatedDetails: function(dest, target)
	{
		for (var i = 0, l = target.length; i < l; ++i)
		{
			this._mergeObjUpdatedDetailItem(dest, target[i]);
		}
	},
	/** @private */
	_mergeObjUpdatedDetailItem: function(dest, targetItem)
	{
		for (var i = 0, l = dest.length; i < l; ++i)
		{
			var destItem = dest[i];
			// can merge
			if (destItem.obj === targetItem.obj)
			{
				if (!destItem.propNames)
					destItem.propNames = [];
				if (targetItem.propNames)
					Kekule.ArrayUtils.pushUnique(destItem.propNames, targetItem.propNames);
				return;
			}
		}
		// can not merge
		dest.push(targetItem);
	},
	/** @private */
	_logUpdatedDetail: function(details)
	{
		var msg = '';
		details.forEach(function(d){
			msg += 'Obj: ' + d.obj.getId() + '[' + d.obj.getClassName() + ']     ';
			msg += 'Props: [' + d.propNames.join(', ') + ']';
			msg += '\n';
		});
		console.log(msg);
	},
	/**
	 * Notify the object(s) property has been changed and need to be updated.
	 * @param {Variant} obj An object or a object array.
	 * @param {Array} changedPropNames
	 * @private
	 */
	objectChanged: function(obj, changedPropNames)
	{
		var data = {'obj': obj, 'propNames': changedPropNames};
		//console.log('obj changed', obj.getClassName(), obj.getId(), changedPropNames);
		var result = this.objectsChanged(data);
		this.invokeEvent('editObjChanged', Object.extend({}, data));  // avoid change data
		return result;
	},
	/**
	 * Notify the object(s) property has been changed and need to be updated.
	 * @param {Variant} objDetails An object detail or an object detail array.
	 * @private
	 */
	objectsChanged: function(objDetails)
	{
		var a = DataType.isArrayValue(objDetails)? objDetails: [objDetails];
		if (this.isUpdatingObject())  // suspend notification, just push objs in cache
		{
			//Kekule.ArrayUtils.pushUnique(this._updatedObjectDetails, a);
			this._mergeObjUpdatedDetails(this._updatedObjectDetails, a);
			//console.log('updating objects, suspending...', this._updatedObjectDetails);
			//this._logUpdatedDetail(this._updatedObjectDetails);
		}
		else
		{
			//console.log('object changed');
			var updateObjs = Kekule.Render.UpdateObjUtils._extractObjsOfUpdateObjDetails(a);
			this.doObjectsChanged(a, updateObjs);
			this.invokeEvent('editObjsUpdated', {'details': Object.extend({}, objDetails)});
		}

		this._objChanged = true;  // mark object changed
		this.invokeEvent('editObjsChanged', {'details': Object.extend({}, objDetails)});

		var selectedObjs = this.getSelection();
		if (selectedObjs && updateObjs)
		{
			var changedSelectedObjs = AU.intersect(selectedObjs, updateObjs);
			if (changedSelectedObjs.length)
				this.invokeEvent('selectedObjsUpdated', {'objs': changedSelectedObjs});
		}
	},
	/**
	 * Do actual job of objectsChanged. Descendants should override this method.
	 * @private
	 */
	doObjectsChanged: function(objDetails, updateObjs)
	{
		var oDetails = Kekule.ArrayUtils.clone(objDetails);
		if (!updateObjs)
			updateObjs = Kekule.Render.UpdateObjUtils._extractObjsOfUpdateObjDetails(oDetails);

		//console.log('origin updateObjs', updateObjs);

		var additionalObjs = this._getAdditionalRenderRelatedObjs(updateObjs);

		// also push related objects into changed objs list
		if (additionalObjs.length)
		{
			var additionalDetails = Kekule.Render.UpdateObjUtils._createUpdateObjDetailsFromObjs(additionalObjs);
			Kekule.ArrayUtils.pushUnique(oDetails, additionalDetails);
		}

		// merge updateObjs and additionalObjs
		//updateObjs = updateObjs.concat(additionalObjs);
		Kekule.ArrayUtils.pushUnique(updateObjs, additionalObjs);

		//console.log('changed objects', updateObjs);

		var operRenderers = this._operatingRenderers;
		var updateOperContextOnly = operRenderers && this._isAllObjsRenderedByRenderers(this.getObjContext(), updateObjs, operRenderers);
		var canDoPartialUpdate = this.canModifyPartialGraphic();

		//console.log('update objs and operRenderers', updateObjs, operRenderers);
		//console.log('object changed', updateOperContextOnly, canDoPartialUpdate);

		if (canDoPartialUpdate)  // partial update
		{
			//var updateObjDetails = Kekule.Render.UpdateObjUtils._createUpdateObjDetailsFromObjs(updateObjs);
			this.getRootRenderer().modify(this.getObjContext(),/* updateObjDetails*/oDetails);
			// always repaint UI markers
			this.recalcUiMarkers();
			//console.log('partial update', oDetails);
		}
		else  // update whole context
		{
			if (updateOperContextOnly)
			{
				//console.log('repaint oper context only');
				this.repaintOperContext();
			}
			else  // need to update whole context
			{
				//console.log('[repaint whole]');
				this.repaint();
				/*
				var self = this;
				(function(){ self.repaint(); }).defer();
				*/
			}
		}
	},

	/**
	 * Call this method to indicate a continuous manipulation operation is doing (e.g. moving or rotating objects).
	 */
	beginManipulateObject: function()
	{
		//console.log('[Call begin update]', this._objectManipulateFlag);
		if (this._objectManipulateFlag >= 0)
		{
			//console.log('[BEGIN MANIPULATE]');
			this.invokeEvent('beginManipulateObject');
		}
		--this._objectManipulateFlag;
	},
	/**
	 * Call this method to indicate the update process is over and objectChanged will be immediately called.
	 */
	endManipulateObject: function()
	{
		++this._objectManipulateFlag;
		//console.log('[END MANIPULATE]');
		if (!this.isManipulatingObject())
		{
			this._objectManipulateFlag = 0;
			//console.log('[MANIPULATE DONE]');
			this.invokeEvent('endManipulateObject'/*, {'details': Object.extend({}, this._updatedObjectDetails)}*/);
		}
	},
	/**
	 * Check if beginUpdateObject is called and should not send object change notification immediately.
	 */
	isManipulatingObject: function()
	{
		return (this._objectManipulateFlag < 0);
	},

	/** @private */
	_needToCanonicalizeBeforeSaving: function()
	{
		return true; // !!this.getStandardizeObjectsBeforeSaving();
	},

	/** @private */
	_getAdditionalRenderRelatedObjs: function(objs)
	{
		var result = [];
		for (var i = 0, l = objs.length; i < l; ++i)
		{
			var obj = objs[i];
			//Kekule.ArrayUtils.pushUnique(result, obj);
			var relatedObjs = obj.getCoordDeterminateObjects? obj.getCoordDeterminateObjects(): [];
			//console.log('obj', obj.getClassName(), 'related', relatedObjs);
			Kekule.ArrayUtils.pushUnique(result, relatedObjs);
		}
		return result;
	},

	/** @private */
	_isAllObjsRenderedByRenderers: function(context, objs, renders)
	{
		//console.log('check objs by renderers', objs, renders);
		for (var i = 0, l = objs.length; i < l; ++i)
		{
			var obj = objs[i];
			var isRendered = false;
			for (var j = 0, k = renders.length; j < k; ++j)
			{
				var renderer = renders[j];
				if (renderer.isChemObjRenderedBySelf(context, obj))
				{
					isRendered = true;
					break;
				}
			}
			if (!isRendered)
				return false;
		}
		return true;
	},
	/////////////////////////////////////////////////////////////////////////////

	////////////// Method about operContext rendering ///////////////////////////
	/**
	 * Prepare to do a modification work in editor (e.g., move some atoms).
	 * The objs to be modified will be rendered in operContext separately (if enableOperContext is true).
	 * @param {Array} objs
	 */
	prepareOperatingObjs: function(objs)
	{
		// Check if already has old operating renderers. If true, just end them.
		if (this._operatingRenderers && this._operatingRenderers.length)
			this.endOperatingObjs(true);
		if (this.getEnableOperContext())
		{
			// prepare operating renderers
			this._prepareRenderObjsInOperContext(objs);
			this._operatingObjs = objs;
			//console.log('oper objs', this._operatingObjs);
			//console.log('oper renderers', this._operatingRenderers);
		}
		// finally force repaint the whole client area, both objContext and operContext
		this.repaint();
	},
	/**
	 * Modification work in editor (e.g., move some atoms) is done.
	 * The objs to be modified will be rendered back into objContext.
	 * @param {Bool} noRepaint
	 */
	endOperatingObjs: function(noRepaint)
	{
		// notify to render all objs in main context
		if (this.getEnableOperContext())
		{
			this._endRenderObjsInOperContext();
			this._operatingObjs = null;
			if (!noRepaint)
			{
				//console.log('end operation objs');
				this.repaint();
			}
		}
	},

	/** @private */
	_isChemObjDirectlyRenderedByRenderer: function(context, obj, renderer)
	{
		var standaloneObj = obj.getStandaloneAncestor? obj.getStandaloneAncestor(): obj;
		return renderer.isChemObjRenderedDirectlyBySelf(context, standaloneObj);
	},
	/** @private */
	_getStandaloneRenderObjsInOperContext: function(objs)
	{
		var standAloneObjs = [];
		for (var i = 0, l = objs.length; i < l; ++i)
		{
			var obj = objs[i];
			if (obj.getStandaloneAncestor)
				obj = obj.getStandaloneAncestor();
			Kekule.ArrayUtils.pushUnique(standAloneObjs, obj);
		}
		return standAloneObjs;
	},

	/** @private */
	_prepareRenderObjsInOperContext: function(objs)
	{
		//console.log('redirect objs', objs);
		var renderers = [];
		var map = this.getObjRendererMap();
		var rs = map.getValues();
		var context = this.getObjContext();
		var standAloneObjs = this._getStandaloneRenderObjsInOperContext(objs);
		/*
		if (standAloneObjs.length)
			console.log(standAloneObjs[0].getId(), standAloneObjs);
		else
			console.log('(no standalone)');
		*/
		//for (var i = 0, l = objs.length; i < l; ++i)
		for (var i = 0, l = standAloneObjs.length; i < l; ++i)
		{
			//var obj = objs[i];
			var obj = standAloneObjs[i];

			for (var j = 0, k = rs.length; j < k; ++j)
			{
				var renderer = rs[j];
				//if (renderer.isChemObjRenderedBySelf(context, obj))
				if (renderer.isChemObjRenderedDirectlyBySelf(context, obj))
				{
					//console.log('direct rendered by', obj.getClassName(), renderer.getClassName());
					Kekule.ArrayUtils.pushUnique(renderers, renderer);
				}
				/*
				if (parentFragment && renderer.isChemObjRenderedDirectlyBySelf(context, parentFragment))
					Kekule.ArrayUtils.pushUnique(renderers, renderer);  // when modify node or connector, mol will also be changed
				*/
			}
			/*
			var renderer = map.get(objs[i]);
			if (renderer)
				Kekule.ArrayUtils.pushUnique(renderers, renderer);
			*/
		}
		//console.log('oper renderers', renderers);
		if (renderers.length > 0)
		{
			for (var i = 0, l = renderers.length; i < l; ++i)
			{
				var renderer = renderers[i];
				this._setRendererToOperContext(renderer);
				//console.log('begin context redirect', renderer.getClassName());
				//console.log(renderer.getRedirectContext());
			}
			this._operatingRenderers = renderers;
		}
		else
			this._operatingRenderers = null;

		//console.log('<total renderer count>', rs.length, '<redirected>', renderers.length);
		/*
		if (renderers.length)
			console.log('redirected obj 0: ', renderers[0].getChemObj().getId());
		*/
	},
	/** @private */
	_endRenderObjsInOperContext: function()
	{
		var renderers = this._operatingRenderers;
		if (renderers && renderers.length)
		{
			for (var i = 0, l = renderers.length; i < l; ++i)
			{
				var renderer = renderers[i];
				//renderer.setRedirectContext(null);
				this._unsetRendererToOperContext(renderer);
				//console.log('end context redirect', renderer.getClassName());
			}
			this.clearOperContext();
		}
		this._operatingRenderers = null;
	},

	/** @private */
	_setRendererToOperContext: function(renderer)
	{
		renderer.setRedirectContext(this.getOperContext());
	},
	/** @private */
	_unsetRendererToOperContext: function(renderer)
	{
		renderer.setRedirectContext(null);
	},

	/////////////////////////////////////////////////////////////////////////////

	//////////////////////// methods about bound maps ////////////////////////////
	/**
	 * Returns bound inflation for interaction with a certain pointer device (mouse, touch, etc.)
	 * @param {String} pointerType
	 */
	getInteractionBoundInflation: function(pointerType)
	{
		var cache = this._lengthCaches.interactionBoundInflations;
		var cacheKey = pointerType || 'default';
		if (cache)
		{
			if (cache[cacheKey])
			{
				//console.log('cached!')
				return cache[cacheKey];
			}
		}

		// no cache, calculate
		var iaConfigs = this.getEditorConfigs().getInteractionConfigs();
		var defRatioPropName = 'objBoundTrackInflationRatio';
		var typedRatio, defRatio = iaConfigs.getPropValue(defRatioPropName);
		if (pointerType)
		{
			var sPointerType = pointerType.upperFirst();
			var typedRatioPropName = defRatioPropName + sPointerType;
			if (iaConfigs.hasProperty(typedRatioPropName))
				typedRatio = iaConfigs.getPropValue(typedRatioPropName);
		}
		var actualRatio = typedRatio || defRatio;
		var ratioValue = actualRatio && this.getDefBondScreenLength() * actualRatio;

		var minValuePropName = 'objBoundTrackMinInflation';
		var typedMinValue, defMinValue = iaConfigs.getPropValue(minValuePropName);
		if (pointerType)
		{
			var typedMinValuePropName = minValuePropName + sPointerType;
			if (iaConfigs.hasProperty(typedMinValuePropName))
				typedMinValue = iaConfigs.getPropValue(typedMinValuePropName);
		}
		var actualMinValue = typedMinValue || defMinValue;

		var actualValue = Math.max(ratioValue || 0, actualMinValue);

		// stores to cache
		if (!cache)
		{
			cache = {};
			this._lengthCaches.interactionBoundInflations = cache;
		}
		cache[cacheKey] = actualValue;
		//console.log('to cache');

		return actualValue;
	},
	/** @private */
	clearBoundMap: function()
	{
		this.getBoundInfoRecorder().clear(this.getObjContext());
	},
	/**
	 * Returns topmost bound item in z-index.
	 * Descendants may override this method to implement more accurate algorithm.
	 * @param {Array} boundItems
	 * @param {Array} excludeObjs Objects in this array will not be returned.
	 * @returns {Object}
	 * @private
	 */
	findTopmostBoundInfo: function(boundItems, excludeObjs)
	{
		if (boundItems && boundItems.length)
		{
			var result = null;
			var index = boundItems.length - 1;
			result = boundItems[index];
			while ((index >= 0) && (excludeObjs && (excludeObjs.indexOf(result.obj) >= 0)))
			{
				--index;
				result = boundItems[index];
			}
			return result;
		}
		else
			return null;
	},
	/**
	 * Returns all bound map item at x/y.
	 * Input coord is based on the screen coord system.
	 * @returns {Array}
	 * @private
	 */
	getBoundInfosAtCoord: function(screenCoord, filterFunc, boundInflation)
	{
		/*
		if (!boundInflation)
			throw 'boundInflation not set!';
		*/
		var boundRecorder = this.getBoundInfoRecorder();
		var delta = boundInflation || this.getCurrBoundInflation() || this.getEditorConfigs().getInteractionConfigs().getObjBoundTrackMinInflation();
		//var coord = this.getObjDrawBridge().transformScreenCoordToContext(this.getObjContext(), screenCoord);
		var coord = this.screenCoordToContext(screenCoord);
		var refCoord = (this.getRenderType() === Kekule.Render.RendererType.R3D)? {'x': 0, 'y': 0}: null;
		//console.log(coord, delta);
		var matchedInfos = boundRecorder.getIntersectionInfos(this.getObjContext(), coord, refCoord, delta, filterFunc);
		return matchedInfos;
	},
	/**
	 * returns the topmost bound map item at x/y.
	 * Input coord is based on the screen coord system.
	 * @param {Hash} screenCoord
	 * @param {Array} excludeObjs Objects in this array will not be returned.
	 * @returns {Object}
	 */
	getTopmostBoundInfoAtCoord: function(screenCoord, excludeObjs, boundInflation)
	{
		var enableTrackNearest = this.getEditorConfigs().getInteractionConfigs().getEnableTrackOnNearest();
		if (!enableTrackNearest)
			return this.findTopmostBoundInfo(this.getBoundInfosAtCoord(screenCoord, null, boundInflation), excludeObjs, boundInflation);
		// else, track on nearest
		// new approach, find nearest boundInfo at coord
		var SU = Kekule.Render.MetaShapeUtils;
		var boundInfos = this.getBoundInfosAtCoord(screenCoord, null, boundInflation);
		//var filteredBoundInfos = [];
		var result, lastShapeInfo, lastDistance;
		var setResult = function(boundInfo, shapeInfo, distance)
		{
			result = boundInfo;
			lastShapeInfo = shapeInfo || boundInfo.boundInfo;
			if (Kekule.ObjUtils.notUnset(distance))
				lastDistance = distance;
			else
				lastDistance = SU.getDistance(screenCoord, lastShapeInfo);
		};
		for (var i = boundInfos.length - 1; i >= 0; --i)
		{
			var info = boundInfos[i];
			if (excludeObjs && (excludeObjs.indexOf(info.obj) >= 0))
				continue;
			if (!result)
				setResult(info);
			else
			{
				var shapeInfo = info.boundInfo;
				if (shapeInfo.shapeType < lastShapeInfo.shapeType)
					setResult(info, shapeInfo);
				else if (shapeInfo.shapeType === lastShapeInfo.shapeType)
				{
					var currDistance = SU.getDistance(screenCoord, shapeInfo);
					if (currDistance < lastDistance)
					{
						//console.log('distanceCompare', currDistance, lastDistance);
						setResult(info, shapeInfo, currDistance);
					}
				}
			}
		}
		return result;
	},
	/**
	 * Returns the topmost basic drawn object at coord based on screen system.
	 * @params {Hash} coord
	 * @returns {Object}
	 * @private
	 */
	getTopmostBasicObjectAtCoord: function(screenCoord, boundInflation)
	{
		var boundItem = this.getTopmostBoundInfoAtCoord(screenCoord, null, boundInflation);
		return boundItem? boundItem.obj: null;
	},

	/**
	 * Returns geometry bounds of a obj in editor.
	 * @param {Kekule.ChemObject} obj
	 * @param {Number} boundInflation
	 * @returns {Array}
	 */
	getChemObjBounds: function(obj, boundInflation)
	{
		var bounds = [];
		var infos = this.getBoundInfoRecorder().getBelongedInfos(this.getObjContext(), obj);
		if (infos && infos.length)
		{
			for (var j = 0, k = infos.length; j < k; ++j)
			{
				var info = infos[j];
				var bound = info.boundInfo;
				if (bound)
				{
					// inflate
					bound = Kekule.Render.MetaShapeUtils.inflateShape(bound, boundInflation);
					bounds.push(bound);
				}
			}
		}
		return bounds;
	},

	//////////////////// methods about UI markers ///////////////////////////////
	/**
	 * Notify that currently is modifing UI markers and the editor need not to repaint them.
	 */
	beginUpdateUiMarkers: function()
	{
		--this._uiMarkerUpdateFlag;
	},
	/**
	 * Call this method to indicate the UI marker update process is over and should be immediately updated.
	 */
	endUpdateUiMarkers: function()
	{
		++this._uiMarkerUpdateFlag;
		if (!this.isUpdatingUiMarkers())
			this.repaintUiMarker();
	},
	/** Check if the editor is under continuous UI marker update. */
	isUpdatingUiMarkers: function()
	{
		return (this._uiMarkerUpdateFlag < 0);
	},
	/**
	 * Called when transform has been made to objects and UI markers need to be modified according to it.
	 * The UI markers will also be repainted.
	 * @private
	 */
	recalcUiMarkers: function()
	{
		//this.setHotTrackedObj(null);
		this.beginUpdateUiMarkers();
		try
		{
			this.recalcHotTrackMarker();
			this.recalcSelectionAreaMarker();
		}
		finally
		{
			this.endUpdateUiMarkers();
		}
	},
	/** @private */
	repaintUiMarker: function()
	{
		if (this.isUpdatingUiMarkers())
			return;
		this.clearUiContext();
		var drawParams = this.calcDrawParams();
		this.getUiPainter().draw(this.getUiContext(), drawParams.baseCoord, drawParams.drawOptions);
	},
	/**
	 * Create a new marker based on shapeInfo.
	 * @private
	 */
	createShapeBasedMarker: function(markerPropName, shapeInfo, drawStyles, updateRenderer)
	{
		var marker = new Kekule.ChemWidget.MetaShapeUIMarker();
		if (shapeInfo)
			marker.setShapeInfo(shapeInfo);
		if (drawStyles)
			marker.setDrawStyles(drawStyles);
		this.setPropStoreFieldValue(markerPropName, marker);
		this.getUiMarkers().addMarker(marker);
		if (updateRenderer)
		{
			//var updateType = Kekule.Render.ObjectUpdateType.ADD;
			//this.getUiRenderer().update(this.getUiContext(), this.getUiMarkers(), marker, updateType);
			this.repaintUiMarker();
		}
		return marker;
	},
	/**
	 * Change the shape info of a meta shape based marker, or create a new marker based on shape info.
	 * @private
	 */
	modifyShapeBasedMarker: function(marker, newShapeInfo, drawStyles, updateRenderer)
	{
		var updateType = Kekule.Render.ObjectUpdateType.MODIFY;
		if (newShapeInfo)
			marker.setShapeInfo(newShapeInfo);
		if (drawStyles)
			marker.setDrawStyles(drawStyles);
		// notify change and update renderer
		if (updateRenderer)
		{
			//this.getUiPainter().redraw();
			//this.getUiRenderer().update(this.getUiContext(), this.getUiMarkers(), marker, updateType);
			this.repaintUiMarker();
		}
	},
	/**
	 * Hide a UI marker.
	 * @param marker
	 */
	hideUiMarker: function(marker, updateRenderer)
	{
		marker.setVisible(false);
		// notify change and update renderer
		if (updateRenderer)
		{
			//this.getUiRenderer().update(this.getUiContext(), this.getUiMarkers(), marker, Kekule.Render.ObjectUpdateType.MODIFY);
			this.repaintUiMarker();
		}
	},
	/**
	 * Show an UI marker.
	 * @param marker
	 * @param updateRenderer
	 */
	showUiMarker: function(marker, updateRenderer)
	{
		marker.setVisible(true);
		if (updateRenderer)
		{
			//this.getUiRenderer().update(this.getUiContext(), this.getUiMarkers(), marker, Kekule.Render.ObjectUpdateType.MODIFY);
			this.repaintUiMarker();
		}
	},
	/**
	 * Remove a marker from collection.
	 * @private
	 */
	removeUiMarker: function(marker)
	{
		if (marker)
		{
			this.getUiMarkers().removeMarker(marker);
			//this.getUiRenderer().update(this.getUiContext(), this.getUiMarkers(), marker, Kekule.Render.ObjectUpdateType.REMOVE);
			this.repaintUiMarker();
		}
	},
	/**
	 * Clear all UI markers.
	 * @private
	 */
	clearUiMarkers: function()
	{
		this.getUiMarkers().clearMarkers();
		//this.getUiRenderer().redraw(this.getUiContext());
		//this.redraw();
		this.repaintUiMarker();
	},

	/**
	 * Modify hot track marker to bind to newBoundInfos.
	 * @private
	 */
	changeHotTrackMarkerBounds: function(newBoundInfos)
	{
		var infos = Kekule.ArrayUtils.toArray(newBoundInfos);
		//var updateType = Kekule.Render.ObjectUpdateType.MODIFY;
		var styleConfigs = this.getEditorConfigs().getUiMarkerConfigs();
		var drawStyles = {
			'color': styleConfigs.getHotTrackerColor(),
			'opacity': styleConfigs.getHotTrackerOpacity()
		};
		var inflation = this.getCurrBoundInflation() || this.getEditorConfigs().getInteractionConfigs().getObjBoundTrackMinInflation();
		var bounds = [];
		for (var i = 0, l = infos.length; i < l; ++i)
		{
			var boundInfo = infos[i];
			var bound = inflation? Kekule.Render.MetaShapeUtils.inflateShape(boundInfo, inflation): boundInfo;
			//console.log('inflate', bound);
			if (bound)
				bounds.push(bound);
		}

		var tracker = this.getUiHotTrackMarker();
		//console.log('change hot track', bound, drawStyles);
		tracker.setVisible(true);
		this.modifyShapeBasedMarker(tracker, bounds, drawStyles, true);
		return this;
	},
	/**
	 * Hide hot track marker.
	 * @private
	 */
	hideHotTrackMarker: function()
	{
		var tracker = this.getUiHotTrackMarker();
		if (tracker)
		{
			this.hideUiMarker(tracker, true);
		}
		return this;
	},
	/**
	 * Show hot track marker.
	 * @private
	 */
	showHotTrackMarker: function()
	{
		var tracker = this.getUiHotTrackMarker();
		if (tracker)
		{
			this.showUiMarker(tracker, true);
		}
		return this;
	},

	/////////////////////////////////////////////////////////////////////////////

	// methods about hot track marker
	/**
	 * Try hot track object on coord.
	 * @param {Hash} screenCoord Coord based on screen system.
	 */
	hotTrackOnCoord: function(screenCoord)
	{
		if (this.getEditorConfigs().getInteractionConfigs().getEnableHotTrack())
		{
			/*
			var boundItem = this.getTopmostBoundInfoAtCoord(screenCoord);
			if (boundItem)  // mouse move into object
			{
				var obj = boundItem.obj;
				if (obj)
					this.setHotTrackedObj(obj);
				//this.changeHotTrackMarkerBound(boundItem.boundInfo);
			}
			else  // mouse move out from object
			{
				this.setHotTrackedObj(null);
			}
			*/
			//console.log('hot track here');
			this.setHotTrackedObj(this.getTopmostBasicObjectAtCoord(screenCoord, this.getCurrBoundInflation()));
		}
		return this;
	},
	/**
	 * Hot try on a basic drawn object.
	 * @param {Object}  obj
	 */
	hotTrackOnObj: function(obj)
	{
		this.setHotTrackedObj(obj);
		return this;
	},
	/**
	 * Remove all hot track markers.
	 * @param {Bool} doNotClearHotTrackedObjs If false, the hotTrackedObjs property will also be set to empty.
	 */
	hideHotTrack: function(doNotClearHotTrackedObjs)
	{
		this.hideHotTrackMarker();
		if (!doNotClearHotTrackedObjs)
			this.clearHotTrackedObjs();
		return this;
	},
	/**
	 * Set hot tracked objects to empty.
	 */
	clearHotTrackedObjs: function()
	{
		this.setHotTrackedObjs([]);
	},
	/**
	 * Add a obj to hot tracked objects.
	 * @param {Object} obj
	 */
	addHotTrackedObj: function(obj)
	{
		var olds = this.getHotTrackedObjs() || [];
		Kekule.ArrayUtils.pushUnique(olds, obj);
		this.setHotTrackedObjs(olds);
		return this;
	},

	/** @private */
	recalcHotTrackMarker: function()
	{
		this.setHotTrackedObjs(this.getHotTrackedObjs());
	},

	// methods about selecting marker
	/**
	 * Modify hot track marker to bind to newBoundInfo.
	 * @private
	 */
	changeSelectionAreaMarkerBound: function(newBoundInfo, drawStyles)
	{
		var styleConfigs = this.getEditorConfigs().getUiMarkerConfigs();
		if (!drawStyles)
			drawStyles = {
				'strokeColor': styleConfigs.getSelectionMarkerStrokeColor(),
				'strokeWidth': styleConfigs.getSelectionMarkerStrokeWidth(),
				'fillColor': styleConfigs.getSelectionMarkerFillColor(),
				'opacity': styleConfigs.getSelectionMarkerOpacity()
			};
		//console.log(drawStyles);
		var marker = this.getUiSelectionAreaMarker();
		if (marker)
		{
			marker.setVisible(true);
			this.modifyShapeBasedMarker(marker, newBoundInfo, drawStyles, true);
		}
		return this;
	},
	/** @private */
	hideSelectionAreaMarker: function()
	{
		var marker = this.getUiSelectionAreaMarker();
		if (marker)
		{
			this.hideUiMarker(marker, true);
		}
	},
	/** @private */
	showSelectionAreaMarker: function()
	{
		var marker = this.getUiSelectionAreaMarker();
		if (marker)
		{
			this.showUiMarker(marker, true);
		}
	},

	/**
	 * Recalculate and repaint selection marker.
	 * @private
	 */
	recalcSelectionAreaMarker: function(doRepaint)
	{
		this.beginUpdateUiMarkers();
		try
		{
			// debug
			var selection = this.getSelection();
			var count = selection.length;
			if (count <= 0)
				this.hideSelectionAreaMarker();
			else
			{
				var bounds = [];
				var containerBox = null;
				var inflation = this.getEditorConfigs().getInteractionConfigs().getSelectionMarkerInflation();

				for (var i = 0; i < count; ++i)
				{
					var obj = selection[i];
					var infos = this.getBoundInfoRecorder().getBelongedInfos(this.getObjContext(), obj);
					if (infos && infos.length)
					{
						for (var j = 0, k = infos.length; j < k; ++j)
						{
							var info = infos[j];
							var bound = info.boundInfo;
							if (bound)
							{
								// inflate
								bound = Kekule.Render.MetaShapeUtils.inflateShape(bound, inflation);
								bounds.push(bound);
								var box = Kekule.Render.MetaShapeUtils.getContainerBox(bound);
								containerBox = containerBox? Kekule.BoxUtils.getContainerBox(containerBox, box): box;
							}
						}
					}
				}

				//var containerBox = this.getSelectionContainerBox(inflation);

				this.setUiSelectionAreaContainerBox(containerBox);

				// container box
				if (containerBox)
				{
					var containerShape = Kekule.Render.MetaShapeUtils.createShapeInfo(
						Kekule.Render.MetaShapeType.RECT,
						[{'x': containerBox.x1, 'y': containerBox.y1}, {'x': containerBox.x2, 'y': containerBox.y2}]
					);
					bounds.push(containerShape);
				}
				else  // containerBox disappear, may be a node or connector merge, hide selection area
					this.hideSelectionAreaMarker();

				//console.log(bounds.length, bounds);
				if (bounds.length)
					this.changeSelectionAreaMarkerBound(bounds);
			}
		}
		finally
		{
			this.endUpdateUiMarkers();
		}
	},
	/** @private */
	_highlightSelectionAreaMarker: function()
	{
		var styleConfigs = this.getEditorConfigs().getUiMarkerConfigs();
		var highlightStyles = {
			'strokeColor': styleConfigs.getSelectionMarkerStrokeColor(),
			'strokeWidth': styleConfigs.getSelectionMarkerStrokeWidth(),
			'fillColor': styleConfigs.getSelectionMarkerFillColor(),
			'opacity': styleConfigs.getSelectionMarkerEmphasisOpacity()
		};
		this.changeSelectionAreaMarkerBound(null, highlightStyles);  // change draw styles without the modification of bound
	},
	/** @private */
	_restoreSelectionAreaMarker: function()
	{
		var styleConfigs = this.getEditorConfigs().getUiMarkerConfigs();
		var highlightStyles = {
			'strokeColor': styleConfigs.getSelectionMarkerStrokeColor(),
			'strokeWidth': styleConfigs.getSelectionMarkerStrokeWidth(),
			'fillColor': styleConfigs.getSelectionMarkerFillColor(),
			'opacity': styleConfigs.getSelectionMarkerOpacity()
		};
		this.changeSelectionAreaMarkerBound(null, highlightStyles);  // change draw styles without the modification of bound
	},
	/**
	 * Pulse selection marker several times to get the attention of user.
	 * @param {Int} duration Duration of the whole process, in ms.
	 * @param {Int} pulseCount The times of highlighting marker.
	 */
	pulseSelectionAreaMarker: function(duration, pulseCount)
	{
		if (this.getUiSelectionAreaMarker())
		{
			if (!duration)
				duration = this.getEditorConfigs().getInteractionConfigs().getSelectionMarkerDefPulseDuration() || 0;
			if (!pulseCount)
				pulseCount = this.getEditorConfigs().getInteractionConfigs().getSelectionMarkerDefPulseCount() || 1;
			if (!duration)
				return;

			var interval = duration / pulseCount;
			this.doPulseSelectionAreaMarker(interval, pulseCount);
		}
		return this;
	},
	/** @private */
	doPulseSelectionAreaMarker: function(interval, pulseCount)
	{
		this._highlightSelectionAreaMarker();
		//if (pulseCount <= 1)
		setTimeout(this._restoreSelectionAreaMarker.bind(this), interval);
		if (pulseCount > 1)
			setTimeout(this.doPulseSelectionAreaMarker.bind(this, interval, pulseCount - 1), interval * 2);
	},


	///////////////////////// Methods about selecting region ////////////////////////////////////
	/**
	 * Start a selecting operation from coord.
	 * @param {Hash} coord
	 * @param {Bool} toggleFlag If true, the selecting region will toggle selecting state inside it rather than select them directly.
	 */
	startSelecting: function(screenCoord, toggleFlag)
	{
		if (toggleFlag === undefined)
			toggleFlag = this.getIsToggleSelectOn();

		if (!toggleFlag)
			this.deselectAll();

		var M = Kekule.Editor.SelectMode;
		var mode = this.getSelectMode();
		this._currSelectMode = mode;

		return (mode === M.POLYLINE || mode === M.POLYGON)?
				this.startSelectingCurveDrag(screenCoord, toggleFlag):
				this.startSelectingBoxDrag(screenCoord, toggleFlag);
	},
	/**
	 * Add a new anchor coord of selecting region.
	 * This method is called when pointer device moving in selecting.
	 * @param {Hash} screenCoord
	 */
	addSelectingAnchorCoord: function(screenCoord)
	{
		var M = Kekule.Editor.SelectMode;
		var mode = this._currSelectMode;
		return (mode === M.POLYLINE || mode === M.POLYGON)?
				this.dragSelectingCurveToCoord(screenCoord):
				this.dragSelectingBoxToCoord(screenCoord);
	},
	/**
	 * Selecting operation end.
	 * @param {Hash} coord
	 * @param {Bool} toggleFlag If true, the selecting region will toggle selecting state inside it rather than select them directly.
	 */
	endSelecting: function(screenCoord, toggleFlag)
	{
		if (toggleFlag === undefined)
			toggleFlag = this.getIsToggleSelectOn();

		var M = Kekule.Editor.SelectMode;
		var mode = this._currSelectMode;
		var enablePartial = this.getEditorConfigs().getInteractionConfigs().getEnablePartialAreaSelecting();
		var objs;
		if (mode === M.POLYLINE || mode === M.POLYGON)
		{
			var polygonCoords = this._selectingCurveCoords;
			// simplify the polygon first
			var threshold = this.getEditorConfigs().getInteractionConfigs().getSelectingCurveSimplificationDistanceThreshold();
			var simpilfiedCoords = Kekule.GeometryUtils.simplifyCurveToLineSegments(polygonCoords, threshold);
			//console.log('simplify selection', polygonCoords.length, simpilfiedCoords.length);

			this.endSelectingCurveDrag(screenCoord, toggleFlag);

			if (mode === M.POLYLINE)
			{
				var lineWidth = this.getEditorConfigs().getInteractionConfigs().getSelectingBrushWidth();
				objs = this.getObjectsIntersetExtendedPolyline(simpilfiedCoords, lineWidth);
			}
			else  // if (mode === M.POLYGON)
			{
				objs = this.getObjectsInPolygon(simpilfiedCoords, enablePartial);
				this.endSelectingCurveDrag(screenCoord, toggleFlag);
			}
		}
		else // M.RECT or M.ANCESTOR
		{
			var startCoord = this._selectingBoxStartCoord;
			var box = Kekule.BoxUtils.createBox(startCoord, screenCoord);
			objs = this.getObjectsInScreenBox(box, enablePartial);
			this.endSelectingBoxDrag(screenCoord, toggleFlag);
		}
		/*
		if (objs && objs.length)
		{
			if (this._isInAncestorSelectMode())  // need to change to select standalone ancestors
			{
				objs = this._getAllStandaloneAncestorObjs(objs);  // get standalone ancestors (e.g. molecule)
				//objs = this._getAllCoordDependantObjs(objs);  // but select there coord dependant children (e.g. atoms and bonds)
			}
			if (toggleFlag)
				this.toggleSelectingState(objs);
			else
				this.select(objs);
		}
		*/
		objs = this._getActualSelectedObjsInSelecting(objs);
		if (toggleFlag)
			this.toggleSelectingState(objs);
		else
			this.select(objs);
		this.hideSelectingMarker();
	},
	/**
	 * Cancel current selecting operation.
	 */
	cancelSelecting: function()
	{
		this.hideSelectingMarker();
	},

	/** @private */
	_getActualSelectedObjsInSelecting: function(objs)
	{
		if (objs && objs.length)
		{
			if (this._isInAncestorSelectMode())  // need to change to select standalone ancestors
			{
				objs = this._getAllStandaloneAncestorObjs(objs);  // get standalone ancestors (e.g. molecule)
				//objs = this._getAllCoordDependantObjs(objs);  // but select there coord dependant children (e.g. atoms and bonds)
			}
			return objs;
		}
		else
			return [];
	},
	/** @private */
	_isInAncestorSelectMode: function()
	{
		return this.getSelectMode() === Kekule.Editor.SelectMode.ANCESTOR;
	},
	/** @private */
	_getAllStandaloneAncestorObjs: function(objs)
	{
		var result = [];
		for (var i = 0, l = objs.length; i < l; ++i)
		{
			var obj = objs[i];
			if (obj && obj.getStandaloneAncestor)
				obj = obj.getStandaloneAncestor();
			AU.pushUnique(result, obj);
		}
		return result;
	},
	/* @private */
	/*
	_getAllCoordDependantObjs: function(objs)
	{
		var result = [];
		for (var i = 0, l = objs.length; i < l; ++i)
		{
			var obj = objs[i];
			if (obj && obj.getCoordDependentObjects)
				AU.pushUnique(result, obj.getCoordDependentObjects());
		}
		return result;
	},
	*/

	/**
	 * Start to drag a selecting box from coord.
	 * @param {Hash} coord
	 * @param {Bool} toggleFlag If true, the box will toggle selecting state inside it rather than select them directly.
	 */
	startSelectingBoxDrag: function(screenCoord, toggleFlag)
	{
		//this.setInteractionStartCoord(screenCoord);
		this._selectingBoxStartCoord = screenCoord;
		/*
		if (!toggleFlag)
			this.deselectAll();
		*/
		//this.setEditorState(Kekule.Editor.EditorState.SELECTING);
	},
	/**
	 * Drag selecting box to a new coord.
	 * @param {Hash} screenCoord
	 */
	dragSelectingBoxToCoord: function(screenCoord)
	{
		//var startCoord = this.getInteractionStartCoord();
		var startCoord = this._selectingBoxStartCoord;
		var endCoord = screenCoord;
		this.changeSelectingMarkerBox(startCoord, endCoord);
	},
	/**
	 * Selecting box drag end.
	 * @param {Hash} coord
	 * @param {Bool} toggleFlag If true, the box will toggle selecting state inside it rather than select them directly.
	 */
	endSelectingBoxDrag: function(screenCoord, toggleFlag)
	{
		//var startCoord = this.getInteractionStartCoord();
		var startCoord = this._selectingBoxStartCoord;
		//this.setInteractionEndCoord(coord);
		this._selectingBoxEndCoord = screenCoord;
		/*
		var box = Kekule.BoxUtils.createBox(startCoord, screenCoord);
		var enablePartial = this.getEditorConfigs().getInteractionConfigs().getEnablePartialAreaSelecting();
		if (toggleFlag)
			this.toggleSelectingStateOfObjectsInScreenBox(box, enablePartial);
		else
			this.selectObjectsInScreenBox(box, enablePartial);
		this.hideSelectingMarker();
		*/
	},

	/**
	 * Start to drag a selecting curve from coord.
	 * @param {Hash} coord
	 * @param {Bool} toggleFlag If true, the box will toggle selecting state inside it rather than select them directly.
	 */
	startSelectingCurveDrag: function(screenCoord, toggleFlag)
	{
		//this.setInteractionStartCoord(screenCoord);
		this._selectingCurveCoords = [screenCoord];
		//this.setEditorState(Kekule.Editor.EditorState.SELECTING);
	},
	/**
	 * Drag selecting curve to a new coord.
	 * @param {Hash} screenCoord
	 */
	dragSelectingCurveToCoord: function(screenCoord)
	{
		//var startCoord = this.getInteractionStartCoord();
		this._selectingCurveCoords.push(screenCoord);
		this.changeSelectingMarkerCurve(this._selectingCurveCoords, this._currSelectMode === Kekule.Editor.SelectMode.POLYGON);
	},
	/**
	 * Selecting curve drag end.
	 * @param {Hash} coord
	 * @param {Bool} toggleFlag If true, the box will toggle selecting state inside it rather than select them directly.
	 */
	endSelectingCurveDrag: function(screenCoord, toggleFlag)
	{
		this._selectingCurveCoords.push(screenCoord);

		/*
		var box = Kekule.BoxUtils.createBox(startCoord, screenCoord);
		var enablePartial = this.getEditorConfigs().getInteractionConfigs().getEnablePartialAreaSelecting();
		if (toggleFlag)
			this.toggleSelectingStateOfObjectsInScreenBox(box, enablePartial);
		else
			this.selectObjectsInScreenBox(box, enablePartial);
		this.hideSelectingMarker();
		*/
	},

	/**
	 * Try select a object on coord directly.
	 * @param {Hash} coord
	 * @param {Bool} toggleFlag If true, the box will toggle selecting state inside it rather than select them directly.
	 */
	selectOnCoord: function(coord, toggleFlag)
	{
		if (toggleFlag === undefined)
			toggleFlag = this.getIsToggleSelectOn();
		//console.log('select on coord');
		var obj = this.getTopmostBasicObjectAtCoord(coord, this.getCurrBoundInflation());
		if (obj)
		{
			var objs = this._getActualSelectedObjsInSelecting([obj]);
			if (objs)
			{
				if (toggleFlag)
					this.toggleSelectingState(objs);
				else
					this.select(objs);
			}
		}
	},

	// about selection area marker
	/**
	 * Modify hot track marker to bind to newBoundInfo.
	 * @private
	 */
	changeSelectingMarkerBound: function(newBoundInfo, drawStyles)
	{
		var styleConfigs = this.getEditorConfigs().getUiMarkerConfigs();
		if (!drawStyles)  // use the default one
			drawStyles = {
				'strokeColor': styleConfigs.getSelectingMarkerStrokeColor(),
				'strokeWidth': styleConfigs.getSelectingMarkerStrokeWidth(),
				'strokeDash':  styleConfigs.getSelectingMarkerStrokeDash(),
				'fillColor': styleConfigs.getSelectingMarkerFillColor(),
				'opacity': styleConfigs.getSelectingMarkerOpacity()
			};
		var marker = this.getUiSelectingMarker();
		marker.setVisible(true);
		//console.log('change hot track', bound, drawStyles);
		this.modifyShapeBasedMarker(marker, newBoundInfo, drawStyles, true);
		return this;
	},
	changeSelectingMarkerCurve: function(screenCoords, isPolygon)
	{
		var ctxCoords = [];
		for (var i = 0, l = screenCoords.length - 1; i < l; ++i)
		{
			ctxCoords.push(this.screenCoordToContext(screenCoords[i]));
		}
		var shapeInfo = Kekule.Render.MetaShapeUtils.createShapeInfo(
				isPolygon? Kekule.Render.MetaShapeType.POLYGON: Kekule.Render.MetaShapeType.POLYLINE,
				ctxCoords
		);
		var drawStyle;
		if (!isPolygon)
		{
			var styleConfigs = this.getEditorConfigs().getUiMarkerConfigs();
			drawStyle = {
				'strokeColor': styleConfigs.getSelectingBrushMarkerStrokeColor(),
				'strokeWidth': this.getEditorConfigs().getInteractionConfigs().getSelectingBrushWidth(),
				'strokeDash':  styleConfigs.getSelectingBrushMarkerStrokeDash(),
				//'fillColor': styleConfigs.getSelectingMarkerFillColor(),
				'lineCap': styleConfigs.getSelectingBrushMarkerStrokeLineCap(),
				'lineJoin': styleConfigs.getSelectingBrushMarkerStrokeLineJoin(),
				'opacity': styleConfigs.getSelectingBrushMarkerOpacity()
			};
		}
		return this.changeSelectingMarkerBound(shapeInfo, drawStyle);
	},
	/**
	 * Change the rect box of selection marker.
	 * Coord is based on screen system.
	 * @private
	 */
	changeSelectingMarkerBox: function(screenCoord1, screenCoord2)
	{
		//var coord1 = this.getObjDrawBridge().transformScreenCoordToContext(this.getObjContext(), screenCoord1);
		//var coord2 = this.getObjDrawBridge().transformScreenCoordToContext(this.getObjContext(), screenCoord2);
		var coord1 = this.screenCoordToContext(screenCoord1);
		var coord2 = this.screenCoordToContext(screenCoord2);
		var shapeInfo = Kekule.Render.MetaShapeUtils.createShapeInfo(
			Kekule.Render.MetaShapeType.RECT,
			[{'x': Math.min(coord1.x, coord2.x), 'y': Math.min(coord1.y, coord2.y)},
				{'x': Math.max(coord1.x, coord2.x), 'y': Math.max(coord1.y, coord2.y)}]
		);
		return this.changeSelectingMarkerBound(shapeInfo);
	},
	/** @private */
	hideSelectingMarker: function()
	{
		var marker = this.getUiSelectingMarker();
		if (marker)
		{
			this.hideUiMarker(marker, true);
		}
	},
	/** @private */
	showSelectingMarker: function()
	{
		var marker = this.getUiSelectingMarker();
		if (marker)
		{
			this.showUiMarker(marker, true);
		}
	},


	// methods about selection marker
	/**
	 * Returns the region of screenCoord relative to selection marker.
	 * @private
	 */
	getCoordRegionInSelectionMarker: function(screenCoord, edgeInflation)
	{
		var R = Kekule.Editor.BoxRegion;
		var CU = Kekule.CoordUtils;
		var coord = this.screenCoordToContext(screenCoord);
		var marker = this.getUiSelectionAreaMarker();
		if (marker && marker.getVisible())
		{
			var box = this.getUiSelectionAreaContainerBox();

			if (Kekule.ObjUtils.isUnset(edgeInflation))
				edgeInflation = this.getEditorConfigs().getInteractionConfigs().getSelectionMarkerEdgeInflation();
			var halfInf = (edgeInflation / 2) || 0;
			var coord1 = CU.substract({'x': box.x1, 'y': box.y1}, {'x': halfInf, 'y': halfInf});
			var coord2 = CU.add({'x': box.x2, 'y': box.y2}, {'x': halfInf, 'y': halfInf});

			if ((coord.x < coord1.x) || (coord.y < coord1.y) || (coord.x > coord2.x) || (coord.y > coord2.y))
				return R.OUTSIDE;

			//coord2 = CU.substract(coord2, coord1);
			var delta1 = CU.substract(coord, coord1);
			var delta2 = CU.substract(coord2, coord);

			var dx1 = delta1.x;
			var dx2 = delta2.x;
			var dy1 = delta1.y;
			var dy2 = delta2.y;

			if (dy1 < dy2)  // on top half
			{
				if (dx1 < dx2)  // on left part
				{
					if (dy1 <= edgeInflation)
						return (dx1 <= edgeInflation)? R.CORNER_TL: R.EDGE_TOP;
					else if (dx1 <= edgeInflation)
						return R.EDGE_LEFT;
					else
						return R.INSIDE;
				}
				else  // on right part
				{
					if (dy1 <= edgeInflation)
						return (dx2 <= edgeInflation)? R.CORNER_TR: R.EDGE_TOP;
					else if (dx2 <= edgeInflation)
						return R.EDGE_RIGHT;
					else
						return R.INSIDE;
				}
			}
			else  // on bottom half
			{
				if (dx1 < dx2)  // on left part
				{
					if (dy2 <= edgeInflation)
						return (dx1 <= edgeInflation)? R.CORNER_BL: R.EDGE_BOTTOM;
					else if (dx1 <= edgeInflation)
						return R.EDGE_LEFT;
					else
						return R.INSIDE;
				}
				else  // on right part
				{
					if (dy2 <= edgeInflation)
						return (dx2 <= edgeInflation)? R.CORNER_BR: R.EDGE_BOTTOM;
					else if (dx2 <= edgeInflation)
						return R.EDGE_RIGHT;
					else
						return R.INSIDE;
				}
			}
		}
		return R.OUTSIDE;
	},

	/**
	 * Check if a point coord based on screen inside selection marker.
	 * @private
	 */
	isCoordInSelectionMarkerBound: function(screenCoord)
	{
		/*
		//var coord = this.getObjDrawBridge().transformScreenCoordToContext(this.getObjContext(), screenCoord);
		var coord = this.screenCoordToContext(screenCoord);
		var marker = this.getUiSelectionAreaMarker();
		if (marker && marker.getVisible())
		{
			var shapeInfo = marker.getShapeInfo();
			return shapeInfo? Kekule.Render.MetaShapeUtils.isCoordInside(coord, shapeInfo): false;
		}
		else
			return false;
		*/
		return (this.getCoordRegionInSelectionMarker(screenCoord) !== Kekule.Editor.BoxRegion.OUTSIDE);
	},



	//////////////////////////////////////////////////////////////////////////////


	///////////////////////  methods about selection ////////////////////////////

	/**
	 * Returns override render options that need to be applied to each selected objects.
	 * Descendants should override this method.
	 * @returns {Hash}
	 * @private
	 */
	getObjSelectedRenderOptions: function()
	{
		// debug
		/*
		if (!this._selectedRenderOptions)
			this._selectedRenderOptions = {'color': '#000055', 'strokeWidth': 2, 'atomRadius': 5};
		*/
		return this._selectedRenderOptions;
	},
	/**
	 * Returns method to add render option override item of chemObj.
	 * In 2D render mode, this method should returns chemObj.addOverrideRenderOptionItem,
	 * in 3D render mode, this method should returns chemObj.addOverrideRender3DOptionItem.
	 * @private
	 */
	_getObjRenderOptionItemAppendMethod: function(chemObj)
	{
		return (this.getRenderType() === Kekule.Render.RendererType.R3D)?
			chemObj.addOverrideRender3DOptionItem:
			chemObj.addOverrideRenderOptionItem;
	},
	/**
	 * Returns method to remove render option override item of chemObj.
	 * In 2D render mode, this method should returns chemObj.removeOverrideRenderOptionItem,
	 * in 3D render mode, this method should returns chemObj.removeOverrideRender3DOptionItem.
	 * @private
	 */
	_getObjRenderOptionItemRemoveMethod: function(chemObj)
	{
		return (this.getRenderType() === Kekule.Render.RendererType.R3D )?
			chemObj.removeOverrideRender3DOptionItem:
			chemObj.removeOverrideRenderOptionItem;
	},
	/** @private */
	_addSelectRenderOptions: function(chemObj)
	{
		var selOps = this.getObjSelectedRenderOptions();
		if (selOps)
		{
			//console.log('_addSelectRenderOptions', chemObj);
			var method = this._getObjRenderOptionItemAppendMethod(chemObj);
			//if (!method)
			//console.log(chemObj.getClassName());
			return method.apply(chemObj, [selOps]);
		}
		else
			return null;
	},
	/** @private */
	_removeSelectRenderOptions: function(chemObj)
	{
		var selOps = this.getObjSelectedRenderOptions();
		if (selOps)
		{
			//console.log('_removeSelectRenderOptions', chemObj);
			var method = this._getObjRenderOptionItemRemoveMethod(chemObj);
			return method.apply(chemObj, [this.getObjSelectedRenderOptions()]);
		}
		else
			return null;
	},

	/** Notify that a continuous selection update is underway. UI need not to be changed. */
	beginUpdateSelection: function()
	{
		this.beginUpdateObject();
		--this._objSelectFlag;
	},
	/** Notify that a continuous selection update is done. UI need to be changed. */
	endUpdateSelection: function()
	{
		++this._objSelectFlag;
		if (this._objSelectFlag >= 0)
		{
			this.selectionChanged();
		}
		this.endUpdateObject();
	},
	/** Check if the editor is under continuous selection update. */
	isUpdatingSelection: function()
	{
		return (this._objSelectFlag < 0);
	},
	/**
	 * Notify selection is changed or object in selection has changed.
	 * @private
	 */
	selectionChanged: function()
	{
		/*
		var selection = this.getSelection();
		if (selection && selection.length)  // at least one selected object
		{
			var obj, boundItem, bound, box;
			var containBox;
			// calc out bound box to contain all selected objects
			for (var i = 0, l = selection.length; i < l; ++i)
			{
				obj = selection[i];
				boundItem = this.findBoundMapItem(obj);
				if (boundItem)
				{
					bound = boundItem.boundInfo;
					if (bound)
					{
						box = Kekule.Render.MetaShapeUtils.getContainerBox(bound);
						if (box)
						{
							if (!containBox)
								containBox = box;
							else
								containBox = Kekule.BoxUtils.getContainerBox(containBox, box);
						}
					}
				}
			}
			if (containBox)
			{
				var inflation = this.getEditorConfigs().getInteractionConfigs().getSelectionMarkerInflation() || 0;
				if (inflation)
					containBox = Kekule.BoxUtils.inflateBox(containBox, inflation);
				this.changeSelectionMarkerBox(containBox);
			}
			else  // no selected
				this.removeSelectionMarker();
		}
		else  // no selected
		{
			this.removeSelectionMarker();
		}
		*/
		if (!this.isUpdatingSelection())
		{
			this.notifyPropSet('selection', this.getSelection());
			this.invokeEvent('selectionChange');
			return this.doSelectionChanged();
		}
	},
	/**
	 * Do actual work of method selectionChanged.
	 * Descendants may override this method.
	 */
	doSelectionChanged: function()
	{
		this.recalcSelectionAreaMarker();
	},

	/**
	 * Check if an object is in selection.
	 * @param {Kekule.ChemObject} obj
	 * @returns {Bool}
	 */
	isInSelection: function(obj)
	{
		return this.getSelection().indexOf(obj) >= 0;
	},
	/**
	 * Add an object to selection.
	 * Descendants can override this method.
	 * @param {Kekule.ChemObject} obj
	 */
	addObjToSelection: function(obj)
	{
		var selection = this.getSelection();
		Kekule.ArrayUtils.pushUnique(selection, obj.getNearestSelectableObject());
		this._addSelectRenderOptions(obj);
		this.selectionChanged();
		return this;
	},
	/**
	 * Remove an object (and all its child objects) from selection.
	 * Descendants can override this method.
	 * @param {Kekule.ChemObject} obj
	 */
	removeObjFromSelection: function(obj, doNotNotifySelectionChange)
	{
		var selection = this.getSelection();
		var relObj = obj.getNearestSelectableObject && obj.getNearestSelectableObject();
		if (relObj === obj)
			relObj === null;
		Kekule.ArrayUtils.remove(selection, obj);
		this._removeSelectRenderOptions(obj);
		if (relObj)
		{
			Kekule.ArrayUtils.remove(selection, relObj);
			this._removeSelectRenderOptions(relObj);
		}
		// remove possible child objects
		for (var i = selection.length - 1; i >= 0; --i)
		{
			var remainObj = selection[i];
			if (remainObj.isChildOf && (remainObj.isChildOf(obj) || (relObj && remainObj.isChildOf(relObj))))
				this.removeObjFromSelection(remainObj, true);
		}
		if (!doNotNotifySelectionChange)
			this.selectionChanged();
		return this;
	},
	/**
	 * Deselect all objects in selection
	 */
	deselectAll: function()
	{
		var selection = this.getSelection();
		return this.removeFromSelection(selection);
	},
	/**
	 * Make a obj or set of objs be selected.
	 * @param {Variant} objs A object or an array of objects.
	 */
	select: function(objs)
	{
		this.beginUpdateSelection();
		try
		{
			this.deselectAll();
			this.addToSelection(objs);
		}
		finally
		{
			//console.log(this.getPainter().getRenderer().getClassName(), this.getPainter().getRenderer().getRenderCache(this.getDrawContext()));
			this.endUpdateSelection();
		}
		return this;
	},
	/**
	 * Add object or an array of objects to selection.
	 * @param {Variant} param A object or an array of objects.
	 */
	addToSelection: function(param)
	{
		if (!param)
			return;
		var objs = DataType.isArrayValue(param)? param: [param];
		this.beginUpdateSelection();
		try
		{
			for (var i = 0, l = objs.length; i < l; ++i)
			{
				this.addObjToSelection(objs[i]);
			}
		}
		finally
		{
			this.endUpdateSelection();
		}
		return this;
	},
	/**
	 * Remove object or an array of objects from selection.
	 * @param {Variant} param A object or an array of objects.
	 */
	removeFromSelection: function(param)
	{
		if (!param)
			return;
		var objs = DataType.isArrayValue(param)? param: [param];
		this.beginUpdateSelection();
		try
		{
			for (var i = objs.length - 1; i >= 0; --i)
			{
				this.removeObjFromSelection(objs[i]);
			}
		}
		finally
		{
			this.endUpdateSelection();
		}
		return this;
	},

	/**
	 * Toggle selection state of object or an array of objects.
	 * @param {Variant} param A object or an array of objects.
	 */
	toggleSelectingState: function(param)
	{
		if (!param)
			return;
		var objs = DataType.isArrayValue(param)? param: [param];
		this.beginUpdateSelection();
		try
		{
			for (var i = 0, l = objs.length; i < l; ++i)
			{
				var obj = objs[i];
				var relObj = obj.getNearestSelectableObject && obj.getNearestSelectableObject();
				if (this.isInSelection(obj))
					this.removeObjFromSelection(obj);
				else if (relObj && this.isInSelection(relObj))
					this.removeObjFromSelection(relObj);
				else
					this.addObjToSelection(obj);
			}
		}
		finally
		{
			this.endUpdateSelection();
		}
		return this;
	},

	/**
	 * Check if there is objects selected currently.
	 * @returns {Bool}
	 */
	hasSelection: function()
	{
		return !!this.getSelection().length;
	},

	/**
	 * Delete and free all selected objects.
	 */
	deleteSelectedObjs: function()
	{
		// TODO: unfinished
	},

	/**
	 * Get all objects interset a polyline defined by a set of screen coords.
	 * Here Object partial in the polyline width range will also be put in result.
	 * @param {Array} polylineScreenCoords
	 * @param {Number} lineWidth
	 * @returns {Array} All interseting objects.
	 */
	getObjectsIntersetExtendedPolyline: function(polylineScreenCoords, lineWidth)
	{
		var ctxCoords = [];
		for (var i = 0, l = polylineScreenCoords.length; i < l; ++i)
		{
			ctxCoords.push(this.screenCoordToContext(polylineScreenCoords[i]));
		}

		var objs = [];
		var boundInfos = this.getBoundInfoRecorder().getAllRecordedInfoOfContext(this.getObjContext());
		var compareFunc = Kekule.Render.MetaShapeUtils.isIntersectingPolyline;
		for (var i = 0, l = boundInfos.length; i < l; ++i)
		{
			var boundInfo = boundInfos[i];
			var shapeInfo = boundInfo.boundInfo;
			/*
			 if (!shapeInfo)
			 console.log(boundInfo);
			 */
			if (shapeInfo)
				if (compareFunc(shapeInfo, ctxCoords, lineWidth))
					objs.push(boundInfo.obj);
		}
		//console.log('selected', objs);
		return objs;
	},
	/**
	 * Get all objects inside a polygon defined by a set of screen coords.
	 * @param {Array} polygonScreenCoords
	 * @param {Bool} allowPartialAreaSelecting If this value is true, object partial in the box will also be selected.
	 * @returns {Array} All inside objects.
	 */
	getObjectsInPolygon: function(polygonScreenCoords, allowPartialAreaSelecting)
	{
		var ctxCoords = [];
		for (var i = 0, l = polygonScreenCoords.length; i < l; ++i)
		{
			ctxCoords.push(this.screenCoordToContext(polygonScreenCoords[i]));
		}

		var objs = [];
		var boundInfos = this.getBoundInfoRecorder().getAllRecordedInfoOfContext(this.getObjContext());
		var compareFunc = allowPartialAreaSelecting? Kekule.Render.MetaShapeUtils.isIntersectingPolygon: Kekule.Render.MetaShapeUtils.isInsidePolygon;
		for (var i = 0, l = boundInfos.length; i < l; ++i)
		{
			var boundInfo = boundInfos[i];
			var shapeInfo = boundInfo.boundInfo;
			/*
			 if (!shapeInfo)
			 console.log(boundInfo);
			 */
			if (shapeInfo)
				if (compareFunc(shapeInfo, ctxCoords))
					objs.push(boundInfo.obj);
		}
		//console.log('selected', objs);
		return objs;
	},

	/**
	 * Get all objects inside a screen box.
	 * @param {Hash} screenBox
	 * @param {Bool} allowPartialAreaSelecting If this value is true, object partial in the box will also be selected.
	 * @returns {Array} All inside objects.
	 */
	getObjectsInScreenBox: function(screenBox, allowPartialAreaSelecting)
	{
		var box = this.screenBoxToContext(screenBox);
		var objs = [];
		var boundInfos = this.getBoundInfoRecorder().getAllRecordedInfoOfContext(this.getObjContext());
		var compareFunc = allowPartialAreaSelecting? Kekule.Render.MetaShapeUtils.isIntersectingBox: Kekule.Render.MetaShapeUtils.isInsideBox;
		for (var i = 0, l = boundInfos.length; i < l; ++i)
		{
			var boundInfo = boundInfos[i];
			var shapeInfo = boundInfo.boundInfo;
			/*
			if (!shapeInfo)
				console.log(boundInfo);
			*/
			if (shapeInfo)
				if (compareFunc(shapeInfo, box))
					objs.push(boundInfo.obj);
		}
		//console.log('selected', objs);
		return objs;
	},

	/**
	 * Select all objects inside a screen box.
	 * @param {Hash} box
	 * @param {Bool} allowPartialAreaSelecting If this value is true, object partial in the box will also be selected.
	 * @returns {Array} All inside objects.
	 */
	selectObjectsInScreenBox: function(screenBox, allowPartialAreaSelecting)
	{
		var objs = this.getObjectsInScreenBox(screenBox, allowPartialAreaSelecting);
		if (objs && objs.length)
			this.select(objs);
		return objs;
	},
	/**
	 * Add objects inside a screen box to selection.
	 * @param {Hash} box
	 * @param {Bool} allowPartialAreaSelecting If this value is true, object partial in the box will also be selected.
	 * @returns {Array} All inside objects.
	 */
	addObjectsInScreenBoxToSelection: function(screenBox, allowPartialAreaSelecting)
	{
		var objs = this.getObjectsInScreenBox(screenBox, allowPartialAreaSelecting);
		if (objs && objs.length)
			this.addToSelection(objs);
		return objs;
	},
	/**
	 * Remove objects inside a screen box from selection.
	 * @param {Hash} box
	 * @param {Bool} allowPartialAreaSelecting If this value is true, object partial in the box will also be deselected.
	 * @returns {Array} All inside objects.
	 */
	removeObjectsInScreenBoxFromSelection: function(screenBox, allowPartialAreaSelecting)
	{
		var objs = this.getObjectsInScreenBox(screenBox, allowPartialAreaSelecting);
		if (objs && objs.length)
			this.removeFromSelection(objs);
		return objs;
	},
	/**
	 * Toggle selection state of objects inside a screen box.
	 * @param {Hash} box
	 * @param {Bool} allowPartialAreaSelecting If this value is true, object partial in the box will also be toggled.
	 * @returns {Array} All inside objects.
	 */
	toggleSelectingStateOfObjectsInScreenBox: function(screenBox, allowPartialAreaSelecting)
	{
		var objs = this.getObjectsInScreenBox(screenBox, allowPartialAreaSelecting);
		if (objs && objs.length)
			this.toggleSelectingState(objs);
		return objs;
	},

	/**
	 * Returns a minimal box (in screen coord system) containing all objects' bounds in editor.
	 * @param {Array} objects
	 * @param {Float} objBoundInflation Inflation of each object's bound.
	 * @returns {Hash}
	 */
	getObjectsContainerBox: function(objects, objBoundInflation)
	{
		var objs = Kekule.ArrayUtils.toArray(objects);
		var inf = objBoundInflation || 0;
		var bounds = [];
		var containerBox = null;
		for (var i = 0, l = objs.length; i < l; ++i)
		{
			var obj = objs[i];

			var infos = this.getBoundInfoRecorder().getBelongedInfos(this.getObjContext(), obj);
			if (infos && infos.length)
			{
				for (var j = 0, k = infos.length; j < k; ++j)
				{
					var info = infos[j];
					var bound = info.boundInfo;
					if (bound)
					{
						// inflate
						if (inf)
							bound = Kekule.Render.MetaShapeUtils.inflateShape(bound, inf);
						var box = Kekule.Render.MetaShapeUtils.getContainerBox(bound);
						containerBox = containerBox? Kekule.BoxUtils.getContainerBox(containerBox, box): box;
					}
				}
			}
		}
		return containerBox;
	},
	/**
	 * Returns container box (in screen coord system) that contains all objects in selection.
	 * @param {Number} objBoundInflation
	 * @returns {Hash}
	 */
	getSelectionContainerBox: function(objBoundInflation)
	{
		return this.getObjectsContainerBox(this.getSelection(), objBoundInflation);
	},

	/**
	 * Returns whether current selected objects can be seen from screen (not all of them
	 * are in hidden scroll area).
	 */
	isSelectionVisible: function()
	{
		var selectionBox = this.getSelectionContainerBox();
		if (selectionBox)
		{
			var editorDim = this.getClientDimension();
			var editorOffset = this.getClientScrollPosition();
			var editorBox = {
				'x1': editorOffset.x, 'y1': editorOffset.y,
				'x2': editorOffset.x + editorDim.width, 'y2': editorOffset.y + editorDim.height
			};
			//console.log(selectionBox, editorBox, Kekule.BoxUtils.getIntersection(selectionBox, editorBox));
			return Kekule.BoxUtils.hasIntersection(selectionBox, editorBox);
		}
		else
			return false;
	},

	/////////// methods about object manipulations  /////////////////////////////

	/**
	 * Returns width and height info of obj.
	 * @param {Object} obj
	 * @returns {Hash}
	 */
	getObjSize: function(obj)
	{
		return this.doGetObjSize(obj);
	},
	/**
	 * Do actual job of getObjSize. Descendants may override this method.
	 * @param {Object} obj
	 * @returns {Hash}
	 */
	doGetObjSize: function(obj)
	{
		var coordMode = this.getCoordMode();
		//var allowCoordBorrow = this.getAllowCoordBorrow();
		return obj.getSizeOfMode? obj.getSizeOfMode(coordMode):
			null;
	},
	/**
	 * Set dimension of obj.
	 * @param {Object} obj
	 * @param {Hash} size
	 */
	setObjSize: function(obj, size)
	{
		this.doSetObjSize(obj, size);
		this.objectChanged(obj);
	},
	/**
	 * Do actual work of setObjSize.
	 * @param {Object} obj
	 * @param {Hash} size
	 */
	doSetObjSize: function(obj, dimension)
	{
		if (obj.setSizeOfMode)
			obj.setSizeOfMode(dimension, this.getCoordMode());
	},

	/**
	 * Returns own coord of obj.
	 * @param {Object} obj
	 * @param {Int} coordPos Value from {@link Kekule.Render.CoordPos}, relative position of coord in object.
	 * @returns {Hash}
	 */
	getObjCoord: function(obj, coordPos)
	{
		return this.doGetObjCoord(obj, coordPos);
	},
	/**
	 * Do actual job of getObjCoord. Descendants may override this method.
	 * @private
	 */
	doGetObjCoord: function(obj, coordPos)
	{
		var coordMode = this.getCoordMode();
		var allowCoordBorrow = this.getAllowCoordBorrow();
		var result = obj.getAbsBaseCoord? obj.getAbsBaseCoord(coordMode, allowCoordBorrow):
			obj.getAbsCoordOfMode? obj.getAbsCoordOfMode(coordMode, allowCoordBorrow):
			obj.getCoordOfMode? obj.getCoordOfMode(coordMode, allowCoordBorrow):
			null;

		if (coordMode === Kekule.CoordMode.COORD2D && Kekule.ObjUtils.notUnset(coordPos))  // appoint coord pos, need further calculation
		{
			var baseCoordPos = Kekule.Render.CoordPos.DEFAULT;
			if (coordPos !== baseCoordPos)
			{
				var allowCoordBorrow = this.getAllowCoordBorrow();
				var box = obj.getExposedContainerBox? obj.getExposedContainerBox(coordMode, allowCoordBorrow):
						obj.getContainerBox? obj.getContainerBox(coordMode, allowCoordBorrow): null;
				//console.log(obj.getClassName(), coordPos, objBasePos, box);
				if (box)
				{
					if (coordPos === Kekule.Render.CoordPos.CORNER_TL)
					{
						var delta = {x: (box.x2 - box.x1) / 2, y: (box.y2 - box.y1) / 2};

						result.x = result.x - delta.x;
						result.y = result.y + delta.y;
					}
				}
			}
		}

		return result;
		/*
		return obj.getAbsBaseCoord2D? obj.getAbsBaseCoord2D(allowCoordBorrow):
			obj.getAbsCoord2D? obj.getAbsCoord2D(allowCoordBorrow):
			obj.getCoord2D? obj.getCoord2D(allowCoordBorrow):
			null;
		*/
	},
	/**
	 * Set own coord of obj.
	 * @param {Object} obj
	 * @param {Hash} coord
	 * @param {Int} coordPos Value from {@link Kekule.Render.CoordPos}, relative position of coord in object.
	 */
	setObjCoord: function(obj, coord, coordPos)
	{
		this.doSetObjCoord(obj, coord, coordPos);
		this.objectChanged(obj);
	},
	/**
	 * Do actual job of setObjCoord. Descendants can override this method.
	 * @private
	 */
	doSetObjCoord: function(obj, coord, coordPos)
	{
		var newCoord = Object.create(coord);
		var coordMode = this.getCoordMode();
		//console.log(obj.setAbsBaseCoord, obj.setAbsCoordOfMode, obj.setAbsCoordOfMode);

		if (coordMode === Kekule.CoordMode.COORD2D && Kekule.ObjUtils.notUnset(coordPos))  // appoint coord pos, need further calculation
		{
			//var baseCoordPos = obj.getCoordPos? obj.getCoordPos(coordMode): Kekule.Render.CoordPos.DEFAULT;
			var baseCoordPos = Kekule.Render.CoordPos.DEFAULT;
			if (coordPos !== baseCoordPos)
			{
				var allowCoordBorrow = this.getAllowCoordBorrow();
				var box = obj.getExposedContainerBox? obj.getExposedContainerBox(coordMode, allowCoordBorrow):
						obj.getContainerBox? obj.getContainerBox(coordMode, allowCoordBorrow): null;
				//console.log(obj.getClassName(), coordPos, objBasePos, box);
				if (box)
				{
					var delta = {x: (box.x2 - box.x1) / 2, y: (box.y2 - box.y1) / 2};
					if (coordPos === Kekule.Render.CoordPos.CORNER_TL)
					  // base coord on center and set coord as top left
					{
						newCoord.x = coord.x + delta.x;
						newCoord.y = coord.y - delta.y;
					}
				}
			}
		}

		if (obj.setAbsBaseCoord)
		{
			obj.setAbsBaseCoord(newCoord, coordMode);
		}
		else if (obj.setAbsCoordOfMode)
		{
			obj.setAbsCoordOfMode(newCoord, coordMode);
		}
		else if (obj.setAbsCoordOfMode)
		{
			obj.setCoordOfMode(newCoord, coordMode);
		}
	},

	/**
	 * Get object's coord on context.
	 * @param {Object} obj
	 * @returns {Hash}
	 */
	getObjectContextCoord: function(obj, coordPos)
	{
		var coord = this.getObjCoord(obj, coordPos);
		return this.objCoordToContext(coord);
	},
	/**
	 * Change object's coord on context.
	 * @param {Object} obj
	 * @param {Hash} contextCoord
	 */
	setObjectContextCoord: function(obj, contextCoord, coordPos)
	{
		var coord = this.contextCoordToObj(contextCoord);
		if (coord)
			this.setObjCoord(obj, coord, coordPos);
	},
	/**
	 * Get object's coord on screen.
	 * @param {Object} obj
	 * @returns {Hash}
	 */
	getObjectScreenCoord: function(obj, coordPos)
	{
		var coord = this.getObjCoord(obj, coordPos);
		return this.objCoordToScreen(coord);
	},
	/**
	 * Change object's coord on screen.
	 * @param {Object} obj
	 * @param {Hash} contextCoord
	 */
	setObjectScreenCoord: function(obj, screenCoord, coordPos)
	{
		var coord = this.screenCoordToObj(screenCoord);
		if (coord)
			this.setObjCoord(obj, coord, coordPos);
	},

	/**
	 * Get coord of obj.
	 * @param {Object} obj
	 * @param {Int} coordSys Value from {@link Kekule.Render.CoordSystem}. Only CONTEXT and CHEM are available here.
	 * @returns {Hash}
	 */
	getCoord: function(obj, coordSys, coordPos)
	{
		/*
		if (coordSys === Kekule.Render.CoordSystem.CONTEXT)
			return this.getObjectContextCoord(obj);
		else
			return this.getObjCoord(obj);
		*/
		var objCoord = this.getObjCoord(obj, coordPos);
		return this.translateCoord(objCoord, Kekule.Editor.CoordSys.OBJ, coordSys);
	},
	/**
	 * Set coord of obj.
	 * @param {Object} obj
	 * @param {Hash} value
	 * @param {Int} coordSys Value from {@link Kekule.Render.CoordSystem}. Only CONTEXT and CHEM are available here.
	 */
	setCoord: function(obj, value, coordSys, coordPos)
	{
		/*
		if (coordSys === Kekule.Render.CoordSystem.CONTEXT)
			this.setObjectContextCoord(obj, value);
		else
			this.setObjCoord(obj, value);
		*/
		var objCoord = this.translateCoord(value, coordSys, Kekule.Editor.CoordSys.OBJ);
		this.setObjCoord(obj, objCoord, coordPos);
	},
	/**
	 * Get size of obj.
	 * @param {Object} obj
	 * @param {Int} coordSys Value from {@link Kekule.Render.CoordSystem}. Only CONTEXT and CHEM are available here.
	 * @returns {Hash}
	 */
	getSize: function(obj, coordSys)
	{
		var objSize = this.getObjSize(obj);
		return this.translateCoord(objSize, Kekule.Editor.CoordSys.OBJ, coordSys);
	},
	/**
	 * Set size of obj.
	 * @param {Object} obj
	 * @param {Hash} value
	 * @param {Int} coordSys Value from {@link Kekule.Render.CoordSystem}. Only CONTEXT and CHEM are available here.
	 */
	setSize: function(obj, value, coordSys)
	{
		var objSize = this.translateCoord(value, coordSys, Kekule.Editor.CoordSys.OBJ);
		this.setObjSize(obj, objSize);
	},

	// Coord translate methods
	/**
	 * Translate coord to value of another coord system.
	 * @param {Hash} coord
	 * @param {Int} fromSys
	 * @param {Int} toSys
	 */
	translateCoord: function(coord, fromSys, toSys)
	{
		if (!coord)
			return null;
		var S = Kekule.Editor.CoordSys;
		if (fromSys === S.SCREEN)
		{
			if (toSys === S.SCREEN)
				return coord;
			else if (toSys === S.CONTEXT)
				return this.getObjDrawBridge().transformScreenCoordToContext(this.getObjContext(), coord);
			else  // S.OBJ
			{
				var contextCoord = this.getObjDrawBridge().transformScreenCoordToContext(this.getObjContext(), coord);
				return this.getRootRenderer().transformCoordToObj(this.getObjContext(), this.getChemObj(), contextCoord);
			}
		}
		else if (fromSys === S.CONTEXT)
		{
			if (toSys === S.SCREEN)
				return this.getObjDrawBridge().transformContextCoordToScreen(this.getObjContext(), coord);
			else if (toSys === S.CONTEXT)
				return coord;
			else  // S.OBJ
				return this.getRootRenderer().transformCoordToObj(this.getObjContext(), this.getChemObj(), coord);
		}
		else  // fromSys === S.OBJ
		{
			if (toSys === S.SCREEN)
			{
				var contextCoord = this.getRootRenderer().transformCoordToContext(this.getObjContext(), this.getChemObj(), coord);
				return this.getObjDrawBridge().transformContextCoordToScreen(this.getObjContext(), contextCoord);
			}
			else if (toSys === S.CONTEXT)
				return this.getRootRenderer().transformCoordToContext(this.getObjContext(), this.getChemObj(), coord);
			else  // S.OBJ
				return coord;
		}
	},
	/**
	 * Translate a distance value to a distance in another coord system.
	 * @param {Hash} coord
	 * @param {Int} fromSys
	 * @param {Int} toSys
	 */
	translateDistance: function(distance, fromSys, toSys)
	{
		var coord0 = {'x': 0, 'y': 0, 'z': 0};
		var coord1 = {'x': distance, 'y': 0, 'z': 0};
		var transCoord0 = this.translateCoord(coord0, fromSys, toSys);
		var transCoord1 = this.translateCoord(coord1, fromSys, toSys);
		return Kekule.CoordUtils.getDistance(transCoord0, transCoord1);
	},

	/**
	 * Transform sizes and coords of objects based on coord sys of current editor.
	 * @param {Array} objects
	 * @param {Hash} transformParams
	 * @private
	 */
	transformCoordAndSizeOfObjects: function(objects, transformParams)
	{
		var coordMode = this.getCoordMode();
		var allowCoordBorrow = this.getAllowCoordBorrow();
		var matrix = (coordMode === Kekule.CoordMode.COORD3D)?
				Kekule.CoordUtils.calcTransform3DMatrix(transformParams):
				Kekule.CoordUtils.calcTransform2DMatrix(transformParams);
		var childTransformParams = Object.extend({}, transformParams);
		childTransformParams = Object.extend(childTransformParams, {
			'translateX': 0,
			'translateY': 0,
			'translateZ': 0,
			'center': {'x': 0, 'y': 0, 'z': 0}
		});
		var childMatrix = (coordMode === Kekule.CoordMode.COORD3D)?
				Kekule.CoordUtils.calcTransform3DMatrix(childTransformParams):
				Kekule.CoordUtils.calcTransform2DMatrix(childTransformParams);

		for (var i = 0, l = objects.length; i < l; ++i)
		{
			var obj = objects[i];
			obj.transformAbsCoordByMatrix(matrix, childMatrix, coordMode, true, allowCoordBorrow);
			obj.scaleSize(transformParams.scale, coordMode, true, allowCoordBorrow);
		}
	},

	/*
	 * Turn obj coord to context one.
	 * @param {Hash} objCoord
	 * @returns {Hash}
	 */
	objCoordToContext: function(objCoord)
	{
		var S = Kekule.Editor.CoordSys;
		return this.translateCoord(objCoord, S.OBJ, S.CONTEXT);
	},
	/**
	 * Turn context coord to obj one.
	 * @param {Hash} contextCoord
	 * @returns {Hash}
	 */
	contextCoordToObj: function(contextCoord)
	{
		var S = Kekule.Editor.CoordSys;
		return this.translateCoord(contextCoord, S.CONTEXT, S.OBJ);
	},
	/*
	 * Turn obj coord to screen one.
	 * @param {Hash} objCoord
	 * @returns {Hash}
	 */
	objCoordToScreen: function(objCoord)
	{
		var S = Kekule.Editor.CoordSys;
		return this.translateCoord(objCoord, S.OBJ, S.SCREEN);
	},
	/**
	 * Turn screen coord to obj one.
	 * @param {Hash} contextCoord
	 * @returns {Hash}
	 */
	screenCoordToObj: function(screenCoord)
	{
		var S = Kekule.Editor.CoordSys;
		return this.translateCoord(screenCoord, S.SCREEN, S.OBJ);
	},

	/**
	 * Turn screen based coord to context one.
	 * @param {Hash} screenCoord
	 * @returns {Hash}
	 */
	screenCoordToContext: function(screenCoord)
	{
		/*
		var coord = this.getObjDrawBridge().transformScreenCoordToContext(this.getObjContext(), screenCoord);
		return coord;
		*/
		var S = Kekule.Editor.CoordSys;
		return this.translateCoord(screenCoord, S.SCREEN, S.CONTEXT);
	},
	/**
	 * Turn context based coord to screen one.
	 * @param {Hash} screenCoord
	 * @returns {Hash}
	 */
	contextCoordToScreen: function(screenCoord)
	{
		var S = Kekule.Editor.CoordSys;
		return this.translateCoord(screenCoord, S.CONTEXT, S.SCREEN);
	},

	/**
	 * Turn box coords based on screen system to context one.
	 * @param {Hash} screenCoord
	 * @returns {Hash}
	 */
	screenBoxToContext: function(screenBox)
	{
		var coord1 = this.screenCoordToContext({'x': screenBox.x1, 'y': screenBox.y1});
		var coord2 = this.screenCoordToContext({'x': screenBox.x2, 'y': screenBox.y2});
		return {'x1': coord1.x, 'y1': coord1.y, 'x2': coord2.x, 'y2': coord2.y};
	},

	///////////////////////////////////////////////////////

	/**
	 * Create a default node at coord and append it to parent.
	 * @param {Hash} coord
	 * @param {Int} coordType Value from {@link Kekule.Editor.CoordType}
	 * @param {Kekule.StructureFragment} parent
	 * @returns {Kekule.ChemStructureNode}
	 * @private
	 */
	createDefaultNode: function(coord, coordType, parent)
	{
		var isoId = this.getEditorConfigs().getStructureConfigs().getDefIsotopeId();
		var atom = new Kekule.Atom();
		atom.setIsotopeId(isoId);
		if (parent)
			parent.appendNode(atom);
		this.setCoord(atom, coord, coordType);

		return atom;
	},

	/////////////////////////////////////////////////////////////////////////////

	// methods about undo/redo and operation histories
	/**
	 * Called after a operation is executed or reversed. Notify object has changed.
	 * @param {Object} operation
	 */
	operationDone: function(operation)
	{
		this.doOperationDone(operation);
	},
	/**
	 * Do actual job of {@link Kekule.Editor.AbstractEditor#operationDone}. Descendants should override this method.
	 * @private
	 */
	doOperationDone: function(operation)
	{
		// do nothing here
	},

	/**
	 * Pop all operations and empty history list.
	 */
	clearOperHistory: function()
	{
		var h = this.getOperHistory();
		if (h)
			h.clear();
	},
	/**
	 * Manually append an operation to the tail of operation history.
	 * @param {Kekule.Operation} operation
	 * @param {Bool} autoExec Whether execute the operation after pushing it.
	 */
	pushOperation: function(operation, autoExec)
	{
		var h = this.getOperHistory();
		if (h && operation)
		{
			h.push(operation);
		}
		if (autoExec)
		{
			this.beginUpdateObject();
			try
			{
				operation.execute();
			}
			finally
			{
				this.endUpdateObject();
			}
		}
	},
	/**
	 * Manually pop an operation from the tail of operation history.
	 * @param {Bool} autoReverse Whether undo the operation after popping it.
	 * @returns {Kekule.Operation} Operation popped.
	 */
	popOperation: function(autoReverse)
	{
		var r;
		var h = this.getOperHistory();
		if (h)
		{
			r = h.pop();
			if (autoReverse)
			{
				this.beginUpdateObject();
				try
				{
					r.reverse();
				}
				finally
				{
					this.endUpdateObject();
				}
			}
			return r;
		}
		else
			return null;
	},
	/**
	 * Execute an operation in editor.
	 * @param {Kekule.Operation} operation
	 */
	execOperation: function(operation)
	{
		this.beginUpdateObject();
		try
		{
			operation.execute();
		}
		finally
		{
			this.endUpdateObject();
		}
		if (this.getEnableOperHistory())
			this.pushOperation(operation, false);  // push but not execute
		return this;
	},

	/**
	 * Undo last operation.
	 */
	undo: function()
	{
		var o;
		var h = this.getOperHistory();
		if (h)
		{
			this.beginUpdateObject();
			try
			{
				o = h.undo();
			}
			finally
			{
				this.endUpdateObject();
				if (o)
					this.operationDone(o);
			}
			this._removeOrphans('undo');
		}
		return o;
	},
	/**
	 * Redo last operation.
	 */
	redo: function()
	{
		var o;
		var h = this.getOperHistory();
		if (h)
		{
			this.beginUpdateObject();
			try
			{
				o = h.redo();
			}
			finally
			{
				this.endUpdateObject();
				if (o)
					this.operationDone(o)
			}
			this._removeOrphans('redo');
		}
		return o;
	},
	_removeOrphans: function(action) {
		const chemSpace = this.getChemSpace();
		if (chemSpace) {
			const children = chemSpace.getChildren().filter(x => x.CLASS_NAME === 'Kekule.Glyph.PathGlyphArcConnectorControlNode');
			console.log('@@@ _removeOrphans', children)
			// for (const child of children) {
			// 	      child.getParent().removeChild(child);
			// }
		}
	},
	/**
	 * Undo all operations.
	 */
	undoAll: function()
	{
		var o;
		var h = this.getOperHistory();
		if (h)
		{
			this.beginUpdateObject();
			try
			{
				o = h.undoAll();
			}
			finally
			{
				this.endUpdateObject();
			}
		}
		return o;
	},
	/**
	 * Check if an undo action can be taken.
	 * @returns {Bool}
	 */
	canUndo: function()
	{
		var h = this.getOperHistory();
		return h?	h.canUndo(): false;
	},
	/**
	 * Check if an undo action can be taken.
	 * @returns {Bool}
	 */
	canRedo: function()
	{
		var h = this.getOperHistory();
		return h? h.canRedo(): false;
	},

	/**
	 * Modify properties of objects in editor.
	 * @param {Variant} objOrObjs A object or an array of objects.
	 * @param {Hash} modifiedPropInfos A hash of property: value pairs.
	 * @param {Bool} putInOperHistory If set to true, the modification will be put into history and can be undone.
	 */
	modifyObjects: function(objOrObjs, modifiedPropInfos, putInOperHistory)
	{
		var objs = Kekule.ArrayUtils.toArray(objOrObjs);
		try
		{
			var macro = new Kekule.MacroOperation();
			for (var i = 0, l = objs.length; i < l; ++i)
			{
				var obj = objs[i];
				var oper = new Kekule.ChemObjOperation.Modify(obj, modifiedPropInfos, this);
				macro.add(oper);
			}
			macro.execute();
		}
		finally
		{
			if (putInOperHistory && this.getEnableOperHistory() && macro.getChildCount())
				this.pushOperation(macro);
		}
		return this;
	},

	/**
	 * Modify render options of objects in editor.
	 * @param {Variant} objOrObjs A object or an array of objects.
	 * @param {Hash} modifiedValues A hash of name: value pairs.
	 * @param {Bool} is3DOption Change renderOptions or render3DOptions.
	 * @param {Bool} putInOperHistory If set to true, the modification will be put into history and can be undone.
	 */
	modifyObjectsRenderOptions: function(objOrObjs, modifiedValues, is3DOption, putInOperHistory)
	{
		var objs = Kekule.ArrayUtils.toArray(objOrObjs);
		var renderPropName = is3DOption? 'render3DOptions': 'renderOptions';
		var getterName = is3DOption? 'getRender3DOptions': 'getRenderOptions';
		try
		{
			var macro = new Kekule.MacroOperation();
			for (var i = 0, l = objs.length; i < l; ++i)
			{
				var obj = objs[i];
				if (obj[getterName])
				{
					var old = obj[getterName]();
					var newOps = Object.extend({}, old);
					newOps = Object.extend(newOps, modifiedValues);
					var hash = {};
					hash[renderPropName] = newOps;
					var oper = new Kekule.ChemObjOperation.Modify(obj, hash, this);
					//oper.execute();
					macro.add(oper);
				}
			}
			macro.execute();
		}
		finally
		{
			if (putInOperHistory && this.getEnableOperHistory() && macro.getChildCount())
				this.pushOperation(macro);
		}
		return this;
	},

	/**
	 * Returns the dimension of current visible client area of editor.
	 */
	getClientDimension: function()
	{
		var elem = this.getElement();
		return {
			'width': elem.clientWidth,
			'height': elem.clientHeight
		};
	},
	/**
	 * Returns current scroll position of edit client element.
	 * @returns {Hash} {x, y}
	 */
	getClientScrollPosition: function()
	{
		var elem = this.getEditClientElem().parentNode;
		return elem? {
			'x': elem.scrollLeft,
			'y': elem.scrollTop
		}: null;
	},
	/**
	 * Scroll edit client to a position.
	 * @param {Int} yPosition, in px.
	 * @param {Int} xPosition, in px.
	 */
	scrollClientTo: function(yPosition, xPosition)
	{
		/*
		var elem = this.getEditClientElem().parentNode;
		if (Kekule.ObjUtils.notUnset(yPosition))
			elem.scrollTop = yPosition;
		if (Kekule.ObjUtils.notUnset(xPosition))
			elem.scrollLeft = xPosition;
		return this;
		*/
		return this.scrollClientToCoord({'y': yPosition, 'x': xPosition});
	},
	/**
	 * Scroll edit client to top.
	 */
	scrollClientToTop: function()
	{
		return this.scrollClientTo(0, null);
	},
	/**
	 * Scroll edit client to bottom.
	 */
	scrollClientToBottom: function()
	{
		var elem = this.getEditClientElem();
		var dim = Kekule.HtmlElementUtils.getElemClientDimension(elem);
		return this.scrollClientTo(dim.height, null);
	},

	/**
	 * Scroll edit client to coord (based on coordSys).
	 * @param {Hash} coord
	 * @param {Int} coordSys If not set, screen coord system will be used.
	 * @param {Hash} options A hash object that contains the options of scrolling.
	 *   Currently it may has one field: scrollToCenter. If scrollToCenter is true,
	 *   the coord will be at the center of edit area rather than top-left.
	 */
	scrollClientToCoord: function(coord, coordSys, options)
	{
		var scrollX = OU.notUnset(coord.x);
		var scrollY = OU.notUnset(coord.y);
		var scrollToCenter = options && options.scrollToCenter;
		var screenCoord;
		if (OU.isUnset(coordSys))
			screenCoord = coord;
		else
			screenCoord = this.translateCoord(coord, coordSys, Kekule.Editor.CoordSys.SCREEN);
		if (scrollToCenter)
		{
			var visibleClientBox = this.getVisibleClientScreenBox();
			var delta = {'x': visibleClientBox.width / 2, 'y': visibleClientBox.height / 2};
			screenCoord = Kekule.CoordUtils.substract(screenCoord, delta);
		}
		var elem = this.getEditClientElem().parentNode;
		if (scrollY)
			elem.scrollTop = screenCoord.y;
		if (scrollX)
			elem.scrollLeft = screenCoord.x;

		return this;
	},

	/**
	 * Scroll edit client to target object or objects in editor.
	 * @param {Variant} targetObjOrObjs Target object or objects array.
	 * @param {Hash} options Scroll options, can including two fields: scrollToCenter, coverMostObjs.
	 *   The default value of both of those options are true.
	 */
	scrollClientToObject: function(targetObjOrObjs, options)
	{
		var BU = Kekule.BoxUtils;
		if (!targetObjOrObjs)
			return this;
		var rootObj = this.getChemObj();
		if (!rootObj)
			return this;
		var objs = AU.toArray(targetObjOrObjs);
		var containerBoxes = [];
		var totalContainerBox = null;
		for (var i = 0, l = objs.length; i < l; ++i)
		{
			var obj = objs[i];
			if (obj.getContainerBox && obj.isChildOf && obj.isChildOf(rootObj))
			{
				var box = obj.getContainerBox(this.getCoordMode());
				if (box)
				{
					containerBoxes.push(box);
					if (!totalContainerBox)
						totalContainerBox = box;
					else
						totalContainerBox = BU.getContainerBox(totalContainerBox, box);
				}
			}
		}

		if (totalContainerBox)
		{
			var ops = Object.extend({scrollToCenter: true, coverMostObjs: true}, options || {});

			var actualBox;
			// if scroll to centerCoord and none of the obj can be seen in current state, we need another approach
			var visibleBox = this.getVisibleClientBoxOfSys(Kekule.Editor.CoordSys.CHEM);
			if (((totalContainerBox.x2 - totalContainerBox.x1 > visibleBox.x2 - visibleBox.x1)
				|| (totalContainerBox.y2 - totalContainerBox.y1 > visibleBox.y2 - visibleBox.y1))
				&& ops.coverMostObjs)
			{
				actualBox = this._getMostIntersectedContainerBox(visibleBox.x2 - visibleBox.x1, visibleBox.y2 - visibleBox.y1, containerBoxes, totalContainerBox);
			}
			else
				actualBox = totalContainerBox;

			var scrollCoord = ops.scrollToCenter? BU.getCenterCoord(actualBox): {x: actualBox.x1, y: actualBox.y2};
			return this.scrollClientToCoord(scrollCoord, Kekule.Editor.CoordSys.CHEM, ops);
		}
		else
			return this;
	},

	/** @private */
	_getMostIntersectedContainerBox: function(width, height, boxes, totalContainerBox)
	{
		var BU = Kekule.BoxUtils;

		var generateTestBox = function(startingCoord, directions)
		{
			var endingCoord = CU.add(startingCoord, {'x': width * directions.x, 'y': height * directions.y});
			if (endingCoord.x < totalContainerBox.x1)
				endingCoord.x = totalContainerBox.x1;
			else if (endingCoord.x > totalContainerBox.x2)
				endingCoord.x = totalContainerBox.x2;
			if (endingCoord.y < totalContainerBox.y1)
				endingCoord.y = totalContainerBox.y1;
			else if (endingCoord.y > totalContainerBox.y2)
				endingCoord.y = totalContainerBox.y2;
			var actualStartingCoord = CU.add(endingCoord, {'x': -width * directions.x, 'y': -height * directions.y});
			var result = BU.createBox(actualStartingCoord, endingCoord);
			return result;
		};

		var getIntersectedBoxCount = function(testBox, boxes)
		{
			var result = 0;
			for (var i = 0, l = boxes.length; i < l; ++i)
			{
				var box = boxes[i];
				if (BU.hasIntersection(box, testBox))
					++result;
			}
			return result;
		};

		var maxIntersectCount = 0;
		var currContainerBox;
		for (var i = 0, l = boxes.length; i < l; ++i)
		{
			var corners = BU.getCornerCoords(boxes[i]);
			var testBoxes = [
				generateTestBox(corners[0], {x: 1, y: 1}),
				generateTestBox(corners[1], {x: 1, y: -1}),
				generateTestBox(corners[2], {x: -1, y: 1}),
				generateTestBox(corners[3], {x: -1, y: -1}),
			];
			for (var j = 0, k = testBoxes.length; j < k; ++j)
			{
				var count = getIntersectedBoxCount(testBoxes[j], boxes);
				if (count > maxIntersectCount)
				{
					maxIntersectCount = count;
					currContainerBox = testBoxes[j];
				}
			}
		}
		return currContainerBox;
	},

	/////// Event handle  //////////////////////

	doBeforeDispatchUiEvent: function($super, e)
	{
		// get pointer type information here
		var evType = e.getType();
		if (['pointerdown', 'pointermove', 'pointerup'].indexOf(evType) >= 0)
		{
			this.setCurrPointerType(e.pointerType);
		}
		return $super(e);
	}
});

/**
 * A special class to give a setting facade for BaseEditor.
 * Do not use this class alone.
 * @class
 * @augments Kekule.ChemWidget.ChemObjDisplayer.Settings
 * @ignore
 */
Kekule.Editor.BaseEditor.Settings = Class.create(Kekule.ChemWidget.ChemObjDisplayer.Settings,
/** @lends Kekule.Editor.BaseEditor.Settings# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.BaseEditor.Settings',
	/** @private */
	initProperties: function()
	{
		this.defineProp('enableCreateNewDoc', {'dataType': DataType.BOOL, 'serializable': false,
			'getter': function() { return this.getEditor().getEnableCreateNewDoc(); },
			'setter': function(value) { this.getEditor().setEnableCreateNewDoc(value); }
		});
		this.defineProp('initOnNewDoc', {'dataType': DataType.BOOL, 'serializable': false,
			'getter': function() { return this.getEditor().getInitOnNewDoc(); },
			'setter': function(value) { this.getEditor().setInitOnNewDoc(value); }
		});
		this.defineProp('enableOperHistory', {'dataType': DataType.BOOL, 'serializable': false,
			'getter': function() { return this.getEditor().getEnableOperHistory(); },
			'setter': function(value) { this.getEditor().setEnableOperHistory(value); }
		});
	},
	/** @private */
	getEditor: function()
	{
		return this.getDisplayer();
	}
});

/**
 * A class to register all available IA controllers for editor.
 * @class
 */
Kekule.Editor.IaControllerManager = {
	/** @private */
	_controllerMap: new Kekule.MapEx(true),
	/**
	 * Register a controller, the controller can be used in targetEditorClass or its descendants.
	 * @param {Class} controllerClass
	 * @param {Class} targetEditorClass
	 */
	register: function(controllerClass, targetEditorClass)
	{
		ICM._controllerMap.set(controllerClass, targetEditorClass);
	},
	/**
	 * Unregister a controller.
	 * @param {Class} controllerClass
	 */
	unregister: function(controllerClass)
	{
		ICM._controllerMap.remove(controllerClass);
	},
	/**
	 * Returns all registered controller classes.
	 * @returns {Array}
	 */
	getAllControllerClasses: function()
	{
		return ICM._controllerMap.getKeys();
	},
	/**
	 * Returns controller classes can be used for editorClass.
	 * @param {Class} editorClass
	 * @returns {Array}
	 */
	getAvailableControllerClasses: function(editorClass)
	{
		var result = [];
		var controllerClasses = ICM.getAllControllerClasses();
		for (var i = 0, l = controllerClasses.length; i < l; ++i)
		{
			var cc = controllerClasses[i];
			var ec = ICM._controllerMap.get(cc);
			if (!ec || ClassEx.isOrIsDescendantOf(editorClass, ec))
				result.push(cc);
		}
		return result;
	}
};
var ICM = Kekule.Editor.IaControllerManager;


/**
 * Base Controller class for editor.
 * @class
 * @augments Kekule.Widget.InteractionController
 *
 * @param {Kekule.Editor.BaseEditor} editor Editor of current object being installed to.
 *
 * @property {Bool} manuallyHotTrack If set to false, hot track will be auto shown in mousemove event listener.
 */
Kekule.Editor.BaseEditorIaController = Class.create(Kekule.Widget.InteractionController,
/** @lends Kekule.Editor.BaseEditorIaController# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.BaseEditorIaController',
	/** @constructs */
	initialize: function($super, editor)
	{
		$super(editor);
	},
	initProperties: function()
	{
		this.defineProp('manuallyHotTrack', {'dataType': DataType.BOOL, 'serializable': false});

		// in mouse or touch interaction, we may have different bound inflation
		this.defineProp('currBoundInflation', {'dataType': DataType.NUMBER, 'serializable': false,
			'getter': function() { return this.getEditor().getCurrBoundInflation(); },
			'setter': null  // function(value) { return this.getEditor().setCurrBoundInflation(value); }
		});
	},
	/**
	 * Returns the preferred id for this controller.
	 */
	getDefId: function()
	{
		return Kekule.ClassUtils.getLastClassName(this.getClassName());
	},
	/**
	 * Return associated editor.
	 * @returns {Kekule.ChemWidget.BaseEditor}
	 */
	getEditor: function()
	{
		return this.getWidget();
	},
	/**
	 * Set associated editor.
	 * @param {Kekule.ChemWidget.BaseEditor} editor
	 */
	setEditor: function(editor)
	{
		return this.setWidget(editor);
	},
	/**
	 * Get config object of editor.
	 * @returns {Object}
	 */
	getEditorConfigs: function()
	{
		var editor = this.getEditor();
		return editor? editor.getEditorConfigs(): null;
	},
	/** @private */
	getInteractionBoundInflation: function(pointerType)
	{
		return this.getEditor().getInteractionBoundInflation(pointerType);
	},

	/** @ignore */
	handleUiEvent: function($super, e)
	{
		var handle = false;
		var targetElem = (e.getTarget && e.getTarget()) || e.target;  // hammer event does not have getTarget method
		var uiElem = this.getEditor().getUiEventReceiverElem();
		if (uiElem)
		{
			// only handles event on event receiver element
			// otherwise scrollbar on editor may cause problem
			if ((targetElem === uiElem) || Kekule.DomUtils.isDescendantOf(targetElem, uiElem))
				handle = true;
		}
		else
			handle = true;
		if (handle)
			$super(e);
	},

	/**
	 * Returns if this IaController can interact with obj.
	 * If true, when mouse moving over obj, a hot track marker will be drawn.
	 * Descendants should override this method.
	 * @param {Object} obj
	 * @return {Bool}
	 * @private
	 */
	canInteractWithObj: function(obj)
	{
		return !!obj;
	},

	/**
	 * Show a hot track marker on obj in editor.
	 * @param {Kekule.ChemObject} obj
	 */
	hotTrackOnObj: function(obj)
	{
		this.getEditor().hotTrackOnObj(obj);
	},

	// zoom functions
	/** @private */
	zoomEditor: function(zoomLevel, zoomCenterCoord)
	{
		if (zoomLevel > 0)
			this.getEditor().zoomIn(zoomLevel, zoomCenterCoord);
		else if (zoomLevel < 0)
			this.getEditor().zoomOut(-zoomLevel, zoomCenterCoord);
	},

	/** @private */
	/*
	updateCurrBoundInflation: function(evt)
	{
	*/
		/*
		var editor = this.getEditor();
		var pointerType = evt && evt.pointerType;
		var iaConfigs = this.getEditorConfigs().getInteractionConfigs();
		var defRatio = iaConfigs.getObjBoundTrackInflationRatio();
		var currRatio, ratioValue;
		if (pointerType === 'mouse')
			currRatio = iaConfigs.getObjBoundTrackInflationRatioMouse();
		else if (pointerType === 'pen')
			currRatio = iaConfigs.getObjBoundTrackInflationRatioPen();
		else if (pointerType === 'touch')
			currRatio =	iaConfigs.getObjBoundTrackInflationRatioTouch();
		currRatio = currRatio || defRatio;
		if (currRatio)
		{
			var bondScreenLength = editor.getDefBondScreenLength();
			ratioValue = bondScreenLength * currRatio;
		}

		var defMinValue = iaConfigs.getObjBoundTrackMinInflation();
		var currMinValue;
		if (pointerType === 'mouse')
			currMinValue = iaConfigs.getObjBoundTrackMinInflationMouse();
		else if (pointerType === 'pen')
			currMinValue = iaConfigs.getObjBoundTrackMinInflationPen();
		else if (pointerType === 'touch')
			currMinValue =	iaConfigs.getObjBoundTrackMinInflationTouch();
		currMinValue = currMinValue || defMinValue;

		var actualValue = Math.max(ratioValue || 0, currMinValue);
		*/
	  /*
		//this.setCurrBoundInflation(actualValue);
		var value = this.getEditor().getInteractionBoundInflation(evt && evt.pointerType);
		this.setCurrBoundInflation(value);
		//console.log('update bound inflation', pointerType, this.getCurrBoundInflation());
	},
	*/

	/** @private */
	_filterBasicObjectsInEditor: function(objs)
	{
		var editor = this.getEditor();
		var rootObj = editor.getChemObj();
		var result = [];
		for (var i = 0, l = objs.length; i < l; ++i)
		{
			var obj = objs[i];
			if (obj.isChildOf(rootObj))
				result.push(obj);
		}
		return result;
	},
	/**
	 * Notify the manipulation is done and objs are inserted into or modified in editor.
	 * This method should be called by descendants at the end of their manipulation.
	 * Objs will be automatically selected if autoSelectNewlyInsertedObjects option is true.
	 * @param {Array} objs
	 * @private
	 */
	doneInsertOrModifyBasicObjects: function(objs)
	{
		if (this.getEditorConfigs().getInteractionConfigs().getAutoSelectNewlyInsertedObjects())
		{
			var filteredObjs = this._filterBasicObjectsInEditor(objs);
			this.getEditor().select(filteredObjs);
		}
	},

	/** @private */
	react_pointerdown: function(e)
	{
		//this.updateCurrBoundInflation(e);
		//this.getEditor().setCurrPointerType(e.pointerType);
		e.preventDefault();
		return true;
	},
	/** @private */
	react_pointermove: function(e)
	{
		//if (!this.getCurrBoundInflation())
		//this.updateCurrBoundInflation(e);
		//this.getEditor().setCurrPointerType(e.pointerType);

		//console.log(e.getTarget().id);
		var coord = this._getEventMouseCoord(e);
		var obj = this.getEditor().getTopmostBasicObjectAtCoord(coord, this.getCurrBoundInflation());
		if (!this.getManuallyHotTrack())
		{
			/*
			if (obj)
				console.log('point to', obj.getClassName(), obj.getId());
			*/
			if (obj && this.canInteractWithObj(obj))
			{
				this.hotTrackOnObj(obj);
			}
			else
			{
				this.hotTrackOnObj(null);
			}
			//e.preventDefault();
		}
		e.preventDefault();
		return true;
	},
	/** @private */
	react_mousewheel: function(e)
	{
		if (e.getCtrlKey())
		{
			var currScreenCoord = this._getEventMouseCoord(e);
			//this.getEditor().setZoomCenter(currScreenCoord);
			try
			{
				var delta = e.wheelDeltaY || e.wheelDelta;
				if (delta)
					delta /= 120;
				//console.log('zoom', this.getEditor().getZoomCenter())
				this.zoomEditor(delta, currScreenCoord);
			}
			finally
			{
				//this.getEditor().setZoomCenter(null);
			}
			e.preventDefault();
			return true;
		}
	},

	/** @private */
	_getEventMouseCoord: function($super, e, clientElem)
	{
		var elem = clientElem || this.getWidget().getCoreElement();  // defaultly base on client element, not widget element
		return $super(e, elem);
	}
});

/**
 * Controller for drag and scroll (by mouse, touch...) client element in editor.
 * @class
 * @augments Kekule.Widget.BaseEditorIaController
 *
 * @param {Kekule.Editor.BaseEditor} widget Editor of current object being installed to.
 */
Kekule.Editor.ClientDragScrollIaController = Class.create(Kekule.Editor.BaseEditorIaController,
/** @lends Kekule.Editor.ClientDragScrollIaController# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ClientDragScrollIaController',
	/** @constructs */
	initialize: function($super, widget)
	{
		$super(widget);
		this._isExecuting = false;
	},
	/** @ignore */
	canInteractWithObj: function(obj)
	{
		return false;  // do not interact directly with objects in editor
	},
	/** @ignore */
	doTestMouseCursor: function(coord, e)
	{
		//console.log(this.isExecuting(), coord);
		return this.isExecuting()?
				['grabbing', '-webkit-grabbing', '-moz-grabbing', 'move']:
				['grab', '-webkit-grab', '-moz-grab', 'pointer'];
		//return this.isExecuting()? '-webkit-grabbing': '-webkit-grab';
	},

	/** @private */
	isExecuting: function()
	{
		return this._isExecuting;
	},
	/** @private */
	startScroll: function(screenCoord)
	{
		this._startCoord = screenCoord;
		this._originalScrollPos = this.getEditor().getClientScrollPosition();
		this._isExecuting = true;
	},
	/** @private */
	endScroll: function()
	{
		this._isExecuting = false;
		this._startCoord = null;
		this._originalScrollPos = null;
	},
	/** @private */
	scrollTo: function(screenCoord)
	{
		if (this.isExecuting())
		{
			var startCoord = this._startCoord;
			var delta = Kekule.CoordUtils.substract(startCoord, screenCoord);
			var newScrollPos = Kekule.CoordUtils.add(this._originalScrollPos, delta);
			this.getEditor().scrollClientTo(newScrollPos.y, newScrollPos.x);  // note the params of this method is y, x
		}
	},

	/** @private */
	react_pointerdown: function(e)
	{
		if (e.getButton() === Kekule.X.Event.MouseButton.LEFT)  // begin scroll
		{
			if (!this.isExecuting())
			{
				var coord = {x: e.getScreenX(), y: e.getScreenY()};
				this.startScroll(coord);
				e.preventDefault();
			}
		}
		else if (e.getButton() === Kekule.X.Event.MouseButton.RIGHT)
		{
			if (this.isExecuting())
			{
				this.endScroll();
				e.preventDefault();
			}
		}
	},
	/** @private */
	react_pointerup: function(e)
	{
		if (e.getButton() === Kekule.X.Event.MouseButton.LEFT)
		{
			if (this.isExecuting())
			{
				this.endScroll();
				e.preventDefault();
			}
		}
	},
	/** @private */
	react_pointermove: function($super, e)
	{
		$super(e);
		if (this.isExecuting())
		{
			var coord = {x: e.getScreenX(), y: e.getScreenY()};
			this.scrollTo(coord);
			e.preventDefault();
		}
		return true;
	}
});
/** @ignore */
Kekule.Editor.IaControllerManager.register(Kekule.Editor.ClientDragScrollIaController, Kekule.Editor.BaseEditor);

/**
 * Controller for deleting objects in editor.
 * @class
 * @augments Kekule.Widget.BaseEditorIaController
 *
 * @param {Kekule.Editor.BaseEditor} widget Editor of current object being installed to.
 */
Kekule.Editor.BasicEraserIaController = Class.create(Kekule.Editor.BaseEditorIaController,
/** @lends Kekule.Editor.BasicEraserIaController# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.BasicEraserIaController',
	/** @constructs */
	initialize: function($super, widget)
	{
		$super(widget);
		this._isExecuting = false;
	},

	/** @ignore */
	canInteractWithObj: function(obj)
	{
		return !!obj;  // every thing can be deleted
	},

	//methods about remove
	/** @private */
	removeObjs: function(objs)
	{
		console.log('@@@ removeObjs', objs)
		if (objs && objs.length)
		{
			var editor = this.getEditor();
			editor.beginUpdateObject();
			try
			{
				var actualObjs = this.doGetActualRemovedObjs(objs);
				this.doRemoveObjs(actualObjs);
			}
			finally
			{
				editor.endUpdateObject();
			}
		}
	},
	/** @private */
	doRemoveObjs: function(objs)
	{
		// do actual remove job
	},

	doGetActualRemovedObjs: function(objs)
	{
		console.log('@@@ doGetActualRemovedObjs', objs)
		const actualObjs = objs.filter(x => x.CLASS_NAME !== 'Kekule.Glyph.PathGlyphArcConnectorControlNode');
		console.log('@@@ doGetActualRemovedObjs (filtered)', actualObjs)
		return objs;
	},

	/**
	 * Remove selected objects in editor.
	 */
	removeSelection: function()
	{
		var editor = this.getEditor();
		console.log('@@@ removeSelection', editor.getSelection())
		this.removeObjs(editor.getSelection());
		// the selection is currently empty
		editor.deselectAll();
	},

	/**
	 * Remove object on screen coord.
	 * @param {Hash} coord
	 */
	removeOnScreenCoord: function(coord)
	{
		var obj = this.getEditor().getTopmostBasicObjectAtCoord(coord);
		if (obj)
		{
			console.log('@@@ removeOnScreenCoord', obj)
			this.removeObjs([obj]);
			return true;
		}
		else
			return false;
	},

	/** @private */
	startRemove: function()
	{
		this._isExecuting = true;
	},
	/** @private */
	endRemove: function()
	{
		this._isExecuting = false;
	},
	/** @private */
	isRemoving: function()
	{
		return this._isExecuting;
	},

	/** @private */
	react_pointerdown: function(e)
	{
		if (e.getButton() === Kekule.X.Event.MOUSE_BTN_LEFT)
		{
			this.startRemove();
			var coord = this._getEventMouseCoord(e);
			this.removeOnScreenCoord(coord);
			e.preventDefault();
		}
		else if (e.getButton() === Kekule.X.Event.MOUSE_BTN_RIGHT)
		{
			this.endRemove();
			e.preventDefault();
		}
	},
	/** @private */
	react_pointerup: function(e)
	{
		if (e.getButton() === Kekule.X.Event.MOUSE_BTN_LEFT)
		{
			this.endRemove();
			e.preventDefault();
		}
	},
	/** @private */
	react_pointermove: function($super, e)
	{
		$super(e);
		if (this.isRemoving())
		{
			var coord = this._getEventMouseCoord(e);
			this.removeOnScreenCoord(coord);
			e.preventDefault();
		}
		return true;
	}
});

/** @ignore */
Kekule.Editor.IaControllerManager.register(Kekule.Editor.BasicEraserIaController, Kekule.Editor.BaseEditor);

/**
 * Controller for selecting, moving or rotating objects in editor.
 * @class
 * @augments Kekule.Widget.BaseEditorIaController
 *
 * @param {Kekule.Editor.BaseEditor} widget Editor of current object being installed to.
 *
 * @property {Int} selectMode Set the selectMode property of editor.
 * @property {Bool} enableSelect Whether select function is enabled.
 * @property {Bool} enableMove Whether move function is enabled.
 * //@property {Bool} enableRemove Whether remove function is enabled.
 * @property {Bool} enableResize Whether resize of selection is allowed.
 * @property {Bool} enableRotate Whether rotate of selection is allowed.
 * @property {Bool} enableGestureManipulation Whether rotate and resize by touch gestures are allowed.
 */
Kekule.Editor.BasicManipulationIaController = Class.create(Kekule.Editor.BaseEditorIaController,
/** @lends Kekule.Editor.BasicManipulationIaController# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.BasicManipulationIaController',
	/** @constructs */
	initialize: function($super, widget)
	{
		$super(widget);
		this.setState(Kekule.Editor.BasicManipulationIaController.State.NORMAL);

		this.setEnableSelect(false);
		this.setEnableGestureManipulation(false);
		this.setEnableMove(true);
		this.setEnableResize(true);
		this.setEnableAspectRatioLockedResize(true);
		this.setEnableRotate(true);

		this._suppressConstrainedResize = false;
		this._manipulationStepBuffer = {};
		this._suspendedOperations = null;
		this.execManipulationStepBind = this.execManipulationStep.bind(this);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('selectMode', {'dataType': DataType.INT, 'serializable': false});
		this.defineProp('enableSelect', {'dataType': DataType.BOOL, 'serializable': false});
		this.defineProp('enableMove', {'dataType': DataType.BOOL, 'serializable': false});
		//this.defineProp('enableRemove', {'dataType': DataType.BOOL, 'serializable': false});
		this.defineProp('enableResize', {'dataType': DataType.BOOL, 'serializable': false});
		this.defineProp('enableRotate', {'dataType': DataType.BOOL, 'serializable': false});
		this.defineProp('enableGestureManipulation', {'dataType': DataType.BOOL, 'serializable': false});
		this.defineProp('state', {'dataType': DataType.INT, 'serializable': false});
		// the screen coord that start this manipulation, since startCoord may be changed during rotation, use this
		// to get the inital coord of mouse down
		this.defineProp('baseCoord', {'dataType': DataType.HASH, 'serializable': false});
		this.defineProp('startCoord', {'dataType': DataType.HASH, 'serializable': false/*,
		 'setter': function(value)
		 {
		 console.log('set startCoord', value);
		 console.log(arguments.callee.caller.caller.caller.toString());
		 this.setPropStoreFieldValue('startCoord', value);
		 }*/
		});
		this.defineProp('endCoord', {'dataType': DataType.HASH, 'serializable': false});
		this.defineProp('startBox', {'dataType': DataType.HASH, 'serializable': false});
		this.defineProp('endBox', {'dataType': DataType.HASH, 'serializable': false});
		this.defineProp('lastRotateAngle', {'dataType': DataType.FLOAT, 'serializable': false});  // private
		// private, such as {x: 1, y: 0}, plays as the initial base direction of rotation
		this.defineProp('rotateRefCoord', {'dataType': DataType.HASH, 'serializable': false});
		this.defineProp('rotateCenter', {'dataType': DataType.HASH, 'serializable': false,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('rotateCenter');
				if (!result)
				{
					/*
					var box = this.getStartBox();
					result = box? {'x': (box.x1 + box.x2) / 2, 'y': (box.y1 + box.y2) / 2}: null;
          */
					var centerCoord = this._getManipulateObjsCenterCoord();
					result = this.getEditor().objCoordToScreen(centerCoord);
					this.setPropStoreFieldValue('rotateCenter', result);
					//console.log(result, result2);
				}
				return result;
			}
		});

		this.defineProp('resizeStartingRegion', {'dataType': DataType.INT, 'serializable': false});  // private
		this.defineProp('enableAspectRatioLockedResize', {'dataType': DataType.BOOL, 'serializable': false});

		this.defineProp('rotateStartingRegion', {'dataType': DataType.INT, 'serializable': false});  // private

		this.defineProp('manipulateOriginObjs', {'dataType': DataType.ARRAY, 'serializable': false});  // private, the direct object user act on
		this.defineProp('manipulateObjs', {'dataType': DataType.ARRAY, 'serializable': false,  // actual manipulated objects
			'setter': function(value)
			{
				this.setPropStoreFieldValue('manipulateObjs', value);
				//console.log('set manipulate', value);
				if (!value)
					this.getEditor().endOperatingObjs();
				else
					this.getEditor().prepareOperatingObjs(value);
			}
		});
		this.defineProp('manipulateObjInfoMap', {'dataType': DataType.OBJECT, 'serializable': false, 'setter': null,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('manipulateObjInfoMap');
				if (!result)
				{
					result = new Kekule.MapEx(true);
					this.setPropStoreFieldValue('manipulateObjInfoMap', result);
				}
				return result;
			}
		});
		this.defineProp('manipulateObjCurrInfoMap', {'dataType': DataType.OBJECT, 'serializable': false, 'setter': null,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('manipulateObjCurrInfoMap');
				if (!result)
				{
					result = new Kekule.MapEx(true);
					this.setPropStoreFieldValue('manipulateObjCurrInfoMap', result);
				}
				return result;
			}
		});

		this.defineProp('manipulationType', {'dataType': DataType.INT, 'serializable': false});  // private

		this.defineProp('isManipulatingSelection', {'dataType': DataType.BOOL, 'serializable': false});

		//this.defineProp('manipulateOperation', {'dataType': 'Kekule.MacroOperation', 'serializable': false});  // store operation of moving
		//this.defineProp('activeOperation', {'dataType': 'Kekule.MacroOperation', 'serializable': false}); // store operation that should be add to history

		this.defineProp('moveOperations', {'dataType': DataType.ARRAY, 'serializable': false});  // store operations of moving
		//this.defineProp('mergeOperations', {'dataType': DataType.ARRAY, 'serializable': false});  // store operations of merging

		this.defineProp('objOperationMap', {'dataType': 'Kekule.MapEx', 'serializable': false,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('objOperationMap');
				if (!result)
				{
					result = new Kekule.MapEx(true);
					this.setPropStoreFieldValue('objOperationMap', result);
				}
				return result;
			}
		});  // store operation on each object
	},
	/** @private */
	doFinalize: function($super)
	{
		var map = this.getPropStoreFieldValue('manipulateObjInfoMap');
		if (map)
			map.clear();
		map = this.getPropStoreFieldValue('objOperationMap');
		if (map)
			map.clear();
		$super();
	},

	/* @ignore */
	/*
	activated: function($super, widget)
	{
		$super(widget);
		//console.log('activated', this.getSelectMode());
		// set select mode when be activated
		if (this.getEnableSelect())
			this.getEditor().setSelectMode(this.getSelectMode());
	},
	*/

	/** @ignore */
	hotTrackOnObj: function($super, obj)
	{
		// override parent method, is selectMode is ANCESTOR, hot track the whole ancestor object
		if (this.getEnableSelect() && this.getSelectMode() === Kekule.Editor.SelectMode.ANCESTOR)
		{
			var concreteObj = this.getStandaloneAncestor(obj); (obj && obj.getStandaloneAncestor) ? obj.getStandaloneAncestor() : obj;
			return $super(concreteObj);
		}
		else
			return $super(obj);
	},
	/** @private */
	getStandaloneAncestor: function(obj)
	{
		return (obj && obj.getStandaloneAncestor) ? obj.getStandaloneAncestor() : obj;
	},
	/** @private */
	isInAncestorSelectMode: function()
	{
		return this.getEnableSelect() && (this.getSelectMode() === Kekule.Editor.SelectMode.ANCESTOR);
	},

	/** @private */
	isAspectRatioLockedResize: function()
	{
		return this.getEnableAspectRatioLockedResize() && (!this._suppressConstrainedResize);
	},

	/**
	 * Check if screenCoord is on near-outside of selection bound and returns which corner is the neraest.
	 * @param {Hash} screenCoord
	 * @returns {Variant} If on rotation region, a nearest corner flag (from @link Kekule.Editor.BoxRegion} will be returned,
	 *   else false will be returned.
	 */
	getCoordOnSelectionRotationRegion: function(screenCoord)
	{
		var R = Kekule.Editor.BoxRegion;
		var editor = this.getEditor();
		var region = editor.getCoordRegionInSelectionMarker(screenCoord);
		if (region !== R.OUTSIDE)
			return false;

		var r = editor.getEditorConfigs().getInteractionConfigs().getRotationRegionInflation();
		var box = editor.getUiSelectionAreaContainerBox();
		if (box && editor.hasSelection())
		{
			var corners = [R.CORNER_TL, R.CORNER_TR, R.CORNER_BR, R.CORNER_BL];
			var points = [
				{'x': box.x1, 'y': box.y1},
				{'x': box.x2, 'y': box.y1},
				{'x': box.x2, 'y': box.y2},
				{'x': box.x1, 'y': box.y2}
			];
			var result = false;
			var minDis = r;
			for (var i = 0, l = corners.length; i < l; ++i)
			{
				var corner = corners[i];
				var point = points[i];
				var dis = Kekule.CoordUtils.getDistance(point, screenCoord);
				if (dis <= minDis)
				{
					result = corner;
					minDis = dis;
				}
			}
			return result;
		}
		else
			return false;
	},

	/**
	 * Create a coord change operation to add to operation history of editor.
	 * The operation is a macro one with sub operations on each obj.
	 * @private
	 */
	createManipulateOperation: function()
	{
		return this.doCreateManipulateMoveAndResizeOperation();
	},
	/** @private */
	doCreateManipulateMoveAndResizeOperation: function()
	{
		//var oper = new Kekule.MacroOperation();
		var opers = [];
		this.setMoveOperations(opers);
		var objs = this.getManipulateObjs();
		var map = this.getManipulateObjInfoMap();
		var operMap = this.getObjOperationMap();
		operMap.clear();
		//console.log('init operations');
		for (var i = 0, l = objs.length; i < l; ++i)
		{
			var obj = objs[i];
			var item = map.get(obj);
			//var sub = new Kekule.EditorOperation.OpSetObjCoord(this.getEditor(), obj, null, item.objCoord, Kekule.Editor.CoordSys.OBJ);
			//var sub = new Kekule.ChemObjOperation.MoveTo(obj, null, this.getEditor().getCoordMode());
			var sub = new Kekule.ChemObjOperation.MoveAndResize(obj, null, null, this.getEditor().getCoordMode(), true, this.getEditor());  // use abs coord
			sub.setAllowCoordBorrow(this.getEditor().getAllowCoordBorrow());
			sub.setOldCoord(item.objCoord);
			sub.setOldDimension(item.size);
			//oper.add(sub);
			//operMap.set(obj, sub);
			opers.push(sub);
		}
		//this.setManipulateOperation(oper);
		//this.setActiveOperation(oper);
		//return oper;
		return opers;
	},
	/* @private */
	/*
	_ensureObjOperationToMove: function(obj)
	{
		var map = this.getObjOperationMap();
		var oper = map.get(obj);
		if (oper && !(oper instanceof Kekule.ChemObjOperation.MoveAndResize))
		{
			//console.log('_ensureObjOperationToMove reverse');
			//oper.reverse();
			oper.finalize();
			oper = new Kekule.ChemObjOperation.MoveAndResize(obj, null, null, this.getEditor().getCoordMode(), true);  // use abs coord
			map.set(obj, oper);
		}
		return oper;
	},
	*/
	/**
	 * Update new coord info of sub operations.
	 * @private
	 */
	updateChildMoveOperation: function(objIndex, obj, newObjCoord)
	{
		//console.log('update move', newObjCoord);
		//var oper = this.getManipulateOperation().getChildAt(objIndex);
		//var oper = this._ensureObjOperationToMove(obj);
		var oper = this.getMoveOperations()[objIndex];
		//oper.setCoord(newObjCoord);
		oper.setNewCoord(newObjCoord);
	},
	/** @private */
	updateChildResizeOperation: function(objIndex, obj, newDimension)
	{
		//var oper = this.getManipulateOperation().getChildAt(objIndex);
		//var oper = this._ensureObjOperationToMove(obj);
		var oper = this.getMoveOperations()[objIndex];
		oper.setNewDimension(newDimension);
	},

	/** @private */
	getAllObjOperations: function(isTheFinalOperationToEditor)
	{
		//var opers = this.getObjOperationMap().getValues();
		var op = this.getMoveOperations();
		var opers = op? Kekule.ArrayUtils.clone(op): [];
		return opers;
	},

	/** @private */
	getActiveOperation: function(isTheFinalOperationToEditor)
	{
		//console.log('get active operation', isTheFinalOperationToEditor);
		var opers = this.getAllObjOperations(isTheFinalOperationToEditor);
		opers = Kekule.ArrayUtils.toUnique(opers);
		if (opers.length <= 0)
			return null;
		else if (opers.length === 1)
			return opers[0];
		else
		{
			var macro = new Kekule.MacroOperation(opers);
			return macro;
		}
	},
	/** @private */
	reverseActiveOperation: function()
	{
		var oper = this.getActiveOperation();
		return oper.reverse();
	},
	/* @private */
	/*
	clearActiveOperation: function()
	{
		//this.getObjOperationMap().clear();
	},
	*/

	/** @private */
	addOperationToEditor: function()
	{
		var editor = this.getEditor();
		if (editor && editor.getEnableOperHistory())
		{
			//console.log('add oper to editor', this.getClassName(), this.getActiveOperation());
			//editor.pushOperation(this.getActiveOperation());
			/*
			var opers = this.getAllObjOperations();
			var macro = new Kekule.MacroOperation(opers);
			editor.pushOperation(macro);
			*/
			var op = this.getActiveOperation(true);
			if (op)
				editor.pushOperation(op);
		}
	},

	// methods about object move / resize
	/** @private */
	getCurrAvailableManipulationTypes: function()
	{
		var T = Kekule.Editor.BasicManipulationIaController.ManipulationType;
		var box = this.getEditor().getSelectionContainerBox();
		if (!box)
		{
			return [];
		}
		else
		{
			var result = [];
			if (this.getEnableMove())
				result.push(T.MOVE);
			// if box is a single point, can not resize or rotate
			if (!Kekule.NumUtils.isFloatEqual(box.x1, box.x2, 1e-10) || !Kekule.NumUtils.isFloatEqual(box.y1, box.y2, 1e-10))
			{
				if (this.getEnableResize())
					result.push(T.RESIZE);
				if (this.getEnableRotate())
					result.push(T.ROTATE);
				if (this.getEnableResize() || this.getEnableRotate())
					result.push(T.TRANSFORM);
			}
			return result;
		}
	},

	/** @private */
	getActualManipulatingObjects: function(objs)
	{
		var result = [];
		for (var i = 0, l = objs.length; i < l; ++i)
		{
			var obj = objs[i];
			var actualObjs = obj.getCoordDependentObjects? obj.getCoordDependentObjects(): [obj];
			Kekule.ArrayUtils.pushUnique(result, actualObjs);
		}
		return result;
	},

	/*
	 * Prepare to resize resizingObjs.
	 * Note that resizingObjs may differ from actual resized objects (for instance, resize a bond actually move its connected atoms).
	 * @param {Hash} startContextCoord Mouse position when starting to move objects. This coord is based on context.
	 * @param {Array} resizingObjs Objects about to be resized.
	 * @private
	 */
	/*
	prepareResizing: function(startScreenCoord, startBox, movingObjs)
	{
		var actualObjs = this.getActualResizingObject(movingObjs);
		this.setManipulateObjs(actualObjs);
		var map = this.getManipulateObjInfoMap();
		map.clear();
		var editor = this.getEditor();
		// store original objs coords info into map
		for (var i = 0, l = actualObjs.length; i < l; ++i)
		{
			var obj = actualObjs[i];
			var info = this.createManipulateObjInfo(obj, startScreenCoord);
			map.set(obj, info);
		}
		this.setStartBox(startBox);
	},
	*/

	/** @private */
	doPrepareManipulatingObjects: function(manipulatingObjs, startScreenCoord)
	{
		var actualObjs = this.getActualManipulatingObjects(manipulatingObjs);
		//console.log(manipulatingObjs, actualObjs);
		this.setManipulateOriginObjs(manipulatingObjs);
		this.setManipulateObjs(actualObjs);
		var map = this.getManipulateObjInfoMap();
		map.clear();
		//this.getManipulateObjCurrInfoMap().clear();
		var editor = this.getEditor();
		// store original objs coords info into map
		for (var i = 0, l = actualObjs.length; i < l; ++i)
		{
			var obj = actualObjs[i];
			var info = this.createManipulateObjInfo(obj, i, startScreenCoord);
			map.set(obj, info);
		}
	},
	/** @private */
	doPrepareManipulatingStartingCoords: function(startScreenCoord, startBox, rotateCenter, rotateRefCoord)
	{
		this.setStartBox(startBox);
		this.setRotateCenter(rotateCenter);
		this.setRotateRefCoord(rotateRefCoord);
		this.setLastRotateAngle(null);
	}, /**
	 * Prepare to move movingObjs.
	 * Note that movingObjs may differ from actual moved objects (for instance, move a bond actually move its connected atoms).
	 * @param {Hash} startContextCoord Mouse position when starting to move objects. This coord is based on context.
	 * @param {Array} manipulatingObjs Objects about to be moved or resized.
	 * @param {Hash} startBox
	 * @param {Hash} rotateCenter
	 * @private
	 */
	prepareManipulating: function(manipulationType, manipulatingObjs, startScreenCoord, startBox, rotateCenter, rotateRefCoord)
	{
		this.setManipulationType(manipulationType);
		this.doPrepareManipulatingObjects(manipulatingObjs, startScreenCoord);
		this.doPrepareManipulatingStartingCoords(startScreenCoord, startBox, rotateCenter, rotateRefCoord);
		this.createManipulateOperation();

		this._runManipulationStepId = window.requestAnimationFrame(this.execManipulationStepBind);
		//this.setManuallyHotTrack(true);  // manully set hot track point when manipulating
	},

	/**
	 * Cancel the moving process and set objects to its original position.
	 * @private
	 */
	cancelManipulate: function()
	{
		var editor = this.getEditor();
		var objs = this.getManipulateObjs();
		//editor.beginUpdateObject();
		//this.getActiveOperation().reverse();
		this.reverseActiveOperation();
		this.notifyCoordChangeOfObjects(this.getManipulateObjs());
		//editor.endUpdateObject();
		//this.setActiveOperation(null);
		//this.clearActiveOperation();
		//this.setManuallyHotTrack(false);
		this.manipulateEnd();
	},
	/**
	 * Returns center coord of manipulate objs.
	 * @private
	 */
	_getManipulateObjsCenterCoord: function()
	{
		var objs = this.getManipulateObjs();
		if (!objs || !objs.length)
			return null;

		var coordMode = this.getEditor().getCoordMode();
		var allowCoordBorrow = this.getEditor().getAllowCoordBorrow();
		var sum = {'x': 0, 'y': 0, 'z': 0};
		for (var i = 0, l = objs.length; i < l; ++i)
		{
			var obj = objs[i];
			var objCoord = obj.getAbsBaseCoord? obj.getAbsBaseCoord(coordMode, allowCoordBorrow):
					obj.getAbsCoord? obj.getAbsCoord(coordMode, allowCoordBorrow):
					obj.getCoordOfMode? obj.getCoordOfMode(coordMode, allowCoordBorrow):
					null;
			if (objCoord)
				sum = Kekule.CoordUtils.add(sum, objCoord);
		}
		return Kekule.CoordUtils.divide(sum, objs.length);
	},

	/**
	 * Called when a phrase of rotate/resize/move function ends.
	 */
	_maniplateObjsFrameEnd: function(objs)
	{
		// do nothing here
	},

	/** @private */
	_addManipultingObjNewInfo: function(obj, newInfo)
	{
		var newInfoMap = this.getManipulateObjCurrInfoMap();
		var info = newInfoMap.get(obj) || {};
		info = Object.extend(info, newInfo);
		newInfoMap.set(obj, info);
	},
	/** @private */
	applyManipulatingObjsInfo: function(endScreenCoord)
	{
		var objs = this.getManipulateObjs();
		var newInfoMap = this.getManipulateObjCurrInfoMap();
		for (var i = 0, l = objs.length; i < l; ++i)
		{
			var obj = objs[i];
			var newInfo = newInfoMap.get(obj);
			this.applySingleManipulatingObjInfo(i, obj, newInfo, endScreenCoord);
		}
	},
	/** @private */
	applySingleManipulatingObjInfo: function(objIndex, obj, newInfo, endScreenCoord)
	{
		if (newInfo)
		{
			if (newInfo.screenCoord)
				this.doMoveManipulatedObj(objIndex, obj, newInfo.screenCoord, endScreenCoord);
			if (newInfo.size)
				this.doResizeManipulatedObj(objIndex, obj, newInfo.size);
		}
	},

	/** @private */
	_calcRotateAngle: function(endScreenCoord)
	{
		var C = Kekule.CoordUtils;
		var angle;
		var angleCalculated = false;
		var rotateCenter = this.getRotateCenter();
		var startCoord = this.getRotateRefCoord() || this.getStartCoord();

		// ensure startCoord large than threshold
		var threshold = this.getEditorConfigs().getInteractionConfigs().getRotationLocationPointDistanceThreshold();
		if (threshold)
		{
			var startDistance = C.getDistance(startCoord, rotateCenter);
			if (startDistance < threshold)
			{
				angle = 0;  // do not rotate
				angleCalculated = true;
				// and use endScreen coord as new start coord
				this.setStartCoord(endScreenCoord);
				return false;
			}
			var endDistance = C.getDistance(endScreenCoord, rotateCenter);
			if (endDistance < threshold)
			{
				angle = 0;  // do not rotate
				angleCalculated = true;
				return false;
			}
		}

		if (!angleCalculated)
		{
			var vector = C.substract(endScreenCoord, rotateCenter);
			var endAngle = Math.atan2(vector.y, vector.x);
			vector = C.substract(startCoord, rotateCenter);
			var startAngle = Math.atan2(vector.y, vector.x);
			angle = endAngle - startAngle;
		}

		return {'angle': angle, 'startAngle': startAngle, 'endAngle': endAngle};
	},
	/** @private */
	_calcActualRotateAngle: function(objs, newDeltaAngle, oldAbsAngle, newAbsAngle)
	{
		return newDeltaAngle;
	},
	/** @private */
	_calcManipulateObjsRotationParams: function(manipulatingObjs, endScreenCoord)
	{
		if (!this.getEnableRotate())
			return false;

		var rotateCenter = this.getRotateCenter();

		var angleInfo = this._calcRotateAngle(endScreenCoord);
		if (!angleInfo)  // need not to rotate
			return false;

		// get actual rotation angle
		var angle = this._calcActualRotateAngle(manipulatingObjs, angleInfo.angle, angleInfo.startAngle, angleInfo.endAngle);

		var lastAngle = this.getLastRotateAngle();
		if (Kekule.ObjUtils.notUnset(lastAngle) && Kekule.NumUtils.isFloatEqual(angle, lastAngle, 0.0175))  // ignore angle change under 1 degree
		{
			return false;  // no angle change, do not rotate
		}
		//console.log('rotateAngle', angle, lastAngle);
		this.setLastRotateAngle(angle);

		return {'center': rotateCenter, 'rotateAngle': angle};
	},


	/* @private */
	/*
	doRotateManipulatedObjs: function(endScreenCoord, transformParams)
	{
		var byPassRotate = !this._calcManipulateObjsTransformInfo(this.getManipulateObjs(), transformParams);
		if (byPassRotate)  // need not to rotate
		{
			//console.log('bypass rotate');
			return;
		}
		//console.log('rotate');

		var objNewInfo = this.getManipulateObjCurrInfoMap();

		var editor = this.getEditor();
		editor.beginUpdateObject();
		try
		{
			var objs = this.getManipulateObjs();
			this.applyManipulatingObjsInfo(endScreenCoord);
			this._maniplateObjsFrameEnd(objs);
			this.notifyCoordChangeOfObjects(objs);
		}
		finally
		{
			editor.endUpdateObject();
			this.manipulateStepDone();
		}
	},
	*/

	/*
	 * Rotate manupulatedObjs according to endScreenCoord.
	 * @private
	 */
	/*
	rotateManipulatedObjs: function(endScreenCoord)
	{
		var R = Kekule.Editor.BoxRegion;
		var C = Kekule.CoordUtils;
		//var editor = this.getEditor();
		var changedObjs = [];
		//console.log('rotate', this.getRotateCenter(), endScreenCoord);
		var rotateParams = this._calcManipulateObjsRotationParams(this.getManipulateObjs(), endScreenCoord);
		if (!rotateParams)
			return;

		this.doRotateManipulatedObjs(endScreenCoord, rotateParams);
	},
	*/
	/** @private */
	_calcActualResizeScales: function(objs, newScales)
	{
		return newScales;
	},

	/** @private */
	_calcManipulateObjsResizeParams: function(manipulatingObjs, startingRegion, endScreenCoord)
	{
		if (!this.getEnableResize())
			return false;

		var R = Kekule.Editor.BoxRegion;
		var C = Kekule.CoordUtils;

		var box = this.getStartBox();

		var coordDelta = C.substract(endScreenCoord, this.getStartCoord());
		var scaleCenter;
		var doConstraint, doConstraintOnX, doConstraintOnY;
		if (startingRegion === R.EDGE_TOP)
		{
			coordDelta.x = 0;
			scaleCenter = {'x': (box.x1 + box.x2) / 2, 'y': box.y2};
		}
		else if (startingRegion === R.EDGE_BOTTOM)
		{
			coordDelta.x = 0;
			scaleCenter = {'x': (box.x1 + box.x2) / 2, 'y': box.y1};
		}
		else if (startingRegion === R.EDGE_LEFT)
		{
			coordDelta.y = 0;
			scaleCenter = {'x': box.x2, 'y': (box.y1 + box.y2) / 2};
		}
		else if (startingRegion === R.EDGE_RIGHT)
		{
			coordDelta.y = 0;
			scaleCenter = {'x': box.x1, 'y': (box.y1 + box.y2) / 2};
		}
		else // resize from corner
		{
			if (this.isAspectRatioLockedResize())
			{
				doConstraint = true;
				/*
				var widthHeightRatio = (box.x2 - box.x1) / (box.y2 - box.y1);
				var currRatio = coordDelta.x / coordDelta.y;
				if (Math.abs(currRatio) > widthHeightRatio)
					//coordDelta.x = coordDelta.y * widthHeightRatio * (Math.sign(currRatio) || 1);
					doConstraintOnY = true;
				else
					//coordDelta.y = coordDelta.x / widthHeightRatio * (Math.sign(currRatio) || 1);
					doConstraintOnX = true;
				*/
			}

			scaleCenter = (startingRegion === R.CORNER_TL)? {'x': box.x2, 'y': box.y2}:
					(startingRegion === R.CORNER_TR)? {'x': box.x1, 'y': box.y2}:
							(startingRegion === R.CORNER_BL)? {'x': box.x2, 'y': box.y1}:
							{'x': box.x1, 'y': box.y1};
		}
		var reversedX = (startingRegion === R.CORNER_TL) || (startingRegion === R.CORNER_BL) || (startingRegion === R.EDGE_LEFT);
		var reversedY = (startingRegion === R.CORNER_TL) || (startingRegion === R.CORNER_TR) || (startingRegion === R.EDGE_TOP);

		// calc transform matrix
		var scaleX, scaleY;
		if (Kekule.NumUtils.isFloatEqual(box.x1, box.x2, 1e-10))  // box has no x size, can not scale on x
			scaleX = 1;
		else
			scaleX = 1 + coordDelta.x / (box.x2 - box.x1) * (reversedX? -1: 1);
		if (Kekule.NumUtils.isFloatEqual(box.y1, box.y2, 1e-10))   // box has no y size, can not scale on y
			scaleY = 1;
		else
			scaleY = 1 + coordDelta.y / (box.y2 - box.y1) * (reversedY? -1: 1);

		if (doConstraint)
		{
			var absX = Math.abs(scaleX), absY = Math.abs(scaleY);
			if (absX >= absY)
				scaleY = (Math.sign(scaleY) || 1) * absX;    // avoid sign = 0
			else
				scaleX = (Math.sign(scaleX) || 1) * absY;
		}

		var actualScales = this._calcActualResizeScales(manipulatingObjs, {'scaleX': scaleX, 'scaleY': scaleY});
		var transformParams = {'center': scaleCenter, 'scaleX': actualScales.scaleX, 'scaleY': actualScales.scaleY};
		//console.log(this.isAspectRatioLockedResize(), scaleX, scaleY);
		//console.log('startBox', box);
		//console.log('transformParams', transformParams);

		return transformParams;
	},

	/* @private */
	/*
	_calcManipulateObjsResizeInfo: function(manipulatingObjs, startingRegion, endScreenCoord)
	{
		var R = Kekule.Editor.BoxRegion;
		var C = Kekule.CoordUtils;

		var transformOps = this._calcManipulateObjsResizeParams(manipulatingObjs, startingRegion, endScreenCoord);
		//console.log(scaleX, scaleY);

		this._calcManipulateObjsTransformInfo(manipulatingObjs, transformOps);

		return true;
	},
	*/

	/** @private */
	_calcManipulateObjsTransformInfo: function(manipulatingObjs, transformParams)
	{
		var C = Kekule.CoordUtils;

		// since we transform screen coord, it will always be in 2D mode
		// and now the editor only supports 2D
		var is3D = false;  // this.getEditor().getCoordMode() === Kekule.CoordMode.COORD3D;
		var transformMatrix = is3D? C.calcTransform3DMatrix(transformParams): C.calcTransform2DMatrix(transformParams);

		var scaleX = transformParams.scaleX || transformParams.scale;
		var scaleY = transformParams.scaleY || transformParams.scale;

		for (var i = 0, l = manipulatingObjs.length; i < l; ++i)
		{
			var obj = manipulatingObjs[i];
			var info = this.getManipulateObjInfoMap().get(obj);
			var newInfo = {};
			if (!info.hasNoCoord)  // this object has coord property and can be rotated
			{
				var oldCoord = info.screenCoord;
				var newCoord = C.transform2DByMatrix(oldCoord, transformMatrix);
				newInfo.screenCoord = newCoord;
				//this._addManipultingObjNewInfo(obj, {'screenCoord': newCoord});
			}
			// TODO: may need change dimension also
			if (info.size && (scaleX || scaleY))
			{
				var newSize = {'x': info.size.x * Math.abs(scaleX || 1), 'y': info.size.y * Math.abs(scaleY || 1)};
				newInfo.size = newSize;
			}
			this._addManipultingObjNewInfo(obj, newInfo);
		}

		return true;
	},

	/*
	 * Resize manupulatedObjs according to endScreenCoord.
	 * @private
	 */
	/*
	doResizeManipulatedObjs: function(endScreenCoord)
	{
		var editor = this.getEditor();
		var objs = this.getManipulateObjs();
		//var changedObjs = [];

		this._calcManipulateObjsResizeInfo(objs, this.getResizeStartingRegion(), endScreenCoord);

		editor.beginUpdateObject();
		var newInfoMap = this.getManipulateObjCurrInfoMap();
		try
		{
			this.applyManipulatingObjsInfo(endScreenCoord);
			this._maniplateObjsFrameEnd(objs);
			this.notifyCoordChangeOfObjects(objs);
		}
		finally
		{
			editor.endUpdateObject();
			this.manipulateStepDone();
		}
	},
	*/

	/**
	 * Transform manupulatedObjs according to manipulateType(rotate/resize) endScreenCoord.
	 * @private
	 */
	doTransformManipulatedObjs: function(manipulateType, endScreenCoord, explicitTransformParams)
	{
		var T = Kekule.Editor.BasicManipulationIaController.ManipulationType;

		var editor = this.getEditor();
		var objs = this.getManipulateObjs();
		//var changedObjs = [];

		var transformParams = explicitTransformParams;
		if (!transformParams)
		{
			if (manipulateType === T.RESIZE)
				transformParams = this._calcManipulateObjsResizeParams(objs, this.getResizeStartingRegion(), endScreenCoord);
			else if (manipulateType === T.ROTATE)
				transformParams = this._calcManipulateObjsRotationParams(objs, endScreenCoord);
		}

		//console.log('do transform', transformParams);

		var doConcreteTransform = transformParams && this._calcManipulateObjsTransformInfo(objs, transformParams);
		if (!doConcreteTransform)
			return;

		editor.beginUpdateObject();
		var newInfoMap = this.getManipulateObjCurrInfoMap();
		try
		{
			this.applyManipulatingObjsInfo(endScreenCoord);
			this._maniplateObjsFrameEnd(objs);
			this.notifyCoordChangeOfObjects(objs);
		}
		finally
		{
			editor.endUpdateObject();
			this.manipulateStepDone();
		}
	},

	/* @private */
	_calcActualMovedScreenCoord: function(obj, info, newScreenCoord)
	{
		return newScreenCoord;
	},

	/** @private */
	_calcManipulateObjsMoveInfo: function(manipulatingObjs, endScreenCoord)
	{
		var C = Kekule.CoordUtils;
		var newInfoMap = this.getManipulateObjCurrInfoMap();
		for (var i = 0, l = manipulatingObjs.length; i < l; ++i)
		{
			var obj = manipulatingObjs[i];
			var info = this.getManipulateObjInfoMap().get(obj);
			if (info.hasNoCoord)  // this object has no coord property and can not be moved
				continue;
			var newScreenCoord = C.add(endScreenCoord, info.screenCoordOffset);
			newScreenCoord = this._calcActualMovedScreenCoord(obj, info, newScreenCoord);
			this._addManipultingObjNewInfo(obj, {'screenCoord': newScreenCoord});
		}
	},

	/**
	 * Move objects in manipulateObjs array to new position. New coord is determinated by endContextCoord
	 * and each object's offset.
	 * @private
	 */
	moveManipulatedObjs: function(endScreenCoord)
	{
		var C = Kekule.CoordUtils;
		var editor = this.getEditor();
		var objs = this.getManipulateObjs();
		var changedObjs = [];

		this._calcManipulateObjsMoveInfo(objs, endScreenCoord);

		editor.beginUpdateObject();
		var newInfoMap = this.getManipulateObjCurrInfoMap();
		try
		{
			this.applyManipulatingObjsInfo(endScreenCoord);
			this._maniplateObjsFrameEnd(objs);
			// notify
			this.notifyCoordChangeOfObjects(objs);
		}
		finally
		{
			editor.endUpdateObject();
			this.manipulateStepDone();
		}
	},
	/**
	 * Move a single object to newScreenCoord. MoverScreenCoord is the actual coord of mouse.
	 * Note that not only move operation will call this method, rotate and resize may also affect
	 * objects' coord so this method will also be called.
	 * @private
	 */
	doMoveManipulatedObj: function(objIndex, obj, newScreenCoord, moverScreenCoord)
	{
		var editor = this.getEditor();
		this.updateChildMoveOperation(objIndex, obj, editor.screenCoordToObj(newScreenCoord));
		editor.setObjectScreenCoord(obj, newScreenCoord);
	},
	/**
	 * Resize a single object to newDimension.
	 * @private
	 */
	doResizeManipulatedObj: function(objIndex, obj, newSize)
	{
		this.updateChildResizeOperation(objIndex, obj, newSize);
		if (obj.setSizeOfMode)
			obj.setSizeOfMode(newSize, this.getEditor().getCoordMode());
	},
	/*
	 * Moving complete, do the wrap up job.
	 * @private
	 */
	/*
	endMoving: function()
	{
		this.stopManipulate();
	},
	*/
	/**
	 * Click on a object or objects and manipulate it directly.
	 * @private
	 */
	startDirectManipulate: function(manipulateType, objOrObjs, startCoord, startBox, rotateCenter, rotateRefCoord)
	{
		var objs = Kekule.ArrayUtils.toArray(objOrObjs);
		this.setState(Kekule.Editor.BasicManipulationIaController.State.MANIPULATING);
		this.setBaseCoord(startCoord);
		this.setStartCoord(startCoord);
		this.setRotateRefCoord(rotateRefCoord);
		this.setIsManipulatingSelection(false);
		//console.log('call prepareManipulating', startCoord, manipulateType, objOrObjs);
		this.prepareManipulating(manipulateType || Kekule.Editor.BasicManipulationIaController.ManipulationType.MOVE, objs, startCoord, startBox, rotateCenter, rotateRefCoord);
	},
	/**
	 * Called when a manipulation is applied and the changes has been reflected in editor (editor redrawn done).
	 * Descendants may override this method.
	 * @private
	 */
	manipulateStepDone: function()
	{
		// do nothing here
	},
	/**
	 * Called when a manipulation is ended (stopped or cancelled).
	 * Descendants may override this method.
	 * @private
	 */
	manipulateEnd: function()
	{
		if (this._runManipulationStepId)
		{
			window.cancelAnimationFrame(this._runManipulationStepId);
			this._runManipulationStepId = null;
		}
		var editor = this.getEditor();
		editor.endManipulateObject();
	},
	/**
	 * Called before method stopManipulate.
	 * Descendants may do some round-off work here.
	 * @private
	 */
	manipulateBeforeStopping: function()
	{
		// do nothing here
	},
	/**
	 * Stop manipulate of objects.
	 * @private
	 */
	stopManipulate: function()
	{
		this.setManipulateObjs(null);
		this.getManipulateObjInfoMap().clear();
		this.getObjOperationMap().clear();
		this.manipulateEnd();
	},
	/** @private */
	refreshManipulateObjs: function()
	{
		this.setManipulateObjs(this.getManipulateObjs());
	},
	/** @private */
	createManipulateObjInfo: function(obj, objIndex, startScreenCoord)
	{
		var editor = this.getEditor();
		var info = {
			//'obj': obj,
			'objCoord': editor.getObjCoord(obj),  // abs base coord
			//'objSelfCoord': obj.getCoordOfMode? obj.getCoordOfMode(editor.getCoordMode()): null,
			'screenCoord': editor.getObjectScreenCoord(obj),
			'size': editor.getObjSize(obj)
		};
		info.hasNoCoord = !info.objCoord;
		if (!info.hasNoCoord && startScreenCoord)
			info.screenCoordOffset = Kekule.CoordUtils.substract(info.screenCoord, startScreenCoord);
		return info;
	},

	/** @private */
	notifyCoordChangeOfObjects: function(objs)
	{
		var changedDetails = [];
		var editor = this.getEditor();
		var coordPropName = this.getEditor().getCoordMode() === Kekule.CoordMode.COORD3D? 'coord3D': 'coord2D';
		for (var i = 0, l = objs.length; i < l; ++i)
		{
			var obj = objs[i];
			Kekule.ArrayUtils.pushUnique(changedDetails, {'obj': obj, 'propNames': [coordPropName]});
			var relatedObjs = obj.getCoordDeterminateObjects? obj.getCoordDeterminateObjects(): [obj];
			for (var j = 0, k = relatedObjs.length; j < k; ++j)
				Kekule.ArrayUtils.pushUnique(changedDetails, {'obj': relatedObjs[j], 'propNames': [coordPropName]});
		}
		// notify
		editor.objectsChanged(changedDetails);
	},

	/** @private */
	canInteractWithObj: function(obj)
	{
		return (this.getState() === Kekule.Editor.BasicManipulationIaController.State.NORMAL) && obj;
	},

	/** @ignore */
	doTestMouseCursor: function(coord, e)
	{
		var result = '';
		// since client element is not the same to widget element, coord need to be recalculated
		var c = this._getEventMouseCoord(e, this.getEditor().getEditClientElem());
		if (this.getState() === Kekule.Editor.BasicManipulationIaController.State.NORMAL)
		{
			var R = Kekule.Editor.BoxRegion;
			var region = this.getEditor().getCoordRegionInSelectionMarker(c);
			var result;
			if (this.getEnableSelect())   // show move/rotate/resize marker in select ia controller only
			{
				var T = Kekule.Editor.BasicManipulationIaController.ManipulationType;
				var availManipulationTypes = this.getCurrAvailableManipulationTypes();
				//if (this.getEnableMove())
				if (availManipulationTypes.indexOf(T.MOVE) >= 0)
				{
					result = (region === R.INSIDE)? 'move': '';
				}
				//if (!result && this.getEnableResize())
				if (!result && (availManipulationTypes.indexOf(T.RESIZE) >= 0))
				{
					var result =
						(region === R.CORNER_TL)? 'nwse-resize':
						(region === R.CORNER_TR)? 'nesw-resize':
						(region === R.CORNER_BL)? 'nesw-resize':
						(region === R.CORNER_BR)? 'nwse-resize':
						(region === R.EDGE_TOP) || (region === R.EDGE_BOTTOM)? 'ns-resize':
						(region === R.EDGE_LEFT) || (region === R.EDGE_RIGHT)? 'ew-resize':
						'';
				}
				if (!result)
				{
					//if (this.getEnableRotate())
					if (availManipulationTypes.indexOf(T.ROTATE) >= 0)
					{
						var region = this.getCoordOnSelectionRotationRegion(c);
						if (!!region)
						{
							var SN = Kekule.Widget.StyleResourceNames;
							result = (region === R.CORNER_TL)? SN.CURSOR_ROTATE_NW:
								(region === R.CORNER_TR)? SN.CURSOR_ROTATE_NE:
								(region === R.CORNER_BL)? SN.CURSOR_ROTATE_SW:
								(region === R.CORNER_BR)? SN.CURSOR_ROTATE_SE:
								SN.CURSOR_ROTATE;
							//console.log('rotate cursor', result);
						}
					}
				}
			}
		}
		return result;
	},

	/**
	 * Set operations in suspended state.
	 * @param {Func} immediateOper
	 * @param {Func} delayedOper
	 * @param {Int} delay In ms.
	 * @private
	 */
	setSuspendedOperations: function(immediateOper, delayedOper, delay)
	{
		var self = this;
		this._suspendedOperations = {
			'immediate': immediateOper,
			'delayed': delayedOper,
			'delayExecId': setTimeout(this.execSuspendedDelayOperation.bind(this), delay)
		};
		return this._suspendedOperations;
	},
	/**
	 * Execute the immediate operation in suspended operations, cancelling the delayed one.
	 * @private
	 */
	execSuspendedImmediateOperation: function()
	{
		if (this._suspendedOperations)
		{
			//console.log('exec immediate');
			clearTimeout(this._suspendedOperations.delayExecId);
			var oper = this._suspendedOperations.immediate;
			this._suspendedOperations = null;  // clear old
			return oper.apply(this);
		}
	},
	/**
	 * Execute the delayed operation in suspended operations, cancelling the immediate one.
	 * @private
	 */
	execSuspendedDelayOperation: function()
	{
		if (this._suspendedOperations)
		{
			//console.log('exec delayed');
			clearTimeout(this._suspendedOperations.delayExecId);
			var oper = this._suspendedOperations.delayed;
			this._suspendedOperations = null;  // clear old
			return oper.apply(this);
		}
	},
	/**
	 * Halt all suspend operations.
	 * @private
	 */
	haltSuspendedOperations: function()
	{
		if (this._suspendedOperations)
		{
			clearTimeout(this._suspendedOperations.delayExecId);
			this._suspendedOperations = null;  // clear old
		}
	},

	/** @private */
	_startNewSelecting: function(startCoord, shifted)
	{
		if (this.getEnableSelect())
		{
			this.getEditor().startSelecting(startCoord, shifted || this.getEditor().getIsToggleSelectOn());
			this.setState(Kekule.Editor.BasicManipulationIaController.State.SELECTING);
		}
	},
	/** @private */
	_startOffSelectionManipulation: function(currCoord)
	{
		//console.log('off selection!');
		this.beginManipulation(currCoord, null, Kekule.Editor.BasicManipulationIaController.ManipulationType.MOVE);
		this.getEditor().pulseSelectionAreaMarker();  // pulse selection, reach the user's attention
	},

	/**
	 * Begin a manipulation.
	 * Descendants may override this method.
	 * @param {Hash} currCoord Current coord of pointer (mouse or touch)
	 * @param {Object} e Pointer (mouse or touch) event parameter.
	 */
	beginManipulation: function(currCoord, e, explicitManipulationType)
	{
		var S = Kekule.Editor.BasicManipulationIaController.State;
		var T = Kekule.Editor.BasicManipulationIaController.ManipulationType;
		var availManipulationTypes = this.getCurrAvailableManipulationTypes();

		var evokedByTouch = e && e.pointerType === 'touch'; // edge resize/rotate will be disabled in touch

		var editor = this.getEditor();
		editor.beginManipulateObject();

		this.setBaseCoord(currCoord);
		this.setStartCoord(currCoord);

		// check if mouse just on an object, if so, direct manipulation mode
		var hoveredObj = this.getEditor().getTopmostBasicObjectAtCoord(currCoord, this.getCurrBoundInflation());
		if (hoveredObj && !evokedByTouch)  // mouse down directly on a object
		{
			//hoveredObj = hoveredObj.getNearestSelectableObject();
			if (this.isInAncestorSelectMode())
				hoveredObj = this.getStandaloneAncestor(hoveredObj);
			hoveredObj = hoveredObj.getNearestMovableObject();
			if (this.getEnableMove())
			{
				this.startDirectManipulate(null, hoveredObj, currCoord);
				return;
			}
		}

		var coordRegion = currCoord && this.getEditor().getCoordRegionInSelectionMarker(currCoord);
		var R = Kekule.Editor.BoxRegion;
		var rotateRegion = currCoord && this.getCoordOnSelectionRotationRegion(currCoord);

		// test manipulate type
		/*
		var isTransform = (this.getEnableResize() || this.getEnableRotate())
				&& (explicitManipulationType === T.TRANSFORM);    // gesture transform
		*/
		var isTransform = (availManipulationTypes.indexOf(T.TRANSFORM) >= 0)
				&& (explicitManipulationType === T.TRANSFORM);    // gesture transform
		if (!isTransform)
		{
			var isResize = !evokedByTouch && (availManipulationTypes.indexOf(T.RESIZE) >= 0) //&& this.getEnableResize()
					&& ((explicitManipulationType === T.RESIZE) || ((coordRegion !== R.INSIDE) && (coordRegion !== R.OUTSIDE)));
			var isMove = !isResize && (availManipulationTypes.indexOf(T.MOVE) >= 0) // this.getEnableMove()
					&& ((explicitManipulationType === T.MOVE) || (coordRegion !== R.OUTSIDE));
			var isRotate = !evokedByTouch && !isResize && !isMove && (availManipulationTypes.indexOf(T.ROTATE) >= 0)//this.getEnableRotate()
					&& ((explicitManipulationType === T.ROTATE) || !!rotateRegion);
		}
		else // transform
		{
			this._availTransformTypes = availManipulationTypes;  // stores the available transform types
		}

		// check if already has selection and mouse in selection rect first
		//if (this.getEditor().isCoordInSelectionMarkerBound(coord))
		if (isTransform)
		{
			this.setState(S.MANIPULATING);
			this.setIsManipulatingSelection(true);
			this.setResizeStartingRegion(coordRegion);
			this.setRotateStartingRegion(rotateRegion);
			this.prepareManipulating(T.TRANSFORM, this.getEditor().getSelection(), currCoord, this.getEditor().getSelectionContainerBox());
		}
		else if (isResize)
		{
			this.setState(S.MANIPULATING);
			this.setIsManipulatingSelection(true);
			this.setResizeStartingRegion(/*this.getEditor().getCoordRegionInSelectionMarker(coord)*/coordRegion);
			//console.log('box', this.getEditor().getUiSelectionAreaContainerBox());
			this.prepareManipulating(T.RESIZE, this.getEditor().getSelection(), currCoord, this.getEditor().getSelectionContainerBox());
			//console.log('Resize');
		}
		else if (isMove)
		{
			//if (this.getEnableMove())
			{
				this.setState(S.MANIPULATING);
				this.setIsManipulatingSelection(true);
				this.prepareManipulating(T.MOVE, this.getEditor().getSelection(), currCoord);
			}
		}
		else if (isRotate)
		{
			this.setState(S.MANIPULATING);
			this.setIsManipulatingSelection(true);
			this.setRotateStartingRegion(rotateRegion);
			this.prepareManipulating(T.ROTATE, this.getEditor().getSelection(), currCoord, this.getEditor().getSelectionContainerBox());
		}
		else
		{
			/*
			var obj = this.getEditor().getTopmostBasicObjectAtCoord(currCoord, this.getCurrBoundInflation());
			if (obj)  // mouse down directly on a object
			{
				obj = obj.getNearestSelectableObject();
				if (this.isInAncestorSelectMode())
					obj = this.getStandaloneAncestor(obj);
				// only mouse down and moved will cause manupulating
				if (this.getEnableMove())
					this.startDirectManipulate(null, obj, currCoord);
			}
			*/
			if (hoveredObj)  // point on an object, direct move
			{
				if (this.getEnableMove())
					this.startDirectManipulate(null, hoveredObj, currCoord);
			}
			else  // pointer down on empty region, deselect old selection and prepare for new selecting
			{
				if (this.getEnableMove() && this.getEnableSelect()
						&& this.getEditorConfigs().getInteractionConfigs().getEnableOffSelectionManipulation()
						&& this.getEditor().hasSelection() && this.getEditor().isSelectionVisible())
				{
					//console.log('enter suspend');
					this.setState(S.SUSPENDING);
					// need wait for a while to determinate the actual operation
					var delay = this.getEditorConfigs().getInteractionConfigs().getOffSelectionManipulationActivatingTimeThreshold();
					var shifted = e && e.getShiftKey();
					this.setSuspendedOperations(
					  this._startNewSelecting.bind(this, currCoord, shifted),
						this._startOffSelectionManipulation.bind(this, currCoord),
						delay
					);
					//this._startOffSelectionManipulation(currCoord);
				}
				else if (this.getEnableSelect())
				{
					var shifted = e && e.getShiftKey();
					/*
					//this.getEditor().startSelectingBoxDrag(currCoord, shifted);
					//this.getEditor().setSelectMode(this.getSelectMode());
					this.getEditor().startSelecting(currCoord, shifted);
					this.setState(S.SELECTING);
					*/
					this._startNewSelecting(currCoord, shifted);
				}
			}
		}
	},
	/**
	 * Do manipulation based on mouse/touch move step.
	 * //@param {Hash} currCoord Current coord of pointer (mouse or touch)
	 * //@param {Object} e Pointer (mouse or touch) event parameter.
	 */
	execManipulationStep: function(/*currCoord, e*/timeStamp)
	{
		if (this.getState() !== Kekule.Editor.BasicManipulationIaController.State.MANIPULATING)
			return false;

		var	currCoord = this._manipulationStepBuffer.coord;
		var	e = this._manipulationStepBuffer.event;
		var explicitTransformParams = this._manipulationStepBuffer.explicitTransformParams;

		if (currCoord && e)
		{
			//console.log('do actual manipulate');
			this.doExecManipulationStep(currCoord, e, this._manipulationStepBuffer);
			// empty buffer, indicating that the event has been handled
		}
		else if (explicitTransformParams)  // has transform params explicitly in gesture transform
		{
			this.doExecManipulationStepWithExplicitTransformParams(explicitTransformParams, this._manipulationStepBuffer);
		}
		this._manipulationStepBuffer.coord = null;
		this._manipulationStepBuffer.event = null;
		this._manipulationStepBuffer.explicitTransformParams = null;

		/*
		if (this._lastTimeStamp)
			console.log('elpase', timeStamp - this._lastTimeStamp);
		this._lastTimeStamp = timeStamp;
		*/

		this._runManipulationStepId = window.requestAnimationFrame(this.execManipulationStepBind);
	},
	/**
	 * Do actual manipulation based on mouse/touch move step.
	 * Descendants may override this method.
	 * @param {Hash} currCoord Current coord of pointer (mouse or touch)
	 * @param {Object} e Pointer (mouse or touch) event parameter.
	 */
	doExecManipulationStep: function(currCoord, e, manipulationStepBuffer)
	{
		var T = Kekule.Editor.BasicManipulationIaController.ManipulationType;
		var manipulateType = this.getManipulationType();

		var editor = this.getEditor();
		editor.beginUpdateObject();
		try
		{
			this._isBusy = true;
			if (manipulateType === T.MOVE)
			{
				this.moveManipulatedObjs(currCoord);
			}
			else if (manipulateType === T.RESIZE)
			{
				this._suppressConstrainedResize = e.getAltKey();
				//this.doResizeManipulatedObjs(currCoord);
				this.doTransformManipulatedObjs(manipulateType, currCoord);
			}
			else if (manipulateType === T.ROTATE)
			{
				//this.rotateManipulatedObjs(currCoord);
				this.doTransformManipulatedObjs(manipulateType, currCoord);
			}
		}
		finally
		{
			editor.endUpdateObject();
			this._isBusy = false;
		}
	},
	/**
	 * Do actual manipulation based on mouse/touch move step.
	 * Descendants may override this method.
	 * @param {Hash} currCoord Current coord of pointer (mouse or touch)
	 * @param {Object} e Pointer (mouse or touch) event parameter.
	 */
	doExecManipulationStepWithExplicitTransformParams: function(transformParams, manipulationStepBuffer)
	{
		var T = Kekule.Editor.BasicManipulationIaController.ManipulationType;
		var manipulateType = this.getManipulationType();

		if (manipulateType === T.TRANSFORM)
		{
			var editor = this.getEditor();
			editor.beginUpdateObject();
			try
			{
				this._isBusy = true;
				this.doTransformManipulatedObjs(manipulateType, null, transformParams);
			}
			finally
			{
				editor.endUpdateObject();
				this._isBusy = false;
			}
		}
	},
	/**
	 * Refill the manipulationStepBuffer.
	 * Descendants may override this method.
	 * @param {Object} e Pointer (mouse or touch) event parameter.
	 * @private
	 */
	updateManipulationStepBuffer: function(buffer, value)
	{
		Object.extend(buffer, value);
		/*
		buffer.coord = coord;
		buffer.event = e;
		*/
	},

	// event handle methods
	/** @ignore */
	react_pointermove: function($super, e)
	{
		$super(e);
		if (this._isBusy)
		{
			return true;
		}

		var S = Kekule.Editor.BasicManipulationIaController.State;
		var T = Kekule.Editor.BasicManipulationIaController.ManipulationType;

		var coord = this._getEventMouseCoord(e);

		var distanceFromLast;
		if (this._lastMouseMoveCoord)
		{
			var dis = Kekule.CoordUtils.getDistance(coord, this._lastMouseMoveCoord);
			distanceFromLast = dis;
			if (dis < 2)  // less than 2 px, too tiny to react
			{
				return true;
			}
		}
		this._lastMouseMoveCoord = coord;

		/*
		if (state !== S.NORMAL)
			this.getEditor().hideHotTrack();
		if (state === S.NORMAL)
		{
			// in normal state, if mouse moved to boundary of a object, it may be highlighted
			this.getEditor().hotTrackOnCoord(coord);
		}
		else
		*/
		if (this.getState() === S.SUSPENDING)
		{
			var disThreshold = this.getEditorConfigs().getInteractionConfigs().getUnmovePointerDistanceThreshold() || 0;
			if (Kekule.ObjUtils.notUnset(distanceFromLast) && (distanceFromLast > disThreshold))
				this.execSuspendedImmediateOperation();
		}

		var state = this.getState();

		if (state === S.SELECTING)
		{
			if (this.getEnableSelect())
			{
				//this.getEditor().dragSelectingBoxToCoord(coord);
				this.getEditor().addSelectingAnchorCoord(coord);
			}
			e.preventDefault();
		}
		else if (state === S.MANIPULATING)  // move or resize objects
		{
			//console.log('mouse move', coord);
			this.updateManipulationStepBuffer(this._manipulationStepBuffer, {'coord': coord, 'event': e});
			//this.execManipulationStep(coord, e);
			e.preventDefault();
		}
		return true;
	},
	/** @private */
	react_pointerdown: function($super, e)
	{
		$super(e);
		//console.log('pointerdown', e);
		var S = Kekule.Editor.BasicManipulationIaController.State;
		//var T = Kekule.Editor.BasicManipulationIaController.ManipulationType;
		if (e.getButton() === Kekule.X.Event.MouseButton.LEFT)
		{
			this._lastMouseMoveCoord = null;

			var coord = this._getEventMouseCoord(e);
			if ((this.getState() === S.NORMAL)/* && (this.getEditor().getMouseLBtnDown()) */)
			{
				this.beginManipulation(coord, e);
				e.preventDefault();
			}
		}
		else if (e.getButton() === Kekule.X.Event.MouseButton.RIGHT)
		{
			//if (this.getEnableMove())
			{
				if (this.getState() === S.MANIPULATING) // when click right button on manipulating, just cancel it.
				{
					this.cancelManipulate();
					this.setState(S.NORMAL);
					e.stopPropagation();
					e.preventDefault();
				}
				else if (this.getState() === S.SUSPENDING)
					this.haltSuspendedOperations();
			}
		}
		return true;
	},
	/** @private */
	react_pointerup: function(e)
	{
		if (e.getButton() === Kekule.X.Event.MouseButton.LEFT)
		{
			var coord = this._getEventMouseCoord(e);
			this.setEndCoord(coord);
			var startCoord = this.getStartCoord();
			var endCoord = coord;
			var shifted = e.getShiftKey();
			var S = Kekule.Editor.BasicManipulationIaController.State;

			if (this.getState() === S.SUSPENDING)   // done suspended first, then finish the operation
				this.execSuspendedImmediateOperation();

			var state = this.getState();

			if (state === S.SELECTING)  // mouse up, end selecting
			{
				//this.getEditor().endSelectingBoxDrag(coord, shifted);
				this.getEditor().endSelecting(coord, shifted || this.getEditor().getIsToggleSelectOn());
				this.setState(S.NORMAL);
				e.preventDefault();
				var editor = this.getEditor();
				editor.endManipulateObject();
			}
			else if (state === S.MANIPULATING)
			{
				//var dis = Kekule.CoordUtils.getDistance(startCoord, endCoord);
				//if (dis <= this.getEditorConfigs().getInteractionConfigs().getUnmovePointerDistanceThreshold())
				if (Kekule.CoordUtils.isEqual(startCoord, endCoord))  // mouse down and up in same point, not manupulate, just select a object
				{
					if (this.getEnableSelect())
						this.getEditor().selectOnCoord(startCoord, shifted || this.getEditor().getIsToggleSelectOn());
				}
				else  // move objects to new pos
				{
					this.manipulateBeforeStopping();
					/*
					if (this.getEnableMove())
					{
						//this.moveManipulatedObjs(coord);
						//this.endMoving();
						// add operation to editor's historys
						this.addOperationToEditor();
					}
					*/
					this.addOperationToEditor();
				}
				this.stopManipulate();
				this.setState(S.NORMAL);
				e.preventDefault();
			}
		}
		return true;
	},
	/** @private */
	react_mousewheel: function($super, e)
	{
		if (e.getCtrlKey())
		{
			var state = this.getState();
			if (state === Kekule.Editor.BasicManipulationIaController.State.NORMAL)
			{
				// disallow mouse zoom during manipulation
				return $super(e);
			}
			e.preventDefault();
		}
	},

	/* @private */
	/*
	react_keyup: function(e)
	{
		var keyCode = e.getKeyCode();
		switch (keyCode)
		{
			case 46: // delete
			{
				if (this.getEnableRemove())
					this.removeSelection();
			}
		}
	}
	*/

	//////////////////// Hammer Gesture event handlers ///////////////////////////
	/** @private */
	_isGestureManipulationEnabled: function()
	{
		return this.getEditorConfigs().getInteractionConfigs().getEnableGestureManipulation();
	},
	/** @private */
	_isGestureZoomOnEditorEnabled: function()
	{
		return this.getEditorConfigs().getInteractionConfigs().getEnableGestureZoomOnEditor();
	},
	/** @private */
	_isInGestureManipulation: function()
	{
		return !!this._initialGestureTransformParams;
	},
	/** @private */
	_isGestureZoomOnEditor: function()
	{
		return !!this._initialGestureZoomLevel;
	},
	/**
	 * Starts a gesture transform.
	 * @param {Object} event
	 * @private
	 */
	beginGestureTransform: function(event)
	{
		if (this.getEditor().hasSelection())
		{
			this._initialGestureZoomLevel = null;
			if (this._isGestureManipulationEnabled())
			{
				this.haltSuspendedOperations(); // halt possible touch hold manipulations
				// stores initial gesture transform params
				this._initialGestureTransformParams = {
					'angle': (event.rotation * Math.PI / 180) || 0
				};
				// start a brand new one
				if (this.getState() !== Kekule.Editor.BasicManipulationIaController.State.MANIPULATING)
					this.beginManipulation(null, null, Kekule.Editor.BasicManipulationIaController.ManipulationType.TRANSFORM);
				else
				{
					if (this.getManipulationType() !== Kekule.Editor.BasicManipulationIaController.ManipulationType.TRANSFORM)
						this.setManipulationType(Kekule.Editor.BasicManipulationIaController.ManipulationType.TRANSFORM);
				}
			}
			else
				this._initialGestureTransformParams = null;
		}
		else if (this._isGestureZoomOnEditorEnabled())  // zoom on editor
		{
			this.getEditor().cancelSelecting();   // force store the selecting
			this.setState(Kekule.Editor.BasicManipulationIaController.State.NORMAL);
			this._initialGestureZoomLevel = this.getEditor().getZoom();
		}
	},
	/**
	 * Ends a gesture transform.
	 * @private
	 */
	endGestureTransform: function()
	{
		if (this.getState() === Kekule.Editor.BasicManipulationIaController.State.MANIPULATING)  // stop prev manipulation first
		{
			if (this._isInGestureManipulation())
			{
				this.manipulateBeforeStopping();
				this.addOperationToEditor();
				this.stopManipulate();
				this.setState(Kekule.Editor.BasicManipulationIaController.State.NORMAL);
				this._initialGestureTransformParams = null;
			}
		}
		if (this._isGestureZoomOnEditor())
		{
			this._initialGestureZoomLevel = null;
		}
	},
	/**
	 * Do a new transform step according to received event.
	 * @param {Object} e Gesture event received.
	 * @private
	 */
	doGestureTransformStep: function(e)
	{
		var T = Kekule.Editor.BasicManipulationIaController.ManipulationType;
		if ((this.getState() === Kekule.Editor.BasicManipulationIaController.State.MANIPULATING)
			&& (this.getManipulationType() === T.TRANSFORM)
			&& (this._isInGestureManipulation()))
		{
			var availTransformTypes = this._availTransformTypes || [];
			// get transform params from event directly
			var center = this.getRotateCenter();  // use the center of current editor selection

			var resizeScales, rotateAngle;
			if (availTransformTypes.indexOf(T.RESIZE) >= 0)
			{
				var scale = e.scale;
				resizeScales = this._calcActualResizeScales(this.getManipulateObjs(), {'scaleX': scale, 'scaleY': scale});
			}
			else
				resizeScales = {'scaleX': 1, 'scaleY': 1};
			if (availTransformTypes.indexOf(T.ROTATE) >= 0)
			{
				var absAngle = e.rotation * Math.PI / 180;
				var rotateAngle = absAngle - this._initialGestureTransformParams.angle;

				// get actual rotation angle
				rotateAngle = this._calcActualRotateAngle(this.getManipulateObjs(), rotateAngle, this._initialGestureTransformParams.angle, absAngle);
			}
			else
			{
				rotateAngle = 0;
			}

			this.updateManipulationStepBuffer(this._manipulationStepBuffer, {
				'explicitTransformParams': {
					'center': center,
					'scaleX': resizeScales.scaleX, 'scaleY': resizeScales.scaleY,
					'rotateAngle': rotateAngle
					//'rotateDegree': e.rotation,
					//'event': e
				}
			});
			e.preventDefault();
		}
		else if (this._isGestureZoomOnEditor())
		{
			var editor = this.getEditor();
			var scale = e.scale;
			var initZoom = this._initialGestureZoomLevel;
			editor.zoomTo(initZoom * scale, null, e.center);
		}
	},

	/** @ignore */
	react_rotatestart: function(e)
	{
		if (this.getEnableGestureManipulation())
			this.beginGestureTransform(e);
	},
	/** @ignore */
	react_rotate: function(e)
	{
		if (this.getEnableGestureManipulation())
			this.doGestureTransformStep(e);
	},
	/** @ignore */
	react_rotateend: function(e)
	{
		if (this.getEnableGestureManipulation())
			this.endGestureTransform();
	},
	/** @ignore */
	react_rotatecancel: function(e)
	{
		if (this.getEnableGestureManipulation())
			this.endGestureTransform();
	},
	/** @ignore */
	react_pinchstart: function(e)
	{
		if (this.getEnableGestureManipulation())
			this.beginGestureTransform(e);
	},
	/** @ignore */
	react_pinchmove: function(e)
	{
		if (this.getEnableGestureManipulation())
			this.doGestureTransformStep(e);
	},
	/** @ignore */
	react_pinchend: function(e)
	{
		if (this.getEnableGestureManipulation())
			this.endGestureTransform();
	},
	/** @ignore */
	react_pinchcancel: function(e)
	{
		if (this.getEnableGestureManipulation())
			this.endGestureTransform();
	}
});


/**
 * Enumeration of state of a {@link Kekule.Editor.BasicManipulationIaController}.
 * @class
 */
Kekule.Editor.BasicManipulationIaController.State = {
	/** Normal state. */
	NORMAL: 0,
	/** Is selecting objects. */
	SELECTING: 1,
	/** Is manipulating objects (e.g. changing object position). */
	MANIPULATING: 2,
	/**
	 * Just put down pointer, if move the pointer immediately, selecting state will be open.
	 * But if hold down still for a while, it may turn to manipulating state to move current selected objects.
	 */
	SUSPENDING: 11
};
/**
 * Enumeration of manipulation types of a {@link Kekule.Editor.BasicManipulationIaController}.
 * @class
 */
Kekule.Editor.BasicManipulationIaController.ManipulationType = {
	MOVE: 0,
	ROTATE: 1,
	RESIZE: 2,
	TRANSFORM: 4  // scale and rotate simultaneously by touch
};
/** @ignore */
Kekule.Editor.IaControllerManager.register(Kekule.Editor.BasicManipulationIaController, Kekule.Editor.BaseEditor);
return Kekule;
};
