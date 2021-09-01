import React, { Fragment, useCallback, useContext, useEffect, useRef, useState } from 'react';

import ViewNetworkWarning from 'components/ViewNetworkWarning';
import { Context as Web3Context } from 'contextProviders/Web3Provider';
import config from 'configuration';
import { Helmet } from 'react-helmet';
import Loader from '../../Loader';
import { Context as UserContext } from '../../../contextProviders/UserProvider';
import AuthenticationWarning from '../../AuthenticationWarning';
import DelegationsTable from './DelegationsTable';
import Campaign from '../../../models/Campaign';
import Trace from '../../../models/Trace';
import ErrorHandler from '../../../lib/ErrorHandler';
import LoadProjectsInfo from './LoadProjectsInfo';
import GetDonations from './GetDonations';
import Web3ConnectWarning from '../../Web3ConnectWarning';

/**
 * The my delegations view
 */
const MyDelegations = () => {
  const {
    state: { isForeignNetwork },
  } = useContext(Web3Context);
  const {
    state: { currentUser },
  } = useContext(UserContext);

  const visiblePages = 10;
  const itemsPerPage = 20;
  const userAddress = currentUser.address;

  const donationSubscription = useRef();

  const [isLoading, setLoading] = useState(true);
  const [delegations, setDelegations] = useState([]);
  const [skipPages, setSkipPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [projectsInfo, setProjectsInfo] = useState();

  const fetchProjects = useCallback(
    () =>
      LoadProjectsInfo({ userAddress })
        .then(resArray => {
          const [{ data: communities }, { data: campaigns }, { data: traces }] = resArray;
          setProjectsInfo({
            communities,
            campaigns: campaigns.map(c => new Campaign(c)),
            traces: traces.map(m => new Trace(m)),
          });
        })
        .catch(err => {
          const message = `Unable to load communities, Campaigns or Traces. ${err}`;
          ErrorHandler(err, message);
          setLoading(false);
        }),
    [userAddress],
  );

  const fetchDonations = useCallback(() => {
    donationSubscription.current = GetDonations({
      userAddress,
      communities: projectsInfo.communities,
      campaigns: projectsInfo.campaigns,
      itemsPerPage,
      skipPages,
      onResult: resp => {
        setDelegations(resp.data);
        setTotalResults(resp.total);
        setLoading(false);
      },
      onError: err => {
        const message = `Error in fetching donations info. ${err}`;
        ErrorHandler(err, message);
        setLoading(false);
      },
      subscribe: true,
    });
  }, [userAddress, projectsInfo, itemsPerPage, skipPages]);

  const cleanup = () => {
    if (donationSubscription.current) {
      donationSubscription.current.unsubscribe();
      donationSubscription.current = undefined;
    }
  };

  useEffect(() => {
    if (userAddress) {
      setLoading(true);
      setSkipPages(0);
      fetchProjects().then();
    }
  }, [userAddress]);

  useEffect(() => {
    if (projectsInfo) {
      setLoading(true);
      fetchDonations();
    }
    return cleanup;
  }, [skipPages, projectsInfo]);

  const handlePageChanged = newPage => setSkipPages(newPage - 1);

  return (
    <Fragment>
      <Web3ConnectWarning />
      <Helmet>
        <title>My Delegations</title>
      </Helmet>
      <div className="container-fluid page-layout dashboard-table-view">
        <div className="row">
          <div className="col-md-10 m-auto">
            {(isLoading || (delegations && delegations.length > 0)) && <h1>My Delegations</h1>}

            <ViewNetworkWarning
              incorrectNetwork={!isForeignNetwork}
              networkName={config.foreignNetworkName}
            />

            <AuthenticationWarning />

            {isLoading && <Loader className="fixed" />}

            {!isLoading && (
              <DelegationsTable
                delegations={delegations}
                campaigns={projectsInfo.campaigns}
                traces={projectsInfo.traces}
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
    </Fragment>
  );
};

export default MyDelegations;
