import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { feathersClient } from '../../lib/feathersClient'
import { paramsForServer } from 'feathers-hooks-common'
import Loader from '../Loader'
import { isAuthenticated } from '../../lib/middleware'

import _ from 'underscore'


/**
  The my donations view
**/

class Donations extends Component {
  constructor() {
    super()

    this.state = {
      isLoading: true,
      isCommitting: false,
      isRefunding: false,
      donations: [],
    }    
  }

  componentDidMount() {
    isAuthenticated(this.props.currentUser, this.props.history).then(()=>{
      this.donationsObserver = feathersClient.service('donations').watch({ strategy: 'always' }).find(paramsForServer({ 
          schema: 'includeTypeDetails',
          query: { $limit: 100 }
        })).subscribe(
          resp => 
            this.setState({
              donations: _.sortBy(resp.data, (d) => {
                if(d.status === 'pending') return 1
                if(d.status === 'waiting') return 2
                if(d.status === 'committed') return 3
                if(d.status === 'cancelled') return 5
                return 4
              }),
              hasError: false,
              isLoading: false
            }),
          err =>
            this.setState({
              isLoading: false,
              hasError: true
            })
        )       
    })    
  }

  componentWillUnmount() {
    if(this.donationsObserver) this.donationsObserver.unsubscribe()
  } 


  getStatus(status){
    switch(status){
      case "pending":
        return "pending for your approval to be committed."
        break;
      case "waiting":
        return "waiting for further delegation"
        break;
      case "committed":
        return "committed"
        break;
      default:
        break;
    }    
  }

  commit(donation){
    React.swal({
      title: "Commit your donation?",
      text: "Your donation will go to this milestone. After committing you cannot take back your money anymore.",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, commit!",
      closeOnConfirm: true,
    }, (isConfirmed) => {
      if(isConfirmed) {   
        this.setState({ isCommitting: true })

        feathersClient.service('/donations').patch(donation._id, {
          status: 'committed',
        }).then(donation => { 
          this.setState({ isCommitting: false })
          React.toast.success("You're awesome! Your donation is now committed.", 'success')
        }).catch((e) => {
          console.log(e)
          React.toast.error("Oh no! Something went wrong with the transaction. Please try again.")
          this.setState({ isCommitting: false })
        })
      }
    })
  }

  refund(donation){
    React.swal({
      title: "Refund your donation?",
      text: "Your donation will be cancelled and the ETH will return to your wallet.",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, refund!",
      closeOnConfirm: true,
    }, (isConfirmed) => {
        if(isConfirmed) {   
          this.setState({ isRefunding: true })

          feathersClient.service('/donations').patch(donation._id, {
            status: 'cancelled',
          }).then(donation => { 
            this.setState({ isRefunding: false })
            React.toast.success("Your donation has been refunded.")
          }).catch((e) => {
            console.log(e)
            React.toast.error("Oh no! Something went wrong with the transaction. Please try again.")
            this.setState({ isRefunding: false })
          })
        }
      }
    )
  }  


  render() {
    let { donations, isLoading, isRefunding, isCommitting } = this.state

    return (
        <div id="edit-campaign-view">
          <div className="container-fluid page-layout">
            <div className="row">
              <div className="col-md-12">
                <h1>Your donations</h1>

                { isLoading && 
                  <Loader className="fixed"/>
                }

                { !isLoading &&
                  <div>
                    { donations && donations.length > 0 && 

                      <table className="table table-responsive table-hover">
                        <thead>
                          <tr>
                            <th>Amount</th>
                            <th>To</th>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Address</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          { donations.map((d, index) =>
                            <tr key={index}>
                              <td>{d.amount} ETH</td>
                              <td>{d.type}</td>
                              <td>
                                {d.from_type_id &&
                                  <span className="badge badge-info">
                                    <i className="fa fa-random"></i>
                                    &nbsp;Delegated
                                  </span>
                                }  

                                {d.type === 'dac' && d.dac &&
                                  <span>{d.dac.title}</span>
                                }

                                {d.type === 'campaign' && d.campaign &&
                                  <span>{d.campaign.title}</span>
                                }

                              </td>
                              <td>{this.getStatus(d.status)}</td>
                              <td>{d.donorAddress}</td>
                              <td>
                                { d.status === 'waiting' &&
                                  <a className="btn btn-sm btn-danger" onClick={()=>this.refund(d)} disabled={isRefunding}>
                                    Refund
                                  </a>
                                }

                                { d.status === 'pending' &&
                                  <a className="btn btn-sm btn-success" onClick={()=>this.commit(d)} disabled={isCommitting}>
                                    Commit
                                  </a>
                                }                             
                              </td>
                            </tr>
                          )}

                        </tbody>

                      </table>
                    }

                    { donations && donations.length === 0 &&
                      <center>You didn't make any donations yet!</center>
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

export default Donations

Donations.propTypes = {
  currentUser: PropTypes.string,
  history: PropTypes.object.isRequired
}