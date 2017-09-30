import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { feathersClient } from '../../lib/feathersClient'
import { Link } from 'react-router-dom'
import { isAuthenticated, redirectAfterWalletUnlock } from '../../lib/middleware'
import Loader from '../Loader'
import { getTruncatedText } from '../../lib/helpers'
import currentUserModel from '../../models/currentUserModel'


import Avatar from 'react-avatar'
import Masonry, {ResponsiveMasonry} from "react-responsive-masonry"

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
      feathersClient.service('milestones').find({query: { 
        $or: [{
          ownerAddress: myAddress,
          reviewerAddress: myAddress,
          recipientAddress: myAddress
        }]
        }})
        .then((resp) =>
          this.setState({ 
            milestones: resp.data.map((m) => {
              m.status = (m.projectId === 0) ? 'pending' : 'accepting donations' 
              return m
            }),
            hasError: false,
            isLoading: false
          }))
        .catch(() => 
          this.setState({ 
            isLoading: false, 
            hasError: true 
          }))
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
    }, () => redirectAfterWalletUnlock("/milestones/" + id + "/edit", this.props.wallet, this.props.history));
  }  


  render() {
    let { milestones, pendingMilestones, isLoading } = this.state

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
                            <td>{m.donationCount}</td>
                            <td>{m.totalDonated}</td>
                            <td>
                              {m.status === 'pending' && 
                                <span><i className="fa fa-circle-o-notch fa-spin"></i>&nbsp;</span> }
                              {m.status}
                            </td>
                            <td>
                              <a className="btn btn-link" onClick={()=>this.editCampaign(m._id)}>
                                <i className="fa fa-edit"></i>
                              </a>
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