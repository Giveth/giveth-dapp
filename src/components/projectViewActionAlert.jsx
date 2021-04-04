import React from 'react';
import PropTypes from 'prop-types';

const ProjectViewActionAlert = props => {
  const { show, message, children } = props;
  return (
    show && (
      <div className="alert alert-secondary vertical-align flex-row project-alert" role="alert">
        <span className="flex-grow-1">{message}</span>
        <span>{children}</span>
      </div>
    )
  );
};

ProjectViewActionAlert.propTypes = {
  show: PropTypes.bool,
  message: PropTypes.string.isRequired,
};

ProjectViewActionAlert.defaultProps = {
  show: true,
};

const propsAreEqual = (prevProps, nextProps) =>
  prevProps.show === nextProps.show && prevProps.message === nextProps.message;

export default React.memo(ProjectViewActionAlert, propsAreEqual);
