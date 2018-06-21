import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { isLoggedIn, redirectAfterWalletUnlock, checkWalletBalance } from '../../lib/middleware';
import { getTruncatedText, convertEthHelper } from '../../lib/helpers';

import Loader from '../Loader';

import User from '../../models/User';
import GivethWallet from '../../lib/blockchain/GivethWallet';
import DACservice from '../../services/DAC';
import DAC from '../../models/DAC';

/**
 * The my dacs view
 */
class MyDACs extends Component {
  constructor() {
    super();

    this.state = {
      isLoading: true,
      dacs: [],
    };

    this.editDAC = this.editDAC.bind(this);
  }

  componentDidMount() {
    isLoggedIn(this.props.currentUser)
      .then(() => {
        this.dacsObserver = DACservice.getUserDACs(
          this.props.currentUser.address,
          0,
          100,

          ({ data }) => this.setState({ dacs: data, isLoading: false }),

          // dacs => this.setState({ dacs, isLoading: false }),

          () => this.setState({ isLoading: false }),
        );
      })
      .catch(err => {
        if (err === 'notLoggedIn') {
          // default behavior is to go home or signin page after swal popup
        }
      });
  }

  componentWillUnmount() {
    if (this.dacsObserver) this.dacsObserver.unsubscribe();
  }

  editDAC(id) {
    checkWalletBalance(this.props.wallet)
      .then(() =>
        React.swal({
          title: 'Edit Community?',
          text: 'Are you sure you want to edit the description of this community?',
          icon: 'warning',
          dangerMode: true,
          buttons: ['Cancel', 'Yes, edit'],
        }).then(isConfirmed => {
          if (isConfirmed) redirectAfterWalletUnlock(`/dacs/${id}/edit`, this.props.wallet);
        }),
      )
      .catch(err => {
        if (err === 'noBalance') {
          // handle no balance error
        }
      });
  }

  render() {
    const { dacs, isLoading } = this.state;

    return (
      <div id="dacs-view">
        <div className="container-fluid page-layout dashboard-table-view">
          <div className="row">
            <div className="col-md-10 m-auto">
              {(isLoading || (dacs && dacs.length > 0)) && <h1>Your Communities (DACs)</h1>}

              {isLoading && <Loader className="fixed" />}

              {!isLoading && (
                <div>
                  {dacs &&
                    dacs.data.length > 0 && (
                      <table className="table table-responsive table-striped table-hover">
                        <thead>
                          <tr>
                            <th className="td-name">Name</th>
                            <th className="td-donations-number">Number of donations</th>
                            <th className="td-donations-amount">Amount donated</th>
                            <th className="td-status">Status</th>
                            <th className="td-actions" />
                          </tr>
                        </thead>
                        <tbody>
                          {dacs.data.map(d => (
                            <tr key={d.id} className={d.status === DAC.PENDING ? 'pending' : ''}>
                              <td className="td-name">
                                <Link to={`/dacs/${d.id}`}>{getTruncatedText(d.title, 45)}</Link>
                              </td>
                              <td className="td-donations-number">{d.donationCount}</td>
                              <td className="td-donations-amount">
                                {convertEthHelper(d.totalDonated)} ETH
                              </td>
                              <td className="td-status">
                                {d.status === DAC.PENDING && (
                                  <span>
                                    <i className="fa fa-circle-o-notch fa-spin" />&nbsp;
                                  </span>
                                )}
                                {d.status}
                              </td>
                              <td className="td-actions">
                                <button className="btn btn-link" onClick={() => this.editDAC(d.id)}>
                                  <i className="fa fa-edit" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                  {dacs &&
                    dacs.length === 0 && (
                      <div>
                        <center>
                          <h3>
                            You didn&apos;t create any Decentralized Altruistic Communities (DACs)
                            yet!
                          </h3>
                          <img
                            className="empty-state-img"
                            src={`${process.env.PUBLIC_URL}/img/community.svg`}
                            width="200px"
                            height="200px"
                            alt="no-dacs-icon"
                          />
                        </center>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

MyDACs.propTypes = {
  currentUser: PropTypes.instanceOf(User).isRequired,
  wallet: PropTypes.instanceOf(GivethWallet).isRequired,
};

export default MyDACs;
