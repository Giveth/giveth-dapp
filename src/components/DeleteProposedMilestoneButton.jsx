import React, { forwardRef, Fragment, useContext } from 'react';
import PropTypes from 'prop-types';

import MilestoneService from 'services/MilestoneService';
import Milestone from 'models/Milestone';
import ErrorPopup from 'components/ErrorPopup';
import confirmationDialog from 'lib/confirmationDialog';

import { actionWithLoggedIn } from '../lib/middleware';
import { Context as UserContext } from '../contextProviders/UserProvider';

const DeleteProposedMilestoneButton = forwardRef(({ milestone }, ref) => {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const _confirmDeleteMilestone = () => {
    MilestoneService.deleteProposedMilestone({
      milestone,
      onSuccess: () => React.toast.info(<p>The Milestone has been deleted.</p>),
      onError: e => ErrorPopup('Something went wrong with deleting your Milestone', e),
    });
  };

  const deleteProposedMilestone = () => {
    actionWithLoggedIn(currentUser).then(() =>
      confirmationDialog('milestone', milestone.title, _confirmDeleteMilestone),
    );
  };

  return (
    <Fragment>
      {milestone.canUserDelete(currentUser) && (
        <span>
          <button
            ref={ref}
            type="button"
            className="btn btn-danger btn-sm"
            onClick={deleteProposedMilestone}
          >
            <i className="fa fa-times-circle-o" />
            &nbsp;Delete
          </button>
        </span>
      )}
    </Fragment>
  );
});

DeleteProposedMilestoneButton.propTypes = {
  milestone: PropTypes.instanceOf(Milestone).isRequired,
};

export default React.memo(DeleteProposedMilestoneButton);
