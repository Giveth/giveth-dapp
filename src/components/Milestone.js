import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { Link } from 'react-router-dom'
import { isOwner } from './../lib/helpers'

/**
  A single milestone
**/

class Milestone extends Component {

  viewMilestone() {
    this.props.history.push(`/campaigns/${ this.props.model.campaignId }/milestones/${ this.props.model._id}`)
  }

  render(){
    const { model, removeMilestone, currentUser } = this.props

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
  currentUser: PropTypes.string
}