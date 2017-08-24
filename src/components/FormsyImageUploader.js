import React, { Component } from 'react'
import { File } from 'formsy-react-components'
import ImageTools from './../lib/ImageResizer'
import Avatar from 'react-avatar'

/**
 * Image uploader with preview. Returns base64 image
 *
 *  @props
 *    setImage (func):  
 *      Callback function that is called every time the image changes
 *    
 *  @returns
 *    base64 image
 */

class FormsyImageUploader extends Component {
  constructor(){
    super()

    this.state = {
      image: ''
    }
  }

  componentWillMount(){
    this.setState({ image: this.props.previewImage || '' })
  }

  loadAndPreviewImage() {
    const reader = new FileReader()  
    reader.onload = (e) => {
      this.setState({ image: e.target.result })
      this.props.setImage(e.target.result)
    }

    ImageTools.resize(this.refs.imagePreview.element.files[0], {
      width: 800,
      height: 600
    }, (blob, didItResize) => 
      reader.readAsDataURL(didItResize ? blob : this.refs.imagePreview.element.files[0]) )
  }

  render(){
    return(
      <div>
        { this.props.imagePreview &&
          <div id="image-preview">
            <img src={this.state.image} width="500px" alt=""/>
          </div>
        }

        { this.props.avatar &&
          <Avatar size={100} src={this.props.avatar} round={true}/>                  
        }

        <div className="form-group">
          <label>Add a picture</label>
          <File
            name="picture"
            onChange={()=>this.loadAndPreviewImage()}
            ref="imagePreview"
            help="Select a png or jpeg."
            validations="isExisty"
            validationErrors={{
              isExisty: "Please select an image file."
            }}                
            required
          />
        </div> 
      </div>     
    )
  }
}

export default FormsyImageUploader
