/**
 * @fileoverview Disallow fixed point types
 * @author Beau Gunderson <beau@beaugunderson.com>
 */

"use strict";

module.exports = {
    meta: {
        docs: {
            recommended: true,
            type: "error",
            description: "Disallow fixed point types"
        },

        schema: []
    },

    create: function(context) {
        function inspectType(emitted) {
            const type = emitted.node.literal;

            // If the literal is not a string (ie, has a sub-type, like in MappingExpression), exit
            if (emitted.exit || typeof(type) !== "string") {
                return;
            }

            // Prefix match instead of exact match to ensure that all MxN declarations are caught (eg- ufixed128x19)
            if (type.indexOf("fixed") === 0 || type.indexOf("ufixed") === 0) {
                context.report({
                    node: emitted.node,
                    message: `${type}: Avoid using fixed types.`
                });
            }
        }

        return {
            Type: inspectType
        };
    }
};
