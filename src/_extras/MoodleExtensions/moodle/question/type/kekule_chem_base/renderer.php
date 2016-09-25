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
 * YOURQTYPENAME question renderer class.
 *
 * @package    qtype
 * @subpackage YOURQTYPENAME
 * @copyright  THEYEAR YOURNAME (YOURCONTACTINFO)

 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */


defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/question/type/kekule_chem_base/lib.php');
require_once($CFG->dirroot . '/question/type/kekule_multianswer/renderer.php');

class qtype_kekule_chem_base_renderer extends qtype_kekule_multianswer_renderer {
    public function head_code(question_attempt $qa) {
        global $PAGE, $CFG;

        // dependant files
        $kekuleDir = qtype_kekule_chem_configs::getKekuleDir();
        /*
        $PAGE->requires->js($kekuleDir . 'raphael-min.js');
        $PAGE->requires->js($kekuleDir . 'Three.js');
        $PAGE->requires->js($kekuleDir . 'kekule/kekule.js?modules=io,chemWidget,algorithm&locals=zh');
        $PAGE->requires->js('/question/type/kekule_chem_base/scripts/render.js');
        */
        /*
        $PAGE->requires->css($kekuleDir . 'kekule/themes/default/kekule.css');
        */
        kekulejs_utils::includeKekuleCssFiles();
        $PAGE->requires->css('/question/type/kekule_chem_base/scripts/kekule_chem.css');

    }

    public function formulation_and_controls(question_attempt $qa,
                                             question_display_options $options)
    {
        global $PAGE, $CFG;

        // In some environment, method head_code will not be called (e.g., in quiz manual grade page),
        // so here we ensure the JS files are all loaded.
        // Mean while CSS can not be required in after body, that problem need to be resolved later.
        // dependant files
        /*
        $kekuleDir = qtype_kekule_chem_configs::getKekuleDir();
        $PAGE->requires->js($kekuleDir . 'raphael-min.js');
        $PAGE->requires->js($kekuleDir . 'Three.js');
        $PAGE->requires->js($kekuleDir . 'kekule/kekule.js?modules=io,chemWidget,algorithm&locals=zh');
        */
        kekulejs_utils::includeKekuleScriptFiles();
        $PAGE->requires->js('/question/type/kekule_chem_base/scripts/render.js');
        //$PAGE->requires->css($kekuleDir . 'kekule/themes/default/kekule.css');
        //$PAGE->requires->css('/question/type/kekule_chem_base/scripts/kekule_chem.css');

        $result = parent::formulation_and_controls($qa, $options);
        return $result;
        /*
        $sScript = html_writer::script(null, '/moodle/question/type/kekule_chem_base/scripts/render.js');
        return $result . $sScript;
        */
    }

    /**
     * Returns HTML string that represent a blank in question.
     * Descendants should override this method.
     * @param $blankIndex
     * @param $blank
     * @param string $ctrlName Default name of the form control.
     * @param question_attempt $qa
     * @param question_display_options $options
     * @return string
     */
    protected function getBlankHtml($blankIndex, $blank, $answer, $question,
                                    question_attempt $qa, question_display_options $options, $correctResponse)
    {
        $inputType = intval($question->inputtype);
        $widgetType = 'viewer';
        $htmlWidgetClassName = qtype_kekule_chem_html::CLASS_MOL_BLANK;
        $widgetInputType = qtype_kekule_chem_html::INPUT_TYPE_MOL;
        if ($inputType == qtype_kekule_chem_input_type::DOCUMENT)  // allow input document
        {
            /*
            $widgetType = 'composer';
            */
            $htmlWidgetClassName = qtype_kekule_chem_html::CLASS_DOC_BLANK;
            $widgetInputType = qtype_kekule_chem_html::INPUT_TYPE_DOC;
        }
        else // input single molecule, need to create viewer widget
        {

        }
        //var_dump($question);

        $answerFieldName = $this->getAnswerFieldName($blankIndex);
        $ctrlName = $qa->get_qt_field_name($answerFieldName);

        $inputElemAttributes = array(
            'type' => 'hidden',
            'name' => $ctrlName,
            'value' => $answer,
            'id' => $ctrlName,
            'class' => qtype_kekule_chem_html::CLASS_BLANK_ANSWER
            /*'size' => 40*/
        );
        $chemElemAttributes = array(
            'data-preferWidget' => $widgetType,
            'data-name' => $ctrlName,
            'value' => $answer,
            'class' => qtype_kekule_chem_html::CLASS_BLANK,
            'data-widget-class' => $htmlWidgetClassName,
            'data-input-type' => $widgetInputType
        );
        if ($options->readonly) {
            $inputElemAttributes['readonly'] = 'readonly';
            $chemElemAttributes['data-predefined-setting'] = 'static';
        }
        else
            $chemElemAttributes['data-predefined-setting'] = 'editOnly';
        if ($options->correctness) {
            $fraction = $question->blanks[$blankIndex]->fraction;
            $inputElemAttributes['class'] .= ' ' . $this->feedback_class($fraction);
            $chemElemAttributes['class'] .= ' ' . $this->feedback_class($fraction);
            $feedbackimg = $this->feedback_image($fraction);
        }
        else
            $feedbackimg = '';

        /*
        $result = html_writer::start_tag('span', $chemElemAttributes);
        $result .= html_writer::end_tag('span');
        */
        $result = html_writer::span('', '', $chemElemAttributes);
        $result .= html_writer::start_tag('input', $inputElemAttributes);
        $result .= html_writer::end_tag('input');
        $result .= $feedbackimg;
        /*
        $result .= parent::getBlankHtml($blankIndex, $blank, $answer, $question,
            $qa, $options, $correctResponse);
        */
        return $result;
    }

    /*
    protected function correctResponseTextsToHtml(question_attempt $qa, $question, $texts)
    {
        $result = array();
        foreach ($texts as $key => $text)
        {
            $ansDetail = $question->parseAnswerString($text);
            // create auto launch viewer widget
            $attr = array(
                'data-widget' => 'Kekule.ChemWidget.Viewer',
                'data-auto-size' => 'true',
                'data-predefined-setting' => 'static'
            );
            if (!empty($ansDetail->molData))
                $attr['data-chem-obj'] = $ansDetail->molData;
            $html = html_writer::span('', qtype_kekule_chem_html::CLASS_CORRECT_RESPONSE, $attr);
            $result[$key] = $html;
        }
        return $result;
    }
    */
    protected function correctResponseTextToHtml(question_attempt $qa, $question, $text)
    {
        $ansDetail = $question->parseAnswerString($text);
        // create auto launch viewer widget
        $attr = array(
            'data-widget' => 'Kekule.ChemWidget.Viewer',
            'data-auto-size' => 'true',
            'data-predefined-setting' => 'static'
        );
        if (!empty($ansDetail->molData))
            $attr['data-chem-obj'] = $ansDetail->molData;
        $html = html_writer::span('', qtype_kekule_chem_html::CLASS_CORRECT_RESPONSE, $attr);
        return $html;
    }
}
