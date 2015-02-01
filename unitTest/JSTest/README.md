*Note: So far, JSTest has been tested in Firefox 3, Safari 4 and Camino on Mac OS X*

Overview
--------

JSTest is an easy-to-use, non-polluting JavaScript unit testing framework.

JSTest works kind of like python's unittest module, in that JSTest knows about all the test cases you define and can run them all at once. You can also run a test case by itself.

To use JSTest, you simply define your test cases, and run them. Your results will show up in different places, depending on which output handler you're using (the default output handler is FirebugHandler, so your results will show up in Firebug if it's installed and enabled -- see **Output Handlers** at the end of this document).

Actually running JSTest is simple. First, include JSTest in your HTML

	<script type="text/javascript" src="jstest.js"></script>

then include your tests

	<script type="text/javascript" src="tests.js"></script>

then run your tests

	JSTest.run() // terse mode
	JSTest.run(true) // verbose mode

Test Cases
----------

Test cases are collections of tests with a little bit of extra logic. When defining test cases in JSTest, you can specify a custom name for the test case and a few setup/cleanup functions. Here's what a test case looks like

	var MyTestCase = JSTest.TestCase({
		name: 'My Custom Test Case Name',
		
		init: function () {
			// this is called only once, before any tests are run
		},
		
		setup: function () {
			// this is called before every test
		},
		
		cleanup: function () {
			// this is called after every test
		},

		teardown: function () {
			// this is called only once, after all tests have been run
		},
		
		testSomething: function () {
			// this is a test
		},
		
		testSomethingElse: function () {
			// this is another test
		}
	});

Example Tests
-------------

See **/src/tests/tests.js** for some example test cases.

To run the example tests do this from the project root:

<code>
rake test
</code>

You need [rake][0] for this.

Assertions
----------

JSTest comes with whole bunch of assertion methods that you can use in your tests. Here's a full list

* **assert** *(pass, message, customMessage)*
	<br /><small>The generic assertion method. If pass !== true throw an error with the given message and an optional user-defined message.</small>
	<br /><br />
* **assertTrue** *(value, customMessage)*
	<br /><small>Asserts that 'value' is true.</small>
	<br /><br />
* **assertFalse** *(value, customMessage)*
	<br /><small>Asserts that 'value' is false.</small>
	<br /><br />
* **assertEqual** *(value1, value2, customMessage)*
	<br /><small>Asserts that 'value1' and 'value2' are equal in value.</small>
	<br /><br />
* **assertNotEqual** *(value1, value2, customMessage)*
	<br /><small>Asserts that 'value1' and 'value2' are not equal in value.</small>
	<br /><br />
* **assertMatch** *(regex, value, customMessage)*
	<br /><small>Asserts that 'regex' matches 'value'.</small>
	<br /><br />
* **assertNotMatch** *(regex, value, customMessage)*
	<br /><small>Asserts that 'regex' matches 'value'.</small>
	<br /><br />
* **assertType** *(value, type, customMessage)*
	<br /><small>Asserts that 'value' has the type specified by 'type'.</small>
	<br /><br />
* **assertNotType** *(value, type, customMessage)*
	<br /><small>Asserts that 'value' does not have the type specified by 'type'.</small>
	<br /><br />
* **assertSameType** *(value1, value2, customMessage)*
	<br /><small>Asserts that 'value1' has the same type as 'value2'.</small>
	<br /><br />
* **assertNotSameType** *(value1, value2, customMessage)*
	<br /><small>Asserts that 'value1' does not have the same type as 'value2'.</small>
	<br /><br />
* **assertInstanceOf** *(value, class, customMessage)*
	<br /><small>Asserts that 'value' is an instance of 'class'.</small>
	<br /><br />
* **assertNotInstanceOf** *(value, class, customMessage)*
	<br /><small>Asserts that 'value' is not an instance of 'class'.</small>
	<br /><br />
* **assertNull** *(value, customMessage)*
	<br /><small>Asserts that 'value' is null.</small>
	<br /><br />
* **assertNotNull** *(value, customMessage)*
	<br /><small>Asserts that 'value' is null.</small>
	<br /><br />
* **assertUndefined** *(value, customMessage)*
	<br /><small>Asserts that 'value' is undefined.</small>
	<br /><br />
* **assertNotUndefined** *(value, customMessage)*
	<br /><small>Asserts that 'value' is undefined.</small>
	<br /><br />
* **assertNaN** *(value, customMessage)*
	<br /><small>Asserts that isNaN(value) returns true.</small>
	<br /><br />
* **assertNotNaN** *(value, customMessage)*
	<br /><small>Asserts that isNaN(value) returns false.</small>
	<br /><br />
* **assertGreaterThan** *(value1, value2, customMessage)*
	<br /><small>Asserts that 'value1' is greater than 'value2'.</small>
	<br /><br />
* **assertLessThan** *(value1, value2, customMessage)*
	<br /><small>Asserts that 'value1' is less than 'value2'.</small>
	<br /><br />
* **assertGreaterThanOrEqual** *(value1, value2, customMessage)*
	<br /><small>Asserts that 'value1' is greater than or equal to 'value2'.</small>
	<br /><br />
* **assertLessThanOrEqual** *(value1, value2, customMessage)*
	<br /><small>Asserts that 'value1' is less than or equal to 'value2'.</small>
	<br /><br />
