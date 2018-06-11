/**
 * @fileoverview Discourage use of abstract functions
 * @author Nicolas Feignon <nfeignon@gmail.com>
 */

"use strict";

module.exports = {

    meta: {

        docs: {
            recommended: false,
            type: "off",
            description: "Discourage use of abstract functions"
        },

        schema: []

    },

    create: function(context) {

        function inspectFunctionDeclaration(emitted) {
            const node = emitted.node;

            // If function is NOT abstract, exit now.
            if (emitted.exit || !node.is_abstract) {
                return;
            }

            const message = node.name ?
                `${node.name}: Avoid using abstract functions.` : "Avoid using abstract fallback function.";

            context.report({ node, message });
        }

        return {
            FunctionDeclaration: inspectFunctionDeclaration
        };

    }

};
