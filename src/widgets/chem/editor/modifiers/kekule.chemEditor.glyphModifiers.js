/**
 * @fileoverview
 * Object modifier to change property of path glyphs in chem editor.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /chemdoc/kekule.glyph.pathGlyphs.js
 * requires /widgets/kekule.widget.base.js
 * requires /widgets/commonCtrls/kekule.widget.buttons.js
 * requires /widgets/chem/editor/kekule.chemEditor.editorUtils.js
 * requires /widgets/chem/editor/kekule.chemEditor.baseEditor.js
 * requires /widgets/chem/editor/kekule.chemEditor.objModifiers.js
 * requires /widgets/chem/editor/kekule.chemEditor.utilWidgets.js
 */

(function(){
"use strict";

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /widgets/kekule.widget.base.js
 * requires /widgets/commonCtrls/kekule.widget.buttons.js
 * requires /widgets/chem/editor/kekule.chemEditor.baseEditor.js
 * requires /widgets/chem/editor/kekule.chemEditor.objModifiers.js
 * requires /widgets/chem/editor/kekule.chemEditor.utilWidgets.js
 */


var OU = Kekule.ObjUtils;
var AU = Kekule.ArrayUtils;
var DU = Kekule.DomUtils;
var EU = Kekule.HtmlElementUtils;
var CNS = Kekule.Widget.HtmlClassNames;
var CCNS = Kekule.ChemWidget.HtmlClassNames;

Kekule.ChemWidget.HtmlClassNames = Object.extend(Kekule.ChemWidget.HtmlClassNames, {
	COMPOSER_GLYPH_PATH_MODIFIER_BUTTON: 'K-Chem-Composer-GlyphPathModifier-Button',
	COMPOSER_Glyph_PATH_MODIFIER_DROPDOWN: 'K-Chem-Composer-GlyphPathModifier-DropDown',
	COMPOSER_GLYPH_REACTION_ARROW_MODIFIER_BUTTON: 'K-Chem-Composer-ReactionArrowModifier-Button',
	COMPOSER_GLYPH_ARC_PATH_MODIFIER_BUTTON: 'K-Chem-Composer-ArcPathModifier-Button',
	COMPOSER_GLYPH_ELECTRON_PUSHING_ARROW_MODIFIER_BUTTON: 'K-Chem-Composer-ElectronPushingArrowModifier-Button',
});

/**
 * Base modifier class to change the glyphs in editor.
 * @class
 * @augments Kekule.Editor.ObjModifier.Base
 */
Kekule.Editor.ObjModifier.GlyphModifier = Class.create(Kekule.Editor.ObjModifier.Base,
/** @lends Kekule.Editor.ObjModifier.GlyphModifier# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ObjModifier.GlyphModifier'
});
/** @ignore */
Kekule.Editor.ObjModifier.GlyphModifier.getCategories = function()
{
	return [Kekule.Editor.ObjModifier.Category.GLYPH];
};

/**
 * A modifier to change the params of a path.
 * @class
 * @augments Kekule.Editor.ObjModifier.GlyphModifier
 */
Kekule.Editor.ObjModifier.GlyphPath = Class.create(Kekule.Editor.ObjModifier.GlyphModifier,
/** @lends Kekule.Editor.ObjModifier.GlyphPath# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ObjModifier.GlyphPath',
	/** @private */
	MIX_VALUE: '[mixed]',
	/** @construct */
	initialize: function($super, editor)
	{
		$super(editor);
		this._valueStorage = {};
	},
	/** @private */
	initProperties: function()
	{
		// private
		this.defineProp('pathParamSetter', {
			'dataType': 'Kekule.Widget.BaseWidget', 'serializable': false, 'setter': null
		});
	},
	/** @ignore */
	doCreateWidget: function()
	{
		var result = new Kekule.Widget.DropDownButton(this.getEditor());
		result.setHint(this.getModifierHint());
		result.setText(this.getModifierCaption());
		result.setShowText(true);
		result.setButtonKind(Kekule.Widget.Button.Kinds.DROPDOWN);
		result.addClassName(CCNS.COMPOSER_GLYPH_PATH_MODIFIER_BUTTON + ' ' + this.getModifierClassName());

		//var atomSetter = this._createAtomSetter(this.getEditor());
		//result.setDropDownWidget(atomSetter);
		result.setDropDownWidgetGetter(this._createPathParamSetter.bind(this));

		return result;
	},
	/** @private */
	_createPathParamSetter: function(parentWidget)
	{
		if (!parentWidget)
			parentWidget = this.getEditor();
		var widgetClass = this.getPathParamSetterClass();
		var result = new widgetClass(parentWidget);
		result.setCaption(this.getModifierCaption());
		result.addClassName(CCNS.COMPOSER_GLYPH_PATH_MODIFIER_DROPDOWN);

		this.setPropStoreFieldValue('pathParamSetter', result);
		if (this._valueStorage.pathParams)
		{
			result.setValue(this._valueStorage.pathParams);
			this._valueStorage.pathParams = null;
		}

		// react to value change of setter
		var self = this;
		result.addEventListener('showStateChange', function(e){
			if (e.isShown)  // when the setter popups, clear the original operations
				self._lastOperation = null;
			else if (e.isDismissed) // when closing and dismissed, ensure operation is undo
			{
				if (self._lastOperation)
					self._lastOperation.reverse();
			}
		});
		result.addEventListener('valueChange', function(e){
			if (e.widget === result)
			{
				self.applyToTargets();
				//result.dismiss();
				e.stopPropagation();
			}
		});
		result.addEventListener('valueInput', function(e){
			if (e.widget === result)
			{
				//self.applyToTargets();
				self.doModification(self.getEditor(), self.getTargetObjs(), true);
				//result.dismiss();
				e.stopPropagation();
			}
		});

		return result;
	},
	/** @private */
	getPathParamSetterClass: function()
	{
		return Kekule.ChemWidget.GlyphPathSettingPanel;
	},
	/** @private */
	getModifierCaption: function()
	{
		return Kekule.$L('ChemWidgetTexts.CAPTION_GLYPH_PATH_MODIFIER');
	},
	/** @private */
	getModifierHint: function()
	{
		return Kekule.$L('ChemWidgetTexts.HINT_GLYPH_PATH_MODIFIER');
	},
	/** @private */
	getModifierClassName: function()
	{
		return '';
	},

	/** @private */
	_mergeHashValues: function(hash1, hash2)
	{
		if (!hash1)
			return hash2;
		if (!hash2)
			return hash1;
		else
		{
			var propNames1 = OU.getOwnedFieldNames(hash1, false);
			var propNames2 = OU.getOwnedFieldNames(hash2, false);
			var propNames = AU.clone(propNames1);
			AU.pushUnique(propNames, propNames2);
			if (propNames.length)
			{
				var result = {};
				for (var i = 0, l = propNames.length; i < l; ++i)
				{
					var pname = propNames[i];
					var value1 = hash1[pname];
					var value2 = hash2[pname];
					if (value1 === value2)
						result[pname] = value1;
					else
						result[pname] = this.MIX_VALUE;  // a special value not matching all ordinary param values
				}
				return result;
			}
			else
				return null;
		}
	},
	/** @private */
	_extractPathParamsOfObjs: function(objs)
	{
		var result = null;
		for (var i = 0, ii = objs.length; i < ii; ++i)
		{
			var obj = objs[i];
			var connectors = (obj instanceof Kekule.Glyph.PathGlyphConnector) ? [obj] :
				(obj instanceof Kekule.Glyph.PathGlyph) ? obj.getConnectors() :
					null;
			if (connectors)
			{
				for (var j = 0, jj = connectors.length; j < jj; ++j)
				{
					var param = this._extractPathParamOfConnector(connectors[j]);
					if (param)
						result = this._mergeHashValues(result, param);
				}
			}
		}
		return result;
	},
	/** @private */
	_extractPathParamOfConnector: function(connector)
	{
		return connector.getPathParams && connector.getPathParams();
	},

	/**
	 * Returns the glyph classes that this modified can be applied to.
	 * Descendants may override this method.
	 * @private
	 */
	getApplicableGlyphClasses: function()
	{
		return [Kekule.Glyph.PathGlyph];
	},
	/** @private */
	isApplicableGlyph: function(obj)
	{
		var checkObj = this.getTargetPathGlyph(obj);
		if (checkObj)
		{
			var classes = this.getApplicableGlyphClasses();
			if (classes)
			{

				for (var i = 0, l = classes.length; i < l; ++i)
				{
					if (obj instanceof classes[i])
						return true;
				}
				return false;
			}
			else
				return true;
		}
		else
			return false;
	},
	/** @private */
	getTargetPathGlyph: function(obj)
	{
		return (obj instanceof Kekule.Glyph.PathGlyph)? obj:
			(obj instanceof Kekule.Glyph.PathGlyphConnector)? obj.getParent():
				null
	},

	/** @private */
	_getActualModificationObjs: function(targets)
	{
		var result = [];
		for (var i = 0, l = targets.length; i < l; ++i)
		{
			var obj = targets[i];
			//if (obj instanceof Kekule.Glyph.PathGlyph || obj instanceof Kekule.Glyph.PathGlyphConnector)
			if (this.isApplicableGlyph(obj))
				AU.pushUnique(result, obj);
		}
		return result;
	},
	/** @private */
	_getActualModificationConnectors: function(targets)
	{
		var result = [];
		var actualTargets = this._getActualModificationObjs(targets);
		for (var i = 0, l = actualTargets.length; i < l; ++i)
		{
			var obj = actualTargets[i];
			if (obj instanceof Kekule.Glyph.PathGlyphConnector)
				result.push(obj);
			else if (obj instanceof Kekule.Glyph.PathGlyph)
				AU.pushUnique(result, obj.getConnectors());
		}
		return result;
	},
	/** @private */
	_getActualModificationGlyphs: function(targets)
	{
		var result = [];
		var actualTargets = this._getActualModificationObjs(targets);
		for (var i = 0, l = actualTargets.length; i < l; ++i)
		{
			var obj = actualTargets[i];
			var glyph = this.getTargetPathGlyph(obj);
			if (glyph)
				AU.pushUnique(result, glyph);
		}
		return result;
	},

	/** @private */
	_filterAppliableParams: function(params)
	{
		var result = {};
		var props = OU.getOwnedFieldNames(params);
		for (var i = 0, l = props.length; i < l; ++i)
		{
			var value = params[props[i]];
			if (value !== undefined && value !== this.MIX_VALUE)
				result[props[i]] = value;
		}
		return result;
	},
	/** @private */
	createModificationOperations: function(editor, targets, pathParams)
	{
		var opers = [];
		var connectors = this._getActualModificationConnectors(targets);
		for (var i = 0, l = connectors.length; i < l; ++i)
		{
			var target = connectors[i];
			if (target instanceof Kekule.Glyph.PathGlyphConnector)
			{
				var op = new Kekule.ChemObjOperation.ModifyHashProp(target, 'pathParams', pathParams, editor);
				if (op)
					opers.push(op);
			}
		}
		return opers;
	},
	/** @private */
	updateModificationOperations: function(editor, targets, pathParams, operations)
	{
		for (var i = 0, l = operations.length; i < l; ++i)
		{
			var operation = operations[i];
			if (operation instanceof Kekule.ChemObjOperation.ModifyHashProp)
				operation.setNewPropValue(pathParams);
		}
		return operations;
	},
	/** @private */
	doModification: function(editor, targets, doNotAddOperToHistory)
	{
		var pathParams = this.getPathParamSetter().getValue();
		//console.log('do apply begin', pathParams);
		pathParams = this._filterAppliableParams(pathParams);
		/*
		var opers = [];
		var connectors = this._getActualModificationConnectors(targets);
		var editor = editor || this.getEditor();
		for (var i = 0, l = connectors.length; i < l; ++i)
		{
			var target = connectors[i];
			if (target instanceof Kekule.Glyph.PathGlyphConnector)
			{
				var op = new Kekule.ChemObjOperation.ModifyHashProp(target, 'pathParams', pathParams, editor);
				if (op)
					opers.push(op);
			}
		}
		*/
		var opers;
		if (this._lastOperation)
			opers = this.updateModificationOperations(editor, targets, pathParams, this._lastOperation);
		else
			opers = this.createModificationOperations(editor, targets, pathParams);

		var operation;
		if (opers && opers.length > 1)
			operation = new Kekule.MacroOperation(opers);
		else
			operation = opers[0];

		var editor = this.getEditor();
		editor.beginUpdateObject();
		try
		{
			if (operation)  // only execute when there is real modification
			{
				if (!doNotAddOperToHistory)
				{
					editor.execOperation(operation);
				}
				else
				{
					operation.execute();
					this._lastOperation = operation;
				}
			}
		}
		finally
		{
			editor.endUpdateObject();
		}
		//console.log('do apply end');
	},

	/** @ignore */
	doLoadFromTargets: function(editor, targets)
	{
		var objs = this._getActualModificationObjs(targets);
		var showModifier = (objs.length > 0);
		this._lastOperation = null;

		if (showModifier)
		{
			var pathParams = this._extractPathParamsOfObjs(objs);
			this._valueStorage.pathParams = pathParams;

			if (this.getPathParamSetter())
			{
				this.getPathParamSetter().setValue(pathParams);
			}
		}
		this.getWidget().setDisplayed(showModifier);
	},
	/** @ignore */
	doApplyToTargets: function($super, editor, targets)
	{
		this.doModification(editor, targets, false);
	}
});

/**
 * A modifier to change the path params of reaction arrow and line segment.
 * @class
 * @augments Kekule.Editor.ObjModifier.GlyphPath
 */
Kekule.Editor.ObjModifier.ReactionArrowAndSegmentPath = Class.create(Kekule.Editor.ObjModifier.GlyphPath,
/** @lends Kekule.Editor.ObjModifier.ReactionArrowAndSegmentPath# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ObjModifier.ReactionArrowAndSegmentPath',
	/** @private */
	MIX_VALUE: '[mixed]',
	/** @construct */
	initialize: function($super, editor)
	{
		$super(editor);
	},
	/** @ignore */
	getPathParamSetterClass: function()
	{
		return Kekule.ChemWidget.GlyphReactionArrowPathSettingPanel;
	},
	/** @private */
	getModifierCaption: function()
	{
		return Kekule.$L('ChemWidgetTexts.CAPTION_REACTION_ARROW_AND_SEGMENT_PATH_MODIFIER');
	},
	/** @private */
	getModifierHint: function()
	{
		return Kekule.$L('ChemWidgetTexts.HINT_REACTION_ARROW_AND_SEGMENT_PATH_MODIFIER');
	},
	/** @private */
	getModifierClassName: function()
	{
		return CCNS.COMPOSER_GLYPH_REACTION_ARROW_MODIFIER_BUTTON;
	},
	/** @ignore */
	getApplicableGlyphClasses: function()
	{
		return [Kekule.Glyph.StraightLine, Kekule.Glyph.Segment, Kekule.Glyph.ReactionArrow];
	},
	/** @ignore */
	_extractPathParamsOfObjs: function($super, objs)
	{
		var reactionArrowType;
		var result = $super(objs);
		for (var i = 0, ii = objs.length; i < ii; ++i)
		{
			var obj = objs[i];
			var glyph = this.getTargetPathGlyph(obj);
			if (glyph)
			{
				if (glyph.getReactionType)
				{
					var rt = glyph.getReactionType();
					if (!reactionArrowType)
						reactionArrowType = rt;
					else if (reactionArrowType !== rt)
					{
						reactionArrowType = Kekule.Glyph.ReactionArrowType.CUSTOM;
						break;
					}
				}
			}
		}
		result.reactionArrowType = reactionArrowType;
		return result;
	},
	/** @ignore */
	createModificationOperations: function($super, editor, targets, pathParams)
	{
		var opers = [];
		if (/*pathParams.reactionArrowType &&*/ pathParams.reactionArrowType !== this.MIX_VALUE)
		{
			var glyphs = this._getActualModificationGlyphs(targets);
			for (var i = 0, l = glyphs.length; i < l; ++i)
			{
				var glyph = glyphs[i];
				if (glyph.setReactionType)
				{
					if (!pathParams.reactionArrowType)  // explicit none, change reaction arrow to line segment
					{
						if (glyph instanceof Kekule.Glyph.ReactionArrow)
						{
							opers.push(new Kekule.ChemObjOperation.ChangeClass(glyph, Kekule.Glyph.Segment, editor));
						}
					}
				}
				else
				{
					if (!!pathParams.reactionArrowType)
					{
						if (glyph instanceof Kekule.Glyph.StraightLine)
						{
							opers.push(new Kekule.ChemObjOperation.ChangeClass(glyph, Kekule.Glyph.ReactionArrow, editor));
						}
					}
				}
			}
			opers.push(new Kekule.ChemObjOperation.Modify(glyph, {'reactionType': pathParams.reactionArrowType}, editor));
		}
		var otherOpers = $super(editor, targets, pathParams) || [];
		opers = opers.concat(otherOpers);  // the reaction type operation must before pathParam modification operations, since it may changes pathParams
		return opers;
	}
});

/**
 * A modifier to change the path params of arc segment.
 * @class
 * @augments Kekule.Editor.ObjModifier.GlyphPath
 */
Kekule.Editor.ObjModifier.ArcPath = Class.create(Kekule.Editor.ObjModifier.GlyphPath,
/** @lends Kekule.Editor.ObjModifier.ArcPath# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ObjModifier.ArcPath',
	/** @construct */
	initialize: function($super, editor)
	{
		$super(editor);
	},
	/** @ignore */
	getPathParamSetterClass: function()
	{
		return Kekule.ChemWidget.GlyphArcPathSettingPanel;
	},
	/** @private */
	getModifierCaption: function()
	{
		return Kekule.$L('ChemWidgetTexts.CAPTION_ARC_PATH_MODIFIER');
	},
	/** @private */
	getModifierHint: function()
	{
		return Kekule.$L('ChemWidgetTexts.HINT_ARC_PATH_MODIFIER');
	},
	/** @private */
	getModifierClassName: function()
	{
		return CCNS.COMPOSER_GLYPH_ARC_PATH_MODIFIER_BUTTON;
	},
	/** @ignore */
	getApplicableGlyphClasses: function()
	{
		return [Kekule.Glyph.Arc];
	},
});

