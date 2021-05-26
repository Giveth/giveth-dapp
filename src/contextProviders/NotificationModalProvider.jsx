import React, { Component, createContext, Fragment } from 'react';
import PropTypes from 'prop-types';

import NotificationModal from '../components/NotificationModal';

const Context = createContext();
const { Consumer, Provider } = Context;

class NotificationModalProvider extends Component {
  constructor(props) {
    super(props);
    this.state = {
      show: false,
    };
    this.displayModal = this.displayModal.bind(this);
  }

  displayModal(input) {
    this.setState(() => {
      if (input) {
        return {
          show: true,
          ...input,
        };
      }
      return {
        show: false,
      };
    });
  }

  render() {
    const { show } = this.state;
    return (
      <Fragment>
        {show && <NotificationModal closeModal={() => this.displayModal(false)} {...this.state} />}
        <Provider
          value={{
            actions: {
              minPayoutWarningInCreatEdit: () => this.displayModal({ type: 'Creat/Edit' }),
              minPayoutWarningInArchive: () => this.displayModal({ type: 'Archive' }),
              minPayoutWarningInMarkComplete: () => this.displayModal({ type: 'MarkComplete' }),
              minPayoutWarningInWithdraw: () => this.displayModal({ type: 'Withdraw' }),
              donationPending: url => this.displayModal({ txUrl: url, type: 'donationPending' }),
              donationSuccessful: url =>
                this.displayModal({ txUrl: url, type: 'donationSuccessful' }),
              donationFailed: (url, msg) =>
                this.displayModal({ txUrl: url, msg, type: 'donationFailed' }),
              delegationPending: (url, isDac) =>
                this.displayModal({
                  txUrl: url,
                  isDac,
                  type: 'delegationPending',
                }),
              delegationSuccessful: url =>
                this.displayModal({ txUrl: url, type: 'delegationSuccessful' }),
              delegationFailed: (url, msg) =>
                this.displayModal({ txUrl: url, msg, type: 'delegationFailed' }),
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
