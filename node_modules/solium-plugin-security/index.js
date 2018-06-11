/**
 * @fileoverview Entry Point of Solium security plugin
 * @author Raghav Dua <duaraghav8@gmail.com>
 */

"use strict";

module.exports = {
    meta: {
        description: "Official Security-focused lint rules for Solium"
    },

    rules: {
        "256-bit-ints-only": require("./rules/256-bit-ints-only"),
        "else-after-elseif": require("./rules/else-after-elseif"),
        "enforce-explicit-visibility": require("./rules/enforce-explicit-visibility"),
        "enforce-loop-bounds": require("./rules/enforce-loop-bounds"),
        "enforce-placeholder-last": require("./rules/enforce-placeholder-last"),
        "max-statements-in-func": require("./rules/max-statements-in-func"),
        "no-abstract-func": require("./rules/no-abstract-func"),
        "no-assign-params": require("./rules/no-assign-params"),
        "no-bit-operations": require("./rules/no-bit-operations"),
        "no-block-members": require("./rules/no-block-members"),
        "no-call-value": require("./rules/no-call-value"),
        "no-continue": require("./rules/no-continue"),
        "no-fixed": require("./rules/no-fixed"),
        "no-func-overriding": require("./rules/no-func-overriding"),
        "no-inline-assembly": require("./rules/no-inline-assembly"),
        "no-inheritance": require("./rules/no-inheritance"),
        "no-multiple-inheritance": require("./rules/no-multiple-inheritance"),
        "no-low-level-calls": require("./rules/no-low-level-calls"),
        "no-modify-for-iter-var": require("./rules/no-modify-for-iter-var"),
        "no-named-params": require("./rules/no-named-params"),
        "no-named-returns": require("./rules/no-named-returns"),
        "no-send": require("./rules/no-send"),
        "no-sha3": require("./rules/no-sha3"),
        "no-suicide-or-selfdestruct": require("./rules/no-suicide-or-selfdestruct"),
        "no-throw": require("./rules/no-throw"),
        "no-tx-origin": require("./rules/no-tx-origin"),
        "no-unreachable-code": require("./rules/no-unreachable-code"),
        "no-user-defined-modifiers": require("./rules/no-user-defined-modifiers"),
        "no-var": require("./rules/no-var"),
        "no-void-returns": require("./rules/no-void-returns"),
        "one-break-per-loop": require("./rules/one-break-per-loop"),
        "return-at-end": require("./rules/return-at-end")
    }
};
