/**
 * @fileoverview
 * Changable global configurations for renderers.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /core/kekule.configs.js
 * requires /utils/kekule.utils.js
 * requires /render/kekule.render.base.js
 * requires /localization
 */

(function(){
"use strict";

var OT = Kekule.OBJDEF_TEXTS;
var PS = Class.PropertyScope;

/**
 * A set of predefined configs for rendering.
 * @class
 * @augments Kekule.ConfigPresetMap
 */
Kekule.Render.PredefinedConfigsMap = Class.create(Kekule.ConfigPresetMap,
/** @lends Kekule.Render.PredefinedConfigsMap# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.PredefinedConfigsMap'
});

/**
 * General configs that can be used both in 2D and 3D renderers.
 * @class
 * @augments Kekule.AbstractConfigs
 *
 * @property {Bool} allowCoordBorrow Whether 3D coord can be used to draw the object when 2D coord is unavailable or vice versa.
 * @property {Float} drawOpacity
 */
Kekule.Render.GeneralConfigs = Class.create(Kekule.AbstractConfigs,
/** @lends Kekule.Render.GeneralConfigs# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.GeneralConfigs',
	/** @private */
	initProperties: function()
	{
		this.addBoolConfigProp('allowCoordBorrow', true, {'scope': PS.PUBLIC});
		this.addFloatConfigProp('drawOpacity', 1, {'title': OT.TITLE_DRAWOPACITY, 'description': OT.DES_DRAWOPACITY});
	}
});

/**
 * Config class of 2D render.
 * @class
 * @augments Kekule.AbstractConfigs
 *
 * @property {Kekule.Render.GeneralConfigs} generalDisplayConfigs
 * @property {Kekule.Render.MoleculeDisplayConfigs} moleculeDisplayConfigs
 * @property {Kekule.Render.DisplayLabelConfigs} displayLabelConfigs Configs to determine which text is used to display certain labels.
 * @property {Kekule.Render.TextFontConfigs} textFontConfigs Font configs to display text.
 * @property {Kekule.Render.LengthConfigs} lengthConfigs
 * @property {Kekule.Render.ColorConfigs} colorConfigs
 */
Kekule.Render.Render2DConfigs = Class.create(Kekule.AbstractConfigs,
/** @lends Kekule.Render.Render2DConfigs# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.Render2DConfigs',

	/** @private */
	initProperties: function()
	{
		this.addConfigProp('generalConfigs', 'Kekule.Render.GeneralConfigs');
		this.addConfigProp('moleculeDisplayConfigs', 'Kekule.Render.MoleculeDisplayConfigs');
		this.addConfigProp('displayLabelConfigs', 'Kekule.Render.DisplayLabelConfigs');
		this.addConfigProp('textFontConfigs', 'Kekule.Render.TextFontConfigs');
		this.addConfigProp('lengthConfigs', 'Kekule.Render.LengthConfigs');
		this.addConfigProp('colorConfigs', 'Kekule.Render.ColorConfigs');
		//this.addConfigProp('interactStyleMap', 'Kekule.Render.PredefinedConfigsMap');
	},
	/** @private */
	initPropValues: function($super)
	{
		$super();
		this.setPropStoreFieldValue('generalConfigs', new Kekule.Render.GeneralConfigs());
		this.setPropStoreFieldValue('moleculeDisplayConfigs', new Kekule.Render.MoleculeDisplayConfigs());
		this.setPropStoreFieldValue('displayLabelConfigs', new Kekule.Render.DisplayLabelConfigs());
		this.setPropStoreFieldValue('textFontConfigs', new Kekule.Render.TextFontConfigs());
		this.setPropStoreFieldValue('lengthConfigs', new Kekule.Render.LengthConfigs());
		this.setPropStoreFieldValue('colorConfigs', new Kekule.Render.ColorConfigs());
		//this.setPropStoreFieldValue('interactStyleMap', new Kekule.Render.PredefinedConfigsMap());
	},

	/** @private */
	initInteractStyleMap: function()
	{

	}
});
Kekule.ClassUtils.makeSingleton(Kekule.Render.Render2DConfigs);

/**
 * Get a singleton instance of {@link Kekule.Render.Render2DConfigs}.
 * @function
 * @returns {Kekule.Render.RenderConfigs}
 */
Kekule.Render.getRender2DConfigs = function()
{
	return Kekule.Render.Render2DConfigs.getInstance();
};

/**
 * Options to display a molecule structure.
 * @class
 * @augments Kekule.AbstractConfigs
 *
 * @property {Int} defMoleculeDisplayType Value from {@link Kekule.Render.MoleculeDisplayType}.
 * @property {Int} defNodeDisplayMode Value from {@link Kekule.Render.NodeLabelDisplayMode}.
 * @property {Int} defHydrogenDisplayLevel Value from {@link Kekule.Render.HydrogenDisplayLevel}.
 * @property {Int} defChargeMarkType Value from {@link Kekule.Render.ChargeMarkRenderType}.
 * @property {Int} partialChargeDecimalsLength Show how many decimal places of partial charge.
 */
Kekule.Render.MoleculeDisplayConfigs = Class.create(Kekule.AbstractConfigs,
/** @lends Kekule.Render.MoleculeDisplayConfigs# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.MoleculeDisplayConfigs',
	/** @private */
	initProperties: function()
	{
		this.addIntConfigProp('defMoleculeDisplayType', Kekule.Render.MoleculeDisplayType.SKELETAL, {'enumSource': Kekule.Render.MoleculeDisplayType});
		this.addIntConfigProp('defNodeDisplayMode', Kekule.Render.NodeLabelDisplayMode.SMART, {'enumSource': Kekule.Render.NodeLabelDisplayMode});
		this.addIntConfigProp('defHydrogenDisplayLevel', Kekule.Render.HydrogenDisplayLevel.EXPLICIT, {'enumSource': Kekule.Render.HydrogenDisplayLevel});
		this.addIntConfigProp('defChargeMarkType', Kekule.Render.ChargeMarkRenderType.DEFAULT, {'enumSource': Kekule.Render.ChargeMarkRenderType});
		this.addIntConfigProp('partialChargeDecimalsLength', 2);
	}
});

