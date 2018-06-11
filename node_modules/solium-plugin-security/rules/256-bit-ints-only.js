/**
 * @fileoverview Disallow non-256 bit integers
 * @author Beau Gunderson <beau@beaugunderson.com>
 */

"use strict";

const ALLOWED_INTS = [
    "int", // alias for int256
    "int256",
    "uint", // alias for uint256
    "uint256"
];

module.exports = {
    meta: {
        docs: {
            recommended: false,
            type: "off",
            description: "Discourage use of non-256 bit integers"
        },

        schema: []
    },

    create: function(context) {
        function isInt(type) {
            return type.startsWith("int") || type.startsWith("uint");
        }

        function is256Bit(type) {
            return ALLOWED_INTS.includes(type);
        }

        function inspectType(emitted) {
            const { node } = emitted;

            if (emitted.exit || typeof(node.literal) !== "string" || !isInt(node.literal) || is256Bit(node.literal)) {
                return;
            }

            context.report({
                node,
                message: `${node.literal}: Only use 256-bit integers.`
            });

        }

        return {
            Type: inspectType
        };
    }
};
