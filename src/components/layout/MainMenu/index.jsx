import React, { useContext, useEffect, useState } from 'react';
import Avatar from 'react-avatar';
import { Link, NavLink } from 'react-router-dom';
import { withRouter } from 'react-router';

import { Context as UserContext } from '../../../contextProviders/UserProvider';
import { Context as Web3Context } from '../../../contextProviders/Web3Provider';
import { Context as WhiteListContext } from '../../../contextProviders/WhiteListProvider';
import { history, signUpSwal } from '../../../lib/helpers';
import MenuBarCreateButton from '../../MenuBarCreateButton';
import Navlinks from './Navlinks';

// Broken rule that can not find the correct id tag
/* eslint jsx-a11y/aria-proptypes: 0 */
/**
 * The main top menu
 */
const MainMenu = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    // when route changes, close the menu
    history.listen(() => setShowMobileMenu(false));
  }, []);

  function toggleMobileMenu() {
    setShowMobileMenu(!showMobileMenu);
  }

  const MenuBarCreateButtonWithRouter = withRouter(MenuBarCreateButton);

  const {
    state: { currentUser },
  } = useContext(UserContext);

  const {
    state: { isEnabled, validProvider, failedToLoad },
    actions: { enableProvider },
  } = useContext(Web3Context);

  const {
    reviewerWhiteListEnabled,
    delegateWhitelistEnabled,
    projectOwnersWhitelistEnabled,
  } = useContext(WhiteListContext);

  const userIsDelegate = currentUser.isDelegator || !delegateWhitelistEnabled;
  const userIsCampaignManager = currentUser.isProjectOwner || !projectOwnersWhitelistEnabled;
  const userIsReviewer = currentUser.isReviewer || !reviewerWhiteListEnabled;

  return (
    <nav
      className={`navbar sticky-top navbar-expand-lg main-menu ${showMobileMenu ? 'show' : ''} `}
    >
      <button
        className="navbar-toggler"
        type="button"
        onClick={() => toggleMobileMenu()}
        data-toggle="collapse"
        data-target=".menu-navbar"
      >
        <i className="navbar-toggler-icon fa fa-bars" />
      </button>

      <Link className="navbar-brand" to="/">
        <img
          src={`${process.env.PUBLIC_URL}/img/Giveth-typelogo.svg`}
          width="70px"
          alt="Giveth logo"
        />
      </Link>
      <div className="navbar-collapse collapse order-3 order-lg-1 menu-navbar">
        <Navlinks />
      </div>
      <div className="navbar-collapse collapse mx-auto order-3 order-lg-2 menu-navbar">
        <form
          action="https://www.github.com/Giveth/giveth-dapp/issues/new"
          method="get"
          target="_blank"
          className="form-report-issue"
        >
          <button type="submit" className="btn btn-dark btn-sm btn-report-issue">
            <i className="fa fa-github" />
            Report Issue
          </button>
        </form>
      </div>
      <div className="navbar-collapse collapse order-1 order-lg-3 menu-navbar">
        <ul className="navbar-nav ml-auto">
          <MenuBarCreateButtonWithRouter />
          {validProvider && currentUser.address && (
            <li className="nav-item dropdown">
              <NavLink
                className="nav-link dropdown-toggle"
                id="navbarDropdownDashboard"
                to="#"
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

          {validProvider && !failedToLoad && !isEnabled && !currentUser.address && (
            <button
              type="button"
              className="btn btn-outline-success btn-sm"
              onClick={() => enableProvider()}
            >
              Enable Web3
            </button>
          )}
          {validProvider && !failedToLoad && isEnabled && !currentUser.address && (
            <small className="text-muted">Please unlock MetaMask</small>
          )}
          {!validProvider && (
            <button type="button" className="btn btn-outline-info btn-sm" onClick={signUpSwal}>
              Sign Up!
            </button>
          )}

          {currentUser.address && (
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
};

export default withRouter(MainMenu);

MainMenu.propTypes = {};

MainMenu.defaultProps = {};
