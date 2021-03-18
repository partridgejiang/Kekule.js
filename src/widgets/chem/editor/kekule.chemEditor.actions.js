/**
 * @fileoverview
 * Implements of actions related with chem editor.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /io/kekule.io.js
 * requires /xbrowsers/kekule.x.js
 * requires /widgets/kekule.widget.base.js
 * requires /widgets/kekule.widget.clipboards.js
 * requires /widgets/chem/kekule.chemWidget.chemObjDisplayers.js
 * requires /widgets/chem/editor/kekule.chemEditor.baseEditors.js
 * requires /widgets/chem/editor/kekule.chemEditor.composers.js
 * requires /widgets/operation/kekule.actions.js
 *
 * requires /localization/kekule.localize.widget.js
 */

(function(){
"use strict";

var AU = Kekule.ArrayUtils;
var BNS = Kekule.ChemWidget.ComponentWidgetNames;
var CCNS = Kekule.ChemWidget.HtmlClassNames;
//var CWT = Kekule.ChemWidgetTexts;
var AM = Kekule.ActionManager;

var _editorActionRegInfo = [];


/** @ignore */
Kekule.ChemWidget.HtmlClassNames = Object.extend(Kekule.ChemWidget.HtmlClassNames, {
	// predefined actions
	ACTION_UNDO: 'K-Chem-Undo',
	ACTION_REDO: 'K-Chem-Redo',
	ACTION_NEWDOC: 'K-Chem-NewDoc',
	ACTION_SELECT_ALL: 'K-Chem-SelectAll',
	ACTION_CLONE_SELECTION: 'K-Chem-Clone-Selection',
	ACTION_COPY: 'K-Chem-Copy',
	ACTION_CUT: 'K-Chem-Cut',
	ACTION_PASTE: 'K-Chem-Paste',
	ACTION_TOGGLE_SELECT: 'K-Chem-Toggle-Select-State',
	ACTION_ERASE_SELECTION: 'K-Chem-Erase-Selection',
	ACTION_RECHECK_ISSUES: 'K-Chem-Recheck-Issues',
	ACTION_TOGGLE_OBJ_INSPECTOR: 'K-Chem-Toggle-ObjInspector',
	ACTION_TOGGLE_ISSUE_INSPECTOR: 'K-Chem-Toggle-IssueInspector',
	ACTION_TOGGLE_SHOW_ISSUES: 'K-Chem-Toggle-ShowIssues',
});

Object.extend(Kekule.ChemWidget.ComponentWidgetNames, {
	manipulateMarquee: 'manipulateMarquee',
	manipulateLasso: 'manipulateLasso',
	manipulateBrush: 'manipulateBrush',
	manipulateAncestor: 'manipulateAncestor',
	molBondSingle: 'bondSingle',
	molBondDouble: 'bondDouble',
	molBondTriple: 'bondTriple',
	molBondCloser: 'bondCloser',
	molBondWedgeUp: 'bondWedgeUp',
	molBondWedgeDown: 'bondWedgeDown',
	molBondWedgeUpOrDown: 'bondWedgeUpOrDown',
	molBondDoubleEither: 'bondDoubleEither',

	molChargeClear: 'chargeClear',
	molChargePositive: 'chargePositive',
	molChargeNegative: 'chargeNegative',
	molRadicalSinglet: 'radicalSinglet',
	molRadicalTriplet: 'radicalTriplet',
	molRadicalDoublet: 'radicalDoublet',
	molElectronLonePair: 'electronLonePair',

	molChain: 'chain',
	molRing3: 'ring3',
	molRing4: 'ring4',
	molRing5: 'ring5',
	molRing6: 'ring6',
	molRing7: 'ring7',
	molRing8: 'ring8',
	molRingAr6: 'ringAr6',
	molRingAr5: 'ringAr5',
	molFlexRing: 'flexRing',

	molRepCyclopentaneHaworth1: 'repCyclopentaneHaworth1',
	molRepCyclopentaneHaworth2: 'repCyclopentaneHaworth2',
	molRepCyclohexaneHaworth1: 'repCyclohexaneHaworth1',
	molRepCyclohexaneHaworth2: 'repCyclohexaneHaworth2',
	molRepCyclohexaneChair1: 'repCyclohexaneChair1',
	molRepCyclohexaneChair2: 'repCyclohexaneChair2',

	molRepSubBondMark: 'subBondMark',
	molRepMethane: 'methane',
	molRepFischer1: 'repFischer1',
	molRepFischer2: 'repFischer2',
	molRepFischer3: 'repFischer3',
	molRepSawhorseStaggered: 'repSawhorseStaggered',
	molRepSawhorseEclipsed: 'repSawhorseEclipsed',

	glyphRepLine: 'repLine',
	glyphRepOpenArrowLine: 'repOpenArrowLine',
	glyphRepTriangleArrowLine: 'repTriangleArrowLine',
	glyphRepDiOpenArrowLine: 'repDiOpenArrowLine',
	glyphRepDiTriangleArrowLine: 'repDiTriangleArrowLine',
	glyphRepReversibleArrowLine: 'repReversibleArrowLine',
	glyphRepOpenArrowDiLine: 'repOpenArrowDiLine',
	glyphRepOpenArrowArc: 'repOpenArrowArc',
	glyphRepSingleSideOpenArrowArc: 'repSingleSideOpenArrowArc',
	glyphRepHeatSymbol: 'repHeatSymbol',
	glyphRepAddSymbol: 'repAddSymbol',
	glyphElectronPushingArrow: 'repElectronPushingArrow',
	glyphElectronPushingArrowDouble: 'repElectronPushingArrowDouble',
	glyphElectronPushingArrowSingle: 'repElectronPushingArrowSingle',
	glyphElectronPushingArrowBondForming: 'repElectronPushingArrowBondForming',
	glyphRepSegment: 'repGlyphSegment',
	glyphReactionArrowNormal: 'repGlyphReactionArrowNormal',
	glyphReactionArrowReversible: 'glyphReactionArrowReversible',
	glyphReactionArrowResonance: 'glyphReactionArrowResonance',
	glyphReactionArrowRetrosynthesis: 'glyphReactionArrowRetrosynthesis'
});

/**
 * A helper class for editor actions.
 * @class
 */
Kekule.Editor.ActionOperUtils = {
	/** @private */
	getObjsCenterScreenCoord: function(editor, objects)
	{
		var BU = Kekule.BoxUtils;
		var CU = Kekule.CoordUtils;
		var containerBox = null;
		for (var i = 0, l = objects.length; i < l; ++i)
		{
			var box = Kekule.Render.ObjUtils.getContainerBox(objects[i], editor.getCoordMode(), editor.getAllowCoordBorrow());
			if (!containerBox)
				containerBox = box;
			else
				containerBox = BU.getContainerBox(box, containerBox);
		}
		//var centerCoord = BU.getCenterCoord(containerBox);
		var coords = BU.getMinMaxCoords(containerBox);
		var screenCoords = {
			'min': editor.objCoordToScreen(coords.min),
			'max': editor.objCoordToScreen(coords.max)
		};
		var result = CU.add(screenCoords.min, screenCoords.max);
		var result = CU.divide(result, 2);
		//return editor.objCoordToScreen(centerCoord);
		return result;
	},
	/**
	 * Add standalone objects to a chem space editor, with operation support.
	 * @param {Kekule.Editor.ChemSpaceEditor} editor
	 * @param {Array} objs
	 * @param {Hash} options May including fields:
	 *   {
	 *     screenCoordOffset: Coords of new added objects will be added with this value.
	 *     autoAdjustPosition: Whether the newly added object will be put at the center of editor screen.
	 *       This option takes no effect when screenCoordOffset is true.
	 *     autoSelect: Whether automatically select the newly added objects.
	 *   }
	 */
	addObjectsToChemSpaceEditor: function(editor, objs, options)
	{
		var ops = Object.extend({autoAdjustPosition: true}, options);  // default options
		var _getAppendableObjs = function(srcObj, rootSpace)
		{
			var result = [];
			var rootObj = rootSpace;
			if (rootObj && srcObj)
			{
				if (srcObj.getClass() === rootObj.getClass() || srcObj instanceof Kekule.ChemSpace)  // class is same (chemspace)
				{
					result = AU.clone(srcObj.getChildren());
				}
				else
					result = [srcObj];
			}
			return result;
		};
		var chemSpace = editor.getChemSpace && editor.getChemSpace();
		if (editor && chemSpace && editor.canAddNewStandaloneObject && editor.canAddNewStandaloneObject())
		{
			var actualObjs = [];
			for (var i = 0, l = objs.length; i < l; ++i)
			{
				var appendableObjs = _getAppendableObjs(objs[i], chemSpace);
				if (appendableObjs && appendableObjs.length)
					AU.pushUnique(actualObjs, appendableObjs);
			}
			//editor.beginUpdateObject();
			editor.beginManipulateAndUpdateObject();
			try
			{
				var marcoOper = new Kekule.MacroOperation();
				for (var i = 0, l = actualObjs.length; i < l; ++i)
				{
					var obj = actualObjs[i];
					var oper = new Kekule.ChemObjOperation.Add(obj, chemSpace, null, editor);
					marcoOper.add(oper);
				}
				marcoOper.execute();

				var screenCoordOffset = ops.screenCoordOffset;
				if (!screenCoordOffset && ops.autoAdjustPosition)  // auto adjust position
				{
					//var originCenterCoord = this.getObjsCenterScreenCoord(editor, originalSelectedObjs);
					var editorClientRect = editor.getClientVisibleRect();
					var editorCenterScreenCoord = {
						'x': editorClientRect.left + editorClientRect.width / 2,
						'y': editorClientRect.top + editorClientRect.height / 2
					};
					var targetCenterCoord = this.getObjsCenterScreenCoord(editor, actualObjs);
					var deltaCoord = Kekule.CoordUtils.substract(editorCenterScreenCoord, targetCenterCoord);
					screenCoordOffset = deltaCoord;
				}
				if (screenCoordOffset)
				{
					for (var i = 0, l = actualObjs.length; i < l; ++i)
					{
						var obj = actualObjs[i];
						var coord = editor.getObjectScreenCoord(obj);
						var newCoord = Kekule.CoordUtils.add(coord, screenCoordOffset);
						editor.setObjectScreenCoord(obj, newCoord);
					}
				}

				editor.pushOperation(marcoOper);
				if (ops.autoSelect)
					editor.select(actualObjs);
			}
			finally
			{
				//editor.endUpdateObject();
				editor.endManipulateAndUpdateObject();
			}
		}
	}
};

/**
 * Base class for actions for chem editor only.
 * @class
 * @augments Kekule.ChemWidget.ActionOnDisplayer
 *
 * @param {Kekule.Editor.BaseEditor} editor Target editor object.
 * @param {String} caption
 * @param {String} hint
 * @param {String} explicitGroup Use this property to explicitly set child actions to different group.
 */
Kekule.Editor.ActionOnEditor = Class.create(Kekule.ChemWidget.ActionOnDisplayer,
/** @lends Kekule.Editor.ActionOnEditor# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ActionOnEditor',
	/** @constructs */
	initialize: function(/*$super, */editor, caption, hint)
	{
		this.tryApplySuper('initialize', [editor, caption, hint])  /* $super(editor, caption, hint) */;
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('explicitGroup', {'dataType': DataType.STRING});
	},

	/**
	 * Returns the widget class that best fit this action.
	 * Descendants may override this method.
	 * @returns {null}
	 */
	getPreferredWidgetClass: function()
	{
		return null;
	},
	/** @private */
	doUpdate: function()
	{
		var displayer = this.getDisplayer();
		this.setEnabled(displayer && displayer.getChemObj() && displayer.getChemObjLoaded() && displayer.getEnabled());
	},
	/**
	 * Returns target chem editor object.
	 * @returns {Kekule.Editor.BaseEditor}
	 */
	getEditor: function()
	{
		var result = this.getDisplayer();
		return (result instanceof Kekule.Editor.BaseEditor)? result: null;
	}
});

/**
 * An undo action on editor.
 * @class
 * @augments Kekule.Editor.ActionOnEditor
 *
 * @param {Kekule.Editor.BaseEditor} editor Target editor object.
 */
Kekule.Editor.ActionEditorUndo = Class.create(Kekule.Editor.ActionOnEditor,
/** @lends Kekule.Editor.ActionEditorUndo# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ActionEditorUndo',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_UNDO,
	/** @constructs */
	initialize: function(/*$super, */editor)
	{
		this.tryApplySuper('initialize', [editor, /*CWT.CAPTION_UNDO, CWT.HINT_UNDO*/Kekule.$L('ChemWidgetTexts.CAPTION_UNDO'), Kekule.$L('ChemWidgetTexts.HINT_UNDO')])  /* $super(editor, \*CWT.CAPTION_UNDO, CWT.HINT_UNDO*\Kekule.$L('ChemWidgetTexts.CAPTION_UNDO'), Kekule.$L('ChemWidgetTexts.HINT_UNDO')) */;
	},
	/** @private */
	doUpdate: function(/*$super*/)
	{
		this.tryApplySuper('doUpdate')  /* $super() */;
		if (this.getEnabled())
			this.setEnabled(this.getEditor().getEnableOperHistory() && this.getEditor().canUndo());
	},
	/** @private */
	doExecute: function()
	{
		var editor = this.getEditor();
		if (editor)
			editor.undo();
	}
});
/**
 * A redo action on editor.
 * @class
 * @augments Kekule.Editor.ActionOnEditor
 *
 * @param {Kekule.Editor.BaseEditor} editor Target editor object.
 */
Kekule.Editor.ActionEditorRedo = Class.create(Kekule.Editor.ActionOnEditor,
/** @lends Kekule.Editor.ActionEditorRedo# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ActionEditorRedo',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_REDO,
	/** @constructs */
	initialize: function(/*$super, */editor)
	{
		this.tryApplySuper('initialize', [editor, /*CWT.CAPTION_REDO, CWT.HINT_REDO*/Kekule.$L('ChemWidgetTexts.CAPTION_REDO'), Kekule.$L('ChemWidgetTexts.HINT_REDO')])  /* $super(editor, \*CWT.CAPTION_REDO, CWT.HINT_REDO*\Kekule.$L('ChemWidgetTexts.CAPTION_REDO'), Kekule.$L('ChemWidgetTexts.HINT_REDO')) */;
	},
	/** @private */
	doUpdate: function(/*$super*/)
	{
		this.tryApplySuper('doUpdate')  /* $super() */;
		if (this.getEnabled())
			this.setEnabled(this.getEditor().getEnableOperHistory() && this.getEditor().canRedo());
	},
	/** @private */
	doExecute: function()
	{
		var editor = this.getEditor();
		if (editor)
			editor.redo();
	}
});

/**
 * A new document action on editor.
 * @class
 * @augments Kekule.Editor.ActionOnEditor
 *
 * @param {Kekule.Editor.BaseEditor} editor Target editor object.
 */
