/**
 *@fileoverview Depth First Traversal of the given Abstract Syntax Tree
 *@author Raghav Dua
 */

'use strict';

var traversalOptions = require ('./traversalOptions');

/**
 * Constructor for creating an Element wrapper around node (to bundle other information with it)
 * @param {Object} node The node to wrap
 * @private
 */
var Element = function (node) {
	if (!(this instanceof Element)) {
		return new Element (node);
	}

	this.node = node;
};

/**
 * Determine if a given object property is an explorable AST Node
 * @param {Object} node The node to check
 * @param {String} name Name of the key whose value is this node, to make sure we never explore a node's parent
 * @private
 */
function isASTNode (node, name) {
	return (
		node !== null &&	//node shouldn't be null
		typeof (node) === 'object' &&	//must be data type object
		node.hasOwnProperty ('type') &&	//a 'type' key must exist in the node
		typeof (node.type) === 'string' &&	//node.type's value must be a string
		name !== 'parent'	//the key whose value is this entire node must not be 'parent'
	);
}

/**
 * Constructor for the internal Controller object
 * @private
 */
function Controller () {}

/**
 * Set the Controller-wide flag
 * @param {String} flag The flag to set
 * @private
 */
Controller.prototype.notify = function notify (flag) {
	this.__flag = flag;
};

/**
 * Notify to set the Controller-wide flag for halting traversal
 * @private
 */
Controller.prototype.skipNodesBelow = function skip () {
	this.notify (traversalOptions.SKIP_NODES_BELOW);
};

/**
 * Notify to set the Controller-wide flag for skipping child nodes of the current node
 * @private
 */
Controller.prototype.stopTraversal = function stop () {
	this.notify (traversalOptions.STOP_TRAVERSAL);
};

/**
 * Initialize the state of the internal Controller Object before starting traversal
 * @param {object} root The Abstract Syntax Tree object (treated as the AST's root itself)
 * @param {Object} visitorActions The object containing enter and leave behaviors
 * @private
 */
Controller.prototype.init = function init (root, visitorActions) {
	this.root = root;
	this.visitorActions = visitorActions;

	this.__flag = null;
	this.__current = null;
};

/**
 * Execute user-provided callback, providing it with 'this' as context
 * @param {Function} callback The callback to execute
 * @param {Object} element The Element object containing the node currently being entered/left
 * @returns {(String|undefined)} result Returns commands sent by the callback (for stopping or skipping)
 * @private
 */
Controller.prototype.exec = function exec (callback, element, parentElement) {
	var prev, result;

	prev = this.__current;
	this.__flag = null;
	this.__current = element;

	if (typeof (callback) === 'function') {
		result = callback.call (
			this, element.node, parentElement ? parentElement.node : undefined
		);
	}

	this.__current = prev;
	return result;
};

/**
 * Implementation of the DFS traversal and executing callbacks upon enter & leave phases
 * @param {object} root The Abstract Syntax Tree object (treated as the AST's root itself) to traverse
 * @param {Object} visitorActions The object containing enter and leave behaviors
 * @private
 */
Controller.prototype.traverse = function traverse (root, parent, visitorActions) {
	if (!isASTNode (root) ||
		this.__flag === traversalOptions.STOP_TRAVERSAL) {

		return;
	}

	//access Controller Object's context inside nested functions (where 'this' may not refer to the main object)
	var CTRL_OBJECT = this;
	var ret = this.exec (visitorActions.enter, new Element (root), new Element (parent));

	if (ret === traversalOptions.STOP_TRAVERSAL) {
		
		this.notify (ret);
		return;

	} else if (!(ret === traversalOptions.SKIP_NODES_BELOW ||
		this.__flag === traversalOptions.SKIP_NODES_BELOW)) {

		Object.keys (root).forEach (function (key) {
			var child = root [key];

			if (isASTNode (child)) {
				CTRL_OBJECT.traverse (child, root, visitorActions);
			} else if (child && child.constructor === Array) {
				child.forEach (function (childItem) {
					CTRL_OBJECT.traverse (childItem, root, visitorActions);
				});
			}
		});

	}

	if (this.__flag !== traversalOptions.STOP_TRAVERSAL) {
		this.exec (visitorActions.leave, new Element (root));
	}
};

/**
 * The single function exposed to the user
 * @param {object} ast The Abstract Syntax Tree object to traverse
 * @param {Object} visitorEnterOrActions The object containing enter and leave behaviors
 */
 module.exports = function (ast, visitorEnterOrActions) {
 	var visitorActions = {};

 	if (typeof (visitorEnterOrActions) === 'function') {
 		visitorActions = {
 			enter: visitorEnterOrActions
 		};
 	} else {
 		visitorActions.enter = visitorEnterOrActions.enter || function () {};
 		visitorActions.leave = visitorEnterOrActions.leave || function () {};
 	}

 	return new Controller ().traverse (ast, null, visitorActions);
 };