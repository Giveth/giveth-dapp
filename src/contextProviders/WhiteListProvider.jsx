import React, { Component, createContext } from 'react';
import PropTypes from 'prop-types';

import { feathersClient } from '../lib/feathersClient';

const Context = createContext();
const { Provider, Consumer } = Context;
export { Consumer };

/**
 * check if the currentUser is in a particular whitelist.
 *
 * @param currentUser {object} Current User object
 * @param whitelist   {array}  Array of whitelisted addresses
 *
 * @return boolean
 *
 */
function isInWhitelist(currentUser, whitelist) {
  if (
    (Array.isArray(whitelist) && whitelist.length === 0) ||
    (Array.isArray(whitelist) &&
      currentUser &&
      currentUser.address &&
      whitelist.find(u => u.address.toLowerCase() === currentUser.address.toLowerCase()))
  ) {
    return true;
  }
  return false;
}

/**
 * Given list of addresses return users as pair of {address, title}. If no list is provided, return all users
 *
 * @param  {array} addresses List of addresses for which the users should be retrieved or undefined
 * @return {array}           List of users as pairs {address, title}
 */
async function getUsers(addresses) {
  const query = { $select: ['_id', 'name', 'address'], $limit: 100 };

  if (Array.isArray(addresses) && addresses.length > 0)
    query.address = { $in: addresses.map(a => a.address) };
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
      reviewerWhitelist: [],
      delegateWhitelist: [],
      projectOwnerWhitelist: [],
      tokenWhitelist: [],
      activeTokenWhitelist: [],
      fiatWhitelist: [],
      isLoading: true,
      hasError: false,
    };
  }

  async componentDidMount() {
    try {
      const whitelist = await feathersClient.service('/whitelist').find();

      const delegates = await getUsers(whitelist.delegateWhitelist);
      const campaignManagers = await getUsers(whitelist.projectOwnerWhitelist);
      const reviewers = await getUsers(whitelist.reviewerWhitelist);

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
      reviewerWhitelist,
      delegateWhitelist,
      projectOwnerWhitelist,
      tokenWhitelist,
      activeTokenWhitelist,
      fiatWhitelist,
      isLoading,
      hasError,
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
            isLoading,
            hasError,
          },
          actions: {
            isDelegate: user => isInWhitelist(user, delegateWhitelist),
            isCampaignManager: user => isInWhitelist(user, projectOwnerWhitelist),
            isReviewer: user => isInWhitelist(user, reviewerWhitelist),
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