Kekule.Editor.ActionEditorNewDoc = Class.create(Kekule.Editor.ActionOnEditor,
/** @lends Kekule.Editor.ActionEditorNewDoc# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ActionEditorNewDoc',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_NEWDOC,
	/** @constructs */
	initialize: function(/*$super, */editor)
	{
		this.tryApplySuper('initialize', [editor, /*CWT.CAPTION_NEWDOC, CWT.HINT_NEWDOC*/Kekule.$L('ChemWidgetTexts.CAPTION_NEWDOC'), Kekule.$L('ChemWidgetTexts.HINT_NEWDOC')])  /* $super(editor, \*CWT.CAPTION_NEWDOC, CWT.HINT_NEWDOC*\Kekule.$L('ChemWidgetTexts.CAPTION_NEWDOC'), Kekule.$L('ChemWidgetTexts.HINT_NEWDOC')) */;
	},
	/** @private */
	doUpdate: function()
	{
		var editor = this.getDisplayer();
		this.setEnabled(editor && editor.getEnabled() && editor.getEnableCreateNewDoc());
	},
	/** @private */
	doExecute: function()
	{
		var editor = this.getEditor();
		if (editor)
			editor.newDoc();
	}
});

/**
 * Action for loading or appending new data into editor.
 * @class
 * @augments Kekule.ChemWidget.ActionDisplayerLoadData
 *
 * @property {Bool} enableAppend Whether appending data into editor is enabled.
 */
Kekule.Editor.ActionEditorLoadData = Class.create(Kekule.ChemWidget.ActionDisplayerLoadData,
/** @lends Kekule.Editor.ActionEditorLoadData# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ActionEditorLoadData',
	/* @private */
	// HTML_CLASSNAME: CCNS.ACTION_LOADFILE,
	/** @constructs */
	initialize: function(/*$super, */editor)
	{
		this.tryApplySuper('initialize', [editor])  /* $super(editor) */;
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('enableAppend', {'dataType': DataType.BOOL});
	},
	/** @private */
	doExecute: function(/*$super, */target)
	{
		var dialog = this.getDataDialog();
		if (dialog && dialog.setDisplayAppendCheckBox)
			dialog.setDisplayAppendCheckBox(this._isEditorRootObjAppendable() && !this._isEditorEmpty());
		return this.tryApplySuper('doExecute', [target])  /* $super(target) */;
	},
	/** @private */
	_getEditorRootObj: function()
	{
		var editor = this.getDisplayer();
		var rootObj = editor.getChemObj();
		return rootObj;
	},
	/** @private */
	_isEditorRootObjAppendable: function()
	{
		// check if the root object of editor can append child
		var editor = this.getDisplayer();
		var rootObj = this._getEditorRootObj();
		return rootObj && (rootObj instanceof Kekule.ChemSpace) && (editor.canAddNewStandaloneObject && editor.canAddNewStandaloneObject())
			&& (editor.getAllowAppendDataToCurr && editor.getAllowAppendDataToCurr());
	},
	/** @private */
	_isEditorEmpty: function()
	{
		var rootObj = this._getEditorRootObj();
		return (!rootObj || (rootObj.getChildCount && rootObj.getChildCount() === 0));
	},
	/* @private */
	/*
	_getAppendableObjs: function(srcObj)
	{
		var result = [];
		var rootObj = this._getEditorRootObj();
		if (rootObj && srcObj)
		{
			if (srcObj.getClass() === rootObj.getClass() || srcObj instanceof Kekule.ChemSpace)  // class is same (chemspace)
			{
				result = AU.clone(srcObj.getChildren());
			}
			else
				result = [srcObj];
		}
		return result;
	},
	*/
	/** @private */
	createDataDialog: function()
	{
		var doc = this.getDisplayer().getDocument();
		var result = new Kekule.ChemWidget.LoadOrAppendDataDialog(doc);
		return result;
	},
	/** @ignore */
	doLoadToDisplayer: function(/*$super, */chemObj, dialog)
	{
		var editor = this.getDisplayer();
		var isAppending = dialog.getIsAppending();
		//console.log('is appending', isAppending);
		if (isAppending && !this._isEditorEmpty() && this._isEditorRootObjAppendable())
		{
			editor.beginUpdateObject();
			try
			{
				var rootObj = this._getEditorRootObj();
				rootObj.beginUpdate();
				try
				{
					//var appendableObjs = this._getAppendableObjs(chemObj);
					//Kekule.Editor.ActionOperUtils.addObjectsToChemSpaceEditor(editor, appendableObjs);
					Kekule.Editor.ActionOperUtils.addObjectsToChemSpaceEditor(editor, [chemObj], {'autoSelect': true});
					/*
					for (var i = 0, l = appendableObjs.length; i < l; ++i)
					{
						rootObj.appendChild(appendableObjs[i]);
					}
					*/
				}
				finally
				{
					rootObj.endUpdate();
				}
			}
			finally
			{
				editor.endUpdateObject();
			}
		}
		else
			return this.tryApplySuper('doLoadToDisplayer', [chemObj, dialog])  /* $super(chemObj, dialog) */;
	}
});

/**
 * A select-all action for editor.
 * @class
 * @augments Kekule.Editor.ActionOnEditor
 *
 * @param {Kekule.Editor.BaseEditor} editor Target editor object.
 */
Kekule.Editor.ActionSelectAll = Class.create(Kekule.Editor.ActionOnEditor,
/** @lends Kekule.Editor.ActionSelectAll# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ActionSelectAll',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_SELECT_ALL,
	/** @constructs */
	initialize: function(editor)
	{
		this.tryApplySuper('initialize', [editor, Kekule.$L('ChemWidgetTexts.CAPTION_SELECT_ALL'), Kekule.$L('ChemWidgetTexts.HINT_SELECT_ALL')]);
	},
	/** @private */
	doUpdate: function(/*$super*/)
	{
		this.tryApplySuper('doUpdate')  /* $super() */;
		if (this.getEnabled())
			this.setEnabled(this.getEditor().getChemObj());
	},
	/** @private */
	doExecute: function()
	{
		this.getEditor().selectAll();
	}
});

/**
 * A clone selection action on editor.
 * @class
 * @augments Kekule.Editor.ActionOnEditor
 *
 * @param {Kekule.Editor.BaseEditor} editor Target editor object.
 */
Kekule.Editor.ActionCloneSelection = Class.create(Kekule.Editor.ActionOnEditor,
/** @lends Kekule.Editor.ActionCloneSelection# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ActionCloneSelection',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_CLONE_SELECTION,
	/** @constructs */
	initialize: function(/*$super, */editor)
	{
		this.tryApplySuper('initialize', [editor, /*CWT.CAPTION_CLONE_SELECTION, CWT.HINT_CLONE_SELECTION*/Kekule.$L('ChemWidgetTexts.CAPTION_CLONE_SELECTION'), Kekule.$L('ChemWidgetTexts.HINT_CLONE_SELECTION')])  /* $super(editor, \*CWT.CAPTION_CLONE_SELECTION, CWT.HINT_CLONE_SELECTION*\Kekule.$L('ChemWidgetTexts.CAPTION_CLONE_SELECTION'), Kekule.$L('ChemWidgetTexts.HINT_CLONE_SELECTION')) */;
	},
	/** @private */
	_hasCloneMethod: function()
	{
		var editor = this.getEditor();
		return editor && editor.cloneSelection;
	},
	/** @private */
	doUpdate: function(/*$super*/)
	{
		this.tryApplySuper('doUpdate')  /* $super() */;
		if (this.getEnabled())
			this.setEnabled(this._hasCloneMethod() && this.getEditor().hasSelection());

		this.setDisplayed(this._hasCloneMethod() && this.getEditor().canCloneObjects());
	},
	/** @private */
	doExecute: function()
	{
		var editor = this.getEditor();
		if (editor && editor.getChemSpace)
		{
			var coordOffset = editor.getDefaultCloneScreenCoordOffset && editor.getDefaultCloneScreenCoordOffset();
			var objs = editor.cloneSelection();
			Kekule.Editor.ActionOperUtils.addObjectsToChemSpaceEditor(editor, objs, {
				'screenCoordOffset': coordOffset,
				'autoSelect': true
			});
		}
		/*
		var chemSpace = editor.getChemSpace && editor.getChemSpace();
		if (editor && chemSpace)
		{
			var coordOffset = editor.getDefaultCloneScreenCoordOffset();
			editor.beginUpdateObject();
			try
			{
				var objs = editor.cloneSelection();
				var marcoOper = new Kekule.MacroOperation();
				for (var i = 0, l = objs.length; i < l; ++i)
				{
					var obj = objs[i];
					var oper = new Kekule.ChemObjOperation.Add(objs[i], chemSpace);
					marcoOper.add(oper);
				}
				marcoOper.execute();

				if (coordOffset)
				{
					for (var i = 0, l = objs.length; i < l; ++i)
					{
						var obj = objs[i];
						var coord = editor.getObjectScreenCoord(obj);
						var newCoord = Kekule.CoordUtils.add(coord, coordOffset);
						editor.setObjectScreenCoord(obj, newCoord);
					}
				}

				editor.pushOperation(marcoOper);
				editor.select(objs);
			}
			finally
			{
				editor.endUpdateObject();
			}
		}
		*/
	}
});

/**
 * A copying selection action on editor.
 * @class
 * @augments Kekule.Editor.ActionOnEditor
 *
 * @param {Kekule.Editor.BaseEditor} editor Target editor object.
 */
Kekule.Editor.ActionCopySelection = Class.create(Kekule.Editor.ActionOnEditor,
/** @lends Kekule.Editor.ActionCopySelection# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ActionCopySelection',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_COPY,
	/** @constructs */
	initialize: function(/*$super, */editor)
	{
		this.tryApplySuper('initialize', [editor, /*CWT.CAPTION_COPY, CWT.HINT_COPY*/Kekule.$L('ChemWidgetTexts.CAPTION_COPY'), Kekule.$L('ChemWidgetTexts.HINT_COPY')])  /* $super(editor, \*CWT.CAPTION_COPY, CWT.HINT_COPY*\Kekule.$L('ChemWidgetTexts.CAPTION_COPY'), Kekule.$L('ChemWidgetTexts.HINT_COPY')) */;
	},
	/** @private */
	doUpdate: function(/*$super*/)
	{
		this.tryApplySuper('doUpdate')  /* $super() */;
		if (this.getEnabled())
			this.setEnabled(this.getEditor().hasSelection());
	},
	/** @private */
	doExecute: function()
	{
		var editor = this.getEditor();
		var chemSpace = editor.getChemSpace && editor.getChemSpace();
		if (editor && chemSpace)
		{
			var objs = editor.cloneSelection();
			/*
			Kekule.Widget.clipboard.setObjects(Kekule.IO.MimeType.JSON, objs);
			//console.log(Kekule.Widget.Clipboard.getData('text/json'));
			*/
			var space = new Kekule.IntermediateChemSpace();
			try
			{
				space.appendChildren(objs);  // use a space to keep all objs, to keep the relations
				Kekule.Widget.clipboard.setObjects(Kekule.IO.MimeType.JSON, [space]);
			}
			finally
			{
				space.finalize();
			}
		}
	}
});
/**
 * A cutting selection action on editor.
 * @class
 * @augments Kekule.Editor.ActionOnEditor
 *
 * @param {Kekule.Editor.BaseEditor} editor Target editor object.
 */
Kekule.Editor.ActionCutSelection = Class.create(Kekule.Editor.ActionOnEditor,
/** @lends Kekule.Editor.ActionCutSelection# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ActionCutSelection',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_CUT,
	/** @constructs */
	initialize: function(/*$super, */editor)
	{
		this.tryApplySuper('initialize', [editor, /*CWT.CAPTION_CUT, CWT.HINT_CUT*/Kekule.$L('ChemWidgetTexts.CAPTION_CUT'), Kekule.$L('ChemWidgetTexts.HINT_CUT')])  /* $super(editor, \*CWT.CAPTION_CUT, CWT.HINT_CUT*\Kekule.$L('ChemWidgetTexts.CAPTION_CUT'), Kekule.$L('ChemWidgetTexts.HINT_CUT')) */;
	},
	/** @private */
	doUpdate: function(/*$super*/)
	{
		this.tryApplySuper('doUpdate')  /* $super() */;
		if (this.getEnabled())
			this.setEnabled(this.getEditor().hasSelection());
	},
	/** @private */
	doExecute: function()
	{
		var editor = this.getEditor();
		var chemSpace = editor.getChemSpace && editor.getChemSpace();
		if (editor && chemSpace)
		{
			var objs = editor.cloneSelection();
			//Kekule.Widget.clipboard.setObjects(Kekule.IO.MimeType.JSON, objs);
			var space = new Kekule.IntermediateChemSpace();
			try
			{
				space.appendChildren(objs);  // use a space to keep all objs, to keep the relations
				Kekule.Widget.clipboard.setObjects(Kekule.IO.MimeType.JSON, [space]);
			}
			finally
			{
				space.finalize();
			}

			// TODO: this is not a good approach
			var controller = editor.getIaController('BasicMolEraserIaController');
			if (controller)
				controller.removeSelection();
		}
	}
});
/**
 * A copying selection action on editor.
 * @class
 * @augments Kekule.Editor.ActionOnEditor
 *
 * @param {Kekule.Editor.BaseEditor} editor Target editor object.
 */
