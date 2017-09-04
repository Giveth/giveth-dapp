import React, { Component } from 'react'
import { Link } from 'react-router-dom'

class AuthenticatedLink extends Component {
  componentWillUpdate() {
    console.log(this.props)
  }

  render() {

    const {className, to, wallet, onClick, children} = this.props

    if(wallet && wallet.unlocked) {
      return (
        <Link className={className} to={to}>{children}</Link>
      )
    } else {
      return (
        <a className={className} href="#" onClick={()=>onClick(to)}>{children}</a>
      )
    }
  }
}

export default AuthenticatedLink