import React from 'react';
import config from '../../../configuration';

const Banner = () => {
  return (
    <a target="_blank" rel="noopener noreferrer" href={config.givethUrl}>
      <div className="text-white p-4 m-0 pointer" id="tx-limit-banner">
        <b>Giveth TRACE has been deprecated.</b> Go to giveth.io to explore public goods projects.
      </div>
    </a>
  );
};

export default Banner;
