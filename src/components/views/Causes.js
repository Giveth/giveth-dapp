import React, { Component } from 'react'
import PropTypes from 'prop-types'

import JoinGivethCommunity from '../JoinGivethCommunity'
import { feathersClient } from '../../lib/feathersClient'
import { Link } from 'react-router-dom'
import { isOwner } from '../../lib/helpers'
import DonateButton from '../DonateButton'

import Avatar from 'react-avatar'
import Masonry, {ResponsiveMasonry} from "react-responsive-masonry"
/**
  The causes view
**/

class Causes extends Component {

  removeCause(id){
    const causes = feathersClient.service('/causes');
    causes.remove(id).then(cause => console.log('Remove a cause', cause));
  }

  render() {
    const { currentUser } = this.props

    return (
      <div id="causes-view">
        <JoinGivethCommunity authenticated={(this.props.currentUser)}/>

        <div className="container-fluid page-layout reduced-padding">
          <ResponsiveMasonry columnsCountBreakPoints={{350: 1, 750: 2, 900: 3, 1024: 4, 1470: 5}}>
            <Masonry gutter="10px">
              { this.props.causes.data && this.props.causes.data.length > 0 && this.props.causes.data.map((cause, index) =>
                <div className="card" id={cause._id} key={index}>
                  <img className="card-img-top" src={cause.image} alt=""/>
                  <div className="card-body">
                  
                    <Link to={`/profile/${ cause.owner.address }`}>
                      <Avatar size={30} src={cause.owner.avatar} round={true}/>                  
                      <span className="small">{cause.owner.name}</span>
                    </Link>

                    <Link to={`/dacs/${ cause._id }`}>                  
                      <h4 className="card-title">{cause.title}</h4>
                    </Link>
                    <div className="card-text" dangerouslySetInnerHTML={{__html: cause.description}}></div>

                    <div>
                      <DonateButton type="DAC" model={cause}/>

                      { isOwner(cause.owner.address, currentUser) &&
                        <span>
                          <a className="btn btn-link" onClick={()=>this.removeCause(cause._id)}>
                            <i className="fa fa-trash"></i>
                          </a>
                          <Link className="btn btn-link" to={`/dacs/${ cause._id }/edit`}>
                            <i className="fa fa-edit"></i>
                          </Link>
                        </span>
                      }
                    </div>

                  </div>
                </div>
              )}
            </Masonry>
          </ResponsiveMasonry>            

          { this.props.causes.data && this.props.causes.data.length === 0 &&
            <center>There are no DACs yet!</center>
          }
        </div>
      </div>
    )
  }
}

export default Causes

Causes.propTypes = {
  currentUser: PropTypes.string,
  history: PropTypes.object.isRequired
}