Kekule.Editor.ActionPaste = Class.create(Kekule.Editor.ActionOnEditor,
/** @lends Kekule.Editor.ActionPaste# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ActionPaste',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_PASTE,
	/** @constructs */
	initialize: function(/*$super, */editor)
	{
		this.tryApplySuper('initialize', [editor, /*CWT.CAPTION_PASTE, CWT.HINT_PASTE*/Kekule.$L('ChemWidgetTexts.CAPTION_PASTE'), Kekule.$L('ChemWidgetTexts.HINT_PASTE')])  /* $super(editor, \*CWT.CAPTION_PASTE, CWT.HINT_PASTE*\Kekule.$L('ChemWidgetTexts.CAPTION_PASTE'), Kekule.$L('ChemWidgetTexts.HINT_PASTE')) */;
		Kekule.Widget.clipboard.addEventListener('setData', this._reactClipboardChange, this);
	},
	/** @ignore */
	finalize: function(/*$super*/)
	{
		Kekule.Widget.clipboard.removeEventListener('setData', this._reactClipboardChange, this);
		this.tryApplySuper('finalize')  /* $super() */;
	},
	/** @private */
	_reactClipboardChange: function()
	{
		this.update();
	},
	/** @private */
	doUpdate: function(/*$super*/)
	{
		this.tryApplySuper('doUpdate')  /* $super() */;
		if (this.getEnabled())
			this.setEnabled(Kekule.Widget.clipboard.hasData(Kekule.IO.MimeType.JSON) && this.getEditor().canAddNewStandaloneObject());
	},
	/** @private */
	getObjsCenterScreenCoord: function(editor, objects)
	{
		/*
		var BU = Kekule.BoxUtils;
		var CU = Kekule.CoordUtils;
		var containerBox = null;
		for (var i = 0, l = objects.length; i < l; ++i)
		{
			var box = Kekule.Render.ObjUtils.getContainerBox(objects[i], editor.getCoordMode(), editor.getAllowCoordBorrow());
			if (!containerBox)
				containerBox = box;
			else
				containerBox = BU.getContainerBox(box, containerBox);
		}
		//var centerCoord = BU.getCenterCoord(containerBox);
		var coords = BU.getMinMaxCoords(containerBox);
		var screenCoords = {
			'min': editor.objCoordToScreen(coords.min),
			'max': editor.objCoordToScreen(coords.max)
		};
		var result = CU.add(screenCoords.min, screenCoords.max);
		var result = CU.divide(result, 2);
		//return editor.objCoordToScreen(centerCoord);
		return result;
		*/
		return Kekule.Editor.ActionOperUtils.getObjsCenterScreenCoord(editor, objects);
	},
	/** @private */
	doExecute: function()
	{
		var editor = this.getEditor();
		if (editor && editor.getChemSpace)
		{
			//var objs = Kekule.Widget.clipboard.getObjects(Kekule.IO.MimeType.JSON);
			var space, objs;
			var clipboardObjs = Kekule.Widget.clipboard.getObjects(Kekule.IO.MimeType.JSON);
			if (clipboardObjs.length === 1 && clipboardObjs[0] instanceof Kekule.IntermediateChemSpace)
			{
				space = clipboardObjs[0];
				objs = AU.clone(space.getChildren());

				// remove objs from space first
				space.removeChildren(objs);
			}
			else
				objs = clipboardObjs;

			if (space)
				space.finalize();

			// calc coord offset
			var coordOffset = null;
			var selObjs = editor.getSelection();
			if (selObjs && selObjs.length)
			{
				coordOffset = editor.getDefaultCloneScreenCoordOffset? editor.getDefaultCloneScreenCoordOffset(): null;
				var originalSelectedObjs = AU.clone(selObjs);
				if (originalSelectedObjs && originalSelectedObjs.length && coordOffset)
				{
					var originCenterCoord = this.getObjsCenterScreenCoord(editor, originalSelectedObjs);
					var targetCenterCoord = this.getObjsCenterScreenCoord(editor, objs);
					var deltaCoord = Kekule.CoordUtils.substract(originCenterCoord, targetCenterCoord);
					coordOffset = Kekule.CoordUtils.add(coordOffset, deltaCoord);
				}
			}

			Kekule.Editor.ActionOperUtils.addObjectsToChemSpaceEditor(editor, objs, {
				'screenCoordOffset': coordOffset,
				'autoSelect': true
			});
		}
		/*
		var chemSpace = editor.getChemSpace && editor.getChemSpace();
		if (editor && chemSpace)
		{
			var objs = Kekule.Widget.Clipboard.getObjects('text/json');
			editor.beginUpdateObject();
			try
			{
				var marcoOper = new Kekule.MacroOperation();
				for (var i = 0, l = objs.length; i < l; ++i)
				{
					var obj = objs[i];
					var oper = new Kekule.ChemObjOperation.Add(objs[i], chemSpace);
					marcoOper.add(oper);
				}
				marcoOper.execute();

				var coordOffset = editor.getDefaultCloneScreenCoordOffset();
				if (coordOffset)
				{
					for (var i = 0, l = objs.length; i < l; ++i)
					{
						var obj = objs[i];
						var coord = editor.getObjectScreenCoord(obj);
						var newCoord = Kekule.CoordUtils.add(coord, coordOffset);
						editor.setObjectScreenCoord(obj, newCoord);
					}
				}

				editor.pushOperation(marcoOper);
				editor.select(objs);
			}
			finally
			{
				editor.endUpdateObject();
			}
		}
		*/
	}
});

/**
 * Set isToggleSelectionOn property to editor.
 * @class
 * @augments Kekule.Editor.ActionOnEditor
 *
 * @param {Kekule.Editor.BaseEditor} editor Target editor object.
 */
Kekule.Editor.ActionToggleSelectState = Class.create(Kekule.Editor.ActionOnEditor,
/** @lends Kekule.Editor.ActionToggleSelectState# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ActionToggleSelectState',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_TOGGLE_SELECT,
	/** @constructs */
	initialize: function(/*$super, */editor)
	{
		this.tryApplySuper('initialize', [editor, Kekule.$L('ChemWidgetTexts.CAPTION_TOGGLE_SELECT'), Kekule.$L('ChemWidgetTexts.HINT_TOGGLE_SELECT')])  /* $super(editor, Kekule.$L('ChemWidgetTexts.CAPTION_TOGGLE_SELECT'), Kekule.$L('ChemWidgetTexts.HINT_TOGGLE_SELECT')) */;
		this.setExplicitGroup('');  // force no check group
	},
	/** @ignore */
	getPreferredWidgetClass: function()
	{
		return Kekule.Widget.CheckButton;
	},
	/** @private */
	doUpdate: function(/*$super*/)
	{
		this.tryApplySuper('doUpdate')  /* $super() */;
		this.setChecked(this.getEditor().getIsToggleSelectOn());
	},
	/** @ignore */
	checkedChanged: function(/*$super*/)
	{
		this.tryApplySuper('checkedChanged')  /* $super() */;

	},
	/** @ignore */
	doExecute: function(/*$super, */target, htmlEvent)
	{
		this.tryApplySuper('doExecute', [target, htmlEvent])  /* $super(target, htmlEvent) */;
		var oldChecked = this.getChecked();
		var editor = this.getEditor();
		editor.setIsToggleSelectOn(!oldChecked);
		this.setChecked(!oldChecked);
	}
});

/**
 * A simple action to delete all selected objects in editor.
 * @class
 * @augments Kekule.Editor.ActionOnEditor
 *
 * @param {Kekule.Editor.BaseEditor} editor Target editor object.
 */
Kekule.Editor.ActionEraseSelection = Class.create(Kekule.Editor.ActionOnEditor,
/** @lends Kekule.Editor.ActionEraseSelection# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ActionEraseSelection',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_ERASE_SELECTION,
	/** @constructs */
	initialize: function(editor)
	{
		this.tryApplySuper('initialize', [editor, Kekule.$L('ChemWidgetTexts.CAPTION_ERASE_SELECTION'), Kekule.$L('ChemWidgetTexts.HINT_ERASE_SELECTION')]);
	},
	/** @private */
	doUpdate: function(/*$super*/)
	{
		this.tryApplySuper('doUpdate')  /* $super() */;
		if (this.getEnabled())
			this.setEnabled(this.getEditor().hasSelection());
	},
	/** @private */
	doExecute: function()
	{
		var editor = this.getEditor();
		if (editor)
		{
			// TODO: this is not a good approach, need to refactor it later
			var controller = editor.getIaController('BasicMolEraserIaController');
			if (controller)
				controller.removeSelection();
		}
	}
});

/**
 * Recheck issues for chem objects in editor.
 * @class
 * @augments Kekule.Editor.ActionOnEditor
 *
 * @param {Kekule.Editor.BaseEditor} editor Target editor object.
 */
Kekule.Editor.ActionRecheckIssues = Class.create(Kekule.Editor.ActionOnEditor,
/** @lends Kekule.Editor.ActionRecheckIssues# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ActionRecheckIssues',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_RECHECK_ISSUES,
	/** @constructs */
	initialize: function(editor)
	{
		this.tryApplySuper('initialize', [editor, Kekule.$L('ChemWidgetTexts.CAPTION_RECHECK_ISSUES'), Kekule.$L('ChemWidgetTexts.HINT_RECHECK_ISSUES')]);
	},
	/** @private */
	doUpdate: function(/*$super*/)
	{
		this.tryApplySuper('doUpdate')  /* $super() */;
		var editor = this.getEditor();
		this.setEnabled(editor.getEnableIssueCheck()).setDisplayed(editor.getEnableIssueCheck());
	},
	/** @ignore */
	doExecute: function(target, htmlEvent)
	{
		this.tryApplySuper('doExecute', [target, htmlEvent])  /* $super(target, htmlEvent) */;
		var editor = this.getEditor();
		if (editor)
			editor.checkIssues();
	}
});

/**
 * Set {@link Kekule.Editor.BaseEditor.showAllIssueMarkers} property of editor.
 * @class
 * @augments Kekule.Editor.ActionOnEditor
 *
 * @param {Kekule.Editor.BaseEditor} editor Target editor object.
 */
Kekule.Editor.ActionToggleShowIssueMarkers = Class.create(Kekule.Editor.ActionOnEditor,
/** @lends Kekule.Editor.ActionToggleShowIssueMarkers# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ActionToggleShowIssueMarkers',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_TOGGLE_SHOW_ISSUES,
	/** @constructs */
	initialize: function(editor)
	{
		this.tryApplySuper('initialize', [editor, Kekule.$L('ChemWidgetTexts.CAPTION_TOGGLE_SHOW_ISSUE_MARKERS'), Kekule.$L('ChemWidgetTexts.HINT_TOGGLE_SHOW_ISSUE_MARKERS')]);
		this.setExplicitGroup('');  // force no check group
	},
	/** @ignore */
	getPreferredWidgetClass: function()
	{
		return Kekule.Widget.CheckButton;
	},
	/** @private */
	doUpdate: function(/*$super*/)
	{
		this.tryApplySuper('doUpdate')  /* $super() */;
		var editor = this.getEditor();
		this.setChecked(editor.getShowAllIssueMarkers());
		this.setEnabled(editor.getEnableIssueCheck()).setDisplayed(editor.getEnableIssueCheck());
	},
	/** @ignore */
	doExecute: function(target, htmlEvent)
	{
		this.tryApplySuper('doExecute', [target, htmlEvent])  /* $super(target, htmlEvent) */;
		var oldChecked = this.getChecked();
		var editor = this.getEditor();
		editor.setShowAllIssueMarkers(!oldChecked);
		this.setChecked(!oldChecked);
	}
});

/**
 * Namespace of all operation creation actions for editor.
 * @namespace
 */
Kekule.Editor.ActionOperationCreate = {};
/**
 * Base operation creation action for editor.
 * This type of action is a special action, rather then run execute() directly,
 * it's main propers is to create one or multiple operations that need to be performed by the editor.
 * Usually, this type of actions should not be bound to UI directly.
 * @class
 * @augments Kekule.Editor.ActionOnEditor
 *
 * @param {Kekule.Editor.BaseEditor} editor Target editor object.
 */
Kekule.Editor.ActionOperationCreate.Base = Class.create(Kekule.Editor.ActionOnEditor,
/** @lends Kekule.Editor.ActionOperationCreate.Base# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ActionOperationCreate.Base',
	/** @constructs */
	initialize: function(editor)
	{
		this.tryApplySuper('initialize', [editor]);
	},
	/**
	 * Check whether this action can be applied to editor.
	 * Descendants should override this method.
	 * @param {Kekule.Editor.BaseEditor} editor
	 */
	applicable: function(editor)
	{
		var targets = this.getOperationTargets();
		if (targets && targets.length)
		{
			var data = this.getData();
			for (var i = 0, l = targets.length; i < l; ++i)
			{
				if (this.applicableOnTarget(targets[i], data, editor))
				{
					return true;
				}
			}
			return false;
		}
		return false;
	},
	/**
	 * Check if an operation can be created on target object in editor.
	 * Descendants should override this method.
	 * @param {Object} target
	 * @param {Hash} data
	 * @param {Kekule.Editor.BaseEditor} editor
	 * @returns {Bool}
	 */
	applicableOnTarget: function(target, data, editor)
	{
		return false;
	},
	/**
	 * Returns objects in editor that act as operation targets.
	 * Descendants should override this method.
	 * @param {Kekule.Editor.BaseEditor} editor
	 * @returns {Array}
	 */
	getOperationTargets: function(editor)
	{
		return [];
	},
	/**
	 * Returns the associated data to run the action.
	 * @returns {Hash}
	 * @private
	 */
	getData: function()
	{
		return this.ACTION_DATA || {};
	},
	/**
	 * If action can be applied to target chem objects, this method create the concrete operation.
	 * @param {Kekule.Editor.BaseEditor} editor
	 * @returns {Kekule.Operation}
	 * @private
	 */
	createOperations: function(editor)
	{
		var chemObjs = this.getOperationTargets(editor);
		var data = this.getData();
		var opers = [];
		for (var i = 0, l = chemObjs.length; i < l; ++i)
		{
			var target = chemObjs[i];
			if (this.applicableOnTarget(target, data, editor))
			{
				var oper = this.doCreateOperationOnTarget(target, data, editor);
				if (oper)
				{
					opers.push(oper);
				}
			}
		}
		return opers;
	},
	/**
	 * Do concrete work of creating operation on one target.
	 * Descendants should override this method.
	 * @param {Object} target
	 * @param {Hash} data Data of the modification.
	 * @param {Kekule.Editor.BaseEditor} editor
	 * @returns {Kekule.Operation}
	 * @private
	 */
	doCreateOperationOnTarget: function(target, data, editor)
	{
		return null;
	},
	/** @private */
	doExecute: function()
	{
		var editor = this.getEditor();
		var targets = this.getModificationTargets(editor);
		var opers = this.createOperations(targets, data, editor);
		if (opers && opers.length)
		{
			editor.execOperations(opers);
			return true;   // indicating something actually be done
		}
		else
			return false;
	}
});

/**
 * Base operation creation action for editor.
 * This type of action is a special action, rather then run execute() directly,
 * it's main propers is to create one or multiple operations that need to be performed by the editor.
 * Usually, this type of actions should not be bound to UI directly.
 * @class
 * @augments Kekule.Editor.ActionOperationCreate.Base
 *
 * @param {Kekule.Editor.BaseEditor} editor Target editor object.
 */
Kekule.Editor.ActionOperationCreate.ChemObjModify = Class.create(Kekule.Editor.ActionOperationCreate.Base,
/** @lends Kekule.Editor.ActionOperationCreate.ChemObjModify# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ActionOperationCreate.ChemObjModify',
	/** @ignore */
	getOperationTargets: function(editor)
	{
		var result = editor.getHotTrackedObjs();  // first try to apply modification to hot trackeed object
		if (!result || !result.length)   // then the selection
		{
			result = editor.getSelection();
		}
		return result;
	},
});
/**
 * Modify or replace a chem node in editor.
 * @class
 * @augments Kekule.Editor.ActionOperationCreate.ChemObjModify
 */
Kekule.Editor.ActionOperationCreate.ChemNodeModify = Class.create(Kekule.Editor.ActionOperationCreate.ChemObjModify,
/** @lends Kekule.Editor.ActionOperationCreate.ChemNodeModify# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ActionOperationCreate.ChemNodeModify',
	/** @ignore */
	applicableOnTarget: function(target, data, editor)
	{
		// at least there should be a bond connected to target, avoid modifier standalone molecule in editor
		return (target instanceof Kekule.ChemStructureNode) && !(target instanceof Kekule.Molecule) && (target.getLinkedBonds().length);
	},
	/** @ignore */
	doCreateOperationOnTarget: function(target, data, editor)
	{
		return Kekule.Editor.OperationUtils.createNodeModificationOperationFromData(target, data, editor);
	}
});
/**
 * Modify or replace a chem connector in editor.
 * @class
 * @augments Kekule.Editor.ActionOperationCreate.ChemObjModify
 */
Kekule.Editor.ActionOperationCreate.ChemConnectorModify = Class.create(Kekule.Editor.ActionOperationCreate.ChemObjModify,
/** @lends Kekule.Editor.ActionOperationCreate.ChemConnectorModify# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ActionOperationCreate.ChemConnectorModify',
	/** @ignore */
	applicableOnTarget: function(target, data, editor)
	{
		return (target instanceof Kekule.ChemStructureConnector);
	},
	/** @ignore */
	doCreateOperationOnTarget: function(target, data, editor)
	{
		// data is simply a prop-value pair hash
		if (Kekule.ObjUtils.match(target, data))  // no actual modified props
			return null;
		else
			return new Kekule.ChemObjOperation.Modify(target, data, editor);
	}
});

/** @ignore */
Kekule.Editor.createEditorOperationCreateActionClass = function(classShortName, actionRegName, superClass, actionData)
{
	var definition = {};
	if (classShortName)
		definition.CLASS_NAME = 'Kekule.Editor.ActionOperationCreate.' + classShortName;
	if (actionData)
		definition.ACTION_DATA = actionData;
	var result = Class.create(superClass, definition);
	if (actionRegName)
	{
		_editorActionRegInfo.push({'name': actionRegName, 'actionClass': result});
	}
	return result;
};

