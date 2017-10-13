import React, { Component } from 'react'
import PropTypes from 'prop-types'

import JoinGivethCommunity from '../JoinGivethCommunity'
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





  render() {
    const { currentUser, wallet, dacs, history } = this.props

    return (
      <div id="dacs-view" className="card-view">
        <JoinGivethCommunity 
          currentUser={currentUser} 
          wallet={wallet}
          history={history}/>

        <div className="container-fluid page-layout reduced-padding">

          { dacs.data && dacs.data.length > 0 && 
            <div>
              <center>
                <p>These communities are solving causes. Help them realise their goals by joining them and giving Ether!</p>
              </center>


              <ResponsiveMasonry columnsCountBreakPoints={{350: 1, 750: 2, 900: 3, 1024: 3, 1470: 4}}>
                <Masonry gutter="10px"> 
                  { dacs.data.map((dac, index) =>

                    <DacCard 
                      key={index} 
                      dac={dac} 
                      removeDAC={this.removeDAC} 
                      currentUser={currentUser}
                      wallet={wallet}
                      history={history}/>                      
                  )}
                </Masonry>
              </ResponsiveMasonry> 
            </div>                   
          }
        

          { dacs.data && dacs.data.length === 0 &&
            <div>
              <center>
                <p>There are no decentralized altruistic communities (DACs) yet!</p>
                <img className="empty-state-img" src={process.env.PUBLIC_URL + "/img/community.svg"} width="200px" height="200px" />
              </center>
            </div>
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