/**
 * @fileoverview Disallow named function parameters
 * @author Beau Gunderson <beau@beaugunderson.com>
 */

"use strict";

function isNameValueAssignment(argument) {
    return argument.type === "NameValueAssignment";
}

module.exports = {
    meta: {
        docs: {
            description: "Discourage named function parameters",
            recommended: false,
            type: "off"
        },

        schema: []
    },

    create(context) {
        let structs = {};
        let namedParameterCalls = {};

        // keep track of all calls that use named parameters
        function inspectCallExpression(emitted) {
            if (emitted.exit) {
                return;
            }

            const { node } = emitted;
            const { name, type } = node.callee;

            if (type !== "Identifier") {
                return;
            }

            const args = node.arguments;

            if (args.some(isNameValueAssignment)) {
                namedParameterCalls[name] = node;
            }
        }

        // keep track of all struct names
        function inspectStructDeclaration(emitted) {
            let node = emitted.node;

            if (!emitted.exit) {
                structs[node.name] = node;
            }
        }

        // disallow calls with named parameters but filter out struct
        // instantiations, which look identical to the AST
        function inspectProgram(emitted) {
            if (!emitted.exit) {
                return;
            }

            Object.keys(namedParameterCalls).forEach(name => {
                if (structs[name]) {
                    return;
                }

                context.report({
                    node: namedParameterCalls[name],
                    message: "Avoid using named parameters."
                });
            });
        }

        return {
            CallExpression: inspectCallExpression,
            Program: inspectProgram,
            StructDeclaration: inspectStructDeclaration
        };
    }
};
