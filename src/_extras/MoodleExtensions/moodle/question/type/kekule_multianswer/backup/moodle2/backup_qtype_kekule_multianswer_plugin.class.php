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
 * Kekule Multianswer question type backup handler
 *
 * @package    qtype_kekule_multianswer
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Provides the information to backup Kekule Multianswer questions
 */
class backup_qtype_kekule_multianswer_plugin extends backup_qtype_plugin {
    // methods for descendants overriding
    protected function _getPlugInElementConditionValue()
    {
        return 'kekule_multianswer';
    }
    protected function _getQuestionOptionNestedElemName()
    {
        return 'kekule_multianswer';
    }
    protected function _getQuestionOptionFieldNames()
    {
        return array('manualgraded');
    }
    protected function _getQuestionOptionSrcTableName()
    {
        return 'qtype_kekule_manswer_ops';
    }
    protected function _getQuestionAnswerFieldNames()
    {
        return array('answertext', 'answerformat', 'fraction', 'feedback',
            'feedbackformat');
    }
    protected function _getQuestionAnswerOptionFieldNames()
    {
        return array('blankindex');
    }
    protected function _getQuestionAnswerOptionSrcTableName()
    {
        return 'qtype_kekule_manswer_ans_ops';
    }

    /**
     * Returns the qtype information to attach to question element
     */
    protected function define_question_plugin_structure() {

        // Define the virtual plugin element with the condition to fulfill.
        $plugin = $this->get_plugin_element(null, '../../qtype', $this->_getPlugInElementConditionValue());

        // Create one standard named plugin element (the visible container).
        $pluginwrapper = new backup_nested_element($this->get_recommended_name());

        // Connect the visible container ASAP.
        $plugin->add_child($pluginwrapper);

        // This qtype uses standard question_answers, add them here
        // to the tree before any other information that will use them.
        $this->add_question_question_answers($pluginwrapper);

        // Now create the qtype own structures.
        $multianswer = new backup_nested_element($this->_getQuestionOptionNestedElemName(), array('id'),
            $this->_getQuestionOptionFieldNames());

        // Now the own qtype tree.
        $pluginwrapper->add_child($multianswer);

        // Set source to populate the data.
        $multianswer->set_source_table($this->_getQuestionOptionSrcTableName(),
            array('questionid' => backup::VAR_PARENTID));

        // Don't need to annotate ids nor files.


        return $plugin;
    }

    /**
     * Attach to $element (usually questions) the needed backup structures
     * for question_answers for a given question
     * Used by various qtypes (calculated, essay, multianswer,
     * multichoice, numerical, shortanswer, truefalse)
     */
    protected function add_question_question_answers($element) {
        // Check $element is one nested_backup_element
        if (! $element instanceof backup_nested_element) {
            throw new backup_step_exception('question_answers_bad_parent_element', $element);
        }

        // Define the elements
        $answers = new backup_nested_element('answers');
        $answer = new backup_nested_element('answer', array('id'),
            $this->_getQuestionAnswerFieldNames());
        $answerOptions = new backup_nested_element('answerOptions', array('id'),
            $this->_getQuestionAnswerOptionFieldNames());

        // Build the tree
        $element->add_child($answers);
        $answers->add_child($answer);
        $answer->add_child($answerOptions);

        // Set the sources
        $answer->set_source_table('question_answers', array('question' => backup::VAR_PARENTID), 'id ASC');

        $answerOptions->set_source_table($this->_getQuestionAnswerOptionSrcTableName(), array('answerid' => backup::VAR_PARENTID));

        // Aliases
        $answer->set_source_alias('answer', 'answertext');

        // don't need to annotate ids nor files
    }
}