/**
 * Display label options.
 * @class
 * @augments Kekule.AbstractConfigs
 *
 * @property {String} unsetElement Label for unset element.
 * @property {String} dummyAtom Label for dummy atom.
 * @property {String} heteroAtom Label for hetero atom (non C/H atom).
 * @property {String} anyAtom Label for unspecified atom.
 * @property {String} rgroup Label for Rgroup.
 * @property {String} isoListLeadingBracket Label for isotope list atom start bracket.
 * @property {String} isoListTailingBracket Label for isotope list atom end bracket.
 * @property {String} isoListDelimiter Label for isotope list atom isotope delimiter.
 * @property {String} isoListDisallowPrefix In a disallow list, a disallow prefix is used.
 */
Kekule.Render.DisplayLabelConfigs = Class.create(Kekule.AbstractConfigs,
/** @lends Kekule.Render.DisplayLabelConfigs# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.DisplayLabelConfigs',
	// default values
	/** Default label for unset element. */
	DEF_UNSET_ELEMENT: '?',

	// for Pseudoatom
	/** Default label for dummy atom. */
	DEF_DUMMY_ATOM: 'Du',
	/** Default label for Non C/H atom. */
	DEF_HETERO_ATOM: 'Q',
	/** Default label for Unspecific atom */
	DEF_ANY_ATOM: 'A',

	// for VariableAtom
	DEF_VARIABLE_ATOM: 'L',

	/** Default label for group */
	DEF_RGROUP: 'R',

	// for VariableAtom
	/** Display isotope list in bracket, such as [H, 13C, O, P]. */
	DEF_ISO_LIST_LEADING_BRACKET: '[',
	/** Display isotope list in bracket, such as [H, 13C, O, P]. */
	DEF_ISO_LIST_TAILING_BRACKET: ']',
	/** Default delimiter for each isotope in list */
	DEF_ISO_LIST_DELIMITER: ',',
	/** Default prefix to indicate it is a disallow list. */
	DEF_ISO_LIST_DISALLOW_PREFIX: 'NOT',

	/** @private */
	initProperties: function()
	{
		var NL = Kekule.ChemStructureNodeLabels;
		this.addBoolConfigProp('enableIsotopeAlias', NL.ENABLE_ISOTOPE_ALIAS, {
			'getter': function() { return NL.ENABLE_ISOTOPE_ALIAS; },
			'setter': function(value) { NL.ENABLE_ISOTOPE_ALIAS = value; }
		});
		this.addStrConfigProp('unsetElement', NL.UNSET_ELEMENT, {
			'getter': function() { return NL.UNSET_ELEMENT; },
			'setter': function(value) { if (value) NL.UNSET_ELEMENT = value; }
		});
		// for Pseudoatom
		this.addStrConfigProp('dummyAtom', NL.DUMMY_ATOM, {
			'getter': function() { return NL.DUMMY_ATOM; },
			'setter': function(value) { if (value) NL.DUMMY_ATOM = value; }
		});
		this.addStrConfigProp('heteroAtom', NL.HETERO_ATOM, {
			'getter': function() { return NL.HETERO_ATOM; },
			'setter': function(value) { if (value) NL.HETERO_ATOM = value; }
		});
		this.addStrConfigProp('anyAtom', NL.ANY_ATOM, {
			'getter': function() { return NL.ANY_ATOM; },
			'setter': function(value) { if (value) NL.ANY_ATOM = value; }
		});
		// for VariableAtom
		this.addStrConfigProp('variableAtom', NL.VARIABLE_ATOM, {
			'getter': function() { return NL.VARIABLE_ATOM; },
			'setter': function(value) { if (value) NL.VARIABLE_ATOM = value; }
		});
		// for RGroup
		this.addStrConfigProp('rgroup', NL.SUBGROUP, {
			'getter': function() { return NL.SUBGROUP; },
			'setter': function(value) { if (value) NL.SUBGROUP = value; }
		});
		// for VariableAtom
		this.addStrConfigProp('isoListLeadingBracket', NL.ISO_LIST_LEADING_BRACKET, {
			'getter': function() { return NL.ISO_LIST_LEADING_BRACKET; },
			'setter': function(value) { if (value) NL.ISO_LIST_LEADING_BRACKET = value; }
		});
		this.addStrConfigProp('isoListTailingBracket', NL.ISO_LIST_TAILING_BRACKET, {
			'getter': function() { return NL.ISO_LIST_TAILING_BRACKET; },
			'setter': function(value) { if (value) NL.ISO_LIST_TAILING_BRACKET = value; }
		});
		this.addStrConfigProp('isoListDelimiter', NL.ISO_LIST_DELIMITER, {
			'getter': function() { return NL.ISO_LIST_DELIMITER; },
			'setter': function(value) { if (value) NL.ISO_LIST_DELIMITER = value; }
		});
		this.addStrConfigProp('isoListDisallowPrefix', NL.ISO_LIST_DISALLOW_PREFIX, {
			'getter': function() { return NL.ISO_LIST_DISALLOW_PREFIX; },
			'setter': function(value) { if (value) NL.ISO_LIST_DISALLOW_PREFIX = value; }
		});
	}
});

