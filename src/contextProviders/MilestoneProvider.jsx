import React, { Component, createContext } from 'react';
import PropTypes from 'prop-types';

import MilestoneService from '../services/MilestoneService';

const Context = createContext();
const { Provider, Consumer } = Context;
export { Consumer };

/**
 *
 * @prop children    Child REACT components
 */
class MilestoneProvider extends Component {
  constructor() {
    super();

    this.state = {
      milestones: [],
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
    if (init || (!this.state.isLoading && this.state.total > this.state.milestones.length)) {
      this.setState({ isLoading: true }, () =>
        MilestoneService.getActiveMilestones(
          this.props.step, // Limit
          this.state.milestones.length, // Skip
          (milestones, total) => {
            this.setState(prevState => ({
              milestones: prevState.milestones.concat(milestones),
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
    const { milestones, isLoading, hasError, total } = this.state;
    const { loadMore } = this;

    return (
      <Provider
        value={{
          state: {
            milestones,
            isLoading,
            hasError,
            total,
            canLoadMore: total > milestones.length,
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

MilestoneProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
  step: PropTypes.number,
};

MilestoneProvider.defaultProps = { step: 50 };

export default MilestoneProvider;
