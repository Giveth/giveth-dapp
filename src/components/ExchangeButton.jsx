import React from 'react';

const ExchangeButton = () => {
  const style = { display: 'inline-block' };

  const onClicked = () => {
    const url = 'https://1inch.exchange/#/r/0x8f951903C9360345B4e1b536c7F5ae8f88A64e79';
    window.open(url, '_blank');
  };

  return (
    <span style={style}>
      <button type="button" onClick={onClicked} className="btn btn-info">
        <i className="fa fa-exchange" />
        Buy/Exchange Crypto
      </button>
    </span>
  );
};

export default ExchangeButton;
