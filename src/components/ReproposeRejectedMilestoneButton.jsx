import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';

import MilestoneService from 'services/MilestoneService';
import Milestone from 'models/Milestone';
import User from 'models/User';
import ErrorPopup from 'components/ErrorPopup';
import GA from 'lib/GoogleAnalytics';
import { Consumer as Web3Consumer } from '../contextProviders/Web3Provider';
import { actionWithLoggedIn } from '../lib/middleware';

class ReproposeRejectedMilestoneButton extends Component {
  repropose() {
    const { milestone, currentUser } = this.props;

    actionWithLoggedIn(currentUser).then(() =>
      React.swal({
        title: 'Re-propose Milestone?',
        text: 'Are you sure you want to re-propose this Milestone?',
        icon: 'warning',
        dangerMode: true,
        buttons: ['Cancel', 'Yes'],
        content: {
          element: 'input',
          attributes: {
            placeholder: 'Add a reason why you re-propose this rejected Milestone...',
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
            React.toast.info(<p>The Milestone has been re-proposed.</p>);
          },
          onError: e => ErrorPopup('Something went wrong with re-proposing your Milestone', e),
        });
      }),
    );
  }

  render() {
    const { milestone, currentUser } = this.props;

    return (
      <Web3Consumer>
        {({ state: { isForeignNetwork }, actions: { displayForeignNetRequiredWarning } }) => (
          <Fragment>
            {milestone.canUserRepropose(currentUser) && (
              <button
                type="button"
                className="btn btn-success btn-sm"
                onClick={() =>
                  isForeignNetwork ? this.repropose() : displayForeignNetRequiredWarning()
                }
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
  currentUser: PropTypes.instanceOf(User),
  milestone: PropTypes.instanceOf(Milestone).isRequired,
};

ReproposeRejectedMilestoneButton.defaultProps = {
  currentUser: undefined,
};

export default ReproposeRejectedMilestoneButton;
