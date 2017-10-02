import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { utils } from 'web3';
import LPPMilestone from 'lpp-milestone';

import { feathersClient } from '../../lib/feathersClient'
import { isAuthenticated, redirectAfterWalletUnlock } from '../../lib/middleware'
import getNetwork from '../../lib/blockchain/getNetwork';
import getWeb3 from '../../lib/blockchain/getWeb3';
import Loader from '../Loader'
import currentUserModel from '../../models/currentUserModel'

/**
  The my campaings view
**/

class MyMilestones extends Component {
  constructor() {
    super()

    this.state = {
      isLoading: true,
      milestones: []
    }    
  }

  componentDidMount() {
    const myAddress = this.props.currentUser.address

    const self = this;

    isAuthenticated(this.props.currentUser, this.props.history).then(() => {
      this.milestonesObserver = feathersClient.service('milestones').watch({ strategy: 'always' }).find({query: { 
        $or: [
          { ownerAddress: myAddress },
          { reviewerAddress: myAddress },
          { recipientAddress: myAddress }
        ]
      }}).subscribe(
        resp => this.setState({ milestones: resp.data, isLoading: false, hasError: false }),
        err => this.setState({ isLoading: false, hasError: true })
      )
    })   
  }


  // removeMilestone(id){
  //   React.swal({
  //     title: "Delete Milestone?",
  //     text: "You will not be able to recover this Milestone!",
  //     type: "warning",
  //     showCancelButton: true,
  //     confirmButtonColor: "#DD6B55",
  //     confirmButtonText: "Yes, delete it!",
  //     closeOnConfirm: true,
  //   }, () => {
  //     const milestones = feathersClient.service('/milestones');
  //     milestones.remove(id).then(milestone => {
  //       React.toast.success("Your Milestone has been deleted.")
  //     })
  //   });
  // }

  editMilestone(id) {
    React.swal({
      title: "Edit Milestone?",
      text: "Are you sure you want to edit this Milestone?",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, continue editing!",
      closeOnConfirm: true,
    }, (isConfirmed) => {
      if(isConfirmed) redirectAfterWalletUnlock("/milestones/" + id + "/edit", this.props.wallet, this.props.history)
    })
    
  }  

  markComplete(milestone) {
    React.swal({
      title: "Mark as complete?",
      text: "Are you sure you want to mark this Milestone as complete?",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, mark complete!",
      closeOnConfirm: true,
    }, (isConfirmed) => {
      if(isConfirmed) {
        const markComplete = (etherScanUrl, txHash) => {
          feathersClient.service('/milestones').patch(milestone._id, {
            status: 'NeedsReview',
            mined: false
          }).then(() => {
            React.toast.success(`Marking this milestone as NeedsReview in progress. ${etherScanUrl}tx/${txHash}`, 'success')
          }).catch((e) => {
            console.log('Error updating feathers cache ->', e);
          })
        };

        let txHash;
        let etherScanUrl;
        Promise.all([ getNetwork(), getWeb3() ])
          .then(([ network, web3 ]) => {
            const lppMilestone = new LPPMilestone(web3, milestone.pluginAddress);
            etherScanUrl = network.etherscan;

            return lppMilestone.readyForReview({ from: this.props.currentUser.address })
              .once('transactionHash', hash => {
                txHash = hash;
                markComplete(etherScanUrl, txHash);
              });
          })
          .then(() => {
            React.toast.success(`The milestone has been marked as NeedsReview! ${etherScanUrl}tx/${txHash}`);
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
        })
      }
    })
  }

  cancelMilestone(milestone) {
    React.swal({
      title: "Cancel Milestone?",
      text: "Are you sure you want to cancel this Milestone?",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, cancel!",
      closeOnConfirm: true,
    }, (isConfirmed) => {
      if(isConfirmed) {
        const cancel = (etherScanUrl, txHash) => {
          feathersClient.service('/milestones').patch(milestone._id, {
            status: 'Canceled',
            mined: false
          }).then(() => {
            React.toast.success(`Cancel milestone is pending. ${etherScanUrl}tx/${txHash}`, 'success')
          }).catch((e) => {
            console.log('Error updating feathers cache ->', e);
          })
        };

        let txHash;
        let etherScanUrl;
        Promise.all([ getNetwork(), getWeb3() ])
          .then(([ network, web3 ]) => {
            const lppMilestone = new LPPMilestone(web3, milestone.pluginAddress);
            etherScanUrl = network.etherscan;

            return lppMilestone.cancelMilestone({ from: this.props.currentUser.address })
              .once('transactionHash', hash => {
                txHash = hash;
                cancel(etherScanUrl, txHash);
              });
          })
          .then(() => {
            React.toast.success(`The milestone has been canceled! ${etherScanUrl}tx/${txHash}`);
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
        })
      }
    })
  }

