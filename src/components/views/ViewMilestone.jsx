import React, { Component } from 'react';
import { paramsForServer } from 'feathers-hooks-common';
import PropTypes from 'prop-types';
import Avatar from 'react-avatar';
import { Link } from 'react-router-dom';
import { utils } from 'web3';

import { feathersClient } from './../../lib/feathersClient';
import { getUserName, getUserAvatar } from '../../lib/helpers';
import Loader from './../Loader';
import GoBackButton from '../GoBackButton';
import BackgroundImageHeader from '../BackgroundImageHeader';
import DonateButton from '../DonateButton';
import ShowTypeDonations from '../ShowTypeDonations';
import currentUserModel from '../../models/currentUserModel';
import getNetwork from './../../lib/blockchain/getNetwork';


/*
  Loads and shows a single milestone

  @route params:
    milestoneId (string): id of a milestone
*/
class ViewMilestone extends Component {
  constructor() {
    super();

    this.state = {
      isLoading: true,
      hasError: false, // eslint-disable-line react/no-unused-state
      isLoadingDonations: true,
      errorLoadingDonations: false, // eslint-disable-line react/no-unused-state
      donations: [],
      etherScanUrl: '',
    };

    getNetwork().then((network) => {
      this.setState({ etherScanUrl: network.etherscan });
    });
  }

  componentDidMount() {
    const { milestoneId } = this.props.match.params; // eslint-disable-line react/prop-types

    this.setState({ id: milestoneId }); // eslint-disable-line react/no-did-mount-set-state

    feathersClient.service('milestones')
      .find({ query: { _id: milestoneId } })
      .then(resp =>
        this.setState(Object.assign({}, resp.data[0], {
          isLoading: false,
          hasError: false, // eslint-disable-line react/no-unused-state
        })))
      .catch(() =>
        this.setState({
          isLoading: false,
          hasError: true, // eslint-disable-line react/no-unused-state
        }));

    // lazy load donations
    // TODO fetch "non comitted" donations? add "intendedProjectId: milestoneId"
    // to query to get all "pending aproval" donations for this milestone
    const query = paramsForServer({
      query: { ownerId: milestoneId },
      schema: 'includeGiverDetails',
      $sort: { createdAt: -1 },
    });

    this.donationsObserver = feathersClient
      .service('donations')
      .watch({ listStrategy: 'always' })
      .find(query)
      .subscribe(
        resp => this.setState({
          donations: resp.data,
          isLoadingDonations: false,
          errorLoadingDonations: false, // eslint-disable-line react/no-unused-state
        }),
        _err => this.setState({
          isLoadingDonations: false,
          errorLoadingDonations: true, // eslint-disable-line react/no-unused-state
        }),
      );
  }

  componentWillUnmount() {
    this.donationsObserver.unsubscribe();
  }

  totalDonatedInt() {
    return parseInt(utils.fromWei(this.state.totalDonated), 10);
  }

  maxAmountInt() {
    return parseInt(utils.fromWei(this.state.maxAmount), 10);
  }

  metFundingGoal() {
    return this.totalDonatedInt() >= this.maxAmountInt();
  }

  notMetFundingGoal() {
    return !this.metFundingGoal();
  }

  inProgressMilestone() {
    return this.state.status === 'InProgress';
  }

  isActiveMilestone() {
    return this.inProgressMilestone() && this.notMetFundingGoal();
  }

