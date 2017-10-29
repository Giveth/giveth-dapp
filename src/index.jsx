/* global document */
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import registerServiceWorker from './lib/registerServiceWorker';

import './styles/application.css';

// containers
import Application from './containers/Application';

ReactDOM.render(
  <Router><Application /></Router>,
  document.getElementById('root'),
);

registerServiceWorker();
