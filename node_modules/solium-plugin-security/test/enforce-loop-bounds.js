/**
 * @fileoverview Tests for enforce-loop-bounds rule
 * @author Nicolas Feignon <nfeignon@gmail.com>
 */

"use strict";

let Solium = require("solium");
let wrappers = require("./utils/wrappers");
let toContract = wrappers.toContract;

let userConfig = {
    rules: {
        "security/enforce-loop-bounds": "error"
    }
};

/**
 * To Test:
 * - Loops with & without brace body
 * - Loops with break as root expression
 * - Loops with branches (of multiple depth) that contain break expression
 * - Branches with & without brace body
 * - All kinds of static truthy expressions (true, int, decimal, bool, string, array)
 * - consequents and alternatives starting on same or different lines
 */

describe("[RULE] enforce-loop-bounds: Acceptances", function() {

    it("should accept all loops that have fixed bounds", function(done) {
        let code = [
            "function foo () { for(int i=0; i<10; i++) {} }",
            "function foo () { for(;0;) {} }",
            "function foo () { while(0 > 1) {} }",
            "function foo () { while(x > 10) {} }",
            "function foo () { do {} while(0); }",
            "function foo () { for (;;) { break; } }",
            "function foo () { while (true) { if (true) { break; } } }",
            "function foo () { while (true) { if (true) {} else { break; } } }",
            "function foo () { while (true) { if (true) {} else if (0) { break; } } }",
            "function foo () { while (true) { if (true) {} else if (1) {} else { break; } } }",
            "function foo () { while (true) { if (true) {} else if (1) {} else if (1) {} else { break; } } }",
            "function foo () { do { if (1) {} else if (true) { break; } } while(true); }"
        ];
        let errors;

        for (let expr of code) {
            errors = Solium.lint(toContract(expr), userConfig);
            errors.length.should.equal(0);
        }


        code = `
        function foo() {
            while (getCondition()) {}
            for (var i = 10; i < 9018; i++) { call(); }
            do {
                blah("hello");
            } while (a != 10);

            while (getCondition())
                var x = 10;
            for (var i = 10; i < 9018; i++) var x = 10;
            do x = 10; while (x != 10);

            while (getCondition()) { var x = 100; break; blah(); }
            for (var i = 10; i < 9018; i++) { hall(); break; }
            do {
                break;
            } while (a != 10);

            while (1) {
                if (blah)
                    break;
            }

            while (1) {
                if (blah)
                    if (!gaah()) break;
            }

            for (;;) {
                if (blah) {
                    call(100, "hello world");
                    break;
                    var x = 0x00;
                }
            }

            while (100) {
                if (blah)
                    boo(100);
                else if (!abra) break;
            }

            while (100) {
                if (blah)
                    boo(100);
                else if (!abra) break;
            }

            do {
                if (blah) {
                    hauz(0x00);
                } else {
                    call(100, "hello world");
                    break;
                }
            } while (10290);

            do {
                if (blah) {
                    hauz(0x00);
                }
                else
                    break;
            } while (-192983);

            do {
                if (blah) {
                    hauz(0x00);
                }
                else
                    break;
            } while (true);

            while (true) {
                if (a) {
                    if (b()) {
                        if (c != d) {
                            break;
                        }
                    }
                }
            }

            do {
                if (foo) {
                    blah();
                }
                else if (a) {
                    if (b()) {
                        if (c != d) {
                            break;
                        }
                    }
                }
            } while (true);
        }
        `;
        errors = Solium.lint(toContract(code), userConfig);
        errors.should.have.size(0);

        Solium.reset();
        done();
    });
});


describe("[RULE] enforce-loop-bounds: Rejections", function() {

    it("should reject all loops that don't have fixed bounds", function(done) {
        let code = [
            "function foo () { for(;;) {} }",
            "function foo () { while(true) {} }",
            "function foo () { for(;;) {} }",
            "function foo () { do {} while(1); }",
            "function foo () { do { do { break; } while (true); } while(true); }"
        ];
        let errors;

        for (let expr of code) {
            errors = Solium.lint(toContract(expr), userConfig);
            errors.length.should.equal(1);
        }


        code = `
        function foo() {
            while (1) {}
            for (var i = 10; true; i++) { call(); }
            do {
                blah("hello");
            } while (true);

            while ()
                var x = 10;
            for (;;) var x = 10;
            do x = 10; while (true);

            while (1786) { var x = 100; blah(); }
            for (var i = 10; 69; i++) { hall(); }

            /*************************************
            // TODO: Enable below test once we handle test.argument.value (when test cond. has negative number)
            do {
                call();
            } while (-19028);
            *************************************/

            while (1) {
                if (blah)
                    make(100, "Hello world");
            }

            while (1780) {
                if (blah)
                    if (!gaah()) var x = foo;
            }

            for (;;) {
                if (blah) {
                    call(100, "hello world");
                    var x = 0x00;
                }
            }

            while (100) {
                if (blah)
                    boo(100);
                else if (!abra) abacus += 1902; fork();
            }

            /*************************************
            // TODO: Enable below test once we handle test.argument.value (when test cond. has negative number)
            while (-1111) {
                if (blah)
                    boo(100);
                else if (!abra) boo;
            }
            *************************************/

            do {
                if (blah) {
                    hauz(0x00);
                } else {
                    call(100, "hello world");
                }
            } while (true);

            do {
                if (blah) {
                    hauz(0x00);
                }
                else
                    if (iambadass) becomegoodass();
            } while (1);

            do {
                if (blah) {
                    hauz(0x00);
                }
                else
                    randomize();
                foobar("Hello world");
            } while (true);

            while (true) {
                if (a) {
                    if (b()) {
                        if (c != d) {
                            if (true) {} else {}
                        }
                    }
                }
            }

            do {
                if (foo) {
                    blah();
                }
                else if (a) {
                    if (b()) {
                        if (c != d) {
                            address axa = 0x00;
                        }
                    }
                }
            } while (true);
        }
        `;
        errors = Solium.lint(toContract(code), userConfig);
        errors.should.have.size(17);


        Solium.reset();
        done();
    });
});
