import React, { Component, createContext } from 'react';
import PropTypes from 'prop-types';

import DACService from '../services/DACService';

const Context = createContext();
const { Provider, Consumer } = Context;
export { Consumer };

/**
 * Delegations provider listing given user's delegations and actions on top of them
 *
 * @prop children    Child REACT components
 */
class DACProvider extends Component {
  constructor() {
    super();

    this.state = {
      dacs: [],
      isLoading: true,
      hasError: false,
      total: 0,
    };

    this._isMounted = false;
    this.loadMore = this.loadMore.bind(this);
  }

  componentDidMount() {
    this._isMounted = true;
    this.loadMore(true);
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  loadMore(init = false) {
    if (
      init ||
      (!this.state.isLoading && this._isMounted && this.state.total > this.state.dacs.length)
    ) {
      this.setState({ isLoading: true }, () =>
        DACService.getDACs(
          this.props.step, // Limit
          this.state.dacs.length, // Skip
          (dacs, total) => {
            if (!this._isMounted) return;
            this.setState(prevState => ({
              dacs: prevState.dacs.concat(dacs),
              total,
              isLoading: false,
            }));
          },
          () => {
            if (!this._isMounted) return;
            this.setState({ hasError: true, isLoading: false });
          },
        ),
      );
    }
  }

  render() {
    const { dacs, isLoading, hasError, total } = this.state;
    const { loadMore } = this;

    return (
      <Provider
        value={{
          state: {
            dacs,
            isLoading,
            hasError,
            total,
            canLoadMore: total > dacs.length,
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

DACProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
  step: PropTypes.number,
};

DACProvider.defaultProps = { step: 50 };

export default DACProvider;
