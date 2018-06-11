# feathers-client

[![Greenkeeper badge](https://badges.greenkeeper.io/feathersjs/feathers-client.svg)](https://greenkeeper.io/)

[![Build Status](https://travis-ci.org/feathersjs/feathers-client.png?branch=master)](https://travis-ci.org/feathersjs/feathers-client)
[![Code Climate](https://codeclimate.com/github/feathersjs/feathers-client.png)](https://codeclimate.com/github/feathersjs/feathers-client)
[![Test Coverage](https://codeclimate.com/github/feathersjs/feathers-client/badges/coverage.svg)](https://codeclimate.com/github/feathersjs/feathers-client/coverage)
[![Dependency Status](https://img.shields.io/david/feathersjs/feathers-client.svg?style=flat-square)](https://david-dm.org/feathersjs/feathers-client)
[![Download Status](https://img.shields.io/npm/dm/feathers-client.svg?style=flat-square)](https://www.npmjs.com/package/feathers-client)
[![Slack Status](http://slack.feathersjs.com/badge.svg)](http://slack.feathersjs.com)

[![Sauce Test Status](https://saucelabs.com/browser-matrix/feathersjs.svg)](https://saucelabs.com/u/feathersjs)

> A client for Feathers services supporting many different transport libraries.

## About

While Feathers and its modules can be used on the client with an NPM compatible module loader like [Browserify](http://browserify.org/), [Webpack](https://webpack.github.io/) or [StealJS](http://stealjs.com), `feathers-client` consolidates a standard set of client plugins into a single distributable that can be used standalone in the browser or with other module loaders (like [RequireJS](http://requirejs.org/)) that don't support NPM. The following modules are included:

- [feathers](https://github.com/feathersjs/feathers) as `feathers` (or the default module export)
- [feathers-hooks](https://github.com/feathersjs/feathers-hooks) as `feathers.hooks`
- [feathers-authentication](https://github.com/feathersjs/feathers-authentication) as `feathers.authentication`
- [feathers-rest](https://github.com/feathersjs/feathers-rest) as `feathers.rest`
- [feathers-socketio](https://github.com/feathersjs/feathers-socketio) as `feathers.socketio`
- [feathers-primus](https://github.com/feathersjs/feathers-primus) as `feathers.primus`

In the browser a client that connects to the local server via websockets can be initialized like this:

```html
<script type="text/javascript" src="/socket.io/socket.io.js"></script>
<script type="text/javascript" src="//cdn.rawgit.com/feathersjs/feathers-client/v1.1.0/dist/feathers.js"></script>
<script type="text/javascript">
  var socket = io();
  var client = feathers()
    .configure(feathers.hooks())
    .configure(feathers.socketio(socket));
  var todoService = client.service('todos');
  
  todoService.on('created', function(todo) {
    console.log('Someone created a todo', todo);
  });
  
  todoService.create({
    description: 'Todo from client'
  });
</script>
```

For the full documentation see [the Feathers documentation](http://docs.feathersjs.com/clients/feathers.html).

## License

Copyright (c) 2015 [Feathers contributors](https://github.com/feathersjs/feathers-client/graphs/contributors)

Licensed under the [MIT license](LICENSE).
