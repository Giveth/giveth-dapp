import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactGA from 'react-ga';
import { Route } from 'react-router-dom';
import config from '../configuration';

class GoogleAnalytics extends Component {
  componentDidMount() {
    this.logPageChange(this.props.location.pathname, this.props.location.search);
  }

  componentDidUpdate({ location: prevLocation }) {
    const {
      location: { pathname, search },
    } = this.props;
    const isDifferentPathname = pathname !== prevLocation.pathname;
    const isDifferentSearch = search !== prevLocation.search;

    if (isDifferentPathname || isDifferentSearch) {
      this.logPageChange(pathname, search);
    }
  }

  logPageChange(pathname, search = '') {
    const page = pathname + search;
    const { location } = window;
    ReactGA.set({
      page,
      location: `${location.origin}${page}`,
      ...this.props.options,
    });
    ReactGA.pageview(page);
  }

  render() {
    return null;
  }
}

GoogleAnalytics.propTypes = {
  location: PropTypes.shape({
    pathname: PropTypes.string,
    search: PropTypes.string,
  }).isRequired,
  options: PropTypes.shape({}),
};

GoogleAnalytics.defaultProps = {
  options: {},
};

const RouteTracker = () => <Route component={GoogleAnalytics} />;

const init = (options = {}) => {
  if (config.analytics.useGoogleAnalytics) {
    ReactGA.initialize(config.analytics.ga_UA, {
      debug: false,
      ...options,
    });
  }

  return config.analytics.useGoogleAnalytics;
};

// Conditionally track events
// Just a wrapper for https://github.com/react-ga/react-ga#reactgaeventargs
const trackEvent = args => {
  if (config.analytics.useGoogleAnalytics) {
    ReactGA.event(args);
  }
};

export default {
  GoogleAnalytics,
  RouteTracker,
  init,
  trackEvent,
};
