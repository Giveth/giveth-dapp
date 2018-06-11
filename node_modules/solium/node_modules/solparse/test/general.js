"use strict";

let SolidityParser = require("../index.js");

describe("Parser", function() {
    it("parses documentation examples without throwing an error", function() {
        SolidityParser.parseFile("./test/doc_examples.sol", true);
    });

    it("parses documentation examples using imports parser without throwing an error", function() {
        SolidityParser.parseFile("./test/doc_examples.sol", "imports", true);
    });
});

describe("Built Parser", function() {
    it("parses documentation examples without throwing an error", function() {
        SolidityParser.parseFile("./test/doc_examples.sol", false);
    });

    it("parses documentation examples using imports parser without throwing an error", function() {
        SolidityParser.parseFile("./test/doc_examples.sol", "imports", false);
    });
});

describe("Parse comments", () => {
    function isAValidCommentToken(c, sc) {
        return (
            ["Line", "Block"].includes(c.type) && typeof c.text === "string" &&
            (c.text.startsWith("//") || c.text.startsWith("/*")) && Number.isInteger(c.start) &&
            Number.isInteger(c.end) && sc.slice(c.start, c.end) === c.text
        );
    }

    it("should parse comments", () => {
        const sourceCode = require("fs").readFileSync("./test/doc_examples.sol", "utf8");
        const comments = SolidityParser.parseComments(sourceCode);

        const expectedCommLen = 60;

        if (comments.length !== expectedCommLen) {
            throw new Error(`there should be ${expectedCommLen} comment objects`);
        }

        comments.forEach(com => {
            if (!isAValidCommentToken(com, sourceCode)) {
                throw new Error(`${com} is not a valid comment token.`);
            }
        });
    });
});
