import React, { Component } from 'react'
import { NavLink } from 'react-router-dom'
import {withRouter} from "react-router-dom";
import PropTypes from 'prop-types'


class AuthenticatedNavLink extends Component {
  render() {

    const {className, to, wallet, children} = this.props

    if(wallet && wallet.unlocked) {
      return (
        <NavLink className={className} to={to}>{children}</NavLink>
      )
    } else {
      return (
        <div>
          <a className={className} onClick={()=>React.unlockWallet(to)}>{children}</a>
        </div>
      )
    }
  }
}

export default withRouter(AuthenticatedNavLink)

AuthenticatedNavLink.propTypes = {
  wallet: PropTypes.shape({
    unlocked: PropTypes.bool.isRequired,
    unlock: PropTypes.func.isRequired,
  }),
  to: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};