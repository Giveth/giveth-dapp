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
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const match = useRouteMatch({
    path: '/campaign/:slug',
    exact: true,
    strict: true,
    sensitive: true,
  });

  const [campaignIsActive, setCampaignIsActive] = useState(false);

  const getCampaign = async slug => {
    try {
      const exists = await CampaignService.getActiveCampaignExistsBySlug(slug);
      if (exists && isMounted.current) {
        setCampaignIsActive(true);
      } else if (isMounted.current) {
        setCampaignIsActive(false);
      }
    } catch (e) {
      console.log(e);
      if (isMounted.current) {
        setCampaignIsActive(false);
      }
    }
  };

  const { slug } = match ? match.params : {};

  useEffect(() => {
    if (slug) {
      getCampaign(slug);
    }
  }, [slug]);

  if (!match) return null;

  if (campaignIsActive && currentUser.address) {
    return (
      <Link className="nav-link" to={`/campaign/${slug}/new`}>
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
