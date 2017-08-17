import React, { Component } from 'react'
import JoinGivethCommunity from '../JoinGivethCommunity'
import { feathersClient } from '../../lib/feathersClient'
import { Link } from 'react-router-dom'

/**
  The campaigns view
**/

class Campaigns extends Component {
  
  removeCampaign(id){
    const campaigns = feathersClient.service('/campaigns');
    campaigns.remove(id).then(campaign => console.log('Remove a campaign', campaign));    
  }

  render() {
    return (
      <div id="campaigns-view">
        <JoinGivethCommunity/>

        <div className="container-fluid page-layout">
          <div className="row">
            { this.props.campaigns.data && this.props.campaigns.data.length > 0 && this.props.campaigns.data.map((campaign, index) =>
              <div className="col-md-6 card-container" key={index}>
                <div className="card" id={campaign._id}>
                  <img className="card-img-top" src={campaign.image} alt=""/>
                  <div className="card-body">
                    <Link to={`/campaigns/${ campaign._id }`}>
                      <h4 className="card-title">{campaign.title}</h4>
                    </Link>
                    <div className="card-text" dangerouslySetInnerHTML={{__html: campaign.description}}></div>
                    <a className="btn btn-link" onClick={()=>this.removeCampaign(campaign._id)}>
                      <i className="fa fa-trash"></i>
                    </a>
                    <Link className="btn btn-link" to={`/campaigns/${ campaign._id }/edit`}>
                      <i className="fa fa-edit"></i>
                    </Link>                    
                  </div>
                </div>
              </div>
            )}

            { this.props.campaigns.data && this.props.campaigns.data.length === 0 &&
              <center>There are no campaigns yet!</center>
            }            
          </div>
        </div>
      </div>
    )
  } 
}

export default Campaigns