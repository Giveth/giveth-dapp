/**
 * @fileoverview Tests for no-type-deduction rule
 * @author Beau Gunderson <beau@beaugunderson.com>
 */

"use strict";

let Solium = require("solium");
let wrappers = require("./utils/wrappers");
let toContract = wrappers.toContract;

let userConfig = {
    rules: {
        "security/no-var": "error"
    }
};

describe("[RULE] no-var: Rejections", function() {
    it("should reject contracts using type deduction through 'var'", function(done) {
        let code = toContract("function foo () { var a = 8; }"),
            errors = Solium.lint(code, userConfig);

        errors.constructor.name.should.equal("Array");
        errors.length.should.equal(1);


        code = toContract(`
			function foo() {
				var (a, b, c, d) = ("helo", 190, true, getSomeValue());
				var c = 9.23;
			}
		`);
        errors = Solium.lint(code, userConfig);
        errors.constructor.name.should.equal("Array");
        errors.length.should.equal(2);

        Solium.reset();

        done();
    });
});
