import React, { Component } from 'react'
import PropTypes from 'prop-types';

class GoBackButton extends Component {
  goBack(){
    this.props.history.goBack()
  }

  render(){
    return(
      <a className="go-back-button" onClick={()=>this.goBack()}>
        <i className="fa fa-long-arrow-left"></i>
        back
      </a>
    )
  }
}

export default GoBackButton

GoBackButton.propTypes = {
  history: PropTypes.object.isRequired
}