## feathers-hooks-common

[![Greenkeeper badge](https://badges.greenkeeper.io/feathersjs/feathers-hooks-common.svg)](https://greenkeeper.io/)

[![Build Status](https://travis-ci.org/feathersjs/feathers-hooks-common.svg?branch=master)](https://travis-ci.org/eddyystop/feathers-hooks-common)
[![Code Climate](https://codeclimate.com/github/feathersjs/feathers.png)](https://codeclimate.com/github/feathersjs/feathers-hooks-common)
[![Coverage Status](https://coveralls.io/repos/github/feathersjs/feathers-hooks-common/badge.svg?branch=master)](https://coveralls.io/github/feathersjs/feathers-hooks-common?branch=master)
[![Dependency Status](https://img.shields.io/david/feathersjs/feathers.svg?style=flat-square)](https://david-dm.org/feathersjs/feathers-hooks-common)
[![Download Status](https://img.shields.io/npm/dm/feathers.svg?style=flat-square)](https://www.npmjs.com/package/feathers-hooks-common)
[![Slack Status](http://slack.feathersjs.com/badge.svg)](http://slack.feathersjs.com)

> Useful hooks for use with Feathers services.

## Migration to v3 from v2

Some hooks had features which were not initially apparent,
e.g. `remove` did not remove when the call was made on the server.
These features have been removed when they were infrequently used,
or, when removal would result in a significant breaking change,
new hooks have been introduced which deprecate the original ones.

Such features can be re-implemented using conditional hooks,
with the additional benefit of making what is happening clearer.

Breaking changes:
- All hooks and utilities are obtained from `feathers-hooks-common`
rather than some from, say, `feathers-hooks-common/promisify`.
- Some functions supported a deprecated predicate as their last param.
This feature has been removed.
- The populate hook now ignores pagination on joined services by default.

Deprecated:
- The legacy populate hook -- with signature (string, ...) --
will be removed next version. Use the regular `populate` hook.
- Use `deleteByDot` rather than `setByDot(obj, path, value, true)`.
- The `disallow` hook should be used instead of `disable`.
- The `discard` hook should be used instead of `remove`.
You will need to wrap `discard` in an conditional if you want it to work like `remove` does.

## Documentation

Refer to [Feathersjs documentation](https://docs.feathersjs.com/api/hooks-common.html). 

## Installation

Run `npm install feathers-hooks-common --save` in your project folder (installs the latest v2 release).

## Tests

`npm test` to run tests.

## License

MIT. See LICENSE.
