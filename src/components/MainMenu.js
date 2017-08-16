import React, { Component } from 'react'
import { Link, NavLink } from 'react-router-dom'

/**
  The main top menu
**/

class MainMenu extends Component {
  render() {
    return (
      <nav id="main-menu" className="navbar navbar-expand-lg fixed-top">
        <button className="navbar-toggler navbar-toggler-right" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <Link className="navbar-brand" to="/">Giveth</Link>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav mr-auto">
            <li className="nav-item">
              <NavLink className="nav-link" to="/dacs" activeClassName="active">DACs</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/campaigns" activeClassName="active">Campaigns</NavLink>
            </li>            
            <li className="nav-item">
              <NavLink className="nav-link" to="/profile" activeClassName="active">Dashboard</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/profile" activeClassName="active">Profile</NavLink>
            </li>            
            <li className="nav-item">
              <Link className="nav-link" to="/wallet">Wallet Demo</Link>
            </li>
          </ul>

          <div className="navbar-right">
            <Link className="btn btn-outline-secondary" to="/signin">Sign In</Link>
          </div>
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