import React, { Component } from 'react'
import PropTypes from 'prop-types';

class CommunityButton extends Component {
  constructor(){
    super();
    this.state = {
      icon: 'external-link'
    }
  }

  componentWillMount(){
    // parse community icon from url

    const u = this.props.url

    if(u.indexOf('slack') > -1) this.setState({ icon: 'fa-slack'})
    if(u.indexOf('reddit') > -1) this.setState({ icon: 'fa-reddit'})
    if(u.indexOf('facebook') > -1) this.setState({ icon: 'fa-facebook-square'})
    if(u.indexOf('github') > -1) this.setState({ icon: 'fa-github'})
    if(u.indexOf('twitter') > -1) this.setState({ icon: 'fa-twitter'})
    if(u.indexOf('linkedin') > -1) this.setState({ icon: 'fa-linkedin'})    
  }


  render() {
    return (
      <a className={this.props.className} href={this.props.url} target="_blank" rel="noopener noreferrer">
        <i className={`fa ${this.state.icon}`}></i>
        {this.props.children}
      </a>      
    )
  }
}

export default CommunityButton

CommunityButton.propTypes = {
  url: PropTypes.string.isRequired,
  className: PropTypes.string
}