import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { utils } from 'web3';

import { feathersClient } from '../../lib/feathersClient'
import { paramsForServer } from 'feathers-hooks-common'
import Loader from '../Loader'
import { isAuthenticated } from '../../lib/middleware'
import getNetwork from '../../lib/blockchain/getNetwork';

import currentUserModel from '../../models/currentUserModel'

import _ from 'underscore'
import moment from 'moment'
/**
  The my donations view
**/

class Donations extends Component {
  constructor() {
    super()

    this.state = {
      isLoading: true,
      isCommitting: false,
      isRejecting: false,
      isRefunding: false,
      donations: [],
      etherScanUrl: ''
    };

    getNetwork().then(network => {
      this.setState({
        etherScanUrl: network.etherscan
      })
    })
  }

  componentDidMount() {
    isAuthenticated(this.props.currentUser, this.props.history).then(() => {
      this.donationsObserver = feathersClient.service('donations').watch({ strategy: 'always' }).find(paramsForServer({ 
          schema: 'includeTypeDetails',
          query: { 
            donorAddress: this.props.currentUser.address,
            $limit: 100
          }
        })).subscribe(
          resp => {
            this.setState({
              donations: _.sortBy(resp.data, (d) => {
                if(d.status === 'pending') return 1
                if(d.status === 'to_approve') return 2
                if(d.status === 'waiting') return 3
                if(d.status === 'committed') return 4
                if(d.status === 'cancelled') return 5
                return 4
              }),
              hasError: false,
              isLoading: false
            })},
          err =>
            this.setState({
              isLoading: false,
              hasError: true
            })
        )       
    })    
  }

  componentWillUnmount() {
    if(this.donationsObserver) this.donationsObserver.unsubscribe()
  } 


  getStatus(status){
    switch(status){
      case "pending":
        return "pending successful transaction";
      case "to_approve":
        return "pending for your approval to be committed."
      case "waiting":
        return "waiting for further delegation"
      case "committed":
        return "committed"
      default:
        return;
    }    
  }

  commit(donation){
    React.swal({
      title: "Commit your donation?",
      text: "Your donation will go to this milestone. After committing you cannot take back your money anymore.",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, commit!",
      closeOnConfirm: true,
    }, (isConfirmed) => {
      if(isConfirmed) {   
        this.setState({ isCommitting: true })

        const doCommit = (etherScanUrl, txHash) => {
          feathersClient.service('/donations').patch(donation._id, {
            status: 'pending',
            $unset: {
              pendingProject: true,
              pendingProjectId: true,
              pendingProjectType: true,
              delegate: true,
              delegateType: true,
              delegateId: true,
            },
            txHash,
            owner: donation.pendingProject,
            ownerId: donation.pendingProjectId,
            ownerType: donation.pendingProjectType,
          }).then(donation => {
            this.setState({ isCommitting: false })
            React.toast.success(`You're awesome! Your donation is now committed. ${etherScanUrl}tx/${txHash}`, 'success')
          }).catch((e) => {
            console.log(e)
            React.toast.error("Oh no! Something went wrong with the transaction. Please try again.")
            this.setState({ isCommitting: false })
          });
        };

        let txHash;
        let etherScanUrl;
        getNetwork()
          .then((network) => {
            const { liquidPledging } = network;
            etherScanUrl = network.etherscan;

            return liquidPledging.transfer(donation.owner, donation.noteId, donation.amount, donation.proposedProject)
              .once('transactionHash', hash => {
                txHash = hash;
                doCommit(etherScanUrl, txHash);
              });
          })
          .then(() => {
            React.toast.success(`Your donation has been committed! ${etherScanUrl}tx/${txHash}`);
          }).catch((e) => {
          console.error(e);

          let msg;
          if (txHash) {
            //TODO need to update feathers to reset the donation to previous state as this tx failed.
            msg = `Something went wrong with the transaction. ${etherScanUrl}tx/${txHash}`;
          } else {
            msg = "Something went wrong with the transaction. Is your wallet unlocked?";
          }

          React.swal("Oh no!", msg, 'error');
          this.setState({ isSaving: false });
        })
      }
    })
  }

