/**
 * @fileoverview Enforce that the function placeholder is the last statement in the modifier
 * @author Beau Gunderson <beau@beaugunderson.com>
 */

"use strict";

const RE_PLACEHOLDER_WITH_SEMICOLON = /^\s*_\s*;\s*$/;

function isFunctionPlaceholder(node) {
    return (
        node.type === "PlaceholderStatement" ||
        (node.type === "ExpressionStatement" && node.expression.name === "_")
    );
}

module.exports = {
    meta: {
        docs: {
            recommended: false,
            type: "off",
            description: "Encourage use of function placeholder as the last statement in the modifier"
        },

        schema: []
    },

    create: function(context) {
        let sourceCode = context.getSourceCode();

        function inspectModifierDeclaration(emitted) {
            if (emitted.exit) {
                return;
            }

            let node = emitted.node;
            let topLevelStatements = node.body.body;
            let lastIndex = topLevelStatements.length - 1;

            let firstPlaceholderIndex = topLevelStatements.findIndex(isFunctionPlaceholder);

            if (firstPlaceholderIndex === -1) {
                context.report({
                    node: node,
                    message: `${node.name}: no function placeholder found.`
                });

                return;
            }

            const placeholder = topLevelStatements[firstPlaceholderIndex];
            const text = sourceCode.getText(placeholder);

            if (!RE_PLACEHOLDER_WITH_SEMICOLON.exec(text)) {
                context.report({
                    node: placeholder,
                    message: `${node.name}: function placeholder must be followed by a semicolon.`
                });
            }

            if (firstPlaceholderIndex !== lastIndex) {
                context.report({
                    node: placeholder,
                    message: `${node.name}: function placeholder must be the last statement in the modifier.`
                });
            }
        }

        return {
            ModifierDeclaration: inspectModifierDeclaration
        };
    }
};
