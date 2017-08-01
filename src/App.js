import React, { Component } from 'react'
import logo from './assets/logo.svg'
import './styles/App.css'

class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="Giveth Unicorn Logo" />
          <h2>Welcome to Giveth</h2>
        </div>
        <p className="App-intro">
          To get started, get some ETH and save the world.
        </p>
      </div>
    )
  }
}

export default App
