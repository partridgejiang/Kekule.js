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
 * Quiz statistics report class.
 *
 * @package   quiz_kekule_statistics
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/*
require_once($CFG->dirroot . '/mod/quiz/report/statistics/statistics_form.php');
require_once($CFG->dirroot . '/mod/quiz/report/statistics/statistics_table.php');
require_once($CFG->dirroot . '/mod/quiz/report/statistics/statistics_question_table.php');
require_once($CFG->dirroot . '/mod/quiz/report/statistics/statisticslib.php');
*/
require_once($CFG->dirroot . '/mod/quiz/report/statistics/report.php');
require_once($CFG->dirroot . '/mod/quiz/report/kekulestatistics/lib.php');
require_once($CFG->dirroot . '/mod/quiz/report/kekulestatistics/kekulestatistics_question_table.php');

/**
 * The quiz statistics report provides summary information about each question in
 * a quiz, compared to the whole quiz. It also provides a drill-down to more
 * detailed information about each question.
 */
class quiz_kekulestatistics_report extends quiz_statistics_report {
    public function print_header_and_tabs($cm, $course, $quiz, $reportmode = 'overview') {
        global $PAGE, $OUTPUT;

        // Add essential script and css
        $kekuleDir = quiz_kekulestatistics_configs::getKekuleDir();

        /*
        $PAGE->requires->js($kekuleDir . 'raphael-min.js');
        $PAGE->requires->js($kekuleDir . 'Three.js');
        $PAGE->requires->js($kekuleDir . 'kekule/kekule.js?modules=io,chemWidget,algorithm&locals=zh');
        $PAGE->requires->css($kekuleDir . 'kekule/themes/default/kekule.css');
        */
        kekulejs_utils::includeKekuleJsFiles();
        kekulejs_utils::includeKekuleCssFiles();

        parent::print_header_and_tabs($cm, $course, $quiz, $reportmode);
    }

    /**
     * Output question text in a box with urls appropriate for a preview of the question.
     *
     * @param object $question question data.
     * @return string HTML of question text, ready for display.
     */
    protected function render_question_text($question) {
        global $OUTPUT;

        $text = question_rewrite_question_preview_urls($question->questiontext, $question->id,
            $question->contextid, 'question', 'questiontext', $question->id,
            $this->context->id, 'quiz_kekulestatistics');

        return $OUTPUT->box(format_text($text, $question->questiontextformat,
            array('noclean' => true, 'para' => false, 'overflowdiv' => true)),
            'questiontext boxaligncenter generalbox boxwidthnormal mdl-align');
    }
    /*
    protected function output_quiz_structure_analysis_table($questionstats) {
        $tooutput = array();
        $limitvariants = !$this->table->is_downloading();
        foreach ($questionstats->get_all_slots() as $slot) {
            // Output the data for these question statistics.
            $tooutput = array_merge($tooutput, $questionstats->structure_analysis_for_one_slot($slot, $limitvariants));
        }
        $this->table->format_and_add_array_of_rows($tooutput);
    }
    */

