import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { Link, NavLink } from 'react-router-dom'
import {withRouter} from "react-router-dom";

import AuthenticatedLink from './AuthenticatedLink'
import AuthenticatedNavLink from './AuthenticatedNavLink'

import Avatar from 'react-avatar'


/**
  The main top menu
**/

class MainMenu extends Component {
  constructor(props) {
    super();

    this.state = {
      walletLocked: props.wallet ? !props.wallet.unlocked : true,
      showMobileMenu: false
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.wallet && nextProps.wallet.unlocked && this.state.walletLocked) {
      this.setState({
        walletLocked: false
      });
    }
  }

  signout() {
    this.props.onSignOut();
    this.props.history.push('/')
  }

  lockWallet = e => {
    e.preventDefault();

    React.swal({
      title: "Lock your wallet?",
      text: "You will be redirected to the home page. Any changes you're making will be lost.",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, lock wallet!",
      closeOnConfirm: true,
    }, () => {
      this.props.wallet.lock();
      this.setState({ walletLocked: true });
      this.props.history.push('/');
    });
  }

  toggleMobileMenu(){
    this.setState({ showMobileMenu: !this.state.showMobileMenu })
  }

  componentDidMount(){
    this.props.history.listen((location, action) => {
      this.setState({ showMobileMenu: false })
    })
  }


  render() {
    const { userProfile, authenticated, wallet } = this.props
    const { showMobileMenu } = this.state

    return (
      <nav id="main-menu" className={`navbar navbar-expand-lg fixed-top ${showMobileMenu ? 'show' : ''} `}>
        <button className="navbar-toggler navbar-toggler-right" type="button" onClick={()=>this.toggleMobileMenu()}>
          <i className={`navbar-toggler-icon fa ${showMobileMenu ? 'fa-close' : 'fa-bars'}`}></i>
        </button>
        <Link className="navbar-brand" to="/">Giveth</Link>

        <div className={`collapse navbar-collapse ${showMobileMenu ? 'show' : ''} `} id="navbarSupportedContent">
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
                <div className={`dropdown-menu ${showMobileMenu ? 'show' : ''} `} aria-labelledby="navbarDropdownDashboard">
                  <Link className="dropdown-item" to="/donations">My donations</Link>
                  <Link className="dropdown-item" to="/delegations">My delegations</Link>
                  <Link className="dropdown-item" to="/my-causes">My DACs</Link>
                  <Link className="dropdown-item" to="/my-campaigns">My campaigns</Link>
                </div>
              </li>
            }

          </ul>

          <ul className="navbar-nav ml-auto mr-sm-2">
            { authenticated && this.props.wallet && this.state.walletLocked &&
            <li className="nav-item mr-sm-2">
              <AuthenticatedNavLink className="nav-link" to="#">
                <i className="fa fa-lock"></i>
                &nbsp;UnLock Wallet
              </AuthenticatedNavLink>
            </li>
            }
            { authenticated && this.props.wallet && !this.state.walletLocked &&
              <li className="nav-item mr-sm-2">
                <NavLink className="nav-link" to="#" onClick={this.lockWallet}>
                  <i className="fa fa-unlock"></i>
                  &nbsp;Lock Wallet
                </NavLink>
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
                <div className={`dropdown-menu dropdown-profile ${showMobileMenu ? 'show' : ''}`} aria-labelledby="navbarDropdownYou">
                  <AuthenticatedLink className="dropdown-item" to="/profile" wallet={wallet}>Profile</AuthenticatedLink>
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
  onSignOut: PropTypes.func.isRequired
};
