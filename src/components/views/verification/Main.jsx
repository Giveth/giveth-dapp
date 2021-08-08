import React, { useState } from 'react';

import Header from './Header';
import ConnectWallet from './ConnectWallet';
import ConfirmProfile from './ConfirmProfile';
import ConfirmProject from './ConfirmProject';
import Congratulations from './Congratulations';

const Verification = () => {
  const [step, setStep] = useState(1);

  const handleNextStep = () => setStep(step + 1);

  const title = step !== 4 ? 'Make your project traceable...' : 'Congratulations!';

  return (
    <div id="verification" className="text-center mx-sm-5 mx-2 py-4">
      <Header />
      <h1 className="mb-3 mt-4 text-break">{title}</h1>
      {step === 4 && <p className="verification-subtitle">Your project is now traceable.</p>}
      <div className="d-flex justify-content-center flex-wrap verification-card mx-auto mt-5">
        {step !== 4 && (
          <div className="verification-steps d-flex justify-content-center w-100">
            <div className="verification-steps-active">Connect your Wallet</div>
            <div className={step > 1 ? 'verification-steps-active' : ''}>Confirm your profile</div>
            <div className={step > 2 ? 'verification-steps-active' : ''}>Confirm your project</div>
          </div>
        )}
        <div className="verification-body">
          {step === 1 && <ConnectWallet handleNextStep={handleNextStep} />}
          {step === 2 && <ConfirmProfile handleNextStep={handleNextStep} />}
          {step === 3 && <ConfirmProject handleNextStep={handleNextStep} />}
          {step === 4 && <Congratulations handleNextStep={handleNextStep} />}
        </div>
      </div>
      <div className="verification-arcs">
        <div />
        <div />
      </div>
    </div>
  );
};

export default Verification;