/**
 * Text draw and font options.
 * @class
 * @augments Kekule.AbstractConfigs
 *
 * @property {String} labelFontFamily Default font family to draw labels and "+" in reaction.
 * @property {String} labelFontFamily Default font family to draw atoms and other chem nodes.
 * @property {Float} supFontSizeRatio Font size ratio for superscript.
 * @property {Float} subFontSizeRatio Font size ratio for subscript.
 * @property {Float} superscriptOverhang Percentage a superscript should rise from top text top edge.
 * @property {Float} subscriptOversink Percentage a subscript should fall below the text bottom edge.
 * @property {Int} textCharDirection Default direction of a line of characters, default value is LTR (left to right).
 * //@property {Int} textLineDirection Default direction of a set of text lines, default value is TTB (top to bottom).
 * @property {Int} textHorizontalAlign Default horizontal align of text, default value is LEADING.
 * @property {Int} textHorizontalAlign Default vertical align of text, default value is LEADING.
 * @property {Int} textBoxXAlignment Default horizontal alignment of text box to a coordinate.
 * @property {Int} textBoxYAlignment Default vertical alignment of text box to a coordinate.
 * @property {Int} textBoxAlignmentMode Default text box alignment mode.
 */
Kekule.Render.TextFontConfigs = Class.create(Kekule.AbstractConfigs,
/** @lends Kekule.Render.TextFontConfigs# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.TextFontConfigs',
	/** @private */
	DEF_LABEL_FONT_FAMILY: '',
	/** @private */
	initProperties: function()
	{
		this.addStrConfigProp('labelFontFamily', 'Arial, Helvetica, sans-serif');
		this.addStrConfigProp('atomFontFamily', 'Arial, Helvetica, sans-serif');
		this.addFloatConfigProp('supFontSizeRatio', 0.66);
		this.addFloatConfigProp('subFontSizeRatio', 0.66);
		this.addFloatConfigProp('superscriptOverhang', 0.2);
		this.addFloatConfigProp('subscriptOversink', 0.2);

		this.addIntConfigProp('textCharDirection', Kekule.Render.TextDirection.LTR, {'enumSource': Kekule.Render.TextDirection});
		//this.addIntConfigProp('textLineDirection', Kekule.Render.TextDirection.TTB);
		this.addIntConfigProp('textHorizontalAlign', Kekule.Render.TextAlign.LEADING, {'enumSource': Kekule.Render.TextAlign});
		this.addIntConfigProp('textVerticalAlign', Kekule.Render.TextAlign.LEADING, {'enumSource': Kekule.Render.TextAlign});

		// not publish
		this.addIntConfigProp('textBoxXAlignment', Kekule.Render.BoxXAlignment.LEFT, {'enumSource': Kekule.Render.BoxXAlignment, 'scope': PS.PUBLIC});
		this.addIntConfigProp('textBoxYAlignment', Kekule.Render.BoxYAlignment.TOP, {'enumSource': Kekule.Render.BoxYAlignment, 'scope': PS.PUBLIC});
		this.addIntConfigProp('textBoxAlignmentMode', Kekule.Render.TextBoxAlignmentMode.ANCHOR, {'enumSource': Kekule.Render.TextBoxAlignmentMode, 'scope': PS.PUBLIC});
	}
});

