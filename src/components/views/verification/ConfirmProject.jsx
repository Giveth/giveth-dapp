import React from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import DescriptionRender from '../../DescriptionRender';

const ConfirmProject = ({ handleNextStep, project, reportIssue, formIsValid }) => {
  return (
    <div>
      <img
        className="w-100"
        height={150}
        src={project.image}
        alt={project.title}
        style={{ objectFit: 'cover' }}
      />
      <div className="row p-4">
        <div className="col-md-4">
          <div className="custom-title">Confirm your Project to make it traceable</div>
        </div>
        <div className="text-left col-md-8">
          <div>
            <strong>Title: </strong>
            {project.title}
          </div>
          <div className="my-4">
            <strong>Owner: </strong>
            {project.owner.name}
          </div>
          <div className="mb-5">
            <strong>Description: </strong>
            {DescriptionRender(project.description)}
          </div>
          <Button disabled={!formIsValid} ghost onClick={handleNextStep}>
            CONFIRM & SIGN
          </Button>
          <Button onClick={reportIssue} type="text">
            Report an Issue
          </Button>
        </div>
      </div>
    </div>
  );
};

ConfirmProject.propTypes = {
  handleNextStep: PropTypes.func.isRequired,
  project: PropTypes.shape().isRequired,
  reportIssue: PropTypes.func.isRequired,
  formIsValid: PropTypes.bool.isRequired,
};

export default ConfirmProject;