/**
 * A modifier to change the path params of arc segment.
 * @class
 * @augments Kekule.Editor.ObjModifier.GlyphPath
 */
Kekule.Editor.ObjModifier.ElectronPushingArrow = Class.create(Kekule.Editor.ObjModifier.GlyphPath,
/** @lends Kekule.Editor.ObjModifier.ElectronPushingArrow# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ObjModifier.ElectronPushingArrow',
	/** @construct */
	initialize: function($super, editor)
	{
		$super(editor);
	},
	/** @ignore */
	getPathParamSetterClass: function()
	{
		return Kekule.ChemWidget.GlyphElectronPushingArrowSettingPanel;
	},
	/** @private */
	getModifierCaption: function()
	{
		return Kekule.$L('ChemWidgetTexts.CAPTION_ELECTRON_PUSHING_ARROW_MODIFIER');
	},
	/** @private */
	getModifierHint: function()
	{
		return Kekule.$L('ChemWidgetTexts.HINT_ELECTRON_PUSHING_ARROW_MODIFIER');
	},
	/** @private */
	getModifierClassName: function()
	{
		return CCNS.COMPOSER_GLYPH_ELECTRON_PUSHING_ARROW_MODIFIER_BUTTON;
	},
	/** @ignore */
	getApplicableGlyphClasses: function()
	{
		return [Kekule.Glyph.ElectronPushingArrow];
	},

	/** @ignore */
	_extractPathParamsOfObjs: function($super, objs)
	{
		var electronCount;
		var result = $super(objs);
		for (var i = 0, ii = objs.length; i < ii; ++i)
		{
			var obj = objs[i];
			var glyph = this.getTargetPathGlyph(obj);
			if (glyph)
			{
				if (glyph.getElectronCount)
				{
					var eCount = glyph.getElectronCount();
					if (OU.isUnset(electronCount))
						electronCount = eCount;
					else if (electronCount !== eCount)
					{
						electronCount = 0;  // Mix value
						break;
					}
				}
			}
		}
		result.electronCount = electronCount;
		return result;
	},
	/** @ignore */
	createModificationOperations: function($super, editor, targets, pathParams)
	{
		var opers = $super(editor, targets, pathParams) || [];  // arrow param must be set first, since e-count may changes the arrow side
		if (!!pathParams.electronCount)
		{
			var glyphs = this._getActualModificationGlyphs(targets);
			for (var i = 0, l = glyphs.length; i < l; ++i)
			{
				var glyph = glyphs[i];
				if (glyph.hasProperty('electronCount'))
				{
					opers.push(new Kekule.ChemObjOperation.Modify(glyph, {'electronCount': pathParams.electronCount}, editor));
				}
			}
		}
		return opers;
	}
});

var OMM = Kekule.Editor.ObjModifierManager;
OMM.register([Kekule.Glyph.StraightLine, Kekule.Glyph.PathGlyphConnector], [Kekule.Editor.ObjModifier.ReactionArrowAndSegmentPath]);
OMM.register([Kekule.Glyph.Arc], [Kekule.Editor.ObjModifier.ArcPath]);
OMM.register([Kekule.Glyph.ElectronPushingArrow], [Kekule.Editor.ObjModifier.ElectronPushingArrow]);

})();