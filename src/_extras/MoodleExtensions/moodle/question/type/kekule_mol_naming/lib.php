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

class qtype_kekule_mol_naming_configs
{
    const DEF_STR_REPLACEMENT = <<<STR
　=
，=,
。=.
——=-
—=-
（=(
）=)
【=[
】=]
‘='
’='
“="
”="
STR;
    const DEF_REMOVE_SPACES = true;
    const DEF_REPLACE_UNSTANDARD_CHARS= true;
    const DEF_IGNORE_CASE = true;
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
