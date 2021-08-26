import React, { Fragment, useContext } from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'antd';

import { authenticateUser } from 'lib/middleware';
import Campaign from '../models/Campaign';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { Context as UserContext } from '../contextProviders/UserProvider';

const ArchiveCampaignButton = ({ campaign, className, onSuccess }) => {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { web3 },
  } = useContext(Web3Context);

  const archiveCampaign = unarchive => {
    authenticateUser(currentUser, false, web3).then(authenticated => {
      if (!authenticated) return;
      Modal.confirm({
        title: <h5>{unarchive ? 'Unarchive' : 'Archive'} campaign?</h5>,
        content: (
          <p>Are you sure you want to {unarchive ? 'Unarchive' : 'Archive'} this Campaign?</p>
        ),
        cancelText: 'Dismiss',
        okText: `Yes, ${unarchive ? 'Unarchive' : 'Archive'}`,
        centered: true,
        width: 500,
        onOk: () => campaign.archive(currentUser.address, onSuccess, !!unarchive),
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
          onClick={() => archiveCampaign(false)}
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
  onSuccess: PropTypes.func.isRequired,
};

ArchiveCampaignButton.defaultProps = {
  className: '',
};

export default React.memo(ArchiveCampaignButton);
