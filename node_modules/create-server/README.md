# create-server

[![Version npm](https://img.shields.io/npm/v/create-server.svg?style=flat-square)](http://browsenpm.org/package/create-server)[![Build Status](https://img.shields.io/travis/primus/create-server/master.svg?style=flat-square)](https://travis-ci.org/primus/create-server)[![Dependencies](https://img.shields.io/david/primus/create-server.svg?style=flat-square)](https://david-dm.org/primus/create-server)[![Coverage Status](https://img.shields.io/coveralls/primus/create-server/master.svg?style=flat-square)](https://coveralls.io/r/primus/create-server?branch=master)[![IRC channel](https://img.shields.io/badge/IRC-irc.freenode.net%23primus-00a8ff.svg?style=flat-square)](https://webchat.freenode.net/?channels=primus)

I've found my self writing this particular piece of snippet over and over again.
If you need to have a common API for creating a HTTP, HTTPS or SPDY server this
might be the module that you've been waiting for.

## Installation

Add it to your Node.js project by running

```
npm install --save create-server
```

## Creating a server

In all code examples we assume that you've required the module and saved it as
the `create` variable:

```js
'use strict';

var create = require('create-server');
```

The `create` variable is now a function which can be used to create different
types of servers. The function accepts 2 different arguments:

1. A number which should be the port number or object with the configuration for
   the servers.
2. Optionally, an object with different callback methods.

The following properties can be configured:

- **port**: The port number we should listen on. Also used to determine which
  type of server we need to create.
- **hostname**: What interface we should listen on.
- **spdy**: Create SPDY server instead of a HTTPS server.
- **root**: The root folder that contains your HTTPS certs.
- **key, cert, ca, pfx, crl** Path or array of paths which will be read out the
  correct files. The path should be relative to the **root** option.
- **redirect**: Start up an optional HTTP server who will redirect users to the
  port you're listening on. The supplied value should be the port number we need
  to listen on.
- **listen**: Do need to start listening to the server for you?

The following properties can be provided as callback object:

- **close**: Server is closed.
- **request**: Received a new incoming request.
- **upgrade**: Received a HTTP upgrade request.
- **listening**: We're now listening. Receives an optional error as first
  argument.
- **error**: Received a new error on the server.
- **https**: A new HTTPS server has been created.
- **http**: A new HTTP server has been created.
- **spdy**: A new SPDY server has been created.

When creating a secure server, we will do our best to provide sane defaults that
will protect your server against known secure server attacks such as POODLE, we
also update the cipher list to prevent attacks such as heart bleed. This can be
overridden by supplying your own `cypher`, `secureProtocol` and `secureOptions`
keys as option.

## License

[MIT](LICENSE)
