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
 * Serve question type files
 *
 * @since      2.0
 * @package    qtype_kekule_chem

 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */


defined('MOODLE_INTERNAL') || die();

class qtype_kekule_mol_naming_char_selector_enable_state {
    const DEFAULT = 0;  // default, use the global setting
    const ENABLED = 1;
    const DISABLED = -1;
}

class qtype_kekule_mol_naming_configs
{
    const DEF_STR_REPLACEMENT = '　= \n' . <<<'STR1'
，=,
。=.
——=-
—=-
－=-
（=(
）=)
【=[
［=[
】=]
］=]
‘='
’='
“="
”="
STR1;

    const DEF_STEREO_FLAG_STRS = <<<'STR2'
R
S
r
s
Z
E
cis
trans
顺
反
STR2;

    const DEF_CHAR_SELECTOR_CONTENT = <<<'STR3'
E Z R S r s
, . - ( ) [ ]
1 2 3 4 5 6 7 8 9 0
α β γ δ ε ζ η θ ι κ λ μ ν ξ ο π ρ ς σ τ υ φ χ ψ ω
STR3;

	// ['R', 'S', 'r', 's', 'Z', 'E', 'cis', 'trans', '顺', '反'];
    const DEF_STRICT_STEREO_FLAGS = false;
    const DEF_REMOVE_SPACES = true;
    const DEF_REPLACE_UNSTANDARD_CHARS= true;
    const DEF_IGNORE_CASE = true;

    const DEF_ENABLE_CHAR_SELECTOR = false;
}

class qtype_kekule_mol_naming_utils
{
    /**
     * Returns unstandard chars and their replacements.
     * @return array
     * @throws dml_exception
     */
    static public function getUnstandardCharMap()
    {
        $replacements = get_config('mod_qtype_kekule_mol_naming', 'strrepplacements');
        if (empty($replacements))
        {
            $replacements = qtype_kekule_mol_naming_configs::DEF_STR_REPLACEMENT;
        }
        $result = array();
        $repLines = explode("\n", $replacements);   // here must be "\n" rather than '\n'
        foreach($repLines as $line)
        {
            $pos = strpos($line, '=');
            if ($pos !== false)
            {
                $key = substr($line, 0, $pos);
                $value = substr($line, $pos + 1);
                //echo 'LINE: ', $key, ' ', $value;
                if (!empty($key)) {
                    $result[$key] = $value;
                }
            }
        }
        return $result;
    }
	/**
	 * Returns configured stereo flag strings (e.g., ['R', 'S']).
	 * @return array
	 */
    static public function getStereoFlags()
    {
	    $stereoFlagLines = get_config('mod_qtype_kekule_mol_naming', 'stereoflags');
	    if (empty($stereoFlagLines))
	    {
		    $stereoFlagLines = qtype_kekule_mol_naming_configs::DEF_STEREO_FLAG_STRS;
	    }
	    $flags = explode("\n", $stereoFlagLines);   // here must be "\n" rather than '\n'
	    // trim flags
	    foreach ($flags as $i => $value)
	    {
		    $flags[$i] = trim($value);
	    }
	    return $flags;
    }

