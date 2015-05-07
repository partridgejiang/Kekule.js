/**
 * @fileoverview
 * A file to store string constants for widgets in English.
 * @author Partridge Jiang
 */

/** @ignore */
Kekule.LOCAL_RES = true;

/* @ignore */
//Kekule.WidgetTexts = {};
/** @ignore */
//Kekule.WidgetTexts.en = {
Kekule.Localization.addResource('zh', 'WidgetTexts', {
	// Dialog
	CAPTION_OK: '确定',
	CAPTION_CANCEL: '取消',
	CAPTION_YES: '是',
	CAPTION_NO: '否',
	CAPTION_BROWSE_COLOR: '浏览颜色',
	HINT_BROWSE_COLOR: '浏览更多颜色',

	S_COLOR_UNSET: '(未设置)',
	S_COLOR_DEFAULT: '(缺省值)',
	S_COLOR_MIXED: '(多个值)',

	S_OBJECT_UNSET: '(无)',

	// property editors
	S_ITEMS: '项目',
	S_OBJECT: '对象',
	S_VALUE_UNSET: '(未设置)',

	// Object inspector
	S_INSPECT_NONE: '(无)',
	S_INSPECT_OBJECTS: '({0}个对象)',
	S_INSPECT_ID_OBJECT: '{0}: {1}',
	S_INSPECT_ANONYMOUS_OBJECT: '({0})',

	CAPTION_TOGGLE_TEXTWRAP: '切换文本换行',
	CAPTION_INC_TEXT_SIZE: '增大字号',
	CAPTION_DEC_TEXT_SIZE: '减小字号',
	HINT_TOGGLE_TEXTWRAP: '切换文本是否自动换行',
	HINT_INC_TEXT_SIZE: '增大字号',
	HINT_DEC_TEXT_SIZE: '减小字号',
	HINT_CHOOSE_FONT_FAMILY: '选择字体',

	// widget grid
	CAPTION_ADD_CELL: '+',
	HINT_ADD_CELL: '添加新单元格',
	CAPTION_REMOVE_CELL: '移除',
	HINT_REMOVE_CELL: '移除单元格',

	// configurator
	CAPTION_CONFIG: '设置…',
	HINT_CONFIG: '修改设置'
});

