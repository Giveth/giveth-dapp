import React, { Component } from 'react';
import BigNumber from 'bignumber.js';
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
import User from '../../models/User';
import DAC from '../../models/DAC';
import { getUserName, getUserAvatar, history } from '../../lib/helpers';
import DACService from '../../services/DACService';
import CampaignCard from '../CampaignCard';
import config from '../../configuration';
import NotFound from './NotFound';
import { checkBalance } from '../../lib/middleware';
import ErrorPopup from '../ErrorPopup';
import DescriptionRender from '../DescriptionRender';
import ErrorBoundary from '../ErrorBoundary';
import GoBackSection from '../GoBackSection';

/**
 * The DAC detail view mapped to /dacs/id
 *
 * @param currentUser  Currently logged in user information
 * @param history      Browser history object
 */

const helmetContext = {};

const { homeUrl } = config;

class ViewDAC extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      isLoadingDonations: true,
      isLoadingCampaigns: true,
      campaigns: [],
      aggregateDonations: [],
      donationsTotal: 0,
      donationsPerBatch: 5,
      newDonations: 0,
      notFound: false,
    };

    this.loadMoreAggregateDonations = this.loadMoreAggregateDonations.bind(this);
    this.editDAC = this.editDAC.bind(this);
  }

  componentDidMount() {
    const dacId = this.props.match.params.id;

    // Get the Campaign
    DACService.get(dacId)
      .then(dac => {
        this.setState({ dac, isLoading: false });

        this.campaignObserver = DACService.subscribeCampaigns(
          dac.delegateId,
          campaigns => this.setState({ campaigns, isLoadingCampaigns: false }),
          () => this.setState({ isLoadingCampaigns: false }), // TODO: inform user of error
        );
      })
      .catch(() => {
        this.setState({
          notFound: true,
        });
      });

    this.loadMoreAggregateDonations();
    // subscribe to donation count
    this.donationsObserver = DACService.subscribeNewDonations(
      dacId,
      newDonations =>
        this.setState({
          newDonations,
        }),
      () => this.setState({ newDonations: 0 }),
    );
  }

  componentWillUnmount() {
    if (this.donationsObserver) this.donationsObserver.unsubscribe();
    if (this.campaignObserver) this.campaignObserver.unsubscribe();
  }

  loadMoreAggregateDonations() {
    this.setState({ isLoadingDonations: true }, () =>
      AggregateDonationService.get(
        this.props.match.params.id,
        this.state.donationsPerBatch,
        this.state.aggregateDonations.length,
        (donations, donationsTotal) => {
          this.setState(prevState => ({
            aggregateDonations: prevState.aggregateDonations.concat(donations),
            isLoadingDonations: false,
            donationsTotal,
          }));
        },
        () => this.setState({ isLoadingDonations: false }),
      ),
    );
  }

  editDAC(id) {
    checkBalance(this.props.balance)
      .then(() => {
        history.push(`/dacs/${id}/edit`);
      })
      .catch(err => {
        if (err === 'noBalance') {
          ErrorPopup('There is no balance left on the account.', err);
        } else if (err !== undefined) {
          ErrorPopup('Something went wrong.', err);
        }
      });
  }

  renderDescription() {
    return DescriptionRender(this.state.dac.description);
  }

  render() {
    const { balance, currentUser } = this.props;
    const {
      isLoading,
      aggregateDonations,
      dac,
      isLoadingDonations,
      campaigns,
      isLoadingCampaigns,
      donationsTotal,
      newDonations,
      notFound,
    } = this.state;

    if (notFound) {
      return <NotFound projectType="DAC" />;
    }

    const userIsOwner =
      dac && dac.owner && currentUser && dac.owner.address === currentUser.address;

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

                  {/* Google / Search Engine Tags */}
                  <meta itemProp="name" content={dac.title} />
                  <meta itemProp="description" content={dac.description} />
                  <meta itemProp="image" content={dac.image} />

                  {/* Facebook Meta Tags */}
                  <meta property="og:url" content={`${homeUrl}/dacs/${dac.id}`} />
                  <meta property="og:type" content="website" />
                  <meta property="og:title" content={dac.title} />
                  <meta property="og:description" content={dac.description} />
                  <meta property="og:image" content={dac.image} />

                  {/* Twitter Meta Tags */}
                  <meta name="twitter:card" content="summary_large_image" />
                  <meta name="twitter:title" content={dac.title} />
                  <meta name="twitter:description" content={dac.description} />
                  <meta name="twitter:image" content={dac.image} />
                </Helmet>
                <BackgroundImageHeader
                  image={dac.image}
                  height={300}
                  adminId={dac.delegateId}
                  projectType="DAC"
                  editProject={userIsOwner && dac.isActive && (() => this.editDAC(dac.id))}
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
                        className="btn-lg px-5"
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
                          <div className="card-body content">{this.renderDescription()}</div>

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
                          loadMore={this.loadMoreAggregateDonations}
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
                        <Balances entity={dac} />
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
                          These Campaigns are working hard to solve the cause of this Community
                          (DAC)
                        </p>
                        {isLoadingCampaigns && <Loader className="small" />}

                        {campaigns.length > 0 && !isLoadingCampaigns && (
                          <div className="cards-grid-container">
                            {campaigns.map(c => (
                              <CampaignCard
                                key={c.id}
                                campaign={c}
                                history={history}
                                balance={balance}
                              />
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
  }
}

ViewDAC.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
  }).isRequired,
  currentUser: PropTypes.instanceOf(User),
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
    }).isRequired,
  }).isRequired,
  balance: PropTypes.instanceOf(BigNumber),
};

ViewDAC.defaultProps = {
  currentUser: undefined,
  balance: new BigNumber(0),
};

export default ViewDAC;
