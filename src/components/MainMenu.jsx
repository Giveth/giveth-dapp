import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Avatar from 'react-avatar';
import { Link, NavLink, withRouter } from 'react-router-dom';

import AuthenticatedNavLink from './AuthenticatedNavLink';
import User from '../models/User';
import GivethWallet from '../lib/blockchain/GivethWallet';

/**
 * The main top menu
 *
 * @param currentUser  Currently logged in user information
 * @param history      Browser history object
 * @param wallet       Wallet object with the balance and all keystores
 */
class MainMenu extends Component {
  constructor(props) {
    super();

    this.state = {
      walletLocked: props.wallet ? !props.wallet.unlocked : true,
      showMobileMenu: false,
    };

    this.lockWallet = this.lockWallet.bind(this);
    this.signout = this.signout.bind(this);
  }

  componentDidMount() {
    // when route changes, close the menu
    this.props.history.listen(() => this.setState({ showMobileMenu: false }));
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.wallet && nextProps.wallet.unlocked && this.state.walletLocked) {
      this.setState({
        walletLocked: false,
      });
    }
  }

  signout() {
    this.props.onSignOut();
    this.props.history.push('/');
  }

  lockWallet(e) {
    e.preventDefault();

    React.swal({
      title: 'Lock your wallet?',
      text: 'You will be redirected to the home page. Any changes you have made will be lost.',
      icon: 'warning',
      dangerMode: true,
      buttons: ['Cancel', 'Yes, lock wallet!'],
    }).then(isConfirmed => {
      if (isConfirmed) {
        this.props.wallet.lock();
        this.setState({ walletLocked: true });
      }
    });
  }

  toggleMobileMenu() {
    this.setState({ showMobileMenu: !this.state.showMobileMenu });
  }

  render() {
    const { currentUser } = this.props;
    const { showMobileMenu } = this.state;

    return (
      <div>
        <nav
          id="main-menu"
          className={`navbar navbar-expand-lg fixed-top ${showMobileMenu ? 'show' : ''} `}
        >
          <button
            className="navbar-toggler navbar-toggler-right"
            type="button"
            onClick={() => this.toggleMobileMenu()}
          >
            <i className={`navbar-toggler-icon fa ${showMobileMenu ? 'fa-close' : 'fa-bars'}`} />
          </button>

          <ul className="navbar-nav mobile-wallet-lock">
            {this.props.currentUser &&
              this.props.wallet &&
              this.state.walletLocked && (
                <li className="nav-item mr-sm-2">
                  <AuthenticatedNavLink className="nav-link" to="#">
                    <i className="fa fa-lock" />
                    Wallet
                  </AuthenticatedNavLink>
                </li>
              )}
            {this.props.currentUser &&
              this.props.wallet &&
              !this.state.walletLocked && (
                <li className="nav-item mr-sm-2">
                  <NavLink className="nav-link" to="#" onClick={this.lockWallet}>
                    <i className="fa fa-unlock" />
                    Wallet
                  </NavLink>
                </li>
              )}
          </ul>

          <Link className="navbar-brand" to="/">
            <img src="/img/Giveth-typelogo.svg" width="70px" alt="Giveth logo" />
          </Link>

          <div
            className={`collapse navbar-collapse ${showMobileMenu ? 'show' : ''} `}
            id="navbarSupportedContent"
          >
            <ul className="navbar-nav mr-auto">
              <li className="nav-item">
                <NavLink className="nav-link" to="/dacs" activeClassName="active">
                  Communities
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/campaigns" activeClassName="active">
                  Campaigns
                </NavLink>
              </li>

              {this.props.currentUser && (
                <li className="nav-item dropdown">
                  <NavLink
                    className="nav-link dropdown-toggle"
                    id="navbarDropdownDashboard"
                    to="/dashboard"
                    activeClassName="active"
                    data-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    Manage
                  </NavLink>
                  <div
                    className={`dropdown-menu ${showMobileMenu ? 'show' : ''} `}
                    aria-labelledby="navbarDropdownDashboard"
                  >
                    <NavLink className="dropdown-item" to="/my-milestones">
                      My Milestones
                    </NavLink>
                    {/*
                      <AuthenticatedLink
                        className="dropdown-item"
                        to="/donations"
                        wallet={wallet}
                      >
                        My Donations
                      </AuthenticatedLink>
                      <AuthenticatedLink
                        className="dropdown-item"
                        to="/delegations"
                        wallet={wallet}
                      >
                        My Delegations
                      </AuthenticatedLink>
                    */}
                    <NavLink className="dropdown-item" to="/my-dacs">
                      My Communities
                    </NavLink>
                    <NavLink className="dropdown-item" to="/my-campaigns">
                      My Campaigns
                    </NavLink>
                  </div>
                </li>
              )}
            </ul>

            <ul className="navbar-nav ml-auto mr-sm-2">
              {this.props.currentUser &&
                this.props.wallet &&
                this.state.walletLocked && (
                  <li className="nav-item mr-sm-2">
                    <AuthenticatedNavLink className="nav-link" to="#">
                      <i className="fa fa-lock" />
                      &nbsp;UnLock Wallet
                    </AuthenticatedNavLink>
                  </li>
                )}
              {this.props.currentUser &&
                this.props.wallet &&
                !this.state.walletLocked && (
                  <li className="nav-item mr-sm-2">
                    <NavLink className="nav-link" to="#" onClick={this.lockWallet}>
                      <i className="fa fa-unlock" />
                      &nbsp;Lock Wallet
                    </NavLink>
                  </li>
                )}
            </ul>
            {/*
            <form id="search-form" className="form-inline my-2 my-lg-0">
              <input className="form-control mr-sm-2" type="text" placeholder="E.g. save the whales"/>
              <button className="btn btn-outline-success my-2 my-sm-0" type="submit">Find</button>
            </form>
          */}

            <ul className="navbar-nav">
              {!this.props.currentUser && (
                <NavLink className="nav-link" to="/signin" activeClassName="active">
                  Sign In
                </NavLink>
              )}
              {!this.props.currentUser && (
                <NavLink className="nav-link" to="/signup" activeClassName="active">
                  Sign Up
                </NavLink>
              )}

              {this.props.currentUser && (
                <li className="nav-item dropdown">
                  <Link
                    className="nav-link dropdown-toggle"
                    id="navbarDropdownYou"
                    to="/"
                    data-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    {currentUser &&
                      currentUser.avatar && (
                        <Avatar className="menu-avatar" size={30} src={currentUser.avatar} round />
                      )}

                    {currentUser && currentUser.name && <span>{currentUser.name}</span>}

                    {currentUser && !currentUser.name && <span>Hi, you!</span>}
                  </Link>
                  <div
                    className={`dropdown-menu dropdown-profile ${showMobileMenu ? 'show' : ''}`}
                    aria-labelledby="navbarDropdownYou"
                  >
                    <NavLink className="dropdown-item" to="/profile">
                      Profile
                    </NavLink>
                    <NavLink className="dropdown-item" to="/wallet">
                      Wallet
                    </NavLink>
                    <button className="dropdown-item" onClick={this.signout}>
                      Sign out
                    </button>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </nav>

        <div
          className="alert alert-warning alert-dismissible fade show"
          role="alert"
          style={{
            marginTop: '60px',
            marginBottom: '0',
            borderRadius: '0',
          }}
        >
          <button type="button" className="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
          <center>
            Please note that this is a very early stage of the Giveth DApp available only to a
            curated group of testers.<br />
            <strong>Do not send in any Ether!</strong> If you have sent Ether please contact us on
            &nbsp;
            <a href="http://join.giveth.io">Slack or Riot</a>.
          </center>
        </div>
      </div>
    );
  }
}

export default withRouter(MainMenu);

MainMenu.propTypes = {
  currentUser: PropTypes.instanceOf(User),
  wallet: PropTypes.instanceOf(GivethWallet),
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
    listen: PropTypes.func.isRequired,
  }).isRequired,
  onSignOut: PropTypes.func.isRequired,
};

MainMenu.defaultProps = {
  currentUser: undefined,
  wallet: undefined,
};
