# The official Security Plugin for Solium

[![Build Status](https://travis-ci.org/duaraghav8/solium-plugin-security.svg?branch=master)](https://travis-ci.org/duaraghav8/solium-plugin-security)

This Plugin provides security-focused lint rules for [Solium](https://github.com/duaraghav8/Solium).

The rules have been taken from Consensys' [Recommended Smart Contract Practices](https://consensys.github.io/smart-contract-best-practices/recommendations/) and Solium's [Rule Wishlist](https://github.com/duaraghav8/Solium/issues/44).

## Installation
**NOTE: If you're using Solium `v1.0.1` or above, this plugin comes pre-installed as a local dependency and you can skip this section.**

`npm install -g solium-plugin-security`

## Usage
**NOTE: If you've installed Solium `v1.0.1` or above and created `soliumrc.json` using `solium --init`, you can skip this step since solium automatically applies the security plugin for you.**

Add `security` to your `soliumrc.json`'s `plugins` array. Your configuration file should look like:

```json
{
    "extends": "solium:all",
    "plugins": ["security"],
    "rules": {
        ...
    }
}
```

## List of rules
Below are the rules supplied by this plugin and the information on passing options to them and their auto-fixing capabilities.

Some of them aren't always desirable and are therefore disabled by default (marked below as `OFF`). You should explicitly enable them in your `.soliumrc.json`.

| Name                                 | Description                                                                                      | Options                           | Defaults                             | Fixes |
|--------------------------------------|--------------------------------------------------------------------------------------------------|-----------------------------------|--------------------------------------|-------|
| no-throw                             | Discourage use of 'throw' statement for error flagging                                           |                                   |                                      | YES   |
| no-tx-origin                         | Discourage use of 'tx.origin' global variable                                                    |                                   |                                      |       |
| enforce-explicit-visibility          | Encourage user to explicitly specify visibility of function                                      |                                   |                                      | YES   |
| no-block-members                     | Discourage use of members 'blockhash' & 'timestamp' (and alias 'now') of 'block' global variable | List of members to warn against   | ["blockhash", "timestamp"]           |       |
| no-call-value                        | Discourage use of .call.value()()                                                                |                                   |                                      |       |
| no-assign-params                     | Disallow assigning to function parameters                                                        |                                   |                                      |       |
| no-fixed                             | Disallow fixed point types                                                                       |                                   |                                      |       |
| no-inline-assembly                   | Discourage use of inline assembly                                                                |                                   |                                      |       |
| no-low-level-calls                   | Discourage the use of low-level functions - call(), callcode() & delegatecall()                  | List of functions to warn against | ["call", "callcode", "delegatecall"] |       |
| no-modify-for-iter-var               | Discourage user to modify a for loop iteration counting variable in the loop body                |                                   |                                      |       |
| no-send                              | Discourage the use of unsafe method 'send'                                                       |                                   |                                      |       |
| no-sha3                              | Encourage use of 'keccak256()' over 'sha3()' function                                            |                                   |                                      | YES   |
| no-unreachable-code                  | Disallow unreachable code                                                                        |                                   |                                      |       |
| `OFF` else-after-elseif              | Encourage user to use else statement after else-if statement                                     |                                   |                                      |       |
| `OFF` enforce-loop-bounds            | Encourage use of loops with fixed bounds                                                         |                                   |                                      |       |
| `OFF` enforce-placeholder-last       | Enforce that the function placeholder is the last statement in the modifier                      |                                   |                                      |       |
| `OFF` return-at-end                  | Discourage use of early returns in functions                                                     |                                   |                                      |       |
| `OFF` one-break-per-loop             | Discourage use of multiple breaks in while/for/do loops                                          |                                   |                                      |       |
| `OFF` max-statements-in-func         | Enforce upper limit on number of statements inside a function                                    | Maximum number of statements      | 25                                   |       |
| `OFF` no-abstract-func               | Discourage use of abstract functions                                                             |                                   |                                      |       |
| `OFF` no-bit-operations              | Disallow bitwise operations                                                                      |                                   |                                      |       |
| `OFF` no-continue                    | Discourage use of 'continue' statement                                                           |                                   |                                      |       |
| `OFF` no-inheritance                 | Discourage use of inheritance                                                                    | Disallow interface inheritance    | { "no-interface": false }            |       |
| `OFF` no-multiple-inheritance        | Discourage use of multiple inheritance                                                           | Disallow interface inheritance    | { "no-interface": false }            |       |
| `OFF` no-named-params                | Disallow named function parameters                                                               |                                   |                                      |       |
| `OFF` no-named-returns               | Discourage use of named returns in functions                                                     |                                   |                                      |       |
| `OFF` 256-bit-ints-only              | Disallow non-256 bit integers                                                                    |                                   |                                      |       |
| `OFF` no-suicide-or-selfdestruct     | Disallow suicide and selfdestruct                                                                |                                   |                                      |       |
| `OFF` no-var                         | Disallow type deduction via `var`                                                                |                                   |                                      |       |
| `OFF` no-user-defined-modifiers      | Disallow user-defined modifiers                                                                  |                                   |                                      |       |
| `OFF` no-void-returns                | Discourage use of void returns in functions prototypes                                           |                                   |                                      |       |
| `OFF` no-func-overriding             | Discourage function overriding                                                                   |                                   |                                      |       |

An example `soliumrc.json` configuring and applying this plugin is:

```json
{
    "plugins": ["security"],
    "rules": {
        "some-other-solium-rule": 1,
        "security/no-low-level-calls": ["error", ["call", "delegatecall"]],
        "security/no-block-members": [1, ["timestamp"]],
        "security/no-throw": "off"
    }
}
```
This tells solium to apply the 3 `security/` rules with special configuration provided and apply the remaining rules of the plugin with their default configurations. If you want to disable a plugin rule, you have to explicitly disable it inside `rules`.

Lint normally using `solium -d contracts/` or `solium -d contracts/ --fix` to apply fixes as well.

## Developer Setup
- `git clone <URL-of-this-repo>`
- `cd solium-plugin-security`
- `npm install --dev`
- `npm link`
- `npm link solium-plugin-security`
- `npm test`

If you'd also like to use your develop build of this plugin with dev build of Solium, go to Solium's directory and run `npm link solium-plugin-security`. This will let Solium access your modified plugin instead of its pre-installed security module.

Access Solium's [Developer Docs](http://solium.readthedocs.io/en/latest/developer-guide.html)

## Roadmap
- [ ] Add automated tests
- [ ] Refine rule `enforce-explicit-visibility`
- [ ] Add more security rules

### Security rules to be implemented
- [ ] `no-multiple-send-calls`
- [ ] `check-send-result`


**[Access the complete Solium documentation](http://solium.readthedocs.io/en/latest/index.html)**
