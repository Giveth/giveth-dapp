/**
 * @fileoverview Encourage user to explicitly specify visibility of function
 * @author Raghav Dua <duaraghav8@gmail.com>
 */

"use strict";

const FUNCTION_VISIBILITY_MODIFIERS = new Set(["external", "public", "internal", "private"]);

module.exports = {

    meta: {
        docs: {
            description: "Encourage user to explicitly specify visibility of function",
            recommended: true,
            type: "error"
        },

        schema: [],
        fixable: "code"
    },

    create(context) {
        function reportFuncIfNoVisibilitySpecified(emitted) {
            if (emitted.exit) { return; }

            function hasAVisibilityModifier(modifierList) {
                for (let modif of modifierList) {
                    if (FUNCTION_VISIBILITY_MODIFIERS.has(modif.name)) {
                        return true;
                    }
                }

                return false;
            }

            const {node} = emitted;

            /**
             * If returnParams attr exists, insert visibility right before its node.
             * If doesn't exist (is null), then:
             *   If function body is null (ie func is abstract), insert vis right before the ending semicolon
             *   Else insert it right before body (BlockStatement node)
             */
            function fix(fixer) {
                const DEFAULT_VIS = "public";

                if (node.returnParams !== null) {
                    return fixer.insertTextAt(node.returnParams.end, ` ${DEFAULT_VIS}`);
                }

                if (node.is_abstract) {
                    // No BlockStatement node ahead
                    return fixer.insertTextAt(node.end-1, ` ${DEFAULT_VIS}`);
                }

                // TODO: check whether we actually require the spaces on both of public's sides below.
                // Give space only if needed, otherwise it just creates extra (ugly) whitespace.
                return fixer.insertTextBefore(node.body, ` ${DEFAULT_VIS} `);
            }

            (node.modifiers === null || !hasAVisibilityModifier(node.modifiers)) && context.report({
                node,
                fix,
                message: `No visibility specified explicitly for ${node.name || "fallback"} function.`
            });
        }

        return {
            FunctionDeclaration: reportFuncIfNoVisibilitySpecified
        };
    }

};
