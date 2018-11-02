import React, { Component, createContext } from 'react';
import PropTypes from 'prop-types';
import { feathersClient } from '../lib/feathersClient';

import Web3Wallet from '../lib/blockchain/Web3Wallet';
import getWeb3 from '../lib/blockchain/getWeb3';

import ErrorPopup from '../components/ErrorPopup';

// models
import User from '../models/User';

const Context = createContext();
const { Provider, Consumer } = Context;
export { Consumer };

// TO DO: This is the minimum transaction view required to:
// create a DAC / Campaign / Milestone / Profile
React.minimumWalletBalance = 0.01;

React.whitelist = {};

// Fetch whitelist
feathersClient
  .service('/whitelist')
  .find()
  .then(whitelist => {
    React.whitelist = whitelist;
  });

/**
 * This container holds the application and its routes.
 * It is also responsible for loading application persistent data.
 * As long as this component is mounted, the data will be persistent,
 * if passed as props to children.
 */
class UserProvider extends Component {
  constructor() {
    super();

    this.state = {
      currentUser: undefined,
      // isLoading: true,
      isLoading: false,
      hasError: false,
      wallet: undefined,
    };

    this.getUserData = this.getUserData.bind(this);
  }

  componentWillMount() {
    getWeb3().then(web3 => {
      this.setState({ wallet: web3.defaultNode ? undefined : new Web3Wallet(web3) });
    });
  }

  componentWillReceiveProps(nextProps) {
    const { currentUser } = this.state;
    if (
      (nextProps.account && !currentUser) ||
      (currentUser && nextProps.account !== currentUser.address)
    ) {
      this.getUserData(nextProps.account);
    }
  }

  // getDerivedStateFromProps(a, b) {
  // console.log('getDerivedState', a, b);
  // }

  componentWillUnmount() {
    if (this.userSubscriber) this.userSubscriber.unsubscribe();
  }

  async getUserData(address) {
    if (this.userSubscriber) this.userSubscriber.unsubscribe();

    return new Promise((resolve, reject) => {
      if (!address) {
        this.setState({ currentUser: undefined }, resolve());
      } else {
        this.userSubscriber = feathersClient
          .service('/users')
          .watch({ listStrategy: 'always' })
          .find({
            query: {
              address,
            },
          })
          .subscribe(
            resp => {
              const currentUser = resp.total === 1 ? new User(resp.data[0]) : new User({ address });
              this.setState({ currentUser }, () => {
                this.authenticateIfPossible();
                resolve();
              });
            },
            error => {
              ErrorPopup(
                'Something went wrong with getting user profile. Please try again after refresh.',
                error,
              );
              this.setState({ currentUser: new User({ address }) }, () => {
                this.authenticateIfPossible();
                reject();
              });
            },
          );
      }
    });
  }

  async authenticateIfPossible() {
    const { currentUser } = this.state;
    if (!currentUser) return;

    try {
      const token = await feathersClient.passport.getJWT();

      if (!token) return;
      const payload = await feathersClient.passport.verifyJWT(token);

      if (currentUser.address === payload.userId) {
        feathersClient.authenticate(); // authenticate the socket connection
      }
      // this.setState({
      // isLoading: false,
      // hasError: false,
      // }),
    } catch (e) {
      // this.setState({ isLoading: false, hasError: false });
    }
  }

  render() {
    const { currentUser, wallet, isLoading, hasError } = this.state;

    return (
      <Provider
        value={{
          state: {
            currentUser,
            wallet,
            isLoading,
            hasError,
          },
        }}
      >
        {this.props.children}
      </Provider>
    );
  }
}

UserProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
  account: PropTypes.string.isRequired,
};

export default UserProvider;
