/* eslint-disable react/no-unescaped-entities */
import React, { Fragment, useContext } from 'react';
import PropTypes from 'prop-types';

import Milestone from 'models/Milestone';
import Campaign from 'models/Campaign';
import MilestoneService from 'services/MilestoneService';
import ErrorPopup from 'components/ErrorPopup';
import { actionWithLoggedIn, checkBalance } from 'lib/middleware';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { Context as UserContext } from '../contextProviders/UserProvider';
import { Context as WhiteListContext } from '../contextProviders/WhiteListProvider';
import { Context as NotificationContext } from '../contextProviders/NotificationModalProvider';
import BridgedMilestone from '../models/BridgedMilestone';
import LPPCappedMilestone from '../models/LPPCappedMilestone';
import LPMilestone from '../models/LPMilestone';

const ArchiveMilestoneButton = ({ milestone, isAmountEnoughForWithdraw }) => {
  const {
    state: { currentUser },
  } = useContext(UserContext);

  const {
    state: { isForeignNetwork, balance },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);

  const {
    state: { minimumPayoutUsdValue },
  } = useContext(WhiteListContext);

  const {
    actions: { minPayoutWarningInArchive },
  } = useContext(NotificationContext);

  const archiveMilestone = () => {
    const status = milestone.donationCounters.some(dc => dc.currentBalance.gt(0))
      ? Milestone.COMPLETED
      : Milestone.PAID;

    actionWithLoggedIn(currentUser).then(() =>
      checkBalance(balance)
        .then(async () => {
          if (!isAmountEnoughForWithdraw) {
            minPayoutWarningInArchive(minimumPayoutUsdValue);
            return;
          }
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

          const userAddress = currentUser.address;
          if (milestone.ownerAddress === userAddress) {
            milestone.status = Milestone.ARCHIVED;
            milestone.parentProjectId = milestone.campaign.projectId;
            MilestoneService.save({
              milestone,
              from: userAddress,
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
  };

  return (
    <Fragment>
      {milestone.canUserArchive(currentUser) && (
        <button
          type="button"
          className="btn btn-success btn-sm"
          onClick={() =>
            isForeignNetwork ? archiveMilestone() : displayForeignNetRequiredWarning()
          }
        >
          Archive
        </button>
      )}
    </Fragment>
  );
};

ArchiveMilestoneButton.propTypes = {
  milestone: PropTypes.oneOfType(
    [Milestone, BridgedMilestone, LPPCappedMilestone, LPMilestone].map(PropTypes.instanceOf),
  ).isRequired,
  isAmountEnoughForWithdraw: PropTypes.bool.isRequired,
};

export default React.memo(ArchiveMilestoneButton);
