import React, { Component } from 'react';

/**

Loader shows a loader. Add className="fixed" as prop to make a fixed loader

**/

class Loader extends Component {
  render(){

  return (
    <div className={`spinner ${this.props.className}`}>
      <div className="double-bounce1"></div>
      <div className="double-bounce2"></div>
    </div>
    )
  }
}

export default Loader
