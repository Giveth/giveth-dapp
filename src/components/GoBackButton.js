import React, { Component } from 'react'


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