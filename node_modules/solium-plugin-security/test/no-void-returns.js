/**
 * @fileoverview Test for no-void-returns rule
 * @author Nicolas Feignon <nfeignon@gmail.com>
 */

"use strict";

let Solium = require("solium");

let userConfig = {
    rules: {
        "security/no-void-returns": "error"
    }
};

describe("[RULE] no-void-returns: Acceptances", function() {

    it("should accept functions that don't have a void return", function(done) {
        let code = [
            "contract Foo { function () returns (uint256, string) {} }",
            "contract Foo { function foo () payable public returns (string); }",
            "contract Foo { function foo () returns (string) {} }"
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

describe("[RULE] no-void-returns: Rejections", function() {

    it("should reject functions that have a void return", function(done) {
        let code = [
            "contract Foo { function () {} }",
            "contract Foo { function foo () MyOwnModifier; }",
            "contract Foo { function foo () payable public; }"
        ];
        let errors;

        for (let expr of code) {
            errors = Solium.lint(expr, userConfig);
            errors.length.should.equal(1);
        }

        Solium.reset();
        done();
    });
});
