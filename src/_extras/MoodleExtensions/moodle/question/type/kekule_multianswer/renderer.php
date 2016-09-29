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

//require_once($CFG->dirroot . '/question/type/shortanswer/renderer.php');

class qtype_kekule_multianswer_renderer extends qtype_with_combined_feedback_renderer {
    protected function getAnswerFieldName($key)
    {
        return 'answer' . $key;
    }
    /*
    public function head_code(question_attempt $qa) {
        global $PAGE, $CFG;
    }
    */
    public function formulation_and_controls(question_attempt $qa,
                                             question_display_options $options) {

        //var_dump($options);
        //die();
        $question = $qa->get_question();

        $response = $qa->get_last_qt_data();
        //var_dump($qa->get_last_step());
        //var_dump($response);
        //var_dump($question);
        /*
        //$currentAnswers = $qa->get_last_qt_var('answer');
        //var_dump($currentAnswers);
        */

        //var_dump($question);
        //die();

        //$inputBaseName = $qa->get_qt_field_name('answer');
        if ($options->correctness) {  // need to score the whole question first
            $question->grade_response($response);
            $correctResponse = $question->get_correct_response();
        }
        else
            $correctResponse = null;

        $result = '';
        $blankIndex = 0;
        $answers = array();

        foreach ($question->questionParts as $index => $subPart)
        {
            if ($subPart->role === qtype_kekule_multianswer_part::TEXT)  // normal text
            {
                $sPart = html_writer::span($subPart->content);
            }
            else if ($subPart->role === qtype_kekule_multianswer_part::BLANK)  // blank place holder
            {
                $answerFieldName = $this->getAnswerFieldName($blankIndex);
                $currentAnswer = $qa->get_last_qt_var($answerFieldName);
                $answers[$blankIndex] = $currentAnswer;
                $sPart = $this->getBlankHtml($blankIndex, $subPart, $currentAnswer, $question, $qa, $options, $correctResponse);
                ++$blankIndex;
                //if ($needFeedback)
                {
                    // todo: need to implement feedback here
                }
            }
            if (!empty($sPart))
                $result .= $sPart;
        }

        if ($qa->get_state() == question_state::$invalid) {
            $result .= html_writer::nonempty_tag('div',
                $question->get_validation_error($answers),
                array('class' => 'validationerror'));
        }

        return $result;
    }

    /**
     * Returns HTML string that represent a blank in question.
     * Descendants should override this method.
     * @param $blankIndex
     * @param $blank
     * @param $answer
     * @param $question
     * @param question_attempt $qa
     * @param question_display_options $options
     * @return string
     */
    protected function getBlankHtml($blankIndex, $blank, $answer, $question,
        question_attempt $qa, question_display_options $options, $correctResponse)
    {
        $answerFieldName = $this->getAnswerFieldName($blankIndex);
        $ctrlName = $qa->get_qt_field_name($answerFieldName);
        $inputAttributes = array(
            'type' => 'text',
            'name' => $ctrlName,
            'value' => $answer,
            'id' => $ctrlName,
            'size' => 40
        );
        if ($options->readonly) {
            $inputAttributes['readonly'] = 'readonly';
        }
        if ($options->correctness) {
            /*
            $ans = $correctResponse[$answerFieldName];
            if ($ans) {
                $ansText = $ans->answer;
                $fraction = $ans->fraction;
            }
            else
            {
                $ansText = '';
                $fraction = 0;
            }
            */
            // assume the question has been marked
            //var_dump($question->blanks[$blankIndex]);
            $fraction = $question->blanks[$blankIndex]->fraction;
            $inputattributes['class'] = $this->feedback_class($fraction);
            $feedbackimg = $this->feedback_image($fraction);
        }
        else
            $feedbackimg = '';
        $input = html_writer::empty_tag('input', $inputAttributes) . $feedbackimg; // . $feedbackimg;
        return $input;
    }

    public function correct_response(question_attempt $qa) {
        $sResults = array();
        $question = $qa->get_question();
        /*
        $correctRes = $question->get_correct_response();
        foreach($correctRes as $key=>$answer)
        {
            $sResults[$key] = $question->make_html_inline($answer);
        }
        */
        $correctRes = $question->getCorrectAnswers();
        foreach($correctRes as $key=>$answers)
        {
            $sAnswers = array();
            foreach ($answers as $answer)
            {
                $sAnswers[] = $this->correctResponseTextToHtml($qa, $question, $answer);
            }
            $sResults[$key] = $question->make_html_inline(implode(' / ', $sAnswers));
        }
        if (!empty($sResults)) {
            /*
            return get_string('correctAnswerIs', 'qtype_kekule_multianswer') . ' ' .
                implode(', ', $this->correctResponseTextsToHtml($qa, $question, $sResults));
            */
            return get_string('correctAnswerIs', 'qtype_kekule_multianswer') . ' ' .
            implode(', ', $sResults);
            //return get_string('correctanswers', 'qtype_shortanswer') . ' ' . implode(', ', $sResults);
        }
        else
            return '';
    }

    /**
     * Returns HTML code to wrap texts in "correct answer is“ block of question.
     * Descandants may override this method.
     * @param $qa
     * @param $question
     * @param $texts
     */
    /*
    protected function correctResponseTextsToHtml(question_attempt $qa, $question, $texts)
    {
        return $texts;
    }
    */
    /**
     * Returns HTML code to wrap text in "correct answer is“ block of question.
     * Descandants may override this method.
     * @param $qa
     * @param $question
     * @param $texts
     */
    protected function correctResponseTextToHtml(question_attempt $qa, $question, $text)
    {
        return $text;
    }

    public function specific_feedback(question_attempt $qa) {
        $question = $qa->get_question();
        $response = $qa->get_last_qt_data();
        $question->grade_response($response);

        $feedbacks = array();
        foreach($question->blanks as $blank)
        {
            $ans = $blank->matchAnswerKey;
            if (isset($ans) && !empty($ans->feedback))
                $feedbacks[] = $question->format_text($ans->feedback, $ans->feedbackformat,
                    $qa, 'question', 'answerfeedback', $ans->id);
        }

        if (empty($feedbacks))
            return '';
        else
            return implode('', $feedbacks);
    }
}
