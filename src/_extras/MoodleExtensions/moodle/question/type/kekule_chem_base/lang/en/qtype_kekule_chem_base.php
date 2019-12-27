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
$string['captionMolecule'] = 'Molecule';
// compare method
$string['captionCompareMethod'] = 'Comparison method';
$string['captionDefCompareMethod'] = 'Default comparison method';
$string['molCompareMethodDefault'] = 'Default';
$string['molCompareMethodSmiles'] = 'Equal'; // 'SMILES';
$string['molCompareMethodMolData'] = 'Mol data';
$string['molCompareMethodParentOf'] = 'Super structure'; //'Parent of';
$string['molCompareMethodChildOf'] = 'Sub structure'; // 'Child of';
$string['molCompareMethodManual'] = 'Manual';
// compare level
$string['captionCompareLevel'] = 'Comparison Level';
$string['captionDefCompareLevel'] = 'Default comparison level';
$string['molCompareLevelDefault'] = 'Default';
$string['molCompareLevelConstitution'] = 'Constitution';
$string['molCompareLevelConfiguration'] = 'Configuration';

// molecule input type
$string['captionMolInputType'] = 'Chemistry input type';
$string['molInputTypeMol'] = 'Molecule';
$string['molInputTypeDoc'] = 'Document';

// error messages
$string['errAnswerEmpty'] = 'Answer {$a} is empty';
$string['errAnswerIllegal'] = 'Answer {$a} is in illegal format';
$string['errAnswerMissingField'] = 'Answer {$a} is not complete';
$string['externalMolComparerNotFound'] = 'External molecule comparer not found';

// string used in settings
/*
$string['captionKekuleDir'] = 'Kekule.js directory';
$string['descKekuleDir'] = 'Root directory that contains Kekule.js lib (and its dependant libs)';
*/
$string['captionJsServerUrl'] = 'Kekule Molecule Comparer Server URL';
$string['descJsServerUrl'] = 'URL of the node.js application that compares molecule structures';
$string['captionMolComparerUrl'] = 'Molecule comparer URL';
$string['descMolComparerUrl'] = 'URL of the node.js application that compares molecule structures';
