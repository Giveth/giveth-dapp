import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { socket, feathersClient } from '../../lib/feathersClient'
import { Link } from 'react-router-dom'
import { isAuthenticated } from '../../lib/middleware'
import Loader from '../Loader'

import Avatar from 'react-avatar'
import Masonry, {ResponsiveMasonry} from "react-responsive-masonry"

/**
  The my causes view
**/

class MyCauses extends Component {
  constructor() {
    super()

    this.state = {
      isLoading: true,
      causes: [],
    }    
  }

  componentDidMount() {
    isAuthenticated(this.props.currentUser, this.props.history).then(()=>{
      socket.emit('causes::find', { ownerAddress: this.props.currentUser }, (err, resp) => {    
        console.log('err/res', err, resp);
        if(resp){
          this.setState({ 
            causes: resp.data,
            hasError: false,
            isLoading: false
          })
        } else {
          this.setState({ 
            isLoading: false, 
            hasError: true 
          })
        }
      })  
    })    
  }


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
    let { causes, isLoading } = this.state

    return (
      <div id="causes-view">
        <div className="container-fluid page-layout">
          <div className="row">
            <div className="col-md-12">
              <h1>Your DACs</h1>

              { isLoading && 
                <Loader className="fixed"/>
              }

              { !isLoading &&
                <div>

                  { causes && causes.length > 0 && 
                    <ResponsiveMasonry columnsCountBreakPoints={{350: 1, 750: 2, 900: 3, 1024: 4, 1470: 5}}>
                      <Masonry gutter="10px"> 
                        { causes.map((cause, index) =>

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
                                <a className="btn btn-link" onClick={()=>this.removeCause(cause._id)}>
                                  <i className="fa fa-trash"></i>
                                </a>
                                <a className="btn btn-link" onClick={()=>this.editCause(cause._id)}>
                                  <i className="fa fa-edit"></i>
                                </a>
                              </div>

                            </div>
                          </div>
                        )}
                      </Masonry>
                    </ResponsiveMasonry>                    
                  }
                

                  { causes && causes.length === 0 &&
                    <center>You didn't create any DACs yet!</center>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default MyCauses

MyCauses.propTypes = {
  currentUser: PropTypes.string,
  history: PropTypes.object.isRequired
}