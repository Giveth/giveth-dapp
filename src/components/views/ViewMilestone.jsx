import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';

import { Form } from 'formsy-react-components';
import moment from 'moment';
import Avatar from 'react-avatar';
import ReactHtmlParser, { convertNodeToElement } from 'react-html-parser';
import { Link } from 'react-router-dom';
import BigNumber from 'bignumber.js';

import User from 'models/User';
import Campaign from 'models/Campaign';
import Milestone from 'models/Milestone';
import LPMilestone from 'models/LPMilestone';
import MilestoneActions from 'components/MilestoneActions';

import BackgroundImageHeader from 'components/BackgroundImageHeader';
import DonateButton from 'components/DonateButton';
import ErrorPopup from 'components/ErrorPopup';
import GoBackButton from 'components/GoBackButton';
import Loader from 'components/Loader';
import MilestoneItem from 'components/MilestoneItem';
import ListDonations from 'components/ListDonations';
import MilestoneConversations from 'components/MilestoneConversations';
import DelegateMultipleButton from 'components/DelegateMultipleButton';
import { convertEthHelper, getUserAvatar, getUserName } from '../../lib/helpers';

import MilestoneService from '../../services/MilestoneService';
import ShareOptions from '../ShareOptions';

/**
  Loads and shows a single milestone

  @route params:
    milestoneId (string): id of a milestone
* */

class ViewMilestone extends Component {
  constructor() {
    super();

    this.state = {
      isLoading: true,
      isLoadingDonations: true,
      donations: [],
      recipient: {},
      campaign: {},
      milestone: {},
      donationsTotal: 0,
      donationsPerBatch: 50,
      newDonations: 0,
    };

    this.loadMoreDonations = this.loadMoreDonations.bind(this);
  }

  componentDidMount() {
    const { milestoneId } = this.props.match.params;

    MilestoneService.subscribeOne(
      milestoneId,
      milestone =>
        this.setState({
          milestone,
          isLoading: false,
          campaign: new Campaign(milestone.campaign),
          recipient: milestone.pendingRecipientAddress
            ? milestone.pendingRecipient
            : milestone.recipient,
        }),
      err => {
        ErrorPopup('Something went wrong with viewing the Milestone. Please try a refresh.', err);
        this.setState({ isLoading: false });
      },
    );

    this.loadMoreDonations();
    // subscribe to donation count
    this.donationsObserver = MilestoneService.subscribeNewDonations(
      milestoneId,
      newDonations =>
        this.setState({
          newDonations,
        }),
      () => this.setState({ newDonations: 0 }),
    );
  }

  componentWillUnmount() {
    this.donationsObserver.unsubscribe();
  }

  loadMoreDonations() {
    this.setState({ isLoadingDonations: true }, () =>
      MilestoneService.getDonations(
        this.props.match.params.milestoneId,
        this.state.donationsPerBatch,
        this.state.donations.length,
        (donations, donationsTotal) =>
          this.setState(prevState => ({
            donations: prevState.donations.concat(donations),
            isLoadingDonations: false,
            donationsTotal,
          })),
        () => this.setState({ isLoadingDonations: false }),
      ),
    );
  }

  isActiveMilestone() {
    return this.state.milestone.status === 'InProgress' && !this.state.milestone.fullyFunded;
  }

  renderDescription() {
    return ReactHtmlParser(this.state.milestone.description, {
      transform(node, index) {
        if (node.attribs && node.attribs.class === 'ql-video') {
          const url = node.attribs.src;
          const match =
            url.match(/^(https?):\/\/(?:(?:www|m)\.)?youtube\.com\/watch.*v=([a-zA-Z0-9_-]+)/) ||
            url.match(/^(https?):\/\/(?:(?:www|m)\.)?youtu\.be\/([a-zA-Z0-9_-]+)/) ||
            url.match(/^(https?):\/\/(?:(?:fame|m)\.)?giveth\.io\/([a-zA-Z0-9_-]+)/);
          if (match) {
            return (
              <div className="video-wrapper" key={index}>
                {convertNodeToElement(node, index)}
              </div>
            );
          }
          return (
            <video width="100%" height="auto" controls name="media">
              <source src={node.attribs.src} type="video/webm" />
            </video>
          );
        }
        if (node.name === 'img') {
          return <img style={{ height: 'auto', width: '100%' }} alt="" src={node.attribs.src} />;
        }
        return undefined;
      },
    });
  }

