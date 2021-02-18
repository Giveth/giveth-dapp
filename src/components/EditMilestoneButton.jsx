import React, { forwardRef, Fragment, useContext } from 'react';
import PropTypes from 'prop-types';

import Milestone from 'models/Milestone';
import { checkBalance } from 'lib/middleware';
import { history } from 'lib/helpers';
import ErrorPopup from './ErrorPopup';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { Context as UserContext } from '../contextProviders/UserProvider';

const EditMilestoneButton = forwardRef(({ milestone }, ref) => {
  const {
    state: { balance, isForeignNetwork },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);
  const {
    state: { currentUser },
  } = useContext(UserContext);

  const goMilestoneEditPage = () => {
    checkBalance(balance)
      .then(() => {
        if (['Proposed', 'Rejected'].includes(milestone.status)) {
          history.push(
            `/campaigns/${milestone.campaignId}/milestones/${milestone._id}/edit/proposed`,
          );
          // TODO:
          // history.push(`/milestones/${milestone._id}/edit/proposed`);
        } else {
          history.push(`/campaigns/${milestone.campaignId}/milestones/${milestone._id}/edit`);
          // TODO:
          // history.push(`/milestones/${milestone._id}/edit`);
        }
      })
      .catch(err => {
        if (err === 'noBalance') {
          ErrorPopup('There is no balance left on the account.', err);
        } else if (err !== undefined) {
          ErrorPopup('Something went wrong.', err);
        }
      });
  };

  return (
    <Fragment>
      {milestone.canUserEdit(currentUser) && (
        <button
          ref={ref}
          type="button"
          className="btn btn-link"
          onClick={() =>
            isForeignNetwork ? goMilestoneEditPage() : displayForeignNetRequiredWarning()
          }
        >
          <i className="fa fa-edit" />
          &nbsp;Edit
        </button>
      )}
    </Fragment>
  );
});

EditMilestoneButton.propTypes = {
  milestone: PropTypes.instanceOf(Milestone).isRequired,
};

export default React.memo(EditMilestoneButton);
