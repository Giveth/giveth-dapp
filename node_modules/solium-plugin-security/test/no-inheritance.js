/**
 * @fileoverview Tests for no-inheritance rule
 * @author Nicolas Feignon <nfeignon@gmail.com>
 */

"use strict";

let Solium = require("solium");

let userConfig = {
    rules: {
        "security/no-inheritance": "error"
    }
};

let userConfigNoInterface = {
    rules: {
        "security/no-inheritance": ["error", { "no-interface": true }]
    }
};

describe("[RULE] no-inheritance: Acceptances", function() {

    it("should accept programs that don't use inheritance and don't allow interfaces", function(done) {
        let code = "contract Foo {}";
        let errors;

        errors = Solium.lint(code, userConfigNoInterface);
        errors.length.should.equal(0);

        Solium.reset();
        done();
    });

    it("should accept programs that use inheritance with interfaces", function(done) {
        let code = [
            "interface Foo {}\ncontract Bar is Foo {}",
            "interface Foo {}\ninterface Bar {}\ncontract FooBar is Foo,Bar {}"
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

describe("[RULE] no-inheritance: Rejections", function() {

    it("should reject programs that use inheritance and don't allow interfaces", function(done) {
        let code = [
            "contract Parent {}\ncontract Child is Parent {}",
            "interface Foo {}\ncontract Bar is Foo {}"
        ];
        let errors;

        for (let expr of code) {
            errors = Solium.lint(expr, userConfigNoInterface);
            errors.length.should.equal(1);
        }

        Solium.reset();
        done();
    });

    it("should reject programs that use inheritance without interfaces", function(done) {
        let code = [
            "contract Foo {}\ncontract Bar is Foo {}",
            "contract Foo {}\ncontract Bar {}\ncontract FooBar is Foo,Bar {}"
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

describe("[RULE] no-inheritance: Handling options", function() {

    it("should reject rules with invalid user options", function(done) {
        let code = "contract Foo {}";
        let options = [
            ["error", { "no-interffff": true }],
            ["error", { 1: 2 }],
            ["error", { "no-interface": null }],
            ["error", [true]],
            ["error", { "no-interface": [true] }],
            ["error", { "": false }],
            ["error", { "no-interface": true, "extraRandomProperty": "blah" }]
        ];

        for (let option of options) {
            let config = {
                rules: {
                    "security/no-inheritance": option
                }
            };

            Solium.lint.bind(Solium, code, config).
                should.throw("Invalid options were passed to rule \"security/no-inheritance\".");
        }

        Solium.reset();
        done();
    });
});
