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
 * Question type class for the Kekule Chem question type.
 *
 * @package    qtype_kekule_chem
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */


defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/questionlib.php');
require_once($CFG->dirroot . '/question/engine/lib.php');
//require_once($CFG->dirroot . '/question/type/shortanswer/questiontype.php');
require_once($CFG->dirroot . '/question/type/kekule_multianswer/lib.php');
require_once($CFG->dirroot . '/question/type/kekule_multianswer/question.php');

/**
 * Class to represent a kekule_multianswer question answer, loaded from the question_answers table
 * in the database.
 */
class qtype_kekule_multianswer_answer extends question_answer {
    public $blankindex;
    /**
     * Constructor.
     * @param int $id the answer.
     * @param string $answer the answer.
     * @param int $answerformat the format of the answer.
     * @param number $fraction the fraction this answer is worth.
     * @param string $feedback the feedback for this answer.
     * @param int $feedbackformat the format of the feedback.
     * @param integer $blankindex
     */
    public function __construct($id, $answer, $fraction, $feedback, $feedbackformat, $blankindex) {
        parent::__construct($id, $answer, $fraction, $feedback, $feedbackformat);
        $this->blankindex = $blankindex;
    }
}


/**
 * The Kekule Chem question type.
 */
class qtype_kekule_multianswer extends question_type {
    public function extra_answer_fields() {
        //return parent::extra_answer_fields();
        return array('qtype_kekule_manswer_ans_ops', 'blankindex');
    }
    protected function is_extra_answer_fields_empty($questiondata, $key) {
        return false;
    }

    public function menu_name() {
        //return false;  // do not appear in question type list
        return true;
    }

    public function can_analyse_responses() {
        return true;
    }

    public function move_files($questionid, $oldcontextid, $newcontextid) {
        parent::move_files($questionid, $oldcontextid, $newcontextid);
        $this->move_files_in_answers($questionid, $oldcontextid, $newcontextid);
        $this->move_files_in_hints($questionid, $oldcontextid, $newcontextid);
    }

    protected function delete_files($questionid, $contextid) {
        parent::delete_files($questionid, $contextid);
        $this->delete_files_in_answers($questionid, $contextid);
        $this->delete_files_in_hints($questionid, $contextid);
    }

    public function get_question_options($question) {
        $result = parent::get_question_options($question);
        return $result;
    }

    public function save_question_options($question) {
        global $DB;
        $result = new stdClass();

        // Perform sanity checks on fractional grades.
        $maxfraction = -1;
        foreach ($question->answer as $key => $answerdata) {
            if ($question->fraction[$key] > $maxfraction) {
                $maxfraction = $question->fraction[$key];
            }
        }

        if ($maxfraction != 1) {
            $result->error = get_string('fractionsnomax', 'question', $maxfraction * 100);
            return $result;
        }

        parent::save_question_options($question);

        $this->save_question_answers($question);

        $this->save_hints($question);
    }

