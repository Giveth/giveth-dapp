// eslint-disable-next-line max-classes-per-file
import React, { Fragment, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import { withRouter } from 'react-router';
import { Button, Modal } from 'antd';

import { Context as Web3Context } from '../contextProviders/Web3Provider';
import DonateButtonModal from './DonateButtonModal';

const modalStyles = {
  minWidth: '60%',
  maxWidth: '800px',
};

const DonateButton = props => {
  const { autoPopup, className, match, size, style } = props;

  const {
    state: { isEnabled },
    actions: { enableProvider },
  } = useContext(Web3Context);

  const [modalVisible, setModalVisible] = useState(false);

  const doDonate = () => {
    if (!isEnabled) {
      enableProvider();
    }
    setModalVisible(true);
  };

  useEffect(() => {
    setTimeout(() => {
      if (autoPopup && match && typeof match.url === 'string' && match.url.endsWith('/donate')) {
        doDonate();
      }
    }, 1000);
  }, []);

  return (
    <Fragment>
      <Button
        type="donate"
        block
        onClick={doDonate}
        className={className}
        size={size}
        style={style}
      >
        Donate
      </Button>
      <Modal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        centered
        destroyOnClose
        className="pb-0"
        style={modalStyles}
      >
        <DonateButtonModal {...props} setModalVisible={setModalVisible} />
      </Modal>
    </Fragment>
  );
};

const modelTypes = PropTypes.shape({
  type: PropTypes.string.isRequired,
  adminId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  id: PropTypes.string.isRequired,
  communityId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  title: PropTypes.string.isRequired,
  campaignId: PropTypes.string,
  token: PropTypes.shape({}),
  acceptsSingleToken: PropTypes.bool,
  ownerAddress: PropTypes.string,
  customThanksMessage: PropTypes.string,
});

DonateButton.propTypes = {
  model: modelTypes.isRequired,
  maxDonationAmount: PropTypes.instanceOf(BigNumber),
  match: PropTypes.shape({
    path: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
  }),
  autoPopup: PropTypes.bool,
  className: PropTypes.string,
  size: PropTypes.oneOf(['large', 'middle', 'small']),
  style: PropTypes.shape(),
};

DonateButton.defaultProps = {
  maxDonationAmount: undefined, // new BigNumber(10000000000000000),
  match: undefined,
  autoPopup: false,
  className: '',
  size: 'middle',
  style: {},
};

const DonateButtonWithRouter = withRouter(React.memo(DonateButton));

const Root = props => {
  const { model } = props;
  const { customThanksMessage } = model;

  return <DonateButtonWithRouter customThanksMessage={customThanksMessage} {...props} />;
};

Root.propTypes = {
  model: modelTypes.isRequired,
  autoPopup: PropTypes.bool,
  className: PropTypes.string,
};

Root.defaultProps = {
  autoPopup: false,
  className: '',
};

export default React.memo(Root);
