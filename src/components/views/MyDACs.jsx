import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { utils } from 'web3';
import { Link } from 'react-router-dom';

import { feathersClient } from '../../lib/feathersClient';
import { isAuthenticated, redirectAfterWalletUnlock, takeActionAfterWalletUnlock, checkWalletBalance } from '../../lib/middleware';
import { getTruncatedText } from '../../lib/helpers';

import Loader from '../Loader';

import currentUserModel from '../../models/currentUserModel';

// TODO Remove the eslint exception and fix feathers to provide id's without underscore
/* eslint no-underscore-dangle: 0 */
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
  }

  componentDidMount() {
    isAuthenticated(this.props.currentUser, this.props.history, this.props.wallet).then(() =>
      feathersClient.service('dacs').find({ query: { ownerAddress: this.props.currentUser.address } })
        .then((resp) => {
          this.setState({
            dacs: resp.data.map((d) => {
              if (!d.status) {
                d.status = (d.delegateId) ? 'accepting donations' : 'pending';
              }
              return d;
            }),
            isLoading: false,
          });
        })
        .catch(() =>
          this.setState({
            isLoading: false,
          })));
  }

  editDAC(id) {
    takeActionAfterWalletUnlock(this.props.wallet, () => {
      checkWalletBalance(this.props.wallet, this.props.history).then(() =>
        React.swal({
          title: 'Edit Community?',
          text: 'Are you sure you want to edit the description of this community?',
          icon: 'warning',
          dangerMode: true,
          buttons: ['Cancel', 'Yes, edit'],
        }).then((isConfirmed) => {
          if (isConfirmed) redirectAfterWalletUnlock(`/dacs/${id}/edit`, this.props.wallet, this.props.history);
        }));
    });
  }

  render() {
    const { dacs, isLoading } = this.state;

    return (
      <div id="dacs-view">
        <div className="container-fluid page-layout dashboard-table-view">
          <div className="row">
            <div className="col-md-10 m-auto">

              { (isLoading || (dacs && dacs.length > 0)) &&
                <h1>Your DACs</h1>
              }

              { isLoading &&
                <Loader className="fixed" />
              }

              { !isLoading &&
                <div>

                  { dacs && dacs.length > 0 &&
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
                        { dacs.map(d => (
                          <tr key={d._id} className={d.status === 'pending' ? 'pending' : ''}>
                            <td className="td-name"><Link to={`/dacs/${d._id}`}>{getTruncatedText(d.title, 45)}</Link></td>
                            <td className="td-donations-number">{d.donationCount || 0}</td>
                            <td
                              className="td-donations-amount"
                            >Ξ{(d.totalDonated) ? utils.fromWei(d.totalDonated) : 0}
                            </td>
                            <td className="td-status">
                              {d.status === 'pending' &&
                                <span><i className="fa fa-circle-o-notch fa-spin" />&nbsp;</span> }
                              {d.status}
                            </td>
                            <td className="td-actions">
                              <button className="btn btn-link" onClick={() => this.editDAC(d._id)}>
                                <i className="fa fa-edit" />
                              </button>
                            </td>
                          </tr>))}
                      </tbody>
                    </table>
                  }


                  { dacs && dacs.length === 0 &&
                    <div>
                      <center>
                        <h3>
                          You didn&apos;t create any decentralized altruistic communities (DACs)
                          yet!
                        </h3>
                        <img className="empty-state-img" src={`${process.env.PUBLIC_URL}/img/community.svg`} width="200px" height="200px" alt="no-dacs-icon" />
                      </center>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    );
  }
}

MyDACs.propTypes = {
  currentUser: currentUserModel,
  history: PropTypes.shape({}).isRequired,
  wallet: PropTypes.shape({
    unlocked: PropTypes.bool.isRequired,
    unlock: PropTypes.func.isRequired,
  }).isRequired,
};

MyDACs.defaultProps = {
  currentUser: undefined,
};

export default MyDACs;
