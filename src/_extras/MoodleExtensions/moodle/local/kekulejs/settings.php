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
 * @package    local
 * @subpackage kekulejs
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */



defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/lib.php');

global $CFG, $PAGE;

if ($hassiteconfig) {

    $settings = new admin_settingpage('kekulejs', get_string('pluginname', 'local_kekulejs'));

    $settings->add(new admin_setting_configtext('mod_kekule/kekule_dir',
        get_string('captionKekuleDir', 'local_kekulejs'), get_string('descKekuleDir', 'local_kekulejs'),
        kekulejs_configs::DEF_KEKULE_DIR, PARAM_TEXT));
	$settings->add(new admin_setting_configcheckbox('local_kekulejs/enable3dviewer',
		get_string('captionEnable3DViewer', 'local_kekulejs'), get_string('descEnable3DViewer', 'local_kekulejs'),
		kekulejs_configs::DEF_ENABLE_3D_VIEWER));

    $ADMIN->add('localplugins', $settings);
}