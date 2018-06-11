/**
 * @fileoverview Tests for max-one-break-per-loop rule
 * @author Artem Litchmanov <artem.litchmanov@gmail.com>
 */

"use strict";

let Solium = require("solium");
let wrappers = require("./utils/wrappers");
let toContract = wrappers.toContract;

let userConfig = {
    "rules": {
        "security/one-break-per-loop": "error"
    }
};

describe("[RULE] one-break-per-loop: Acceptances", function() {

    it("should accept all loops that have one or less breaks in them", function(done) {
        let code = [
            "function foo () { for(uint i = 0; i<10; i++) {break; for(uint j = 0; j<10; j++) {break;}} }",
            "function foo () { for(uint i = 0; i<10; i++) {for(uint j = 0; j<10; j++) {break;} break;} }",
            "function foo () { do { break;} while (1);  for(uint i = 0; i < 10; i++) { break; } }",
            "function foo () { for(uint i = 0; i < 10; i++) { uint x=1; } }",
            "function foo () { while(true) {break;} }",
            "function foo () { while(x!=1) { x=1; } }",
            "function foo () { do { foo (); } while (i < 20); }",
            "function foo () { do { break; } while (i < 20); }",
            "function foo () { if(1=1){break;} do { break; } while (i < 20); }"
        ];
        let errors;

        code = code.map(function(item){return toContract(item);});

        errors = Solium.lint(code[0], userConfig);
        errors.length.should.equal(0);
        errors = Solium.lint(code[1], userConfig);
        errors.length.should.equal(0);
        errors = Solium.lint(code[2], userConfig);
        errors.length.should.equal(0);
        errors = Solium.lint(code[3], userConfig);
        errors.length.should.equal(0);
        errors = Solium.lint(code[4], userConfig);
        errors.length.should.equal(0);
        errors = Solium.lint(code[5], userConfig);
        errors.length.should.equal(0);
        errors = Solium.lint(code[6], userConfig);
        errors.length.should.equal(0);
        errors = Solium.lint(code[7], userConfig);
        errors.length.should.equal(0);
        errors = Solium.lint(code[8], userConfig);
        errors.length.should.equal(0);
        Solium.reset();
        done();
    });
});


describe("[RULE] one-break-per-loop: Rejections", function() {

    it("should reject all loops that have two or more breaks in them", function(done) {
        let code = [
            "function foo () { for(uint i = 0; i<10; i++) {break; break;} }",
            "function foo () { for(uint i = 0; i < 10; i++) { uint x=1; if(x=1){break;} if(x=2){break;} } }",
            "function foo () { while(true) {break;break;} }",
            "function foo () { while(x!=1) { x=1; if(x=1){break;} if(x=2){break;} if(x=3){break;} } }",
            "function foo () { do { break; break; } while (i < 20); }",
            "function foo () { do { if(x=1){break;} if(x=2){break;} if(x=3){break;} } while (i < 20); }",
            "function foo () { for(uint i = 0; i<10; i++) {break; for(uint j = 0; j<10; j++) {break;} break;} }",
            "function foo () { for(uint i = 0; i<10; i++) {for(uint j = 0; j<10; j++) {break; break;} break;} }"
        ];
        let errors;

        code = code.map(function(item){return toContract(item);});

        errors = Solium.lint(code[0], userConfig);
        errors.length.should.equal(1);
        errors = Solium.lint(code[1], userConfig);
        errors.length.should.equal(1);
        errors = Solium.lint(code[2], userConfig);
        errors.length.should.equal(1);
        errors = Solium.lint(code[3], userConfig);
        errors.length.should.equal(1);
        errors = Solium.lint(code[4], userConfig);
        errors.length.should.equal(1);
        errors = Solium.lint(code[5], userConfig);
        errors.length.should.equal(1);
        errors = Solium.lint(code[6], userConfig);
        errors.length.should.equal(1);
        errors = Solium.lint(code[7], userConfig);
        errors.length.should.equal(1);
        Solium.reset();
        done();
    });
});
