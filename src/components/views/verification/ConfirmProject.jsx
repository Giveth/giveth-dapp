import React from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import Pic from '../../../assets/project.jpeg';

const project = {
  owner: 'Juntanza Espontánea Chapinero',
  title: 'SUPPORT PROTESTS IN COLOMBIA #SOSCOLOMBIA',
  description:
    'The current social and health crisis in Colombia is forcing people to raise their voices. This year, the protests began on April 28th and people have taken the streets with no rest since then to claim to the government. Although...',
  image: Pic,
};

const ConfirmProject = ({ handleNextStep }) => {
  return (
    <div>
      <img
        className="mr-3 mt-1 w-100"
        height={150}
        src={project.image}
        alt={project.title}
        style={{ objectFit: 'cover' }}
      />
      <div className="row p-4">
        <div className="col-md-4">
          <div className="custom-title">Confirm your Project to get traceable</div>
        </div>
        <div className="text-left col-md-8">
          <div>{project.title}</div>
          <div className="my-4">{project.owner}</div>
          <div className="mb-5">{project.description}</div>
          <Button ghost onClick={handleNextStep}>
            CONFIRM YOUR PROJECT
          </Button>
          <Button type="text">Report an Issue</Button>
        </div>
      </div>
    </div>
  );
};

ConfirmProject.propTypes = {
  handleNextStep: PropTypes.func.isRequired,
};

export default ConfirmProject;
