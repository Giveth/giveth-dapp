import React from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';

import User from 'models/User';
import MilestoneCard from '../MilestoneCard';
import MilestoneProvider, {
  Consumer as MilestoneConsumer,
} from '../../contextProviders/MilestoneProvider';
import Loader from '../Loader';

/**
 * The Milestones view mapped to /milestones
 */
const Milestones = ({ currentUser, balance }) => (
  <MilestoneProvider step={10}>
    <MilestoneConsumer>
      {({ state: { milestones, isLoading, total, hasError }, actions: { loadMore } }) => (
        <div id="milestones-view" className="card-view">
          <div className="container-fluid page-layout reduced-padding">
            <h4>Milestones {total > 0 && <span className="badge badge-success">{total}</span>}</h4>
            {!hasError && milestones.length > 0 && (
              <div>
                <p>
                  Here are a few of the latest Milestones. Help them realise their goals by giving
                  Ether or tokens!
                </p>
                <div className="cards-grid-container">
                  {milestones.map(milestone => (
                    <MilestoneCard
                      key={milestone.id}
                      milestone={milestone}
                      currentUser={currentUser}
                      balance={balance}
                    />
                  ))}
                </div>
                {milestones.length < total && (
                  <div className="text-center">
                    <button
                      type="button"
                      className="btn btn-info mt-2"
                      onClick={loadMore}
                      disabled={isLoading}
                    >
                      {isLoading && (
                        <span>
                          <i className="fa fa-circle-o-notch fa-spin" /> Loading
                        </span>
                      )}
                      {!isLoading && <span>Load More</span>}
                    </button>
                  </div>
                )}
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
                <strong>Oops, something went wrong...</strong> The Giveth dapp could not load
                Milestones for some reason. Please try refreshing the page...
              </p>
            )}
          </div>
        </div>
      )}
    </MilestoneConsumer>
  </MilestoneProvider>
);

Milestones.propTypes = {
  currentUser: PropTypes.instanceOf(User),
  balance: PropTypes.instanceOf(BigNumber),
};

Milestones.defaultProps = {
  currentUser: undefined,
  balance: new BigNumber(0),
};

export default Milestones;