/**
 * Draw length and related options.
 * In this class, every property value should be a float based on unitLength.
 * To retrieve a value based on px, a easy way is call getActualLength(propName) method.
 * @class
 * @augments Kekule.AbstractConfigs
 *
 * @property {Float} unitLength The unit length in px. Every other length are based on this property.
 *   For instance, if a bond length is 12 and unit length is 2px, then the actual bond length will be 24px.
 * //@property {Float} labelFontSize Default font size to draw labels. For example: 12.
 * //@property {Float} atomFontSize Default font size to draw atoms and other chem nodes. For example: 12.
 * @property {Float} atomLabelBoxExpandRatio Atom label box width/height should be a little large then font size.
 *   This value is quite useful in clip bond between nodes.
 * @property {Float} chargeMarkFontSize Size of font to draw charge and radical mark.
 * @property {Float} chargeMarkMargin Gap between charge/radical mark center and node point.
 * //@property {Float} chargeMarkCircleWidth Width of circle stroke around charge mark. Not used yet.
 * @property {Float} allenCenterAtomRadius Radius of dot drawn in allen center carbon. 0 for do not draw explicit dot.
 * @property {Float} defBondLength Default length of a chem bond.
 * @property {Float} bondLineWidth Line width to draw a general bond.
 * @property {Float} boldBondLineWidthRatio Times of line width to a normal line to draw a bold bond line.
 * @property {Float} hashSpacing Spacing between small lines in hash bond line.
 * @property {Float} multipleBondSpacingRatio Spacing between two lines in double or triple bond.
 *   This value related to bond length. The actual value should be calculated when drawing.
 * @property {Float} multipleBondSpacingAbs Spacing between two lines in double or triple bond.
 *   This value is fixed (regardless of bond length).
 * @property {Float} multipleBondMaxAbsSpacing If this value is set, the max spacing between multiple bond is fixed.
 * @property {Float} bondArrowLength The length of end triangle in arrow bond.
 * @property {Float} bondArrowWidth The width of end triangle in arrow bond.
 * @property {Float} bondWedgeWidth The width of end triangle in wedge bond.
 * @property {Float} bondWedgeHashMinWidth Start a hash wedge from 0 is often make some part hard to see.
 *   So we start from a small width to make better outlooks.
 * @property {Float} bondWavyRadius Radius to draw arc of wavy bond.
 * @property {Float} glyphStrokeWidth The default width of glyph strokes.
 * @property {Float} rxnMolMargin Magin between reactants/products in reaction formula.
 * @property {Float} autofitContextPadding Padding length when draw on context with drawOptions.autofit.
 */
