import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';

import MilestoneService from 'services/MilestoneService';
import Milestone from 'models/Milestone';
import User from 'models/User';
import ErrorPopup from 'components/ErrorPopup';
import ConversationModal from 'components/ConversationModal';
import GA from 'lib/GoogleAnalytics';
import { Consumer as Web3Consumer } from '../contextProviders/Web3Provider';

class ReproposeRejectedMilestoneButton extends Component {
  constructor() {
    super();
    this.conversationModal = React.createRef();
  }

  repropose() {
    const { milestone } = this.props;

    this.conversationModal.current
      .openModal({
        title: 'Reject proposed milestone',
        description:
          'Optionally explain why you reject this proposed milestone. This information will be publicly visible and emailed to the milestone owner.',
        textPlaceholder: 'Optionally explain why you reject this proposal...',
        required: false,
        cta: 'Reject proposal',
        enableAttachProof: false,
        token: milestone.token,
      })
      .then(proof =>
        MilestoneService.reproposeRejectedMilestone({
          milestone,
          proof,
          onSuccess: () => {
            GA.trackEvent({
              category: 'Milestone',
              action: 'reproposed rejected milestone',
              label: milestone._id,
            });
            React.toast.info(<p>The milestone has been re-proposed.</p>);
          },
          onError: e => ErrorPopup('Something went wrong with re-proposing your milestone', e),
        }),
      );
  }

  render() {
    const { milestone, currentUser } = this.props;

    return (
      <Web3Consumer>
        {({ state: { isForeignNetwork } }) => (
          <Fragment>
            {milestone.owner.address === currentUser.address &&
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

            <ConversationModal ref={this.conversationModal} milestone={milestone} />
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
