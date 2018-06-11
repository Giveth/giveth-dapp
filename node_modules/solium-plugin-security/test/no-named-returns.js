/**
 * @fileoverview Test for no-named-returns rule
 * @author Nicolas Feignon <nfeignon@gmail.com>
 */

"use strict";

let Solium = require("solium");

let userConfig = {
    rules: {
        "security/no-named-returns": "error"
    }
};

describe("[RULE] no-named-returns: Acceptances", function() {

    it("should accept functions that don't have a named return", function(done) {
        let code = [
            "contract Foo { function () returns (uint256, string) {} }",
            "contract Foo { function foo () returns (string) {} }",
            "contract Foo { function () {} }"
        ];
        let errors;

        for (let expr of code) {
            errors = Solium.lint(expr, userConfig);
            errors.length.should.equal(0);
        }

        Solium.reset();
        done();
    });
});

describe("[RULE] no-named-returns: Rejections", function() {

    it("should reject functions that have a named return", function(done) {
        let code = [
            "contract Foo { function () returns (uint256 foo, string bar) {} }",
            "contract Foo { function foo () returns (uint256 foo) {} }",
            "contract Foo { function () returns (string bar) {} }"
        ];
        let errors;

        errors = Solium.lint(code[0], userConfig);
        errors.length.should.equal(2);
        errors = Solium.lint(code[1], userConfig);
        errors.length.should.equal(1);
        errors = Solium.lint(code[2], userConfig);
        errors.length.should.equal(1);

        Solium.reset();
        done();
    });
});