Kekule.Render.LengthConfigs = Class.create(Kekule.AbstractConfigs,
/** @lends Kekule.Render.LengthConfigs# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.LengthConfigs',
	/** @private */
	initProperties: function()
	{
		this.addFloatConfigProp('unitLength', 1, {'scope': PS.PUBLIC});
		this.addFloatConfigProp('labelFontSize', 14/*10*/);
		this.addFloatConfigProp('atomFontSize', 14/*10*/);
		this.addFloatConfigProp('atomLabelBoxExpandRatio', 1.2 /*1.3*/, {'scope': PS.PUBLIC});
		this.addFloatConfigProp('chargeMarkFontSize', /*7*/10);
		this.addFloatConfigProp('chargeMarkMargin', 5);
		//this.addFloatConfigProp('chargeMarkCircleWidth', 1);


		// length for chem structures
		this.addFloatConfigProp('allenCenterAtomRadius', 3);
		this.addFloatConfigProp('defBondLength', 25); // 30); //35/* 14 /* 52 */);
		this.addFloatConfigProp('bondLineWidth', 1);
		this.addFloatConfigProp('boldBondLineWidthRatio', 2, {'scope': PS.PUBLIC});
		this.addFloatConfigProp('hashSpacing', 3);
		this.addFloatConfigProp('multipleBondSpacingRatio', 0.18);
		this.addFloatConfigProp('multipleBondSpacingAbs', null, {'scope': PS.PUBLIC});
		this.addFloatConfigProp('multipleBondMaxAbsSpacing', 5);
		this.addFloatConfigProp('bondArrowLength', 6);
		this.addFloatConfigProp('bondArrowWidth', 6);
		this.addFloatConfigProp('bondWedgeWidth', 6);
		this.addFloatConfigProp('bondWedgeHashMinWidth', 2);
		this.addFloatConfigProp('bondWavyRadius', 5);
		// length for glyphs
		this.addFloatConfigProp('glyphStrokeWidth', 1);
		// length for reaction
		this.addFloatConfigProp('rxnMolMargin', 10, {'scope': PS.PUBLIC});

		// default scale ref length, should be same as the default bond length in editor configs
		this.addFloatConfigProp('defScaleRefLength', 0.8); //35/* 14 /* 52 */);

		// length for context
		this.addFloatConfigProp('autofitContextPadding', /*20*/45);
	},

	/**
	 * Get actual length in px for a config property.
	 * @param {String} propName
	 * @returns {Float}
	 */
	getActualLength: function(propName)
	{
		var v = this.getPropValue(propName);
		if ((v !== null) && (v !== undefined))
			return v * this.getUnitLength();
		else
			return null;
	}
});

/**
 * Color related options. All color values should be in '#FFFFFF' format.
 * @class
 * @augments Kekule.AbstractConfigs
 *
 * @property {Bool} useAtomSpecifiedColor Whether use different color on different atoms.
 * @property {String} labelColor Color to draw text in normal labels.
 * @property {String} atomColor Color to draw text in node labels.
 * @property {String} bondColor Color to draw connectors (espcially bonds).
 * @property {String} glyphStrokeColor Color to draw glyph strokes.
 * @property {String} glyphFillColor Color to fill glyphs.
 */
Kekule.Render.ColorConfigs = Class.create(Kekule.AbstractConfigs,
/** @lends Kekule.Render.ColorConfigs# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.ColorConfigs',
	/** @private */
	initProperties: function()
	{
		this.addBoolConfigProp('useAtomSpecifiedColor', false);
		this.addStrConfigProp('labelColor', '#000000');
		this.addStrConfigProp('atomColor', '#000000');
		this.addStrConfigProp('bondColor', '#000000');
		// color for glyphs
		this.addStrConfigProp('glyphStrokeColor', '#999999');
		this.addStrConfigProp('glyphFillColor', '#999999');
	}
});

