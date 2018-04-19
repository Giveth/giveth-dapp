import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { SkyLightStateless } from 'react-skylight';
import { Input, Form } from 'formsy-react-components';
import { utils } from 'web3';
import { Portal } from 'react-portal';
import { getStartOfDayUTC } from '../lib/helpers';
import FormsyImageUploader from './FormsyImageUploader';
import RateConvertor from './RateConvertor';

const addMilestoneModalStyle = {
  width: '70% !important',
  height: '700px !important',
  marginTop: '-350px',
  maxHeight: '700px',
  overflowY: 'scroll',
  textAlign: 'left',
};

const initialState = {
  date: getStartOfDayUTC().subtract(1, 'd'),
  description: '',
  image: '',
  uploadNewImage: false,
  formIsValid: false,
};

export default class AddMilestoneItemModal extends Component {
  constructor(props) {
    super(props);
    this.state = initialState;
    this.setImage = this.setImage.bind(this);
    this.mapInputs = this.mapInputs.bind(this);
    this.closeDialog = this.closeDialog.bind(this);
    this.submit = this.submit.bind(this);
  }

  setImage(image) {
    this.setState({ image });
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

  closeDialog() {
    this.props.onClose();
    this.setState(initialState);
  }

  submit(model) {
    this.props.onAddItem(model);
    this.setState(initialState);
  }

  render() {
    const { visible } = this.props;
    const { formIsValid, description, image } = this.state;
    return (
      <Portal className="add-milestone-item-skylight">
        {visible && (
          <SkyLightStateless
            isVisible={visible}
            onCloseClicked={this.closeDialog}
            title="Add an item to this milestone"
            dialogStyles={addMilestoneModalStyle}
          >
            <Form
              onSubmit={this.submit}
              mapping={this.mapInputs}
              onValid={() => this.setState({ formIsValid: true })}
              onInvalid={() => this.setState({ formIsValid: false })}
              layout="vertical"
            >
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

              <RateConvertor getEthConversion={this.props.getEthConversion} />

              <FormsyImageUploader
                name="image"
                previewImage={image}
                setImage={this.setImage}
                resize={false}
              />

              <button
                className="btn btn-primary"
                disabled={!formIsValid}
                formNoValidate
                type="submit"
              >
                Add item
              </button>

              <button className="btn btn-link" onClick={() => this.closeDialog()}>
                Cancel
              </button>
            </Form>
          </SkyLightStateless>
        )}
      </Portal>
    );
  }
}

AddMilestoneItemModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  getEthConversion: PropTypes.func.isRequired,
  onAddItem: PropTypes.func.isRequired,
};
