import React, { Component } from 'react'

/**
  A single milestone
**/

class Milestone extends Component {
  constructor(){
    super()
  }

  render(){
    const { model, removeMilestone } = this.props

    return(
      <div className="card">
        <div className="card-header">
          <a data-toggle="collapse" href="#collapse-area" aria-expanded="true" aria-controls="collapse-area">
            <h5 className="card-title">{model.title}</h5>
          </a>
        </div>

        <div id="collapse-area" class="collapse show" role="tabpanel" aria-labelledby="headingOne" data-parent="#accordion">
          <div className="card-body">
            <div className="card-text">{model.description}</div>
            <a className="btn btn-link" onClick={removeMilestone}>
              <i className="fa fa-trash"></i>
            </a>                                  
          </div>
        </div>
      </div>
    )
  }
}

export default Milestone