import React, { Component, Fragment } from 'react';
import { Prompt } from 'react-router-dom';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import 'react-input-token/lib/style.css';

import { Form, Input } from 'formsy-react-components';
import GA from 'lib/GoogleAnalytics';
import Loader from '../Loader';
import QuillFormsy from '../QuillFormsy';
import SelectFormsy from '../SelectFormsy';
import FormsyImageUploader from '../FormsyImageUploader';
import GoBackButton from '../GoBackButton';
import { isOwner, getTruncatedText, history } from '../../lib/helpers';
import {
  checkForeignNetwork,
  checkBalance,
  authenticateIfPossible,
  checkProfile,
} from '../../lib/middleware';
import LoaderButton from '../LoaderButton';
import User from '../../models/User';
import Campaign from '../../models/Campaign';
import CampaignService from '../../services/CampaignService';
import ErrorPopup from '../ErrorPopup';
import { Consumer as WhiteListConsumer } from '../../contextProviders/WhiteListProvider';
import { Consumer as UserConsumer } from '../../contextProviders/UserProvider';
import ErrorHandler from '../../lib/ErrorHandler';

/**
 * View to create or edit a Campaign
 *
 * @param isNew    If set, component will load an empty model.
 *                 Otherwise component expects an id param and will load a campaign object
 * @param id       URL parameter which is an id of a campaign object
 */
