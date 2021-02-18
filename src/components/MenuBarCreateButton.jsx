import React, { useContext, useEffect, useState } from 'react';
import { Link, useRouteMatch } from 'react-router-dom';
import PropTypes from 'prop-types';
import CampaignService from '../services/CampaignService';
import { Context as UserContext } from '../contextProviders/UserProvider';

function MenuBarCreateButton() {
  const {
    state: { currentUser },
  } = useContext(UserContext);

  const isMounted = React.useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

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
      if (campaign && isMounted.current) {
        setCampaignIsActive(campaign.isActive);
        setOwnerAddress(campaign.ownerAddress);
      }
    } catch (e) {
      if (isMounted.current) {
        setCampaignIsActive(false);
        setOwnerAddress(null);
      }
    }
  };
  if (!match) return null;
  const { id } = match.params;
  useEffect(() => {
    if (id) {
      getCampaign(id);
    }
  }, [id]);

  if (campaignIsActive && currentUser.address) {
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
  }),
};

MenuBarCreateButton.defaultProps = {
  match: undefined,
};

const areEqual = (prevProps, nextProps) => {
  if (prevProps.match === undefined) return nextProps.match === undefined;
  return prevProps.match === nextProps.match && prevProps.match.path === nextProps.match.path;
};
export default React.memo(MenuBarCreateButton, areEqual);
