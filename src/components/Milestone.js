import React, { Component } from 'react'
import { Link } from 'react-router-dom'

/**
  A single milestone
**/

class Milestone extends Component {
  render(){
    const { model, removeMilestone } = this.props

    return(
      <div className="card">
        <img className="card-img-top" src={model.image} alt=""/>
        <div className="card-body">
          <Link to={`/campaigns/${ model.campaignId }/milestones/${ model._id}`}>
            <h4 className="card-title">{model.title}</h4>
          </Link>
          <div className="card-text" dangerouslySetInnerHTML={{__html: model.description}}></div>
          <a className="btn btn-link" onClick={removeMilestone}>
            <i className="fa fa-trash"></i>
          </a>
          <Link className="btn btn-link" to={`/campaigns/${ model.campaignId }/milestones/${ model._id}/edit`}>
            <i className="fa fa-edit"></i>
          </Link>
        </div>
      </div>
    )
  }
}

export default Milestone