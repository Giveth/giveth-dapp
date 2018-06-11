var SolidityParser = require("../index.js");

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
