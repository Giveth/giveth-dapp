/**
 * @fileoverview Tests for else-after-else-if rule
 * @author Michelle Pokrass <michellepokrass@gmail.com>
 */

"use strict";

let Solium = require("solium");

let userConfig = {
    "rules": {
        "security/else-after-elseif": "error"
    }
};

describe("[RULE] else-after-elseif: Rejections", function() {
    it("should raise an error for an else if with no else after it", function(done) {
        let code = [
            "contract Foo { function bar(n) { if (n > 10) { return n; } else if (n < 10) { return -n; } } }",
            "contract Foo { function bar(n) { if (n > 10) { return n; } else if (n < 10) { return -n; } else if (n == 0) { return 1; } } }",
            `contract Foo {
				function bar() {
					if (a)
						bo();
					else if (b)
						ba();
				}
			}
			`,
            `contract Foo {
				function bar() {
					if (a)
						bo();
					else if (b)
						ba();
					else if (c)
						bobo("hello");
				}
			}
			`
        ];
        let errors;

        errors = Solium.lint(code[0], userConfig);
        errors.length.should.equal(1);

        errors = Solium.lint(code[1], userConfig);
        errors.length.should.equal(1);

        errors = Solium.lint(code[2], userConfig);
        errors.length.should.equal(1);

        errors = Solium.lint(code[3], userConfig);
        errors.length.should.equal(1);

        Solium.reset();
        done();
    });
});

describe("[RULE] else-after-elseif: Acceptances", function() {
    it("should not raise any errors for an \"else if\" block followed by an \"else\" block", function(done) {
        let code = [
            "contract Foo { function bar(n) { if (n > 10) { return n; } else if (n < 10) { return -n; } else { return 100; } } }",
            "contract Foo { function bar(n) { if (n > 10) { return n; } else if (n < 10) { return -n; } else if (n == 0) { return 1; } else { return 2; } } }",
            `contract Foo {
				function bar() {
					if (a)
						bo();
					else if (b)
						ba();
					else flow();
				}
			}
			`,
            `contract Foo {
				function bar() {
					if (a)
						bo();
					else if (b)
						ba();
					else if (c)
						bobo("hello");
					else flow();
				}
			}
			`
        ];
        let errors;

        errors = Solium.lint(code[0], userConfig);
        errors.length.should.equal(0);

        errors = Solium.lint(code[1], userConfig);
        errors.length.should.equal(0);

        errors = Solium.lint(code[2], userConfig);
        errors.length.should.equal(0);

        errors = Solium.lint(code[3], userConfig);
        errors.length.should.equal(0);

        Solium.reset();
        done();
    });
});
