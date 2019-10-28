import React, { Component } from 'react';
import Avatar from 'react-avatar';
import { Link, NavLink, withRouter } from 'react-router-dom';

import { Consumer as UserConsumer } from '../contextProviders/UserProvider';
import { Consumer as Web3Consumer } from '../contextProviders/Web3Provider';
import { history } from '../lib/helpers';
import portis from '../lib/portisSingleton';
import { WEB3_PROVIDER_NAMES } from '../lib/blockchain/getWeb3';

const signUpSwal = () => {
  React.swal({
    title: 'Sign Up!',
    content: React.swal.msg(
      <p>
        In order to use the Dapp, you need to use a Web3 wallet.
        <br />
        It is recommended that you install <a href="https://metamask.io/">MetaMask</a>.
      </p>,
    ),
    icon: 'info',
    buttons: ['Ok'],
  });
};

const onPortisButtonClick = () => {
  portis.showPortis();
};

const PortisButton = () => (
  <button
    type="button"
    className="btn btn-outline-info btn-sm btn-signup"
    onClick={onPortisButtonClick}
  >
    Portis
  </button>
);

const getEnableWeb3Button = enableProvider => (
  <button type="button" className="btn btn-outline-success btn-sm" onClick={() => enableProvider()}>
    Enable Web3
  </button>
);

const getUnlockMessage = () => (
  <small className="text-muted">
    {'Please '}
    <strong>unlock MetaMask</strong>
    {' or use'}
    <PortisButton />
  </small>
);

const getSignUpButton = () => (
  <span>
    <span>Sign Up! Use one of the following wallets: </span>
    <button type="button" className="btn btn-outline-info btn-sm btn-signup" onClick={signUpSwal}>
      MetaMask
    </button>
    <PortisButton />
  </span>
);

const getCurrentUserDisplay = (showMobileMenu, currentUser, providerName) => {
  const showPortisNavItem =
    providerName === WEB3_PROVIDER_NAMES.portis ? (
      <button
        className="dropdown-item dropdown-item-show-portis"
        onClick={onPortisButtonClick}
        type="button"
      >
        Show Portis wallet
      </button>
    ) : null;
  return (
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
          <Avatar className="menu-avatar" size={30} src={currentUser.avatar} round />
        )}
        {currentUser.name && <span>{currentUser.name}</span>}
        {!currentUser.name && <span>Hi, you!</span>}
      </Link>
      <div
        className={`dropdown-menu dropdown-profile ${showMobileMenu ? 'show' : ''}`}
        aria-labelledby="navbarDropdownYou"
      >
        <NavLink className="dropdown-item" to="/profile">
          Profile
        </NavLink>
        {showPortisNavItem}
        {/* <NavLink className="dropdown-item" to="/wallet">
            Wallet
          </NavLink> */}
      </div>
    </li>
  );
};

const getTopRightUserControls = (
  validProvider,
  failedToLoad,
  isEnabled,
  currentUser,
  showMobileMenu,
  enableProvider,
  providerName,
) => {
  if (!validProvider) {
    return getSignUpButton();
  }
  if (validProvider && !failedToLoad && !isEnabled) {
    return getEnableWeb3Button(enableProvider);
  }
  if (validProvider && !failedToLoad && isEnabled && !currentUser) {
    return getUnlockMessage();
  }
  if (currentUser) {
    return getCurrentUserDisplay(showMobileMenu, currentUser, providerName);
  }
  return null;
};

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
        {({
          state: { validProvider, isEnabled, failedToLoad, providerName },
          actions: { enableProvider },
        }) => (
          <UserConsumer>
            {({ state }) => (
              <nav
                id="main-menu"
                className={`navbar navbar-expand-lg sticky-top ${showMobileMenu ? 'show' : ''} `}
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

                <Link className="navbar-brand" to="/">
                  <img src="/img/Giveth-typelogo.svg" width="70px" alt="Giveth logo" />
                </Link>

                <div
                  className={`collapse navbar-collapse ${showMobileMenu ? 'show' : ''} `}
                  id="navbarSupportedContent"
                >
                  <ul className="navbar-nav">
                    {validProvider && state.currentUser && (
                      <li className="nav-item dropdown">
                        <NavLink
                          className="nav-link dropdown-toggle"
                          id="navbarDropdownDashboard"
                          to="/dashboard"
                          disabled={!state.currentUser}
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

                  {/*
            <form id="search-form" className="form-inline my-2 my-lg-0">
              <input className="form-control mr-sm-2" type="text" placeholder="E.g. save the whales"/>
              <button className="btn btn-outline-success my-2 my-sm-0" type="submit">Find</button>
            </form>
          */}

                  <a
                    className="dropdown-item support"
                    rel="noopener noreferrer"
                    href="https://www.github.com/Giveth/giveth-dapp/issues/new"
                    target="_blank"
                  >
                    Tech Support
                  </a>

                  <ul className="navbar-nav">
                    {getTopRightUserControls(
                      validProvider,
                      failedToLoad,
                      isEnabled,
                      state.currentUser,
                      showMobileMenu,
                      enableProvider,
                      providerName,
                    )}
                  </ul>
                </div>
              </nav>
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
