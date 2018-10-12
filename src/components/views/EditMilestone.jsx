import React, { Component } from 'react';
import { Prompt } from 'react-router-dom';
import PropTypes from 'prop-types';
import { utils } from 'web3';
import Toggle from 'react-toggle';
import BigNumber from 'bignumber.js';
import { Form, Input } from 'formsy-react-components';
import GA from 'lib/GoogleAnalytics';
import { feathersClient, feathersRest } from '../../lib/feathersClient';
import templates from '../../lib/milestoneTemplates';
import Loader from '../Loader';
import QuillFormsy from '../QuillFormsy';
import SelectFormsy from '../SelectFormsy';
import DatePickerFormsy from '../DatePickerFormsy';
import FormsyImageUploader from '../FormsyImageUploader';
import GoBackButton from '../GoBackButton';
import {
  isOwner,
  getRandomWhitelistAddress,
  getTruncatedText,
  getStartOfDayUTC,
} from '../../lib/helpers';
import { isAuthenticated, checkWalletBalance, isInWhitelist } from '../../lib/middleware';
import getNetwork from '../../lib/blockchain/getNetwork';
import LoaderButton from '../LoaderButton';
import User from '../../models/User';
import GivethWallet from '../../lib/blockchain/GivethWallet';

import ErrorPopup from '../ErrorPopup';
import config from '../../configuration';
import MilestoneProof from '../MilestoneProof';

import getEthConversionContext from '../../containers/getEthConversionContext';

