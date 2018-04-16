import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Avatar from 'react-avatar';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import ReactHtmlParser from 'react-html-parser';

import { feathersClient } from '../../lib/feathersClient';
import Loader from '../Loader';
import MilestoneCard from '../MilestoneCard';
import GoBackButton from '../GoBackButton';
import { isOwner, getUserName, getUserAvatar } from '../../lib/helpers';
import { checkWalletBalance } from '../../lib/middleware';
import BackgroundImageHeader from '../BackgroundImageHeader';
import DonateButton from '../DonateButton';
import ShowTypeDonations from '../ShowTypeDonations';
import AuthenticatedLink from '../AuthenticatedLink';

import User from '../../models/User';
import GivethWallet from '../../lib/blockchain/GivethWallet';
import CampaignService from '../../services/Campaign';

/**
 * The Campaign detail view mapped to /campaing/id
 *
 * @param currentUser  Currently logged in user information
 * @param history      Browser history object
 * @param wallet       Wallet object with the balance and all keystores
 */
class ViewCampaign extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      isLoadingMilestones: true,
      isLoadingDonations: true,
      donations: [],
      milestones: [],
    };
  }

  componentDidMount() {
    const campaignId = this.props.match.params.id;

    CampaignService.get(campaignId)
      .then(campaign => this.setState({ campaign, isLoading: false }))
      .catch(() => this.setState({ isLoading: false })); // TODO: inform user of error

    this.milestoneObserver = CampaignService.subscribeMilestones(
      campaignId,
      milestones =>
        this.setState({
          milestones,
          isLoadingMilestones: false,
        }),
      () => this.setState({ isLoadingMilestones: false }),
    );

    // Lazy load donations
    this.donationsObserver = CampaignService.subscribeDonations(
      campaignId,
      donations =>
        this.setState({
          donations,
          isLoadingDonations: false,
        }),
      () => this.setState({ isLoadingDonations: false }),
    );
  }

  componentWillUnmount() {
    this.donationsObserver.unsubscribe();
    this.milestoneObserver.unsubscribe();
  }

  removeMilestone(id) {
    checkWalletBalance(this.props.wallet).then(() => {
      React.swal({
        title: 'Delete Milestone?',
        text: 'You will not be able to recover this milestone!',
        icon: 'warning',
        dangerMode: true,
      }).then(() => {
        const milestones = feathersClient.service('/milestones');
        milestones.remove(id);
      });
    });
  }

  render() {
    const { history, currentUser, wallet } = this.props;
    const {
      isLoading,
      campaign,
      milestones,
      donations,
      isLoadingDonations,
      isLoadingMilestones,
    } = this.state;

    return (
      <div id="view-campaign-view">
        {isLoading && <Loader className="fixed" />}

        {!isLoading && (
          <div>
            <BackgroundImageHeader image={campaign.image} height={300}>
              <h6>Campaign</h6>
              <h1>{campaign.title}</h1>

              <DonateButton
                type="campaign"
                model={{
                  title: campaign.title,
                  id: campaign.id,
                  adminId: campaign.projectId,
                }}
                wallet={wallet}
                currentUser={currentUser}
                history={history}
              />
            </BackgroundImageHeader>

            <div className="container-fluid">
              <div className="row">
                <div className="col-md-8 m-auto">
                  <GoBackButton history={history} />

                  <center>
                    <Link to={`/profile/${campaign.owner.address}`}>
                      <Avatar size={50} src={getUserAvatar(campaign.owner)} round />
                      <p className="small">{getUserName(campaign.owner)}</p>
                    </Link>
                  </center>

                  <div className="card content-card ">
                    <div className="card-body content">{ReactHtmlParser(campaign.description)}</div>
                  </div>

                  <div className="milestone-header spacer-top-50 card-view">
                    <h3>Milestones</h3>
                    {isOwner(campaign.owner.address, currentUser) && (
                      <AuthenticatedLink
                        className="btn btn-primary btn-sm pull-right"
                        to={`/campaigns/${campaign.id}/milestones/new`}
                        wallet={wallet}
                      >
                        Add Milestone
                      </AuthenticatedLink>
                    )}

                    {!isOwner(campaign.owner.address, currentUser) &&
                      currentUser && (
                        <AuthenticatedLink
                          className="btn btn-primary btn-sm pull-right"
                          to={`/campaigns/${campaign.id}/milestones/propose`}
                          wallet={wallet}
                        >
                          Propose Milestone
                        </AuthenticatedLink>
                      )}

                    {isLoadingMilestones && <Loader className="relative" />}
                    <ResponsiveMasonry
                      columnsCountBreakPoints={{
                        0: 1,
                        470: 2,
                        900: 3,
                        1200: 4,
                      }}
                    >
                      <Masonry gutter="10px">
                        {milestones.map(m => (
                          <MilestoneCard
                            milestone={m}
                            currentUser={currentUser}
                            key={m._id} // eslint-disable-line no-underscore-dangle
                            history={history}
                            wallet={wallet}
                            // eslint-disable-next-line no-underscore-dangle
                            removeMilestone={() => this.removeMilestone(m._id)}
                          />
                        ))}
                      </Masonry>
                    </ResponsiveMasonry>
                  </div>
                </div>
              </div>

              <div className="row spacer-top-50 spacer-bottom-50">
                <div className="col-md-8 m-auto">
                  <h4>Donations</h4>
                  <ShowTypeDonations donations={donations} isLoading={isLoadingDonations} />
                  <DonateButton
                    type="campaign"
                    model={{
                      title: campaign.title,
                      id: campaign.id,
                      adminId: campaign.projectId,
                    }}
                    wallet={wallet}
                    currentUser={currentUser}
                    history={history}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

ViewCampaign.propTypes = {
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
  wallet: PropTypes.instanceOf(GivethWallet),
};

ViewCampaign.defaultProps = {
  currentUser: undefined,
  wallet: undefined,
};

export default ViewCampaign;
