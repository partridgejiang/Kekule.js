Kekule.js Moodle Extension 
===============================

This directory contains a plugin suite for integrating Kekule.js into the famous open source LMS Moodle. With the help of these plugins, students can practice with molecule structure based questions and easily input molecules in discussion posts.

Installation
------------------

Just copy all contents inside /moodle folder into the root directory of Moodle itself. Then launch Moodle site with a administrator account, and perform the regular update tasks.

After upgrading, you should check the settings of Moodle text editor (in Administration - Site administration - Plugins - Text editors). In "Manager editors" page (admin/settings.php?section=manageeditors), please make sure that Atto HTML editor is set to the default editor in Moodle. Then in Atto HTML editor - Atto toolbar settings page, add "kekulechem" button name to Toolbar config textarea (e.g. change "insert" line to "insert = equation, charmap, table, kekulechem").  Afterwards, a new button will be added to Atto Editor to enable direct molecule input in questions or discussion posts.

To support questions with partial-matching strategy, an extra node.js application should be run in server side. Just copy content inside /jsServer folder to your server, and run command line: node bin/www to launch the helper program. If the node.js application runs on a different server to Moodle, the URL of node.js program should be configured in Moodle (in Site administration - Plugins - Question types - Kekule Chem Base - Kekule Molecule Comparer Server URL). The defaule value is http://127.0.0.1:3000/mols, usually the path (/mols) and port (3000) need not to be changed, just replace 127.0.0.1 to the actual server address.

To display molecules inserted in discussion post, you have to add an hidden kekuleinjector block the course. In course home page, click on the "turn editing on" button to modify the course content, then in "Add block" panel to the bottom left, select and add "Kekule.js injector block". After that, configure the Kekule.js injector, set "Display on page types" to "Any page". At last, hide the block by clicking on "Hide Kekule.js injector block" in the configuration menu of the block. This block works in background, and need not to be displayed to users.

Plugins
-------------------

The whole suite includes the following plugins:

* local/kekulejs This local plugins import essential files of Kekule.js (including JavaScript/CSS files and some settings) into Moodle. It is required by all other plugins.
* question/type/kekule_multianswer A question type plugin. It is similar to shortanswer question type, but support more than one filling blanks.
* question/type/kekule_chem_manswer A question type plugin, inherting from kekule_multianswer, adding molecule editor to question to enable structure input.
* question/type/kekule_mol_naming A question type plugin, inherting from kekule_multianswer, can be used for organic molecule naming question. The text student input will be first standardized (erase unessential blanks, replacec some unstandardard characters) then compared with the answer. Note that this question type is currently optimized with Chineses names. For English name, there is much more work to be done.
* mod/quiz/report/kekulestatistics A statistics plugin for quiz mod, enable the displaying of molecule structures in quiz report.
* lib/editor/atto/plugins/kekulechem Atto editor plugin. Add a button the Atto editor UI, enables input chemical structures in Atto. Students can use it to submit post with molecules in disccusion boards.
* blocks/kekuleinjector A helper plugin, acutually an empty (and hidden) block. It cooperates with kekulechem Atto plugin. Administrator must add an hidden kekuleinjector block to their Moodle site to properly display chemical structures input by kekulechem Atto editor plugin.

