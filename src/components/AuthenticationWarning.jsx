/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useContext } from 'react';
import { Context as UserContext } from '../contextProviders/UserProvider';
/**
 * Show a warning if the user is not authenticated
 */
const AuthenticationWarning = () => {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  return (
    !currentUser.authenticated && (
      <div className="alert alert-warning">
        <i className="fa fa-exclamation-triangle" />
        You are not yet authenticated. Please{' '}
        <a
          role="button"
          tabIndex="-1"
          onClick={() => React.signIn()}
          onKeyUp={() => React.signIn()}
        >
          Sign In
        </a>{' '}
        to be able to perform actions.
      </div>
    )
  );
};

export default React.memo(AuthenticationWarning);
