import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { LPPCappedMilestones } from 'lpp-capped-milestone';
import { utils } from 'web3';

import { Form, Input } from 'formsy-react-components';
import { feathersClient } from './../../lib/feathersClient';
import Loader from './../Loader';
import QuillFormsy from './../QuillFormsy';
import FormsyImageUploader from './../FormsyImageUploader';
import GoBackButton from '../GoBackButton';
import {
  isOwner, displayTransactionError, getRandomWhitelistAddress, getTruncatedText,
  getGasPrice,
} from '../../lib/helpers';
import { isAuthenticated, checkWalletBalance, isInWhitelist, confirmBlockchainTransaction } from '../../lib/middleware';
import getNetwork from '../../lib/blockchain/getNetwork';
import getWeb3 from '../../lib/blockchain/getWeb3';
import LoaderButton from '../../components/LoaderButton';
// import DatePickerFormsy from './../DatePickerFormsy';
import User from '../../models/User';
import GivethWallet from '../../lib/blockchain/GivethWallet';

/**
 * Create or edit a Milestone
 *
 *  @props
 *    isNew (bool):
 *      If set, component will load an empty model.
 *      If not set, component expects an id param and will load a milestone object from backend
 *
 *  @params
 *    id (string): an id of a milestone object
 */

class EditMilestone extends Component {
  constructor() {
    super();

    this.state = {
      isLoading: true,
      isSaving: false,
      formIsValid: false,

      // milestone model
      title: '',
      description: '',
      image: '',
      maxAmount: '',
      reviewerAddress: getRandomWhitelistAddress(React.whitelist.reviewerWhitelist),
      recipientAddress: '',
      // completionDeadline: '',
      status: 'pending',
      uploadNewImage: false,
      campaignTitle: '',
      projectId: undefined,
      hasWhitelist: React.whitelist.reviewerWhitelist.length > 0,
    };

    this.submit = this.submit.bind(this);
    this.setImage = this.setImage.bind(this);
  }


  componentDidMount() {
    console.log(this.props.isProposed);
    isAuthenticated(this.props.currentUser, this.props.wallet)
      .then(() => {
        if (!this.props.isProposed) checkWalletBalance(this.props.wallet, this.props.history);
      })
      .then(() => {
        if (!this.props.isProposed) {
          isInWhitelist(
            this.props.currentUser, React.whitelist.projectOwnerWhitelist,
            this.props.history,
          );
        }
      })
      .then(() => {
        this.setState({
          campaignId: this.props.match.params.id,
          recipientAddress: this.props.currentUser.address,
        });

        // load a single milestones (when editing)
        if (!this.props.isNew) {
          feathersClient.service('milestones').find({ query: { _id: this.props.match.params.milestoneId } })
            .then((resp) => {
              if (!isOwner(resp.data[0].owner.address, this.props.currentUser)) {
                this.props.history.goBack();
              } else {
                this.setState(Object.assign({}, resp.data[0], {
                  id: this.props.match.params.milestoneId,
                  maxAmount: utils.fromWei(resp.data[0].maxAmount),
                  isLoading: false,
                  hasError: false,
                }));
              }
            })
            .catch(() =>
              this.setState({
                isLoading: false,
              }));
        } else {
          feathersClient.service('campaigns').get(this.props.match.params.id)
            .then((campaign) => {
              if (!campaign.projectId) {
                this.props.history.goBack();
              } else {
                this.setState({
                  campaignTitle: campaign.title,
                  campaignProjectId: campaign.projectId,
                  campaignReviewerAddress: campaign.reviewerAddress,
                  campaignOwnerAddress: campaign.ownerAddress,
                  isLoading: false,
                });
              }
            });
        }
      })
      .catch((err) => {
        if (err === 'noBalance') this.props.history.goBack();
      });
  }

  setImage(image) {
    this.setState({ image, uploadNewImage: true });
  }

  // changeDate(moment) {
  //   this.setState({ completionDeadline: moment.format('YYYY/MM/DD') });
  // }

