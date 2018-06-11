# Feathers Hooks

[![Greenkeeper badge](https://badges.greenkeeper.io/feathersjs/feathers-hooks.svg)](https://greenkeeper.io/)

[![Build Status](https://travis-ci.org/feathersjs/feathers-hooks.png?branch=master)](https://travis-ci.org/feathersjs/feathers-hooks)
[![Code Climate](https://codeclimate.com/github/feathersjs/feathers-hooks/badges/gpa.svg)](https://codeclimate.com/github/feathersjs/feathers-hooks)
[![Test Coverage](https://codeclimate.com/github/feathersjs/feathers-hooks/badges/coverage.svg)](https://codeclimate.com/github/feathersjs/feathers-hooks/coverage)
[![Dependency Status](https://img.shields.io/david/feathersjs/feathers-hooks.svg?style=flat-square)](https://david-dm.org/feathersjs/feathers-hooks)
[![Download Status](https://img.shields.io/npm/dm/feathers-hooks.svg?style=flat-square)](https://www.npmjs.com/package/feathers-hooks)
[![Slack Status](http://slack.feathersjs.com/badge.svg)](http://slack.feathersjs.com)

> Middleware for Feathers service methods

## Documentation

Please refer to the [Feathers hooks documentation](http://docs.feathersjs.com/hooks/readme.html) for more details on:

- The philosophy behind hooks
- How you can use hooks
- How you can chain hooks using Promises
- Params that are available in hooks
- Hooks that are bundled with feathers and feathers plugins

## Quick start

`feathers-hooks` allows to register composable middleware functions when a Feathers service method executes. This makes it easy to decouple things like authorization and pre- or post processing and error handling from your service logic.

To install from [npm](https://www.npmjs.com/package/feathers-hooks), run:

```bash
$ npm install feathers-hooks --save
```

Then, to use the plugin in your Feathers app:

```javascript
const feathers = require('feathers');
const hooks = require('feathers-hooks');

const app = feathers().configure(hooks());
```

Then, you can register a hook for a service:

```javascript
// User service
const service = require('feathers-memory');

module.exports = function(){
  const app = this;

  let myHook = function(options) {
    return 
  }

  // Initialize our service
  app.use('/users', service());

  // Get our initialize service to that we can bind hooks
  const userService = app.service('/users');

  // Set up our before hook
  userService.hooks({
    before(hook){
      console.log('My custom before hook ran!');
    }
  });
}
```

## License

Copyright (c) 2016 [Feathers contributors](https://github.com/feathersjs/feathers-hooks/graphs/contributors)

Licensed under the [MIT license](LICENSE).
