import React, { Component } from 'react';
import PropTypes from 'prop-types';

class CommunityButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      icon: 'fa-external-link',
    };
  }

  componentWillMount() {
    // parse community icon from url

    const u = this.props.url;

    if (u.indexOf('slack') > -1) this.setState({ icon: 'fa-slack' });
    if (u.indexOf('reddit') > -1) this.setState({ icon: 'fa-reddit' });
    if (u.indexOf('facebook') > -1) this.setState({ icon: 'fa-facebook-square' });
    if (u.indexOf('github') > -1) this.setState({ icon: 'fa-github' });
    if (u.indexOf('twitter') > -1) this.setState({ icon: 'fa-twitter' });
    if (u.indexOf('linkedin') > -1) this.setState({ icon: 'fa-linkedin' });
  }

  render() {
    const icon = this.state.icon ? <i className={`fa ${this.state.icon}`} /> : null;
    return (
      <a
        className={this.props.className}
        href={this.props.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {icon}
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
