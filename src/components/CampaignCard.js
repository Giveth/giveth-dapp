import React, { Component } from 'react'

import { getTruncatedText } from './../lib/helpers'
import { isOwner } from './../lib/helpers'
import Avatar from 'react-avatar'
import CardStats from './CardStats'
import currentUserModel from './../models/currentUserModel'

class CampaignCard extends Component {
  render(){
    const { campaign, viewCampaign, currentUser, removeCampaign, editCampaign } = this.props

    return(
      <div className="card overview-card" id={campaign._id} onClick={()=>viewCampaign(campaign._id)}>
        <div className="card-body">
          <div className="card-avatar" onClick={(e)=>this.viewProfile(e, campaign.owner.address)}>
            { campaign.owner.avatar &&
              <Avatar size={30} src={campaign.owner.avatar} round={true}/>                  
            }

            { campaign.owner.name &&
              <span className="owner-name">{campaign.owner.name}</span>
            }

            { isOwner(campaign.owner.address, currentUser) &&
              <span className="pull-right">
                <a className="btn btn-link btn-edit" onClick={(e)=>editCampaign(e, campaign._id)}>
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
            <CardStats donationCount={campaign.donationCount} totalDonated={campaign.totalDonated} campaignsCount={campaign.campaignsCount} />
          </div>

        </div>
      </div>
    )
  }
}
export default CampaignCard