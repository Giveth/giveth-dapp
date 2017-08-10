import React, { Component } from 'react'
import JoinGivethCommunity from '../JoinGivethCommunity'
import { socket } from '../../lib/feathersClient'

/**
  The causes view
**/

class Causes extends Component {

  componentWillMount() {
    console.log('Causes', this.props)
  }

  removeCause(id){
    console.log('click', id);
    socket.emit("causes::remove", id, { cascade: true }, (error, cause) => {
      console.log('Remove a cause', cause);
    })
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
                  <img className="card-img-top" src={cause.image} alt="cause"/>
                  <div className="card-block">
                    <h4 className="card-title">{cause.name}</h4>
                    <p className="card-text">{cause.description}</p>
                    <a className="btn btn-link" onClick={()=>this.removeCause(cause._id)}>
                      <i className="fa fa-trash"></i>
                    </a>
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