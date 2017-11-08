import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import {withRouter} from "react-router-dom";
import PropTypes from 'prop-types'


class AuthenticatedLink extends Component {
  render() {

    const {className, to, wallet, children} = this.props

    if(wallet && wallet.unlocked) {
      return (
        <Link className={className} to={to}>{children}</Link>
      )
    } else {
      return (
        <button className={className} onClick={()=>React.unlockWallet(to)}>{children}</button>
      )
    }
  }
}

export default withRouter(AuthenticatedLink)

AuthenticatedLink.propTypes = {
  wallet: PropTypes.shape({
    unlocked: PropTypes.bool.isRequired,
    unlock: PropTypes.func.isRequired,
  }),
  to: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};