import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import '../styles/mainMenu.css'

/**
  The main top menu
**/

class MainMenu extends Component {
  render() {
    return (
      <nav id="main-menu" className="navbar navbar-toggleable-md fixed-top">
        <button className="navbar-toggler navbar-toggler-right" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <Link className="navbar-brand" to="/">Giveth</Link>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav mr-auto">
            <li className="nav-item active">
              <Link className="nav-link" to="/">DACs</Link>
            </li>
            <li className="nav-item active">
              <Link className="nav-link" to="/campaigns">Campaigns</Link>
            </li>            
            <li className="nav-item">
              <Link className="nav-link" to="/profile">Dashboard</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/profile">Profile</Link>
            </li>            
          </ul>

          <form className="form-inline my-2 my-lg-0">
            <input className="form-control mr-sm-2" type="text" placeholder="E.g. save the whales"/>
            <button className="btn btn-outline-success my-2 my-sm-0" type="submit">Find</button>
          </form>
        </div>
      </nav>      
    )
  }
}

export default MainMenu