import React from 'react';
import localForage from 'localforage';
import { hydrate, render } from 'react-dom';
import { unregister } from './lib/registerServiceWorker';
import Application from './containers/Application';
import './styles/application.css';
import './lib/SegmentAnalytics';

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
