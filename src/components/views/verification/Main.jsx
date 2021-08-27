import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import Header from './Header';
import ConnectWallet from './ConnectWallet';
import ConfirmProfile from './ConfirmProfile';
import ConfirmProject from './ConfirmProject';
import Congratulations from './Congratulations';
import GIVIcon from '../../../assets/GIV-icon-Text.svg';
import GIVIconFill from '../../../assets/GIV-icon-Text-fill.svg';
import { feathersClient } from '../../../lib/feathersClient';
import { Context as UserContext } from '../../../contextProviders/UserProvider';
import ErrorHandler from '../../../lib/ErrorHandler';
import config from '../../../configuration';
import { authenticateUser, checkBalance, checkForeignNetwork } from '../../../lib/middleware';
import { Context as Web3Context } from '../../../contextProviders/Web3Provider';
import Campaign from '../../../models/Campaign';
import User from '../../../models/User';

const Verification = props => {
  const {
    state: { web3, isForeignNetwork, balance },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);
  const {
    state: { currentUser },
  } = useContext(UserContext);

  const { slug: projectSlug } = props.match.params;

  const balanceNum = balance && balance.toNumber();
  const isBalance = !!balanceNum;
  const userAddress = currentUser.address;

  const [step, setStep] = useState(1);
  const [project, setProject] = useState({});
  const [campaignSlug, setCampaignSlug] = useState({});
  const [formIsValid, setFormIsValid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const reportIssue = () => {
    const body = `Issue type: User and Project Verification \nMy address: ${userAddress} \nGiveth.io Slug: ${projectSlug} \n`;
    window.open(`${config.githubUrl}/issues/new?body=${encodeURIComponent(body)}`);
  };

  const submitProfile = () => {
    const { email, url, avatar, name } = project.owner;

    const onUserError = () => setIsSaving(false);

    const afterUserSave = () => {
      setIsSaving(false);
      setStep(step + 1);
    };

    if (!name) return;
    if (currentUser.giverId) setStep(step + 1);
    else {
      const user = new User(currentUser);
      user.name = name;
      user.avatar = avatar || '';
      user.newAvatar = avatar || '';
      user.email = email || '';
      user.linkedin = url || '';

      setIsSaving(true);

      user.save(true, web3, afterUserSave, () => {}, onUserError);
    }
  };

  const confirmProject = (txHash, profileHash) => {
    feathersClient
      .service('verifiedCampaigns')
      .create({
        slug: projectSlug,
        txHash,
        url: profileHash,
      })
      .then(_campaign => {
        setCampaignSlug(_campaign.slug);
        setStep(step + 1);
      })
      .catch(err => {
        if (err.message) ErrorHandler(err, err.message);
        else ErrorHandler(err, 'Something went wrong!');
      })
      .finally(() => setIsSaving(false));
  };

  const createCampaignOnNetwork = () => {
    setIsSaving(true);
    const campaign = new Campaign({
      owner: currentUser,
      ownerAddress: userAddress,
      title: project.title,
      image: project.image,
      description: project.description,
      reviewerAddress: project.reviewerAddress,
    });

    const afterCreate = ({ err, txHash, profileHash }) => {
      if (!err) confirmProject(txHash, profileHash);
      else setIsSaving(false);
    };

    campaign.save(web3, afterCreate, true);
  };

  const fetchProject = () => {
    feathersClient
      .service('verifiedCampaigns')
      .find({
        query: {
          slug: projectSlug,
          userAddress: userAddress.toLowerCase(),
        },
      })
      .then(_project => {
        setProject(_project);
        setStep(step + 1);
      })
      .catch(err => {
        if (err.message) ErrorHandler(err, err.message);
        else ErrorHandler(err, 'Something went wrong on getting project info!');
      });
  };

  const handleNextStep = () => {
    if (!project.id) fetchProject();
    else if (step === 2) submitProfile();
    else if (step === 3) createCampaignOnNetwork();
    else setStep(step + 1);
  };

  const checkNetwork = () => {
    checkForeignNetwork(isForeignNetwork, displayForeignNetRequiredWarning)
      .then(() =>
        authenticateUser(currentUser, true, web3).then(authenticated => {
          if (!authenticated) return;
          checkBalance(balance)
            .then(() => setFormIsValid(true))
            .catch(err => {
              ErrorHandler(err, 'Something went wrong on getting user balance.');
              setFormIsValid(false);
            });
        }),
      )
      .catch(console.log);
  };

  useEffect(() => {
    if (userAddress && balanceNum !== undefined) {
      checkNetwork();
    }
  }, [userAddress, isForeignNetwork, isBalance]);

  const title = step !== 4 ? 'Make your project traceable...' : 'Congratulations!';

  return (
    <div id="verification" className="text-center py-4">
      <Header />
      <h1 className="mb-3 mt-4 text-break mx-sm-5 mx-2">{title}</h1>
      {step === 4 && <p className="verification-subtitle">Your project is now traceable.</p>}
      <div
        className="w-100 h-100 d-flex justify-content-center align-items-center mt-5"
        style={{ backgroundImage: `url(${GIVIconFill})` }}
      >
        <div className="mx-sm-5 mx-2 d-flex justify-content-center flex-wrap container">
          {step < 3 && (
            <div className="verification-steps d-flex justify-content-center w-100">
              <div className="verification-steps-active">Connect your Wallet</div>
              <div className={step > 1 ? 'verification-steps-active' : ''}>
                Confirm your profile
              </div>
              <div className={step > 2 ? 'verification-steps-active' : ''}>
                Confirm your project
              </div>
            </div>
          )}
          <div className="verification-body" style={{ backgroundImage: `url(${GIVIcon})` }}>
            {step === 1 && <ConnectWallet handleNextStep={handleNextStep} />}
            {step === 2 && (
              <ConfirmProfile
                reportIssue={reportIssue}
                owner={project.owner}
                handleNextStep={handleNextStep}
                formIsValid={formIsValid}
                isSaving={isSaving}
              />
            )}
            {step === 3 && (
              <ConfirmProject
                reportIssue={reportIssue}
                project={project}
                handleNextStep={handleNextStep}
                formIsValid={formIsValid}
                isSaving={isSaving}
              />
            )}
            {step === 4 && <Congratulations project={project} campaignSlug={campaignSlug} />}
          </div>
        </div>
      </div>
      <div className="verification-arcs">
        <div />
        <div className="d-none d-sm-block" />
      </div>
    </div>
  );
};

Verification.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      slug: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

export default Verification;
