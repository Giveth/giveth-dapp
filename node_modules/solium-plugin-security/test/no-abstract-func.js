/**
 * @fileoverview Test for no-abstract-functions rule
 * @author Nicolas Feignon <nfeignon@gmail.com>
 */

"use strict";

let Solium = require("solium");

let userConfig = {
    rules: {
        "security/no-abstract-func": "error"
    }
};


describe("[RULE] no-abstract-func: Acceptances", function() {

    it("should accept contracts that don't use abstract functions", function(done) {
        let code = [
            "contract Foo { function foo () {} }",
            "contract Foo { function foo (uint x, string y) {} }",
            "contract Foo { function foo (uint x) returns (uint) {} }",
            "contract Foo { function foo () payable public {} }",
            "contract Foo { function foo (uint x, string y) MyOwnModifier {} }",
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


describe("[RULE] no-abstract-func: Rejections", function() {

    it("should reject contracts that use abstract functions", function(done) {
        let code = [
            "contract Foo { function foo (); }",
            "contract Foo { function foo (uint x, string y); }",
            "contract Foo { function foo (uint x) returns (uint); }",
            "contract Foo { function foo () payable public; }",
            "contract Foo { function foo (uint x, string y) MyOwnModifier; }",
            "contract Foo { function (); }"
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
