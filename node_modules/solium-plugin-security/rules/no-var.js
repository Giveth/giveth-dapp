/**
 * @fileoverview Disallow type deduction via 'var'
 * @author Beau Gunderson <beau@beaugunderson.com>
 */

"use strict";

module.exports = {
    meta: {
        docs: {
            recommended: false,
            type: "off",
            description: "Disallow type deduction via 'var'"
        },

        schema: []
    },

    create: function(context) {
        function inspectVariableDeclaration(emitted) {
            if (emitted.exit) { return; }

            let node = emitted.node;

            context.report({
                node: node,
                message: "Avoid type deduction through 'var'. Specify the data type instead."
            });
        }

        return {
            VariableDeclaration: inspectVariableDeclaration,
            VariableDeclarationTuple: inspectVariableDeclaration
        };
    }
};