/* @ignore */
//Kekule.ChemWidgetTexts = {};
/** @ignore */
// Predefined strings for chem widgets.
//Kekule.ChemWidgetTexts.en = {
Kekule.Localization.addResource('zh', 'ChemWidgetTexts', {
	// ChemDisplayer / ChemViewer
	CAPTION_LOADFILE: 'Load...',
	CAPTION_LOADDATA: 'Load...',
	CAPTION_SAVEFILE: 'Save...',
	CAPTION_ZOOMIN: 'Zoom In',
	CAPTION_ZOOMOUT: 'Zoom Out',
	CAPTION_RESETZOOM: 'Reset Zoom',
	CAPTION_RESETVIEW: 'Reset',
	CAPTION_ROTATELEFT: 'Left Rotate',
	CAPTION_ROTATERIGHT: 'Right Rotate',
	CAPTION_ROTATEX: 'X Rotate',
	CAPTION_ROTATEY: 'Y Rotate',
	CAPTION_ROTATEZ: 'Z Rotate',
	CAPTION_MOL_DISPLAY_TYPE: 'Molecule display style',
	CAPTION_SKELETAL: 'Skeletal',
	CAPTION_CONDENSED: 'Condensed',
	CAPTION_WIRE: 'Wire Frame',
	CAPTION_STICKS: 'Sticks',
	CAPTION_BALLSTICK: 'Ball Stick',
	CAPTION_SPACEFILL: 'Space Fill',
	CAPTION_HIDEHYDROGENS: 'Show/hide hydrogens',
	CAPTION_OPENEDITOR: 'Edit...',

	CAPTION_EDIT_OBJ: 'Edit',

	HINT_LOADFILE: 'Load from file',
	HINT_LOADDATA: 'Load data',
	HINT_SAVEFILE: 'Save to file',
	HINT_ZOOMIN: 'Zoom in',
	HINT_ZOOMOUT: 'Zoom out',
	HINT_RESETZOOM: 'Reset zoom',
	HINT_RESETVIEW: 'Reset zoom and rotation',
	HINT_ROTATELEFT: 'Rotate in anticlockwise direction',
	HINT_ROTATERIGHT: 'Rotate in clockwise direction',
	HINT_ROTATEX: 'Rotate around X axis',
	HINT_ROTATEY: 'Rotate around Y axis',
	HINT_ROTATEZ: 'Rotate around Z axis',
	HINT_MOL_DISPLAY_TYPE: 'Change molecule display style',
	HINT_SKELETAL: 'Show molecule in skeletal style',
	HINT_CONDENSED: 'Show molecule in condensed style',
	HINT_WIRE: 'Show molecule in wire frame style',
	HINT_STICKS: 'Show molecule in sticks style',
	HINT_BALLSTICK: 'Show molecule in ball-stick style',
	HINT_SPACEFILL: 'Show molecule in space-fill style',
	HINT_HIDEHYDROGENS: 'Show/hide hydrogen atoms in model',
	HINT_OPENEDITOR: 'Open an editor to modify displayed object',

	// chem editor
	CAPTION_NEWDOC: 'New',
	CAPTION_UNDO: 'Undo',
	CAPTION_REDO: 'Redo',
	CAPTION_COPY: 'Copy',
	CAPTION_CUT: 'Cut',
	CAPTION_PASTE: 'Paste',
	CAPTION_CLONE_SELECTION: 'Clone selection',
	CAPTION_TOGGLE_INSPECTOR: 'Object inspector',
	CAPTION_MANIPULATE: 'Select',
	CAPTION_ERASE: 'Erase',
	CAPTION_MOL_BOND: 'Bond',
	CAPTION_MOL_BOND_SINGLE: 'Single bond',
	CAPTION_MOL_BOND_DOUBLE: 'Double bond',
	CAPTION_MOL_BOND_TRIPLE: 'Triple bond',
	CAPTION_MOL_BOND_WEDGEUP: 'Wedge up bond',
	CAPTION_MOL_BOND_WEDGEDOWN: 'Wedge down bond',
	CAPTION_MOL_BOND_CLOSER: 'Outer bond',
	CAPTION_MOL_BOND_WAVY: 'Wavy bond',
	CAPTION_MOL_BOND_DOUBLE_EITHER: 'Double Either bond',
	CAPTION_MOL_ATOM: 'Atom',
	CAPTION_MOL_FORMULA: 'Formula',
	CAPTION_MOL_CHARGE: 'Charge',
	CAPTION_MOL_CHARGE_CLEAR: 'Charge clear',
	CAPTION_MOL_CHARGE_POSITIVE: 'Positive charge',
	CAPTION_MOL_CHARGE_NEGATIVE: 'Negative charge',
	CAPTION_MOL_CHARGE_SINGLET: 'Singlet radical',
	CAPTION_MOL_CHARGE_DOUBLET: 'Doublet radical',
	CAPTION_MOL_CHARGE_TRIPLET: 'Triplet radical',
	CAPTION_TEXT_BLOCK: 'Text Block',

	CAPTION_REPOSITORY_RING: 'Rings',
	CAPTION_REPOSITORY_RING_3: 'Cyclopropane',
	CAPTION_REPOSITORY_RING_4: 'Cyclobutane',
	CAPTION_REPOSITORY_RING_5: 'Cyclopentane',
	CAPTION_REPOSITORY_RING_6: 'Cyclohexane',
	CAPTION_REPOSITORY_RING_7: 'Cycloheptane',
	CAPTION_REPOSITORY_RING_8: 'Cyclooctane',
	CAPTION_REPOSITORY_RING_AR_6: 'Benzene',
	CAPTION_REPOSITORY_RING_AR_5: 'Cyclopentadiene',

	CAPTION_REPOSITORY_ARROWLINE: 'Arrows & lines',
	CAPTION_REPOSITORY_GLYPH: 'Glyphs',
	CAPTION_REPOSITORY_GLYPH_LINE: 'Line',
	CAPTION_REPOSITORY_GLYPH_OPEN_ARROW_LINE: 'Open arrow line',
	CAPTION_REPOSITORY_GLYPH_TRIANGLE_ARROW_LINE: 'Triangle arrow line',
	CAPTION_REPOSITORY_GLYPH_DI_OPEN_ARROW_LINE: 'Bidirectional open arrow line',
	CAPTION_REPOSITORY_GLYPH_DI_TRIANGLE_ARROW_LINE: 'Bidirectional triangle arrow line',
	CAPTION_REPOSITORY_GLYPH_REV_ARROW_LINE: 'Reversible arrow line',
	CAPTION_REPOSITORY_GLYPH_OPEN_ARROW_DILINE: 'Open arrow double line',

	CAPTION_REPOSITORY_HEAT_SYMBOL: 'Heat symbol',
	CAPTION_REPOSITORY_ADD_SYMBOL: 'Add symbol',

	CAPTION_PICK_COLOR: 'Color',
	CAPTION_TEXT_DIRECTION: 'Text direction',
	CAPTION_TEXT_DIRECTION_DEFAULT: 'Default',
	CAPTION_TEXT_DIRECTION_LTR: 'Left to right',
	CAPTION_TEXT_DIRECTION_RTL: 'Right to left',
	CAPTION_TEXT_DIRECTION_TTB: 'Top to bottom',
	CAPTION_TEXT_DIRECTION_BTT: 'Bottom to top',

	CAPTION_TEXT_HORIZONTAL_ALIGN: 'Text horizontal alignment',
	CAPTION_TEXT_VERTICAL_ALIGN: 'Text vertical alignment',
	CAPTION_TEXT_ALIGN_DEFAULT: 'Default',
	CAPTION_TEXT_ALIGN_LEADING: 'Leading',
	CAPTION_TEXT_ALIGN_TRAILING: 'Trailing',
	CAPTION_TEXT_ALIGN_CENTER: 'Center',
	CAPTION_TEXT_ALIGN_LEFT: 'Left',
	CAPTION_TEXT_ALIGN_RIGHT: 'Right',
	CAPTION_TEXT_ALIGN_TOP: 'Top',
	CAPTION_TEXT_ALIGN_BOTTOM: 'Bottom',

	HINT_NEWDOC: 'Create new document',
	HINT_UNDO: 'Undo',
	HINT_REDO: 'Redo',
	HINT_COPY: 'Copy selection to internal clipboard',
	HINT_CUT: 'Cut selection to internal clipboard',
	HINT_PASTE: 'Paste from internal clipboard',
	HINT_CLONE_SELECTION: 'Clone selection',
	HINT_TOGGLE_INSPECTOR: 'Show or hide object inspector panel',
	HINT_MANIPULATE: 'Select tool',
	HINT_ERASE: 'Erase tool',
	HINT_MOL_BOND: 'Bond tool',
	HINT_MOL_BOND_SINGLE: 'Single bond',
	HINT_MOL_BOND_DOUBLE: 'Double bond',
	HINT_MOL_BOND_TRIPLE: 'Triple bond',
	HINT_MOL_BOND_WEDGEUP: 'Wedge up bond',
	HINT_MOL_BOND_WEDGEDOWN: 'Wedge down bond',
	HINT_MOL_BOND_CLOSER: 'Outer bond',
	HINT_MOL_BOND_WAVY: 'Wavy bond',
	HINT_MOL_BOND_DOUBLE_EITHER: 'Double Either bond',
	HINT_MOL_ATOM: 'Atom tool',
	HINT_MOL_FORMULA: 'Formula tool',
	HINT_MOL_CHARGE: 'Charge tool',
	HINT_MOL_CHARGE_CLEAR: 'Clear charge and radical',
	HINT_MOL_CHARGE_POSITIVE: 'Positive charge',
	HINT_MOL_CHARGE_NEGATIVE: 'Negative charge',
	HINT_MOL_CHARGE_SINGLET: 'Singlet radical',
	HINT_MOL_CHARGE_DOUBLET: 'Doublet radical',
	HINT_MOL_CHARGE_TRIPLET: 'Triplet radical',
	HINT_TEXT_BLOCK: 'Text Block tool',

	HINT_REPOSITORY_RING: 'Ring structures',
	HINT_REPOSITORY_RING_3: 'Cyclopropane',
	HINT_REPOSITORY_RING_4: 'Cyclobutane',
	HINT_REPOSITORY_RING_5: 'Cyclopentane',
	HINT_REPOSITORY_RING_6: 'Cyclohexane',
	HINT_REPOSITORY_RING_7: 'Cycloheptane',
	HINT_REPOSITORY_RING_8: 'Cyclooctane',
	HINT_REPOSITORY_RING_AR_6: 'Benzene',
	HINT_REPOSITORY_RING_AR_5: 'Cyclopentadiene',

	HINT_REPOSITORY_ARROWLINE: 'Arrows and lines',
	HINT_REPOSITORY_GLYPH: 'Glyphs',
	HINT_REPOSITORY_GLYPH_LINE: 'Line',
	HINT_REPOSITORY_GLYPH_OPEN_ARROW_LINE: 'Open arrow line',
	HINT_REPOSITORY_GLYPH_TRIANGLE_ARROW_LINE: 'Triangle arrow line',
	HINT_REPOSITORY_GLYPH_DI_OPEN_ARROW_LINE: 'Bidirectional open arrow line',
	HINT_REPOSITORY_GLYPH_DI_TRIANGLE_ARROW_LINE: 'Bidirectional triangle arrow line',
	HINT_REPOSITORY_GLYPH_REV_ARROW_LINE: 'Reversible arrow line',
	HINT_REPOSITORY_GLYPH_OPEN_ARROW_DILINE: 'Open arrow double line',
	HINT_REPOSITORY_HEAT_SYMBOL: 'Heat symbol',
	HINT_REPOSITORY_ADD_SYMBOL: 'Add symbol',

	HINT_FONTNAME: 'Set font name',
	HINT_FONTSIZE: 'Set font size',
	HINT_PICK_COLOR: 'Select color',
	HINT_TEXT_DIRECTION: 'Set text direction',
	HINT_TEXT_HORIZONTAL_ALIGN: 'Set text horizontal alignment',
	HINT_TEXT_VERTICAL_ALIGN: 'Set text vertical alignment',

	// load data dialog
	CAPTION_LOADDATA: 'Load data',
	CAPTION_DATA_FORMAT: 'Data format:',
	CAPTION_DATA_SRC: 'Input or paste data below:',
	CAPTION_LOADDATA_FROM_FILE: 'Load from file',

	// Choose file format dialog
	CAPTION_CHOOSEFILEFORMAT: 'Choose file format',
	CAPTION_SELECT_FORMAT: 'Select format:',
	CAPTION_PREVIEW_FILE_CONTENT: 'Preview: ',

	// file name
	S_DEF_SAVE_FILENAME: 'Unnamed',

	// Atom edit list
	CAPTION_ATOMLIST_PERIODIC_TABLE: 'more...',
	CAPTION_RGROUP: 'Sub group',
	CAPTION_VARIABLE_ATOM: 'Variable Atom (list)',
	CAPTION_VARIABLE_NOT_ATOM: 'Variable Atom (not list)',
	CAPTION_PSEUDOATOM: 'Pseudoatom',
	CAPTION_DUMMY_ATOM: 'Dummy Atom',
	CAPTION_HETERO_ATOM: 'Hetero Atom',
	CAPTION_ANY_ATOM: 'Any Atom',

	// Periodic table dialog in editor
	CAPTION_PERIODIC_TABLE_DIALOG: 'Periodic table',
	CAPTION_PERIODIC_TABLE_DIALOG_SEL_ELEM: 'Select element',
	CAPTION_PERIODIC_TABLE_DIALOG_SEL_ELEMS: 'Select elements',

	// Text block editor
	CAPTION_TEXTBLOCK_INIT: 'Enter text here',

	// Periodic table
	LEGEND_CAPTION: 'Legend',
	LEGEND_ELEM_SYMBOL: 'Symbol',
	LEGEND_ELEM_NAME: 'name',
	LEGEND_ATOMIC_NUM: 'atomic number',
	LEGEND_ATOMIC_WEIGHT: 'atomic weight',

	// misc
	S_VALUE_DEFAULT: '(Default)'
});

