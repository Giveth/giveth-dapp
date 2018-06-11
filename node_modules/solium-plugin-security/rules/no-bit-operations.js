/**
 * @fileoverview Disallow bit operations
 * @author Beau Gunderson <beau@beaugunderson.com>
 */

"use strict";

const DISALLOWED_OPERATORS = [">>", "<<", "~", "^", "&", "|"];
const DISALLOWED_ASSIGNMENTS = [">>=", "<<=", "^=", "&=", "|="];

module.exports = {
    meta: {
        docs: {
            recommended: false,
            type: "off",
            description: "Disallow bitwise operators"
        },

        schema: []
    },

    create: function(context) {
        function inspectAssignmentExpression(emitted) {
            const node = emitted.node;

            if (emitted.exit) {
                return;
            }

            if (DISALLOWED_ASSIGNMENTS.indexOf(node.operator.trim()) !== -1) {
                context.report({
                    node: node,
                    message: `Avoid use of bit operation '${node.operator}'.`
                });
            }
        }

        function inspectBinaryExpression(emitted) {
            const node = emitted.node;

            if (emitted.exit) {
                return;
            }

            if (DISALLOWED_OPERATORS.indexOf(node.operator.trim()) !== -1) {
                context.report({
                    node: node,
                    message: `Avoid use of bit operation '${node.operator}'.`
                });
            }
        }

        return {
            AssignmentExpression: inspectAssignmentExpression,
            BinaryExpression: inspectBinaryExpression
        };
    }
};
