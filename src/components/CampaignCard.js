import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { isOwner, getTruncatedText, getUserName, getUserAvatar } from './../lib/helpers'
import Avatar from 'react-avatar'
import CardStats from './CardStats'
import currentUserModel from './../models/currentUserModel'
import { redirectAfterWalletUnlock } from './../lib/middleware'

class CampaignCard extends Component {

  viewCampaign(id){
    this.props.history.push("/campaigns/" + this.props.campaign._id)
  } 

  editCampaign(e) {
    e.stopPropagation()

    React.swal({
      title: "Edit Campaign?",
      text: "Are you sure you want to edit this Campaign?",
      icon: "warning",
      dangerMode: true,
      buttons: ["Cancel", "Yes, edit"]      
    }).then((isConfirmed) => {
      if(isConfirmed){
        redirectAfterWalletUnlock("/campaigns/" + this.props.campaign._id + "/edit", this.props.wallet, this.props.history)
      }
    });
  } 

  viewProfile(e){
    e.stopPropagation()
    this.props.history.push("/profile/" + this.props.campaign.owner.address)
  }    


  render(){
    const { campaign, currentUser } = this.props

    return(
      <div className="card overview-card" id={campaign._id} onClick={()=>this.viewCampaign()}>
        <div className="card-body">
          <div className="card-avatar" onClick={(e)=>this.viewProfile(e, campaign.owner.address)}>

            <Avatar size={30} src={getUserAvatar(campaign.owner)} round={true}/>                  
            <span className="owner-name">{getUserName(campaign.owner)}</span>

            { isOwner(campaign.owner.address, currentUser) &&
              <span className="pull-right">
                <a className="btn btn-link btn-edit" onClick={(e)=>this.editCampaign(e)}>
                  <i className="fa fa-edit"></i>
                </a>
              </span>
            }
          </div>
                  
          <div className="card-img" style={{backgroundImage: `url(${campaign.image})`}}></div>

          <div className="card-content">
            <h4 className="card-title">{getTruncatedText(campaign.title, 30)}</h4>
            <div className="card-text">{campaign.summary}</div>
          </div>

          <div className="card-footer">
            <CardStats 
              type="campaign"
              donationCount={campaign.donationCount} 
              totalDonated={campaign.totalDonated} 
              milestonesCount={campaign.milestonesCount} />
          </div>

        </div>
      </div>
    )
  }
}
export default CampaignCard

CampaignCard.propTypes = {
  campaign: PropTypes.object.isRequired,
  removeCampaign: PropTypes.func,
  currentUser: currentUserModel,
  wallet: PropTypes.shape({
    unlocked: PropTypes.bool.isRequired,
    lock: PropTypes.func.isRequired,
  }).isRequired,
  history: PropTypes.object.isRequired
};