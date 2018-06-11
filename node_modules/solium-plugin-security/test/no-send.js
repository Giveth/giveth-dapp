/**
 * @fileoverview Tests for the no-send rule
 * @author Tristan Homsi <tristanhomsi@gmail.com>
 */

"use strict";

let Solium = require("solium");

let userConfig = {
    rules: {
        "security/no-send": "error"
    }
};

describe("[RULE] no-send: Rejections", function() {

    it("should reject contracts using send", function(done) {
        // Example from here:
        // http://solidity.readthedocs.io/en/develop/security-considerations.html#re-entrancy
        let code = "contract Fund {\
			mapping(address => uint) shares; \
			function other() {return 0;}\
			function withdraw() {\
				if (msg.sender.send(shares[msg.sender]))\
					shares[msg.sender] = 0;\
				other();\
			}\
		}",
            errors = Solium.lint(code, userConfig);

        errors.constructor.name.should.equal("Array");
        errors.length.should.equal(1);

        Solium.reset();
        done();
    });

    it("should work correctly for non-property functions, regardless of name", function(done) {
        let code = "contract Fund {\
			mapping(address => uint) shares; \
			function send() {return 0;}\
			function main() {\
				send();\
			}\
		}",
            errors = Solium.lint(code, userConfig);

        errors.length.should.equal(0);

        Solium.reset();
        done();
    });

});