    /**
     * Display the report.
     */
    public function display($quiz, $cm, $course) {
        global $OUTPUT;

        raise_memory_limit(MEMORY_HUGE);

        $this->context = context_module::instance($cm->id);

        if (!quiz_has_questions($quiz->id)) {
            $this->print_header_and_tabs($cm, $course, $quiz, 'statistics');
            echo quiz_no_questions_message($quiz, $cm, $this->context);
            return true;
        }

        // Work out the display options.
        $download = optional_param('download', '', PARAM_ALPHA);
        $everything = optional_param('everything', 0, PARAM_BOOL);
        $recalculate = optional_param('recalculate', 0, PARAM_BOOL);
        // A qid paramter indicates we should display the detailed analysis of a sub question.
        $qid = optional_param('qid', 0, PARAM_INT);
        $slot = optional_param('slot', 0, PARAM_INT);
        $variantno = optional_param('variant', null, PARAM_INT);
        $whichattempts = optional_param('whichattempts', $quiz->grademethod, PARAM_INT);
        $whichtries = optional_param('whichtries', question_attempt::LAST_TRY, PARAM_ALPHA);

        $pageoptions = array();
        $pageoptions['id'] = $cm->id;
        $pageoptions['mode'] = 'kekulestatistics';

        $reporturl = new moodle_url('/mod/quiz/report.php', $pageoptions);

        $mform = new quiz_statistics_settings_form($reporturl, compact('quiz'));

        $mform->set_data(array('whichattempts' => $whichattempts, 'whichtries' => $whichtries));

        if ($whichattempts != $quiz->grademethod) {
            $reporturl->param('whichattempts', $whichattempts);
        }

        if ($whichtries != question_attempt::LAST_TRY) {
            $reporturl->param('whichtries', $whichtries);
        }

        // Find out current groups mode.
        $currentgroup = $this->get_current_group($cm, $course, $this->context);
        $nostudentsingroup = false; // True if a group is selected and there is no one in it.
        if (empty($currentgroup)) {
            $currentgroup = 0;
            $groupstudents = array();

        } else if ($currentgroup == self::NO_GROUPS_ALLOWED) {
            $groupstudents = array();
            $nostudentsingroup = true;

        } else {
            // All users who can attempt quizzes and who are in the currently selected group.
            $groupstudents = get_users_by_capability($this->context,
                array('mod/quiz:reviewmyattempts', 'mod/quiz:attempt'),
                '', '', '', '', $currentgroup, '', false);
            if (!$groupstudents) {
                $nostudentsingroup = true;
            }
        }

        $qubaids = quiz_statistics_qubaids_condition($quiz->id, $groupstudents, $whichattempts);

        // If recalculate was requested, handle that.
        if ($recalculate && confirm_sesskey()) {
            $this->clear_cached_data($qubaids);
            redirect($reporturl);
        }

        // Set up the main table.
        $this->table = new quiz_statistics_table();
        if ($everything) {
            $report = get_string('completestatsfilename', 'quiz_statistics');
        } else {
            $report = get_string('questionstatsfilename', 'quiz_statistics');
        }
        $courseshortname = format_string($course->shortname, true,
            array('context' => context_course::instance($course->id)));
        $filename = quiz_report_download_filename($report, $courseshortname, $quiz->name);
        $this->table->is_downloading($download, $filename,
            get_string('quizstructureanalysis', 'quiz_statistics'));
        $questions = $this->load_and_initialise_questions_for_calculations($quiz);

        // Print the page header stuff (if not downloading.
        if (!$this->table->is_downloading()) {
            $this->print_header_and_tabs($cm, $course, $quiz, 'statistics');
        }

        if (!$nostudentsingroup) {
            // Get the data to be displayed.
            $progress = $this->get_progress_trace_instance();
            list($quizstats, $questionstats) =
                $this->get_all_stats_and_analysis($quiz, $whichattempts, $whichtries, $groupstudents, $questions, $progress);
        } else {
            // Or create empty stats containers.
            $quizstats = new \quiz_statistics\calculated($whichattempts);
            $questionstats = new \core_question\statistics\questions\all_calculated_for_qubaid_condition();
        }

        // Set up the table, if there is data.
        if ($quizstats->s()) {
            $this->table->statistics_setup($quiz, $cm->id, $reporturl, $quizstats->s());
        }

        // Print the rest of the page header stuff (if not downloading.
        if (!$this->table->is_downloading()) {

            if (groups_get_activity_groupmode($cm)) {
                groups_print_activity_menu($cm, $reporturl->out());
                if ($currentgroup && !$groupstudents) {
                    $OUTPUT->notification(get_string('nostudentsingroup', 'quiz_statistics'));
                }
            }

            if (!$this->table->is_downloading() && $quizstats->s() == 0) {
                echo $OUTPUT->notification(get_string('noattempts', 'quiz'));
            }

            foreach ($questionstats->any_error_messages() as $errormessage) {
                echo $OUTPUT->notification($errormessage);
            }

            // Print display options form.
            $mform->display();
        }

        if ($everything) { // Implies is downloading.
            // Overall report, then the analysis of each question.
            $quizinfo = $quizstats->get_formatted_quiz_info_data($course, $cm, $quiz);
            $this->download_quiz_info_table($quizinfo);

            if ($quizstats->s()) {
                $this->output_quiz_structure_analysis_table($questionstats);

                if ($this->table->is_downloading() == 'xhtml' && $quizstats->s() != 0) {
                    $this->output_statistics_graph($quiz->id, $currentgroup, $whichattempts);
                }

                $this->output_all_question_response_analysis($qubaids, $questions, $questionstats, $reporturl, $whichtries);
            }

            $this->table->export_class_instance()->finish_document();

        } else if ($qid) {
            // Report on an individual sub-question indexed questionid.
            if (is_null($questionstats->for_subq($qid, $variantno))) {
                print_error('questiondoesnotexist', 'question');
            }

            $this->output_individual_question_data($quiz, $questionstats->for_subq($qid, $variantno));
            $this->output_individual_question_response_analysis($questionstats->for_subq($qid, $variantno)->question,
                $variantno,
                $questionstats->for_subq($qid, $variantno)->s,
                $reporturl,
                $qubaids,
                $whichtries);
            // Back to overview link.
            echo $OUTPUT->box('<a href="' . $reporturl->out() . '">' .
                get_string('backtoquizreport', 'quiz_statistics') . '</a>',
                'boxaligncenter generalbox boxwidthnormal mdl-align');
        } else if ($slot) {
            // Report on an individual question indexed by position.
            if (!isset($questions[$slot])) {
                print_error('questiondoesnotexist', 'question');
            }

            if ($variantno === null &&
                ($questionstats->for_slot($slot)->get_sub_question_ids()
                    || $questionstats->for_slot($slot)->get_variants())) {
                if (!$this->table->is_downloading()) {
                    $number = $questionstats->for_slot($slot)->question->number;
                    echo $OUTPUT->heading(get_string('slotstructureanalysis', 'quiz_statistics', $number), 3);
                }
                $this->table->define_baseurl(new moodle_url($reporturl, array('slot' => $slot)));
                $this->table->format_and_add_array_of_rows($questionstats->structure_analysis_for_one_slot($slot));
            } else {
                $this->output_individual_question_data($quiz, $questionstats->for_slot($slot, $variantno));
                $this->output_individual_question_response_analysis($questions[$slot],
                    $variantno,
                    $questionstats->for_slot($slot, $variantno)->s,
                    $reporturl,
                    $qubaids,
                    $whichtries);
            }
            if (!$this->table->is_downloading()) {
                // Back to overview link.
                echo $OUTPUT->box('<a href="' . $reporturl->out() . '">' .
                    get_string('backtoquizreport', 'quiz_statistics') . '</a>',
                    'backtomainstats boxaligncenter generalbox boxwidthnormal mdl-align');
            } else {
                $this->table->finish_output();
            }

        } else if ($this->table->is_downloading()) {
            // Downloading overview report.
            $quizinfo = $quizstats->get_formatted_quiz_info_data($course, $cm, $quiz);
            $this->download_quiz_info_table($quizinfo);
            if ($quizstats->s()) {
                $this->output_quiz_structure_analysis_table($questionstats);
            }
            $this->table->finish_output();

        } else {
            // On-screen display of overview report.
            echo $OUTPUT->heading(get_string('quizinformation', 'quiz_statistics'), 3);
            echo $this->output_caching_info($quizstats->timemodified, $quiz->id, $groupstudents, $whichattempts, $reporturl);
            echo $this->everything_download_options();
            $quizinfo = $quizstats->get_formatted_quiz_info_data($course, $cm, $quiz);
            echo $this->output_quiz_info_table($quizinfo);
            if ($quizstats->s()) {
                echo $OUTPUT->heading(get_string('quizstructureanalysis', 'quiz_statistics'), 3);
                $this->output_quiz_structure_analysis_table($questionstats);
                $this->output_statistics_graph($quiz->id, $currentgroup, $whichattempts);
            }
        }

        return true;
    }

