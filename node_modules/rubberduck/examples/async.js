var rubberduck = require('../lib/rubberduck'),
Duck = function(name) {
	this.name = name;
}

// An asynchronous _quack_ method that takes
// a callback as the only parameter
Duck.prototype.quack = function(callback)
{
	callback(null, this.name + ' quacks!');
}

// An asynchronous _fly_ method that has the callback
// at the end of the argument list
Duck.prototype.fly = function(to, callback)
{
	callback(null, this.name + ' flew to ' + to);
}


var donald = new Duck('Donald'),
emitter = rubberduck.emitter(donald)
	// Punch asynchronous _quack_ with a callback at position 0
	.punch('quack', 0)
	// Punch _fly_ with the callback at the end of the argument list
	.punch('fly', -1);

// Log the callback results for _quack_
emitter.on('afterQuack', function(results) {
	console.log(results);
});

// Log the callback results for _fly_
emitter.on('afterFly', function(results) {
	console.log(results);
});

// _quack_ with a callback
donald.quack(function(error, result) {
	console.log(result);
});

// _fly_ with a callback
donald.fly('Duckburg', function(error, result) {
	console.log(result);
});
