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
 * Atto text editor integration version file.
 *
 * @package    atto_kekulechem
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

class atto_kekulechem_configs
{
    const DEF_KEKULE_DIR = '/kekule.js/';

    static public function getKekuleDir()
    {
        $result = get_config('mod_kekule', 'kekule_dir');
        if (empty($result))
            $result = self::DEF_KEKULE_DIR;
        return $result;
    }
}

/**
 * Initialise the js strings required for this module.
 */
function atto_kekulechem_strings_for_js() {
    global $PAGE;
    global $CFG;

    // hack, load essential Kekule.js files
    $kekuleDir = atto_kekulechem_configs::getKekuleDir();
    $PAGE->requires->js($kekuleDir . 'raphael-min.js');
    $PAGE->requires->js($kekuleDir . 'Three.js');
    $PAGE->requires->js($kekuleDir . 'kekule/kekule.js?modules=io,chemWidget,algorithm&locals=zh');
    //$PAGE->requires->js($kekuleDir . 'kekule/kekule.js');
    //$PAGE->requires->js($kekuleDir . 'kekule/localizationData.zh.min.js');

    /*
    $cssUrl = $CFG->httpswwwroot . '/kekule.js/kekule/themes/default/kekule.css';
    //$PAGE->requires->css(cssUrl);

    html_writer::empty_tag('link', array(
        'type' => 'text/css',
        'rel' => 'stylesheet',
        'href' => $cssUrl
    ));
    $output = $PAGE->get_renderer('core');
    var_dump($output);
    */

    $PAGE->requires->strings_for_js(array(
        'kekuleCssUrl', 'captionAddChemObj', 'captionEditChemObj'
    ), 'atto_kekulechem');
    $PAGE->requires->strings_for_js(array(
        'ok', 'cancel'
    ), 'moodle');
}

/**
 * Set params for this plugin
 * @param string $elementid
 * @param string $options
 * @param string $foptions
 */
function atto_kekulechem_params_for_js($elementid, $options, $foptions) {
    global $CFG;
    $params = array(
        'kekuleCssUrl' => $CFG->httpswwwroot . atto_kekulechem_configs::getKekuleDir() . 'kekule/themes/default/kekule.css',
        'attoKekulePluginPath' => $CFG->httpswwwroot . '/lib/editor/atto/plugins/kekulechem/',
    );
    return $params;
}