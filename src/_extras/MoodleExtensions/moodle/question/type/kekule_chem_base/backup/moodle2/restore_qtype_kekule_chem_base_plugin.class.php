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
'/question/type/kekule_multianswer/backup/moodle2/restore_qtype_kekule_multianswer_plugin.class.php');

/**
 * Restore plugin class that provides the necessary information needed to restore one kekule multianswer qtype plugin
 */
class restore_qtype_kekule_chem_base_plugin extends restore_qtype_kekule_multianswer_plugin
{
    // methods for override of descendants
    protected function _getBackupElementName()
    {
        return 'kekule_chem_base';
    }
    protected function _getBackupElementCorePath()
    {
        return 'kekule_chem_base';  // we used get_recommended_name() so this works
    }

    protected function _getQuestionOptionSrcTableName()
    {
        return 'qtype_kekulechem_options';
    }
    protected function _getQuestionAnswerOptionSrcTableName()
    {
        return 'qtype_kekulechem_ans_ops';
    }

    public function process_kekule_chem_base($data) {
        return $this->_processQuestion($data);
    }
}