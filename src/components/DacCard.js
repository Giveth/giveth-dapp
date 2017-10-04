import React, { Component } from 'react'

import { getTruncatedText } from './../lib/helpers'
import { isOwner } from './../lib/helpers'
import Avatar from 'react-avatar'
import CardStats from './CardStats'
import currentUserModel from './../models/currentUserModel'
import { feathersClient } from './../lib/feathersClient'
import Loader from './Loader'

class DacCard extends Component {
  // constructor(){
  //   super()

  //   this.state = {
  //     isLoadingCampaigns: true,
  //     campaigns: []
  //   }
  // }

  // componentWillMount(){
  //   if(this.props.dac.campaignsCount > 0) {
  //     console.log('need to load campaings')

  //     this.campaignsObserver = feathersClient.service('campaigns').watch({ strategy: 'always' }).find({
  //       query: {
  //         projectId: {
  //           $gt: '0' // 0 is a pending campaign
  //         },
  //         dacs: this.props.dac._id,
  //         $limit: 200,
  //         $select: [ 'title', '_id', 'image' ]
  //       },
  //     }).subscribe(
  //       resp => this.setState({ campaigns: resp.data, isLoadingCampaigns: false }),
  //       err => this.setState({ campaignsLoading: false })
  //     )

  //   } else {
  //     this.setState({ campaignsLoading: false })
  //   }
  // }

  // componentWillUnmount() {
  //   if(this.campaignsObserver) this.campaignsObserver.unsubscribe()
  // }   


  render(){
    const { dac, viewDAC, currentUser, removeDAC, editDAC } = this.props
    // const { campaigns, isLoadingCampaigns } = this.state

    return(
      <div className="card dac-card" id={dac._id} onClick={()=>viewDAC(dac._id)}>
        <img className="card-img-top" src={dac.image} alt=""/>
        <div className="card-body">
          
          <div onClick={(e)=>this.viewProfile(e, dac.owner.address)}>
            <Avatar size={30} src={dac.owner.avatar} round={true}/>                  
            <span className="small">{dac.owner.name}</span>
          </div>

          <h4 className="card-title">{getTruncatedText(dac.title, 30)}</h4>
          <div className="card-text">{dac.summary}</div>

          <hr/>

          <CardStats donationCount={dac.donationCount} totalDonated={dac.totalDonated} campaignsCount={dac.campaignsCount} />

          {/*
            <hr/>

            <strong>{dac.campaignsCount} campaigns</strong>
            { dac.campaignsCount === 0 &&
              <p>No campaigns attached to this DAC</p>
            }

            { dac.campaignsCount > 0 && isLoadingCampaigns &&
              <Loader className="small" />
            }

            { dac.campaignsCount > 0 && !isLoadingCampaigns &&
              <div className="campaigns-container">
                { campaigns.map((c, index) => 
                  <div key={index} className="campaign-thumbnail" style={{backgroundImage: `url(${c.image})`}}></div>
                )}
              </div>
            }
          */}
                                       
          <div>
            { isOwner(dac.owner.address, currentUser) &&
              <span>
                {/*
                  <a className="btn btn-link" onClick={(e)=>removeDAC(e, dac._id)}>
                    <i className="fa fa-trash"></i>
                  </a>
                */}
                <a className="btn btn-link" onClick={(e)=>editDAC(e, dac._id)}>
                  <i className="fa fa-edit"></i>
                </a>
              </span>
            }
          </div>

        </div>
      </div>
    )
  }
}
export default DacCard