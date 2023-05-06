<?php

function xmldb_qtype_kekule_mol_naming_upgrade($oldversion) {
	global $DB;
	$dbman = $DB->get_manager();

	/// Add a new column newcol to the mdl_myqtype_options
	if ($oldversion < 2021011400) {

		// Define field compareoptions to be added to qtype_kekulechem_ans_ops.
		$table = new xmldb_table('qtype_kekule_molname_ops');
		$field = new xmldb_field('strictstereoflags', XMLDB_TYPE_INTEGER, '2', null, null, null, null, 'ignorecase');

		// Conditionally launch add field compareoptions.
		if (!$dbman->field_exists($table, $field)) {
			$dbman->add_field($table, $field);
		}

		// Kekule_chem_base savepoint reached.
		upgrade_plugin_savepoint(true, 2021011400, 'qtype', 'kekule_mol_naming');
	}

    if ($oldversion < 2023032802) {
        $table = new xmldb_table('qtype_kekule_molname_ops');
        $field = new xmldb_field('enablecharselector', XMLDB_TYPE_INTEGER, '2', null, null, null, null, 'strictstereoflags');
        // Conditionally launch add field compareoptions.
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        $field = new xmldb_field('charselectorcontent', XMLDB_TYPE_TEXT, '1024', null, null, null, null, 'enablecharselector');
        // Conditionally launch add field compareoptions.
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Kekule_chem_base savepoint reached.
        upgrade_plugin_savepoint(true, 2023032802, 'qtype', 'kekule_mol_naming');
    }

	return true;
}