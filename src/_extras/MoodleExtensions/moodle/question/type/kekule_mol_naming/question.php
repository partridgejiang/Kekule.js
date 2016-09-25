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

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/question/type/questionbase.php');
require_once($CFG->dirroot . '/question/type/kekule_multianswer/question.php');
require_once($CFG->dirroot . '/question/type/kekule_mol_naming/lib.php');


/**
 * Represents a Kekule Chem question.
 */
class qtype_kekule_mol_naming_question extends qtype_kekule_multianswer_question {
    public $replaceunstandardchars;
    public $removespaces;
    public $ignorecase;

    protected function calcMatchingRatio($responseItem, $key)
    {
        return $this->_compareAnsString($responseItem, $key->answer);
    }
    private function _compareAnsString($src, $target)
    {
        /*
        $srcDetail = $this->parseAnswerString($src);
        $targetDetail = $this->parseAnswerString($target);
        */
        $nameSrc = $this->cleanNameText($src);
        $nameTarget = $this->cleanNameText($target);
        if ($this->ignorecase)
            $compResult = strcasecmp($nameSrc, $nameTarget);
        else
            $compResult = strcmp($nameSrc, $nameTarget);

        //echo $nameSrc, ' :: ',  $nameTarget, ' / ', $compResult, ' ', $compResult === 0, '<br />';

        return ($compResult === 0)? 1: 0;
    }

    /**
     * Remove unessential blanks and wrong chars in name text.
     * @param $text
     * @returns string
     */
    private function cleanNameText($text)
    {
        // TODO: unfinished
        $result = qtype_kekule_mol_naming_utils::cleanName($text, array(
            'replaceunstandardchars' => $this->replaceunstandardchars,
            'removespaces' => $this->removespaces
        ));
        return $result;
    }



}
