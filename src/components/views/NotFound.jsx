import React from 'react';
import PropTypes from 'prop-types';

/**
 * Route not found page
 */
function NotFound(props) {
  const { projectType } = props;
  let message;

  if (projectType === 'Page') {
    message = <p>Page not found!</p>;
  } else {
    message = (
      <p>
        <em>
          <strong>{projectType}</strong> not found!
        </em>
      </p>
    );
  }
  return (
    <div className="text-center" style={{ marginTop: '150px' }}>
      <h1 className="display-5 mt-5 text-info"> Oops! </h1>
      <h1 className="display-1 text-info">404</h1>
      <h2 className="text-dark"> {message} </h2>
    </div>
  );
}

NotFound.propTypes = {
  projectType: PropTypes.string,
};

NotFound.defaultProps = {
  projectType: 'Page',
};

export default NotFound;
