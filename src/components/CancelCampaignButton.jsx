import React, { Fragment, useContext } from 'react';
import PropTypes from 'prop-types';

import { authenticateUser, checkBalance } from 'lib/middleware';
import Campaign from '../models/Campaign';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { Context as UserContext } from '../contextProviders/UserProvider';
import confirmationDialog from '../lib/confirmationDialog';
import { sendAnalyticsTracking } from '../lib/SegmentAnalytics';

const CancelCampaignButton = ({ campaign, className, onCancel }) => {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { isForeignNetwork, balance, web3 },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);

  const cancelCampaign = () => {
    if (!isForeignNetwork) {
      return displayForeignNetRequiredWarning();
    }
    return authenticateUser(currentUser, false, web3).then(authenticated => {
      if (!authenticated) return;
      checkBalance(balance).then(() => {
        const confirmCancelCampaign = () => {
          const afterCreate = url => {
            const msg = (
              <p>
                Campaign cancellation pending...
                <br />
                <a href={url} target="_blank" rel="noopener noreferrer">
                  View transaction
                </a>
              </p>
            );
            React.toast.info(msg);
            onCancel();
            sendAnalyticsTracking('Campaign Cancelled', {
              category: 'Campaign',
              action: 'cancel',
              campaignId: campaign.id,
              title: campaign.title,
              slug: campaign.slug,
              ownerId: campaign.ownerAddress,
              txUrl: url,
            });
          };

          const afterMined = url => {
            const msg = (
              <p>
                The Campaign has been cancelled!
                <br />
                <a href={url} target="_blank" rel="noopener noreferrer">
                  View transaction
                </a>
              </p>
            );
            React.toast.success(msg);
            onCancel();
          };
          campaign.cancel(currentUser.address, afterCreate, afterMined, web3);
        };
        confirmationDialog('campaign', campaign.title, confirmCancelCampaign);
      });
    });
  };

  const userAddress = currentUser.address;
  const { ownerAddress, reviewerAddress } = campaign;
  const canUserCancel =
    userAddress &&
    (userAddress === ownerAddress || userAddress === reviewerAddress) &&
    campaign.isActive;

  return (
    <Fragment>
      {canUserCancel && (
        <button
          type="button"
          className={`btn btn-danger btn-sm ${className}`}
          onClick={cancelCampaign}
        >
          <i className="fa fa-ban mr-2" />
          &nbsp;Cancel
        </button>
      )}
    </Fragment>
  );
};

CancelCampaignButton.propTypes = {
  campaign: PropTypes.instanceOf(Campaign).isRequired,
  className: PropTypes.string,
  onCancel: PropTypes.func,
};

CancelCampaignButton.defaultProps = {
  className: '',
  onCancel: () => {},
};

export default React.memo(CancelCampaignButton);
