/**
 * @fileoverview Functions must have a single return at the end of the function.
 * @author Mitchell Van Der Hoeff <mitchellvanderhoeff@gmail.com>
 * @author Simon Hajjar <simon.j.hajjar@gmail.com>
 */

"use strict";

module.exports = {

    meta: {

        docs: {
            recommended: false,
            type: "off",
            description: "Encourage functions to only have a single return statement at the end of the function."
        },

        schema: []

    },

    create: function(context) {

        function inspectFunctionDeclaration(emitted) {
            let node = emitted.node;

            if (emitted.exit || node.is_abstract) {
                return;
            }

            let body = node.body.body;
            if (body.length === 0) {
                return;
            }

            let functionName = node.name ? `"${node.name}"` : "Fallback function";
            for (let statement of body.slice(0, -1)) {
                if (statement["type"] === "ReturnStatement") {
                    context.report({
                        node: node,
                        message: `${functionName}: Return statement not at end of function`
                    });
                }
            }
            let last_statement = body[body.length - 1];
            if (last_statement["type"] !== "ReturnStatement") {
                context.report({
                    node: node,
                    message: `${functionName}: Missing return statement at end of function`
                });
            }
        }

        function inspectBlockStatement(emitted) {
            let node = emitted.node;

            if (emitted.exit) {
                return;
            }

            let functionName = node.name ? `"${node.name}"` : "Fallback function";
            if (node.parent.type !== "FunctionDeclaration") {
                for (let statement of node.body) {
                    if (statement.type === "ReturnStatement") {
                        context.report({
                            node: node,
                            message: `${functionName} should only have a single return statement at the end.`
                        });
                    }
                }
            }
        }

        return {
            FunctionDeclaration: inspectFunctionDeclaration,
            BlockStatement: inspectBlockStatement
        };

    }

};
