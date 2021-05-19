import React, { Component, createContext, Fragment } from 'react';
import PropTypes from 'prop-types';

import MinimumPayoutModal from '../components/MinimumPayoutModal';

const Context = createContext();
const { Consumer, Provider } = Context;

class NotificationModalProvider extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showMinPayoutWarning: false,
    };
    this.displayMinPayoutWarning = this.displayMinPayoutWarning.bind(this);
  }

  displayMinPayoutWarning(isVisible) {
    this.setState({
      showMinPayoutWarning: isVisible,
    });
  }

  render() {
    const { showMinPayoutWarning } = this.state;
    return (
      <Fragment>
        <MinimumPayoutModal
          show={showMinPayoutWarning}
          closeModal={() => this.displayMinPayoutWarning(false)}
          width={700}
        />
        <Provider
          value={{
            actions: {
              displayMinPayoutWarning: () => this.displayMinPayoutWarning(true),
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
