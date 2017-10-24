import React, { Component } from 'react'
import PropTypes from 'prop-types'                
import Loader from './Loader'
import Avatar from 'react-avatar'
import { utils } from 'web3';
import getNetwork from '../lib/blockchain/getNetwork';
import { getUserName, getUserAvatar } from '../lib/helpers'
import moment from 'moment'

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
          <div className="dashboard-table-view">
            { donations && donations.length > 0 && 

              <div className="table-container">
                <table className="table table-responsive table-hover">
                  <thead>
                    <tr>
                      <th className="td-date">Date</th>
                      <th className="td-donations-amount">Amount</th>
                      <th className="td-user">Name</th>
                      <th className="td-tx-address">Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    { donations.map((d, index) =>
                      <tr key={index}>
                        <td className="td-date">{moment(d.createdAt).format("MM/DD/YYYY")}</td>

                        <td className="td-donations-amount">Ξ{utils.fromWei(d.amount)}</td>
                        <td className="td-user">
                          {d.giver && 
                            <Avatar size={30} src={getUserAvatar(d.giver)} round={true}/>
                          }
                          <span>{getUserName(d.giver)}</span>
                        </td>
                        {etherScanUrl && d.giver &&
                          <td className="td-tx-address"><a href={`${etherScanUrl}address/${d.giver.address}`}>{d.giver.address}</a></td>
                        }
                        {!etherScanUrl &&
                          <td className="td-tx-address">{d.giver && d.giver.address}</td>
                        }
                      </tr>
                    )}

                  </tbody>

                </table>
              </div>
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