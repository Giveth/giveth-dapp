import React from 'react'
import ReactDOM from 'react-dom'
import registerServiceWorker from './lib/registerServiceWorker'

import './styles/application.css'

// containers
import Application from './containers/Application'

ReactDOM.render(
  <Application/>
  ,document.getElementById('root')
)

registerServiceWorker()