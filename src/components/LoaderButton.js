import React, { Component } from 'react';
import Loader from './Loader'
import PropTypes from 'prop-types'

/**
 * Renders a button with an optional loader
 *
 *  @props
 *    className (string): classNames
 *    formNoValidate (bool): wether to validate formsy
 *    disable (bool): disables button
 *    isLoading (bool): state of button. If true, disables and renders spinner
 *    loadingText (string): text to show when state is loading
 *    children: elements / text showing when state is not loading
 */


class LoaderButton extends Component {
  render(){
    const { className, formNoValidate, type, disabled, isLoading, loadingText, children } = this.props

    return(
      <button className={className} formNoValidate={formNoValidate} type={type} disabled={disabled}>
        {isLoading &&
          <span>
            <Loader className="small btn-loader"/>
            {loadingText}
          </span>
        }

        {!isLoading &&
          <span>{children}</span>
        }
      </button> 
    )  
  }
}

export default LoaderButton

LoaderButton.propTypes = {
  className: PropTypes.string,
  formNoValidate: PropTypes.bool,
  disable: PropTypes.bool,
  isLoading: PropTypes.bool,
  loadingText: PropTypes.string,
  children: PropTypes.node
}