/**
 * @fileoverview Discourage the use of low-level functions - call(), callcode() & delegatecall().
 * @author Raghav Dua <duaraghav8@gmail.com>
 */

"use strict";

const DEFAULT_FUNCS_TO_AVOID = ["call", "callcode", "delegatecall"];

module.exports = {

    meta: {
        docs: {
            description: "Discourage use of low-level functions call(), callcode() & delegatecall()",
            recommended: true,
            type: "warning"
        },

        schema: [{
            type: "array",
            items: {
                type: "string",
                enum: DEFAULT_FUNCS_TO_AVOID
            },
            minItems: 1
        }]
    },

    create(context) {
        const functionsToAvoid = new Set(context.options ? context.options[0] : DEFAULT_FUNCS_TO_AVOID);

        function reportIfUsingFuncToAvoid(emitted) {
            const {node} = emitted;

            if (emitted.exit || node.callee.type !== "MemberExpression") {
                return;
            }

            const {property} = node.callee;

            property.type === "Identifier" && functionsToAvoid.has(property.name) && context.report({
                node,
                location: {
                    column: context.getSourceCode().getColumn(property)
                },
                message: `Avoid using low-level function '${property.name}'.`
            });
        }

        return {
            CallExpression: reportIfUsingFuncToAvoid
        };
    }

};
