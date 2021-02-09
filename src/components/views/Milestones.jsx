import React, { useEffect, useRef, useState } from 'react';

import PropTypes from 'prop-types';
import MilestoneCard from '../MilestoneCard';
import Loader from '../Loader';
import LoadMore from '../LoadMore';
import MilestoneService from '../../services/MilestoneService';

/**
 * The Milestones view mapped to /milestones
 */
const Milestones = ({ step }) => {
  const [milestones, setMilestones] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [hasError, setHasError] = useState(false);
  const isMounted = useRef(false);

  const loadMore = (init = false) => {
    if (init || (!isLoading && isMounted.current && total > milestones.length)) {
      setLoading(true);
      MilestoneService.getActiveMilestones(
        step, // Limit
        milestones.length, // Skip
        (_milestones, _total) => {
          if (!isMounted.current) return;
          setMilestones(milestones.concat(_milestones));
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
  }, []);

  return (
    <div id="milestones-view" className="card-view">
      <div className="container-fluid page-layout reduced-padding">
        <h4>Milestones {total > 0 && <span className="badge badge-success">{total}</span>}</h4>
        {!hasError && milestones.length > 0 && (
          <div>
            <p>
              Here are a few of the latest Milestones. Help them realise their goals by giving Ether
              or tokens!
            </p>
            <div className="cards-grid-container">
              {milestones.map(milestone => (
                <MilestoneCard key={milestone.id} milestone={milestone} />
              ))}
            </div>
            {milestones.length < total && <LoadMore onClick={loadMore} disabled={isLoading} />}
          </div>
        )}

        {!hasError && isLoading && <Loader />}

        {// There are no Milestones, show empty state
        !hasError && !isLoading && milestones.length === 0 && (
          <div>
            <div className="text-center">
              <p>There are no Milestones yet!</p>
              <img
                className="empty-state-img"
                src={`${process.env.PUBLIC_URL}/img/milestone.svg`}
                width="200px"
                height="200px"
                alt="no-milestones-icon"
              />
            </div>
          </div>
        )}
        {hasError && (
          <p>
            <strong>Oops, something went wrong...</strong> The Giveth dapp could not load Milestones
            for some reason. Please try refreshing the page...
          </p>
        )}
      </div>
    </div>
  );
};

Milestones.propTypes = {
  step: PropTypes.number,
};

Milestones.defaultProps = { step: 20 };

export default Milestones;
