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
    const campaigns = feathersClient.service('/campaigns');
    campaigns.remove(id).then(campaign => console.log('Remove a campaign', campaign));    
  }

  render() {
    const { currentUser } = this.props
    
    return (
      <div id="campaigns-view">
        <JoinGivethCommunity authenticated={(this.props.currentUser)}/>

        <div className="container-fluid page-layout reduced-padding">
          { this.props.campaigns.data && this.props.campaigns.data.length > 0 && 
            <ResponsiveMasonry columnsCountBreakPoints={{350: 1, 750: 2, 900: 3, 1024: 4, 1470: 5}}>
              <Masonry gutter="10px">
                { this.props.campaigns.data.map((campaign, index) =>            
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
                            <Link className="btn btn-link" to={`/campaigns/${ campaign._id }/edit`}>
                              <i className="fa fa-edit"></i>
                            </Link>
                          </span>
                        }
                      </div>

                    </div>
                  </div>
                )}
              </Masonry>
            </ResponsiveMasonry>                  
          }
 

          { this.props.campaigns.data && this.props.campaigns.data.length === 0 &&
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