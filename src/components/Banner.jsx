import React from 'react';
// import config from '../configuration';
import gasLogo from '../assets/gas-logo.svg';

const Banner = () => {
  return (
    <div className="row text-white align-items-center p-4 m-0" id="tx-limit-banner">
      <div className="col-1 text-right">
        <img alt="Gas logo" src={gasLogo} />
      </div>
      <div className="col-11 col-md-4 font-weight-bold">
        Giveth pays the gas fees so you don&apos;t have to!
      </div>
      <div className="col-md-6 pt-3 pt-md-0">
        Because of this we are temporarily limiting transactions greater than 200 USD
      </div>
      <div className="col-md-1 p-md-0 pt-3 pt-md-0 text-center">
        <button
          type="button"
          className="btn btn-sm text-white border-white"
          // onClick={() =>
          //   isForeignNetwork ? goMilestoneEditPage() : displayForeignNetRequiredWarning()
          // }
        >
          Got it!
        </button>
      </div>
    </div>
  );
};

export default Banner;
