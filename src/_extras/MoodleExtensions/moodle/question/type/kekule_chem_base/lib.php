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

$kekulePluginsPath = get_config('mod_kekule', 'kekule_dir');

if (empty($kekulePluginsPath))
    $kekulePluginsPath = '/local/kekulejs/';  // default location;
require_once($CFG->dirroot . $kekulePluginsPath . 'lib.php');

// consts
class qtype_kekule_chem_compare_methods {
    const DEF_METHOD = 0;  // default
    const SMILES = 1;  // Exact match with SMILES
    const MOLDATA = 2;  // Exact match with molecule data, usually can be replaced with SMILES
    const PARENTOF = 11; // answer is parent structure of key molecule
    const CHILDOF = 12;  // answer is sub structure of key molecule
    //const MANUAL = 10;  // manually compare, not grade automatically
}
class qtype_kekule_chem_compare_levels {
    const DEF_LEVEL = 0;  // default
    const CONSTITUTION = 1;  // match with Constitution, ingore steroe
    const CONFIGURATION = 2;  // match with stereo
}

class qtype_kekule_chem_input_type {
    const MOLECULE = 0;
    const DOCUMENT = 1;
}

class qtype_kekule_chem_html
{
    const INPUT_TYPE_MOL = 'mol';
    const INPUT_TYPE_DOC = 'doc';
    // class for answer blank in question design
    const CLASS_DESIGN_VIEWER_BLANK = 'K-Chem-Question-Design-BlankViewer';
    const CLASS_DESIGN_ANSWER_BLANK = 'K-Chem-Question-Design-AnswerBlank';
    // class for answer blank in question solve by student
    const CLASS_BLANK = 'K-Chem-Question-Blank';
    const CLASS_DOC_BLANK = 'K-Chem-Question-Blank-Doc';
    const CLASS_MOL_BLANK = 'K-Chem-Question-Blank-Mol';
    const CLASS_BLANK_ANSWER = 'K-Chem-Question-Answer';
    const CLASS_CORRECT_RESPONSE = 'K-Chem-Question-CorrectResponse';
    // question body
    //const CLASS_QUESTION_BODY = 'K-Chem-Question-Body';
}

class qtype_kekule_chem_configs
{
    const DEF_MOL_COMPARER_URL = 'http://127.0.0.1:3000/mols/compare';
    const DEF_JS_SERVER_URL = 'http://127.0.0.1:3000/mols';

    const PATH_COMPARE = '/compare';
    const PATH_CONTAIN = '/contain';

    const DEF_KEKULE_DIR = '/local/kekulejs/';

    static public function getKekuleDir()
    {
        return kekulejs_configs::getScriptDir();
        /*
        if (empty($result))
            $result = self::DEF_KEKULE_DIR;
        return $result;
        */
    }
}

class qtype_kekule_chem_utils
{
    static public function postData($url, $data, $optional_headers = null)
    {
        $params = array('http' => array(
            'method' => 'POST',
            'content' => http_build_query($data, '', '&')
              // NOTE: here we appoint separator '&', otherwise '&amp' will be used and caused error in server side
        ));
        //var_dump(http_build_query($data));
        //die();
        if ($optional_headers !== null) {
            $params['http']['header'] = $optional_headers;
        }

        $ctx = stream_context_create($params);
        $fp = @fopen($url, 'rb', false, $ctx);
        if (!$fp) {
            throw new Exception("Problem with $url, $php_errormsg");
        }
        $response = @stream_get_contents($fp);
        if ($response === false) {
            throw new Exception("Problem reading data from $url, $php_errormsg");
        }
        return $response;
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
function qtype_kekule_chem_base_pluginfile($course, $cm, $context, $filearea, $args, $forcedownload, array $options=array()) {
    global $DB, $CFG;
    require_once($CFG->libdir . '/questionlib.php');
    question_pluginfile($course, $context, 'qtype_kekule_chem_base', $filearea, $args, $forcedownload, $options);
}