// create and register some default operation create action classes
function _createAndRegisterNodeModifyActions()
{
	var atomIsotopeIds = ['C', 'H', 'O', 'N', 'P', 'S', 'Si', 'F', 'Cl', 'Br', 'I', 'B', 'K', 'Na', 'D'];
	var repSubgroupNames = ['methyl', 'ethyl', 'phenyl', 'Ac', 'TMS', 'COOCH3', 'OTs'];
	var superClass = Kekule.Editor.ActionOperationCreate.ChemNodeModify;
	var create = Kekule.Editor.createEditorOperationCreateActionClass;

	for (var i = 0, l = atomIsotopeIds.length; i < l; ++i)
	{
		var actionId = 'atom_' + atomIsotopeIds[i];
		create(null, actionId, superClass, {'nodeClass': Kekule.Atom, props: {'isotopeId': atomIsotopeIds[i]}});
	}
	for (var i = 0, l = repSubgroupNames.length; i < l; ++i)
	{
		var repName = repSubgroupNames[i];
		var actionId = 'subgroup_' + repName;
		var repItem = Kekule.Editor.RepositoryItemManager.getItem(repName);
		var structFragment = repItem.getStructureFragment && repItem.getStructureFragment();
		if (structFragment)
			create(null, actionId, superClass, {'nodeClass': structFragment.getClass(), 'repositoryItem': repItem});
	}

	// special nodes
	create(null, 'subgroup_R', superClass, {'nodeClass': Kekule.SubGroup});
	create(null, 'atom_variable', superClass, {'nodeClass': Kekule.VariableAtom});
	create(null, 'atom_dummy', superClass, {'nodeClass': Kekule.Pseudoatom, 'props': {'atomType': Kekule.PseudoatomType.DUMMY}});
	create(null, 'atom_hetero', superClass, {'nodeClass': Kekule.Pseudoatom, 'props': {'atomType': Kekule.PseudoatomType.HETERO}});
	create(null, 'atom_any', superClass, {'nodeClass': Kekule.Pseudoatom, 'props': {'atomType': Kekule.PseudoatomType.ANY}});
}

function _createAndRegisterConnectorModifyActions()
{
	var BT = Kekule.BondType;
	var BO = Kekule.BondOrder;
	var BS = Kekule.BondStereo;
	var bondMap = {
		'single': {'bondType': BT.COVALENT, 'bondOrder': BO.SINGLE,	'stereo': BS.NONE},
		'double': {'bondType': BT.COVALENT, 'bondOrder': BO.DOUBLE,	'stereo': BS.NONE},
		'triple': {'bondType': BT.COVALENT, 'bondOrder': BO.TRIPLE,	'stereo': BS.NONE},
		'quad': {'bondType': BT.COVALENT, 'bondOrder': BO.QUAD,	'stereo': BS.NONE},
		'up': {'bondType': BT.COVALENT, 'bondOrder': BO.SINGLE,	'stereo': BS.UP},
		'down': {'bondType': BT.COVALENT, 'bondOrder': BO.SINGLE,	'stereo': BS.DOWN},
		'closer': {'bondType': BT.COVALENT, 'bondOrder': BO.SINGLE,	'stereo': BS.CLOSER},
		'upOrDown': {'bondType': BT.COVALENT, 'bondOrder': BO.SINGLE,	'stereo': BS.UP_OR_DOWN}
	};

	var superClass = Kekule.Editor.ActionOperationCreate.ChemConnectorModify;
	var create = Kekule.Editor.createEditorOperationCreateActionClass;
	var names = Kekule.ObjUtils.getOwnedFieldNames(bondMap);
	for (var i = 0, l = names.length; i < l; ++i)
	{
		create(null, 'bond_' + names[i], superClass, bondMap[names[i]]);
	}
}

function _createAndRegisterPredefinedOperationCreateActions()
{
	_createAndRegisterNodeModifyActions();
	_createAndRegisterConnectorModifyActions();
}


/**
 * Base class for actions for chem composer.
 * @class
 * @augments Kekule.Action
 *
 * @param {Kekule.Editor.Composer} composer Target composer widget.
 * @param {String} caption
 * @param {String} hint
 */
Kekule.Editor.ActionOnComposer = Class.create(Kekule.Action,
/** @lends Kekule.Editor.ActionOnComposer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ActionOnComposer',
	/** @constructs */
	initialize: function(/*$super, */composer, caption, hint)
	{
		this.tryApplySuper('initialize')  /* $super() */;
		this.setText(caption);
		this.setHint(hint);
		this.setComposer(composer);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('composer', {'dataType': 'Kekule.Editor.Composer', 'serializable': false});
	},
	/** @private */
	doUpdate: function()
	{
		var composer = this.getComposer();
		var editor = this.getEditor();
		this.setEnabled(composer && composer.getEnabled() && editor && editor.getChemObj() && editor.getChemObjLoaded() && editor.getEnabled());
	},
	/**
	 * Returns chem editor object inside composer.
	 * @returns {Kekule.Editor.BaseEditor}
	 */
	getEditor: function()
	{
		var composer = this.getComposer();
		return composer? composer.getEditor(): null;
	}
});

/**
 * Actions that has a series of child attached actions on composer (such as bond action
 * may has single, double, triple bond variations).
 * @class
 * @augments Kekule.Editor.ActionOnComposer
 *
 * @property {Kekule.ActionList} attachedActions
 * @property {Kekule.Action} defaultAttachedAction If this property is set, when check on the parent action,
 *   if no attached action is checked, default one will be checked on automatically.
 */
Kekule.Editor.ActionOnComposerAdv = Class.create(Kekule.Editor.ActionOnComposer,
/** @lends Kekule.Editor.ActionOnComposerAdv# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ActionOnComposerAdv',
	/** @constructs */
	initialize: function(/*$super, */composer, caption, hint)
	{
		var actions = new Kekule.ActionList();
		actions.setOwnActions(true);
		this.setPropStoreFieldValue('attachedActions', actions);
		this.tryApplySuper('initialize', [composer, caption, hint])  /* $super(composer, caption, hint) */;
	},
	finalize: function(/*$super*/)
	{
		this.getAttachedActions().finalize();
		this.tryApplySuper('finalize')  /* $super() */;
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('attachedActionClasses', {'dataType': DataType.ARRAY, 'serializable': false, 'setter': null});
		this.defineProp('attachedActions', {'dataType': 'Kekule.ActionList', 'serializable': false, 'setter': null});
		this.defineProp('defaultAttachedAction', {'dataType': 'Kekule.Action', 'serializable': false});
	},

	/** @private */
	checkedChanged: function(/*$super*/)
	{
		this.tryApplySuper('checkedChanged')  /* $super() */;
		var checked = this.getChecked();
		//console.log('self checked change', this.getClassName(), checked);
		if (this.hasAttachedActions())
		{
			var composer = this.getComposer();
			if (composer)
			{
				if (checked)
				{
					var attachedActions = this.getAttachedActions();
					composer.bindAssocActions(attachedActions);
					composer.showAssocToolbar();
					var checkedChild = attachedActions.getCheckedAction(this.getClassName());
					//console.log('child checked change', this.getClassName(), checkedChild.getClassName(), attachedActions.getActions());
					/*
					if (checkedChild)
					{
						console.log('execute child', checkedChild.getClassName());
						checkedChild.execute();
					}
					else
					{
						var defAction = this.getDefaultAttachedAction();
						if (defAction)
						{
							if (defAction.getCheckGroup() && !this.getAttachedActions().hasActionChecked(defAction.getCheckGroup()))
								defAction.execute();
						}
					}
					*/
					if (!checkedChild)
						checkedChild = this.getDefaultAttachedAction();
					// check and execute child
					if (checkedChild)
					{
						checkedChild.setChecked(false);  // important, force execute again
						checkedChild.execute();
					}
				}
				else
				{
					composer.hideAssocToolbar();
				}
			}
		}
	},

	/**
	 * Check if there are attached actions to this one.
	 * @returns {Bool}
	 */
	hasAttachedActions: function()
	{
		return !!this.getAttachedActions().getActionCount();
	},
	/**
	 * Set a new position of attached child action.
	 * @param {Kekule.Action} action
	 * @param {Int} index
	 */
	setAttachedActionIndex: function(action, index)
	{
		var actions = this.getAttachedActions();
		if (actions)
		{
			actions.setActionIndex(action, index);
		}
		return this;
	},
	/**
	 * Add an attached actions.
	 */
	addAttachedAction: function(action, asDefault)
	{
		this.getAttachedActions().add(action);
		if (asDefault)
			this.setDefaultAttachedAction(action);
		return this;
	},
	/**
	 * Remove attached actions.
	 */
	removeAttachedAction: function(action)
	{
		if (this.getDefaultAttachedAction() === action)
			this.setDefaultAttachedAction(null);
		this.getAttachedActions().remove(action);
		return this;
	},
	/**
	 * Clear all attached actions.
	 */
	clearAttachedActions: function()
	{
		this.setDefaultAttachedAction(null);
		var actions = this.getAttachedActions();
		actions.clear();
	},

	/** @private */
	doExecute: function()
	{
		// when execute a adv action, a attached panel should be shown in composer to display all attached actions
		// TODO
	},
	/** @ignore */
	update: function(/*$super*/)
	{
		this.tryApplySuper('update')  /* $super() */;
		this.getAttachedActions().updateAll();
	}
});

/**
 * Action to show or hide object inspector and tree view of composer.
 * @class
 * @augments Kekule.Editor.ActionOnComposer
 *
 * @param {Kekule.Editor.Composer} composer Target composer widget.
 */
Kekule.Editor.ActionComposerToggleObjInspector = Class.create(Kekule.Editor.ActionOnComposer,
/** @lends Kekule.Editor.ActionComposerToggleObjInspector# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ActionComposerToggleObjInspector',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_TOGGLE_OBJ_INSPECTOR,
	/** @constructs */
	initialize: function(/*$super, */composer)
	{
		this.tryApplySuper('initialize', [composer, Kekule.$L('ChemWidgetTexts.CAPTION_TOGGLE_OBJ_INSPECTOR'), Kekule.$L('ChemWidgetTexts.HINT_TOGGLE_OBJ_INSPECTOR')])  /* $super(composer, \*CWT.CAPTION_TOGGLE_INSPECTOR, CWT.HINT_TOGGLE_INSPECTOR*\Kekule.$L('ChemWidgetTexts.CAPTION_TOGGLE_INSPECTOR'), Kekule.$L('ChemWidgetTexts.HINT_TOGGLE_INSPECTOR')) */;
		//this.setCheckGroup(this.getClassName());
	},
	/** @private */
	doUpdate: function()
	{
		var composer = this.getComposer();
		if (composer)
		{
			this.setChecked(composer.getShowObjInspector());
		}
	},
	/** @private */
	doExecute: function()
	{
		var composer = this.getComposer();
		if (composer)
		{
			this.setChecked(!this.getChecked());
			composer.setShowObjInspector(this.getChecked());
		}
	}
});
// for backward compatibility
Kekule.Editor.ActionComposerToggleInspector = Kekule.Editor.ActionComposerToggleObjInspector;

/**
 * Action to show or hide error inspector of composer.
 * @class
 * @augments Kekule.Editor.ActionOnComposer
 *
 * @param {Kekule.Editor.Composer} composer Target composer widget.
 */
Kekule.Editor.ActionComposerToggleIssueInspector = Class.create(Kekule.Editor.ActionOnComposer,
/** @lends Kekule.Editor.ActionComposerToggleIssueInspector# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ActionComposerToggleIssueInspector',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_TOGGLE_ISSUE_INSPECTOR,
	/** @constructs */
	initialize: function(composer)
	{
		this.tryApplySuper('initialize', [composer, Kekule.$L('ChemWidgetTexts.CAPTION_TOGGLE_ISSUE_INSPECTOR'), Kekule.$L('ChemWidgetTexts.HINT_TOGGLE_ISSUE_INSPECTOR')]);
		//this.setCheckGroup(this.getClassName());
	},
	/** @private */
	doUpdate: function()
	{
		var composer = this.getComposer();
		if (composer)
		{
			this.setChecked(composer.getShowIssueInspector());
			this.setEnabled(composer.getEnableIssueCheck()).setDisplayed(composer.getEnableIssueCheck());
		}
	},
	/** @private */
	doExecute: function()
	{
		var composer = this.getComposer();
		if (composer)
		{
			this.setChecked(!this.getChecked());
			composer.setShowIssueInspector(this.getChecked());
		}
	}
});

/**
 * Action to change IA controller of editor/composer.
 * @class
 * @augments Kekule.Editor.ActionOnComposerAdv
 *
 * @param {Kekule.Editor.Composer} composer Target composer widget.
 * @param {String} caption
 * @param {String} hint
 * @param {String} controllerId
 */
Kekule.Editor.ActionComposerSetIaController = Class.create(Kekule.Editor.ActionOnComposerAdv,
/** @lends Kekule.Editor.ActionComposerSetIaController# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ActionComposerSetIaController',
	/** @constructs */
	initialize: function(/*$super, */composer, caption, hint, controllerId)
	{
		this.tryApplySuper('initialize', [composer, caption, hint])  /* $super(composer, caption, hint) */;
		this.setPropStoreFieldValue('iaControllerId', controllerId);
	},
	/** @private */
	initProperties: function()
	{
		//this.defineProp('editorConfigs', {'dataType': 'Kekule.Editor.BaseEditorConfigs', 'serializable': false});
		//this.defineProp('iaController', {'dataType': 'Kekule.Editor.BaseEditorIaController', 'serializable': false, 'setter': null});
		this.defineProp('iaControllerId', {'dataType': DataType.STRING, 'serializable': false, 'setter': null});
	},
	/** @private */
	doExecute: function()
	{
		//console.log('set active id', this.getIaControllerId());
		this.getEditor().setActiveIaControllerId(this.getIaControllerId());
	}
});



/** @ignore */
Kekule.Editor.createComposerIaControllerActionClass = function(className,
	caption, hint, iaControllerId, htmlClassName,
	specifiedProps, attachedActionClasses, methods,
	actionRegName, actionTargetClass)
{
	if (!htmlClassName)
		htmlClassName = iaControllerId;
	if (!htmlClassName.startsWith(Kekule.ChemWidget.HtmlClassNames.PREFIX))
		htmlClassName = Kekule.ChemWidget.HtmlClassNames.PREFIX + htmlClassName;
	var data = {
		CLASS_NAME: className,
		HTML_CLASSNAME: htmlClassName,
		initialize: function(/*$super, */composer)
		{
			this.tryApplySuper('initialize', [composer, caption, hint, iaControllerId])  /* $super(composer, caption, hint, iaControllerId) */;
			if (this.initAttachedActions)
				this.initAttachedActions();
		}
	};
	if (methods)
	{
		data = Object.extend(data, methods);
	}
	if (specifiedProps)
	{
		var oldDoExecute;
		if (data.doExecute)  // has set a doExecute in methods
		  oldDoExecute = data.doExecute;
		data.doExecute = function(/*$super*/)
		{
			var editor = this.getEditor();
			var controller = editor.getIaController(iaControllerId);
			if (controller)
			{
				controller.setPropValues(specifiedProps);
			}
			//console.log('execute self', this.getClassName());
			if (oldDoExecute)
				//oldDoExecute.apply(this, [$super]);
				oldDoExecute.apply(this);
			else
				//$super();
				this.tryApplySuper('doExecute');
		}
	}
	if (attachedActionClasses)
	{
		data.initAttachedActions = function()
		{
			/*
			var composer = this.getComposer();
			var checkGroup = this.getClassName();
			for (var i = 0, l = attachedActionClasses.length; i < l; ++i)
			{
				var action = new attachedActionClasses[i](composer);
				action.setCheckGroup(checkGroup);
				this.addAttachedAction(action, i === 0);  // the first one is the default action
			}
			*/
			this.setPropStoreFieldValue('attachedActionClasses', attachedActionClasses);
		};
	}
	var result = Class.create(Kekule.Editor.ActionComposerSetIaController, data);
	if (actionRegName)
	{
		_editorActionRegInfo.push({'name': actionRegName, 'actionClass': result, 'widgetClass': actionTargetClass});
	}
	return result;
};

