import React, { Component } from 'react'

import { getTruncatedText } from './../lib/helpers'
import { isOwner } from './../lib/helpers'
import Avatar from 'react-avatar'
import CardStats from './CardStats'
import currentUserModel from './../models/currentUserModel'
import { feathersClient } from './../lib/feathersClient'
import Loader from './Loader'

class DacCard extends Component {
  render(){
    const { dac, viewDAC, currentUser, removeDAC, editDAC } = this.props

    return(
      <div className="card overview-card" id={dac._id} onClick={()=>viewDAC(dac._id)}>
        <div className="card-body">
          <div className="card-avatar" onClick={(e)=>this.viewProfile(e, dac.owner.address)}>
            <Avatar size={30} src={dac.owner.avatar} round={true}/>                  
            <span className="owner-name">{dac.owner.name}</span>

            { isOwner(dac.owner.address, currentUser) &&
              <span className="pull-right">
                <a className="btn btn-link btn-edit" onClick={(e)=>editDAC(e, dac._id)}>
                  <i className="fa fa-edit"></i>
                </a>
              </span>
            }
          </div>
                  
          <div className="card-img" style={{backgroundImage: `url(${dac.image})`}}></div>

          <div className="card-content">
            <h4 className="card-title">{getTruncatedText(dac.title, 30)}</h4>
            <div className="card-text">{dac.summary}</div>
          </div>

          <div className="card-footer">
            <CardStats donationCount={dac.donationCount} totalDonated={dac.totalDonated} campaignsCount={dac.campaignsCount} />
          </div>

        </div>
      </div>
    )
  }
}
export default DacCard