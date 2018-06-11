"use strict";

/**
 * @fileoverview Disallow suicide and selfdestruct
 * @author Beau Gunderson <beau@beaugunderson.com>
 * @author Federico Bond <federicobond@gmail.com>
 */

function isSuicideOrSelfDestruct(node) {
    return node.type === "Identifier" && (node.name === "suicide" || node.name === "selfdestruct");
}

module.exports = {
    meta: {
        docs: {
            recommended: false,
            type: "off",
            description: "Disallow 'suicide' and 'selfdestruct'"
        },

        schema: []
    },

    create: function(context) {
        function inspectCallExpression(emittedObject) {
            if (!emittedObject.exit) {
                return;
            }

            const callee = emittedObject.node.callee;

            if (isSuicideOrSelfDestruct(callee)) {
                context.report({
                    node: emittedObject.node,
                    message: "Avoid using 'suicide' and 'selfdestruct'."
                });
            }
        }

        return {
            CallExpression: inspectCallExpression
        };
    }
};
