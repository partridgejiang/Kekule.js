function MyException (message) {
	this.message = message;
	return this;
};

var AssertionsTestCase = JSTest.TestCase({
	name: 'Assertion Tests',
	
	// Called once before all tests are run.
	init: function () {},
	
	// Called before each test.
	setup: function () {},
	
	// Called after each test.
	cleanup: function () {},
	
	// Called once after all tests have run.
	teardown: function () {},
	
	testTodo: function () {
		this.todo('(this should fail) Write more tests');
	},
	
	testFail: function () {
		this.fail('(this should fail)');
	},
	
	testAssertBooleans: function () {
		this.assertTrue(true);
		this.assertFalse(false);
		
		this.message("Booleans work how they're supposed to");
	},
	
	testAssertEqual: function () {
		this.assertEqual(2, 2);
		this.assertEqual(2, "2");
		
		var e = new Error();
		this.assertEqual(["one", 2, e], ["one", 2, e]);
		
		this.assertEqual(["one", [4, 5]], ["one", [4, 5]]);
	},
	
	testAssertNotEqual: function () {
		this.assertNotEqual(2, 3);
		
		this.assertNotEqual(["one", [4, 5]], ["one", [4, 6]]);
	},
	
	testAssertMatch: function () {
		this.assertMatch(/^[1-9]{3,5}$/, 12345);
	},
	
	testAssertNotMatch: function () {
		this.assertNotMatch(/^[1-9]{3,5}$/, 1234567);
	},
	
	testAssertType: function () {
		this.assertType('hello', 'string', "'hello' is not of type 'string'");
		this.assertType({}, 'object');
		this.assertType([], 'object');
		this.assertType(12, 'number');
		this.assertType(null, 'object');
		this.assertType(undefined, 'undefined');
	},

	testAssertNotType: function () {
		this.assertNotType({}, 'string');
		this.assertNotType([], 'string');
		this.assertNotType('', 'number');
		this.assertNotType(12, 'object');
		this.assertNotType(null, 'null');
		this.assertNotType(undefined, 'string');
	},
	
	testAssertSameType: function () {
		this.assertSameType('string 1', 'string 2');
		this.assertSameType(null, null);
		this.assertSameType(false, false);
		this.assertSameType(null, new Array());
	},
	
	testAssertNotSameType: function () {
		this.assertNotSameType('string', 123);
		this.assertNotSameType(null, false);
		this.assertNotSameType(Array, new Array());
	},
	
	testAssertInstanceOf: function () {
		this.assertInstanceOf(new Array(), Array);
		this.assertInstanceOf(new Object(), Object);
		this.assertInstanceOf({}, Object);
		this.assertInstanceOf(Array, Function);
		this.assertInstanceOf(Array, Object);
	},

	testAssertNotInstanceOf: function () {
		this.assertNotInstanceOf(new Object(), Array);
		this.assertNotInstanceOf(MyException, Error);
		this.assertNotInstanceOf(new MyException(), Function);
	},
	
	testAssertNull: function () {
		var myNull = null;
		this.assertNull(myNull);
	},
	
	testAssertUndefined: function () {
		var myUndefined = undefined;
		this.assertUndefined(myUndefined);
	},

	testAssertNotNull: function () {
		var value = 'some value';
		this.assertNotNull(value);
	},

	testAssertNotUndefined: function () {
		var value = 'some value';
		this.assertNotUndefined(value);
	},
	
	testAssertNaN: function () {
		this.assertNaN('hi');
		this.assertNaN(undefined);
		this.assertNaN({});
		this.assertNaN(function () {});
	},
	
	testAssertNotNaN: function () {
		this.assertNotNaN(1);
		this.assertNotNaN(-1);
		this.assertNotNaN(1.23);
		this.assertNotNaN('123');
		
		// Some weird stuff with isNaN:
		this.assertNotNaN(true);
		this.assertNotNaN(false);
		this.assertNotNaN(null);
		this.assertNotNaN([]);
	},
	
	testAssertGreaterThan: function () {
		this.assertGreaterThan(2, 1);
		this.assertGreaterThan(0, -1);
	},
	
	testAssertLessThan: function () {
		this.assertLessThan(1, 2);
		this.assertLessThan(-1, 0);
	},
	
	testAssertGreaterThanOrEqual: function () {
		this.assertGreaterThanOrEqual(2, 1);
		this.assertGreaterThanOrEqual(0, -1);
		
		this.assertGreaterThanOrEqual(1, 1);
	},
	
	testAssertLessThanOrEqual: function () {
		this.assertLessThanOrEqual(1, 2);
		this.assertLessThanOrEqual(-1, 0);
		
		this.assertLessThanOrEqual(1, 1);
	},
	
	testAssertRaises: function () {
		var badValue = 'bad value';
		var goodValue = 'good value';
		
		var myFunc = function (value) {
			if (value == badValue)
				throw new MyException("Received bad value: " + badValue);
		};
		
		// The 'null' in the 3rd argument place of each assertion is where
		// your custom failure message goes if you have one. If not, just
		// put null there.
		this.assertRaises(MyException, myFunc, null, badValue);
		this.assertNotRaises(MyException, myFunc, null, goodValue);
		
		this.message('myFunc raises the proper exception (MyException) given bad input');
	},
	
	testAssertHasProperty: function () {
		var object = {'myprop': 'value'};
		var array = [1, 2, 3];
		
		this.assertHasProperty(object, 'myprop');
		this.assertHasProperty(array, 'length');
	},
	
	testAssertNotHasProperty: function () {
		var object = {'myprop': 'value'};
		var array = [1, 2, 3];
		
		this.assertNotHasProperty(array, 'myprop');
		this.assertNotHasProperty(object, 'length');
	},
	
	testAssertEmpty: function () {
		this.assertEmpty([]);
		this.assertEmpty('');
		this.assertEmpty(null);
		this.assertEmpty(undefined);
	},
	
	testAssertNotEmpty: function () {
		this.assertNotEmpty({});
		this.assertNotEmpty([1]);
		this.assertNotEmpty(' ');
		this.assertNotEmpty(1);
		this.assertNotEmpty(1.23);
		this.assertNotEmpty(new Date());
	},
	
	testCustomAssertMethods: function () {
		var oldAsserts = JSTest.utils.copy(JSTest.customAssertMethods);
		
		this.assertUndefined(JSTest.customAssertMethods.assertSomething);
		
		JSTest.setCustomAssertMethods({
			assertSomething: function (value, customMessage) {
				// custom assertion code
			}
		});
		
		this.assertNotUndefined(JSTest.customAssertMethods.assertSomething);
		this.assertType(JSTest.customAssertMethods.assertSomething, 'function');
		
		JSTest.customAssertMethods = oldAsserts;
	},
});

