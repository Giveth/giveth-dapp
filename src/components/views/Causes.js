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
    React.swal({
      title: "Delete DAC?",
      text: "You will not be able to recover this DAC!",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, delete it!",
      closeOnConfirm: true,
    }, () => {
      const causes = feathersClient.service('/causes');
      causes.remove(id).then(cause => {
        React.toast.success("Your DAC has been deleted.")
      })
    });
  }

  editCause(id) {
    React.swal({
      title: "Edit DAC?",
      text: "Are you sure you want to edit this DAC?",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, continue editing!",
      closeOnConfirm: true,
    }, () => this.props.history.push("/dacs/" + id + "/edit"));
  }

  render() {
    const { currentUser } = this.props

    console.log(React.satya)

    return (
      <div id="causes-view">
        <JoinGivethCommunity authenticated={(this.props.currentUser)}/>

        <div className="container-fluid page-layout reduced-padding">

          { this.props.causes.data && this.props.causes.data.length > 0 && 
            <ResponsiveMasonry columnsCountBreakPoints={{350: 1, 750: 2, 900: 3, 1024: 4, 1470: 5}}>
              <Masonry gutter="10px"> 
                { this.props.causes.data.map((cause, index) =>

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
                            <a className="btn btn-link" onClick={()=>this.editCause(cause._id)}>
                              <i className="fa fa-edit"></i>
                            </a>
                          </span>
                        }
                      </div>

                    </div>
                  </div>
                )}
              </Masonry>
            </ResponsiveMasonry>                    
          }
        

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