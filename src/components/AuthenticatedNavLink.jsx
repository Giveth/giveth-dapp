import React from 'react';
import { NavLink, withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';

import GivethWallet from '../lib/blockchain/GivethWallet';

const AuthenticatedNavLink = ({
  className, to, wallet, children,
}) => {
  if (wallet && wallet.unlocked) {
    return (
      <NavLink className={className} to={to}>{children}</NavLink>
    );
  }
  return (
    <div>
      <a
        className={className}
        href={to}
        onClick={() => React.unlockWallet(to)}
      >{children}
      </a>
    </div>
  );
};

AuthenticatedNavLink.propTypes = {
  wallet: PropTypes.instanceOf(GivethWallet),
  to: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

AuthenticatedNavLink.defaultProps = {
  wallet: undefined,
  className: '',
};

export default withRouter(AuthenticatedNavLink);
