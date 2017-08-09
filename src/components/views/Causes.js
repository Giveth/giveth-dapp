import React, { Component } from 'react'
import JoinGivethCommunity from '../JoinGivethCommunity'

/**
  The causes view
**/

class Causes extends Component {

  componentWillMount() {
    console.log('Causes', this.props)
  }

  render() {
    return (
      <div id="causes-view">
        <JoinGivethCommunity/>

        <div className="container-fluid page-layout">
          <div className="row">
            { this.props.causes.data && this.props.causes.data.map((cause, index) =>
              <div className="col-md-6 card-container" key={index}>
                <div className="card card-outline-primary" id={cause._id}>
                  <div className="card-block">
                    <h4 className="card-title">{cause.name}</h4>
                    <p className="card-text">{cause.description}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  } 
}

export default Causes