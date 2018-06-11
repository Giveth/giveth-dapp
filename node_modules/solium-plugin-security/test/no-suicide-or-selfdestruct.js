/**
 * @fileoverview Tests for deprecated-suicide rule
 * @author Federico Bond <federicobond@gmail.com>
 */

"use strict";

let Solium = require("solium");
let wrappers = require("./utils/wrappers");
let toContract = wrappers.toContract;

let userConfig = {
    rules: {
        "security/no-suicide-or-selfdestruct": "error"
    }
};

describe("[RULE] no-suicide-or-selfdestruct: Rejections", function() {
    it("should reject contracts using suicide", function(done) {
        let code = toContract("function foo () { suicide(0x0); }"),
            errors = Solium.lint(code, userConfig);

        errors.constructor.name.should.equal("Array");
        errors.length.should.equal(1);

        Solium.reset();

        done();
    });

    it("should reject contracts using selfdestruct", function(done) {
        let code = toContract("function foo () { selfdestruct(0x0); }"),
            errors = Solium.lint(code, userConfig);

        errors.constructor.name.should.equal("Array");
        errors.length.should.equal(1);

        Solium.reset();

        done();
    });
});
