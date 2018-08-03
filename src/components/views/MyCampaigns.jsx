import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Pagination from 'react-js-pagination';

import GA from 'lib/GoogleAnalytics';
import { isLoggedIn, redirectAfterWalletUnlock, checkWalletBalance } from '../../lib/middleware';
import Loader from '../Loader';
import User from '../../models/User';
import { getTruncatedText, convertEthHelper } from '../../lib/helpers';
import GivethWallet from '../../lib/blockchain/GivethWallet';
import CampaignService from '../../services/CampaignService';
import Campaign from '../../models/Campaign';

/**
 * The my campaings view
 */
class MyCampaigns extends Component {
  constructor() {
    super();

    this.state = {
      isLoading: true,
      campaigns: {},
      visiblePages: 10,
      skipPages: 0,
      itemsPerPage: 5,
    };

    this.editCampaign = this.editCampaign.bind(this);
    this.cancelCampaign = this.cancelCampaign.bind(this);
  }

  componentDidMount() {
    isLoggedIn(this.props.currentUser)
      .then(() => this.loadCampaigns())
      .catch(err => {
        if (err === 'notLoggedIn') {
          // default behavior is to go home or signin page after swal popup
        }
      });
  }

  componentWillUnmount() {
    if (this.campaignsObserver) this.campaignsObserver.unsubscribe();
  }

  loadCampaigns() {
    this.campaignsObserver = CampaignService.getUserCampaigns(
      this.props.currentUser.address,
      this.state.skipPages,
      this.state.itemsPerPage,
      campaigns => this.setState({ campaigns, isLoading: false }),
      () => this.setState({ isLoading: false }),
    );
  }

  editCampaign(id) {
    checkWalletBalance(this.props.wallet)
      .then(() => {
        React.swal({
          title: 'Edit Campaign?',
          text: 'Are you sure you want to edit this Campaign?',
          icon: 'warning',
          dangerMode: true,
          buttons: ['Cancel', 'Yes, edit'],
        }).then(isConfirmed => {
          if (isConfirmed) redirectAfterWalletUnlock(`/campaigns/${id}/edit`, this.props.wallet);
        });
      })
      .catch(err => {
        if (err === 'noBalance') {
          // handle no balance error
        }
      });
  }

  cancelCampaign(campaign) {
    checkWalletBalance(this.props.wallet)
      .then(() => {
        React.swal({
          title: 'Cancel Campaign?',
          text: 'Are you sure you want to cancel this Campaign?',
          icon: 'warning',
          dangerMode: true,
          buttons: ['Dismiss', 'Yes, cancel'],
        }).then(isConfirmed => {
          if (isConfirmed) {
            const afterCreate = url => {
              const msg = (
                <p>
                  Campaign cancelation pending...
                  <br />
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    View transaction
                  </a>
                </p>
              );
              React.toast.info(msg);
              GA.trackEvent({
                category: 'Campaign',
                action: 'canceled',
                label: campaign._id,
              });
            };

            const afterMined = url => {
              const msg = (
                <p>
                  The campaign has been cancelled!
                  <br />
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    View transaction
                  </a>
                </p>
              );
              React.toast.success(msg);
            };

            campaign.cancel(this.props.currentUser.address, afterCreate, afterMined);
          }
        });
      })
      .catch(err => {
        if (err === 'noBalance') {
          // handle no balance error
        }
      });
  }

  handlePageChanged(newPage) {
    this.setState({ skipPages: newPage - 1 }, () => this.loadCampaigns());
  }

  render() {
    const { campaigns, isLoading, visiblePages } = this.state;
    const { currentUser } = this.props;
    const isPendingCampaign =
      (campaigns.data && campaigns.data.some(d => d.confirmations !== d.requiredConfirmations)) ||
      false;

    return (
      <div id="campaigns-view">
        <div className="container-fluid page-layout dashboard-table-view">
          <div className="row">
            <div className="col-md-10 m-auto">
              {(isLoading || (campaigns && campaigns.data.length > 0)) && <h1>Your campaigns</h1>}

              {isLoading && <Loader className="fixed" />}

              {!isLoading && (
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
                              <th className="td-confirmations">
                                {isPendingCampaign && 'Confirmations'}
                              </th>
                              <th className="td-actions" />
                            </tr>
                          </thead>
                          <tbody>
                            {campaigns.data.map(c => (
                              <tr
                                key={c.id}
                                className={c.status === Campaign.PENDING ? 'pending' : ''}
                              >
                                <td className="td-name">
                                  <Link to={`/campaigns/${c.id}`}>
                                    {getTruncatedText(c.title, 45)}
                                  </Link>
                                  {c.reviewerAddress === currentUser.address && (
                                    <span className="badge badge-info">
                                      <i className="fa fa-eye" />
                                      &nbsp;I&apos;m reviewer
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
                                      <i className="fa fa-circle-o-notch fa-spin" />
                                      &nbsp;
                                    </span>
                                  )}
                                  {c.status}
                                </td>
                                <td className="td-confirmations">
                                  {(isPendingCampaign ||
                                    c.requiredConfirmations !== c.confirmations) &&
                                    `${c.confirmations}/${c.requiredConfirmations}`}
                                </td>
                                <td className="td-actions">
                                  {c.owner.address === currentUser.address &&
                                    c.isActive && (
                                      <button
                                        type="button"
                                        className="btn btn-link"
                                        onClick={() => this.editCampaign(c.id)}
                                      >
                                        <i className="fa fa-edit" />
                                        &nbsp;Edit
                                      </button>
                                    )}

                                  {(c.reviewerAddress === currentUser.address ||
                                    c.owner.address === currentUser.address) &&
                                    c.isActive && (
                                      <button
                                        type="button"
                                        className="btn btn-danger btn-sm"
                                        onClick={() => this.cancelCampaign(c)}
                                      >
                                        <i className="fa fa-ban" />
                                        &nbsp;Cancel
                                      </button>
                                    )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {campaigns.data.length > campaigns.itemsPerPage && (
                          <center>
                            <Pagination
                              activePage={campaigns.skipPages + 1}
                              itemsCountPerPage={campaigns.itemsPerPage}
                              totalItemsCount={campaigns.totalResults}
                              pageRangeDisplayed={visiblePages}
                              onChange={this.handlePageChanged}
                            />
                          </center>
                        )}
                      </div>
                    )}

                  {campaigns &&
                    campaigns.data.length === 0 && (
                      <div>
                        <center>
                          <h3>You didn&apos;t create any campaigns yet!</h3>
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
          </div>
        </div>
      </div>
    );
  }
}

MyCampaigns.propTypes = {
  currentUser: PropTypes.instanceOf(User).isRequired,
  wallet: PropTypes.instanceOf(GivethWallet).isRequired,
};

export default MyCampaigns;
