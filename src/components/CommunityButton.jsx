import React, { Component } from 'react';
import PropTypes from 'prop-types';

class CommunityButton extends Component {
  constructor(props) {
    super(props);
    let icon = 'external-link';
    const u = this.props.url;

    if (u.indexOf('slack') > -1) icon = 'fa-slack';
    if (u.indexOf('reddit') > -1) icon = 'fa-reddit';
    if (u.indexOf('facebook') > -1) icon = 'fa-facebook-square';
    if (u.indexOf('github') > -1) icon = 'fa-github';
    if (u.indexOf('twitter') > -1) icon = 'fa-twitter';
    if (u.indexOf('linkedin') > -1) icon = 'fa-linkedin';

    this.state = {
      icon,
    };
  }

  render() {
    return (
      <a
        className={this.props.className}
        href={this.props.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        <i className={`fa ${this.state.icon}`} />
        {this.props.children}
      </a>
    );
  }
}

CommunityButton.propTypes = {
  url: PropTypes.string.isRequired,
  className: PropTypes.string,
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
};

CommunityButton.defaultProps = {
  className: '',
};

export default CommunityButton;
