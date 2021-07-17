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
 * Quiz statistics report, table for showing response analysis for a particular question (or sub question).
 *
 * @package   quiz_statistics
 * @copyright 2014 Open University
 * @author    James Pratt <me@jamiep.org>
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/tablelib.php');
require_once($CFG->dirroot . '/mod/quiz/report/statistics/statistics_question_table.php');

/**
 * This table shows statistics about a particular question.
 *
 * Lists the responses that students made to this question, with frequency counts.
 *
 * The responses may be grouped, either by sub-part of the question, or by the
 * answer they match.
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class quiz_kekulestatistics_question_table extends quiz_statistics_question_table {
    // Whether output content directly, with HTML tags inside it untouched
    public $rawOutputResponses = false;

    /**
     * If there is not a col_{column name} method then we call this method. If it returns null
     * that means just output the property as in the table raw data. If this returns none null
     * then this is the output for this cell of the table.
     *
     * @param string $colname  The name of this column.
     * @param object $response The raw data for this row.
     * @return string|null The value for this cell of the table or null means use raw data.
     */
    public function other_cols($colname, $response) {
        if (preg_match('/^trycount(\d+)$/', $colname, $matches)) {
            if (isset($response->trycount[$matches[1]])) {
                return $response->trycount[$matches[1]];
            } else {
                return 0;
            }
        } else if ($colname == 'part' || $colname == 'responseclass' || $colname == 'response') {
            if ($this->rawOutputResponses)
                return $response->$colname;
            else
                return s($response->$colname);
        } else {
            return null;
        }
    }
}
