import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const CommunityButton = ({ url, className, children }) => {
  const [icon, setIcon] = useState('external-link');

  useEffect(() => {
    switch (true) {
      case url.indexOf('slack') > -1:
        setIcon('fa-slack');
        break;
      case url.indexOf('reddit') > -1:
        setIcon('fa-reddit');
        break;
      case url.indexOf('facebook') > -1:
        setIcon('fa-facebook-square');
        break;
      case url.indexOf('github') > -1:
        setIcon('fa-github');
        break;
      case url.indexOf('twitter') > -1:
        setIcon('fa-twitter');
        break;
      case url.indexOf('linkedin') > -1:
        setIcon('fa-linkedin');
        break;
      default:
    }
  }, [url]);

  return (
    <a className={className} href={`//${url}`} target="_blank" rel="noopener noreferrer">
      <i className={`fa ${icon !== 'external-link' ? icon : 'd-none'}`}>&nbsp;</i>
      {children}
    </a>
  );
};

CommunityButton.propTypes = {
  url: PropTypes.string.isRequired,
  className: PropTypes.string,
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
};

CommunityButton.defaultProps = {
  className: '',
};

export default CommunityButton;
