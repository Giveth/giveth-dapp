import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import CommunityCard from '../CommunityCard';
import Loader from '../Loader';
import CommunityService from '../../services/CommunityService';
import LoadMore from '../LoadMore';

/**
 * The Communities view mapped to /communities
 */
const Communities = ({ onlyRecent, step }) => {
  const [communities, setCommunities] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [hasError, setHasError] = useState(false);

  const isMounted = useRef(false);

  const loadMore = (init = false) => {
    if (init || (!isLoading && isMounted.current && total > communities.length)) {
      setLoading(true);
      CommunityService.getCommunities(
        step, // Limit
        communities.length, // Skip
        onlyRecent,
        (_communities, _total) => {
          if (!isMounted.current) return;
          setCommunities(communities.concat(_communities));
          setTotal(_total);
          setLoading(false);
        },
        () => {
          if (!isMounted.current) return;
          setHasError(true);
          setLoading(false);
        },
      );
    }
  };
  useEffect(() => {
    isMounted.current = true;
    loadMore(true);

    return () => {
      isMounted.current = false;
    };
  }, [onlyRecent]);

  return (
    <div className="container">
      <div id="communities-view" className="card-view">
        <div className="container-fluid page-layout reduced-padding">
          <h4>
            Decentralized Altruistic Communities{' '}
            {total > 0 && <span className="badge badge-success">{total}</span>}
          </h4>

          {// There are some Communities in the system, show them
          !hasError && communities.length > 0 && (
            <div>
              <p>
                These Communities are solving causes. Help them realise their goals by joining them
                and giving Ether or tokens!
              </p>
              <div className="cards-grid-container">
                {communities.map(community => (
                  <CommunityCard key={community.id} community={community} />
                ))}
              </div>
              {communities.length < total && <LoadMore onClick={loadMore} disabled={isLoading} />}
            </div>
          )}
          {!hasError && isLoading && <Loader />}

          {// There are no Communities, show empty state
          !hasError && !isLoading && communities.length === 0 && (
            <div>
              <div className="text-center">
                <p>There are no Decentralized Altruistic Communities (Communities) yet!</p>
                <img
                  className="empty-state-img"
                  src={`${process.env.PUBLIC_URL}/img/community.svg`}
                  width="200px"
                  height="200px"
                  alt="no-communities-icon"
                />
              </div>
            </div>
          )}
          {hasError && (
            <p>
              <strong>Oops, something went wrong...</strong> The Giveth dapp could not load any
              Communities for some reason. Please try refreshing the page...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

Communities.propTypes = {
  step: PropTypes.number,
  onlyRecent: PropTypes.bool,
};

Communities.defaultProps = { step: 20, onlyRecent: false };

export default Communities;