* **assertRaises** *(ErrorClass, func, customMessage, ...)*
	<br /><small>Asserts that 'func' raises an exception of type 'ErrorClass' when called with the rest of the arguments passed in.</small>
	<br /><br />
* **assertNotRaises** *(ErrorClass, func, customMessage, ...)*
	<br /><small>Asserts that 'func' does not raise an exception of type 'ErrorClass' when called with the rest of the arguments passed in.</small>
	<br /><br />
* **assertHasProperty** *(object, property, customMessage)*
	<br /><small>Asserts that 'object' has a property named by 'property'.</small>
	<br /><br />
* **assertNotHasProperty** *(object, property, customMessage)*
	<br /><small>Asserts that 'object' does not have a property named by 'property'.</small>
	<br /><br />
* **assertEmpty** *(object, customMessage)*
	<br /><small>Asserts that 'object' is empty. That means it's an empty array, an empty string, null, or undefined.</small>
	<br /><br />
* **assertNotEmpty** *(object, customMessage)*
	<br /><small>Asserts that 'object' is not empty.</small>
	<br /><br />

*Note: The wording is a little weird on some of these methods, like `assertNotRaises` and `assertNotHasProperty`. These methods were named how they were for 'consistency', but they may change in the future.*

Every core assertion method takes a custom error message as its last parameter, which will be displayed in the test results if it causes the test to fail. Use this if you feel it will help you figure out why a test failed.


FAILs
-----

If you need to explicitly fail a test for whatever reason, you can do so with TestCase.fail(). Example

	var MyTestCase = new JSTest.TestCase({
		testSomething: function () {
			if (something && (somethingElse || other))
				this.fail("This shouldn't happen");
		},
	});

The FirebugHandler output looks like this

	testSomething failed: FAIL: This shouldn't happen

TODOs
-----

If you're not done writing your tests, or there's just something left to care care of, you can throw a todo into any test, which will cause it to fail and show your message in the test results

	var MyTestCase = new JSTest.TestCase({
		testSomething: function () {
			this.todo('Need to write this test');
		},
	});

The FirebugHandler output looks like this

	testSomething failed: TODO: Need to write this test


Custom Assertion Methods
------------------------

JSTest gives you the flexibility of defining your own custom assertion methods (and even overriding core assertion methods if you really want to). You can do that one of two ways. You can specify your custom methods in your test case

	var YourTestCase = new JSTest.TestCase({
		assertEqual: function (value1, value2) {
			// your custom equality assertion code
		},
		
		testSomething: function () {
			// uses your custom assertEqual method
			this.assertEqual(..., ...);
		}
	});

or you can use `JSTest.setCustomAssertMethods` like this

	JSTest.setCustomAssertMethods({
		assertSomething: function (value, customMessage) {
			// custom assertion code
		}
	});

which extends `JSTest.customAssertMethods` with the object you pass in.

**One important thing to note** with `JSTest.customAssertMethods` is that if you want to take advantage of those methods in your test cases, they must be set *before* you define your test cases.

Output Handlers
---------------

You can customize how JSTest reports the results of your tests without modifying the JSTest core by using output handlers. An output handler is just an object that defines a few specific methods that JSTest expects during certain events, like when starting a test or reporting the results of it. JSTest comes with a couple stock output handlers, like `FirebugHandler`:

	JSTest.handlers.FirebugHandler = function () {
		return {
			pad: '  ',
			bullet: ' - ',
		
			noTests: function () {
				console.info(this.bullet + 'No tests to run');
			},
		
			startTestCase: function (caseName) {
				caseName = caseName || '<No Name>';
				console.info('Case: ' + caseName);
			},
		
			startTest: function (caseName, testName) {
				console.info(this.bullet + 'Running \'' + testName + '\'');
			},
		
			testError: function (caseName, testName, error) {
				var text = this.bullet + testName + '() failed' + ': ' + error.message;
				console.error(text);
			},
		
			testResult: function (caseName, testName, passed) {
				var status = passed ? 'pass' : 'fail';
				console.info(this.pad + this.bullet + status);
			},
		
			testCaseResult: function (caseName, testsRun, testsPassed, testsFailed) {
				if (testsFailed == 0) {
					if (testsPassed > 1)
						console.info(this.bullet + 'All ' + testsRun + ' tests passed');
				} else {
					console.info(this.bullet + testsFailed + ' test' +
						(testsFailed != 1 ? 's' : '') + ' failed');
				}
			},
		
			runResult: function (casesRun, casesPassed, casesFailed) {
				if (casesFailed == 0) {
					console.info('ALL TESTS RAN SUCCESSFULLY');
				} else {
					console.error(casesFailed + ' TEST SUITE' +
					 	(casesFailed != 1 ? 'S' : '') + ' RAN WITH ERRORS');
				}
			},
		};
	};

`FirebugHandler` is the default so JSTest automatically uses it, but if it weren't, you could use it like this
	
	JSTest.run(false, JSTest.handlers.FirebugHandler); // terse mode
	JSTest.run(true, JSTest.handlers.FirebugHandler); // verbose mode

For output handlers that require values passed to them when they are instantiated, like `HTMLHandler` (another JSTest core output handler, which requires an html element passed to it so it knows where to put your results), you can do that like so

	var myDiv = document.getElementById('myDiv');
	JSTest.run(true, JSTest.handlers.HTMLHandler, myDiv);

If you create a handler that requires more arguments, that's cool too

	JSTest.run(true, YourOutputHandler, arg1, arg2, arg3, ...);

[0]: http://rake.rubyforge.org/
