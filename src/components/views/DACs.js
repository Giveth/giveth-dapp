import React, { Component } from 'react'
import PropTypes from 'prop-types'

import JoinGivethCommunity from '../JoinGivethCommunity'
// import { feathersClient } from '../../lib/feathersClient'
import { isOwner } from '../../lib/helpers'
import { redirectAfterWalletUnlock } from '../../lib/middleware'

import { getTruncatedText } from '../../lib/helpers'

import Avatar from 'react-avatar'
import Masonry, {ResponsiveMasonry} from "react-responsive-masonry"

import currentUserModel from '../../models/currentUserModel'

/**
  The dacs view
**/

class DACs extends Component {

  // removeDAC(e, id){
  //   e.stopPropagation()

  //   React.swal({
  //     title: "Delete DAC?",
  //     text: "You will not be able to recover this DAC!",
  //     type: "warning",
  //     showCancelButton: true,
  //     confirmButtonColor: "#DD6B55",
  //     confirmButtonText: "Yes, delete it!",
  //     closeOnConfirm: true,
  //   }, () => {
  //     const dacs = feathersClient.service('/causes');
  //     dacs.remove(id).then(dac => {
  //       React.toast.success("Your DAC has been deleted.")
  //     })
  //   });
  // }

  editDAC(e, id) {
    e.stopPropagation()

    React.swal({
      title: "Edit DAC?",
      text: "Are you sure you want to edit this DAC?",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, continue editing!",
      closeOnConfirm: true,
    }, () => redirectAfterWalletUnlock("/dacs/" + id + "/edit", this.props.wallet, this.props.history))
  }

  viewDAC(id){
    this.props.history.push("/dacs/" + id)
  }

  viewProfile(e, id){
    e.stopPropagation()
    this.props.history.push("/profile/" + id)
  }  

  render() {
    const { currentUser, wallet, dacs } = this.props

    return (
      <div id="dacs-view" className="card-view">
        <JoinGivethCommunity currentUser={currentUser} walletUnlocked={(wallet && wallet.unlocked)}/>

        <div className="container-fluid page-layout reduced-padding">

          { dacs.data && dacs.data.length > 0 && 
            <ResponsiveMasonry columnsCountBreakPoints={{350: 1, 750: 2, 900: 3, 1024: 4, 1470: 5}}>
              <Masonry gutter="10px"> 
                { dacs.data.map((dac, index) =>

                  <div className="card" id={dac._id} key={index} onClick={()=>this.viewDAC(dac._id)}>
                    <img className="card-img-top" src={dac.image} alt=""/>
                    <div className="card-body">
                      
                      <div onClick={(e)=>this.viewProfile(e, dac.owner.address)}>
                        <Avatar size={30} src={dac.owner.avatar} round={true}/>                  
                        <span className="small">{dac.owner.name}</span>
                      </div>

                      <h4 className="card-title">{getTruncatedText(dac.title, 30)}</h4>
                      <div className="card-text">{dac.summary}</div>

                      <div>
                        { isOwner(dac.owner.address, currentUser) &&
                          <span>
                            {/*
                              <a className="btn btn-link" onClick={(e)=>this.removeDAC(e, dac._id)}>
                                <i className="fa fa-trash"></i>
                              </a>
                            */}
                            <a className="btn btn-link" onClick={(e)=>this.editDAC(e, dac._id)}>
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
        

          { dacs.data && dacs.data.length === 0 &&
            <center>There are no DACs yet!</center>
          }

        </div>
      </div>
    )
  }
}

export default DACs

DACs.propTypes = {
  currentUser: currentUserModel,
  history: PropTypes.object.isRequired
}