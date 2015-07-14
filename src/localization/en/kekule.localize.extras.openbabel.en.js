/**
 * @fileoverview
 * A file to store string constants for OpenBabel adapter in English.
 * @author Partridge Jiang
 */

/** @ignore */
Kekule.LOCAL_RES = true;

Kekule.Localization.setCurrModule('extra.openbabel');

// error messages
// Object.extend(Kekule.ErrorMsg.en, {
Kekule.Localization.addResource('en', 'ErrorMsg', {
	'OpenBabel': {
		CHEM_NODE_TYPE_NOT_SUITABLE: 'Unsuitable node type',
		CHEM_CONNECTOR_TYPE_NOT_SUITABLE: 'Unsuitable connector type',

		ONLY_STR_INPUT_DATA_ALLOWED: 'Input data must be text',
		ONLY_STR_OUTPUT_DATA_ALLOWED: 'Output data must be text',

		FAIL_TO_GENERATE_3D_STRUCTURE: 'Fail to generate 3D structure coordinates'
	}
});