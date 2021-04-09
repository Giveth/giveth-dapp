import React, { useContext, useEffect, useState } from 'react';
import gasLogo from '../../../assets/gas-logo.svg';
import { Context as WhiteListContext } from '../../../contextProviders/WhiteListProvider';

const Banner = () => {
  const {
    state: { minimumPayoutUsdValue },
  } = useContext(WhiteListContext);
  const [gotTxLimit, setGotTxLimit] = useState(false);
  const setNotify = () => {
    setGotTxLimit(true);
    localStorage.setItem('gotTxLimit', 'true');
  };
  useEffect(() => {
    const NotifyState = localStorage.getItem('gotTxLimit') === 'true';
    setGotTxLimit(NotifyState);
  });

  return (
    <div
      className={`row text-white align-items-center p-4 m-0 ${gotTxLimit ? 'd-none' : ''}`}
      id="tx-limit-banner"
    >
      <div className="col-1 text-right">
        <img alt="Gas logo" src={gasLogo} />
      </div>
      <div className="col-11 col-md-4 font-weight-bold">
        Giveth pays the gas fees so you don&apos;t have to!
      </div>
      <div className="col-md-6 pt-3 pt-md-0">
        Because of this we are temporarily limiting transactions to those greater than{' '}
        {minimumPayoutUsdValue} USD
      </div>
      <div className="col-md-1 p-md-0 pt-3 pt-md-0 text-center">
        <button type="button" className="btn btn-sm text-white border-white" onClick={setNotify}>
          Got it!
        </button>
      </div>
      <div>
        <img alt="Gas logo shadow" src={gasLogo} />
      </div>
    </div>
  );
};

export default Banner;
