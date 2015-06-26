To do
-----

* Write TestCase.assertIn(object, array) (or assertContains) -- assert object is in array, object has property, string has sub-string, etc
* Write TestCase.assertNotIn(object, array) (or assertNotContains) -- assert object is not in array, object does not have property, string does not have sub-string, etc
* Instead of trying to guess the correct file/line at which an error occurs, just display the entire stack trace, a-la django's error page
<br /><br />
Possibly display something like this at the end of a run

		=========================================================================
		(MyTestCase) testSomething: assertFalse: got true
		
		+-------------+--------+
		| filename    |   line |
		+-------------+--------+
		| jstest.js   |    340 |
		| tests.js    |     25 |
		+----------------------+
		=========================================================================
		(MyTestCase) testSomethingElse: assertNotHasProperty: object has prop ...
		
		+-------------+--------+
		| filename    |   line |
		+-------------+--------+
		| jstest.js   |    340 |
		| tests.js    |     25 |
		+----------------------+
		=========================================================================

* See about creating a test runner for rhino or something -- something that doesn't need to be run through an html file
* Look into creating a django error page-like html interface for stack traces where the lines for each file in the trace show up, and when you click on it (the line), it expands and shows you a few lines around that line.
* Add automated UI testing functionality
* Add asynchronous testing functionality
