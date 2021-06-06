import React, { Fragment, useContext } from 'react';
import PropTypes from 'prop-types';

import { actionWithLoggedIn, checkBalance } from 'lib/middleware';
import Campaign from '../models/Campaign';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { Context as UserContext } from '../contextProviders/UserProvider';
import { history } from '../lib/helpers';

const EditCampaignButton = ({ campaign, className }) => {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { isForeignNetwork, balance },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);

  const editCampaign = () => {
    if (!isForeignNetwork) {
      return displayForeignNetRequiredWarning();
    }
    return actionWithLoggedIn(currentUser).then(() =>
      checkBalance(balance).then(() => {
        history.push(`/campaigns/${campaign.id}/edit`);
      }),
    );
  };

  const userAddress = currentUser.address;
  const { ownerAddress } = campaign;
  const canUserEdit = userAddress && userAddress === ownerAddress && campaign.isActive;

  return (
    <Fragment>
      {canUserEdit && (
        <button
          type="button"
          className={`btn btn-primary btn-sm ${className}`}
          onClick={editCampaign}
        >
          <i className={className !== 'btn-link' ? 'fa fa-pencil' : 'fa fa-edit'} />
          &nbsp;Edit
        </button>
      )}
    </Fragment>
  );
};

EditCampaignButton.propTypes = {
  campaign: PropTypes.instanceOf(Campaign).isRequired,
  className: PropTypes.string,
};

EditCampaignButton.defaultProps = {
  className: 'btn-link',
};

export default React.memo(EditCampaignButton);
