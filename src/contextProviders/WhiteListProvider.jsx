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
      reviewerWhiteListEnabled: false,
      delegateWhitelistEnabled: false,
      projectOwnersWhitelistEnabled: false,
    };
  }

  async componentDidMount() {
    try {
      const whitelist = await feathersClient.service('/whitelist').find();
      let notFilteredUsers = Promise.resolve([]);

      const {
        reviewerWhiteListEnabled,
        projectOwnersWhitelistEnabled,
        delegateWhitelistEnabled,
      } = whitelist;
      if (
        !reviewerWhiteListEnabled ||
        !projectOwnersWhitelistEnabled ||
        !delegateWhitelistEnabled
      ) {
        notFilteredUsers = getUsers();
      }

      const [delegates, campaignManagers, reviewers] = await Promise.all([
        delegateWhitelistEnabled ? getUsers('isDelegator') : notFilteredUsers,
        projectOwnersWhitelistEnabled ? getUsers('isProjectOwner') : notFilteredUsers,
        reviewerWhiteListEnabled ? getUsers('isReviewer') : notFilteredUsers,
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
      reviewerWhiteListEnabled,
      delegateWhitelistEnabled,
      projectOwnersWhitelistEnabled,
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
            reviewerWhiteListEnabled,
            delegateWhitelistEnabled,
            projectOwnersWhitelistEnabled,
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
