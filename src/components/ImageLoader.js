import React, { Component } from 'react'

/**
 * Loads an image as base64, resizes image and shows a instant preview
 */

class ImageLoader extends Component {

  resizeImage(){
    console.log('resizing to', this.props.resize)
  }

  render(){
    return(
      <div className="form-group">
        <div id="preview"></div>
        <label>Image or video    
          <input className="form-control" type="file" change={this.resizeImage}/>
        </label>
      </div>
    )
  }
}

export default ImageLoader