////////////// create ia controller actions ///////////////////////////

// Client drag and scroll
Kekule.Editor.ActionComposerClientDragScrollController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerClientDragScrollController',
	Kekule.$L('ChemWidgetTexts.CAPTION_CLIENT_DRAGSCROLL'), //Kekule.ChemWidgetTexts.CAPTION_ERASE,
	Kekule.$L('ChemWidgetTexts.HINT_CLIENT_DRAGSCROLL'), //Kekule.ChemWidgetTexts.HINT_ERASE,
	'ClientDragScrollIaController',
	null,
	null,
	null,
	null,
	BNS.dragScroll
);

// Select and variantions
Kekule.Editor.ActionComposerSetManipulateControllerMarquee = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetManipulateControllerMarquee',
	Kekule.$L('ChemWidgetTexts.CAPTION_MANIPULATE_MARQUEE'),
	Kekule.$L('ChemWidgetTexts.HINT_MANIPULATE_MARQUEE'),
	'SelectIaController',
	'SelectIaController-Marquee',
	{
		'enableGestureManipulation': true,
		'selectMode': Kekule.Editor.SelectMode.RECT
	},
	null,
	{
		doExecute: function(/*$super*/)
		{
			this.tryApplySuper('doExecute')  /* $super() */;
			var editor = this.getEditor();
			editor.setSelectMode(Kekule.Editor.SelectMode.RECT);
		}
	},
	BNS.manipulateMarquee
);
Kekule.Editor.ActionComposerSetManipulateControllerLasso = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetManipulateControllerLasso',
	Kekule.$L('ChemWidgetTexts.CAPTION_MANIPULATE_LASSO'),
	Kekule.$L('ChemWidgetTexts.HINT_MANIPULATE_LASSO'),
	'SelectIaController',
	'SelectIaController-Lasso',
	{
		'enableGestureManipulation': true,
		'selectMode': Kekule.Editor.SelectMode.POLYGON
	},
	null,
	{
		doExecute: function(/*$super*/)
		{
			this.tryApplySuper('doExecute')  /* $super() */;
			var editor = this.getEditor();
			editor.setSelectMode(Kekule.Editor.SelectMode.POLYGON);
		}
	},
	BNS.manipulateLasso
);
Kekule.Editor.ActionComposerSetManipulateControllerBrush = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetManipulateControllerBrush',
	Kekule.$L('ChemWidgetTexts.CAPTION_MANIPULATE_BRUSH'),
	Kekule.$L('ChemWidgetTexts.HINT_MANIPULATE_BRUSH'),
	'SelectIaController',
	'SelectIaController-Brush',
	{
		'enableGestureManipulation': true,
		'selectMode': Kekule.Editor.SelectMode.POLYLINE
	},
	null,
	{
		doExecute: function(/*$super*/)
		{
			this.tryApplySuper('doExecute')  /* $super() */;
			var editor = this.getEditor();
			editor.setSelectMode(Kekule.Editor.SelectMode.POLYLINE);
		}
	},
	BNS.manipulateBrush
);
Kekule.Editor.ActionComposerSetManipulateControllerAncestor = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetManipulateControllerAncestor',
	Kekule.$L('ChemWidgetTexts.CAPTION_MANIPULATE_ANCESTOR'),
	Kekule.$L('ChemWidgetTexts.HINT_MANIPULATE_ANCESTOR'),
	'SelectIaController',
	'SelectIaController-Ancestor',
	{
		'enableGestureManipulation': true,
		'selectMode': Kekule.Editor.SelectMode.ANCESTOR
	},
	null,
	{
		doExecute: function(/*$super*/)
		{
			this.tryApplySuper('doExecute')  /* $super() */;
			var editor = this.getEditor();
			editor.setSelectMode(Kekule.Editor.SelectMode.ANCESTOR);
		}
	},
	BNS.manipulateAncestor
);
Kekule.Editor.ActionComposerSetManipulateController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetManipulateController',
	Kekule.$L('ChemWidgetTexts.CAPTION_MANIPULATE'), //Kekule.ChemWidgetTexts.CAPTION_MANIPULATE,
	Kekule.$L('ChemWidgetTexts.HINT_MANIPULATE'), //Kekule.ChemWidgetTexts.HINT_MANIPULATE,
	'SelectIaController',
	null,
	null,
	[
		Kekule.Editor.ActionComposerSetManipulateControllerMarquee,
		Kekule.Editor.ActionComposerSetManipulateControllerLasso,
		Kekule.Editor.ActionComposerSetManipulateControllerBrush,
		Kekule.Editor.ActionComposerSetManipulateControllerAncestor,
		Kekule.Editor.ActionComposerClientDragScrollController,
		Kekule.Editor.ActionToggleSelectState
	],
	null,
	BNS.manipulate
);


// Erase
Kekule.Editor.ActionComposerSetEraserController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetEraserController',
	Kekule.$L('ChemWidgetTexts.CAPTION_ERASE'), //Kekule.ChemWidgetTexts.CAPTION_ERASE,
	Kekule.$L('ChemWidgetTexts.HINT_ERASE'), //Kekule.ChemWidgetTexts.HINT_ERASE,
	'BasicMolEraserIaController',
	null,
	null,
	null,
	{
		doExecute: function(/*$super*/)
		{
			this.tryApplySuper('doExecute')  /* $super() */;
			var editor = this.getEditor();
			if (editor.hasSelection())
				editor.getActiveIaController().removeSelection();
		}
	},
	BNS.erase
);

// Track input
Kekule.Editor.ActionComposerSetTrackController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetTrackController',
	Kekule.$L('ChemWidgetTexts.CAPTION_TRACK_INPUT'), //Kekule.ChemWidgetTexts.CAPTION_ERASE,
	Kekule.$L('ChemWidgetTexts.HINT_TRACK_INPUT'), //Kekule.ChemWidgetTexts.HINT_ERASE,
	'TrackInputIaController',
	null,
	null,
	null,
	null,
	BNS.trackInput
);

// Bond and its variations
Kekule.Editor.ActionComposerSetBondControllerSingle = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetBondControllerSingle',
	Kekule.$L('ChemWidgetTexts.CAPTION_MOL_BOND_SINGLE'), //Kekule.ChemWidgetTexts.CAPTION_MOL_BOND_SINGLE,
	Kekule.$L('ChemWidgetTexts.HINT_MOL_BOND_SINGLE'), //Kekule.ChemWidgetTexts.HINT_MOL_BOND_SINGLE,
	'MolBondIaController',
	'MolBondIaController-Single',
	{
		'bondType': Kekule.BondType.COVALENT,
		'bondOrder': Kekule.BondOrder.SINGLE,
		'bondStereo': Kekule.BondStereo.NONE
	},
	null, null,
	BNS.molBondSingle
);
Kekule.Editor.ActionComposerSetBondControllerDouble = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetBondControllerDouble',
	Kekule.$L('ChemWidgetTexts.CAPTION_MOL_BOND_DOUBLE'), //Kekule.ChemWidgetTexts.CAPTION_MOL_BOND_DOUBLE,
	Kekule.$L('ChemWidgetTexts.HINT_MOL_BOND_DOUBLE'), //Kekule.ChemWidgetTexts.HINT_MOL_BOND_DOUBLE,
	'MolBondIaController',
	'MolBondIaController-Double',
	{
		'bondType': Kekule.BondType.COVALENT,
		'bondOrder': Kekule.BondOrder.DOUBLE,
		'bondStereo': Kekule.BondStereo.NONE
	},
	null, null,
	BNS.molBondDouble
);
Kekule.Editor.ActionComposerSetBondControllerTriple = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetBondControllerTriple',
	Kekule.$L('ChemWidgetTexts.CAPTION_MOL_BOND_TRIPLE'), //Kekule.ChemWidgetTexts.CAPTION_MOL_BOND_TRIPLE,
	Kekule.$L('ChemWidgetTexts.HINT_MOL_BOND_TRIPLE'), //Kekule.ChemWidgetTexts.HINT_MOL_BOND_TRIPLE,
	'MolBondIaController',
	'MolBondIaController-Triple',
	{
		'bondType': Kekule.BondType.COVALENT,
		'bondOrder': Kekule.BondOrder.TRIPLE,
		'bondStereo': Kekule.BondStereo.NONE
	},
	null, null,
	BNS.molBondTriple
);
Kekule.Editor.ActionComposerSetBondControllerCloser = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetBondControllerCloser',
	Kekule.$L('ChemWidgetTexts.CAPTION_MOL_BOND_CLOSER'), //Kekule.ChemWidgetTexts.CAPTION_MOL_BOND_WEDGEUP,
	Kekule.$L('ChemWidgetTexts.HINT_MOL_BOND_CLOSER'), //Kekule.ChemWidgetTexts.HINT_MOL_BOND_WEDGEUP,
	'MolBondIaController',
	'MolBondIaController-Closer',
	{
		'bondType': Kekule.BondType.COVALENT,
		'bondOrder': Kekule.BondOrder.SINGLE,
		'bondStereo': Kekule.BondStereo.CLOSER
	},
	null, null,
	BNS.molBondCloser
);
Kekule.Editor.ActionComposerSetBondControllerWedgeUp = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetBondControllerWedgeUp',
	Kekule.$L('ChemWidgetTexts.CAPTION_MOL_BOND_WEDGEUP'), //Kekule.ChemWidgetTexts.CAPTION_MOL_BOND_WEDGEUP,
	Kekule.$L('ChemWidgetTexts.HINT_MOL_BOND_WEDGEUP'), //Kekule.ChemWidgetTexts.HINT_MOL_BOND_WEDGEUP,
	'MolBondIaController',
	'MolBondIaController-WedgeUp',
	{
		'bondType': Kekule.BondType.COVALENT,
		'bondOrder': Kekule.BondOrder.SINGLE,
		'bondStereo': Kekule.BondStereo.UP
	},
	null, null,
	BNS.molBondWedgeUp
);
Kekule.Editor.ActionComposerSetBondControllerWedgeDown = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetBondControllerWedgeDown',
	Kekule.$L('ChemWidgetTexts.CAPTION_MOL_BOND_WEDGEDOWN'), //Kekule.ChemWidgetTexts.CAPTION_MOL_BOND_WEDGEDOWN,
	Kekule.$L('ChemWidgetTexts.HINT_MOL_BOND_WEDGEDOWN'), //Kekule.ChemWidgetTexts.HINT_MOL_BOND_WEDGEDOWN,
	'MolBondIaController',
	'MolBondIaController-WedgeDown',
	{
		'bondType': Kekule.BondType.COVALENT,
		'bondOrder': Kekule.BondOrder.SINGLE,
		'bondStereo': Kekule.BondStereo.DOWN
	},
	null, null,
	BNS.molBondWedgeDown
);
Kekule.Editor.ActionComposerSetBondControllerWedgeUpOrDown = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetBondControllerWedgeUpOrDown',
	Kekule.$L('ChemWidgetTexts.CAPTION_MOL_BOND_WAVY'), //Kekule.ChemWidgetTexts.CAPTION_MOL_BOND_WAVY,
	Kekule.$L('ChemWidgetTexts.HINT_MOL_BOND_WAVY'), //Kekule.ChemWidgetTexts.HINT_MOL_BOND_WAVY,
	'MolBondIaController',
	'MolBondIaController-WedgeUpOrDown',
	{
		'bondType': Kekule.BondType.COVALENT,
		'bondOrder': Kekule.BondOrder.SINGLE,
		'bondStereo': Kekule.BondStereo.UP_OR_DOWN
	},
	null, null,
	BNS.molBondWedgeUpOrDown
);
Kekule.Editor.ActionComposerSetBondControllerDoubleEither = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetBondControllerDoubleEither',
	Kekule.$L('ChemWidgetTexts.CAPTION_MOL_BOND_DOUBLE_EITHER'), //Kekule.ChemWidgetTexts.CAPTION_MOL_BOND_DOUBLE,
	Kekule.$L('ChemWidgetTexts.HINT_MOL_BOND_DOUBLE_EITHER'), //Kekule.ChemWidgetTexts.HINT_MOL_BOND_DOUBLE,
	'MolBondIaController',
	'MolBondIaController-Double-Either',
	{
		'bondType': Kekule.BondType.COVALENT,
		'bondOrder': Kekule.BondOrder.DOUBLE,
		'bondStereo': Kekule.BondStereo.E_OR_Z
	},
	null, null,
	BNS.molBondDoubleEither
);

Kekule.Editor.ActionComposerSetRepositoryFischer1Controller = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryFischer1Controller',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_FISCHER1'),
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_FISCHER1'),
	'RepositoryStructureFragmentIaController',
	'RepositoryStructureFragmentIaController-Fischer1',
	{
		'repItemName': 'fischer1'
	},
	null, null,
	BNS.molRepFischer1
);
Kekule.Editor.ActionComposerSetRepositoryFischer2Controller = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryFischer2Controller',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_FISCHER2'),
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_FISCHER2'),
	'RepositoryStructureFragmentIaController',
	'RepositoryStructureFragmentIaController-Fischer2',
	{
		'repItemName': 'fischer2'
	},
	null, null,
	BNS.molRepFischer2
);
Kekule.Editor.ActionComposerSetRepositoryFischer3Controller = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryFischer3Controller',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_FISCHER3'),
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_FISCHER3'),
	'RepositoryStructureFragmentIaController',
	'RepositoryStructureFragmentIaController-Fischer3',
	{
		'repItemName': 'fischer3'
	},
	null, null,
	BNS.molRepFischer3
);
Kekule.Editor.ActionComposerSetRepositorySawhorseStaggeredController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositorySawhorseStaggeredController',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_SAWHORSE_STAGGERED'),
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_SAWHORSE_STAGGERED'),
	'RepositoryStructureFragmentIaController',
	'RepositoryStructureFragmentIaController-SawhorseStaggered',
	{
		'repItemName': 'sawhorseStaggered'
	},
	null, null,
	BNS.molRepSawhorseStaggered
);
Kekule.Editor.ActionComposerSetRepositorySawhorseEclipsedController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositorySawhorseEclipsedController',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_SAWHORSE_ECLIPSED'),
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_SAWHORSE_ECLIPSED'),
	'RepositoryStructureFragmentIaController',
	'RepositoryStructureFragmentIaController-SawhorseEclipsed',
	{
		'repItemName': 'sawhorseEclipsed'
	},
	null, null,
	BNS.molRepSawhorseEclipsed
);
Kekule.Editor.ActionComposerSetRepositoryMethaneController = Kekule.Editor.createComposerIaControllerActionClass(
		'Kekule.Editor.ActionComposerSetRepositoryMethaneController',
		Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_METHANE'),
		Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_METHANE'),
		'RepositoryStructureFragmentIaController',
		'RepositoryStructureFragmentIaController-Methane',
		{
			'repItemName': 'methane'
		},
		null, null,
		BNS.molRepMethane
);
Kekule.Editor.ActionComposerSetRepositorySubBondMarkController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositorySubBondMarkController',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_SUBBOND_MARK'),
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_SUBBOND_MARK'),
	'RepositoryStructureFragmentIaController',
	'RepositoryStructureFragmentIaController-SubBondMark',
	{
		'repItemName': 'substituentMark'
	},
	null, null,
	BNS.molRepSubBondMark
);

