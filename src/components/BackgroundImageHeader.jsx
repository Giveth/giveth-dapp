import React from 'react';
import PropTypes from 'prop-types';

const BackgroundImageHeader = props => {
  const {
    adminId,
    image,
    editProject,
    cancelProject,
    deleteProject,
    children,
    projectType,
  } = props;
  const backgroundStyle = {
    background: `linear-gradient( rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.9) ), url(${image})`,
    minHeight: '300px',
  };

  let showTrashButton = true;
  let trashButtonLabel;
  let trashButtonFunction;

  if (cancelProject) {
    trashButtonLabel = 'Cancel';
    trashButtonFunction = cancelProject;
  } else if (deleteProject) {
    trashButtonLabel = 'Delete';
    trashButtonFunction = deleteProject;
  } else {
    showTrashButton = false;
  }

  return (
    <div className="background-image-header" style={backgroundStyle}>
      <div className="header-action">
        {editProject && (
          <button type="button" className="btn text-light" onClick={editProject}>
            <i className="fa fa-pencil" />
            &nbsp;Edit {projectType}
          </button>
        )}
        {showTrashButton && (
          <button type="button" className="btn text-light" onClick={trashButtonFunction}>
            <i className="fa fa-trash-o" />
            &nbsp;{trashButtonLabel} {projectType}
          </button>
        )}
      </div>
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
  projectType: PropTypes.string.isRequired,
  editProject: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
  cancelProject: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
  deleteProject: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
};

BackgroundImageHeader.defaultProps = {
  children: null,
  image: '',
  adminId: 0,
  editProject: undefined,
  cancelProject: undefined,
  deleteProject: undefined,
};
