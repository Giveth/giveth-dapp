/**
 * @fileoverview Set a maximum number of statements per function
 * @author Beau Gunderson <beau@beaugunderson.com>
 */

"use strict";

module.exports = {
    meta: {
        docs: {
            recommended: false,
            type: "off",
            description: "Enforce upper limit on number of statements present in a function"
        },

        schema: [{
            type: "integer",
            minimum: 0
        }]
    },

    create: function(context) {
        const maximumStatements = context.options ? context.options[0] : 25;
        const sourceCode = context.getSourceCode();

        function getStatementLines(node) {
            const lines = sourceCode.getText(node)
                .split(/[\r\n]/g).map(line => line.trim()).filter(line => line);

            return lines.length;
        }

        function inspectFunctionDeclaration(emitted) {
            const node = emitted.node;

            // If abstract function, exit now
            if (emitted.exit || node.is_abstract) {
                return;
            }

            const topLevelStatements = node.body.body;
            const numberOfStatements = topLevelStatements.reduce((total, statement) => {
                return total + getStatementLines(statement);
            }, 0);

            if (numberOfStatements > maximumStatements) {
                context.report({
                    node: node,
                    message: `${node.name}: Number of statements ` +
                        `inside function(${numberOfStatements}) exceeds the upper limit(${maximumStatements}).`
                });
            }
        }

        return {
            FunctionDeclaration: inspectFunctionDeclaration
        };
    }
};