Kekule.Editor.ActionComposerSetRepositoryMolFlexChainController = Kekule.Editor.createComposerIaControllerActionClass(
		'Kekule.Editor.ActionComposerSetRepositoryMolFlexChainController',
		Kekule.$L('ChemWidgetTexts.CAPTION_MOL_FLEXCHAIN'),
		Kekule.$L('ChemWidgetTexts.HINT_MOL_FLEXCHAIN'),
		'MolFlexChainIaController',
		'MolFlexChainIaController',
		null,
		null, null,
		BNS.molChain
);

Kekule.Editor.ActionComposerSetBondController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetBondController',
	Kekule.$L('ChemWidgetTexts.CAPTION_MOL_BOND'), //Kekule.ChemWidgetTexts.CAPTION_MOL_BOND,
	Kekule.$L('ChemWidgetTexts.HINT_MOL_BOND'), //Kekule.ChemWidgetTexts.HINT_MOL_BOND,
	'MolBondIaController',
	null,
	null,
	[
		Kekule.Editor.ActionComposerSetBondControllerSingle,
		Kekule.Editor.ActionComposerSetBondControllerDouble,
		Kekule.Editor.ActionComposerSetBondControllerTriple,
		//Kekule.Editor.ActionComposerSetBondControllerCloser,
		Kekule.Editor.ActionComposerSetBondControllerWedgeUp,
		Kekule.Editor.ActionComposerSetBondControllerWedgeDown,
		//Kekule.Editor.ActionComposerSetBondControllerWedgeUpOrDown,
		//Kekule.Editor.ActionComposerSetBondControllerDoubleEither,
		Kekule.Editor.ActionComposerSetRepositoryMolFlexChainController,
		Kekule.Editor.ActionComposerSetTrackController,
		//Kekule.Editor.ActionComposerSetRepositoryMethaneController,
		//Kekule.Editor.ActionComposerSetRepositorySubBondMarkController,
		Kekule.Editor.ActionComposerSetRepositoryFischer1Controller,
		//Kekule.Editor.ActionComposerSetRepositoryFischer2Controller,
		//Kekule.Editor.ActionComposerSetRepositoryFischer3Controller,
		Kekule.Editor.ActionComposerSetRepositorySawhorseStaggeredController,
		Kekule.Editor.ActionComposerSetRepositorySawhorseEclipsedController
	]
	/*
	 {
	 initAttachedActions: function()
	 {
	 var composer = this.getComposer();
	 var checkGroup = this.getClassName();
	 //console.log(this, this.addAttachedAction);
	 var classes = [
	 Kekule.Editor.ActionComposerSetBondControllerSingle,
	 Kekule.Editor.ActionComposerSetBondControllerDouble,
	 Kekule.Editor.ActionComposerSetBondControllerTriple,
	 Kekule.Editor.ActionComposerSetBondControllerWedgeUp,
	 Kekule.Editor.ActionComposerSetBondControllerWedgeDown,
	 Kekule.Editor.ActionComposerSetBondControllerWedgeUpOrDown
	 ];
	 for (var i = 0, l = classes.length; i < l; ++i)
	 {
	 var action = new classes[i](composer);
	 action.setCheckGroup(checkGroup);
	 this.addAttachedAction(action);
	 }
	 }
	 }
	 */
	,null,
	BNS.molBond
);

// Atom
Kekule.Editor.ActionComposerSetAtomController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetAtomController',
	Kekule.$L('ChemWidgetTexts.CAPTION_MOL_ATOM'), //Kekule.ChemWidgetTexts.CAPTION_MOL_ATOM,
	Kekule.$L('ChemWidgetTexts.HINT_MOL_ATOM'), //Kekule.ChemWidgetTexts.HINT_MOL_ATOM,
	'MolAtomIaController',
	null,
	null,
	null, null,
	BNS.molAtom
);

// formula
Kekule.Editor.ActionComposerSetFormulaController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetFormulaController',
	Kekule.$L('ChemWidgetTexts.CAPTION_MOL_FORMULA'), //Kekule.ChemWidgetTexts.CAPTION_MOL_FORMULA,
	Kekule.$L('ChemWidgetTexts.HINT_MOL_FORMULA'), //Kekule.ChemWidgetTexts.HINT_MOL_FORMULA,
	'FormulaIaController',
	null,
	null,
	null, null,
	BNS.molFormula
);

Kekule.Editor.ActionComposerSetAtomAndFormulaController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetAtomAndFormulaController',
	Kekule.$L('ChemWidgetTexts.CAPTION_MOL_ATOM_AND_FORMULA'),
	Kekule.$L('ChemWidgetTexts.HINT_MOL_ATOM_AND_FORMULA'),
	'MolAtomIaController',
	null,
	null,
	[
		Kekule.Editor.ActionComposerSetAtomController,
		Kekule.Editor.ActionComposerSetRepositoryMethaneController,
		Kekule.Editor.ActionComposerSetFormulaController
	]
	,null,
	BNS.molAtomAndFormula
);

// Attached markers
Kekule.Editor.ActionComposerSetAttachedMarkerIaControllerLonePair = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetAttachedMarkerIaControllerLonePair',
	Kekule.$L('ChemWidgetTexts.CAPTION_MOL_ELECTRON_LONEPAIR'), //Kekule.ChemWidgetTexts.CAPTION_MOL_CHARGE_DOUBLET,
	Kekule.$L('ChemWidgetTexts.HINT_MOL_ELECTRON_LONEPAIR'), //Kekule.ChemWidgetTexts.HINT_MOL_CHARGE_DOUBLET,
	'AttachedMarkerIaController',
	'AttachedMarkerIaController-LonePair',
	{
		'markerClassName': 'Kekule.ChemMarker.UnbondedElectronSet',
		'targetClassName': 'Kekule.AbstractAtom',
		'initialPropValues': {'electronCount': 2}
	},
	null, null,
	BNS.molElectronLonePair
);

// Charge and its variations
Kekule.Editor.ActionComposerSetNodeChargeControllerClear = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetNodeChargeControllerClear',
	Kekule.$L('ChemWidgetTexts.CAPTION_MOL_CHARGE_CLEAR'), //Kekule.ChemWidgetTexts.CAPTION_MOL_CHARGE_CLEAR,
	Kekule.$L('ChemWidgetTexts.HINT_MOL_CHARGE_CLEAR'), //Kekule.ChemWidgetTexts.HINT_MOL_CHARGE_CLEAR,
	'MolNodeChargeIaController',
	'MolNodeChargeIaController-Clear',
	{
		'charge': 0,
		'chargeInc': 0,
		'radical': Kekule.RadicalOrder.NONE
	},
	null, null,
	BNS.molChargeClear
);
Kekule.Editor.ActionComposerSetNodeChargeControllerPositive = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetNodeChargeControllerPositive',
	Kekule.$L('ChemWidgetTexts.CAPTION_MOL_CHARGE_POSITIVE'), //Kekule.ChemWidgetTexts.CAPTION_MOL_CHARGE_POSITIVE,
	Kekule.$L('ChemWidgetTexts.HINT_MOL_CHARGE_POSITIVE'), //Kekule.ChemWidgetTexts.HINT_MOL_CHARGE_POSITIVE,
	'MolNodeChargeIaController',
	'MolNodeChargeIaController-Positive',
	{
		'charge': null,
		'chargeInc': 1,
		'radical': Kekule.RadicalOrder.NONE
	},
	null, null,
	BNS.molChargePositive
);
Kekule.Editor.ActionComposerSetNodeChargeControllerNegative = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetNodeChargeControllerNegative',
	Kekule.$L('ChemWidgetTexts.CAPTION_MOL_CHARGE_NEGATIVE'), //Kekule.ChemWidgetTexts.CAPTION_MOL_CHARGE_NEGATIVE,
	Kekule.$L('ChemWidgetTexts.HINT_MOL_CHARGE_NEGATIVE'), //Kekule.ChemWidgetTexts.HINT_MOL_CHARGE_NEGATIVE,
	'MolNodeChargeIaController',
	'MolNodeChargeIaController-Negative',
	{
		'charge': null,
		'chargeInc': -1,
		'radical': Kekule.RadicalOrder.NONE
	},
	null, null,
	BNS.molChargeNegative
);
Kekule.Editor.ActionComposerSetNodeChargeControllerRadicalSinglet = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetNodeChargeControllerRadicalSinglet',
	Kekule.$L('ChemWidgetTexts.CAPTION_MOL_CHARGE_SINGLET'), //Kekule.ChemWidgetTexts.CAPTION_MOL_CHARGE_SINGLET,
	Kekule.$L('ChemWidgetTexts.HINT_MOL_CHARGE_SINGLET'), //Kekule.ChemWidgetTexts.HINT_MOL_CHARGE_SINGLET,
	'MolNodeChargeIaController',
	'MolNodeChargeIaController-Singlet',
	{
		'charge': null,
		'chargeInc': 0,
		'radical': Kekule.RadicalOrder.SINGLET
	},
	null, null,
	BNS.molRadicalSinglet
);
Kekule.Editor.ActionComposerSetNodeChargeControllerRadicalTriplet = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetNodeChargeControllerRadicalTriplet',
	Kekule.$L('ChemWidgetTexts.CAPTION_MOL_CHARGE_TRIPLET'), //Kekule.ChemWidgetTexts.CAPTION_MOL_CHARGE_TRIPLET,
	Kekule.$L('ChemWidgetTexts.HINT_MOL_CHARGE_TRIPLET'), //Kekule.ChemWidgetTexts.HINT_MOL_CHARGE_TRIPLET,
	'MolNodeChargeIaController',
	'MolNodeChargeIaController-Triplet',
	{
		'charge': null,
		'chargeInc': 0,
		'radical': Kekule.RadicalOrder.TRIPLET
	},
	null, null,
	BNS.molRadicalTriplet
);
Kekule.Editor.ActionComposerSetNodeChargeControllerRadicalDoublet = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetNodeChargeControllerRadicalDoublet',
	Kekule.$L('ChemWidgetTexts.CAPTION_MOL_CHARGE_DOUBLET'), //Kekule.ChemWidgetTexts.CAPTION_MOL_CHARGE_DOUBLET,
	Kekule.$L('ChemWidgetTexts.HINT_MOL_CHARGE_DOUBLET'), //Kekule.ChemWidgetTexts.HINT_MOL_CHARGE_DOUBLET,
	'MolNodeChargeIaController',
	'MolNodeChargeIaController-Doublet',
	{
		'charge': null,
		'chargeInc': 0,
		'radical': Kekule.RadicalOrder.DOUBLET
	},
	null, null,
	BNS.molRadicalDoublet
);

Kekule.Editor.ActionComposerSetNodeChargeController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetNodeChargeController',
	Kekule.$L('ChemWidgetTexts.CAPTION_MOL_CHARGE'), //Kekule.ChemWidgetTexts.CAPTION_MOL_CHARGE,
	Kekule.$L('ChemWidgetTexts.HINT_MOL_CHARGE'), //Kekule.ChemWidgetTexts.HINT_MOL_CHARGE,
	'MolNodeChargeIaController',
	null,
	null,
	[
		Kekule.Editor.ActionComposerSetNodeChargeControllerClear,
		Kekule.Editor.ActionComposerSetNodeChargeControllerPositive,
		Kekule.Editor.ActionComposerSetNodeChargeControllerNegative,
		Kekule.Editor.ActionComposerSetNodeChargeControllerRadicalSinglet,
		Kekule.Editor.ActionComposerSetNodeChargeControllerRadicalTriplet,
		Kekule.Editor.ActionComposerSetNodeChargeControllerRadicalDoublet,
		Kekule.Editor.ActionComposerSetAttachedMarkerIaControllerLonePair
	],
	null,
	BNS.molCharge
);

//////////// Text and image /////////////

// Text block
Kekule.Editor.ActionComposerSetTextBlockController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetTextBlockController',
	Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_BLOCK'),
	Kekule.$L('ChemWidgetTexts.HINT_TEXT_BLOCK'),
	'TextBlockIaController',
	null,
	null,
	null, null,
	BNS.textBlock
);
// Image block
Kekule.Editor.ActionComposerSetImageBlockController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetImageBlockController',
	Kekule.$L('ChemWidgetTexts.CAPTION_IMAGE_BLOCK'),
	Kekule.$L('ChemWidgetTexts.HINT_IMAGE_BLOCK'),
	'ImageBlockIaController',
	null,
	null,
	null, null,
	BNS.imageBlock
);

Kekule.Editor.ActionComposerSetTextImageController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetTextImageController',
	Kekule.$L('ChemWidgetTexts.CAPTION_TEXT_IMAGE'),
	Kekule.$L('ChemWidgetTexts.HINT_TEXT_IMAGE'),
	'TextImageIaController',
	'TextImageIaController',
	null,
	[
		Kekule.Editor.ActionComposerSetTextBlockController,
		Kekule.Editor.ActionComposerSetImageBlockController
	],
	null,
	BNS.textImage
);

