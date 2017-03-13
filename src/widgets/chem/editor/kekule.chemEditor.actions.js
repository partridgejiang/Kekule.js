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
	ACTION_CLONE_SELECTION: 'K-Chem-Clone-Selection',
	ACTION_COPY: 'K-Chem-Copy',
	ACTION_CUT: 'K-Chem-Cut',
	ACTION_PASTE: 'K-Chem-Paste',
	ACTION_TOGGLE_INSPECTOR: 'K-Chem-Toggle-Inspector'
});

Object.extend(Kekule.ChemWidget.ComponentWidgetNames, {
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

	molRing3: 'ring3',
	molRing4: 'ring4',
	molRing5: 'ring5',
	molRing6: 'ring6',
	molRing7: 'ring7',
	molRing8: 'ring8',
	molRingAr6: 'ringAr6',
	molRingAr5: 'ringAr5',

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
	glyphRepHeatSymbol: 'repHeatSymbol',
	glyphRepAddSymbol: 'repAddSymbol'
});

/**
 * A helper class for editor actions.
 * @class
 */
Kekule.Editor.ActionOperUtils = {
	/**
	 * Add standalone objects to a chem space editor, with operation support.
	 * @param {Kekule.Editor.ChemSpaceEditor} editor
	 * @param {Array} objs
	 * @param {Hash} coordOffset Coords of new added objects will be added with this value.
	 */
	addObjectsToChemSpaceEditor: function(editor, objs, coordOffset)
	{
		var chemSpace = editor.getChemSpace && editor.getChemSpace();
		if (editor && chemSpace && editor.canAddNewStandaloneObject && editor.canAddNewStandaloneObject())
		{
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
 */
Kekule.Editor.ActionOnEditor = Class.create(Kekule.ChemWidget.ActionOnDisplayer,
/** @lends Kekule.Editor.ActionOnEditor# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ActionOnEditor',
	/** @constructs */
	initialize: function($super, editor, caption, hint)
	{
		$super(editor, caption, hint);
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
	initialize: function($super, editor)
	{
		$super(editor, /*CWT.CAPTION_UNDO, CWT.HINT_UNDO*/Kekule.$L('ChemWidgetTexts.CAPTION_UNDO'), Kekule.$L('ChemWidgetTexts.HINT_UNDO'));
	},
	/** @private */
	doUpdate: function($super)
	{
		$super();
		if (this.getEnabled())
			this.setEnabled(this.getEditor().canUndo());
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
	initialize: function($super, editor)
	{
		$super(editor, /*CWT.CAPTION_REDO, CWT.HINT_REDO*/Kekule.$L('ChemWidgetTexts.CAPTION_REDO'), Kekule.$L('ChemWidgetTexts.HINT_REDO'));
	},
	/** @private */
	doUpdate: function($super)
	{
		$super();
		if (this.getEnabled())
			this.setEnabled(this.getEditor().canRedo());
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
	initialize: function($super, editor)
	{
		$super(editor, /*CWT.CAPTION_NEWDOC, CWT.HINT_NEWDOC*/Kekule.$L('ChemWidgetTexts.CAPTION_NEWDOC'), Kekule.$L('ChemWidgetTexts.HINT_NEWDOC'));
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
	initialize: function($super, editor)
	{
		$super(editor, /*CWT.CAPTION_CLONE_SELECTION, CWT.HINT_CLONE_SELECTION*/Kekule.$L('ChemWidgetTexts.CAPTION_CLONESELECTION'), Kekule.$L('ChemWidgetTexts.HINT_CLONE_SELECTION'));
	},
	/** @private */
	_hasCloneMethod: function()
	{
		var editor = this.getEditor();
		return editor && editor.cloneSelection;
	},
	/** @private */
	doUpdate: function($super)
	{
		$super();
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
			Kekule.Editor.ActionOperUtils.addObjectsToChemSpaceEditor(editor, objs, coordOffset);
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
	initialize: function($super, editor)
	{
		$super(editor, /*CWT.CAPTION_COPY, CWT.HINT_COPY*/Kekule.$L('ChemWidgetTexts.CAPTION_COPY'), Kekule.$L('ChemWidgetTexts.HINT_COPY'));
	},
	/** @private */
	doUpdate: function($super)
	{
		$super();
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
			Kekule.Widget.clipboard.setObjects(Kekule.IO.MimeType.JSON, objs);
			//console.log(Kekule.Widget.Clipboard.getData('text/json'));
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
	initialize: function($super, editor)
	{
		$super(editor, /*CWT.CAPTION_CUT, CWT.HINT_CUT*/Kekule.$L('ChemWidgetTexts.CAPTION_CUT'), Kekule.$L('ChemWidgetTexts.HINT_CUT'));
	},
	/** @private */
	doUpdate: function($super)
	{
		$super();
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
			Kekule.Widget.clipboard.setObjects(Kekule.IO.MimeType.JSON, objs);

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
	initialize: function($super, editor)
	{
		$super(editor, /*CWT.CAPTION_PASTE, CWT.HINT_PASTE*/Kekule.$L('ChemWidgetTexts.CAPTION_PASTE'), Kekule.$L('ChemWidgetTexts.HINT_PASTE'));
		Kekule.Widget.clipboard.addEventListener('setData', this._reactClipboardChange, this);
	},
	/** @ignore */
	finalize: function($super)
	{
		Kekule.Widget.clipboard.removeEventListener('setData', this._reactClipboardChange, this);
		$super();
	},
	/** @private */
	_reactClipboardChange: function()
	{
		this.update();
	},
	/** @private */
	doUpdate: function($super)
	{
		$super();
		if (this.getEnabled())
			this.setEnabled(Kekule.Widget.clipboard.hasData(Kekule.IO.MimeType.JSON) && this.getEditor().canAddNewStandaloneObject());
	},
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
	/** @private */
	doExecute: function()
	{
		var editor = this.getEditor();
		if (editor && editor.getChemSpace)
		{
			var objs = Kekule.Widget.clipboard.getObjects(Kekule.IO.MimeType.JSON);

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

			Kekule.Editor.ActionOperUtils.addObjectsToChemSpaceEditor(editor, objs, coordOffset);
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
	initialize: function($super, composer, caption, hint)
	{
		$super();
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
	initialize: function($super, composer, caption, hint)
	{
		var actions = new Kekule.ActionList();
		actions.setOwnActions(true);
		this.setPropStoreFieldValue('attachedActions', actions);
		$super(composer, caption, hint);
	},
	finalize: function($super)
	{
		this.getAttachedActions().finalize();
		$super();
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('attachedActionClasses', {'dataType': DataType.ARRAY, 'serializable': false, 'setter': null});
		this.defineProp('attachedActions', {'dataType': 'Kekule.ActionList', 'serializable': false, 'setter': null});
		this.defineProp('defaultAttachedAction', {'dataType': 'Kekule.Action', 'serializable': false});
	},

	/** @private */
	checkedChanged: function($super)
	{
		$super();
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
	update: function($super)
	{
		$super();
		this.getAttachedActions().updateAll();
	}
});

/**
 * Action to show or hide adv panel (object inspector and tree view) of composer.
 * @class
 * @augments Kekule.Editor.ActionOnComposer
 *
 * @param {Kekule.Editor.Composer} composer Target composer widget.
 */
Kekule.Editor.ActionComposerToggleInspector = Class.create(Kekule.Editor.ActionOnComposer,
/** @lends Kekule.Editor.ActionComposerToggleInspector# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ActionComposerToggleInspector',
	/** @private */
	HTML_CLASSNAME: CCNS.ACTION_TOGGLE_INSPECTOR,
	/** @constructs */
	initialize: function($super, composer)
	{
		$super(composer, /*CWT.CAPTION_TOGGLE_INSPECTOR, CWT.HINT_TOGGLE_INSPECTOR*/Kekule.$L('ChemWidgetTexts.CAPTION_TOGGLE_INSPECTOR'), Kekule.$L('ChemWidgetTexts.HINT_TOGGLE_INSPECTOR'));
		//this.setCheckGroup(this.getClassName());
	},
	/** @private */
	doUpdate: function()
	{
		var composer = this.getComposer();
		if (composer)
		{
			this.setChecked(composer.getShowInspector());
		}
	},
	/** @private */
	doExecute: function()
	{
		var composer = this.getComposer();
		if (composer)
		{
			this.setChecked(!this.getChecked());
			composer.setShowInspector(this.getChecked());
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
	initialize: function($super, composer, caption, hint, controllerId)
	{
		$super(composer, caption, hint);
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
		initialize: function($super, composer)
		{
			$super(composer, caption, hint, iaControllerId);
			if (this.initAttachedActions)
				this.initAttachedActions();
		}
	};
	if (specifiedProps)
	{
		data.doExecute = function($super)
		{
			var editor = this.getEditor();
			var controller = editor.getIaController(iaControllerId);
			if (controller)
			{
				controller.setPropValues(specifiedProps);
			}
			//console.log('execute self', this.getClassName());
			$super();
		}
	}
	if (methods)
	{
		data = Object.extend(data, methods);
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

// Select
Kekule.Editor.ActionComposerSetManipulateController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetManipulateController',
	Kekule.$L('ChemWidgetTexts.CAPTION_MANIPULATE'), //Kekule.ChemWidgetTexts.CAPTION_MANIPULATE,
	Kekule.$L('ChemWidgetTexts.HINT_MANIPULATE'), //Kekule.ChemWidgetTexts.HINT_MANIPULATE,
	'BasicMolManipulationIaController',
	null,
	null, null, null,
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
		doExecute: function($super)
		{
			$super();
			var editor = this.getEditor();
			if (editor.hasSelection())
				editor.getActiveIaController().removeSelection();
		}
	},
	BNS.erase
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
		Kekule.Editor.ActionComposerSetBondControllerCloser,
		Kekule.Editor.ActionComposerSetBondControllerWedgeUp,
		Kekule.Editor.ActionComposerSetBondControllerWedgeDown,
		Kekule.Editor.ActionComposerSetBondControllerWedgeUpOrDown,
		Kekule.Editor.ActionComposerSetBondControllerDoubleEither,
		Kekule.Editor.ActionComposerSetRepositoryMethaneController,
		//Kekule.Editor.ActionComposerSetRepositorySubBondMarkController,
		Kekule.Editor.ActionComposerSetRepositoryFischer1Controller,
		Kekule.Editor.ActionComposerSetRepositoryFischer2Controller,
		Kekule.Editor.ActionComposerSetRepositoryFischer3Controller,
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
		Kekule.Editor.ActionComposerSetNodeChargeControllerRadicalDoublet
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
		Kekule.Editor.ActionComposerSetRepositoryRing7Controller,
		Kekule.Editor.ActionComposerSetRepositoryRing8Controller,
		Kekule.Editor.ActionComposerSetRepositoryRingAr6Controller,
		Kekule.Editor.ActionComposerSetRepositoryRingAr5Controller,
		Kekule.Editor.ActionComposerSetRepositoryCyclopentaneHaworth1Controller,
		Kekule.Editor.ActionComposerSetRepositoryCyclopentaneHaworth2Controller,
		Kekule.Editor.ActionComposerSetRepositoryCyclohexaneHaworth1Controller,
		Kekule.Editor.ActionComposerSetRepositoryCyclohexaneHaworth2Controller,
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

Kekule.Editor.ActionComposerSetRepositoryGlyphController = Kekule.Editor.createComposerIaControllerActionClass(
	'Kekule.Editor.ActionComposerSetRepositoryGlyphController',
	Kekule.$L('ChemWidgetTexts.CAPTION_REPOSITORY_ARROWLINE'), //Kekule.ChemWidgetTexts.CAPTION_REPOSITORY_ARROWLINE,
	Kekule.$L('ChemWidgetTexts.HINT_REPOSITORY_ARROWLINE'), //Kekule.ChemWidgetTexts.HINT_REPOSITORY_ARROWLINE,
	'ArrowLineIaController',
	null,
	null,
	[
		Kekule.Editor.ActionComposerSetRepositoryPathOpenArrowLineController,
		Kekule.Editor.ActionComposerSetRepositoryPathTriangleArrowLineController,
		Kekule.Editor.ActionComposerSetRepositoryPathDiOpenArrowLineController,
		Kekule.Editor.ActionComposerSetRepositoryPathDiTriangleArrowLineController,
		Kekule.Editor.ActionComposerSetRepositoryPathReversibleArrowLineController,
		Kekule.Editor.ActionComposerSetRepositoryPathOpenArrowDblLineController,
		Kekule.Editor.ActionComposerSetRepositoryPathLineController,
		Kekule.Editor.ActionComposerSetRepositoryHeatSymbolController,
		Kekule.Editor.ActionComposerSetRepositoryAddSymbolController
	],
	null,
	BNS.glyph
);

// register actions to editor/composer widget
Kekule._registerAfterLoadProc(function(){
	var AM = Kekule.ActionManager;
	var CW = Kekule.ChemWidget;
	var CE = Kekule.Editor;
	var widgetClass = Kekule.Editor.ChemSpaceEditor;
	var reg = AM.registerNamedActionClass;

	reg(BNS.newDoc, CE.ActionEditorNewDoc, widgetClass);
	reg(BNS.loadFile, CW.ActionDisplayerLoadFile, widgetClass);
	reg(BNS.loadData, CW.ActionDisplayerLoadData, widgetClass);
	reg(BNS.saveData, CW.ActionDisplayerSaveFile, widgetClass);
	reg(BNS.zoomIn, CW.ActionDisplayerZoomIn, widgetClass);
	reg(BNS.zoomOut, CW.ActionDisplayerZoomOut, widgetClass);
	reg(BNS.reset, CW.ActionDisplayerReset, widgetClass);
	reg(BNS.config, Kekule.Widget.ActionOpenConfigWidget, widgetClass);
	reg(BNS.undo, CE.ActionEditorUndo, widgetClass);
	reg(BNS.redo, CE.ActionEditorRedo, widgetClass);
	reg(BNS.cloneSelection, CE.ActionCloneSelection, widgetClass);
	reg(BNS.copy, CE.ActionCopySelection, widgetClass);
	reg(BNS.cut, CE.ActionCutSelection, widgetClass);
	reg(BNS.paste, CE.ActionPaste, widgetClass);

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

	reg(BNS.objInspector, CE.ActionComposerToggleInspector, widgetClass);

	// actions created by function createComposerIaControllerActionClass
	for (var i = 0, l = _editorActionRegInfo.length; i < l; ++i)
	{
		var info = _editorActionRegInfo[i];
		reg(info.name, info.actionClass, info.widgetClass || widgetClass);
	}
});


})();