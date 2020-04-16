/* eslint-disable react/no-unescaped-entities */
import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';

import Milestone from 'models/Milestone';
import Campaign from 'models/Campaign';
import User from 'models/User';
import MilestoneService from 'services/MilestoneService';
import ErrorPopup from 'components/ErrorPopup';
import { checkBalance, actionWithLoggedIn } from 'lib/middleware';
import { Consumer as Web3Consumer } from '../contextProviders/Web3Provider';

class ArchiveMilestoneButton extends Component {
  archiveMilestone() {
    const { milestone, balance, currentUser } = this.props;

    const status = milestone.donationCounters.some(dc => dc.currentBalance.gt(0))
      ? Milestone.COMPLETED
      : Milestone.PAID;

    actionWithLoggedIn(currentUser).then(() =>
      checkBalance(balance)
        .then(async () => {
          const proceed = await React.swal({
            title: 'Archive Milestone?',
            text: `Are you sure you want to archive this Milestone? The milestone status will be set to ${status} and will no longer be able to accept donations.`,
            icon: 'warning',
            dangerMode: true,
            buttons: ['Cancel', 'Archive'],
          });

          // if null, then "Cancel" was pressed
          if (proceed === null) return;

          const afterSave = txUrl => {
            React.toast.info(
              <p>
                Archiving this Milestone...
                <br />
                <a href={txUrl} target="_blank" rel="noopener noreferrer">
                  View transaction
                </a>
              </p>,
            );
          };

          const afterMined = txUrl => {
            React.toast.success(
              <p>
                The Milestone has been archived!
                <br />
                <a href={txUrl} target="_blank" rel="noopener noreferrer">
                  View transaction
                </a>
              </p>,
            );
          };

          const onError = (err, txUrl) => {
            if (err === 'patch-error') {
              ErrorPopup('Something went wrong archiving this Milestone', err);
            } else {
              ErrorPopup(
                'Something went wrong with the transaction.',
                `${txUrl} => ${JSON.stringify(err, null, 2)}`,
              );
            }
          };

          if (milestone.ownerAddress === currentUser.address) {
            milestone.status = Milestone.ARCHIVED;
            milestone.parentProjectId = milestone.campaign.projectId;
            MilestoneService.save({
              milestone,
              from: currentUser.address,
              afterSave,
              afterMined,
              onError,
            });
          } else {
            const campaign = new Campaign(milestone.campaign);
            campaign.archivedMilestones.add(milestone.projectId);
            campaign.save(afterSave, afterMined);
          }
        })
        .catch(err => {
          if (err === 'noBalance') {
            ErrorPopup('There is no balance left on the account.', err);
          } else if (err !== undefined) {
            ErrorPopup('Something went wrong.', err);
          }
        }),
    );
  }

  render() {
    const { milestone, currentUser } = this.props;

    return (
      <Web3Consumer>
        {({ state: { isForeignNetwork }, actions: { displayForeignNetRequiredWarning } }) => (
          <Fragment>
            {milestone.canUserArchive(currentUser) && (
              <button
                type="button"
                className="btn btn-success btn-sm"
                onClick={() =>
                  isForeignNetwork ? this.archiveMilestone() : displayForeignNetRequiredWarning()
                }
              >
                Archive
              </button>
            )}
          </Fragment>
        )}
      </Web3Consumer>
    );
  }
}

ArchiveMilestoneButton.propTypes = {
  currentUser: PropTypes.instanceOf(User),
  balance: PropTypes.instanceOf(BigNumber).isRequired,
  milestone: PropTypes.instanceOf(Milestone).isRequired,
};

ArchiveMilestoneButton.defaultProps = {
  currentUser: undefined,
};

export default ArchiveMilestoneButton;
