import React, { useEffect, useState } from 'react';
import { Button } from 'antd';
import IconClose from '../assets/icon-close.svg';
import config from '../configuration';

const SplashPage = () => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    document.body.style.overflow = show ? 'hidden' : 'auto';
  }, [show]);

  return (
    <div style={{ display: show ? 'flex' : 'none' }} id="splash-page">
      <Button ghost onClick={() => setShow(false)}>
        <img src={IconClose} alt="close" />
      </Button>
      <h2>Giveth TRACE has been deprecated</h2>
      <div>Go to giveth.io to explore public goods projects</div>
      <div className="arc-purple" />
      <div className="arc-gray" />
      <div className="arc-yellow" />
      <div className="dot-yellow" />
      <Button>
        <a href={config.givethUrl} rel="noreferrer noopener" target="_blank">
          GO TO GIVETH.IO
        </a>
      </Button>
    </div>
  );
};

export default SplashPage;
