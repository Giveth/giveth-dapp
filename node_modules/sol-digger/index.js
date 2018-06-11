/**
 * @fileoverview Function to recursively explore the given directory to discover all .sol files
 * @author Raghav Dua <duaraghav8@gmail.com>
 */

'use strict';

var path = require ('path'),
	fs = require ('fs');
var SOL_EXT = '.sol',
	CWD = process.cwd ();

function traverse (currentDir, allFiles, ignore) {

	var currentDirItems;

	if (!path.isAbsolute (currentDir)) {
		currentDir = path.join (CWD, currentDir);
	}

	currentDirItems = fs.readdirSync (currentDir);

	currentDirItems.forEach (function (item) {
		var absoluteItemPath = path.join (currentDir, item);

		if (ignore.indexOf (absoluteItemPath) > -1) {
			return;
		}

		if (fs.lstatSync (absoluteItemPath).isDirectory ()) {

			traverse (absoluteItemPath, allFiles, ignore);

		} else if (path.extname (absoluteItemPath) === SOL_EXT) {

			allFiles.push (absoluteItemPath);

		}
	});
}

module.exports = function dig (dir, ignore) {
	var allFiles = [];

	//set ignore to undefined if its not either a string or array
	ignore = (
		typeof ignore === 'object' && ignore.constructor.name === 'Array'
	) ? ignore : (
			typeof ignore === 'string' ? [ignore] : []
		);

	for (var i = 0; i < ignore.length; i++) {
		if (!path.isAbsolute (ignore [i])) {
			ignore [i] = path.join (CWD, ignore [i]);
		}
	}

	if (dir && typeof dir === 'string' && fs.lstatSync (dir).isDirectory ()) {
		traverse (dir, allFiles, ignore);
	}
	
	return allFiles;
};