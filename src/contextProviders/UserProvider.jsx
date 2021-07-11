// eslint-disable-next-line camelcase
import jwt_decode from 'jwt-decode';
import React, { Component, createContext } from 'react';
import BigNumber from 'bignumber.js';
import PropTypes from 'prop-types';
import Web3, { utils } from 'web3';
import { authenticateUser } from 'lib/middleware';
import { feathersClient } from '../lib/feathersClient';
import ErrorHandler from '../lib/ErrorHandler';

// models
import User from '../models/User';
import { CommunityService } from '../services';

const Context = createContext();
const { Provider, Consumer } = Context;
export { Context, Consumer };

// TO DO: This is the minimum transaction view required to:
// create a Community / Campaign / Trace / Profile
React.minimumWalletBalance = 0.01;
React.minimumWalletBalanceInWei = new BigNumber(utils.toWei('0.01'));

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
      currentUser: {},
      hasError: false,
      userIsCommunityOwner: false,
      isLoading: true,
    };

    this.getUserData = this.getUserData.bind(this);
    this.authenticateFeathers = this.authenticateFeathers.bind(this);
    this.signIn = this.signIn.bind(this);
    this.updateUserData = this.updateUserData.bind(this);

    // hack to make signIn globally available
    React.signIn = this.signIn;
  }

  componentDidMount() {
    this.getUserData(this.props.account);
  }

  componentDidUpdate(prevProps) {
    const { currentUser } = this.state;
    const { account } = this.props;
    if (
      (account && !currentUser.address) ||
      (currentUser.address && account !== prevProps.account)
    ) {
      this.getUserData(account).then();
    }
  }

  async getUserData(address) {
    if (!address) {
      this.setState({
        currentUser: {},
        userIsCommunityOwner: false,
        isLoading: false,
      });
    } else {
      feathersClient
        .service('/users')
        .find({
          query: {
            address,
          },
        })
        .then(
          resp => {
            const currentUser = resp.total === 1 ? new User(resp.data[0]) : new User({ address });
            if (currentUser.address.toLowerCase() === address.toLowerCase()) {
              this.setState({ currentUser }, () => {
                this.authenticateFeathers();

                CommunityService.getUserIsCommunityOwner(
                  address,
                  userIsCommunityOwner => this.setState({ userIsCommunityOwner }),
                  () => this.setState({ userIsCommunityOwner: false }),
                );
              });
            }
          },
          error => {
            const message = `Something went wrong with getting user profile. Please try again after refresh.`;
            ErrorHandler(error, message);

            this.setState({ currentUser: new User({ address }) }, () => {
              this.authenticateFeathers();
            });
          },
        );
    }
  }

  signIn(redirectOnFail) {
    const { currentUser } = this.state;

    if (currentUser.address) {
      authenticateUser(currentUser, redirectOnFail, this.props.web3).then(isAuthenticated => {
        if (isAuthenticated) {
          currentUser.authenticated = true;
          this.setState({
            currentUser: new User(currentUser),
            isLoading: false,
          });
        }
      });
    }
  }

  async authenticateFeathers() {
    const { currentUser } = this.state;

    if (currentUser.address) {
      try {
        const token = await feathersClient.authentication.getAccessToken();
        if (token) {
          const payload = jwt_decode(token);
          if (currentUser.address === payload.userId) {
            await feathersClient.reAuthenticate(); // authenticate the socket connection
            currentUser.authenticated = true;
            this.setState({ currentUser });
          } else {
            await feathersClient.logout();
          }
        } else {
          currentUser.authenticated = false;
          this.setState({ currentUser });
        }
      } catch (e) {
        // ignore
      }
    }

    this.setState({ isLoading: false });
  }

  async updateUserData() {
    const { currentUser } = this.state;

    if (currentUser.address) {
      await this.getUserData(currentUser.address);
    }
  }

  render() {
    const { currentUser, hasError, userIsCommunityOwner, isLoading } = this.state;
    return (
      <Provider
        value={{
          state: {
            currentUser,
            hasError,
            signIn: this.signIn,
            userIsCommunityOwner,
            isLoading,
          },
          actions: {
            updateUserData: this.updateUserData,
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
  web3: PropTypes.instanceOf(Web3),
};

UserProvider.defaultProps = {
  account: undefined,
  web3: undefined,
};

export default UserProvider;
