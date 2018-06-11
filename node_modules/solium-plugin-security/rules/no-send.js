/**
 * @fileoverview Discourage use of 'send' as it is unsafe
 * @author Tristan Homsi <tristanhomsi@gmail.com>
 */

"use strict";

function isSend(calleeNode) {
    return (
        calleeNode.property &&
        calleeNode.property.type === "Identifier" &&
        calleeNode.property.name === "send"
    );
}

module.exports = {

    meta: {

        docs: {
            recommended: true,
            type: "warning",
            description: "Discourage the use of 'send'."
        },

        schema: []
    },

    create: function(context) {
        function inspectCallExpression(emittedObject) {
            if (!emittedObject.exit) {
                return;
            }

            const callee = emittedObject.node.callee;

            if (isSend(callee)) {
                context.report({
                    node: emittedObject.node,
                    message: "Consider using 'transfer' in place of 'send'."
                });
            }
        }

        return {
            CallExpression: inspectCallExpression
        };
    }

};
