import React, { useMemo, useState } from 'react';
import { Link, useRouteMatch } from 'react-router-dom';
import PropTypes from 'prop-types';
import CampaignService from '../services/CampaignService';
import User from '../models/User';

function MenuBarCreateButton({ currentUser }) {
  const match = useRouteMatch({
    path: '/campaigns/:id',
    exact: true,
    strict: true,
    sensitive: true,
  });

  const [campaignIsActive, setCampaignIsActive] = useState(false);
  const [ownerAddress, setOwnerAddress] = useState(null);

  const getCampaign = async id => {
    try {
      if (id === 'new') {
        throw new Error('new is not a valid campaignId');
      }
      const campaign = await CampaignService.get(id);
      if (campaign) {
        setCampaignIsActive(campaign.isActive);
        setOwnerAddress(campaign.ownerAddress);
      }
    } catch (e) {
      setCampaignIsActive(false);
      setOwnerAddress(null);
    }
  };

  if (!match) return null;

  const { id } = match.params;
  useMemo(() => getCampaign(id), [id]);

  if (campaignIsActive && currentUser) {
    const userIsOwner = currentUser.address && currentUser.address === ownerAddress;
    return (
      <Link
        className="nav-link"
        to={`/campaigns/${id}/milestones/${userIsOwner ? 'new' : 'propose'}`}
      >
        Create New
      </Link>
    );
  }

  return null;
}

MenuBarCreateButton.propTypes = {
  match: PropTypes.shape({
    path: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
  }),
  currentUser: PropTypes.instanceOf(User),
};

MenuBarCreateButton.defaultProps = {
  match: undefined,
  currentUser: undefined,
};

export default MenuBarCreateButton;
