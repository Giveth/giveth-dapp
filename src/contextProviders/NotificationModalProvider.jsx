import React, { Component, createContext, Fragment } from 'react';
import PropTypes from 'prop-types';

import NotificationModal from '../components/NotificationModal';

const Context = createContext();
const { Consumer, Provider } = Context;

class NotificationModalProvider extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showMinPayoutWarning: false,
      minimumPayoutUsdValue: undefined,
    };
    this.displayMinPayoutWarning = this.displayMinPayoutWarning.bind(this);
  }

  displayMinPayoutWarning(input) {
    this.setState(() => {
      if (input) {
        return {
          showMinPayoutWarning: true,
          minimumPayoutUsdValue: input.minimumPayoutUsdValue,
          type: input.type,
        };
      }
      return {
        showMinPayoutWarning: false,
      };
    });
  }

  render() {
    const { showMinPayoutWarning, minimumPayoutUsdValue, type } = this.state;
    return (
      <Fragment>
        {showMinPayoutWarning && (
          <NotificationModal
            show={showMinPayoutWarning}
            closeModal={() => this.displayMinPayoutWarning(false)}
            width={700}
            minimumPayoutUsdValue={minimumPayoutUsdValue}
            type={type}
          />
        )}
        <Provider
          value={{
            actions: {
              displayMinPayoutWarning: input => this.displayMinPayoutWarning(input),
            },
          }}
        >
          {this.props.children}
        </Provider>
      </Fragment>
    );
  }
}

NotificationModalProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
};

export { Consumer, Context };
export default NotificationModalProvider;
