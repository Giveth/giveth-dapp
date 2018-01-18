import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Avatar from 'react-avatar';

import { File } from 'formsy-react-components';
import ImageTools from './../lib/ImageResizer';

/* global FileReader */
/**
 * Image uploader with preview. Returns base64 image
 *
 *  @param setImage Callback function that is called every time the image changes
 */
class FormsyImageUploader extends Component {
  constructor() {
    super();

    this.state = {
      image: undefined,
    };

    this.loadAndPreviewImage = this.loadAndPreviewImage.bind(this);
  }

  componentWillMount() {
    this.setState({ image: this.props.previewImage });
  }

  loadAndPreviewImage() {
    const reader = new FileReader();
    reader.onload = e => {
      this.setState({ image: e.target.result });
      this.props.setImage(e.target.result);
    };

    ImageTools.resize(
      this.imagePreview.element.files[0],
      {
        width: 800,
        height: 600,
      },
      (blob, didItResize) => {
        reader.readAsDataURL(
          didItResize ? blob : this.imagePreview.element.files[0],
        );
      },
    );
  }

  render() {
    return (
      <div>
        {(this.props.previewImage || this.previewImage) && (
          <div id="image-preview">
            <img src={this.state.image} alt="Preview of uploaded file" />
          </div>
        )}

        {this.props.avatar && (
          <Avatar size={100} src={this.props.avatar} round />
        )}

        <File
          label="Add a picture"
          name="picture"
          accept=".png,.jpeg,.jpg"
          onChange={() => this.loadAndPreviewImage()}
          ref={c => {
            this.imagePreview = c;
          }}
          help="A picture says more than a thousand words. Select a png or jpg file."
          validations="minLength: 1"
          validationErrors={{
            minLength: 'Please select a png or jpg file.',
          }}
          required={this.props.isRequired}
        />
      </div>
    );
  }
}

FormsyImageUploader.propTypes = {
  isRequired: PropTypes.bool,
  avatar: PropTypes.string,
  setImage: PropTypes.func.isRequired,
  previewImage: PropTypes.string,
};

FormsyImageUploader.defaultProps = {
  isRequired: false,
  avatar: undefined,
  previewImage: undefined,
};

export default FormsyImageUploader;
