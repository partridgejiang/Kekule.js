<?php

$kekulePluginsPath = get_config('mod_kekule', 'kekule_dir');
if (empty($kekulePluginsPath))
	$kekulePluginsPath = '/local/kekulejs/';  // default localtion
require_once($CFG->dirroot . $kekulePluginsPath . 'lib.php');

class kekuleloader_configs
{
	const DEF_BLACKLIST_PATTERNS = '';
	const DEF_WHITELIST_PATTERNS = '';
}

class kekuleloader_utils
{
    static function includeKekuleFiles()
    {
	    kekulejs_utils::includeAllKekulejsFiles();
    }
}
