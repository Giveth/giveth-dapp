import React from 'react';
import PropTypes from 'prop-types';

const BackgroundImageHeader = props => {
  const backgroundStyle = {
    background: `linear-gradient( rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.9) ), url(${props.image})`,
    height: props.height,
  };

  return (
    <div className="background-image-header" style={backgroundStyle}>
      <div className="vertical-align">
        <center>{props.children}</center>
      </div>
    </div>
  );
};

export default BackgroundImageHeader;

BackgroundImageHeader.propTypes = {
  image: PropTypes.string,
  height: PropTypes.number,
  children: PropTypes.node,
};

BackgroundImageHeader.defaultProps = {
  height: 0,
  children: null,
};
