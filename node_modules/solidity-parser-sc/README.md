[![Build Status](https://travis-ci.org/ConsenSys/solidity-parser.svg?branch=master)](https://travis-ci.org/ConsenSys/solidity-parser)

## [consensys/solidity-parser](https://github.com/ConsenSys/solidity-parser) with additional project specific grammar rules
For code analysis of contract systems that use custom pre-processsing to deploy or run their tests.

Additions:

**Interpolation (Gnosis)**: 
  + e.g. `{{Variable}}`: used to defer address assignments to contract contructors until
  the contracts' execution context is known.
  ```javascript
  EventFactory constant eventFactory = EventFactory({{EventFactory}});
  address constant marketMaker = {{LMSRMarketMaker}};
  ```
### License

MIT
