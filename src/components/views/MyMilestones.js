import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { utils } from 'web3';

import { feathersClient } from '../../lib/feathersClient'
import { isAuthenticated, redirectAfterWalletUnlock } from '../../lib/middleware'
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

    isAuthenticated(this.props.currentUser, this.props.history).then(() =>
      this.milestonesObserver = feathersClient.service('milestones').watch({ strategy: 'always' }).find({query: { 
        $or: [{
          ownerAddress: myAddress,
          reviewerAddress: myAddress,
          recipientAddress: myAddress
        }]
        }}).subscribe(
          resp => {
            console.log(resp.data)
            this.setState({ 
              milestones: resp.data.map((m) => {
                m.status = (m.projectId === 0) ? 'pending' : 'accepting donations' 
                return m
              }),
              hasError: false,
              isLoading: false
            })
          },
          err =>
            this.setState({ 
              isLoading: false, 
              hasError: true 
            })          
        )
    )   
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

  markComplete(id) {
    React.swal({
      title: "Mark as complete?",
      text: "Are you sure you want to mark this Milestone as complete?",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, mark complete!",
      closeOnConfirm: true,
    }, (isConfirmed) => {
      if(isConfirmed) this.updateMilestoneStatus('NeedsReview')
    })
  }

  cancelMilestone(id) {
    React.swal({
      title: "Cancel Milestone?",
      text: "Are you sure you want to cancel this Milestone?",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, cancel!",
      closeOnConfirm: true,
    }, (isConfirmed) => {
      if(isConfirmed) this.updateMilestoneStatus(id, 'Canceled')
    })
  }

  approveMilestone(id) {
    React.swal({
      title: "Approve Milestone?",
      text: "Are you sure you want to approve this Milestone?",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, approve!",
      closeOnConfirm: true,
    }, (isConfirmed) => {
      if(isConfirmed) this.updateMilestoneStatus(id, 'Comppleted')
    })
  }

  rejectMilestone(id) {
    React.swal({
      title: "Approve Milestone?",
      text: "Are you sure you want to approve this Milestone?",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, approve!",
      closeOnConfirm: true,
    }, (isConfirmed) => {
      if(isConfirmed) this.updateMilestoneStatus(id, 'InProgress')
    })
  }

  requestWithdrawel(id) {
    React.swal({
      title: "Request Withdrawel",
      text: "For security reasons, there's a 3 day delay from the moment you request withdrawel before you can actually withdraw the money.",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Continue",
      closeOnConfirm: true,
    }, (isConfirmed) => {
      if(isConfirmed) {
        console.log('request withdrawel')
        this.updateMilestoneStatus(id, 'InitializedWithdraw')
      }
    })
  }

  withdraw(id) {
    React.swal({
      title: "Request Withdrawel",
      text: "For security reasons, there's a 3 day delay from the moment you request withdrawel before you can actually withdraw the money.",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Continue",
      closeOnConfirm: true,
    }, (isConfirmed) => {
      if(isConfirmed) {
        console.log('request payment')
        this.updateMilestoneStatus(id, 'Paid')
      }
    })
  }

  updateMilestoneStatus(id, status) {
    feathersClient.service('/milestones').patch(id, {
      status: status
    }).catch((e) => {
      React.toast.error("Oh no! Something went wrong with the transaction. Please try again.")
    })
  }

  componentWillUnmount() {
    if(this.milestonesObserver) this.milestonesObserver.unsubscribe()
  }   



  render() {
    let { milestones, isLoading, currentUser } = this.state

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
                              {m.status === 'pending' && 
                                <span><i className="fa fa-circle-o-notch fa-spin"></i>&nbsp;</span> }
                              {m.status}
                            </td>
                            <td>
                              { m.ownerAddress === currentUser.address &&
                                <a className="btn btn-link" onClick={()=>this.editMilestone(m._id)}>
                                  <i className="fa fa-edit"></i>&nbsp;Edit
                                </a>
                              }

                              { m.recipientAddress === currentUser.address && m.status === 'InProgress' &&
                                <a className="btn btn-link" onClick={()=>this.markComplete(m._id)}>
                                  <i className="fa fa-edit"></i>&nbsp;Mark complete
                                </a>
                              }  

                              { m.reviewerAddress === currentUser.address && ['InProgress', 'NeedReview'].indexOf(m.status) > -1 &&
                                <a className="btn btn-link" onClick={()=>this.cancelMilestone(m._id)}>
                                  <i className="fa fa-edit"></i>&nbsp;Cancel
                                </a>
                              }

                              { m.reviewerAddress === currentUser.address && m.status === 'NeedsReview' &&
                                <span>
                                  <a className="btn btn-link" onClick={()=>this.approveMilestone(m._id)}>
                                    <i className="fa fa-edit"></i>&nbsp;Approve
                                  </a>

                                  <a className="btn btn-link" onClick={()=>this.rejectMilestone(m._id)}>
                                    <i className="fa fa-edit"></i>&nbsp;Reject
                                  </a>
                                </span>
                              }   

                              { m.recipientAddress === currentUser.address && m.status === 'Completed' &&
                                <a className="btn btn-link" onClick={()=>this.requestWithdrawel(m._id)}>
                                  <i className="fa fa-edit"></i>&nbsp;Request Withdrawel
                                </a>
                              }

                              { m.recipientAddress === currentUser.address && m.status === 'InitializedWithdraw' &&
                                <p>You can withdraw the money in 3 days</p>
                              }  

                              { m.recipientAddress === currentUser.address && m.status === 'CanWithdraw' &&
                                <a className="btn btn-link" onClick={()=>this.withDraw(m._id)}>
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