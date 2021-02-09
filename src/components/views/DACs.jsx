import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import DACCard from '../DacCard';
import Loader from '../Loader';
import DACService from '../../services/DACService';
import LoadMore from '../LoadMore';

/**
 * The DACs view mapped to /dacs
 */
const DACs = ({ onlyRecent, step }) => {
  const [dacs, setDacs] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [hasError, setHasError] = useState(false);

  const isMounted = useRef(false);

  const loadMore = (init = false) => {
    if (init || (!isLoading && isMounted.current && total > dacs.length)) {
      setLoading(true);
      DACService.getDACs(
        step, // Limit
        dacs.length, // Skip
        onlyRecent,
        (_dacs, _total) => {
          if (!isMounted.current) return;
          setDacs(dacs.concat(_dacs));
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
    <div id="dacs-view" className="card-view">
      <div className="container-fluid page-layout reduced-padding">
        <h4>
          Decentralized Altruistic Communities{' '}
          {total > 0 && <span className="badge badge-success">{total}</span>}
        </h4>

        {// There are some DACs in the system, show them
        !hasError && dacs.length > 0 && (
          <div>
            <p>
              These Communities are solving causes. Help them realise their goals by joining them
              and giving Ether or tokens!
            </p>
            <div className="cards-grid-container">
              {dacs.map(dac => (
                <DACCard key={dac.id} dac={dac} />
              ))}
            </div>
            {dacs.length < total && <LoadMore onClick={loadMore} disabled={isLoading} />}
          </div>
        )}
        {!hasError && isLoading && <Loader />}

        {// There are no DACs, show empty state
        !hasError && !isLoading && dacs.length === 0 && (
          <div>
            <div className="text-center">
              <p>There are no Decentralized Altruistic Communities (DACs) yet!</p>
              <img
                className="empty-state-img"
                src={`${process.env.PUBLIC_URL}/img/community.svg`}
                width="200px"
                height="200px"
                alt="no-dacs-icon"
              />
            </div>
          </div>
        )}
        {hasError && (
          <p>
            <strong>Oops, something went wrong...</strong> The Giveth dapp could not load any DACs
            for some reason. Please try refreshing the page...
          </p>
        )}
      </div>
    </div>
  );
};

DACs.propTypes = {
  step: PropTypes.number,
  onlyRecent: PropTypes.bool,
};

DACs.defaultProps = { step: 20, onlyRecent: false };

export default DACs;
