// eslint-disable-next-line max-classes-per-file
import React, { forwardRef, Fragment, useCallback, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-modal';
import BigNumber from 'bignumber.js';
import { withRouter } from 'react-router';
import { Button } from 'antd';

import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { checkProfileAfterDonation } from '../lib/middleware';
import { Context as UserContext } from '../contextProviders/UserProvider';
import DonateButtonModal from './DonateButtonModal';

const modalStyles = {
  content: {
    top: '50%',
    left: '50%',
    minWidth: '40%',
    maxWidth: '80%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-20%',
    transform: 'translate(-50%, -50%)',
    boxShadow: '0 0 40px #ccc',
    overflowY: 'auto',
    maxHeight: '64%',
  },
};

Modal.setAppElement('#root');

const DonateButton = forwardRef((props, ref) => {
  const { model, autoPopup, className, match, size, style } = props;

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
        ref={ref}
        className={className}
        size={size}
        style={style}
      >
        Donate
      </Button>
      <Modal
        isOpen={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        shouldCloseOnOverlayClick={false}
        contentLabel={`Support this ${model.type}!`}
        style={modalStyles}
      >
        <DonateButtonModal {...props} setModalVisible={setModalVisible} />
      </Modal>
    </Fragment>
  );
});

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
  const {
    state: { currentUser },
  } = useContext(UserContext);

  const afterSuccessfulDonate = () => {
    if (currentUser && !currentUser.name) {
      //  Thanks for anon user (without profile) Register Suggestion
      checkProfileAfterDonation(currentUser);
    }
  };
  const afterSuccessfulDonateMemorized = useCallback(afterSuccessfulDonate, [currentUser]);

  return (
    <DonateButtonWithRouter afterSuccessfulDonate={afterSuccessfulDonateMemorized} {...props} />
  );
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