    /**
     * Display the response analysis for a question.
     *
     * @param object           $question  the question to report on.
     * @param int|null         $variantno the variant
     * @param int              $s
     * @param moodle_url       $reporturl the URL to redisplay this report.
     * @param qubaid_condition $qubaids
     * @param string           $whichtries
     */
    protected function output_individual_question_response_analysis($question, $variantno, $s, $reporturl, $qubaids,
                                                                    $whichtries = question_attempt::LAST_TRY) {
        global $OUTPUT;

        // check if question type is Kekule
        $isKekuleQuestion = strstr($question->qtype, 'kekule') !== false;

        if (!question_bank::get_qtype($question->qtype, false)->can_analyse_responses()) {
            return;
        }

        $qtable = new quiz_kekulestatistics_question_table($question->id);
        // if Kekule question, output response content directly, as we need to retain HTML tags for widget auto launch
        $qtable->rawOutputResponses = $isKekuleQuestion;

        $exportclass = $this->table->export_class_instance();
        $qtable->export_class_instance($exportclass);
        if (!$this->table->is_downloading()) {
            // Output an appropriate title.
            echo $OUTPUT->heading(get_string('analysisofresponses', 'quiz_statistics'), 3);

        } else {
            // Work out an appropriate title.
            $a = clone($question);
            $a->variant = $variantno;

            if (!empty($question->number) && !is_null($variantno)) {
                $questiontabletitle = get_string('analysisnovariant', 'quiz_statistics', $a);
            } else if (!empty($question->number)) {
                $questiontabletitle = get_string('analysisno', 'quiz_statistics', $a);
            } else if (!is_null($variantno)) {
                $questiontabletitle = get_string('analysisvariant', 'quiz_statistics', $a);
            } else {
                $questiontabletitle = get_string('analysisnameonly', 'quiz_statistics', $a);
            }

            if ($this->table->is_downloading() == 'xhtml') {
                $questiontabletitle = get_string('analysisofresponsesfor', 'quiz_statistics', $questiontabletitle);
            }

            // Set up the table.
            $exportclass->start_table($questiontabletitle);

            if ($this->table->is_downloading() == 'xhtml') {
                echo $this->render_question_text($question);
            }
        }

        $responesanalyser = new \core_question\statistics\responses\analyser($question, $whichtries);
        $responseanalysis = $responesanalyser->load_cached($qubaids, $whichtries);

        $qtable->question_setup($reporturl, $question, $s, $responseanalysis);
        if ($this->table->is_downloading()) {
            $exportclass->output_headers($qtable->headers);
        }

        // Where no variant no is specified the variant no is actually one.
        if ($variantno === null) {
            $variantno = 1;
        }
        foreach ($responseanalysis->get_subpart_ids($variantno) as $partid) {
            $subpart = $responseanalysis->get_analysis_for_subpart($variantno, $partid);
            //var_dump($subpart);
            foreach ($subpart->get_response_class_ids() as $responseclassid) {
                $responseclass = $subpart->get_response_class($responseclassid);
                //var_dump($responseclass);
                $tabledata = $responseclass->data_for_question_response_table($subpart->has_multiple_response_classes(), $partid);
                //var_dump($tabledata);
                foreach ($tabledata as $row) {
                    // transform possible Kekule responses strings
                    if ($isKekuleQuestion) {
                        //var_dump($row);
                        if (!empty($row->responseclass))
                            $row->responseclass = $this->transformKekuleResponse($row->responseclass);
                        if (!empty($row->response))
                            $row->response = $this->transformKekuleResponse($row->response);
                    }
                    $qtable->add_data_keyed($qtable->format_row($row));
                }
            }
        }

        $qtable->finish_output(!$this->table->is_downloading());
    }

    // Turn response text of Kekule type question to widget
    private function transformKekuleResponse($responseStr)
    {
        $s = trim($responseStr);
        $result = $s;
        if (strpos($s, '{') === 0 && strrpos($s, '}') === strlen($s) - 1)  // string surrounds with '{}', may be a json
        {
            try {
                $jsonObj = json_decode($s);
                if (isset($jsonObj) && isset($jsonObj->molData))
                {
                    //$molDataType = $jsonObj->molDataType;
                    $molData = $jsonObj->molData;
                    if (empty($molData))  // empty molecule
                    {
                        $result = '<span>' . get_string('emptyMolData', 'quiz_kekulestatistics') . '</span>';
                    }
                    else {
                        // replace all '"' to entity
                        $molData = htmlentities($molData);
                        $result = '<span data-widget="Kekule.ChemWidget.Viewer" data-predefined-setting="static" '
                            . 'data-chem-obj="' . $molData . '"></span>';
                    }
                }
            }
            catch(Exception $e)
            {
                // $s not json, not Kekule format, do not handle
            }
        }
        return $result;
    }
}
