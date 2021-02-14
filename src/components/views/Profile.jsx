/* eslint-disable prefer-destructuring */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Avatar from 'react-avatar';

import { feathersClient } from '../../lib/feathersClient';
import getNetwork from '../../lib/blockchain/getNetwork';
import GoBackButton from '../GoBackButton';
import Loader from '../Loader';
import { getUserAvatar, getUserName } from '../../lib/helpers';

import ProfileMilestonesTable from '../ProfileMilestonesTable';
import ProfileCampaignsTable from '../ProfileCampaignsTable';
import ProfileDacsTable from '../ProfileDacsTable';
import ProfileDonationsTable from '../ProfileDonationsTable';

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
      homeEtherScanUrl: '',
      userAddress: '',
    };

    getNetwork().then(network => {
      this.setState({
        homeEtherScanUrl: network.homeEtherscan,
      });
    });
  }

  componentDidMount() {
    const { userAddress } = this.props.match.params;

    feathersClient
      .service('users')
      .find({ query: { address: userAddress } })
      .then(resp => {
        this.setState({
          userAddress,
          ...resp.data[0],
          isLoading: false,
          hasError: false,
        });
      })
      .catch(() =>
        this.setState({
          userAddress,
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
      email,
      linkedin,
      homeEtherScanUrl,
      userAddress,
    } = this.state;
    const user = {
      name,
      avatar,
    };

    return (
      <div id="profile-view">
        <div className="container-fluid page-layout dashboard-table-view">
          <div className="row">
            <div className="col-md-8 m-auto">
              {isLoading && <Loader className="fixed" />}

              {!isLoading && !hasError && (
                <div>
                  <GoBackButton history={history} goPreviousPage />

                  <div className="text-center">
                    <Avatar size={100} src={getUserAvatar(user)} round />
                    <h1>{getUserName(user)}</h1>
                    {homeEtherScanUrl ? (
                      <p>
                        <a
                          href={`${homeEtherScanUrl}address/${userAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {userAddress}
                        </a>
                      </p>
                    ) : (
                      <p>{userAddress}</p>
                    )}
                    <p>{email}</p>
                    <p>{linkedin}</p>
                  </div>
                </div>
              )}

              <ProfileMilestonesTable userAddress={userAddress} />

              <ProfileCampaignsTable userAddress={userAddress} />

              <ProfileDacsTable userAddress={userAddress} />

              <ProfileDonationsTable userAddress={userAddress} />
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
