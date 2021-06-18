import React, { useCallback, useContext, useEffect, useState } from 'react';

import ViewNetworkWarning from 'components/ViewNetworkWarning';
import { Context as Web3Context } from 'contextProviders/Web3Provider';
import config from 'configuration';
import Loader from '../../Loader';
import { Context as UserContext } from '../../../contextProviders/UserProvider';
import AuthenticationWarning from '../../AuthenticationWarning';
import DelegationsTable from './DelegationsTable';
import Campaign from '../../../models/Campaign';
import Trace from '../../../models/Trace';
import ErrorHandler from '../../../lib/ErrorHandler';
import LoadProjectsInfo from './LoadProjectsInfo';
import GetDonations from './GetDonations';
import GetDonationsService from '../../../services/GetDonationsService';

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

  const [isLoading, setLoading] = useState(true);
  const [delegations, setDelegations] = useState([]);
  const [skipPages, setSkipPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [projectsInfo, setProjectsInfo] = useState();

  const fetchProjects = useCallback(
    () =>
      LoadProjectsInfo({ userAddress })
        .then(resArray => {
          setProjectsInfo({
            communities: resArray[0].data,
            campaigns: resArray[1].data.map(c => new Campaign(c)),
            traces: resArray[2].data.map(m => new Trace(m)),
          });
        })
        .catch(err => {
          const message = `Unable to load communities, Campaigns or Traces. ${err}`;
          ErrorHandler(err, message);
          setLoading(false);
        }),
    [userAddress],
  );

  const fetchDonations = useCallback(
    () =>
      GetDonations({
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
      }),
    [userAddress, projectsInfo, itemsPerPage, skipPages],
  );

  const cleanup = () => GetDonationsService.unsubscribe();

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
      fetchDonations().then();
    }
    return cleanup;
  }, [skipPages, projectsInfo]);

  const handlePageChanged = newPage => setSkipPages(newPage - 1);

  return (
    <div className="container-fluid page-layout dashboard-table-view">
      <div className="row">
        <div className="col-md-10 m-auto">
          {(isLoading || (delegations && delegations.length > 0)) && <h1>My delegations</h1>}

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
  );
};

export default MyDelegations;
