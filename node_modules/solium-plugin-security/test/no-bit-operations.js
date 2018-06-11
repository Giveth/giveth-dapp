/**
 * @fileoverview Tests for no-bit-operations rule
 * @author Beau Gunderson <beau@beaugunderson.com>
 */

"use strict";

let Solium = require("solium");
let wrappers = require("./utils/wrappers");
let toContract = wrappers.toContract;

let userConfig = {
    rules: {
        "security/no-bit-operations": 1
    }
};

describe("[RULE] no-bit-operations: Rejections", function() {
    it("should reject contracts using bit operations (in declaration)", function(done) {
        let code = toContract("function foo () { uint a = 2 >> 4; }"),
            errors = Solium.lint(code, userConfig);

        errors.constructor.name.should.equal("Array");
        errors.length.should.equal(1);

        Solium.reset();

        done();
    });

    it("should reject contracts using bit operations (in assignment)", function(done) {
        let code = toContract("function foo () { uint a = 2; a >>= 4; }");
        let errors = Solium.lint(code, userConfig);

        errors.constructor.name.should.equal("Array");
        errors.length.should.equal(1);

        Solium.reset();

        done();
    });

    it("should reject contracts using bit operations (in statements)", function(done) {
        let code = toContract("function foo () { if (2 >> 4) { } }"),
            errors = Solium.lint(code, userConfig);

        errors.constructor.name.should.equal("Array");
        errors.length.should.equal(1);

        Solium.reset();

        done();
    });
});
