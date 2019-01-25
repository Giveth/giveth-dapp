/* eslint-disable react/sort-comp */
import React, { Component } from 'react';
import { Prompt } from 'react-router-dom';
import PropTypes from 'prop-types';
import Toggle from 'react-toggle';
import BigNumber from 'bignumber.js';
import { Form, Input } from 'formsy-react-components';
import GA from 'lib/GoogleAnalytics';
import Milestone from 'models/Milestone';
import Loader from '../Loader';
import QuillFormsy from '../QuillFormsy';
import SelectFormsy from '../SelectFormsy';
import DatePickerFormsy from '../DatePickerFormsy';
import FormsyImageUploader from '../FormsyImageUploader';
import GoBackButton from '../GoBackButton';
import { isOwner, getTruncatedText, getStartOfDayUTC } from '../../lib/helpers';
import {
  checkForeignNetwork,
  checkBalance,
  authenticateIfPossible,
  checkProfile,
} from '../../lib/middleware';
import LoaderButton from '../LoaderButton';
import User from '../../models/User';
import templates from '../../lib/milestoneTemplates';

import ErrorPopup from '../ErrorPopup';
import MilestoneProof from '../MilestoneProof';

import { Consumer as WhiteListConsumer } from '../../contextProviders/WhiteListProvider';
import getConversionRatesContext from '../../containers/getConversionRatesContext';
import MilestoneService from '../../services/MilestoneService';
import CampaignService from '../../services/CampaignService';

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
      milestone: new Milestone({}),
      tokenWhitelistOptions: props.tokenWhitelist.map(t => ({
        value: t.address,
        title: t.name,
      })),
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
    checkForeignNetwork(this.props.isForeignNetwork)
      .then(() => this.checkUser())
      .then(async () => {
        this.setState({
          campaignId: this.props.match.params.id,
        });

        // load a single milestones (when editing)
        if (!this.props.isNew) {
          try {
            const milestone = await MilestoneService.get(this.props.match.params.milestoneId);

            if (
              !(
                isOwner(milestone.owner.address, this.props.currentUser) ||
                isOwner(milestone.campaign.ownerAddress, this.props.currentUser)
              )
            ) {
              this.props.history.goBack();
            }
            this.setState({
              milestone,
              campaignTitle: milestone.campaign.title,
              campaignProjectId: milestone.campaign.projectId,
              campaignReviewerAddress: milestone.campaign.reviewerAddress,
              campaignId: milestone.campaignId,
            });

            await this.props.getConversionRates(milestone.date, milestone.token.symbol);

            this.setState({
              isLoading: false,
            });
          } catch (err) {
            ErrorPopup(
              'Sadly we were unable to load the requested milestone details. Please try again.',
              err,
            );
          }
        } else {
          try {
            const campaign = await CampaignService.get(this.props.match.params.id);

            if (campaign.projectId < 0) {
              this.props.history.goBack();
            } else {
              const milestone = new Milestone({ token: this.props.tokenWhitelist[0] });
              milestone.recipientAddress = this.props.currentUser.address;
              milestone.selectedFiatType = milestone.token.symbol;
              this.setState({
                campaignTitle: campaign.title,
                campaignReviewerAddress: campaign.reviewerAddress,
                campaignProjectId: campaign.projectId,
                milestone,
              });
            }

            this.setDate(this.state.milestone.date);

            this.setState({
              isLoading: false,
            });
          } catch (e) {
            ErrorPopup(
              'Sadly we were unable to load the campaign in which this milestone was created. Please try again.',
              e,
            );
          }
        }
      })
      .catch(err => {
        // TODO: This is not super user friendly, fix it
        if (err === 'noBalance') this.props.history.goBack();
        else {
          ErrorPopup('Something went wrong. Please try again.', err);
        }
      });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.currentUser !== this.props.currentUser) {
      this.checkUser().then(() => {
        if (
          !isOwner(this.state.milestone.owner.address, this.props.currentUser) ||
          !isOwner(this.state.milestone.campaign.ownerAddress, this.props.currentUser)
        )
          this.props.history.goBack();
      });
    } else if (this.props.currentUser && !prevProps.balance.eq(this.props.balance)) {
      checkBalance(this.props.balance);
    }
  }

  onAddItem(item) {
    this.addItem(item);
    this.setState({ addMilestoneItemModalVisible: false });
  }

  onItemsChanged(items) {
    const { milestone } = this.state;
    milestone.items = items;
    this.setState({ milestone });
  }

  setImage(image) {
    const { milestone } = this.state;
    milestone.image = image;
  }

  setDate(date) {
    const { milestone } = this.state;
    milestone.date = date;

    this.props.getConversionRates(date, milestone.token.symbol).then(resp => {
      let rate =
        resp.rates[milestone.selectedFiatType] ||
        Object.values(resp.rates).find(v => v !== undefined);

      // This rate is undefined, use the first defined rate
      if (!rate) {
        milestone.selectedFiatType = milestone.token.symbol;
        rate = resp.rates[milestone.token.symbol];
      }
      milestone.fiatAmount = rate ? milestone.fiatAmount.div(rate) : new BigNumber(0);
      milestone.conversionRateTimestamp = resp.timestamp;
      console.log('Conversion rate Timestamp:', resp.timestamp);

      milestone.maxAmount = milestone.fiatAmount.div(rate);
      this.setState({ milestone });
    });

    // FIXME: this is an infinite loop, should be rewritten
    //   // update all the input fields
    //   const rate = resp.rates[milestone.selectedFiatType];
    //
    //   this.setState(prevState => {
    //     milestone.fiatAmount = prevState.milestone.fiatAmount.div(rate);
    //     return {
    //       milestone,
    //       maxAmount: milestone.fiatAmount,
    //     };
    //   });
    // });
  }

  setFiatAmount(name, value) {
    const { milestone } = this.state;
    const maxAmount = new BigNumber(value || '0');
    const conversionRate = this.props.currentRate.rates[milestone.selectedFiatType];

    if (conversionRate && maxAmount.gte(0)) {
      milestone.maxAmount = maxAmount;
      milestone.fiatAmount = maxAmount.times(conversionRate);
      milestone.conversionRateTimestamp = this.props.currentRate.timestamp;

      this.setState({ milestone });
    }
  }

  setMaxAmount(name, value) {
    const { milestone } = this.state;
    const fiatAmount = new BigNumber(value || '0');
    const conversionRate = this.props.currentRate.rates[milestone.selectedFiatType];
    if (conversionRate && fiatAmount.gte(0)) {
      milestone.maxAmount = fiatAmount.div(conversionRate);
      milestone.fiatAmount = fiatAmount;
      milestone.conversionRateTimestamp = this.props.currentRate.timestamp;

      this.setState({ milestone });
    }
  }

  changeSelectedFiat(fiatType) {
    const { milestone } = this.state;
    const conversionRate = this.props.currentRate.rates[fiatType];
    const maxAmount = milestone.fiatAmount.div(conversionRate);

    milestone.maxAmount = maxAmount;
    milestone.fiatAmount = maxAmount.times(conversionRate);
    milestone.selectedFiatType = fiatType;

    this.setState({ milestone });
  }

  toggleFormValid(formState) {
    if (this.state.milestone.itemizeState) {
      this.setState(prevState => ({
        formIsValid: formState && prevState.milestone.items.length > 0,
      }));
    } else {
      this.setState({ formIsValid: formState });
    }
  }

  setToken(address) {
    const { milestone } = this.state;
    milestone.token = this.props.tokenWhitelist.find(t => t.address === address);
    this.setState({ milestone }, () =>
      this.setDate(this.state.milestone.data || getStartOfDayUTC()),
    );
  }

  checkUser() {
    if (!this.props.currentUser) {
      this.props.history.push('/');
      return Promise.reject();
    }

    return authenticateIfPossible(this.props.currentUser)
      .then(() => {
        if (!this.props.isProposed && !this.props.isCampaignManager(this.props.currentUser)) {
          throw new Error('not whitelisted');
        }
      })
      .then(() => checkProfile(this.props.currentUser))
      .then(() => !this.props.isProposed && checkBalance(this.props.balance));
  }

  toggleItemize() {
    const { milestone } = this.state;
    milestone.itemizeState = !milestone.itemizeState;
    this.setState({ milestone });
  }

  toggleAddMilestoneItemModal() {
    this.setState(prevState => ({
      addMilestoneItemModalVisible: !prevState.addMilestoneItemModalVisible,
    }));
  }

  submit(/* model */) {
    const { milestone } = this.state;

    milestone.ownerAddress = this.props.currentUser.address;
    milestone.campaignReviewerAddress = this.state.campaignReviewerAddress;
    milestone.campaignId = this.state.campaignId;
    milestone.status =
      this.props.isProposed || milestone.status === Milestone.REJECTED
        ? Milestone.PROPOSED
        : milestone.status; // make sure not to change status!
    milestone.conversionRate = this.props.currentRate.rates[milestone.selectedFiatType];
    milestone.parentProjectId = this.state.campaignProjectId;

    const _saveMilestone = () =>
      MilestoneService.save({
        milestone,
        from: this.props.currentUser.address,
        afterSave: (created, txUrl) => {
          if (created) {
            if (this.props.isProposed) {
              React.toast.info(<p>Your Milestone has been proposed to the Campaign Owner.</p>);
            }
          } else if (txUrl) {
            React.toast.info(
              <p>
                Your Milestone is pending....
                <br />
                <a href={txUrl} target="_blank" rel="noopener noreferrer">
                  View transaction
                </a>
              </p>,
            );
          } else {
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
          }

          this.setState({
            isSaving: false,
            isBlocking: false,
          });
          this.props.history.goBack();
        },
        afterMined: (created, txUrl) => {
          React.toast.success(
            <p>
              Your Milestone has been created!
              <br />
              <a href={txUrl} target="_blank" rel="noopener noreferrer">
                View transaction
              </a>
            </p>,
          );
        },
        onError: errorMessage => {
          React.toast.error(errorMessage);
          this.setState({ isSaving: false });
        },
      });

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
            if (isConfirmed) _saveMilestone();
            else this.setState({ isSaving: false });
          });
        } else {
          _saveMilestone();
        }
      },
    );
  }

  mapInputs(inputs) {
    const { milestone } = this.state;

    milestone.title = inputs.title;
    milestone.description = inputs.description;
    milestone.reviewerAddress = inputs.reviewerAddress;
    milestone.recipientAddress = inputs.recipientAddress;

    // if(!milestone.itemizeState) milestone.maxAmount = inputs.maxAmount;

    this.setState({ milestone });
  }

  removeItem(index) {
    const { milestone } = this.state;
    delete milestone.items[index];
    milestone.items = milestone.items.filter(() => true);
    this.setState({ milestone });
  }

  btnText() {
    if (this.props.isNew) {
      return this.props.isProposed ? 'Propose Milestone' : 'Create Milestone';
    }
    return 'Update Milestone';
  }

  addItem(item) {
    const { milestone } = this.state;
    milestone.items = milestone.items.concat(item);
    this.setState({ milestone });
  }

  handleTemplateChange(option) {
    const { milestone } = this.state;
    milestone.description = templates.templates[option];
    this.setState({
      milestone,
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
    const { isNew, isProposed, history, currentRate, fiatTypes, reviewers } = this.props;
    const {
      isLoading,
      isSaving,
      formIsValid,
      campaignTitle,
      tokenWhitelistOptions,
      isBlocking,
      milestone,
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
                          {milestone.title}
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
                      value={milestone.title}
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
                        value={milestone.description}
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
                        previewImage={milestone.image}
                        required={isNew}
                      />
                    </div>

                    <div className="form-group">
                      <SelectFormsy
                        name="reviewerAddress"
                        id="reviewer-select"
                        label="Select a reviewer"
                        helpText="Each milestone needs a reviewer who verifies that the milestone is
                          completed successfully"
                        value={milestone.reviewerAddress}
                        cta="--- Select a reviewer ---"
                        options={reviewers}
                        validations="isEtherAddress"
                        validationErrors={{
                          isEtherAddress: 'Please select a reviewer.',
                        }}
                        required
                        disabled={!isNew && !isProposed}
                      />
                    </div>
                    <div className="label">Where will the money go after completion? *</div>
                    <div className="form-group recipient-address-container">
                      <Input
                        name="recipientAddress"
                        id="title-input"
                        type="text"
                        value={milestone.recipientAddress}
                        placeholder="0x0000000000000000000000000000000000000000"
                        help="Enter an Ethereum address."
                        validations="isEtherAddress"
                        validationErrors={{
                          isEtherAddress: 'Please insert a valid Ethereum address.',
                        }}
                        required
                        disabled={!isNew && !isProposed}
                      />
                    </div>

                    <SelectFormsy
                      name="token"
                      id="token-select"
                      label="Raising funds in"
                      helpText="Select the token you're raising funds in"
                      value={milestone.token && milestone.token.address}
                      cta="--- Select a token ---"
                      options={tokenWhitelistOptions}
                      onChange={address => this.setToken(address)}
                      required
                      disabled={!isNew && !isProposed}
                    />

                    <div className="react-toggle-container">
                      <Toggle
                        id="itemize-state"
                        defaultChecked={milestone.itemizeState}
                        onChange={() => this.toggleItemize()}
                        disabled={!isNew && !isProposed}
                      />
                      <span className="label">Add multiple expenses, invoices or items</span>
                    </div>

                    {!milestone.itemizeState ? (
                      <div className="card milestone-items-card">
                        <div className="card-body">
                          <div className="form-group row">
                            <div className="col-12">
                              <DatePickerFormsy
                                name="date"
                                type="text"
                                value={milestone.date}
                                startDate={milestone.date}
                                label="Milestone date"
                                changeDate={dt => this.setDate(dt)}
                                placeholder="Select a date"
                                help="Select a date"
                                validations="isMoment"
                                validationErrors={{
                                  isMoment: 'Please provide a date.',
                                }}
                                required={!milestone.itemizeState}
                                disabled={!isNew && !isProposed}
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
                                label={`Maximum amount in ${milestone.selectedFiatType}`}
                                value={milestone.fiatAmount.toNumber()}
                                placeholder="10"
                                validations="greaterThan:0"
                                validationErrors={{
                                  greaterEqualTo: 'Minimum value must be greater than 0',
                                }}
                                disabled={!isNew && !isProposed}
                                onChange={this.setMaxAmount}
                              />
                            </div>

                            <div className="col-4">
                              <SelectFormsy
                                name="fiatType"
                                label="Currency"
                                value={milestone.selectedFiatType}
                                options={fiatTypes}
                                allowedOptions={currentRate.rates}
                                onChange={this.changeSelectedFiat}
                                helpText={`1 ${milestone.token.symbol} = ${
                                  currentRate.rates[milestone.selectedFiatType]
                                } ${milestone.selectedFiatType}`}
                                disabled={!isNew && !isProposed}
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
                                label={`Maximum amount in ${milestone.token.name}`}
                                value={milestone.maxAmount.toFixed()}
                                placeholder="10"
                                validations="greaterThan:0"
                                validationErrors={{
                                  greaterEqualTo: 'Minimum value must be greater than 0',
                                }}
                                required
                                disabled={!isNew && !isProposed}
                                onChange={this.setFiatAmount}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <MilestoneProof
                        isEditMode
                        items={milestone.items}
                        onItemsChanged={returnedItems => this.onItemsChanged(returnedItems)}
                        token={milestone.token}
                        milestoneStatus={milestone.status}
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
                          network="Foreign"
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

EditMilestone.propTypes = {
  currentUser: PropTypes.instanceOf(User),
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
  }).isRequired,
  isProposed: PropTypes.bool,
  isNew: PropTypes.bool,
  balance: PropTypes.instanceOf(BigNumber).isRequired,
  isForeignNetwork: PropTypes.bool.isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
      milestoneId: PropTypes.string,
    }).isRequired,
  }).isRequired,
  getConversionRates: PropTypes.func.isRequired,
  currentRate: PropTypes.shape({
    rates: PropTypes.shape().isRequired,
    timestamp: PropTypes.string.isRequired,
  }),
  fiatTypes: PropTypes.arrayOf(PropTypes.object).isRequired,
  isCampaignManager: PropTypes.func.isRequired,
  reviewers: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  tokenWhitelist: PropTypes.arrayOf(PropTypes.shape()).isRequired,
};

EditMilestone.defaultProps = {
  currentUser: undefined,
  isNew: false,
  isProposed: false,
  currentRate: undefined,
};

export default getConversionRatesContext(props => (
  <WhiteListConsumer>
    {({ state: { tokenWhitelist, reviewers }, actions: { isCampaignManager } }) => (
      <EditMilestone
        tokenWhitelist={tokenWhitelist}
        reviewers={reviewers}
        isCampaignManager={isCampaignManager}
        {...props}
      />
    )}
  </WhiteListConsumer>
));