/**
 * Config class of 3D renderer.
 * @class
 * @augments Kekule.AbstractConfigs
 *
 * @property {Kekule.Render.GeneralConfigs} generalConfigs
 * @property {Kekule.Render.Render3DEnvironmentConfigs} environmentConfigs
 * @property {Kekule.Render.Molecule3DDisplayConfigs} moleculeDisplayConfigs
 * @property {Kekule.Render.Model3DConfigs} modelConfigs
 * @property {Kekule.Render.Length3DConfigs} lengthConfigs
 */
Kekule.Render.Render3DConfigs = Class.create(Kekule.AbstractConfigs,
/** @lends Kekule.Render.Render3DConfigs# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.Render3DConfigs',

	/** @private */
	initProperties: function()
	{
		this.addConfigProp('generalConfigs', 'Kekule.Render.GeneralConfigs');
		this.addConfigProp('moleculeDisplayConfigs', 'Kekule.Render.Molecule3DDisplayConfigs');
		this.addConfigProp('lengthConfigs', 'Kekule.Render.Length3DConfigs');
		this.addConfigProp('environmentConfigs', 'Kekule.Render.Render3DEnvironmentConfigs');
		this.addConfigProp('modelConfigs', 'Kekule.Render.Model3DConfigs');
	},
	/** @private */
	initPropValues: function($super)
	{
		$super();
		this.setPropStoreFieldValue('generalConfigs', new Kekule.Render.GeneralConfigs());
		this.setPropStoreFieldValue('environmentConfigs', new Kekule.Render.Render3DEnvironmentConfigs());
		this.setPropStoreFieldValue('moleculeDisplayConfigs', new Kekule.Render.Molecule3DDisplayConfigs());
		this.setPropStoreFieldValue('modelConfigs', new Kekule.Render.Model3DConfigs());
		this.setPropStoreFieldValue('lengthConfigs', new Kekule.Render.Length3DConfigs());
	}
});
Kekule.ClassUtils.makeSingleton(Kekule.Render.Render3DConfigs);

/**
 * Get a singleton instance of {@link Kekule.Render.Render3DConfigs}.
 * @function
 * @returns {Kekule.Render.RenderConfigs}
 */
Kekule.Render.getRender3DConfigs = function()
{
	return Kekule.Render.Render3DConfigs.getInstance();
};

/**
 * Options of 3D environment (especially 3D render bridge).
 * @class
 * @augments Kekule.AbstractConfigs
 *
 * @property {Int} graphicQuality Value from {@link Kekule.Render.Render3DGraphicQuality}.
 */
Kekule.Render.Render3DEnvironmentConfigs = Class.create(Kekule.AbstractConfigs,
/** @lends Kekule.Render.Render3DEnvironmentConfigs# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.Render3DEnvironmentConfigs',
	/** @private */
	initProperties: function()
	{
		this.addIntConfigProp('graphicQuality', Kekule.Render.Render3DGraphicQuality.MEDIUM, {'enumSource': Kekule.Render.Render3DGraphicQuality});
	}
});

/**
 * Options to display a 3D molecule structure.
 * @class
 * @augments Kekule.AbstractConfigs
 *
 * @property {Int} defMoleculeDisplayType Value from {@link Kekule.Render.Molecule3DDisplayType}.
 * @property {Int} defBondSpliceMode Value from {@link Kekule.Render.Bond3DSpliceMode}.
 * @property {Bool} defDisplayMultipleBond Whether use multilines to display miltiple bond.
 * @property {String} defBondColor Default color for bond.
 * @property {String} defAtomColor Default color for atom and other nodes.
 * @property {Bool} useAtomSpecifiedColor Whether use different color on different atoms.
 */
