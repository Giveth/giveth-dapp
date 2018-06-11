# setHeader

[![Build Status](https://travis-ci.org/3rd-Eden/setHeader.png?branch=master)](https://travis-ci.org/3rd-Eden/setHeader)

This module is an alternate way of setting headers in your node applications.
Node doesn't have any protection or ways to prevent your previously set headers
from being overridden. So just because you set a `X-Powered-By` or
`X-Frame-Options` header it doesn't mean that this exact header will eventually
be written to the response. It could be that you have a middleware layer that
silently modified the header. This module attempts to prevent that from
happening by making the set property `readOnly`.

## Installation

```
npm install --save setheader
```

## Usage

The following snippet should make it clear:

```js
'use strict';

var setHeader = require('setheader');

//
// Create a basic http server just to illustrate the example usage here..
//
require('http').createServer(function (req, res) {
  setHeader(res, 'X-Frame-Options', 'DENY');

  res.end('(\/)(;,,;)(\/)');
}).listen(8080);
```

As you can see in the example above the `setHeader` method receives **3**
required arguments:

1. `res`, The HTTP Response instance of your HTTP server server.
2. `name`, The name of the header it needs to set.
3. `value`, The value of the header that is set.

## License

MIT
