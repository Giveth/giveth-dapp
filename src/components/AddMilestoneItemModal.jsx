/* eslint-disable prefer-destructuring */
/* eslint-disable jsx-a11y/anchor-is-valid */

import React, { Component } from 'react';
import { Prompt } from 'react-router-dom';
import PropTypes from 'prop-types';
import Modal from 'react-modal';

import { Input, Form } from 'formsy-react-components';
import { utils } from 'web3';

import { getStartOfDayUTC } from '../lib/helpers';
import FormsyImageUploader from './FormsyImageUploader';
import RateConvertor from './RateConvertor';
import getEthConversionContext from 'containers/getEthConversionContext';

const modalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-20%',
    transform: 'translate(-50%, -50%)',
    boxShadow: '0 0 40px #ccc',
    overflowY: 'scroll',
  },
};

Modal.setAppElement('#root');

const initialState = {
  date: getStartOfDayUTC().subtract(1, 'd'),
  description: '',
  image: '',
  uploadNewImage: false,
  formIsValid: false,
};

class AddMilestoneItemModal extends Component {
  constructor(props) {
    super(props);

    this.form = React.createRef();

    this.state = initialState;
    this.setImage = this.setImage.bind(this);
    this.mapInputs = this.mapInputs.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.submit = this.submit.bind(this);
  }

  setImage(image) {
    this.setState({ image });
  }

  triggerRouteBlocking() {
    const form = this.form.current.formsyForm;
    // we only block routing if the form state is not submitted
    this.setState({ isBlocking: form && (!form.state.formSubmitted || form.state.isSubmitting) });
  }

  mapInputs(inputs) {
    return {
      date: inputs.date.format(),
      description: inputs.description,
      image: this.state.image,
      selectedFiatType: inputs.fiatType,
      fiatAmount: inputs.fiatAmount,
      etherAmount: inputs.etherAmount,
      wei: utils.toWei(inputs.etherAmount),
      conversionRate: parseFloat(inputs.conversionRate),
      ethConversionRateTimestamp: inputs.ethConversionRateTimestamp,
    };
  }

  closeModal() {
    this.props.onClose();
    this.setState(initialState);
  }

  submit() {
    // Formsy doesn't like nesting, even when using Portals
    // So we're manually fetching and submitting the model
    const form = this.form;
    const model = form.current.formsyForm.getModel();

    this.props.onAddItem(model);
    this.setState(initialState);
  }

  render() {
    const { openModal } = this.props;
    const { formIsValid, description, image, isBlocking } = this.state;

    return (
      <Modal
        isOpen={openModal}
        onRequestClose={this.closeModal}
        contentLabel="Add an item to this milestone"
        style={modalStyles}
      >
        <Form
          id="milestone-form"
          ref={this.form}
          mapping={this.mapInputs}
          onValid={() => this.setState({ formIsValid: true })}
          onInvalid={() => this.setState({ formIsValid: false })}
          onChange={e => this.triggerRouteBlocking(e)}
          layout="vertical"
        >
          <Prompt
            when={isBlocking}
            message={() =>
              `You have unsaved changes. Are you sure you want to navigate from this page?`
            }
          />

          <div className="form-group row">
            <div className="col-12">
              <Input
                label="Description"
                name="description"
                type="text"
                value={description}
                placeholder="E.g. my receipt"
                validations="minLength:3"
                validationErrors={{
                  minLength: 'Provide description',
                }}
                required
                autoFocus
              />
            </div>
          </div>

          <RateConvertor />

          <FormsyImageUploader
            name="image"
            previewImage={image}
            setImage={this.setImage}
            resize={false}
          />

          {/*
          NOTE: Due to a Formsy issue, we're using a 'fake' submit button here
          */}

          <a
            role="button"
            tabIndex="-1"
            className="btn btn-primary"
            disabled={!formIsValid}
            onClick={() => this.submit()}
            onKeyUp={() => this.submit()}
          >
            Attach
          </a>

          <button className="btn btn-link" onClick={() => this.closeModal()}>
            Cancel
          </button>
        </Form>
      </Modal>
    );
  }
}

AddMilestoneItemModal.propTypes = {
  openModal: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAddItem: PropTypes.func.isRequired,
};

export default getEthConversionContext(AddMilestoneItemModal);
