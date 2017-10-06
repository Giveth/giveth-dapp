import React, { Component } from 'react'
import PropTypes from 'prop-types'                
import Loader from './Loader'
import Avatar from 'react-avatar'
import { utils } from 'web3';
import getNetwork from '../lib/blockchain/getNetwork';
import { getUserName, getUserAvatar } from '../lib/helpers'

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
          <Loader className="small" />
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
                        {d.giver && 
                          <Avatar size={30} src={getUserAvatar(d.giver)} round={true}/>
                        }
                        <span>{getUserName(d.giver)}</span>
                      </td>
                      {etherScanUrl &&
                        <td><a href={`${etherScanUrl}address/${d.giver.address}`}>{d.giver.address}</a></td>
                      }
                      {!etherScanUrl &&
                        <td>{d.giver.address}</td>
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