// Load the library
var rubberduck = require('../lib/rubberduck'),
// The Duck class
Duck = function(name) {
	this.name = name;
}
// Add a _getName_ method to the prototype
Duck.prototype.getName = function() {
	return this.name + ' Duck';
}

// Create an emitter on the prototype
emitter = rubberduck.emitter(Duck.prototype)
	// Punch calls to the getName method
	.punch('getName');

// Attach a general event listener before a method executes
emitter.on('before', function(args, context, name) {
	console.log('Running before method ' + name);
	console.log(context);
});

var donald = new Duck('Donald'),
darkwing = new Duck('Darkwing');

console.log(donald.getName());
console.log(darkwing.getName());
