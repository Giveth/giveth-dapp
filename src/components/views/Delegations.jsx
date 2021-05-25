import React, { useCallback, useContext, useEffect, useState } from 'react';

import ViewNetworkWarning from 'components/ViewNetworkWarning';
import { Context as Web3Context } from 'contextProviders/Web3Provider';
import config from 'configuration';

import { paramsForServer } from 'feathers-hooks-common';
import Loader from '../Loader';

import { Context as UserContext } from '../../contextProviders/UserProvider';
import AuthenticationWarning from '../AuthenticationWarning';
import DelegationsTable from '../DelegationsTable';
import { feathersClient } from '../../lib/feathersClient';
import Community from '../../models/Community';
import Campaign from '../../models/Campaign';
import Trace from '../../models/Trace';
import ErrorHandler from '../../lib/ErrorHandler';
import Donation from '../../models/Donation';

/**
 * The my delegations view
 */
const Delegations = () => {
  const {
    state: { isForeignNetwork },
  } = useContext(Web3Context);
  const {
    state: { currentUser },
  } = useContext(UserContext);

  const visiblePages = 10;
  const itemsPerPage = 50;

  const [isLoading, setLoading] = useState(true);
  const [delegations, setDelegations] = useState([]);
  const [campaigns, setCampaigns] = useState(undefined);
  const [traces, setTraces] = useState(undefined);
  const [communities, setCommunities] = useState(undefined);
  const [skipPages, setSkipPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);

  const loadProjectsInfo = () => {
    return Promise.all([
      // Fetch Communities
      feathersClient
        .service('communities')
        .find({
          query: {
            status: Community.ACTIVE,
            ownerAddress: currentUser.address,
            $select: ['ownerAddress', 'title', '_id', 'delegateId'],
            $limit: 100,
            $sort: {
              createdAt: -1,
            },
          },
        })
        .then(resp =>
          setCommunities(
            resp.data.map(d => {
              d.type = Community.type;
              d.name = d.title;
              d.id = d._id;
              d.element = (
                <span>
                  {d.title} <em>Community</em>
                </span>
              );
              return d;
            }),
          ),
        ),

      // Fetch Campaigns
      feathersClient
        .service('campaigns')
        .find({
          query: {
            status: Campaign.ACTIVE,
            ownerAddress: currentUser.address,
            $select: ['ownerAddress', 'title', '_id', 'projectId'],
            $limit: 100,
            $sort: {
              createdAt: -1,
            },
          },
        })
        .then(resp => {
          setCampaigns(resp.data.map(c => new Campaign(c)));
        }),

      // Fetch Traces
      feathersClient
        .service('traces')
        .find({
          query: {
            status: Trace.IN_PROGRESS,
            fullyFunded: { $ne: true },
            $select: [
              'title',
              '_id',
              'projectId',
              'campaignId',
              'maxAmount',
              'status',
              'tokenAddress',
              'donationCounters',
            ],
            $limit: 100,
            $sort: {
              createdAt: -1,
            },
          },
        })
        .then(resp => setTraces(resp.data.map(m => new Trace(m)))),
    ]);
  };

  useEffect(() => {
    if (currentUser.address) {
      loadProjectsInfo()
        .then(() => {})
        .catch(err => {
          const message = `Unable to load communities, Campaigns or Traces. ${err}`;
          ErrorHandler(err, message);
          setLoading(false);
        });
    }
  }, [currentUser]);

  const getDonations = () => {
    // here we get all the ids.
    // TODO: less overhead here if we move it all to a single service.
    // NOTE: This will not rerun, meaning after any dac/campaign/trace is added

    if (currentUser.address) {
      const communitiesIds = communities
        .filter(c => c.ownerAddress === currentUser.address)
        .map(c => c._id);

      const campaignIds = campaigns
        .filter(c => c.ownerAddress === currentUser.address)
        .map(c => c._id);

      const query = paramsForServer({
        query: {
          lessThanCutoff: { $ne: true },
          $or: [
            { ownerTypeId: { $in: campaignIds }, status: Donation.COMMITTED },
            {
              delegateTypeId: { $in: communitiesIds },
              status: { $in: [Donation.WAITING, Donation.TO_APPROVE] },
            },
            {
              ownerTypeId: currentUser.address,
              delegateId: { $exists: false },
              status: Donation.WAITING,
            },
            // {
            // ownerTypeId: this.props.currentUser.address,
            // delegateTypeId: { $gt: 0 },
            // },
          ],
          $sort: { createdAt: 1 },
          $limit: itemsPerPage,
          $skip: skipPages * itemsPerPage,
        },
        schema: 'includeTypeAndGiverDetails',
      });

      feathersClient
        .service('donations')
        .find(query)
        .then(resp => {
          setDelegations(resp.data.map(d => new Donation(d)));
          setSkipPages(resp.skip / itemsPerPage);
          setTotalResults(resp.total);
          setLoading(false);
        })
        .catch(err => {
          const message = `Error in fetching donations info. ${err}`;
          ErrorHandler(err, message);
          setLoading(false);
        });
    }
  };

  useEffect(() => {
    if (!!communities && !!traces && !!campaigns) {
      getDonations();
    }
  }, [skipPages, communities, traces, campaigns]);

  const handlePageChanged = useCallback(newPage => {
    setSkipPages(newPage - 1);
  });

  return (
    <div id="delegations-view">
      <div className="container-fluid page-layout">
        <div className="row">
          <div className="col-md-10 m-auto">
            {(isLoading || (delegations && delegations.length > 0)) && <h1>Your delegations</h1>}

            <ViewNetworkWarning
              incorrectNetwork={!isForeignNetwork}
              networkName={config.foreignNetworkName}
            />

            <AuthenticationWarning />

            {isLoading && <Loader className="fixed" />}

            {!isLoading && (
              <DelegationsTable
                delegations={delegations}
                campaigns={campaigns}
                traces={traces}
                totalResults={totalResults}
                itemsPerPage={itemsPerPage}
                skipPages={skipPages}
                pageRangeDisplayed={visiblePages}
                handlePageChanged={handlePageChanged}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Delegations;