class EditCampaign extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      isSaving: false,
      formIsValid: false,
      // Campaign model
      campaign: new Campaign({
        owner: props.currentUser,
      }),
      isBlocking: false,
    };

    this.form = React.createRef();

    this.submit = this.submit.bind(this);
    this.setImage = this.setImage.bind(this);
  }

  componentDidMount() {
    this.mounted = true;
    const { isForeignNetwork, displayForeignNetRequiredWarning } = this.props;
    checkForeignNetwork(isForeignNetwork, displayForeignNetRequiredWarning)
      .then(() => this.checkUser())
      .then(() => {
        // Load this Campaign
        if (!this.props.isNew) {
          CampaignService.get(this.props.match.params.id)
            .then(campaign => {
              if (isOwner(campaign.ownerAddress, this.props.currentUser)) {
                this.setState({ campaign, isLoading: false });
              } else history.goBack();
            })
            .catch(err => {
              if (err.status === 404) {
                history.push('/notfound');
              } else {
                this.setState({ isLoading: false });
                ErrorHandler(
                  err,
                  'There has been a problem loading the Campaign. Please refresh the page and try again.',
                );
              }
            });
        } else {
          if (!this.props.currentUser.isProjectOwner && this.props.projectOwnersWhitelistEnabled) {
            history.goBack();
          }
          this.setState({ isLoading: false });
        }
      })
      .catch(err => {
        if (err === 'noBalance') {
          ErrorPopup('There is no balance left on the account.', err);
        } else if (err !== undefined && err.message !== 'wrongNetwork') {
          ErrorPopup('Something went wrong.', err);
        }
      });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.currentUser !== this.props.currentUser) {
      this.checkUser().then(() => {
        if (!this.props.isNew && !isOwner(this.state.campaign.ownerAddress, this.props.currentUser))
          history.goBack();
      });
    } else if (
      this.props.isNew &&
      !this.props.currentUser.isProjectOwner &&
      this.props.projectOwnersWhitelistEnabled
    ) {
      history.goBack();
    } else if (this.props.currentUser.address && !prevProps.balance.eq(this.props.balance)) {
      checkBalance(this.props.balance);
    }
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  setImage(image) {
    const { campaign } = this.state;
    campaign.image = image;
    this.setState({ campaign });
  }

  checkUser() {
    if (!this.props.currentUser) {
      history.push('/');
      return Promise.reject();
    }

    return authenticateIfPossible(this.props.currentUser, true)
      .then(() => {
        if (!this.props.currentUser.isProjectOwner && this.props.projectOwnersWhitelistEnabled) {
          throw new Error('not whitelisted');
        }
      })
      .then(() => checkProfile(this.props.currentUser))
      .then(() => checkBalance(this.props.balance));
  }

  submit() {
    const afterMined = url => {
      if (url) {
        const msg = (
          <p>
            Your Campaign has been created!
            <br />
            <a href={url} target="_blank" rel="noopener noreferrer">
              View transaction
            </a>
          </p>
        );
        React.toast.success(msg);
      } else {
        if (this.mounted) this.setState({ isSaving: false });
        React.toast.success('Your Campaign has been updated!');
        history.push(`/campaigns/${this.state.campaign.id}`);
      }
    };

    const afterCreate = (err, url, id) => {
      if (this.mounted) this.setState({ isSaving: false });
      if (!err) {
        const msg = (
          <p>
            Your Campaign is pending....
            <br />
            <a href={url} target="_blank" rel="noopener noreferrer">
              View transaction
            </a>
          </p>
        );
        React.toast.info(msg);
        GA.trackEvent({
          category: 'Campaign',
          action: 'created',
          label: id,
        });
        history.push('/my-campaigns');
      }
    };

    this.setState(
      {
        isSaving: true,
        isBlocking: false,
      },
      () => {
        // Save the campaign
        this.state.campaign.save(afterCreate, afterMined).finally(() => {
          this.setState({ isSaving: false });
        });
      },
    );
  }

  toggleFormValid(state) {
    this.setState({ formIsValid: state });
  }

  triggerRouteBlocking() {
    const form = this.form.current.formsyForm;
    // we only block routing if the form state is not submitted
    this.setState({
      isBlocking: form && (!form.state.formSubmitted || form.state.isSubmitting),
    });
  }

  render() {
    const { isNew, reviewers } = this.props;
    const { isLoading, isSaving, campaign, formIsValid, isBlocking } = this.state;

    return (
      <div id="edit-campaign-view">
        <div className="container-fluid page-layout edit-view">
          <div>
            <div className="col-md-8 m-auto">
              {isLoading && <Loader className="fixed" />}

              {!isLoading && (
                <div>
                  <GoBackButton
                    history={history}
                    title={isNew ? 'Back' : `Campaign: ${campaign.title}`}
                  />

                  <div className="form-header">
                    {isNew && <h3>Start a new Campaign!</h3>}

                    {!isNew && <h3>Edit Campaign {campaign.title}</h3>}
                    <p>
                      <i className="fa fa-question-circle" />A Campaign solves a specific cause by
                      executing a project via its Milestones. Funds raised by a Campaign need to be
                      delegated to its Milestones in order to be paid out.
                    </p>
                  </div>

                  <Form
                    onSubmit={this.submit}
                    ref={this.form}
                    mapping={inputs => {
                      campaign.title = inputs.title;
                      campaign.description = inputs.description;
                      campaign.communityUrl = inputs.communityUrl;
                      campaign.reviewerAddress = inputs.reviewerAddress;
                      campaign.summary = getTruncatedText(inputs.description, 100);
                    }}
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
                      id="title-input"
                      label="What are you working on?"
                      type="text"
                      value={campaign.title}
                      placeholder="E.g. Installing 1000 solar panels."
                      help="Describe your Campaign in 1 sentence."
                      validations="minLength:3"
                      validationErrors={{
                        minLength: 'Please provide at least 3 characters.',
                      }}
                      required
                      autoFocus
                    />

                    <QuillFormsy
                      name="description"
                      label="Explain how you are going to do this successfully."
                      helpText="Make it as extensive as necessary.
                      Your goal is to build trust, so that people donate Ether to your Campaign."
                      value={campaign.description}
                      placeholder="Describe how you're going to execute your Campaign successfully..."
                      validations="minLength:20"
                      help="Describe your Campaign."
                      validationErrors={{
                        minLength: 'Please provide at least 10 characters.',
                      }}
                      required
                    />

                    <div className="form-group">
                      <FormsyImageUploader
                        setImage={this.setImage}
                        previewImage={campaign.image}
                        isRequired={isNew}
                      />
                    </div>

                    <div className="form-group">
                      <Input
                        name="communityUrl"
                        id="community-url"
                        label="Url to join your Community"
                        type="text"
                        value={campaign.communityUrl}
                        placeholder="https://slack.giveth.com"
                        help="Where can people join your Community? Giveth redirects people there."
                        validations="isUrl"
                        validationErrors={{ isUrl: 'Please provide a url.' }}
                      />
                    </div>

                    <div className="form-group">
                      <SelectFormsy
                        name="reviewerAddress"
                        id="reviewer-select"
                        label="Select a reviewer"
                        helpText="This person or smart contract will be reviewing your Campaign to increase trust for Givers."
                        value={campaign.reviewerAddress}
                        cta="--- Select a reviewer ---"
                        options={reviewers}
                        validations="isEtherAddress"
                        validationErrors={{
                          isEtherAddress: 'Please select a reviewer.',
                        }}
                        required
                        disabled={!isNew}
                      />
                    </div>

                    <div className="form-group row">
                      <div className="col-4">
                        <GoBackButton
                          history={history}
                          title={isNew ? 'Back' : `Campaign: ${campaign.title}`}
                        />
                      </div>
                      <div className="col-4 offset-4">
                        <LoaderButton
                          className="btn btn-success pull-right"
                          formNoValidate
                          type="submit"
                          disabled={isSaving || !formIsValid}
                          isLoading={isSaving}
                          network="Foreign"
                          loadingText="Saving..."
                        >
                          {isNew ? 'Create' : 'Update'} Campaign
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

EditCampaign.propTypes = {
  currentUser: PropTypes.instanceOf(User),
  isNew: PropTypes.bool,
  balance: PropTypes.instanceOf(BigNumber).isRequired,
  isForeignNetwork: PropTypes.bool.isRequired,
  displayForeignNetRequiredWarning: PropTypes.func.isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
    }).isRequired,
  }).isRequired,
  reviewers: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  projectOwnersWhitelistEnabled: PropTypes.bool.isRequired,
};

EditCampaign.defaultProps = {
  currentUser: undefined,
  isNew: false,
};

export default props => (
  <WhiteListConsumer>
    {({ state: { isLoading: whitelistIsLoading, reviewers, projectOwnersWhitelistEnabled } }) => (
      <UserConsumer>
        {({ state: { currentUser, isLoading: userIsLoading } }) => (
          <Fragment>
            {(whitelistIsLoading || userIsLoading) && <Loader className="fixed" />}
            {!(whitelistIsLoading || userIsLoading) && (
              <EditCampaign
                reviewers={reviewers}
                projectOwnersWhitelistEnabled={projectOwnersWhitelistEnabled}
                currentUser={currentUser}
                {...props}
              />
            )}
          </Fragment>
        )}
      </UserConsumer>
    )}
  </WhiteListConsumer>
);
