import React from 'react';
import { Button } from 'antd';

const ExchangeButton = () => {
  const onClicked = () => {
    const url = 'https://1inch.exchange/#/r/0x8f951903C9360345B4e1b536c7F5ae8f88A64e79';
    window.open(url, '_blank');
  };

  const style = {
    color: '#3F91E4',
    borderColor: '#3F91E4',
  };

  return (
    <Button block ghost style={style} className="rounded" size="large" onClick={onClicked}>
      Buy/Exchange Crypto
    </Button>
  );
};

export default ExchangeButton;
