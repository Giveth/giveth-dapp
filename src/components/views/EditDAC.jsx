import React, { Component, Fragment } from 'react';
import { Prompt } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Form, Input } from 'formsy-react-components';
import BigNumber from 'bignumber.js';

import GA from 'lib/GoogleAnalytics';
import Loader from '../Loader';
import QuillFormsy from '../QuillFormsy';
import FormsyImageUploader from '../FormsyImageUploader';
import GoBackButton from '../GoBackButton';
import { getTruncatedText, history, isOwner } from '../../lib/helpers';
import {
  authenticateIfPossible,
  checkBalance,
  checkForeignNetwork,
  checkProfile,
} from '../../lib/middleware';
import LoaderButton from '../LoaderButton';

import DACservice from '../../services/DACService';
import DAC from '../../models/DAC';
import User from '../../models/User';
import ErrorPopup from '../ErrorPopup';
import ErrorHandler from '../../lib/ErrorHandler';
import { Consumer as UserConsumer } from '../../contextProviders/UserProvider';

/**
 * View to create or edit a DAC
 *
 * @param isNew    If set, component will load an empty model.
 *                 Otherwise component expects an id param and will load a DAC object
 * @param id       URL parameter which is an id of a campaign object
 * @param history  Browser history object
 */
class EditDAC extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      isSaving: false,
      formIsValid: false,

      // DAC model
      dac: new DAC({
        owner: props.currentUser,
      }),
      isBlocking: false,
    };

    this.form = React.createRef();

    this.submit = this.submit.bind(this);
    this.setImage = this.setImage.bind(this);
  }

  componentDidMount() {
    const { isForeignNetwork, displayForeignNetRequiredWarning, match } = this.props;
    checkForeignNetwork(isForeignNetwork, displayForeignNetRequiredWarning)
      .then(() => this.checkUser())
      .then(() => {
        if (!this.props.isNew) {
          DACservice.get(match.params.id)
            .then(dac => {
              // The user is not an owner, hence can not change the DAC
              if (!isOwner(dac.ownerAddress, this.props.currentUser)) {
                // TODO: Not really user friendly
                history.goBack();
              } else {
                this.setState({ isLoading: false, dac });
              }
            })
            .catch(err => {
              if (err.status === 404) history.push('/notfound');
              else {
                const message = `Sadly we were unable to load the DAC. Please refresh the page and try again.`;
                ErrorHandler(err, message);
              }
            });
        } else {
          if (!this.props.currentUser.isDelegator) {
            history.goBack();
          }

          this.setState({ isLoading: false });
        }
      })
      .catch(err => {
        if (err.message !== 'wrongNetwork') {
          ErrorPopup(
            'There has been a problem loading the DAC. Please refresh the page and try again.',
            err,
          );
        }
      });
    this.mounted = true;
  }

  componentDidUpdate(prevProps) {
    if (prevProps.currentUser !== this.props.currentUser) {
      this.checkUser().then(() => {
        if (!this.props.isNew && !isOwner(this.state.dac.ownerAddress, this.props.currentUser))
          history.goBack();
      });
    } else if (this.props.isNew && !this.props.currentUser.isDelegator) {
      history.goBack();
    } else if (this.props.currentUser.address && !prevProps.balance.eq(this.props.balance)) {
      checkBalance(this.props.balance);
    }
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  setImage(image) {
    const { dac } = this.state;
    dac.image = image;
    this.setState({ dac });
  }

  checkUser() {
    if (!this.props.currentUser) {
      history.push('/');
      return Promise.reject();
    }

    return authenticateIfPossible(this.props.currentUser, true)
      .then(() => {
        if (!this.props.currentUser) {
          throw new Error('not authorized');
        }
      })
      .then(() => checkProfile(this.props.currentUser))
      .then(() => checkBalance(this.props.balance));
  }

  submit() {
    // Save dac
    const showToast = (msg, url, isSuccess = false) => {
      const toast = url ? (
        <p>
          {msg}
          <br />
          <a href={url} target="_blank" rel="noopener noreferrer">
            View transaction
          </a>
        </p>
      ) : (
        msg
      );

      if (isSuccess) React.toast.success(toast);
      else React.toast.info(toast);
    };

    const afterMined = (created, url, id) => {
      const msg = `Your DAC has been ${created ? 'created' : 'updated'}`;
      showToast(msg, url, true);

      if (created) {
        GA.trackEvent({
          category: 'DAC',
          action: 'created',
          label: id,
        });
      } else {
        if (this.mounted) this.setState({ isSaving: false });
        GA.trackEvent({
          category: 'DAC',
          action: 'updated',
          label: id,
        });
        history.push(`/dacs/${id}`);
      }
    };
    const afterSave = (err, created, url) => {
      if (this.mounted) this.setState({ isSaving: false });
      if (err) return;
      const msg = created ? 'Your DAC is pending...' : 'Your DAC is being updated...';
      showToast(msg, url);

      if (created) history.push('/my-dacs');
    };
    const onError = err => {
      if (err) React.toast.error(err);
    };

    this.setState(
      {
        isSaving: true,
        isBlocking: false,
      },
      () => {
        // Save the DAC
        this.state.dac.save(afterSave, afterMined, onError).finally(() => {
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
    const { isNew } = this.props;
    const { isLoading, isSaving, dac, formIsValid, isBlocking } = this.state;

    return (
      <div id="edit-dac-view">
        <div className="container-fluid page-layout edit-view">
          <div>
            <div className="col-md-8 m-auto">
              {isLoading && <Loader className="fixed" />}

              {!isLoading && (
                <div>
                  <GoBackButton history={history} />

                  <div className="form-header">
                    {isNew && <h3>Start a Decentralized Altruistic Community (DAC)</h3>}

                    {!isNew && <h3>Edit DAC</h3>}

                    <p>
                      <i className="fa fa-question-circle" />A DAC unites Givers and Makers in
                      building a community around their common vision to raise then delegate funds
                      to Campaigns that deliver a positive impact to shared goals.
                    </p>
                  </div>

                  <Form
                    onSubmit={this.submit}
                    ref={this.form}
                    mapping={inputs => {
                      dac.title = inputs.title;
                      dac.description = inputs.description;
                      dac.communityUrl = inputs.communityUrl;
                      dac.summary = getTruncatedText(inputs.description, 100);
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
                      label="Name your Community"
                      type="text"
                      value={dac.title}
                      placeholder="e.g. Hurricane relief."
                      help="Describe your Decentralized Altruistic Community (DAC) in 1 sentence."
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
                        label="Explain the cause of your community"
                        helpText="Describe the shared vision and goals of your Community and the cause
                        that you are collaborating to solve. Share links, insert media to convey your
                        message and build trust so that people will join your Community and/or donate to the cause."
                        value={dac.description}
                        placeholder="Describe how you're going to solve your cause..."
                        validations="minLength:20"
                        help="Describe your DAC."
                        validationErrors={{
                          minLength: 'Please provide at least 10 characters.',
                        }}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <FormsyImageUploader
                        name="image"
                        setImage={this.setImage}
                        previewImage={dac.image}
                        isRequired={isNew}
                      />
                    </div>

                    <div className="form-group">
                      <Input
                        name="communityUrl"
                        id="community-url"
                        label="Url to join your community"
                        type="text"
                        value={dac.communityUrl}
                        placeholder="https://slack.giveth.com"
                        help="Where can people join your Community? Paste a link here for your community's website, social or chatroom."
                        validations="isUrl"
                        validationErrors={{
                          isUrl: 'Please provide a url.',
                        }}
                      />
                    </div>

                    <div className="form-group row">
                      <div className="col-4">
                        <GoBackButton history={history} />
                      </div>
                      <div className="col-4 offset-4">
                        <LoaderButton
                          className="btn btn-success pull-right"
                          formNoValidate
                          type="submit"
                          disabled={isSaving || !formIsValid || (dac.id && dac.delegateId === 0)}
                          isLoading={isSaving}
                          network="Foreign"
                          loadingText="Saving..."
                        >
                          {isNew ? 'Create DAC' : 'Update DAC'}
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

EditDAC.propTypes = {
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
};

EditDAC.defaultProps = {
  currentUser: undefined,
  isNew: false,
};

export default props => (
  <UserConsumer>
    {({ state: { currentUser, isLoading: userIsLoading } }) => (
      <Fragment>
        {userIsLoading && <Loader className="fixed" />}
        {!userIsLoading && <EditDAC currentUser={currentUser} {...props} />}
      </Fragment>
    )}
  </UserConsumer>
);
