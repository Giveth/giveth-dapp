import React, { Fragment, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Select, Grid, Button } from 'antd';

import ViewNetworkWarning from 'components/ViewNetworkWarning';
import { Context as Web3Context } from 'contextProviders/Web3Provider';
import config from 'configuration';
import Loader from '../../Loader';
import { Context as UserContext } from '../../../contextProviders/UserProvider';
import AuthenticationWarning from '../../AuthenticationWarning';
import DelegationsTable from './DelegationsTable';
import Campaign from '../../../models/Campaign';
import { Community } from '../../../models';
import ErrorHandler from '../../../lib/ErrorHandler';
import LoadProjectsInfo from './LoadProjectsInfo';
import GetDonations from './GetDonations';
import Web3ConnectWarning from '../../Web3ConnectWarning';

const { useBreakpoint } = Grid;

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

  const { xs } = useBreakpoint();

  const visiblePages = xs ? 6 : 10;
  const itemsPerPage = 20;
  const userAddress = currentUser.address;

  const donationSubscription = useRef();

  const entityTypes = [Community.type, Campaign.type, 'giver'];

  const [isLoading, setLoading] = useState(true);
  const [delegations, setDelegations] = useState([]);
  const [skipPages, setSkipPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [projectsInfo, setProjectsInfo] = useState({});
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  const communityOnly = selectedType === Community.type;
  const campaignOnly = selectedType === Campaign.type;
  const giverOnly = selectedType === 'giver';
  const entitiesToSelect = campaignOnly ? projectsInfo.campaigns : projectsInfo.communities;

  const cleanup = () => {
    if (donationSubscription.current) {
      donationSubscription.current.unsubscribe();
      donationSubscription.current = undefined;
    }
  };

  const handleSelectEntity = (e, isEntityType) => {
    if (isEntityType) {
      setSelectedType(e);
      setSelectedEntity(null);
    } else {
      setSelectedEntity(e);
    }
  };

  const fetchProjects = useCallback(
    () =>
      LoadProjectsInfo(userAddress)
        .then(resArray => {
          const [{ data: communities }, { data: campaigns }] = resArray;
          setProjectsInfo({
            communities,
            campaigns: campaigns.map(c => new Campaign(c)),
          });
        })
        .catch(err => {
          const message = `Unable to load Communities or Campaigns. ${err}`;
          ErrorHandler(err, message);
          setLoading(false);
        }),
    [userAddress],
  );

  const fetchDonations = useCallback(() => {
    cleanup();

    let communities;
    let campaigns;

    if (selectedType) {
      if (campaignOnly) {
        campaigns = selectedEntity ? [{ _id: selectedEntity }] : projectsInfo.campaigns;
      } else if (communityOnly) {
        communities = selectedEntity ? [{ _id: selectedEntity }] : projectsInfo.communities;
      }
    } else {
      communities = projectsInfo.communities;
      campaigns = projectsInfo.campaigns;
    }

    donationSubscription.current = GetDonations({
      userAddress,
      communities,
      campaigns,
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
  }, [userAddress, projectsInfo, skipPages, selectedEntity, selectedType]);

  const applyFilter = () => {
    setLoading(true);
    setSkipPages(0);
    fetchDonations();
  };

  useEffect(() => {
    if (userAddress) {
      setLoading(true);
      setSkipPages(0);
      fetchProjects().then();
    }
  }, [userAddress]);

  useEffect(() => {
    if (projectsInfo.campaigns) {
      setLoading(true);
      fetchDonations();
    }
    return () => cleanup();
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

            <br />

            <div className="d-flex align-items-center flex-wrap">
              <div className="font-weight-bold mr-3 mb-3" style={{ fontSize: '20px' }}>
                Filters:
              </div>

              <div>
                <Select
                  name="entityType"
                  placeholder="Select an entity type"
                  value={selectedType}
                  onSelect={e => handleSelectEntity(e, true)}
                  style={{ minWidth: '250px' }}
                  className="mr-3 mb-3"
                  allowClear
                  onClear={() => setSelectedType(null)}
                >
                  {entityTypes.map(item => (
                    <Select.Option value={item} key={item}>
                      {item}
                    </Select.Option>
                  ))}
                </Select>

                {selectedType && !giverOnly && (
                  <Select
                    name="selectedEntity"
                    placeholder={campaignOnly ? 'Select a Campaign' : 'Select a Community'}
                    value={selectedEntity}
                    onSelect={e => handleSelectEntity(e, false)}
                    style={{ minWidth: '250px' }}
                    allowClear
                    onClear={() => setSelectedEntity(null)}
                    className="mr-3 mb-3"
                  >
                    {entitiesToSelect.map(item => (
                      <Select.Option value={item._id} key={item._id}>
                        {item.title}
                      </Select.Option>
                    ))}
                  </Select>
                )}

                <Button type="primary" onClick={applyFilter}>
                  Apply Filter
                </Button>
              </div>
            </div>

            {!isLoading && (
              <DelegationsTable
                delegations={delegations}
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
