# Primus Emitter

[![Build Status](https://img.shields.io/travis/cayasso/primus-emitter/master.svg)](https://travis-ci.org/cayasso/primus-emitter)
[![NPM version](https://img.shields.io/npm/v/primus-emitter.svg)](https://www.npmjs.com/package/primus-emitter)
[![Coverage Status](https://img.shields.io/coveralls/cayasso/primus-emitter/master.svg)](https://coveralls.io/r/cayasso/primus-emitter)

Node.JS module that adds emitter capabilities to [Primus](https://github.com/primus/primus).

## Installation

```
$ npm install primus-emitter
```

## Usage

### On the Server

```javascript
var Primus = require('primus');
var Emitter = require('primus-emitter');
var server = require('http').createServer();

// primus instance
var primus = new Primus(server, { transformer: 'websockets', parser: 'JSON' });

// add emitter to Primus
primus.use('emitter', Emitter);

primus.on('connection', function (spark) {

  // emit hi event
  spark.send('hi', 'good morning');

  // emit to news with ack
  spark.send('news', 'good morning', function (data) {
    console.log(data); // => 'by client'
  });

  // receive incoming sport messages
  spark.on('sport', function (data) {
    console.log('sport', data); // => ping-pong
  });

});

server.listen(8080);
```

### On the Client

```javascript
var primus = Primus.connect('ws://localhost:8080');

primus.on('open', function () {

  // receive incoming hi msgs
  primus.on('hi', function (data) {
    console.log(data); // => good morning
  });

  // respond ack to server
  primus.on('news', function (data, fn) {
    fn('by client');
  });

  // send message to server
  primus.send('sport', 'ping-pong');

});

```

## API

### spark#send(event, ..., [fn])

Send an event to server to client or client to server.

```javascript
spark.send('news', 'hi', fn);
```

### spark#on(event, fn)

Listen to incoming events.

```javascript
spark.on('news', fn);
```

## Run tests

``` bash
$ make test
```

## Other plugins

 * [primus-rooms](https://github.com/cayasso/primus-rooms)
 * [primus-multiplex](https://github.com/cayasso/primus-multiplex)
 * [primus-resource](https://github.com/cayasso/primus-resource)

## License

(The MIT License)

Copyright (c) 2013 Jonathan Brumley &lt;cayasso@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
