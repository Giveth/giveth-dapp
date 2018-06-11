/**
 * @fileoverview Tests for no-unreachable-code rule
 * @author Beau Gunderson <beau@beaugunderson.com>
 */

"use strict";

let Solium = require("solium");
let wrappers = require("./utils/wrappers");
let toContract = wrappers.toContract;

let userConfig = {
    rules: {
        "security/no-unreachable-code": "error"
    }
};

describe("[RULE] no-unreachable-code: Rejections", function() {
    it("should reject contracts with unreachable code", function(done) {
        let code = toContract("function foo () { return; fixed a; }"),
            errors = Solium.lint(code, userConfig);

        errors.constructor.name.should.equal("Array");
        errors.length.should.equal(1);

        code = toContract(`
			uint abc = 100;

			function foo() {
				var x = 100;
				return bleh("Hello world");
				abc;
			}
		`);
        errors = Solium.lint(code, userConfig);
        errors.constructor.name.should.equal("Array");
        errors.length.should.equal(1);


        code = toContract(`
			function foo() {
				if (blah) {
					return;
				}

				return;
				call(100, 0x00);
			}
		`);
        errors = Solium.lint(code, userConfig);
        errors.constructor.name.should.equal("Array");
        errors.length.should.equal(1);


        code = toContract(`
			function foo() {
				return 100;
				return 100;
			}
		`);
        errors = Solium.lint(code, userConfig);
        errors.constructor.name.should.equal("Array");
        errors.length.should.equal(1);


        Solium.reset();
        done();
    });
});

describe("[RULE] no-unreachable-code: Acceptances", function() {
    it("should not lint abstract functions", done => {
        let code = toContract("function foobar(uint x, address baby) payable;"),
            errors = Solium.lint(code, userConfig);

        errors.should.be.Array();
        errors.should.have.size(0);


        code = toContract("function foobar(uint x, address baby) returns (uint x, string);");
        errors = Solium.lint(code, userConfig);

        errors.should.be.Array();
        errors.should.have.size(0);


        code = toContract("function();");
        errors = Solium.lint(code, userConfig);

        errors.should.be.Array();
        errors.should.have.size(0);

        done();
    });

    it("should accept contracts without a return", function(done) {
        let code = toContract("function foo () { fixed a = 2.0; }");
        let errors = Solium.lint(code, userConfig);

        errors.constructor.name.should.equal("Array");
        errors.length.should.equal(0);

        // Below cases are beyond the scope of a static analyzer to detect, so not flagged
        code = toContract(`
			function foo() {
				do {
					blah();
					return;
				} while (true);

				callMyMethod();
			}
		`);
        errors = Solium.lint(code, userConfig);
        errors.constructor.name.should.equal("Array");
        errors.length.should.equal(0);


        code = toContract(`
			function foo() {
				if (foobae) {
					haxor("blah");
				} else {
					return 100;
				}

				someFunc();
			}
		`);
        errors = Solium.lint(code, userConfig);
        errors.constructor.name.should.equal("Array");
        errors.length.should.equal(0);

        code = toContract(`
			function foo() {
				if (x) {
					return;
				} else {
					return;
				}

				someFunc();
			}
		`);
        errors = Solium.lint(code, userConfig);
        errors.constructor.name.should.equal("Array");
        errors.length.should.equal(0);


        Solium.reset();

        done();
    });
});
