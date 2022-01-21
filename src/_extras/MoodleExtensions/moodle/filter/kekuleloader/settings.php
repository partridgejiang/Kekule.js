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

require_once(__DIR__ . '/lib.php');

$settings->add(new admin_setting_configtextarea('filter_kekuleloader/blacklistpatterns',
	get_string('captionBlacklistPatterns', 'filter_kekuleloader'),
	get_string('descBlacklistPatterns', 'filter_kekuleloader'),
	kekuleloader_configs::DEF_BLACKLIST_PATTERNS, PARAM_TEXT
));

$settings->add(new admin_setting_configtextarea('filter_kekuleloader/whitelistpatterns',
	get_string('captionWhitelistPatterns', 'filter_kekuleloader'),
	get_string('descWhitelistPatterns', 'filter_kekuleloader'),
	kekuleloader_configs::DEF_WHITELIST_PATTERNS, PARAM_TEXT
));