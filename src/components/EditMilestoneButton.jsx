import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';

import Milestone from 'models/Milestone';
import User from 'models/User';
import { checkBalance } from 'lib/middleware';
import { history } from 'lib/helpers';
import { Consumer as Web3Consumer } from '../contextProviders/Web3Provider';

class EditMilestoneButton extends Component {
  editMilestone() {
    const { balance, milestone } = this.props;

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
          // handle no balance error
        }
      });
  }

  render() {
    const { milestone, currentUser } = this.props;

    return (
      <Web3Consumer>
        {({ state: { isForeignNetwork } }) => (
          <Fragment>
            {milestone.canUserEdit(currentUser) &&
              isForeignNetwork && (
                <button type="button" className="btn btn-link" onClick={() => this.editMilestone()}>
                  <i className="fa fa-edit" />
                  &nbsp;Edit
                </button>
              )}
          </Fragment>
        )}
      </Web3Consumer>
    );
  }
}

EditMilestoneButton.propTypes = {
  currentUser: PropTypes.instanceOf(User).isRequired,
  balance: PropTypes.instanceOf(BigNumber).isRequired,
  milestone: PropTypes.instanceOf(Milestone).isRequired,
};

export default EditMilestoneButton;
