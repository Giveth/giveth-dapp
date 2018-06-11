/**
 * @fileoverview Tests for maximum-statements-in-function rule
 * @author Beau Gunderson <beau@beaugunderson.com>
 */

"use strict";

let Solium = require("solium");
let wrappers = require("./utils/wrappers");
let toContract = wrappers.toContract;

const FUNC_UPPER_LIMIT_DEFAULT = 25;

describe("[RULE] max-statements-in-func: Acceptances", function() {
    const userConfig = {
        rules: {
            "security/max-statements-in-func": "error"
        }
    };

    it(`should accept when no. of statements <= default (${FUNC_UPPER_LIMIT_DEFAULT})`, function(done) {
        const statements = [
            "uint x = 100;\n".repeat(10),
            "if (foo) {\nhello(\n'world'\n); var a = 100;\n}" +
                " else if (true) {\nmyStruct({a: 100,\nb: 'hola!!'});\n} else {\n\n\n\nreturn;\n\n\n}"
        ].join("\n");	// 20 statements

        let funcCode = toContract(`function foo() {\n${statements}}`);
        let errors = Solium.lint(funcCode, userConfig);

        errors.should.be.Array();
        errors.should.have.size(0);


        funcCode = toContract(`function foo() {${"uint x = 100;".repeat(FUNC_UPPER_LIMIT_DEFAULT)}}`);
        errors = Solium.lint(funcCode, userConfig);

        errors.should.be.Array();
        errors.should.have.size(0);

        Solium.reset();
        done();
    });

    it("should accept when no. of statements <= custom-provided limit", function(done) {
        userConfig.rules["security/max-statements-in-func"] = ["error", 20];

        const statements = [
            "uint x = 100;\n".repeat(10),
            "if (foo) {\nhello(\n'world'\n); var a = 100;\n}" +
                " else if (true) {\nmyStruct({a: 100,\nb: 'hola!!'});\n} else {\n\n\n\nreturn;\n\n\n}"
        ].join("\n");   // 20 statements

        let funcCode = toContract(`function foo() {\n${statements}}`);
        let errors = Solium.lint(funcCode, userConfig);

        errors.should.be.Array();
        errors.should.have.size(0);


        funcCode = toContract(`function foo() {${"uint x = 100;".repeat(19)}}`);
        errors = Solium.lint(funcCode, userConfig);

        errors.should.be.Array();
        errors.should.have.size(0);

        Solium.reset();
        done();
    });
});

describe("[RULE] max-statements-in-func: Rejections", function() {
    const userConfig = {
        rules: {
            "security/max-statements-in-func": "error"
        }
    };

    it(`should reject when no. of statements > default (${FUNC_UPPER_LIMIT_DEFAULT})`, function(done) {
        const statements = [
            "uint x = 100;\n".repeat(20),
            "if (foo) {\nhello(\n'world'\n); var a = 100;\n}" +
                " else if (true) {\nmyStruct({a: 100,\nb: 'hola!!'});\n} else {\n\n\n\nreturn;\n\n\n}"
        ].join("\n");   // 30 statements

        let funcCode = toContract(`function foo() {\n${statements}}`);
        let errors = Solium.lint(funcCode, userConfig);

        errors.should.be.Array();
        errors.should.have.size(1);

        Solium.reset();
        done();
    });

    it("should reject functions with no. of statements > custom upper limit", function(done) {
        userConfig.rules["security/max-statements-in-func"] = ["error", 1];

        let code = toContract("function foo () { uint8 a;\n  uint8 b;\n  uint8 c; }"),
            errors = Solium.lint(code, userConfig);

        errors.constructor.name.should.equal("Array");
        errors.length.should.equal(1);

        Solium.reset();

        done();
    });
});
