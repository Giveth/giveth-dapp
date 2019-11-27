/* eslint-disable jsx-a11y/anchor-is-valid */

import React, { Component } from 'react';
import { Prompt } from 'react-router-dom';
import PropTypes from 'prop-types';
import Modal from 'react-modal';
import BigNumber from 'bignumber.js';

import { Input, Form } from 'formsy-react-components';
import { utils } from 'web3';

import getConversionRatesContext from 'containers/getConversionRatesContext';
import MilestoneItem from 'models/MilestoneItem';
import FormsyImageUploader from './FormsyImageUploader';
import RateConverter from './RateConverter';

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

class AddMilestoneItemModal extends Component {
  constructor(props) {
    super(props);

    this.form = React.createRef();

    this.state = {
      item: new MilestoneItem({}),
      formIsValid: false,
    };
    this.setImage = this.setImage.bind(this);
    this.mapInputs = this.mapInputs.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.submit = this.submit.bind(this);
  }

  setImage(image) {
    const { item } = this.state;
    item.image = image;
    this.setState({ item });
  }

  triggerRouteBlocking() {
    const form = this.form.current.formsyForm;
    // we only block routing if the form state is not submitted
    this.setState({
      isBlocking: form && (!form.state.formSubmitted || form.state.isSubmitting),
    });
  }

  mapInputs(inputs) {
    const { item } = this.state;

    // set values on MilestoneItem
    item.date = inputs.date.format();
    item.description = inputs.description;
    item.selectedFiatType = inputs.fiatType;
    item.fiatAmount = new BigNumber(inputs.fiatAmount);
    item.wei = utils.toWei(inputs.etherAmount);
    item.conversionRate = parseFloat(inputs.conversionRate);
    item.conversionRateTimestamp = inputs.conversionRateTimestamp;

    this.setState({ item });
  }

  closeModal() {
    this.props.onClose();
    this.reset();
  }

  reset() {
    this.setState({
      item: new MilestoneItem({}),
      formIsValid: false,
    });
  }

  submit() {
    // Formsy doesn't like nesting, even when using Portals
    // So we're manually fetching and submitting the model

    // We need to call getModel here to set values on the MilestoneItem
    this.form.current.formsyForm.getModel();

    // Get MilestoneItem
    this.props.onAddItem(this.state.item);
    this.reset();
  }

  render() {
    const { openModal, token, conversionRateLoading } = this.props;
    const { formIsValid, item, isBlocking } = this.state;

    return (
      <Modal
        isOpen={openModal}
        onRequestClose={this.closeModal}
        contentLabel="Add an item to this Milestone"
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
                value={item.description}
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

          <RateConverter token={token} />

          <FormsyImageUploader
            name="image"
            previewImage={item.image}
            setImage={this.setImage}
            resize={false}
          />

          {/*
          NOTE: Due to a Formsy issue, we're using a 'fake' submit button here
          */}

          <a
            role="button"
            tabIndex="-1"
            className={`btn btn-primary ${!formIsValid || conversionRateLoading ? 'disabled' : ''}`}
            disabled={!formIsValid || conversionRateLoading}
            onClick={() => this.submit()}
            onKeyUp={() => this.submit()}
          >
            Attach
          </a>

          <button type="button" className="btn btn-link" onClick={() => this.closeModal()}>
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
  token: PropTypes.shape({}),
  conversionRateLoading: PropTypes.bool.isRequired,
};

AddMilestoneItemModal.defaultProps = {
  token: undefined,
};

export default getConversionRatesContext(AddMilestoneItemModal);
