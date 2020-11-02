import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';

import MilestoneService from 'services/MilestoneService';
import Milestone from 'models/Milestone';
import User from 'models/User';
import ErrorPopup from 'components/ErrorPopup';
import confirmationDialog from 'lib/confirmationDialog';

import { actionWithLoggedIn } from '../lib/middleware';

class DeleteProposedMilestoneButton extends Component {
  constructor(props) {
    super(props);

    this._confirmDeleteMilestone = this._confirmDeleteMilestone.bind(this);
    this.deleteProposedMilestone = this.deleteProposedMilestone.bind(this);
  }

  _confirmDeleteMilestone() {
    const { milestone } = this.props;
    MilestoneService.deleteProposedMilestone({
      milestone,
      onSuccess: () => React.toast.info(<p>The Milestone has been deleted.</p>),
      onError: e => ErrorPopup('Something went wrong with deleting your Milestone', e),
    });
  }

  deleteProposedMilestone() {
    const { currentUser, milestone } = this.props;
    actionWithLoggedIn(currentUser).then(() =>
      confirmationDialog('milestone', milestone.title, this._confirmDeleteMilestone),
    );
  }

  render() {
    const { currentUser, milestone } = this.props;
    return (
      <Fragment>
        {milestone.canUserDelete(currentUser) && (
          <span>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={this.deleteProposedMilestone}
            >
              <i className="fa fa-times-circle-o" />
              &nbsp;Delete
            </button>
          </span>
        )}
      </Fragment>
    );
  }
}

DeleteProposedMilestoneButton.propTypes = {
  currentUser: PropTypes.instanceOf(User),
  milestone: PropTypes.instanceOf(Milestone).isRequired,
};

DeleteProposedMilestoneButton.defaultProps = {
  currentUser: undefined,
};

export default DeleteProposedMilestoneButton;
