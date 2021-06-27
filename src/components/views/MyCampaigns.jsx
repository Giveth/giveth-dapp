import React, { Fragment, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Pagination from 'react-js-pagination';

import ViewNetworkWarning from 'components/ViewNetworkWarning';
import { Context as Web3Context } from 'contextProviders/Web3Provider';
import config from 'configuration';
import { Helmet } from 'react-helmet';

import Loader from '../Loader';
import { convertEthHelper, getTruncatedText } from '../../lib/helpers';
import CampaignService from '../../services/CampaignService';
import Campaign from '../../models/Campaign';
import AuthenticationWarning from '../AuthenticationWarning';
import { Context as UserContext } from '../../contextProviders/UserProvider';
import CancelCampaignButton from '../CancelCampaignButton';
import EditCampaignButton from '../EditCampaignButton';

/**
 * The my campaings view
 */
function MyCampaigns() {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { isForeignNetwork },
  } = useContext(Web3Context);

  const [isLoading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState({});
  const [skipPages, setSkipPages] = useState();

  const visiblePages = 10;
  const itemsPerPage = 10;
  const userAddress = currentUser.address;

  const campaignsObserver = useRef();

  const cleanup = () => {
    if (campaignsObserver.current) campaignsObserver.current.unsubscribe();
  };

  const loadCampaigns = useCallback(
    skPages => {
      if (userAddress) {
        campaignsObserver.current = CampaignService.getUserCampaigns(
          userAddress,
          skPages || skipPages,
          itemsPerPage,
          cs => {
            setCampaigns(cs);
            setLoading(false);
          },
          () => setLoading(false),
          true,
        );
      }
    },
    [userAddress, skipPages],
  );

  useEffect(() => {
    if (userAddress) {
      setSkipPages(0);
      loadCampaigns(0);
    }

    return cleanup;
  }, [userAddress]);

  useEffect(() => {
    setLoading(true);
    loadCampaigns();

    return cleanup;
  }, [skipPages]);

  function handlePageChanged(newPage) {
    setSkipPages(newPage - 1);
  }

  const isPendingCampaign =
    (campaigns.data && campaigns.data.some(d => d.confirmations !== d.requiredConfirmations)) ||
    false;

  return (
    <Fragment>
      <Helmet>
        <title>My Campaigns</title>
      </Helmet>
      <div className="container-fluid page-layout dashboard-table-view">
        <div className="row">
          <div className="col-md-10 m-auto">
            {(isLoading || (campaigns && campaigns.data.length > 0)) && <h1>My Campaigns</h1>}

            <AuthenticationWarning />

            <ViewNetworkWarning
              incorrectNetwork={!isForeignNetwork}
              networkName={config.foreignNetworkName}
            />

            {isLoading && <Loader className="fixed" />}

            {!isLoading && (
              <div className="table-container dashboard-table-view">
                {campaigns && campaigns.data.length > 0 && (
                  <div>
                    <table className="table table-responsive table-striped table-hover">
                      <thead>
                        <tr>
                          {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                          <th className="td-actions" />
                          <th className="td-name">Name</th>
                          <th className="td-donations-number">Donations</th>
                          <th className="td-donations-amount">Amount</th>
                          <th className="td-status">Status</th>
                          <th className="td-confirmations">
                            {isPendingCampaign && 'Confirmations'}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaigns.data.map(c => (
                          <tr key={c.id} className={c.status === Campaign.PENDING ? 'pending' : ''}>
                            <td className="td-actions">
                              <EditCampaignButton campaign={c} />
                              <CancelCampaignButton campaign={c} />
                            </td>
                            <td className="td-name">
                              <Link to={`/campaign/${c.slug}`}>
                                {getTruncatedText(c.title, 45)}
                              </Link>
                              {c.reviewerAddress === userAddress && (
                                <span className="badge badge-info">
                                  <i className="fa fa-eye" />
                                  &nbsp;You&apos;re the Reviewer
                                </span>
                              )}
                            </td>
                            <td className="td-donations-number">
                              {c.donationCounters.length > 0 &&
                                c.donationCounters.map(counter => (
                                  <p key={`donation_count-${c.key}-${counter.symbol}`}>
                                    {counter.donationCount} donation(s) in {counter.symbol}
                                  </p>
                                ))}
                              {c.donationCounters.length === 0 && <span>-</span>}
                            </td>
                            <td className="td-donations-amount">
                              {c.donationCounters.length > 0 &&
                                c.donationCounters.map(counter => (
                                  <p key={`total_donated-${c.key}-${counter.symbol}`}>
                                    {convertEthHelper(counter.totalDonated, counter.decimals)}{' '}
                                    {counter.symbol}
                                  </p>
                                ))}
                              {c.donationCounters.length === 0 && <span>-</span>}
                            </td>
                            <td className="td-status">
                              {(c.status === Campaign.PENDING ||
                                (Object.keys(c).includes('mined') && !c.mined)) && (
                                <span>
                                  <i className="fa fa-circle-o-notch fa-spin" />
                                  &nbsp;
                                </span>
                              )}
                              {c.status}
                            </td>
                            <td className="td-confirmations">
                              {(isPendingCampaign || c.requiredConfirmations !== c.confirmations) &&
                                `${c.confirmations}/${c.requiredConfirmations}`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {campaigns.total > itemsPerPage && (
                      <div className="text-center">
                        <Pagination
                          activePage={skipPages + 1}
                          itemsCountPerPage={campaigns.limit}
                          totalItemsCount={campaigns.total}
                          pageRangeDisplayed={visiblePages}
                          onChange={handlePageChanged}
                        />
                      </div>
                    )}
                  </div>
                )}

                {campaigns && campaigns.data.length === 0 && (
                  <div>
                    <div className="text-center">
                      <h3>You haven&apos;t created any Campaigns yet!</h3>
                      <img
                        className="empty-state-img"
                        src={`${process.env.PUBLIC_URL}/img/campaign.svg`}
                        width="200px"
                        height="200px"
                        alt="no-campaigns-icon"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Fragment>
  );
}

export default MyCampaigns;
