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
 * Kekule Mol Naming question type backup handler
 *
 * @package    qtype_kekule_mol_naming
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot .
    '/question/type/kekule_multianswer/backup/moodle2/backup_qtype_kekule_multianswer_plugin.class.php');

/**
 * Provides the information to backup Kekule Mol Naming questions
 */
class backup_qtype_kekule_chem_base_plugin extends backup_qtype_kekule_multianswer_plugin {

    // override methods
    protected function _getPlugInElementConditionValue()
    {
        return 'kekule_chem_base';
    }
    protected function _getQuestionOptionNestedElemName()
    {
        return 'kekule_chem_base';
    }
    protected function _getQuestionOptionFieldNames()
    {
        $result = parent::_getQuestionOptionFieldNames();
        array_push($result, 'defcomparelevel', 'defcomparemethod', 'inputtype');
        return $result;
    }
    protected function _getQuestionOptionSrcTableName()
    {
        return 'qtype_kekulechem_options';
    }
    protected function _getQuestionAnswerOptionFieldNames()
    {
        $result = parent::_getQuestionAnswerOptionFieldNames();
        array_push($result, 'comparelevel', 'comparemethod');
        return $result;
    }
    protected function _getQuestionAnswerOptionSrcTableName()
    {
        return 'qtype_kekulechem_ans_ops';
    }
}
