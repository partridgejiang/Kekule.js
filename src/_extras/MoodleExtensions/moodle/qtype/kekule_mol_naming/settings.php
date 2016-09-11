<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Admin settings for the Opaque question type.
 *
 * @package    qtype
 * @subpackage kekule
 * @copyright  2011 The Open University
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */


defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/question/type/kekule_mol_naming/lib.php');

/*
var_dump($settings);
die();
*/

/*
$settings->add(new admin_setting_text_with_advanced('mod_qtype_kekule_chem/mol_comparer_url',
    get_string('captionMolComparerUrl', 'qtype_kekule_chem_base'), get_string('descMolComparerUrl', 'qtype_kekule_chem_base'),
    array('value' => '127.0.0.1:3306', 'fix' => false), PARAM_TEXT));
*/
$settings->add(new admin_setting_configcheckbox(('mod_qtype_kekule_mol_naming/ignorecase'),
    get_string('captionIgnoreCase', 'qtype_kekule_mol_naming'), get_string('descIgnoreCase', 'qtype_kekule_mol_naming'),
    qtype_kekule_mol_naming_configs::DEF_IGNORE_CASE));
$settings->add(new admin_setting_configcheckbox(('mod_qtype_kekule_mol_naming/removespaces'),
    get_string('captionRemoveSpaces', 'qtype_kekule_mol_naming'), get_string('descRemoveSpaces', 'qtype_kekule_mol_naming'),
    qtype_kekule_mol_naming_configs::DEF_REMOVE_SPACES));
$settings->add(new admin_setting_configcheckbox(('mod_qtype_kekule_mol_naming/replaceunstandardchars'),
    get_string('captionReplaceUnstandardChars', 'qtype_kekule_mol_naming'), get_string('descReplaceUnstandardChars', 'qtype_kekule_mol_naming'),
    qtype_kekule_mol_naming_configs::DEF_REPLACE_UNSTANDARD_CHARS));

$settings->add(new admin_setting_configtextarea('mod_qtype_kekule_mol_naming/strrepplacements',
    get_string('captionStrReplacements', 'qtype_kekule_mol_naming'), get_string('descStrReplacements', 'qtype_kekule_mol_naming'),
    qtype_kekule_mol_naming_configs::DEF_STR_REPLACEMENT));