import BigNumber from 'bignumber.js';
import { paramsForServer } from 'feathers-hooks-common';
import { Form } from 'formsy-react-components';
import moment from 'moment';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Avatar from 'react-avatar';
import ReactHtmlParser, { convertNodeToElement } from 'react-html-parser';
import { Link } from 'react-router-dom';
import { utils } from 'web3';
import GivethWallet from '../../lib/blockchain/GivethWallet';
import { convertEthHelper, getUserAvatar, getUserName, isOwner } from '../../lib/helpers';
import { checkWalletBalance, redirectAfterWalletUnlock } from '../../lib/middleware';
import User from '../../models/User';
import BackgroundImageHeader from '../BackgroundImageHeader';
import DonateButton from '../DonateButton';
import ErrorPopup from '../ErrorPopup';
import GoBackButton from '../GoBackButton';
import ShowTypeDonations from '../ShowTypeDonations';
import getNetwork from '../../lib/blockchain/getNetwork';
import { feathersClient } from '../../lib/feathersClient';
import Loader from '../Loader';
import MilestoneItem from '../MilestoneItem';
import MilestoneConversations from '../MilestoneConversations';

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
      etherScanUrl: '',
      items: [],
    };

    this.editMilestone = this.editMilestone.bind(this);

    getNetwork().then(network => {
      this.setState({
        etherScanUrl: network.etherscan,
      });
    });
  }

  componentDidMount() {
    const { milestoneId } = this.props.match.params;

    feathersClient
      .service('milestones')
      .find({ query: { _id: milestoneId } })
      .then(resp =>
        this.setState(
          Object.assign({}, resp.data[0], {
            isLoading: false,
            id: milestoneId,
            fiatAmount: new BigNumber(resp.data[0].fiatAmount || '0').toFixed(2),
            totalDonated: convertEthHelper(resp.data[0].totalDonated),
            maxAmount: convertEthHelper(resp.data[0].maxAmount),
          }),
        ),
      )
      .catch(err => {
        ErrorPopup('Something went wrong with viewing the milestone. Please try a refresh.', err);
        this.setState({ isLoading: false });
      });

    // lazy load donations
    // TODO: fetch "non comitted" donations? add "intendedProjectTypeId: milestoneId" to query to get
    // all "pending aproval" donations for this milestone
    const query = paramsForServer({
      query: { ownerTypeId: milestoneId },
      schema: 'includeGiverDetails',
      $sort: { createdAt: -1 },
    });

    this.donationsObserver = feathersClient
      .service('donations')
      .watch({ listStrategy: 'always' })
      .find(query)
      .subscribe(
        resp =>
          this.setState({
            donations: resp.data,
            isLoadingDonations: false,
          }),
        () => this.setState({ isLoadingDonations: false }),
      );
  }

  componentWillUnmount() {
    this.donationsObserver.unsubscribe();
  }

  isActiveMilestone() {
    return this.state.status === 'InProgress' && this.state.totalDonated < this.state.maxAmount;
  }

  editMilestone(e) {
    e.stopPropagation();

    checkWalletBalance(this.props.wallet)
      .then(() => {
        React.swal({
          title: 'Edit Milestone?',
          text: 'Are you sure you want to edit this milestone?',
          icon: 'warning',
          dangerMode: true,
          buttons: ['Cancel', 'Yes, edit'],
        }).then(isConfirmed => {
          if (isConfirmed) {
            redirectAfterWalletUnlock(
              `/campaigns/${this.state.campaign.id}/milestones/${this.state.id}/edit`,
              this.props.wallet,
            );
          }
        });
      })
      .catch(err => {
        if (err === 'noBalance') {
          // handle no balance error
        }
      });
  }

  renderDescription() {
    return ReactHtmlParser(this.state.description, {
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
    const { history, wallet, currentUser } = this.props;
    const {
      isLoading,
      id,
      projectId,
      title,
      image,
      donations,
      isLoadingDonations,
      ownerAddress,
      owner,
      maxAmount,
      totalDonated,
      recipient,
      recipientAddress,
      reviewer,
      reviewerAddress,
      etherScanUrl,
      items,
      date,
      status,
      fiatAmount,
      selectedFiatType,
      campaign,
    } = this.state;

    return (
      <div id="view-milestone-view">
        {isLoading && <Loader className="fixed" />}

        {!isLoading && (
          <div>
            <BackgroundImageHeader image={image} height={300}>
              <h6>Milestone</h6>
              <h1>{title}</h1>

              {!this.state.status === 'InProgress' && <p>This milestone is not active anymore</p>}

              {this.state.totalDonated >= this.state.maxAmount && (
                <p>This milestone has reached its funding goal.</p>
              )}

              {this.state.totalDonated < this.state.maxAmount && (
                <p>Amount requested:{this.state.maxAmount} ETH</p>
              )}
              <p>
                Campaign:
                {campaign.title}{' '}
              </p>

              {this.isActiveMilestone() && (
                <DonateButton
                  type="milestone"
                  model={{ title, id, adminId: projectId }}
                  wallet={wallet}
                  currentUser={currentUser}
                  history={history}
                />
              )}
            </BackgroundImageHeader>

            <div className="container-fluid">
              <div className="row">
                <div className="col-md-8 m-auto">
                  <div>
                    <GoBackButton history={history} styleName="inline" />

                    {(isOwner(ownerAddress, currentUser) ||
                      isOwner(campaign.ownerAddress, currentUser)) &&
                      ['Proposed', 'Rejected', 'InProgress', 'NeedsReview'].includes(status) && (
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
                      <Link to={`/profile/${ownerAddress}`}>
                        <Avatar size={50} src={getUserAvatar(owner)} round />
                        <p className="small">{getUserName(owner)}</p>
                      </Link>
                    </center>

                    <div className="card content-card">
                      <div className="card-body content">{this.renderDescription()}</div>
                    </div>
                  </div>
                </div>
              </div>

              {items &&
                items.length > 0 && (
                  <div className="row spacer-top-50 dashboard-table-view">
                    <div className="col-md-8 m-auto">
                      <h4>Milestone items</h4>

                      {/* MilesteneItem needs to be wrapped in a form or it won't mount */}
                      <Form>
                        <div className="table-container">
                          <table className="table table-responsive table-striped table-hover">
                            <thead>
                              <tr>
                                <th className="td-item-date">Date</th>
                                <th className="td-item-description">Description</th>
                                <th className="td-item-amount-fiat">Amount Fiat</th>
                                <th className="td-item-amount-ether">Amount Ether</th>
                                <th className="td-item-file-upload">Attached proof</th>
                                <th className="td-item-action" />
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((item, i) => (
                                <MilestoneItem
                                  key={item.date}
                                  name={`milestoneItem-${i}`}
                                  item={{
                                    date: item.date,
                                    description: item.description,
                                    selectedFiatType: item.selectedFiatType,
                                    fiatAmount: item.fiatAmount,
                                    conversionRate: item.conversionRate,
                                    wei: utils.toWei(item.etherAmount || '0'),
                                    image: item.image,
                                  }}
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
                                  <Link to={`/profile/${reviewerAddress}`}>
                                    <Avatar size={30} src={getUserAvatar(reviewer)} round />
                                    <p>{getUserName(reviewer)}</p>
                                  </Link>
                                </td>
                                {etherScanUrl && (
                                  <td className="td-address">
                                    <a href={`${etherScanUrl}address/${reviewerAddress}`}>
                                      {reviewerAddress}
                                    </a>
                                  </td>
                                )}
                                {!etherScanUrl && (
                                  <td className="td-address">
                                    {' '}
                                    -
                                    {reviewerAddress}
                                  </td>
                                )}
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div className="form-group">
                          <span className="label">Recipient</span>
                          <small className="form-text">
                            Where the Ether goes after successful completion of the Milestone
                          </small>

                          <table className="table-responsive">
                            <tbody>
                              <tr>
                                <td className="td-user">
                                  <Link to={`/profile/${recipientAddress}`}>
                                    <Avatar size={30} src={getUserAvatar(recipient)} round />
                                    <p>{getUserName(recipient)}</p>
                                  </Link>
                                </td>
                                {etherScanUrl && (
                                  <td className="td-address">
                                    <a href={`${etherScanUrl}address/${recipientAddress}`}>
                                      {recipientAddress}
                                    </a>
                                  </td>
                                )}
                                {!etherScanUrl && (
                                  <td className="td-address">
                                    {' '}
                                    -
                                    {recipientAddress}
                                  </td>
                                )}
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {date && (
                          <div className="form-group">
                            <span className="label">Date of milestone</span>
                            <small className="form-text">
                              This date defines the eth-fiat conversion rate
                            </small>
                            {moment.utc(date).format('Do MMM YYYY')}
                          </div>
                        )}

                        <div className="form-group">
                          <span className="label">Max amount to raise</span>
                          <small className="form-text">
                            The maximum amount of ETH that can be donated to this Milestone. Based
                            on the requested amount in fiat.
                          </small>
                          {maxAmount} ETH
                          {fiatAmount &&
                            selectedFiatType &&
                            items.length === 0 && (
                              <span>
                                {' '}
                                (
                                {fiatAmount} {selectedFiatType}
                                )
                              </span>
                            )}
                        </div>

                        <div className="form-group">
                          <span className="label">Amount donated</span>
                          <small className="form-text">
                            The amount of ETH currently donated to this Milestone
                          </small>
                          {totalDonated} ETH
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
                          {status}
                        </div>

                        {/*
                          <div className="form-group">
                            <label>Completion deadline</label>
                            <small className="form-text">When the Milestone will be completed</small>
                            {completionDeadline}
                          </div>
                        */}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <h4>Status updates</h4>

                      <MilestoneConversations
                        milestoneId={id}
                        ownerAddress={ownerAddress}
                        reviewerAddress={reviewerAddress}
                        recipientAddress={recipientAddress}
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
                      type="milestone"
                      model={{ title, id, adminId: projectId }}
                      wallet={wallet}
                      currentUser={currentUser}
                      history={history}
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
  wallet: PropTypes.instanceOf(GivethWallet),
  match: PropTypes.shape({
    params: PropTypes.shape({
      milestoneId: PropTypes.string.isRequired,
    }),
  }).isRequired,
};

ViewMilestone.defaultProps = {
  currentUser: undefined,
  wallet: undefined,
};

export default ViewMilestone;