  render() {
    const { history, currentUser, balance } = this.props;
    const {
      isLoading,
      donations,
      isLoadingDonations,
      campaign,
      milestone,
      recipient,
      donationsTotal,
      newDonations,
    } = this.state;

    return (
      <div id="view-milestone-view">
        {isLoading && <Loader className="fixed" />}

        {!isLoading && (
          <div>
            <BackgroundImageHeader image={milestone.image} height={300}>
              <h6>Milestone</h6>
              <h1>{milestone.title}</h1>

              {!milestone.status === 'InProgress' && <p>This Milestone is not active anymore</p>}

              {milestone.fullyFunded && <p>This Milestone has reached its funding goal!</p>}

              {milestone.isCapped && !milestone.fullyFunded && (
                <p>
                  Amount requested: {convertEthHelper(milestone.maxAmount)} {milestone.token.symbol}
                </p>
              )}
              <p>Campaign: {campaign.title} </p>

              <div className="milestone-actions">
                {this.isActiveMilestone() && (
                  <Fragment>
                    <DonateButton
                      model={{
                        type: Milestone.type,
                        acceptsSingleToken: milestone.acceptsSingleToken,
                        title: milestone.title,
                        id: milestone.id,
                        adminId: milestone.projectId,
                        campaignId: campaign._id,
                        token: milestone.acceptsSingleToken ? milestone.token : undefined,
                        isCapped: milestone.isCapped,
                      }}
                      currentUser={currentUser}
                      history={history}
                      type={Milestone.type}
                      maxDonationAmount={
                        milestone.isCapped
                          ? milestone.maxAmount.minus(milestone.totalDonated)
                          : undefined
                      }
                    />
                    {currentUser && (
                      <DelegateMultipleButton
                        style={{ padding: '10px 10px' }}
                        milestone={milestone}
                        campaign={campaign}
                        balance={balance}
                        currentUser={currentUser}
                      />
                    )}
                  </Fragment>
                )}

                {/* Milestone actions */}

                <MilestoneActions
                  milestone={milestone}
                  balance={balance}
                  currentUser={currentUser}
                />
              </div>
            </BackgroundImageHeader>

            <div className="container-fluid">
              <div className="row">
                <div className="col-md-8 m-auto">
                  <div>
                    <div className="go-back-section">
                      <GoBackButton
                        history={history}
                        styleName="inline"
                        title={`Campaign: ${campaign.title}`}
                      />
                      <ShareOptions pageUrl={window.location.href} pageTitle={milestone.title} />
                    </div>

                    <center>
                      <Link to={`/profile/${milestone.ownerAddress}`}>
                        <Avatar size={50} src={getUserAvatar(milestone.owner)} round />
                        <p className="small">{getUserName(milestone.owner)}</p>
                      </Link>
                    </center>

                    <div className="card content-card">
                      <div className="card-body content">{this.renderDescription()}</div>
                    </div>
                  </div>
                </div>
              </div>

              {milestone.items && milestone.items.length > 0 && (
                <div className="row spacer-top-50 dashboard-table-view">
                  <div className="col-md-8 m-auto">
                    <h4>Milestone proof</h4>
                    <p>These receipts show how the money of this Milestone was spent.</p>

                    {/* MilesteneItem needs to be wrapped in a form or it won't mount */}
                    <Form>
                      <div className="table-container">
                        <table className="table table-striped table-hover">
                          <thead>
                            <tr>
                              <th className="td-item-date">Date</th>
                              <th className="td-item-description">Description</th>
                              <th className="td-item-amount-fiat">Amount Fiat</th>
                              <th className="td-item-amount-ether">
                                Amount {milestone.token.symbol}
                              </th>
                              <th className="td-item-file-upload">Attached proof</th>
                            </tr>
                          </thead>
                          <tbody>
                            {milestone.items.map((item, i) => (
                              <MilestoneItem
                                key={item._id}
                                name={`milestoneItem-${i}`}
                                item={item}
                                token={milestone.token}
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Form>
                  </div>
                </div>
              )}

              <div className="row spacer-top-50">
                <div className="col-md-8 m-auto">
                  <div className="row">
                    <div className="col-md-6">
                      <h4>Details</h4>

                      <div className="card details-card">
                        <div className="form-group">
                          <span className="label">Reviewer</span>
                          {milestone.hasReviewer && (
                            <Fragment>
                              <small className="form-text">
                                This person will review the actual completion of the Milestone
                              </small>

                              <table className="table-responsive">
                                <tbody>
                                  <tr>
                                    <td className="td-user">
                                      <Link to={`/profile/${milestone.reviewerAddress}`}>
                                        <Avatar
                                          size={30}
                                          src={getUserAvatar(milestone.reviewer)}
                                          round
                                        />
                                        {getUserName(milestone.reviewer)}
                                      </Link>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </Fragment>
                          )}
                          {!milestone.hasReviewer && (
                            <p className="form-text alert alert-warning missing-reviewer-alert">
                              <i className="fa fa-exclamation-triangle" />
                              This Milestone does not have a reviewer. Any donations to this
                              Milestone can be withdrawn at any time and no checks are in place to
                              ensure this Milestone is completed.
                            </p>
                          )}
                        </div>

                        <div className="form-group">
                          <span className="label">Recipient</span>
                          {milestone.hasRecipient && (
                            <Fragment>
                              <small className="form-text">
                                Where the{' '}
                                {milestone.isCapped ? `${milestone.token.symbol} ` : 'tokens '}
                                will go
                                {milestone.hasReviewer &&
                                  ' after successful completion of the Milestone'}
                              </small>

                              {milestone.pendingRecipientAddress && (
                                <small className="form-text">
                                  <span>
                                    <i className="fa fa-circle-o-notch fa-spin" />
                                    &nbsp;
                                  </span>
                                  This recipient is pending
                                </small>
                              )}

                              <table className="table-responsive">
                                <tbody>
                                  <tr>
                                    <td className="td-user">
                                      {milestone instanceof LPMilestone ? (
                                        <Link to={`/campaigns/${milestone.recipient._id}`}>
                                          Campaign: {milestone.recipient.title}
                                        </Link>
                                      ) : (
                                        <Link
                                          to={`/profile/${milestone.pendingRecipientAddress ||
                                            milestone.recipientAddress}`}
                                        >
                                          <Avatar size={30} src={getUserAvatar(recipient)} round />
                                          {getUserName(recipient)}
                                        </Link>
                                      )}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </Fragment>
                          )}
                          {!milestone.hasRecipient && (
                            <p className="form-text">
                              This Milestone does not have a recipient. If you are interested in
                              completing the work for this Milestone, contact the Milestone manager
                              and let them know!
                            </p>
                          )}
                        </div>

                        {milestone.date && (
                          <div className="form-group">
                            <span className="label">Date of Milestone</span>
                            <small className="form-text">
                              {milestone.isCapped
                                ? `This date defines the ${
                                    milestone.token.symbol
                                  }-fiat conversion rate`
                                : 'The date this Milestone was created'}
                            </small>
                            {moment.utc(milestone.date).format('Do MMM YYYY')}
                          </div>
                        )}

                        {milestone.isCapped && (
                          <div className="form-group">
                            <span className="label">Max amount to raise</span>
                            <small className="form-text">
                              The maximum amount of {milestone.token.symbol} that can be donated to
                              this Milestone. Based on the requested amount in fiat.
                            </small>
                            {convertEthHelper(milestone.maxAmount)} {milestone.token.symbol}
                            {milestone.items.length === 0 &&
                              milestone.selectedFiatType &&
                              milestone.selectedFiatType !== milestone.token.symbol &&
                              milestone.fiatAmount && (
                                <span>
                                  {' '}
                                  ({milestone.fiatAmount.toFixed()} {milestone.selectedFiatType})
                                </span>
                              )}
                          </div>
                        )}

                        <div className="form-group">
                          <span className="label">Amount donated</span>
                          <small className="form-text">
                            {milestone.acceptsSingleToken
                              ? `
                              The amount of ${milestone.token.symbol} currently donated to this
                              Milestone`
                              : 'The total amount(s) donated to this Milestone'}
                          </small>
                          {milestone.donationCounters.length &&
                            milestone.donationCounters.map(dc => (
                              <p className="donation-counter" key={dc.symbol}>
                                {convertEthHelper(dc.totalDonated)} {dc.symbol}
                              </p>
                            ))}
                        </div>

                        {!milestone.isCapped && milestone.donationCounters.length > 0 && (
                          <div className="form-group">
                            <span className="label">Current Balance</span>
                            <small className="form-text">
                              The current balance(s) of this Milestone
                            </small>
                            {milestone.donationCounters.map(dc => (
                              <p className="donation-counter" key={dc.symbol}>
                                {convertEthHelper(dc.currentBalance)} {dc.symbol}
                              </p>
                            ))}
                          </div>
                        )}

                        <div className="form-group">
                          <span className="label">Campaign</span>
                          <small className="form-text">
                            The Campaign this Milestone belongs to.
                          </small>
                          {campaign.title}
                        </div>

                        <div className="form-group">
                          <span className="label">Status</span>
                          <br />
                          {milestone.status}
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <h4>Status updates</h4>

                      <MilestoneConversations
                        milestone={milestone}
                        currentUser={currentUser}
                        balance={balance}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="row spacer-top-50 spacer-bottom-50">
                <div className="col-md-8 m-auto">
                  <ListDonations
                    donations={donations}
                    isLoading={isLoadingDonations}
                    total={donationsTotal}
                    loadMore={this.loadMoreDonations}
                    newDonations={newDonations}
                    useAmountRemaining
                  />
                  {this.isActiveMilestone() && (
                    <DonateButton
                      model={{
                        type: Milestone.type,
                        acceptsSingleToken: milestone.acceptsSingleToken,
                        title: milestone.title,
                        id: milestone.id,
                        adminId: milestone.projectId,
                        campaignId: campaign._id,
                        token: milestone.acceptsSingleToken ? milestone.token : undefined,
                        isCapped: milestone.isCapped,
                      }}
                      currentUser={currentUser}
                      history={history}
                      type={Milestone.type}
                      maxDonationAmount={
                        milestone.isCapped
                          ? milestone.maxAmount.minus(milestone.totalDonated)
                          : undefined
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

ViewMilestone.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
  }).isRequired,
  currentUser: PropTypes.instanceOf(User),
  balance: PropTypes.instanceOf(BigNumber).isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      milestoneId: PropTypes.string.isRequired,
    }),
  }).isRequired,
};

ViewMilestone.defaultProps = {
  currentUser: undefined,
};

export default ViewMilestone;
