import React, { Fragment, useContext } from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'antd';

import { authenticateUser, checkBalance } from 'lib/middleware';
import Campaign from '../models/Campaign';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { Context as UserContext } from '../contextProviders/UserProvider';

const ArchiveCampaignButton = ({ campaign, className, onArchive }) => {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { isForeignNetwork, balance, web3 },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);

  const archiveCampaign = unarchive => {
    if (!isForeignNetwork) {
      return displayForeignNetRequiredWarning();
    }
    return authenticateUser(currentUser, false, web3).then(authenticated => {
      if (!authenticated) return;
      checkBalance(balance).then(() => {
        Modal.confirm({
          title: <h5>{unarchive ? 'Unarchive' : 'Archive'} campaign?</h5>,
          content: (
            <p>Are you sure you want to {unarchive ? 'Unarchive' : 'Archive'} this Campaign?</p>
          ),
          cancelText: 'Dismiss',
          okText: `Yes, ${unarchive ? 'Unarchive' : 'Archive'}`,
          centered: true,
          width: 500,
          onOk: () => campaign.archive(web3, currentUser.address, onArchive, !!unarchive).then(),
        });
      });
    });
  };

  const userAddress = currentUser.address;
  const { ownerAddress } = campaign;
  const canUserArchive = userAddress && (userAddress === ownerAddress || currentUser.isAdmin);
  const isArchiveable = canUserArchive && campaign.isActive;
  const isUnArchiveable = canUserArchive && campaign.status === Campaign.ARCHIVED;

  return (
    <Fragment>
      {isArchiveable && (
        <button
          type="button"
          className={`btn btn-danger btn-sm ${className}`}
          onClick={archiveCampaign}
        >
          <i className="fa fa-ban mr-2" />
          &nbsp;Archive
        </button>
      )}
      {isUnArchiveable && (
        <button
          type="button"
          className={`btn btn-danger btn-sm ${className}`}
          onClick={() => archiveCampaign(true)}
        >
          <i className="fa fa-ban mr-2" />
          &nbsp;Unarchive
        </button>
      )}
    </Fragment>
  );
};

ArchiveCampaignButton.propTypes = {
  campaign: PropTypes.instanceOf(Campaign).isRequired,
  className: PropTypes.string,
  onArchive: PropTypes.func,
};

ArchiveCampaignButton.defaultProps = {
  className: '',
  onArchive: () => {},
};

export default React.memo(ArchiveCampaignButton);
