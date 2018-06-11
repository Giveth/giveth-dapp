var rubberduck = require('../lib/rubberduck'),
// Lets create a simple object
object = {
	number : 42,
	answer : function()
	{
		return this.number;
	}
},
// Create the event emitter and punch the method _answer_
emitter = rubberduck.emitter(object).punch('answer');

// Attach a general listener that fires before every method
emitter.on('before', function(args, context, name) {
	console.log('Running before method ' + name);
	console.log(args);
	console.log(context);
});

emitter.on('after', function(result, args, context, name) {
	console.log('Got general after method event');
});

emitter.on('afterAnswer', function(result, args, context) {
	console.log('Got afterAnswer event and the answer is ' + result);
});

object.answer();
