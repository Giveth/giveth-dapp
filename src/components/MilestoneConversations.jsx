import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Avatar from 'react-avatar';
import moment from 'moment';
import ReactHtmlParser from 'react-html-parser';
import { Form } from 'formsy-react-components';

import Milestone from 'models/Milestone';
import User from 'models/User';
import BigNumber from 'bignumber.js';
import { getUserName, getUserAvatar } from 'lib/helpers';
import getNetwork from 'lib/blockchain/getNetwork';
import MilestoneProof from 'components/MilestoneProof';
import MilestoneConversationAction from 'components/MilestoneConversationAction';
import Loader from './Loader';
import { feathersClient } from '../lib/feathersClient';

/* eslint no-underscore-dangle: 0 */
class MilestoneConversations extends Component {
  constructor() {
    super();

    this.state = {
      conversations: {},
      isLoading: true,
      etherScanUrl: '',
    };
  }

  componentDidMount() {
    getNetwork().then(network => {
      this.setState({ etherScanUrl: network.etherscan });

      this.conversationObserver = feathersClient
        .service('conversations')
        .watch({ listStrategy: 'always' })
        .find({
          query: {
            milestoneId: this.props.milestone._id,
            $sort: { createdAt: -1 },
          },
        })
        .subscribe(resp => {
          this.setState({
            conversations: resp,
            isLoading: false,
          });
        });
    });
  }

  componentWillUnmount() {
    if (this.conversationObserver) this.conversationObserver.unsubscribe();
  }

  static getReadeableMessageContext(context) {
    if (context === 'proposed') return 'proposed milestone';
    if (context === 'rejected') return 'rejected completion';
    if (context === 'NeedsReview') return 'requested review';
    if (context === 'Completed') return 'accepted completion';
    if (context === 'Canceled') return 'canceled milestone';
    if (context === 'proposedRejected') return 'rejected proposed milestone';
    if (context === 'proposedAccepted') return 'accepted proposed milestone';
    return 'unknown';
  }

  render() {
    const { isLoading, conversations, etherScanUrl } = this.state;
    const { milestone, currentUser, balance } = this.props;

    return (
      <div id="milestone-conversations">
        {isLoading && <Loader className="fixed" />}

        {!isLoading && (
          <div className="card">
            <div className="card-body content">
              {conversations.data.map(c => (
                <div key={c._id}>
                  <Avatar size={30} src={getUserAvatar(c.owner)} round />
                  <div className="content-wrapper">
                    <div className="c-timestamp">
                      {moment(c.createdAt).format('Do MMM YYYY - HH:mm a')}

                      {c.txHash && (
                        <a
                          className="c-tx-hash"
                          href={`${etherScanUrl}tx/${c.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View transaction
                        </a>
                      )}
                    </div>

                    <p className="badge badge-secondary">{c.performedByRole}</p>

                    <p className={`owner-name ${c.messageContext.toLowerCase()}`}>
                      {getUserName(c.owner)}{' '}
                      {MilestoneConversations.getReadeableMessageContext(c.messageContext)}
                      {/* <span className={`badge ${c.messageContext.toLowerCase()}`}>{c.messageContext}</span> */}
                    </p>
                    <div className="c-message">{ReactHtmlParser(c.message)}</div>

                    {c.items &&
                      c.items.length > 0 && (
                        <Form className="items-form">
                          <strong>Attachments</strong>
                          <MilestoneProof
                            items={c.items}
                            isEditMode={false}
                            token={milestone.token}
                          />
                        </Form>
                      )}

                    {/* ---- action buttons ---- */}
                    <div className="c-action-footer">
                      <MilestoneConversationAction
                        messageContext={c.messageContext}
                        milestone={milestone}
                        currentUser={currentUser}
                        balance={balance}
                      />
                    </div>

                    <div className="c-divider" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
}

MilestoneConversations.propTypes = {
  milestone: PropTypes.instanceOf(Milestone).isRequired,
  currentUser: PropTypes.instanceOf(User).isRequired,
  balance: PropTypes.instanceOf(BigNumber).isRequired,
};

export default MilestoneConversations;
