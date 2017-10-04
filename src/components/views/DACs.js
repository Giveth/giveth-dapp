import React, { Component } from 'react'
import PropTypes from 'prop-types'

import JoinGivethCommunity from '../JoinGivethCommunity'
// import { feathersClient } from '../../lib/feathersClient'
import { redirectAfterWalletUnlock } from '../../lib/middleware'
import Masonry, {ResponsiveMasonry} from "react-responsive-masonry"

import currentUserModel from '../../models/currentUserModel'

import DacCard from '../DacCard'

/**
  The dacs view
**/

class DACs extends Component {

  // removeDAC(e, id){
  //   e.stopPropagation()

  //   React.swal({
  //     title: "Delete DAC?",
  //     text: "You will not be able to recover this DAC!",
  //     icon: "warning",
  //     showCancelButton: true,
  //     confirmButtonColor: "#DD6B55",
  //     confirmButtonText: "Yes, delete it!",
  //     closeOnConfirm: true,
  //   }, () => {
  //     const dacs = feathersClient.service('/dacs');
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
      icon: "warning",
      buttons: ["Cancel", "Yes, edit"],      
      dangerMode: true
    }).then((isConfirmed) => {
      if(isConfirmed){
        redirectAfterWalletUnlock("/dacs/" + id + "/edit", this.props.wallet, this.props.history)
      }
    });
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

                  <DacCard 
                    key={index} 
                    dac={dac} 
                    viewDAC={(id) => this.viewDAC(id)} 
                    editDAC={(e, id) => this.editDAC(e, id)} 
                    removeDAC={this.removeDAC} 
                    currentUser={currentUser}/>
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