import React from 'react';
import ReactDOM from 'react-dom';

import registerServiceWorker from './lib/registerServiceWorker';
import Application from './containers/Application';
import './styles/application.css';

/* global document */
ReactDOM.render(
  <Application /> // eslint-disable-line react/jsx-filename-extension
  , document.getElementById('root'),
);

registerServiceWorker();
