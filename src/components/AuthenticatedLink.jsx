import React from 'react';
import { Link, withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import GivethWallet from '../lib/blockchain/GivethWallet';

const AuthenticatedLink = ({ className, to, wallet, children, history }) => {
  if (wallet && wallet.unlocked) {
    return (
      <Link className={className} to={to}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={className}
      onClick={() => React.unlockWallet(() => history.push(to))}
    >
      {children}
    </button>
  );
};

AuthenticatedLink.propTypes = {
  wallet: PropTypes.instanceOf(GivethWallet),
  to: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }).isRequired,
};

AuthenticatedLink.defaultProps = {
  wallet: undefined,
  className: '',
};

export default withRouter(AuthenticatedLink);
