import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { Link } from 'react-router-dom'
import { isOwner } from './../lib/helpers'

/**
  A single milestone
**/

class Milestone extends Component {
  render(){
    const { model, removeMilestone, currentUser } = this.props

    return(
      <div className="card">
        <img className="card-img-top" src={model.image} alt=""/>
        <div className="card-body">
          <Link to={`/campaigns/${ model.campaignId }/milestones/${ model._id}`}>
            <h4 className="card-title">{model.title}</h4>
          </Link>
          <div className="card-text" dangerouslySetInnerHTML={{__html: model.description}}></div>
          
          { isOwner(model.owner.address, currentUser) && 
            <div>
              <a className="btn btn-link" onClick={removeMilestone}>
                <i className="fa fa-trash"></i>
              </a>
              <Link className="btn btn-link" to={`/campaigns/${ model.campaignId }/milestones/${ model._id}/edit`}>
                <i className="fa fa-edit"></i>
              </Link>
            </div>
          }
        </div>
      </div>
    )
  }
}

export default Milestone

Milestone.propTypes = {
  model: PropTypes.object.isRequired,
  removeMilestone: PropTypes.func.isRequired,
  currentUser: PropTypes.string
}