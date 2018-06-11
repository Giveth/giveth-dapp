/**
 * @fileoverview Tests for no-mod-iter-var-for-loop rule
 * @author Nicolas Feignon <nfeignon@gmail.com>
 */

"use strict";

let Solium = require("solium");
let wrappers = require("./utils/wrappers");
let toContract = wrappers.toContract;

let userConfig = {
    rules: {
        "security/no-modify-for-iter-var": "error"
    }
};

describe("[RULE] no-modify-for-iter-var: Acceptances", function() {

    it("should accept for loops that don't modifify their iteration variable", function(done) {
        let code = [
            "function foo() { for(i = 0; i < 10; i++) { i + 1; } }",
            "function foo() { for(;;) {} }",
            "function foo() { for(a;;) { a++; } }",
            "function foo() { \n    for (uint i = 0; i < self.length; i++)\n    s += self[i]; }"
        ];
        let errors;

        for (let e of code) {
            errors = Solium.lint(toContract(e), userConfig);
            errors.length.should.equal(0);
        }

        Solium.reset();
        done();
    });
});


describe("[RULE] no-modify-for-iter-var: Rejections", function() {

    it("should reject for loops that modify their iteration variable", function(done) {
        let code = [
            "function foo () { for(i = 0; i < 10; i++) { i = 5; } }",
            "function foo () { for(i = 0; i < 10; i++) { i++; } }",
            "function foo () { for(i = 0; i < 10; i++) { i += 1; } }",
            "uint i = 2093; function foo() { for(uint i = 0; i < 3; i++) { i+= 10; } }"
        ];
        let errors;

        for (let e of code) {
            errors = Solium.lint(toContract(e), userConfig);
            errors.length.should.equal(1);
        }

        Solium.reset();
        done();
    });
});
