Question type template
----------------------

A simple question type template.

It is a copy of the shortanswer question type with everything unnecessary removed and :

* countback grading
* hints
* question text
* no grading implemented at all
* no input controls at all in question as yet
* it doesn't install any new tables

###Who should use


This is one alternative start for devloping a question type plug in and is working code as is. Although it doesn't do any actual
grading or collect student input at all.

Depending on what type of question plug in you want to develope it might be good to either :

* use one of the existing question types that is doing something similar to what you want to do as a base, copy that,
have fun deleting no longer needed code and you then have a template to start from.
* or if possible to avoid code duplication it is better to extend existing classes, particularly for the question type and
question classes. There are quite a few examples of queston types that do this at https://github.com/moodleou/.
        for example classes in ddimageortext and ddmarker both inherit from common code in ddimageortext and those inherit code from the gapselect question type
* or this code might help start you off.


###Installation

####Installation Using Git 

To install using git for the latest version (the master branch), type this command in the
root of your Moodle install:

    git clone git://github.com/jamiepratt/moodle-qtype_TEMPLATE.git question/type/TEMPLATE
    echo '/question/type/TEMPLATE' >> .git/info/exclude

####Installation From Downloaded zip file

Alternatively, download the zip from :

* latest (master branch) - https://github.com/jamiepratt/moodle-qtype_TEMPLATE/zipball/master

unzip it into the question/type folder, and then rename the new folder to TEMPLATE.

####Doesn't get installed as long as it is called TEMPLATE

You can keep a copy of the template in Moodle in the question/type/ folder and as long as it is called TEMPLATE the plug in will
be ignored.

###Use


* Copy or rename the module directory to YOURQTYPENAME.
* Replace all occurances of YOURQTYPENAME in files with the new name for your question type.
* Rename files that have YOURQTYPENAME replacing YOURQTYPENAME with the new name for your question type.
* Replace '@copyright  THEYEAR YOURNAME (YOURCONTACTINFO)' with something like @copyright  2013 Jamie Pratt (me@jamiep.org)
* See http://docs.moodle.org/dev/Question_types for more info on how to create a question type plug in. Please add to it where
 you can.