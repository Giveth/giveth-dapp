import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { socket } from '../../lib/feathersClient'
import Loader from '../Loader'
import { isAuthenticated } from '../../lib/middleware'
/**
  The my donations view
**/

class Donations extends Component {
  constructor() {
    super()

    this.state = {
      isLoading: true,
      donations: [],
    }    
  }

  componentDidMount() {
    isAuthenticated(this.props.currentUser, this.props.history).then(()=>{
      socket.emit('donations::find', { }, (err, resp) => {    
        console.log('err/res', err, resp);
        if(resp){
          this.setState({ 
            donations: resp.data,
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


  render() {
    let { donations, isLoading } = this.state

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
                            <th>Address</th>
                          </tr>
                        </thead>
                        <tbody>
                          { donations.map((donation, index) =>
                            <tr key={index}>
                              <td>{donation.amount} ETH</td>
                              <td>{donation.type}</td>
                              <td>{donation.type_id}</td>
                              <td>{donation.donorAddress}</td>
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