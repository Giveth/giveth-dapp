import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { utils } from 'web3';
import LPPMilestone from 'lpp-milestone';

import { feathersClient } from '../../lib/feathersClient'
import { isAuthenticated, redirectAfterWalletUnlock, checkWalletBalance } from '../../lib/middleware'
import getNetwork from '../../lib/blockchain/getNetwork';
import getWeb3 from '../../lib/blockchain/getWeb3';
import Loader from '../Loader'
import currentUserModel from '../../models/currentUserModel'
import { displayTransactionError } from '../../lib/helpers'

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
  //     icon: "warning",
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
    checkWalletBalance(this.props.wallet, this.props.history).then(()=>     
      React.swal({
        title: "Edit Milestone?",
        text: "Are you sure you want to edit this Milestone?",
        icon: "warning",
        dangerMode: true,
        buttons: ["Cancel", "Yes, edit"]      
      }).then((isConfirmed) => {
        if(isConfirmed) redirectAfterWalletUnlock("/milestones/" + id + "/edit", this.props.wallet, this.props.history)
      })
    )
  }  

  markComplete(milestone) {
    checkWalletBalance(this.props.wallet, this.props.history).then(()=>        
      React.swal({
        title: "Mark as complete?",
        text: "Are you sure you want to mark this Milestone as complete?",
        icon: "warning",
        dangerMode: true,
        buttons: ["Cancel", "Yes, mark complete"]      
      }).then((isConfirmed) => {
        if(isConfirmed) {
          feathersClient.service('/milestones').patch(milestone._id, {
            status: 'NeedsReview',
          }).then(() => {
            React.toast.info(<p>Your milestone has been marked as complete...</p>)
          }).catch((e) => {
            console.log('Error marking milestone complete ->', e);
            React.swal({
              title: "Oh no!",
              content: "<p>Something went wrong with the transaction. Is your wallet unlocked?</p>",
              icon: 'error',
            });
          })
        }
      })
    )
  }

  cancelMilestone(milestone) {
    checkWalletBalance(this.props.wallet, this.props.history).then(()=>     
      React.swal({
        title: "Cancel Milestone?",
        text: "Are you sure you want to cancel this Milestone?",
        icon: "warning",
        buttons: ["I changed my mind", "Yes, cancel"],  
        dangerMode: true
      }).then((isConfirmed) => {
        if(isConfirmed) {
          const cancel = (etherScanUrl, txHash) => {
            feathersClient.service('/milestones').patch(milestone._id, {
              status: 'Canceled',
              mined: false,
              txHash
            }).then(() => {
              React.toast.info(<p>Cancelling this milestone is pending...<br/><a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">View transaction</a></p>)
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
              React.toast.success(<p>The milestone has been cancelled!<br/><a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">View transaction</a></p>)
            }).catch((e) => {
              console.error(e);

              displayTransactionError(txHash, etherScanUrl)
          })
        }
      })
    )
  }

  approveMilestone(milestone) {
    checkWalletBalance(this.props.wallet, this.props.history).then(()=>       
      React.swal({
        title: "Approve Milestone?",
        text: "Are you sure you want to approve this Milestone?",
        icon: "warning",
        dangerMode: true,
        buttons: ["Cancel", "Yes, approve"]
      }).then((isConfirmed) => {
        if(isConfirmed) {
          const approve = (etherScanUrl, txHash) => {
            feathersClient.service('/milestones').patch(milestone._id, {
              status: 'Completed',
              mined: false,
              txHash
            }).then(() => {
              React.toast.info(<p>Approving this milestone is pending...<br/><a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">View transaction</a></p>)
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
              React.toast.success(<p>The milestone has been approved!<br/><a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">View transaction</a></p>)
            }).catch((e) => {
              console.error(e);

              displayTransactionError(txHash, etherScanUrl)
          })
        }
      })
    )
  }

  rejectMilestone(milestone) {
    checkWalletBalance(this.props.wallet, this.props.history).then(()=>      
      React.swal({
        title: "Reject Milestone?",
        text: "Are you sure you want to reject this Milestone?",
        icon: "warning",
        dangerMode: true,
        buttons: ["Cancel", "Yes, reject"]
      }).then((isConfirmed) => {
        if(isConfirmed) {
          feathersClient.service('/milestones').patch(milestone._id, {
            status: 'InProgress',
          }).then(() => {
            React.toast.info(<p>You have rejected this milestone...</p>)
          }).catch((e) => {
            console.log('Error rejecting completed milestone ->', e);
            React.swal({
              title: "Oh no!",
              content: "<p>Something went wrong with the transaction. Is your wallet unlocked?</p>",
              icon: 'error',
            });
          });
        }
      })
    )
  }

  requestWithdrawal(milestone) {
    checkWalletBalance(this.props.wallet, this.props.history).then(()=>       
      React.swal({
        title: "Request Withdrawal",
        text: "For security reasons, there's a 3 day delay from the moment you request withdrawal before you can actually withdraw the money.",
        icon: "warning",
        dangerMode: true,
        buttons: ["Cancel", "Yes, request withdrawal"]
      }).then((isConfirmed) => {
        if(isConfirmed) {
          console.log('request withdrawal')
          if(isConfirmed) {
            const withdraw = (etherScanUrl, txHash) => {
              feathersClient.service('/milestones').patch(milestone._id, {
                status: 'Paying',
                mined: false,
                txHash
              }).then(() => {
                React.toast.info(<p>Request withdrawal from milestone...<br/><a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">View transaction</a></p>)
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

            const getPledges = () => {
              return feathersClient.service('donations').find({
                query: {
                  ownerType: 'milestone',
                  ownerId: milestone._id
                }
              })
              .then(({ data }) => {
                 if (data.length === 0) throw new Error('No donations found to withdraw');

                 const pledges = [];
                 data.forEach((donation) => {
                   const pledge = pledges.find(n => n.id === donation.pledgeId);

                   if (pledge) {
                     pledge.amount = pledge.amount.add(utils.toBN(donation.amount));
                   } else {
                     pledges.push({
                       id: donation.pledgeId,
                       amount: utils.toBN(donation.amount),
                     });
                   }
                 });

                 return pledges.map(note => {
                   return '0x' + utils.padLeft(utils.toHex(note.amount).substring(2), 48) + utils.padLeft(utils.toHex(note.id).substring(2), 16);
                 });
              })
            };

            let txHash;
            let etherScanUrl;
            Promise.all([ getNetwork(), getWeb3(), getPledges() ])
              .then(([ network, web3, pledges ]) => {
                const lppMilestone = new LPPMilestone(web3, milestone.pluginAddress);
                etherScanUrl = network.etherscan;

                return lppMilestone.mWithdraw(pledges, { from: this.props.currentUser.address })
                  .once('transactionHash', hash => {
                    txHash = hash;
                    withdraw(etherScanUrl, txHash);
                  });
              })
              .then(() => {
                React.toast.info(<p>The milestone withdraw has been initiated...<br/><a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">View transaction</a></p>)
              }).catch((e) => {
              console.error(e);

              let msg;
              if (txHash) {
                //TODO need to update feathers to reset the donations to previous state as this tx failed.
                msg = React.swal.msg(<p>Something went wrong with the transaction.<br/><a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">View transaction</a></p>);
              } else if (e.message === 'No donations found to withdraw') {
                msg = React.swal.msg(<p>Nothing to withdraw. There are no donations to this milestone.</p>);
              } else {
                msg = React.swal.msg(<p>Something went wrong with the transaction. Is your wallet unlocked?</p>);
              }

              React.swal({
                title: "Oh no!",
                content: msg,
                icon: 'error'
              });
            })
          }
        }
      })
    )
  }

  collect(milestone) {
    checkWalletBalance(this.props.wallet, this.props.history).then(()=>       
      React.swal({
        title: "Collect Funds",
        text: "The funds will be transferred to you wallet.",
        icon: "warning",
        dangerMode: true,
        buttons: ["Cancel", "Yes, collect"]
      }).then((isConfirmed) => {
        if(isConfirmed) {
          if(isConfirmed) {
            const collect = (etherScanUrl, txHash) => {
              feathersClient.service('/milestones').patch(milestone._id, {
                status: 'Paid',
                mined: false,
                txHash
              }).then(() => {
                React.toast.info(<p>Collecting funds from milestone...<br/><a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">View transaction</a></p>)
              }).catch((e) => {
                console.log('Error updating feathers cache ->', e);
              });
            };

            let txHash;
            let etherScanUrl;
            Promise.all([ getNetwork(), getWeb3() ])
              .then(([ network, web3 ]) => {
                const lppMilestone = new LPPMilestone(web3, milestone.pluginAddress);
                etherScanUrl = network.etherscan;

                return lppMilestone.collect({ from: this.props.currentUser.address })
                  .once('transactionHash', hash => {
                    txHash = hash;
                    collect(etherScanUrl, txHash);
                  });
              })
              .catch((e) => {
                console.error(e);
                displayTransactionError(txHash, etherScanUrl)
              });
          }
        }
      })
    )
  }

  componentWillUnmount() {
    if (this.milestonesObserver) this.milestonesObserver.unsubscribe();
  }   

  render() {
    let { milestones, isLoading } = this.state
    let { currentUser } = this.props

    return (
      <div id="milestones-view">
        <div className="container-fluid page-layout dashboard-table-view">
          <div className="row">
            <div className="col-md-10 m-auto">

              { isLoading || (milestones && milestones.length > 0) &&
                <h1>Your milestones</h1>
              }              

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
                              {(m.status === 'pending' || (Object.keys(m).includes('mined') && !m.mined)) &&
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
                                <a className="btn btn-success btn-sm" onClick={()=>this.markComplete(m)}>
                                  <i className="fa fa-check-square-o"></i>&nbsp;Mark complete
                                </a>
                              }  

                              { m.reviewerAddress === currentUser.address && ['InProgress', 'NeedReview'].includes(m.status) && m.mined &&
                                <a className="btn btn-danger btn-sm" onClick={()=>this.cancelMilestone(m)}>
                                  <i className="fa fa-times"></i>&nbsp;Cancel
                                </a>
                              }

                              { m.reviewerAddress === currentUser.address && m.status === 'NeedsReview' && m.mined &&
                                <span>
                                  <a className="btn btn-success btn-sm" onClick={()=>this.approveMilestone(m)}>
                                    <i className="fa fa-thumbs-up"></i>&nbsp;Approve
                                  </a>

                                  <a className="btn btn-danger btn-sm" onClick={()=>this.rejectMilestone(m)}>
                                    <i className="fa fa-thumbs-down"></i>&nbsp;Reject
                                  </a>
                                </span>
                              }   

                              { m.recipientAddress === currentUser.address && m.status === 'Completed' && m.mined && m.donationCount > 0 &&
                                <a className="btn btn-success btn-sm" onClick={()=>this.requestWithdrawal(m)}>
                                  <i className="fa fa-usd"></i>&nbsp;Request Withdrawal
                                </a>
                              }

                              { m.recipientAddress === currentUser.address && m.status === 'Paying' &&
                                <p>Withdraw authorization pending. You will be able to collect the funds when confirmed.</p>
                              }

                              { m.recipientAddress === currentUser.address && m.status === 'CanWithdraw' && m.mined &&
                              <a className="btn btn-success btn-sm" onClick={()=>this.collect(m)}>
                                <i className="fa fa-usd"></i>&nbsp;Collect
                              </a>
                              }
                            </td>
                          </tr>

                        )}
                      </tbody>
                    </table>                                      
                  }
                
                  { milestones && milestones.length === 0 &&
                    <div>            
                      <center>
                        <h3>You didn't create any milestones yet!</h3>
                        <img className="empty-state-img" src={process.env.PUBLIC_URL + "/img/delegation.svg"} width="200px" height="200px" />
                      </center>
                    </div>  
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