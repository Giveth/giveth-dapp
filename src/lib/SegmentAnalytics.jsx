import { v4 } from 'uuid';
import config from '../configuration';
import { feathersClient } from './feathersClient';

const anonymousId = v4();
window.analytics = window.analytics || [];
const { analytics } = window;
const isBrave = () => {
  /**
   * Maybe in newer updates of Brave this doesn't work, but at this time it's ok
   * @see {@link https://stackoverflow.com/a/63330925/4650625}
   */
  if (window.navigator.brave !== undefined) {
    if (window.navigator.brave.isBrave.name === 'isBrave') {
      return true;
    }
    return false;
  }
  return false;
};
export const sendAnalyticsTracking = (event, properties) => {
  console.log('sendAnalyticsTracking called', { event, properties });
  try {
    if (!isBrave()) {
      window.analytics.track(event, properties);
    } else if (event && properties) {
      feathersClient.service('analytics').create({
        reportType: 'track',
        event,
        userId: properties.userAddress,
        anonymousId,
        properties,
      });
    }
  } catch (e) {
    console.log('sendAnalyticsTracking error', e);
  }
};
export const sendAnalyticsPage = page => {
  try {
    if (!isBrave()) {
      window.analytics.page();
    } else if (page) {
      feathersClient.service('analytics').create({
        reportType: 'page',
        page,
        anonymousId,
        properties: {
          url: window.location.href,
          path: window.location.pathname,
          referrer: document.referrer,
          title: document.title,
        },
      });
    }
  } catch (e) {
    console.log('sendAnalyticsPage() error ', e);
  }
};
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
}
