const proxy = require('express-http-proxy');
const app = require('express')();
require('dotenv').config();

const NodeCache = require('node-cache');

const myCache = new NodeCache();
const TTL = 24 * 60 * 60; // 24 hours

function getKey(req) {
  return `giveth:${req.url}`;
}

app.use(
  require('prerender-node')
    .set('beforeRender', function(req, done) {
      const key = getKey(req);
      const cachedValue = myCache.get(key);
      if (!cachedValue) {
        return done();
      }
      return done(null, cachedValue);
    })
    .set('afterRender', function(err, req, prerenderResponse) {
      if (err || !prerenderResponse.body) {
        console.log('error', err);
        return;
      }
      const key = getKey(req);
      myCache.set(key, prerenderResponse.body, TTL);
    }),
);

app.use('/', proxy(`http://localhost:${process.env.PORT}`));

const port = 8080;
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
