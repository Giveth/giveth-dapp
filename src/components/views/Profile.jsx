import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Avatar from 'react-avatar';
import Pagination from 'react-js-pagination';
import { Link } from 'react-router-dom';
import moment from 'moment';

import { feathersClient } from '../../lib/feathersClient';
import getNetwork from '../../lib/blockchain/getNetwork';
import GoBackButton from '../GoBackButton';
import Loader from '../Loader';
import {
  getUserName,
  getUserAvatar,
  getTruncatedText,
  getReadableStatus,
  convertEthHelper,
} from '../../lib/helpers';

import DACservice from '../../services/DAC';
import CampaignService from '../../services/Campaign';
import Campaign from '../../models/Campaign';
import DAC from '../../models/DAC';

const reviewDue = updatedAt =>
  moment()
    .subtract(3, 'd')
    .isAfter(moment(updatedAt));

/**
 * The user profile view mapped to /profile/{userAddress}
 *
 * @param history      Browser history object
 * @param wallet       Wallet object with the balance and all keystores
 */
class Profile extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      hasError: false,
      etherScanUrl: '',
      userAddress: '',
      isLoadingDacs: true,
      dacs: null,
      isLoadingCampaigns: true,
      campaigns: null,
      isLoadingMilestones: true,
      milestones: null,
      visiblePages: 10,
      itemsPerPage: 25,
      skipMilestonePages: 0,
      skipCampaignPages: 0,
      skipDacPages: 0,
    };

    getNetwork().then(network => {
      this.setState({
        etherScanUrl: network.etherscan,
      });
    });

    this.loadUserMilestones = this.loadUserMilestones.bind(this);
    this.loadUserCampaigns = this.loadUserCampaigns.bind(this);
    this.loadUserDacs = this.loadUserDacs.bind(this);
    this.handleMilestonePageChanged = this.handleMilestonePageChanged.bind(this);
    this.handleCampaignsPageChanged = this.handleCampaignsPageChanged.bind(this);
    this.handleDacPageChanged = this.handleDacPageChanged.bind(this);
  }

  componentDidMount() {
    const { userAddress } = this.props.match.params;

    feathersClient
      .service('users')
      .find({ query: { address: userAddress } })
      .then(resp => {
        this.setState(
          Object.assign(
            {},
            {
              address: userAddress,
            },
            resp.data[0],
            {
              isLoading: false,
              hasError: false,
            },
          ),
        );

        this.loadUserCampaigns(userAddress);
        this.loadUserMilestones(userAddress);
        this.loadUserDacs(userAddress);
      })
      .catch(() =>
        this.setState({
          address: userAddress,
          isLoading: false,
          hasError: true,
        }),
      );
  }

  componentWillUnmount() {
    if (this.dacsObserver) this.dacsObserver.unsubscribe();
    if (this.campaignsObserver) this.campaignsObserver.unsubscribe();
    if (this.milestonesObserver) this.milestonesObserver.unsubscribe();
  }

  loadUserMilestones(userAddress = this.props.match.params.userAddress) {
    this.milestonesObserver = feathersClient
      .service('milestones')
      .watch({ listStrategy: 'always' })
      .find({
        $sort: {
          createdAt: -1,
        },
        $limit: this.state.itemsPerPage,
        $skip: this.state.skipMilestonePages * this.state.itemsPerPage,
        $or: [
          { ownerAddress: userAddress },
          { reviewerAddress: userAddress },
          { recipientAddress: userAddress },
        ],
      })
      .subscribe(resp =>
        this.setState({
          milestones: resp,
          isLoadingMilestones: false,
        }),
      );
  }

  loadUserCampaigns(userAddress = this.props.match.params.userAddress) {
    this.campaignsObserver = CampaignService.getUserCampaigns(
      userAddress,
      this.state.skipCampaignPages,
      this.state.itemsPerPage,
      campaigns => this.setState({ campaigns, isLoadingCampaigns: false }),
      () => this.setState({ isLoadingCampaigns: false }),
    );
  }

  loadUserDacs(userAddress = this.props.match.params.userAddress) {
    this.dacsObserver = DACservice.getUserDACs(
      userAddress,
      this.state.skipDacPages,
      this.state.itemsPerPage,
      dacs => this.setState({ dacs, isLoadingDacs: false }),
      () => this.setState({ isLoadingDacs: false }),
    );
  }

  handleMilestonePageChanged(newPage) {
    this.setState({ skipMilestonePages: newPage - 1 }, () => this.loadUserMilestones());
  }

  handleCampaignsPageChanged(newPage) {
    this.setState({ skipCampaignPages: newPage - 1 }, () => this.loadUserCampaigns());
  }

  handleDacPageChanged(newPage) {
    this.setState({ skipDacPages: newPage - 1 }, () => this.loadUserDacs());
  }

  render() {
    const { history } = this.props;
    const {
      isLoading,
      hasError,
      avatar,
      name,
      address,
      email,
      linkedIn,
      etherScanUrl,
      isLoadingDacs,
      isLoadingCampaigns,
      isLoadingMilestones,
      dacs,
      campaigns,
      milestones,
      visiblePages,
      userAddress,
    } = this.state;
    const user = {
      name,
      avatar,
    };

    return (
      <div id="profile-view">
        <div className="container-fluid page-layout dashboard-table-view">
          <div className="row">
            <div className="col-md-8 m-auto">
              {isLoading && <Loader className="fixed" />}

              {!isLoading &&
                !hasError && (
                  <div>
                    <GoBackButton history={history} />

                    <center>
                      <Avatar size={100} src={getUserAvatar(user)} round />
                      <h1>{getUserName(user)}</h1>
                      {etherScanUrl && (
                        <p>
                          <a href={`${etherScanUrl}address/${address}`}>{address}</a>
                        </p>
                      )}
                      {!etherScanUrl && <p>{address}</p>}
                      <p>{email}</p>
                      <p>{linkedIn}</p>
                    </center>
                  </div>
                )}

              <h4>Milestones</h4>
              <div>
                {isLoadingMilestones && <Loader />}

                {!isLoadingMilestones && (
                  <div className="table-container">
                    {milestones &&
                      milestones.data.length > 0 && (
                        <div>
                          <table className="table table-responsive table-striped table-hover">
                            <thead>
                              <tr>
                                <th className="td-created-at">Created</th>
                                <th className="td-name">Name</th>
                                <th className="td-status">Status</th>
                                <th className="td-donations-number">Requested</th>
                                <th className="td-donations-number">Donations</th>
                                <th className="td-donations-amount">Donated</th>
                                <th className="td-reviewer">Reviewer</th>
                              </tr>
                            </thead>
                            <tbody>
                              {milestones.data.map(m => (
                                <tr key={m._id} className={m.status === 'pending' ? 'pending' : ''}>
                                  <td className="td-created-at">
                                    {m.createdAt && (
                                      <span>{moment.utc(m.createdAt).format('Do MMM YYYY')}</span>
                                    )}
                                  </td>
                                  <td className="td-name">
                                    <strong>
                                      <Link to={`/campaigns/${m.campaign._id}/milestones/${m._id}`}>
                                        MILESTONE <em>{getTruncatedText(m.title, 35)}</em>
                                      </Link>
                                    </strong>
                                    <br />
                                    <i className="fa fa-arrow-right" />
                                    <Link
                                      className="secondary-link"
                                      to={`/campaigns/${m.campaign._id}`}
                                    >
                                      CAMPAIGN <em>{getTruncatedText(m.campaign.title, 40)}</em>
                                    </Link>
                                  </td>
                                  <td className="td-status">
                                    {(m.status === 'pending' ||
                                      (Object.keys(m).includes('mined') && !m.mined)) && (
                                      <span>
                                        <i className="fa fa-circle-o-notch fa-spin" />&nbsp;
                                      </span>
                                    )}
                                    {m.status === 'NeedsReview' &&
                                      reviewDue(m.updatedAt) && (
                                        <span>
                                          <i className="fa fa-exclamation-triangle" />&nbsp;
                                        </span>
                                      )}
                                    {getReadableStatus(m.status)}
                                  </td>
                                  <td className="td-donations-number">
                                    {convertEthHelper(m.maxAmount)} ETH
                                  </td>
                                  <td className="td-donations-number">{m.donationCount || 0}</td>
                                  <td className="td-donations-amount">
                                    {convertEthHelper(m.totalDonated)} ETH
                                  </td>
                                  <td className="td-reviewer">
                                    {m.reviewer &&
                                      m.reviewer.address && (
                                        <Link to={`/profile/${m.reviewer.address}`}>
                                          {m.reviewer.name || 'Anomynous user'}
                                        </Link>
                                      )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {milestones.total > milestones.limit && (
                            <center>
                              <Pagination
                                activePage={milestones.skipPages + 1}
                                itemsCountPerPage={milestones.limit}
                                totalItemsCount={milestones.total}
                                pageRangeDisplayed={visiblePages}
                                onChange={this.handleMilestonePageChanged}
                              />
                            </center>
                          )}
                        </div>
                      )}

                    {milestones &&
                      milestones.data.length === 0 && (
                        <div className="no-results">
                          <center>
                            <h3>This user didn&apos;t create any milestones here!</h3>
                            <img
                              className="empty-state-img"
                              src={`${process.env.PUBLIC_URL}/img/delegation.svg`}
                              width="200px"
                              height="200px"
                              alt="no-milestones-icon"
                            />
                          </center>
                        </div>
                      )}
                  </div>
                )}
              </div>

              <h4>Campaigns</h4>
              <div>
                {isLoadingCampaigns && <Loader />}

                {!isLoadingCampaigns && (
                  <div className="table-container">
                    {campaigns &&
                      campaigns.data.length > 0 && (
                        <div>
                          <table className="table table-responsive table-striped table-hover">
                            <thead>
                              <tr>
                                <th className="td-name">Name</th>
                                <th className="td-donations-number">Donations</th>
                                <th className="td-donations-amount">Amount</th>
                                <th className="td-status">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {campaigns.data.map(c => (
                                <tr
                                  key={c._id}
                                  className={c.status === Campaign.PENDING ? 'pending' : ''}
                                >
                                  <td className="td-name">
                                    <Link to={`/campaigns/${c._id}`}>
                                      {getTruncatedText(c.title, 45)}
                                    </Link>
                                    {c.reviewerAddress === userAddress && (
                                      <span className="badge badge-info">
                                        <i className="fa fa-eye" />
                                        &nbsp;Campaign reviewer
                                      </span>
                                    )}
                                  </td>
                                  <td className="td-donations-number">{c.donationCount || 0}</td>
                                  <td className="td-donations-amount">
                                    {convertEthHelper(c.totalDonated)} ETH
                                  </td>
                                  <td className="td-status">
                                    {(c.status === Campaign.PENDING ||
                                      (Object.keys(c).includes('mined') && !c.mined)) && (
                                      <span>
                                        <i className="fa fa-circle-o-notch fa-spin" />&nbsp;
                                      </span>
                                    )}
                                    {c.status}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {campaigns.total > campaigns.limit && (
                            <center>
                              <Pagination
                                activePage={campaigns.skipPages + 1}
                                itemsCountPerPage={campaigns.limit}
                                totalItemsCount={campaigns.total}
                                pageRangeDisplayed={visiblePages}
                                onChange={this.handleCampaignsPageChanged}
                              />
                            </center>
                          )}
                        </div>
                      )}

                    {campaigns &&
                      campaigns.data.length === 0 && (
                        <div>
                          <center>
                            <h3>This user didn&apos;t create any campaigns yet!</h3>
                            <img
                              className="empty-state-img"
                              src={`${process.env.PUBLIC_URL}/img/campaign.svg`}
                              width="200px"
                              height="200px"
                              alt="no-campaigns-icon"
                            />
                          </center>
                        </div>
                      )}
                  </div>
                )}
              </div>

              <h4>Communities</h4>
              <div className="table-container">
                {isLoadingDacs && <Loader className="fixed" />}

                {!isLoadingDacs && (
                  <div>
                    {dacs &&
                      dacs.data.length > 0 && (
                        <div>
                          <table className="table table-responsive table-striped table-hover">
                            <thead>
                              <tr>
                                <th className="td-name">Name</th>
                                <th className="td-donations-number">Number of donations</th>
                                <th className="td-donations-amount">Amount donated</th>
                                <th className="td-status">Status</th>
                                <th className="td-actions" />
                              </tr>
                            </thead>
                            <tbody>
                              {dacs.data.map(d => (
                                <tr
                                  key={d._id}
                                  className={d.status === DAC.PENDING ? 'pending' : ''}
                                >
                                  <td className="td-name">
                                    <Link to={`/dacs/${d._id}`}>
                                      {getTruncatedText(d.title, 45)}
                                    </Link>
                                  </td>
                                  <td className="td-donations-number">{d.donationCount}</td>
                                  <td className="td-donations-amount">
                                    {convertEthHelper(d.totalDonated)} ETH
                                  </td>
                                  <td className="td-status">
                                    {d.status === DAC.PENDING && (
                                      <span>
                                        <i className="fa fa-circle-o-notch fa-spin" />&nbsp;
                                      </span>
                                    )}
                                    {d.status}
                                  </td>
                                  <td className="td-actions">
                                    <button
                                      className="btn btn-link"
                                      onClick={() => this.editDAC(d.id)}
                                    >
                                      <i className="fa fa-edit" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {dacs.total > dacs.limit && (
                            <center>
                              <Pagination
                                activePage={dacs.skipPages + 1}
                                itemsCountPerPage={dacs.limit}
                                totalItemsCount={dacs.total}
                                pageRangeDisplayed={visiblePages}
                                onChange={this.handleDacPageChanged}
                              />
                            </center>
                          )}
                        </div>
                      )}

                    {dacs &&
                      dacs.length === 0 && (
                        <div>
                          <center>
                            <h3>
                              You didn&apos;t create any Decentralized Altruistic Communities (DACs)
                              yet!
                            </h3>
                            <img
                              className="empty-state-img"
                              src={`${process.env.PUBLIC_URL}/img/community.svg`}
                              width="200px"
                              height="200px"
                              alt="no-dacs-icon"
                            />
                          </center>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

Profile.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
  }).isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      userAddress: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

export default Profile;
