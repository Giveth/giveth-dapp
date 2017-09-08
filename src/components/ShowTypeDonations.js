import React, { Component } from 'react'
import PropTypes from 'prop-types'                
import Loader from './Loader'

/**
  Shows a table of donations for a given type (dac, campaign, milestone)
**/

class ShowTypeDonations extends Component {
  render(){
    const { isLoading, donations } = this.props

    return(
      <div>
        { isLoading && 
          <Loader/>
        }

        { !isLoading &&
          <div>
            { donations && donations.length > 0 && 

              <table className="table table-responsive table-hover">
                <thead>
                  <tr>
                    <th>Amount</th>
                    <th>Name</th>
                    <th>Address</th>
                  </tr>
                </thead>
                <tbody>
                  { donations.map((d, index) =>
                    <tr key={index}>
                      <td>{d.amount} ETH</td>
                      <td>{d.donor.name}</td>
                      <td>{d.donor.address}</td>
                    </tr>
                  )}

                </tbody>

              </table>
            }

            { donations && donations.length === 0 &&
              <p>No donations have been made yet. Be the first, donate now!</p>
            } 
          </div>
        }
      </div>     
    )
  }
}

export default ShowTypeDonations

ShowTypeDonations.propTypes = {
  donations: PropTypes.array.isRequired,
  isLoading: PropTypes.bool.isRequired
}