//////////////////// repository and its variations //////////////////////////
// MolRing
Kekule.Editor.ActionComposerSetRepositoryRing3Controller = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryRing3Controller',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_RING_3'), //Kekule.ChemWidgetTexts.CAPTION_REPOSITORY_RING_3,
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_RING_3'), //Kekule.ChemWidgetTexts.HINT_REPOSITORY_RING_3,
	'MolRingIaController',
	'MolRingIaController-3',
	{
		'ringAtomCount': 3,
		'isAromatic': false
	},
	null, null,
	BNS.molRing3
);
Kekule.Editor.ActionComposerSetRepositoryRing4Controller = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryRing4Controller',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_RING_4'), //Kekule.ChemWidgetTexts.CAPTION_REPOSITORY_RING_4,
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_RING_4'), //Kekule.ChemWidgetTexts.HINT_REPOSITORY_RING_4,
	'MolRingIaController',
	'MolRingIaController-4',
	{
		'ringAtomCount': 4,
		'isAromatic': false
	},
	null, null,
	BNS.molRing4
);
Kekule.Editor.ActionComposerSetRepositoryRing5Controller = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryRing5Controller',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_RING_5'), //Kekule.ChemWidgetTexts.CAPTION_REPOSITORY_RING_5,
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_RING_5'), //Kekule.ChemWidgetTexts.HINT_REPOSITORY_RING_5,
	'MolRingIaController',
	'MolRingIaController-5',
	{
		'ringAtomCount': 5,
		'isAromatic': false
	},
	null, null,
	BNS.molRing5
);
Kekule.Editor.ActionComposerSetRepositoryRing6Controller = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryRing6Controller',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_RING_6'), //Kekule.ChemWidgetTexts.CAPTION_REPOSITORY_RING_6,
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_RING_6'), //Kekule.ChemWidgetTexts.HINT_REPOSITORY_RING_6,
	'MolRingIaController',
	'MolRingIaController-6',
	{
		'ringAtomCount': 6,
		'isAromatic': false
	},
	null, null,
	BNS.molRing6
);
Kekule.Editor.ActionComposerSetRepositoryRing7Controller = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryRing7Controller',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_RING_7'), //Kekule.ChemWidgetTexts.CAPTION_REPOSITORY_RING_7,
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_RING_7'), //Kekule.ChemWidgetTexts.HINT_REPOSITORY_RING_7,
	'MolRingIaController',
	'MolRingIaController-7',
	{
		'ringAtomCount': 7,
		'isAromatic': false
	},
	null, null,
	BNS.molRing7
);
Kekule.Editor.ActionComposerSetRepositoryRing8Controller = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryRing8Controller',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_RING_8'), //Kekule.ChemWidgetTexts.CAPTION_REPOSITORY_RING_8,
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_RING_8'), //Kekule.ChemWidgetTexts.HINT_REPOSITORY_RING_8,
	'MolRingIaController',
	'MolRingIaController-8',
	{
		'ringAtomCount': 8,
		'isAromatic': false
	},
	null, null,
	BNS.molRing8
);
Kekule.Editor.ActionComposerSetRepositoryRingAr6Controller = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryRingAr6Controller',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_RING_AR_6'), //Kekule.ChemWidgetTexts.CAPTION_REPOSITORY_RING_AR_6,
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_RING_AR_6'), //Kekule.ChemWidgetTexts.HINT_REPOSITORY_RING_AR_6,
	'MolRingIaController',
	'MolRingIaController-Ar-6',
	{
		'ringAtomCount': 6,
		'isAromatic': true
	},
	null, null,
	BNS.molRingAr6
);
Kekule.Editor.ActionComposerSetRepositoryRingAr5Controller = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryRingAr5Controller',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_RING_AR_5'), //Kekule.ChemWidgetTexts.CAPTION_REPOSITORY_RING_AR_5,
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_RING_AR_5'), //Kekule.ChemWidgetTexts.HINT_REPOSITORY_RING_AR_5,
	'MolRingIaController',
	'MolRingIaController-Ar-5',
	{
		'ringAtomCount': 5,
		'isAromatic': true
	},
	null, null,
	BNS.molRingAr5
);

Kekule.Editor.ActionComposerSetRepositoryMolFlexRingController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryMolFlexRingController',
	Kekule.$L('ChemWidgetTexts.CAPTION_MOL_FLEXRING'),
	Kekule.$L('ChemWidgetTexts.HINT_MOL_FLEXRING'),
	'MolFlexRingIaController',
	'MolFlexRingIaController',
	null,
	null, null,
	BNS.molFlexRing
);

Kekule.Editor.ActionComposerSetRepositoryCyclopentaneHaworth1Controller = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryCyclopentaneHaworth1Controller',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_CYCLOPENTANE_HARWORTH1'),
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_CYCLOPENTANE_HARWORTH1'),
	'RepositoryStructureFragmentIaController',
	'RepositoryStructureFragmentIaController-CyclopentaneHaworth1',
	{
		'repItemName': 'cyclopentaneHaworth1'
	},
	null, null,
	BNS.molRepCyclopentaneHaworth1
);
Kekule.Editor.ActionComposerSetRepositoryCyclopentaneHaworth2Controller = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryCyclopentaneHaworth2Controller',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_CYCLOPENTANE_HARWORTH2'),
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_CYCLOPENTANE_HARWORTH2'),
	'RepositoryStructureFragmentIaController',
	'RepositoryStructureFragmentIaController-CyclopentaneHaworth2',
	{
		'repItemName': 'cyclopentaneHaworth2'
	},
	null, null,
	BNS.molRepCyclopentaneHaworth2
);
Kekule.Editor.ActionComposerSetRepositoryCyclohexaneHaworth1Controller = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryCyclohexaneHaworth1Controller',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_CYCLOHEXANE_HARWORTH1'),
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_CYCLOHEXANE_HARWORTH1'),
	'RepositoryStructureFragmentIaController',
	'RepositoryStructureFragmentIaController-CyclohexaneHaworth1',
	{
		'repItemName': 'cyclohexaneHaworth1'
	},
	null, null,
	BNS.molRepCyclohexaneHaworth1
);
Kekule.Editor.ActionComposerSetRepositoryCyclohexaneHaworth2Controller = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryCyclohexaneHaworth2Controller',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_CYCLOHEXANE_HARWORTH2'),
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_CYCLOHEXANE_HARWORTH2'),
	'RepositoryStructureFragmentIaController',
	'RepositoryStructureFragmentIaController-CyclohexaneHaworth2',
	{
		'repItemName': 'cyclohexaneHaworth2'
	},
	null, null,
	BNS.molRepCyclohexaneHaworth2
);
Kekule.Editor.ActionComposerSetRepositoryCyclohexaneChair1Controller = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryCyclohexaneChair1Controller',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_CYCLOHEXANE_CHAIR1'), //Kekule.ChemWidgetTexts.CAPTION_REPOSITORY_RING_AR_5,
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_CYCLOHEXANE_CHAIR1'),
	'RepositoryStructureFragmentIaController',
	'RepositoryStructureFragmentIaController-CyclohexaneChair1',
	{
		'repItemName': 'cyclohexaneChair1'
	},
	null, null,
	BNS.molRepCyclohexaneChair1
);
Kekule.Editor.ActionComposerSetRepositoryCyclohexaneChair2Controller = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryCyclohexaneChair2Controller',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_CYCLOHEXANE_CHAIR2'), //Kekule.ChemWidgetTexts.CAPTION_REPOSITORY_RING_AR_5,
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_CYCLOHEXANE_CHAIR2'),
	'RepositoryStructureFragmentIaController',
	'RepositoryStructureFragmentIaController-CyclohexaneChair2',
	{
		'repItemName': 'cyclohexaneChair2'
	},
	null, null,
	BNS.molRepCyclohexaneChair2
);

Kekule.Editor.ActionComposerSetRepositoryRingController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryRingController',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_RING'), //Kekule.ChemWidgetTexts.CAPTION_REPOSITORY_RING,
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_RING'), //Kekule.ChemWidgetTexts.HINT_REPOSITORY_RING,
	'MolRingIaController',
	null,
	null,
	[
		Kekule.Editor.ActionComposerSetRepositoryRing3Controller,
		Kekule.Editor.ActionComposerSetRepositoryRing4Controller,
		Kekule.Editor.ActionComposerSetRepositoryRing5Controller,
		Kekule.Editor.ActionComposerSetRepositoryRing6Controller,
		//Kekule.Editor.ActionComposerSetRepositoryRing7Controller,
		//Kekule.Editor.ActionComposerSetRepositoryRing8Controller,
		Kekule.Editor.ActionComposerSetRepositoryMolFlexRingController,
		Kekule.Editor.ActionComposerSetRepositoryRingAr6Controller,
		//Kekule.Editor.ActionComposerSetRepositoryRingAr5Controller,
		Kekule.Editor.ActionComposerSetRepositoryCyclopentaneHaworth1Controller,
		//Kekule.Editor.ActionComposerSetRepositoryCyclopentaneHaworth2Controller,
		Kekule.Editor.ActionComposerSetRepositoryCyclohexaneHaworth1Controller,
		//Kekule.Editor.ActionComposerSetRepositoryCyclohexaneHaworth2Controller,
		Kekule.Editor.ActionComposerSetRepositoryCyclohexaneChair1Controller,
		Kekule.Editor.ActionComposerSetRepositoryCyclohexaneChair2Controller
	],
	null,
	BNS.molRing
);

// PathGlyph
Kekule.Editor.ActionComposerSetRepositoryPathLineController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryPathGlyphLineController',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_GLYPH_LINE'), //Kekule.ChemWidgetTexts.CAPTION_REPOSITORY_GLYPH_LINE,
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_GLYPH_LINE'), //Kekule.ChemWidgetTexts.HINT_REPOSITORY_GLYPH_LINE,
	'ArrowLineIaController',
	'ArrowLineIaController-Line',
	{
		'glyphClass': Kekule.Glyph.StraightLine,
		'glyphInitialParams': null,
		'lineLength': 1.5
	},
	null, null,
	BNS.glyphRepLine
);
Kekule.Editor.ActionComposerSetRepositoryPathOpenArrowLineController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryPathOpenArrowLineController',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_GLYPH_OPEN_ARROW_LINE'), //Kekule.ChemWidgetTexts.CAPTION_REPOSITORY_GLYPH_OPEN_ARROW_LINE,
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_GLYPH_OPEN_ARROW_LINE'), //Kekule.ChemWidgetTexts.HINT_REPOSITORY_GLYPH_OPEN_ARROW_LINE,
	'ArrowLineIaController',
	'ArrowLineIaController-OpenArrowLine',
	{
		'glyphClass': Kekule.Glyph.StraightLine,
		'glyphInitialParams': {
			'endArrowType': Kekule.Glyph.ArrowType.OPEN,
			'endArrowWidth': 0.25,
			'endArrowLength': 0.25,
			'lineLength': 1.5
		}
	},
	null, null,
	BNS.glyphRepOpenArrowLine
);
Kekule.Editor.ActionComposerSetRepositoryPathTriangleArrowLineController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryPathTriangleArrowLineController',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_GLYPH_TRIANGLE_ARROW_LINE'), //Kekule.ChemWidgetTexts.CAPTION_REPOSITORY_GLYPH_TRIANGLE_ARROW_LINE,
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_GLYPH_TRIANGLE_ARROW_LINE'), //Kekule.ChemWidgetTexts.HINT_REPOSITORY_GLYPH_TRIANGLE_ARROW_LINE,
	'ArrowLineIaController',
	'ArrowLineIaController-TriangleArrowLine',
	{
		'glyphClass': Kekule.Glyph.StraightLine,
		'glyphInitialParams': {
			'endArrowType': Kekule.Glyph.ArrowType.TRIANGLE,
			'endArrowWidth': 0.25,
			'endArrowLength': 0.25,
			'lineLength': 1.5
		}
	},
	null, null,
	BNS.glyphRepTriangleArrowLine
);
Kekule.Editor.ActionComposerSetRepositoryPathDiOpenArrowLineController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryPathDiOpenArrowLineController',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_GLYPH_DI_OPEN_ARROW_LINE'), //Kekule.ChemWidgetTexts.CAPTION_REPOSITORY_GLYPH_DI_OPEN_ARROW_LINE,
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_GLYPH_DI_OPEN_ARROW_LINE'), //Kekule.ChemWidgetTexts.HINT_REPOSITORY_GLYPH_DI_OPEN_ARROW_LINE,
	'ArrowLineIaController',
	'ArrowLineIaController-DiOpenArrowLine',
	{
		'glyphClass': Kekule.Glyph.StraightLine,
		'glyphInitialParams': {
			'startArrowType': Kekule.Glyph.ArrowType.OPEN,
			'startArrowWidth': 0.25,
			'startArrowLength': 0.25,
			'endArrowType': Kekule.Glyph.ArrowType.OPEN,
			'endArrowWidth': 0.25,
			'endArrowLength': 0.25,
			'lineLength': 1.5
		}
	},
	null, null,
	BNS.glyphRepDiOpenArrowLine
);
Kekule.Editor.ActionComposerSetRepositoryPathDiTriangleArrowLineController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryPathDiTriangleArrowLineController',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_GLYPH_DI_TRIANGLE_ARROW_LINE'), //Kekule.ChemWidgetTexts.CAPTION_REPOSITORY_GLYPH_DI_TRIANGLE_ARROW_LINE,
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_GLYPH_DI_TRIANGLE_ARROW_LINE'), //Kekule.ChemWidgetTexts.HINT_REPOSITORY_GLYPH_DI_TRIANGLE_ARROW_LINE,
	'ArrowLineIaController',
	'ArrowLineIaController-DiTriangleArrowLine',
	{
		'glyphClass': Kekule.Glyph.StraightLine,
		'glyphInitialParams': {
			'startArrowType': Kekule.Glyph.ArrowType.TRIANGLE,
			'startArrowWidth': 0.25,
			'startArrowLength': 0.25,
			'endArrowType': Kekule.Glyph.ArrowType.TRIANGLE,
			'endArrowWidth': 0.25,
			'endArrowLength': 0.25,
			'lineLength': 1.5
		}
	},
	null, null,
	BNS.glyphRepDiTriangleArrowLine
);
Kekule.Editor.ActionComposerSetRepositoryPathReversibleArrowLineController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryPathReversibleArrowLineController',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_GLYPH_REV_ARROW_LINE'), //Kekule.ChemWidgetTexts.CAPTION_REPOSITORY_GLYPH_REV_ARROW_LINE,
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_GLYPH_REV_ARROW_LINE'), //Kekule.ChemWidgetTexts.HINT_REPOSITORY_GLYPH_REV_ARROW_LINE,
	'ArrowLineIaController',
	'ArrowLineIaController-ReversibleArrowLine',
	{
		'glyphClass': Kekule.Glyph.StraightLine,
		'glyphInitialParams': {
			'startArrowType': Kekule.Glyph.ArrowType.OPEN,
			'startArrowSide': Kekule.Glyph.ArrowSide.REVERSED,
			'startArrowWidth': 0.25,
			'startArrowLength': 0.25,
			'endArrowType': Kekule.Glyph.ArrowType.OPEN,
			'endArrowSide': Kekule.Glyph.ArrowSide.SINGLE,
			'endArrowWidth': 0.25,
			'endArrowLength': 0.25,
			'lineLength': 1.5,
			'lineGap': 0.1,
			'lineCount': 2
		}
	},
	null, null,
	BNS.glyphRepReversibleArrowLine
);
Kekule.Editor.ActionComposerSetRepositoryPathOpenArrowDblLineController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryPathOpenArrowDblLineController',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_GLYPH_OPEN_ARROW_DILINE'), //Kekule.ChemWidgetTexts.CAPTION_REPOSITORY_GLYPH_OPEN_ARROW_DILINE,
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_GLYPH_OPEN_ARROW_DILINE'), //Kekule.ChemWidgetTexts.HINT_REPOSITORY_GLYPH_OPEN_ARROW_DILINE,
	'ArrowLineIaController',
	'ArrowLineIaController-OpenArrowDiLine',
	{
		'glyphClass': Kekule.Glyph.StraightLine,
		'glyphInitialParams': {
			'endArrowType': Kekule.Glyph.ArrowType.OPEN,
			'endArrowWidth': 0.25,
			'endArrowLength': 0.25,
			'lineLength': 1.5,
			'lineGap': 0.1,
			'lineCount': 2
		}
	},
	null, null,
	BNS.glyphRepOpenArrowDiLine
);
Kekule.Editor.ActionComposerSetRepositoryPathOpenArrowArcController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryPathOpenArrowArcController',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_GLYPH_OPEN_ARROW_ARC'), //Kekule.ChemWidgetTexts.CAPTION_REPOSITORY_GLYPH_OPEN_ARROW_DILINE,
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_GLYPH_OPEN_ARROW_ARC'), //Kekule.ChemWidgetTexts.HINT_REPOSITORY_GLYPH_OPEN_ARROW_DILINE,
	'ArrowLineIaController',
	'ArrowLineIaController-OpenArrowArc',
	{
		'glyphClass': Kekule.Glyph.BaseArc,
		'glyphInitialParams': {
			'endArrowType': Kekule.Glyph.ArrowType.OPEN,
			'endArrowWidth': 0.25,
			'endArrowLength': 0.25,
			'lineLength': 1,
			'lineGap': 0.1,
			'lineCount': 1
		}
	},
	null, null,
	BNS.glyphRepOpenArrowArc
);
Kekule.Editor.ActionComposerSetRepositoryPathSingleSideOpenArrowArcController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryPathSingleSideOpenArrowArcController',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_GLYPH_SINGLE_SIDE_OPEN_ARROW_ARC'), //Kekule.ChemWidgetTexts.CAPTION_REPOSITORY_GLYPH_OPEN_ARROW_DILINE,
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_GLYPH_SINGLE_SIDE_OPEN_ARROW_ARC'), //Kekule.ChemWidgetTexts.HINT_REPOSITORY_GLYPH_OPEN_ARROW_DILINE,
	'ArrowLineIaController',
	'ArrowLineIaController-SingleSideOpenArrowArc',
	{
		'glyphClass': Kekule.Glyph.BaseArc,
		'glyphInitialParams': {
			'endArrowType': Kekule.Glyph.ArrowType.OPEN,
			'endArrowSide': Kekule.Glyph.ArrowSide.REVERSED,
			'endArrowWidth': 0.25,
			'endArrowLength': 0.25,
			'lineLength': 1,
			'lineGap': 0.1,
			'lineCount': 1
		}
	},
	null, null,
	BNS.glyphRepSingleSideOpenArrowArc
);
Kekule.Editor.ActionComposerSetRepositoryHeatSymbolController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryHeatSymbolController',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_HEAT_SYMBOL'), //Kekule.ChemWidgetTexts.CAPTION_REPOSITORY_HEAT_SYMBOL,
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_HEAT_SYMBOL'), //Kekule.ChemWidgetTexts.HINT_REPOSITORY_HEAT_SYMBOL,
	'ArrowLineIaController',
	'ArrowLineIaController-HeatSymbol',
	{
		'glyphClass': Kekule.Glyph.HeatSymbol,
		'glyphInitialParams': {
			'lineLength': 1
		}
	},
	null, null,
	BNS.glyphRepHeatSymbol
);
Kekule.Editor.ActionComposerSetRepositoryAddSymbolController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryAddSymbolController',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_ADD_SYMBOL'), //Kekule.ChemWidgetTexts.CAPTION_REPOSITORY_ADD_SYMBOL,
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_ADD_SYMBOL'), //Kekule.ChemWidgetTexts.HINT_REPOSITORY_ADD_SYMBOL,
	'ArrowLineIaController',
	'ArrowLineIaController-AddSymbol',
	{
		'glyphClass': Kekule.Glyph.AddSymbol,
		'glyphInitialParams': {
			'lineLength': 1
		}
	},
	null, null,
	BNS.glyphRepAddSymbol
);

