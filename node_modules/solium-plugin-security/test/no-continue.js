/**
 * @fileoverview Tests for no-continue rule
 * @author Simon Hajjar <simon.j.hajjar@gmail.com>
 */

"use strict";

let Solium = require("solium");

let userConfig = {
    "rules": {
        "security/no-continue": "error"
    }
};

describe("[RULE] no-continue: Acceptances", function() {
    it("should accept loops without continue statements", function(done) {
        let code = `
			contract A {
				function() {
					while (true) { break; }
				}
				function bleh() {
					while(true) {
						blah(100, 200);
					}

					do {} while (true);

					for (uint i = 0; i < 10; i++) {
						var x = 100;
						x++;
					}
				}
			}
		`;
        let errors = Solium.lint(code, userConfig);

        errors.constructor.name.should.equal("Array");
        errors.should.be.size(0);

        Solium.reset();
        done();
    });
});

describe("[RULE] no-continue: Rejections", function() {
    it("should raise an error for a continue statement", function(done) {
        let code = `
			contract A {
				function() {
					while (true) { continue; }
				}
				function bleh() {
					while(true) {
						continue;
					}

					do {
						foobar("hello");
						continue;
					} while (true);

					for (uint i = 0; i < 10; i++) {
						continue;
					}
				}
			}
		`;
        let errors = Solium.lint(code, userConfig);

        errors.constructor.name.should.equal("Array");
        errors.should.be.size(4);

        Solium.reset();
        done();
    });
});
