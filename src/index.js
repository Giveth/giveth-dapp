import React from 'react';
import localForage from 'localforage';
import { hydrate, render } from 'react-dom';
import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';
import { unregister } from './lib/registerServiceWorker';
import Application from './containers/Application';
import './styles/application.css';
import './lib/SegmentAnalytics';

if (process.env.REACT_APP_SENTRY_DSN && process.env.REACT_APP_SENTRY_RELEASE) {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    release: process.env.REACT_APP_SENTRY_RELEASE,
    integrations: [new Integrations.BrowserTracing()],
    // We recommend adjusting this value in production, or using tracesSampler
    // for finer control
    tracesSampleRate: 1.0,
  });
}

unregister();

const rootElement = document.getElementById('root');

try {
  localForage
    .config({
      driver: [localForage.INDEXEDDB, localForage.WEBSQL, localForage.LOCALSTORAGE],
      name: 'mydb',
      storeName: 'mystore',
      version: 3,
    })
    .then(() => localForage.getItem('x'));
} catch (e) {
  // console.log(e);
}

if (rootElement.hasChildNodes()) {
  hydrate(
    <Application />, // eslint-disable-line react/jsx-filename-extension
    document.getElementById('root'),
  );
} else {
  render(
    <Application />, // eslint-disable-line react/jsx-filename-extension
    document.getElementById('root'),
  );
}
