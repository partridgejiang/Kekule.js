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
        return self::getScriptDir() . 'kekule.js.0.9.7.21042802/';
    }
    static public function getAdapterDir()
    {
        return self::getKekuleDir() . 'adapter/';
    }
}

class kekulejs_utils
{
    // a series of flags avoiding script/css be included several times in one page
    static private $_scriptIncluded = false;
    static private $_cssIncluded = false;
    static private $_adapterScriptIncluded = false;
    static private $_adapterCssIncluded = false;
    static private function includeSimpleExternalScriptFiles($name, $srcUrl, $page = null)
    {
	    global $CFG;
	    $urlRoot = $CFG->wwwroot;
    	$config = ['paths' => [$name => $urlRoot . '/' . $srcUrl]];
	    $requirejs = 'require.config(' . json_encode($config) . ')';
	    $page->requires->js_amd_inline($requirejs);
    }
    /**
     * Add essential Kekule.js Javascript files to $PAGE.
     * @param $page
     * @param null $options Array that stores options to load Kekule.js
     */
    static public function includeKekuleScriptFiles($options = null, $page = null)
    {
        if (kekulejs_utils::$_scriptIncluded)
            return;

        global $PAGE;

        $p = $page;
        if (!isset($p))
            $p = $PAGE;
        $scriptDir = kekulejs_configs::getScriptDir();
        // $rootDir = kekulejs_configs::getKekuleDir();
		$kekuleScriptDir = kekulejs_configs::getKekuleScriptDir();
        $adapterDir = kekulejs_configs::getAdapterDir();

        // params
        $params = '';
        if (isset($options)) {
            foreach ($options as $key => $value) {
                $params .= $key . '=' . $value;
            }
        } else  // use default
            $params = 'modules=io,chemWidget,algorithm&locals=zh';

        // language
	    $currLan = current_language();
	    if ($currLan)
	    {
		    $params .= '&language=' . $currLan;
		}

        try
        {
        	/*
            $p->requires->js($scriptDir . 'raphael-min.js');
            $p->requires->js($scriptDir . 'Three.js');
        	*/
	        kekulejs_utils::includeSimpleExternalScriptFiles('raphael', $scriptDir . 'raphael-min.js', $p);
	        kekulejs_utils::includeSimpleExternalScriptFiles('three', $scriptDir . 'Three.js', $p);
            //$p->requires->js($kekuleScriptDir . 'kekule.js?' . $params);
	        //kekulejs_utils::includeSimpleExternalScriptFiles('kekule', $kekuleScriptDir . 'kekule.js?' . $params, $p);
	        kekulejs_utils::includeSimpleExternalScriptFiles('kekule', $kekuleScriptDir . 'kekule.min.js?' . $params, $p);
            //$p->requires->js($adapterDir . 'kekuleInitials.js');
	        $p->requires->js_call_amd('local_kekulejs/kekuleInitials', 'init');

            kekulejs_utils::$_scriptIncluded = true;
        }
        catch(Exception $e)
        {
            // do nothing, just avoid exception
        }
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
        if (kekulejs_utils::$_cssIncluded)
            return;

        global $PAGE;
        $p = $page;
        if (!isset($p))
            $p = $PAGE;

        $scriptDir = kekulejs_configs::getScriptDir();
		$kekuleScriptDir = kekulejs_configs::getKekuleScriptDir();
        try {
            $p->requires->css($kekuleScriptDir . 'themes/default/kekule.css');
            kekulejs_utils::$_cssIncluded = true;
        }
        catch(Exception $e)
        {
            // do nothing, just avoid exception
        }
    }

    static public function includeAdapterJsFiles($page = null)
    {
        if (kekulejs_utils::$_adapterScriptIncluded)
            return;

        global $PAGE;

        $p = $page;
        if (!isset($p))
            $p = $PAGE;
        $dir = kekulejs_configs::getAdapterDir();
        try
        {
        	/*
            $p->requires->js($dir . 'kekuleMoodle.js');
            $p->requires->js($dir . 'kekuleChemViewerInterceptor.js');
        	*/
        	$p->requires->js_call_amd('local_kekulejs/kekuleMoodle', 'init');
	        $p->requires->js_call_amd('local_kekulejs/kekuleChemViewerInterceptor', 'init');
            kekulejs_utils::$_adapterScriptIncluded = true;
	    }
	    catch(Exception $e)
        {
            // do nothing, just avoid exception
        }
    }

    /**
     * Add essential Kekule.js CSS files to $PAGE.
     * @param $page
     */
    static public function includeAdapterCssFiles($page = null)
    {
        if (kekulejs_utils::$_adapterCssIncluded)
            return;

        global $PAGE;

        $p = $page;
        if (!isset($p))
            $p = $PAGE;
        $dir = kekulejs_configs::getAdapterDir();
        try {
            $p->requires->css($dir . 'kekuleMoodle.css');
            kekulejs_utils::$_adapterCssIncluded = true;
        }
        catch(Exception $e)
        {
            // do nothing, just avoid exception
        }
    }
}