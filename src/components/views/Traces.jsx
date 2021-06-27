import React, { useEffect, useRef, useState } from 'react';

import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import TraceCard from '../TraceCard';
import Loader from '../Loader';
import LoadMore from '../LoadMore';
import TraceService from '../../services/TraceService';

/**
 * The Traces view mapped to /traces
 */
const Traces = ({ step }) => {
  const [traces, setTraces] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [hasError, setHasError] = useState(false);
  const isMounted = useRef(false);

  const loadMore = (init = false) => {
    if (init || (!isLoading && isMounted.current && total > traces.length)) {
      setLoading(true);
      TraceService.getActiveTraces(
        step, // Limit
        traces.length, // Skip
        (_traces, _total) => {
          if (!isMounted.current) return;
          setTraces(traces.concat(_traces));
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
    <div className="container">
      <div id="traces-view" className="card-view">
        <div className="container-fluid page-layout reduced-padding">
          <h4>Traces {total > 0 && <span className="badge badge-success">{total}</span>}</h4>
          {!hasError && traces.length > 0 && (
            <div>
              <p>Requests for funding from a Campaign or its members.</p>
              <div className="cards-grid-container">
                {traces.map(trace => (
                  <TraceCard key={trace.id} trace={trace} />
                ))}
              </div>
              {traces.length < total && <LoadMore onClick={loadMore} disabled={isLoading} />}
            </div>
          )}

          {!hasError && isLoading && <Loader />}

          {// There are no Traces, show empty state
          !hasError && !isLoading && traces.length === 0 && (
            <div>
              <div className="text-center">
                <p>There are no Traces yet!</p>
                <img
                  className="empty-state-img"
                  src={`${process.env.PUBLIC_URL}/img/trace.svg`}
                  width="200px"
                  height="200px"
                  alt="no-traces-icon"
                />
              </div>
            </div>
          )}
          {hasError && (
            <p>
              <strong>Oops, something went wrong...</strong> The Giveth dapp could not load Traces
              for some reason. Please try refreshing the page...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

Traces.propTypes = {
  step: PropTypes.number,
};

Traces.defaultProps = { step: 20 };

export default Traces;

export const TracesExplore = props => {
  return (
    <div>
      <Helmet>
        <title>Traces</title>
      </Helmet>
      <Traces {...props} />
    </div>
  );
};
