import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { feathersClient } from '../../lib/feathersClient'
import { Link } from 'react-router-dom'
import { isAuthenticated, redirectAfterWalletUnlock } from '../../lib/middleware'
import Loader from '../Loader'

import { getTruncatedText } from '../../lib/helpers'
import currentUserModel from '../../models/currentUserModel'

import Avatar from 'react-avatar'
import Masonry, {ResponsiveMasonry} from "react-responsive-masonry"

/**
  The my dacs view
**/

class MyDACs extends Component {
  constructor() {
    super()

    this.state = {
      isLoading: true,
      dacs: [],
      pendingDACs: [],
    }    
  }

  componentDidMount() {
    isAuthenticated(this.props.currentUser, this.props.history).then(() =>
      feathersClient.service('dacs').find({query: { ownerAddress: this.props.currentUser.address }})
        .then((resp) =>
          this.setState({ 
            dacs: resp.data.filter(dac => (dac.delegateId)),
            pendingDACs: resp.data.filter(dac => !(dac.delegateId)),
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

  // removeDAC(id){
  //   React.swal({
  //     title: "Delete DAC?",
  //     text: "You will not be able to recover this DAC!",
  //     type: "warning",
  //     showCancelButton: true,
  //     confirmButtonColor: "#DD6B55",
  //     confirmButtonText: "Yes, delete it!",
  //     closeOnConfirm: true,
  //   }, () => {
  //     const dacs = feathersClient.service('/dacs');
  //     dacs.remove(id).then(dac => {
  //       React.toast.success("Your DAC has been deleted.")
  //     })
  //   });
  // }

  editDAC(id) {
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
    let { dacs, pendingDACs, isLoading } = this.state;

    return (
      <div id="dacs-view">
        <div className="container-fluid page-layout">
          <div className="row">
            <div className="col-md-12">
              <h1>Your DACs</h1>

              { isLoading && 
                <Loader className="fixed"/>
              }

              { !isLoading &&
                <div>
                  {pendingDACs.length > 0 &&
                  <p>{pendingDACs.length} pending dacs</p>
                  }

                  { dacs && dacs.length > 0 && 
                    <ResponsiveMasonry columnsCountBreakPoints={{350: 1, 750: 2, 900: 3, 1024: 4, 1470: 5}}>
                      <Masonry gutter="10px"> 
                        { dacs.map((dac, index) =>

                          <div className="card" id={dac._id} key={index}>
                            <img className="card-img-top" src={dac.image} alt=""/>
                            <div className="card-body">
                            
                              <Link to={`/profile/${ dac.owner.address }`}>
                                <Avatar size={30} src={dac.owner.avatar} round={true}/>                  
                                <span className="small">{dac.owner.name}</span>
                              </Link>

                              <Link to={`/dacs/${ dac._id }`}>                  
                                <h4 className="card-title">{getTruncatedText(dac.title, 30)}</h4>
                              </Link>
                              <div className="card-text">{dac.summary}</div>

                              <div>
                                {/*
                                  <a className="btn btn-link" onClick={()=>this.removeDAC(dac._id)}>
                                    <i className="fa fa-trash"></i>
                                  </a>
                                */}
                                <a className="btn btn-link" onClick={()=>this.editDAC(dac._id)}>
                                  <i className="fa fa-edit"></i>
                                </a>
                              </div>

                            </div>
                          </div>
                        )}
                      </Masonry>
                    </ResponsiveMasonry>                    
                  }
                

                  { dacs && dacs.length === 0 &&
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

export default MyDACs

MyDACs.propTypes = {
  currentUser: currentUserModel,
  history: PropTypes.object.isRequired
}