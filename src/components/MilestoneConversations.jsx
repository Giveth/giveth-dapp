import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Avatar from 'react-avatar';
import moment from 'moment';
import ReactHtmlParser from 'react-html-parser';
import { Form } from 'formsy-react-components';

import Milestone from 'models/Milestone';
import User from 'models/User';
import BigNumber from 'bignumber.js';
import { convertEthHelper, getUserName, getUserAvatar } from 'lib/helpers';
import getNetwork from 'lib/blockchain/getNetwork';
import MilestoneProof from 'components/MilestoneProof';
import MilestoneConversationAction from 'components/MilestoneConversationAction';
import MilestoneItemModel from 'models/MilestoneItem';
import { utils } from 'web3';
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
            milestoneId: this.props.milestone.id,
            $sort: { createdAt: -1 },
          },
        })
        .subscribe(resp => {
          this.setState({
            conversations: resp.data.map(c => {
              c.items = c.items.map(i => new MilestoneItemModel(i));
              return c;
            }),
            isLoading: false,
          });
        });
    });
  }

  componentWillUnmount() {
    if (this.conversationObserver) this.conversationObserver.unsubscribe();
  }

  static getReadableMessageContext(conversation) {
    const { messageContext } = conversation;
    if (messageContext === 'proposed') return 'proposed Milestone';
    if (messageContext === 'rejected') return 'rejected completion';
    if (messageContext === 'NeedsReview') return 'requested review';
    if (messageContext === 'Completed') return 'accepted completion';
    if (messageContext === 'Canceled') return 'canceled Milestone';
    if (messageContext === 'proposedRejected') return 'rejected proposed Milestone';
    if (messageContext === 'proposedAccepted') return 'accepted proposed Milestone';
    if (messageContext === 'archived') return 'archived Milestone';
    if (messageContext === 'rePropose') return 're-proposed Milestone';
    if (messageContext === 'payment') {
      const { owner, recipient, payments } = conversation;
      if (payments) {
        const paymentsStr = payments.map(p => {
          const amountStr = convertEthHelper(utils.fromWei(p.amount), p.tokenDecimals);
          return `${amountStr} ${p.symbol}`;
        });
        const phrase =
          paymentsStr.length === 1
            ? paymentsStr[0]
            : `${paymentsStr.slice(0, -1).join(', ')} and ${paymentsStr[paymentsStr.length - 1]}`;
        if (owner.address === recipient.address) {
          return `collected ${phrase}`;
        }
        // else
        return `disbursed ${phrase} to ${getUserName(recipient)}`;
      }
    }
    return 'unknown';
  }

  render() {
    const { isLoading, conversations, etherScanUrl } = this.state;
    const { milestone, balance, currentUser } = this.props;

    return (
      <div id="milestone-conversations">
        {isLoading && <Loader className="fixed" />}

        {!isLoading && (
          <div className="card">
            <div className="card-body content">
              {conversations.map(c => (
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
                      {getUserName(c.owner)} {MilestoneConversations.getReadableMessageContext(c)}
                      {/* <span className={`badge ${c.messageContext.toLowerCase()}`}>{c.messageContext}</span> */}
                    </p>
                    <div className="c-message">{ReactHtmlParser(c.message)}</div>

                    {c.items && c.items.length > 0 && (
                      <Form className="items-form">
                        <strong>Attachments</strong>
                        <MilestoneProof
                          refreshList={c.items}
                          token={milestone.token}
                          isEditMode={false}
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
  currentUser: PropTypes.instanceOf(User),
  balance: PropTypes.instanceOf(BigNumber).isRequired,
};

MilestoneConversations.defaultProps = {
  currentUser: undefined,
};

export default MilestoneConversations;
