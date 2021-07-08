import React, { Fragment, useContext, useState, useEffect } from 'react';
import BigNumber from 'bignumber.js';
import PropTypes from 'prop-types';
import { Button, Modal, Select, Form } from 'antd';

import Campaign from 'models/Campaign';
import { checkBalance, authenticateUser } from '../lib/middleware';
import { ZERO_ADDRESS } from '../lib/helpers';
import config from '../configuration';
import ActionNetworkWarning from './ActionNetworkWarning';

import CampaignService from '../services/CampaignService';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { Context as WhiteListContext } from '../contextProviders/WhiteListProvider';
import { Context as UserContext } from '../contextProviders/UserProvider';

BigNumber.config({ DECIMAL_PLACES: 18 });

const noCoownerOption = {
  value: ZERO_ADDRESS,
  title: '------ No co-owner ------',
};

/**
 * Retrieves the oldest 100 donations that the user can delegate
 *
 * @prop {Campaign}     campaign    If the delegation is towards campaign, this contains the campaign
 * @prop {Trace}    trace   It the delegation is towards campaign, this contains the trace
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

  const { campaign } = props;

  const [isSaving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [coownerAddress, setCoownerAddress] = useState();
  const [formIsReady, setFormIsReady] = useState(false);

  const openDialog = () => {
    authenticateUser(currentUser, false)
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
      coownerAddress,
      afterCreate,
      afterMined,
    );
  };

  // Set initial value for select component
  useEffect(() => {
    if (campaignManagers.length > 0) {
      if (campaign.coownerAddress !== ZERO_ADDRESS) {
        setCoownerAddress(campaign.coownerAddress);
      }
      setFormIsReady(true);
    }
  }, [campaignManagers]);

  const coownerList = [
    noCoownerOption,
    ...campaignManagers.filter(item => item.value !== campaign.ownerAddress),
  ];

  return (
    <Fragment>
      <Button type="primary" block danger onClick={() => openDialog()}>
        Change co-owner
      </Button>
      <Modal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
        centered
        className="pb-0"
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
          <Form onFinish={submit}>
            <p>
              Changing ownership for<strong> {campaign.title}</strong>
            </p>
            <div className="label mb-2">Select a new co-owner:</div>
            {formIsReady && (
              <Fragment>
                <Select
                  name="coownerAddress"
                  placeholder="------ Select a co-owner ------"
                  value={coownerAddress}
                  onChange={setCoownerAddress}
                  style={{ width: '100%' }}
                  className="mr-3 mb-3"
                  defaultValue={coownerAddress}
                >
                  {coownerList.map(item => (
                    <Select.Option value={item.value} key={item.value}>
                      {item.title}
                    </Select.Option>
                  ))}
                </Select>
                <p>This person or smart contract will be co-owning your Campaign from now on.</p>
              </Fragment>
            )}
            <Button
              type="primary"
              size="large"
              disabled={isSaving || !isForeignNetwork || !coownerAddress}
              onClick={submit}
            >
              {isSaving ? 'Changing...' : 'Change ownership'}
            </Button>
          </Form>
        )}
      </Modal>
    </Fragment>
  );
};

ChangeOwnershipButton.propTypes = {
  campaign: PropTypes.instanceOf(Campaign).isRequired,
};

export default React.memo(ChangeOwnershipButton);
