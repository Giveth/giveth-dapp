import React from 'react';
import PropTypes from 'prop-types';

const BackgroundImageHeader = props => {
  const { adminId, image, children } = props;
  const backgroundStyle = {
    background: `linear-gradient( rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.9) ), url(${image})`,
    minHeight: '300px',
  };

  return (
    <div className="background-image-header" style={backgroundStyle}>
      <div className="vertical-align">
        <div className="text-center" style={{ maxWidth: '900px' }}>
          {children}
        </div>
      </div>
      <div className="project-id">{adminId}</div>
    </div>
  );
};

export default BackgroundImageHeader;

BackgroundImageHeader.propTypes = {
  image: PropTypes.string,
  children: PropTypes.node,
  adminId: PropTypes.number,
};

BackgroundImageHeader.defaultProps = {
  children: null,
  image: '',
  adminId: 0,
};
