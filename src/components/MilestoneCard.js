import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { getTruncatedText, isOwner, getUserAvatar, getUserName } from './../lib/helpers'
import { redirectAfterWalletUnlock, checkWalletBalance } from './../lib/middleware'
import currentUserModel from '../models/currentUserModel'
import CardStats from './CardStats'
import Avatar from 'react-avatar'

/**
  A single milestone
**/

class MilestoneCard extends Component {

  viewMilestone() {
    this.props.history.push(`/campaigns/${ this.props.milestone.campaignId }/milestones/${ this.props.milestone._id}`)
  }

  // removeMilestone(e) {
  //   e.stopPropagation()
  //   this.props.removeMilestone()
  // }

  editMilestone(e) {
    e.stopPropagation()

    checkWalletBalance(this.props.wallet, this.props.history).then(()=>{  
      React.swal({
        title: "Edit Milestone?",
        text: "Are you sure you want to edit this milestone?",
        icon: "warning",
        dangerMode: true,
        buttons: ["Cancel", "Yes, edit"]
      }).then((isConfirmed) => {
        if(isConfirmed){
          redirectAfterWalletUnlock(`/campaigns/${ this.props.milestone.campaignId }/milestones/${ this.props.milestone._id}/edit`, this.props.wallet, this.props.history)
        } 
      })
    })
  }

  render(){
    const { milestone, currentUser } = this.props

    return(
      <div className="card milestone-card overview-card" onClick={()=>this.viewMilestone()}>
        <div className="card-body">
          <div className="card-avatar" onClick={(e)=>this.viewProfile(e)}>
            
            <Avatar size={30} src={getUserAvatar(milestone.owner)} round={true}/>                  
            <span className="owner-name">{getUserName(milestone.owner)}</span>

            { isOwner(milestone.owner.address, currentUser) &&
              <span className="pull-right">
                <a className="btn btn-link btn-edit" onClick={(e)=>this.editMilestone(e)}>
                  <i className="fa fa-edit"></i>
                </a>
              </span>
            }
          </div>

          <div className="card-img" style={{backgroundImage: `url(${milestone.image})`}}></div>

          <div className="card-content">
            <small>deadline: {milestone.completionDeadline}</small>
            <h4 className="card-title">{getTruncatedText(milestone.title, 30)}</h4>
            <div className="card-text">{milestone.summary}</div>
          </div>

          <div className="card-footer">
            <CardStats 
              type="milestone"
              donationCount={milestone.donationCount} 
              totalDonated={milestone.totalDonated} 
              maxAmount={milestone.maxAmount}
              milestonesCount={milestone.milestonesCount}
              status={milestone.status} />
          </div>
        </div>
      </div>
    )
  }
}

export default MilestoneCard

MilestoneCard.propTypes = {
  milestone: PropTypes.object.isRequired,
  removeMilestone: PropTypes.func.isRequired,
  currentUser: currentUserModel,
  history: PropTypes.object.isRequired,
  wallet: PropTypes.shape({
    unlocked: PropTypes.bool.isRequired,
    unlock: PropTypes.func.isRequired,
  })
}