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
      milestones: [],
      pendingMilestones: [],
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
            milestones: resp.data.filter(milestone => (milestone.projectId)),
            pendingMilestones: resp.data.filter(milestone => !(milestone.projectId)),
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


  removeMilestone(id){
    React.swal({
      title: "Delete Milestone?",
      text: "You will not be able to recover this Milestone!",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, delete it!",
      closeOnConfirm: true,
    }, () => {
      const milestones = feathersClient.service('/milestones');
      milestones.remove(id).then(milestone => {
        React.toast.success("Your Milestone has been deleted.")
      })
    });
  }

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
                  {pendingMilestones.length > 0 &&
                    <p>{pendingMilestones.length} pending milestones</p>
                  }

                  { milestones && milestones.length > 0 && 
                    <ResponsiveMasonry columnsCountBreakPoints={{350: 1, 750: 2, 900: 3, 1024: 4, 1470: 5}}>
                      <Masonry gutter="10px"> 
                        { milestones.map((milestone, index) =>

                          <div className="card" id={milestone._id} key={index}>
                            <img className="card-img-top" src={milestone.image} alt=""/>
                            <div className="card-body">
                            
                              <Link to={`/profile/${ milestone.owner.address }`}>
                                <Avatar size={30} src={milestone.owner.avatar} round={true}/>                  
                                <span className="small">{milestone.owner.name}</span>
                              </Link>

                              <Link to={`/milestones/${ milestone._id }`}>
                                <h4 className="card-title">{getTruncatedText(milestone.title, 30)}</h4>
                              </Link>
                              <div className="card-text">{milestone.summary}</div>

                              <div>
                                <a className="btn btn-link" onClick={()=>this.removeMilestone(milestone._id)}>
                                  <i className="fa fa-trash"></i>
                                </a>
                                <a className="btn btn-link" onClick={()=>this.editMilestone(milestone._id)}>
                                  <i className="fa fa-edit"></i>
                                </a>
                              </div>

                            </div>
                          </div>
                        )}
                      </Masonry>
                    </ResponsiveMasonry>                    
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