    protected function initialise_question_instance(question_definition $question, $questiondata) {
        parent::initialise_question_instance($question, $questiondata);

        $bodyText = $question->questiontext;

        $matchedCount = preg_match_all(qtype_kekule_multianswer_format::BLANK_PATTERN, $bodyText, $matches, /*PREG_PATTERN_ORDER*/PREG_OFFSET_CAPTURE);
          // got all sub parts

        /*
        // group all sub parts
        $groups = array();
        for ($i = 0; $i < $matchedCount; ++$i)
        {
            $groupName = trim($matches[1][$i]);
            if (empty($groupName))  // {{}}, no group name, a standalone part
            {
                $groupName = $i;
            }
            if (empty($groups[$groupName]))
                $groups[$groupName] = array();
            $groups[$groupName][] = $i;
        }
        $question->subGroups = $groups;
        $question->blankCount = $matchedCount;
        */
        // split all sub parts
        $groups = array();
        $subParts = array();
        $blanks = array();
        $scoreRatioSum = 0;
        $lastPos = 0;
        for ($i = 0; $i < $matchedCount; ++$i)
        {
            $pos = $matches[0][$i][1];
            // str before
            if ($pos > $lastPos)
            {
                $sPrev = substr($bodyText, $lastPos, $pos - $lastPos);
                $part = new stdClass();
                $part->role = qtype_kekule_multianswer_part::TEXT;
                $part->content = $sPrev;
                $subParts[] = $part;
            }
            $part = new stdClass();
            $part->role = qtype_kekule_multianswer_part::BLANK;
            $part->content = $matches[0][$i][0];

            $blankName = $matches[1][$i][0];
            $delimiterPos = strpos($blankName, qtype_kekule_multianswer_format::BLANK_DELIMITER);
            if ($delimiterPos !== false)
            {
                $groupName = substr($blankName, 0, $delimiterPos);
                $scoreRatio = intval(substr($blankName, $delimiterPos + 1));
                if ($scoreRatio == 0)
                    $scoreRatio = 1;
            }
            else
            {
                $groupName = $blankName;
                $scoreRatio = 1;
            }
            if (empty($groupName))  // {{}}, no group name, a standalone part
            {
                $groupName = $i;
            }
            $part->groupName = $groupName;
            $part->scoreRatio = $scoreRatio;
            $part->blankIndex = count($blanks);
            $scoreRatioSum += $scoreRatio;
            if (empty($groups[$groupName]))
                $groups[$groupName] = array();
            $groups[$groupName][] = $i;
            $subParts[] = $part;
            $blanks[] = $part;
            $lastPos = $pos + strlen($part->content);
        }
        // str after
        $totalLength = strlen($bodyText);
        if ($totalLength > $lastPos)
        {
            $sLast = substr($bodyText, $lastPos, $totalLength - $lastPos);
            $part = new stdClass();
            $part->role = qtype_kekule_multianswer_part::TEXT;
            $part->content = $sLast;
            $subParts[] = $part;
        }
        $question->subGroups = $groups;
        $question->blankCount = $matchedCount;
        $question->blanks = $blanks;
        $question->questionParts = $subParts;
        $question->scoreRatioSum = $scoreRatioSum;

        $this->initialise_question_answers($question, $questiondata);

        //var_dump($question);
        // group up answers by blank index
        foreach ($question->answers as $answer)
        {
            $blankIndex = $answer->blankindex;
            if (!array_key_exists($blankIndex, $question->answerKeyMap))
                $question->answerKeyMap[$blankIndex] = array($answer);
            else
                $question->answerKeyMap[$blankIndex][] = $answer;
        }
    }

    protected function initialise_question_answers(question_definition $question,
                                                   $questiondata, $forceplaintextanswers = true) {
        //parent::initialise_question_answers($question, $questiondata, $forceplaintextanswers);
        $question->answers = array();
        if (empty($questiondata->options->answers)) {
            return;
        }
        foreach ($questiondata->options->answers as $a) {
            $question->answers[$a->id] = new qtype_kekule_multianswer_answer($a->id, $a->answer,
                $a->fraction, $a->feedback, $a->feedbackformat, $a->blankindex);
            if (!$forceplaintextanswers) {
                $question->answers[$a->id]->answerformat = $a->answerformat;
            }
        }
        /*
        var_dump($question);
        var_dump($questiondata->options->answers);
        die();
        */
    }

    /*
    public function extra_answer_fields() {
        //return parent::extra_answer_fields();
        return array('qtype_kekule_chem_ans_options', 'smiles');
    }
    */

    public function get_possible_responses($questiondata)
    {
        $responses = array();
        $q = $this->make_question($questiondata);

        foreach($q->answerKeyMap as $index => $answers)
        {
            $subResponses = array();
            $subResponses[0] = new question_possible_response(
                get_string('didnotmatchanyanswer', 'question'), 0);
            foreach ($answers as $answer) {
                $subResponses[] = new question_possible_response($answer->answer, $answer->fraction);
            }
            $responses[$index] = $subResponses;
        }
        $responses[null] = question_possible_response::no_response();

        return $responses;
    }
}
