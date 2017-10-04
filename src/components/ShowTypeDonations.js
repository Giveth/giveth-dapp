import React, { Component } from 'react'
import PropTypes from 'prop-types'                
import Loader from './Loader'
import Avatar from 'react-avatar'
import { utils } from 'web3';
import getNetwork from '../lib/blockchain/getNetwork';

/**
  Shows a table of donations for a given type (dac, campaign, milestone)
**/

class ShowTypeDonations extends Component {
  constructor() {
    super();

    this.state = {
      etherScanUrl: ''
    };

    getNetwork().then(network => {
      this.setState({
        etherScanUrl: network.etherscan
      })
    })

  }

  render(){
    const { isLoading, donations } = this.props
    const { etherScanUrl } = this.state;

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
                      <td>&#926;{utils.fromWei(d.amount)}</td>
                      <td>
                        {d.donor && d.donor.avatar &&
                          <Avatar size={30} src={d.donor.avatar} round={true}/>                  
                        }
                        <span>{d.donor.name}</span>
                      </td>
                      {etherScanUrl &&
                        <td><a href={`${etherScanUrl}address/${d.donor.address}`}>{d.donor.address}</a></td>
                      }
                      {!etherScanUrl &&
                        <td>{d.donor.address}</td>
                      }
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