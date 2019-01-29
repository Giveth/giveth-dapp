import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';

import MilestoneService from 'services/MilestoneService';
import Milestone from 'models/Milestone';
import User from 'models/User';
import ErrorPopup from 'components/ErrorPopup';
import GA from 'lib/GoogleAnalytics';
import { Consumer as Web3Consumer } from '../contextProviders/Web3Provider';

class ReproposeRejectedMilestoneButton extends Component {
  repropose() {
    const { milestone } = this.props;

    React.swal({
      title: 'Re-propose Milestone?',
      text: 'Are you sure you want to re-propose this Milestone?',
      icon: 'warning',
      dangerMode: true,
      buttons: ['Cancel', 'Yes'],
      content: {
        element: 'input',
        attributes: {
          placeholder: 'Add a reason why you re-propose this rejected milestone...',
        },
      },
    }).then(reason => {
      // if null, then "Cancel" was pressed
      if (reason === null) return;

      MilestoneService.reproposeRejectedMilestone({
        milestone,
        reason,
        onSuccess: () => {
          GA.trackEvent({
            category: 'Milestone',
            action: 'reproposed rejected milestone',
            label: milestone._id,
          });
          React.toast.info(<p>The milestone has been re-proposed.</p>);
        },
        onError: e => ErrorPopup('Something went wrong with re-proposing your milestone', e),
      });
    });
  }

  render() {
    const { milestone, currentUser } = this.props;

    return (
      <Web3Consumer>
        {({ state: { isForeignNetwork } }) => (
          <Fragment>
            {currentUser &&
              milestone.ownerAddress === currentUser.address &&
              milestone.status === 'Rejected' && (
                <button
                  type="button"
                  className="btn btn-success btn-sm"
                  onClick={() => this.repropose()}
                  disabled={!isForeignNetwork}
                >
                  <i className="fa fa-times-square-o" />
                  &nbsp;Re-propose
                </button>
              )}
          </Fragment>
        )}
      </Web3Consumer>
    );
  }
}

ReproposeRejectedMilestoneButton.propTypes = {
  currentUser: PropTypes.instanceOf(User).isRequired,
  milestone: PropTypes.instanceOf(Milestone).isRequired,
};

export default ReproposeRejectedMilestoneButton;
