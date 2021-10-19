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

      const archiveMessage = (
        <Fragment>
          <p>
            By Archiving this Campaign, it will no longer be listed and will be unable to accept
            future donations or delegations. Any Traces listed under this Campaign will be Archived
            as well. This action can only be reversed by a Giveth admin.
          </p>
          <p>Would you like to proceed?</p>
        </Fragment>
      );
      const unarchiveMessage = 'Are you sure you want to Unarchive this Campaign?';

      Modal.confirm({
        title: <h5>{unarchive ? 'Unarchive' : 'Archive'} campaign?</h5>,
        content: <p>{unarchive ? unarchiveMessage : archiveMessage}</p>,
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
  const canUserUnArchive = userAddress && currentUser.isAdmin;
  const isArchiveable = canUserArchive && campaign.isActive;
  const isUnArchiveable = canUserUnArchive && campaign.status === Campaign.ARCHIVED;

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
