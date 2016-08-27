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

require_once($CFG->dirroot . '/question/type/shortanswer/edit_shortanswer_form.php');

class qtype_kekule_multianswer_edit_form extends qtype_shortanswer_edit_form {

    protected function data_preprocessing($question) {
        $question = parent::data_preprocessing($question);
        //var_dump($question);
        //var_dump($question->options);
        //die();

        return $question;
    }

    protected function definition_inner($mform) {
        global $PAGE, $CFG;

        // dependant files
        /*
        $PAGE->requires->js('/question/type/kekulemol/scripts/raphael-min.js');
        $PAGE->requires->js('/question/type/kekulemol/scripts/Three.js');
        $PAGE->requires->js('/question/type/kekulemol/scripts/kekule/kekule.js');
        $PAGE->requires->js('/question/type/kekulemol/scripts/editForm.js');
        $PAGE->requires->css('/question/type/kekulemol/scripts/kekule/themes/default/kekule.css');
        */

        //$mform->addElement('hidden', 'usecase', 1);
        $mform->addElement('static', 'answersinstruct',
            get_string('correctanswers', 'qtype_shortanswer'),
            get_string('filloutoneanswer', 'qtype_shortanswer'));
        $mform->closeHeaderBefore('answersinstruct');


        $this->add_per_answer_fields($mform, get_string('answerno', 'qtype_shortanswer', '{no}'),
                question_bank::fraction_options());

        $this->add_interactive_settings();
    }

    /**
     * Get the list of form elements to repeat, one for each answer.
     * @param object $mform the form being built.
     * @param $label the label to use for each option.
     * @param $gradeoptions the possible grades for each answer.
     * @param $repeatedoptions reference to array of repeated options to fill
     * @param $answersoption reference to return the name of $question->options
     *      field holding an array of answers
     * @return array of form fields.
     */
    protected function get_per_answer_fields($mform, $label, $gradeoptions,
                                             &$repeatedoptions, &$answersoption) {

        //var_dump($repeatedoptions);

        $repeated = array();
        $answeroptions = array();

        /*
        $answeroptions[] = $mform->createElement('text', 'answer',
            $label, array('size' => 40));
        */
        //$answeroptions[] = $mform->createElement('hidden', 'answer');

        /*
        $answeroptions[] = $mform->createElement('textarea', 'answer',
            $label, 'wrap="virtual" rows="20" cols="50"');
        */
        /*
        $answeroptions[] = $mform->createElement('text', 'answer',
            $label, array('size' => 80));
        */

        $ansDataCtrls = $this->getAnswerDataFormControls($mform, $label, $gradeoptions);
        if (!empty($ansDataCtrls))
        {
            $answeroptions = array_merge($answeroptions, $ansDataCtrls);
        }
        /*
        $answeroptions[] = $mform->createElement('html',
            '<div data-widget="Kekule.ChemWidget.Viewer2D" data-resizable="true"  data-predefined-setting="editOnly" data-enable-edit-from-void="true"></div>');
        //$answeroptions[] = $mform->createElement('html', '</div>');
        */

        $answeroptions[] = $mform->createElement('select', 'blankindex',
            get_string('answerIndex', 'qtype_kekule_multianswer'), array(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10));
        $answeroptions[] = $mform->createElement('select', 'fraction',
            get_string('grade'), $gradeoptions);

        $repeated[] = $mform->createElement('group', 'answeroptions',
            $label, $answeroptions, null, false);

        $repeated[] = $mform->createElement('editor', 'feedback',
            get_string('feedback', 'question'), array('rows' => 5), $this->editoroptions);
        $repeatedoptions['answer']['type'] = PARAM_RAW;
        $repeatedoptions['fraction']['default'] = 0;
        $repeatedoptions['blankindex']['type'] = PARAM_INT;
        $repeatedoptions['blankindex']['default'] = 0;
        $answersoption = 'answers';
        return $repeated;
    }

    /**
     * Get concrete form control for answer fields.
     * Descendants should override this method.
     */
    protected function getAnswerDataFormControls($mform, $label, $gradeoptions)
    {
        return array($mform->createElement('text', 'answer', $label, array('size' => 60)));
    }

    public function validation($data, $files) {
        $errors = parent::validation($data, $files);
        //var_dump($data['answer']);
        //var_dump($data->options->answers);
        //die();

        return $errors;
    }

    public function qtype() {
        return 'kekule_multianswer';
    }
}
