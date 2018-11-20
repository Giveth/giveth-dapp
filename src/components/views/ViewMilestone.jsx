import { Form } from 'formsy-react-components';
import moment from 'moment';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Avatar from 'react-avatar';
import ReactHtmlParser, { convertNodeToElement } from 'react-html-parser';
import { Link } from 'react-router-dom';
import { utils } from 'web3';

import User from 'models/User';
import Milestone from 'models/Milestone';
import { getUserAvatar, getUserName, isOwner } from '../../lib/helpers';
import { checkBalance } from '../../lib/middleware';

import BackgroundImageHeader from '../BackgroundImageHeader';
import DonateButton from '../DonateButton';
import ErrorPopup from '../ErrorPopup';
import GoBackButton from '../GoBackButton';
import ShowTypeDonations from '../ShowTypeDonations';
import { feathersClient } from '../../lib/feathersClient';
import Loader from '../Loader';
import MilestoneItem from '../MilestoneItem';
import MilestoneConversations from '../MilestoneConversations';
import DelegateMultipleButton from '../DelegateMultipleButton';

import MilestoneService from '../../services/MilestoneService';

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
    };

    this.editMilestone = this.editMilestone.bind(this);
  }

  componentDidMount() {
    const { milestoneId } = this.props.match.params;

    this.milestoneObserver = feathersClient
      .service('milestones')
      .watch({ listStrategy: 'always' })
      .find({ query: { _id: milestoneId } })
      .subscribe(
        resp => {
          const milestone = new Milestone(resp.data[0]);

          this.setState({
            milestone,
            isLoading: false,
            campaign: resp.data[0].campaign,
            recipient: resp.data[0].recipient,
          });
        },
        err => {
          console.log('err', err);
          ErrorPopup('Something went wrong with viewing the milestone. Please try a refresh.', err);
          this.setState({ isLoading: false });
        },
      );

    this.donationsObserver = MilestoneService.subscribeDonations(milestoneId, donations =>
      this.setState({
        donations,
        isLoadingDonations: false,
      }),
    );
  }

  componentWillUnmount() {
    this.donationsObserver.unsubscribe();
    this.milestoneObserver.unsubscribe();
  }

  isActiveMilestone() {
    return this.state.milestone.status === 'InProgress' && !this.state.milestone.fullyFunded;
  }

  editMilestone(e) {
    e.stopPropagation();

    checkBalance(this.props.balance)
      .then(() => {
        this.props.history.push(
          `/campaigns/${this.state.campaign.id}/milestones/${this.state.id}/edit`,
        );
      })
      .catch(err => {
        if (err === 'noBalance') {
          // handle no balance error
        }
      });
  }

  renderDescription() {
    return ReactHtmlParser(this.state.milestone.description, {
      transform(node, index) {
        if (node.attribs && node.attribs.class === 'ql-video') {
          return (
            <div className="video-wrapper" key={index}>
              {convertNodeToElement(node, index)}
            </div>
          );
        }
        return undefined;
      },
    });
  }

  render() {
    const { history, currentUser, balance } = this.props;
    const { isLoading, donations, isLoadingDonations, campaign, milestone, recipient } = this.state;

    return (
      <div id="view-milestone-view">
        {isLoading && <Loader className="fixed" />}

        {!isLoading && (
          <div>
            <BackgroundImageHeader image={milestone.image} height={300}>
              <h6>Milestone</h6>
              <h1>{milestone.title}</h1>

              {!milestone.status === 'InProgress' && <p>This milestone is not active anymore</p>}

              {milestone.fullyFunded && <p>This milestone has reached its funding goal!</p>}

              {!milestone.fullyFunded && (
                <p>
                  Amount requested: {utils.fromWei(milestone.maxAmount)} {milestone.token.symbol}
                </p>
              )}
              <p>Campaign: {campaign.title} </p>

              {this.isActiveMilestone() && (
                <div>
                  <DonateButton
                    model={{
                      type: 'milestone',
                      title: milestone.title,
                      id: milestone.id,
                      adminId: milestone.projectId,
                      campaignId: campaign._id,
                      token: milestone.token,
                    }}
                    currentUser={currentUser}
                    history={history}
                    maxAmount={utils
                      .toBN(utils.toWei(milestone.maxAmount))
                      .sub(utils.toBN(utils.toWei(milestone.currentBalance)))
                      .toString()}
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
                </div>
              )}
            </BackgroundImageHeader>

            <div className="container-fluid">
              <div className="row">
                <div className="col-md-8 m-auto">
                  <div>
                    <GoBackButton
                      history={history}
                      styleName="inline"
                      title={`Campaign: ${campaign.title}`}
                    />

                    {(isOwner(milestone.owner.address, currentUser) ||
                      isOwner(campaign.ownerAddress, currentUser)) &&
                      ['Proposed', 'Rejected', 'InProgress', 'NeedsReview'].includes(
                        milestone.status,
                      ) && (
                        <span className="pull-right">
                          <button
                            type="button"
                            className="btn btn-link btn-edit"
                            onClick={e => this.editMilestone(e)}
                          >
                            <i className="fa fa-edit" />
                          </button>
                        </span>
                      )}

                    <center>
                      <Link to={`/profile/${milestone.owner.address}`}>
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

              {milestone.items &&
                milestone.items.length > 0 && (
                  <div className="row spacer-top-50 dashboard-table-view">
                    <div className="col-md-8 m-auto">
                      <h4>Milestone proof</h4>
                      <p>These receipts show how the money of this milestone was spent.</p>

                      {/* MilesteneItem needs to be wrapped in a form or it won't mount */}
                      <Form>
                        <div className="table-container">
                          <table className="table table-responsive table-striped table-hover">
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
                                  key={item.date}
                                  name={`milestoneItem-${i}`}
                                  item={{
                                    date: item.date,
                                    description: item.description,
                                    selectedFiatType: item.selectedFiatType,
                                    fiatAmount: item.fiatAmount,
                                    conversionRate: item.conversionRate,
                                    wei: item.wei || '0',
                                    image: item.image,
                                  }}
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
                        </div>

                        <div className="form-group">
                          <span className="label">Recipient</span>
                          <small className="form-text">
                            Where the {milestone.token.symbol} goes after successful completion of
                            the Milestone
                          </small>

                          <table className="table-responsive">
                            <tbody>
                              <tr>
                                <td className="td-user">
                                  <Link to={`/profile/${milestone.recipientAddress}`}>
                                    <Avatar size={30} src={getUserAvatar(recipient)} round />
                                    {getUserName(recipient)}
                                  </Link>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {milestone.date && (
                          <div className="form-group">
                            <span className="label">Date of milestone</span>
                            <small className="form-text">
                              This date defines the {milestone.token.symbol}-fiat conversion rate
                            </small>
                            {moment.utc(milestone.date).format('Do MMM YYYY')}
                          </div>
                        )}

                        <div className="form-group">
                          <span className="label">Max amount to raise</span>
                          <small className="form-text">
                            The maximum amount of {milestone.token.symbol} that can be donated to
                            this Milestone. Based on the requested amount in fiat.
                          </small>
                          {utils.fromWei(milestone.maxAmount)} {milestone.token.symbol}
                          {milestone.fiatAmount &&
                            milestone.selectedFiatType &&
                            milestone.items.length === 0 && (
                              <span>
                                {' '}
                                ({milestone.fiatAmount} {milestone.selectedFiatType})
                              </span>
                            )}
                        </div>

                        <div className="form-group">
                          <span className="label">Amount donated</span>
                          <small className="form-text">
                            The amount of {milestone.token.symbol} currently donated to this
                            Milestone
                          </small>
                          {utils.fromWei(milestone.currentBalance)} {milestone.token.symbol}
                        </div>

                        <div className="form-group">
                          <span className="label">Campaign</span>
                          <small className="form-text">
                            The campaign this milestone belongs to.
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
                        milestoneId={milestone.id}
                        ownerAddress={milestone.ownerAddress}
                        reviewerAddress={milestone.reviewerAddress}
                        recipientAddress={milestone.recipientAddress}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="row spacer-top-50 spacer-bottom-50">
                <div className="col-md-8 m-auto">
                  <h4>Donations</h4>
                  <ShowTypeDonations donations={donations} isLoading={isLoadingDonations} />
                  {this.isActiveMilestone() && (
                    <DonateButton
                      model={{
                        type: 'milestone',
                        title: milestone.title,
                        id: milestone.id,
                        adminId: milestone.projectId,
                        campaignId: campaign._id,
                        token: milestone.token,
                      }}
                      currentUser={currentUser}
                      history={history}
                      type={milestone.type}
                      maxAmount={utils
                        .toBN(utils.toWei(milestone.maxAmount))
                        .sub(utils.toBN(utils.toWei(milestone.currentBalance)))
                        .toString()}
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
  balance: PropTypes.objectOf(utils.BN).isRequired,
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
