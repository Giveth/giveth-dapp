'use strict';

var listen = require('connected')
  , parse = require('url').parse
  , path = require('path')
  , fs = require('fs');

/**
 * Get an accurate type check for the given Object.
 *
 * @param {Mixed} obj The object that needs to be detected.
 * @returns {String} The object type.
 * @api public
 */
function is(obj) {
  return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
}

/**
 * Create a HTTP server.
 *
 * @param {Mixed} server Different ways of constructing a server.
 * @param {Object} fn Callback or callbacks.
 * @returns {Server} The created server.
 */
function create(server, fn) {
  var type = is(server)
    , options;

  if ('object' === type) options = server;
  else if ('number' === type) options = { port: server };
  else options = {};

  fn = create.fns(fn || options);

  var certs = options.key && options.cert       // Check HTTPS certs.
    , hostname = options.hostname               // Bind address.
    , port = options.port || 443                // Force HTTPS by default.
    , secure = certs || 443 === port            // Check for true HTTPS.
    , spdy = 'spdy' in options;                 // Or are we spdy.

  //
  // Determine which type of server we need to create.
  //
  if (spdy) type = 'spdy';
  else if (secure) type = 'https';
  else type = 'http';

  //
  // We need to have SSL certs for SPDY and secure servers.
  //
  if ((secure || spdy) && !certs) {
    throw new Error('Missing the SSL key or certificate files in the options.');
  }

  //
  // When given a `options.root` assume that our SSL certs and keys are path
  // references that still needs to be read. This allows a much more human
  // readable interface for SSL.
  //
  if (secure && options.root) {
    ['cert', 'key', 'ca', 'pfx', 'crl'].filter(function filter(key) {
      return key in options;
    }).forEach(function parse(key) {
      var data = options[key];

      if (Array.isArray(data)) {
        options[key] = data.map(function read(file) {
          return fs.readFileSync(path.join(options.root, file));
        });
      } else {
        options[key] = fs.readFileSync(path.join(options.root, data));
      }
    });
  }

  //
  // Provide additional protection for HTTPS server by supplying a safer cypher
  // set and prevent POODLE attacks on the servers.
  //
  if (secure) {
    //
    // Protection against POODLE attacks.
    //
    options.secureProtocol = options.secureProtocol || 'SSLv23_method';
    options.secureOptions = options.secureOptions || require('constants').SSL_OP_NO_SSLv3;

    //
    // Optimized cipher list.
    //
    options.ciphers = options.ciphers || [
      'ECDHE-RSA-AES256-SHA384',
      'DHE-RSA-AES256-SHA384',
      'ECDHE-RSA-AES256-SHA256',
      'DHE-RSA-AES256-SHA256',
      'ECDHE-RSA-AES128-SHA256',
      'DHE-RSA-AES128-SHA256',
      'HIGH',
      '!aNULL',
      '!eNULL',
      '!EXPORT',
      '!DES',
      '!RC4',
      '!MD5',
      '!PSK',
      '!SRP',
      '!CAMELLIA'
    ].join(':');
  }

  //
  // Create the correct server instance and pass in the options object for those
  // who require it (spoiler: all non http servers).
  //
  server = require(type).createServer('http' !== type && options);

  //
  // Setup an addition redirect server which redirects people to the correct
  // HTTP or HTTPS server.
  //
  if (+options.redirect) {
    var redirect = require('http').createServer(function handle(req, res) {
      res.statusCode = 404;

      if (req.headers.host) {
        var url = parse('http://'+ req.headers.host);

        res.statusCode = 301;
        res.setHeader(
          'Location',
          'http'+ (secure ? 's' : '') +'://'+ url.hostname +':'+ port + req.url
        );
      }

      if (secure) res.setHeader(
        'Strict-Transport-Security',
        'max-age=8640000; includeSubDomains'
      );

      res.end('');
    }).listen(+options.redirect, hostname);

    //
    // Close the redirect server when the main server is closed.
    //
    server.once('close', function close() {
      try { redirect.close(); }
      catch (e) {}
    });
  }

  //
  // Assign the last callbacks.
  //
  if (fn.close) server.once('close', fn.close);
  ['request', 'upgrade', 'error'].forEach(function each(event) {
    if (fn[event]) server.on(event, fn[event]);
  });

  //
  // Things are completed, call callback.
  //
  if (fn[type]) fn[type]();

  if (options.listen !== false) {
    listen(server, port, hostname, fn.listening);
  } else if (fn.listening) {
    server.once('listening', fn.listening);
  }

  return server;
}

/**
 * Create callbacks.
 *
 * @param {Object} fn Callback hooks.
 * @returns {Object} The callbacks
 * @api private
 */
create.fns = function fns(fn) {
  var callbacks = {};

  if ('function' === typeof fn) {
    callbacks.listening = fn;
    return callbacks;
  }

  [
    'close', 'request', 'listening', 'upgrade', 'error',
    'http', 'https', 'spdy'
  ].forEach(function each(name) {
    if ('function' !== typeof fn[name]) return;

    callbacks[name] = fn[name];
  });

  return callbacks;
};

//
// Expose the create server method.
//
module.exports = create;
