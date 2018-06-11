# connected

This module is born out of an annoyance with the Node core. Every method that
receives a callback is called using an error first callback. But this is not the
case with servers. When you tell the server to start listening on the given port
it can will `emit` an `error` event when it failed.

## Installation

```
npm install connected --save
```

## Usage

```js
var connected = require('connected')
  , http = require('http');

var app = http.createServer(function (req, res) {
  res.end('wobble wobble');
});

connected(app, 80, function (err) {
  // Received an error because we are not allowed to listen on port 80
});
```

And thats it.

## License

MIT
