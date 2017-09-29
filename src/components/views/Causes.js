import React, { Component } from 'react'
import PropTypes from 'prop-types'

import JoinGivethCommunity from '../JoinGivethCommunity'
import { feathersClient } from '../../lib/feathersClient'
import { isOwner } from '../../lib/helpers'
import { redirectAfterWalletUnlock } from '../../lib/middleware'

import { getTruncatedText } from '../../lib/helpers'

import Avatar from 'react-avatar'
import Masonry, {ResponsiveMasonry} from "react-responsive-masonry"

import currentUserModel from '../../models/currentUserModel'

/**
  The causes view
**/

class Causes extends Component {

  removeCause(e, id){
    e.stopPropagation()

    React.swal({
      title: "Delete DAC?",
      text: "You will not be able to recover this DAC!",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, delete it!",
      closeOnConfirm: true,
    }, () => {
      const causes = feathersClient.service('/causes');
      causes.remove(id).then(cause => {
        React.toast.success("Your DAC has been deleted.")
      })
    });
  }

  editCause(e, id) {
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

  viewCause(id){
    this.props.history.push("/dacs/" + id)
  }

  viewProfile(e, id){
    e.stopPropagation()
    this.props.history.push("/profile/" + id)
  }  

  render() {
    const { currentUser, wallet, causes } = this.props

    return (
      <div id="causes-view" className="card-view">
        <JoinGivethCommunity currentUser={currentUser} walletUnlocked={(wallet && wallet.unlocked)}/>

        <div className="container-fluid page-layout reduced-padding">

          { causes.data && causes.data.length > 0 && 
            <ResponsiveMasonry columnsCountBreakPoints={{350: 1, 750: 2, 900: 3, 1024: 4, 1470: 5}}>
              <Masonry gutter="10px"> 
                { causes.data.map((cause, index) =>

                  <div className="card" id={cause._id} key={index} onClick={()=>this.viewCause(cause._id)}>
                    <img className="card-img-top" src={cause.image} alt=""/>
                    <div className="card-body">
                      
                      <div onClick={(e)=>this.viewProfile(e, cause.owner.address)}>
                        <Avatar size={30} src={cause.owner.avatar} round={true}/>                  
                        <span className="small">{cause.owner.name}</span>
                      </div>

                      <h4 className="card-title">{getTruncatedText(cause.title, 30)}</h4>
                      <div className="card-text">{cause.summary}</div>

                      <div>
                        { isOwner(cause.owner.address, currentUser.address) &&
                          <span>
                            <a className="btn btn-link" onClick={(e)=>this.removeCause(e, cause._id)}>
                              <i className="fa fa-trash"></i>
                            </a>
                            <a className="btn btn-link" onClick={(e)=>this.editCause(e, cause._id)}>
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
        

          { causes.data && causes.data.length === 0 &&
            <center>There are no DACs yet!</center>
          }

        </div>
      </div>
    )
  }
}

export default Causes

Causes.propTypes = {
  currentUser: currentUserModel,
  history: PropTypes.object.isRequired
}