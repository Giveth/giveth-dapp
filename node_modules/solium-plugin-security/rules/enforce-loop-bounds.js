/**
 * @fileoverview Flag loops which don't have fixed bounds. This DOES NOT catch all kinds of potentially infinite loops.
 * @author Nicolas Feignon <nfeignon@gmail.com>
 */

"use strict";


// TODO: Examine test.argument.value (when test condition gets a negative number)
function hasATruthyValue(test) {
    // If the test isn't a value, it means its a complicated expression which will be evaluated dynamically
    if (!test.hasOwnProperty("value")) {
        return false;
    }

    // We deliberately use double equals instead of triple because we need to test for all true-equivalent values!
    return (test.value == true || (Number.isInteger(test.value) && test.value !== 0));
}


module.exports = {

    meta: {

        docs: {
            recommended: false,
            type: "off",
            description: "Flag all loops which don't have fixed bounds"
        },

        schema: []

    },

    create: function(context) {

        // eslint-disable-next-line no-unused-vars
        function hasBreakStatement(expr, index, array) {
            return (expr.type === "BreakStatement" || (expr.type === "IfStatement" && inspectIfStatement(expr)));
        }

        function inspectIfStatement(node) {
            if (
                node.consequent.type === "BreakStatement" ||
                (node.consequent.type === "BlockStatement" && node.consequent.body.some(hasBreakStatement)) ||
                (node.consequent.type === "IfStatement" && inspectIfStatement(node.consequent))
            ) {
                return true;
            }

            if (node.alternate) {
                if (
                    node.alternate.type === "BreakStatement" ||
                    (node.alternate.type === "BlockStatement" && node.alternate.body.some(hasBreakStatement)) ||
                    (node.alternate.type === "IfStatement" && inspectIfStatement(node.alternate))
                ) {
                    return true;
                }
            }

            return false;
        }

        function inspectLoopStatement(emitted) {
            const { node } = emitted;

            if (emitted.exit) {
                return;
            }

            let loopBody;

            if (node.body.type === "BlockStatement") {
                loopBody = node.body.body;
            } else {
                loopBody = [node.body];
            }

            let hasBreak = false;

            for (let expr of loopBody) {
                if (expr.type === "BreakStatement" || (expr.type === "IfStatement" && inspectIfStatement(expr))) {
                    hasBreak = true;
                    break;
                }
            }

            if ((node.test === null || hasATruthyValue(node.test)) && !hasBreak) {
                context.report({
                    node: node,
                    message: "Loop should have fixed bounds."
                });
            }

        }

        return {
            ForStatement: inspectLoopStatement,
            WhileStatement: inspectLoopStatement,
            DoWhileStatement: inspectLoopStatement
        };

    }

};
