import React from 'react';
import PropTypes from 'prop-types';

const BackgroundImageHeader = props => {
  const backgroundStyle = {
    background: `linear-gradient( rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.9) ), url(${props.image})`,
    height: props.height,
  };

  const totalPadding = props.height - 40;

  const numberStyle = {
    fontSize: '7px',
    paddingTop: `${totalPadding}px`,
  };

  return (
    <div className="background-image-header" style={backgroundStyle}>
      <div className="vertical-align">
        <center>{props.children}</center>
      </div>
      <div style={numberStyle}>{props.adminId}</div>
    </div>
  );
};

export default BackgroundImageHeader;

BackgroundImageHeader.propTypes = {
  image: PropTypes.string,
  height: PropTypes.number,
  children: PropTypes.node,
  adminId: PropTypes.number,
};

BackgroundImageHeader.defaultProps = {
  height: 0,
  children: null,
  image: '',
  adminId: 0,
};
