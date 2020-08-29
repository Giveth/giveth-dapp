import React, { Component } from 'react';
import Avatar from 'react-avatar';
import { Link, NavLink, withRouter } from 'react-router-dom';

import { Consumer as UserConsumer } from '../contextProviders/UserProvider';
import { Consumer as Web3Consumer } from '../contextProviders/Web3Provider';
import { history, signUpSwal } from '../lib/helpers';
import { Consumer as WhiteListConsumer } from '../contextProviders/WhiteListProvider';

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
      <Web3Consumer>
        {({ state: { validProvider, isEnabled, failedToLoad }, actions: { enableProvider } }) => (
          <UserConsumer>
            {({ state: { currentUser } }) => (
              <WhiteListConsumer>
                {({ actions: { isDelegate, isCampaignManager, isReviewer } }) => {
                  const userIsDelegate = isDelegate(currentUser);
                  const userIsCampaignManager = isCampaignManager(currentUser);
                  const userIsReviewer = isReviewer(currentUser);
                  return (
                    <nav
                      id="main-menu"
                      className={`navbar navbar-expand-lg sticky-top ${
                        showMobileMenu ? 'show' : ''
                      } `}
                    >
                      <button
                        className="navbar-toggler navbar-toggler-right"
                        type="button"
                        onClick={() => this.toggleMobileMenu()}
                      >
                        <i
                          className={`navbar-toggler-icon fa ${
                            showMobileMenu ? 'fa-close' : 'fa-bars'
                          }`}
                        />
                      </button>

                      <Link className="navbar-brand" to="/">
                        <img
                          src={`${process.env.PUBLIC_URL}/img/Giveth-typelogo.svg`}
                          width="70px"
                          alt="Giveth logo"
                        />
                      </Link>

                      <div
                        className={`collapse navbar-collapse ${showMobileMenu ? 'show' : ''} `}
                        id="navbarSupportedContent"
                      >
                        <ul className="navbar-nav">
                          {validProvider && currentUser && (
                            <li className="nav-item dropdown">
                              <NavLink
                                className="nav-link dropdown-toggle"
                                id="navbarDropdownDashboard"
                                to="/dashboard"
                                disabled={!currentUser}
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
                                {(userIsDelegate || userIsReviewer) && (
                                  <NavLink className="dropdown-item" to="/my-dacs">
                                    My Communities
                                  </NavLink>
                                )}
                                {(userIsCampaignManager || userIsReviewer) && (
                                  <NavLink className="dropdown-item" to="/my-campaigns">
                                    My Campaigns
                                  </NavLink>
                                )}
                              </div>
                            </li>
                          )}
                        </ul>

                        {/*
              <form id="search-form" className="form-inline my-2 my-lg-0">
                <input className="form-control mr-sm-2" type="text" placeholder="E.g. save the whales"/>
                <button className="btn btn-outline-success my-2 my-sm-0" type="submit">Find</button>
              </form>
            */}

                        <form
                          action="https://www.github.com/Giveth/giveth-dapp/issues/new"
                          method="get"
                          target="_blank"
                        >
                          <button type="submit" className="btn btn-dark btn-sm btn-report-issue">
                            <i className="fa fa-github" />
                            Report Issue
                          </button>
                        </form>

                        <ul className="navbar-nav">
                          {validProvider && !failedToLoad && !isEnabled && !currentUser && (
                            <button
                              type="button"
                              className="btn btn-outline-success btn-sm"
                              onClick={() => enableProvider()}
                            >
                              Enable Web3
                            </button>
                          )}
                          {validProvider && !failedToLoad && isEnabled && !currentUser && (
                            <small className="text-muted">Please unlock MetaMask</small>
                          )}
                          {!validProvider && (
                            <button
                              type="button"
                              className="btn btn-outline-info btn-sm"
                              onClick={signUpSwal}
                            >
                              Sign Up!
                            </button>
                          )}

                          {currentUser && (
                            <li className="nav-item dropdown">
                              <Link
                                className="nav-link dropdown-toggle"
                                id="navbarDropdownYou"
                                to="/"
                                data-toggle="dropdown"
                                aria-haspopup="true"
                                aria-expanded="false"
                              >
                                {currentUser.avatar && (
                                  <Avatar
                                    className="menu-avatar"
                                    size={30}
                                    src={currentUser.avatar}
                                    round
                                  />
                                )}

                                {currentUser.name && <span>{currentUser.name}</span>}

                                {!currentUser.name && <span>Hi, you!</span>}
                              </Link>
                              <div
                                className={`dropdown-menu dropdown-profile ${
                                  showMobileMenu ? 'show' : ''
                                }`}
                                aria-labelledby="navbarDropdownYou"
                              >
                                <NavLink className="dropdown-item" to="/profile">
                                  Profile
                                </NavLink>
                                {/* <NavLink className="dropdown-item" to="/wallet">
                                Wallet
                              </NavLink> */}
                              </div>
                            </li>
                          )}
                        </ul>
                      </div>
                    </nav>
                  );
                }}
              </WhiteListConsumer>
            )}
          </UserConsumer>
        )}
      </Web3Consumer>
    );
  }
}

export default withRouter(MainMenu);

MainMenu.propTypes = {};

MainMenu.defaultProps = {};
