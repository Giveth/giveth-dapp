import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Pagination from 'react-js-pagination';
import { utils } from 'web3';
import ErrorPopup from '../ErrorPopup';

import { checkBalance } from '../../lib/middleware';
import { getTruncatedText, convertEthHelper, history } from '../../lib/helpers';

import Loader from '../Loader';

import User from '../../models/User';
import DACservice from '../../services/DACService';
import DAC from '../../models/DAC';
import AuthenticationWarning from '../AuthenticationWarning';

/**
 * The my dacs view
 */
class MyDACs extends Component {
  constructor() {
    super();

    this.state = {
      isLoading: true,
      dacs: {},
      visiblePages: 10,
      skipPages: 0,
      itemsPerPage: 50,
    };

    this.editDAC = this.editDAC.bind(this);
    this.handlePageChanged = this.handlePageChanged.bind(this);
  }

  componentDidMount() {
    if (this.props.currentUser) {
      this.loadDACs();
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.currentUser !== this.props.currentUser) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ isLoading: true });
      if (this.dacsObserver) this.dacsObserver.unsubscribe();
      this.loadDACs();
    }
  }

  componentWillUnmount() {
    if (this.dacsObserver) this.dacsObserver.unsubscribe();
  }

  loadDACs() {
    this.dacsObserver = DACservice.getUserDACs(
      this.props.currentUser.address,
      this.state.skipPages,
      this.state.itemsPerPage,
      dacs => this.setState({ dacs, isLoading: false }),
      () => this.setState({ isLoading: false }),
    );
  }

  editDAC(id) {
    checkBalance(this.props.balance)
      .then(() => {
        history.push(`/dacs/${id}/edit`);
      })
      .catch(err => {
        if (err === 'noBalance') {
          ErrorPopup('There is no balance left on the account.', err);
        } else if (err !== undefined) {
          ErrorPopup('Something went wrong.', err);
        }
      });
  }

  handlePageChanged(newPage) {
    this.setState({ skipPages: newPage - 1 }, () => this.loadDACs());
  }

  render() {
    const { dacs, isLoading, visiblePages } = this.state;
    const { currentUser } = this.props;
    const isPendingDac =
      (dacs.data && dacs.data.some(d => d.confirmations !== d.requiredConfirmations)) || false;

    return (
      <div id="dacs-view">
        <div className="container-fluid page-layout dashboard-table-view">
          <div className="row">
            <div className="col-md-10 m-auto">
              {(isLoading || (dacs && dacs.data.length > 0)) && <h1>Your Communities (DACs)</h1>}

              <AuthenticationWarning currentUser={currentUser} />

              {isLoading && <Loader className="fixed" />}

              {!isLoading && (
                <div>
                  {dacs && dacs.data.length > 0 && (
                    <div>
                      <table className="table table-responsive table-striped table-hover">
                        <thead>
                          <tr>
                            {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                            <th className="td-actions" />
                            <th className="td-name">Name</th>
                            <th className="td-donations-number">Donations</th>
                            <th className="td-donations-amount">Amount</th>
                            <th className="td-status">Status</th>
                            <th className="td-confirmations">{isPendingDac && 'Confirmations'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dacs.data.map(d => (
                            <tr key={d.id} className={d.status === DAC.PENDING ? 'pending' : ''}>
                              <td className="td-actions">
                                <button
                                  type="button"
                                  className="btn btn-link"
                                  onClick={() => this.editDAC(d.id)}
                                >
                                  <i className="fa fa-edit" />
                                </button>
                              </td>
                              <td className="td-name">
                                <Link to={`/dacs/${d.id}`}>{getTruncatedText(d.title, 45)}</Link>
                              </td>
                              <td className="td-donations-number">
                                {d.donationCounters.length > 0 &&
                                  d.donationCounters.map(counter => (
                                    <p key={`donations_count-${d.key}-${counter.symbol}`}>
                                      {counter.donationCount} donation(s) in {counter.symbol}
                                    </p>
                                  ))}
                                {d.donationCounters.length === 0 && <span>-</span>}
                              </td>
                              <td className="td-donations-amount">
                                {d.donationCounters.length > 0 &&
                                  d.donationCounters.map(counter => (
                                    <p key={`total_donated-${d.key}-${counter.symbol}`}>
                                      {convertEthHelper(counter.totalDonated, counter.decimals)}{' '}
                                      {counter.symbol}
                                    </p>
                                  ))}

                                {d.donationCounters.length === 0 && <span>-</span>}
                              </td>
                              <td className="td-status">
                                {d.status === DAC.PENDING && (
                                  <span>
                                    <i className="fa fa-circle-o-notch fa-spin" />
                                    &nbsp;
                                  </span>
                                )}
                                {d.status}
                              </td>
                              <td className="td-confirmations">
                                {(isPendingDac || d.requiredConfirmations !== d.confirmations) &&
                                  `${d.confirmations}/${d.requiredConfirmations}`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {dacs.total > dacs.limit && (
                        <center>
                          <Pagination
                            activePage={dacs.skip + 1}
                            itemsCountPerPage={dacs.limit}
                            totalItemsCount={dacs.total}
                            pageRangeDisplayed={visiblePages}
                            onChange={this.handlePageChanged}
                          />
                        </center>
                      )}
                    </div>
                  )}

                  {dacs && dacs.data.length === 0 && (
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
  balance: PropTypes.objectOf(utils.BN).isRequired,
};

export default MyDACs;
