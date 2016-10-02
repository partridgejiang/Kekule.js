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
require_once($CFG->dirroot . '/question/type/kekule_chem_base/lib.php');


/**
 * Represents a Kekule Chem question.
 */
class qtype_kekule_chem_base_question extends qtype_kekule_multianswer_question {
    public $defcomparemethod;
    public $inputtype;

    protected function isBasedOnSmiles($compareMethod)
    {
        $method = $compareMethod;
        /*
        if ($method == qtype_kekule_chem_compare_methods::DEF_METHOD)
            $method = $this->defcomparemethod;
        if ($method == qtype_kekule_chem_compare_methods::DEF_METHOD)
            $method = qtype_kekule_chem_compare_methods::SMILES;
        */
        return $method == qtype_kekule_chem_compare_methods::SMILES;
    }

    protected function getAnsCompareMethod($answer)
    {
        if (isset($answer->comparemethod))
            $result = $answer->comparemethod;
        else
            $result = qtype_kekule_chem_compare_methods::DEF_METHOD;
        if ($result === qtype_kekule_chem_compare_methods::DEF_METHOD)  // use question setting
            $result = $this->defcomparemethod;

        return $result;
    }
    protected function calcMatchingRatio($responseItem, $key)
    {
        return $this->_compareMolAnsString($responseItem, $key->answer, $this->getAnsCompareMethod($key));
    }
    private function _getComparerPath($compareMethod)
    {
        return ($compareMethod == qtype_kekule_chem_compare_methods::PARENTOF)? qtype_kekule_chem_configs::PATH_CONTAIN:
            ($compareMethod == qtype_kekule_chem_compare_methods::CHILDOF)? qtype_kekule_chem_configs::PATH_CONTAIN:
            qtype_kekule_chem_configs::PATH_COMPARE;
    }
    private function _compareMolAnsString($src, $target, $compareMethod)
    {
        $srcDetail = $this->parseAnswerString($src);
        $targetDetail = $this->parseAnswerString($target);

        if ($this->isBasedOnSmiles($compareMethod))
        {
            if (!empty($srcDetail->smiles) && !empty($targetDetail->smiles))
                return (strcmp($srcDetail->smiles, $targetDetail->smiles) == 0)? 1: 0;
            else
                return 0;
        }
        else  // based on molData
        {
            if (empty($srcDetail->molData) || empty($targetDetail->molData))
                return 0;

            //$externalComparerUrl = get_config('mod_qtype_kekule_chem', 'mol_comparer_url');
            $externalComparerUrl = get_config('mod_qtype_kekule_chem', 'js_server_url');
            //$comparePath = ($compareMethod == );
            //$compareUrl = $externalComparerUrl .
            if (empty($externalComparerUrl))
                //$externalComparerUrl = qtype_kekule_chem_configs::DEF_MOL_COMPARER_URL;
                $externalComparerUrl = qtype_kekule_chem_configs::DEF_JS_SERVER_URL;
            if (empty($externalComparerUrl))
                throw new Exception(get_string('externalMolComparerNotFound', 'qtype_kekule_chem_base'));
            else  // compare externally
            {
                $comparePath = $this->_getComparerPath($compareMethod);
                $externalComparerUrl .= $comparePath;
                $ops = new stdClass();
                $ops->level = 3;  // Kekule.StructureComparationLevel.CONFIGURATION // TODO: now fixed
                if ($compareMethod == qtype_kekule_chem_compare_methods::CHILDOF)
                    $ops->reversed = true;
                $postData = array(
                    'options' => json_encode($ops),
                    'sourceMol' => $srcDetail->molData,
                    'targetMol' => $targetDetail->molData
                );
                $resultData = qtype_kekule_chem_utils::postData($externalComparerUrl, $postData);
                $result = json_decode($resultData);
                if (!empty($result->error))
                {
                    //throw new Exception($result->error);
                    return 0;

                }
                else
                {
                    return $result->result? 1: 0;
                }
            }
        }
    }
    public function parseAnswerString($ans)
    {
        if (empty($ans))
            $result = new stdClass();
        else
            $result = json_decode($ans);
        if (!is_object($result))
            $result = new stdClass();
        if (!isset($result -> smiles))
            $result->smiles = '';
        if (!isset($result->molData))
            $result->molData = '';
        return $result;
    }

    /*
    public function get_correct_response() {
        $correctSet = $this->getCorrectAnswerSet();
        $response = array();
        for ($i = 0; $i < $this->blankCount; ++$i)
        {
            $ansString = $correctSet[$i]->answer;
            //$response[$this->getAnswerFieldName($i)] = $html;
            $response[$this->getAnswerFieldName($i)] = $ansString;  //->molData;
        }
        return $response;
    }
    */
}
