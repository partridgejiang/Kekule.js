<?php
/**
 * Created by PhpStorm.
 * User: ginger
 * Date: 2016/9/22
 * Time: 0:08
 */

require_once(__DIR__ . '/lib.php');

class block_kekuleinjector extends block_base
{
    public function init()
    {
        $this->title = get_string('kekuleinjector', 'block_kekuleinjector');

        // load essential files
        kekulejs_utils::includeKekuleCssFiles();
        kekulejs_utils::includeAdapterCssFiles();
        kekulejs_utils::includeKekuleJsFiles();
        kekulejs_utils::includeAdapterJsFiles();
    }
    public function getContent()
    {
        return '<h2>Kekule</h2>';  // empty content
    }
}