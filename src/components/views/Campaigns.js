import React, { Component } from 'react'
import PropTypes from 'prop-types';

import JoinGivethCommunity from '../JoinGivethCommunity'
import { feathersClient } from '../../lib/feathersClient'
import { isOwner } from '../../lib/helpers'
import Avatar from 'react-avatar'
import { redirectAfterWalletUnlock } from '../../lib/middleware'

import { getTruncatedText } from '../../lib/helpers'

import Masonry, {ResponsiveMasonry} from "react-responsive-masonry"
import currentUserModel from '../../models/currentUserModel'

/**
  The campaigns view
**/

class Campaigns extends Component {
  
  removeCampaign(e, id){
    e.stopPropagation()

    React.swal({
      title: "Delete Campaign?",
      text: "You will not be able to recover this Campaign!",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, delete it!",
      closeOnConfirm: true,
    }, () => {
      const campaigns = feathersClient.service('/campaigns');
      campaigns.remove(id).then(campaign => {
        React.toast.success("Your Campaign has been deleted.")
      })
    });
  }

  editCampaign(e, id) {
    e.stopPropagation()

    React.swal({
      title: "Edit Campaign?",
      text: "Are you sure you want to edit this Campaign?",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, continue editing!",
      closeOnConfirm: true,
    }, () => redirectAfterWalletUnlock("/campaigns/" + id + "/edit", this.props.wallet, this.props.history));
  }  

  viewCampaign(id){
    this.props.history.push("/campaigns/" + id)
  } 

  viewProfile(e, id){
    e.stopPropagation()
    this.props.history.push("/profile/" + id)
  }     

  render() {
    const { currentUser, wallet, campaigns } = this.props
    
    return (
      <div id="campaigns-view" className="card-view">
        <JoinGivethCommunity currentUser={currentUser} walletUnlocked={(wallet && wallet.unlocked)}/>

        <div className="container-fluid page-layout reduced-padding">
          { campaigns.data && campaigns.data.length > 0 && 
            <ResponsiveMasonry columnsCountBreakPoints={{350: 1, 750: 2, 900: 3, 1024: 4, 1470: 5}}>
              <Masonry gutter="10px">
                { campaigns.data.map((campaign, index) =>            
                  <div className="card" id={campaign._id} key={index} onClick={()=>this.viewCampaign(campaign._id)}>
                    <img className="card-img-top" src={campaign.image} alt=""/>
                    <div className="card-body">

                      <div onClick={(e)=>this.viewProfile(e, campaign.owner.address)}>
                        <Avatar size={30} src={campaign.owner.avatar} round={true}/>                  
                        <span className="small">{campaign.owner.name}</span>
                      </div>

                      <h4 className="card-title">{getTruncatedText(campaign.title, 30)}</h4>
                      <div className="card-text">{campaign.summary}</div>

                      <div>                  
                        { isOwner(campaign.owner.address, currentUser.address) && 
                          <span>
                            <a className="btn btn-link" onClick={(e)=>this.removeCampaign(e, campaign._id)}>
                              <i className="fa fa-trash"></i>
                            </a>
                            <a className="btn btn-link" onClick={(e)=>this.editCampaign(e, campaign._id)}>
                              <i className="fa fa-edit"></i>
                            </a>
                          </span>
                        }
                      </div>

                    </div>
                  </div>
                )}
              </Masonry>
            </ResponsiveMasonry>                  
          }
 

          { campaigns.data && campaigns.data.length === 0 &&
            <center>There are no campaigns yet!</center>
          }            

        </div>
      </div>
    )
  } 
}

export default Campaigns

Campaigns.propTypes = {
  currentUser: currentUserModel,
  history: PropTypes.object.isRequired
}