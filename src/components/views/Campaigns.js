import React, { Component } from 'react'
import PropTypes from 'prop-types';

import JoinGivethCommunity from '../JoinGivethCommunity'
import { feathersClient } from '../../lib/feathersClient'
import { Link } from 'react-router-dom'
import { isOwner } from '../../lib/helpers'
import DonateButton from '../DonateButton'
import Avatar from 'react-avatar'
import Masonry, {ResponsiveMasonry} from "react-responsive-masonry"

/**
  The campaigns view
**/

class Campaigns extends Component {
  
  removeCampaign(id){
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

  editCampaign(id) {
    React.swal({
      title: "Edit Campaign?",
      text: "Are you sure you want to edit this Campaign?",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, continue editing!",
      closeOnConfirm: true,
    }, () => this.props.history.push("/campaigns/" + id + "/edit"));
  }  

  render() {
    const { currentUser, wallet, campaigns } = this.props
    
    return (
      <div id="campaigns-view">
        <JoinGivethCommunity authenticated={currentUser} walletUnlocked={(wallet && wallet.unlocked)}/>

        <div className="container-fluid page-layout reduced-padding">
          { campaigns.data && campaigns.data.length > 0 && 
            <ResponsiveMasonry columnsCountBreakPoints={{350: 1, 750: 2, 900: 3, 1024: 4, 1470: 5}}>
              <Masonry gutter="10px">
                { campaigns.data.map((campaign, index) =>            
                  <div className="card" id={campaign._id} key={index}>
                    <img className="card-img-top" src={campaign.image} alt=""/>
                    <div className="card-body">

                      <Link to={`/profile/${ campaign.owner.address }`}>
                        <Avatar size={30} src={campaign.owner.avatar} round={true}/>                  
                        <span className="small">{campaign.owner.name}</span>
                      </Link>

                      <Link to={`/campaigns/${ campaign._id }`}>
                        <h4 className="card-title">{campaign.title}</h4>
                      </Link>
                      <div className="card-text" dangerouslySetInnerHTML={{__html: campaign.description}}></div>

                      <div>
                        <DonateButton type="campaign" model={campaign}/>
                  
                        { isOwner(campaign.owner.address, currentUser) && 
                          <span>
                            <a className="btn btn-link" onClick={()=>this.removeCampaign(campaign._id)}>
                              <i className="fa fa-trash"></i>
                            </a>
                            <a className="btn btn-link" onClick={()=>this.editCampaign(campaign._id)}>
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
  currentUser: PropTypes.string,
  history: PropTypes.object.isRequired
}