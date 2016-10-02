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
 * Admin settings for the Kekule_Chem question type.
 *
 * @package    qtype
 * @subpackage kekule
 * @copyright  2011 The Open University
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */


defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/question/type/kekule_chem_base/lib.php');

/*
$settings->add(new admin_setting_configtext('mod_kekule/kekule_dir',
    get_string('captionKekuleDir', 'qtype_kekule_chem_base'), get_string('descKekuleDir', 'qtype_kekule_chem_base'),
    qtype_kekule_chem_configs::DEF_KEKULE_DIR, PARAM_TEXT));
*/
$settings->add(new admin_setting_configtext('mod_qtype_kekule_chem/js_server_url',
    get_string('captionJsServerUrl', 'qtype_kekule_chem_base'), get_string('descJsServerUrl', 'qtype_kekule_chem_base'),
    qtype_kekule_chem_configs::DEF_JS_SERVER_URL, PARAM_TEXT));

/*
$settings->add(new admin_setting_configtext('mod_qtype_kekule_chem/mol_comparer_url',
    get_string('captionMolComparerUrl', 'qtype_kekule_chem_base'), get_string('descMolComparerUrl', 'qtype_kekule_chem_base'),
    qtype_kekule_chem_configs::DEF_MOL_COMPARER_URL, PARAM_TEXT));
*/