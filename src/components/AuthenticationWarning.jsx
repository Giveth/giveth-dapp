/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import PropTypes from 'prop-types';
import User from '../models/User';

/**
 * Show a warning if the user is not authenticated
 */
const AuthenticationWarning = ({ currentUser }) =>
  (!currentUser || !currentUser.authenticated) && (
    <div className="alert alert-warning">
      <i className="fa fa-exclamation-triangle" />
      You are not yet authenticated. Please{' '}
      <a role="button" tabIndex="-1" onClick={() => React.signIn()} onKeyUp={() => React.signIn()}>
        Sign In
      </a>{' '}
      to be able to perform actions.
    </div>
  );

AuthenticationWarning.propTypes = {
  currentUser: PropTypes.instanceOf(User).isRequired,
};

export default AuthenticationWarning;
