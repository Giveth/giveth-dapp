import React, { Component } from 'react'
import PropTypes from 'prop-types'

class BackgroundImageHeader extends Component {
  render(){
    const backgroundStyle = {
      background: 'linear-gradient( rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.9) ), url(' + this.props.image + ')',
      height: this.props.height
    }

    return(
      <div className="background-image-header" style={backgroundStyle} >
        <div className="vertical-align">
          <center>
            {this.props.children}
          </center>
        </div>
      </div>
    )
  }
}

export default BackgroundImageHeader

BackgroundImageHeader.propTypes = {
  image: PropTypes.string.isRequired,
  height: PropTypes.number
}