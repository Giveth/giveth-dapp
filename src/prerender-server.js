const prerender = require('prerender');

const server = prerender({
  pageLoadTimeout: 10000,
  logRequests: true,
});
server.start();
