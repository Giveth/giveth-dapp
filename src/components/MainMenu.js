import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { Link, NavLink } from 'react-router-dom'
import {withRouter} from "react-router-dom";

import Avatar from 'react-avatar'

/**
  The main top menu
**/

class MainMenu extends Component {
  constructor(props) {
    super();

    this.state = {
      walletLocked: props.wallet ? !props.wallet.unlocked : true,
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.wallet && nextProps.wallet.unlocked && this.state.walletLocked) {
      this.setState({
        walletLocked: false
      });
    }
  }

  componentWillUpdate(){
    console.log('props', this.props)
  }

  signout() {
    this.props.onSignOut();
    this.props.history.push('/')
  }

  lockWallet = e => {
    e.preventDefault();
    this.props.wallet.lock();
    this.setState({
      walletLocked: true
    });
  };

  unlockWallet = e => {
    e.preventDefault();
    this.props.unlockWallet();
  };

  render() {
    const { userProfile, authenticated } = this.props;

    return (
      <nav id="main-menu" className="navbar navbar-expand-lg fixed-top">
        <button className="navbar-toggler navbar-toggler-right" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon">&#9776;</span>
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

            {authenticated &&
              <li className="nav-item dropdown">
                <NavLink className="nav-link dropdown-toggle" id="navbarDropdownDashboard" to="/dashboard" activeClassName="active" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Dashboard</NavLink>
                <div className="dropdown-menu" aria-labelledby="navbarDropdownDashboard">
                  <a className="dropdown-item" href="#">My donations</a>
                  <a className="dropdown-item" href="#">Delegations</a>
                  <a className="dropdown-item" href="#">DACs</a>
                  <a className="dropdown-item" href="#">Campaigns</a>
                </div>
              </li>
            }

          </ul>

          <ul className="navbar-nav ml-auto mr-sm-2">
            { authenticated && this.props.wallet && this.state.walletLocked &&
            <li className="nav-item mr-sm-2">
              <Link className="btn btn-outline-secondary" to="#" onClick={this.unlockWallet}>UnLock Wallet</Link>
            </li>
            }
            { authenticated && this.props.wallet && !this.state.walletLocked &&
              <li className="nav-item mr-sm-2">
                <Link className="btn btn-outline-secondary" to="#" onClick={this.lockWallet}>Lock Wallet</Link>
              </li>
            }
          </ul>
          {/*
          <form id="search-form" className="form-inline my-2 my-lg-0">
            <input className="form-control mr-sm-2" type="text" placeholder="E.g. save the whales"/>
            <button className="btn btn-outline-success my-2 my-sm-0" type="submit">Find</button>
          </form>
        */}

          <ul className="navbar-nav">
            { !authenticated &&
              <NavLink className="nav-link" to="/signin" activeClassName="active">Sign In</NavLink>
            }
            { !authenticated &&
              <NavLink className="nav-link" to="/signup" activeClassName="active">Sign Up</NavLink>              
            }

            { authenticated &&
              <li className="nav-item dropdown">
                <Link className="nav-link dropdown-toggle" id="navbarDropdownYou" to="/" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                  { userProfile && userProfile.avatar &&
                    <Avatar className="menu-avatar" size={30} src={userProfile.avatar} round={true}/>                  
                  }

                  { userProfile && userProfile.name && 
                    <span>{userProfile.name}</span>
                  }

                  { userProfile && !userProfile.name &&
                    <span>Hi, you!</span>
                  }
                </Link>
                <div className="dropdown-menu dropdown-profile" aria-labelledby="navbarDropdownYou">
                  <Link className="dropdown-item" to="/profile">Profile</Link>
                  <Link className="dropdown-item" to="/wallet">Wallet</Link>
                  <a className="dropdown-item" onClick={()=>this.signout()}>Sign out</a>
                </div>
              </li>
            }
          </ul>

        </div>
      </nav>
    )
  }
}

export default withRouter(MainMenu)

MainMenu.propTypes = {
  authenticated: PropTypes.string,
  userProfile: PropTypes.shape({
    avatar: PropTypes.string,
    name: PropTypes.string,
  }),
  wallet: PropTypes.shape({
    unlocked: PropTypes.bool.isRequired,
    lock: PropTypes.func.isRequired,
  }),
  onSignOut: PropTypes.func.isRequired,
  unlockWallet: PropTypes.func.isRequired,
};
