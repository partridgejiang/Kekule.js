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
 * Kekule Multianswer question type restore handler
 *
 * @package    qtype_ordering
 * @copyright  2013 Gordon Bateson (gordon.bateson@gmail.com)
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Restore plugin class that provides the necessary information needed to restore one kekule multianswer qtype plugin
 */
class restore_qtype_kekule_multianswer_plugin extends restore_qtype_plugin {

    // methods for override of descendants
    protected function _getBackupElementName()
    {
        return 'kekule_multianswer';
    }
    protected function _getBackupElementCorePath()
    {
        return 'kekule_multianswer';  // we used get_recommended_name() so this works
    }
    protected function _getAnswerOptionElementName()
    {
        return 'answerOptions';
    }
    protected function _getAnswerOptionElementCorePath()
    {
        return '/answers/answer/answerOptions';  // we used get_recommended_name() so this works
    }

    protected function _getQuestionOptionSrcTableName()
    {
        return 'qtype_kekule_manswer_ops';
    }
    protected function _getQuestionAnswerOptionSrcTableName()
    {
        return 'qtype_kekule_manswer_ans_ops';
    }

    protected function _processQuestion($data)
    {
        global $DB;

        $data = (object)$data;
        $oldid = $data->id;

        // Detect if the question is created or mapped.
        $oldquestionid   = $this->get_old_parentid('question');
        $newquestionid   = $this->get_new_parentid('question');
        $questioncreated = $this->get_mappingid('question_created', $oldquestionid) ? true : false;

        // If the question has been created by restore, we need to create its
        // qtype_shortanswer_options too, if they are defined (the gui should ensure this).
        if ($questioncreated) {
            $data->questionid = $newquestionid;

            // It is possible for old backup files to contain unique key violations.
            // We need to check to avoid that.
            $answerOptionsTableName = $this->_getQuestionOptionSrcTableName();
            if (!$DB->record_exists($answerOptionsTableName, array('questionid' => $data->questionid))) {
                $newitemid = $DB->insert_record($answerOptionsTableName, $data);
                $this->set_mapping($answerOptionsTableName, $oldid, $newitemid);
            }
        }
    }
    protected function _processQuestionAnswerOptions($data)
    {
        global $DB;

        $data = (object)$data;
        $oldid = $data->id;

        // Detect if the answer is created or mapped.
        $oldAnswerId   = $this->get_old_parentid('question_answer');
        $newAnswerId   = $this->get_new_parentid('question_answer');

        //echo $oldAnswerId . ' : ' . $newAnswerId;
        //die();

        $answerCreated = $this->get_mappingid('question_answer', $oldAnswerId) ? true : false;

        // If the answer has been created by restore, we need to create its
        // qtype_kekule_manswer_ans_ops too, if they are defined (the gui should ensure this).
        if ($answerCreated) {
            $data->answerid = $newAnswerId;

            //var_dump($data);
            //die();

            // It is possible for old backup files to contain unique key violations.
            // We need to check to avoid that.
            $tableName = $this->_getQuestionAnswerOptionSrcTableName();
            if (!$DB->record_exists($tableName, array('answerid' => $data->answerid))) {
                $newitemid = $DB->insert_record($tableName, $data);
                $this->set_mapping($tableName, $oldid, $newitemid);
            }
        }
    }

    /**
     * Returns the paths to be handled by the plugin at question level
     */
    protected function define_question_plugin_structure() {

        $paths = array();

        // This qtype uses question_answers, add them.
        $this->add_question_question_answers($paths);

        // Add own qtype stuff.
        $elename = $this->_getBackupElementName();  //'kekule_multianswer';

        $elepath = $this->get_pathfor($this->_getBackupElementCorePath());
        $paths[] = new restore_path_element($elename, $elepath);

        $elename = $this->_getAnswerOptionElementName();
        $elepath = $this->get_pathfor($this->_getAnswerOptionElementCorePath());
        $paths[] = new restore_path_element($elename, $elepath);

        return $paths; // And we return the interesting paths.
    }

    /**
     * Process the qtype/kekule_multianswer element
     *
     * @param array $data
     */
    public function process_kekule_multianswer($data) {
       return $this->_processQuestion($data);
    }

    public function process_answerOptions($data)
    {
        return $this->_processQuestionAnswerOptions($data);
    }
}
