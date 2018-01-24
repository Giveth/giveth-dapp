import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Avatar from 'react-avatar';

import { feathersClient } from '../../lib/feathersClient';
import getNetwork from '../../lib/blockchain/getNetwork';
import GoBackButton from '../GoBackButton';
import Loader from '../Loader';
import { getUserName, getUserAvatar } from '../../lib/helpers';

/**
 * The user profile view mapped to /profile/{userAddress}
 *
 * @param history      Browser history object
 * @param wallet       Wallet object with the balance and all keystores
 */
class Profile extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      hasError: false,
      etherScanUrl: '',
    };

    getNetwork().then(network => {
      this.setState({
        etherScanUrl: network.etherscan,
      });
    });
  }

  componentDidMount() {
    feathersClient
      .service('users')
      .find({ query: { address: this.props.match.params.userAddress } })
      .then(resp =>
        this.setState(
          Object.assign(
            {},
            {
              address: this.props.match.params.userAddress,
            },
            resp.data[0],
            {
              isLoading: false,
              hasError: false,
            },
          ),
        ),
      )
      .catch(() =>
        this.setState({
          address: this.props.match.params.userAddress,
          isLoading: false,
          hasError: true,
        }),
      );
  }

  render() {
    const { history } = this.props;
    const {
      isLoading,
      hasError,
      avatar,
      name,
      address,
      email,
      linkedIn,
      etherScanUrl,
    } = this.state;
    const user = {
      name,
      avatar,
    };

    return (
      <div id="profile-view">
        <div className="container-fluid page-layout">
          <div className="row">
            <div className="col-md-8 m-auto">
              {isLoading && <Loader className="fixed" />}

              {!isLoading &&
                !hasError && (
                  <div>
                    <GoBackButton history={history} />

                    <center>
                      <Avatar size={100} src={getUserAvatar(user)} round />
                      <h1>{getUserName(user)}</h1>
                      {etherScanUrl && (
                        <p>
                          <a href={`${etherScanUrl}address/${address}`}>
                            {address}
                          </a>
                        </p>
                      )}
                      {!etherScanUrl && <p>{address}</p>}
                      <p>{email}</p>
                      <p>{linkedIn}</p>
                    </center>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

Profile.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
  }).isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      userAddress: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

export default Profile;
