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


defined('MOODLE_INTERNAL') || die();

/**
 * Config class kekule.js plugins
 */
class kekulejs_configs
{
    //const DEF_MOL_COMPARER_URL = 'http://127.0.0.1:3000/mols/compare';

    const DEF_KEKULE_DIR = '/local/kekulejs/';
    //const DEF_KEKULE_JS_DIR = '/local/kekule.js/scripts/';

    /**
     * Returns root dir of Kekukejs plugins.
     * @return string
     */
    static public function getKekuleDir()
    {

        $result = get_config('mod_kekule', 'kekule_dir');
        if (empty($result))
            $result = self::DEF_KEKULE_DIR;
        return $result;
    }
    /**
     * Returns dir of JavaScript files (including Kekule.js and its dependencies).
     * @return string
     */
    static public function getScriptDir()
    {
        return self::getKekuleDir() . 'jslib/';
    }
    /**
     * Returns dir of Kekule.js JavaScript files.
     * @return string
     */
    static public function getKekuleScriptDir()
    {
        return self::getScriptDir() . 'kekule.js/';
    }
    static public function getAdapterDir()
    {
        return self::getKekuleDir() . 'adapter/';
    }
}

class kekulejs_utils
{
    /**
     * Add essential Kekule.js Javascript files to $PAGE.
     * @param $page
     * @param null $options Array that stores options to load Kekule.js
     */
    static public function includeKekuleScriptFiles($options = null, $page = null)
    {
        global $PAGE;

        $p = $page;
        if (!isset($p))
            $p = $PAGE;
        $scriptDir = kekulejs_configs::getScriptDir();
        // $rootDir = kekulejs_configs::getKekuleDir();
        $adapterDir = kekulejs_configs::getAdapterDir();

        // params
        $params = '';
        if (isset($options)) {
            foreach ($options as $key => $value) {
                $params .= $key . '=' . $value;
            }
        } else  // use default
            $params = 'modules=io,chemWidget,algorithm&locals=zh';

        $p->requires->js($scriptDir . 'raphael-min.js');
        $p->requires->js($scriptDir . 'Three.js');
        $p->requires->js($scriptDir . 'kekule/kekule.js?' . $params);
        $p->requires->js($adapterDir . 'kekuleInitials.js');
    }
    static public function includeKekuleJsFiles($options = null, $page = null)
    {
        return kekulejs_utils::includeKekuleScriptFiles($options, $page);
    }

    /**
     * Add essential Kekule.js CSS files to $PAGE.
     * @param $page
     */
    static public function includeKekuleCssFiles($page = null)
    {
        global $PAGE;
        $p = $page;
        if (!isset($p))
            $p = $PAGE;

        $scriptDir = kekulejs_configs::getScriptDir();
        try {
            $p->requires->css($scriptDir . 'kekule/themes/default/kekule.css');
        }
        catch(Exception $e)
        {
            // do nothing, just avoid exception
        }
    }

    static public function includeAdapterJsFiles($page = null)
    {
        global $PAGE;

        $p = $page;
        if (!isset($p))
            $p = $PAGE;
        $dir = kekulejs_configs::getAdapterDir();
        $p->requires->js($dir . 'kekuleMoodle.js');
    }

    /**
     * Add essential Kekule.js CSS files to $PAGE.
     * @param $page
     */
    static public function includeAdapterCssFiles($page = null)
    {
        global $PAGE;

        $p = $page;
        if (!isset($p))
            $p = $PAGE;
        $dir = kekulejs_configs::getAdapterDir();
        try {
            $p->requires->css($dir . 'kekuleMoodle.css');
        }
        catch(Exception $e)
        {
            // do nothing, just avoid exception
        }
    }
}