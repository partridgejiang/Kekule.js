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
$string['pluginname'] = 'Kekule Molecule Naming';
$string['pluginname_help'] = 'Question to naming a orgnanic molecule';
$string['pluginname_link'] = 'question/type/kekule_mol_naming';
$string['pluginnameadding'] = 'Adding a Kekule Molecule Naming question';
$string['pluginnameediting'] = 'Editing a Kekule Molecule Naming question';
$string['pluginnamesummary'] = 'A question type which allows the students to name organic molecules.';

// settings
$string['captionStrReplacements'] = 'Text replacements';
$string['descStrReplacements'] = 'Each line is in A=B format, where string B will replace A in answer input';
$string['captionStereoFlags'] = 'Stereo flags';
$string['descStereoFlags'] = 'Stereo flags (e.g., R/S) in molecule name';
$string['captionStrictStereoFlags'] = 'Strict stereo flags';
$string['descStrictStereoFlags'] = 'If checked, the stereo section in name must matches the answer with or without brackets';
$string['captionRemoveSpaces'] = 'Remove spaces';
$string['descRemoveSpaces'] = 'Whether remove all spaces in answer input';
$string['captionReplaceUnstandardChars'] = 'Replace unstandard chars';
$string['descReplaceUnstandardChars'] = 'Whether replace all unstandard chars (e.g. full-width chars) to half-width ones in answer input';
$string['captionIgnoreCase'] = 'Ignore case in name';
$string['descIgnoreCase'] = 'Whether ignore lowercase or uppercase in molecule name';

$string['captionEnableCharSelector'] = '使用字符选择面板';
$string['descEnableCharSelector'] = 'Whether display a panel for selecting predefined characters';
$string['captionCharSelectorContent'] = '字符选择面板内容';
$string['descCharSelectorContent'] = 'Content of char selector panel. Each char should be separated with a blank and groups are divided with CR';

// text for widgets
$string['captionSelectorMolNamingChar'] = '选择字符';
$string['hintSelectorMolNamingChar'] = '打开字符选择面板';

$string['enableCharSelectorDefault'] = '默认';
$string['enableCharSelectorTrue'] = '是';
$string['enableCharSelectorFalse'] = '否';

// language related string consts
$string['defCharSelectorContent'] = <<<'STR_C'
一 二 三 四 五 六 七 八 九 十 百 千 单 双 重 壹 贰 叁 肆 
甲 乙 丙 丁 戊 己 庚 辛 壬 癸
烷 烯 炔 醇 酚 醚 醛 酮 酸 酰 酐 酯 胺 铵   
苯 萘 蒽 菲 吡 呋 啶 喃 咯 噻 吩 喹 啉 嘧 啶 咪 噁 唑 哒 嗪
磺 硝 氨 羟 巯 羧
氟 氯 溴 碘 氧 硫 氮 磷 硅 铝 镁 钠 锂   
正 异 新 伯 仲 叔 季 环 螺 代 
基 亚 叉 爪 次 
顺 反 E Z R S r s
, . - ( ) [ ]
1 2 3 4 5 6 7 8 9 0
α β γ δ ε ζ η θ ι κ λ μ ν ξ ο π ρ ς σ τ υ φ χ ψ ω
STR_C;