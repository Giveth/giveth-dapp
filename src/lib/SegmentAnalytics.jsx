import config from '../configuration';

window.analytics = window.analytics || [];
const { analytics } = window;
if (!analytics.initialize) {
  if (analytics.invoked) console.error('Segment snippet included twice.');
  else {
    analytics.invoked = !0;
    analytics.methods = [
      'trackSubmit',
      'trackClick',
      'trackLink',
      'trackForm',
      'pageview',
      'identify',
      'reset',
      'group',
      'track',
      'ready',
      'alias',
      'debug',
      'page',
      'once',
      'off',
      'on',
      'addSourceMiddleware',
      'addIntegrationMiddleware',
      'setAnonymousId',
      'addDestinationMiddleware',
    ];
    analytics.factory = function(e) {
      return function() {
        // eslint-disable-next-line prefer-rest-params
        const t = Array.prototype.slice.call(arguments);
        t.unshift(e);
        analytics.push(t);
        return analytics;
      };
    };
    // eslint-disable-next-line no-plusplus
    for (let e = 0; e < analytics.methods.length; e++) {
      const key = analytics.methods[e];
      analytics[key] = analytics.factory(key);
    }
    analytics.load = function(key, e) {
      const t = document.createElement('script');
      t.type = 'text/javascript';
      t.async = !0;
      t.src = `https://cdn.segment.com/analytics.js/v1/${key}/analytics.min.js`;
      const n = document.getElementsByTagName('script')[0];
      n.parentNode.insertBefore(t, n);
      analytics._loadOptions = e;
    };
    analytics._writeKey = config.analyticsKey;
    analytics.SNIPPET_VERSION = '4.13.2';
  }

  window.analytics.load(config.analyticsKey);
  window.analytics.page();
}
