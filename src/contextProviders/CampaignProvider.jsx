import React, { Component, createContext } from 'react';
import PropTypes from 'prop-types';

import CampaignService from '../services/CampaignService';

const Context = createContext();
const { Provider, Consumer } = Context;
export { Consumer };

/**
 * Delegations provider listing given user's delegations and actions on top of them
 *
 * @prop children    Child REACT components
 */
class CampaignProvider extends Component {
  constructor() {
    super();

    this.state = {
      campaigns: [],
      isLoading: true,
      hasError: false,
      total: 0,
    };

    this.loadMore = this.loadMore.bind(this);
  }

  componentWillMount() {
    this.loadMore(true);
  }

  loadMore(init = false) {
    if (init || (!this.state.isLoading && this.state.total > this.state.campaigns.length)) {
      this.setState({ isLoading: true }, () =>
        CampaignService.getCampaigns(
          this.props.step, // Limit
          this.state.campaigns.length, // Skip
          (campaigns, total) => {
            this.setState(prevState => ({
              campaigns: prevState.campaigns.concat(campaigns),
              total,
              isLoading: false,
            }));
          },
          () => this.setState({ hasError: true, isLoading: false }),
        ),
      );
    }
  }

  render() {
    const { campaigns, isLoading, hasError, total } = this.state;
    const { loadMore } = this;

    return (
      <Provider
        value={{
          state: {
            campaigns,
            isLoading,
            hasError,
            total,
            canLoadMore: total > campaigns.length,
          },
          actions: {
            loadMore,
          },
        }}
      >
        {this.props.children}
      </Provider>
    );
  }
}

CampaignProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
  step: PropTypes.number,
};

CampaignProvider.defaultProps = { step: 50 };

export default CampaignProvider;
