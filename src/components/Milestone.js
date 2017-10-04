import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { isOwner } from './../lib/helpers'
import { redirectAfterWalletUnlock } from './../lib/middleware'
import currentUserModel from '../models/currentUserModel'
import CardStats from './CardStats'

/**
  A single milestone
**/

class Milestone extends Component {

  viewMilestone() {
    this.props.history.push(`/campaigns/${ this.props.model.campaignId }/milestones/${ this.props.model._id}`)
  }

  // removeMilestone(e) {
  //   e.stopPropagation()
  //   this.props.removeMilestone()
  // }

  editMilestone(e) {
    e.stopPropagation()

    React.swal({
      title: "Edit Milestone?",
      text: "Are you sure you want to edit this milestone?",
      icon: "warning",
      dangerMode: true,
      buttons: ["Cancel", "Yes, edit"]
    }).then((isConfirmed) => {
      if(isConfirmed){
        redirectAfterWalletUnlock(`/campaigns/${ this.props.model.campaignId }/milestones/${ this.props.model._id}/edit`, this.props.wallet, this.props.history)
      } 
    })
  }

  render(){
    const { model, currentUser } = this.props

    return(
      <div className="card milestone-card" onClick={()=>this.viewMilestone()}>
        <div className="card-body">
          <table>
            <tbody>
              <tr>
                <td className="milestone-image">
                  <img src={model.image} alt=""/>
                </td>
                <td>
                  <h4>{model.title}</h4>
                  <p>{model.summary}</p>
                  <hr/>
                  <CardStats donationCount={model.donationCount} totalDonated={model.totalDonated} />

                  { isOwner(model.ownerAddress, currentUser) && 
                    <div>
                      {/*
                        <a className="btn btn-link" onClick={(e)=>this.removeMilestone(e)}>
                          <i className="fa fa-trash"></i>
                        </a>
                       */}
                      <a className="btn btn-link" onClick={(e)=>this.editMilestone(e)}>
                        <i className="fa fa-edit"></i>
                      </a>
                    </div>
                  }
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }
}

export default Milestone

Milestone.propTypes = {
  model: PropTypes.object.isRequired,
  removeMilestone: PropTypes.func.isRequired,
  currentUser: currentUserModel,
  history: PropTypes.object.isRequired,
  wallet: PropTypes.shape({
    unlocked: PropTypes.bool.isRequired,
    unlock: PropTypes.func.isRequired,
  })
}