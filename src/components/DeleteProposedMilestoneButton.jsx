import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

import MilestoneService from 'services/MilestoneService';
import Milestone from 'models/Milestone';
import User from 'models/User';
import ErrorPopup from 'components/ErrorPopup';
import confirmationDialog from 'lib/confirmationDialog';
import { Consumer as Web3Consumer } from '../contextProviders/Web3Provider';

const DeleteProposedMilestoneButton = ({ milestone, currentUser }) => {
  const _confirmDeleteMilestone = () => {
    MilestoneService.deleteProposedMilestone({
      milestone,
      onSuccess: () => React.toast.info(<p>The milestone has been deleted.</p>),
      onError: e => ErrorPopup('Something went wrong with deleting your milestone', e),
    });
  };

  const _deleteProposedMilestone = () =>
    confirmationDialog('milestone', milestone.title, _confirmDeleteMilestone);

  return (
    <Web3Consumer>
      {({ state: { isForeignNetwork } }) => (
        <Fragment>
          {milestone.ownerAddress === currentUser.address &&
            ['Proposed', 'Rejected'].includes(milestone.status) && (
              <span>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={_deleteProposedMilestone()}
                  disable={!isForeignNetwork}
                >
                  <i className="fa fa-times-circle-o" />
                  &nbsp;Delete
                </button>
              </span>
            )}
        </Fragment>
      )}
    </Web3Consumer>
  );
};

DeleteProposedMilestoneButton.propTypes = {
  currentUser: PropTypes.instanceOf(User).isRequired,
  milestone: PropTypes.instanceOf(Milestone).isRequired,
};

export default DeleteProposedMilestoneButton;
