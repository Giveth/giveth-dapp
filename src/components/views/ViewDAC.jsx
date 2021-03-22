import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { Link } from 'react-router-dom';
import Avatar from 'react-avatar';

import Balances from 'components/Balances';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Loader from '../Loader';
import BackgroundImageHeader from '../BackgroundImageHeader';
import DonateButton from '../DonateButton';
import AggregateDonationService from '../../services/AggregateDonationService';
import LeaderBoard from '../LeaderBoard';
import CommunityButton from '../CommunityButton';
import DAC from '../../models/DAC';
import ProjectSubscription from '../ProjectSubscription';
import { getUserName, getUserAvatar, history } from '../../lib/helpers';
import DACService from '../../services/DACService';
import CampaignService from '../../services/CampaignService';
import CampaignCard from '../CampaignCard';
import config from '../../configuration';
import NotFound from './NotFound';
import { checkBalance } from '../../lib/middleware';
import ErrorPopup from '../ErrorPopup';
import DescriptionRender from '../DescriptionRender';
import ErrorBoundary from '../ErrorBoundary';
import GoBackSection from '../GoBackSection';
import ErrorHandler from '../../lib/ErrorHandler';
import { Context as Web3Context } from '../../contextProviders/Web3Provider';
import { Context as UserContext } from '../../contextProviders/UserProvider';

/**
 * The DAC detail view mapped to /dacs/id
 *
 * @param currentUser  Currently logged in user information
 * @param history      Browser history object
 */

const helmetContext = {};
let currentDac = null;

