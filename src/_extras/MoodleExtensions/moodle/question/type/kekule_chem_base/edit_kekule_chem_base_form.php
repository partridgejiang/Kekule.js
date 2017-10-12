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

require_once($CFG->dirroot . '/question/type/kekule_chem_base/lib.php');
require_once($CFG->dirroot . '/question/type/kekule_multianswer/edit_kekule_multianswer_form.php');

class qtype_kekule_chem_base_edit_form extends qtype_kekule_multianswer_edit_form {
    /*
    private $defCompareMethod;
    private $ansCompareMethods;
    */
    private $inputType;

    protected function data_preprocessing($question) {
        $question = parent::data_preprocessing($question);

        /*
        // save compare method, used in adding answer fields
        $this->defCompareMethod = $question->defcomparemethod;
        $this->ansCompareMethods = array();
        foreach ($question->options->answers as $key => $value)
        {
            $ansCompareMethods[] = $value->comparemethod;
        }

        $this->inputType = $question->inputtype;
        echo 'inputType', $this->inputType;
        */

        return $question;
    }

    protected function definition_inner($mform) {
        global $PAGE, $CFG;

        // dependant files
        /*
        $kekuleDir = qtype_kekule_chem_configs::getKekuleDir();
        $PAGE->requires->js($kekuleDir . 'raphael-min.js');
        $PAGE->requires->js($kekuleDir . 'Three.js');
        $PAGE->requires->js($kekuleDir . 'kekule/kekule.js?modules=io,chemWidget,algorithm&locals=zh');
        */
        kekulejs_utils::includeKekuleScriptFiles();
        $PAGE->requires->js('/question/type/kekule_chem_base/scripts/editForm.js');
        //$PAGE->requires->css($kekuleDir . 'kekule/themes/default/kekule.css');
        kekulejs_utils::includeKekuleCssFiles();
        $PAGE->requires->css('/question/type/kekule_chem_base/scripts/kekule_chem.css');

        parent::definition_inner($mform);

        // TODO: debug
        //$mform->addElement('html', '<script src="/moodle/question/type/kekule_chem_base/scripts/editForm.js"></script>');
    }
    protected function addQuestionFormControls($mform)
    {
        parent::addQuestionFormControls($mform);
        $mform->addElement('select', 'inputtype',
            get_string('captionMolInputType', 'qtype_kekule_chem_base'),
            array(
                qtype_kekule_chem_input_type::MOLECULE => get_string('molInputTypeMol', 'qtype_kekule_chem_base'),
                qtype_kekule_chem_input_type::DOCUMENT => get_string('molInputTypeDoc', 'qtype_kekule_chem_base')
            )
        );

        $mform->addElement('select', 'defcomparelevel',
            get_string('captionDefCompareLevel', 'qtype_kekule_chem_base'),
            array(
                //qtype_kekule_chem_compare_levels::DEF_LEVEL => get_string('molCompareLevelDefault', 'qtype_kekule_chem_base'),
                qtype_kekule_chem_compare_levels::CONFIGURATION => get_string('molCompareLevelConfiguration', 'qtype_kekule_chem_base'),
                qtype_kekule_chem_compare_levels::CONSTITUTION => get_string('molCompareLevelConstitution', 'qtype_kekule_chem_base')
            )
        );

        $mform->addElement('select', 'defcomparemethod',
            get_string('captionDefCompareMethod', 'qtype_kekule_chem_base'),
            array(
                qtype_kekule_chem_compare_methods::SMILES => get_string('molCompareMethodSmiles', 'qtype_kekule_chem_base'),
                //qtype_kekule_chem_compare_methods::MOLDATA => get_string('molCompareMethodMolData', 'qtype_kekule_chem_base'),
                qtype_kekule_chem_compare_methods::PARENTOF => get_string('molCompareMethodParentOf', 'qtype_kekule_chem_base'),
                qtype_kekule_chem_compare_methods::CHILDOF => get_string('molCompareMethodChildOf', 'qtype_kekule_chem_base')
            )
        );
    }

    protected function get_per_answer_fields($mform, $label, $gradeoptions,
                                             &$repeatedoptions, &$answersoption) {
        $result = parent::get_per_answer_fields($mform, $label, $gradeoptions, $repeatedoptions, $answersoption);

        $repeatedoptions['comparemethod']['type'] = PARAM_INT;
        $repeatedoptions['comparelevel']['default'] = qtype_kekule_chem_compare_levels::DEF_LEVEL;
        $repeatedoptions['comparemethod']['default'] = qtype_kekule_chem_compare_methods::DEF_METHOD;

        return $result;
    }

