/**
 * @fileoverview Discourage use of members 'blockhash' & 'timestamp' (and alias 'now') of 'block' global variable
 * @author Raghav Dua <duaraghav8@gmail.com>
 */

"use strict";

const MEMBERS_TO_AVOID = ["blockhash", "timestamp"];

module.exports = {

    meta: {
        docs: {
            description: "Discourage use of members 'blockhash' & 'timestamp' (and alias 'now') of block global variable",
            recommended: true,
            type: "warning"
        },

        schema: [{
            type: "array",
            items: {
                type: "string",
                enum: MEMBERS_TO_AVOID
            },
            minItems: 1
        }]
    },

    create(context) {
        const membersToAvoid = new Set(context.options ? context.options[0] : MEMBERS_TO_AVOID);

        function reportIfblockhashUsed(emitted) {
            if (emitted.exit) { return; }

            const {node} = emitted;

            if (node.callee.type !== "MemberExpression") { return; }

            const {object, property} = node.callee;

            if (object.type === "Identifier" && property.type === "Identifier"
                && object.name === "block" && property.name === "blockhash") {
                context.report({
                    node,
                    message: "Avoid using 'block.blockhash'."
                });
            }
        }

        function reportIftimestampUsed(emitted) {
            if (emitted.exit) { return; }

            const {node} = emitted, {object, property} = node;

            if (object.type === "Identifier" && property.type === "Identifier"
                && object.name === "block" && property.name === "timestamp") {
                context.report({
                    node,
                    message: "Avoid using 'block.timestamp'."
                });
            }
        }

        function reportIfnowUsed(emitted) {
            if (emitted.exit) { return; }

            const {node} = emitted;

            node.name === "now" && context.report({
                node,
                message: "Avoid using 'now' (alias to 'block.timestamp')."
            });
        }

        const nodesToCatch = {};

        if (membersToAvoid.has("blockhash")) {
            nodesToCatch.CallExpression = reportIfblockhashUsed;
        }

        if (membersToAvoid.has("timestamp")) {
            nodesToCatch.MemberExpression = reportIftimestampUsed;
            nodesToCatch.Identifier = reportIfnowUsed;
        }

        return nodesToCatch;
    }

};
