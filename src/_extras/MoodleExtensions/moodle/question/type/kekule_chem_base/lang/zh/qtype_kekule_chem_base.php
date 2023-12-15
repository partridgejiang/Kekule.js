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
 * Strings for component 'qtype_kekule_chem', language 'en', branch 'MOODLE_20_STABLE'
 *
 * @package    qtype
 * @subpackage YOURQTYPENAME
 * @copyright  THEYEAR YOURNAME (YOURCONTACTINFO)

 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
$string['pluginname'] = 'Kekule Chem Base';
$string['pluginname_help'] = 'Base question type about molecule structure';
$string['pluginname_link'] = 'question/type/kekule_chem_base';
$string['pluginnameadding'] = 'Adding a Kekule Chem Base question';
$string['pluginnameediting'] = 'Editing a Kekule Chem Base question';
$string['pluginnamesummary'] = 'A question type which allows the students to input chemistry structures as answers.';

// molecule or other chem object
$string['captionMolecule'] = '分子';
// compare method
$string['captionCompareMethod'] = '比较方法';
$string['captionDefCompareMethod'] = '默认比较方法';
$string['molCompareMethodDefault'] = '默认';
$string['molCompareMethodSmiles'] = '相同'; // 'SMILES';
$string['molCompareMethodMolData'] = '分子数据';
$string['molCompareMethodParentOf'] = '父结构'; //'Parent of';
$string['molCompareMethodChildOf'] = '子结构'; // 'Child of';
$string['molCompareMethodManual'] = '手工';
// compare level
$string['captionCompareLevel'] = '比较层级';
$string['captionDefCompareLevel'] = '默认比较层级';
$string['molCompareLevelDefault'] = '默认';
$string['molCompareLevelConstitution'] = '构造';
$string['molCompareLevelConfiguration'] = '构型';

// molecule input type
$string['captionMolInputType'] = '化学输入类型';
$string['molInputTypeMol'] = '分子';
$string['molInputTypeDoc'] = '文档';

// error messages
$string['errAnswerEmpty'] = '空白的回答：{$a}';
$string['errAnswerIllegal'] = '回答格式不正确：{$a}';
$string['errAnswerMissingField'] = '回答不完全：{$a}';
$string['externalMolComparerNotFound'] = 'External molecule comparer not found';

// string used in settings
/*
$string['captionKekuleDir'] = 'Kekule.js directory';
$string['descKekuleDir'] = 'Root directory that contains Kekule.js lib (and its dependant libs)';
*/
$string['captionJsServerUrl'] = 'Kekule分子比较服务器URL';
$string['descJsServerUrl'] = 'URL of the node.js application that compares molecule structures';
$string['captionMolComparerUrl'] = '分子比较服务器URL';
$string['descMolComparerUrl'] = 'URL of the node.js application that compares molecule structures';
