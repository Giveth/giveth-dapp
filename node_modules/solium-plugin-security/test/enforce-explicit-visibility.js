/**
 * @fileoverview Tests for enforce-loop-bounds rule
 * @author Nicolas Feignon <nfeignon@gmail.com>
 */

"use strict";

const Solium = require("solium"),
    { toContract } = require("./utils/wrappers");

const userConfig = {
    rules: {
        "security/enforce-explicit-visibility": "error"
    }
};


describe("[RULE] enforce-explicit-visibility: fixes", () => {

    it("should add default public visibility where none is specified", done => {
        let code = toContract(`
            function foo() payable returns(uint x, string exa, bytes32) {
                foobar();
            }
        `);
        let result = Solium.lintAndFix(code, userConfig);

        result.should.be.type("object");
        result.errorMessages.should.have.size(0);
        result.fixesApplied.should.have.size(1);
        result.fixedSourceCode.should.equal(toContract(`
            function foo() payable returns(uint x, string exa, bytes32) public {
                foobar();
            }
        `));


        code = toContract(`
            function foo() payable returns(uint x, string exa, bytes32){
                foobar();
            }
        `);
        result = Solium.lintAndFix(code, userConfig);

        result.should.be.type("object");
        result.errorMessages.should.have.size(0);
        result.fixesApplied.should.have.size(1);
        result.fixedSourceCode.should.equal(toContract(`
            function foo() payable returns(uint x, string exa, bytes32) public{
                foobar();
            }
        `));


        code = toContract(`
            function() returns (bool) {
                foobar();
            }
        `);
        result = Solium.lintAndFix(code, userConfig);

        result.should.be.type("object");
        result.errorMessages.should.have.size(0);
        result.fixesApplied.should.have.size(1);
        result.fixedSourceCode.should.equal(toContract(`
            function() returns (bool) public {
                foobar();
            }
        `));


        code = toContract(`
            function() returns (bool);
        `);
        result = Solium.lintAndFix(code, userConfig);

        result.should.be.type("object");
        result.errorMessages.should.have.size(0);
        result.fixesApplied.should.have.size(1);
        result.fixedSourceCode.should.equal(toContract(`
            function() returns (bool) public;
        `));


        code = toContract(`
            function foo() payable myModif booba;
        `);
        result = Solium.lintAndFix(code, userConfig);

        result.should.be.type("object");
        result.errorMessages.should.have.size(0);
        result.fixesApplied.should.have.size(1);
        // extra space before "public" remains till the time its issue is fixed in the rule
        result.fixedSourceCode.should.equal(toContract(`
            function foo() payable myModif booba public;
        `));


        code = toContract(`
            function foo() payable myModif booba;
        `);
        result = Solium.lintAndFix(code, userConfig);

        result.should.be.type("object");
        result.errorMessages.should.have.size(0);
        result.fixesApplied.should.have.size(1);
        result.fixedSourceCode.should.equal(toContract(`
            function foo() payable myModif booba public;
        `));


        code = toContract(`
            function foo() payable myModif booba {}
        `);
        result = Solium.lintAndFix(code, userConfig);

        result.should.be.type("object");
        result.errorMessages.should.have.size(0);
        result.fixesApplied.should.have.size(1);
        // extra space before "public" remains till the time its issue is fixed in the rule
        result.fixedSourceCode.should.equal(toContract(`
            function foo() payable myModif booba  public {}
        `));


        code = toContract(`
            function foo() payable myModif booba{}
        `);
        result = Solium.lintAndFix(code, userConfig);

        result.should.be.type("object");
        result.errorMessages.should.have.size(0);
        result.fixesApplied.should.have.size(1);
        result.fixedSourceCode.should.equal(toContract(`
            function foo() payable myModif booba public {}
        `));


        code = toContract(`
            function foo() payable myModif booba
            {
                chumma_de(100);
            }
        `);
        result = Solium.lintAndFix(code, userConfig);
        result.errorMessages.should.have.size(0);
        result.fixesApplied.should.have.size(1);
        result.fixedSourceCode.should.equal(toContract(`
            function foo() payable myModif booba
             public {
                chumma_de(100);
            }
        `));
        

        done();
    });

});

// TODO: Acceptance & Rejection tests
