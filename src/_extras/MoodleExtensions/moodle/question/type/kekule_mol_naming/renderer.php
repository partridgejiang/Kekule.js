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
 * YOURQTYPENAME question renderer class.
 *
 * @package    qtype
 * @subpackage YOURQTYPENAME
 * @copyright  THEYEAR YOURNAME (YOURCONTACTINFO)

 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */


defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/question/type/kekule_chem_base/lib.php');
require_once($CFG->dirroot . '/question/type/kekule_multianswer/renderer.php');

class qtype_kekule_mol_naming_renderer extends qtype_kekule_multianswer_renderer {
    public function head_code(question_attempt $qa) {
        global $PAGE, $CFG;

        // dependant files
        $kekuleDir = qtype_kekule_chem_configs::getKekuleDir();
        kekulejs_utils::includeKekuleCssFiles();
        $PAGE->requires->css('/question/type/kekule_mol_naming/styles/kekule_mol_naming.css');

    }

    public function formulation_and_controls(question_attempt $qa,
                                             question_display_options $options)
    {
        global $PAGE, $CFG;

        $question = $qa->get_question();

        kekulejs_utils::includeKekuleScriptFiles();

        $PAGE->requires->js_call_amd('qtype_kekule_mol_naming/extraLangs', 'init');
        $PAGE->requires->js_call_amd('qtype_kekule_mol_naming/extraWidgets', 'init');

        $params = [
            'enablecharselector' => $this->_getEnableCharSelector($question),
            'charselectorcontent' => isset($question->charselectorcontent)? $question->charselectorcontent: get_config('mod_qtype_kekule_mol_naming', 'charselectorcontent')
        ];
        if (!isset($params['charselectorcontent']))
            $params['charselectorcontent'] = qtype_kekule_mol_naming_utils::getCharSelectorContent(); // qtype_kekule_mol_naming_configs::DEF_CHAR_SELECTOR_CONTENT;

        $PAGE->requires->js_call_amd('qtype_kekule_mol_naming/render', 'init', [$params]);

        $result = parent::formulation_and_controls($qa, $options);
        return $result;
    }

    protected function getBlankHtml($blankIndex, $blank, $answer, $question,
                                    question_attempt $qa, question_display_options $options, $correctResponse, $htmlElemAttribs = NULL)
    {
        $actualHtmlElemAttribs = empty($htmlElemAttribs)? []: $htmlElemAttribs;

        if ($this->_getEnableCharSelector($question))  // add a special flag to input control
        {
            $actualHtmlElemAttribs['data-enable-char-selector'] = 'true';
        }
        return parent::getBlankHtml($blankIndex, $blank, $answer, $question, $qa, $options, $correctResponse, $actualHtmlElemAttribs);
    }

    private function _getEnableCharSelector($question)
    {
        /*
        $result = isset($question->enablecharselector)? $question->enablecharselector: get_config('mod_qtype_kekule_mol_naming', 'enablecharselector');
        */

        $enableState = intval($question->enablecharselector);
        if ($enableState === qtype_kekule_mol_naming_char_selector_enable_state::DISABLED)
            $result = false;
        else if ($enableState === qtype_kekule_mol_naming_char_selector_enable_state::ENABLED)
            $result = true;
        else if (!isset($enableState) || $enableState === qtype_kekule_mol_naming_char_selector_enable_state::DEFAULT)
            $result = get_config('mod_qtype_kekule_mol_naming', 'enablecharselector');

        if (!isset($result))
            $result = qtype_kekule_mol_naming_configs::DEF_ENABLE_CHAR_SELECTOR;

        //var_dump($question->enablecharselector, get_config('mod_qtype_kekule_mol_naming', 'enablecharselector'), $enableState, $result);
        //die();
        return !!$result;
    }
}
