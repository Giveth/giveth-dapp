import React, { Component, createContext } from 'react';
import PropTypes from 'prop-types';
import { utils } from 'web3';
import { feathersClient } from '../lib/feathersClient';

import ErrorPopup from '../components/ErrorPopup';

// models
import User from '../models/User';

const Context = createContext();
const { Provider, Consumer } = Context;
export { Consumer };

// TO DO: This is the minimum transaction view required to:
// create a DAC / Campaign / Milestone / Profile
React.minimumWalletBalance = 0.01;
React.minimumWalletBalanceInWei = utils.toBN(utils.toWei('0.01'));

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
      hasError: false,
    };

    this.getUserData = this.getUserData.bind(this);
  }

  componentDidMount() {
    this.getUserData(this.props.account);
  }

  componentDidUpdate(prevProps) {
    const { currentUser } = this.state;
    const { account } = this.props;
    if ((account && !currentUser) || (currentUser && account !== prevProps.account)) {
      this.getUserData(account);
    }
  }

  componentWillUnmount() {
    if (this.userSubscriber) this.userSubscriber.unsubscribe();
  }

  async getUserData(address) {
    if (this.userSubscriber) this.userSubscriber.unsubscribe();

    return new Promise((resolve, reject) => {
      if (!address) {
        this.setState({ currentUser: undefined }, () => {
          resolve();
          this.props.onLoaded();
        });
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

    if (currentUser) {
      try {
        const token = await feathersClient.passport.getJWT();

        if (token) {
          const payload = await feathersClient.passport.verifyJWT(token);

          if (currentUser.address === payload.userId) {
            await feathersClient.authenticate(); // authenticate the socket connection
          } else {
            await feathersClient.logout();
          }
        }
      } catch (e) {
        // ignore
      }
    }

    this.props.onLoaded();
  }

  render() {
    const { currentUser, hasError } = this.state;

    return (
      <Provider
        value={{
          state: {
            currentUser,
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
  account: PropTypes.string,
  onLoaded: PropTypes.func,
};

UserProvider.defaultProps = {
  onLoaded: () => {},
  account: undefined,
};

export default UserProvider;
