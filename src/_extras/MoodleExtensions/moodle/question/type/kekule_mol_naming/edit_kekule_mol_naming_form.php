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

require_once($CFG->dirroot . '/question/type/kekule_mol_naming/lib.php');
require_once($CFG->dirroot . '/question/type/kekule_multianswer/edit_kekule_multianswer_form.php');

class qtype_kekule_mol_naming_edit_form extends qtype_kekule_multianswer_edit_form {
    protected function data_preprocessing($question) {
        //return $question;
        //var_dump($question);
        // apply default settings
        if (!isset($question->replaceunstandardchars)) {
            $replaceunstandardchars = get_config('mod_qtype_kekule_mol_naming', 'replaceunstandardchars');
            if (!isset($replaceunstandardchars))
                $replaceunstandardchars = qtype_kekule_mol_naming_configs::DEF_REPLACE_UNSTANDARD_CHARS;
            $question->replaceunstandardchars = $replaceunstandardchars;
        }

        if (!isset($question->removespaces)) {
            $removespaces = get_config('mod_qtype_kekule_mol_naming', 'removespaces');
            if (!isset($removespaces))
                $removespaces = qtype_kekule_mol_naming_configs::DEF_REMOVE_SPACES;
            $question->removespaces = $removespaces;
        }

        if (!isset($question->ignorecase)) {
            $ignorecase = get_config('mod_qtype_kekule_mol_naming', 'ignorecase');
            if (!isset($ignorecase))
                $ignorecase = qtype_kekule_mol_naming_configs::DEF_IGNORE_CASE;
            $question->ignorecase = $ignorecase;
        }

        return parent::data_preprocessing($question);
    }
    protected function data_preprocessing_answers($question, $withanswerfiles = false)
    {
        //var_dump($question);
        // ensure all answer names are cleaned

        $options = array(
            'replaceunstandardchars' => $question->replaceunstandardchars,
            'removespaces' => $question->removespaces
        );
        $answers = $question->options->answers;
        foreach($answers as $answer)
        {
            $ansText = $answer->answer;
            $standardizedAns = qtype_kekule_mol_naming_utils::cleanName($ansText, $options);
            $answer->answer = $standardizedAns;
        }
        //var_dump($question->options->answers);
        $result = parent::data_preprocessing_answers($question, $withanswerfiles);
        return $result;
    }

    protected function addQuestionFormControls($mform)
    {
        parent::addQuestionFormControls($mform);
        $mform->addElement('advcheckbox', 'replaceunstandardchars',
            get_string('captionReplaceUnstandardChars', 'qtype_kekule_mol_naming'), '');
        $mform->addElement('advcheckbox', 'removespaces',
            get_string('captionRemoveSpaces', 'qtype_kekule_mol_naming'), '');
        $mform->addElement('advcheckbox', 'ignorecase',
            get_string('captionIgnoreCase', 'qtype_kekule_mol_naming'), '');
        /*
        $mform->addElement('select', 'inputtype',
            get_string('captionMolInputType', 'qtype_kekule_chem_base'),
            array(
                qtype_kekule_chem_input_type::MOLECULE => get_string('molInputTypeMol', 'qtype_kekule_chem_base'),
                qtype_kekule_chem_input_type::DOCUMENT => get_string('molInputTypeDoc', 'qtype_kekule_chem_base')
            )
        );
        $mform->addElement('select', 'defcomparemethod',
            get_string('captionDefCompareMethod', 'qtype_kekule_chem_base'),
            array(
                qtype_kekule_chem_compare_methods::SMILES => get_string('molCompareMethodSmiles', 'qtype_kekule_chem_base'),
                qtype_kekule_chem_compare_methods::MANUAL => get_string('molCompareMethodManual', 'qtype_kekule_chem_base')
            )
        );
        */
    }

    /**
     * Get concrete form control for answer fields.
     * Descendants should override this method.
     */
    protected function getAnswerDataFormControls($mform, $label, $gradeoptions)
    {
        $result = parent::getAnswerDataFormControls($mform, $label, $gradeoptions);
        /*
        //$result[] = $mform->createElement('hidden', 'answer', '');
        //$result[] = $mform->createElement('text', 'answer', 'Answer', array('size' => 20));
        $result[] = $mform->createElement('textarea', 'answer', get_string('captionMolecule', 'qtype_kekule_chem_base'),
            'class="' . qtype_kekule_chem_html::CLASS_DESIGN_ANSWER_BLANK . '" data-widget-class="' . qtype_kekule_chem_html::CLASS_DESIGN_VIEWER_BLANK . '"');

        $result[] = $mform->createElement('select', 'comparemethod',
            get_string('captionCompareMethod', 'qtype_kekule_chem_base'),
            array(
                qtype_kekule_chem_compare_methods::SMILES => get_string('molCompareMethodSmiles', 'qtype_kekule_chem_base'),
                qtype_kekule_chem_compare_methods::MANUAL => get_string('molCompareMethodManual', 'qtype_kekule_chem_base')
            )
        );
        */

        return $result;
    }

    public function qtype() {
        return 'kekule_mol_naming';
    }
}
