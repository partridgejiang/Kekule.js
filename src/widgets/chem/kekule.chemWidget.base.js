/**
 * @fileoverview
 * Chem widget is widget related with chem tasks, such as chem object view/editor.
 * @author Partridge Jiang
 */

/*
 * requires /widgets/kekule.widget.base.js
 */

/**
 * Namespace for chem widgets.
 * @type {namespace}
 */
Kekule.ChemWidget = {};

/*
 * Base class of all chem widgets. Actually a alias of Kekule.Widget.BaseWidget.
 * @class
 */
Kekule.ChemWidget.AbstractWidget = Kekule.Widget.BaseWidget;

/**
 * Enumeration of names to create tool buttons and other child components in chem viewer and editor.
 * @class
 */
Kekule.ChemWidget.ComponentWidgetNames =
{
	newDoc: 'newDoc',
	loadFile: 'loadFile',
	loadData: 'loadData',
	saveFile: 'saveFile',
	zoomIn: 'zoomIn',
	zoomOut: 'zoomOut',
	rotateRight: 'rotateRight',
	rotateLeft: 'rotateLeft',
	rotateX: 'rotateX',
	rotateY: 'rotateY',
	rotateZ: 'rotateZ',
	reset: 'reset',
	molDisplayType: 'molDisplayType',
	molHideHydrogens: 'molHideHydrogens',
	openEditor: 'openEditor',
	config: 'config',

	objInspector: 'objInspector',
	undo: 'undo',
	redo: 'redo',
	copy: 'copy',
	cut: 'cut',
	paste: 'paste',
	cloneSelection: 'cloneSelection',
	erase: 'erase',
	manipulate: 'manipulate',
	molBond: 'bond',
	molAtom: 'atom',
	molFormula: 'formula',
	molCharge: 'charge',
	textBlock: 'textBlock',
	molRing: 'ring',
	glyph: 'glyph',

	fontName: 'fontName',
	fontSize: 'fontSize',
	color: 'color',
	textDirection: 'textDirection',
	textAlign: 'textAlign'
};

/** @ignore */
Kekule.ChemWidget.HtmlClassNames = {
	PREFIX: 'K-Chem-',
	INNER_TOOLBAR: 'K-Chem-InnerToolbar'
};