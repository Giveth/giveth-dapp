'use strict';

var net = require('net');

/**
 * Forwarded instance.
 *
 * @constructor
 * @param {String} ip The IP address.
 * @param {Number} port The port number.
 * @param {Boolean} secured The connection was secured.
 * @api private
 */
function Forwarded(ip, port, secured) {
  this.ip = ip || '127.0.0.1';
  this.secure = !!secured;
  this.port = +port || 0;
}

/**
 * List of possible proxy headers that should be checked for the original client
 * IP address and forwarded port.
 *
 * @type {Array}
 * @private
 */
var proxies = [
  {
    ip: 'fastly-client-ip',
    port: 'fastly-client-port', // Estimated guess, no standard header available.
    proto: 'fastly-ssl'
  },
  {
    ip: 'x-forwarded-for',
    port: 'x-forwarded-port',
    proto: 'x-forwarded-proto'
  }, {
    ip: 'z-forwarded-for',
    port: 'z-forwarded-port',   // Estimated guess, no standard header available.
    proto: 'z-forwarded-proto'  // Estimated guess, no standard header available.
  }, {
    ip: 'forwarded',
    port: 'forwarded-port',
    proto: 'forwarded-proto'    // Estimated guess, no standard header available.
  }, {
    ip: 'x-real-ip',
    port: 'x-real-port',        // Estimated guess, no standard header available.
    proto: 'x-real-proto'       // Estimated guess, no standard header available.
  }
];

/**
 * Regex to split a string into an array of its words.
 *
 * @type {RegExp}
 */
var pattern = /[^\s,]+/g;

/**
 * Search the headers for a possible match against a known proxy header.
 *
 * @param {Object} headers The received HTTP headers.
 * @param {Array} whitelist White list of proxies that should be checked.
 * @returns {String|Undefined} A IP address or nothing.
 * @api private
 */
function forwarded(headers, whitelist) {
  var ports, port, proto, ips, ip, length = proxies.length, i = 0;

  for (; i < length; i++) {
    if (!(proxies[i].ip in headers)) continue;

    ports = (headers[proxies[i].port] || '').split(',');
    ips = (headers[proxies[i].ip] || '').match(pattern);
    proto = (headers[proxies[i].proto] || 'http');

    //
    // As these headers can potentially be set by a 1337H4X0R we need to ensure
    // that all supplied values are valid IP addresses. If we receive a none
    // IP value inside the IP header field we are going to assume that this
    // header has been compromised and should be ignored
    //
    if (!ips || !ips.every(net.isIP)) return;

    port = ports.shift();   // Extract the first port as it's the "source" port.
    ip = ips.shift();       // Extract the first IP as it's the "source" IP.

    //
    // If we were given a white list, we need to ensure that the proxies that
    // we're given are known and allowed.
    //
    if (whitelist && whitelist.length && !ips.every(function every(ip) {
      return ~whitelist.indexOf(ip);
    })) return;

    //
    // Shift the most recently found proxy header to the front of the proxies
    // array. This optimizes future calls, placing the most commonly found headers
    // near the front of the array.
    //
    if (i !== 0) {
      proxies.unshift(proxies.splice(i, 1)[0]);
    }

    //
    // We've gotten a match on a HTTP header, we need to parse it further as it
    // could consist of multiple hops. The pattern for multiple hops is:
    //
    //   client, proxy, proxy, proxy, etc.
    //
    // So extracting the first IP should be sufficient. There are SSL
    // terminators like the once's that is used by `fastly.com` which set their
    // HTTPS header to `1` as an indication that the connection was secure.
    // (This reduces bandwidth)
    //
    return new Forwarded(ip, port, proto === '1' || proto === 'https');
  }
}

/**
 * Parse out the address information..
 *
 * @param {Object} obj A socket like object that could contain a `remoteAddress`.
 * @param {Object} headers The received HTTP headers.
 * @param {Array} whitelist White list
 * @returns {String} The IP address.
 * @api private
 */
function parse(obj, headers, whitelist) {
  var proxied = forwarded(headers || {}, whitelist)
    , connection = obj.connection
    , socket = connection
      ? connection.socket
      : obj.socket;

  //
  // We should always be testing for HTTP headers as remoteAddress would point
  // to proxies.
  //
  if (proxied) return proxied;

  // Check for the property on our given object.
  if ('object' === typeof obj) {
    if ('remoteAddress' in obj) {
      return new Forwarded(
        obj.remoteAddress,
        obj.remotePort,
        'secure' in obj ? obj.secure : obj.encrypted
      );
    }

    // Edge case for Socket.IO 0.9
    if ('object' === typeof obj.address && obj.address.address) {
      return new Forwarded(
        obj.address.address,
        obj.address.port,
        'secure' in obj ? obj.secure : obj.encrypted
      );
    }
  }

  if ('object' === typeof connection && 'remoteAddress' in connection) {
    return new Forwarded(
      connection.remoteAddress,
      connection.remotePort,
      'secure' in connection ? connection.secure : connection.encrypted
    );
  }

  if ('object' === typeof socket && 'remoteAddress' in socket) {
    return new Forwarded(
      socket.remoteAddress,
      socket.remoteAddress,
      'secure' in socket ? socket.secure : socket.encrypted
    );
  }

  return new Forwarded();
}

//
// Expose the module and all of it's interfaces.
//
parse.Forwarded = Forwarded;
parse.forwarded = forwarded;
parse.proxies = proxies;
module.exports = parse;
