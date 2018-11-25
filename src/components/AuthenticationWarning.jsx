import React from 'react';
import PropTypes from 'prop-types';
import User from '../models/User';
import { isLoggedIn, authenticateIfPossible } from '../lib/middleware';

const authenticate = user => {
  authenticateIfPossible(user)
    .then(() => isLoggedIn(user))
    .catch(err => {
      if (err === 'notLoggedIn') return; // eslint-disable-line
    });
};

/**
 * Show a warning if the user is not authenticated
 */
const AuthenticationWarning = ({ currentUser }) =>
  (!currentUser || !currentUser.authenticated) && (
    <div className="alert alert-warning">
      <i className="fa fa-exclamation-triangle" />
      You are not yet authenticated. Please
      <button type="button" className="btn btn-link" onClick={() => authenticate(currentUser)}>
        Sign In
      </button>{' '}
      to be able to perform actions.
    </div>
  );

AuthenticationWarning.propTypes = {
  currentUser: PropTypes.instanceOf(User).isRequired,
};

export default AuthenticationWarning;
