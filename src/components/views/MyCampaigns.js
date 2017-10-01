import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { utils } from 'web3';

import { feathersClient } from '../../lib/feathersClient'
import { isAuthenticated, redirectAfterWalletUnlock } from '../../lib/middleware'
import Loader from '../Loader'
import currentUserModel from '../../models/currentUserModel'

/**
  The my campaings view
**/

class MyCampaigns extends Component {
  constructor() {
    super()

    this.state = {
      isLoading: true,
      campaigns: []
    }    
  }

  componentDidMount() {
    isAuthenticated(this.props.currentUser, this.props.history).then(() =>
      feathersClient.service('campaigns').find({query: { ownerAddress: this.props.currentUser.address }})
        .then((resp) =>
          this.setState({ 
            campaigns: resp.data.map((c) => {
              c.status = (c.projectId === 0) ? 'pending' : 'accepting donations' 
              return c
            }),
            hasError: false,
            isLoading: false
          }))
        .catch(() => 
          this.setState({ 
            isLoading: false, 
            hasError: true 
          }))
    )   
  }


  // removeCampaign(id){
  //   React.swal({
  //     title: "Delete Campaign?",
  //     text: "You will not be able to recover this Campaign!",
  //     type: "warning",
  //     showCancelButton: true,
  //     confirmButtonColor: "#DD6B55",
  //     confirmButtonText: "Yes, delete it!",
  //     closeOnConfirm: true,
  //   }, () => {
  //     const campaigns = feathersClient.service('/campaigns');
  //     campaigns.remove(id).then(campaign => {
  //       React.toast.success("Your Campaign has been deleted.")
  //     })
  //   });
  // }

  editCampaign(id) {
    React.swal({
      title: "Edit Campaign?",
      text: "Are you sure you want to edit this Campaign?",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, continue editing!",
      closeOnConfirm: true,
    }, () => redirectAfterWalletUnlock("/campaigns/" + id + "/edit", this.props.wallet, this.props.history));
  }  


  render() {
    let { campaigns, isLoading } = this.state

    return (
      <div id="campaigns-view">
        <div className="container-fluid page-layout dashboard-table-view">
          <div className="row">
            <div className="col-md-12">
              <h1>Your Campaigns</h1>

              { isLoading && 
                <Loader className="fixed"/>
              }

              { !isLoading &&
                <div>
                  { campaigns && campaigns.length > 0 && 

                    <table className="table table-responsive table-striped table-hover">
                      <thead>
                        <tr>
                          <th>Name</th>     
                          <th>Number of donations</th>                     
                          <th>Amount donated</th>
                          <th>Status</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        { campaigns.map((c, index) =>
                          <tr key={index} className={c.status === 'pending' ? 'pending' : ''}>
                            <td>{c.title}</td>
                            <td>{c.donationCount || 0}</td>
                            <td>{(c.totalDonated) ? utils.fromWei(c.totalDonated) : 0}</td>
                            <td>
                              {c.status === 'pending' && 
                                <span><i className="fa fa-circle-o-notch fa-spin"></i>&nbsp;</span> }
                              {c.status}
                            </td>
                            <td>
                              <a className="btn btn-link" onClick={()=>this.editCampaign(c._id)}>
                                <i className="fa fa-edit"></i>
                              </a>
                            </td>
                          </tr>

                        )}
                      </tbody>
                    </table>
                  }

                  { campaigns && campaigns.length === 0 &&
                    <center>You didn't create any campaigns yet!</center>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default MyCampaigns

MyCampaigns.propTypes = {
  currentUser: currentUserModel,
  history: PropTypes.object.isRequired
}