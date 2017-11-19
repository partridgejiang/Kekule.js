<?php
/**
 * Created by PhpStorm.
 * User: ginger
 * Date: 2016/9/19
 * Time: 20:03
 */

$kekulePluginsPath = get_config('mod_kekule', 'kekule_dir');
if (empty($kekulePluginsPath))
    $kekulePluginsPath = '/local/kekulejs/';  // default location;
require_once($CFG->dirroot . $kekulePluginsPath . 'lib.php');

class quiz_kekulestatistics_configs
{
    const DEF_KEKULE_DIR = '/local/kekulejs/';
    static public function getKekuleDir()
    {
        return kekulejs_configs::getScriptDir();
    }
};