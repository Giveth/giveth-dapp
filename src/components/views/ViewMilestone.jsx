import BigNumber from 'bignumber.js';
import { Form } from 'formsy-react-components';
import moment from 'moment';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Avatar from 'react-avatar';
import ReactHtmlParser, { convertNodeToElement } from 'react-html-parser';
import { Link } from 'react-router-dom';
import { utils } from 'web3';

import User from 'models/User';
import Milestone from 'models/MilestoneModel';
import GivethWallet from '../../lib/blockchain/GivethWallet';
import { convertEthHelper, getUserAvatar, getUserName, isOwner } from '../../lib/helpers';
import { checkWalletBalance, redirectAfterWalletUnlock } from '../../lib/middleware';
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
      items: [],
    };

    this.editMilestone = this.editMilestone.bind(this);
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
            currentBalance: convertEthHelper(resp.data[0].currentBalance),
            maxAmount: convertEthHelper(resp.data[0].maxAmount),
          }),
        ),
      )
      .catch(err => {
        ErrorPopup('Something went wrong with viewing the milestone. Please try a refresh.', err);
        this.setState({ isLoading: false });
      });

    this.donationsObserver = MilestoneService.subscribeDonations(milestoneId, donations =>
      this.setState({
        donations,
        isLoadingDonations: false,
      }),
    );
  }

  componentWillUnmount() {
    this.donationsObserver.unsubscribe();
  }

  isActiveMilestone() {
    return this.state.status === 'InProgress' && !this.state.fullyFunded;
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
      currentBalance,
      recipient,
      recipientAddress,
      reviewer,
      reviewerAddress,
      items,
      date,
      status,
      fiatAmount,
      selectedFiatType,
      campaign,
      token,
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

              {this.state.currentBalance >= this.state.maxAmount && (
                <p>This milestone has reached its funding goal.</p>
              )}

              {this.state.currentBalance < this.state.maxAmount && (
                <p>
                  Amount requested:
                  {this.state.maxAmount} {token.symbol}
                </p>
              )}
              <p>
                Campaign:
                {campaign.title}{' '}
              </p>

              {this.isActiveMilestone() && (
                <div>
                  <DonateButton
                    model={{
                      type: Milestone.type,
                      title,
                      id,
                      adminId: projectId,
                      campaignId: this.state.campaign._id,
                    }}
                    wallet={wallet}
                    currentUser={currentUser}
                    history={history}
                    maxAmount={utils
                      .toBN(utils.toWei(this.state.maxAmount.toString()))
                      .sub(utils.toBN(utils.toWei(this.state.currentBalance.toString())))
                      .toString()}
                  />
                  {currentUser && (
                    <DelegateMultipleButton
                      style={{ padding: '10px 10px' }}
                      milestone={{
                        id,
                        projectId,
                        title,
                        ownerAddress,
                        owner,
                        maxAmount,
                        currentBalance,
                        recipient,
                        recipientAddress,
                        reviewer,
                        reviewerAddress,
                        items,
                        date,
                        status,
                        fiatAmount,
                        selectedFiatType,
                        campaign,
                        type: Milestone.type,
                      }}
                      wallet={wallet}
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
                                <th className="td-item-amount-ether">Amount {token.symbol}</th>
                                <th className="td-item-file-upload">Attached proof</th>
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
                                    wei: item.wei || '0',
                                    image: item.image,
                                  }}
                                  token={token}
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
                                    {getUserName(reviewer)}
                                  </Link>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div className="form-group">
                          <span className="label">Recipient</span>
                          <small className="form-text">
                            Where the {token.symbol} goes after successful completion of the Milestone
                          </small>

                          <table className="table-responsive">
                            <tbody>
                              <tr>
                                <td className="td-user">
                                  <Link to={`/profile/${recipientAddress}`}>
                                    <Avatar size={30} src={getUserAvatar(recipient)} round />
                                    {getUserName(recipient)}
                                  </Link>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {date && (
                          <div className="form-group">
                            <span className="label">Date of milestone</span>
                            <small className="form-text">
                              This date defines the {token.symbol}-fiat conversion rate
                            </small>
                            {moment.utc(date).format('Do MMM YYYY')}
                          </div>
                        )}

                        <div className="form-group">
                          <span className="label">Max amount to raise</span>
                          <small className="form-text">
                            The maximum amount of {token.symbol} that can be donated to this Milestone. Based
                            on the requested amount in fiat.
                          </small>
                          {maxAmount} {token.symbol}
                          {fiatAmount &&
                            selectedFiatType &&
                            items.length === 0 && (
                              <span>
                                {' '}
                                ({fiatAmount} {selectedFiatType})
                              </span>
                            )}
                        </div>

                        <div className="form-group">
                          <span className="label">Amount donated</span>
                          <small className="form-text">
                            The amount of {token.symbol} currently donated to this Milestone
                          </small>
                          {currentBalance} {token.symbol}
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
                      model={{
                        type: Milestone.type,
                        title,
                        id,
                        adminId: projectId,
                        campaignId: this.state.campaign._id,
                      }}
                      wallet={wallet}
                      currentUser={currentUser}
                      history={history}
                      type={Milestone.type}
                      maxAmount={utils
                        .toBN(utils.toWei(this.state.maxAmount.toString()))
                        .sub(utils.toBN(utils.toWei(this.state.currentBalance.toString())))
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