  approveMilestone(milestone) {
    React.swal({
      title: "Approve Milestone?",
      text: "Are you sure you want to approve this Milestone?",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, approve!",
      closeOnConfirm: true,
    }, (isConfirmed) => {
      if(isConfirmed) {
        const approve = (etherScanUrl, txHash) => {
          feathersClient.service('/milestones').patch(milestone._id, {
            status: 'Completed',
            mined: false
          }).then(() => {
            React.toast.success(`Approve milestone is pending. ${etherScanUrl}tx/${txHash}`, 'success')
          }).catch((e) => {
            console.log('Error updating feathers cache ->', e);
          })
        };

        let txHash;
        let etherScanUrl;
        Promise.all([ getNetwork(), getWeb3() ])
          .then(([ network, web3 ]) => {
            const lppMilestone = new LPPMilestone(web3, milestone.pluginAddress);
            etherScanUrl = network.etherscan;

            // only uses 14,xxx gas, but will throw out of gas error if given anything less then 30000
            return lppMilestone.acceptMilestone({ from: this.props.currentUser.address })
              .once('transactionHash', hash => {
                txHash = hash;
                approve(etherScanUrl, txHash);
              });
          })
          .then(() => {
            React.toast.success(`The milestone has been approved! ${etherScanUrl}tx/${txHash}`);
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
        })
      }
    })
  }

  rejectMilestone(milestone) {
    React.swal({
      title: "Reject Milestone?",
      text: "Are you sure you want to reject this Milestone?",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, reject!",
      closeOnConfirm: true,
    }, (isConfirmed) => {
      if(isConfirmed) {
        const reject = (etherScanUrl, txHash) => {
          feathersClient.service('/milestones').patch(milestone._id, {
            status: 'InProgress',
            mined: false
          }).then(() => {
            React.toast.success(`Reject milestone is pending. ${etherScanUrl}tx/${txHash}`, 'success')
          }).catch((e) => {
            console.log('Error updating feathers cache ->', e);
          })
        };

        let txHash;
        let etherScanUrl;
        Promise.all([ getNetwork(), getWeb3() ])
          .then(([ network, web3 ]) => {
            const lppMilestone = new LPPMilestone(web3, milestone.pluginAddress);
            etherScanUrl = network.etherscan;

            // only uses 14,xxx gas, but will throw out of gas error if given anything less then 30000
            return lppMilestone.rejectMilestone({ from: this.props.currentUser.address, gas: 30000 })
              .once('transactionHash', hash => {
                txHash = hash;
                reject(etherScanUrl, txHash);
              });
          })
          .then(() => {
            React.toast.success(`The milestone has been rejected! ${etherScanUrl}tx/${txHash}`);
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
        })
      }
    })
  }

  requestWithdrawal(milestone) {
    React.swal({
      title: "Request Withdrawal",
      text: "For security reasons, there's a 3 day delay from the moment you request withdrawal before you can actually withdraw the money.",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Continue",
      closeOnConfirm: true,
    }, (isConfirmed) => {
      if(isConfirmed) {
        console.log('request withdrawal')
        if(isConfirmed) {
          const withdraw = (etherScanUrl, txHash) => {
            feathersClient.service('/milestones').patch(milestone._id, {
              status: 'Completed',
              mined: false
            }).then(() => {
              React.toast.success(`Milestone request withdraw is pending. ${etherScanUrl}tx/${txHash}`, 'success')
            }).catch((e) => {
              console.log('Error updating feathers cache ->', e);
            })

            feathersClient.service('donations').patch(null, {
              status: 'pending',
              paymentStatus: 'Paying',
              txHash
            }, {
              query: {
                ownerType: 'milestone',
                ownerId: milestone._id
              }
            }).catch((e) => {
              console.log('Error updating feathers cache ->', e);
            })
          };

          const getNote = () => {
            return feathersClient.service('donations').find({
              query: {
                ownerType: 'milestone',
                ownerId: milestone._id
              }
            })
            .then(({ data }) => {
               if (data.length === 0) throw new Error('No donations found to withdraw');

               const notes = [];
               data.forEach((donation) => {
                 const note = notes.find(n => n.id === donation.noteId);

                 if (note) {
                   note.amount = note.amount.add(utils.toBN(donation.amount));
                 } else {
                   notes.push({
                     id: donation.noteId,
                     amount: utils.toBN(donation.amount),
                   });
                 }
               });

               if (notes.length > 1) throw new Error('got multiple notes, but expecting 1');

               return notes[0];
            })
          };

          let txHash;
          let etherScanUrl;
          Promise.all([ getNetwork(), getWeb3(), getNote() ])
            .then(([ network, web3, note ]) => {
              const lppMilestone = new LPPMilestone(web3, milestone.pluginAddress);
              etherScanUrl = network.etherscan;

              return lppMilestone.withdraw(note.id, note.amount, { from: this.props.currentUser.address })
                .once('transactionHash', hash => {
                  txHash = hash;
                  withdraw(etherScanUrl, txHash);
                });
            })
            .then(() => {
              React.toast.success(`The milestone withdraw has been initiated! ${etherScanUrl}tx/${txHash}`);
            }).catch((e) => {
            console.error(e);

            let msg;
            if (txHash) {
              //TODO need to update feathers to reset the donations to previous state as this tx failed.
              msg = `Something went wrong with the transaction. ${etherScanUrl}tx/${txHash}`;
            } else if (e.message === 'No donations found to withdraw') {
              msg = "Nothing to withdraw. There are no donations to this milestone.";
            } else {
              msg = "Something went wrong with the transaction. Is your wallet unlocked?";
            }

            React.swal("Oh no!", msg, 'error');
          })
        }
      }
    })
  }