// error messages
//Object.extend(Kekule.ErrorMsg.en, {
Kekule.Localization.addResource('en', 'ErrorMsg', {
	WIDGET_CAN_NOT_BIND_TO_ELEM: 'Widget {0} can not be binded to element <{1}>',
	LOAD_CHEMDATA_FAILED: 'Failed to load data',
	FILE_API_NOT_SUPPORTED: 'File operations are not supported by your current web browser. Please update it.',
	DRAW_BRIDGE_NOT_SUPPORTED: 'It seems that your web browser is not modern enough to support the drawing function.Please update it.',

	// widget/operations/kekule.operations.js
	COMMAND_NOT_REVERSIBLE: 'Command can not be undone',

	// editor operations
	CAN_NOT_SET_COORD_OF_CLASS: 'Can not set coordinate of instance of {0}.',
	CAN_NOT_SET_DIMENSION_OF_CLASS: 'Can not set dimension of instance of {0}.',
	/*
	CAN_NOT_MERGE_CONNECTOR_WITH_DIFF_NODECOUNT: 'Can not merge connectors with different number of connected objects.',
	CAN_NOT_MERGE_CONNECTOR_WITH_NODECOUNT_NOT_TWO: 'Can not merge connectors connected with more than 2 objects.',
	CAN_NOT_MERGE_CONNECTOR_CONNECTED_WITH_CONNECTOR: 'Can not merge a connector connected with another connector.'
	*/
	CAN_NOT_MERGE_CONNECTORS: 'Specified connectors can not be merged.',

	NOT_A_VALID_ATOM: 'Not a valid atom'
});
