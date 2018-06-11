/**
 * @fileoverview Discourage use of inline assembly.
 * @author Raghav Dua <duaraghav8@gmail.com>
 */

"use strict";

module.exports = {

    meta: {
        docs: {
            description: "Discourage use of inline assembly",
            recommended: true,
            type: "error"
        },

        schema: []
    },

    create(context) {
        function reportUse(emitted) {
            if (emitted.exit) { return; }

            const {node} = emitted;

            context.report({
                node,
                message: "Avoid using Inline Assembly."
            });
        }

        return {
            InlineAssemblyStatement: reportUse
        };
    }

};
