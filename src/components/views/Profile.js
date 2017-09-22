import React, { Component } from 'react'
import { feathersClient } from '../../lib/feathersClient'
import getNetwork from "../../lib/blockchain/getNetwork";

import GoBackButton from '../GoBackButton'
import Loader from '../Loader'
import Avatar from 'react-avatar'

/**
 Shows the user's profile
 **/

class Profile extends Component {
  constructor() {
    super()

    this.state = {
      isLoading: true,
      hasError: false,
      etherScanUrl: ''
    };

    getNetwork()
      .then(network => {
        this.setState({
          etherScanUrl: network.etherscan
        })
      });
  }

  componentDidMount() {
    feathersClient.service('users').find({query: {address: this.props.match.params.userAddress}})
      .then((resp) => 
        this.setState(Object.assign({}, resp.data[0], {
          isLoading: false,
          hasError: false
        })))
      .catch(() => 
        this.setState({ 
          isLoading: false,
          hasError: true
        }))
  }

  render() {
    const { history } = this.props
    let { isLoading, hasError, avatar, name, address, email, linkedIn, etherScanUrl } = this.state

    return (
      <div id="profile-view">
        <div className="container-fluid page-layout">
          <div className="row">
            <div className="col-md-8 m-auto">
              { isLoading && 
                <Loader className="fixed"/>
              }
              
              { !isLoading && !hasError &&
                <div>
                  <GoBackButton history={history}/>

                  <center>
                    <Avatar size={100} src={avatar} round={true}/>                  
                    <h1>{name}</h1>
                    {etherScanUrl &&
                      <p><a href={`${etherScanUrl}address/${address}`}>{address}</a></p>
                    }
                    {!etherScanUrl &&
                      <p>{address}</p>
                    }
                    <p>{email}</p>
                    <p>{linkedIn}</p>
                  </center>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Profile