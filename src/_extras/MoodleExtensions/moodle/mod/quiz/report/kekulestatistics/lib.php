<?php
/**
 * Created by PhpStorm.
 * User: ginger
 * Date: 2016/9/19
 * Time: 20:03
 */

class quiz_kekulestatistics_configs
{
    const DEF_KEKULE_DIR = '/kekule.js/';

    static public function getKekuleDir()
    {
        $result = get_config('mod_kekule', 'kekule_dir');
        if (empty($result))
            $result = self::DEF_KEKULE_DIR;
        return $result;
    }
};