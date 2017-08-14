import React, { Component } from 'react'
import JoinGivethCommunity from '../JoinGivethCommunity'
import { socket, feathersClient } from '../../lib/feathersClient'
import { Link } from 'react-router-dom'

/**
  The causes view
**/

class Causes extends Component {

  componentWillMount() {
    console.log('Causes', this.props)
  }

  removeCause(id){
    console.log('click', id);
    const causes = feathersClient.service('/causes');
    causes.remove(id).then(cause => console.log('Remove a cause', cause));
  }

  render() {
    return (
      <div id="causes-view">
        <JoinGivethCommunity/>

        <div className="container-fluid page-layout">
          <div className="row">
            { this.props.causes.data && this.props.causes.data.map((cause, index) =>
              <div className="col-md-6 card-container" key={index}>
                <div className="card" id={cause._id}>
                  <img className="card-img-top" src={cause.image} alt=""/>
                  <div className="card-block">
                    <Link to={`/causes/${ cause._id }`}>
                      <h4 className="card-title">{cause.title}</h4>
                    </Link>
                    <div className="card-text" dangerouslySetInnerHTML={{__html: cause.description}}></div>
                    <a className="btn btn-link" onClick={()=>this.removeCause(cause._id)}>
                      <i className="fa fa-trash"></i>
                    </a>
                    <Link className="btn btn-link" to={`/causes/${ cause._id }/edit`}>
                      <i className="fa fa-edit"></i>
                    </Link>
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
