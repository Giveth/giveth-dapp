import React from 'react'
import ReactDOM from 'react-dom'
import registerServiceWorker from './lib/registerServiceWorker'
import { feathersClient } from './lib/feathersClient'

import './styles/application.css'

// containers
import Application from './containers/Application'


/**
  The App waits for Web3 to be injected, see https://github.com/coopermaruyama/react-web3
**/

ReactDOM.render(
  <Application/>
  ,document.getElementById('root')
)

registerServiceWorker()

const causes = feathersClient.service('/causes')
causes.on('created', cause => console.log('created', cause));

// feathersClient.emit('causes::find', {}, (error, data) => {
//   console.log('Found all causes', error, data);
// });  

// feathersClient.emit('milestones::find', {}, (error, data) => {
//   console.log('Found all milestones', error, data);
// });  


// causes.create({
//   name: "Save the whales",
//   funded: false,
//   hasTrees: "nope",
//   noChecks: "yes"
// })