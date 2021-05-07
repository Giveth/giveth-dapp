import React, { Fragment, useContext, useState, useRef } from 'react';
import Modal from 'react-modal';
import BigNumber from 'bignumber.js';
import { Form } from 'formsy-react-components';
import PropTypes from 'prop-types';
import 'react-rangeslider/lib/index.css';

import Campaign from 'models/Campaign';
import Milestone from 'models/Milestone';
import { Button } from 'antd';
import { ZERO_ADDRESS } from '../lib/helpers';
import { isLoggedIn, checkBalance } from '../lib/middleware';
import config from '../configuration';
import SelectFormsy from './SelectFormsy';
import ActionNetworkWarning from './ActionNetworkWarning';

import CampaignService from '../services/CampaignService';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { Context as WhiteListContext } from '../contextProviders/WhiteListProvider';
import { Context as UserContext } from '../contextProviders/UserProvider';
import BridgedMilestone from '../models/BridgedMilestone';
import LPPCappedMilestone from '../models/LPPCappedMilestone';
import LPMilestone from '../models/LPMilestone';

BigNumber.config({ DECIMAL_PLACES: 18 });
Modal.setAppElement('#root');

const modalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-20%',
    transform: 'translate(-50%, -50%)',
    boxShadow: '0 0 40px #ccc',
    overflowY: 'scroll',
  },
};

/**
 * Retrieves the oldest 100 donations that the user can delegate
 *
 * @prop {Campaign}     campaign    If the delegation is towards campaign, this contains the campaign
 * @prop {Milestone}    milestone   It the delegation is towards campaign, this contains the milestone
 * @prop {Object}       style       Styles added to the button
 */
const ChangeOwnershipButton = props => {
  const {
    state: { balance, isForeignNetwork, validProvider },
  } = useContext(Web3Context);
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { campaignManagers },
  } = useContext(WhiteListContext);

  const [isSaving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const { campaign, milestone } = props;

  const form = useRef();

  const openDialog = () => {
    isLoggedIn(currentUser)
      .then(() => checkBalance(balance))
      .then(() => setModalVisible(true));
  };

  const submit = () => {
    setSaving(true);

    const afterCreate = async () => {
      const msg = <p>The owner has been updated!</p>;
      React.toast.success(msg);
      setSaving(false);
      setModalVisible(false);
    };

    const afterMined = () => {
      // const msg = <p>The owner has been updated!</p>;
      // React.toast.success(msg);
    };

    CampaignService.changeOwnership(
      campaign,
      currentUser.address,
      campaign.ownerAddress,
      campaign.coownerAddress,
      afterCreate,
      afterMined,
    );
  };

  return (
    <Fragment>
      <Button type="primary" block style={props.style} danger onClick={() => openDialog()}>
        Change co-owner
      </Button>
      <Modal
        isOpen={modalVisible}
        style={modalStyles}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        {!validProvider && (
          <div className="alert alert-warning">
            <i className="fa fa-exclamation-triangle" />
            You should install <a href="https://metamask.io/">MetaMask</a> to take action.
          </div>
        )}
        {validProvider && (
          <ActionNetworkWarning
            incorrectNetwork={!isForeignNetwork}
            networkName={config.foreignNetworkName}
          />
        )}
        {isForeignNetwork && (
          <Fragment>
            <p>
              Changing ownership for
              {!milestone && <strong> {campaign.title}</strong>}
              {milestone && <strong> {milestone.title}</strong>}
            </p>
            <Form
              onSubmit={submit}
              layout="vertical"
              ref={form}
              mapping={inputs => {
                campaign.coownerAddress = inputs.coownerAddress || ZERO_ADDRESS;
              }}
            >
              <div>
                <SelectFormsy
                  name="coownerAddress"
                  id="co-owner-select"
                  label="Select a new co-owner"
                  helpText="This person or smart contract will be co-owning your Campaign from now on."
                  value={campaign.coownerAddress}
                  cta="------ Select a co-owner ------"
                  options={campaignManagers}
                  validations="isEtherAddress"
                  validationErrors={{
                    isEtherAddress: 'Please select a co-owner.',
                  }}
                  required
                />
                <button
                  className="btn btn-success"
                  formNoValidate
                  type="submit"
                  disabled={isSaving || !isForeignNetwork}
                >
                  {isSaving ? 'Changing...' : 'Change ownership'}
                </button>
                <button
                  className="btn btn-light float-right"
                  type="button"
                  onClick={() => {
                    setModalVisible(false);
                  }}
                >
                  Close
                </button>
              </div>
            </Form>
          </Fragment>
        )}
      </Modal>
    </Fragment>
  );
};

ChangeOwnershipButton.propTypes = {
  campaign: PropTypes.instanceOf(Campaign),
  milestone: PropTypes.oneOfType(
    [Milestone, BridgedMilestone, LPPCappedMilestone, LPMilestone].map(PropTypes.instanceOf),
  ),
  style: PropTypes.shape(),
};

ChangeOwnershipButton.defaultProps = {
  campaign: undefined,
  milestone: undefined,
  style: {},
};

export default React.memo(ChangeOwnershipButton);
