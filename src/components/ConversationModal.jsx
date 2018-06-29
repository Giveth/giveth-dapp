/* eslint-disable jsx-a11y/anchor-is-valid */

import React, { Component } from 'react';
import { Form, Prompt } from 'formsy-react-components';
import { SkyLightStateless } from 'react-skylight';

import QuillFormsy from 'components/QuillFormsy';
import LoaderButton from 'components/LoaderButton';
import MilestoneProof from 'components/MilestoneProof';

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
      conversation: '',
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
        conversation: '',
        show: true,
      });
    });
  }

  hide(reject) {
    this.setState({
      show: false,
      items: [],
    });

    if (reject) {
      this.promise.reject();
    } else {
      this.promise.resolve();
    }
  }

  /* eslint-disable class-methods-use-this */

  mapInputs(inputs) {
    return {
      conversation: inputs.conversation,
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

  submit(model) {
    model.items = this.state.items;

    this.hide();
    this.promise.resolve();
  }

  render() {
    const {
      show,
      conversation,
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
      <SkyLightStateless isVisible={show}>
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
                  name="conversation"
                  label="Explain how you are going to do this successfully."
                  helpText="Make it as extensive as necessary. Your goal is to build trust,
                  so that people donate Ether to your Campaign. Don't hesitate to add a detailed budget for this Milestone"
                  value={conversation}
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
