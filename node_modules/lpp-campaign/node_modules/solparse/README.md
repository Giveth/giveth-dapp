Solparse is a fork of [Consensys' solidity-parser](https://github.com/ConsenSys/solidity-parser). Solium is heavily dependant on a parser for operating on the AST and so I needed full control over whichever parse was added as a depandancy to the linter. Hence, the fork which I maintain and have the flexibility to release whenever I need to.

# Solparse

A Solidity parser in Javascript. So we can evaluate and alter Solidity code without resorting to cruddy preprocessing.  

### ⚠️ WARNING ⚠️

This is pre-alpha software. The goal of it is to take Solidity code as input and return an object as output that can be used to correctly describe that Solidity code. The structure of the resultant object is highly likely to change as the parser's features get filled out. **This parser is set to ignore Solidity constructs it's not yet able to handle.** Or, it might just error. So watch out.

### Usage

**Library**

    npm install solidity-parser

Then, in your code:

```
    const SolidityParser = require('solidity-parser');

    // Parse Solidity code as a string:
    const result = SolidityParser.parse('contract { ... }');

    // Or, parse a file:
    const result = SolidityParser.parseFile('./path/to/file.sol');
```

You can also parse a file specifically for its imports. This won't return an abstract syntax tree, but will instead return a list of files required by the parsed file:

    const SolidityParser = require('solidity-parser');

    const result = SolidityParser.parseFile('./path/to/file.sol', 'imports');

    console.log(result);
    // [
    //   'SomeFile.sol',
    //   'AnotherFile.sol'
    // ]

**Command Line** (for convenience)

    $ solidity-parser ./path/to/file.js

### Results

Consider this solidity code as input:

    import "Foo.sol";

    contract MyContract {
      mapping (uint => address) public addresses;
    }

You'll receiving the following (or something very similar) as output. Note that the structure of mappings could be made more clear, and this will likely be changed in the future.

    {
      "type": "Program",
      "body": [
        {
          "type": "ImportStatement",
          "value": "Foo.sol"
        },
        {
          "type": "ContractStatement",
          "name": "MyContract",
          "is": [],
          "body": [
            {
              "type": "ExpressionStatement",
              "expression": {
                "type": "DeclarativeExpression",
                "name": "addresses",
                "literal": {
                  "type": "Type",
                  "literal": {
                    "type": "MappingExpression",
                    "from": {
                      "type": "Type",
                      "literal": "uint",
                      "members": [],
                      "array_parts": []
                    },
                    "to": {
                      "type": "Type",
                      "literal": "address",
                      "members": [],
                      "array_parts": []
                    }
                  },
                  "members": [],
                  "array_parts": []
                },
                "is_constant": false,
                "is_public": true
              }
            }
          ]
        }
      ]
    }

### Test

In a checkout of the project, run:

    $ npm test

### License

MIT

