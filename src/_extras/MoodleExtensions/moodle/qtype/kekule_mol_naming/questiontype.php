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
require_once($CFG->dirroot . '/question/type/kekule_mol_naming/lib.php');
require_once($CFG->dirroot . '/question/type/kekule_mol_naming/question.php');


/**
 * The Kekule Chem question type.
 */
class qtype_kekule_mol_naming extends qtype_kekule_multianswer {
    public function menu_name() {
        return $this->local_name();
    }
    public function can_analyse_responses() {
        return true;
    }

    public function extra_question_fields()
    {
        return array('qtype_kekule_molname_ops', 'manualgraded', 'replaceunstandardchars', 'removespaces', 'ignorecase');
    }
    public function extra_answer_fields() {
        return array('qtype_kekule_molname_ansops', 'blankindex', 'standardizedname', 'namingtree');
    }

    protected function initialise_question_instance(question_definition $question, $questiondata) {
        $result = parent::initialise_question_instance($question, $questiondata);

        //var_dump($question);

        return $result;
    }
}
