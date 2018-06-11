/**
 *@fileoverview Exposes all the exploration-related functions through main object
 *@author Raghav Dua
 */

'use strict';

var SolExplore = {
	traverse: require ('./lib/traverse'),
	traversalOptions: require ('./lib/traversalOptions'),
	Syntax: require ('./lib/syntax'),
	version: require ('./package.json').version
};

if (typeof window !== 'undefined') {
	window.SolExplore = SolExplore;
}

module.exports = SolExplore;