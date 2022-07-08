/**
 * @fileoverview
 * A file to store string constants in English.
 * @author Partridge Jiang
 */

/** @ignore */
Kekule.LOCAL_RES = true;

Kekule.Localization.setCurrModule('general');

/* @ignore */
//Kekule.Texts = {};

// String constants
/** @ignore */
//Kekule.Texts.en = {
Kekule.Localization.addResource('en', 'Texts', {
	UNNAMED: 'unnamed'
});

/* @ignore */
//Kekule.ErrorMsg = {};

// Exception and error messages
/** @ignore */
//Kekule.ErrorMsg.en = {
Kekule.Localization.addResource('en', 'ErrorMsg', {
	MODULE_NOT_LOADED: 'Module {0} is not loaded',

	// core/kekule.metrics.js
	UNIT_NOT_FOUND: 'Unit not found: {0}',
	STANDARD_UNIT_OF_CATEGORY_NOT_FOUND: 'Standard unit of category {0} not found',
	UNABLE_TO_CONVERT_BETWEEN_UNITS: 'Unable to convert between units {0} and {1}',

	// utils/kekule.utils.js
	NON_OWN_PROPERTY_CANNOT_BE_REPLACED: 'Only directly owned property of object can be replaced',
	// utils/kekule.domHelper.js
	EMPTY_DOC: 'Document is empty',
	ELEMENT_NOTSET: 'Element not set',
	// html/kekule.predefinedResLoaders.js
	EMPTY_RESURI: 'Resource URI is empty',
	CANNOT_LOAD_RES_OF_URI: 'Can not load resource of URI: ',

	// core/kekule.common.js
	LIST_ITEM_CLASS_MISMATCH: 'Mismatched item class, can not add to list',
	CANNOT_CLEAR_WEAKMAP: 'Can not clear a weak map',
	CANNOT_GET_KEY_LIST_IN_WEAKMAP: 'Can not get key array from a weak map',
	CANNOT_GET_VALUE_LIST_IN_WEAKMAP: 'Can not get value array from a weak map',

	// core/kekule.elements.js
	INVALID_CHEMELEMENT: 'Invalid chemical element',
	INVALID_ISOTOPE: 'Invalid isotope',

	// core/kekule.structures.js
	COORD_STICK_NOT_ALLOWED_ON_CLASS: 'Coordinate sticking is not allowed in this type of object',
	INVALID_STICK_TARGET_OBJ: 'Invalid sticking target',
	UNABLE_TO_STICK_TO_OTHER_OWNER_OBJ: 'Unable to stick to object with a different owner',
	UNABLE_TO_STICK_TO_OBJ_WITHOUT_ABS_COORD: 'Unable to stick to object without absolute coordinates',
	STICK_RECURSION_NOT_ALLOWED: 'Stick recursion is not allowed',
	UNABLE_ADD_MISTYPED_NODE: 'Unable to link mistyped node to connector',
	UNABLE_ADD_DIFF_OWNER_OBJ: 'Object with different owner can not be linked to connector',
	CHEMSTRUCTUREOBJECTGROUP_ITEMCLASS_MISMATCH: 'Mismatched group item class',
	SORT_FUNC_UNSET: 'Sort function is not set',
	SOURCE_FRAGMENT_NOT_SET: 'Source structure fragment not set',

	// core/kekule.reactions.js
	UNABLE_ADD_NONMOLECULE_MAP: 'Unable to add non-molecule to reactants or products',

	// algorithm/kekule.structures.helpers.js
	CANNOT_ADD_NON_NODE_NOR_CONNECTOR_TO_STRUCT_CONTAINER: 'Can not add object other than node or connector to structure object container',

	// algorithm/kekule.structures.canonicalizers.js
	REGISTERED_CANONICALIZATION_EXECUTOR_NOT_FOUND: 'Can not find registered canonicalization executor',

	// html/kekule.nativeServices.js
	ERROR_LOADING_FILE: 'Error loading file: ',

	// io/kekule.io.js
	READER_ID_ALREADY_EXISTS: 'Can not register reader: id already exists',
	WRITER_ID_ALREADY_EXISTS: 'Can not register writer: id already exists',
	FAIL_TO_READ_FORMAT: 'Fail to load data of format: ',
	NO_SUITABLE_READER_FOR_FORMAT: 'Can not read data of format: ',
	NO_SUITABLE_READER_FOR_MIMETYPE: 'Can not read data of MIME type: ',
	NO_SUITABLE_READER_FOR_FILEEXT: 'Can not read data of file extension: ',
	NO_SUITABLE_WRITER_FOR_FORMAT: 'Can not write data of format: ',
	NO_SUITABLE_WRITER_FOR_MIMETYPE: 'Can not write data of MIME type: ',
	NO_SUITABLE_WRITER_FOR_FILEEXT: 'Can not write data of file extension: ',
	AJAX_FILELOADER_NOT_FOUND: 'AJAX file loader not found, can not load URL',
	FAIL_TO_LOAD_FILE_URL: 'Fail to load file of URL: ',

	// io/cml/kekule.io.cml.js
	CML_ELEM_READER_NOT_FOUND: 'Reader for element <{0}> not found',
	ATOMID_NOT_EXISTS: 'Atom id not exists: ',
	BONDID_NOT_EXISTS: 'Bond id not exists: ',
	CML_ELEM_WRITER_TYPE_INPROPER: '{0} is not a proper CML element writer for {1}',
	CML_CAN_NOT_OUTPUT_TO_EMPTY_ELEMENT: 'Can not output content to empty element',
	UNABLE_TO_OUTPUT_AS_CML: 'Unable to output object <{0}> to CML data',

	// io/mdl/kekule.io.mdlBase.js
	MDL_CTAB_ATOM_CANNOT_CREATE: 'Can not create atom from source MDL format data',
	MDL_CTAB_BOND_CANNOT_CREATE: 'Can not create bond from source MDL format data',
	CAN_NOT_WRITE_NON_MOLECULE_TO_MOL: 'Object is not a molecule and can not be output to connection table',
	MOLECULE_HAS_NO_CTAB_TO_OUTPUT: 'Molecule has no connection table and can not be output to MDL format',

	// io/mdl/kekule.io.mdl2000.js
	NOT_MDL2000_FORMAT_DATA: 'Data format wrong: not MDL 2000',
	NOT_MDL_RXN_DATA: 'Not MDL Reaction(RXN) data',

	// io/mdl/kekule.io.mdl3000.js
	MALFORMED_MDL3000_COUNTLINE: 'Malformed MDL 3000 count line',
	MDL3000_ATOMBLOCK_NOT_FOUND: 'Atom block not found, malformed MDL 3000 data?',

	// io/mdl/kekule.io.mdlIO.js
	NOT_MDL_FORMAT_DATA: 'Data format wrong: not MDL 2000 or 3000',
	NOT_MDL2000_RXN_DATA: 'Not MDL RXN 2000 data',
	NOT_MDL3000_RXN_DATA: 'Not MDL RXN 3000 data',
	NOT_MDL3000_RXN_COUNTLINE: 'Error in reading RXN 3000 count line',
	MDL_OUTPUT_DATATYPE_NOT_TEXT: 'MDL data can not be output to non text format',
	MDL_INPUT_DATATYPE_NOT_TEXT: 'Non text format is not a legal MDL source data',
	UNABLE_TO_OUTPUT_AS_MDL: 'Unable to output object <{0}> to MDL data',

	// io/native/kekule.io.native.js
	KCJ_INPUT_DATATYPE_NOT_JSON_OR_TEXT: 'Non text or JSON format data is not a legal KCJ source',
	KCJ_OUTPUT_DATATYPE_NOT_JSON_OR_TEXT: 'Can not output as non text or JSON data',
	KCX_INPUT_DATATYPE_NOT_DOM_OR_TEXT: 'Non text or DOM data is not a legal KCX source',
	KCX_OUTPUT_DATATYPE_NOT_DOM_OR_TEXT: 'Can not output as non text or DOM data',
	JSON_SERIALIZER_NOT_EXISTS: 'Serializer for JSON not exists',
	XML_SERIALIZER_NOT_EXISTS: 'Serializer for XML not exists',

	// io/jcamp/kekule.io.jcamp.base.js
	JCAMP_DATA_WITHOUT_TITLE_LINE: 'Malformed JCAMP format data, not started with TITLE label',
	JCAMP_OTHER_LABEL_BEFORE_TITLE_LINE: 'Malformed JCAMP format data, other labels before the TITLE label',
	JCAMP_MORE_THAN_ONE_ROOT_BLOCK: 'Malformed JCAMP format data, root block not unique',
	JCAMP_MORE_THAN_TWO_NEST_LEVEL: 'Malformed JCAMP format data, block nested level should not exceed 2',
	JCAMP_ASDF_FORMAT_ERROR_WITH_STR: 'Malformed JCAMP ASDF String: {0}',
	JCAMP_DATA_TABLE_X_VALUE_CHECK_ERROR: 'JCAMP data table X value check failed!',
	JCAMP_DATA_TABLE_Y_VALUE_CHECK_ERROR: 'JCAMP data table Y value check failed!',
	JCAMP_DATA_TABLE_VALUE_FIRST_LAST_NOT_MATCH: 'JCAMP data table first/last values not match',
	JCAMP_DATA_TABLE_VAR_LIST_FORMAT_ERROR: 'Malformed JCAMP variable list format: {0}',
	JCAMP_DATA_TABLE_VAR_LIST_FORMAT_UNSUPPORTED: 'Unsupported JCAMP variable list format: {0}',
	JCAMP_NTUPLES_BEGIN_END_NAME_NOT_MATCH: 'Ntuples name not match in begin/end labels: {0} and {1}',
	JCAMP_NTUPLES_PAGE_DECLARATION_FORMAT_ERROR: 'Malformed JCAMP ntuples page declaration: {0}',
	// io/jcamp/kekule.io.jcamp.dx.js
	JCAMP_LDR_TARGET_UNIT_NOT_MATCH_WITH_DETAIL: 'The unit of property {0} ({1}) can not be converted to the request one ({2}) for JCAMP {3} LDR',
	FAILED_TO_ASSIGN_SYMBOL_TO_VARIABLE: 'Fail to assign a symbol to variable {0}',
	// io/jcamp/kekule.io.jcamp.cs.js
	JCAMP_IMPLICIT_HYDROGEN_COUNT_NOT_MATCH_DETAIL: 'Unmatched implicit hydrogen count for atom {0}({1}), expect {2} but found {3}',
	// spectroscopy/kekule.spectrum.render.js
	VISIBLE_DATA_RANGE_IS_EMPTY: 'The visible range of data is empty, unable to draw the spectrum',


	/*
	// render/2d/kekule.render.def2DRenderer.js
	CAN_NOT_REMOVE_INDIVIDUAL_ELEM: 'Unable to remove individual element on context',
	// render/3d/kekule.render.def3DRenderer.js
	CAN_NOT_RENDER_MOL_WITHOUT_CTAB_IN_3D: 'Can not render molecule without connection table in 3D mode',
	*/

	// render/3d/kekule.render.renderer3D.js
	INAVAILABLE_AUTOSCALE_REF_LENGTH: 'Can not determine the length for calculation of auto scale',
	// render/3d/kekule.render.renderer3D.js
	FORMULA_RENDERER_3D_NOT_AVAILABLE: '3D renderer for molecule formula is not available',

	// render/kekule.render.painter.js
	CANNOT_FIND_SUITABLE_RENDERER_FOR_OBJ: 'Can not find suitable renderer for object',

	// render/3d/kekule.render.threeRenderer.js
	/*
	LIB_THREE_JS_NOT_LOADED: 'Three.js not loaded, can not render 3D context',
	BROWSER_3D_DRAWING_NOT_SUPPORTED: 'It seems that your web browser is not modern enough to support the 3D drawing function. Please update it.',
	*/
	THREEJS_LIB_NOT_UNAVAILABLE: 'Three.js not available, try to include it through the <script> tag or import the module by Kekule.externalResourceManager.register method',
	THREEJS_DRAWING_NOT_UNAVAILABLE: 'Webgl, Canvas or SVG is not supported in this browser, please upgrade to a modern one',

	// render/2d/kekule.render.canvasRenderer.js
	CANVAS2D_NOT_UNAVAILABLE: 'Canvas is not supported in this browser, please upgrade to a modern one',
	// render/2d/kekule.render.raphaelRenderer.js
	RAPHAEL_LIB_NOT_UNAVAILABLE: 'Raphael.js not available, try to import it through the <script> tag',
	RAPHAEL_SVG_VML_UNAVAILABLE: 'SVG or VML is not supported in this browser, please upgrade to a modern one',

	// html/kekule.autoLaunchers.js
	//MIMETYPE_NOT_SET: 'MIME type not set for resource'

	// calculation/kekule.calc.base.js
	CALC_TERMINATED_BY_USER: 'Calculation terminated by user',
	CALC_SERVICE_UNAVAILABLE: 'Calculation service "{0}" is unavailable'
});