Kekule.Render.Molecule3DDisplayConfigs = Class.create(Kekule.AbstractConfigs,
/** @lends Kekule.Render.Molecule3DDisplayConfigs# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.Molecule3DDisplayConfigs',
	/** @private */
	initProperties: function()
	{
		this.addIntConfigProp('defMoleculeDisplayType', Kekule.Render.Molecule3DDisplayType.BALL_STICK, {'enumSource': Kekule.Render.Molecule3DDisplayType});
		this.addIntConfigProp('defBondSpliceMode', Kekule.Render.Bond3DSpliceMode.WEIGHTING_SPLIT, {'enumSource': Kekule.Render.Bond3DSpliceMode});
		this.addBoolConfigProp('defDisplayMultipleBond', true);
		this.addStrConfigProp('defBondColor', '#FFFFFF');
		this.addStrConfigProp('defAtomColor', '#000099');
		this.addBoolConfigProp('useAtomSpecifiedColor', true);
	}
});

/**
 * Options to render a 3D molecule model.
 * @class
 * @augments Kekule.AbstractConfigs
 *
 * @property {Bool} useVdWRadius Whether use atom's von dar Waals radius to draw 3D model.
 *   Otherwise a fixed radius will be used.
 * @property {Bool} showNodeLabel Whether show node / atom label text in 3D model. Not used now.
 * @property {Bool} hideHydrogens Whether hide all hydrogen atoms in 3D model.
 * @property {Float} nodeRadiusRatio
 * @property {Float} connectorResizeRatio
 * @property {Float} multiConnectorRadiusRatio
 *   If use multi-cylinder for multibond, this value is the radius ratio between multi and single bond.
 * @property {Float} multiConnectorMarginRatio
 *   If mutilline or multicylinder is used for connector, value of margin / radius.
 */
Kekule.Render.Model3DConfigs = Class.create(Kekule.AbstractConfigs,
/** @lends Kekule.Render.Model3DConfigs# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.Model3DConfigs',
	/** @private */
	initProperties: function()
	{
		this.addBoolConfigProp('showNodeLabel', true, {'scope': PS.PUBLIC}); // not used now
		this.addBoolConfigProp('hideHydrogens', false);
		this.addBoolConfigProp('useVdWRadius', true);
		this.addFloatConfigProp('nodeRadiusRatio', 0.25, {'scope': PS.PUBLIC});
		this.addFloatConfigProp('connectorRadiusRatio', 0.25, {'scope': PS.PUBLIC});
		this.addFloatConfigProp('multiConnectorRadiusRatio', 0.5);
		this.addFloatConfigProp('multiConnectorMarginRatio', 1);
	}
});

/**
 * Draw length and related options in 3D mode.
 * In this class, every property value should be a float based on unitLength.
 * To retrieve a value based on px, a easy way is call getActualLength(propName) method.
 * @class
 * @augments Kekule.AbstractConfigs
 *
 * @property {Float} unitLength The unit length in px. Every other length are based on this property.
 *   For instance, if a bond length is 12 and unit length is 2px, then the actual bond length will be 24px.
 * @property {Float} fixedNodeRadius If vdW radius not used, this value is used for all atom's radius.
 * @property {Float} connectorRadius Connectors will be draw based on this radius in stick or ball_stick mode.
 * @property {Float} connectorLineWidth Connectors will be draw on this width in wire mode.
 * @property {Float} defBondLength Approximate length of bond defaultly (in autoScale mode).
 */
Kekule.Render.Length3DConfigs = Class.create(Kekule.AbstractConfigs,
/** @lends Kekule.Render.Length3DConfigs# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.Length3DConfigs',
	/** @private */
	initProperties: function()
	{
		this.addFloatConfigProp('unitLength', 1, {'scope': PS.PUBLIC});
		this.addFloatConfigProp('fixedNodeRadius', 1.7);  // same as radius of C
		this.addFloatConfigProp('connectorRadius', 0.6);  // vdW radius of H
		this.addFloatConfigProp('connectorLineWidth', 2);  // width of bond line in wire mode
		this.addFloatConfigProp('defBondLength', /* 14 */ 100, {'scope': PS.PUBLIC});  // approximate length of bond defaultly (in autoScale)
	},
		/**
	 * Get actual length in px for a config property.
	 * @param {String} propName
	 * @returns {Float}
	 */
	getActualLength: function(propName)
	{
		var v = this.getPropValue(propName);
		if ((v !== null) && (v !== undefined))
			return v * this.getUnitLength();
		else
			return null;
	}
});

})();
