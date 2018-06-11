# sol-digger
Recursively traverse a directory to extract all Solidity files

#Install
```
npm install sol-digger
```

#API
```js
let digger = require ('sol-digger');
```
```digger``` is a function that takes 2 arguments: First is ```directory``` - the starting point for recursive search of solidity files and second is ```ignores``` - an array of names to ignore while treversing. These names could be either file names or sub-directory names.

If you wish to pass only a single file or directory to ignore, you can simply pass in a string instead of array to ```digger ()```.


#Usage
```js
'use strict';

let digger = require ('sol-digger');

digger ('/relative/or/absolute/path', ['node_modules', 'contracts'])
	.forEach ( (filename) => {
		console.log (filename);
	});

digger ('./foo', 'bar').forEach ( (filename) => {
	console.log (filename);
});
```