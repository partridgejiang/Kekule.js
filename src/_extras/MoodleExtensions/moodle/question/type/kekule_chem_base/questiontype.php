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
require_once($CFG->dirroot . '/question/type/kekule_multianswer/questiontype.php');
require_once($CFG->dirroot . '/question/type/kekule_chem_base/lib.php');
require_once($CFG->dirroot . '/question/type/kekule_chem_base/question.php');


/**
 * Class to represent a kekule_multianswer question answer, loaded from the question_answers table
 * in the database.
 */
class qtype_kekule_chem_base_answer extends qtype_kekule_multianswer_answer {
    public $comparelevel;
    public $comparemethod;
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
    public function __construct($id, $answer, $fraction, $feedback, $feedbackformat, $blankindex, $comparelevel, $comparemethod) {
        parent::__construct($id, $answer, $fraction, $feedback, $feedbackformat, $blankindex);
        $this->comparelevel = $comparelevel;
        $this->comparemethod = $comparemethod;
    }
}

/**
 * The Kekule Chem question type.
 */
class qtype_kekule_chem_base extends qtype_kekule_multianswer {
    public function menu_name() {
        /*
        return $this->local_name();
        */
        return false;  // abstract base class
    }
    public function can_analyse_responses() {
        return true;
    }

    public function extra_question_fields()
    {
        return array('qtype_kekulechem_options', 'manualgraded', 'defcomparelevel', 'defcomparemethod', 'inputtype');
    }
    public function extra_answer_fields() {
        return array('qtype_kekulechem_ans_ops', 'blankindex', /*'smiles', 'moldata',*/ 'comparelevel', 'comparemethod');
    }

    /*
    protected function initialise_question_instance(question_definition $question, $questiondata) {
        parent::initialise_question_instance($question, $questiondata);
    }
    */

    protected function createAnswerInstance($initParam)
    {
        $a = $initParam;
        return new qtype_kekule_chem_base_answer($a->id, $a->answer,
            $a->fraction, $a->feedback, $a->feedbackformat, $a->blankindex, $a->comparelevel, $a->comparemethod);
    }
}
