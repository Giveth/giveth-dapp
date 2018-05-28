import React from 'react';
import ReactDOM from 'react-dom';
import localForage from 'localforage';

import registerServiceWorker from './lib/registerServiceWorker';
import Application from './containers/Application';
import './styles/application.css';

try {
  localForage
    .config({
      driver: [localForage.INDEXEDDB, localForage.WEBSQL, localForage.LOCALSTORAGE],
      name: 'mydb',
      storeName: 'mystore',
      version: 3,
    })
    .then(() => localForage.getItem('x'))
    .then(x => console.log(x, localForage.driver()));

  /* global document */
  ReactDOM.render(
    <Application />, // eslint-disable-line react/jsx-filename-extension
    document.getElementById('root'),
  );

  registerServiceWorker();
} catch (e) {
  console.log(e);
}
