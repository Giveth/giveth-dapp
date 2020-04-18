import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

import MilestoneService from 'services/MilestoneService';
import Milestone from 'models/Milestone';
import User from 'models/User';
import ErrorPopup from 'components/ErrorPopup';
import confirmationDialog from 'lib/confirmationDialog';

import { actionWithLoggedIn } from '../lib/middleware';

const DeleteProposedMilestoneButton = ({ milestone, currentUser }) => {
  const _confirmDeleteMilestone = () => {
    MilestoneService.deleteProposedMilestone({
      milestone,
      onSuccess: () => React.toast.info(<p>The Milestone has been deleted.</p>),
      onError: e => ErrorPopup('Something went wrong with deleting your Milestone', e),
    });
  };

  const _deleteProposedMilestone = () =>
    actionWithLoggedIn(currentUser).then(() =>
      confirmationDialog('milestone', milestone.title, _confirmDeleteMilestone),
    );

  return (
    <Fragment>
      {milestone.canUserDelete(currentUser) && (
        <span>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={_deleteProposedMilestone}
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
  currentUser: PropTypes.instanceOf(User),
  milestone: PropTypes.instanceOf(Milestone).isRequired,
};

DeleteProposedMilestoneButton.defaultProps = {
  currentUser: undefined,
};

export default DeleteProposedMilestoneButton;
