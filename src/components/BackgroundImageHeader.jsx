import React from 'react';
import PropTypes from 'prop-types';

const BackgroundImageHeader = props => {
  const { adminId, image, editProject, cancelProject, children, height, projectType } = props;
  const backgroundStyle = {
    background: `linear-gradient( rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.9) ), url(${image})`,
    height,
  };

  return (
    <div className="background-image-header" style={backgroundStyle}>
      <div className="header-action">
        {editProject && (
          <button type="button" className="btn text-light" onClick={editProject}>
            <i className="fa fa-pencil" />
            &nbsp;Edit {projectType}
          </button>
        )}
        {cancelProject && (
          <button type="button" className="btn text-light" onClick={cancelProject}>
            <i className="fa fa-trash-o" />
            &nbsp;Cancel {projectType}
          </button>
        )}
      </div>
      <div className="vertical-align">
        <div className="text-center">{children}</div>
      </div>
      <div className="project-id">{adminId}</div>
    </div>
  );
};

export default BackgroundImageHeader;

BackgroundImageHeader.propTypes = {
  image: PropTypes.string,
  height: PropTypes.number,
  children: PropTypes.node,
  adminId: PropTypes.number,
  projectType: PropTypes.string.isRequired,
  editProject: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
  cancelProject: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
};

BackgroundImageHeader.defaultProps = {
  height: 0,
  children: null,
  image: '',
  adminId: 0,
  editProject: undefined,
  cancelProject: undefined,
};
