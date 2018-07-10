/* eslint-disable jsx-a11y/anchor-is-valid */

import React, { Component } from 'react';
import { Prompt } from 'react-router-dom';
import { Form } from 'formsy-react-components';
import { SkyLightStateless } from 'react-skylight';

import QuillFormsy from 'components/QuillFormsy';
import LoaderButton from 'components/LoaderButton';
import MilestoneProof from 'components/MilestoneProof';

import { feathersRest } from 'lib/feathersClient';

/**
  A promise modal that creates

  STEP 1 - Create a ref
  this.conversationModal = React.createRef();
  
  STEP 2 - Assign ref
  <ConversationModal
    ref={this.conversationModal}
  />  

  STEP 3 - Call it
  this.conversationModal.current.show({
    title: 'Do this?',
    description: 'Yes!',
    required: false,
    cta: 'Save'
  })
    .then(() => console.log('success!'))
    .catch(() => console.log('canceled!'))
* */

class ConversationModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      show: false,
      formIsValid: false,
      isSaving: false,
      message: '',
      items: [],
      isBlocking: false,
    };

    this.promise = {};

    this.form = React.createRef();

    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
    this.onItemsChanged = this.onItemsChanged.bind(this);
    this.submit = this.submit.bind(this);
  }

  onItemsChanged(items) {
    this.setState({ items });
  }

  show({ title, description, cta, required }) {
    return new Promise((resolve, reject) => {
      this.promise = {
        resolve,
        reject,
      };

      this.form.current.formsyForm.reset();

      this.setState({
        items: [],
        title,
        description,
        CTA: cta,
        required,
        message: '',
        show: true,
      });
    });
  }

  hide(reject) {
    if (reject) {
      this.promise.reject();
    } else {
      this.promise.resolve({
        message: this.state.message,
        items: this.state.items,
      });
    }

    this.setState({
      show: false,
      message: '',
      items: [],
    });
  }

  /* eslint-disable class-methods-use-this */

  mapInputs(inputs) {
    return {
      message: inputs.message,
    };
  }

  toggleFormValid(state) {
    this.setState({ formIsValid: state });
  }

  triggerRouteBlocking() {
    const form = this.form.current.formsyForm;
    // we only block routing if the form state is not submitted
    this.setState({ isBlocking: form && (!form.state.formSubmitted || form.state.isSubmitting) });
  }

  saveProofImages() {
    // construct image upload promises
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

    // upload images
    return Promise.all(uploadItemImages);
  }

  submit(model) {
    this.saveProofImages()
      .then(() => {
        this.setState(
          {
            items: this.state.items,
            message: model.message,
          },
          () => this.hide(),
        );
      })
      .catch(() => {
        this.setState({ isSaving: false, isBlocking: true });
      });
  }

  render() {
    const {
      show,
      message,
      formIsValid,
      isSaving,
      required,
      title,
      description,
      CTA,
      items,
      isBlocking,
    } = this.state;

    return (
      <SkyLightStateless isVisible={show} onCloseClicked={() => this.hide(true)}>
        <h2>{title}</h2>
        <p>{description}</p>

        <Form
          id="conversation"
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

          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <QuillFormsy
                  name="message"
                  label="Explain how you are going to do this successfully."
                  helpText="Make it as extensive as necessary. Your goal is to build trust,
                  so that people donate Ether to your Campaign. Don't hesitate to add a detailed budget for this Milestone"
                  value={message}
                  placeholder="Describe how you're going to execute your Milestone successfully
                  ..."
                  validations="minLength:3"
                  help="Describe your Milestone."
                  validationErrors={{
                    minLength: 'Please provide at least 3 characters.',
                  }}
                  required={required}
                />
              </div>

              <LoaderButton
                className="btn btn-success"
                formNoValidate
                type="submit"
                disabled={isSaving || !formIsValid}
                isLoading={isSaving}
                loadingText="Saving..."
              >
                <span>{CTA}</span>
              </LoaderButton>

              <a
                role="button"
                tabIndex="-1"
                className="btn btn-primary"
                disabled={!formIsValid}
                onClick={() => this.hide(true)}
                onKeyUp={() => this.hide(true)}
              >
                Cancel
              </a>
            </div>

            <div className="col-6">
              <MilestoneProof
                isEditMode
                items={items}
                onItemsChanged={returnedItems => this.onItemsChanged(returnedItems)}
              />
            </div>
          </div>
        </Form>
      </SkyLightStateless>
    );
  }
}

export default ConversationModal;
