import React, { useContext } from 'react';
import Loader from './Loader';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { Context as UserContext } from '../contextProviders/UserProvider';

export default function IsUserSignIn(WrappedComponent) {
  return props => {
    const { state: userStates, actions: userActions } = useContext(UserContext);
    const { state: web3States, actions: web3Actions } = useContext(Web3Context);

    if (userStates.userIsLoading) {
      return <Loader className="fixed" />;
    }
    if (web3States.validProvider && userStates.currentUser.address) {
      return <WrappedComponent {...userStates} {...userActions} {...props} />;
    }
    return (
      <div className="is-user-signin container">
        <div className="signin-warning">
          <div className="warning-content">Please signin</div>
          <button type="button" onClick={web3Actions.enableProvider}>
            Signin
          </button>
        </div>
      </div>
    );
  };
}
