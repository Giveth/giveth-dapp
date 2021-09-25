import React from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import DescriptionRender from '../../DescriptionRender';
import { history } from '../../../lib/helpers';

const Congratulations = ({ campaignSlug, project }) => {
  const backToGiveth = () => {
    window.location.href = 'https://giveth.io';
  };

  const goToProject = () => {
    history.replace(`/campaign/${campaignSlug}`);
  };

  return (
    <div>
      {project.image && (
        <img
          className="w-100"
          height={150}
          src={project.image}
          alt={project.title}
          style={{ objectFit: 'cover' }}
        />
      )}
      <div className="text-left p-5">
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
        <Button ghost onClick={goToProject}>
          GO TO YOUR PROJECT
        </Button>
        <Button onClick={backToGiveth} type="text">
          Back to Giveth.io
        </Button>
      </div>
    </div>
  );
};

Congratulations.propTypes = {
  campaignSlug: PropTypes.string.isRequired,
  project: PropTypes.shape().isRequired,
};

export default Congratulations;