    /**
     * Get concrete form control for answer fields.
     * Descendants should override this method.
     */
    protected function getAnswerDataFormControls($mform, $label, $gradeoptions, $ansIndex)
    {
        $result = array();
        //$result[] = $mform->createElement('hidden', 'answer', '');
        //$result[] = $mform->createElement('text', 'answer', 'Answer', array('size' => 20));

        /*
        $compareMethod = $this->ansCompareMethods[$ansIndex];
        if ($compareMethod == qtype_kekule_chem_compare_methods::DEF_METHOD)
            $compareMethod = $this->defCompareMethod;
        */
        //$htmlWidgetClassName = qtype_kekule_chem_html::CLASS_MOL_BLANK;
        /*
        $widgetInputType = qtype_kekule_chem_input_type::MOLECULE;
        if ($this->inputType == qtype_kekule_chem_input_type::DOCUMENT)  // allow input document
        {
            //$htmlWidgetClassName = qtype_kekule_chem_html::CLASS_DOC_BLANK;
            $widgetInputType = qtype_kekule_chem_html::INPUT_TYPE_DOC;
        }
        */

        $result[] = $mform->createElement('textarea', 'answer', get_string('captionMolecule', 'qtype_kekule_chem_base'),
            'class="' . qtype_kekule_chem_html::CLASS_DESIGN_ANSWER_BLANK . '" data-widget-class="' . qtype_kekule_chem_html::CLASS_DESIGN_VIEWER_BLANK . '"');
            //. ' data-input-type="' . $widgetInputType . '"');
        /*
        $result[] = $mform->createElement('text', 'smiles',
            'SMILES', array('size' => 20));
        */

        $result[] = $mform->createElement('select', 'comparelevel',
            get_string('captionCompareLevel', 'qtype_kekule_chem_base'),
            array(
                qtype_kekule_chem_compare_levels::DEF_LEVEL => get_string('molCompareLevelDefault', 'qtype_kekule_chem_base'),
                qtype_kekule_chem_compare_levels::CONSTITUTION => get_string('molCompareLevelConstitution', 'qtype_kekule_chem_base'),
                qtype_kekule_chem_compare_levels::CONFIGURATION => get_string('molCompareLevelConfiguration', 'qtype_kekule_chem_base')
            )
        );

        $result[] = $mform->createElement('select', 'comparemethod',
            get_string('captionCompareMethod', 'qtype_kekule_chem_base'),
            array(
                qtype_kekule_chem_compare_methods::DEF_METHOD => get_string('molCompareMethodDefault', 'qtype_kekule_chem_base'),
                qtype_kekule_chem_compare_methods::SMILES => get_string('molCompareMethodSmiles', 'qtype_kekule_chem_base'),
                //qtype_kekule_chem_compare_methods::MANUAL => get_string('molCompareMethodManual', 'qtype_kekule_chem_base')
                //qtype_kekule_chem_compare_methods::MOLDATA => get_string('molCompareMethodMolData', 'qtype_kekule_chem_base'),
                qtype_kekule_chem_compare_methods::PARENTOF => get_string('molCompareMethodParentOf', 'qtype_kekule_chem_base'),
                qtype_kekule_chem_compare_methods::CHILDOF => get_string('molCompareMethodChildOf', 'qtype_kekule_chem_base')
            )
        );
        /*
        $result[] = $mform->createElement('select', 'inputtype',
            get_string('captionMolInputType', 'qtype_kekule_chem'),
            array(
                qtype_kekule_chem_compare_methods::SMILES => get_string('molInputTypeMol', 'qtype_kekule_chem'),
                qtype_kekule_chem_compare_methods::MANUAL => get_string('molInputTypeDoc', 'qtype_kekule_chem')
            )
        );
        */

        return $result;
    }

    public function validation($data, $files)
    {
        $errors = parent::validation($data, $files);
        //var_dump($data);
        // Check to ensure each answer is a validate JSON
        $answers = $data['answer'];
        foreach ($answers as $index => $answer)
        {
            $errorText = null;
            if (empty($answer))
            {
                //$errorText = get_string('errAnswerEmpty', 'qtype_kekule_chem_base', $index);
            }
            else
            {
                $json = json_decode($answer);
                if (is_null($json)) {
                    $errorText = get_string('errAnswerIllegal', 'qtype_kekule_chem_base', $index);
                }
                // check if molData/smiles fields are in answer
                else if (!isset($json->smiles) || !isset($json->molData)) {
                    $errorText = get_string('errAnswerMissingField', 'qtype_kekule_chem_base', $index);
                }
                /*
                echo 'isset', isset($json->smiles)? 'true': 'false', isset($json->molData)? 'true': 'false';
                var_dump($json);
                */
            }
            if (!empty($errorText)) {
                $errors['answeroptions[' . $index . ']'] = $errorText;
            }
        }

        return $errors;
    }

    public function qtype() {
        return 'kekule_chem_base';
    }
}
