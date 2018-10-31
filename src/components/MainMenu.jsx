import React, { Component } from 'react';
import Avatar from 'react-avatar';
import { Link, NavLink, withRouter } from 'react-router-dom';

import AuthenticatedNavLink from './AuthenticatedNavLink';
import { Consumer as UserConsumer } from '../contextProviders/UserProvider';
import { history } from '../lib/helpers';

// Broken rule that can not find the correct id tag
/* eslint jsx-a11y/aria-proptypes: 0 */
/**
 * The main top menu
 */
class MainMenu extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showMobileMenu: false,
    };
  }

  componentDidMount() {
    // when route changes, close the menu
    history.listen(() => this.setState({ showMobileMenu: false }));
  }

  toggleMobileMenu() {
    this.setState(prevState => ({ showMobileMenu: !prevState.showMobileMenu }));
  }

  render() {
    const { showMobileMenu } = this.state;

    return (
      <UserConsumer>
        {({ state, actions }) => (
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
                <i
                  className={`navbar-toggler-icon fa ${showMobileMenu ? 'fa-close' : 'fa-bars'}`}
                />
              </button>

              <ul className="navbar-nav mobile-wallet-lock">
                {state.currentUser &&
                  state.wallet &&
                  state.walletLocked && (
                    <li className="nav-item mr-sm-2">
                      <AuthenticatedNavLink className="nav-link" to="#">
                        <i className="fa fa-lock" />
                        Wallet
                      </AuthenticatedNavLink>
                    </li>
                  )}
                {state.currentUser &&
                  state.wallet &&
                  !state.walletLocked && (
                    <li className="nav-item mr-sm-2">
                      <span
                        className="nav-link"
                        onClick={actions.lockWallet}
                        onKeyDown={actions.lockWallet}
                        role="button"
                        tabIndex={0}
                      >
                        <i className="fa fa-unlock" />
                        Wallet
                      </span>
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
                    <NavLink className="nav-link" to="/" activeClassName="active">
                      Explore
                    </NavLink>
                  </li>

                  {state.currentUser && (
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
                        <NavLink className="dropdown-item" to="/donations">
                          My Donations
                        </NavLink>
                        <NavLink className="dropdown-item" to="/delegations">
                          My Delegations
                        </NavLink>
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
                  {state.currentUser &&
                    state.wallet &&
                    state.walletLocked && (
                      <li className="nav-item mr-sm-2">
                        <AuthenticatedNavLink className="nav-link" to="#">
                          <i className="fa fa-lock" />
                          &nbsp;UnLock Wallet
                        </AuthenticatedNavLink>
                      </li>
                    )}
                  {state.currentUser &&
                    state.wallet &&
                    !state.walletLocked && (
                      <li className="nav-item mr-sm-2">
                        <NavLink className="nav-link" to="#" onClick={actions.lockWallet}>
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
                  {!state.currentUser && (
                    <NavLink className="nav-link" to="/signin" activeClassName="active">
                      Sign In
                    </NavLink>
                  )}
                  {!state.currentUser && (
                    <NavLink className="nav-link" to="/signup" activeClassName="active">
                      Sign Up
                    </NavLink>
                  )}

                  {state.currentUser && (
                    <li className="nav-item dropdown">
                      <Link
                        className="nav-link dropdown-toggle"
                        id="navbarDropdownYou"
                        to="/"
                        data-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                      >
                        {state.currentUser &&
                          state.currentUser.avatar && (
                            <Avatar
                              className="menu-avatar"
                              size={30}
                              src={state.currentUser.avatar}
                              round
                            />
                          )}

                        {state.currentUser &&
                          state.currentUser.name && <span>{state.currentUser.name}</span>}

                        {state.currentUser && !state.currentUser.name && <span>Hi, you!</span>}
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
                        <button type="button" className="dropdown-item" onClick={actions.onSignOut}>
                          Sign out
                        </button>
                      </div>
                    </li>
                  )}
                </ul>
              </div>
            </nav>

            {/* }
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
                  <strong>Do not send in any Ether!</strong> If you have sent Ether please contact us
                  on &nbsp;
                  <a href="http://join.giveth.io">Slack or Riot</a>.
                </center>
              </div>
            */}
          </div>
        )}
      </UserConsumer>
    );
  }
}

export default withRouter(MainMenu);

MainMenu.propTypes = {};

MainMenu.defaultProps = {};
