/**
 * @fileoverview Encourage use of 'keccak256()' over 'sha3()' function.
 * @author Raghav Dua <duaraghav8@gmail.com>
 */

"use strict";

module.exports = {

    meta: {
        docs: {
            description: "Encourage use of 'keccak256()' over 'sha3()' function",
            recommended: true,
            type: "error"
        },

        schema: [],
        fixable: "code"
    },

    create(context) {
        function reportIfsha3Used(emitted) {
            if (emitted.exit) { return; }

            const {node} = emitted, {type, name} = node.callee;

            if (type !== "Identifier") { return; }

            name === "sha3" && context.report({
                node,
                fix(fixer) {
                    return fixer.replaceTextRange([node.callee.start, node.callee.end], "keccak256");
                },
                message: "'sha3(...)' should be replaced with 'keccak256(...)'."
            });
        }

        return {
            CallExpression: reportIfsha3Used
        };
    }

};