  withdraw(id) {
    React.swal({
      title: "Request Withdrawal",
      text: "For security reasons, there's a 3 day delay from the moment you request withdrawal before you can actually withdraw the money.",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Continue",
      closeOnConfirm: true,
    }, (isConfirmed) => {
      if (isConfirmed) {
        console.log('request payment')
        feathersClient.service('/milestones').patch(id, {
          status: 'Paid'
        }).catch((e) => {
          React.toast.error("Oh no! Something went wrong with the transaction. Please try again.")
        })
      }
    });
  }

  componentWillUnmount() {
    if (this.milestonesObserver) this.milestonesObserver.unsubscribe();
  }   

  render() {
    let { milestones, isLoading } = this.state
    let { currentUser } = this.props

    return (
      <div id="milestones-view">
        <div className="container-fluid page-layout">
          <div className="row">
            <div className="col-md-12">
              <h1>Your Milestones</h1>

              { isLoading && 
                <Loader className="fixed"/>
              }

              { !isLoading &&
                <div>
                  { milestones && milestones.length > 0 && 
                    <table className="table table-responsive table-striped table-hover">
                      <thead>
                        <tr>
                          <th>Name</th>     
                          <th>Number of donations</th>                     
                          <th>Amount donated</th>
                          <th>Status</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        { milestones.map((m, index) =>
                          <tr key={index} className={m.status === 'pending' ? 'pending' : ''}>
                            <td>{m.title}</td>
                            <td>{m.donationCount || 0}</td>
                            <td>{(m.totalDonated) ? utils.fromWei(m.totalDonated) : 0}</td>
                            <td>
                              {m.status === 'pending' || (Object.keys(m).includes('mined') && !m.mined) &&
                                <span><i className="fa fa-circle-o-notch fa-spin"></i>&nbsp;</span> }
                              {m.status}
                            </td>
                            <td>
                              { m.ownerAddress === currentUser.address &&
                                <a className="btn btn-link" onClick={()=>this.editMilestone(m._id)}>
                                  <i className="fa fa-edit"></i>&nbsp;Edit
                                </a>
                              }

                              { m.recipientAddress === currentUser.address && m.status === 'InProgress' && m.mined &&
                                <a className="btn btn-link" onClick={()=>this.markComplete(m)}>
                                  <i className="fa fa-edit"></i>&nbsp;Mark complete
                                </a>
                              }  

                              { m.reviewerAddress === currentUser.address && ['InProgress', 'NeedReview'].includes(m.status) && m.mined &&
                                <a className="btn btn-link" onClick={()=>this.cancelMilestone(m)}>
                                  <i className="fa fa-edit"></i>&nbsp;Cancel
                                </a>
                              }

                              { m.reviewerAddress === currentUser.address && m.status === 'NeedsReview' && m.mined &&
                                <span>
                                  <a className="btn btn-link" onClick={()=>this.approveMilestone(m)}>
                                    <i className="fa fa-edit"></i>&nbsp;Approve
                                  </a>

                                  <a className="btn btn-link" onClick={()=>this.rejectMilestone(m)}>
                                    <i className="fa fa-edit"></i>&nbsp;Reject
                                  </a>
                                </span>
                              }   

                              { m.recipientAddress === currentUser.address && m.status === 'Completed' && m.mined &&
                                <a className="btn btn-link" onClick={()=>this.requestWithdrawal(m)}>
                                  <i className="fa fa-edit"></i>&nbsp;Request Withdrawal
                                </a>
                              }

                              { m.recipientAddress === currentUser.address && m.status === 'InitializedWithdraw' &&
                                <p>You can withdraw the money in 3 days</p>
                              }  

                              { m.recipientAddress === currentUser.address && m.status === 'CanWithdraw' &&
                                <a className="btn btn-link" onClick={()=>this.withdraw(m._id)}>
                                  <i className="fa fa-edit"></i>&nbsp;withdraw
                                </a>
                              }                                                                                                                                                          
                            </td>
                          </tr>

                        )}
                      </tbody>
                    </table>                                      
                  }
                
                  { milestones && milestones.length === 0 &&
                    <center>You didn't create any milestones yet!</center>
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

export default MyMilestones

MyMilestones.propTypes = {
  currentUser: currentUserModel,
  history: PropTypes.object.isRequired
}