const ViewDAC = ({ match }) => {
  const {
    state: { balance },
  } = useContext(Web3Context);
  const {
    state: { currentUser },
  } = useContext(UserContext);

  const [dac, setDac] = useState();
  const [isLoading, setLoading] = useState(true);
  const [isLoadingDonations, setLoadingDonations] = useState(true);
  const [isLoadingCampaigns, setLoadingCampaigns] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [aggregateDonations, setAggregateDonations] = useState([]);
  const [donations, setDonations] = useState([]);
  const [donationsTotal, setDonationsTotal] = useState(0);
  const [newDonations, setNewDonations] = useState(0);
  const [notFound, setNotFound] = useState(false);

  let lastDonation = {};
  let donationsObserver;
  let campaignObserver;

  const donationsPerBatch = 5;

  const cleanUp = () => {
    if (donationsObserver) donationsObserver.unsubscribe();
    if (campaignObserver) campaignObserver.unsubscribe();
  };

  const loadMoreAggregateDonations = () => {
    setLoadingDonations(true);
    AggregateDonationService.get(
      currentDac.id,
      donationsPerBatch,
      aggregateDonations.length,
      (_donations, _donationsTotal) => {
        setAggregateDonations(aggregateDonations.concat(_donations));
        setDonationsTotal(_donationsTotal);
        setLoadingDonations(false);
      },
      err => {
        setLoadingDonations(false);
        ErrorHandler(err, 'Some error on fetching loading donations, please try again later');
      },
    );
  };

  const loadNewAggregateDonations = () => {
    setLoadingDonations(true);
    AggregateDonationService.get(
      currentDac.id,
      donationsPerBatch,
      0,
      (_donations, _donationsTotal) => {
        setAggregateDonations(_donations);
        setDonationsTotal(_donationsTotal || 0);
        setLoadingDonations(false);
      },
      err => {
        setLoadingDonations(false);
        ErrorHandler(err, 'Some error on fetching DAC donations, please try later');
      },
    );
  };

  const { id, slug } = match.params;
  const getFunction = slug
    ? DACService.getBySlug.bind(DACService, slug)
    : DACService.get.bind(DACService, id);

  const updateLeaderboard = () => {
    loadNewAggregateDonations();
    getFunction()
      .then(async _dac => {
        setDac(_dac);
      })
      .catch(() => {
        setNotFound(true);
      });
  };

  const loadDonations = dacId => {
    if (dacId) {
      DACService.getDonations(
        dacId,
        donationsPerBatch,
        0,
        (_donations, _donationsTotal) => {
          const allDonations = [..._donations, ...donations];
          setDonations(allDonations);
          const BreakException = {};
          try {
            allDonations.forEach(item => {
              if (item._status === 'Waiting') {
                if (lastDonation && new Date(lastDonation._createdAt) < new Date(item._createdAt)) {
                  updateLeaderboard();
                }
                lastDonation = { ...item };
                throw BreakException;
              }
            });
          } catch (e) {
            if (e !== BreakException) throw e;
          }
        },
        err => {
          ErrorHandler(err, 'Some error on fetching campaign donations, please try later');
        },
        donations.length ? donations[0]._createdAt : undefined,
      );
    }
  };

  useEffect(() => {
    // Get the DAC
    getFunction()
      .then(async _dac => {
        if (id) {
          history.push(`/dac/${_dac.slug}`);
        }
        setDac(_dac);
        currentDac = _dac;
        setLoading(false);
        const relatedCampaigns = await CampaignService.getCampaignsByIdArray(_dac.campaigns || []);
        setCampaigns(relatedCampaigns);
        setLoadingCampaigns(false);
        donationsObserver = DACService.subscribeNewDonations(
          _dac.id,
          _newDonations => {
            setNewDonations(_newDonations);
            loadDonations(_dac.id);
          },
          err => {
            ErrorHandler(err, 'Some error on fetching dac donations, please try again later');
            setNewDonations(0);
          },
        );
        loadMoreAggregateDonations();
      })
      .catch(err => {
        setNotFound(true);
        ErrorHandler(err, 'Some error on fetching dac info, please try again later');
      });
    return cleanUp;
  }, []);

  const editDAC = dacId => {
    checkBalance(balance)
      .then(() => {
        history.push(`/dacs/${dacId}/edit`);
      })
      .catch(err => {
        if (err === 'noBalance') {
          ErrorPopup('There is no balance left on the account.', err);
        } else if (err !== undefined) {
          ErrorPopup('Something went wrong.', err);
        }
      });
  };

  const renderDescription = () => {
    return DescriptionRender(dac.description);
  };

  if (notFound) {
    return <NotFound projectType="DAC" />;
  }

  const userIsOwner = dac && dac.owner && dac.owner.address === currentUser.address;

  const campaignsTitle = `Campaigns${campaigns.length ? ` (${campaigns.length})` : ''}`;
  const leaderBoardTitle = `Leaderboard${donationsTotal ? ` (${donationsTotal})` : ''}`;

  const goBackSectionLinks = [
    { title: 'About', inPageId: 'description' },
    {
      title: leaderBoardTitle,
      inPageId: 'donations',
    },
    { title: 'Funding', inPageId: 'funding' },
    {
      title: campaignsTitle,
      inPageId: 'campaigns',
    },
  ];
  return (
    <HelmetProvider context={helmetContext}>
      <ErrorBoundary>
        <div id="view-cause-view">
          {isLoading && <Loader className="fixed" />}

          {!isLoading && (
            <div>
              <Helmet>
                <title>{dac.title}</title>
              </Helmet>
              <BackgroundImageHeader
                image={dac.image}
                height={300}
                adminId={dac.delegateId}
                projectType="DAC"
                editProject={userIsOwner && dac.isActive && (() => editDAC(dac.id))}
              >
                <h6>Decentralized Altruistic Community</h6>
                <h1>{dac.title}</h1>

                {dac.isActive && (
                  <div className="mt-4">
                    <DonateButton
                      model={{
                        type: DAC.type,
                        title: dac.title,
                        id: dac.id,
                        token: { symbol: config.nativeTokenName },
                        adminId: dac.delegateId,
                      }}
                      currentUser={currentUser}
                      history={history}
                      autoPopup
                      className="header-donate"
                    />
                  </div>
                )}
              </BackgroundImageHeader>

              <GoBackSection
                backUrl="/dacs"
                backButtonTitle="Communities"
                projectTitle={dac.title}
                inPageLinks={goBackSectionLinks}
              />

              <div className="container-fluid mt-4">
                <div className="row">
                  <div className="col-md-8 m-auto">
                    <div id="description">
                      <div>
                        <h5 className="title">Subscribe to updates </h5>
                        <ProjectSubscription projectTypeId={dac._id} projectType="dac" />
                      </div>
                      <div className="about-section-header">
                        <h5 className="title">About</h5>
                        <div className="text-center">
                          <Link to={`/profile/${dac.owner.address}`}>
                            <Avatar size={50} src={getUserAvatar(dac.owner)} round />
                            <p className="small">{getUserName(dac.owner)}</p>
                          </Link>
                        </div>
                      </div>

                      <div className="card content-card">
                        <div className="card-body content">{renderDescription()}</div>

                        {dac.communityUrl && (
                          <div className="pl-3 pb-4">
                            <CommunityButton className="btn btn-secondary" url={dac.communityUrl}>
                              Join our Community
                            </CommunityButton>
                          </div>
                        )}
                      </div>
                    </div>

                    <div id="donations" className="spacer-top-50">
                      <div className="section-header">
                        <h5>{leaderBoardTitle}</h5>
                        {dac.isActive && (
                          <DonateButton
                            model={{
                              type: DAC.type,
                              title: dac.title,
                              id: dac.id,
                              token: { symbol: config.nativeTokenName },
                              adminId: dac.delegateId,
                            }}
                            currentUser={currentUser}
                            history={history}
                          />
                        )}
                      </div>

                      <LeaderBoard
                        aggregateDonations={aggregateDonations}
                        isLoading={isLoadingDonations}
                        total={donationsTotal}
                        loadMore={loadMoreAggregateDonations}
                        newDonations={newDonations}
                      />
                    </div>

                    <div id="funding" className="spacer-top-50">
                      <div className="section-header">
                        <h5>Funding</h5>
                        {dac.isActive && (
                          <DonateButton
                            model={{
                              type: DAC.type,
                              title: dac.title,
                              id: dac.id,
                              token: { symbol: config.nativeTokenName },
                              adminId: dac.delegateId,
                            }}
                            currentUser={currentUser}
                            history={history}
                          />
                        )}
                      </div>
                      <Balances entity={dac} currentUser={currentUser} />
                    </div>

                    <div id="campaigns" className="spacer-top-50 spacer-bottom-50">
                      <div className="section-header">
                        <h5>{campaignsTitle}</h5>
                        {dac.isActive && (
                          <DonateButton
                            model={{
                              type: DAC.type,
                              title: dac.title,
                              id: dac.id,
                              token: { symbol: config.nativeTokenName },
                              adminId: dac.delegateId,
                            }}
                            currentUser={currentUser}
                            history={history}
                          />
                        )}
                      </div>
                      <p>
                        These Campaigns are working hard to solve the cause of this Community (DAC)
                      </p>
                      {isLoadingCampaigns && <Loader className="small" />}

                      {campaigns.length > 0 && !isLoadingCampaigns && (
                        <div className="cards-grid-container">
                          {campaigns.map(c => (
                            <CampaignCard key={c.id} campaign={c} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ErrorBoundary>
    </HelmetProvider>
  );
};

ViewDAC.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
      slug: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

export default ViewDAC;
