/* global describe, it, window, require */
(function () {
	var Proto, assert;

	if (typeof require === 'function') {
		Proto = require('../lib/proto');
		assert = require('assert');
	} else {
		Proto = window.Proto;
		assert = window.assert;
	}

	describe('UberProto', function () {
		it('extends objects', function () {
			var Extended = Proto.extend({
				sayHi: function () {
					assert.ok(true, 'sayHi called');
					return 'hi';
				}
			});

			assert.equal(Extended.create().sayHi(), 'hi', 'Said hi');
		});

		it('creates a new object', function () {
			var Obj = Proto.extend({
				init: function (name) {
					assert.ok(true, 'Init called');
					this.name = name;
				},

				sayHi: function () {
					return 'Hi ' + this.name;
				},

				prop: 'Testing'
			});

			var inst = Obj.create('Tester');
			assert.equal(inst.name, 'Tester', 'Name set');
			assert.equal(inst.prop, 'Testing', 'Prototype property still there');
			assert.equal(inst.sayHi(), 'Hi Tester', 'Said hi with name');
			assert.ok(Proto.isPrototypeOf(Obj), 'Should have prototype of Proto');
			assert.ok(Obj.isPrototypeOf(inst), 'Instance should have prototype of Obj');
		});

		it('uses an init method alias', function () {
			var Obj = Proto.extend({
					__init: 'myConstructor',
					myConstructor: function (arg) {
						assert.equal(arg, 'myConstructor', 'Got proper arguments in myConstructor');
					}
				}),
				OtherObj = {
					__init: 'testConstructor',
					testConstructor: function (arg) {
						assert.equal(arg, 'testConstructor', 'Got proper arguments in myConstructor');
					}
				};

			Obj.create('myConstructor');
			Proto.create.call(OtherObj, 'testConstructor');
		});

		it('uses _super', function () {
			var Obj = Proto.extend({
				init: function (name) {
					assert.ok(true, 'Super init called');
					this.name = name;
				}
			}), Sub = Obj.extend({
				init: function () {
					this._super.apply(this, arguments);
					assert.ok(true, 'Sub init called');
				}
			});

			var inst = Sub.create('Tester');
			assert.equal(inst.name, 'Tester', 'Name set in prototype');
		});

		it('extends an existing object', function () {
			var Obj = {
				test: function (name) {
					assert.ok(true, 'Super test method called');
					this.name = name;
				}
			};

			var Extended = Proto.extend({
				test: function () {
					this._super.apply(this, arguments);
					assert.ok(true, 'Sub init called');
				}
			}, Obj);

			Extended.test('Tester');

			assert.equal(Extended.name, 'Tester', 'Name set in prototype');
		});

		it('uses .mixin', function () {
			var Obj = Proto.extend({
				init: function (name) {
					assert.ok(true, 'Init called');
					this.name = name;
				}
			});

			Obj.mixin({
				test: function () {
					return this.name;
				}
			});

			var inst = Obj.create('Tester');
			assert.equal(inst.test(), 'Tester', 'Mixin returned name');

			Obj.mixin({
				test: function () {
					return this._super() + ' mixed in';
				}
			});

			assert.equal(inst.test(), 'Tester mixed in', 'Mixin called overwritten');
		});

		it('.mixin(Object)', function () {
			var Obj = {
				test: function (name) {
					assert.ok(true, 'Super test method called');
					this.name = name;
				}
			};

			Proto.mixin({
				test: function () {
					this._super.apply(this, arguments);
					assert.ok(true, 'Sub init called');
				}
			}, Obj);

			Obj.test('Tester');

			assert.equal(Obj.name, 'Tester', 'Name set in prototype');
		});

		it('uses .proxy', function () {
			var Obj = Proto.extend({
				init: function (name) {
					this.name = name;
				},

				test: function (arg) {
					return this.name + ' ' + arg;
				}
			});

			var inst = Obj.create('Tester');
			var callback = inst.proxy('test');

			assert.equal(callback('arg'), 'Tester arg', 'Callback set scope properly');

			callback = inst.proxy('test', 'partialed');
			assert.equal(callback(), 'Tester partialed', 'Callback partially applied');
		});

		describe('Babel transpiled classes (#10)', function() {
			if (typeof require !== 'function' || typeof Object.defineProperty !== 'function') {
				return;
			}

			var classes = require('./class-fixture.es5.js');

			it('works with Babel transpiled classes (#10)', function() {
				var person = new classes.Person('John');

				assert.equal(person.sayHi(), 'Hi John');

				Proto.mixin({
					sayHi: function() {
						return this._super() + '!!';
					}
				}, person);

				assert.equal(person.sayHi(), 'Hi John!!');

				var otherPerson = new classes.OtherPerson();

				assert.equal(otherPerson.sayHi(), 'Hi David Luecke');

				Proto.mixin({
					sayHi: function() {
						return this._super() + '???';
					}
				}, otherPerson);

				assert.equal(otherPerson.sayHi(), 'Hi David Luecke???');
				assert.ok(otherPerson.test());
			});

			it('can extend from Babel transpiled classes (#10)', function() {
				var otherPerson = new classes.OtherPerson();

				assert.equal(otherPerson.sayHi(), 'Hi David Luecke');

				var extended = Proto.extend(otherPerson);

				assert.equal(typeof extended.sayHi, 'function');

				assert.equal(extended.sayHi(), 'Hi David Luecke');
				assert.ok(extended.test());

				assert.ok(!Object.getOwnPropertyDescriptor(extended, 'sayHi').enumerable);
				assert.ok(!Object.getOwnPropertyDescriptor(extended, 'test').enumerable);
				assert.ok(Object.getOwnPropertyDescriptor(extended, 'name').enumerable);

				var extext = extended.extend({
					sayHi: function() {
						return this._super() + '!!!';
					}
				});

				assert.equal(extext.sayHi(), 'Hi David Luecke!!!');
			});
		});
	});
})();