// Strings used by error checkers
Kekule.Localization.addResource('en', 'ErrorCheckMsg', {
	GENERAL_ERROR_WITH_CODE: 'Error code: {0}',
	ATOM_VALENCE_ERROR_WITH_SUGGEST: 'Abnormal valence {1} of atom {0}, the possible value is {2}',
	ATOM_VALENCE_ERROR_WITH_SUGGESTS: 'Abnormal valence {1} of atom {0}, the possible values are {2}',
	BOND_ORDER_EXCEED_ALLOWED_WITH_SUGGEST: 'The bond order ({0}) exceeds the maximum allowed value ({1})',
	BOND_WITH_ID_ORDER_EXCEED_ALLOWED_WITH_SUGGEST: 'The bond order of {0} ({1}) exceeds the maximum allowed value {2}',
	NODE_DISTANCE_TOO_CLOSE: 'Atoms/subgroups are very close to each other',
	NODE_DISTANCE_TOO_CLOSE_WITH_LABEL: 'Atoms/subgroups ({0}) are very close to each other',
	TITLE_CHANGE_BOND_ORDER_TO: 'Change bond order to {0}',
	DESCRIPTION_CHANGE_BOND_ORDER_TO: 'Change bond order from {0} to {1}',
	TITLE_MERGE_TO: 'Merge {0} to {1}',
	DESCRIPTION_MERGE_TO: 'Merge node {0} to {1}'
});