# forwarded-for

[![Version npm](http://img.shields.io/npm/v/forwarded-for.svg?style=flat-square)](http://browsenpm.org/package/forwarded-for)[![Build Status](http://img.shields.io/travis/primus/forwarded-for/master.svg?style=flat-square)](https://travis-ci.org/primus/forwarded-for)[![Dependencies](https://img.shields.io/david/primus/forwarded-for.svg?style=flat-square)](https://david-dm.org/primus/forwarded-for)[![Coverage Status](http://img.shields.io/coveralls/primus/forwarded-for/master.svg?style=flat-square)](https://coveralls.io/r/primus/forwarded-for?branch=master)[![IRC channel](http://img.shields.io/badge/IRC-irc.freenode.net%23primus-00a8ff.svg?style=flat-square)](http://webchat.freenode.net/?channels=primus)

When you are hosting your applications behind a reverse load balancer the
incoming requests will no longer have the IP address of your user but of the
load balancer as it forwards the request to your node instance. Most load
balancers allow you to modify the headers of the request and add original
request information in it.

This module makes it easier to find the correct IP address of your connection by
detecting these headers that load balancers set and it will gracefully fall down
to the original `req.address` that contained the IP address of the request
inside node.js. In addition to gracefully degrading to the original request we
also for other known locations of the address (which are usually set by
frameworks such as SockJS and Socket.IO etc.)

## Installation

The module is released in the npm registry:

```
npm install --save forwarded-for
```

## Getting started

Let's start out with including the module in to your application:

```js
'use strict';

var forwarded = require('forwarded-for');
```

The `forwarded` variable will now contain the function which parses out the
request information for you in to a really simple object. This object contains
the following properties:

- `port` The remote port. It defaults to `0`.
- `ip` The string representation of the remoteAddress. It defaults to '127.0.0.1'.

When we fail to parse or detect an IP address we will use the default values to
construct the object. To correctly parse the data the function requires the
following arguments:

- `obj` The socket like object that probably contains the remoteAddress
- `headers` A reference to the HTTP headers of the request
- `whitelist`, _optional_ A white list of IP addresses of your load balancers so
  people cannot make fake requests with `x-forwarded-for` headers.

So with all the information combined, it would look something like this:

```js
'use strict';

var forwarded = require('forwarded-for');

require('http').createServer(function (req, res) {
  var address = forwarded(req, req.headers);

  res.end('Your ip address is '+ address.ip);
}).listen(8080);
```

## License

MIT