var JSTestUtilsTestCase = JSTest.TestCase({
	name: 'JSTest.utils Tests',
	
	testUtilExtend: function () {
		var object1 = {'key1': 'value1'};
		JSTest.utils.extend(object1, {'key2': 'value2'});
		
		//this.assertEqual(object1.key2, 'value2');
		this.assertNotUndefined(object1.key2);
		
		this.message('JSTest.utils.extend can extend one object with another object');
		
		var object2 = {'key1': 'value1'};
		JSTest.utils.extend(object2, {
			'key2': 'value2'
		}, {
			'key3': 'value3'
		});
		
		this.assertNotUndefined(object2.key3);
		
		this.message('JSTest.utils.extend can extend one object with multiple objects');
	},
	
	testUtilStartsWith: function () {
		var string = 'Hello!';
		
		this.assertTrue(JSTest.utils.startsWith(string, 'He'));
		this.assertFalse(JSTest.utils.startsWith(string, 'Hi'));
	},
	
	testUtilArgsToArray: function () {
		var func = function () {
			return arguments;
		};
		
		var args1 = JSTest.utils.argsToArray(func('arg1', 'arg2'));
		var args2 = ['arg1', 'arg2'];
		var args3 = func('arg1', 'arg2');
		
		this.assertEqual(args1[0], args2[0]);
		this.assertEqual(args1[1], args2[1]);
		
		this.assertHasProperty(args1, 'slice');
		this.assertHasProperty(args2, 'slice');
		this.assertNotHasProperty(args3, 'slice');
		
		this.message('JSTest.utils.argsToArray converts an arguments object to a proper array');
	}
});