  reject(donation){
    React.swal({
      title: "Reject your donation?",
      text: "Your donation will not go to this milestone. You will still be in control of you funds and the dac can still delegate you donation.",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, reject!",
      closeOnConfirm: true,
    }, (isConfirmed) => {
      if(isConfirmed) {
        this.setState({ isRejecting: true })

        const doReject = (etherScanUrl, txHash) => {
          feathersClient.service('/donations').patch(donation._id, {
            status: 'pending',
            $unset: {
              pendingProject: true,
              pendingProjectId: true,
              pendingProjectType: true,
            },
            txHash,
          }).then(donation => {
            this.setState({ isRejecting: false })
            React.toast.success(`The delegation has been rejected. ${etherScanUrl}tx/${txHash}`, 'success')
          }).catch((e) => {
            console.log(e)
            React.toast.error("Oh no! Something went wrong with the transaction. Please try again.")
            this.setState({ isRejecting: false })
          });
        };

        let txHash;
        let etherScanUrl;
        getNetwork()
          .then((network) => {
            const { liquidPledging } = network;
            etherScanUrl = network.etherscan;

            return liquidPledging.transfer(donation.owner, donation.noteId, donation.amount, donation.delegate)
              .once('transactionHash', hash => {
                txHash = hash;
                doReject(etherScanUrl, txHash);
              });
          })
          .then(() => {
            React.toast.success(`The delegation has been rejected! ${etherScanUrl}tx/${txHash}`);
          }).catch((e) => {
          console.error(e);

          let msg;
          if (txHash) {
            //TODO need to update feathers to reset the donation to previous state as this tx failed.
            msg = `Something went wrong with the transaction. ${etherScanUrl}tx/${txHash}`;
          } else {
            msg = "Something went wrong with the transaction. Is your wallet unlocked?";
          }

          React.swal("Oh no!", msg, 'error');
          this.setState({ isSaving: false });
        })
      }
    })
  }

  refund(donation){
    React.swal({
      title: "Refund your donation?",
      text: "Your donation will be cancelled and the ETH will return to your wallet.",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, refund!",
      closeOnConfirm: true,
    }, (isConfirmed) => {
        if(isConfirmed) {   
          this.setState({ isRefunding: true })

          feathersClient.service('/donations').patch(donation._id, {
            status: 'cancelled',
          }).then(donation => { 
            this.setState({ isRefunding: false })
            React.toast.success("Your donation has been refunded.")
          }).catch((e) => {
            console.log(e)
            React.toast.error("Oh no! Something went wrong with the transaction. Please try again.")
            this.setState({ isRefunding: false })
          })
        }
      }
    )
  }  


  render() {
    let { currentUser } = this.props;
    let { donations, isLoading, etherScanUrl, isRefunding, isCommitting, isRejecting } = this.state

    return (
        <div id="donations-view">
          <div className="container-fluid page-layout dashboard-table-view">
            <div className="row">
              <div className="col-md-10 m-auto">
                <h1>Your donations</h1>

                { isLoading && 
                  <Loader className="fixed"/>
                }

                { !isLoading &&
                  <div>
                    { donations && donations.length > 0 && 

                      <table className="table table-responsive table-striped table-hover">
                        <thead>
                          <tr>
                            <th>Status</th>                          
                            <th>Amount</th>
                            <th>Donated to</th>
                            <th>Address</th>
                            <th>Date</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          { donations.map((d, index) =>
                            <tr key={index} className={d.status === 'pending' ? 'pending' : ''}>
                              <td>
                                {d.status === 'pending' && 
                                  <span><i className="fa fa-circle-o-notch fa-spin"></i>&nbsp;</span> 
                                }                              
                                {this.getStatus(d.status)}
                              </td>                            
                              <td>{utils.fromWei(d.amount)} ETH</td>
                              <td>
                                {d.proposedProject > 0 &&
                                  <span className="badge badge-info">
                                    <i className="fa fa-random"></i>
                                    &nbsp;Delegated
                                  </span>
                                }

                                {d.delegate > 0 &&
                                  'DAC'
                                }
                                {!d.delegate &&
                                  d.ownerType.toUpperCase()
                                }

                                &nbsp;
                                <em>
                                  {d.delegate > 0 && d.dac &&
                                    <span>{d.dac.title}</span>
                                  }

                                  {d.ownerType === 'campaign' && d.campaign &&
                                    <span>{d.campaign.title}</span>
                                  }

                                  {d.ownerType === 'milestone' && d.milestone &&
                                    <span>{d.milestone.title}</span>
                                  }                                  
                                </em>

                              </td>
                              {etherScanUrl &&
                              <td><a href={`${etherScanUrl}address/${d.donorAddress}`}>{d.donorAddress}</a></td>
                              }
                              {!etherScanUrl &&
                              <td>{d.donorAddress}</td>
                              }
                              <td>{moment(d.createdAt).format("MM/DD/YYYY")}</td>
                              <td>
                                { d.ownerId === currentUser.address && d.status === 'waiting' &&
                                  <a className="btn btn-sm btn-danger" onClick={()=>this.refund(d)} disabled={isRefunding}>
                                    Refund
                                  </a>
                                }
                                { d.ownerId === currentUser.address && d.status === 'to_approve' && new Date() < new Date(d.commitTime) &&
                                  <div>
                                    <a className="btn btn-sm btn-success" onClick={()=>this.commit(d)} disabled={isCommitting}>
                                      Commit
                                    </a>
                                    <a className="btn btn-sm btn-danger" onClick={()=>this.reject(d)} disabled={isRejecting}>
                                      Reject
                                    </a>
                                  </div>
                                }                             
                              </td>
                            </tr>
                          )}

                        </tbody>

                      </table>
                    }

                    { donations && donations.length === 0 &&
                      <center>You didn't make any donations yet!</center>
                    }
                  </div>
                }
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Donations

Donations.propTypes = {
  currentUser: currentUserModel,
  history: PropTypes.object.isRequired
}