<?php
/**
 * Created by PhpStorm.
 * User: ginger
 * Date: 2016/9/11
 * Time: 16:45
 */

function xmldb_qtype_kekule_chem_base_upgrade($oldversion) {
    global $DB;
    $dbman = $DB->get_manager();

    /// Add a new column newcol to the mdl_myqtype_options
    if ($oldversion < 2016091101) {

        // Define field compareoptions to be added to qtype_kekulechem_ans_ops.
        $table = new xmldb_table('qtype_kekulechem_ans_ops');
        $field = new xmldb_field('compareoptions', XMLDB_TYPE_TEXT, null, null, null, null, null, 'comparemethod');

        // Conditionally launch add field compareoptions.
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Kekule_chem_base savepoint reached.
        upgrade_plugin_savepoint(true, 2016091101, 'qtype', 'kekule_chem_base');
    }

    return true;
}