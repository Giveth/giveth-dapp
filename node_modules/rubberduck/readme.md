# Rubberduck

[![Build Status](https://secure.travis-ci.org/daffl/rubberduck.png)](http://travis-ci.org/daffl/rubberduck)

__Evented Aspect Oriented Programming__

Rubberduck punches JavaScript objects and lets you receive events before and after a method executes.
Install it using [NPM](http://npmjs.org)

> npm install rubberduck

or clone the [GitHub repository](https://github.com/daffl/rubberduck).

	var rubberduck = require('rubberduck');

## Duck punching

### Simple punching

Lets punch the _push_ method of an array instance and log the element that gets
pushed before the method executes and the new length of the array (returned by Array.push)
and the pushed element when it returns.

```js
var rubberduck = require('rubberduck'),
	myarray = [],
	emitter = rubberduck.emitter(myarray).punch('push');

emitter.on('beforePush', function(args, instance) {
	console.log('About to push ' + args[0]);
});

emitter.on('afterPush', function(result, args, instance) {
	console.log('Pushed ' + args[0] + ', the new length is ' + result);
});

myarray.push('Test');
```

### Listening to events

Once you picked the methods to be punched the emitter fires the following events:

```js
// Before any punched method executes
emitter.on('before', function(args, instance, name) {
	// args : Array of function arguments
	// instance: The function context (this reference)
	// name : The function name
});

// After any punched method returned
emitter.on('after', function(result, args, instance, name) {
	// result : The return value or an array of
	//	the callback arguments for asynchronous functions
	// args : Array of function arguments
	// instance: The function context (this reference)
	// name : The function name
});
```

You can also listen to specific events by using camelcased event names.
To get evnts only for the _test_ method, attach the following event listener:

```js
emitter.on('beforeTest', function(args, instance, name) {
});

emitter.on('afterTest', function(result, args, instance, name) {
});
```

The parameters are the same as in the general event listeners.

### Asynchronous punching

You can also punch asynchronous methods, that execute a callback instead of returning the value.
In this case the _after_ events receives an array of the callback parameters instead of a single return value.
Just tell the event emitter the position of the callback in your arguments list when punching a method
(use -1 if the callback is at the end of the argument list):

```js
var rubberduck = require('rubberduck'),
Duck = function(name) {
	this.name = name;
}

Duck.prototype.quack = function(callback)
{
	callback(null, this.name + ' quacks!');
}

var donald = new Duck('Donald'),
	emitter = rubberduck.emitter(donald).punch('quack', 0);

// Log the callback results for _quack_
emitter.on('afterQuack', function(results) {
	// Results contains the callback arguments
	console.log(results);
});
```

## Advanced usage

### Punching prototypes and selective punching

You can also punch an objects prototype to receive events about all its instances but it
is important to be selective about what methods to punch. Firing events on methods that get
called many times (e.g. attaching to the Array.prototype) might lead to big performance
hits and can quickly exceed the maximum call stack size.

### Punching methods that throw

Methods that throw instead of return will still call the after event handlers, with the error
provided as the result instead. This includes asynchronous functions with callbacks both before
and after the callback occurs. These methods fire ``error`` and ``errorMethod`` events in place
of the ``after`` and ``afterMethod`` events. Asynchronous methods that return an ``Error``
object as the first argument to the callback will also fire error-type events rather than after.

### Strict punched methods

A second optional parameter to `punch` (the third argument) is a flag indicating whether or not
rubberduck should be strict with the signature of the resulting function. This means the ``length``
property of any punched method will remain the same (rather than revert to zero), at the cost of
a slightly more expensive mechanism to punch the methods, and is off by default.

## Changelog

See [Changelog](CHANGELOG.md).

## License

Copyright (C) 20146David Luecke daff@neyeon.de

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
