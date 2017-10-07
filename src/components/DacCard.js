import React, { Component } from 'react'

import { getTruncatedText, getUserAvatar, isOwner, getUserName } from './../lib/helpers'
import Avatar from 'react-avatar'
import CardStats from './CardStats'
import currentUserModel from './../models/currentUserModel'
import { redirectAfterWalletUnlock } from './../lib/middleware'

class DacCard extends Component {
  viewProfile(e){
    e.stopPropagation()
    this.props.history.push("/profile/" + this.props.dac.owner.address)
  }  

  viewDAC(){
    this.props.history.push("/dacs/" + this.props.dac._id)
  }  


  editDAC(e) {
    e.stopPropagation()

    React.swal({
      title: "Edit Community?",
      text: "Are you sure you want to edit the description of this Community?",
      icon: "warning",
      buttons: ["Cancel", "Yes, edit"],      
      dangerMode: true
    }).then((isConfirmed) => {
      if(isConfirmed){
        redirectAfterWalletUnlock("/dacs/" + this.props.dac._id + "/edit", this.props.wallet, this.props.history)
      }
    });
  }  

  render(){
    const { dac, currentUser, removeDAC } = this.props

    return(
      <div className="card overview-card" id={dac._id} onClick={()=>this.viewDAC()}>
        <div className="card-body">
          <div className="card-avatar" onClick={(e)=>this.viewProfile(e)}>
            
            <Avatar size={30} src={getUserAvatar(dac.owner)} round={true}/>                  
            <span className="owner-name">{getUserName(dac.owner)}</span>

            { isOwner(dac.owner.address, currentUser) &&
              <span className="pull-right">
                <a className="btn btn-link btn-edit" onClick={(e)=>this.editDAC(e)}>
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
            <CardStats 
              type="dac"
              donationCount={dac.donationCount} 
              totalDonated={dac.totalDonated} 
              campaignsCount={dac.campaignsCount} />
          </div>

        </div>
      </div>
    )
  }
}
export default DacCard