  render() {
    const { history, wallet, currentUser } = this.props; // eslint-disable-line react/prop-types

    const {
      isLoading,
      id,
      projectId,
      title,
      description,
      recipientAddress,
      reviewerAddress,
      completionDeadline,
      image,
      donations,
      isLoadingDonations,
      ownerAddress,
      owner,
      maxAmount,
      totalDonated,
      recipient,
      etherScanUrl,
    } = this.state;

    /* eslint-disable jsx-a11y/anchor-is-valid */
    return (
      <div id="view-milestone-view">
        { isLoading &&
          <Loader className="fixed" />
        }

        { !isLoading &&
          <div>
            <BackgroundImageHeader image={image} height={300}>
              <h6>Milestone</h6>
              <h1>{title}</h1>

              { !this.inProgressMilestone() &&
                <p>This milestone is not active anymore</p>
              }

              { this.metFundingGoal() &&
                <p>
                  This milestone has reached its funding goal.
                  Completion deadline {this.state.completionDeadline}
                </p>
              }

              { this.notMetFundingGoal() &&
                <p>
                  Ξ{utils.fromWei(this.state.totalDonated)} of
                  Ξ{utils.fromWei(this.state.maxAmount)} raised.
                  Completion deadline {this.state.completionDeadline}
                </p>
              }

              { this.isActiveMilestone() &&
                <DonateButton
                  type="milestone"
                  model={{ title, _id: id, adminId: projectId }}
                  wallet={wallet}
                  currentUser={currentUser}
                  history={history}
                />
              }
            </BackgroundImageHeader>

            <div className="container-fluid">

              <div className="row">
                <div className="col-md-8 m-auto">
                  <div>
                    <GoBackButton history={history} />

                    <center>
                      <Link to={`/profile/${ownerAddress}`}>
                        <Avatar size={50} src={getUserAvatar(owner)} round />
                        <p className="small">{getUserName(owner)}</p>
                      </Link>
                    </center>

                    <div className="card content-card">
                      <div className="card-body content">
                        <div dangerouslySetInnerHTML={{ __html: description }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row spacer-top-50">
                <div className="col-md-8 m-auto">
                  <h4>Details</h4>

                  <div className="form-group">
                    <div className="label">Reviewer</div>
                    <small className="form-text">
                      This person will review the actual completion of the milestone
                    </small>

                    <table className="table-responsive">
                      <tbody>
                        <tr>
                          <td className="td-user">
                            <Link to={`/profile/${reviewerAddress}`}>
                              <Avatar size={30} src={getUserAvatar(recipient.avatar)} round />
                              <span>{getUserName(recipient.name)}</span>
                            </Link>
                          </td>
                          {etherScanUrl &&
                            <td className="td-address">
                              -
                              <a href={`${etherScanUrl}address/${reviewerAddress}`}>
                                { reviewerAddress }
                              </a>
                            </td>
                          }
                          {!etherScanUrl &&
                            <td className="td-address">
                              - {reviewerAddress}
                            </td>
                          }
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="form-group">
                    <div className="label">Recipient</div>
                    <small className="form-text">
                      Where the Ether goes after successful completion of the milestone
                    </small>

                    <table className="table-responsive">
                      <tbody>
                        <tr>
                          <td className="td-user">
                            <Link to={`/profile/${recipientAddress}`}>
                              <Avatar size={30} src={getUserAvatar(recipient.avatar)} round />
                              <span>{getUserName(recipient.name)}</span>
                            </Link>
                          </td>
                          {etherScanUrl &&
                            <td className="td-address"> -
                              <a href={`${etherScanUrl}address/${recipientAddress}`}>
                                {recipientAddress}
                              </a>
                            </td>
                          }
                          {!etherScanUrl &&
                            <td className="td-address"> - {recipientAddress}</td>
                          }
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="form-group">
                    <div className="label">Max amount to raise</div>
                    <small className="form-text">
                      The maximum amount of &#926; that can be donated to this milestone
                    </small>
                    &#926;{utils.fromWei(maxAmount)}
                  </div>

                  <div className="form-group">
                    <div className="label">Amount donated</div>
                    <small className="form-text">
                      The amount of &#926; currently donated to this milestone
                    </small>
                    &#926;{utils.fromWei(totalDonated)}
                  </div>

                  <div className="form-group">
                    <div className="label">Completion deadline</div>
                    <small className="form-text">
                      When the milestone will be completed
                    </small>
                    {completionDeadline}
                  </div>
                </div>
              </div>

              <div className="row spacer-top-50 spacer-bottom-50">
                <div className="col-md-8 m-auto">
                  <h4>Donations</h4>
                  <ShowTypeDonations donations={donations} isLoading={isLoadingDonations} />
                  { this.isActiveMilestone() &&
                    <DonateButton
                      type="milestone"
                      model={{ title, _id: id, adminId: projectId }}
                      wallet={wallet}
                      currentUser={currentUser}
                      history={history}
                    />
                  }
                </div>
              </div>

            </div>
          </div>
        }
      </div>
    );
    /* eslint-enable jsx-a11y/anchor-is-valid */
  }
}

export default ViewMilestone;

ViewMilestone.propTypes = {
  history: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  currentUser: currentUserModel,
};

ViewMilestone.defaultProps = {
  currentUser: currentUserModel,
};

