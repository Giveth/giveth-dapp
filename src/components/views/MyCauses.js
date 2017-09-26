import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { feathersClient } from '../../lib/feathersClient'
import { Link } from 'react-router-dom'
import { isAuthenticated, redirectAfterWalletUnlock } from '../../lib/middleware'
import Loader from '../Loader'

import { getTruncatedText } from '../../lib/helpers'

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
      pendingCauses: [],
    }    
  }

  componentDidMount() {
    isAuthenticated(this.props.currentUser, this.props.history).then(() =>
      feathersClient.service('dacs').find({query: { ownerAddress: this.props.currentUser }})
        .then((resp) =>
          this.setState({ 
            causes: resp.data.filter(cause => (cause.delegateId)),
            pendingCauses: resp.data.filter(cause => !(cause.delegateId)),
            hasError: false,
            isLoading: false
          }))
        .catch(() => 
          this.setState({ 
            isLoading: false, 
            hasError: true 
          }))
    )   
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
      const causes = feathersClient.service('/dacs');
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
    }, () => redirectAfterWalletUnlock("/dacs/" + id + "/edit", this.props.wallet, this.props.history))
  }

  render() {
    let { causes, pendingCauses, isLoading } = this.state;

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
                  {pendingCauses.length > 0 &&
                  <p>{pendingCauses.length} pending dacs</p>
                  }

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
                                <h4 className="card-title">{getTruncatedText(cause.title, 30)}</h4>
                              </Link>
                              <div className="card-text">{cause.summary}</div>

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