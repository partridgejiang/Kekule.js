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
 * Admin settings for the Kekule plugins for atto.
 *
 * @package    atto
 * @subpackage kekule
 * @copyright  2011 The Open University
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */


defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/lib/editor/atto/plugins/kekulechem/lib.php');

/*
$settings->add(new admin_setting_configtext('mod_kekule/kekule_dir',
    get_string('captionKekuleDir', 'atto_kekulechem'), get_string('descKekuleDir', 'atto_kekulechem'),
    atto_kekulechem_configs::DEF_KEKULE_DIR, PARAM_TEXT));
*/

$settings->add(new admin_setting_configcheckbox('atto_kekulechem/chem_obj_inserter_auto_3d_generation',
	get_string('captionEnableChemObjInserterAuto3DGeneration', 'atto_kekulechem'), get_string('descEnableChemObjInserterAuto3DGeneration', 'atto_kekulechem'),
	atto_kekulechem_configs::DEF_CHEM_OBJ_INSERTER_AUTO_3D_GENERATION));

$settings->add(new admin_setting_configtextarea('atto_kekulechem/chem_obj_inserter_toolbuttons',
	get_string('captionChemObjInserterButtons', 'atto_kekulechem'), get_string('descChemObjInserterButtons', 'atto_kekulechem'),
	atto_kekulechem_configs::DEF_CHEM_OBJ_INSERTER_BUTTONS, PARAM_TEXT));

$settings->add(new admin_setting_configtextarea('atto_kekulechem/spectrum_inserter_toolbuttons',
	get_string('captionSpectrumInserterButtons', 'atto_kekulechem'), get_string('descSpectrumInserterButtons', 'atto_kekulechem'),
	atto_kekulechem_configs::DEF_SPECTRUM_INSERTER_BUTTONS, PARAM_TEXT));

