/**
 * @fileoverview Discourage use of 'tx.origin' global variable.
 * @author Raghav Dua <duaraghav8@gmail.com>
 */

"use strict";

module.exports = {

    meta: {
        docs: {
            description: "Discourage use of 'tx.origin' global variable.",
            recommended: true,
            type: "error"
        },

        schema: []
    },

    create(context) {
        function isAtxoriginExpression(object, property) {
            return (object.type === "Identifier" &&
                property.type === "Identifier" && object.name === "tx" && property.name === "origin");
        }

        function reportIfIstxorigin(emitted) {
            if (emitted.exit) { return; }

            const {node} = emitted, {object, property} = node;

            isAtxoriginExpression(object, property) && context.report({
                node,
                message: "Consider using 'msg.sender' in place of 'tx.origin'."
            });
        }

        return {
            MemberExpression: reportIfIstxorigin
        };
    }

};
