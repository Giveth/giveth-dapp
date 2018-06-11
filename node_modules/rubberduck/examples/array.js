var duck = require('../lib/rubberduck'),
	myarray = [],
	// Create an event emitter for myarray and punch the push method
	emitter = duck.emitter(myarray).punch('push');

// Add a beforePush listener
emitter.on('beforePush', function(args, instance) {
	console.log('About to push ' + args[0]);
});

// Add an afterPush listener
emitter.on('afterPush', function(result, args, instance) {
	console.log('Pushed ' + args[0] + ' the new length is ' + result);
});

myarray.push('Test');
