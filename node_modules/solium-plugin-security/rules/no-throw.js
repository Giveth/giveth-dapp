/**
 * @fileoverview Discourage use of 'throw' statement for error flagging.
 * @author Raghav Dua <duaraghav8@gmail.com>
 */

"use strict";

module.exports = {

    meta: {
        docs: {
            description: "Discourage use of 'throw' statement. Fixes by replacing statement with 'revert();'",
            recommended: true,
            type: "error"
        },

        schema: [],
        fixable: "code"
    },

    create(context) {
        function reportUseOfThrow(emitted) {
            if (emitted.exit) { return; }

            const {node} = emitted;

            context.report({
                node,
                fix(fixer) {
                    return fixer.replaceText(node, "revert();");
                },
                message: "Consider using 'revert()' in place of deprecated 'throw'."
            });
        }

        return {
            ThrowStatement: reportUseOfThrow
        };
    }

};
