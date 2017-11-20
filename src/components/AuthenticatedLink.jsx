import React from 'react';
import { Link, withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';

const AuthenticatedLink = ({
  className, to, wallet, children,
}) => {
  if (wallet && wallet.unlocked) {
    return (
      <Link className={className} to={to}>{children}</Link>
    );
  }
  return (
    <button className={className} onClick={() => React.unlockWallet(to)}>{children}</button>
  );
};

AuthenticatedLink.propTypes = {
  wallet: PropTypes.shape({
    unlocked: PropTypes.bool.isRequired,
    unlock: PropTypes.func.isRequired,
  }),
  to: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

AuthenticatedLink.defaultProps = {
  wallet: undefined,
  className: '',
};

export default withRouter(AuthenticatedLink);
