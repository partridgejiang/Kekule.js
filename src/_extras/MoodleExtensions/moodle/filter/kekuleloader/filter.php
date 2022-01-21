<?php

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/lib.php');

class filter_kekuleloader extends moodle_text_filter {
    public function filter($text, array $options = array()) {
        return $text;  // actually do no filter of content
    }

    // load js script at the initialization stage
    public function setup($page, $context) {

	    $url = $page->url;
    	$needApply = true;
    	// check if page url matches pattern and need to insert js

	    $sBlacklistPatterns = get_config('filter_kekuleloader', 'blacklistpatterns');
	    $sWhitelistPatterns = get_config('filter_kekuleloader', 'whitelistpatterns');
	    if (!isset($sBlacklistPatterns))
		    $sBlacklistPatterns = kekuleloader_configs::DEF_BLACKLIST_PATTERNS;
	    if (!isset($sWhitelistPatterns))
		    $sWhitelistPatterns = kekuleloader_configs::DEF_WHITELIST_PATTERNS;

	    if (!empty($sWhitelistPatterns))  // check white list first
	    {
		   $needApply = $this->_matchPatterns($url, preg_split('/[\r\n]/', $sWhitelistPatterns));
	    }
	    else if (!empty($sBlacklistPatterns))
	    {
		   $needApply = !$this->_matchPatterns($url, preg_split('/[\r\n]/', $sBlacklistPatterns));
	    }

	    //echo "ready to apply: " . ($needApply? "true": "false");

	    if ($needApply)
	    {
		    kekuleloader_utils::includeKekuleFiles();
	    }
    }

    private function _matchPatterns($text, $patterns)
    {
	    foreach ($patterns as $pattern)
	    {
		    $p = str_replace('/', '\/', trim($pattern)); // replace path delimiter, avoid affect preg operations
		    if (!empty($p) && preg_match('/' . $p . '/', $text))
		    {
			    return true;
		    }
	    }
	    return false;
    }
}