  submit(model) {
    this.setState({ isSaving: true });

    const afterEmit = () => {
      this.setState({ isSaving: false });
      this.props.history.goBack();
    };
    let txHash;

    const updateMilestone = (file) => {
      const constructedModel = {
        title: model.title,
        description: model.description,
        summary: getTruncatedText(this.state.summary, 100),
        maxAmount: utils.toWei(model.maxAmount),
        ownerAddress: this.props.currentUser.address,
        reviewerAddress: model.reviewerAddress,
        recipientAddress: model.recipientAddress,
        // completionDeadline: this.state.completionDeadline,
        campaignReviewerAddress: this.state.campaignReviewerAddress,
        image: file,
        campaignId: this.state.campaignId,
        status: (this.props.isProposed || this.state.status === 'rejected') ? 'proposed' : this.state.status, // make sure not to change status!
      };

      if (this.props.isNew) {
        const createMilestone = (txData) => {
          feathersClient.service('milestones').create(Object.assign({}, constructedModel, txData))
            .then(() => afterEmit(true));
        };

        if (this.props.isProposed) {
          createMilestone({
            pluginAddress: '0x0000000000000000000000000000000000000000',
            totalDonated: '0',
            donationCount: 0,
            campaignOwnerAddress: this.state.campaignOwnerAddress,
          });
          React.toast.info(<p>Your Milestone is being proposed to the Campaign Owner.</p>);
        } else {
          let etherScanUrl;
          Promise.all([getNetwork(), getWeb3(), getGasPrice()])
            .then(([network, web3, gasPrice]) => {
              etherScanUrl = network.txHash;

              const from = this.props.currentUser.address;
              const recipient = model.recipientAddress;
              new LPPCappedMilestones(web3, network.cappedMilestoneAddress)
                .addMilestone(model.title, '', constructedModel.maxAmount, this.state.campaignProjectId, recipient, model.reviewerAddress, constructedModel.campaignReviewerAddress, { from, gasPrice })
                .on('transactionHash', (hash) => {
                  txHash = hash;
                  createMilestone({
                    txHash,
                    pluginAddress: '0x0000000000000000000000000000000000000000',
                    totalDonated: '0',
                    donationCount: '0',
                  });
                  React.toast.info(<p>Your Milestone is pending....<br /><a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">View transaction</a></p>);
                })
                .then(() => {
                  React.toast.success(<p>Your Milestone has been created!<br /><a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">View transaction</a></p>);
                });
            })
            .catch(() => {
              displayTransactionError(txHash, etherScanUrl);
            });
        }
      } else {
        feathersClient.service('milestones').patch(this.state.id, constructedModel)
          .then(() => afterEmit());
      }
    };

    const saveMilestone = () => {
      if (this.state.uploadNewImage) {
        feathersClient.service('/uploads').create({ uri: this.state.image }).then(file => updateMilestone(file.url));
      } else {
        updateMilestone();
      }
    }

    if(this.props.isProposed) {
      React.swal({
        title: 'Propose milestone?',
        text:
          'The milestone will be proposed to the campaign owner and he or she might approve or reject your milestone.',
        icon: 'warning',
        dangerMode: true,
        buttons: ['Cancel', 'Yes, propose'],
      }).then(isConfirmed => {
        if (isConfirmed) saveMilestone();
      });
    } else if (this.props.isNew) {
      // Save the Milestone
      confirmBlockchainTransaction(
        () => saveMilestone(),
        () => this.setState({ isSaving: false }),
      );
    } else {
      saveMilestone();
    }
  }

  toggleFormValid(state) {
    this.setState({ formIsValid: state });
  }

  constructSummary(text) {
    this.setState({ summary: text });
  }

  btnText() {
    if (this.props.isNew) {
      return this.props.isProposed ? 'Propose Milestone' : 'Create Milestone';
    }

    return 'Update Milestone';
  }

  render() {
    const { isNew, isProposed, history } = this.props;
    const {
      isLoading, isSaving, title, description, image, recipientAddress, reviewerAddress,
      formIsValid, maxAmount, campaignTitle, hasWhitelist, projectId,
    } = this.state;

    return (
      <div id="edit-milestone-view">
        <div className="container-fluid page-layout edit-view">
          <div>
            <div className="col-md-8 m-auto">
              { isLoading &&
              <Loader className="fixed" />
                }

              { !isLoading &&
              <div>
                <GoBackButton history={history} />

                <div className="form-header">
                  { isNew && !isProposed &&
                  <h3>Add a new milestone</h3>
                      }

                  { !isNew && !isProposed &&
                  <h3>Edit milestone {title}</h3>
                      }

                  { isNew && isProposed &&
                  <h3>Propose a Milestone</h3>
                      }

                  <h6>Campaign: <strong>{getTruncatedText(campaignTitle, 100)}</strong></h6>

                  <p>
                    <i className="fa fa-question-circle" />
                    A Milestone is a single accomplishment within a project. In the end, all
                    donations end up in Milestones. Once your Milestone is completed, you can
                    request a payout.
                  </p>

                  { isProposed &&
                    <p>
                      <i className="fa fa-exclamation-triangle" />
                      You are proposing a Milestone to the Campaign Owner.
                      The Campaign Owner can accept or reject your Milestone
                    </p>
                  }
                </div>

                <Form
                  onSubmit={this.submit}
                  mapping={inputs => ({
                    title: inputs.title,
                    description: inputs.description,
                    reviewerAddress: inputs.reviewerAddress,
                    recipientAddress: inputs.recipientAddress,
                    maxAmount: inputs.maxAmount,
                  })}
                  onValid={() => this.toggleFormValid(true)}
                  onInvalid={() => this.toggleFormValid(false)}
                  layout="vertical"
                >

                  <Input
                    name="title"
                    label="What are you going to accomplish in this Milestone?"
                    id="title-input"
                    type="text"
                    value={title}
                    placeholder="E.g. buying goods"
                    help="Describe your Milestone in 1 sentence."
                    validations="minLength:3"
                    validationErrors={{
                      minLength: 'Please provide at least 3 characters.',
                    }}
                    required
                    autoFocus
                  />

                  <div className="form-group">
                    <QuillFormsy
                      name="description"
                      label="Explain how you are going to do this successfully."
                      helpText="Make it as extensive as necessary. Your goal is to build trust,
                        so that people donate Ether to your Campaign. Don't hesitate to add a detailed budget for this Milestone"
                      value={description}
                      placeholder="Describe how you're going to execute your Milestone successfully
                        ..."
                      onTextChanged={content => this.constructSummary(content)}
                      validations="minLength:3"
                      help="Describe your Milestone."
                      validationErrors={{
                        minLength: 'Please provide at least 3 characters.',
                      }}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <FormsyImageUploader
                      setImage={this.setImage}
                      previewImage={image}
                      required={isNew}
                    />
                  </div>

                  <div className="form-group">
                    <Input
                      name="reviewerAddress"
                      id="title-input"
                      label="Each Milestone needs a Reviewer who verifies that the Milestone is
                        completed successfully"
                      type="text"
                      value={reviewerAddress}
                      placeholder="0x0000000000000000000000000000000000000000"
                      help={hasWhitelist ? 'The Milestone Reviewer is automatically assigned while Giveth is in beta.' : ''}
                      validations="isEtherAddress"
                      validationErrors={{
                        isEtherAddress: 'Please insert a valid Ethereum address.',
                      }}
                      required
                      disabled={hasWhitelist}
                    />
                  </div>

                  <div className="form-group">
                    <Input
                      name="recipientAddress"
                      id="title-input"
                      label="Where will the money go after completion?"
                      type="text"
                      value={recipientAddress}
                      placeholder="0x0000000000000000000000000000000000000000"
                      help="Enter an Ethereum address."
                      validations="isEtherAddress"
                      validationErrors={{
                        isEtherAddress: 'Please insert a valid Ethereum address.',
                      }}
                      required
                      disabled={projectId}
                    />
                  </div>

                  {/*
                    <div className="form-group">
                      <DatePickerFormsy
                        name="completionDeadline"
                        label="Until what date is the Milestone achievable?"
                        type="text"
                        value={completionDeadline}
                        changeDate={date => this.changeDate(date)}
                        placeholder="Select a date"
                        help="Select a date"
                        validations="minLength:10"
                        validationErrors={{
                          minLength: 'Please provide a date.',
                        }}
                        required
                      />
                    </div>
                  */}

                  <div className="form-group">
                    <Input
                      name="maxAmount"
                      id="maxamount-input"
                      type="number"
                      label="Maximum amount of &#926; required for this Milestone"
                      value={maxAmount}
                      placeholder="10"
                      validations="greaterThan:0.0099999999999"
                      validationErrors={{
                        greaterThan: 'Minimum value must be at least Ξ 0.1',
                      }}
                      required
                      disabled={projectId}
                    />
                  </div>

                  <div className="form-group row">
                    <div className="col-6">
                      <GoBackButton history={history} />
                    </div>
                    <div className="col-6">
                      <LoaderButton
                        className="btn btn-success pull-right"
                        formNoValidate
                        type="submit"
                        disabled={isSaving || !formIsValid}
                        isLoading={isSaving}
                        loadingText="Saving..."
                      >
                        <span>{this.btnText()}</span>
                      </LoaderButton>
                    </div>
                  </div>
                </Form>

              </div>
                }
            </div>
          </div>
        </div>
      </div>
    );
  }
}

EditMilestone.propTypes = {
  currentUser: PropTypes.instanceOf(User).isRequired,
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
  }).isRequired,
  isProposed: PropTypes.bool,
  isNew: PropTypes.bool,
  wallet: PropTypes.instanceOf(GivethWallet).isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
      milestoneId: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

EditMilestone.defaultProps = {
  isNew: false,
  isProposed: false,
};

export default EditMilestone;
