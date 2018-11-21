import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

import MilestoneService from 'services/MilestoneService';
import Milestone from 'models/Milestone';
import User from 'models/User';
import ErrorPopup from 'components/ErrorPopup';
import confirmationDialog from 'lib/confirmationDialog';

const DeleteProposedMilestoneButton = ({ milestone, currentUser, isForeignNetwork }) => {
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
    <Fragment>
      {milestone.ownerAddress === currentUser.address &&
        isForeignNetwork &&
        ['Proposed', 'Rejected'].includes(milestone.status) && (
          <span>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={_deleteProposedMilestone()}
            >
              <i className="fa fa-times-circle-o" />
              &nbsp;Delete
            </button>
          </span>
        )}
    </Fragment>
  );
};

DeleteProposedMilestoneButton.propTypes = {
  currentUser: PropTypes.instanceOf(User).isRequired,
  milestone: PropTypes.objectOf(Milestone).isRequired,
  isForeignNetwork: PropTypes.bool.isRequired,
};

export default DeleteProposedMilestoneButton;
