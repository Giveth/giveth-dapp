/**
 * @fileoverview Discourage use of void returns in functions prototypes
 * @author Nicolas Feignon <nfeignon@gmail.com>
 */

"use strict";

module.exports = {

    meta: {

        docs: {
            recommended: false,
            type: "off",
            description: "Discourage use of void returns in functions prototypes"
        },

        schema: []

    },

    create: function(context) {

        function inspectFunctionDeclaration(emitted) {
            const node = emitted.node;

            if (emitted.exit || node.returnParams) {
                return;
            }

            const message = node.name ?
                `Avoid using a void return in function ${node.name}.` : "Avoid using a void return in fallback function.";

            context.report({ node, message });
        }

        return {
            FunctionDeclaration: inspectFunctionDeclaration
        };

    }

};