BigNumber.config({ DECIMAL_PLACES: 18 });

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
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      isSaving: false,
      formIsValid: false,

      // milestone model
      title: '',
      description: '',
      image: '',
      maxAmount: new BigNumber(0),
      fiatAmount: new BigNumber(0),
      recipientAddress: '',
      // completionDeadline: '',
      status: 'Pending',
      uploadNewImage: false,
      campaignTitle: '',
      projectId: undefined,
      hasWhitelist: React.whitelist.reviewerWhitelist.length > 0,
      whitelistReviewerOptions: React.whitelist.reviewerWhitelist.map(r => ({
        value: r.address,
        title: `${r.name ? r.name : 'Anonymous user'} - ${r.address}`,
      })),
      reviewers: [],
      reviewerAddress:
        React.whitelist.reviewerWhitelist.length > 0
          ? getRandomWhitelistAddress(React.whitelist.reviewerWhitelist).address
          : '',
      items: [],
      itemizeState: false,
      date: getStartOfDayUTC().subtract(1, 'd'),
      selectedFiatType: 'EUR',
      isBlocking: false,
    };

    this.form = React.createRef();

    this.submit = this.submit.bind(this);
    this.setImage = this.setImage.bind(this);
    this.setMaxAmount = this.setMaxAmount.bind(this);
    this.setFiatAmount = this.setFiatAmount.bind(this);
    this.changeSelectedFiat = this.changeSelectedFiat.bind(this);
    this.onItemsChanged = this.onItemsChanged.bind(this);
    this.handleTemplateChange = this.handleTemplateChange.bind(this);
    this.validateMilestoneDesc = this.validateMilestoneDesc.bind(this);
  }

  componentDidMount() {
    isAuthenticated(this.props.currentUser, this.props.wallet)
      .then(() => {
        if (!this.props.isProposed) checkWalletBalance(this.props.wallet);
      })
      .then(() => {
        if (!this.props.isProposed) {
          isInWhitelist(this.props.currentUser, React.whitelist.projectOwnerWhitelist);
        }
      })
      .then(() => {
        this.setState({
          campaignId: this.props.match.params.id,
        });

        // load a single milestones (when editing)
        if (!this.props.isNew) {
          feathersClient
            .service('milestones')
            .find({ query: { _id: this.props.match.params.milestoneId } })
            .then(resp => {
              const milestone = resp.data[0];
              const date = getStartOfDayUTC(milestone.date);

              // convert amounts to BigNumbers
              milestone.maxAmount = new BigNumber(utils.fromWei(milestone.maxAmount).toString());
              milestone.fiatAmount = new BigNumber(milestone.fiatAmount);

              if (
                !(
                  isOwner(milestone.owner.address, this.props.currentUser) ||
                  isOwner(milestone.campaign.ownerAddress, this.props.currentUser)
                )
              ) {
                this.props.history.goBack();
              }
              this.setState(
                Object.assign({}, milestone, {
                  id: this.props.match.params.milestoneId,
                  date,
                  itemizeState: milestone.items && milestone.items.length > 0,
                  selectedFiatType: milestone.selectedFiatType || 'EUR',
                  campaignTitle: milestone.campaign.title,
                  campaignProjectId: milestone.campaign.projectId,
                  campaignReviewerAddress: milestone.campaign.reviewerAddress,
                  campaign: milestone.campaign,
                }),
              );
              return date;
            })
            .then(date => this.props.getEthConversion(date))
            .then(() => {
              if (!this.state.hasWhitelist) this.getReviewers();
            })
            .then(() =>
              this.setState({
                isLoading: false,
              }),
            )
            .catch(err => {
              ErrorPopup(
                'Sadly we were unable to load the requested milestone details. Please try again.',
                err,
              );
            });
        } else {
          feathersClient
            .service('campaigns')
            .get(this.props.match.params.id)
            .then(campaign => {
              if (campaign.projectId < 0) {
                this.props.history.goBack();
              } else {
                this.setState({
                  campaignTitle: campaign.title,
                  campaignReviewerAddress: campaign.reviewerAddress,
                  campaignProjectId: campaign.projectId,
                });
              }
            })
            .then(() => this.props.getEthConversion(this.state.date))
            .then(() => {
              if (!this.state.hasWhitelist) this.getReviewers();
            })
            .then(() =>
              this.setState({
                isLoading: false,
              }),
            )
            .catch(err => {
              ErrorPopup(
                'Sadly we were unable to load the campaign in which this milestone was created. Please try again.',
                err,
              );
            });
        }
      })
      .catch(err => {
        // TODO: This is not super user friendly, fix it
        if (err === 'noBalance') this.props.history.goBack();
        else {
          ErrorPopup(
            'Sadly we were unable to load the campaign in which this milestone was created. Please try again.',
            err,
          );
        }
      });
  }

  onAddItem(item) {
    this.addItem(item);
    this.setState({ addMilestoneItemModalVisible: false });
  }

  onItemsChanged(items) {
    this.setState({ items });
  }

  getReviewers() {
    return feathersClient
      .service('/users')
      .find({
        query: {
          email: { $exists: true },
          $select: ['_id', 'name', 'address'],
        },
      })
      .then(resp =>
        this.setState({
          reviewers: resp.data.map(r => ({
            value: r.address,
            title: `${r.name ? r.name : 'Anonymous user'} - ${r.address}`,
          })),
        }),
      );
  }

  setImage(image) {
    this.setState({ image, uploadNewImage: true });
  }

  setDate(date) {
    this.setState({ date });
    this.props.getEthConversion(date).then(resp => {
      // update all the input fields
      const rate = resp.rates[this.state.selectedFiatType];

      this.setState(prevState => ({
        maxAmount: prevState.fiatAmount.div(rate),
      }));
    });
  }

  setFiatAmount(name, value) {
    const maxAmount = new BigNumber(value || '0');
    const conversionRate = this.props.currentRate.rates[this.state.selectedFiatType];

    if (conversionRate && maxAmount.gte(0)) {
      this.setState({
        fiatAmount: maxAmount.times(conversionRate),
        maxAmount,
      });
    }
  }

  setMaxAmount(name, value) {
    const fiatAmount = new BigNumber(value || '0');
    const conversionRate = this.props.currentRate.rates[this.state.selectedFiatType];
    if (conversionRate && fiatAmount.gte(0)) {
      this.setState({
        maxAmount: fiatAmount.div(conversionRate),
        fiatAmount,
      });
    }
  }

  addItem(item) {
    this.setState(prevState => ({
      items: prevState.items.concat(item),
    }));
  }

  btnText() {
    if (this.props.isNew) {
      return this.props.isProposed ? 'Propose Milestone' : 'Create Milestone';
    }

    return 'Update Milestone';
  }

  removeItem(index) {
    const { items } = this.state;
    delete items[index];
    this.setState({ items: items.filter(() => true) });
  }

  mapInputs(inputs) {
    return {
      title: inputs.title,
      description: inputs.description,
      reviewerAddress: inputs.reviewerAddress,
      recipientAddress: inputs.recipientAddress,
      items: this.state.items,
      maxAmount: inputs.maxAmount,
    };
  }

  changeSelectedFiat(fiatType) {
    const conversionRate = this.props.currentRate.rates[fiatType];
    this.setState(prevState => ({
      maxAmount: prevState.fiatAmount.div(conversionRate),
      selectedFiatType: fiatType,
    }));
  }

  toggleFormValid(state) {
    if (this.state.itemizeState) {
      this.setState(prevState => ({ formIsValid: state && prevState.items.length > 0 }));
    } else {
      this.setState({ formIsValid: state });
    }
  }

  submit(model) {
    const afterEmit = () => {
      this.setState({
        isSaving: false,
        isBlocking: false,
      });
      this.props.history.goBack();
    };
    let txHash;

    const updateMilestone = file => {
      // in itemized mode, we calculate the maxAmount from the items

      if (this.state.itemizeState) {
        model.maxAmount = this.state.items
          .reduce(
            (accumulator, item) => accumulator.plus(new BigNumber(item.wei)),
            new BigNumber(0),
          )
          .toString();
      } else {
        model.maxAmount = utils.toWei(model.maxAmount.toString());
      }

      const constructedModel = {
        title: model.title,
        description: model.description,
        maxAmount: model.maxAmount,
        ownerAddress: this.props.currentUser.address,
        reviewerAddress: model.reviewerAddress,
        recipientAddress: model.recipientAddress,
        campaignReviewerAddress: this.state.campaignReviewerAddress,
        image: file,
        campaignId: this.state.campaignId,
        status:
          this.props.isProposed || this.state.status === 'Rejected'
            ? 'Proposed'
            : this.state.status, // make sure not to change status!
        items: this.state.itemizeState ? this.state.items : [],
        ethConversionRateTimestamp: this.props.currentRate.timestamp,
        selectedFiatType: this.state.selectedFiatType,
        date: this.state.date,
        fiatAmount: this.state.fiatAmount.toFixed(),
        conversionRate: this.props.currentRate.rates[this.state.selectedFiatType],
      };

      if (this.props.isNew) {
        const createMilestone = (txData, callback) => {
          feathersClient
            .service('milestones')
            .create(Object.assign({}, constructedModel, txData))
            .then(milestone => {
              afterEmit(true);
              callback(milestone);
            })
            .catch(err => {
              this.setState({ isSaving: false, isBlocking: true });
              ErrorPopup(
                'There has been an issue creating the milestone. Please try again after refresh.',
                err,
              );
            });
        };

        if (this.props.isProposed) {
          createMilestone(
            {
              pluginAddress: '0x0000000000000000000000000000000000000000',
              totalDonated: '0',
              donationCount: 0,
            },
            milestone => {
              GA.trackEvent({
                category: 'Milestone',
                action: 'proposed',
                label: milestone._id,
              });
              React.toast.info(<p>Your Milestone is being proposed to the Campaign Owner.</p>);
            },
          );
        } else {
          let etherScanUrl;
          Promise.all([getNetwork()])
            .then(([network]) => {
              etherScanUrl = network.etherscan;

              const from = this.props.currentUser.address;
              const {
                title,
                recipientAddress,
                reviewerAddress,
                campaignReviewerAddress,
                maxAmount,
              } = constructedModel;
              const parentProjectId = this.state.campaignProjectId;
              // TODO  fix this hack
              if (!parentProjectId || parentProjectId === '0') {
                ErrorPopup(
                  `It looks like the campaign has not been mined yet. Please try again in a bit`,
                  `It looks like the campaign has not been mined yet. Please try again in a bit`,
                );
                return;
              }

              /**
              lppCappedMilestoneFactory params

              string _name,
              string _url,
              uint64 _parentProject,
              address _reviewer,
              address _recipient,
              address _campaignReviewer,
              address _milestoneManager,
              uint _maxAmount,
              address _acceptedToken,
              uint _reviewTimeoutSeconds
              * */

              network.lppCappedMilestoneFactory
                .newMilestone(
                  title,
                  '',
                  parentProjectId,
                  reviewerAddress,
                  recipientAddress,
                  campaignReviewerAddress,
                  from,
                  maxAmount,
                  Object.values(config.tokenAddresses)[0], // TODO make this a form param
                  5 * 24 * 60 * 60, // 5 days in seconds
                  { from },
                )
                .on('transactionHash', hash => {
                  txHash = hash;
                  createMilestone(
                    {
                      txHash,
                      pluginAddress: '0x0000000000000000000000000000000000000000',
                      totalDonated: '0',
                      donationCount: '0',
                    },
                    milestone => {
                      GA.trackEvent({
                        category: 'Milestone',
                        action: 'created',
                        label: milestone._id,
                      });
                      React.toast.info(
                        <p>
                          Your Milestone is pending....
                          <br />
                          <a
                            href={`${etherScanUrl}tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View transaction
                          </a>
                        </p>,
                      );
                    },
                  );
                })
                .then(() => {
                  React.toast.success(
                    <p>
                      Your Milestone has been created!
                      <br />
                      <a
                        href={`${etherScanUrl}tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View transaction
                      </a>
                    </p>,
                  );
                });
            })
            .catch(err => {
              if (txHash && err.message && err.message.includes('unknown transaction')) return; // bug in web3 seems to constantly fail due to this error, but the tx is correct
              this.setState({ isSaving: false, isBlocking: true });
              ErrorPopup(
                'Something went wrong with the transaction. Is your wallet unlocked?',
                `${etherScanUrl}tx/${txHash}`,
              );
            });
        }
      } else {
        feathersClient
          .service('milestones')
          .patch(this.state.id, constructedModel)
          .then(() => {
            React.toast.success(
              <p>
                Your Milestone has been updated!
                <br />
              </p>,
            );
            GA.trackEvent({
              category: 'Milestone',
              action: 'updated',
              label: this.state.id,
            });
            afterEmit();
          });
      }
    };

    const saveMilestone = () => {
      const uploadMilestoneImage = () => {
        if (this.state.uploadNewImage) {
          feathersRest
            .service('uploads')
            .create({
              uri: this.state.image,
            })
            .then(file => updateMilestone(file.url))
            .catch(err => {
              ErrorPopup(
                'Something went wrong when uploading your image. Please try again after refresh.',
                err,
              );
              this.setState({ isSaving: false, isBlocking: true });
            });
        } else {
          updateMilestone();
        }
      };

      if (this.state.itemizeState && this.props.isNew) {
        // upload all the item images
        const uploadItemImages = [];
        this.state.items.forEach(item => {
          if (item.image) {
            uploadItemImages.push(
              new Promise((resolve, reject) => {
                feathersRest
                  .service('uploads')
                  .create({ uri: item.image })
                  .then(file => {
                    item.image = file.url;
                    resolve('done');
                  })
                  .catch(() => reject(new Error('could not upload item image')));
              }),
            );
          }
        });

        Promise.all(uploadItemImages)
          .then(() => uploadMilestoneImage())
          .catch(err => {
            this.setState({ isSaving: false, isBlocking: true });
            ErrorPopup(
              'There has been an issue uploading one of the proof items. Please refresh the page and try again.',
              err,
            );
          });
      } else {
        uploadMilestoneImage();
      }
    };

    this.setState(
      {
        isSaving: true,
        isBlocking: false,
      },
      () => {
        if (this.props.isProposed && this.props.isNew) {
          React.swal({
            title: 'Propose milestone?',
            text:
              'The milestone will be proposed to the campaign owner and he or she might approve or reject your milestone.',
            icon: 'warning',
            dangerMode: true,
            buttons: ['Cancel', 'Yes, propose'],
          }).then(isConfirmed => {
            if (isConfirmed) saveMilestone();
            else this.setState({ isSaving: false });
          });
        } else {
          saveMilestone();
        }
      },
    );
  }

  toggleAddMilestoneItemModal() {
    this.setState(prevState => ({
      addMilestoneItemModalVisible: !prevState.addMilestoneItemModalVisible,
    }));
  }

  toggleItemize() {
    this.setState(prevState => ({ itemizeState: !prevState.itemizeState }));
  }

  handleTemplateChange(option) {
    this.setState({
      description: templates.templates[option],
      template: option,
    });
  }

  triggerRouteBlocking() {
    const form = this.form.current.formsyForm;
    // we only block routing if the form state is not submitted
    this.setState({ isBlocking: form && (!form.state.formSubmitted || form.state.isSubmitting) });
  }

  validateMilestoneDesc(value) {
    if (this.state.template === 'Reward DAO') {
      return (
        value.includes('Intro') &&
        value.includes('Description') &&
        value.includes('Proof') &&
        value.includes('Video') &&
        value.includes('Reward')
      );
    }
    if (this.state.template === 'Regular Reward') {
      return (
        value.includes('Intro') &&
        value.includes('Description') &&
        value.includes('Video') &&
        value.includes('Amount')
      );
    }
    if (this.state.template === 'Expenses') {
      return value.includes('Expenses') && value.includes('Description');
    }
    if (this.state.template === 'Bounties') {
      return (
        value.includes('Intro') &&
        value.includes('What') &&
        value.includes('Why') &&
        value.includes('Deadline') &&
        value.includes('Link to Bounty')
      );
    }
    return value.length > 10;
  }

  render() {
    const { isNew, isProposed, history, currentRate, fiatTypes } = this.props;
    const {
      isLoading,
      isSaving,
      title,
      description,
      image,
      recipientAddress,
      reviewerAddress,
      formIsValid,
      maxAmount,
      campaignTitle,
      hasWhitelist,
      whitelistReviewerOptions,
      projectId,
      items,
      itemizeState,
      fiatAmount,
      date,
      selectedFiatType,
      reviewers,
      isBlocking,
    } = this.state;

    return (
      <div id="edit-milestone-view">
        <div className="container-fluid page-layout edit-view">
          <div>
            <div className="col-md-8 m-auto">
              {isLoading && <Loader className="fixed" />}

              {!isLoading && (
                <div>
                  <GoBackButton history={history} title={`Campaign: ${campaignTitle}`} />

                  <div className="form-header">
                    {isNew && !isProposed && <h3>Add a new milestone</h3>}

                    {!isNew &&
                      !isProposed && (
                        <h3>
                          Edit milestone
                          {title}
                        </h3>
                      )}

                    {isNew && isProposed && <h3>Propose a Milestone</h3>}

                    <h6>
                      Campaign: <strong>{getTruncatedText(campaignTitle, 100)}</strong>
                    </h6>

                    <p>
                      <i className="fa fa-question-circle" />A Milestone is a single accomplishment
                      within a project. In the end, all donations end up in Milestones. Once your
                      Milestone is completed, you can request a payout.
                    </p>

                    {isProposed && (
                      <p>
                        <i className="fa fa-exclamation-triangle" />
                        You are proposing a Milestone to the Campaign Owner. The Campaign Owner can
                        accept or reject your Milestone
                      </p>
                    )}
                  </div>

                  <Form
                    id="edit-milestone-form"
                    onSubmit={this.submit}
                    ref={this.form}
                    mapping={inputs => this.mapInputs(inputs)}
                    onValid={() => this.toggleFormValid(true)}
                    onInvalid={() => this.toggleFormValid(false)}
                    onChange={e => this.triggerRouteBlocking(e)}
                    layout="vertical"
                  >
                    <Prompt
                      when={isBlocking}
                      message={() =>
                        `You have unsaved changes. Are you sure you want to navigate from this page?`
                      }
                    />

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
                        templatesDropdown
                        label="Explain how you are going to do this successfully."
                        helpText="Make it as extensive as necessary. Your goal is to build trust,
                        so that people donate Ether to your Campaign. Don't hesitate to add a detailed budget for this Milestone"
                        value={description}
                        placeholder="Describe how you're going to execute your Milestone successfully
                        ..."
                        onTextChanged={content => this.constructSummary(content)}
                        validations={{
                          // eslint-disable-next-line
                          templateValidator: function(values, value) {
                            return this.validateMilestoneDesc(value);
                          }.bind(this),
                        }}
                        help="Describe your Milestone."
                        handleTemplateChange={this.handleTemplateChange}
                        validationErrors={{
                          templateValidator:
                            'Please provide at least 10 characters and do not edit the template keywords.',
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
                      {hasWhitelist && (
                        <SelectFormsy
                          name="reviewerAddress"
                          id="reviewer-select"
                          label="Select a reviewer"
                          helpText="Each milestone needs a reviewer who verifies that the milestone is
                          completed successfully"
                          value={reviewerAddress}
                          cta="--- Select a reviewer ---"
                          options={whitelistReviewerOptions}
                          validations="isEtherAddress"
                          validationErrors={{
                            isEtherAddress: 'Please select a reviewer.',
                          }}
                          required
                          disabled={!isNew && !isProposed}
                        />
                      )}

                      {!hasWhitelist && (
                        <SelectFormsy
                          name="reviewerAddress"
                          id="reviewer-select"
                          label="Select a reviewer"
                          helpText="Each milestone needs a reviewer who verifies that the milestone is
                          completed successfully"
                          value={reviewerAddress}
                          cta="--- Select a reviewer ---"
                          options={reviewers}
                          validations="isEtherAddress"
                          validationErrors={{
                            isEtherAddress: 'Please select a reviewer.',
                          }}
                          required
                          disabled={!isNew && !isProposed}
                        />
                      )}
                    </div>
                    <div className="label">Where will the money go after completion? *</div>
                    <div className="form-group recipient-address-container">
                      <Input
                        name="recipientAddress"
                        id="title-input"
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

                    <div className="react-toggle-container">
                      <Toggle
                        id="itemize-state"
                        defaultChecked={this.state.itemizeState}
                        onChange={() => this.toggleItemize()}
                        disabled={!isNew && !isProposed}
                      />
                      <span className="label">Add multiple expenses, invoices or items</span>
                    </div>

                    {!itemizeState ? (
                      <div className="card milestone-items-card">
                        <div className="card-body">
                          <div className="form-group row">
                            <div className="col-12">
                              <DatePickerFormsy
                                name="date"
                                type="text"
                                value={date}
                                startDate={date}
                                label="Milestone date"
                                changeDate={dt => this.setDate(dt)}
                                placeholder="Select a date"
                                help="Select a date"
                                validations="isMoment"
                                validationErrors={{
                                  isMoment: 'Please provide a date.',
                                }}
                                required={!itemizeState}
                                disabled={projectId}
                              />
                            </div>
                          </div>

                          <div className="form-group row">
                            <div className="col-4">
                              <Input
                                name="fiatAmount"
                                min="0"
                                id="fiatamount-input"
                                type="number"
                                step="any"
                                label="Maximum amount in fiat"
                                value={fiatAmount}
                                placeholder="10"
                                validations="greaterThan:0"
                                validationErrors={{
                                  greaterEqualTo: 'Minimum value must be greater than 0',
                                }}
                                disabled={projectId}
                                onChange={this.setMaxAmount}
                              />
                            </div>

                            <div className="col-4">
                              <SelectFormsy
                                name="fiatType"
                                label="Currency"
                                value={selectedFiatType}
                                options={fiatTypes}
                                onChange={this.changeSelectedFiat}
                                helpText={`1 Eth = ${
                                  currentRate.rates[selectedFiatType]
                                } ${selectedFiatType}`}
                                disabled={projectId}
                                required
                              />
                            </div>

                            <div className="col-4">
                              <Input
                                name="maxAmount"
                                min="0"
                                id="maxamount-input"
                                type="number"
                                step="any"
                                label="Maximum amount in ETH"
                                value={maxAmount}
                                placeholder="10"
                                validations="greaterThan:0"
                                validationErrors={{
                                  greaterEqualTo: 'Minimum value must be greater than 0',
                                }}
                                required
                                disabled={projectId}
                                onChange={this.setFiatAmount}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <MilestoneProof
                        isEditMode
                        items={items}
                        onItemsChanged={returnedItems => this.onItemsChanged(returnedItems)}
                      />
                    )}

                    <div className="form-group row">
                      <div className="col-6">
                        <GoBackButton history={history} title={`Campaign: ${campaignTitle}`} />
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
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

/* eslint react/forbid-prop-types: 0 */

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
  getEthConversion: PropTypes.func.isRequired,
  currentRate: PropTypes.object.isRequired,
  fiatTypes: PropTypes.arrayOf(PropTypes.object).isRequired,
};

EditMilestone.defaultProps = {
  isNew: false,
  isProposed: false,
};

export default getEthConversionContext(EditMilestone);