Kekule.Editor.ActionComposerSetRepositoryLineSegmentController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryLineSegmentController',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_GLYPH_LINE'),
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_GLYPH_LINE'),
	'ArrowLineIaController',
	'ArrowLineIaController-Line',
	{
		'glyphClass': Kekule.Glyph.Segment,
		'glyphInitialParams': {
			'startArrowWidth': 0.25,
			'startArrowLength': 0.25,
			'endArrowWidth': 0.25,
			'endArrowLength': 0.25,
			'lineLength': 1.5,
			'lineGap': 0.1,
		}
	},
	null, null,
	BNS.glyphRepSegment
);
Kekule.Editor.ActionComposerSetRepositoryNormalReactionArrowController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryNormalReactionArrowController',
	Kekule.$L('ChemWidgetTexts.CAPTION_REACTION_ARROW_NORMAL'),
	Kekule.$L('ChemWidgetTexts.HINT_REACTION_ARROW_NORMAL'),
	'ArrowLineIaController',
	'ArrowLineIaController-ReactionArrowNormal',
	{
		'glyphClass': Kekule.Glyph.ReactionArrow,
		'glyphInitialParams': {
			'reactionArrowType': Kekule.Glyph.ReactionArrowType.NORMAL,
			'startArrowWidth': 0.25,
			'startArrowLength': 0.25,
			'endArrowWidth': 0.25,
			'endArrowLength': 0.25,
			'lineLength': 1.5,
			'lineGap': 0.1,
		}
	},
	null, null,
	BNS.glyphReactionArrowNormal
);
Kekule.Editor.ActionComposerSetRepositoryReversibleReactionArrowController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryReversibleReactionArrowController',
	Kekule.$L('ChemWidgetTexts.CAPTION_REACTION_ARROW_REVERSIBLE'),
	Kekule.$L('ChemWidgetTexts.HINT_REACTION_ARROW_REVERSIBLE'),
	'ArrowLineIaController',
	'ArrowLineIaController-ReactionArrowReversible',
	{
		'glyphClass': Kekule.Glyph.ReactionArrow,
		'glyphInitialParams': {
			'reactionType': Kekule.Glyph.ReactionArrowType.REVERSIBLE,
			'startArrowWidth': 0.25,
			'startArrowLength': 0.25,
			'endArrowWidth': 0.25,
			'endArrowLength': 0.25,
			'lineLength': 1.5,
			'lineGap': 0.1,
		}
	},
	null, null,
	BNS.glyphReactionArrowReversible
);
Kekule.Editor.ActionComposerSetRepositoryResonanceReactionArrowController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryResonanceReactionArrowController',
	Kekule.$L('ChemWidgetTexts.CAPTION_REACTION_ARROW_RESONANCE'),
	Kekule.$L('ChemWidgetTexts.HINT_REACTION_ARROW_RESONANCE'),
	'ArrowLineIaController',
	'ArrowLineIaController-ReactionArrowResonance',
	{
		'glyphClass': Kekule.Glyph.ReactionArrow,
		'glyphInitialParams': {
			'reactionType': Kekule.Glyph.ReactionArrowType.RESONANCE,
			'startArrowWidth': 0.25,
			'startArrowLength': 0.25,
			'endArrowWidth': 0.25,
			'endArrowLength': 0.25,
			'lineLength': 1.5,
			'lineGap': 0.1,
		}
	},
	null, null,
	BNS.glyphReactionArrowResonance
);
Kekule.Editor.ActionComposerSetRepositoryRetrosynthesisReactionArrowController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryRetrosynthesisReactionArrowController',
	Kekule.$L('ChemWidgetTexts.CAPTION_REACTION_ARROW_RETROSYNTHESIS'),
	Kekule.$L('ChemWidgetTexts.HINT_REACTION_ARROW_RETROSYNTHESIS'),
	'ArrowLineIaController',
	'ArrowLineIaController-ReactionArrowRetrosynthesis',
	{
		'glyphClass': Kekule.Glyph.ReactionArrow,
		'glyphInitialParams': {
			'reactionType': Kekule.Glyph.ReactionArrowType.RETROSYNTHESIS,
			'startArrowWidth': 0.25,
			'startArrowLength': 0.25,
			'endArrowWidth': 0.25,
			'endArrowLength': 0.25,
			'lineLength': 1.5,
			'lineGap': 0.1,
		}
	},
	null, null,
	BNS.glyphReactionArrowRetrosynthesis
);

Kekule.Editor.ActionComposerSetRepositoryDoubleElectronPushingArrowController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryDoubleElectronPushingArrowController',
	Kekule.$L('ChemWidgetTexts.CAPTION_ELECTRON_PUSHING_ARROW_2'),
	Kekule.$L('ChemWidgetTexts.HINT_ELECTRON_PUSHING_ARROW_2'),
	'ArrowLineIaController',
	'ArrowLineIaController-ElectronPushingArrowDouble',
	{
		'glyphClass': Kekule.Glyph.ElectronPushingArrow,
		'glyphInitialParams': {
			'electronCount': 2,
			'endArrowWidth': 0.25,
			'endArrowLength': 0.25,
			'lineLength': 1,
			'lineGap': 0.1,
			'lineCount': 1
		}
	},
	null, null,
	BNS.glyphElectronPushingArrowDouble
);
Kekule.Editor.ActionComposerSetRepositorySingleElectronPushingArrowController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositorySingleElectronPushingArrowController',
	Kekule.$L('ChemWidgetTexts.CAPTION_ELECTRON_PUSHING_ARROW_1'),
	Kekule.$L('ChemWidgetTexts.HINT_ELECTRON_PUSHING_ARROW_1'),
	'ArrowLineIaController',
	'ArrowLineIaController-ElectronPushingArrowSingle',
	{
		'glyphClass': Kekule.Glyph.ElectronPushingArrow,
		'glyphInitialParams': {
			'electronCount': 1,
			'endArrowWidth': 0.25,
			'endArrowLength': 0.25,
			'lineLength': 1,
			'lineGap': 0.1,
			'lineCount': 1
		}
	},
	null, null,
	BNS.glyphElectronPushingArrowSingle
);

Kekule.Editor.ActionComposerSetRepositoryBondFormingElectronPushingArrowController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryBondFormingElectronPushingArrowController',
	Kekule.$L('ChemWidgetTexts.CAPTION_BOND_FORMING_ELECTRON_PUSHING_ARROW_1'),
	Kekule.$L('ChemWidgetTexts.HINT_BOND_FORMING_ELECTRON_PUSHING_ARROW_1'),
	'ArrowLineIaController',
	'ArrowLineIaController-BondFormingElectronPushingArrowSingle',
	{
		'glyphClass': Kekule.Glyph.BondFormingElectronPushingArrow,
		'glyphInitialParams': {
			//'electronCount': 2,
			'endArrowWidth': 0.25,
			'endArrowLength': 0.25,
			'lineLength': 1,
			'pathEndGap': 0.1,
			'lineCount': 1
		}
	},
	null, null,
	BNS.glyphElectronPushingArrowBondForming
);

Kekule.Editor.ActionComposerSetRepositoryGlyphController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryGlyphController',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_ARROWLINE'), //Kekule.ChemWidgetTexts.CAPTION_REPOSITORY_ARROWLINE,
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_ARROWLINE'), //Kekule.ChemWidgetTexts.HINT_REPOSITORY_ARROWLINE,
	'ArrowLineIaController',
	null,
	null,
	[
		/*
		Kekule.Editor.ActionComposerSetRepositoryPathOpenArrowLineController,
		Kekule.Editor.ActionComposerSetRepositoryPathTriangleArrowLineController,
		Kekule.Editor.ActionComposerSetRepositoryPathDiOpenArrowLineController,
		Kekule.Editor.ActionComposerSetRepositoryPathDiTriangleArrowLineController,
		Kekule.Editor.ActionComposerSetRepositoryPathReversibleArrowLineController,
		Kekule.Editor.ActionComposerSetRepositoryPathOpenArrowDblLineController,
		Kekule.Editor.ActionComposerSetRepositoryPathOpenArrowArcController,
		Kekule.Editor.ActionComposerSetRepositoryPathSingleSideOpenArrowArcController,
		Kekule.Editor.ActionComposerSetRepositoryPathLineController,
		*/
		Kekule.Editor.ActionComposerSetRepositoryNormalReactionArrowController,
		Kekule.Editor.ActionComposerSetRepositoryReversibleReactionArrowController,
		Kekule.Editor.ActionComposerSetRepositoryResonanceReactionArrowController,
		Kekule.Editor.ActionComposerSetRepositoryRetrosynthesisReactionArrowController,
		Kekule.Editor.ActionComposerSetRepositoryLineSegmentController,
		Kekule.Editor.ActionComposerSetRepositoryDoubleElectronPushingArrowController,
		Kekule.Editor.ActionComposerSetRepositorySingleElectronPushingArrowController,
		Kekule.Editor.ActionComposerSetRepositoryBondFormingElectronPushingArrowController,
		Kekule.Editor.ActionComposerSetRepositoryHeatSymbolController,
		Kekule.Editor.ActionComposerSetRepositoryAddSymbolController
	],
	null,
	BNS.glyph
);

// register actions to editor/composer widget
Kekule._registerAfterLoadSysProc(function(){
	var AM = Kekule.ActionManager;
	var CW = Kekule.ChemWidget;
	var CE = Kekule.Editor;
	var widgetClass = Kekule.Editor.ChemSpaceEditor;
	var reg = AM.registerNamedActionClass;

	reg(BNS.newDoc, CE.ActionEditorNewDoc, widgetClass);
	reg(BNS.loadFile, CW.ActionDisplayerLoadFile, widgetClass);
	//reg(BNS.loadData, CW.ActionDisplayerLoadData, widgetClass);
	reg(BNS.loadData, CE.ActionEditorLoadData, widgetClass);
	reg(BNS.saveData, CW.ActionDisplayerSaveFile, widgetClass);
	reg(BNS.zoomIn, CW.ActionDisplayerZoomIn, widgetClass);
	reg(BNS.zoomOut, CW.ActionDisplayerZoomOut, widgetClass);
	reg(BNS.resetZoom, CW.ActionDisplayerResetZoom, widgetClass);
	reg(BNS.reset, CW.ActionDisplayerReset, widgetClass);
	reg(BNS.config, Kekule.Widget.ActionOpenConfigWidget, widgetClass);
	reg(BNS.undo, CE.ActionEditorUndo, widgetClass);
	reg(BNS.redo, CE.ActionEditorRedo, widgetClass);
	reg(BNS.selectAll, CE.ActionSelectAll, widgetClass);
	reg(BNS.cloneSelection, CE.ActionCloneSelection, widgetClass);
	reg(BNS.copy, CE.ActionCopySelection, widgetClass);
	reg(BNS.cut, CE.ActionCutSelection, widgetClass);
	reg(BNS.paste, CE.ActionPaste, widgetClass);
	reg(BNS.toggleSelect, CE.ActionToggleSelectState, widgetClass);
	reg(BNS.eraseSelection, CE.ActionEraseSelection, widgetClass);
	reg(BNS.recheckIssues, CE.ActionRecheckIssues, widgetClass);
	reg(BNS.toggleShowAllIssues, CE.ActionToggleShowIssueMarkers, widgetClass);

	//reg(BNS.manipulate, CE.ActionComposerSetManipulateController, widgetClass);
	//reg(BNS.erase, CE.ActionComposerSetEraserController, widgetClass);
	//reg(BNS.molAtom, CE.ActionComposerSetAtomController, widgetClass);
	//reg(BNS.molFormula, CE.ActionComposerSetFormulaController, widgetClass);
	//reg(BNS.molBond, CE.ActionComposerSetBondController, widgetClass);
	//reg(BNS.molCharge, CE.ActionComposerSetNodeChargeController, widgetClass);
	//reg(BNS.textBlock, CE.ActionComposerSetTextBlockController, widgetClass);
	//reg(BNS.imageBlock, CE.ActionComposerSetImageBlockController, widgetClass);
	//reg(BNS.textImage, CE.ActionComposerSetTextImageController, widgetClass);
	//reg(BNS.molRing, CE.ActionComposerSetRepositoryRingController, widgetClass);
	//reg(BNS.glyph, CE.ActionComposerSetRepositoryGlyphController, widgetClass);

	reg(BNS.objInspector, CE.ActionComposerToggleObjInspector, widgetClass);
	reg(BNS.issueInspector, CE.ActionComposerToggleIssueInspector, widgetClass);

	_createAndRegisterPredefinedOperationCreateActions();

	// actions created by function createComposerIaControllerActionClass
	for (var i = 0, l = _editorActionRegInfo.length; i < l; ++i)
	{
		var info = _editorActionRegInfo[i];
		reg(info.name, info.actionClass, info.widgetClass || widgetClass);
	}
});


})();