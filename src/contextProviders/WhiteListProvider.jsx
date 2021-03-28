import React, { Component, createContext } from 'react';
import PropTypes from 'prop-types';

import { feathersClient } from '../lib/feathersClient';

const Context = createContext();
const { Provider, Consumer } = Context;
export { Consumer, Context };

/**
 * Given list of addresses return users as pair of {address, title}. If no list is provided, return all users
 *
 * @param  String   field List of addresses for which the users has true value in the field
 * @return {array}  List of users as pairs {address, title}
 */
async function getUsers(field) {
  const query = { $select: ['_id', 'name', 'address'], $limit: 100 };

  if (field) query[field] = true;
  else query.email = { $exists: true };

  const resp = await feathersClient.service('/users').find({ query });

  return resp.data.map(r => ({
    value: r.address,
    title: `${r.name ? r.name : 'Anonymous user'} - ${r.address}`,
  }));
}

/**
 * WhiteList stores all the whitelist global data
 *
 * @prop children    Child REACT components
 */
class WhiteListProvider extends Component {
  constructor() {
    super();

    this.state = {
      delegates: [],
      campaignManagers: [],
      reviewers: [],
      tokenWhitelist: [],
      activeTokenWhitelist: [],
      fiatWhitelist: [],
      nativeCurrencyWhitelist: [],
      isLoading: true,
      hasError: false,
      reviewerWhitelistEnabled: false,
      delegateWhitelistEnabled: false,
      projectOwnersWhitelistEnabled: false,
    };
  }

  async componentDidMount() {
    try {
      const whitelist = await feathersClient.service('/whitelist').find();
      let notFilteredUsers = Promise.resolve([]);

      const {
        reviewerWhitelistEnabled,
        projectOwnersWhitelistEnabled,
        delegateWhitelistEnabled,
      } = whitelist;
      if (
        !reviewerWhitelistEnabled ||
        !projectOwnersWhitelistEnabled ||
        !delegateWhitelistEnabled
      ) {
        notFilteredUsers = getUsers();
      }

      const [delegates, campaignManagers, reviewers] = await Promise.all([
        delegateWhitelistEnabled ? getUsers('isDelegator') : notFilteredUsers,
        projectOwnersWhitelistEnabled ? getUsers('isProjectOwner') : notFilteredUsers,
        reviewerWhitelistEnabled ? getUsers('isReviewer') : notFilteredUsers,
      ]);

      this.setState({
        ...whitelist,
        delegates,
        campaignManagers,
        reviewers,
        isLoading: false,
      });
    } catch (err) {
      console.error(err);
      this.setState({ isLoading: false, hasError: true });
    }
  }

  render() {
    const {
      delegates,
      campaignManagers,
      reviewers,
      tokenWhitelist,
      activeTokenWhitelist,
      fiatWhitelist,
      nativeCurrencyWhitelist,
      isLoading,
      hasError,
      reviewerWhitelistEnabled,
      delegateWhitelistEnabled,
      projectOwnersWhitelistEnabled,

      /**
       *  minimumPayoutValue example : {
        "USD": 1,
        "CZK": 22.25,
        "USDC": 1,
        "PAN": 0.091243,
        "MXN": 20.66,
        "ETH": 0.00058405,
        "BRL": 5.7524999999999995,
        "DAI": 0.999,
        "BTC": 0.000017795,
        "AUD": 1.312,
        "THB": 31.3,
        "GBP": 0.72645,
        "CAD": 1.2595,
        "CHF": 0.94225,
        "EUR": 0.8471
    }
       */
      minimumPayoutValue,
    } = this.state;

    return (
      <Provider
        value={{
          state: {
            delegates,
            campaignManagers,
            reviewers,
            tokenWhitelist,
            activeTokenWhitelist,
            fiatWhitelist,
            nativeCurrencyWhitelist,
            isLoading,
            hasError,
            reviewerWhitelistEnabled,
            delegateWhitelistEnabled,
            projectOwnersWhitelistEnabled,
            minimumPayoutValue,
          },
        }}
      >
        {this.props.children}
      </Provider>
    );
  }
}

WhiteListProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
};

export default WhiteListProvider;
