/**
 * @fileoverview Tests for no-user-defined-modifiers rule
 * @author Beau Gunderson <beau@beaugunderson.com>
 */

"use strict";

let Solium = require("solium");
let wrappers = require("./utils/wrappers");
let toContract = wrappers.toContract;

let userConfig = {
    rules: {
        "security/no-user-defined-modifiers": "error"
    }
};

describe("[RULE] no-user-defined-modifiers: Rejections", function() {
    it("should reject contracts that defined modifiers", function(done) {
        let code = toContract("modifier foo () { require(1 == 1); }"),
            errors = Solium.lint(code, userConfig);

        errors.constructor.name.should.equal("Array");
        errors.length.should.equal(1);

        Solium.reset();
        done();
    });
});
