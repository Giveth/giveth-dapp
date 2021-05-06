import React, { Fragment, useContext } from 'react';
import PropTypes from 'prop-types';

import MilestoneService from 'services/MilestoneService';
import Milestone from 'models/Milestone';
import ErrorPopup from 'components/ErrorPopup';
import GA from 'lib/GoogleAnalytics';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { actionWithLoggedIn } from '../lib/middleware';
import { Context as UserContext } from '../contextProviders/UserProvider';
import BridgedMilestone from '../models/BridgedMilestone';
import LPPCappedMilestone from '../models/LPPCappedMilestone';
import LPMilestone from '../models/LPMilestone';

function ReproposeRejectedMilestoneButton({ milestone }) {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { isForeignNetwork },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);

  const repropose = () => {
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
  };

  return (
    <Fragment>
      {milestone.canUserRepropose(currentUser) && (
        <button
          type="button"
          className="btn btn-success btn-sm"
          onClick={() => (isForeignNetwork ? repropose() : displayForeignNetRequiredWarning())}
        >
          <i className="fa fa-times-square-o" />
          &nbsp;Re-propose
        </button>
      )}
    </Fragment>
  );
}

ReproposeRejectedMilestoneButton.propTypes = {
  milestone: PropTypes.oneOfType(
    [Milestone, BridgedMilestone, LPPCappedMilestone, LPMilestone].map(PropTypes.instanceOf),
  ).isRequired,
};

export default React.memo(ReproposeRejectedMilestoneButton);
