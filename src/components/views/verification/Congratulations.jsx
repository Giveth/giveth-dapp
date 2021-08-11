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

const Congratulations = ({ handleNextStep }) => {
  return (
    <div>
      <img
        className="w-100"
        height={150}
        src={project.image}
        alt={project.title}
        style={{ objectFit: 'cover' }}
      />
      <div className="text-left p-5">
        <div>{project.title}</div>
        <div className="my-4">{project.owner}</div>
        <div className="mb-5">{project.description}</div>
        <Button ghost onClick={handleNextStep}>
          GO TO YOUR PROJECT
        </Button>
        <Button type="text">Back to Giveth.io</Button>
      </div>
    </div>
  );
};

Congratulations.propTypes = {
  handleNextStep: PropTypes.func.isRequired,
};

export default Congratulations;
