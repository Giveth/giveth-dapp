import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { Link, NavLink } from 'react-router-dom'
import {withRouter} from "react-router-dom";

import AuthenticatedLink from './AuthenticatedLink'
import AuthenticatedNavLink from './AuthenticatedNavLink'

import Avatar from 'react-avatar'

import currentUserModel from '../models/currentUserModel'


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

  lockWallet(e) {
    e.preventDefault();

    React.swal({
      title: "Lock your wallet?",
      text: "You will be redirected to the home page. Any changes you're making will be lost.",
      icon: "warning",
      dangerMode: true,     
      buttons: ["Cancel", "Yes, lock wallet!"]
    }).then( (isConfirmed) => {
      if(isConfirmed) {
        this.props.wallet.lock();
        this.setState({ walletLocked: true });
        this.props.history.push('/');
      }
    });
  }

  toggleMobileMenu(){
    this.setState({ showMobileMenu: !this.state.showMobileMenu })
  }

  componentDidMount(){
    // when route changes, close the menu
    this.props.history.listen((location, action) => {
      this.setState({ showMobileMenu: false })
    })
  }

  render() {
    const { currentUser, wallet } = this.props
    const { showMobileMenu } = this.state

    return (
      <nav id="main-menu" className={`navbar navbar-expand-lg fixed-top ${showMobileMenu ? 'show' : ''} `}>
        <button className="navbar-toggler navbar-toggler-right" type="button" onClick={()=>this.toggleMobileMenu()}>
          <i className={`navbar-toggler-icon fa ${showMobileMenu ? 'fa-close' : 'fa-bars'}`}></i>
        </button>

        <ul className="navbar-nav mobile-wallet-lock">
          { this.props.currentUser && this.props.wallet && this.state.walletLocked &&
            <li className="nav-item mr-sm-2">
              <AuthenticatedNavLink className="nav-link" to="#">
                <i className="fa fa-lock"></i>
                Wallet
              </AuthenticatedNavLink>
            </li>
          }
          { this.props.currentUser && this.props.wallet && !this.state.walletLocked &&
            <li className="nav-item mr-sm-2">
              <NavLink className="nav-link" to="#" onClick={this.lockWallet}>
                <i className="fa fa-unlock"></i>
                Wallet
              </NavLink>
            </li>
          }
        </ul>  

        <Link className="navbar-brand" to="/">
          <img src="/img/Giveth-typelogo.svg" width="70px" alt="Giveth logo" />
        </Link>



        <div className={`collapse navbar-collapse ${showMobileMenu ? 'show' : ''} `} id="navbarSupportedContent">
          <ul className="navbar-nav mr-auto">
            <li className="nav-item">
              <NavLink className="nav-link" to="/dacs" activeClassName="active">Communities</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/campaigns" activeClassName="active">Campaigns</NavLink>
            </li>

            {this.props.currentUser &&
              <li className="nav-item dropdown">
                <NavLink className="nav-link dropdown-toggle" id="navbarDropdownDashboard" to="/dashboard" activeClassName="active" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Dashboard</NavLink>
                <div className={`dropdown-menu ${showMobileMenu ? 'show' : ''} `} aria-labelledby="navbarDropdownDashboard">
                  <Link className="dropdown-item" to="/donations">Donations</Link>
                  <Link className="dropdown-item" to="/delegations">Delegations</Link>
                  <Link className="dropdown-item" to="/my-dacs">Communities</Link>
                  <Link className="dropdown-item" to="/my-campaigns">Campaigns</Link>
                  <Link className="dropdown-item" to="/my-milestones">Milestones</Link>
                </div>
              </li>
            }

          </ul>

          <ul className="navbar-nav ml-auto mr-sm-2">
            { this.props.currentUser && this.props.wallet && this.state.walletLocked &&
            <li className="nav-item mr-sm-2">
              <AuthenticatedNavLink className="nav-link" to="#">
                <i className="fa fa-lock"></i>
                &nbsp;UnLock Wallet
              </AuthenticatedNavLink>
            </li>
            }
            { this.props.currentUser && this.props.wallet && !this.state.walletLocked &&
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
            { !this.props.currentUser &&
              <NavLink className="nav-link" to="/signin" activeClassName="active">Sign In</NavLink>
            }
            { !this.props.currentUser &&
              <NavLink className="nav-link" to="/signup" activeClassName="active">Sign Up</NavLink>              
            }

            { this.props.currentUser &&
              <li className="nav-item dropdown">
                <Link className="nav-link dropdown-toggle" id="navbarDropdownYou" to="/" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                  { currentUser && currentUser.avatar &&
                    <Avatar className="menu-avatar" size={30} src={currentUser.avatar} round={true}/>                  
                  }

                  { currentUser && currentUser.name && 
                    <span>{currentUser.name}</span>
                  }

                  { currentUser && !currentUser.name &&
                    <span>Hi, you!</span>
                  }
                </Link>
                <div className={`dropdown-menu dropdown-profile ${showMobileMenu ? 'show' : ''}`} aria-labelledby="navbarDropdownYou">
                  <AuthenticatedLink className="dropdown-item" to="/profile" wallet={wallet}>Profile</AuthenticatedLink>
                  <AuthenticatedLink className="dropdown-item" to="/wallet" wallet={wallet}>Wallet</AuthenticatedLink>
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
  currentUser: currentUserModel,
  wallet: PropTypes.shape({
    unlocked: PropTypes.bool.isRequired,
    lock: PropTypes.func.isRequired,
  }),
  onSignOut: PropTypes.func.isRequired
};