    /**
     * Returns the default naming char selector content string.
     * @return string
     */
    static public function getCharSelectorContent()
    {
        $content = get_config('mod_qtype_kekule_mol_naming', 'charselectorcontent');
        if (empty($content))
        {
            $content = get_string('defCharSelectorContent', 'qtype_kekule_mol_naming');
        }
        if (empty($content))
            $content = qtype_kekule_mol_naming_configs::DEF_CHAR_SELECTOR_CONTENT;
        return $content;
    }
    /**
     * Clean a molecule name, remove unstandard chars.
     * @param $molName
     * @param $options
     */
    static public function cleanName($molName, $options)
    {
        $result = $molName;
        if ($options['replaceunstandardchars'])
        {
            $charMap = self::getUnstandardCharMap();
            //var_dump($charMap);
            $result = self::_replaceUnstandardChars($result, $charMap);
            $result = self::_fullWidthToHalfWidthChar($result);
        }
        if ($options['removespaces'])
        {
            $result = self::_removeSpaces($result);
        }
        if (!$options['strictstereoflags'])
        {
        	$result = self::_cleanStereoFlagSection($result);
        }
        //echo 'clean: ', $molName, ' :: ', $result, '<br />';
        return $result;
    }
    static private function _replaceUnstandardChars($text, $charMap)
    {
        $result = $text;
        /*
        foreach ($charMap as $key => $value)
        {
            $result = str_replace($key, $value, $result);
        }
        */
        $result = strtr($result, $charMap);
        return $result;
    }
    static private function _removeSpaces($text)
    {
        //return str_replace(' ', '', $text);
        return preg_replace('/\s/', '', $text); // using str_replace may miss some blanks
    }
    static private function _fullWidthToHalfWidthChar($text)
    {
        $arr = array('０' => '0', '１' => '1', '２' => '2', '３' => '3', '４' => '4',
            '５' => '5', '６' => '6', '７' => '7', '８' => '8', '９' => '9',
            'Ａ' => 'A', 'Ｂ' => 'B', 'Ｃ' => 'C', 'Ｄ' => 'D', 'Ｅ' => 'E',
            'Ｆ' => 'F', 'Ｇ' => 'G', 'Ｈ' => 'H', 'Ｉ' => 'I', 'Ｊ' => 'J',
            'Ｋ' => 'K', 'Ｌ' => 'L', 'Ｍ' => 'M', 'Ｎ' => 'N', 'Ｏ' => 'O',
            'Ｐ' => 'P', 'Ｑ' => 'Q', 'Ｒ' => 'R', 'Ｓ' => 'S', 'Ｔ' => 'T',
            'Ｕ' => 'U', 'Ｖ' => 'V', 'Ｗ' => 'W', 'Ｘ' => 'X', 'Ｙ' => 'Y',
            'Ｚ' => 'Z', 'ａ' => 'a', 'ｂ' => 'b', 'ｃ' => 'c', 'ｄ' => 'd',
            'ｅ' => 'e', 'ｆ' => 'f', 'ｇ' => 'g', 'ｈ' => 'h', 'ｉ' => 'i',
            'ｊ' => 'j', 'ｋ' => 'k', 'ｌ' => 'l', 'ｍ' => 'm', 'ｎ' => 'n',
            'ｏ' => 'o', 'ｐ' => 'p', 'ｑ' => 'q', 'ｒ' => 'r', 'ｓ' => 's',
            'ｔ' => 't', 'ｕ' => 'u', 'ｖ' => 'v', 'ｗ' => 'w', 'ｘ' => 'x',
            'ｙ' => 'y', 'ｚ' => 'z'
            /*
            '（' => '(', '）' => ')', '〔' => '[', '〕' => ']', '【' => '[',
            '】' => ']', '〖' => '[', '〗' => ']', '“' => '\"', '”' => '\"',
            '‘' => '\'', '’' => '\'', '｛' => '{', '｝' => '}', '《' => '<',
            '》' => '>',
            '％' => '%', '＋' => '+', '—' => '-', '－' => '-', '～' => '-',
            '：' => ':', '。' => '.', '、' => ',', '，' => '.', '、' => '.',
            '；' => ',', '？' => '?', '！' => '!', '…' => '-', '‖' => '|',
            '｜' => '|', '〃' => '"',
            '　' => ' '
            */
            );
        return strtr($text, $arr);
    }
    static private function _cleanStereoFlagSection($text)
    {
	    $flagGroup = '\d*(' . join('|', self::getStereoFlags()) . ')';
	    $matchStr = '(^|-)(\(\s*(' . $flagGroup . '\s*(,\s*' . $flagGroup . ')*)\s*\))';
	    $reg = '/' . $matchStr . '/';
	    //var_dump($reg);
	    $matches = [];
	    if (preg_match($reg, $text, $matches, PREG_OFFSET_CAPTURE))
	    {
	    	$matchedSection = $matches[2][0];
		    $matchedSectionIndex = $matches[2][1];
	    	$sectionCore = $matches[3][0];
	    	// replace section with (XXX) to XXX
		    $result = substr($text, 0, $matchedSectionIndex) . $sectionCore . substr($text, $matchedSectionIndex + strlen($matchedSection), strlen($text));
	    }
	    else
	    	$result = $text;
	    return $result;
    }
}


/**
 * Checks file access for Kekule Chem questions.
 * @package  qtype_kekule_chem
 * @category files
 * @param stdClass $course course object
 * @param stdClass $cm course module object
 * @param stdClass $context context object
 * @param string $filearea file area
 * @param array $args extra arguments
 * @param bool $forcedownload whether or not force download
 * @param array $options additional options affecting the file serving
 * @return bool
 */
function qtype_kekule_mol_naming_pluginfile($course, $cm, $context, $filearea, $args, $forcedownload, array $options=array()) {
    global $DB, $CFG;
    require_once($CFG->libdir . '/questionlib.php');
    question_pluginfile($course, $context, 'qtype_kekule_mol_naming', $filearea, $args, $forcedownload, $options);
}
